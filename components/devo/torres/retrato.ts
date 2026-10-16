import { NPC_PORTRAITS, type PortraitArt } from '@/lib/devo/npcs'
import type { NpcRef } from '@/lib/devo/torres/tipos'

/**
 * Sprites do Galo recortados da folha OC do dono (docs/redesign/refs/npc-oc/galo.png, 4×3) só para as Torres,
 * enquanto o Galo não entra no mapa único `lib/devo/npcs.ts` (agente Elenco). Quando entrar, o mapa único
 * tem prioridade: basta ter a mesma pose lá.
 */
const GALO_LOCAL = ['neutro', 'sorriso', 'risada', 'desdem', 'bravo', 'espanto', 'sem-graca', 'satisfeito', 'sombrio', 'piscada', 'tedio', 'convencido'] as const

/** Retrato de um NPC numa pose: mapa único (pose exata) → sprites locais do Galo → neutro do mapa → nada. */
export function retratoDe(npc: Pick<NpcRef, 'id' | 'retrato'>, pose?: string): PortraitArt | null {
  if (npc.retrato) return { src: npc.retrato, position: '50% 0%' }
  const set = (NPC_PORTRAITS as Record<string, Record<string, PortraitArt>>)[npc.id]
  if (set && pose && set[pose]) return set[pose]
  if (npc.id === 'galo') {
    const p = (GALO_LOCAL as readonly string[]).includes(pose ?? '') ? pose : 'neutro'
    if (set?.neutral && !pose) return set.neutral
    return { src: `/images/torres/galo/${p}.webp`, position: '50% 0%' }
  }
  return set?.[pose ?? 'neutral'] ?? set?.neutral ?? null
}
