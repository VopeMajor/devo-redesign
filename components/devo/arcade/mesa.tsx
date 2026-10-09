'use client'

import Image from 'next/image'
import { type CSSProperties, useState } from 'react'
import useSWR from 'swr'
import {
  Badge,
  type BadgeTone,
  Button,
  Countdown,
  Frame,
  GlyphCard,
  GlyphCheck,
  GlyphDiamond,
  GlyphKeyhole,
  GlyphSpark,
  Kicker,
  SectionHeader,
  toRoman,
} from '@/components/devo/kit'
import { type BetBoard, type Dashboard, arcadeFetcher, arcadeKey, arcadePost, formatCountdown, formatPoints } from '@/lib/devo/arcade/client'
import { GAMES, type GameId, rewardParts } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { ArcadeChat } from './arcade-chat'
import { type ArcadeView, eventTimeLabel, formatMinutes, registerEvent, useApplyTime } from './arcade-shared'
import { type Duel, useBetSheet } from './bet-sheet'
import { GAME_ART, JavaliPortrait, Monogram, MoreLink, OddsBar } from './sala-ui'

export { useBetSheet, type Duel }

type EventView = Dashboard['events'][number]
type BetEvent = BetBoard['events'][number]

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
  const [claiming, setClaiming] = useState(false)

  const claim = async () => {
    setClaiming(true)
    try {
      applyTime(await arcadePost<{ timeDeltaMs?: number }>({ action: 'claim' }))
      playSfx('confirm')
      onChange()
    } catch (e) {
      playSfx('error')
      window.alert((e as Error).message)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="@container flex flex-col gap-5">
      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Hero event={next} busy={busy} onPlay={onPlay} onJoinEvent={onJoinEvent} onChange={onChange} onAgenda={() => onView('agenda')} />
          <HostStrip />

          {data.claim && (
            <Frame tone="gold" glow pad="md" className="animate-dv-rise">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Kicker tone="gold">Recompensa da semana</Kicker>
                  <p className="mt-1.5 font-body text-[15px] leading-snug text-dv-text-2">
                    Você terminou a semana passada em <strong className="font-impact text-[18px] text-dv-gold-bright">#{data.claim.rank}</strong>. Há uma recompensa
                    esperando.
                  </p>
                </div>
                <Button size="sm" loading={claiming} onClick={claim}>
                  Resgatar
                </Button>
              </div>
            </Frame>
          )}

          <div>
            <SectionHeader index="I" kicker="Partida livre · evento · treino" title="Jogos da semana" size="sm" as="h3" className="mb-4" />
            <section aria-label="Jogos da semana" className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
              {(Object.keys(GAMES) as GameId[]).map((g, i) => (
                <GameCard
                  key={g}
                  index={i + 1}
                  gameId={g}
                  best={data.me.best[g] ?? 0}
                  event={data.events.find((e) => e.gameId === g && e.status !== 'FINISHED')}
                  busy={busy}
                  onPlay={() => onPlay(g)}
                  onTutorial={() => onTutorial(g)}
                />
              ))}
            </section>
          </div>

          <div className="grid gap-6 @2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <FeaturedDuel item={featured} loading={!bets} onBet={sheet.open} onMore={() => onView('apostas')} />
            <RankingPanel data={data} onMore={() => onView('ranking')} />
          </div>

          <div className="grid gap-6 @2xl:grid-cols-2">
            {openDuels.length > 1 && <OpenBets items={openDuels.slice(1, 4)} onBet={sheet.open} onMore={() => onView('apostas')} />}
            <RecentPanel data={data} />
          </div>
        </div>

        <Frame as="section" aria-label="Chat da mesa" pad="md" className="flex min-w-0 flex-col @4xl:self-start">
          <SectionHeader kicker="Ao vivo na sala" title="Chat da mesa" size="sm" as="h3" className="mb-3" />
          <ArcadeChat channel="lobby" className="h-[20rem] min-h-0" />
        </Frame>
      </div>
      {sheet.node}
    </div>
  )
}

/* ── Anfitrião ─────────────────────────────────────────────────────────────────────── */

function HostStrip() {
  const [line] = useState(() => HOST_LINES[Math.floor(Math.random() * HOST_LINES.length)])
  return (
    <div className="flex animate-dv-fade items-center gap-4">
      <JavaliPortrait className="w-[96px]" />
      <div className="min-w-0 flex-1">
        <p className="dv-label flex flex-wrap items-center gap-x-2 text-[10px] text-dv-gold">
          <span>Javali · anfitrião</span>
          <span className="text-dv-text-3">Jogue. Aposte. Sobreviva.</span>
        </p>
        <p className="mt-1.5 font-body text-[17px] italic leading-snug text-dv-text">“{line}”</p>
      </div>
    </div>
  )
}

/* ── Cartaz-herói: próxima partida ─────────────────────────────────────────────────── */

function eventAction(e: EventView) {
  if (e.status === 'LIVE' && e.joined) return { label: 'Jogar agora', kind: 'join' as const }
  if (e.status === 'REGISTRATION' && !e.joined) return { label: 'Inscrever-se', kind: 'register' as const }
  if (e.status === 'REGISTRATION' && e.joined) return { label: 'Inscrito', kind: 'done' as const }
  return { label: 'Jogar online', kind: 'queue' as const }
}

export function eventBadge(e: EventView): { text: string; tone: BadgeTone; live?: boolean } {
  if (e.status === 'LIVE') return { text: 'Ao vivo', tone: 'cobalt', live: true }
  if (e.joined && e.status === 'REGISTRATION') return { text: 'Inscrito', tone: 'cobalt' }
  if (e.status === 'REGISTRATION') return { text: 'Inscrições abertas', tone: 'cobalt' }
  if (e.status === 'LOCKED') return { text: 'Apostas abertas', tone: 'gold' }
  if (e.status === 'FINISHED') return { text: 'Encerrada', tone: 'neutral' }
  return { text: 'Em breve', tone: 'neutral' }
}

function Hero({
  event,
  busy,
  onPlay,
  onJoinEvent,
  onChange,
  onAgenda,
}: {
  event: EventView | null
  busy: boolean
  onPlay: (g: GameId) => void
  onJoinEvent: (id: string) => void
  onChange: () => void
  onAgenda: () => void
}) {
  const now = useNow(1000)
  if (!event) {
    return (
      <Frame as="section" aria-label="Próxima partida" tone="gold" ornate pad="lg" className="animate-dv-cut-in">
        <Kicker tone="gold">Próxima partida</Kicker>
        <p className="mt-3 font-body text-[16px] leading-relaxed text-dv-text-2">Nenhuma partida programada nesta semana. A mesa descansa — por enquanto.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onAgenda}>
          Ver agenda
        </Button>
      </Frame>
    )
  }
  const g = GAMES[event.gameId]
  const isLive = event.status === 'LIVE'
  const action = eventAction(event)
  const badge = eventBadge(event)
  const left = event.startsAt - now
  const long = left >= 99 * 3_600_000
  const pct = Math.min(100, Math.round((event.entries / Math.max(1, event.maxPlayers)) * 100))
  const prize = rewardParts(event.reward)
  const run = () => {
    if (action.kind === 'join') onJoinEvent(event.id)
    else if (action.kind === 'register') registerEvent(event.id, onChange)
    else if (action.kind === 'queue') onPlay(event.gameId)
  }
  return (
    <Frame as="section" aria-label="Próxima partida" tone="gold" ornate glow pad="none" cutSize={16} className="animate-dv-cut-in">
      {/* banner do jogo, cortado em diagonal */}
      <div
        className="relative m-[3px] mb-0 h-32 overflow-hidden [clip-path:polygon(15px_0,calc(100%-15px)_0,100%_15px,100%_76%,0_100%,0_15px)] @2xl:h-48"
      >
        <Image src={GAME_ART[event.gameId].src} alt="" fill priority sizes="(min-width: 1024px) 680px, 100vw" className="object-cover" style={{ objectPosition: GAME_ART[event.gameId].position }} />
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.25)_0%,rgba(5,7,13,0.2)_50%,var(--dv-ink-2)_100%)]" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <Badge tone={badge.tone} live={badge.live} dot={!badge.live}>
            {badge.text}
          </Badge>
          <span className="dv-label bg-dv-ink/70 px-2 py-1 text-[10px] text-dv-text-2">Nº {String(event.number).padStart(3, '0')}</span>
        </div>
      </div>

      <div className="relative -mt-3 px-5 pb-5">
        <div className="flex items-center justify-between gap-2">
          <Kicker tone="gold">{isLive ? 'Acontecendo agora' : 'Próxima partida'}</Kicker>
          <MoreLink label="Agenda" onClick={onAgenda} />
        </div>
        <h3 className="relative mt-0.5 w-fit max-w-full">
          <span aria-hidden="true" className="absolute -left-2 bottom-[10%] h-[32%] w-[calc(100%+1rem)] -skew-x-[18deg] bg-dv-cobalt-deep/90" />
          <span className="relative block font-impact text-[40px] font-bold uppercase leading-[0.9] tracking-[0.01em] text-dv-text [text-shadow:0_2px_0_rgba(0,0,0,0.5)] @2xl:text-[52px]">
            {event.label ?? g.name}
          </span>
        </h3>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3 font-body text-[15px] italic leading-snug text-dv-text-2">
          <span className="dv-label not-italic text-[11px] text-dv-text">{eventTimeLabel(event.startsAt)}</span>
          {g.tagline}
        </p>

        <div className="mt-4">
          {isLive ? (
            <p className="flex items-center gap-3 font-impact text-[40px] font-bold uppercase leading-none text-dv-cobalt-text [text-shadow:0_0_18px_rgba(138,124,200,0.6)]">
              <span aria-hidden="true" className="size-3 animate-dv-blink rounded-full bg-dv-cobalt shadow-[0_0_14px_var(--dv-cobalt)]" />
              Ao vivo
            </p>
          ) : (
            <>
              <p className="dv-label mb-1.5 text-[10px] text-dv-text-3">Começa em</p>
              <Countdown
                endsAt={event.startsAt}
                size="lg"
                units={!long}
                sound={false}
                criticalMs={15 * 60_000}
                label="Começa em"
                render={long ? (ms) => formatCountdown(ms) : undefined}
              />
            </>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-dv-line pt-3">
          <div>
            <dt className="dv-label text-[10px] text-dv-text-3">Jogadores</dt>
            <dd className="mt-1 font-impact text-[22px] font-semibold leading-none dv-tabular">
              {event.entries}
              <span className="text-dv-text-3">/{event.maxPlayers}</span>
            </dd>
            <dd className="mt-2 h-1 bg-dv-ink-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Vagas preenchidas">
              <span className="block h-full bg-[linear-gradient(90deg,var(--dv-cobalt-deep),var(--dv-cobalt-text))]" style={{ width: `${pct}%` }} />
            </dd>
          </div>
          <div>
            <dt className="dv-label text-[10px] text-dv-text-3">Prêmio</dt>
            <dd className="mt-1 font-body text-[15px] leading-snug text-dv-gold-bright">{prize.length ? prize.join(' · ') : 'Pontos de ranking'}</dd>
          </div>
        </dl>

        <Button block size="lg" className="mt-4" disabled={busy || action.kind === 'done'} onClick={run} sfx={action.kind === 'register' ? 'confirm' : 'click'} icon={action.kind === 'done' ? <GlyphCheck /> : undefined}>
          {action.label}
        </Button>
      </div>
    </Frame>
  )
}

/* ── Cartas dos jogos ──────────────────────────────────────────────────────────────── */

function GameCard({
  index,
  gameId,
  best,
  event,
  busy,
  onPlay,
  onTutorial,
}: {
  index: number
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
    ? { text: 'Nenhum evento esta semana', cls: 'text-dv-text-3', locked: false }
    : event.status === 'LIVE'
      ? { text: 'Ao vivo', cls: 'text-dv-cobalt-text', locked: false }
      : event.joined
        ? { text: 'Inscrito', cls: 'text-dv-cobalt-text', locked: false }
        : event.status === 'REGISTRATION'
          ? { text: 'Inscrições abertas', cls: 'text-dv-cobalt-text', locked: false }
          : event.status === 'LOCKED'
            ? { text: 'Inscrições encerradas', cls: 'text-dv-text-2', locked: true }
            : { text: 'Inscrições ainda fechadas', cls: 'text-dv-text-2', locked: true }
  return (
    <article
      className="group relative isolate flex min-w-0 animate-dv-fade flex-col transition-transform duration-300 hover:-translate-y-1"
      style={{ '--dv-cut': '14px', animationDelay: `${120 + index * 70}ms` } as CSSProperties}
    >
      {/* moldura metálica da carta */}
      <span aria-hidden="true" className="dv-cut absolute inset-0 -z-10 bg-[linear-gradient(155deg,var(--dv-gold-bright)_0%,var(--dv-gold-deep)_22%,#2b2416_48%,var(--dv-gold-deep)_74%,var(--dv-gold)_100%)] transition-[filter] duration-300 group-hover:brightness-125" />
      <span
        aria-hidden="true"
        className="dv-cut absolute inset-[2px] -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3)_0%,var(--dv-ink-2)_45%,var(--dv-ink)_100%)]"
        style={{ '--dv-cut': '13px' } as CSSProperties}
      />

      <div className="dv-cut relative m-[5px] mb-0 aspect-[4/3] overflow-hidden" style={{ '--dv-cut': '10px' } as CSSProperties}>
        <Image
          src={GAME_ART[gameId].src}
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          style={{ objectPosition: GAME_ART[gameId].position }}
        />
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,var(--dv-ink-2)_0%,rgba(10,15,28,0)_55%)]" />
        {/* índice de canto, como numa carta */}
        <span aria-hidden="true" className="absolute left-2 top-1.5 flex flex-col items-center leading-none text-dv-gold-bright [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
          <span className="font-impact text-[20px] font-semibold">{toRoman(index)}</span>
          <GlyphDiamond filled className="mt-0.5 size-2.5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <h4 className="font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text">{g.name}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <dt className="dv-label text-[10px] tracking-[0.12em] text-dv-text-3">Jogadores</dt>
            <dd className="font-impact text-[17px] font-semibold leading-tight dv-tabular">{g.players}</dd>
          </div>
          <div>
            <dt className="dv-label text-[10px] tracking-[0.12em] text-dv-text-3">Duração</dt>
            <dd className="font-impact text-[17px] font-semibold leading-tight dv-tabular">~{Math.max(1, Math.round(g.durationSec / 60))} min</dd>
          </div>
        </dl>

        <div className="mt-2.5 border-t border-dv-line pt-2" aria-label="Próximo evento">
          <p className="dv-label text-[10px] tracking-[0.12em] text-dv-gold">Próximo evento</p>
          {event && <p className="mt-0.5 font-mono text-[12px] tracking-[0.1em] text-dv-text">{eventTimeLabel(event.startsAt)}</p>}
          <p className={cn('mt-0.5 flex items-start gap-1 font-mono text-[11px] uppercase leading-snug tracking-[0.06em]', eventStatus.cls)}>
            {eventStatus.locked && <GlyphKeyhole className="mt-px size-3 shrink-0" />}
            {event?.status === 'LIVE' && <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 animate-dv-blink rounded-full bg-current" />}
            <span>{eventStatus.text}</span>
          </p>
        </div>

        <div className="mt-2 border-t border-dashed border-dv-line pt-2" aria-label="Partida livre">
          <p className="dv-label text-[10px] tracking-[0.12em] text-dv-cobalt-text">Partida livre</p>
          <p className="mt-0.5 font-mono text-[12px] tracking-[0.04em] text-dv-text-2">{soon ? 'Em breve' : `Melhor: ${formatPoints(best)}`}</p>
        </div>

        <div className="mt-auto flex flex-col gap-1 pt-3">
          <Button size="sm" block disabled={busy || soon} onClick={onPlay} sfx="click">
            {soon ? 'Em breve' : 'Jogar'}
          </Button>
          <Button size="sm" variant="ghost" block disabled={busy || soon} onClick={onTutorial} sfx="click" icon={<GlyphCard />}>
            Tutorial
          </Button>
        </div>
      </div>
    </article>
  )
}

/* ── Confronto em destaque ─────────────────────────────────────────────────────────── */

export function fmtOdds(o: number) {
  return `${o.toFixed(2).replace('.', ',')}×`
}

/** Dois lados em corte diagonal, cada um é o botão de aposta daquele lado. */
export function VsSplit({ duel, onBet, big = false, closed = false }: { duel: Duel; onBet: (d: Duel, pick: string) => void; big?: boolean; closed?: boolean }) {
  const [a, b] = duel.sides
  const locked = !!duel.myBet || !!duel.winner || closed
  return (
    <div className="relative grid grid-cols-2">
      {[a, b].map((s, i) => {
        const left = i === 0
        const won = duel.winner === s.name
        const lost = !!duel.winner && !won
        return (
          <button
            key={s.name}
            type="button"
            disabled={s.isMe || locked}
            onClick={() => onBet(duel, s.name)}
            aria-label={s.isMe ? `${s.name} (você)` : `Apostar em ${s.name}, odd ${s.odds.toFixed(2)}`}
            className={cn(
              'dv-focus group relative isolate flex min-w-0 flex-col gap-1.5 py-3 transition-[filter] duration-200 enabled:active:brightness-125 disabled:cursor-default',
              left ? 'items-start pl-3 pr-6 text-left' : 'items-end pl-6 pr-3 text-right',
              big ? 'min-h-[148px]' : 'min-h-[120px]',
              lost && 'opacity-50',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-0 -z-10',
                left
                  ? '[clip-path:polygon(0_0,100%_0,86%_100%,0_100%)] bg-[linear-gradient(110deg,#3a3a40_0%,#1b1a20_55%,rgba(27,26,32,0.4)_100%)]'
                  : '[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)] bg-[linear-gradient(250deg,#3d3a33_0%,#1d1b18_55%,rgba(29,27,24,0.4)_100%)]',
                'transition-[filter] duration-200 group-enabled:group-hover:brightness-125',
              )}
            />
            <span
              aria-hidden="true"
              className={cn('absolute inset-y-0 -z-10 w-[3px]', left ? 'left-0 bg-dv-cobalt' : 'right-0 bg-dv-gold')}
            />
            <Monogram name={s.name} size={big ? 'lg' : 'md'} tone={s.isMe ? 'cobalt' : left ? 'cobalt' : 'gold'} />
            <span className="max-w-full truncate font-body text-[15px] leading-tight text-dv-text">{s.isMe ? `${s.name} (você)` : s.name}</span>
            <span className={cn('font-impact font-semibold leading-none dv-tabular', big ? 'text-[34px]' : 'text-[26px]', left ? 'text-dv-cobalt-text' : 'text-dv-gold-bright')}>
              {fmtOdds(s.odds)}
            </span>
            <span className="font-mono text-[11px] text-dv-text-3">{s.wins} vitórias</span>
            {!locked && !s.isMe && (
              <span className="dv-label mt-0.5 text-[10px] text-dv-text-2 group-enabled:group-hover:text-dv-text">Apostar ›</span>
            )}
            {won && <span className="dv-label text-[10px] text-dv-gold-bright">Venceu</span>}
          </button>
        )
      })}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center border border-dv-gold bg-dv-ink shadow-[0_0_20px_rgba(0,0,0,0.8)]"
      >
        <span className="-rotate-45 font-impact text-[18px] font-bold italic text-dv-text">VS</span>
      </span>
    </div>
  )
}

function FeaturedDuel({
  item,
  loading,
  onBet,
  onMore,
}: {
  item: { duel: Duel; event: BetEvent } | null
  loading: boolean
  onBet: (d: Duel, pick: string) => void
  onMore: () => void
}) {
  if (!item) {
    return (
      <Frame as="section" aria-label="Confronto em destaque" pad="md" className="animate-dv-rise">
        <SectionHeader index="II" kicker="Apostas em Tempo" title="Confronto em destaque" size="sm" as="h3" className="mb-4" />
        <div className="relative grid grid-cols-2 opacity-70" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className={cn('flex min-h-[96px] flex-col justify-center gap-2 border border-dashed border-dv-line px-3', i === 0 ? 'items-start' : 'items-end')}>
              <Monogram name="?" tone="ghost" size="md" />
              <span className="h-2 w-16 bg-dv-line" />
            </div>
          ))}
          <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center border border-dv-line-strong bg-dv-ink">
            <span className="-rotate-45 font-impact text-[15px] italic text-dv-text-3">VS</span>
          </span>
        </div>
        <p className={cn('mt-4 font-body text-[15px] leading-relaxed text-dv-text-2', loading && 'animate-pulse')}>
          {loading ? 'Abrindo o livro…' : 'Nenhum confronto aberto para apostas. Quando uma partida fechar as inscrições, os duelos aparecem aqui.'}
        </p>
        <div className="flex justify-end">
          <MoreLink label="Apostas" onClick={onMore} />
        </div>
      </Frame>
    )
  }
  const { duel, event } = item
  const [a, b] = duel.sides
  const bettors = a.bettors + b.bettors
  return (
    <Frame as="section" aria-label="Confronto em destaque" pad="md" tone={event.status === 'LIVE' ? 'cobalt' : 'neutral'} className="animate-dv-rise">
      <SectionHeader
        index="II"
        kicker={`${GAMES[event.gameId].name} · Nº ${String(event.number).padStart(3, '0')}`}
        title="Confronto em destaque"
        size="sm"
        as="h3"
        className="mb-4"
        action={event.status === 'LIVE' ? <Badge tone="cobalt" live>Ao vivo</Badge> : undefined}
      />
      <VsSplit duel={duel} onBet={onBet} big />
      <div className="mt-3">
        <OddsBar a={a.pct} b={b.pct} />
      </div>
      <p className="dv-label mt-2 text-[10px] text-dv-text-3">
        {bettors} {bettors === 1 ? 'apostador' : 'apostadores'} · toque num lado para apostar
      </p>
      {duel.myBet && (
        <div className="dv-paper-bg relative mt-3 -rotate-[0.6deg] px-3 py-2 shadow-[0_6px_14px_rgba(0,0,0,0.5)]">
          <p className="dv-label text-[10px] text-dv-paper-ink/70">Seu bilhete</p>
          <p className="font-body text-[15px] text-dv-paper-ink">
            <strong className="font-impact text-[17px]">{formatMinutes(duel.myBet.amount)}</strong> em {duel.myBet.pick} · odd {fmtOdds(duel.myBet.odds)}
          </p>
        </div>
      )}
    </Frame>
  )
}

/* ── Ranking da semana (resumo) ────────────────────────────────────────────────────── */

const PODIUM_TONE = ['gold', 'silver', 'bronze'] as const

function RankingPanel({ data, onMore }: { data: Dashboard; onMore: () => void }) {
  const rows = data.leaderboard.slice(0, 8)
  const top = rows.slice(0, 3)
  const rest = rows.slice(3)
  const meOutside = data.me.rank && data.me.rank > 8
  // Pódio na ordem visual 2 · 1 · 3.
  const podium = [top[1], top[0], top[2]].filter(Boolean)
  return (
    <Frame as="section" aria-label="Ranking da semana" pad="md" className="animate-dv-rise">
      <SectionHeader index="III" kicker="Reinicia toda segunda" title="Ranking da semana" size="sm" as="h3" className="mb-4" action={<MoreLink label="Completo" onClick={onMore} />} />
      {rows.length === 0 ? (
        <p className="font-body text-[15px] text-dv-text-2">Ninguém pontuou nesta semana ainda.</p>
      ) : (
        <>
          <ol className="grid grid-cols-3 items-end gap-2" aria-label="Pódio">
            {podium.map((r) => {
              const place = r.rank
              const tone = PODIUM_TONE[place - 1] ?? 'neutral'
              return (
                <li key={r.name} className={cn('flex min-w-0 flex-col items-center text-center', place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3')}>
                  <Monogram name={r.name} size={place === 1 ? 'lg' : 'md'} tone={r.isMe ? 'cobalt' : tone} />
                  <span className={cn('mt-1.5 max-w-full truncate font-body text-[14px] leading-tight', r.isMe ? 'text-dv-cobalt-text' : 'text-dv-text')}>{r.isMe ? 'Você' : r.name}</span>
                  <span className="font-mono text-[12px] tabular-nums text-dv-text-2">{formatPoints(r.score)}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 grid w-full place-items-center border-t-2 bg-[linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink-2))] [clip-path:polygon(10%_0,90%_0,100%_100%,0_100%)]',
                      place === 1 ? 'h-14 border-dv-gold' : place === 2 ? 'h-10 border-[#c9cfdb]' : 'h-8 border-[#b77b45]',
                    )}
                  >
                    <span className={cn('font-impact font-bold leading-none', place === 1 ? 'text-[26px] text-dv-gold-bright' : 'text-[18px] text-dv-text-2')}>{toRoman(place)}</span>
                  </span>
                </li>
              )
            })}
          </ol>
          {rest.length > 0 && (
            <ol className="mt-3 divide-y divide-dv-line border-t border-dv-line" start={4}>
              {rest.map((r) => (
                <li key={r.name} className={cn('grid min-h-11 grid-cols-[2rem_1fr_auto] items-center gap-2 px-1 font-body text-[15px]', r.isMe ? 'bg-dv-cobalt-dim text-dv-text' : 'text-dv-text-2')}>
                  <span className="font-impact text-[15px] text-dv-text-3 dv-tabular">{r.rank}</span>
                  <span className="truncate">{r.isMe ? `${r.name} (você)` : r.name}</span>
                  <span className="font-mono text-[13px] tabular-nums">{formatPoints(r.score)}</span>
                </li>
              ))}
            </ol>
          )}
          {meOutside && (
            <p className="mt-1 grid min-h-11 grid-cols-[2rem_1fr_auto] items-center gap-2 bg-dv-cobalt-dim px-1 font-body text-[15px]">
              <span className="font-impact text-dv-text-2">{data.me.rank}</span>
              <span className="truncate">{data.me.name} (você)</span>
              <span className="font-mono text-[13px] tabular-nums">{formatPoints(data.me.score)}</span>
            </p>
          )}
        </>
      )}
    </Frame>
  )
}

/* ── Outras apostas abertas ────────────────────────────────────────────────────────── */

function OpenBets({ items, onBet, onMore }: { items: { duel: Duel; event: BetEvent }[]; onBet: (d: Duel, pick: string) => void; onMore: () => void }) {
  return (
    <Frame as="section" aria-label="Apostas em andamento" pad="md" className="animate-dv-rise">
      <SectionHeader kicker="Livro aberto" title="Apostas em andamento" size="sm" as="h3" className="mb-3" action={<MoreLink label="Todas" onClick={onMore} />} />
      <ul className="flex flex-col gap-3">
        {items.map(({ duel, event }) => (
          <li key={duel.id}>
            <p className="dv-label mb-1.5 text-[10px] text-dv-text-3">
              {GAMES[event.gameId].name} · duelo {duel.slot + 1}
            </p>
            <VsSplit duel={duel} onBet={onBet} />
            <div className="mt-2">
              <OddsBar a={duel.sides[0].pct} b={duel.sides[1].pct} thin />
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  )
}

/* ── Últimas partidas ──────────────────────────────────────────────────────────────── */

function RecentPanel({ data }: { data: Dashboard }) {
  return (
    <Frame as="section" aria-label="Suas últimas partidas" pad="md" className="animate-dv-rise">
      <SectionHeader kicker="Histórico" title="Suas últimas partidas" size="sm" as="h3" className="mb-3" />
      {data.recent.length === 0 ? (
        <p className="flex items-center gap-2 font-body text-[15px] text-dv-text-2">
          <GlyphSpark className="size-3 text-dv-gold" />
          Nenhuma partida ainda. A mesa está esperando.
        </p>
      ) : (
        <ul className="divide-y divide-dv-line">
          {data.recent.slice(0, 6).map((r) => (
            <li key={r.id} className="flex min-h-11 items-center gap-3 py-1.5">
              <span
                className={cn(
                  'dv-label w-[4.5rem] shrink-0 text-[10px]',
                  r.result === 'win' ? 'text-dv-cobalt-text' : r.result === 'draw' ? 'text-dv-text-2' : 'text-dv-text-3',
                )}
              >
                {r.result === 'win' ? 'Vitória' : r.result === 'draw' ? 'Empate' : 'Derrota'}
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-[15px]">
                {GAMES[r.gameId].name} <span className="text-dv-text-3">vs {r.opponent}</span>
              </span>
              <span className="font-mono text-[13px] tabular-nums text-dv-text-2">{r.mode === 'treino' ? 'treino' : formatPoints(r.score)}</span>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  )
}
