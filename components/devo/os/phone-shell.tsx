'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { PULSE_CRITICAL_MS, pulseRemaining, pulseRing } from '@/lib/devo/pulse'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock, formatDuration, useMediaQuery, useNow } from '../hooks'
import { Badge as KitBadge } from '../kit/badge'
import { IconButton } from '../kit/button'
import { Frame } from '../kit/frame'
import { GlyphArrow, GlyphDiamond, GlyphHourglass, toRoman } from '../kit/glyphs'
import { SceneBackdrop } from '../kit/scene'
import { TimeDigits } from '../kit/time'
import { Divider, Kicker } from '../kit/typography'
import { SoundToggle } from '../shared/sound-toggle'
import { useDevo } from '../state/devo-store'
import { DeadlyVoteSymbol } from '../system/symbol'
import { useBackHandler } from '../use-back-handler'
import { appIndex, getApp, type AppDef } from './apps'
import { AppGlyphTile, Badge } from './app-icon'
import { NotificationList, ToastStack } from './notifications'
import { PulseDial } from './pulse-dial'

/** Apps da grade e do dock são listas distintas para não repetir ícones. */
const HOME_APPS: AppId[] = ['record', 'pulso', 'cartas']
const DOCK_APPS: AppId[] = ['mensagens', 'trocas', 'ajustes']

/** Altura da barra de status (sem a área segura). */
const STATUS_H = 44

type Origin = { x: number; y: number } | null

export function PhoneShell({ current, onOpen, onHome }: { current: AppId | null; onOpen: (id: AppId) => void; onHome: () => void }) {
  const { state, dispatch } = useDevo()
  const [shade, setShade] = useState(false)
  const now = useNow(1000)
  const remaining = pulseRemaining(state.timerEndsAt, now)
  const critical = remaining < PULSE_CRITICAL_MS
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Camada do app: continua montada durante a animação de saída.
  const [shown, setShown] = useState<AppId | null>(current)
  const [leaving, setLeaving] = useState(false)
  const origin = useRef<Origin>(null)

  useEffect(() => {
    if (current) {
      setShown(current)
      setLeaving(false)
    } else if (shown) {
      setLeaving(true)
    }
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

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

  /** Abre um app. `from` = retângulo do ícone tocado (o app "cresce" dele); sem ele, entra da direita. */
  const open = (id: AppId, from?: DOMRect) => {
    playSfx('open')
    setShade(false)
    origin.current = from ? { x: from.left + from.width / 2, y: from.top + from.height / 2 } : null
    onOpen(id)
  }

  const goHome = () => {
    playSfx('close')
    onHome()
  }

  const app = shown ? getApp(shown) : null
  const totalUnread = Object.values(state.unread).reduce<number>((a, b) => a + (b ?? 0), 0)

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-dv-ink text-dv-text">
      {/* Uma cena só: viva na home; com um app aberto fica no quadro estático (o app pode ter a sua). */}
      <SceneBackdrop preset="cathedral" intensity={0.75} dim={current ? 0.55 : 0.3} alert={critical} staticOnly={!!current} />

      <StatusBar now={now} remaining={remaining} critical={critical} unread={totalUnread} expanded={shade} onToggle={() => setShade((s) => !s)} />

      <div className="relative z-10 min-h-0 flex-1">
        {!current && <HomeScreen remaining={remaining} critical={critical} onOpen={open} onShowNotices={() => setShade(true)} />}
        {app && (
          <AppLayer
            key={app.id}
            app={app}
            origin={origin.current}
            leaving={leaving}
            reduced={reduced}
            onBack={goHome}
            onExited={() => {
              setShown(null)
              setLeaving(false)
            }}
          />
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
          className="dv-focus group flex h-7 w-40 items-center justify-center"
        >
          <span aria-hidden="true" className="relative h-[3px] w-32 bg-dv-text/55 transition-colors group-hover:bg-dv-text">
            <GlyphDiamond filled className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 text-dv-gold" />
          </span>
        </button>
      </div>

      {shade && <Shade remaining={remaining} critical={critical} reduced={reduced} onClose={() => setShade(false)} onOpen={open} />}

      <ToastStack onOpen={(id) => open(id)} className={cn('inset-x-3 top-[calc(env(safe-area-inset-top)+52px)]', shade && 'hidden')} />
    </div>
  )
}

/* ── Barra de status ─────────────────────────────────────────────────────────────────────── */

function StatusBar({
  now,
  remaining,
  critical,
  unread,
  expanded,
  onToggle,
}: {
  now: number
  remaining: number
  critical: boolean
  unread: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('click')
        onToggle()
      }}
      aria-expanded={expanded}
      aria-label="Abrir central de avisos"
      className="dv-focus relative z-30 w-full shrink-0 pt-[env(safe-area-inset-top)] text-left"
    >
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.92),rgba(5,7,13,0.55))] backdrop-blur-[2px]" />
      <span className="relative flex items-center justify-between gap-2 px-4" style={{ height: STATUS_H }}>
        <span className="dv-tabular w-[72px] font-mono text-[13px] text-dv-text-2">{formatClock(now)}</span>

        <span
          className={cn(
            'relative flex h-7 items-center gap-1.5 px-3',
            critical ? 'text-dv-blood-text' : 'text-dv-cobalt-text',
          )}
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className={cn('dv-cut-hex absolute inset-0', critical ? 'animate-dv-alert bg-dv-blood/35' : 'bg-dv-cobalt-dim/80')}
          />
          <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-px', critical ? 'bg-[#1d0609]' : 'bg-dv-ink-2/90')} style={{ '--dv-cut': '7.6px' } as CSSProperties} />
          <GlyphHourglass className={cn('relative size-3.5', critical && 'animate-dv-blink')} />
          <TimeDigits value={formatDuration(remaining)} size="sm" tone={critical ? 'blood' : 'cobalt'} flip={false} blinkColon={critical} label="Tempo restante" className="relative text-[17px]" />
        </span>

        <span className="flex w-[72px] items-center justify-end gap-1.5 text-dv-text-2" aria-hidden="true">
          <SignalGlyph className="size-3.5" />
          <span className="dv-label text-[10px] tracking-[0.16em]">Devo</span>
          <span className="relative">
            <BatteryGlyph className="size-4" />
            {unread > 0 && <span className="absolute -right-1 -top-1 size-2 rounded-full border border-dv-ink bg-dv-blood" />}
          </span>
        </span>
      </span>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px">
        <span className={cn('absolute inset-0', critical ? 'animate-dv-alert bg-dv-blood' : 'bg-gradient-to-r from-transparent via-dv-gold/45 to-transparent')} />
      </span>
    </button>
  )
}

function SignalGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M1 12h2v2H1zM5 9h2v5H5zM9 6h2v8H9z" />
      <path d="M13 2h2v12h-2z" opacity="0.4" />
    </svg>
  )
}

function BatteryGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M2.5 4.5h12.5l1 1v5l-1 1H2.5l-1-1v-5z" />
      <path d="M17.6 6.6v2.8" strokeLinecap="round" />
      <path d="M3.5 6.5h7v3h-7z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ── Home ────────────────────────────────────────────────────────────────────────────────── */

function HomeScreen({
  remaining,
  critical,
  onOpen,
  onShowNotices,
}: {
  remaining: number
  critical: boolean
  onOpen: (id: AppId, from?: DOMRect) => void
  onShowNotices: () => void
}) {
  const { state } = useDevo()
  const apps: AppId[] = state.arcadeUnlocked ? [...HOME_APPS, 'jogos'] : HOME_APPS
  const latest = state.notifications[0]
  return (
    <div className="devo-scroll absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden px-4 pb-2 pt-3">
      <header className="animate-dv-fade flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <Kicker tone="gold">Record System · sessão ativa</Kicker>
          <p className="mt-1 truncate font-body text-[15px] italic text-dv-text-2">
            Bem-vindo de volta{state.playerName ? <>, <span className="not-italic text-dv-text">{state.playerName}</span></> : null}.
          </p>
        </div>
        <DeadlyVoteSymbol className="size-9 shrink-0 text-dv-gold/80" />
      </header>

      <div className="animate-dv-cut-in mt-3 [animation-delay:120ms]">
        <PulseCard remaining={remaining} critical={critical} onOpen={(from) => onOpen('pulso', from)} />
      </div>

      <section aria-label="Aplicativos" className="mt-5">
        <div className="animate-dv-fade flex items-center gap-3 px-1 [animation-delay:220ms]">
          <span className="dv-label text-[10px] text-dv-text-3">Aplicativos</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
        </div>
        <ul className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
          {apps.map((id, i) => (
            <PhoneIcon key={id} id={id} onOpen={onOpen} unread={state.unread[id]} delay={260 + i * 60} />
          ))}
        </ul>
      </section>

      {latest && (
        <button
          type="button"
          onClick={() => {
            playSfx('click')
            onShowNotices()
          }}
          className="dv-focus animate-dv-rise group relative isolate mt-5 flex w-full items-center gap-3 py-2.5 pl-4 pr-3 text-left [animation-delay:480ms]"
          style={{ '--dv-cut': '10px' } as CSSProperties}
        >
          <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', latest.tone === 'danger' ? 'bg-dv-blood/55' : 'bg-dv-line-strong/70')} />
          <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[color-mix(in_oklab,var(--dv-ink-2)_82%,transparent)] backdrop-blur-sm group-hover:bg-dv-ink-3" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
          <span aria-hidden="true" className={cn('absolute inset-y-2.5 left-0 w-[2px]', latest.tone === 'danger' ? 'bg-dv-blood' : 'bg-dv-cobalt')} />
          <span className="min-w-0 flex-1">
            <span className="dv-label flex justify-between gap-2 text-[10px]">
              <span className="text-dv-cobalt-text">Último aviso · {getApp(latest.appId).name}</span>
              <span className="dv-tabular text-dv-text-3">{formatClock(latest.createdAt)}</span>
            </span>
            <span className="mt-1 block truncate font-display text-[14px] font-semibold tracking-[0.02em] text-dv-text">{latest.title}</span>
            <span className="block truncate font-body text-[14px] text-dv-text-2">{latest.body}</span>
          </span>
          <GlyphArrow className="size-4 shrink-0 text-dv-text-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <div className="flex min-h-6 flex-1 flex-col items-center justify-end gap-2 pb-4 pt-6 text-center">
        <Divider variant="filigree" tone="gold" className="animate-dv-fade w-56 opacity-60 [animation-delay:520ms]" />
        <p className="animate-dv-fade dv-label text-[10px] tracking-[0.42em] text-dv-text-3 [animation-delay:560ms]">O tempo é a vida</p>
      </div>

      <nav aria-label="Dock" className="animate-dv-rise shrink-0 [animation-delay:420ms]">
        <Frame variant="glass" cutSize={14} pad="none" innerClassName="px-2 pb-2 pt-3">
          <ul className="grid grid-cols-3">
            {DOCK_APPS.map((id, i) => (
              <PhoneIcon key={id} id={id} onOpen={onOpen} unread={state.unread[id]} delay={480 + i * 60} />
            ))}
          </ul>
        </Frame>
      </nav>
    </div>
  )
}

/** Cartão-herói "Tempo restante": mostrador de astrolábio à direita, dígitos de impacto à esquerda. */
function PulseCard({ remaining, critical, onOpen }: { remaining: number; critical: boolean; onOpen: (from: DOMRect) => void }) {
  const { state } = useDevo()
  const { excess } = pulseRing(remaining)
  const text = formatDuration(remaining)
  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      aria-label={`Tempo restante ${text}. Abrir o relógio do pulso`}
      className="dv-focus group block w-full text-left transition-transform duration-[120ms] active:scale-[0.985]"
    >
      <Frame variant="glass" tone={critical ? 'blood' : 'gold'} ornate glow cutSize={16} pad="none" innerClassName="min-h-[212px]">
        {/* mostrador recortado pela moldura */}
        <span aria-hidden="true" className="dv-cut pointer-events-none absolute inset-px overflow-hidden" style={{ '--dv-cut': '15.6px' } as CSSProperties}>
          <PulseDial
            remaining={remaining}
            timerEndsAt={state.timerEndsAt}
            critical={critical}
            variant="compact"
            className="absolute -right-[58px] top-1/2 size-[214px] -translate-y-1/2 opacity-95"
          />
          <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,15,28,0.94)_0%,rgba(10,15,28,0.78)_46%,transparent_72%)]" />
          {critical && <span className="animate-dv-alert absolute inset-0 bg-[radial-gradient(80%_80%_at_0%_100%,rgba(213,31,43,0.28),transparent_70%)]" />}
        </span>

        <span className="relative flex min-h-[212px] flex-col justify-between p-5 pr-3">
          <span className="block">
            <Kicker tone={critical ? 'blood' : 'gold'}>Tempo restante</Kicker>
            <span className="mt-3 block">
              <TimeDigits value={text} size="lg" tone={critical ? 'blood' : 'text'} blinkColon={critical} className="[text-shadow:0_2px_18px_rgba(5,7,13,0.9)]" />
            </span>
            <span aria-hidden="true" className="mt-1 grid w-fit grid-cols-[1.2em_0.34em_1.2em_0.34em_1.2em] text-[44px] leading-none">
              {['Horas', '', 'Min', '', 'Seg'].map((u, i) => (
                <span key={i} className={cn('dv-label text-center text-[10px] tracking-[0.16em]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>
                  {u}
                </span>
              ))}
            </span>
          </span>
          <span className="mt-4 flex flex-wrap items-center gap-2">
            {critical ? (
              <KitBadge tone="blood" live>
                Crítico
              </KitBadge>
            ) : (
              <KitBadge tone="cobalt" dot>
                Estável
              </KitBadge>
            )}
            {excess > 0 && <KitBadge tone="gold">Acima de 72h</KitBadge>}
            <span className="dv-label flex items-center gap-1 text-[10px] text-dv-text-3 transition-colors group-hover:text-dv-text-2">
              Abrir pulso <GlyphArrow className="size-3.5" />
            </span>
          </span>
        </span>
      </Frame>
    </button>
  )
}

function PhoneIcon({ id, onOpen, unread, delay = 0 }: { id: AppId; onOpen: (id: AppId, from?: DOMRect) => void; unread?: number; delay?: number }) {
  const app = getApp(id)
  return (
    <li className="animate-dv-pop" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={(e) => onOpen(id, e.currentTarget.querySelector('[data-tile]')?.getBoundingClientRect())}
        className="dv-focus group flex w-full flex-col items-center gap-2 rounded-none py-1 transition-transform duration-[120ms] ease-out active:scale-[0.92]"
        aria-label={app.name}
      >
        <span data-tile className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
          <AppGlyphTile app={app} />
          <Badge count={unread} />
        </span>
        <span aria-hidden="true" className="line-clamp-2 min-h-[2.4em] px-0.5 text-center font-display text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-dv-text [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
          {app.name}
        </span>
      </button>
    </li>
  )
}

/* ── Camada do app (abre do ícone, volta para ele) ─────────────────────────────────────────── */

const EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)'
const EASE_IN = 'cubic-bezier(0.6,0,0.9,0.4)'

function AppLayer({
  app,
  origin,
  leaving,
  reduced,
  onBack,
  onExited,
}: {
  app: AppDef
  origin: Origin
  leaving: boolean
  reduced: boolean
  onBack: () => void
  onExited: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const exited = useRef(onExited)
  exited.current = onExited

  const frames = (el: HTMLElement): Keyframe[] => {
    if (origin) {
      const r = el.getBoundingClientRect()
      el.style.transformOrigin = `${origin.x - r.left}px ${origin.y - r.top}px`
      return [
        { transform: 'scale(0.14)', opacity: 0, filter: 'brightness(1.9)' },
        { transform: 'scale(0.7)', opacity: 1, offset: 0.45 },
        { transform: 'none', opacity: 1, filter: 'brightness(1)' },
      ]
    }
    el.style.transformOrigin = '100% 50%'
    return [
      { transform: 'translateX(44px) skewX(-5deg)', opacity: 0 },
      { transform: 'none', opacity: 1 },
    ]
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof el.animate !== 'function') return
    const anim = el.animate(frames(el), { duration: 460, easing: EASE_OUT })
    return () => anim.cancel()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!leaving) return
    const el = ref.current
    if (!el || reduced || typeof el.animate !== 'function') {
      exited.current()
      return
    }
    const anim = el.animate([...frames(el)].reverse().map((f) => (typeof f.offset === 'number' ? { ...f, offset: 1 - f.offset } : f)), {
      duration: 280,
      easing: EASE_IN,
      fill: 'forwards',
    })
    anim.onfinish = () => exited.current()
    return () => anim.cancel()
  }, [leaving]) // eslint-disable-line react-hooks/exhaustive-deps

  const index = toRoman(appIndex(app.id))
  return (
    <section
      ref={ref}
      aria-label={app.name}
      className={cn('absolute inset-0 z-20 flex flex-col overflow-hidden bg-dv-ink/80', leaving && 'pointer-events-none')}
    >
      <header className="relative flex h-[60px] shrink-0 items-center gap-2.5 bg-[linear-gradient(180deg,rgba(17,26,46,0.92),rgba(10,15,28,0.88))] pl-1.5 pr-4 backdrop-blur-md">
        <IconButton label="Voltar ao início" variant="ghost" onClick={onBack}>
          <GlyphArrow className="rotate-180" />
        </IconButton>
        <AppGlyphTile app={app} size="sm" />
        <div className="min-w-0 flex-1 animate-dv-cut-in [animation-delay:120ms]">
          <p className="dv-label truncate text-[10px] tracking-[0.18em] text-dv-text-3">{app.subtitle}</p>
          <h1 className="mt-1 truncate font-display text-[19px] font-semibold uppercase leading-none tracking-[0.08em] text-dv-text">{app.name}</h1>
        </div>
        <span aria-hidden="true" className="font-impact -skew-x-[8deg] text-[30px] font-semibold leading-none text-transparent [-webkit-text-stroke:1px_var(--dv-gold)]">
          {index}
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px">
          <span className="absolute inset-0 bg-gradient-to-r from-dv-gold/70 via-dv-gold/25 to-transparent" />
          <span className="absolute -top-[3px] left-0 h-[7px] w-px bg-dv-gold" />
          <span className="absolute -top-[1px] left-[18%] h-[3px] w-7 bg-dv-cobalt" />
        </span>
      </header>
      <div className="relative min-h-0 flex-1">
        <app.Component />
      </div>
    </section>
  )
}

/* ── Central de avisos (desce da barra de status) ─────────────────────────────────────────── */

function Shade({
  remaining,
  critical,
  reduced,
  onClose,
  onOpen,
}: {
  remaining: number
  critical: boolean
  reduced: boolean
  onClose: () => void
  onOpen: (id: AppId) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof el.animate !== 'function') return
    const anim = el.animate(
      [
        { transform: 'translateY(-18px)', opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { transform: 'none', opacity: 1, clipPath: 'inset(0 0 0% 0)' },
      ],
      { duration: 420, easing: EASE_OUT },
    )
    return () => anim.cancel()
  }, [reduced])

  const top = `calc(env(safe-area-inset-top) + ${STATUS_H}px)`
  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="animate-dv-fade absolute inset-x-0 bottom-0 z-30 bg-dv-ink/70 backdrop-blur-[2px]" style={{ top }} />
      <div ref={ref} className="absolute inset-x-0 z-40 flex max-h-[82%] flex-col" style={{ top }}>
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,28,0.97),rgba(5,7,13,0.97))] backdrop-blur-xl" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dv-gold/60 to-transparent" />

        {/* painel rápido: pulso + som */}
        <div className="relative px-3 pt-3">
          <Frame tone={critical ? 'blood' : 'cobalt'} cutSize={12} pad="none" innerClassName="flex items-center gap-3 py-2.5 pl-4 pr-2">
            <GlyphHourglass className={cn('size-5 shrink-0', critical ? 'text-dv-blood-text' : 'text-dv-gold')} />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Pulso</p>
              <TimeDigits value={formatDuration(remaining)} size="md" tone={critical ? 'blood' : 'cobalt'} flip={false} label="Tempo restante" className="mt-0.5" />
            </div>
            {critical ? (
              <KitBadge tone="blood" live>
                Crítico
              </KitBadge>
            ) : (
              <KitBadge tone="cobalt" dot>
                Estável
              </KitBadge>
            )}
            <SoundToggle compact className="min-h-11 min-w-11 justify-center text-dv-gold/80 hover:text-dv-gold-bright" />
          </Frame>
        </div>

        <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
          <NotificationList onOpen={onOpen} />
        </div>

        <button type="button" onClick={onClose} className="dv-focus group relative flex h-11 shrink-0 items-center justify-center" aria-label="Fechar central de avisos">
          <span aria-hidden="true" className="h-[3px] w-12 bg-dv-text/40 transition-colors group-hover:bg-dv-text" />
        </button>
      </div>
    </>
  )
}
