'use client'

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { CenarioMapa, ImagemPintada, TorreEstado } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { RomanDial, toRoman } from '../kit'
import { ALTURA_ARTE, LARGURA_ARTE, MAPA_H, MAPA_W, Poeira, TorreArte, TorresDefs } from './arte'
import { bordaIlha, Cerca, CidadeAoLonge, Feixe, Ilha, MolduraFrente, Portao, Poste } from './mapa-cena'
import { larguraPara, srcDe, srcSetDe, TorreIlustradaSvg } from './ilustrada'
import { Cartela, ChaveOrnamental, CristalEssencia } from './ornamentos'
import './torres.css'

/** Posição final de uma torre no mapa (unidades 390×640). */
type Lugar = { x: number; y: number; escala: number }

/** Retângulo da ilustração de uma torre já posicionada. */
export function caixaTorre(t: TorreEstado, l: Lugar) {
  const altU = t.ilustracao ? t.ilustracao.altura : ALTURA_ARTE[t.arte]
  const larU = t.ilustracao ? t.ilustracao.altura * t.ilustracao.aspecto * 0.82 : LARGURA_ARTE[t.arte] * 0.85
  const w = larU * l.escala
  const h = altU * l.escala
  return { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y - h, y1: l.y, w, h }
}

type Caixa = { x0: number; x1: number; y0: number; y1: number }
const cruza = (a: Caixa, b: Caixa) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

/**
 * Onde ficam a ilha e o céu pintados (mesmo enquadramento): cobrem o mapa inteiro mantendo a proporção — se a
 * arte é mais larga que o mapa, ajusta pela altura e corta as laterais (que já esmaecem); senão, pela largura,
 * apoiada embaixo.
 */
function areaIlha(c: CenarioMapa) {
  if (MAPA_W / MAPA_H < c.ilha.aspecto) {
    const h = MAPA_H
    const w = h * c.ilha.aspecto
    return { x: (MAPA_W - w) / 2, y: 0, w, h }
  }
  const w = MAPA_W
  const h = w / c.ilha.aspecto
  return { x: 0, y: MAPA_H - h, w, h }
}

/** Posição de cada torre: pelos pedestais do cenário pintado (escala pela profundidade) ou pelo conteúdo. */
export function lugares(torres: TorreEstado[], cenario: CenarioMapa | null): Record<string, Lugar> {
  const out: Record<string, Lugar> = {}
  const ilha = cenario ? areaIlha(cenario) : null
  for (const t of torres) {
    const p = cenario?.pedestais[t.id]
    if (cenario && ilha && p) {
      // fundo (y pequeno) menor, frente maior; a principal ganha 25 %
      const prof = 0.62 + 0.55 * Math.min(1, Math.max(0, p.y))
      const base = t.tipo === 'principal' ? 1.25 : 0.95
      out[t.id] = { x: ilha.x + p.x * ilha.w, y: ilha.y + p.y * ilha.h + (p.afundar ?? 0), escala: p.escala ?? Math.min(1.05, base * prof * 0.72) }
    } else {
      out[t.id] = { x: (t.mapa.x / 100) * MAPA_W, y: (t.mapa.y / 100) * MAPA_H, escala: t.mapa.escala }
    }
  }
  return out
}

/** Tamanho da placa de nome (unidades do mapa). */
const placaTam = (nome: string, principal: boolean) => ({ w: 22 + nome.length * (principal ? 7.4 : 6.6) + 34, h: principal ? 28 : 25 })

/**
 * Coloca as placas no pé de cada torre sem cobrir nenhuma ilustração nem outra placa: tenta logo abaixo, depois
 * deslocada para os lados, mais abaixo e, por último, acima do topo. Devolve o centro da placa e a âncora (pé).
 */
export function colocarPlacas(torres: TorreEstado[], lug: Record<string, Lugar>) {
  const caixas = torres.map((t) => caixaTorre(t, lug[t.id]))
  const feitas: Caixa[] = []
  const out: Record<string, { cx: number; cy: number; w: number; h: number; ax: number; ay: number }> = {}
  // a principal primeiro (fica no lugar ideal); depois da frente para o fundo
  const ordem = [...torres].sort((a, b) => (a.tipo === 'principal' ? -1 : b.tipo === 'principal' ? 1 : lug[b.id].y - lug[a.id].y))
  for (const t of ordem) {
    const l = lug[t.id]
    const nome = rotulo(t)
    const { w, h } = placaTam(nome, t.tipo === 'principal')
    const bx = caixaTorre(t, l)
    // margem das bordas: o mapa esmaece nos 6 % de cada lado
    const MX = MAPA_W * 0.065
    const area = (a: Caixa, b: Caixa) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))
    const custoDe = (c: Caixa) => caixas.reduce((acc, k) => acc + area(c, k) * 20, 0) + feitas.reduce((acc, k) => acc + area(c, k) * 40, 0)
    const caixaEm = (cx: number, cy: number) => {
      const x = Math.min(MAPA_W - MX - w / 2, Math.max(MX + w / 2, cx))
      const y = Math.min(MAPA_H - h / 2 - 4, Math.max(h / 2 + 4, cy))
      return { x, y, c: { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 } }
    }
    // 1) no pé: anéis ao redor da base, preferindo logo abaixo e perto
    let escolhida: [number, number] = [l.x, l.y + 10 + h / 2]
    let acima = false
    let melhor = Infinity
    for (const d of [10, 24, 40, 60, 84, 112, 144])
      for (const ang of [90, 70, 110, 50, 130, 20, 160, 0, 180]) {
        const r = (ang * Math.PI) / 180
        const { x, y, c } = caixaEm(l.x + Math.cos(r) * d * 1.3, l.y + Math.sin(r) * d + h / 2)
        const custo = custoDe(c) + d + Math.abs(ang - 90) * 0.05
        if (custo < melhor) {
          melhor = custo
          escolhida = [x, y]
        }
      }
    // 2) se o pé está tomado, acima do topo (no céu), com o filete saindo do topo
    for (const dx of [0, -w * 0.4, w * 0.4]) {
      const { x, y, c } = caixaEm(l.x + dx, bx.y0 - 8 - h / 2)
      const custo = custoDe(c) + 90 + Math.abs(dx) * 0.2
      if (custo < melhor) {
        melhor = custo
        escolhida = [x, y]
        acima = true
      }
    }
    const [cx, cy] = escolhida
    feitas.push({ x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 })
    out[t.id] = { cx, cy, w, h, ax: l.x, ay: acima ? bx.y0 + 4 : l.y }
  }
  return out
}

const rotulo = (t: TorreEstado) => t.nome.replace(/^\[PROVISÓRIO\]\s*/, '').replace(/^Torre d[oa]s? /, '')

/** Céu pintado com paralaxe leve (deriva lenta e acompanha o ponteiro no desktop). */
function CeuPintado({ img, area, onErro }: { img: ImagemPintada; area: { x: number; y: number; w: number; h: number }; onErro: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const mover = (e: PointerEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * -10
      const dy = (e.clientY / window.innerHeight - 0.5) * -6
      el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`
    }
    window.addEventListener('pointermove', mover, { passive: true })
    return () => window.removeEventListener('pointermove', mover)
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute transition-[translate] duration-700 ease-out"
      style={{ left: `${(area.x / MAPA_W) * 100}%`, top: `${(area.y / MAPA_H) * 100}%`, width: `${(area.w / MAPA_W) * 100}%`, height: `${(area.h / MAPA_H) * 100}%`, transform: img.espelhar ? 'scaleX(-1)' : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={srcDe(img, img.larguras[Math.min(1, img.larguras.length - 1)])} srcSet={srcSetDe(img)} sizes="(max-width: 640px) 110vw, 500px" alt="" decoding="async" onError={onErro} className="tw-ceu-deriva size-full object-cover" />
    </div>
  )
}

/**
 * Mapa das Torres. Dois modos:
 * - **pintado** (`cenario` com a ilha e o céu do pipeline de arte): céu com paralaxe leve, ilha pintada apoiada
 *   embaixo, torres nos pedestais com escala pela profundidade; se o arquivo falhar, cai no vetorial;
 * - **vetorial** (sem `cenario`): céu em textura, mostrador, cidade, ilha suspensa, cerca, postes e portão.
 * Cada torre é um botão (nome acessível = nome da torre) do tamanho da ilustração; a placa de nome fica no pé,
 * pequena, ligada por um filete, e nunca cobre uma ilustração.
 */
export function MapaTorres({
  torres,
  onAbrir,
  inerte = false,
  largura,
  cenario = null,
}: {
  torres: TorreEstado[]
  /** Abre a torre; `origem` = retângulo do botão da torre na tela (a transição sai dali). */
  onAbrir?: (id: string, origem: DOMRect) => void
  inerte?: boolean
  /** Largura em px (o pai encaixa o mapa na altura disponível). Sem ela, ocupa a largura. */
  largura?: number
  cenario?: CenarioMapa | null
}) {
  const [falhou, setFalhou] = useState(false)
  const pintado = !!cenario && !falhou
  const lug = lugares(torres, pintado ? cenario : null)
  const ordem = [...torres].sort((a, b) => lug[a.id].y - lug[b.id].y)
  const placas = colocarPlacas(torres, lug)
  const caminho = torres.map((t) => ({ x: lug[t.id].x, y: lug[t.id].y }))
  const ilha = pintado && cenario ? areaIlha(cenario) : null
  const pxU = (largura ?? MAPA_W) / MAPA_W
  return (
    <div className={cn('relative mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]', !largura && 'w-full max-w-[460px]')} style={{ aspectRatio: `${MAPA_W} / ${MAPA_H}`, width: largura }}>
      {pintado && cenario?.ceu && ilha ? (
        <CeuPintado img={cenario.ceu} area={ilha} onErro={() => setFalhou(true)} />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[1%] w-[96%] -translate-x-1/2 opacity-[0.16] [mask-image:radial-gradient(closest-side,#000_60%,transparent)]">
          <RomanDial tone="silver" />
        </div>
      )}
      {ilha && cenario && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={srcDe(cenario.ilha, larguraPara(cenario.ilha, (largura ?? MAPA_W) * 1.1 * 2))}
          srcSet={srcSetDe(cenario.ilha)}
          sizes="(max-width: 640px) 110vw, 500px"
          alt=""
          aria-hidden="true"
          decoding="async"
          onError={() => setFalhou(true)}
          className="pointer-events-none absolute max-w-none"
          style={{ left: `${(ilha.x / MAPA_W) * 100}%`, top: `${(ilha.y / MAPA_H) * 100}%`, width: `${(ilha.w / MAPA_W) * 100}%`, height: `${(ilha.h / MAPA_H) * 100}%` }}
        />
      )}
      <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="absolute inset-0 size-full">
        <TorresDefs />
        {!pintado && (
          <>
            <Feixe />
            <CidadeAoLonge />
            <image href="/images/torres/nevoa.webp" x={-80} y={300} width={560} height={110} opacity={0.5} className="tw-drift" preserveAspectRatio="none" />
            <Ilha caminhos={caminho} />
            <Cerca parte="tras" />
            {caminho.map((p, i) => {
              const g = bordaIlha(90, 0.93)
              const k = 0.55
              return <Poste key={i} x={g.x + (p.x - g.x) * k + (p.x < g.x ? -12 : 12)} y={g.y + (p.y - g.y) * k + 6} s={0.9} />
            })}
          </>
        )}
        {pintado &&
          ilha &&
          (cenario?.enfeites ?? []).map((e, i) => {
            const x = ilha.x + e.x * ilha.w
            const y = ilha.y + e.y * ilha.h
            return (
              <g key={`enf-${i}`} transform={`translate(${x} ${y})`}>
                <circle cx={0} cy={-16} r={18} fill="url(#tw-halo)" className="tw-flicker" />
                <path d="M0 0V-8" stroke="#2c2c31" strokeWidth={2} />
                <path d="M-4 -8H4L3.2 -19H-3.2Z" fill="#fff3dc" stroke="#6b6357" strokeWidth={0.7} />
                <path d="M-5 -19.5H5L0 -24Z" fill="#38393c" />
              </g>
            )
          })}
        {ordem.map((t) => {
          const l = lug[t.id]
          return (
            <g key={t.id} transform={`translate(${l.x} ${l.y}) scale(${l.escala})`}>
              {t.ilustracao ? (
                <TorreIlustradaSvg ilu={t.ilustracao} feitos={t.concluidos} total={t.andares.length} destaque={t.tipo === 'principal'} pxPorUnidade={pxU * l.escala} />
              ) : (
                <>
                  <ellipse cx={0} cy={2} rx={LARGURA_ARTE[t.arte] * 0.6} ry={9} fill="#000" opacity={0.55} filter="url(#tw-blur-s)" />
                  <TorreArte arte={t.arte} feitos={t.concluidos} total={t.andares.length} destaque={t.tipo === 'principal'} />
                </>
              )}
            </g>
          )
        })}
        {!pintado && (
          <>
            <Cerca parte="frente" />
            <Portao />
          </>
        )}
        {/* filetes das placas até o pé de cada torre */}
        {torres.map((t) => {
          const p = placas[t.id]
          const ty = p.cy < p.ay ? p.cy + p.h / 2 : p.cy - p.h / 2
          return (
            <g key={`f-${t.id}`}>
              <path d={`M${p.ax} ${p.ay + 2}L${p.cx} ${ty}`} stroke="#ece5d8" strokeWidth={0.7} opacity={0.75} />
              <circle cx={p.ax} cy={p.ay + 2} r={1.6} fill="#ece5d8" />
            </g>
          )
        })}
        <image href="/images/torres/nevoa.webp" x={-120} y={MAPA_H - 120} width={640} height={130} opacity={pintado ? 0.45 : 0.65} className="tw-drift-lento" preserveAspectRatio="none" />
        <Poeira />
        {!pintado && <MolduraFrente />}
        <radialGradient id="tw-vinheta" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.65" />
        </radialGradient>
        <rect width={MAPA_W} height={MAPA_H} fill="url(#tw-vinheta)" />
      </svg>

      {ordem.map((t) => {
        const b = caixaTorre(t, lug[t.id])
        const p = placas[t.id]
        const total = t.andares.length
        const principal = t.tipo === 'principal'
        return (
          <div key={t.id}>
            {/* área de toque = a própria ilustração */}
            <button
              type="button"
              disabled={inerte}
              aria-label={t.nome}
              onClick={(e) => {
                playSfx('open')
                onAbrir?.(t.id, e.currentTarget.getBoundingClientRect())
              }}
              className="dv-focus group absolute"
              style={{ left: `${(b.x0 / MAPA_W) * 100}%`, top: `${(b.y0 / MAPA_H) * 100}%`, width: `${(b.w / MAPA_W) * 100}%`, height: `${((b.h + 6) / MAPA_H) * 100}%` }}
            >
              <span aria-hidden="true" className="absolute inset-x-[5%] bottom-0 h-1/2 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(var(--dv-amethyst-text-rgb)/0.28),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />
            </button>
            {/* placa pequena no pé */}
            <div aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(p.cx / MAPA_W) * 100}%`, top: `${(p.cy / MAPA_H) * 100}%` }}>
              <Cartela h={principal ? 28 : 25} destaque={principal}>
                <span className="flex items-baseline gap-1.5 whitespace-nowrap leading-none">
                  <span className={cn('font-display font-semibold uppercase tracking-[0.08em] text-dv-text', principal ? 'text-[11px]' : 'text-[10px]')}>{rotulo(t)}</span>
                  <span className={cn('dv-tabular font-mono text-[9.5px] tracking-[0.06em]', principal ? 'text-dv-amethyst-text' : 'text-dv-gold')}>
                    {t.concluidos ? toRoman(t.concluidos) : '0'}/{toRoman(total)}
                  </span>
                </span>
              </Cartela>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Mapa navegável: as torres nunca são comprimidas para caber. No celular o cenário fica maior que a tela
 * (zoom) e o jogador arrasta para os lados (rolagem horizontal com encaixe suave em cada torre). Indicadores
 * discretos: esmaecimento na borda com setas e pontos (um por torre). Começa centrado na torre principal.
 * Com mais torres (conteúdo crescendo), o mesmo trilho rola mais.
 */
export function MapaNavegavel({
  torres,
  cenario,
  vw,
  vh,
  onAbrir,
  inerte,
}: {
  torres: TorreEstado[]
  cenario: CenarioMapa | null
  vw: number
  vh: number
  onAbrir?: (id: string, origem: DOMRect) => void
  inerte?: boolean
}) {
  const trilho = useRef<HTMLDivElement>(null)
  // celular: zoom para as torres terem tamanho de leitura; mais torres que pedestais/4 → cenário mais largo
  const zoom = (vw < 520 ? 1.3 : 1) * Math.max(1, torres.length / 4)
  const s = Math.max(0.5, (vh / MAPA_H) * zoom)
  const mapW = MAPA_W * s
  const mapH = MAPA_H * s
  const lug = lugares(torres, cenario)
  // corte vertical: tira céu e penhasco, mas nunca o topo da torre mais alta
  const topo = Math.min(...torres.map((t) => caixaTorre(t, lug[t.id]).y0)) - 14
  const sobra = Math.max(0, mapH - vh)
  const corte = Math.min(sobra * 0.42, Math.max(0, topo * s))
  const rola = mapW > vw + 2
  const [pos, setPos] = useState({ esq: false, dir: rola, ativo: torres.findIndex((t) => t.tipo === 'principal') })
  const ordemX = [...torres].sort((a, b) => lug[a.id].x - lug[b.id].x)

  // começa centrado na principal
  useLayoutEffect(() => {
    const el = trilho.current
    if (!el || !rola) return
    const p = torres.find((t) => t.tipo === 'principal') ?? torres[0]
    el.scrollLeft = Math.max(0, lug[p.id].x * s - vw / 2)
    atualizar()
  }, [rola, s]) // eslint-disable-line react-hooks/exhaustive-deps

  const atualizar = () => {
    const el = trilho.current
    if (!el) return
    const centro = (el.scrollLeft + el.clientWidth / 2) / s
    let ativo = 0
    let melhor = Infinity
    ordemX.forEach((t, i) => {
      const d = Math.abs(lug[t.id].x - centro)
      if (d < melhor) {
        melhor = d
        ativo = i
      }
    })
    setPos({ esq: el.scrollLeft > 4, dir: el.scrollLeft < el.scrollWidth - el.clientWidth - 4, ativo })
  }
  const irPara = (t: TorreEstado) => {
    const el = trilho.current
    if (!el) return
    playSfx('click')
    el.scrollTo({ left: lug[t.id].x * s - vw / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const passo = (dir: -1 | 1) => {
    const alvo = ordemX[Math.min(ordemX.length - 1, Math.max(0, pos.ativo + dir))]
    if (alvo) irPara(alvo)
  }

  return (
    <div className="relative size-full">
      <div
        ref={trilho}
        onScroll={atualizar}
        className={cn('size-full overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', rola ? 'snap-x snap-proximity overflow-x-auto overscroll-x-contain' : 'overflow-x-hidden')}
      >
        <div className={cn('relative h-full', !rola && 'mx-auto')} style={{ width: mapW }}>
          {/* âncoras de encaixe (uma por torre) */}
          {rola && ordemX.map((t) => <span key={t.id} aria-hidden="true" className="pointer-events-none absolute top-0 h-px w-px snap-center" style={{ left: lug[t.id].x * s }} />)}
          <div className="absolute left-0" style={{ top: -corte }}>
            <MapaTorres torres={torres} cenario={cenario} largura={mapW} inerte={inerte} onAbrir={onAbrir} />
          </div>
        </div>
      </div>
      {rola && (
        <>
          {/* esmaecimento + setas nas bordas: há mais mapa para os lados */}
          <div aria-hidden="true" className={cn('pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,var(--dv-ink),transparent)] transition-opacity duration-300', pos.esq ? 'opacity-90' : 'opacity-0')} />
          <div aria-hidden="true" className={cn('pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,var(--dv-ink),transparent)] transition-opacity duration-300', pos.dir ? 'opacity-90' : 'opacity-0')} />
          {pos.esq && (
            <button type="button" onClick={() => passo(-1)} aria-label="Ver torres à esquerda" className="dv-focus absolute left-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-dv-text-2 hover:text-dv-text">
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          )}
          {pos.dir && (
            <button type="button" onClick={() => passo(1)} aria-label="Ver torres à direita" className="dv-focus absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-dv-text-2 hover:text-dv-text">
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          )}
          {/* pontos: um por torre, o do centro aceso */}
          <div className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
            {ordemX.map((t, i) => (
              <button key={t.id} type="button" onClick={() => irPara(t)} aria-label={`Mostrar ${semPrefixo(t.nome)}`} aria-current={i === pos.ativo || undefined} className="dv-focus grid size-6 place-items-center">
                <span aria-hidden="true" className={cn('block rotate-45 transition-all duration-300', i === pos.ativo ? 'size-2 bg-dv-amethyst-text shadow-[0_0_6px_var(--dv-amethyst)]' : 'size-1.5 bg-dv-text-3')} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const semPrefixo = (n: string) => n.replace(/^\[PROVISÓRIO\]\s*/, '')

/** Fila de recursos (essências e chaves) com quantidade, em medalhões. */
export function Recursos({ torres, className }: { torres: TorreEstado[]; className?: string }) {
  const essencias = torres.map((t) => t.essencia)
  const chaves = torres.flatMap((t) => (t.chave ? [t.chave] : []))
  return (
    <ul
      aria-label="Seus recursos das torres"
      className={cn('-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-40px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
    >
      {essencias.map((e) => (
        <RecursoChip key={e.item} nome={e.nome} curto={e.nome.replace(/^Essência (de Afinidade )?d[oa] /, '').replace(/\s*\(provisória\)/, '')} quantidade={e.quantidade} tipo="essencia" chave={e.item} />
      ))}
      {chaves.map((c) => (
        <RecursoChip key={c.item} nome={c.nome} curto={c.nome.replace(/^Chave d[oa] /, '')} quantidade={c.quantidade} tipo="chave" />
      ))}
    </ul>
  )
}

/** Medalhão de recurso: o cristal ou a chave desenhados, nome curto e quantidade. */
export function RecursoChip({ nome, curto, quantidade, tipo, chave, className }: { nome: string; curto: string; quantidade: number; tipo: 'essencia' | 'chave'; chave?: string; className?: string }) {
  return (
    <li className={cn('relative isolate flex h-9 shrink-0 snap-start items-center gap-1 pl-1 pr-2.5', !quantidade && 'opacity-70', className)} style={{ '--dv-cut': '8px' } as CSSProperties} title={nome}>
      <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(100deg,#ece5d8,#6b6357_40%,#bab09f_75%,var(--dv-cobalt))] opacity-70" />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,rgba(31,31,34,0.96),rgb(var(--dv-ink-rgb)/0.96))]" style={{ '--dv-cut': '7.6px' } as CSSProperties} />
      <span aria-hidden="true" className="grid h-8 w-6 place-items-center">
        {tipo === 'essencia' ? <CristalEssencia chave={chave} tamanho={28} className="h-8 w-auto" brilho={quantidade > 0} /> : <ChaveOrnamental className="w-7 -rotate-45" />}
      </span>
      <span className="sr-only">{nome}:</span>
      <span aria-hidden="true" className="max-w-[72px] truncate font-display text-[10.5px] font-semibold uppercase tracking-[0.05em] text-dv-text-2">
        {curto}
      </span>
      <span className={cn('dv-tabular font-mono text-[13px]', quantidade ? 'text-dv-text' : 'text-dv-text-3')}>×{quantidade}</span>
    </li>
  )
}
