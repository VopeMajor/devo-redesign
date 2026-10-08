'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Bell, Check, ExternalLink, MonitorDown, Smartphone } from 'lucide-react'
import { playSfx } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, usePwa } from '@/lib/devo/pwa'
import { ActionButton } from '../apps/app-ui'

function InstallSteps({ isIos, isAndroid, inIframe }: { isIos: boolean; isAndroid: boolean; inIframe: boolean }) {
  if (inIframe) {
    return (
      <p>
        Você está vendo o jogo dentro de outra página. Abra o DEVO numa aba própria para conseguir instalar o ícone.
      </p>
    )
  }
  if (isIos) {
    return (
      <ol className="list-decimal space-y-1 pl-4">
        <li>
          Abra no <span className="text-foreground">Safari</span>.
        </li>
        <li>
          Toque em <span className="text-foreground">Compartilhar</span> (quadrado com seta).
        </li>
        <li>
          Escolha <span className="text-foreground">Adicionar à Tela de Início</span>.
        </li>
      </ol>
    )
  }
  if (isAndroid) {
    return (
      <ol className="list-decimal space-y-1 pl-4">
        <li>
          Toque no menu <span className="text-foreground">⋮</span> do navegador.
        </li>
        <li>
          Escolha <span className="text-foreground">Instalar app</span> ou{' '}
          <span className="text-foreground">Adicionar à tela inicial</span>.
        </li>
      </ol>
    )
  }
  return (
    <ol className="list-decimal space-y-1 pl-4">
      <li>
        No Chrome ou Edge, clique no ícone de <span className="text-foreground">instalar</span> no fim da barra de endereço.
      </li>
      <li>
        Ou abra o menu <span className="text-foreground">⋮</span> e escolha{' '}
        <span className="text-foreground">Instalar DEVO</span> / <span className="text-foreground">Salvar e compartilhar → Criar atalho</span>.
      </li>
      <li>O atalho aparece na área de trabalho e no menu Iniciar.</li>
    </ol>
  )
}

export function PwaOffer({ onClose }: { onClose: () => void }) {
  const { installEvent, installed, permission, isIos, isAndroid, inIframe } = usePwa()
  const [busy, setBusy] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  const isMobile = isIos || isAndroid
  const canNotify = permission === 'default'
  const notifyBlocked = permission === 'denied'

  const finish = onClose

  const run = async (action: () => Promise<unknown>) => {
    playSfx('click')
    setBusy(true)
    await action()
    setBusy(false)
  }

  const handleInstall = () => {
    if (installEvent && !inIframe) {
      run(promptInstall)
      return
    }
    playSfx('click')
    setShowSteps((v) => !v)
  }

  const InstallIcon = isMobile ? Smartphone : MonitorDown

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-offer-title"
    >
      <div className="relative flex w-full max-w-xl items-end gap-3 animate-[devo-fade-in_0.5s_ease-out_both]">
        <Image
          src="/images/npc/rat-host-v2.png"
          alt="O Anfitrião"
          width={160}
          height={240}
          className="hidden h-60 w-auto shrink-0 object-contain drop-shadow-[0_0_24px_rgba(0,0,0,0.8)] sm:block"
        />
        <div className="relative max-h-[85dvh] flex-1 overflow-y-auto border border-foreground/20 bg-card/95 p-5 shadow-[0_0_40px_-12px_var(--primary)]">
          <div className="mb-3 flex items-center gap-3">
            <Image
              src="/images/npc/rat-host-v2.png"
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full border border-foreground/20 object-cover object-top sm:hidden"
            />
            <p id="pwa-offer-title" className="text-[11px] uppercase tracking-[0.4em] text-primary">
              O Anfitrião
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Uma última cortesia. Deixe o DEVO na sua tela e permita que eu te chame. Assim, quando algo acontecer aqui dentro, você saberá
            antes de todos.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            <li className="flex flex-col gap-2 border border-foreground/15 bg-background/40 p-3">
              <div className="flex items-center gap-3">
                <InstallIcon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{isMobile ? 'Ícone na tela inicial' : 'Atalho na área de trabalho'}</p>
                  <p className="text-xs text-muted-foreground">Abre o jogo em tela cheia, como um app.</p>
                </div>
                {installed ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="size-3.5" aria-hidden="true" /> Instalado
                  </span>
                ) : inIframe ? (
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener"
                    onClick={() => playSfx('click')}
                    className="flex items-center gap-1.5 border border-primary/70 bg-primary/15 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-primary/25"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" /> Abrir
                  </a>
                ) : (
                  <ActionButton tone="primary" disabled={busy} onClick={handleInstall} aria-expanded={!installEvent ? showSteps : undefined}>
                    {installEvent ? 'Instalar' : 'Como?'}
                  </ActionButton>
                )}
              </div>
              {!installed && (showSteps || inIframe) && (
                <div className="border-t border-foreground/10 pt-2 text-xs leading-relaxed text-muted-foreground">
                  <InstallSteps isIos={isIos} isAndroid={isAndroid} inIframe={inIframe} />
                </div>
              )}
            </li>

            <li className="flex items-center gap-3 border border-foreground/15 bg-background/40 p-3">
              <Bell className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Notificações</p>
                <p className="text-xs text-muted-foreground">
                  {notifyBlocked
                    ? 'Bloqueadas. Libere nas permissões do navegador.'
                    : permission === 'unsupported'
                      ? isIos
                        ? 'No iPhone, instale o ícone primeiro e abra por ele.'
                        : 'Este navegador não suporta notificações.'
                      : 'Avisos de mensagens, trocas e do seu tempo.'}
                </p>
              </div>
              {permission === 'granted' ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3.5" aria-hidden="true" /> Ativadas
                </span>
              ) : (
                canNotify && (
                  <ActionButton tone="primary" disabled={busy} onClick={() => run(requestNotifications)}>
                    Ativar
                  </ActionButton>
                )
              )}
            </li>
          </ul>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">Você pode mudar isso depois em Ajustes.</p>
            <ActionButton
              disabled={busy}
              onClick={() => {
                playSfx('click')
                finish()
              }}
            >
              {installed && permission === 'granted' ? 'Continuar' : 'Depois'}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
