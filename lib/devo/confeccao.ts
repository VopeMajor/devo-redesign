/**
 * Casa › Confecção de Cartas e Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Arquivo PURO:
 * tipos, regras padrão e leitura da configuração. Quem decide é lib/devo/casa-server.ts.
 *
 * Valores do dono (fixos): materiais por raridade (5/10/15/20) e a chance por nível da mesa (50…95%).
 * Valores PROVISÓRIOS (o dono não definiu; o Owner ajusta na Mesa › Casa, devo_config 'confeccao.regras'):
 * custo em Tempo e espera de cada fabricação, custo de aprimorar a mesa e os espaços por nível.
 */
import { CARDS, getCard, RARITY_META } from './cards'
import type { Rarity } from './types'

/* ------------------------------------------------------------------ Fabricação por raridade (dono) */

/** Carta desejada → raridade e quantidade de materiais (texto do dono). */
export const RECEITA_RARIDADE: Partial<Record<Rarity, { de: Rarity; qtd: number }>> = {
  incomum: { de: 'comum', qtd: 5 },
  rara: { de: 'incomum', qtd: 10 },
  ultra_rara: { de: 'rara', qtd: 15 },
  lendaria: { de: 'ultra_rara', qtd: 20 },
}
export const ALVOS_RARIDADE = Object.keys(RECEITA_RARIDADE) as Rarity[]

/** Chance de sucesso por nível da mesa (texto do dono). Índice 0 = nível 1. */
export const CHANCE_POR_NIVEL = [50, 60, 70, 80, 90, 95] as const
export const NIVEL_MAX = CHANCE_POR_NIVEL.length

export const chanceDoNivel = (nivel: number) => CHANCE_POR_NIVEL[Math.min(NIVEL_MAX, Math.max(1, nivel)) - 1]

/* ------------------------------------------------------------------ Regras configuráveis (provisórias) */

export type CustoEspera = { minutos: number; espera: number }
export type ConfeccaoRegras = {
  /** Custo em Tempo (minutos) e espera (minutos) por raridade desejada. */
  raridade: Record<string, CustoEspera>
  /** Combinação que não corresponde a receita nenhuma (paga o Tempo, as cartas voltam). */
  experimento: CustoEspera
  /** Espaços de fabricação simultânea por nível (índice 0 = nível 1). */
  espacos: number[]
  /** Custo em Tempo (minutos) para chegar a cada nível (índice 0 = nível 2). */
  aprimorar: number[]
  /** Minutos que o pulso precisa manter depois de pagar. */
  reserva: number
}

export const REGRAS_PADRAO: ConfeccaoRegras = {
  raridade: {
    incomum: { minutos: 30, espera: 60 },
    rara: { minutos: 90, espera: 180 },
    ultra_rara: { minutos: 240, espera: 480 },
    lendaria: { minutos: 600, espera: 1440 },
  },
  experimento: { minutos: 60, espera: 120 },
  espacos: [1, 1, 2, 2, 3, 3],
  aprimorar: [180, 360, 720, 1440, 2880],
  reserva: 60,
}

const int = (v: unknown, def: number, min: number, max: number) => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def
}
const DIA = 24 * 60
const MAX_MIN = 30 * DIA

function custo(v: unknown, def: CustoEspera): CustoEspera {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  return { minutos: int(o.minutos, def.minutos, 0, MAX_MIN), espera: int(o.espera, def.espera, 0, MAX_MIN) }
}

/** Lê a configuração do Owner caindo no padrão campo a campo (nada inválido passa). */
export function lerRegras(raw: unknown): ConfeccaoRegras {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const r = (o.raridade && typeof o.raridade === 'object' ? o.raridade : {}) as Record<string, unknown>
  const lista = (v: unknown, def: number[], min: number, max: number) =>
    def.map((d, i) => (Array.isArray(v) ? int(v[i], d, min, max) : d))
  return {
    raridade: Object.fromEntries(ALVOS_RARIDADE.map((k) => [k, custo(r[k], REGRAS_PADRAO.raridade[k])])),
    experimento: custo(o.experimento, REGRAS_PADRAO.experimento),
    espacos: lista(o.espacos, REGRAS_PADRAO.espacos, 1, 6),
    aprimorar: lista(o.aprimorar, REGRAS_PADRAO.aprimorar, 0, MAX_MIN),
    reserva: int(o.reserva, REGRAS_PADRAO.reserva, 0, DIA),
  }
}

export const espacosDoNivel = (r: ConfeccaoRegras, nivel: number) => r.espacos[Math.min(NIVEL_MAX, Math.max(1, nivel)) - 1] ?? 1

/* ------------------------------------------------------------------ Receitas (combinações exatas) */

/**
 * Receita: um multiconjunto exato de cartas → uma carta específica. Ficam em devo_config 'confeccao.receitas'
 * (o Owner cria na Mesa › Casa). Nunca vão para o cliente, só as já descobertas (Livro de Receitas).
 */
export type Receita = {
  id: string
  /** Ids de carta; repetições contam (['xadrez_peao','xadrez_peao'] = dois Peões). */
  materiais: string[]
  resultado: string
  minutos: number
  espera: number
  ativa: boolean
}

export const RECEITA_MAX_MATERIAIS = 20
export const COMBINACAO_MAX = 20

const cartaExiste = (id: unknown): id is string => typeof id === 'string' && CARDS.some((c) => c.id === id)

/** Chave canônica de um multiconjunto de cartas (ordem não importa). */
export const chaveMateriais = (ids: string[]) => [...ids].sort().join('+')

export function lerReceitas(raw: unknown): Receita[] {
  if (!Array.isArray(raw)) return []
  const out: Receita[] = []
  const vistos = new Set<string>()
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const id = typeof o.id === 'string' && /^[a-z0-9_-]{2,40}$/.test(o.id) ? o.id : null
    const materiais = Array.isArray(o.materiais) ? o.materiais.filter(cartaExiste).slice(0, RECEITA_MAX_MATERIAIS) : []
    if (!id || vistos.has(id) || materiais.length < 2 || !cartaExiste(o.resultado)) continue
    vistos.add(id)
    out.push({ id, materiais, resultado: o.resultado, minutos: int(o.minutos, 60, 0, MAX_MIN), espera: int(o.espera, 120, 0, MAX_MIN), ativa: o.ativa !== false })
  }
  return out
}

/** Receita ativa que corresponde exatamente às cartas (mesmo multiconjunto), ou null. */
export function receitaDe(receitas: Receita[], cardIds: string[]): Receita | null {
  const k = chaveMateriais(cardIds)
  return receitas.find((r) => r.ativa && chaveMateriais(r.materiais) === k) ?? null
}

/** Pool do sorteio por raridade: cartas da raridade pedida (cai para a mais próxima abaixo se vazia). */
export function poolDaRaridade(r: Rarity): string[] {
  const exatas = CARDS.filter((c) => c.rarity === r).map((c) => c.id)
  if (exatas.length) return exatas
  const ord = RARITY_META[r].order
  for (let o = ord - 1; o >= 0; o--) {
    const p = CARDS.filter((c) => RARITY_META[c.rarity].order === o && !RARITY_META[c.rarity].secreta).map((c) => c.id)
    if (p.length) return p
  }
  return [CARDS[0].id]
}

export const nomeCarta = (id: string) => {
  try {
    return getCard(id).name
  } catch {
    return id
  }
}

/* ------------------------------------------------------------------ Payloads */

export type TentativaStatus = 'andamento' | 'sucesso' | 'falha' | 'sem_receita'
export type TentativaModo = 'raridade' | 'receita' | 'experimento'

export type Tentativa = {
  id: string
  modo: TentativaModo
  /** Raridade desejada (modo raridade) ou a do resultado da receita. */
  alvo: Rarity | null
  materiais: string[]
  minutos: number
  chance: number
  nivelMesa: number
  criadaEm: number
  prontaEm: number
  status: TentativaStatus
  /** Carta recebida (sucesso). */
  resultado: string | null
  /** Receita descoberta nesta tentativa (sucesso em combinação). */
  descobriu: boolean
  resolvidaEm: number | null
}

export type ReceitaConhecida = {
  id: string
  materiais: string[]
  resultado: string
  minutos: number
  espera: number
  /** Quem registrou no livro: 'voce' ou o nome do membro da Corporação. */
  por: string
  em: number
}

export type CasaPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      agora: number
      mesa: { nivel: number; chance: number; espacos: number; proximo: { nivel: number; chance: number; espacos: number; minutos: number } | null }
      regras: ConfeccaoRegras
      provisorio: boolean
      andamento: Tentativa[]
      historico: Tentativa[]
      livro: ReceitaConhecida[]
      corporacao: string | null
      pacotes: { id: string; quantidade: number }[]
      /** Cartas esperando resgate (resultado de fabricação, cartas devolvidas, pacotes). */
      cartasPendentes: number
      /** Tempo creditado pelo servidor desde a última resposta (o cliente aplica no pulso). */
      timeDeltaMs: number
      /** Owner: receitas cadastradas (para a Mesa). */
      receitas?: Receita[]
    }

export type CasaLiberado = Extract<CasaPayload, { liberado: true }>

export function formatMinutos(min: number) {
  if (min <= 0) return 'grátis'
  const d = Math.floor(min / DIA)
  const h = Math.floor((min % DIA) / 60)
  const m = min % 60
  return [d && `${d}d`, h && `${h}h`, m && `${m}min`].filter(Boolean).join(' ')
}
