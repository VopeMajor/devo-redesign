'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, sendTestPush, usePwa } from '@/lib/devo/pwa'
import { Badge, type BadgeTone } from '../kit/badge'
import { ActionButton, Panel, SectionLabel } from '../apps/app-ui'

const PERMISSION: Record<string, { label: string; tone: BadgeTone }> = {
  granted: { label: 'Ativadas', tone: 'cobalt' },
  denied: { label: 'Bloqueadas no navegador', tone: 'neutral' },
  default: { label: 'Desativadas', tone: 'neutral' },
  unsupported: { label: 'Indisponíveis neste navegador', tone: 'neutral' },
}

/** Instalação (PWA) e notificações push. Usado em Ajustes. */
export function PwaPanel() {
  const { installEvent, installed, permission, isIos } = usePwa()
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const perm = PERMISSION[permission] ?? PERMISSION.unsupported

  return (
    <Panel>
      <SectionLabel>Aplicativo</SectionLabel>
      <dl className="mt-2 divide-y divide-dv-line">
        <div className="flex min-h-12 items-center justify-between gap-3 py-2">
          <dt className="font-body text-[15px] text-dv-text-2">Ícone na tela</dt>
          <dd>
            <Badge tone={installed ? 'cobalt' : 'neutral'} dot={installed}>
              {installed ? 'Instalado' : 'Não instalado'}
            </Badge>
          </dd>
        </div>
        <div className="flex min-h-12 items-center justify-between gap-3 py-2">
          <dt className="font-body text-[15px] text-dv-text-2">Notificações</dt>
          <dd className="text-right">
            <Badge tone={perm.tone} dot={permission === 'granted'}>
              {perm.label}
            </Badge>
          </dd>
        </div>
      </dl>

      {!installed && isIos && (
        <p className="mt-2 font-body text-[15px] leading-relaxed text-dv-text-2">
          No iPhone: toque em <span className="text-dv-text">Compartilhar</span> e depois em <span className="text-dv-text">Adicionar à Tela de Início</span>. As
          notificações só funcionam com o app instalado.
        </p>
      )}
      {!installed && !isIos && !installEvent && (
        <p className="mt-2 font-body text-[15px] leading-relaxed text-dv-text-2">
          Se o botão não aparecer, use o menu do navegador e escolha <span className="text-dv-text">Instalar app</span> ou{' '}
          <span className="text-dv-text">Adicionar à tela inicial</span>.
        </p>
      )}
      {permission === 'denied' && <p className="mt-2 font-body text-[15px] leading-relaxed text-dv-text-2">Libere as notificações nas configurações do site no navegador.</p>}

      {((!installed && installEvent) || permission === 'default' || permission === 'granted') && (
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
      )}
      {testState === 'sent' && <p className="mt-3 font-body text-[15px] text-dv-text-2">Enviada pelo servidor. Pode fechar o jogo que ela chega do mesmo jeito.</p>}
      {testState === 'failed' && (
        <p className="mt-3 font-body text-[15px] text-dv-text-2">Não foi possível registrar este aparelho. No iPhone, abra o jogo pelo ícone da tela de início.</p>
      )}
    </Panel>
  )
}
