import { getCurrentPlayer } from '@/app/actions/player'
import { uidsNoSalao } from '@/lib/devo/salao-server'

/**
 * Sala de Trocas — cartas que não podem ir à mesa: as entregues ao Salão das Máscaras (Bandeja ou Mercado).
 * O cliente bloqueia esses uids na mão; o /api/save já os descarta do inventário.
 */
export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, presas: [] }, { status: 401 })
  const presas = await uidsNoSalao(player.id)
  return Response.json({ ok: true, presas: [...presas] }, { headers: { 'cache-control': 'no-store' } })
}
