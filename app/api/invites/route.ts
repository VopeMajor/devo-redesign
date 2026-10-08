import { getCurrentPlayer } from '@/app/actions/player'
import { createInvite, listInvites, revokeInvite } from '@/lib/devo/invites-server'
import { RecordError } from '@/lib/devo/record-server'

export const dynamic = 'force-dynamic'

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[invites]', err)
  return Response.json({ ok: false, error: 'Falha ao gerenciar convites.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await listInvites(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  try {
    if (body?.action === 'create') return Response.json({ ok: true, code: await createInvite(player.id, body) })
    if (body?.action === 'revoke') {
      await revokeInvite(player.id, body.code)
      return Response.json({ ok: true })
    }
    return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    return fail(err)
  }
}
