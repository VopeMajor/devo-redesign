import { getCurrentPlayer } from '@/app/actions/player'
import { sendPushToPlayer } from '@/lib/push'

export async function POST() {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false }, { status: 401 })
  const sent = await sendPushToPlayer(player.id, {
    title: 'O Anfitrião',
    body: `Testando, testando... Eu consigo te alcançar de qualquer lugar, ${player.name}. Hihihi.`,
    tag: 'devo-test',
  })
  return Response.json({ ok: sent > 0, sent })
}
