'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Bell, ExternalLink, MonitorDown, Smartphone } from 'lucide-react'
import { playSfx } from '@/lib/devo/audio'
import { promptInstall, requestNotifications, usePwa } from '@/lib/devo/pwa'
import { Badge } from '../kit/badge'
import { Button } from '../kit/button'
import { Frame } from '../kit/frame'
import { Stagger } from '../kit/reveal'
import { portraitFrameProps } from '@/lib/devo/npcs'
import { PortraitFrame } from '../kit/portrait'
import { Sheet } from '../kit/sheet'

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
    <Sheet
      open
      onClose={onClose}
      kicker="Cortesia do Anfitrião"
      title="Uma última cortesia"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="font-sans text-[12px] leading-snug text-dv-text-3">Você pode mudar isso depois em Ajustes.</p>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              playSfx('click')
              onClose()
            }}
          >
            {installed && permission === 'granted' ? 'Continuar' : 'Depois'}
          </Button>
        </div>
      }
    >
      {/* Fala do Anfitrião: retrato em losango + bilhete */}
      <div className="animate-dv-rise flex items-start gap-3">
        <PortraitFrame {...(portraitFrameProps('rato', 'neutral', 'face') ?? {})} alt="O Anfitrião" shape="round" tone="gold" className="w-16" />
        <div className="min-w-0 flex-1">
          <p className="dv-label text-[10px] text-dv-gold">O Anfitrião</p>
          <p className="mt-1 font-body text-[16px] italic leading-relaxed text-dv-text-2">
            Deixe o DEVO na sua tela e permita que eu te chame. Assim, quando algo acontecer aqui dentro, você saberá antes de todos.
          </p>
        </div>
      </div>

      <Stagger className="mt-4 flex flex-col gap-2.5" delay={160}>
        <Frame pad="sm" tone={installed ? 'cobalt' : 'neutral'}>
          <div className="flex items-center gap-3">
            <span className="dv-cut grid size-11 shrink-0 place-items-center bg-dv-cobalt-dim text-dv-cobalt-text" style={{ '--dv-cut': '8px' } as CSSProperties}>
              <InstallIcon className="size-5" strokeWidth={1.4} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14px] font-semibold uppercase tracking-[0.06em] text-dv-text">{isMobile ? 'Ícone na tela inicial' : 'Atalho na área de trabalho'}</p>
              <p className="font-sans text-[13px] text-dv-text-2">Abre o jogo em tela cheia, como um app.</p>
            </div>
            {installed ? (
              <Badge tone="cobalt">Instalado</Badge>
            ) : inIframe ? (
              <a
                href="/"
                target="_blank"
                rel="noopener"
                onClick={() => playSfx('click')}
                className="dv-focus flex min-h-11 items-center gap-1.5 px-2 font-display text-[12px] font-semibold uppercase tracking-[0.2em] text-dv-cobalt-text"
              >
                <ExternalLink className="size-4" strokeWidth={1.4} aria-hidden="true" /> Abrir
              </a>
            ) : (
              <Button size="sm" disabled={busy} onClick={handleInstall} aria-expanded={!installEvent ? showSteps : undefined}>
                {installEvent ? 'Instalar' : 'Como?'}
              </Button>
            )}
          </div>
          {!installed && (showSteps || inIframe) && (
            <div className="animate-dv-rise mt-3 border-t border-dv-line pt-3 font-sans text-[13px] leading-relaxed text-dv-text-2 [&_span]:text-dv-text">
              <InstallSteps isIos={isIos} isAndroid={isAndroid} inIframe={inIframe} />
            </div>
          )}
        </Frame>

        <Frame pad="sm" tone={permission === 'granted' ? 'cobalt' : 'neutral'}>
          <div className="flex items-center gap-3">
            <span className="dv-cut grid size-11 shrink-0 place-items-center bg-dv-cobalt-dim text-dv-cobalt-text" style={{ '--dv-cut': '8px' } as CSSProperties}>
              <Bell className="size-5" strokeWidth={1.4} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14px] font-semibold uppercase tracking-[0.06em] text-dv-text">Notificações</p>
              <p className="font-sans text-[13px] text-dv-text-2">
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
              <Badge tone="cobalt">Ativadas</Badge>
            ) : notifyBlocked ? (
              <Badge tone="neutral">Bloqueadas</Badge>
            ) : (
              canNotify && (
                <Button size="sm" disabled={busy} onClick={() => run(requestNotifications)}>
                  Ativar
                </Button>
              )
            )}
          </div>
        </Frame>
      </Stagger>
    </Sheet>
  )
}
