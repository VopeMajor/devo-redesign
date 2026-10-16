import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { txAs } from '@/lib/devo/fundacao-db'
import { consumeItem, grantItem, listItemDefs, upsertItemDef } from '@/lib/devo/inventario-server'
import {
  getPlayerSummary,
  grantAuthorization,
  listAdminLog,
  listEquipe,
  listJogadores,
  requireActor,
  requireCan,
  revokeAuthorization,
  setCargo,
  supervisionHistory,
  transferDealer,
} from '@/lib/devo/permissoes-server'
import { ITEM_KINDS, type ItemKind, type ItemRarity } from '@/lib/devo/progresso'
import { listConfig, ownerAdjustKarma, ownerSetUnlock, setConfig } from '@/lib/devo/progresso-server'
import {
  approveReward,
  cancelReward,
  deliverReward,
  editReward,
  listRewards,
  type PropostaInput,
  proposeReward,
  type RecompensaStatus,
  rejectReward,
  rewardHistory,
} from '@/lib/devo/recompensas-server'

export const dynamic = 'force-dynamic'

/**
 * API da equipe (Owner / Anfitrião / Dealer). Toda ação passa por can() no servidor.
 * Lista completa de views e actions: docs/redesign/FUNDACAO.md §API.
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[staff]', err)
  return Response.json({ ok: false, error: 'Falha no servidor da equipe.' }, { status: 500 })
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const url = new URL(req.url)
  const p = (k: string) => url.searchParams.get(k)
  try {
    switch (p('view')) {
      case 'equipe':
        return Response.json({ equipe: await listEquipe(player.id) })
      case 'supervisao':
        return Response.json({ historico: await supervisionHistory(player.id, p('dealer') ?? '') })
      case 'recompensas':
        return Response.json({
          recompensas: await listRewards(player.id, {
            status: (p('status') as RecompensaStatus | null) ?? null,
            voteId: p('voto'),
            destinatarioId: p('destinatario'),
          }),
        })
      case 'recompensa':
        return Response.json({ historico: await rewardHistory(player.id, p('id') ?? '') })
      case 'jogadores':
        return Response.json({ jogadores: await listJogadores(player.id, p('q')) })
      case 'jogador':
        return Response.json(await getPlayerSummary(player.id, p('id') ?? '', p('nivel') === 'completo' ? 'completo' : 'resumido'))
      case 'log':
        return Response.json({ log: await listAdminLog(player.id, { action: p('acao'), targetId: p('alvo'), limit: Number(p('limit') ?? 100) }) })
      case 'config':
        return Response.json({ config: await listConfig(player.id) })
      case 'itens': {
        const ator = await requireActor(player.id)
        requireCan(ator, 'dv.criar') // equipe escolhe itens ao propor recompensas
        const kind = p('tipo')
        return Response.json({ itens: await listItemDefs((ITEM_KINDS as string[]).includes(kind ?? '') ? (kind as ItemKind) : undefined) })
      }
      default:
        return Response.json({ ok: false, error: 'Visão desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}

function proposta(b: Record<string, unknown>): Partial<PropostaInput> {
  const out: Partial<PropostaInput> = {}
  if (b.tipo !== undefined) out.tipo = b.tipo as PropostaInput['tipo']
  if (b.voteId !== undefined) out.voteId = b.voteId === null ? null : str(b.voteId)
  if (b.origem !== undefined) out.origem = str(b.origem)
  if (b.destinatarioId !== undefined) out.destinatarioId = str(b.destinatarioId)
  if (b.recurso !== undefined) out.recurso = b.recurso as PropostaInput['recurso']
  if (b.chave !== undefined) out.chave = b.chave === null ? null : str(b.chave)
  if (b.quantidade !== undefined) out.quantidade = Number(b.quantidade)
  if (b.justificativa !== undefined) out.justificativa = str(b.justificativa)
  return out
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || typeof b.action !== 'string') return Response.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 })
  const me = player.id
  try {
    switch (b.action) {
      case 'cargo.definir':
        return Response.json({ ok: true, ...(await setCargo(me, str(b.playerId), b.cargo, b.supervisorId)) })
      case 'dealer.transferir':
        await transferDealer(me, str(b.dealerId), str(b.supervisorId))
        break
      case 'recompensa.propor':
        return Response.json({
          ok: true,
          id: await proposeReward(me, proposta(b) as PropostaInput, { aprovar: b.aprovar === true, entregar: b.entregar === true }),
        })
      case 'recompensa.editar':
        return Response.json({ ok: true, recompensa: await editReward(me, str(b.id), proposta(b)) })
      case 'recompensa.aprovar':
        await approveReward(me, str(b.id), { nota: str(b.nota) || null, entregar: b.entregar === true })
        break
      case 'recompensa.rejeitar':
        await rejectReward(me, str(b.id), str(b.nota) || null)
        break
      case 'recompensa.cancelar':
        await cancelReward(me, str(b.id))
        break
      case 'recompensa.entregar':
        return Response.json({ ok: true, entregou: await deliverReward(me, str(b.id)) })
      case 'desbloqueio.definir':
        await ownerSetUnlock(me, str(b.playerId), b.flag, b.on !== false)
        break
      case 'karma.ajustar':
        return Response.json({ ok: true, karma: await ownerAdjustKarma(me, str(b.playerId), Number(b.delta), str(b.motivo)) })
      case 'item.conceder':
      case 'item.retirar': {
        const saldo = await txAs(me, async (c) => {
          const ator = await requireActor(me, c)
          requireCan(ator, 'item.conceder')
          const op = { playerId: str(b.playerId), item: str(b.item), quantidade: Number(b.quantidade), motivo: str(b.motivo) || 'owner', atorId: ator.id }
          const v = b.action === 'item.conceder' ? await grantItem(op, c) : await consumeItem(op, c)
          await c.query('INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, $2, $3, $4)', [
            ator.id,
            b.action,
            op.playerId,
            JSON.stringify({ item: op.item, quantidade: op.quantidade, motivo: op.motivo, saldo: v }),
          ])
          return v
        })
        return Response.json({ ok: true, saldo })
      }
      case 'catalogo.definir': {
        await txAs(me, async (c) => {
          const ator = await requireActor(me, c)
          requireCan(ator, 'catalogo.editar')
          const d = (b.item ?? {}) as Record<string, unknown>
          if (!(ITEM_KINDS as unknown[]).includes(d.kind)) throw new RecordError('Tipo de item inválido.')
          await upsertItemDef(
            {
              key: str(d.key),
              kind: d.kind as ItemKind,
              name: str(d.name),
              description: str(d.description) || null,
              rarity: (str(d.rarity) || undefined) as ItemRarity | undefined,
              stackable: typeof d.stackable === 'boolean' ? d.stackable : undefined,
              meta: d.meta && typeof d.meta === 'object' ? (d.meta as Record<string, unknown>) : undefined,
              active: typeof d.active === 'boolean' ? d.active : undefined,
            },
            c,
          )
          await c.query("INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'catalogo.item', $2, $3)", [ator.id, str(d.key), JSON.stringify(d)])
        })
        break
      }
      case 'config.definir':
        await setConfig(me, str(b.key), b.value, b.provisional !== false, str(b.note) || null)
        break
      case 'autorizacao.conceder':
        return Response.json({
          ok: true,
          id: await grantAuthorization(me, {
            granteeId: str(b.granteeId),
            escopo: str(b.escopo),
            ref: str(b.ref) || null,
            expiresAt: b.expiresAt == null ? null : Number(b.expiresAt),
          }),
        })
      case 'autorizacao.revogar':
        await revokeAuthorization(me, str(b.id))
        break
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
