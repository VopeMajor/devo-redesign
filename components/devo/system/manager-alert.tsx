'use client'

import { AlertTriangle, ChevronLeft, ChevronRight, Info, Siren } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { type DeadlyVoteEntry, lifeClock, voteTitle } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { useDevo } from '../state/devo-store'
import { SystemLabel } from './primitives'

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

const LEVEL: Record<Level, { label: string; icon: typeof AlertTriangle; text: string; border: string; bar: string }> = {
  critical: { label: 'Alerta crítico', icon: Siren, text: 'text-destructive', border: 'border-destructive/50', bar: 'bg-destructive' },
  directive: { label: 'Diretriz', icon: AlertTriangle, text: 'text-dv-blue-light', border: 'border-primary/50', bar: 'bg-primary' },
  reminder: { label: 'Lembrete', icon: Info, text: 'text-foreground/80', border: 'border-border', bar: 'bg-foreground/40' },
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

/** Painel do Gerente: alterna entre os sinais ativos, pausa ao focar/passar o mouse e some quando não há nada. */
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
  const go = (d: number) => setIndex((i) => (i + d + count) % count)

  return (
    <section
      aria-label="Avisos do Gerente"
      aria-live={current.level === 'critical' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn('dv-dark relative overflow-hidden border bg-background text-foreground transition-colors', meta.border, className)}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-0.5', meta.bar)} />
      <div key={current.id} className="dv-enter flex items-start gap-3 p-4 pl-5 @lg:gap-4">
        <Icon className={cn('mt-0.5 size-6 shrink-0', meta.text, current.level === 'critical' && 'dv-pulse')} strokeWidth={1.4} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <SystemLabel>
              {current.source} · <span className={meta.text}>{meta.label}</span>
            </SystemLabel>
            <SystemLabel className="tabular-nums">{hhmm(current.at)}</SystemLabel>
          </div>
          <p className={cn('mt-1 font-mono text-[13px] uppercase tracking-[0.12em] text-pretty', meta.text)}>{current.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/75 text-pretty">{current.body}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {current.action ? (
              <button
                type="button"
                onClick={current.action.run}
                className={cn(
                  'border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
                  current.level === 'critical'
                    ? 'border-destructive/60 text-destructive hover:bg-destructive hover:text-white'
                    : 'border-primary/60 text-dv-blue-light hover:bg-primary hover:text-primary-foreground',
                )}
              >
                {current.action.label}
              </button>
            ) : (
              <span />
            )}
            {count > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => go(-1)} className="grid size-6 place-items-center text-foreground/60 hover:text-foreground" aria-label="Aviso anterior">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <div className="flex gap-1" aria-hidden="true">
                  {signals.map((s, i) => (
                    <span key={s.id} className={cn('h-1 transition-all', i === index ? cn('w-4', meta.bar) : 'w-1.5 bg-foreground/25')} />
                  ))}
                </div>
                <span className="sr-only">
                  Aviso {index + 1} de {count}
                </span>
                <button type="button" onClick={() => go(1)} className="grid size-6 place-items-center text-foreground/60 hover:text-foreground" aria-label="Próximo aviso">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {count > 1 && !paused && (
        <span key={`p-${current.id}`} aria-hidden="true" className={cn('dv-progress absolute bottom-0 left-0 h-px', meta.bar)} style={{ animationDuration: `${ROTATE_MS}ms` }} />
      )}
    </section>
  )
}
