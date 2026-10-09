import { cn } from '@/lib/utils'
import { APP_EMBLEMS, type EmblemComponent } from '../kit/emblems'
import type { AppDef } from './apps'

type TileSize = 'xs' | 'sm' | 'md' | 'lg'

/** Caixa (mantida para o layout das grades) e tamanho do emblema dentro dela. */
const DIM: Record<TileSize, { box: string; emblem: string }> = {
  xs: { box: 'size-7', emblem: 'size-7' },
  sm: { box: 'size-9', emblem: 'size-9' },
  md: { box: 'size-[60px]', emblem: 'size-[52px]' },
  lg: { box: 'size-16', emblem: 'size-14' },
}

/**
 * Ícone de app = emblema de prata SEM fundo, ladrilho ou moldura (Direção 2 §6). Estados vêm do
 * botão pai (`group`): hover acende levemente, pressionado dá o brilho de metal champanhe e encolhe
 * 4%; `selected` (desktop) acende o emblema e põe um halo de ametista embaixo.
 */
export function AppGlyphTile({ app, size = 'md', selected = false, className }: { app: AppDef; size?: TileSize; selected?: boolean; className?: string }) {
  const Emblem = (APP_EMBLEMS as Record<string, EmblemComponent | undefined>)[app.id]
  // Todos os apps têm emblema; o ícone do registro fica de reserva (sem gradiente de metal).
  const Icon = (Emblem ?? app.icon) as EmblemComponent
  const d = DIM[size]
  return (
    <span aria-hidden="true" className={cn('relative isolate grid shrink-0 place-items-center', d.box, className)}>
      {selected && <span className="absolute inset-x-[6%] bottom-[-10%] -z-10 h-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(138,124,200,0.55),transparent_72%)]" />}
      <Icon
        className={cn(
          'relative text-dv-text transition-[filter,transform] duration-150 group-active:scale-[0.96] group-active:drop-shadow-[0_0_10px_rgba(236,229,216,0.9)]',
          selected ? 'drop-shadow-[0_0_8px_rgba(194,185,236,0.75)]' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(238,237,235,0.4)]',
          d.emblem,
        )}
        {...(Emblem ? { metal: true } : {})}
      />
    </span>
  )
}

/** Selo de não lidos: rubi pequeno (urgência), com anel pulsante. */
export function Badge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null
  return (
    <span className={cn('absolute -right-1.5 -top-1.5 z-10 grid min-w-5 place-items-center', className)}>
      <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-dv-blood/50 [animation-duration:2.2s] motion-reduce:hidden" />
      <span className="dv-tabular relative grid h-5 min-w-5 place-items-center rounded-full border border-dv-ink bg-dv-blood px-1 font-mono text-[11px] font-medium leading-none text-white shadow-[0_0_12px_rgba(163,18,31,0.7)]">
        {count > 9 ? '9+' : count}
        <span className="sr-only"> não lidas</span>
      </span>
    </span>
  )
}
