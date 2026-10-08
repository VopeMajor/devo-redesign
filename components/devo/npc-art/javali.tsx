'use client'

import { useId } from 'react'
import { JAVALI_VIEWBOX, javaliMarkup, type JavaliPose } from './javali-svg'

export type { JavaliPose }

/**
 * Javali, anfitrião da Sala de Jogos (arte original em SVG).
 * Sem `scene`, só o anfitrião debruçado na mesa (fundo transparente).
 */
export function JavaliArt({
  pose = 'table',
  scene = false,
  wink = false,
  className,
  title,
  fit = 'meet',
}: {
  pose?: JavaliPose
  scene?: boolean
  wink?: boolean
  className?: string
  title?: string
  /** `slice` cobre a área toda (como object-cover); `meet` mostra a arte inteira. */
  fit?: 'meet' | 'slice'
}) {
  const uid = useId()
  return (
    <svg
      viewBox={JAVALI_VIEWBOX}
      preserveAspectRatio={fit === 'slice' ? 'xMidYMid slice' : 'xMidYMax meet'}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG estático gerado no próprio projeto
      dangerouslySetInnerHTML={{ __html: javaliMarkup(pose, { scene, wink, uid }) }}
    />
  )
}
