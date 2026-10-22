'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { type GameOutcome, type MatchStart, type RoomPoll, pollRoom } from '@/lib/devo/arcade/client'

type Act = Record<string, unknown>

/**
 * Sincroniza a sala online por polling. `heartbeat` permite anexar uma ação a cada consulta
 * (ex.: a posição do jogador no Hot Bomb), assim cada tick é uma única requisição.
 */
export function useRoom(start: MatchStart, intervalMs: number, heartbeat?: () => Act | undefined) {
  const online = !!start.roomId
  const offset = useRef(start.serverNow - Date.now())
  const beat = useRef(heartbeat)
  beat.current = heartbeat
  const [error, setError] = useState<string | null>(null)
  /**
   * A consulta periódica e as ações correm em paralelo. Sem ordem, uma resposta antiga que chega
   * depois de uma nova desfazia o estado por um instante (a bomba "voltava" de mão e o efeito de
   * passe disparava de novo). Cada requisição leva um número; só vale a mais recente que voltou.
   */
  const sent = useRef(0)
  const applied = useRef(0)
  const latest = useRef<RoomPoll | undefined>(undefined)
  const request = useCallback(
    async (a?: Act) => {
      const seq = ++sent.current
      const next = await pollRoom(start.roomId!, a)
      if (seq < applied.current) return { next: latest.current ?? next, fresh: false }
      applied.current = seq
      latest.current = next
      offset.current = next.serverNow - Date.now()
      return { next, fresh: true }
    },
    [start.roomId],
  )

  const { data, mutate } = useSWR<RoomPoll>(
    online ? ['arcade-room', start.roomId] : null,
    async () => (await request(beat.current?.())).next,
    {
      refreshInterval: (d) => (d?.status === 'finished' || d?.status === 'cancelled' ? 0 : intervalMs),
      dedupingInterval: 0,
      refreshWhenHidden: true,
      refreshWhenOffline: false,
      revalidateOnFocus: false,
      keepPreviousData: true,
      onSuccess: () => setError(null),
      onError: (e: Error) => setError(e.message),
    },
  )

  const act = useCallback(
    async (a: Act) => {
      if (!online) return
      try {
        const { next, fresh } = await request(a)
        if (fresh) mutate(next, { revalidate: false })
      } catch (e) {
        setError((e as Error).message)
        mutate()
      }
    },
    [online, request, mutate],
  )

  /** Converte um horário do servidor para o relógio local. */
  const toLocal = useCallback((serverMs: number) => serverMs - offset.current, [])

  return { online, room: data ?? null, act, toLocal, error }
}

/** Libera a contagem 3-2-1 só quando faltam ~3s para o início combinado no servidor. */
export function useOnlineGate(start: MatchStart) {
  const startLocal = useRef(start.startedAt - (start.serverNow - Date.now()))
  const [open, setOpen] = useState(!start.roomId)
  useEffect(() => {
    if (open) return
    const wait = Math.max(0, startLocal.current - Date.now() - 3200)
    const id = window.setTimeout(() => setOpen(true), wait)
    return () => window.clearTimeout(id)
  }, [open])
  return open
}

/** Resultado oficial da sala no formato que a tela de resultado espera. */
export function roomOutcome(room: RoomPoll, extra: Partial<GameOutcome> = {}): GameOutcome {
  const mine = room.result?.mine
  const result = (mine?.result ?? 'draw') as GameOutcome['result']
  return {
    result,
    score: mine?.score ?? 0,
    oppScore: room.result?.oppScore ?? 0,
    bonus: 0,
    bonusLabel: room.result?.reason ? room.result.reason.toUpperCase() : '',
    stats: mine?.stats ?? {},
    ...extra,
    finish: room.finish ?? undefined,
  }
}
