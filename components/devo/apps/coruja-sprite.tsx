'use client'

import { portraitFrameProps } from '@/lib/devo/npcs'
import { cn } from '@/lib/utils'

/** Expressões da Coruja usadas na aula (vocabulário do elenco em lib/devo/npcs.ts). */
export const CORUJA_EXPRESSIONS = ['neutro', 'sorriso', 'riso', 'malicia', 'piscadela', 'preocupado', 'surpreso', 'desdem'] as const
export type CorujaExpression = (typeof CORUJA_EXPRESSIONS)[number]

/**
 * Sprite OC da Coruja: todas as expressões da aula ficam montadas e trocam por opacidade.
 * Mesmo enquadramento do PortraitFrame (object-cover no topo), já que os sprites do elenco são normalizados.
 */
export function CorujaSprite({ expression, className }: { expression: CorujaExpression; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {CORUJA_EXPRESSIONS.map((name) => {
        const art = portraitFrameProps('coruja', name)
        if (!art) return null
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={art.src}
            alt=""
            draggable={false}
            decoding="async"
            className={cn('absolute inset-0 size-full object-cover transition-opacity duration-300', name === expression ? 'opacity-100' : 'opacity-0')}
            style={{ objectPosition: art.position }}
          />
        )
      })}
    </div>
  )
}
