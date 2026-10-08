'use client'

import type { CSSProperties } from 'react'
import { Badge, type BadgeTone, GlyphArrow, GlyphGavel } from '@/components/devo/kit'
import { DEADLY_VOTE_STATUS, type DeadlyVoteEntry, type DeadlyVoteStatus, formatVoteDate, OUTCOME_LABEL } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { LinkAction, SectionHeading } from './primitives'

type HistoryProps = {
  entries: DeadlyVoteEntry[]
  limit?: number
  loading?: boolean
  error?: Error
  onSelect?: (entry: DeadlyVoteEntry) => void
  onViewAll?: () => void
  className?: string
  title?: boolean
  /** Índice romano do cabeçalho. */
  index?: string
  /** Texto de vazio (sobrepõe o padrão). */
  emptyText?: string
}

export const STATUS_BADGE: Record<DeadlyVoteStatus, BadgeTone> = {
  convocado: 'cobalt',
  'em-progresso': 'blood',
  concluido: 'neutral',
  cancelado: 'neutral',
  falha: 'blood',
}

/** Placar público de um caso encerrado ("7 sobreviveram · 1 eliminado"). */
export function tallyText(survivors: number, eliminated: number) {
  if (!survivors && !eliminated) return null
  const s = survivors ? `${survivors} ${survivors === 1 ? 'sobreviveu' : 'sobreviveram'}` : null
  const e = eliminated ? `${eliminated} ${eliminated === 1 ? 'eliminado' : 'eliminados'}` : null
  return [s, e].filter(Boolean).join(' · ')
}

/**
 * Registro público dos Deadly Votes como arquivo de casos: cada linha é uma pasta numerada
 * (aba de papel com o número do caso), título, data, placar público e o seu resultado.
 */
export function DeadlyVoteHistory({ entries, limit, loading, error, onSelect, onViewAll, className, title = true, index, emptyText }: HistoryProps) {
  const shown = limit ? entries.slice(0, limit) : entries
  return (
    <section aria-labelledby="dv-history" className={cn('flex flex-col', className)}>
      {title && (
        <SectionHeading
          index={index}
          kicker="Registro público"
          title="Arquivo de casos"
          jp="デッドリー・ボート履歴"
          action={onViewAll && entries.length > (limit ?? Infinity) ? <LinkAction onClick={onViewAll}>Ver histórico completo</LinkAction> : undefined}
        />
      )}
      <h2 id="dv-history" className="sr-only">
        Histórico de Deadly Votes
      </h2>
      {loading && !entries.length ? (
        <ul className="mt-3 flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex h-[72px] items-center gap-3 border-b border-dv-line">
              <span className="dv-cut-diag h-12 w-14 animate-pulse bg-dv-ink-4" style={{ '--dv-cut': '8px' } as CSSProperties} />
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-3 w-2/3 animate-pulse bg-dv-ink-4" />
                <span className="h-2.5 w-1/3 animate-pulse bg-dv-ink-3" />
              </span>
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <div className="dv-stitch mt-3 flex flex-col items-center gap-2 px-5 py-7 text-center text-dv-text-3">
          <GlyphGavel className="size-7 text-dv-gold/70" />
          <p className="dv-label text-[11px] text-dv-text-2">{error ? 'Registro indisponível' : 'Nenhum caso arquivado'}</p>
          <p className="max-w-[30ch] font-body text-[15px] leading-relaxed text-dv-text-2">
            {error ? 'Não foi possível acessar o arquivo de votos agora.' : (emptyText ?? 'Os Deadly Votes encerrados aparecerão aqui, com o resultado de cada caso.')}
          </p>
        </div>
      ) : (
        <ol className="mt-2 flex flex-col">
          {shown.map((e, i) => (
            <DeadlyVoteHistoryItem key={e.id} entry={e} onSelect={onSelect} index={i} />
          ))}
        </ol>
      )}
    </section>
  )
}

export function DeadlyVoteHistoryItem({ entry, onSelect, index = 0 }: { entry: DeadlyVoteEntry; onSelect?: (entry: DeadlyVoteEntry) => void; index?: number }) {
  const meta = DEADLY_VOTE_STATUS[entry.status]
  const v = entry.vote
  const live = entry.status === 'em-progresso'
  const closed = entry.status === 'concluido' || entry.status === 'falha'
  const tally = closed ? tallyText(v.survivors, v.eliminated) : null
  const sub = v.arc ? v.title : null
  const content = (
    <>
      {/* Aba de papel com o número do caso */}
      <span
        aria-hidden="true"
        className={cn(
          'dv-paper-bg dv-cut-diag flex w-14 shrink-0 flex-col items-center justify-center self-stretch py-1.5 text-dv-paper-ink',
          entry.status === 'cancelado' && 'opacity-60',
        )}
        style={{ '--dv-cut': '9px' } as CSSProperties}
      >
        <span className="dv-label text-[10px] tracking-[0.14em] text-dv-paper-ink/60">Caso</span>
        <span className="font-impact text-[22px] font-bold leading-none dv-tabular">{String(v.number).padStart(3, '0')}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text', entry.status === 'cancelado' && 'line-through decoration-dv-text-3')}>
            {entry.title}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-dv-text-3 dv-tabular">{formatVoteDate(entry.at)}</span>
        </span>
        {(sub || tally) && <span className="truncate font-body text-[14px] leading-snug text-dv-text-2">{[sub, tally].filter(Boolean).join(' · ')}</span>}
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge tone={STATUS_BADGE[entry.status]} live={live}>
            {meta.label}
          </Badge>
          {v.outcome ? (
            <Badge tone={v.outcome === 'eliminado' ? 'blood' : 'cobalt'}>Você · {OUTCOME_LABEL[v.outcome]}</Badge>
          ) : v.joined ? (
            <Badge tone="paper">Inscrito</Badge>
          ) : null}
        </span>
      </span>
      {onSelect && <GlyphArrow className="size-4 shrink-0 self-center text-dv-text-3 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-dv-cobalt-text" />}
    </>
  )
  const base = cn('group relative flex w-full items-stretch gap-3 border-b border-dv-line py-3 text-left', live && 'bg-[linear-gradient(90deg,rgba(213,31,43,0.12),transparent_70%)]')
  return (
    <li style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }} className="animate-dv-rise">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className={cn(base, 'dv-focus transition-colors hover:bg-white/[0.03]')}
          aria-label={`${entry.title}, ${meta.label}, ${formatVoteDate(entry.at)}`}
        >
          {content}
        </button>
      ) : (
        <div className={base}>{content}</div>
      )}
    </li>
  )
}
