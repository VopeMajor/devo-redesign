'use client'

import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { CalendarioPayload, ResgateResultado } from '@/lib/devo/calendario'
import type { CardDelivery } from '@/lib/devo/progresso'
import { useDevo } from '../state/devo-store'

export const CAL_KEY = '/api/calendario'

export async function calGet<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'O Calendário não respondeu.')
  return j as T
}

export class CalErro extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function calPost<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch(CAL_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new CalErro(j?.error ?? 'O Calendário não respondeu. Tente de novo.', r.status)
  return j as T
}

const aplicados = new WeakSet<object>()

/**
 * Dados do Calendário (SWR) + efeitos no save local: Tempo do check-in ("+2 Horas", creditado no servidor e
 * aplicado ao relógio aqui) e a Carta Incomum (entregue pelo servidor, resgatada para o inventário).
 */
export function useCalendario() {
  const { dispatch, notify } = useDevo()
  const resgatando = useRef(false)

  const resgatarCartas = useCallback(async () => {
    if (resgatando.current) return
    resgatando.current = true
    try {
      const r = await fetch('/api/eu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cartas.resgatar' }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; cartas?: CardDelivery[] } | null
      const cartas = j?.ok ? (j.cartas ?? []) : []
      if (cartas.length) {
        dispatch({ type: 'CARDS_ADD', cards: cartas.map((c) => ({ uid: `dlv-${c.id}`, cardId: c.cardId, origin: c.origin, acquiredAt: c.createdAt })) })
        notify({ appId: 'cartas', title: cartas.length === 1 ? 'Uma carta chegou para você' : `${cartas.length} cartas chegaram para você`, body: cartas.map((c) => c.origin).slice(0, 3).join(' · ') })
      }
    } finally {
      resgatando.current = false
    }
  }, [dispatch, notify])

  const swr = useSWR<CalendarioPayload>(CAL_KEY, calGet, {
    revalidateOnFocus: true,
    onSuccess: (d) => {
      if (!d.liberado || aplicados.has(d)) return
      aplicados.add(d)
      if (d.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: d.timeDeltaMs })
      if (d.cartasPendentes > 0) void resgatarCartas()
    },
  })

  /** Marca presença (diário ou de evento). Devolve o resultado para a revelação. */
  const checkin = useCallback(
    async (alvo: { tipo: 'diario' } | { tipo: 'evento'; eventoId: string }) => {
      try {
        const r = await calPost<ResgateResultado>({ action: 'checkin', ...alvo })
        if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
        if (r.recompensa.icone === 'carta') void resgatarCartas()
        return r
      } finally {
        await swr.mutate()
      }
    },
    [dispatch, resgatarCartas, swr],
  )

  return { ...swr, checkin }
}
