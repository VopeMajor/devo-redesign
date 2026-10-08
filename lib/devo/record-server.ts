import { pool } from '@/lib/db'
import type { DeadlyVote, DeadlyVoteStatus, PlayerRole, RecordPayload, StaffBoard, StaffEntry } from './deadly-votes'

export class RecordError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const STATUSES: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'cancelado', 'falha']
const ROLES: PlayerRole[] = ['player', 'dealer', 'admin']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const AVATAR_RE = /^data:image\/(jpeg|webp|png);base64,([A-Za-z0-9+/=]+)$/
const MAX_AVATAR_BYTES = 180_000

type VoteRow = {
  id: string
  number: number
  title: string
  arc: string | null
  briefing: string | null
  status: DeadlyVoteStatus
  starts_at: Date
  ends_at: Date | null
  max_participants: number | null
  participants: number
  joined_at: Date | null
  outcome: 'sobreviveu' | 'eliminado' | null
  survivors: string | number
  eliminated: string | number
}

function toVote(r: VoteRow): DeadlyVote {
  return {
    id: r.id,
    number: r.number,
    title: r.title,
    arc: r.arc,
    briefing: r.briefing,
    status: r.status,
    startsAt: r.starts_at.getTime(),
    endsAt: r.ends_at?.getTime() ?? null,
    maxParticipants: r.max_participants,
    participants: Number(r.participants),
    joined: r.joined_at !== null,
    outcome: r.outcome,
    survivors: Number(r.survivors ?? 0),
    eliminated: Number(r.eliminated ?? 0),
  }
}

/** Colunas comuns: inscritos e resultado público (sobreviventes / eliminados) de cada caso. */
const VOTE_COUNTS = `(SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id) AS participants,
              (SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id AND c.outcome = 'sobreviveu') AS survivors,
              (SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id AND c.outcome = 'eliminado') AS eliminated`

export async function getRecord(playerId: string): Promise<RecordPayload> {
  const [me] = (
    await pool.query<{ role: string; avatar_updated_at: Date | null }>('SELECT role, avatar_updated_at FROM players WHERE id = $1', [playerId])
  ).rows
  if (!me) throw new RecordError('Registro não encontrado.', 404)
  const votes = (
    await pool.query<VoteRow>(
      `SELECT v.id, v.number, v.title, v.arc, v.briefing, v.status, v.starts_at, v.ends_at, v.max_participants,
              ${VOTE_COUNTS},
              e.joined_at, e.outcome
         FROM deadly_votes v
         LEFT JOIN deadly_vote_entries e ON e.vote_id = v.id AND e.player_id = $1
        -- Histórico público: convocações abertas, votos em andamento e casos encerrados
        -- (exceto cancelados de que o participante não fez parte).
        WHERE e.player_id IS NOT NULL OR v.status <> 'cancelado'
        ORDER BY v.starts_at DESC
        LIMIT 100`,
      [playerId],
    )
  ).rows
  const role = (ROLES as string[]).includes(me.role) ? (me.role as PlayerRole) : 'player'
  return { role, avatarVersion: me.avatar_updated_at?.getTime() ?? null, votes: votes.map(toVote) }
}

export async function joinVote(playerId: string, voteId: string) {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const [v] = (
      await c.query<{ status: string; max_participants: number | null }>('SELECT status, max_participants FROM deadly_votes WHERE id = $1 FOR UPDATE', [voteId])
    ).rows
    if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
    if (v.status !== 'convocado') throw new RecordError('As inscrições deste Deadly Vote estão encerradas.', 409)
    if (v.max_participants) {
      const [{ n }] = (await c.query<{ n: string }>('SELECT count(*) AS n FROM deadly_vote_entries WHERE vote_id = $1', [voteId])).rows
      if (Number(n) >= v.max_participants) throw new RecordError('Não há mais vagas neste Deadly Vote.', 409)
    }
    await c.query('INSERT INTO deadly_vote_entries (vote_id, player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [voteId, playerId])
    await c.query('COMMIT')
  } catch (err) {
    await c.query('ROLLBACK')
    throw err
  } finally {
    c.release()
  }
}

export async function leaveVote(playerId: string, voteId: string) {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  const res = await pool.query(
    `DELETE FROM deadly_vote_entries e USING deadly_votes v
      WHERE e.vote_id = v.id AND v.id = $1 AND e.player_id = $2 AND v.status = 'convocado'`,
    [voteId, playerId],
  )
  if (!res.rowCount) throw new RecordError('Não é possível sair deste Deadly Vote agora.', 409)
}

export async function setAvatar(playerId: string, dataUrl: unknown) {
  if (dataUrl === null) {
    await pool.query('UPDATE players SET avatar = NULL, avatar_updated_at = now() WHERE id = $1', [playerId])
    return
  }
  const m = typeof dataUrl === 'string' ? AVATAR_RE.exec(dataUrl) : null
  if (!m) throw new RecordError('Formato de imagem inválido.')
  if (Math.floor((m[2].length * 3) / 4) > MAX_AVATAR_BYTES) throw new RecordError('Imagem grande demais.')
  await pool.query('UPDATE players SET avatar = $2, avatar_updated_at = now() WHERE id = $1', [playerId, dataUrl])
}

export async function getAvatar(playerId: string) {
  const [row] = (await pool.query<{ avatar: string | null }>('SELECT avatar FROM players WHERE id = $1', [playerId])).rows
  const m = row?.avatar ? AVATAR_RE.exec(row.avatar) : null
  if (!m) return null
  return { type: `image/${m[1]}`, body: Buffer.from(m[2], 'base64') }
}

/* Gestão (Dealer / Admin). Base para o painel de gerência que será criado depois. */

async function requireStaff(playerId: string) {
  const [me] = (await pool.query<{ role: string }>('SELECT role FROM players WHERE id = $1', [playerId])).rows
  if (me?.role !== 'dealer' && me?.role !== 'admin') throw new RecordError('Acesso restrito ao Dealer.', 403)
}

/** Mesa do Dealer: votos recentes (todos os estados) com os inscritos e o resultado de cada um. */
export async function getStaffBoard(playerId: string): Promise<StaffBoard> {
  await requireStaff(playerId)
  const votes = (
    await pool.query<VoteRow>(
      `SELECT v.id, v.number, v.title, v.arc, v.briefing, v.status, v.starts_at, v.ends_at, v.max_participants,
              ${VOTE_COUNTS},
              NULL::timestamptz AS joined_at, NULL::text AS outcome
         FROM deadly_votes v
        ORDER BY (v.status IN ('convocado', 'em-progresso')) DESC, v.starts_at DESC
        LIMIT 30`,
    )
  ).rows
  if (!votes.length) return { votes: [] }
  const entries = (
    await pool.query<{ vote_id: string; player_id: string; name: string | null; outcome: 'sobreviveu' | 'eliminado' | null }>(
      `SELECT e.vote_id, e.player_id, p.name, e.outcome
         FROM deadly_vote_entries e
         JOIN players p ON p.id = e.player_id
        WHERE e.vote_id = ANY($1::uuid[])
        ORDER BY e.joined_at`,
      [votes.map((v) => v.id)],
    )
  ).rows
  const byVote = new Map<string, StaffEntry[]>()
  for (const e of entries) {
    const list = byVote.get(e.vote_id) ?? []
    list.push({ playerId: e.player_id, name: e.name ?? 'Sem nome', outcome: e.outcome })
    byVote.set(e.vote_id, list)
  }
  return { votes: votes.map((r) => ({ ...toVote(r), entries: byVote.get(r.id) ?? [] })) }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function createVote(playerId: string, input: Record<string, unknown>) {
  await requireStaff(playerId)
  const title = text(input.title, 60)
  const startsAt = Number(input.startsAt)
  if (title.length < 2) throw new RecordError('Título obrigatório.')
  if (!Number.isFinite(startsAt)) throw new RecordError('Data de início inválida.')
  const max = input.maxParticipants == null ? null : Math.max(1, Math.min(999, Math.floor(Number(input.maxParticipants))))
  const [row] = (
    await pool.query<{ id: string }>(
      `INSERT INTO deadly_votes (title, arc, briefing, starts_at, max_participants, created_by)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6) RETURNING id`,
      [title, text(input.arc, 60) || null, text(input.briefing, 600) || null, startsAt, Number.isFinite(max) ? max : null, playerId],
    )
  ).rows
  return row.id
}

export async function setVoteStatus(playerId: string, voteId: string, status: unknown) {
  await requireStaff(playerId)
  if (!UUID_RE.test(voteId) || !(STATUSES as unknown[]).includes(status)) throw new RecordError('Dados inválidos.')
  await pool.query(
    `UPDATE deadly_votes SET status = $2, updated_at = now(),
            ends_at = CASE WHEN $2 IN ('concluido', 'cancelado', 'falha') THEN coalesce(ends_at, now()) ELSE ends_at END
      WHERE id = $1`,
    [voteId, status],
  )
}

export async function setEntryOutcome(playerId: string, voteId: string, targetId: string, outcome: unknown) {
  await requireStaff(playerId)
  if (!UUID_RE.test(voteId) || !UUID_RE.test(targetId) || (outcome !== null && outcome !== 'sobreviveu' && outcome !== 'eliminado')) {
    throw new RecordError('Dados inválidos.')
  }
  await pool.query('UPDATE deadly_vote_entries SET outcome = $3 WHERE vote_id = $1 AND player_id = $2', [voteId, targetId, outcome])
}
