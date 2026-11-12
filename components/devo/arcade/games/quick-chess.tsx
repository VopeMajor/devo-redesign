'use client'

import { liveChannelFor } from '@/lib/devo/arcade/reactions'
import { Canvas } from '@react-three/fiber'
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { ArcadeChat } from '@/components/devo/arcade/arcade-chat'
import { useDeadlyVotes } from '@/components/devo/system/use-deadly-votes'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { playSfx, startChessAmbience, stopChessAmbience } from '@/lib/devo/audio'
import { ClockBackdrop } from '../chess/clock-backdrop'
import { arcadePost, type GameProps } from '@/lib/devo/arcade/client'
import { BOARD_THEMES, PIECE_SETS, boardTheme, pieceSet, resolveQuality } from '@/lib/devo/arcade/chess-themes'
import { GAMES } from '@/lib/devo/arcade/games'
import type { Expressao } from '@/lib/devo/npcs'
import { LivingScene, planAnim, type Anim, type CamState, type MateFx, type UnitState } from '../chess/living-board'
import { usePops, vibrate, type PopTone } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import { Desistir, PartidaV2, Sincronizando, mmss } from '../v2-partida'
import type { ChessState } from '@/lib/devo/arcade/client'
import './quick-chess-v2.css'

/*
 * Living Chess no visual do v2 (protótipo aprovado: docs/redesign/v2/kit3/art-src/xadrez-3d-entrada.tsx,
 * estilo .xz* em components/v2/os.css). A cena 3D é a mesma do jogo (components/devo/arcade/chess/*), com
 * desenho sob demanda e queda automática de qualidade. O que o protótipo simulava (oponente, chat) aqui é o
 * de verdade: servidor da sala, relógio do servidor e chat da partida.
 */

const meta = GAMES.chess
/** 10 minutos por jogador; o relógio de cada um só corre na própria vez. */
const CLOCK_MS = 600_000
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const ARTE = '/v2/art/os'
/** Reações da barra de baixo (as mesmas do protótipo, em pixel). Aparecem só na sua tela, como antes. */
const REACOES = [
  { id: 'fogo', img: `${ARTE}/memory/s8.png`, nome: 'Fogo' },
  { id: 'caveira', img: `${ARTE}/memory/s0.png`, nome: 'Caveira' },
  { id: 'olho', img: `${ARTE}/memory/s9.png`, nome: 'De olho' },
  { id: 'coroa', img: `${ARTE}/memory/s1.png`, nome: 'Coroa' },
  { id: 'chama', img: `${ARTE}/memory/s7.png`, nome: 'Ousadia' },
]
/** Tons dos avisos do HUD → classes do protótipo (.mr-pop). */
const TOM: Record<PopTone, string> = { gold: '', amethyst: 'violeta', red: 'perigo', white: 'neutro' }
/** Motivo do fim vindo do servidor → texto da tela (o "você"/"oponente" depende de quem venceu). */
function motivo(raw: string, won: boolean) {
  if (raw === 'tempo') return won ? 'Tempo do oponente esgotou' : 'Tempo esgotado'
  if (raw === 'xeque-mate') return 'Xeque-mate'
  if (raw === 'desistência') return won ? 'Oponente desistiu' : 'Você desistiu'
  if (raw === 'abandono') return won ? 'Oponente abandonou' : 'Abandono'
  if (raw === 'empate') return 'Empate'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
/** Peças da promoção (o servidor aceita q/r/b/n); o seletor de variação U+FE0E força o glifo de texto, não o emoji. */
const PROMO_PIECES: [PieceSymbol, string, string][] = [
  ['q', 'Dama', '♛︎'],
  ['r', 'Torre', '♜︎'],
  ['b', 'Bispo', '♝︎'],
  ['n', 'Cavalo', '♞︎'],
]

/**
 * Demonstração guiada (o antigo "tutorial"): não existe partida contra bot no Living Chess
 * (DIRECAO-3 §8). O Javali joga os dois lados de uma partida curta e explica cada lance.
 */
const DEMO: { lan: string; say: string; pose: Expressao }[] = [
  { lan: 'e2e4', say: 'Peão do rei, duas casas. Nas suas partidas, toque numa peça e as casas possíveis acendem no mármore.', pose: 'explica' },
  { lan: 'e7e5', say: 'O preto responde no espelho. Cada um tem dez minutos no relógio, e ele só corre na sua vez.', pose: 'pensativo' },
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

/** 3 · 2 · 1 · JÁ em dígitos grandes de bronze (mesmo ritmo da contagem antiga). */
function Contagem({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = [1, 2, 3].map((i) => window.setTimeout(() => setN(3 - i), i * 650))
    t.push(window.setTimeout(() => done.current(), 3 * 650 + 400))
    return () => t.forEach(clearTimeout)
  }, [])
  return (
    <div className="mr-conta" role="status" aria-label={n ? String(n) : 'Já'}>
      <b key={n}>{n || 'JÁ'}</b>
    </div>
  )
}

export default function QuickChess({ start, settings, onFinish, onQuit }: GameProps) {
  const game = useMemo(() => new Chess(), [])
  const [units, setUnits] = useState<UnitState[]>(() => initialUnits(game))
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [clocks, setClocks] = useState({ w: CLOCK_MS, b: CLOCK_MS })
  const [captures, setCaptures] = useState({ w: 0, b: 0 })
  const [local, setLocal] = useState(settings)
  const [panel, setPanel] = useState<'' | 'ajustes' | 'lances' | 'chat'>('')
  const { record } = useDeadlyVotes()
  const playerPhoto = record?.avatarVersion ? `/api/record/avatar?v=${record.avatarVersion}` : null
  const chatChannel = liveChannelFor(start)
  const [spectator, setSpectator] = useState(false)
  const [ending, setEnding] = useState<Ending | null>(null)
  /** Lances de promoção à espera da escolha da peça. */
  const [promo, setPromo] = useState<Move[] | null>(null)
  /** Online: confirmação antes de desistir (conta como derrota). */
  const [askResign, setAskResign] = useState(false)
  const [reactions, setReactions] = useState<{ id: number; img: string; x: number }[]>([])
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
  const { online, room, act, toLocal, lost } = useRoom(start, 900)
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


  const react = useCallback((img?: string) => {
    const pick = img ?? REACOES[Math.floor(Math.random() * REACOES.length)].img
    const id = Date.now() + Math.random()
    setReactions((list) => [...list.slice(-6), { id, img: pick, x: 10 + Math.random() * 80 }])
    window.setTimeout(() => setReactions((list) => list.filter((x) => x.id !== id)), 1800)
  }, [])

  /** Temporizadores do fim (faixa e resultado): limpos ao desmontar, senão o resultado reaparecia depois de sair. */
  const endTimers = useRef<number[]>([])
  useEffect(() => () => endTimers.current.forEach((id) => window.clearTimeout(id)), [])
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

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
      endTimers.current.push(
        window.setTimeout(() => setEnding({ result, reason, score }), mate ? 1300 : 300),
        window.setTimeout(
          () =>
            onFinishRef.current({
              result,
              score,
              oppScore: (result === 'loss' ? 600 : result === 'draw' ? 200 : 0) + cap.b * 10,
              bonus: timeBonus,
              bonusLabel: 'TEMPO RESTANTE',
              stats: { moves: game.history().length, captured: cap.w, lost: cap.b, best: bestCapture.current },
            }),
          mate ? 4200 : 3000,
        ),
      )
    },
    [game, sound, online],
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
      end(loser === 'b' ? 'win' : 'loss', 'Xeque-mate', true)
      return true
    }
    if (game.isDraw() || game.isStalemate()) {
      end('draw', 'Empate')
      return true
    }
    return false
  }, [game, end, demo, sound])

  const apply = useCallback(
    (m: Move) => {
      if (animRef.current || finished.current) return
      const by = game.turn()
      const gasto = Date.now() - turnStart.current
      const nextClocks = { ...clocksRef.current, [by]: Math.max(0, clocksRef.current[by] - (turnStart.current ? gasto : 0)) }
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
          if (captured === 'q') push(by === myColor ? 'Dama abatida' : 'Sua dama caiu', by === myColor ? 'gold' : 'red', 1400)
          else if (VALUE[captured] >= 3) push('Captura', by === myColor ? 'gold' : 'red', 900)
          if (Math.random() < 0.6) react()
        }, anim.impact * 1000)
      }
      if (m.promotion)
        window.setTimeout(() => {
          sound('reveal')
          push('Promoção', by === myColor ? 'gold' : 'red', 1100)
        }, (anim.dur - 0.5) * 1000)
      if (rook) push('Roque', 'white', 900)

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
            push('Xeque', by === myColor ? 'gold' : 'red', 900)
            react(REACOES[2].img)
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
      // Só o último lance é animado; atrasado em mais de um (ex.: ao voltar para a partida), o tabuleiro
      // é reconstruído de uma vez em vez de reanimar lance por lance com o relógio correndo.
      const next = consistent && s.moves.length - local.length === 1 ? game.moves({ verbose: true }).find((m) => m.lan === s.moves[local.length]) : undefined
      if (next) {
        apply(next)
        return
      }
      // Depois de reconstruir, segue para o fim: com a sala encerrada a consulta para e o efeito não roda de novo.
      resync(s)
    } else if (s.moves.length < local.length) {
      if (pending.current) return
      resync(s)
    }
    if (room.status !== 'finished' || finished.current) return
    finished.current = true
    setRunning(false)
    setSelected(null)
    const mine = room.result?.mine
    const result = (mine?.result ?? 'draw') as Ending['result']
    const raw = room.result?.reason ?? ''
    const won = result === 'win'
    const reason = motivo(raw, won)
    const mate = raw === 'xeque-mate'
    sound(won ? 'reveal' : result === 'loss' ? 'error' : 'notify')
    vibrate(won ? [30, 40, 60] : 80)
    endTimers.current.push(
      window.setTimeout(() => setEnding({ result, reason, score: mine?.score ?? 0 }), mate ? 1300 : 300),
      window.setTimeout(() => onFinishRef.current(roomOutcome(room)), mate ? 4200 : 3000),
    )
  }, [online, room, animating, game, apply, resync, sound])

  // O relógio só redesenha a tela quando o segundo de quem joga muda (e cai certinho no zero).
  const leftAt = useRef<(t: number) => number>(() => 1000)
  useEffect(() => {
    if (!running || animating) return
    let id = 0
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const rest = leftAt.current(t)
      id = window.setTimeout(tick, rest > 0 ? (rest % 1000 || 1000) + 5 : 1000)
    }
    tick()
    return () => window.clearTimeout(id)
  }, [running, animating])

  const turn = game.turn()
  const ticking = running && !animating
  // chess.js refaz a partida inteira (com geração de lances) a cada history(): calcula só quando o tabuleiro muda, não a cada tique do relógio.
  const history = useMemo(() => game.history(), [game, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  const plies = history.length
  const serverState = online && room && room.status !== 'waiting' ? (room.state as ChessState) : null
  const synced = !!serverState?.moves && serverState.moves.length === plies
  const clockOf = (side: Color) => (synced && serverState ? serverState.clock[side === 'w' ? 'a' : 'b'] : clocks[side])
  const turnFrom = synced && serverState ? toLocal(serverState.turnAt) : turnStart.current
  const live = (side: Color) => (ticking && turn === side ? Math.max(0, Math.min(clockOf(side), clockOf(side) - (now - turnFrom))) : clockOf(side))
  leftAt.current = (t) => Math.max(0, Math.min(clockOf(turn), clockOf(turn) - (t - turnFrom)))
  const wLeft = live('w')
  const bLeft = live('b')
  const myLeft = myColor === 'w' ? wLeft : bLeft
  const oppLeft = myColor === 'w' ? bLeft : wLeft

  useEffect(() => {
    if (!ticking) return
    if (myLeft <= 0) end('loss', 'Tempo esgotado')
    else if (oppLeft <= 0) end('win', 'Tempo do oponente esgotou')
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
    setTick((t) => t + 1)
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
        const options = legal.filter((x) => x.to === sq)
        // Peão chegando ao fim: o jogador escolhe a peça (dama, torre, bispo ou cavalo).
        if (options.some((x) => x.promotion)) {
          sound('hover')
          setPromo(options.filter((x) => x.promotion))
          return
        }
        const m = options[0]
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

  // O relógio redesenha a tela a cada segundo e `onSquare` muda junto (depende do tempo restante).
  // A cena 3D recebe uma função estável e só é refeita quando algo dela muda de verdade.
  const onSquareRef = useRef(onSquare)
  onSquareRef.current = onSquare
  const onSquareStable = useCallback((sq: string) => onSquareRef.current(sq), [])
  const clearSelection = useCallback(() => setSelected(null), [])

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

  // Com gráficos em automático, se o aparelho não der conta a cena desce para a qualidade baixa sozinha.
  const autoQuality = !local.quality || local.quality === 'auto'
  const dropQuality = useCallback(() => setQuality('low'), [])

  const saveLocal = (patch: Record<string, string>) => {
    setLocal((cur) => ({ ...cur, ...patch }))
    if (patch.quality) setQuality(resolveQuality(patch.quality))
    arcadePost({ action: 'settings', settings: patch }).catch(() => {})
  }

  const sfxOn = () => saveLocal({ sfx: sfx ? 'off' : 'on' })

  const pairs: [string, string | undefined][] = []
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]])

  const historyList = (
    <ol className="xz-lances">
      {pairs.length === 0 && <li className="xz-vazio">Nenhum lance ainda.</li>}
      {pairs.map(([w, b], i) => (
        <li key={i} className={i === pairs.length - 1 ? 'on' : undefined}>
          <i>{i + 1}.</i>
          <span>{w}</span>
          <span>{b ?? ''}</span>
        </li>
      ))}
    </ol>
  )
  /** Chat da mesa: o mesmo canal da partida de antes (ArcadeChat, memoizado), no lugar do chat do protótipo. */
  const chatMesa = <ArcadeChat channel={chatChannel} className="xz-conversa" placeholder="Escreva para a mesa" emptyText="A mesa está em silêncio." />

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
              : 'Sua vez · toque numa peça'
            : `Turno de ${start.opponent.name}`
        : ''
  const myTurn = running && !animating && turn === myColor && !spectator
  useEffect(() => {
    if (!myTurn) setPromo(null)
  }, [myTurn])
  const choosePromo = (m: Move) => {
    setPromo(null)
    if (demo || spectator || !ticking || turn !== myColor || myLeft <= 0 || finished.current) return
    play(m)
  }
  const resign = () => {
    setAskResign(false)
    if (online) act({ type: 'resign' })
    else end('loss', 'Você desistiu')
  }

  /** Plaqueta de um lado (protótipo .xz-pl): rosto, nome, corte e material, relógio e régua. */
  const plaqueta = (side: Color) => {
    const ativo = demo ? turn === side && !demoDone : ticking && turn === side
    const ms = side === 'w' ? wLeft : bLeft
    const mine = !demo && side === myColor
    const nome = demo ? `Javali · ${side === 'w' ? 'brancas' : 'pretas'}` : mine ? 'Você' : start.opponent.name
    const perigo = ativo && ms <= 5000
    const foto = mine ? playerPhoto : null
    return (
      <div className={['xz-pl', ativo && 'ativo', mine && 'eu', perigo && 'perigo'].filter(Boolean).join(' ')}>
        <i className={`xz-pl-rosto ${side}`} aria-hidden="true">
          {foto ? <img src={foto} alt="" /> : nome.trim().charAt(0).toUpperCase() || '?'}
        </i>
        <div className="xz-pl-nome">
          <b>{nome}</b>
          <small>
            {side === 'w' ? 'Corte de Marfim' : 'Corte de Ônix'}
            {captures[side] > 0 && <em> +{captures[side]}</em>}
          </small>
        </div>
        <b className="xz-pl-rel" role="timer" aria-label={`Relógio de ${nome}`}>
          {mmss(ms)}
        </b>
        <u className="xz-pl-regua" aria-hidden="true">
          <s style={{ transform: `scaleX(${(ativo ? Math.max(0, Math.min(1, ms / CLOCK_MS)) : 1).toFixed(4)})` }} />
        </u>
      </div>
    )
  }
  const opcao = (on: boolean) => (on ? 'chanfro xz-op on' : 'chanfro xz-op')
  const alterna = (p: 'ajustes' | 'lances' | 'chat') => setPanel((cur) => (cur === p ? '' : p))

  return (
    <PartidaV2
      className="xz"
      label={meta.name}
      onQuit={onQuit}
      confirmQuit={online && !ending && room?.status !== 'finished' && room?.status !== 'cancelled'}
      connLost={lost}
    >
      {({ sair }) => (
        <>
          <div className="xz-pc">
            <div className="xz-central">
              <ClockBackdrop danger={ticking && turn === myColor && myLeft <= 5000} tint={theme.glow} turnKey={`${turn}-${lastMove?.to ?? ''}`} quality={quality} />
              <header className="xz-topo">
                <button type="button" className="chanfro xz-ic" aria-label="Desistir e sair" title="Sair da partida" onClick={sair}>
                  ×
                </button>
                <div className="xz-tit">
                  <b>Living Chess</b>
                  <small>{demo ? 'Demonstração' : 'Ao vivo'}</small>
                </div>
                <button
                  type="button"
                  className={spectator ? 'chanfro xz-ic on' : 'chanfro xz-ic'}
                  aria-pressed={spectator}
                  aria-label="Modo espectador"
                  title="Modo espectador"
                  onClick={() => setSpectator((s) => !s)}
                >
                  <img src={`${ARTE}/memory/s9.png`} alt="" />
                </button>
                <button
                  type="button"
                  className={panel === 'lances' ? 'chanfro xz-ic xz-so-cel on' : 'chanfro xz-ic xz-so-cel'}
                  aria-pressed={panel === 'lances'}
                  aria-label="Histórico de lances"
                  title="Histórico de lances"
                  onClick={() => alterna('lances')}
                >
                  <span aria-hidden="true">≡</span>
                </button>
                <button
                  type="button"
                  className={panel === 'chat' ? 'chanfro xz-ic xz-so-cel on' : 'chanfro xz-ic xz-so-cel'}
                  aria-pressed={panel === 'chat'}
                  aria-label="Chat da mesa"
                  title="Chat da mesa"
                  onClick={() => alterna('chat')}
                >
                  <span aria-hidden="true">✉</span>
                </button>
                <button
                  type="button"
                  className={panel === 'ajustes' ? 'chanfro xz-ic on' : 'chanfro xz-ic'}
                  aria-pressed={panel === 'ajustes'}
                  aria-label="Configurações"
                  title="Configurações"
                  onClick={() => alterna('ajustes')}
                >
                  <span aria-hidden="true">⚙</span>
                </button>
              </header>
              {/* Oponente no alto, você embaixo: o tabuleiro fica entre as duas plaquetas. */}
              <div className="xz-faixa">{plaqueta(oppColor)}</div>
              {demo && (
                <div className="xz-demo" aria-live="polite">
                  <span className="xz-rosto" aria-hidden="true">
                    <img src={`${ARTE}/npc/javali-${demoStep >= 0 ? DEMO[demoStep].pose : 'convite'}.png`} alt="" />
                  </span>
                  <p key={demoStep}>
                    <small>Javali · {demoStep >= 0 ? `lance ${demoStep + 1} de ${DEMO.length}` : 'demonstração'}</small>
                    {demoStep >= 0 ? DEMO[demoStep].say : DEMO_INTRO}
                  </p>
                </div>
              )}
              <div
                className="xz-cena"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={(e) => {
                  cam.current.zoom = Math.min(1.2, Math.max(0.75, cam.current.zoom + e.deltaY * 0.0008))
                }}
              >
                <Canvas
                  shadows="percentage"
                  frameloop="demand"
                  dpr={quality === 'low' ? 1 : quality === 'medium' ? [1, 1.5] : [1, 2]}
                  camera={{ position: [0, 9, 9], fov: 40 }}
                  gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
                  onPointerMissed={clearSelection}
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
                    onSquare={onSquareStable}
                    onSlow={autoQuality ? dropQuality : undefined}
                  />
                </Canvas>
                {statusText && (
                  <p key={statusText} className={myTurn ? 'xz-estado on' : 'xz-estado'} role="status">
                    {statusText}
                  </p>
                )}
                <div className="xz-reacoes" aria-hidden="true">
                  {reactions.map((r) => (
                    <img key={r.id} src={r.img} alt="" style={{ left: `${r.x}%` }} />
                  ))}
                </div>
                <div className="mr-pops" aria-live="polite">
                  {pops.map((p) => (
                    <p key={p.id} className={TOM[p.tone] ? `mr-pop ${TOM[p.tone]}` : 'mr-pop'}>
                      {p.text}
                    </p>
                  ))}
                </div>
                {promo && (
                  <div className="xz-promo" role="dialog" aria-label="Promoção do peão">
                    <h4>Promover o peão a</h4>
                    <div className="xz-ops q4">
                      {PROMO_PIECES.map(([p, name, glyph]) => {
                        const m = promo.find((x) => x.promotion === p)
                        if (!m) return null
                        return (
                          <button key={p} type="button" className={opcao(p === 'q')} onClick={() => choosePromo(m)}>
                            <span aria-hidden="true">{glyph}</span>
                            {name}
                          </button>
                        )
                      })}
                    </div>
                    <button type="button" className="chanfro xz-op xz-larga" onClick={() => setPromo(null)}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              <div className="xz-faixa">{plaqueta(myColor)}</div>
              <footer className="xz-base">
                <div className="xz-bt-reacoes">
                  {REACOES.map((r) => (
                    <button key={r.id} type="button" className="chanfro" aria-label={`Reagir: ${r.nome}`} onClick={() => react(r.img)}>
                      <img src={r.img} alt="" />
                    </button>
                  ))}
                </div>
                {demo ? (
                  <button type="button" className="chanfro xz-sair" onClick={onQuit}>
                    Sair
                  </button>
                ) : (
                  <button type="button" className="chanfro xz-sair perigo" disabled={!running || spectator} onClick={() => (online ? setAskResign(true) : resign())}>
                    Desistir
                  </button>
                )}
              </footer>
              {panel && (
                <div
                  className={panel === 'chat' ? 'xz-painel fundo conversa' : 'xz-painel fundo'}
                  role="dialog"
                  aria-label={panel === 'lances' ? 'Lances' : panel === 'chat' ? 'Chat da mesa' : 'Configurações'}
                >
                  {panel === 'lances' && (
                    <>
                      <h4>Lances</h4>
                      {historyList}
                    </>
                  )}
                  {panel === 'chat' && (
                    <>
                      <h4>Chat da mesa</h4>
                      {chatMesa}
                    </>
                  )}
                  {panel === 'ajustes' && (
                    <>
                      <h4>Tabuleiro</h4>
                      <div className="xz-ops">
                        {BOARD_THEMES.map((t) => (
                          <button key={t.id} type="button" className={opcao(theme.id === t.id)} aria-pressed={theme.id === t.id} onClick={() => saveLocal({ chessTheme: t.id })}>
                            <span className="xz-am" aria-hidden="true">
                              <i style={{ background: t.light }} />
                              <i style={{ background: t.dark }} />
                            </span>
                            {t.name}
                          </button>
                        ))}
                      </div>
                      <h4>Exércitos</h4>
                      <div className="xz-ops">
                        {PIECE_SETS.map((s) => (
                          <button key={s.id} type="button" className={opcao(set.id === s.id)} aria-pressed={set.id === s.id} onClick={() => saveLocal({ pieceSet: s.id })}>
                            <span className="xz-am" aria-hidden="true">
                              <i style={{ background: s.w.body }} />
                              <i style={{ background: s.b.body }} />
                            </span>
                            {s.name}
                          </button>
                        ))}
                      </div>
                      <h4>Gráficos</h4>
                      <div className="xz-ops q4">
                        {[
                          ['auto', 'Auto'],
                          ['low', 'Baixo'],
                          ['medium', 'Médio'],
                          ['high', 'Alto'],
                        ].map(([k, l]) => (
                          <button key={k} type="button" className={opcao((local.quality ?? 'auto') === k)} aria-pressed={(local.quality ?? 'auto') === k} onClick={() => saveLocal({ quality: k })}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <h4>Som</h4>
                      <button type="button" className={`${opcao(sfx)} xz-larga xz-som`} aria-pressed={sfx} onClick={sfxOn}>
                        SFX {sfx ? 'ON' : 'OFF'}
                      </button>
                      <button type="button" className="chanfro xz-op xz-larga" onClick={resetCam}>
                        Resetar câmera
                      </button>
                      <p className="r-sub">Arraste para girar a mesa (ela volta sozinha ao seu assento). Pinça ou roda do mouse ajustam a distância.</p>
                    </>
                  )}
                </div>
              )}
              {!demo && !running && !finished.current && gateOpen && (
                <Contagem
                  onDone={() => {
                    turnStart.current = Date.now()
                    setNow(Date.now())
                    setRunning(true)
                  }}
                />
              )}
              {demo && demoDone && (
                <div className="xz-fim" role="status">
                  <small>Xeque-mate em {DEMO.length} lances</small>
                  <h2>Demonstração concluída</h2>
                  <p>Na mesa de verdade você enfrenta outro jogador, com dez minutos de relógio para cada um. Toque em “Jogar” no cartaz do Living Chess para entrar na fila.</p>
                  <button type="button" className="r-bt chanfro s-forte s-larga" onClick={onQuit}>
                    Voltar à mesa
                  </button>
                  <button type="button" className="r-bt chanfro s-larga" onClick={replayDemo}>
                    Rever
                  </button>
                </div>
              )}
              {ending && (
                <div className="xz-fim" role="status">
                  <small>{ending.reason}</small>
                  <h2 className={ending.result === 'win' ? 'vitoria' : ending.result === 'loss' && online ? 'derrota' : undefined}>
                    {ending.result === 'win' ? 'Vitória' : ending.result === 'loss' ? 'Derrota' : 'Empate'}
                  </h2>
                  <p>{ending.result === 'draw' ? 'Ninguém cai hoje' : `${ending.result === 'win' ? 'Você' : start.opponent.name} venceu`}</p>
                  <dl className="xz-fim-dados">
                    {(
                      [
                        ['Lances', history.length],
                        ['Capturas', captures[myColor]],
                        ['Tempo', `${Math.ceil(myLeft / 1000)}s`],
                        ['Melhor', bestCapture.current ? `+${bestCapture.current}` : '—'],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <b className="xz-fim-placar">+{ending.score} score</b>
                </div>
              )}
            </div>
            <aside className="xz-lado fundo" aria-label="Lances e chat">
              <h4>Movimentos</h4>
              {historyList}
              <h4>Chat da mesa</h4>
              {chatMesa}
            </aside>
          </div>
          {!demo && !running && !finished.current && !gateOpen && <Sincronizando nome={start.opponent.name} />}
          {askResign && online && !finished.current && <Desistir onCancel={() => setAskResign(false)} onConfirm={resign} />}
        </>
      )}
    </PartidaV2>
  )
}
