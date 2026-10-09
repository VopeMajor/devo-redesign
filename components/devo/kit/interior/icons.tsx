import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ícones de traço fino do interior (barra inferior, abas, sistemas futuros). viewBox 24, traço 1.3,
 * `currentColor`, decorativos. Desenhados para o DEVO — não misture com ícones de outro estilo na mesma barra.
 */
type P = SVGProps<SVGSVGElement> & { className?: string }
const base = (c?: string) => cn('inline-block shrink-0', c)
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function IconRecord({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.5c.6-4 3.4-6.3 7.2-6.3s6.6 2.3 7.2 6.3" />
    </svg>
  )
}
export function IconArcano({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M12 2.5c.5 6.3 2.7 8.5 9 9-6.3.5-8.5 2.7-9 9-.5-6.3-2.7-8.5-9-9 6.3-.5 8.5-2.7 9-9Z" />
      <ellipse cx="12" cy="11.5" rx="9.5" ry="3.3" transform="rotate(-24 12 11.5)" />
      <circle cx="12" cy="11.5" r="1.2" />
    </svg>
  )
}
export function IconCartas({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <rect x="3.5" y="5.5" width="10" height="14" rx="1" transform="rotate(-8 8.5 12.5)" />
      <rect x="10" y="4" width="10" height="14" rx="1" />
      <path d="M15 8.5v5M12.5 11h5" />
    </svg>
  )
}
export function IconVotes({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M3.5 11.5h17v9h-17z" />
      <path d="M8 11.5V4.5h8v7" />
      <path d="M9.5 15.5h5M10.5 7.5l1.2 1.2 2.3-2.4" />
    </svg>
  )
}
export function IconAvisos({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  )
}
export function IconPulso({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 12.5h3l1.5-3.5 2.5 7 2-5 1.2 1.5H19" />
    </svg>
  )
}
export function IconMensagens({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M4 5.5h16v10H10l-4 3.5v-3.5H4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  )
}
export function IconTrocas({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <rect x="3" y="6" width="7" height="11" rx="0.8" />
      <rect x="14" y="7" width="7" height="11" rx="0.8" />
      <path d="M10.5 9h3l-1.2-1.2M13.5 14h-3l1.2 1.2" />
    </svg>
  )
}
export function IconJogos({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M12 3 20.5 12 12 21 3.5 12Z" />
      <circle cx="12" cy="8.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function IconAjustes({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  )
}
/** Torres de Ruptura: escada em espiral subindo a um nó de estrela. */
export function IconTorre({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M8 21.5c0-2 8-2 8-4s-8-2-8-4 8-2 8-4-6-1.6-6-3" />
      <path d="M12 1.8l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z" />
    </svg>
  )
}
/** Poço dos Desejos: boca do poço com moeda caindo. */
export function IconPoco({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <ellipse cx="12" cy="13" rx="8" ry="2.6" />
      <path d="M4 13v4.5c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7V13" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M12 8.5v2" />
    </svg>
  )
}
/** Virtudes: radar de atributos. */
export function IconVirtudes({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M12 3l8 5.5-3 9.5H7L4 8.5Z" />
      <path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5Z" />
    </svg>
  )
}
/** Corporações: estandarte. */
export function IconCorporacoes({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M6 21V3" />
      <path d="M6 4h12v9l-3-1.8L12 13l-3-1.8L6 13" />
    </svg>
  )
}
/** Salão das Máscaras: máscara de baile. */
export function IconMascaras({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <path d="M2.5 9.5c3-1.5 6-1.5 9.5 0 3.5-1.5 6.5-1.5 9.5 0-.4 4.5-3 6.5-5.5 6.5-1.7 0-2.8-1.3-4-2.5-1.2 1.2-2.3 2.5-4 2.5-2.5 0-5.1-2-5.5-6.5Z" />
      <path d="M6.5 11.5c.8-.6 2-.6 2.8 0M14.7 11.5c.8-.6 2-.6 2.8 0" />
    </svg>
  )
}
export function IconLock({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="1" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </svg>
  )
}
