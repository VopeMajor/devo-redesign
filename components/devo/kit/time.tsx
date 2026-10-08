'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { formatDuration, useNow } from '../hooks'
import { CRITICAL_MS } from './tokens'

export type TimeTone = 'text' | 'cobalt' | 'gold' | 'blood' | 'paper'
export type TimeSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE: Record<TimeSize, string> = {
  sm: 'text-[18px]',
  md: 'text-[28px]',
  lg: 'text-[44px]',
  xl: 'text-[64px]',
}

const TONE: Record<TimeTone, string> = {
  text: 'text-dv-text',
  cobalt: 'text-dv-cobalt-text [text-shadow:0_0_18px_rgba(49,93,255,0.55)]',
  gold: 'text-dv-gold-bright [text-shadow:0_0_14px_rgba(236,212,154,0.35)]',
  blood: 'text-dv-blood-text [text-shadow:0_0_18px_rgba(213,31,43,0.7)]',
  paper: 'text-dv-paper-ink',
}

/**
 * Dígitos de tempo com largura fixa por caractere (tabular de verdade, em qualquer fonte) e
 * "virada" curta no dígito que mudou. Fonte de impacto (Oswald). `value` é o texto final
 * ("51:16:50", "3d 22h"). Leitores de tela recebem o texto inteiro uma vez (sem aria-live).
 */
export function TimeDigits({
  value,
  size = 'md',
  tone = 'text',
  flip = true,
  blinkColon = false,
  className,
  label,
}: {
  value: string
  size?: TimeSize
  tone?: TimeTone
  /** Anima o dígito que mudou. */
  flip?: boolean
  /** Separadores ":" piscam (use só em um relógio por tela). */
  blinkColon?: boolean
  className?: string
  /** Prefixo para leitores de tela ("Tempo restante"). */
  label?: string
}) {
  const chars = value.split('')
  return (
    <span className={cn('inline-flex items-baseline font-impact font-semibold leading-none [perspective:400px]', SIZE[size], TONE[tone], className)}>
      <span className="sr-only">
        {label ? `${label}: ` : ''}
        {value}
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {chars.map((c, i) => {
          const digit = c >= '0' && c <= '9'
          if (!digit) {
            const sep = c === ':'
            return (
              <span
                key={`s${i}`}
                className={cn(
                  'inline-block text-center',
                  sep ? 'w-[0.34em] -translate-y-[0.06em] opacity-70' : c === ' ' ? 'w-[0.28em]' : 'w-auto px-[0.04em] text-[0.55em] font-medium uppercase tracking-[0.06em] opacity-75',
                  sep && blinkColon && 'animate-dv-blink',
                )}
              >
                {c}
              </span>
            )
          }
          return (
            <span key={`d${i}-${c}`} className={cn('inline-block w-[0.6em] text-center', flip && 'animate-dv-digit')}>
              {c}
            </span>
          )
        })}
      </span>
    </span>
  )
}

/**
 * Contagem regressiva até `endsAt` (epoch ms). Fica vermelha e pulsa abaixo de `criticalMs`
 * (padrão 6h) e toca `heartbeat` uma vez ao cruzar o limite. `units` mostra H/MIN/SEG embaixo.
 */
export function Countdown({
  endsAt,
  size = 'lg',
  tone = 'cobalt',
  criticalMs = CRITICAL_MS,
  units = false,
  sound = true,
  label = 'Tempo restante',
  className,
  onCritical,
  render,
}: {
  endsAt: number
  size?: TimeSize
  tone?: TimeTone
  criticalMs?: number
  units?: boolean
  sound?: boolean
  label?: string
  className?: string
  onCritical?: () => void
  /** Personaliza o texto (padrão HH:MM:SS). */
  render?: (remainingMs: number) => string
}) {
  const now = useNow(1000)
  const remaining = Math.max(0, endsAt - now)
  const critical = remaining > 0 && remaining <= criticalMs
  const was = useRef(critical)
  useEffect(() => {
    if (critical && !was.current) {
      if (sound) playSfx('heartbeat')
      onCritical?.()
    }
    was.current = critical
  }, [critical, onCritical, sound])

  const text = render ? render(remaining) : formatDuration(remaining)
  return (
    <span role="timer" className={cn('inline-flex flex-col', className)}>
      <TimeDigits value={text} size={size} tone={critical ? 'blood' : tone} label={label} blinkColon={critical} />
      {units && !render && <TimeUnits critical={critical} />}
    </span>
  )
}

function TimeUnits({ critical }: { critical: boolean }): ReactNode {
  return (
    <span aria-hidden="true" className={cn('dv-label mt-1.5 grid grid-cols-3 text-[10px]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>
      <span>Horas</span>
      <span className="text-center">Min</span>
      <span className="text-right">Seg</span>
    </span>
  )
}
