import { cn } from '@/lib/utils'

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('fill-current', className)}>
      <path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" />
    </svg>
  )
}

export function DiamondStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" aria-hidden="true" className={cn('text-foreground', className)}>
      <path d="M20 2 L36 30 L20 58 L4 30 Z" fill="var(--background)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 10 L22 28 L32 30 L22 32 L20 50 L18 32 L8 30 L18 28 Z" fill="currentColor" />
    </svg>
  )
}

export function PageFrame() {
  const corners = [
    'left-2 top-2',
    'right-2 top-2',
    'left-2 bottom-2',
    'right-2 bottom-2',
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-3 z-10 border border-foreground/25 sm:inset-5">
      {corners.map((pos) => (
        <Sparkle key={pos} className={cn('absolute size-3 text-foreground/60', pos)} />
      ))}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center justify-center gap-3 text-foreground/50', className)}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-foreground/40" />
      <Sparkle className="size-3" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-foreground/40" />
    </div>
  )
}
