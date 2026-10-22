import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { ajustarPotencial, definirAfinidades, definirArcano, definirEstagios, definirTextoArcano, despertarArcano, escolherArcano, estadoVirtudes, evoluirArcano, evoluirEstagio, mesaVirtudes } from '@/lib/devo/virtudes-server'

export const dynamic = 'force-dynamic'

/**
 * Virtudes. Contrato: docs/redesign/FUNDACAO.md §12.
 * GET  /api/virtudes                                   → VirtudesPayload (qualitativo; trancado com motivo)
 * GET  /api/virtudes?view=mesa[&q=]                    → VirtudesMesa (Owner/Anfitrião; com números)
 * POST /api/virtudes { action: 'arcano.evoluir', arcano, de? }   → ArcanoAcaoResultado (o jogador paga os Fragmentos Arcanos)
 * POST /api/virtudes { action: 'arcano.despertar', arcano }      → ArcanoAcaoResultado (gasta 1 Grande Fragmento Arcano)
 * POST /api/virtudes { action: 'evoluir', playerId, arcano? }     → EvolucaoResultado (Owner/Anfitrião, pela Mesa)
 * POST /api/virtudes { action: 'arcano', playerId, arcano | null }       (Owner/Anfitrião)
 * POST /api/virtudes { action: 'potencial', playerId, virtude, quantidade, motivo? } → { aplicado } (Owner)
 * POST /api/virtudes { action: 'afinidades', value, provisorio? }        (Owner)
 * POST /api/virtudes { action: 'estagios', value, provisorio? }          (Owner)
 * POST /api/virtudes { action: 'arcano-texto', arcano, value | null, provisorio? } (Owner; null = volta ao rascunho)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[virtudes]', err)
  // Banco desatualizado (coluna/tabela/função ausente, ex.: player_arcanos): diz a causa em vez de um erro genérico.
  const code = (err as { code?: string } | null)?.code
  if (code === '42703' || code === '42P01' || code === '42883') {
    return Response.json(
      { ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' },
      { status: 503 },
    )
  }
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
      case 'arcano.evoluir':
        return Response.json(await evoluirArcano(player.id, body.arcano, body.de))
      case 'arcano.escolher':
        return Response.json(await escolherArcano(player.id, body.escolha, body.arcano))
      case 'arcano.despertar':
        return Response.json(await despertarArcano(player.id, body.arcano))
      case 'evoluir':
        return Response.json(await evoluirEstagio(player.id, body.playerId, body.arcano))
      case 'arcano':
        return Response.json({ ok: true, ...(await definirArcano(player.id, body.playerId, body.arcano ?? null)) })
      case 'potencial':
        return Response.json({ ok: true, ...(await ajustarPotencial(player.id, body.playerId, body.virtude, body.quantidade, body.motivo)) })
      case 'afinidades':
        return Response.json(await definirAfinidades(player.id, body.value, body.provisorio !== false))
      case 'estagios':
        return Response.json(await definirEstagios(player.id, body.value, body.provisorio !== false))
      case 'arcano-texto':
        return Response.json(await definirTextoArcano(player.id, body.arcano, body.value ?? null, body.provisorio !== false))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
