'use client'

import { useEffect, useId, useRef } from 'react'
import { pulseRing } from '@/lib/devo/pulse'
import { cn } from '@/lib/utils'
import { toRoman } from '../kit/glyphs'

/**
 * Mostrador de astrolábio do pulso (72h). Fonte única: recebe `remaining` já calculado por
 * `pulseRemaining` (lib/devo/pulse.ts) e usa `pulseRing` para o anel principal (limitado a 1) e o
 * arco dourado externo do excedente acima de 72h. Doze numerais romanos = uma volta de 72h
 * (cada numeral vale 6h). Ponteiro de segundos contínuo por requestAnimationFrame.
 *
 * `hero` (app Pulso) deixa o miolo livre para os dígitos; `compact` (home) desenha a estrela
 * do sigilo no centro. Decorativo: o tempo em texto fica com quem usa.
 */
export function PulseDial({
  remaining,
  timerEndsAt,
  critical,
  variant = 'hero',
  className,
}: {
  remaining: number
  timerEndsAt: number
  critical: boolean
  variant?: 'hero' | 'compact'
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const { ratio, excess } = pulseRing(remaining)
  const hero = variant === 'hero'
  const C = 160
  const R_ARC = hero ? 112 : 104
  const R_EXCESS = 155
  const arcCirc = 2 * Math.PI * R_ARC
  const exCirc = 2 * Math.PI * R_EXCESS
  // Anel do tempo em aço champanhe (rubi só no crítico); ametista só no ponto "agora" e no ponteiro.
  const arc = critical ? 'var(--dv-blood)' : `url(#a-${uid})`
  const now = critical ? 'var(--dv-blood-text)' : 'var(--dv-amethyst-text)'
  const endA = ratio * Math.PI * 2
  const end = { x: C + Math.sin(endA) * R_ARC, y: C - Math.cos(endA) * R_ARC }

  return (
    <span className={cn('relative block', className)} aria-hidden="true">
      {/* mostrador de mármore negro (pedra com veio) atrás do aço */}
      <span className="bg-dv-ink-2 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] absolute inset-[3.75%] rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.6),inset_0_18px_40px_rgba(0,0,0,0.55)]" />
      <span
        className={cn(
          'absolute inset-[3.75%] rounded-full',
          critical
            ? 'bg-[radial-gradient(closest-side_at_50%_44%,rgb(var(--dv-wine-rgb)/0.55),rgb(var(--dv-ink-rgb)/0.25)_70%,rgba(0,0,0,0.5))]'
            : 'bg-[radial-gradient(closest-side_at_50%_40%,rgb(var(--dv-text-rgb)/0.07),rgb(var(--dv-ink-rgb)/0.2)_65%,rgba(0,0,0,0.55))]',
        )}
      />
    <svg viewBox="0 0 320 320" className="relative size-full overflow-visible" fill="none">
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--dv-gold-bright)" />
          <stop offset="0.3" stopColor="var(--dv-gold-deep)" />
          <stop offset="0.55" stopColor="var(--dv-gold)" />
          <stop offset="0.8" stopColor="var(--dv-gold-deep)" />
          <stop offset="1" stopColor="var(--dv-gold-bright)" />
        </linearGradient>
        {/* aço escovado do anel do tempo: claro no alto, sombra embaixo */}
        <linearGradient id={`a-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="0.35" stopColor="#cfc6b6" />
          <stop offset="0.62" stopColor="#8f877a" />
          <stop offset="1" stopColor="#ece5d8" />
        </linearGradient>
        {/*
          No herói, órbita e ponteiro somem na faixa dos dígitos (máscara com borda suave por gradiente
          radial; sem filtro de desfoque, que era refeito a cada quadro do ponteiro).
        */}
        <radialGradient id={`r-${uid}`}>
          <stop offset="0.62" stopColor="#000" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <mask id={`m-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="320">
          <rect x="0" y="0" width="320" height="320" fill="#fff" />
          {hero && <ellipse cx="160" cy="160" rx="136" ry="66" fill={`url(#r-${uid})`} />}
        </mask>
      </defs>

      {/* excedente acima de 72h: trilho pontilhado + arco dourado externo */}
      <circle cx={C} cy={C} r={R_EXCESS} stroke="rgba(186,176,159,0.24)" strokeWidth="1" strokeDasharray="1.5 5" />
      {excess > 0 && (
        <circle
          cx={C}
          cy={C}
          r={R_EXCESS}
          stroke="var(--dv-gold-bright)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={exCirc}
          strokeDashoffset={exCirc * (1 - excess)}
          transform={`rotate(-90 ${C} ${C})`}
        />
      )}

      {/* luneta (bezel) dourada com 72 marcas de hora */}
      <circle cx={C} cy={C} r="148" stroke={`url(#g-${uid})`} strokeWidth="1.6" />
      <circle cx={C} cy={C} r="143" stroke={`url(#g-${uid})`} strokeWidth="0.6" opacity="0.7" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2
        const major = i % 6 === 0
        const r1 = major ? 130 : 137
        return (
          <line
            key={i}
            x1={C + Math.sin(a) * r1}
            y1={C - Math.cos(a) * r1}
            x2={C + Math.sin(a) * 142}
            y2={C - Math.cos(a) * 142}
            stroke="var(--dv-gold)"
            strokeWidth={major ? 1.6 : 0.7}
            opacity={major ? 0.95 : 0.55}
          />
        )
      })}
      {hero &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return (
            <text
              key={i}
              x={C + Math.sin(a) * 122}
              y={C - Math.cos(a) * 122 + 4}
              textAnchor="middle"
              fill="var(--dv-gold)"
              fontSize="11"
              letterSpacing="0.5"
              style={{ fontFamily: 'var(--font-card-title), Georgia, serif' }}
              opacity="0.9"
            >
              {toRoman(i === 0 ? 12 : i)}
            </text>
          )
        })}

      {/* anel armilar girando devagar */}
      <g mask={`url(#m-${uid})`}>
      <g className="origin-center animate-dv-spin-slow [transform-box:view-box]">
        <ellipse cx={C} cy={C} rx={hero ? 100 : 96} ry={hero ? 34 : 36} transform={`rotate(-24 ${C} ${C})`} stroke={critical ? 'var(--dv-gold)' : 'var(--dv-amethyst-text)'} strokeWidth="0.8" opacity="0.55" />
        <circle cx={C + (hero ? 91 : 88)} cy={C - 40} r="2.6" fill="var(--dv-gold-bright)" opacity="0.8" />
      </g>
      </g>

      {/* anel do tempo (72h) */}
      <circle cx={C} cy={C} r={R_ARC} stroke="rgba(236,229,216,0.09)" strokeWidth={hero ? 7 : 8} />
      <circle cx={C} cy={C} r={R_ARC + (hero ? 5 : 6)} stroke="rgba(236,229,216,0.14)" strokeWidth="0.6" />
      <circle cx={C} cy={C} r={R_ARC - (hero ? 5 : 6)} stroke="rgba(236,229,216,0.1)" strokeWidth="0.6" />
      {/* brilho do anel: traço largo e translúcido por baixo (sem filtro drop-shadow) */}
      <circle
        cx={C}
        cy={C}
        r={R_ARC}
        stroke={critical ? 'rgba(213,31,43,0.28)' : 'rgba(138,124,200,0.26)'}
        strokeWidth={hero ? 12 : 13}
        strokeDasharray={arcCirc}
        strokeDashoffset={arcCirc * (1 - ratio)}
        transform={`rotate(-90 ${C} ${C})`}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
      <circle
        cx={C}
        cy={C}
        r={R_ARC}
        stroke={arc}
        strokeWidth={hero ? 4 : 5}
        strokeDasharray={arcCirc}
        strokeDashoffset={arcCirc * (1 - ratio)}
        transform={`rotate(-90 ${C} ${C})`}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
      {ratio > 0 && (
        <path
          d={`M${end.x} ${end.y - 6} L${end.x + 4.5} ${end.y} L${end.x} ${end.y + 6} L${end.x - 4.5} ${end.y} Z`}
          fill={now}
          stroke={critical ? 'rgba(213,31,43,0.45)' : 'rgba(138,124,200,0.5)'}
          strokeWidth="3"
          paintOrder="stroke"
          transform={`rotate(${(endA * 180) / Math.PI} ${end.x} ${end.y})`}
        />
      )}
      <circle cx={C} cy={C} r={R_ARC - 14} stroke="rgba(186,176,159,0.2)" strokeWidth="0.7" strokeDasharray="1.5 4.5" />

      <g mask={`url(#m-${uid})`}>
        <SweepHand timerEndsAt={timerEndsAt} length={R_ARC - 6} critical={critical} />
      </g>

      {!hero && (
        <g>
          <path
            d={`M${C} ${C - 30} C${C + 2.5} ${C - 6} ${C + 6} ${C - 2.5} ${C + 30} ${C} C${C + 6} ${C + 2.5} ${C + 2.5} ${C + 6} ${C} ${C + 30} C${C - 2.5} ${C + 6} ${C - 6} ${C + 2.5} ${C - 30} ${C} C${C - 6} ${C - 2.5} ${C - 2.5} ${C - 6} ${C} ${C - 30} Z`}
            fill="var(--dv-text)"
            opacity="0.92"
          />
          <circle cx={C} cy={C} r="5.5" fill="var(--dv-ink)" stroke="var(--dv-gold)" strokeWidth="1" />
        </g>
      )}
      {!hero && <circle cx={C} cy={C} r="2.4" fill={critical ? 'var(--dv-blood-text)' : 'var(--dv-amethyst)'} />}
    </svg>
    </span>
  )
}

/**
 * Ponteiro de segundos contínuo (antes saltava de segundo em segundo e "voltava" a cada minuto).
 * Gira no sentido da contagem regressiva, atualizado por requestAnimationFrame sem re-render.
 */
function SweepHand({ timerEndsAt, length, critical }: { timerEndsAt: number; length: number; critical: boolean }) {
  const ref = useRef<SVGGElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const left = Math.max(0, timerEndsAt - Date.now())
      const angle = ((left % 60_000) / 60_000) * 360
      ref.current?.setAttribute('transform', `rotate(${angle} 160 160)`)
      if (left > 0) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [timerEndsAt])
  return (
    <g ref={ref}>
      <line x1="160" y1="182" x2="160" y2={160 - length} stroke={critical ? 'var(--dv-blood-text)' : 'var(--dv-amethyst-text)'} strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M160 ${160 - length - 3} l3.2 8 l-3.2 2.4 l-3.2 -2.4 Z`} fill={critical ? 'var(--dv-blood-text)' : 'var(--dv-amethyst-text)'} />
      <circle cx="160" cy="186" r="3.2" stroke="var(--dv-gold)" strokeWidth="1" />
    </g>
  )
}
