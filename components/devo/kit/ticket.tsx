'use client'

import type { CSSProperties, ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { GlyphCheck, GlyphKeyhole } from './glyphs'
import { Stamp } from './stamp'

export type TicketState = 'claimed' | 'today' | 'upcoming' | 'locked' | 'missed'

export type TicketData = {
  /** Posição (1, 2, 3…). Vira "01", "02"… */
  index: number
  /** Ícone/arte da recompensa (glifo, mini carta). */
  reward: ReactNode
  /** Quantidade ou valor ("+2h", "×3", "1"). */
  amount: string
  /** Linha curta abaixo ("Tempo", "Carta rara"). */
  caption?: string
  state: TicketState
}

/** Furos de picote no topo da tira (máscara). */
const PERFORATION = {
  WebkitMaskImage: 'radial-gradient(circle at 6px 0, transparent 3.2px, #000 3.8px)',
  maskImage: 'radial-gradient(circle at 6px 0, transparent 3.2px, #000 3.8px)',
  WebkitMaskSize: '12px 100%',
  maskSize: '12px 100%',
  WebkitMaskRepeat: 'repeat-x',
  maskRepeat: 'repeat-x',
} as CSSProperties

const STATE_LABEL: Record<TicketState, string> = {
  claimed: 'Feito',
  today: 'Resgatar',
  upcoming: 'Em breve',
  locked: 'Bloqueado',
  missed: 'Perdido',
}

/**
 * Tira de papel numerada (padrão do futuro check-in diário e de trilhas de recompensa).
 * Estados: claimed (apagada + carimbo) · today (erguida, botão "Resgatar") · upcoming · locked · missed.
 */
export function Ticket({
  data,
  onClaim,
  claimLabel = 'Resgatar',
  loading = false,
  delay = 0,
  className,
}: {
  data: TicketData
  onClaim?: (index: number) => void
  claimLabel?: string
  loading?: boolean
  /** Atraso de entrada em ms (o RewardStrip calcula). */
  delay?: number
  className?: string
}) {
  const { index, reward, amount, caption, state } = data
  const num = String(index).padStart(2, '0')
  const today = state === 'today'
  const dim = state === 'claimed' || state === 'missed'
  const locked = state === 'locked'
  return (
    <li
      className={cn('animate-dv-ticket-in relative flex w-[78px] shrink-0 snap-start flex-col', className)}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${num}: ${amount}${caption ? ` ${caption}` : ''} — ${STATE_LABEL[state]}`}
    >
      {/* corda/haste onde a tira pende */}
      <span aria-hidden="true" className={cn('mx-auto w-px', today ? 'h-2 bg-dv-gold' : 'h-4 bg-dv-line-strong')} />
      <div
        className={cn(
          'relative flex flex-1 flex-col items-center px-1.5 pb-2 pt-3',
          locked ? 'bg-[linear-gradient(180deg,#3b3a3f,#26252b)] text-dv-text-3' : 'dv-paper-bg',
          dim && 'saturate-[0.4] brightness-[0.82]',
          today && 'shadow-[0_0_0_1.5px_var(--dv-gold),0_14px_30px_-10px_rgba(236,229,216,0.55)]',
        )}
        style={PERFORATION}
      >
        <span className={cn('font-impact text-[26px] font-semibold leading-none dv-tabular', locked ? 'text-dv-text-3' : today ? 'text-dv-cobalt-deep' : 'text-dv-paper-ink')}>{num}</span>
        <span aria-hidden="true" className={cn('mt-1 h-px w-8', locked ? 'bg-white/15' : 'bg-dv-paper-ink/25')} />
        <div
          className={cn(
            'dv-cut mt-2.5 grid size-[50px] place-items-center',
            locked ? 'bg-black/30 text-dv-text-3' : 'bg-[linear-gradient(160deg,var(--dv-ink-3),var(--dv-ink))] text-dv-gold shadow-[inset_0_0_0_1px_var(--dv-gold-deep)]',
          )}
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <span className="flex size-7 items-center justify-center [&>svg]:size-full">{locked ? <GlyphKeyhole /> : reward}</span>
        </div>
        <span className={cn('mt-2 font-impact text-[18px] font-semibold leading-none dv-tabular', locked ? 'text-dv-text-3' : 'text-dv-paper-ink')}>{amount}</span>
        {caption && <span className={cn('mt-1 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.1em]', locked ? 'text-dv-text-3' : 'text-dv-paper-ink/70')}>{caption}</span>}
        <span className="flex-1" />
        {state === 'claimed' && (
          <span className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center">
            <Stamp text="OK" shape="round" tone="cobalt" size={58} rotate={-14} ring="RESGATADO · RESGATADO · " />
          </span>
        )}
        {state === 'missed' && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),var(--dv-blood)_50%,transparent_calc(50%+1px))]" />}
      </div>
      {today && onClaim ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            playSfx('confirm')
            onClaim(index)
          }}
          className="dv-focus relative min-h-11 bg-[linear-gradient(180deg,var(--dv-gold-bright),var(--dv-gold)_55%,var(--dv-gold-deep))] font-display text-[11px] font-bold uppercase tracking-[0.14em] text-dv-paper-ink transition-transform duration-[120ms] active:scale-[0.96] disabled:opacity-60"
        >
          {loading ? '…' : claimLabel}
        </button>
      ) : (
        <span
          className={cn(
            'flex min-h-9 items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em]',
            state === 'claimed' && 'bg-dv-cobalt-dim text-dv-cobalt-text',
            state === 'today' && 'bg-dv-gold-deep text-dv-paper',
            state === 'upcoming' && 'bg-dv-ink-3 text-dv-text-3',
            state === 'locked' && 'bg-dv-ink-2 text-dv-text-3',
            state === 'missed' && 'bg-dv-ink-3 text-dv-blood-text',
          )}
        >
          {state === 'claimed' && <GlyphCheck className="size-3 shrink-0" />}
          {STATE_LABEL[state]}
        </span>
      )}
    </li>
  )
}

/**
 * Trilha de tiras numeradas que entram em sequência (como papéis descendo de um varal).
 * Rola na horizontal com snap no celular. Pronta para o check-in diário.
 */
export function RewardStrip({
  items,
  onClaim,
  label = 'Recompensas',
  loadingIndex,
  className,
}: {
  items: TicketData[]
  onClaim?: (index: number) => void
  /** Nome acessível da lista. */
  label?: string
  loadingIndex?: number
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {/* varal */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-dv-gold-deep via-dv-gold to-dv-gold-deep" />
      <ol aria-label={label} className="devo-scroll flex snap-x gap-2.5 overflow-x-auto px-1 pb-3 pt-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, i) => (
          <Ticket key={it.index} data={it} onClaim={onClaim} delay={i * 70} loading={loadingIndex === it.index} />
        ))}
      </ol>
    </div>
  )
}
