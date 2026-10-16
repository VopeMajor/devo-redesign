'use client'

import { Search } from 'lucide-react'
import { type CSSProperties, useMemo, useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel, Reveal } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { type Cargo, CARGO_LABEL } from '@/lib/devo/cargos'
import { UNLOCK_FLAGS, UNLOCK_LABEL, type UnlockFlag } from '@/lib/devo/progresso'
import type { EquipeMembro, JogadorLinha, PlayerSummary } from '@/lib/devo/permissoes-server'
import { cn } from '@/lib/utils'
import { useStaffBoard } from './dealer-board'
import { RecButton, RecInput, RecLabel, RecTag } from './record-ui'
import { ConfirmButton, DataRow, EmptyLine, ErrorLine, Loading, RecSelect, STAFF_KEY, staffGet, staffPost } from './staff-ui'

const EQUIPE_KEY = `${STAFF_KEY}?view=equipe`

/* ───────────────────────────── Equipe ───────────────────────────── */

/**
 * Equipe. Owner: Anfitriões com os Dealers de cada um, transferência de Dealer entre Anfitriões (o histórico das
 * propostas antigas fica com o supervisor original) e mudança de cargo. Anfitrião: os próprios Dealers, com os
 * casos de cada um e a opção de devolver o Dealer a Jogador.
 */
export function TeamPanel({ role }: { role: Cargo }) {
  const { data, error, isLoading, mutate } = useSWR<{ equipe: EquipeMembro[] }>(EQUIPE_KEY, staffGet)
  const { data: board } = useStaffBoard()
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const equipe = data?.equipe ?? []
  const owner = role === 'owner'
  const anfitrioes = equipe.filter((m) => m.cargo === 'anfitriao')
  const supervisores = equipe.filter((m) => m.cargo === 'anfitriao' || m.cargo === 'owner')
  const dealers = equipe.filter((m) => m.cargo === 'dealer')
  const casosDe = (id: string) => (board?.votes ?? []).filter((v) => v.creatorId === id)

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    setErr(null)
    try {
      await staffPost(body)
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  // Owner: agrupa os Dealers por supervisor (Anfitriões primeiro; Dealers sob Owner por último).
  const grupos = owner
    ? [
        ...anfitrioes.map((a) => ({ sup: a, dealers: dealers.filter((d) => d.supervisorId === a.id) })),
        ...supervisores
          .filter((s) => s.cargo === 'owner')
          .map((o) => ({ sup: o, dealers: dealers.filter((d) => d.supervisorId === o.id) }))
          .filter((g) => g.dealers.length),
      ]
    : [{ sup: null as EquipeMembro | null, dealers }]

  return (
    <RecordPanel variant="paper" title="Equipe" jp="組" ornate headerRight={<HudCode code="DV_STAFF" />}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        {owner
          ? 'Cargos e vínculos. Transferir um Dealer muda o supervisor daqui em diante; as propostas antigas guardam quem supervisionava na época.'
          : 'Os Dealers sob sua supervisão e os casos de cada um. Para trazer alguém novo, gere um convite de Dealer ou promova um Jogador em Jogadores.'}
      </p>
      {err && (
        <div className="mt-3">
          <ErrorLine>{err}</ErrorLine>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-4">
        {isLoading ? (
          <Loading>Reunindo a equipe…</Loading>
        ) : error ? (
          <ErrorLine>{(error as Error).message}</ErrorLine>
        ) : !dealers.length && !anfitrioes.length ? (
          <EmptyLine title="Nenhum Dealer ainda">Gere um convite de Dealer na seção Convites. Ele nasce sob a sua supervisão.</EmptyLine>
        ) : (
          grupos.map((g, gi) => (
            <section key={g.sup?.id ?? gi} aria-label={g.sup ? `Supervisão de ${g.sup.name}` : 'Seus Dealers'} className="flex flex-col">
              {g.sup && (
                <div className="flex items-center justify-between gap-2 bg-[#1c1c1f] px-3 py-2.5 text-white">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[19px] font-light uppercase leading-tight tracking-[0.04em]">{g.sup.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                      {CARGO_LABEL[g.sup.cargo]} · {g.dealers.length} Dealer{g.dealers.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              )}
              <ul className="flex flex-col">
                {!g.dealers.length && <li className="px-3 py-3 font-sans text-[14px] text-in-fg-3">Sem Dealers.</li>}
                {g.dealers.map((d) => {
                  const casos = casosDe(d.id)
                  const abertos = casos.filter((c) => c.status === 'convocado' || c.status === 'em-progresso').length
                  return (
                    <li key={d.id} className="flex flex-col gap-2 border-b border-in-line bg-[color:var(--in-porcelain)] px-3 py-3 shadow-[inset_1px_0_0_var(--in-line-strong),inset_-1px_0_0_var(--in-line-strong)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-sans text-[16px] font-medium text-in-fg">{d.name}</p>
                          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">
                            Dealer{d.since ? ` · desde ${new Date(d.since).toLocaleDateString('pt-BR')}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <RecTag>{casos.length} casos</RecTag>
                          {abertos > 0 && (
                            <RecTag tone="accent" dot>
                              {abertos} abertos
                            </RecTag>
                          )}
                        </div>
                      </div>
                      {owner ? (
                        <TransferRow dealer={d} supervisores={supervisores} busy={busy} onAct={act} />
                      ) : (
                        <ConfirmButton
                          size="sm"
                          variant="secondary"
                          confirmLabel={`Devolver ${d.name} a Jogador`}
                          loading={busy === `c-${d.id}`}
                          onConfirm={() => act(`c-${d.id}`, { action: 'cargo.definir', playerId: d.id, cargo: 'player' })}
                        >
                          Devolver a Jogador
                        </ConfirmButton>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </RecordPanel>
  )
}

function TransferRow({
  dealer,
  supervisores,
  busy,
  onAct,
}: {
  dealer: EquipeMembro
  supervisores: EquipeMembro[]
  busy: string | null
  onAct: (k: string, b: Record<string, unknown>) => Promise<void>
}) {
  const [to, setTo] = useState('')
  const options = supervisores.filter((s) => s.id !== dealer.supervisorId)
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (to) onAct(`t-${dealer.id}`, { action: 'dealer.transferir', dealerId: dealer.id, supervisorId: to })
      }}
    >
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <RecLabel>Transferir para</RecLabel>
        <RecSelect value={to} onChange={(e) => setTo(e.target.value)} aria-label={`Transferir ${dealer.name} para`}>
          <option value="">Escolha o Anfitrião</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.cargo === 'owner' ? ' (Owner)' : ''}
            </option>
          ))}
        </RecSelect>
      </label>
      <RecButton surface="paper" size="sm" type="submit" disabled={!to} loading={busy === `t-${dealer.id}`} className="shrink-0">
        Transferir
      </RecButton>
    </form>
  )
}

/** Mudança de cargo (Owner: qualquer cargo; Dealer exige supervisor). */
function CargoMenu({
  pessoa,
  supervisores,
  busy,
  onAct,
  owner,
}: {
  pessoa: { id: string; name: string; cargo: Cargo }
  supervisores: EquipeMembro[]
  busy: string | null
  onAct: (k: string, b: Record<string, unknown>) => Promise<void>
  owner: boolean
}) {
  const [open, setOpen] = useState(false)
  const [cargo, setCargo] = useState<Cargo>(pessoa.cargo)
  const [sup, setSup] = useState('')
  const cargos: Cargo[] = owner ? ['player', 'dealer', 'anfitriao', 'owner'] : pessoa.cargo === 'player' ? ['player', 'dealer'] : ['dealer', 'player']
  if (!open) {
    return (
      <RecButton surface="paper" variant="secondary" size="sm" onClick={() => setOpen(true)} className="self-start">
        Mudar cargo
      </RecButton>
    )
  }
  return (
    <Reveal variant="rise" className="flex w-full flex-col gap-2 bg-in-fg/[0.03] p-3 shadow-[inset_0_0_0_1px_var(--in-line)]">
      <label className="flex flex-col gap-1">
        <RecLabel>Novo cargo de {pessoa.name}</RecLabel>
        <RecSelect value={cargo} onChange={(e) => setCargo(e.target.value as Cargo)}>
          {cargos.map((c) => (
            <option key={c} value={c}>
              {CARGO_LABEL[c]}
            </option>
          ))}
        </RecSelect>
      </label>
      {owner && cargo === 'dealer' && (
        <label className="flex flex-col gap-1">
          <RecLabel>Supervisor</RecLabel>
          <RecSelect value={sup} onChange={(e) => setSup(e.target.value)}>
            <option value="">Eu mesmo</option>
            {supervisores
              .filter((s) => s.cargo === 'anfitriao')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </RecSelect>
        </label>
      )}
      <div className="flex gap-2">
        <RecButton
          surface="paper"
          size="sm"
          className="flex-1"
          disabled={cargo === pessoa.cargo}
          loading={busy === `c-${pessoa.id}`}
          onClick={async () => {
            await onAct(`c-${pessoa.id}`, { action: 'cargo.definir', playerId: pessoa.id, cargo, supervisorId: sup || undefined })
            setOpen(false)
          }}
        >
          Salvar cargo
        </RecButton>
        <RecButton surface="paper" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Fechar
        </RecButton>
      </div>
    </Reveal>
  )
}

/* ───────────────────────────── Jogadores ───────────────────────────── */

/**
 * Jogadores: busca e resumo (cartas, nível arcano, fragmentos, P.P., participação) — sem senha nem dados
 * privados. Owner vê o completo e libera/tranca sistemas por jogador (override de desbloqueio).
 */
export function PlayersPanel({ role }: { role: Cargo }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const { data, error, isLoading } = useSWR<{ jogadores: JogadorLinha[] }>(`${STAFF_KEY}?view=jogadores&q=${encodeURIComponent(q.trim())}`, staffGet, { keepPreviousData: true })
  const jogadores = data?.jogadores ?? []
  return (
    <RecordPanel variant="paper" title="Jogadores" jp="記録" ornate headerRight={<HudCode code="DV_PLAYERS" />}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
        {role === 'owner' ? 'Resumo, participação e desbloqueios manuais por jogador.' : 'Dados resumidos de cada jogador: cartas, arcano, fragmentos, pontos de potencial e participação.'}
      </p>
      <span className="relative mt-4 block">
        <RecInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo nome" aria-label="Buscar jogador" className="pr-10" />
        <Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-in-fg-3" strokeWidth={1.4} />
      </span>
      <div className="mt-3">
        {isLoading && !data ? (
          <Loading>Buscando…</Loading>
        ) : error ? (
          <ErrorLine>{(error as Error).message}</ErrorLine>
        ) : !jogadores.length ? (
          <EmptyLine title="Ninguém com esse nome" />
        ) : (
          <ul className="flex flex-col">
            {jogadores.map((j) => (
              <li key={j.id} className="border-b border-in-line last:border-b-0">
                <button
                  type="button"
                  aria-expanded={sel === j.id}
                  onClick={() => setSel((s) => (s === j.id ? null : j.id))}
                  className={cn('dv-focus flex min-h-12 w-full items-center gap-2 px-1 text-left hover:bg-in-fg/[0.04]', sel === j.id && 'bg-in-fg/[0.05]')}
                >
                  <span aria-hidden="true" className={cn('size-1.5 shrink-0 rotate-45', sel === j.id ? 'bg-dv-amethyst' : 'bg-in-fg-3')} />
                  <span className="min-w-0 flex-1 truncate font-sans text-[16px] text-in-fg">{j.name}</span>
                  {j.cargo !== 'player' && <RecTag tone={j.cargo === 'owner' ? 'solid' : 'line'}>{CARGO_LABEL[j.cargo]}</RecTag>}
                  {j.isTest && <RecTag tone="muted">Teste</RecTag>}
                  <span className="w-12 shrink-0 text-right font-mono text-[10.5px] uppercase tracking-[0.1em] text-in-fg-3">{j.deadlyVotes} DV</span>
                </button>
                {sel === j.id && <PlayerDetail id={j.id} role={role} row={j} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </RecordPanel>
  )
}

function PlayerDetail({ id, role, row }: { id: string; role: Cargo; row: JogadorLinha }) {
  const owner = role === 'owner'
  const key = `${STAFF_KEY}?view=jogador&id=${id}${owner ? '&nivel=completo' : ''}`
  const { data, error, isLoading, mutate } = useSWR<PlayerSummary>(key, staffGet)
  const { data: equipe } = useSWR<{ equipe: EquipeMembro[] }>(EQUIPE_KEY, staffGet)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const flags = useMemo(() => new Set(data?.completo?.desbloqueios ?? []), [data])
  const act = async (k: string, body: Record<string, unknown>) => {
    setBusy(k)
    setErr(null)
    try {
      await staffPost(body)
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  if (isLoading) return <div className="px-2 pb-3"><Loading>Abrindo a ficha…</Loading></div>
  if (error || !data) return <div className="px-2 pb-3"><ErrorLine>{(error as Error)?.message ?? 'Falha ao abrir a ficha.'}</ErrorLine></div>
  const dv = data.deadlyVotes
  const staffSeesAll = data.cargo === 'owner' || data.cargo === 'anfitriao'
  return (
    <div className="animate-dv-rise flex flex-col gap-3 px-2 pb-4 pt-1">
      <dl className="grid grid-cols-2 gap-x-5 bg-[color:var(--in-porcelain)] px-3 py-1 shadow-[inset_0_0_0_1px_var(--in-line)]">
        <DataRow label="Cartas" value={data.cartas} />
        <DataRow label="Fragmentos" value={data.fragmentos} />
        <DataRow label="Arcano" value={data.arcano ?? '—'} hint={data.arcano ? undefined : 'sem registro'} />
        <DataRow label="P.P." value={data.pontosPotencial ?? '—'} hint={data.pontosPotencial === null ? 'sem registro' : undefined} />
      </dl>
      <div className="flex flex-col gap-1.5">
        <RecLabel>Participação em Deadly Votes</RecLabel>
        <div className="flex items-center gap-3 font-sans text-[14px] text-in-fg-2">
          <span><b className="font-impact text-[20px] text-in-fg dv-tabular">{dv.total}</b> casos</span>
          <span><b className="font-impact text-[20px] text-in-fg dv-tabular">{dv.sobreviveu}</b> sobreviveu</span>
          <span><b className={cn('font-impact text-[20px] dv-tabular', dv.eliminado ? 'text-in-alert' : 'text-in-fg')}>{dv.eliminado}</b> eliminado</span>
        </div>
      </div>
      {owner && data.completo && (
        <div className="flex flex-col gap-1.5">
          <RecLabel hint={staffSeesAll ? 'equipe vê tudo liberado' : 'override manual'}>Sistemas desbloqueados</RecLabel>
          <ul className="flex flex-col">
            {UNLOCK_FLAGS.map((f: UnlockFlag) => {
              const on = staffSeesAll || flags.has(f)
              return (
                <li key={f} className="flex min-h-11 items-center justify-between gap-2 border-b border-dashed border-in-line last:border-b-0">
                  <span className={cn('font-sans text-[14px]', on ? 'text-in-fg' : 'text-in-fg-3')}>{UNLOCK_LABEL[f]}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${UNLOCK_LABEL[f]} para ${row.name}`}
                    disabled={busy !== null || staffSeesAll}
                    onClick={() => act(`f-${f}`, { action: 'desbloqueio.definir', playerId: id, flag: f, on: !on })}
                    className={cn(
                      'dv-focus dv-cut-diag inline-flex min-h-9 min-w-24 items-center justify-center gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] disabled:opacity-50',
                      on ? 'bg-[#1c1c1f] text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]',
                    )}
                    style={{ '--dv-cut': '6px' } as CSSProperties}
                  >
                    <span aria-hidden="true" className={cn('size-1.5 rotate-45', on ? 'bg-dv-amethyst' : 'shadow-[inset_0_0_0_1px_currentColor]')} />
                    {busy === `f-${f}` ? '…' : on ? 'Liberado' : 'Trancado'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {(owner || (role === 'anfitriao' && data.cargo === 'player')) && (
        <CargoMenu
          pessoa={{ id, name: row.name, cargo: data.cargo }}
          supervisores={equipe?.equipe ?? []}
          busy={busy}
          onAct={act}
          owner={owner}
        />
      )}
      {err && <ErrorLine>{err}</ErrorLine>}
    </div>
  )
}

/* ───────────────────────────── Registro ───────────────────────────── */

type LogLinha = { id: string; at: number; actor: string | null; action: string; target: string | null; ref: string | null; data: unknown }

const LOG_FILTROS = [
  ['', 'Tudo'],
  ['recompensa', 'Recompensas'],
  ['cargo', 'Cargos'],
  ['dealer', 'Vínculos'],
  ['desbloqueio', 'Desbloqueios'],
  ['deadly_vote', 'Deadly Votes'],
  ['config', 'Configuração'],
] as const

const ACTION_LABEL: Record<string, string> = {
  'recompensa.entregue': 'Recompensa entregue',
  'cargo.alterado': 'Cargo alterado',
  'dealer.supervisor': 'Dealer transferido',
  'desbloqueio.liberado': 'Sistema liberado',
  'desbloqueio.revogado': 'Sistema trancado',
  'deadly_vote.resultado': 'Resultado aplicado',
  'config.alterada': 'Configuração alterada',
  'karma.ajustado': 'Karma ajustado',
  'item.conceder': 'Item concedido',
  'item.retirar': 'Item retirado',
  'autorizacao.concedida': 'Autorização concedida',
  'autorizacao.revogada': 'Autorização revogada',
  'catalogo.item': 'Catálogo editado',
  'cosmetico.item': 'Cosmético editado',
  'cosmetico.asset': 'Asset enviado',
  'cosmetico.concedido': 'Cosmético concedido',
  'cosmetico.revogado': 'Cosmético revogado',
}

/** Registro administrativo (Owner): toda concessão, mudança de cargo, vínculo, override e configuração. */
export function AdminLogPanel() {
  const [filtro, setFiltro] = useState('')
  const { data, error, isLoading } = useSWR<{ log: LogLinha[] }>(`${STAFF_KEY}?view=log&limit=80${filtro ? `&acao=${filtro}` : ''}`, staffGet, { keepPreviousData: true })
  return (
    <RecordPanel variant="paper" title="Registro" jp="記録簿" ornate headerRight={<HudCode code="DV_ADMIN_LOG" />}>
      <div role="radiogroup" aria-label="Filtrar registro" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {LOG_FILTROS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={filtro === v}
            onClick={() => setFiltro(v)}
            className={cn(
              'dv-focus dv-cut-diag inline-flex min-h-11 shrink-0 items-center px-3 font-mono text-[10px] uppercase tracking-[0.12em]',
              filtro === v ? 'bg-[#1c1c1f] text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]',
            )}
            style={{ '--dv-cut': '6px' } as CSSProperties}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {isLoading && !data ? (
          <Loading>Abrindo o registro…</Loading>
        ) : error ? (
          <ErrorLine>{(error as Error).message}</ErrorLine>
        ) : !data?.log.length ? (
          <EmptyLine title="Registro vazio" />
        ) : (
          <ol className="relative flex flex-col pl-5">
            <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-in-line-strong" />
            {data.log.map((l) => (
              <li key={l.id} className="relative flex flex-col gap-0.5 border-b border-in-line py-2.5 last:border-b-0">
                <span aria-hidden="true" className={cn('absolute -left-[18.5px] top-[17px] size-2 rotate-45', l.action.startsWith('recompensa') ? 'bg-in-gold' : l.action.startsWith('desbloqueio') ? 'bg-dv-amethyst' : 'bg-in-fg-2')} />
                <p className="font-sans text-[14px] font-medium text-in-fg">{ACTION_LABEL[l.action] ?? l.action}</p>
                <p className="font-sans text-[13px] text-in-fg-2">
                  {l.actor ?? 'Sistema'}
                  {l.target ? ` → ${l.target}` : ''}
                  {logDetail(l)}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">{new Date(l.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </RecordPanel>
  )
}

function logDetail(l: LogLinha) {
  const d = (l.data ?? {}) as Record<string, unknown>
  if (l.action === 'cargo.alterado') return ` · ${CARGO_LABEL[d.de as Cargo] ?? d.de} → ${CARGO_LABEL[d.para as Cargo] ?? d.para}`
  if (l.action === 'recompensa.entregue') return ` · ${d.quantity ?? ''} ${d.key ?? d.resource ?? ''} · ${d.origin ?? ''}`
  if (l.action.startsWith('desbloqueio')) return ` · ${UNLOCK_LABEL[d.flag as UnlockFlag] ?? d.flag}`
  if (l.action === 'deadly_vote.resultado') return ` · ${d.participantes ?? 0} participantes, ${d.entregues ?? 0} entregas`
  if (l.action === 'config.alterada') return ` · ${l.ref}`
  return ''
}

/* ───────────────────────────── Configuração ───────────────────────────── */

type ConfigLinha = { key: string; value: unknown; provisional: boolean; note: string | null; updated_at: number }

const POCO_CATEGORIAS = ['lixo', 'capsula', 'fragmento', 'essencia', 'cosmetico'] as const
const CATEGORIA_LABEL: Record<(typeof POCO_CATEGORIAS)[number], string> = { lixo: 'Lixo', capsula: 'Cápsula', fragmento: 'Fragmento', essencia: 'Essência', cosmetico: 'Cosmético' }
const MOEDA_LABEL: Record<string, string> = { dracma_comum: 'Dracma Comum', dracma_incomum: 'Dracma Incomum', dracma_rara: 'Dracma Rara' }

/**
 * Configuração (Owner). Probabilidades do Poço como tabela de pesos por moeda (com a % resultante), marcadas
 * PROVISÓRIO até o dono definir; demais chaves em JSON.
 */
export function ConfigPanel() {
  const { data, error, isLoading, mutate } = useSWR<{ config: ConfigLinha[] }>(`${STAFF_KEY}?view=config`, staffGet)
  return (
    <RecordPanel variant="paper" title="Ajustes da casa" jp="設定" ornate headerRight={<HudCode code="DV_CONFIG" />}>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">Valores marcados como provisórios ainda esperam a definição final do dono. Toda mudança vai para o registro.</p>
      <div className="mt-4 flex flex-col gap-5">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorLine>{(error as Error).message}</ErrorLine>
        ) : (
          [...(data?.config ?? [])].sort((a, b) => Number(b.key === 'poco.probabilidades') - Number(a.key === 'poco.probabilidades')).map((c) => (c.key === 'poco.probabilidades' ? <PocoOdds key={c.key} c={c} onSaved={() => mutate()} /> : <JsonConfig key={c.key} c={c} onSaved={() => mutate()} />))
        )}
      </div>
    </RecordPanel>
  )
}

function ProvisionalTag({ on }: { on: boolean }) {
  return on ? (
    <RecTag tone="accent" dot>
      Provisório
    </RecTag>
  ) : (
    <RecTag tone="muted">Definido</RecTag>
  )
}

function PocoOdds({ c, onSaved }: { c: ConfigLinha; onSaved: () => void }) {
  const initial = (c.value ?? {}) as Record<string, Record<string, number>>
  const [v, setV] = useState(initial)
  const [prov, setProv] = useState(c.provisional)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const moedas = Object.keys(v)
  const dirty = JSON.stringify(v) !== JSON.stringify(initial) || prov !== c.provisional
  return (
    <section aria-label="Probabilidades do Poço" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-serif text-[20px] font-light uppercase leading-tight tracking-[0.04em] text-in-fg">Poço dos Milagres</p>
        <ProvisionalTag on={c.provisional} />
      </div>
      <p className="font-sans text-[13px] text-in-fg-2">{c.note ?? 'Pesos relativos por moeda.'}</p>
      {moedas.map((m) => {
        const total = POCO_CATEGORIAS.reduce((s, k) => s + Math.max(0, Number(v[m]?.[k] ?? 0)), 0) || 1
        return (
          <div key={m} className="bg-[color:var(--in-porcelain)] p-3 shadow-[inset_0_0_0_1px_var(--in-line)]">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-2">{MOEDA_LABEL[m] ?? m}</p>
            <div aria-hidden="true" className="mt-2 flex h-2 overflow-hidden">
              {POCO_CATEGORIAS.map((k, i) => (
                <span key={k} style={{ width: `${(Math.max(0, Number(v[m]?.[k] ?? 0)) / total) * 100}%` }} className={cn('h-full', ['bg-in-fg-3', 'bg-in-gold', 'bg-dv-amethyst', 'bg-in-fg-2', 'bg-[#1c1c1f]'][i])} />
              ))}
            </div>
            <ul className="mt-2 flex flex-col">
              {POCO_CATEGORIAS.map((k) => (
                <li key={k} className="flex min-h-11 items-center gap-3 border-b border-dashed border-in-line last:border-b-0">
                  <span className="min-w-0 flex-1 font-sans text-[14px] text-in-fg">{CATEGORIA_LABEL[k]}</span>
                  <span className="w-12 text-right font-mono text-[11px] text-in-fg-3 dv-tabular">{Math.round((Math.max(0, Number(v[m]?.[k] ?? 0)) / total) * 100)}%</span>
                  <input
                    inputMode="numeric"
                    aria-label={`Peso de ${CATEGORIA_LABEL[k]} em ${MOEDA_LABEL[m] ?? m}`}
                    value={String(v[m]?.[k] ?? 0)}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/\D/g, '').slice(0, 4) || 0)
                      setV((x) => ({ ...x, [m]: { ...x[m], [k]: n } }))
                    }}
                    className="dv-focus h-10 w-16 border-b-2 border-in-line-strong bg-in-fg/[0.035] px-2 text-right font-mono text-[15px] text-in-fg outline-none focus:border-in-fg dv-tabular"
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={prov} onChange={(e) => setProv(e.target.checked)} className="dv-focus size-5 shrink-0 cursor-pointer accent-[#1c1c1f]" />
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-in-fg">Ainda provisório</span>
      </label>
      {err && <ErrorLine>{err}</ErrorLine>}
      <RecButton
        surface="paper"
        block
        disabled={!dirty}
        loading={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          try {
            await staffPost({ action: 'config.definir', key: c.key, value: v, provisional: prov })
            playSfx('confirm')
            onSaved()
          } catch (e) {
            setErr((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        Salvar probabilidades
      </RecButton>
    </section>
  )
}

function JsonConfig({ c, onSaved }: { c: ConfigLinha; onSaved: () => void }) {
  const [txt, setTxt] = useState(JSON.stringify(c.value))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  let parsed: unknown
  let ok = true
  try {
    parsed = JSON.parse(txt)
  } catch {
    ok = false
  }
  return (
    <section aria-label={c.key} className="flex flex-col gap-2 border-t border-in-line pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-[12px] uppercase tracking-[0.12em] text-in-fg">{c.key}</p>
        <ProvisionalTag on={c.provisional} />
      </div>
      {c.note && <p className="font-sans text-[13px] text-in-fg-2">{c.note}</p>}
      <form
        className="flex items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!ok) return
          setBusy(true)
          setErr(null)
          try {
            await staffPost({ action: 'config.definir', key: c.key, value: parsed, provisional: c.provisional })
            playSfx('confirm')
            onSaved()
          } catch (x) {
            setErr((x as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <RecInput value={txt} onChange={(e) => setTxt(e.target.value)} aria-label={`Valor de ${c.key}`} aria-invalid={!ok || undefined} className="font-mono text-[14px]" />
        </div>
        <RecButton surface="paper" size="sm" type="submit" disabled={!ok || txt === JSON.stringify(c.value)} loading={busy} className="shrink-0">
          Salvar
        </RecButton>
      </form>
      {err && <ErrorLine>{err}</ErrorLine>}
    </section>
  )
}
