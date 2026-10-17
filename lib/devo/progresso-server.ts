import 'server-only'
import { pool } from '@/lib/db'
import { normalizeCargo, seesAllSystems } from './cargos'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { itemBalance, pendingCardCount, readInventory } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { arcanoInfo, isArcano } from './virtudes'
import { type Acesso, destinoDoKarma, type EuPayload, isUnlockFlag, UNLOCK_FLAGS, type UnlockFlag } from './progresso'

/* ------------------------------------------------------------------ Desbloqueios */

/**
 * Flags efetivas do jogador. Owner e Anfitrião: tudo liberado (DIRECAO-3 §1b). Demais cargos (inclusive contas
 * antigas): só o que foi desbloqueado (Deadly Vote tutorial vencido, narrativa ou override do Owner).
 */
export async function getUnlocks(playerId: string, q: Queryable = pool): Promise<{ flags: Record<UnlockFlag, boolean>; tudoLiberado: boolean }> {
  const [p] = await run<{ role: string }>(q, 'SELECT role FROM players WHERE id = $1', [playerId])
  const tudo = !!p && seesAllSystems(normalizeCargo(p.role))
  const have = tudo ? [] : await run<{ flag: string }>(q, 'SELECT flag FROM player_unlocks WHERE player_id = $1', [playerId])
  const set = new Set(have.map((h) => h.flag))
  const flags = Object.fromEntries(UNLOCK_FLAGS.map((f) => [f, tudo || set.has(f)])) as Record<UnlockFlag, boolean>
  return { flags, tudoLiberado: tudo }
}

/**
 * FUNÇÃO ÚNICA de acesso (DIRECAO-3 §7): Owner e Anfitrião recebem tudo liberado, inclusive as travas antigas
 * do cliente (Sala de Jogos não revelada, apps não vistos, tutoriais). Para os demais: flags do servidor +
 * `arcadeUnlocked` do save. Qualquer tela nova deve consultar isto (via /api/eu → `acesso`).
 */
export async function unlocks(playerId: string, q: Queryable = pool): Promise<Acesso> {
  const { flags, tudoLiberado } = await getUnlocks(playerId, q)
  if (tudoLiberado) return { total: true, sistemas: flags, salaJogos: true, todosApps: true, pularTutoriais: true }
  const [s] = await run<{ arcade: boolean | null }>(q, "SELECT (data->>'arcadeUnlocked')::boolean AS arcade FROM player_saves WHERE player_id = $1", [playerId])
  return { total: false, sistemas: flags, salaJogos: !!s?.arcade, todosApps: false, pularTutoriais: false }
}

export async function hasUnlock(playerId: string, flag: UnlockFlag, q: Queryable = pool) {
  const [r] = await run<{ ok: boolean }>(q, 'SELECT devo_tem_desbloqueio($1, $2) AS ok', [playerId, flag])
  return !!r?.ok
}

/** Exige a flag (403 com mensagem neutra). Use no início das rotas do Poço, Torres, Salão etc. */
export async function requireUnlock(playerId: string, flag: UnlockFlag, q: Queryable = pool) {
  if (!(await hasUnlock(playerId, flag, q))) throw new RecordError('Este sistema ainda está trancado.', 403)
}

/**
 * Concede uma flag (idempotente). `fonte`: 'narrativa' | 'sistema' (servidor, sem ator) ou 'owner' (use
 * `ownerSetUnlock`, que checa permissão e registra no log).
 */
export async function grantUnlock(playerId: string, flag: UnlockFlag, fonte: 'narrativa' | 'sistema' | 'owner' | 'deadly_vote', ref: string | null = null, atorId: string | null = null, q: Queryable = pool) {
  if (!isUnlockFlag(flag)) throw new RecordError('Flag desconhecida.')
  const rows = await run(
    q,
    `INSERT INTO player_unlocks (player_id, flag, source, ref, actor_id) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (player_id, flag) DO NOTHING RETURNING flag`,
    [playerId, flag, fonte, ref, atorId],
  )
  return rows.length > 0
}

/** Override do Owner: libera (on = true) ou tranca de novo (on = false) uma flag de um jogador. */
export async function ownerSetUnlock(atorId: string, playerId: string, flagRaw: unknown, on: boolean) {
  if (!isUnlockFlag(flagRaw)) throw new RecordError('Flag desconhecida.')
  const flag = flagRaw
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'desbloqueio.override')
    if (!UUID_RE.test(playerId)) throw new RecordError('Jogador inválido.')
    if (on) await grantUnlock(playerId, flag, 'owner', null, ator.id, c)
    else await run(c, 'DELETE FROM player_unlocks WHERE player_id = $1 AND flag = $2', [playerId, flag])
    await run(c, 'INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, $2, $3, $4)', [
      ator.id,
      on ? 'desbloqueio.liberado' : 'desbloqueio.revogado',
      playerId,
      JSON.stringify({ flag }),
    ])
  })
}

/** Aplica de novo as flags de um Deadly Vote concluído (os gatilhos já fazem isso sozinhos; útil após editar `unlocks`). */
export async function applyVoteUnlocks(voteId: string, q: Queryable = pool) {
  const [r] = await run<{ n: number }>(q, 'SELECT devo_dv_desbloquear($1) AS n', [voteId])
  return Number(r?.n ?? 0)
}

/* ------------------------------------------------------------------ Karma */

/**
 * Ajusta o Karma (+ ordem, − caos). Devolve o valor final. Para escolhas de diálogo use `idem`
 * (ex.: `dialogo:galo-casa:escolha-3:<playerId>`) para não somar duas vezes. Sem permissão: é o servidor que decide.
 */
export async function adjustKarma(
  input: { playerId: string; delta: number; motivo: string; ref?: string | null; atorId?: string | null; idem?: string | null },
  q: Queryable = pool,
): Promise<number> {
  const delta = Math.trunc(Number(input.delta))
  const [r] = await run<{ v: number }>(q, 'SELECT devo_karma_ajustar($1, $2, $3, $4, $5, $6) AS v', [
    input.playerId,
    delta,
    input.motivo.slice(0, 60),
    input.ref ?? null,
    input.atorId ?? null,
    input.idem ?? null,
  ])
  return Number(r.v)
}

/** Ajuste manual do Owner (registrado no admin_log). */
export async function ownerAdjustKarma(atorId: string, playerId: string, delta: number, motivo: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'karma.ajustar')
    const v = await adjustKarma({ playerId, delta, motivo: motivo || 'ajuste_owner', atorId: ator.id }, c)
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'karma.ajustado', $2, $3)", [ator.id, playerId, JSON.stringify({ delta, motivo, final: v })])
    return v
  })
}

export async function karmaHistory(playerId: string, limit = 50, q: Queryable = pool) {
  const rows = await run<{ at: Date; delta: number; balance: number; reason: string; ref: string | null }>(
    q,
    'SELECT at, delta, balance, reason, ref FROM karma_log WHERE player_id = $1 ORDER BY at DESC, id DESC LIMIT $2',
    [playerId, Math.min(200, Math.max(1, limit))],
  )
  return rows.map((r) => ({ ...r, at: r.at.getTime() }))
}

/* ------------------------------------------------------------------ Configuração */

export async function getConfig<T = unknown>(key: string, q: Queryable = pool): Promise<{ value: T; provisional: boolean } | null> {
  const [r] = await run<{ value: T; provisional: boolean }>(q, 'SELECT value, provisional FROM devo_config WHERE key = $1', [key])
  return r ?? null
}

export async function listConfig(atorId: string) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'config.editar')
  const rows = await run<{ key: string; value: unknown; provisional: boolean; note: string | null; updated_at: Date }>(
    pool,
    'SELECT key, value, provisional, note, updated_at FROM devo_config ORDER BY key',
  )
  return rows.map((r) => ({ ...r, updated_at: r.updated_at.getTime() }))
}

/** Owner grava uma configuração (ex.: 'poco.probabilidades'). `provisional` marca valores ainda não finais. */
export async function setConfig(atorId: string, key: string, value: unknown, provisional = true, note?: string | null) {
  if (!/^[a-z0-9_.-]{2,60}$/.test(key)) throw new RecordError('Chave inválida.')
  if (value === undefined) throw new RecordError('Valor ausente.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'config.editar')
    await run(
      c,
      `INSERT INTO devo_config (key, value, provisional, note, updated_by, updated_at) VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, provisional = EXCLUDED.provisional,
         note = coalesce(EXCLUDED.note, devo_config.note), updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [key, JSON.stringify(value), provisional, note ?? null, ator.id],
    )
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'config.alterada', $2, $3)", [ator.id, key, JSON.stringify({ value, provisional })])
  })
}

/* ------------------------------------------------------------------ Cota de convites */

/** Garante a cota inicial (1 convite, uma única vez por conta) para Jogadores. Idempotente. */
export async function ensureInviteQuota(playerId: string, q: Queryable = pool) {
  const cfg = await getConfig<number>('convites.cota_inicial', q).catch(() => null)
  const n = Math.max(0, Math.floor(Number(cfg?.value ?? 1)))
  if (!n) return
  await run(q, "SELECT devo_item_grant($1, 'convite', $2, 'cota_inicial', NULL, NULL, $3)", [playerId, n, `cota-inicial:${playerId}`])
}

export async function inviteQuota(playerId: string, q: Queryable = pool) {
  return itemBalance(playerId, 'convite', q)
}

/* ------------------------------------------------------------------ /api/eu */

export async function getEu(playerId: string): Promise<EuPayload> {
  const [base] = await run<{ id: string; role: string }>(pool, 'SELECT id, role FROM players WHERE id = $1', [playerId])
  if (!base) throw new RecordError('Registro não encontrado.', 404)
  // Karma e Arcano vêm de migrações posteriores; se o banco ainda não as tiver, o acesso (cargo e flags) continua
  // valendo — Owner e Anfitrião nunca ficam trancados por uma coluna que falta.
  const [extra] = await run<{ karma: number; arcano: string | null; arcano_estagio: number }>(
    pool,
    'SELECT karma, arcano, arcano_estagio FROM players WHERE id = $1',
    [playerId],
  ).catch((err) => {
    console.error('[eu] colunas de karma/arcano ausentes — aplique scripts/devo-banco-novo.sql', err)
    return [] as { karma: number; arcano: string | null; arcano_estagio: number }[]
  })
  const p = { ...base, karma: extra?.karma ?? 0, arcano: extra?.arcano ?? null, arcano_estagio: extra?.arcano_estagio ?? 0 }
  const cargo = normalizeCargo(p.role)
  if (cargo === 'player') await ensureInviteQuota(p.id).catch(() => {})
  const acesso = await unlocks(p.id)
  const [inventario, cartasPendentes, convites] = await Promise.all([
    readInventory(p.id).catch((err) => {
      console.error('[eu] inventário', err)
      return [] as Awaited<ReturnType<typeof readInventory>>
    }),
    pendingCardCount(p.id).catch(() => 0),
    cargo === 'player' ? inviteQuota(p.id) : Promise.resolve(null),
  ])
  return {
    id: p.id,
    cargo,
    inventario,
    desbloqueios: acesso.sistemas,
    tudoLiberado: acesso.total,
    acesso,
    destino: destinoDoKarma(p.karma),
    convites,
    cartasPendentes,
    arcano: isArcano(p.arcano) ? { ...arcanoInfo(p.arcano), estagio: p.arcano_estagio } : null,
  }
}
