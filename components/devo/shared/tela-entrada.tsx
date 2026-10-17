'use client'

import { useEffect, useState } from 'react'
import { GlyphHourglass } from '../kit/glyphs'

/**
 * Tela de carregamento na entrada (e ao voltar para o site): cobre tudo até as fontes e as imagens da primeira tela
 * chegarem, para nada aparecer fora do lugar. Mínimo curto (não pisca) e teto (nunca prende o jogador).
 * Enquanto ela está na frente, o primeiro toque não acorda o áudio por baixo (o som entra só com a tela pronta).
 */
const MINIMO_MS = 900
const TETO_MS = 6000

export function TelaEntrada() {
  const [fase, setFase] = useState<'carregando' | 'saindo' | 'fim'>('carregando')

  useEffect(() => {
    let vivo = true
    const inicio = performance.now()
    const pronto = Promise.all([
      document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true })),
      document.fonts?.ready.then(() => undefined).catch(() => undefined) ?? Promise.resolve(),
    ])
    const teto = new Promise<void>((r) => window.setTimeout(r, TETO_MS))
    void Promise.race([pronto, teto]).then(() => {
      const falta = Math.max(0, MINIMO_MS - (performance.now() - inicio))
      window.setTimeout(() => {
        if (!vivo) return
        setFase('saindo')
        window.setTimeout(() => vivo && setFase('fim'), 650)
      }, falta)
    })
    return () => {
      vivo = false
    }
  }, [])

  if (fase === 'fim') return null
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando o DEVO"
      onPointerDownCapture={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-dv-ink transition-opacity duration-[650ms] ${fase === 'saindo' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_42%,rgb(var(--dv-amethyst-rgb)/0.14),transparent_70%)]" />
      <div className="relative grid size-24 place-items-center">
        <span aria-hidden="true" className="te-anel absolute inset-0 rounded-full border border-dv-gold/40 border-t-dv-gold-bright" />
        <span aria-hidden="true" className="absolute inset-3 rotate-45 border border-dv-line-strong" />
        <GlyphHourglass className="te-ampulheta relative size-9 text-dv-gold-bright" />
      </div>
      <div className="relative text-center">
        <p className="font-display text-[22px] font-semibold uppercase tracking-[0.32em] text-dv-text">Devo</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-dv-text-3">Sincronizando o seu tempo…</p>
      </div>
      <style>{`
        .te-anel{animation:te-gira 1.6s linear infinite}
        .te-ampulheta{animation:te-vira 2.4s cubic-bezier(.65,0,.35,1) infinite}
        @keyframes te-gira{to{transform:rotate(360deg)}}
        @keyframes te-vira{0%,40%{transform:rotate(0)}50%,90%{transform:rotate(180deg)}100%{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.te-anel,.te-ampulheta{animation:none}}
      `}</style>
    </div>
  )
}
