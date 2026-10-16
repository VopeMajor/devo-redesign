import { randomCardOfRarity } from './cards'
import type { CardDef, Rarity } from './types'

/**
 * Sala de Trocas — regra única (Direção 3 §8). Todas as salas funcionam igual, como o Rato explica no tutorial
 * (`lib/devo/intro-script.ts`): mesma raridade garantida, carta do outro oculta até a revelação, chat da sala para
 * negociar, os dois aceitam → revela, troca confirmada não se desfaz. Quem não tem carta não troca.
 * Motor em `os/use-devo-engine.ts`, reducer em `state/devo-store.tsx`, tela em `apps/trocas-app.tsx`.
 */

/** A regra da casa, em quatro passos (os mesmos do Rato). Mostrada ao entrar na sala. */
export const TRADE_RULES = [
  'A carta do outro tem a mesma raridade da sua.',
  'Nenhuma das duas é mostrada até a revelação.',
  'Use o canal da sala para negociar, convencer ou mentir.',
  'Se os dois aceitarem, as cartas viram. Troca confirmada não se desfaz.',
] as const

/** Protocolo do corredor (regras gerais). */
export const TRADE_PROTOCOL = [
  'Escolha uma sala livre e coloque uma carta no SEU ESPAÇO.',
  'Outro jogador entra e coloca uma carta de mesma raridade no espaço dele. Nenhum dos dois vê a carta do outro.',
  'Negociem pelo canal da sala. Promessas não valem nada.',
  'Se ambos aceitarem, as cartas são reveladas e vão direto para os inventários. Sem devoluções.',
  'Se alguém sair antes de os dois aceitarem, cada carta volta ao seu dono.',
  'Cartas entregues ao Salão das Máscaras não vão à mesa. Sem cartas, não há troca.',
]

/** Atalhos do canal (o chat é livre; estas frases só poupam digitação no celular). */
export const QUICK_PHRASES = ['Qual o tipo da sua carta?', 'Vamos fechar a troca?', 'Confia em mim.', 'Não sei…']

/** A carta do parceiro: sempre da mesma raridade que a sua. */
export function partnerCardFor(myRarity: Rarity): CardDef {
  return randomCardOfRarity(myRarity)
}
