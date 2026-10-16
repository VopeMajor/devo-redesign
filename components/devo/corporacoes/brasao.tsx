'use client'

import { useId } from 'react'
import { BRASAO_COR, type Brasao, type BrasaoForma } from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'

/**
 * Brasão/sinete de uma Corporação, gerado a partir de forma + cor da paleta (escolhidos na fundação) e da
 * inicial do nome. SVG procedural: campo na cor escolhida (gradiente do próprio material), aro de aço champanhe,
 * estrela de 4 pontas do sigilo no topo. `necro` racha o campo e pinga uma gota de rubi (só alerta).
 */

const STAR = (cx: number, cy: number, r: number, k = 0.24) =>
  `M${cx} ${cy - r}L${cx + r * k} ${cy - r * k}L${cx + r} ${cy}L${cx + r * k} ${cy + r * k}L${cx} ${cy + r}L${cx - r * k} ${cy + r * k}L${cx - r} ${cy}L${cx - r * k} ${cy - r * k}Z`

/** Contorno de cada forma num quadro 100×120 (centro ≈ 50,62). */
const FORMA: Record<BrasaoForma, string> = {
  escudo: 'M50 10L86 22V58Q86 94 50 112Q14 94 14 58V22Z',
  losango: 'M50 8L92 62L50 116L8 62Z',
  estrela: STAR(50, 62, 50, 0.42),
  sol: (() => {
    const pts: string[] = []
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 48 : 38
      pts.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(62 + Math.sin(a) * r).toFixed(2)}`)
    }
    return `M${pts.join('L')}Z`
  })(),
  coroa: 'M14 40L30 56L40 26L50 46L60 26L70 56L86 40L80 104Q50 114 20 104Z',
  chave: 'M50 8A28 28 0 0 1 57 63.1V84H69V93H57V100H65V109H57V116H43V63.1A28 28 0 0 1 50 8Z',
}

/** Onde fica a inicial (o centro visual de cada forma). */
const CENTRO: Record<BrasaoForma, { x: number; y: number; s: number }> = {
  escudo: { x: 50, y: 66, s: 40 },
  losango: { x: 50, y: 64, s: 36 },
  estrela: { x: 50, y: 64, s: 30 },
  sol: { x: 50, y: 64, s: 36 },
  coroa: { x: 50, y: 82, s: 34 },
  chave: { x: 50, y: 38, s: 30 },
}

export function BrasaoCorp({
  brasao,
  necro = false,
  className,
  title,
}: {
  brasao: Brasao
  necro?: boolean
  className?: string
  /** Nome acessível; sem ele o desenho é decorativo. */
  title?: string
}) {
  const id = useId().replace(/:/g, '')
  const cor = BRASAO_COR[brasao.cor]
  const d = FORMA[brasao.forma]
  const c = CENTRO[brasao.forma]
  return (
    <svg viewBox="0 0 100 124" className={cn('overflow-visible', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`f${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={cor.claro} />
          <stop offset="0.5" stopColor={cor.meio} />
          <stop offset="1" stopColor={cor.escuro} />
        </linearGradient>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.45" stopColor="#bab09f" />
          <stop offset="0.7" stopColor="#6b6357" />
          <stop offset="1" stopColor="#dcd5c8" />
        </linearGradient>
        <radialGradient id={`l${id}`} cx="0.35" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <path d={d} fillRule="evenodd" />
        </clipPath>
      </defs>
      {/* sombra projetada */}
      <path d={d} fillRule="evenodd" fill="#000" opacity="0.55" transform="translate(0 3)" />
      {/* campo */}
      <path d={d} fillRule="evenodd" fill={`url(#f${id})`} />
      <g clipPath={`url(#c${id})`}>
        {/* veios do material */}
        <path d="M-4 40C22 30 30 62 58 50S96 70 108 58" fill="none" stroke={cor.tinta} strokeOpacity="0.12" strokeWidth="1.2" />
        <path d="M-6 88C20 80 44 100 70 86S100 98 110 90" fill="none" stroke={cor.tinta} strokeOpacity="0.1" strokeWidth="0.9" />
        <rect x="0" y="0" width="100" height="124" fill={`url(#l${id})`} />
        {necro && (
          <path d="M58 6L50 34L60 46L44 70L54 84L46 118" fill="none" stroke="#0c0c0e" strokeWidth="2.4" strokeLinejoin="bevel" opacity="0.85" />
        )}
      </g>
      {/* aro de aço */}
      <path d={d} fillRule="evenodd" fill="none" stroke={`url(#a${id})`} strokeWidth="3.2" strokeLinejoin="round" />
      <path d={d} fillRule="evenodd" fill="none" stroke={cor.tinta} strokeOpacity="0.35" strokeWidth="0.8" transform="translate(50 62) scale(0.88) translate(-50 -62)" />
      {/* inicial */}
      <text
        x={c.x}
        y={c.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display), Cinzel, serif"
        fontWeight={600}
        fontSize={c.s}
        fill={cor.tinta}
        style={{ paintOrder: 'stroke' }}
        stroke={cor.claro}
        strokeOpacity="0.25"
        strokeWidth="0.6"
      >
        {brasao.inicial}
      </text>
      {/* estrela do sigilo */}
      <path d={STAR(50, brasao.forma === 'losango' || brasao.forma === 'estrela' || brasao.forma === 'sol' ? 4 : 5, 6.5)} fill={`url(#a${id})`} />
      {necro && <path d="M78 96C78 96 72 104 72 108A6 6 0 0 0 84 108C84 104 78 96 78 96Z" fill="#a3121f" stroke="#3f060b" strokeWidth="0.8" />}
    </svg>
  )
}
