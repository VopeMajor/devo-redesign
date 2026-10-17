/**
 * Raridades das Cartas DEVO, da mais comum para a mais rara: comum < incomum < rara < ultra_rara < lendaria.
 * `unica` (tom de granada) e `promocional` (holográfica) são as duas raridades "secretas" da aula da Coruja:
 * nenhum jogo comum as entrega e ficam fora dos filtros e das recompensas configuráveis (ver RARITIES em cards.ts).
 */
export type Rarity = 'comum' | 'incomum' | 'rara' | 'ultra_rara' | 'lendaria' | 'unica' | 'promocional'

export type CardType = 'Tempo' | 'Ataque' | 'Defesa' | 'Informação' | 'Trapaça'

export type GlyphName =
  | 'hourglass'
  | 'skull'
  | 'shield'
  | 'eye'
  | 'dice'
  | 'key'
  | 'flame'
  | 'swords'
  | 'mask'
  | 'heart'
  | 'crown'
  | 'clock'
  | 'scroll'
  | 'coins'
  | 'door'
  | 'scissors'

export type CardDef = {
  id: string
  name: string
  numeral: string
  rarity: Rarity
  type: CardType
  glyph: GlyphName
  effect: string
  flavor: string
}

export type OwnedCard = {
  uid: string
  cardId: string
  origin: string
  acquiredAt: number
}

export type AppId = 'record' | 'pulso' | 'mensagens' | 'cartas' | 'trocas' | 'ajustes' | 'jogos'
  /** Sistemas novos (DIRECAO-3), abertos como app; registro em components/devo/progressao/sistemas.tsx. */
  | 'salao'
  | 'poco'
  | 'torres'
  | 'corporacoes'
  | 'virtudes'
  | 'calendario'
  | 'arcanos'

export type NotificationItem = {
  id: string
  appId: AppId
  title: string
  body: string
  createdAt: number
  tone?: 'default' | 'danger'
}

export type ChatMessage = {
  id: string
  from: 'me' | 'system' | string
  text: string
  at: number
}

export type Thread = {
  id: string
  npcId: string
  messages: ChatMessage[]
  unread: number
  typing: boolean
  /** Escolhas de diálogo já feitas; as respostas ficam travadas. */
  answered: string[]
}

export type RoomStatus = 'livre' | 'ocupada' | 'sua'

export type Room = {
  id: string
  number: number
  status: RoomStatus
}

export type PartnerPersonality = 'cordial' | 'mentiroso' | 'nervoso' | 'frio'

export type TradePartner = {
  handle: string
  personality: PartnerPersonality
  willing: boolean
}

export type TradeStage = 'placing' | 'waiting' | 'negotiating' | 'revealing' | 'done' | 'abandoned'

export type TradeSession = {
  roomId: string
  stage: TradeStage
  myCard: OwnedCard | null
  partner: TradePartner | null
  partnerCardId: string | null
  chat: ChatMessage[]
  myAccept: boolean
  partnerAccept: boolean
  partnerTyping: boolean
  endReason?: 'completed' | 'partner-left' | 'cancelled'
}

export type Phase = 'landing' | 'intro' | 'os'
