'use client'

import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GlyphAlert, GlyphClose, GlyphDiamond, GlyphSpark } from './glyphs'

export type ToastTone = 'system' | 'gold' | 'alert'

const ACCENT: Record<ToastTone, string> = {
  system: 'bg-dv-cobalt',
  gold: 'bg-dv-gold',
  alert: 'bg-dv-blood',
}
const KICK: Record<ToastTone, string> = {
  system: 'text-dv-cobalt-text',
  gold: 'text-dv-gold',
  alert: 'text-dv-blood-text',
}

/**
 * Aviso visual curto. Entra com corte diagonal da esquerda. A lógica de fila fica com quem usa
 * (ex.: os/notifications.tsx); este componente só desenha. Use `role="status"` (padrão) para
 * avisos e `role="alert"` só para perigo.
 */
export function Toast({
  tone = 'system',
  source,
  title,
  body,
  time,
  icon,
  onClose,
  className,
  style,
}: {
  tone?: ToastTone
  /** Remetente/origem em caixa-alta ("SISTEMA", "O RATO"). */
  source?: string
  title: string
  body?: ReactNode
  time?: string
  icon?: ReactNode
  onClose?: () => void
  className?: string
  style?: CSSProperties
}) {
  const glyph = icon ?? (tone === 'alert' ? <GlyphAlert /> : tone === 'gold' ? <GlyphSpark /> : <GlyphDiamond />)
  return (
    <div
      role={tone === 'alert' ? 'alert' : 'status'}
      className={cn('animate-dv-toast-in relative isolate w-full max-w-sm drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)]', className)}
      style={{ '--dv-cut': '12px', ...style } as CSSProperties}
    >
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', tone === 'alert' ? 'bg-dv-blood/70' : 'bg-dv-line-strong')} />
      <span
        aria-hidden="true"
        className={cn('dv-cut-diag absolute inset-px -z-10', tone === 'alert' ? 'bg-[linear-gradient(100deg,#3a080d,var(--dv-ink-2)_55%)]' : 'bg-[linear-gradient(100deg,var(--dv-ink-3),var(--dv-ink-2)_60%)]')}
        style={{ '--dv-cut': '11.6px' } as CSSProperties}
      />
      <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-[3px]', ACCENT[tone])} />
      <div className="flex items-start gap-3 py-3 pl-4 pr-2">
        <span className={cn('mt-0.5 flex size-5 shrink-0 items-center [&>svg]:size-full', KICK[tone])}>{glyph}</span>
        <div className="min-w-0 flex-1">
          {(source || time) && (
            <p className="dv-label flex items-center justify-between gap-2 text-[10px]">
              <span className={KICK[tone]}>{source}</span>
              {time && <span className="dv-tabular text-dv-text-3">{time}</span>}
            </p>
          )}
          <p className="mt-0.5 font-display text-[15px] font-semibold leading-snug tracking-[0.03em] text-dv-text">{title}</p>
          {body && <p className="mt-0.5 font-body text-[14px] leading-snug text-dv-text-2">{body}</p>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Dispensar aviso" className="dv-focus -my-1 grid size-11 shrink-0 place-items-center text-dv-text-3 hover:text-dv-text">
            <GlyphClose className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/** Pilha de toasts presa ao topo (abaixo da barra de status), respeitando a área segura. */
export function ToastStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-3 [&>*]:pointer-events-auto', className)}
      style={{ top: 'calc(env(safe-area-inset-top) + 44px)' }}
    >
      {children}
    </div>
  )
}
