'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Button, Frame, GlyphAlert, GlyphArrow, GlyphClock, GlyphGavel, IconButton, Kicker } from '@/components/devo/kit'
import { type DeadlyVoteEntry, lifeClock, voteTitle } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { useDevo } from '../state/devo-store'

type Level = 'critical' | 'directive' | 'reminder'

export type ManagerSignal = {
  id: string
  level: Level
  source: string
  title: string
  body: string
  at: number
  action?: { label: string; run: () => void }
}

const HOUR = 3600_000
const ROTATE_MS = 9000

const LEVEL: Record<Level, { label: string; icon: typeof GlyphAlert; text: string; tone: 'blood' | 'cobalt' | 'neutral'; bar: string; kicker: 'blood' | 'cobalt' | 'muted' }> = {
  critical: { label: 'Alerta crítico', icon: GlyphAlert, text: 'text-dv-blood-text', tone: 'blood', bar: 'bg-dv-blood', kicker: 'blood' },
  directive: { label: 'Diretriz', icon: GlyphGavel, text: 'text-dv-cobalt-text', tone: 'cobalt', bar: 'bg-dv-cobalt', kicker: 'cobalt' },
  reminder: { label: 'Lembrete', icon: GlyphClock, text: 'text-dv-text', tone: 'neutral', bar: 'bg-dv-text-3', kicker: 'muted' },
}
const RANK: Record<Level, number> = { critical: 0, directive: 1, reminder: 2 }

/**
 * Sinais do Gerente derivados do estado real do participante: tempo de vida restante,
 * Deadly Votes em andamento ou com inscrição aberta e avisos de perigo recebidos.
 */
export function useManagerSignals(entries: DeadlyVoteEntry[], actions: { onOpenVotes?: () => void; onOpenGames?: () => void }) {
  const { state } = useDevo()
  const now = useNow(1000)
  const remaining = Math.max(0, state.timerEndsAt - now)
  const tier = remaining === 0 ? 'zero' : remaining < HOUR ? 'hour' : remaining < 6 * HOUR ? 'six' : remaining < 24 * HOUR ? 'day' : 'ok'
  const { onOpenVotes, onOpenGames } = actions

  return useMemo(() => {
    const out: ManagerSignal[] = []
    const clock = lifeClock(remaining).join(":")

    if (tier !== 'ok') {
      out.push({
        id: `life-${tier}`,
        level: tier === 'day' ? 'reminder' : 'critical',
        source: 'Gerente · Pulso',
        title: tier === 'zero' ? 'Registro expirado' : tier === 'day' ? 'Tempo de vida reduzido' : 'Tempo de vida crítico',
        body:
          tier === 'zero'
            ? 'Seu tempo de vida chegou a zero. Aguarde a decisão do Dealer.'
            : `Restam ${clock} no seu registro. Recupere tempo antes do próximo Deadly Vote.`,
        at: now,
        action: onOpenGames && tier !== 'zero' ? { label: 'Acessar Sala de Jogos', run: onOpenGames } : undefined,
      })
    }

    for (const e of entries) {
      const v = e.vote
      if (v.status === 'em-progresso' && v.joined) {
        out.push({
          id: `live-${v.id}`,
          level: 'critical',
          source: 'Gerente',
          title: `${voteTitle(v)} em andamento`,
          body: v.briefing ?? 'Você está inscrito neste Deadly Vote. Siga as instruções do Dealer.',
          at: v.startsAt,
          action: onOpenVotes && { label: 'Ver Deadly Vote', run: onOpenVotes },
        })
      } else if (v.status === 'convocado' && !v.joined) {
        const full = v.maxParticipants !== null && v.participants >= v.maxParticipants
        if (!full) {
          out.push({
            id: `open-${v.id}`,
            level: 'directive',
            source: 'Gerente · Convocação',
            title: `Convocação: ${voteTitle(v)}`,
            body: `Inscrições abertas${v.maxParticipants ? ` · ${v.maxParticipants - v.participants} vagas restantes` : ''}. Início em ${formatStart(v.startsAt)}.`,
            at: v.startsAt,
            action: onOpenVotes && { label: 'Inscrever-se', run: onOpenVotes },
          })
        }
      } else if (v.status === 'convocado' && v.joined && v.startsAt - now < 24 * HOUR) {
        out.push({
          id: `soon-${v.id}`,
          level: 'reminder',
          source: 'Gerente',
          title: `${voteTitle(v)} se aproxima`,
          body: `Sua inscrição está confirmada. Início em ${formatStart(v.startsAt)}.`,
          at: v.startsAt,
        })
      }
    }

    for (const n of state.notifications) {
      if (n.tone !== 'danger') continue
      out.push({ id: `n-${n.id}`, level: 'critical', source: 'Gerente', title: n.title, body: n.body, at: n.createdAt })
    }

    return out.sort((a, b) => RANK[a.level] - RANK[b.level] || b.at - a.at)
    // `now` muda a cada segundo; só recalculamos quando a faixa de tempo muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, entries, state.notifications, onOpenVotes, onOpenGames, tier === 'ok' ? 0 : Math.floor(remaining / 1000)])
}

function formatStart(ts: number) {
  const d = new Date(ts)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function hhmm(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Painel do Gerente: terminal que alterna entre os sinais ativos, pausa ao focar/passar o mouse e
 * some quando não há nada. Vermelho só no nível crítico; diretrizes em cobalto.
 */
export function ManagerAlert({ signals, className, empty }: { signals: ManagerSignal[]; className?: string; empty?: ReactNode }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = signals.length
  const current = signals[Math.min(index, count - 1)]

  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  useEffect(() => {
    if (paused || count < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => clearInterval(t)
  }, [paused, count])

  if (!current) return empty ?? null
  const meta = LEVEL[current.level]
  const Icon = meta.icon
  const critical = current.level === 'critical'
  const go = (d: number) => setIndex((i) => (i + d + count) % count)

  return (
    <section
      aria-label="Avisos do Gerente"
      aria-live={critical ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={className}
    >
      <Frame variant={critical ? 'alert' : 'ink'} tone={meta.tone} cut="diag" cutSize={14} pad="none" glow={critical} className="overflow-hidden">
        <span aria-hidden="true" className={cn('absolute inset-y-3 left-0 w-[3px]', meta.bar)} />
        <span aria-hidden="true" className="dv-scanlines pointer-events-none absolute inset-0 opacity-40" />
        <div key={current.id} className="relative flex animate-dv-slide-right items-start gap-3 p-4 pl-5">
          <span
            aria-hidden="true"
            className={cn('dv-cut grid size-11 shrink-0 place-items-center bg-dv-ink/70 shadow-[inset_0_0_0_1px_currentColor]', meta.text)}
            style={{ '--dv-cut': '8px' } as CSSProperties}
          >
            <Icon className={cn('size-6', critical && 'animate-dv-alert')} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <Kicker tone={meta.kicker} glyph={false} className="text-[10px]">
                {current.source} · {meta.label}
              </Kicker>
              <span className="font-mono text-[11px] text-dv-text-3 dv-tabular">{hhmm(current.at)}</span>
            </div>
            <p className={cn('mt-1.5 font-display text-[16px] font-semibold uppercase leading-snug tracking-[0.06em] text-pretty', critical ? 'text-dv-blood-text' : 'text-dv-text')}>
              {current.title}
            </p>
            <p className="mt-1 font-body text-[15px] leading-relaxed text-dv-text-2 text-pretty">{current.body}</p>
          </div>
        </div>
        {(current.action || count > 1) && (
          <div className="relative flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pl-5">
            {current.action ? (
              <Button size="sm" variant={critical ? 'danger' : 'primary'} sfx="click" onClick={current.action.run} iconRight={<GlyphArrow />}>
                {current.action.label}
              </Button>
            ) : (
              <span />
            )}
            {count > 1 && (
              <div className="flex items-center">
                <IconButton label="Aviso anterior" variant="ghost" onClick={() => go(-1)}>
                  <GlyphArrow className="rotate-180" />
                </IconButton>
                <div className="flex gap-1 px-1" aria-hidden="true">
                  {signals.map((s, i) => (
                    <span key={s.id} className={cn('h-1 -skew-x-[20deg] transition-all duration-300', i === index ? cn('w-4', meta.bar) : 'w-1.5 bg-dv-text-3/60')} />
                  ))}
                </div>
                <span className="sr-only">
                  Aviso {index + 1} de {count}
                </span>
                <IconButton label="Próximo aviso" variant="ghost" onClick={() => go(1)}>
                  <GlyphArrow />
                </IconButton>
              </div>
            )}
          </div>
        )}
        {count > 1 && !paused && (
          <span key={`p-${current.id}`} aria-hidden="true" className={cn('dv-progress absolute bottom-0 left-0 h-[2px]', meta.bar)} style={{ animationDuration: `${ROTATE_MS}ms` }} />
        )}
      </Frame>
    </section>
  )
}
