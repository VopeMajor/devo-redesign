'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CenasProvider, useCenas } from '../dialogo/cenas-host'
import { useMediaQuery } from '../hooks'
import { GlyphArrow } from '../kit/glyphs'
import { useDevo } from '../state/devo-store'
import { CerimoniaDesbloqueio } from './cerimonia'
import { SISTEMAS, type SistemaDef } from './sistemas'
import { AcessoProvider, useAcesso } from './use-acesso'

/**
 * FLUXO DE PROGRESSÃO (DIRECAO-3 §1), ordem do dono:
 * 1. Deadly Vote tutorial vencido → o servidor libera as flags (Fundação) → cerimônia de desbloqueio aqui.
 * 2. O jogador explora os sistemas novos (cada abertura vai para `sistemasVistos`).
 * 3. Depois de abrir N deles (`narrativa.galo_casa.explorar_min`, provisório) → cartão "Ir para casa" → cena
 *    do Galo (Karma). O contato do Galo passa a existir em Mensagens.
 * 4. Depois da visita do Galo (ou se Corporações for liberado por outro caminho) → chamada holográfica da
 *    Melissa (Corporações); ao concluir, libera `corporacoes`.
 * Owner e Anfitrião (`acesso.total`): tudo liberado, sem cerimônia nem chamadas automáticas.
 */
const MARCA_AVISO_GALO = 'aviso-galo'
const MELISSA_ESPERA_MS = 6000

type Narrativa = { galoDisponivel: boolean; abrirGalo: () => void }
const NarrativaContext = createContext<Narrativa>({ galoDisponivel: false, abrirGalo: () => {} })

export function NarrativaHost({ children }: { children: ReactNode }) {
  return (
    <AcessoProvider>
      <CenasProvider>
        <Gatilhos>{children}</Gatilhos>
      </CenasProvider>
    </AcessoProvider>
  )
}

function Gatilhos({ children }: { children: ReactNode }) {
  const { state, dispatch, notify } = useDevo()
  const { eu } = useAcesso()
  const cenas = useCenas()
  const total = !!eu?.acesso.total

  /* 1. Cerimônia para flags novas (uma vez por flag; a marca vai no save). Espera a cortina de entrada sair. */
  const [cerimonia, setCerimonia] = useState<SistemaDef[] | null>(null)
  const [pronto, setPronto] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setPronto(true), 1800)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!eu || !pronto || cerimonia || cenas.aberta) return
    const liberados = SISTEMAS.filter((s) => s.flag && !s.inicial && eu.acesso.sistemas[s.flag])
    const novos = liberados.filter((s) => !state.desbloqueiosVistos.includes(s.id))
    if (!novos.length) return
    if (total) {
      dispatch({ type: 'CELEBRATE_UNLOCKS', flags: novos.map((s) => s.id) })
      return
    }
    setCerimonia(novos)
  }, [eu, pronto, state.desbloqueiosVistos, cenas.aberta, cerimonia, total, dispatch])

  /* 3. Visita do Galo disponível? */
  const exploradosNovos = SISTEMAS.filter((s) => s.flag && s.flag !== 'corporacoes' && !s.inicial && s.id !== 'arcanos' && state.sistemasVistos.includes(s.id)).length
  const galoDisponivel =
    !!eu?.acesso.sistemas.galo_casa && cenas.carregado && !cenas.vista('galo-casa') && (total || exploradosNovos >= Math.max(0, cenas.config.galoExplorarMin))
  useEffect(() => {
    if (!galoDisponivel || total || state.desbloqueiosVistos.includes(MARCA_AVISO_GALO)) return
    dispatch({ type: 'CELEBRATE_UNLOCKS', flags: [MARCA_AVISO_GALO] })
    notify({ appId: 'pulso', title: 'Um endereço entre seus pertences', body: 'Talvez seja hora de ir para casa.' })
  }, [galoDisponivel, total, state.desbloqueiosVistos, dispatch, notify])

  /* 4. Chamada da Melissa (Companhia de Despertados). */
  const corporacoesLiberado = !!eu?.acesso.sistemas.corporacoes
  const melissaPendente = !!eu && !total && cenas.carregado && !cenas.vista('melissa-corporacoes') && (cenas.vista('galo-casa') || corporacoesLiberado)
  const agendada = useRef(false)
  useEffect(() => {
    if (!melissaPendente || cenas.aberta || cerimonia || agendada.current) return
    agendada.current = true
    const t = window.setTimeout(() => {
      agendada.current = false
      cenas.abrir('melissa-corporacoes', { seNaoVista: true })
    }, MELISSA_ESPERA_MS)
    return () => {
      window.clearTimeout(t)
      agendada.current = false
    }
  }, [melissaPendente, cenas, cerimonia])

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const ctx = useMemo<Narrativa>(() => ({ galoDisponivel, abrirGalo: () => cenas.abrir('galo-casa') }), [galoDisponivel, cenas])

  return (
    <NarrativaContext.Provider value={ctx}>
      {children}
      {isDesktop && galoDisponivel && !cenas.aberta && (
        <div className="fixed bottom-20 right-6 z-[60] w-[340px]">
          <CartaoNarrativa />
        </div>
      )}
      {cerimonia && (
        <CerimoniaDesbloqueio
          sistemas={cerimonia}
          onFim={() => {
            dispatch({ type: 'CELEBRATE_UNLOCKS', flags: cerimonia.map((s) => s.id) })
            setCerimonia(null)
          }}
        />
      )}
    </NarrativaContext.Provider>
  )
}

/**
 * Cartão "Agora" da home: a visita do Galo está pronta ("Ir para casa"). Só aparece quando disponível.
 * Usado na home do celular (phone-shell) e flutuando na área de trabalho.
 */
export function CartaoNarrativa() {
  const { galoDisponivel, abrirGalo } = useContext(NarrativaContext)
  if (!galoDisponivel) return null
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('open')
        abrirGalo()
      }}
      aria-label="Ir para casa"
      className="dv-focus animate-dv-rise group relative isolate flex min-h-16 w-full items-center gap-3 py-3 pl-4 pr-3 text-left transition-transform duration-[120ms] active:scale-[0.985]"
      style={{ '--dv-cut': '10px' } as CSSProperties}
    >
      <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(100deg,#ece5d8,#6b6357_40%,#bab09f_70%,#8a7cc8)]" />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(100deg,#1f1f22,#151517_55%,#0c0c0e)]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
      <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center">
        <CasaGlyph className="size-9 text-dv-gold-bright" />
        <span className="absolute -right-0.5 -top-0.5 size-2 rotate-45 bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.9)]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="dv-label block text-[10px] text-dv-gold">Casa · noite</span>
        <span className="mt-1 block font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">Ir para casa</span>
        <span className="block truncate font-body text-[14px] italic text-dv-text-2">Um endereço entre seus pertences.</span>
      </span>
      <GlyphArrow className="size-4 shrink-0 text-dv-text-2 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function CasaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M6 19 20 7l14 12" strokeLinejoin="round" />
      <path d="M10 16v17h20V16" />
      <path d="M17 33V23h6v10" />
      <circle cx="21.6" cy="28" r="0.8" fill="currentColor" />
      <path d="M27 6v5" strokeLinecap="round" />
      <path d="M31 9.5c-1.6 0-2.8-1.2-2.8-2.8S29.4 4 31 4c-.6.7-.9 1.5-.9 2.3s.3 1.8.9 3.2Z" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  )
}

