import { getCurrentPlayer } from '@/app/actions/player'
import { fimVisitaSimon, getCasaMapa, salvarAparencia } from '@/lib/devo/casa-mapa-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Casa em RPG Maker (DEVO v2): o mapa da casa. A Confecção e os Pacotes continuam em /api/casa.
 * GET  /api/casa/mapa → CasaMapaPayload ({ liberado: false, motivo } quando trancada)
 * POST /api/casa/mapa { action }:
 *   'aparencia.salvar' { aparencia, idem } → { aparencia, mudou, primeira, timeDeltaMs } (1ª grátis; troca = 1 hora)
 *   'visita.simon' { fim: 'atendeu'|'ignorou', guardaChuva?: 'ficou'|'deu', escolhas? } → { resultado, guardaChuva }
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[casa/mapa]', err)
  const code = (err as { code?: string } | null)?.code
  if (code === '42703' || code === '42P01' || code === '42883') {
    return Response.json({ ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' }, { status: 503 })
  }
  return Response.json({ ok: false, error: 'A casa não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await getCasaMapa(player.id))
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
      case 'aparencia.salvar':
        return Response.json({ ok: true, ...(await salvarAparencia(player.id, body)) })
      case 'visita.simon':
        return Response.json({ ok: true, ...(await fimVisitaSimon(player.id, body)) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
