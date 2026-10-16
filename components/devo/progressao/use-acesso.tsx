'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { EuPayload, UnlockFlag } from '@/lib/devo/progresso'

/**
 * Acesso do jogador vindo do servidor (`GET /api/eu` → `EuPayload.acesso`). A interface SÓ reflete: quem decide
 * é `unlocks()` da Fundação. Recarrega ao montar, ao voltar para a aba, a cada minuto e quando alguém dispara
 * `window.dispatchEvent(new Event('devo:acesso'))` (ex.: uma cena que liberou uma flag).
 */
type Ctx = { eu: EuPayload | null; recarregar: () => Promise<void>; liberado: (flag: UnlockFlag) => boolean }

const AcessoContext = createContext<Ctx | null>(null)

export function AcessoProvider({ children }: { children: ReactNode }) {
  const [eu, setEu] = useState<EuPayload | null>(null)
  const recarregar = useCallback(async () => {
    try {
      const r = await fetch('/api/eu', { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as EuPayload
      if (j && j.acesso) setEu(j)
    } catch {
      /* sem rede: mantém o último */
    }
  }, [])
  useEffect(() => {
    void recarregar()
    const onVis = () => document.visibilityState === 'visible' && void recarregar()
    const onEvt = () => void recarregar()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('devo:acesso', onEvt)
    const t = window.setInterval(() => document.visibilityState === 'visible' && void recarregar(), 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('devo:acesso', onEvt)
      window.clearInterval(t)
    }
  }, [recarregar])
  const value = useMemo<Ctx>(() => ({ eu, recarregar, liberado: (f) => !!eu?.acesso.sistemas[f] }), [eu, recarregar])
  return <AcessoContext.Provider value={value}>{children}</AcessoContext.Provider>
}

const FORA: Ctx = { eu: null, recarregar: async () => {}, liberado: () => false }

/** Acesso efetivo (fora do provider: tudo trancado, sem erro). */
export function useAcesso() {
  return useContext(AcessoContext) ?? FORA
}
