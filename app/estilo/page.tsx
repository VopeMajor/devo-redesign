import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StyleGuide } from './styleguide'

// Lido em tempo de requisição: a vitrine só existe fora de produção ou com DEVO_STYLEGUIDE=1.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Estilo — Tribunal do Relógio · DEVO',
  robots: { index: false, follow: false, nocache: true },
}

export default function EstiloPage() {
  if (process.env.NODE_ENV === 'production' && process.env.DEVO_STYLEGUIDE !== '1') notFound()
  return <StyleGuide />
}
