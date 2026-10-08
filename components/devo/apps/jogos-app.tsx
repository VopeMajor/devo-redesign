'use client'

import { Clock, Coins, Crown, Dices, Hourglass, Lock, Radio, Swords, Timer, Trophy, Users } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { type ArcadeView, BET_OPTIONS, BET_RESERVE_MIN, SP_TZ, formatMinutes, registerEvent, useApplyTime } from '@/components/devo/arcade/arcade-shared'
import { JavaliIntro } from '@/components/devo/arcade/javali-intro'
import { Mesa, useBetSheet } from '@/components/devo/arcade/mesa'
import { LiveMatchProvider } from '@/components/devo/arcade/live-match'
import { MiniProfileHost } from '@/components/devo/arcade/mini-profile'
import { liveChannelFor } from '@/lib/devo/arcade/reactions'
import { playSfx, setArcadeAmbienceMuffled, startArcadeAmbience, stopArcadeAmbience } from '@/lib/devo/audio'
import {
  type BetBoard,
  type Dashboard,
  type EventDetail,
  type GameOutcome,
  type MatchFinish,
  type MatchStart,
  type RoomPoll,
  arcadeFetcher,
  arcadeKey,
  arcadePost,
  formatCountdown,
  formatPoints,
  joinDuel,
  leaveRoom,
  pollRoom,
  queueCasual,
  roomToStart,
  startTutorial,
} from '@/lib/devo/arcade/client'
import { GAMES, type GameId, PATENTES, patenteIndex, RANKING_RULE_CASUAL, RANKING_RULE_EVENT, rankReward } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { GAME_COMPONENTS } from '../arcade/game-loader'
import { useNow } from '../hooks'
import { useDevo } from '../state/devo-store'

type Tab = ArcadeView
const TABS: { id: Tab; label: string; icon: typeof Dices }[] = [
  { id: 'mesa', label: 'Mesa', icon: Dices },
  { id: 'agenda', label: 'Agenda', icon: Timer },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'apostas', label: 'Apostas', icon: Coins },
]

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'Em breve',
  REGISTRATION: 'Inscrições abertas',
  LOCKED: 'Apostas abertas',
  LIVE: 'Ao vivo',
  FINISHED: 'Encerrada',
}

type Running = { start: MatchStart; finish?: MatchFinish & { outcome: GameOutcome }; error?: string }

export function JogosApp() {
  const [tab, setTab] = useState<Tab>('mesa')
  const [rankView, setRankView] = useState<RankView>('geral')
  const [running, setRunning] = useState<Running | null>(null)
  const [busy, setBusy] = useState(false)
  const { state } = useDevo()
  const applyTime = useApplyTime()
  useArcadeAmbience(!!running && !running.finish)
  const { data, error, mutate } = useSWR<Dashboard>(arcadeKey('dashboard'), arcadeFetcher, {
    refreshInterval: 30_000,
    onSuccess: (d) => applyTime(d),
  })

  const launch = async (fn: () => Promise<MatchStart>) => {
    if (busy) return
    setBusy(true)
    try {
      const start = await fn()
      playSfx('whoosh')
      setRunning({ start })
    } catch (e) {
      window.alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const [queue, setQueue] = useState<{ roomId: string; gameId: GameId; duel: boolean } | null>(null)
  useSWR<RoomPoll>(queue ? ['arcade-queue', queue.roomId] : null, () => pollRoom(queue!.roomId), {
    refreshInterval: 1500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
    onSuccess: (r) => {
      if (r.status === 'active') {
        setQueue(null)
        playSfx('whoosh')
        setRunning({ start: roomToStart(r) })
      } else if (r.status === 'cancelled' || r.status === 'finished') setQueue(null)
    },
    onError: () => setQueue(null),
  })

  const enterRoom = async (fn: () => Promise<RoomPoll>, duel: boolean) => {
    if (busy || queue) return
    setBusy(true)
    try {
      const r = await fn()
      if (r.status === 'active') {
        playSfx('whoosh')
        setRunning({ start: roomToStart(r) })
      } else if (r.status === 'waiting' || duel) setQueue({ roomId: r.id, gameId: r.gameId, duel })
    } catch (e) {
      window.alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const cancelQueue = () => {
    if (!queue) return
    leaveRoom(queue.roomId).catch(() => {})
    setQueue(null)
  }

  const quit = () => {
    const roomId = running?.start.roomId
    if (roomId && !running?.finish) leaveRoom(roomId).catch(() => {})
    setRunning(null)
    mutate()
  }

  const finish = async (outcome: GameOutcome) => {
    if (!running) return
    if (outcome.finish) {
      applyTime(outcome.finish)
      playSfx(outcome.result === 'win' ? 'confirm' : 'send')
      setRunning({ start: running.start, finish: { ...outcome.finish, outcome } })
      mutate()
      return
    }
    try {
      const res = await arcadePost<MatchFinish>({
        action: 'finish',
        matchId: running.start.matchId,
        result: outcome.result,
        score: outcome.score,
        stats: outcome.stats,
      })
      applyTime(res)
      playSfx(outcome.result === 'win' ? 'confirm' : 'send')
      setRunning({ start: running.start, finish: { ...res, outcome } })
    } catch (e) {
      setRunning({ ...running, error: (e as Error).message })
    }
    mutate()
  }

  return (
    <MiniProfileHost>
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#06070b] text-foreground">
      <ArcadeBackdrop />
      <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-3 border-b border-[#6f8cff]/15 bg-[#06070b]/70 px-3 backdrop-blur-sm">
      <nav className="flex gap-1 overflow-x-auto" aria-label="Seções da Sala de Jogos">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              playSfx('click')
            }}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.25em] transition-colors',
              tab === t.id ? 'border-[#6f8cff] text-[#6f8cff]' : 'border-transparent text-foreground/50 hover:text-foreground',
            )}
          >
            <t.icon className="size-3.5" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>
      <Header data={data} />
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3">
        {error && <p className="border border-primary/40 p-3 text-sm text-primary">{error.message}</p>}
        {!data && !error && <p className="animate-pulse text-xs uppercase tracking-[0.3em] text-foreground/40">Embaralhando…</p>}
        {data && tab === 'mesa' && (
          <Mesa
            data={data}
            busy={busy || !!queue}
            onPlay={(g) => enterRoom(() => queueCasual(g), false)}
            onTutorial={(g) => launch(() => startTutorial(g))}
            onJoinEvent={(id) => enterRoom(() => joinDuel(id), true)}
            onChange={() => mutate()}
            onView={(v) => {
              setTab(v)
              playSfx('click')
            }}
          />
        )}
        {data && tab === 'agenda' && (
          <Agenda
            data={data}
            busy={busy || !!queue}
            onPlay={(id) => enterRoom(() => joinDuel(id), true)}
            onQueue={(g) => enterRoom(() => queueCasual(g), false)}
            onRanking={(g) => {
              setRankView(g)
              setTab('ranking')
              playSfx('click')
            }}
            onChange={() => mutate()}
          />
        )}
        {data && tab === 'ranking' && <Ranking data={data} view={rankView} onView={setRankView} />}
        {tab === 'apostas' && <Apostas />}
      </div>

      {!state.javaliMet && <JavaliIntro />}

      {queue && !running && <Searching gameId={queue.gameId} duel={queue.duel} onCancel={cancelQueue} />}

      {running &&
        createPortal(
          <div className="fixed inset-0 z-[80] bg-[#090b0f]">
            {running.finish ? (
              <ResultScreen run={running} onClose={quit} />
            ) : running.error ? (
              <div className="grid h-full place-items-center p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-primary">{running.error}</p>
                  <button type="button" onClick={quit} className="border border-foreground/30 px-4 py-2 text-xs uppercase tracking-[0.25em]">
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <GameRunner run={running} settings={(data?.me.settings ?? {}) as Record<string, string>} onFinish={finish} onQuit={quit} />
            )}
          </div>,
          document.body,
        )}
    </div>
    </MiniProfileHost>
  )
}

/** Fundo da Sala: duas luzes de palco, piso em perspectiva e vinheta, tudo estático e barato. */
function ArcadeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-1/4 -top-1/3 h-[80%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(111,140,255,0.22),transparent)] blur-2xl" />
      <div className="absolute -bottom-1/3 -right-1/4 h-[80%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(143,166,255,0.16),transparent)] blur-2xl" />
      <div className="arcade-beam absolute -top-10 left-[18%] h-[120%] w-40 origin-top rotate-[18deg] bg-[linear-gradient(to_bottom,rgba(111,140,255,0.14),transparent_70%)] blur-md" />
      <div className="arcade-beam absolute -top-10 right-[22%] h-[120%] w-32 origin-top -rotate-[16deg] bg-[linear-gradient(to_bottom,rgba(201,168,240,0.1),transparent_65%)] blur-md [animation-delay:-6s]" />
      <div className="absolute inset-x-[-50%] bottom-[-10%] h-[55%] [transform:perspective(500px)_rotateX(62deg)] opacity-40 [background-image:linear-gradient(rgba(111,140,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(111,140,255,0.35)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_top,black,transparent_85%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_0.6px,transparent_0.6px)] [background-size:3px_3px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.75))]" />
    </div>
  )
}

function useArcadeAmbience(inGame: boolean) {
  useEffect(() => {
    startArcadeAmbience()
    const resume = () => startArcadeAmbience()
    window.addEventListener('pointerdown', resume, { once: true })
    return () => {
      window.removeEventListener('pointerdown', resume)
      stopArcadeAmbience()
    }
  }, [])
  useEffect(() => setArcadeAmbienceMuffled(inGame), [inGame])
}

function NeonTime({ ms, live }: { ms: number; live?: boolean }) {
  const hour = new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: SP_TZ })
  return (
    <time
      dateTime={new Date(ms).toISOString()}
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-sm font-bold tabular-nums tracking-[0.15em]',
        live
          ? 'border-[#8fa6ff]/70 bg-[#8fa6ff]/10 text-[#b8c6ff] [text-shadow:0_0_10px_rgba(143,166,255,0.9)] shadow-[0_0_14px_rgba(143,166,255,0.35)]'
          : 'border-[#6f8cff]/60 bg-[#6f8cff]/10 text-[#a9bcff] [text-shadow:0_0_10px_rgba(111,140,255,0.95)] shadow-[0_0_14px_rgba(111,140,255,0.3)]',
      )}
    >
      <Clock className="size-3.5" aria-hidden="true" />
      {hour}
    </time>
  )
}

function Searching({ gameId, duel, onCancel }: { gameId: GameId; duel: boolean; onCancel: () => void }) {
  const [since] = useState(() => Date.now())
  const now = useNow(1000)
  const secs = Math.max(0, Math.floor((now - since) / 1000))
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-[#090b0f]/85 p-6 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 border border-[#6f8cff]/40 bg-black/60 p-6 text-center">
        <span className="relative grid size-16 place-items-center">
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border border-[#6f8cff]/50" />
          <Users className="size-7 text-[#6f8cff]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/50">{GAMES[gameId].name}</p>
          <p className="mt-1 font-serif text-xl tracking-wide">{duel ? 'Aguardando seu adversário' : 'Procurando oponente'}</p>
          <p className="mt-1 font-mono text-xs tabular-nums text-foreground/50">
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-foreground/60">
          {duel ? 'A partida começa assim que o outro jogador da chave entrar.' : 'Você será pareado com outro jogador real que estiver na fila.'}
        </p>
        <button type="button" onClick={onCancel} className="border border-foreground/30 px-4 py-2 text-[11px] uppercase tracking-[0.25em] hover:border-[#8fa6ff] hover:text-[#8fa6ff]">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function GameRunner({ run, settings, onFinish, onQuit }: { run: Running; settings: Record<string, string>; onFinish: (o: GameOutcome) => void; onQuit: () => void }) {
  const Game = GAME_COMPONENTS[run.start.gameId as GameId]
  return (
    <LiveMatchProvider channel={liveChannelFor(run.start)}>
      <Game start={run.start} settings={settings} onFinish={onFinish} onQuit={onQuit} />
    </LiveMatchProvider>
  )
}

function Header({ data }: { data?: Dashboard }) {
  const now = useNow(1000)
  const { state } = useDevo()
  const me = data?.me
  return (
    <header className="flex flex-wrap items-center gap-2 py-1.5">
      <h2 className="sr-only">Sala de Jogos</h2>
      <dl className="flex flex-wrap gap-1.5">
        <Stat label="Seu Tempo" value={formatCountdown(Math.max(0, state.timerEndsAt - now))} icon={Hourglass} gold />
        <Stat label="Pontos" value={me ? formatPoints(me.score) : '—'} icon={Swords} />
        <Stat label="Posição" value={me?.rank ? `#${me.rank}` : '—'} icon={Crown} />
        <Stat label="Reset" value={data ? formatCountdown(data.week.resetsAt - now) : '—'} icon={Timer} />
      </dl>
    </header>
  )
}

function Stat({ label, value, icon: Icon, gold }: { label: string; value: string; icon: typeof Coins; gold?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 border px-2 py-1', gold ? 'border-[#6f8cff]/40 bg-[#6f8cff]/5' : 'border-foreground/15 bg-black/30')}>
      <Icon className={cn('size-3.5', gold ? 'text-[#6f8cff]' : 'text-foreground/50')} aria-hidden="true" />
      <div className="leading-tight">
        <dt className="text-[9px] uppercase tracking-[0.3em] text-foreground/45">{label}</dt>
        <dd className={cn('font-mono text-sm tabular-nums', gold && 'text-[#6f8cff]')}>{value}</dd>
      </div>
    </div>
  )
}

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

function spDayKey(ms: number) {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: SP_TZ })
}

function Agenda({
  data,
  busy,
  onPlay,
  onQueue,
  onRanking,
  onChange,
}: {
  data: Dashboard
  busy: boolean
  onPlay: (id: string) => void
  onQueue: (g: GameId) => void
  onRanking: (g: GameId) => void
  onChange: () => void
}) {
  const now = useNow(1000)
  const todayKey = spDayKey(now)
  const days = WEEKDAYS.map((label, i) => {
    const key = spDayKey(data.week.resetsAt - (7 - i) * 86_400_000 + 12 * 3_600_000)
    return { label, key, events: data.events.filter((e) => spDayKey(e.startsAt) === key) }
  })
  const topHours = Math.max(0, ...data.events.map((e) => e.reward.hours ?? 0))
  const today = days.find((d) => d.key === todayKey)
  const featured =
    today?.events.find((e) => e.status !== 'FINISHED') ?? today?.events[0] ?? data.events.find((e) => e.status !== 'FINISHED') ?? null
  const isToday = !!featured && spDayKey(featured.startsAt) === todayKey
  const next = data.events.find((e) => e.status !== 'FINISHED' && e.id !== featured?.id) ?? null
  const weekPrize = rankReward(1)
  const weekdayLabel = new Date(now).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: SP_TZ })

  const primary = () => {
    if (!featured) return
    if (featured.status === 'LIVE' && featured.joined) onPlay(featured.id)
    else if (featured.status === 'REGISTRATION' && !featured.joined) registerEvent(featured.id, onChange)
    else onQueue(featured.gameId)
  }
  const primaryLabel = !featured
    ? ''
    : featured.status === 'LIVE' && featured.joined
      ? 'Jogar agora'
      : featured.status === 'REGISTRATION' && !featured.joined
        ? 'Inscrever-se'
        : 'Entrar na fila'

  return (
    <div className="flex flex-col gap-5">
      {featured ? (
        <section aria-labelledby="hoje" className="relative overflow-hidden border border-foreground/15 border-l-2 border-l-[#8fa6ff] bg-black/40">
          <div className="absolute inset-y-0 right-0 hidden w-2/5 sm:block" aria-hidden="true">
            <Image src={GAMES[featured.gameId].thumbnail} alt="" fill sizes="40vw" className="object-cover object-right opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090b0f] via-[#090b0f]/60 to-transparent" />
          </div>
          <div className="relative flex flex-col gap-3 p-4 sm:max-w-[65%]">
            <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/50">
              {isToday ? `Hoje · ${weekdayLabel}` : `Próximo · ${new Date(featured.startsAt).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: SP_TZ })}`}
              {' · '}
              <span className={cn(featured.status === 'LIVE' && 'text-[#8fa6ff]', featured.status === 'REGISTRATION' && 'text-[#6f8cff]')}>
                {STATUS_LABEL[featured.status]}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h3 id="hoje" className="font-serif text-3xl tracking-wide text-balance">
                {featured.label ?? GAMES[featured.gameId].name}
              </h3>
              <NeonTime ms={featured.startsAt} live={featured.status === 'LIVE'} />
            </div>
            <p className="text-sm leading-relaxed text-foreground/65 text-pretty">{featured.rules ?? GAMES[featured.gameId].description}</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Prêmio da semana</span>
              <span className="font-mono text-lg tabular-nums text-[#6f8cff]">+{String(weekPrize?.hours ?? 0).padStart(2, '0')}:00:00 de Tempo</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">para o 1º do ranking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || (featured.status === 'REGISTRATION' && featured.joined)}
                onClick={primary}
                className="border border-[#6f8cff] bg-[#6f8cff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#6f8cff] hover:bg-[#6f8cff]/20 disabled:opacity-50"
              >
                {featured.status === 'REGISTRATION' && featured.joined ? 'Inscrito' : primaryLabel}
              </button>
              <button
                type="button"
                onClick={() => onRanking(featured.gameId)}
                className="border border-foreground/20 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground"
              >
                Ver ranking
              </button>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-sm text-foreground/40">Nenhuma partida programada nesta semana.</p>
      )}

      {next && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border border-[#1647ff]/40 bg-[#1647ff]/10 px-3 py-2.5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/50">Próxima partida</span>
          <span className="text-sm">
            #{String(next.number).padStart(3, '0')} · <strong className="text-[#6f8cff]">{next.label ?? GAMES[next.gameId].name}</strong> · {next.entries}/{next.maxPlayers}
          </span>
          <span className="font-mono text-xs tabular-nums text-[#6f8cff]">
            {next.status === 'LIVE' ? 'ao vivo' : `começa em ${formatCountdown(next.startsAt - now)}`}
          </span>
        </div>
      )}

      <ol aria-label="Semana" className="grid grid-cols-1 gap-1.5 sm:grid-cols-7">
        {days.map((d) => {
          const ev = d.events[0]
          const past = d.key < todayKey
          const now_ = d.key === todayKey
          const big = !!ev && topHours > 0 && (ev.reward.hours ?? 0) === topHours
          return (
            <li
              key={d.key}
              aria-current={now_ ? 'date' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-3 border bg-black/40 p-2 sm:flex-col sm:gap-1.5 sm:text-center',
                now_ ? 'border-[#8fa6ff]/70 bg-[#8fa6ff]/10' : big ? 'border-[#6f8cff]/60' : 'border-foreground/15',
                past && 'opacity-45',
              )}
            >
              <span className={cn('w-10 shrink-0 font-mono text-[10px] tracking-[0.2em] sm:w-auto', now_ ? 'text-[#8fa6ff]' : big ? 'text-[#6f8cff]' : 'text-foreground/50')}>
                {d.label}
              </span>
              {ev ? (
                <>
                  <span className="relative size-9 shrink-0 overflow-hidden border border-foreground/15">
                    <Image src={GAMES[ev.gameId].thumbnail} alt="" fill sizes="36px" className="object-cover object-[78%_center]" />
                  </span>
                  <span className="min-w-0 text-sm leading-tight break-words sm:text-xs">{ev.label ?? GAMES[ev.gameId].name}</span>
                </>
              ) : (
                <span className="text-xs text-foreground/30">Folga</span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex items-start gap-3 border border-[#a07ad8]/40 bg-[#160f1f]/90 p-3">
        <Crown className="mt-0.5 size-4 shrink-0 text-[#c9a8f0]" aria-hidden="true" />
        <p className="text-sm italic leading-relaxed text-foreground/70">
          <span className="mb-0.5 block text-[10px] not-italic uppercase tracking-[0.3em] text-[#c9a8f0]">Javali</span>
          Aqui ninguém aposta dinheiro. Aposta-se Tempo. Muito mais divertido.
        </p>
      </div>

      <section aria-labelledby="calendario">
        <h3 id="calendario" className="mb-2 text-[11px] uppercase tracking-[0.3em] text-foreground/50">
          Calendário da semana
        </h3>
        <EventList data={data} busy={busy} onPlay={onPlay} onChange={onChange} />
      </section>
    </div>
  )
}

function EventList({ data, busy, onPlay, onChange }: { data: Dashboard; busy: boolean; onPlay: (id: string) => void; onChange: () => void }) {
  const now = useNow(1000)
  const [open, setOpen] = useState<string | null>(null)
  const register = (id: string) => registerEvent(id, onChange)
  if (!data.events.length) return <p className="text-sm text-foreground/40">Nenhuma partida programada nesta semana.</p>
  return (
    <ul className="flex flex-col gap-3">
      {data.events.map((e) => {
        const day = new Date(e.startsAt).toLocaleDateString('pt-BR', { weekday: 'long' })
        return (
          <li key={e.id} className={cn('border bg-black/40', e.status === 'LIVE' ? 'border-[#8fa6ff]/60' : 'border-foreground/15')}>
            <div className="flex flex-wrap items-center gap-3 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden border border-foreground/15">
                <Image src={GAMES[e.gameId].thumbnail} alt="" fill sizes="56px" className="object-cover object-[78%_center]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <NeonTime ms={e.startsAt} live={e.status === 'LIVE'} />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/55">
                    {day} · #{String(e.number).padStart(3, '0')}
                  </span>
                </div>
                <p className="font-serif text-lg">{e.label ?? GAMES[e.gameId].name}</p>
                <p className="flex items-center gap-3 text-[11px] text-foreground/55">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" aria-hidden="true" /> {e.entries}/{e.maxPlayers}
                  </span>
                  <span className={cn(e.status === 'LIVE' && 'text-[#8fa6ff]', e.status === 'REGISTRATION' && 'text-[#6f8cff]')}>{STATUS_LABEL[e.status]}</span>
                  {e.status === 'UPCOMING' && <span>inscrições em {formatCountdown(e.registrationOpensAt - now)}</span>}
                  {e.status === 'REGISTRATION' && <span>fecha em {formatCountdown(e.registrationClosesAt - now)}</span>}
                  {e.status === 'LOCKED' && <span>começa em {formatCountdown(e.startsAt - now)}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status === 'REGISTRATION' &&
                  (e.joined ? (
                    <span className="border border-[#6f8cff]/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#6f8cff]">Inscrito</span>
                  ) : (
                    <button type="button" onClick={() => register(e.id)} className="border border-[#6f8cff] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#6f8cff] hover:bg-[#6f8cff]/15">
                      Inscrever
                    </button>
                  ))}
                {e.status === 'LIVE' && e.joined && (
                  <button type="button" disabled={busy} onClick={() => onPlay(e.id)} className="border border-[#8fa6ff] bg-[#1647ff]/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#c9d4ff] hover:bg-[#1647ff]/35">
                    Jogar agora
                  </button>
                )}
                {e.status === 'UPCOMING' && <Lock className="size-4 text-foreground/30" aria-label="Bloqueado" />}
                <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="border border-foreground/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground" aria-expanded={open === e.id}>
                  Detalhes
                </button>
              </div>
            </div>
            {open === e.id && <EventPanel id={e.id} />}
          </li>
        )
      })}
    </ul>
  )
}

function EventPanel({ id }: { id: string }) {
  const { data } = useSWR<EventDetail>(arcadeKey('event', `&id=${id}`), arcadeFetcher, { refreshInterval: 15_000 })
  if (!data) return <p className="border-t border-foreground/10 p-3 text-xs text-foreground/40">Carregando…</p>
  return (
    <div className="grid gap-3 border-t border-foreground/10 p-3 md:grid-cols-2">
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-foreground/45">Regras</p>
        <p className="text-sm text-foreground/75">{data.event.rules ?? GAMES[data.event.gameId].tagline}</p>
      </div>
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-foreground/45">Participantes</p>
        <ul className="flex flex-col gap-1 text-sm">
          {data.entries.length === 0 && <li className="text-foreground/40">Ninguém ainda.</li>}
          {data.entries.map((en) => (
            <li key={en.name} className={cn('flex justify-between', en.isMe && 'text-[#6f8cff]')}>
              <span>{en.name}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">{en.state}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

type RankView = 'geral' | GameId

function Ranking({ data, view, onView }: { data: Dashboard; view: RankView; onView: (v: RankView) => void }) {
  const options: { id: RankView; label: string }[] = [{ id: 'geral', label: 'Geral' }, ...(Object.keys(GAMES) as GameId[]).map((g) => ({ id: g, label: GAMES[g].name }))]
  const rules = (
    <div className="flex flex-col gap-1.5 border border-dashed border-foreground/20 p-3 text-sm leading-relaxed text-foreground/60">
      <span>
        <strong className="font-medium text-foreground">Prêmios:</strong> top 3 do ranking geral, entregues no reset, em Tempo
        {[1, 2, 3].map((r) => ` · ${r}º +${rankReward(r)?.hours ?? 0}h`).join('')}.
      </span>
      <span>
        <strong className="font-medium text-foreground">Para concorrer:</strong> mínimo de {data.minWeekGames} partidas online na semana{' '}
        <span className={cn('font-mono tabular-nums', data.me.games >= data.minWeekGames ? 'text-[#6f8cff]' : 'text-[#8fa6ff]')}>
          (você: {data.me.games}/{data.minWeekGames})
        </span>
        .
      </span>
      <span>
        <strong className="font-medium text-foreground">Título permanente:</strong> a patente zera toda semana, mas o maior título alcançado fica no seu perfil.
      </span>
    </div>
  )
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Ranking por jogo" className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={view === o.id}
            onClick={() => {
              onView(o.id)
              playSfx('click')
            }}
            className={cn(
              'border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors',
              view === o.id ? 'border-[#6f8cff] bg-[#6f8cff]/10 text-[#6f8cff]' : 'border-foreground/15 bg-black/30 text-foreground/50 hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {view === 'geral' ? (
        <>
          <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/45">Semana {data.week.key} · reinicia toda segunda</p>
          <RankList
            rows={data.leaderboard.slice(0, 10).map((r) => ({ rank: r.rank, name: r.name, isMe: r.isMe, sub: `${r.wins} vitórias`, points: r.score }))}
            me={data.me.rank && data.me.rank > 10 ? { rank: data.me.rank, name: data.me.name, isMe: true, sub: `${data.me.wins} vitórias`, points: data.me.score } : null}
          />
        </>
      ) : (
        <GameRank data={data} gameId={view} />
      )}
      {rules}
    </div>
  )
}

function GameRank({ data, gameId }: { data: Dashboard; gameId: GameId }) {
  const r = data.rankings[gameId]
  const points = r.me?.points ?? 0
  const idx = patenteIndex(points)
  const cur = PATENTES[idx]
  const nextP = PATENTES[idx + 1]
  const pct = nextP ? Math.round(((points - cur.min) / (nextP.min - cur.min)) * 100) : 100
  const permanent = PATENTES[patenteIndex(r.bestWeek)]
  return (
    <>
      <section aria-label="Sua patente" className="flex flex-col gap-3 border border-foreground/15 bg-black/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Sua patente · {GAMES[gameId].name}</span>
          <span className="font-mono text-xs tabular-nums text-foreground/60">
            {formatPoints(points)} pts{r.me ? ` · #${r.me.rank}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-2xl uppercase tracking-[0.12em]">{cur.name}</h3>
          <span className="font-mono text-xs text-foreground/50">
            {nextP ? `faltam ${formatPoints(nextP.min - points)} pts para ${nextP.name}` : 'Patente máxima'}
          </span>
        </div>
        <div className="h-1.5 border border-foreground/15 bg-black/50" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da patente">
          <div className="h-full bg-gradient-to-r from-[#6f8cff] to-[#8fa6ff]" style={{ width: `${pct}%` }} />
        </div>
        <ol className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {PATENTES.map((p, i) => (
            <li
              key={p.name}
              aria-current={i === idx ? 'step' : undefined}
              className={cn(
                'border px-1 py-1.5 text-center text-[9px] uppercase tracking-[0.12em] break-words',
                i === idx ? 'border-[#6f8cff] bg-[#6f8cff]/10 text-foreground' : i < idx ? 'border-foreground/25 text-foreground/55' : 'border-foreground/10 text-foreground/30',
              )}
            >
              {p.name}
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-foreground/45">
          Maior título alcançado: <span className="text-[#6f8cff]">{r.bestWeek > 0 ? permanent.name : '—'}</span>
        </p>
      </section>
      {r.rows.length === 0 ? (
        <p className="text-sm text-foreground/40">Ninguém pontuou em {GAMES[gameId].name} nesta semana. A mesa está esperando.</p>
      ) : (
        <RankList
          rows={r.rows.map((x) => ({ rank: x.rank, name: x.name, isMe: x.isMe, sub: PATENTES[patenteIndex(x.points)].name, points: x.points, today: x.today }))}
          me={r.me && r.me.rank > 10 ? { rank: r.me.rank, name: r.me.name, isMe: true, sub: cur.name, points: r.me.points, today: r.me.today } : null}
        />
      )}
    </>
  )
}

type RankRow = { rank: number; name: string; isMe: boolean; sub: string; points: number; today?: number }

function RankList({ rows, me }: { rows: RankRow[]; me: RankRow | null }) {
  if (!rows.length) return <p className="text-sm text-foreground/40">Ninguém pontuou nesta semana ainda.</p>
  const item = (r: RankRow) => (
    <li
      key={`${r.rank}-${r.name}`}
      className={cn(
        'flex items-center gap-3 border px-3 py-2.5',
        r.isMe ? 'border-[#6f8cff]/60 bg-[#6f8cff]/10' : r.rank === 1 ? 'border-[#6f8cff]/30 bg-black/50' : 'border-foreground/10 bg-black/40',
      )}
    >
      <span className={cn('w-8 text-center font-mono text-sm tabular-nums', r.rank <= 3 ? 'text-[#6f8cff]' : 'text-foreground/45')}>{r.rank}</span>
      {r.rank === 1 && <Crown className="size-4 text-[#6f8cff]" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <span className={cn('block truncate font-serif text-base', r.isMe && 'text-[#6f8cff]')}>{r.isMe ? `${r.name} (você)` : r.name}</span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-[#6f8cff]/70">{r.sub}</span>
      </div>
      <div className="text-right">
        <span className="block font-mono tabular-nums">{formatPoints(r.points)}</span>
        {r.today !== undefined && <span className="block font-mono text-[10px] text-emerald-400/80">+{formatPoints(r.today)} hoje</span>}
      </div>
    </li>
  )
  return (
    <ol className="flex flex-col gap-1">
      {rows.map(item)}
      {me && (
        <>
          <li aria-hidden="true" className="text-center font-mono text-xs tracking-[0.4em] text-foreground/30">
            · · ·
          </li>
          {item(me)}
        </>
      )}
    </ol>
  )
}

function Apostas() {
  const applyTime = useApplyTime()
  const { state } = useDevo()
  const now = useNow(1000)
  const { data, mutate } = useSWR<BetBoard>(arcadeKey('bets'), arcadeFetcher, { refreshInterval: 20_000, onSuccess: (d) => applyTime(d) })
  const [amount, setAmount] = useState(15)
  if (!data) return <p className="animate-pulse text-xs uppercase tracking-[0.3em] text-foreground/40">Abrindo o livro…</p>
  const remaining = Math.max(0, state.timerEndsAt - now)
  const bet = async (duelId: string, pick: string) => {
    if (!window.confirm(`Apostar ${formatMinutes(amount)} do seu Tempo em ${pick}? Se perder, esse tempo some do seu relógio.`)) return
    try {
      applyTime(await arcadePost<{ timeDeltaMs?: number }>({ action: 'bet', duelId, pick, amount }))
      playSfx('send')
      mutate()
    } catch (e) {
      window.alert((e as Error).message)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 border border-[#6f8cff]/30 bg-[#6f8cff]/5 p-3">
        <Hourglass className="size-4 text-[#6f8cff]" aria-hidden="true" />
        <span className="flex-1 text-sm">
          Seu Tempo: <strong className="font-mono text-[#6f8cff]">{formatCountdown(remaining)}</strong>
        </span>
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/60">
          Apostar
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="border border-foreground/25 bg-black px-2 py-1 font-mono text-sm text-foreground">
            {BET_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {formatMinutes(v)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="-mt-2 text-[11px] leading-relaxed text-foreground/45">
        A moeda aqui é o seu Tempo de vida. Ganhou, o prêmio volta ao relógio multiplicado pela odd. Perdeu, ele some. Você sempre precisa manter ao menos 30min.
      </p>
      {data.events.length === 0 && <p className="text-sm text-foreground/40">Nenhum confronto aberto para apostas agora. Volte quando uma partida fechar as inscrições.</p>}
      {data.events.map((ev) => (
        <section key={ev.id} aria-label={GAMES[ev.gameId].name}>
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.3em] text-foreground/50">
            {GAMES[ev.gameId].name} #{String(ev.number).padStart(3, '0')} · {STATUS_LABEL[ev.status]}
          </h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {ev.duels.map((d) => (
              <li key={d.id} className="border border-foreground/15 bg-black/40 p-3">
                <div className="flex items-stretch gap-2">
                  {d.sides.map((s, i) => {
                    const picked = d.myBet?.pick === s.name
                    return (
                      <div key={s.name} className="contents">
                        {i === 1 && <span className="self-center font-mono text-[10px] text-foreground/35">VS</span>}
                        <button
                          type="button"
                          disabled={!!d.myBet || !!d.winner || s.isMe || ev.status === 'FINISHED'}
                          onClick={() => bet(d.id, s.name)}
                          className={cn(
                            'flex flex-1 flex-col items-center gap-1 border px-2 py-2 transition-colors disabled:cursor-default',
                            picked ? 'border-[#6f8cff] bg-[#6f8cff]/10' : 'border-foreground/15 enabled:hover:border-[#6f8cff]/60',
                            d.winner === s.name && 'border-[#6f8cff]',
                          )}
                        >
                          <span className="truncate text-sm">{s.name}</span>
                          <span className="font-mono text-lg text-[#6f8cff]">{s.odds.toFixed(2)}x</span>
                          <span className="text-[10px] text-foreground/45">{s.pct}% do público</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
                {d.myBet && (
                  <p className="mt-2 text-[11px] text-foreground/60">
                    Você apostou {formatMinutes(d.myBet.amount)} em {d.myBet.pick} · {d.myBet.status === 'won' ? `ganhou ${formatMinutes(d.myBet.payout)}` : d.myBet.status === 'lost' ? 'perdeu' : 'aguardando'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {data.history.length > 0 && (
        <section aria-labelledby="hist-apostas">
          <h3 id="hist-apostas" className="mb-2 text-[11px] uppercase tracking-[0.3em] text-foreground/50">
            Suas apostas
          </h3>
          <ul className="divide-y divide-foreground/10 border border-foreground/10 text-sm">
            {data.history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 truncate">
                  {h.label} · {h.pick}
                </span>
                <span className="font-mono text-foreground/60">{formatMinutes(h.amount)}</span>
                <span className={cn('w-20 text-right text-[11px] uppercase', h.status === 'won' ? 'text-[#6f8cff]' : h.status === 'lost' ? 'text-[#8fa6ff]' : 'text-foreground/50')}>
                  {h.status === 'won' ? `+${formatMinutes(h.payout)}` : h.status === 'lost' ? 'perdeu' : 'aberta'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ResultScreen({ run, onClose }: { run: Running; onClose: () => void }) {
  const f = run.finish!
  const o = f.outcome
  const win = o.result === 'win'
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <p className={cn('animate-[devo-pop_0.5s_ease-out] font-serif text-5xl tracking-[0.2em]', win ? 'text-[#6f8cff]' : o.result === 'draw' ? 'text-foreground' : 'text-[#8fa6ff]')}>
          {win ? 'VITÓRIA' : o.result === 'draw' ? 'EMPATE' : 'DERROTA'}
        </p>
        <p className="text-sm text-foreground/60">
          {GAMES[run.start.gameId as GameId].name} vs {run.start.opponent.name}
        </p>
        <dl className="grid w-full grid-cols-2 gap-2">
          {/* Placar = o número do HUD, igual ao gravado pelo servidor. Pontos de ranking = o que entra no ranking (rankingPoints). */}
          <ResultStat label="Seu placar" value={formatPoints(o.score)} />
          <ResultStat label="Placar do oponente" value={formatPoints(o.oppScore)} />
          <ResultStat label="Pontos de ranking" value={f.tutorial ? 'Treino' : `+${formatPoints(f.awarded)}`} />
          <ResultStat label="Tempo ganho" value={`+${formatMinutes(f.timeGainMin)}`} gold />
          <ResultStat label="Pontos na semana" value={formatPoints(f.weekScore)} />
          <ResultStat label="Posição" value={f.rank ? `#${f.rank}` : '—'} />
        </dl>
        {o.bonusLabel && <p className="-mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/50">{o.bonusLabel}</p>}
        <p className="-mt-2 text-[11px] leading-relaxed text-foreground/45">
          {f.tutorial ? 'Treino contra o bot não vale ranking nem Tempo.' : run.start.mode === 'evento' ? RANKING_RULE_EVENT : RANKING_RULE_CASUAL}
        </p>
        <button type="button" onClick={onClose} className="border border-[#6f8cff] px-6 py-2.5 text-xs uppercase tracking-[0.3em] text-[#6f8cff] hover:bg-[#6f8cff]/10">
          Voltar à mesa
        </button>
      </div>
    </div>
  )
}

function ResultStat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="border border-foreground/15 bg-black/40 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">{label}</dt>
      <dd className={cn('font-mono text-xl tabular-nums', gold && 'text-[#6f8cff]')}>{value}</dd>
    </div>
  )
}
