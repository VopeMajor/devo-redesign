'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { ANUNCIO_ROTULO, formatTempo, RARIDADE_ROTULO, type SalaoAvaliacao } from '@/lib/devo/salao'
import { RecButton, RecInput, RecTag } from '../system/record-ui'
import { EmptyLine, ErrorLine, Loading } from '../system/staff-ui'
import { CardFace } from '../shared/devo-card'
import { nomeCarta } from './salao-ui'

const KEY = '/api/salao?view=avaliacao'

async function get(url: string): Promise<SalaoAvaliacao> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A fila do Salão não respondeu.')
  return j
}

/** Itens esperando o especialista (para o contador da Mesa). */
export function useFilaSalao(enabled = true) {
  return useSWR<SalaoAvaliacao>(enabled ? KEY : null, get, { revalidateOnFocus: false })
}

/**
 * Mesa do Record › Salão: fila do especialista. Itens enviados à Bandeja pelo Shuffler (carta, vendedor, raridade,
 * lance mínimo pedido) e anúncios dos jogadores. Aprovar põe o lote na próxima edição com vaga; recusar devolve a
 * carta e a taxa. O servidor confere o cargo de novo em cada decisão.
 */
export function SalaoMesa() {
  const { data, error, isLoading, mutate } = useFilaSalao()
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    setErro(null)
    try {
      const r = await fetch('/api/salao', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
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
      <RecordPanel variant="paper" title="Salão das Máscaras" jp="仮面の間" ornate headerRight={<HudCode code="DV_SALAO" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Avaliação de especialista: cartas enviadas à Bandeja e anúncios dos jogadores. Aprovados entram na próxima edição com vaga; recusados voltam ao dono com a taxa.
        </p>
        {data && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">
            Raridade mínima {RARIDADE_ROTULO[data.bandeja.raridade_minima]} · vagas da próxima edição {Math.max(0, data.vagas.total - data.vagas.usadas)}/{data.vagas.total}
          </p>
        )}
        {erro && (
          <div className="mt-3">
            <ErrorLine>{erro}</ErrorLine>
          </div>
        )}
      </RecordPanel>

      {isLoading ? (
        <Loading>Abrindo a fila do Salão…</Loading>
      ) : error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : data ? (
        <>
          <RecordPanel title="Bandeja em avaliação" jp="査定" headerRight={<RecTag tone={data.lotes.length ? 'accent' : 'muted'}>{data.lotes.length}</RecTag>}>
            {data.lotes.length ? (
              <ul className="flex flex-col">
                {data.lotes.map((l) => (
                  <li key={l.id} aria-label={`Lote ${l.numero}: ${nomeCarta(l.cardId)}`} className="flex gap-3.5 border-b border-in-line py-3.5 last:border-b-0">
                    <div className="w-[68px] shrink-0">
                      <CardFace cardId={l.cardId} className="w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-3">Lote Nº {String(l.numero).padStart(3, '0')}</p>
                      <p className="mt-1 font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{nomeCarta(l.cardId)}</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">
                        {RARIDADE_ROTULO[l.raridade]} · de {l.vendedor} · mín. {formatTempo(l.lanceMinimo)}
                      </p>
                      <RecInput
                        aria-label={`Parecer do lote ${l.numero}`}
                        placeholder="Parecer (opcional)"
                        value={notas[l.id] ?? ''}
                        onChange={(e) => setNotas({ ...notas, [l.id]: e.target.value.slice(0, 240) })}
                        className="mt-2.5 h-11 text-[15px]"
                      />
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <RecButton size="sm" loading={busy === `a:${l.id}`} onClick={() => act(`a:${l.id}`, { action: 'avaliacao.lote', loteId: l.id, decisao: 'aprovar', nota: notas[l.id] })}>
                          Aprovar
                        </RecButton>
                        <RecButton size="sm" variant="secondary" loading={busy === `r:${l.id}`} onClick={() => act(`r:${l.id}`, { action: 'avaliacao.lote', loteId: l.id, decisao: 'recusar', nota: notas[l.id] })}>
                          Recusar
                        </RecButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLine title="Bandeja limpa">Nenhum item esperando avaliação.</EmptyLine>
            )}
          </RecordPanel>

          <RecordPanel title="Anúncios pendentes" jp="広告" headerRight={<RecTag tone={data.anuncios.length ? 'accent' : 'muted'}>{data.anuncios.length}</RecTag>}>
            {data.anuncios.length ? (
              <ul className="flex flex-col">
                {data.anuncios.map((a) => (
                  <li key={a.id} className="border-b border-in-line py-3.5 last:border-b-0">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-3">
                      {ANUNCIO_ROTULO[a.tipo]} · {a.autor ?? '—'}
                      {a.custo ? ` · pago ${formatTempo(a.custo)}` : ''}
                    </p>
                    <p className="mt-1 font-serif text-[18px] font-light uppercase leading-tight text-in-fg">{a.titulo}</p>
                    <p className="mt-1 font-body text-[15px] leading-relaxed text-in-fg-2">{a.texto}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <RecButton size="sm" loading={busy === `p:${a.id}`} onClick={() => act(`p:${a.id}`, { action: 'avaliacao.anuncio', id: a.id, decisao: 'publicar' })}>
                        Publicar
                      </RecButton>
                      <RecButton size="sm" variant="secondary" loading={busy === `x:${a.id}`} onClick={() => act(`x:${a.id}`, { action: 'avaliacao.anuncio', id: a.id, decisao: 'recusar' })}>
                        Recusar
                      </RecButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLine title="Mural em dia">Nenhum anúncio esperando avaliação.</EmptyLine>
            )}
          </RecordPanel>
        </>
      ) : null}
    </div>
  )
}
