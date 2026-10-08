import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GlyphDiamond } from '../kit/glyphs'

/**
 * Peças de interface compartilhadas pelos apps (API estável: SectionLabel, Panel, ActionButton,
 * TypingDots). Desenhadas com os tokens do "Tribunal do Relógio"; para telas novas prefira o kit
 * (`components/devo/kit`) diretamente.
 */

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('dv-label flex items-center gap-2 text-[11px] text-dv-gold', className)}>
      <GlyphDiamond filled className="size-2.5 shrink-0" />
      {children}
    </p>
  )
}

/** Bloco chanfrado com filete neutro. `className` vale para o próprio bloco (layout e padding). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate p-4 text-dv-text', className)} style={{ '--dv-cut': '12px' } as CSSProperties}>
      <span aria-hidden="true" className="dv-cut pointer-events-none absolute inset-0 -z-10 bg-dv-line-strong" />
      <span
        aria-hidden="true"
        className="dv-cut pointer-events-none absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3)_0%,var(--dv-ink-2)_55%,var(--dv-ink)_100%)]"
        style={{ '--dv-cut': '11.6px' } as CSSProperties}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-[14%] top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {children}
    </div>
  )
}

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' }

const LINE = {
  primary: 'bg-[linear-gradient(100deg,#a9bbff,var(--dv-cobalt)_30%,var(--dv-cobalt-deep)_70%,#a9bbff)]',
  ghost: 'bg-dv-line-strong group-enabled:group-hover:bg-[linear-gradient(100deg,var(--dv-gold-deep),var(--dv-gold-bright)_50%,var(--dv-gold-deep))]',
  danger: 'bg-[linear-gradient(100deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
} as const
const FILL = {
  primary: 'bg-[linear-gradient(180deg,#1b3bd6_0%,#0f2380_48%,#0a1446_100%)]',
  ghost: 'bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]',
  danger: 'bg-[linear-gradient(180deg,#8a0f18_0%,#4a0a0f_60%,#22060a_100%)]',
} as const

/** Botão compacto dos apps (pontas de flecha, ≥ 44px). Mesmos estados dos botões do kit. */
export function ActionButton({ tone = 'ghost', className, children, style, ...props }: ActionProps) {
  return (
    <button
      type="button"
      className={cn(
        'dv-focus group relative isolate inline-flex min-h-11 select-none items-center justify-center gap-2 px-5 font-display text-[12px] font-semibold uppercase tracking-[0.18em]',
        'transition-transform duration-[120ms] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:grayscale-[0.7]',
        tone === 'ghost' ? 'text-dv-text enabled:hover:text-dv-gold-bright' : 'text-white',
        className,
      )}
      style={{ '--dv-cut': '10px', ...style } as CSSProperties}
      {...props}
    >
      <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-0 -z-10', LINE[tone])} />
      <span aria-hidden="true" className={cn('dv-cut-hex dv-sheen absolute inset-px -z-10 overflow-hidden', FILL[tone])} style={{ '--dv-cut': '9.5px' } as CSSProperties} />
      <span aria-hidden="true" className="dv-cut-hex absolute inset-px -z-10 bg-white opacity-0 transition-opacity duration-[120ms] group-enabled:group-active:opacity-15" style={{ '--dv-cut': '9.5px' } as CSSProperties} />
      {children}
    </button>
  )
}

/** Três losangos piscando em sequência ("digitando"). */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 rotate-45 bg-current opacity-80 animate-dv-blink" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  )
}
