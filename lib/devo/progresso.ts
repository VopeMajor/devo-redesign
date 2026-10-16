/**
 * Tipos e constantes da Fundação que o cliente pode importar (sem banco): flags de desbloqueio,
 * tipos de item, "linha do destino" do Karma e o formato das respostas de /api/eu.
 * Contrato: docs/redesign/FUNDACAO.md.
 */
import type { Cargo } from './cargos'

/** Sistemas trancados até vencer o Deadly Vote tutorial (Owner e Anfitrião veem tudo liberado). */
export const UNLOCK_FLAGS = ['salao_mascaras', 'poco', 'torres', 'diario', 'corporacoes', 'virtudes', 'galo_casa'] as const
export type UnlockFlag = (typeof UNLOCK_FLAGS)[number]

export const UNLOCK_LABEL: Record<UnlockFlag, string> = {
  salao_mascaras: 'Salão das Máscaras',
  poco: 'Poço dos Milagres',
  torres: 'Torres de Ruptura',
  diario: 'Diário',
  corporacoes: 'Corporações',
  virtudes: 'Virtudes',
  galo_casa: 'Visita do Galo (narrativa)',
}

/** Padrão do tutorial; espelho de devo_tutorial_flags() em scripts/fundacao-migration.sql. */
export const TUTORIAL_FLAGS: UnlockFlag[] = ['salao_mascaras', 'poco', 'torres', 'diario', 'galo_casa']

export const isUnlockFlag = (v: unknown): v is UnlockFlag => (UNLOCK_FLAGS as readonly unknown[]).includes(v)

export type ItemKind = 'moeda' | 'essencia' | 'chave' | 'fragmento' | 'capsula' | 'cosmetico' | 'convite' | 'outro'
export const ITEM_KINDS: ItemKind[] = ['moeda', 'essencia', 'chave', 'fragmento', 'capsula', 'cosmetico', 'convite', 'outro']

/** Escala de raridade dos itens e cosméticos (Comum → Arcano). As cartas têm a própria (lib/devo/cards.ts). */
export type ItemRarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'arcano'
export const ITEM_RARITY_LABEL: Record<ItemRarity, string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
  arcano: 'Arcano',
}

export type InventoryItem = {
  key: string
  kind: ItemKind
  name: string
  description: string | null
  rarity: ItemRarity
  quantity: number
  /** Como foi obtido pela primeira vez ('poco', 'recompensa', 'deadly_vote', 'cota_inicial'…). */
  source: string | null
  firstAt: number
  meta: Record<string, unknown>
}

/**
 * Karma mostrado como "linha do destino", sem número cru: direção e intensidade 0–3.
 * Faixas PROVISÓRIAS (ajustáveis aqui): |k| < 5 → equilíbrio; 5–19 → 1; 20–49 → 2; ≥ 50 → 3.
 */
export type Destino = { direcao: 'ordem' | 'equilibrio' | 'caos'; intensidade: 0 | 1 | 2 | 3 }

export function destinoDoKarma(karma: number): Destino {
  const a = Math.abs(karma)
  if (a < 5) return { direcao: 'equilibrio', intensidade: 0 }
  const intensidade = a >= 50 ? 3 : a >= 20 ? 2 : 1
  return { direcao: karma > 0 ? 'ordem' : 'caos', intensidade }
}

/**
 * Acesso efetivo do jogador (DIRECAO-3 §1b e §7). Owner e Anfitrião: `total = true` e tudo liberado —
 * nenhuma trava de progressão vale para eles (sistemas novos, Sala de Jogos ainda não revelada, apps ainda não
 * vistos, tutoriais). A interface só reflete este objeto; quem decide é `unlocks()` no servidor.
 */
export type Acesso = {
  /** Owner/Anfitrião: ignora qualquer trava. */
  total: boolean
  /** Sistemas novos (flags do servidor). */
  sistemas: Record<UnlockFlag, boolean>
  /** Sala de Jogos revelada (jogador: `save.arcadeUnlocked`; equipe superior: sempre). */
  salaJogos: boolean
  /** Todos os apps aparecem como já vistos/disponíveis (sem selo "novo" nem revelação forçada). */
  todosApps: boolean
  /** Tutoriais e apresentações são opcionais (podem ser pulados/abertos direto). */
  pularTutoriais: boolean
}

/** Resposta de GET /api/eu (somente dados do próprio jogador). */
export type EuPayload = {
  id: string
  /** O próprio cargo (o jogador sempre pode saber o dele). */
  cargo: Cargo
  inventario: InventoryItem[]
  /** Flags efetivas (já com a regra Owner/Anfitrião = tudo liberado). */
  desbloqueios: Record<UnlockFlag, boolean>
  tudoLiberado: boolean
  /** Acesso efetivo completo (inclui as travas antigas do cliente). Ver `Acesso`. */
  acesso: Acesso
  destino: Destino
  /** Convites que o Jogador ainda pode gerar (null para a equipe: não usa cota). */
  convites: number | null
  /** Cartas entregues pelo servidor esperando o cliente resgatar (POST /api/eu {action:'cartas.resgatar'}). */
  cartasPendentes: number
  /** O próprio Arcano (título, ex. "Arcano da Morte") e Estágio; null = sem registro. Sem números de Virtudes. */
  arcano: { key: string; titulo: string; numeral: string; estagio: number } | null
}

export type CardDelivery = { id: string; cardId: string; origin: string; createdAt: number }
