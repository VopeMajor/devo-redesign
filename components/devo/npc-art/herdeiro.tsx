'use client'

import { useId } from 'react'
import { HERDEIRO_FACE_VIEWBOX, HERDEIRO_VIEWBOX, herdeiroMarkup, type HerdeiroExpression } from './herdeiro-svg'

export type { HerdeiroExpression }

/** Retrato do Herdeiro (arte original em SVG). `crop="face"` recorta o rosto para avatares. */
export function HerdeiroArt({
  expression = 'neutral',
  crop,
  className,
  title,
}: {
  expression?: HerdeiroExpression
  crop?: 'face'
  className?: string
  title?: string
}) {
  const uid = useId()
  return (
    <svg
      viewBox={crop === 'face' ? HERDEIRO_FACE_VIEWBOX : HERDEIRO_VIEWBOX}
      preserveAspectRatio={crop === 'face' ? 'xMidYMid slice' : 'xMidYMax meet'}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG estático gerado no próprio projeto
      dangerouslySetInnerHTML={{ __html: herdeiroMarkup(expression, uid) }}
    />
  )
}
