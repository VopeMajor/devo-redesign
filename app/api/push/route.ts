import { and, eq } from 'drizzle-orm'
import { getCurrentPlayer } from '@/app/actions/player'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { getVapidKeys } from '@/lib/push'

export async function GET() {
  const { publicKey } = await getVapidKeys()
  return Response.json({ publicKey })
}

type SubscriptionBody = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => null)) as SubscriptionBody | null
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000) {
    return Response.json({ ok: false }, { status: 400 })
  }
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) {
    return Response.json({ ok: false }, { status: 400 })
  }

  await db
    .insert(pushSubscriptions)
    .values({ endpoint, playerId: player.id, p256dh, auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { playerId: player.id, p256dh, auth } })

  return Response.json({ ok: true })
}

export async function DELETE(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false }, { status: 401 })
  const body = (await req.json().catch(() => null)) as SubscriptionBody | null
  if (typeof body?.endpoint !== 'string') return Response.json({ ok: false }, { status: 400 })
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.playerId, player.id)))
  return Response.json({ ok: true })
}
