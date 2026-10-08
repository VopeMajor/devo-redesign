import { sql } from 'drizzle-orm'
import { getCurrentPlayer } from '@/app/actions/player'
import { db } from '@/lib/db'
import { playerSaves } from '@/lib/db/schema'
import { MAX_SAVE_BYTES, sanitizeSave } from '@/lib/devo/save'

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false }, { status: 401 })

  const text = await req.text()
  if (text.length > MAX_SAVE_BYTES) return Response.json({ ok: false }, { status: 413 })

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
  const data = sanitizeSave(raw)
  if (!data) return Response.json({ ok: false }, { status: 400 })

  await db
    .insert(playerSaves)
    .values({ playerId: player.id, data })
    .onConflictDoUpdate({ target: playerSaves.playerId, set: { data, updatedAt: sql`now()` } })

  return Response.json({ ok: true })
}
