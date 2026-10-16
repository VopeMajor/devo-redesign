'use client'

import { useCallback } from 'react'
import { playerText } from '@/lib/devo/player-name'
import { callName, useDevo } from './devo-store'

/**
 * Resolve um texto dirigido ao jogador com o nome e o gênero do perfil atual
 * (marcadores `{nome}` e `{m|f}`; veja lib/devo/player-name.ts).
 */
export function usePlayerText() {
  const { state } = useDevo()
  const name = callName(state)
  const gender = state.profile.gender
  return useCallback((text: string) => playerText(text, { name, gender }), [name, gender])
}
