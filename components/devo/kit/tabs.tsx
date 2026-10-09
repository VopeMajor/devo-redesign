'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'

export type TabItem<V extends string = string> = {
  value: V
  label: string
  icon?: ReactNode
  /** Número pequeno ao lado do rótulo (não lidos, pendentes). */
  count?: number
  disabled?: boolean
}

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Abas com indicador animado (barra cobalto inclinada que desliza até a aba ativa, losango dourado).
 * Teclado: ←/→ trocam, Home/End vão às pontas. Rola horizontalmente se não couber.
 * `children` é o conteúdo da aba ativa (renderizado dentro de role="tabpanel").
 */
export function Tabs<V extends string>({
  items,
  value,
  onValueChange,
  label,
  children,
  sound = true,
  fill = false,
  className,
  panelClassName,
}: {
  items: TabItem<V>[]
  value: V
  onValueChange: (v: V) => void
  /** Nome acessível da lista de abas. */
  label: string
  children?: ReactNode
  sound?: boolean
  /** Abas dividem a largura igualmente (até 4 abas curtas). */
  fill?: boolean
  className?: string
  panelClassName?: string
}) {
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const refs = useRef(new Map<V, HTMLButtonElement>())
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null)

  const measure = useCallback(() => {
    const el = refs.current.get(value)
    if (!el) return
    setBar({ x: el.offsetLeft, w: el.offsetWidth })
  }, [value])

  useIso(() => {
    measure()
    // Rola só a lista de abas (nunca a página) para mostrar a aba ativa.
    const el = refs.current.get(value)
    const list = listRef.current
    if (el && list) {
      const left = el.offsetLeft - 16
      const right = el.offsetLeft + el.offsetWidth + 16 - list.clientWidth
      if (list.scrollLeft > left) list.scrollLeft = left
      else if (list.scrollLeft < right) list.scrollLeft = right
    }
  }, [measure, value])

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [measure])

  const enabled = items.filter((i) => !i.disabled)
  const select = (v: V, focus = false) => {
    if (v === value) return
    if (sound) playSfx('click')
    onValueChange(v)
    if (focus) refs.current.get(v)?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = enabled.findIndex((i) => i.value === value)
    let next: TabItem<V> | undefined
    if (e.key === 'ArrowRight') next = enabled[(idx + 1) % enabled.length]
    else if (e.key === 'ArrowLeft') next = enabled[(idx - 1 + enabled.length) % enabled.length]
    else if (e.key === 'Home') next = enabled[0]
    else if (e.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return
    e.preventDefault()
    select(next.value, true)
  }

  return (
    <div className={className}>
      <div className="relative">
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-dv-line" />
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          onKeyDown={onKey}
          className="devo-scroll relative flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => {
            const active = it.value === value
            return (
              <button
                key={it.value}
                ref={(el) => {
                  if (el) refs.current.set(it.value, el)
                  else refs.current.delete(it.value)
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${it.value}`}
                aria-selected={active}
                aria-controls={`${id}-panel`}
                tabIndex={active ? 0 : -1}
                disabled={it.disabled}
                onClick={() => select(it.value)}
                className={cn(
                  'dv-focus relative flex min-h-12 shrink-0 items-center justify-center gap-2 px-4 font-display text-[13px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200',
                  fill && 'flex-1',
                  active ? 'text-dv-text' : 'text-dv-text-3 enabled:hover:text-dv-text-2',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {it.icon && <span className={cn('flex size-4 items-center [&>svg]:size-full', active ? 'text-dv-cobalt-text' : '')}>{it.icon}</span>}
                <span>{it.label}</span>
                {typeof it.count === 'number' && it.count > 0 && (
                  <span className="dv-tabular grid min-w-5 place-items-center bg-dv-blood px-1 font-mono text-[10px] leading-5 tracking-normal text-white">{it.count}</span>
                )}
              </button>
            )
          })}
          {/* Indicador: dentro da área rolável para acompanhar a rolagem. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[3px] transition-[transform,width] duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ width: bar?.w ?? 0, transform: `translateX(${bar?.x ?? 0}px)`, opacity: bar ? 1 : 0 }}
          >
            <span className="absolute inset-x-2 inset-y-0 -skew-x-[30deg] bg-dv-cobalt shadow-[0_0_12px_rgba(65,82,192,0.8)]" />
            <span className="absolute -top-[3px] left-1/2 size-[7px] -translate-x-1/2 rotate-45 border border-dv-ink bg-dv-gold" />
          </span>
        </div>
      </div>
      {children !== undefined && (
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${value}`} tabIndex={0} className={cn('dv-focus', panelClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}
