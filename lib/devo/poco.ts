/**
 * Poço dos Milagres — tipos, dados e regras PURAS (cliente e servidor importam).
 * O sorteio em si mora no servidor (lib/devo/poco-server.ts); aqui ficam o formato das respostas, a lista de
 * "lixo" (resultados que não vão ao inventário), o modelo do minigame da manivela (o cliente desenha o mesmo
 * ponteiro que o servidor usa para conferir os toques) e o ajuste de pesos pela manivela.
 *
 * Probabilidades e números do minigame: devo_config ('poco.probabilidades', 'poco.manivela',
 * 'poco.quantidades', 'poco.raridade_pesos', 'poco.giro_gratis_diario') — PROVISÓRIOS até o dono definir.
 */
import type { ItemKind, ItemRarity } from './progresso'

export const POCO_CATEGORIAS = ['lixo', 'capsula', 'fragmento', 'essencia', 'cosmetico'] as const
export type PocoCategoria = (typeof POCO_CATEGORIAS)[number]

export const CATEGORIA_LABEL: Record<PocoCategoria, string> = {
  lixo: 'Nada de valor',
  capsula: 'Cápsula do tempo',
  fragmento: 'Fragmento de arcano',
  essencia: 'Essência de afinidade',
  cosmetico: 'Item estético',
}

/** Categoria de um RESULTADO: as da configuração + 'premio' (prêmio do Owner no pool do Poço). */
export type PocoCategoriaResultado = PocoCategoria | 'premio'
export const CATEGORIA_RESULTADO_LABEL: Record<PocoCategoriaResultado, string> = { ...CATEGORIA_LABEL, premio: 'Prêmio do Poço' }

/** Pesos relativos por categoria (não são porcentagens finais). */
export type PocoPesos = Record<PocoCategoria, number>

/** Configuração do minigame (devo_config 'poco.manivela'). */
export type ManivelaConfig = {
  max_acertos: number
  reducao_lixo_por_acerto: number
  janelas: number[]
  periodos_ms: number[]
  fator_lento: number
  rodada_max_ms: number
}

export const MANIVELA_PADRAO: ManivelaConfig = {
  max_acertos: 5,
  reducao_lixo_por_acerto: 0.08,
  janelas: [0.26, 0.2, 0.155, 0.12, 0.09],
  periodos_ms: [1900, 1650, 1450, 1280, 1140],
  fator_lento: 1.6,
  rodada_max_ms: 9000,
}

/**
 * Resultados "lixo": aparecem no balde e somem (não vão ao inventário). Lista editável (dados), com textos
 * provisórios até o dono revisar.
 */
export const POCO_LIXO: { id: string; nome: string; texto: string }[] = [
  { id: 'agua_suja', nome: 'Água suja', texto: 'Um balde de água turva. Tem algo se mexendo no fundo, mas você prefere não saber.' },
  { id: 'pedra', nome: 'Uma pedra', texto: 'Lisa, fria e profundamente comum. O poço achou que você precisava de uma.' },
  { id: 'tampao', nome: 'Tampão de lixo', texto: 'A tampa de uma lixeira. O cheiro veio junto, de brinde.' },
  { id: 'curativo', nome: 'Curativo usado', texto: 'Ainda grudento. Alguém se machucou tentando a sorte antes de você.' },
  { id: 'meia', nome: 'Meia sem par', texto: 'O par está em algum lugar por aí, provavelmente mais feliz.' },
  { id: 'dente', nome: 'Um dente', texto: 'Não é seu. Pelo menos você espera que não seja.' },
  { id: 'boleto', nome: 'Boleto vencido', texto: 'Nem o poço quis pagar.' },
  { id: 'chiclete', nome: 'Chiclete mascado', texto: 'Ainda tem um resto de gosto de morango. Infelizmente.' },
  { id: 'tampa', nome: 'Tampa de garrafa', texto: 'Alguém já tentou a sorte com isto antes de você.' },
  { id: 'chave_torta', nome: 'Chave torta', texto: 'Não abre nada. Talvez já tenha aberto, um dia.' },
  { id: 'nada', nome: 'Nada', texto: 'O balde volta vazio, pingando. O poço ficou com a moeda.' },
]

export const lixoPorId = (id: string | null | undefined) => POCO_LIXO.find((l) => l.id === id) ?? POCO_LIXO[0]

/* ------------------------------------------------------------------ Minigame da manivela */

/**
 * Uma rodada: o ponteiro vai e volta no mostrador (0 → 1 → 0) com `periodo` ms por volta completa, começando
 * na `fase` (0..1). Acerta quem toca com o ponteiro dentro da janela [centro − janela/2, centro + janela/2].
 */
export type ManivelaRodada = { centro: number; janela: number; periodo: number; fase: number }
export type ManivelaParams = { rodadas: ManivelaRodada[]; rodadaMaxMs: number; lento: boolean }

/** Onda triangular 0..1..0. */
function tri(x: number) {
  const f = x - Math.floor(x)
  return 1 - Math.abs(2 * f - 1)
}

/** Posição do ponteiro (0..1) `ms` depois do início da rodada. */
export function ponteiro(r: ManivelaRodada, ms: number) {
  return tri(ms / r.periodo + r.fase)
}

export function dentroDaJanela(r: ManivelaRodada, pos: number) {
  return Math.abs(pos - r.centro) <= r.janela / 2
}

/**
 * Conta os acertos a partir dos instantes dos toques (ms desde o início do minigame). Cada rodada começa no
 * toque anterior; um erro (ou demora maior que `rodadaMaxMs`) encerra. O servidor usa ESTA função para
 * conferir — o cliente só manda os instantes, nunca o número de acertos.
 */
export function avaliarToques(p: ManivelaParams, toques: number[]): number {
  let inicio = 0
  let acertos = 0
  for (let i = 0; i < toques.length && i < p.rodadas.length; i++) {
    const rel = toques[i] - inicio
    if (!(rel >= 0) || rel > p.rodadaMaxMs) break
    const r = p.rodadas[i]
    if (!dentroDaJanela(r, ponteiro(r, rel))) break
    acertos++
    inicio = toques[i]
  }
  return acertos
}

/** Toques válidos: até `max` números finitos, crescentes, ≥ 0. */
export function toquesValidos(v: unknown, max: number): number[] | null {
  if (!Array.isArray(v) || v.length > max) return null
  const out: number[] = []
  for (const x of v) {
    const n = Number(x)
    if (!Number.isFinite(n) || n < 0 || n > 600_000) return null
    if (out.length && n < out[out.length - 1]) return null
    out.push(Math.round(n))
  }
  return out
}

/** Fator da manivela sobre o lixo (e sobre os prêmios-lixo do Owner): 1 sem acertos, nunca abaixo de 0,05. */
export function fatorManivela(acertos: number, cfg: ManivelaConfig) {
  const a = Math.max(0, Math.min(cfg.max_acertos, Math.floor(acertos)))
  return Math.max(0.05, 1 - a * cfg.reducao_lixo_por_acerto)
}

/** Pesos efetivos: cada acerto reduz o peso do lixo (o resto fica como está). Nunca zera o lixo por completo. */
export function aplicarManivela(pesos: PocoPesos, acertos: number, cfg: ManivelaConfig): PocoPesos {
  const a = Math.max(0, Math.min(cfg.max_acertos, Math.floor(acertos)))
  const fator = Math.max(0.05, 1 - a * cfg.reducao_lixo_por_acerto)
  return { ...pesos, lixo: pesos.lixo * fator }
}

/** Normaliza pesos lidos da configuração (valores inválidos viram 0). */
export function lerPesos(raw: unknown): PocoPesos | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const out = {} as PocoPesos
  let total = 0
  for (const c of POCO_CATEGORIAS) {
    const n = Number(o[c] ?? 0)
    out[c] = Number.isFinite(n) && n > 0 ? n : 0
    total += out[c]
  }
  return total > 0 ? out : null
}

/** Categoria sorteada por uma rolagem uniforme [0, 1). */
export function categoriaPorRolagem(pesos: PocoPesos, rolagem: number): PocoCategoria {
  const total = POCO_CATEGORIAS.reduce((s, c) => s + pesos[c], 0)
  let alvo = rolagem * total
  for (const c of POCO_CATEGORIAS) {
    if (alvo < pesos[c]) return c
    alvo -= pesos[c]
  }
  return 'lixo'
}

/* ------------------------------------------------------------------ Prêmios do Owner (pool do Poço) */

export const PREMIO_TIPOS = ['item', 'carta', 'tempo', 'lixo'] as const
export type PremioTipo = (typeof PREMIO_TIPOS)[number]
export const PREMIO_TIPO_LABEL: Record<PremioTipo, string> = { item: 'Item do catálogo', carta: 'Carta', tempo: 'Tempo', lixo: 'Prêmio lixo' }

/** Prêmio do pool (resposta da Mesa do Owner). O peso está na MESMA unidade dos pesos de categoria. */
export type PocoPremio = {
  id: string
  tipo: PremioTipo
  itemKey: string | null
  cardId: string | null
  minutos: number | null
  quantidade: number
  nome: string
  descricao: string | null
  imagem: string | null
  raridade: ItemRarity
  peso: number
  /** Moedas em que o prêmio entra (vazio = todas). */
  moedas: string[]
  estoque: number | null
  entregues: number
  ativo: boolean
}

/** O que o sorteio precisa saber de um prêmio elegível. */
export type PremioPeso = { id: string; peso: number; lixo: boolean }

/** Prêmio entra nesta moeda? (ativo, moeda na lista ou lista vazia, estoque sobrando). */
export function premioElegivel(p: Pick<PocoPremio, 'ativo' | 'moedas' | 'estoque' | 'entregues'>, moeda: string) {
  return p.ativo && (p.moedas.length === 0 || p.moedas.includes(moeda)) && (p.estoque === null || p.entregues < p.estoque)
}

/**
 * Sorteio único sobre categorias + prêmios (uma rolagem uniforme [0, 1)). Os prêmios-lixo levam o mesmo fator
 * da manivela que o lixo (`fatorLixo`); os pesos de categoria já chegam com a manivela aplicada.
 */
export function sortearComPremios(
  pesos: PocoPesos,
  premios: PremioPeso[],
  rolagem: number,
  fatorLixo = 1,
): { tipo: 'categoria'; categoria: PocoCategoria } | { tipo: 'premio'; id: string } {
  const ps = premios.filter((p) => p.peso > 0).map((p) => ({ id: p.id, w: p.peso * (p.lixo ? fatorLixo : 1) }))
  const totalCat = POCO_CATEGORIAS.reduce((s, c) => s + pesos[c], 0)
  const total = totalCat + ps.reduce((s, p) => s + p.w, 0)
  let alvo = rolagem * total
  for (const c of POCO_CATEGORIAS) {
    if (alvo < pesos[c]) return { tipo: 'categoria', categoria: c }
    alvo -= pesos[c]
  }
  for (const p of ps) {
    if (alvo < p.w) return { tipo: 'premio', id: p.id }
    alvo -= p.w
  }
  return { tipo: 'categoria', categoria: 'lixo' }
}

export type LinhaChance = { chave: string; nome: string; pct: number; premio: boolean }

/**
 * Tabela de chances (sem manivela) de uma moeda: categorias + prêmios, em % com 1 casa, somando EXATAMENTE
 * 100,0 (maior resto). Mesma conta no servidor (jogador) e na Mesa (prévia antes de salvar).
 */
export function tabelaChances(pesos: PocoPesos, premios: { id: string; nome: string; peso: number }[]): LinhaChance[] {
  const linhas = [
    ...POCO_CATEGORIAS.filter((c) => pesos[c] > 0).map((c) => ({ chave: c, nome: CATEGORIA_LABEL[c], w: pesos[c], premio: false })),
    ...premios.filter((p) => p.peso > 0).map((p) => ({ chave: `premio:${p.id}`, nome: p.nome, w: p.peso, premio: true })),
  ]
  const total = linhas.reduce((s, l) => s + l.w, 0)
  if (total <= 0) return []
  const brutos = linhas.map((l) => (l.w / total) * 1000)
  const base = brutos.map(Math.floor)
  let falta = 1000 - base.reduce((a, b) => a + b, 0)
  const ordem = brutos.map((b, i) => [b - Math.floor(b), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of ordem) {
    if (falta <= 0) break
    base[i]++
    falta--
  }
  return linhas.map((l, i) => ({ chave: l.chave, nome: l.nome, pct: base[i] / 10, premio: l.premio }))
}

/** Texto seguro para nome/descrição de prêmio: sem marcação, sem caracteres de controle, espaços normalizados. */
export function textoPremioValido(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t || t.length > max) return null
  if (/[<>]|javascript:|data:|&#|\bon[a-z]+\s*=/i.test(t)) return null
  return t
}

/** Imagem de prêmio: asset enviado pelo Owner (mesma validação dos cosméticos) ou arte do repositório. */
export function imagemPremioValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  if (/^\/api\/cosmeticos\?view=asset&id=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return v
  if (/^\/images\/poco\/[a-z0-9_\-/]{1,80}\.webp$/.test(v) && !v.includes('..')) return v
  return null
}

/** Porcentagens (para o painel do Owner). */
export function porcentagens(pesos: PocoPesos): Record<PocoCategoria, number> {
  const total = POCO_CATEGORIAS.reduce((s, c) => s + pesos[c], 0) || 1
  return Object.fromEntries(POCO_CATEGORIAS.map((c) => [c, (pesos[c] / total) * 100])) as Record<PocoCategoria, number>
}

/* ------------------------------------------------------------------ Respostas da API */

export type PocoMoeda = {
  key: string
  nome: string
  descricao: string | null
  raridade: ItemRarity
  quantidade: number
  /** A categoria tem probabilidades configuradas (senão a moeda ainda não pode ser lançada). */
  categoriaAtiva: boolean
}

export type PocoBalde = {
  id: string
  nome: string
  descricao: string | null
  efeito: string
  tipo: 'inicial' | 'normal' | 'raro'
  raridade: ItemRarity
  possui: boolean
  provisorio: boolean
}

export type PocoGiroAberto = {
  id: string
  moeda: string
  moedaNome: string
  gratis: boolean
  estado: 'lancado' | 'girando' | 'girado'
  seedHash: string
  balde: string
}

export type PocoLetreiro = { nome: string; item: string; raridade: ItemRarity; categoria: PocoCategoriaResultado; quando: number }

export type PocoOwner = {
  provisorio: boolean
  nota: string | null
  probabilidades: Record<string, PocoPesos>
  manivela: ManivelaConfig
}

export type PocoPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      apresentado: boolean
      /** Owner/Anfitrião (ou quem já viu): pode pular a cena. */
      podePular: boolean
      moedas: PocoMoeda[]
      giroGratis: { disponivel: boolean; restantes: number; categoria: string; proximoEm: number }
      baldes: PocoBalde[]
      baldeAtual: string
      aberto: PocoGiroAberto | null
      letreiro: PocoLetreiro[]
      /**
       * Faixa de prêmios: além dos reais (`letreiro`), a tela mostra de tempos em tempos prêmios SIMULADOS com
       * nomes fictícios (pedido do dono). Os nomes já vêm filtrados contra todas as contas e personagens reais.
       */
      simulacao: { nomes: string[]; itens: { item: string; raridade: ItemRarity; categoria: PocoCategoria }[] }
      /** Chances de cada moeda (sem manivela): categorias + prêmios do pool, somando 100%. */
      chances: Record<string, LinhaChance[]>
      owner?: PocoOwner
    }

export type PocoResultado = {
  id: string
  moeda: string
  gratis: boolean
  categoria: PocoCategoriaResultado
  acertos: number
  quantidade: number
  /** Item entregue no inventário (null para lixo). Prêmio de carta/tempo vem aqui com kind 'outro' e meta.premio. */
  item: { key: string; kind: ItemKind; nome: string; descricao: string | null; raridade: ItemRarity; meta: Record<string, unknown> } | null
  /** Lixo: só mostrado, não vai ao inventário. */
  lixo: { id: string; nome: string; texto: string; imagem?: string | null } | null
  /** Auditoria: compromisso mostrado antes e segredo revelado agora (sha256(seed) === seedHash). */
  seed: string
  seedHash: string
}

/**
 * "Moeda especial" da cena da neblina (opção 2): qualquer Dracma do Poço. A "moeda comum" da opção 1 é uma
 * moeda qualquer do bolso, que não funciona aqui.
 */
export const isMoedaEspecial = (key: string) => key.startsWith('dracma_')
