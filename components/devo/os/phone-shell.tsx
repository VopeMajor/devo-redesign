'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { PULSE_CRITICAL_MS, pulseRemaining, pulseRing } from '@/lib/devo/pulse'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { formatClock, formatDuration, useMediaQuery, useNow } from '../hooks'
import { IconButton } from '../kit/button'
import { FrameCorners } from '../kit/frame'
import { SYSTEM_EMBLEMS } from '../kit/emblems'
import { FUTURE_SYSTEMS, type FutureSystemId } from '../kit/interior/locked'
import { MarbleSlab, StateSeal } from './shell-ui'
import { GlyphArrow, GlyphDiamond, GlyphHourglass, GlyphKeyhole, toRoman } from '../kit/glyphs'
import { SceneBackdrop } from '../kit/scene'
import { TimeDigits } from '../kit/time'
import { Divider, Kicker } from '../kit/typography'
import { SoundToggle } from '../shared/sound-toggle'
import { callName, useDevo } from '../state/devo-store'
import { DeadlyVoteSymbol } from '../system/symbol'
import { useDeadlyVotes } from '../system/use-deadly-votes'
import { formatVoteDate } from '@/lib/devo/deadly-votes'
import { AppBackContext, type AppBack } from './app-back'
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

/** Duração da entrada/saída de um app (ms). */
const ENTER_MS = 420
const EXIT_MS = 320

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
  // Durante a entrada a home continua por baixo (o app desliza da direita por cima dela).
  const [entering, setEntering] = useState(false)
  const [appBack, setAppBack] = useState<AppBack>(null)
  const backCtx = useMemo(() => ({ set: setAppBack }), [])
  // Avisos só depois que a home terminou de entrar.
  const [toastsReady, setToastsReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setToastsReady(true), 1400)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (current) {
      if (!shown) {
        // A home sai de baixo só quando a entrada do app termina (onEntered), não por relógio.
        setEntering(true)
        setShown(current)
        setLeaving(false)
        return
      }
      setShown(current)
      setLeaving(false)
    } else if (shown) {
      setEntering(false)
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

  /** Abre um app: entra da direita por cima da home e volta para a direita ao fechar. */
  const open = (id: AppId) => {
    playSfx('open')
    setShade(false)
    onOpen(id)
  }

  const goHome = () => {
    playSfx('close')
    onHome()
  }

  const app = shown ? getApp(shown) : null
  const totalUnread = Object.values(state.unread).reduce<number>((a, b) => a + (b ?? 0), 0)
  const toastHold = !toastsReady || shade
  const toastOpen = !toastHold && state.toasts.length > 0

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-dv-ink text-dv-text">
      {/* Uma cena só: viva na home; com um app aberto fica no quadro estático (o app pode ter a sua). */}
      <SceneBackdrop preset="cathedral" intensity={0.75} dim={current && !entering ? 0.55 : 0.3} staticOnly={!!current && !entering} />
      {/* Crítico: a home NÃO vira vermelha. Fica no mármore; a vinheta rubi pulsa nas bordas. */}
      {critical && <CriticalVignette />}

      <StatusBar now={now} remaining={remaining} critical={critical} unread={totalUnread} expanded={shade} onToggle={() => setShade((s) => !s)} />

      {/*
        Regra única de aviso do shell: um por vez, numa faixa que se abre LOGO ABAIXO da barra de status
        e empurra a tela para baixo (no fluxo, não por cima): nunca cobre conteúdo, herói, dock ou
        cabeçalho de app. Rubi só para aviso de perigo; confirmação é aço.
      */}
      <div
        className={cn(
          'relative z-20 grid shrink-0 transition-[grid-template-rows] ease-out',
          reduced ? 'duration-0' : 'duration-300',
          toastOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ToastStack onOpen={(id) => open(id)} compact inline max={1} hold={toastHold} className="px-3 pb-2 pt-2" />
        </div>
      </div>

      <div className="relative z-10 min-h-0 flex-1">
        {(!current || entering) && <HomeScreen remaining={remaining} critical={critical} onOpen={open} onShowNotices={() => setShade(true)} />}
        {app && (
          <AppBackContext.Provider value={backCtx}>
            <AppLayer
              key={app.id}
              app={app}
              leaving={leaving}
              reduced={reduced}
              back={appBack}
              onBack={goHome}
              onEntered={() => setEntering(false)}
              onExited={() => {
                setShown(null)
                setLeaving(false)
              }}
            />
          </AppBackContext.Provider>
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
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.94),rgba(10,10,12,0.72))]" />
      <span className="relative flex items-center justify-between gap-2 px-4" style={{ height: STATUS_H }}>
        <span className="dv-tabular w-[72px] font-mono text-[13px] text-dv-text-2">{formatClock(now)}</span>

        <span
          className={cn(
            'relative flex h-7 items-center gap-1.5 px-3',
            critical ? 'text-dv-blood-text' : 'text-dv-text',
          )}
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className={cn('dv-cut-hex absolute inset-0', critical ? 'animate-dv-alert bg-dv-blood/55' : 'bg-[linear-gradient(100deg,rgba(206,201,192,0.5),rgba(186,176,159,0.25)_50%,rgba(206,201,192,0.5))]')}
          />
          <span aria-hidden="true" className={cn('dv-cut-hex absolute inset-px', critical ? 'bg-[#1d0609]' : 'bg-[linear-gradient(180deg,#1f1f22,#111113)]')} style={{ '--dv-cut': '7.6px' } as CSSProperties} />
          <GlyphHourglass className={cn('relative size-3.5', critical && 'animate-dv-blink')} />
          <TimeDigits value={formatDuration(remaining)} size="sm" tone={critical ? 'blood' : 'text'} flip={false} blinkColon={critical} label="Tempo restante" className="relative text-[17px]" />
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
  onOpen: (id: AppId) => void
  onShowNotices: () => void
}) {
  const { state } = useDevo()
  const apps: AppId[] = state.arcadeUnlocked ? [...HOME_APPS, 'jogos'] : HOME_APPS
  const latest = state.notifications[0]
  return (
    <div className="absolute inset-0 flex flex-col">
    <div className="devo-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pt-3">
      <header className="animate-dv-fade flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <Kicker tone="gold">Record System · sessão ativa</Kicker>
          <p className="mt-1 truncate font-body text-[15px] italic text-dv-text-2">
            Bem-vindo de volta{callName(state) ? <>, <span className="not-italic text-dv-text">{callName(state)}</span></> : null}.
          </p>
        </div>
        <DeadlyVoteSymbol className="size-9 shrink-0 text-dv-gold/80" />
      </header>

      <div className="animate-dv-cut-in mt-3 [animation-delay:120ms]">
        <PulseCard remaining={remaining} critical={critical} onOpen={() => onOpen('pulso')} />
      </div>

      <section aria-label="Aplicativos" className="relative mt-5">
        {/* Véu atrás da grade: as cartas que flutuam na cena não passam atrás dos rótulos (< 15%). */}
        <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -bottom-4 -top-7 -z-10 bg-[linear-gradient(180deg,transparent,rgba(12,12,14,0.9)_16%,rgba(12,12,14,0.9)_84%,transparent)]" />
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

      <section aria-label="Agora" className="mt-5 flex flex-col gap-2">
        <div className="animate-dv-fade flex items-center gap-3 px-1 [animation-delay:360ms]">
          <span className="dv-label text-[10px] text-dv-text-3">Agora</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
        </div>
        <div className="animate-dv-rise [animation-delay:420ms]">
          <SummonsCard onOpen={() => onOpen('record')} />
        </div>
        {latest ? (
          <div className="animate-dv-rise [animation-delay:480ms]">
            <HomeStrip
              tone={latest.tone === 'danger' ? 'alert' : 'system'}
              kicker={`Último aviso · ${getApp(latest.appId).name}`}
              time={formatClock(latest.createdAt)}
              title={latest.title}
              body={latest.body}
              onClick={() => {
                playSfx('click')
                onShowNotices()
              }}
            />
          </div>
        ) : state.arcadeUnlocked ? (
          <div className="animate-dv-rise [animation-delay:480ms]">
            <HomeStrip
              tone="gold"
              kicker="Sala de Jogos · mesa aberta"
              title="Ganhe horas jogando"
              body="Memory Rush, Living Chess, Bomba Quente e Blefe."
              onClick={() => onOpen('jogos')}
              label="Ir para a Sala de Jogos"
            />
          </div>
        ) : null}
      </section>

      <LockedSystems />

      <div className="flex shrink-0 grow flex-col items-center justify-end gap-2 pb-3 pt-5 text-center">
        <Divider variant="filigree" tone="gold" className="animate-dv-fade w-56 opacity-60 [animation-delay:520ms]" />
        <p className="animate-dv-fade dv-label text-[10px] tracking-[0.42em] text-dv-text-3 [animation-delay:560ms]">O tempo é a vida</p>
      </div>

    </div>

      <nav aria-label="Dock" className="animate-dv-rise shrink-0 px-4 pb-2 [animation-delay:420ms]">
        <MarbleSlab edge="line" cut={14} innerClassName="px-2 pb-2 pt-3" className="drop-shadow-[0_-10px_24px_rgba(0,0,0,0.6)]">
          <ul className="grid grid-cols-3">
            {DOCK_APPS.map((id, i) => (
              <PhoneIcon key={id} id={id} onOpen={onOpen} unread={state.unread[id]} delay={480 + i * 60} />
            ))}
          </ul>
        </MarbleSlab>
      </nav>
    </div>
  )
}

/** Faixa chanfrada da home (último aviso, atalho). */
function HomeStrip({
  tone,
  kicker,
  time,
  title,
  body,
  onClick,
  label,
}: {
  tone: 'system' | 'alert' | 'gold'
  kicker: string
  time?: string
  title: string
  body?: string
  onClick: () => void
  label?: string
}) {
  const line = tone === 'alert' ? 'bg-dv-blood/60' : tone === 'gold' ? 'bg-dv-gold/50' : 'bg-dv-line-strong'
  const bar = tone === 'alert' ? 'bg-dv-blood' : tone === 'gold' ? 'bg-dv-gold' : 'bg-dv-text-2'
  const kick = tone === 'alert' ? 'text-dv-blood-text' : tone === 'gold' ? 'text-dv-gold' : 'text-dv-text-2'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="dv-focus group relative isolate flex min-h-14 w-full items-center gap-3 py-2.5 pl-4 pr-3 text-left transition-transform duration-[120ms] active:scale-[0.985]"
      style={{ '--dv-cut': '10px' } as CSSProperties}
    >
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', line)} />
      <span aria-hidden="true" className="dv-cut-diag bg-[#121214] bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] absolute inset-px -z-10" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(100deg,rgba(255,255,255,0.05),transparent_45%,rgba(0,0,0,0.3))] transition-colors group-hover:bg-white/[0.04]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
      <span aria-hidden="true" className={cn('absolute inset-y-2.5 left-0 w-[2px]', bar)} />
      <span className="min-w-0 flex-1">
        <span className="dv-label flex justify-between gap-2 text-[10px]">
          <span className={kick}>{kicker}</span>
          {time && <span className="dv-tabular text-dv-text-3">{time}</span>}
        </span>
        <span className="mt-1 block truncate font-display text-[14px] font-semibold tracking-[0.02em] text-dv-text">{title}</span>
        {body && <span className="block truncate font-body text-[14px] text-dv-text-2">{body}</span>}
      </span>
      <GlyphArrow className="size-4 shrink-0 text-dv-text-3 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/** Próxima convocação de Deadly Vote (lida do Record). Abre o Record. */
function SummonsCard({ onOpen }: { onOpen: () => void }) {
  const { entries, isLoading } = useDeadlyVotes()
  const next = entries.find((e) => e.status === 'em-progresso' || e.status === 'convocado')?.vote
  const live = next?.status === 'em-progresso'
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('open')
        onOpen()
      }}
      aria-label={next ? `Deadly Vote ${next.number}: ${next.title}. Abrir o Record` : 'Nenhuma convocação ativa. Abrir o Record'}
      className="dv-focus group block w-full text-left transition-transform duration-[120ms] active:scale-[0.985]"
    >
      <MarbleSlab edge={live ? 'blood' : 'line'} cut={12} innerClassName="flex items-center gap-3 py-3 pl-3 pr-3">
        <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center">
          <span className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_45%,var(--dv-gold))] [--dv-cut:12px]" />
          <span className="dv-cut absolute inset-px bg-dv-ink-2 [--dv-cut:11.6px]" />
          <span className="relative font-impact text-[20px] font-semibold leading-none text-dv-gold-bright dv-tabular">{next ? String(next.number).padStart(2, '0') : '—'}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="dv-label flex items-center gap-2 text-[10px]">
            <span className={live ? 'text-dv-blood-text' : 'text-dv-gold'}>{live ? 'Deadly Vote · em progresso' : 'Próxima convocação'}</span>
          </span>
          <span className="mt-1 block truncate font-display text-[15px] font-semibold uppercase tracking-[0.04em] text-dv-text">
            {next ? next.title : isLoading ? 'Consultando o Record…' : 'Nenhuma convocação ativa'}
          </span>
          <span className="block truncate font-body text-[14px] text-dv-text-2">
            {next ? `${formatVoteDate(next.startsAt)}${next.joined ? ' · você está inscrito' : ' · inscrições abertas'}` : 'O Dealer convoca pelo Record. Fique atento.'}
          </span>
        </span>
        {next && (next.joined ? <StateSeal>Inscrito</StateSeal> : live ? <StateSeal tone="blood" live>Ao vivo</StateSeal> : null)}
        <GlyphArrow className="size-4 shrink-0 text-dv-text-3 transition-transform group-hover:translate-x-0.5" />
      </MarbleSlab>
    </button>
  )
}

/** Cartão-herói "Tempo restante": tampo de mármore negro, dígitos de impacto e o mostrador de aço. */
function PulseCard({ remaining, critical, onOpen }: { remaining: number; critical: boolean; onOpen: () => void }) {
  const { state } = useDevo()
  const { excess } = pulseRing(remaining)
  const text = formatDuration(remaining)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Tempo restante ${text}. Abrir o relógio do pulso`}
      className="dv-focus group block w-full text-left transition-transform duration-[120ms] active:scale-[0.985]"
    >
      <MarbleSlab edge={critical ? 'blood' : 'steel'} cut={16} glow innerClassName="flex min-h-[196px] items-center gap-2 py-5 pl-5 pr-3">
        <FrameCorners tone={critical ? 'blood' : 'gold'} />
        {critical && (
          <span aria-hidden="true" className="dv-cut pointer-events-none absolute -inset-y-5 -left-5 -right-3 overflow-hidden [--dv-cut:15.6px]">
            <span className="animate-dv-alert absolute inset-0 bg-[radial-gradient(80%_80%_at_0%_100%,rgba(163,18,31,0.32),transparent_70%)]" />
            {/* faixa diagonal de alerta que corta o tampo (não o texto: passa por baixo dos dígitos) */}
            <span className="absolute -right-10 bottom-5 h-[14px] w-[62%] -rotate-[14deg] bg-[repeating-linear-gradient(-55deg,rgba(163,18,31,0.9)_0_7px,rgba(63,6,11,0.9)_7px_14px)] opacity-80 shadow-[0_0_14px_rgba(163,18,31,0.6)]" />
          </span>
        )}
        <span className="relative flex min-w-0 flex-1 flex-col">
          <Kicker tone={critical ? 'blood' : 'gold'}>Tempo restante</Kicker>
          <span className="mt-3 block">
            <TimeDigits value={text} size="lg" tone={critical ? 'blood' : 'text'} flip={false} blinkColon={critical} className="text-[40px] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]" />
          </span>
          <span aria-hidden="true" className="mt-1 grid w-fit grid-cols-[1.2em_0.34em_1.2em_0.34em_1.2em] text-[40px] leading-none">
            {['Horas', '', 'Min', '', 'Seg'].map((u, i) => (
              <span key={i} className={cn('dv-label text-center text-[10px] tracking-[0.14em]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>
                {u}
              </span>
            ))}
          </span>
          <span className="mt-4 flex flex-wrap items-center gap-2">
            {critical ? (
              <StateSeal tone="blood" live>
                Crítico
              </StateSeal>
            ) : (
              <StateSeal>Estável</StateSeal>
            )}
            {excess > 0 && <StateSeal tone="quiet">+72h</StateSeal>}
          </span>
        </span>
        <span aria-hidden="true" className="relative grid size-[136px] shrink-0 place-items-center">
          <PulseDial remaining={remaining} timerEndsAt={state.timerEndsAt} critical={critical} variant="compact" className="size-full" />
          <span className="dv-label absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-[10px] text-dv-text-3 transition-colors group-hover:text-dv-text-2">
            Abrir <GlyphArrow className="size-3" />
          </span>
        </span>
      </MarbleSlab>
    </button>
  )
}

/** Vinheta rubi pulsando nas bordas da home (estado crítico). O centro continua mármore negro. */
function CriticalVignette() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      <div className="animate-dv-alert absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_45%,transparent_58%,rgba(163,18,31,0.34)_88%,rgba(63,6,11,0.6)_100%)]" />
    </div>
  )
}

/**
 * Os seis sistemas reservados (Direção 2 §3) como emblemas trancados da mesma família: cinza a 60%
 * com cadeado. Informação, não botão.
 */
function LockedSystems() {
  return (
    <section aria-label="Sistemas em breve" className="mt-5">
      <div className="animate-dv-fade flex items-center gap-3 px-1 [animation-delay:520ms]">
        <span className="dv-label text-[10px] text-dv-text-3">Em breve</span>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
        <span className="dv-label text-[10px] text-dv-text-3">Trancado pelo Anfitrião</span>
      </div>
      <ul className="animate-dv-fade mt-3 grid grid-cols-6 gap-1 [animation-delay:560ms]">
        {FUTURE_SYSTEMS.map((f) => {
          const E = SYSTEM_EMBLEMS[f.id]
          return (
            <li key={f.id} className="flex flex-col items-center gap-1.5" title={f.name}>
              <span className="relative grid size-11 place-items-center">
                <E className="size-9 text-dv-text-3 opacity-60" />
                <GlyphKeyhole aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-dv-ink p-[1px] text-dv-gold" />
              </span>
              <span className="sr-only">{f.name}: bloqueado</span>
              <span aria-hidden="true" className="dv-label line-clamp-2 text-center text-[10px] leading-[1.25] tracking-[0.06em] text-dv-text-3">{SHORT_NAME[f.id]}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const SHORT_NAME: Record<FutureSystemId, string> = {
  torres: 'Torres',
  poco: 'Poço',
  virtudes: 'Virtudes',
  arcanos: 'Arcanos',
  corporacoes: 'Corpo­rações',
  mascaras: 'Máscaras',
}

function PhoneIcon({ id, onOpen, unread, delay = 0 }: { id: AppId; onOpen: (id: AppId) => void; unread?: number; delay?: number }) {
  const app = getApp(id)
  return (
    <li className="animate-dv-pop" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="dv-focus group flex w-full flex-col items-center gap-2 py-1 transition-transform duration-[120ms] ease-out active:scale-[0.92]"
        aria-label={app.name}
      >
        <span className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
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

/* ── Camada do app (entra da direita, sai para a direita) ─────────────────────────────────── */

const EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)'
const EASE_IN = 'cubic-bezier(0.6,0,0.9,0.4)'
/**
 * Filete de 3px colado à borda diagonal da folha (mesmo recorte da folha em cada instante): a linha de
 * aço que "corta" a tela. Some no fim da passagem.
 */
function edgeFrames(entering: boolean): Keyframe[] {
  const at = (p: number) => `polygon(0 0, 3px 0, calc(${(34 * (1 - p)).toFixed(2)}% + 3px) 100%, ${(34 * (1 - p)).toFixed(2)}% 100%)`
  const f: Keyframe[] = [
    { opacity: 1, clipPath: at(0), offset: 0 },
    { opacity: 1, clipPath: at(0.85), offset: 0.85 },
    { opacity: 0, clipPath: at(1), offset: 1 },
  ]
  return entering ? f : f.map((k) => ({ ...k, offset: 1 - (k.offset as number) })).reverse()
}
/** Recuo da borda de ataque na base (corte diagonal da folha do app). */
const DIAG = '34%'

function AppLayer({
  app,
  leaving,
  reduced,
  back,
  onBack,
  onEntered,
  onExited,
}: {
  app: AppDef
  leaving: boolean
  reduced: boolean
  back: AppBack
  onBack: () => void
  onEntered: () => void
  onExited: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const edge = useRef<HTMLSpanElement>(null)
  const exited = useRef(onExited)
  exited.current = onExited
  const entered = useRef(onEntered)
  entered.current = onEntered

  // Entrada: a folha do app corta a tela pela direita com a borda de ataque em diagonal (o canto de
  // cima vai na frente), e o filete de aço desliza junto na borda. Saída: o mesmo corte, de volta.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof el.animate !== 'function') {
      entered.current()
      return
    }
    const anim = el.animate(
      [
        { transform: 'translateX(100%)', clipPath: `polygon(0 0, 100% 0, 100% 100%, ${DIAG} 100%)` },
        { transform: 'translateX(0)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
      ],
      { duration: ENTER_MS, easing: EASE_OUT },
    )
    const line = edge.current?.animate(edgeFrames(true), { duration: ENTER_MS, easing: EASE_OUT, fill: 'forwards' })
    anim.onfinish = () => entered.current()
    return () => {
      anim.cancel()
      line?.cancel()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!leaving) return
    const el = ref.current
    if (!el || reduced || typeof el.animate !== 'function') {
      exited.current()
      return
    }
    const anim = el.animate(
      [
        { transform: 'translateX(0)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        { transform: 'translateX(100%)', clipPath: `polygon(0 0, 100% 0, 100% 100%, ${DIAG} 100%)` },
      ],
      { duration: EXIT_MS, easing: EASE_IN, fill: 'forwards' },
    )
    const line = edge.current?.animate(edgeFrames(false), { duration: EXIT_MS, easing: EASE_IN, fill: 'forwards' })
    anim.onfinish = () => exited.current()
    return () => {
      anim.cancel()
      line?.cancel()
    }
  }, [leaving]) // eslint-disable-line react-hooks/exhaustive-deps

  const index = toRoman(appIndex(app.id))
  return (
    <section
      ref={ref}
      aria-label={app.name}
      className={cn('absolute inset-0 z-20 flex flex-col overflow-hidden bg-dv-ink shadow-[-30px_0_50px_-20px_rgba(0,0,0,0.9)]', leaving && 'pointer-events-none')}
    >
      <header className="relative flex h-[60px] shrink-0 items-center gap-2.5 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink-2))] pl-1.5 pr-4">
        <IconButton label={back ? back.label : 'Voltar ao início'} variant="ghost" onClick={back ? back.run : onBack}>
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
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dv-gold/60 to-transparent" />
      </header>
      <div className="relative min-h-0 flex-1 pt-2">
        <app.Component />
      </div>
      {/* filete de aço na borda de ataque do corte diagonal (só aparece durante a passagem) */}
      <span ref={edge} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(180deg,#f4efe6,#bab09f_40%,#6b6357_75%,#ece5d8)] opacity-0" />
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
      <div aria-hidden="true" onClick={onClose} className="animate-dv-fade absolute inset-x-0 bottom-0 z-30 bg-black/75" style={{ top }} />
      <div ref={ref} className="absolute inset-x-0 z-40 flex max-h-[82%] flex-col" style={{ top }}>
        {/* folha de mármore negro com veio, filete de aço embaixo */}
        <span aria-hidden="true" className="bg-[#121214] bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] absolute inset-0" />
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25),transparent_30%,rgba(0,0,0,0.35))]" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dv-gold/70 to-transparent" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[3px] h-px bg-gradient-to-r from-transparent via-dv-gold/25 to-transparent" />

        {/* painel rápido: pulso + som */}
        <div className="relative px-3 pt-3">
          <MarbleSlab edge={critical ? 'blood' : 'steel'} cut={12} innerClassName="flex items-center gap-3 py-2.5 pl-4 pr-2">
            <GlyphHourglass className={cn('size-5 shrink-0', critical ? 'text-dv-blood-text' : 'text-dv-gold')} />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Pulso</p>
              <TimeDigits value={formatDuration(remaining)} size="md" tone={critical ? 'blood' : 'text'} flip={false} label="Tempo restante" className="mt-0.5" />
            </div>
            {critical ? (
              <StateSeal tone="blood" live>
                Crítico
              </StateSeal>
            ) : (
              <StateSeal>Estável</StateSeal>
            )}
            <SoundToggle compact className="min-h-11 min-w-11 justify-center text-dv-gold/80 hover:text-dv-gold-bright" />
          </MarbleSlab>
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
