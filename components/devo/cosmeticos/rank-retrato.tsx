'use client'

import type { ReactNode } from 'react'
import type { Visual } from '@/lib/devo/cosmeticos'
import { FotoMoldurada } from './cosmetic-art'
import { useCatalogo } from './use-cosmeticos'

/**
 * Retrato de ranking/lista: se o jogador tem foto ou moldura de miniperfil equipada, mostra o miniperfil
 * moldurado (parado: lista); senão, mantém o medalhão original da tela (`fallback`).
 */
export function RankRetrato({ pid, visual, largura, fallback }: { pid?: string; visual: Visual | null; largura: number; fallback: ReactNode }) {
  const { mapa } = useCatalogo()
  const mini = visual?.mini ? (mapa.get(visual.mini) ?? null) : null
  if (!pid || !visual || (!mini && !visual.foto)) return <>{fallback}</>
  const src = visual.foto ? `/api/arcade?view=avatar&pid=${pid}&v=${visual.foto}` : null
  // A janela da foto ocupa 2/3 da caixa: a caixa cresce 1,5× para a foto ficar do tamanho do medalhão.
  return <FotoMoldurada formato="mini" src={src} moldura={mini} largura={Math.round(largura * 1.5)} animar={false} className="-my-[10%]" />
}
