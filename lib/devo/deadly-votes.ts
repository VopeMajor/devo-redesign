/**
 * Deadly Votes são os desafios do RPG, convocados e conduzidos por um Dealer ou Admin.
 * Não têm relação com os minigames da Sala de Jogos.
 */
export type DeadlyVoteStatus = 'convocado' | 'em-progresso' | 'concluido' | 'cancelado' | 'falha'
import type { Cargo } from './cargos'

/** Cargo do jogador (lib/devo/cargos.ts). O antigo 'admin' virou 'owner'. */
export type PlayerRole = Cargo

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
  /** Peso máximo de cartas que cada Record pode levar (soma dos pesos); null = o Dealer não limitou. */
  pesoMaximo: number | null
  /** Cartas que o próprio Record escolheu levar (só no payload dele; vazio se não está inscrito). */
  minhasCartas: CartaLevada[]
  participants: number
  joined: boolean
  outcome: 'sobreviveu' | 'eliminado' | null
  /** Resultado público do caso (contagem de registros de sobrevivência e eliminação). */
  survivors: number
  eliminated: number
  /** Dealer/Anfitrião que lançou a edição. */
  host: string | null
  /**
   * Link do grupo do WhatsApp. O servidor só o envia a quem está inscrito e só com o caso
   * "em-progresso" (na Mesa do Dealer vem sempre).
   */
  groupUrl: string | null
  /** O Dealer já informou o link (sem revelar qual). */
  hasGroup: boolean
  /** Local do caso (campo do dono). */
  location: string | null
  /** 'livre': a inscrição entra direto; 'aprovacao': o dono do Deadly Vote aceita cada inscrito. */
  admission: VoteAdmission
  /** Situação da inscrição de quem pede o Record (null = não inscrito). */
  entryStatus: EntryAdmission | null
}

export type VoteAdmission = 'livre' | 'aprovacao'
export type EntryAdmission = 'pendente' | 'aceita' | 'recusada'

/** Carta que o Record leva para o Deadly Vote (uid do inventário + id da carta). */
export type CartaLevada = { uid: string; cardId: string }
/** Decisão por participante depois de concluir (DIRECAO-3 §4), antes de aplicar aos perfis. */
export type EntryDecision = 'premio' | 'morreu' | 'ausente' | 'outro'

export const ENTRY_ADMISSION_LABEL: Record<EntryAdmission, string> = { pendente: 'Em análise', aceita: 'Aceita', recusada: 'Recusada' }

export const DECISIONS: EntryDecision[] = ['premio', 'morreu', 'ausente', 'outro']
export const DECISION_LABEL: Record<EntryDecision, { label: string; hint: string }> = {
  premio: { label: 'Recebe prêmio', hint: 'Sobreviveu · recebe as recompensas do caso' },
  morreu: { label: 'Morreu', hint: 'Eliminado · sem recompensa' },
  ausente: { label: 'Não compareceu', hint: 'Sem resultado · sem recompensa' },
  outro: { label: 'Outro', hint: 'Sobreviveu sem resultado definido · recebe a recompensa geral · explique na nota' },
}

/** Recurso de uma recompensa (mesmo formato das propostas da Fundação). */
export type PrizeResource = 'item' | 'tempo' | 'carta' | 'convite' | 'arcano'
/** Recompensa planejada do Deadly Vote. PRIVADA: só a equipe vê; nunca vai no payload do jogador. */
export type DvPrize = { id: string; recurso: PrizeResource; chave: string | null; quantidade: number; label: string | null }
export type PrizeInput = { recurso: PrizeResource; chave?: string | null; quantidade: number; label?: string | null }

export type VoteOutcome = 'sobreviveu' | 'eliminado'

/** Visão do Dealer/Admin: todos os Deadly Votes recentes com a lista de inscritos. */
export type StaffEntry = {
  playerId: string
  name: string
  outcome: VoteOutcome | null
  admission: EntryAdmission
  decision: EntryDecision | null
  note: string | null
  joinedAt: number
  /** Recompensas individuais deste participante (além da geral do caso). PRIVADAS: só a equipe vê. */
  prizes: DvPrize[]
  /** Cartas que o participante escolheu levar (o Dealer confere o peso). */
  cartas: CartaLevada[]
}
export type StaffRewardTally = { pendente: number; aprovada: number; entregue: number; rejeitada: number }
export type StaffVote = DeadlyVote & {
  entries: StaffEntry[]
  isTutorial: boolean
  /** Nome de quem convocou (a equipe vê; Owner só aparece para Owner). */
  creator: string | null
  creatorId: string | null
  prizes: DvPrize[]
  /** Quando o resultado por participante foi aplicado aos perfis (uma vez só). */
  appliedAt: number | null
  rewards: StaffRewardTally
}
export type StaffBoard = { votes: StaffVote[] }

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

/**
 * Os cinco estados do Deadly Vote (Direção 2 §4). `label` é o rótulo público; `short`, o do seletor do
 * Dealer; `danger` marca o único estado em rubi (falha). Cancelado é cinza riscado, não alerta.
 */
export const DEADLY_VOTE_STATUS: Record<DeadlyVoteStatus, { label: string; short: string; hint: string; danger: boolean }> = {
  convocado: { label: 'Não iniciado', short: 'Convocado', hint: 'Inscrições abertas', danger: false },
  'em-progresso': { label: 'Em andamento', short: 'Em andamento', hint: 'Grupo aberto aos inscritos', danger: false },
  concluido: { label: 'Encerrado', short: 'Encerrado', hint: 'Resultado registrado', danger: false },
  cancelado: { label: 'Cancelado', short: 'Cancelado', hint: 'Edição suspensa pelo Dealer', danger: false },
  falha: { label: 'Falha do sistema', short: 'Falha', hint: 'Caso perdido', danger: true },
}

/** Ordem do ciclo de vida (convocado → em andamento → encerrado) e os dois desvios. */
export const STATUS_FLOW: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido']
export const STATUS_BREAK: DeadlyVoteStatus[] = ['cancelado', 'falha']

const GROUP_RE = /^https?:\/\/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,40})\/?(?:[?#].*)?$/i

/** Normaliza o link de convite de grupo do WhatsApp (https://chat.whatsapp.com/<código>); null se inválido. */
export function normalizeGroupUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const m = GROUP_RE.exec(raw.trim())
  return m ? `https://chat.whatsapp.com/${m[1]}` : null
}

export const OUTCOME_LABEL = { sobreviveu: 'Sobreviveu', eliminado: 'Eliminado' } as const

/** Nome do caso: o título do Deadly Vote (o arco aparece como linha de apoio). */
export function voteTitle(v: DeadlyVote) {
  return v.title
}

/** Arco legível: "Fallen" → "Fallen Arc"; "Arco I" fica como está. */
export function arcLabel(arc: string | null | undefined) {
  if (!arc) return null
  return /\barcos?\b|\barc\b/i.test(arc) ? arc : `${arc} Arc`
}

export function toEntry(v: DeadlyVote): DeadlyVoteEntry {
  const parts = [arcLabel(v.arc), v.outcome ? OUTCOME_LABEL[v.outcome] : null]
  if (!v.joined && v.status === 'convocado') parts.push(DEADLY_VOTE_STATUS.convocado.hint)
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
