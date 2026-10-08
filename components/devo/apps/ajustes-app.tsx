'use client'

import { useState, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { PULSE_START_HOURS } from '@/lib/devo/pulse'
import { Button } from '../kit/button'
import { Frame } from '../kit/frame'
import { GlyphAlert, GlyphCheck } from '../kit/glyphs'
import { Kicker } from '../kit/typography'
import { Stagger } from '../kit/reveal'
import { PwaPanel } from '../shared/pwa-panel'
import { SoundToggle } from '../shared/sound-toggle'
import { useOsNav } from '../os/os-nav'
import { useDevo } from '../state/devo-store'
import { DeadlyVoteSymbol } from '../system/symbol'
import { Panel, SectionLabel } from './app-ui'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2">
      <dt className="font-body text-[15px] text-dv-text-2">{label}</dt>
      <dd className="text-right font-body text-[15px] text-dv-text">{children}</dd>
    </div>
  )
}

export function AjustesApp() {
  const { state, dispatch } = useDevo()
  const { exitToLanding, layout } = useOsNav()
  return (
    <div className="devo-scroll h-full overflow-y-auto">
      <Stagger className="flex flex-col gap-4 px-4 pb-8 pt-4" step={70}>
        {/* Herói: placa de identificação do sistema */}
        <Frame tone="gold" ornate glow pad="lg" cutSize={16}>
          <div className="flex items-center gap-4">
            <DeadlyVoteSymbol className="size-16 shrink-0 text-dv-gold" />
            <div className="min-w-0">
              <Kicker tone="gold">Sistema dentro do sistema</Kicker>
              <p className="mt-1.5 font-display text-[26px] font-semibold uppercase leading-none tracking-[0.06em] text-dv-text">Devo 0.1</p>
              <p className="dv-label mt-2 text-[10px] text-dv-text-3">Experimental · Record System</p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-dv-line border-t border-dv-line">
            <Row label="Versão">DEVO 0.1 · experimental</Row>
            <Row label="Interface">{layout === 'desktop' ? 'Área de trabalho' : 'Smartphone'}</Row>
            <Row label="Operador">O Anfitrião</Row>
            {state.playerName && <Row label="Jogador">{state.playerName}</Row>}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                playSfx('click')
                dispatch({ type: 'CLEAR_NOTIFICATIONS' })
              }}
            >
              Limpar notificações
            </Button>
          </div>
        </Frame>

        <Panel>
          <SectionLabel>Áudio</SectionLabel>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-body text-[15px] text-dv-text-2">Trilha e sons de interface</p>
            <SoundToggle />
          </div>
        </Panel>

        <PwaPanel />

        <Frame tone="blood" pad="md" cutSize={12}>
          <Kicker tone="blood">Sessão</Kicker>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-dv-text-2">
            Reiniciar apaga suas cartas (você recebe de novo o kit inicial), zera as trocas e devolve o pulso a {PULSE_START_HOURS} horas. Sua conta continua a
            mesma. O Anfitrião vai fingir que não viu.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exitToLanding}>
              Tela inicial
            </Button>
          </div>
          <RestartSession />
        </Frame>
      </Stagger>
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
      <div className="mt-3 flex flex-col gap-3">
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          onClick={() => {
            playSfx('click')
            setStep('confirm')
          }}
        >
          Reiniciar sessão
        </Button>
        {step === 'done' && (
          <p role="status" className="animate-dv-cut-in flex items-center gap-2 font-body text-[15px] text-dv-text">
            <GlyphCheck className="size-5 text-dv-cobalt-text" />
            Sessão reiniciada e salva. Pulso em {PULSE_START_HOURS}h.
          </p>
        )}
        {step === 'error' && (
          <p role="alert" className="flex items-start gap-2 font-body text-[15px] text-dv-blood-text">
            <GlyphAlert className="mt-0.5 size-5 shrink-0" />
            Reiniciado aqui, mas não foi possível salvar agora. O sistema tenta de novo em instantes.
          </p>
        )}
      </div>
    )
  }

  return (
    <Frame variant="alert" pad="md" cutSize={12} className="animate-dv-cut-in mt-4" role="alertdialog" aria-label="Confirmar reinício da sessão">
      <div className="flex items-start gap-3">
        <GlyphAlert className="mt-0.5 size-6 shrink-0 text-dv-blood-text" />
        <p className="font-body text-[15px] leading-relaxed text-dv-text">
          Tem certeza? Você perde {state.inventory.length} {state.inventory.length === 1 ? 'carta' : 'cartas'} e {state.tradesCompleted}{' '}
          {state.tradesCompleted === 1 ? 'troca' : 'trocas'}; o pulso volta a {PULSE_START_HOURS}:00:00. Isso não pode ser desfeito.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 pb-2">
        <Button variant="secondary" size="sm" onClick={() => setStep('idle')} disabled={step === 'saving'}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" onClick={run} loading={step === 'saving'}>
          Sim, reiniciar
        </Button>
      </div>
    </Frame>
  )
}
