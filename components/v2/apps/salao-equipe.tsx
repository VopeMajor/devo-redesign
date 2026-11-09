'use client'

import { Fragment, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { ANUNCIO_ROTULO, formatDataHora, formatTempo, type SalaoAvaliacao, type SalaoLiberado } from '@/lib/devo/salao'
import { useFilaSalao } from '@/components/devo/salao/salao-mesa'
import { erroTexto } from '../comum'
import { salvarCalendario } from './salao-calendario'
import { Cab, Carta, ed, Erro, Folha, nomeCarta, num, Ok, rotuloRar, SeloEquipe, Vazio } from './salao-pecas'

/**
 * Ações da equipe no próprio Salão (dono, 05/11: "quem for adm (anfitrião pra cima) pode aceitar cartas no próprio
 * salão de máscaras se quiser, mas só aparece essa opção pra ele"). Anfitrião e Owner veem, marcado "Equipe": a fila
 * do especialista (aceitar/recusar cartas da Bandeja com parecer, publicar/recusar anúncios — as mesmas chamadas da
 * Mesa do Record: 'avaliacao.lote' e 'avaliacao.anuncio') e o Painel da equipe (Fila, Edições, Relógio). Abrir e
 * fechar o Salão: só o Owner (o servidor só aceita dele a abertura manual do calendário). Dealer e jogadores: nada.
 */

async function postSalao(body: Record<string, unknown>) {
  const r = await fetch('/api/salao', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível concluir.')
  return j as Record<string, unknown>
}

export type Equipe = ReturnType<typeof useEquipe>

/** Fila do especialista + as decisões; cada uma devolve a frase de confirmação do protótipo. */
export function useEquipe(ativo: boolean, recarregar: () => void) {
  const fila = useFilaSalao(ativo)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const decide = async (chave: string, body: Record<string, unknown>, ok: (r: Record<string, unknown>) => string) => {
    setOcupado(chave)
    try {
      const r = await postSalao(body)
      playSfx('confirm')
      await fila.mutate()
      recarregar()
      return { nota: ok(r) }
    } catch (e) {
      playSfx('error')
      return { erro: erroTexto(e) }
    } finally {
      setOcupado(null)
    }
  }
  return {
    ativo,
    dados: ativo ? (fila.data ?? null) : null,
    erroFila: fila.error ? erroTexto(fila.error) : null,
    pendentes: ativo && fila.data ? fila.data.lotes.length + fila.data.anuncios.length : 0,
    ocupado,
    notas,
    setNota: (id: string, v: string) => setNotas((n) => ({ ...n, [id]: v.slice(0, 240) })),
    lote: (l: SalaoAvaliacao['lotes'][number], decisao: 'aprovar' | 'recusar') =>
      decide(`${decisao}:${l.id}`, { action: 'avaliacao.lote', loteId: l.id, decisao, nota: notas[l.id] }, (r) =>
        decisao === 'aprovar'
          ? typeof r.edicao === 'number'
            ? `Lote Nº ${num(l.numero)} aprovado para a Edição ${ed(r.edicao)}.`
            : `Lote Nº ${num(l.numero)} aprovado.`
          : `Lote Nº ${num(l.numero)} recusado. A carta e a taxa voltaram ao dono.`,
      ),
    anuncio: (id: string, decisao: 'publicar' | 'recusar') =>
      decide(`${decisao}:${id}`, { action: 'avaliacao.anuncio', id, decisao }, () => (decisao === 'publicar' ? 'Publicado no mural.' : 'Anúncio recusado.')),
  }
}

type Retorno = { nota?: string; erro?: string }

/** Lotes esperando o especialista (aba Bandeja e Painel › Fila). `rot` = "Aceitar" no Salão, "Aprovar" no Painel. */
export function EqLotes({ eq, onFeito, rot = 'Aceitar' }: { eq: Equipe; onFeito: (r: Retorno) => void; rot?: string }) {
  const lt = eq.dados?.lotes ?? []
  if (!lt.length) return <Vazio t="Bandeja limpa" p="Nenhum item esperando avaliação." />
  return (
    <ul className="s-ofs">
      {lt.map((l) => (
        <li key={l.id} className="s-of s-item fundo">
          <Carta cardId={l.cardId} p />
          <div className="s-info">
            <small>Lote Nº {num(l.numero)}</small>
            <strong>{nomeCarta(l.cardId)}</strong>
            <p className="r-sub">
              {rotuloRar(l.raridade)} · de {l.vendedor} · mín. {formatTempo(l.lanceMinimo)}
            </p>
            <input
              className="s-in"
              maxLength={240}
              placeholder="Parecer (opcional)"
              aria-label={`Parecer do lote ${l.numero}`}
              value={eq.notas[l.id] ?? ''}
              onChange={(e) => eq.setNota(l.id, e.target.value)}
            />
            <div className="r-acoes s-duo">
              <button type="button" className="r-bt chanfro s-forte" disabled={!!eq.ocupado} aria-busy={eq.ocupado === `aprovar:${l.id}`} onClick={async () => onFeito(await eq.lote(l, 'aprovar'))}>
                {rot}
              </button>
              <button type="button" className="r-bt chanfro" disabled={!!eq.ocupado} aria-busy={eq.ocupado === `recusar:${l.id}`} onClick={async () => onFeito(await eq.lote(l, 'recusar'))}>
                Recusar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Anúncios esperando avaliação (aba Anúncios e Painel › Fila). */
export function EqAnuncios({ eq, onFeito }: { eq: Equipe; onFeito: (r: Retorno) => void }) {
  const an = eq.dados?.anuncios ?? []
  if (!an.length) return <Vazio t="Mural em dia" p="Nenhum anúncio esperando avaliação." />
  return (
    <ul className="s-ans">
      {an.map((a) => (
        <li key={a.id} className={'s-an fundo' + (a.tipo === 'recrutamento' ? ' rec' : '')} aria-label={`${ANUNCIO_ROTULO[a.tipo]}: ${a.titulo}`}>
          <div className="s-lin">
            <span className={'s-sel ' + (a.tipo === 'recrutamento' ? 'lid' : 'seu')}>{ANUNCIO_ROTULO[a.tipo]}</span>
            <small>{a.tipo === 'recrutamento' ? a.corporacao : (a.autor ?? '—')}</small>
          </div>
          <strong>{a.titulo}</strong>
          <p>{a.texto}</p>
          <p className="r-sub">
            {a.autor ?? '—'}
            {a.custo ? ` · pago ${formatTempo(a.custo)}` : ''}
          </p>
          <div className="r-acoes s-duo">
            <button type="button" className="r-bt chanfro s-forte" disabled={!!eq.ocupado} aria-busy={eq.ocupado === `publicar:${a.id}`} onClick={async () => onFeito(await eq.anuncio(a.id, 'publicar'))}>
              Publicar
            </button>
            <button type="button" className="r-bt chanfro" disabled={!!eq.ocupado} aria-busy={eq.ocupado === `recusar:${a.id}`} onClick={async () => onFeito(await eq.anuncio(a.id, 'recusar'))}>
              Recusar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Abrir/fechar o Salão (Owner): a abertura manual do calendário ('forcar'), como no Calendário Devo. */
export function useAbertura(d: SalaoLiberado, recarregar: () => void) {
  const [ocupado, setOcupado] = useState(false)
  const define = async (forcar: 'aberto' | 'fechado' | null): Promise<Retorno> => {
    if (!d.owner) return {}
    setOcupado(true)
    try {
      await salvarCalendario({ ...d.owner.calendario, forcar })
      playSfx('confirm')
      recarregar()
      return { nota: forcar === 'aberto' ? 'Salão aberto.' : forcar === 'fechado' ? 'Salão fechado.' : 'O Salão voltou a seguir o calendário.' }
    } catch (e) {
      playSfx('error')
      return { erro: erroTexto(e) }
    } finally {
      setOcupado(false)
    }
  }
  return { pode: !!d.owner, ocupado, define }
}

/** Faixa da equipe embaixo do placar (Owner): Abrir agora / Fechar agora, com confirmação, e Seguir o calendário. */
export function EqPalco({ d, recarregar, onFeito }: { d: SalaoLiberado; recarregar: () => void; onFeito: (r: Retorno) => void }) {
  const ab = useAbertura(d, recarregar)
  const [confirma, setConfirma] = useState(false)
  if (!ab.pode) return null
  const aberto = d.relogio.aberto
  const faz = async (f: 'aberto' | 'fechado' | null) => {
    setConfirma(false)
    onFeito(await ab.define(f))
  }
  return (
    <div className="s-eqpalco">
      <SeloEquipe />
      {confirma ? (
        <>
          <span>{aberto ? 'Os lotes desta edição encerram agora.' : 'O Salão abre agora, até segunda ordem.'}</span>
          <button type="button" className="r-bt chanfro s-forte" disabled={ab.ocupado} aria-busy={ab.ocupado} onClick={() => void faz(aberto ? 'fechado' : 'aberto')}>
            {aberto ? 'Fechar agora' : 'Abrir agora'}
          </button>
          <button type="button" className="r-link" onClick={() => setConfirma(false)}>
            Voltar
          </button>
        </>
      ) : (
        <>
          <button type="button" className="r-bt chanfro" disabled={ab.ocupado} onClick={() => setConfirma(true)}>
            {aberto ? 'Fechar agora' : 'Abrir agora'}
          </button>
          {d.relogio.forcado && (
            <button type="button" className="r-link" disabled={ab.ocupado} onClick={() => void faz(null)}>
              Seguir o calendário
            </button>
          )}
        </>
      )}
    </div>
  )
}

type Sub = 'fila' | 'edicoes' | 'relogio'

/** Painel da equipe (protótipo: janela própria "Painel da equipe"; aqui, folha sobre o Salão). */
export function EquipeFolha({ jan, d, eq, recarregar, onCalendario, onVolta }: { jan: Element | null; d: SalaoLiberado; eq: Equipe; recarregar: () => void; onCalendario: () => void; onVolta: () => void }) {
  const [sub, setSub] = useState<Sub>('fila')
  const [msg, setMsg] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const ab = useAbertura(d, recarregar)
  const [confirma, setConfirma] = useState(false)
  const feito = (r: Retorno) => {
    setMsg(r.nota ?? null)
    setErro(r.erro ?? null)
  }
  const r = d.relogio
  const iv = r.proxima.inicio - r.corrente.inicio
  const inicioDe = (e: number) => r.corrente.inicio + (e - r.corrente.n) * iv
  const lt = [...d.proximos].sort((a, b) => (a.edicao ?? 0) - (b.edicao ?? 0) || a.numero - b.numero)
  const eds = [...new Set(lt.map((l) => l.edicao ?? 0))]
  const livres = eq.dados ? Math.max(0, eq.dados.vagas.total - eq.dados.vagas.usadas) : Math.max(0, d.vagas.total - d.vagas.usadas)

  return (
    <Folha jan={jan} sub="Salão das Máscaras" tit="Painel da equipe" onVolta={onVolta}>
      <div className="r-abas" role="tablist" aria-label="Painel da equipe">
        {(
          [
            ['fila', 'Fila', eq.pendentes],
            ['edicoes', 'Edições', 0],
            ['relogio', 'Relógio', 0],
          ] as const
        ).map(([id, t, c]) => (
          <button
            key={id}
            type="button"
            className="chanfro"
            role="tab"
            aria-selected={sub === id}
            onClick={() => {
              playSfx('click')
              setSub(id)
              setMsg(null)
              setErro(null)
            }}
          >
            {t}
            {c ? (
              <>
                {' '}
                <b>{c}</b>
              </>
            ) : null}
          </button>
        ))}
      </div>
      <div className="s-painel" role="tabpanel">
        <Ok>{msg}</Ok>
        <Erro>{erro}</Erro>
        {sub === 'fila' ? (
          <>
            <p className="r-sub">
              Raridade mínima {rotuloRar(d.bandeja.raridade_minima)} · vagas da próxima edição {livres}/{d.vagas.total}
            </p>
            <Erro>{eq.erroFila}</Erro>
            <Cab t="Bandeja em avaliação" s={String(eq.dados?.lotes.length ?? 0)} />
            <EqLotes eq={eq} onFeito={feito} rot="Aprovar" />
            <Cab t="Anúncios pendentes" s={String(eq.dados?.anuncios.length ?? 0)} />
            <EqAnuncios eq={eq} onFeito={feito} />
          </>
        ) : sub === 'edicoes' ? (
          lt.length ? (
            eds.map((e) => (
              <Fragment key={e}>
                <Cab t={`Edição ${ed(e)}`} s={formatDataHora(inicioDe(e))} />
                <ul className="s-ofs">
                  {lt
                    .filter((l) => (l.edicao ?? 0) === e)
                    .map((l) => (
                      <li key={l.id} className="s-of s-item fundo">
                        <Carta cardId={l.cardId} p />
                        <div className="s-info">
                          <small>Lote Nº {num(l.numero)}</small>
                          <strong>{nomeCarta(l.cardId)}</strong>
                          <p className="r-sub">
                            de {l.meu ? 'você' : l.vendedor} · mín. {formatTempo(l.lanceMinimo)}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              </Fragment>
            ))
          ) : (
            <Vazio t="Nenhum lote aguardando" p="Os lotes aprovados aparecem aqui até a edição deles abrir." />
          )
        ) : (
          <>
            <dl className="s-dl">
              <div>
                <dt>Estado</dt>
                <dd>{r.aberto ? `Aberto · Edição ${ed(r.corrente.n)}` : 'Fechado'}</dd>
              </div>
              {r.aberto && (
                <div>
                  <dt>Fecha</dt>
                  <dd>{r.fechaEm ? formatDataHora(r.fechaEm) : 'Até segunda ordem'}</dd>
                </div>
              )}
              <div>
                <dt>Próxima abertura</dt>
                <dd>{formatDataHora(r.proxima.inicio)}</dd>
              </div>
            </dl>
            {ab.pode &&
              (confirma ? (
                <>
                  <p>{r.aberto ? 'Os lotes desta edição encerram agora: com lance, vão para quem lidera; sem lance, voltam ao vendedor.' : 'O Salão abre agora, até segunda ordem.'}</p>
                  <div className="r-acoes s-duo">
                    <button
                      type="button"
                      className="r-bt chanfro s-forte"
                      disabled={ab.ocupado}
                      aria-busy={ab.ocupado}
                      onClick={async () => {
                        setConfirma(false)
                        feito(await ab.define(r.aberto ? 'fechado' : 'aberto'))
                      }}
                    >
                      {r.aberto ? 'Fechar agora' : 'Abrir agora'}
                    </button>
                    <button type="button" className="r-bt chanfro" onClick={() => setConfirma(false)}>
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className={'r-bt chanfro s-larga' + (r.aberto ? '' : ' s-forte')} disabled={ab.ocupado} onClick={() => setConfirma(true)}>
                    {r.aberto ? 'Fechar agora' : 'Abrir agora'}
                  </button>
                  {r.forcado && (
                    <button type="button" className="r-link" disabled={ab.ocupado} onClick={async () => feito(await ab.define(null))}>
                      Seguir o calendário
                    </button>
                  )}
                </>
              ))}
            <button type="button" className="r-link" onClick={onCalendario}>
              Calendário completo
            </button>
          </>
        )}
      </div>
    </Folha>
  )
}
