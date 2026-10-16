'use client'

import './poco.css'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import type { ManivelaParams, PocoLetreiro, PocoPayload, PocoPesos, PocoResultado } from '@/lib/devo/poco'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../hooks'
import { Button, IconButton, Spinner } from '../kit/button'
import { EmblemMark, EmblemPoco } from '../kit/emblems'
import { GlyphSpark } from '../kit/glyphs'
import { callName, useDevo } from '../state/devo-store'
import { BaldesSheet, LancarSheet, MoedasSheet } from './poco-folhas'
import { BaldeIcon, type BaldePosicao, DracmaIcon, PocoCena } from './poco-cena'
import { PocoManivela } from './poco-manivela'
import { PocoNeblina } from './poco-neblina'
import { PocoResultadoView } from './poco-resultado'

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
    <div className={cn('relative h-full overflow-hidden bg-dv-ink [--poco-h:min(46vh,380px)] [--poco-top:47%]', className)}>
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
          <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgba(238,237,235,0.34),rgba(238,237,235,0.12)_45%,rgba(238,237,235,0.26))]" />
          <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,#1a1a1d,#0e0e10)]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
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
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [folha, setFolha] = useState<null | 'moedas' | 'lancar' | 'baldes'>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [moedaAnim, setMoedaAnim] = useState(0)
  const [manivela, setManivela] = useState<ManivelaParams | null>(null)
  const [girando, setGirando] = useState(false)
  const [subindo, setSubindo] = useState(false)
  const [resultado, setResultado] = useState<PocoResultado | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const aberto = data.aberto
  const fase: 'vazio' | 'moeda' | 'cheio' = !aberto ? 'vazio' : aberto.estado === 'girado' ? 'cheio' : 'moeda'
  const balde: BaldePosicao = resultado || (fase === 'cheio' && !subindo) ? 'cima' : subindo ? 'subindo' : 'fundo'
  const baldeAtual = data.baldes.find((b) => b.id === (aberto?.balde ?? data.baldeAtual)) ?? data.baldes[0]

  const falhar = (e: unknown) => {
    setErro(e instanceof Error ? e.message : 'O poço não respondeu.')
    playSfx('error')
  }

  const lancar = async (o: { gratis: true } | { moeda: string }) => {
    setOcupado('gratis' in o ? 'gratis' : o.moeda)
    setErro(null)
    try {
      await poco('moeda.lancar', o)
      setFolha(null)
      setMoedaAnim((n) => n + 1)
      playSfx('fall')
      refresh()
    } catch (e) {
      falhar(e)
    } finally {
      setOcupado(null)
    }
  }

  const finalizarGiro = useCallback(
    async (toques: number[]) => {
      setManivela(null)
      setOcupado('girar')
      setGirando(true)
      setSubindo(true)
      playSfx('rumble')
      try {
        await poco('manivela.girar', { toques })
        refresh()
        later(() => {
          setGirando(false)
          setSubindo(false)
          playSfx('bell')
        }, reduced ? 0 : 1700)
      } catch (e) {
        setGirando(false)
        setSubindo(false)
        falhar(e)
        refresh()
      } finally {
        setOcupado(null)
      }
    },
    [refresh, reduced], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const girar = async () => {
    if (!aberto) return
    setErro(null)
    // Retomada (a manivela já tinha começado e a página recarregou): termina o giro sem minigame.
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
      setResultado(res)
      playSfx(res.categoria === 'lixo' ? 'card' : 'reveal')
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

  const dica =
    fase === 'vazio' ? 'Lance uma moeda no poço.' : fase === 'moeda' ? (aberto?.estado === 'girando' ? 'A manivela ficou no meio. Termine o giro.' : 'A moeda afundou. Gire a manivela.') : 'O balde subiu. Inspecione o balde.'

  return (
    <div className="relative h-full overflow-hidden bg-dv-ink [--poco-h:min(44vh,370px)] [--poco-top:46%]">
      <PocoCena palco="tela" balde={balde} baldeTipo={baldeAtual?.id ?? 'madeira'} girando={girando} moeda={moedaAnim} brilho={fase === 'cheio' ? 0.9 : fase === 'moeda' ? 0.7 : 0.45} />

      <div className="relative z-10 flex h-full flex-col">
        <Letreiro itens={data.letreiro} />

        <div className="flex items-start justify-between gap-3 px-3 pt-2">
          <div className="animate-dv-fade flex min-w-0 flex-col gap-1.5">
            <p className="flex min-h-8 items-center gap-2 bg-[#0c0c0e]/70 py-1 pl-1.5 pr-3 shadow-[inset_0_0_0_1px_rgba(238,237,235,0.14)]">
              <BaldeIcon tipo={baldeAtual?.id} className="size-6" />
              <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-2">{baldeAtual?.nome}</span>
            </p>
            <p
              className={cn(
                'flex w-fit items-center gap-2 py-1 pl-2 pr-3 font-mono text-[10.5px] uppercase tracking-[0.12em] shadow-[inset_0_0_0_1px_rgba(238,237,235,0.14)]',
                data.giroGratis.disponivel ? 'bg-dv-cobalt-dim text-dv-amethyst-text shadow-[inset_0_0_0_1px_rgba(138,124,200,0.5)]' : 'bg-[#0c0c0e]/70 text-dv-text-3',
              )}
            >
              <GlyphSpark className="size-3" />
              {data.giroGratis.disponivel ? 'Giro grátis disponível' : 'Giro grátis usado hoje'}
            </p>
          </div>
          <IconButton label="Suas moedas" variant="ghost" onClick={() => setFolha('moedas')} sfx="open" className="shrink-0 bg-[#0c0c0e]/60">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </IconButton>
        </div>

        <div className="min-h-0 flex-1" />

        <div className="px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <p aria-live="polite" className="mb-2.5 text-center font-body text-[15.5px] italic text-dv-text-2 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
            {dica}
          </p>
          {erro && (
            <p role="alert" className="mb-2.5 border-l-2 border-dv-blood bg-dv-blood-deep/70 px-3 py-2 text-[13.5px] text-dv-blood-text">
              {erro}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Acao
              label="Lançar Moeda"
              curto="Moeda"
              ativo={fase === 'vazio'}
              disabled={fase !== 'vazio' || !!ocupado}
              onClick={() => {
                setErro(null)
                setFolha('lancar')
              }}
              icon={<DracmaIcon raridade="incomum" className="size-9" />}
            />
            <Acao
              label="Girar Manivela"
              curto="Girar"
              ativo={fase === 'moeda'}
              disabled={fase !== 'moeda' || !!ocupado}
              loading={ocupado === 'girar'}
              onClick={girar}
              icon={<ManivelaIcon className="size-9" />}
            />
            <Acao
              label="Inspecionar Balde"
              curto="Balde"
              ativo={fase === 'cheio'}
              disabled={!!ocupado || subindo}
              loading={ocupado === 'balde' && fase === 'cheio'}
              onClick={inspecionar}
              icon={<BaldeIcon tipo={baldeAtual?.id} className="size-9" />}
            />
          </div>
        </div>
      </div>

      {manivela && <PocoManivela params={manivela} onFim={finalizarGiro} />}
      {resultado && (
        <PocoResultadoView
          r={resultado}
          onFechar={() => {
            setResultado(null)
            refresh()
          }}
        />
      )}

      <MoedasSheet open={folha === 'moedas'} onClose={() => setFolha(null)} moedas={data.moedas} giroGratis={data.giroGratis} owner={data.owner} onSalvarProbabilidades={salvarProbabilidades} />
      <LancarSheet open={folha === 'lancar'} onClose={() => setFolha(null)} moedas={data.moedas} giroGratis={data.giroGratis} ocupado={ocupado} erro={erro} onLancar={lancar} />
      <BaldesSheet open={folha === 'baldes'} onClose={() => setFolha(null)} baldes={data.baldes} atual={data.baldeAtual} ocupado={!!ocupado} onEscolher={escolherBalde} />
    </div>
  )
}

/** Botão de pedra do poço: ícone, rótulo curto grande e o nome completo pequeno. Ativo = filete de ametista. */
function Acao({
  label,
  curto,
  icon,
  ativo,
  disabled,
  loading,
  onClick,
}: {
  label: string
  curto: string
  icon: ReactNode
  ativo: boolean
  disabled: boolean
  loading?: boolean
  onClick: () => void
}) {
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
      style={{ '--dv-cut': '12px' } as CSSProperties}
      className="dv-focus group relative isolate flex min-h-[92px] flex-col items-center justify-center gap-1 px-1 pb-2 pt-2.5 transition-transform duration-[120ms] enabled:active:scale-[0.97] disabled:cursor-not-allowed"
    >
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut absolute inset-0 -z-10',
          ativo && !disabled ? 'bg-[linear-gradient(135deg,#ece5d8,#6b6357_30%,#bab09f_60%,#8a7cc8)]' : 'bg-[linear-gradient(135deg,rgba(238,237,235,0.32),rgba(238,237,235,0.1)_45%,rgba(238,237,235,0.24))]',
        )}
      />
      <span aria-hidden="true" className="dv-cut absolute inset-px -z-10 bg-[#121214] bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      <span aria-hidden="true" className="dv-cut absolute inset-px -z-10 bg-[linear-gradient(170deg,rgba(255,255,255,0.07),transparent_40%,rgba(0,0,0,0.4))]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      {ativo && !disabled && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-6 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(138,124,200,0.45),transparent)]" />}
      <span aria-hidden="true" className={cn('grid size-10 place-items-center transition-[filter,opacity]', disabled ? 'opacity-40 grayscale' : 'group-active:drop-shadow-[0_0_8px_rgba(236,229,216,0.8)]')}>
        {loading ? <Spinner className="size-6" /> : icon}
      </span>
      <span aria-hidden="true" className={cn('font-display text-[16px] font-semibold uppercase leading-none tracking-[0.16em]', disabled ? 'text-dv-text-3' : 'text-dv-text')}>
        {curto}
      </span>
      <span aria-hidden="true" className="whitespace-nowrap font-mono text-[10px] uppercase leading-none tracking-[0.02em] text-dv-text-3">
        {label}
      </span>
    </button>
  )
}

function ManivelaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="poco-ic-aco" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.5" stopColor="#bab09f" />
          <stop offset="1" stopColor="#6b6357" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="16" r="7.5" fill="none" stroke="url(#poco-ic-aco)" strokeWidth="2.2" />
      <circle cx="11" cy="16" r="2.6" fill="url(#poco-ic-aco)" />
      <path d="M11 16L24 9" stroke="url(#poco-ic-aco)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="22" y="4" width="4.5" height="10" rx="2" transform="rotate(-28 24 9)" fill="#5b4c40" stroke="#0c0c0e" strokeWidth="0.8" />
    </svg>
  )
}

/* ── Letreiro ───────────────────────────────────────────────────────────────────────────── */

/** Últimos prêmios bons de outros jogadores, rolando no topo (duas cópias para a volta não ter emenda). */
function Letreiro({ itens }: { itens: PocoLetreiro[] }) {
  const texto = useMemo(() => itens.map((i) => ({ k: `${i.nome}-${i.quando}`, nome: i.nome, item: i.item, raro: i.categoria === 'capsula' || i.categoria === 'cosmetico' })), [itens])
  const dur = Math.max(24, texto.length * 7)
  return (
    <div className="relative flex h-9 shrink-0 items-center overflow-hidden border-b border-dv-line bg-[linear-gradient(180deg,rgba(12,12,14,0.92),rgba(12,12,14,0.7))]">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 bg-[#0c0c0e] pl-3 pr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-gold shadow-[6px_0_12px_#0c0c0e]">
        <GlyphSpark className="size-3 text-dv-amethyst" />
        Milagres
      </span>
      {texto.length === 0 ? (
        <p className="truncate px-2 font-body text-[14px] italic text-dv-text-3">O poço guarda silêncio. Nenhum milagre recente.</p>
      ) : (
        <div className="min-w-0 flex-1 overflow-hidden" aria-label="Últimos prêmios do poço" role="marquee">
          <div className="poco-marquee flex w-max" style={{ '--poco-marquee-dur': `${dur}s` } as CSSProperties}>
            {[0, 1].map((copia) => (
              <ul key={copia} aria-hidden={copia === 1 || undefined} className="flex shrink-0 items-center">
                {texto.map((t) => (
                  <li key={t.k} className="flex items-center gap-1.5 whitespace-nowrap px-4 font-body text-[14px] text-dv-text-2">
                    <span className="text-dv-text">{t.nome}</span>
                    <span className="text-dv-text-3">tirou</span>
                    <span className={t.raro ? 'text-dv-amethyst-text' : 'text-dv-gold-bright'}>{t.item}</span>
                    <span aria-hidden="true" className="ml-3 size-1 rotate-45 bg-dv-gold/60" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
