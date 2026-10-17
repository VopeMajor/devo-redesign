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
import { SISTEMAS } from '../progressao/sistemas'
import { useAcesso } from '../progressao/use-acesso'
import { AppGlyphTile, Badge } from './app-icon'
import { NotificationList, ToastStack } from './notifications'
import { PULSE_CRITICAL_MS, pulseRemaining } from '@/lib/devo/pulse'
import { useOsNav } from './os-nav'
import { PulseDial } from './pulse-dial'
import { MarbleSlab, StateSeal } from './shell-ui'
import { FrameCorners } from '../kit/frame'

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

  const { liberado, salaJogos } = useAcesso()
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
    <div className="fixed inset-0 overflow-hidden bg-dv-ink text-dv-text [&_button]:[text-rendering:geometricPrecision] [&_input]:[text-rendering:geometricPrecision] [&_textarea]:[text-rendering:geometricPrecision]" onPointerDown={() => setSelected(null)}>
      {/*
        Papel de parede = o salão do relógio da Jornada (mostrador ao fundo, piso de mármore xadrez).
        Viva só com a mesa livre; com janelas abertas fica no quadro estático. No crítico a cena não
        fica vermelha: a vinheta rubi pulsa nas bordas.
      */}
      <SceneBackdrop preset="clockhall" intensity={0.85} dim={visible.length ? 0.55 : 0.2} staticOnly={visible.length > 0} />
      {/* O salão vem da Jornada (noite azul-violeta); no interior ele fica no mármore: tira a cor da cena. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#808080] mix-blend-saturation" />
      {critical && (
        <div aria-hidden="true" className="animate-dv-alert pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(110%_90%_at_50%_50%,transparent_62%,rgb(var(--dv-blood-rgb)/0.3)_90%,rgb(var(--dv-blood-deep-rgb)/0.55)_100%)]" />
      )}
      <PulseWidget remaining={remaining} critical={critical} onOpen={() => openApp('pulso')} />

      <header
        className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 bg-[linear-gradient(180deg,rgba(21,21,23,0.94),rgb(var(--dv-ink-rgb)/0.96))] px-4"
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
          <span className={cn('flex items-center gap-2', critical ? 'text-dv-blood-text' : 'text-dv-gold')}>
            <GlyphHourglass className={cn('size-4', critical && 'animate-dv-blink')} />
            <TimeDigits value={formatDuration(remaining)} size="sm" tone={critical ? 'blood' : 'text'} flip={false} blinkColon={critical} label="Tempo restante" />
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

      {/* Área de trabalho de verdade: todos os ícones numa só grade que desce em coluna e abre a coluna seguinte
          quando falta altura (apps, Sala de Jogos e sistemas liberados, nessa ordem). */}
      <nav aria-label="Aplicativos" className="absolute left-5 z-10" style={{ top: TOP + 16, bottom: BOTTOM + 32 }}>
        <div className="grid h-full auto-cols-max grid-flow-col content-start gap-x-2 gap-y-1 [grid-template-rows:repeat(auto-fill,108px)]">
          {visibleApps(false).map((app) => (
            <DesktopIcon key={app.id} appId={app.id} selected={selected === app.id} unread={state.unread[app.id]} onSelect={setSelected} onOpen={openApp} />
          ))}
          {(state.arcadeUnlocked || salaJogos) && (
            <div className="animate-[devo-pop_0.7s_ease-out_both]">
              <DesktopIcon appId="jogos" selected={selected === 'jogos'} unread={state.unread.jogos} onSelect={setSelected} onOpen={openApp} />
            </div>
          )}
          {/* Sistemas novos liberados pelo servidor (DIRECAO-3; trancados não aparecem na área de trabalho). */}
          {SISTEMAS.filter((f) => f.flag && liberado(f.flag)).map((f) => (
            <div key={f.id} className="animate-[devo-pop_0.7s_ease-out_both]">
              <DesktopIcon appId={f.id as AppId} selected={selected === f.id} onSelect={setSelected} onOpen={openApp} />
            </div>
          ))}
        </div>
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
          </div>
        </div>
      )}

      <footer
        className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-[linear-gradient(0deg,rgba(21,21,23,0.94),rgb(var(--dv-ink-rgb)/0.96))] px-4"
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
                isTop ? 'bg-white/[0.07] text-dv-text' : 'text-dv-text-2 hover:bg-white/[0.04] hover:text-dv-text',
              )}
            >
              <AppGlyphTile app={app} size="xs" selected={isTop} />
              {app.name}
              <span aria-hidden="true" className={cn('absolute inset-x-2 -bottom-px h-[2px]', isTop ? 'bg-dv-gold-bright shadow-[0_0_8px_rgb(var(--dv-amethyst-rgb)/0.8)]' : w.minimized ? 'bg-transparent' : 'bg-dv-text-3')} />
            </button>
          )
        })}
      </footer>

      {/* Mesma regra do celular: um aviso por vez, no topo, logo abaixo da barra (canto direito). */}
      <ToastStack onOpen={openApp} compact max={1} className={cn('right-3 top-[48px] w-[360px]', panel === 'notifications' && 'hidden')} />
    </div>
  )
}

/**
 * Widget do tempo ancorado no papel de parede (canto inferior direito, abaixo das janelas): tampo de
 * mármore negro, mostrador de aço e os dígitos. Clique abre o Pulso.
 */
function PulseWidget({ remaining, critical, onOpen }: { remaining: number; critical: boolean; onOpen: () => void }) {
  const { state } = useDevo()
  const text = formatDuration(remaining)
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onOpen}
      aria-label={`Tempo restante ${text}. Abrir o Pulso`}
      className="dv-focus group absolute right-8 z-[5] w-[340px] text-left transition-transform duration-150 active:scale-[0.99]"
      style={{ bottom: BOTTOM + 28 }}
    >
      <MarbleSlab edge={critical ? 'blood' : 'steel'} cut={16} glow innerClassName="flex items-center gap-4 py-4 pl-5 pr-4">
        <FrameCorners tone={critical ? 'blood' : 'gold'} size={18} />
        <span className="min-w-0 flex-1">
          <Kicker tone={critical ? 'blood' : 'gold'}>Tempo restante</Kicker>
          <TimeDigits value={text} size="lg" tone={critical ? 'blood' : 'text'} flip={false} blinkColon={critical} className="mt-2 text-[34px]" />
          <span className="mt-3 flex items-center gap-2">
            {critical ? (
              <StateSeal tone="blood" live>
                Crítico
              </StateSeal>
            ) : (
              <StateSeal>Estável</StateSeal>
            )}
            <span className="dv-label text-[10px] text-dv-text-3 transition-colors group-hover:text-dv-text-2">Abrir ›</span>
          </span>
        </span>
        <PulseDial remaining={remaining} timerEndsAt={state.timerEndsAt} critical={critical} variant="compact" className="size-[112px] shrink-0" />
      </MarbleSlab>
    </button>
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
        'dv-focus group relative flex h-[108px] w-24 flex-col items-center gap-2 px-1 py-2 transition-colors',
        selected ? 'bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(206,201,192,0.45)]' : 'hover:bg-white/[0.05]',
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
        'animate-dv-pop absolute flex flex-col overflow-hidden border bg-dv-ink transition-[box-shadow,border-color]',
        active
          ? 'border-dv-gold/55 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),0_0_28px_-12px_rgba(236,229,216,0.35)]'
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
          active ? 'bg-[linear-gradient(90deg,var(--dv-ink-4),var(--dv-ink-3)_45%,var(--dv-ink-2))]' : 'bg-dv-ink-2',
        )}
      >
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px">
          <span className={cn('absolute inset-0 bg-gradient-to-r', active ? 'from-dv-gold/70 via-dv-gold/25 to-transparent' : 'from-dv-line-strong to-transparent')} />
          {active && <span className="absolute -top-[1.5px] left-[14%] size-1 rotate-45 bg-dv-amethyst shadow-[0_0_6px_rgb(var(--dv-amethyst-rgb)/0.9)]" />}
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
      <span className="dv-cut bg-dv-ink-2 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] absolute inset-px [--dv-cut:13.6px]" />
      <span className="dv-cut absolute inset-px bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.4))] [--dv-cut:13.6px]" />
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
