'use client'

import Image from 'next/image'
import { type CSSProperties, useState } from 'react'
import useSWR from 'swr'
import {
  Badge,
  Button,
  CRITICAL_MS,
  Chip,
  Countdown,
  Divider,
  Frame,
  GlyphAlert,
  GlyphCheck,
  GlyphHourglass,
  GlyphKeyhole,
  Kicker,
  SectionHeader,
  Spinner,
  TimeDigits,
  toRoman,
} from '@/components/devo/kit'
import { type BetBoard, type Dashboard, type EventDetail, arcadeFetcher, arcadeKey, formatCountdown, formatPoints } from '@/lib/devo/arcade/client'
import { GAMES, type GameId, PATENTES, patenteIndex, rankReward } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { formatDuration, useNow } from '../hooks'
import { useDevo } from '../state/devo-store'
import { BET_OPTIONS, BET_RESERVE_MIN, SP_TZ, formatMinutes, registerEvent, useApplyTime } from './arcade-shared'
import { useBetSheet } from './bet-sheet'
import { eventBadge, VsSplit } from './mesa'
import { AstrolabeDial, GAME_ART, JavaliMedallion, Monogram, OddsBar } from './sala-ui'

type EventView = Dashboard['events'][number]

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'Em breve',
  REGISTRATION: 'Inscrições abertas',
  LOCKED: 'Apostas abertas',
  LIVE: 'Ao vivo',
  FINISHED: 'Encerrada',
}

function hourOf(ms: number) {
  return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: SP_TZ })
}

/* ══ AGENDA ═══════════════════════════════════════════════════════════════════════════ */

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

function spDayKey(ms: number) {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: SP_TZ })
}

export function Agenda({
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
    const ms = data.week.resetsAt - (7 - i) * 86_400_000 + 12 * 3_600_000
    const key = spDayKey(ms)
    const date = new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: SP_TZ })
    return { label, key, date, events: data.events.filter((e) => spDayKey(e.startsAt) === key) }
  })
  const todayIdx = Math.max(0, days.findIndex((d) => d.key === todayKey))
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
        : featured.status === 'REGISTRATION' && featured.joined
          ? 'Inscrito'
          : 'Entrar na fila'

  return (
    <div className="@container flex flex-col gap-6">
      {featured ? (
        <Frame as="section" aria-labelledby="hoje" tone="gold" ornate glow pad="none" className="animate-dv-cut-in overflow-hidden">
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[55%] overflow-hidden [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)]">
              <Image src={GAME_ART[featured.gameId].src} alt="" fill sizes="50vw" className="object-cover opacity-50" style={{ objectPosition: GAME_ART[featured.gameId].position }} />
              <span className="absolute inset-0 bg-gradient-to-r from-dv-ink-2 via-dv-ink-2/50 to-transparent" />
            </div>
            <div className="relative flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Kicker tone="gold">{isToday ? `Hoje · ${weekdayLabel}` : `Próximo · ${new Date(featured.startsAt).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: SP_TZ })}`}</Kicker>
              </div>
              <Badge tone={eventBadge(featured).tone} live={eventBadge(featured).live} dot className="self-start">
                {STATUS_LABEL[featured.status]}
              </Badge>
              <h3 id="hoje" className="max-w-[80%] font-display text-[30px] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-dv-text">
                {featured.label ?? GAMES[featured.gameId].name}
              </h3>
              <TimeDigits value={hourOf(featured.startsAt)} size="md" tone={featured.status === 'LIVE' ? 'cobalt' : 'text'} label="Horário" />
              <p className="font-body text-[16px] leading-relaxed text-dv-text-2 text-pretty">{featured.rules ?? GAMES[featured.gameId].description}</p>
              <div className="border-t border-dv-line pt-3">
                <p className="dv-label text-[10px] text-dv-text-3">Prêmio da semana · para o 1º do ranking</p>
                <TimeDigits value={`+${String(weekPrize?.hours ?? 0).padStart(2, '0')}:00:00`} size="md" tone="gold" label="Prêmio" className="mt-1" />
              </div>
              <div className="mt-1 flex flex-col gap-2 @md:flex-row">
                <Button
                  block
                  disabled={busy || (featured.status === 'REGISTRATION' && featured.joined)}
                  onClick={primary}
                  sfx={primaryLabel === 'Inscrever-se' ? 'confirm' : 'click'}
                  icon={primaryLabel === 'Inscrito' ? <GlyphCheck /> : undefined}
                >
                  {primaryLabel}
                </Button>
                <Button block variant="secondary" onClick={() => onRanking(featured.gameId)}>
                  Ver ranking
                </Button>
              </div>
            </div>
          </div>
        </Frame>
      ) : (
        <Frame pad="md">
          <p className="font-body text-[16px] text-dv-text-2">Nenhuma partida programada nesta semana.</p>
        </Frame>
      )}

      {next && (
        <Frame tone="cobalt" pad="sm" className="animate-dv-rise">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="dv-label text-[10px] text-dv-cobalt-text">Próxima partida</p>
              <p className="mt-0.5 font-body text-[16px] text-dv-text">
                Nº {String(next.number).padStart(3, '0')} · <strong className="font-semibold">{next.label ?? GAMES[next.gameId].name}</strong> ·{' '}
                <span className="font-mono text-[13px] tabular-nums">
                  {next.entries}/{next.maxPlayers}
                </span>
              </p>
            </div>
            {next.status === 'LIVE' ? (
              <Badge tone="cobalt" live>
                Ao vivo
              </Badge>
            ) : (
              <Countdown endsAt={next.startsAt} size="sm" sound={false} criticalMs={15 * 60_000} label="Começa em" render={(ms) => formatCountdown(ms)} />
            )}
          </div>
        </Frame>
      )}

      <section aria-labelledby="calendario" className="relative">
        <SectionHeader index="II" kicker="Calendário da semana" title="Semana" size="sm" as="h3" className="mb-4" />
        <span id="calendario" className="sr-only">
          Calendário da semana
        </span>
        <AstrolabeDial active={todayIdx} className="absolute -right-24 top-6 size-64 opacity-30 @2xl:-right-10 @2xl:size-80" />
        <ol aria-label="Semana" className="relative flex flex-col">
          {/* eixo do astrolábio */}
          <span aria-hidden="true" className="absolute bottom-6 left-[21px] top-6 w-px bg-gradient-to-b from-dv-gold/10 via-dv-gold/60 to-dv-gold/10" />
          {days.map((d, i) => {
            const past = d.key < todayKey
            const isNow = d.key === todayKey
            return (
              <li
                key={d.key}
                aria-current={isNow ? 'date' : undefined}
                className={cn('relative flex animate-dv-rise gap-3 py-2', past && 'opacity-50')}
                style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}
              >
                {isNow && <span aria-hidden="true" className="absolute inset-y-0 -left-3 -right-3 -z-0 bg-[linear-gradient(90deg,rgba(49,93,255,0.22),rgba(49,93,255,0.05)_70%,transparent)]" />}
                <span
                  className={cn(
                    'relative grid size-11 shrink-0 place-items-center rounded-full border font-mono text-[11px] tracking-[0.08em]',
                    isNow
                      ? 'border-dv-cobalt bg-dv-cobalt-dim text-white shadow-[0_0_18px_rgba(49,93,255,0.6)]'
                      : 'border-dv-gold/50 bg-dv-ink text-dv-gold',
                  )}
                >
                  {d.label}
                  <span className="absolute -bottom-1 -right-1 font-impact text-[10px] text-dv-text-3">{toRoman(i + 1)}</span>
                </span>
                <div className="relative min-w-0 flex-1">
                  <p className="dv-label flex min-h-11 items-center gap-2 text-[10px] text-dv-text-3">
                    <span>{d.date}</span>
                    {isNow && <span className="text-dv-cobalt-text">Hoje</span>}
                    {!d.events.length && <span className="text-dv-text-3">· Folga</span>}
                  </p>
                  <div className="flex flex-col gap-2">
                    {d.events.map((e) => (
                      <AgendaEvent key={e.id} event={e} now={now} busy={busy} big={topHours > 0 && (e.reward.hours ?? 0) === topHours} onPlay={onPlay} onChange={onChange} />
                    ))}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex items-start gap-3">
        <JavaliMedallion size={48} />
        <p className="font-body text-[16px] italic leading-relaxed text-dv-text-2">
          <span className="dv-label mb-0.5 block text-[10px] not-italic text-dv-gold">Javali</span>
          Aqui ninguém aposta dinheiro. Aposta-se Tempo. Muito mais divertido.
        </p>
      </div>
    </div>
  )
}

function AgendaEvent({
  event: e,
  now,
  busy,
  big,
  onPlay,
  onChange,
}: {
  event: EventView
  now: number
  busy: boolean
  big: boolean
  onPlay: (id: string) => void
  onChange: () => void
}) {
  const [open, setOpen] = useState(false)
  const badge = eventBadge(e)
  return (
    <Frame pad="none" tone={e.status === 'LIVE' ? 'cobalt' : big ? 'gold' : 'neutral'} cut="diag" cutSize={10}>
      <div className="flex items-start gap-3 p-3">
        <span className="dv-cut relative size-14 shrink-0 overflow-hidden" style={{ '--dv-cut': '8px' } as CSSProperties}>
          <Image src={GAME_ART[e.gameId].src} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: GAME_ART[e.gameId].position }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <TimeDigits value={hourOf(e.startsAt)} size="sm" tone={e.status === 'LIVE' ? 'cobalt' : 'text'} flip={false} label="Horário" />
            <span className="dv-label text-[10px] text-dv-text-3">Nº {String(e.number).padStart(3, '0')}</span>
          </div>
          <p className="mt-1 font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.04em]">{e.label ?? GAMES[e.gameId].name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-dv-text-2">
            <span className="tabular-nums">
              {e.entries}/{e.maxPlayers} jogadores
            </span>
            <span className={cn(badge.tone === 'cobalt' && 'text-dv-cobalt-text', badge.tone === 'gold' && 'text-dv-gold')}>{STATUS_LABEL[e.status]}</span>
            {e.status === 'UPCOMING' && <span>inscrições em {formatCountdown(e.registrationOpensAt - now)}</span>}
            {e.status === 'REGISTRATION' && <span>fecha em {formatCountdown(e.registrationClosesAt - now)}</span>}
            {e.status === 'LOCKED' && <span>começa em {formatCountdown(e.startsAt - now)}</span>}
            {big && e.reward.hours ? <span className="text-dv-gold-bright">+{e.reward.hours}h de Tempo</span> : null}
          </p>
        </div>
        {e.status === 'UPCOMING' && (
          <span className="mt-1 shrink-0 text-dv-text-3">
            <GlyphKeyhole className="size-5" />
            <span className="sr-only">Bloqueado</span>
          </span>
        )}
      </div>
      <div className="-mt-1 flex flex-wrap items-center gap-2 px-3 pb-2">
        {e.status === 'REGISTRATION' &&
          (e.joined ? (
            <Badge tone="cobalt" dot>
              Inscrito
            </Badge>
          ) : (
            <Button size="sm" sfx="confirm" onClick={() => registerEvent(e.id, onChange)}>
              Inscrever
            </Button>
          ))}
        {e.status === 'LIVE' && e.joined && (
          <Button size="sm" disabled={busy} onClick={() => onPlay(e.id)} sfx="click">
            Jogar agora
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" aria-expanded={open} onClick={() => setOpen(!open)} sfx="click">
          Detalhes
        </Button>
      </div>
      {open && <EventPanel id={e.id} />}
    </Frame>
  )
}

function EventPanel({ id }: { id: string }) {
  const { data } = useSWR<EventDetail>(arcadeKey('event', `&id=${id}`), arcadeFetcher, { refreshInterval: 15_000 })
  if (!data)
    return (
      <p className="flex items-center gap-2 border-t border-dv-line p-3 text-dv-text-3">
        <Spinner className="size-4" />
        <span className="dv-label text-[10px]">Carregando…</span>
      </p>
    )
  return (
    <div className="grid animate-dv-rise gap-4 border-t border-dv-line p-3 @md:grid-cols-2">
      <div>
        <p className="dv-label mb-1 text-[10px] text-dv-text-3">Regras</p>
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">{data.event.rules ?? GAMES[data.event.gameId].tagline}</p>
      </div>
      <div>
        <p className="dv-label mb-1 text-[10px] text-dv-text-3">Participantes</p>
        <ul className="flex flex-col divide-y divide-dv-line font-body text-[15px]">
          {data.entries.length === 0 && <li className="py-1 text-dv-text-3">Ninguém ainda.</li>}
          {data.entries.map((en) => (
            <li key={en.name} className={cn('flex min-h-9 items-center justify-between gap-2', en.isMe && 'text-dv-cobalt-text')}>
              <span className="truncate">{en.name}</span>
              <span className={cn('dv-label text-[10px]', en.state === 'eliminado' ? 'text-dv-blood-text' : 'text-dv-text-3')}>{en.state}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ══ RANKING ══════════════════════════════════════════════════════════════════════════ */

export type RankView = 'geral' | GameId

type RankRow = { rank: number; name: string; isMe: boolean; sub: string; points: number; today?: number }

export function Ranking({ data, view, onView }: { data: Dashboard; view: RankView; onView: (v: RankView) => void }) {
  const options: { id: RankView; label: string }[] = [{ id: 'geral', label: 'Geral' }, ...(Object.keys(GAMES) as GameId[]).map((g) => ({ id: g, label: GAMES[g].name }))]
  const eligible = data.me.games >= data.minWeekGames
  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Ranking por jogo" className="-mx-1 flex flex-wrap gap-x-1 gap-y-0.5">
        {options.map((o) => (
          <Chip key={o.id} selected={view === o.id} onClick={() => onView(o.id)} className="px-3.5">
            {o.label}
          </Chip>
        ))}
      </div>

      {view === 'geral' ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Kicker tone="gold">Semana {data.week.key}</Kicker>
              <p className="mt-1 font-body text-[15px] text-dv-text-2">Reinicia toda segunda. Os três primeiros levam Tempo.</p>
            </div>
            <div className="text-right">
              <p className="dv-label text-[10px] text-dv-text-3">Reset em</p>
              <Countdown endsAt={data.week.resetsAt} size="sm" tone="text" sound={false} criticalMs={0} label="Reset" render={(ms) => formatCountdown(ms)} />
            </div>
          </div>
          <Podium rows={data.leaderboard.slice(0, 3).map((r) => ({ rank: r.rank, name: r.name, isMe: r.isMe, sub: `${r.wins} vitórias`, points: r.score }))} />
          <RankList
            rows={data.leaderboard
              .slice(3, 10)
              .map((r) => ({ rank: r.rank, name: r.name, isMe: r.isMe, sub: `${r.wins} vitórias · ${PATENTES[patenteIndex(r.score)].name}`, points: r.score }))}
            me={
              data.me.rank && data.me.rank > 10
                ? { rank: data.me.rank, name: data.me.name, isMe: true, sub: `${data.me.wins} vitórias`, points: data.me.score }
                : !data.me.rank
                  ? { rank: 0, name: data.me.name, isMe: true, sub: 'Sem pontos ainda', points: data.me.score }
                  : null
            }
          />
        </>
      ) : (
        <GameRank data={data} gameId={view} />
      )}

      <Frame variant="paper" pad="md" className="animate-dv-rise -rotate-[0.4deg]">
        <p className="dv-label text-[10px] text-dv-paper-ink/70">Regulamento da casa · prêmios</p>
        <ol className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((r) => (
            <li key={r} className="flex flex-col items-center border border-dv-paper-ink/25 px-1 py-2 text-center">
              <span className="font-impact text-[20px] font-bold leading-none text-dv-cobalt-deep">{r}º</span>
              <span className="mt-1 font-impact text-[22px] font-semibold leading-none text-dv-paper-ink">+{rankReward(r)?.hours ?? 0}h</span>
              <span className="dv-label mt-1 text-[10px] text-dv-paper-ink/60">de Tempo</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-dv-paper-ink">
          <strong className="font-semibold">Prêmios:</strong> top 3 do ranking geral, entregues no reset, em Tempo.
        </p>
        <p className="mt-2 font-body text-[15px] leading-relaxed text-dv-paper-ink">
          <strong className="font-semibold">Para concorrer:</strong> mínimo de {data.minWeekGames} partidas online na semana{' '}
          <span className={cn('font-mono text-[13px] tabular-nums', eligible ? 'text-dv-cobalt-deep' : 'text-[#8a1018]')}>
            (você: {data.me.games}/{data.minWeekGames})
          </span>
          .
        </p>
        <div aria-hidden="true" className="mt-2 flex gap-1">
          {Array.from({ length: data.minWeekGames }, (_, i) => (
            <span key={i} className={cn('h-1.5 flex-1', i < data.me.games ? 'bg-dv-cobalt-deep' : 'bg-dv-paper-ink/15')} />
          ))}
        </div>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-dv-paper-ink">
          <strong className="font-semibold">Título permanente:</strong> a patente zera toda semana, mas o maior título alcançado fica no seu perfil.
        </p>
      </Frame>
    </div>
  )
}

const PODIUM = {
  1: { tone: 'gold' as const, h: 'h-20', num: 'text-[38px] text-dv-gold-bright', line: 'border-dv-gold' },
  2: { tone: 'silver' as const, h: 'h-14', num: 'text-[26px] text-[#dfe3ec]', line: 'border-[#c9cfdb]' },
  3: { tone: 'bronze' as const, h: 'h-10', num: 'text-[22px] text-[#d9a06a]', line: 'border-[#b77b45]' },
}

function Podium({ rows }: { rows: RankRow[] }) {
  if (!rows.length) return <p className="font-body text-[15px] text-dv-text-2">Ninguém pontuou nesta semana ainda.</p>
  const order = [rows[1], rows[0], rows[2]].filter(Boolean)
  return (
    <ol aria-label="Pódio" className="relative grid grid-cols-3 items-end gap-2 pt-2">
      {/* holofote sobre o 1º */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-full w-1/2 -translate-x-1/2 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(236,212,154,0.22),transparent_70%)]" />
      {order.map((r) => {
        const p = PODIUM[Math.min(3, Math.max(1, r.rank)) as 1 | 2 | 3]
        return (
          <li
            key={r.name}
            className={cn('relative flex min-w-0 animate-dv-rise flex-col items-center text-center', r.rank === 1 ? 'order-2' : r.rank === 2 ? 'order-1' : 'order-3')}
            style={{ animationDelay: `${r.rank === 1 ? 260 : r.rank === 2 ? 120 : 60}ms` }}
          >
            {r.rank === 1 && (
              <svg aria-hidden="true" viewBox="0 0 40 20" className="mb-1 h-5 w-10 text-dv-gold-bright">
                <path d="M2 18 L6 4 L14 12 L20 2 L26 12 L34 4 L38 18 Z" fill="currentColor" opacity="0.9" />
              </svg>
            )}
            <Monogram name={r.name} size={r.rank === 1 ? 'lg' : 'md'} tone={r.isMe ? 'cobalt' : p.tone} />
            <span className={cn('mt-2 max-w-full truncate font-display text-[15px] font-semibold uppercase tracking-[0.04em]', r.isMe ? 'text-dv-cobalt-text' : 'text-dv-text')}>
              {r.isMe ? `${r.name} (você)` : r.name}
            </span>
            <span className="font-impact text-[20px] font-semibold leading-tight dv-tabular">{formatPoints(r.points)}</span>
            <span className="font-mono text-[11px] text-dv-text-3">{r.sub}</span>
            <span
              aria-hidden="true"
              className={cn(
                'mt-2 grid w-full place-items-center border-t-2 bg-[linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink-2)_70%,var(--dv-ink))] [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]',
                p.h,
                p.line,
              )}
            >
              <span className={cn('font-impact font-bold leading-none -skew-x-[8deg]', p.num)}>{toRoman(r.rank)}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function RankList({ rows, me }: { rows: RankRow[]; me: RankRow | null }) {
  const item = (r: RankRow, i: number) => (
    <li
      key={`${r.rank}-${r.name}`}
      className={cn('relative flex min-h-14 animate-dv-rise items-center gap-3 px-3 py-2', r.isMe ? 'bg-dv-cobalt-dim' : 'bg-dv-ink-2/70')}
      style={{ animationDelay: `${300 + Math.min(i, 7) * 50}ms` }}
    >
      {r.isMe && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-dv-cobalt shadow-[0_0_12px_var(--dv-cobalt)]" />}
      <span className="w-8 text-center font-impact text-[20px] font-semibold text-dv-text-3 dv-tabular">{r.rank || '—'}</span>
      <Monogram name={r.name} size="sm" tone={r.isMe ? 'cobalt' : 'neutral'} />
      <div className="min-w-0 flex-1">
        <span className={cn('flex items-center gap-2 truncate font-body text-[16px]', r.isMe ? 'text-white' : 'text-dv-text')}>
          <span className="truncate">{r.name}</span>
          {r.isMe && (
            <Badge tone="cobalt" className="h-5 px-1.5">
              Você
            </Badge>
          )}
        </span>
        <span className="block truncate font-mono text-[11px] uppercase tracking-[0.1em] text-dv-text-3">{r.sub}</span>
      </div>
      <div className="text-right">
        <span className="block font-impact text-[18px] font-semibold dv-tabular">{formatPoints(r.points)}</span>
        {r.today !== undefined && r.today > 0 && <span className="block font-mono text-[11px] text-dv-cobalt-text">+{formatPoints(r.today)} hoje</span>}
      </div>
    </li>
  )
  if (!rows.length && !me) return null
  return (
    <ol className="flex flex-col gap-1">
      {rows.map(item)}
      {me && (
        <>
          {rows.length > 0 && (
            <li aria-hidden="true" className="py-1">
              <Divider variant="clock" tone="muted" />
            </li>
          )}
          {item(me, rows.length)}
        </>
      )}
    </ol>
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
  const rows: RankRow[] = r.rows.map((x) => ({ rank: x.rank, name: x.name, isMe: x.isMe, sub: PATENTES[patenteIndex(x.points)].name, points: x.points, today: x.today }))
  return (
    <>
      <Frame as="section" aria-label="Sua patente" tone="cobalt" pad="md" className="animate-dv-cut-in">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Kicker tone="cobalt">Sua patente · {GAMES[gameId].name}</Kicker>
          <span className="font-mono text-[12px] tabular-nums text-dv-text-2">
            {formatPoints(points)} pts{r.me ? ` · #${r.me.rank}` : ''}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
          <h3 className="font-impact text-[30px] font-bold uppercase leading-none -skew-x-[6deg]">{cur.name}</h3>
          <p className="font-mono text-[12px] text-dv-text-2">{nextP ? `faltam ${formatPoints(nextP.min - points)} pts para ${nextP.name}` : 'Patente máxima'}</p>
        </div>
        <div className="mt-2.5 h-1.5 bg-dv-ink-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da patente">
          <div className="h-full bg-[linear-gradient(90deg,var(--dv-cobalt-deep),var(--dv-cobalt-text))]" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-2.5 grid grid-cols-3 gap-1">
          {PATENTES.map((p, i) => (
            <li
              key={p.name}
              aria-current={i === idx ? 'step' : undefined}
              className={cn(
                'border px-1 py-1 text-center font-mono text-[10px] uppercase tracking-[0.08em] break-words',
                i === idx ? 'border-dv-cobalt bg-dv-cobalt-dim text-white' : i < idx ? 'border-dv-line-strong text-dv-text-2' : 'border-dv-line text-dv-text-3',
              )}
            >
              {p.name}
            </li>
          ))}
        </ol>
        <p className="mt-2 font-body text-[14px] text-dv-text-2">
          Maior título alcançado: <span className="text-dv-gold-bright">{r.bestWeek > 0 ? permanent.name : '—'}</span>
        </p>
      </Frame>
      {rows.length === 0 ? (
        <p className="font-body text-[15px] text-dv-text-2">Ninguém pontuou em {GAMES[gameId].name} nesta semana. A mesa está esperando.</p>
      ) : (
        <>
          <Podium rows={rows.slice(0, 3)} />
          <RankList rows={rows.slice(3)} me={r.me && r.me.rank > 10 ? { rank: r.me.rank, name: r.me.name, isMe: true, sub: cur.name, points: r.me.points, today: r.me.today } : null} />
        </>
      )}
    </>
  )
}

/* ══ APOSTAS ══════════════════════════════════════════════════════════════════════════ */

export function Apostas() {
  const applyTime = useApplyTime()
  const { state } = useDevo()
  const now = useNow(1000)
  const { data, mutate } = useSWR<BetBoard>(arcadeKey('bets'), arcadeFetcher, { refreshInterval: 20_000, onSuccess: (d) => applyTime(d) })
  const [amount, setAmount] = useState(15)
  const sheet = useBetSheet(() => mutate(), amount)
  const remaining = Math.max(0, state.timerEndsAt - now)
  const remainingMin = Math.floor(remaining / 60_000)
  const critical = remaining > 0 && remaining <= CRITICAL_MS
  const open = data?.events.filter((e) => e.duels.length > 0) ?? []
  const closed = data?.events.filter((e) => e.duels.length === 0) ?? []
  const bettable = open.some((e) => (e.status === 'LOCKED' || e.status === 'LIVE') && e.duels.some((d) => !d.winner && !d.myBet))
  const reason = !data ? 'Abrindo o livro…' : bettable ? 'Escolha o valor e toque num lado do confronto.' : 'Sem confronto aberto agora — o valor fica guardado para a próxima.'

  return (
    <div className="flex flex-col gap-6">
      <Frame as="section" aria-label="Seu Tempo" tone="gold" pad="md" className="animate-dv-cut-in">
        <Kicker tone="gold">Livro de apostas · a moeda é Tempo</Kicker>
        <div className="mt-3 flex items-center gap-3">
          <GlyphHourglass className={cn('size-7 shrink-0', critical ? 'text-dv-blood-text' : 'text-dv-cobalt-text')} />
          <div>
            <p className="dv-label text-[10px] text-dv-text-3">Seu Tempo</p>
            <TimeDigits value={formatDuration(remaining)} size="lg" tone={critical ? 'blood' : 'cobalt'} label="Seu Tempo" flip={false} />
          </div>
        </div>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-dv-text-2">
          Ganhou, o prêmio volta ao relógio multiplicado pela odd. Perdeu, o valor some do seu pulso.
        </p>

        <div className="mt-4 border-t border-dv-line pt-4">
          <p id="apostar-rotulo" className="dv-label text-[10px] text-dv-text-3">
            Apostar
          </p>
          <div role="radiogroup" aria-labelledby="apostar-rotulo" aria-describedby="apostar-motivo" className="mt-2 grid grid-cols-3 gap-1.5">
            {BET_OPTIONS.map((v) => {
              const on = amount === v
              const afford = remainingMin - v >= BET_RESERVE_MIN
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!bettable || !afford}
                  onClick={() => {
                    playSfx('click')
                    setAmount(v)
                  }}
                  className={cn(
                    'dv-focus min-h-11 -skew-x-[8deg] border font-impact text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                    on ? 'border-dv-cobalt bg-dv-cobalt-dim text-white shadow-[0_0_14px_-4px_var(--dv-cobalt)]' : 'border-dv-line-strong bg-dv-ink-2 text-dv-text enabled:hover:border-dv-text-3',
                  )}
                >
                  <span className="inline-block skew-x-[8deg]">{formatMinutes(v)}</span>
                </button>
              )
            })}
          </div>
          <p id="apostar-motivo" className="mt-2 font-body text-[14px] text-dv-text-2">
            {reason}
          </p>
          <p className="mt-2 flex items-start gap-2 font-body text-[14px] leading-snug text-dv-blood-text">
            <GlyphAlert className="mt-0.5 size-4 shrink-0" />
            Você sempre precisa manter ao menos {BET_RESERVE_MIN}min no relógio.
          </p>
        </div>
      </Frame>

      {!data ? (
        <p className="flex items-center gap-2.5 text-dv-text-3">
          <Spinner className="size-5" />
          <span className="dv-label text-[11px]">Abrindo o livro…</span>
        </p>
      ) : (
        <>
          {open.length === 0 && (
            <Frame pad="md">
              <p className="font-body text-[16px] leading-relaxed text-dv-text-2">Nenhum confronto aberto para apostas agora. Volte quando uma partida fechar as inscrições.</p>
            </Frame>
          )}
          {open.map((ev) => (
            <section key={ev.id} aria-label={GAMES[ev.gameId].name} className="animate-dv-rise">
              <SectionHeader
                kicker={`Nº ${String(ev.number).padStart(3, '0')} · ${STATUS_LABEL[ev.status]}`}
                title={GAMES[ev.gameId].name}
                size="sm"
                as="h3"
                className="mb-3"
                action={ev.status === 'LIVE' ? <Badge tone="cobalt" live>Ao vivo</Badge> : undefined}
              />
              <ul className="grid gap-4 md:grid-cols-2">
                {ev.duels.map((d) => (
                  <li key={d.id}>
                    <p className="dv-label mb-1.5 text-[10px] text-dv-text-3">Duelo {d.slot + 1}</p>
                    <VsSplit duel={d} onBet={sheet.open} closed={ev.status === 'FINISHED'} />
                    <div className="mt-2">
                      <OddsBar a={d.sides[0].pct} b={d.sides[1].pct} thin />
                    </div>
                    {d.myBet && (
                      <p className="mt-2 font-body text-[14px] text-dv-text-2">
                        Você apostou <strong className="font-impact text-[16px] text-dv-text">{formatMinutes(d.myBet.amount)}</strong> em {d.myBet.pick} ·{' '}
                        {d.myBet.status === 'won' ? <span className="text-dv-cobalt-text">ganhou {formatMinutes(d.myBet.payout)}</span> : d.myBet.status === 'lost' ? <span className="text-dv-blood-text">perdeu</span> : 'aguardando'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {closed.length > 0 && (
            <section aria-label="Partidas encerradas" className="animate-dv-rise">
              <p className="dv-label mb-2 text-[10px] text-dv-text-3">Livros fechados</p>
              <ul className="flex flex-col gap-1">
                {closed.map((ev) => (
                  <li key={ev.id} className="flex min-h-11 items-center gap-3 border-b border-dv-line font-body text-[15px] text-dv-text-2">
                    <GlyphKeyhole className="size-4 shrink-0 text-dv-text-3" />
                    <span className="flex-1 truncate">
                      {GAMES[ev.gameId].name} <span className="text-dv-text-3">Nº {String(ev.number).padStart(3, '0')}</span>
                    </span>
                    <Badge tone="neutral">{STATUS_LABEL[ev.status]}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Frame as="section" aria-labelledby="hist-apostas" variant="paper" pad="md" className="animate-dv-rise rotate-[0.3deg]">
            <h3 id="hist-apostas" className="dv-label text-[10px] text-dv-paper-ink/70">
              Suas apostas · bilhetes
            </h3>
            {data.history.length === 0 ? (
              <p className="mt-2 font-body text-[15px] text-dv-paper-ink/80">Nenhum bilhete ainda. A casa está de olho.</p>
            ) : (
              <ul className="mt-2 divide-y divide-dashed divide-dv-paper-ink/25">
                {data.history.map((h) => (
                  <li key={h.id} className="flex min-h-11 items-center gap-3 py-1.5 font-body text-[15px] text-dv-paper-ink">
                    <span className="min-w-0 flex-1 truncate">
                      {h.label} · {h.pick}
                    </span>
                    <span className="font-mono text-[13px]">{formatMinutes(h.amount)}</span>
                    <span
                      className={cn(
                        'w-20 text-right font-mono text-[12px] uppercase',
                        h.status === 'won' ? 'text-dv-cobalt-deep' : h.status === 'lost' ? 'text-[#8a1018]' : 'text-dv-paper-ink/60',
                      )}
                    >
                      {h.status === 'won' ? `+${formatMinutes(h.payout)}` : h.status === 'lost' ? 'perdeu' : 'aberta'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Frame>
        </>
      )}
      {sheet.node}
    </div>
  )
}
