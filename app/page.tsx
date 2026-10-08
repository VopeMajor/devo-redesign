import { eq } from 'drizzle-orm'
import { getCurrentPlayer } from '@/app/actions/player'
import { DevoExperience } from '@/components/devo/devo-experience'
import { db } from '@/lib/db'
import { playerSaves } from '@/lib/db/schema'
import { sanitizeSave, type SaveData } from '@/lib/devo/save'

async function loadSave(playerId: string): Promise<SaveData | null> {
  try {
    const [row] = await db.select({ data: playerSaves.data }).from(playerSaves).where(eq(playerSaves.playerId, playerId)).limit(1)
    return row ? sanitizeSave(row.data) : null
  } catch {
    return null
  }
}

export default async function Page() {
  const player = await getCurrentPlayer()
  const save = player ? await loadSave(player.id) : null
  return <DevoExperience initialPlayerName={player?.name ?? null} initialSave={save} />
}
