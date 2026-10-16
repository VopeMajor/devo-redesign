'use client'

import { Link2, Lock, MapPin } from 'lucide-react'
import { type CSSProperties, useCallback, useState } from 'react'
import {
  BrassCorners,
  CobaltTabs,
  Countdown,
  EmblemVotes,
  FUTURE_SYSTEMS,
  GlyphArrow,
  GlyphGavel,
  HudCode,
  HudRule,
  hudCode,
  LockedFeature,
  PaperField,
  PaperSheet,
  RecordPanel,
  RecordTitle,
  Reveal,
  Stagger,
  Stamp,
  type TabItem,
  TimeDigits,
} from '@/components/devo/kit'
import { arcLabel, DEADLY_VOTE_STATUS, type DeadlyVote, type DeadlyVoteStatus, OUTCOME_LABEL, recordIdFor, voteTitle } from '@/lib/devo/deadly-votes'
import { shufflerStatus } from '@/lib/devo/shuffler'
import { cn } from '@/lib/utils'
import { formatDuration, useNow } from '../hooks'
import { useOsNav } from '../os/os-nav'
import { DeckPanel } from '../shared/deck-panel'
import { EnviarBandejaAcao } from '../salao/salao-enviar'
import { callName, useDevo } from '../state/devo-store'
import { usePlayerText } from '../state/player-text'
import { playerText } from '@/lib/devo/player-name'
import { DeadlyVoteHistory, tallyText } from '../system/deadly-vote-history'
import { InvitePanel } from '../system/invite-panel'
import { ManagerAlert, useManagerSignals } from '../system/manager-alert'
import { PhotoPicker } from '../system/photo-picker'
import { RecordFile, type RecordFileData } from '../system/record-file'
import { StaffDesk } from '../system/staff-desk'
import { LifecycleTrack, RecButton, RecLink, STATUS_TEXT, StatusChip, StatusMark } from '../system/record-ui'
import { useDeadlyVotes } from '../system/use-deadly-votes'
import { DiarioPanel } from '../poco/diario-panel'
import { Colecao } from '../cosmeticos/colecao'
import { FotoMoldurada } from '../cosmeticos/cosmetic-art'
import { IdentidadePanel, useMinhaMolduraAvatar } from '../cosmeticos/identidade-panel'

const CRITICAL_MS = 6 * 3600 * 1000
/**
 * Selo do cargo no cabeçalho. O Owner nunca é revelado (DIRECAO-3 §3): no lugar do cargo, um selo neutro
 * ("Sigilo") — autoridade e mistério sem a palavra, para não vazar numa captura compartilhada.
 */
const ROLE_LABEL = { player: 'Jogador', dealer: 'Dealer', anfitriao: 'Anfitrião', owner: 'Sigilo' } as const

export function useRecordData(avatarVersion: number | null = null): RecordFileData {
  const { state } = useDevo()
  const now = useNow(1000)
  const remaining = Math.max(0, state.timerEndsAt - now)
  const critical = remaining < CRITICAL_MS
  return {
    name: callName(state) ?? 'Não identificado',
    recordId: recordIdFor(state.playerName),
    status: remaining === 0 ? { label: playerText('Eliminad{o|a}', { gender: state.profile.gender }), tone: 'critical' } : critical ? { label: 'Crítico', tone: 'critical' } : { label: 'Ativo', tone: 'active' },
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

type Tab = 'record' | 'votes' | 'invites' | 'mesa' | 'diario'
const OPEN: DeadlyVoteStatus[] = ['convocado', 'em-progresso']
const ALL_STATUSES: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'cancelado', 'falha']

/**
 * Record — o arquivo do participante no interior do DEVO: folha de papel frio com réguas de HUD,
 * painéis de mármore negro com filete de aço e a ficha em porcelana (refs do Record + mármore).
 * Abas: Record File · Deadly Votes · Convites (Dealer/Admin).
 */
export function RecordApp() {
  const { state } = useDevo()
  const nav = useOsNav()
  const votes = useDeadlyVotes()
  const data = useRecordData(votes.record?.avatarVersion ?? null)
  const [tab, setTab] = useState<Tab>('record')
  const [selected, setSelected] = useState<string | null>(null)
  const [colecao, setColecao] = useState(false)
  const molduraAv = useMinhaMolduraAvatar()
  const fileData: RecordFileData = molduraAv
    ? { ...data, photoFrame: <FotoMoldurada formato="avatar" src={data.photoUrl ?? null} moldura={molduraAv} alt={`Foto de ${data.name}`} /> }
    : data

  const openVotes = useCallback(() => {
    setTab('votes')
    setSelected(null)
  }, [])
  const openGames = useCallback(() => nav.open('jogos'), [nav])
  const signals = useManagerSignals(votes.entries, { onOpenVotes: openVotes, onOpenGames: state.arcadeUnlocked ? openGames : undefined })
  const selectedVote = votes.entries.find((e) => e.id === selected)?.vote
  const role = votes.record?.role
  const isStaff = role === 'dealer' || role === 'anfitriao' || role === 'owner'

  const items: TabItem<Tab>[] = [
    { value: 'record', label: 'Record File' },
    { value: 'votes', label: 'Deadly Votes', count: votes.entries.filter((e) => e.status === 'convocado' && !e.vote.joined).length },
    { value: 'diario', label: 'Diário' },
    // Equipe: a Mesa (casos, recompensas, equipe, convites…). Jogador: os próprios convites (cota de 1).
    isStaff ? { value: 'mesa' as const, label: 'Mesa' } : { value: 'invites' as const, label: 'Convites' },
  ]

  return (
    <div className="relative h-full overflow-hidden bg-[color:var(--in-paper,#e7e6e3)] @container">
      <div className="devo-scroll absolute inset-0 overflow-y-auto">
        <PaperSheet code={false} className="min-h-full">
          <div className="relative mx-auto flex max-w-3xl flex-col gap-4 pb-12 pl-6 pr-4 pt-4 @2xl:px-8">
            <Masthead recordId={data.recordId} role={role && role !== 'player' ? ROLE_LABEL[role] : null} sealed={role === 'owner'} />

            <CobaltTabs
              label="Seções do registro"
              items={items}
              value={tab}
              onValueChange={(v) => {
                setTab(v)
                setSelected(null)
                setColecao(false)
              }}
              fill
              className="animate-dv-fade [&_[role=tab]]:min-w-0 [&_[role=tab]]:flex-auto [&_[role=tab]]:whitespace-nowrap [&_[role=tab]]:px-2 [&_[role=tab]]:text-[10.5px] [&_[role=tab]]:tracking-[0.06em] @md:[&_[role=tab]]:px-4 @md:[&_[role=tab]]:text-[11px] @md:[&_[role=tab]]:tracking-[0.14em]"
              panelClassName="pt-5"
            >
              {tab === 'diario' ? (
                <Reveal key="diario" variant="right">
                  <DiarioPanel />
                </Reveal>
              ) : tab === 'mesa' && role && role !== 'player' ? (
                <StaffDesk key="mesa" role={role} />
              ) : tab === 'invites' ? (
                <Stagger key="invites" className="flex flex-col gap-5">
                  <InvitePanel />
                </Stagger>
              ) : tab === 'record' && colecao ? (
                <Reveal key="colecao" variant="right">
                  <Colecao nome={data.name} fotoSrc={data.photoUrl ?? null} onVoltar={() => setColecao(false)} />
                </Reveal>
              ) : tab === 'record' ? (
                <Stagger key="record" className="flex flex-col gap-5" delay={60}>
                  <RecordFile data={fileData} photoAction={<PhotoPicker hasPhoto={!!data.photoUrl} onChanged={votes.refresh} />} />
                  <IdentidadePanel nome={data.name} fotoSrc={data.photoUrl ?? null} onAbrir={() => setColecao(true)} />
                  {signals.length > 0 && <ManagerAlert signals={signals} />}
                  <DeckPanel
                    inventory={state.inventory}
                    shufflerSynced={state.arcadeUnlocked}
                    onViewAll={() => nav.open('cartas')}
                    onAcquire={() => nav.open('trocas')}
                    onSelect={() => nav.open('cartas')}
                    shufflerAction={<EnviarBandejaAcao />}
                  />
                  <RecordPanel chamfer pad="md">
                    <DeadlyVoteHistory
                      entries={votes.entries}
                      limit={5}
                      loading={votes.isLoading}
                      error={votes.error}
                      onSelect={(e) => {
                        setTab('votes')
                        setSelected(e.id)
                      }}
                      onViewAll={openVotes}
                    />
                  </RecordPanel>
                  <ReservedSystems />
                </Stagger>
              ) : selectedVote ? (
                <Reveal key={`v-${selectedVote.id}`} variant="right">
                  <VoteDetail vote={selectedVote} onBack={() => setSelected(null)} onJoin={votes.join} onLeave={votes.leave} />
                </Reveal>
              ) : (
                <VotesBoard entries={votes.entries} loading={votes.isLoading} error={votes.error} onSelect={setSelected} onJoin={votes.join} onLeave={votes.leave} />
              )}
            </CobaltTabs>
          </div>
        </PaperSheet>
      </div>
    </div>
  )
}

/** Cabeçalho do arquivo: título-marca em serifada fina (ref. do Record), código de HUD e o papel do usuário. */
function Masthead({ recordId, role, sealed }: { recordId: string; role: string | null; sealed?: boolean }) {
  return (
    <header className="relative animate-dv-fade">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-2">
            Arquivo recuperado · <span className="whitespace-nowrap">{recordId}</span>
          </p>
          <p className="mt-2.5 font-serif text-[36px] font-light uppercase leading-[0.9] tracking-[0.01em] text-in-fg">Deadly Vote</p>
          <p className="mt-1.5 font-serif text-[14px] font-normal uppercase leading-none tracking-[0.58em] text-in-accent">Record System</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          {role && (
            <span
              className="dv-cut-diag inline-flex h-8 items-center gap-2 bg-[#1c1c1f] px-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-white"
              style={{ '--dv-cut': '7px' } as CSSProperties}
            >
              {sealed ? (
                <span aria-hidden="true" className="flex items-center gap-[3px]">
                  <span className="size-1 rotate-45 bg-[#bab09f]" />
                  <span className="size-1.5 rotate-45 bg-dv-amethyst" />
                  <span className="size-1 rotate-45 bg-[#bab09f]" />
                </span>
              ) : (
                <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />
              )}
              {role}
            </span>
          )}
          <HudCode code={hudCode(recordId)} sub="DV_RECORD_FILE" />
        </div>
      </div>
      <p className="mt-2.5 font-mono text-[10px] tracking-[0.12em] text-in-fg-3">Sistema de Registro | Arquivo do Record</p>
      <HudRule className="mt-2.5" code="DV_MS_0518" />
    </header>
  )
}

/** Sistemas reservados que o Record vai exibir (Direção 2 §3): só informação, sem botão ativo. */
function ReservedSystems() {
  const shown = FUTURE_SYSTEMS.filter((s) => s.id === 'arcanos' || s.id === 'virtudes')
  return (
    <section aria-label="Sistemas reservados" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <RecordTitle title="Reservado" jp="予約" size="sm" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Em breve</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shown.map((s) => (
          <LockedFeature key={s.id} name={s.name} jp={s.jp} hint={s.hint} icon={s.icon} />
        ))}
      </div>
    </section>
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
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-2">Tribunal · Convocações</p>
            <RecordTitle as="h2" title="Deadly Votes" jp="デッドリー・ボート" size="lg" className="mt-1.5" />
          </div>
          <EmblemVotes metal className="size-12 shrink-0 text-in-fg drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
        </header>
      </Reveal>
      <Stagger className="flex flex-col gap-5" delay={120}>
        {open.map((e) => (
          <ConvocationPoster key={e.id} vote={e.vote} onJoin={onJoin} onLeave={onLeave} onOpen={() => onSelect(e.id)} />
        ))}
        {!loading && !open.length && !error && (
          <RecordPanel chamfer>
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <GlyphGavel className="size-8 text-in-brass" />
              <p className="font-serif text-[20px] font-light uppercase tracking-[0.04em] text-in-fg">Nenhuma convocação aberta</p>
              <p className="mx-auto max-w-[34ch] font-body text-[15px] leading-relaxed text-in-fg-2">
                Deadly Votes são os desafios do RPG. Quando um Dealer lançar uma edição, ela aparecerá aqui para inscrição.
              </p>
            </div>
          </RecordPanel>
        )}
        <StatusLedger statuses={entries.map((e) => e.status)} />
        <RecordPanel chamfer pad="md">
          <DeadlyVoteHistory heading="Arquivo de casos" entries={archive} loading={loading} error={error} onSelect={(e) => onSelect(e.id)} />
        </RecordPanel>
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

/** Bloco do grupo do WhatsApp: só para inscritos, só com o caso em andamento. */
function GroupAccess({ vote, surface }: { vote: DeadlyVote; surface: 'dark' | 'paper' }) {
  const say = usePlayerText()
  if (vote.status !== 'em-progresso') return null
  if (!vote.joined) {
    return (
      <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-3">
        <Lock className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden="true" />
        Inscrições encerradas · grupo só para inscritos
      </p>
    )
  }
  if (vote.entryStatus === 'pendente') {
    return (
      <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-2">
        <Lock className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden="true" />
        Inscrição em análise · o grupo abre quando o Dealer aceitar
      </p>
    )
  }
  if (!vote.groupUrl) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--in-line-strong)]">
        <span aria-hidden="true" className="relative grid size-4 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-in-fg/20" />
          <span className="size-2 rounded-full bg-in-fg" />
        </span>
        <p className="font-body text-[15px] leading-snug text-in-fg-2">{say('Você está inscrit{o|a}. O Dealer vai liberar o link do grupo aqui.')}</p>
      </div>
    )
  }
  return (
    <div className="relative flex flex-col gap-2.5">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-2">
        <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />
        Grupo do WhatsApp · liberado pelo Dealer
      </p>
      <RecLink surface={surface} size="lg" block href={vote.groupUrl} target="_blank" rel="noopener noreferrer" icon={<Link2 strokeWidth={1.4} />} iconRight={<GlyphArrow />}>
        Entrar no grupo
      </RecLink>
      <p className="font-sans text-[12px] text-in-fg-3">O link é pessoal da edição: não compartilhe fora do grupo de inscritos.</p>
    </div>
  )
}

/**
 * Cartaz do caso aberto (o herói da aba): mármore negro com cantos de aço. "Convocação" com contagem
 * até o início, ou "Em andamento" com o tempo decorrido; ciclo do caso, vagas, briefing e ações.
 */
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
  const now = useNow(1000)
  const { busy, error, run } = useVoteAction(vote.id)
  const live = vote.status === 'em-progresso'
  const full = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const refused = vote.entryStatus === 'recusada'
  const canJoin = vote.status === 'convocado' && !vote.joined && !full && !refused
  const canLeave = vote.status === 'convocado' && vote.joined
  const slots = vote.maxParticipants ? Math.min(vote.maxParticipants, 24) : 0
  const filled = vote.maxParticipants ? Math.round((Math.min(vote.participants, vote.maxParticipants) / vote.maxParticipants) * slots) : 0

  return (
    <article
      aria-label={`Convocação: ${voteTitle(vote)}`}
      className={cn('dv-interior-dark dv-record-panel dv-cut relative', live && 'shadow-[0_0_0_1px_rgba(241,240,238,0.5),0_18px_40px_-18px_rgba(138,124,200,0.55)]')}
      style={{ '--dv-cut': '16px' } as CSSProperties}
    >
      <BrassCorners size={30} inset={4} />
      <span aria-hidden="true" className="bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative p-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-2">
            Deadly Vote № {String(vote.number).padStart(3, '0')}
            {vote.host && <span className="text-in-fg-3"> · Dealer {vote.host}</span>}
          </p>
          <StatusChip status={vote.status} />
        </div>

        <div className="relative mt-4 flex items-start justify-between gap-2">
          <h2 className="relative">
            <span aria-hidden="true" className="absolute -left-5 bottom-[0.18em] h-[0.2em] w-[calc(100%+2.6rem)] -skew-x-[18deg] bg-[linear-gradient(90deg,rgba(186,176,159,0.55),rgba(186,176,159,0.12)_70%,transparent)]" />
            <span className="relative font-impact text-[46px] font-bold uppercase leading-[0.9] tracking-[0.01em] text-[#f1f0ee] drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
              {live ? 'Em sessão' : 'Convocação'}
            </span>
          </h2>
          {vote.entryStatus === 'aceita' && <Stamp text="Inscrito" shape="round" tone="gold" rotate={12} size={70} className="-mr-1 -mt-3 shrink-0" />}
        </div>

        {vote.arc && <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-dv-gold">{arcLabel(vote.arc)}</p>}
        <h3 className={cn('font-serif text-[28px] font-light uppercase leading-[1.02] tracking-[0.02em] text-in-fg text-balance', vote.arc ? 'mt-1' : 'mt-4')}>{vote.title}</h3>

        <LifecycleTrack status={vote.status} className="mt-5" />

        <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-in-line pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">{live ? 'Em andamento há' : 'Início em'}</p>
            {live ? (
              <TimeDigits value={formatDuration(now - vote.startsAt)} size="md" tone="text" units={['Horas', 'Min', 'Seg']} flip={false} label="Em andamento há" className="mt-1.5" />
            ) : (
              <Countdown endsAt={vote.startsAt} size="md" tone="text" units sound={false} label="Início em" className="mt-1.5" />
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">{live ? 'Inscritos' : 'Vagas'}</p>
            <p className="mt-1.5 font-impact text-[28px] font-semibold leading-none text-in-fg dv-tabular">
              {vote.participants}
              <span className="text-[18px] text-in-fg-3">{vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}</span>
            </p>
          </div>
        </div>
        {slots > 0 && (
          <div aria-hidden="true" className="mt-3 flex gap-[3px]">
            {Array.from({ length: slots }, (_, i) => (
              <span key={i} className={cn('h-2 flex-1 -skew-x-[20deg]', i < filled ? 'bg-[linear-gradient(180deg,#f1f0ee,#bab09f)]' : 'bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(241,240,238,0.08)]')} />
            ))}
          </div>
        )}

        {vote.briefing && <blockquote className="mt-4 border-l-2 border-[#bab09f]/70 pl-3 font-body text-[16px] italic leading-relaxed text-in-fg-2">{vote.briefing}</blockquote>}

        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-3">
          {new Date(vote.startsAt).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
        {vote.location && (
          <p className="mt-1.5 flex items-center gap-1.5 font-sans text-[14px] text-in-fg-2">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden="true" />
            {vote.location}
          </p>
        )}
      </div>

      <div className="relative flex flex-col gap-2.5 border-t border-in-line px-5 pb-5 pt-4">
        {canJoin && (
          <RecButton block size="lg" loading={busy} sfx="confirm" onClick={() => run(onJoin)}>
            {vote.admission === 'aprovacao' ? 'Pedir inscrição' : 'Inscrever-se'}
          </RecButton>
        )}
        {vote.status === 'convocado' && vote.entryStatus === 'pendente' && (
          <p className="flex items-center gap-2.5 font-body text-[15px] leading-snug text-in-fg-2">
            <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-dv-amethyst/30" />
              <span className="size-2 rotate-45 bg-dv-amethyst" />
            </span>
            Inscrição enviada. O Dealer vai confirmar sua vaga.
          </p>
        )}
        {refused && <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-3">Inscrição recusada pelo Dealer</p>}
        {canLeave && (
          <RecButton block variant="secondary" loading={busy} sfx="click" onClick={() => run(onLeave)}>
            {vote.entryStatus === 'pendente' ? 'Retirar pedido' : 'Cancelar inscrição'}
          </RecButton>
        )}
        {vote.status === 'convocado' && full && !vote.joined && !refused && (
          <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-2">
            <Lock className="size-3.5" strokeWidth={1.4} aria-hidden="true" /> Vagas esgotadas
          </p>
        )}
        <GroupAccess vote={vote} surface="dark" />
        <RecButton variant="ghost" size="sm" onClick={onOpen} iconRight={<GlyphArrow />} className="self-center">
          Ver dossiê do caso
        </RecButton>
        {error && (
          <p role="alert" className="font-mono text-[12px] text-in-alert">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}

/** Dossiê do caso: documento de porcelana sobre o papel, com faixa negra, ciclo e carimbo do resultado. */
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
  const full = vote.maxParticipants !== null && vote.participants >= vote.maxParticipants
  const canJoin = vote.status === 'convocado' && !vote.joined && !full && vote.entryStatus !== 'recusada'
  const canLeave = vote.status === 'convocado' && vote.joined
  const tally = tallyText(vote.survivors, vote.eliminated)

  return (
    <article className="flex flex-col gap-4">
      <RecButton surface="paper" variant="ghost" size="sm" onClick={onBack} sfx="close" icon={<GlyphArrow className="rotate-180" />} className="self-start">
        Todos os Deadly Votes
      </RecButton>
      <div className="relative mb-2 drop-shadow-[0_16px_22px_rgba(13,13,15,0.28)]">
        <div className="dv-cut relative bg-[color:var(--in-porcelain)] bg-[radial-gradient(110%_60%_at_20%_0%,#ffffff,transparent_65%)] text-[#0d0d0f] shadow-[inset_0_0_0_1px_rgba(13,13,15,0.14)]" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <BrassCorners size={26} inset={4} />
          <header className="px-5 pb-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#58585e]">Deadly Vote № {String(vote.number).padStart(3, '0')} · Dossiê do caso</p>
              <HudCode code={hudCode(vote.id, 'DV')} />
            </div>
            <h2 className="mt-3 font-serif text-[32px] font-light uppercase leading-[1] tracking-[0.02em] text-balance">{vote.title}</h2>
            {vote.arc && <p className="mt-1.5 font-body text-[16px] italic text-[#0d0d0f]/75">{arcLabel(vote.arc)}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip status={vote.status} />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#58585e]">{DEADLY_VOTE_STATUS[vote.status].hint}</span>
            </div>
          </header>
          <div aria-hidden="true" className="relative mx-5 h-1.5 overflow-hidden">
            <span className="absolute inset-y-0 -left-2 right-10 -skew-x-[18deg] bg-[#1c1c1f]" />
          </div>

          <LifecycleTrack status={vote.status} className="mx-5 mt-5" />

          <dl className="mx-5 mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#0d0d0f]/15 pt-4">
            <PaperField label="Início" value={new Date(vote.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
            <PaperField label="Participantes" value={`${vote.participants}${vote.maxParticipants ? ` / ${vote.maxParticipants}` : ''}`} />
            <PaperField
              label="Seu registro"
              value={
                vote.outcome
                  ? OUTCOME_LABEL[vote.outcome]
                  : vote.entryStatus === 'pendente'
                    ? 'Em análise'
                    : vote.entryStatus === 'recusada'
                      ? 'Recusada'
                      : vote.joined
                        ? 'Inscrito'
                        : 'Não inscrito'
              }
              danger={vote.outcome === 'eliminado'}
            />
            {vote.location && <PaperField label="Local" value={vote.location} className="col-span-2" />}
            {vote.host && <PaperField label="Dealer" value={vote.host} />}
            {tally && <PaperField label="Resultado público" value={tally} className="col-span-2" />}
          </dl>

          {vote.briefing && (
            <div className="mx-5 mt-4 border-t border-dashed border-[#0d0d0f]/30 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#58585e]">Briefing do Dealer</p>
              <p className="mt-2 whitespace-pre-line font-body text-[16px] leading-relaxed text-[#0d0d0f]/90 text-pretty">{vote.briefing}</p>
            </div>
          )}

          {vote.outcome && (
            <div className="mx-5 mt-4 flex justify-end">
              {vote.outcome === 'eliminado' ? (
                <Stamp text="Eliminado" tone="blood" rotate={-10} size={130} animate />
              ) : (
                <Stamp text="Sobreviveu" shape="round" tone="ink" rotate={-8} size={104} animate />
              )}
            </div>
          )}

          <div className="mx-5 mt-4 flex flex-col gap-2.5 border-t border-[#0d0d0f]/20 pb-6 pt-4">
            {canJoin && (
              <RecButton surface="paper" block loading={busy} sfx="confirm" onClick={() => run(onJoin)}>
                {vote.admission === 'aprovacao' ? 'Pedir inscrição' : 'Inscrever-se'}
              </RecButton>
            )}
            {canLeave && (
              <RecButton surface="paper" block variant="secondary" loading={busy} sfx="click" onClick={() => run(onLeave)}>
                {vote.entryStatus === 'pendente' ? 'Retirar pedido' : 'Cancelar inscrição'}
              </RecButton>
            )}
            {vote.status === 'convocado' && full && !vote.joined && <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#58585e]">Vagas esgotadas</p>}
            <GroupAccess vote={vote} surface="paper" />
            {vote.status !== 'convocado' && vote.status !== 'em-progresso' && (
              <p className={cn('font-mono text-[10.5px] uppercase tracking-[0.14em]', vote.status === 'falha' ? 'text-[#a3121f]' : 'text-[#58585e]')}>
                {vote.status === 'cancelado' ? 'Edição cancelada pelo Dealer' : vote.status === 'falha' ? 'Caso interrompido por falha do sistema' : 'Caso encerrado · resultado registrado'}
              </p>
            )}
            {error && (
              <p role="alert" className="font-mono text-[12px] text-[#a3121f]">
                {error}
              </p>
            )}
          </div>
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-x-[14px] -bottom-[7px] h-2"
          style={{ background: 'radial-gradient(circle at 7px 0, var(--in-porcelain) 5.5px, transparent 6px) 0 0 / 14px 8px repeat-x' }}
        />
      </div>
    </article>
  )
}

/** Livro de estados: os cinco tratamentos lado a lado, com a contagem de casos em cada um. */
function StatusLedger({ statuses }: { statuses: DeadlyVoteStatus[] }) {
  const n = (k: DeadlyVoteStatus) => statuses.filter((s) => s === k).length
  return (
    <section aria-label="Estados dos casos" className="flex flex-col gap-2">
    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-2">
      <span aria-hidden="true" className="h-px w-5 bg-in-fg-3" />
      Estados dos casos
    </p>
    <RecordPanel variant="paper" pad="sm" className="dv-cut-diag" style={{ '--dv-cut': '10px' } as CSSProperties}>
      <dl className="grid grid-cols-5 divide-x divide-in-line">
        {ALL_STATUSES.map((st) => (
          <div key={st} className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 py-1 text-center">
            <dt className={cn('order-3 max-w-full font-mono text-[10px] uppercase leading-tight tracking-[0.04em]', STATUS_TEXT[st], 'font-normal no-underline')}>{DEADLY_VOTE_STATUS[st].short}</dt>
            <StatusMark status={st} size={12} className="order-1" />
            <dd className={cn('order-2 font-impact text-[24px] font-semibold leading-none dv-tabular', n(st) ? 'text-in-fg' : 'text-in-fg-3', st === 'falha' && n(st) > 0 && 'text-in-alert')}>{n(st)}</dd>
          </div>
        ))}
      </dl>
    </RecordPanel>
    </section>
  )
}
