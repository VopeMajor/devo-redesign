import { getCurrentPlayer } from '@/app/actions/player'
import { createVote, getRecord, getStaffBoard, joinVote, leaveVote, RecordError, setAvatar, setEntryOutcome, setVoteStatus } from '@/lib/devo/record-server'

export const dynamic = 'force-dynamic'

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[record]', err)
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
        await joinVote(player.id, voteId)
        break
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
      case 'outcome':
        await setEntryOutcome(player.id, voteId, String(body.playerId ?? ''), body.outcome ?? null)
        break
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
