import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PerfilPage } from './perfil-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Perfil (modelo do interior) · DEVO',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() {
  if (process.env.NODE_ENV === 'production' && process.env.DEVO_STYLEGUIDE !== '1') notFound()
  return <PerfilPage />
}
