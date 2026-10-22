import { getCurrentPlayer } from '@/app/actions/player'
import { abrirPacote, aprimorarMesa, getCasa, iniciarConfeccao, salvarReceitas, salvarRegras } from '@/lib/devo/casa-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Casa: Confecção de Cartas e Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md). Tudo decidido no servidor.
 * GET  /api/casa → CasaPayload ({ liberado: false, motivo } quando trancado)
 * POST /api/casa { action }:
 *   'confeccao.iniciar' { modo: 'raridade'|'combinacao', alvo?, uids, idem } → { tentativa, uids, timeDeltaMs } (as cartas saem do save)
 *   'mesa.aprimorar' { para }                                               → { mesa, timeDeltaMs }
 *   'pacote.abrir' { pacote, idem }                                         → { premio, cartasPendentes }
 * Owner ('config.editar'):
 *   'regras.salvar' { regras, provisorio? } · 'receitas.salvar' { receitas }
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[casa]', err)
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
    return Response.json(await getCasa(player.id))
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
      case 'confeccao.iniciar':
        return Response.json({ ok: true, ...(await iniciarConfeccao(player.id, body)) })
      case 'mesa.aprimorar':
        return Response.json({ ok: true, ...(await aprimorarMesa(player.id, body)) })
      case 'pacote.abrir':
        return Response.json({ ok: true, ...(await abrirPacote(player.id, body)) })
      case 'regras.salvar':
        return Response.json({ ok: true, regras: await salvarRegras(player.id, body.regras, body.provisorio) })
      case 'receitas.salvar':
        return Response.json({ ok: true, receitas: await salvarReceitas(player.id, body.receitas) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
