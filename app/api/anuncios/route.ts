import { getCurrentPlayer } from '@/app/actions/player'
import { getAnuncios, salvarAnuncios } from '@/lib/devo/anuncios-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Anúncios rápidos da tela inicial.
 * GET  /api/anuncios → AnunciosPayload (os do Owner + eventos do Calendário dos próximos 14 dias)
 * POST /api/anuncios { action: 'salvar', anuncios } (Owner) → { ok, anuncios }
 */
function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[anuncios]', err)
  return Response.json({ ok: false, error: 'Os anúncios não responderam.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await getAnuncios(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  try {
    if (body.action === 'salvar') return Response.json({ ok: true, anuncios: await salvarAnuncios(player.id, body.anuncios) })
    return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    return fail(err)
  }
}
