'use client'

import { Plus, Search } from 'lucide-react'
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
import useSWR from 'swr'
import { GlyphCheck, HudCode, RecordPanel, Reveal } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import type { Cargo, RecompensaTipo } from '@/lib/devo/cargos'
import type { PrizeInput } from '@/lib/devo/deadly-votes'
import type { JogadorLinha } from '@/lib/devo/permissoes-server'
import type { Recompensa, RecompensaStatus } from '@/lib/devo/recompensas-server'
import { cn } from '@/lib/utils'
import { useStaffBoard } from './dealer-board'
import { RecButton, RecInput, RecLabel, RecTag, RecTextarea } from './record-ui'
import { ConfirmButton, ErrorLine, Loading, RecSelect, ResourceFields, resourceText, STAFF_KEY, staffGet, staffPost, useStaffItems } from './staff-ui'

export const REWARDS_KEY = `${STAFF_KEY}?view=recompensas`

type Linha = Recompensa & { podeAprovar: boolean; podeEditar: boolean }

const TIPO_LABEL: Record<RecompensaTipo, string> = { evento: 'Evento', externa: 'Externa', semanal: 'Semanal' }
const STATUS_LABEL: Record<RecompensaStatus, string> = { pendente: 'Pendente', aprovada: 'Aprovada', rejeitada: 'Rejeitada', entregue: 'Entregue', cancelada: 'Cancelada' }

export function useRewards() {
  return useSWR<{ recompensas: Linha[] }>(REWARDS_KEY, staffGet, { refreshInterval: 30_000 })
}

/** Quantas propostas esperam a decisão deste ator (para o contador da Mesa). */
export function awaitingMe(list: Linha[] | undefined) {
  return (list ?? []).filter((r) => r.podeAprovar && (r.status === 'pendente' || r.status === 'aprovada')).length
}

/**
 * Recompensas (DIRECAO-3 §3): fila do que espera a decisão de quem aprova (Anfitrião: dos seus Dealers;
 * Owner: tudo, inclusive as externas), propostas próprias em andamento, histórico e o formulário de proposta.
 * Dealer só propõe (evento, nos próprios casos) — o servidor recusa qualquer aprovação dele.
 */
export function RewardsPanel({ role }: { role: Cargo }) {
  const { data, error, isLoading, mutate } = useRewards()
  const { names } = useStaffItems()
  const [proposing, setProposing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const list = data?.recompensas ?? []
  const approver = role === 'owner' || role === 'anfitriao'

  const fila = list.filter((r) => r.podeAprovar && r.status === 'pendente')
  const entregar = list.filter((r) => r.podeAprovar && r.status === 'aprovada')
  const andamento = list.filter((r) => !r.podeAprovar && (r.status === 'pendente' || r.status === 'aprovada'))
  const historico = list.filter((r) => r.status === 'entregue' || r.status === 'rejeitada' || r.status === 'cancelada')

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    setActionError(null)
    try {
      await staffPost(body)
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
      setActionError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Recompensas" jp="報酬" ornate headerRight={<HudCode code="DV_REWARD" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          {role === 'dealer'
            ? 'Proponha prêmios para os seus casos. Seu Anfitrião (ou um Owner) aprova e entrega; qualquer mudança numa proposta aprovada volta para aprovação.'
            : role === 'anfitriao'
              ? 'Aprove ou rejeite o que os seus Dealers propuseram. Recompensas fora de evento (externas) seguem para a aprovação de um Owner.'
              : 'Toda proposta da casa passa por aqui, inclusive as externas dos Anfitriões. Cada entrega fica no registro administrativo.'}
        </p>
        <RecButton
          surface="paper"
          size="sm"
          variant={proposing ? 'ghost' : 'secondary'}
          aria-expanded={proposing}
          onClick={() => setProposing((v) => !v)}
          sfx="click"
          icon={proposing ? undefined : <Plus strokeWidth={1.4} />}
          className="mt-4"
        >
          {proposing ? 'Fechar' : 'Propor recompensa'}
        </RecButton>
        {proposing && (
          <Reveal variant="rise">
            <ProposeForm
              role={role}
              onDone={async () => {
                setProposing(false)
                await mutate()
              }}
            />
          </Reveal>
        )}
        {actionError && (
          <div className="mt-3">
            <ErrorLine>{actionError}</ErrorLine>
          </div>
        )}
      </RecordPanel>

      {isLoading ? (
        <Loading>Abrindo as recompensas…</Loading>
      ) : error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : (
        <>
          {approver && (
            <Queue title="Aguardando sua decisão" count={fila.length} empty="Nada esperando aprovação.">
              {fila.map((r) => (
                <RewardCard key={r.id} r={r} names={names}>
                  <ApproveActions r={r} busy={busy} onAct={act} />
                </RewardCard>
              ))}
            </Queue>
          )}
          {approver && entregar.length > 0 && (
            <Queue title="Aprovadas · falta entregar" count={entregar.length}>
              {entregar.map((r) => (
                <RewardCard key={r.id} r={r} names={names}>
                  <RecButton surface="paper" size="sm" block loading={busy === `e-${r.id}`} onClick={() => act(`e-${r.id}`, { action: 'recompensa.entregar', id: r.id })}>
                    Entregar
                  </RecButton>
                </RewardCard>
              ))}
            </Queue>
          )}
          <Queue
            title={role === 'dealer' ? 'Suas propostas' : 'Em andamento'}
            count={andamento.length}
            empty={role === 'dealer' ? 'Nenhuma proposta aguardando. As recompensas dos casos aparecem aqui quando você aplica o resultado.' : 'Nenhuma proposta sua aguardando outra pessoa.'}
          >
            {andamento.map((r) => (
              <RewardCard key={r.id} r={r} names={names}>
                {r.podeEditar && r.status === 'pendente' && (
                  <ConfirmButton size="sm" variant="secondary" confirmLabel="Cancelar proposta" loading={busy === `c-${r.id}`} onConfirm={() => act(`c-${r.id}`, { action: 'recompensa.cancelar', id: r.id })}>
                    Cancelar
                  </ConfirmButton>
                )}
              </RewardCard>
            ))}
          </Queue>
          {historico.length > 0 && (
            <section className="flex flex-col gap-2">
              <button
                type="button"
                aria-expanded={showHistory}
                onClick={() => setShowHistory((v) => !v)}
                className="dv-focus flex min-h-11 items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg-2 hover:text-in-fg"
              >
                <span>Histórico · {historico.length}</span>
                <span aria-hidden="true" className={cn('text-[10px] transition-transform', showHistory && 'rotate-180')}>
                  ▼
                </span>
              </button>
              {showHistory && (
                <ul className="flex flex-col gap-2.5">
                  {historico.slice(0, 30).map((r) => (
                    <RewardCard key={r.id} r={r} names={names} compact />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Queue({ title, count, empty, children }: { title: string; count: number; empty?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-in-fg-2">
        <span aria-hidden="true" className="h-px w-5 bg-in-fg-3" />
        {title}
        <span className="font-impact text-[16px] font-semibold tracking-normal text-in-fg dv-tabular">{count}</span>
      </p>
      {count === 0 && empty ? <p className="pl-7 font-body text-[15px] text-in-fg-3">{empty}</p> : <ul className="flex flex-col gap-2.5">{children}</ul>}
    </section>
  )
}

function StatusTag({ status }: { status: RecompensaStatus }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.14em]',
        status === 'pendente' && 'text-in-accent shadow-[inset_0_0_0_1px_var(--in-accent)]',
        status === 'aprovada' && 'bg-dv-block text-white',
        status === 'entregue' && 'text-in-fg shadow-[inset_0_0_0_1px_var(--in-fg)]',
        (status === 'rejeitada' || status === 'cancelada') && 'text-in-fg-3 line-through shadow-[inset_0_0_0_1px_var(--in-line)]',
      )}
      style={{ '--dv-cut': '5px' } as CSSProperties}
    >
      {status === 'pendente' && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
      {status === 'entregue' && <GlyphCheck className="size-3" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Ficha de uma proposta: destinatário, recurso, origem, quem propôs/autorizou, justificativa e revisão. */
function RewardCard({ r, names, compact, children }: { r: Linha; names: Map<string, string>; compact?: boolean; children?: ReactNode }) {
  return (
    <li
      aria-label={`Recompensa para ${r.destinatario}: ${resourceText(r, names)}`}
      className={cn('relative bg-[color:var(--in-porcelain)] shadow-[inset_0_0_0_1px_var(--in-line-strong),0_6px_14px_-10px_rgba(13,13,15,0.5)]', r.tipo === 'externa' && r.status === 'pendente' && 'shadow-[inset_3px_0_0_var(--dv-amethyst),inset_0_0_0_1px_var(--in-line-strong)]')}
    >
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{r.destinatario}</p>
            <p className="mt-0.5 font-sans text-[15px] font-medium text-in-fg">{resourceText(r, names)}</p>
          </div>
          <StatusTag status={r.status} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <RecTag tone={r.tipo === 'externa' ? 'accent' : 'line'}>{TIPO_LABEL[r.tipo]}</RecTag>
          {r.revisao > 1 && <RecTag tone="muted">Revisão {r.revisao}</RecTag>}
        </div>
        <p className="truncate font-mono text-[11px] tracking-[0.04em] text-in-fg-3">{r.origem}</p>
        {!compact && <p className="border-l-2 border-in-line-strong pl-2.5 font-body text-[15px] italic leading-snug text-in-fg-2">{r.justificativa}</p>}
        <p className="font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.1em] text-in-fg-3">
          {r.propostoPorNome ? `Proposta por ${r.propostoPorNome}` : 'Proposta'} · {new Date(r.criadaEm).toLocaleDateString('pt-BR')}
          {r.autorizadoPorNome && ` · ${r.status === 'rejeitada' ? 'rejeitada' : 'autorizada'} por ${r.autorizadoPorNome}`}
        </p>
        {r.nota && <p className="font-sans text-[13px] text-in-fg-2">Nota: {r.nota}</p>}
        {children && <div className="flex flex-col gap-2 border-t border-dashed border-in-line pt-2.5">{children}</div>}
      </div>
    </li>
  )
}

function ApproveActions({ r, busy, onAct }: { r: Linha; busy: string | null; onAct: (key: string, body: Record<string, unknown>) => Promise<void> }) {
  const [rejecting, setRejecting] = useState(false)
  const [nota, setNota] = useState('')
  if (rejecting) {
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onAct(`r-${r.id}`, { action: 'recompensa.rejeitar', id: r.id, nota })
        }}
      >
        <RecInput value={nota} onChange={(e) => setNota(e.target.value.slice(0, 300))} placeholder="Motivo (opcional)" aria-label={`Motivo da rejeição para ${r.destinatario}`} />
        <div className="flex gap-2">
          <RecButton surface="paper" type="submit" size="sm" variant="secondary" className="flex-1" loading={busy === `r-${r.id}`}>
            Confirmar rejeição
          </RecButton>
          <RecButton surface="paper" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Voltar
          </RecButton>
        </div>
      </form>
    )
  }
  return (
    <div className="flex gap-2">
      <RecButton
        surface="paper"
        size="sm"
        className="flex-1"
        loading={busy === `a-${r.id}`}
        disabled={busy !== null}
        aria-label={`Aprovar e entregar a recompensa de ${r.destinatario}`}
        onClick={() => onAct(`a-${r.id}`, { action: 'recompensa.aprovar', id: r.id, entregar: true })}
      >
        Aprovar e entregar
      </RecButton>
      <RecButton surface="paper" size="sm" variant="secondary" disabled={busy !== null} aria-label={`Rejeitar a recompensa de ${r.destinatario}`} onClick={() => setRejecting(true)}>
        Rejeitar
      </RecButton>
    </div>
  )
}

/* ───────────────────────────── Propor ───────────────────────────── */

type Pessoa = { id: string; name: string }

/** Escolha de destinatário: inscritos do caso (evento) ou busca de jogadores (Owner/Anfitrião). */
function RecipientPicker({ value, onChange, options }: { value: Pessoa | null; onChange: (p: Pessoa | null) => void; options?: Pessoa[] }) {
  const [q, setQ] = useState('')
  const key = options ? null : `${STAFF_KEY}?view=jogadores&q=${encodeURIComponent(q.trim())}`
  const { data, isLoading } = useSWR<{ jogadores: JogadorLinha[] }>(key, staffGet, { keepPreviousData: true })
  if (options) {
    return (
      <RecSelect value={value?.id ?? ''} onChange={(e) => onChange(options.find((o) => o.id === e.target.value) ?? null)} aria-label="Destinatário">
        <option value="">{options.length ? 'Escolha um participante' : 'Nenhum participante aceito'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </RecSelect>
    )
  }
  if (value) {
    return (
      <div className="flex min-h-12 items-center justify-between gap-2 bg-in-fg/[0.035] px-3 shadow-[inset_0_-2px_0_var(--in-fg)]">
        <span className="truncate font-sans text-[16px] text-in-fg">{value.name}</span>
        <RecButton surface="paper" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Trocar
        </RecButton>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="relative block">
        <RecInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jogador pelo nome" aria-label="Buscar destinatário" className="pr-10" />
        <Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-in-fg-3" strokeWidth={1.4} />
      </span>
      <ul className="max-h-48 overflow-y-auto">
        {isLoading && !data && <li className="py-2 font-sans text-[13px] text-in-fg-3">Buscando…</li>}
        {(data?.jogadores ?? []).slice(0, 8).map((j) => (
          <li key={j.id}>
            <button type="button" onClick={() => onChange({ id: j.id, name: j.name })} className="dv-focus flex min-h-11 w-full items-center justify-between gap-2 border-b border-in-line px-1 text-left hover:bg-in-fg/[0.04]">
              <span className="truncate font-sans text-[15px] text-in-fg">{j.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">{j.deadlyVotes} DV</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProposeForm({ role, onDone }: { role: Cargo; onDone: () => Promise<void> }) {
  const tipos: RecompensaTipo[] = role === 'dealer' ? ['evento'] : ['evento', 'externa', 'semanal']
  const [tipo, setTipo] = useState<RecompensaTipo>(role === 'anfitriao' ? 'externa' : 'evento')
  const { data: board } = useStaffBoard()
  const { itens } = useStaffItems()
  const votes = useMemo(() => (board?.votes ?? []).filter((v) => v.status !== 'cancelado'), [board])
  const [voteId, setVoteId] = useState('')
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [res, setRes] = useState<PrizeInput>({ recurso: 'tempo', chave: null, quantidade: 60 })
  const [origem, setOrigem] = useState('')
  const [just, setJust] = useState('')
  const [agora, setAgora] = useState(role === 'owner')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const vote = votes.find((v) => v.id === voteId)
  const options = tipo === 'evento' && (role === 'dealer' || vote) ? (vote?.entries ?? []).filter((e) => e.admission === 'aceita').map((e) => ({ id: e.playerId, name: e.name })) : undefined
  const needsVote = tipo === 'evento' && role === 'dealer'
  const valid =
    !!pessoa && res.quantidade > 0 && (res.recurso === 'tempo' || res.recurso === 'convite' || !!res.chave) && just.trim().length >= 3 && (!needsVote || !!voteId) && (tipo === 'evento' && voteId ? true : origem.trim().length >= 2)

  return (
    <form
      aria-label="Propor recompensa"
      className="relative mt-4 flex flex-col gap-4 bg-in-fg/[0.03] p-4 pl-5 shadow-[inset_0_0_0_1px_var(--in-line-strong)]"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy || !pessoa) return
        setBusy(true)
        setErr(null)
        try {
          await staffPost({
            action: 'recompensa.propor',
            tipo,
            voteId: tipo === 'evento' && voteId ? voteId : null,
            origem: origem.trim() || null,
            destinatarioId: pessoa.id,
            recurso: res.recurso,
            chave: res.chave,
            quantidade: res.quantidade,
            justificativa: just.trim(),
            aprovar: role === 'owner' && agora,
            entregar: role === 'owner' && agora,
          })
          playSfx('confirm')
          await onDone()
        } catch (x) {
          playSfx('error')
          setErr((x as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Nova proposta · quantidade, destinatário, justificativa e origem</p>
      {tipos.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <RecLabel>Tipo</RecLabel>
          <div role="radiogroup" aria-label="Tipo de recompensa" className="grid grid-cols-3 gap-1.5">
            {tipos.map((t) => {
              const on = tipo === t
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setTipo(t)
                    setPessoa(null)
                  }}
                  className={cn(
                    'dv-focus dv-cut-diag inline-flex min-h-11 items-center justify-center gap-1.5 px-2 font-mono text-[10.5px] uppercase tracking-[0.12em]',
                    on ? 'bg-dv-block text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
                  )}
                  style={{ '--dv-cut': '6px' } as CSSProperties}
                >
                  {on && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
                  {TIPO_LABEL[t]}
                </button>
              )
            })}
          </div>
          <p className="font-sans text-[12px] text-in-fg-3">
            {tipo === 'externa'
              ? role === 'owner'
                ? 'Fora de evento autorizado.'
                : 'Fora de evento autorizado: só um Owner aprova.'
              : tipo === 'semanal'
                ? 'Recompensas semanais dos jogos: Anfitrião só aprova com autorização de um Owner.'
                : 'Ligada a um Deadly Vote (ou a um jogo que você organiza).'}
          </p>
        </div>
      )}
      {tipo === 'evento' && (
        <label className="flex min-w-0 flex-col gap-1.5">
          <RecLabel hint={needsVote ? undefined : 'opcional'}>Deadly Vote</RecLabel>
          <RecSelect
            value={voteId}
            onChange={(e) => {
              setVoteId(e.target.value)
              setPessoa(null)
            }}
          >
            <option value="">{votes.length ? 'Escolha o caso' : 'Nenhum caso na sua mesa'}</option>
            {votes.map((v) => (
              <option key={v.id} value={v.id}>
                № {String(v.number).padStart(3, '0')} · {v.title}
              </option>
            ))}
          </RecSelect>
        </label>
      )}
      {(tipo !== 'evento' || !voteId) && (
        <label className="flex min-w-0 flex-col gap-1.5">
          <RecLabel>Evento de origem</RecLabel>
          <RecInput value={origem} onChange={(e) => setOrigem(e.target.value.slice(0, 120))} placeholder={tipo === 'semanal' ? 'Semana de 12/10 · Sala de Jogos' : 'Ajuda no evento de sábado'} />
        </label>
      )}
      <div className="flex min-w-0 flex-col gap-1.5">
        <RecLabel>Destinatário</RecLabel>
        <RecipientPicker value={pessoa} onChange={setPessoa} options={options} />
      </div>
      <ResourceFields value={res} onChange={setRes} itens={itens} idPrefix="proposta" />
      <label className="flex min-w-0 flex-col gap-1.5">
        <RecLabel>Justificativa</RecLabel>
        <RecTextarea value={just} onChange={(e) => setJust(e.target.value.slice(0, 500))} rows={2} placeholder="Por que esta pessoa recebe isto?" />
      </label>
      {role === 'owner' && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={agora}
            onChange={(e) => setAgora(e.target.checked)}
            className="dv-focus peer size-5 shrink-0 cursor-pointer appearance-none border border-in-line-strong bg-transparent transition-colors checked:border-dv-block checked:bg-dv-block"
          />
          <GlyphCheck aria-hidden="true" className="pointer-events-none -ml-8 size-5 p-0.5 text-white opacity-0 peer-checked:opacity-100" />
          <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-in-fg">Aprovar e entregar agora</span>
        </label>
      )}
      {err && <ErrorLine>{err}</ErrorLine>}
      <RecButton surface="paper" type="submit" block loading={busy} disabled={!valid}>
        {role === 'owner' && agora ? 'Conceder' : 'Enviar proposta'}
      </RecButton>
    </form>
  )
}

