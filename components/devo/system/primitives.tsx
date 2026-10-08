import type { ReactNode } from 'react'
import { GlyphAlert, GlyphArrow, Kicker, SectionHeader } from '@/components/devo/kit'
import { cn } from '@/lib/utils'

/**
 * Peças pequenas do Record (Deadly Vote Record System) sobre o kit "Tribunal do Relógio".
 * Superfície padrão: ink. Peças em papel ficam nos próprios componentes (record-file, histórico).
 */

/** Microtipografia técnica: códigos de sistema, seções, coordenadas. */
export function SystemLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('dv-label text-[10px] text-dv-text-3', className)}>{children}</span>
}

export function RecordID({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-2', className)}>
      <span className="text-dv-text-3">ID.RECORD: </span>
      {value}
    </span>
  )
}

export type SystemTone = 'active' | 'critical' | 'idle'

export function SystemStatus({ tone, children, className }: { tone: SystemTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]',
        tone === 'active' && 'text-dv-cobalt-text',
        tone === 'critical' && 'text-dv-blood-text',
        tone === 'idle' && 'text-dv-text-3',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full bg-current', tone === 'critical' && 'animate-dv-blink')}
      />
      {children}
    </span>
  )
}

/** Divisor técnico: índice de seção, régua com marcações e rótulo opcional. */
export function TechnicalDivider({ index, label, className }: { index?: string; label?: string; className?: string; animated?: boolean }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3 text-dv-text-3', className)}>
      {index && <span className="font-impact text-[18px] font-semibold leading-none text-dv-gold dv-tabular">{index}</span>}
      <span
        className="h-2.5 flex-1 opacity-70"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--dv-gold) 0 1px, transparent 1px 8px) bottom/100% 5px no-repeat, linear-gradient(var(--dv-line-strong), var(--dv-line-strong)) bottom/100% 1px no-repeat',
        }}
      />
      {label && <span className="dv-label text-[10px]">{label}</span>}
    </div>
  )
}

/** Título de seção do Record: usa o SectionHeader do kit (índice romano, kicker, eco japonês). */
export function SectionHeading({
  title,
  jp,
  kicker,
  index,
  action,
  className,
  as = 'h2',
}: {
  title: string
  jp?: string
  kicker?: string
  index?: string
  action?: ReactNode
  className?: string
  as?: 'h2' | 'h3'
}) {
  return <SectionHeader index={index} kicker={kicker} title={title} jp={jp} action={action} size="sm" as={as} className={className} />
}

/** Ação em texto com seta (ver tudo, abrir). Alvo de 44px. */
export function LinkAction({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dv-focus group inline-flex min-h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-cobalt-text transition-colors hover:text-dv-text disabled:cursor-default disabled:opacity-40"
    >
      {children}
      <GlyphArrow className="size-3.5 transition-transform group-enabled:group-hover:translate-x-0.5" />
    </button>
  )
}

/** Painel de alerta: apenas para perigo real (tempo crítico, avisos de risco). */
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
    <div role="alert" className={cn('dv-cut relative overflow-hidden bg-[linear-gradient(160deg,var(--dv-blood-deep),#1a0507_45%,var(--dv-ink))] text-dv-text', className)}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-dv-blood" />
      <div className="flex items-start gap-4 p-4 pl-5">
        <GlyphAlert className="mt-0.5 size-6 shrink-0 text-dv-blood-text" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Kicker tone="blood" glyph={false}>
              {source}
            </Kicker>
            {time && <SystemLabel className="dv-tabular">{time}</SystemLabel>}
          </div>
          <p className="mt-1 font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-blood-text">{title}</p>
          <p className="mt-1 font-body text-[15px] leading-relaxed text-dv-text-2">{body}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
      <span aria-hidden="true" className="dv-hazard absolute bottom-2 right-3 h-2.5 w-16 opacity-80" />
    </div>
  )
}
