/**
 * Corporações — tipos e regras puras (o cliente pode importar). Servidor: lib/devo/corporacoes-server.ts.
 * Contrato: docs/redesign/FUNDACAO.md §14. Regras do dono: diálogo da Melissa (SISTEMAS-texto-do-dono.txt).
 */

export type CorpCargo = 'lider' | 'vice' | 'membro'
export const CORP_CARGO_ROTULO: Record<CorpCargo, string> = { lider: 'Líder', vice: 'Vice-líder', membro: 'Membro' }
export const podeDecidir = (c: CorpCargo | null | undefined) => c === 'lider' || c === 'vice'

export type CorpStatus = 'pendente' | 'ativa' | 'recusada' | 'cancelada' | 'dissolvida'
export type CorpClassificacao = 'oficial' | 'necro'
/** PROVISÓRIO ("Corporações Globais"): por enquanto só rótulo. */
export type CorpEscopo = 'local' | 'global'
export const CLASSIFICACAO_ROTULO: Record<CorpClassificacao, string> = { oficial: 'Corporação oficial', necro: 'Necro-Corporação' }
export const ESCOPO_ROTULO: Record<CorpEscopo, string> = { local: 'Local', global: 'Global' }

/* ------------------------------------------------------------------ Brasão (forma + cor da paleta) */

export const BRASAO_FORMAS = ['escudo', 'losango', 'estrela', 'sol', 'coroa', 'chave', 'lua', 'relogio', 'ampulheta', 'torre', 'cruz', 'rosa'] as const
export type BrasaoForma = (typeof BRASAO_FORMAS)[number]
export const BRASAO_FORMA_ROTULO: Record<BrasaoForma, string> = {
  escudo: 'Escudo',
  losango: 'Losango',
  estrela: 'Estrela',
  sol: 'Sol',
  coroa: 'Coroa',
  chave: 'Chave',
  lua: 'Lua',
  relogio: 'Relógio',
  ampulheta: 'Ampulheta',
  torre: 'Torre',
  cruz: 'Cruz',
  rosa: 'Rosácea',
}

/** Cores do brasão: só materiais da paleta DEVO (DIRECAO-2 §6; cosméticos podem usar vinho e noite). */
export const BRASAO_CORES = ['aco', 'porcelana', 'onix', 'ametista', 'vinho', 'noite', 'rubi', 'marfim', 'bronze', 'prata', 'cobalto', 'musgo'] as const
export type BrasaoCor = (typeof BRASAO_CORES)[number]
export const BRASAO_COR: Record<BrasaoCor, { rotulo: string; claro: string; meio: string; escuro: string; tinta: string }> = {
  aco: { rotulo: 'Aço champanhe', claro: '#ece5d8', meio: '#bab09f', escuro: '#6b6357', tinta: '#151517' },
  porcelana: { rotulo: 'Porcelana', claro: '#ffffff', meio: '#e0ddd8', escuro: '#8f8e8b', tinta: '#151517' },
  onix: { rotulo: 'Ônix', claro: '#4f4f55', meio: '#2c2c31', escuro: '#0c0c0e', tinta: '#ece5d8' },
  ametista: { rotulo: 'Ametista', claro: '#c2b9ec', meio: '#8a7cc8', escuro: '#463d78', tinta: '#f2f0ec' },
  vinho: { rotulo: 'Vinho', claro: '#8a2a33', meio: '#5c1119', escuro: '#2a0609', tinta: '#ece5d8' },
  noite: { rotulo: 'Céu noturno', claro: '#4a4760', meio: '#2b2a35', escuro: '#121118', tinta: '#cbc5e8' },
  rubi: { rotulo: 'Rubi', claro: '#d0707c', meio: '#a3121f', escuro: '#3f060b', tinta: '#f4efe6' },
  marfim: { rotulo: 'Marfim', claro: '#fbf6ea', meio: '#e6dcc4', escuro: '#a79a7c', tinta: '#2a241b' },
  bronze: { rotulo: 'Bronze velho', claro: '#c8a27a', meio: '#8a6a48', escuro: '#3b2a1a', tinta: '#f4efe6' },
  prata: { rotulo: 'Prata fria', claro: '#f1f2f5', meio: '#b8bcc6', escuro: '#5f636e', tinta: '#151517' },
  cobalto: { rotulo: 'Cobalto', claro: '#7c86c9', meio: '#3a4590', escuro: '#141a3d', tinta: '#eef0fb' },
  musgo: { rotulo: 'Musgo', claro: '#8fa08a', meio: '#4f5f4b', escuro: '#1c241b', tinta: '#eef2ea' },
}

/** Divisão do campo (heráldica): o campo em duas cores. */
export const BRASAO_DIVISOES = ['pleno', 'partido', 'cortado', 'quartelado', 'banda', 'chaveirao', 'faixa'] as const
export type BrasaoDivisao = (typeof BRASAO_DIVISOES)[number]
export const BRASAO_DIVISAO_ROTULO: Record<BrasaoDivisao, string> = {
  pleno: 'Pleno',
  partido: 'Partido',
  cortado: 'Cortado',
  quartelado: 'Quartelado',
  banda: 'Em banda',
  chaveirao: 'Chaveirão',
  faixa: 'Faixa',
}

/** Figura no centro do brasão (a inicial do nome é uma delas). */
export const BRASAO_SIMBOLOS = ['inicial', 'olho', 'chave', 'ampulheta', 'espada', 'rosa', 'lua', 'coroa', 'relogio', 'torre', 'mascara', 'estrela', 'corvo'] as const
export type BrasaoSimbolo = (typeof BRASAO_SIMBOLOS)[number]
export const BRASAO_SIMBOLO_ROTULO: Record<BrasaoSimbolo, string> = {
  inicial: 'Inicial',
  olho: 'Olho',
  chave: 'Chave',
  ampulheta: 'Ampulheta',
  espada: 'Espada',
  rosa: 'Rosa',
  lua: 'Lua',
  coroa: 'Coroa',
  relogio: 'Relógio',
  torre: 'Torre',
  mascara: 'Máscara',
  estrela: 'Estrela',
  corvo: 'Corvo',
}

/** Ornamento atrás e em volta do brasão. */
export const BRASAO_ORNAMENTOS = ['nenhum', 'louros', 'asas', 'espadas', 'correntes', 'raios'] as const
export type BrasaoOrnamento = (typeof BRASAO_ORNAMENTOS)[number]
export const BRASAO_ORNAMENTO_ROTULO: Record<BrasaoOrnamento, string> = {
  nenhum: 'Nenhum',
  louros: 'Louros',
  asas: 'Asas',
  espadas: 'Espadas cruzadas',
  correntes: 'Correntes',
  raios: 'Raios',
}

export const isBrasaoForma = (v: unknown): v is BrasaoForma => (BRASAO_FORMAS as readonly unknown[]).includes(v)
export const isBrasaoCor = (v: unknown): v is BrasaoCor => (BRASAO_CORES as readonly unknown[]).includes(v)
export const isBrasaoDivisao = (v: unknown): v is BrasaoDivisao => (BRASAO_DIVISOES as readonly unknown[]).includes(v)
export const isBrasaoSimbolo = (v: unknown): v is BrasaoSimbolo => (BRASAO_SIMBOLOS as readonly unknown[]).includes(v)
export const isBrasaoOrnamento = (v: unknown): v is BrasaoOrnamento => (BRASAO_ORNAMENTOS as readonly unknown[]).includes(v)

/**
 * Brasão: forma + cor (o básico) e, desde 23/10 (dono: "ainda muito simples"), divisão do campo com segunda cor,
 * figura no centro e ornamento em volta. Brasões antigos ficam "pleno", com a inicial e sem ornamento.
 */
export type Brasao = {
  forma: BrasaoForma
  cor: BrasaoCor
  inicial: string
  cor2?: BrasaoCor | null
  divisao?: BrasaoDivisao
  simbolo?: BrasaoSimbolo
  ornamento?: BrasaoOrnamento
}

/** Inicial do brasão: primeira letra do nome (ignora artigos curtos). */
export function inicialDe(nome: string) {
  const palavras = nome.trim().split(/\s+/).filter((p) => p.length > 2)
  const p = (palavras[0] ?? nome.trim())[0] ?? '?'
  return p.toLocaleUpperCase('pt-BR')
}

/* ------------------------------------------------------------------ Código de identificação */

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L, 2/Z, 5/S, 8/B). */
export const CODIGO_ALFABETO = 'ACDEFGHJKMNPQRTUVWXY34679'
export const CODIGO_RE = /^CRP-[ACDEFGHJKMNPQRTUVWXY34679]{4}-[ACDEFGHJKMNPQRTUVWXY34679]{4}$/

/** Normaliza o que o jogador digitou: maiúsculas, sem espaços; aceita sem o prefixo e sem hífens. */
export function normalizarCodigo(raw: unknown): string {
  const s = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const corpo = s.startsWith('CRP') ? s.slice(3) : s
  if (corpo.length !== 8) return s
  return `CRP-${corpo.slice(0, 4)}-${corpo.slice(4)}`
}

/* ------------------------------------------------------------------ Payloads */

export type CorpResumo = {
  id: string
  nome: string
  lema: string | null
  codigo: string | null
  brasao: Brasao
  classificacao: CorpClassificacao
  escopo: CorpEscopo
  membros: number
}

export type CorpMembro = {
  id: string
  personagem: string
  cargo: CorpCargo
  entrouAt: number
  eu: boolean
}

/** Partes do perfil que o líder/vice vê no pedido (lista em devo_config['corporacoes.perfil_visivel']). */
export type PerfilCandidato = {
  personagem: string
  registroDesde?: number
  deadlyVotes?: { participou: number; sobreviveu: number }
  cartas?: number
  aparencia?: { tipo: string; nome: string } | null
}

export type CorpPedido = {
  id: string
  origem: 'codigo' | 'convite'
  convidadoPor: string | null
  createdAt: number
  perfil: PerfilCandidato
}

export type CorpConviteRecebido = {
  id: string
  corporacao: CorpResumo
  de: string | null
  /** Convite de líder/vice: aceitar entra direto. De membro comum: vira pedido para o líder/vice. */
  direto: boolean
  createdAt: number
}

export type CorpTransferencia = { id: string; de: string; para: string; cardId: string; createdAt: number; minha: boolean }

export type JogoColetivo = { id: string; titulo: string; descricao: string; minMembros: number }

export type Requisito = { id: string; rotulo: string; exigido: number; atual: number; ok: boolean }

export type CriacaoInfo = {
  custo: number
  reserva: number
  maxMembros: number
  requisitos: Requisito[]
  atende: boolean
  provisorio: boolean
  /** Fundação em análise pela Companhia (ou a última recusada, com o parecer). */
  pendente: { id: string; nome: string; brasao: Brasao; createdAt: number; custo: number } | null
  recusada: { nome: string; nota: string | null; devolvido: boolean } | null
}

export type MinhaCorp = CorpResumo & {
  meuCargo: CorpCargo
  membrosLista: CorpMembro[]
  pedidos: CorpPedido[]
  convitesEnviados: { id: string; para: string; de: string | null; createdAt: number }[]
  transferencias: CorpTransferencia[]
  transferenciasHoje: number
  transferenciasPorDia: number
  rivais: { nome: string; brasao: Brasao; provisorio: boolean }[]
  maxMembros: number
}

export type CorpPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      agora: number
      apresentado: boolean
      podePular: boolean
      minha: MinhaCorp | null
      pedido: { id: string; corporacao: CorpResumo; origem: 'codigo' | 'convite'; createdAt: number } | null
      convites: CorpConviteRecebido[]
      criacao: CriacaoInfo
      regras: { titulo: string; artigos: string[]; provisorio: boolean }
      jogos: { lista: JogoColetivo[]; provisorio: boolean }
      timeDeltaMs: number
      cartasPendentes: number
    }

export type CorpLiberado = Extract<CorpPayload, { liberado: true }>

/** Mesa do Record › Corporações (Owner/Anfitrião). */
export type CorpMesa = {
  pendentes: (CorpResumo & { fundador: string; fundadorId: string | null; custo: number; lema: string | null; requisitos: Requisito[]; createdAt: number })[]
  ativas: (CorpResumo & { lider: string | null; classificacaoNota: string | null; createdAt: number })[]
  provisorio: boolean
}

export function formatMin(min: number) {
  const m = Math.max(0, Math.round(min))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} min`
  return r ? `${h}h ${String(r).padStart(2, '0')}min` : `${h}h`
}
