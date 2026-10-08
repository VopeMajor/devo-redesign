'use client'

import { useEffect, useRef } from 'react'
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
  // Brilho como drop-shadow no número inteiro (fica fora da máscara das casas; text-shadow seria cortado).
  cobalt: 'text-dv-cobalt-text [filter:drop-shadow(0_0_10px_rgba(49,93,255,0.6))]',
  gold: 'text-dv-gold-bright [filter:drop-shadow(0_0_8px_rgba(236,212,154,0.4))]',
  blood: 'text-dv-blood-text [filter:drop-shadow(0_0_10px_rgba(213,31,43,0.75))]',
  paper: 'text-dv-paper-ink',
}

type Token = { kind: 'digits'; text: string } | { kind: 'sep'; text: string } | { kind: 'text'; text: string }

/** Quebra "51:16:50" / "3d 22h" em grupos de dígitos, separadores ":" e texto. */
function tokenize(value: string): Token[] {
  const out: Token[] = []
  for (const c of value) {
    const kind = c >= '0' && c <= '9' ? 'digits' : c === ':' ? 'sep' : 'text'
    const last = out[out.length - 1]
    if (last && last.kind === kind && kind !== 'sep') last.text += c
    else out.push({ kind, text: c } as Token)
  }
  return out
}

/**
 * Uma casa de dígito: largura fixa (0.6em) e máscara justa à altura do algarismo (0.12em–0.95em da
 * caixa de 1em). Na troca o dígito novo rola de cima e o antigo sai por baixo, deslocados exatamente
 * uma altura de algarismo (como um contador): nunca se sobrepõem, nunca vazam da linha e sempre há
 * dígito visível. Sem `flip` (ou com movimento reduzido) troca seca.
 */
function DigitCell({ c, flip }: { c: string; flip: boolean }) {
  const last = useRef(c)
  const out = useRef<string | null>(null)
  const seq = useRef(0)
  if (last.current !== c) {
    out.current = last.current
    last.current = c
    seq.current += 1
  }
  const animating = flip && out.current !== null && seq.current > 0
  return (
    <span className="relative block h-[1em] w-[0.6em] text-center leading-[1em] [clip-path:inset(0.12em_0_0.05em_0)]">
      <span key={`in${seq.current}`} className={cn('block h-[1em]', animating && 'animate-dv-digit-in')}>
        {c}
      </span>
      {animating && (
        <span key={`out${seq.current}`} aria-hidden="true" className="animate-dv-digit-out pointer-events-none absolute inset-x-0 top-0 block h-[1em] text-center motion-reduce:hidden">
          {out.current}
        </span>
      )}
    </span>
  )
}

/**
 * Dígitos de tempo com largura fixa por caractere (tabular de verdade, em qualquer fonte) e
 * virada mascarada no dígito que mudou. Fonte de impacto (Oswald). `value` é o texto final
 * ("51:16:50", "3d 22h"). Leitores de tela recebem o texto inteiro uma vez (sem aria-live).
 * `units` põe um rótulo centralizado sob cada grupo de dígitos (ex.: ['Dias','Horas','Min','Seg']).
 */
export function TimeDigits({
  value,
  size = 'md',
  tone = 'text',
  flip = true,
  blinkColon = false,
  units,
  unitsTone,
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
  /** Rótulos sob cada grupo de dígitos, na ordem. */
  units?: string[]
  /** Cor dos rótulos (padrão: texto 3; sangue quando o tom é blood). */
  unitsTone?: string
  className?: string
  /** Prefixo para leitores de tela ("Tempo restante"). */
  label?: string
}) {
  const tokens = tokenize(value)
  let group = -1
  const unitClass = cn('dv-label mt-1.5 block whitespace-nowrap text-center text-[10px] font-normal leading-none tracking-[0.16em]', unitsTone ?? (tone === 'blood' ? 'text-dv-blood-text' : tone === 'paper' ? 'text-dv-paper-ink/60' : 'text-dv-text-3'))
  return (
    <span className={cn('inline-flex items-start font-impact font-semibold leading-[1em]', SIZE[size], TONE[tone], className)}>
      <span className="sr-only">
        {label ? `${label}: ` : ''}
        {value}
      </span>
      {tokens.map((t, ti) => {
        if (t.kind === 'digits') {
          group += 1
          const digits = (
            <span className="flex items-start">
              {t.text.split('').map((c, i) => (
                <DigitCell key={i} c={c} flip={flip} />
              ))}
            </span>
          )
          if (!units) return <span key={ti} aria-hidden="true" className="flex items-start">{digits}</span>
          return (
            <span key={ti} aria-hidden="true" className="inline-flex flex-col items-center">
              {digits}
              <span className={unitClass}>{units[group] ?? ''}</span>
            </span>
          )
        }
        const sep = t.kind === 'sep'
        // Separadores e sufixos ("d", "h") ocupam a mesma caixa de 1em das casas; sufixo pousa na base.
        const glyph = sep ? (
          <span className={cn('block h-[1em] w-[0.34em] -translate-y-[0.14em] text-center opacity-70', blinkColon && 'animate-dv-blink')}>{t.text}</span>
        ) : t.text.trim() === '' ? (
          <span className="block h-[1em] w-[0.28em]" />
        ) : (
          <span className="flex h-[1em] items-end px-[0.04em] pb-[0.13em]">
            <span className="text-[0.55em] font-medium uppercase leading-none tracking-[0.06em] opacity-75">{t.text}</span>
          </span>
        )
        if (!units) return <span key={ti} aria-hidden="true" className="flex items-start">{glyph}</span>
        return (
          <span key={ti} aria-hidden="true" className="inline-flex flex-col items-center">
            {glyph}
          </span>
        )
      })}
    </span>
  )
}

/**
 * Contagem regressiva até `endsAt` (epoch ms). Fica vermelha e pulsa abaixo de `criticalMs`
 * (padrão 6h) e toca `heartbeat` uma vez ao cruzar o limite. `units` põe rótulos sob cada par.
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
  /** true = Horas/Min/Seg; ou a lista de rótulos (um por grupo de dígitos). */
  units?: boolean | string[]
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
  const unitLabels = units === true ? ['Horas', 'Min', 'Seg'] : Array.isArray(units) ? units : undefined
  return (
    <span role="timer" className={cn('inline-flex flex-col', className)}>
      <TimeDigits value={text} size={size} tone={critical ? 'blood' : tone} label={label} blinkColon={critical} units={unitLabels} />
    </span>
  )
}

