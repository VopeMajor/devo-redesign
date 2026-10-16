'use client'

import { Copy, Plus, Trash2 } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import useSWR from 'swr'
import { GlyphCheck, IconButton, RecordPanel, Spinner } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import type { PlayerRole } from '@/lib/devo/deadly-votes'
import type { Invite, InvitesPayload } from '@/lib/devo/invites-server'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecLabel, RecTag } from './record-ui'

const KEY = '/api/invites'
const ROLE_LABEL: Record<PlayerRole, string> = { player: 'Jogador', dealer: 'Dealer', anfitriao: 'Anfitrião', owner: 'Owner' }

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
      {done ? <GlyphCheck className="text-dv-amethyst-text" /> : <Copy strokeWidth={1.4} />}
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
  // Jogador: cota de convites (começa em 1, não renova; mais convites só como recompensa).
  const quota = data?.role === 'player' ? (data.quota ?? 0) : null

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel title="Gerar convite" jp="招待状" chamfer>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Cada código vale para uma única conta. Depois de usado, a pessoa entra por Continuar com usuário e senha.
        </p>
        {quota !== null && (
          <div className="mt-4 flex items-center gap-4 border-y border-in-line py-3">
            <p className="font-impact text-[40px] font-semibold leading-none text-in-fg dv-tabular" aria-hidden="true">
              {quota}
            </p>
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-in-fg-2">{quota === 1 ? 'Convite disponível' : 'Convites disponíveis'}</p>
              <p className="mt-1 font-sans text-[13px] leading-snug text-in-fg-3">
                {quota > 0 ? 'A cota não se renova. Revogar um código ainda não usado devolve o convite.' : 'Sua cota acabou. Novos convites só chegam como recompensa.'}
              </p>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-4">
          {data && data.canGrant.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <RecLabel>Papel</RecLabel>
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
                      'dv-focus dv-cut-diag group relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-4 font-sans text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200',
                      role === r ? 'bg-[linear-gradient(180deg,#f7f6f3,#e3e1dc)] text-[#0c0c0e] shadow-[inset_0_0_0_1px_#bab09f,0_0_16px_-6px_rgba(138,124,200,0.8)]' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] hover:text-in-fg',
                    )}
                    style={{ '--dv-cut': '7px' } as CSSProperties}
                  >
                    {role === r && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
                    <span className="relative">{ROLE_LABEL[r]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex min-w-0 flex-col gap-1.5">
            <RecLabel hint="opcional">Nota</RecLabel>
            <RecInput value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} placeholder="Para quem é este convite?" />
          </label>
          {data?.role === 'owner' && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={test}
                onChange={(e) => setTest(e.target.checked)}
                className="dv-focus peer size-5 shrink-0 cursor-pointer appearance-none border border-in-line-strong bg-transparent transition-colors checked:border-[#ece5d8] checked:bg-[#f1f0ee]"
              />
              <GlyphCheck aria-hidden="true" className="pointer-events-none -ml-8 size-5 p-0.5 text-[#0c0c0e] opacity-0 peer-checked:opacity-100" />
              <span className="flex flex-col">
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-in-fg">Conta de teste</span>
                <span className="font-sans text-[12px] text-in-fg-3">Fora de ranking, apostas e prêmios</span>
              </span>
            </label>
          )}
          <RecButton block loading={busy} disabled={!data || quota === 0} onClick={create} icon={<Plus strokeWidth={1.4} />} aria-label={quota !== null ? `Gerar convite (${quota} disponível)` : undefined}>
            Gerar
          </RecButton>
        </div>
        {fresh && (
          <div aria-live="polite" className="dv-porcelain dv-cut-diag mt-5 flex animate-dv-pop items-center justify-between gap-3 py-3 pl-4 pr-3" style={{ '--dv-cut': '10px' } as CSSProperties}>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#58585e]">Novo código · uso único</p>
              <p className="mt-1 truncate font-mono text-[19px] font-medium tracking-[0.12em] text-[#0d0d0f]">{fresh}</p>
            </div>
            <CopyButton code={fresh} />
          </div>
        )}
        {actionError && (
          <p role="alert" className="mt-3 font-mono text-[12px] text-in-alert">
            {actionError}
          </p>
        )}
      </RecordPanel>

      <RecordPanel title="Convites emitidos" headerRight={data ? <RecTag tone="accent" dot>{available} disponíveis</RecTag> : undefined}>
        {isLoading ? (
          <p className="flex items-center gap-2 font-body text-[15px] text-in-fg-2">
            <Spinner className="size-4" /> Carregando…
          </p>
        ) : error ? (
          <p role="alert" className="font-body text-[15px] text-in-alert">
            {(error as Error).message}
          </p>
        ) : !invites.length ? (
          <p className="font-body text-[15px] text-in-fg-2">Nenhum convite emitido ainda.</p>
        ) : (
          <ul className="flex flex-col">
            {invites.map((i) => (
              <InviteRow key={i.code} invite={i} showCreator={data?.role === 'owner'} onRevoke={revoke} />
            ))}
          </ul>
        )}
      </RecordPanel>
    </div>
  )
}

function InviteRow({ invite: i, showCreator, onRevoke }: { invite: Invite; showCreator: boolean; onRevoke: (code: string) => void }) {
  const used = !!i.usedAt
  return (
    <li className={cn('flex items-center gap-3 border-b border-in-line py-3 last:border-b-0', used && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-mono text-[15px] tracking-[0.08em] text-in-fg', used && 'line-through decoration-in-fg-3')}>{i.code}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <RecTag tone={used ? 'muted' : 'accent'} dot={!used}>
            {used ? 'Usado' : 'Disponível'}
          </RecTag>
          <RecTag>{ROLE_LABEL[i.role]}</RecTag>
          {i.isTest && (
            <span title="Fora de ranking, apostas e prêmios">
              <RecTag tone="solid">Teste</RecTag>
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate font-sans text-[12px] text-in-fg-3">
          {used ? `${i.usedBy ?? 'Conta criada'} · ${fmt(i.usedAt!)}` : `Criado ${fmt(i.createdAt)}`}
          {showCreator && i.createdBy ? ` · por ${i.createdBy}` : ''}
          {i.note ? ` · ${i.note}` : ''}
        </p>
      </div>
      {!used && (
        <div className="flex shrink-0 gap-1.5">
          <CopyButton code={i.code} />
          <IconButton label={`Revogar código ${i.code}`} variant="secondary" onClick={() => onRevoke(i.code)} className="[&_svg]:transition-colors hover:[&_svg]:text-in-alert">
            <Trash2 strokeWidth={1.4} />
          </IconButton>
        </div>
      )}
    </li>
  )
}
