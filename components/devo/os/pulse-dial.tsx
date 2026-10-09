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
  const arc = critical ? 'var(--dv-blood)' : 'var(--dv-cobalt)'
  const arcHi = critical ? 'var(--dv-blood-text)' : '#9fb2ff'
  const endA = ratio * Math.PI * 2
  const end = { x: C + Math.sin(endA) * R_ARC, y: C - Math.cos(endA) * R_ARC }

  return (
    <svg viewBox="0 0 320 320" aria-hidden="true" className={cn('overflow-visible', className)} fill="none">
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--dv-gold-bright)" />
          <stop offset="0.3" stopColor="var(--dv-gold-deep)" />
          <stop offset="0.55" stopColor="var(--dv-gold)" />
          <stop offset="0.8" stopColor="var(--dv-gold-deep)" />
          <stop offset="1" stopColor="var(--dv-gold-bright)" />
        </linearGradient>
        <radialGradient id={`f-${uid}`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor={critical ? '#3a0a12' : '#2b2540'} stopOpacity="0.95" />
          <stop offset="0.65" stopColor="#0a0f1c" stopOpacity="0.92" />
          <stop offset="1" stopColor="#05070d" stopOpacity="0.96" />
        </radialGradient>
        {/* no herói, órbita e ponteiro somem na faixa dos dígitos (máscara com borda suave) */}
        <filter id={`b-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <mask id={`m-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="320">
          <rect x="0" y="0" width="320" height="320" fill="#fff" />
          {hero && <ellipse cx="160" cy="160" rx="118" ry="52" fill="#000" filter={`url(#b-${uid})`} />}
        </mask>
      </defs>

      {/* face */}
      <circle cx={C} cy={C} r="148" fill={`url(#f-${uid})`} />

      {/* excedente acima de 72h: trilho pontilhado + arco dourado externo */}
      <circle cx={C} cy={C} r={R_EXCESS} stroke="rgba(201,164,92,0.22)" strokeWidth="1" strokeDasharray="1.5 5" />
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
          className="drop-shadow-[0_0_6px_rgba(236,212,154,0.7)]"
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
        <ellipse cx={C} cy={C} rx={hero ? 100 : 96} ry={hero ? 34 : 36} transform={`rotate(-24 ${C} ${C})`} stroke="var(--dv-gold)" strokeWidth="0.8" opacity="0.45" />
        <circle cx={C + (hero ? 91 : 88)} cy={C - 40} r="2.6" fill="var(--dv-gold-bright)" opacity="0.8" />
      </g>
      </g>

      {/* anel do tempo (72h) */}
      <circle cx={C} cy={C} r={R_ARC} stroke="rgba(236,238,242,0.1)" strokeWidth={hero ? 7 : 9} />
      <circle
        cx={C}
        cy={C}
        r={R_ARC}
        stroke={arc}
        strokeWidth={hero ? 5 : 8}
        strokeDasharray={arcCirc}
        strokeDashoffset={arcCirc * (1 - ratio)}
        transform={`rotate(-90 ${C} ${C})`}
        style={{ filter: `drop-shadow(0 0 7px ${critical ? 'rgba(213,31,43,0.9)' : 'rgba(138,124,200,0.9)'})` }}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
      {ratio > 0 && (
        <path
          d={`M${end.x} ${end.y - 6} L${end.x + 4.5} ${end.y} L${end.x} ${end.y + 6} L${end.x - 4.5} ${end.y} Z`}
          fill={arcHi}
          transform={`rotate(${(endA * 180) / Math.PI} ${end.x} ${end.y})`}
        />
      )}
      <circle cx={C} cy={C} r={R_ARC - 12} stroke="rgba(125,151,255,0.22)" strokeWidth="0.8" strokeDasharray="2 4" />

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
          <circle cx={C} cy={C} r="5" fill={arc} />
        </g>
      )}
      {!hero && <circle cx={C} cy={C} r="3" fill="var(--dv-gold-bright)" />}
    </svg>
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
      <line x1="160" y1="182" x2="160" y2={160 - length} stroke={critical ? 'var(--dv-blood-text)' : 'var(--dv-gold-bright)'} strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M160 ${160 - length - 2} l3 7 h-6 Z`} fill={critical ? 'var(--dv-blood-text)' : 'var(--dv-gold-bright)'} />
      <circle cx="160" cy="186" r="3.2" stroke="var(--dv-gold)" strokeWidth="1" />
    </g>
  )
}
