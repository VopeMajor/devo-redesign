'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { playSfx, type Sfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { DeadlyVoteSymbol } from '../system/symbol'
import { toRoman } from './glyphs'
import { CURTAIN_MS, CURTAIN_SWAP_MS } from './tokens'

export type CurtainTone = 'system' | 'alert' | 'gold'
/** forward = lâminas entram pela esquerda e saem pela direita (avançar); back = espelhado (voltar/sair). */
export type CurtainDirection = 'forward' | 'back'

export type CurtainState = {
  /** Texto curto no centro ("Despertando", "Reconectando"). */
  label: string
  tone: CurtainTone
  direction: CurtainDirection
  /** Muda a cada execução (reinicia as animações). */
  seq: number
}

export type CurtainOptions = {
  tone?: CurtainTone
  direction?: CurtainDirection
  /** Som no início da cortina. Padrão: nenhum (quem chama decide; ver IDENTIDADE.md › Som). */
  sfx?: Sfx | false
}

/**
 * Sistema único de transição entre fases/telas.
 *
 *   const { curtain, run } = useCurtain()
 *   run('Despertando', () => dispatch(...))   // ação em 850ms, cortina some em 1800ms
 *   <Curtain state={curtain} />
 *
 * Bloqueia duplo clique: enquanto uma cortina corre, novas chamadas são ignoradas.
 */
export function useCurtain() {
  const [curtain, setCurtain] = useState<CurtainState | null>(null)
  const busy = useRef(false)
  const seq = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const run = useCallback((label: string, action: () => void, opts: CurtainOptions = {}) => {
    if (busy.current) return false
    busy.current = true
    seq.current += 1
    if (opts.sfx) playSfx(opts.sfx)
    setCurtain({ label, tone: opts.tone ?? 'system', direction: opts.direction ?? 'forward', seq: seq.current })
    timers.current.push(
      window.setTimeout(action, CURTAIN_SWAP_MS),
      window.setTimeout(() => {
        setCurtain(null)
        busy.current = false
      }, CURTAIN_MS),
    )
    return true
  }, [])

  return { curtain, run, isBusy: () => busy.current }
}

const SLAB: Record<CurtainTone, { lead: string; slab: string; ring: string; line: string }> = {
  system: {
    lead: 'bg-[linear-gradient(90deg,#0d1f7a,var(--dv-cobalt-deep)_60%,#7d97ff)]',
    slab: 'bg-[linear-gradient(90deg,var(--dv-ink)_0%,#070b18_60%,var(--dv-ink-2)_100%)]',
    ring: 'text-dv-cobalt-text',
    line: 'bg-dv-gold',
  },
  gold: {
    lead: 'bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-gold)_60%,var(--dv-gold-bright))]',
    slab: 'bg-[linear-gradient(90deg,var(--dv-ink)_0%,#0d0b08_60%,var(--dv-ink-2)_100%)]',
    ring: 'text-dv-gold',
    line: 'bg-dv-cobalt',
  },
  alert: {
    lead: 'bg-[linear-gradient(90deg,var(--dv-blood-deep),var(--dv-blood)_60%,var(--dv-blood-text))]',
    slab: 'bg-[linear-gradient(90deg,#0b0204_0%,#160307_60%,var(--dv-ink)_100%)]',
    ring: 'text-dv-blood-text',
    line: 'bg-dv-blood',
  },
}

/**
 * Cortina de corte diagonal: faixa colorida na frente, lâmina escura atrás, filete dourado na borda.
 * Cobre a tela em ~470ms, segura o rótulo com um mostrador girando e sai na mesma direção.
 * Com prefers-reduced-motion vira um esmaecer simples (mesma duração).
 */
export function Curtain({
  state,
  className,
  freezeAt,
}: {
  state: CurtainState | null
  className?: string
  /** Só vitrine: congela a cortina neste instante (ms) e a desenha dentro do contêiner (absolute). */
  freezeAt?: number
}) {
  if (!state) return null
  const frozen = typeof freezeAt === 'number'
  const s = SLAB[state.tone]
  const back = state.direction === 'back'
  const vars = { '--dv-curtain-skew': back ? '14deg' : '-14deg', ...(frozen ? { '--dv-curtain-at': `${freezeAt}ms` } : {}) } as CSSProperties
  return (
    <div
      key={state.seq}
      role={frozen ? undefined : 'status'}
      aria-live={frozen ? undefined : 'assertive'}
      aria-hidden={frozen || undefined}
      className={cn(
        'inset-0 overflow-hidden',
        frozen ? 'dv-curtain-frozen absolute z-0' : 'fixed z-[100] motion-reduce:bg-dv-ink motion-reduce:dv-curtain-reduced',
        className,
      )}
      style={vars}
    >
      {/* Tudo espelhado no modo "back" para as lâminas virem da direita. */}
      <div className={cn('absolute inset-0', back && '-scale-x-100')} aria-hidden="true">
        {/* faixa de ataque (cor do tom) */}
        <span className={cn('dv-curtain-band absolute -inset-y-[10%] left-[-50%] w-[200%]', s.lead)} style={{ animationDelay: '-40ms' }} />
        {/* lâmina principal */}
        <span className={cn('dv-curtain-slab absolute -inset-y-[10%] left-[-50%] w-[200%] shadow-[0_0_60px_rgba(0,0,0,0.9)]', s.slab)}>
          <span className={cn('absolute inset-y-0 left-0 w-[2px] opacity-90', s.line)} />
          <span className={cn('absolute inset-y-0 right-0 w-[2px] opacity-90', s.line)} />
          <span className="absolute inset-0 dv-scanlines opacity-60" />
        </span>
      </div>

      {/* Centro: mostrador + rótulo. Não espelha (o texto precisa ler normal). */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
        <div aria-hidden="true" className={cn('dv-curtain-ring relative size-[188px]', s.ring)}>
          <CurtainDial />
          <DeadlyVoteSymbol variant="mark" className="absolute inset-[30%] text-dv-text drop-shadow-[0_0_14px_rgba(49,93,255,0.7)]" />
        </div>
        <div className="dv-curtain-label flex flex-col items-center">
          <p className="font-display text-[24px] font-semibold uppercase tracking-[0.3em] text-dv-text [text-shadow:0_0_24px_rgba(0,0,0,0.9)]">{state.label}</p>
          <span aria-hidden="true" className="relative mt-3 h-px w-40 bg-white/15">
            <span className={cn('dv-curtain-progress absolute inset-0', s.line)} />
          </span>
          <span aria-hidden="true" className="dv-label mt-2.5 text-[10px] text-dv-text-3">
            DEVO · Record System
          </span>
        </div>
      </div>
    </div>
  )
}

/** Mostrador de 12 horas com numerais romanos (SVG puro, leve). */
function CurtainDial() {
  return (
    <svg viewBox="0 0 160 160" className="size-full" fill="none" stroke="currentColor">
      <circle cx="80" cy="80" r="76" strokeWidth="1" opacity="0.5" />
      <circle cx="80" cy="80" r="58" strokeWidth="0.8" opacity="0.4" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2
        const long = i % 5 === 0
        const r1 = long ? 64 : 68
        return (
          <line
            key={i}
            x1={80 + Math.sin(a) * r1}
            y1={80 - Math.cos(a) * r1}
            x2={80 + Math.sin(a) * 72}
            y2={80 - Math.cos(a) * 72}
            strokeWidth={long ? 1.6 : 0.7}
            opacity={long ? 1 : 0.6}
          />
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <text
            key={i}
            x={80 + Math.sin(a) * 47}
            y={80 - Math.cos(a) * 47 + 3}
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontSize="8"
            style={{ fontFamily: 'var(--font-card-title)' }}
            opacity="0.85"
          >
            {toRoman(i === 0 ? 12 : i)}
          </text>
        )
      })}
    </svg>
  )
}
