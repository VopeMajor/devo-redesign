'use client'

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RevealVariant = 'rise' | 'cut' | 'left' | 'right' | 'pop' | 'fade'

export const REVEAL_CLASS: Record<RevealVariant, string> = {
  rise: 'animate-dv-rise',
  cut: 'animate-dv-cut-in',
  left: 'animate-dv-slide-left',
  right: 'animate-dv-slide-right',
  pop: 'animate-dv-pop',
  fade: 'animate-dv-fade',
}

type Tag = 'div' | 'section' | 'li' | 'ul' | 'ol' | 'header' | 'footer' | 'span' | 'article'

/** Começa a animar só quando entra na tela (rolagem). */
function useInView<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(!enabled)
  useEffect(() => {
    if (!enabled || seen) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, seen])
  return { ref, seen }
}

/**
 * Entrada coreografada de UM bloco. `cut` = corte diagonal (assinatura do DEVO, use em títulos e
 * painéis-foco); `rise` = padrão para conteúdo; `left/right` = vindo do lado da navegação.
 * `inView` adia até o bloco aparecer na rolagem. Respeita prefers-reduced-motion (globals.css).
 */
export function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  inView = false,
  as: T = 'div',
  className,
  style,
}: {
  children: ReactNode
  variant?: RevealVariant
  /** ms */
  delay?: number
  inView?: boolean
  as?: Tag
  className?: string
  style?: CSSProperties
}) {
  const { ref, seen } = useInView<HTMLElement>(inView)
  const Comp = T as 'div'
  return (
    <Comp
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(seen ? REVEAL_CLASS[variant] : 'opacity-0', className)}
      style={{ animationDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </Comp>
  )
}

/**
 * Entrada em cascata: cada filho direto ganha um wrapper animado com atraso `i × step`.
 * Padrão: 60ms entre itens, no máximo 8 degraus (o resto entra junto) para não arrastar.
 */
export function Stagger({
  children,
  variant = 'rise',
  step = 60,
  delay = 0,
  max = 8,
  inView = false,
  as: T = 'div',
  itemAs = 'div',
  className,
  itemClassName,
}: {
  children: ReactNode
  variant?: RevealVariant
  step?: number
  delay?: number
  max?: number
  inView?: boolean
  as?: Tag
  itemAs?: Tag
  className?: string
  itemClassName?: string
}) {
  const { ref, seen } = useInView<HTMLElement>(inView)
  const Comp = T as 'div'
  const Item = itemAs as 'div'
  return (
    <Comp ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {Children.toArray(children).map((child, i) => (
        <Item
          key={i}
          className={cn(seen ? REVEAL_CLASS[variant] : 'opacity-0', itemClassName)}
          style={{ animationDelay: `${delay + Math.min(i, max) * step}ms` }}
        >
          {child}
        </Item>
      ))}
    </Comp>
  )
}
