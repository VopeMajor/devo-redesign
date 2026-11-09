'use client'

import { Fragment, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { arteDe, comum, type ArteTipo } from '@/lib/devo/arcanos-arte'
import { type ArcanoKey, type ArcanoVista, custoDoProximo, ESTAGIO_MAX, type EstagioVista, numeralEstagio, VIRTUDES, type VirtudesPayload } from '@/lib/devo/virtudes'
import { sentir } from '@/components/devo/arcanos/fx'
import { useVirtudes } from '@/components/devo/virtudes/virtudes-app'
import { erroTexto, Seta } from '../comum'
import { MetalNaipes, NaipeV2, nomeArcano } from './virtudes-naipe'

/**
 * Arcanos no v2 (protótipo kit3/os-arcanos.js, aprovado), no modo das telas de personagem e de Eidolons do Star
 * Rail: a coleção dos vinte e dois com o Arcano original em destaque, a página de cada Arcano (figura pintada,
 * trilha dos Estágios 0..VII, Descrição e Fisiologia), evoluir com Fragmentos Arcanos (I = 25 … VII = 1600),
 * despertar outro com Grande Fragmento Arcano (entra no Estágio 0) e a escolha do prêmio "Arcano" entre três.
 * Dados e ações: o MESMO payload e as mesmas ações da tela antiga (/api/virtudes: arcano.evoluir, arcano.despertar,
 * arcano.escolher). Dos Arcanos que o jogador não tem, o servidor só manda numeral, nome e a frase breve; Estágios
 * futuros vêm só com o nome. Owner/Anfitrião (verTodos) abrem todos, sem custo. Os textos são os do servidor
 * (lib/devo/arcanos-textos.ts ou o texto editado pelo Owner), sem nada escrito aqui: Estágio sem nome fica
 * "Ainda não revelado" e Estágio sem corpo fica "Ainda sem texto".
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>
type Aba = 'estagios' | 'descricao' | 'fisiologia'
type Aviso = { tom: 'ok' | 'erro'; texto: string } | null

async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/virtudes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível concluir. Tente de novo.')
  return j
}

export function ArcanosV2() {
  const { data, error, isLoading, mutate } = useVirtudes()
  if (!data) {
    return (
      <div className="a-msg">
        {error ? (
          <>
            <p role="alert">{(error as Error).message.replace('As Virtudes', 'Os Arcanos')}</p>
            <button type="button" className="r-bt chanfro" onClick={() => void mutate()}>
              Tentar de novo
            </button>
          </>
        ) : (
          <p role="status">{isLoading ? 'Alinhando os Arcanos…' : ''}</p>
        )}
      </div>
    )
  }
  if (!data.liberado) {
    return (
      <div className="a-msg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/v2/art/os/px/aco/cadeado.png" alt="" />
        <strong>Arcanos trancados</strong>
        <p>{data.motivo}</p>
      </div>
    )
  }
  return <Arcanos d={data} />
}

/* ------------------------------------------------------------------ peças */

/** Arte pintada do Arcano (registro estático de lib/devo/arcanos-arte); some se faltar ou falhar. */
function Arte({ k, tipo, sizes, className, alt = '', lazy }: { k: ArcanoKey; tipo: ArteTipo; sizes: string; className?: string; alt?: string; lazy?: boolean }) {
  const a = arteDe(k, tipo)
  const [falhou, setFalhou] = useState(false)
  if (!a || falhou) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={a.src} srcSet={a.srcSet} sizes={sizes} alt={alt} loading={lazy ? 'lazy' : undefined} decoding="async" onError={() => setFalhou(true)} />
}

/** Losangos do Estágio (0..VII): alcançados cheios, o atual aceso. */
function Pips({ n }: { n: number }) {
  return (
    <span className="a-pips" aria-hidden="true">
      {Array.from({ length: ESTAGIO_MAX + 1 }, (_, i) => (
        <i key={i} className={i < n ? 'f' : i === n ? 'a' : undefined} />
      ))}
    </span>
  )
}

function Recursos({ d }: { d: Liberado }) {
  const g = d.grandesFragmentos
  return (
    <div className="a-rec">
      <span title="Fragmentos Arcanos" aria-label={`${d.fragmentos} Fragmentos Arcanos`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/v2/art/os/poco/fragmento.png" alt="" />
        <b>{d.fragmentos}</b>
        <small>Fragmentos</small>
      </span>
      <span title="Grandes Fragmentos Arcanos" aria-label={`${g} ${g === 1 ? 'Grande Fragmento Arcano' : 'Grandes Fragmentos Arcanos'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/v2/art/os/poco/grande-fragmento.png" alt="" />
        <b>{g}</b>
        <small>Grandes</small>
      </span>
    </div>
  )
}

/** Trecho com *destaque* no meio da frase. */
function emLinha(t: string): ReactNode[] {
  return t.split(/(\*[^*\n]+\*)/g).map((parte, i) => (/^\*[^*\n]+\*$/.test(parte) ? <b key={i}>{parte.slice(1, -1)}</b> : <Fragment key={i}>{parte}</Fragment>))
}

/**
 * Texto longo (o mesmo formato da tela antiga): parágrafos por linha em branco; linha inteira entre *asteriscos* vira
 * subtítulo, ou frase em destaque se terminar em pontuação.
 */
function Texto({ texto }: { texto: string }) {
  const blocos = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  return (
    <>
      {blocos.map((b, i) => {
        const m = /^\*([^*]+)\*$/.exec(b)
        if (m && !/[.!?…:]$/.test(m[1].trim())) return <h5 key={i}>{m[1].trim()}</h5>
        if (m)
          return (
            <p key={i} className="a-dest">
              {m[1].trim()}
            </p>
          )
        return (
          <p key={i} style={{ whiteSpace: 'pre-line' }}>
            {emLinha(b)}
          </p>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ tela */

function Arcanos({ d }: { d: Liberado }) {
  const { mutate } = useVirtudes()
  const original = d.arcanos.find((a) => a.proprio) ?? null
  const [vista, setVista] = useState<'lista' | 'detalhe'>('lista')
  const [k, setK] = useState<ArcanoKey>(original?.key ?? 'forca')
  const [aba, setAba] = useState<Aba>('estagios')
  const [filtro, setFiltro] = useState<'todos' | 'seus'>('todos')
  const [estSel, setEstSel] = useState<number | null>(null)
  const [pedindo, setPedindo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [busy, setBusy] = useState(false)
  const [escSel, setEscSel] = useState<ArcanoKey | null>(null)
  /** Estágio recém-alcançado: acende a trilha e o palco por um instante. */
  const [subiu, setSubiu] = useState<number | null>(null)
  const marca = useRef<HTMLSpanElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)
  const voltarPara = useRef<string | null>(null)

  useEffect(() => {
    if (vista === 'detalhe') titulo.current?.focus({ preventScroll: true })
    else if (voltarPara.current) {
      const raiz = marca.current?.parentElement
      raiz?.querySelector<HTMLElement>(`.a-grade [data-k="${voltarPara.current}"]`)?.focus({ preventScroll: false })
      voltarPara.current = null
    }
  }, [vista, k])
  useEffect(() => {
    if (subiu == null) return
    const t = setTimeout(() => setSubiu(null), 1600)
    return () => clearTimeout(t)
  }, [subiu])

  const topo = () => marca.current?.closest('.corpo')?.scrollTo({ top: 0 })
  const abrir = (key: ArcanoKey) => {
    sentir('abrir')
    setVista('detalhe')
    setK(key)
    setAba('estagios')
    setEstSel(null)
    setPedindo(null)
    setAviso(null)
    topo()
  }
  const voltar = () => {
    sentir('voltar')
    voltarPara.current = k
    setVista('lista')
    setPedindo(null)
    setAviso(null)
  }

  const agir = async (body: Record<string, unknown>, ok: string, depois?: () => void) => {
    setBusy(true)
    setAviso(null)
    setPedindo(null)
    try {
      await post(body)
      playSfx('confirm')
      await mutate().catch(() => undefined)
      depois?.()
      setAviso({ tom: 'ok', texto: ok })
    } catch (e) {
      playSfx('error')
      setAviso({ tom: 'erro', texto: erroTexto(e, 'Não foi possível concluir. Tente de novo.') })
    } finally {
      setBusy(false)
    }
  }

  /** Botão que pede um segundo toque antes de gastar (Confirmar / Cancelar), como no protótipo. */
  const botao = (acao: string, rotulo: string, confirmar: string, des: boolean, faz: () => void) =>
    pedindo === acao && !des ? (
      <div className="a-confirma">
        <button type="button" className="r-bt s-forte" disabled={busy} onClick={faz}>
          {confirmar}
        </button>
        <button type="button" className="r-bt" onClick={() => setPedindo(null)}>
          Cancelar
        </button>
      </div>
    ) : (
      <button
        type="button"
        className="r-bt a-bt"
        disabled={des || busy}
        aria-busy={busy || undefined}
        onClick={() => {
          playSfx('click')
          setPedindo(acao)
          setAviso(null)
        }}
      >
        {busy ? 'Aguarde…' : rotulo}
      </button>
    )
  const avisoEl = aviso ? (
    <p className={'a-aviso' + (aviso.tom === 'erro' ? ' erro' : '')} role={aviso.tom === 'erro' ? 'alert' : 'status'}>
      {aviso.texto}
    </p>
  ) : null

  const a = vista === 'detalhe' ? d.arcanos.find((x) => x.key === k) : undefined

  return (
    <>
      <span ref={marca} hidden />
      <MetalNaipes />
      {a ? (
        <Detalhe
          a={a}
          d={d}
          aba={aba}
          estSel={estSel}
          subiu={subiu}
          tituloRef={titulo}
          onVoltar={voltar}
          onAba={(x) => {
            if (x !== aba) sentir('toque')
            setAba(x)
          }}
          onEstagio={(i) => {
            sentir('toque')
            setEstSel(i)
            setAba('estagios')
          }}
          botao={botao}
          aviso={avisoEl}
          onEvoluir={(de) =>
            void agir({ action: 'arcano.evoluir', arcano: a.key, de }, `Estágio ${numeralEstagio(de + 1)} alcançado.`, () => {
              setEstSel(null)
              setSubiu(de + 1)
            })
          }
          onDespertar={() => void agir({ action: 'arcano.despertar', arcano: a.key }, `${a.titulo} despertou. Estágio 0, A Essência.`, () => setSubiu(0))}
        />
      ) : (
        <Lista d={d} original={original} filtro={filtro} onFiltro={(f) => {
            if (f !== filtro) sentir('toque')
            setFiltro(f)
          }} onAbrir={abrir} />
      )}
      {d.escolha && (
        <Escolha
          escolha={d.escolha}
          sel={escSel}
          onSel={(x) => {
            playSfx('click')
            setEscSel(x)
            setPedindo(null)
          }}
          botao={botao}
          aviso={avisoEl}
          onEscolher={(o) =>
            void agir({ action: 'arcano.escolher', escolha: d.escolha!.id, arcano: o.key }, `O ${o.titulo} agora é seu.`, () => {
              setVista('detalhe')
              setK(o.key)
              setAba('estagios')
              setEstSel(null)
              setEscSel(null)
              topo()
            })
          }
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ coleção dos vinte e dois */

function Lista({
  d,
  original,
  filtro,
  onFiltro,
  onAbrir,
}: {
  d: Liberado
  original: ArcanoVista | null
  filtro: 'todos' | 'seus'
  onFiltro: (f: 'todos' | 'seus') => void
  onAbrir: (k: ArcanoKey) => void
}) {
  const seus = d.arcanos.filter((x) => x.posse)
  const itens = filtro === 'todos' ? d.arcanos : seus
  const po = original?.posse
  const nomeEst = original?.detalhe?.estagios[po?.estagio ?? 0]?.nome
  return (
    <>
      <header className="a-topo">
        <div>
          <small>Arcanos maiores</small>
          <h3>Os vinte e dois</h3>
        </div>
        <Recursos d={d} />
      </header>
      <p className="a-sub">
        {d.verTodos
          ? 'Acesso da equipe: todos os Arcanos abrem. O jogador só abre o próprio.'
          : 'Cada pessoa desperta sob um Arcano. Outros só despertam com um Grande Fragmento Arcano; dos que você não tem, só se sabe o nome.'}
      </p>
      {original ? (
        <button type="button" className="a-heroi" data-k={original.key} onClick={() => onAbrir(original.key)}>
          <Arte k={original.key} tipo="figura" sizes="(min-width: 900px) 420px, 70vw" className="a-heroi-fig" />
          <span className="a-heroi-tx">
            <small>Seu Arcano · original</small>
            <b>{original.numeral}</b>
            <strong>{nomeArcano(original.titulo)}</strong>
            <em>
              Estágio {numeralEstagio(po?.estagio ?? d.estagio)} · {nomeEst || 'Ainda não revelado'}
            </em>
            <Pips n={po?.estagio ?? d.estagio} />
            <u>
              Ver Arcano <Seta />
            </u>
          </span>
        </button>
      ) : (
        !d.verTodos && (
          <p className="v-aviso" role="status">
            Seu Arcano aparece quando o Anfitrião registrá-lo.
          </p>
        )
      )}
      <div className="a-filtro" role="group" aria-label="Filtrar">
        {(
          [
            ['todos', 'Todos', d.arcanos.length],
            ['seus', 'Seus', seus.length],
          ] as const
        ).map(([f, r, n]) => (
          <button key={f} type="button" aria-pressed={filtro === f} onClick={() => onFiltro(f)}>
            {r} <i>{n}</i>
          </button>
        ))}
      </div>
      {itens.length ? (
        <ul className="a-grade">
          {itens.map((x) => {
            const p = x.posse
            const nome = nomeArcano(x.titulo)
            return (
              <li key={x.key}>
                <button
                  type="button"
                  className={'a-carta' + (p ? ' tem' : '') + (x.detalhe ? '' : ' fechada')}
                  data-k={x.key}
                  aria-label={`${x.numeral} · ${nome}${p ? `${p.original ? ', seu Arcano original' : ', despertado'}, Estágio ${numeralEstagio(p.estagio)}` : ', não despertado'}`}
                  onClick={() => onAbrir(x.key)}
                >
                  <span className="a-moldura">
                    <Arte k={x.key} tipo="retrato" sizes="(min-width: 900px) 150px, 30vw" lazy />
                    <i className="a-num">{x.numeral}</i>
                    {p && <i className="a-est">{numeralEstagio(p.estagio)}</i>}
                    {p?.original && (
                      <i className="a-orig" title="Original" aria-hidden="true">
                        ★
                      </i>
                    )}
                  </span>
                  <span className="a-nome">{nome}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="a-it">Nenhum Arcano seu ainda.</p>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ página do Arcano */

type Botao = (acao: string, rotulo: string, confirmar: string, des: boolean, faz: () => void) => ReactNode

function Detalhe({
  a,
  d,
  aba,
  estSel,
  subiu,
  tituloRef,
  onVoltar,
  onAba,
  onEstagio,
  botao,
  aviso,
  onEvoluir,
  onDespertar,
}: {
  a: ArcanoVista
  d: Liberado
  aba: Aba
  estSel: number | null
  subiu: number | null
  tituloRef: RefObject<HTMLHeadingElement | null>
  onVoltar: () => void
  onAba: (a: Aba) => void
  onEstagio: (i: number) => void
  botao: Botao
  aviso: ReactNode
  onEvoluir: (de: number) => void
  onDespertar: () => void
}) {
  const T = a.detalhe
  const ab = !!T
  const p = a.posse
  const equipe = d.verTodos
  const nome = nomeArcano(a.titulo)
  const estagios = T?.estagios ?? []
  const atual = p?.estagio ?? 0
  const sel = Math.min(Math.max(0, estSel ?? atual), Math.max(0, estagios.length - 1))
  const orbital = comum('orbital')
  const abas: [Aba, string][] = [
    ['estagios', 'Estágios'],
    ['descricao', 'Descrição'],
    ['fisiologia', 'Fisiologia'],
  ]

  return (
    <>
      <div className="a-volta-linha">
        <button type="button" className="a-volta" onClick={onVoltar}>
          <Seta volta />
          Os vinte e dois
        </button>
        <Recursos d={d} />
      </div>
      <div className="a-pagina">
        <section className={'a-palco' + (ab ? '' : ' fechada') + (subiu != null ? ' a-evoluiu' : '')} aria-label={`${a.numeral} · ${nome}`}>
          {orbital && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="a-orbita" src={orbital.src} srcSet={orbital.srcSet} sizes="(min-width: 900px) 480px, 100vw" alt="" decoding="async" />
          )}
          <Arte key={a.key} k={a.key} tipo="figura" sizes="(min-width: 900px) 480px, 80vw" className="a-fig" alt={nome} />
          <div className="a-nomeplaca">
            <b>{a.numeral}</b>
            <div>
              <small>{p ? (p.original ? 'Seu Arcano · original' : 'Despertado') : 'Não despertado'}</small>
              <h3 ref={tituloRef} tabIndex={-1}>
                {nome}
              </h3>
            </div>
          </div>
          {T && (T.excelente || T.deficiente) && (
            <div className="a-afin">
              {T.excelente && (
                <span title="Virtude excelente">
                  <NaipeV2 k={T.excelente} />
                  <small>Excelente</small>
                  <em>{VIRTUDES[T.excelente].nome}</em>
                </span>
              )}
              {T.deficiente && (
                <span className="def" title="Virtude deficiente">
                  <NaipeV2 k={T.deficiente} cl="apagado" />
                  <small>Deficiente</small>
                  <em>{VIRTUDES[T.deficiente].nome}</em>
                </span>
              )}
            </div>
          )}
        </section>

        <section className="a-info">
          <p className="a-breve">{a.breve}</p>
          {ab && (
            <ol className="a-trilha" aria-label="Estágios 0 a VII">
              {estagios.map((e, i) => (
                <li key={e.numero}>
                  <button
                    type="button"
                    className={[e.estado === 'aberto' ? '' : e.estado, i === sel ? 'sel' : '', subiu === i ? 'a-subiu' : ''].filter(Boolean).join(' ') || undefined}
                    aria-pressed={i === sel}
                    aria-current={e.estado === 'atual' ? 'step' : undefined}
                    aria-label={`Estágio ${numeralEstagio(e.numero)}${e.revelado ? ': ' + e.nome : ''}`}
                    onClick={() => onEstagio(i)}
                  >
                    {numeralEstagio(e.numero)}
                  </button>
                </li>
              ))}
            </ol>
          )}
          {ab && (
            <div className="a-abas" role="tablist" aria-label="Sobre o Arcano">
              {abas.map(([x, r]) => (
                <button key={x} type="button" role="tab" aria-selected={aba === x} onClick={() => onAba(x)}>
                  {r}
                </button>
              ))}
            </div>
          )}
          {T &&
            (aba === 'estagios' ? (
              estagios[sel] && <CartaoEstagio key={sel} e={estagios[sel]} equipe={equipe} />
            ) : (
              <div className="a-texto" role="tabpanel" key={aba}>
                <Texto texto={aba === 'descricao' ? T.descricao : T.fisiologia} />
              </div>
            ))}
          {a.provisorio && ab && aba !== 'estagios' && <p className="a-prov">Rascunho: o texto deste Arcano ainda não é do dono.</p>}

          {p ? (
            <Evolucao a={a} d={d} botao={botao} aviso={aviso} onEvoluir={onEvoluir} />
          ) : (
            <section className="a-acao">
              <h5>Despertar</h5>
              <p>
                Despertar este Arcano o coloca no Estágio 0, A Essência, com evolução própria. Seu Arcano original continua definindo as Virtudes.{' '}
                {equipe
                  ? 'Para a equipe, sem custo.'
                  : d.grandesFragmentos
                    ? `Você tem ${d.grandesFragmentos} ${d.grandesFragmentos === 1 ? 'Grande Fragmento Arcano' : 'Grandes Fragmentos Arcanos'}.`
                    : ''}
              </p>
              {botao('despertar', 'Despertar com Grande Fragmento Arcano', equipe ? `Despertar ${nome}` : `Confirmar: gastar 1 para ${nome}`, !equipe && d.grandesFragmentos < 1, onDespertar)}
              {!equipe && d.grandesFragmentos < 1 && <p className="a-falta">Você não tem um Grande Fragmento Arcano.</p>}
              {aviso}
            </section>
          )}
        </section>
      </div>
    </>
  )
}

/** O Estágio tocado na trilha. Futuro (jogador): só o nome, que o servidor manda. Sem nome: ainda não revelado. */
function CartaoEstagio({ e, equipe }: { e: EstagioVista; equipe: boolean }) {
  const n = numeralEstagio(e.numero)
  const mostra = equipe || e.estado !== 'futuro'
  const classe = e.estado === 'aberto' ? '' : e.estado
  return (
    <article className={['a-est-cartao', classe].filter(Boolean).join(' ')} role="tabpanel">
      <header>
        <b>{n}</b>
        <div>
          <small>
            Estágio {n}
            {e.estado === 'atual' ? ' · atual' : e.estado === 'passado' ? ' · alcançado' : ''}
          </small>
          <h4>{e.revelado ? e.nome : 'Ainda não revelado'}</h4>
        </div>
      </header>
      {!e.revelado ? (
        <p className="a-it">Ainda sem texto.</p>
      ) : !mostra ? (
        <p className="a-it">O que este Estágio desperta se revela quando você chegar a ele.</p>
      ) : e.linha || e.texto ? (
        <>
          {e.linha && <p>{e.linha}</p>}
          {e.texto && <Texto texto={e.texto} />}
        </>
      ) : (
        <p className="a-it">Ainda sem texto.</p>
      )}
    </article>
  )
}

function Evolucao({ a, d, botao, aviso, onEvoluir }: { a: ArcanoVista; d: Liberado; botao: Botao; aviso: ReactNode; onEvoluir: (de: number) => void }) {
  const p = a.posse!
  const equipe = d.verTodos
  const atual = p.estagio
  const custo = custoDoProximo(atual)
  if (custo == null)
    return (
      <section className="a-acao">
        <h5>Evolução</h5>
        <p>Estágio {numeralEstagio(ESTAGIO_MAX)} alcançado. Não há Estágio além deste.</p>
        {aviso}
      </section>
    )
  const para = atual + 1
  const prox = a.detalhe?.estagios[para]
  const falta = equipe ? 0 : Math.max(0, custo - d.fragmentos)
  const cheio = equipe ? 100 : Math.min(100, (d.fragmentos / custo) * 100)
  return (
    <section className="a-acao">
      <h5>Evolução</h5>
      <div className="a-custo">
        <span>
          <small>Próximo</small>
          <b>Estágio {numeralEstagio(para)}</b>
          <em>{prox?.nome || 'Ainda não revelado'}</em>
        </span>
        <span>
          <small>Custo</small>
          <b>{equipe ? 'Sem custo' : custo}</b>
          <em>{equipe ? 'Equipe' : 'Fragmentos Arcanos'}</em>
        </span>
      </div>
      <div className="a-barra-frag" aria-hidden="true">
        <i style={{ width: `${cheio.toFixed(1)}%` }} />
      </div>
      {p.original && <p className="a-it">Este é o seu Arcano original: ao evoluir, os Pontos de Potencial acumulados se espalham pelas Virtudes.</p>}
      {botao(
        'evoluir',
        equipe ? `Evoluir para o Estágio ${numeralEstagio(para)} — sem custo` : `Evoluir para o Estágio ${numeralEstagio(para)}`,
        equipe ? 'Confirmar Evolução' : `Confirmar: gastar ${custo}`,
        falta > 0,
        () => onEvoluir(atual),
      )}
      {falta > 0 && (
        <p className="a-falta">
          Faltam {falta} Fragmentos Arcanos (você tem {d.fragmentos} de {custo}).
        </p>
      )}
      {aviso}
    </section>
  )
}

/* ------------------------------------------------------------------ escolha do prêmio */

type Opcao = NonNullable<Liberado['escolha']>['opcoes'][number]

/**
 * Prêmio "Arcano" (dono, 22/10): o narrador indicou três Arcanos, um Anfitrião aprovou (`arcano_escolhas`) e o
 * jogador escolhe um. Fica por cima da tela enquanto a escolha estiver pendente. A escolha é definitiva.
 */
function Escolha({
  escolha,
  sel,
  onSel,
  botao,
  aviso,
  onEscolher,
}: {
  escolha: NonNullable<Liberado['escolha']>
  sel: ArcanoKey | null
  onSel: (k: ArcanoKey) => void
  botao: Botao
  aviso: ReactNode
  onEscolher: (o: Opcao) => void
}) {
  const alvo = escolha.opcoes.find((o) => o.key === sel) ?? null
  const n = escolha.opcoes.length
  const tit = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    tit.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section className="a-escolha" aria-label="Escolha o seu Arcano">
      <small>{escolha.origem || 'Prêmio'}</small>
      <h3 ref={tit} tabIndex={-1}>
        Escolha o seu Arcano
      </h3>
      <p>O narrador separou {n === 1 ? 'um Arcano' : `${n} Arcanos`} para você. O que escolher vira o seu Arcano original, no Estágio 0, e não poderá ser trocado.</p>
      <ul>
        {escolha.opcoes.map((o) => (
          <li key={o.key}>
            <button type="button" className={'a-carta' + (sel === o.key ? ' tem' : '')} aria-pressed={sel === o.key} onClick={() => onSel(o.key)}>
              <span className="a-moldura">
                <Arte k={o.key} tipo="retrato" sizes="(min-width: 900px) 170px, 30vw" />
                <i className="a-num">{o.numeral}</i>
              </span>
              <span className="a-nome">{nomeArcano(o.titulo)}</span>
            </button>
          </li>
        ))}
      </ul>
      {alvo && (
        <>
          <p className="a-it">{alvo.breve}</p>
          {botao('escolher', `Escolher o ${alvo.titulo}`, `Confirmar: ${alvo.titulo}`, false, () => onEscolher(alvo))}
        </>
      )}
      {aviso}
    </section>
  )
}
