/**
 * Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Arquivo PURO.
 * Um Pacote é um item do inventário (`item_defs` kind 'pacote', chave `pacote:<id>`). Chega como prêmio semanal da
 * Sala de Jogos ou por concessão do Owner (recompensa de item) e é aberto na Casa. O sorteio é do servidor.
 */
import type { Rarity } from './types'

export type PacotePremio =
  | { tipo: 'carta'; cardId: string; rotulo: string; chance: number }
  | { tipo: 'item'; item: string; rotulo: string; chance: number }
  /** Sorteado na hora: um item do catálogo pesando pela raridade (`kinds` limita os tipos; padrão: moedas, essências, chaves, fragmentos). */
  | { tipo: 'item_aleatorio'; rotulo: string; chance: number; kinds?: string[] }
  /** Sorteado na hora: uma carta de qualquer coleção, pesando pela raridade. */
  | { tipo: 'carta_aleatoria'; rotulo: string; chance: number }
  /** Resultado de um pacote de várias cartas (Iniciante, Intermediário). */
  | { tipo: 'cartas'; cartas: { cardId: string; rotulo: string }[]; rotulo: string; chance: number }

/**
 * Pacote de várias cartas: cada linha é UM sorteio; sai a primeira opção cuja faixa a rolagem cair (chances em %),
 * e o que sobra até 100% é "nada" (linha bônus). A carta de cada raridade é sorteada entre todas as cartas do jogo
 * daquela raridade (cartas novas entram sozinhas); sem carta da raridade, cai para a raridade abaixo.
 */
export type LinhaCartas = { rotulo: string; opcoes: { raridade: Rarity; qtd: number; chance: number }[] }

export type Pacote = {
  id: string
  nome: string
  /** Coleção (pacote temático) ou vazio. */
  colecao: string
  /** Texto curto no envelope (embaixo do nome). */
  selo: string
  raro: boolean
  descricao: string
  /** Prêmio único (pacote de coleção, Presente). Vazio quando o pacote tem `cartas`. */
  premios: PacotePremio[]
  cartas?: LinhaCartas[]
  provisorio?: boolean
}

export const PACOTES: Pacote[] = [
  {
    id: 'xadrez',
    nome: 'Pacote Raro: Coleção de Xadrez',
    colecao: 'Xadrez',
    selo: 'Pacote · Coleção',
    raro: true,
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
  {
    // dono (23/10): 4 comuns; 1 incomum (40%) ou uma quinta comum; +1 rara (5%)
    id: 'iniciante',
    nome: 'Pacote Iniciante',
    colecao: '',
    selo: 'Pacote',
    raro: false,
    descricao: 'Cinco cartas para começar a montar o baralho, com a chance de uma incomum e, às vezes, uma rara a mais.',
    premios: [],
    cartas: [
      { rotulo: '4 cartas comuns', opcoes: [{ raridade: 'comum', qtd: 4, chance: 100 }] },
      { rotulo: '1 carta incomum (40%) ou uma quinta comum', opcoes: [{ raridade: 'incomum', qtd: 1, chance: 40 }, { raridade: 'comum', qtd: 1, chance: 60 }] },
      { rotulo: '+1 carta rara (5%)', opcoes: [{ raridade: 'rara', qtd: 1, chance: 5 }] },
    ],
  },
  {
    // dono (23/10): 5 comuns, 3 incomuns, 1 rara; +1 rara (15%) | +2 raras (10%); +1 ultra-rara (0,5%)
    id: 'intermediario',
    nome: 'Pacote Intermediário',
    colecao: '',
    selo: 'Pacote',
    raro: true,
    descricao: 'Nove cartas com uma rara garantida, chance de raras extras e, muito de vez em quando, uma ultra-rara.',
    premios: [],
    cartas: [
      { rotulo: '5 cartas comuns', opcoes: [{ raridade: 'comum', qtd: 5, chance: 100 }] },
      { rotulo: '3 cartas incomuns', opcoes: [{ raridade: 'incomum', qtd: 3, chance: 100 }] },
      { rotulo: '1 carta rara', opcoes: [{ raridade: 'rara', qtd: 1, chance: 100 }] },
      { rotulo: '+1 carta rara (15%) ou +2 cartas raras (10%)', opcoes: [{ raridade: 'rara', qtd: 1, chance: 15 }, { raridade: 'rara', qtd: 2, chance: 10 }] },
      { rotulo: '+1 carta ultra-rara (0,5%)', opcoes: [{ raridade: 'ultra_rara', qtd: 1, chance: 0.5 }] },
    ],
  },
  {
    // dono (23/10): "Presente" é um item próprio do Poço. Conteúdo PROVISÓRIO até o dono definir.
    id: 'presente',
    nome: 'Presente',
    colecao: '',
    selo: 'Presente',
    raro: false,
    descricao: 'Um embrulho que o poço devolveu. Só abrindo para saber o que tem dentro.',
    provisorio: true,
    premios: [
      { tipo: 'item_aleatorio', rotulo: 'Item aleatório (moedas, chaves, fragmentos)', chance: 60, kinds: ['moeda', 'chave', 'fragmento'] },
      { tipo: 'carta_aleatoria', rotulo: 'Carta aleatória de qualquer coleção', chance: 40 },
    ],
  },
]

/** Sorteia as linhas de um pacote de cartas (`r` devolve [0,1)): lista de (raridade, quantidade) que saíram. */
export function sortearLinhas(p: Pacote, r: () => number): { raridade: Rarity; qtd: number }[] {
  const out: { raridade: Rarity; qtd: number }[] = []
  for (const l of p.cartas ?? []) {
    let alvo = r() * 100
    for (const o of l.opcoes) {
      if (alvo < o.chance) {
        out.push({ raridade: o.raridade, qtd: o.qtd })
        break
      }
      alvo -= o.chance
    }
  }
  return out
}

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
