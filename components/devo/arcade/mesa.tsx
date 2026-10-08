'use client'

import { ChevronRight, Crown, Flame, Hourglass, Lock, Radio, Users } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { type BetBoard, type Dashboard, arcadeFetcher, arcadeKey, arcadePost, formatCountdown, formatPoints } from '@/lib/devo/arcade/client'
import { GAMES, type GameId } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { JavaliArt } from '../npc-art/javali'
import { useDevo } from '../state/devo-store'
import { ArcadeChat } from './arcade-chat'
import { type ArcadeView, BET_OPTIONS, BET_RESERVE_MIN, eventTimeLabel, formatMinutes, registerEvent, useApplyTime } from './arcade-shared'

type EventView = Dashboard['events'][number]
export type Duel = BetBoard['events'][number]['duels'][number]

const HOST_LINES = [
  'Aqui ninguém morre... normalmente.',
  'Aqui ninguém aposta dinheiro. Aposta-se Tempo.',
  'Jogue, aposte, suba no ranking. A casa agradece.',
]

const OPEN_BET_STATUS = new Set(['LOCKED', 'LIVE'])

export function Mesa({
  data,
  busy,
  onPlay,
  onTutorial,
  onJoinEvent,
  onChange,
  onView,
}: {
  data: Dashboard
  busy: boolean
  onPlay: (g: GameId) => void
  onTutorial: (g: GameId) => void
  onJoinEvent: (id: string) => void
  onChange: () => void
  onView: (v: ArcadeView) => void
}) {
  const applyTime = useApplyTime()
  const { data: bets, mutate: mutateBets } = useSWR<BetBoard>(arcadeKey('bets'), arcadeFetcher, {
    refreshInterval: 20_000,
    onSuccess: (d) => applyTime(d),
  })
  const sheet = useBetSheet(() => mutateBets())
  const live = data.events.find((e) => e.status === 'LIVE')
  const next = live ?? data.events.find((e) => e.status !== 'FINISHED') ?? null
  const openDuels = (bets?.events ?? [])
    .filter((e) => OPEN_BET_STATUS.has(e.status))
    .flatMap((e) => e.duels.filter((d) => !d.winner).map((d) => ({ duel: d, event: e })))
  const featured = openDuels[0] ?? null

  const claim = async () => {
    try {
      applyTime(await arcadePost<{ timeDeltaMs?: number }>({ action: 'claim' }))
      playSfx('confirm')
      onChange()
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  return (
    <div className="@container flex flex-col gap-3">
      <Hero next={next} busy={busy} onPlay={onPlay} onJoinEvent={onJoinEvent} onChange={onChange} />

      {data.claim && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#6f8cff]/50 bg-[#6f8cff]/10 p-3">
          <p className="text-sm">
            Você terminou a semana passada em <strong className="text-[#8fa6ff]">#{data.claim.rank}</strong>. Há uma recompensa esperando.
          </p>
          <button type="button" onClick={claim} className="border border-[#6f8cff] px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-[#8fa6ff] hover:bg-[#6f8cff]/15">
            Resgatar
          </button>
        </div>
      )}

      <div className="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <section aria-label="Jogos da semana" className="grid grid-cols-2 gap-2.5 @3xl:grid-cols-4">
            {(Object.keys(GAMES) as GameId[]).map((g) => (
              <GameCard
                key={g}
                gameId={g}
                best={data.me.best[g] ?? 0}
                event={data.events.find((e) => e.gameId === g && e.status !== 'FINISHED')}
                busy={busy}
                onPlay={() => onPlay(g)}
                onTutorial={() => onTutorial(g)}
              />
            ))}
          </section>

          <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <FeaturedDuel item={featured} loading={!bets} onBet={sheet.open} />
            <RankingPanel data={data} onMore={() => onView('ranking')} />
          </div>

          <div className="grid gap-3 @2xl:grid-cols-2">
            <OpenBets items={openDuels.slice(1, 4)} loading={!bets} onBet={sheet.open} onMore={() => onView('apostas')} />
            <RecentPanel data={data} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <LivePanel event={next} onMore={() => onView('agenda')} />
          <Panel title="Chat da mesa" className="flex min-h-[22rem] flex-1 flex-col">
            <ArcadeChat channel="lobby" className="min-h-0 flex-1" />
          </Panel>
        </div>
      </div>
      {sheet.node}
    </div>
  )
}

function Panel({ title, action, live, className, children }: { title: string; action?: ReactNode; live?: boolean; className?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={cn('relative min-w-0 border border-[#6f8cff]/20 bg-[#0a0c16]/85 p-3.5', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-px -top-px size-3 border-r border-t border-[#8fa6ff]/60" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -left-px size-3 border-b border-l border-[#8fa6ff]/60" />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/80">
          {live && <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-[#8fa6ff] shadow-[0_0_10px_#8fa6ff]" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function MoreLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-0.5 text-[10px] uppercase tracking-[0.2em] text-foreground/45 transition-colors hover:text-[#8fa6ff]"
    >
      {label}
      <ChevronRight className="size-3" aria-hidden="true" />
    </button>
  )
}

function Monogram({ name, size = 'md', me }: { name: string; size?: 'sm' | 'md' | 'lg'; me?: boolean }) {
  const initials = name
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center border font-serif tracking-wider',
        me ? 'border-[#8fa6ff] bg-[#1647ff]/25 text-[#c9d4ff]' : 'border-foreground/20 bg-[linear-gradient(160deg,#1a2050,#0b0d1c)] text-foreground/80',
        size === 'sm' && 'size-7 text-[10px]',
        size === 'md' && 'size-9 text-xs',
        size === 'lg' && 'size-12 text-base',
      )}
    >
      {initials || '?'}
    </span>
  )
}

function eventAction(e: EventView) {
  if (e.status === 'LIVE' && e.joined) return { label: 'Jogar agora', kind: 'join' as const }
  if (e.status === 'REGISTRATION' && !e.joined) return { label: 'Inscrever-se', kind: 'register' as const }
  if (e.status === 'REGISTRATION' && e.joined) return { label: 'Inscrito', kind: 'done' as const }
  return { label: 'Jogar online', kind: 'queue' as const }
}

function Hero({
  next,
  busy,
  onPlay,
  onJoinEvent,
  onChange,
}: {
  next: EventView | null
  busy: boolean
  onPlay: (g: GameId) => void
  onJoinEvent: (id: string) => void
  onChange: () => void
}) {
  const [line] = useState(() => HOST_LINES[Math.floor(Math.random() * HOST_LINES.length)])
  return (
    <header className="relative flex flex-col gap-4 overflow-hidden border border-[#6f8cff]/20 bg-[#070812] p-4 @2xl:flex-row @2xl:items-end @2xl:justify-between @2xl:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {next && <Image src={GAMES[next.gameId].thumbnail} alt="" fill sizes="100vw" className="object-cover object-center opacity-35" priority />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070812_0%,rgba(7,8,18,0.82)_40%,rgba(7,8,18,0.35)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#070812_0%,transparent_55%)]" />
      </div>

      <div className="relative flex items-end gap-4">
        <div className="relative hidden h-28 shrink-0 @xl:block" style={{ aspectRatio: '1000 / 444' }}>
          <JavaliArt pose="table" title="Javali, anfitrião da Sala de Jogos" className="absolute inset-0 size-full drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8fa6ff]/80">DEVO · Entretenimento</p>
          <h2 className="mt-1 font-display text-2xl font-semibold uppercase leading-none tracking-[0.12em] text-foreground [text-shadow:0_0_24px_rgba(111,140,255,0.35)] @2xl:text-3xl">
            Sala de Jogos
          </h2>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-foreground/55">Jogue. Aposte. Sobreviva.</p>
          <p className="mt-2 text-xs italic text-foreground/50">
            <span className="not-italic text-[#d8b25a]">Javali:</span> {line}
          </p>
        </div>
      </div>

      {next && <NextEventCard event={next} busy={busy} onPlay={onPlay} onJoinEvent={onJoinEvent} onChange={onChange} />}
    </header>
  )
}

function NextEventCard({
  event,
  busy,
  onPlay,
  onJoinEvent,
  onChange,
}: {
  event: EventView
  busy: boolean
  onPlay: (g: GameId) => void
  onJoinEvent: (id: string) => void
  onChange: () => void
}) {
  const now = useNow(1000)
  const isLive = event.status === 'LIVE'
  const left = Math.max(0, Math.floor((event.startsAt - now) / 1000))
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60]
  const action = eventAction(event)
  const run = () => {
    if (action.kind === 'join') onJoinEvent(event.id)
    else if (action.kind === 'register') registerEvent(event.id, onChange)
    else if (action.kind === 'queue') onPlay(event.gameId)
  }
  return (
    <section aria-label="Próxima partida" className="relative w-full shrink-0 border border-[#6f8cff]/35 bg-[#0b0e22]/90 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-sm @2xl:w-72">
      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/50">{isLive ? 'Acontecendo agora' : 'Próxima partida'}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden border border-[#6f8cff]/40">
          <Image src={GAMES[event.gameId].thumbnail} alt="" fill sizes="44px" className="object-cover object-[78%_center]" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold uppercase leading-tight tracking-[0.08em]">{event.label ?? GAMES[event.gameId].name}</p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">{eventTimeLabel(event.startsAt)}</p>
        </div>
      </div>
      {isLive ? (
        <p className="mt-3 flex items-center gap-2 font-mono text-2xl font-semibold tracking-wider text-[#b8c6ff] [text-shadow:0_0_14px_rgba(143,166,255,0.8)]">
          <Radio className="size-5 animate-pulse" aria-hidden="true" />
          AO VIVO
        </p>
      ) : (
        <div className="mt-3 flex items-start gap-1.5 font-mono text-3xl font-semibold tabular-nums leading-none" aria-label={`Começa em ${formatCountdown(event.startsAt - now)}`}>
          {parts.map((v, i) => (
            <div key={i} className="contents">
              {i > 0 && <span className="text-[#6f8cff]/60">:</span>}
              <div className="flex flex-col items-center">
                <span>{String(v).padStart(2, '0')}</span>
                <span className="mt-1.5 font-sans text-[8px] font-medium tracking-[0.25em] text-foreground/40">{['HORAS', 'MIN', 'SEG'][i]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={busy || action.kind === 'done'}
        onClick={run}
        className={cn(
          'mt-3 w-full border px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.25em] transition-colors disabled:cursor-default',
          action.kind === 'done'
            ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
            : 'border-[#6f8cff] bg-[linear-gradient(#22307a,#18205c)] text-white hover:bg-[linear-gradient(#2c3ca8,#1d2874)] disabled:opacity-50',
        )}
      >
        {action.label}
      </button>
    </section>
  )
}

function GameCard({
  gameId,
  best,
  event,
  busy,
  onPlay,
  onTutorial,
}: {
  gameId: GameId
  best: number
  event?: EventView
  busy: boolean
  onPlay: () => void
  onTutorial: () => void
}) {
  const g = GAMES[gameId]
  const soon = g.status === 'em-breve'
  // Duas coisas diferentes no mesmo card: o EVENTO agendado da semana (com inscrição) e a PARTIDA
  // LIVRE (fila casual, botão Jogar). Antes o "Em breve" do evento aparecia colado ao Jogar ativo.
  const eventStatus = !event
    ? { text: 'Nenhum evento esta semana', cls: 'text-foreground/45', icon: null }
    : event.status === 'LIVE'
      ? { text: 'Ao vivo', cls: 'text-[#b8c6ff]', icon: Radio }
      : event.joined
        ? { text: 'Inscrito', cls: 'text-emerald-300', icon: null }
        : event.status === 'REGISTRATION'
          ? { text: 'Inscrições abertas', cls: 'text-[#8fa6ff]', icon: null }
          : { text: 'Inscrições ainda fechadas', cls: 'text-foreground/50', icon: Lock }
  return (
    <article className="group relative flex flex-col overflow-hidden border border-[#6f8cff]/25 bg-[#080a14] transition-all hover:-translate-y-0.5 hover:border-[#6f8cff]/70 hover:shadow-[0_10px_30px_rgba(111,140,255,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-[#6f8cff]/20">
        <Image
          src={g.thumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 220px, 50vw"
          className="origin-[72%_50%] scale-[1.16] object-cover object-right transition-transform duration-500 group-hover:scale-[1.2]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,#080a14_0%,rgba(8,10,20,0)_45%)]" />
      </div>
      <div className="flex flex-1 flex-col p-3 pt-2.5">
      <h4 className="font-display text-base font-semibold uppercase leading-tight tracking-[0.08em] text-balance">{g.name}</h4>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className="border border-foreground/20 bg-black/50 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-foreground/70">{g.players} jogadores</span>
        <span className="border border-foreground/20 bg-black/50 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-foreground/70">~{Math.max(1, Math.round(g.durationSec / 60))} min</span>
      </div>
      <div className="mt-2 border-l border-foreground/15 pl-2" aria-label="Próximo evento">
        <p className="text-[9px] uppercase tracking-[0.22em] text-foreground/40">Próximo evento</p>
        {event && <p className="font-mono text-[10px] tracking-[0.18em] text-foreground/55">{eventTimeLabel(event.startsAt)}</p>}
        <p className={cn('flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em]', eventStatus.cls)}>
          {eventStatus.icon && <eventStatus.icon className="size-3" aria-hidden="true" />}
          {eventStatus.text}
        </p>
      </div>
      <p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-foreground/40">
        Partida livre · {soon ? <span className="text-foreground/60">Em breve</span> : `Melhor: ${formatPoints(best)}`}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          disabled={busy || soon}
          onClick={onPlay}
          className="flex flex-1 items-center justify-center gap-1.5 border border-[#6f8cff]/70 bg-[#1647ff]/15 px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9d4ff] transition-colors hover:bg-[#1647ff]/30 disabled:opacity-50"
        >
          <Users className="size-3" aria-hidden="true" />
          {soon ? 'Em breve' : 'Jogar'}
        </button>
        <button
          type="button"
          disabled={busy || soon}
          onClick={onTutorial}
          className="px-1 py-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground/50 underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Tutorial
        </button>
      </div>
      </div>
    </article>
  )
}

function LivePanel({ event, onMore }: { event: EventView | null; onMore: () => void }) {
  const now = useNow(1000)
  if (!event) {
    return (
      <Panel title="Na agenda" action={<MoreLink label="Agenda" onClick={onMore} />}>
        <p className="text-sm text-foreground/45">Nenhuma partida programada nesta semana.</p>
      </Panel>
    )
  }
  const isLive = event.status === 'LIVE'
  const pct = Math.min(100, Math.round((event.entries / Math.max(1, event.maxPlayers)) * 100))
  return (
    <Panel title={isLive ? 'Ao vivo agora' : 'Na agenda'} live={isLive} action={<MoreLink label="Agenda" onClick={onMore} />}>
      <div className="relative mb-3 h-24 overflow-hidden border border-[#6f8cff]/20">
        <Image src={GAMES[event.gameId].thumbnail} alt="" fill sizes="280px" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(7,8,18,0.95),transparent)] px-2 pb-1.5 pt-6 text-center font-display text-xs font-semibold uppercase tracking-[0.1em]">
          {event.label ?? GAMES[event.gameId].name} <span className="text-foreground/50">#{String(event.number).padStart(3, '0')}</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="border border-foreground/10 bg-black/40 px-2 py-1.5">
          <dt className="text-[9px] uppercase tracking-[0.25em] text-foreground/45">Jogadores</dt>
          <dd className="font-mono tabular-nums">
            {event.entries}/{event.maxPlayers}
          </dd>
        </div>
        <div className="border border-foreground/10 bg-black/40 px-2 py-1.5">
          <dt className="text-[9px] uppercase tracking-[0.25em] text-foreground/45">{isLive ? 'Status' : 'Começa em'}</dt>
          <dd className={cn('font-mono tabular-nums', isLive && 'text-[#b8c6ff]')}>{isLive ? 'em jogo' : formatCountdown(event.startsAt - now)}</dd>
        </div>
      </dl>
      <div className="mt-2 h-1 bg-foreground/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Vagas preenchidas">
        <div className="h-full bg-gradient-to-r from-[#3446d6] to-[#8fa6ff]" style={{ width: `${pct}%` }} />
      </div>
      {event.reward.hours ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-foreground/60">
          <Hourglass className="size-3 text-[#8fa6ff]" aria-hidden="true" />
          Prêmio: <span className="font-mono text-[#8fa6ff]">+{event.reward.hours}h de Tempo</span>
        </p>
      ) : null}
    </Panel>
  )
}

function OddsBar({ a, b, thin }: { a: number; b: number; thin?: boolean }) {
  return (
    <div>
      <div className={cn('mb-1 flex justify-between font-mono font-semibold tabular-nums', thin ? 'text-[11px]' : 'text-sm')}>
        <span className="text-[#8fa6ff]">{a}%</span>
        <span className="text-[#c9a8f0]">{b}%</span>
      </div>
      <div className={cn('relative overflow-hidden bg-[#7a5cb8]', thin ? 'h-1' : 'h-2')}>
        <div className="h-full bg-gradient-to-r from-[#3446d6] to-[#8fa6ff] transition-[width] duration-500" style={{ width: `${a}%` }} />
      </div>
    </div>
  )
}

function FeaturedDuel({ item, loading, onBet }: { item: { duel: Duel; event: BetBoard['events'][number] } | null; loading: boolean; onBet: (d: Duel, pick: string) => void }) {
  if (!item) {
    return (
      <Panel title="Confronto em destaque">
        <p className={cn('text-sm text-foreground/45', loading && 'animate-pulse')}>
          {loading ? 'Abrindo o livro…' : 'Nenhum confronto aberto para apostas. Quando uma partida fechar as inscrições, os duelos aparecem aqui.'}
        </p>
      </Panel>
    )
  }
  const { duel, event } = item
  const [a, b] = duel.sides
  const bettors = a.bettors + b.bettors
  return (
    <Panel title="Confronto em destaque" live={event.status === 'LIVE'}>
      <p className="-mt-1 mb-3 font-display text-sm font-semibold uppercase tracking-[0.08em]">
        {GAMES[event.gameId].name} <span className="text-foreground/45">#{String(event.number).padStart(3, '0')}</span>
      </p>
      <div className="relative mb-3 grid grid-cols-2">
        {[a, b].map((s, i) => (
          <div
            key={s.name}
            className={cn(
              'flex min-w-0 items-center gap-2.5 border p-2.5',
              i === 0 ? 'border-[#3446d6]/60 bg-[linear-gradient(90deg,rgba(52,70,214,0.22),transparent)]' : 'flex-row-reverse border-[#7a5cb8]/60 bg-[linear-gradient(270deg,rgba(122,92,184,0.22),transparent)] text-right',
            )}
          >
            <Monogram name={s.name} size="lg" me={s.isMe} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-wide">{s.name}</p>
              <p className="font-mono text-[11px] text-foreground/50">{s.odds.toFixed(2)}x</p>
            </div>
          </div>
        ))}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-foreground/20 bg-[#070812] px-1.5 py-0.5 font-serif text-xs tracking-widest">VS</span>
      </div>
      <OddsBar a={a.pct} b={b.pct} />
      <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-foreground/45">
        {bettors} {bettors === 1 ? 'apostador' : 'apostadores'}
      </p>
      {duel.myBet ? (
        <p className="mt-3 border border-[#6f8cff]/30 bg-[#6f8cff]/5 px-3 py-2 text-xs text-foreground/70">
          Você apostou <strong className="font-mono text-[#8fa6ff]">{formatMinutes(duel.myBet.amount)}</strong> em {duel.myBet.pick}.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[a, b].map((s, i) => (
            <button
              key={s.name}
              type="button"
              disabled={s.isMe}
              onClick={() => onBet(duel, s.name)}
              className={cn(
                'truncate border px-2 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition-colors disabled:opacity-40',
                i === 0 ? 'border-[#4c63ff] bg-[linear-gradient(#233088,#18205e)] enabled:hover:bg-[linear-gradient(#2c3cae,#1d2874)]' : 'border-[#9a7ad8] bg-[linear-gradient(#4a3488,#2e2160)] enabled:hover:bg-[linear-gradient(#5a40a6,#382874)]',
              )}
            >
              {s.isMe ? 'Você' : `Apostar em ${s.name}`}
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}

const MEDAL = ['border-[#d9c48a] text-[#e8d7a6]', 'border-[#8fa6ff] text-[#b8c6ff]', 'border-[#c9a8f0] text-[#dcc6f6]']

function RankingPanel({ data, onMore }: { data: Dashboard; onMore: () => void }) {
  const rows = data.leaderboard.slice(0, 8)
  const top = rows.slice(0, 3)
  const rest = rows.slice(3)
  const meOutside = data.me.rank && data.me.rank > 8
  return (
    <Panel title="Ranking da semana" action={<MoreLink label="Completo" onClick={onMore} />}>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/45">Ninguém pontuou nesta semana ainda.</p>
      ) : (
        <>
          <ol className="flex flex-col gap-1.5">
            {top.map((r, i) => (
              <li
                key={r.name}
                className={cn(
                  'flex items-center gap-2.5 border px-2 py-1.5',
                  i === 0 ? 'border-[#d9c48a]/40 bg-[linear-gradient(90deg,rgba(217,196,138,0.14),transparent)]' : 'border-foreground/10 bg-black/40',
                  r.isMe && 'border-[#6f8cff]/60',
                )}
              >
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border-2 font-serif text-xs', MEDAL[i])}>{r.rank}</span>
                <Monogram name={r.name} size="sm" me={r.isMe} />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-xs font-medium tracking-wide', r.isMe && 'text-[#8fa6ff]')}>{r.isMe ? `${r.name} (você)` : r.name}</p>
                  <p className="text-[10px] text-foreground/45">{r.wins} vitórias</p>
                </div>
                {i === 0 ? <Crown className="size-3.5 text-[#e8d7a6]" aria-label="Líder" /> : r.wins >= 3 ? <Flame className="size-3.5 text-[#8fa6ff]" aria-label="Em sequência" /> : null}
                <span className="font-mono text-xs tabular-nums">{formatPoints(r.score)}</span>
              </li>
            ))}
          </ol>
          {rest.length > 0 && (
            <ol className="mt-2 divide-y divide-foreground/5" start={4}>
              {rest.map((r) => (
                <li key={r.name} className={cn('grid grid-cols-[1.5rem_1fr_auto] gap-2 px-1.5 py-1.5 text-xs', r.isMe ? 'bg-[#6f8cff]/10 text-foreground' : 'text-foreground/70')}>
                  <span className="font-mono text-foreground/40">{r.rank}</span>
                  <span className="truncate">{r.isMe ? `${r.name} (você)` : r.name}</span>
                  <span className="font-mono tabular-nums text-foreground/60">{formatPoints(r.score)}</span>
                </li>
              ))}
            </ol>
          )}
          {meOutside && (
            <p className="mt-1 grid grid-cols-[1.5rem_1fr_auto] gap-2 bg-[#6f8cff]/10 px-1.5 py-1.5 text-xs">
              <span className="font-mono text-foreground/50">{data.me.rank}</span>
              <span className="truncate">{data.me.name} (você)</span>
              <span className="font-mono tabular-nums">{formatPoints(data.me.score)}</span>
            </p>
          )}
        </>
      )}
    </Panel>
  )
}

function OpenBets({
  items,
  loading,
  onBet,
  onMore,
}: {
  items: { duel: Duel; event: BetBoard['events'][number] }[]
  loading: boolean
  onBet: (d: Duel, pick: string) => void
  onMore: () => void
}) {
  return (
    <Panel title="Apostas em andamento" action={<MoreLink label="Todas" onClick={onMore} />}>
      {items.length === 0 ? (
        <p className={cn('text-sm text-foreground/45', loading && 'animate-pulse')}>{loading ? 'Abrindo o livro…' : 'Nenhum outro duelo aberto agora.'}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(({ duel, event }) => {
            const [a, b] = duel.sides
            const target = [a, b].find((s) => !s.isMe) ?? a
            return (
              <li key={duel.id} className="border border-foreground/10 bg-black/40 p-2.5">
                <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#8fa6ff]">
                  {GAMES[event.gameId].name} · duelo {duel.slot + 1}
                </p>
                <p className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-foreground/35">VS</span>
                  <span className="truncate text-right">{b.name}</span>
                </p>
                <OddsBar a={a.pct} b={b.pct} thin />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-foreground/50">
                    {a.odds.toFixed(2)}x · {b.odds.toFixed(2)}x
                  </span>
                  {duel.myBet ? (
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#8fa6ff]">
                      {formatMinutes(duel.myBet.amount)} em {duel.myBet.pick}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBet(duel, target.name)}
                      className="border border-[#6f8cff]/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#c9d4ff] hover:bg-[#6f8cff]/15"
                    >
                      Apostar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function RecentPanel({ data }: { data: Dashboard }) {
  return (
    <Panel title="Suas últimas partidas">
      {data.recent.length === 0 ? (
        <p className="text-sm text-foreground/45">Nenhuma partida ainda. A mesa está esperando.</p>
      ) : (
        <ul className="divide-y divide-foreground/5">
          {data.recent.slice(0, 6).map((r) => (
            <li key={r.id} className="flex items-center gap-2.5 py-1.5 text-xs">
              <span
                className={cn(
                  'w-14 shrink-0 text-[10px] font-medium uppercase tracking-[0.15em]',
                  r.result === 'win' ? 'text-emerald-300' : r.result === 'draw' ? 'text-foreground/55' : 'text-[#c9a8f0]',
                )}
              >
                {r.result === 'win' ? 'Vitória' : r.result === 'draw' ? 'Empate' : 'Derrota'}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {GAMES[r.gameId].name} <span className="text-foreground/40">vs {r.opponent}</span>
              </span>
              <span className="font-mono tabular-nums text-foreground/65">{formatPoints(r.score)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** Abre a ficha de aposta para um duelo; devolve o gatilho e o nó a renderizar. */
export function useBetSheet(onDone: () => void) {
  const [target, setTarget] = useState<{ duel: Duel; pick: string } | null>(null)
  return {
    open: (duel: Duel, pick: string) => {
      playSfx('click')
      setTarget({ duel, pick })
    },
    node: target ? <BetSheet duel={target.duel} pick={target.pick} onPick={(pick) => setTarget({ ...target, pick })} onClose={() => setTarget(null)} onDone={onDone} /> : null,
  }
}

function BetSheet({ duel, pick, onPick, onClose, onDone }: { duel: Duel; pick: string; onPick: (p: string) => void; onClose: () => void; onDone: () => void }) {
  const { state } = useDevo()
  const now = useNow(1000)
  const applyTime = useApplyTime()
  const remainingMin = Math.floor(Math.max(0, state.timerEndsAt - now) / 60_000)
  const affordable = (v: number) => remainingMin - v >= BET_RESERVE_MIN
  const [amount, setAmount] = useState(() => BET_OPTIONS.find(affordable) ?? BET_OPTIONS[0])
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const side = duel.sides.find((s) => s.name === pick) ?? duel.sides[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const confirm = async () => {
    if (!affordable(amount)) return setError(`Você precisa manter ao menos ${BET_RESERVE_MIN}min no relógio.`)
    setSending(true)
    setError('')
    try {
      applyTime(await arcadePost<{ timeDeltaMs?: number }>({ action: 'bet', duelId: duel.id, pick: side.name, amount }))
      playSfx('send')
      onDone()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[#02030a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bet-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-[#6f8cff]/40 bg-[linear-gradient(170deg,#11143a,#0a0b1c)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        <h3 id="bet-title" className="font-display text-lg font-semibold uppercase tracking-[0.08em]">
          Apostar Tempo
        </h3>
        <p className="mt-1 text-xs text-foreground/55">Escolha o lado e quanto do seu relógio está disposto a arriscar.</p>

        <div role="radiogroup" aria-label="Lado" className="mt-4 grid grid-cols-2 gap-2">
          {duel.sides.map((s) => (
            <button
              key={s.name}
              type="button"
              role="radio"
              aria-checked={s.name === side.name}
              disabled={s.isMe}
              onClick={() => onPick(s.name)}
              className={cn(
                'flex flex-col items-center gap-0.5 border px-2 py-2 transition-colors disabled:opacity-40',
                s.name === side.name ? 'border-[#8fa6ff] bg-[#6f8cff]/15' : 'border-foreground/15 enabled:hover:border-[#6f8cff]/60',
              )}
            >
              <span className="max-w-full truncate text-sm">{s.name}</span>
              <span className="font-mono text-base text-[#8fa6ff]">{s.odds.toFixed(2)}x</span>
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Valor" className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {BET_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={amount === v}
              disabled={!affordable(v)}
              onClick={() => setAmount(v)}
              className={cn(
                'border py-2 font-mono text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                amount === v ? 'border-[#8fa6ff] bg-[#2a3190] text-white' : 'border-foreground/15 bg-black/40 text-[#c9d4ff] enabled:hover:border-[#6f8cff]/60',
              )}
            >
              {formatMinutes(v)}
            </button>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div className="border border-foreground/10 bg-black/40 px-3 py-2">
            <dt className="text-[9px] uppercase tracking-[0.25em] text-foreground/45">Seu Tempo</dt>
            <dd className="font-mono text-base">{formatMinutes(remainingMin)}</dd>
          </div>
          <div className="border border-foreground/10 bg-black/40 px-3 py-2">
            <dt className="text-[9px] uppercase tracking-[0.25em] text-foreground/45">Retorno se ganhar</dt>
            <dd className="font-mono text-base text-[#8fa6ff]">+{formatMinutes(Math.round(amount * side.odds))}</dd>
          </div>
        </dl>

        <p className="mt-3 border border-[#c9a8f0]/30 bg-[#c9a8f0]/5 px-3 py-2 text-[11px] leading-relaxed text-foreground/65">
          O Tempo apostado sai do seu pulso na hora. Se {side.name} perder, ele some. Se ganhar, volta multiplicado pela odd.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-xs text-[#c9a8f0]">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border border-foreground/25 py-2.5 text-[11px] uppercase tracking-[0.25em] text-foreground/70 hover:text-foreground">
            Cancelar
          </button>
          <button
            type="button"
            disabled={sending || side.isMe}
            onClick={confirm}
            className="flex-1 border border-[#6f8cff] bg-[linear-gradient(#22307a,#18205c)] py-2.5 text-[11px] uppercase tracking-[0.25em] text-white hover:bg-[linear-gradient(#2c3ca8,#1d2874)] disabled:opacity-50"
          >
            {sending ? 'Apostando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
