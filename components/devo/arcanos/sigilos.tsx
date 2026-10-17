'use client'

import { useState } from 'react'
import { arteDe } from '@/lib/devo/arcanos-arte'
import type { ArcanoKey } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Sigilos dos 22 Arcanos (desenhos originais, viewBox 48, traço). Cada um tira um símbolo da
   carta: o zero aberto do Louco, a lemniscata do Mago, as colunas da Sacerdotisa, a foice da
   Morte, a roda da Fortuna… São o marcador no mapa orbital e o PLACEHOLDER das figuras
   pintadas enquanto a arte não chega (lib/devo/arcanos-arte.ts).
   ──────────────────────────────────────────────────────────────────────────────────────── */

const c = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
const r1 = (n: number) => Math.round(n * 100) / 100
/** Estrela de `n` pontas (ou polígono estrelado com passo `passo`). */
function estrela(cx: number, cy: number, n: number, re: number, ri: number, giro = -90) {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const a = ((giro + (i * 180) / n) * Math.PI) / 180
    const r = i % 2 ? ri : re
    d += `${i ? 'L' : 'M'}${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`
  }
  return d + 'Z'
}
function raios(cx: number, cy: number, n: number, a: number, b: number, giro = -90) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const t = ((giro + (i * 360) / n) * Math.PI) / 180
    d += `M${r1(cx + Math.cos(t) * a)} ${r1(cy + Math.sin(t) * a)}L${r1(cx + Math.cos(t) * b)} ${r1(cy + Math.sin(t) * b)}`
  }
  return d
}
/** Pentagrama (traço contínuo), ponta para baixo quando `invertido`. */
function pentagrama(cx: number, cy: number, r: number, invertido = false) {
  const g = invertido ? 90 : -90
  const p = [0, 2, 4, 1, 3].map((i) => {
    const a = ((g + i * 72) * Math.PI) / 180
    return `${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`
  })
  return `M${p.join('L')}Z`
}

/** Traço principal (stroke) e pontos/preenchimentos (fill) de cada sigilo. */
export const SIGILO: Record<ArcanoKey, { traco: string; cheio?: string }> = {
  louco: { traco: 'M29.5 13.4A11.5 11.5 0 1 1 18.5 13.4M24 6V16', cheio: estrela(24, 8.5, 4, 2.6, 0.9) },
  mago: { traco: 'M24 22C20.5 16.5 13 16.5 13 22C13 27.5 20.5 27.5 24 22C27.5 16.5 35 16.5 35 22C35 27.5 27.5 27.5 24 22ZM24 28.5V39M19.5 39H28.5', cheio: c(24, 11.5, 1.8) },
  sacerdotisa: { traco: 'M14.5 12V38M33.5 12V38M12 12H17M31 12H36M12 38H17M31 38H36', cheio: 'M26.6 18.2A6.2 6.2 0 1 0 26.6 29.8A4.8 4.8 0 1 1 26.6 18.2Z' },
  imperatriz: { traco: c(24, 18.5, 7.5) + 'M24 26V39M18.5 33H29.5', cheio: estrela(24, 8, 3, 2.6, 1, -90) },
  imperador: { traco: 'M16.5 21H31.5V37H16.5ZM16.5 21C12 19.5 11 13.5 15.5 11.5M31.5 21C36 19.5 37 13.5 32.5 11.5M24 25V33M20 29H28' },
  hierofante: { traco: 'M24 9V39M19.5 14H28.5M17 20H31M14.5 26H33.5M19 39H29' },
  enamorados: { traco: c(19.5, 25, 7.5) + c(28.5, 25, 7.5), cheio: 'M24 15.8C22.5 13.8 19.6 14.2 19.6 16.6C19.6 18.6 22 20 24 21.6C26 20 28.4 18.6 28.4 16.6C28.4 14.2 25.5 13.8 24 15.8Z' },
  carro: { traco: 'M13.5 15.5H34.5L31.5 28H16.5ZM24 15.5V9M20 9H28' + c(17.5, 33.5, 4) + c(30.5, 33.5, 4) },
  forca: { traco: 'M24 13.5C21.5 10 16.5 10 16.5 13.5C16.5 17 21.5 17 24 13.5C26.5 10 31.5 10 31.5 13.5C31.5 17 26.5 17 24 13.5ZM13 37Q24 18.5 35 37M19 33Q24 27.5 29 33' },
  eremita: { traco: 'M24 15L30.5 18.7V26.3L24 30L17.5 26.3V18.7ZM24 9V15M24 30V39M20 39H28', cheio: estrela(24, 22.5, 4, 3.4, 1.1) },
  fortuna: { traco: c(24, 24, 12) + c(24, 24, 3.2) + raios(24, 24, 8, 3.2, 12) },
  justica: { traco: 'M24 10V37M17 37H31M13.5 16H34.5M13.5 16L10.5 25H16.5ZM34.5 16L31.5 25H37.5Z', cheio: c(24, 10, 1.8) },
  enforcado: { traco: 'M13 12H35M24 12V20M18 22H30L24 35Z', cheio: c(24, 38.5, 1.8) },
  morte: { traco: 'M17 39L30 10M30 10C37.5 12.5 39.5 19 36.5 25C35 19.5 31.5 16.5 27.2 16.3' },
  temperanca: { traco: 'M14.5 14.5H33.5V33.5H14.5ZM24 18L31 30.5H17Z', cheio: c(24, 26.5, 1.6) },
  diabo: { traco: pentagrama(24, 25, 12, true) + 'M15 10Q17.5 15 21 15.5M33 10Q30.5 15 27 15.5' },
  torre: { traco: 'M18 39V18.5L21 14.5H27L30 18.5V39M15.5 39H32.5M22 22H26M22 29H26', cheio: 'M35 8L30.5 18H34L29.5 27.5L36.5 15.5H33Z' },
  estrela: { traco: estrela(24, 23, 8, 12.5, 4.6, -90), cheio: c(13, 37, 1.3) + c(35, 37, 1.3) + c(24, 40, 1.3) },
  lua: { traco: 'M28.5 11.5A12.5 12.5 0 1 0 28.5 36.5A9.6 9.6 0 1 1 28.5 11.5Z', cheio: c(34, 18, 1.2) + c(36.5, 28, 1.6) },
  sol: { traco: c(24, 24, 7.5) + raios(24, 24, 12, 10.5, 15.5), cheio: c(24, 24, 2.4) },
  julgamento: { traco: 'M12.5 32L29.5 17.5L32 21.5L15 35ZM29.5 17.5L33 12M32 21.5L37.5 19.5M34.5 26.5L38.5 27.5M15 35L13.5 39' },
  mundo: { traco: 'M24 10C31 10 34.5 16.5 34.5 24C34.5 31.5 31 38 24 38C17 38 13.5 31.5 13.5 24C13.5 16.5 17 10 24 10Z', cheio: 'M24 18L28 24L24 30L20 24Z' + c(9, 9, 1.6) + c(39, 9, 1.6) + c(9, 39, 1.6) + c(39, 39, 1.6) },
}

/**
 * Sigilo com aro. `estado`: `aceso` (o próprio, ametista e metal claro), `aberto` (equipe: metal), `apagado`
 * (trancado: cinza fosco). Decorativo por padrão (o rótulo fica no botão que o envolve).
 */
export function Sigilo({ arcano, estado = 'aberto', aro = true, className }: { arcano: ArcanoKey; estado?: 'aceso' | 'aberto' | 'apagado'; aro?: boolean; className?: string }) {
  const s = SIGILO[arcano]
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0',
        estado === 'aceso' && 'text-dv-gold-bright drop-shadow-[0_0_6px_var(--dv-amethyst)]',
        estado === 'aberto' && 'text-dv-gold',
        estado === 'apagado' && 'text-dv-text-3',
        className,
      )}
    >
      {aro && (
        <>
          <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.9" />
          <circle cx="24" cy="24" r="20.4" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.6" strokeDasharray="0.8 1.6" />
        </>
      )}
      <path d={s.traco} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {s.cheio && <path d={s.cheio} fill="currentColor" />}
    </svg>
  )
}

/**
 * Sigilo pintado (prata, fundo transparente; infra/arte). Cai no sigilo desenhado se não houver arte ou se falhar.
 * `apagado`: cinza e escuro; `aceso`: brilho ametista.
 */
export function SigiloPintado({ arcano, estado = 'aberto', className, px = 32 }: { arcano: ArcanoKey; estado?: 'aceso' | 'aberto' | 'apagado'; className?: string; px?: number }) {
  const arte = arteDe(arcano, 'sigilo')
  const [falhou, setFalhou] = useState(false)
  if (!arte || falhou) return <Sigilo arcano={arcano} aro={false} estado={estado} className={className} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={arte.src}
      srcSet={arte.srcSet}
      sizes={`${px}px`}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      onError={() => setFalhou(true)}
      className={cn(
        'inline-block shrink-0 object-contain',
        estado === 'apagado' && 'brightness-[0.5] grayscale',
        estado === 'aceso' && 'drop-shadow-[0_0_5px_var(--dv-amethyst)]',
        className,
      )}
    />
  )
}
