import { getCurrentPlayer } from '@/app/actions/player'
import {
  applyVoteResults,
  setEntryPrizes,
  createVote,
  getRecord,
  getStaffBoard,
  joinVote,
  leaveVote,
  RecordError,
  setAvatar,
  setEntryAdmission,
  setEntryDecision,
  trocarCartas,
  setEntryOutcome,
  setVoteGroup,
  setVoteStatus,
  updateVote,
} from '@/lib/devo/record-server'

export const dynamic = 'force-dynamic'

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[record]', err)
  // Banco desatualizado (coluna/tabela/função ausente): o erro genérico escondia a causa e parecia um bug do app.
  const code = (err as { code?: string } | null)?.code
  if (code === '42703' || code === '42P01' || code === '42883') {
    return Response.json(
      { ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' },
      { status: 503 },
    )
  }
  return Response.json({ ok: false, error: 'Falha no servidor do Record.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    // ?view=staff → Mesa do Dealer (todos os votos com inscritos); exige Dealer/Admin.
    if (new URL(req.url).searchParams.get('view') === 'staff') return Response.json(await getStaffBoard(player.id))
    return Response.json(await getRecord(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body.action !== 'string') return Response.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 })
  const voteId = typeof body.voteId === 'string' ? body.voteId : ''
  try {
    switch (body.action) {
      case 'join':
        await joinVote(player.id, voteId, body.cartas)
        break
      case 'cartas':
        return Response.json({ ok: true, cartas: await trocarCartas(player.id, voteId, body.cartas) })
      case 'leave':
        await leaveVote(player.id, voteId)
        break
      case 'avatar':
        await setAvatar(player.id, body.image ?? null)
        break
      case 'create':
        return Response.json({ ok: true, id: await createVote(player.id, body) })
      case 'status':
        await setVoteStatus(player.id, voteId, body.status)
        break
      case 'group':
        await setVoteGroup(player.id, voteId, body.groupUrl ?? null)
        break
      case 'outcome':
        await setEntryOutcome(player.id, voteId, String(body.playerId ?? ''), body.outcome ?? null)
        break
      // Staff / Deadly Vote (DIRECAO-3 §4): ficha, inscrições, resultado por participante e aplicação única.
      case 'edit':
        await updateVote(player.id, voteId, body)
        break
      case 'admission':
        await setEntryAdmission(player.id, voteId, String(body.playerId ?? ''), body.admission)
        break
      case 'decision':
        await setEntryDecision(player.id, voteId, String(body.playerId ?? ''), body.decision ?? null, body.note)
        break
      case 'entryPrizes':
        await setEntryPrizes(player.id, voteId, String(body.playerId ?? ''), body.prizes ?? [])
        break
      case 'apply':
        return Response.json({ ok: true, ...(await applyVoteResults(player.id, voteId)) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
