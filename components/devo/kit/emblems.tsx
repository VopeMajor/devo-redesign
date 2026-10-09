'use client'

import { useId, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Emblemas do DEVO (Direção 2 §6): ícones de app e de sistema SEM fundo, ladrilho ou moldura.
   Família única: silhueta branca/prata cheia com recortes (fill-rule evenodd), linhas finas com
   remates pontiagudos (agulhas em losango), estrelas de 4 pontas e simetria. viewBox 48, legíveis
   de 28 a 56 px. Desenhos originais.

   Uso direto (cor = currentColor):   <EmblemRecord className="size-10 text-dv-text" />
   Prata com gradiente de metal:      <EmblemRecord metal className="size-12" />
   Com estados e selo de aviso:       <EmblemMark emblem={EmblemRecord} size={48} badge={3} />
   A assinatura aceita `strokeWidth` (ignorado) para servir onde antes ia um ícone lucide.
   ──────────────────────────────────────────────────────────────────────────────────────── */

export type EmblemProps = {
  className?: string
  style?: CSSProperties
  /** Gradiente de prata (aço claro com leve champanhe). Sem ele, pinta com currentColor. */
  metal?: boolean
  /** Nome acessível; sem ele o emblema é decorativo (aria-hidden). */
  title?: string
  /** Compatibilidade com ícones lucide (ignorado). */
  strokeWidth?: number | string
  'aria-hidden'?: boolean | 'true' | 'false'
}
export type EmblemComponent = ComponentType<EmblemProps>

const f = (n: number) => Math.round(n * 100) / 100

/** Agulha em losango de (x1,y1) a (x2,y2): meia-largura `w`, ponto mais largo em `at` (0..1). */
function needle(x1: number, y1: number, x2: number, y2: number, w = 1.2, at = 0.5) {
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const nx = (-dy / L) * w
  const ny = (dx / L) * w
  const mx = x1 + dx * at
  const my = y1 + dy * at
  return `M${f(x1)} ${f(y1)}L${f(mx + nx)} ${f(my + ny)}L${f(x2)} ${f(y2)}L${f(mx - nx)} ${f(my - ny)}Z`
}
/** Estrela de 4 pontas côncava (o sigilo). `k` = quanto a curva entra (0.12 fina … 0.3 gorda). */
function star(cx: number, cy: number, R: number, k = 0.2) {
  const c = R * k
  return `M${f(cx)} ${f(cy - R)}Q${f(cx + c)} ${f(cy - c)} ${f(cx + R)} ${f(cy)}Q${f(cx + c)} ${f(cy + c)} ${f(cx)} ${f(cy + R)}Q${f(cx - c)} ${f(cy + c)} ${f(cx - R)} ${f(cy)}Q${f(cx - c)} ${f(cy - c)} ${f(cx)} ${f(cy - R)}Z`
}
function lozenge(cx: number, cy: number, w: number, h = w) {
  return `M${f(cx)} ${f(cy - h)}L${f(cx + w)} ${f(cy)}L${f(cx)} ${f(cy + h)}L${f(cx - w)} ${f(cy)}Z`
}
function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`
}
/** Espelha um caminho de agulha no eixo x=24 (para pares simétricos). */
const mx = (x: number) => 48 - x

function Svg({ className, style, metal = false, title, children, ...rest }: EmblemProps & { children: ReactNode }) {
  const id = `dv-emb-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const paint = metal ? `url(#${id})` : 'currentColor'
  const hidden = title ? undefined : (rest['aria-hidden'] ?? true)
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('inline-block shrink-0', className)}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={hidden}
      fill={paint}
      stroke={paint}
      strokeWidth={0}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {metal && (
        <defs>
          <linearGradient id={id} x1="0.15" y1="0" x2="0.55" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.42" stopColor="#e3e0da" />
            <stop offset="0.58" stopColor="#f8f6f2" />
            <stop offset="1" stopColor="#b8b0a3" />
          </linearGradient>
        </defs>
      )}
      {children}
    </svg>
  )
}

/** Traço (sem preenchimento) que herda a tinta do emblema. */
function Line({ d, w = 1.8 }: { d: string; w?: number }) {
  return <path d={d} fill="none" strokeWidth={w} />
}
function Cut({ d }: { d: string }) {
  return <path d={d} fillRule="evenodd" clipRule="evenodd" />
}

/* ───────────────────────────────────── apps ───────────────────────────────────── */

/** Record — o olho do registro: amêndoa, íris com a estrela recortada, agulhas no eixo. */
export function EmblemRecord(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d="M4.5 24Q24 5.5 43.5 24Q24 42.5 4.5 24Z" w={2.2} />
      <Cut d={circle(24, 24, 7.6) + star(24, 24, 5.2, 0.16)} />
      <path d={needle(24, 1, 24, 13.2, 1.7, 0.6)} />
      <path d={needle(24, 34.8, 24, 47, 1.7, 0.4)} />
      <path d={star(8.5, 9.5, 3.4, 0.18)} />
      <path d={star(39.5, 9.5, 3.4, 0.18)} />
    </Svg>
  )
}

/** Pulso — ampulheta num anel, quatro agulhas cardeais e grãos nas diagonais. */
export function EmblemPulso(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d={circle(24, 24, 15)} w={1.8} />
      <Line d="M15.6 11.6H32.4M15.6 36.4H32.4" w={2.2} />
      <path d="M17.4 13.4H30.6L24 23.4Z" />
      <path d="M24 24.6L31.2 34.6H16.8Z" />
      <path d={needle(24, 0.8, 24, 8.4, 1.6)} />
      <path d={needle(24, 39.6, 24, 47.2, 1.6)} />
      <path d={needle(0.8, 24, 8.4, 24, 1.6)} />
      <path d={needle(39.6, 24, 47.2, 24, 1.6)} />
      {[45, 135, 225, 315].map((a) => {
        const r = (a * Math.PI) / 180
        return <path key={a} d={circle(24 + Math.sin(r) * 19.5, 24 - Math.cos(r) * 19.5, 1.1)} />
      })}
    </Svg>
  )
}

/** Mensagens — carta alada: envelope com selo de estrela e duas asas de três penas. */
export function EmblemMensagens(p: EmblemProps) {
  const feathers: [number, number, number, number, number][] = [
    [14, 21, 2.5, 11, 1.7],
    [14, 25, 1.5, 19.5, 1.6],
    [14, 29, 3.5, 28.5, 1.4],
  ]
  return (
    <Svg {...p}>
      <Line d="M14.5 15H33.5V33H14.5Z" w={2} />
      <Line d="M14.5 15L24 24L33.5 15" w={1.8} />
      <Cut d={circle(24, 25.5, 3.6) + star(24, 25.5, 2.4, 0.16)} />
      {feathers.map(([x1, y1, x2, y2, w]) => (
        <g key={y1}>
          <path d={needle(x1, y1, x2, y2, w, 0.35)} />
          <path d={needle(mx(x1), y1, mx(x2), y2, w, 0.35)} />
        </g>
      ))}
      <path d={needle(24, 33, 24, 45, 1.3, 0.3)} />
    </Svg>
  )
}

/** Cartas — leque de três cartas; a da frente cheia com a estrela recortada e pingente. */
export function EmblemCartas(p: EmblemProps) {
  return (
    <Svg {...p}>
      <g fill="none" strokeWidth={1.8}>
        <rect x="9.5" y="12" width="14" height="22" rx="1.6" transform="rotate(-17 16.5 23)" />
        <rect x="24.5" y="12" width="14" height="22" rx="1.6" transform="rotate(17 31.5 23)" />
      </g>
      <Cut d={'M18.6 8.5H29.4Q31 8.5 31 10.1V31.9Q31 33.5 29.4 33.5H18.6Q17 33.5 17 31.9V10.1Q17 8.5 18.6 8.5Z' + star(24, 21, 6.4, 0.16)} />
      <path d={needle(24, 33.5, 24, 46, 1.5, 0.3)} />
      <path d={needle(24, 1.5, 24, 8.5, 1.2, 0.5)} />
    </Svg>
  )
}

/** Sala de Trocas — duas chaves cruzadas com losango no cruzamento e estrela no alto. */
export function EmblemTrocas(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d={circle(11.5, 36.5, 5)} w={2} />
      <Line d={circle(36.5, 36.5, 5)} w={2} />
      <Line d="M15 33L38.5 9.5M33 33L9.5 9.5" w={2.2} />
      <Line d="M35 13L38.4 16.4M31.4 16.6L34.8 20M13 13L9.6 16.4M16.6 16.6L13.2 20" w={2} />
      <path d={star(11.5, 36.5, 2.6, 0.18)} />
      <path d={star(36.5, 36.5, 2.6, 0.18)} />
      <path d={lozenge(24, 24, 5.2, 6)} />
      <path d={star(24, 5.5, 4.6, 0.18)} />
    </Svg>
  )
}

/** Ajustes — bússola: rosa de oito agulhas sobre anel duplo. */
export function EmblemAjustes(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d={circle(24, 24, 13.5)} w={1.5} />
      <Line d={circle(24, 24, 16.2)} w={0.9} />
      <path d={needle(24, 24, 24, 1, 3.4, 0.24)} />
      <path d={needle(24, 24, 24, 47, 3.4, 0.24)} />
      <path d={needle(24, 24, 1, 24, 3.4, 0.24)} />
      <path d={needle(24, 24, 47, 24, 3.4, 0.24)} />
      {[
        [12, 12],
        [36, 12],
        [12, 36],
        [36, 36],
      ].map(([x, y]) => (
        <path key={`${x}${y}`} d={needle(24, 24, x, y, 2, 0.3)} />
      ))}
      <path d={circle(24, 24, 2.8)} />
    </Svg>
  )
}

/** Sala de Jogos — coroa de cinco pontas com losango recortado e estrela acima. */
export function EmblemJogos(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Cut d={'M12 32L8.6 16.8L17.4 24.2L24 12L30.6 24.2L39.4 16.8L36 32Z' + lozenge(24, 25.5, 2.6, 3.6)} />
      <path d="M11.6 33.8H36.4V37.4H11.6Z" />
      <Line d="M9 40.6H39" w={1.6} />
      <path d={circle(8.4, 15.4, 1.9)} />
      <path d={circle(39.6, 15.4, 1.9)} />
      <path d={star(24, 6.2, 5, 0.18)} />
      <path d={needle(24, 40.6, 24, 47, 1.2, 0.3)} />
    </Svg>
  )
}

/** Deadly Votes — duas espadas cruzadas com a estrela no cruzamento. */
export function EmblemVotes(p: EmblemProps) {
  return (
    <Svg {...p}>
      <path d={needle(14.5, 33.5, 40, 6, 1.9, 0.18)} />
      <path d={needle(33.5, 33.5, 8, 6, 1.9, 0.18)} />
      <Line d="M10.6 29.6L18.4 37.4M37.4 29.6L29.6 37.4" w={2.3} />
      <Line d="M14.5 33.5L9.2 38.8M33.5 33.5L38.8 38.8" w={2.6} />
      <path d={circle(7.8, 40.2, 2)} />
      <path d={circle(40.2, 40.2, 2)} />
      <path d={star(24, 22.5, 6.4, 0.2)} />
      <Line d="M12 41.5Q24 47.5 36 41.5" w={1.4} />
      <path d={star(24, 45, 2.6, 0.18)} />
    </Svg>
  )
}

/** Avisos — lanterna: argola, chapéu, vidro com chama e gota pontiaguda. */
export function EmblemAvisos(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d={circle(24, 4.8, 2.4)} w={1.6} />
      <path d="M15.5 14.4L24 7.6L32.5 14.4Z" />
      <Line d="M17.2 15.6V31H30.8V15.6M17.2 20.5Q24 13.8 30.8 20.5" w={1.9} />
      <path d="M24 18.6Q28.2 23.4 26.6 26.6Q24 29.6 21.4 26.6Q19.8 23.4 24 18.6Z" />
      <path d="M14.6 31.6H33.4L30.2 35.4H17.8Z" />
      <path d={needle(24, 35.4, 24, 46.5, 1.7, 0.3)} />
      <path d={needle(16.5, 22, 6, 17, 1.2, 0.35)} />
      <path d={needle(31.5, 22, 42, 17, 1.2, 0.35)} />
      <path d={needle(16.5, 27, 7, 30, 1, 0.35)} />
      <path d={needle(31.5, 27, 41, 30, 1, 0.35)} />
    </Svg>
  )
}

/* ─────────────────────────────── sistemas futuros ─────────────────────────────── */

/** Torres de Ruptura — agulha de torre com três janelas, fenda e contrafortes pontiagudos. */
export function EmblemTorres(p: EmblemProps) {
  return (
    <Svg {...p}>
      <path d="M24 1.5L30.4 16H17.6Z" />
      <Line d="M19 16.5V40H29V16.5" w={2} />
      {[21.5, 28, 34.5].map((y) => (
        <path key={y} d={lozenge(24, y, 2, 2.6)} />
      ))}
      <Line d="M29 21L26.6 25.2L29 28.4" w={1.3} />
      <Line d="M12.5 42.2H35.5" w={2} />
      <path d={needle(19, 38, 8.5, 26.5, 1.4, 0.35)} />
      <path d={needle(29, 38, 39.5, 26.5, 1.4, 0.35)} />
      <path d={star(9, 12, 3.2, 0.18)} />
      <path d={star(39, 12, 3.2, 0.18)} />
    </Svg>
  )
}

/** Poço dos Desejos — lua crescente com estrela, sobre a borda do poço e uma gota. */
export function EmblemPoco(p: EmblemProps) {
  return (
    <Svg {...p}>
      <path d="M28 6.75A11 11 0 1 0 28 27.25A10.5 10.5 0 0 1 28 6.75Z" />
      <path d={star(32.5, 15.5, 4.8, 0.18)} />
      <Line d="M9.5 32.6H38.5" w={2} />
      <Line d="M12.5 33.5Q24 44.5 35.5 33.5" w={2} />
      <path d={needle(24, 36, 24, 47, 1.4, 0.35)} />
      <path d={needle(9.5, 32.6, 3, 28, 1, 0.5)} />
      <path d={needle(38.5, 32.6, 45, 28, 1, 0.5)} />
    </Svg>
  )
}

/** Virtudes — asas de quatro penas em volta de um losango, com auréola. */
export function EmblemVirtudes(p: EmblemProps) {
  const feathers: [number, number, number, number, number][] = [
    [19.5, 21.5, 2.5, 9.5, 1.7],
    [19.5, 24.5, 1.5, 17.5, 1.7],
    [19.5, 27.5, 3, 25.5, 1.5],
    [20.5, 30.5, 8, 33, 1.3],
  ]
  return (
    <Svg {...p}>
      <Line d="M17 7.2A7 2.3 0 1 0 31 7.2A7 2.3 0 1 0 17 7.2Z" w={1.6} />
      <Cut d={lozenge(24, 24, 5, 12) + lozenge(24, 24, 2.2, 5.6)} />
      {feathers.map(([x1, y1, x2, y2, w]) => (
        <g key={y1}>
          <path d={needle(x1, y1, x2, y2, w, 0.3)} />
          <path d={needle(mx(x1), y1, mx(x2), y2, w, 0.3)} />
        </g>
      ))}
      <path d={needle(24, 36, 24, 46.5, 1.2, 0.3)} />
    </Svg>
  )
}

/** Arcanos — grande estrela de 4 pontas com o olho vazado e uma órbita com lua. */
export function EmblemArcanos(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Cut d={star(24, 24, 21, 0.15) + circle(24, 24, 3.4)} />
      <Line d="M5.2 24A19 6.6 0 1 0 42.8 24A19 6.6 0 1 0 5.2 24Z" w={1.4} />
      <path d={circle(41.2, 19.2, 2.1)} />
    </Svg>
  )
}

/** Corporações — escudo com três losangos, estrela no alto e remates nos ombros. */
export function EmblemCorporacoes(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Line d="M24 7.5L37.5 12V24Q37.5 35.8 24 42.5Q10.5 35.8 10.5 24V12Z" w={2.2} />
      <Line d="M15.2 15.6L24 18.6L32.8 15.6" w={1.4} />
      <path d={lozenge(18.5, 24.5, 2.6, 3.4)} />
      <path d={lozenge(29.5, 24.5, 2.6, 3.4)} />
      <path d={lozenge(24, 32, 2.6, 3.4)} />
      <path d={star(24, 4.2, 4, 0.18)} />
      <path d={needle(10.5, 12, 3, 5, 1.2, 0.4)} />
      <path d={needle(37.5, 12, 45, 5, 1.2, 0.4)} />
      <path d={needle(24, 42.5, 24, 47.5, 1, 0.3)} />
    </Svg>
  )
}

/** Salão das Máscaras — máscara de baile com olhos vazados, plumas pontiagudas e haste. */
export function EmblemMascaras(p: EmblemProps) {
  return (
    <Svg {...p}>
      <Cut d="M4.5 20Q12 13.6 24 19Q36 13.6 43.5 20Q42.4 30.4 33 31.2Q27 31.4 24 26.4Q21 31.4 15 31.2Q5.6 30.4 4.5 20Z M10.6 22.6Q15 19.2 19.6 23Q15 26.6 10.6 22.6Z M37.4 22.6Q33 19.2 28.4 23Q33 26.6 37.4 22.6Z" />
      <path d={needle(12, 17.2, 7.5, 3, 1.5, 0.35)} />
      <path d={needle(16.5, 16.6, 15.5, 5, 1.3, 0.35)} />
      <path d={needle(36, 17.2, 40.5, 3, 1.5, 0.35)} />
      <path d={needle(31.5, 16.6, 32.5, 5, 1.3, 0.35)} />
      <path d={star(24, 9.5, 4.2, 0.18)} />
      <path d={needle(24, 29.5, 24, 46.5, 1.2, 0.25)} />
    </Svg>
  )
}

/* ───────────────────────────────── registros ───────────────────────────────── */

/** Um emblema por app do shell (mesmos ids de `AppId`). */
export const APP_EMBLEMS = {
  record: EmblemRecord,
  pulso: EmblemPulso,
  mensagens: EmblemMensagens,
  cartas: EmblemCartas,
  trocas: EmblemTrocas,
  ajustes: EmblemAjustes,
  jogos: EmblemJogos,
} as const satisfies Record<string, EmblemComponent>

/** Um emblema por sistema futuro (mesmos ids de `FUTURE_SYSTEMS`). */
export const SYSTEM_EMBLEMS = {
  torres: EmblemTorres,
  poco: EmblemPoco,
  virtudes: EmblemVirtudes,
  arcanos: EmblemArcanos,
  corporacoes: EmblemCorporacoes,
  mascaras: EmblemMascaras,
} as const satisfies Record<string, EmblemComponent>

/**
 * Emblema com estados, sem fundo: repouso (prata), `hover`/foco (acende), pressionado (brilho de
 * metal champanhe — via `group-active` do botão pai ou `state="pressed"`), `selected` (halo de
 * ametista embaixo) e `badge` (selo pequeno em rubi: `true` = ponto, número = contador).
 */
export function EmblemMark({
  emblem: E,
  size = 48,
  state = 'rest',
  badge,
  metal = true,
  className,
}: {
  emblem: EmblemComponent
  size?: number
  state?: 'rest' | 'pressed' | 'selected' | 'locked'
  badge?: boolean | number
  metal?: boolean
  className?: string
}) {
  return (
    <span aria-hidden="true" className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      {state === 'selected' && <span className="absolute inset-x-[8%] bottom-[-6%] h-[40%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(138,124,200,0.55),transparent_70%)]" />}
      <E
        metal={metal && state !== 'locked'}
        className={cn(
          'relative size-full transition-[filter,opacity,transform] duration-150',
          state === 'locked' ? 'text-dv-text-3 opacity-60' : 'text-dv-text',
          state === 'rest' && 'drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.7)] group-hover:drop-shadow-[0_0_6px_rgba(238,237,235,0.35)] group-active:scale-[0.96] group-active:drop-shadow-[0_0_10px_rgba(236,229,216,0.85)]',
          state === 'pressed' && 'scale-[0.96] drop-shadow-[0_0_10px_rgba(236,229,216,0.85)]',
          state === 'selected' && 'drop-shadow-[0_0_8px_rgba(194,185,236,0.7)]',
        )}
      />
      {badge ? (
        typeof badge === 'number' ? (
          <span className="absolute -right-[6%] -top-[4%] grid h-4 min-w-4 place-items-center rounded-full bg-dv-blood px-1 font-mono text-[10px] leading-none text-white shadow-[0_0_8px_rgba(163,18,31,0.8)]">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : (
          <span className="absolute right-[4%] top-[4%] size-2 rotate-45 bg-dv-blood shadow-[0_0_6px_rgba(163,18,31,0.9)]" />
        )
      ) : null}
    </span>
  )
}
