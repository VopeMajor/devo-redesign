'use client'

import { Link2, Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { GlyphCheck, GlyphGavel, HudCode, RecordPanel, Reveal, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import {
  arcLabel,
  DEADLY_VOTE_STATUS,
  type DeadlyVoteStatus,
  normalizeGroupUrl,
  STATUS_BREAK,
  STATUS_FLOW,
  type StaffBoard,
  type StaffVote,
  type VoteOutcome,
  voteTitle,
} from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { tallyText } from './deadly-vote-history'
import { CaseTab, RecButton, RecInput, RecLabel, RecTag, RecTextarea, StatusChip, StatusMark } from './record-ui'
import { RECORD_KEY, recordAction } from './use-deadly-votes'

const BOARD_KEY = `${RECORD_KEY}?view=staff`

async function fetcher(url: string): Promise<StaffBoard> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha ao carregar a mesa do Dealer.')
  return data as StaffBoard
}

function defaultStart() {
  const d = new Date(Date.now() + 24 * 3600_000)
  d.setMinutes(0, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Mesa do Dealer (Dealer/Admin), na folha de porcelana: lançar a edição com data, conduzir o estado
 * de cada caso (convocado → em andamento → encerrado, ou cancelado/falha), informar o link do grupo
 * do WhatsApp (os inscritos veem "Entrar no grupo" quando o caso está em andamento) e registrar o
 * resultado de cada inscrito.
 */
export function DealerBoard() {
  const { data, error, isLoading, mutate } = useSWR(BOARD_KEY, fetcher)
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const act = async (body: Record<string, unknown>) => {
    setActionError(null)
    try {
      await recordAction(body)
      await Promise.all([mutate(), globalMutate(RECORD_KEY)])
      return true
    } catch (e) {
      playSfx('error')
      setActionError((e as Error).message)
      return false
    }
  }

  const votes = data?.votes ?? []

  return (
    <RecordPanel variant="paper" title="Mesa do Dealer" jp="ディーラー" ornate headerRight={<HudCode code="DV_DEALER" />}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        Lance a edição com data, conduza o estado do caso e libere o grupo do WhatsApp quando começar. Tudo aqui aparece no Record dos participantes.
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
            onSubmit={async (body) => {
              const ok = await act({ action: 'create', ...body })
              if (ok) {
                playSfx('confirm')
                setCreating(false)
              }
              return ok
            }}
          />
        </Reveal>
      )}

      {actionError && (
        <p role="alert" className="mt-3 font-mono text-[12px] text-in-alert">
          {actionError}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {isLoading ? (
          <p className="flex items-center gap-2 font-body text-[15px] text-in-fg-2">
            <Spinner className="size-4" /> Abrindo a mesa…
          </p>
        ) : error ? (
          <p role="alert" className="font-body text-[15px] text-in-alert">
            {(error as Error).message}
          </p>
        ) : !votes.length ? (
          <p className="font-body text-[15px] text-in-fg-2">Nenhum Deadly Vote convocado ainda.</p>
        ) : (
          votes.map((v) => <StaffVoteCard key={v.id} vote={v} onAction={act} />)
        )}
      </div>
    </RecordPanel>
  )
}

function ConvokeForm({ onSubmit }: { onSubmit: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [title, setTitle] = useState('')
  const [arc, setArc] = useState('')
  const [briefing, setBriefing] = useState('')
  const [start, setStart] = useState(defaultStart)
  const [max, setMax] = useState('')
  const [group, setGroup] = useState('')
  const [busy, setBusy] = useState(false)
  const groupOk = !group.trim() || normalizeGroupUrl(group) !== null
  const valid = title.trim().length >= 2 && !Number.isNaN(new Date(start).getTime()) && groupOk

  return (
    <form
      aria-label="Convocar Deadly Vote"
      className="relative mt-4 flex flex-col gap-4 bg-in-fg/[0.03] p-4 pl-5 shadow-[inset_0_0_0_1px_var(--in-line-strong)]"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || busy) return
        setBusy(true)
        await onSubmit({
          title: title.trim(),
          arc: arc.trim() || null,
          briefing: briefing.trim() || null,
          startsAt: new Date(start).getTime(),
          maxParticipants: max ? Number(max) : null,
          groupUrl: group.trim() || null,
        })
        setBusy(false)
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Nova edição · Ficha de convocação</p>
      <Field label="Título">
        <RecInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required placeholder="Leilão de Sombras" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Arco" hint="opcional">
          <RecInput value={arc} onChange={(e) => setArc(e.target.value)} maxLength={60} placeholder="Arco I" />
        </Field>
        <Field label="Vagas" hint="opcional">
          <RecInput value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="Livre" className="dv-tabular" />
        </Field>
      </div>
      <Field label="Data de início">
        <RecInput type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className="[color-scheme:light]" />
      </Field>
      <Field label="Link do grupo (WhatsApp)" hint="pode vir depois">
        <RecInput
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          inputMode="url"
          placeholder="https://chat.whatsapp.com/…"
          aria-invalid={!groupOk || undefined}
          maxLength={200}
        />
      </Field>
      <Field label="Briefing" hint="opcional">
        <RecTextarea value={briefing} onChange={(e) => setBriefing(e.target.value)} maxLength={600} rows={3} placeholder="O que os participantes precisam saber." />
      </Field>
      {!groupOk && <p className="font-sans text-[13px] text-in-alert">Use o convite do grupo: https://chat.whatsapp.com/…</p>}
      <RecButton surface="paper" type="submit" block loading={busy} disabled={!valid} icon={<GlyphGavel />}>
        Convocar
      </RecButton>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <RecLabel hint={hint}>{label}</RecLabel>
      {children}
    </label>
  )
}

function StaffVoteCard({ vote: v, onAction }: { vote: StaffVote; onAction: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [open, setOpen] = useState(v.status === 'em-progresso')
  const [pending, setPending] = useState<string | null>(null)
  const live = v.status === 'em-progresso'
  const tally = tallyText(v.survivors, v.eliminated)

  const run = async (key: string, body: Record<string, unknown>) => {
    setPending(key)
    await onAction(body)
    setPending(null)
  }

  return (
    <article
      aria-label={`Caso ${String(v.number).padStart(3, '0')}: ${voteTitle(v)}`}
      className={cn('relative bg-[color:var(--in-porcelain)] shadow-[inset_0_0_0_1px_var(--in-line-strong),0_6px_14px_-10px_rgba(13,13,15,0.5)]', live && 'shadow-[inset_0_0_0_1px_var(--in-fg),0_0_0_3px_color-mix(in_oklab,var(--dv-amethyst)_18%,transparent)]')}
    >
      <div className="flex items-start gap-3 p-3.5">
        <CaseTab number={v.number} muted={v.status === 'cancelado'} />
        <div className="min-w-0 flex-1">
          <p className={cn('font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg text-balance', v.status === 'cancelado' && 'text-in-fg-2')}>{voteTitle(v)}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] tracking-[0.04em] text-in-fg-3">
            {v.arc ? `${arcLabel(v.arc)} · ` : ''}
            {new Date(v.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip status={v.status} />
            <RecTag>
              {v.participants}
              {v.maxParticipants ? `/${v.maxParticipants}` : ''} inscritos
            </RecTag>
          </div>
          {tally && <p className="mt-1.5 font-body text-[14px] text-in-fg-2">{tally}</p>}
        </div>
      </div>

      <StatusControl vote={v} pending={pending} onPick={(st) => run(`s-${st}`, { action: 'status', voteId: v.id, status: st })} />

      <GroupLinkField vote={v} pending={pending === 'g'} onSave={(url) => run('g', { action: 'group', voteId: v.id, groupUrl: url })} />

      <div className="border-t border-in-line">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="dv-focus flex min-h-11 w-full items-center justify-between px-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg hover:bg-in-fg/[0.04]"
        >
          <span>Registrar resultados · {v.entries.length}</span>
          <span aria-hidden="true" className={cn('text-[10px] transition-transform duration-300', open && 'rotate-180')}>
            ▼
          </span>
        </button>
        {open && (
          <ul className="animate-dv-rise px-3.5 pb-3">
            {!v.entries.length && <li className="py-2 font-body text-[14px] text-in-fg-3">Ninguém se inscreveu neste caso.</li>}
            {v.entries.map((e) => (
              <li key={e.playerId} className="flex items-center gap-1.5 border-t border-in-line py-1.5 first:border-t-0">
                <span className="min-w-0 flex-1 truncate font-sans text-[14px] text-in-fg">{e.name}</span>
                {(['sobreviveu', 'eliminado'] as VoteOutcome[]).map((o) => {
                  const on = e.outcome === o
                  const key = `o-${e.playerId}-${o}`
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${e.name}: ${o === 'sobreviveu' ? 'sobreviveu' : 'eliminado'}`}
                      disabled={pending !== null}
                      onClick={() => run(key, { action: 'outcome', voteId: v.id, playerId: e.playerId, outcome: on ? null : o })}
                      className={cn(
                        'dv-focus dv-cut-diag inline-flex min-h-11 items-center gap-1 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:opacity-60',
                        on ? (o === 'eliminado' ? 'bg-in-alert text-white' : 'bg-in-fg text-in-bg') : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
                      )}
                      style={{ '--dv-cut': '6px' } as CSSProperties}
                    >
                      {pending === key ? <Spinner className="size-3.5" /> : on ? <GlyphCheck className="size-3.5" /> : null}
                      {o === 'sobreviveu' ? 'Vivo' : 'Eliminado'}
                    </button>
                  )
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

/**
 * Estado do caso como linha do tempo: o ciclo (convocado → em andamento → encerrado) com os nós
 * ligados e o estado atual em bloco negro; embaixo, "Interromper" com cancelado e falha (rubi só
 * quando escolhida). É um único grupo de rádio.
 */
function StatusControl({ vote: v, pending, onPick }: { vote: StaffVote; pending: string | null; onPick: (st: DeadlyVoteStatus) => void }) {
  const flowAt = STATUS_FLOW.indexOf(v.status)
  return (
    <div role="radiogroup" aria-label={`Estado de ${voteTitle(v)}`} className="border-t border-in-line px-3.5 pb-3.5 pt-3">
      <RecLabel>Estado do caso</RecLabel>
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
              className="dv-focus group relative flex min-h-[64px] flex-col items-center justify-start gap-1.5 pt-[15px] disabled:cursor-wait"
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
                  on ? 'bg-[#1c1c1f] text-white' : 'text-in-fg-2 group-hover:text-in-fg',
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
      <div className="mt-2 flex items-center gap-2 border-t border-dashed border-in-line pt-2.5">
        <span className="mr-auto font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Interromper</span>
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
                'dv-focus dv-cut-diag inline-flex min-h-11 items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:cursor-wait',
                on
                  ? st === 'falha'
                    ? 'bg-[#a3121f] text-white'
                    : 'bg-[#1c1c1f] text-white line-through decoration-white/60'
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
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="grid size-9 shrink-0 place-items-center bg-[#1c1c1f] text-[#ece5d8]" aria-hidden="true">
            <Link2 className="size-4" strokeWidth={1.4} />
          </span>
          <p className="min-w-0 flex-1 break-all font-mono text-[12px] leading-snug tracking-[0.02em] text-in-fg" title={v.groupUrl}>
            <span className="block text-[10px] text-in-fg-3">chat.whatsapp.com/</span>
            {code}
          </p>
          <span className="flex shrink-0">
          <RecButton surface="paper" variant="ghost" size="sm" onClick={() => setEditing(true)} className="px-1.5">
            Trocar
          </RecButton>
          <RecButton surface="paper" variant="ghost" size="sm" loading={pending} onClick={() => onSave(null)} className="px-1.5 text-in-fg-2">
            Remover
          </RecButton>
          </span>
        </div>
      ) : (
        <form
          className="mt-2 flex items-end gap-2"
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
          <RecButton surface="paper" type="submit" size="sm" disabled={!ok} loading={pending} className="shrink-0">
            Salvar link
          </RecButton>
        </form>
      )}
      {!v.groupUrl && v.status === 'em-progresso' && <p className="mt-1.5 font-sans text-[12px] text-in-fg-2">Os inscritos estão esperando o link para entrar no grupo.</p>}
    </div>
  )
}
