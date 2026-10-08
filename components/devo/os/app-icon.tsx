import { cn } from '@/lib/utils'
import type { AppDef } from './apps'

const CHAMFER = 'polygon(18% 0, 82% 0, 100% 18%, 100% 82%, 82% 100%, 18% 100%, 0 82%, 0 18%)'

export function AppGlyphTile({ app, size = 'md', className }: { app: AppDef; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const Icon = app.icon
  const dim = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-16' : 'size-14'
  const icon = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-7' : 'size-6'
  return (
    <span
      aria-hidden="true"
      className={cn('relative grid shrink-0 place-items-center bg-foreground/25 p-px transition-colors', dim, className)}
      style={{ clipPath: CHAMFER }}
    >
      <span
        className="grid size-full place-items-center bg-gradient-to-b from-[#161a28] to-[#08090f]"
        style={{ clipPath: CHAMFER }}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(22,71,255,0.35),transparent_65%)]" />
        <Icon className={cn('relative text-foreground', icon)} strokeWidth={1.3} />
      </span>
    </span>
  )
}

export function Badge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-5 text-primary-foreground shadow-[0_0_12px_var(--primary)]',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
      <span className="sr-only"> não lidas</span>
    </span>
  )
}
