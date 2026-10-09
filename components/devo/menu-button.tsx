import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Sparkle } from './ornaments'

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

const CHAMFER =
  'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)'

export function MenuButton({ variant = 'secondary', className, children, ...props }: MenuButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <div className="relative flex w-full items-center">
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-[-2.5rem] top-1/2 h-px -translate-y-1/2',
          isPrimary
            ? 'bg-gradient-to-r from-transparent via-primary to-transparent'
            : 'bg-gradient-to-r from-transparent via-foreground/30 to-transparent',
        )}
      />
      <button
        type="button"
        className={cn(
          'group relative w-full p-px uppercase tracking-[0.25em] transition-all duration-300',
          'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
          isPrimary
            ? 'bg-primary shadow-[0_0_28px_-4px_var(--primary)] hover:shadow-[0_0_40px_0_var(--primary)]'
            : 'bg-foreground/40 hover:bg-foreground/70',
          'focus-visible:shadow-[0_0_0_2px_var(--foreground)]',
          className,
        )}
        style={{ clipPath: CHAMFER }}
        {...props}
      >
        <span
          className={cn(
            'flex items-center justify-center gap-4 px-8 py-3.5 text-base sm:text-lg',
            isPrimary
              ? 'bg-gradient-to-b from-[var(--dv-night)] to-[var(--dv-ink)] text-foreground group-hover:from-[var(--dv-night-2)]'
              : 'bg-background/95 text-foreground/80 group-hover:text-foreground',
          )}
          style={{ clipPath: CHAMFER }}
        >
          {!isPrimary && <Sparkle className="size-2.5 text-foreground/60" />}
          {children}
          {!isPrimary && <Sparkle className="size-2.5 text-foreground/60" />}
        </span>
      </button>
    </div>
  )
}
