'use client'

import { Copy, Plus, Trash2 } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import useSWR from 'swr'
import { Badge, Button, GlyphCheck, IconButton, Panel, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import type { PlayerRole } from '@/lib/devo/deadly-votes'
import type { Invite, InvitesPayload } from '@/lib/devo/invites-server'
import { cn } from '@/lib/utils'

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
    <IconButton
      label={`Copiar código ${code}`}
      variant="secondary"
      className={className}
      sfx="click"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1400)
        })
      }}
    >
      {done ? <GlyphCheck className="text-dv-cobalt-text" /> : <Copy strokeWidth={1.4} />}
    </IconButton>
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
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
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
    <div className="flex flex-col gap-5">
      <Panel kicker="Gerência · Acesso" title="Gerar convite" jp="招待状" tone="cobalt" cut="diag" pad="md" aria-label="Gerar convite">
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
          Cada código vale para uma única conta. Depois de usado, a pessoa entra por Continuar com usuário e senha.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {data && data.canGrant.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="dv-label text-[10px] text-dv-text-3">Papel</span>
              <div role="radiogroup" aria-label="Papel do convite" className="flex flex-wrap gap-1">
                {data.canGrant.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={role === r}
                    onClick={() => {
                      playSfx('card-select')
                      setRole(r)
                    }}
                    className={cn(
                      'dv-focus group relative inline-flex min-h-11 flex-1 items-center justify-center px-4 font-mono text-[12px] uppercase tracking-[0.18em] transition-colors',
                      role === r ? 'text-white' : 'text-dv-text-2 hover:text-dv-text',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 inset-y-1 -skew-x-[14deg] border transition-colors duration-200',
                        role === r ? 'border-dv-cobalt bg-dv-cobalt-dim shadow-[0_0_14px_-4px_var(--dv-cobalt)]' : 'border-dv-line-strong bg-dv-ink-2/80 group-hover:border-dv-text-3',
                      )}
                    />
                    <span className="relative">{ROLE_LABEL[r]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="dv-label text-[10px] text-dv-text-3">Nota (opcional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={60}
              placeholder="Para quem é este convite?"
              className="dv-focus dv-cut-diag h-12 bg-dv-ink px-3.5 font-sans text-[15px] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] outline-none placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_var(--dv-cobalt)]"
              style={{ '--dv-cut': '8px' } as CSSProperties}
            />
          </label>
          {data?.role === 'admin' && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={test}
                onChange={(e) => setTest(e.target.checked)}
                className="dv-focus peer size-5 shrink-0 cursor-pointer appearance-none border border-dv-line-strong bg-dv-ink transition-colors checked:border-dv-cobalt checked:bg-dv-cobalt"
              />
              <GlyphCheck aria-hidden="true" className="pointer-events-none -ml-8 size-5 p-0.5 text-white opacity-0 peer-checked:opacity-100" />
              <span className="flex flex-col">
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-dv-text">Conta de teste</span>
                <span className="font-sans text-[12px] text-dv-text-3">Fora de ranking, apostas e prêmios</span>
              </span>
            </label>
          )}
          <Button block loading={busy} disabled={!data} onClick={create} icon={<Plus strokeWidth={1.6} />}>
            Gerar
          </Button>
        </div>
        {fresh && (
          <div aria-live="polite" className="dv-paper-bg dv-cut-diag mt-5 flex animate-dv-pop items-center justify-between gap-3 py-3 pl-4 pr-3" style={{ '--dv-cut': '10px' } as CSSProperties}>
            <div className="min-w-0">
              <p className="dv-label text-[10px] text-dv-cobalt-deep">Novo código · uso único</p>
              <p className="mt-1 truncate font-mono text-[19px] font-medium tracking-[0.12em] text-dv-paper-ink">{fresh}</p>
            </div>
            <CopyButton code={fresh} />
          </div>
        )}
        {actionError && (
          <p role="alert" className="mt-3 font-mono text-[12px] text-dv-blood-text">
            {actionError}
          </p>
        )}
      </Panel>

      <Panel
        kicker="Gerência · Acesso"
        title="Convites emitidos"
        cut="diag"
        pad="md"
        aria-label="Convites emitidos"
        action={data ? <Badge tone="cobalt">{available} disponíveis</Badge> : undefined}
      >
        {isLoading ? (
          <p className="flex items-center gap-2 font-body text-[15px] text-dv-text-2">
            <Spinner className="size-4 text-dv-cobalt-text" /> Carregando…
          </p>
        ) : error ? (
          <p role="alert" className="font-body text-[15px] text-dv-blood-text">
            {(error as Error).message}
          </p>
        ) : !invites.length ? (
          <p className="font-body text-[15px] text-dv-text-2">Nenhum convite emitido ainda.</p>
        ) : (
          <ul className="flex flex-col">
            {invites.map((i) => (
              <InviteRow key={i.code} invite={i} showCreator={data?.role === 'admin'} onRevoke={revoke} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function InviteRow({ invite: i, showCreator, onRevoke }: { invite: Invite; showCreator: boolean; onRevoke: (code: string) => void }) {
  const used = !!i.usedAt
  return (
    <li className={cn('flex items-center gap-3 border-b border-dv-line py-3 last:border-b-0', used && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-mono text-[15px] tracking-[0.08em] text-dv-text', used && 'line-through decoration-dv-text-3')}>{i.code}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={used ? 'neutral' : 'cobalt'} dot={!used}>
            {used ? 'Usado' : 'Disponível'}
          </Badge>
          <Badge>{ROLE_LABEL[i.role]}</Badge>
          {i.isTest && (
            <span title="Fora de ranking, apostas e prêmios">
              <Badge tone="paper">Teste</Badge>
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate font-sans text-[12px] text-dv-text-3">
          {used ? `${i.usedBy ?? 'Conta criada'} · ${fmt(i.usedAt!)}` : `Criado ${fmt(i.createdAt)}`}
          {showCreator && i.createdBy ? ` · por ${i.createdBy}` : ''}
          {i.note ? ` · ${i.note}` : ''}
        </p>
      </div>
      {!used && (
        <div className="flex shrink-0 gap-1.5">
          <CopyButton code={i.code} />
          <IconButton label={`Revogar código ${i.code}`} variant="secondary" onClick={() => onRevoke(i.code)} className="[&_svg]:transition-colors hover:[&_svg]:text-dv-blood-text">
            <Trash2 strokeWidth={1.4} />
          </IconButton>
        </div>
      )}
    </li>
  )
}
