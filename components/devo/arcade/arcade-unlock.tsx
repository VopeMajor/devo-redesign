'use client'

import { useEffect } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { Frame } from '../kit/frame'
import { Stamp } from '../kit/stamp'
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
      className="fixed inset-0 z-[90] grid cursor-pointer place-items-center overflow-hidden bg-[rgba(3,4,8,0.82)] backdrop-blur-[3px] animate-dv-fade"
      onClick={() => dispatch({ type: 'ARCADE_REVEAL_DONE' })}
    >
      {/* Raios atrás do selo (dissolvem em círculo, sem borda reta) e filete cobalto que corta a tela. */}
      <span
        aria-hidden="true"
        className="en-rays pointer-events-none absolute left-1/2 top-[34%] -ml-[300px] -mt-[300px] size-[600px] opacity-55"
        style={{
          background: 'repeating-conic-gradient(rgba(236,212,154,0.26) 0 5deg, transparent 5deg 15deg)',
          WebkitMaskImage: 'radial-gradient(circle, #000 8%, transparent 48%)',
          maskImage: 'radial-gradient(circle, #000 8%, transparent 48%)',
        }}
      />
      <span aria-hidden="true" className="en-unlock-band absolute left-[-20%] top-[34%] h-[2px] w-[140%] bg-[linear-gradient(90deg,transparent,var(--dv-cobalt)_20%,var(--dv-cobalt)_80%,transparent)]" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        <p className="dv-label animate-dv-fade text-[12px] text-dv-gold-bright">Novo aplicativo desbloqueado</p>

        <div className="relative">
          <Frame tone="gold" ornate glow pad="lg" className="en-icon-in [animation-delay:350ms]">
            <span className="grid size-20 place-items-center text-dv-gold-bright">
              <ArcadeGlyph />
            </span>
          </Frame>
          <span className="absolute -right-[7.5rem] top-1/2 -translate-y-1/2">
            <Stamp text="Liberado" tone="cobalt" size={96} rotate={-12} animate className="[animation-delay:1100ms]" />
          </span>
        </div>

        {/* Título: faixa de ouro ESCURO atrás das duas linhas inteiras (texto branco com contraste AA). */}
        <h2 className="animate-dv-cut-in relative px-6 py-2 [animation-delay:700ms]">
          <span aria-hidden="true" className="absolute inset-0 -skew-x-[14deg] bg-[linear-gradient(90deg,#3a2a10,var(--dv-gold-deep)_45%,#3a2a10)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <span className="absolute inset-x-0 top-0 h-px bg-dv-gold-bright/70" />
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-dv-cobalt" />
          </span>
          <span className="relative block font-impact text-[52px] font-bold uppercase leading-[0.9] text-dv-text [text-shadow:0_2px_0_rgba(0,0,0,0.6)]">
            Sala de
            <br />
            Jogos
          </span>
        </h2>

        <p className="animate-dv-rise max-w-xs font-body text-[16px] italic leading-relaxed text-dv-text-2 [animation-delay:1000ms]">
          O sistema liberou uma nova função. Ninguém morre aqui… em teoria.
        </p>

        <div className="animate-dv-fade flex w-52 flex-col items-center gap-2.5 [animation-delay:1300ms]">
          <span aria-hidden="true" className="relative h-[2px] w-full bg-dv-line">
            <span className="en-countdown absolute inset-0 bg-dv-gold" style={{ animationDuration: '4200ms' }} />
          </span>
          <span className="dv-label text-[12px] text-dv-text-2">Toque para continuar</span>
        </div>
      </div>
    </div>
  )
}

/** Ícone da Sala de Jogos: carta e dado sobrepostos (traço do kit). */
function ArcadeGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="8" width="20" height="28" rx="2" transform="rotate(-10 17 22)" />
      <path d="M17 16 L21 22 L17 28 L13 22 Z" fill="currentColor" stroke="none" transform="rotate(-10 17 22)" />
      <rect x="23" y="20" width="18" height="18" rx="3" transform="rotate(12 32 29)" />
      <g fill="currentColor" stroke="none" transform="rotate(12 32 29)">
        <circle cx="27.5" cy="24.5" r="1.6" />
        <circle cx="32" cy="29" r="1.6" />
        <circle cx="36.5" cy="33.5" r="1.6" />
      </g>
    </svg>
  )
}
