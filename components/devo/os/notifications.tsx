'use client'

import { useEffect, type CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AppId, NotificationItem } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock } from '../hooks'
import { Toast } from '../kit/toast'
import { Divider, Kicker } from '../kit/typography'
import { GlyphClock } from '../kit/glyphs'
import { useDevo } from '../state/devo-store'
import { getApp } from './apps'
import { AppGlyphTile } from './app-icon'

const TOAST_MS = 5200

/** Um aviso na pilha: desenho do kit (`Toast`) + toque para abrir o app de origem + barra de tempo. */
function LiveToast({ item, onOpen }: { item: NotificationItem; onOpen: (id: AppId) => void }) {
  const { dispatch } = useDevo()
  useEffect(() => {
    const t = window.setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: item.id }), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [item.id, dispatch])
  const app = getApp(item.appId)
  const danger = item.tone === 'danger'
  return (
    <li className="pointer-events-auto relative w-full max-w-sm">
      <Toast
        tone={danger ? 'alert' : 'system'}
        source={app.name}
        time={formatClock(item.createdAt)}
        title={item.title}
        body={<span className="line-clamp-2">{item.body}</span>}
        icon={<app.icon strokeWidth={1.4} />}
        onClose={() => dispatch({ type: 'DISMISS_TOAST', id: item.id })}
        className="max-w-none"
      />
      {/* toque no corpo do aviso abre o app (o botão de dispensar fica de fora, à direita) */}
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'DISMISS_TOAST', id: item.id })
          onOpen(item.appId)
        }}
        aria-label={`Abrir ${app.name}: ${item.title}`}
        className="dv-focus absolute inset-y-0 left-0 right-12"
      />
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute bottom-0 left-3 right-4 h-px origin-left [animation:devo-shrink_5.2s_linear_forwards]', danger ? 'bg-dv-blood' : 'bg-dv-cobalt')}
      />
    </li>
  )
}

export function ToastStack({ onOpen, className }: { onOpen: (id: AppId) => void; className?: string }) {
  const { state } = useDevo()
  return (
    <ol aria-live="polite" aria-label="Notificações recentes" className={cn('pointer-events-none fixed z-50 flex flex-col items-center gap-2', className)}>
      {state.toasts.map((t) => (
        <LiveToast key={t.id} item={t} onOpen={onOpen} />
      ))}
    </ol>
  )
}

/**
 * Central de avisos (lista). Cada aviso é uma tira chanfrada com o ícone do app, origem, hora,
 * título e corpo; avisos de perigo ganham a régua vermelha.
 */
export function NotificationList({ onOpen, className }: { onOpen: (id: AppId) => void; className?: string }) {
  const { state, dispatch } = useDevo()
  const count = state.notifications.length
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-1">
        <div>
          <Kicker tone="gold">Sistema · {count === 0 ? 'nenhum aviso' : `${count} ${count === 1 ? 'aviso' : 'avisos'}`}</Kicker>
          <p className="mt-1.5 font-display text-[22px] font-semibold uppercase leading-none tracking-[0.06em] text-dv-text">Central de avisos</p>
        </div>
        <button
          type="button"
          disabled={count === 0}
          onClick={() => {
            playSfx('click')
            dispatch({ type: 'CLEAR_NOTIFICATIONS' })
          }}
          className="dv-focus dv-label -mr-1 min-h-11 px-2 text-[11px] text-dv-cobalt-text transition-colors enabled:hover:text-dv-text disabled:opacity-40"
        >
          Limpar
        </button>
      </div>
      <div aria-hidden="true" className="relative mx-4 h-px">
        <span className="absolute inset-0 bg-gradient-to-r from-dv-gold/70 via-dv-gold/25 to-transparent" />
        <span className="absolute -top-[1px] left-[18%] h-[3px] w-7 bg-dv-cobalt" />
      </div>
      <ul className="devo-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {count === 0 && (
          <li className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <GlyphClock className="size-9 text-dv-gold/70" />
            <p className="font-body text-[17px] italic text-dv-text-2">Silêncio. Por enquanto.</p>
            <Divider variant="clock" tone="gold" className="w-40 opacity-60" />
          </li>
        )}
        {state.notifications.map((n, i) => {
          const app = getApp(n.appId)
          const danger = n.tone === 'danger'
          return (
            <li key={n.id} className="animate-dv-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <button
                type="button"
                onClick={() => onOpen(n.appId)}
                className="dv-focus group relative isolate flex w-full items-start gap-3 py-3 pl-4 pr-3 text-left transition-transform duration-[120ms] active:scale-[0.985]"
                style={{ '--dv-cut': '10px' } as CSSProperties}
              >
                <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', danger ? 'bg-dv-blood/60' : 'bg-dv-line')} />
                <span
                  aria-hidden="true"
                  className={cn(
                    'dv-cut-diag absolute inset-px -z-10 transition-colors',
                    danger ? 'bg-[linear-gradient(100deg,#2a070b,var(--dv-ink-2)_60%)]' : 'bg-[linear-gradient(100deg,var(--dv-ink-3),var(--dv-ink-2)_70%)] group-hover:bg-dv-ink-3',
                  )}
                  style={{ '--dv-cut': '9.6px' } as CSSProperties}
                />
                <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-[2px]', danger ? 'bg-dv-blood' : 'bg-dv-cobalt')} />
                <AppGlyphTile app={app} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="dv-label flex justify-between gap-2 text-[10px]">
                    <span className={danger ? 'text-dv-blood-text' : 'text-dv-cobalt-text'}>{app.name}</span>
                    <span className="dv-tabular text-dv-text-3">{formatClock(n.createdAt)}</span>
                  </span>
                  <span className="mt-1 block font-display text-[15px] font-semibold leading-snug tracking-[0.02em] text-dv-text">{n.title}</span>
                  <span className="mt-0.5 block font-body text-[15px] leading-snug text-dv-text-2">{n.body}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
