'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import type { Ilustracao } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'

/**
 * Torre pintada (pipeline de arte, WebP com fundo transparente) com o brilho de progresso por cima: janelas
 * dos andares vencidos acesas (porcelana quente), a do andar atual em ametista que respira e as demais
 * apagadas (sombra leve). Trocar a arte = trocar o arquivo e o campo `ilustracao` no conteúdo.
 */

export const srcDe = (ilu: Ilustracao, largura: number) => `${ilu.arquivo}-${largura}.webp`
export const srcSetDe = (ilu: Ilustracao) => ilu.larguras.map((w) => `${srcDe(ilu, w)} ${w}w`).join(', ')

/** Menor largura disponível que cobre `px` pixels de tela (com a densidade do aparelho). */
export function larguraPara(ilu: Ilustracao, px: number) {
  const ord = [...ilu.larguras].sort((a, b) => a - b)
  return ord.find((w) => w >= px) ?? ord[ord.length - 1]
}

function useDpr() {
  const [dpr, setDpr] = useState(1)
  useEffect(() => setDpr(Math.min(2, window.devicePixelRatio || 1)), [])
  return dpr
}

type Janela = 'acesa' | 'atual' | 'apagada'
const janelaDe = (i: number, feitos: number, total: number): Janela => (i < feitos ? 'acesa' : i === feitos && i < total ? 'atual' : 'apagada')

/**
 * Versão SVG (para o mapa, que é uma única cena vetorial): base da torre em (0,0). `pxPorUnidade` = quantos
 * pixels de tela vale uma unidade do mapa (escolhe a largura do arquivo).
 */
export function TorreIlustradaSvg({ ilu, feitos, total, destaque, pxPorUnidade = 1 }: { ilu: Ilustracao; feitos: number; total: number; destaque?: boolean; pxPorUnidade?: number }) {
  const dpr = useDpr()
  const h = ilu.altura
  const w = h * ilu.aspecto
  const href = srcDe(ilu, larguraPara(ilu, w * pxPorUnidade * dpr))
  return (
    <g>
      <ellipse cx={0} cy={0} rx={w * 0.42} ry={8} fill="#000" opacity={0.6} filter="url(#tw-blur-s)" />
      {destaque && <ellipse cx={0} cy={-h * 0.62} rx={w * 0.7} ry={h * 0.5} fill="url(#tw-halo-am)" opacity={0.35} />}
      <image href={href} x={-w / 2} y={-h} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
      {(ilu.janelas ?? []).slice(0, total).map(([fx, fy], i) => {
        const x = -w / 2 + fx * w
        const y = -h + fy * h
        const est = janelaDe(i, feitos, total)
        if (est === 'apagada') return <circle key={i} cx={x} cy={y} r={w * 0.045} fill="#0b0b10" opacity={0.55} />
        return (
          <g key={i} style={{ mixBlendMode: 'screen' }}>
            <circle cx={x} cy={y} r={w * (est === 'atual' ? 0.11 : 0.09)} fill={est === 'atual' ? 'url(#vt-halo-am)' : 'url(#vt-halo)'} className={est === 'atual' ? 'tw-pulse' : undefined} />
            <circle cx={x} cy={y} r={w * 0.025} fill={est === 'atual' ? '#e6e0ff' : '#fff3dc'} opacity={0.35} />
          </g>
        )
      })}
    </g>
  )
}

/** Versão HTML (cabeçalho da torre, palco das cenas): srcSet por largura e carregamento sob demanda. */
export function TorreIlustradaImg({
  ilu,
  feitos = 0,
  total = 0,
  sizes,
  className,
  style,
  brilho = true,
}: {
  ilu: Ilustracao
  feitos?: number
  total?: number
  /** Atributo `sizes` (largura de exibição). */
  sizes: string
  className?: string
  style?: CSSProperties
  brilho?: boolean
}) {
  return (
    <div aria-hidden="true" className={cn('relative', className)} style={{ aspectRatio: `${ilu.aspecto}`, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={srcDe(ilu, ilu.larguras[Math.min(1, ilu.larguras.length - 1)])} srcSet={srcSetDe(ilu)} sizes={sizes} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 size-full object-contain object-bottom" />
      {brilho &&
        (ilu.janelas ?? []).slice(0, total).map(([fx, fy], i) => {
          const est = janelaDe(i, feitos, total)
          return (
            <span
              key={i}
              className={cn('absolute -translate-x-1/2 -translate-y-1/2 rounded-full', est === 'atual' && 'tw-pulse')}
              style={{
                left: `${fx * 100}%`,
                top: `${fy * 100}%`,
                width: est === 'apagada' ? '9%' : '22%',
                aspectRatio: '1',
                background:
                  est === 'apagada'
                    ? 'radial-gradient(closest-side, rgba(11,11,16,0.6), transparent)'
                    : est === 'atual'
                      ? 'radial-gradient(closest-side, rgba(230,224,255,0.85), rgba(138,124,200,0.35) 45%, transparent)'
                      : 'radial-gradient(closest-side, rgba(255,243,220,0.8), rgba(236,199,154,0.3) 45%, transparent)',
                mixBlendMode: est === 'apagada' ? 'normal' : 'screen',
              }}
            />
          )
        })}
    </div>
  )
}
