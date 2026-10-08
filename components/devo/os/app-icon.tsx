import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { AppDef } from './apps'

type TileSize = 'xs' | 'sm' | 'md' | 'lg'

const DIM: Record<TileSize, { box: string; glyph: string; cut: number }> = {
  xs: { box: 'size-7', glyph: 'size-3.5', cut: 7 },
  sm: { box: 'size-9', glyph: 'size-[18px]', cut: 9 },
  md: { box: 'size-[60px]', glyph: 'size-[26px]', cut: 15 },
  lg: { box: 'size-16', glyph: 'size-7', cut: 16 },
}

/**
 * Ícone de app: octógono chanfrado com filete metálico (prata → cobalto), miolo de tinta com brilho
 * cobalto embaixo e o glifo do app. Estados vêm do botão pai (`group`): hover acende o filete,
 * pressionado dá o flash; `selected` (desktop) usa o filete cobalto cheio.
 */
export function AppGlyphTile({ app, size = 'md', selected = false, className }: { app: AppDef; size?: TileSize; selected?: boolean; className?: string }) {
  const Icon = app.icon
  const d = DIM[size]
  return (
    <span aria-hidden="true" className={cn('relative isolate grid shrink-0 place-items-center', d.box, className)} style={{ '--dv-cut': `${d.cut}px` } as CSSProperties}>
      {/* filete */}
      <span
        className={cn(
          'dv-cut absolute inset-0 -z-10 transition-[filter] duration-200',
          selected
            ? 'bg-[linear-gradient(160deg,#a9bbff,var(--dv-cobalt)_45%,var(--dv-cobalt-deep))]'
            : 'bg-[linear-gradient(160deg,rgba(236,238,242,0.62),rgba(236,238,242,0.16)_42%,rgba(49,93,255,0.85)_100%)] group-hover:brightness-150',
        )}
      />
      {/* miolo */}
      <span
        className={cn(
          'dv-cut absolute inset-px -z-10',
          selected
            ? 'bg-[radial-gradient(90%_70%_at_50%_100%,rgba(49,93,255,0.55),transparent_70%),linear-gradient(180deg,var(--dv-cobalt-dim),var(--dv-ink-2))]'
            : 'bg-[radial-gradient(90%_60%_at_50%_105%,rgba(49,93,255,0.45),transparent_70%),linear-gradient(180deg,var(--dv-ink-4)_0%,var(--dv-ink-2)_55%,var(--dv-ink)_100%)]',
        )}
        style={{ '--dv-cut': `${d.cut - 0.5}px` } as CSSProperties}
      />
      {/* aro interno e brilho de topo */}
      {size !== 'xs' && <span className="dv-cut absolute inset-[3px] -z-10 border border-white/[0.06]" style={{ '--dv-cut': `${d.cut - 2}px` } as CSSProperties} />}
      <span className="absolute inset-x-[22%] top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* flash ao pressionar (o botão pai é `group`) */}
      <span className="dv-cut absolute inset-px -z-10 bg-white opacity-0 transition-opacity duration-[120ms] group-active:opacity-20" style={{ '--dv-cut': `${d.cut - 0.5}px` } as CSSProperties} />
      <Icon className={cn('relative text-dv-text drop-shadow-[0_0_6px_rgba(49,93,255,0.7)]', d.glyph)} strokeWidth={1.4} />
    </span>
  )
}

/** Selo de não lidos: vermelho (regra: badge de não lidos é perigo/urgência), com anel pulsante. */
export function Badge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null
  return (
    <span className={cn('absolute -right-1.5 -top-1.5 z-10 grid min-w-5 place-items-center', className)}>
      <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-dv-blood/50 [animation-duration:2.2s] motion-reduce:hidden" />
      <span className="dv-tabular relative grid h-5 min-w-5 place-items-center rounded-full border border-dv-ink bg-dv-blood px-1 font-mono text-[11px] font-medium leading-none text-white shadow-[0_0_12px_rgba(213,31,43,0.7)]">
        {count > 9 ? '9+' : count}
        <span className="sr-only"> não lidas</span>
      </span>
    </span>
  )
}
