import { randomInt } from 'node:crypto'
import { pool } from '@/lib/db'
import { normalizeInvite } from '@/lib/auth'
import { type Ator, can, CARGOS, normalizeCargo } from './cargos'
import type { PlayerRole } from './deadly-votes'
import { RecordError } from './errors'
import { txAs, UUID_RE } from './fundacao-db'
import { consumeItem, grantItem } from './inventario-server'
import { loadPessoa, requireActor } from './permissoes-server'
import { ensureInviteQuota, inviteQuota } from './progresso-server'

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

/**
 * `quota`: convites que o Jogador ainda pode gerar (cota de 1, não renova; mais só como recompensa).
 * null para a equipe (Owner e Anfitrião não usam cota; Dealer não gera convites).
 */
export type InvitesPayload = { role: PlayerRole; canGrant: PlayerRole[]; invites: Invite[]; quota: number | null }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Cargos que o ator pode gerar agora (pela tabela do dono, via can()). */
function grantable(ator: Ator, cota: number): PlayerRole[] {
  return CARGOS.filter((c) => can(ator, 'convite.gerar', { cargo: c, cota }))
}

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
  const ator = await requireActor(playerId)
  const isPlayer = ator.cargo === 'player'
  if (isPlayer) await ensureInviteQuota(ator.id).catch(() => {})
  const quota = isPlayer ? await inviteQuota(ator.id) : null
  const { rows } = await pool.query<Row>(
    `SELECT i.code, i.role, i.note, i.created_at, c.name AS creator, i.used_at, u.name AS used_name, i.is_test
       FROM invite_codes i
       LEFT JOIN players c ON c.id = i.created_by
       LEFT JOIN players u ON u.user_id = i.used_by_user
      WHERE $2 = 'owner' OR i.created_by = $1
      ORDER BY i.used_at IS NOT NULL, i.created_at DESC
      LIMIT 200`,
    [playerId, ator.cargo],
  )
  return {
    role: ator.cargo,
    canGrant: grantable(ator, quota ?? 0),
    quota,
    invites: rows.map((r) => ({
      code: r.code,
      role: normalizeCargo(r.role),
      note: r.note,
      createdAt: r.created_at.toISOString(),
      createdBy: r.creator,
      usedAt: r.used_at?.toISOString() ?? null,
      usedBy: r.used_name,
      isTest: !!r.is_test,
    })),
  }
}

/**
 * Gera um convite. Owner: qualquer cargo; Anfitrião: Jogador ou Dealer (o Dealer nasce sob ele);
 * Jogador: só Jogador, gastando 1 da cota (item 'convite'); Dealer: não gera.
 * Convite de Dealer gerado pelo Owner usa `supervisorId` (Anfitrião) ou, sem ele, o próprio Owner.
 */
export async function createInvite(playerId: string, input: Record<string, unknown>) {
  return txAs(playerId, async (c) => {
    const ator = await requireActor(playerId, c)
    const want = normalizeCargo(input.role ?? 'player')
    const cota = ator.cargo === 'player' ? await inviteQuota(ator.id, c) : 0
    if (!can(ator, 'convite.gerar', { cargo: want, cota })) {
      throw new RecordError(ator.cargo === 'player' ? 'Você não tem convites disponíveis.' : ator.cargo === 'dealer' ? 'Dealers não geram convites.' : 'Você não pode gerar convites deste cargo.', 403)
    }
    let supervisor: string | null = null
    if (want === 'dealer') {
      if (ator.cargo === 'anfitriao') supervisor = ator.id
      else {
        const raw = typeof input.supervisorId === 'string' && UUID_RE.test(input.supervisorId) ? input.supervisorId : null
        const sup = raw ? await loadPessoa(raw, c) : null
        if (raw && (!sup || (sup.cargo !== 'anfitriao' && sup.cargo !== 'owner'))) throw new RecordError('O supervisor precisa ser um Anfitrião.')
        supervisor = sup?.id ?? ator.id
      }
    }
    const note = typeof input.note === 'string' ? input.note.trim().slice(0, 60) || null : null
    // Só o Owner marca convites de teste.
    const isTest = can(ator, 'convite.teste') && input.test === true
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode()
      const { rowCount } = await c.query(
        'INSERT INTO invite_codes (code, role, note, created_by, is_test, supervisor_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING',
        [code, want, note, playerId, isTest, supervisor],
      )
      if (rowCount) {
        if (ator.cargo === 'player') await consumeItem({ playerId: ator.id, item: 'convite', quantidade: 1, motivo: 'convite_gerado', ref: code }, c)
        return code
      }
    }
    throw new RecordError('Não foi possível gerar um código. Tente de novo.', 500)
  })
}

/** Revoga um convite ainda não usado. Se era da cota de um Jogador, a unidade volta. */
export async function revokeInvite(playerId: string, raw: unknown) {
  return txAs(playerId, async (c) => {
    const ator = await requireActor(playerId, c)
    const code = normalizeInvite(raw)
    const { rows } = await c.query<{ code: string }>(
      `DELETE FROM invite_codes WHERE code = $1 AND used_at IS NULL AND ($3 = 'owner' OR created_by = $2) RETURNING code`,
      [code, playerId, ator.cargo],
    )
    if (!rows.length) throw new RecordError('Convite não encontrado ou já utilizado.', 404)
    if (ator.cargo === 'player') {
      await grantItem({ playerId: ator.id, item: 'convite', quantidade: 1, motivo: 'convite_revogado', ref: code, idem: `convite-revogado:${code}` }, c)
    }
  })
}
