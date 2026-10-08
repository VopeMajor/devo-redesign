'use client'

import { Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Badge, Button, Frame, GlyphCheck, GlyphGavel, Panel, Reveal, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { arcLabel, DEADLY_VOTE_STATUS, type DeadlyVoteStatus, type StaffBoard, type StaffVote, type VoteOutcome, voteTitle } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { STATUS_BADGE, tallyText } from './deadly-vote-history'
import { RECORD_KEY, recordAction } from './use-deadly-votes'

const BOARD_KEY = `${RECORD_KEY}?view=staff`
const STATUSES: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'cancelado', 'falha']
const STATUS_SHORT: Record<DeadlyVoteStatus, string> = {
  convocado: 'Convocado',
  'em-progresso': 'Em progresso',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  falha: 'Falha',
}

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

const INPUT =
  'dv-focus dv-cut-diag w-full bg-dv-ink px-3.5 font-sans text-[15px] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] outline-none placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_var(--dv-cobalt)] [color-scheme:dark]'

/**
 * Mesa do Dealer (Dealer/Admin): convocar Deadly Votes, conduzir o estado de cada caso e registrar
 * o resultado de cada inscrito (sobreviveu / eliminado). Usa as ações já existentes de /api/record.
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
    <Panel
      kicker="Gerência · Tribunal"
      title="Mesa do Dealer"
      jp="ディーラー"
      tone="gold"
      cut="diag"
      pad="md"
      aria-label="Mesa do Dealer"
    >
      <p className="font-body text-[15px] leading-relaxed text-dv-text-2">Convoque, conduza e registre o resultado de cada Deadly Vote. Tudo aqui aparece no Record dos participantes.</p>
      <Button
        size="sm"
        variant={creating ? 'ghost' : 'secondary'}
        aria-expanded={creating}
        onClick={() => setCreating((v) => !v)}
        sfx="click"
        icon={creating ? undefined : <Plus strokeWidth={1.6} />}
        className="mt-3"
      >
        {creating ? 'Fechar' : 'Convocar'}
      </Button>

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
        <p role="alert" className="mt-3 font-mono text-[12px] text-dv-blood-text">
          {actionError}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <p className="flex items-center gap-2 font-body text-[15px] text-dv-text-2">
            <Spinner className="size-4 text-dv-cobalt-text" /> Abrindo a mesa…
          </p>
        ) : error ? (
          <p role="alert" className="font-body text-[15px] text-dv-blood-text">
            {(error as Error).message}
          </p>
        ) : !votes.length ? (
          <p className="font-body text-[15px] text-dv-text-2">Nenhum Deadly Vote convocado ainda.</p>
        ) : (
          votes.map((v) => <StaffVoteCard key={v.id} vote={v} onAction={act} />)
        )}
      </div>
    </Panel>
  )
}

function ConvokeForm({ onSubmit }: { onSubmit: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [title, setTitle] = useState('')
  const [arc, setArc] = useState('')
  const [briefing, setBriefing] = useState('')
  const [start, setStart] = useState(defaultStart)
  const [max, setMax] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = title.trim().length >= 2 && !Number.isNaN(new Date(start).getTime())

  return (
    <form
      aria-label="Convocar Deadly Vote"
      className="dv-stitch mt-4 flex flex-col gap-3 p-4"
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
        })
        setBusy(false)
      }}
    >
      <Field label="Título">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required placeholder="Leilão de Sombras" className={cn(INPUT, 'h-12')} style={{ '--dv-cut': '8px' } as CSSProperties} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Arco (opcional)">
          <input value={arc} onChange={(e) => setArc(e.target.value)} maxLength={60} placeholder="Arco I" className={cn(INPUT, 'h-12')} style={{ '--dv-cut': '8px' } as CSSProperties} />
        </Field>
        <Field label="Vagas (opcional)">
          <input
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, '').slice(0, 3))}
            inputMode="numeric"
            placeholder="Livre"
            className={cn(INPUT, 'h-12 dv-tabular')}
            style={{ '--dv-cut': '8px' } as CSSProperties}
          />
        </Field>
      </div>
      <Field label="Início">
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className={cn(INPUT, 'h-12')} style={{ '--dv-cut': '8px' } as CSSProperties} />
      </Field>
      <Field label="Briefing (opcional)">
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="O que os participantes precisam saber."
          className={cn(INPUT, 'resize-none py-2.5 leading-relaxed')}
          style={{ '--dv-cut': '8px' } as CSSProperties}
        />
      </Field>
      <Button type="submit" block loading={busy} disabled={!valid} icon={<GlyphGavel />}>
        Convocar Deadly Vote
      </Button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="dv-label text-[10px] text-dv-text-3">{label}</span>
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
    <Frame variant={live ? 'alert' : 'ink'} tone={live ? 'blood' : 'neutral'} cut="diag" cutSize={12} pad="none">
      <div className="flex items-start gap-3 p-3.5">
        <span
          aria-hidden="true"
          className="dv-paper-bg dv-cut-diag flex w-12 shrink-0 flex-col items-center py-1 text-dv-paper-ink"
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <span className="dv-label text-[10px] tracking-[0.1em] text-dv-paper-ink/60">Caso</span>
          <span className="font-impact text-[19px] font-bold leading-none dv-tabular">{String(v.number).padStart(3, '0')}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">{voteTitle(v)}</p>
          <p className="truncate font-sans text-[12px] text-dv-text-3">
            {v.arc ? `${arcLabel(v.arc)} · ` : ''}
            {new Date(v.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={STATUS_BADGE[v.status]} live={live}>
              {DEADLY_VOTE_STATUS[v.status].label}
            </Badge>
            <Badge>
              {v.participants}
              {v.maxParticipants ? `/${v.maxParticipants}` : ''} inscritos
            </Badge>
          </div>
          {tally && <p className="mt-1.5 font-body text-[14px] text-dv-text-2">{tally}</p>}
        </div>
      </div>

      <div className="border-t border-dv-line px-3.5 py-3">
        <p className="dv-label text-[10px] text-dv-text-3">Estado do caso</p>
        <div role="radiogroup" aria-label={`Estado de ${voteTitle(v)}`} className="mt-1.5 flex flex-wrap gap-1">
          {STATUSES.map((st) => {
            const on = v.status === st
            const danger = DEADLY_VOTE_STATUS[st].danger
            return (
              <button
                key={st}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={pending !== null}
                onClick={() => !on && run(`s-${st}`, { action: 'status', voteId: v.id, status: st })}
                className={cn(
                  'dv-focus group relative inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-60',
                  on ? 'text-white' : 'text-dv-text-2 hover:text-dv-text',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 inset-y-1 -skew-x-[14deg] border transition-colors',
                    on ? (danger ? 'border-dv-blood bg-dv-blood-deep' : 'border-dv-cobalt bg-dv-cobalt-dim') : 'border-dv-line-strong bg-dv-ink-2/80',
                  )}
                />
                <span className="relative flex items-center gap-1.5">
                  {pending === `s-${st}` && <Spinner className="size-3.5" />}
                  {STATUS_SHORT[st]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-dv-line">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="dv-focus flex min-h-11 w-full items-center justify-between px-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-cobalt-text hover:text-dv-text"
        >
          <span>Registrar resultados · {v.entries.length}</span>
          <span aria-hidden="true" className={cn('transition-transform duration-300', open && 'rotate-180')}>
            ▾
          </span>
        </button>
        {open && (
          <ul className="animate-dv-rise px-3.5 pb-3">
            {!v.entries.length && <li className="py-2 font-body text-[14px] text-dv-text-3">Ninguém se inscreveu neste caso.</li>}
            {v.entries.map((e) => (
              <li key={e.playerId} className="flex items-center gap-2 border-t border-dv-line py-2 first:border-t-0">
                <span className="min-w-0 flex-1 truncate font-sans text-[14px] text-dv-text">{e.name}</span>
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
                        on
                          ? o === 'eliminado'
                            ? 'bg-dv-blood text-white'
                            : 'bg-dv-cobalt text-white'
                          : 'bg-dv-ink-3 text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)] hover:text-dv-text',
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
    </Frame>
  )
}
