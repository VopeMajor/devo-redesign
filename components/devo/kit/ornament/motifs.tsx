'use client'

import { useId, type CSSProperties, type SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { toRoman } from '../glyphs'
import { useMetal, type MetalTone } from './brass'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Motivos do DEVO (IDENTIDADE.md §0): mostrador romano, engrenagens, piso xadrez de mármore,
   espadas cravadas, lanterna pendente e losango do sigilo. Todos decorativos (aria-hidden),
   desenhos originais em SVG/CSS, animação lenta que respeita prefers-reduced-motion.
   ──────────────────────────────────────────────────────────────────────────────────────── */

const pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + Math.sin(a) * r, cy - Math.cos(a) * r]
const f = (n: number) => Math.round(n * 100) / 100

/**
 * Mostrador romano gigante (relojoaria do salão de valsa): aros de latão, 60 marcas, numerais
 * romanos radiais, roseta de engrenagens no centro e ponteiros com ponta em losango.
 * `hands` anima os ponteiros (minuto: 1 volta em 4 min; hora: 48 min). `glass` pinta o fundo
 * com o céu noturno violeta visto através do vidro (como a janela-relógio).
 */
export function RomanDial({
  tone = 'brass',
  hands = true,
  glass = false,
  className,
  style,
}: {
  tone?: MetalTone
  hands?: boolean
  glass?: boolean
  className?: string
  style?: CSSProperties
}) {
  const { paint, defs } = useMetal(tone)
  const sky = `dv-dial-sky-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const C = 200
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={cn('overflow-visible', className)} style={style} fill="none">
      {defs}
      {glass && (
        <defs>
          <radialGradient id={sky} cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#5a5f8c" />
            <stop offset="0.55" stopColor="#34365a" />
            <stop offset="1" stopColor="#1c1b33" />
          </radialGradient>
        </defs>
      )}
      {glass && <circle cx={C} cy={C} r="186" fill={`url(#${sky})`} opacity="0.9" />}
      <g stroke={paint}>
        <circle cx={C} cy={C} r="196" strokeWidth="3" />
        <circle cx={C} cy={C} r="189" strokeWidth="0.8" opacity="0.8" />
        <circle cx={C} cy={C} r="150" strokeWidth="1.2" opacity="0.85" />
        <circle cx={C} cy={C} r="144" strokeWidth="0.5" opacity="0.6" />
        <circle cx={C} cy={C} r="62" strokeWidth="1" opacity="0.7" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2
          const major = i % 5 === 0
          const [x1, y1] = pol(C, C, major ? 172 : 180, a)
          const [x2, y2] = pol(C, C, 188, a)
          return <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth={major ? 2.4 : 0.8} opacity={major ? 1 : 0.7} />
        })}
        {/* raios finos (vitral do mostrador) */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2
          const [x1, y1] = pol(C, C, 62, a)
          const [x2, y2] = pol(C, C, 144, a)
          return <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} strokeWidth="0.5" opacity="0.45" />
        })}
      </g>
      <g fill={paint} style={{ fontFamily: 'var(--font-card-title), Cinzel, Georgia, serif' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          const [x, y] = pol(C, C, 162, a)
          return (
            <text key={i} x={f(x)} y={f(y)} textAnchor="middle" dominantBaseline="central" fontSize="19" fontWeight="600" transform={`rotate(${(i / 12) * 360} ${f(x)} ${f(y)})`}>
              {toRoman(i === 0 ? 12 : i)}
            </text>
          )
        })}
        {/* losangos entre numerais */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2
          const [x, y] = pol(C, C, 147, a)
          return <path key={i} d={`M${f(x)} ${f(y - 4)} L${f(x + 3)} ${f(y)} L${f(x)} ${f(y + 4)} L${f(x - 3)} ${f(y)} Z`} />
        })}
      </g>
      {/* roseta central: duas engrenagens */}
      <GearPath cx={C} cy={C} r={48} teeth={16} paint={paint} className="dv-gear-cw" />
      <GearPath cx={C + 52} cy={C - 40} r={22} teeth={9} paint={paint} className="dv-gear-ccw" opacity={0.75} />
      {hands && (
        <g>
          <g className="dv-hand-hour">
            <path d={`M${C} ${C + 14} L${C - 3.5} ${C} L${C} ${C - 92} L${C + 3.5} ${C} Z`} fill={paint} />
            <path d={`M${C} ${C - 108} L${C + 7} ${C - 96} L${C} ${C - 84} L${C - 7} ${C - 96} Z`} fill={paint} />
          </g>
          <g className="dv-hand-min" style={{ animationDelay: '-70s' }}>
            <path d={`M${C} ${C + 20} L${C - 2.4} ${C} L${C} ${C - 150} L${C + 2.4} ${C} Z`} fill={paint} />
            <path d={`M${C} ${C - 168} L${C + 5} ${C - 157} L${C} ${C - 146} L${C - 5} ${C - 157} Z`} fill={paint} />
          </g>
          <circle cx={C} cy={C} r="7" fill={paint} />
          <circle cx={C} cy={C} r="2.6" fill="#0a090d" />
        </g>
      )}
    </svg>
  )
}

/** Caminho de engrenagem (dentes trapezoidais + raios + cubo) dentro de um SVG existente. */
function GearPath({ cx, cy, r, teeth, paint, className, opacity = 1 }: { cx: number; cy: number; r: number; teeth: number; paint: string; className?: string; opacity?: number }) {
  const d: string[] = []
  const ro = r
  const ri = r * 0.84
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2
    const s = (Math.PI * 2) / teeth
    const pts = [pol(cx, cy, ri, a0), pol(cx, cy, ro, a0 + s * 0.18), pol(cx, cy, ro, a0 + s * 0.42), pol(cx, cy, ri, a0 + s * 0.6)]
    d.push((i === 0 ? 'M' : 'L') + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'))
  }
  d.push('Z')
  const spokes = 5
  return (
    <g className={className} opacity={opacity}>
      <path d={d.join(' ')} stroke={paint} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.62} stroke={paint} strokeWidth="1" />
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2
        const [x1, y1] = pol(cx, cy, r * 0.18, a)
        const [x2, y2] = pol(cx, cy, r * 0.62, a)
        return <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} stroke={paint} strokeWidth="1.4" />
      })}
      <circle cx={cx} cy={cy} r={r * 0.16} fill={paint} />
    </g>
  )
}

/** Engrenagem avulsa (canto de painel, carregamento). `spin` gira devagar (90 s/volta). */
export function Gear({ teeth = 12, tone = 'brass', spin = false, className, ...p }: { teeth?: number; tone?: MetalTone; spin?: false | 'cw' | 'ccw' } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(tone)
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" className={className} {...p}>
      {defs}
      <GearPath cx={50} cy={50} r={47} teeth={teeth} paint={paint} className={spin ? (spin === 'cw' ? 'dv-gear-cw' : 'dv-gear-ccw') : undefined} />
    </svg>
  )
}

/**
 * Piso xadrez de mármore em perspectiva (salão, tabuleiro). Puro CSS: `dv-checker-marble` deitado
 * com rotateX e a borda distante dissolvida. Coloque no rodapé de um bloco `relative overflow-hidden`.
 */
export function CheckerFloor({ tilt = 64, cell = 56, className, style }: { tilt?: number; cell?: number; className?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-[-40%] bottom-0 h-[48%] [perspective:520px]', className)} style={style}>
      <div
        className="dv-checker-marble absolute inset-0 origin-bottom"
        style={{
          transform: `rotateX(${tilt}deg)`,
          backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px, ${cell * 2}px ${cell * 2}px, 420px 420px`,
          WebkitMaskImage: 'linear-gradient(to top, #000 30%, transparent 100%)',
          maskImage: 'linear-gradient(to top, #000 30%, transparent 100%)',
        }}
      />
      {/* brilho do piso encerado */}
      <div className="absolute inset-x-[20%] bottom-[10%] h-[50%] bg-[radial-gradient(50%_50%_at_50%_60%,rgba(170,165,214,0.22),transparent_70%)]" />
    </div>
  )
}

/**
 * Espada de cerimônia (vertical, ponta para baixo): pomo com pedra, guarda em cruz com volutas,
 * lâmina de prata com sulco. Para cravar no chão/tabuleiro (gire com CSS). `gem` = pedra do pomo.
 */
export function Sword({ tone = 'brass', gem = 'night', className, ...p }: { tone?: MetalTone; gem?: 'night' | 'blood' | 'glass' } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(tone)
  const steel = useMetal('silver')
  const G = { night: '#6c6899', blood: '#a3121f', glass: '#e8e6f2' }[gem]
  return (
    <svg viewBox="0 0 40 220" aria-hidden="true" className={className} {...p}>
      {defs}
      {steel.defs}
      {/* lâmina */}
      <path d="M20 214 L14.5 196 L15.5 58 L24.5 58 L25.5 196 Z" fill={steel.paint} />
      <path d="M20 200 L20 60" stroke="#0a090d" strokeWidth="0.8" opacity="0.35" />
      {/* guarda */}
      <path d="M3 52 C8 49 12 52 16 52 L24 52 C28 52 32 49 37 52 C33 55 29 58 24 58 L16 58 C11 58 7 55 3 52 Z" fill={paint} />
      <circle cx="3" cy="52" r="2.4" fill={paint} />
      <circle cx="37" cy="52" r="2.4" fill={paint} />
      <path d="M20 47 L24 54 L20 61 L16 54 Z" fill={G} stroke={paint} strokeWidth="0.8" />
      {/* punho */}
      <rect x="17.4" y="20" width="5.2" height="28" rx="1.4" fill="#16141b" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M17.4 ${23 + i * 4.4} L22.6 ${25.4 + i * 4.4}`} stroke={paint} strokeWidth="0.7" />
      ))}
      {/* pomo */}
      <path d="M20 4 L27 13 L20 22 L13 13 Z" fill={paint} />
      <path d="M20 8 L24 13 L20 18 L16 13 Z" fill={G} />
      <path d="M20 8 L24 13 L20 13 Z" fill="#fff" opacity="0.35" />
    </svg>
  )
}

/** Duas espadas cruzadas atrás de uma estrela de 4 pontas (selo de conquista, cabeçalho de duelo). */
export function CrossedSwords({ tone = 'brass', className }: { tone?: MetalTone; className?: string }) {
  const { paint, defs } = useMetal(tone)
  return (
    <span aria-hidden="true" className={cn('relative inline-block aspect-square', className)}>
      <Sword tone={tone} className="absolute left-1/2 top-1/2 h-[118%] -translate-x-1/2 -translate-y-1/2 rotate-[38deg]" />
      <Sword tone={tone} className="absolute left-1/2 top-1/2 h-[118%] -translate-x-1/2 -translate-y-1/2 -rotate-[38deg]" />
      <svg viewBox="0 0 24 24" className="absolute left-1/2 top-[40%] w-[34%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {defs}
        <path d="M12 0.5 C12.6 8.6 15.4 11.4 23.5 12 C15.4 12.6 12.6 15.4 12 23.5 C11.4 15.4 8.6 12.6 0.5 12 C8.6 11.4 11.4 8.6 12 0.5 Z" fill={paint} />
      </svg>
    </span>
  )
}

/**
 * Lanterna pendente gótica: corrente, chapéu com pináculo, vidros em ogiva e chama. `sway` balança
 * devagar (7 s), `lit=false` apaga. Pendure no topo de um bloco `relative` (a corrente vem do alto).
 */
export function Lantern({ tone = 'brass', lit = true, sway = true, chain = 60, className, style }: { tone?: MetalTone; lit?: boolean; sway?: boolean; chain?: number; className?: string; style?: CSSProperties }) {
  const { paint, defs } = useMetal(tone)
  const gid = `dv-lantern-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const H = chain + 96
  return (
    <svg viewBox={`0 0 60 ${H}`} aria-hidden="true" className={cn('overflow-visible', sway && 'dv-lantern-sway', className)} style={style}>
      {defs}
      <defs>
        <radialGradient id={gid} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#e3d5ac" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e3d5ac" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* corrente */}
      <g stroke={paint} strokeWidth="1.1" fill="none">
        {Array.from({ length: Math.max(1, Math.floor(chain / 7)) }, (_, i) => (
          <ellipse key={i} cx="30" cy={3.5 + i * 7} rx={i % 2 ? 1 : 2.2} ry="3.6" />
        ))}
      </g>
      <g transform={`translate(0 ${chain})`}>
        {lit && <circle cx="30" cy="52" r="40" fill={`url(#${gid})`} />}
        {/* argola + pináculo + chapéu */}
        <circle cx="30" cy="3" r="3" stroke={paint} strokeWidth="1.4" fill="none" />
        <path d="M30 6 L33 16 L27 16 Z" fill={paint} />
        <path d="M14 26 L30 14 L46 26 Z" fill={paint} />
        <rect x="12" y="25" width="36" height="4" fill={paint} />
        {/* vidros em ogiva */}
        <path d="M16 29 L16 70 L44 70 L44 29" fill={lit ? 'rgba(227,213,172,0.16)' : 'rgba(170,165,214,0.08)'} stroke={paint} strokeWidth="1.6" />
        <path d="M30 29 L30 70" stroke={paint} strokeWidth="1" />
        <path d="M16 44 C16 34 23 31 30 31 C37 31 44 34 44 44" stroke={paint} strokeWidth="0.9" fill="none" />
        {/* chama */}
        {lit && (
          <g className="dv-flame">
            <path d="M30 46 C33 52 35 56 35 60 C35 64 32.8 66 30 66 C27.2 66 25 64 25 60 C25 56 27 52 30 46 Z" fill="#f6e7c4" />
            <path d="M30 54 C31.5 57 32.4 59 32.4 61 C32.4 63 31.3 64 30 64 C28.7 64 27.6 63 27.6 61 C27.6 59 28.5 57 30 54 Z" fill="#fffaf0" />
          </g>
        )}
        {/* base + gota */}
        <path d="M12 70 L48 70 L42 78 L18 78 Z" fill={paint} />
        <path d="M30 78 L34 86 L30 94 L26 86 Z" fill={paint} />
      </g>
    </svg>
  )
}

/** Losango do sigilo: losango vazado com estrela de 4 pontas dentro (marcador de lista, separador). */
export function SigilLozenge({ tone = 'brass', filled = false, className, ...p }: { tone?: MetalTone; filled?: boolean } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(tone)
  return (
    <svg viewBox="0 0 24 32" aria-hidden="true" className={className} {...p}>
      {defs}
      <path d="M12 1 L23 16 L12 31 L1 16 Z" fill={filled ? paint : 'none'} stroke={paint} strokeWidth="1.2" />
      <path d="M12 8 C12.3 13.2 13.4 14.4 17.5 16 C13.4 17.6 12.3 18.8 12 24 C11.7 18.8 10.6 17.6 6.5 16 C10.6 14.4 11.7 13.2 12 8 Z" fill={filled ? '#0a090d' : paint} />
    </svg>
  )
}
