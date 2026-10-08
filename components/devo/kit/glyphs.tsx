import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Glifos originais do "Tribunal do Relógio". Todos usam `currentColor`, viewBox 24×24
 * (exceto quando indicado) e são decorativos por padrão (aria-hidden).
 * Traço: 1.4 em 24px. Nada de ícones de terceiros com estilo diferente ao lado destes.
 */
type GlyphProps = SVGProps<SVGSVGElement> & { className?: string }

function base(className?: string) {
  return cn('inline-block shrink-0', className)
}

/** Estrela de quatro pontas (a "faísca" do DEVO). */
export function GlyphSpark({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="currentColor" {...p}>
      <path d="M12 0.5 L13.7 10.3 L23.5 12 L13.7 13.7 L12 23.5 L10.3 13.7 L0.5 12 L10.3 10.3 Z" />
    </svg>
  )
}

/** Losango vazado com ponto: marcador de kicker, bullets, centro de divisores. */
export function GlyphDiamond({ className, filled = false, ...p }: GlyphProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M12 2 L21 12 L12 22 L3 12 Z" fill={filled ? 'currentColor' : 'none'} />
      {!filled && <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />}
    </svg>
  )
}

/** Mostrador de relógio com ponteiros: tempo, agenda, contagem. */
export function GlyphClock({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8" />
      <path d="M12 12 L12 6.8 M12 12 L15.6 14.2" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Ampulheta: tempo de vida, apostas em tempo. */
export function GlyphHourglass({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" {...p}>
      <path d="M6 3h12M6 21h12" strokeLinecap="round" />
      <path d="M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9" />
      <path d="M9.5 18.5 L12 16 L14.5 18.5 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Fechadura: bloqueado, sala trancada, segredo. */
export function GlyphKeyhole({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M12 2.5 a7 7 0 0 1 7 7 v5 a7 7 0 0 1 -14 0 v-5 a7 7 0 0 1 7 -7 Z" />
      <path d="M12 7.6 a2.2 2.2 0 0 1 1.2 4.05 L14 16.5 h-4 l0.8 -4.85 A2.2 2.2 0 0 1 12 7.6 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Carta de baralho com losango: inventário, cartas, recompensas. */
export function GlyphCard({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <rect x="5" y="2.5" width="14" height="19" rx="1.6" />
      <path d="M12 7.5 L15 12 L12 16.5 L9 12 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 5.2h1.5M15 18.8h1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Balança/martelo do tribunal: votação, julgamento. */
export function GlyphGavel({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v15M7 21h10" />
      <path d="M4 7h16" />
      <path d="M6 7 L3.5 13 h5 Z M18 7 L15.5 13 h5 Z" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Clipe de papel do diário: anexos, notas. */
export function GlyphClip({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M9 6v10a3 3 0 0 0 6 0V5a2 2 0 0 0-4 0v10a1 1 0 0 0 2 0V7" />
    </svg>
  )
}

/** Visto dentro de losango: concluído, resgatado. */
export function GlyphCheck({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5 L10 17 L19 7" />
    </svg>
  )
}

/** Alerta: triângulo com olho — perigo (use só com --dv-blood). */
export function GlyphAlert({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...p}>
      <path d="M12 2.8 L22 20.5 H2 Z" />
      <path d="M7.6 15.2 C9 13 15 13 16.4 15.2 C15 17.4 9 17.4 7.6 15.2 Z" />
      <circle cx="12" cy="15.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** X fino (fechar). */
export function GlyphClose({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
      <path d="M12 2.5 L13 4 L12 5.5 L11 4 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Seta com corte diagonal (avançar). */
export function GlyphArrow({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12h15M13 6.5 L19 12 L13 17.5" />
      <path d="M3 9 L6 12 L3 15" strokeWidth="1.2" />
    </svg>
  )
}

/**
 * Canto de filigrana (viewBox 32×32): ocupa o canto superior-esquerdo; gire 90/180/270° para os demais.
 * Linha dupla em L, losango no vértice, voluta curta.
 */
export function CornerFiligree({ className, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={base(className)} fill="none" stroke="currentColor" {...p}>
      <path d="M2 30 V8 L8 2 H30" strokeWidth="1.2" />
      <path d="M6 30 V10 L10 6 H30" strokeWidth="0.7" opacity="0.6" />
      <path d="M8 2 L11 5 L8 8 L5 5 Z" fill="currentColor" stroke="none" />
      <path d="M14 6 C14 10 12 12 9 12 C11 13 12 15 12 17" strokeWidth="0.8" opacity="0.8" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Converte 1..3999 em numerais romanos (mostradores, índices de seção). */
export function toRoman(n: number) {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let rest = Math.max(1, Math.floor(n))
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s
      rest -= v
    }
  }
  return out
}
