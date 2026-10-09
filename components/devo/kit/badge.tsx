'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'

export type BadgeTone = 'cobalt' | 'gold' | 'paper' | 'blood' | 'neutral'

const BADGE: Record<BadgeTone, string> = {
  cobalt: 'bg-dv-ink-3 text-dv-text [--line:var(--dv-amethyst)]',
  gold: 'bg-[#1d1b18] text-dv-gold-bright [--line:var(--dv-gold)]',
  paper: 'bg-dv-paper text-dv-paper-ink [--line:var(--dv-gold-deep)]',
  blood: 'bg-dv-ink-3 text-dv-blood-text [--line:var(--dv-blood)]',
  neutral: 'bg-dv-ink-3 text-dv-text-2 [--line:var(--dv-line-strong)]',
}

/**
 * Selo de estado curto ("AO VIVO", "LENDÁRIA", "EM BREVE"). Não é clicável.
 * `dot` acende um ponto (pisca quando `live`).
 */
export function Badge({ children, tone = 'neutral', dot, live, className }: { children: ReactNode; tone?: BadgeTone; dot?: boolean; live?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-6 items-center gap-1.5 px-2.5 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.18em] shadow-[inset_0_0_0_1px_var(--line)]',
        BADGE[tone],
        className,
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {(dot || live) && <span aria-hidden="true" className={cn('size-1.5 rounded-full bg-current', live && 'animate-dv-blink')} />}
      {children}
    </span>
  )
}

/**
 * Filtro/opção alternável (aria-pressed). Alvo de 44px de altura.
 */
export function Chip({
  selected = false,
  children,
  icon,
  className,
  onClick,
  tone = 'cobalt',
  theme = 'jornada',
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { selected?: boolean; icon?: ReactNode; tone?: 'cobalt' | 'gold'; theme?: 'jornada' | 'interior' }) {
  if (theme === 'interior') {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={(e) => {
          playSfx('card-select')
          onClick?.(e)
        }}
        className={cn(
          'dv-focus inline-flex min-h-11 items-center gap-2 px-3.5 font-sans text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-150 enabled:active:scale-[0.96] disabled:opacity-40',
          selected ? 'bg-in-accent-fill text-white shadow-[0_0_14px_-4px_rgba(138,124,200,0.8)]' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] enabled:hover:text-in-fg enabled:hover:shadow-[inset_0_0_0_1px_var(--in-fg-2)]',
          className,
        )}
        {...rest}
      >
        {icon && <span className="flex size-3.5 items-center [&>svg]:size-full">{icon}</span>}
        {children}
      </button>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={(e) => {
        playSfx('card-select')
        onClick?.(e)
      }}
      className={cn(
        'dv-focus group relative inline-flex min-h-11 items-center gap-2 px-4 font-mono text-[11px] uppercase tracking-[0.18em] transition-[color,transform] duration-200 enabled:active:scale-[0.96] disabled:opacity-40',
        selected ? 'text-white' : 'text-dv-text-2 enabled:hover:text-dv-text',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 inset-y-1.5 -z-0 -skew-x-[14deg] border transition-colors duration-200',
          selected
            ? tone === 'gold'
              ? 'border-dv-gold bg-[#22201c] shadow-[0_0_14px_-4px_var(--dv-gold)]'
              : 'border-dv-gold-bright bg-dv-ink-3 text-dv-text shadow-[0_0_14px_-4px_rgba(138,124,200,0.7)]'
            : 'border-dv-line-strong bg-dv-ink-2/80 group-enabled:group-hover:border-dv-text-3',
        )}
      />
      {icon && <span className="relative flex size-3.5 items-center [&>svg]:size-full">{icon}</span>}
      <span className="relative">{children}</span>
    </button>
  )
}
