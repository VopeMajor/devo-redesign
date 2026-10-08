import { CARDS, randomCardOfRarity } from './cards'
import type { CardDef, Rarity } from './types'

/**
 * Condições das salas de troca — fonte única. Cada condição muda o comportamento de verdade
 * (motor em `os/use-devo-engine.ts`, reducer em `state/devo-store.tsx`, tela em `apps/trocas-app.tsx`).
 */
export type RoomRule = 'cegas' | 'mesma-raridade' | 'sem-retorno' | 'chat-livre' | 'silencio'

export type ChatMode = 'livre' | 'frases' | 'nenhum'

export type RoomRuleMeta = {
  label: string
  /** Uma linha, mostrada na porta e no cabeçalho da sala. */
  summary: string
  /** O que muda, mostrado ao entrar. */
  details: string[]
  /** A carta do outro tem a mesma raridade da sua? */
  sameRarity: boolean
  /** A raridade (sua e do outro) aparece na mesa antes da revelação? */
  showRarity: boolean
  /** Sair depois de colocar a carta faz você perdê-la. */
  forfeitOnLeave: boolean
  chat: ChatMode
}

export const ROOM_RULES: Record<RoomRule, RoomRuleMeta> = {
  cegas: {
    label: 'Às cegas',
    summary: 'Nem a raridade é revelada.',
    details: ['A carta do outro pode ser de qualquer raridade.', 'Nenhuma raridade aparece na mesa até a revelação.', 'Chat só com frases prontas.'],
    sameRarity: false,
    showRarity: false,
    forfeitOnLeave: false,
    chat: 'frases',
  },
  'mesma-raridade': {
    label: 'Mesma raridade',
    summary: 'A raridade das duas cartas é garantida igual.',
    details: ['A carta do outro tem a mesma raridade da sua.', 'A raridade aparece na mesa.', 'Chat só com frases prontas.'],
    sameRarity: true,
    showRarity: true,
    forfeitOnLeave: false,
    chat: 'frases',
  },
  'sem-retorno': {
    label: 'Sem retorno',
    summary: 'Quem sai depois de pôr a carta, perde a carta.',
    details: [
      'Se você abandonar a sala depois de colocar sua carta, ela fica na mesa e você a perde.',
      'Se o outro jogador sair, sua carta volta para você.',
      'A raridade da carta do outro aparece quando ele senta. Pode ser qualquer uma.',
      'Chat só com frases prontas.',
    ],
    sameRarity: false,
    showRarity: true,
    forfeitOnLeave: true,
    chat: 'frases',
  },
  'chat-livre': {
    label: 'Chat liberado',
    summary: 'Escreva o que quiser.',
    details: ['Chat livre: pergunte, negocie, minta.', 'A raridade da carta do outro aparece quando ele senta. Pode ser qualquer uma.'],
    sameRarity: false,
    showRarity: true,
    forfeitOnLeave: false,
    chat: 'livre',
  },
  silencio: {
    label: 'Silêncio',
    summary: 'Ninguém fala.',
    details: ['Não há chat: decida só pelo que está na mesa.', 'A raridade das duas cartas é garantida igual e aparece na mesa.'],
    sameRarity: true,
    showRarity: true,
    forfeitOnLeave: false,
    chat: 'nenhum',
  },
}

/** Ordem das 8 salas do corredor. */
export const ROOM_LAYOUT: RoomRule[] = ['cegas', 'mesma-raridade', 'sem-retorno', 'chat-livre', 'cegas', 'mesma-raridade', 'silencio', 'cegas']

/** Regras gerais (Protocolo) — valem em todas as salas e não contradizem nenhuma condição. */
export const TRADE_PROTOCOL = [
  'Escolha uma sala livre e coloque uma carta no SEU ESPAÇO.',
  'Outro jogador entra e coloca uma carta no espaço dele. As cartas ficam viradas até a revelação.',
  'Cada sala tem uma condição própria (raridade, chat, saída). Ela está na porta e é explicada ao entrar.',
  'Se ambos aceitarem, a troca é final.',
  'Se o outro jogador abandonar a sala, sua carta volta para você.',
]

/** Frases prontas das salas sem chat livre. O parceiro responde a elas como a qualquer mensagem. */
export const QUICK_PHRASES = ['Qual o tipo da sua carta?', 'Vamos fechar a troca?', 'Confia em mim.', 'Não sei…']

export function partnerCardFor(rule: RoomRule, myRarity: Rarity): CardDef {
  if (ROOM_RULES[rule].sameRarity) return randomCardOfRarity(myRarity)
  return CARDS[Math.floor(Math.random() * CARDS.length)]
}
