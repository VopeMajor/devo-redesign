'use client'

import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { CardDelivery } from '@/lib/devo/progresso'
import type { SalaoPayload } from '@/lib/devo/salao'
import { useDevo } from '../state/devo-store'

export const SALAO_KEY = '/api/salao'

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'O Salão não respondeu.')
  return j as T
}

export async function salaoPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T & { ok: true; timeDeltaMs?: number; uid?: string }> {
  const r = await fetch(SALAO_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'O Salão não respondeu. Tente de novo.')
  return j
}

/** Cada payload aplica o Tempo creditado uma vez só (o SWR pode entregar o mesmo objeto a vários componentes). */
const aplicados = new WeakSet<object>()

/**
 * Dados do Salão (SWR) + efeitos no save local: soma ao pulso o Tempo que o servidor creditou (vendas, lances
 * devolvidos) e resgata as cartas entregues (arremates, compras, devoluções) para o inventário.
 */
export function useSalao(enabled = true) {
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
          title: cartas.length === 1 ? 'Uma carta chegou do Salão' : `${cartas.length} cartas chegaram do Salão`,
          body: cartas.map((c) => c.origin).slice(0, 3).join(' · '),
        })
      }
    } finally {
      resgatando.current = false
    }
  }, [dispatch, notify])

  const swr = useSWR<SalaoPayload>(enabled ? SALAO_KEY : null, getJson, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
    onSuccess: (d) => {
      if (!d.liberado || aplicados.has(d)) return
      aplicados.add(d)
      if (d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
      if (d.cartasPendentes > 0) void resgatar()
    },
  })

  /** Ação no servidor + efeitos locais (Tempo pago, carta que saiu do inventário) + recarrega. */
  const agir = useCallback(
    async (body: Record<string, unknown>) => {
      const r = await salaoPost(body)
      if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
      if (typeof r.uid === 'string') dispatch({ type: 'CARDS_REMOVE', uids: [r.uid] })
      await swr.mutate()
      return r
    },
    [dispatch, swr],
  )

  return { ...swr, agir }
}
