'use client'

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import type { TabItem } from '../tabs'

/**
 * Abas do interior: faixa com filete; a ativa é um BLOCO COBALTO SÓLIDO (texto branco), como a
 * barra RECORD FILE · ARCANO · VIRTUDES da referência. Mesma API do `Tabs` (teclado ←/→/Home/End).
 */
export function CobaltTabs<V extends string>({
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
  label: string
  children?: ReactNode
  sound?: boolean
  fill?: boolean
  className?: string
  panelClassName?: string
}) {
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const refs = useRef(new Map<V, HTMLButtonElement>())

  useEffect(() => {
    const el = refs.current.get(value)
    const list = listRef.current
    if (!el || !list) return
    const left = el.offsetLeft - 8
    const right = el.offsetLeft + el.offsetWidth + 8 - list.clientWidth
    if (list.scrollLeft > left) list.scrollLeft = left
    else if (list.scrollLeft < right) list.scrollLeft = right
  }, [value])

  const enabled = items.filter((i) => !i.disabled)
  const select = (v: V, focus = false) => {
    if (v === value) return
    if (sound) playSfx('click')
    onValueChange(v)
    if (focus) refs.current.get(v)?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = enabled.findIndex((t) => t.value === value)
    const next =
      e.key === 'ArrowRight' ? enabled[(i + 1) % enabled.length] : e.key === 'ArrowLeft' ? enabled[(i - 1 + enabled.length) % enabled.length] : e.key === 'Home' ? enabled[0] : e.key === 'End' ? enabled[enabled.length - 1] : undefined
    if (!next) return
    e.preventDefault()
    select(next.value, true)
  }

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKey}
        className="relative flex overflow-x-auto bg-[color-mix(in_oklab,var(--in-bg)_60%,white)] shadow-[inset_0_0_0_1px_var(--in-line-strong)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => {
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
              id={`${id}-t-${it.value}`}
              aria-selected={active}
              aria-controls={`${id}-p`}
              tabIndex={active ? 0 : -1}
              disabled={it.disabled}
              onClick={() => select(it.value)}
              className={cn(
                'dv-focus relative flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-4 font-sans text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200',
                fill && 'flex-1',
                active ? 'bg-in-accent-fill text-white shadow-[0_0_18px_-4px_rgba(52,64,158,0.7)]' : 'text-in-fg-2 enabled:hover:bg-in-accent-fill/10 enabled:hover:text-in-fg',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              {!active && i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-in-line" />}
              {it.icon && <span className="flex size-4 items-center [&>svg]:size-full">{it.icon}</span>}
              {it.label}
              {typeof it.count === 'number' && it.count > 0 && (
                <span className={cn('grid min-w-4 place-items-center px-1 font-mono text-[10px] leading-4 tracking-normal', active ? 'bg-white text-in-accent-fill' : 'bg-in-alert text-white')}>{it.count}</span>
              )}
            </button>
          )
        })}
      </div>
      {children !== undefined && (
        <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t-${value}`} tabIndex={0} className={cn('dv-focus', panelClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}
