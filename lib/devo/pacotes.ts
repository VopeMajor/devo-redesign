/**
 * Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Arquivo PURO.
 * Um Pacote é um item do inventário (`item_defs` kind 'pacote', chave `pacote:<id>`). Chega como prêmio semanal da
 * Sala de Jogos ou por concessão do Owner (recompensa de item) e é aberto na Casa. O sorteio é do servidor.
 */
export type PacotePremio =
  | { tipo: 'carta'; cardId: string; rotulo: string; chance: number }
  | { tipo: 'item'; item: string; rotulo: string; chance: number }

export type Pacote = { id: string; nome: string; colecao: string; descricao: string; premios: PacotePremio[] }

export const PACOTES: Pacote[] = [
  {
    id: 'xadrez',
    nome: 'Pacote Raro: Coleção de Xadrez',
    colecao: 'Xadrez',
    descricao: 'Um pacote dedicado a cartas inspiradas no xadrez. Elegante, estratégico e genial — uma coleção digna de quem sabe jogar muito além do tabuleiro.',
    premios: [
      { tipo: 'carta', cardId: 'xadrez_peao', rotulo: 'Peão (Carta Incomum)', chance: 35 },
      { tipo: 'carta', cardId: 'xadrez_bispo', rotulo: 'Bispo (Carta Rara)', chance: 14 },
      { tipo: 'carta', cardId: 'xadrez_torre', rotulo: 'Torre (Carta Rara)', chance: 14 },
      { tipo: 'carta', cardId: 'xadrez_cavalo', rotulo: 'Cavalo (Carta Rara)', chance: 14 },
      { tipo: 'carta', cardId: 'xadrez_rei', rotulo: 'Rei (Carta Rara)', chance: 12 },
      { tipo: 'carta', cardId: 'xadrez_rainha', rotulo: 'Rainha (Carta Ultra-Rara)', chance: 3 },
      { tipo: 'carta', cardId: 'xadrez_tabuleiro', rotulo: 'Tabuleiro de Xadrez (Carta Ultra-Rara)', chance: 3 },
      { tipo: 'item', item: 'estetico:molde_xadrez', rotulo: 'Molde de Xadrez (Item Estético)', chance: 5 },
    ],
  },
]

export const PACOTES_TEXTO =
  'Pacotes são itens de luxo que oferecem uma chance bastante elevada de obter cartas. Geralmente, estão associados a uma coleção específica, com temática própria e recompensas possíveis detalhadas em seu respectivo centro de informações.'

export const getPacote = (id: string) => PACOTES.find((p) => p.id === id) ?? null
export const itemDoPacote = (id: string) => `pacote:${id}`

/** Sorteia um prêmio pela tabela (`r` em [0,1)). As chances somam 100. */
export function sortearPremio(p: Pacote, r: number): PacotePremio {
  const total = p.premios.reduce((s, x) => s + x.chance, 0)
  let alvo = r * total
  for (const x of p.premios) {
    alvo -= x.chance
    if (alvo < 0) return x
  }
  return p.premios[p.premios.length - 1]
}
