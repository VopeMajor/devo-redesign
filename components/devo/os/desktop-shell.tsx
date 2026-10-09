'use client'

import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock, formatDuration, useNow } from '../hooks'
import { IconButton } from '../kit/button'
import { GlyphHourglass, toRoman } from '../kit/glyphs'
import { SceneBackdrop } from '../kit/scene'
import { TimeDigits } from '../kit/time'
import { Kicker } from '../kit/typography'
import { DeadlyVoteSymbol } from '../system/symbol'
import { SoundToggle } from '../shared/sound-toggle'
import { useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { appIndex, getApp, visibleApps } from './apps'
import { AppGlyphTile, Badge } from './app-icon'
import { NotificationList, ToastStack } from './notifications'
import { PULSE_CRITICAL_MS, pulseRemaining } from '@/lib/devo/pulse'
import { useOsNav } from './os-nav'

type Win = { id: AppId; x: number; y: number; z: number; minimized: boolean; maximized: boolean }

const TOP = 40
const BOTTOM = 52

export function useDesktopWindows() {
  const [wins, setWins] = useState<Win[]>([])
  const zRef = useRef(10)

  const focus = useCallback((id: AppId) => {
    zRef.current += 1
    const z = zRef.current
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)))
  }, [])

  const open = useCallback((id: AppId) => {
    zRef.current += 1
    const z = zRef.current
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return ws.map((w) => (w.id === id ? { ...w, z, minimized: false } : w))
      const def = getApp(id).window
      const vw = window.innerWidth
      const vh = window.innerHeight
      const offset = (ws.length % 5) * 28
      const w = Math.min(def.w, vw - 160)
      const h = Math.min(def.h, vh - TOP - BOTTOM - 24)
      return [...ws, { id, z, minimized: false, maximized: false, x: Math.max(130, (vw - w) / 2 + offset - 40), y: Math.max(TOP + 12, (vh - h) / 2 + offset - 20) }]
    })
  }, [])

  const close = useCallback((id: AppId) => setWins((ws) => ws.filter((w) => w.id !== id)), [])
  const patch = useCallback((id: AppId, p: Partial<Win>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w))), [])

  return { wins, open, close, focus, patch }
}

export function DesktopShell() {
  const { state, dispatch } = useDevo()
  const nav = useOsNav()
  const { wins, open, close, focus, patch } = useDesktopWindowsContext()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [panel, setPanel] = useState<'none' | 'notifications' | 'devo'>('none')
  const now = useNow(1000)

  const visible = wins.filter((w) => !w.minimized)
  const top = visible.reduce<Win | null>((acc, w) => (!acc || w.z > acc.z ? w : acc), null)

  useEffect(() => {
    if (top) dispatch({ type: 'READ_APP', appId: top.id })
  }, [top?.id, state.unread[top?.id ?? 'pulso'], dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useBackHandler(!!top, () => {
    if (!top) return
    playSfx('close')
    close(top.id)
  })
  useBackHandler(panel !== 'none', () => setPanel('none'))

  const openApp = (id: AppId) => {
    playSfx('open')
    setPanel('none')
    nav.open(id)
    dispatch({ type: 'SEE_APP', appId: id })
  }

  const totalUnread = Object.values(state.unread).reduce<number>((a, b) => a + (b ?? 0), 0)
  const remaining = pulseRemaining(state.timerEndsAt, now)
  const critical = remaining < PULSE_CRITICAL_MS

  return (
    <div className="fixed inset-0 overflow-hidden bg-dv-ink text-dv-text" onPointerDown={() => setSelected(null)}>
      {/* Cena viva só com a mesa livre; com janelas abertas fica no quadro estático (os apps podem ter a sua). */}
      <SceneBackdrop preset="cathedral" intensity={0.8} dim={visible.length ? 0.5 : 0.25} alert={critical} staticOnly={visible.length > 0} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-4 opacity-[0.07]">
          <DeadlyVoteSymbol className="size-56 text-dv-gold" />
          <p className="select-none font-serif text-[12vw] uppercase leading-none tracking-[0.08em] text-dv-text">Devo</p>
        </div>
      </div>

      <header
        className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 bg-[linear-gradient(180deg,rgba(17,26,46,0.92),rgba(5,7,13,0.88))] px-4 backdrop-blur-md"
        style={{ height: TOP }}
      >
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-dv-gold/60 via-dv-gold/20 to-transparent" />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              playSfx('click')
              setPanel((p) => (p === 'devo' ? 'none' : 'devo'))
            }}
            aria-expanded={panel === 'devo'}
            className="dv-focus flex h-10 items-center gap-2 text-dv-text transition-colors hover:text-dv-gold-bright"
          >
            <DeadlyVoteSymbol variant="mark" className="size-5 text-dv-gold" />
            <span className="font-serif text-xl uppercase leading-none tracking-[0.08em]">Devo</span>
          </button>
          <span className="dv-label text-[11px] text-dv-text-3">{top ? getApp(top.id).name : 'Área de trabalho'}</span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span className={cn('flex items-center gap-2', critical ? 'text-dv-blood-text' : 'text-dv-cobalt-text')}>
            <GlyphHourglass className={cn('size-4', critical && 'animate-dv-blink')} />
            <TimeDigits value={formatDuration(remaining)} size="sm" tone={critical ? 'blood' : 'cobalt'} flip={false} blinkColon={critical} label="Tempo restante" />
          </span>
          <SoundToggle compact className="min-h-10 min-w-10 justify-center text-dv-gold/80 hover:text-dv-gold-bright" />
          <IconButton
            label="Central de avisos"
            variant="ghost"
            badge={totalUnread}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              playSfx('click')
              setPanel((p) => (p === 'notifications' ? 'none' : 'notifications'))
            }}
            aria-expanded={panel === 'notifications'}
          >
            <BellGlyph />
          </IconButton>
          <span className="dv-tabular font-mono text-[13px] text-dv-text-2">{formatClock(now)}</span>
        </div>
      </header>

      <nav aria-label="Aplicativos" className="absolute left-5 z-10 flex items-start gap-2" style={{ top: TOP + 16, bottom: BOTTOM + 32 }}>
        <div className="grid h-full auto-cols-max grid-flow-col content-start gap-1 [grid-template-rows:repeat(auto-fill,96px)]">
          {visibleApps(false).map((app) => (
            <DesktopIcon key={app.id} appId={app.id} selected={selected === app.id} unread={state.unread[app.id]} onSelect={setSelected} onOpen={openApp} />
          ))}
        </div>
        {state.arcadeUnlocked && (
          <div className="animate-[devo-pop_0.7s_ease-out_both]">
            <DesktopIcon appId="jogos" selected={selected === 'jogos'} unread={state.unread.jogos} onSelect={setSelected} onOpen={openApp} />
          </div>
        )}
      </nav>
      <p className="dv-label absolute bottom-[64px] left-5 z-10 w-24 text-center text-[10px] text-dv-text-3">Clique duplo</p>

      {wins.map((w) => (
        <Window
          key={w.id}
          win={w}
          active={top?.id === w.id}
          onFocus={() => focus(w.id)}
          onClose={() => {
            playSfx('close')
            close(w.id)
          }}
          onPatch={(p) => patch(w.id, p)}
        />
      ))}

      {panel === 'notifications' && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="animate-dv-rise absolute right-3 z-50 w-[400px] pt-3"
          style={{ top: TOP + 8, height: 'min(70vh, 560px)' }}
        >
          <GlassBack />
          <NotificationList onOpen={openApp} className="relative" />
        </div>
      )}

      {panel === 'devo' && (
        <div onPointerDown={(e) => e.stopPropagation()} className="animate-dv-rise absolute left-3 z-50 w-80 p-5" style={{ top: TOP + 8 }}>
          <GlassBack />
          <div className="relative flex items-center gap-3">
            <DeadlyVoteSymbol className="size-11 text-dv-gold" />
            <div>
              <p className="font-serif text-3xl uppercase leading-none tracking-[0.08em] text-dv-text">Devo</p>
              <Kicker tone="gold" className="mt-1.5">Sistema dentro do sistema · 0.1</Kicker>
            </div>
          </div>
          <div className="relative mt-4 flex flex-col">
            <MenuRow onClick={() => openApp('ajustes')}>Ajustes do sistema</MenuRow>
            <MenuRow onClick={nav.exitToLanding}>Voltar à tela inicial</MenuRow>
            <MenuRow onClick={() => openApp('ajustes')} danger>
              Reiniciar sessão…
            </MenuRow>
          </div>
        </div>
      )}

      <footer
        className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-[linear-gradient(0deg,rgba(17,26,46,0.92),rgba(5,7,13,0.86))] px-4 backdrop-blur-md"
        style={{ height: BOTTOM }}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dv-gold/45 to-transparent" />
        {wins.length === 0 && <p className="dv-label text-[11px] text-dv-text-3">Nenhuma janela aberta</p>}
        {wins.map((w) => {
          const app = getApp(w.id)
          const isTop = top?.id === w.id
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                playSfx('click')
                if (isTop) patch(w.id, { minimized: true })
                else focus(w.id)
              }}
              className={cn(
                'dv-focus group relative flex h-10 items-center gap-2.5 pl-1.5 pr-4 font-display text-[13px] font-semibold tracking-[0.04em] transition-colors',
                isTop ? 'bg-dv-cobalt-dim/80 text-dv-text' : 'text-dv-text-2 hover:bg-white/[0.04] hover:text-dv-text',
              )}
            >
              <AppGlyphTile app={app} size="xs" selected={isTop} />
              {app.name}
              <span aria-hidden="true" className={cn('absolute inset-x-2 -bottom-px h-[2px]', isTop ? 'bg-dv-cobalt shadow-[0_0_8px_var(--dv-cobalt)]' : w.minimized ? 'bg-transparent' : 'bg-dv-text-3')} />
            </button>
          )
        })}
      </footer>

      <ToastStack onOpen={openApp} className={cn('right-3 top-[50px] w-80', panel === 'notifications' && 'hidden')} />
    </div>
  )
}

function DesktopIcon({
  appId,
  selected,
  unread,
  onSelect,
  onOpen,
}: {
  appId: AppId
  selected: boolean
  unread?: number
  onSelect: (id: AppId) => void
  onOpen: (id: AppId) => void
}) {
  const app = getApp(appId)
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        playSfx('hover')
        onSelect(app.id)
      }}
      onDoubleClick={() => onOpen(app.id)}
      aria-label={app.name}
      title={unread ? `${app.name} · ${unread} não lidas` : app.name}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(app.id)}
      className={cn(
        'dv-focus group relative flex h-[96px] w-24 flex-col items-center gap-2 px-1 py-2 transition-colors',
        selected ? 'bg-dv-cobalt-dim/60 shadow-[inset_0_0_0_1px_var(--dv-cobalt)]' : 'hover:bg-white/[0.05]',
      )}
    >
      <span className="relative">
        <AppGlyphTile app={app} selected={selected} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
        <Badge count={unread} />
      </span>
      <span className="text-center font-display text-[12px] font-semibold leading-tight tracking-[0.04em] text-dv-text [text-shadow:0_1px_6px_#000]">{app.name}</span>
    </button>
  )
}

function MenuRow({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'dv-focus border-b border-dv-line py-3 text-left font-display text-[14px] font-semibold tracking-[0.04em] transition-colors last:border-0',
        danger ? 'text-dv-blood-text hover:text-white' : 'text-dv-text-2 hover:text-dv-gold-bright',
      )}
    >
      {children}
    </button>
  )
}

function Window({
  win,
  active,
  onFocus,
  onClose,
  onPatch,
}: {
  win: Win
  active: boolean
  onFocus: () => void
  onClose: () => void
  onPatch: (p: Partial<Win>) => void
}) {
  const app = getApp(win.id)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const { Component } = app

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (win.maximized || (e.target as HTMLElement).closest('button')) return
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const x = Math.min(Math.max(e.clientX - drag.current.dx, -app.window.w + 120), window.innerWidth - 120)
    const y = Math.min(Math.max(e.clientY - drag.current.dy, TOP), window.innerHeight - BOTTOM - 40)
    onPatch({ x, y })
  }
  const onUp = () => {
    drag.current = null
  }

  const style = win.maximized
    ? { left: 0, top: TOP, width: '100%', height: `calc(100% - ${TOP + BOTTOM}px)`, zIndex: win.z }
    : {
        left: win.x,
        top: win.y,
        width: `min(${app.window.w}px, calc(100vw - 160px))`,
        height: `min(${app.window.h}px, calc(100vh - ${TOP + BOTTOM + 24}px))`,
        zIndex: win.z,
      }

  return (
    <section
      role="dialog"
      aria-label={app.name}
      onPointerDown={(e) => {
        e.stopPropagation()
        onFocus()
      }}
      className={cn(
        'animate-dv-pop absolute flex flex-col overflow-hidden border bg-dv-ink/95 backdrop-blur-md transition-[box-shadow,border-color]',
        active
          ? 'border-dv-cobalt/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),0_0_32px_-10px_rgba(49,93,255,0.6)]'
          : 'border-dv-line-strong shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]',
        win.minimized && 'hidden',
      )}
      style={style}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onDoubleClick={() => onPatch({ maximized: !win.maximized })}
        className={cn(
          'relative flex h-11 shrink-0 cursor-grab touch-none select-none items-center justify-between gap-3 pl-2 pr-2 active:cursor-grabbing',
          active ? 'bg-[linear-gradient(90deg,#13235e,var(--dv-ink-3)_45%,var(--dv-ink-2))]' : 'bg-dv-ink-2',
        )}
      >
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px">
          <span className={cn('absolute inset-0 bg-gradient-to-r', active ? 'from-dv-gold/70 via-dv-gold/25 to-transparent' : 'from-dv-line-strong to-transparent')} />
          {active && <span className="absolute -top-[1px] left-[14%] h-[3px] w-7 bg-dv-cobalt" />}
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <AppGlyphTile app={app} size="xs" selected={active} />
          <span className={cn('font-display text-[14px] font-semibold uppercase tracking-[0.1em]', active ? 'text-dv-text' : 'text-dv-text-2')}>{app.name}</span>
          <span className="hidden truncate font-body text-[13px] italic text-dv-text-3 sm:inline">— {app.subtitle}</span>
        </span>
        <span aria-hidden="true" className="ml-auto mr-2 font-impact text-[18px] font-semibold leading-none text-transparent [-webkit-text-stroke:0.8px_var(--dv-gold)]">
          {toRoman(appIndex(win.id))}
        </span>
        <span className="flex items-center gap-1">
          <WinButton label="Minimizar" onClick={() => onPatch({ minimized: true })}>
            <Minus className="size-3.5" />
          </WinButton>
          <WinButton label={win.maximized ? 'Restaurar' : 'Maximizar'} onClick={() => onPatch({ maximized: !win.maximized })}>
            {win.maximized ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </WinButton>
          <WinButton label="Fechar" onClick={onClose} danger>
            <X className="size-3.5" />
          </WinButton>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <Component />
      </div>
    </section>
  )
}

function WinButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'dv-focus grid size-8 place-items-center text-dv-text-3 transition-colors hover:bg-white/[0.08] hover:text-dv-text',
        danger && 'hover:bg-dv-blood hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

/** Fundo de vidro chanfrado dos painéis suspensos (menu DEVO, central de avisos). */
function GlassBack() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 [--dv-cut:14px]">
      <span className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_30%,var(--dv-gold)_60%,var(--dv-gold-deep))] opacity-70" />
      <span className="dv-cut absolute inset-px bg-[linear-gradient(180deg,rgba(17,26,46,0.97),rgba(5,7,13,0.97))] backdrop-blur-xl [--dv-cut:13.6px]" />
    </span>
  )
}

function BellGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.8H4.4Z" />
      <path d="M10 20.6a2 2 0 0 0 4 0" strokeLinecap="round" />
      <path d="M12 3v2" strokeLinecap="round" />
    </svg>
  )
}

type WinCtx = ReturnType<typeof useDesktopWindows>
export const DesktopWindowsContext = createContext<WinCtx | null>(null)
function useDesktopWindowsContext() {
  const ctx = useContext(DesktopWindowsContext)
  if (!ctx) throw new Error('DesktopWindowsContext ausente')
  return ctx
}
