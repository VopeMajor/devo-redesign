import { cn } from '@/lib/utils'
import { DeadlyVoteSymbol } from './symbol'

type Props = { size?: 'sm' | 'md' | 'lg'; showJapanese?: boolean; animated?: boolean; className?: string }

const SIZES = {
  sm: { symbol: 'size-7', title: 'text-[19px]', sub: 'text-[8px] tracking-[0.5em]', jp: 'text-[8px]', bar: 'h-7' },
  md: { symbol: 'size-10', title: 'text-[28px]', sub: 'text-[10px] tracking-[0.55em]', jp: 'text-[9px]', bar: 'h-11' },
  lg: { symbol: 'size-16', title: 'text-5xl md:text-6xl', sub: 'text-xs md:text-sm tracking-[0.6em]', jp: 'text-[11px]', bar: 'h-20' },
} as const

export function DeadlyVoteLogo({ size = 'md', showJapanese = true, animated = false, className }: Props) {
  const s = SIZES[size]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <DeadlyVoteSymbol className={cn(s.symbol, 'text-primary')} variant={size === 'sm' ? 'mark' : 'full'} animated={animated} />
      <span aria-hidden="true" className={cn('w-px bg-border', s.bar)} />
      <div className="flex flex-col">
        <span className={cn('font-serif font-medium uppercase leading-[0.9] tracking-[0.02em] text-foreground', s.title)}>Deadly Vote</span>
        <span className={cn('mt-1 font-sans font-medium uppercase text-primary', s.sub)}>Record System</span>
        {showJapanese && (
          <span lang="ja" className={cn('mt-0.5 tracking-[0.3em] text-muted-foreground', s.jp)}>
            デッドリーボート・記録
          </span>
        )}
      </div>
    </div>
  )
}
