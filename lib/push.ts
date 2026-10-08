import 'server-only'

import { eq } from 'drizzle-orm'
import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushConfig, pushSubscriptions } from '@/lib/db/schema'

export type PushPayload = { title: string; body: string; tag?: string; url?: string }

let cached: { publicKey: string; privateKey: string } | null = null

/** Chaves VAPID ficam no banco; são criadas na primeira vez que alguém precisa delas. */
export async function getVapidKeys() {
  if (cached) return cached
  const [row] = await db.select().from(pushConfig).where(eq(pushConfig.id, 1)).limit(1)
  if (row) {
    cached = { publicKey: row.publicKey, privateKey: row.privateKey }
    return cached
  }
  const keys = webpush.generateVAPIDKeys()
  await db.insert(pushConfig).values({ id: 1, publicKey: keys.publicKey, privateKey: keys.privateKey }).onConflictDoNothing()
  const [saved] = await db.select().from(pushConfig).where(eq(pushConfig.id, 1)).limit(1)
  cached = { publicKey: saved.publicKey, privateKey: saved.privateKey }
  return cached
}

export async function sendPushToPlayer(playerId: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.playerId, playerId))
  if (!subs.length) return 0
  const { publicKey, privateKey } = await getVapidKeys()
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
          vapidDetails: { subject: 'mailto:anfitriao@devo.game', publicKey, privateKey },
          TTL: 60 * 60 * 12,
        })
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint))
        }
      }
    }),
  )
  return sent
}
