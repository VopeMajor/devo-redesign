import type { GameId } from './games'
import type { BombState, ChessState, MemoryState, RoomPoll } from './rooms'
import type { Dashboard, MatchFinish, MatchStart, getBetBoard, getEvent } from './server'

export type { BombState, ChessState, Dashboard, MatchFinish, MatchStart, MemoryState, RoomPoll }
export type BetBoard = Awaited<ReturnType<typeof getBetBoard>>
export type EventDetail = Awaited<ReturnType<typeof getEvent>>
export type ChatLine = { id: string; author: string; body: string; at: number; bot: boolean; pid?: string; role?: string }
export type { MiniProfile, BorderTier } from './server'

export type GameOutcome = {
  result: 'win' | 'loss' | 'draw'
  score: number
  oppScore: number
  bonus: number
  bonusLabel: string
  stats: Record<string, number>
  /** Partidas online já chegam fechadas pelo servidor. */
  finish?: MatchFinish
}

export type GameProps = {
  start: MatchStart
  settings: Record<string, string>
  onFinish: (o: GameOutcome) => void
  onQuit: () => void
}

export const arcadeKey = (view: string, extra = '') => `/api/arcade?view=${view}${extra}`

export async function arcadeFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha na Sala de Jogos.')
  return data as T
}

export async function arcadePost<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/arcade', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Falha na Sala de Jogos.')
  return data as T
}

export const startTutorial = (gameId: GameId) => arcadePost<MatchStart>({ action: 'tutorial', gameId })
export const queueCasual = (gameId: GameId) => arcadePost<RoomPoll>({ action: 'queue', gameId })
export const joinDuel = (eventId: string) => arcadePost<RoomPoll>({ action: 'duel', eventId })
export const pollRoom = (roomId: string, act?: Record<string, unknown>) => arcadePost<RoomPoll>({ action: 'room', roomId, act })
export const leaveRoom = (roomId: string) => arcadePost<RoomPoll>({ action: 'leave', roomId })

/** Converte a sala ativa no formato que os jogos já recebem. */
export function roomToStart(r: RoomPoll): MatchStart {
  return {
    matchId: r.id,
    gameId: r.gameId,
    mode: r.mode,
    seed: r.seed,
    opponent: r.opponent ?? { name: '—', rating: 1000 },
    startedAt: r.startedAt ?? r.serverNow,
    serverNow: r.serverNow,
    roomId: r.id,
    side: r.side,
  }
}

export function formatPoints(n: number) {
  return n.toLocaleString('pt-BR')
}

export function formatCountdown(ms: number) {
  if (ms <= 0) return 'agora'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m ${String(s % 60).padStart(2, '0')}s`
}
