'use client'

import { useCallback, useEffect, type ReactNode } from 'react'
import { useSWRConfig } from 'swr'
import type { EuPayload, UnlockFlag } from '@/lib/devo/progresso'
import { useEu } from '../state/use-acesso'

/**
 * Acesso do jogador para a Narrativa, apoiado no hook ÚNICO de acesso (`components/devo/state/use-acesso.ts`,
 * SWR em `/api/eu`). A interface só reflete: quem decide é `unlocks()` da Fundação. O provider só acrescenta
 * a revalidação: a cada minuto e quando alguém dispara `window.dispatchEvent(new Event('devo:acesso'))`
 * (ex.: uma cena que liberou uma flag).
 */
export function AcessoProvider({ children }: { children: ReactNode }) {
  const { mutate } = useSWRConfig()
  useEffect(() => {
    const atualizar = () => void mutate('/api/eu')
    const onVis = () => document.visibilityState === 'visible' && atualizar()
    window.addEventListener('devo:acesso', atualizar)
    document.addEventListener('visibilitychange', onVis)
    const t = window.setInterval(() => document.visibilityState === 'visible' && atualizar(), 60_000)
    return () => {
      window.removeEventListener('devo:acesso', atualizar)
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(t)
    }
  }, [mutate])
  return <>{children}</>
}

/** `{ eu, recarregar, liberado(flag) }` — sem sessão ou carregando: tudo trancado. */
export function useAcesso(): {
  eu: EuPayload | null
  recarregar: () => Promise<void>
  liberado: (flag: UnlockFlag) => boolean
  /** Sala de Jogos visível: revelada no save OU cargo com tudo liberado (Owner/Anfitrião). */
  salaJogos: boolean
} {
  const { data, mutate } = useEu()
  const recarregar = useCallback(async () => {
    await mutate()
  }, [mutate])
  return { eu: data ?? null, recarregar, liberado: (f) => !!data?.acesso.sistemas[f], salaJogos: !!data?.acesso.salaJogos }
}
