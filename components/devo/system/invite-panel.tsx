'use client'

import { Check, Copy, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import type { PlayerRole } from '@/lib/devo/deadly-votes'
import type { Invite, InvitesPayload } from '@/lib/devo/invites-server'
import { cn } from '@/lib/utils'
import { SystemLabel } from './primitives'

const KEY = '/api/invites'
const ROLE_LABEL: Record<PlayerRole, string> = { player: 'Jogador', dealer: 'Dealer', admin: 'Admin' }

async function fetcher(url: string): Promise<InvitesPayload> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha ao carregar convites.')
  return data as InvitesPayload
}

async function post(body: Record<string, unknown>) {
  const res = await fetch(KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Não foi possível concluir a ação.')
  return data
}

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function CopyButton({ code, className }: { code: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1400)
        })
      }}
      className={cn('inline-flex size-8 items-center justify-center border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary', className)}
      aria-label={`Copiar código ${code}`}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function InvitePanel() {
  const { data, error, isLoading, mutate } = useSWR(KEY, fetcher)
  const [role, setRole] = useState<PlayerRole>('player')
  const [note, setNote] = useState('')
  const [test, setTest] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const create = async () => {
    setBusy(true)
    setActionError(null)
    try {
      const res = await post({ action: 'create', role, note, test })
      setFresh(res.code ?? null)
      setNote('')
      await mutate()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (code: string) => {
    setActionError(null)
    try {
      await post({ action: 'revoke', code })
      if (fresh === code) setFresh(null)
      await mutate()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  const invites = data?.invites ?? []
  const available = invites.filter((i) => !i.usedAt).length

  return (
    <div className="flex flex-col gap-4">
      <section className="border border-border bg-card p-4" aria-label="Gerar convite">
        <SystemLabel>Gerar convite</SystemLabel>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Cada código vale para uma única conta. Depois de usado, a pessoa entra por Continuar com usuário e senha.
        </p>
        <div className="mt-3 flex flex-col gap-3 @lg:flex-row @lg:items-end">
          {data && data.canGrant.length > 1 && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">Papel</span>
              <div role="radiogroup" aria-label="Papel do convite" className="flex border border-border">
                {data.canGrant.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={role === r}
                    onClick={() => setRole(r)}
                    className={cn(
                      'px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors',
                      role === r ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:text-primary',
                    )}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">Nota (opcional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={60}
              placeholder="Para quem é este convite?"
              className="h-9 border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          {data?.role === 'admin' && (
            <label className="flex h-9 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70">
              <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} className="accent-[var(--primary)]" />
              Conta de teste
            </label>
          )}
          <button
            type="button"
            onClick={create}
            disabled={busy || !data}
            className="inline-flex h-9 items-center justify-center gap-2 bg-primary px-4 text-[11px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Gerar
          </button>
        </div>
        {fresh && (
          <div className="mt-4 flex items-center justify-between gap-3 border border-primary/50 bg-primary/10 p-3" aria-live="polite">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Novo código</p>
              <p className="truncate font-mono text-lg tracking-[0.12em]">{fresh}</p>
            </div>
            <CopyButton code={fresh} />
          </div>
        )}
        {actionError && (
          <p role="alert" className="mt-3 font-mono text-[11px] text-destructive">
            {actionError}
          </p>
        )}
      </section>

      <section className="border border-border bg-card p-4" aria-label="Convites emitidos">
        <div className="flex items-center justify-between gap-2">
          <SystemLabel>Convites emitidos</SystemLabel>
          {data && <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">{available} disponíveis</span>}
        </div>
        {isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Carregando…
          </p>
        ) : error ? (
          <p role="alert" className="mt-3 text-[12px] text-destructive">
            {(error as Error).message}
          </p>
        ) : !invites.length ? (
          <p className="mt-3 text-[12px] text-muted-foreground">Nenhum convite emitido ainda.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {invites.map((i) => (
              <InviteRow key={i.code} invite={i} showCreator={data?.role === 'admin'} onRevoke={revoke} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function InviteRow({ invite: i, showCreator, onRevoke }: { invite: Invite; showCreator: boolean; onRevoke: (code: string) => void }) {
  const used = !!i.usedAt
  return (
    <li className={cn('flex items-center gap-3 py-2.5', used && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-mono text-sm tracking-[0.08em]', used && 'line-through')}>{i.code}</span>
          <span className="border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/70">{ROLE_LABEL[i.role]}</span>
          {i.isTest && (
            <span className="border border-dashed border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/60" title="Fora de ranking, apostas e prêmios">
              Teste
            </span>
          )}
          <span className={cn('font-mono text-[9px] uppercase tracking-[0.16em]', used ? 'text-foreground/60' : 'text-primary')}>
            {used ? 'Usado' : 'Disponível'}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {used ? `${i.usedBy ?? 'Conta criada'} · ${fmt(i.usedAt!)}` : `Criado ${fmt(i.createdAt)}`}
          {showCreator && i.createdBy ? ` · por ${i.createdBy}` : ''}
          {i.note ? ` · ${i.note}` : ''}
        </p>
      </div>
      {!used && (
        <div className="flex shrink-0 gap-1.5">
          <CopyButton code={i.code} />
          <button
            type="button"
            onClick={() => onRevoke(i.code)}
            className="inline-flex size-8 items-center justify-center border border-border text-foreground/70 transition-colors hover:border-destructive hover:text-destructive"
            aria-label={`Revogar código ${i.code}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </li>
  )
}
