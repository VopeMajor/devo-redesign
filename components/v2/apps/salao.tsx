'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { ANUNCIO_ROTULO, formatDataHora, formatTempo, RARIDADE_ROTULO, type SalaoAnuncio, type SalaoLiberado, type SalaoLote, type SalaoOferta } from '@/lib/devo/salao'
import { AVISO_ANUNCIAR } from '@/lib/devo/salao-herdeiro'
import { salaoPost, useSalao } from '@/components/devo/salao/salao-dados'
import { callName, useDevo } from '@/components/devo/state/devo-store'
import { usePlayerText } from '@/components/devo/state/player-text'
import { useEu } from '@/components/devo/state/use-acesso'
import { erroTexto, px } from '../comum'
import { CalendarioFolha } from './salao-calendario'
import { EqAnuncios, EqLotes, EqPalco, EquipeFolha, useEquipe } from './salao-equipe'
import { AnuncioFolha, EnviarFolha, LanceFolha } from './salao-folhas'
import { HerdeiroCena } from './salao-herdeiro'
import { type Agir, Cab, Carta, ed, Erro, nomeCarta, num, Numero, Ok, parado, Rar, SeloEquipe, useJanela, Vazio } from './salao-pecas'

/**
 * Salão das Máscaras no v2 (protótipo kit3/os-salao.js, aprovado: "salão está ok"; Herdeiro de corpo inteiro com a
 * cabeça menor). O palco em pixel (aceso aberto, às escuras fechado) com o número enorme até a próxima abertura ou até
 * o fim da edição, o Calendário Devo e o Herdeiro; as abas Leilões, Mercado, Anúncios e Bandeja; as folhas de lance,
 * envio pelo Shuffler, venda no Mercado e novo anúncio; e, só para Anfitrião e Owner, as ações da equipe marcadas
 * "Equipe" e o Painel da equipe. Dados e ações são os do jogo (/api/salao via useSalao, que aplica o Tempo creditado e
 * resgata as cartas entregues); trancado até o servidor liberar.
 */

type Aba = 'leiloes' | 'mercado' | 'anuncios' | 'bandeja'
type FolhaAberta = { t: 'lance'; id: string } | { t: 'enviar'; modo: 'bandeja' | 'mercado' } | { t: 'anuncio' } | { t: 'calendario'; volta?: 'equipe' } | { t: 'equipe' }

const cen = (aberto: boolean) => `/v2/art/os/salao/${aberto ? 'aberto' : 'fechado'}.png`

export function SalaoV2() {
  const { state } = useDevo()
  const { data, error, isLoading, mutate, agir } = useSalao()
  const { ref, jan } = useJanela<HTMLDivElement>()
  const recarregar = useCallback(() => void mutate(), [mutate])
  const [cena, setCena] = useState<'auto' | 'aberta' | 'fechada'>('auto')
  const mostrarCena = !!data && data.liberado && (cena === 'aberta' || (cena === 'auto' && !data.apresentado))
  useEffect(() => {
    if (mostrarCena && cena === 'auto') setCena('aberta')
  }, [mostrarCena, cena])

  return (
    <div id="sal" ref={ref}>
      {!data ? (
        <div className="abre">
          {error ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={px('salao')} alt="" />
              <p role="alert">{erroTexto(error, 'O Salão não respondeu.')}</p>
              <button type="button" className="r-bt chanfro" onClick={() => void mutate()}>
                Tentar de novo
              </button>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={px('salao')} alt="" />
              <h3>Salão das Máscaras</h3>
              <p role="status">{isLoading ? 'Abrindo as cortinas…' : ''}</p>
            </>
          )}
        </div>
      ) : !data.liberado ? (
        <div className="abre">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('cadeado')} alt="" />
          <h3>Trancado</h3>
          <p>{data.motivo}</p>
        </div>
      ) : (
        <Tela d={data} agir={agir} recarregar={recarregar} jan={jan} onHerdeiro={() => setCena('aberta')} />
      )}
      {mostrarCena && data?.liberado && (
        <HerdeiroCena
          jan={jan}
          relogio={data.relogio}
          genero={state.profile?.gender}
          nome={callName(state) || null}
          podePular={data.podePular}
          onFim={() => {
            setCena('fechada')
            void salaoPost({ action: 'apresentacao.concluir' })
              .catch(() => null)
              .then(() => mutate())
          }}
        />
      )}
    </div>
  )
}

function Tela({ d, agir, recarregar, jan, onHerdeiro }: { d: SalaoLiberado; agir: Agir; recarregar: () => void; jan: Element | null; onHerdeiro: () => void }) {
  const cargo = useEu().data?.cargo
  // só Anfitrião e Owner veem as ações da equipe no Salão (Dealer avalia pela Mesa do Record)
  const equipe = d.especialista && (cargo === 'anfitriao' || cargo === 'owner')
  const eq = useEquipe(equipe, recarregar)
  const [aba, setAba] = useState<Aba>('leiloes')
  const [folha, setFolha] = useState<FolhaAberta | null>(null)
  const [nota, setNota] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const abasRef = useRef<HTMLDivElement>(null)
  const r = d.relogio

  const feito = (x: { nota?: string; erro?: string }) => {
    setNota(x.nota ?? null)
    setErro(x.erro ?? null)
  }
  const act = async (chave: string, body: Record<string, unknown>, ok: string) => {
    setOcupado(chave)
    setErro(null)
    setNota(null)
    try {
      await agir(body)
      playSfx('confirm')
      setNota(ok)
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    } finally {
      setOcupado(null)
    }
  }
  const vaiAba = (a: Aba) => {
    playSfx('click')
    setAba(a)
    setNota(null)
    setErro(null)
    const t = abasRef.current
    const corpo = t?.closest('.corpo')
    if (t && corpo && corpo.scrollTop > t.offsetTop) corpo.scrollTop = t.offsetTop
  }

  const pendBandeja = d.meusLotes.filter((l) => l.status === 'avaliacao').length
  const loteLance = folha?.t === 'lance' ? d.leiloes.find((l) => l.id === folha.id) : null
  const avisos = (
    <>
      <Ok>{nota}</Ok>
      <Erro>{erro}</Erro>
    </>
  )

  return (
    <>
      <div className="s-grade">
        <div className="s-esq">
          <Palco
            d={d}
            equipe={equipe}
            recarregar={recarregar}
            onCalendario={() => setFolha({ t: 'calendario' })}
            onHerdeiro={() => {
              playSfx('open')
              onHerdeiro()
            }}
            onFeito={(x) => {
              feito(x)
              if (x.nota) setAba('leiloes')
            }}
          />
        </div>
        <div className="s-dir">
          <div className="r-abas" role="tablist" aria-label="Seções do Salão" ref={abasRef}>
            {(
              [
                ['leiloes', 'Leilões', r.aberto ? d.leiloes.length : 0],
                ['mercado', 'Mercado', 0],
                ['anuncios', 'Anúncios', 0],
                ['bandeja', 'Bandeja', pendBandeja],
              ] as const
            ).map(([id, n, c]) => (
              <button key={id} type="button" className="chanfro" role="tab" aria-selected={aba === id} onClick={() => vaiAba(id)}>
                {n}
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
            {aba === 'leiloes' && <Leiloes d={d} avisos={avisos} onLance={(l) => setFolha({ t: 'lance', id: l.id })} />}
            {aba === 'mercado' && (
              <Mercado
                d={d}
                avisos={avisos}
                ocupado={ocupado}
                onVender={() => setFolha({ t: 'enviar', modo: 'mercado' })}
                onComprar={(o) => void act(o.id, { action: 'mercado.comprar', ofertaId: o.id }, `${nomeCarta(o.cardId)} foi para o seu inventário.`)}
                onRetirar={(o) => void act(o.id, { action: 'mercado.retirar', ofertaId: o.id }, 'A carta voltou para o seu inventário.')}
              />
            )}
            {aba === 'anuncios' && (
              <Anuncios
                d={d}
                avisos={avisos}
                ocupado={ocupado}
                equipe={
                  equipe && eq.dados?.anuncios.length ? (
                    <EqSecao t="Para publicar" n={eq.dados.anuncios.length}>
                      <EqAnuncios eq={eq} onFeito={feito} />
                    </EqSecao>
                  ) : null
                }
                onNovo={() => setFolha({ t: 'anuncio' })}
                onRetirar={(a) => void act(a.id, { action: 'anuncio.retirar', id: a.id }, 'Anúncio retirado.')}
              />
            )}
            {aba === 'bandeja' && (
              <Bandeja
                d={d}
                avisos={avisos}
                ocupado={ocupado}
                equipe={
                  equipe ? (
                    <EqSecao t="Para avaliar" n={eq.dados?.lotes.length ?? 0}>
                      <Erro>{eq.erroFila}</Erro>
                      <EqLotes eq={eq} onFeito={feito} />
                    </EqSecao>
                  ) : null
                }
                onEnviar={() => setFolha({ t: 'enviar', modo: 'bandeja' })}
                onRetirar={(l) => void act(l.id, { action: 'bandeja.retirar', loteId: l.id }, 'A carta e a taxa voltaram para você.')}
                onAvisoLido={() => void salaoPost({ action: 'aviso.lido' }).catch(() => null).then(recarregar)}
              />
            )}
          </div>
        </div>
      </div>
      {equipe && (
        <button type="button" className="s-equipe chanfro" onClick={() => setFolha({ t: 'equipe' })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('mesa')} alt="" />
          <span>Painel da equipe</span>
          {eq.pendentes ? <b>{eq.pendentes}</b> : null}
        </button>
      )}

      {folha?.t === 'lance' && loteLance && (
        <LanceFolha
          jan={jan}
          l={loteLance}
          reserva={d.bandeja.reserva_min}
          agir={agir}
          onVolta={() => setFolha(null)}
          onFim={(n) => {
            setFolha(null)
            feito({ nota: n })
          }}
        />
      )}
      {folha?.t === 'enviar' && <EnviarFolha jan={jan} modo={folha.modo} d={d} agir={agir} onVolta={() => setFolha(null)} />}
      {folha?.t === 'anuncio' && (
        <AnuncioFolha
          jan={jan}
          custo={d.custoPropaganda}
          agir={agir}
          onVolta={() => setFolha(null)}
          onFim={() => {
            setFolha(null)
            setAba('anuncios')
            feito({ nota: 'Enviado. A casa avalia antes de publicar no mural.' })
          }}
        />
      )}
      {folha?.t === 'calendario' && (
        <CalendarioFolha jan={jan} d={d} agir={agir} recarregar={recarregar} onVolta={() => setFolha(folha.volta === 'equipe' ? { t: 'equipe' } : null)} />
      )}
      {folha?.t === 'equipe' && equipe && (
        <EquipeFolha jan={jan} d={d} eq={eq} recarregar={recarregar} onCalendario={() => setFolha({ t: 'calendario', volta: 'equipe' })} onVolta={() => setFolha(null)} />
      )}
    </>
  )
}

function EqSecao({ t, n, children }: { t: string; n: number; children: ReactNode }) {
  return (
    <section className="s-eqsec">
      <Cab
        t={t}
        s={
          <>
            {n} · <SeloEquipe />
          </>
        }
      />
      {children}
    </section>
  )
}

/* ---------------------------------------------------------------- o palco e o número enorme */

function Palco({
  d,
  equipe,
  recarregar,
  onCalendario,
  onHerdeiro,
  onFeito,
}: {
  d: SalaoLiberado
  equipe: boolean
  recarregar: () => void
  onCalendario: () => void
  onHerdeiro: () => void
  onFeito: (x: { nota?: string; erro?: string }) => void
}) {
  const r = d.relogio
  const alvo = r.aberto ? r.fechaEm : r.proxima.inicio
  // virou (abriu ou fechou) com a tela aberta: a cena antiga some em degraus por cima da nova
  const antes = useRef(r.aberto)
  const [velha, setVelha] = useState<string | null>(null)
  useEffect(() => {
    if (antes.current === r.aberto) return
    if (!parado()) setVelha(cen(antes.current))
    antes.current = r.aberto
  }, [r.aberto])
  // chegou a hora: pede o estado novo ao servidor (ele liquida a edição e abre a próxima)
  useEffect(() => {
    if (!alvo) return
    const ms = alvo - Date.now()
    if (ms < 0 || ms > 2_000_000_000) return
    const t = window.setTimeout(recarregar, ms + 1500)
    return () => window.clearTimeout(t)
  }, [alvo, recarregar])
  const ev = d.eventos.find((e) => e.fim > d.agora && e.inicio - d.agora < 16 * 86_400_000)

  return (
    <div className={'s-palco' + (r.aberto ? ' on' : '')}>
      <div className="s-vista">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="s-cen"
          src={cen(r.aberto)}
          alt={r.aberto ? 'O palco aceso, com o púlpito do leiloeiro e as cortinas abertas' : 'O palco às escuras, com as cortinas fechadas'}
        />
        {velha && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="s-cen s-velha" src={velha} alt="" onAnimationEnd={() => setVelha(null)} />
        )}
        <button
          type="button"
          className="s-bt chanfro"
          onClick={() => {
            onCalendario()
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('calendario')} alt="" />
          Calendário Devo
        </button>
        <button type="button" className="k-mel chanfro s-her" aria-label="Rever a apresentação do Herdeiro" onClick={onHerdeiro}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/v2/art/os/npc/herdeiro-neutro.png" alt="" />
          <span>Herdeiro</span>
        </button>
      </div>
      <section className="s-placar" aria-label={r.aberto ? 'Salão aberto: tempo até o fim da edição' : 'Contagem até a próxima abertura'}>
        <p className="s-selo">
          {r.aberto ? `Aberto · Edição ${ed(r.corrente.n)}` : 'Fechado'}
          {r.forcado && (equipe || d.owner) ? (
            <>
              {' '}
              <small>manual</small>
            </>
          ) : null}
        </p>
        <p className="s-lab">{r.aberto ? (r.fechaEm ? 'A edição fecha em' : 'Aberto até segunda ordem') : 'Próxima abertura em'}</p>
        <Numero alvo={alvo} aberto={r.aberto} id="s-num" />
        <p className="s-qdo">{r.aberto ? (r.fechaEm ? `Fecha ${formatDataHora(r.fechaEm)}` : 'Abertura extraordinária') : `Abre ${formatDataHora(r.proxima.inicio)} · Brasília`}</p>
      </section>
      <EqPalco d={d} recarregar={recarregar} onFeito={onFeito} />
      {ev && (
        <p className="p-faixa s-breve">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('salao')} alt="" />
          <span>Em breve · {ev.titulo}</span>
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Leilões */

function Lote({ l, aberto, onLance }: { l: SalaoLote; aberto: boolean; onLance?: () => void }) {
  const nome = nomeCarta(l.cardId)
  return (
    <li className={'s-lote fundo' + (l.lidero ? ' lid' : '')} aria-label={`Lote ${l.numero}: ${nome}`}>
      <Carta cardId={l.cardId} />
      <div className="s-info">
        <div className="s-lin">
          <small>Lote Nº {num(l.numero)}</small>
          {l.meu ? <span className="s-sel seu">Seu lote</span> : l.lidero ? <span className="s-sel lid">Você lidera</span> : l.meuLance ? <span className="s-sel sup">Superado</span> : null}
        </div>
        <strong>{nome}</strong>
        <p className="s-de">
          <Rar r={l.raridade} /> <span>de {l.meu ? 'você' : l.vendedor}</span>
        </p>
        <div className="s-pe">
          <div>
            <small>{l.maiorLance ? `Maior lance · ${l.lances}×` : 'Lance mínimo'}</small>
            <b>{formatTempo(l.maiorLance ?? l.lanceMinimo)}</b>
          </div>
          {aberto && !l.meu && onLance && (
            <button type="button" className={'r-bt chanfro' + (l.lidero ? '' : ' s-forte')} aria-label={`Dar lance no lote ${l.numero}`} onClick={onLance}>
              Dar lance
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function Leiloes({ d, avisos, onLance }: { d: SalaoLiberado; avisos: ReactNode; onLance: (l: SalaoLote) => void }) {
  const r = d.relogio
  const c = d.leiloes
  return (
    <>
      {avisos}
      {r.aberto ? (
        <>
          <Cab t={`Edição ${ed(r.corrente.n)}`} s={`${c.length} ${c.length === 1 ? 'lote' : 'lotes'} · lances em Tempo`} />
          {c.length ? (
            <ul className="s-lotes">
              {c.map((l) => (
                <Lote key={l.id} l={l} aberto onLance={() => onLance(l)} />
              ))}
            </ul>
          ) : (
            <Vazio t="Palco vazio" p="Nenhum lote nesta edição. Os itens aprovados na Bandeja entram na próxima." />
          )}
        </>
      ) : (
        <>
          <Cab t="Próxima edição" s={`Abre ${formatDataHora(r.proxima.inicio)}`} />
          {d.proximos.length ? (
            <ul className="s-lotes">
              {d.proximos.map((l) => (
                <Lote key={l.id} l={l} aberto={false} />
              ))}
            </ul>
          ) : (
            <Vazio t="Cortinas fechadas" p="Os lotes aprovados aparecem aqui antes da abertura. Lances só valem com o Salão aberto." />
          )}
        </>
      )}
      {d.encerrados.length > 0 && (
        <>
          <Cab t="Encerrados" s="Últimas batidas de martelo" />
          <ul className="s-enc fundo" aria-label="Encerrados">
            {d.encerrados.map((l) => (
              <li key={l.id}>
                <small>{num(l.numero)}</small>
                <span>{nomeCarta(l.cardId)}</span>
                {l.status === 'vendido' && l.valorFinal ? (
                  <>
                    {l.venci && <i className="s-sel lid">Seu</i>}
                    <b>{formatTempo(l.valorFinal)}</b>
                  </>
                ) : (
                  <em>Sem lances</em>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- Mercado */

function Oferta({ o, children }: { o: SalaoOferta; children: ReactNode }) {
  return (
    <li className="s-of fundo">
      <Carta cardId={o.cardId} p />
      <div className="s-info">
        <strong>{nomeCarta(o.cardId)}</strong>
        <p className="s-de">
          <Rar r={o.raridade} /> <span>{o.meu ? 'sua' : `de ${o.vendedor}`}</span>
        </p>
        <b className="s-val">{formatTempo(o.preco)}</b>
      </div>
      <div className="s-acao">{children}</div>
    </li>
  )
}

function Mercado({
  d,
  avisos,
  ocupado,
  onVender,
  onComprar,
  onRetirar,
}: {
  d: SalaoLiberado
  avisos: ReactNode
  ocupado: string | null
  onVender: () => void
  onComprar: (o: SalaoOferta) => void
  onRetirar: (o: SalaoOferta) => void
}) {
  const outras = d.mercado.filter((o) => !o.meu && o.status === 'ativa')
  const minhas = d.minhasOfertas
  return (
    <>
      <div className="s-placa fundo">
        <Cab t="Mercado" s="Compra e venda entre jogadores · preço fixo" />
        <button type="button" className="r-bt chanfro" onClick={onVender}>
          Vender carta
        </button>
        <p>{d.relogio.aberto ? 'Salão aberto: as compras são liquidadas na hora, em Tempo.' : 'Você pode pôr cartas à venda a qualquer momento; as compras só acontecem durante a abertura.'}</p>
      </div>
      {avisos}
      {outras.length ? (
        <ul className="s-ofs" aria-label="Cartas à venda">
          {outras.map((o) => (
            <Oferta key={o.id} o={o}>
              <button
                type="button"
                className="r-bt chanfro s-forte"
                disabled={!d.relogio.aberto || !!ocupado}
                aria-busy={ocupado === o.id}
                aria-label={`Comprar ${nomeCarta(o.cardId)} por ${formatTempo(o.preco)}`}
                onClick={() => onComprar(o)}
              >
                Comprar
              </button>
            </Oferta>
          ))}
        </ul>
      ) : (
        <Vazio t="Nenhuma carta à venda" p="Quando alguém puser uma carta no Mercado, ela aparece aqui." />
      )}
      {minhas.length > 0 && (
        <>
          <Cab t="Suas negociações" />
          <ul className="s-ofs" aria-label="Suas negociações">
            {minhas.map((o) => (
              <Oferta key={o.id} o={o}>
                {o.meu && o.status === 'ativa' ? (
                  <button type="button" className="r-link" disabled={!!ocupado} aria-busy={ocupado === o.id} onClick={() => onRetirar(o)}>
                    Retirar
                  </button>
                ) : o.status === 'vendida' ? (
                  <span className={'s-sel ' + (o.comprei ? 'lid' : 'seu')}>{o.comprei ? 'Comprada' : `Vendida · +${formatTempo(o.repasse ?? 0)}`}</span>
                ) : (
                  <span className="s-sel seu">Retirada</span>
                )}
              </Oferta>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- Anúncios */

function Anuncio({ a, children }: { a: SalaoAnuncio; children?: ReactNode }) {
  const rec = a.tipo === 'recrutamento'
  return (
    <li className={'s-an fundo' + (rec ? ' rec' : '')} aria-label={`${ANUNCIO_ROTULO[a.tipo]}: ${a.titulo}`}>
      <div className="s-lin">
        <span className={'s-sel ' + (rec ? 'lid' : 'seu')}>{ANUNCIO_ROTULO[a.tipo]}</span>
        <small>{rec ? a.corporacao : a.meu ? 'você' : a.autor}</small>
      </div>
      <strong>{a.titulo}</strong>
      <p>{a.texto}</p>
      {children}
    </li>
  )
}

const ESTADO_ANUNCIO: Record<SalaoAnuncio['status'], string> = { pendente: 'Em avaliação', publicado: 'No mural', recusado: 'Recusado', retirado: 'Retirado' }

function Anuncios({
  d,
  avisos,
  ocupado,
  equipe,
  onNovo,
  onRetirar,
}: {
  d: SalaoLiberado
  avisos: ReactNode
  ocupado: string | null
  equipe: ReactNode
  onNovo: () => void
  onRetirar: (a: SalaoAnuncio) => void
}) {
  return (
    <>
      {equipe}
      <div className="s-placa fundo">
        <Cab t="Propostas e anúncios" s="Recrutamento · propagandas · propostas" />
        <button type="button" className="r-bt chanfro" onClick={onNovo}>
          Anunciar
        </button>
        <p>Propostas não têm custo inicial. Propagandas custam {formatTempo(d.custoPropaganda)}. Tudo passa pela avaliação da casa antes de ir ao mural.</p>
      </div>
      {avisos}
      {d.anuncios.length ? (
        <ul className="s-ans" aria-label="Mural">
          {d.anuncios.map((a) => (
            <Anuncio key={a.id} a={a} />
          ))}
        </ul>
      ) : (
        <Vazio t="Mural vazio" p="Nenhuma proposta publicada nesta temporada." />
      )}
      {d.meusAnuncios.length > 0 && (
        <>
          <Cab t="Seus anúncios" />
          <ul className="s-ans" aria-label="Seus anúncios">
            {d.meusAnuncios.map((a) => (
              <Anuncio key={a.id} a={a}>
                <div className="s-lin">
                  <span className={'s-sel ' + (a.status === 'recusado' || a.status === 'retirado' ? 'seu' : 'lid')}>{ESTADO_ANUNCIO[a.status]}</span>
                  {(a.status === 'pendente' || a.status === 'publicado') && (
                    <button type="button" className="r-link" disabled={!!ocupado} aria-busy={ocupado === a.id} onClick={() => onRetirar(a)}>
                      Retirar
                    </button>
                  )}
                </div>
              </Anuncio>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- Bandeja */

const STATUS_LOTE: Record<SalaoLote['status'], string> = {
  avaliacao: 'Em avaliação de especialista',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  retirado: 'Retirado',
  vendido: 'Vendido',
  devolvido: 'Devolvido sem lances',
}
const TOM_LOTE = (s: SalaoLote['status']) => (s === 'avaliacao' ? 'ava' : s === 'recusado' ? 'sup' : s === 'vendido' || s === 'aprovado' ? 'lid' : 'seu')

function Bandeja({
  d,
  avisos,
  ocupado,
  equipe,
  onEnviar,
  onRetirar,
  onAvisoLido,
}: {
  d: SalaoLiberado
  avisos: ReactNode
  ocupado: string | null
  equipe: ReactNode
  onEnviar: () => void
  onRetirar: (l: SalaoLote) => void
  onAvisoLido: () => void
}) {
  const t = usePlayerText()
  const [aviso, setAviso] = useState(!d.avisoAnunciar)
  const ativos = d.meusLotes.filter((l) => l.status === 'avaliacao' || l.status === 'aprovado').length
  const livres = Math.max(0, d.vagas.total - d.vagas.usadas)
  return (
    <>
      {/* texto de sistema "Anunciar no Salão das Máscaras" (literal do dono) */}
      <section className="s-aviso fundo" aria-label="Anunciar no Salão das Máscaras">
        <button
          type="button"
          className="s-av-bt"
          aria-expanded={aviso}
          onClick={() => {
            playSfx('click')
            setAviso((v) => !v)
          }}
        >
          <span>
            <small>Sistema</small>Anunciar no Salão das Máscaras
          </span>
          <i aria-hidden="true">{aviso ? '−' : '+'}</i>
        </button>
        {aviso && (
          <>
            <ol>
              {AVISO_ANUNCIAR.map((linha, i) => (
                <li key={i}>{t(linha)}</li>
              ))}
            </ol>
            {!d.avisoAnunciar && (
              <button
                type="button"
                className="r-bt chanfro"
                onClick={() => {
                  setAviso(false)
                  onAvisoLido()
                }}
              >
                Entendi
              </button>
            )}
          </>
        )}
      </section>
      <div className="s-placa fundo">
        <Cab t="Bandeja" s={`${d.contrato.nome} · raridade mínima ${RARIDADE_ROTULO[d.bandeja.raridade_minima]}`} />
        <dl className="s-dl">
          <div>
            <dt>Taxa de divulgação</dt>
            <dd>{formatTempo(d.contrato.divulgacao)}</dd>
          </div>
          <div>
            <dt>Comissão na venda</dt>
            <dd>{d.contrato.comissaoPct}%</dd>
          </div>
          <div>
            <dt>Vagas da próxima edição</dt>
            <dd>
              {livres} de {d.vagas.total}
            </dd>
          </div>
          <div>
            <dt>Seus itens ativos</dt>
            <dd>
              {ativos} de {d.bandeja.max_por_jogador}
            </dd>
          </div>
        </dl>
        <button type="button" className="r-bt chanfro s-forte s-larga" disabled={ativos >= d.bandeja.max_por_jogador} onClick={onEnviar}>
          Enviar pelo Shuffler
        </button>
        {d.owner && <p className="r-sub">Valores provisórios · editáveis no Calendário Devo</p>}
      </div>
      {avisos}
      {equipe}
      <Cab t="Seus itens" />
      {d.meusLotes.length ? (
        <ul className="s-ofs" aria-label="Seus itens na Bandeja">
          {d.meusLotes.map((l) => (
            <li key={l.id} className="s-of s-item fundo">
              <Carta cardId={l.cardId} p />
              <div className="s-info">
                <small>Lote Nº {num(l.numero)}</small>
                <strong>{nomeCarta(l.cardId)}</strong>
                <p className="s-de">
                  <span className={'s-sel ' + TOM_LOTE(l.status)}>{STATUS_LOTE[l.status]}</span>
                  {l.status === 'aprovado' && l.edicao !== null && <span>Edição {ed(l.edicao)}</span>}
                </p>
                {l.status === 'vendido' && l.repasse !== null && (
                  <p className="r-sub">
                    Arrematado por {formatTempo(l.valorFinal ?? 0)} · você recebeu <b>{formatTempo(l.repasse)}</b>
                  </p>
                )}
                {l.status === 'aprovado' && <p className="r-sub">Lance mínimo {formatTempo(l.lanceMinimo)}</p>}
                {l.status === 'recusado' && l.nota && <p className="r-sub">“{l.nota}”</p>}
                {l.status === 'avaliacao' && (
                  <button type="button" className="r-link" disabled={!!ocupado} aria-busy={ocupado === l.id} onClick={() => onRetirar(l)}>
                    Retirar da Bandeja
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio t="Bandeja vazia" p="Envie uma carta pelo Shuffler. Ela espera a avaliação de um especialista antes de entrar no leilão." />
      )}
    </>
  )
}
