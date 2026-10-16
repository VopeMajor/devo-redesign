import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Galeria } from './galeria'

// Vitrine da coleção de cosméticos (avaliação da arte). Só fora de produção ou com DEVO_STYLEGUIDE=1.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cosméticos — coleção · DEVO',
  robots: { index: false, follow: false, nocache: true },
}

export default function CosmeticosPage() {
  if (process.env.NODE_ENV === 'production' && process.env.DEVO_STYLEGUIDE !== '1') notFound()
  return <Galeria />
}
