'use client'

import useSWR from 'swr'
import type { Acesso, EuPayload } from '@/lib/devo/progresso'

async function getEu(url: string): Promise<EuPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

/**
 * Acesso efetivo do jogador (`EuPayload.acesso`, decidido no servidor por `unlocks()`; FUNDACAO.md §3). A
 * interface só reflete: `null` enquanto carrega ou sem sessão — trate como trancado. Uma requisição por tela
 * (SWR com cache), compartilhada por todos os componentes que chamarem.
 */
export function useAcesso(): Acesso | null {
  return useEu().data?.acesso ?? null
}

/** O payload completo de /api/eu (inventário, acesso, destino…), com o mesmo cache de `useAcesso`. */
export function useEu() {
  return useSWR<EuPayload>('/api/eu', getEu, { revalidateOnFocus: false, dedupingInterval: 20_000, shouldRetryOnError: false })
}
