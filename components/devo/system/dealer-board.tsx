'use client'

import { Link2, Lock, MapPin, Pencil, Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { GlyphCheck, GlyphGavel, HudCode, RecordPanel, Reveal, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import type { Cargo } from '@/lib/devo/cargos'
import {
  arcLabel,
  DEADLY_VOTE_STATUS,
  type DeadlyVoteStatus,
  DECISION_LABEL,
  DECISIONS,
  ENTRY_ADMISSION_LABEL,
  type EntryDecision,
  normalizeGroupUrl,
  type PrizeInput,
  STATUS_BREAK,
  STATUS_FLOW,
  type StaffBoard,
  type StaffEntry,
  type StaffVote,
  type VoteAdmission,
  voteTitle,
} from '@/lib/devo/deadly-votes'
import { cartaExiste, getCard, getCardPeso } from '@/lib/devo/cards'
import { cn } from '@/lib/utils'
import { tallyText } from './deadly-vote-history'
import { CaseTab, RecButton, RecInput, RecLabel, RecTag, RecTextarea, StatusChip, StatusMark } from './record-ui'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, PrizeEditor, resourceText, useStaffItems } from './staff-ui'
import { RECORD_KEY, recordAction } from './use-deadly-votes'

export const BOARD_KEY = `${RECORD_KEY}?view=staff`

export async function boardFetcher(url: string): Promise<StaffBoard> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha ao carregar a mesa do Dealer.')
  return data as StaffBoard
}

/** Mesa do Dealer compartilhada entre a Mesa e o resumo do topo (mesma chave do SWR). */
export function useStaffBoard() {
  return useSWR(BOARD_KEY, boardFetcher)
}

const pad2 = (n: number) => String(n).padStart(2, '0')
function splitDate(ts: number) {
  const d = new Date(ts)
  return { date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`, time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }
}
function defaultStart() {
  const d = new Date(Date.now() + 24 * 3600_000)
  d.setMinutes(0, 0, 0)
  return d.getTime()
}

/** Pendências de um caso para a equipe: inscrições em análise e resultado por aplicar. */
export function voteTodo(v: StaffVote) {
  const analise = v.entries.filter((e) => e.admission === 'pendente').length
  const aceitos = v.entries.filter((e) => e.admission === 'aceita')
  const decidir = v.status === 'concluido' && v.appliedAt === null && aceitos.length > 0
  return { analise, decidir, semDecisao: decidir ? aceitos.filter((e) => !e.decision).length : 0 }
}

/**
 * Mesa do Dealer (Dealer, Anfitrião, Owner), na folha de porcelana: convocar com os campos do dono (local,
 * descrição, data, horário, link do grupo, recompensas privadas), aceitar inscrições, conduzir o estado do
 * caso e, depois de concluir, decidir o resultado de cada participante antes de aplicar aos perfis.
 */
export function DealerBoard({ role }: { role?: Cargo }) {
  const { data, error, isLoading, mutate } = useStaffBoard()
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const canTutorial = role === 'owner' || role === 'anfitriao'

  const act = async (body: Record<string, unknown>) => {
    setActionError(null)
    try {
      const res = await recordAction(body)
      await Promise.all([mutate(), globalMutate(RECORD_KEY), globalMutate((k) => typeof k === 'string' && k.startsWith('/api/staff?view=recompensas'))])
      return res as Record<string, unknown>
    } catch (e) {
      playSfx('error')
      setActionError((e as Error).message)
      return null
    }
  }

  const votes = data?.votes ?? []

  return (
    <RecordPanel variant="paper" title="Mesa do Dealer" jp="ディーラー" ornate headerRight={<HudCode code="DV_DEALER" />}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        Convoque a edição, aceite os inscritos e conduza o caso. Depois de encerrado, decida o destino de cada participante antes de aplicar aos perfis.
      </p>
      <RecButton
        surface="paper"
        size="sm"
        variant={creating ? 'ghost' : 'secondary'}
        aria-expanded={creating}
        onClick={() => setCreating((v) => !v)}
        sfx="click"
        icon={creating ? undefined : <Plus strokeWidth={1.4} />}
        className="mt-4"
      >
        {creating ? 'Fechar' : 'Convocar'}
      </RecButton>

      {creating && (
        <Reveal variant="rise">
          <ConvokeForm
            canTutorial={canTutorial}
            onSubmit={async (body) => {
              const ok = await act({ action: 'create', ...body })
              if (ok) {
                playSfx('confirm')
                setCreating(false)
              }
              return !!ok
            }}
          />
        </Reveal>
      )}

      {actionError && (
        <div className="mt-3">
          <ErrorLine>{actionError}</ErrorLine>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorLine>{(error as Error).message}</ErrorLine>
        ) : !votes.length ? (
          <EmptyLine title="Nenhum caso na mesa">Convoque a primeira edição. Ela aparece no Record dos jogadores na hora.</EmptyLine>
        ) : (
          votes.map((v) => <StaffVoteCard key={v.id} vote={v} role={role} onAction={act} />)
        )}
      </div>
    </RecordPanel>
  )
}

type VoteForm = {
  title: string
  location: string
  arc: string
  briefing: string
  date: string
  time: string
  max: string
  peso: string
  group: string
  admission: VoteAdmission
  prizes: PrizeInput[]
  tutorial: boolean
}

function formFrom(v?: StaffVote): VoteForm {
  const start = splitDate(v?.startsAt ?? defaultStart())
  return {
    title: v?.title ?? '',
    location: v?.location ?? '',
    arc: v?.arc ?? '',
    briefing: v?.briefing ?? '',
    date: start.date,
    time: start.time,
    max: v?.maxParticipants ? String(v.maxParticipants) : '',
    peso: v?.pesoMaximo ? String(v.pesoMaximo) : '',
    group: v?.groupUrl ?? '',
    admission: v?.admission ?? 'aprovacao',
    prizes: (v?.prizes ?? []).map((p) => ({ recurso: p.recurso, chave: p.chave, quantidade: p.quantidade, label: p.label })),
    tutorial: v?.isTutorial ?? false,
  }
}

/**
 * Ficha de convocação: os campos do dono (local, descrição, data, horário, link, recompensas) mais título,
 * arco, vagas e o modo de inscrição. As recompensas são privadas: nunca aparecem para os jogadores.
 */
function ConvokeForm({
  vote,
  canTutorial,
  onSubmit,
  onCancel,
}: {
  vote?: StaffVote
  canTutorial?: boolean
  onSubmit: (body: Record<string, unknown>) => Promise<boolean>
  onCancel?: () => void
}) {
  const editing = !!vote
  const [f, setF] = useState<VoteForm>(() => formFrom(vote))
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<VoteForm>) => setF((x) => ({ ...x, ...patch }))
  const startsAt = new Date(`${f.date}T${f.time || '00:00'}`).getTime()
  const groupOk = !f.group.trim() || normalizeGroupUrl(f.group) !== null
  const valid = f.title.trim().length >= 2 && Number.isFinite(startsAt) && groupOk

  return (
    <form
      aria-label={vote ? `Editar ficha de ${voteTitle(vote)}` : 'Convocar Deadly Vote'}
      className="relative mt-4 flex flex-col gap-4 bg-in-fg/[0.03] p-4 pl-5 shadow-[inset_0_0_0_1px_var(--in-line-strong)]"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy) return
        setBusy(true)
        await onSubmit({
          title: f.title.trim(),
          location: f.location.trim() || null,
          arc: f.arc.trim() || null,
          briefing: f.briefing.trim() || null,
          startsAt,
          maxParticipants: f.max ? Number(f.max) : null,
          pesoMaximo: f.peso ? Number(f.peso) : null,
          admission: f.admission,
          prizes: f.prizes,
          ...(editing ? {} : { groupUrl: f.group.trim() || null, tutorial: canTutorial && f.tutorial }),
        })
        setBusy(false)
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">{vote ? `Caso № ${String(vote.number).padStart(3, '0')} · Ficha` : 'Nova edição · Ficha de convocação'}</p>
      <Field label="Título">
        <RecInput value={f.title} onChange={(e) => set({ title: e.target.value })} maxLength={60} required placeholder="Leilão de Sombras" />
      </Field>
      <Field label="Local" hint="onde acontece">
        <RecInput value={f.location} onChange={(e) => set({ location: e.target.value })} maxLength={80} placeholder="Salão principal · grupo do WhatsApp" />
      </Field>
      <div className="grid grid-cols-[1.25fr_1fr] gap-4">
        <Field label="Data">
          <RecInput type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} required className="[color-scheme:light]" />
        </Field>
        <Field label="Horário">
          <RecInput type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} required className="[color-scheme:light]" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Arco" hint="opcional">
          <RecInput value={f.arc} onChange={(e) => set({ arc: e.target.value })} maxLength={60} placeholder="Arco I" />
        </Field>
        <Field label="Vagas" hint="opcional">
          <RecInput value={f.max} onChange={(e) => set({ max: e.target.value.replace(/\D/g, '').slice(0, 3) })} inputMode="numeric" placeholder="Livre" className="dv-tabular" />
        </Field>
      </div>
      <Field label="Peso máximo de cartas" hint="soma dos pesos que cada Record leva · opcional">
        <RecInput value={f.peso} onChange={(e) => set({ peso: e.target.value.replace(/\D/g, '').slice(0, 2) })} inputMode="numeric" placeholder="Sem limite" className="dv-tabular" />
      </Field>
      <div className="flex flex-col gap-1.5">
        <RecLabel>Inscrições</RecLabel>
        <div role="radiogroup" aria-label="Modo de inscrição" className="grid grid-cols-2 gap-1.5">
          {(
            [
              ['aprovacao', 'Aprovar cada um', 'Você aceita os inscritos'],
              ['livre', 'Livre', 'Entra direto até lotar'],
            ] as const
          ).map(([value, label, hint]) => {
            const on = f.admission === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ admission: value })}
                className={cn(
                  'dv-focus dv-cut-diag flex min-h-14 flex-col items-start justify-center gap-0.5 px-3 text-left transition-colors',
                  on ? 'bg-dv-block text-white' : 'text-in-fg shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:bg-in-fg/[0.04]',
                )}
                style={{ '--dv-cut': '7px' } as CSSProperties}
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em]">
                  {on && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
                  {label}
                </span>
                <span className={cn('font-sans text-[12px]', on ? 'text-white/70' : 'text-in-fg-3')}>{hint}</span>
              </button>
            )
          })}
        </div>
      </div>
      {!editing && (
        <Field label="Link do grupo (WhatsApp)" hint="pode vir depois">
          <RecInput
            value={f.group}
            onChange={(e) => set({ group: e.target.value })}
            inputMode="url"
            placeholder="https://chat.whatsapp.com/…"
            aria-invalid={!groupOk || undefined}
            maxLength={200}
          />
        </Field>
      )}
      <Field label="Descrição" hint="opcional">
        <RecTextarea value={f.briefing} onChange={(e) => set({ briefing: e.target.value })} maxLength={600} rows={3} placeholder="O que os participantes precisam saber." />
      </Field>
      <div className="flex flex-col gap-2 border-t border-dashed border-in-line-strong pt-3">
        <RecLabel hint={<span className="inline-flex items-center gap-1"><Lock className="size-3" strokeWidth={1.6} aria-hidden="true" />privadas: só a equipe vê</span>}>Recompensa geral</RecLabel>
        <p className="font-sans text-[13px] leading-relaxed text-in-fg-2">Vai para todos os participantes que não morrerem. As recompensas individuais de cada um são definidas no resultado do caso.</p>
        <PrizeEditor value={f.prizes} onChange={(prizes) => set({ prizes })} />
      </div>
      {canTutorial && !editing && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={f.tutorial}
            onChange={(e) => set({ tutorial: e.target.checked })}
            className="dv-focus peer size-5 shrink-0 cursor-pointer appearance-none border border-in-line-strong bg-transparent transition-colors checked:border-dv-block checked:bg-dv-block"
          />
          <GlyphCheck aria-hidden="true" className="pointer-events-none -ml-8 size-5 p-0.5 text-white opacity-0 peer-checked:opacity-100" />
          <span className="flex flex-col">
            <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-in-fg">Deadly Vote tutorial</span>
            <span className="font-sans text-[12px] text-in-fg-3">Quem receber prêmio desbloqueia Salão, Poço, Torres e Diário</span>
          </span>
        </label>
      )}
      {!groupOk && <p className="font-sans text-[13px] text-in-alert">Use o convite do grupo: https://chat.whatsapp.com/…</p>}
      <div className="flex gap-2">
        <RecButton surface="paper" type="submit" block loading={busy} disabled={!valid} icon={<GlyphGavel />}>
          {editing ? 'Salvar ficha' : 'Convocar'}
        </RecButton>
        {onCancel && (
          <RecButton surface="paper" variant="ghost" onClick={onCancel} sfx="close">
            Cancelar
          </RecButton>
        )}
      </div>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <RecLabel hint={hint}>{label}</RecLabel>
      {children}
    </label>
  )
}

type Act = (body: Record<string, unknown>) => Promise<Record<string, unknown> | null>

function StaffVoteCard({ vote: v, role, onAction }: { vote: StaffVote; role?: Cargo; onAction: Act }) {
  const todo = voteTodo(v)
  const [open, setOpen] = useState(v.status === 'em-progresso' || todo.analise > 0 || todo.decidir)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const live = v.status === 'em-progresso'
  const tally = tallyText(v.survivors, v.eliminated)

  const run = async (key: string, body: Record<string, unknown>) => {
    setPending(key)
    const res = await onAction(body)
    setPending(null)
    return res
  }

  return (
    <article
      aria-label={`Caso ${String(v.number).padStart(3, '0')}: ${voteTitle(v)}`}
      className={cn(
        'relative bg-[color:var(--in-porcelain)] shadow-[inset_0_0_0_1px_var(--in-line-strong),0_6px_14px_-10px_rgba(13,13,15,0.5)]',
        live && 'shadow-[inset_0_0_0_1px_var(--in-fg),0_0_0_3px_color-mix(in_oklab,var(--dv-amethyst)_18%,transparent)]',
        todo.decidir && 'shadow-[inset_0_0_0_1px_var(--in-fg),0_0_0_3px_color-mix(in_oklab,var(--in-gold,#bab09f)_35%,transparent)]',
      )}
    >
      <div className="flex items-start gap-3 p-3.5">
        <CaseTab number={v.number} muted={v.status === 'cancelado'} />
        <div className="min-w-0 flex-1">
          <p className={cn('font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg text-balance', v.status === 'cancelado' && 'text-in-fg-2')}>{voteTitle(v)}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] tracking-[0.04em] text-in-fg-3">
            {v.arc ? `${arcLabel(v.arc)} · ` : ''}
            {new Date(v.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          {v.location && (
            <p className="mt-1 flex items-center gap-1.5 font-sans text-[13px] text-in-fg-2">
              <MapPin className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden="true" />
              <span className="truncate">{v.location}</span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip status={v.status} />
            <RecTag>
              {v.entries.filter((e) => e.admission === 'aceita').length}
              {v.maxParticipants ? `/${v.maxParticipants}` : ''} aceitos
            </RecTag>
            {todo.analise > 0 && (
              <RecTag tone="accent" dot>
                {todo.analise} em análise
              </RecTag>
            )}
            {todo.decidir && (
              <RecTag tone="accent" dot>
                Decidir resultado
              </RecTag>
            )}
            {v.isTutorial && <RecTag tone="solid">Tutorial</RecTag>}
            {v.creator && role !== 'dealer' && <RecTag tone="muted">por {v.creator}</RecTag>}
          </div>
          {tally && <p className="mt-1.5 font-body text-[14px] text-in-fg-2">{tally}</p>}
        </div>
      </div>

      {editing ? (
        <div className="border-t border-in-line px-3.5 pb-3.5">
          <ConvokeForm
            vote={v}
            onCancel={() => setEditing(false)}
            onSubmit={async (body) => {
              const ok = await run('edit', { action: 'edit', voteId: v.id, ...body })
              if (ok) setEditing(false)
              return !!ok
            }}
          />
        </div>
      ) : (
        <PrivatePrizes vote={v} onEdit={v.appliedAt === null && v.status !== 'cancelado' && v.status !== 'falha' ? () => setEditing(true) : undefined} />
      )}

      <StatusControl vote={v} pending={pending} onPick={(st) => run(`s-${st}`, { action: 'status', voteId: v.id, status: st })} />

      <GroupLinkField vote={v} pending={pending === 'g'} onSave={(url) => run('g', { action: 'group', voteId: v.id, groupUrl: url })} />

      <div className="border-t border-in-line">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="dv-focus flex min-h-11 w-full items-center justify-between gap-2 px-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg hover:bg-in-fg/[0.04]"
        >
          <span>
            {v.status === 'concluido' ? 'Registrar resultados' : 'Inscrições'} · {v.entries.length}
          </span>
          <span aria-hidden="true" className={cn('text-[10px] transition-transform duration-300', open && 'rotate-180')}>
            ▼
          </span>
        </button>
        {open && (
          <div className="animate-dv-rise px-3.5 pb-3.5">
            {v.status === 'concluido' ? (
              <ResultsPanel vote={v} role={role} pending={pending} run={run} />
            ) : (
              <AdmissionList vote={v} pending={pending} run={run} />
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** Recompensas planejadas do caso: privadas (cadeado), com atalho para editar a ficha. */
function PrivatePrizes({ vote: v, onEdit }: { vote: StaffVote; onEdit?: () => void }) {
  const { names } = useStaffItems()
  return (
    <div className="border-t border-in-line px-3.5 pb-3 pt-3">
      <div className="flex items-center justify-between gap-2">
        <RecLabel className="flex-1" hint={<span className="inline-flex items-center gap-1"><Lock className="size-3" strokeWidth={1.6} aria-hidden="true" />privadas</span>}>
          Recompensas do caso
        </RecLabel>
      </div>
      {v.prizes.length ? (
        <ul className="mt-1.5 flex flex-col">
          {v.prizes.map((p) => (
            <li key={p.id} className="flex min-h-9 items-center gap-2 font-sans text-[14px] text-in-fg">
              <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-in-gold" />
              <span className="min-w-0 flex-1 truncate">{resourceText(p, names)}</span>
              {p.label && <span className="shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">{p.label}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 font-sans text-[13px] text-in-fg-3">Nenhuma recompensa definida. O resultado só atualiza os registros.</p>
      )}
      {onEdit && (
        <RecButton surface="paper" variant="ghost" size="sm" icon={<Pencil strokeWidth={1.4} />} onClick={onEdit} className="-ml-2 mt-1">
          Editar ficha
        </RecButton>
      )}
    </div>
  )
}

/** Antes de concluir: inscrições com aceitar/recusar. */
function AdmissionList({ vote: v, pending, run }: { vote: StaffVote; pending: string | null; run: (k: string, b: Record<string, unknown>) => Promise<unknown> }) {
  const sealed = v.status === 'cancelado' || v.status === 'falha'
  return (
    <div className="flex flex-col">
      <p className="pb-2 font-sans text-[13px] leading-relaxed text-in-fg-2">
        {sealed
          ? 'Caso interrompido: as inscrições ficam como estavam.'
          : v.admission === 'aprovacao'
            ? 'Aceite quem participa. O grupo do WhatsApp só aparece para os aceitos. O resultado por participante abre quando o caso for concluído.'
            : 'Inscrição livre: todos entram aceitos (você ainda pode recusar). O resultado por participante abre quando o caso for concluído.'}
      </p>
      <ul className="flex flex-col">
        {!v.entries.length && <li className="py-2 font-body text-[14px] text-in-fg-3">Ninguém se inscreveu neste caso.</li>}
        {v.entries.map((e) => (
          <li key={e.playerId} className="flex min-h-12 items-center gap-1.5 border-t border-in-line py-1.5 first:border-t-0">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-sans text-[14px] text-in-fg">{e.name}</span>
              <span className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', e.admission === 'pendente' ? 'text-in-accent' : e.admission === 'recusada' ? 'text-in-fg-3 line-through' : 'text-in-fg-2')}>
                {ENTRY_ADMISSION_LABEL[e.admission]}
              </span>
              {v.pesoMaximo != null && (
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">
                  Cartas: {e.cartas.length ? e.cartas.map((c) => (cartaExiste(c.cardId) ? getCard(c.cardId).name : c.cardId)).join(', ') : 'nenhuma'} · peso{' '}
                  {e.cartas.reduce((s, c) => s + (cartaExiste(c.cardId) ? getCardPeso(c.cardId) : 0), 0)}/{v.pesoMaximo}
                </span>
              )}
            </span>
            {!sealed &&
              (e.admission === 'pendente' ? (
                <>
                  <MiniButton label={`Aceitar ${e.name}`} busy={pending === `a-${e.playerId}-aceita`} disabled={pending !== null} solid onClick={() => run(`a-${e.playerId}-aceita`, { action: 'admission', voteId: v.id, playerId: e.playerId, admission: 'aceita' })}>
                    Aceitar
                  </MiniButton>
                  <MiniButton label={`Recusar ${e.name}`} busy={pending === `a-${e.playerId}-recusada`} disabled={pending !== null} onClick={() => run(`a-${e.playerId}-recusada`, { action: 'admission', voteId: v.id, playerId: e.playerId, admission: 'recusada' })}>
                    Recusar
                  </MiniButton>
                </>
              ) : e.admission === 'aceita' ? (
                <MiniButton label={`Recusar ${e.name}`} busy={pending === `a-${e.playerId}-recusada`} disabled={pending !== null} onClick={() => run(`a-${e.playerId}-recusada`, { action: 'admission', voteId: v.id, playerId: e.playerId, admission: 'recusada' })}>
                  Recusar
                </MiniButton>
              ) : (
                <MiniButton label={`Reconsiderar ${e.name}`} busy={pending === `a-${e.playerId}-pendente`} disabled={pending !== null} onClick={() => run(`a-${e.playerId}-pendente`, { action: 'admission', voteId: v.id, playerId: e.playerId, admission: 'pendente' })}>
                  Reconsiderar
                </MiniButton>
              ))}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MiniButton({ children, label, onClick, busy, disabled, solid, on, tone }: { children: ReactNode; label?: string; onClick: () => void; busy?: boolean; disabled?: boolean; solid?: boolean; on?: boolean; tone?: 'alert' | 'gold' }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'dv-focus dv-cut-diag inline-flex min-h-11 items-center justify-center gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:opacity-60',
        on
          ? tone === 'alert'
            ? 'bg-in-alert text-white'
            : 'bg-dv-block text-white shadow-[inset_0_0_0_1px_rgba(186,176,159,0.5)]'
          : solid
            ? 'bg-dv-block text-white'
            : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {busy ? <Spinner className="size-3.5" /> : on ? tone === 'gold' ? <span aria-hidden="true" className="size-1.5 rotate-45 bg-in-gold" /> : <GlyphCheck className="size-3.5" /> : null}
      {children}
    </button>
  )
}

/**
 * Depois de concluir: decisão por participante aceito (recebe prêmio / morreu / não compareceu / outro),
 * "Prêmio para todos" e a aplicação única aos perfis. Depois de aplicada, vira a ata do caso.
 */
function ResultsPanel({ vote: v, role, pending, run }: { vote: StaffVote; role?: Cargo; pending: string | null; run: (k: string, b: Record<string, unknown>) => Promise<Record<string, unknown> | null> }) {
  const aceitos = v.entries.filter((e) => e.admission === 'aceita')
  const decididos = aceitos.filter((e) => e.decision).length
  const applied = v.appliedAt !== null
  const premiados = aceitos.filter((e) => e.decision === 'premio' || e.decision === 'outro').length
  const approver = role === 'owner' || role === 'anfitriao'

  if (!aceitos.length) return <p className="py-2 font-body text-[14px] text-in-fg-3">Nenhum participante aceito neste caso.</p>

  return (
    <div className="flex flex-col gap-3">
      {applied ? (
        <div className="flex flex-col gap-1 bg-dv-block px-3 py-2.5 text-white">
          <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-in-gold" />
            Resultado aplicado · {new Date(v.appliedAt!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <p className="font-sans text-[13px] text-white/75">
            Recompensas: {v.rewards.entregue} entregue{v.rewards.entregue === 1 ? '' : 's'}
            {v.rewards.pendente ? ` · ${v.rewards.pendente} aguardando aprovação` : ''}
            {v.rewards.aprovada ? ` · ${v.rewards.aprovada} aprovada${v.rewards.aprovada === 1 ? '' : 's'}` : ''}
            {v.rewards.rejeitada ? ` · ${v.rewards.rejeitada} rejeitada${v.rewards.rejeitada === 1 ? '' : 's'}` : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">Resultado por participante</p>
              <p className="mt-1 font-impact text-[24px] font-semibold leading-none text-in-fg dv-tabular">
                {decididos}
                <span className="text-[16px] text-in-fg-3"> / {aceitos.length} decididos</span>
              </p>
            </div>
            {decididos < aceitos.length && (
              <MiniButton disabled={pending !== null} busy={pending === 'd-all'} onClick={() => run('d-all', { action: 'decision', voteId: v.id, playerId: '*', decision: 'premio' })}>
                Prêmio para todos
              </MiniButton>
            )}
          </div>
          <div aria-hidden="true" className="flex gap-[3px]">
            {aceitos.map((e) => (
              <span
                key={e.playerId}
                className={cn(
                  'h-1.5 flex-1 -skew-x-[20deg]',
                  e.decision === 'premio' ? 'bg-dv-block' : e.decision === 'morreu' ? 'bg-in-alert' : e.decision ? 'bg-in-fg-3' : 'bg-in-fg/10',
                )}
              />
            ))}
          </div>
        </>
      )}

      <ul className="flex flex-col">
        {aceitos.map((e) => (
          <DecisionRow key={e.playerId} entry={e} voteId={v.id} applied={applied} pending={pending} run={run} />
        ))}
      </ul>

      {!applied && (
        <div className="flex flex-col gap-2 border-t border-dashed border-in-line-strong pt-3">
          <p className="font-sans text-[13px] leading-relaxed text-in-fg-2">
            {premiados && v.prizes.length
              ? approver
                ? `Ao aplicar, ${premiados} participante${premiados === 1 ? '' : 's'} recebe${premiados === 1 ? '' : 'm'} as recompensas do caso na hora (você aprova e entrega).`
                : `Ao aplicar, as recompensas de ${premiados} participante${premiados === 1 ? '' : 's'} vão para aprovação do seu Anfitrião.`
              : 'Ao aplicar, os registros dos participantes são atualizados (sobreviveu, eliminado ou sem resultado).'}{' '}
            {v.isTutorial && 'Quem recebe prêmio vence o tutorial e desbloqueia os novos sistemas. '}A aplicação acontece uma vez só.
          </p>
          <ConfirmButton
            block
            confirmLabel="Confirmar aplicação"
            disabled={decididos < aceitos.length}
            loading={pending === 'apply'}
            onConfirm={async () => {
              const res = await run('apply', { action: 'apply', voteId: v.id })
              if (res) playSfx('reveal')
            }}
          >
            Aplicar aos perfis
          </ConfirmButton>
          {decididos < aceitos.length && <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">Faltam {aceitos.length - decididos} decisões</p>}
        </div>
      )}
    </div>
  )
}

function DecisionRow({
  entry: e,
  voteId,
  applied,
  pending,
  run,
}: {
  entry: StaffEntry
  voteId: string
  applied: boolean
  pending: string | null
  run: (k: string, b: Record<string, unknown>) => Promise<unknown>
}) {
  const [note, setNote] = useState(e.note ?? '')
  const [askNote, setAskNote] = useState(false)
  const pick = (d: EntryDecision) => {
    if (d === 'outro' && !note.trim()) {
      setAskNote(true)
      return
    }
    setAskNote(false)
    run(`d-${e.playerId}-${d}`, { action: 'decision', voteId, playerId: e.playerId, decision: e.decision === d ? null : d, note: d === 'outro' ? note : null })
  }
  return (
    <li className="flex flex-col gap-2 border-t border-in-line py-2.5 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-sans text-[15px] text-in-fg">{e.name}</span>
        {e.decision ? (
          <span className={cn('shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]', e.decision === 'morreu' ? 'text-in-alert' : e.decision === 'premio' ? 'text-in-fg' : 'text-in-fg-2')}>
            {DECISION_LABEL[e.decision].label}
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">A decidir</span>
        )}
      </div>
      {applied ? (
        <>
          {e.note && <p className="font-sans text-[13px] italic text-in-fg-2">{e.note}</p>}
          {e.prizes.length > 0 && <EntryPrizes entry={e} voteId={voteId} pending={pending} run={run} readOnly />}
        </>
      ) : (
        <>
          <div role="group" aria-label={`Resultado de ${e.name}`} className="grid grid-cols-2 gap-1.5">
            {DECISIONS.map((d) => (
              <MiniButton
                key={d}
                label={`${e.name}: ${DECISION_LABEL[d].label}`}
                on={e.decision === d}
                tone={d === 'morreu' ? 'alert' : d === 'premio' ? 'gold' : undefined}
                busy={pending === `d-${e.playerId}-${d}`}
                disabled={pending !== null}
                onClick={() => pick(d)}
              >
                {DECISION_LABEL[d].label}
              </MiniButton>
            ))}
          </div>
          <EntryPrizes entry={e} voteId={voteId} pending={pending} run={run} />
          {(askNote || e.decision === 'outro') && (
            <form
              className="flex items-end gap-2"
              onSubmit={(ev) => {
                ev.preventDefault()
                if (!note.trim()) return
                run(`d-${e.playerId}-outro`, { action: 'decision', voteId, playerId: e.playerId, decision: 'outro', note })
                setAskNote(false)
              }}
            >
              <div className="min-w-0 flex-1">
                <RecInput value={note} onChange={(ev) => setNote(ev.target.value.slice(0, 200))} placeholder="O que aconteceu?" aria-label={`Nota sobre ${e.name}`} />
              </div>
              <RecButton surface="paper" size="sm" type="submit" disabled={!note.trim()} className="shrink-0">
                Salvar
              </RecButton>
            </form>
          )}
        </>
      )}
    </li>
  )
}

/**
 * Recompensas individuais do participante (pode haver várias para a mesma pessoa), além da recompensa geral do
 * caso. Vão junto na aplicação se ele não morreu nem faltou. Cada mudança é salva na hora.
 */
function EntryPrizes({
  entry: e,
  voteId,
  pending,
  run,
  readOnly,
}: {
  entry: StaffEntry
  voteId: string
  pending: string | null
  run: (k: string, b: Record<string, unknown>) => Promise<unknown>
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(e.prizes.length > 0)
  const { names } = useStaffItems()
  const key = `p-${e.playerId}`
  if (readOnly) {
    return (
      <ul className="flex flex-col gap-0.5 pl-1">
        {e.prizes.map((p) => (
          <li key={p.id} className="flex items-center gap-2 font-sans text-[13px] text-in-fg-2">
            <span aria-hidden="true" className="size-1 rotate-45 bg-in-gold" />
            {resourceText(p, names)}
            {p.label && <span className="text-in-fg-3">· {p.label}</span>}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="dv-focus flex min-h-9 items-center gap-2 self-start font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-2 hover:text-in-fg"
      >
        <span aria-hidden="true" className={cn('size-1.5 rotate-45 transition-colors', e.prizes.length ? 'bg-in-gold' : 'shadow-[inset_0_0_0_1px_var(--in-line-strong)]')} />
        Recompensas individuais{e.prizes.length ? ` · ${e.prizes.length}` : ''}
        {pending === key && <Spinner className="size-3" />}
      </button>
      {open && (
        <div className="border-l border-in-line pl-3">
          <PrizeEditor
            value={e.prizes.map((p) => ({ recurso: p.recurso, chave: p.chave, quantidade: p.quantidade, label: p.label }))}
            onChange={(prizes) => run(key, { action: 'entryPrizes', voteId, playerId: e.playerId, prizes })}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Estado do caso como linha do tempo: o ciclo (convocado → em andamento → encerrado) com os nós
 * ligados e o estado atual em bloco negro; embaixo, "Interromper" com cancelado e falha (rubi só
 * quando escolhida). É um único grupo de rádio.
 */
function StatusControl({ vote: v, pending, onPick }: { vote: StaffVote; pending: string | null; onPick: (st: DeadlyVoteStatus) => void }) {
  const flowAt = STATUS_FLOW.indexOf(v.status)
  // Depois de aplicado aos perfis, o estado fica selado (o banco também recusa).
  const sealed = v.appliedAt !== null
  if (sealed) pending = pending ?? 'selado'
  return (
    <div role="radiogroup" aria-label={`Estado de ${voteTitle(v)}`} aria-disabled={sealed || undefined} className="border-t border-in-line px-3.5 pb-3.5 pt-3">
      <RecLabel hint={sealed ? 'selado: resultado aplicado' : undefined}>Estado do caso</RecLabel>
      <div className="relative mt-2 grid grid-cols-3">
        <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-[22px] h-px bg-in-line-strong" />
        {flowAt > 0 && <span aria-hidden="true" className="absolute left-[16.6%] top-[22px] h-px bg-in-fg" style={{ width: `${(flowAt / 2) * 66.8}%` }} />}
        {STATUS_FLOW.map((st, i) => {
          const on = v.status === st
          const past = flowAt > i
          return (
            <button
              key={st}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={pending !== null}
              onClick={() => !on && onPick(st)}
              className="dv-focus group relative flex min-h-[64px] flex-col items-center justify-start gap-1.5 pt-[15px] disabled:cursor-not-allowed"
            >
              <span className={cn('relative grid size-[15px] place-items-center', !on && 'transition-transform group-hover:scale-110')}>
                {on ? (
                  <StatusMark status={st} size={15} />
                ) : (
                  <span aria-hidden="true" className={cn('size-[9px] rotate-45', past ? 'bg-in-fg-2' : 'bg-[color:var(--in-porcelain)] shadow-[inset_0_0_0_1px_var(--in-line-strong)]')} />
                )}
              </span>
              <span
                className={cn(
                  'dv-cut-diag inline-flex min-h-6 items-center gap-1.5 px-2 font-mono text-[10px] uppercase leading-tight tracking-[0.1em]',
                  on ? 'bg-dv-block text-white' : 'text-in-fg-2 group-hover:text-in-fg',
                )}
                style={{ '--dv-cut': '5px' } as CSSProperties}
              >
                {pending === `s-${st}` && <Spinner className="size-3" />}
                {DEADLY_VOTE_STATUS[st].short}
              </span>
            </button>
          )
        })}
      </div>
      {/* Em tela estreita (ou fonte grande no Android) o rótulo vai para cima e os dois botões dividem a linha. */}
      <div className={cn('mt-2 grid grid-cols-2 gap-2 border-t border-dashed border-in-line pt-2.5', sealed && 'hidden')}>
        <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Interromper</span>
        {STATUS_BREAK.map((st) => {
          const on = v.status === st
          return (
            <button
              key={st}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={pending !== null}
              onClick={() => !on && onPick(st)}
              className={cn(
                'dv-focus dv-cut-diag inline-flex min-h-11 min-w-0 items-center justify-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:cursor-wait',
                on
                  ? st === 'falha'
                    ? 'bg-dv-blood text-white'
                    : 'bg-dv-block text-white line-through decoration-white/60'
                  : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
              )}
              style={{ '--dv-cut': '6px' } as CSSProperties}
            >
              {pending === `s-${st}` ? <Spinner className="size-3" /> : <StatusMark status={st} size={9} className={on ? 'opacity-90' : undefined} />}
              {DEADLY_VOTE_STATUS[st].short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Link do grupo do WhatsApp: o Dealer informa, troca ou remove. Valida o formato do convite. */
function GroupLinkField({ vote: v, pending, onSave }: { vote: StaffVote; pending: boolean; onSave: (url: string | null) => void }) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(!v.groupUrl)
  const ok = normalizeGroupUrl(draft) !== null
  const closed = v.status === 'concluido' || v.status === 'cancelado' || v.status === 'falha'
  const code = v.groupUrl?.replace('https://chat.whatsapp.com/', '') ?? ''

  return (
    <div className="border-t border-in-line px-3.5 pb-3.5 pt-3">
      <RecLabel hint={v.status === 'em-progresso' ? 'visível aos inscritos' : closed ? 'caso fechado' : 'aparece quando começar'}>Grupo do WhatsApp</RecLabel>
      {v.groupUrl && !editing ? (
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center bg-dv-block text-[#ece5d8]" aria-hidden="true">
              <Link2 className="size-4" strokeWidth={1.4} />
            </span>
            <p className="min-w-0 flex-1 truncate font-mono text-[12px] tracking-[0.02em] text-in-fg" title={v.groupUrl}>
              <span className="text-in-fg-3">chat.whatsapp.com/</span>
              {code}
            </p>
          </div>
          <div className="flex justify-end gap-1">
            <RecButton surface="paper" variant="ghost" size="sm" onClick={() => setEditing(true)} className="px-1.5">
              Trocar
            </RecButton>
            <RecButton surface="paper" variant="ghost" size="sm" loading={pending} onClick={() => onSave(null)} className="px-1.5 text-in-fg-2">
              Remover
            </RecButton>
          </div>
        </div>
      ) : (
        <form
          className="mt-2 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!ok || pending) return
            onSave(draft.trim())
            setDraft('')
            setEditing(false)
          }}
        >
          <div className="min-w-0 flex-1">
            <RecInput
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              inputMode="url"
              placeholder="https://chat.whatsapp.com/…"
              aria-label={`Link do grupo de ${voteTitle(v)}`}
              aria-invalid={(!!draft.trim() && !ok) || undefined}
              maxLength={200}
            />
          </div>
          <RecButton surface="paper" type="submit" size="sm" disabled={!ok} loading={pending} className="self-end">
            Salvar link
          </RecButton>
        </form>
      )}
      {!v.groupUrl && v.status === 'em-progresso' && <p className="mt-1.5 font-sans text-[12px] text-in-fg-2">Os inscritos estão esperando o link para entrar no grupo.</p>}
    </div>
  )
}
