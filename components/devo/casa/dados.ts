'use client'

import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { CasaPayload } from '@/lib/devo/confeccao'
import type { CardDelivery } from '@/lib/devo/progresso'
import { useDevo } from '../state/devo-store'

export const CASA_KEY = '/api/casa'

async function casaGet(url: string): Promise<CasaPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A casa não respondeu.')
  return j as CasaPayload
}

export async function casaPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T & { ok: true; timeDeltaMs?: number; uids?: string[] }> {
  const r = await fetch(CASA_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'A casa não respondeu. Tente de novo.')
  return j
}

const aplicados = new WeakSet<object>()

/**
 * Dados da Casa (SWR) + efeitos no save local: Tempo cobrado/creditado, cartas sacrificadas (saem do inventário) e
 * cartas que chegaram (fabricação, devolução de experimento, pacote), resgatadas para o inventário.
 * Enquanto há fabricação em andamento, relê quando a primeira fica pronta (sem polling curto).
 */
export function useCasa(enabled = true) {
  const { dispatch, notify } = useDevo()
  const resgatando = useRef(false)

  const resgatar = useCallback(async () => {
    if (resgatando.current) return []
    resgatando.current = true
    try {
      const r = await fetch('/api/eu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cartas.resgatar' }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; cartas?: CardDelivery[] } | null
      const cartas = j?.ok ? (j.cartas ?? []) : []
      if (cartas.length) {
        dispatch({ type: 'CARDS_ADD', cards: cartas.map((c) => ({ uid: `dlv-${c.id}`, cardId: c.cardId, origin: c.origin, acquiredAt: c.createdAt })) })
        notify({
          appId: 'cartas',
          title: cartas.length === 1 ? 'Uma carta chegou para você' : `${cartas.length} cartas chegaram para você`,
          body: cartas.map((c) => c.origin).slice(0, 3).join(' · '),
        })
      }
      return cartas
    } finally {
      resgatando.current = false
    }
  }, [dispatch, notify])

  const swr = useSWR<CasaPayload>(enabled ? CASA_KEY : null, casaGet, {
    revalidateOnFocus: false,
    refreshInterval: (d) => {
      if (!d?.liberado || !d.andamento.length) return 0
      const prox = Math.min(...d.andamento.map((t) => t.prontaEm)) - d.agora
      return Math.min(5 * 60_000, Math.max(3_000, prox + 1_500))
    },
    onSuccess: (d) => {
      if (!d.liberado || aplicados.has(d)) return
      aplicados.add(d)
      if (d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
      if (d.cartasPendentes > 0) void resgatar()
    },
  })

  const agir = useCallback(
    async <T,>(body: Record<string, unknown>) => {
      const r = await casaPost<T>(body)
      if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
      if (r.uids?.length) dispatch({ type: 'CARDS_REMOVE', uids: r.uids })
      await swr.mutate()
      return r
    },
    [dispatch, swr],
  )

  return { ...swr, agir, resgatar }
}
