'use client'

import { useId } from 'react'
import { MELISSA_VIEWBOX, melissaMarkup, type MelissaMood } from './melissa-svg'

export type { MelissaMood }

/** Retrato da Melissa (arte original em SVG). Alinhado embaixo, como um recorte de personagem. */
export function MelissaArt({ mood = 'neutral', className, title }: { mood?: MelissaMood; className?: string; title?: string }) {
  const uid = useId()
  return (
    <svg
      viewBox={MELISSA_VIEWBOX}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG estático gerado no próprio projeto
      dangerouslySetInnerHTML={{ __html: melissaMarkup(mood, uid) }}
    />
  )
}
