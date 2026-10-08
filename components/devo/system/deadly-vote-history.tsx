'use client'

import { DEADLY_VOTE_STATUS, type DeadlyVoteEntry, formatVoteDate } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { LinkAction, SectionHeading, SystemLabel } from './primitives'

type HistoryProps = {
  entries: DeadlyVoteEntry[]
  limit?: number
  loading?: boolean
  error?: Error
  onSelect?: (entry: DeadlyVoteEntry) => void
  onViewAll?: () => void
  className?: string
  title?: boolean
}

export function DeadlyVoteHistory({ entries, limit, loading, error, onSelect, onViewAll, className, title = true }: HistoryProps) {
  const shown = limit ? entries.slice(0, limit) : entries
  return (
    <section aria-labelledby="dv-history" className={cn('flex flex-col', className)}>
      {title && (
        <SectionHeading
          title="Deadly Votes"
          jp="デッドリー・ボート履歴"
          action={onViewAll && entries.length > (limit ?? Infinity) ? <LinkAction onClick={onViewAll}>Ver histórico completo</LinkAction> : undefined}
        />
      )}
      <h2 id="dv-history" className="sr-only">
        Histórico de Deadly Votes
      </h2>
      {loading && !entries.length ? (
        <ul className="mt-2 flex flex-col" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex h-12 items-center gap-4 border-b border-border/70">
              <span className="h-2.5 w-10 animate-pulse bg-muted" />
              <span className="size-3 rounded-full border border-border" />
              <span className="h-2.5 flex-1 animate-pulse bg-muted" />
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <div className="mt-2 border border-dashed border-border px-4 py-6 text-center">
          <SystemLabel>{error ? 'Registro indisponível' : 'Nenhum registro'}</SystemLabel>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {error ? 'Não foi possível acessar o arquivo de votos agora.' : 'Seus jogos e partidas aparecerão aqui assim que forem registrados.'}
          </p>
        </div>
      ) : (
        <ol className="relative mt-1">
          <span aria-hidden="true" className="absolute bottom-6 left-[76px] top-6 w-px bg-border" />
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
  const live = entry.status === 'em-progresso'
  const content = (
    <>
      <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{formatVoteDate(entry.at)}</span>
      <span aria-hidden="true" className="relative z-10 grid w-5 shrink-0 place-items-center">
        <span
          className={cn(
            'grid size-3.5 place-items-center rounded-full border bg-card',
            live ? 'dv-pulse border-destructive' : 'border-foreground/60',
          )}
        >
          {live && <span className="size-1.5 rounded-full bg-destructive" />}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[13px] uppercase tracking-[0.1em] text-foreground">{entry.title}</span>
        {entry.detail && <span className="block truncate text-[12px] text-muted-foreground">{entry.detail}</span>}
      </span>
      <span
        className={cn(
          'flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]',
          meta.danger ? 'text-destructive' : 'text-muted-foreground',
          entry.status === 'cancelado' && 'line-through',
        )}
      >
        {live && <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />}
        {meta.label}
      </span>
    </>
  )
  const base = cn(
    'flex w-full items-center gap-3 border-b border-border/70 py-3 pr-1 text-left dv-enter',
    live && 'bg-destructive/[0.04]',
  )
  return (
    <li style={{ animationDelay: `${index * 60}ms` }} className="dv-enter">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className={cn(base, 'dv-trace transition-colors hover:bg-primary/[0.04] focus-visible:outline-none')}
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
