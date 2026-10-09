import { sanitizeProfile, type PlayerProfile } from './appearances'
import type { ChatMessage, NotificationItem, OwnedCard } from './types'

export type SavedThread = {
  id: string
  messages: ChatMessage[]
  unread: number
  answered: string[]
}

export type SaveData = {
  v: 1
  welcomed: boolean
  timerEndsAt: number
  inventory: OwnedCard[]
  notifications: NotificationItem[]
  threads: SavedThread[]
  tradesCompleted: number
  arcadeUnlocked?: boolean
  seenApps?: string[]
  owlMet?: boolean
  javaliMet?: boolean
  /** Nome do personagem (como os NPCs chamam o jogador). Espelho do players.character_name. */
  characterName?: string
  /** Perfil do prólogo: idade, gênero, segunda aparência e trocas restantes. */
  profile?: PlayerProfile
}

export const MAX_SAVE_BYTES = 60_000

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max = 600) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function messages(v: unknown): ChatMessage[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(isObj)
    .slice(-200)
    .map((m) => ({ id: str(m.id, 80), from: str(m.from, 40), text: str(m.text), at: num(m.at) }))
}

/** Normaliza qualquer JSON recebido para o formato de save, descartando campos estranhos. */
export function sanitizeSave(raw: unknown): SaveData | null {
  if (!isObj(raw) || raw.v !== 1) return null
  const inventory = Array.isArray(raw.inventory)
    ? raw.inventory
        .filter(isObj)
        .slice(0, 300)
        .map((c) => ({ uid: str(c.uid, 80), cardId: str(c.cardId, 80), origin: str(c.origin, 120), acquiredAt: num(c.acquiredAt) }))
    : []
  const notifications = Array.isArray(raw.notifications)
    ? raw.notifications
        .filter(isObj)
        .slice(0, 30)
        .map((n) => ({
          id: str(n.id, 80),
          appId: str(n.appId, 20) as NotificationItem['appId'],
          title: str(n.title, 120),
          body: str(n.body),
          createdAt: num(n.createdAt),
          tone: n.tone === 'danger' ? ('danger' as const) : ('default' as const),
        }))
    : []
  const threads = Array.isArray(raw.threads)
    ? raw.threads
        .filter(isObj)
        .slice(0, 20)
        .map((t) => ({
          id: str(t.id, 60),
          messages: messages(t.messages),
          unread: Math.max(0, Math.min(999, Math.floor(num(t.unread)))),
          answered: Array.isArray(t.answered) ? t.answered.filter((a): a is string => typeof a === 'string').slice(0, 50) : [],
        }))
    : []
  return {
    v: 1,
    welcomed: raw.welcomed === true,
    timerEndsAt: num(raw.timerEndsAt),
    inventory,
    notifications,
    threads,
    tradesCompleted: Math.max(0, Math.floor(num(raw.tradesCompleted))),
    arcadeUnlocked: raw.arcadeUnlocked === true,
    owlMet: raw.owlMet === true,
    javaliMet: raw.javaliMet === true,
    characterName: str(raw.characterName, 40).trim() || undefined,
    profile: raw.profile === undefined ? undefined : sanitizeProfile(raw.profile),
    seenApps: Array.isArray(raw.seenApps) ? raw.seenApps.filter((x): x is string => typeof x === 'string').slice(0, 12).map((x) => x.slice(0, 20)) : [],
  }
}
