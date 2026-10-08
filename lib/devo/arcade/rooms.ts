import { Chess } from 'chess.js'
import type { PoolClient } from 'pg'
import {
  type GameId,
  GAMES,
  MEMORY_PHASES,
  MEMORY_TOTAL_MS,
  memoryDeck,
  memoryPairPoints,
  rng,
  type Side,
} from './games'
import { type BluffState, bluffCall, bluffNew, bluffPass, bluffPlay, bluffScore, bluffTimeout, bluffView } from './bluff'
import { ArcadeError, finishViewFor, getEvent, playerRating, q, recordMatchResult, settleDuel, tx } from './server'

type Player = { id: string; name: string }
type Pair<T> = { a: T; b: T }

const COUNTDOWN_MS = 4000
const ABANDON_MS = 15_000
const WAIT_FRESH_MS = 12_000
const CHESS_MOVE_MS = 30_000
/** Tolerância para a animação do lance e a latência antes de cair o tempo. */
const CHESS_GRACE_MS = 2500

export type MemoryState = {
  phase: number
  claimed: Record<string, Side>
  score: Pair<number>
  pairs: Pair<number>
  combo: Pair<number>
  best: Pair<number>
  misses: Pair<number>
  lastAt: Pair<number>
}

export type ChessState = {
  fen: string
  moves: string[]
  clock: Pair<number>
  turnAt: number
  captures: Pair<number>
  last?: { from: string; to: string; captured?: string; by: Side }
}

export type BombState = {
  round: number
  holder: Side
  explodeAt: number
  phase: 'play' | 'boom'
  boomAt: number
  passAt: number
  wins: Pair<number>
  score: Pair<number>
  passes: Pair<number>
  clutch: Pair<number>
}

type RoomRow = {
  id: string
  game_id: GameId
  mode: 'casual' | 'evento'
  duel_id: string | null
  seed: number
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  a_id: string
  a_name: string
  a_rating: number
  a_seen: Date
  a_live: Record<string, number> | null
  b_id: string | null
  b_name: string | null
  b_rating: number | null
  b_seen: Date | null
  b_live: Record<string, number> | null
  started_at: Date | null
  state: Record<string, unknown>
  result: Record<Side, RoomSideResult> & { winner: Side | null; reason: string } | null
}

type RoomSideResult = Awaited<ReturnType<typeof recordMatchResult>> & { oppScore: number; stats: Record<string, number> }

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a')
const zero = (): Pair<number> => ({ a: 0, b: 0 })
const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

function initialState(gameId: GameId, seed: number, startAt: number): Record<string, unknown> {
  if (gameId === 'memory-rush') {
    const s: MemoryState = { phase: 0, claimed: {}, score: zero(), pairs: zero(), combo: zero(), best: zero(), misses: zero(), lastAt: zero() }
    return s
  }
  if (gameId === 'chess') {
    const s: ChessState = { fen: new Chess().fen(), moves: [], clock: { a: 30_000, b: 30_000 }, turnAt: startAt, captures: zero() }
    return s
  }
  if (gameId === 'bluff') return bluffNew(seed, startAt) as unknown as Record<string, unknown>
  const s: BombState = {
    round: 1,
    holder: bombFirst(seed, 1),
    explodeAt: startAt + bombFuse(seed, 1),
    phase: 'play',
    boomAt: 0,
    passAt: startAt,
    wins: zero(),
    score: zero(),
    passes: zero(),
    clutch: zero(),
  }
  return s
}

function bombFuse(seed: number, round: number) {
  return Math.round((BOMB_FUSE_MIN + rng(seed + round * 131)() * BOMB_FUSE_SPAN) * 1000)
}

function bombFirst(seed: number, round: number): Side {
  return rng(seed + round * 71)() < 0.5 ? 'a' : 'b'
}

export const BOMB_FUSE_MIN = 14
export const BOMB_FUSE_SPAN = 10
export const BOMB_POINTS_TO_WIN = 3
export const BOMB_COUNTDOWN_MS = 3200
export const BOMB_BOOM_MS = 2600
export const BOMB_PASS_COOLDOWN_MS = 900

async function myRating(c: PoolClient, playerId: string) {
  const [r] = await q<{ n: number }>(
    "SELECT count(*)::int AS n FROM arcade_matches WHERE player_id = $1 AND result = 'win' AND mode <> 'treino'",
    [playerId],
    c,
  )
  return playerRating(r?.n ?? 0)
}

function sideOf(room: RoomRow, playerId: string): Side {
  if (room.a_id === playerId) return 'a'
  if (room.b_id === playerId) return 'b'
  throw new ArcadeError('Você não está nesta sala.', 403)
}

async function lockRoom(c: PoolClient, id: string) {
  const [room] = await q<RoomRow>('SELECT * FROM arcade_rooms WHERE id = $1 FOR UPDATE', [id], c)
  if (!room) throw new ArcadeError('Sala não encontrada.', 404)
  return room
}

async function saveState(c: PoolClient, room: RoomRow) {
  await q('UPDATE arcade_rooms SET state = $2, updated_at = now() WHERE id = $1', [room.id, room.state], c)
}

/* ---------- fechamento ---------- */

function sideScores(room: RoomRow): Pair<{ score: number; stats: Record<string, number> }> {
  const meta = GAMES[room.game_id]
  const cap = (n: number) => Math.max(0, Math.min(meta.maxScore, Math.round(n)))
  if (room.game_id === 'memory-rush') {
    const s = room.state as MemoryState
    const pack = (x: Side) => ({ score: cap(s.score[x]), stats: { pairs: s.pairs[x], misses: s.misses[x], bestCombo: s.best[x], oppPairs: s.pairs[other(x)] } })
    return { a: pack('a'), b: pack('b') }
  }
  if (room.game_id === 'chess') {
    const s = room.state as ChessState
    const pack = (x: Side) => ({ score: cap(s.captures[x] * 10 + Math.max(0, s.clock[x]) / 100), stats: { captures: s.captures[x], moves: Math.ceil(s.moves.length / 2) } })
    return { a: pack('a'), b: pack('b') }
  }
  if (room.game_id === 'bluff') {
    const s = room.state as unknown as BluffState
    const pack = (x: Side) => {
      const r = bluffScore(s, x)
      return { score: cap(r.score), stats: r.stats }
    }
    return { a: pack('a'), b: pack('b') }
  }
  const s = room.state as BombState
  const pack = (x: Side) => ({ score: cap(s.score[x]), stats: { passes: s.passes[x], clutch: s.clutch[x], roundsWon: s.wins[x], roundsLost: s.wins[other(x)] } })
  return { a: pack('a'), b: pack('b') }
}

async function finalize(c: PoolClient, room: RoomRow, winner: Side | null, reason: string) {
  if (room.status !== 'active' || !room.b_id || !room.b_name || !room.started_at) return
  const scores = sideScores(room)
  if (winner && room.game_id === 'chess') scores[winner].score = Math.min(GAMES.chess.maxScore, scores[winner].score + 600)
  const out = {} as Record<Side, RoomSideResult>
  for (const s of ['a', 'b'] as Side[]) {
    const res = winner === null ? 'draw' : winner === s ? 'win' : 'loss'
    const r = await recordMatchResult(c, {
      playerId: s === 'a' ? room.a_id : room.b_id,
      gameId: room.game_id,
      mode: room.mode,
      duelId: room.duel_id,
      opponentName: s === 'a' ? room.b_name : room.a_name,
      opponentRating: (s === 'a' ? room.b_rating : room.a_rating) ?? 1000,
      seed: room.seed,
      startedAt: room.started_at,
      result: res,
      score: scores[s].score,
      stats: scores[s].stats,
    })
    out[s] = { ...r, oppScore: scores[other(s)].score, stats: scores[s].stats }
  }
  if (room.duel_id) {
    const champ = winner ?? (scores.a.score >= scores.b.score ? 'a' : 'b')
    await settleDuel(c, room.duel_id, champ === 'a' ? room.a_name : room.b_name)
  }
  room.status = 'finished'
  room.result = { ...out, winner, reason }
  await q("UPDATE arcade_rooms SET status = 'finished', state = $2, result = $3, updated_at = now() WHERE id = $1", [room.id, room.state, room.result], c)
}

/* ---------- relógio do servidor ---------- */

async function tick(c: PoolClient, room: RoomRow, now: number) {
  if (room.status !== 'active' || !room.started_at) return
  const start = room.started_at.getTime()
  if (now < start) return

  const seenA = room.a_seen.getTime()
  const seenB = room.b_seen?.getTime() ?? start
  if (now - Math.max(seenA, start) > ABANDON_MS) return finalize(c, room, 'b', 'abandono')
  if (now - Math.max(seenB, start) > ABANDON_MS) return finalize(c, room, 'a', 'abandono')

  if (room.game_id === 'memory-rush') {
    const s = room.state as MemoryState
    if (now >= start + MEMORY_TOTAL_MS) return finalize(c, room, s.score.a === s.score.b ? null : s.score.a > s.score.b ? 'a' : 'b', 'tempo')
    return
  }
  if (room.game_id === 'chess') {
    const s = room.state as ChessState
    const turn: Side = new Chess(s.fen).turn() === 'w' ? 'a' : 'b'
    if (now - s.turnAt >= s.clock[turn] + CHESS_GRACE_MS) {
      s.clock[turn] = 0
      return finalize(c, room, other(turn), 'tempo')
    }
    return
  }
  if (room.game_id === 'bluff') {
    const s = room.state as unknown as BluffState
    if (!bluffTimeout(s, now)) return
    if (s.winner) return finalize(c, room, s.winner, 'tempo')
    return saveState(c, room)
  }
  const s = room.state as BombState
  if (s.phase === 'play' && now >= s.explodeAt) {
    const winner = other(s.holder)
    s.phase = 'boom'
    s.boomAt = now
    s.wins[winner] += 1
    s.score[winner] += 300
    await saveState(c, room)
    return
  }
  if (s.phase === 'boom' && now >= s.boomAt + BOMB_BOOM_MS) {
    if (s.wins.a >= BOMB_POINTS_TO_WIN || s.wins.b >= BOMB_POINTS_TO_WIN) return finalize(c, room, s.wins.a > s.wins.b ? 'a' : 'b', 'rodadas')
    s.round += 1
    s.holder = bombFirst(room.seed, s.round)
    s.phase = 'play'
    s.passAt = now + BOMB_COUNTDOWN_MS
    s.explodeAt = s.passAt + bombFuse(room.seed, s.round)
    room.a_live = null
    room.b_live = null
    await q('UPDATE arcade_rooms SET state = $2, a_live = NULL, b_live = NULL, updated_at = now() WHERE id = $1', [room.id, room.state], c)
  }
}

/* ---------- ações dos jogos ---------- */

type Action =
  | { type: 'pair'; phase: number; sym: number }
  | { type: 'miss' }
  | { type: 'move'; from: string; to: string; promotion?: string }
  | { type: 'resign' }
  | { type: 'pos'; x: number; y: number; h: number }
  | { type: 'tag' }
  | { type: 'bplay'; ids: number[] }
  | { type: 'bcall' }
  | { type: 'bpass' }

function parseAction(raw: unknown): Action {
  const a = (raw ?? {}) as Record<string, unknown>
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN)
  const sq = (v: unknown) => (typeof v === 'string' && /^[a-h][1-8]$/.test(v) ? v : '')
  switch (a.type) {
    case 'pair':
      return { type: 'pair', phase: num(a.phase), sym: num(a.sym) }
    case 'miss':
      return { type: 'miss' }
    case 'move':
      return { type: 'move', from: sq(a.from), to: sq(a.to), promotion: typeof a.promotion === 'string' && /^[qrbn]$/.test(a.promotion) ? a.promotion : 'q' }
    case 'resign':
      return { type: 'resign' }
    case 'pos':
      return { type: 'pos', x: num(a.x), y: num(a.y), h: num(a.h) }
    case 'tag':
      return { type: 'tag' }
    case 'bplay':
      return {
        type: 'bplay',
        ids: Array.isArray(a.ids) ? a.ids.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < 52).slice(0, 4) : [],
      }
    case 'bcall':
      return { type: 'bcall' }
    case 'bpass':
      return { type: 'bpass' }
    default:
      throw new ArcadeError('Ação inválida.')
  }
}

async function applyAction(c: PoolClient, room: RoomRow, side: Side, action: Action, now: number) {
  if (room.status !== 'active' || !room.started_at || now < room.started_at.getTime()) return
  if (action.type === 'resign') return finalize(c, room, other(side), 'desistência')

  if (room.game_id === 'memory-rush') {
    const s = room.state as MemoryState
    if (now - s.lastAt[side] < 220) return
    s.lastAt[side] = now
    if (action.type === 'miss') {
      s.score[side] -= 50
      s.combo[side] = 0
      s.misses[side] += 1
    } else if (action.type === 'pair') {
      if (action.phase !== s.phase) return
      const key = `${s.phase}:${action.sym}`
      if (s.claimed[key] || !memoryDeck(room.seed, s.phase).some((c) => c.sym === action.sym)) return
      s.claimed[key] = side
      s.combo[side] += 1
      s.best[side] = Math.max(s.best[side], s.combo[side])
      s.pairs[side] += 1
      s.score[side] += memoryPairPoints(s.combo[side])
      const done = Object.keys(s.claimed).filter((k) => k.startsWith(`${s.phase}:`)).length
      if (done >= MEMORY_PHASES[s.phase]) {
        if (s.phase + 1 >= MEMORY_PHASES.length) return finalize(c, room, s.score.a === s.score.b ? null : s.score.a > s.score.b ? 'a' : 'b', 'tabuleiro')
        s.phase += 1
      }
    } else return
    return saveState(c, room)
  }

  if (room.game_id === 'chess') {
    if (action.type !== 'move' || !action.from || !action.to) return
    const s = room.state as ChessState
    const game = new Chess(s.fen)
    const turn: Side = game.turn() === 'w' ? 'a' : 'b'
    if (turn !== side) throw new ArcadeError('Não é a sua vez.')
    const spent = now - s.turnAt
    if (spent >= s.clock[side] + CHESS_GRACE_MS) {
      s.clock[side] = 0
      return finalize(c, room, other(side), 'tempo')
    }
    let mv
    try {
      mv = game.move({ from: action.from, to: action.to, promotion: action.promotion })
    } catch {
      throw new ArcadeError('Lance ilegal.')
    }
    s.clock = { a: CHESS_MOVE_MS, b: CHESS_MOVE_MS }
    s.turnAt = now
    s.fen = game.fen()
    s.moves.push(mv.lan)
    if (mv.captured) s.captures[side] += PIECE_VALUE[mv.captured] ?? 0
    s.last = { from: mv.from, to: mv.to, captured: mv.captured, by: side }
    if (game.isCheckmate()) return finalize(c, room, side, 'xeque-mate')
    if (game.isGameOver()) return finalize(c, room, null, 'empate')
    return saveState(c, room)
  }

  if (room.game_id === 'bluff') {
    const s = room.state as unknown as BluffState
    const ok =
      action.type === 'bplay' ? bluffPlay(s, side, action.ids, now) : action.type === 'bcall' ? bluffCall(s, side, now) : action.type === 'bpass' ? bluffPass(s, side, now) : false
    if (!ok) return
    if (s.winner) return finalize(c, room, s.winner, action.type === 'bcall' ? 'mão vazia' : 'blefe aceito')
    return saveState(c, room)
  }

  const s = room.state as BombState
  if (action.type === 'pos') {
    if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) return
    const len = Math.hypot(action.x, action.y)
    const k = len > 9 ? 9 / len : 1
    const h = Number.isFinite(action.h) ? Math.min(6, Math.max(0, action.h)) : 0
    const live = { x: action.x * k, y: action.y * k, h, t: now }
    if (side === 'a') room.a_live = live
    else room.b_live = live
    await q(`UPDATE arcade_rooms SET ${side}_live = $2, ${side}_seen = now() WHERE id = $1`, [room.id, live], c)
    return
  }
  if (action.type === 'tag') {
    if (s.phase !== 'play' || s.holder !== side || now < s.passAt + BOMB_PASS_COOLDOWN_MS || now >= s.explodeAt || !room.a_live || !room.b_live) return
    // Tolerância maior que o toque visual (1.1) para absorver a latência do polling.
    const d = Math.hypot(room.a_live.x - room.b_live.x, room.a_live.y - room.b_live.y)
    if (d > 2.8) return
    s.holder = other(side)
    s.passAt = now
    s.passes[side] += 1
    s.score[side] += 20
    if (s.explodeAt - now < 2000) {
      s.clutch[side] += 1
      s.score[side] += 100
    }
    return saveState(c, room)
  }
}

/* ---------- visão para o cliente ---------- */

function view(room: RoomRow, side: Side, now: number) {
  const opp = other(side)
  return {
    id: room.id,
    status: room.status,
    gameId: room.game_id,
    mode: room.mode,
    seed: room.seed,
    side,
    me: side === 'a' ? { name: room.a_name, rating: room.a_rating } : { name: room.b_name ?? '', rating: room.b_rating ?? 1000 },
    opponent: room.b_id ? (opp === 'a' ? { name: room.a_name, rating: room.a_rating } : { name: room.b_name ?? '', rating: room.b_rating ?? 1000 }) : null,
    startedAt: room.started_at?.getTime() ?? null,
    serverNow: now,
    // No Blefe o estado bruto tem a mão adversária: só a visão filtrada sai do servidor.
    state: room.game_id === 'bluff' && (room.state as { hands?: unknown })?.hands ? (bluffView(room.state as unknown as BluffState, side) as unknown as Record<string, unknown>) : room.state,
    oppLive: opp === 'a' ? room.a_live : room.b_live,
    result: room.result
      ? { winner: room.result.winner, reason: room.result.reason, mine: room.result[side], oppScore: room.result[side]?.oppScore ?? 0 }
      : null,
  }
}

export type RoomView = ReturnType<typeof view>

/* ---------- API ---------- */

async function lockQueue(c: PoolClient, gameId: GameId) {
  await q('SELECT pg_advisory_xact_lock(hashtext($1))', [`arcade-queue:${gameId}`], c)
}

async function findOpponentRoom(c: PoolClient, gameId: GameId, playerId: string) {
  const [open] = await q<RoomRow>(
    `SELECT * FROM arcade_rooms WHERE status = 'waiting' AND mode = 'casual' AND game_id = $1 AND a_id <> $2
     AND a_seen > now() - ($3::int * interval '1 millisecond') ORDER BY created_at LIMIT 1 FOR UPDATE`,
    [gameId, playerId, WAIT_FRESH_MS],
    c,
  )
  return open ?? null
}

async function matchWaitingRoom(player: Player, roomId: string) {
  const [peek] = await q<RoomRow>('SELECT game_id, status, mode, a_id FROM arcade_rooms WHERE id = $1', [roomId])
  if (!peek || peek.status !== 'waiting' || peek.mode !== 'casual' || peek.a_id !== player.id) return null
  return tx(async (c) => {
    await lockQueue(c, peek.game_id)
    const mine = await lockRoom(c, roomId)
    if (mine.status !== 'waiting') return null
    await q('UPDATE arcade_rooms SET a_seen = now() WHERE id = $1', [mine.id], c)
    const open = await findOpponentRoom(c, mine.game_id, player.id)
    if (!open) return null
    await q("UPDATE arcade_rooms SET status = 'cancelled' WHERE id = $1", [mine.id], c)
    return joinRoom(c, open, player, await myRating(c, player.id))
  })
}

export async function queueCasual(player: Player, gameId: GameId) {
  return tx(async (c) => {
    await lockQueue(c, gameId)
    const [mine] = await q<RoomRow>(
      "SELECT * FROM arcade_rooms WHERE (a_id = $1 OR b_id = $1) AND status IN ('waiting','active') AND mode = 'casual' ORDER BY created_at DESC LIMIT 1",
      [player.id],
      c,
    )
    if (mine?.status === 'active') return view(mine, sideOf(mine, player.id), Date.now())
    if (mine) await q("UPDATE arcade_rooms SET status = 'cancelled' WHERE id = $1", [mine.id], c)
    await q(
      "UPDATE arcade_rooms SET status = 'cancelled' WHERE status = 'waiting' AND mode = 'casual' AND a_seen < now() - interval '2 minutes'",
      [],
      c,
    )

    const rating = await myRating(c, player.id)
    const open = await findOpponentRoom(c, gameId, player.id)
    if (open) return joinRoom(c, open, player, rating)
    const seed = Math.floor(Math.random() * 2 ** 31)
    const [room] = await q<RoomRow>(
      'INSERT INTO arcade_rooms (game_id, mode, seed, a_id, a_name, a_rating) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [gameId, 'casual', seed, player.id, player.name, rating],
      c,
    )
    return view(room, 'a', Date.now())
  })
}

async function joinRoom(c: PoolClient, room: RoomRow, player: Player, rating: number) {
  const startAt = Date.now() + COUNTDOWN_MS
  const state = initialState(room.game_id, room.seed, startAt)
  const [joined] = await q<RoomRow>(
    `UPDATE arcade_rooms SET status = 'active', b_id = $2, b_name = $3, b_rating = $4, b_seen = now(),
     started_at = to_timestamp($5::double precision / 1000), state = $6, updated_at = now() WHERE id = $1 RETURNING *`,
    [room.id, player.id, player.name, rating, startAt, state],
    c,
  )
  return view(joined, 'b', Date.now())
}

export async function joinDuel(player: Player, eventId: string) {
  const data = await getEvent(player, eventId)
  if (data.event.status !== 'LIVE') throw new ArcadeError('A partida ainda não está ao vivo.')
  const duel = data.myDuel
  if (!duel) throw new ArcadeError('Você não está nessa chave.')
  if (duel.winner) throw new ArcadeError('Seu confronto já foi decidido.')
  return tx(async (c) => {
    const rating = await myRating(c, player.id)
    await q(
      `INSERT INTO arcade_rooms (game_id, mode, duel_id, seed, a_id, a_name, a_rating)
       VALUES ($1,'evento',$2,$3,$4,$5,$6) ON CONFLICT (duel_id) DO NOTHING`,
      [data.event.gameId, duel.id, Math.floor(Math.random() * 2 ** 31), player.id, player.name, rating],
      c,
    )
    const [room] = await q<RoomRow>('SELECT * FROM arcade_rooms WHERE duel_id = $1 FOR UPDATE', [duel.id], c)
    if (room.status === 'finished' || room.status === 'cancelled') throw new ArcadeError('Seu confronto já foi decidido.')
    if (room.a_id === player.id || room.b_id === player.id) {
      await q(`UPDATE arcade_rooms SET ${room.a_id === player.id ? 'a' : 'b'}_seen = now() WHERE id = $1`, [room.id], c)
      return view(room, sideOf(room, player.id), Date.now())
    }
    return joinRoom(c, room, player, rating)
  })
}

export async function pollRoom(player: Player, roomId: string, rawAction?: unknown) {
  const action = rawAction ? parseAction(rawAction) : null
  const matched = await matchWaitingRoom(player, roomId)
  if (matched) return { ...matched, finish: null }
  const out = await tx(async (c) => {
    const room = await lockRoom(c, roomId)
    const side = sideOf(room, player.id)
    const now = Date.now()
    if (side === 'a') room.a_seen = new Date(now)
    else room.b_seen = new Date(now)
    if (action?.type !== 'pos') await q(`UPDATE arcade_rooms SET ${side}_seen = now() WHERE id = $1`, [room.id], c)
    await tick(c, room, now)
    if (action) await applyAction(c, room, side, action, now)
    return { room, side, now }
  })
  return withFinish(player, out.room, out.side, out.now)
}

export async function leaveRoom(player: Player, roomId: string) {
  const out = await tx(async (c) => {
    const room = await lockRoom(c, roomId)
    const side = sideOf(room, player.id)
    if (room.status === 'waiting') {
      if (room.mode === 'casual') await q("UPDATE arcade_rooms SET status = 'cancelled' WHERE id = $1", [room.id], c)
      room.status = room.mode === 'casual' ? 'cancelled' : room.status
    } else if (room.status === 'active') {
      await finalize(c, room, other(side), 'desistência')
    }
    return { room, side, now: Date.now() }
  })
  return withFinish(player, out.room, out.side, out.now)
}

async function withFinish(player: Player, room: RoomRow, side: Side, now: number) {
  const v = view(room, side, now)
  if (room.status !== 'finished' || !room.result) return { ...v, finish: null }
  const mine = room.result[side]
  const finish = await finishViewFor(player, {
    awarded: mine.awarded,
    score: mine.score,
    result: mine.result,
    timeGainMin: mine.timeGainMin,
    reward: mine.reward,
  })
  return { ...v, finish }
}

export type RoomPoll = Awaited<ReturnType<typeof pollRoom>>
