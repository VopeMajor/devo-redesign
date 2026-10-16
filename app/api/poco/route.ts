import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { concluirApresentacao, escolherBalde, getPoco, girarManivela, iniciarManivela, inspecionarBalde, lancarMoeda } from '@/lib/devo/poco-server'

export const dynamic = 'force-dynamic'

/**
 * Poço dos Milagres (contrato: docs/redesign/FUNDACAO.md §10). Tudo decidido no servidor; o cliente só mostra.
 * GET  /api/poco → PocoPayload ({ liberado: false, motivo } quando trancado)
 * POST /api/poco { action }:
 *   'apresentacao.concluir'          → { ok, recebeu, saldo }   (Dracma do encapuzado, uma vez só)
 *   'balde.escolher' { balde }       → { ok, balde }
 *   'moeda.lancar' { moeda | gratis } → { ok, aberto }          (consome a moeda / o giro grátis do dia)
 *   'manivela.iniciar' { lento? }    → { ok, params }           (parâmetros do ponteiro, derivados do segredo)
 *   'manivela.girar' { toques }      → { ok, acertos, maxAcertos } (servidor conta os acertos e sorteia)
 *   'balde.inspecionar'              → { ok, resultado }         (revela o prêmio e o segredo do sorteio)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[poco]', err)
  return Response.json({ ok: false, error: 'O poço não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    return Response.json(await getPoco(player.id))
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
      case 'apresentacao.concluir':
        return Response.json({ ok: true, ...(await concluirApresentacao(player.id)) })
      case 'balde.escolher':
        return Response.json({ ok: true, ...(await escolherBalde(player.id, body.balde)) })
      case 'moeda.lancar':
        return Response.json({ ok: true, aberto: await lancarMoeda(player.id, { moeda: body.moeda, gratis: body.gratis }) })
      case 'manivela.iniciar':
        return Response.json({ ok: true, params: await iniciarManivela(player.id, { lento: body.lento }) })
      case 'manivela.girar':
        return Response.json({ ok: true, ...(await girarManivela(player.id, { toques: body.toques })) })
      case 'balde.inspecionar':
        return Response.json({ ok: true, resultado: await inspecionarBalde(player.id) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
