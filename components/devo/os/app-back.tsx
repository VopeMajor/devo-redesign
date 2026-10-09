'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

/**
 * Voltar do cabeçalho do shell (celular). Um app com subtela (ex.: conversa em Mensagens) registra
 * aqui o próprio "voltar": o botão do cabeçalho passa a voltar para a lista em vez de ir ao início,
 * e o app não precisa desenhar uma segunda seta. Fora do celular não há provedor (retorna false).
 */
export type AppBack = { run: () => void; label: string } | null
type Ctx = { set: (b: AppBack) => void }

export const AppBackContext = createContext<Ctx | null>(null)

/** Registra o voltar do app enquanto `active`. Retorna true quando o shell assumiu a seta. */
export function useShellBack(active: boolean, run: () => void, label: string) {
  const ctx = useContext(AppBackContext)
  const ref = useRef(run)
  ref.current = run
  useEffect(() => {
    if (!ctx || !active) return
    ctx.set({ run: () => ref.current(), label })
    return () => ctx.set(null)
  }, [ctx, active, label])
  return !!ctx
}
