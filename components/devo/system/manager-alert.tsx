'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import { GlyphAlert, GlyphArrow, GlyphClock, GlyphGavel, RecordTitle } from '@/components/devo/kit'
import { type DeadlyVoteEntry, lifeClock, voteTitle } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { useDevo } from '../state/devo-store'
import { usePlayerText } from '../state/player-text'
import { RecButton } from './record-ui'

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

/** Rubi só no crítico; diretriz em prata com joia ametista; lembrete em cinza. */
const LEVEL: Record<Level, { label: string; icon: typeof GlyphAlert; text: string; bar: string }> = {
  critical: { label: 'Alerta crítico', icon: GlyphAlert, text: 'text-in-alert', bar: 'bg-in-alert' },
  directive: { label: 'Diretriz', icon: GlyphGavel, text: 'text-in-fg', bar: 'bg-dv-amethyst' },
  reminder: { label: 'Lembrete', icon: GlyphClock, text: 'text-in-fg-2', bar: 'bg-in-fg-3' },
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
  const say = usePlayerText()

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
          level: 'directive',
          source: 'Gerente · Em andamento',
          title: `${voteTitle(v)} começou`,
          body: v.groupUrl
            ? 'O Dealer abriu o grupo do WhatsApp. Só os inscritos veem o link no Record.'
            : say('Você está inscrit{o|a}. O Dealer vai liberar o link do grupo aqui no Record.'),
          at: v.startsAt,
          action: onOpenVotes && { label: 'Ver Deadly Vote', run: onOpenVotes },
        })
      } else if ((v.status === 'falha' || v.status === 'cancelado') && v.joined && now - (v.endsAt ?? v.startsAt) < 3 * 24 * HOUR) {
        out.push({
          id: `stop-${v.id}`,
          level: v.status === 'falha' ? 'critical' : 'reminder',
          source: 'Gerente',
          title: v.status === 'falha' ? `Falha do sistema em ${voteTitle(v)}` : `${voteTitle(v)} foi cancelado`,
          body: v.status === 'falha' ? 'O caso foi interrompido. Aguarde a decisão do Dealer sobre os registros.' : 'O Dealer suspendeu esta edição. Sua inscrição não conta como participação.',
          at: v.endsAt ?? v.startsAt,
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
  }, [tier, entries, state.notifications, onOpenVotes, onOpenGames, say, tier === 'ok' ? 0 : Math.floor(remaining / 1000)])
}

function formatStart(ts: number) {
  const d = new Date(ts)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function hhmm(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Painel do Gerente (NOTIFICAÇÕES da ref. do Record): painel de mármore negro que alterna entre os
 * sinais ativos, pausa ao focar/passar o mouse e some quando não há nada. Rubi só no nível crítico
 * (com a faixa listrada do terminal); diretrizes em prata com joia ametista.
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
      className={cn('dv-interior-dark dv-record-panel dv-cut-diag relative overflow-hidden', className)}
      style={{ '--dv-cut': '12px' } as CSSProperties}
    >
      <header className="relative flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
        <RecordTitle title="Gerente" jp="通知" size="sm" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3 dv-tabular">
          {String(Math.min(index, count - 1) + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
        <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,var(--in-brass)_0%,color-mix(in_oklab,var(--in-brass)_35%,transparent)_45%,transparent_100%)]" />
      </header>
      <div key={current.id} className="relative flex animate-dv-slide-right items-start gap-3.5 px-4 pb-4 pt-3.5">
        <span aria-hidden="true" className={cn('absolute bottom-4 left-0 top-3.5 w-[2px]', meta.bar)} />
        <span aria-hidden="true" className={cn('grid size-11 shrink-0 place-items-center', meta.text)}>
          <Icon className={cn('size-7', critical && 'animate-dv-alert')} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">{current.source}</p>
            <span className="font-mono text-[11px] text-in-fg-3 dv-tabular">{hhmm(current.at)}</span>
          </div>
          <p className={cn('mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em]', meta.text)}>
            {current.level === 'directive' && <span aria-hidden="true" className="mr-2 inline-block size-1.5 -translate-y-px rotate-45 bg-dv-amethyst" />}
            {meta.label}
          </p>
          <p className="mt-1.5 font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg text-pretty">{current.title}</p>
          <p className="mt-1 font-body text-[15px] leading-relaxed text-in-fg-2 text-pretty">{current.body}</p>
        </div>
      </div>
      {(current.action || count > 1) && (
        <div className="relative flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
          {current.action ? (
            <RecButton size="sm" variant={critical ? 'danger' : 'primary'} sfx="click" onClick={current.action.run} iconRight={<GlyphArrow />}>
              {current.action.label}
            </RecButton>
          ) : (
            <span />
          )}
          {count > 1 && (
            <div className="flex items-center">
              <button type="button" aria-label="Aviso anterior" onClick={() => go(-1)} className="dv-focus grid size-11 place-items-center text-in-fg-2 transition-colors hover:text-in-fg">
                <GlyphArrow className="size-4 rotate-180" />
              </button>
              <div className="flex gap-1 px-1" aria-hidden="true">
                {signals.map((s, i) => (
                  <span key={s.id} className={cn('h-1 -skew-x-[20deg] transition-all duration-300', i === index ? cn('w-4', meta.bar) : 'w-1.5 bg-in-fg-3/60')} />
                ))}
              </div>
              <span className="sr-only">
                Aviso {index + 1} de {count}
              </span>
              <button type="button" aria-label="Próximo aviso" onClick={() => go(1)} className="dv-focus grid size-11 place-items-center text-in-fg-2 transition-colors hover:text-in-fg">
                <GlyphArrow className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
      {count > 1 && !paused && (
        <span key={`p-${current.id}`} aria-hidden="true" className={cn('dv-progress absolute bottom-0 left-0 h-[2px]', meta.bar)} style={{ animationDuration: `${ROTATE_MS}ms` }} />
      )}
    </section>
  )
}
