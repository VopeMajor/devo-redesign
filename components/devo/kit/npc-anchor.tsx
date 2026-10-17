'use client'

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { npcPortrait, resolveExpressao } from '@/lib/devo/npcs'
import ROSTOS from '@/lib/devo/npc-rostos.json'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Encenação única dos NPCs (DIRECAO-3 §9, pedido do dono 16/10 18:23): o retrato fica ANCORADO
   na caixa de fala — a base do busto encosta (e passa um pouco por trás) do topo da caixa, sem vão,
   em qualquer altura de tela. Também o medalhão redondo, com o rosto inteiro de cada NPC.

   Geometria comum dos sprites OC (scripts/dev/fatiar-npcs.py): tela 1080×960, cabeça ~345 px,
   queixo em y≈508. A linha de corte de cada folha (manifest.json → linhaDeCorte) diz onde o
   desenho termina; o busto mostra do alto (y=60) até min(corte, 770): cabeça + ombros, nunca o
   tronco inteiro. O Rato e o Javali saíram do fatiador com escala/centro diferentes: o centro
   horizontal e a janela do rosto são ajustados por NPC.

   Uso (a cena só diz qual é a caixa de fala):
     const [fala, setFala] = useState<HTMLElement | null>(null)
     <div className="relative ...">            // pai posicionado (o retrato mede a partir dele)
       <NpcAnchor npc="rato" pose="sorriso" fala={fala} />
       <div ref={setFala}>caixa de fala</div>  // z-index acima do retrato
     </div>
   Medalhão:  <NpcMedallion npc="rato" size={52} />
   ──────────────────────────────────────────────────────────────────────────────────────── */

export const NPC_SPRITE = { w: 1080, h: 960, cabeca: 345, queixo: 508 } as const

/** Linha de corte de cada folha (fração da altura; manifest.json do fatiador). */
const CORTE: Record<string, number> = { melissa: 0.8521, galo: 0.7506, herdeiro: 0.729, javali: 0.9434, rato: 0.8885, coruja: 0.7663 }
/** Centro horizontal do busto (px da tela do sprite) quando o desenho não está no meio. */
const CENTRO: Record<string, number> = { rato: 440, javali: 600 }
/** Janela do rosto para medalhões: centro (cx, cy) e lado, em px da tela do sprite. */
const ROSTO: Record<string, { cx: number; cy: number; lado: number }> = {
  melissa: { cx: 505, cy: 335, lado: 560 },
  galo: { cx: 540, cy: 335, lado: 560 },
  herdeiro: { cx: 545, cy: 330, lado: 560 },
  coruja: { cx: 535, cy: 330, lado: 560 },
  javali: { cx: 612, cy: 375, lado: 470 },
  rato: { cx: 415, cy: 380, lado: 560 },
}
const ROSTO_PADRAO = { cx: 540, cy: 335, lado: 560 }

/**
 * Janela do rosto da EXPRESSÃO (a cabeça muda de lugar entre as poses): medida na própria imagem por
 * scripts/dev/rostos-npcs.py (lib/devo/npc-rostos.json). Sem medida, cai na janela do NPC.
 */
function rostoDe(npc: string, pose?: string) {
  const m = (ROSTOS as Record<string, Record<string, number[]>>)[npc]?.[resolveExpressao(npc, pose)]
  return m ? { cx: m[0], cy: m[1], lado: m[2] } : (ROSTO[npc] ?? ROSTO_PADRAO)
}

const TOPO = 60
const BASE_MAX = 770

/** Janela vertical do busto (px da tela do sprite). */
export function npcBusto(npc: string) {
  const c = CORTE[npc]
  const base = Math.min(BASE_MAX, c ? Math.round(c * NPC_SPRITE.h) : BASE_MAX)
  return { topo: TOPO, base, cx: CENTRO[npc] ?? NPC_SPRITE.w / 2 }
}

/** Arte do busto recortada (preenche o contêiner, que deve ter a proporção 1080:(base−topo)). */
function BustArt({ npc, src, fade, overlay }: { npc: string; src: string; fade: boolean; overlay?: ReactNode }) {
  const { topo, base, cx } = npcBusto(npc)
  const h = base - topo
  // a base some nos últimos ~24% da janela (stops em fração da imagem inteira, 960 px)
  const pct = (y: number) => `${((y / NPC_SPRITE.h) * 100).toFixed(2)}%`
  const mask = fade
    ? `linear-gradient(to bottom, #000 0%, #000 ${pct(base - h * 0.24)}, rgba(0,0,0,0.5) ${pct(base - h * 0.1)}, transparent ${pct(base)})`
    : undefined
  const box: CSSProperties = {
    width: '100%',
    height: `${(NPC_SPRITE.h / h) * 100}%`,
    top: `${(-topo / h) * 100}%`,
    left: `${((NPC_SPRITE.w / 2 - cx) / NPC_SPRITE.w) * 100}%`,
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} decoding="async" className="absolute max-w-none select-none" style={{ ...box, WebkitMaskImage: mask, maskImage: mask }} />
      {overlay && (
        // efeito só sobre a silhueta: mesma caixa da imagem, máscara = o próprio sprite
        <span
          aria-hidden="true"
          className="absolute overflow-hidden"
          style={{ ...box, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}
        >
          {overlay}
        </span>
      )}
    </>
  )
}

/**
 * Mede a posição da caixa de fala em relação ao pai posicionado de `self` (sem transformações):
 * `bottom` = distância do pé do pai ao topo da caixa; `espaco` = altura livre acima da caixa menos a reserva.
 * Exportado para cenas cujo NPC não é um sprite do elenco (ex.: a figura encapuzada do Poço).
 */
export function useFalaAncora(fala: HTMLElement | null, self: RefObject<HTMLDivElement | null>, reserva: number) {
  const [pos, setPos] = useState<{ bottom: number; espaco: number } | null>(null)
  useLayoutEffect(() => {
    const el = self.current
    if (!el || !fala) return
    const medir = () => {
      const pai = el.offsetParent as HTMLElement | null
      if (!pai || !fala.isConnected) return
      const pr = pai.getBoundingClientRect()
      // topo da caixa pela posição de layout (offsetTop) dentro do seu próprio pai: ignora a animação de
      // entrada da caixa (transform), que deslocaria a medida no meio do movimento.
      const fp = fala.offsetParent as HTMLElement | null
      const fpTop = fp ? fp.getBoundingClientRect().top : fala.getBoundingClientRect().top - fala.offsetTop
      const escala = pai.offsetHeight ? pr.height / pai.offsetHeight : 1
      const topoCaixa = (fpTop + fala.offsetTop * escala - pr.top) / escala
      const next = { bottom: Math.round(pai.offsetHeight - topoCaixa), espaco: Math.max(0, Math.round(topoCaixa - reserva)) }
      setPos((p) => (p && p.bottom === next.bottom && p.espaco === next.espaco ? p : next))
    }
    medir()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null
    ro?.observe(fala)
    if (el.offsetParent) ro?.observe(el.offsetParent)
    if (fala.offsetParent) ro?.observe(fala.offsetParent)
    window.addEventListener('resize', medir)
    const t = window.setTimeout(medir, 120)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', medir)
      window.clearTimeout(t)
    }
  }, [fala, self, reserva])
  return pos
}

export type NpcAnchorProps = {
  npc: string
  /** Expressão atual. */
  pose?: string
  /** Expressões que ficam montadas e trocam por opacidade (cross-fade); por padrão só a atual. */
  poses?: readonly string[]
  /** Caixa de fala à qual o retrato se ancora. Sem ela o retrato fica no pé do pai. */
  fala: HTMLElement | null
  /** Altura da cabeça na tela (CSS). O busto escala a partir dela. */
  cabeca?: string
  /** Espaço livre no alto (px) que o busto nunca invade (barra superior, título). */
  reserva?: number
  /** Quanto a base passa por trás do topo da caixa (px). */
  sobreposicao?: number
  /** Deslocamento horizontal (CSS) a partir do centro do pai; negativo = esquerda. */
  deslocamento?: string
  /** Nome acessível (sem ele o retrato é decorativo). */
  alt?: string
  /** Classes do busto (animação de entrada, filtro de "não está falando"…). */
  className?: string
  /** Classes do posicionador (ex.: no desktop, ao lado da caixa: `lg:!left-auto lg:!right-full lg:![transform:none]`; `!` vence o estilo em linha). */
  outerClassName?: string
  style?: CSSProperties
  /** Camadas extras sobre o busto (silhueta, luz). Recebem o mesmo recorte se usarem `NpcBustLayer`. */
  children?: ReactNode
  /** Base dissolvida (padrão). */
  dissolver?: boolean
  /** Efeito pintado só dentro da silhueta da pose atual (ex.: varredura de holograma). */
  sobreArte?: ReactNode
}

/**
 * Retrato de NPC ancorado ao topo da caixa de fala. Absoluto em relação ao pai posicionado; mede a caixa
 * (ResizeObserver) e encosta a base do busto nela, limitando a altura ao espaço livre acima.
 */
export function NpcAnchor({
  npc,
  pose,
  poses,
  fala,
  cabeca = 'min(15dvh, 132px)',
  reserva = 64,
  sobreposicao = 16,
  deslocamento = '0px',
  alt,
  className,
  outerClassName,
  style,
  children,
  dissolver = true,
  sobreArte,
}: NpcAnchorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useFalaAncora(fala, ref, reserva)
  const { topo, base } = npcBusto(npc)
  const ratio = (base - topo) / NPC_SPRITE.cabeca
  const atual = resolveExpressao(npc, pose)
  const lista = Array.from(new Set([...(poses ?? []).map((p) => resolveExpressao(npc, p)), atual]))
  const altura = pos ? `min(calc(${cabeca} * ${ratio.toFixed(4)}), ${pos.espaco + sobreposicao}px)` : `calc(${cabeca} * ${ratio.toFixed(4)})`
  return (
    <div
      ref={ref}
      aria-hidden={alt ? undefined : true}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      className={cn('pointer-events-none absolute left-1/2', !pos && fala && 'opacity-0', outerClassName)}
      style={
        {
          bottom: pos ? pos.bottom - sobreposicao : 0,
          height: altura,
          aspectRatio: `${NPC_SPRITE.w} / ${base - topo}`,
          transform: `translateX(calc(-50% + ${deslocamento}))`,
        } as CSSProperties
      }
    >
      <div className={cn('relative size-full', className)} style={style}>
        {lista.map((p) => {
          const src = npcPortrait(npc, p)?.src
          if (!src) return null
          return (
            <div key={p} className={cn('npc-pose absolute inset-0 overflow-hidden transition-opacity duration-500', p === atual ? 'opacity-100' : 'opacity-0')}>
              <BustArt npc={npc} src={src} fade={dissolver} overlay={p === atual ? sobreArte : undefined} />
            </div>
          )
        })}
        {children}
      </div>
    </div>
  )
}

/** Uma camada com o mesmo recorte do busto (ex.: silhueta de aproximação), para pôr dentro do NpcAnchor. */
export function NpcBustLayer({ npc, pose, className, style }: { npc: string; pose?: string; className?: string; style?: CSSProperties }) {
  const src = npcPortrait(npc, pose)?.src
  if (!src) return null
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} style={style}>
      <BustArt npc={npc} src={src} fade />
    </div>
  )
}

/**
 * Medalhão redondo de NPC: o rosto inteiro (chapéu, cabelo, chifres) centrado, sem o tronco, com a base
 * dissolvida. Janela por NPC (o Rato e o Javali têm escala e centro próprios).
 */
export function NpcMedallion({
  npc,
  pose,
  size = 52,
  ring = 'rgba(206,201,192,0.42)',
  className,
  children,
}: {
  npc: string
  pose?: string
  /** Diâmetro (px ou CSS). */
  size?: number | string
  /** Cor do filete. */
  ring?: string
  className?: string
  /** Substituto quando o NPC não tem retrato (ex.: "?"). */
  children?: ReactNode
}) {
  const src = npcPortrait(npc, pose)?.src
  const f = rostoDe(npc, pose)
  const x = f.cx - f.lado / 2
  const y = f.cy - f.lado / 2
  const mask = 'linear-gradient(to bottom, #000 74%, transparent 100%)'
  return (
    <span aria-hidden="true" className={cn('relative block shrink-0 rounded-full', className)} style={{ width: size, aspectRatio: '1' }}>
      <span
        className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(closest-side_at_50%_42%,rgb(var(--dv-amethyst-rgb)/0.22),rgba(18,18,20,0.95))]"
        style={{ boxShadow: `inset 0 0 0 1px ${ring}` }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute max-w-none select-none"
            style={{
              width: `${(NPC_SPRITE.w / f.lado) * 100}%`,
              height: `${(NPC_SPRITE.h / f.lado) * 100}%`,
              left: `${(-x / f.lado) * 100}%`,
              top: `${(-y / f.lado) * 100}%`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
        ) : (
          children
        )}
      </span>
    </span>
  )
}
