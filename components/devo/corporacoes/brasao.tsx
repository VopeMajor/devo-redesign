'use client'

import { type CSSProperties, useId } from 'react'
import { BRASAO_COR, type Brasao, type BrasaoForma } from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'

/**
 * Brasão/sinete de uma Corporação, gerado a partir de forma + cor da paleta (escolhidos na fundação) e da
 * inicial do nome. SVG procedural: campo na cor escolhida (gradiente do próprio material) com losangos gravados,
 * aro de aço champanhe duplo, filete de pontos, bisel e a estrela de 4 pontas do sigilo (com raios) no topo. `necro` racha o campo e pinga uma gota de rubi (só alerta).
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
  style,
}: {
  brasao: Brasao
  necro?: boolean
  className?: string
  style?: CSSProperties
  /** Nome acessível; sem ele o desenho é decorativo. */
  title?: string
}) {
  const id = useId().replace(/:/g, '')
  const cor = BRASAO_COR[brasao.cor]
  const d = FORMA[brasao.forma]
  const c = CENTRO[brasao.forma]
  return (
    <svg viewBox="0 0 100 124" className={cn('overflow-visible', className)} style={style} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
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
      {/* aro externo fino, afastado do campo */}
      <path d={d} fillRule="evenodd" fill="none" stroke={`url(#a${id})`} strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" transform="translate(50 62) scale(1.09) translate(-50 -62)" />
      {/* campo */}
      <path d={d} fillRule="evenodd" fill={`url(#f${id})`} />
      <g clipPath={`url(#c${id})`}>
        {/* losangos gravados no campo (heráldica: "diapré") */}
        <path
          d={Array.from({ length: 13 }, (_, i) => `M${i * 12 - 60} 0L${i * 12 + 64} 124M${i * 12 + 64} 0L${i * 12 - 60} 124`).join('')}
          fill="none"
          stroke={cor.tinta}
          strokeOpacity="0.07"
          strokeWidth="0.7"
        />
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
      {/* filete de pontos gravados */}
      <path d={d} fillRule="evenodd" fill="none" stroke={cor.claro} strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 3.6" transform="translate(50 62) scale(0.8) translate(-50 -62)" />
      {/* brilho do bisel (luz do alto à esquerda) */}
      <path d={d} fillRule="evenodd" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.7" transform="translate(-0.8 -0.8)" clipPath={`url(#c${id})`} />
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
      {/* estrela do sigilo, com raios finos */}
      {(() => {
        const sy = brasao.forma === 'losango' || brasao.forma === 'estrela' || brasao.forma === 'sol' ? 4 : 5
        return (
          <g>
            <path d={STAR(50, sy, 11, 0.06)} fill={`url(#a${id})`} opacity="0.55" />
            <path d={STAR(50, sy, 7, 0.24)} fill={`url(#a${id})`} stroke="#3a352e" strokeWidth="0.4" />
            <circle cx={50} cy={sy} r={1.4} fill={cor.claro} />
          </g>
        )
      })()}
      {necro && <path d="M78 96C78 96 72 104 72 108A6 6 0 0 0 84 108C84 104 78 96 78 96Z" fill="#a3121f" stroke="#3f060b" strokeWidth="0.8" />}
    </svg>
  )
}

/** Brasão num nicho: halo (ametista, ou rubi na Necro) e dois hexágonos finos da Companhia atrás. */
export function NichoBrasao({ brasao, necro = false, title, tamanho = 112, className }: { brasao: Brasao; necro?: boolean; title?: string; tamanho?: number; className?: string }) {
  const w = tamanho
  const h = Math.round(tamanho * 1.25)
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: w, height: h }}>
      <span aria-hidden="true" className={cn('absolute inset-0 rounded-full blur-md', necro ? 'bg-[radial-gradient(circle,rgb(var(--dv-blood-rgb)/0.35),transparent_68%)]' : 'bg-[radial-gradient(circle,rgb(var(--dv-amethyst-rgb)/0.3),transparent_68%)]')} />
      <svg aria-hidden="true" viewBox="0 0 112 140" className="absolute inset-0 size-full">
        <path d="M56 6 104 34v72L56 134 8 106V34Z" fill="none" stroke="#d6cdbd" strokeOpacity="0.18" />
        <path d="M56 14 97 38v64l-41 24-41-24V38Z" fill="none" stroke="#d6cdbd" strokeOpacity="0.1" strokeDasharray="2 4" />
      </svg>
      <BrasaoCorp brasao={brasao} necro={necro} title={title} className="animate-dv-pop relative drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)]" style={{ width: w * 0.85, height: h * 0.85 }} />
    </span>
  )
}
