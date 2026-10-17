'use client'

import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { type CSSProperties, type KeyboardEvent, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { type ArcanoVista, type EstagioVista, VIRTUDES, type VirtudesPayload } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemArcanos, EmblemMark } from '../kit/emblems'
import { toRoman } from '../kit'
import { useVirtudes } from '../virtudes/virtudes-app'
import { Naipe } from '../virtudes/naipes'
import { Moldura, Retrato } from './moldura'
import { Sigilo } from './sigilos'

/**
 * ARCANOS — tela própria (pedido do dono, 17/10: "apesar dos arcanos influenciarem nas virtudes, quero telas
 * separadas"; refs em docs/redesign/refs/arcanos). Três vistas:
 *  1. Mapa (ref-06): os 22 sigilos em anéis orbitais sobre o céu; o do jogador aceso. Toque → galeria naquele.
 *  2. Galeria (ref-05/ref-04): carrossel com arrasto e encaixe; o do centro grande, na moldura, os laterais
 *     menores e em grisalha; nome e frase breve embaixo, com setas. Trancado = estátua cinza + só nome/frase.
 *  3. Detalhe (ref-07): altar com velas e vitral vermelho atrás da figura; Descrição, Fisiologia e Estágios em
 *     painéis por cima da cena. Só o próprio Arcano abre (Owner/Anfitrião abrem todos).
 * Os dados são o MESMO payload de /api/virtudes (trancados chegam só com numeral, nome e frase breve).
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>
type Vista = { tipo: 'mapa' } | { tipo: 'galeria'; i: number } | { tipo: 'detalhe'; i: number }

const nomeCurto = (t: string) => t.replace(/^Arcano d[aoe]s? /, '')
const reduzMovimento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function ArcanosApp() {
  const { data, error, isLoading, mutate } = useVirtudes()
  if (!data) {
    return (
      <Ceu>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-4">
              <p className="font-body text-[16px] text-dv-text-2">{(error as Error).message.replace('As Virtudes', 'Os Arcanos')}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Alinhando os Arcanos…
            </p>
          )}
        </div>
      </Ceu>
    )
  }
  if (!data.liberado) return <Trancado motivo={data.motivo} />
  return <Arcanos d={data} />
}

/* ------------------------------------------------------------------ fundo: céu estrelado */

function prng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const ESTRELAS = (() => {
  const r = prng(22)
  return Array.from({ length: 90 }, () => ({ x: r() * 100, y: r() * 180, s: r() < 0.12 ? 0.42 : r() * 0.22 + 0.08, o: r() * 0.5 + 0.2 }))
})()

function Ceu({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative h-full overflow-hidden bg-dv-ink', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_30%,var(--dv-night-2),var(--dv-night)_45%,var(--dv-ink)_100%)]" />
      <svg aria-hidden="true" viewBox="0 0 100 180" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full text-dv-text">
        {ESTRELAS.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.s} fill="currentColor" opacity={e.o} />
        ))}
      </svg>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Ceu>
      <div className="flex h-full flex-col px-4 pb-6">
        <div aria-hidden="true" className="flex flex-1 items-center justify-center opacity-40">
          <div className="grid grid-cols-4 gap-5">
            {(['louco', 'mago', 'sacerdotisa', 'imperatriz', 'morte', 'torre', 'lua', 'sol'] as const).map((k) => (
              <Sigilo key={k} arcano={k} estado="apagado" className="size-12" />
            ))}
          </div>
        </div>
        <section aria-label="Arcanos: trancado" className="relative bg-dv-ink-2 p-5 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]">
          <div className="flex items-start gap-4">
            <EmblemMark emblem={EmblemArcanos} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Arcanos</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Ceu>
  )
}

/* ------------------------------------------------------------------ navegação entre as vistas */

function Arcanos({ d }: { d: Liberado }) {
  const lista = d.arcanos
  const meuIdx = lista.findIndex((a) => a.proprio)
  const [vista, setVista] = useState<Vista>({ tipo: 'mapa' })
  const abrirGaleria = (i: number) => {
    playSfx('click')
    setVista({ tipo: 'galeria', i })
  }
  const marcarIndice = useCallback((i: number) => setVista((v) => (v.tipo === 'galeria' && v.i !== i ? { tipo: 'galeria', i } : v)), [])
  const abrirDetalhe = (i: number) => {
    playSfx('open')
    setVista({ tipo: 'detalhe', i })
  }
  if (vista.tipo === 'detalhe') {
    const a = lista[vista.i]
    if (a?.detalhe) return <Detalhe a={a} estagio={d.estagio} voltar={() => setVista({ tipo: 'galeria', i: vista.i })} />
  }
  return (
    <Ceu>
      <div className="flex h-full flex-col">
        <nav aria-label="Vistas dos Arcanos" className="flex shrink-0 items-center justify-center gap-1 px-4 pb-1 pt-3">
          {(
            [
              ['mapa', 'Mapa'],
              ['galeria', 'Galeria'],
            ] as const
          ).map(([t, rotulo]) => {
            const ativo = vista.tipo === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={ativo}
                onClick={() => (t === 'mapa' ? setVista({ tipo: 'mapa' }) : abrirGaleria(vista.tipo === 'galeria' ? vista.i : Math.max(0, meuIdx)))}
                className={cn(
                  'dv-focus dv-cut-diag min-h-11 px-5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                  ativo ? 'bg-dv-gold/15 text-dv-gold-bright shadow-[inset_0_0_0_1px_var(--dv-line-gold)]' : 'text-dv-text-3 hover:text-dv-text-2',
                )}
                style={{ '--dv-cut': '7px' } as CSSProperties}
              >
                {rotulo}
              </button>
            )
          })}
        </nav>
        <div className="min-h-0 flex-1">
          {vista.tipo === 'galeria' ? (
            <Galeria lista={lista} inicial={vista.i} estagio={d.estagio} onIndice={marcarIndice} onAbrir={abrirDetalhe} />
          ) : (
            <Mapa d={d} onEscolher={abrirGaleria} />
          )}
        </div>
      </div>
    </Ceu>
  )
}

/* ------------------------------------------------------------------ 1. Mapa orbital */

const VB = { w: 400, h: 340 }
const GIRO = (-9 * Math.PI) / 180
const ANEIS = [
  { de: 0, n: 6, rx: 78, ry: 52, fase: -90 },
  { de: 6, n: 8, rx: 122, ry: 84, fase: -67.5 },
  { de: 14, n: 8, rx: 162, ry: 118, fase: -78.75 },
]
function posicao(i: number) {
  const anel = ANEIS.find((a) => i >= a.de && i < a.de + a.n)!
  const t = ((anel.fase + ((i - anel.de) * 360) / anel.n) * Math.PI) / 180
  const x0 = Math.cos(t) * anel.rx
  const y0 = Math.sin(t) * anel.ry
  return { x: VB.w / 2 + x0 * Math.cos(GIRO) - y0 * Math.sin(GIRO), y: VB.h / 2 + x0 * Math.sin(GIRO) + y0 * Math.cos(GIRO) }
}

function Mapa({ d, onEscolher }: { d: Liberado; onEscolher: (i: number) => void }) {
  const meu = d.arcanos.find((a) => a.proprio)
  const meuIdx = d.arcanos.findIndex((a) => a.proprio)
  return (
    <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex max-w-md flex-col pb-10">
        <section aria-label="Mapa dos vinte e dois Arcanos" className="relative mx-auto w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
          <svg aria-hidden="true" viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 size-full overflow-visible text-dv-gold">
            <g transform={`rotate(-9 ${VB.w / 2} ${VB.h / 2})`} fill="none" stroke="currentColor">
              {ANEIS.map((a, i) => (
                <ellipse key={i} cx={VB.w / 2} cy={VB.h / 2} rx={a.rx} ry={a.ry} strokeOpacity={0.5 - i * 0.08} strokeWidth={i === 2 ? 1.6 : 1} />
              ))}
              <ellipse cx={VB.w / 2} cy={VB.h / 2} rx={180} ry={131} strokeOpacity="0.22" strokeWidth="0.7" strokeDasharray="2 5" />
              <ellipse cx={VB.w / 2} cy={VB.h / 2} rx={100} ry={68} strokeOpacity="0.2" strokeWidth="0.6" strokeDasharray="1 4" />
              <ellipse cx={VB.w / 2} cy={VB.h / 2} rx={40} ry={27} strokeOpacity="0.35" strokeWidth="0.8" />
              {/* eixos finos, como num astrolábio */}
              <path d={`M${VB.w / 2 - 190} ${VB.h / 2}H${VB.w / 2 + 190}M${VB.w / 2} ${VB.h / 2 - 140}V${VB.h / 2 + 140}`} strokeOpacity="0.14" strokeWidth="0.6" />
            </g>
          </svg>
          {/* centro: o próprio Arcano (ou o emblema) */}
          <button
            type="button"
            onClick={() => onEscolher(Math.max(0, meuIdx))}
            aria-label={meu ? `Seu Arcano: ${nomeCurto(meu.titulo)}. Abrir na galeria` : 'Abrir a galeria'}
            className="dv-focus absolute left-1/2 top-1/2 grid size-[19%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--dv-ink-3),var(--dv-ink)_75%)] shadow-[inset_0_0_0_1px_var(--dv-line-gold)]"
          >
            {meu ? <span className="dv-brass-text font-impact text-[26px] font-semibold leading-none">{meu.numeral}</span> : <EmblemArcanos className="size-[58%] text-dv-gold" />}
          </button>
          {d.arcanos.map((a, i) => {
            const p = posicao(i)
            const aberto = !!a.detalhe
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => onEscolher(i)}
                aria-label={`${a.numeral} · ${nomeCurto(a.titulo)}${a.proprio ? ', seu Arcano' : aberto ? '' : ' (trancado)'}`}
                className="dv-focus group absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${(p.x / VB.w) * 100}%`, top: `${(p.y / VB.h) * 100}%` }}
              >
                {a.proprio && <span aria-hidden="true" className="absolute -inset-2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-amethyst)_60%,transparent),transparent)] motion-safe:animate-dv-breathe" />}
                <span aria-hidden="true" className={cn('absolute inset-[3px] rounded-full bg-dv-ink', a.proprio ? 'shadow-[inset_0_0_0_1.5px_var(--dv-amethyst)]' : 'shadow-[inset_0_0_0_1px_var(--dv-line)]')} />
                <Sigilo arcano={a.key} aro={false} estado={a.proprio ? 'aceso' : aberto ? 'aberto' : 'apagado'} className={cn('relative size-[30px] transition-transform group-active:scale-90', !aberto && 'opacity-75')} />
                <span aria-hidden="true" className={cn('absolute -bottom-3.5 font-mono text-[9px] tracking-[0.08em]', a.proprio ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                  {a.numeral}
                </span>
              </button>
            )
          })}
        </section>

        <div className="mt-6 flex flex-col gap-4 px-4">
          <header className="text-center">
            <p className="dv-label text-[10px] text-dv-gold">Arcanos maiores</p>
            <h2 className="mt-1 font-display text-[22px] font-semibold uppercase tracking-[0.1em] text-dv-text">Os vinte e dois</h2>
            <p className="mx-auto mt-2 max-w-[34ch] font-body text-[15px] leading-relaxed text-dv-text-2">
              {d.verTodos
                ? 'Acesso da equipe: todos os Arcanos abrem. O jogador só abre o próprio.'
                : 'Cada pessoa desperta sob um único Arcano. Os outros vinte e um ficam fechados, e deles só se sabe o nome.'}
            </p>
          </header>
          {meu ? (
            <button
              type="button"
              onClick={() => onEscolher(meuIdx)}
              className="dv-focus flex min-h-16 items-center gap-3 bg-dv-ink-2/90 px-3 py-3 text-left shadow-[inset_0_0_0_1px_var(--dv-line-gold)]"
            >
              <Sigilo arcano={meu.key} estado="aceso" className="size-11" />
              <span className="min-w-0 flex-1">
                <span className="dv-label block text-[10px] text-dv-amethyst-text">Seu Arcano · Estágio {toRoman(d.estagio)}</span>
                <span className="block font-display text-[17px] font-semibold uppercase tracking-[0.08em] text-dv-text">
                  {meu.numeral} · {nomeCurto(meu.titulo)}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 text-dv-gold" strokeWidth={1.75} />
            </button>
          ) : (
            !d.verTodos && (
              <p role="status" className="mx-auto max-w-[34ch] text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-dv-gold">
                Seu Arcano aparece quando o Anfitrião registrá-lo.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 2. Galeria */

function Galeria({ lista, inicial, estagio, onIndice, onAbrir }: { lista: ArcanoVista[]; inicial: number; estagio: number; onIndice: (i: number) => void; onAbrir: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const itens = useRef<(HTMLLIElement | null)[]>([])
  const idxRef = useRef(inicial)
  const [idx, setIdx] = useState(inicial)
  const quadro = useRef(0)

  const medir = useCallback(() => {
    quadro.current = 0
    const el = ref.current
    if (!el) return
    const meio = el.scrollLeft + el.clientWidth / 2
    let melhor = idxRef.current
    let menor = Infinity
    itens.current.forEach((it, i) => {
      if (!it) return
      const c = it.offsetLeft + it.offsetWidth / 2
      const dist = Math.abs(c - meio)
      it.style.setProperty('--t', Math.min(1.6, dist / it.offsetWidth).toFixed(3))
      if (dist < menor) {
        menor = dist
        melhor = i
      }
    })
    if (melhor !== idxRef.current) {
      idxRef.current = melhor
      setIdx(melhor)
      playSfx('tick')
    }
  }, [])
  const onScroll = () => {
    if (!quadro.current) quadro.current = requestAnimationFrame(medir)
  }
  useEffect(() => () => cancelAnimationFrame(quadro.current), [])
  // índice na URL interna (para voltar do detalhe no mesmo Arcano), sem re-render a cada quadro
  useEffect(() => {
    const t = setTimeout(() => onIndice(idx), 250)
    return () => clearTimeout(t)
  }, [idx, onIndice])

  const centro = (i: number) => {
    const el = ref.current
    const it = itens.current[i]
    return el && it ? it.offsetLeft + it.offsetWidth / 2 - el.clientWidth / 2 : 0
  }
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollLeft = centro(inicial)
    medir()
    // só na montagem: depois quem manda é o dedo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const irPara = (i: number) => {
    const alvo = Math.max(0, Math.min(lista.length - 1, i))
    ref.current?.scrollTo({ left: centro(alvo), behavior: reduzMovimento() ? 'auto' : 'smooth' })
  }
  const teclado = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') irPara(idx + 1)
    else if (e.key === 'ArrowLeft') irPara(idx - 1)
    else if (e.key === 'Home') irPara(0)
    else if (e.key === 'End') irPara(lista.length - 1)
    else if (e.key === 'Enter' && lista[idx]?.detalhe) onAbrir(idx)
    else return
    e.preventDefault()
  }
  const a = lista[idx]
  const aberto = !!a?.detalhe

  return (
    <div className="relative flex h-full flex-col">
      {/* facho de luz sobre o centro (ref-05) */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(38%_60%_at_50%_30%,color-mix(in_oklab,var(--dv-amethyst)_22%,transparent),transparent_70%)]" />
      <div
        ref={ref}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Galeria dos Arcanos"
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={teclado}
        className="dv-focus relative flex min-h-0 flex-1 snap-x snap-mandatory items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ '--card': 'min(56vw, 236px)', paddingInline: 'calc(50% - var(--card) / 2)' } as CSSProperties}
      >
        <ul className="flex items-center">
          {lista.map((x, i) => {
            const abre = !!x.detalhe
            return (
              <li
                key={x.key}
                ref={(el) => {
                  itens.current[i] = el
                }}
                role="group"
                aria-roledescription="Arcano"
                aria-label={`${x.numeral} · ${nomeCurto(x.titulo)}${x.proprio ? ', seu Arcano' : abre ? '' : ' (trancado)'}`}
                className="-mx-[calc(var(--card)*0.09)] w-[var(--card)] shrink-0 snap-center"
                style={{ '--t': i === inicial ? 0 : 1 } as CSSProperties}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => (i === idx ? abre && onAbrir(i) : irPara(i))}
                  className="block w-full origin-center [transform:translateY(calc(min(var(--t),1)*16px))_scale(calc(1-min(var(--t),1)*0.3))] [filter:grayscale(min(var(--t),1))_brightness(calc(1-min(var(--t),1)*0.35))]"
                >
                  <Moldura arcano={x.key} cor={abre} aceso={x.proprio} carregar={Math.abs(i - idx) <= 1} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* legenda com setas (ref-05) */}
      <div className="relative shrink-0 px-3 pb-6 pt-1">
        <div aria-hidden="true" className="mx-auto mb-3 flex max-w-[300px] items-center gap-2 text-dv-gold">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-dv-gold/60" />
          <span className="size-1.5 rotate-45 bg-current" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-dv-gold/60" />
        </div>
        <div className="flex items-start gap-1">
          <button type="button" onClick={() => irPara(idx - 1)} disabled={idx === 0} aria-label="Arcano anterior" className="dv-focus grid size-11 shrink-0 place-items-center text-dv-gold disabled:opacity-30">
            <ChevronLeft className="size-7" strokeWidth={1.5} />
          </button>
          <div aria-live="polite" className="min-h-[124px] min-w-0 flex-1 text-center">
            {a && (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
                  Arcano {a.numeral}
                  {a.proprio && <span className="text-dv-amethyst-text"> · seu</span>}
                </p>
                <h2 className="mt-1 flex items-center justify-center gap-2 font-display text-[22px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">
                  {nomeCurto(a.titulo)}
                  {!aberto && <Lock aria-label="trancado" className="size-4 text-dv-text-3" strokeWidth={1.75} />}
                </h2>
                <p className="mx-auto mt-1.5 max-w-[32ch] font-body text-[15px] leading-relaxed text-dv-text-2">{a.breve}</p>
                {aberto ? (
                  <Button size="sm" className="mt-3" onClick={() => onAbrir(idx)}>
                    {a.proprio ? `Abrir seu Arcano · Estágio ${toRoman(estagio)}` : 'Abrir'}
                  </Button>
                ) : (
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Trancado · só o portador conhece o resto</p>
                )}
              </>
            )}
          </div>
          <button type="button" onClick={() => irPara(idx + 1)} disabled={idx === lista.length - 1} aria-label="Próximo Arcano" className="dv-focus grid size-11 shrink-0 place-items-center text-dv-gold disabled:opacity-30">
            <ChevronRight className="size-7" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 3. Detalhe: o altar */

function Detalhe({ a, estagio, voltar }: { a: ArcanoVista; estagio: number; voltar: () => void }) {
  const d = a.detalhe!
  const topo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    topo.current?.focus()
  }, [])
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden">
        {/* cena */}
        <div className="relative h-[74svh] max-h-[640px] min-h-[500px]">
          <Altar />
          <div className="absolute inset-x-[17%] bottom-[19%] top-[9%]">
            <span aria-hidden="true" className="absolute inset-x-[-10%] bottom-0 top-[10%] bg-[radial-gradient(50%_50%_at_50%_45%,color-mix(in_oklab,var(--dv-blood-text)_30%,transparent),transparent_70%)]" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 round 50% 50% 10% 10% / 28% 28% 6% 6%)' }}>
              <Retrato arcano={a.key} tipo="figura" cor aceso={a.proprio} carregar />
            </div>
            <span aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]" style={{ clipPath: 'inset(0 round 50% 50% 10% 10% / 28% 28% 6% 6%)' }} />
          </div>
          <Velas />
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,var(--dv-ink)_70%)] px-4 pb-4 pt-14 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dv-gold">
              Arcano {a.numeral}
              {a.proprio ? ` · Estágio ${toRoman(estagio)}` : ''}
            </p>
            <h2 ref={topo} tabIndex={-1} className="mt-1 font-display text-[28px] font-semibold uppercase leading-none tracking-[0.1em] text-dv-text outline-none">
              {nomeCurto(a.titulo)}
            </h2>
            <p className="mx-auto mt-2 max-w-[32ch] font-body text-[15px] italic leading-relaxed text-dv-text-2">{a.breve}</p>
            {a.provisorio && (
              <span className="mt-2 inline-flex h-5 items-center px-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-dv-gold shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">Texto provisório</span>
            )}
          </div>
        </div>

        {/* painéis por cima da cena */}
        <div className="relative mx-auto flex max-w-md flex-col gap-3 px-4 pb-12">
          <Painel titulo="Descrição">
            <p className="font-body text-[15.5px] leading-relaxed text-dv-text">{d.descricao}</p>
          </Painel>
          <Painel titulo="Fisiologia">
            <p className="font-body text-[15.5px] leading-relaxed text-dv-text">{d.fisiologia}</p>
            {(d.excelente || d.deficiente) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {d.excelente && (
                  <div className="flex items-center gap-2.5 bg-dv-amethyst/10 px-2.5 py-2 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--dv-amethyst)_45%,transparent)]">
                    <Naipe virtude={d.excelente} className="size-8" />
                    <span>
                      <span className="dv-label block text-[9.5px] text-dv-amethyst-text">Mais natural</span>
                      <span className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text">{VIRTUDES[d.excelente].nome}</span>
                    </span>
                  </div>
                )}
                {d.deficiente && (
                  <div className="flex items-center gap-2.5 bg-dv-ink-3/60 px-2.5 py-2 shadow-[inset_0_0_0_1px_var(--dv-line)]">
                    <Naipe virtude={d.deficiente} className="size-8" apagado />
                    <span>
                      <span className="dv-label block text-[9.5px] text-dv-text-3">Mais custosa</span>
                      <span className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text-2">{VIRTUDES[d.deficiente].nome}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </Painel>
          <Painel titulo="Estágios de evolução">
            <ol className="relative flex flex-col">
              <span aria-hidden="true" className="absolute bottom-3 left-[6px] top-3 w-px bg-dv-line-strong" />
              {d.estagios.map((e, i) => (
                <Estagio key={i} e={e} n={i + 1} />
              ))}
            </ol>
          </Painel>
        </div>
      </div>
      <button
        type="button"
        onClick={voltar}
        className="dv-focus dv-cut-diag absolute left-3 top-3 z-20 flex min-h-11 items-center gap-1 bg-dv-ink/80 pl-2 pr-4 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] backdrop-blur-sm"
        style={{ '--dv-cut': '7px' } as CSSProperties}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
        Galeria
      </button>
    </div>
  )
}

function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-dv-ink-2/90 p-4 shadow-[inset_0_0_0_1px_var(--dv-line-gold),var(--dv-shadow-1)] backdrop-blur-sm">
      <h3 className="dv-label mb-2 text-[10px] text-dv-gold">{titulo}</h3>
      {children}
    </section>
  )
}

const ESTADO_SR: Record<EstagioVista['estado'], string> = { passado: '', atual: '', futuro: 'ainda não alcançado', aberto: '' }

function Estagio({ e, n }: { e: EstagioVista; n: number }) {
  const futuro = e.estado === 'futuro'
  const atual = e.estado === 'atual'
  return (
    <li aria-current={atual ? 'step' : undefined} className={cn('relative flex gap-3 py-2 pl-6', futuro && 'opacity-60', atual && '-mx-2 bg-dv-amethyst/10 px-2 pl-8')}>
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-[13px] size-[9px] rotate-45',
          atual ? 'left-[10px] bg-dv-amethyst shadow-[var(--dv-glow-cobalt)]' : 'left-[2px]',
          e.estado === 'passado' && 'bg-dv-gold',
          e.estado === 'aberto' && 'bg-dv-text-3',
          futuro && 'bg-dv-ink shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">{toRoman(n)}</span>
          <span className={cn('font-display text-[15px] font-semibold uppercase tracking-[0.08em]', atual ? 'text-dv-text' : 'text-dv-text-2')}>{e.nome}</span>
          {atual && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-amethyst-text">Atual</span>}
          {e.estado === 'passado' && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-gold">Alcançado</span>}
          {ESTADO_SR[e.estado] && <span className="sr-only">({ESTADO_SR[e.estado]})</span>}
        </p>
        {e.linha ? (
          <p className={cn('mt-0.5 font-body text-[15px] leading-relaxed', atual ? 'text-dv-text' : 'text-dv-text-2')}>{e.linha}</p>
        ) : futuro ? (
          <p className="mt-0.5 font-body text-[14px] italic leading-relaxed text-dv-text-3">Ainda velado.</p>
        ) : null}
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ cenário do altar (ref-07, desenhado) */

/** Vitral em rosácea vermelho, colunas e degraus. Só SVG e tokens (sem imagem: leve no celular). */
function Altar() {
  const petalas = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30 * Math.PI) / 180
        const x = (r: number) => (200 + Math.cos(t) * r).toFixed(1)
        const y = (r: number) => (190 + Math.sin(t) * r).toFixed(1)
        return { d: `M${x(46)} ${y(46)}L${x(150)} ${y(150)}`, c: { cx: x(118), cy: y(118) }, espinho: `M${x(158)} ${y(158)}L${x(196)} ${y(196)}` }
      }),
    [],
  )
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <span className="absolute inset-0 bg-[linear-gradient(180deg,var(--dv-ink-2),var(--dv-blood-deep)_55%,var(--dv-ink)_100%)]" />
      <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMin slice" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="arc-vidro" cx="0.5" cy="0.45" r="0.55">
            <stop offset="0" stopColor="var(--dv-blood-text)" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="var(--dv-blood)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--dv-blood-deep)" stopOpacity="0.9" />
          </radialGradient>
          <pattern id="arc-cacos" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <path d="M0 0L9 3M3 9L9 0" stroke="var(--dv-ink)" strokeOpacity="0.45" strokeWidth="0.5" fill="none" />
          </pattern>
          <linearGradient id="arc-luz" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="var(--dv-blood-text)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--dv-blood-text)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* rosácea */}
        <circle cx="200" cy="190" r="150" fill="url(#arc-vidro)" />
        <circle cx="200" cy="190" r="150" fill="url(#arc-cacos)" />
        <g fill="none" stroke="var(--dv-ink)" strokeLinecap="round">
          <circle cx="200" cy="190" r="150" strokeWidth="9" />
          <circle cx="200" cy="190" r="46" strokeWidth="7" />
          <circle cx="200" cy="190" r="100" strokeWidth="3" />
          {petalas.map((p, i) => (
            <g key={i}>
              <path d={p.d} strokeWidth="5" />
              <circle cx={p.c.cx} cy={p.c.cy} r="16" strokeWidth="3" />
              <path d={p.espinho} strokeWidth="6" />
            </g>
          ))}
        </g>
        {/* fachos de luz descendo do vitral */}
        <path d="M120 250L60 520H180ZM280 250L220 520H340Z" fill="url(#arc-luz)" />
        {/* colunas laterais */}
        <g fill="var(--dv-ink-2)" stroke="var(--dv-ink-4)" strokeWidth="1">
          <path d="M0 40H34V520H0Z" />
          <path d="M366 40H400V520H366Z" />
        </g>
        {/* degraus do altar */}
        <g stroke="var(--dv-ink-4)" strokeWidth="1">
          <path d="M70 392H330L350 416H50Z" fill="var(--dv-ink-3)" />
          <path d="M50 416H350L376 446H24Z" fill="var(--dv-ink-2)" />
          <path d="M24 446H376L400 480H0Z" fill="var(--dv-ink)" />
        </g>
        {/* fitas vermelhas soltas */}
        <g fill="none" stroke="var(--dv-blood)" strokeOpacity="0.55" strokeWidth="1.4">
          <path d="M40 0C70 120 20 220 60 330" />
          <path d="M372 0C340 110 390 240 350 360" />
        </g>
      </svg>
    </div>
  )
}

const VELAS = [
  [60, 404, 34],
  [84, 398, 52],
  [108, 406, 26],
  [292, 406, 28],
  [316, 398, 48],
  [340, 404, 36],
  [36, 436, 22],
  [364, 436, 24],
  [150, 426, 18],
  [250, 426, 20],
] as const

function Velas() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 520" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <radialGradient id="arc-halo">
          <stop offset="0" stopColor="var(--dv-gold-bright)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--dv-gold-bright)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {VELAS.map(([x, base, h], i) => (
        <g key={i}>
          <rect x={x - 4} y={base - h} width="8" height={h} fill="var(--dv-paper-2)" />
          <rect x={x - 4} y={base - h} width="3" height={h} fill="var(--dv-paper)" />
          <g className="motion-safe:animate-dv-breathe" style={{ transformOrigin: `${x}px ${base - h - 6}px`, animationDelay: `${(i % 5) * -1.1}s` }}>
            <circle cx={x} cy={base - h - 6} r="16" fill="url(#arc-halo)" />
            <path d={`M${x} ${base - h - 14}C${x + 3.4} ${base - h - 8} ${x + 3} ${base - h - 2} ${x} ${base - h - 1}C${x - 3} ${base - h - 2} ${x - 3.4} ${base - h - 8} ${x} ${base - h - 14}Z`} fill="var(--dv-gold-bright)" />
          </g>
        </g>
      ))}
    </svg>
  )
}
