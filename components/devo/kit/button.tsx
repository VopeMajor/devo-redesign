'use client'

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { playSfx, type Sfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { GlyphDiamond } from './glyphs'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  /** Mostra o relógio girando, mantém a largura e bloqueia cliques. */
  loading?: boolean
  /** Som ao clicar (veja DV_SFX em tokens.ts). Padrão: nenhum. */
  sfx?: Sfx | false
}

export type ButtonProps = Base & {
  icon?: ReactNode
  iconRight?: ReactNode
  /** Ocupa a largura toda. */
  block?: boolean
}

const SIZE: Record<ButtonSize, { h: string; text: string; px: string; cut: number }> = {
  sm: { h: 'min-h-11', text: 'text-[12px] tracking-[0.2em]', px: 'px-5', cut: 10 },
  md: { h: 'min-h-12', text: 'text-[14px] tracking-[0.24em]', px: 'px-7', cut: 14 },
  lg: { h: 'min-h-14', text: 'text-[16px] tracking-[0.28em]', px: 'px-9', cut: 18 },
}

const LINE: Record<ButtonVariant, string> = {
  primary: 'bg-[linear-gradient(100deg,#a9bbff,var(--dv-cobalt)_30%,var(--dv-cobalt-deep)_70%,#a9bbff)]',
  secondary: 'bg-[linear-gradient(100deg,var(--dv-line-strong),rgba(236,238,242,0.55)_50%,var(--dv-line-strong))] group-enabled:group-hover:bg-[linear-gradient(100deg,var(--dv-gold-deep),var(--dv-gold-bright)_50%,var(--dv-gold-deep))]',
  ghost: '',
  danger: 'bg-[linear-gradient(100deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
}

const FILL: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(180deg,#1b3bd6_0%,#0f2380_48%,#0a1446_100%)] group-enabled:group-hover:bg-[linear-gradient(180deg,#2448f0_0%,#13299a_48%,#0b1852_100%)]',
  secondary: 'bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]',
  ghost: '',
  danger: 'bg-[linear-gradient(180deg,#8a0f18_0%,#4a0a0f_60%,#22060a_100%)] group-enabled:group-hover:bg-[linear-gradient(180deg,#a5131d_0%,#5a0a10_60%,#2a060a_100%)]',
}

const TEXT: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-dv-text group-enabled:group-hover:text-dv-gold-bright',
  ghost: 'text-dv-text-2 group-enabled:group-hover:text-dv-text',
  danger: 'text-white',
}

/**
 * Botão do DEVO. Pontas chanfradas (hex) para primary/secondary/danger; ghost é texto com traço.
 * Estados: repouso · hover (brilho + filete ouro no secondary) · pressionado (escala 0.97 + flash) ·
 * foco (anel cobalto) · desabilitado (dessaturado, 45%) · carregando (relógio girando, aria-busy).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, sfx, icon, iconRight, block, className, children, disabled, onClick, type = 'button', style, ...rest },
  ref,
) {
  const s = SIZE[size]
  const isGhost = variant === 'ghost'
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) return
    if (sfx) playSfx(sfx)
    onClick?.(e)
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handle}
      style={{ '--dv-cut': `${s.cut}px`, ...style } as CSSProperties}
      className={cn(
        'group relative isolate inline-flex select-none items-center justify-center font-display font-semibold uppercase',
        'transition-[transform,filter] duration-[120ms] ease-out enabled:active:scale-[0.97]',
        'dv-focus disabled:cursor-not-allowed',
        'disabled:[&:not([aria-busy])]:opacity-45 disabled:[&:not([aria-busy])]:grayscale-[0.7]',
        s.h,
        s.text,
        isGhost ? 'px-3' : s.px,
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {!isGhost && (
        <>
          <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-0 -z-10', LINE[variant])} />
          <span
            aria-hidden="true"
            className={cn('dv-cut-hex dv-sheen absolute inset-px -z-10 overflow-hidden', FILL[variant])}
            style={{ '--dv-cut': `${s.cut - 0.5}px` } as CSSProperties}
          />
          {/* flash ao pressionar */}
          <span
            aria-hidden="true"
            className="dv-cut-hex absolute inset-px -z-10 bg-white opacity-0 transition-opacity duration-[120ms] group-enabled:group-active:opacity-15"
            style={{ '--dv-cut': `${s.cut - 0.5}px` } as CSSProperties}
          />
          {variant === 'primary' && (
            <span aria-hidden="true" className="dv-cut-hex absolute inset-px -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_50%)]" style={{ '--dv-cut': `${s.cut - 0.5}px` } as CSSProperties} />
          )}
          {variant === 'primary' && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 -bottom-2 -z-20 h-4 rounded-[50%] bg-dv-cobalt/50 blur-lg transition-opacity group-disabled:opacity-0" />
          )}
        </>
      )}
      {isGhost && (
        <span aria-hidden="true" className="absolute inset-x-3 bottom-2 h-px origin-left scale-x-0 bg-dv-cobalt-text transition-transform duration-[360ms] ease-out group-enabled:group-hover:scale-x-100 group-focus-visible:scale-x-100" />
      )}
      <span className={cn('relative flex items-center justify-center gap-3 py-2', TEXT[variant], loading && 'invisible')}>
        {variant === 'secondary' && !icon && <GlyphDiamond className="size-2.5 text-dv-gold/80" filled />}
        {icon && <span className="flex size-[1.15em] items-center justify-center [&>svg]:size-full">{icon}</span>}
        <span className="translate-x-[0.12em]">{children}</span>
        {variant === 'secondary' && !iconRight && <GlyphDiamond className="size-2.5 text-dv-gold/80" filled />}
        {iconRight && <span className="flex size-[1.15em] items-center justify-center [&>svg]:size-full">{iconRight}</span>}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-white">
          <Spinner className="size-5" />
          <span className="sr-only">Carregando</span>
        </span>
      )}
    </button>
  )
})

/** Relógio com ponteiro girando: indicador de carregamento padrão. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? 'status' : undefined} className={cn('relative inline-block', className)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9.5" strokeWidth="1.4" opacity="0.35" />
        <path d="M12 2.5 A9.5 9.5 0 0 1 21.5 12" strokeWidth="1.8" strokeLinecap="round" className="origin-center animate-dv-spin motion-reduce:animate-none" />
        <path d="M12 12 V6.5" strokeWidth="1.6" strokeLinecap="round" className="origin-center animate-dv-spin [animation-duration:2.4s] motion-reduce:animate-none" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export type IconButtonProps = Omit<Base, 'children'> & {
  /** Nome acessível (vira aria-label e title). Obrigatório. */
  label: string
  children: ReactNode
  /** Quadrado de toque: md = 44px (padrão), lg = 52px. */
  size?: 'md' | 'lg'
  /** Selo numérico (ex.: avisos não lidos). */
  badge?: number
}

/** Botão só de ícone: octógono chanfrado de 44px no mínimo. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, variant = 'secondary', size = 'md', badge, loading, sfx, className, onClick, disabled, type = 'button', style, ...rest },
  ref,
) {
  const dim = size === 'lg' ? 'size-[52px]' : 'size-11'
  const isGhost = variant === 'ghost'
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) return
        if (sfx) playSfx(sfx)
        onClick?.(e)
      }}
      style={{ '--dv-cut': '11px', ...style } as CSSProperties}
      className={cn(
        'group relative isolate inline-grid shrink-0 place-items-center transition-transform duration-[120ms] enabled:active:scale-[0.94]',
        'dv-focus disabled:cursor-not-allowed disabled:opacity-45',
        dim,
        className,
      )}
      {...rest}
    >
      {!isGhost && (
        <>
          <span aria-hidden="true" className={cn('dv-cut absolute inset-0 -z-10', LINE[variant])} />
          <span aria-hidden="true" className={cn('dv-cut absolute inset-px -z-10', FILL[variant])} style={{ '--dv-cut': '10.5px' } as CSSProperties} />
        </>
      )}
      {isGhost && <span aria-hidden="true" className="dv-cut absolute inset-0 -z-10 bg-white/0 transition-colors group-enabled:group-hover:bg-white/[0.06] group-enabled:group-active:bg-white/10" />}
      <span className={cn('flex size-[22px] items-center justify-center [&>svg]:size-full', TEXT[variant])}>{loading ? <Spinner className="size-5" /> : children}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="dv-tabular absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border border-dv-ink bg-dv-blood px-1 font-mono text-[10px] leading-5 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
})
