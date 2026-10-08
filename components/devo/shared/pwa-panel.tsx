'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, sendTestPush, usePwa } from '@/lib/devo/pwa'
import { ActionButton, Panel, SectionLabel } from '../apps/app-ui'

const PERMISSION_LABEL: Record<string, string> = {
  granted: 'Ativadas',
  denied: 'Bloqueadas no navegador',
  default: 'Desativadas',
  unsupported: 'Indisponíveis neste navegador',
}

export function PwaPanel() {
  const { installEvent, installed, permission, isIos } = usePwa()
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  return (
    <Panel>
      <SectionLabel>Aplicativo</SectionLabel>
      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Ícone na tela</dt>
        <dd className="text-right text-foreground">{installed ? 'Instalado' : 'Não instalado'}</dd>
        <dt className="text-muted-foreground">Notificações</dt>
        <dd className="text-right text-foreground">{PERMISSION_LABEL[permission]}</dd>
      </dl>

      {!installed && isIos && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No iPhone: toque em <span className="text-foreground">Compartilhar</span> e depois em{' '}
          <span className="text-foreground">Adicionar à Tela de Início</span>. As notificações só funcionam com o app instalado.
        </p>
      )}
      {!installed && !isIos && !installEvent && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Se o botão não aparecer, use o menu do navegador e escolha <span className="text-foreground">Instalar app</span> ou{' '}
          <span className="text-foreground">Adicionar à tela inicial</span>.
        </p>
      )}
      {permission === 'denied' && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Libere as notificações nas configurações do site no navegador.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!installed && installEvent && (
          <ActionButton
            onClick={() => {
              playSfx('click')
              promptInstall()
            }}
          >
            Adicionar ícone
          </ActionButton>
        )}
        {permission === 'default' && (
          <ActionButton
            onClick={() => {
              playSfx('click')
              requestNotifications()
            }}
          >
            Ativar notificações
          </ActionButton>
        )}
        {permission === 'granted' && (
          <ActionButton
            disabled={testState === 'sending'}
            onClick={async () => {
              playSfx('click')
              setTestState('sending')
              setTestState((await sendTestPush()) ? 'sent' : 'failed')
            }}
          >
            {testState === 'sending' ? 'Enviando...' : 'Testar notificação'}
          </ActionButton>
        )}
      </div>
      {testState === 'sent' && (
        <p className="mt-3 text-sm text-muted-foreground">Enviada pelo servidor. Pode fechar o jogo que ela chega do mesmo jeito.</p>
      )}
      {testState === 'failed' && (
        <p className="mt-3 text-sm text-muted-foreground">
          Não foi possível registrar este aparelho. No iPhone, abra o jogo pelo ícone da tela de início.
        </p>
      )}
    </Panel>
  )
}
