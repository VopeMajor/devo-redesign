/**
 * Cosméticos (texto do dono "Sistema de Cosméticos", §1–§14; DIRECAO-3 §5). Arquivo PURO: o cliente importa
 * para desenhar; quem decide posse, equipamento e catálogo é `lib/devo/cosmeticos-server.ts`.
 *
 * Os itens vivem no inventário genérico da Fundação (`item_defs` kind 'cosmetico', chave `cosmetico:<id>`):
 *   meta.categoria  moldura_avatar | moldura_mini | emblema | balao | efeito
 *   meta.asset      'devo:<arte>' (arte desenhada no código, components/devo/cosmeticos/art) ou URL de imagem
 *                   (upload do Owner: '/api/cosmeticos?view=asset&id=<uuid>', ou https)
 *   meta.animado    true quando a arte tem animação (CSS, desligável)
 *   meta.poco       true = pode sair no Poço (FUNDACAO.md §10)
 *   meta.origem     como se obtém (texto curto mostrado no inventário): ver ORIGEM_LABEL
 *   meta.automatico true = não se equipa; aparece sozinho (Selo do Anfitrião, ligado ao cargo público)
 *   meta.par        chave do mesmo desenho no outro formato (moldura avatar ↔ mini)
 *   meta.ordem      ordem na coleção
 */
import { ITEM_RARITY_LABEL, type ItemRarity } from './progresso'

export const COS_SLOTS = ['moldura_avatar', 'moldura_mini', 'emblema', 'balao', 'efeito'] as const
export type CosSlot = (typeof COS_SLOTS)[number]
export type CosCategoria = CosSlot

export const SLOT_LABEL: Record<CosSlot, string> = {
  moldura_avatar: 'Moldura do avatar',
  moldura_mini: 'Moldura do miniperfil',
  emblema: 'Emblema principal',
  balao: 'Balão de chat',
  efeito: 'Efeito do nome',
}

/** Abas do inventário (§9): Molduras · Emblemas · Balões · Efeitos especiais. */
export const COS_ABAS = [
  { id: 'molduras', label: 'Molduras', slots: ['moldura_avatar', 'moldura_mini'] as CosSlot[] },
  { id: 'emblemas', label: 'Emblemas', slots: ['emblema'] as CosSlot[] },
  { id: 'baloes', label: 'Balões', slots: ['balao'] as CosSlot[] },
  { id: 'efeitos', label: 'Efeitos', slots: ['efeito'] as CosSlot[] },
] as const
export type CosAba = (typeof COS_ABAS)[number]['id']

export const isCosSlot = (v: unknown): v is CosSlot => (COS_SLOTS as readonly unknown[]).includes(v)

export const ORIGEM_LABEL: Record<string, string> = {
  poco: 'Poço dos Milagres',
  semanal: 'Recompensa semanal',
  deadly_vote: 'Deadly Vote',
  evento: 'Evento especial',
  exclusivo: 'Concessão da casa',
  anfitriao: 'Insígnia dos Anfitriões',
}

/** Motivo gravado no inventário (player_items.source) → texto de "como foi obtido". */
export const MOTIVO_LABEL: Record<string, string> = {
  poco: 'Sorteado no Poço dos Milagres',
  recompensa: 'Recompensa aprovada pela equipe',
  deadly_vote: 'Prêmio de Deadly Vote',
  owner: 'Concedido pela casa',
  seed: 'Concedido pela casa',
  semanal: 'Recompensa semanal',
}

/** Raridades na ordem Comum → Arcano. Rótulos e cores são configuráveis em devo_config['cosmeticos.raridades']. */
export const RARIDADES: ItemRarity[] = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'arcano']

export type RaridadeVisual = { label: string; cor: string; brilho: string }

/** Padrão (provisório até o dono definir): metal e luz por raridade, sem neon. */
export const RARIDADE_PADRAO: Record<ItemRarity, RaridadeVisual> = {
  comum: { label: ITEM_RARITY_LABEL.comum, cor: '#8f8e8b', brilho: 'rgba(143,142,139,0.0)' },
  incomum: { label: ITEM_RARITY_LABEL.incomum, cor: '#b7b3a8', brilho: 'rgba(183,179,168,0.25)' },
  raro: { label: ITEM_RARITY_LABEL.raro, cor: '#d9d8d4', brilho: 'rgba(217,216,212,0.35)' },
  epico: { label: ITEM_RARITY_LABEL.epico, cor: '#c98a95', brilho: 'rgba(163,46,64,0.35)' },
  lendario: { label: ITEM_RARITY_LABEL.lendario, cor: '#e3d3ae', brilho: 'rgba(214,190,140,0.4)' },
  arcano: { label: ITEM_RARITY_LABEL.arcano, cor: '#c2b9ec', brilho: 'rgba(138,124,200,0.5)' },
}

export type CosmeticoDef = {
  key: string
  name: string
  description: string | null
  rarity: ItemRarity
  categoria: CosSlot
  /** 'devo:<arte>' ou URL de imagem. */
  asset: string
  animado: boolean
  poco: boolean
  origem: string
  automatico: boolean
  par: string | null
  ordem: number
  active: boolean
}

/** Item possuído (inventário do próprio jogador). */
export type CosmeticoPosse = { key: string; source: string | null; firstAt: number; expiresAt: number | null }

export type Equipados = Record<CosSlot, string | null>
export const EQUIP_VAZIO: Equipados = { moldura_avatar: null, moldura_mini: null, emblema: null, balao: null, efeito: null }

/**
 * Aparência pública de um jogador (vai em qualquer payload público). NUNCA leva cargo de Owner nem
 * "pode tudo": só o que está equipado e a marca pública do Anfitrião (cargo que pode ser público).
 */
export type Visual = {
  id: string
  /** Versão da foto (para /api/arcade?view=avatar&pid=…&v=…) ou null. */
  foto: number | null
  av: string | null
  mini: string | null
  emb: string | null
  bal: string | null
  ef: string | null
  /** Anfitrião (público): selo e brilho próprios. Owner sai sempre como jogador comum. */
  anfitriao: boolean
}

export const VISUAL_VAZIO = (id: string): Visual => ({ id, foto: null, av: null, mini: null, emb: null, bal: null, ef: null, anfitriao: false })

/** Resposta de GET /api/cosmeticos (somente o próprio jogador). */
export type MeusCosmeticos = {
  catalogo: CosmeticoDef[]
  possuidos: CosmeticoPosse[]
  equipados: Equipados
  /** Pode equipar qualquer item do catálogo (decidido no servidor; nunca vai para payload público). */
  livre: boolean
  /** Coleção liberada (tutorial vencido, ou já possui algum cosmético, ou Owner/Anfitrião). */
  liberada: boolean
  raridades: Record<ItemRarity, RaridadeVisual>
}

export const SELO_ANFITRIAO = 'cosmetico:emblema-selo-anfitriao'

/** Converte linha de item_defs em definição de cosmético (tolerante a meta incompleta). */
export function toCosmetico(r: { key: string; name: string; description: string | null; rarity: ItemRarity; meta: Record<string, unknown> | null; active: boolean }): CosmeticoDef | null {
  const m = r.meta ?? {}
  const categoria = m.categoria
  if (!isCosSlot(categoria)) return null
  return {
    key: r.key,
    name: r.name,
    description: r.description,
    rarity: r.rarity,
    categoria,
    asset: typeof m.asset === 'string' ? m.asset : '',
    animado: m.animado === true,
    poco: m.poco === true,
    origem: typeof m.origem === 'string' ? m.origem : 'exclusivo',
    automatico: m.automatico === true,
    par: typeof m.par === 'string' ? m.par : null,
    ordem: typeof m.ordem === 'number' ? m.ordem : 999,
    active: r.active,
  }
}

/** URL de imagem aceita para asset enviado (upload interno ou https). */
export const ASSET_URL_RE = /^(\/api\/cosmeticos\?view=asset&id=[0-9a-f-]{36}|https:\/\/[^\s"'<>]{4,400})$/i

/** Semana (segunda-feira, horário de Brasília) → origem/ref das recompensas semanais: "Semana AAAA-MM-DD". */
export const semanaRef = (semana: string) => `Semana ${semana}`

export const PLANO_CRITERIOS = ['top1', 'top3', 'top10', 'participacao'] as const
export type PlanoCriterio = (typeof PLANO_CRITERIOS)[number]
export const CRITERIO_LABEL: Record<PlanoCriterio, string> = {
  top1: '1º lugar',
  top3: 'Top 3',
  top10: 'Top 10',
  participacao: 'Mínimo de partidas na semana',
}

export type PlanoStatus = 'sugerida' | 'proposta' | 'aprovada' | 'rejeitada' | 'distribuida' | 'cancelada'
export const PLANO_STATUS_LABEL: Record<PlanoStatus, string> = {
  sugerida: 'Sugestão',
  proposta: 'Aguardando aprovação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  distribuida: 'Distribuída',
  cancelada: 'Cancelada',
}

export type PlanoSemanal = {
  id: string
  semana: string
  jogo: string
  criterio: PlanoCriterio
  recurso: 'item' | 'tempo' | 'carta' | 'convite'
  chave: string | null
  quantidade: number
  nota: string | null
  status: PlanoStatus
  propostoPor: string | null
  propostoPorNome: string | null
  aprovadoPorNome: string | null
  distribuidos: number
  revisao: number
  podeAprovar: boolean
  podeEditar: boolean
  criadoEm: number
}
