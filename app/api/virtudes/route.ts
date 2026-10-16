import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { ajustarPotencial, definirAfinidades, definirArcano, definirEstagios, estadoVirtudes, evoluirEstagio, mesaVirtudes } from '@/lib/devo/virtudes-server'

export const dynamic = 'force-dynamic'

/**
 * Virtudes. Contrato: docs/redesign/FUNDACAO.md §12.
 * GET  /api/virtudes                                   → VirtudesPayload (qualitativo; trancado com motivo)
 * GET  /api/virtudes?view=mesa[&q=]                    → VirtudesMesa (Owner/Anfitrião; com números)
 * POST /api/virtudes { action: 'evoluir', playerId }   → EvolucaoResultado (Owner/Anfitrião)
 * POST /api/virtudes { action: 'arcano', playerId, arcano | null }       (Owner/Anfitrião)
 * POST /api/virtudes { action: 'potencial', playerId, virtude, quantidade, motivo? } → { aplicado } (Owner)
 * POST /api/virtudes { action: 'afinidades', value, provisorio? }        (Owner)
 * POST /api/virtudes { action: 'estagios', value, provisorio? }          (Owner)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[virtudes]', err)
  return Response.json({ ok: false, error: 'Falha nas Virtudes.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const url = new URL(req.url)
  try {
    if (url.searchParams.get('view') === 'mesa') return Response.json(await mesaVirtudes(player.id, url.searchParams.get('q')))
    return Response.json(await estadoVirtudes(player.id))
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
      case 'evoluir':
        return Response.json(await evoluirEstagio(player.id, body.playerId))
      case 'arcano':
        return Response.json({ ok: true, ...(await definirArcano(player.id, body.playerId, body.arcano ?? null)) })
      case 'potencial':
        return Response.json({ ok: true, ...(await ajustarPotencial(player.id, body.playerId, body.virtude, body.quantidade, body.motivo)) })
      case 'afinidades':
        return Response.json(await definirAfinidades(player.id, body.value, body.provisorio !== false))
      case 'estagios':
        return Response.json(await definirEstagios(player.id, body.value, body.provisorio !== false))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
