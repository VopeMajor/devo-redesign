import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { cartaExiste, getCardPeso } from './cards'
import { chaveOpcoesArcano, lerOpcoesArcano } from './virtudes'
import {
  type CartaLevada,
  type DeadlyVote,
  type DeadlyVoteStatus,
  DECISIONS,
  type DvPrize,
  type EntryAdmission,
  type EntryDecision,
  normalizeGroupUrl,
  type PlayerRole,
  type PrizeInput,
  type RecordPayload,
  type StaffBoard,
  type StaffEntry,
  type StaffRewardTally,
  type VoteAdmission,
} from './deadly-votes'

import { type Ator, cargoVisivel, normalizeCargo } from './cargos'
import { RecordError } from './errors'
import { run, txAs } from './fundacao-db'
import { requireActor, requireCan, requireVotoEditavel } from './permissoes-server'
import { proposeRewardIn } from './recompensas-server'
import { potencialDoDeadlyVote } from './virtudes-server'

export { RecordError }

const STATUSES: DeadlyVoteStatus[] = ['convocado', 'em-progresso', 'concluido', 'cancelado', 'falha']
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
  peso_maximo: number | null
  participants: number
  joined_at: Date | null
  outcome: 'sobreviveu' | 'eliminado' | null
  survivors: string | number
  eliminated: string | number
  host: string | null
  group_url: string | null
  has_group: boolean
  location: string | null
  admission: VoteAdmission
  entry_admission: EntryAdmission | null
  entry_cartas?: CartaLevada[] | null
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
    pesoMaximo: r.peso_maximo ?? null,
    participants: Number(r.participants),
    joined: r.joined_at !== null && r.entry_admission !== 'recusada',
    outcome: r.outcome,
    survivors: Number(r.survivors ?? 0),
    eliminated: Number(r.eliminated ?? 0),
    host: r.host ?? null,
    groupUrl: r.group_url ?? null,
    hasGroup: !!r.has_group,
    location: r.location ?? null,
    admission: r.admission === 'aprovacao' ? 'aprovacao' : 'livre',
    entryStatus: r.joined_at !== null ? (r.entry_admission ?? 'aceita') : null,
    minhasCartas: Array.isArray(r.entry_cartas) ? r.entry_cartas : [],
  }
}

/** Colunas comuns: inscritos e resultado público (sobreviventes / eliminados) de cada caso. */
/** O Owner nunca aparece como anfitrião do caso (DIRECAO-3 §3: Owner não é revelado publicamente). */
const VOTE_COUNTS = `(SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id AND c.admission <> 'recusada') AS participants,
              (SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id AND c.outcome = 'sobreviveu') AS survivors,
              (SELECT count(*) FROM deadly_vote_entries c WHERE c.vote_id = v.id AND c.outcome = 'eliminado') AS eliminated,
              (SELECT CASE WHEN h.role = 'owner' THEN NULL ELSE h.name END FROM players h WHERE h.id = v.created_by) AS host,
              (v.whatsapp_url IS NOT NULL) AS has_group, v.location, v.admission`

export async function getRecord(playerId: string): Promise<RecordPayload> {
  const [me] = (
    await pool.query<{ role: string; avatar_updated_at: Date | null }>('SELECT role, avatar_updated_at FROM players WHERE id = $1', [playerId])
  ).rows
  if (!me) throw new RecordError('Registro não encontrado.', 404)
  const votes = (
    await pool.query<VoteRow>(
      `SELECT v.id, v.number, v.title, v.arc, v.briefing, v.status, v.starts_at, v.ends_at, v.max_participants, v.peso_maximo,
              ${VOTE_COUNTS},
              e.joined_at, e.outcome, e.admission AS entry_admission, e.cartas AS entry_cartas,
              -- O link do grupo só chega a quem foi aceito, e só enquanto o caso está em andamento.
              -- As recompensas planejadas (deadly_vote_prizes) NUNCA entram neste payload.
              CASE WHEN e.player_id IS NOT NULL AND e.admission = 'aceita' AND v.status = 'em-progresso' THEN v.whatsapp_url END AS group_url
         FROM deadly_votes v
         LEFT JOIN deadly_vote_entries e ON e.vote_id = v.id AND e.player_id = $1
        -- Histórico público: convocações abertas, votos em andamento e casos encerrados. Cancelados
        -- aparecem para quem se inscreveu e, para os demais, por 30 dias (o aviso de suspensão).
        WHERE e.player_id IS NOT NULL OR v.status <> 'cancelado' OR v.updated_at > now() - interval '30 days'
        ORDER BY v.starts_at DESC
        LIMIT 100`,
      [playerId],
    )
  ).rows
  // O próprio cargo (payload privado do dono da sessão).
  const role: PlayerRole = normalizeCargo(me.role)
  return { role, avatarVersion: me.avatar_updated_at?.getTime() ?? null, votes: votes.map(toVote) }
}

/**
 * Cartas que o Record leva (dono, 22/10): uids do PRÓPRIO inventário (o save do servidor), sem repetir, e a soma dos
 * pesos (getCardPeso) não pode passar do peso máximo do caso. Sem limite no caso, nada é exigido nem guardado.
 */
async function validarCartas(c: PoolClient, playerId: string, pesoMaximo: number | null, raw: unknown): Promise<CartaLevada[]> {
  if (pesoMaximo == null) return []
  const uids = Array.isArray(raw) ? raw.filter((u): u is string => typeof u === 'string' && u.length > 0 && u.length <= 80) : []
  if (Array.isArray(raw) && uids.length !== raw.length) throw new RecordError('Cartas inválidas.')
  if (new Set(uids).size !== uids.length) throw new RecordError('A mesma carta foi escolhida duas vezes.')
  if (uids.length > 40) throw new RecordError('Cartas demais.')
  const inv = uids.length
    ? (
        await c.query<{ uid: string; card_id: string }>(
          `SELECT e->>'uid' AS uid, e->>'cardId' AS card_id
             FROM player_saves s, jsonb_array_elements(coalesce(s.data->'inventory', '[]'::jsonb)) e
            WHERE s.player_id = $1 AND e->>'uid' = ANY($2)`,
          [playerId, uids],
        )
      ).rows
    : []
  if (inv.length !== uids.length) throw new RecordError('Alguma carta escolhida não está no seu inventário.', 409)
  const cartas = inv.map((r) => ({ uid: r.uid, cardId: r.card_id }))
  const peso = cartas.reduce((s, x) => s + (cartaExiste(x.cardId) ? getCardPeso(x.cardId) : 0), 0)
  if (peso > pesoMaximo) throw new RecordError(`As cartas escolhidas pesam ${peso}, acima do peso máximo deste Deadly Vote (${pesoMaximo}). Tire alguma carta para participar.`, 409)
  return cartas
}

export async function joinVote(playerId: string, voteId: string, cartasRaw?: unknown) {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const [v] = (
      await c.query<{ status: string; max_participants: number | null; admission: VoteAdmission; peso_maximo: number | null }>(
        'SELECT status, max_participants, admission, peso_maximo FROM deadly_votes WHERE id = $1 FOR UPDATE',
        [voteId],
      )
    ).rows
    if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
    if (v.status !== 'convocado') throw new RecordError('As inscrições deste Deadly Vote estão encerradas.', 409)
    const [mine] = (await c.query<{ admission: EntryAdmission }>('SELECT admission FROM deadly_vote_entries WHERE vote_id = $1 AND player_id = $2', [voteId, playerId])).rows
    if (mine?.admission === 'recusada') throw new RecordError('Sua inscrição neste Deadly Vote foi recusada.', 409)
    if (!mine && v.max_participants) {
      const [{ n }] = (await c.query<{ n: string }>("SELECT count(*) AS n FROM deadly_vote_entries WHERE vote_id = $1 AND admission <> 'recusada'", [voteId])).rows
      if (Number(n) >= v.max_participants) throw new RecordError('Não há mais vagas neste Deadly Vote.', 409)
    }
    const cartas = await validarCartas(c, playerId, v.peso_maximo, cartasRaw)
    // Inscrição com aprovação: entra "pendente" até o dono do Deadly Vote aceitar.
    await c.query('INSERT INTO deadly_vote_entries (vote_id, player_id, admission, cartas) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [
      voteId,
      playerId,
      v.admission === 'aprovacao' ? 'pendente' : 'aceita',
      JSON.stringify(cartas),
    ])
    await c.query('COMMIT')
  } catch (err) {
    await c.query('ROLLBACK')
    throw err
  } finally {
    c.release()
  }
}

/** Troca as cartas que o Record leva (só enquanto o caso está convocado). */
export async function trocarCartas(playerId: string, voteId: string, cartasRaw: unknown) {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const [v] = (await c.query<{ status: string; peso_maximo: number | null }>('SELECT status, peso_maximo FROM deadly_votes WHERE id = $1', [voteId])).rows
    if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
    if (v.status !== 'convocado') throw new RecordError('As cartas só mudam antes de o Deadly Vote começar.', 409)
    const cartas = await validarCartas(c, playerId, v.peso_maximo, cartasRaw)
    const res = await c.query("UPDATE deadly_vote_entries SET cartas = $3 WHERE vote_id = $1 AND player_id = $2 AND admission <> 'recusada'", [voteId, playerId, JSON.stringify(cartas)])
    if (!res.rowCount) throw new RecordError('Você não está inscrito neste Deadly Vote.', 409)
    await c.query('COMMIT')
    return cartas
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
      WHERE e.vote_id = v.id AND v.id = $1 AND e.player_id = $2 AND v.status = 'convocado' AND e.admission <> 'recusada'`,
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
  if (!m) throw new RecordError('Formato de imagem inválido: envie JPEG, PNG ou WebP.')
  if (Math.floor((m[2].length * 3) / 4) > MAX_AVATAR_BYTES)
    throw new RecordError(`Foto grande demais (limite de ${Math.round(MAX_AVATAR_BYTES / 1000)} KB depois de comprimida). Tente de novo ou escolha outra imagem.`, 413)
  // o conteúdo precisa ser mesmo do tipo declarado (não só o prefixo do data URL)
  const head = Buffer.from(m[2].slice(0, 24), 'base64')
  const tipoOk =
    head.length >= 12 &&
    (m[1] === 'jpeg' ? head[0] === 0xff && head[1] === 0xd8 : m[1] === 'png' ? head.readUInt32BE(0) === 0x89504e47 : head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP')
  if (!tipoOk) throw new RecordError('O arquivo não é uma imagem válida.')
  await pool.query('UPDATE players SET avatar = $2, avatar_updated_at = now() WHERE id = $1', [playerId, dataUrl])
}

export async function getAvatar(playerId: string) {
  const [row] = (await pool.query<{ avatar: string | null }>('SELECT avatar FROM players WHERE id = $1', [playerId])).rows
  const m = row?.avatar ? AVATAR_RE.exec(row.avatar) : null
  if (!m) return null
  return { type: `image/${m[1]}`, body: Buffer.from(m[2], 'base64') }
}

/* Gestão (Dealer / Admin). Base para o painel de gerência que será criado depois. */

/** Equipe que opera Deadly Votes (Owner, Anfitrião, Dealer). Ver lib/devo/cargos.ts. */
async function requireStaff(playerId: string, q?: PoolClient) {
  const ator = await requireActor(playerId, q)
  requireCan(ator, 'dv.criar', undefined, 'Acesso restrito ao Dealer.')
  return ator
}

/**
 * Mesa do Dealer: votos recentes (todos os estados) com os inscritos, a decisão de cada um, as recompensas
 * planejadas (privadas) e a contagem das propostas geradas.
 * Escopo pela tabela do dono: Owner vê todos; Anfitrião os seus e os dos seus Dealers; Dealer só os seus.
 */
export async function getStaffBoard(playerId: string): Promise<StaffBoard> {
  const ator = await requireStaff(playerId)
  const votes = (
    await pool.query<VoteRow & { is_tutorial: boolean; creator: string | null; creator_id: string | null; creator_role: string | null; results_applied_at: Date | null }>(
      `SELECT v.id, v.number, v.title, v.arc, v.briefing, v.status, v.starts_at, v.ends_at, v.max_participants, v.peso_maximo,
              ${VOTE_COUNTS},
              NULL::timestamptz AS joined_at, NULL::text AS outcome, NULL::text AS entry_admission, v.whatsapp_url AS group_url,
              v.is_tutorial, v.results_applied_at, c.name AS creator, c.id AS creator_id, c.role AS creator_role
         FROM deadly_votes v
         LEFT JOIN players c ON c.id = v.created_by
        WHERE $1 = 'owner' OR v.created_by = $2 OR ($1 = 'anfitriao' AND c.supervisor_id = $2)
        ORDER BY (v.status IN ('convocado', 'em-progresso') OR (v.status = 'concluido' AND v.results_applied_at IS NULL)) DESC, v.starts_at DESC
        LIMIT 30`,
      [ator.cargo, ator.id],
    )
  ).rows
  if (!votes.length) return { votes: [] }
  const ids = votes.map((v) => v.id)
  const [entries, prizes, tallies] = await Promise.all([
    pool.query<{
      vote_id: string
      player_id: string
      name: string | null
      outcome: 'sobreviveu' | 'eliminado' | null
      admission: EntryAdmission
      decision: EntryDecision | null
      note: string | null
      joined_at: Date
      cartas: CartaLevada[] | null
    }>(
      `SELECT e.vote_id, e.player_id, p.name, e.outcome, e.admission, e.decision, e.note, e.joined_at, e.cartas
         FROM deadly_vote_entries e
         JOIN players p ON p.id = e.player_id
        WHERE e.vote_id = ANY($1::uuid[])
        ORDER BY e.joined_at`,
      [ids],
    ),
    pool.query<{ id: string; vote_id: string; resource: DvPrize['recurso']; resource_key: string | null; quantity: number; label: string | null }>(
      'SELECT id, vote_id, resource, resource_key, quantity, label FROM deadly_vote_prizes WHERE vote_id = ANY($1::uuid[]) ORDER BY position, created_at',
      [ids],
    ),
    pool.query<{ vote_id: string; status: string; n: string }>(
      'SELECT vote_id, status, count(*) AS n FROM reward_proposals WHERE vote_id = ANY($1::uuid[]) GROUP BY vote_id, status',
      [ids],
    ),
  ])
  // Recompensas individuais (tabela nova): banco sem a migração ainda devolve lista vazia, sem derrubar a mesa.
  const entryPrizes = await pool
    .query<{ id: string; vote_id: string; player_id: string; resource: DvPrize['recurso']; resource_key: string | null; quantity: number; label: string | null }>(
      'SELECT id, vote_id, player_id, resource, resource_key, quantity, label FROM deadly_vote_entry_prizes WHERE vote_id = ANY($1::uuid[]) ORDER BY position, created_at',
      [ids],
    )
    .then((r) => r.rows)
    .catch(() => [])
  const entryPrizesBy = new Map<string, DvPrize[]>()
  for (const p of entryPrizes) {
    const k = `${p.vote_id}:${p.player_id}`
    const list = entryPrizesBy.get(k) ?? []
    list.push({ id: p.id, recurso: p.resource, chave: p.resource_key, quantidade: p.quantity, label: p.label })
    entryPrizesBy.set(k, list)
  }
  const byVote = new Map<string, StaffEntry[]>()
  for (const e of entries.rows) {
    const list = byVote.get(e.vote_id) ?? []
    list.push({
      playerId: e.player_id,
      name: e.name ?? 'Sem nome',
      outcome: e.outcome,
      admission: e.admission,
      decision: e.decision,
      note: e.note,
      joinedAt: e.joined_at.getTime(),
      prizes: entryPrizesBy.get(`${e.vote_id}:${e.player_id}`) ?? [],
      cartas: Array.isArray(e.cartas) ? e.cartas : [],
    })
    byVote.set(e.vote_id, list)
  }
  const prizesBy = new Map<string, DvPrize[]>()
  for (const p of prizes.rows) {
    const list = prizesBy.get(p.vote_id) ?? []
    list.push({ id: p.id, recurso: p.resource, chave: p.resource_key, quantidade: p.quantity, label: p.label })
    prizesBy.set(p.vote_id, list)
  }
  const tallyBy = new Map<string, StaffRewardTally>()
  for (const t of tallies.rows) {
    const tally = tallyBy.get(t.vote_id) ?? { pendente: 0, aprovada: 0, entregue: 0, rejeitada: 0 }
    if (t.status in tally) tally[t.status as keyof StaffRewardTally] = Number(t.n)
    tallyBy.set(t.vote_id, tally)
  }
  return {
    votes: votes.map((r) => ({
      ...toVote(r),
      entryStatus: null,
      entries: byVote.get(r.id) ?? [],
      isTutorial: !!r.is_tutorial,
      // Owner só aparece como autor do caso para quem pode ver Owner (o próprio Owner).
      creator: cargoVisivel(ator, r.creator_role) === 'player' && normalizeCargo(r.creator_role) === 'owner' ? null : r.creator,
      creatorId: cargoVisivel(ator, r.creator_role) === 'player' && normalizeCargo(r.creator_role) === 'owner' ? null : r.creator_id,
      prizes: prizesBy.get(r.id) ?? [],
      appliedAt: r.results_applied_at?.getTime() ?? null,
      rewards: tallyBy.get(r.id) ?? { pendente: 0, aprovada: 0, entregue: 0, rejeitada: 0 },
    })),
  }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const PRIZE_RESOURCES = ['item', 'tempo', 'carta', 'convite', 'arcano'] as const

/** Valida a lista de recompensas planejadas (até 8). Itens precisam existir no catálogo. */
async function cleanPrizes(c: PoolClient, raw: unknown): Promise<PrizeInput[]> {
  if (raw == null) return []
  if (!Array.isArray(raw)) throw new RecordError('Recompensas inválidas.')
  if (raw.length > 8) throw new RecordError('No máximo 8 recompensas por Deadly Vote.')
  const out: PrizeInput[] = []
  for (const r of raw as Record<string, unknown>[]) {
    const recurso = r?.recurso as PrizeInput['recurso']
    if (!(PRIZE_RESOURCES as readonly unknown[]).includes(recurso)) throw new RecordError('Recurso inválido.')
    const quantidade = Math.floor(Number(r.quantidade))
    if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 1_000_000) throw new RecordError('Quantidade inválida.')
    let chave: string | null = null
    if (recurso === 'item') {
      chave = text(r.chave, 80)
      const [d] = await run(c, 'SELECT 1 FROM item_defs WHERE key = $1 AND active', [chave])
      if (!d) throw new RecordError('Item desconhecido.')
    } else if (recurso === 'carta') {
      chave = text(r.chave, 80)
      if (!/^[a-z0-9_-]{1,80}$/.test(chave)) throw new RecordError('Carta inválida.')
    } else if (recurso === 'arcano') {
      // Três opções do narrador; o jogador escolhe uma depois que um Anfitrião aprovar.
      const ks = lerOpcoesArcano(text(r.chave, 80), true)
      if (!ks) throw new RecordError('Escolha três Arcanos diferentes para o jogador escolher.')
      chave = chaveOpcoesArcano(ks)
    }
    out.push({ recurso, chave, quantidade: recurso === 'arcano' ? 1 : quantidade, label: text(r.label, 60) || null })
  }
  return out
}

/**
 * Recompensas individuais de um participante (várias para a mesma pessoa), além da geral do caso. Substitui o
 * conjunto; só antes de o resultado ser aplicado. Entregues na aplicação, se o participante não morreu nem faltou.
 */
export async function setEntryPrizes(playerId: string, voteId: string, entryPlayerId: string, raw: unknown) {
  if (!UUID_RE.test(voteId) || !UUID_RE.test(entryPlayerId)) throw new RecordError('ID inválido.')
  return txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    await requireVotoEditavel(ator, voteId, c)
    const [v] = await run<{ results_applied_at: Date | null }>(c, 'SELECT results_applied_at FROM deadly_votes WHERE id = $1 FOR UPDATE', [voteId])
    if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
    if (v.results_applied_at) throw new RecordError('O resultado deste Deadly Vote já foi aplicado aos perfis.', 409)
    const [e] = await run(c, 'SELECT 1 FROM deadly_vote_entries WHERE vote_id = $1 AND player_id = $2', [voteId, entryPlayerId])
    if (!e) throw new RecordError('Participante não encontrado neste Deadly Vote.', 404)
    const prizes = await cleanPrizes(c, raw)
    await run(c, 'DELETE FROM deadly_vote_entry_prizes WHERE vote_id = $1 AND player_id = $2', [voteId, entryPlayerId])
    for (const [i, p] of prizes.entries()) {
      await run(
        c,
        'INSERT INTO deadly_vote_entry_prizes (vote_id, player_id, resource, resource_key, quantity, label, position) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [voteId, entryPlayerId, p.recurso, p.chave ?? null, p.quantidade, p.label ?? null, i],
      )
    }
  })
}

async function writePrizes(c: PoolClient, voteId: string, prizes: PrizeInput[]) {
  // Prêmios já usados em propostas ficam (a FK da proposta vira null só se o prêmio sumir); trocamos o conjunto.
  await run(c, 'DELETE FROM deadly_vote_prizes WHERE vote_id = $1', [voteId])
  for (const [i, p] of prizes.entries()) {
    await run(c, 'INSERT INTO deadly_vote_prizes (vote_id, resource, resource_key, quantity, label, position) VALUES ($1, $2, $3, $4, $5, $6)', [
      voteId,
      p.recurso,
      p.chave ?? null,
      p.quantidade,
      p.label ?? null,
      i,
    ])
  }
}

function voteFields(input: Record<string, unknown>) {
  const title = text(input.title, 60)
  const startsAt = Number(input.startsAt)
  if (title.length < 2) throw new RecordError('Título obrigatório.')
  if (!Number.isFinite(startsAt)) throw new RecordError('Data de início inválida.')
  const max = input.maxParticipants == null || input.maxParticipants === '' ? null : Math.max(1, Math.min(999, Math.floor(Number(input.maxParticipants))))
  const peso = input.pesoMaximo == null || input.pesoMaximo === '' ? null : Math.max(1, Math.min(99, Math.floor(Number(input.pesoMaximo))))
  const rawGroup = text(input.groupUrl, 200)
  const group = rawGroup ? normalizeGroupUrl(rawGroup) : null
  if (rawGroup && !group) throw new RecordError('Link do grupo inválido. Use o convite do WhatsApp (https://chat.whatsapp.com/…).')
  return {
    title,
    startsAt,
    max: max !== null && Number.isFinite(max) ? max : null,
    peso: peso !== null && Number.isFinite(peso) ? peso : null,
    group,
    arc: text(input.arc, 60) || null,
    briefing: text(input.briefing, 600) || null,
    location: text(input.location, 80) || null,
    admission: (input.admission === 'aprovacao' ? 'aprovacao' : 'livre') as VoteAdmission,
  }
}

/**
 * Convoca um Deadly Vote com os campos do dono: local, descrição (briefing), data e horário, link do grupo
 * e recompensas (privadas). `admission: 'aprovacao'` faz o dono aceitar cada inscrito (padrão do formulário).
 */
export async function createVote(playerId: string, input: Record<string, unknown>) {
  return txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    // Deadly Vote tutorial (vencer desbloqueia os sistemas; ver scripts/fundacao-migration.sql §7): Owner/Anfitrião.
    const tutorial = input.tutorial === true
    if (tutorial) requireCan(ator, 'dv.tutorial', undefined, 'Só Owner ou Anfitrião criam o Deadly Vote tutorial.')
    const f = voteFields(input)
    const prizes = await cleanPrizes(c, input.prizes)
    const [row] = await run<{ id: string }>(
      c,
      `INSERT INTO deadly_votes (title, arc, briefing, starts_at, max_participants, created_by, whatsapp_url, is_tutorial, location, admission, peso_maximo)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [f.title, f.arc, f.briefing, f.startsAt, f.max, playerId, f.group, tutorial, f.location, f.admission, f.peso],
    )
    await writePrizes(c, row.id, prizes)
    return row.id
  })
}

/** Edita a ficha do caso (título, local, descrição, data, vagas, modo de inscrição, recompensas). */
export async function updateVote(playerId: string, voteId: string, input: Record<string, unknown>) {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  return txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    await requireVotoEditavel(ator, voteId, c)
    const [v] = await run<{ results_applied_at: Date | null }>(c, 'SELECT results_applied_at FROM deadly_votes WHERE id = $1 FOR UPDATE', [voteId])
    if (v?.results_applied_at) throw new RecordError('O resultado deste Deadly Vote já foi aplicado aos perfis.', 409)
    const f = voteFields(input)
    await run(
      c,
      `UPDATE deadly_votes SET title = $2, arc = $3, briefing = $4, starts_at = to_timestamp($5 / 1000.0), max_participants = $6,
              location = $7, admission = $8, peso_maximo = $9, updated_at = now() WHERE id = $1`,
      [voteId, f.title, f.arc, f.briefing, f.startsAt, f.max, f.location, f.admission, f.peso],
    )
    if (input.prizes !== undefined) await writePrizes(c, voteId, await cleanPrizes(c, input.prizes))
  })
}

/** O Dealer informa, troca ou remove (null/vazio) o link do grupo do WhatsApp de um caso. */
export async function setVoteGroup(playerId: string, voteId: string, url: unknown) {
  const ator = await requireStaff(playerId)
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  await requireVotoEditavel(ator, voteId)
  const empty = url === null || (typeof url === 'string' && url.trim() === '')
  const group = empty ? null : normalizeGroupUrl(url)
  if (!empty && !group) throw new RecordError('Link do grupo inválido. Use o convite do WhatsApp (https://chat.whatsapp.com/…).')
  const res = await pool.query('UPDATE deadly_votes SET whatsapp_url = $2, updated_at = now() WHERE id = $1', [voteId, group])
  if (!res.rowCount) throw new RecordError('Deadly Vote não encontrado.', 404)
}

/**
 * Muda o estado do caso. Depois de aplicado o resultado aos perfis, o estado fica selado (gatilho do banco).
 * Ao virar 'concluido', os gatilhos da Fundação desbloqueiam os sistemas para quem já tem 'sobreviveu' num tutorial.
 */
export async function setVoteStatus(playerId: string, voteId: string, status: unknown) {
  if (!UUID_RE.test(voteId) || !(STATUSES as unknown[]).includes(status)) throw new RecordError('Dados inválidos.')
  await txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    await requireVotoEditavel(ator, voteId, c)
    await run(
      c,
      `UPDATE deadly_votes SET status = $2, updated_at = now(),
              ends_at = CASE WHEN $2 IN ('concluido', 'cancelado', 'falha') THEN coalesce(ends_at, now()) ELSE ends_at END
        WHERE id = $1`,
      [voteId, status],
    )
  })
}

/** Resultado direto (fluxo antigo, mantido para compatibilidade). Bloqueado depois de aplicado. */
export async function setEntryOutcome(playerId: string, voteId: string, targetId: string, outcome: unknown) {
  if (!UUID_RE.test(voteId) || !UUID_RE.test(targetId) || (outcome !== null && outcome !== 'sobreviveu' && outcome !== 'eliminado')) {
    throw new RecordError('Dados inválidos.')
  }
  await txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    await requireVotoEditavel(ator, voteId, c)
    await run(c, 'UPDATE deadly_vote_entries SET outcome = $3 WHERE vote_id = $1 AND player_id = $2', [voteId, targetId, outcome])
  })
}

/* ─────────────── Inscrições e resultado por participante (DIRECAO-3 §4) ─────────────── */

/** O dono do caso aceita, recusa ou devolve para análise uma inscrição (antes de aplicar o resultado). */
export async function setEntryAdmission(playerId: string, voteId: string, targetId: string, admission: unknown) {
  if (!UUID_RE.test(voteId) || !UUID_RE.test(targetId) || !['pendente', 'aceita', 'recusada'].includes(String(admission))) throw new RecordError('Dados inválidos.')
  await txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    await requireVotoEditavel(ator, voteId, c)
    if (admission === 'aceita') {
      const [v] = await run<{ max_participants: number | null }>(c, 'SELECT max_participants FROM deadly_votes WHERE id = $1 FOR UPDATE', [voteId])
      if (v?.max_participants) {
        const [{ n }] = await run<{ n: string }>(
          c,
          "SELECT count(*) AS n FROM deadly_vote_entries WHERE vote_id = $1 AND admission = 'aceita' AND player_id <> $2",
          [voteId, targetId],
        )
        if (Number(n) >= v.max_participants) throw new RecordError('As vagas deste Deadly Vote já foram preenchidas.', 409)
      }
    }
    // Recusar limpa a decisão (quem foi recusado não participa do resultado).
    const rows = await run(
      c,
      `UPDATE deadly_vote_entries SET admission = $3,
              decision = CASE WHEN $3 = 'aceita' THEN decision ELSE NULL END,
              outcome = CASE WHEN $3 = 'aceita' THEN outcome ELSE NULL END
        WHERE vote_id = $1 AND player_id = $2 RETURNING player_id`,
      [voteId, targetId, admission],
    )
    if (!rows.length) throw new RecordError('Inscrição não encontrada.', 404)
  })
}

async function lockVoteForResult(c: PoolClient, ator: Ator, voteId: string) {
  await requireVotoEditavel(ator, voteId, c)
  const [v] = await run<{ status: DeadlyVoteStatus; results_applied_at: Date | null; number: number; title: string }>(
    c,
    'SELECT status, results_applied_at, number, title FROM deadly_votes WHERE id = $1 FOR UPDATE',
    [voteId],
  )
  if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
  return v
}

/**
 * Decide o destino de um participante aceito (ou de todos os ainda sem decisão, com `targetId = '*'`).
 * Só depois de concluir e antes de aplicar. `decision = null` desfaz.
 */
export async function setEntryDecision(playerId: string, voteId: string, targetId: string, decision: unknown, note?: unknown) {
  const d = decision === null ? null : (DECISIONS as unknown[]).includes(decision) ? (decision as EntryDecision) : undefined
  const all = targetId === '*'
  if (!UUID_RE.test(voteId) || (!all && !UUID_RE.test(targetId)) || d === undefined || (all && d === null)) throw new RecordError('Dados inválidos.')
  const nota = text(note, 200) || null
  if (d === 'outro' && !all && !nota) throw new RecordError('Explique o resultado na nota.')
  await txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    const v = await lockVoteForResult(c, ator, voteId)
    if (v.results_applied_at) throw new RecordError('O resultado deste Deadly Vote já foi aplicado aos perfis.', 409)
    if (v.status !== 'concluido') throw new RecordError('Conclua o Deadly Vote antes de decidir o resultado de cada participante.', 409)
    const rows = all
      ? await run(
          c,
          `UPDATE deadly_vote_entries SET decision = $2, decided_by = $3, decided_at = now()
            WHERE vote_id = $1 AND admission = 'aceita' AND decision IS NULL RETURNING player_id`,
          [voteId, d, ator.id],
        )
      : await run(
          c,
          `UPDATE deadly_vote_entries SET decision = $3, note = $4, decided_by = $5, decided_at = now()
            WHERE vote_id = $1 AND player_id = $2 AND admission = 'aceita' RETURNING player_id`,
          [voteId, targetId, d, d ? nota : null, ator.id],
        )
    if (!all && !rows.length) throw new RecordError('Participante não encontrado entre os aceitos.', 404)
  })
}

export type ApplyResult = { aplicou: boolean; participantes: number; propostas: number; entregues: number; pendentes: number }

/**
 * Aplica o resultado aos perfis — UMA vez (a linha do voto é travada; a segunda chamada devolve
 * `aplicou: false` e não cria nada). Para cada aceito: 'premio' → sobreviveu (+ uma proposta 'evento' por
 * recompensa planejada); 'morreu' → eliminado; 'ausente'/'outro' → sem resultado. As propostas seguem o
 * fluxo da Fundação: quem pode aprovar (Owner; Anfitrião no seu escopo) já aprova e entrega; a proposta de
 * Dealer fica pendente para o Anfitrião/Owner. Gravar 'sobreviveu' num voto tutorial concluído dispara o
 * desbloqueio dos sistemas (gatilho da Fundação).
 */
export async function applyVoteResults(playerId: string, voteId: string): Promise<ApplyResult> {
  if (!UUID_RE.test(voteId)) throw new RecordError('ID inválido.')
  return txAs(playerId, async (c) => {
    const ator = await requireStaff(playerId, c)
    const v = await lockVoteForResult(c, ator, voteId)
    if (v.results_applied_at) return { aplicou: false, participantes: 0, propostas: 0, entregues: 0, pendentes: 0 }
    if (v.status !== 'concluido') throw new RecordError('Conclua o Deadly Vote antes de aplicar o resultado.', 409)
    const entries = await run<{ player_id: string; decision: EntryDecision | null; note: string | null }>(
      c,
      "SELECT player_id, decision, note FROM deadly_vote_entries WHERE vote_id = $1 AND admission = 'aceita' ORDER BY joined_at",
      [voteId],
    )
    if (!entries.length) throw new RecordError('Nenhum participante aceito neste Deadly Vote.', 409)
    const faltam = entries.filter((e) => !e.decision).length
    if (faltam) throw new RecordError(`Decida o resultado de todos os participantes antes de aplicar (faltam ${faltam}).`, 409)
    // Inscrições ainda em análise não participam: viram recusadas para não ficarem penduradas.
    await run(c, "UPDATE deadly_vote_entries SET admission = 'recusada' WHERE vote_id = $1 AND admission = 'pendente'", [voteId])
    for (const e of entries) {
      const outcome = e.decision === 'premio' ? 'sobreviveu' : e.decision === 'morreu' ? 'eliminado' : null
      await run(c, 'UPDATE deadly_vote_entries SET outcome = $3 WHERE vote_id = $1 AND player_id = $2', [voteId, e.player_id, outcome])
    }
    const prizes = await run<{ id: string; resource: PrizeInput['recurso']; resource_key: string | null; quantity: number; label: string | null }>(
      c,
      'SELECT id, resource, resource_key, quantity, label FROM deadly_vote_prizes WHERE vote_id = $1 ORDER BY position, created_at',
      [voteId],
    )
    let propostas = 0
    let entregues = 0
    const origem = `Deadly Vote #${v.number} · ${v.title}`
    // Recompensa geral: todos os que não morreram (nem faltaram) recebem.
    for (const e of entries.filter((x) => x.decision !== 'morreu' && x.decision !== 'ausente')) {
      for (const p of prizes) {
        const id = await proposeRewardIn(
          c,
          ator,
          {
            tipo: 'evento',
            voteId,
            origem,
            destinatarioId: e.player_id,
            recurso: p.resource,
            chave: p.resource_key,
            quantidade: p.quantity,
            justificativa: `Resultado do caso: recebe prêmio${p.label ? ` (${p.label})` : ''}${e.note ? ` · ${e.note}` : ''}.`,
          },
          { aprovar: 'se-puder', entregar: true, prizeId: p.id },
        )
        if (!id) continue
        propostas++
        const [st] = await run<{ status: string }>(c, 'SELECT status FROM reward_proposals WHERE id = $1', [id])
        if (st?.status === 'entregue') entregues++
      }
    }
    // Recompensas individuais: valem para quem não morreu nem faltou (além da geral, que é só de quem recebe prêmio).
    const individuais = await run<{ player_id: string; resource: PrizeInput['recurso']; resource_key: string | null; quantity: number; label: string | null }>(
      c,
      'SELECT player_id, resource, resource_key, quantity, label FROM deadly_vote_entry_prizes WHERE vote_id = $1 ORDER BY position, created_at',
      [voteId],
    ).catch(() => [])
    for (const e of entries.filter((x) => x.decision !== 'morreu' && x.decision !== 'ausente')) {
      for (const p of individuais.filter((x) => x.player_id === e.player_id)) {
        const id = await proposeRewardIn(
          c,
          ator,
          {
            tipo: 'evento',
            voteId,
            origem,
            destinatarioId: e.player_id,
            recurso: p.resource,
            chave: p.resource_key,
            quantidade: p.quantity,
            justificativa: `Recompensa individual do caso${p.label ? ` (${p.label})` : ''}${e.note ? ` · ${e.note}` : ''}.`,
          },
          { aprovar: 'se-puder', entregar: true },
        )
        if (!id) continue
        propostas++
        const [st] = await run<{ status: string }>(c, 'SELECT status FROM reward_proposals WHERE id = $1', [id])
        if (st?.status === 'entregue') entregues++
      }
    }
    // Virtudes: participar (e sobreviver) rende Pontos de Potencial. Idempotente e nunca derruba a aplicação.
    await potencialDoDeadlyVote(c, voteId, entries)
    await run(c, 'UPDATE deadly_votes SET results_applied_at = now(), results_applied_by = $2, updated_at = now() WHERE id = $1', [voteId, ator.id])
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'deadly_vote.resultado', $2, $3)", [
      ator.id,
      voteId,
      JSON.stringify({
        participantes: entries.length,
        decisoes: Object.fromEntries(DECISIONS.map((d) => [d, entries.filter((e) => e.decision === d).length])),
        propostas,
        entregues,
      }),
    ])
    return { aplicou: true, participantes: entries.length, propostas, entregues, pendentes: propostas - entregues }
  })
}
