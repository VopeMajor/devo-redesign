'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { toRoman } from '../kit/glyphs'
import type { CurtainState } from '../kit/transition'
import { DeadlyVoteSymbol } from '../system/symbol'

/**
 * Cortinas da Jornada na paleta do mármore (rodada 2 › correção 12). Mesmo tempo e mesmas animações
 * da `Curtain` do kit (classes dv-curtain-*), mas:
 * - `vote` (Deadly Vote): lâmina de mármore negro; o rubi fica só no anel do mostrador e num corte
 *   diagonal fino — o vermelho não pinta o fundo antes do primeiro alerta de verdade.
 * - `night` (Saindo): mármore negro com filete de aço (sem o marinho do tom `system`).
 * Candidato ao kit: tons `vote`/`marble` da `Curtain`.
 */
export type JourneyCurtainTone = 'vote' | 'night'

export function JourneyCurtain({ state, tone }: { state: CurtainState; tone: JourneyCurtainTone }) {
  const back = state.direction === 'back'
  const vote = tone === 'vote'
  return (
    <div
      key={state.seq}
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-[100] overflow-hidden motion-reduce:bg-dv-ink motion-reduce:dv-curtain-reduced"
      style={{ '--dv-curtain-skew': back ? '14deg' : '-14deg' } as CSSProperties}
    >
      <div className={cn('absolute inset-0', back && '-scale-x-100')} aria-hidden="true">
        {/* faixa de ataque: aço (não cor) */}
        <span className="dv-curtain-band absolute -inset-y-[10%] left-[-50%] w-[200%] bg-[linear-gradient(90deg,#5f584d,#bab09f_60%,#ece5d8)]" style={{ animationDelay: '-40ms' }} />
        {/* lâmina principal: mármore negro com veios cinza (frios, sem o sépia do kit — entrada.css) */}
        <span className="dv-curtain-slab absolute -inset-y-[10%] left-[-50%] w-[200%] bg-dv-ink shadow-[0_0_60px_rgba(0,0,0,0.9)]">
          <span className="en-marble-cold absolute inset-0 opacity-60" />
          <span className="absolute inset-y-0 left-0 w-[2px] bg-[#bab09f] opacity-90" />
          <span className="absolute inset-y-0 right-0 w-[2px] bg-[#bab09f] opacity-90" />
          {/* corte rubi: um só, fino e diagonal, no canto direito — nunca sobre o mostrador nem sobre o rótulo */}
          {vote && <span className="absolute inset-y-0 left-[71.5%] w-[4px] bg-[linear-gradient(180deg,transparent,var(--dv-blood)_18%,#c41a28_50%,var(--dv-blood)_82%,transparent)] shadow-[0_0_18px_rgb(var(--dv-blood-rgb)/0.65)]" />}
          <span className="absolute inset-0 dv-scanlines opacity-40" />
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
        <div aria-hidden="true" className={cn('dv-curtain-ring relative size-[188px]', vote ? 'text-[#c41a28]' : 'text-dv-gold')}>
          <Dial />
          <DeadlyVoteSymbol variant="mark" className="absolute inset-[30%] text-dv-porcelain drop-shadow-[0_0_14px_rgba(241,240,238,0.45)]" />
        </div>
        <div className="dv-curtain-label flex flex-col items-center">
          <p className="font-display text-[24px] font-semibold uppercase tracking-[0.3em] text-dv-text [text-shadow:0_0_24px_rgba(0,0,0,0.9)]">{state.label}</p>
          <span aria-hidden="true" className="relative mt-3 h-px w-40 bg-white/15">
            <span className={cn('dv-curtain-progress absolute inset-0', vote ? 'bg-dv-blood' : 'bg-[#bab09f]')} />
          </span>
          <span aria-hidden="true" className="dv-label mt-2.5 text-[10px] text-dv-text-3">
            DEVO · Record System
          </span>
        </div>
      </div>
    </div>
  )
}

/** Mostrador: anel e marcas na cor do tom (rubi no Deadly Vote), numerais em aço. */
function Dial() {
  return (
    <svg viewBox="0 0 160 160" className="size-full" fill="none" stroke="currentColor">
      <circle cx="80" cy="80" r="76" strokeWidth="1.2" opacity="0.75" />
      <circle cx="80" cy="80" r="58" strokeWidth="0.6" stroke="#bab09f" opacity="0.35" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2
        const long = i % 5 === 0
        const r1 = long ? 64 : 68
        return (
          <line
            key={i}
            x1={80 + Math.sin(a) * r1}
            y1={80 - Math.cos(a) * r1}
            x2={80 + Math.sin(a) * 72}
            y2={80 - Math.cos(a) * 72}
            strokeWidth={long ? 1.6 : 0.7}
            opacity={long ? 1 : 0.55}
          />
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <text
            key={i}
            x={80 + Math.sin(a) * 47}
            y={80 - Math.cos(a) * 47 + 3}
            textAnchor="middle"
            fill="#bab09f"
            stroke="none"
            fontSize="8"
            style={{ fontFamily: 'var(--font-card-title)' }}
            opacity="0.85"
          >
            {toRoman(i === 0 ? 12 : i)}
          </text>
        )
      })}
    </svg>
  )
}
