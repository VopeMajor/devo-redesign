'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { type RecordPayload, sortVotes, toEntry } from '@/lib/devo/deadly-votes'

export const RECORD_KEY = '/api/record'

async function fetcher(url: string): Promise<RecordPayload> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha no Record.')
  return data as RecordPayload
}

export async function recordAction(body: Record<string, unknown>) {
  const res = await fetch(RECORD_KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Não foi possível concluir a ação.')
  return data
}

/** Record do participante: papel, versão da foto e Deadly Votes (desafios do RPG) convocados pelo Dealer. */
export function useDeadlyVotes() {
  const { data, error, isLoading, mutate } = useSWR<RecordPayload>(RECORD_KEY, fetcher, { refreshInterval: 30_000 })
  const entries = useMemo(() => sortVotes(data?.votes ?? []).map(toEntry), [data])
  return {
    entries,
    record: data,
    error: error as Error | undefined,
    isLoading,
    refresh: () => mutate(),
    join: async (voteId: string) => {
      await recordAction({ action: 'join', voteId })
      await mutate()
    },
    leave: async (voteId: string) => {
      await recordAction({ action: 'leave', voteId })
      await mutate()
    },
  }
}
