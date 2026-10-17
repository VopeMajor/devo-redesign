'use client'

import './poco.css'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx, pocoSilencio, pocoSom } from '@/lib/devo/audio'
import type { ManivelaParams, PocoLetreiro, PocoPayload, PocoPesos, PocoResultado } from '@/lib/devo/poco'
import { ITEM_RARITY_LABEL } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../hooks'
import { Button, Spinner } from '../kit/button'
import { EmblemMark, EmblemPoco } from '../kit/emblems'
import { callName, useDevo } from '../state/devo-store'
import { BaldesSheet, LancarSheet, MoedasSheet } from './poco-folhas'
import { Etiqueta, FaixaOrnamental, MedalhaoDentado, PlacaGotica } from './poco-ornamentos'
import { type BaldePosicao, PocoCena } from './poco-cena'
import { BaldePoco, IconeItemPoco, MoedaPoco } from './poco-itens'
import { PocoManivela } from './poco-manivela'
import { PocoNeblina } from './poco-neblina'
import { PocoMultiResultado, PocoResultadoView } from './poco-resultado'

type Liberado = Extract<PocoPayload, { liberado: true }>

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

const poco = (action: string, extra: Record<string, unknown> = {}) => post('/api/poco', { action, ...extra })

/**
 * Poço dos Milagres (DIRECAO-3 §2). Primeira entrada: a cena da neblina com a figura encapuzada (entrega o
 * Dracma Incomum, uma vez). Depois: o poço com Lançar Moeda / Girar Manivela / Inspecionar Balde, o ⋯ das
 * moedas, o letreiro dos últimos prêmios e a escolha de balde. Trancado até vencer o Deadly Vote tutorial
 * (Owner e Anfitrião: sempre liberado) — quem decide é o servidor.
 */
export function PocoApp() {
  const { state } = useDevo()
  const { data, error, isLoading, mutate } = useSWR<PocoPayload>('/api/poco', getJson, { revalidateOnFocus: false })
  // A cena abre sozinha na primeira entrada e fica aberta até o fim, mesmo depois de a moeda ser entregue.
  const [cena, setCena] = useState<'auto' | 'aberta' | 'fechada'>('auto')
  const aberta = !!data && data.liberado && (cena === 'aberta' || (cena === 'auto' && !data.apresentado))
  useEffect(() => {
    if (aberta && cena === 'auto') setCena('aberta')
  }, [aberta, cena])

  if (!data) {
    return (
      <Fundo palco="trancado">
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p className="font-body text-[16px] text-dv-text-2">{error.message}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Descendo a rua de barro…
            </p>
          )}
        </div>
      </Fundo>
    )
  }

  if (!data.liberado) return <Trancado motivo={data.motivo} />

  return (
    <>
      {aberta && (
        <PocoNeblina
          nome={callName(state) || null}
          genero={state.profile?.gender}
          moedas={data.moedas}
          podePular={data.podePular}
          onMoeda={async () => {
            await poco('apresentacao.concluir')
          }}
          onFim={() => {
            setCena('fechada')
            mutate()
          }}
        />
      )}
      <PocoTela data={data} refresh={() => mutate()} />
    </>
  )
}

function Fundo({ palco = 'tela', children, className }: { palco?: 'tela' | 'trancado'; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative h-full overflow-hidden bg-dv-ink [--poco-base:68cqh] [--poco-h:min(46vh,380px)] [--poco-top:47%]', className)}>
      <PocoCena palco={palco} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo palco="trancado">
      <div className="flex h-full flex-col justify-end px-4 pb-6">
        <section aria-label="Poço dos Milagres: trancado" className="animate-dv-rise relative" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--dv-text-rgb)/0.34),rgb(var(--dv-text-rgb)/0.12)_45%,rgb(var(--dv-text-rgb)/0.26))]" />
          <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
          <div className="relative flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemPoco} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Poço dos Milagres</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Fundo>
  )
}

/* ── Tela do poço ───────────────────────────────────────────────────────────────────────── */

function PocoTela({ data, refresh }: { data: Liberado; refresh: () => void }) {
  const { state } = useDevo()
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [folha, setFolha] = useState<null | 'moedas' | 'lancar' | 'baldes'>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [moedaAnim, setMoedaAnim] = useState(0)
  const [ativo, setAtivo] = useState(false)
  const [manivela, setManivela] = useState<ManivelaParams | null>(null)
  const [girando, setGirando] = useState(false)
  const [subindo, setSubindo] = useState(false)
  const [resultado, setResultado] = useState<PocoResultado | null>(null)
  const [multi, setMulti] = useState<{ lista: PocoResultado[]; erro: string | null } | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const nome = callName(state) || 'Você'

  const aberto = data.aberto
  const fase: 'vazio' | 'moeda' | 'cheio' = !aberto ? 'vazio' : aberto.estado === 'girado' ? 'cheio' : 'moeda'
  const balde: BaldePosicao = resultado || (fase === 'cheio' && !subindo) ? 'cima' : subindo ? 'subindo' : 'fundo'
  const baldeAtual = data.baldes.find((b) => b.id === (aberto?.balde ?? data.baldeAtual)) ?? data.baldes[0]

  const falhar = (e: unknown) => {
    setErro(e instanceof Error ? e.message : 'O poço não respondeu.')
    playSfx('error')
  }

  // Etapa 1 — ativação: a moeda cai, o anel acelera e a água acende.
  const lancar = async (o: { gratis: true } | { moeda: string }) => {
    setOcupado('gratis' in o ? 'gratis' : o.moeda)
    setErro(null)
    try {
      await poco('moeda.lancar', o)
      setFolha(null)
      setMoedaAnim((n) => n + 1)
      setAtivo(true)
      later(() => setAtivo(false), reduced ? 0 : 2200)
      // tinido na mão, respingo quando a moeda toca a água (o arco dura ~900 ms)
      playSfx('coin')
      later(() => playSfx('splash'), reduced ? 0 : 900)
      if (!reduced) later(() => pocoSom('nevoa'), 1150)
      refresh()
    } catch (e) {
      falhar(e)
    } finally {
      setOcupado(null)
    }
  }

  // Lançamento múltiplo (x5, x10): o servidor faz todos os giros e devolve os resultados de uma vez.
  const lancarVarias = async (moeda: string, vezes: number) => {
    setOcupado(`${moeda}x${vezes}`)
    setErro(null)
    try {
      const r = await poco('moeda.varias', { moeda, vezes })
      const lista = (r.resultados ?? []) as PocoResultado[]
      setFolha(null)
      playSfx('coin')
      later(() => playSfx('splash'), reduced ? 0 : 500)
      if (lista.length) setMulti({ lista, erro: (r.erro as string | null) ?? null })
      else if (r.erro) setErro(r.erro as string)
      refresh()
    } catch (e) {
      falhar(e)
    } finally {
      setOcupado(null)
    }
  }

  // Etapa 2 — suspense: depois do minigame, a roda gira e o balde sobe (o servidor já decidiu o prêmio).
  const terminarSuspense = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setGirando(false)
    setSubindo(false)
  }, [])

  const finalizarGiro = useCallback(
    async (toques: number[]) => {
      setManivela(null)
      setOcupado('girar')
      setGirando(true)
      setSubindo(true)
      pocoSom('manivela')
      try {
        await poco('manivela.girar', { toques })
        refresh()
        later(() => {
          terminarSuspense()
          pocoSom('balde')
        }, reduced ? 0 : 2000)
      } catch (e) {
        terminarSuspense()
        falhar(e)
        refresh()
      } finally {
        setOcupado(null)
      }
    },
    [refresh, reduced, terminarSuspense], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const girar = async () => {
    if (!aberto) return
    setErro(null)
    if (aberto.estado === 'girando') return finalizarGiro([])
    setOcupado('girar')
    try {
      const r = await poco('manivela.iniciar', { lento: reduced })
      playSfx('click')
      setManivela(r.params as ManivelaParams)
    } catch (e) {
      falhar(e)
      refresh()
    } finally {
      setOcupado(null)
    }
  }

  // Etapas 3 e 4 — revelação e resultado (PocoResultadoView).
  const inspecionar = async () => {
    setErro(null)
    if (fase !== 'cheio') {
      playSfx('open')
      setFolha('baldes')
      return
    }
    setOcupado('balde')
    try {
      const r = await poco('balde.inspecionar')
      const res = r.resultado as PocoResultado
      // os sons da revelação (subida, falsa partida, sting/flop) ficam com a própria revelação
      setResultado(res)
    } catch (e) {
      falhar(e)
      refresh()
    } finally {
      setOcupado(null)
    }
  }

  const escolherBalde = async (id: string) => {
    setOcupado('balde')
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

  const dica = subindo
    ? 'O balde sobe pela corrente…'
    : fase === 'vazio'
      ? 'Lance uma moeda no poço.'
      : fase === 'moeda'
        ? aberto?.estado === 'girando'
          ? 'A manivela ficou no meio. Termine o giro.'
          : 'A moeda afundou. Gire a manivela.'
        : 'O balde subiu. Inspecione o balde.'

  return (
    <div className="relative h-full overflow-hidden bg-dv-ink [--poco-base:65cqh] [--poco-h:min(50vh,410px)] [--poco-top:45%]">
      <PocoCena
        palco="tela"
        balde={balde}
        baldeTipo={baldeAtual?.id ?? 'madeira'}
        girando={girando}
        ativo={ativo || subindo || fase === 'cheio'}
        moeda={moedaAnim}
        brilho={fase === 'cheio' ? 0.95 : fase === 'moeda' ? 0.75 : 0.5}
      />

      <div className="relative z-10 flex h-full flex-col">
        <FaixaPremios reais={data.letreiro} simulacao={data.simulacao} />

        <div className="flex items-start justify-between gap-2 px-3 pt-1.5">
          <div className="animate-dv-fade flex min-w-0 flex-col gap-1">
            <Etiqueta joia={false} className="pl-2">
              <BaldePoco tipo={baldeAtual?.id} tamanho={28} className="h-7 w-7" />
              <span className="truncate font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-dv-text-2">{baldeAtual?.nome}</span>
            </Etiqueta>
            <Etiqueta aceso={data.giroGratis.disponivel}>
              <span className={cn('whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.12em]', data.giroGratis.disponivel ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                {data.giroGratis.disponivel ? 'Giro grátis disponível' : 'Giro grátis usado hoje'}
              </span>
            </Etiqueta>
          </div>
          <BotaoTresPontos onClick={() => setFolha('moedas')} />
        </div>

        <div className="min-h-0 flex-1" />

        <div className="px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
          <p aria-live="polite" className="mb-1.5 text-center font-body text-[15.5px] italic text-dv-text-2 [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]">
            {dica}
          </p>
          {erro && (
            <p role="alert" className="mb-2 border-l-2 border-dv-blood bg-dv-blood-deep/70 px-3 py-2 text-[13.5px] text-dv-blood-text">
              {erro}
            </p>
          )}
          <div className="grid grid-cols-[1fr_1.18fr_1fr] items-end gap-1.5">
            <Invocacao
              forma="placa"
              label="Lançar Moeda"
              curto="Moeda"
              ativo={fase === 'vazio'}
              disabled={fase !== 'vazio' || !!ocupado || subindo}
              onClick={() => {
                setErro(null)
                setFolha('lancar')
              }}
              icon={<MoedaPoco chave="dracma_incomum" tamanho={36} className="size-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />}
            />
            <Invocacao
              forma="medalhao"
              label="Girar Manivela"
              curto="Girar"
              ativo={fase === 'moeda' && !subindo}
              disabled={fase !== 'moeda' || !!ocupado || subindo}
              loading={ocupado === 'girar'}
              onClick={girar}
              icon={<img src="/images/poco/roda.webp" alt="" className={cn('w-14', girando && 'poco-roda-on')} />}
            />
            <Invocacao
              forma="placa"
              label="Inspecionar Balde"
              curto="Balde"
              ativo={fase === 'cheio' && !subindo}
              disabled={!!ocupado || subindo}
              loading={ocupado === 'balde' && fase === 'cheio'}
              onClick={inspecionar}
              icon={<BaldePoco tipo={baldeAtual?.id} tamanho={40} className="size-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />}
            />
          </div>
        </div>
      </div>

      {subindo && !reduced && (
        <button
          type="button"
          onClick={() => {
            pocoSilencio()
            playSfx('click')
            terminarSuspense()
          }}
          className="dv-focus absolute right-2 top-12 z-30 flex min-h-11 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2 [text-shadow:0_1px_6px_#000] hover:text-dv-text"
        >
          Acelerar
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
            <path d="M2 3l6 5-6 5zM8 3l6 5-6 5z" />
          </svg>
        </button>
      )}

      {manivela && <PocoManivela params={manivela} onFim={finalizarGiro} />}
      {resultado && (
        <PocoResultadoView
          r={resultado}
          nome={nome}
          onFechar={() => {
            setResultado(null)
            refresh()
          }}
        />
      )}

      <MoedasSheet open={folha === 'moedas'} onClose={() => setFolha(null)} moedas={data.moedas} giroGratis={data.giroGratis} chances={data.chances} owner={data.owner} onSalvarProbabilidades={salvarProbabilidades} />
      <LancarSheet open={folha === 'lancar'} onClose={() => setFolha(null)} moedas={data.moedas} giroGratis={data.giroGratis} ocupado={ocupado} erro={erro} onLancar={lancar} onLancarVarias={lancarVarias} />
      {multi && (
        <PocoMultiResultado
          lista={multi.lista}
          nome={nome}
          erro={multi.erro}
          onFechar={() => {
            setMulti(null)
            refresh()
          }}
        />
      )}
      <BaldesSheet open={folha === 'baldes'} onClose={() => setFolha(null)} baldes={data.baldes} atual={data.baldeAtual} ocupado={!!ocupado} onEscolher={escolherBalde} />
    </div>
  )
}

/** ⋯ no canto superior direito: losango de aço com três pontos de ametista (abre "Suas moedas"). */
function BotaoTresPontos({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Suas moedas"
      onClick={() => {
        playSfx('open')
        onClick()
      }}
      className="dv-focus group relative grid size-12 shrink-0 place-items-center transition-transform duration-[120ms] active:scale-95"
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <linearGradient id="poco-tp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6f1e7" />
            <stop offset="0.5" stopColor="#9a907f" />
            <stop offset="1" stopColor="#3a352e" />
          </linearGradient>
        </defs>
        <path d="M24 2L46 24L24 46L2 24Z" fill="url(#poco-tp)" />
        <path d="M24 6L42 24L24 42L6 24Z" fill="#121214" />
        <path d="M24 9L39 24L24 39L9 24Z" fill="none" stroke="#6b6357" strokeWidth="0.8" />
      </svg>
      <span aria-hidden="true" className="relative flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rotate-45 bg-dv-amethyst-text group-hover:bg-white" />
        ))}
      </span>
    </button>
  )
}

/**
 * Botão de invocação com forma própria: placa gótica (Moeda, Balde) ou medalhão dentado maior (Girar).
 * Ativo = joias e filete de ametista acesos; pressionado = encolhe 3% com um lampejo de aço; desabilitado =
 * metal apagado. Nome acessível = nome completo ("Lançar Moeda"…); visível = nome curto + nome completo.
 */
function Invocacao({
  forma,
  label,
  curto,
  icon,
  ativo,
  disabled,
  loading,
  onClick,
}: {
  forma: 'placa' | 'medalhao'
  label: string
  curto: string
  icon: ReactNode
  ativo: boolean
  disabled: boolean
  loading?: boolean
  onClick: () => void
}) {
  const aceso = ativo && !disabled
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled}
      onClick={() => {
        playSfx('click')
        onClick()
      }}
      className={cn(
        'dv-focus group relative isolate flex flex-col items-center transition-transform duration-[120ms] enabled:active:scale-[0.97] disabled:cursor-not-allowed',
        forma === 'medalhao' ? 'pb-1' : 'pb-1.5',
      )}
    >
      <span className={cn('relative grid place-items-center', forma === 'medalhao' ? 'size-[104px]' : 'h-[94px] w-full max-w-[112px]')}>
        {aceso && <span aria-hidden="true" className="poco-aura absolute inset-[-14%] -z-10 bg-[radial-gradient(50%_50%_at_50%_55%,rgb(var(--dv-amethyst-rgb)/0.55),transparent_70%)]" />}
        {forma === 'medalhao' ? <MedalhaoDentado ativo={aceso} apagado={disabled} /> : <PlacaGotica ativo={aceso} apagado={disabled} />}
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-150 group-enabled:group-active:opacity-10" />
        <span aria-hidden="true" className={cn('relative grid place-items-center transition-[opacity,filter]', forma === 'placa' && '-mt-1', disabled && 'opacity-40 grayscale')}>
          {loading ? <Spinner className="size-6" /> : icon}
        </span>
      </span>
      <span aria-hidden="true" className={cn('mt-1 font-display text-[16px] font-semibold uppercase leading-none tracking-[0.16em] [text-shadow:0_1px_6px_#000]', disabled ? 'text-dv-text-3' : aceso ? 'text-dv-porcelain' : 'text-dv-text-2')}>
        {curto}
      </span>
      <span aria-hidden="true" className="mt-1 whitespace-nowrap font-mono text-[10px] uppercase leading-none tracking-[0.04em] text-dv-text-3">
        {label}
      </span>
    </button>
  )
}

/* ── Faixa de prêmios (reais + simulados) ──────────────────────────────────────────────── */

type Aviso = { k: string; nome: string; item: string; raridade: string; raro: boolean; categoria: string }

/**
 * Faixa de notificação dos prêmios: um aviso por vez, entrando pela direita. Primeiro os reais (os mais recentes
 * que ainda não passaram); entre eles, a cada 12–18 s, um prêmio simulado com nome fictício (pedido do dono:
 * dar a sensação de gente girando). Os simulados nunca tiram a vez de um real.
 */
function FaixaPremios({ reais, simulacao }: { reais: PocoLetreiro[]; simulacao: Liberado['simulacao'] }) {
  const vistos = useRef(new Set<string>())
  const fila = useRef<Aviso[]>([])
  const [atual, setAtual] = useState<Aviso | null>(null)

  // Reais novos entram na frente da fila.
  useEffect(() => {
    const novos = reais
      .filter((r) => !vistos.current.has(`${r.nome}-${r.quando}`))
      .slice(0, 4)
      .reverse()
      .map((r) => ({ k: `${r.nome}-${r.quando}`, nome: r.nome, item: r.item, categoria: r.categoria, raridade: ITEM_RARITY_LABEL[r.raridade], raro: r.categoria === 'capsula' || r.categoria === 'cosmetico' || ['raro', 'epico', 'lendario', 'arcano'].includes(r.raridade) }))
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
          a = { k: `sim-${Date.now()}`, nome: n, item: it.item, categoria: it.categoria, raridade: ITEM_RARITY_LABEL[it.raridade], raro: true }
        }
        setAtual(a)
        proximo(a && !a.k.startsWith('sim-') ? 5600 : 12000 + Math.random() * 6000)
      }, espera)
    }
    proximo(700)
    return () => window.clearTimeout(t)
  }, [simulacao])

  return (
    <div className="relative h-11 shrink-0 overflow-hidden" aria-live="polite" aria-label="Prêmios do poço">
      {atual ? (
        <div key={atual.k} className="poco-faixa absolute inset-x-1 top-1">
          <FaixaOrnamental tom={atual.raro ? 'ametista' : 'aco'} className="h-9">
            <p className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              {['fragmento', 'essencia', 'capsula'].includes(atual.categoria) && <IconeItemPoco id={atual.categoria} tamanho={22} className="size-[22px] shrink-0" />}
              <span className={cn('dv-label shrink-0 text-[10px]', atual.raro ? 'text-dv-amethyst-text' : 'text-dv-gold')}>{atual.raridade}</span>
              <span className="truncate font-body text-[14px] text-dv-text">
                <span className="text-dv-porcelain">{atual.nome}</span> <span className="text-dv-text-3">obteve</span>{' '}
                <span className={atual.raro ? 'text-dv-amethyst-text' : 'text-dv-gold-bright'}>{atual.item}</span>
              </span>
            </p>
          </FaixaOrnamental>
        </div>
      ) : (
        <p className="absolute inset-0 flex items-center justify-center font-body text-[14px] italic text-dv-text-3">O poço guarda silêncio.</p>
      )}
    </div>
  )
}
