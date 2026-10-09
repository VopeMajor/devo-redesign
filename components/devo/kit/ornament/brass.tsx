'use client'

import { useId, type CSSProperties, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Latão: gradiente de metal (claro → sombra → reflexo) usado em todos os ornamentos do kit.
 * `tone="silver"` dá prata fria (sistema/neutro); `currentColor` herda a cor do texto (sem metal).
 */
export type MetalTone = 'brass' | 'silver' | 'current'

const STOPS: Record<Exclude<MetalTone, 'current'>, [number, string][]> = {
  brass: [
    [0, '#f4efe6'],
    [0.22, '#9a9184'],
    [0.45, '#dcd5c8'],
    [0.66, '#5d564c'],
    [0.86, '#bdb4a5'],
    [1, '#f4efe6'],
  ],
  silver: [
    [0, '#ffffff'],
    [0.25, '#8e8b98'],
    [0.5, '#e6e4ea'],
    [0.7, '#57545f'],
    [1, '#f3f1f6'],
  ],
}

/** <defs> com o gradiente do metal. Devolve o `fill`/`stroke` a usar. */
export function useMetal(tone: MetalTone) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = `dv-metal-${raw}`
  const paint = tone === 'current' ? 'currentColor' : `url(#${id})`
  const defs =
    tone === 'current' ? null : (
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {STOPS[tone].map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
    )
  return { id, paint, defs }
}

/**
 * Canto de filigrana em latão (48×48, canto superior-esquerdo; gire para os outros). Desenho
 * original: chanfro duplo, losango no vértice, volutas em S nos dois braços, estrela de 4 pontas.
 */
export function FiligreeCorner({ tone = 'brass', className, style, ...p }: { tone?: MetalTone } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(tone)
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} style={style} fill="none" {...p}>
      {defs}
      <g stroke={paint} strokeLinecap="round">
        {/* chanfro duplo */}
        <path d="M1.5 47 V10 L10 1.5 H47" strokeWidth="1.3" />
        <path d="M5.5 47 V12.5 L12.5 5.5 H47" strokeWidth="0.6" opacity="0.7" />
        {/* volutas */}
        <path d="M17 5.5 C17.5 11.5 23 14 27.5 11 C30.5 9 29.6 4.6 26.6 4.9 C24.4 5.1 24 7.6 25.5 8.6" strokeWidth="0.9" />
        <path d="M5.5 17 C11.5 17.5 14 23 11 27.5 C9 30.5 4.6 29.6 4.9 26.6 C5.1 24.4 7.6 24 8.6 25.5" strokeWidth="0.9" />
        {/* folha diagonal */}
        <path d="M12.5 12.5 C17 14 20 17 21.5 21.5 C17 20 14 17 12.5 12.5 Z" strokeWidth="0.7" />
        <path d="M33 5.5 H40 M5.5 33 V40" strokeWidth="0.7" opacity="0.8" />
      </g>
      <g fill={paint}>
        {/* losango do vértice */}
        <path d="M8.2 2.6 L13.8 8.2 L8.2 13.8 L2.6 8.2 Z" />
        <path d="M8.2 5.6 L10.8 8.2 L8.2 10.8 L5.6 8.2 Z" fill="#0c0c0e" opacity="0.55" />
        {/* estrela de 4 pontas */}
        <path d="M24 17.2 C24.3 20.4 24.9 21 28 21.3 C24.9 21.6 24.3 22.2 24 25.4 C23.7 22.2 23.1 21.6 20 21.3 C23.1 21 23.7 20.4 24 17.2 Z" transform="translate(-0.5 -0.5)" />
        <circle cx="43.5" cy="5.5" r="1" />
        <circle cx="5.5" cy="43.5" r="1" />
      </g>
    </svg>
  )
}

/** Quatro cantos de filigrana em latão sobre um bloco `relative`. Decorativo. */
export function BrassCorners({ size = 30, inset = 4, tone = 'brass', className }: { size?: number; inset?: number; tone?: MetalTone; className?: string }) {
  const pos: { s: CSSProperties; r: number }[] = [
    { s: { left: inset, top: inset }, r: 0 },
    { s: { right: inset, top: inset }, r: 90 },
    { s: { right: inset, bottom: inset }, r: 180 },
    { s: { left: inset, bottom: inset }, r: 270 },
  ]
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 z-[1]', className)}>
      {pos.map((p) => (
        <FiligreeCorner key={p.r} tone={tone} className="absolute drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" style={{ ...p.s, width: size, height: size, transform: `rotate(${p.r}deg)` }} />
      ))}
    </span>
  )
}

/** Estrela de 4 pontas do sigilo (curvas côncavas). */
export function SigilStar({ className, tone = 'current', ...p }: { tone?: MetalTone } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(tone)
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...p}>
      {defs}
      <path d="M12 0.5 C12.6 8.6 15.4 11.4 23.5 12 C15.4 12.6 12.6 15.4 12 23.5 C11.4 15.4 8.6 12.6 0.5 12 C8.6 11.4 11.4 8.6 12 0.5 Z" fill={paint} />
    </svg>
  )
}

/**
 * Faixa ornamental: losangos facetados alternando com estrelas de 4 pontas sobre um filete de
 * latão (o "cinto" da gaiola). Divisor de herói/conquista — no máximo 1 por tela.
 */
export function OrnamentBand({ count = 5, tone = 'brass', gem = 'onyx', className }: { count?: number; tone?: MetalTone; gem?: 'onyx' | 'glass' | 'blood' | 'night'; className?: string }) {
  const { paint, defs } = useMetal(tone)
  const W = count * 40
  const GEM: Record<string, [string, string]> = { onyx: ['#2a2a2e', '#0c0c0e'], glass: ['#ffffff', '#b9b4d6'], blood: ['#ff6b74', '#5a0710'], night: ['#6f6b82', '#19181f'] }
  const [g1, g2] = GEM[gem]
  return (
    <svg viewBox={`0 0 ${W} 24`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" className={cn('h-6 w-full', className)}>
      {defs}
      <line x1="0" y1="12" x2={W} y2="12" stroke={paint} strokeWidth="0.8" opacity="0.8" />
      {Array.from({ length: count }, (_, i) => {
        const x = 20 + i * 40
        return (
          <g key={i}>
            <path d={`M${x} 2 L${x + 7} 12 L${x} 22 L${x - 7} 12 Z`} fill={paint} />
            <path d={`M${x} 4.6 L${x + 5} 12 L${x} 19.4 L${x - 5} 12 Z`} fill={g2} />
            <path d={`M${x} 4.6 L${x + 5} 12 L${x} 12 Z`} fill={g1} opacity="0.55" />
            <path d={`M${x} 12 L${x - 5} 12 L${x} 19.4 Z`} fill={g1} opacity="0.25" />
            {i < count - 1 && (
              <path
                d={`M${x + 20} 6 C${x + 20.3} 10.6 ${x + 21.4} 11.7 ${x + 26} 12 C${x + 21.4} 12.3 ${x + 20.3} 13.4 ${x + 20} 18 C${x + 19.7} 13.4 ${x + 18.6} 12.3 ${x + 14} 12 C${x + 18.6} 11.7 ${x + 19.7} 10.6 ${x + 20} 6 Z`}
                fill={paint}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
