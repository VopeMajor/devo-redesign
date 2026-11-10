'use client'

import { NAIPE_PATH } from '@/components/devo/virtudes/naipes'
import type { VirtudeKey } from '@/lib/devo/virtudes'

/**
 * Peças comuns às Virtudes e aos Arcanos do v2 (protótipo kit3/os-virtudes.js): o naipe chapado em metal claro
 * (`.v-naipe`, preenchido com o gradiente #v-metal) e os losangos da afinidade. O gradiente mora no protótipo no
 * <svg> de símbolos da página; aqui cada tela traz o seu (`MetalNaipes`), já que a casca do v2 não o tem.
 */

export function MetalNaipes() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="v-metal" x1=".1" y1="0" x2=".75" y2="1">
          <stop offset="0" stopColor="#f6f2ea" />
          <stop offset=".45" stopColor="#d9d0bf" />
          <stop offset="1" stopColor="#8f8676" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function NaipeV2({ k, cl = '' }: { k: VirtudeKey; cl?: string }) {
  return (
    <svg className={['v-naipe', cl].filter(Boolean).join(' ')} viewBox="0 0 48 48" aria-hidden="true">
      <path d={NAIPE_PATH[k]} />
    </svg>
  )
}

/** Cinco losangos; `n` acesos (grau da afinidade: excelente 5 … deficiente 1). */
export function Losangos({ n }: { n: number }) {
  return (
    <span className="v-los" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className={i < n ? 'on' : undefined} />
      ))}
    </span>
  )
}

/** "Arcano da Força" → "A Força" (como no protótipo). */
export const nomeArcano = (titulo: string) =>
  titulo.replace(/^Arcano (da|do|das|dos) /, (_m, a: string) => ({ da: 'A ', do: 'O ', das: 'As ', dos: 'Os ' })[a as 'da'] ?? '')
