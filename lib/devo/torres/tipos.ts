/**
 * Torres de Ruptura — tipos puros (cliente e servidor). Contrato e guia de conteúdo: docs/redesign/TORRES.md.
 *
 * O CONTEÚDO (torres, andares, NPCs, diálogos) é DADO: `lib/devo/torres/conteudo.json` (ou, se existir, a
 * configuração `torres.conteudo` gravada pelo Owner em devo_config). O código só lê e valida.
 */

/* ------------------------------------------------------------------ Cenas de diálogo */

/**
 * Um passo de cena. As falas aceitam os marcadores `{nome}` e `{masculino|feminino}` (gênero do jogador) e
 * trechos entre colchetes como direção de cena: "Besteira. [Dedo do meio censurado.]".
 */
export type Passo =
  /** Fala de um NPC. `quem` = id do NPC (padrão: o NPC da cena); `pose` = expressão do retrato. */
  | { tipo: 'fala'; texto: string; quem?: string; pose?: string }
  /** Pensamento ou fala do próprio jogador, sem escolha. */
  | { tipo: 'jogador'; texto: string }
  /** Narração / ação entre asteriscos no texto do dono. */
  | { tipo: 'narra'; texto: string }
  /** [Mensagem do sistema: …] */
  | { tipo: 'sistema'; texto: string }
  /** Quadro de explicação do sistema ("[Torre de Ruptura]" + parágrafos). */
  | { tipo: 'bloco'; titulo: string; texto: string[] }
  /** Escolhas do jogador; cada uma pode ter resposta própria (passos que entram logo depois). */
  | { tipo: 'escolha'; opcoes: Opcao[] }

export type Opcao = {
  texto: string
  /** Escolha de ação ("*Aceitar*"): aparece em itálico com o selo "Ação". */
  acao?: boolean
  /** Passos que seguem só depois desta escolha. */
  resposta?: Passo[]
  /** Efeito no servidor (lista fechada, ver EFEITOS). */
  efeito?: Efeito
  /** Depois da resposta, a cena termina. */
  encerra?: boolean
}

/** Efeitos que uma escolha pode pedir ao servidor. Novos efeitos exigem código (rota /api/torres). */
export const EFEITOS = ['galo.fa.aceitar', 'galo.fa.recusar'] as const
export type Efeito = (typeof EFEITOS)[number]

/* ------------------------------------------------------------------ Conteúdo (arquivo) */

/** Desenhos de torre disponíveis no mapa (em código). Torre nova escolhe um deles. */
export const ARTES = ['agulha', 'palacio', 'observatorio', 'picadeiro'] as const
export type Arte = (typeof ARTES)[number]

export type NpcRef = {
  /** id do NPC (mesmo de lib/devo/npcs.ts quando houver retrato lá: 'galo', 'coruja', 'javali'…). */
  id: string
  nome: string
  titulo?: string
  /** Pose do retrato padrão. */
  pose?: string
  /** Caminho de imagem explícito (opcional; senão usa o mapa de retratos). */
  retrato?: string
}

export type ChaveReq = { torre: string; quantidade: number }

export type AndarDef = {
  titulo: string
  /** Texto curto mostrado no cartão do andar. */
  resumo?: string
  /** NPC em destaque neste andar (padrão: o da torre). */
  npc?: NpcRef
  /** Cena que toca ao concluir o andar (e que pode ser revista depois). */
  cena?: Passo[]
  /** Requisitos além das essências (só faz sentido na torre principal, mas vale em qualquer uma). */
  requisitos?: { chaves?: ChaveReq[]; gastaChaves?: boolean }
  /** Recompensas extras. Andares de torre secundária entregam 1 chave da própria torre por padrão. */
  recompensas?: { chaves?: number; itens?: { item: string; quantidade: number }[] }
  /** Andar ainda sem texto definitivo do dono. */
  provisorio?: boolean
}

export type TorreDef = {
  id: string
  nome: string
  tipo: 'principal' | 'secundaria'
  /** Tema curto ("Campanha", "Astronomia", "Picadeiro"…). */
  tema: string
  descricao?: string
  npc: NpcRef
  /** Item de Essência de Afinidade que paga os andares (`essencia:<npc>`). */
  essencia: { item: string; nome: string }
  /** Essências do 1º andar. O custo dobra a cada andar: base × 2^(n−1). */
  custoBase: number
  arte: Arte
  /** Posição no mapa, em % da largura/altura da ilustração (centro da base da torre). */
  mapa: { x: number; y: number; escala?: number }
  /** Nome da chave entregue pelos andares (secundárias). Item: `chave:<id>`. */
  chave?: { nome: string }
  andares: AndarDef[]
  provisorio?: boolean
  /**
   * Ilustração pintada (pipeline de arte). Sem ela, a torre usa o desenho vetorial de `arte`. Arquivos:
   * `<arquivo>-<largura>.webp` (fundo transparente), uma por largura listada (convenção do pipeline de arte).
   */
  ilustracao?: Ilustracao
}

export type Ilustracao = {
  /** Caminho sem o sufixo de largura: '/images/torres/<id>/torre' → 'torre-512.webp'. */
  arquivo: string
  larguras: number[]
  /** largura ÷ altura da imagem. */
  aspecto: number
  /** Altura no mapa (unidades da ilustração 390×640, escala 1). */
  altura: number
  /** Janelas para o brilho de progresso, em frações [x, y] da imagem, de baixo para cima (uma por andar). */
  janelas?: [number, number][]
}

export type ConteudoTorres = { versao: number; provisorio?: boolean; nota?: string; torres: TorreDef[] }

/* ------------------------------------------------------------------ Regras puras */

export const MIN_ANDARES = 5
export const MAX_ANDARES = 8

/** Custo do andar n (1-based): dobra a cada andar. */
export function custoDoAndar(custoBase: number, n: number) {
  return Math.max(1, Math.floor(custoBase)) * 2 ** (n - 1)
}

export const chaveItem = (torreId: string) => `chave:${torreId}`

/** Chaves que o andar entrega (secundárias: 1 por padrão; principal: 0 por padrão). */
export function chavesDoAndar(torre: Pick<TorreDef, 'tipo'>, andar: AndarDef) {
  const n = andar.recompensas?.chaves
  if (typeof n === 'number') return Math.max(0, Math.floor(n))
  return torre.tipo === 'secundaria' ? 1 : 0
}

/* ------------------------------------------------------------------ Estado (resposta de /api/torres) */

export type ItemSaldo = { item: string; nome: string; quantidade: number }

export type AndarEstado = {
  n: number
  titulo: string
  resumo: string | null
  npc: NpcRef
  estado: 'concluido' | 'atual' | 'trancado'
  /** Essências deste andar (já dobradas). */
  custo: number
  chaves: (ChaveReq & { item: string; nome: string; tem: number })[]
  gastaChaves: boolean
  /** O que falta agora (só para o andar atual). */
  faltaEssencias: number
  faltaChaves: number
  podeSubir: boolean
  recompensas: { chaves: number; itens: ItemSaldo[] }
  provisorio: boolean
  /** Só para andares concluídos (rever cena). */
  cena: Passo[] | null
}

export type TorreEstado = {
  id: string
  nome: string
  tipo: 'principal' | 'secundaria'
  tema: string
  descricao: string | null
  npc: NpcRef
  essencia: ItemSaldo
  chave: ItemSaldo | null
  arte: Arte
  mapa: { x: number; y: number; escala: number }
  andares: AndarEstado[]
  concluidos: number
  provisorio: boolean
  ilustracao: Ilustracao | null
}

export type TorresPayload =
  | { liberado: false; motivo: string }
  | {
      liberado: true
      /** Owner/Anfitrião: apresentações podem ser puladas. */
      pularApresentacao: boolean
      apresentacao: { galoVista: boolean; galoFa: boolean | null; reflexaoPendente: boolean }
      torres: TorreEstado[]
      provisorio: boolean
    }

export type SubirResposta = { ok: true; torre: TorreEstado; andar: AndarEstado; cena: Passo[]; chavesRecebidas: number }
