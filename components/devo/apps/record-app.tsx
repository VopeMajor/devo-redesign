'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import {
  PaperField,
  Badge,
  Button,
  Countdown,
  Frame,
  GlyphArrow,
  GlyphGavel,
  ImpactTitle,
  Kicker,
  Reveal,
  SceneBackdrop,
  SectionHeader,
  Stagger,
  Stamp,
  Stat,
  StatGrid,
  Tabs,
  type TabItem,
} from '@/components/devo/kit'
import { arcLabel, DEADLY_VOTE_STATUS, type DeadlyVote, type DeadlyVoteStatus, OUTCOME_LABEL, recordIdFor, voteTitle } from '@/lib/devo/deadly-votes'
import { shufflerStatus } from '@/lib/devo/shuffler'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { useOsNav } from '../os/os-nav'
import { DeckPanel } from '../shared/deck-panel'
import { useDevo } from '../state/devo-store'
import { DealerBoard } from '../system/dealer-board'
import { DeadlyVoteHistory, STATUS_BADGE, tallyText } from '../system/deadly-vote-history'
import { InvitePanel } from '../system/invite-panel'
import { ManagerAlert, useManagerSignals } from '../system/manager-alert'
import { PhotoPicker } from '../system/photo-picker'
import { RecordFile, type RecordFileData } from '../system/record-file'
import { useDeadlyVotes } from '../system/use-deadly-votes'

const CRITICAL_MS = 6 * 3600 * 1000
const ROLE_LABEL = { player: 'Jogador', dealer: 'Dealer', admin: 'Admin' } as const

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
const OPEN: DeadlyVoteStatus[] = ['convocado', 'em-progresso']

/**
 * Record — o dossiê oficial do jogo mortal: documento de tribunal + terminal, sobre a cena
 * `tribunal`. A cena entra em alerta com convocação aberta, voto em andamento ou tempo crítico.
 */
export function RecordApp() {
  const { state } = useDevo()
  const nav = useOsNav()
  const votes = useDeadlyVotes()
  const data = useRecordData(votes.record?.avatarVersion ?? null)
  const [tab, setTab] = useState<Tab>('record')
  const [selected, setSelected] = useState<string | null>(null)

  const openVotes = useCallback(() => {
    setTab('votes')
    setSelected(null)
  }, [])
  const openGames = useCallback(() => nav.open('jogos'), [nav])
  const signals = useManagerSignals(votes.entries, { onOpenVotes: openVotes, onOpenGames: state.arcadeUnlocked ? openGames : undefined })
  const selectedVote = votes.entries.find((e) => e.id === selected)?.vote
  const role = votes.record?.role
  const isStaff = role === 'dealer' || role === 'admin'
  const alert = data.critical || votes.entries.some((e) => OPEN.includes(e.status))

  const items: TabItem<Tab>[] = [
    { value: 'record', label: 'Record File' },
    { value: 'votes', label: 'Deadly Votes', count: votes.entries.filter((e) => e.status === 'convocado' && !e.vote.joined).length },
    ...(isStaff ? [{ value: 'invites' as const, label: 'Convites' }] : []),
  ]

  return (
    <div className="relative h-full overflow-hidden bg-dv-ink text-dv-text @container">
      <SceneBackdrop preset="tribunal" intensity={0.55} dim={0.55} alert={alert} />
      <div className="devo-scroll absolute inset-0 overflow-y-auto">
        <div className="relative mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-4 @2xl:px-6">
          <header className="flex animate-dv-fade items-center justify-between gap-3">
            <Kicker tone="gold">
              Arquivo recuperado · <span className="whitespace-nowrap">{data.recordId}</span>
            </Kicker>
            {role && role !== 'player' && <Badge tone="cobalt">{ROLE_LABEL[role]}</Badge>}
          </header>

          <Tabs
            label="Seções do registro"
            items={items}
            value={tab}
            onValueChange={(v) => {
              setTab(v)
              setSelected(null)
            }}
            fill
            className="-mx-1 [&_[role=tab]]:flex-auto [&_[role=tab]]:gap-1.5 [&_[role=tab]]:whitespace-nowrap [&_[role=tab]]:px-1.5 [&_[role=tab]]:text-[11.5px] [&_[role=tab]]:tracking-[0.08em] @md:[&_[role=tab]]:px-3 @md:[&_[role=tab]]:text-[13px] @md:[&_[role=tab]]:tracking-[0.14em]"
            panelClassName="pt-5"
          >
            {tab === 'invites' && isStaff ? (
              <Stagger key="invites" className="flex flex-col gap-5">
                <InvitePanel />
                <DealerBoard />
              </Stagger>
            ) : tab === 'record' ? (
              <Stagger key="record" className="flex flex-col gap-5" delay={60}>
                <RecordFile data={data} photoAction={<PhotoPicker hasPhoto={!!data.photoUrl} onChanged={votes.refresh} />} />
                {signals.length > 0 && <ManagerAlert signals={signals} />}
                <DeckPanel
                  inventory={state.inventory}
                  shufflerSynced={state.arcadeUnlocked}
                  onViewAll={() => nav.open('cartas')}
                  onAcquire={() => nav.open('trocas')}
                  onSelect={() => nav.open('cartas')}
                />
                <Frame cut="diag" cutSize={16} pad="md">
                  <DeadlyVoteHistory
                    index="II"
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
                </Frame>
              </Stagger>
            ) : selectedVote ? (
              <Reveal key={`v-${selectedVote.id}`} variant="right">
                <VoteDetail vote={selectedVote} onBack={() => setSelected(null)} onJoin={votes.join} onLeave={votes.leave} />
              </Reveal>
            ) : (
              <VotesBoard entries={votes.entries} loading={votes.isLoading} error={votes.error} onSelect={setSelected} onJoin={votes.join} onLeave={votes.leave} />
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

type Entries = ReturnType<typeof useDeadlyVotes>['entries']

function VotesBoard({
  entries,
  loading,
  error,
  onSelect,
  onJoin,
  onLeave,
}: {
  entries: Entries
  loading: boolean
  error?: Error
  onSelect: (id: string) => void
  onJoin: (id: string) => Promise<void>
  onLeave: (id: string) => Promise<void>
}) {
  const open = entries.filter((e) => OPEN.includes(e.status))
  const archive = entries.filter((e) => !OPEN.includes(e.status))
  return (
    <div className="flex flex-col gap-5">
      <Reveal variant="cut">
        <SectionHeader index="I" kicker="Tribunal · Convocações" title="Deadly Votes" jp="デッドリー・ボート" />
      </Reveal>
      <Stagger className="flex flex-col gap-5" delay={120}>
        {open.map((e) => (
          <ConvocationPoster key={e.id} vote={e.vote} onJoin={onJoin} onLeave={onLeave} onOpen={() => onSelect(e.id)} />
        ))}
        {!loading && !open.length && !error && (
          <Frame cut="diag" pad="md" className="text-center">
            <GlyphGavel className="mx-auto size-8 text-dv-gold/80" />
            <p className="mt-2 font-display text-[16px] font-semibold uppercase tracking-[0.08em]">Nenhuma convocação aberta</p>
            <p className="mx-auto mt-1 max-w-[34ch] font-body text-[15px] leading-relaxed text-dv-text-2">
              Deadly Votes são os desafios do RPG. Quando um Dealer abrir uma convocação, ela aparecerá aqui para inscrição.
            </p>
          </Frame>
        )}
        <StatusSummary statuses={entries.map((e) => e.status)} />
        <Frame cut="diag" cutSize={16} pad="md">
          <DeadlyVoteHistory index="II" entries={archive} loading={loading} error={error} onSelect={(e) => onSelect(e.id)} />
        </Frame>
      </Stagger>
    </div>
  )
}

function useVoteAction(id: string) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: (id: string) => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na ação.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

/** Cartaz de convocação: o herói da aba. Vermelho só quando falta pouco (< 6h) ou já começou. */
function ConvocationPoster({
  vote,
  onJoin,
  onLeave,
  onOpen,
}: {
  vote: DeadlyVote
  onJoin: (id: string) => Promise<void>
  onLeave: (id: string) => Promise<void>
  onOpen: () => void
}) {
  const now = useNow(30_000)
  const { busy, error, run } = useVoteAction(vote.id)
  const live = vote.status === 'em-progresso'
  const urgent = live || vote.startsAt - now < CRITICAL_MS
  const full = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const canJoin = vote.status === 'convocado' && !vote.joined && !full
  const canLeave = vote.status === 'convocado' && vote.joined
  const slots = vote.maxParticipants ? Math.min(vote.maxParticipants, 24) : 0
  const filled = vote.maxParticipants ? Math.round((Math.min(vote.participants, vote.maxParticipants) / vote.maxParticipants) * slots) : 0

  return (
    <Frame
      as="article"
      aria-label={`Convocação: ${voteTitle(vote)}`}
      variant={urgent ? 'alert' : 'ink'}
      tone={urgent ? 'blood' : 'gold'}
      ornate
      glow={urgent}
      cutSize={18}
      pad="none"
    >
      {urgent && <span aria-hidden="true" className="dv-hazard pointer-events-none absolute inset-x-6 top-0 h-1.5 opacity-80" />}
      <div className="relative p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <ImpactTitle as="h2" tone={urgent ? 'blood' : 'cobalt'} sub={`Deadly Vote № ${String(vote.number).padStart(3, '0')}`} className="[&_h2]:text-[44px]">
            {live ? 'Em sessão' : 'Convocação'}
          </ImpactTitle>
          {vote.joined && (
            <Stamp text="Inscrito" shape="round" tone={urgent ? 'blood' : 'cobalt'} rotate={12} size={70} className={cn('-mr-1 -mt-1 shrink-0', !urgent && 'text-dv-cobalt-text')} />
          )}
        </div>

        {vote.arc && <p className="mt-5 dv-label text-[10px] text-dv-gold">{arcLabel(vote.arc)}</p>}
        <h3 className={cn('font-display text-[24px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text text-balance', vote.arc ? 'mt-1' : 'mt-5')}>{vote.title}</h3>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-dv-line pt-4">
          <div className="min-w-0">
            <p className={cn('dv-label text-[10px]', urgent ? 'text-dv-blood-text' : 'text-dv-text-3')}>{live ? 'Em andamento desde' : 'Início em'}</p>
            {live ? (
              <p className="mt-1 font-impact text-[28px] font-semibold leading-none text-dv-blood-text dv-tabular">
                {new Date(vote.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <Countdown endsAt={vote.startsAt} size="md" units sound={false} label="Início em" className="mt-1.5" />
            )}
          </div>
          <div className="text-right">
            <p className="dv-label text-[10px] text-dv-text-3">Vagas</p>
            <p className="mt-1.5 font-impact text-[28px] font-semibold leading-none dv-tabular">
              {vote.participants}
              <span className="text-[18px] text-dv-text-3">{vote.maxParticipants ? ` / ${vote.maxParticipants}` : ' inscritos'}</span>
            </p>
          </div>
        </div>
        {slots > 0 && (
          <div aria-hidden="true" className="mt-3 flex gap-[3px]">
            {Array.from({ length: slots }, (_, i) => (
              <span
                key={i}
                className={cn('h-2 flex-1 -skew-x-[20deg]', i < filled ? (full ? 'bg-dv-blood' : 'bg-dv-cobalt shadow-[0_0_6px_rgba(49,93,255,0.6)]') : 'bg-dv-ink-4')}
              />
            ))}
          </div>
        )}

        {vote.briefing && (
          <blockquote className="mt-4 border-l-2 border-dv-gold/70 pl-3 font-body text-[16px] italic leading-relaxed text-dv-text-2">{vote.briefing}</blockquote>
        )}

        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-3">
          {new Date(vote.startsAt).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="relative flex flex-col gap-2 border-t border-dv-line px-5 pb-5 pt-4">
        {canJoin && (
          <Button block size="lg" loading={busy} sfx="confirm" onClick={() => run(onJoin)}>
            Inscrever-se
          </Button>
        )}
        {canLeave && (
          <Button block variant="secondary" loading={busy} sfx="click" onClick={() => run(onLeave)}>
            Cancelar inscrição
          </Button>
        )}
        {vote.status === 'convocado' && full && !vote.joined && (
          <Badge tone="blood" className="self-start">
            Vagas esgotadas
          </Badge>
        )}
        {live && (
          <Badge tone="blood" live className="self-start">
            Inscrições encerradas · conduzido pelo Dealer
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={onOpen} iconRight={<GlyphArrow />} className="self-center">
          Ver dossiê do caso
        </Button>
        {error && (
          <p role="alert" className="font-mono text-[12px] text-dv-blood-text">
            {error}
          </p>
        )}
      </div>
    </Frame>
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
  const { busy, error, run } = useVoteAction(vote.id)
  const meta = DEADLY_VOTE_STATUS[vote.status]
  const full = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const canJoin = vote.status === 'convocado' && !vote.joined && !full
  const canLeave = vote.status === 'convocado' && vote.joined
  const tally = tallyText(vote.survivors, vote.eliminated)

  return (
    <article className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onBack} sfx="close" icon={<GlyphArrow className="rotate-180" />} className="self-start">
        Todos os Deadly Votes
      </Button>
      <Frame variant="paper" ornate cutSize={16} pad="none" className="drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]">
        <header className="px-5 pb-4 pt-5">
          <p className="dv-label text-[10px] text-dv-paper-ink/65">Deadly Vote #{String(vote.number).padStart(3, '0')} · Dossiê do caso</p>
          <h2 className="mt-2 font-display text-[28px] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-balance">{vote.title}</h2>
          {vote.arc && <p className="mt-1 font-body text-[16px] italic text-dv-paper-ink/75">{arcLabel(vote.arc)}</p>}
          <div className="mt-3">
            <span
              className={cn(
                'dv-cut-diag inline-flex h-7 items-center gap-2 px-2.5 font-mono text-[11px] uppercase tracking-[0.16em]',
                meta.danger ? 'bg-dv-blood text-white' : STATUS_BADGE[vote.status] === 'cobalt' ? 'bg-dv-cobalt-deep text-white' : 'bg-dv-paper-ink/10 text-dv-paper-ink',
              )}
              style={{ '--dv-cut': '6px' } as CSSProperties}
            >
              {meta.label}
            </span>
          </div>
        </header>
        <div aria-hidden="true" className="relative mx-5 h-1.5 overflow-hidden">
          <span className="absolute inset-y-0 -left-2 right-10 -skew-x-[18deg] bg-dv-cobalt-deep" />
        </div>

        <dl className="mx-5 mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <PaperField label="Início" value={new Date(vote.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
          <PaperField label="Participantes" value={`${vote.participants}${vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}`} />
          <PaperField label="Seu registro" value={vote.outcome ? OUTCOME_LABEL[vote.outcome] : vote.joined ? 'Inscrito' : 'Não inscrito'} danger={vote.outcome === 'eliminado'} />
          {tally && <PaperField label="Resultado público" value={tally} />}
        </dl>

        {vote.briefing && (
          <div className="mx-5 mt-4 border-t border-dashed border-dv-paper-ink/35 pt-3">
            <p className="dv-label text-[10px] text-dv-paper-ink/65">Briefing do Dealer</p>
            <p className="mt-2 whitespace-pre-line font-body text-[16px] leading-relaxed text-dv-paper-ink/90 text-pretty">{vote.briefing}</p>
          </div>
        )}

        {vote.outcome && (
          <div className="mx-5 mt-4 flex justify-end">
            {vote.outcome === 'eliminado' ? (
              <Stamp text="Eliminado" tone="blood" rotate={-10} size={130} animate />
            ) : (
              <Stamp text="Sobreviveu" shape="round" tone="cobalt" rotate={-8} size={104} animate />
            )}
          </div>
        )}

        <div className="mx-5 mb-5 mt-4 flex flex-col gap-2 border-t border-dv-paper-ink/20 pt-4">
          {canJoin && (
            <Button block loading={busy} sfx="confirm" onClick={() => run(onJoin)}>
              Inscrever-se
            </Button>
          )}
          {canLeave && (
            <Button block variant="secondary" loading={busy} sfx="click" onClick={() => run(onLeave)}>
              Cancelar inscrição
            </Button>
          )}
          {vote.status === 'convocado' && full && !vote.joined && <p className="dv-label text-[11px] text-dv-blood">Vagas esgotadas</p>}
          {vote.status !== 'convocado' && <p className="dv-label text-[10px] text-dv-paper-ink/65">Inscrições encerradas · conduzido pelo Dealer</p>}
          {error && (
            <p role="alert" className="font-mono text-[12px] text-dv-blood">
              {error}
            </p>
          )}
        </div>
      </Frame>
    </article>
  )
}

function StatusSummary({ statuses }: { statuses: DeadlyVoteStatus[] }) {
  const n = (k: DeadlyVoteStatus) => statuses.filter((s) => s === k).length
  return (
    <Frame cut="diag" pad="md">
      <StatGrid cols={4}>
        <Stat label="Convocações" value={n('convocado')} tone="cobalt" size="sm" />
        <Stat label="Em progresso" value={n('em-progresso')} tone={n('em-progresso') ? 'blood' : 'text'} size="sm" />
        <Stat label="Concluídos" value={n('concluido')} size="sm" />
        <Stat label="Falhas" value={n('falha')} tone={n('falha') ? 'blood' : 'text'} size="sm" />
      </StatGrid>
    </Frame>
  )
}
