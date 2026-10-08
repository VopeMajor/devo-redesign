import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SealTone = 'active' | 'critical' | 'idle'

/** Selo de status sobre papel: cobalto (ativo), sangue (crítico, pisca), tinta (inativo). */
export function StatusSeal({ tone, children, className }: { tone: SealTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-7 items-center gap-2 px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em]',
        tone === 'active' && 'bg-dv-cobalt-deep text-white',
        tone === 'critical' && 'bg-dv-blood text-white',
        tone === 'idle' && 'bg-dv-paper-ink/10 text-dv-paper-ink',
        className,
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full bg-current', tone === 'critical' && 'animate-dv-blink')} />
      {children}
    </span>
  )
}

/** Campo de formulário impresso (rótulo mono + valor em display) para documentos em papel. Use dentro de <dl>. */
export function PaperField({ label, value, danger, className }: { label: string; value: ReactNode; danger?: boolean; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="dv-label text-[10px] text-dv-paper-ink/60">{label}</dt>
      <dd className={cn('mt-1 font-display text-[15px] font-semibold uppercase tracking-[0.06em] dv-tabular', danger && 'text-dv-blood')}>{value}</dd>
    </div>
  )
}
