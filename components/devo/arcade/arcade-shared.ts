'use client'

import { arcadePost } from '@/lib/devo/arcade/client'
import { playSfx } from '@/lib/devo/audio'
import { useDevo } from '../state/devo-store'

export const SP_TZ = 'America/Sao_Paulo'

export const BET_OPTIONS = [5, 15, 30, 60, 120, 240]

/** Reserva mínima de Tempo que o jogador precisa manter depois de apostar. */
export const BET_RESERVE_MIN = 30

export type ArcadeView = 'mesa' | 'agenda' | 'ranking' | 'apostas'

export function useApplyTime() {
  const { dispatch } = useDevo()
  return (res?: { timeDeltaMs?: number }) => {
    if (res?.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: res.timeDeltaMs })
  }
}

export function formatMinutes(min: number) {
  const sign = min < 0 ? '-' : ''
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h ? `${h}h` : ''}${m || !h ? `${String(m).padStart(h ? 2 : 1, '0')}min` : ''}`
}

export async function registerEvent(id: string, onChange: () => void) {
  try {
    await arcadePost({ action: 'register', eventId: id })
    playSfx('confirm')
    onChange()
  } catch (e) {
    playSfx('error')
    window.alert((e as Error).message)
  }
}

export function eventTimeLabel(ms: number) {
  const d = new Date(ms)
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: SP_TZ }).replace('.', '').toUpperCase()
  const hour = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: SP_TZ })
  return `${day} · ${hour}`
}
