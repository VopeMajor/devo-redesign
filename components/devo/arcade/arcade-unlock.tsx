'use client'

import { useEffect } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { Frame } from '../kit/frame'
import { Stamp } from '../kit/stamp'
import { ImpactTitle } from '../kit/typography'
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
      {/* Faixas de corte (ouro = conquista) e raios atrás do selo. */}
      <span aria-hidden="true" className="en-unlock-band absolute left-[-20%] top-[38%] h-28 w-[140%] bg-[linear-gradient(90deg,transparent,rgba(124,95,42,0.55)_20%,rgba(201,164,92,0.6)_50%,rgba(124,95,42,0.55)_80%,transparent)]" />
      <span aria-hidden="true" className="en-unlock-band absolute left-[-20%] top-[38%] mt-[118px] h-[3px] w-[140%] bg-dv-cobalt [animation-delay:120ms]" />
      <span
        aria-hidden="true"
        className="en-rays pointer-events-none absolute left-1/2 top-[40%] -ml-[220px] -mt-[220px] size-[440px] opacity-50"
        style={{ background: 'repeating-conic-gradient(rgba(236,212,154,0.28) 0 5deg, transparent 5deg 15deg)', maskImage: 'radial-gradient(circle, black 15%, transparent 65%)' }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 px-6 text-center">
        <p className="dv-label animate-dv-fade text-[11px] text-dv-gold-bright">Novo aplicativo desbloqueado</p>

        <Frame tone="gold" ornate glow pad="lg" className="en-icon-in [animation-delay:350ms]">
          <span className="grid size-20 place-items-center text-dv-gold-bright">
            <ArcadeGlyph />
          </span>
        </Frame>

        <div className="animate-dv-cut-in [animation-delay:700ms]">
          <ImpactTitle tone="gold" className="self-center" as="h2">
            Sala de Jogos
          </ImpactTitle>
        </div>

        <div className="relative -mt-2 h-0 w-full">
          <span className="absolute -top-28 right-0">
            <Stamp text="Liberado" tone="cobalt" size={110} rotate={-12} animate className="[animation-delay:1100ms]" />
          </span>
        </div>

        <p className="animate-dv-rise max-w-xs font-body text-[16px] italic leading-relaxed text-dv-text-2 [animation-delay:1000ms]">
          O sistema liberou uma nova função. Ninguém morre aqui… em teoria.
        </p>

        <div className="animate-dv-fade flex w-48 flex-col items-center gap-2 [animation-delay:1300ms]">
          <span aria-hidden="true" className="relative h-px w-full bg-dv-line">
            <span className="en-countdown absolute inset-0 bg-dv-gold" style={{ animationDuration: '4200ms' }} />
          </span>
          <span className="dv-label text-[10px] text-dv-text-3">Toque para continuar</span>
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
