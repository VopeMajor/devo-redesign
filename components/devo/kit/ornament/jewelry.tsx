'use client'

import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { useMetal, type MetalTone } from './brass'

export type GemTone = 'glass' | 'onyx' | 'blood' | 'night' | 'cobalt'

/** Luz → meio → sombra de cada pedra. */
const GEM: Record<GemTone, [string, string, string]> = {
  glass: ['#ffffff', '#e0dfdc', '#8e88b4'],
  onyx: ['#4c4c52', '#16141d', '#030205'],
  blood: ['#ff8a92', '#c0142a', '#3d040a'],
  night: ['#b3a9f0', '#5d5970', '#120f2e'],
  cobalt: ['#d6cff5', '#5a4f8f', '#1a1530'],
}

/**
 * Vidro/pedra facetada em losango com engaste de latão. Mesa central + quatro facetas com luz
 * vinda do alto-esquerda. `blood` é a "gota" — o ÚNICO uso decorativo permitido do vermelho.
 */
export function FacetGem({ tone = 'glass', metal = 'brass', className, title, ...p }: { tone?: GemTone; metal?: MetalTone; title?: string } & SVGProps<SVGSVGElement>) {
  const { paint, defs } = useMetal(metal)
  const [hi, mid, lo] = GEM[tone]
  return (
    <svg viewBox="0 0 32 48" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} className={cn('drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]', className)} {...p}>
      {title && <title>{title}</title>}
      {defs}
      {/* engaste */}
      <path d="M16 0.8 L31.2 24 L16 47.2 L0.8 24 Z" fill={paint} />
      <path d="M16 3.8 L28.4 24 L16 44.2 L3.6 24 Z" fill="#0a090e" />
      {/* facetas */}
      <path d="M16 5 L27.2 24 L16 24 Z" fill={mid} />
      <path d="M16 5 L4.8 24 L16 24 Z" fill={hi} />
      <path d="M4.8 24 L16 43 L16 24 Z" fill={mid} />
      <path d="M27.2 24 L16 43 L16 24 Z" fill={lo} />
      {/* mesa */}
      <path d="M16 15 L21.5 24 L16 33 L10.5 24 Z" fill={mid} />
      <path d="M16 15 L21.5 24 L16 24 Z" fill={hi} opacity="0.35" />
      <path d="M16 24 L10.5 24 L16 33 Z" fill={lo} opacity="0.4" />
      <path d="M16 5 L16 15 M4.8 24 L10.5 24 M27.2 24 L21.5 24 M16 43 L16 33" stroke="#fff" strokeWidth="0.35" opacity="0.45" />
      {/* brilho */}
      <path d="M10 15 L12 13 L13 17 Z" fill="#fff" opacity="0.85" />
    </svg>
  )
}

/** Gota de sangue em joia (pingente). Use 1 por tela, como acento — nunca como alerta. */
export function BloodDrop({ className, ...p }: SVGProps<SVGSVGElement>) {
  const id = `dv-drop-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg viewBox="0 0 20 30" aria-hidden="true" className={className} {...p}>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.55" r="0.75">
          <stop offset="0" stopColor="#ff7d86" />
          <stop offset="0.45" stopColor="#a3121f" />
          <stop offset="1" stopColor="#3d040a" />
        </radialGradient>
      </defs>
      <path d="M10 1 C12 8 18 13.5 18 19.5 C18 24.5 14.4 28.5 10 28.5 C5.6 28.5 2 24.5 2 19.5 C2 13.5 8 8 10 1 Z" fill={`url(#${id})`} />
      <path d="M6.2 18 C6.2 15.6 7.4 13.6 8.6 12.4" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  )
}

/**
 * Renda de borda (babado): faixa de malha + recortes em leque com ilhoses e picôs. Original,
 * desenhada em <pattern> (repete sem emenda em qualquer largura). Coloque na borda de um bloco
 * `relative` — `side` escolhe para onde os leques apontam.
 */
export function LaceEdge({ side = 'bottom', tone = 'porcelain', height = 18, className }: { side?: 'top' | 'bottom'; tone?: 'porcelain' | 'ink'; height?: number; className?: string }) {
  const id = `dv-lace-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const c = tone === 'porcelain' ? '#f6f4ef' : '#0d0d0f'
  const shade = tone === 'porcelain' ? 'rgba(18,16,22,0.28)' : 'rgba(238,237,235,0.22)'
  return (
    <svg aria-hidden="true" className={cn('pointer-events-none block w-full', side === 'top' && '-scale-y-100', className)} style={{ height }}>
      <defs>
        <pattern id={id} width="24" height="18" patternUnits="userSpaceOnUse" patternTransform={`scale(${height / 18})`}>
          {/* malha (tule) */}
          <path d="M0 0 L6 6 L12 0 L18 6 L24 0 M0 6 L6 0 M12 6 L18 0" stroke={c} strokeWidth="0.5" fill="none" opacity="0.7" />
          <line x1="0" y1="6.5" x2="24" y2="6.5" stroke={c} strokeWidth="1.1" />
          {/* leque */}
          <path d="M0 6.5 C0 14 5 17 12 17 C19 17 24 14 24 6.5 Z" fill={c} stroke={shade} strokeWidth="0.4" />
          {/* ilhoses */}
          <circle cx="12" cy="11" r="2.1" fill={shade} />
          <circle cx="6" cy="10.4" r="0.9" fill={shade} />
          <circle cx="18" cy="10.4" r="0.9" fill={shade} />
          {/* picôs */}
          <circle cx="12" cy="17.2" r="0.8" fill={c} />
          <circle cx="4" cy="15" r="0.7" fill={c} />
          <circle cx="20" cy="15" r="0.7" fill={c} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/**
 * Laço de fita preta com borda de renda branca (gótico delicado). Decorativo: prende uma
 * plaqueta, o canto de um retrato ou um selo de conquista — 1 por tela.
 */
export function Bow({ tone = 'ink', className, ...p }: { tone?: 'ink' | 'porcelain' } & SVGProps<SVGSVGElement>) {
  const fill = tone === 'ink' ? '#0d0d0f' : '#f1f0ee'
  const edge = tone === 'ink' ? '#f1f0ee' : '#0d0d0f'
  const fold = tone === 'ink' ? '#28282c' : '#d9d6cf'
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" className={cn('drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]', className)} {...p}>
      {/* caudas */}
      <path d="M29 22 L19 45 L23.5 42 L26 47 L33 25 Z" fill={fill} stroke={edge} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M35 22 L45 45 L40.5 42 L38 47 L31 25 Z" fill={fill} stroke={edge} strokeWidth="0.8" strokeLinejoin="round" />
      {/* alças */}
      <path d="M30 20 C22 6 4 4 3.5 15 C3 25 18 27 30 23 Z" fill={fill} stroke={edge} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M34 20 C42 6 60 4 60.5 15 C61 25 46 27 34 23 Z" fill={fill} stroke={edge} strokeWidth="0.9" strokeLinejoin="round" />
      {/* dobras */}
      <path d="M27 20 C21 13 12 11 8.5 14.5 M37 20 C43 13 52 11 55.5 14.5" stroke={fold} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* renda interna */}
      <path d="M28.5 21.5 C20 9.5 7 8 6.5 15 C6 21 18 23.5 28.5 22.6" stroke={edge} strokeWidth="0.5" strokeDasharray="1.2 1.4" fill="none" opacity="0.8" />
      <path d="M35.5 21.5 C44 9.5 57 8 57.5 15 C58 21 46 23.5 35.5 22.6" stroke={edge} strokeWidth="0.5" strokeDasharray="1.2 1.4" fill="none" opacity="0.8" />
      {/* nó */}
      <rect x="27.5" y="16.5" width="9" height="10" rx="2.4" fill={fill} stroke={edge} strokeWidth="0.9" />
      <path d="M29.5 19 H34.5" stroke={fold} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
