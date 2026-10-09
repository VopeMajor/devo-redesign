'use client'

import { useCallback, useEffect, useState } from 'react'
import { playMusic, startAmbient, stopMusic, unlockAudio } from '@/lib/devo/audio'
import { IntroScreen } from './intro/intro-screen'
import { PrologueScreen } from './intro/prologue-screen'
import { LandingScreen } from './landing/landing-screen'
import { AccessScreen, type AccessMode } from './naming/access-screen'
import { authClient } from '@/lib/auth-client'

const AUTO_START_KEY = 'devo_auto_start'
import { DevoOS } from './os/devo-os'
import { callName, DevoProvider, useDevo } from './state/devo-store'
import type { SaveData } from '@/lib/devo/save'
import { BackExitHint, useBackHandler } from './use-back-handler'
import { ArcadeUnlock } from './arcade/arcade-unlock'
import { PwaOffer } from './shared/pwa-offer'
import { Curtain, useCurtain, type CurtainOptions } from './kit/transition'
import './landing/entrada.css'

/**
 * Cada cortina tem tom e direção coerentes com o que acontece (IDENTIDADE.md §8):
 * - Despertando: ouro, avança (nascimento do Record, a sessão começa).
 * - Reconectando: sistema, avança (volta ao aparelho).
 * - Saindo: sistema, volta (lâminas no sentido contrário).
 * - Deadly Vote: alerta, avança, som de revelação (o jogo mortal se apresenta).
 * - Inicializando DEVO: sistema, avança (o aparelho liga).
 */
const CURTAIN_STYLE: Record<string, CurtainOptions> = {
  Despertando: { tone: 'gold', direction: 'forward' },
  Reconectando: { tone: 'system', direction: 'forward' },
  Saindo: { tone: 'system', direction: 'back' },
  'Deadly Vote': { tone: 'alert', direction: 'forward', sfx: 'reveal' },
  'Inicializando DEVO': { tone: 'system', direction: 'forward' },
}

export function DevoExperience({
  initialPlayerName,
  initialCharacterName = null,
  initialSave,
}: {
  initialPlayerName: string | null
  initialCharacterName?: string | null
  initialSave: SaveData | null
}) {
  return (
    <DevoProvider initialPlayerName={initialPlayerName} initialCharacterName={initialCharacterName} initialSave={initialSave}>
      <DevoRoot />
      <BackExitHint />
    </DevoProvider>
  )
}

function DevoRoot() {
  const { state, dispatch } = useDevo()
  // Cortina única (kit/transition): ação em 850ms, some em 1800ms, ignora cliques duplos.
  const { curtain, run } = useCurtain()
  const [naming, setNaming] = useState<AccessMode | null>(null)
  const [offerPwa, setOfferPwa] = useState(false)
  const [prologue, setPrologue] = useState(true)

  useEffect(() => {
    const wake = () => {
      unlockAudio()
      startAmbient(0.28)
    }
    window.addEventListener('pointerdown', wake, { once: true })
    window.addEventListener('keydown', wake, { once: true })
    return () => {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [])

  const transition = useCallback(
    (label: string, action: () => void) => {
      run(label, action, CURTAIN_STYLE[label] ?? {})
    },
    [run],
  )

  const beginSession = useCallback(() => {
    playMusic()
    transition('Despertando', () => {
      setPrologue(true)
      dispatch({ type: 'START_SESSION' })
    })
  }, [dispatch, transition])

  // "Começar" never resumes or resets an existing record: it always asks for a fresh invite code.
  const start = useCallback(() => setNaming('invite'), [])

  useEffect(() => {
    if (!state.playerName || window.sessionStorage.getItem(AUTO_START_KEY) !== '1') return
    window.sessionStorage.removeItem(AUTO_START_KEY)
    beginSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await authClient.signOut()
    window.location.reload()
  }, [])

  const exitToLanding = useCallback(() => {
    stopMusic()
    transition('Saindo', () => dispatch({ type: 'SET_PHASE', phase: 'landing' }))
  }, [dispatch, transition])

  useBackHandler(state.phase === 'os', exitToLanding)
  useBackHandler(state.phase === 'intro', () => {})
  useBackHandler(naming !== null, () => setNaming(null))
  useBackHandler(offerPwa, () => setOfferPwa(false))

  return (
    <>
      {state.phase === 'landing' && (
        <LandingScreen
          playerName={callName(state)}
          canContinue
          veiled={naming !== null}
          onStart={start}
          onSignOut={state.playerName ? signOut : undefined}
          onContinue={() => {
            if (!state.playerName) {
              setNaming('login')
              return
            }
            if (!state.hasSession) {
              beginSession()
              return
            }
            playMusic()
            transition('Reconectando', () => dispatch({ type: 'SET_PHASE', phase: 'os' }))
          }}
        />
      )}
      {state.phase === 'intro' && prologue && (
        <PrologueScreen playerName={callName(state)} onFinish={() => transition('Deadly Vote', () => setPrologue(false))} />
      )}
      {state.phase === 'intro' && !prologue && (
        <IntroScreen
          playerName={callName(state)}
          onFinish={() =>
            transition('Inicializando DEVO', () => {
              dispatch({ type: 'SET_PHASE', phase: 'os' })
              window.setTimeout(() => setOfferPwa(true), 1600)
            })
          }
        />
      )}
      {state.phase === 'os' && <DevoOS onExit={exitToLanding} onRestart={start} />}
      {state.phase === 'os' && offerPwa && <PwaOffer onClose={() => setOfferPwa(false)} />}
      {state.phase === 'os' && <ArcadeUnlock />}

      {naming && (
        <AccessScreen
          mode={naming}
          onCancel={() => setNaming(null)}
          onAuthenticated={(kind, name, character) => {
            if (kind === 'registered') {
              // Cadastro novo: sem recarregar e sem passar pela landing. A cortina "Despertando" cobre o
              // documento e termina direto no prólogo (a sessão já está no cookie; o save nasce agora).
              playMusic()
              transition('Despertando', () => {
                setNaming(null)
                dispatch({ type: 'SET_PLAYER', name })
                if (character) dispatch({ type: 'SET_CHARACTER', name: character })
                setPrologue(true)
                dispatch({ type: 'START_SESSION' })
              })
              return
            }
            // Login: recarrega para o servidor hidratar o progresso salvo.
            window.location.reload()
          }}
        />
      )}

      <Curtain state={curtain} />
    </>
  )
}
