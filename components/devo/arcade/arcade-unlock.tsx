'use client'

import { Gamepad2 } from 'lucide-react'
import { useEffect } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { useDevo } from '../state/devo-store'

const INITIAL_APPS = ['pulso', 'mensagens', 'cartas', 'trocas', 'ajustes'] as const

/** Libera a Sala de Jogos quando o jogador já abriu todos os apps iniciais e mostra a revelação. */
export function ArcadeUnlock() {
  const { state, dispatch } = useDevo()
  const seenAll = INITIAL_APPS.every((id) => state.seenApps.includes(id))

  useEffect(() => {
    if (state.arcadeUnlocked || !seenAll) return
    const t = window.setTimeout(() => dispatch({ type: 'UNLOCK_ARCADE' }), 1200)
    return () => window.clearTimeout(t)
  }, [seenAll, state.arcadeUnlocked, dispatch])

  useEffect(() => {
    if (!state.arcadeReveal) return
    playSfx('reveal')
    const s = window.setTimeout(() => playSfx('confirm'), 700)
    const done = window.setTimeout(() => dispatch({ type: 'ARCADE_REVEAL_DONE' }), 4200)
    return () => {
      window.clearTimeout(s)
      window.clearTimeout(done)
    }
  }, [state.arcadeReveal, dispatch])

  if (!state.arcadeReveal) return null
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[90] grid cursor-pointer place-items-center bg-black/70 backdrop-blur-[2px] animate-[devo-fade-in_0.4s_ease-out]"
      onClick={() => dispatch({ type: 'ARCADE_REVEAL_DONE' })}
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <p className="animate-[devo-glitch_0.6s_steps(2)_2] font-mono text-[11px] uppercase tracking-[0.5em] text-[#6f8cff]">Novo aplicativo desbloqueado</p>
        <div className="relative grid size-24 place-items-center border border-[#6f8cff]/70 bg-[#1a1208] shadow-[0_0_60px_-10px_#6f8cff] animate-[devo-pop_0.6s_0.5s_ease-out_both]">
          <span aria-hidden="true" className="absolute inset-0 animate-ping border border-[#6f8cff]/40" />
          <Gamepad2 className="size-10 text-[#6f8cff]" aria-hidden="true" />
        </div>
        <p className="font-serif text-3xl tracking-[0.25em] text-foreground animate-[devo-fade-in_0.6s_0.9s_ease-out_both]">SALA DE JOGOS</p>
        <p className="max-w-xs text-sm text-foreground/55 animate-[devo-fade-in_0.6s_1.3s_ease-out_both]">O sistema liberou uma nova função. Ninguém morre aqui… em teoria.</p>
      </div>
    </div>
  )
}
