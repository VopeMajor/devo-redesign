'use client'

import { useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { ANUNCIO_ROTULO, atendeRaridade, formatTempo, RARIDADE_ROTULO, repasse, SALAO_MAX_MIN, type SalaoLiberado, type SalaoLote } from '@/lib/devo/salao'
import { CardFace } from '@/components/devo/shared/devo-card'
import { useDevo } from '@/components/devo/state/devo-store'
import { erroTexto } from '../comum'
import { type Agir, Campo, Carta, Erro, Folha, nomeCarta, num, Rar } from './salao-pecas'

/**
 * Folhas do Salão (protótipo kit3/os-salao.js: lance, enviar e novoAnuncio) com as ações do jogo: 'lance',
 * 'bandeja.enviar', 'mercado.vender' e 'anuncio.criar' em /api/salao. O servidor tira o Tempo e a carta; aqui só
 * mostramos (o `agir` de useSalao aplica o Tempo e remove a carta do inventário local).
 */

/* ---------------------------------------------------------------- dar lance */

export function LanceFolha({ jan, l, reserva, agir, onFim, onVolta }: { jan: Element | null; l: SalaoLote; reserva: number; agir: Agir; onFim: (nota: string) => void; onVolta: () => void }) {
  const [valor, setValor] = useState(l.proximoLance)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const confirmar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'lance', loteId: l.id, valor })
      playSfx('confirm')
      onFim(`Lance de ${formatTempo(valor)} aceito no lote Nº ${num(l.numero)}.`)
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
      setOcupado(false)
    }
  }
  return (
    <Folha jan={jan} sub={`Lote Nº ${num(l.numero)}`} tit="Dar lance" onVolta={onVolta}>
      <div className="s-corpo">
        <p className="r-sub">O valor sai do seu pulso agora. Se alguém cobrir o seu lance, ele volta para você.</p>
        <div className="s-res">
          <Carta cardId={l.cardId} />
          <div className="s-info">
            <strong>{nomeCarta(l.cardId)}</strong>
            <p className="s-de">
              <Rar r={l.raridade} />
            </p>
            <p className="r-sub">de {l.vendedor}</p>
          </div>
        </div>
        <dl className="s-dl">
          <div>
            <dt>{l.maiorLance ? 'Maior lance' : 'Lance mínimo'}</dt>
            <dd>{formatTempo(l.maiorLance ?? l.lanceMinimo)}</dd>
          </div>
          <div>
            <dt>Incremento</dt>
            <dd>{formatTempo(l.incremento)}</dd>
          </div>
          {l.lidero && l.maiorLance ? (
            <div>
              <dt>Você paga agora</dt>
              <dd>{formatTempo(Math.max(0, valor - l.maiorLance))}</dd>
            </div>
          ) : null}
        </dl>
        <Campo
          id="s-val"
          rot="Seu lance"
          valor={valor}
          onChange={setValor}
          min={l.proximoLance}
          max={SALAO_MAX_MIN}
          passo={l.incremento}
          dica={`Seu pulso precisa manter pelo menos ${formatTempo(reserva)} depois do lance.`}
        />
        <Erro>{erro}</Erro>
        <button type="button" className="r-bt chanfro s-forte s-larga" disabled={ocupado} aria-busy={ocupado} onClick={confirmar}>
          Confirmar lance
        </button>
      </div>
    </Folha>
  )
}

/* ---------------------------------------------------------------- enviar à Bandeja / vender no Mercado */

export function EnviarFolha({ jan, modo, d, agir, onVolta }: { jan: Element | null; modo: 'bandeja' | 'mercado'; d: SalaoLiberado; agir: Agir; onVolta: () => void }) {
  const { state } = useDevo()
  const band = modo === 'bandeja'
  const minima = d.bandeja.raridade_minima
  const cartas = useMemo(
    () =>
      [...state.inventory].sort((a, b) => {
        const ra = RARITY_META[getCard(a.cardId).rarity].order
        const rb = RARITY_META[getCard(b.cardId).rarity].order
        return rb - ra || a.cardId.localeCompare(b.cardId)
      }),
    [state.inventory],
  )
  const [uid, setUid] = useState<string | null>(null)
  const [valor, setValor] = useState(band ? d.bandeja.lance_minimo : 60)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  const escolhida = cartas.find((c) => c.uid === uid) ?? null
  const minValor = band ? d.bandeja.lance_minimo : 1
  const comissao = d.contrato.comissaoPct

  const enviar = async () => {
    if (!escolhida) return
    setOcupado(true)
    setErro(null)
    try {
      if (band) await agir({ action: 'bandeja.enviar', uid: escolhida.uid, lanceMinimo: valor })
      else await agir({ action: 'mercado.vender', uid: escolhida.uid, preco: valor })
      playSfx('confirm')
      setFeito(nomeCarta(escolhida.cardId))
      setUid(null)
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Folha jan={jan} sub={band ? 'Shuffler · Salão das Máscaras' : 'Mercado do Salão'} tit={band ? 'Enviar à Bandeja' : 'Vender no Mercado'} onVolta={onVolta}>
      <div className="s-corpo">
        {feito ? (
          <div className="s-feito" role="status">
            <i aria-hidden="true" />
            <strong>{feito}</strong>
            <p className="r-sub">{band ? 'Na Bandeja, em avaliação de especialista. Acompanhe na aba Bandeja do Salão.' : 'À venda no Mercado do Salão.'}</p>
            <button type="button" className="r-bt chanfro" onClick={onVolta}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="r-sub">
              {band
                ? `A carta sai do seu inventário e espera a avaliação de um especialista. Raridade mínima: ${RARIDADE_ROTULO[minima]}.`
                : 'A carta sai do seu inventário e fica à venda por um preço fixo em Tempo. As compras acontecem durante a abertura.'}
            </p>
            {cartas.length ? (
              <ul className="i-cartas s-esc" aria-label="Suas cartas">
                {cartas.map((c) => {
                  const card = getCard(c.cardId)
                  const ok = !band || atendeRaridade(card.rarity, minima)
                  const sel = c.uid === uid
                  return (
                    <li key={c.uid}>
                      <button
                        type="button"
                        disabled={!ok}
                        aria-pressed={sel}
                        aria-label={ok ? `Escolher ${card.name}` : `${card.name}: abaixo da raridade mínima`}
                        onClick={() => {
                          playSfx('card-select')
                          setUid(sel ? null : c.uid)
                          setErro(null)
                        }}
                      >
                        <CardFace cardId={c.cardId} className="w-full" />
                        {!ok && <span>Mínimo {RARIDADE_ROTULO[minima]}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>Você não tem cartas no inventário.</p>
            )}
            <div id="s-esc">
              {escolhida && (
                <>
                  <strong className="s-nome">{nomeCarta(escolhida.cardId)}</strong>
                  <Campo id="s-val" rot={band ? 'Lance mínimo' : 'Preço'} valor={valor} onChange={setValor} min={minValor} max={SALAO_MAX_MIN} passo={band ? d.bandeja.incremento : 10} />
                  <dl className="s-dl">
                    <div>
                      <dt>Contrato</dt>
                      <dd>{d.contrato.nome}</dd>
                    </div>
                    {band && (
                      <div>
                        <dt>Taxa de divulgação</dt>
                        <dd>{formatTempo(d.contrato.divulgacao)} · paga agora</dd>
                      </div>
                    )}
                    <div>
                      <dt>Comissão na venda</dt>
                      <dd>{comissao}%</dd>
                    </div>
                    <div>
                      <dt>{band ? 'Você recebe no lance mínimo' : 'Você recebe'}</dt>
                      <dd>{formatTempo(repasse(valor, comissao))}</dd>
                    </div>
                  </dl>
                  {band && <p className="r-sub">Se o especialista recusar, a carta e a taxa voltam para você.</p>}
                  <button type="button" className="r-bt chanfro s-forte s-larga" disabled={ocupado} aria-busy={ocupado} onClick={enviar}>
                    {band ? 'Enviar à Bandeja' : 'Pôr à venda'}
                  </button>
                </>
              )}
            </div>
            <Erro>{erro}</Erro>
          </>
        )}
      </div>
    </Folha>
  )
}

/* ---------------------------------------------------------------- novo anúncio */

export function AnuncioFolha({ jan, custo, agir, onFim, onVolta }: { jan: Element | null; custo: number; agir: Agir; onFim: () => void; onVolta: () => void }) {
  const [tipo, setTipo] = useState<'proposta' | 'propaganda'>('proposta')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const enviar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await agir({ action: 'anuncio.criar', tipo, titulo, texto })
      playSfx('confirm')
      onFim()
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
      setOcupado(false)
    }
  }
  return (
    <Folha jan={jan} sub="Salão das Máscaras" tit="Novo anúncio" onVolta={onVolta}>
      <div className="s-corpo">
        <p className="r-sub">A casa avalia antes de publicar no mural.</p>
        <div className="s-tipos" role="radiogroup" aria-label="Tipo de anúncio">
          {(['proposta', 'propaganda'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="chanfro"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => {
                playSfx('click')
                setTipo(t)
              }}
            >
              <strong>{ANUNCIO_ROTULO[t]}</strong>
              <small>{t === 'proposta' ? 'Sem custo inicial' : formatTempo(custo)}</small>
            </button>
          ))}
        </div>
        <label className="s-rot" htmlFor="s-tit">
          Título
        </label>
        <input className="s-in" id="s-tit" maxLength={80} placeholder="Compro cartas lendárias" value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, 80))} />
        <label className="s-rot" htmlFor="s-txt">
          Texto
        </label>
        <textarea className="s-in" id="s-txt" maxLength={600} rows={4} placeholder="O que você oferece ou procura." value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 600))} />
        <Erro>{erro}</Erro>
        <button
          type="button"
          className="r-bt chanfro s-forte s-larga"
          disabled={ocupado || titulo.trim().length < 3 || texto.trim().length < 3}
          aria-busy={ocupado}
          onClick={enviar}
        >
          {tipo === 'propaganda' ? `Enviar · ${formatTempo(custo)}` : 'Enviar proposta'}
        </button>
      </div>
    </Folha>
  )
}
