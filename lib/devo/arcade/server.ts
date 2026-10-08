import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { REACTION_IDS } from './reactions'
import {
  type EventStatus,
  type GameId,
  GAMES,
  hashString,
  isGameId,
  type MatchStart,
  rankReward,
  rankingPoints,
  type Reward,
  rng,
} from './games'

/** O DEVO roda no horário de Brasília (UTC-3, sem horário de verão). */
const TZ_OFFSET_MS = -3 * 3600 * 1000
const DAY = 86400 * 1000
const WEEK = 7 * DAY

export function weekStartMs(now = Date.now()) {
  const local = new Date(now + TZ_OFFSET_MS)
  const back = (local.getUTCDay() + 6) % 7
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - back) - TZ_OFFSET_MS
}

export function weekKey(startMs: number) {
  return new Date(startMs + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

const BOT_NAMES = [
  'Corvo', 'Lince', 'Vesper', 'Nox', 'Kairo', 'Selene', 'Dante', 'Mirai', 'Ícaro', 'Lótus',
  'Ravena', 'Tico', 'Sombra', 'Juno', 'Orfeu', 'Lyra', 'Vex', 'Nina', 'Caos', 'Hex',
  'Atlas', 'Ivy', 'Bruma', 'Zero', 'Ônix', 'Pietra', 'Rook', 'Kael', 'Maré', 'Fênix',
]

function botName(i: number) {
  return `${BOT_NAMES[i % BOT_NAMES.length]}_${String((i * 37 + 11) % 97).padStart(2, '0')}`
}

/** Nomes fictícios usados apenas no chat do tutorial. */
const TUTORIAL_BOTS = BOT_NAMES.map((_, i) => botName(i))

export type { MatchStart }

export const TUTORIAL_OPPONENT = 'Javali (tutorial)'
const BYE_NAME = 'Sem oponente'

type Row = Record<string, unknown>

export async function q<T = Row>(text: string, params: unknown[] = [], client?: PoolClient): Promise<T[]> {
  const res = await (client ?? pool).query(text, params)
  return res.rows as T[]
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const out = await fn(c)
    await c.query('COMMIT')
    return out
  } catch (err) {
    await c.query('ROLLBACK')
    throw err
  } finally {
    c.release()
  }
}

export class ArcadeError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

type EventRow = {
  id: string
  number: number
  game_id: GameId
  label: string | null
  starts_at: Date
  registration_opens_at: Date
  registration_closes_at: Date
  ends_at: Date
  max_players: number
  reward: Reward
  rules: string | null
  cancelled: boolean
  locked_at: Date | null
  resolved_at: Date | null
}

export function eventStatus(e: EventRow, now = Date.now()): EventStatus {
  if (e.cancelled) return 'CANCELLED'
  if (now < e.registration_opens_at.getTime()) return 'UPCOMING'
  if (now < e.registration_closes_at.getTime()) return 'REGISTRATION'
  if (now < e.starts_at.getTime()) return 'LOCKED'
  if (now < e.ends_at.getTime()) return 'LIVE'
  return 'FINISHED'
}

let ensuredWeek = 0

async function ensureWeekEvents(week: number) {
  if (ensuredWeek === week) return
  const schedule = await q<{
    id: number
    weekday: number
    game_id: string
    label: string | null
    start_time: string
    duration_min: number
    registration_close_min: number
    max_players: number
    reward: Reward
    rules: string | null
  }>('SELECT * FROM arcade_schedule WHERE active')
  for (const s of schedule) {
    if (!isGameId(s.game_id)) continue
    const [hh, mm] = s.start_time.split(':').map(Number)
    const day = (s.weekday + 6) % 7
    const starts = week + day * DAY + ((hh || 0) * 60 + (mm || 0)) * 60 * 1000
    await q(
      `INSERT INTO arcade_events (schedule_id, game_id, label, starts_at, registration_opens_at, registration_closes_at, ends_at, max_players, reward, rules)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (schedule_id, starts_at) DO NOTHING`,
      [
        s.id,
        s.game_id,
        s.label,
        new Date(starts),
        new Date(starts - DAY),
        new Date(starts - s.registration_close_min * 60 * 1000),
        new Date(starts + s.duration_min * 60 * 1000),
        Math.max(2, s.max_players - (s.max_players % 2)),
        s.reward,
        s.rules,
      ],
    )
  }
  ensuredWeek = week
}

/** Fecha a lista e monta os confrontos só entre jogadores reais. Quem sobra sem par avança direto. Idempotente. */
async function lockEvent(e: EventRow) {
  await tx(async (c) => {
    const [claimed] = await q('UPDATE arcade_events SET locked_at = now() WHERE id = $1 AND locked_at IS NULL RETURNING id', [e.id], c)
    if (!claimed) return
    const entries = await q<{ name: string; rating: number }>('SELECT name, rating FROM arcade_entries WHERE event_id = $1 AND NOT is_bot', [e.id], c)
    const rand = rng(hashString(e.id))
    const order = [...entries].sort(() => rand() - 0.5)
    for (let i = 0; i < order.length; i += 2) {
      const a = order[i]
      const b = order[i + 1]
      if (!b) {
        await q(
          'INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating, winner_name, resolved_at) VALUES ($1,$2,$3,$4,$5,0,$3,now())',
          [e.id, i / 2 + 1, a.name, BYE_NAME, a.rating],
          c,
        )
        continue
      }
      await q('INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating) VALUES ($1,$2,$3,$4,$5,$6)', [
        e.id,
        i / 2 + 1,
        a.name,
        b.name,
        a.rating,
        b.rating,
      ], c)
    }
  })
}

function winProbability(a: number, b: number) {
  return 1 / (1 + 10 ** ((b - a) / 400))
}

export async function settleDuel(c: PoolClient, duelId: string, winner: string) {
  const [d] = await q('UPDATE arcade_duels SET winner_name = $2, resolved_at = now() WHERE id = $1 AND winner_name IS NULL RETURNING id', [duelId, winner], c)
  if (!d) return
  const payouts = await q<{ player_id: string; payout: number }>(
    `UPDATE arcade_bets SET status = CASE WHEN pick_name = $2 THEN 'won' ELSE 'lost' END,
       payout = CASE WHEN pick_name = $2 THEN floor(amount * odds)::int ELSE 0 END
     WHERE duel_id = $1 AND status = 'open' RETURNING player_id, payout`,
    [duelId, winner],
    c,
  )
  for (const p of payouts) {
    if (p.payout > 0) await creditTime(c, p.player_id, p.payout * MINUTE)
  }
}

type DuelRow = {
  id: string
  event_id: string
  slot: number
  a_name: string
  b_name: string
  a_rating: number
  b_rating: number
  winner_name: string | null
  resolved_at: Date | null
}

/**
 * Os confrontos são decididos jogando de verdade numa sala. Ao fim da janela ao vivo, quem apareceu e
 * esperou vence por W.O.; se ninguém apareceu, decide o rating. Salas ainda em jogo terminam sozinhas.
 */
async function progressEvent(e: EventRow, now: number) {
  const status = eventStatus(e, now)
  if (status === 'UPCOMING' || status === 'REGISTRATION' || status === 'CANCELLED') return
  if (!e.locked_at) await lockEvent(e)
  if (status !== 'FINISHED' || e.resolved_at) return
  const duels = await q<DuelRow>('SELECT * FROM arcade_duels WHERE event_id = $1 AND winner_name IS NULL ORDER BY slot', [e.id])
  await tx(async (c) => {
    let pending = 0
    for (const d of duels) {
      const [room] = await q<{ status: string; a_name: string }>('SELECT status, a_name FROM arcade_rooms WHERE duel_id = $1', [d.id], c)
      if (room?.status === 'active') {
        pending += 1
        continue
      }
      const winner = room?.status === 'waiting' ? room.a_name : d.a_rating >= d.b_rating ? d.a_name : d.b_name
      await settleDuel(c, d.id, winner)
      if (room?.status === 'waiting') await q("UPDATE arcade_rooms SET status = 'cancelled' WHERE duel_id = $1", [d.id], c)
    }
    if (!pending) await q('UPDATE arcade_events SET resolved_at = now() WHERE id = $1', [e.id], c)
  })
}

async function weekEvents(now: number) {
  const week = weekStartMs(now)
  await ensureWeekEvents(week)
  const events = await q<EventRow>(
    'SELECT * FROM arcade_events WHERE starts_at >= $1 AND starts_at < $2 ORDER BY starts_at',
    [new Date(week - DAY), new Date(week + WEEK)],
  )
  for (const e of events) await progressEvent(e, now)
  return q<EventRow>('SELECT * FROM arcade_events WHERE starts_at >= $1 AND starts_at < $2 ORDER BY starts_at', [
    new Date(week),
    new Date(week + WEEK),
  ])
}

async function ensureProfile(playerId: string) {
  await q('INSERT INTO arcade_profiles (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [playerId])
  const [p] = await q<{ chips: number; settings: Record<string, unknown> }>('SELECT chips, settings FROM arcade_profiles WHERE player_id = $1', [playerId])
  return p
}

const MINUTE = 60_000
/** Margem mínima de Tempo que o jogador precisa manter depois de apostar. */
const BET_RESERVE_MS = 30 * MINUTE

/**
 * O Tempo do jogador vive no save do cliente (`timerEndsAt`). Créditos do servidor (apostas pagas,
 * recompensas) ficam num livro-caixa e são entregues ao cliente na próxima resposta, que os aplica.
 */
export async function creditTime(c: PoolClient | undefined, playerId: string, ms: number) {
  if (!ms) return
  await q('INSERT INTO arcade_profiles (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [playerId], c)
  await q('UPDATE arcade_profiles SET time_pending_ms = time_pending_ms + $2 WHERE player_id = $1', [playerId, Math.round(ms)], c)
}

export async function drainTime(playerId: string) {
  const [row] = await q<{ v: string }>(
    `UPDATE arcade_profiles p SET time_pending_ms = 0
     FROM (SELECT player_id, time_pending_ms AS v FROM arcade_profiles WHERE player_id = $1 FOR UPDATE) o
     WHERE p.player_id = o.player_id AND o.v <> 0 RETURNING o.v`,
    [playerId],
  )
  if (!row) return 0
  const ms = Number(row.v)
  if (ms) {
    await q(
      `UPDATE player_saves SET data = jsonb_set(data, '{timerEndsAt}', to_jsonb((data->>'timerEndsAt')::bigint + $2))
       WHERE player_id = $1 AND data ? 'timerEndsAt'`,
      [playerId, ms],
    )
  }
  return ms
}

async function savedTimerEndsAt(playerId: string) {
  const [s] = await q<{ t: string | null }>("SELECT data->>'timerEndsAt' AS t FROM player_saves WHERE player_id = $1", [playerId])
  return s?.t ? Number(s.t) : null
}

type Player = { id: string; name: string }

export type LeaderRow = { rank: number; name: string; score: number; wins: number; isBot: boolean; isMe: boolean }

export async function leaderboard(week: number, _now: number, meId: string) {
  const real = await q<{ player_id: string; name: string; score: number; wins: number }>(
    `SELECT s.player_id, p.name, s.score, s.wins FROM arcade_week_scores s JOIN players p ON p.id = s.player_id
     WHERE s.week_start = $1 AND s.score > 0 AND NOT p.is_test`,
    [weekKey(week)],
  )
  const rows = real.map((r) => ({ name: r.name, score: r.score, wins: r.wins, isBot: false, isMe: r.player_id === meId }))
  rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return rows.map((r, i) => ({ ...r, rank: i + 1 })) as LeaderRow[]
}

export async function myWeek(playerId: string, week: number) {
  const [row] = await q<{ score: number; wins: number; games: number }>(
    'SELECT score, wins, games FROM arcade_week_scores WHERE week_start = $1 AND player_id = $2',
    [weekKey(week), playerId],
  )
  return row ?? { score: 0, wins: 0, games: 0 }
}

export function playerRating(wins: number) {
  return Math.min(1600, 1000 + wins * 20)
}

export type EventView = {
  id: string
  number: number
  gameId: GameId
  label: string | null
  status: EventStatus
  startsAt: number
  registrationOpensAt: number
  registrationClosesAt: number
  endsAt: number
  maxPlayers: number
  entries: number
  joined: boolean
  reward: Reward
  rules: string | null
}

async function eventViews(events: EventRow[], player: Player, now: number): Promise<EventView[]> {
  if (!events.length) return []
  const ids = events.map((e) => e.id)
  const counts = await q<{ event_id: string; n: number; mine: boolean }>(
    `SELECT event_id, count(*)::int AS n, bool_or(player_id = $2) AS mine FROM arcade_entries WHERE event_id = ANY($1) GROUP BY event_id`,
    [ids, player.id],
  )
  const byId = new Map(counts.map((c) => [c.event_id, c]))
  return events.map((e) => ({
    id: e.id,
    number: e.number,
    gameId: e.game_id,
    label: e.label,
    status: eventStatus(e, now),
    startsAt: e.starts_at.getTime(),
    registrationOpensAt: e.registration_opens_at.getTime(),
    registrationClosesAt: e.registration_closes_at.getTime(),
    endsAt: e.ends_at.getTime(),
    maxPlayers: e.max_players,
    entries: byId.get(e.id)?.n ?? 0,
    joined: !!byId.get(e.id)?.mine,
    reward: e.reward,
    rules: e.rules,
  }))
}

/** Mínimo de partidas online na semana para concorrer aos prêmios do ranking. */
export const MIN_WEEK_GAMES = 5

export type GameRankRow = { rank: number; name: string; points: number; today: number; games: number; isMe: boolean }

export type GameRanking = {
  rows: GameRankRow[]
  me: GameRankRow | null
  /** Maior pontuação semanal que o jogador já alcançou neste jogo — define o título permanente. */
  bestWeek: number
}

async function gameRankings(player: Player, week: number, now: number): Promise<Record<GameId, GameRanking>> {
  const local = new Date(now + TZ_OFFSET_MS)
  const dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - TZ_OFFSET_MS
  const [rows, best] = await Promise.all([
    q<{ game_id: GameId; player_id: string; name: string; points: number; today: number; games: number }>(
      `SELECT m.game_id, m.player_id, p.name, sum(m.points)::int AS points,
              coalesce(sum(m.points) FILTER (WHERE m.finished_at >= $2), 0)::int AS today, count(*)::int AS games
       FROM arcade_matches m JOIN players p ON p.id = m.player_id
       WHERE m.finished_at >= $1 AND m.mode <> 'treino' AND NOT p.is_test
       GROUP BY m.game_id, m.player_id, p.name`,
      [new Date(week), new Date(dayStart)],
    ),
    q<{ game_id: GameId; best: number }>(
      `SELECT game_id, max(total)::int AS best FROM (
         SELECT game_id, date_trunc('week', finished_at AT TIME ZONE 'America/Sao_Paulo') AS wk, sum(points) AS total
         FROM arcade_matches WHERE player_id = $1 AND mode <> 'treino' AND finished_at IS NOT NULL GROUP BY 1, 2
       ) t GROUP BY game_id`,
      [player.id],
    ),
  ])
  const out = {} as Record<GameId, GameRanking>
  for (const g of Object.keys(GAMES) as GameId[]) {
    const ranked = rows
      .filter((r) => r.game_id === g && r.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((r, i) => ({ rank: i + 1, name: r.name, points: r.points, today: r.today, games: r.games, isMe: r.player_id === player.id }))
    const me = ranked.find((r) => r.isMe) ?? null
    out[g] = { rows: ranked.slice(0, 10), me, bestWeek: best.find((b) => b.game_id === g)?.best ?? 0 }
  }
  return out
}

/** Conta de teste (players.is_test): fica fora de ranking, apostas, prêmios e destaques. */
export async function isTestPlayer(playerId: string) {
  const [row] = await q<{ is_test: boolean }>('SELECT is_test FROM players WHERE id = $1', [playerId])
  return !!row?.is_test
}

/** Nomes de contas de teste inscritas nesses eventos (para esconder confrontos delas nas apostas). */
async function testEntryNames(eventIds: string[]) {
  if (!eventIds.length) return new Set<string>()
  const rows = await q<{ event_id: string; name: string }>(
    'SELECT e.event_id, e.name FROM arcade_entries e JOIN players p ON p.id = e.player_id WHERE e.event_id = ANY($1) AND p.is_test',
    [eventIds],
  )
  return new Set(rows.map((r) => `${r.event_id}:${r.name}`))
}

async function pendingClaim(player: Player, now: number) {
  if (await isTestPlayer(player.id)) return null
  const prev = weekStartMs(now) - WEEK
  const [mine] = await q<{ score: number; games: number }>('SELECT score, games FROM arcade_week_scores WHERE week_start = $1 AND player_id = $2', [weekKey(prev), player.id])
  if (!mine || mine.score <= 0 || mine.games < MIN_WEEK_GAMES) return null
  const [done] = await q('SELECT 1 FROM arcade_claims WHERE player_id = $1 AND week_start = $2', [player.id, weekKey(prev)])
  if (done) return null
  const board = await leaderboard(prev, prev + WEEK, player.id)
  const rank = board.find((r) => r.isMe)?.rank ?? 0
  const reward = rank ? rankReward(rank) : null
  return reward ? { week: weekKey(prev), rank, reward } : null
}

export async function getDashboard(player: Player) {
  const now = Date.now()
  const week = weekStartMs(now)
  const [profile, events, mine, board, recent, claim, rankings] = await Promise.all([
    ensureProfile(player.id),
    weekEvents(now),
    myWeek(player.id, week),
    leaderboard(week, now, player.id),
    q<{ id: string; game_id: GameId; mode: string; opponent_name: string; result: string; score: number; finished_at: Date }>(
      `SELECT id, game_id, mode, opponent_name, result, score, finished_at FROM arcade_matches
       WHERE player_id = $1 AND finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 6`,
      [player.id],
    ),
    pendingClaim(player, now),
    gameRankings(player, week, now),
  ])
  const me = board.find((r) => r.isMe)
  const views = await eventViews(events, player, now)
  const best = await q<{ game_id: GameId; best: number }>(
    'SELECT game_id, max(score)::int AS best FROM arcade_matches WHERE player_id = $1 AND finished_at >= $2 GROUP BY game_id',
    [player.id, new Date(week)],
  )
  const timeDeltaMs = await drainTime(player.id)
  return {
    serverNow: now,
    timeDeltaMs,
    week: { key: weekKey(week), resetsAt: week + WEEK },
    me: {
      name: player.name,
      settings: profile.settings,
      score: mine.score,
      wins: mine.wins,
      games: mine.games,
      rank: me && mine.score > 0 ? me.rank : null,
      rating: playerRating(mine.wins),
      best: Object.fromEntries(best.map((b) => [b.game_id, b.best])) as Partial<Record<GameId, number>>,
    },
    leaderboard: [...board.slice(0, 10), ...(me && me.rank > 10 && mine.score > 0 ? [me] : [])],
    events: views,
    recent: recent.map((r) => ({
      id: r.id,
      gameId: r.game_id,
      mode: r.mode,
      opponent: r.opponent_name,
      result: r.result,
      score: r.score,
      at: r.finished_at.getTime(),
    })),
    claim,
    rankings,
    minWeekGames: MIN_WEEK_GAMES,
  }
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>

async function getEventRow(id: string) {
  const [e] = await q<EventRow>('SELECT * FROM arcade_events WHERE id = $1', [id])
  if (!e) throw new ArcadeError('Partida não encontrada.', 404)
  return e
}

export type DuelView = {
  id: string
  eventId: string
  slot: number
  winner: string | null
  sides: { name: string; rating: number; odds: number; pct: number; bettors: number; isMe: boolean; isBot: boolean; wins: number }[]
  myBet: { pick: string; amount: number; odds: number; status: string; payout: number } | null
}

async function duelViews(eventIds: string[], player: Player): Promise<DuelView[]> {
  if (!eventIds.length) return []
  const duels = await q<DuelRow>('SELECT * FROM arcade_duels WHERE event_id = ANY($1) ORDER BY slot', [eventIds])
  if (!duels.length) return []
  const duelIds = duels.map((d) => d.id)
  const [pools, myBets, humans] = await Promise.all([
    q<{ duel_id: string; pick_name: string; total: number; n: number }>(
      `SELECT b.duel_id, b.pick_name, sum(b.amount)::int AS total, count(*)::int AS n
         FROM arcade_bets b JOIN players p ON p.id = b.player_id
        WHERE b.duel_id = ANY($1) AND NOT p.is_test GROUP BY b.duel_id, b.pick_name`,
      [duelIds],
    ),
    q<{ duel_id: string; pick_name: string; amount: number; odds: string; status: string; payout: number }>(
      'SELECT duel_id, pick_name, amount, odds, status, payout FROM arcade_bets WHERE duel_id = ANY($1) AND player_id = $2',
      [duelIds, player.id],
    ),
    q<{ event_id: string; name: string; player_id: string }>(
      'SELECT event_id, name, player_id FROM arcade_entries WHERE event_id = ANY($1) AND NOT is_bot',
      [eventIds],
    ),
  ])
  const humanKey = new Map(humans.map((h) => [`${h.event_id}:${h.name}`, h.player_id]))
  return duels.map((d) => {
    const pa = winProbability(d.a_rating, d.b_rating)
    const pool = (name: string) => pools.find((p) => p.duel_id === d.id && p.pick_name === name)
    const sides = [
      { name: d.a_name, rating: d.a_rating, p: pa },
      { name: d.b_name, rating: d.b_rating, p: 1 - pa },
    ].map((s) => ({ ...s, bettors: pool(s.name)?.n ?? 0, money: pool(s.name)?.total ?? 0 }))
    const totalMoney = sides[0].money + sides[1].money
    const totalBettors = sides[0].bettors + sides[1].bettors
    const bet = myBets.find((b) => b.duel_id === d.id)
    return {
      id: d.id,
      eventId: d.event_id,
      slot: d.slot,
      winner: d.winner_name,
      sides: sides.map((s) => {
        const implied = Math.max(0.05, totalMoney ? 0.7 * s.p + 0.3 * (s.money / totalMoney) : s.p)
        const pid = humanKey.get(`${d.event_id}:${s.name}`)
        return {
          name: s.name,
          rating: s.rating,
          odds: Math.max(1.05, Math.round((0.92 / implied) * 100) / 100),
          pct: totalBettors ? Math.round((s.bettors / totalBettors) * 100) : 50,
          bettors: s.bettors,
          isMe: pid === player.id,
          isBot: !pid,
          wins: Math.max(0, Math.round((s.rating - 800) / 40)),
        }
      }),
      myBet: bet ? { pick: bet.pick_name, amount: bet.amount, odds: Number(bet.odds), status: bet.status, payout: bet.payout } : null,
    }
  })
}

export async function getEvent(player: Player, id: string) {
  const now = Date.now()
  let e = await getEventRow(id)
  await progressEvent(e, now)
  e = await getEventRow(id)
  const [view] = await eventViews([e], player, now)
  const entries = await q<{ name: string; is_bot: boolean; rating: number; player_id: string | null }>(
    'SELECT name, is_bot, rating, player_id FROM arcade_entries WHERE event_id = $1 ORDER BY created_at',
    [id],
  )
  const week = weekStartMs(now)
  const board = await leaderboard(week, now, player.id)
  const duels = await duelViews([id], player)
  const myDuel = duels.find((d) => d.sides.some((s) => s.isMe)) ?? null
  const [played] = myDuel
    ? await q('SELECT 1 FROM arcade_matches WHERE duel_id = $1 AND player_id = $2 AND finished_at IS NOT NULL', [myDuel.id, player.id])
    : []
  return {
    serverNow: now,
    event: view,
    entries: entries.map((en) => {
      const row = board.find((b) => b.name === en.name)
      const duel = duels.find((d) => d.sides.some((s) => s.name === en.name))
      return {
        name: en.name,
        isBot: en.is_bot,
        isMe: en.player_id === player.id,
        rating: en.rating,
        score: row?.score ?? 0,
        rank: row?.rank ?? null,
        wins: row?.wins ?? 0,
        state: !duel ? 'inscrito' : duel.winner ? (duel.winner === en.name ? 'venceu' : 'eliminado') : 'na disputa',
      }
    }),
    duels,
    myDuel,
    myDuelPlayed: !!played,
  }
}

export async function registerEntry(player: Player, eventId: string) {
  const e = await getEventRow(eventId)
  if (eventStatus(e) !== 'REGISTRATION') throw new ArcadeError('As inscrições não estão abertas.')
  const week = weekStartMs()
  const mine = await myWeek(player.id, week)
  await tx(async (c) => {
    const [{ n }] = await q<{ n: number }>('SELECT count(*)::int AS n FROM arcade_entries WHERE event_id = $1 FOR UPDATE', [eventId], c).catch(
      () => q<{ n: number }>('SELECT count(*)::int AS n FROM arcade_entries WHERE event_id = $1', [eventId], c),
    )
    if (n >= e.max_players) throw new ArcadeError('A lista já está cheia.')
    await q(
      'INSERT INTO arcade_entries (event_id, name, player_id, rating) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [eventId, player.name, player.id, playerRating(mine.wins)],
      c,
    )
  })
  return { ok: true }
}

export async function getBetBoard(player: Player) {
  const now = Date.now()
  const events = await weekEvents(now)
  const relevant = events.filter((e) => {
    const s = eventStatus(e, now)
    return s === 'LOCKED' || s === 'LIVE' || (s === 'FINISHED' && now - e.ends_at.getTime() < 2 * DAY)
  })
  const views = await eventViews(relevant, player, now)
  const testNames = await testEntryNames(relevant.map((e) => e.id))
  // Confrontos com conta de teste não aparecem nas apostas nem no destaque da Mesa.
  const duels = (
    await duelViews(
      relevant.map((e) => e.id),
      player,
    )
  ).filter((d) => !d.sides.some((side) => testNames.has(`${d.eventId}:${side.name}`)))
  const history = await q<{ id: string; pick_name: string; amount: number; odds: string; status: string; payout: number; created_at: Date; game_id: GameId; number: number; slot: number }>(
    `SELECT b.id, b.pick_name, b.amount, b.odds, b.status, b.payout, b.created_at, e.game_id, e.number, d.slot
     FROM arcade_bets b JOIN arcade_duels d ON d.id = b.duel_id JOIN arcade_events e ON e.id = d.event_id
     WHERE b.player_id = $1 ORDER BY b.created_at DESC LIMIT 20`,
    [player.id],
  )
  await ensureProfile(player.id)
  const timeDeltaMs = await drainTime(player.id)
  return {
    serverNow: now,
    timeDeltaMs,
    events: views.map((v) => ({ ...v, duels: duels.filter((d) => d.eventId === v.id) })),
    history: history.map((h) => ({
      id: h.id,
      pick: h.pick_name,
      amount: h.amount,
      odds: Number(h.odds),
      status: h.status,
      payout: h.payout,
      at: h.created_at.getTime(),
      gameId: h.game_id,
      label: `${GAMES[h.game_id]?.name ?? h.game_id} #${String(h.number).padStart(3, '0')}-${h.slot}`,
    })),
  }
}

export async function placeBet(player: Player, duelId: string, pick: string, rawAmount: number) {
  const amount = Math.floor(Number(rawAmount))
  if (!Number.isFinite(amount) || amount < 5 || amount > 240) throw new ArcadeError('Aposte entre 5 minutos e 4 horas do seu Tempo.')
  const [d] = await q<DuelRow>('SELECT * FROM arcade_duels WHERE id = $1', [duelId])
  if (!d) throw new ArcadeError('Confronto não encontrado.', 404)
  if (d.winner_name) throw new ArcadeError('Esse confronto já terminou.')
  if (pick !== d.a_name && pick !== d.b_name) throw new ArcadeError('Escolha um dos participantes.')
  const e = await getEventRow(d.event_id)
  const status = eventStatus(e)
  if (status !== 'LOCKED' && status !== 'LIVE') throw new ArcadeError('As apostas não estão abertas para essa partida.')
  const [inside] = await q('SELECT 1 FROM arcade_entries WHERE event_id = $1 AND player_id = $2', [e.id, player.id])
  if (inside) throw new ArcadeError('Participantes não podem apostar na própria partida.')
  const testNames = await testEntryNames([e.id])
  if (testNames.has(`${e.id}:${d.a_name}`) || testNames.has(`${e.id}:${d.b_name}`)) throw new ArcadeError('Esse confronto não aceita apostas.')
  await ensureProfile(player.id)
  const [view] = (await duelViews([e.id], player)).filter((x) => x.id === duelId)
  const odds = view?.sides.find((s) => s.name === pick)?.odds ?? 1.5
  const cost = amount * MINUTE
  return tx(async (c) => {
    const [paid] = await q<{ t: string }>(
      `UPDATE player_saves SET data = jsonb_set(data, '{timerEndsAt}', to_jsonb((data->>'timerEndsAt')::bigint - $2))
       WHERE player_id = $1 AND (data->>'timerEndsAt')::bigint - $2 > $3 RETURNING data->>'timerEndsAt' AS t`,
      [player.id, cost, Date.now() + BET_RESERVE_MS],
      c,
    )
    if (!paid) {
      const saved = await savedTimerEndsAt(player.id)
      throw new ArcadeError(saved ? 'Tempo insuficiente. Você precisa manter pelo menos 30 minutos depois de apostar.' : 'Seu Tempo ainda não foi sincronizado. Tente de novo em instantes.')
    }
    const [bet] = await q(
      'INSERT INTO arcade_bets (duel_id, player_id, pick_name, amount, odds) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id',
      [duelId, player.id, pick, amount, odds],
      c,
    )
    if (!bet) throw new ArcadeError('Você já apostou nesse confronto.')
    return { ok: true, odds, timeDeltaMs: -cost }
  })
}

/** Tutorial contra o bot: não vale score, ranking nem Tempo. */
export async function startTutorial(player: Player, gameId: GameId): Promise<MatchStart> {
  if (GAMES[gameId].status === 'em-breve') throw new ArcadeError('Este jogo ainda não está disponível.')
  const opponent = { name: TUTORIAL_OPPONENT, rating: 1000 }
  const seed = Math.floor(Math.random() * 2 ** 31)
  const [m] = await q<{ id: string; started_at: Date }>(
    `INSERT INTO arcade_matches (player_id, game_id, mode, opponent_name, opponent_rating, seed)
     VALUES ($1,$2,'treino',$3,$4,$5) RETURNING id, started_at`,
    [player.id, gameId, opponent.name, opponent.rating, seed],
  )
  return { matchId: m.id, gameId, mode: 'treino', seed, opponent, startedAt: m.started_at.getTime(), serverNow: Date.now() }
}

/** Registra o resultado de uma partida real (sala) para um dos lados, dentro da transação do fechamento. */
export async function recordMatchResult(
  c: PoolClient,
  r: {
    playerId: string
    gameId: GameId
    mode: 'casual' | 'evento'
    duelId: string | null
    opponentName: string
    opponentRating: number
    seed: number
    startedAt: Date
    result: 'win' | 'loss' | 'draw'
    score: number
    stats: Record<string, number>
  },
) {
  const meta = GAMES[r.gameId]
  const score = Math.max(0, Math.min(meta.maxScore, Math.floor(r.score)))
  let reward: Reward = {}
  let awarded: number
  if (r.mode === 'evento') {
    const [ev] = r.duelId
      ? await q<{ reward: Reward }>('SELECT e.reward FROM arcade_duels d JOIN arcade_events e ON e.id = d.event_id WHERE d.id = $1', [r.duelId], c)
      : []
    reward = r.result === 'win' ? (ev?.reward ?? {}) : { score: 50 }
    awarded = rankingPoints('evento', score, r.result, reward.score ?? 0)
  } else {
    awarded = rankingPoints('casual', score, r.result)
  }
  await q(
    `INSERT INTO arcade_matches (player_id, game_id, mode, duel_id, opponent_name, opponent_rating, seed, started_at, finished_at, result, score, stats, points)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),$9,$10,$11,$12)`,
    [r.playerId, r.gameId, r.mode, r.duelId, r.opponentName, r.opponentRating, r.seed, r.startedAt, r.result, score, r.stats, awarded],
    c,
  )
  await q(
    `INSERT INTO arcade_week_scores (week_start, player_id, score, wins, games) VALUES ($1,$2,$3,$4,1)
     ON CONFLICT (week_start, player_id) DO UPDATE SET score = arcade_week_scores.score + $3, wins = arcade_week_scores.wins + $4, games = arcade_week_scores.games + 1`,
    [weekKey(weekStartMs()), r.playerId, awarded, r.result === 'win' ? 1 : 0],
    c,
  )
  const timeGainMin = r.mode === 'evento' ? (reward.hours ?? 0) * 60 : r.result === 'win' ? 3 : r.result === 'draw' ? 1 : 0
  await creditTime(c, r.playerId, timeGainMin * MINUTE)
  return { awarded, score, result: r.result, timeGainMin, reward }
}

export async function finishMatch(
  player: Player,
  matchId: string,
  input: { result: string; score: number; stats?: Record<string, number> },
) {
  const [m] = await q<{
    id: string
    game_id: GameId
    mode: string
    duel_id: string | null
    started_at: Date
    finished_at: Date | null
    opponent_name: string
  }>('SELECT * FROM arcade_matches WHERE id = $1 AND player_id = $2', [matchId, player.id])
  if (!m) throw new ArcadeError('Partida não encontrada.', 404)
  if (m.finished_at) throw new ArcadeError('Resultado já registrado.')
  if (m.mode !== 'treino') throw new ArcadeError('Partidas online são registradas pela sala.')
  const meta = GAMES[m.game_id]
  const result = input.result === 'win' || input.result === 'loss' || input.result === 'draw' ? input.result : 'loss'
  const score = Math.max(0, Math.min(meta.maxScore, Math.floor(Number(input.score) || 0)))
  const stats: Record<string, number> = {}
  for (const [k, v] of Object.entries(input.stats ?? {}).slice(0, 12)) if (typeof v === 'number' && Number.isFinite(v)) stats[k.slice(0, 24)] = v
  await q('UPDATE arcade_matches SET finished_at = now(), result = $2, score = $3, stats = $4 WHERE id = $1 AND finished_at IS NULL', [matchId, result, score, stats])
  const now = Date.now()
  const board = await leaderboard(weekStartMs(now), now, player.id)
  const me = board.find((r) => r.isMe)
  return finishView({ awarded: 0, score, result, timeGainMin: 0, timeDeltaMs: 0, reward: {}, rank: me?.rank ?? null, weekScore: me?.score ?? 0, tutorial: true })
}

function finishView(f: {
  awarded: number
  score: number
  result: 'win' | 'loss' | 'draw'
  timeGainMin: number
  timeDeltaMs: number
  reward: Reward
  rank: number | null
  weekScore: number
  tutorial?: boolean
}) {
  return { ok: true as const, tutorial: false, ...f }
}

export type MatchFinish = ReturnType<typeof finishView>

export async function finishViewFor(player: Player, f: Omit<Parameters<typeof finishView>[0], 'timeDeltaMs' | 'rank' | 'weekScore'>) {
  const timeDeltaMs = await drainTime(player.id)
  const now = Date.now()
  const board = await leaderboard(weekStartMs(now), now, player.id)
  const me = board.find((r) => r.isMe)
  return finishView({ ...f, timeDeltaMs, rank: me?.rank ?? null, weekScore: me?.score ?? f.awarded })
}

export async function claimReward(player: Player) {
  const claim = await pendingClaim(player, Date.now())
  if (!claim) throw new ArcadeError('Nenhuma recompensa disponível.')
  await tx(async (c) => {
    const [ok] = await q(
      'INSERT INTO arcade_claims (player_id, week_start, rank, reward) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING player_id',
      [player.id, claim.week, claim.rank, claim.reward],
      c,
    )
    if (!ok) throw new ArcadeError('Recompensa já resgatada.')
    await creditTime(c, player.id, (claim.reward.hours ?? 0) * 60 * MINUTE)
  })
  const timeDeltaMs = await drainTime(player.id)
  return { ok: true, ...claim, timeDeltaMs }
}

const CHAT_BOT_LINES = [
  'alguém viu o placar do Corvo? isso não é humano',
  'apostei tudo no azarão. de novo.',
  'o relógio do xadrez devia ser crime',
  'essa bomba explodiu na MINHA mão no 0.1',
  'memory rush hoje? tô treinando',
  'quem perde paga a próxima rodada',
  'o Javali tá observando...',
  'odds 3.4? alguém sabe de algo que eu não sei',
  'COMEBACK no último segundo kkkk',
  'semana que vem eu volto pro top 3',
  'apostei 2 horas do meu Tempo. sem arrependimentos.',
  'ninguém passa a bomba como eu',
]

export async function getChat(channel: string) {
  const now = Date.now()
  const live = channel.startsWith('match-')
  const base = 'SELECT c.id, c.author, c.body, c.created_at, c.player_id, p.role FROM arcade_chat c LEFT JOIN players p ON p.id = c.player_id WHERE c.channel = $1'
  const rows = await q<{ id: string; author: string; body: string; created_at: Date; player_id: string | null; role: string | null }>(
    live
      ? `${base} AND c.created_at > now() - interval '${LIVE_CHAT_MINUTES} minutes' ORDER BY c.created_at DESC LIMIT 60`
      : `${base} ORDER BY c.created_at DESC LIMIT 40`,
    [channel],
  )
  const bucket = 25 * 1000
  const virtual = channel.startsWith('tutorial-')
    ? Array.from({ length: 6 }, (_, i) => {
        const slot = Math.floor(now / bucket) - i
        const h = hashString(`${channel}:${slot}`)
        return {
          id: `bot-${slot}`,
          author: TUTORIAL_BOTS[h % TUTORIAL_BOTS.length],
          body: CHAT_BOT_LINES[(h >>> 8) % CHAT_BOT_LINES.length],
          at: slot * bucket + (h % bucket),
          bot: true,
        }
      }).filter((m) => m.at <= now)
    : []
  return [
    ...rows.map((r) => ({ id: String(r.id), author: r.author, body: r.body, at: r.created_at.getTime(), bot: false, pid: r.player_id ?? undefined, role: r.role ?? undefined })),
    ...virtual,
  ]
    .sort((a, b) => a.at - b.at)
    .slice(live ? -60 : -40)
}

/** Chat de partida é efêmero: só os últimos minutos são lidos e o resto é apagado. */
const LIVE_CHAT_MINUTES = 90
const REACTION_RE = new RegExp(`^::(${REACTION_IDS.join('|')})$`)

export async function postChat(player: Player, channel: string, rawBody: string) {
  const body = String(rawBody ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
  if (!body) throw new ArcadeError('Mensagem vazia.')
  const isReaction = body.startsWith('::')
  if (isReaction && (!REACTION_RE.test(body) || !channel.startsWith('match-'))) throw new ArcadeError('Reação inválida.')
  const [recent] = await q(
    isReaction
      ? "SELECT 1 FROM arcade_chat WHERE player_id = $1 AND body LIKE '::%' AND created_at > now() - interval '600 milliseconds'"
      : "SELECT 1 FROM arcade_chat WHERE player_id = $1 AND body NOT LIKE '::%' AND created_at > now() - interval '1500 milliseconds'",
    [player.id],
  )
  if (recent) throw new ArcadeError('Devagar. Espere um instante.', 429)
  await q('INSERT INTO arcade_chat (channel, author, player_id, body) VALUES ($1,$2,$3,$4)', [channel, player.name, player.id, body])
  if (channel.startsWith('match-') && Math.random() < 0.08) {
    await q(`DELETE FROM arcade_chat WHERE channel LIKE 'match-%' AND created_at < now() - interval '${LIVE_CHAT_MINUTES} minutes'`).catch(() => {})
  }
  return { ok: true }
}

/**
 * Contagem leve para o app Pulso: partidas reais concluídas (sem treino). Não mexe no livro-caixa
 * de Tempo (diferente do dashboard, que entrega créditos pendentes).
 */
export async function getPlayerStats(player: Player) {
  const [row] = await q<{ total: number; week: number }>(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE finished_at >= $2)::int AS week
       FROM arcade_matches WHERE player_id = $1 AND finished_at IS NOT NULL AND mode <> 'treino'`,
    [player.id, new Date(weekStartMs())],
  )
  return { games: row?.total ?? 0, weekGames: row?.week ?? 0 }
}

export type PlayerStats = Awaited<ReturnType<typeof getPlayerStats>>

export type BorderTier = 'padrao' | 'azul' | 'prata' | 'ouro' | 'dealer'

export type MiniProfile = {
  id: string
  name: string
  role: string
  avatarVersion: number | null
  border: BorderTier
  week: { rank: number | null; score: number; wins: number; games: number; total: number }
  deadlyVotes: { total: number; survived: number; eliminated: number }
  bestGame: { gameId: string; points: number } | null
  isMe: boolean
}

export async function getMiniProfile(viewer: Player, pid: string): Promise<MiniProfile> {
  const [p] = await q<{ id: string; name: string; role: string; avatar_updated_at: Date | null; has_avatar: boolean }>(
    'SELECT id, name, role, avatar_updated_at, avatar IS NOT NULL AS has_avatar FROM players WHERE id = $1',
    [pid],
  )
  if (!p) throw new ArcadeError('Jogador não encontrado.', 404)
  const now = Date.now()
  const week = weekStartMs(now)
  const [board, mine, [dv], [best]] = await Promise.all([
    leaderboard(week, now, pid),
    myWeek(pid, week),
    q<{ total: string; survived: string; eliminated: string }>(
      `SELECT count(*) AS total,
              count(*) FILTER (WHERE outcome = 'sobreviveu') AS survived,
              count(*) FILTER (WHERE outcome = 'eliminado') AS eliminated
         FROM deadly_vote_entries WHERE player_id = $1`,
      [pid],
    ),
    q<{ game_id: string; total: string }>(
      `SELECT game_id, sum(points) AS total FROM arcade_matches
        WHERE player_id = $1 AND finished_at >= $2 AND points > 0
        GROUP BY game_id ORDER BY total DESC LIMIT 1`,
      [pid, new Date(week)],
    ).catch(() => []),
  ])
  const rank = board.find((r) => r.isMe)?.rank ?? null
  const staff = p.role === 'dealer' || p.role === 'admin'
  const border: BorderTier = staff ? 'dealer' : rank === 1 ? 'ouro' : rank && rank <= 3 ? 'prata' : rank && rank <= 10 ? 'azul' : 'padrao'
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    avatarVersion: p.has_avatar ? (p.avatar_updated_at?.getTime() ?? 1) : null,
    border,
    week: { rank, score: mine.score, wins: mine.wins, games: mine.games, total: board.length },
    deadlyVotes: { total: Number(dv?.total ?? 0), survived: Number(dv?.survived ?? 0), eliminated: Number(dv?.eliminated ?? 0) },
    bestGame: best ? { gameId: best.game_id, points: Number(best.total) } : null,
    isMe: p.id === viewer.id,
  }
}

export async function saveSettings(player: Player, raw: Record<string, unknown>) {
  const settings: Record<string, string> = {}
  const allowed: Record<string, string[]> = {
    chessTheme: ['classic', 'devo', 'neon', 'crimson', 'void', 'custom'],
    quality: ['auto', 'low', 'medium', 'high'],
    pieceStyle: ['marble', 'matte', 'glass'],
  }
  for (const [k, opts] of Object.entries(allowed)) if (typeof raw[k] === 'string' && opts.includes(raw[k] as string)) settings[k] = raw[k] as string
  for (const k of ['boardColor', 'lightColor', 'darkColor']) {
    if (typeof raw[k] === 'string' && /^#[0-9a-f]{6}$/i.test(raw[k] as string)) settings[k] = raw[k] as string
  }
  await ensureProfile(player.id)
  await q('UPDATE arcade_profiles SET settings = settings || $2::jsonb WHERE player_id = $1', [player.id, JSON.stringify(settings)])
  return { ok: true, settings }
}
