import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { estadoTorres, marcarApresentacao, registrarReflexao, respostaFaDoGalo, subirAndar } from '@/lib/devo/torres-server'

export const dynamic = 'force-dynamic'

/**
 * Torres de Ruptura. Contrato: docs/redesign/TORRES.md.
 * GET  /api/torres                                   → TorresPayload (trancado com motivo, ou torres + andares + saldos)
 * POST /api/torres { action: 'subir', torre, andar } → SubirResposta (paga essências, registra, entrega chave)
 * POST /api/torres { action: 'galo.fa', aceitar }    → { concedido, galoFa }  (uma vez só)
 * POST /api/torres { action: 'galo.visto' }          → { ok }  (fim ou pulo da apresentação)
 * POST /api/torres { action: 'reflexao', escolha }   → { registrado }  ("Anfitrião de quê?", 1–5)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[torres]', err)
  return Response.json({ ok: false, error: 'Falha nas Torres de Ruptura.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await estadoTorres(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  try {
    switch (body?.action) {
      case 'subir':
        return Response.json(await subirAndar(player.id, body.torre, body.andar))
      case 'galo.fa':
        return Response.json({ ok: true, ...(await respostaFaDoGalo(player.id, body.aceitar === true)) })
      case 'galo.visto':
        await marcarApresentacao(player.id)
        return Response.json({ ok: true })
      case 'reflexao':
        return Response.json({ ok: true, ...(await registrarReflexao(player.id, body.escolha)) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
