'use client'

import { playSfx } from '@/lib/devo/audio'
import { PwaPanel } from '../shared/pwa-panel'
import { SoundToggle } from '../shared/sound-toggle'
import { useOsNav } from '../os/os-nav'
import { useDevo } from '../state/devo-store'
import { ActionButton, Panel, SectionLabel } from './app-ui'

export function AjustesApp() {
  const { dispatch } = useDevo()
  const { exitToLanding, restart, layout } = useOsNav()
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
          Reiniciar apaga seu inventário e devolve o pulso a 72 horas. O Anfitrião vai fingir que não viu.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton onClick={exitToLanding}>Tela inicial</ActionButton>
          <ActionButton tone="danger" onClick={restart}>
            Reiniciar sessão
          </ActionButton>
        </div>
      </Panel>
    </div>
  )
}
