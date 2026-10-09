import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatTone = 'text' | 'cobalt' | 'gold' | 'blood'

const VALUE: Record<StatTone, string> = {
  text: 'text-dv-text',
  cobalt: 'text-dv-cobalt-text',
  gold: 'text-dv-gold-bright',
  blood: 'text-dv-blood-text',
}
const RULE: Record<StatTone, string> = {
  text: 'bg-dv-line-strong',
  cobalt: 'bg-dv-cobalt',
  gold: 'bg-dv-gold',
  blood: 'bg-dv-blood',
}

/**
 * Número com rótulo (placar, cartas, trocas, posição). Valor em fonte de impacto, tabular.
 * Régua vertical à esquerda na cor do tom. `hint` é uma linha curta abaixo.
 */
export function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'text',
  size = 'md',
  theme = 'jornada',
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: ReactNode
  icon?: ReactNode
  tone?: StatTone
  size?: 'sm' | 'md' | 'lg'
  /** `interior`: valor em serifada fina (estilo "7,612" do Compêndio), rótulo sans, cores --in-*. */
  theme?: 'jornada' | 'interior'
  className?: string
}) {
  if (theme === 'interior') {
    const vs = size === 'lg' ? 'text-[44px]' : size === 'md' ? 'text-[30px]' : 'text-[22px]'
    const col = tone === 'cobalt' ? 'text-in-accent' : tone === 'blood' ? 'text-in-alert' : tone === 'gold' ? 'text-in-gold' : 'text-in-fg'
    return (
      <div className={cn('relative min-w-0', className)}>
        <dt className="flex items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">
          {icon && <span className="flex size-3.5 items-center [&>svg]:size-full">{icon}</span>}
          {label}
        </dt>
        <dd className={cn('mt-1.5 flex items-baseline gap-1 font-serif font-light leading-none tabular-nums', vs, col)}>
          {value}
          {unit && <span className="font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-in-fg-3">{unit}</span>}
        </dd>
        {hint && <dd className="mt-1.5 font-sans text-[11px] uppercase tracking-[0.08em] text-in-fg-3">{hint}</dd>}
        <span aria-hidden="true" className="mt-2 block h-px w-8 bg-in-data" />
      </div>
    )
  }
  const valueSize = size === 'lg' ? 'text-[40px]' : size === 'md' ? 'text-[28px]' : 'text-[20px]'
  return (
    <div className={cn('relative min-w-0 pl-3', className)}>
      <span aria-hidden="true" className={cn('absolute bottom-1 left-0 top-1 w-[2px]', RULE[tone])} />
      <dt className="dv-label flex items-center gap-1.5 text-[10px] text-dv-text-3">
        {icon && <span className="flex size-3.5 items-center [&>svg]:size-full">{icon}</span>}
        {label}
      </dt>
      <dd className={cn('mt-1 flex items-baseline gap-1 font-impact font-semibold leading-none dv-tabular', valueSize, VALUE[tone])}>
        {value}
        {unit && <span className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-dv-text-3">{unit}</span>}
      </dd>
      {hint && <dd className="mt-1 text-[12px] leading-snug text-dv-text-3">{hint}</dd>}
    </div>
  )
}

/** Grade de Stats (usa <dl>). */
export function StatGrid({ children, cols = 3, className }: { children: ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  return <dl className={cn('grid gap-4', cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4', className)}>{children}</dl>
}
