import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { playerSaves, players, pushSubscriptions } from '@/lib/db/schema'
import { sendPushToPlayer } from '@/lib/push'

/** Lembrete diário do pulso. Cada jogador recebe no máximo um lembrete a cada 20 horas. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const rows = await db
    .selectDistinct({ id: players.id, name: players.name, data: playerSaves.data })
    .from(playerSaves)
    .innerJoin(players, eq(players.id, playerSaves.playerId))
    .innerJoin(pushSubscriptions, eq(pushSubscriptions.playerId, playerSaves.playerId))
    .where(or(isNull(playerSaves.lastPulseAt), lt(playerSaves.lastPulseAt, sql`now() - interval '20 hours'`)))
    .limit(500)

  let sent = 0
  for (const row of rows) {
    const endsAt = Number((row.data as { timerEndsAt?: number }).timerEndsAt ?? 0)
    const hoursLeft = Math.floor((endsAt - Date.now()) / 3_600_000)
    if (hoursLeft <= 0) continue
    const body =
      hoursLeft <= 12
        ? `${row.name}, restam só ${hoursLeft}h no seu pulso. Que pena se acabasse agora! Hihihi.`
        : `${row.name}, seu pulso marca ${hoursLeft}h. As salas de troca não vão esperar por você.`
    sent += await sendPushToPlayer(row.id, { title: 'Pulso', body, tag: 'devo-pulse' })
    await db
      .update(playerSaves)
      .set({ lastPulseAt: sql`now()` })
      .where(and(eq(playerSaves.playerId, row.id)))
  }

  return Response.json({ ok: true, players: rows.length, sent })
}
