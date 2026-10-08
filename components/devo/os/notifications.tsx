'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { AppId, NotificationItem } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock } from '../hooks'
import { useDevo } from '../state/devo-store'
import { getApp } from './apps'
import { AppGlyphTile } from './app-icon'

function Toast({ item, onOpen }: { item: NotificationItem; onOpen: (id: AppId) => void }) {
  const { dispatch } = useDevo()
  useEffect(() => {
    const t = window.setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: item.id }), 5200)
    return () => window.clearTimeout(t)
  }, [item.id, dispatch])
  const app = getApp(item.appId)
  return (
    <li
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 border bg-card/95 p-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md animate-pop',
        item.tone === 'danger' ? 'border-primary/60' : 'border-foreground/20',
      )}
    >
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'DISMISS_TOAST', id: item.id })
          onOpen(item.appId)
        }}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <AppGlyphTile app={app} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {app.name}
            <span>{formatClock(item.createdAt)}</span>
          </span>
          <span className="mt-0.5 block text-sm text-foreground">{item.title}</span>
          <span className="line-clamp-2 block text-sm text-foreground/70">{item.body}</span>
        </span>
      </button>
      <button type="button" onClick={() => dispatch({ type: 'DISMISS_TOAST', id: item.id })} className="text-foreground/40 hover:text-foreground" aria-label="Dispensar">
        <X className="size-3.5" />
      </button>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary/70 [animation:devo-shrink_5.2s_linear_forwards]" />
    </li>
  )
}

export function ToastStack({ onOpen, className }: { onOpen: (id: AppId) => void; className?: string }) {
  const { state } = useDevo()
  return (
    <ol aria-live="polite" aria-label="Notificações recentes" className={cn('pointer-events-none fixed z-50 flex flex-col gap-2', className)}>
      {state.toasts.map((t) => (
        <Toast key={t.id} item={t} onOpen={onOpen} />
      ))}
    </ol>
  )
}

export function NotificationList({ onOpen }: { onOpen: (id: AppId) => void }) {
  const { state, dispatch } = useDevo()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Central de avisos</p>
        <button type="button" onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })} className="text-[11px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground">
          Limpar
        </button>
      </div>
      <ul className="devo-scroll flex-1 overflow-y-auto">
        {state.notifications.length === 0 && <li className="p-6 text-center text-sm italic text-muted-foreground">Silêncio. Por enquanto.</li>}
        {state.notifications.map((n) => {
          const app = getApp(n.appId)
          return (
            <li key={n.id}>
              <button type="button" onClick={() => onOpen(n.appId)} className="flex w-full items-start gap-3 border-b border-foreground/10 px-4 py-3 text-left hover:bg-foreground/5">
                <AppGlyphTile app={app} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {app.name}
                    <span>{formatClock(n.createdAt)}</span>
                  </span>
                  <span className="block text-sm text-foreground">{n.title}</span>
                  <span className="block text-sm text-foreground/70">{n.body}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
