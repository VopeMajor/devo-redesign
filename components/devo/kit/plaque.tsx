import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const PLAQUE_LINE = {
  cobalt: 'bg-[linear-gradient(135deg,#ffffff,#9a97a3_35%,#ecebef_60%,#5b5863)]',
  gold: 'bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_35%,var(--dv-gold)_65%,var(--dv-gold-deep))]',
  neutral: 'bg-[linear-gradient(135deg,rgba(238,237,235,0.42),var(--dv-line-strong)_40%,rgba(238,237,235,0.12))]',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
} as const

export type PlaqueTone = keyof typeof PLAQUE_LINE

/** Placa metálica pequena com rótulo e número (Tempo, Pontos, Posição, Reset). Fica dentro de um <dl>. */
export function Plaque({ label, tone = 'neutral', children, className }: { label: string; tone?: PlaqueTone; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate min-w-0 px-2.5 pb-2 pt-1.5', className)} style={{ '--dv-cut': '9px' } as CSSProperties}>
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', PLAQUE_LINE[tone])} />
      <span
        aria-hidden="true"
        className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3)_0%,var(--dv-ink-2)_55%,var(--dv-ink)_100%)]"
        style={{ '--dv-cut': '8.6px' } as CSSProperties}
      />
      <span aria-hidden="true" className="absolute inset-x-3 top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <dt className="dv-label truncate text-[10px] tracking-[0.16em] text-dv-text-3">{label}</dt>
      <dd className="mt-1 flex min-h-[20px] items-baseline font-impact text-[18px] font-semibold leading-none text-dv-text dv-tabular">{children}</dd>
    </div>
  )
}

/** Barra de proporção entre dois lados (odds, votos): mármore branco × aço, com corte diagonal no encontro. */
export function OddsBar({ a, b, thin, labelA, labelB }: { a: number; b: number; thin?: boolean; labelA?: string; labelB?: string }) {
  return (
    <div>
      <div className={cn('mb-1 flex justify-between font-mono tabular-nums', thin ? 'text-[11px]' : 'text-[12px]')}>
        <span className="text-dv-text">{labelA ?? `${a}% do público`}</span>
        <span className="text-dv-gold">{labelB ?? `${b}%`}</span>
      </div>
      <div className={cn('relative flex overflow-hidden bg-dv-ink-4', thin ? 'h-1' : 'h-1.5')}>
        <span className="h-full bg-[linear-gradient(90deg,#bdbab4,#f1f0ee)] transition-[width] duration-500" style={{ width: `${a}%` }} />
        <span aria-hidden="true" className="h-full w-[3px] -skew-x-[30deg] bg-dv-ink" />
        <span className="h-full flex-1 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-gold))]" />
      </div>
    </div>
  )
}
