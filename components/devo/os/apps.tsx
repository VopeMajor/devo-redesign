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
import { CorporacoesApp } from '../corporacoes/corporacoes-app'
import { EmblemCorporacoes, EmblemMascaras, EmblemPoco, EmblemTorres, EmblemVirtudes } from '../kit/emblems'
import { PocoApp } from '../poco/poco-app'
import { SalaoApp } from '../salao/salao-app'
import { TorresApp } from '../torres/torres-app'
import { VirtudesApp } from '../virtudes/virtudes-app'

/** Ícone das Torres no registro: o emblema de prata do kit (o shell trancado usa o mesmo). */
const TorresGlyph: AppIconComponent = (p) => <EmblemTorres metal className={p.className} />
const CorpGlyph: AppIconComponent = (p) => <EmblemCorporacoes metal className={p.className} />

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
  // Sistemas novos (DIRECAO-3): abrem pelos emblemas de sistema da home, não pela grade de apps.
  { id: 'poco', name: 'Poço dos Milagres', subtitle: 'Moedas, manivela e balde', icon: EmblemPoco, Component: PocoApp, window: { w: 460, h: 820 } },
  { id: 'salao', name: 'Salão das Máscaras', subtitle: 'Leilões, mercado e anúncios', icon: EmblemMascaras, Component: SalaoApp, window: { w: 480, h: 840 } },
  // Sistema novo (DIRECAO-3 §2): sempre registrado; trancado, a tela mostra o motivo (o servidor decide).
  { id: 'torres', name: 'Torres de Ruptura', subtitle: 'Andares, essências e chaves', icon: TorresGlyph, Component: TorresApp, window: { w: 480, h: 820 } },
  { id: 'virtudes', name: 'Virtudes', subtitle: 'Naipes, Arcano e Estágio', icon: EmblemVirtudes, Component: VirtudesApp, window: { w: 460, h: 820 } },
  { id: 'corporacoes', name: 'Corporações', subtitle: 'Companhia de Despertados', icon: CorpGlyph, Component: CorporacoesApp, window: { w: 480, h: 840 } },
]

/** Apps que são sistemas novos: abrem pelos emblemas da home (trancados até o servidor liberar). */
export const SYSTEM_APP_IDS: AppId[] = ['poco', 'torres', 'salao', 'virtudes', 'corporacoes']

/** A Sala de Jogos só aparece depois da revelação. */
export function visibleApps(arcadeUnlocked: boolean) {
  const apps = APPS.filter((a) => !SYSTEM_APP_IDS.includes(a.id))
  return arcadeUnlocked ? apps : apps.filter((a) => a.id !== 'jogos')
}

const APP_MAP = new Map(APPS.map((a) => [a.id, a]))

/** Índice romano do app (ordem do registro): marca do ícone e do cabeçalho. */
export function appIndex(id: AppId) {
  return Math.max(1, APPS.findIndex((a) => a.id === id) + 1)
}

export function getApp(id: AppId): AppDef {
  return APP_MAP.get(id) ?? APPS[0]
}
