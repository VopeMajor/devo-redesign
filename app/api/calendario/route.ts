import { getCurrentPlayer } from '@/app/actions/player'
import { definirRegras, getCalendario, mesaCalendario, removerEvento, resgatar, salvarEvento } from '@/lib/devo/calendario-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Grandioso Calendário Devo (contrato: docs/redesign/FUNDACAO.md §15). Tudo decidido no servidor.
 * GET  /api/calendario              → CalendarioPayload ({ liberado: false, motivo } quando trancado)
 * GET  /api/calendario?view=mesa    → CalendarioMesa (Owner/Anfitrião)
 * POST /api/calendario { action }:
 *   'checkin' { tipo?: 'diario' | 'evento', eventoId? } → ResgateResultado · 409 se já marcou hoje
 *   equipe: 'evento.salvar' { id?, titulo, descricao, inicio, fim?, anual, enfase, arte?, checkin? } → { id }
 *           'evento.remover' { id } · 'regras' { falta, ppVirtude, ppVirtudePadrao, provisorio? } (Owner)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[calendario]', err)
  return Response.json({ ok: false, error: 'O Calendário não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('view') === 'mesa') return Response.json(await mesaCalendario(player.id))
    return Response.json(await getCalendario(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const ok = (v: unknown) => Response.json({ ok: true, ...(v && typeof v === 'object' ? v : {}) })
  try {
    switch (b.action) {
      case 'checkin':
        return Response.json(await resgatar(player.id, { tipo: b.tipo, eventoId: b.eventoId }))
      case 'evento.salvar':
        return ok(await salvarEvento(player.id, b))
      case 'evento.remover':
        return ok(await removerEvento(player.id, b.id))
      case 'regras':
        return ok(await definirRegras(player.id, b))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
