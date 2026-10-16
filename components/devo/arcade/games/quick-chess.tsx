'use client'

import { liveChannelFor } from '@/lib/devo/arcade/reactions'
import { Canvas } from '@react-three/fiber'
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { Eye, History, MessageSquare, RotateCcw, Settings2, type LucideIcon } from 'lucide-react'
import { ArcadeChat } from '@/components/devo/arcade/arcade-chat'
import { useDeadlyVotes } from '@/components/devo/system/use-deadly-votes'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playSfx, startChessAmbience, stopChessAmbience } from '@/lib/devo/audio'
import { ClockBackdrop } from '../chess/clock-backdrop'
import { arcadePost, type GameProps } from '@/lib/devo/arcade/client'
import { BOARD_THEMES, PIECE_SETS, boardTheme, pieceSet, resolveQuality } from '@/lib/devo/arcade/chess-themes'
import { GAMES } from '@/lib/devo/arcade/games'
import type { Expressao } from '@/lib/devo/npcs'
import { JavaliPortrait } from '../sala-ui'
import { cn } from '@/lib/utils'
import { PlayerPlate } from '../chess/versus-bar'
import { Button, SigilStar } from '@/components/devo/kit'
import { LivingScene, planAnim, type Anim, type CamState, type MateFx, type UnitState } from '../chess/living-board'
import { Countdown321, GameFrame, PopLayer, WaitingStart, usePops, vibrate } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import type { ChessState } from '@/lib/devo/arcade/client'

const meta = GAMES.chess
/** Relógio por lance (mesmo valor da partida online; na demonstração ele não corre). */
const CLOCK_MS = 30_000
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const REACTIONS = ['🔥', '😱', '💀', '👏', '👀']

/**
 * Demonstração guiada (o antigo "tutorial"): não existe partida contra bot no Living Chess
 * (DIRECAO-3 §8). O Javali joga os dois lados de uma partida curta e explica cada lance.
 */
const DEMO: { lan: string; say: string; pose: Expressao }[] = [
  { lan: 'e2e4', say: 'Peão do rei, duas casas. Nas suas partidas, toque numa peça e as casas possíveis acendem no mármore.', pose: 'explica' },
  { lan: 'e7e5', say: 'O preto responde no espelho. Cada lance devolve os trinta segundos ao relógio de quem jogou.', pose: 'pensativo' },
  { lan: 'f1c4', say: 'O bispo corre na diagonal e mira f7, a casa mais frágil do tabuleiro.', pose: 'trama' },
  { lan: 'b8c6', say: 'O cavalo é o único que salta por cima das outras peças.', pose: 'explica' },
  { lan: 'd1h5', say: 'A dama entra cedo. Repare em quem ela ameaça.', pose: 'convite' },
  { lan: 'g8f6', say: 'O preto ataca a dama… e esquece o próprio rei.', pose: 'desdem' },
  { lan: 'h5f7', say: 'Captura com xeque-mate. Na mesa de verdade, quem cai assim perde Tempo.', pose: 'riso' },
]
const DEMO_INTRO = 'Hoje eu jogo pelos dois lados e você só observa, querido. Na mesa valendo Tempo, o adversário é gente.'
const DEMO_FIRST_MS = 2200
const DEMO_STEP_MS = 3400

function initialUnits(g: Chess): UnitState[] {
  const out: UnitState[] = []
  let id = 1
  for (const row of g.board()) for (const p of row) if (p) out.push({ id: id++, type: p.type, color: p.color, square: p.square })
  return out
}

type Ending = { result: 'win' | 'loss' | 'draw'; reason: string; score: number }

/** Botão de ícone do cabeçalho/tabuleiro: 44px, filete de aço quando ativo. */
function ChessIconButton({ icon: Icon, label, active, onClick, className, title }: { icon: LucideIcon; label: string; active?: boolean; onClick: () => void; className?: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      className={cn(
        'dv-focus relative grid size-11 shrink-0 place-items-center transition-[color,transform] duration-[120ms] active:scale-95',
        active ? 'text-white' : 'text-dv-text-3 hover:text-dv-text',
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.4} />
      {active && <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rotate-45 bg-dv-amethyst shadow-[0_0_6px_var(--dv-amethyst)]" />}
    </button>
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
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  const finished = useRef(false)
  const turnStart = useRef(0)
  const clocksRef = useRef(clocks)
  clocksRef.current = clocks
  const capturesRef = useRef(captures)
  capturesRef.current = captures
  const bestCapture = useRef(0)
  const { online, room, act, toLocal } = useRoom(start, 900)
  const gateOpen = useOnlineGate(start)
  const myColor: Color = online && start.side === 'b' ? 'b' : 'w'
  const oppColor: Color = myColor === 'w' ? 'b' : 'w'
  const pending = useRef(false)
  /** Sem sala online = demonstração guiada (o Javali joga os dois lados). */
  const demo = !online
  const [demoStep, setDemoStep] = useState(-1)
  const [demoDone, setDemoDone] = useState(false)
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
      if (demo) {
        sound('reveal')
        window.setTimeout(() => setDemoDone(true), 1500)
        return true
      }
      end(loser === 'b' ? 'win' : 'loss', 'XEQUE-MATE', true)
      return true
    }
    if (game.isDraw() || game.isStalemate()) {
      end('draw', 'EMPATE')
      return true
    }
    return false
  }, [game, end, demo, sound])

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
  const live = (side: Color) => (ticking && turn === side ? Math.max(0, Math.min(clockOf(side), clockOf(side) - (now - turnFrom))) : clockOf(side))
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

  // Demonstração: um lance roteirizado a cada poucos segundos, com a fala do Javali.
  // `apply` muda de identidade quando a sala/mesa re-renderiza; pela ref o temporizador não reinicia.
  const applyRef = useRef(apply)
  applyRef.current = apply
  useEffect(() => {
    if (!demo || demoDone || animating) return
    const next = demoStep + 1
    if (next >= DEMO.length) return
    const id = window.setTimeout(() => {
      const m = game.moves({ verbose: true }).find((x) => x.lan === DEMO[next].lan)
      if (!m) return
      setDemoStep(next)
      applyRef.current(m)
    }, next === 0 ? DEMO_FIRST_MS : DEMO_STEP_MS)
    return () => window.clearTimeout(id)
  }, [demo, demoDone, demoStep, animating, game])

  const replayDemo = () => {
    game.reset()
    mateRef.current = null
    animRef.current = null
    setUnits(initialUnits(game))
    setLastMove(null)
    setCaptures({ w: 0, b: 0 })
    capturesRef.current = { w: 0, b: 0 }
    setDemoStep(-1)
    setDemoDone(false)
    sound('click')
  }

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
      if (demo || spectator || !ticking || turn !== myColor || myLeft <= 0 || finished.current) return
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
    [demo, spectator, ticking, turn, myColor, myLeft, game, selected, targets, legal, play, sound],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const c = cam.current
    c.dragDist = 0
    c.holdUntil = Number.POSITIVE_INFINITY
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const c = cam.current
    if (pointers.current.size === 1) {
      // Arrasto com um dedo: órbita suave em volta do tabuleiro (volta sozinha ao soltar).
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      c.dragDist += Math.abs(dx) + Math.abs(dy)
      if (c.dragDist > 8) {
        c.orbitX = Math.max(-0.95, Math.min(0.95, (c.orbitX ?? 0) - dx * 0.006))
        c.orbitY = Math.max(-0.32, Math.min(0.3, (c.orbitY ?? 0) - dy * 0.004))
      }
      return
    }
    if (pointers.current.size !== 2) return
    const [a, b] = [...pointers.current.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (pinch.current && d) c.zoom = Math.min(1.2, Math.max(0.75, c.zoom * (pinch.current / d)))
    pinch.current = d
    c.dragDist += 20
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = 0
    if (pointers.current.size === 0) cam.current.holdUntil = performance.now() + 900
  }
  const resetCam = () => {
    const c = cam.current
    c.zoom = 1
    c.orbitX = 0
    c.orbitY = 0
    c.holdUntil = 0
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
    <ol className="space-y-0.5 font-mono text-[13px] dv-tabular">
      {pairs.length === 0 && <li className="font-body text-[14px] italic text-dv-text-3">Nenhum lance ainda.</li>}
      {pairs.map(([w, b], i) => (
        <li key={i} className={cn('grid grid-cols-[2rem_1fr_1fr] gap-1 px-1.5 py-0.5', i === pairs.length - 1 && 'bg-dv-ink-4/80 shadow-[inset_2px_0_0_var(--dv-gold)]')}>
          <span className="text-dv-text-3">{i + 1}.</span>
          <span className="text-dv-text">{w}</span>
          <span className="text-dv-text-2">{b ?? ''}</span>
        </li>
      ))}
    </ol>
  )

  const optionBtn = (active: boolean) =>
    cn(
      'dv-focus min-h-11 border px-2.5 py-2 text-left font-display text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-[220ms]',
      active ? 'border-dv-gold-bright bg-dv-ink-4 text-white shadow-[inset_0_-2px_0_var(--dv-amethyst)]' : 'border-dv-line-strong bg-dv-ink/60 text-dv-text-2 hover:border-dv-gold hover:text-dv-text',
    )

  const statusText = demo
    ? ''
    : spectator
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
  const myTurn = running && !animating && turn === myColor && !spectator
  const plate = (side: Color) => ({
    name: demo ? `Javali · ${side === 'w' ? 'brancas' : 'pretas'}` : side === myColor ? 'Você' : start.opponent.name,
    court: side === 'w' ? 'Corte de Marfim' : 'Corte de Ônix',
    color: side,
    portrait: side === myColor ? playerPhoto : null,
    ms: side === 'w' ? wLeft : bLeft,
    captures: captures[side],
    active: demo ? turn === side && !demoDone : ticking && turn === side,
    mine: !demo && side === myColor,
  })

  return (
    <GameFrame
      chat={false}
      title="Living Chess"
      sub={`${demo ? 'Demonstração' : 'Ao vivo'} · #${String(start.seed % 1000).padStart(3, '0')}`}
      accent={meta.accent}
      onQuit={onQuit}
      top={
        <div className="flex items-center">
          <ChessIconButton icon={Eye} label="Modo espectador" active={spectator} onClick={() => setSpectator((s) => !s)} />
          <ChessIconButton icon={MessageSquare} label="Chat da partida" active={panel === 'chat'} onClick={() => setPanel((p) => (p === 'chat' ? 'none' : 'chat'))} className="md:hidden" />
          <ChessIconButton icon={Settings2} label="Configurações" active={panel === 'settings'} onClick={() => setPanel((p) => (p === 'settings' ? 'none' : 'settings'))} />
        </div>
      }
    >
      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ClockBackdrop danger={ticking && turn === myColor && myLeft <= 5000} tint={theme.glow} turnKey={`${turn}-${lastMove?.to ?? ''}`} />
          {/* Oponente no alto, você embaixo: o tabuleiro fica entre as duas plaquetas. */}
          <div className="relative z-20 shrink-0 px-3 pt-2.5">
            <PlayerPlate side={plate(oppColor)} total={clockTotal} />
          </div>
          {demo && (
            <div className="relative z-20 shrink-0 px-3 pt-2" aria-live="polite">
              <div className="flex items-center gap-3 border border-dv-line-gold bg-[linear-gradient(180deg,rgba(28,28,31,0.94),rgba(14,14,16,0.94))] py-2 pl-2 pr-3 shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
                <JavaliPortrait pose={demoStep >= 0 ? DEMO[demoStep].pose : 'convite'} shape="round" className="size-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="dv-label text-[10px] text-dv-gold">
                    Javali · {demoStep >= 0 ? `lance ${demoStep + 1} de ${DEMO.length}` : 'demonstração'}
                  </p>
                  <p key={demoStep} className="mt-0.5 animate-dv-fade font-body text-[15px] leading-snug text-dv-text">
                    {demoStep >= 0 ? DEMO[demoStep].say : DEMO_INTRO}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div
            className="relative min-h-0 flex-1 touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) => {
              cam.current.zoom = Math.min(1.2, Math.max(0.75, cam.current.zoom + e.deltaY * 0.0008))
            }}
          >
            <Canvas
              shadows="soft"
              dpr={quality === 'low' ? 1 : quality === 'medium' ? [1, 1.5] : [1, 2]}
              camera={{ position: [0, 9, 9], fov: 40 }}
              gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
              onPointerMissed={() => setSelected(null)}
              onCreated={({ gl, setDpr }) => {
                // Renderizador por software (SwiftShader/llvmpipe): qualidade baixa e DPR 0,75, como as cenas do kit.
                try {
                  const ctx = gl.getContext()
                  const ext = ctx.getExtension('WEBGL_debug_renderer_info')
                  const name = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
                  if (/swiftshader|llvmpipe|software/i.test(name)) {
                    setQuality('low')
                    setDpr(0.75)
                  }
                } catch {}
              }}
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

            {statusText && (
              <p
                key={statusText}
                className={cn(
                  'pointer-events-none absolute inset-x-0 top-2 z-20 flex animate-dv-fade items-center justify-center gap-2 text-center',
                  myTurn ? 'text-white' : 'text-dv-text-3',
                )}
                role="status"
              >
                <SigilStar className={cn('size-2.5', myTurn ? 'text-dv-amethyst' : 'text-dv-gold/60')} />
                <span className="dv-label text-[10px] tracking-[0.2em] [text-shadow:0_1px_6px_#000]">{statusText}</span>
                <SigilStar className={cn('size-2.5', myTurn ? 'text-dv-amethyst' : 'text-dv-gold/60')} />
              </p>
            )}

            <ChessIconButton icon={RotateCcw} label="Resetar câmera" onClick={resetCam} className="absolute bottom-2 left-2 z-20 border border-dv-line-strong bg-dv-ink/70 backdrop-blur-sm" />
            <ChessIconButton
              icon={History}
              label="Histórico de lances"
              active={panel === 'history'}
              onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}
              className="absolute bottom-2 right-2 z-20 border border-dv-line-strong bg-dv-ink/70 backdrop-blur-sm lg:hidden"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 overflow-hidden" aria-hidden="true">
              {reactions.map((x) => (
                <span key={x.id} className="devo-react absolute bottom-2 text-2xl" style={{ left: `${x.x}%` }}>
                  {x.e}
                </span>
              ))}
            </div>

            {panel === 'history' && (
              <div className="bg-[linear-gradient(180deg,#1c1c1f,#0e0e10)] absolute inset-x-3 bottom-14 z-30 max-h-[55%] animate-dv-rise overflow-y-auto border border-dv-line-gold p-3 lg:hidden">
                <p className="dv-label mb-2 text-[10px] text-dv-gold">Lances</p>
                {historyList}
              </div>
            )}

            <aside className="bg-[linear-gradient(180deg,#1c1c1f,#0e0e10)] absolute left-3 top-10 z-20 hidden max-h-[60%] w-48 flex-col border border-dv-line-gold p-3 lg:flex" aria-label="Histórico de lances">
              <p className="dv-label mb-2 text-[10px] text-dv-gold">Movimentos</p>
              <div className="min-h-0 flex-1 overflow-y-auto">{historyList}</div>
            </aside>
          </div>
          <div className="relative z-20 shrink-0 px-3 pb-1">
            <PlayerPlate side={plate(myColor)} total={clockTotal} />
          </div>

          {panel === 'settings' && (
            <div className="bg-[linear-gradient(180deg,#1c1c1f,#0e0e10)] absolute right-3 top-2 z-40 max-h-[calc(100%-1rem)] w-[min(19rem,calc(100%-1.5rem))] animate-dv-rise overflow-y-auto border border-dv-line-gold p-4">
              <p className="dv-label mb-2 text-[10px] text-dv-gold">Tabuleiro</p>
              <div className="grid grid-cols-3 gap-1.5">
                {BOARD_THEMES.map((t) => (
                  <button key={t.id} type="button" aria-pressed={theme.id === t.id} onClick={() => saveLocal({ chessTheme: t.id })} className={cn(optionBtn(theme.id === t.id), 'flex flex-col items-start gap-1.5')}>
                    <span className="flex shrink-0 border border-dv-gold/60" aria-hidden="true">
                      <span className="size-3.5" style={{ background: t.light }} />
                      <span className="size-3.5" style={{ background: t.dark }} />
                    </span>
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="dv-label mb-2 mt-4 text-[10px] text-dv-gold">Exércitos</p>
              <div className="grid gap-1.5">
                {PIECE_SETS.map((s) => (
                  <button key={s.id} type="button" aria-pressed={set.id === s.id} onClick={() => saveLocal({ pieceSet: s.id })} className={cn(optionBtn(set.id === s.id), 'flex items-center gap-2.5')}>
                    <span className="flex shrink-0 gap-0.5" aria-hidden="true">
                      <span className="size-3.5 rotate-45 border border-dv-gold/60" style={{ background: s.w.body }} />
                      <span className="size-3.5 rotate-45 border border-dv-gold/60" style={{ background: s.b.body }} />
                    </span>
                    {s.name}
                  </button>
                ))}
              </div>
              <p className="dv-label mb-2 mt-4 text-[10px] text-dv-gold">Gráficos</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ['auto', 'Auto'],
                  ['low', 'Baixo'],
                  ['medium', 'Médio'],
                  ['high', 'Alto'],
                ].map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={(local.quality ?? 'auto') === k} onClick={() => saveLocal({ quality: k })} className={cn(optionBtn((local.quality ?? 'auto') === k), 'px-1 text-center tracking-[0.06em]')}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="dv-label mb-2 mt-4 text-[10px] text-dv-gold">Som</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" aria-pressed={sfx} onClick={() => saveLocal({ sfx: sfx ? 'off' : 'on' })} className={cn(optionBtn(sfx), 'text-center')}>
                  SFX {sfx ? 'ON' : 'OFF'}
                </button>
                <button type="button" onClick={resetCam} className={cn(optionBtn(false), 'text-center')}>
                  Resetar câmera
                </button>
              </div>
              <p className="mt-4 font-body text-[14px] leading-snug text-dv-text-3">Arraste para girar a mesa (ela volta sozinha ao seu assento). Pinça ou roda do mouse ajustam a distância.</p>
            </div>
          )}

          {demo && demoDone && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-dv-ink/70 p-6 backdrop-blur-[2px]" role="status">
              <div className="flex w-full max-w-sm animate-dv-cut-in flex-col items-center gap-4 text-center">
                <p className="dv-label text-[10px] text-dv-gold">Xeque-mate em {DEMO.length} lances</p>
                <h2 className="-skew-x-[8deg] font-impact text-[44px] font-semibold uppercase leading-none tracking-[0.04em] text-white">Demonstração concluída</h2>
                <p className="font-body text-[16px] leading-relaxed text-dv-text-2">Na mesa de verdade você enfrenta outro jogador, com trinta segundos por lance. Toque em “Jogar” no cartaz do Living Chess para entrar na fila.</p>
                <div className="flex w-full flex-col gap-2">
                  <Button variant="primary" block onClick={onQuit}>
                    Voltar à mesa
                  </Button>
                  <Button variant="secondary" block onClick={replayDemo}>
                    Rever
                  </Button>
                </div>
              </div>
            </div>
          )}
          {ending && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-dv-ink/70 p-6 backdrop-blur-[2px]" role="status">
              <div className="flex w-full max-w-sm animate-dv-cut-in flex-col items-center text-center">
                <p className="dv-label text-[10px] text-dv-gold">{ending.reason}</p>
                <span aria-hidden="true" className="mt-3 h-px w-28 bg-gradient-to-r from-transparent via-dv-gold/70 to-transparent" />
                <h2
                  className={cn(
                    'mt-3 font-impact text-[56px] font-semibold uppercase leading-none tracking-[0.06em]',
                    ending.result === 'win' ? 'dv-brass-text' : ending.result === 'loss' && online ? 'text-dv-blood-text' : 'text-white',
                  )}
                >
                  {ending.result === 'win' ? 'Vitória' : ending.result === 'loss' ? 'Derrota' : 'Empate'}
                </h2>
                <p className="dv-label mt-2 text-[10px] text-dv-text-2">
                  {ending.result === 'draw' ? 'Ninguém cai hoje' : `${ending.result === 'win' ? 'Você' : start.opponent.name} venceu`}
                </p>
                <dl className="bg-[linear-gradient(180deg,#1c1c1f,#0e0e10)] mt-5 grid w-full grid-cols-4 gap-1 border border-dv-line-gold px-2 py-3">
                  {(
                    [
                      ['Lances', history.length],
                      ['Capturas', captures[myColor]],
                      ['Tempo', `${Math.ceil(myLeft / 1000)}s`],
                      ['Melhor', bestCapture.current ? `+${bestCapture.current}` : '—'],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="flex flex-col items-center gap-1">
                      <dt className="dv-label text-[10px] tracking-[0.12em] text-dv-text-3">{k}</dt>
                      <dd className="font-impact text-[22px] font-semibold leading-none text-white dv-tabular">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 font-impact text-[20px] font-semibold tracking-[0.08em] text-dv-gold-bright dv-tabular">+{ending.score} SCORE</p>
              </div>
            </div>
          )}
        </div>

        <aside
          className={cn(
            'flex-col border-dv-line',
            panel === 'chat' ? 'bg-[linear-gradient(180deg,#1c1c1f,#0e0e10)] absolute inset-x-3 bottom-3 top-16 z-30 flex border border-dv-line-gold p-3 md:static md:inset-auto md:z-auto' : 'hidden md:flex',
            'md:w-64 md:shrink-0 md:border-0 md:border-l md:bg-dv-ink-2/90 md:p-4 lg:w-72 xl:w-80',
          )}
          aria-label="Chat da partida"
        >
          <p className="dv-label mb-3 text-[10px] text-dv-gold">Chat da mesa</p>
          <ArcadeChat channel={chatChannel} className="flex-1" />
        </aside>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1 border-t border-dv-line bg-dv-ink/80 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
        <div className="flex">
          {REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => react(e)} className="dv-focus grid size-11 place-items-center text-[20px] opacity-75 grayscale-[0.35] transition hover:scale-110 hover:opacity-100 hover:grayscale-0 active:scale-95" aria-label={`Reagir ${e}`}>
              {e}
            </button>
          ))}
        </div>
        {demo ? (
          <Button variant="secondary" size="sm" className="ml-auto" onClick={onQuit}>
            Sair
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            className="ml-auto"
            disabled={!running || spectator}
            onClick={() => (online ? act({ type: 'resign' }) : end('loss', 'VOCÊ DESISTIU'))}
          >
            Desistir
          </Button>
        )}
      </div>

      <PopLayer pops={pops} />
      {!demo && !running && !finished.current && !gateOpen && <WaitingStart name={start.opponent.name} />}
      {!demo && !running && !finished.current && gateOpen && (
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
