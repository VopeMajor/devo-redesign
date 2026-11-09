'use client'

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { playSfx, pocoSilencio, pocoSom } from '@/lib/devo/audio'
import { arteEssencia } from '@/lib/devo/essencias-arte'
import {
  CATEGORIA_RESULTADO_LABEL,
  dentroDaJanela,
  type LinhaChance,
  type ManivelaParams,
  POCO_LIXO,
  type PocoBalde,
  type PocoLetreiro,
  type PocoMoeda,
  type PocoPayload,
  type PocoPesos,
  type PocoResultado,
  ponteiro,
} from '@/lib/devo/poco'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { useMediaQuery } from '@/components/devo/hooks'
import { arteItem } from '@/components/devo/poco/poco-itens'
import { PremioArte } from '@/components/devo/poco/poco-resultado'
import { callName, useDevo } from '@/components/devo/state/devo-store'
import { erroTexto, Legado, px } from '../comum'
import { NeblinaV2 } from './poco-neblina'
import { OwnerProbabilidades } from './poco-owner'

/**
 * Poço dos Milagres no v2 (protótipo kit3/os-poco.js): o palco com a cena, as etiquetas do balde e do giro grátis,
 * o ⋯ das moedas e chances, o letreiro dos prêmios e as três ações (Lançar Moeda, Girar Manivela, Inspecionar Balde).
 * Tudo é decidido no servidor (/api/poco), como no jogo: o giro grátis, o consumo da moeda, os parâmetros do ponteiro
 * da manivela (o cliente só manda os instantes dos toques), o prêmio (sorteado antes da revelação), o lançamento
 * múltiplo (a 1ª moeda passa pela manivela; as outras saem juntas depois) e a troca de balde. Primeira entrada: a cena
 * da neblina (poco-neblina.tsx), que entrega o Dracma Incomum. O painel de probabilidades do Owner fica em "Suas
 * moedas", dentro de <Legado>; a Mesa do Poço (prêmios do Owner) continua na Mesa da equipe, no Record.
 */

type Liberado = Extract<PocoPayload, { liberado: true }>
type Pagina = 'tela' | 'moedas' | 'lancar' | 'baldes' | 'multi'
type Multi = { lista: PocoResultado[]; erro: string | null; moeda: string }

const ART = '/v2/art/os/poco'
const po = (a: string) => `${ART}/${a}.png`
const DRACMAS = new Set(['dracma_comum', 'dracma_incomum', 'dracma_rara'])
const BALDES_PX = new Set(['madeira', 'ferro', 'cobre', 'prata'])
const PACOTES = new Set(['iniciante', 'intermediario', 'presente', 'xadrez'])
const GRANDE_FRAGMENTO = 'grande_fragmento_arcano'
const MULTIPLOS = [5, 10, 15, 20]
const TIER: Record<ItemRarity, 1 | 2 | 3 | 4> = { comum: 1, incomum: 2, raro: 3, epico: 4, lendario: 4, arcano: 4 }

const artMoeda = (k: string) => (DRACMAS.has(k) ? po(k.replace('_', '-')) : (arteItem(k, 64)?.src ?? po('dracma-comum')))
const artBalde = (id: string) => (BALDES_PX.has(id) ? po(`balde-${id}`) : (arteItem(`balde:${id}`, 64)?.src ?? po('balde-madeira')))
const rarCls = (r: ItemRarity) => (r === 'comum' ? 'r-comum' : r === 'incomum' ? 'r-incomum' : 'r-raro')
const pct = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Nível do som (0 = lixo, como no jogo) e da luz (o protótipo trata o lixo como nível 1). */
const tierSom = (r: PocoResultado): 0 | 1 | 2 | 3 | 4 => (r.categoria === 'lixo' || !r.item ? 0 : TIER[r.item.raridade] ?? 1)
const nomeDe = (r: PocoResultado) => (r.categoria === 'lixo' ? (r.lixo?.nome ?? 'Nada') : (r.item?.nome ?? ''))

function destino(r: PocoResultado) {
  if (r.categoria === 'lixo') return 'Não vai para o inventário.'
  if (r.categoria === 'capsula') return 'Guardada no seu Diário.'
  if (r.categoria === 'cosmetico' || r.item?.kind === 'cosmetico') return 'Guardado nos seus cosméticos.'
  if (r.item?.meta.premio === 'tempo') return 'Somado ao seu Tempo.'
  if (r.item?.meta.premio === 'carta') return 'Entregue nas suas Cartas.'
  return 'Guardado no seu inventário.'
}

/** Arte do resultado no estilo do protótipo (pixel); null = sem arte aqui (cosmético, carta, Tempo): usa a do jogo. */
function arteDe(r: PocoResultado): { src: string; pixel: boolean } | null {
  if (r.categoria === 'lixo') {
    if (r.lixo?.imagem) return { src: r.lixo.imagem, pixel: false }
    const id = r.lixo && POCO_LIXO.some((l) => l.id === r.lixo!.id) ? r.lixo.id : 'nada'
    return { src: po(`lixo-${id.replace(/_/g, '-')}`), pixel: true }
  }
  const it = r.item
  if (!it) return null
  const meta = it.meta ?? {}
  if (typeof meta.imagem === 'string' && meta.imagem) return { src: meta.imagem, pixel: false }
  if (meta.premio === 'carta' || meta.premio === 'tempo') return null
  if (it.kind === 'cosmetico' || r.categoria === 'cosmetico') return null
  if (it.kind === 'moeda') return { src: artMoeda(it.key), pixel: true }
  if (it.kind === 'pacote') {
    const id = it.key.replace(/^pacote:/, '')
    return PACOTES.has(id) ? { src: `/images/pacotes/${id}/arte-384.webp`, pixel: false } : null
  }
  if (it.kind === 'capsula' || r.categoria === 'capsula') return { src: po('capsula'), pixel: true }
  if (it.kind === 'essencia' || r.categoria === 'essencia') {
    const e = arteEssencia(it.key, 128)
    return e ? { src: e.src, pixel: false } : { src: po('essencia'), pixel: true }
  }
  if (it.key === GRANDE_FRAGMENTO) return { src: po('grande-fragmento'), pixel: true }
  if (it.kind === 'fragmento' || r.categoria === 'fragmento') return { src: po('fragmento'), pixel: true }
  return null
}

function Arte({ r, nome, lado }: { r: PocoResultado; nome: string; lado: number }) {
  const a = arteDe(r)
  // eslint-disable-next-line @next/next/no-img-element
  if (a) return <img className={a.pixel ? 'pixel' : undefined} src={a.src} alt="" />
  return (
    <span className="p-arte" aria-hidden="true" style={{ width: lado, height: lado, '--c': '220 218 214' } as CSSProperties}>
      <PremioArte r={r} nome={nome} />
    </span>
  )
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'O poço não respondeu.')
  return j as T
}

async function post<T = Record<string, unknown>>(url: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'O poço não respondeu.')
  return j as T
}

const poco = (action: string, extra: Record<string, unknown> = {}) => post<Record<string, unknown>>('/api/poco', { action, ...extra })

/** A janela (.jan) em volta do componente: as camadas da revelação e da neblina cobrem a janela inteira. */
function useJan() {
  const ref = useRef<HTMLDivElement>(null)
  const [jan, setJan] = useState<HTMLElement | null>(null)
  // fora de uma janela (não deveria acontecer), as camadas cobrem a página: a neblina nunca deixa de abrir
  useEffect(() => setJan((ref.current?.closest('.jan') as HTMLElement | null) ?? document.body), [])
  return [ref, jan] as const
}

/** Tempo até o próximo giro grátis (HH:MM:SS); ao zerar, pede os dados de novo. */
function Falta({ alvo, onZero }: { alvo: number; onZero: () => void }) {
  const [agora, setAgora] = useState(() => Date.now())
  const avisou = useRef(false)
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const ms = Math.max(0, alvo - agora)
  useEffect(() => {
    if (ms === 0 && !avisou.current) {
      avisou.current = true
      onZero()
    }
  }, [ms, onZero])
  const s = Math.floor(ms / 1000)
  const txt = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return <time aria-label="Próximo giro grátis">{txt}</time>
}

/* ================================ entrada ================================ */

export function PocoV2() {
  const { state } = useDevo()
  const { data, error, isLoading, mutate } = useSWR<PocoPayload>('/api/poco', getJson, { revalidateOnFocus: false })
  // a cena abre sozinha na primeira entrada e fica aberta até o fim, mesmo depois de a moeda ser entregue
  const [cena, setCena] = useState<'auto' | 'aberta' | 'fechada'>('auto')
  const aberta = !!data && data.liberado && (cena === 'aberta' || (cena === 'auto' && !data.apresentado))
  useEffect(() => {
    if (aberta && cena === 'auto') setCena('aberta')
  }, [aberta, cena])

  if (!data || !data.liberado) {
    return (
      <div id="poc">
        <div className="p-msg">
          {!data ? (
            error ? (
              <>
                <p role="alert">{(error as Error).message}</p>
                <button type="button" className="r-bt chanfro" onClick={() => mutate()}>
                  Tentar de novo
                </button>
              </>
            ) : (
              <p aria-live="polite">{isLoading ? 'Descendo a rua de barro…' : ''}</p>
            )
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/v2/art/os/px/aco/cadeado.png" alt="" />
              <small>Sistema trancado</small>
              <strong>Poço dos Milagres</strong>
              <p>{data.motivo}</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Tela
      data={data}
      refresh={() => void mutate()}
      setAberto={(aberto) => void mutate((d) => (d && d.liberado ? { ...d, aberto } : d), { revalidate: true })}
      nome={callName(state) || null}
      genero={state.profile?.gender}
      cena={aberta}
      onCenaFim={() => {
        setCena('fechada')
        void mutate()
      }}
    />
  )
}

/* ================================ tela do poço ================================ */

function Tela({
  data,
  refresh,
  setAberto,
  nome,
  genero,
  cena,
  onCenaFim,
}: {
  data: Liberado
  refresh: () => void
  setAberto: (a: Liberado['aberto']) => void
  nome: string | null
  genero: string | null | undefined
  cena: boolean
  onCenaFim: () => void
}) {
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [raiz, jan] = useJan()
  const [pagina, setPagina] = useState<Pagina>('tela')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [queda, setQueda] = useState<{ k: number; src: string } | null>(null)
  const [manivela, setManivela] = useState<ManivelaParams | null>(null)
  const [subindo, setSubindo] = useState(false)
  const [resultado, setResultado] = useState<PocoResultado | null>(null)
  const [multi, setMulti] = useState<Multi | null>(null)
  const timers = useRef<number[]>([])
  const suspense = useRef(0)
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      window.clearTimeout(suspense.current)
    },
    [],
  )
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const aberto = data.aberto
  const fase: 'vazio' | 'moeda' | 'cheio' = !aberto ? 'vazio' : aberto.estado === 'girado' ? 'cheio' : 'moeda'
  const balde = data.baldes.find((b) => b.id === (aberto?.balde ?? data.baldeAtual)) ?? data.baldes[0]
  const baldeId = balde?.id ?? 'madeira'
  const nomeMoeda = (k: string) => data.moedas.find((m) => m.key === k)?.nome ?? k

  const vai = (p: Pagina) => {
    setPagina(p)
    raiz.current?.closest('.corpo')?.scrollTo({ top: 0 })
  }
  const falhar = (e: unknown) => {
    setErro(erroTexto(e, 'O poço não respondeu.'))
    playSfx('error')
  }

  /* ---- lançar: a moeda cai e afunda (o servidor consome a moeda ou o giro grátis) ---- */
  const lancar = async (o: { gratis: true } | { moeda: string }) => {
    setOcupado('gratis' in o ? 'gratis' : o.moeda)
    setErro(null)
    try {
      const r = await poco('moeda.lancar', o)
      setAberto((r.aberto as Liberado['aberto']) ?? null)
      vai('tela')
      if (!reduzido) {
        setQueda({ k: Date.now(), src: artMoeda('gratis' in o ? data.giroGratis.categoria : o.moeda) })
        later(() => setQueda(null), 650)
      }
      // tinido na mão, respingo quando a moeda toca a água
      playSfx('coin')
      later(() => playSfx('splash'), reduzido ? 0 : 600)
      if (!reduzido) later(() => pocoSom('nevoa'), 1150)
      return true
    } catch (e) {
      falhar(e)
      return false
    } finally {
      setOcupado(null)
    }
  }

  // Lançamento múltiplo: a 1ª moeda cai e o jogador gira a manivela como num giro normal; quando o balde sobe, o
  // servidor resolve as outras moedas e todos os resultados aparecem juntos.
  const lote = useRef<{ moeda: string; restantes: number } | null>(null)
  const lancarVarias = async (moeda: string, vezes: number) => {
    lote.current = { moeda, restantes: vezes - 1 }
    if (!(await lancar({ moeda }))) lote.current = null
  }

  const fecharLote = async () => {
    const l = lote.current
    if (!l) return
    lote.current = null
    setOcupado('balde')
    try {
      const primeiro = (await poco('balde.inspecionar')).resultado as PocoResultado
      let lista: PocoResultado[] = [primeiro]
      let falha: string | null = null
      if (l.restantes > 0) {
        const r = await poco('moeda.varias', { moeda: l.moeda, vezes: l.restantes })
        lista = [primeiro, ...((r.resultados ?? []) as PocoResultado[])]
        falha = (r.erro as string | null) ?? null
      }
      setMulti({ lista, erro: falha, moeda: l.moeda })
      vai('multi')
      const melhor = lista.reduce((a, b) => (tierSom(b) > tierSom(a) ? b : a), lista[0])
      pocoSom(tierSom(melhor) === 0 ? 'flop' : 'revela', tierSom(melhor))
    } catch (e) {
      falhar(e)
    } finally {
      setOcupado(null)
      refresh()
    }
  }

  /* ---- manivela: o servidor manda os parâmetros do ponteiro e confere os toques ---- */
  const fimSuspense = () => {
    if (!suspense.current) return
    window.clearTimeout(suspense.current)
    suspense.current = 0
    setSubindo(false)
    pocoSom('balde')
    void fecharLote()
  }

  const finalizarGiro = async (toques: number[]) => {
    setManivela(null)
    setOcupado('girar')
    setSubindo(true)
    pocoSom('manivela')
    try {
      await poco('manivela.girar', { toques })
      refresh()
      suspense.current = window.setTimeout(fimSuspense, reduzido ? 0 : 2000)
    } catch (e) {
      setSubindo(false)
      falhar(e)
      refresh()
    } finally {
      setOcupado(null)
    }
  }
  // o timer guarda a primeira versão de fimSuspense; ela só usa refs, refresh e setters, que não mudam de sentido
  const finalizarRef = useRef(finalizarGiro)
  finalizarRef.current = finalizarGiro
  const aoFimManivela = useCallback((t: number[]) => void finalizarRef.current(t), [])

  const girar = async () => {
    if (!aberto) return
    setErro(null)
    if (aberto.estado === 'girando') return finalizarGiro([])
    setOcupado('girar')
    try {
      const r = await poco('manivela.iniciar', { lento: reduzido })
      playSfx('click')
      setManivela(r.params as ManivelaParams)
    } catch (e) {
      falhar(e)
      refresh()
    } finally {
      setOcupado(null)
    }
  }

  /* ---- balde: inspecionar (revelação) ou escolher qual desce ---- */
  const inspecionar = async () => {
    setErro(null)
    if (fase !== 'cheio') {
      playSfx('open')
      vai('baldes')
      return
    }
    setOcupado('balde')
    try {
      const r = await poco('balde.inspecionar')
      setResultado(r.resultado as PocoResultado)
    } catch (e) {
      falhar(e)
      refresh()
    } finally {
      setOcupado(null)
    }
  }

  const escolherBalde = async (id: string) => {
    setOcupado('balde')
    setErro(null)
    try {
      await poco('balde.escolher', { balde: id })
      playSfx('confirm')
      refresh()
    } catch (e) {
      falhar(e)
    } finally {
      setOcupado(null)
    }
  }

  const salvarProbabilidades = async (v: Record<string, PocoPesos>) => {
    await post('/api/staff', { action: 'config.definir', key: 'poco.probabilidades', value: v, provisional: true })
    refresh()
  }

  const voltar = () => {
    playSfx('close')
    setErro(null)
    vai('tela')
  }

  const camadas = (
    <>
      {cena && jan && (
        <NeblinaV2
          jan={jan}
          nome={nome}
          genero={genero}
          moedas={data.moedas}
          podePular={data.podePular}
          onMoeda={async () => {
            await poco('apresentacao.concluir')
          }}
          onFim={onCenaFim}
        />
      )}
      {resultado && jan && (
        <Revelacao
          jan={jan}
          r={resultado}
          sub={[nomeMoeda(resultado.moeda), resultado.categoria === 'premio' ? CATEGORIA_RESULTADO_LABEL.premio : null, resultado.gratis ? 'giro grátis' : null].filter(Boolean).join(' · ')}
          nome={nome || 'Você'}
          onFechar={() => {
            setResultado(null)
            refresh()
          }}
        />
      )}
    </>
  )

  /* ---- subpáginas (no lugar do palco, como no protótipo) ---- */
  if (pagina === 'moedas' || pagina === 'lancar') {
    return (
      <div id="poc" ref={raiz}>
        <Moedas data={data} lancando={pagina === 'lancar'} ocupado={ocupado} erro={erro} onVolta={voltar} onLancar={lancar} onLancarVarias={lancarVarias} onSalvar={salvarProbabilidades} refresh={refresh} />
        {camadas}
      </div>
    )
  }
  if (pagina === 'baldes') {
    return (
      <div id="poc" ref={raiz}>
        <Baldes baldes={data.baldes} atual={data.baldeAtual} ocupado={!!ocupado} erro={erro} onVolta={voltar} onEscolher={escolherBalde} />
        {camadas}
      </div>
    )
  }
  if (pagina === 'multi' && multi) {
    return (
      <div id="poc" ref={raiz}>
        <Varias
          m={multi}
          moedaNome={nomeMoeda(multi.moeda)}
          nome={nome || 'Você'}
          onVolta={() => {
            playSfx('confirm')
            setMulti(null)
            vai('tela')
            refresh()
          }}
        />
        {camadas}
      </div>
    )
  }

  const dica = subindo
    ? 'O balde sobe pela corrente…'
    : fase === 'vazio'
      ? 'Lance uma moeda no poço.'
      : fase === 'moeda'
        ? aberto?.estado === 'girando'
          ? 'A manivela ficou no meio. Termine o giro.'
          : 'A moeda afundou. Gire a manivela.'
        : 'O balde subiu. Inspecione o balde.'
  const palco = subindo ? 'moeda' : fase
  const gratis = data.giroGratis.disponivel

  return (
    <div id="poc" className="p-fixo" ref={raiz}>
      <div className={`p-palco ${palco}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={po('cena')} alt="O poço milenar na neblina" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {queda && <img key={queda.k} className="p-moeda cai" src={queda.src} alt="" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {palco === 'cheio' && <img className="p-balde" src={artBalde(baldeId)} alt="" />}
        <div className="p-tags">
          <span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artBalde(baldeId)} alt="" />
            {(balde?.nome ?? '').split(' ').slice(0, 3).join(' ')}
          </span>
          <span className={gratis ? 'on' : undefined}>{gratis ? 'Giro grátis disponível' : 'Giro grátis usado hoje'}</span>
        </div>
        <button
          type="button"
          className="p-info chanfro"
          id="p-moedas"
          aria-label="Suas moedas"
          onClick={() => {
            playSfx('open')
            setErro(null)
            vai('moedas')
          }}
        >
          ⋯
        </button>
      </div>
      <Letreiro reais={data.letreiro} simulacao={data.simulacao} />
      <div className="p-base" id="p-base">
        {manivela ? (
          <Manivela params={manivela} onFim={aoFimManivela} />
        ) : (
          <>
            <p className="p-dica" aria-live="polite">
              {dica}
            </p>
            {erro && (
              <p className="r-erro" role="alert">
                {erro}
              </p>
            )}
            {subindo && !reduzido && (
              <button
                type="button"
                className="r-link"
                onClick={() => {
                  pocoSilencio()
                  playSfx('click')
                  fimSuspense()
                }}
              >
                Acelerar
              </button>
            )}
            <div className="p-acoes">
              <button
                type="button"
                className={`p-ac chanfro${fase === 'vazio' && !subindo ? ' on' : ''}`}
                id="p-lanca"
                disabled={fase !== 'vazio' || !!ocupado || subindo}
                onClick={() => {
                  playSfx('click')
                  setErro(null)
                  vai('lancar')
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={po('dracma-incomum')} alt="" />
                <span>Lançar Moeda</span>
              </button>
              <button
                type="button"
                className={`p-ac chanfro${fase === 'moeda' && !subindo ? ' on' : ''}`}
                id="p-gira"
                disabled={fase !== 'moeda' || !!ocupado || subindo}
                aria-busy={ocupado === 'girar' || undefined}
                onClick={() => {
                  playSfx('click')
                  void girar()
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={px('ajustes')} alt="" />
                <span>Girar Manivela</span>
              </button>
              <button
                type="button"
                className={`p-ac chanfro${fase === 'cheio' && !subindo ? ' on' : ''}`}
                id="p-balde"
                disabled={!!ocupado || subindo}
                aria-busy={(ocupado === 'balde' && fase === 'cheio') || undefined}
                onClick={() => {
                  playSfx('click')
                  void inspecionar()
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artBalde(baldeId)} alt="" />
                <span>Inspecionar Balde</span>
              </button>
            </div>
          </>
        )}
      </div>
      {camadas}
    </div>
  )
}

/* ================================ navegação das subpáginas ================================ */

function Nav({ titulo, sub, onVolta }: { titulo: string; sub: string; onVolta: () => void }) {
  return (
    <div className="c-nav">
      <button type="button" className="m-volta chanfro" id="p-volta" aria-label="Voltar ao poço" onClick={onVolta}>
        ‹
      </button>
      <div>
        <small>{sub}</small>
        <strong>{titulo}</strong>
      </div>
    </div>
  )
}

/* ================================ moedas e chances / lançar ================================ */

function Moedas({
  data,
  lancando,
  ocupado,
  erro,
  onVolta,
  onLancar,
  onLancarVarias,
  onSalvar,
  refresh,
}: {
  data: Liberado
  lancando: boolean
  ocupado: string | null
  erro: string | null
  onVolta: () => void
  onLancar: (o: { gratis: true } | { moeda: string }) => void
  onLancarVarias: (moeda: string, vezes: number) => void
  onSalvar: (v: Record<string, PocoPesos>) => Promise<void>
  refresh: () => void
}) {
  const g = data.giroGratis
  const base = data.moedas.find((m) => m.key === g.categoria)?.nome ?? 'Dracma Comum'
  const linhas = (k: string): LinhaChance[] => data.chances?.[k] ?? []
  return (
    <>
      <Nav titulo={lancando ? 'Lançar Moeda' : 'Suas moedas'} sub="Poço dos Milagres" onVolta={onVolta} />
      <p className="r-sub">{lancando ? 'Escolha o que vai para o fundo do poço. Depois, gire a manivela.' : 'Cada moeda abre a sua própria categoria de sorteio. Lançada, não volta.'}</p>
      {lancando && g.disponivel && (
        <button type="button" className="r-bt chanfro p-grat" id="p-grat" disabled={!!ocupado} aria-busy={ocupado === 'gratis' || undefined} onClick={() => onLancar({ gratis: true })}>
          Giro grátis · {base}
        </button>
      )}
      {lancando ? (
        !g.disponivel && (
          <p className="r-sub p-gratis">
            Giro grátis usado hoje. Volta em <Falta alvo={g.proximoEm} onZero={refresh} />
          </p>
        )
      ) : (
        <p className="r-sub p-gratis">
          Todo dia há um giro grátis na categoria do {base}.{' '}
          {g.disponivel ? (
            'Disponível agora.'
          ) : (
            <>
              Volta em <Falta alvo={g.proximoEm} onZero={refresh} />
            </>
          )}
        </p>
      )}
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
      <ul className="p-lista">
        {data.moedas.map((m) => (
          <LinhaMoeda key={m.key} m={m} base={m.key === g.categoria} linhas={linhas(m.key)} lancando={lancando} ocupado={ocupado} onLancar={onLancar} onLancarVarias={onLancarVarias} />
        ))}
      </ul>
      <p className="r-sub">Cada acerto na manivela diminui a chance de lixo.</p>
      {!lancando && data.owner && (
        <div className="p-owner">
          <Legado>
            <OwnerProbabilidades owner={data.owner} moedas={data.moedas} onSalvar={onSalvar} />
          </Legado>
        </div>
      )}
    </>
  )
}

function LinhaMoeda({
  m,
  base,
  linhas,
  lancando,
  ocupado,
  onLancar,
  onLancarVarias,
}: {
  m: PocoMoeda
  base: boolean
  linhas: LinhaChance[]
  lancando: boolean
  ocupado: string | null
  onLancar: (o: { moeda: string }) => void
  onLancarVarias: (moeda: string, vezes: number) => void
}) {
  const pode = m.quantidade > 0 && m.categoriaAtiva
  return (
    <li className={`fundo${m.quantidade === 0 ? ' p-zero' : ''}`}>
      <div className="p-m">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artMoeda(m.key)} alt="" />
        <div>
          <strong>{m.nome}</strong>
          <small>
            ×{m.quantidade} · {ITEM_RARITY_LABEL[m.raridade]} · {base ? 'Sorteio base' : 'Categoria especial'}
            {!m.categoriaAtiva && ' · ainda não definida'}
          </small>
        </div>
      </div>
      {m.descricao && <p className="r-sub">{m.descricao}</p>}
      {linhas.length > 0 && (
        <dl className="p-ch" aria-label={`Chances de ${m.nome}`}>
          {linhas.map((l) => (
            <div key={l.chave}>
              <dt className={l.premio ? 'p-premio' : undefined}>{l.nome}</dt>
              <dd>{pct(l.pct)}%</dd>
            </div>
          ))}
        </dl>
      )}
      {lancando && (
        <>
          <div className="r-acoes">
            <button type="button" className="r-bt chanfro" disabled={!pode || !!ocupado} aria-busy={ocupado === m.key || undefined} aria-label={`Lançar ${m.nome}`} onClick={() => onLancar({ moeda: m.key })}>
              Lançar
            </button>
            {MULTIPLOS.filter((n) => n === MULTIPLOS[0] || m.quantidade >= n).map((n) => (
              <button
                key={n}
                type="button"
                className="r-bt chanfro"
                disabled={!pode || m.quantidade < n || !!ocupado}
                aria-label={`Lançar ${n} ${m.nome} de uma vez`}
                onClick={() => onLancarVarias(m.key, n)}
              >
                Lançar {n}
              </button>
            ))}
          </div>
          {!pode && <p className="r-sub">{!m.categoriaAtiva ? 'Categoria ainda não definida.' : 'Você não tem esta moeda.'}</p>}
        </>
      )}
    </li>
  )
}

/* ================================ baldes ================================ */

function Baldes({
  baldes,
  atual,
  ocupado,
  erro,
  onVolta,
  onEscolher,
}: {
  baldes: PocoBalde[]
  atual: string
  ocupado: boolean
  erro: string | null
  onVolta: () => void
  onEscolher: (id: string) => void
}) {
  return (
    <>
      <Nav titulo="Baldes" sub="Inspecionar Balde" onVolta={onVolta} />
      <p className="r-sub">O balde vazio espera no fundo. Escolha qual desce na próxima coleta.</p>
      {erro && (
        <p className="r-erro" role="alert">
          {erro}
        </p>
      )}
      <ul className="p-lista">
        {baldes.map((b) => (
          <li key={b.id} className={`fundo${b.possui ? '' : ' p-sem'}`}>
            <div className="p-m">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artBalde(b.id)} alt="" />
              <div>
                <strong>{b.nome}</strong>
                <small className={rarCls(b.raridade)}>
                  {b.tipo === 'inicial' ? 'Inicial' : ITEM_RARITY_LABEL[b.raridade]}
                  {b.provisorio && ' · provisório'}
                </small>
              </div>
            </div>
            {b.possui && b.descricao && <p className="r-sub">{b.descricao}</p>}
            <p>{b.efeito}</p>
            {b.id === atual ? (
              <p className="p-uso">Em uso</p>
            ) : b.possui ? (
              <button type="button" className="r-bt chanfro" disabled={ocupado} aria-label={`Usar ${b.nome}`} onClick={() => onEscolher(b.id)}>
                Usar
              </button>
            ) : (
              <p className="p-bloq">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/v2/art/os/px/aco/cadeado.png" alt="" />
                Bloqueado
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="r-sub">Há baldes mais raros que nem aparecem aqui até serem encontrados.</p>
    </>
  )
}

/* ================================ letreiro ================================ */

type Aviso = { k: string; nome: string; item: string }

/**
 * Letreiro dos prêmios: um aviso por vez. Primeiro os reais (os mais recentes que ainda não passaram); entre eles,
 * a cada 12–18 s, um prêmio simulado com nome fictício (pedido do dono: dar a sensação de gente girando; os nomes já
 * vêm do servidor filtrados contra as contas reais). Os simulados nunca tiram a vez de um real.
 */
function Letreiro({ reais, simulacao }: { reais: PocoLetreiro[]; simulacao: Liberado['simulacao'] }) {
  const vistos = useRef(new Set<string>())
  const fila = useRef<Aviso[]>([])
  const [atual, setAtual] = useState<Aviso | null>(null)

  useEffect(() => {
    const novos = reais
      .filter((r) => !vistos.current.has(`${r.nome}-${r.quando}`))
      .slice(0, 4)
      .reverse()
      .map((r) => ({ k: `${r.nome}-${r.quando}`, nome: r.nome, item: r.item }))
    for (const n of novos) vistos.current.add(n.k)
    fila.current = [...novos, ...fila.current.filter((a) => !a.k.startsWith('sim-'))]
  }, [reais])

  useEffect(() => {
    let t = 0
    const proximo = (espera: number) => {
      t = window.setTimeout(() => {
        let a = fila.current.shift() ?? null
        if (!a && simulacao.nomes.length && simulacao.itens.length) {
          const n = simulacao.nomes[Math.floor(Math.random() * simulacao.nomes.length)]
          const it = simulacao.itens[Math.floor(Math.random() * simulacao.itens.length)]
          a = { k: `sim-${Date.now()}`, nome: n, item: it.item }
        }
        setAtual(a)
        proximo(a && !a.k.startsWith('sim-') ? 5600 : 12000 + Math.random() * 6000)
      }, espera)
    }
    proximo(700)
    return () => window.clearTimeout(t)
  }, [simulacao])

  return (
    <p className="p-faixa" aria-live="off" aria-label="Prêmios do poço">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={px('poco')} alt="" />
      <span id="p-let">{atual ? `${atual.nome} · ${atual.item}` : 'O poço guarda silêncio.'}</span>
    </p>
  )
}

/* ================================ manivela ================================ */

/**
 * Minigame da manivela (timing), no desenho do protótipo (p-man): o ponteiro vai e volta no trilho; toque quando ele
 * passar pela janela. Cada acerto encolhe a janela e acelera o ponteiro; um erro (ou a demora) solta a manivela.
 * Os parâmetros vêm do servidor (ManivelaParams); o cliente só registra os INSTANTES dos toques, e o servidor conta
 * os acertos com a mesma conta (lib/devo/poco.ts › avaliarToques). Movimento reduzido: o servidor manda o ponteiro
 * mais lento.
 */
function Manivela({ params, onFim }: { params: ManivelaParams; onFim: (toques: number[]) => void }) {
  const total = params.rodadas.length
  const [rodada, setRodada] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [fim, setFim] = useState<null | 'perfeito' | 'escapou' | 'soltou'>(null)
  const t0 = useRef(0)
  const inicio = useRef(0)
  const rodadaRef = useRef(0)
  const toques = useRef<number[]>([])
  const encerrado = useRef(false)
  const teclou = useRef(-1e9)
  const ponta = useRef<HTMLElement>(null)
  const puxa = useRef<HTMLButtonElement>(null)

  // relógio do minigame: começa quando monta (depois da resposta "iniciar" do servidor)
  useEffect(() => {
    t0.current = performance.now()
    puxa.current?.focus()
  }, [])

  const encerrar = useCallback(
    (motivo: 'perfeito' | 'escapou' | 'soltou') => {
      if (encerrado.current) return
      encerrado.current = true
      setFim(motivo)
      window.setTimeout(() => onFim([...toques.current]), motivo === 'soltou' ? 150 : 900)
    },
    [onFim],
  )

  useEffect(() => {
    if (fim) return
    let raf = 0
    const r = params.rodadas[rodada]
    const loop = () => {
      const rel = performance.now() - t0.current - inicio.current
      if (rel > params.rodadaMaxMs) {
        playSfx('error')
        encerrar('escapou')
        return
      }
      if (ponta.current) ponta.current.style.left = `${ponteiro(r, rel) * 100}%`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [rodada, fim, params, encerrar])

  const toque = useCallback(() => {
    if (encerrado.current) return
    const i = rodadaRef.current
    const agora = Math.round(performance.now() - t0.current)
    const r = params.rodadas[i]
    const ok = dentroDaJanela(r, ponteiro(r, agora - inicio.current))
    toques.current.push(agora)
    if (!ok) {
      playSfx('error')
      encerrar('escapou')
      return
    }
    setAcertos(i + 1)
    inicio.current = agora
    if (i === total - 1) {
      playSfx('confirm')
      encerrar('perfeito')
      return
    }
    pocoSom('catraca')
    rodadaRef.current = i + 1
    setRodada(i + 1)
  }, [params, total, encerrar])

  // Espaço / Enter puxam a manivela em qualquer ponto da janela (menos no "Soltar")
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if ((e.target as HTMLElement | null)?.id === 'p-solta') return
      e.preventDefault()
      teclou.current = performance.now()
      if (!e.repeat) toque()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toque])

  const r = params.rodadas[Math.min(rodada, total - 1)]
  return (
    <div className="p-man">
      <div className="p-pips" aria-hidden="true">
        {params.rodadas.map((_, i) => (
          <u key={i} className={i < acertos ? 'on' : undefined} />
        ))}
      </div>
      <span className="m-so" aria-live="polite" id="p-so">
        {acertos} de {total} acertos
      </span>
      <strong id="p-t">{fim === 'perfeito' ? 'Giro perfeito' : fim === 'escapou' ? 'A manivela escapou' : fim === 'soltou' ? 'Manivela solta' : 'Toque na janela'}</strong>
      <p id="p-d" className="r-sub">
        {fim ? `${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}: o balde está subindo.` : `Cada acerto melhora a coleta.${params.lento ? ' Ponteiro lento (movimento reduzido).' : ''}`}
      </p>
      <div className="p-trilho fundo" aria-hidden="true">
        <i id="p-j" style={{ left: `${(r.centro - r.janela / 2) * 100}%`, width: `${r.janela * 100}%` }} />
        <b id="p-p" ref={ponta} style={{ left: `${ponteiro(r, 0) * 100}%` }} />
      </div>
      <button
        type="button"
        ref={puxa}
        className="p-puxa chanfro"
        id="p-puxa"
        aria-label="Puxar a manivela"
        aria-describedby="p-d"
        disabled={!!fim}
        onPointerDown={(e) => {
          e.preventDefault()
          toque()
        }}
        onClick={(e) => {
          // ativação sem ponteiro e sem tecla (leitor de tela): conta como toque
          if (e.detail === 0 && performance.now() - teclou.current > 1500) toque()
        }}
      >
        Puxar
      </button>
      <button
        type="button"
        className="r-link"
        id="p-solta"
        hidden={!!fim}
        onClick={() => {
          playSfx('click')
          encerrar('soltou')
        }}
      >
        Soltar a manivela
      </button>
    </div>
  )
}

/* ================================ revelação ================================ */

/**
 * Revelação do balde (p-rev do protótipo): a coluna de luz sobe com a força da raridade (t1–t4), faíscas nos raros,
 * o suspense e o resultado. Um toque pula. Os sons são os do jogo (subida, falsa partida nos raros, sting ou flop).
 * O prêmio já foi decidido e entregue pelo servidor antes da animação.
 */
function Revelacao({ jan, r, sub, nome, onFechar }: { jan: HTMLElement; r: PocoResultado; sub: string; nome: string; onFechar: () => void }) {
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)')
  const ts = tierSom(r)
  const tier = Math.max(1, ts)
  const lixo = r.categoria === 'lixo'
  const [aberto, setAberto] = useState(reduzido)
  const ok = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (reduzido) {
      pocoSom(ts === 0 ? 'flop' : 'revela', ts)
      return
    }
    const t: number[] = []
    const em = (ms: number, fn: () => void) => t.push(window.setTimeout(fn, ms))
    if (ts === 0) {
      pocoSom('subida', 0)
      em(380, () => pocoSom('flop'))
      em(700, () => pocoSom('poeira'))
    } else if (ts >= 3) {
      // falsa partida: a luz sobe como a de um comum, engasga e só então vem a cor verdadeira
      pocoSom('subida', 1)
      em(620, () => pocoSom('falso'))
      em(900, () => pocoSom('subida', ts))
      em(1440, () => pocoSom('revela', ts))
    } else {
      pocoSom('subida', ts)
      em(840, () => pocoSom('revela', ts))
    }
    // (as capturas congelam a revelação com window.__pocoCongelado; no jogo é sempre falso)
    const mostra = () => ((window as unknown as { __pocoCongelado?: boolean }).__pocoCongelado ? em(150, mostra) : setAberto(true))
    em(tier >= 3 ? 1500 : 900, mostra)
    return () => t.forEach((x) => window.clearTimeout(x))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (aberto) ok.current?.focus()
  }, [aberto])

  const pular = () => {
    if (aberto) return
    pocoSilencio()
    playSfx('click')
    setAberto(true)
  }

  const meta = r.item?.meta ?? {}
  const texto = lixo ? r.lixo?.texto : r.categoria === 'capsula' ? String(meta.texto ?? r.item?.descricao ?? '') : r.item?.descricao
  const faiscas = tier >= 4 ? 14 : tier >= 3 ? 8 : 0

  return createPortal(
    <div className={`p-rev t${tier}${aberto ? ' fim' : ''}`} role="dialog" aria-modal="true" aria-label={`Resultado: ${nomeDe(r)}`} onClick={pular}>
      <i className="p-col" aria-hidden="true" />
      {Array.from({ length: faiscas }, (_, k) => (
        <u key={k} className="p-fa" aria-hidden="true" style={{ '--x': `${(k * 37 + 11) % 100}%`, '--d': `${((k * 13) % 8) / 10}s` } as CSSProperties} />
      ))}
      <span className="p-susp">{lixo ? 'Algo pinga no fundo…' : 'Algo sobe pela corrente…'}</span>
      <div className="p-res" hidden={!aberto}>
        <Arte r={r} nome={nome} lado={128} />
        <small>{sub}</small>
        <strong>
          {nomeDe(r)}
          {r.quantidade > 1 && ` ×${r.quantidade}`}
        </strong>
        <em>{lixo || !r.item ? CATEGORIA_RESULTADO_LABEL.lixo : ITEM_RARITY_LABEL[r.item.raridade]}</em>
        {texto && <p className={r.categoria === 'capsula' ? 'p-capsula' : undefined}>{texto}</p>}
        {meta.provisorio === true && <p className="p-not">Texto provisório</p>}
        <p className="p-not">{destino(r)}</p>
        <button
          type="button"
          className="r-bt chanfro"
          id="p-ok"
          ref={ok}
          onClick={(e) => {
            e.stopPropagation()
            playSfx('confirm')
            onFechar()
          }}
        >
          {lixo ? 'Devolver ao poço' : 'Guardar'}
        </button>
        <details className="p-selo">
          <summary>
            Selo do sorteio · {r.acertos} {r.acertos === 1 ? 'acerto' : 'acertos'}
          </summary>
          <dl>
            <dt>Compromisso (sha256)</dt>
            <dd>{r.seedHash}</dd>
            <dt>Segredo revelado</dt>
            <dd>{r.seed}</dd>
            <dt>Giro</dt>
            <dd>{r.id}</dd>
          </dl>
        </details>
      </div>
    </div>,
    jan,
  )
}

/* ================================ lançamento múltiplo ================================ */

function Varias({ m, moedaNome, nome, onVolta }: { m: Multi; moedaNome: string; nome: string; onVolta: () => void }) {
  const melhor = m.lista.reduce((a, b) => (tierSom(b) > tierSom(a) ? b : a), m.lista[0])
  return (
    <>
      <Nav titulo={`Poço dos Milagres · ×${m.lista.length}`} sub={moedaNome} onVolta={onVolta} />
      <ul className="p-lista p-multi">
        {m.lista.map((r) => {
          const lixo = r.categoria === 'lixo' || !r.item
          return (
            <li key={r.id} className="fundo">
              <Arte r={r} nome={nome} lado={64} />
              <div>
                <strong>
                  {nomeDe(r)}
                  {r.quantidade > 1 && ` ×${r.quantidade}`}
                </strong>
                <small className={lixo ? 'r-comum' : rarCls(r.item!.raridade)}>
                  {lixo ? CATEGORIA_RESULTADO_LABEL.lixo : ITEM_RARITY_LABEL[r.item!.raridade]}
                  {r === melhor && tierSom(melhor) > 0 && m.lista.length > 1 && ' · melhor do balde'}
                </small>
                <p className="r-sub">{destino(r)}</p>
              </div>
            </li>
          )
        })}
      </ul>
      {m.erro && (
        <p className="r-erro" role="alert">
          {m.erro}
        </p>
      )}
      <div className="p-fim">
        <button type="button" className="r-bt chanfro" onClick={onVolta}>
          Guardar tudo
        </button>
      </div>
      <p className="r-sub">Só a primeira moeda passa pela manivela; as outras saem com zero acertos.</p>
    </>
  )
}
