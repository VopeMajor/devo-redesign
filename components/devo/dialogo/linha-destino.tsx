'use client'

import type { CSSProperties } from 'react'
import type { Destino } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'

/**
 * LINHA DO DESTINO (Karma) — qualitativa, sem número. Um fio de aço sai do equilíbrio (esquerda) e termina
 * mais alto (ordem) ou mais baixo (caos). A intensidade (0–3, faixas provisórias em lib/devo/progresso.ts)
 * só muda a altura e o brilho da ponta. Reutilizável no perfil/Virtudes: `<LinhaDestino destino={eu.destino} />`.
 *
 * `demo` (cena do Galo): `neutro` | `ordem` | `caos` | `ambos` (os dois caminhos fantasmas).
 */
const W = 320
const H = 132
const MID = H / 2
const STEP = 15

const INTENS = ['neutra', 'leve', 'firme', 'intensa'] as const

function fio(nivel: number) {
  const end = MID - nivel * STEP
  // Sai reto do equilíbrio, hesita no meio (o destino ainda decide) e vai para a ponta.
  return `M14 ${MID} C 90 ${MID}, 130 ${MID + nivel * 2}, 180 ${MID - nivel * 4} S 260 ${end}, ${W - 26} ${end}`
}

export function descreverDestino(d: Destino) {
  if (d.direcao === 'equilibrio') return 'Linha do destino: equilíbrio.'
  return `Linha do destino: ${d.direcao === 'ordem' ? 'rumo à ordem' : 'rumo ao caos'}, ${INTENS[d.intensidade]}.`
}

export function LinhaDestino({
  destino,
  demo,
  className,
  compacta = false,
}: {
  destino?: Destino
  demo?: 'neutro' | 'ordem' | 'caos' | 'ambos'
  className?: string
  compacta?: boolean
}) {
  const real = destino ?? { direcao: 'equilibrio' as const, intensidade: 0 as const }
  const nivel = demo === 'ordem' ? 3 : demo === 'caos' ? -3 : demo ? 0 : real.direcao === 'ordem' ? real.intensidade : real.direcao === 'caos' ? -real.intensidade : 0
  const label = demo
    ? demo === 'ordem'
      ? 'Linha do destino subindo rumo à ordem.'
      : demo === 'caos'
        ? 'Linha do destino descendo rumo ao caos.'
        : demo === 'ambos'
          ? 'Linha do destino: os dois caminhos, ordem e caos.'
          : 'Linha do destino em equilíbrio.'
    : descreverDestino(real)
  const endY = MID - nivel * STEP
  const tom = nivel > 0 ? 'ordem' : nivel < 0 ? 'caos' : 'neutro'
  return (
    <figure role="img" aria-label={label} className={cn('relative select-none', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className={cn('block w-full overflow-visible', compacta ? 'h-20' : 'h-[132px]')} fill="none">
        <defs>
          <linearGradient id="ld-fio" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6b6357" />
            <stop offset="0.55" stopColor="#bab09f" />
            <stop offset="1" stopColor={tom === 'ordem' ? '#ece5d8' : tom === 'caos' ? '#a89be0' : '#bab09f'} />
          </linearGradient>
          <radialGradient id="ld-ponta">
            <stop offset="0" stopColor={tom === 'caos' ? '#c2b9ec' : '#f4efe4'} stopOpacity="0.9" />
            <stop offset="1" stopColor={tom === 'caos' ? '#8a7cc8' : '#bab09f'} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Régua: ordem no alto, caos embaixo; marcas de nível sem números. */}
        <line x1="14" x2={W - 26} y1={MID} y2={MID} stroke="var(--dv-line-strong)" strokeDasharray="2 5" />
        {[1, 2, 3].map((n) => (
          <g key={n} stroke="var(--dv-line)" strokeWidth="1">
            <line x1={W - 30} x2={W - 22} y1={MID - n * STEP} y2={MID - n * STEP} />
            <line x1={W - 30} x2={W - 22} y1={MID + n * STEP} y2={MID + n * STEP} />
          </g>
        ))}
        <line x1={W - 26} x2={W - 26} y1={MID - 3 * STEP - 6} y2={MID + 3 * STEP + 6} stroke="var(--dv-line-strong)" />
        {demo === 'ambos' && (
          <>
            <path d={fio(3)} stroke="#ece5d8" strokeOpacity="0.35" strokeWidth="1.2" className="ld-draw" />
            <path d={fio(-3)} stroke="#a89be0" strokeOpacity="0.45" strokeWidth="1.2" className="ld-draw" />
          </>
        )}
        <path key={`f${nivel}${demo}`} d={fio(nivel)} stroke="url(#ld-fio)" strokeWidth="2" strokeLinecap="round" className="ld-draw" />
        <circle key={`p${nivel}${demo}`} cx={W - 26} cy={endY} r="16" fill="url(#ld-ponta)" className="ld-pulse" />
        <path d={`M${W - 26} ${endY - 5} L${W - 21} ${endY} L${W - 26} ${endY + 5} L${W - 31} ${endY} Z`} fill={tom === 'caos' ? '#c2b9ec' : '#f4efe4'} />
        <circle cx="14" cy={MID} r="3" fill="#bab09f" />
      </svg>
      <figcaption aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className={cn('dv-label absolute right-0 top-0 text-[10px]', nivel > 0 ? 'text-dv-gold-bright' : 'text-dv-text-3')}>Ordem</span>
        <span className={cn('dv-label absolute bottom-0 right-0 text-[10px]', nivel < 0 ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>Caos</span>
        <span className={cn('dv-label absolute left-0 text-[10px] text-dv-text-3', compacta ? 'top-[calc(50%+6px)]' : 'top-[calc(50%+8px)]')}>Equilíbrio</span>
      </figcaption>
      <style>{`
        .ld-draw{stroke-dasharray:600;stroke-dashoffset:600;animation:ld-draw 1.4s cubic-bezier(.16,1,.3,1) forwards}
        .ld-pulse{transform-box:fill-box;transform-origin:center;animation:ld-pulse 2.6s ease-in-out infinite}
        @keyframes ld-draw{to{stroke-dashoffset:0}}
        @keyframes ld-pulse{0%,100%{opacity:.55;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
        @media (prefers-reduced-motion: reduce){.ld-draw{animation:none;stroke-dashoffset:0}.ld-pulse{animation:none}}
      `}</style>
    </figure>
  )
}

/** Moldura de palco para a linha do destino (cena do Galo): placa de mármore com título. */
export function PlacaDestino({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div className="animate-dv-rise relative mx-auto w-full max-w-sm px-4 py-3" style={style}>
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,21,23,0.92),rgba(12,12,14,0.92))] shadow-[inset_0_0_0_1px_rgba(186,176,159,0.35),0_18px_40px_rgba(0,0,0,0.6)]" />
      <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,#ece5d8,transparent)]" />
      <p className="dv-label relative mb-2 flex items-center gap-2 text-[10px] text-dv-gold">
        <span className="size-1.5 rotate-45 bg-dv-amethyst" aria-hidden="true" />
        Linha do destino
      </p>
      <div className="relative">{children}</div>
    </div>
  )
}
