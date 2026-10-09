import { eq } from 'drizzle-orm'
import { getCurrentPlayer } from '@/app/actions/player'
import { getCharacterName } from '@/lib/devo/character-server'
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
  const [save, characterName] = player ? await Promise.all([loadSave(player.id), getCharacterName(player.id)]) : [null, null]
  return <DevoExperience initialPlayerName={player?.name ?? null} initialCharacterName={characterName} initialSave={save} />
}
