import type { CardDef, OwnedCard, Rarity } from './types'

export const RARITY_META: Record<Rarity, { label: string; color: string; order: number }> = {
  comum: { label: 'Comum', color: '#cbbfa8', order: 0 },
  incomum: { label: 'Incomum', color: '#b08350', order: 1 },
  rara: { label: 'Rara', color: '#d4161f', order: 2 },
  lendaria: { label: 'Lendária', color: '#d8b25a', order: 3 },
}

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

export type CardMeta = { collection: string; order: number; collectionSize: number; serial: string }

export function getCardMeta(id: string): CardMeta {
  const collection = ARCANA_COLLECTIONS.find((c) => c.cards.includes(id)) ?? { name: 'Compêndio', cards: [id] }
  const universal = CARDS.findIndex((c) => c.id === id) + 1
  return {
    collection: collection.name,
    order: collection.cards.indexOf(id) + 1,
    collectionSize: collection.cards.length,
    serial: `${String(Math.floor(universal / 1000)).padStart(3, '0')}.${String(universal * 137 + 4000).padStart(3, '0')}`,
  }
}

export function randomCardOfRarity(rarity: Rarity, excludeId?: string): CardDef {
  const pool = CARDS.filter((c) => c.rarity === rarity && c.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}

let uidCounter = 0
export function makeOwned(cardId: string, origin: string): OwnedCard {
  uidCounter += 1
  return { uid: `c-${Date.now().toString(36)}-${uidCounter}`, cardId, origin, acquiredAt: Date.now() }
}

export function starterInventory(): OwnedCard[] {
  return ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta'].map((id) => makeOwned(id, 'Kit inicial'))
}
