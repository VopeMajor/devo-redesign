'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { Arte } from '@/lib/devo/torres/tipos'

/**
 * Ilustração procedural das Torres de Ruptura (SVG, sem imagens externas): mármore branco e negro com veios,
 * aço champanhe nos filetes, janelas que acendem com os andares vencidos e um toque pequeno de ametista no
 * andar atual. Paleta: IDENTIDADE.md §0. A noite violeta é só atmosfera.
 */

/* ------------------------------------------------------------------ Definições compartilhadas */

export function TorresDefs() {
  return (
    <defs>
      {/* mármore branco iluminado pela lua (luz da esquerda) */}
      <linearGradient id="tw-white" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#f4f3f1" />
        <stop offset="0.38" stopColor="#dedcd7" />
        <stop offset="0.72" stopColor="#9d9b96" />
        <stop offset="1" stopColor="#55545a" />
      </linearGradient>
      <linearGradient id="tw-white-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="1" stopColor="#0c0c0e" stopOpacity="0.4" />
      </linearGradient>
      {/* mármore negro */}
      <linearGradient id="tw-black" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#57575d" />
        <stop offset="0.35" stopColor="#38393c" />
        <stop offset="0.75" stopColor="#1f1f22" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <linearGradient id="tw-slate" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#4a4a52" />
        <stop offset="0.5" stopColor="#25252a" />
        <stop offset="1" stopColor="#0e0e10" />
      </linearGradient>
      {/* aço champanhe */}
      <linearGradient id="tw-steel" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#f4efe6" />
        <stop offset="0.3" stopColor="#ece5d8" />
        <stop offset="0.6" stopColor="#bab09f" />
        <stop offset="1" stopColor="#5f584d" />
      </linearGradient>
      <linearGradient id="tw-steel-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ece5d8" />
        <stop offset="1" stopColor="#6b6357" />
      </linearGradient>
      <radialGradient id="tw-dome" cx="0.32" cy="0.25" r="0.9">
        <stop offset="0" stopColor="#f4efe6" />
        <stop offset="0.35" stopColor="#bab09f" />
        <stop offset="0.8" stopColor="#4a453d" />
        <stop offset="1" stopColor="#1f1f22" />
      </radialGradient>
      {/* sombra de cilindro por cima de listras */}
      <linearGradient id="tw-cyl" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.7" stopColor="#000000" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.75" />
      </linearGradient>
      {/* janela acesa (porcelana quente) e janela do andar atual (ametista pequena) */}
      <radialGradient id="tw-lit" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.55" stopColor="#ece5d8" />
        <stop offset="1" stopColor="#8f8676" />
      </radialGradient>
      <radialGradient id="tw-cur" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#e6e0ff" />
        <stop offset="0.6" stopColor="#8a7cc8" />
        <stop offset="1" stopColor="#463d78" />
      </radialGradient>
      <radialGradient id="tw-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ece5d8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="tw-halo-am" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#8a7cc8" stopOpacity="0.6" />
        <stop offset="1" stopColor="#8a7cc8" stopOpacity="0" />
      </radialGradient>
      <pattern id="tw-stripes" width="12" height="10" patternUnits="userSpaceOnUse">
        <rect width="6" height="10" fill="#ebe9e4" />
        <rect x="6" width="6" height="10" fill="#18181b" />
      </pattern>
      <filter id="tw-blur-s" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <filter id="tw-blur-l" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
  )
}

/* ------------------------------------------------------------------ Peças */

/** Estrela de quatro pontas do sigilo (path centrado em x,y). */
export function starPath(x: number, y: number, r: number, w = 0.22) {
  const k = r * w
  return `M${x} ${y - r}C${x + k * 0.4} ${y - k} ${x + k} ${y - k * 0.4} ${x + r} ${y}C${x + k} ${y + k * 0.4} ${x + k * 0.4} ${y + k} ${x} ${y + r}C${x - k * 0.4} ${y + k} ${x - k} ${y + k * 0.4} ${x - r} ${y}C${x - k} ${y - k * 0.4} ${x - k * 0.4} ${y - k} ${x} ${y - r}Z`
}

/** Janela em arco ogival. */
function ArchWindow({ x, y, w, h, state }: { x: number; y: number; w: number; h: number; state: 'lit' | 'cur' | 'off' }) {
  const d = `M${x - w / 2} ${y}V${y - h * 0.62}Q${x - w / 2} ${y - h * 0.9} ${x} ${y - h}Q${x + w / 2} ${y - h * 0.9} ${x + w / 2} ${y - h * 0.62}V${y}Z`
  return (
    <g>
      {state !== 'off' && <ellipse cx={x} cy={y - h / 2} rx={w * 1.6} ry={h * 0.9} fill={state === 'cur' ? 'url(#tw-halo-am)' : 'url(#tw-halo)'} />}
      <path d={d} fill={state === 'lit' ? 'url(#tw-lit)' : state === 'cur' ? 'url(#tw-cur)' : '#0c0c0e'} stroke="url(#tw-steel)" strokeWidth={0.9} />
      {state === 'off' && <path d={`M${x} ${y}V${y - h * 0.85}`} stroke="#38393c" strokeWidth={0.6} />}
    </g>
  )
}

function RoundWindow({ x, y, r, state }: { x: number; y: number; r: number; state: 'lit' | 'cur' | 'off' }) {
  return (
    <g>
      {state !== 'off' && <circle cx={x} cy={y} r={r * 2.6} fill={state === 'cur' ? 'url(#tw-halo-am)' : 'url(#tw-halo)'} />}
      <circle cx={x} cy={y} r={r} fill={state === 'lit' ? 'url(#tw-lit)' : state === 'cur' ? 'url(#tw-cur)' : '#0c0c0e'} stroke="url(#tw-steel)" strokeWidth={1} />
      <path d={`M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}`} stroke={state === 'off' ? '#38393c' : '#6b6357'} strokeWidth={0.5} />
    </g>
  )
}

const winState = (i: number, feitos: number, total: number): 'lit' | 'cur' | 'off' => (i < feitos ? 'lit' : i === feitos && i < total ? 'cur' : 'off')

/** Veios de mármore (finos, cinza), recortados pelo corpo. */
function Veins({ clip, seed, h }: { clip: string; seed: number; h: number }) {
  const lines: ReactNode[] = []
  for (let k = 0; k < 4; k++) {
    const y0 = -20 - ((seed * 37 + k * 71) % Math.max(40, h - 40))
    const dx = ((seed + k) % 2 ? 1 : -1) * 18
    lines.push(<path key={k} d={`M-50 ${y0}C-20 ${y0 - 10 + dx * 0.3} 0 ${y0 + 14} 50 ${y0 - 26 + dx}`} stroke="#8f8e8b" strokeWidth={0.6} fill="none" opacity={0.35} />)
  }
  return <g clipPath={`url(#${clip})`}>{lines}</g>
}

function Plinth({ w }: { w: number }) {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={w * 1.1} ry={7} fill="#000" opacity={0.55} filter="url(#tw-blur-s)" />
      <path d={`M${-w} 0L${w} 0L${w - 4} -10L${-w + 4} -10Z`} fill="url(#tw-black)" />
      <path d={`M${-w + 4} -10L${w - 4} -10L${w - 9} -19L${-w + 9} -19Z`} fill="url(#tw-white)" opacity={0.9} />
      <path d={`M${-w + 4} -10H${w - 4}M${-w + 9} -19H${w - 9}`} stroke="url(#tw-steel)" strokeWidth={0.9} />
    </g>
  )
}

/* ------------------------------------------------------------------ Torres (base no ponto 0,0; sobem para y negativo) */

/** Altura de cada desenho em unidades (escala 1). */
export const ALTURA_ARTE: Record<Arte, number> = { agulha: 418, observatorio: 262, picadeiro: 282 }
export const LARGURA_ARTE: Record<Arte, number> = { agulha: 132, observatorio: 96, picadeiro: 110 }

function Agulha({ feitos, total, destaque }: { feitos: number; total: number; destaque: boolean }) {
  const slots: [number, number, number, number][] = [
    [-21, -78, 10, 22],
    [21, -78, 10, 22],
    [0, -120, 11, 24],
    [-13, -188, 9, 20],
    [13, -188, 9, 20],
    [0, -228, 9, 18],
    [-7, -334, 5, 10],
    [7, -334, 5, 10],
  ]
  return (
    <g>
      <clipPath id="tw-agulha-body">
        <path d="M-42 -20L-36 -150L36 -150L42 -20ZM-30 -156L-26 -244L26 -244L30 -156ZM-20 -250L-18 -300L18 -300L20 -250Z" />
      </clipPath>
      <Plinth w={62} />
      {/* agulhas de canto (arcobotantes) */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 56} -19L${s * 50} -19L${s * 53} -112Z`} fill="url(#tw-slate)" />
          <path d={starPath(s * 53, -118, 5)} fill="url(#tw-steel)" />
          <path d={`M${s * 53} -70Q${s * 48} -86 ${s * 40} -96`} stroke="url(#tw-steel)" strokeWidth={1.2} fill="none" />
          <path d={`M${s * 53} -44Q${s * 48} -54 ${s * 41} -60`} stroke="url(#tw-steel)" strokeWidth={0.9} fill="none" opacity={0.8} />
        </g>
      ))}
      {/* corpo em três níveis */}
      <path d="M-42 -20L-36 -150L36 -150L42 -20Z" fill="url(#tw-white)" />
      <path d="M-30 -156L-26 -244L26 -244L30 -156Z" fill="url(#tw-white)" />
      <path d="M-20 -250L-18 -300L18 -300L20 -250Z" fill="url(#tw-white)" />
      <path d="M-42 -20L-36 -150L36 -150L42 -20ZM-30 -156L-26 -244L26 -244L30 -156ZM-20 -250L-18 -300L18 -300L20 -250Z" fill="url(#tw-white-v)" />
      <Veins clip="tw-agulha-body" seed={3} h={300} />
      {/* pilastras */}
      {[-30, -9, 9, 30].map((x) => (
        <path key={x} d={`M${x} -22L${x * 0.88} -148`} stroke="#6f6e6a" strokeWidth={1.2} opacity={0.55} />
      ))}
      {[-17, 17].map((x) => (
        <path key={x} d={`M${x} -158L${x * 0.9} -242`} stroke="#6f6e6a" strokeWidth={1} opacity={0.5} />
      ))}
      {/* porta */}
      <path d="M-12 -20V-44Q-12 -60 0 -66Q12 -60 12 -44V-20Z" fill={feitos > 0 ? 'url(#tw-lit)' : '#0c0c0e'} stroke="url(#tw-steel)" strokeWidth={1.4} />
      <path d="M0 -20V-64" stroke="#38393c" strokeWidth={0.8} />
      {/* cornijas de aço com pináculos */}
      <rect x={-45} y={-157} width={90} height={6} fill="url(#tw-steel)" />
      <rect x={-33} y={-251} width={66} height={6} fill="url(#tw-steel)" />
      <rect x={-22} y={-306} width={44} height={6} fill="url(#tw-steel)" />
      {[-41, 41].map((x) => (
        <path key={x} d={`M${x - 4} -157L${x + 4} -157L${x} -196Z`} fill="url(#tw-slate)" />
      ))}
      {[-22, 22].map((x) => (
        <path key={x} d={`M${x - 3} -157L${x + 3} -157L${x} -178Z`} fill="url(#tw-slate)" />
      ))}
      {[-30, 30].map((x) => (
        <path key={x} d={`M${x - 3.5} -251L${x + 3.5} -251L${x} -284Z`} fill="url(#tw-slate)" />
      ))}
      {/* mostrador: a torre do Imperador marca o tempo */}
      <circle cx={0} cy={-275} r={14} fill="#0c0c0e" stroke="url(#tw-steel)" strokeWidth={1.6} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <path key={i} d={`M${Math.sin(a) * 10.5} ${-275 - Math.cos(a) * 10.5}L${Math.sin(a) * 12.5} ${-275 - Math.cos(a) * 12.5}`} stroke="#bab09f" strokeWidth={i % 3 === 0 ? 1.4 : 0.7} />
      })}
      <path d="M0 -275L0 -284M0 -275L6 -272" stroke="#ece5d8" strokeWidth={1.2} strokeLinecap="round" />
      {/* agulha (pináculo de ardósia) */}
      <path d="M-21 -306L0 -404L21 -306Z" fill="url(#tw-slate)" />
      <path d="M0 -404L-9 -306M0 -404L9 -306" stroke="#bab09f" strokeWidth={0.6} opacity={0.45} />
      <path d="M-21 -306L0 -404" stroke="#ece5d8" strokeWidth={0.8} opacity={0.55} />
      {destaque && <circle cx={0} cy={-412} r={22} fill="url(#tw-halo-am)" className="tw-pulse" />}
      <path d={starPath(0, -413, 10)} fill="url(#tw-steel)" />
      {slots.slice(0, Math.max(total, 0)).map(([x, y, w, h], i) => (
        <ArchWindow key={i} x={x} y={y} w={w} h={h} state={winState(i, feitos, total)} />
      ))}
    </g>
  )
}

function Observatorio({ feitos, total }: { feitos: number; total: number }) {
  const slots: [number, number][] = [
    [0, -38],
    [0, -70],
    [0, -102],
    [0, -134],
    [0, -166],
    [-15, -86],
    [15, -86],
    [0, -150],
  ]
  return (
    <g>
      <clipPath id="tw-obs-body">
        <path d="M-28 -18L-25 -196L25 -196L28 -18Z" />
      </clipPath>
      <Plinth w={42} />
      <path d="M-28 -18L-25 -196L25 -196L28 -18Z" fill="url(#tw-black)" />
      <Veins clip="tw-obs-body" seed={7} h={196} />
      <path d="M-28 -18L-25 -196L25 -196L28 -18Z" fill="url(#tw-cyl)" />
      {[-56, -118, -180].map((y) => (
        <path key={y} d={`M-27 ${y}Q0 ${y + 6} 27 ${y}`} stroke="url(#tw-steel)" strokeWidth={1.4} fill="none" />
      ))}
      {/* sacada com balaustrada */}
      <ellipse cx={0} cy={-198} rx={37} ry={6} fill="#151517" stroke="url(#tw-steel)" strokeWidth={1} />
      {Array.from({ length: 13 }, (_, i) => -33 + i * 5.5).map((x) => (
        <path key={x} d={`M${x} ${-198 + Math.abs(x) * 0.02}V-208`} stroke="#bab09f" strokeWidth={0.7} />
      ))}
      <path d="M-36 -208Q0 -201 36 -208" stroke="url(#tw-steel)" strokeWidth={1.2} fill="none" />
      {/* cúpula de aço com fresta */}
      <path d="M-30 -206A30 30 0 0 1 30 -206Z" fill="url(#tw-dome)" />
      {[-18, -6, 6, 18].map((x) => (
        <path key={x} d={`M0 -236Q${x * 0.9} -232 ${x * 1.55} -206`} stroke="#4a453d" strokeWidth={0.7} fill="none" />
      ))}
      <path d="M-4 -235L4 -235L6 -206L-6 -206Z" fill="#0c0c0e" />
      <path d="M0 -234V-207" stroke="#8a7cc8" strokeWidth={0.8} opacity={0.75} />
      {/* luneta */}
      <g transform="rotate(-38 0 -224)">
        <rect x={-3.2} y={-262} width={6.4} height={40} rx={1} fill="url(#tw-steel)" />
        <rect x={-4.4} y={-264} width={8.8} height={5} rx={1} fill="url(#tw-steel-v)" />
        <rect x={-2} y={-230} width={4} height={10} fill="#38393c" />
      </g>
      <path d={starPath(30, -250, 4)} fill="#ece5d8" opacity={0.8} />
      {slots.slice(0, total).map(([x, y], i) => (
        <RoundWindow key={i} x={x} y={y} r={6} state={winState(i, feitos, total)} />
      ))}
    </g>
  )
}

function Picadeiro({ feitos, total }: { feitos: number; total: number }) {
  const slots: [number, number][] = [
    [0, -36],
    [0, -62],
    [-14, -88],
    [14, -88],
    [0, -114],
    [0, -138],
    [-14, -40],
    [14, -40],
  ]
  const n = 10
  const wedges = Array.from({ length: n }, (_, k) => {
    const x0 = -50 + (100 / n) * k
    const x1 = x0 + 100 / n
    return <path key={k} d={`M0 -262L${x0} -156L${x1} -156Z`} fill={k % 2 ? '#18181b' : '#ebe9e4'} />
  })
  return (
    <g>
      <clipPath id="tw-pic-body">
        <path d="M-31 -18L-28 -156L28 -156L31 -18Z" />
      </clipPath>
      <Plinth w={44} />
      {/* corpo listrado (lona sobre pedra) */}
      <path d="M-31 -18L-28 -156L28 -156L31 -18Z" fill="url(#tw-stripes)" />
      <path d="M-31 -18L-28 -156L28 -156L31 -18Z" fill="url(#tw-cyl)" />
      <path d="M-31 -18L-28 -156L28 -156L31 -18Z" fill="none" stroke="#0c0c0e" strokeWidth={0.8} />
      {/* entrada com cortina */}
      <path d="M-12 -18V-38Q0 -52 12 -38V-18Z" fill="#0c0c0e" stroke="url(#tw-steel)" strokeWidth={1.2} />
      <path d="M-12 -38Q-4 -30 0 -18M12 -38Q4 -30 0 -18" stroke="#3f060b" strokeWidth={0.8} fill="none" opacity={0.9} />
      {/* cobertura cônica listrada */}
      <g>{wedges}</g>
      <path d="M0 -262L-50 -156L50 -156Z" fill="url(#tw-cyl)" />
      <path d="M0 -262L-50 -156M0 -262L50 -156" stroke="url(#tw-steel)" strokeWidth={0.9} />
      {/* sanefa recortada + luzes */}
      {Array.from({ length: n }, (_, k) => {
        const x0 = -50 + (100 / n) * k
        const x1 = x0 + 100 / n
        return <path key={k} d={`M${x0} -156Q${(x0 + x1) / 2} -146 ${x1} -156Z`} fill={k % 2 ? '#ebe9e4' : '#18181b'} stroke="#bab09f" strokeWidth={0.4} />
      })}
      {Array.from({ length: n + 1 }, (_, k) => -50 + (100 / n) * k).map((x, k) => (
        <g key={k} className="tw-bulb" style={{ animationDelay: `${(k % 4) * 0.6}s` }}>
          <circle cx={x} cy={-156} r={4} fill="url(#tw-halo)" />
          <circle cx={x} cy={-156} r={1.3} fill="#fffaf0" />
        </g>
      ))}
      <rect x={-29} y={-158} width={58} height={3} fill="url(#tw-steel)" />
      {/* mastro e flâmula */}
      <path d="M0 -262V-284" stroke="url(#tw-steel)" strokeWidth={1.4} />
      <path d="M0 -284L18 -278L0 -272Z" fill="#ebe9e4" />
      <path d={starPath(0, -287, 4)} fill="url(#tw-steel)" />
      {slots.slice(0, total).map(([x, y], i) => (
        <ArchWindow key={i} x={x} y={y} w={7} h={13} state={winState(i, feitos, total)} />
      ))}
    </g>
  )
}

/** Uma torre, com a base em (0,0). `feitos` acende janelas; `destaque` dá o halo ametista no topo. */
export function TorreArte({ arte, feitos, total, destaque = false }: { arte: Arte; feitos: number; total: number; destaque?: boolean }) {
  if (arte === 'observatorio') return <Observatorio feitos={feitos} total={total} />
  if (arte === 'picadeiro') return <Picadeiro feitos={feitos} total={total} />
  return <Agulha feitos={feitos} total={total} destaque={destaque} />
}

/* ------------------------------------------------------------------ Cenário do mapa */

export const MAPA_W = 390
export const MAPA_H = 640

/** Pseudo-aleatório determinístico (mesmo céu em toda captura). */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const STARS = (() => {
  const r = rng(42)
  return Array.from({ length: 56 }, () => ({ x: r() * MAPA_W, y: r() * 300, s: 0.4 + r() * 1.1, d: r() * 6 }))
})()

/** Céu noturno, lua, montanhas e névoa (fundo do mapa e da tela da torre). */
export function CeuNoturno({ h = MAPA_H, horizonte = 330 }: { h?: number; horizonte?: number }) {
  return (
    <g>
      <linearGradient id="tw-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#09090b" />
        <stop offset={String(Math.min(0.9, horizonte / h - 0.1))} stopColor="#141319" />
        <stop offset={String(Math.min(0.95, horizonte / h))} stopColor="#222029" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <rect width={MAPA_W} height={h} fill="url(#tw-sky)" />
      <ellipse cx={MAPA_W / 2} cy={horizonte - 150} rx={240} ry={190} fill="#2b2a35" opacity={0.35} filter="url(#tw-blur-l)" />
      {STARS.filter((s) => s.y < horizonte - 20).map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#eeedeb" className="tw-twinkle" style={{ animationDelay: `${s.d}s`, ['--tw-o' as string]: String(0.35 + (s.s - 0.4) * 0.4) } as CSSProperties} />
      ))}
      {/* lua (luz da esquerda) */}
      <circle cx={58} cy={74} r={34} fill="url(#tw-halo)" opacity={0.6} />
      <circle cx={58} cy={74} r={15} fill="#f1f0ee" />
      <circle cx={65} cy={70} r={14} fill="#141319" />
      {/* montanhas */}
      <path d={`M0 ${horizonte - 22}L38 ${horizonte - 58}L70 ${horizonte - 34}L112 ${horizonte - 80}L150 ${horizonte - 40}L196 ${horizonte - 66}L236 ${horizonte - 30}L282 ${horizonte - 74}L330 ${horizonte - 36}L364 ${horizonte - 60}L390 ${horizonte - 42}V${horizonte + 40}H0Z`} fill="#19181f" />
      <path d={`M0 ${horizonte + 2}L52 ${horizonte - 26}L98 ${horizonte - 6}L140 ${horizonte - 30}L198 ${horizonte - 4}L250 ${horizonte - 32}L300 ${horizonte - 8}L352 ${horizonte - 28}L390 ${horizonte - 10}V${horizonte + 60}H0Z`} fill="#121115" />
      {/* bruma que corre devagar */}
      <g className="tw-drift" filter="url(#tw-blur-l)" opacity={0.55}>
        <ellipse cx={90} cy={horizonte + 8} rx={150} ry={16} fill="#6f6b82" opacity={0.35} />
        <ellipse cx={320} cy={horizonte + 18} rx={170} ry={14} fill="#6f6b82" opacity={0.3} />
      </g>
    </g>
  )
}

/**
 * Praça de mármore suspensa: piso xadrez em perspectiva, borda de pedra com filete de aço, caminhos de
 * mármore branco do portão até cada torre e lanternas.
 */
export function Praca({ caminhos }: { caminhos: { x: number; y: number }[] }) {
  const cx = MAPA_W / 2
  const cy = 474
  const rx = 192
  const ry = 96
  const gate = { x: cx, y: cy + ry - 8 }
  return (
    <g>
      <pattern id="tw-checker" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`translate(${cx} ${cy}) scale(1 0.5) rotate(45)`}>
        <rect width="22" height="22" fill="#2a2a2f" />
        <rect width="11" height="11" fill="#47474d" />
        <rect x="11" y="11" width="11" height="11" fill="#47474d" />
        <path d="M0 0H22V22" stroke="#6b6357" strokeWidth="0.5" fill="none" opacity="0.5" />
      </pattern>
      <radialGradient id="tw-plaza-light" cx="0.45" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.22" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
      <linearGradient id="tw-rim" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#38393c" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      {/* sombra e borda (espessura) */}
      <ellipse cx={cx} cy={cy + 46} rx={rx * 0.92} ry={ry * 0.7} fill="#000" opacity={0.7} filter="url(#tw-blur-l)" />
      <path d={`M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${cy + 30}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy + 30}Z`} fill="url(#tw-rim)" />
      <path d={`M${cx - rx} ${cy + 30}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 30}`} stroke="#6b6357" strokeWidth={1} fill="none" opacity={0.6} />
      {/* tampo */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-checker)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-plaza-light)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="url(#tw-steel)" strokeWidth={2} />
      <ellipse cx={cx} cy={cy} rx={rx - 7} ry={ry - 4} fill="none" stroke="#bab09f" strokeWidth={0.6} opacity={0.5} />
      {/* caminhos de mármore branco */}
      {caminhos.map((p, i) => (
        <path
          key={i}
          d={`M${gate.x - 9} ${gate.y}Q${(gate.x + p.x) / 2 - 6} ${(gate.y + p.y) / 2 + 12} ${p.x - 7} ${p.y + 6}L${p.x + 7} ${p.y + 6}Q${(gate.x + p.x) / 2 + 6} ${(gate.y + p.y) / 2 + 12} ${gate.x + 9} ${gate.y}Z`}
          fill="#dcd9d3"
          opacity={0.32}
          stroke="#bab09f"
          strokeWidth={0.6}
        />
      ))}
      {/* portão de ferro na frente */}
      <g transform={`translate(${gate.x} ${gate.y + 2})`}>
        <path d="M-20 0V-24Q-20 -40 0 -44Q20 -40 20 -24V0" stroke="url(#tw-steel)" strokeWidth={1.6} fill="none" />
        {[-14, -7, 0, 7, 14].map((x) => (
          <path key={x} d={`M${x} 0V${-30 - (14 - Math.abs(x))}`} stroke="#bab09f" strokeWidth={0.8} />
        ))}
        <path d={starPath(0, -48, 5)} fill="url(#tw-steel)" />
      </g>
      {/* lanternas da borda */}
      {[0.12, 0.3, 0.7, 0.88].map((f, i) => {
        const a = Math.PI * (1 - f)
        const x = cx + Math.cos(a) * rx * 0.97
        const y = cy + Math.sin(a) * ry * 0.97
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 0V-22" stroke="#6b6357" strokeWidth={1.2} />
            <circle cx={0} cy={-25} r={9} fill="url(#tw-halo)" className="tw-flicker" style={{ animationDelay: `${i * 0.7}s` }} />
            <path d="M-2.6 -22H2.6L2 -28H-2Z" fill="#ece5d8" />
          </g>
        )
      })}
    </g>
  )
}

/** Poeira dourada subindo (poucas partículas, CSS). */
export function Poeira({ n = 14, h = MAPA_H }: { n?: number; h?: number }) {
  const r = rng(7)
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={20 + r() * (MAPA_W - 40)}
          cy={h * 0.45 + r() * h * 0.5}
          r={0.6 + r() * 1.1}
          fill="#ece5d8"
          className="tw-dust"
          style={{ animationDelay: `${-r() * 9}s`, animationDuration: `${8 + r() * 6}s` }}
        />
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ Escada em espiral (tela da torre) */

/** Geometria da escada: um giro por andar. */
export const ESCADA = { AX: 96, R: 58, PASSO: 150, TOPO: 170, BASE: 130 }

export function alturaEscada(andares: number) {
  return ESCADA.TOPO + ESCADA.BASE + andares * ESCADA.PASSO
}

/** y (no SVG) do patamar do andar n (1-based): onde fica o nó, na ponta direita da hélice. */
export function yDoAndar(n: number, andares: number) {
  const H = alturaEscada(andares)
  return H - ESCADA.BASE - ESCADA.PASSO * (n - 1) - ESCADA.PASSO / 4
}

/**
 * Escada em espiral de mármore com corrimão de aço em volta de uma coluna negra. Os degraus de trás ficam
 * escuros; os da frente, claros. Os trechos já subidos ficam um pouco mais acesos.
 */
export function Escada({ andares, feitos }: { andares: number; feitos: number }) {
  const { AX, R, PASSO } = ESCADA
  const H = alturaEscada(andares)
  const y0 = H - ESCADA.BASE
  const steps = 16
  const total = andares * steps + steps / 4
  const back: ReactNode[] = []
  const front: ReactNode[] = []
  const railBack: string[] = []
  const railFront: string[] = []
  let segB = ''
  let segF = ''
  for (let i = 0; i <= total; i++) {
    const t = (i / steps) * Math.PI * 2
    const t2 = ((i + 1) / steps) * Math.PI * 2
    const y = y0 - (t / (Math.PI * 2)) * PASSO
    const yy = y0 - (t2 / (Math.PI * 2)) * PASSO
    const sx = Math.sin(t)
    const sx2 = Math.sin(t2)
    const c = Math.cos(t)
    const isFront = c > -0.05
    const subido = t / (Math.PI * 2) < feitos + 0.25
    // degrau: trapézio entre o eixo e a borda
    const xi = AX + 9 * sx
    const xo = AX + R * sx
    const xi2 = AX + 9 * sx2
    const xo2 = AX + R * sx2
    const light = isFront ? 0.55 + 0.45 * c : 0.25 + 0.2 * (1 + c)
    const base = subido ? [236, 233, 228] : [206, 204, 200]
    const col = `rgb(${base.map((v) => Math.round(v * light + 12 * (1 - light))).join(',')})`
    const d = `M${xi} ${y}L${xo} ${y}L${xo2} ${yy}L${xi2} ${yy}Z`
    const riser = `M${xo} ${y}L${xo2} ${yy}L${xo2} ${yy + 5}L${xo} ${y + 5}Z`
    const el = (
      <g key={i}>
        <path d={d} fill={col} stroke="#0c0c0e" strokeWidth={0.4} />
        <path d={riser} fill={isFront ? '#55545a' : '#1f1f22'} />
        {i % 2 === 0 && <path d={`M${xo} ${y}V${y - 16}`} stroke={isFront ? '#bab09f' : '#5f584d'} strokeWidth={0.7} />}
      </g>
    )
    ;(isFront ? front : back).push(el)
    const rp = `${AX + (R + 1) * sx} ${y - 16}`
    if (isFront) {
      if (segB) {
        railBack.push(segB)
        segB = ''
      }
      segF = segF ? `${segF}L${rp}` : `M${rp}`
    } else {
      if (segF) {
        railFront.push(segF)
        segF = ''
      }
      segB = segB ? `${segB}L${rp}` : `M${rp}`
    }
  }
  if (segB) railBack.push(segB)
  if (segF) railFront.push(segF)
  return (
    <g>
      {/* sombra no chão e coluna */}
      <ellipse cx={AX} cy={y0 + 26} rx={R + 30} ry={14} fill="#000" opacity={0.6} filter="url(#tw-blur-s)" />
      <g>{back}</g>
      {railBack.map((d, i) => (
        <path key={i} d={d} stroke="#5f584d" strokeWidth={1.6} fill="none" />
      ))}
      <rect x={AX - 7} y={ESCADA.TOPO - 40} width={14} height={y0 - ESCADA.TOPO + 60} fill="url(#tw-black)" />
      <rect x={AX - 7} y={ESCADA.TOPO - 40} width={2} height={y0 - ESCADA.TOPO + 60} fill="#8f8e8b" opacity={0.4} />
      <g>{front}</g>
      {railFront.map((d, i) => (
        <path key={i} d={d} stroke="url(#tw-steel-v)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      ))}
      {/* remate do topo: agulha com a estrela */}
      <path d={`M${AX - 9} ${ESCADA.TOPO - 40}L${AX} ${ESCADA.TOPO - 120}L${AX + 9} ${ESCADA.TOPO - 40}Z`} fill="url(#tw-slate)" />
      <path d={`M${AX - 9} ${ESCADA.TOPO - 40}L${AX} ${ESCADA.TOPO - 120}`} stroke="#ece5d8" strokeWidth={0.7} opacity={0.6} />
      <circle cx={AX} cy={ESCADA.TOPO - 128} r={20} fill="url(#tw-halo)" opacity={0.6} />
      <path d={starPath(AX, ESCADA.TOPO - 128, 11)} fill="url(#tw-steel)" />
      {/* base de pedra */}
      <path d={`M${AX - R - 22} ${y0 + 24}L${AX + R + 22} ${y0 + 24}L${AX + R + 12} ${y0 + 8}L${AX - R - 12} ${y0 + 8}Z`} fill="url(#tw-black)" />
      <path d={`M${AX - R - 12} ${y0 + 8}H${AX + R + 12}`} stroke="url(#tw-steel)" strokeWidth={1} />
    </g>
  )
}
