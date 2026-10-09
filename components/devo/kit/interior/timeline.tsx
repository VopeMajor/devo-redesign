import type { MouseEventHandler, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TimelineTone = 'live' | 'done' | 'fail' | 'cancel' | 'idle' | 'next'

export type TimelineItem = {
  id: string
  /** Data curta à esquerda ("18.05"). */
  date: string
  title: string
  /** Rótulo de status à direita ("EM PROGRESSO"). */
  status: string
  tone?: TimelineTone
  /** Linha extra opcional sob o título. */
  detail?: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
}

const STATUS: Record<TimelineTone, string> = {
  live: 'text-in-alert',
  done: 'text-in-fg-2',
  fail: 'text-in-fg-3',
  cancel: 'text-in-fg-3 line-through decoration-1',
  idle: 'text-in-fg-3',
  next: 'text-in-accent',
}

/**
 * Lista em linha do tempo (DEADLY VOTES da referência): data · nó · nome · pontilhado · status.
 * `live` acende o nó em vermelho com halo; `next` usa cobalto. Itens com `onClick` viram botões (44px).
 */
export function TimelineList({ items, label, className }: { items: TimelineItem[]; label: string; className?: string }) {
  return (
    <ol aria-label={label} className={cn('relative', className)}>
      <span aria-hidden="true" className="absolute bottom-4 left-[65px] top-4 w-px bg-in-line-strong" />
      {items.map((it) => {
        const tone = it.tone ?? 'idle'
        const row = (
          <>
            <span className="w-12 shrink-0 font-mono text-[12px] tabular-nums tracking-[0.04em] text-in-fg-2">{it.date}</span>
            <span aria-hidden="true" className="relative grid w-[14px] shrink-0 place-items-center">
              {tone === 'live' && <span className="absolute size-[18px] rounded-full bg-in-alert/25 motion-safe:animate-ping" />}
              <span
                className={cn(
                  'relative size-[11px] rounded-full border-[1.5px] bg-in-bg',
                  tone === 'live' ? 'border-in-alert shadow-[0_0_0_3px_color-mix(in_oklab,var(--in-alert)_25%,transparent),0_0_12px_var(--in-alert)]' : tone === 'next' ? 'border-in-accent' : 'border-in-fg-2',
                )}
              >
                {tone === 'live' && <span className="absolute inset-[2.5px] rounded-full bg-in-alert" />}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-mono text-[13px] uppercase tracking-[0.08em] text-in-fg">{it.title}</span>
                <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-[repeating-linear-gradient(90deg,var(--in-line-strong)_0_1px,transparent_1px_4px)]" />
              </span>
              {it.detail && <span className="mt-0.5 text-[12px] text-in-fg-3">{it.detail}</span>}
            </span>
            <span className={cn('flex shrink-0 items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em]', STATUS[tone])}>
              {tone === 'live' && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
              {it.status}
            </span>
          </>
        )
        return (
          <li key={it.id} className="relative">
            {it.onClick ? (
              <button type="button" onClick={it.onClick} className="dv-focus flex min-h-11 w-full items-center gap-2.5 py-1.5 text-left transition-colors hover:bg-in-fg/[0.04]">
                {row}
              </button>
            ) : (
              <div className="flex min-h-11 items-center gap-2.5 py-1.5">{row}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
