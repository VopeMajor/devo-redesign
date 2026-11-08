'use client'

import type { ReactNode } from 'react'
import { PaperSheet } from '@/components/devo/kit'

/**
 * Peças comuns às telas do v2 (as mesmas do protótipo kit3): o símbolo do DEVO, os ícones, a seta e o invólucro das
 * partes do jogo atual que ainda não foram redesenhadas (ex.: a Mesa da equipe), com as cores do interior escuro.
 */

/** Ícones ilustrados do protótipo (kit3/os-janelas.html, ICONES_ILU); o resto é pixel no esquema "aco". */
const ICONES = new Set([
  'ajustes', 'arcanos', 'calendario', 'cartas', 'casa', 'conflito', 'corporacoes', 'inventario', 'jogos', 'mensagens', 'mesa',
  'poco', 'pulso', 'ranking', 'record', 'salao', 'sino', 'torres', 'trocas', 'virtudes',
])
export const px = (id: string) => (ICONES.has(id) ? `/v2/art/os/ico/${id}.webp` : `/v2/art/os/px/aco/${id}.png`)

export function Sigilo({ anel = false }: { anel?: boolean }) {
  return (
    <svg className="sigilo" viewBox="0 0 64 64" aria-hidden="true">
      <use href="#sigilo-devo" />
      {anel && <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45" />}
    </svg>
  )
}

export const Seta = ({ volta = false }: { volta?: boolean }) => (
  <svg className="seta" viewBox="0 0 24 24" aria-hidden="true">
    <path d={volta ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
  </svg>
)

/** Botão "voltar" das subpáginas (o mesmo do protótipo: dv-volta). */
export function Volta({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="dv-volta" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {children}
    </button>
  )
}

/**
 * Parte do jogo atual dentro de uma tela nova (ainda sem desenho no v2: Mesa, Diário, Coleção). Fica na mesma folha
 * de papel do Record antigo, onde as cores dela foram pensadas, com a letra do jogo.
 */
export function Legado({ children }: { children: ReactNode }) {
  return (
    <div className="v2-legado v2-dentro">
      <PaperSheet code={false} className="v2-papel">
        <div className="v2-papel-in">{children}</div>
      </PaperSheet>
    </div>
  )
}

export const erroTexto = (e: unknown, padrao = 'Não foi possível concluir a ação.') =>
  e instanceof TypeError ? 'Sem conexão. Tente de novo.' : e instanceof Error ? e.message : padrao
