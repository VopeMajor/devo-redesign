'use client'

/**
 * Emblemas dos jogos da Sala (mesma família dos emblemas de app do kit, `kit/emblems.tsx`):
 * silhueta prata cheia com recortes, agulhas em losango como remate, estrelas de 4 pontas e
 * simetria. viewBox 48, sem fundo. Desenhos originais. Candidatos ao kit.
 */
import { type CSSProperties, type ReactNode, useId } from 'react'
import type { GameId } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'

const f = (n: number) => Math.round(n * 100) / 100

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

type Props = { className?: string; style?: CSSProperties; metal?: boolean; title?: string }

function Svg({ className, style, metal = false, title, children }: Props & { children: ReactNode }) {
  const id = `dv-game-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const paint = metal ? `url(#${id})` : 'currentColor'
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('inline-block shrink-0', className)}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
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
const Line = ({ d, w = 1.8 }: { d: string; w?: number }) => <path d={d} fill="none" strokeWidth={w} />
const Cut = ({ d }: { d: string }) => <path d={d} fillRule="evenodd" clipRule="evenodd" />

/** Memory Rush — par de cartas: uma virada (contorno), outra revelada com a estrela recortada. */
export function EmblemMemory(p: Props) {
  return (
    <Svg {...p}>
      <Line d="M7.5 12.5H19.5V35.5H7.5Z" w={1.8} />
      <Line d="M10.5 16H16.5V32H10.5Z" w={0.9} />
      <Cut d={'M28.5 12.5H40.5V35.5H28.5Z' + star(34.5, 24, 5.6, 0.16)} />
      <path d={lozenge(24, 24, 2.2, 3.4)} />
      <path d={needle(24, 1.5, 24, 13, 1.4, 0.6)} />
      <path d={needle(24, 35, 24, 46.5, 1.4, 0.4)} />
      <path d={star(13.5, 6.5, 2.6, 0.18)} />
      <path d={star(34.5, 41.5, 2.6, 0.18)} />
    </Svg>
  )
}

/** Living Chess — rei de mármore: base em degraus, corpo com losango vazado, estrela no lugar da cruz. */
export function EmblemChess(p: Props) {
  return (
    <Svg {...p}>
      <Cut d={'M18.4 36.4L20.6 21.6H27.4L29.6 36.4Z' + lozenge(24, 29, 1.9, 3.2)} />
      <path d="M17.6 17.4H30.4L28.8 20.6H19.2Z" />
      <path d="M14.4 37.6H33.6V40.4H14.4Z" />
      <Line d="M11 43.4H37" w={1.6} />
      <path d={star(24, 10.2, 5.6, 0.18)} />
      <path d={needle(4, 43.4, 11, 43.4, 1.1, 0.5)} />
      <path d={needle(37, 43.4, 44, 43.4, 1.1, 0.5)} />
      <path d={circle(12.6, 15.6, 1.5)} />
      <path d={circle(35.4, 15.6, 1.5)} />
    </Svg>
  )
}

/** Bomba Quente — bomba redonda com a estrela vazada, pavio em arco e faísca de quatro pontas. */
export function EmblemBomb(p: Props) {
  return (
    <Svg {...p}>
      <Cut d={circle(22, 28.5, 12.4) + star(22, 28.5, 7, 0.16)} />
      <path d="M27.6 15.8L31.6 19.6L29.4 21.8L25.4 18Z" />
      <Line d="M30.6 17.4Q33.8 11 39 11.4" w={1.6} />
      <path d={star(40.6, 8.6, 5.2, 0.16)} />
      <path d={needle(40.6, 1, 40.6, 3.2, 0.6)} />
      <path d={needle(22, 41, 22, 47, 1.2, 0.3)} />
      <path d={circle(6.4, 14, 1.3)} />
    </Svg>
  )
}

/** Blefe — carta da frente com o losango vazado e uma carta atrás inclinada; a pálpebra baixa por cima. */
export function EmblemBluff(p: Props) {
  return (
    <Svg {...p}>
      <g fill="none" strokeWidth={1.8}>
        <rect x="25" y="13" width="14" height="22" rx="1.6" transform="rotate(16 32 24)" />
      </g>
      <Cut d={'M12.6 12.5H25.4Q27 12.5 27 14.1V36.9Q27 38.5 25.4 38.5H12.6Q11 38.5 11 36.9V14.1Q11 12.5 12.6 12.5Z' + lozenge(19, 25.5, 4.2, 6.4)} />
      <Line d="M9.5 7.2Q19 1.8 28.5 7.2" w={1.7} />
      <path d={lozenge(19, 6.1, 1.4, 1.4)} />
      <path d={needle(19, 38.5, 19, 46.5, 1.3, 0.3)} />
      <path d={star(38.5, 42, 2.8, 0.18)} />
    </Svg>
  )
}

export const GAME_EMBLEM: Record<GameId, (p: Props) => ReactNode> = {
  'memory-rush': EmblemMemory,
  chess: EmblemChess,
  'hot-bomb': EmblemBomb,
  bluff: EmblemBluff,
}

export function GameEmblem({ gameId, ...p }: { gameId: GameId } & Props) {
  const E = GAME_EMBLEM[gameId]
  return <E {...p} />
}
