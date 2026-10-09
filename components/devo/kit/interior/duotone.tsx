'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Mapas de gradiente (sombra → meio → luz), em 0..1 por canal. */
const MAPS = {
  // veludo → grafite com sopro de ametista → porcelana (padrão do Record: tinta quase p/b)
  cobalt: { r: [0.047, 0.32, 0.945], g: [0.047, 0.31, 0.94], b: [0.055, 0.37, 0.93] },
  // veludo → ametista → porcelana (retrato, arte de destaque: o toque frio)
  violet: { r: [0.047, 0.36, 0.945], g: [0.047, 0.32, 0.94], b: [0.055, 0.52, 0.93] },
  // preto e branco puro, cinza de mármore no meio (gravura)
  mono: { r: [0.039, 0.35, 0.949], g: [0.035, 0.35, 0.941], b: [0.051, 0.37, 0.925] },
  // veludo → rubi → porcelana (só em contexto de perigo)
  blood: { r: [0.039, 0.639, 0.949], g: [0.035, 0.071, 0.941], b: [0.051, 0.122, 0.925] },
  // tinta: preto → grafite → papel (neutro, para cartas bloqueadas)
  ink: { r: [0.039, 0.32, 0.91], g: [0.035, 0.31, 0.9], b: [0.051, 0.36, 0.89] },
} as const

export type DuotoneTone = keyof typeof MAPS

/**
 * Arte em duotom (estilo tinta/mangá do Record): converte qualquer imagem ou SVG para o mapa
 * preto → índigo (ou lavanda, `violet`; ou cinza, `mono`) → porcelana com um filtro SVG (feColorMatrix + feComponentTransfer). Use em cartas,
 * retratos e banners DENTRO do interior. `halftone` adiciona retícula de impressão por cima.
 */
export function DuotoneArt({
  src,
  alt,
  children,
  tone = 'cobalt',
  contrast = 1.25,
  halftone = true,
  position = '50% 30%',
  fit = 'cover',
  className,
}: {
  src?: string
  /** Descrição (obrigatória quando a arte informa algo; "" para decorativa). */
  alt: string
  children?: ReactNode
  tone?: DuotoneTone
  /** Contraste antes do mapa (1 = original). */
  contrast?: number
  halftone?: boolean
  position?: string
  fit?: 'cover' | 'contain'
  className?: string
}) {
  const id = `dv-duo-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const m = MAPS[tone]
  const k = contrast
  const off = (1 - k) / 2
  return (
    <div role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={cn('relative isolate overflow-hidden bg-in-panel', className)}>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id={id} colorInterpolationFilters="sRGB">
          {/* luminância → contraste */}
          <feColorMatrix type="matrix" values={`0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0`} />
          <feComponentTransfer>
            <feFuncR type="linear" slope={k} intercept={off} />
            <feFuncG type="linear" slope={k} intercept={off} />
            <feFuncB type="linear" slope={k} intercept={off} />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="table" tableValues={m.r.join(' ')} />
            <feFuncG type="table" tableValues={m.g.join(' ')} />
            <feFuncB type="table" tableValues={m.b.join(' ')} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div aria-hidden="true" className="absolute inset-0" style={{ filter: `url(#${id})` }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain')} style={{ objectPosition: position }} />
        ) : (
          <div className="size-full [&>svg]:size-full">{children}</div>
        )}
      </div>
      {halftone && <span aria-hidden="true" className="dv-halftone pointer-events-none absolute inset-0 text-black opacity-[0.18] mix-blend-multiply" />}
      <span aria-hidden="true" className="devo-grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" />
    </div>
  )
}
