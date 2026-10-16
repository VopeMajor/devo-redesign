'use client'

import type { BadgeTone } from '@/components/devo/kit'
import { GlyphGavel, PanelLink, RecordTitle } from '@/components/devo/kit'
import { arcLabel, DEADLY_VOTE_STATUS, type DeadlyVoteEntry, type DeadlyVoteStatus, formatVoteDate, OUTCOME_LABEL } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { STATUS_TEXT, StatusMark } from './record-ui'

type HistoryProps = {
  entries: DeadlyVoteEntry[]
  limit?: number
  loading?: boolean
  error?: Error
  onSelect?: (entry: DeadlyVoteEntry) => void
  onViewAll?: () => void
  className?: string
  title?: boolean
  /** Título do bloco (padrão: "Deadly Votes", como na referência do Record). */
  heading?: string
  /** Legenda japonesa do título. */
  jp?: string
  /** Texto de vazio (sobrepõe o padrão). */
  emptyText?: string
  /** Mantido por compatibilidade (o interior não usa índice romano). */
  index?: string
}

/** Tom do selo de estado no kit (para telas fora do interior). */
export const STATUS_BADGE: Record<DeadlyVoteStatus, BadgeTone> = {
  convocado: 'cobalt',
  'em-progresso': 'paper',
  concluido: 'gold',
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
 * Registro dos Deadly Votes em linha do tempo (ref. do Record): data à esquerda, nó do estado,
 * nome do caso com pontilhado e o estado à direita. Cada um dos cinco estados tem marca própria
 * (record-ui › StatusMark). Use dentro de um RecordPanel escuro ou sobre o papel.
 */
export function DeadlyVoteHistory({
  entries,
  limit,
  loading,
  error,
  onSelect,
  onViewAll,
  className,
  title = true,
  heading = 'Deadly Votes',
  jp = 'デッドリー・ボート履歴',
  emptyText,
}: HistoryProps) {
  const shown = limit ? entries.slice(0, limit) : entries
  return (
    <section aria-labelledby="dv-history" className={cn('flex flex-col', className)}>
      {title ? (
        <header className="relative flex items-center justify-between gap-3 pb-2.5">
          <RecordTitle title={heading} jp={jp} />
          {onViewAll && entries.length > (limit ?? Infinity) && <PanelLink label="Ver histórico completo" onClick={onViewAll} className="shrink-0" />}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,var(--in-brass)_0%,color-mix(in_oklab,var(--in-brass)_35%,transparent)_45%,transparent_100%)]" />
        </header>
      ) : null}
      <h2 id="dv-history" className="sr-only">
        Histórico de Deadly Votes
      </h2>
      {loading && !entries.length ? (
        <ul className="mt-2 flex flex-col" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex h-[52px] items-center gap-3">
              <span className="h-2.5 w-10 animate-pulse bg-in-fg/10" />
              <span className="size-3 animate-pulse rounded-full bg-in-fg/15" />
              <span className="h-3 flex-1 animate-pulse bg-in-fg/10" />
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 px-5 py-6 text-center shadow-[inset_0_0_0_1px_var(--in-line)]">
          <GlyphGavel className="size-7 text-in-brass" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg-2">{error ? 'Registro indisponível' : 'Nenhum caso arquivado'}</p>
          <p className="max-w-[30ch] font-body text-[15px] leading-relaxed text-in-fg-2">
            {error ? 'Não foi possível acessar o arquivo de votos agora.' : (emptyText ?? 'Os Deadly Votes encerrados aparecerão aqui, com o resultado de cada caso.')}
          </p>
        </div>
      ) : (
        <ol className="relative mt-1.5 flex flex-col">
          <span aria-hidden="true" className="absolute bottom-6 left-[65px] top-6 w-px bg-in-line-strong" />
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
  const closed = entry.status === 'concluido' || entry.status === 'falha'
  const tally = closed ? tallyText(v.survivors, v.eliminated) : null
  const mine = v.outcome ? `Você · ${OUTCOME_LABEL[v.outcome]}` : v.joined ? 'Você · inscrito' : null
  const sub = [arcLabel(v.arc), tally].filter(Boolean).join(' · ')
  const content = (
    <>
      <span className="w-[46px] shrink-0 pt-[3px] font-mono text-[12px] tabular-nums tracking-[0.04em] text-in-fg-2">{formatVoteDate(entry.at)}</span>
      <span className="grid w-[18px] shrink-0 place-items-center pt-[5px]">
        <StatusMark status={entry.status} size={entry.status === 'em-progresso' ? 13 : 12} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('truncate font-mono text-[13px] uppercase tracking-[0.08em] text-in-fg', entry.status === 'cancelado' && 'text-in-fg-2')}>{entry.title}</span>
          <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-[repeating-linear-gradient(90deg,var(--in-line-strong)_0_1px,transparent_1px_4px)]" />
        </span>
        {(sub || mine) && (
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-[12px] leading-snug text-in-fg-3">
            {sub && <span className="truncate">{sub}</span>}
            {mine && (
              <span className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', v.outcome === 'eliminado' ? 'text-in-alert' : 'text-in-accent')}>{mine}</span>
            )}
          </span>
        )}
      </span>
      <span className={cn('flex max-w-[34%] shrink-0 items-center gap-1.5 pt-[3px] text-right font-sans text-[10px] font-medium uppercase leading-tight tracking-[0.12em]', STATUS_TEXT[entry.status])}>
        {entry.status === 'em-progresso' && <span aria-hidden="true" className="size-1.5 shrink-0 animate-dv-blink rounded-full bg-current" />}
        {meta.label}
      </span>
    </>
  )
  const base = 'group relative flex w-full items-start gap-2.5 py-3 text-left'
  return (
    <li style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }} className="animate-dv-rise">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className={cn(base, 'dv-focus min-h-[52px] transition-colors hover:bg-in-fg/[0.04]')}
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
