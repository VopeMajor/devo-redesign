/**
 * Estado do Card Shuffler — fonte única de nomes. O Shuffler desperta junto com a Sala de Jogos
 * (`state.arcadeUnlocked`); antes disso está "Dormente". Record e Cartas leem daqui.
 */
export type ShufflerPhase = 'idle' | 'shuffling' | 'synced'

export const SHUFFLER_LABEL = {
  dormant: 'Dormente',
  awake: 'Desperto',
  shuffling: 'Embaralhando',
  synced: 'Sincronia completa',
} as const

export function shufflerStatus(awake: boolean, phase: ShufflerPhase = 'idle'): string {
  if (!awake) return SHUFFLER_LABEL.dormant
  if (phase === 'shuffling') return SHUFFLER_LABEL.shuffling
  if (phase === 'synced') return SHUFFLER_LABEL.synced
  return SHUFFLER_LABEL.awake
}
