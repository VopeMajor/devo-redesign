import { getCurrentPlayer } from '@/app/actions/player'
import { fimPrimeiraVisita, getCatedral, ritual } from '@/lib/devo/catedral-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Catedral de Damasco (DEVO v2), destino do "Sair de casa".
 * GET  /api/catedral → CatedralPayload ({ liberado: false, motivo } sem a Casa)
 * POST /api/catedral { action }:
 *   'visita.fim' { fim: 'altar'|'casa', escolhas? } → { descoberta, caos, oferendas }
 *   'ritual' { oferenda, idem, forca? } → { oferenda, resultado, restam } (forca: só a equipe, para testar)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[catedral]', err)
  const code = (err as { code?: string } | null)?.code
  if (code === '42703' || code === '42P01' || code === '42883') {
    return Response.json({ ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' }, { status: 503 })
  }
  return Response.json({ ok: false, error: 'A Catedral não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await getCatedral(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  try {
    switch (body.action) {
      case 'visita.fim':
        return Response.json({ ok: true, ...(await fimPrimeiraVisita(player.id, body)) })
      case 'ritual':
        return Response.json({ ok: true, ...(await ritual(player.id, body)) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
