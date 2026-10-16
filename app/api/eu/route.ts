import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import { claimCards, readInventory } from '@/lib/devo/inventario-server'
import { ITEM_KINDS, type ItemKind } from '@/lib/devo/progresso'
import { getEu } from '@/lib/devo/progresso-server'

export const dynamic = 'force-dynamic'

/**
 * Dados do PRÓPRIO jogador (Fundação). Contrato: docs/redesign/FUNDACAO.md.
 * GET  /api/eu                         → EuPayload (cargo, inventário, desbloqueios, destino, convites, cartas pendentes)
 * GET  /api/eu?parte=inventario&tipo=moeda,essencia → { inventario }
 * POST /api/eu { action: 'cartas.resgatar' } → { ok, cartas: CardDelivery[] } (o cliente põe no save)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[eu]', err)
  return Response.json({ ok: false, error: 'Falha ao ler seus dados.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('parte') === 'inventario') {
      const kinds = (url.searchParams.get('tipo') ?? '').split(',').filter((k): k is ItemKind => (ITEM_KINDS as string[]).includes(k))
      return Response.json({ inventario: await readInventory(player.id, kinds) })
    }
    return Response.json(await getEu(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  try {
    if (body?.action === 'cartas.resgatar') return Response.json({ ok: true, cartas: await claimCards(player.id) })
    return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    return fail(err)
  }
}
