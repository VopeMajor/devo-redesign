'use client'

import { useEffect, useState } from 'react'
import { playSfx, preloadMusic } from '@/lib/devo/audio'
import { enterFullscreen } from '@/lib/devo/fullscreen'
import { formatDuration } from '../hooks'
import { MenuButton } from '../menu-button'
import { DiamondStar, Divider, PageFrame, Sparkle } from '../ornaments'
import { CathedralBackdrop, Embers } from '../shared/atmosphere'
import { SoundToggle } from '../shared/sound-toggle'
import { DeadlyVoteSymbol } from '../system/symbol'

const START_MS = 72 * 3600 * 1000

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

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <CathedralBackdrop dim={0.5} />
      <Embers />
      <PageFrame />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 px-6 py-12 lg:flex-row lg:gap-16 lg:px-16">
        <figure className="relative w-[min(68vw,300px)] shrink-0 animate-rise lg:w-[min(36vw,440px)]">
          <DiamondStar className="absolute -top-7 left-1/2 z-10 h-12 w-8 -translate-x-1/2" />
          <div className="relative aspect-square rounded-full border border-foreground/40 p-2">
            <div className="relative grid size-full place-items-center overflow-hidden rounded-full border border-foreground/20 bg-[radial-gradient(circle_at_50%_45%,rgba(22,71,255,0.32),transparent_62%)]">
              <DeadlyVoteSymbol
                variant="full"
                animated
                className="size-[78%] animate-[devo-breathe_9s_ease-in-out_infinite] text-foreground drop-shadow-[0_0_28px_rgba(49,93,255,0.55)]"
              />
              <span className="sr-only">Símbolo do Deadly Vote: estrela de quatro pontas atravessada por uma órbita</span>
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_58%,var(--background)_100%)]" />
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3 animate-[devo-scan_7s_linear_infinite] bg-gradient-to-b from-transparent via-foreground/[0.06] to-transparent" />
            </div>
            {['-left-1.5 top-1/2', '-right-1.5 top-1/2'].map((p) => (
              <Sparkle key={p} className={`absolute size-3 text-foreground/70 ${p}`} />
            ))}
          </div>
          <figcaption className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">A verdade é um voto</figcaption>
        </figure>

        <section className="flex w-full max-w-md flex-col items-center text-center animate-rise [animation-delay:0.2s]">
          <Divider />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.45em] text-foreground/70">
            Devo<span className="text-primary">.System</span>
          </p>

          <h1 className="relative mt-3 flex flex-col items-center">
            <span aria-hidden="true" className="absolute inset-x-[-10%] top-1/2 h-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-3xl" />
            <span className="relative block font-serif text-6xl font-medium uppercase leading-[0.9] tracking-[0.02em] text-foreground sm:text-7xl lg:text-8xl">
              Deadly Vote
            </span>
            <span className="relative mt-3 block font-sans text-sm font-medium uppercase tracking-[0.6em] text-primary sm:text-base">Record System</span>
            <span lang="ja" className="relative mt-1 block text-[11px] tracking-[0.3em] text-muted-foreground">
              デッドリーボート・記録
            </span>
          </h1>

          <p className="mt-2 text-balance text-lg italic text-foreground/80 sm:text-xl">O tempo é a vida. O jogo é a única fonte dela.</p>
          {playerName && (
            <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-primary">
              Bem-vindo de volta, <span className="text-foreground">{playerName}</span>
              {onSignOut && (
                <>
                  {' · '}
                  <button type="button" onClick={onSignOut} className="text-foreground/50 underline-offset-4 hover:text-foreground hover:underline">
                    Sair
                  </button>
                </>
              )}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3 border border-primary/40 bg-background/60 px-4 py-2 font-mono tabular-nums text-primary shadow-[0_0_24px_-8px_var(--primary)]">
            <span className="size-1.5 animate-blink rounded-full bg-primary" aria-hidden="true" />
            <span className="sr-only">Tempo no pulso: </span>
            {formatDuration(START_MS - elapsed)}
          </div>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-4">
            <MenuButton
              variant="primary"
              onMouseEnter={() => awake && playSfx('hover')}
              onClick={() => {
                playSfx('whoosh')
                enterFullscreen()
                onStart()
              }}
            >
              Começar
            </MenuButton>
            <MenuButton
              disabled={!canContinue}
              onMouseEnter={() => awake && canContinue && playSfx('hover')}
              onClick={() => {
                playSfx('click')
                enterFullscreen()
                onContinue()
              }}
            >
              Continuar
            </MenuButton>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <SoundToggle />
            <p className="h-4 text-[11px] uppercase tracking-[0.3em] text-muted-foreground" aria-live="polite">
              {awake ? '' : 'Toque em qualquer lugar para ouvir'}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
