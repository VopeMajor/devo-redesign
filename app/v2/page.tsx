import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/app/actions/player'
import { V2App } from '@/components/v2/v2-app'
import { db } from '@/lib/db'
import { playerSaves } from '@/lib/db/schema'
import { normalizeCargo, seesAllSystems } from '@/lib/devo/cargos'
import { getCharacterName } from '@/lib/devo/character-server'
import { sanitizeSave, type SaveData } from '@/lib/devo/save'

/**
 * DEVO v2 (dono, 07/11/2026: "Caminho do meio"): interface nova, feita do zero a partir do protótipo aprovado
 * (docs/redesign/v2/kit3), sobre o mesmo login, banco e regras do jogo. Fica em /v2 só para Owner e Anfitrião até
 * estar completa; os jogadores continuam no site atual. Plano: docs/redesign/v2/PLANO-PUBLICACAO.md.
 */
export const metadata: Metadata = { title: 'DEVO v2', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function loadSave(playerId: string): Promise<SaveData | null> {
  try {
    const [row] = await db.select({ data: playerSaves.data }).from(playerSaves).where(eq(playerSaves.playerId, playerId)).limit(1)
    return row ? sanitizeSave(row.data) : null
  } catch {
    return null
  }
}

export default async function V2Page() {
  const player = await getCurrentPlayer()
  if (!player || !seesAllSystems(normalizeCargo(player.role))) redirect('/')
  const [save, characterName] = await Promise.all([loadSave(player.id), getCharacterName(player.id)])
  return <V2App initialPlayerName={player.name} initialCharacterName={characterName} initialSave={save} />
}
