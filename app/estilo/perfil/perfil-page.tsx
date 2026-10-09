'use client'

import { PaperSheet } from '@/components/devo/kit'
import { PerfilModelo } from '../interior-models'

/** Tela-modelo do Perfil no interior: PaperSheet + painéis do kit + BottomNav. */
export function PerfilPage() {
  return (
    <PaperSheet as="main" code={false} className="min-h-dvh">
      <PerfilModelo />
    </PaperSheet>
  )
}
