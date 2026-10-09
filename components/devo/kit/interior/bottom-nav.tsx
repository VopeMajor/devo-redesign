'use client'

import type { ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { IconLock } from './icons'

export type BottomNavItem<V extends string = string> = {
  value: V
  label: string
  icon: ReactNode
  /** true = ponto vermelho; número = contador. */
  badge?: boolean | number
  /** Sistema reservado: aparece apagado com cadeado e não navega. */
  locked?: boolean
}

/**
 * Barra inferior do interior (celular): preta, ícones finos com rótulo; o ativo vira um bloco de luz
 * cobalto com filete superior. Selo vermelho para avisos. Itens `locked` ficam apagados com cadeado
 * (anunciam "bloqueado" e chamam `onLocked`, sem navegar). Respeita a área segura.
 */
export function BottomNav<V extends string>({
  items,
  value,
  onChange,
  onLocked,
  label = 'Navegação do DEVO',
  position = 'fixed',
  className,
}: {
  items: BottomNavItem<V>[]
  value: V
  onChange: (v: V) => void
  onLocked?: (v: V) => void
  label?: string
  /** fixed = presa ao rodapé da tela; static = no fluxo (vitrines, desktop). */
  position?: 'fixed' | 'static'
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'dv-interior-dark z-40 bg-in-panel pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--in-line-strong),0_-18px_40px_-20px_rgba(0,0,0,0.6)]',
        position === 'fixed' ? 'fixed inset-x-0 bottom-0' : 'relative',
        className,
      )}
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map((it) => {
          const active = it.value === value
          return (
            <li key={it.value} className="min-w-0 flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                aria-disabled={it.locked || undefined}
                aria-label={it.locked ? `${it.label} (bloqueado)` : typeof it.badge === 'number' && it.badge > 0 ? `${it.label}, ${it.badge} novos` : it.label}
                onClick={() => {
                  if (it.locked) {
                    playSfx('error')
                    onLocked?.(it.value)
                    return
                  }
                  if (!active) playSfx('click')
                  onChange(it.value)
                }}
                className={cn(
                  'dv-focus group relative flex h-16 w-full flex-col items-center justify-center gap-1.5 overflow-hidden transition-colors duration-200',
                  active ? 'text-white' : it.locked ? 'text-in-fg-3/70' : 'text-in-fg-2 hover:text-in-fg',
                )}
              >
                {active && (
                  <>
                    <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,71,255,0.55),rgba(22,71,255,0.18)_70%,transparent)]" />
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-[#5b7bff] shadow-[0_0_14px_2px_rgba(49,93,255,0.9)]" />
                  </>
                )}
                <span className={cn('relative flex size-6 items-center justify-center [&>svg]:size-full', active && 'drop-shadow-[0_0_6px_rgba(125,151,255,0.9)]', it.locked && 'opacity-60')}>
                  {it.icon}
                  {it.locked && (
                    <span aria-hidden="true" className="absolute -bottom-1 -right-1.5 grid size-3.5 place-items-center bg-in-panel text-in-fg-2">
                      <IconLock className="size-3" />
                    </span>
                  )}
                  {it.badge && !it.locked ? (
                    typeof it.badge === 'number' ? (
                      <span aria-hidden="true" className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-in-alert px-1 font-mono text-[9px] leading-4 text-white">
                        {it.badge > 99 ? '99+' : it.badge}
                      </span>
                    ) : (
                      <span aria-hidden="true" className="absolute -right-1 -top-0.5 size-2 rounded-full bg-in-alert shadow-[0_0_8px_var(--in-alert)]" />
                    )
                  ) : null}
                </span>
                <span className={cn('relative max-w-full truncate px-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em]', active && 'text-[#c9d4ff]')}>{it.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
