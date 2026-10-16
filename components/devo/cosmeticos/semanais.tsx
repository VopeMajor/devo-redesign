'use client'

import { type CSSProperties, useState } from 'react'
import useSWR from 'swr'
import type { Cargo } from '@/lib/devo/cargos'
import { CRITERIO_LABEL, PLANO_CRITERIOS, PLANO_STATUS_LABEL, type PlanoCriterio, type PlanoSemanal, semanaRef } from '@/lib/devo/cosmeticos'
import type { PrizeInput } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecLabel } from '../system/record-ui'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, RecSelect, ResourceFields, resourceText, STAFF_KEY, staffGet, staffPost, useStaffItems } from '../system/staff-ui'
import { cosPost } from './use-cosmeticos'

type Payload = { planos: PlanoSemanal[]; semanas: { atual: string; proxima: string }; autorizacoes: { id: string; nome: string; ref: string | null }[] }

const JOGOS: [string, string][] = [
  ['geral', 'Ranking geral'],
  ['chess', 'Xadrez'],
  ['memory-rush', 'Memory Rush'],
  ['hot-bomb', 'Bomba Quente'],
  ['bluff', 'Blefe'],
]
const JOGO_LABEL = Object.fromEntries(JOGOS)

const get = async <T,>(u: string): Promise<T> => {
  const r = await fetch(u, { cache: 'no-store' })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((d as { error?: string }).error ?? 'Falha ao carregar.')
  return d as T
}

const STATUS_TONE: Record<PlanoSemanal['status'], string> = {
  sugerida: 'bg-[#0d0d0f]/10 text-in-fg',
  proposta: 'bg-in-accent-fill text-white',
  aprovada: 'bg-[#1c1c1f] text-white',
  rejeitada: 'bg-[#0d0d0f]/10 text-in-alert',
  distribuida: 'bg-[#0d0d0f]/10 text-in-fg-2',
  cancelada: 'bg-[#0d0d0f]/5 text-in-fg-3',
}

/**
 * Mesa › Semanais (texto do dono §8): recompensas semanais dos jogos — cartas, emblemas, molduras, balões,
 * fragmentos, tempo… Owner cria, edita e aprova; Anfitrião propõe e só aprova/distribui com autorização da
 * semana; Dealer sugere. A distribuição cria uma proposta 'semanal' por vencedor no fluxo da Fundação
 * (aparece em Recompensas, com registro). Itens: só os que já existem no catálogo.
 */
export function SemanaisPanel({ role }: { role: Exclude<Cargo, 'player'> }) {
  const { data, error, mutate } = useSWR<Payload>('/api/cosmeticos?view=planos', get)
  const { itens, names } = useStaffItems()
  const [novo, setNovo] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const act = async (id: string, action: string, ok: string) => {
    setBusy(id + action)
    setMsg(null)
    try {
      const r = await cosPost<{ distribuidos?: number }>({ action, id })
      setMsg({ ok: true, t: action === 'plano.distribuir' ? `Distribuído para ${r.distribuidos ?? 0} jogador(es).` : ok })
      await mutate()
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  if (error) return <ErrorLine>{(error as Error).message}</ErrorLine>
  if (!data) return <Loading>Abrindo as semanais…</Loading>
  const verbo = role === 'owner' ? 'Criar plano' : role === 'anfitriao' ? 'Propor plano' : 'Sugerir premiação'

  return (
    <section aria-label="Recompensas semanais" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Jogos da semana</p>
          <h3 className="mt-1 font-serif text-[26px] font-light uppercase leading-none tracking-[0.03em] text-in-fg">Semanais</h3>
        </div>
        <p className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-in-fg-2">
          Semana atual
          <br />
          <span className="text-in-fg">{data.semanas.atual}</span>
        </p>
      </div>
      <p className="font-body text-[14px] leading-snug text-in-fg-2">
        {role === 'owner'
          ? 'Você cria, edita e aprova. Anfitriões propõem e só distribuem com autorização da semana. Dealers sugerem.'
          : role === 'anfitriao'
            ? 'Você propõe; aprovar e distribuir exigem autorização do Owner para a semana.'
            : 'Você sugere premiações para os jogos que organiza; a aprovação é da equipe acima.'}
      </p>

      {novo ? (
        <NovoPlano
          role={role}
          semanas={data.semanas}
          itens={itens}
          onClose={() => setNovo(false)}
          onSaved={async () => {
            setNovo(false)
            await mutate()
          }}
        />
      ) : (
        <RecButton surface="paper" variant="primary" block onClick={() => setNovo(true)}>
          {verbo}
        </RecButton>
      )}
      {msg && <p role="status" className={cn('font-mono text-[11px] uppercase tracking-[0.12em]', msg.ok ? 'text-in-fg-2' : 'text-in-alert')}>{msg.t}</p>}

      {!data.planos.length ? (
        <EmptyLine title="Nenhum plano ainda">Os prêmios semanais definidos aqui são entregues aos vencedores no fim da semana.</EmptyLine>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Planos semanais">
          {data.planos.map((p) => (
            <li key={p.id}>
              <article
                aria-label={`Plano ${JOGO_LABEL[p.jogo] ?? p.jogo} · ${CRITERIO_LABEL[p.criterio]}`}
                className="dv-cut-diag relative bg-[color:var(--in-porcelain)] px-3.5 pb-3 pt-3 shadow-[inset_0_0_0_1px_var(--in-line-strong)]"
                style={{ '--dv-cut': '9px' } as CSSProperties}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">
                      {semanaRef(p.semana)} · {JOGO_LABEL[p.jogo] ?? p.jogo}
                    </p>
                    <p className="mt-0.5 font-body text-[16px] leading-snug text-in-fg">
                      {CRITERIO_LABEL[p.criterio]} → {resourceText({ recurso: p.recurso, chave: p.chave, quantidade: p.quantidade }, names)}
                    </p>
                  </div>
                  <span className={cn('shrink-0 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em]', STATUS_TONE[p.status])}>{PLANO_STATUS_LABEL[p.status]}</span>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-in-fg-3">
                  {p.propostoPorNome ? `por ${p.propostoPorNome}` : ''}
                  {p.aprovadoPorNome ? ` · aprovado por ${p.aprovadoPorNome}` : ''}
                  {p.status === 'distribuida' ? ` · ${p.distribuidos} entregue(s)` : ''}
                  {p.revisao ? ` · rev. ${p.revisao}` : ''}
                </p>
                {p.nota && <p className="mt-1 font-body text-[14px] italic text-in-fg-2">{p.nota}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {p.podeAprovar && (p.status === 'proposta' || p.status === 'sugerida') && (
                    <>
                      <RecButton surface="paper" size="sm" loading={busy === `${p.id}plano.aprovar`} onClick={() => act(p.id, 'plano.aprovar', 'Plano aprovado.')}>
                        Aprovar
                      </RecButton>
                      <RecButton surface="paper" size="sm" variant="secondary" loading={busy === `${p.id}plano.rejeitar`} onClick={() => act(p.id, 'plano.rejeitar', 'Plano rejeitado.')}>
                        Rejeitar
                      </RecButton>
                    </>
                  )}
                  {p.podeAprovar && p.status === 'aprovada' && (
                    <ConfirmButton surface="paper" size="sm" loading={busy === `${p.id}plano.distribuir`} confirmLabel="Distribuir agora" onConfirm={() => act(p.id, 'plano.distribuir', '')}>
                      Distribuir aos vencedores
                    </ConfirmButton>
                  )}
                  {p.podeEditar && p.status !== 'aprovada' && (
                    <RecButton surface="paper" size="sm" variant="ghost" loading={busy === `${p.id}plano.cancelar`} onClick={() => act(p.id, 'plano.cancelar', 'Plano cancelado.')}>
                      Cancelar
                    </RecButton>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {role === 'owner' && <Autorizacoes semanas={data.semanas} autorizacoes={data.autorizacoes} onChange={() => mutate()} />}
    </section>
  )
}

function NovoPlano({
  role,
  semanas,
  itens,
  onClose,
  onSaved,
}: {
  role: Exclude<Cargo, 'player'>
  semanas: { atual: string; proxima: string }
  itens: { key: string; kind: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [semana, setSemana] = useState(semanas.atual)
  const [jogo, setJogo] = useState('geral')
  const [criterio, setCriterio] = useState<PlanoCriterio>('top1')
  const cosmeticos = itens.filter((i) => i.kind === 'cosmetico')
  const [rec, setRec] = useState<PrizeInput>({ recurso: 'item', chave: cosmeticos[0]?.key ?? itens[0]?.key ?? null, quantidade: 1 })
  const [nota, setNota] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const salvar = async (aprovar: boolean) => {
    setBusy(true)
    setErr(null)
    try {
      await cosPost({ action: 'plano.criar', semana, jogo, criterio, recurso: rec.recurso, chave: rec.chave, quantidade: rec.quantidade, nota, aprovar })
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <article aria-label="Novo plano semanal" className="flex flex-col gap-3 bg-[color:var(--in-porcelain)] p-4 shadow-[inset_0_0_0_1px_var(--in-line-strong)]">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <RecLabel>Semana</RecLabel>
          <RecSelect value={semana} onChange={(e) => setSemana(e.target.value)}>
            <option value={semanas.atual}>Atual · {semanas.atual}</option>
            <option value={semanas.proxima}>Próxima · {semanas.proxima}</option>
          </RecSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel>Jogo</RecLabel>
          <RecSelect value={jogo} onChange={(e) => setJogo(e.target.value)}>
            {JOGOS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </RecSelect>
        </label>
        <label className="col-span-2 flex flex-col gap-1.5">
          <RecLabel>Quem recebe</RecLabel>
          <RecSelect value={criterio} onChange={(e) => setCriterio(e.target.value as PlanoCriterio)}>
            {PLANO_CRITERIOS.map((c) => (
              <option key={c} value={c}>
                {CRITERIO_LABEL[c]}
              </option>
            ))}
          </RecSelect>
        </label>
      </div>
      <ResourceFields value={rec} onChange={setRec} itens={itens} idPrefix="semanal" />
      <label className="flex flex-col gap-1.5">
        <RecLabel hint="opcional">Nota</RecLabel>
        <RecInput value={nota} maxLength={300} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: semana do torneio de xadrez" />
      </label>
      {err && <ErrorLine>{err}</ErrorLine>}
      <div className="flex flex-wrap gap-2">
        {role === 'owner' && (
          <RecButton surface="paper" loading={busy} onClick={() => salvar(true)} className="flex-1">
            Criar e aprovar
          </RecButton>
        )}
        <RecButton surface="paper" variant={role === 'owner' ? 'secondary' : 'primary'} loading={busy} onClick={() => salvar(false)} className="flex-1">
          {role === 'owner' ? 'Só criar' : role === 'anfitriao' ? 'Propor' : 'Sugerir'}
        </RecButton>
        <RecButton surface="paper" variant="ghost" onClick={onClose}>
          Fechar
        </RecButton>
      </div>
    </article>
  )
}

type Membro = { id: string; name: string; cargo: Cargo }

/** Owner: autoriza um Anfitrião a aprovar e distribuir as semanais de uma semana (staff_authorizations). */
function Autorizacoes({ semanas, autorizacoes, onChange }: { semanas: { atual: string; proxima: string }; autorizacoes: Payload['autorizacoes']; onChange: () => void }) {
  const { data } = useSWR<{ equipe: Membro[] }>(`${STAFF_KEY}?view=equipe`, staffGet)
  const anfitrioes = (data?.equipe ?? []).filter((m) => m.cargo === 'anfitriao')
  const [quem, setQuem] = useState('')
  const [semana, setSemana] = useState(semanas.atual)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const conceder = async () => {
    setBusy(true)
    setErr(null)
    try {
      await staffPost({ action: 'autorizacao.conceder', granteeId: quem || anfitrioes[0]?.id, escopo: 'recompensa.semanal', ref: semanaRef(semana) })
      onChange()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section aria-label="Autorizações semanais" className="flex flex-col gap-3 border-t border-in-line pt-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">Autorizações de Anfitrião</p>
      {autorizacoes.length ? (
        <ul className="flex flex-col gap-1">
          {autorizacoes.map((a) => (
            <li key={a.id} className="flex min-h-11 items-center justify-between gap-2 px-3 shadow-[inset_0_0_0_1px_var(--in-line)]">
              <span className="font-body text-[15px] text-in-fg">
                {a.nome} · <span className="text-in-fg-2">{a.ref ?? 'qualquer semana'}</span>
              </span>
              <RecButton
                surface="paper"
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await staffPost({ action: 'autorizacao.revogar', id: a.id }).catch(() => {})
                  onChange()
                }}
              >
                Revogar
              </RecButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-[14px] text-in-fg-2">Nenhum Anfitrião autorizado no momento.</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <RecSelect value={quem} onChange={(e) => setQuem(e.target.value)} aria-label="Anfitrião">
          {anfitrioes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </RecSelect>
        <RecSelect value={semana} onChange={(e) => setSemana(e.target.value)} aria-label="Semana autorizada">
          <option value={semanas.atual}>{semanas.atual}</option>
          <option value={semanas.proxima}>{semanas.proxima}</option>
        </RecSelect>
      </div>
      {err && <ErrorLine>{err}</ErrorLine>}
      <RecButton surface="paper" variant="secondary" disabled={!anfitrioes.length} loading={busy} onClick={conceder}>
        Autorizar para a semana
      </RecButton>
    </section>
  )
}
