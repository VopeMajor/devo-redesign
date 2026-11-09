'use client'

import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { getCard } from '@/lib/devo/cards'
import { CORP_CARGO_ROTULO, type CorpLiberado, type CorpMembro, type CorpResumo, type MinhaCorp, inicialDe, normalizarCodigo, podeDecidir } from '@/lib/devo/corporacoes'
import { CorporacoesMesa, useFilaCorporacoes } from '@/components/devo/corporacoes/corporacoes-mesa'
import { corpGet, corpPost, useCorporacoes } from '@/components/devo/corporacoes/dados'
import { useCenas } from '@/components/devo/dialogo'
import { concluirCena } from '@/components/devo/dialogo/cliente'
import { CardFace } from '@/components/devo/shared/devo-card'
import { useDevo } from '@/components/devo/state/devo-store'
import { useAcesso } from '@/components/devo/state/use-acesso'
import { useBackHandler } from '@/components/devo/use-back-handler'
import { erroTexto, Legado, px } from '../comum'
import { BrasaoPx, corpArte, DESENHO_PADRAO, type DesenhoBrasao, EditorBrasao, useFolhasBrasao } from './corporacoes-brasao'
import { ChatCorp, Monograma, ParedeCorp, papelSrc, usePapelNaCasca } from './corporacoes-chat'
import { CENA_CORP, ChamadaMelissa } from './corporacoes-holo'

/**
 * Corporações no v2 (protótipo kit3/os-corp.js, aprovado pelo dono; papel de parede e chat, 03/11/2026). Tudo o que
 * a tela do jogo fazia continua, com as mesmas chamadas (/api/corporacoes, useCorporacoes):
 * - sem Corporação: o salão de registro, o código de identificação (prévia e pedido), pedido enviado (cancelar),
 *   convites recebidos (aceitar/recusar), fundar (requisitos, Tempo, brasão) e a fundação em análise ou recusada;
 * - com Corporação: a sala com o brasão no nicho, a ficha (cargo, lema, brasão, código), e as abas Chat, Membros
 *   (gerir, convidar, convites pendentes, jogos coletivos, rivais, sair), Pedidos (líder/vice), Cartas
 *   (transferência), Recrutar (Salão das Máscaras) e Parede (papel de parede, só o líder);
 * - o código de regras da Companhia, a chamada da Melissa em holograma e o painel da equipe (Owner/Anfitrião).
 */

type Agir = (b: Record<string, unknown>) => Promise<unknown>
type Aba = 'chat' | 'membros' | 'pedidos' | 'cartas' | 'recrutar' | 'papel'
type FolhaAberta =
  | { t: 'previa'; corp: CorpResumo }
  | { t: 'fundar' }
  | { t: 'redesenho' }
  | { t: 'gerir'; membro: CorpMembro }
  | { t: 'sair' }
  | { t: 'equipe' }
  | null

/* ------------------------------------------------------------------ peças */

const fmtDia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' })
const dia = (ms: number) => fmtDia.format(ms).replace(/\./g, '').replace(/ de /g, ' ')
/** Minutos em texto curto (o mesmo do protótipo: 6h, 2h 30min, 45min). */
function tempo(min: number) {
  const m = Math.max(0, Math.round(min))
  const h = Math.floor(m / 60)
  const r = m % 60
  return !h ? `${r}min` : r ? `${h}h ${String(r).padStart(2, '0')}min` : `${h}h`
}
const nomeCarta = (id: string) => {
  try {
    return getCard(id).name
  } catch {
    return id
  }
}

const Cab = ({ t, s }: { t: string; s?: string }) => (
  <header className="s-cab">
    <h4>{t}</h4>
    {s && <small>{s}</small>}
  </header>
)
const Vazio = ({ t, children }: { t: string; children: ReactNode }) => (
  <div className="s-vazio fundo">
    <strong>{t}</strong>
    <p className="r-sub">{children}</p>
  </div>
)
const Selo = ({ c = 'seu', children }: { c?: string; children: ReactNode }) => <span className={`s-sel ${c}`}>{children}</span>
const Ok = ({ nota }: { nota: string | null }) =>
  nota ? (
    <p className="s-ok fundo" role="status">
      {nota}
    </p>
  ) : null
const Erro = ({ children }: { children: ReactNode }) =>
  children ? (
    <p className="r-erro" role="alert">
      {children}
    </p>
  ) : null

/** Ação no servidor com ocupado/erro (uma por vez) e o som do jogo. */
function useAcao(agir: Agir) {
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const fazer = async <T = Record<string, unknown>,>(chave: string, body: Record<string, unknown>, som: 'confirm' | 'close' = 'confirm'): Promise<T | null> => {
    if (ocupado) return null
    setOcupado(chave)
    setErro(null)
    try {
      const r = (await agir(body)) as T
      playSfx(som)
      return r
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
      return null
    } finally {
      setOcupado(null)
    }
  }
  return { ocupado, erro, setErro, fazer }
}

/** Folha por cima da janela (abaixo da barra de título), como saFolha do protótipo; o voltar do aparelho fecha. */
function Folha({ jan, sub, tit, onVolta, children }: { jan: HTMLElement | null; sub: string; tit: string; onVolta: () => void; children: ReactNode }) {
  const volta = useRef<HTMLButtonElement>(null)
  const sai = useRef(onVolta)
  sai.current = onVolta
  useBackHandler(true, () => sai.current())
  useEffect(() => {
    playSfx('open')
    volta.current?.focus({ preventScroll: true })
  }, [])
  if (!jan) return null
  return createPortal(
    <div className="s-folha" role="dialog" aria-label={tit}>
      <div className="c-nav">
        <button
          ref={volta}
          type="button"
          className="m-volta chanfro"
          aria-label="Voltar"
          onClick={() => {
            playSfx('close')
            onVolta()
          }}
        >
          ‹
        </button>
        <div>
          <small>{sub}</small>
          <strong>{tit}</strong>
        </div>
      </div>
      {children}
    </div>,
    jan,
  )
}

/* ------------------------------------------------------------------ a tela */

export function CorporacoesV2() {
  const { data, error, mutate, agir } = useCorporacoes()
  const folhas = useFolhasBrasao()
  const acesso = useAcesso()
  const cenas = useCenas()
  const marca = useRef<HTMLElement>(null)
  const [jan, setJan] = useState<HTMLElement | null>(null)
  const [holo, setHolo] = useState(false)
  const pedida = useRef(false)
  const equipe = !!acesso?.total

  useEffect(() => {
    setJan((marca.current?.closest('.jan') as HTMLElement | null) ?? null)
  }, [])

  // a chamada da Melissa na primeira entrada; se a cena já foi vista pela Narrativa, só conta como apresentada
  useEffect(() => {
    if (!data?.liberado || data.apresentado || pedida.current) return
    if (cenas.aberta) return
    if (!cenas.carregado && !equipe) return
    pedida.current = true
    if (cenas.vista(CENA_CORP)) {
      void corpPost({ action: 'apresentacao.concluir' })
        .catch(() => null)
        .then(() => mutate())
      return
    }
    setHolo(true)
  }, [data, cenas, equipe, mutate])

  const minha = data?.liberado ? data.minha : null
  usePapelNaCasca(jan, papelSrc(minha?.papel))

  const fimHolo = (concluiu: boolean) => {
    setHolo(false)
    if (data?.liberado && !data.apresentado) void corpPost({ action: 'apresentacao.concluir' }).catch(() => null).then(() => mutate())
    if (concluiu && !cenas.vista(CENA_CORP)) {
      void concluirCena(CENA_CORP)
        .then((r) => {
          if (r.aplicados.some((x) => x.tipo === 'flag')) window.dispatchEvent(new Event('devo:acesso'))
          return cenas.recarregar()
        })
        .catch(() => null)
    }
  }

  return (
    <>
      <i hidden ref={marca} />
      {!data || (data.liberado && folhas === null) ? (
        error ? (
          <div className="s-vazio fundo">
            <strong>A Companhia não respondeu</strong>
            <p className="r-sub">{(error as Error).message}</p>
            <button className="r-bt chanfro" onClick={() => void mutate()}>
              Tentar de novo
            </button>
          </div>
        ) : (
          <p className="co-carrega">Consultando a Companhia…</p>
        )
      ) : !data.liberado ? (
        <div className="s-vazio fundo">
          <strong>Corporações trancadas</strong>
          <p className="r-sub">{data.motivo}</p>
        </div>
      ) : (
        <Tela d={data} agir={agir} jan={jan} equipe={equipe} recarregar={() => void mutate()} onMel={() => setHolo(true)} />
      )}
      {holo && jan && data?.liberado && <ChamadaMelissa jan={jan} pode={data.podePular || equipe} registrar={!cenas.vista(CENA_CORP)} onFim={fimHolo} />}
    </>
  )
}

function Tela({ d, agir, jan, equipe, recarregar, onMel }: { d: CorpLiberado; agir: Agir; jan: HTMLElement | null; equipe: boolean; recarregar: () => void; onMel: () => void }) {
  const m = d.minha
  const [aba, setAba] = useState<Aba>('membros')
  const [nota, setNota] = useState<string | null>(null)
  const [folha, setFolha] = useState<FolhaAberta>(null)
  const abas = useRef<HTMLDivElement>(null)
  const fila = useFilaCorporacoes(equipe).data?.pendentes.length ?? 0
  const me = m?.membrosLista.find((p) => p.eu)
  const decide = podeDecidir(m?.meuCargo)
  const lider = m?.meuCargo === 'lider'
  const abaVale = !m ? 'membros' : (aba === 'pedidos' && !decide) || (aba === 'papel' && !lider) ? 'membros' : aba
  const fecha = () => setFolha(null)

  const lista: [Aba, string, number?][] = m
    ? [['chat', 'Chat'], ['membros', 'Membros'], ...(decide ? [['pedidos', 'Pedidos', m.pedidos.length] as [Aba, string, number]] : []), ['cartas', 'Cartas'], ['recrutar', 'Recrutar'], ...(lider ? [['papel', 'Parede'] as [Aba, string]] : [])]
    : []

  return (
    <>
      <div className="s-grade">
        <div className="s-esq">
          <Topo d={d} agir={agir} onMel={onMel} onRedesenho={() => setFolha({ t: 'redesenho' })} />
        </div>
        <div className="s-dir">
          {m && (
            <div className="r-abas" role="tablist" aria-label="Seções da Corporação" ref={abas}>
              {lista.map(([id, t, c]) => (
                <button
                  key={id}
                  className="chanfro"
                  role="tab"
                  aria-selected={abaVale === id}
                  onClick={(e) => {
                    playSfx('click')
                    setAba(id)
                    setNota(null)
                    e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                    const cp = abas.current?.closest('.corpo')
                    if (abas.current && cp && cp.scrollTop > abas.current.offsetTop) cp.scrollTop = abas.current.offsetTop
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
          )}
          <div className="co-painel" role={m ? 'tabpanel' : undefined}>
            {m ? (
              abaVale === 'chat' ? (
                <ChatCorp m={m} jan={jan} />
              ) : abaVale === 'membros' ? (
                <>
                  <Ok nota={nota} />
                  <Membros d={d} m={m} agir={agir} onGerir={(p) => setFolha({ t: 'gerir', membro: p })} onSair={() => setFolha({ t: 'sair' })} />
                </>
              ) : abaVale === 'pedidos' ? (
                <>
                  <Ok nota={nota} />
                  <Pedidos m={m} agir={agir} setNota={setNota} />
                </>
              ) : abaVale === 'cartas' ? (
                <Cartas m={m} agir={agir} />
              ) : abaVale === 'papel' ? (
                <ParedeCorp m={m} agir={agir} />
              ) : (
                <Recrutar m={m} agir={agir} />
              )
            ) : (
              <>
                <Ok nota={nota} />
                {d.pedido ? <PedidoEnviado d={d} agir={agir} setNota={setNota} /> : <Terminal bloqueado={!!d.criacao.pendente} onPrevia={(corp) => setFolha({ t: 'previa', corp })} />}
                <Convites d={d} agir={agir} setNota={setNota} />
                <Fundar d={d} agir={agir} setNota={setNota} onFundar={() => setFolha({ t: 'fundar' })} />
              </>
            )}
            <CodigoRegras d={d} />
          </div>
        </div>
      </div>
      {equipe && (
        <button className="s-equipe chanfro" onClick={() => setFolha({ t: 'equipe' })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('mesa')} alt="" />
          <span>Painel da equipe</span>
          {fila ? <b>{fila}</b> : null}
        </button>
      )}

      {folha?.t === 'previa' && <FolhaPrevia jan={jan} corp={folha.corp} agir={agir} onFim={fecha} />}
      {folha?.t === 'fundar' && <FolhaFundar jan={jan} d={d} agir={agir} onFim={fecha} />}
      {folha?.t === 'redesenho' && m && <FolhaRedesenho jan={jan} m={m} agir={agir} onFim={fecha} />}
      {folha?.t === 'gerir' && m && (
        <FolhaGerir
          jan={jan}
          membro={m.membrosLista.find((p) => p.id === folha.membro.id) ?? folha.membro}
          agir={agir}
          onFim={(aviso) => {
            fecha()
            if (aviso) setNota(aviso)
          }}
        />
      )}
      {folha?.t === 'sair' && m && me && (
        <FolhaSair
          jan={jan}
          m={m}
          agir={agir}
          onFim={(saiu) => {
            fecha()
            if (saiu) {
              setAba('membros')
              setNota('Você saiu da Corporação.')
            }
          }}
        />
      )}
      {folha?.t === 'equipe' && (
        <Folha
          jan={jan}
          sub="Companhia de Despertados"
          tit="Painel da equipe"
          onVolta={() => {
            fecha()
            recarregar()
          }}
        >
          <div className="s-corpo">
            <Legado>
              <CorporacoesMesa />
            </Legado>
          </div>
        </Folha>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ cabeçalho: salão de registro ou a sala da Corporação */

function Topo({ d, agir, onMel, onRedesenho }: { d: CorpLiberado; agir: Agir; onMel: () => void; onRedesenho: () => void }) {
  const m = d.minha
  const raiz = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const mede = () => setK(window.matchMedia('(min-width:900px)').matches || (raiz.current?.closest('#cor')?.clientWidth ?? 0) >= 360 ? 2 : 1)
    mede()
    window.addEventListener('resize', mede)
    return () => window.removeEventListener('resize', mede)
  }, [])
  const mel = (
    <button
      className="k-mel chanfro co-mel"
      aria-label="Chamar a Companhia"
      onClick={(e) => {
        e.stopPropagation()
        onMel()
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/v2/art/os/npc/melissa-rosto.png" alt="" />
      <span>Companhia</span>
    </button>
  )
  if (!m)
    return (
      <>
        <div className="co-cena reg" ref={raiz}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="co-fundo" src={corpArte('registro')} alt="O salão de registro da Companhia, com um projetor de hexágonos sobre o balcão" />
          {mel}
        </div>
        <i className="s-dit" aria-hidden="true" />
        <section className="co-titulo">
          <small>Companhia de Despertados · registro</small>
          <h3>Corporações</h3>
          <p>Poucos Records alcançam o sucesso trabalhando sozinhos.</p>
        </section>
      </>
    )
  const necro = m.classificacao === 'necro'
  const pp = papelSrc(m.papel)
  return (
    <>
      <div className={'co-cena' + (necro ? ' necro' : '') + (pp ? ' com-papel' : '')} style={pp ? ({ '--papel-cena': `url('${pp}')` } as CSSProperties) : undefined} ref={raiz}>
        {pp ? (
          <i className="co-papel-cena" aria-hidden="true" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="co-fundo" src={corpArte(necro ? 'sala-necro' : 'sala')} alt="A sala da Corporação" />
        )}
        <div className="co-nicho">
          <BrasaoPx b={m.brasao} k={k} necro={necro} alt={`Brasão de ${m.nome}`} />
        </div>
        {mel}
      </div>
      <i className="s-dit" aria-hidden="true" />
      <Ficha m={m} agir={agir} onRedesenho={onRedesenho} />
    </>
  )
}

function Ficha({ m, agir, onRedesenho }: { m: MinhaCorp; agir: Agir; onRedesenho: () => void }) {
  const necro = m.classificacao === 'necro'
  const lider = m.meuCargo === 'lider'
  const { ocupado, erro, setErro, fazer } = useAcao(agir)
  const [edita, setEdita] = useState(false)
  const [lema, setLema] = useState('')
  const [copiado, setCopiado] = useState(false)
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (edita) campo.current?.focus()
  }, [edita])
  const salva = async (valor: string, som: 'confirm' | 'close' = 'confirm') => {
    if (await fazer('lema', { action: 'lema.editar', lema: valor }, som)) setEdita(false)
  }
  return (
    <section className={'co-ficha' + (necro ? ' necro' : '')} aria-label={`Corporação ${m.nome}`}>
      <div className="s-lin co-faixa">
        <span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={corpArte('selo-p')} alt="" />
          Registro da Companhia
        </span>
        <b>{necro ? 'Classe N' : 'Classe A'}</b>
      </div>
      <p className="co-cargo">
        {CORP_CARGO_ROTULO[m.meuCargo]} · {m.membros}/{m.maxMembros}
      </p>
      <h3>{m.nome}</h3>
      {m.lema && <p className="co-lema">“{m.lema}”</p>}
      {edita ? (
        <form
          className="co-lema-ed"
          onSubmit={(e) => {
            e.preventDefault()
            void salva(lema)
          }}
        >
          <label className="s-rot" htmlFor="co-lema-i">
            Lema da Corporação
          </label>
          <input ref={campo} className="s-in" id="co-lema-i" maxLength={90} value={lema} onChange={(e) => setLema(e.target.value)} placeholder="Uma frase para o brasão (opcional)" autoComplete="off" />
          <Erro>{erro}</Erro>
          <div className="co-linha">
            <button className="r-bt chanfro s-forte" disabled={!!ocupado}>
              Salvar
            </button>
            {m.lema && (
              <button type="button" className="r-bt chanfro" disabled={!!ocupado} onClick={() => void salva('', 'close')}>
                Tirar o lema
              </button>
            )}
            <button type="button" className="r-link" onClick={() => setEdita(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : lider ? (
        <div className="co-linha">
          <button
            className="r-link"
            onClick={() => {
              setLema(m.lema ?? '')
              setErro(null)
              setEdita(true)
            }}
          >
            {m.lema ? 'Trocar o lema' : '+ Pôr um lema'}
          </button>
          <button className="r-link" onClick={onRedesenho}>
            Redesenhar o brasão
          </button>
        </div>
      ) : null}
      <div className="co-selos">
        {necro ? <Selo c="sup">Necro-Corporação</Selo> : <Selo c="lid">Oficial</Selo>}
        {m.escopo === 'global' && <Selo c="ava">Global · provisório</Selo>}
      </div>
      {necro && (
        <p className="co-alerta" role="alert">
          A Companhia classificou esta Corporação como terrorista por violar o código de regras.
        </p>
      )}
      <div className="co-cod">
        <div>
          <small>Código de identificação</small>
          <b className="fundo">{m.codigo}</b>
        </div>
        <button
          className="r-bt chanfro"
          onClick={() => {
            if (!m.codigo) return
            void navigator.clipboard?.writeText(m.codigo).catch(() => {})
            playSfx('confirm')
            setCopiado(true)
            window.setTimeout(() => setCopiado(false), 1800)
          }}
        >
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ sem Corporação */

function Terminal({ bloqueado, onPrevia }: { bloqueado: boolean; onPrevia: (c: CorpResumo) => void }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const consulta = async (e: FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || ocupado || bloqueado) return
    setOcupado(true)
    setErro(null)
    try {
      const r = await corpGet<{ corporacao: CorpResumo }>(`/api/corporacoes?codigo=${encodeURIComponent(normalizarCodigo(codigo))}`)
      onPrevia(r.corporacao)
    } catch (er) {
      playSfx('error')
      setErro(erroTexto(er))
    } finally {
      setOcupado(false)
    }
  }
  return (
    <section className="co-term fundo" aria-label="Código de identificação">
      <div className="s-lin co-faixa">
        <span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={corpArte('selo-p')} alt="" />
          Terminal da Companhia
        </span>
        <b>Entrada</b>
      </div>
      <small className="co-sob">Entrar numa Corporação</small>
      <h4>Código de identificação</h4>
      <p className="r-sub">Insira o código da Corporação. O líder ou o vice-líder aprova a sua entrada e, durante o processo, vê partes do seu perfil.</p>
      <ol className="co-etapas" aria-label="Etapas">
        {['Código', 'Pedido', 'Aprovação'].map((t, i) => (
          <li key={t} className={i === 0 ? 'on' : undefined}>
            <i>{i + 1}</i>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <form onSubmit={consulta}>
        <label className="vs" htmlFor="co-in">
          Código de identificação
        </label>
        <span className="co-mira">
          <input
            id="co-in"
            value={codigo}
            maxLength={16}
            placeholder="CRP-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={bloqueado}
            aria-invalid={erro ? true : undefined}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase().slice(0, 16))
              setErro(null)
            }}
          />
        </span>
        <Erro>{erro}</Erro>
        {bloqueado && <p className="r-sub">Enquanto a sua fundação estiver em análise, não é possível pedir entrada em outra Corporação.</p>}
        <button className="r-bt chanfro s-forte s-larga" disabled={bloqueado || !codigo.trim() || ocupado}>
          {ocupado ? 'Consultando…' : 'Consultar código'}
        </button>
      </form>
    </section>
  )
}

function FolhaPrevia({ jan, corp, agir, onFim }: { jan: HTMLElement | null; corp: CorpResumo; agir: Agir; onFim: () => void }) {
  const necro = corp.classificacao === 'necro'
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <Folha jan={jan} sub="Código encontrado" tit={corp.nome} onVolta={onFim}>
      <div className="s-corpo">
        <div className={'co-prev' + (necro ? ' necro' : '')}>
          <BrasaoPx b={corp.brasao} k={2} necro={necro} alt={`Brasão de ${corp.nome}`} />
        </div>
        <div className="co-selos">{necro ? <Selo c="sup">Necro-Corporação</Selo> : <Selo c="lid">Corporação oficial</Selo>}</div>
        {corp.lema && <p className="co-lema">“{corp.lema}”</p>}
        <small className="co-rot">
          {corp.membros} {corp.membros === 1 ? 'membro' : 'membros'} · {corp.codigo}
        </small>
        {necro && (
          <p className="co-alerta" role="alert">
            A Companhia de Despertados classificou esta Corporação como terrorista. Entrar numa Necro-Corporação é por sua conta e risco.
          </p>
        )}
        <p className="r-sub">O líder ou o vice-líder verá o nome do seu personagem, desde quando você está no DEVO, sua participação em Deadly Votes, quantas cartas tem e a sua segunda aparência.</p>
        <Erro>{erro}</Erro>
        <button className={'r-bt chanfro s-larga ' + (necro ? 'j-perigo' : 's-forte')} disabled={!!ocupado} onClick={async () => (await fazer('entrar', { action: 'entrar', codigo: corp.codigo })) && onFim()}>
          {ocupado ? 'Enviando…' : 'Enviar pedido'}
        </button>
      </div>
    </Folha>
  )
}

function PedidoEnviado({ d, agir, setNota }: { d: CorpLiberado; agir: Agir; setNota: (n: string | null) => void }) {
  const p = d.pedido!
  const necro = p.corporacao.classificacao === 'necro'
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <section className={'co-ped fundo' + (necro ? ' necro' : '')} aria-label="Pedido de entrada enviado">
      <div className="co-ped-b">
        <BrasaoPx b={p.corporacao.brasao} necro={necro} />
      </div>
      <div>
        <Selo c="ava">Pedido enviado</Selo>
        <h4>{p.corporacao.nome}</h4>
        <small>
          {p.origem === 'convite' ? 'Por convite' : 'Pelo código'} · {dia(p.createdAt)}
        </small>
        <p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('pulso')} alt="" />
          Aguardando o líder ou o vice-líder aprovar a sua entrada.
        </p>
        <Erro>{erro}</Erro>
        <button className="r-bt chanfro" disabled={!!ocupado} onClick={async () => (await fazer('canc', { action: 'pedido.cancelar', id: p.id }, 'close')) && setNota('Pedido cancelado.')}>
          Cancelar pedido
        </button>
      </div>
    </section>
  )
}

function Convites({ d, agir, setNota }: { d: CorpLiberado; agir: Agir; setNota: (n: string | null) => void }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  if (!d.convites.length) return null
  const responde = async (id: string, nome: string, aceitar: boolean) => {
    const r = await fazer<{ aceito: boolean; entrou: boolean }>(`${id}:${aceitar}`, { action: 'convite.responder', id, aceitar }, aceitar ? 'confirm' : 'close')
    if (r?.aceito) setNota(r.entrou ? `Você agora faz parte de ${nome}.` : 'O convite virou um pedido para o líder ou o vice-líder.')
  }
  return (
    <>
      <Cab t="Convites" s="De Records que já fazem parte de uma Corporação" />
      <Erro>{erro}</Erro>
      <ul className="co-lista">
        {d.convites.map((v) => {
          const necro = v.corporacao.classificacao === 'necro'
          return (
            <li key={v.id} className="co-conv fundo" aria-label={`Convite de ${v.corporacao.nome}`}>
              <div className="co-mini">
                <BrasaoPx b={v.corporacao.brasao} mini necro={necro} />
              </div>
              <div className="co-mid">
                <strong>{v.corporacao.nome}</strong>
                <p className="r-sub">
                  {v.de ? `${v.de} convidou você` : 'Convite da Corporação'} · {v.direto ? 'entrada direta' : 'passa pelo líder'}
                </p>
                {necro && <Selo c="sup">Necro</Selo>}
                <div className="s-duo">
                  <button className="r-bt chanfro s-forte" disabled={!!ocupado} onClick={() => void responde(v.id, v.corporacao.nome, true)}>
                    Aceitar
                  </button>
                  <button className="r-bt chanfro" disabled={!!ocupado} onClick={() => void responde(v.id, v.corporacao.nome, false)}>
                    Recusar
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Fundar({ d, agir, setNota, onFundar }: { d: CorpLiberado; agir: Agir; setNota: (n: string | null) => void; onFundar: () => void }) {
  const c = d.criacao
  const { ocupado, erro, fazer } = useAcao(agir)
  if (c.pendente)
    return (
      <>
        <Cab t="Fundar uma Corporação" s="Tempo + aprovação legal" />
        <section className="co-ped fundo" aria-label="Fundação em análise">
          <div className="co-ped-b">
            <BrasaoPx b={c.pendente.brasao} />
          </div>
          <div>
            <Selo c="ava">Em análise</Selo>
            <h4>{c.pendente.nome}</h4>
            <p className="r-sub">A Companhia avalia o seu perfil. Pago: {tempo(c.pendente.custo)}. Se recusarem, o Tempo volta.</p>
            <Erro>{erro}</Erro>
            <button
              className="r-link s-esq-link"
              disabled={!!ocupado}
              onClick={async () => {
                const r = await fazer<{ devolvido: boolean }>('desiste', { action: 'fundacao.cancelar' }, 'close')
                if (r) setNota(r.devolvido ? 'Fundação retirada. O Tempo voltou para o seu pulso.' : 'Fundação retirada.')
              }}
            >
              Desistir da fundação
            </button>
          </div>
        </section>
      </>
    )
  const rec = c.recusada
  return (
    <>
      <Cab t="Fundar uma Corporação" s={`Tempo + aprovação legal${c.provisorio ? ' · valores provisórios' : ''}`} />
      <section className="s-placa fundo">
        {rec && (
          <p className="co-recusa" role="status">
            A Companhia recusou “{rec.nome}”{rec.nota ? `: ${rec.nota}` : '.'} {rec.devolvido ? 'O Tempo foi devolvido.' : ''}
          </p>
        )}
        {c.requisitos.length ? (
          <dl className="co-reqs" aria-label="Requisitos do perfil">
            {c.requisitos.map((r) => (
              <div key={r.id} className={r.ok ? 'ok' : undefined}>
                <dt>
                  <i aria-hidden="true" />
                  {r.rotulo}
                </dt>
                <dd>
                  <u aria-hidden="true">
                    <s style={{ width: `${Math.min(100, (r.atual / Math.max(1, r.exigido)) * 100)}%` }} />
                  </u>
                  <b>
                    {Math.min(r.atual, 999)}/{r.exigido}
                  </b>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="r-sub">A Companhia não exige nada além do Tempo por enquanto.</p>
        )}
        <div className="s-lin co-inv">
          <span>Investimento</span>
          <b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={px('pulso')} alt="" />
            {tempo(c.custo)}
          </b>
        </div>
        <button className={'r-bt chanfro s-larga' + (c.atende ? ' s-forte' : '')} disabled={!!d.pedido} onClick={onFundar}>
          Fundar
        </button>
        {!c.atende && <p className="r-sub">Seu perfil ainda não atende a todos os requisitos.</p>}
      </section>
    </>
  )
}

function novoIdem() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function FolhaFundar({ jan, d, agir, onFim }: { jan: HTMLElement | null; d: CorpLiberado; agir: Agir; onFim: () => void }) {
  const c = d.criacao
  const [nome, setNome] = useState('')
  const [lema, setLema] = useState('')
  const [desenho, setDesenho] = useState<DesenhoBrasao>(DESENHO_PADRAO)
  const [idem] = useState(novoIdem)
  const { ocupado, erro, fazer } = useAcao(agir)
  const inicial = inicialDe(nome.trim() || 'Corporação')
  const brasao = useMemo(() => ({ ...desenho, inicial }), [desenho, inicial])
  return (
    <Folha jan={jan} sub="Companhia de Despertados" tit="Fundar Corporação" onVolta={onFim}>
      <div className="s-corpo">
        <p className="r-sub">A avaliação administrativa considera se o seu perfil corresponde aos requisitos exigidos.</p>
        <div className="co-prev">
          <BrasaoPx b={brasao} k={2} alt="Prévia do brasão" />
        </div>
        <small className="co-rot">Sinete da Corporação</small>
        <strong className="co-pn">{nome.trim() || 'Sem nome'}</strong>
        {lema.trim() && <p className="co-lema">“{lema.trim()}”</p>}
        <label className="s-rot" htmlFor="co-fn">
          Nome da Corporação
        </label>
        <input className="s-in" id="co-fn" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ordem do Relógio Partido" autoComplete="off" />
        <label className="s-rot" htmlFor="co-fl">
          Lema (opcional)
        </label>
        <input className="s-in" id="co-fl" maxLength={90} value={lema} onChange={(e) => setLema(e.target.value)} placeholder="Uma frase para o brasão" autoComplete="off" />
        <div className="co-editor">
          <EditorBrasao valor={desenho} onChange={setDesenho} inicial={inicial} />
        </div>
        <div className="s-lin co-inv">
          <span>Investimento em Tempo</span>
          <b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={px('pulso')} alt="" />
            {tempo(c.custo)}
          </b>
        </div>
        <p className="r-sub">
          Sai do seu pulso agora (ele precisa manter {tempo(c.reserva)} depois de pagar). Se a Companhia recusar, o Tempo volta.{c.provisorio ? ' Valores provisórios.' : ''}
        </p>
        {!c.atende && <p className="co-alerta">Seu perfil ainda não atende aos requisitos.</p>}
        <Erro>{erro}</Erro>
        <button
          className="r-bt chanfro s-forte s-larga"
          disabled={nome.trim().length < 3 || !c.atende || !!ocupado}
          onClick={async () => (await fazer('fundar', { action: 'fundar', nome, lema, ...desenho, idem })) && onFim()}
        >
          {ocupado ? 'Enviando…' : 'Pagar e enviar'}
        </button>
      </div>
    </Folha>
  )
}

/* ------------------------------------------------------------------ com Corporação */

function FolhaRedesenho({ jan, m, agir, onFim }: { jan: HTMLElement | null; m: MinhaCorp; agir: Agir; onFim: () => void }) {
  const [desenho, setDesenho] = useState<DesenhoBrasao>({
    forma: m.brasao.forma,
    cor: m.brasao.cor,
    cor2: m.brasao.cor2 ?? null,
    divisao: m.brasao.divisao ?? 'pleno',
    simbolo: m.brasao.simbolo ?? 'inicial',
    ornamento: m.brasao.ornamento ?? 'nenhum',
  })
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <Folha jan={jan} sub={m.nome} tit="Redesenhar o brasão" onVolta={onFim}>
      <div className="s-corpo">
        <div className="co-prev">
          <BrasaoPx b={{ ...desenho, inicial: m.brasao.inicial }} k={2} alt="Prévia do brasão" />
        </div>
        <div className="co-editor">
          <EditorBrasao valor={desenho} onChange={setDesenho} inicial={m.brasao.inicial} />
        </div>
        <Erro>{erro}</Erro>
        <button className="r-bt chanfro s-forte s-larga" disabled={!!ocupado} onClick={async () => (await fazer('brasao', { action: 'brasao.editar', ...desenho })) && onFim()}>
          Salvar o brasão
        </button>
      </div>
    </Folha>
  )
}

function FolhaGerir({ jan, membro, agir, onFim }: { jan: HTMLElement | null; membro: CorpMembro; agir: Agir; onFim: (aviso?: string) => void }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <Folha jan={jan} sub="Gerir membro" tit={membro.personagem} onVolta={() => onFim()}>
      <div className="s-corpo">
        <Erro>{erro}</Erro>
        <button
          className="r-bt chanfro s-larga"
          disabled={!!ocupado}
          onClick={async () => (await fazer('cargo', { action: 'membro.cargo', playerId: membro.id, cargo: membro.cargo === 'membro' ? 'vice' : 'membro' })) && onFim()}
        >
          {membro.cargo === 'membro' ? 'Tornar vice-líder' : 'Tornar membro'}
        </button>
        <button className="r-bt chanfro s-larga" disabled={!!ocupado} onClick={async () => (await fazer('lider', { action: 'lideranca.passar', playerId: membro.id })) && onFim(`${membro.personagem} agora lidera a Corporação.`)}>
          Passar liderança
        </button>
        <button className="r-bt chanfro j-perigo s-larga" disabled={!!ocupado} onClick={async () => (await fazer('remover', { action: 'membro.remover', playerId: membro.id }, 'close')) && onFim()}>
          Remover da Corporação
        </button>
      </div>
    </Folha>
  )
}

function FolhaSair({ jan, m, agir, onFim }: { jan: HTMLElement | null; m: MinhaCorp; agir: Agir; onFim: (saiu: boolean) => void }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  const so = m.membros <= 1
  const trava = m.meuCargo === 'lider' && !so
  return (
    <Folha jan={jan} sub={m.nome} tit="Sair da Corporação?" onVolta={() => onFim(false)}>
      <div className="s-corpo">
        <p>{trava ? 'Passe a liderança para outro membro antes de sair.' : so ? 'Você é o último membro: ao sair, a Corporação se dissolve e o código deixa de valer.' : 'Você perde as vantagens da Corporação. Para voltar, precisará de um novo pedido.'}</p>
        <Erro>{erro}</Erro>
        <button className="r-bt chanfro j-perigo s-larga" disabled={trava || !!ocupado} onClick={async () => (await fazer('sair', { action: 'sair' }, 'close')) && onFim(true)}>
          Confirmar saída
        </button>
      </div>
    </Folha>
  )
}

const ORDEM = { lider: 0, vice: 1, membro: 2 } as const

function Membros({ d, m, agir, onGerir, onSair }: { d: CorpLiberado; m: MinhaCorp; agir: Agir; onGerir: (p: CorpMembro) => void; onSair: () => void }) {
  const me = m.membrosLista.find((p) => p.eu)
  const lider = m.meuCargo === 'lider'
  const decide = podeDecidir(m.meuCargo)
  const { ocupado, erro, setErro, fazer } = useAcao(agir)
  const [convidado, setConvidado] = useState('')
  const [enviado, setEnviado] = useState<string | null>(null)
  const membros = [...m.membrosLista].sort((a, b) => ORDEM[a.cargo] - ORDEM[b.cargo])
  const convida = async (e: FormEvent) => {
    e.preventDefault()
    const nome = convidado.trim()
    setEnviado(null)
    if (await fazer('convite', { action: 'convite.enviar', nome })) {
      setEnviado(nome)
      setConvidado('')
    }
  }
  return (
    <>
      <Cab t="Membros" s="Líder, vice-líder e membros" />
      <ul className="co-mems fundo">
        {membros.map((p) => (
          <li key={p.id}>
            <Monograma nome={p.personagem} cargo={p.cargo} />
            <div className="co-mid">
              <strong>
                {p.personagem}
                {p.eu && (
                  <>
                    {' '}
                    <small>você</small>
                  </>
                )}
              </strong>
              <small>desde {dia(p.entrouAt)}</small>
            </div>
            <Selo c={p.cargo === 'lider' ? 'lid' : p.cargo === 'vice' ? 'ava' : 'seu'}>{CORP_CARGO_ROTULO[p.cargo]}</Selo>
            {lider && !p.eu && (
              <button className="co-ger chanfro" aria-label={`Gerir ${p.personagem}`} onClick={() => onGerir(p)}>
                ···
              </button>
            )}
          </li>
        ))}
      </ul>

      <Cab t="Convidar um Record" s="Convite direto pelo nome do personagem" />
      <section className="s-placa fundo">
        <form onSubmit={convida}>
          <label className="s-rot" htmlFor="co-nome">
            Nome do personagem
          </label>
          <input
            className="s-in"
            id="co-nome"
            maxLength={40}
            value={convidado}
            placeholder="Como os NPCs chamam o Record"
            autoComplete="off"
            onChange={(e) => {
              setConvidado(e.target.value)
              setErro(null)
            }}
          />
          <button className="r-bt chanfro s-larga co-mt" disabled={convidado.trim().length < 2 || !!ocupado}>
            Convidar
          </button>
        </form>
        <Erro>{erro}</Erro>
        {enviado && (
          <p className="s-ok fundo" role="status">
            Convite enviado para {enviado}.
          </p>
        )}
        {!decide && <p className="r-sub">Convites de membros passam pelo líder ou vice-líder antes da entrada.</p>}
        {m.convitesEnviados.length > 0 && (
          <ul className="co-pend" aria-label="Convites pendentes">
            {m.convitesEnviados.map((v) => (
              <li key={v.id}>
                <span>
                  {v.para} <small>· por {v.de ?? '—'}</small>
                </span>
                {decide || (me && v.de === me.personagem) ? (
                  <button className="r-link" disabled={!!ocupado} onClick={() => void fazer(`vc:${v.id}`, { action: 'convite.cancelar', id: v.id }, 'close')}>
                    Cancelar
                  </button>
                ) : (
                  <Selo>Pendente</Selo>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Cab t="Jogos coletivos especiais" s={d.jogos.provisorio ? 'Em breve · provisório' : 'Em breve'} />
      {d.jogos.lista.length ? (
        <ul className="co-lista">
          {d.jogos.lista.map((j) => (
            <li key={j.id} className="co-jogo fundo">
              <div className="s-lin">
                <strong>{j.titulo}</strong>
                <Selo>Em breve</Selo>
              </div>
              <p className="r-sub">{j.descricao}</p>
              <small className={m.membros >= j.minMembros ? 'ok' : undefined}>
                Mínimo de {j.minMembros} membros · vocês são {m.membros}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio t="Em breve">A Companhia ainda não anunciou jogos coletivos.</Vazio>
      )}

      <Cab t="Corporações rivais" s="Provisório" />
      {m.rivais.length ? (
        <ul className="co-mems fundo">
          {m.rivais.map((r) => (
            <li key={r.nome}>
              <div className="co-mini">
                <BrasaoPx b={r.brasao} mini />
              </div>
              <div className="co-mid">
                <strong>{r.nome}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio t="Nenhuma rivalidade registrada">Tome cuidado com as Corporações Rivais e com as Corporações Globais.</Vazio>
      )}

      <button className="r-bt chanfro j-perigo s-larga co-mt" onClick={onSair}>
        Sair da Corporação
      </button>
    </>
  )
}

function Pedidos({ m, agir, setNota }: { m: MinhaCorp; agir: Agir; setNota: (n: string | null) => void }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  return (
    <>
      <Cab t="Pedidos de entrada" s="Você vê só as partes do perfil permitidas pela Companhia" />
      <Erro>{erro}</Erro>
      {m.pedidos.length ? (
        <ul className="co-lista">
          {m.pedidos.map((p) => (
            <li key={p.id} className="co-req-p fundo" aria-label={`Pedido de ${p.perfil.personagem}`}>
              <div className="co-top">
                <Monograma nome={p.perfil.personagem} />
                <div className="co-mid">
                  <strong>{p.perfil.personagem}</strong>
                  <small>
                    {p.origem === 'convite' ? `Convite de ${p.convidadoPor ?? 'um membro'}` : 'Pelo código'} · {dia(p.createdAt)}
                  </small>
                </div>
              </div>
              <dl className="s-dl">
                {p.perfil.registroDesde !== undefined && (
                  <div>
                    <dt>No DEVO desde</dt>
                    <dd>{dia(p.perfil.registroDesde)}</dd>
                  </div>
                )}
                {p.perfil.deadlyVotes && (
                  <div>
                    <dt>Deadly Votes</dt>
                    <dd>
                      {p.perfil.deadlyVotes.participou} · sobreviveu a {p.perfil.deadlyVotes.sobreviveu}
                    </dd>
                  </div>
                )}
                {p.perfil.cartas !== undefined && (
                  <div>
                    <dt>Cartas</dt>
                    <dd>{p.perfil.cartas}</dd>
                  </div>
                )}
                {p.perfil.aparencia !== undefined && (
                  <div>
                    <dt>Aparência</dt>
                    <dd>{p.perfil.aparencia ? `${p.perfil.aparencia.nome} · ${p.perfil.aparencia.tipo}` : '—'}</dd>
                  </div>
                )}
              </dl>
              <div className="s-duo">
                <button
                  className="r-bt chanfro s-forte"
                  disabled={!!ocupado}
                  onClick={async () => (await fazer(`a:${p.id}`, { action: 'pedido.decidir', id: p.id, decisao: 'aprovar' })) && setNota(`${p.perfil.personagem} entrou na Corporação.`)}
                >
                  Aprovar
                </button>
                <button className="r-bt chanfro" disabled={!!ocupado} onClick={() => void fazer(`r:${p.id}`, { action: 'pedido.decidir', id: p.id, decisao: 'recusar' }, 'close')}>
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio t="Nenhum pedido">Quando alguém usar o código da Corporação, o pedido aparece aqui.</Vazio>
      )}
    </>
  )
}

function Cartas({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { state } = useDevo()
  const { ocupado, erro, setErro, fazer } = useAcao(agir)
  const outros = m.membrosLista.filter((p) => !p.eu)
  const [para, setPara] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  const cartas = useMemo(() => [...state.inventory].sort((a, b) => b.acquiredAt - a.acquiredAt), [state.inventory])
  const carta = cartas.find((c) => c.uid === uid)
  const dest = outros.find((p) => p.id === para)
  const restam = Math.max(0, m.transferenciasPorDia - m.transferenciasHoje)
  return (
    <>
      <Cab t="Transferir carta" s={`Entre membros · ${restam} de ${m.transferenciasPorDia} hoje`} />
      {outros.length ? (
        <section className="s-placa fundo">
          <small className="co-rot">Para quem</small>
          <div className="co-quem" role="group" aria-label="Destinatário">
            {outros.map((p) => (
              <button
                key={p.id}
                className="chanfro"
                aria-pressed={para === p.id}
                onClick={() => {
                  playSfx('card-select')
                  setPara(p.id)
                  setErro(null)
                }}
              >
                {p.personagem}
              </button>
            ))}
          </div>
          <small className="co-rot">Qual carta</small>
          {cartas.length ? (
            <ul className="i-cartas s-esc" aria-label="Suas cartas">
              {cartas.slice(0, 24).map((c) => (
                <li key={c.uid}>
                  <button
                    aria-pressed={uid === c.uid}
                    aria-label={`Escolher ${nomeCarta(c.cardId)}`}
                    onClick={() => {
                      playSfx('card-select')
                      setUid(uid === c.uid ? null : c.uid)
                      setErro(null)
                    }}
                  >
                    <CardFace cardId={c.cardId} className="w-full" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio t="Sem cartas">Você não tem cartas para transferir.</Vazio>
          )}
          <p className="r-sub">Cartas presas no Salão das Máscaras (Bandeja ou Mercado) não podem ser transferidas. A carta sai do seu inventário na hora.</p>
          <Erro>{erro}</Erro>
          {feito && (
            <p className="s-ok fundo" role="status">
              {feito}
            </p>
          )}
          <p className="co-rumo" aria-live="polite">
            {carta ? <b>{nomeCarta(carta.cardId)}</b> : 'Escolha uma carta'} <i aria-hidden="true">→</i> {dest ? <b>{dest.personagem}</b> : 'e um membro'}
          </p>
          <button
            className="r-bt chanfro s-forte s-larga"
            disabled={!carta || !dest || restam <= 0 || !!ocupado}
            onClick={async () => {
              if (!carta || !dest) return
              setFeito(null)
              if (await fazer('transf', { action: 'carta.transferir', uid: carta.uid, para: dest.id })) {
                setFeito(`${nomeCarta(carta.cardId)} foi para ${dest.personagem}.`)
                setUid(null)
              }
            }}
          >
            Transferir carta
          </button>
        </section>
      ) : (
        <Vazio t="Ninguém para receber">Convide Records para a Corporação; as cartas só circulam entre membros.</Vazio>
      )}
      <Cab t="Últimas transferências" />
      {m.transferencias.length ? (
        <ul className="co-tr fundo">
          {m.transferencias.map((t) => (
            <li key={t.id}>
              <span>
                <b>{nomeCarta(t.cardId)}</b> · {t.de} → {t.para}
              </span>
              <small>{dia(t.createdAt)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio t="Nada ainda">As cartas trocadas entre membros aparecem aqui.</Vazio>
      )}
    </>
  )
}

function Recrutar({ m, agir }: { m: MinhaCorp; agir: Agir }) {
  const { ocupado, erro, fazer } = useAcao(agir)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [publicado, setPublicado] = useState(false)
  if (!podeDecidir(m.meuCargo))
    return (
      <>
        <Cab t="Recrutamento" />
        <Vazio t="Só líder e vice">O anúncio de recrutamento no Salão das Máscaras é publicado pelo líder ou pelo vice-líder. Você pode convidar Records na aba Membros.</Vazio>
      </>
    )
  return (
    <>
      <Cab t="Anunciar no Salão" s="Recrutamento no mural do Salão das Máscaras" />
      <section className="s-placa fundo">
        <p className="r-sub">O código de identificação vai junto no anúncio. Um anúncio por dia.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setPublicado(false)
            if (await fazer('rec', { action: 'recrutamento.publicar', titulo, texto })) {
              setPublicado(true)
              setTitulo('')
              setTexto('')
            }
          }}
        >
          <label className="s-rot" htmlFor="co-rt">
            Título
          </label>
          <input className="s-in" id="co-rt" maxLength={80} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Procuramos jogadores de nervos firmes" />
          <label className="s-rot co-mt" htmlFor="co-rx">
            Texto
          </label>
          <textarea className="s-in" id="co-rx" maxLength={480} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Quem vocês procuram e o que oferecem" />
          {publicado && (
            <p className="s-ok fundo" role="status">
              Anúncio publicado no Salão das Máscaras.
            </p>
          )}
          <Erro>{erro}</Erro>
          <button className="r-bt chanfro s-forte s-larga co-mt" disabled={titulo.trim().length < 3 || texto.trim().length < 3 || !!ocupado}>
            Publicar no Salão
          </button>
        </form>
      </section>
    </>
  )
}

function CodigoRegras({ d }: { d: CorpLiberado }) {
  const [aberto, setAberto] = useState(false)
  return (
    <section className="co-regras fundo" aria-label={d.regras.titulo}>
      <button
        className="co-reg-bt"
        aria-expanded={aberto}
        onClick={() => {
          playSfx(aberto ? 'close' : 'open')
          setAberto(!aberto)
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={corpArte('selo-p')} alt="" />
        <span>
          <strong>{d.regras.titulo}</strong>
          <small>Oficial ou Necro-Corporação{d.regras.provisorio ? ' · texto provisório' : ''}</small>
        </span>
        <i aria-hidden="true">{aberto ? '−' : '+'}</i>
      </button>
      {aberto && (
        <ol>
          {d.regras.artigos.map((a) => (
            <li key={a}>{a}</li>
          ))}
          <li className="co-alerta">Quando essas regras são violadas, a Corporação passa a ser classificada como terrorista: uma Necro-Corporação.</li>
        </ol>
      )}
    </section>
  )
}
