'use client'

import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { CorpPayload } from '@/lib/devo/corporacoes'
import type { CardDelivery } from '@/lib/devo/progresso'
import { useDevo } from '../state/devo-store'

export const CORP_KEY = '/api/corporacoes'

export async function corpGet<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'A Companhia não respondeu.')
  return j as T
}

export async function corpPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T & { ok: true; timeDeltaMs?: number; uid?: string }> {
  const r = await fetch(CORP_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'A Companhia não respondeu. Tente de novo.')
  return j
}

const aplicados = new WeakSet<object>()

/**
 * Dados das Corporações (SWR) + efeitos no save local: Tempo devolvido pela Companhia (fundação recusada ou
 * cancelada) e cartas recebidas de outros membros (resgatadas para o inventário).
 */
export function useCorporacoes(enabled = true) {
  const { dispatch, notify } = useDevo()
  const resgatando = useRef(false)

  const resgatar = useCallback(async () => {
    if (resgatando.current) return
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
    } finally {
      resgatando.current = false
    }
  }, [dispatch, notify])

  const swr = useSWR<CorpPayload>(enabled ? CORP_KEY : null, corpGet, {
    revalidateOnFocus: false,
    refreshInterval: 45_000,
    onSuccess: (d) => {
      if (!d.liberado || aplicados.has(d)) return
      aplicados.add(d)
      if (d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
      if (d.cartasPendentes > 0) void resgatar()
    },
  })

  const agir = useCallback(
    async (body: Record<string, unknown>) => {
      const r = await corpPost(body)
      if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
      if (typeof r.uid === 'string') dispatch({ type: 'CARDS_REMOVE', uids: [r.uid] })
      await swr.mutate()
      return r
    },
    [dispatch, swr],
  )

  return { ...swr, agir }
}
