import 'server-only'
import { pool } from '@/lib/db'
import { RecordError } from './errors'
import { type Queryable, run, UUID_RE } from './fundacao-db'
import type { CardDelivery, InventoryItem, ItemKind, ItemRarity } from './progresso'

/**
 * Inventário genérico (item_defs + player_items + item_ledger). As regras de saldo vivem no banco
 * (devo_item_grant / devo_item_consume): transacionais, idempotentes por `idem` e nunca negativas.
 * Passe o cliente de uma transação (`txAs`) para combinar com outras mudanças atomicamente.
 */
export type ItemOp = {
  playerId: string
  /** Chave do catálogo: 'dracma_comum', 'essencia:galo', 'chave:<torre>', 'capsula:<id>', 'cosmetico:<id>'… */
  item: string
  quantidade: number
  /** Motivo curto: 'poco', 'torre', 'recompensa', 'dialogo', 'cota_inicial', 'convite_gerado'… */
  motivo: string
  ref?: string | null
  atorId?: string | null
  /** Mesma chave = mesma operação (não repete). Ex.: `poco:giro:<id>`, `torre:<torre>:andar:3:<player>`. */
  idem?: string | null
}

function args(op: ItemOp) {
  if (!UUID_RE.test(op.playerId)) throw new RecordError('Jogador inválido.')
  const qty = Math.floor(Number(op.quantidade))
  if (!Number.isFinite(qty) || qty <= 0) throw new RecordError('Quantidade inválida.')
  return [op.playerId, op.item, qty, op.motivo.slice(0, 60), op.ref ?? null, op.atorId ?? null, op.idem ?? null]
}

/** Concede itens. Devolve o saldo final. Item único (cosmético, cápsula) fica com quantidade 1. */
export async function grantItem(op: ItemOp, q: Queryable = pool): Promise<number> {
  const [r] = await run<{ v: string }>(q, 'SELECT devo_item_grant($1, $2, $3, $4, $5, $6, $7) AS v', args(op))
  return Number(r.v)
}

/** Consome itens. Sem saldo → RecordError 409 "Saldo insuficiente." e nada muda. Devolve o saldo final. */
export async function consumeItem(op: ItemOp, q: Queryable = pool): Promise<number> {
  const [r] = await run<{ v: string }>(q, 'SELECT devo_item_consume($1, $2, $3, $4, $5, $6, $7) AS v', args(op))
  return Number(r.v)
}

export async function itemBalance(playerId: string, item: string, q: Queryable = pool): Promise<number> {
  const [r] = await run<{ quantity: string }>(q, 'SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = $2', [playerId, item])
  return Number(r?.quantity ?? 0)
}

/** Inventário do jogador (só itens com quantidade > 0), opcionalmente filtrado por tipo. */
export async function readInventory(playerId: string, kinds?: ItemKind[], q: Queryable = pool): Promise<InventoryItem[]> {
  const rows = await run<{
    key: string
    kind: ItemKind
    name: string
    description: string | null
    rarity: ItemRarity
    quantity: string
    source: string | null
    first_at: Date
    meta: Record<string, unknown>
  }>(
    q,
    `SELECT d.key, d.kind, d.name, d.description, d.rarity, i.quantity, i.source, i.first_at, d.meta
       FROM player_items i JOIN item_defs d ON d.key = i.item_key
      WHERE i.player_id = $1 AND i.quantity > 0 AND ($2::text[] IS NULL OR d.kind = ANY($2))
      ORDER BY d.kind, d.rarity, d.name`,
    [playerId, kinds?.length ? kinds : null],
  )
  return rows.map((r) => ({
    key: r.key,
    kind: r.kind,
    name: r.name,
    description: r.description,
    rarity: r.rarity,
    quantity: Number(r.quantity),
    source: r.source,
    firstAt: r.first_at.getTime(),
    meta: r.meta ?? {},
  }))
}

/** Catálogo (para Poço, Torres, Cosméticos, painel do Owner). */
export async function listItemDefs(kind?: ItemKind, q: Queryable = pool) {
  return run<{ key: string; kind: ItemKind; name: string; description: string | null; rarity: ItemRarity; stackable: boolean; meta: Record<string, unknown>; active: boolean }>(
    q,
    'SELECT key, kind, name, description, rarity, stackable, meta, active FROM item_defs WHERE ($1::text IS NULL OR kind = $1) ORDER BY kind, key',
    [kind ?? null],
  )
}

/** Cria ou atualiza um item do catálogo (chame só depois de `requireCan(ator, 'catalogo.editar')`). */
export async function upsertItemDef(
  def: { key: string; kind: ItemKind; name: string; description?: string | null; rarity?: ItemRarity; stackable?: boolean; meta?: Record<string, unknown>; active?: boolean },
  q: Queryable = pool,
) {
  await run(
    q,
    `INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta, active)
     VALUES ($1, $2, $3, $4, coalesce($5, 'comum'), coalesce($6, true), coalesce($7::jsonb, '{}'::jsonb), coalesce($8, true))
     ON CONFLICT (key) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, description = EXCLUDED.description,
       rarity = EXCLUDED.rarity, stackable = EXCLUDED.stackable, meta = EXCLUDED.meta, active = EXCLUDED.active`,
    [def.key, def.kind, def.name, def.description ?? null, def.rarity ?? null, def.stackable ?? null, def.meta ? JSON.stringify(def.meta) : null, def.active ?? null],
  )
}

/* Cartas: vivem no save do cliente. O servidor deposita aqui; o cliente resgata e põe no próprio inventário. */

export async function deliverCard(
  input: { playerId: string; cardId: string; origem: string; ref?: string | null; idem?: string | null },
  q: Queryable = pool,
): Promise<boolean> {
  const rows = await run(
    q,
    `INSERT INTO card_deliveries (player_id, card_id, origin, ref, idem_key) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,
    [input.playerId, input.cardId.slice(0, 80), input.origem.slice(0, 120), input.ref ?? null, input.idem ?? null],
  )
  return rows.length > 0
}

export async function pendingCardCount(playerId: string, q: Queryable = pool) {
  const [r] = await run<{ n: string }>(q, 'SELECT count(*) AS n FROM card_deliveries WHERE player_id = $1 AND claimed_at IS NULL', [playerId])
  return Number(r?.n ?? 0)
}

/** Marca as entregas pendentes como resgatadas e as devolve (o cliente adiciona ao save). Atômico. */
export async function claimCards(playerId: string, q: Queryable = pool): Promise<CardDelivery[]> {
  const rows = await run<{ id: string; card_id: string; origin: string; created_at: Date }>(
    q,
    `UPDATE card_deliveries SET claimed_at = now()
      WHERE id IN (SELECT id FROM card_deliveries WHERE player_id = $1 AND claimed_at IS NULL ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED)
      RETURNING id, card_id, origin, created_at`,
    [playerId],
  )
  return rows.map((r) => ({ id: r.id, cardId: r.card_id, origin: r.origin, createdAt: r.created_at.getTime() }))
}

/** Crédito de Tempo (minutos) pelo mesmo livro-caixa da Sala de Jogos (arcade_profiles.time_pending_ms). */
export async function creditMinutes(playerId: string, minutes: number, q: Queryable = pool) {
  const ms = Math.round(minutes * 60_000)
  if (!ms) return
  await run(q, 'INSERT INTO arcade_profiles (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [playerId])
  await run(q, 'UPDATE arcade_profiles SET time_pending_ms = time_pending_ms + $2 WHERE player_id = $1', [playerId, ms])
}
