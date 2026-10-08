/**
 * Deadly Votes são os desafios do RPG, convocados e conduzidos por um Dealer ou Admin.
 * Não têm relação com os minigames da Sala de Jogos.
 */
export type DeadlyVoteStatus = 'convocado' | 'em-progresso' | 'concluido' | 'cancelado' | 'falha'
export type PlayerRole = 'player' | 'dealer' | 'admin'

export type DeadlyVote = {
  id: string
  number: number
  title: string
  arc: string | null
  briefing: string | null
  status: DeadlyVoteStatus
  startsAt: number
  endsAt: number | null
  maxParticipants: number | null
  participants: number
  joined: boolean
  outcome: 'sobreviveu' | 'eliminado' | null
}

export type RecordPayload = { role: PlayerRole; avatarVersion: number | null; votes: DeadlyVote[] }

/** Linha da linha do tempo (Record / Deadly Votes). */
export type DeadlyVoteEntry = {
  id: string
  at: number
  title: string
  detail?: string
  status: DeadlyVoteStatus
  vote: DeadlyVote
}

export const DEADLY_VOTE_STATUS: Record<DeadlyVoteStatus, { label: string; danger: boolean }> = {
  convocado: { label: 'Convocação aberta', danger: false },
  'em-progresso': { label: 'Em progresso', danger: true },
  concluido: { label: 'Concluído', danger: false },
  cancelado: { label: 'Cancelado', danger: false },
  falha: { label: 'Falha do sistema', danger: true },
}

export const OUTCOME_LABEL = { sobreviveu: 'Sobreviveu', eliminado: 'Eliminado' } as const

export function voteTitle(v: DeadlyVote) {
  return v.arc ? `${v.arc} Arc` : v.title
}

export function toEntry(v: DeadlyVote): DeadlyVoteEntry {
  const parts = [v.arc ? v.title : null, v.outcome ? OUTCOME_LABEL[v.outcome] : null]
  if (!v.joined && v.status === 'convocado') parts.push('Inscrições abertas')
  if (v.maxParticipants) parts.push(`${v.participants}/${v.maxParticipants} participantes`)
  return { id: v.id, at: v.startsAt, title: voteTitle(v), detail: parts.filter(Boolean).join(' · ') || undefined, status: v.status, vote: v }
}

const ORDER: Record<DeadlyVoteStatus, number> = { 'em-progresso': 0, convocado: 1, concluido: 2, falha: 2, cancelado: 3 }

export function sortVotes(votes: DeadlyVote[]) {
  return [...votes].sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.status === 'convocado' ? a.startsAt - b.startsAt : b.startsAt - a.startsAt))
}

export function formatVoteDate(ts: number) {
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** ID de registro determinístico derivado do nome do participante (ex.: DV-X719-A). */
export function recordIdFor(seed: string | null) {
  const s = (seed ?? 'anonimo').toLowerCase()
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = h >>> 0
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const block = `${letters[n % 24]}${String((n >>> 5) % 1000).padStart(3, '0')}`
  return `DV-${block}-${letters[(n >>> 15) % 24]}`
}

/** Tempo de vida no formato DD:HH:MM:SS. */
export function lifeClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [d, h, m, s].map((n) => String(n).padStart(2, '0'))
}
