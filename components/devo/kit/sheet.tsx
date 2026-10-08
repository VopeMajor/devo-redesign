'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { IconButton } from './button'
import { FRAME_LINE } from './frame'
import { GlyphClose } from './glyphs'
import { Kicker } from './typography'

const EXIT_MS = 360

/**
 * Folha modal. No celular sobe do rodapé (com alça); a partir de 640px vira diálogo centralizado.
 * Fecha com Esc, toque no fundo, botão "Fechar" e (se você ligar) o botão voltar do Android via
 * `useBackHandler(open, onClose)` na tela que a usa. Trava a rolagem do body e devolve o foco.
 */
export function Sheet({
  open,
  onClose,
  title,
  kicker,
  description,
  children,
  footer,
  tone = 'ink',
  size = 'md',
  sound = true,
  placement = 'auto',
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  kicker?: string
  description?: ReactNode
  children?: ReactNode
  /** Ações fixas no rodapé (botões). */
  footer?: ReactNode
  tone?: 'ink' | 'paper' | 'alert'
  size?: 'sm' | 'md' | 'lg'
  sound?: boolean
  /** auto = rodapé no celular, centro no desktop; center = sempre centralizado. */
  placement?: 'auto' | 'center'
  className?: string
}) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>(open ? 'open' : 'closed')
  const panelRef = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)
  const id = useId()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (open) {
      restore.current = document.activeElement as HTMLElement | null
      setPhase('open')
      if (sound) playSfx('open')
      return
    }
    setPhase((p) => (p === 'open' ? 'closing' : p))
    const t = window.setTimeout(() => setPhase((p) => (p === 'closing' ? 'closed' : p)), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'open') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => panelRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      restore.current?.focus?.()
    }
  }, [phase])

  if (!mounted || phase === 'closed') return null

  const closing = phase === 'closing'
  const paper = tone === 'paper'
  const center = placement === 'center'
  const maxW = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'

  return createPortal(
    <div className={cn('fixed inset-0 z-[90] flex justify-center sm:items-center sm:p-6', center ? 'items-center p-4' : 'items-end')}>
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={() => {
          if (sound) playSfx('close')
          onClose()
        }}
        className={cn(
          'absolute inset-0 cursor-default bg-[rgba(3,4,8,0.72)] backdrop-blur-[3px]',
          closing ? 'opacity-0 transition-opacity duration-300' : 'animate-dv-fade',
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[88dvh] w-full flex-col outline-none',
          maxW,
          center
            ? closing
              ? 'opacity-0 transition-opacity duration-300'
              : 'animate-dv-pop'
            : closing
              ? 'animate-dv-sheet-down sm:animate-none sm:opacity-0 sm:transition-opacity'
              : 'animate-dv-sheet-up sm:animate-dv-pop',
          className,
        )}
      >
        {/* filete superior com chanfro e fundo */}
        <span
          aria-hidden="true"
          className={cn('absolute inset-0', center ? 'dv-cut' : '[clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%,0_18px)] sm:dv-cut', FRAME_LINE[tone === 'alert' ? 'blood' : 'gold'])}
          style={{ '--dv-cut': '18px' } as CSSProperties}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-px top-px',
            center ? 'bottom-px dv-cut' : 'bottom-0 [clip-path:polygon(17.6px_0,calc(100%-17.6px)_0,100%_17.6px,100%_100%,0_100%,0_17.6px)] sm:bottom-px sm:dv-cut',
            paper ? 'dv-paper-bg' : tone === 'alert' ? 'bg-[linear-gradient(180deg,#2a070b,var(--dv-ink)_45%)]' : 'bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink-2)_30%,var(--dv-ink))]',
          )}
          style={{ '--dv-cut': '17.6px' } as CSSProperties}
        />
        <div className={cn('relative flex justify-center pt-2.5 sm:hidden', center && 'hidden')} aria-hidden="true">
          <span className={cn('h-1 w-10 rounded-full', paper ? 'bg-dv-paper-ink/30' : 'bg-dv-text-3')} />
        </div>
        <header className={cn('relative flex items-start gap-3 px-5 pb-3 pt-3 sm:pt-5', center && 'pt-5')}>
          <div className="min-w-0 flex-1">
            {kicker && <Kicker tone={tone === 'alert' ? 'blood' : paper ? 'paper' : 'gold'} className="mb-1.5">{kicker}</Kicker>}
            <h2 id={`${id}-t`} className={cn('font-display text-[22px] font-semibold uppercase leading-tight tracking-[0.06em]', paper ? 'text-dv-paper-ink' : 'text-dv-text')}>
              {title}
            </h2>
            {description && (
              <p id={`${id}-d`} className={cn('mt-1.5 font-body text-[15px] leading-relaxed', paper ? 'text-dv-paper-ink/75' : 'text-dv-text-2')}>
                {description}
              </p>
            )}
          </div>
          <IconButton
            label="Fechar"
            variant="ghost"
            onClick={() => {
              if (sound) playSfx('close')
              onClose()
            }}
            className={paper ? '[&_span]:text-dv-paper-ink' : undefined}
          >
            <GlyphClose />
          </IconButton>
        </header>
        <div className={cn('devo-scroll relative min-h-0 flex-1 overflow-y-auto px-5 pb-4', paper ? 'text-dv-paper-ink' : 'text-dv-text')}>{children}</div>
        {footer && (
          <footer className="relative flex flex-col gap-2.5 border-t border-dv-line px-5 pt-3 dv-safe-bottom sm:flex-row sm:justify-end sm:pb-5">{footer}</footer>
        )}
        {!footer && <div className="dv-safe-bottom relative" />}
      </div>
    </div>,
    document.body,
  )
}

/** Diálogo centralizado em todas as larguras (confirmações curtas). Mesma API do Sheet. */
export function Dialog(props: Parameters<typeof Sheet>[0]) {
  return <Sheet size="sm" placement="center" {...props} />
}
