'use client'

import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { CardsGlyph, GamesGlyph, MessagesGlyph, PulseGlyph, RecordGlyph, SettingsGlyph, TradeGlyph } from './app-glyphs'

type AppIconComponent = ComponentType<Pick<LucideProps, 'className' | 'strokeWidth' | 'aria-hidden'>>
import type { AppId } from '@/lib/devo/types'
import { AjustesApp } from '../apps/ajustes-app'
import { CartasApp } from '../apps/cartas-app'
import { JogosApp } from '../apps/jogos-app'
import { MensagensApp } from '../apps/mensagens-app'
import { PulsoApp } from '../apps/pulso-app'
import { RecordApp } from '../apps/record-app'
import { TrocasApp } from '../apps/trocas-app'

export type AppDef = {
  id: AppId
  name: string
  subtitle: string
  icon: AppIconComponent
  Component: ComponentType
  /** Tamanho padrão da janela no desktop. */
  window: { w: number; h: number }
}

/**
 * Registro central de aplicativos do DEVO.
 * Para adicionar um novo app: crie o componente em `components/devo/apps`,
 * adicione o id em `AppId` (lib/devo/types.ts) e registre aqui.
 * Desktop e smartphone leem esta mesma lista.
 */
export const APPS: AppDef[] = [
  { id: 'record', name: 'Record', subtitle: 'Deadly Vote Record System', icon: RecordGlyph, Component: RecordApp, window: { w: 900, h: 640 } },
  { id: 'pulso', name: 'Pulso', subtitle: 'Seu tempo de vida', icon: PulseGlyph, Component: PulsoApp, window: { w: 520, h: 560 } },
  { id: 'mensagens', name: 'Mensagens', subtitle: 'Conversas e ameaças', icon: MessagesGlyph, Component: MensagensApp, window: { w: 760, h: 540 } },
  { id: 'cartas', name: 'Cartas', subtitle: 'Seu inventário', icon: CardsGlyph, Component: CartasApp, window: { w: 780, h: 580 } },
  { id: 'trocas', name: 'Sala de Trocas', subtitle: 'Trocas às cegas', icon: TradeGlyph, Component: TrocasApp, window: { w: 980, h: 640 } },
  { id: 'ajustes', name: 'Ajustes', subtitle: 'Sistema', icon: SettingsGlyph, Component: AjustesApp, window: { w: 480, h: 520 } },
  { id: 'jogos', name: 'Sala de Jogos', subtitle: 'Minigames e apostas', icon: GamesGlyph, Component: JogosApp, window: { w: 1040, h: 680 } },
]

/** A Sala de Jogos só aparece depois da revelação. */
export function visibleApps(arcadeUnlocked: boolean) {
  return arcadeUnlocked ? APPS : APPS.filter((a) => a.id !== 'jogos')
}

const APP_MAP = new Map(APPS.map((a) => [a.id, a]))

/** Índice romano do app (ordem do registro): marca do ícone e do cabeçalho. */
export function appIndex(id: AppId) {
  return Math.max(1, APPS.findIndex((a) => a.id === id) + 1)
}

export function getApp(id: AppId): AppDef {
  return APP_MAP.get(id) ?? APPS[0]
}
