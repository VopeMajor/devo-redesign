'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useMetal, type MetalTone } from './brass'

const f = (n: number) => Math.round(n * 100) / 100

/* Geometria (viewBox 300×420): cúpula de (150,62) até o anel em y=172; grades descem até o
   anel da base (y=382); colunas-torre nos lados. A janela do conteúdo fica em x 42..258, y 62..382. */
const APEX: [number, number] = [150, 62]
const DOME_Y = 172
const BASE_Y = 382
const BARS_ALL = [42, 66, 90, 114, 138, 162, 186, 210, 234, 258]

/**
 * Gaiola dourada — a "prisão elegante" do DEVO (ref. ref-gaiola-ouro): cúpula de meridianos de
 * latão, coroa com estrela e duas lanças cruzadas, cinto de losangos facetados entre estrelas de
 * 4 pontas, colunas-torre laterais e fita lavanda opcional. O conteúdo (retrato, troféu) fica
 * DENTRO, atrás das grades da frente.
 *
 *   <CageFrame className="w-56" label="Aurora"><img … /></CageFrame>
 *
 * `open` (padrão) tira as duas grades do centro para o rosto ficar legível. Use em no máximo
 * 1 bloco por tela (retrato do perfil, conquista em destaque). Decorativo: o nome acessível vem
 * do conteúdo.
 */
export function CageFrame({
  children,
  tone = 'brass',
  open = true,
  ribbon = true,
  gems = 'onyx',
  glow = true,
  className,
  innerClassName,
}: {
  children?: ReactNode
  tone?: MetalTone
  /** Sem as duas grades centrais (rosto livre). */
  open?: boolean
  /** Fita lavanda drapeada (a cor da noite). */
  ribbon?: boolean
  /** Pedras do cinto: ônix (preto/branco) ou noite (violeta). */
  gems?: 'onyx' | 'night'
  /** Halo violeta atrás do conteúdo. */
  glow?: boolean
  className?: string
  innerClassName?: string
}) {
  const { paint, defs } = useMetal(tone)
  const rid = `dv-cage-rb-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const bars = open ? BARS_ALL.filter((x) => x < 120 || x > 180) : BARS_ALL
  const bar = (x: number) => `M${x} ${BASE_Y} L${x} ${DOME_Y} Q${x} ${f(APEX[1] + Math.abs(x - 150) * 0.05)} ${APEX[0]} ${APEX[1]}`
  const beltY = 214
  const beltX = open ? [66, 108, 192, 234] : [66, 108, 150, 192, 234]
  const [g1, g2] = gems === 'onyx' ? ['#f2f0ec', '#121016'] : ['#aaa5d6', '#1c1b33']
  return (
    <div className={cn('relative isolate aspect-[300/420]', className)}>
      {/* conteúdo: janela em ogiva atrás das grades */}
      <div
        className={cn('absolute overflow-hidden bg-dv-ink', innerClassName)}
        style={{ left: `${(42 / 300) * 100}%`, right: `${(42 / 300) * 100}%`, top: `${(70 / 420) * 100}%`, bottom: `${((420 - BASE_Y) / 420) * 100}%`, borderRadius: '999px 999px 2px 2px' }}
      >
        {glow && <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_35%,rgba(108,104,153,0.55),transparent_75%),linear-gradient(180deg,#1c1b33,#0a090d)]" />}
        {children}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_55%,rgba(10,9,13,0.55)_100%)]" />
      </div>

      <svg viewBox="0 0 300 420" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]" fill="none">
        {defs}
        <defs>
          <linearGradient id={rid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8c88b8" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#6c6899" stopOpacity="0.75" />
            <stop offset="1" stopColor="#34365a" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* lanças cruzadas atrás da coroa */}
        <g stroke={paint} strokeWidth="2.4" strokeLinecap="round">
          <path d="M96 66 L196 -6" />
          <path d="M204 66 L104 -6" />
        </g>
        <g fill={paint}>
          <path d="M196 -6 L206 -14 L202 -2 Z" />
          <path d="M104 -6 L94 -14 L98 -2 Z" />
        </g>
        {/* grades (meridianos da cúpula) */}
        <g stroke={paint} strokeLinecap="round">
          {bars.map((x) => (
            <path key={x} d={bar(x)} strokeWidth={x === 42 || x === 258 ? 2.4 : 1.5} />
          ))}
          {/* aros */}
          <ellipse cx="150" cy={DOME_Y} rx="108" ry="7" strokeWidth="1.6" />
          <ellipse cx="150" cy="300" rx="108" ry="7" strokeWidth="1.1" opacity="0.85" />
          <ellipse cx="150" cy={BASE_Y} rx="118" ry="10" strokeWidth="3" />
          <ellipse cx="150" cy={BASE_Y + 6} rx="122" ry="10" strokeWidth="1.2" opacity="0.7" />
          {/* volutas sob o cinto (lírios de ferro) */}
          {[90, 150, 210].map((x) => (
            <path key={x} d={`M${x - 16} 262 C${x - 16} 246 ${x - 4} 244 ${x} 232 C${x + 4} 244 ${x + 16} 246 ${x + 16} 262`} strokeWidth="1.2" />
          ))}
        </g>
        {/* cinto: losangos facetados + estrelas */}
        <line x1="42" y1={beltY} x2="258" y2={beltY} stroke={paint} strokeWidth="1" opacity="0.8" />
        {beltX.map((x, i) => (
          <g key={x}>
            <path d={`M${x} ${beltY - 18} L${x + 11} ${beltY} L${x} ${beltY + 18} L${x - 11} ${beltY} Z`} fill={paint} />
            <path d={`M${x} ${beltY - 14} L${x + 8} ${beltY} L${x} ${beltY + 14} L${x - 8} ${beltY} Z`} fill={i % 2 ? g1 : g2} />
            <path d={`M${x} ${beltY - 14} L${x + 8} ${beltY} L${x} ${beltY} Z`} fill={i % 2 ? '#ffffff' : '#4a4656'} opacity="0.5" />
            {i < beltX.length - 1 && beltX[i + 1] - x < 50 && <Star4 cx={x + 21} cy={beltY} r={6.5} paint={paint} />}
          </g>
        ))}
        {/* estrelas soltas na cúpula */}
        <Star4 cx={98} cy={130} r={5} paint={paint} />
        <Star4 cx={206} cy={118} r={4} paint={paint} />
        <Star4 cx={232} cy={330} r={4} paint={paint} />
        <Star4 cx={70} cy={340} r={3.5} paint={paint} />
        {/* coroa: cartela com estrela e gema */}
        <path d="M122 70 C126 52 140 44 150 30 C160 44 174 52 178 70 C168 64 160 66 150 74 C140 66 132 64 122 70 Z" fill={paint} />
        <path d="M150 38 L157 52 L150 66 L143 52 Z" fill={g2} stroke={paint} strokeWidth="1" />
        <path d="M150 38 L157 52 L150 52 Z" fill="#fff" opacity="0.45" />
        <Star4 cx={150} cy={20} r={10} paint={paint} />
        <path d="M150 74 L150 92" stroke={paint} strokeWidth="1.4" />
        <path d="M150 92 L154 98 L150 106 L146 98 Z" fill={paint} />
        {/* colunas-torre */}
        {[20, 280].map((x) => (
          <g key={x} fill={paint}>
            <rect x={x - 5} y="150" width="10" height={BASE_Y - 150} rx="2" />
            <rect x={x - 9} y="140" width="18" height="12" rx="1.5" />
            <path d={`M${x - 9} 140 L${x - 9} 130 L${x - 5} 130 L${x - 5} 135 L${x - 2} 135 L${x - 2} 128 L${x + 2} 128 L${x + 2} 135 L${x + 5} 135 L${x + 5} 130 L${x + 9} 130 L${x + 9} 140 Z`} />
            <rect x={x - 8} y={BASE_Y - 6} width="16" height="22" rx="2" />
            <circle cx={x} cy="230" r="6" />
            <circle cx={x} cy="300" r="4.5" />
          </g>
        ))}
        {/* fita lavanda drapeada pela coluna esquerda e pela base (não cruza o conteúdo) */}
        {ribbon && (
          <g>
            <path
              d="M12 150 C26 170 16 210 28 250 C38 290 30 330 46 360 C66 392 120 394 170 392 C214 390 250 384 284 392 L282 404 C246 398 214 404 170 405 C116 407 58 404 36 370 C18 340 26 296 16 254 C6 214 14 176 4 160 Z"
              fill={`url(#${rid})`}
            />
            <path d="M12 150 C26 170 16 210 28 250 C38 290 30 330 46 360 C66 392 120 394 170 392 C214 390 250 384 284 392" stroke={paint} strokeWidth="0.8" strokeDasharray="1.5 3" opacity="0.8" />
            {/* laço de fita no ombro esquerdo */}
            <path d="M12 150 C0 138 -6 148 2 156 C-8 160 -4 172 8 164 Z" fill="#8c88b8" opacity="0.9" />
            <path d="M12 150 C24 136 30 146 22 154 C32 158 28 170 16 162 Z" fill="#8c88b8" opacity="0.9" />
          </g>
        )}
      </svg>
    </div>
  )
}

function Star4({ cx, cy, r, paint }: { cx: number; cy: number; r: number; paint: string }) {
  const k = r * 0.16
  return (
    <path
      d={`M${cx} ${cy - r} C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + r} ${cy} C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r} C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - r} ${cy} C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r} Z`}
      fill={paint}
    />
  )
}
