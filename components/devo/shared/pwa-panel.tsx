'use client'

import { useState, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, sendTestPush, usePwa } from '@/lib/devo/pwa'
import { ActionButton, LineAction, Panel, SectionLabel } from '../apps/app-ui'
import { StateSeal } from '../os/shell-ui'

const PERMISSION: Record<string, { label: string; on: boolean }> = {
  granted: { label: 'Ativadas', on: true },
  denied: { label: 'Bloqueadas', on: false },
  default: { label: 'Desativadas', on: false },
  unsupported: { label: 'Indisponíveis', on: false },
}

/**
 * Instalação (PWA) e notificações push. Usado em Ajustes. Cada linha = estado (selo prata ≥ 11px)
 * + UMA ação clara ("Instalar", "Ativar", "Como liberar"); a explicação só abre quando pedida.
 */
export function PwaPanel() {
  const { installEvent, installed, permission, isIos } = usePwa()
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [help, setHelp] = useState<'install' | 'notify' | null>(null)
  const perm = PERMISSION[permission] ?? PERMISSION.unsupported
  const toggle = (k: 'install' | 'notify') => {
    playSfx('click')
    setHelp((h) => (h === k ? null : k))
  }

  return (
    <Panel>
      <SectionLabel>Aplicativo</SectionLabel>
      <dl className="mt-2 divide-y divide-dv-line">
        <SettingRow
          label="Ícone na tela"
          state={
            <StateSeal tone={installed ? 'steel' : 'quiet'} dot={installed}>
              {installed ? 'Instalado' : 'Não instalado'}
            </StateSeal>
          }
          action={
            installed ? null : installEvent ? (
              <LineAction
                onClick={() => {
                  playSfx('click')
                  promptInstall()
                }}
              >
                Instalar
              </LineAction>
            ) : (
              <LineAction aria-expanded={help === 'install'} aria-controls="devo-help-install" onClick={() => toggle('install')}>
                Como instalar
              </LineAction>
            )
          }
        >
          {help === 'install' && (
            <Help id="devo-help-install">
              {isIos ? (
                <>
                  No iPhone: toque em <b className="font-normal text-dv-text">Compartilhar</b> e depois em <b className="font-normal text-dv-text">Adicionar à Tela de Início</b>. As
                  notificações só funcionam com o app instalado.
                </>
              ) : (
                <>
                  No menu do navegador, escolha <b className="font-normal text-dv-text">Instalar app</b> ou <b className="font-normal text-dv-text">Adicionar à tela inicial</b>.
                </>
              )}
            </Help>
          )}
        </SettingRow>

        <SettingRow
          label="Notificações"
          state={
            <StateSeal tone={perm.on ? 'steel' : 'quiet'} dot={perm.on}>
              {perm.label}
            </StateSeal>
          }
          action={
            permission === 'default' ? (
              <LineAction
                onClick={() => {
                  playSfx('click')
                  requestNotifications()
                }}
              >
                Ativar
              </LineAction>
            ) : permission === 'denied' ? (
              <LineAction aria-expanded={help === 'notify'} aria-controls="devo-help-notify" onClick={() => toggle('notify')}>
                Como liberar
              </LineAction>
            ) : null
          }
        >
          {help === 'notify' && (
            <Help id="devo-help-notify">
              Toque no cadeado ao lado do endereço, abra <b className="font-normal text-dv-text">Permissões</b> e mude <b className="font-normal text-dv-text">Notificações</b> para
              permitir. Depois volte aqui.
            </Help>
          )}
        </SettingRow>
      </dl>

      {permission === 'granted' && (
        <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      )}
      {testState === 'sent' && <p className="mt-3 font-body text-[15px] text-dv-text-2">Enviada pelo servidor. Pode fechar o jogo que ela chega do mesmo jeito.</p>}
      {testState === 'failed' && (
        <p className="mt-3 font-body text-[15px] text-dv-text-2">Não foi possível registrar este aparelho. No iPhone, abra o jogo pelo ícone da tela de início.</p>
      )}
    </Panel>
  )
}

/** Linha de ajuste: rótulo à esquerda; selo de estado e a ação logo abaixo/ao lado. */
function SettingRow({ label, state, action, children }: { label: string; state: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <dt className="font-body text-[16px] text-dv-text">{label}</dt>
        <dd>{state}</dd>
      </div>
      {action && <dd className="-mb-1 mt-1 flex justify-end">{action}</dd>}
      {children}
    </div>
  )
}

function Help({ id, children }: { id: string; children: ReactNode }) {
  return (
    <dd id={id} className="animate-dv-fade mt-1 border-l border-dv-gold/40 pl-3 font-body text-[15px] leading-relaxed text-dv-text-2">
      {children}
    </dd>
  )
}
