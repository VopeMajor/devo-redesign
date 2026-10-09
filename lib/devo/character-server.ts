import 'server-only'
import { pool } from '@/lib/db'

/** Nome do personagem do jogador (null se a migração character-name ainda não rodou ou não houver). */
export async function getCharacterName(playerId: string): Promise<string | null> {
  try {
    const { rows } = await pool.query<{ character_name: string | null }>('SELECT character_name FROM players WHERE id = $1', [playerId])
    return rows[0]?.character_name ?? null
  } catch {
    return null
  }
}
