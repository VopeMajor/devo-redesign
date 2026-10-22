/**
 * Virtudes e Pontos de Potencial (DIRECAO-3 §2; docs/redesign/VIRTUDES.md). Arquivo PURO: tipos, nomes,
 * textos do dono, rótulos qualitativos e a conta da Evolução de Estágio (o servidor usa; o cliente só lê os
 * rótulos). Regra do dono: "NÃO É PRECISO SE PREOCUPAR COM OS NÚMEROS… O BOT É O ÚNICO QUEM CUIDA DESSAS
 * INFORMAÇÕES" → nada de multiplicador, P.P. ou teto no payload do jogador; só direção e rótulos.
 */
import type { ArcanoTextoCfg } from './arcanos-textos'
import padrao from './virtudes-afinidades.json'

export const VIRTUDE_KEYS = ['paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos'] as const
export type VirtudeKey = (typeof VIRTUDE_KEYS)[number]
export const isVirtude = (v: unknown): v is VirtudeKey => (VIRTUDE_KEYS as readonly unknown[]).includes(v)

/** Textos do doc do dono, literais (só cortados em frases). `antiga` = os dois naipes de baralhos antigos. */
export const VIRTUDES: Record<VirtudeKey, { nome: string; antiga: boolean; texto: string }> = {
  paus: { nome: 'Paus', antiga: false, texto: 'Aumenta sua resistência e vigor.' },
  copas: { nome: 'Copas', antiga: false, texto: 'Seu corpo, melhorando força e velocidade.' },
  ouros: { nome: 'Ouros', antiga: false, texto: 'Aprimorando sua mente, seja lá o que isso signifique.' },
  espadas: { nome: 'Espadas', antiga: false, texto: 'Aumenta seus reflexos e capacidade motora.' },
  tacas: { nome: 'Taças', antiga: true, texto: 'Dizem que aumenta seu domínio sobrenatural.' },
  escudos: { nome: 'Escudos', antiga: true, texto: 'Dizem que aumenta sua influência.' },
}

/** Trechos do doc usados na tela (literais). */
export const TEXTOS_VIRTUDES = {
  abertura:
    'As Seis Virtudes são uma série de caminhos que um indivíduo pode seguir em busca de autoaprimoramento, adquirindo capacidades especiais físicas, mentais e até espirituais.',
  naipes:
    'Elas são representadas pelos quatro naipes originais de um baralho — Paus, Ouros, Copas e Espadas — além de outros dois, menos conhecidos e originados de baralhos antigos: Taças e Escudos.',
  misterio: 'O que cada Virtude faz exatamente é um mistério, mas existem certas bases claras.',
  antigas: 'Os outros dois extras são ainda mais vagos.',
  antigasFim: 'Ainda assim, é um total mistério que o atual nível de informação não te permite entender totalmente.',
  potencial:
    'Eles aumentam sistematicamente com base nos jogos que você participa e no tipo de coisas que faz. Quando chega o momento de Evolução de Estágio, seu corpo reconstrói, e a porcentagem se espalha entre os atributos, mostrando qual evoluiu mais e qual evoluiu menos.',
  controle: 'Se não entendeu, apenas saiba que seus atributos mudam por estágio, e você não está no controle disso.',
  metamorfose: 'É como metamorfose. Você recolhe nutrientes o suficiente para passar pela transformação, e quanto mais você coleta, melhor.',
  limite: 'Contudo, há um limite claro que te impede de coletar demais. Um limite definido pelo Estágio.',
  fecho: 'Seja um destaque naquilo que faz de melhor e não se compare aos outros.',
} as const

/**
 * Os 22 Arcanos maiores, na numeração do tarô de Marselha (Justiça VIII, Força XI: o dono, 22/10, "a 11ª (XI)
 * carta"). O numeral sai da posição na lista. Chaves estáveis: `imperador` é o Arcano do Galo.
 */
export const ARCANOS = [
  ['louco', 'Arcano do Louco'],
  ['mago', 'Arcano do Mago'],
  ['sacerdotisa', 'Arcano da Sacerdotisa'],
  ['imperatriz', 'Arcano da Imperatriz'],
  ['imperador', 'Arcano do Imperador'],
  ['hierofante', 'Arcano do Hierofante'],
  ['enamorados', 'Arcano dos Enamorados'],
  ['carro', 'Arcano do Carro'],
  ['justica', 'Arcano da Justiça'],
  ['eremita', 'Arcano do Eremita'],
  ['fortuna', 'Arcano da Roda da Fortuna'],
  ['forca', 'Arcano da Força'],
  ['enforcado', 'Arcano do Enforcado'],
  ['morte', 'Arcano da Morte'],
  ['temperanca', 'Arcano da Temperança'],
  ['diabo', 'Arcano do Diabo'],
  ['torre', 'Arcano da Torre'],
  ['estrela', 'Arcano da Estrela'],
  ['lua', 'Arcano da Lua'],
  ['sol', 'Arcano do Sol'],
  ['julgamento', 'Arcano do Julgamento'],
  ['mundo', 'Arcano do Mundo'],
] as const
export type ArcanoKey = (typeof ARCANOS)[number][0]
export const ARCANO_KEYS = ARCANOS.map((a) => a[0]) as ArcanoKey[]
export const isArcano = (v: unknown): v is ArcanoKey => (ARCANO_KEYS as unknown[]).includes(v)
const NUMERAIS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
export function arcanoInfo(key: ArcanoKey) {
  const i = ARCANO_KEYS.indexOf(key)
  return { key, titulo: ARCANOS[i][1], numeral: NUMERAIS[i] }
}
export type ArcanoInfo = ReturnType<typeof arcanoInfo>

/* ------------------------------------------------------------------ Estágios 0..VII (dono, 22/10) */

/** Último Estágio. O 0 ("A Essência") vem com o Arcano; do I ao VII paga-se em Fragmentos Arcanos. */
export const ESTAGIO_MAX = 7
/** Fragmentos Arcanos para CHEGAR a cada Estágio (índice = Estágio). O 0 não se compra. */
export const CUSTO_ESTAGIO = [0, 25, 50, 100, 200, 400, 800, 1600] as const
export const ITEM_FRAGMENTO = 'fragmento_arcano'
export const ITEM_GRANDE_FRAGMENTO = 'grande_fragmento_arcano'
/** Custo para ir do Estágio `atual` ao seguinte (null no último). */
export function custoDoProximo(atual: number): number | null {
  return atual >= ESTAGIO_MAX ? null : CUSTO_ESTAGIO[Math.max(0, atual) + 1]
}
/** Numeral do Estágio: "0" para a Essência, romano do I em diante. */
export function numeralEstagio(n: number): string {
  return n <= 0 ? '0' : NUMERAIS[Math.min(n, NUMERAIS.length - 1)]
}

/* ------------------------------------------------------------------ Afinidade (qualitativa) */

export type Afinidade = 'excelente' | 'favorecida' | 'regular' | 'dificil' | 'deficiente'
export const AFINIDADE_ROTULO: Record<Afinidade, string> = {
  excelente: 'Excelente',
  favorecida: 'Favorecida',
  regular: 'Regular',
  dificil: 'Difícil',
  deficiente: 'Deficiente',
}
/** Ordem 1..6 da tabela do dono → rótulo. 1 = excelente, 6 = deficiente, as quatro do meio em três graus. */
export function afinidadeDaOrdem(ordem: number): Afinidade {
  if (ordem <= 1) return 'excelente'
  if (ordem === 2) return 'favorecida'
  if (ordem <= 4) return 'regular'
  if (ordem === 5) return 'dificil'
  return 'deficiente'
}

/* ------------------------------------------------------------------ Configuração (Owner) */

export type OrdemArcano = Record<VirtudeKey, number>
export type AfinidadesConfig = {
  fonte?: string
  /** Multiplicadores por posição (1º..6º). SÓ no servidor e na Mesa. */
  escala: number[]
  ordem: Record<string, OrdemArcano>
  /** Divergências do doc: `confirmar` = precisa do dono; `confirmado` = o Owner já conferiu. */
  divergencias: Record<string, { confirmar: boolean; nota: string; confirmado?: boolean }>
}
export type EstagioLimite = { estagio: number; minimo: number; teto: number }
export type EstagiosConfig = { padrao: EstagioLimite[]; porArcano: Record<string, EstagioLimite[]> }
export type EvolucaoConfig = { peso_direcao: number; fragmentos: number }

export const AFINIDADES_PADRAO = padrao as AfinidadesConfig
/** Teto de P.P. por Estágio (0..; além da última linha vale a última). O mínimo ficou só de referência. */
export const ESTAGIOS_PADRAO: EstagiosConfig = {
  padrao: [
    { estagio: 0, minimo: 30, teto: 100 },
    { estagio: 1, minimo: 60, teto: 160 },
    { estagio: 2, minimo: 100, teto: 240 },
    { estagio: 3, minimo: 150, teto: 340 },
    { estagio: 4, minimo: 210, teto: 460 },
  ],
  porArcano: {},
}
export const EVOLUCAO_PADRAO: EvolucaoConfig = { peso_direcao: 0.35, fragmentos: 0 }

/** A linha é uma permutação de 1..6 (uma excelente, uma deficiente, as outras no meio)? */
export function ordemValida(o: unknown): o is OrdemArcano {
  if (!o || typeof o !== 'object') return false
  const vals = VIRTUDE_KEYS.map((v) => (o as Record<string, unknown>)[v])
  return vals.every((n) => Number.isInteger(n)) && [...(vals as number[])].sort().join() === '1,2,3,4,5,6'
}

/**
 * Limites de P.P. do Estágio para o Arcano (override por Arcano; senão o padrão). Vale a linha mais alta que não
 * passa do Estágio (abaixo da primeira, a primeira). `ultimo` = Estágio VII (mesma conta de devo_virtude_limite).
 */
export function limitesDoEstagio(cfg: EstagiosConfig, arcano: string | null, estagio: number): EstagioLimite & { ultimo: boolean } {
  const tabela = (arcano && cfg.porArcano?.[arcano]?.length ? cfg.porArcano[arcano] : cfg.padrao) ?? ESTAGIOS_PADRAO.padrao
  const ord = [...(tabela.length ? tabela : ESTAGIOS_PADRAO.padrao)].sort((a, b) => a.estagio - b.estagio)
  const l = [...ord].reverse().find((x) => x.estagio <= estagio) ?? ord[0]
  return { ...l, estagio, ultimo: estagio >= ESTAGIO_MAX }
}

/* ------------------------------------------------------------------ Evolução de Estágio */

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * Distribui o total acumulado do Estágio entre as seis Virtudes. Quem manda é a afinidade do Arcano
 * (multiplicador da posição); `pesoDirecao` (0..1) deixa o tipo de esforço do jogador (para onde os P.P.
 * foram) inclinar um pouco. Peso_i = mult_i × ((1 − d) + d × 6 × fatia_i). Soma dos ganhos = total.
 * O jogador não controla: só o servidor chama.
 */
export function distribuir(total: number, ordem: OrdemArcano, escala: number[], acumulado: Partial<Record<VirtudeKey, number>>, pesoDirecao: number): Record<VirtudeKey, number> {
  const d = Math.min(1, Math.max(0, pesoDirecao))
  const soma = VIRTUDE_KEYS.reduce((s, v) => s + Math.max(0, acumulado[v] ?? 0), 0)
  const pesos = VIRTUDE_KEYS.map((v) => {
    const mult = escala[Math.min(escala.length, Math.max(1, ordem[v])) - 1] ?? 0
    const fatia = soma > 0 ? Math.max(0, acumulado[v] ?? 0) / soma : 1 / 6
    return mult * (1 - d + d * 6 * fatia)
  })
  const pt = pesos.reduce((s, p) => s + p, 0) || 1
  const out = Object.fromEntries(VIRTUDE_KEYS.map((v, i) => [v, r2((total * pesos[i]) / pt)])) as Record<VirtudeKey, number>
  // resto do arredondamento vai para a de maior peso
  const resto = r2(total - VIRTUDE_KEYS.reduce((s, v) => s + out[v], 0))
  if (resto) {
    const top = VIRTUDE_KEYS[pesos.indexOf(Math.max(...pesos))]
    out[top] = r2(out[top] + resto)
  }
  return out
}

/* ------------------------------------------------------------------ Acúmulo (qualitativo) */

export type Acumulo = { nivel: 0 | 1 | 2 | 3 | 4; rotulo: string; pronto: boolean; cheio: boolean }
export function acumuloQualitativo(total: number, minimo: number, teto: number): Acumulo {
  const f = teto > 0 ? total / teto : 0
  const cheio = teto > 0 && total >= teto
  const nivel = (f <= 0.08 ? 0 : f < 0.35 ? 1 : f < 0.65 ? 2 : f < 0.9 ? 3 : 4) as Acumulo['nivel']
  const rotulo = cheio ? 'No limite do Estágio' : ['Quase nada acumulado', 'Pouco acumulado', 'Acumulando', 'Muito acumulado', 'Perto do limite'][nivel]
  return { nivel, rotulo, pronto: total >= minimo && total > 0, cheio }
}

/* ------------------------------------------------------------------ Payloads */

export type VirtudeVista = { key: VirtudeKey; nome: string; antiga: boolean; texto: string; afinidade: Afinidade | null }
/**
 * Um Arcano na lista "Os vinte e dois". Trancado (o jogador não tem): SÓ key, numeral, título e a frase breve.
 * Os que o jogador tem (e todos, para Owner/Anfitrião) trazem `detalhe`; `posse` diz o Estágio daquele Arcano e
 * se é o original (`proprio`, o que define as Virtudes). Estágios futuros vêm só com o nome (sem `linha` nem
 * `texto`) para quem não é da equipe. `revelado: false` = o dono ainda não escreveu (nome vazio).
 * `provisorio` só vai para o Owner.
 */
export type EstagioVista = { numero: number; nome: string; revelado: boolean; linha?: string; texto?: string; estado: 'passado' | 'atual' | 'futuro' | 'aberto' }
export type PosseArcano = { estagio: number; original: boolean }
export type ArcanoVista = {
  key: ArcanoKey
  numeral: string
  titulo: string
  breve: string
  proprio?: true
  posse?: PosseArcano
  provisorio?: boolean
  detalhe?: { descricao: string; fisiologia: string; excelente: VirtudeKey | null; deficiente: VirtudeKey | null; estagios: EstagioVista[] }
}

/** `maisCresceu`/`menosCresceu` null = não havia P.P. para espalhar naquela Evolução. */
export type EvolucaoVista = { at: number; de: number; para: number; arcano: string | null; maisCresceu: VirtudeKey | null; menosCresceu: VirtudeKey | null }

/** GET /api/virtudes (jogador). Sem números de P.P., multiplicadores, teto ou mínimo. */
export type VirtudesPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      arcano: ArcanoInfo | null
      estagio: number
      ultimoEstagio: boolean
      virtudes: VirtudeVista[]
      acumulo: Acumulo
      /** Para onde o esforço do Estágio tem pendido (a Virtude que mais recebeu), sem quantificar. */
      tendencia: VirtudeKey | null
      evolucoes: EvolucaoVista[]
      /** Os 22 Arcanos, na ordem do tarô. */
      arcanos: ArcanoVista[]
      /** Saldo de Fragmentos Arcanos (pagam os Estágios) e de Grandes Fragmentos (despertam outro Arcano). */
      fragmentos: number
      grandesFragmentos: number
      /** Owner/Anfitrião: todos expansíveis. */
      verTodos: boolean
    }

export type MesaJogador = {
  id: string
  nome: string
  arcano: ArcanoKey | null
  estagio: number
  /** Todos os Arcanos que o jogador tem, cada um com o seu Estágio (o original primeiro). */
  arcanos: { key: ArcanoKey; estagio: number; original: boolean; origem: string | null }[]
  fragmentos: number
  grandesFragmentos: number
  pp: Record<VirtudeKey, number>
  total: number
  minimo: number
  teto: number
  ultimoEstagio: boolean
  nivel: Record<VirtudeKey, number>
  evolucoes: { at: number; de: number; para: number; total: number; ganhos: Record<VirtudeKey, number>; por: string | null }[]
  isTest: boolean
}

/** GET /api/virtudes?view=mesa (Owner/Anfitrião). Aqui os números aparecem. */
export type VirtudesMesa = {
  podeEvoluir: boolean
  podeEditar: boolean
  jogadores: MesaJogador[]
  config: {
    afinidades: AfinidadesConfig
    afinidadesProvisorio: boolean
    estagios: EstagiosConfig
    estagiosProvisorio: boolean
    evolucao: EvolucaoConfig
    /** Textos dos Arcanos em vigor (rascunho do código ou editado). Só vem para o Owner. */
    arcanos?: Record<string, ArcanoTextoCfg & { editado: boolean }>
  }
}

/** Evolução de Estágio. `total`/`ganhos` só vêm para a equipe (o jogador não vê números de P.P.). */
export type EvolucaoResultado = { ok: true; arcano: ArcanoKey; de: number; para: number; original: boolean; total?: number; ganhos?: Record<VirtudeKey, number> }
/** Resposta do jogador ao evoluir ou despertar (sem P.P.). */
export type ArcanoAcaoResultado = { ok: true; arcano: ArcanoKey; estagio: number; fragmentos: number; grandesFragmentos: number; jaFeito?: boolean }
