'use client'

import { useState, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { Button } from '../kit/button'
import { Frame, FrameCorners } from '../kit/frame'
import { GlyphAlert, GlyphCheck } from '../kit/glyphs'
import { Kicker } from '../kit/typography'
import { Stagger } from '../kit/reveal'
import { PwaPanel } from '../shared/pwa-panel'
import { SoundToggle } from '../shared/sound-toggle'
import { useOsNav } from '../os/os-nav'
import { callName, useDevo } from '../state/devo-store'
import { DeadlyVoteSymbol } from '../system/symbol'
import { LineAction, Panel, SectionLabel } from './app-ui'
import { MarbleSlab } from '../os/shell-ui'

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
        <Panel>
          <SectionLabel>Áudio</SectionLabel>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-body text-[15px] text-dv-text-2">Trilha e sons de interface</p>
            <SoundToggle />
          </div>
        </Panel>


        <PwaPanel />

        {/* Sistema: ficha técnica, sem moldura (peso menor que os blocos de ação acima) */}
        <section aria-label="Sistema" className="px-1 pt-1">
          <div className="flex items-center gap-3">
            <SectionLabel className="text-dv-text-3">Sistema</SectionLabel>
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
          </div>
          <dl className="mt-1 divide-y divide-dv-line">
            <Row label="Versão">DEVO 0.1 · experimental</Row>
            <Row label="Interface">{layout === 'desktop' ? 'Área de trabalho' : 'Smartphone'}</Row>
            <Row label="Operador">O Anfitrião</Row>
            <div className="flex min-h-12 items-center justify-between gap-3 py-2">
              <dt className="font-body text-[15px] text-dv-text-2">Central de avisos</dt>
              <dd>
                <LineAction
                  onClick={() => {
                    playSfx('click')
                    dispatch({ type: 'CLEAR_NOTIFICATIONS' })
                  }}
                >
                  Limpar avisos
                </LineAction>
              </dd>
            </div>
          </dl>
        </section>

        {/* Herói: a sessão (o que está em jogo). Pedra negra com aço; o rubi fica só na confirmação. */}
        <MarbleSlab edge="steel" cut={16} glow quiet innerClassName="p-6">
          <FrameCorners tone="gold" />
          <div className="flex items-center gap-4">
            <DeadlyVoteSymbol className="size-14 shrink-0 text-dv-gold" />
            <div className="min-w-0">
              <Kicker tone="gold">Sessão</Kicker>
              <p className="mt-1.5 truncate font-display text-[24px] font-semibold uppercase leading-none tracking-[0.06em] text-dv-text">{callName(state) || 'Jogador'}</p>
              {state.characterName && state.playerName && state.characterName !== state.playerName && (
                <p className="dv-label mt-1.5 truncate text-[10px] text-dv-text-3">Conta · {state.playerName}</p>
              )}
              <p className="dv-label mt-2 text-[10px] text-dv-text-3">
                {state.inventory.length} cartas · {state.tradesCompleted} trocas
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exitToLanding}>
              Tela inicial
            </Button>
          </div>
        </MarbleSlab>
      </Stagger>
    </div>
  )
}
