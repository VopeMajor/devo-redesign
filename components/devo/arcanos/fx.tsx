'use client'

import { useEffect, useState } from 'react'
import { isMuted, playSfx } from '@/lib/devo/audio'

/**
 * Efeitos dos Arcanos: som + vibração discretos (respeitam o mudo do jogo e o "reduzir movimento" do sistema),
 * movimento reduzido como hook e as animações próprias da tela (keyframes locais, para não mexer nos tokens
 * globais que outro agente está trocando). Tudo que anima aqui some com `prefers-reduced-motion`.
 */

export function reduzMovimento() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function useReduzMovimento() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!m) return
    setR(m.matches)
    const on = () => setR(m.matches)
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])
  return r
}

type Gesto = 'troca' | 'toque' | 'abrir' | 'voltar'
const SOM = { troca: 'tick', toque: 'click', abrir: 'shimmer', voltar: 'close' } as const
const VIBRA: Record<Gesto, number> = { troca: 6, toque: 8, abrir: 14, voltar: 6 }

/** Som e um toque curtíssimo no celular. Mudo desliga os dois; movimento reduzido desliga a vibração. */
export function sentir(g: Gesto) {
  playSfx(SOM[g])
  if (isMuted() || reduzMovimento()) return
  try {
    navigator.vibrate?.(VIBRA[g])
  } catch {}
}

/**
 * Tom ametista para a arte pintada (que puxa muito para o vinho): uma matriz de cor que leva o vermelho para o
 * roxo e o dourado para o champanhe-prata, sem repintar. Três forças: figura/retrato (0,65: a pele continua pele),
 * moldura (0,6) e fundos (1,0). Antes/depois em docs/redesign/refs/arcanos/tom-antes-depois.jpg.
 * Linha da matriz (k = 1): R' = .62R + .10G + .28B · G' = .06R + .84G + .10B · B' = .40R + .06G + .62B.
 */
const TOM = {
  figura: '0.753 0.065 0.182 0 0  0.039 0.896 0.065 0 0  0.260 0.039 0.753 0 0  0 0 0 1 0',
  moldura: '0.772 0.060 0.168 0 0  0.036 0.904 0.060 0 0  0.240 0.036 0.772 0 0  0 0 0 1 0',
  fundo: '0.620 0.100 0.280 0 0  0.060 0.840 0.100 0 0  0.400 0.060 0.620 0 0  0 0 0 1 0',
}

/** Keyframes locais (prefixo arc-) e os filtros de tom. */
export function EstilosArcanos() {
  return (
    <>
      <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute size-0 overflow-hidden">
        {Object.entries(TOM).map(([k, v]) => (
          <filter key={k} id={`arc-tom-${k}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={v} />
          </filter>
        ))}
      </svg>
      <style>{`
.arc-tom-figura { filter: url(#arc-tom-figura) }
.arc-tom-moldura { filter: url(#arc-tom-moldura) }
.arc-tom-fundo { filter: url(#arc-tom-fundo) saturate(.85) }
@keyframes arc-cintila { 0%,100% { opacity: var(--o, .6) } 50% { opacity: calc(var(--o, .6) * .25) } }
@keyframes arc-pulso { 0%,100% { transform: scale(1); opacity: .75 } 50% { transform: scale(1.18); opacity: 1 } }
@keyframes arc-chama { 0%,100% { transform: scaleY(1) scaleX(1) rotate(0deg) } 25% { transform: scaleY(1.12) scaleX(.92) rotate(-2deg) } 50% { transform: scaleY(.94) scaleX(1.04) rotate(1.5deg) } 75% { transform: scaleY(1.06) scaleX(.96) rotate(-1deg) } }
@keyframes arc-halo { 0%,100% { opacity: .55 } 40% { opacity: .8 } 60% { opacity: .5 } }
@keyframes arc-fumaca { 0% { transform: translate(0,0) scale(.6); opacity: 0 } 15% { opacity: .35 } 100% { transform: translate(var(--dx, 10px), -150px) scale(2.4); opacity: 0 } }
@keyframes arc-poeira { 0% { transform: translate(0, 0); opacity: 0 } 20% { opacity: var(--o, .7) } 80% { opacity: var(--o, .7) } 100% { transform: translate(var(--dx, 6px), -120px); opacity: 0 } }
@keyframes arc-raios { 0%,100% { opacity: .55 } 50% { opacity: .8 } }
@keyframes arc-entra { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
.arc-cintila { animation: arc-cintila var(--d, 4s) ease-in-out infinite; animation-delay: var(--atraso, 0s) }
.arc-pulso { animation: arc-pulso 2.8s ease-in-out infinite }
.arc-chama { transform-box: fill-box; transform-origin: 50% 100%; animation: arc-chama var(--d, 1.4s) ease-in-out infinite; animation-delay: var(--atraso, 0s) }
.arc-halo { animation: arc-halo var(--d, 2.2s) ease-in-out infinite; animation-delay: var(--atraso, 0s) }
.arc-fumaca { animation: arc-fumaca var(--d, 7s) ease-out infinite; animation-delay: var(--atraso, 0s) }
.arc-poeira { animation: arc-poeira var(--d, 9s) linear infinite; animation-delay: var(--atraso, 0s) }
.arc-raios { animation: arc-raios 7s ease-in-out infinite }
.arc-entra { animation: arc-entra .55s cubic-bezier(.16,1,.3,1) both; animation-delay: var(--atraso, 0s) }
::view-transition-old(arc-figura), ::view-transition-new(arc-figura) { animation-duration: .5s; animation-timing-function: cubic-bezier(.16,1,.3,1) }
@media (prefers-reduced-motion: reduce) {
  .arc-cintila, .arc-pulso, .arc-chama, .arc-halo, .arc-fumaca, .arc-poeira, .arc-raios, .arc-entra { animation: none !important }
  .arc-fumaca, .arc-poeira { display: none }
}
`}</style>
    </>
  )
}

/** Gerador pseudoaleatório fixo (as mesmas estrelas e partículas a cada abertura). */
export function prng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
