import { npcPortrait, type PortraitArt } from '@/lib/devo/npcs'
import type { NpcRef } from '@/lib/devo/torres/tipos'

/**
 * Retrato de um NPC numa expressão, pelo mapa único do elenco (`lib/devo/npcs.ts`: ELENCO/EXPRESSOES).
 * Expressão que o NPC não tem cai na de repouso (`resolveExpressao`). Caminho explícito no conteúdo vence.
 */
export function retratoDe(npc: Pick<NpcRef, 'id' | 'retrato'>, pose?: string): PortraitArt | null {
  if (npc.retrato) return { src: npc.retrato, position: '50% 0%' }
  return npcPortrait(npc.id, pose)
}
