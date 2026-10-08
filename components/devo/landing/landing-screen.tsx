'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playSfx, preloadMusic } from '@/lib/devo/audio'
import { enterFullscreen } from '@/lib/devo/fullscreen'
import { formatDuration } from '../hooks'
import { Button } from '../kit/button'
import { ScreenFrame } from '../kit/frame'
import { GlyphHourglass } from '../kit/glyphs'
import { SceneBackdrop, type SceneFocus } from '../kit/scene'
import { TimeDigits } from '../kit/time'
import { Divider, Kicker } from '../kit/typography'
import { SoundToggle } from '../shared/sound-toggle'

const START_MS = 72 * 3600 * 1000
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Tela inicial — prova da identidade "Tribunal do Relógio".
 * O astrolábio 3D (preset `sigil`) é posicionado exatamente atrás do bloco `hero`, medido em tempo real.
 * Funções preservadas: Começar (sempre pede convite), Continuar, Sair, som, dica "toque para ouvir".
 */
export function LandingScreen({
  playerName,
  canContinue,
  onStart,
  onContinue,
  onSignOut,
}: {
  playerName: string | null
  canContinue: boolean
  onStart: () => void
  onContinue: () => void
  onSignOut?: () => void
}) {
  const [awake, setAwake] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mainRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [focus, setFocus] = useState<SceneFocus | undefined>(undefined)

  useEffect(() => {
    preloadMusic()
    const id = window.setInterval(() => setElapsed((e) => e + 1000), 1000)
    const wake = () => setAwake(true)
    window.addEventListener('pointerdown', wake, { once: true })
    window.addEventListener('keydown', wake, { once: true })
    return () => {
      window.clearInterval(id)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [])

  // Mede o hero para centralizar o astrolábio 3D (e o desenho de fallback) nele.
  useIso(() => {
    const main = mainRef.current
    const hero = heroRef.current
    if (!main || !hero) return
    const measure = () => {
      const m = main.getBoundingClientRect()
      const h = hero.getBoundingClientRect()
      if (!m.width || !m.height) return
      const d = Math.min(h.width * 0.94, h.height * 1.02)
      setFocus({
        x: (h.left - m.left + h.width / 2) / m.width,
        y: (h.top - m.top + h.height / 2) / m.height,
        size: d / Math.min(m.width, m.height),
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    ro.observe(hero)
    return () => ro.disconnect()
  }, [])

  return (
    <main ref={mainRef} className="relative flex min-h-dvh flex-col overflow-hidden bg-dv-ink text-dv-text lg:h-dvh">
      <SceneBackdrop preset="sigil" intensity={0.9} focus={focus} dim={0.08} />
      <ScreenFrame tone="gold" />

      {/* Barra superior: identidade do sistema + som */}
      <header className="dv-safe-top relative z-20 flex items-center justify-between px-7 pt-3">
        <p className="dv-label text-[11px] text-dv-text-2">
          Devo<span className="text-dv-cobalt-text">.System</span>
        </p>
        <SoundToggle compact className="-mr-2 min-h-11 min-w-11 justify-center text-dv-gold/80 hover:text-dv-gold-bright" />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-7 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:flex-row lg:gap-16 lg:px-16">
        {/* Hero: o astrolábio 3D fica atrás deste bloco. */}
        <div ref={heroRef} className="relative flex min-h-[210px] w-full flex-1 items-end justify-center lg:h-full lg:min-h-0 lg:items-center">
          <span className="sr-only">Símbolo do Deadly Vote: estrela de quatro pontas atravessada por uma órbita, dentro de um astrolábio</span>
        </div>

        <section className="flex w-full max-w-sm shrink-0 flex-col items-center text-center lg:max-w-md">
          <Kicker tone="gold" className="animate-dv-fade justify-center [animation-delay:200ms]">
            A verdade é um voto
          </Kicker>

          <h1 className="relative mt-3 flex flex-col items-center">
            <span className="animate-dv-cut-in block font-serif text-[62px] font-medium uppercase leading-[0.84] tracking-[0.02em] text-dv-text [animation-delay:280ms] [text-shadow:0_4px_30px_rgba(5,7,13,0.9)]">
              Deadly{' '}
            </span>
            <span className="relative block [animation-delay:360ms] animate-dv-cut-in">
              <span aria-hidden="true" className="absolute -inset-x-6 bottom-[16%] top-[30%] -skew-x-[18deg] bg-[linear-gradient(90deg,transparent,var(--dv-cobalt-deep)_18%,var(--dv-cobalt-deep)_82%,transparent)] opacity-80" />
              <span className="relative block font-serif text-[62px] font-medium uppercase leading-[0.84] tracking-[0.02em] text-dv-text [text-shadow:0_4px_30px_rgba(5,7,13,0.7)]">
                Vote
              </span>
            </span>
            <span className="animate-dv-fade mt-3 block font-sans text-[13px] font-medium uppercase tracking-[0.62em] text-dv-cobalt-text [animation-delay:480ms]">
              Record System
            </span>
            <span lang="ja" className="mt-1 block text-[11px] tracking-[0.3em] text-dv-text-3">
              デッドリーボート・記録
            </span>
          </h1>

          <p className="animate-dv-fade mt-3 text-balance font-serif text-[18px] italic leading-snug text-dv-text-2 [animation-delay:560ms]">
            O tempo é a vida. O jogo é a única fonte dela.
          </p>

          {playerName && (
            <p className="mt-2.5 text-[11px] uppercase tracking-[0.3em] text-dv-cobalt-text">
              Bem-vindo de volta, <span className="text-dv-text">{playerName}</span>
              {onSignOut && (
                <>
                  {' · '}
                  <button type="button" onClick={onSignOut} className="dv-focus inline-flex min-h-11 items-center px-1 text-dv-text-3 underline-offset-4 hover:text-dv-text hover:underline">
                    Sair
                  </button>
                </>
              )}
            </p>
          )}

          {/* Relógio do pulso: 72h — moldura de "bilhete" com filete dourado. */}
          <div className="animate-dv-rise relative mt-4 flex items-center gap-3 px-5 py-2 [animation-delay:620ms]">
            <span aria-hidden="true" className="absolute inset-0 border-y border-dv-gold/45 bg-[linear-gradient(90deg,transparent,rgba(10,15,28,0.85)_18%,rgba(10,15,28,0.85)_82%,transparent)]" />
            <GlyphHourglass className="relative size-5 text-dv-gold" />
            <span className="dv-label relative text-[10px] text-dv-text-3">Pulso</span>
            <TimeDigits value={formatDuration(START_MS - elapsed)} size="md" tone="cobalt" label="Tempo no pulso" className="relative" />
          </div>

          <div className="mt-5 flex w-full flex-col gap-3">
            <div className="animate-dv-rise [animation-delay:700ms]">
            <Button
              variant="primary"
              size="lg"
              block
              onMouseEnter={() => awake && playSfx('hover')}
              onClick={() => {
                playSfx('whoosh')
                enterFullscreen()
                onStart()
              }}
            >
              Começar
            </Button>
            </div>
            <div className="animate-dv-rise [animation-delay:780ms]">
            <Button
              variant="secondary"
              size="lg"
              block
              disabled={!canContinue}
              onMouseEnter={() => awake && canContinue && playSfx('hover')}
              onClick={() => {
                playSfx('click')
                enterFullscreen()
                onContinue()
              }}
            >
              Continuar
            </Button>
            </div>
          </div>

          <Divider variant="clock" tone="gold" className="mt-4 w-full max-w-[220px] opacity-70" />
          <p className="mt-2 h-4 text-[11px] uppercase tracking-[0.3em] text-dv-text-3" aria-live="polite">
            {awake ? '' : 'Toque em qualquer lugar para ouvir'}
          </p>
        </section>
      </div>
    </main>
  )
}
