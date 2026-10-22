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

/**
 * Catálogo (dono, 22/10): das cartas antigas fica só o Escudo de Papelão; as outras foram excluídas (saem dos
 * inventários: `cartaExiste` filtra o save e scripts/kit-inicial-migration.sql limpa o banco).
 */
export const CARTAS_EXCLUIDAS = ['fosforo', 'chave', 'tesoura', 'moeda', 'dado', 'porta', 'laminas', 'ampulheta', 'olho', 'mascara', 'cranio', 'relogio', 'coracao', 'coroa', 'contrato']

export const CARDS: CardDef[] = [
  { id: 'escudo', name: 'Escudo de Papelão', numeral: 'I', rarity: 'comum', type: 'Defesa', glyph: 'shield', effect: 'Anula a primeira penalidade de tempo recebida.', flavor: 'Melhor que nada. Por pouco.' },
  // Coleção: Xadrez (texto do dono, 22/10, literal). `effect` = "No card"; `detalhe` = Descrição detalhada.
  // `type` só escolhe a arte de fundo; a ficha mostra Natureza e Arquétipo.
  {
    id: 'xadrez_peao', name: 'Peão do Xadrez', numeral: 'II', rarity: 'incomum', type: 'Defesa', glyph: 'pawn',
    natureza: 'Usus', arquetipo: 'Jogos de Tabuleiro', peso: 1, flavor: '',
    effect: 'A linha de frente não é lugar para fracos e amadores. Bom, não se eles não tiverem uma armadura!',
    detalhe: 'Permite invocar uma armadura completa de cavaleiro, confeccionada em ferro impuro. Extremamente pesada e inflexível, a armadura oferece proteção física considerável, mas compromete a mobilidade de quem a veste, dificultando movimentos rápidos e ágeis. A invocação ocorre separadamente do corpo do usuário, de modo que o equipamento surge como um objeto independente e precisa ser vestido manualmente.',
  },
  {
    id: 'xadrez_rei', name: 'Rei do Xadrez', numeral: 'III', rarity: 'rara', type: 'Trapaça', glyph: 'king',
    natureza: 'Benedictio', arquetipo: 'Jogos de Tabuleiro', peso: 2, flavor: '',
    effect: 'Aqueles que reconhecem o soberano o protegerão a todo custo.',
    detalhe: 'Durante um Deadly Vote, o portador pode proferir um discurso em tom autoritário, capaz de inspirar aqueles que escutarem sua voz. Caso os ouvintes sejam convencidos e decidam obedecer às suas ordens, receberão um aumento temporário de estamina. A intensidade e a duração do efeito dependem da influência exercida pelo discurso e da receptividade dos envolvidos, cabendo ao narrador determinar os benefícios concedidos de acordo com o desenvolvimento narrativo.',
  },
  {
    id: 'xadrez_cavalo', name: 'Cavalo do Xadrez', numeral: 'IV', rarity: 'rara', type: 'Ataque', glyph: 'knight',
    natureza: 'Mutatio', arquetipo: 'Jogos de Tabuleiro', peso: 2, flavor: '',
    effect: 'Toque em um objeto de massa semelhante e transforme-o temporariamente em um cavalo saudável.',
    detalhe: 'Permite transformar temporariamente qualquer objeto com massa igual ou superior a 400 kg em um cavalo saudável de qualquer raça. Embora a transformação resulte em um animal plenamente funcional, sua personalidade e seu comportamento não ficam sob o controle do usuário. O cavalo pode agir de maneira selvagem, imprevisível ou até mesmo hostil, tornando sua utilização potencialmente arriscada. A carta pode ser utilizada até duas vezes por Deadly Vote ou Campanha.',
  },
  {
    id: 'xadrez_bispo', name: 'Bispo do Xadrez', numeral: 'V', rarity: 'rara', type: 'Informação', glyph: 'bishop',
    natureza: 'Usus', arquetipo: 'Jogos de Tabuleiro', peso: 2, flavor: '',
    effect: 'Como um farol, ele sempre te encontra primeiro.',
    detalhe: 'Permite invocar uma pequena cruz branca, aproximadamente do tamanho de um palmo, que funciona como um dispositivo de alarme. O objeto pode ser fixado em uma superfície e, sempre que alguém se aproximar a até 3 metros de sua posição ou tocar na superfície à qual está preso, emitirá um apito estridente e mudará de cor para vermelho. A intensidade sonora do alarme varia entre 80 dB e 102 dB, tornando-o útil para vigiar passagens, proteger locais e alertar sobre a aproximação de possíveis intrusos.',
  },
  {
    id: 'xadrez_torre', name: 'Torre do Xadrez', numeral: 'VI', rarity: 'rara', type: 'Ataque', glyph: 'rook',
    natureza: 'Potentia', arquetipo: 'Jogos de Tabuleiro', peso: 3, flavor: '',
    effect: 'Destrua tudo o que estiver no seu caminho, mas use seu próprio corpo para isso.',
    detalhe: 'Ao iniciar uma corrida em determinada direção, o portador pode ativar a habilidade da carta, envolvendo o próprio corpo em um mantra de poder. Como uma torre de cerco lançada contra as defesas inimigas, o usuário avança em linha reta, utilizando o próprio corpo para romper paredes e outras superfícies resistentes. Uma vez iniciada a investida, não pode realizar curvas nem interromper voluntariamente a aceleração durante o percurso de até 20 metros. Durante a colisão com obstáculos ao longo da investida, o dano recebido é reduzido em 50%, conforme os critérios narrativos.',
  },
  {
    id: 'xadrez_rainha', name: 'Rainha do Xadrez', numeral: 'VII', rarity: 'ultra_rara', type: 'Tempo', glyph: 'queen',
    natureza: 'Potentia', arquetipo: 'Jogos de Tabuleiro', peso: 4, flavor: '',
    effect: 'Mova-se em qualquer direção, para qualquer lugar.',
    detalhe: 'Ao ativar a carta, o portador invoca um cetro real de ouro que lhe permite realizar um teletransporte instantâneo. Após arremessar o objeto, o usuário pode fazer com que seu corpo desapareça e reapareça exatamente no local onde o cetro aterrissar, surgindo com ele nas mãos. A distância máxima da habilidade corresponde ao alcance do arremesso realizado. Caso o teletransporte não seja ativado em até dois turnos após o lançamento, o cetro desaparece e retorna à carta, encerrando a oportunidade de utilização.',
  },
  {
    id: 'xadrez_tabuleiro', name: 'Tabuleiro do Xadrez', numeral: 'VIII', rarity: 'ultra_rara', type: 'Informação', glyph: 'board',
    natureza: 'Dominatio', arquetipo: 'Jogos de Tabuleiro', peso: 3, flavor: '',
    effect: 'Todas as pessoas deste mundo são apenas ferramentas.',
    detalhe: 'Permite ao portador observar, à distância, qualquer duelo em andamento entre Records durante um Deadly Vote ou uma Campanha, desde que todos os participantes envolvidos pertençam à mesma Corporação que o usuário. Por meio da carta, é possível acompanhar visualmente os combates em tempo real, independentemente da localização dos envolvidos. Entretanto, a observação não permite ouvir sons, diálogos ou quaisquer outras informações auditivas, restringindo o efeito exclusivamente à percepção visual dos confrontos.',
  },
]

const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]))

/** A carta existe no catálogo atual? (cartas excluídas e ids estranhos somem do inventário) */
export const cartaExiste = (id: string) => CARD_MAP.has(id)

/** Registro antigo (lote do Salão, prêmio, troca) de uma carta excluída: aparece como "Carta retirada", sem quebrar a tela. */
const RETIRADA = (id: string): CardDef => ({ id, name: 'Carta retirada', numeral: '—', rarity: 'comum', type: 'Defesa', glyph: 'scroll', effect: 'Esta carta saiu do jogo.', flavor: '' })

export function getCard(id: string): CardDef {
  const card = CARD_MAP.get(id)
  if (card) return card
  if (CARTAS_EXCLUIDAS.includes(id)) return RETIRADA(id)
  throw new Error(`Carta desconhecida: ${id}`)
}

const ARCANA_COLLECTIONS: { name: string; cards: string[] }[] = [
  { name: 'Iniciais', cards: ['escudo'] },
  { name: 'Xadrez', cards: ['xadrez_peao', 'xadrez_rei', 'xadrez_cavalo', 'xadrez_bispo', 'xadrez_torre', 'xadrez_rainha', 'xadrez_tabuleiro'] },
]

export const ARCHETYPE_BY_TYPE: Record<CardDef['type'], string> = {
  Ataque: 'Ruína',
  Informação: 'Oráculo',
  Trapaça: 'Ilusão',
  Defesa: 'Bastião',
  Tempo: 'Cronos',
}

const CARD_RADIUS: Record<string, string> = {
  escudo: 'Pessoal',
}

/** Arquétipo mostrado: o do dono, quando a carta tem; senão o derivado do tipo. */
export function getCardArquetipo(card: CardDef): string {
  return card.arquetipo ?? ARCHETYPE_BY_TYPE[card.type]
}

/**
 * Peso das Cartas (texto do dono, 22/10): o Deadly Vote limita a soma dos pesos que um Record leva. O peso não diz
 * se a carta é melhor ou pior; serve para equilibrar. Cartas sem peso definido usam o padrão da raridade (PROVISÓRIO).
 */
export const PESO_PADRAO: Record<Rarity, number> = { comum: 1, incomum: 1, rara: 2, ultra_rara: 3, lendaria: 4, unica: 4, promocional: 2 }

export function getCardPeso(id: string): number {
  const c = CARD_MAP.get(id)
  if (!c) return 1
  return c.peso ?? PESO_PADRAO[c.rarity]
}

export const PESO_TEXTO =
  'O Deadly Vote costuma limitar a quantidade de cartas que um Record pode levar para suas partidas. Essa limitação é definida de acordo com os critérios do Dealer responsável pela narração e as características do jogo em questão, sendo sempre informada no momento da inscrição. O peso máximo corresponde à soma dos pesos de todas as cartas que o participante pretende levar consigo. Isso significa que, se o limite de uma partida for 7, por exemplo, você poderá levar duas cartas de peso 3 e uma carta de peso 1, totalizando o máximo permitido. O peso de uma carta não determina, necessariamente, se ela é melhor ou pior do que as demais. Trata-se de um parâmetro utilizado para equilibrar as possibilidades dos participantes e contribuir para o balanceamento geral do próprio DEVO.'

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

/**
 * Cartas Iniciais (dono, 22/10): o jogador começa só com o Escudo de Papelão. Fósforo, Moeda, Dado e Ampulheta
 * continuam existindo (Comuns), mas não vêm mais no kit; as cópias antigas do kit saem dos saves (`semKitAntigo`).
 */
export const KIT_INICIAL = ['escudo']
export const ORIGEM_KIT = 'Kit inicial'

export function starterInventory(): OwnedCard[] {
  return KIT_INICIAL.map((id) => makeOwned(id, ORIGEM_KIT))
}

/** Tira do inventário as cópias do kit antigo que não fazem mais parte do kit (só o Escudo fica). */
export function semKitAntigo<T extends { cardId: string; origin: string }>(inventario: T[]): T[] {
  return inventario.filter((c) => CARD_MAP.has(c.cardId) && (c.origin !== ORIGEM_KIT || KIT_INICIAL.includes(c.cardId)))
}
