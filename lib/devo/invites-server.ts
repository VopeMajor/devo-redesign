import { randomInt } from 'node:crypto'
import { pool } from '@/lib/db'
import { normalizeInvite } from '@/lib/auth'
import type { PlayerRole } from './deadly-votes'
import { RecordError } from './record-server'

export type Invite = {
  code: string
  role: PlayerRole
  note: string | null
  createdAt: string
  createdBy: string | null
  usedAt: string | null
  usedBy: string | null
  /** Convite de conta de teste (fora de ranking, apostas e prêmios). */
  isTest: boolean
}

export type InvitesPayload = { role: PlayerRole; canGrant: PlayerRole[]; invites: Invite[] }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROLES: PlayerRole[] = ['player', 'dealer', 'admin']

async function staffRole(playerId: string): Promise<PlayerRole> {
  const [me] = (await pool.query<{ role: PlayerRole }>('SELECT role FROM players WHERE id = $1', [playerId])).rows
  if (me?.role !== 'dealer' && me?.role !== 'admin') throw new RecordError('Acesso restrito ao Dealer.', 403)
  return me.role
}

const grantable = (role: PlayerRole): PlayerRole[] => (role === 'admin' ? ROLES : ['player'])

function newCode() {
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  return `DEVO-${s.slice(0, 4)}-${s.slice(4)}`
}

type Row = {
  code: string
  role: PlayerRole
  note: string | null
  created_at: Date
  creator: string | null
  used_at: Date | null
  used_name: string | null
  is_test: boolean
}

export async function listInvites(playerId: string): Promise<InvitesPayload> {
  const role = await staffRole(playerId)
  const { rows } = await pool.query<Row>(
    `SELECT i.code, i.role, i.note, i.created_at, c.name AS creator, i.used_at, u.name AS used_name, i.is_test
       FROM invite_codes i
       LEFT JOIN players c ON c.id = i.created_by
       LEFT JOIN players u ON u.user_id = i.used_by_user
      WHERE $2 = 'admin' OR i.created_by = $1
      ORDER BY i.used_at IS NOT NULL, i.created_at DESC
      LIMIT 200`,
    [playerId, role],
  )
  return {
    role,
    canGrant: grantable(role),
    invites: rows.map((r) => ({
      code: r.code,
      role: r.role,
      note: r.note,
      createdAt: r.created_at.toISOString(),
      createdBy: r.creator,
      usedAt: r.used_at?.toISOString() ?? null,
      usedBy: r.used_name,
      isTest: !!r.is_test,
    })),
  }
}

export async function createInvite(playerId: string, input: Record<string, unknown>) {
  const role = await staffRole(playerId)
  const want = ROLES.includes(input.role as PlayerRole) ? (input.role as PlayerRole) : 'player'
  if (!grantable(role).includes(want)) throw new RecordError('Você só pode gerar convites de jogador.', 403)
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 60) || null : null
  // Só o admin marca convites de teste.
  const isTest = role === 'admin' && input.test === true
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    const { rowCount } = await pool.query(
      'INSERT INTO invite_codes (code, role, note, created_by, is_test) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING',
      [code, want, note, playerId, isTest],
    )
    if (rowCount) return code
  }
  throw new RecordError('Não foi possível gerar um código. Tente de novo.', 500)
}

export async function revokeInvite(playerId: string, raw: unknown) {
  const role = await staffRole(playerId)
  const { rowCount } = await pool.query(
    `DELETE FROM invite_codes WHERE code = $1 AND used_at IS NULL AND ($3 = 'admin' OR created_by = $2)`,
    [normalizeInvite(raw), playerId, role],
  )
  if (!rowCount) throw new RecordError('Convite não encontrado ou já utilizado.', 404)
}
