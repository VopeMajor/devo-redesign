'use client'

import { useEffect, type ComponentType } from 'react'
import type { UnlockFlag } from '@/lib/devo/progresso'
import type { AppId } from '@/lib/devo/types'
import { EmblemArcanos, EmblemCorporacoes, EmblemMascaras, EmblemPoco, EmblemTorres, EmblemVirtudes, type EmblemComponent, type EmblemProps } from '../kit/emblems'
import { GlyphKeyhole } from '../kit/glyphs'
import { Panel, SectionLabel } from '../apps/app-ui'
import { useDevo } from '../state/devo-store'
import { useAcesso } from './use-acesso'

/**
 * SISTEMAS NOVOS (DIRECAO-3 §1–2) no menu do DEVO: trancados até vencer o Deadly Vote tutorial (Owner e
 * Anfitrião veem tudo), destrancados pelo servidor (`/api/eu` → `acesso.sistemas`).
 *
 * ▸ AGENTES DE SISTEMA: registrem a tela do seu sistema em `TELAS_SISTEMA` (uma linha + o import). Ela abre como
 *   um app (camada no celular, janela no desktop), com o mesmo id de `AppId`. Sem tela registrada, aparece o
 *   aviso "em preparação". A tela é responsável por chamar a apresentação narrativa na primeira entrada
 *   (`useCenas().abrir(..., { seNaoVista: true })` — docs/redesign/DIALOGO.md).
 */
export type SistemaId = 'mascaras' | 'poco' | 'torres' | 'corporacoes' | 'virtudes' | 'arcanos'

export const TELAS_SISTEMA: Partial<Record<SistemaId, ComponentType>> = {
  // mascaras: SalaoApp,      ← agente Salão das Máscaras
  // poco: PocoApp,           ← agente Poço
  // torres: TorresApp,       ← agente Torres
  // corporacoes: CorporacoesApp, ← agente Corporações
  // virtudes: VirtudesApp,   ← agente Virtudes
}

export type SistemaDef = {
  id: SistemaId
  nome: string
  curto: string
  subtitulo: string
  /** Flag da Fundação que libera; `null` = ainda sem sistema (sempre "em breve"). */
  flag: UnlockFlag | null
  /** Motivo mostrado no ícone trancado. */
  trava: string
  emblem: EmblemComponent
}

const TUTORIAL = 'Vença o Deadly Vote tutorial'

export const SISTEMAS: SistemaDef[] = [
  { id: 'mascaras', nome: 'Salão das Máscaras', curto: 'Máscaras', subtitulo: 'Leilões e mercado', flag: 'salao_mascaras', trava: TUTORIAL, emblem: EmblemMascaras },
  { id: 'poco', nome: 'Poço dos Milagres', curto: 'Poço', subtitulo: 'Moeda, manivela e balde', flag: 'poco', trava: TUTORIAL, emblem: EmblemPoco },
  { id: 'torres', nome: 'Torres de Ruptura', curto: 'Torres', subtitulo: 'Andares e essências', flag: 'torres', trava: TUTORIAL, emblem: EmblemTorres },
  { id: 'corporacoes', nome: 'Corporações', curto: 'Corpo­rações', subtitulo: 'Companhia de Despertados', flag: 'corporacoes', trava: 'Aguarde a Companhia', emblem: EmblemCorporacoes },
  { id: 'virtudes', nome: 'Virtudes', curto: 'Virtudes', subtitulo: 'Pontos de potencial', flag: 'virtudes', trava: 'Em breve', emblem: EmblemVirtudes },
  { id: 'arcanos', nome: 'Arcanos', curto: 'Arcanos', subtitulo: 'Rank e poder', flag: null, trava: 'Em breve', emblem: EmblemArcanos },
]

export const SISTEMA_IDS = SISTEMAS.map((s) => s.id) as SistemaId[]
export const isSistema = (id: string): id is SistemaId => (SISTEMA_IDS as string[]).includes(id)
export const getSistema = (id: SistemaId) => SISTEMAS.find((s) => s.id === id)!

/** Ícone de app de um sistema: o emblema de sistema com o metal dos apps. */
export function emblemaApp(E: EmblemComponent): ComponentType<EmblemProps> {
  const C = (p: EmblemProps) => <E metal {...p} />
  C.displayName = `EmblemaApp(${E.displayName ?? E.name})`
  return C
}

/** Tela de um sistema aberta como app: registra a exploração e mostra a tela registrada (ou a trava/aviso). */
export function TelaSistema({ id }: { id: SistemaId }) {
  const { dispatch } = useDevo()
  const { eu, liberado } = useAcesso()
  const def = getSistema(id)
  const aberto = !!def.flag && liberado(def.flag)
  useEffect(() => {
    if (aberto) dispatch({ type: 'SEE_SYSTEM', id })
  }, [aberto, id, dispatch])
  const Tela = TELAS_SISTEMA[id]
  if (!eu) return <p className="dv-label px-4 pt-6 text-[11px] text-dv-text-3" role="status">Conferindo acesso…</p>
  if (!aberto) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="relative grid size-24 place-items-center">
          <def.emblem className="size-20 text-dv-text-3 opacity-60" />
          <GlyphKeyhole aria-hidden="true" className="absolute bottom-1 right-1 size-6 rounded-full bg-dv-ink p-1 text-dv-gold" />
        </span>
        <p className="font-display text-[18px] font-semibold uppercase tracking-[0.12em] text-dv-text">{def.nome}</p>
        <p className="font-body text-[16px] italic text-dv-text-2">Trancado. {def.trava}.</p>
      </div>
    )
  }
  if (Tela) return <Tela />
  return (
    <div className="devo-scroll h-full overflow-y-auto px-4 pb-8 pt-4">
      <Panel>
        <SectionLabel>{def.nome}</SectionLabel>
        <p className="mt-3 font-body text-[16px] leading-relaxed text-dv-text-2">As portas já se abriram para você. O sistema ainda está sendo preparado pela Companhia.</p>
      </Panel>
    </div>
  )
}

/** Apps de sistema para o registro central (components/devo/os/apps.tsx). */
export const SISTEMA_APPS = SISTEMAS.filter((s) => s.flag).map((s) => ({
  id: s.id as AppId,
  name: s.nome,
  subtitle: s.subtitulo,
  icon: emblemaApp(s.emblem),
  Component: function SistemaApp() {
    return <TelaSistema id={s.id} />
  },
  window: { w: 860, h: 620 },
}))
