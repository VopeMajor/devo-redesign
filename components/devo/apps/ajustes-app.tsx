'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { PULSE_START_HOURS } from '@/lib/devo/pulse'
import { PwaPanel } from '../shared/pwa-panel'
import { SoundToggle } from '../shared/sound-toggle'
import { useOsNav } from '../os/os-nav'
import { useDevo } from '../state/devo-store'
import { ActionButton, Panel, SectionLabel } from './app-ui'

export function AjustesApp() {
  const { dispatch } = useDevo()
  const { exitToLanding, layout } = useOsNav()
  return (
    <div className="devo-scroll flex h-full flex-col gap-4 overflow-y-auto p-5">
      <Panel>
        <SectionLabel>Áudio</SectionLabel>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground/85">Trilha e sons de interface</p>
          <SoundToggle />
        </div>
      </Panel>
      <PwaPanel />
      <Panel>
        <SectionLabel>Sistema</SectionLabel>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Versão</dt>
          <dd className="text-right text-foreground">DEVO 0.1 · experimental</dd>
          <dt className="text-muted-foreground">Interface</dt>
          <dd className="text-right text-foreground">{layout === 'desktop' ? 'Área de trabalho' : 'Smartphone'}</dd>
          <dt className="text-muted-foreground">Operador</dt>
          <dd className="text-right text-foreground">O Anfitrião</dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            onClick={() => {
              playSfx('click')
              dispatch({ type: 'CLEAR_NOTIFICATIONS' })
            }}
          >
            Limpar notificações
          </ActionButton>
        </div>
      </Panel>
      <Panel>
        <SectionLabel>Sessão</SectionLabel>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reiniciar apaga suas cartas (você recebe de novo o kit inicial), zera as trocas e devolve o pulso a {PULSE_START_HOURS} horas. Sua conta continua a mesma. O
          Anfitrião vai fingir que não viu.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton onClick={exitToLanding}>Tela inicial</ActionButton>
        </div>
        <RestartSession />
      </Panel>
    </div>
  )
}

type RestartStep = 'idle' | 'confirm' | 'saving' | 'done' | 'error'

/** Reiniciar sessão em dois passos: pedir → confirmar. Grava no servidor e mostra o resultado. */
function RestartSession() {
  const { state, restartSession } = useDevo()
  const [step, setStep] = useState<RestartStep>('idle')

  const run = async () => {
    setStep('saving')
    playSfx('whoosh')
    const ok = await restartSession()
    setStep(ok ? 'done' : 'error')
  }

  if (step === 'idle' || step === 'done' || step === 'error') {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <ActionButton
          tone="danger"
          className="self-start"
          onClick={() => {
            playSfx('click')
            setStep('confirm')
          }}
        >
          Reiniciar sessão
        </ActionButton>
        {step === 'done' && (
          <p role="status" className="text-xs uppercase tracking-[0.2em] text-foreground/70">
            Sessão reiniciada e salva. Pulso em {PULSE_START_HOURS}h.
          </p>
        )}
        {step === 'error' && (
          <p role="alert" className="text-xs uppercase tracking-[0.2em] text-primary">
            Reiniciado aqui, mas não foi possível salvar agora. O sistema tenta de novo em instantes.
          </p>
        )}
      </div>
    )
  }

  return (
    <div role="alertdialog" aria-label="Confirmar reinício da sessão" className="mt-3 flex flex-col gap-3 border border-primary/50 p-3">
      <p className="text-sm leading-relaxed text-foreground/90">
        Tem certeza? Você perde {state.inventory.length} {state.inventory.length === 1 ? 'carta' : 'cartas'} e {state.tradesCompleted}{' '}
        {state.tradesCompleted === 1 ? 'troca' : 'trocas'}; o pulso volta a {PULSE_START_HOURS}:00:00. Isso não pode ser desfeito.
      </p>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setStep('idle')} disabled={step === 'saving'}>
          Cancelar
        </ActionButton>
        <ActionButton tone="danger" onClick={run} disabled={step === 'saving'}>
          {step === 'saving' ? 'Salvando…' : 'Sim, reiniciar'}
        </ActionButton>
      </div>
    </div>
  )
}
