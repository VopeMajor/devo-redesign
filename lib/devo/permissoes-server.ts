import 'server-only'
import { pool } from '@/lib/db'
import { type Acao, type Alvos, type Ator, can, type Cargo, cargoVisivel, normalizeCargo, type PessoaAlvo, type VotoAlvo } from './cargos'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'

/**
 * Carrega o ator (cargo, supervisor e autorizações ativas). `null` se o jogador não existe.
 * É a única forma correta de obter o `Ator` para `can()` no servidor.
 */
export async function loadActor(playerId: string, q: Queryable = pool): Promise<Ator | null> {
  if (!UUID_RE.test(playerId)) return null
  const [p] = await run<{ id: string; role: string; supervisor_id: string | null }>(
    q,
    'SELECT id, role, supervisor_id FROM players WHERE id = $1',
    [playerId],
  )
  if (!p) return null
  const cargo = normalizeCargo(p.role)
  const autorizacoes =
    cargo === 'anfitriao'
      ? (
          await run<{ scope: string; ref: string | null }>(
            q,
            `SELECT scope, ref FROM staff_authorizations
              WHERE grantee_id = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
            [playerId],
          ).catch(() => [])
        ).map((a) => ({ escopo: a.scope, ref: a.ref }))
      : []
  return { id: p.id, cargo, supervisorId: p.supervisor_id, autorizacoes }
}

export async function requireActor(playerId: string, q: Queryable = pool): Promise<Ator> {
  const ator = await loadActor(playerId, q)
  if (!ator) throw new RecordError('Registro não encontrado.', 404)
  return ator
}

/** Lança 403 se `can()` negar. Mensagem padrão genérica (não revela cargos). */
export function requireCan<A extends Acao>(ator: Ator | null, acao: A, alvo?: Alvos[A], message = 'Você não tem permissão para isso.') {
  if (!can(ator, acao, alvo)) throw new RecordError(message, 403)
}

/** Pessoa-alvo para regras de cargo. */
export async function loadPessoa(id: string, q: Queryable = pool): Promise<PessoaAlvo | null> {
  if (!UUID_RE.test(id)) return null
  const [p] = await run<{ id: string; role: string; supervisor_id: string | null }>(q, 'SELECT id, role, supervisor_id FROM players WHERE id = $1', [id])
  return p ? { id: p.id, cargo: normalizeCargo(p.role), supervisorId: p.supervisor_id } : null
}

/** Dados de um Deadly Vote para `can(ator, 'dv.editar', voto)`. */
export async function loadVotoAlvo(voteId: string, q: Queryable = pool): Promise<VotoAlvo | null> {
  if (!UUID_RE.test(voteId)) return null
  const [v] = await run<{ created_by: string | null; supervisor_id: string | null }>(
    q,
    'SELECT v.created_by, c.supervisor_id FROM deadly_votes v LEFT JOIN players c ON c.id = v.created_by WHERE v.id = $1',
    [voteId],
  )
  return v ? { criadoPor: v.created_by, supervisorDoCriador: v.supervisor_id } : null
}

/** Exige poder editar o voto (404 se não existir). */
export async function requireVotoEditavel(ator: Ator, voteId: string, q: Queryable = pool) {
  const voto = await loadVotoAlvo(voteId, q)
  if (!voto) throw new RecordError('Deadly Vote não encontrado.', 404)
  requireCan(ator, 'dv.editar', voto, 'Você só pode alterar os Deadly Votes sob sua responsabilidade.')
  return voto
}

/**
 * Muda o cargo de alguém. Dealer exige supervisor (Anfitrião ou Owner); Anfitrião só promove Jogador a
 * Dealer sob si ou rebaixa um Dealer seu. Tudo vai para admin_log pelo gatilho.
 */
export async function setCargo(atorId: string, alvoId: string, novoCargoRaw: unknown, supervisorRaw?: unknown) {
  const novoCargo = normalizeCargo(novoCargoRaw)
  if (novoCargoRaw !== novoCargo) throw new RecordError('Cargo inválido.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const pessoa = await loadPessoa(alvoId, c)
    if (!pessoa) throw new RecordError('Jogador não encontrado.', 404)
    let supervisorId: string | null = null
    if (novoCargo === 'dealer') {
      supervisorId = typeof supervisorRaw === 'string' && UUID_RE.test(supervisorRaw) ? supervisorRaw : ator.cargo === 'anfitriao' ? ator.id : null
      if (!supervisorId && ator.cargo === 'owner') supervisorId = ator.id
    }
    requireCan(ator, 'cargo.gerenciar', { pessoa, novoCargo, novoSupervisorId: supervisorId })
    await run(c, 'UPDATE players SET role = $2, supervisor_id = $3 WHERE id = $1', [alvoId, novoCargo, supervisorId])
    return { id: alvoId, cargo: novoCargo, supervisorId }
  })
}

/** Owner transfere um Dealer para outro Anfitrião. O histórico fica em dealer_supervisions e nas propostas antigas. */
export async function transferDealer(atorId: string, dealerId: string, novoSupervisorId: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const pessoa = await loadPessoa(dealerId, c)
    if (!pessoa || pessoa.cargo !== 'dealer') throw new RecordError('Dealer não encontrado.', 404)
    requireCan(ator, 'dealer.transferir', { pessoa })
    if (!UUID_RE.test(novoSupervisorId)) throw new RecordError('Supervisor inválido.')
    await run(c, 'UPDATE players SET supervisor_id = $2 WHERE id = $1', [dealerId, novoSupervisorId])
  })
}

export type EquipeMembro = { id: string; name: string; cargo: Cargo; supervisorId: string | null; supervisorName: string | null; since: number | null }

/** Mesa de equipe: Owner vê todos os Anfitriões e Dealers; Anfitrião vê os próprios Dealers. */
export async function listEquipe(atorId: string): Promise<EquipeMembro[]> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'equipe.ver')
  const rows = await run<{ id: string; name: string; role: string; supervisor_id: string | null; sup_name: string | null; since: Date | null }>(
    pool,
    `SELECT p.id, p.name, p.role, p.supervisor_id, s.name AS sup_name,
            (SELECT max(d.started_at) FROM dealer_supervisions d WHERE d.dealer_id = p.id AND d.ended_at IS NULL) AS since
       FROM players p LEFT JOIN players s ON s.id = p.supervisor_id
      WHERE ($2 AND p.role IN ('owner', 'anfitriao', 'dealer')) OR (p.role = 'dealer' AND p.supervisor_id = $1)
      ORDER BY p.role, p.name`,
    [ator.id, ator.cargo === 'owner'],
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    cargo: cargoVisivel(ator, r.role),
    supervisorId: r.supervisor_id,
    supervisorName: r.sup_name,
    since: r.since?.getTime() ?? null,
  }))
}

/** Histórico de supervisores de um Dealer (Owner, ou o Anfitrião que o supervisiona/supervisionou). */
export async function supervisionHistory(atorId: string, dealerId: string) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'equipe.ver')
  const rows = await run<{ supervisor_id: string | null; name: string | null; started_at: Date; ended_at: Date | null }>(
    pool,
    `SELECT d.supervisor_id, s.name, d.started_at, d.ended_at FROM dealer_supervisions d
       LEFT JOIN players s ON s.id = d.supervisor_id WHERE d.dealer_id = $1 ORDER BY d.started_at`,
    [dealerId],
  )
  if (ator.cargo !== 'owner' && !rows.some((r) => r.supervisor_id === ator.id)) throw new RecordError('Você não tem permissão para isso.', 403)
  return rows.map((r) => ({ supervisorId: r.supervisor_id, supervisorName: r.name, startedAt: r.started_at.getTime(), endedAt: r.ended_at?.getTime() ?? null }))
}

/** Owner dá uma autorização pontual a um Anfitrião (ex.: 'recompensa.semanal' para uma semana). */
export async function grantAuthorization(atorId: string, input: { granteeId: string; escopo: string; ref?: string | null; expiresAt?: number | null }) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'autorizacao.gerenciar')
    const alvo = await loadPessoa(input.granteeId, c)
    if (!alvo || alvo.cargo !== 'anfitriao') throw new RecordError('Autorizações são dadas a Anfitriões.', 400)
    if (!/^[a-z.]{3,40}$/.test(input.escopo)) throw new RecordError('Escopo inválido.')
    const ref = typeof input.ref === 'string' && input.ref.trim() ? input.ref.trim().slice(0, 60) : null
    const expires = input.expiresAt && Number.isFinite(input.expiresAt) ? new Date(input.expiresAt) : null
    const [row] = await run<{ id: string }>(
      c,
      'INSERT INTO staff_authorizations (grantee_id, scope, ref, granted_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [alvo.id, input.escopo, ref, ator.id, expires],
    )
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, 'autorizacao.concedida', $2, $3, $4)", [
      ator.id,
      alvo.id,
      String(row.id),
      JSON.stringify({ escopo: input.escopo, ref, expiresAt: expires }),
    ])
    return String(row.id)
  })
}

export async function revokeAuthorization(atorId: string, id: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'autorizacao.gerenciar')
    const rows = await run<{ grantee_id: string }>(c, 'UPDATE staff_authorizations SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING grantee_id', [
      Number(id),
    ])
    if (!rows.length) throw new RecordError('Autorização não encontrada.', 404)
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, ref) VALUES ($1, 'autorizacao.revogada', $2, $3)", [ator.id, rows[0].grantee_id, id])
  })
}

/** Resumo de um jogador para a equipe (sem senha, e-mail ou dados privados). */
export type PlayerSummary = {
  id: string
  name: string
  cargo: Cargo
  cartas: number
  fragmentos: number
  deadlyVotes: { total: number; sobreviveu: number; eliminado: number }
  /** Só em 'completo': inventário inteiro, karma e últimos registros. */
  completo?: {
    karma: number
    itens: { key: string; quantity: number }[]
    desbloqueios: string[]
    log: { at: number; action: string; data: unknown }[]
  }
}

export async function getPlayerSummary(atorId: string, alvoId: string, nivel: 'resumido' | 'completo' = 'resumido'): Promise<PlayerSummary> {
  const ator = await requireActor(atorId)
  requireCan(ator, nivel === 'completo' ? 'dados.completos' : 'dados.resumidos', { pessoaId: alvoId })
  const [p] = await run<{ id: string; name: string; role: string; karma: number; cartas: string | null; fragmentos: string | null }>(
    pool,
    `SELECT p.id, p.name, p.role, p.karma,
            (SELECT jsonb_array_length(s.data->'inventory') FROM player_saves s WHERE s.player_id = p.id) AS cartas,
            (SELECT quantity FROM player_items i WHERE i.player_id = p.id AND i.item_key = 'fragmento_arcano') AS fragmentos
       FROM players p WHERE p.id = $1`,
    [alvoId],
  )
  if (!p) throw new RecordError('Jogador não encontrado.', 404)
  const [dv] = await run<{ total: string; s: string; e: string }>(
    pool,
    `SELECT count(*) AS total, count(*) FILTER (WHERE outcome = 'sobreviveu') AS s, count(*) FILTER (WHERE outcome = 'eliminado') AS e
       FROM deadly_vote_entries WHERE player_id = $1`,
    [alvoId],
  )
  const out: PlayerSummary = {
    id: p.id,
    name: p.name,
    cargo: cargoVisivel(ator, p.role),
    cartas: Number(p.cartas ?? 0),
    fragmentos: Number(p.fragmentos ?? 0),
    deadlyVotes: { total: Number(dv?.total ?? 0), sobreviveu: Number(dv?.s ?? 0), eliminado: Number(dv?.e ?? 0) },
  }
  if (nivel === 'completo') {
    const [itens, flags, log] = await Promise.all([
      run<{ item_key: string; quantity: string }>(pool, 'SELECT item_key, quantity FROM player_items WHERE player_id = $1 AND quantity > 0 ORDER BY item_key', [alvoId]),
      run<{ flag: string }>(pool, 'SELECT flag FROM player_unlocks WHERE player_id = $1 ORDER BY flag', [alvoId]),
      run<{ at: Date; action: string; data: unknown }>(pool, 'SELECT at, action, data FROM admin_log WHERE target_id = $1 ORDER BY at DESC LIMIT 50', [alvoId]),
    ])
    out.completo = {
      karma: p.karma,
      itens: itens.map((i) => ({ key: i.item_key, quantity: Number(i.quantity) })),
      desbloqueios: flags.map((f) => f.flag),
      log: log.map((l) => ({ at: l.at.getTime(), action: l.action, data: l.data })),
    }
  }
  return out
}

/** Log administrativo (Owner). Filtros opcionais por ação e por alvo. */
export async function listAdminLog(atorId: string, filtro: { action?: string | null; targetId?: string | null; limit?: number } = {}) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'admin.global')
  const rows = await run<{ id: string; at: Date; actor_id: string | null; actor: string | null; action: string; target_id: string | null; target: string | null; ref: string | null; data: unknown }>(
    pool,
    `SELECT l.id, l.at, l.actor_id, a.name AS actor, l.action, l.target_id, t.name AS target, l.ref, l.data
       FROM admin_log l LEFT JOIN players a ON a.id = l.actor_id LEFT JOIN players t ON t.id = l.target_id
      WHERE ($1::text IS NULL OR l.action LIKE $1 || '%') AND ($2::uuid IS NULL OR l.target_id = $2)
      ORDER BY l.at DESC, l.id DESC LIMIT $3`,
    [filtro.action || null, filtro.targetId && UUID_RE.test(filtro.targetId) ? filtro.targetId : null, Math.min(500, Math.max(1, filtro.limit ?? 100))],
  )
  return rows.map((r) => ({ ...r, id: String(r.id), at: r.at.getTime() }))
}
