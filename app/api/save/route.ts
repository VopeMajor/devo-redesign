import { sql } from 'drizzle-orm'
import { getCurrentPlayer } from '@/app/actions/player'
import { db } from '@/lib/db'
import { playerSaves } from '@/lib/db/schema'
import { MAX_SAVE_BYTES, sanitizeSave } from '@/lib/devo/save'
import { uidsNoSalao } from '@/lib/devo/salao-server'

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
  // Cartas entregues ao Salão das Máscaras (Bandeja/Mercado) saíram do save no servidor: uma cópia antiga vinda do
  // cliente não as faz voltar (sem duplicar). A devolução/arremate chega por card_deliveries, com outro uid.
  const noSalao = await uidsNoSalao(player.id)
  if (noSalao.size) data.inventory = data.inventory.filter((c) => !noSalao.has(c.uid))

  await db
    .insert(playerSaves)
    .values({ playerId: player.id, data })
    .onConflictDoUpdate({ target: playerSaves.playerId, set: { data, updatedAt: sql`now()` } })

  return Response.json({ ok: true })
}
