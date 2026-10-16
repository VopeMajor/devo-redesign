import 'server-only'
import { pool } from '@/lib/db'
import { MIN_WEEK_GAMES, weekKey, weekStartMs } from './arcade/server'
import { type Ator, can, publicCargo } from './cargos'
import {
  ASSET_URL_RE,
  CRITERIO_LABEL,
  type CosmeticoDef,
  type CosmeticoPosse,
  type CosSlot,
  EQUIP_VAZIO,
  type Equipados,
  isCosSlot,
  type MeusCosmeticos,
  PLANO_CRITERIOS,
  type PlanoCriterio,
  type PlanoSemanal,
  type PlanoStatus,
  RARIDADE_PADRAO,
  type RaridadeVisual,
  RARIDADES,
  semanaRef,
  toCosmetico,
  type Visual,
} from './cosmeticos'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { consumeItem, grantItem, upsertItemDef } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, unlocks } from './progresso-server'
import type { ItemRarity } from './progresso'
import { proposeRewardIn } from './recompensas-server'

/**
 * Cosméticos no servidor (contrato: docs/redesign/FUNDACAO.md §11).
 * Posse = inventário genérico (player_items, kind 'cosmetico'); equipados = player_cosmetics.
 * Regras críticas: jogador só equipa o que possui (e não expirou); Owner equipa qualquer item
 * (`can(ator, 'cosmetico.equipar_qualquer')`); payload público (`Visual`) nunca leva cargo de Owner.
 */

type DefRow = { key: string; name: string; description: string | null; rarity: ItemRarity; meta: Record<string, unknown> | null; active: boolean }

const SLOT_COL: Record<CosSlot, string> = {
  moldura_avatar: 'moldura_avatar',
  moldura_mini: 'moldura_mini',
  emblema: 'emblema',
  balao: 'balao',
  efeito: 'efeito',
}

export async function listCatalogo(opts: { inativos?: boolean } = {}, q: Queryable = pool): Promise<CosmeticoDef[]> {
  const rows = await run<DefRow>(
    q,
    `SELECT key, name, description, rarity, meta, active FROM item_defs WHERE kind = 'cosmetico' AND ($1 OR active)`,
    [!!opts.inativos],
  )
  return rows
    .map(toCosmetico)
    .filter((c): c is CosmeticoDef => !!c)
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.ordem - b.ordem || a.name.localeCompare(b.name))
}

export async function getRaridades(q: Queryable = pool): Promise<Record<ItemRarity, RaridadeVisual>> {
  const cfg = await getConfig<Record<string, Partial<RaridadeVisual>>>('cosmeticos.raridades', q).catch(() => null)
  const out = { ...RARIDADE_PADRAO }
  for (const r of RARIDADES) {
    const c = cfg?.value?.[r]
    if (c) out[r] = { label: String(c.label ?? out[r].label).slice(0, 30), cor: /^#[0-9a-f]{6}$/i.test(String(c.cor)) ? String(c.cor) : out[r].cor, brilho: String(c.brilho ?? out[r].brilho).slice(0, 40) }
  }
  return out
}

/** Posse válida: quantidade > 0 e (sem validade ou ainda dentro dela). */
const POSSE_VALIDA = `i.quantity > 0 AND (i.expires_at IS NULL OR i.expires_at > now())`

async function possuidos(playerId: string, q: Queryable = pool): Promise<CosmeticoPosse[]> {
  const rows = await run<{ key: string; source: string | null; first_at: Date; expires_at: Date | null }>(
    q,
    `SELECT d.key, i.source, i.first_at, i.expires_at FROM player_items i JOIN item_defs d ON d.key = i.item_key
      WHERE i.player_id = $1 AND d.kind = 'cosmetico' AND ${POSSE_VALIDA}`,
    [playerId],
  )
  return rows.map((r) => ({ key: r.key, source: r.source, firstAt: r.first_at.getTime(), expiresAt: r.expires_at?.getTime() ?? null }))
}

async function equipados(playerId: string, q: Queryable = pool): Promise<Equipados> {
  const [r] = await run<Record<CosSlot, string | null>>(q, 'SELECT moldura_avatar, moldura_mini, emblema, balao, efeito FROM player_cosmetics WHERE player_id = $1', [playerId])
  return r ? { moldura_avatar: r.moldura_avatar, moldura_mini: r.moldura_mini, emblema: r.emblema, balao: r.balao, efeito: r.efeito } : { ...EQUIP_VAZIO }
}

/** Coleção do próprio jogador (GET /api/cosmeticos). */
export async function meusCosmeticos(playerId: string): Promise<MeusCosmeticos> {
  const ator = await requireActor(playerId)
  const livre = can(ator, 'cosmetico.equipar_qualquer')
  const [catalogo, pos, eq, raridades, acesso] = await Promise.all([listCatalogo({ inativos: livre }), possuidos(playerId), equipados(playerId), getRaridades(), unlocks(playerId)])
  const liberada = livre || acesso.total || acesso.sistemas.poco || pos.length > 0
  return { catalogo, possuidos: pos, equipados: eq, livre, liberada, raridades }
}

/**
 * Equipa (key) ou tira (key = null). Valida no servidor: categoria do item = espaço; item automático (Selo do
 * Anfitrião) não se equipa; jogador precisa possuir o item ativo e não expirado; Owner equipa qualquer um.
 */
export async function equiparCosmetico(playerId: string, slotRaw: unknown, keyRaw: unknown): Promise<Equipados> {
  if (!isCosSlot(slotRaw)) throw new RecordError('Espaço de cosmético inválido.')
  const slot = slotRaw
  const key = keyRaw === null || keyRaw === '' ? null : typeof keyRaw === 'string' ? keyRaw.slice(0, 80) : undefined
  if (key === undefined) throw new RecordError('Item inválido.')
  return txAs(playerId, async (c) => {
    const ator = await requireActor(playerId, c)
    if (key) {
      const [d] = await run<DefRow & { kind: string }>(c, 'SELECT key, kind, name, description, rarity, meta, active FROM item_defs WHERE key = $1', [key])
      const def = d && d.kind === 'cosmetico' ? toCosmetico(d) : null
      if (!def) throw new RecordError('Cosmético não encontrado.', 404)
      if (def.categoria !== slot) throw new RecordError('Este item não serve neste espaço.')
      if (def.automatico) throw new RecordError('Este item aparece sozinho e não pode ser equipado.', 403)
      if (!can(ator, 'cosmetico.equipar_qualquer')) {
        if (!def.active) throw new RecordError('Este cosmético não está disponível.', 403)
        const [ok] = await run(c, `SELECT 1 FROM player_items i WHERE i.player_id = $1 AND i.item_key = $2 AND ${POSSE_VALIDA}`, [playerId, key])
        if (!ok) throw new RecordError('Você ainda não tem este cosmético.', 403)
      }
    }
    const col = SLOT_COL[slot]
    await run(
      c,
      `INSERT INTO player_cosmetics (player_id, ${col}, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (player_id) DO UPDATE SET ${col} = EXCLUDED.${col}, updated_at = now()`,
      [playerId, key],
    )
    return equipados(playerId, c)
  })
}

/**
 * Aparência pública de vários jogadores (chat, ranking, listas, miniperfil). Sem cargo de Owner: só os itens
 * equipados que continuam válidos e `anfitriao` (cargo público). Um item retirado ou expirado some daqui
 * para quem não pode equipar qualquer coisa. Item inativo nunca aparece em público (nem no Owner, que pode
 * equipá-lo): um item fora de circulação visível em alguém denunciaria o cargo.
 */
export async function visuais(idsRaw: string[]): Promise<Visual[]> {
  const ids = [...new Set(idsRaw.filter((x) => UUID_RE.test(x)))].slice(0, 80)
  if (!ids.length) return []
  const valido = (col: string) =>
    `CASE WHEN pc.${col} IS NULL THEN NULL
          WHEN p.role IN ('owner', 'admin') AND EXISTS (SELECT 1 FROM item_defs d WHERE d.key = pc.${col} AND d.active) THEN pc.${col}
          WHEN EXISTS (SELECT 1 FROM player_items i JOIN item_defs d ON d.key = i.item_key WHERE i.player_id = p.id AND i.item_key = pc.${col} AND d.active AND ${POSSE_VALIDA}) THEN pc.${col}
     END AS ${col}`
  const rows = await run<{ id: string; role: string; foto: Date | null; tem_foto: boolean } & Record<CosSlot, string | null>>(
    pool,
    `SELECT p.id, p.role, p.avatar_updated_at AS foto, p.avatar IS NOT NULL AS tem_foto,
            ${(Object.values(SLOT_COL) as string[]).map(valido).join(', ')}
       FROM players p LEFT JOIN player_cosmetics pc ON pc.player_id = p.id
      WHERE p.id = ANY($1::uuid[])`,
    [ids],
  )
  return rows.map((r) => ({
    id: r.id,
    foto: r.tem_foto ? (r.foto?.getTime() ?? 1) : null,
    av: r.moldura_avatar,
    mini: r.moldura_mini,
    emb: r.emblema,
    bal: r.balao,
    ef: r.efeito,
    anfitriao: publicCargo(r.role) === 'anfitriao',
  }))
}

/* ─────────────────────────────────────────────── Administração (Owner) ── */

export type ItemAdmin = CosmeticoDef & { donos: number; equipados: number }

export async function adminCatalogo(atorId: string): Promise<ItemAdmin[]> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'catalogo.editar')
  const [cat, cont] = await Promise.all([
    listCatalogo({ inativos: true }),
    run<{ key: string; donos: string; equipados: string }>(
      pool,
      `SELECT d.key,
              (SELECT count(*) FROM player_items i WHERE i.item_key = d.key AND i.quantity > 0) AS donos,
              (SELECT count(*) FROM player_cosmetics pc WHERE d.key IN (pc.moldura_avatar, pc.moldura_mini, pc.emblema, pc.balao, pc.efeito)) AS equipados
         FROM item_defs d WHERE d.kind = 'cosmetico'`,
    ),
  ])
  const m = new Map(cont.map((c) => [c.key, c]))
  return cat.map((c) => ({ ...c, donos: Number(m.get(c.key)?.donos ?? 0), equipados: Number(m.get(c.key)?.equipados ?? 0) }))
}

const SLUG_RE = /^cosmetico:[a-z0-9][a-z0-9-]{1,60}$/
const ORIGENS = ['poco', 'semanal', 'deadly_vote', 'evento', 'exclusivo', 'anfitriao']
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/** Cria ou edita um cosmético do catálogo (Owner). Mantém `par`/`automatico` existentes. */
export async function salvarCosmetico(atorId: string, raw: Record<string, unknown>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'catalogo.editar')
    const key = str(raw.key, 72)
    if (!SLUG_RE.test(key)) throw new RecordError('Chave inválida: use cosmetico:<nome-em-minusculas>.')
    const name = str(raw.name, 60)
    if (name.length < 2) throw new RecordError('Nome obrigatório.')
    if (!isCosSlot(raw.categoria)) throw new RecordError('Categoria inválida.')
    const rarity = RARIDADES.includes(raw.rarity as ItemRarity) ? (raw.rarity as ItemRarity) : null
    if (!rarity) throw new RecordError('Raridade inválida.')
    const asset = str(raw.asset, 420)
    if (!/^devo:[a-z]+\/[a-z0-9-]+$/.test(asset) && !ASSET_URL_RE.test(asset)) throw new RecordError('Asset inválido: envie um arquivo ou use uma URL https.')
    const origem = ORIGENS.includes(String(raw.origem)) ? String(raw.origem) : 'exclusivo'
    const [atual] = await run<{ meta: Record<string, unknown> }>(c, "SELECT meta FROM item_defs WHERE key = $1 AND kind = 'cosmetico'", [key])
    const meta = {
      ...(atual?.meta ?? {}),
      categoria: raw.categoria,
      asset,
      animado: raw.animado === true,
      poco: raw.poco === true,
      origem,
      ordem: Number.isFinite(Number(raw.ordem)) ? Math.max(0, Math.min(9999, Math.round(Number(raw.ordem)))) : ((atual?.meta?.ordem as number) ?? 500),
    }
    await upsertItemDef({ key, kind: 'cosmetico', name, description: str(raw.description, 300) || null, rarity, stackable: false, meta, active: raw.active !== false }, c)
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'cosmetico.item', $2, $3)", [ator.id, key, JSON.stringify({ name, rarity, ...meta, active: raw.active !== false })])
    return key
  })
}

const MIMES: Record<string, string> = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/webp': 'webp' }

/** Upload de asset (Owner): SVG/PNG/WebP até 400 KB, guardado no banco (não há storage de arquivos). */
export async function enviarAsset(atorId: string, raw: { mime?: unknown; base64?: unknown }) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'catalogo.editar')
  const mime = String(raw.mime ?? '')
  if (!MIMES[mime]) throw new RecordError('Formato não aceito: use SVG, PNG ou WebP.')
  const b64 = String(raw.base64 ?? '')
  if (!/^[A-Za-z0-9+/=]+$/.test(b64)) throw new RecordError('Arquivo inválido.')
  const buf = Buffer.from(b64, 'base64')
  if (!buf.length || buf.length > 400_000) throw new RecordError('Arquivo vazio ou maior que 400 KB.')
  if (mime === 'image/svg+xml') {
    const t = buf.toString('utf8')
    if (!/<svg[\s>]/i.test(t) || /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<iframe|<embed|<object/i.test(t)) throw new RecordError('SVG recusado: não pode ter script, eventos ou conteúdo embutido.')
  } else if (mime === 'image/png' ? buf.readUInt32BE(0) !== 0x89504e47 : buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new RecordError('O conteúdo não corresponde ao formato.')
  }
  const [r] = await run<{ id: string }>(pool, 'INSERT INTO cosmetic_assets (mime, data, bytes, created_by) VALUES ($1, $2, $3, $4) RETURNING id', [mime, buf, buf.length, ator.id])
  await run(pool, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'cosmetico.asset', $2, $3)", [ator.id, r.id, JSON.stringify({ mime, bytes: buf.length })])
  return { id: r.id, url: `/api/cosmeticos?view=asset&id=${r.id}` }
}

export async function lerAsset(id: string) {
  if (!UUID_RE.test(id)) return null
  const [r] = await run<{ mime: string; data: Buffer }>(pool, 'SELECT mime, data FROM cosmetic_assets WHERE id = $1', [id])
  return r ?? null
}

async function exigeCosmetico(c: Queryable, key: string) {
  const [d] = await run(c, "SELECT 1 FROM item_defs WHERE key = $1 AND kind = 'cosmetico'", [key])
  if (!d) throw new RecordError('Cosmético não encontrado.', 404)
}

/** Concede um cosmético direto (Owner), com registro. Idempotente por item (item único). */
export async function concederCosmetico(atorId: string, playerId: string, key: string, motivo: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'item.conceder')
    await exigeCosmetico(c, key)
    const [p] = await run(c, 'SELECT 1 FROM players WHERE id = $1', [playerId])
    if (!p) throw new RecordError('Jogador não encontrado.', 404)
    await grantItem({ playerId, item: key, quantidade: 1, motivo: 'owner', ref: str(motivo, 120) || null, atorId: ator.id }, c)
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, 'cosmetico.concedido', $2, $3, $4)", [ator.id, playerId, key, JSON.stringify({ motivo: str(motivo, 120) })])
  })
}

/** Revoga (Owner): tira do inventário e desequipa onde estiver. */
export async function revogarCosmetico(atorId: string, playerId: string, key: string, motivo: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'item.conceder')
    await exigeCosmetico(c, key)
    await consumeItem({ playerId, item: key, quantidade: 1, motivo: 'owner_revogou', ref: str(motivo, 120) || null, atorId: ator.id }, c)
    await run(
      c,
      `UPDATE player_cosmetics SET
         moldura_avatar = NULLIF(moldura_avatar, $2), moldura_mini = NULLIF(moldura_mini, $2), emblema = NULLIF(emblema, $2),
         balao = NULLIF(balao, $2), efeito = NULLIF(efeito, $2), updated_at = now()
       WHERE player_id = $1`,
      [playerId, key],
    )
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, 'cosmetico.revogado', $2, $3, $4)", [ator.id, playerId, key, JSON.stringify({ motivo: str(motivo, 120) })])
  })
}

export type DistribuicaoLinha = { at: number; jogador: string; jogadorId: string; item: string; itemNome: string; delta: number; motivo: string; ator: string | null }

/** Histórico de distribuição (livro-razão do inventário, só cosméticos). Owner. */
export async function historicoCosmeticos(atorId: string, filtro: { key?: string | null; playerId?: string | null } = {}): Promise<DistribuicaoLinha[]> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'item.conceder')
  const rows = await run<{ at: Date; jogador: string; player_id: string; item_key: string; nome: string; delta: string; reason: string; ator: string | null }>(
    pool,
    `SELECT l.at, p.name AS jogador, l.player_id, l.item_key, d.name AS nome, l.delta, l.reason, a.name AS ator
       FROM item_ledger l JOIN item_defs d ON d.key = l.item_key JOIN players p ON p.id = l.player_id
       LEFT JOIN players a ON a.id = l.actor_id
      WHERE d.kind = 'cosmetico' AND ($1::text IS NULL OR l.item_key = $1) AND ($2::uuid IS NULL OR l.player_id = $2)
      ORDER BY l.at DESC LIMIT 120`,
    [filtro.key || null, filtro.playerId && UUID_RE.test(filtro.playerId) ? filtro.playerId : null],
  )
  return rows.map((r) => ({ at: r.at.getTime(), jogador: r.jogador, jogadorId: r.player_id, item: r.item_key, itemNome: r.nome, delta: Number(r.delta), motivo: r.reason, ator: r.ator }))
}

/* ─────────────────────────────────────── Recompensas semanais (§8) ── */

const JOGOS = ['geral', 'chess', 'memory-rush', 'hot-bomb', 'bluff']

type PlanoRow = {
  id: string
  week_start: Date | string
  game: string
  criterion: PlanoCriterio
  resource: PlanoSemanal['recurso']
  resource_key: string | null
  quantity: number
  note: string | null
  status: PlanoStatus
  proposed_by: string | null
  proposer: string | null
  approver: string | null
  distributed_count: number
  revision: number
  created_at: Date
}

const semanaStr = (v: Date | string) => (typeof v === 'string' ? v.slice(0, 10) : v.toISOString().slice(0, 10))

function alvoPlano(r: { week_start: Date | string; proposed_by: string | null }) {
  return { tipo: 'semanal' as const, propostoPor: r.proposed_by, supervisorOriginal: null, supervisorAtual: null, ref: semanaRef(semanaStr(r.week_start)) }
}

function toPlano(ator: Ator, r: PlanoRow): PlanoSemanal {
  const aberto = r.status !== 'distribuida' && r.status !== 'cancelada'
  return {
    id: r.id,
    semana: semanaStr(r.week_start),
    jogo: r.game,
    criterio: r.criterion,
    recurso: r.resource,
    chave: r.resource_key,
    quantidade: r.quantity,
    nota: r.note,
    status: r.status,
    propostoPor: r.proposed_by,
    propostoPorNome: r.proposer,
    aprovadoPorNome: r.approver,
    distribuidos: r.distributed_count,
    revisao: r.revision,
    podeAprovar: aberto && can(ator, 'recompensa.aprovar', alvoPlano(r)),
    podeEditar: aberto && (ator.cargo === 'owner' || r.proposed_by === ator.id),
    criadoEm: r.created_at.getTime(),
  }
}

const PLANO_SELECT = `SELECT w.*, p.name AS proposer, a.name AS approver FROM weekly_reward_plans w
  LEFT JOIN players p ON p.id = w.proposed_by LEFT JOIN players a ON a.id = w.approved_by`

/** Semana atual (segunda, horário de Brasília) e a próxima. */
export function semanas() {
  const atual = weekKey(weekStartMs())
  const prox = weekKey(weekStartMs() + 7 * 86400_000)
  return { atual, proxima: prox }
}

export async function listarPlanos(atorId: string): Promise<{ planos: PlanoSemanal[]; semanas: { atual: string; proxima: string }; autorizacoes: { id: string; nome: string; ref: string | null }[] }> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'dv.criar', undefined, 'Só a equipe vê as recompensas semanais.')
  const rows = await run<PlanoRow>(pool, `${PLANO_SELECT} ORDER BY w.week_start DESC, w.created_at DESC LIMIT 80`)
  const aut = can(ator, 'autorizacao.gerenciar')
    ? await run<{ id: string; nome: string; ref: string | null }>(
        pool,
        `SELECT s.id::text AS id, p.name AS nome, s.ref FROM staff_authorizations s JOIN players p ON p.id = s.grantee_id
          WHERE s.scope = 'recompensa.semanal' AND s.revoked_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now()) ORDER BY s.granted_at DESC`,
      )
    : []
  return { planos: rows.map((r) => toPlano(ator, r)), semanas: semanas(), autorizacoes: aut }
}

async function validarPlano(c: Queryable, raw: Record<string, unknown>) {
  const semana = str(raw.semana, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) throw new RecordError('Semana inválida.')
  const jogo = JOGOS.includes(String(raw.jogo)) ? String(raw.jogo) : null
  if (!jogo) throw new RecordError('Jogo inválido.')
  if (!PLANO_CRITERIOS.includes(raw.criterio as PlanoCriterio)) throw new RecordError('Critério inválido.')
  const recurso = String(raw.recurso)
  if (!['item', 'tempo', 'carta', 'convite'].includes(recurso)) throw new RecordError('Recurso inválido.')
  const quantidade = Math.floor(Number(raw.quantidade))
  if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 1_000_000) throw new RecordError('Quantidade inválida.')
  let chave: string | null = null
  if (recurso === 'item') {
    chave = str(raw.chave, 80)
    // Seleção de itens EXISTENTES do catálogo (a equipe não cria cosméticos por aqui).
    const [d] = await run(c, 'SELECT 1 FROM item_defs WHERE key = $1 AND active', [chave])
    if (!d) throw new RecordError('Item desconhecido.')
  } else if (recurso === 'carta') {
    chave = str(raw.chave, 80)
    if (!/^[a-z0-9_-]{1,80}$/.test(chave)) throw new RecordError('Carta inválida.')
  }
  return { semana, jogo, criterio: raw.criterio as PlanoCriterio, recurso, chave, quantidade, nota: str(raw.nota, 300) || null }
}

/** Owner cria (e pode aprovar na hora); Anfitrião propõe; Dealer sugere. */
export async function criarPlano(atorId: string, raw: Record<string, unknown>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    if (ator.cargo === 'player') throw new RecordError('Você não tem permissão para isso.', 403)
    const v = await validarPlano(c, raw)
    const status: PlanoStatus = ator.cargo === 'dealer' ? 'sugerida' : 'proposta'
    const [r] = await run<{ id: string }>(
      c,
      `INSERT INTO weekly_reward_plans (week_start, game, criterion, resource, resource_key, quantity, note, status, proposed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [v.semana, v.jogo, v.criterio, v.recurso, v.chave, v.quantidade, v.nota, status, ator.id],
    )
    await run(c, "INSERT INTO weekly_reward_log (plan_id, actor_id, action, data) VALUES ($1, $2, 'criado', $3)", [r.id, ator.id, JSON.stringify(v)])
    if (raw.aprovar === true && can(ator, 'recompensa.aprovar', alvoPlano({ week_start: v.semana, proposed_by: ator.id }))) await aprovarIn(c, ator, r.id)
    return r.id
  })
}

async function lockPlano(c: Queryable, id: string): Promise<PlanoRow> {
  if (!UUID_RE.test(id)) throw new RecordError('ID inválido.')
  await run(c, 'SELECT 1 FROM weekly_reward_plans WHERE id = $1 FOR UPDATE', [id])
  const [r] = await run<PlanoRow>(c, `${PLANO_SELECT} WHERE w.id = $1`, [id])
  if (!r) throw new RecordError('Plano não encontrado.', 404)
  return r
}

export async function editarPlano(atorId: string, id: string, raw: Record<string, unknown>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const r = await lockPlano(c, id)
    if (!(ator.cargo === 'owner' || (r.proposed_by === ator.id && ator.cargo !== 'player'))) throw new RecordError('Você não pode editar este plano.', 403)
    const v = await validarPlano(c, { semana: semanaStr(r.week_start), jogo: r.game, criterio: r.criterion, recurso: r.resource, chave: r.resource_key, quantidade: r.quantity, nota: r.note, ...raw })
    await run(c, 'UPDATE weekly_reward_plans SET week_start = $2, game = $3, criterion = $4, resource = $5, resource_key = $6, quantity = $7, note = $8 WHERE id = $1', [
      id,
      v.semana,
      v.jogo,
      v.criterio,
      v.recurso,
      v.chave,
      v.quantidade,
      v.nota,
    ])
    await run(c, "INSERT INTO weekly_reward_log (plan_id, actor_id, action, data) VALUES ($1, $2, 'editado', $3)", [id, ator.id, JSON.stringify(v)])
  })
}

async function aprovarIn(c: Queryable, ator: Ator, id: string) {
  const r = await lockPlano(c, id)
  requireCan(ator, 'recompensa.aprovar', alvoPlano(r), 'Você não pode aprovar este plano (peça autorização ao Owner).')
  if (r.status === 'aprovada') return
  if (r.status !== 'proposta' && r.status !== 'sugerida') throw new RecordError('Só planos pendentes podem ser aprovados.', 409)
  await run(c, "UPDATE weekly_reward_plans SET status = 'aprovada', approved_by = $2, approved_at = now() WHERE id = $1", [id, ator.id])
  await run(c, "INSERT INTO weekly_reward_log (plan_id, actor_id, action) VALUES ($1, $2, 'aprovado')", [id, ator.id])
}

export async function aprovarPlano(atorId: string, id: string) {
  return txAs(atorId, async (c) => aprovarIn(c, await requireActor(atorId, c), id))
}

export async function decidirPlano(atorId: string, id: string, acao: 'rejeitar' | 'cancelar') {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const r = await lockPlano(c, id)
    if (acao === 'rejeitar') requireCan(ator, 'recompensa.aprovar', alvoPlano(r), 'Você não pode rejeitar este plano.')
    else if (!(ator.cargo === 'owner' || r.proposed_by === ator.id)) throw new RecordError('Você não pode cancelar este plano.', 403)
    if (r.status === 'distribuida' || r.status === 'cancelada') throw new RecordError('Este plano já foi encerrado.', 409)
    await run(c, 'UPDATE weekly_reward_plans SET status = $2 WHERE id = $1', [id, acao === 'rejeitar' ? 'rejeitada' : 'cancelada'])
    await run(c, 'INSERT INTO weekly_reward_log (plan_id, actor_id, action) VALUES ($1, $2, $3)', [id, ator.id, acao === 'rejeitar' ? 'rejeitado' : 'cancelado'])
  })
}

/** Quem leva o plano: ranking geral (arcade_week_scores) ou por jogo (arcade_matches), contas de teste fora. */
async function vencedores(c: Queryable, semana: string, jogo: string, criterio: PlanoCriterio): Promise<string[]> {
  const ini = new Date(`${semana}T03:00:00.000Z`) // segunda 00:00 em Brasília
  const fim = new Date(ini.getTime() + 7 * 86400_000)
  const rows =
    jogo === 'geral'
      ? await run<{ player_id: string; pts: number; jogos: number }>(
          c,
          `SELECT s.player_id, s.score AS pts, s.games AS jogos FROM arcade_week_scores s JOIN players p ON p.id = s.player_id
            WHERE s.week_start = $1 AND s.score > 0 AND NOT p.is_test ORDER BY s.score DESC, p.name`,
          [semana],
        )
      : await run<{ player_id: string; pts: number; jogos: number }>(
          c,
          `SELECT m.player_id, sum(m.points)::int AS pts, count(*)::int AS jogos FROM arcade_matches m JOIN players p ON p.id = m.player_id
            WHERE m.game_id = $1 AND m.finished_at >= $2 AND m.finished_at < $3 AND m.mode <> 'treino' AND NOT p.is_test
            GROUP BY m.player_id HAVING sum(m.points) > 0 ORDER BY pts DESC`,
          [jogo, ini, fim],
        )
  if (criterio === 'participacao') return rows.filter((r) => r.jogos >= MIN_WEEK_GAMES).map((r) => r.player_id)
  const n = criterio === 'top1' ? 1 : criterio === 'top3' ? 3 : 10
  return rows.slice(0, n).map((r) => r.player_id)
}

/**
 * Distribui um plano aprovado: uma proposta 'semanal' por vencedor no fluxo da Fundação (aprovada e entregue
 * por quem pode; registro em reward_log/admin_log). Uma vez só (o gatilho sela 'distribuida').
 */
export async function distribuirPlano(atorId: string, id: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const r = await lockPlano(c, id)
    requireCan(ator, 'recompensa.distribuir', alvoPlano(r), 'Você não pode distribuir este plano (peça autorização ao Owner).')
    if (r.status === 'distribuida') return { distribuidos: r.distributed_count, ja: true }
    if (r.status !== 'aprovada') throw new RecordError('Aprove o plano antes de distribuir.', 409)
    const semana = semanaStr(r.week_start)
    const ids = await vencedores(c, semana, r.game, r.criterion)
    let n = 0
    for (const pid of ids) {
      const pid2 = await proposeRewardIn(
        c,
        ator,
        {
          tipo: 'semanal',
          origem: semanaRef(semana),
          destinatarioId: pid,
          recurso: r.resource,
          chave: r.resource_key,
          quantidade: r.quantity,
          justificativa: `Recompensa semanal · ${r.game === 'geral' ? 'ranking geral' : r.game} · ${CRITERIO_LABEL[r.criterion]}`,
        },
        { aprovar: 'se-puder', entregar: true },
      )
      if (pid2) n++
    }
    await run(c, "UPDATE weekly_reward_plans SET status = 'distribuida', distributed_by = $2, distributed_at = now(), distributed_count = $3 WHERE id = $1", [id, ator.id, n])
    await run(c, "INSERT INTO weekly_reward_log (plan_id, actor_id, action, data) VALUES ($1, $2, 'distribuido', $3)", [id, ator.id, JSON.stringify({ destinatarios: n })])
    return { distribuidos: n, ja: false }
  })
}
