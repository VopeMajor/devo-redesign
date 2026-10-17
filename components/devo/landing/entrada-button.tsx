'use client'

import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode } from 'react'
import { playSfx, type Sfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { Spinner } from '../kit/button'

/**
 * Botão primário da Jornada na paleta do mármore (rodada 2 › "Um botão primário só"):
 * - `porcelain` (sobre o negro): esmalte porcelana com filete de aço champanhe, texto negro.
 * - `ink` (sobre o papel): bloco negro (#1c1c1f) com filete de aço, texto porcelana.
 * Ametista só no halo de foco/hover. Mesmo recorte hex (`dv-cut-hex`) do Button do kit.
 * Candidato ao kit: substituiria o `primary` violeta do `Button`.
 */
export type EntradaButtonTone = 'porcelain' | 'ink'

const SIZE = {
  sm: { h: 'min-h-11', text: 'text-[12px] tracking-[0.2em]', px: 'px-5', cut: 10 },
  md: { h: 'min-h-12', text: 'text-[14px] tracking-[0.24em]', px: 'px-7', cut: 14 },
  lg: { h: 'min-h-14', text: 'text-[16px] tracking-[0.28em]', px: 'px-9', cut: 18 },
} as const

const LINE: Record<EntradaButtonTone, string> = {
  porcelain: 'bg-[linear-gradient(100deg,#6b6357,#ece5d8_22%,#bab09f_50%,#ece5d8_78%,#6b6357)]',
  ink: 'bg-[linear-gradient(100deg,#5f584d,#bab09f_30%,#ece5d8_50%,#bab09f_70%,#5f584d)]',
}
const FILL: Record<EntradaButtonTone, string> = {
  porcelain:
    'bg-[linear-gradient(180deg,#fbfaf8_0%,#efedea_46%,#d9d6d0_100%)] group-enabled:group-hover:bg-[linear-gradient(180deg,#ffffff_0%,#f4f2ef_46%,#e2dfd9_100%)]',
  ink: 'bg-[linear-gradient(180deg,var(--dv-ink-4)_0%,var(--dv-block)_50%,var(--dv-ink)_100%)] group-enabled:group-hover:bg-[linear-gradient(180deg,#38393c_0%,#232327_50%,var(--dv-ink-2)_100%)]',
}
const TEXT: Record<EntradaButtonTone, string> = {
  porcelain: 'text-dv-ink',
  ink: 'text-[#f1f0ee]',
}

export function EntradaButton({
  tone = 'porcelain',
  size = 'lg',
  block,
  loading = false,
  sfx,
  icon,
  className,
  children,
  disabled,
  onClick,
  type = 'button',
  style,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  type?: 'button' | 'submit'
  tone?: EntradaButtonTone
  size?: keyof typeof SIZE
  block?: boolean
  loading?: boolean
  sfx?: Sfx | false
  icon?: ReactNode
}) {
  const s = SIZE[size]
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (loading) return
        if (sfx) playSfx(sfx)
        onClick?.(e)
      }}
      style={{ '--dv-cut': `${s.cut}px`, ...style } as CSSProperties}
      className={cn(
        'group relative isolate inline-flex select-none items-center justify-center font-display font-semibold uppercase outline-none',
        'transition-[transform,filter] duration-[120ms] ease-out enabled:active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:[&:not([aria-busy])]:opacity-45',
        s.h,
        s.text,
        s.px,
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-0 -z-10', LINE[tone])} />
      <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-px -z-10 overflow-hidden', FILL[tone])} style={{ '--dv-cut': `${s.cut - 0.5}px` } as CSSProperties}>
        {/* veio de mármore muito leve e o reflexo do esmalte na metade de cima */}
        <span
          className={cn(
            'absolute inset-0',
            tone === 'porcelain'
              ? 'bg-[linear-gradient(168deg,transparent_38%,rgba(143,142,139,0.22)_40%,transparent_43%),linear-gradient(180deg,rgba(255,255,255,0.7),transparent_45%)]'
              : 'bg-[linear-gradient(168deg,transparent_38%,rgba(143,142,139,0.16)_40%,transparent_43%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_45%)]',
          )}
        />
      </span>
      {/* flash ao pressionar */}
      <span
        aria-hidden="true"
        className={cn('dv-cut-hex absolute inset-px -z-10 opacity-0 transition-opacity duration-[120ms] group-enabled:group-active:opacity-25', tone === 'porcelain' ? 'bg-dv-amethyst' : 'bg-white')}
        style={{ '--dv-cut': `${s.cut - 0.5}px` } as CSSProperties}
      />
      {/* ametista: só halo de foco/hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 -bottom-2 -z-20 h-4 rounded-[50%] bg-dv-amethyst/0 blur-lg transition-colors duration-200 group-enabled:group-hover:bg-dv-amethyst/45 group-focus-visible:bg-dv-amethyst/60"
      />
      <span
        aria-hidden="true"
        className="dv-cut-hex pointer-events-none absolute -inset-[3px] -z-20 opacity-0 transition-opacity group-focus-visible:opacity-100 bg-dv-amethyst"
        style={{ '--dv-cut': `${s.cut + 1.5}px` } as CSSProperties}
      />
      <span className={cn('relative flex items-center justify-center gap-3 py-2', TEXT[tone], loading && 'invisible')}>
        {icon && <span className="flex size-[1.15em] items-center justify-center [&>svg]:size-full">{icon}</span>}
        <span className="translate-x-[0.12em]">{children}</span>
      </span>
      {loading && (
        <span className={cn('absolute inset-0 flex items-center justify-center', TEXT[tone])}>
          <Spinner className="size-5" />
          <span className="sr-only">Carregando</span>
        </span>
      )}
    </button>
  )
}
