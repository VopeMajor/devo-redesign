'use client'

import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { DEADLY_VOTE_STATUS, type DeadlyVote, type DeadlyVoteStatus, OUTCOME_LABEL, recordIdFor, voteTitle } from '@/lib/devo/deadly-votes'
import { shufflerStatus } from '@/lib/devo/shuffler'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { useOsNav } from '../os/os-nav'
import { DeckPanel } from '../shared/deck-panel'
import { useDevo } from '../state/devo-store'
import { DeadlyVoteHistory } from '../system/deadly-vote-history'
import { InvitePanel } from '../system/invite-panel'
import { ManagerAlert, useManagerSignals } from '../system/manager-alert'
import { PhotoPicker } from '../system/photo-picker'
import { SystemLabel, TechnicalDivider } from '../system/primitives'
import { RecordFile, type RecordFileData } from '../system/record-file'
import { useDeadlyVotes } from '../system/use-deadly-votes'

const CRITICAL_MS = 6 * 3600 * 1000

export function useRecordData(avatarVersion: number | null = null): RecordFileData {
  const { state } = useDevo()
  const now = useNow(1000)
  const remaining = Math.max(0, state.timerEndsAt - now)
  const critical = remaining < CRITICAL_MS
  return {
    name: state.playerName ?? 'Não identificado',
    recordId: recordIdFor(state.playerName),
    status: remaining === 0 ? { label: 'Eliminado', tone: 'critical' } : critical ? { label: 'Crítico', tone: 'critical' } : { label: 'Ativo', tone: 'active' },
    remainingMs: remaining,
    critical,
    arcano: null,
    shuffler: state.arcadeUnlocked ? shufflerStatus(true) : null,
    photoUrl: avatarVersion ? `/api/record/avatar?v=${avatarVersion}` : null,
    stats: [
      { label: 'Cartas', value: state.inventory.length },
      { label: 'Trocas', value: state.tradesCompleted },
      { label: 'Avisos', value: state.notifications.length },
    ],
  }
}

type Tab = 'record' | 'votes' | 'invites'

export function RecordApp() {
  const { state } = useDevo()
  const nav = useOsNav()
  const votes = useDeadlyVotes()
  const data = useRecordData(votes.record?.avatarVersion ?? null)
  const [tab, setTab] = useState<Tab>('record')
  const [selected, setSelected] = useState<string | null>(null)

  const openVotes = useCallback(() => setTab('votes'), [])
  const openGames = useCallback(() => nav.open('jogos'), [nav])
  const signals = useManagerSignals(votes.entries, { onOpenVotes: openVotes, onOpenGames: state.arcadeUnlocked ? openGames : undefined })
  const selectedVote = votes.entries.find((e) => e.id === selected)?.vote
  const isStaff = votes.record?.role === 'dealer' || votes.record?.role === 'admin'

  return (
    <div className="dv-light dv-paper devo-scroll relative h-full overflow-y-auto text-foreground @container">
      <span aria-hidden="true" className="dv-retrieve pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
      <div className="flex flex-col gap-5 p-4 @2xl:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Seções do registro" className="flex border border-border bg-card">
            {(
              [
                ['record', 'Record File'],
                ['votes', 'Deadly Votes'],
                ...(isStaff ? ([['invites', 'Convites']] as const) : []),
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id)
                  setSelected(null)
                }}
                className={cn(
                  'px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.16em] transition-colors',
                  tab === id ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:text-primary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <SystemLabel className="dv-reveal">
            Arquivo recuperado · {data.recordId}
            {votes.record && votes.record.role !== 'player' && <span className="ml-2 text-primary">· {votes.record.role}</span>}
          </SystemLabel>
        </div>

        {tab === 'invites' && isStaff ? (
          <InvitePanel />
        ) : tab === 'record' ? (
          <>
            <RecordFile
              data={data}
              className="dv-enter"
              photoAction={<PhotoPicker hasPhoto={!!data.photoUrl} onChanged={votes.refresh} />}
            />
            <ManagerAlert signals={signals} />
            <DeckPanel
              inventory={state.inventory}
              shufflerSynced={state.arcadeUnlocked}
              onViewAll={() => nav.open('cartas')}
              onAcquire={() => nav.open('trocas')}
              onSelect={() => nav.open('cartas')}
            />
            <TechnicalDivider index="02" label="Registro público" animated />
            <div className="border border-border bg-card p-4">
              <DeadlyVoteHistory
                entries={votes.entries}
                limit={4}
                loading={votes.isLoading}
                error={votes.error}
                onSelect={(e) => {
                  setTab('votes')
                  setSelected(e.id)
                }}
                onViewAll={openVotes}
              />
            </div>
          </>
        ) : selectedVote ? (
          <VoteDetail vote={selectedVote} onBack={() => setSelected(null)} onJoin={votes.join} onLeave={votes.leave} />
        ) : (
          <div className="flex flex-col gap-4">
            <StatusSummary statuses={votes.entries.map((e) => e.status)} />
            <div className="border border-border bg-card p-4">
              <DeadlyVoteHistory entries={votes.entries} loading={votes.isLoading} error={votes.error} onSelect={(e) => setSelected(e.id)} />
              {!votes.isLoading && !votes.entries.length && !votes.error && (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  Deadly Votes são os desafios do RPG. Quando um Dealer abrir uma convocação, ela aparecerá aqui para inscrição.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VoteDetail({
  vote,
  onBack,
  onJoin,
  onLeave,
}: {
  vote: DeadlyVote
  onBack: () => void
  onJoin: (id: string) => Promise<void>
  onLeave: (id: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meta = DEADLY_VOTE_STATUS[vote.status]
  const full = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const canJoin = vote.status === 'convocado' && !vote.joined && !full
  const canLeave = vote.status === 'convocado' && vote.joined

  async function run(fn: (id: string) => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn(vote.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na ação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="dv-enter flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Todos os Deadly Votes
      </button>
      <div className="border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <SystemLabel>Deadly Vote #{String(vote.number).padStart(3, '0')}</SystemLabel>
            <h2 className="mt-1 font-serif text-3xl uppercase leading-none tracking-wide text-balance">{voteTitle(vote)}</h2>
            {vote.arc && <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground">{vote.title}</p>}
          </div>
          <SystemLabel className={cn(meta.danger && 'text-destructive')}>{meta.label}</SystemLabel>
        </div>
        <dl className="grid grid-cols-2 @xl:grid-cols-3">
          <Field label="Início" value={new Date(vote.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
          <Field
            label="Participantes"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {vote.participants}
                {vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}
              </span>
            }
          />
          <Field label="Seu registro" value={vote.outcome ? OUTCOME_LABEL[vote.outcome] : vote.joined ? 'Inscrito' : 'Não inscrito'} danger={vote.outcome === 'eliminado'} />
        </dl>
        {vote.briefing && (
          <div className="border-t border-border p-4">
            <SystemLabel>Briefing do Dealer</SystemLabel>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-foreground/85 text-pretty">{vote.briefing}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
          {canJoin && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onJoin)}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Inscrever-se
            </button>
          )}
          {canLeave && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onLeave)}
              className="inline-flex items-center gap-2 border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Cancelar inscrição
            </button>
          )}
          {vote.status === 'convocado' && full && !vote.joined && <SystemLabel className="text-destructive">Vagas esgotadas</SystemLabel>}
          {vote.status !== 'convocado' && <SystemLabel>Inscrições encerradas · conduzido pelo Dealer</SystemLabel>}
          {error && (
            <p role="alert" className="w-full font-mono text-[11px] text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function Field({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div className="border-b border-r border-border px-4 py-3 last:border-r-0">
      <dt>
        <SystemLabel>{label}</SystemLabel>
      </dt>
      <dd className={cn('mt-1 font-mono text-[14px] uppercase tracking-[0.08em]', danger && 'text-destructive')}>{value}</dd>
    </div>
  )
}

function StatusSummary({ statuses }: { statuses: DeadlyVoteStatus[] }) {
  const keys: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'falha']
  return (
    <dl className="grid grid-cols-2 border border-border bg-card @xl:grid-cols-4">
      {keys.map((k, i) => (
        <div key={k} className={cn('px-4 py-3', i > 0 && 'border-l border-border', i === 2 && 'border-l-0 @xl:border-l')}>
          <dt>
            <SystemLabel className={cn(DEADLY_VOTE_STATUS[k].danger && 'text-destructive')}>{DEADLY_VOTE_STATUS[k].label}</SystemLabel>
          </dt>
          <dd className="font-serif text-4xl leading-none">{statuses.filter((s) => s === k).length}</dd>
        </div>
      ))}
    </dl>
  )
}
