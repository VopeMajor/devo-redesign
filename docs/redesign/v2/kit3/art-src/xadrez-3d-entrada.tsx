// Living Chess no protótipo: a cena 3D é a do jogo (components/devo/arcade/chess/*), a interface é a do sistema v2.
// O protótipo não tem servidor: "Jogar" usa um oponente simulado no aparelho, só para testar. No jogo o adversário é gente.
// O treino é a demonstração do jogo: o Javali joga os dois lados (falas literais de games/quick-chess.tsx).
// Gerado para kit3/os-xadrez-3d.js por art-src/xadrez_3d.mjs.
import { Canvas } from '@react-three/fiber'
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RP } from 'react'
import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import { BOARD_THEMES, PIECE_SETS, boardTheme, pieceSet, resolveQuality } from '@/lib/devo/arcade/chess-themes'
import { ClockBackdrop } from '@/components/devo/arcade/chess/clock-backdrop'
import { LivingScene, planAnim, type Anim, type CamState, type MateFx, type UnitState } from '@/components/devo/arcade/chess/living-board'

const q = new URLSearchParams(location.search)
const CLOCK_MS = 600_000
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const MAX_SCORE = 3000
const REACOES = [
  { id: 'fogo', img: 'art/os/memory/s8.png', nome: 'Fogo' },
  { id: 'caveira', img: 'art/os/memory/s0.png', nome: 'Caveira' },
  { id: 'olho', img: 'art/os/memory/s9.png', nome: 'De olho' },
  { id: 'coroa', img: 'art/os/memory/s1.png', nome: 'Coroa' },
  { id: 'chama', img: 'art/os/memory/s7.png', nome: 'Ousadia' },
]
const DEMO: { lan: string; say: string; pose: string }[] = [
  { lan: 'e2e4', say: 'Peão do rei, duas casas. Nas suas partidas, toque numa peça e as casas possíveis acendem no mármore.', pose: 'explica' },
  { lan: 'e7e5', say: 'O preto responde no espelho. Cada um tem dez minutos no relógio, e ele só corre na sua vez.', pose: 'pensativo' },
  { lan: 'f1c4', say: 'O bispo corre na diagonal e mira f7, a casa mais frágil do tabuleiro.', pose: 'trama' },
  { lan: 'b8c6', say: 'O cavalo é o único que salta por cima das outras peças.', pose: 'explica' },
  { lan: 'd1h5', say: 'A dama entra cedo. Repare em quem ela ameaça.', pose: 'convite' },
  { lan: 'g8f6', say: 'O preto ataca a dama… e esquece o próprio rei.', pose: 'desdem' },
  { lan: 'h5f7', say: 'Captura com xeque-mate. Na mesa de verdade, quem cai assim perde Tempo.', pose: 'riso' },
]
const DEMO_INTRO = 'Hoje eu jogo pelos dois lados e você só observa, querido. Na mesa valendo Tempo, o adversário é gente.'

function initialUnits(g: Chess): UnitState[] {
  const out: UnitState[] = []
  let id = 1
  for (const row of g.board()) for (const p of row) if (p) out.push({ id: id++, type: p.type, color: p.color, square: p.square })
  return out
}
const crono = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Oponente do protótipo: procura mate, captura o que vale mais e evita perder a peça logo em seguida. */
function botMove(g: Chess): Move {
  const ms = g.moves({ verbose: true })
  let best = ms[0]
  let nota = -Infinity
  for (const m of ms) {
    let n = Math.random() * 1.4 + (m.captured ? VALUE[m.captured] * 2 : 0) + (m.promotion ? 8 : 0)
    g.move(m)
    if (g.isCheckmate()) n += 1000
    else {
      if (g.inCheck()) n += 0.6
      let perda = 0
      for (const r of g.moves({ verbose: true })) if (r.captured) perda = Math.max(perda, VALUE[r.captured])
      n -= perda * 1.5
    }
    g.undo()
    if (n > nota) {
      nota = n
      best = m
    }
  }
  return best
}

type Fim = { result: 'win' | 'loss' | 'draw'; score: number; oppScore: number }
type Props = { oponente: string; treino: boolean; aoFim: (f: Fim) => void; aoSair: () => void }

function Partida({ oponente, treino, aoFim, aoSair }: Props) {
  const game = useMemo(() => {
    const g = new Chess()
    // para capturas: uma posição do meio da partida
    if (q.get('xzdemo')) for (const s of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Qe2', 'Bg4', 'c3', 'Qf6']) g.move(s)
    return g
  }, [])
  const [units, setUnits] = useState<UnitState[]>(() => initialUnits(game))
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [clocks, setClocks] = useState({ w: CLOCK_MS, b: CLOCK_MS })
  const [captures, setCaptures] = useState({ w: 0, b: 0 })
  const [painel, setPainel] = useState<'' | 'lances' | 'ajustes' | 'chat'>('')
  const [spectator, setSpectator] = useState(false)
  const [conta, setConta] = useState<number | null>(treino || q.has('semraf') ? null : 3)
  const [pops, setPops] = useState<{ id: number; txt: string; tom: string }[]>([])
  const [reacoes, setReacoes] = useState<{ id: number; img: string; x: number }[]>([])
  const [now, setNow] = useState(0)
  const [themeId, setThemeId] = useState('devo')
  const [setId, setSetId] = useState('marble')
  const [grafico, setGrafico] = useState(q.get('xzq') || 'auto')
  const [quality, setQuality] = useState(() => resolveQuality(q.get('xzq') || undefined))
  const [demoStep, setDemoStep] = useState(-1)
  const [demoDone, setDemoDone] = useState(false)
  const [msgs, setMsgs] = useState<string[]>([])
  const theme = boardTheme(themeId)
  const set = pieceSet(setId)

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
  const capRef = useRef(captures)
  capRef.current = captures
  const myColor: Color = q.get('xzcor') === 'b' ? 'b' : 'w'
  const oppColor: Color = myColor === 'w' ? 'b' : 'w'
  if (cam.current.az === 0 && myColor === 'b' && !spectator) cam.current.az = Math.PI

  const push = useCallback((txt: string, tom = 'ouro', ms = 1000) => {
    const id = Date.now() + Math.random()
    setPops((l) => [...l.slice(-1), { id, txt, tom }])
    window.setTimeout(() => setPops((l) => l.filter((p) => p.id !== id)), ms)
  }, [])
  const reage = useCallback((img: string) => {
    const id = Date.now() + Math.random()
    setReacoes((l) => [...l.slice(-5), { id, img, x: 10 + Math.random() * 80 }])
    window.setTimeout(() => setReacoes((l) => l.filter((r) => r.id !== id)), 1800)
  }, [])

  const end = useCallback(
    (result: Fim['result'], motivo: string, mate = false) => {
      if (finished.current) return
      finished.current = true
      setRunning(false)
      setSelected(null)
      const c = clocksRef.current
      const cap = capRef.current
      const eu = cap[myColor]
      const ele = cap[oppColor]
      const bonus = result === 'win' ? Math.floor(c[myColor] / 1000) * 10 : 0
      const score = Math.min(MAX_SCORE, (result === 'win' ? 600 : result === 'draw' ? 200 : 0) + eu * 10 + bonus)
      push(motivo, result === 'win' ? 'ouro' : result === 'loss' ? 'perigo' : 'neutro', 2600)
      window.setTimeout(() => aoFim({ result, score, oppScore: (result === 'loss' ? 600 : result === 'draw' ? 200 : 0) + ele * 10 }), mate ? 2600 : 1400)
    },
    [aoFim, myColor, oppColor, push],
  )

  const checkEnd = useCallback(() => {
    if (game.isCheckmate()) {
      const loser = game.turn()
      const king = unitsRef.current.find((u) => u.type === 'k' && u.color === loser)
      if (king) mateRef.current = { loserKing: king.id, start: performance.now() / 1000 }
      if (treino) {
        window.setTimeout(() => setDemoDone(true), 1500)
        return true
      }
      end(loser === myColor ? 'loss' : 'win', 'Xeque-mate', true)
      return true
    }
    if (game.isDraw()) {
      end('draw', 'Empate')
      return true
    }
    return false
  }, [game, end, treino, myColor])

  const apply = useCallback(
    (m: Move) => {
      if (animRef.current || finished.current) return
      const by = game.turn()
      const gasto = turnStart.current ? Date.now() - turnStart.current : 0
      const next = { ...clocksRef.current, [by]: Math.max(0, clocksRef.current[by] - gasto) }
      clocksRef.current = next
      setClocks(next)
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
        const nc = { ...capRef.current, [by]: capRef.current[by] + VALUE[m.captured] }
        capRef.current = nc
        setCaptures(nc)
      }
      game.move(m)
      setLastMove(m)
      setSelected(null)
      setTick((t) => t + 1)
      if (!mover) {
        setUnits(initialUnits(game))
        return
      }
      const anim = planAnim(mover.type, by, mover.id, m.from, m.to, victim && victimSq ? { id: victim.id, sq: victimSq } : null, { rook, promo: !!m.promotion, queenFx: m.captured === 'q' || mover.type === 'q' })
      animRef.current = anim
      setAnimating(true)
      const meu = by === myColor
      const capturada = m.captured
      if (capturada)
        window.setTimeout(() => {
          try {
            if (!treino) navigator.vibrate?.(capturada === 'q' ? [40, 30, 60] : 25)
          } catch {}
          if (capturada === 'q') push(meu ? 'Dama abatida' : 'Sua dama caiu', meu ? 'ouro' : 'perigo', 1400)
          else if (VALUE[capturada] >= 3) push('Captura', meu ? 'ouro' : 'perigo', 900)
        }, anim.impact * 1000)
      if (m.promotion) window.setTimeout(() => push('Promoção', meu ? 'ouro' : 'perigo', 1100), (anim.dur - 0.5) * 1000)
      if (rook) push('Roque', 'neutro', 900)
      window.setTimeout(() => {
        setUnits((cur) =>
          cur.filter((u) => u.id !== victim?.id).map((u) => (u.id === mover.id ? { ...u, square: m.to, type: (m.promotion as PieceSymbol | undefined) ?? u.type } : rook && u.id === rook.id ? { ...u, square: rook.to } : u)),
        )
        window.setTimeout(() => {
          animRef.current = null
          setAnimating(false)
          turnStart.current = Date.now()
          setNow(Date.now())
          if (finished.current) return
          if (!checkEnd() && game.inCheck()) push('Xeque', meu ? 'ouro' : 'perigo', 900)
        })
      }, anim.dur * 1000 + 40)
    },
    [game, push, checkEnd, myColor, treino],
  )
  const applyRef = useRef(apply)
  applyRef.current = apply

  // O relógio só redesenha a tela quando o segundo de quem joga muda.
  const leftAt = useRef<(t: number) => number>(() => 1000)
  useEffect(() => {
    if (!running || animating) return
    let id = 0
    const tiq = () => {
      const t = Date.now()
      setNow(t)
      const rest = leftAt.current(t)
      id = window.setTimeout(tiq, rest > 0 ? (rest % 1000 || 1000) + 5 : 1000)
    }
    tiq()
    return () => window.clearTimeout(id)
  }, [running, animating])

  const turn = game.turn()
  const ticking = running && !animating
  const live = (side: Color) => (ticking && turn === side ? Math.max(0, clocks[side] - (now - turnStart.current)) : clocks[side])
  leftAt.current = (t) => Math.max(0, clocks[turn] - (t - turnStart.current))
  const myLeft = live(myColor)
  const oppLeft = live(oppColor)
  useEffect(() => {
    if (!ticking || treino) return
    if (myLeft <= 0) end('loss', 'Tempo esgotado')
    else if (oppLeft <= 0) end('win', 'Tempo do oponente esgotou')
  }, [ticking, treino, myLeft, oppLeft, end])

  // contagem de abertura
  useEffect(() => {
    if (treino) return
    if (conta === null) {
      turnStart.current = Date.now()
      setNow(Date.now())
      setRunning(true)
      return
    }
    const id = window.setTimeout(() => setConta(conta === 0 ? null : conta - 1), conta === 0 ? 400 : 650)
    return () => window.clearTimeout(id)
  }, [conta, treino])

  // oponente do protótipo
  useEffect(() => {
    if (treino || !ticking || turn !== oppColor || spectator) return
    const id = window.setTimeout(() => applyRef.current(botMove(game)), 1100 + Math.random() * 1600)
    return () => window.clearTimeout(id)
  }, [treino, ticking, turn, oppColor, tick, game, spectator])

  // demonstração do Javali
  useEffect(() => {
    if (!treino || demoDone || animating) return
    const next = demoStep + 1
    if (next >= DEMO.length) return
    const id = window.setTimeout(() => {
      const m = game.moves({ verbose: true }).find((x) => x.lan === DEMO[next].lan)
      if (!m) return
      setDemoStep(next)
      applyRef.current(m)
    }, next === 0 ? 2200 : 3400)
    return () => window.clearTimeout(id)
  }, [treino, demoDone, demoStep, animating, game])
  const rever = () => {
    game.reset()
    setTick((t) => t + 1)
    mateRef.current = null
    animRef.current = null
    setUnits(initialUnits(game))
    setLastMove(null)
    setCaptures({ w: 0, b: 0 })
    capRef.current = { w: 0, b: 0 }
    setDemoStep(-1)
    setDemoDone(false)
  }

  useEffect(() => {
    const c = cam.current
    c.spectator = spectator
    if (!spectator) c.az = myColor === 'b' ? Math.PI : 0
    else if (!animating) c.az = turn === 'w' ? 0 : Math.PI
  }, [spectator, animating, turn, myColor])

  const legal = useMemo(() => (selected ? game.moves({ square: selected as Square, verbose: true }) : []), [selected, game, lastMove]) // eslint-disable-line react-hooks/exhaustive-deps
  const targets = useMemo(() => legal.map((m) => m.to as string), [legal])
  const captureTargets = useMemo(() => new Set(legal.filter((m) => m.captured).map((m) => m.to as string)), [legal])
  const checkSq = useMemo(() => (animating || !game.inCheck() ? null : (units.find((u) => u.type === 'k' && u.color === game.turn())?.square ?? null)), [animating, game, units, lastMove]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSquare = (sq: string) => {
    if (cam.current.dragDist > 8) return
    if (treino || spectator || !ticking || turn !== myColor || finished.current) return
    const piece = game.get(sq as Square)
    if (selected && targets.includes(sq)) {
      const m = legal.find((x) => x.to === sq && (!x.promotion || x.promotion === 'q'))
      if (m) applyRef.current(m)
      return
    }
    setSelected(piece && piece.color === myColor && sq !== selected ? sq : null)
  }
  const onSquareRef = useRef(onSquare)
  onSquareRef.current = onSquare
  const onSquareStable = useCallback((sq: string) => onSquareRef.current(sq), [])
  const limpa = useCallback(() => setSelected(null), [])

  const down = (e: RP) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const c = cam.current
    c.dragDist = 0
    c.holdUntil = Number.POSITIVE_INFINITY
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }
  const move = (e: RP) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const c = cam.current
    if (pointers.current.size === 1) {
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
  const up = (e: RP) => {
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
  }

  const history = useMemo(() => game.history(), [game, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  const pares: [string, string | undefined][] = []
  for (let i = 0; i < history.length; i += 2) pares.push([history[i], history[i + 1]])
  const lista = (
    <ol className="xz-lances">
      {pares.length === 0 && <li className="xz-vazio">Nenhum lance ainda.</li>}
      {pares.map(([w, b], i) => (
        <li key={i} className={i === pares.length - 1 ? 'on' : ''}>
          <i>{i + 1}.</i>
          <span>{w}</span>
          <span>{b ?? ''}</span>
        </li>
      ))}
    </ol>
  )
  const chat = (
    <div className="xz-chat">
      <ul>
        {msgs.length === 0 && <li className="xz-vazio">A mesa está em silêncio.</li>}
        {msgs.map((m, i) => (
          <li key={i}>
            <b>Você</b> {m}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const f = e.currentTarget.elements.namedItem('m') as HTMLInputElement
          const t = f.value.trim()
          if (t) setMsgs((l) => [...l.slice(-30), t])
          f.value = ''
        }}
      >
        <input name="m" maxLength={120} placeholder="Escreva para a mesa" aria-label="Mensagem para a mesa" autoComplete="off" />
        <button className="chanfro">Enviar</button>
      </form>
    </div>
  )

  const plaqueta = (side: Color) => {
    const ativo = treino ? turn === side && !demoDone : ticking && turn === side
    const ms = live(side)
    const mine = !treino && side === myColor
    const nome = treino ? `Javali · ${side === 'w' ? 'brancas' : 'pretas'}` : mine ? 'Você' : oponente
    const perigo = ativo && ms <= 5000
    return (
      <div className={`xz-pl ${ativo ? 'ativo' : ''} ${mine ? 'eu' : ''} ${perigo ? 'perigo' : ''}`}>
        <i className={`xz-pl-rosto ${side}`} aria-hidden="true">
          {nome.charAt(0).toUpperCase()}
        </i>
        <div className="xz-pl-nome">
          <b>{nome}</b>
          <small>
            {side === 'w' ? 'Corte de Marfim' : 'Corte de Ônix'}
            {captures[side] > 0 && <em> +{captures[side]}</em>}
          </small>
        </div>
        <b className="xz-pl-rel" role="timer" aria-label={`Relógio de ${nome}`}>
          {crono(ms)}
        </b>
        <u className="xz-pl-regua" aria-hidden="true">
          <s style={{ transform: `scaleX(${(ativo ? ms / CLOCK_MS : 1).toFixed(4)})` }} />
        </u>
      </div>
    )
  }
  const estado = treino ? '' : spectator ? 'Modo espectador' : running ? (animating ? 'Combate…' : turn === myColor ? 'Sua vez · toque numa peça' : `Turno de ${oponente}`) : ''
  const auto = grafico === 'auto'
  // Só para o teste automático (?xzteste): de onde clicar e o que está em jogo.
  const three = useRef<{ camera: THREE.Camera; gl: THREE.WebGLRenderer } | null>(null)
  if (q.has('xzteste'))
    (window as unknown as Record<string, unknown>).__xz = {
      estado: () => ({
        fen: game.fen(),
        lance: demoStep + 1,
        lances: game.history().length,
        selected,
        xeque: game.inCheck(),
        minhaVez: ticking && turn === myColor && !finished.current,
        info: three.current ? { calls: three.current.gl.info.render.calls, tris: three.current.gl.info.render.triangles } : null,
      }),
      escolhe: () => {
        const ms = game.moves({ verbose: true })
        if (!ms.length) return null
        const best = ms.filter((m) => m.captured).sort((a, b) => VALUE[b.captured!] - VALUE[a.captured!])[0] ?? ms[Math.floor(Math.random() * ms.length)]
        return { from: best.from, to: best.to, captured: best.captured ?? null, nAlvos: game.moves({ square: best.from, verbose: true }).length }
      },
      tela: (sq: string, y = 0.05) => {
        const c = three.current!.camera
        const v = new THREE.Vector3(sq.charCodeAt(0) - 97 - 3.5, y, 3.5 - (Number(sq[1]) - 1)).project(c)
        const r = three.current!.gl.domElement.getBoundingClientRect()
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }
      },
    }
  const dropQuality = useCallback(() => setQuality('low'), [])
  const opcao = (on: boolean) => `chanfro xz-op ${on ? 'on' : ''}`

  return (
    <div className="xz-pc">
      <div className="xz-central">
        <ClockBackdrop danger={ticking && turn === myColor && myLeft <= 5000} tint={theme.glow} turnKey={`${turn}-${lastMove?.to ?? ''}`} quality={quality} />
        <header className="xz-topo">
          <button className="chanfro xz-ic" aria-label="Sair da partida" onClick={aoSair}>×</button>
          <div className="xz-tit">
            <b>Living Chess</b>
            <small>{treino ? 'Demonstração' : 'Ao vivo'}</small>
          </div>
          <button className={`chanfro xz-ic ${spectator ? 'on' : ''}`} aria-pressed={spectator} aria-label="Modo espectador" title="Modo espectador" onClick={() => setSpectator((s) => !s)}>
            <img src="art/os/memory/s9.png" alt="" />
          </button>
          <button className={`chanfro xz-ic xz-so-cel ${painel === 'lances' ? 'on' : ''}`} aria-pressed={painel === 'lances'} aria-label="Histórico de lances" onClick={() => setPainel((p) => (p === 'lances' ? '' : 'lances'))}>
            <span aria-hidden="true">≡</span>
          </button>
          <button className={`chanfro xz-ic xz-so-cel ${painel === 'chat' ? 'on' : ''}`} aria-pressed={painel === 'chat'} aria-label="Chat da mesa" onClick={() => setPainel((p) => (p === 'chat' ? '' : 'chat'))}>
            <span aria-hidden="true">✉</span>
          </button>
          <button className={`chanfro xz-ic ${painel === 'ajustes' ? 'on' : ''}`} aria-pressed={painel === 'ajustes'} aria-label="Configurações" onClick={() => setPainel((p) => (p === 'ajustes' ? '' : 'ajustes'))}>
            <span aria-hidden="true">⚙</span>
          </button>
        </header>
        <div className="xz-faixa">{plaqueta(oppColor)}</div>
        {treino && (
          <div className="xz-demo" aria-live="polite">
            <span className="xz-rosto" aria-hidden="true">
              <img src={`art/os/npc/javali-${demoStep >= 0 ? DEMO[demoStep].pose : 'convite'}.png`} alt="" />
            </span>
            <p>
              <small>Javali · {demoStep >= 0 ? `lance ${demoStep + 1} de ${DEMO.length}` : 'demonstração'}</small>
              {demoStep >= 0 ? DEMO[demoStep].say : DEMO_INTRO}
            </p>
          </div>
        )}
        <div className="xz-cena" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={(e) => (cam.current.zoom = Math.min(1.2, Math.max(0.75, cam.current.zoom + e.deltaY * 0.0008)))}>
          <Canvas
            shadows="percentage"
            frameloop="demand"
            dpr={quality === 'low' ? 1 : quality === 'medium' ? [1, 1.5] : [1, 2]}
            camera={{ position: [0, 9, 9], fov: 40 }}
            gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
            onPointerMissed={limpa}
            onCreated={({ camera, gl }) => {
              three.current = { camera, gl }
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
              onSlow={auto ? dropQuality : undefined}
            />
          </Canvas>
          {estado && <p className={`xz-estado ${turn === myColor && ticking ? 'on' : ''}`} role="status">{estado}</p>}
          <div className="xz-reacoes" aria-hidden="true">
            {reacoes.map((r) => (
              <img key={r.id} src={r.img} alt="" style={{ left: `${r.x}%` }} />
            ))}
          </div>
          <div className="mr-pops" aria-live="polite">
            {pops.map((p) => (
              <p key={p.id} className={`mr-pop ${p.tom}`}>{p.txt}</p>
            ))}
          </div>
        </div>
        <div className="xz-faixa">{plaqueta(myColor)}</div>
        <footer className="xz-base">
          <div className="xz-bt-reacoes">
            {REACOES.map((r) => (
              <button key={r.id} className="chanfro" aria-label={`Reagir: ${r.nome}`} onClick={() => reage(r.img)}>
                <img src={r.img} alt="" />
              </button>
            ))}
          </div>
          {treino ? (
            <button className="chanfro xz-sair" onClick={aoSair}>Sair</button>
          ) : (
            <button className="chanfro xz-sair perigo" disabled={!running || spectator} onClick={() => end('loss', 'Você desistiu')}>Desistir</button>
          )}
        </footer>
        {painel && (
          <div className="xz-painel fundo" role="dialog" aria-label={painel === 'lances' ? 'Lances' : painel === 'chat' ? 'Chat da mesa' : 'Configurações'}>
            {painel === 'lances' && (
              <>
                <h4>Lances</h4>
                {lista}
              </>
            )}
            {painel === 'chat' && (
              <>
                <h4>Chat da mesa</h4>
                {chat}
              </>
            )}
            {painel === 'ajustes' && (
              <>
                <h4>Tabuleiro</h4>
                <div className="xz-ops">
                  {BOARD_THEMES.map((t) => (
                    <button key={t.id} className={opcao(theme.id === t.id)} aria-pressed={theme.id === t.id} onClick={() => setThemeId(t.id)}>
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
                    <button key={s.id} className={opcao(set.id === s.id)} aria-pressed={set.id === s.id} onClick={() => setSetId(s.id)}>
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
                  {[['auto', 'Auto'], ['low', 'Baixo'], ['medium', 'Médio'], ['high', 'Alto']].map(([k, l]) => (
                    <button
                      key={k}
                      className={opcao(grafico === k)}
                      aria-pressed={grafico === k}
                      onClick={() => {
                        setGrafico(k)
                        setQuality(resolveQuality(k))
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button className="chanfro xz-op xz-larga" onClick={resetCam}>Resetar câmera</button>
                <p className="r-sub">Arraste para girar a mesa (ela volta sozinha ao seu assento). Pinça ou roda do mouse ajustam a distância.</p>
              </>
            )}
          </div>
        )}
        {conta !== null && !treino && (
          <div className="mr-conta" role="status" aria-label={conta ? String(conta) : 'Já'}>
            <b key={conta}>{conta || 'JÁ'}</b>
          </div>
        )}
        {treino && demoDone && (
          <div className="xz-fim" role="status">
            <small>Xeque-mate em {DEMO.length} lances</small>
            <h2>Demonstração concluída</h2>
            <p>Na mesa de verdade você enfrenta outro jogador, com dez minutos de relógio para cada um. Toque em “Jogar” no cartaz do Living Chess para entrar na fila.</p>
            <button className="r-bt chanfro s-forte s-larga" onClick={aoSair}>Voltar à mesa</button>
            <button className="r-bt chanfro s-larga" onClick={rever}>Rever</button>
          </div>
        )}
      </div>
      <aside className="xz-lado fundo" aria-label="Lances e chat">
        <h4>Movimentos</h4>
        {lista}
        <h4>Chat da mesa</h4>
        {chat}
      </aside>
    </div>
  )
}

;(window as unknown as { jogaChess3D: (jan: HTMLElement, p: Props) => void }).jogaChess3D = (jan, p) => {
  const host = document.createElement('div')
  host.className = 'xz'
  host.setAttribute('role', 'dialog')
  host.setAttribute('aria-label', 'Living Chess')
  jan.append(host)
  const root = createRoot(host)
  const fecha = () => {
    root.unmount()
    host.remove()
  }
  root.render(
    <Partida
      {...p}
      aoSair={() => {
        fecha()
        p.aoSair()
      }}
      aoFim={(f) => {
        fecha()
        p.aoFim(f)
      }}
    />,
  )
}
