'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { CLASSIFICACAO_ROTULO, type CorpMesa, formatMin } from '@/lib/devo/corporacoes'
import { RecButton, RecInput, RecTag } from '../system/record-ui'
import { EmptyLine, ErrorLine, Loading } from '../system/staff-ui'
import { BrasaoCorp } from './brasao'

const KEY = '/api/corporacoes?view=mesa'

async function get(url: string): Promise<CorpMesa> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A fila das Corporações não respondeu.')
  return j
}

/** Fundações esperando a avaliação administrativa (para o contador da Mesa). */
export function useFilaCorporacoes(enabled = true) {
  return useSWR<CorpMesa>(enabled ? KEY : null, get, { revalidateOnFocus: false })
}

/**
 * Mesa do Record › Corporações (Owner/Anfitrião): avaliação administrativa das fundações (requisitos do perfil no
 * momento do pedido, custo pago) e o status legal das Corporações ativas (oficial ↔ Necro-Corporação; escopo
 * global provisório). O servidor confere o cargo de novo em cada decisão.
 */
export function CorporacoesMesa() {
  const { data, error, isLoading, mutate } = useFilaCorporacoes()
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    setErro(null)
    try {
      const r = await fetch('/api/corporacoes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível concluir.')
      playSfx('confirm')
      await mutate()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Corporações" jp="結社" ornate headerRight={<HudCode code="DV_CORP" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Avaliação administrativa da Companhia: aprovar gera o código de identificação e faz do fundador o líder; recusar devolve o Tempo pago. Abaixo, o status legal das Corporações ativas.
        </p>
        {data?.provisorio && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">Custos e requisitos provisórios · Ajustes › corporacoes.*</p>}
        {erro && (
          <div className="mt-3">
            <ErrorLine>{erro}</ErrorLine>
          </div>
        )}
      </RecordPanel>

      {isLoading ? (
        <Loading>Abrindo a fila da Companhia…</Loading>
      ) : error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : data ? (
        <>
          <RecordPanel title="Fundações em análise" jp="審査" headerRight={<RecTag tone={data.pendentes.length ? 'accent' : 'muted'}>{data.pendentes.length}</RecTag>}>
            {data.pendentes.length ? (
              <ul className="flex flex-col">
                {data.pendentes.map((c) => (
                  <li key={c.id} aria-label={`Fundação: ${c.nome}`} className="flex gap-3.5 border-b border-in-line py-3.5 last:border-b-0">
                    <BrasaoCorp brasao={c.brasao} className="h-[76px] w-[62px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-3">Fundador · {c.fundador}</p>
                      <p className="mt-1 break-words font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{c.nome}</p>
                      {c.lema && <p className="mt-0.5 font-body text-[14px] italic text-in-fg-2">“{c.lema}”</p>}
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">Pago {formatMin(c.custo)}</p>
                      <ul aria-label="Requisitos no pedido" className="mt-2 flex flex-wrap gap-1.5">
                        {c.requisitos.map((r) => (
                          <li key={r.id}>
                            <RecTag tone={r.ok ? 'line' : 'accent'}>
                              {r.ok ? '✓' : '✗'} {r.rotulo} {r.atual}/{r.exigido}
                            </RecTag>
                          </li>
                        ))}
                      </ul>
                      <RecInput
                        aria-label={`Parecer da fundação ${c.nome}`}
                        placeholder="Parecer (opcional)"
                        value={notas[c.id] ?? ''}
                        onChange={(e) => setNotas({ ...notas, [c.id]: e.target.value.slice(0, 240) })}
                        className="mt-2.5 h-11 text-[15px]"
                      />
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <RecButton size="sm" loading={busy === `a:${c.id}`} onClick={() => act(`a:${c.id}`, { action: 'mesa.fundacao', id: c.id, decisao: 'aprovar', nota: notas[c.id] })}>
                          Aprovar fundação
                        </RecButton>
                        <RecButton size="sm" variant="secondary" loading={busy === `r:${c.id}`} onClick={() => act(`r:${c.id}`, { action: 'mesa.fundacao', id: c.id, decisao: 'recusar', nota: notas[c.id] })}>
                          Recusar
                        </RecButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLine title="Fila vazia">Nenhuma fundação esperando avaliação.</EmptyLine>
            )}
          </RecordPanel>

          <RecordPanel title="Status legal" jp="法的地位" headerRight={<RecTag tone="muted">{data.ativas.length}</RecTag>}>
            {data.ativas.length ? (
              <ul className="flex flex-col">
                {data.ativas.map((c) => {
                  const necro = c.classificacao === 'necro'
                  return (
                    <li key={c.id} aria-label={`Corporação ${c.nome}`} className="flex gap-3.5 border-b border-in-line py-3.5 last:border-b-0">
                      <BrasaoCorp brasao={c.brasao} necro={necro} className="h-[64px] w-[52px] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RecTag tone={necro ? 'accent' : 'line'} dot={necro}>
                            {CLASSIFICACAO_ROTULO[c.classificacao]}
                          </RecTag>
                          {c.escopo === 'global' && <RecTag tone="muted">Global · provisório</RecTag>}
                        </div>
                        <p className="mt-1.5 break-words font-serif text-[18px] font-light uppercase leading-tight text-in-fg">{c.nome}</p>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">
                          {c.codigo} · {c.membros} membros · líder {c.lider ?? '—'}
                        </p>
                        {c.classificacaoNota && <p className="mt-1 font-body text-[14px] text-in-fg-2">{c.classificacaoNota}</p>}
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <RecButton
                            size="sm"
                            variant={necro ? 'secondary' : 'danger'}
                            loading={busy === `c:${c.id}`}
                            onClick={() => act(`c:${c.id}`, { action: 'mesa.classificar', id: c.id, classificacao: necro ? 'oficial' : 'necro' })}
                          >
                            {necro ? 'Reconhecer como oficial' : 'Classificar como Necro'}
                          </RecButton>
                          <RecButton
                            size="sm"
                            variant="ghost"
                            loading={busy === `e:${c.id}`}
                            onClick={() => act(`e:${c.id}`, { action: 'mesa.escopo', id: c.id, escopo: c.escopo === 'global' ? 'local' : 'global' })}
                          >
                            {c.escopo === 'global' ? 'Marcar como local' : 'Marcar como global'}
                          </RecButton>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyLine title="Nenhuma Corporação ativa">As Corporações aprovadas aparecem aqui.</EmptyLine>
            )}
          </RecordPanel>
        </>
      ) : null}
    </div>
  )
}
