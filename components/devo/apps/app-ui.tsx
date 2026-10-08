import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sparkle } from '../ornaments'

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground', className)}>
      <Sparkle className="size-2 text-primary" />
      {children}
    </p>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative border border-foreground/15 bg-card/70 p-4 shadow-[inset_0_1px_0_rgba(236,238,242,0.05)]', className)}>
      <span aria-hidden="true" className="absolute left-0 top-0 size-2 border-l border-t border-foreground/50" />
      <span aria-hidden="true" className="absolute right-0 top-0 size-2 border-r border-t border-foreground/50" />
      <span aria-hidden="true" className="absolute bottom-0 left-0 size-2 border-b border-l border-foreground/50" />
      <span aria-hidden="true" className="absolute bottom-0 right-0 size-2 border-b border-r border-foreground/50" />
      {children}
    </div>
  )
}

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }

export function ActionButton({ tone = 'ghost', className, ...props }: ActionProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 border px-4 py-2 text-xs uppercase tracking-[0.25em] transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'primary' &&
          'border-primary bg-gradient-to-b from-[#0f2366] to-[#070b1c] text-foreground shadow-[0_0_20px_-6px_var(--primary)] enabled:hover:shadow-[0_0_28px_-2px_var(--primary)]',
        tone === 'ghost' && 'border-foreground/25 bg-background/40 text-foreground/80 enabled:hover:border-foreground/60 enabled:hover:text-foreground',
        tone === 'danger' && 'border-primary/50 bg-transparent text-primary enabled:hover:bg-primary/10',
        className,
      )}
      {...props}
    />
  )
}

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 rounded-full bg-foreground/60 animate-blink" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  )
}
