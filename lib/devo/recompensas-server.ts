import 'server-only'
import { chaveOpcoesArcano, lerOpcoesArcano } from './virtudes'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { type Ator, can, type PropostaAlvo, type RecompensaTipo } from './cargos'
import { RecordError } from './errors'
import { run, txAs, UUID_RE } from './fundacao-db'
import { creditMinutes, deliverCard, grantItem } from './inventario-server'
import { loadVotoAlvo, requireActor, requireCan } from './permissoes-server'
import { grantUnlock } from './progresso-server'

/**
 * Recompensas com aprovação (DIRECAO-3 §3; texto do dono "Recompensas externas" e §8).
 *
 * Fluxo: propor (pendente) → aprovar/rejeitar → entregar (idempotente). Editar algo relevante de uma
 * aprovada/rejeitada volta a pendente (gatilho devo_reward_guard). 'externa' só Owner aprova. Dealer nunca
 * aprova. Toda mudança vai para reward_log; toda entrega, para admin_log ('recompensa.entregue').
 */

export type RecursoTipo = 'item' | 'tempo' | 'carta' | 'convite' | 'arcano'
export type RecompensaStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'entregue' | 'cancelada'

export type Recompensa = {
  id: string
  tipo: RecompensaTipo
  voteId: string | null
  origem: string
  destinatarioId: string
  destinatario: string
  recurso: RecursoTipo
  chave: string | null
  quantidade: number
  justificativa: string
  status: RecompensaStatus
  propostoPor: string | null
  propostoPorNome: string | null
  supervisorOriginal: string | null
  autorizadoPor: string | null
  autorizadoPorNome: string | null
  autorizadoEm: number | null
  nota: string | null
  entregueEm: number | null
  revisao: number
  criadaEm: number
  atualizadaEm: number
}

export type PropostaInput = {
  tipo: RecompensaTipo
  voteId?: string | null
  origem?: string | null
  destinatarioId: string
  recurso: RecursoTipo
  /** item: chave do catálogo; carta: id da carta (lib/devo/cards.ts). */
  chave?: string | null
  /** item/carta/convite: unidades; tempo: MINUTOS. */
  quantidade: number
  justificativa: string
}

const TIPOS: RecompensaTipo[] = ['evento', 'externa', 'semanal']
const RECURSOS: RecursoTipo[] = ['item', 'tempo', 'carta', 'convite', 'arcano']

type Row = {
  id: string
  kind: RecompensaTipo
  vote_id: string | null
  origin: string
  recipient_id: string
  recipient: string | null
  resource: RecursoTipo
  resource_key: string | null
  quantity: number
  justification: string
  status: RecompensaStatus
  proposed_by: string | null
  proposer: string | null
  supervisor_id: string | null
  current_supervisor: string | null
  authorized_by: string | null
  authorizer: string | null
  authorized_at: Date | null
  decision_note: string | null
  delivered_at: Date | null
  revision: number
  created_at: Date
  updated_at: Date
}

const SELECT = `SELECT r.*, d.name AS recipient, p.name AS proposer, p.supervisor_id AS current_supervisor, a.name AS authorizer
  FROM reward_proposals r
  LEFT JOIN players d ON d.id = r.recipient_id
  LEFT JOIN players p ON p.id = r.proposed_by
  LEFT JOIN players a ON a.id = r.authorized_by`

function toRecompensa(r: Row): Recompensa {
  return {
    id: r.id,
    tipo: r.kind,
    voteId: r.vote_id,
    origem: r.origin,
    destinatarioId: r.recipient_id,
    destinatario: r.recipient ?? '—',
    recurso: r.resource,
    chave: r.resource_key,
    quantidade: r.quantity,
    justificativa: r.justification,
    status: r.status,
    propostoPor: r.proposed_by,
    propostoPorNome: r.proposer,
    supervisorOriginal: r.supervisor_id,
    autorizadoPor: r.authorized_by,
    autorizadoPorNome: r.authorizer,
    autorizadoEm: r.authorized_at?.getTime() ?? null,
    nota: r.decision_note,
    entregueEm: r.delivered_at?.getTime() ?? null,
    revisao: r.revision,
    criadaEm: r.created_at.getTime(),
    atualizadaEm: r.updated_at.getTime(),
  }
}

function alvoDe(r: Row): PropostaAlvo {
  return {
    tipo: r.kind,
    propostoPor: r.proposed_by,
    supervisorOriginal: r.supervisor_id,
    supervisorAtual: r.current_supervisor,
    ref: r.vote_id ?? r.origin,
  }
}

async function lockRow(c: PoolClient, id: string): Promise<Row> {
  if (!UUID_RE.test(id)) throw new RecordError('ID inválido.')
  await run(c, 'SELECT 1 FROM reward_proposals WHERE id = $1 FOR UPDATE', [id])
  const [row] = await run<Row>(c, `${SELECT} WHERE r.id = $1`, [id])
  if (!row) throw new RecordError('Recompensa não encontrada.', 404)
  return row
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

async function validate(c: PoolClient, input: PropostaInput) {
  if (!TIPOS.includes(input.tipo)) throw new RecordError('Tipo de recompensa inválido.')
  if (!RECURSOS.includes(input.recurso)) throw new RecordError('Recurso inválido.')
  if (!UUID_RE.test(String(input.destinatarioId))) throw new RecordError('Destinatário inválido.')
  const quantidade = Math.floor(Number(input.quantidade))
  if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 1_000_000) throw new RecordError('Quantidade inválida.')
  const justificativa = clean(input.justificativa, 500)
  if (justificativa.length < 3) throw new RecordError('Justificativa obrigatória.')
  let chave: string | null = null
  if (input.recurso === 'item') {
    chave = clean(input.chave, 80)
    const [d] = await run(c, 'SELECT 1 FROM item_defs WHERE key = $1 AND active', [chave])
    if (!d) throw new RecordError('Item desconhecido.')
  } else if (input.recurso === 'carta') {
    chave = clean(input.chave, 80)
    if (!/^[a-z0-9_-]{1,80}$/.test(chave)) throw new RecordError('Carta inválida.')
  } else if (input.recurso === 'arcano') {
    // Até três opções (prêmios antigos tinham uma); o jogador escolhe depois da aprovação.
    const ks = lerOpcoesArcano(clean(input.chave, 80))
    if (!ks) throw new RecordError('Escolha três Arcanos diferentes para o jogador escolher.')
    chave = chaveOpcoesArcano(ks)
  }
  const [dest] = await run(c, 'SELECT 1 FROM players WHERE id = $1', [input.destinatarioId])
  if (!dest) throw new RecordError('Destinatário não encontrado.', 404)
  const voteId = input.voteId && UUID_RE.test(input.voteId) ? input.voteId : null
  if (input.tipo === 'evento' && input.voteId && !voteId) throw new RecordError('Deadly Vote inválido.')
  let origem = clean(input.origem, 120)
  if (voteId) {
    const [v] = await run<{ number: number; title: string }>(c, 'SELECT number, title FROM deadly_votes WHERE id = $1', [voteId])
    if (!v) throw new RecordError('Deadly Vote não encontrado.', 404)
    origem ||= `Deadly Vote #${v.number} · ${v.title}`
  }
  if (!origem) throw new RecordError('Evento de origem obrigatório.')
  return { quantidade: input.recurso === 'arcano' ? 1 : quantidade, justificativa, chave, voteId, origem }
}

/** Propõe uma recompensa. Com `aprovar: true`, quem pode aprovar já aprova na mesma transação. */
export async function proposeReward(atorId: string, input: PropostaInput, opts: { aprovar?: boolean; entregar?: boolean } = {}) {
  return txAs(atorId, async (c) => (await proposeRewardIn(c, await requireActor(atorId, c), input, opts)) as string)
}

/**
 * Igual a `proposeReward`, dentro de uma transação já aberta (ex.: aplicar o resultado de um Deadly Vote).
 * `prizeId` liga a proposta a um prêmio planejado do voto: uma proposta por (prêmio, destinatário) — se já
 * existir, não cria outra e devolve null. `aprovar` só aprova se o ator puder (`can`), sem lançar 403.
 */
export async function proposeRewardIn(
  c: PoolClient,
  ator: Ator,
  input: PropostaInput,
  opts: { aprovar?: boolean | 'se-puder'; entregar?: boolean; prizeId?: string | null } = {},
): Promise<string | null> {
  const v = await validate(c, input)
  // Prêmio "Arcano" é só para quem ainda não tem um: no resultado do caso, pula; numa proposta avulsa, recusa.
  if (input.recurso === 'arcano') {
    const [p] = await run<{ arcano: string | null }>(c, 'SELECT arcano FROM players WHERE id = $1', [input.destinatarioId])
    if (p?.arcano) {
      if (v.voteId) return null
      throw new RecordError('Este jogador já tem um Arcano.', 409)
    }
  }
  const voto = v.voteId ? await loadVotoAlvo(v.voteId, c) : null
  requireCan(ator, 'recompensa.propor', { tipo: input.tipo, voto }, 'Você não pode propor esta recompensa.')
  const [row] = await run<{ id: string }>(
    c,
    `INSERT INTO reward_proposals (kind, vote_id, origin, recipient_id, resource, resource_key, quantity, justification, proposed_by, prize_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ${opts.prizeId ? 'ON CONFLICT (prize_id, recipient_id) WHERE prize_id IS NOT NULL DO NOTHING' : ''} RETURNING id`,
    [input.tipo, v.voteId, v.origem, input.destinatarioId, input.recurso, v.chave, v.quantidade, v.justificativa, ator.id, opts.prizeId ?? null],
  )
  if (!row) return null
  let aprovar = opts.aprovar === true
  if (opts.aprovar === 'se-puder') {
    const [r] = await run<Row>(c, `${SELECT} WHERE r.id = $1`, [row.id])
    aprovar = can(ator, 'recompensa.aprovar', alvoDe(r))
  }
  if (aprovar) await approveIn(c, ator, row.id, null)
  if (aprovar && opts.entregar) await deliverIn(c, ator, row.id)
  return row.id
}

/** Edita uma proposta. Mudança relevante numa aprovada/rejeitada volta a "pendente" (regra do dono, no banco). */
export async function editReward(atorId: string, id: string, patch: Partial<PropostaInput>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const row = await lockRow(c, id)
    requireCan(ator, 'recompensa.editar', alvoDe(row), 'Você não pode editar esta recompensa.')
    if (row.status === 'entregue' || row.status === 'cancelada') throw new RecordError('Esta recompensa já foi encerrada.', 409)
    const merged: PropostaInput = {
      tipo: patch.tipo ?? row.kind,
      voteId: patch.voteId !== undefined ? patch.voteId : row.vote_id,
      origem: patch.origem ?? row.origin,
      destinatarioId: patch.destinatarioId ?? row.recipient_id,
      recurso: patch.recurso ?? row.resource,
      chave: patch.chave !== undefined ? patch.chave : row.resource_key,
      quantidade: patch.quantidade ?? row.quantity,
      justificativa: patch.justificativa ?? row.justification,
    }
    const v = await validate(c, merged)
    // Mudou tipo ou voto: quem edita precisa poder propor no novo contexto.
    if (merged.tipo !== row.kind || v.voteId !== row.vote_id) {
      const voto = v.voteId ? await loadVotoAlvo(v.voteId, c) : null
      requireCan(ator, 'recompensa.propor', { tipo: merged.tipo, voto }, 'Você não pode propor esta recompensa.')
    }
    await run(
      c,
      `UPDATE reward_proposals SET kind = $2, vote_id = $3, origin = $4, recipient_id = $5, resource = $6, resource_key = $7,
              quantity = $8, justification = $9 WHERE id = $1`,
      [id, merged.tipo, v.voteId, v.origem, merged.destinatarioId, merged.recurso, v.chave, v.quantidade, v.justificativa],
    )
    const [after] = await run<Row>(c, `${SELECT} WHERE r.id = $1`, [id])
    return toRecompensa(after)
  })
}

async function approveIn(c: PoolClient, ator: Ator, id: string, nota: string | null) {
  const row = await lockRow(c, id)
  requireCan(ator, 'recompensa.aprovar', alvoDe(row), row.kind === 'externa' ? 'Recompensas externas exigem aprovação de um Owner.' : 'Você não pode aprovar esta recompensa.')
  if (row.status === 'aprovada') return
  if (row.status !== 'pendente') throw new RecordError('Só propostas pendentes podem ser aprovadas.', 409)
  await run(c, "UPDATE reward_proposals SET status = 'aprovada', authorized_by = $2, decision_note = $3 WHERE id = $1", [id, ator.id, nota])
}

export async function approveReward(atorId: string, id: string, opts: { nota?: string | null; entregar?: boolean } = {}) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    await approveIn(c, ator, id, clean(opts.nota, 300) || null)
    if (opts.entregar) await deliverIn(c, ator, id)
  })
}

export async function rejectReward(atorId: string, id: string, nota?: string | null) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const row = await lockRow(c, id)
    requireCan(ator, 'recompensa.aprovar', alvoDe(row), 'Você não pode rejeitar esta recompensa.')
    if (row.status !== 'pendente' && row.status !== 'aprovada') throw new RecordError('Esta recompensa não pode ser rejeitada agora.', 409)
    await run(c, "UPDATE reward_proposals SET status = 'rejeitada', authorized_by = $2, decision_note = $3 WHERE id = $1", [id, ator.id, clean(nota, 300) || null])
  })
}

/** Cancela (proponente ou quem aprova). Entregue não cancela. */
export async function cancelReward(atorId: string, id: string) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    const row = await lockRow(c, id)
    requireCan(ator, 'recompensa.editar', alvoDe(row), 'Você não pode cancelar esta recompensa.')
    if (row.status === 'entregue') throw new RecordError('Esta recompensa já foi entregue.', 409)
    if (row.status === 'cancelada') return
    await run(c, "UPDATE reward_proposals SET status = 'cancelada' WHERE id = $1", [id])
  })
}

/**
 * Entrega. Idempotente: a linha é travada (FOR UPDATE); se já está 'entregue', não faz nada e devolve false.
 * Os recursos usam idem `recompensa:<id>` (itens) para nunca duplicar mesmo em corrida.
 */
async function deliverIn(c: PoolClient, ator: Ator | null, id: string): Promise<boolean> {
  const row = await lockRow(c, id)
  if (ator) requireCan(ator, 'recompensa.distribuir', alvoDe(row), 'Você não pode distribuir esta recompensa.')
  if (row.status === 'entregue') return false
  if (row.status !== 'aprovada') throw new RecordError('A recompensa precisa estar aprovada para ser entregue.', 409)
  const idem = `recompensa:${row.id}`
  switch (row.resource) {
    case 'item':
      await grantItem({ playerId: row.recipient_id, item: row.resource_key!, quantidade: row.quantity, motivo: 'recompensa', ref: row.id, atorId: ator?.id ?? null, idem }, c)
      break
    case 'convite':
      await grantItem({ playerId: row.recipient_id, item: 'convite', quantidade: row.quantity, motivo: 'recompensa', ref: row.id, atorId: ator?.id ?? null, idem }, c)
      break
    case 'tempo':
      await creditMinutes(row.recipient_id, row.quantity, c)
      break
    case 'arcano': {
      // O jogador escolhe entre as opções do narrador (tela dos Arcanos). Quem já tem Arcano não recebe outro.
      const opcoes = lerOpcoesArcano(row.resource_key)
      if (!opcoes) throw new RecordError('Arcano desconhecido.')
      const [p] = await run<{ arcano: string | null }>(c, 'SELECT arcano FROM players WHERE id = $1', [row.recipient_id])
      if (!p?.arcano) {
        await run(c, 'INSERT INTO arcano_escolhas (player_id, opcoes, origem, reward_id) VALUES ($1, $2, $3, $4) ON CONFLICT (reward_id) DO NOTHING', [
          row.recipient_id,
          opcoes,
          row.origin.slice(0, 120),
          row.id,
        ])
      }
      await run(c, "INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, 'virtudes.arcano', $2, $3, $4)", [
        ator?.id ?? null,
        row.recipient_id,
        row.id,
        JSON.stringify({ opcoes, origem: 'recompensa', escolha: !p?.arcano, jaTinha: p?.arcano ?? null }),
      ])
      // Ganhar um Arcano abre os sistemas de Arcanos e Virtudes (mesma flag): é lá que o jogador escolhe.
      await grantUnlock(row.recipient_id, 'virtudes', 'sistema', row.id, null, c)
      break
    }
    case 'carta':
      for (let i = 0; i < row.quantity && i < 50; i++) {
        await deliverCard({ playerId: row.recipient_id, cardId: row.resource_key!, origem: row.origin, ref: row.id, idem: `${idem}:${i}` }, c)
      }
      break
  }
  await run(c, "UPDATE reward_proposals SET status = 'entregue', delivered_by = $2 WHERE id = $1", [id, ator?.id ?? null])
  return true
}

export async function deliverReward(atorId: string, id: string) {
  return txAs(atorId, async (c) => deliverIn(c, await requireActor(atorId, c), id))
}

export type FiltroRecompensas = { status?: RecompensaStatus | null; voteId?: string | null; destinatarioId?: string | null; limit?: number }

/**
 * Lista o que o ator pode ver: Owner tudo; Anfitrião as próprias, as dos Dealers que supervisiona ou
 * supervisionou e as semanais autorizadas; Dealer as próprias; Jogador nenhuma (ver as recebidas pelo inventário).
 */
export async function listRewards(atorId: string, filtro: FiltroRecompensas = {}): Promise<(Recompensa & { podeAprovar: boolean; podeEditar: boolean })[]> {
  const ator = await requireActor(atorId)
  if (ator.cargo === 'player') throw new RecordError('Você não tem permissão para isso.', 403)
  const rows = await run<Row>(
    pool,
    `${SELECT}
      WHERE ($1::text IS NULL OR r.status = $1) AND ($2::uuid IS NULL OR r.vote_id = $2) AND ($3::uuid IS NULL OR r.recipient_id = $3)
        AND ($4 = 'owner' OR r.proposed_by = $5 OR ($4 = 'anfitriao' AND (r.supervisor_id = $5 OR p.supervisor_id = $5 OR r.kind = 'semanal')))
      ORDER BY (r.status = 'pendente') DESC, r.updated_at DESC
      LIMIT $6`,
    [
      filtro.status ?? null,
      filtro.voteId && UUID_RE.test(filtro.voteId) ? filtro.voteId : null,
      filtro.destinatarioId && UUID_RE.test(filtro.destinatarioId) ? filtro.destinatarioId : null,
      ator.cargo,
      ator.id,
      Math.min(300, Math.max(1, filtro.limit ?? 100)),
    ],
  )
  return rows
    .filter((r) => ator.cargo !== 'anfitriao' || r.kind !== 'semanal' || r.proposed_by === ator.id || can(ator, 'recompensa.aprovar', alvoDe(r)))
    .map((r) => ({ ...toRecompensa(r), podeAprovar: can(ator, 'recompensa.aprovar', alvoDe(r)), podeEditar: can(ator, 'recompensa.editar', alvoDe(r)) }))
}

/** Histórico de uma proposta (quem criou, editou, aprovou, entregou), para quem pode vê-la. */
export async function rewardHistory(atorId: string, id: string) {
  const ator = await requireActor(atorId)
  const [row] = await run<Row>(pool, `${SELECT} WHERE r.id = $1`, [id])
  if (!row) throw new RecordError('Recompensa não encontrada.', 404)
  const alvo = alvoDe(row)
  if (!can(ator, 'recompensa.editar', alvo) && !can(ator, 'recompensa.aprovar', alvo)) throw new RecordError('Você não tem permissão para isso.', 403)
  const log = await run<{ at: Date; action: string; status: string; actor: string | null }>(
    pool,
    'SELECT l.at, l.action, l.status, a.name AS actor FROM reward_log l LEFT JOIN players a ON a.id = l.actor_id WHERE l.proposal_id = $1 ORDER BY l.at, l.id',
    [id],
  )
  return log.map((l) => ({ ...l, at: l.at.getTime() }))
}
