'use client'

import { showSystemNotification } from '@/lib/devo/pwa'

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { makeOwned, starterInventory } from '@/lib/devo/cards'
import { PULSE_START_HOURS } from '@/lib/devo/pulse'
import { ROOM_LAYOUT, ROOM_RULES } from '@/lib/devo/trade-rooms'
import type { SaveData } from '@/lib/devo/save'
import type {
  AppId,
  ChatMessage,
  NotificationItem,
  OwnedCard,
  Phase,
  Room,
  Thread,
  TradePartner,
  TradeSession,
} from '@/lib/devo/types'

const START_HOURS = PULSE_START_HOURS

export type DevoState = {
  phase: Phase
  playerName: string | null
  hasSession: boolean
  welcomed: boolean
  timerEndsAt: number
  inventory: OwnedCard[]
  notifications: NotificationItem[]
  toasts: NotificationItem[]
  unread: Partial<Record<AppId, number>>
  threads: Thread[]
  rooms: Room[]
  trade: TradeSession | null
  tradesCompleted: number
  arcadeUnlocked: boolean
  /** Apps iniciais já visitados — ao ver todos, a Sala de Jogos é revelada. */
  seenApps: AppId[]
  arcadeReveal: boolean
  /** A Coruja já se apresentou no app de Cartas. */
  owlMet: boolean
  /** O Javali já apresentou a Sala de Jogos. */
  javaliMet: boolean
}

type Action =
  | { type: 'OWL_MET' }
  | { type: 'JAVALI_MET' }
  | { type: 'SEE_APP'; appId: AppId }
  | { type: 'UNLOCK_ARCADE' }
  | { type: 'ADD_TIME'; ms: number }
  | { type: 'ARCADE_REVEAL_DONE' }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'START_SESSION' }
  | { type: 'SET_PLAYER'; name: string }
  | { type: 'MARK_WELCOMED' }
  | { type: 'NOTIFY'; item: NotificationItem }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'READ_APP'; appId: AppId }
  | { type: 'THREAD_MESSAGE'; threadId: string; message: ChatMessage; countUnread: boolean }
  | { type: 'THREAD_TYPING'; threadId: string; typing: boolean }
  | { type: 'THREAD_READ'; threadId: string }
  | { type: 'THREAD_ANSWER'; threadId: string; choiceId: string }
  | { type: 'ROOMS_SHUFFLE' }
  | { type: 'TRADE_ENTER'; roomId: string }
  | { type: 'TRADE_PLACE'; uid: string }
  | { type: 'TRADE_PARTNER_JOIN'; partner: TradePartner; partnerCardId: string }
  | { type: 'TRADE_CHAT'; message: ChatMessage }
  | { type: 'TRADE_PARTNER_TYPING'; typing: boolean }
  | { type: 'TRADE_ACCEPT' }
  | { type: 'TRADE_PARTNER_ACCEPT' }
  | { type: 'TRADE_REVEAL' }
  | { type: 'TRADE_COMPLETE' }
  | { type: 'TRADE_PARTNER_LEAVE' }
  | { type: 'TRADE_CANCEL'; forfeit?: boolean }
  | { type: 'TRADE_EXIT' }
  | { type: 'RESTART_SESSION'; at: number; inventory: OwnedCard[] }

function initialRooms(): Room[] {
  return ROOM_LAYOUT.map((rule, i) => ({
    id: `sala-${i + 1}`,
    number: i + 1,
    rule,
    condition: ROOM_RULES[rule].label,
    status: [1, 4, 6].includes(i) ? 'ocupada' : 'livre',
  }))
}

function initialThreads(): Thread[] {
  return [
    { id: 't-rato', npcId: 'rato', messages: [], unread: 0, typing: false, answered: [] },
    { id: 't-herdeiro', npcId: 'herdeiro', messages: [], unread: 0, typing: false, answered: [] },
    { id: 't-desconhecido', npcId: 'desconhecido', messages: [], unread: 0, typing: false, answered: [] },
    { id: 't-coruja', npcId: 'coruja', messages: [], unread: 0, typing: false, answered: [] },
  ]
}

function freshState(phase: Phase = 'landing', playerName: string | null = null): DevoState {
  return {
    phase,
    playerName,
    hasSession: false,
    welcomed: false,
    timerEndsAt: Date.now() + START_HOURS * 3600 * 1000,
    inventory: starterInventory(),
    notifications: [],
    toasts: [],
    unread: {},
    threads: initialThreads(),
    rooms: initialRooms(),
    trade: null,
    tradesCompleted: 0,
    arcadeUnlocked: false,
    seenApps: [],
    arcadeReveal: false,
    owlMet: false,
    javaliMet: false,
  }
}

export const STARTER_APPS: AppId[] = ['pulso', 'mensagens', 'cartas', 'trocas', 'ajustes']

function updateTrade(state: DevoState, patch: Partial<TradeSession>): DevoState {
  if (!state.trade) return state
  return { ...state, trade: { ...state.trade, ...patch } }
}

function setRoomStatus(rooms: Room[], roomId: string, status: Room['status']) {
  return rooms.map((r) => (r.id === roomId ? { ...r, status } : r))
}

function reducer(state: DevoState, action: Action): DevoState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase }
    case 'RESTART_SESSION':
      // Mantém conta, conversas e tutoriais vistos; zera cartas, trocas e avisos e devolve o pulso a 72h.
      return {
        ...state,
        timerEndsAt: action.at + START_HOURS * 3600 * 1000,
        inventory: action.inventory,
        trade: null,
        tradesCompleted: 0,
        rooms: initialRooms(),
        notifications: [],
        toasts: [],
        unread: {},
      }
    case 'START_SESSION':
      return { ...freshState('intro', state.playerName), hasSession: true }
    case 'SET_PLAYER':
      return { ...state, playerName: action.name }
    case 'MARK_WELCOMED':
      return { ...state, welcomed: true }
    case 'OWL_MET':
      return state.owlMet ? state : { ...state, owlMet: true }
    case 'JAVALI_MET':
      return state.javaliMet ? state : { ...state, javaliMet: true }
    case 'SEE_APP':
      if (state.seenApps.includes(action.appId)) return state
      return { ...state, seenApps: [...state.seenApps, action.appId] }
    case 'UNLOCK_ARCADE':
      if (state.arcadeUnlocked) return state
      return { ...state, arcadeUnlocked: true, arcadeReveal: true }
    case 'ADD_TIME':
      if (!action.ms) return state
      return { ...state, timerEndsAt: state.timerEndsAt + action.ms }
    case 'ARCADE_REVEAL_DONE':
      return { ...state, arcadeReveal: false }
    case 'NOTIFY':
      return {
        ...state,
        notifications: [action.item, ...state.notifications].slice(0, 30),
        toasts: [...state.toasts, action.item].slice(-3),
        unread: { ...state.unread, [action.item.appId]: (state.unread[action.item.appId] ?? 0) + 1 },
      }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], toasts: [] }
    case 'READ_APP':
      if (!state.unread[action.appId]) return state
      return { ...state, unread: { ...state.unread, [action.appId]: 0 } }
    case 'THREAD_MESSAGE':
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? { ...t, typing: false, messages: [...t.messages, action.message], unread: t.unread + (action.countUnread ? 1 : 0) }
            : t,
        ),
      }
    case 'THREAD_TYPING':
      return { ...state, threads: state.threads.map((t) => (t.id === action.threadId ? { ...t, typing: action.typing } : t)) }
    case 'THREAD_READ':
      return { ...state, threads: state.threads.map((t) => (t.id === action.threadId ? { ...t, unread: 0 } : t)) }
    case 'THREAD_ANSWER':
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId && !t.answered.includes(action.choiceId) ? { ...t, answered: [...t.answered, action.choiceId] } : t,
        ),
      }
    case 'ROOMS_SHUFFLE': {
      const candidates = state.rooms.filter((r) => r.status !== 'sua')
      if (!candidates.length) return state
      const target = candidates[Math.floor(Math.random() * candidates.length)]
      return { ...state, rooms: setRoomStatus(state.rooms, target.id, target.status === 'livre' ? 'ocupada' : 'livre') }
    }
    case 'TRADE_ENTER':
      if (state.trade) return state
      return {
        ...state,
        rooms: setRoomStatus(state.rooms, action.roomId, 'sua'),
        trade: {
          roomId: action.roomId,
          stage: 'placing',
          myCard: null,
          partner: null,
          partnerCardId: null,
          chat: [],
          myAccept: false,
          partnerAccept: false,
          partnerTyping: false,
        },
      }
    case 'TRADE_PLACE': {
      const card = state.inventory.find((c) => c.uid === action.uid)
      if (!card || !state.trade || state.trade.stage !== 'placing') return state
      return {
        ...state,
        inventory: state.inventory.filter((c) => c.uid !== action.uid),
        trade: { ...state.trade, myCard: card, stage: 'waiting' },
      }
    }
    case 'TRADE_PARTNER_JOIN':
      if (state.trade?.stage !== 'waiting') return state
      return updateTrade(state, { stage: 'negotiating', partner: action.partner, partnerCardId: action.partnerCardId })
    case 'TRADE_CHAT':
      if (state.trade?.stage !== 'negotiating') return state
      return updateTrade(state, { chat: [...state.trade.chat, action.message], partnerTyping: false })
    case 'TRADE_PARTNER_TYPING':
      return updateTrade(state, { partnerTyping: action.typing })
    case 'TRADE_ACCEPT':
      if (state.trade?.stage !== 'negotiating') return state
      return updateTrade(state, { myAccept: true })
    case 'TRADE_PARTNER_ACCEPT':
      if (state.trade?.stage !== 'negotiating') return state
      return updateTrade(state, { partnerAccept: true })
    case 'TRADE_REVEAL':
      if (state.trade?.stage !== 'negotiating') return state
      return updateTrade(state, { stage: 'revealing' })
    case 'TRADE_COMPLETE': {
      const t = state.trade
      if (!t || t.stage !== 'revealing' || !t.partnerCardId || !t.partner) return state
      return {
        ...state,
        tradesCompleted: state.tradesCompleted + 1,
        inventory: [makeOwned(t.partnerCardId, `Troca com ${t.partner.handle}`), ...state.inventory],
        trade: { ...t, stage: 'done', endReason: 'completed' },
      }
    }
    case 'TRADE_PARTNER_LEAVE':
    case 'TRADE_CANCEL': {
      const t = state.trade
      if (!t || t.stage === 'done' || t.stage === 'abandoned') return state
      // Sala "Sem retorno": quem sai depois de pôr a carta perde a carta.
      const forfeit = action.type === 'TRADE_CANCEL' && !!action.forfeit && !!t.myCard
      return {
        ...state,
        inventory: t.myCard && !forfeit ? [t.myCard, ...state.inventory] : state.inventory,
        trade: {
          ...t,
          myCard: forfeit ? null : t.myCard,
          stage: 'abandoned',
          partnerTyping: false,
          endReason: forfeit ? 'forfeit' : action.type === 'TRADE_CANCEL' ? 'cancelled' : 'partner-left',
        },
      }
    }
    case 'TRADE_EXIT': {
      const t = state.trade
      if (!t) return state
      const restored = t.stage !== 'done' && t.stage !== 'abandoned' && t.myCard ? [t.myCard, ...state.inventory] : state.inventory
      return { ...state, inventory: restored, rooms: setRoomStatus(state.rooms, t.roomId, 'livre'), trade: null }
    }
  }
}

type DevoContextValue = {
  state: DevoState
  dispatch: React.Dispatch<Action>
  notify: (item: Omit<NotificationItem, 'id' | 'createdAt'>) => void
  /** Reinicia a sessão (cartas → kit inicial, pulso → 72h) e grava no servidor na hora. */
  restartSession: () => Promise<boolean>
}

const DevoContext = createContext<DevoContextValue | null>(null)

let idCounter = 0
export function nextId(prefix = 'id') {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

function hydrate(playerName: string | null, save: SaveData | null): DevoState {
  const base = freshState('landing', playerName)
  if (!save || !playerName) return base
  const savedThreads = new Map(save.threads.map((t) => [t.id, t]))
  return {
    ...base,
    hasSession: true,
    welcomed: save.welcomed,
    timerEndsAt: save.timerEndsAt || base.timerEndsAt,
    inventory: save.inventory,
    notifications: save.notifications,
    tradesCompleted: save.tradesCompleted,
    arcadeUnlocked: !!save.arcadeUnlocked,
    owlMet: !!save.owlMet,
    javaliMet: !!save.javaliMet,
    seenApps: (save.seenApps ?? []).filter((a): a is AppId => STARTER_APPS.includes(a as AppId)),
    threads: base.threads.map((t) => {
      const s = savedThreads.get(t.id)
      return s ? { ...t, messages: s.messages, unread: s.unread, answered: s.answered } : t
    }),
  }
}

function toSave(state: DevoState): SaveData {
  const t = state.trade
  const cardOnTable = t && t.stage !== 'done' && t.stage !== 'abandoned' ? t.myCard : null
  return {
    v: 1,
    welcomed: state.welcomed,
    timerEndsAt: state.timerEndsAt,
    inventory: cardOnTable ? [cardOnTable, ...state.inventory] : state.inventory,
    notifications: state.notifications,
    tradesCompleted: state.tradesCompleted,
    arcadeUnlocked: state.arcadeUnlocked,
    seenApps: state.seenApps,
    owlMet: state.owlMet,
    javaliMet: state.javaliMet,
    threads: state.threads.map((th) => ({ id: th.id, messages: th.messages, unread: th.unread, answered: th.answered })),
  }
}

function postSave(state: DevoState) {
  return fetch('/api/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(toSave(state)),
    keepalive: true,
  }).catch(() => null)
}

/** Grava o progresso no servidor pouco depois de cada mudança e ao sair da página. */
function useAutosave(state: DevoState) {
  const latest = useRef(state)
  latest.current = state
  const enabled = state.hasSession && !!state.playerName
  const { welcomed, timerEndsAt, inventory, notifications, threads, tradesCompleted, trade, arcadeUnlocked, seenApps, owlMet, javaliMet } = state

  useEffect(() => {
    if (!enabled) return
    const id = window.setTimeout(() => postSave(latest.current), 1200)
    return () => window.clearTimeout(id)
  }, [enabled, welcomed, timerEndsAt, inventory, notifications, threads, tradesCompleted, trade?.myCard, arcadeUnlocked, seenApps, owlMet, javaliMet])

  useEffect(() => {
    if (!enabled) return
    const flush = () => {
      if (document.visibilityState === 'hidden') postSave(latest.current)
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [enabled])
}

export function DevoProvider({
  children,
  initialPlayerName = null,
  initialSave = null,
}: {
  children: ReactNode
  initialPlayerName?: string | null
  initialSave?: SaveData | null
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => hydrate(initialPlayerName, initialSave))
  useAutosave(state)
  const notify = useCallback<DevoContextValue['notify']>((item) => {
    dispatch({ type: 'NOTIFY', item: { ...item, id: nextId('n'), createdAt: Date.now() } })
    showSystemNotification(item.title, item.body)
  }, [])
  const stateRef = useRef(state)
  stateRef.current = state
  const restartSession = useCallback(async () => {
    const action: Action = { type: 'RESTART_SESSION', at: Date.now(), inventory: starterInventory() }
    const next = reducer(stateRef.current, action)
    dispatch(action)
    if (!next.hasSession || !next.playerName) return true
    const res = await postSave(next)
    return !!res && res.ok
  }, [])
  const value = useMemo(() => ({ state, dispatch, notify, restartSession }), [state, notify, restartSession])
  return <DevoContext.Provider value={value}>{children}</DevoContext.Provider>
}

export function useDevo() {
  const ctx = useContext(DevoContext)
  if (!ctx) throw new Error('useDevo deve ser usado dentro de DevoProvider')
  return ctx
}
