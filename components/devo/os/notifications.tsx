'use client'

import { useEffect, type CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AppId, NotificationItem } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock } from '../hooks'
import { Toast } from '../kit/toast'
import { Divider, Kicker } from '../kit/typography'
import { GlyphClock, GlyphClose } from '../kit/glyphs'
import { Button } from '../kit/button'
import { useDevo } from '../state/devo-store'
import { getApp } from './apps'
import { AppGlyphTile } from './app-icon'

const TOAST_MS = 5200

/** Um aviso na pilha: desenho do kit (`Toast`) + toque para abrir o app de origem + barra de tempo. */
function LiveToast({ item, onOpen, compact }: { item: NotificationItem; onOpen: (id: AppId) => void; compact?: boolean }) {
  const { dispatch } = useDevo()
  useEffect(() => {
    const t = window.setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: item.id }), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [item.id, dispatch])
  const app = getApp(item.appId)
  const danger = item.tone === 'danger'
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', id: item.id })
  if (compact) {
    return (
      <li className="animate-dv-toast-in pointer-events-auto relative w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]" role={danger ? 'alert' : 'status'} style={{ '--dv-cut': '10px' } as CSSProperties}>
        <span
          aria-hidden="true"
          className={cn(
            'dv-cut-diag absolute inset-0',
            danger ? 'bg-dv-blood/80' : 'bg-[linear-gradient(100deg,#f4efe6,#6b6357_30%,#bab09f_60%,#5f584d_85%,#ece5d8)]',
          )}
        />
        <span aria-hidden="true" className="dv-cut-diag bg-[#121214] bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] absolute inset-px" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
        <span
          aria-hidden="true"
          className={cn('dv-cut-diag absolute inset-px', danger ? 'bg-[linear-gradient(100deg,rgba(63,6,11,0.85),rgba(12,12,14,0.4)_60%)]' : 'bg-[linear-gradient(100deg,rgba(255,255,255,0.05),rgba(0,0,0,0.25))]')}
          style={{ '--dv-cut': '9.6px' } as CSSProperties}
        />
        <div className="relative flex min-h-12 items-center gap-2.5 pl-3">
          <button
            type="button"
            onClick={() => {
              dismiss()
              onOpen(item.appId)
            }}
            aria-label={`Abrir ${app.name}: ${item.title}`}
            className="dv-focus flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left"
          >
            <AppGlyphTile app={app} size="xs" />
            <span className="min-w-0 flex-1">
              <span className={cn('dv-label block text-[10px]', danger ? 'text-dv-blood-text' : 'text-dv-gold')}>{app.name}</span>
              <span className="block truncate font-display text-[14px] font-semibold tracking-[0.02em] text-dv-text">{item.title}</span>
            </span>
          </button>
          <button type="button" onClick={dismiss} aria-label="Dispensar aviso" className="dv-focus grid size-11 shrink-0 place-items-center text-dv-text-3 hover:text-dv-text">
            <GlyphClose className="size-4" />
          </button>
        </div>
        <span aria-hidden="true" className={cn('pointer-events-none absolute bottom-0 left-3 right-4 h-px origin-left [animation:devo-shrink_5.2s_linear_forwards]', danger ? 'bg-dv-blood' : 'bg-[linear-gradient(90deg,#bab09f,#f4efe6)]')} />
      </li>
    )
  }
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
        className={cn('pointer-events-none absolute bottom-0 left-3 right-4 h-px origin-left [animation:devo-shrink_5.2s_linear_forwards]', danger ? 'bg-dv-blood' : 'bg-[linear-gradient(90deg,#bab09f,#f4efe6)]')}
      />
    </li>
  )
}

/**
 * Pilha de avisos. `max` limita quantos aparecem juntos (os demais esperam a vez; o tempo de cada
 * um só corre quando ele aparece). `hold` segura todos (ex.: enquanto a home entra).
 * `compact` = tira de uma linha (celular). `inline` = no fluxo da página (faixa sob a barra de status
 * do celular, que empurra a tela), em vez de flutuar por cima.
 */
export function ToastStack({
  onOpen,
  className,
  compact,
  inline = false,
  max = 3,
  hold = false,
}: {
  onOpen: (id: AppId) => void
  className?: string
  compact?: boolean
  inline?: boolean
  max?: number
  hold?: boolean
}) {
  const { state } = useDevo()
  const list = hold ? [] : state.toasts.slice(0, max)
  return (
    <ol aria-live="polite" aria-label="Notificações recentes" className={cn('pointer-events-none flex flex-col items-center gap-2', inline ? 'relative' : 'fixed z-50', className)}>
      {list.map((t) => (
        <LiveToast key={t.id} item={t} onOpen={onOpen} compact={compact} />
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
          <Kicker tone="gold">{count === 0 ? 'Nenhum aviso' : `${count} ${count === 1 ? 'aviso' : 'avisos'}`}</Kicker>
          <p className="mt-1.5 whitespace-nowrap font-display text-[18px] font-semibold uppercase leading-none tracking-[0.04em] text-dv-text">Central de avisos</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={count === 0}
          onClick={() => {
            playSfx('click')
            dispatch({ type: 'CLEAR_NOTIFICATIONS' })
          }}
          className="shrink-0 !px-3"
        >
          Limpar
        </Button>
      </div>
      <div aria-hidden="true" className="relative mx-4 h-px">
        <span className="absolute inset-0 bg-gradient-to-r from-dv-gold/70 via-dv-gold/25 to-transparent" />
        <span className="absolute -top-[1.5px] left-[18%] size-1 rotate-45 bg-dv-amethyst shadow-[0_0_6px_rgba(138,124,200,0.9)]" />
      </div>
      <ul className="devo-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {count === 0 && (
          <li className="flex flex-col items-center gap-3 px-6 py-7 text-center">
            <span className="relative grid size-20 place-items-center">
              <span aria-hidden="true" className="absolute inset-0 rounded-full border border-dv-gold/50" />
              <span aria-hidden="true" className="absolute inset-2 rounded-full border border-dashed border-dv-gold/30 animate-dv-spin-slow" />
              <GlyphClock className="size-9 text-dv-gold" />
            </span>
            <p className="font-display text-[19px] font-semibold uppercase tracking-[0.06em] text-dv-text">Silêncio. Por enquanto.</p>
            <p className="max-w-[17rem] font-body text-[15px] italic leading-snug text-dv-text-2">Nenhum aviso do sistema. Quando o Anfitrião falar, aparece aqui.</p>
            <Divider variant="clock" tone="gold" className="mt-1 w-44 opacity-70" />
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
                <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', danger ? 'bg-dv-blood/60' : 'bg-[rgba(238,237,235,0.16)]')} />
                <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(100deg,#1f1f22,#151517_70%)]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
                <span
                  aria-hidden="true"
                  className={cn(
                    'dv-cut-diag absolute inset-px -z-10 transition-colors',
                    danger ? 'bg-[linear-gradient(100deg,rgba(63,6,11,0.8),transparent_60%)]' : 'group-hover:bg-white/[0.04]',
                  )}
                  style={{ '--dv-cut': '9.6px' } as CSSProperties}
                />
                <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-[2px]', danger ? 'bg-dv-blood' : 'bg-dv-gold/70')} />
                <AppGlyphTile app={app} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="dv-label flex justify-between gap-2 text-[10px]">
                    <span className={danger ? 'text-dv-blood-text' : 'text-dv-gold'}>{app.name}</span>
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
