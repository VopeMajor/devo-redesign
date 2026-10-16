'use client'

import { useId } from 'react'
import type { VirtudeKey } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Os seis naipes das Virtudes como gravura em metal champanhe (desenhos originais, viewBox 48):
   placa de aço com gradiente, filete gravado por dentro da borda, um segundo contorno interno e
   hachura diagonal na metade de sombra. `apagado` = cinza fosco (sem Arcano / trancado).
   ──────────────────────────────────────────────────────────────────────────────────────── */

function circ(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
}

export const NAIPE_PATH: Record<VirtudeKey, string> = {
  // Paus: trevo de três folhas com haste em cálice
  paus:
    circ(24, 14.5, 7.6) +
    circ(14.2, 25.6, 7.6) +
    circ(33.8, 25.6, 7.6) +
    'M24 17L15.5 27.5L32.5 27.5Z' +
    'M21.8 26Q22.4 36.5 16.5 42.5L31.5 42.5Q25.6 36.5 26.2 26Z',
  // Copas: coração
  copas: 'M24 41.5C14 33.5 6 27.2 6 18.6C6 12.5 10.6 8 16.1 8C19.7 8 22.5 10 24 13.1C25.5 10 28.3 8 31.9 8C37.4 8 42 12.5 42 18.6C42 27.2 34 33.5 24 41.5Z',
  // Ouros: losango de lados côncavos
  ouros: 'M24 4.5Q29.6 16.6 39.5 24Q29.6 31.4 24 43.5Q18.4 31.4 8.5 24Q18.4 16.6 24 4.5Z',
  // Espadas: lâmina em coração invertido com haste
  espadas:
    'M24 4.5C30 12.8 41 18.6 41 27.4C41 32.4 37.2 35.8 32.7 35.8C29.7 35.8 27.3 34.5 25.8 32.4C26.3 36.5 28.2 39.6 31.4 42.5L16.6 42.5C19.8 39.6 21.7 36.5 22.2 32.4C20.7 34.5 18.3 35.8 15.3 35.8C10.8 35.8 7 32.4 7 27.4C7 18.6 18 12.8 24 4.5Z',
  // Taças: cálice de pé alto (o naipe antigo do sobrenatural)
  tacas:
    'M9.5 7.5H38.5C38.5 19.5 32.6 26.6 26.1 28.3V34.4C26.1 36.6 29 38 33 39.2V42.5H15V39.2C19 38 21.9 36.6 21.9 34.4V28.3C15.4 26.6 9.5 19.5 9.5 7.5Z',
  // Escudos: escudo de cavaleiro (o naipe antigo da influência)
  escudos: 'M24 4.5L39.5 9.6V21.8C39.5 31.8 32.6 38.9 24 43.5C15.4 38.9 8.5 31.8 8.5 21.8V9.6Z',
}

/** Detalhes gravados próprios de cada naipe (linhas finas por dentro). */
const DETALHE: Record<VirtudeKey, string> = {
  paus: 'M24 10.5V18.5M14.2 21.6V29.6M33.8 21.6V29.6',
  copas: 'M24 17V33M17.5 15.5Q14 18.5 15 23',
  ouros: 'M24 11V37M15 24H33',
  espadas: 'M24 12V31M18.5 25Q16 27.5 17 31',
  tacas: 'M12.6 11.2H35.4M14.5 16.5Q24 21 33.5 16.5M19 39.6H29',
  escudos: 'M24 9.5V38.5M12.4 21.5H35.6',
}

export function Naipe({ virtude, className, apagado = false, title }: { virtude: VirtudeKey; className?: string; apagado?: boolean; title?: string }) {
  const id = `nai-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const d = NAIPE_PATH[virtude]
  return (
    <svg viewBox="0 0 48 48" className={cn('inline-block shrink-0', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}-m`} x1="0.1" y1="0" x2="0.75" y2="1">
          {apagado ? (
            <>
              <stop offset="0" stopColor="#6d6c69" />
              <stop offset="1" stopColor="#3a3a3d" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#f4efe6" />
              <stop offset="0.28" stopColor="#d9d0bf" />
              <stop offset="0.55" stopColor="#bab09f" />
              <stop offset="0.78" stopColor="#8a8172" />
              <stop offset="1" stopColor="#5f584d" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
        <mask id={`${id}-k`} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill={`url(#${id}-f)`} />
        </mask>
      </defs>
      {/* sombra projetada no mármore */}
      <path d={d} transform="translate(0.6 1.1)" fill="#000" opacity="0.55" />
      {/* placa */}
      <path d={d} fill={`url(#${id}-m)`} />
      <g clipPath={`url(#${id}-c)`} fill="none" strokeLinecap="round">
        {/* filete gravado junto à borda (metade interna do traço) */}
        <path d={d} stroke={apagado ? '#26262a' : '#3d382f'} strokeWidth="2.2" opacity="0.75" />
        {/* contorno interno, mais fino */}
        <path d={d} stroke={apagado ? '#26262a' : '#4a443a'} strokeWidth="0.55" opacity="0.7" transform="translate(24 24) scale(0.8) translate(-24 -24)" />
        {/* hachura na metade de sombra */}
        <g mask={`url(#${id}-k)`} stroke={apagado ? '#1e1e21' : '#4a443a'} strokeWidth="0.5" opacity="0.8">
          {Array.from({ length: 22 }, (_, i) => (
            <path key={i} d={`M${-6 + i * 2.6} 50L${18 + i * 2.6} 0`} />
          ))}
        </g>
        {/* detalhe do naipe */}
        <path d={DETALHE[virtude]} stroke={apagado ? '#26262a' : '#4a443a'} strokeWidth="0.7" opacity="0.65" />
        {/* reflexo na borda superior */}
        <path d={d} stroke="#fff" strokeWidth="0.9" opacity={apagado ? 0.08 : 0.45} transform="translate(-0.5 -0.7)" />
      </g>
    </svg>
  )
}
