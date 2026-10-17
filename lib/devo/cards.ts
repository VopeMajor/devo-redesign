import type { CardDef, OwnedCard, Rarity } from './types'

/**
 * Fonte única das raridades. Nomes, cores e ordem usados em qualquer tela (Cartas, Record, Trocas,
 * aula da Coruja, Salão, Calendário) saem daqui. `plural` serve para textos corridos.
 * `secreta` = Única e Promocional: existem como raridade (ordem acima da Lendária), mas não entram nos
 * filtros, na aula de raridades nem nas recompensas configuráveis (nenhum jogo comum as entrega).
 */
export const RARITY_META: Record<Rarity, { label: string; plural: string; color: string; order: number; secreta?: true }> = {
  // `color` = marca da raridade sobre o negro (mármore → prata → champanhe → champanhe-ametista → ametista).
  comum: { label: 'Comum', plural: 'Comuns', color: '#a3a2a6', order: 0 },
  incomum: { label: 'Incomum', plural: 'Incomuns', color: '#ececee', order: 1 },
  rara: { label: 'Rara', plural: 'Raras', color: '#d6cdbd', order: 2 },
  ultra_rara: { label: 'Ultra Rara', plural: 'Ultra Raras', color: '#d9c9e3', order: 3 },
  lendaria: { label: 'Lendária', plural: 'Lendárias', color: '#c2b9ec', order: 4 },
  // Secretas (pedido do dono 17/10): Única em tom de granada; Promocional holográfica (cor = pérola iridescente).
  unica: { label: 'Única', plural: 'Únicas', color: '#e3909a', order: 5, secreta: true },
  promocional: { label: 'Promocional', plural: 'Promocionais', color: '#b4dfe8', order: 6, secreta: true },
}

/** Raridades "de jogo", da mais comum para a mais rara (filtros, aula, recompensas). */
export const RARITIES: Rarity[] = (Object.keys(RARITY_META) as Rarity[])
  .filter((r) => !RARITY_META[r].secreta)
  .sort((a, b) => RARITY_META[a].order - RARITY_META[b].order)

/** As duas raridades secretas (Única, Promocional), na ordem. */
export const SECRET_RARITIES: Rarity[] = (Object.keys(RARITY_META) as Rarity[])
  .filter((r) => RARITY_META[r].secreta)
  .sort((a, b) => RARITY_META[a].order - RARITY_META[b].order)

/** Todas as raridades válidas (as de jogo e as secretas), em ordem. */
export const ALL_RARITIES: Rarity[] = [...RARITIES, ...SECRET_RARITIES]

export const isCardRarity = (r: unknown): r is Rarity => typeof r === 'string' && Object.prototype.hasOwnProperty.call(RARITY_META, r)

export const CARDS: CardDef[] = [
  { id: 'fosforo', name: 'Fósforo', numeral: 'I', rarity: 'comum', type: 'Ataque', glyph: 'flame', effect: 'Queima uma carta comum do oponente durante um jogo.', flavor: 'Uma chama pequena basta para um quarto escuro.' },
  { id: 'chave', name: 'Chave Enferrujada', numeral: 'II', rarity: 'comum', type: 'Informação', glyph: 'key', effect: 'Revela a saída de uma sala trancada.', flavor: 'Toda porta tem um preço.' },
  { id: 'tesoura', name: 'Tesoura Cega', numeral: 'III', rarity: 'comum', type: 'Trapaça', glyph: 'scissors', effect: 'Corta uma regra secundária do jogo atual.', flavor: 'Não corta nada. Quase nada.' },
  { id: 'escudo', name: 'Escudo de Papelão', numeral: 'IV', rarity: 'comum', type: 'Defesa', glyph: 'shield', effect: 'Anula a primeira penalidade de tempo recebida.', flavor: 'Melhor que nada. Por pouco.' },
  { id: 'moeda', name: 'Moeda de Duas Caras', numeral: 'V', rarity: 'incomum', type: 'Trapaça', glyph: 'coins', effect: 'Força um cara-ou-coroa a seu favor uma vez.', flavor: 'O destino também aceita suborno.' },
  { id: 'dado', name: 'Dado Viciado', numeral: 'VI', rarity: 'incomum', type: 'Trapaça', glyph: 'dice', effect: 'Escolha o resultado de uma rolagem.', flavor: 'Seis lados. Uma verdade.' },
  { id: 'porta', name: 'A Porta Vermelha', numeral: 'VII', rarity: 'incomum', type: 'Informação', glyph: 'door', effect: 'Mostra quantos jogadores restam no andar.', flavor: 'Não abra. Ou abra.' },
  { id: 'laminas', name: 'Lâminas Cruzadas', numeral: 'VIII', rarity: 'incomum', type: 'Ataque', glyph: 'swords', effect: 'Rouba 1 hora de um oponente derrotado.', flavor: 'O tempo dos outros também é seu.' },
  { id: 'ampulheta', name: 'Ampulheta Invertida', numeral: 'IX', rarity: 'rara', type: 'Tempo', glyph: 'hourglass', effect: 'Concede +3 horas ao seu pulso.', flavor: 'A areia sobe quando ninguém olha.' },
  { id: 'olho', name: 'Olho que Tudo Vê', numeral: 'X', rarity: 'rara', type: 'Informação', glyph: 'eye', effect: 'Revela a carta oculta em uma troca antes de aceitar.', flavor: 'Saber é sobreviver.' },
  { id: 'mascara', name: 'Máscara do Rato', numeral: 'XI', rarity: 'rara', type: 'Trapaça', glyph: 'mask', effect: 'Assume a identidade de outro jogador por um jogo.', flavor: 'Ninguém confia num rato. Todos confiam numa máscara.' },
  { id: 'cranio', name: 'Crânio Polido', numeral: 'XII', rarity: 'rara', type: 'Ataque', glyph: 'skull', effect: 'Elimina um jogador com menos de 1 hora restante.', flavor: 'Limpo como uma promessa.' },
  { id: 'relogio', name: 'O Relógio Parado', numeral: 'XIII', rarity: 'lendaria', type: 'Tempo', glyph: 'clock', effect: 'Congela seu pulso por 12 horas.', flavor: 'Às vezes, o melhor movimento é nenhum.' },
  { id: 'coracao', name: 'Coração de Vidro', numeral: 'XIV', rarity: 'lendaria', type: 'Defesa', glyph: 'heart', effect: 'Sobrevive uma vez ao zerar o tempo.', flavor: 'Frágil. Insubstituível.' },
  { id: 'coroa', name: 'Coroa do Anfitrião', numeral: 'XV', rarity: 'lendaria', type: 'Trapaça', glyph: 'crown', effect: 'Altera uma regra de qualquer jogo.', flavor: 'O Rato não gosta que a usem.' },
  { id: 'contrato', name: 'Contrato em Branco', numeral: 'XVI', rarity: 'lendaria', type: 'Informação', glyph: 'scroll', effect: 'Obriga outro jogador a cumprir um acordo.', flavor: 'Assine. Depois leia.' },
]

const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]))

export function getCard(id: string): CardDef {
  const card = CARD_MAP.get(id)
  if (!card) throw new Error(`Carta desconhecida: ${id}`)
  return card
}

const ARCANA_COLLECTIONS: { name: string; cards: string[] }[] = [
  { name: 'Cinzas', cards: ['fosforo', 'laminas', 'cranio'] },
  { name: 'Portas & Chaves', cards: ['chave', 'porta', 'olho', 'contrato'] },
  { name: 'Sala de Jogos', cards: ['tesoura', 'moeda', 'dado', 'mascara', 'coroa'] },
  { name: 'O Pulso', cards: ['escudo', 'ampulheta', 'relogio', 'coracao'] },
]

export const ARCHETYPE_BY_TYPE: Record<CardDef['type'], string> = {
  Ataque: 'Ruína',
  Informação: 'Oráculo',
  Trapaça: 'Ilusão',
  Defesa: 'Bastião',
  Tempo: 'Cronos',
}

const CARD_RADIUS: Record<string, string> = {
  fosforo: '3M',
  chave: 'Toque',
  tesoura: 'Mesa',
  escudo: 'Pessoal',
  moeda: 'Mesa',
  dado: 'Mesa',
  porta: 'Andar',
  laminas: 'Toque',
  ampulheta: 'Pessoal',
  olho: 'Troca',
  mascara: '10M',
  cranio: '5M',
  relogio: 'Pessoal',
  coracao: 'Pessoal',
  coroa: 'Jogo',
  contrato: 'Toque',
}

export function getCardRadius(id: string): string {
  return CARD_RADIUS[id] ?? '—'
}

/** Coleções Arcanas (nome + quantidade de cartas), na ordem oficial. */
export function getCollections(): { name: string; size: number; cards: string[] }[] {
  return ARCANA_COLLECTIONS.map((c) => ({ name: c.name, size: c.cards.length, cards: [...c.cards] }))
}

/**
 * Numeração oficial de uma carta — fonte única para qualquer tela.
 * - `order`/`collectionSize`/`orderLabel`: posição na Coleção Arcana ("02/04").
 * - `universal`/`serial`: lugar no Compêndio (todas as cartas), "№ 007".
 */
export type CardMeta = {
  collection: string
  order: number
  collectionSize: number
  orderLabel: string
  universal: number
  serial: string
}

export function getCardMeta(id: string): CardMeta {
  const collection = ARCANA_COLLECTIONS.find((c) => c.cards.includes(id)) ?? { name: 'Compêndio', cards: [id] }
  const universal = CARDS.findIndex((c) => c.id === id) + 1
  const order = collection.cards.indexOf(id) + 1
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    collection: collection.name,
    order,
    collectionSize: collection.cards.length,
    orderLabel: `${pad(order)}/${pad(collection.cards.length)}`,
    universal,
    serial: `№ ${String(universal).padStart(3, '0')}`,
  }
}

/**
 * Carta aleatória da raridade pedida. Se a raridade ainda não tem cartas (a Ultra Rara nasceu vazia em 17/10;
 * as secretas também não têm), cai para a raridade mais próxima ABAIXO que tenha; só sobe se não houver nenhuma.
 */
export function randomCardOfRarity(rarity: Rarity, excludeId?: string): CardDef {
  const poolOf = (r: Rarity) => CARDS.filter((c) => c.rarity === r && c.id !== excludeId)
  const order = RARITY_META[rarity]?.order ?? 0
  const byDistance = [...ALL_RARITIES].sort((a, b) => {
    const da = RARITY_META[a].order - order
    const db = RARITY_META[b].order - order
    // mesma raridade primeiro, depois as de baixo (mais perto primeiro), por fim as de cima
    const rank = (d: number) => (d === 0 ? 0 : d < 0 ? 1000 - d : 2000 + d)
    return rank(da) - rank(db)
  })
  for (const r of byDistance) {
    const pool = poolOf(r)
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)]
  }
  return CARDS[0]
}

let uidCounter = 0
export function makeOwned(cardId: string, origin: string): OwnedCard {
  uidCounter += 1
  return { uid: `c-${Date.now().toString(36)}-${uidCounter}`, cardId, origin, acquiredAt: Date.now() }
}

export function starterInventory(): OwnedCard[] {
  return ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta'].map((id) => makeOwned(id, 'Kit inicial'))
}
