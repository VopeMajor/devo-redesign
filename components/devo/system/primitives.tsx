import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Microtipografia técnica: códigos de sistema, seções, coordenadas. */
export function SystemLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground', className)}>{children}</span>
}

export function RecordID({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/80', className)}>
      <span className="text-muted-foreground">ID.RECORD: </span>
      {value}
    </span>
  )
}

export type SystemTone = 'active' | 'critical' | 'idle'

export function SystemStatus({ tone, children, className }: { tone: SystemTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]',
        tone === 'active' && 'text-primary',
        tone === 'critical' && 'text-destructive',
        tone === 'idle' && 'text-muted-foreground',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', tone === 'active' && 'bg-primary', tone === 'critical' && 'bg-destructive dv-pulse', tone === 'idle' && 'bg-muted-foreground')}
      />
      {children}
    </span>
  )
}

/** Divisor técnico: índice de seção, linha com marcações e rótulo opcional. */
export function TechnicalDivider({ index, label, className, animated }: { index?: string; label?: string; className?: string; animated?: boolean }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3 text-muted-foreground', className)}>
      {index && <span className="font-mono text-[10px] tracking-[0.2em]">{index}</span>}
      <span className={cn('relative h-px flex-1 bg-border', animated && 'dv-line')}>
        <span className="absolute -top-[3px] left-0 h-[7px] w-px bg-foreground/40" />
        <span className="absolute -top-[3px] right-0 h-[7px] w-px bg-foreground/40" />
        <span className="absolute -top-px left-[38%] h-[3px] w-6 bg-primary/70" />
      </span>
      {label && <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{label}</span>}
    </div>
  )
}

/** Título editorial de seção: serif + rótulo japonês discreto + ação opcional. */
export function SectionHeading({ title, jp, action, className, as: Tag = 'h2' }: { title: string; jp?: string; action?: ReactNode; className?: string; as?: 'h2' | 'h3' }) {
  return (
    <div className={cn('flex items-end justify-between gap-4 border-b border-border pb-2', className)}>
      <Tag className="flex items-baseline gap-3 font-serif text-2xl uppercase leading-none tracking-[0.02em] text-foreground">
        {title}
        {jp && (
          <span lang="ja" className="font-sans text-[10px] normal-case tracking-[0.2em] text-muted-foreground">
            {jp}
          </span>
        )}
      </Tag>
      {action}
    </div>
  )
}

export function LinkAction({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dv-trace inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80 disabled:cursor-default disabled:opacity-40"
    >
      {children}
      <ArrowRight className="size-3" aria-hidden="true" />
    </button>
  )
}

/** Painel escuro de alerta: usado apenas para perigo real (tempo crítico, avisos de risco). */
export function CriticalAlert({
  source,
  title,
  body,
  time,
  action,
  className,
}: {
  source: string
  title: string
  body: string
  time?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div role="alert" className={cn('dv-dark relative overflow-hidden border border-destructive/40 bg-background text-foreground', className)}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-destructive" />
      <div className="flex items-start gap-4 p-4 pl-5">
        <AlertTriangle className="mt-0.5 size-6 shrink-0 text-destructive" strokeWidth={1.4} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <SystemLabel>{source}</SystemLabel>
            {time && <SystemLabel className="tabular-nums">{time}</SystemLabel>}
          </div>
          <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.12em] text-destructive">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/75">{body}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-3 h-3 w-16 bg-[repeating-linear-gradient(-55deg,var(--dv-red)_0_3px,transparent_3px_7px)] opacity-80"
      />
    </div>
  )
}
