/**
 * Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Arquivo PURO.
 * Um Pacote é um item do inventário (`item_defs` kind 'pacote', chave `pacote:<id>`). Chega como prêmio semanal da
 * Sala de Jogos ou por concessão do Owner (recompensa de item) e é aberto na Casa. O sorteio é do servidor.
 */
export type PacotePremio =
  | { tipo: 'carta'; cardId: string; rotulo: string; chance: number }
  | { tipo: 'item'; item: string; rotulo: string; chance: number }
  /** Sorteado na hora: um item do catálogo (moedas, essências, chaves, fragmentos), pesando pela raridade. */
  | { tipo: 'item_aleatorio'; rotulo: string; chance: number }
  /** Sorteado na hora: uma carta de qualquer coleção, pesando pela raridade. */
  | { tipo: 'carta_aleatoria'; rotulo: string; chance: number }

export type Pacote = { id: string; nome: string; colecao: string; descricao: string; premios: PacotePremio[] }

export const PACOTES: Pacote[] = [
  {
    id: 'xadrez',
    nome: 'Pacote Raro: Coleção de Xadrez',
    colecao: 'Xadrez',
    descricao: 'Um pacote dedicado a cartas inspiradas no xadrez. Elegante, estratégico e genial — uma coleção digna de quem sabe jogar muito além do tabuleiro.',
    // dono (22/10): a carta da coleção não é garantida — 30% coleção, 5% Molde, 65% qualquer coisa
    premios: [
      { tipo: 'carta', cardId: 'xadrez_peao', rotulo: 'Peão (Carta Incomum)', chance: 11 },
      { tipo: 'carta', cardId: 'xadrez_bispo', rotulo: 'Bispo (Carta Rara)', chance: 4.4 },
      { tipo: 'carta', cardId: 'xadrez_torre', rotulo: 'Torre (Carta Rara)', chance: 4.4 },
      { tipo: 'carta', cardId: 'xadrez_cavalo', rotulo: 'Cavalo (Carta Rara)', chance: 4.4 },
      { tipo: 'carta', cardId: 'xadrez_rei', rotulo: 'Rei (Carta Rara)', chance: 3.8 },
      { tipo: 'carta', cardId: 'xadrez_rainha', rotulo: 'Rainha (Carta Ultra-Rara)', chance: 1 },
      { tipo: 'carta', cardId: 'xadrez_tabuleiro', rotulo: 'Tabuleiro de Xadrez (Carta Ultra-Rara)', chance: 1 },
      { tipo: 'item', item: 'estetico:molde_xadrez', rotulo: 'Molde de Xadrez (Item Estético)', chance: 5 },
      { tipo: 'item_aleatorio', rotulo: 'Item aleatório (moedas, essências, chaves, fragmentos)', chance: 40 },
      { tipo: 'carta_aleatoria', rotulo: 'Carta aleatória de qualquer coleção', chance: 25 },
    ],
  },
]

export const PACOTES_TEXTO =
  'Pacotes são itens de luxo que oferecem uma chance bastante elevada de obter cartas. Geralmente, estão associados a uma coleção específica, com temática própria e recompensas possíveis detalhadas em seu respectivo centro de informações.'

export const getPacote = (id: string) => PACOTES.find((p) => p.id === id) ?? null
export const itemDoPacote = (id: string) => `pacote:${id}`

/** Sorteia uma linha da tabela (`r` em [0,1)). As chances somam 100; as linhas aleatórias o servidor resolve. */
export function sortearPremio(p: Pacote, r: number): PacotePremio {
  const total = p.premios.reduce((s, x) => s + x.chance, 0)
  let alvo = r * total
  for (const x of p.premios) {
    alvo -= x.chance
    if (alvo < 0) return x
  }
  return p.premios[p.premios.length - 1]
}

/** Peso de cada raridade de item no sorteio aleatório (o lendário é raríssimo; arcano não sai). */
export const PESO_ITEM: Record<string, number> = { comum: 50, incomum: 30, raro: 14, epico: 5, lendario: 1, arcano: 0 }
/** Peso de cada raridade de carta no sorteio aleatório (Única e Promocional não saem de pacote). */
export const PESO_CARTA: Record<string, number> = { comum: 50, incomum: 25, rara: 15, ultra_rara: 6, lendaria: 3, unica: 0, promocional: 0 }

/** Escolhe um elemento pelo peso (`r` em [0,1)); nulo se nada tem peso. */
export function escolherPorPeso<T>(lista: T[], peso: (x: T) => number, r: number): T | null {
  const total = lista.reduce((s, x) => s + Math.max(0, peso(x)), 0)
  if (total <= 0) return null
  let alvo = r * total
  for (const x of lista) {
    alvo -= Math.max(0, peso(x))
    if (alvo < 0) return x
  }
  return lista[lista.length - 1]
}
