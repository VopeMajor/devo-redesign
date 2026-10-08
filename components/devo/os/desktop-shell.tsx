'use client'

import { Bell, Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock, formatDuration, useNow } from '../hooks'
import { Sparkle } from '../ornaments'
import { CathedralBackdrop, Embers } from '../shared/atmosphere'
import { SoundToggle } from '../shared/sound-toggle'
import { useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { getApp, visibleApps } from './apps'
import { AppGlyphTile, Badge } from './app-icon'
import { NotificationList, ToastStack } from './notifications'
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
  const remaining = state.timerEndsAt - now

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground" onPointerDown={() => setSelected(null)}>
      <CathedralBackdrop dim={0.72} />
      <Embers className="opacity-60" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <p className="select-none font-serif uppercase tracking-[0.08em] text-[22vw] leading-none text-foreground/[0.035]">Devo</p>
      </div>

      <header
        className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 border-b border-foreground/15 bg-background/80 px-4 backdrop-blur-md"
        style={{ height: TOP }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              playSfx('click')
              setPanel((p) => (p === 'devo' ? 'none' : 'devo'))
            }}
            aria-expanded={panel === 'devo'}
            className="flex items-center gap-2 text-foreground hover:text-primary"
          >
            <Sparkle className="size-3 text-primary" />
            <span className="font-serif uppercase tracking-[0.08em] text-xl leading-none">Devo</span>
          </button>
          <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{top ? getApp(top.id).name : 'Área de trabalho'}</span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span className={cn('flex items-center gap-2 font-mono tabular-nums', remaining < 6 * 3600000 ? 'text-primary animate-blink' : 'text-primary')}>
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-blink" aria-hidden="true" />
            <span className="sr-only">Tempo restante: </span>
            {formatDuration(remaining)}
          </span>
          <SoundToggle compact />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              playSfx('click')
              setPanel((p) => (p === 'notifications' ? 'none' : 'notifications'))
            }}
            aria-expanded={panel === 'notifications'}
            aria-label="Central de avisos"
            className="relative text-foreground/70 hover:text-foreground"
          >
            <Bell className="size-4" />
            <Badge count={totalUnread} className="-right-2 -top-2 min-w-4 text-[9px] leading-4" />
          </button>
          <span className="font-mono text-foreground/70 tabular-nums">{formatClock(now)}</span>
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
      <p className="absolute bottom-[64px] left-5 z-10 w-24 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Clique duplo</p>

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
          className="absolute right-3 z-50 w-96 border border-foreground/20 bg-card/95 backdrop-blur-md animate-pop"
          style={{ top: TOP + 8, height: 'min(70vh, 560px)' }}
        >
          <NotificationList onOpen={openApp} />
        </div>
      )}

      {panel === 'devo' && (
        <div onPointerDown={(e) => e.stopPropagation()} className="absolute left-3 z-50 w-72 border border-foreground/20 bg-card/95 p-4 backdrop-blur-md animate-pop" style={{ top: TOP + 8 }}>
          <p className="font-serif uppercase tracking-[0.08em] text-3xl text-foreground">Devo</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Sistema dentro do sistema · 0.1</p>
          <div className="mt-4 flex flex-col">
            <MenuRow onClick={() => openApp('ajustes')}>Ajustes do sistema</MenuRow>
            <MenuRow onClick={nav.exitToLanding}>Voltar à tela inicial</MenuRow>
            <MenuRow onClick={nav.restart} danger>
              Reiniciar sessão
            </MenuRow>
          </div>
        </div>
      )}

      <footer
        className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t border-foreground/15 bg-background/85 px-4 backdrop-blur-md"
        style={{ height: BOTTOM }}
      >
        {wins.length === 0 && <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Nenhuma janela aberta</p>}
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
                'relative flex h-9 items-center gap-2 border px-3 text-sm transition-colors',
                isTop ? 'border-foreground/40 bg-foreground/10 text-foreground' : 'border-foreground/10 text-foreground/60 hover:text-foreground',
              )}
            >
              <app.icon className="size-4" strokeWidth={1.4} aria-hidden="true" />
              {app.name}
              <span aria-hidden="true" className={cn('absolute inset-x-3 -bottom-px h-px', isTop ? 'bg-primary' : w.minimized ? 'bg-transparent' : 'bg-foreground/30')} />
            </button>
          )
        })}
      </footer>

      <ToastStack onOpen={openApp} className="right-3 top-[50px] w-80" />
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
      onKeyDown={(e) => e.key === 'Enter' && onOpen(app.id)}
      className={cn(
        'group relative flex h-[96px] w-24 flex-col items-center gap-2 border border-transparent px-1 py-2 transition-colors focus-visible:outline-none',
        selected ? 'border-foreground/25 bg-foreground/10' : 'hover:bg-foreground/5',
      )}
    >
      <span className="relative">
        <AppGlyphTile app={app} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
        <Badge count={unread} />
      </span>
      <span className="text-center text-[13px] leading-tight text-foreground/90 [text-shadow:0_1px_4px_#000]">{app.name}</span>
    </button>
  )
}

function MenuRow({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('border-b border-foreground/10 py-2.5 text-left text-sm transition-colors last:border-0', danger ? 'text-primary hover:text-primary/80' : 'text-foreground/85 hover:text-foreground')}
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
        'absolute flex flex-col overflow-hidden border bg-[#090b12]/95 backdrop-blur-md animate-pop transition-[box-shadow,border-color]',
        active ? 'border-foreground/35 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),0_0_0_1px_rgba(22,71,255,0.25)]' : 'border-foreground/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]',
        win.minimized && 'hidden',
      )}
      style={style}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onDoubleClick={() => onPatch({ maximized: !win.maximized })}
        className={cn('flex h-10 shrink-0 cursor-grab touch-none select-none items-center justify-between gap-3 border-b px-3 active:cursor-grabbing', active ? 'border-foreground/20 bg-gradient-to-r from-[#0f2366] via-[#15171c] to-[#15171c]' : 'border-foreground/10 bg-[#15171c]')}
      >
        <span className="flex items-center gap-2">
          <app.icon className={cn('size-4', active ? 'text-primary' : 'text-foreground/50')} strokeWidth={1.4} aria-hidden="true" />
          <span className="text-[12px] uppercase tracking-[0.3em] text-foreground/90">{app.name}</span>
          <span className="hidden text-[11px] italic text-muted-foreground sm:inline">— {app.subtitle}</span>
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
      className={cn('grid size-7 place-items-center border border-transparent text-foreground/60 transition-colors hover:border-foreground/20 hover:text-foreground', danger && 'hover:border-primary/60 hover:bg-primary/20')}
    >
      {children}
    </button>
  )
}

type WinCtx = ReturnType<typeof useDesktopWindows>
export const DesktopWindowsContext = createContext<WinCtx | null>(null)
function useDesktopWindowsContext() {
  const ctx = useContext(DesktopWindowsContext)
  if (!ctx) throw new Error('DesktopWindowsContext ausente')
  return ctx
}
