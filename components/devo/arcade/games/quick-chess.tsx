'use client'

import { liveChannelFor } from '@/lib/devo/arcade/reactions'
import { Canvas } from '@react-three/fiber'
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { Bot, Eye, History, MessageSquare, RotateCcw, Settings2 } from 'lucide-react'
import { ArcadeChat } from '@/components/devo/arcade/arcade-chat'
import { useDeadlyVotes } from '@/components/devo/system/use-deadly-votes'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playSfx, startChessAmbience, stopChessAmbience } from '@/lib/devo/audio'
import { ClockBackdrop } from '../chess/clock-backdrop'
import { arcadePost, type GameProps } from '@/lib/devo/arcade/client'
import { BOARD_THEMES, PIECE_SETS, boardTheme, pieceSet, resolveQuality } from '@/lib/devo/arcade/chess-themes'
import { GAMES, botSkill, rng } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { VersusBar } from '../chess/versus-bar'
import { LivingScene, planAnim, type Anim, type CamState, type MateFx, type UnitState } from '../chess/living-board'
import { Countdown321, GameFrame, PopLayer, WaitingStart, usePops, vibrate } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import type { ChessState } from '@/lib/devo/arcade/client'

const meta = GAMES.chess
const CLOCK_MS = 15_000
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const REACTIONS = ['🔥', '😱', '💀', '👏', '👀']

function evaluate(g: Chess) {
  let s = 0
  for (const row of g.board()) for (const p of row) if (p) s += (p.color === 'b' ? 1 : -1) * VALUE[p.type] * 100
  return s
}

function botMove(g: Chess, skill: number, r: () => number): Move | null {
  const moves = g.moves({ verbose: true })
  if (!moves.length) return null
  let best: Move | null = null
  let bestScore = -Infinity
  for (const m of moves) {
    g.move(m)
    let score = evaluate(g)
    if (g.isCheckmate()) score += 100_000
    else {
      let worst = 0
      for (const rep of g.moves({ verbose: true })) if (rep.captured) worst = Math.max(worst, VALUE[rep.captured] * 100)
      score -= worst * (0.4 + skill * 0.6)
      if (g.inCheck()) score += 25
    }
    g.undo()
    score += (r() - 0.5) * (1 - skill) * 260
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  }
  return best
}

function initialUnits(g: Chess): UnitState[] {
  const out: UnitState[] = []
  let id = 1
  for (const row of g.board()) for (const p of row) if (p) out.push({ id: id++, type: p.type, color: p.color, square: p.square })
  return out
}

type Ending = { result: 'win' | 'loss' | 'draw'; reason: string; score: number }

function Clock({ label, ms, active, mine }: { label: string; ms: number; active: boolean; mine: boolean }) {
  const s = ms / 1000
  const level = !active ? 0 : s <= 3 ? 3 : s <= 5 ? 2 : s <= 10 ? 1 : 0
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center border px-2 py-1 transition-colors',
        active ? (mine ? 'border-[#e8c35a] bg-[#e8c35a]/10' : 'border-primary bg-primary/15') : 'border-foreground/15 bg-black/30',
      )}
    >
      <span className="max-w-full truncate text-[9px] uppercase tracking-[0.25em] text-foreground/60">{label}</span>
      <span
        className={cn(
          'font-mono tabular-nums leading-none transition-all',
          level === 0 && 'text-xl text-foreground',
          level === 1 && 'text-2xl text-[#ffb347]',
          level === 2 && 'animate-pulse text-2xl text-[#ff4a4a]',
          level === 3 && 'scale-110 animate-pulse text-2xl text-[#ff2a2a] [text-shadow:0_0_12px_#ff2a2a]',
        )}
      >
        {`00:${String(Math.ceil(s)).padStart(2, '0')}`}
      </span>
    </div>
  )
}

export default function QuickChess({ start, settings, onFinish, onQuit }: GameProps) {
  const game = useMemo(() => new Chess(), [])
  const [units, setUnits] = useState<UnitState[]>(() => initialUnits(game))
  const [, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [clocks, setClocks] = useState({ w: CLOCK_MS, b: CLOCK_MS })
  const [captures, setCaptures] = useState({ w: 0, b: 0 })
  const [local, setLocal] = useState(settings)
  const [panel, setPanel] = useState<'none' | 'settings' | 'history' | 'chat'>('none')
  const { record } = useDeadlyVotes()
  const playerPhoto = record?.avatarVersion ? `/api/record/avatar?v=${record.avatarVersion}` : null
  const chatChannel = liveChannelFor(start)
  const [spectator, setSpectator] = useState(false)
  const [ending, setEnding] = useState<Ending | null>(null)
  const [reactions, setReactions] = useState<{ id: number; e: string; x: number }[]>([])
  const [now, setNow] = useState(0)
  const { pops, push } = usePops()

  const unitsRef = useRef(units)
  unitsRef.current = units
  const animRef = useRef<Anim | null>(null)
  const mateRef = useRef<MateFx>(null)
  const cam = useRef<CamState>({ az: 0, pol: 0.84, rad: 13, zoom: 1, spectator: false, dragDist: 0 })
  const [autoPlay, setAutoPlay] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  const finished = useRef(false)
  const turnStart = useRef(0)
  const clocksRef = useRef(clocks)
  clocksRef.current = clocks
  const capturesRef = useRef(captures)
  capturesRef.current = captures
  const bestCapture = useRef(0)
  const skill = botSkill(start.opponent.rating)
  const { online, room, act, toLocal } = useRoom(start, 900)
  const gateOpen = useOnlineGate(start)
  const myColor: Color = online && start.side === 'b' ? 'b' : 'w'
  const oppColor: Color = myColor === 'w' ? 'b' : 'w'
  const pending = useRef(false)
  const r = useMemo(() => rng(start.seed), [start.seed])
  const theme = boardTheme(local.chessTheme)
  const set = pieceSet(local.pieceSet)
  const [quality, setQuality] = useState(() => resolveQuality(settings.quality))
  const sfx = local.sfx !== 'off'
  const sound = useCallback((k: Parameters<typeof playSfx>[0]) => {
    if (sfx) playSfx(k)
  }, [sfx])
  useEffect(() => {
    if (!sfx) return
    startChessAmbience()
    return stopChessAmbience
  }, [sfx])


  const react = useCallback((e?: string) => {
    const emoji = e ?? REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    const id = Date.now() + Math.random()
    setReactions((list) => [...list.slice(-6), { id, e: emoji, x: 10 + Math.random() * 80 }])
    window.setTimeout(() => setReactions((list) => list.filter((x) => x.id !== id)), 1800)
  }, [])

  const end = useCallback(
    (result: 'win' | 'loss' | 'draw', reason: string, mate = false) => {
      // Online, o servidor fecha a partida; o efeito da sala exibe o resultado oficial.
      if (finished.current || online) return
      finished.current = true
      setRunning(false)
      setSelected(null)
      const c = clocksRef.current
      const cap = capturesRef.current
      const timeBonus = result === 'win' ? Math.floor(c.w / 1000) * 10 : 0
      const score = Math.min(meta.maxScore, (result === 'win' ? 600 : result === 'draw' ? 200 : 0) + cap.w * 10 + timeBonus)
      sound(result === 'win' ? 'reveal' : result === 'loss' ? 'error' : 'notify')
      vibrate(result === 'win' ? [30, 40, 60] : 80)
      window.setTimeout(() => setEnding({ result, reason, score }), mate ? 1300 : 300)
      window.setTimeout(
        () =>
          onFinish({
            result,
            score,
            oppScore: (result === 'loss' ? 600 : result === 'draw' ? 200 : 0) + cap.b * 10,
            bonus: timeBonus,
            bonusLabel: 'TEMPO RESTANTE',
            stats: { moves: game.history().length, captured: cap.w, lost: cap.b, best: bestCapture.current },
          }),
        mate ? 4200 : 3000,
      )
    },
    [game, onFinish, sound, online],
  )

  const checkEnd = useCallback(() => {
    if (game.isCheckmate()) {
      const loser = game.turn()
      const king = unitsRef.current.find((u) => u.type === 'k' && u.color === loser)
      if (king) mateRef.current = { loserKing: king.id, start: performance.now() / 1000 }
      end(loser === 'b' ? 'win' : 'loss', 'XEQUE-MATE', true)
      return true
    }
    if (game.isDraw() || game.isStalemate()) {
      end('draw', 'EMPATE')
      return true
    }
    return false
  }, [game, end])

  const apply = useCallback(
    (m: Move) => {
      if (animRef.current || finished.current) return
      const by = game.turn()
      const nextClocks = { w: CLOCK_MS, b: CLOCK_MS }
      clocksRef.current = nextClocks
      setClocks(nextClocks)

      const list = unitsRef.current
      const mover = list.find((u) => u.square === m.from)
      const victimSq = m.captured ? (m.flags.includes('e') ? `${m.to[0]}${m.from[1]}` : m.to) : null
      const victim = victimSq ? list.find((u) => u.square === victimSq) : undefined
      let rook: Anim['rook']
      if (m.flags.includes('k') || m.flags.includes('q')) {
        const rank = m.from[1]
        const rf = m.flags.includes('k') ? `h${rank}` : `a${rank}`
        const rt = m.flags.includes('k') ? `f${rank}` : `d${rank}`
        const ru = list.find((u) => u.square === rf)
        if (ru) rook = { id: ru.id, from: rf, to: rt }
      }

      if (m.captured) {
        const nextCap = { ...capturesRef.current, [by]: capturesRef.current[by] + VALUE[m.captured] }
        capturesRef.current = nextCap
        setCaptures(nextCap)
        if (by === myColor) bestCapture.current = Math.max(bestCapture.current, VALUE[m.captured])
      }
      game.move(m)
      setLastMove(m)
      setSelected(null)
      setTick((t) => t + 1)
      if (!mover) {
        setUnits(initialUnits(game))
        return
      }

      const anim = planAnim(mover.type, by, mover.id, m.from, m.to, victim && victimSq ? { id: victim.id, sq: victimSq } : null, {
        rook,
        promo: !!m.promotion,
        queenFx: m.captured === 'q' || mover.type === 'q',
      })
      animRef.current = anim
      setAnimating(true)
      if (m.captured) sound('whoosh')
      else window.setTimeout(() => sound('chess-move'), Math.max(0, anim.dur - 0.15) * 1000)
      const captured = m.captured
      if (captured) {
        window.setTimeout(() => {
          sound('chess-capture')
          vibrate(captured === 'q' ? [40, 30, 60] : 25)
          if (captured === 'q') push(by === myColor ? 'DAMA ABATIDA' : 'SUA DAMA CAIU', by === myColor ? 'gold' : 'red', 1400)
          else if (VALUE[captured] >= 3) push('CAPTURA', by === myColor ? 'gold' : 'red', 900)
          if (Math.random() < 0.6) react()
        }, anim.impact * 1000)
      }
      if (m.promotion)
        window.setTimeout(() => {
          sound('reveal')
          push('PROMOÇÃO', by === myColor ? 'gold' : 'red', 1100)
        }, (anim.dur - 0.5) * 1000)
      if (rook) push('ROQUE', 'white', 900)

      window.setTimeout(() => {
        setUnits((cur) =>
          cur
            .filter((u) => u.id !== victim?.id)
            .map((u) =>
              u.id === mover.id
                ? { ...u, square: m.to, type: (m.promotion as PieceSymbol | undefined) ?? u.type }
                : rook && u.id === rook.id
                  ? { ...u, square: rook.to }
                  : u,
            ),
        )
        // setTimeout (e não rAF): com a aba em segundo plano o rAF congela e travaria os lances do oponente.
        window.setTimeout(() => {
          animRef.current = null
          setAnimating(false)
          turnStart.current = Date.now()
          setNow(Date.now())
          if (finished.current) return
          if (!checkEnd() && game.inCheck()) {
            sound('chess-check')
            push('XEQUE', by === myColor ? 'gold' : 'red', 900)
            react('😱')
          }
        })
      }, anim.dur * 1000 + 40)
    },
    [game, push, checkEnd, sound, react, myColor],
  )

  /** Lance do jogador local: anima na hora e, online, envia ao servidor. */
  const play = useCallback(
    (m: Move) => {
      if (animRef.current || finished.current) return
      apply(m)
      if (!online) return
      pending.current = true
      act({ type: 'move', from: m.from, to: m.to, promotion: m.promotion }).finally(() => {
        pending.current = false
      })
    },
    [apply, online, act],
  )

  /** Reconstrói o tabuleiro a partir da lista oficial de lances do servidor. */
  const resync = useCallback(
    (s: ChessState) => {
      game.reset()
      let last: Move | null = null
      for (const lan of s.moves) {
        try {
          last = game.move({ from: lan.slice(0, 2), to: lan.slice(2, 4), promotion: lan[4] })
        } catch {
          break
        }
      }
      const cap = { w: s.captures.a, b: s.captures.b }
      capturesRef.current = cap
      setCaptures(cap)
      setUnits(initialUnits(game))
      setLastMove(last)
      setSelected(null)
      setTick((t) => t + 1)
    },
    [game],
  )

  // Online: o servidor é a fonte da verdade para os lances, o relógio e o fim da partida.
  useEffect(() => {
    if (!online || !room || room.status === 'waiting' || room.status === 'cancelled') return
    const s = room.state as ChessState
    if (!s?.moves || animating) return
    const local = game.history({ verbose: true })
    if (s.moves.length > local.length) {
      const consistent = local.every((m, i) => m.lan === s.moves[i])
      const next = consistent ? game.moves({ verbose: true }).find((m) => m.lan === s.moves[local.length]) : undefined
      if (next) apply(next)
      else resync(s)
      return
    }
    if (s.moves.length < local.length) {
      if (!pending.current) resync(s)
      return
    }
    if (room.status !== 'finished' || finished.current) return
    finished.current = true
    setRunning(false)
    setSelected(null)
    const mine = room.result?.mine
    const result = (mine?.result ?? 'draw') as Ending['result']
    const raw = room.result?.reason ?? ''
    const won = result === 'win'
    const reason =
      raw === 'tempo'
        ? won ? 'TEMPO DO OPONENTE ESGOTOU' : 'TEMPO ESGOTADO'
        : raw === 'xeque-mate'
          ? 'XEQUE-MATE'
          : raw === 'desistência'
            ? won ? 'OPONENTE DESISTIU' : 'VOCÊ DESISTIU'
            : raw === 'abandono'
              ? won ? 'OPONENTE ABANDONOU' : 'ABANDONO'
              : raw === 'empate'
                ? 'EMPATE'
                : raw.toUpperCase()
    const mate = raw === 'xeque-mate'
    sound(won ? 'reveal' : result === 'loss' ? 'error' : 'notify')
    vibrate(won ? [30, 40, 60] : 80)
    window.setTimeout(() => setEnding({ result, reason, score: mine?.score ?? 0 }), mate ? 1300 : 300)
    window.setTimeout(() => onFinish(roomOutcome(room)), mate ? 4200 : 3000)
  }, [online, room, animating, game, apply, resync, sound, onFinish])

  useEffect(() => {
    if (!running || animating) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [running, animating])

  const turn = game.turn()
  const ticking = running && !animating
  const plies = game.history().length
  const serverState = online && room && room.status !== 'waiting' ? (room.state as ChessState) : null
  const synced = !!serverState?.moves && serverState.moves.length === plies
  const clockTotal = online ? 30_000 : CLOCK_MS
  const clockOf = (side: Color) => (synced && serverState ? serverState.clock[side === 'w' ? 'a' : 'b'] : clocks[side])
  const turnFrom = synced && serverState ? toLocal(serverState.turnAt) : turnStart.current
  const live = (side: Color) => (ticking && turn === side ? Math.max(0, clockOf(side) - (now - turnFrom)) : clockOf(side))
  const wLeft = live('w')
  const bLeft = live('b')
  const myLeft = myColor === 'w' ? wLeft : bLeft
  const oppLeft = myColor === 'w' ? bLeft : wLeft

  useEffect(() => {
    if (!ticking) return
    if (myLeft <= 0) end('loss', 'TEMPO ESGOTADO')
    else if (oppLeft <= 0) end('win', 'TEMPO DO OPONENTE ESGOTOU')
  }, [ticking, myLeft, oppLeft, end])

  const lastSec = useRef(0)
  useEffect(() => {
    const s = Math.ceil(myLeft / 1000)
    if (ticking && turn === myColor && s <= 5 && s !== lastSec.current) {
      lastSec.current = s
      sound('chess-tick')
      vibrate(s <= 3 ? 30 : 15)
    }
  }, [myLeft, ticking, turn, myColor, sound])

  useEffect(() => {
    const botTurn = online ? autoPlay && turn === myColor : turn === 'b' || autoPlay
    if (!ticking || !botTurn || finished.current) return
    const think = turn === myColor ? 700 + r() * 600 : 450 + (1 - skill) * 800 + r() * 800
    const id = window.setTimeout(() => {
      if (finished.current) return
      const m = botMove(game, turn === myColor ? 0.85 : skill, r)
      if (m) play(m)
    }, think)
    return () => window.clearTimeout(id)
  }, [ticking, turn, skill, r, game, play, autoPlay, online, myColor])

  useEffect(() => {
    const c = cam.current
    c.spectator = spectator
    if (!spectator) c.az = myColor === 'b' ? Math.PI : 0
    else if (!animating) c.az = turn === 'w' ? 0 : Math.PI
  }, [spectator, animating, turn, myColor])

  const legal = useMemo(
    () => (selected ? game.moves({ square: selected as Square, verbose: true }) : []),
    [selected, game, lastMove], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const targets = useMemo(() => legal.map((m) => m.to as string), [legal])
  const captureTargets = useMemo(() => new Set(legal.filter((m) => m.captured).map((m) => m.to as string)), [legal])

  const checkSq = useMemo(() => {
    if (animating || !game.inCheck()) return null
    return units.find((u) => u.type === 'k' && u.color === game.turn())?.square ?? null
  }, [animating, game, units, lastMove]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSquare = useCallback(
    (sq: string) => {
      if (cam.current.dragDist > 8) return
      if (spectator || autoPlay || !ticking || turn !== myColor || myLeft <= 0 || finished.current) return
      const piece = game.get(sq as Square)
      if (selected && targets.includes(sq)) {
        const m = legal.find((x) => x.to === sq && (!x.promotion || x.promotion === 'q'))
        if (m) play(m)
        return
      }
      if (piece && piece.color === myColor) {
        sound('hover')
        setSelected(sq === selected ? null : sq)
      } else setSelected(null)
    },
    [spectator, autoPlay, ticking, turn, myColor, myLeft, game, selected, targets, legal, play, sound],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    cam.current.dragDist = 0
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size !== 2) return
    const c = cam.current
    const [a, b] = [...pointers.current.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (pinch.current && d) c.zoom = Math.min(1.2, Math.max(0.75, c.zoom * (pinch.current / d)))
    pinch.current = d
    c.dragDist += 20
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = 0
  }
  const resetCam = () => {
    cam.current.zoom = 1
    sound('click')
  }

  const saveLocal = (patch: Record<string, string>) => {
    setLocal((cur) => ({ ...cur, ...patch }))
    if (patch.quality) setQuality(resolveQuality(patch.quality))
    arcadePost({ action: 'settings', settings: patch }).catch(() => {})
  }

  const history = game.history()
  const pairs: [string, string | undefined][] = []
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]])

  const historyList = (
    <ol className="space-y-0.5 font-mono text-xs">
      {pairs.length === 0 && <li className="text-foreground/40">Nenhum lance ainda.</li>}
      {pairs.map(([w, b], i) => (
        <li key={i} className={cn('grid grid-cols-[2rem_1fr_1fr] gap-1 px-1', i === pairs.length - 1 && 'bg-foreground/10')}>
          <span className="text-foreground/40">{i + 1}.</span>
          <span className="text-[#f2e3b8]">{w}</span>
          <span className="text-[#ff9a9a]">{b ?? ''}</span>
        </li>
      ))}
    </ol>
  )

  const optionBtn = (active: boolean) =>
    cn('border px-2 py-1.5 text-left transition-colors', active ? 'border-primary text-foreground' : 'border-foreground/15 text-foreground/60 hover:border-foreground/40')

  return (
    <GameFrame
      chat={false}
      title="Living Chess"
      accent={meta.accent}
      onQuit={onQuit}
      top={
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/60 sm:flex">
            <span className="size-2 animate-pulse rounded-full bg-[#ff3b3b]" aria-hidden="true" />
            {start.mode === 'treino' ? 'Treino' : 'Ao vivo'}
          </span>
          <button
            type="button"
            onClick={() => setSpectator((s) => !s)}
            aria-pressed={spectator}
            aria-label="Modo espectador"
            className={cn('grid size-9 place-items-center hover:text-foreground', spectator ? 'text-primary' : 'text-foreground/60')}
          >
            <Eye className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoPlay((v) => !v)
              setSelected(null)
              sound('click')
            }}
            aria-pressed={autoPlay}
            aria-label="IA joga por você"
            title="IA joga por você"
            className={cn('grid size-9 place-items-center hover:text-foreground', autoPlay ? 'text-primary' : 'text-foreground/60')}
          >
            <Bot className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}
            aria-label="Histórico de lances"
            className="grid size-9 place-items-center text-foreground/60 hover:text-foreground lg:hidden"
          >
            <History className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'chat' ? 'none' : 'chat'))}
            aria-label="Chat da partida"
            aria-pressed={panel === 'chat'}
            className={cn('grid size-9 place-items-center hover:text-foreground md:hidden', panel === 'chat' ? 'text-primary' : 'text-foreground/60')}
          >
            <MessageSquare className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'settings' ? 'none' : 'settings'))}
            aria-label="Configurações"
            className="grid size-9 place-items-center text-foreground/60 hover:text-foreground"
          >
            <Settings2 className="size-4" />
          </button>
        </div>
      }
    >
      <div className="relative flex min-h-0 flex-1">
        <div
          className="relative min-h-0 flex-1 touch-none bg-[#0b0d1c]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => {
            cam.current.zoom = Math.min(1.2, Math.max(0.75, cam.current.zoom + e.deltaY * 0.0008))
          }}
        >
          <ClockBackdrop danger={ticking && turn === myColor && myLeft <= 5000} tint={theme.glow} turnKey={`${turn}-${lastMove?.to ?? ''}`} />
          <VersusBar
            white={{
              name: myColor === 'w' ? 'Você' : start.opponent.name,
              court: 'Corte de Marfim',
              portrait: myColor === 'w' ? playerPhoto : null,
              ms: wLeft,
              captures: captures.w,
              active: ticking && turn === 'w',
            }}
            black={{
              name: myColor === 'b' ? 'Você' : start.opponent.name,
              court: 'Corte Crimson',
              portrait: myColor === 'b' ? playerPhoto : null,
              ms: bLeft,
              captures: captures.b,
              active: ticking && turn === 'b',
            }}
            total={clockTotal}
            match={`Partida #${String(start.seed % 1000).padStart(3, '0')}`}
            status={
              spectator
                ? 'Modo espectador'
                : running
                  ? animating
                    ? 'Combate…'
                    : turn === myColor
                      ? myLeft <= 0
                        ? 'Tempo esgotado…'
                        : 'Sua vez — toque numa peça'
                      : `Turno de ${start.opponent.name}`
                  : ''
            }
          />
          <Canvas
            shadows="soft"
            dpr={quality === 'low' ? 1 : quality === 'medium' ? [1, 1.5] : [1, 2]}
            camera={{ position: [0, 9, 9], fov: 40 }}
            gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
            onPointerMissed={() => setSelected(null)}
          >
            <LivingScene
              units={units}
              theme={theme}
              set={set}
              quality={quality}
              animRef={animRef}
              mateRef={mateRef}
              cam={cam}
              selected={selected}
              targets={targets}
              captureTargets={captureTargets}
              lastFrom={lastMove?.from ?? null}
              lastTo={lastMove?.to ?? null}
              checkSq={checkSq}
              onSquare={onSquare}
            />
          </Canvas>

          <button
            type="button"
            onClick={resetCam}
            aria-label="Resetar câmera"
            className="absolute bottom-3 left-3 z-20 grid size-10 place-items-center border border-foreground/20 bg-black/50 text-foreground/70 backdrop-blur hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 overflow-hidden" aria-hidden="true">
            {reactions.map((x) => (
              <span key={x.id} className="devo-react absolute bottom-2 text-2xl" style={{ left: `${x.x}%` }}>
                {x.e}
              </span>
            ))}
          </div>

          {panel === 'settings' && (
            <div className="absolute right-3 top-3 z-30 max-h-[calc(100%-1.5rem)] w-72 overflow-y-auto border border-foreground/20 bg-background/95 p-4 text-xs backdrop-blur">
              <p className="mb-2 uppercase tracking-[0.3em] text-foreground/50">Tabuleiro</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BOARD_THEMES.map((t) => (
                  <button key={t.id} type="button" onClick={() => saveLocal({ chessTheme: t.id })} className={cn(optionBtn(theme.id === t.id), 'flex items-center gap-2')}>
                    <span className="flex shrink-0" aria-hidden="true">
                      <span className="size-3" style={{ background: t.light }} />
                      <span className="size-3" style={{ background: t.dark }} />
                    </span>
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 uppercase tracking-[0.3em] text-foreground/50">Exércitos</p>
              <div className="grid gap-1.5">
                {PIECE_SETS.map((s) => (
                  <button key={s.id} type="button" onClick={() => saveLocal({ pieceSet: s.id })} className={cn(optionBtn(set.id === s.id), 'flex items-center gap-2')}>
                    <span className="flex shrink-0 gap-0.5" aria-hidden="true">
                      <span className="size-3 rounded-full" style={{ background: s.w.cloth }} />
                      <span className="size-3 rounded-full" style={{ background: s.b.cloth }} />
                    </span>
                    {s.name}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 uppercase tracking-[0.3em] text-foreground/50">Gráficos</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ['auto', 'Auto'],
                  ['low', 'Baixo'],
                  ['medium', 'Médio'],
                  ['high', 'Alto'],
                ].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => saveLocal({ quality: k })} className={cn(optionBtn((local.quality ?? 'auto') === k), 'text-center')}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 uppercase tracking-[0.3em] text-foreground/50">Som</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => saveLocal({ sfx: sfx ? 'off' : 'on' })} className={cn(optionBtn(sfx), 'text-center')}>
                  SFX {sfx ? 'ON' : 'OFF'}
                </button>
                <button type="button" onClick={resetCam} className={cn(optionBtn(false), 'text-center')}>
                  Resetar câmera
                </button>
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-foreground/40">A câmera fica fixa atrás das suas peças. Pinça ou roda do mouse ajustam a distância.</p>
            </div>
          )}

          {panel === 'history' && (
            <div className="absolute inset-x-3 bottom-16 z-30 max-h-[45%] overflow-y-auto border border-foreground/20 bg-background/95 p-3 backdrop-blur lg:hidden">
              <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-foreground/50">Lances</p>
              {historyList}
            </div>
          )}

          {ending && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 p-6 backdrop-blur-[2px]" role="status">
              <div className="devo-rise flex flex-col items-center text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-foreground/60">{ending.reason}</p>
                <h2
                  className={cn(
                    'mt-2 font-serif text-5xl uppercase tracking-wider sm:text-6xl',
                    ending.result === 'win' ? 'text-[#e8c35a]' : ending.result === 'loss' ? 'text-[#ff4a4a]' : 'text-foreground',
                  )}
                >
                  {ending.result === 'win' ? 'Vitória' : ending.result === 'loss' ? 'Derrota' : 'Empate'}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-foreground/70">
                  {ending.result === 'draw' ? 'Ninguém cai hoje' : `${ending.result === 'win' ? 'Você' : start.opponent.name} venceu`}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs sm:grid-cols-4">
                  {(
                    [
                      ['Lances', history.length],
                      ['Capturas', captures[myColor]],
                      ['Tempo', `${Math.ceil(myLeft / 1000)}s`],
                      ['Melhor', bestCapture.current ? `+${bestCapture.current}` : '—'],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="flex flex-col items-center">
                      <dt className="text-[9px] uppercase tracking-[0.3em] text-foreground/50">{k}</dt>
                      <dd className="text-lg text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 font-mono text-sm text-[#e8c35a]">+{ending.score} SCORE</p>
              </div>
            </div>
          )}
          <aside
            className="absolute left-3 top-28 z-20 hidden max-h-[45%] w-44 flex-col border border-white/10 bg-black/60 p-3 backdrop-blur-sm lg:flex"
            aria-label="Histórico de lances"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/70">Movimentos</p>
            <div className="min-h-0 flex-1 overflow-y-auto">{historyList}</div>
          </aside>
        </div>

        <aside
          className={cn(
            'flex-col border-foreground/10 bg-background/95 backdrop-blur',
            panel === 'chat' ? 'absolute inset-x-3 bottom-3 top-28 z-30 flex border p-3 md:static md:inset-auto md:z-auto' : 'hidden md:flex',
            'md:w-64 md:shrink-0 md:border-0 md:border-l md:p-4 lg:w-72 xl:w-80',
          )}
          aria-label="Chat da partida"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-foreground/60">Chat da mesa</p>
          <ArcadeChat channel={chatChannel} className="flex-1" />
        </aside>
      </div>

      <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <div className="flex gap-1">
          {REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => react(e)} className="grid size-9 place-items-center text-base opacity-70 transition hover:scale-110 hover:opacity-100" aria-label={`Reagir ${e}`}>
              {e}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!running || spectator}
          onClick={() => (online ? act({ type: 'resign' }) : end('loss', 'VOCÊ DESISTIU'))}
          className="ml-auto border border-[#b3141c]/60 bg-[#3a0a0e]/60 px-5 py-2 font-serif text-[11px] uppercase tracking-[0.35em] text-[#ff6a6a] hover:border-[#ff4a4a] hover:text-[#ff9a9a] disabled:opacity-30"
        >
          Desistir
        </button>
      </div>

      <PopLayer pops={pops} />
      {!running && !finished.current && !gateOpen && <WaitingStart name={start.opponent.name} />}
      {!running && !finished.current && gateOpen && (
        <Countdown321
          onDone={() => {
            turnStart.current = Date.now()
            setNow(Date.now())
            setRunning(true)
          }}
        />
      )}
    </GameFrame>
  )
}
