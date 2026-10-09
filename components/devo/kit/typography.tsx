import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GlyphDiamond, GlyphSpark } from './glyphs'

export type KickerTone = 'cobalt' | 'gold' | 'blood' | 'muted' | 'paper'

const KICKER_TONE: Record<KickerTone, string> = {
  cobalt: 'text-dv-cobalt-text',
  gold: 'text-dv-gold',
  blood: 'text-dv-blood-text',
  muted: 'text-dv-text-3',
  paper: 'text-dv-paper-ink/70',
}

/** Rótulo curto acima de títulos ("SALA DE JOGOS · MESA"). Mono, caixa-alta, 11px. */
export function Kicker({ children, tone = 'gold', glyph = true, className }: { children: ReactNode; tone?: KickerTone; glyph?: boolean; className?: string }) {
  return (
    <p className={cn('dv-label flex items-center gap-2', KICKER_TONE[tone], className)}>
      {glyph && <GlyphDiamond className="size-2.5" filled />}
      <span>{children}</span>
    </p>
  )
}

/**
 * Cabeçalho de seção: índice (romano ou número) em fonte de impacto, kicker, título serifado,
 * rótulo japonês opcional e ação à direita. Filete dourado com marcações embaixo.
 */
export function SectionHeader({
  index,
  kicker,
  title,
  jp,
  action,
  size = 'md',
  tone = 'ink',
  as: Tag = 'h2',
  className,
}: {
  index?: string
  kicker?: string
  title: string
  jp?: string
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'ink' | 'paper'
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  const paper = tone === 'paper'
  const titleSize = size === 'lg' ? 'text-[34px]' : size === 'md' ? 'text-[26px]' : 'text-[20px]'
  return (
    <header className={cn('relative', className)}>
      <div className="flex items-end gap-3">
        {index && (
          <span
            aria-hidden="true"
            className={cn(
              'font-impact -skew-x-[8deg] font-semibold leading-[0.8] dv-tabular',
              size === 'lg' ? 'text-[56px]' : size === 'md' ? 'text-[44px]' : 'text-[32px]',
              paper ? 'text-dv-gold-deep/60' : 'text-transparent [-webkit-text-stroke:1px_var(--dv-gold)]',
            )}
          >
            {index}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {kicker && <Kicker tone={paper ? 'paper' : 'gold'} className="mb-1.5">{kicker}</Kicker>}
          <Tag className={cn('flex flex-wrap items-baseline gap-x-3 font-display font-semibold uppercase leading-[1.02] tracking-[0.06em]', titleSize, paper ? 'text-dv-paper-ink' : 'text-dv-text')}>
            <span className="min-w-0">{title}</span>
            {jp && (
              <span lang="ja" className={cn('font-sans text-[11px] font-normal normal-case tracking-[0.2em]', paper ? 'text-dv-paper-ink/60' : 'text-dv-text-3')}>
                {jp}
              </span>
            )}
          </Tag>
        </div>
        {action && <div className="shrink-0 pb-0.5">{action}</div>}
      </div>
      <div aria-hidden="true" className="relative mt-2.5 h-px">
        <span className={cn('absolute inset-0', paper ? 'bg-dv-paper-ink/25' : 'bg-gradient-to-r from-dv-gold/70 via-dv-gold/25 to-transparent')} />
        <span className={cn('absolute -top-[3px] left-0 h-[7px] w-px', paper ? 'bg-dv-paper-ink/50' : 'bg-dv-gold')} />
        <span className={cn('absolute -top-[1px] left-[18%] h-[3px] w-7', paper ? 'bg-dv-paper-ink/70' : 'bg-dv-amethyst')} />
      </div>
    </header>
  )
}

/**
 * Título de impacto (hero de tela, resultado, fase): fonte condensada, inclinação de corte e faixa
 * diagonal atrás. Use 1 por tela, no máximo.
 */
export function ImpactTitle({
  children,
  sub,
  tone = 'cobalt',
  className,
  as: Tag = 'h1',
}: {
  children: ReactNode
  sub?: ReactNode
  tone?: 'cobalt' | 'blood' | 'gold'
  className?: string
  as?: 'h1' | 'h2' | 'p'
}) {
  const band = tone === 'blood' ? 'bg-dv-blood' : tone === 'gold' ? 'bg-dv-gold' : 'bg-dv-cobalt-deep'
  return (
    <div className={cn('relative flex w-fit max-w-full flex-col items-start self-start', className)}>
      <span className="relative">
        <span aria-hidden="true" className={cn('absolute -left-3 bottom-[8%] h-[34%] w-[calc(100%+1.5rem)] -skew-x-[18deg] opacity-90', band)} />
        <Tag className="relative font-impact text-[56px] font-bold uppercase leading-[0.86] tracking-[0.01em] text-dv-text [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">{children}</Tag>
      </span>
      {sub && <span className="dv-label relative mt-2 text-dv-text-2">{sub}</span>}
    </div>
  )
}

export type DividerVariant = 'star' | 'clock' | 'stitch' | 'filigree'

/** Divisor ornamental. `clock` = régua de marcações; `stitch` = costura do diário. */
export function Divider({ variant = 'star', tone = 'gold', className }: { variant?: DividerVariant; tone?: 'gold' | 'cobalt' | 'paper' | 'muted'; className?: string }) {
  const color = tone === 'gold' ? 'text-dv-gold' : tone === 'cobalt' ? 'text-dv-cobalt-text' : tone === 'paper' ? 'text-dv-paper-ink/50' : 'text-dv-text-3'
  if (variant === 'stitch') {
    return <div aria-hidden="true" role="presentation" className={cn('h-0 border-t border-dashed border-current opacity-50', color, className)} />
  }
  if (variant === 'clock') {
    return (
      <div aria-hidden="true" className={cn('flex items-center gap-2', color, className)}>
        <span
          className="h-2.5 flex-1 opacity-60"
          style={{ background: 'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 8px) bottom/100% 5px no-repeat, linear-gradient(currentColor, currentColor) bottom/100% 1px no-repeat' }}
        />
        <GlyphDiamond className="size-3" />
        <span
          className="h-2.5 flex-1 opacity-60"
          style={{ background: 'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 8px) bottom/100% 5px no-repeat, linear-gradient(currentColor, currentColor) bottom/100% 1px no-repeat' }}
        />
      </div>
    )
  }
  if (variant === 'filigree') {
    return (
      <div aria-hidden="true" className={cn('flex items-center justify-center gap-2', color, className)}>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-70" />
        <span className="size-1 rotate-45 bg-current" />
        <svg viewBox="0 0 60 16" className="h-4 w-14" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 8 C12 8 14 2 22 2 C26 2 28 5 30 8 C32 5 34 2 38 2 C46 2 48 8 58 8" />
          <path d="M2 8 C12 8 14 14 22 14 C26 14 28 11 30 8 C32 11 34 14 38 14 C46 14 48 8 58 8" opacity="0.6" />
          <path d="M30 4 L33 8 L30 12 L27 8 Z" fill="currentColor" stroke="none" />
        </svg>
        <span className="size-1 rotate-45 bg-current" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-70" />
      </div>
    )
  }
  return (
    <div aria-hidden="true" className={cn('flex items-center justify-center gap-3', color, className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-60" />
      <GlyphSpark className="size-3" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-60" />
    </div>
  )
}
