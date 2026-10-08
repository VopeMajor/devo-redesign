'use client'

import { BatteryMedium, ChevronDown, ChevronLeft, Signal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock, formatDuration, useNow } from '../hooks'
import { Sparkle } from '../ornaments'
import { CathedralBackdrop, Embers } from '../shared/atmosphere'
import { useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { getApp } from './apps'
import { AppGlyphTile, Badge } from './app-icon'
import { NotificationList, ToastStack } from './notifications'

/** Apps da grade e do dock são listas distintas para não repetir ícones. */
const HOME_APPS: AppId[] = ['record', 'pulso', 'cartas']
const DOCK_APPS: AppId[] = ['mensagens', 'trocas', 'ajustes']

export function PhoneShell({ current, onOpen, onHome }: { current: AppId | null; onOpen: (id: AppId) => void; onHome: () => void }) {
  const { state, dispatch } = useDevo()
  const [shade, setShade] = useState(false)
  const now = useNow(1000)
  const remaining = state.timerEndsAt - now

  useEffect(() => {
    if (current) dispatch({ type: 'READ_APP', appId: current })
  }, [current, state.unread[current ?? 'pulso'], dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current) dispatch({ type: 'SEE_APP', appId: current })
  }, [current, dispatch])

  useBackHandler(!!current, () => {
    playSfx('close')
    onHome()
  })
  useBackHandler(shade, () => setShade(false))

  const open = (id: AppId) => {
    playSfx('open')
    setShade(false)
    onOpen(id)
  }

  const app = current ? getApp(current) : null

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <CathedralBackdrop dim={0.78} />
      <Embers className="opacity-50" />

      <button
        type="button"
        onClick={() => {
          playSfx('click')
          setShade((s) => !s)
        }}
        aria-expanded={shade}
        aria-label="Abrir central de avisos"
        className="relative z-30 flex h-9 shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)] text-[13px]"
      >
        <span className="font-mono tabular-nums text-foreground">{formatClock(now)}</span>
        <span className="flex items-center gap-1.5 font-mono tabular-nums text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-blink" aria-hidden="true" />
          {formatDuration(remaining)}
        </span>
        <span className="flex items-center gap-1.5 text-foreground/80" aria-hidden="true">
          <Signal className="size-3.5" />
          <span className="text-[10px] uppercase tracking-[0.15em]">DEVO</span>
          <BatteryMedium className="size-4" />
        </span>
      </button>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {app ? (
          <section key={app.id} className="flex min-h-0 flex-1 flex-col bg-background/90 animate-pop" aria-label={app.name}>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-foreground/15 px-3">
              <button
                type="button"
                onClick={() => {
                  playSfx('close')
                  onHome()
                }}
                className="grid size-9 place-items-center text-foreground/70 hover:text-foreground"
                aria-label="Voltar ao início"
              >
                <ChevronLeft className="size-5" />
              </button>
              <app.icon className="size-4 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h1 className="text-[13px] uppercase tracking-[0.3em]">{app.name}</h1>
            </header>
            <div className="min-h-0 flex-1">
              <app.Component />
            </div>
          </section>
        ) : (
          <HomeScreen remaining={remaining} onOpen={open} />
        )}
      </div>

      <div className="relative z-20 flex h-7 shrink-0 items-center justify-center pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => {
            if (current) playSfx('close')
            onHome()
          }}
          aria-label="Início"
          className="h-1.5 w-32 rounded-full bg-foreground/60 transition-colors hover:bg-foreground"
        />
      </div>

      {shade && (
        <div className="absolute inset-x-0 top-0 z-40 flex h-[75%] flex-col border-b border-foreground/20 bg-card/97 backdrop-blur-xl animate-pop">
          <div className="h-9 shrink-0" />
          <div className="min-h-0 flex-1">
            <NotificationList onOpen={open} />
          </div>
          <button type="button" onClick={() => setShade(false)} className="flex h-10 shrink-0 items-center justify-center text-foreground/60" aria-label="Fechar central de avisos">
            <ChevronDown className="size-5 rotate-180" />
          </button>
        </div>
      )}

      <ToastStack onOpen={open} className={cn('inset-x-3 top-11', shade && 'hidden')} />
    </div>
  )
}

function HomeScreen({ remaining, onOpen }: { remaining: number; onOpen: (id: AppId) => void }) {
  const { state } = useDevo()
  return (
    <div className="flex flex-1 flex-col px-5 pb-3 pt-4">
      <button
        type="button"
        onClick={() => onOpen('pulso')}
        className="relative overflow-hidden border border-foreground/20 bg-card/70 p-5 text-left backdrop-blur-sm animate-rise"
      >
        <span aria-hidden="true" className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
        <span className="relative flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          <Sparkle className="size-2 text-primary" />
          Tempo restante
        </span>
        <span className="relative mt-2 block font-mono text-4xl tabular-nums text-foreground">{formatDuration(remaining)}</span>
        <span className="relative mt-3 flex items-center justify-between text-xs text-foreground/60">
          <span>{state.inventory.length} cartas</span>
          <span>{state.tradesCompleted} trocas</span>
          <span className="text-primary">Pulso ativo</span>
        </span>
      </button>

      <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-5">
        {HOME_APPS.map((id) => (
          <PhoneIcon key={id} id={id} onOpen={onOpen} unread={state.unread[id]} />
        ))}
        {state.arcadeUnlocked && (
          <PhoneIcon id="jogos" onOpen={onOpen} unread={state.unread.jogos} className="animate-[devo-pop_0.7s_ease-out_both]" />
        )}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-1 pb-4 text-center">
        <p className="font-serif uppercase tracking-[0.08em] text-5xl text-foreground/15">Devo</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">O tempo é a vida</p>
      </div>

      <nav aria-label="Dock" className="border border-foreground/15 bg-background/70 px-4 py-3 backdrop-blur-md">
        <ul className="flex justify-around">
          {DOCK_APPS.map((id) => (
            <PhoneIcon key={id} id={id} onOpen={onOpen} unread={state.unread[id]} hideLabel />
          ))}
        </ul>
      </nav>
    </div>
  )
}

function PhoneIcon({
  id,
  onOpen,
  unread,
  hideLabel,
  className,
}: {
  id: AppId
  onOpen: (id: AppId) => void
  unread?: number
  hideLabel?: boolean
  className?: string
}) {
  const app = getApp(id)
  return (
    <li className={className}>
      <button type="button" onClick={() => onOpen(id)} className="flex w-full flex-col items-center gap-1.5 active:scale-95 transition-transform" aria-label={app.name}>
        <span className="relative">
          <AppGlyphTile app={app} />
          <Badge count={unread} />
        </span>
        {!hideLabel && <span className="text-center text-xs leading-tight text-foreground/85">{app.name}</span>}
      </button>
    </li>
  )
}
