'use client'

import type { ReactNode } from 'react'
import { voluta } from './ornamentos'

/**
 * Estruturas das Torres com volume de verdade: cada corpo é um prisma de três faces (esquerda iluminada pelo
 * luar, frente em meia-luz, direita na sombra) preenchido com pedra pintada (texturas WebP geradas por
 * script: blocos com variação, desgaste, fuligem e veios), oclusão sob cornijas e na base, telhados em
 * escamas de ardósia, vitrais góticos com rendilhado, arcobotantes, pináculos com crochês, gárgulas e ferro.
 * Coordenadas: base da torre em (0,0), sobe para y negativo.
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** Padrões de textura e sombras (incluir uma vez por SVG, junto de TorresDefs). */
export function EstruturasDefs() {
  return (
    <defs>
      <pattern id="tx-branca" width="44" height="44" patternUnits="userSpaceOnUse">
        <image href="/images/torres/pedra-branca.webp" width="44" height="44" />
      </pattern>
      <pattern id="tx-negra" width="44" height="44" patternUnits="userSpaceOnUse">
        <image href="/images/torres/pedra-negra.webp" width="44" height="44" />
      </pattern>
      <pattern id="tx-telha" width="22" height="22" patternUnits="userSpaceOnUse">
        <image href="/images/torres/telhas.webp" width="22" height="22" />
      </pattern>
      <pattern id="tx-marmore" width="90" height="90" patternUnits="userSpaceOnUse">
        <image href="/images/torres/marmore.webp" width="90" height="90" />
      </pattern>
      {/* luz por face */}
      <linearGradient id="sh-esq" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fffaf0" stopOpacity="0.22" />
        <stop offset="1" stopColor="#fffaf0" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="sh-frente" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.05" />
        <stop offset="1" stopColor="#000" stopOpacity="0.32" />
      </linearGradient>
      <linearGradient id="sh-dir" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#0b0b12" stopOpacity="0.58" />
        <stop offset="1" stopColor="#0b0b12" stopOpacity="0.78" />
      </linearGradient>
      <linearGradient id="sh-cil" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fffaf0" stopOpacity="0.16" />
        <stop offset="0.3" stopColor="#fffaf0" stopOpacity="0" />
        <stop offset="0.62" stopColor="#000" stopOpacity="0.3" />
        <stop offset="1" stopColor="#0b0b12" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="sh-ao" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.55" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="sh-base" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="sh-telha" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#c2b9ec" stopOpacity="0.16" />
        <stop offset="0.5" stopColor="#000" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000" stopOpacity="0.6" />
      </linearGradient>
      {/* vitral: chumbo em losangos sobre vidro */}
      <pattern id="vt-chumbo" width="5" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 3.5L2.5 0L5 3.5L2.5 7Z" fill="none" stroke="#1a1720" strokeWidth="0.55" />
      </pattern>
      <linearGradient id="vt-aceso" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#c2b9ec" />
        <stop offset="0.35" stopColor="#fff3dc" />
        <stop offset="0.75" stopColor="#ecc79a" />
        <stop offset="1" stopColor="#8a7cc8" />
      </linearGradient>
      <linearGradient id="vt-atual" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#e6e0ff" />
        <stop offset="0.5" stopColor="#8a7cc8" />
        <stop offset="1" stopColor="#4e4580" />
      </linearGradient>
      <linearGradient id="vt-apagado" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#2b2a35" />
        <stop offset="0.45" stopColor="#121116" />
        <stop offset="0.5" stopColor="#3a3946" />
        <stop offset="0.56" stopColor="#121116" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <radialGradient id="vt-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff3dc" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="vt-halo-am" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#c2b9ec" stopOpacity="0.7" />
        <stop offset="1" stopColor="#8a7cc8" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

/* ------------------------------------------------------------------ Primitivas com volume */

type Tex = 'branca' | 'negra'

/** Prisma de três faces (seção octogonal vista de frente). `w` = meia-largura na base; `wt` no topo. */
export function Prisma({ yb, yt, w, wt = w, tex = 'branca', frente = 0.56, children }: { yb: number; yt: number; w: number; wt?: number; tex?: Tex; frente?: number; children?: ReactNode }) {
  const fb = w * frente
  const ft = wt * frente
  const esq = `M${-w} ${yb}L${-fb} ${yb}L${-ft} ${yt}L${-wt} ${yt}Z`
  const fr = `M${-fb} ${yb}L${fb} ${yb}L${ft} ${yt}L${-ft} ${yt}Z`
  const dir = `M${fb} ${yb}L${w} ${yb}L${wt} ${yt}L${ft} ${yt}Z`
  const fill = `url(#tx-${tex})`
  return (
    <g>
      <path d={esq} fill={fill} />
      <path d={esq} fill="url(#sh-esq)" />
      <path d={fr} fill={fill} />
      <path d={fr} fill="url(#sh-frente)" />
      <path d={dir} fill={fill} />
      <path d={dir} fill="url(#sh-dir)" />
      {/* arestas: a da luz acesa, a da sombra escura */}
      <path d={`M${-fb} ${yb}L${-ft} ${yt}`} stroke="#fffaf0" strokeWidth={0.7} opacity={0.55} />
      <path d={`M${fb} ${yb}L${ft} ${yt}`} stroke="#0b0b10" strokeWidth={0.8} opacity={0.7} />
      {children}
      {/* oclusão no topo (sob a cornija) e na base */}
      <path d={`M${-wt} ${yt}H${wt}L${wt + (w - wt) * 0.08} ${yt + 12}H${-wt - (w - wt) * 0.08}Z`} fill="url(#sh-ao)" />
      <path d={`M${-w} ${yb - 14}H${w}L${w} ${yb}H${-w}Z`} fill="url(#sh-base)" />
    </g>
  )
}

/** Cilindro (torre redonda): textura + sombreamento cilíndrico + fiadas curvas. */
export function Cilindro({ yb, yt, w, wt = w, tex = 'negra', aneis = [] as number[] }: { yb: number; yt: number; w: number; wt?: number; tex?: Tex; aneis?: number[] }) {
  const d = `M${-w} ${yb}L${-wt} ${yt}L${wt} ${yt}L${w} ${yb}Z`
  return (
    <g>
      <path d={d} fill={`url(#tx-${tex})`} />
      <path d={d} fill="url(#sh-cil)" />
      {aneis.map((y) => {
        const k = w + ((wt - w) * (y - yb)) / (yt - yb)
        return (
          <g key={y}>
            <path d={`M${-k - 1} ${y}Q0 ${y + 6} ${k + 1} ${y}`} stroke="#0b0b10" strokeWidth={3} fill="none" opacity={0.55} />
            <path d={`M${-k - 1} ${y - 1.6}Q0 ${y + 4.4} ${k + 1} ${y - 1.6}`} stroke="url(#tw-steel)" strokeWidth={1.3} fill="none" />
          </g>
        )
      })}
      <path d={`M${-wt} ${yt}H${wt}L${wt} ${yt + 10}H${-wt}Z`} fill="url(#sh-ao)" />
    </g>
  )
}

/** Cornija saliente com dentículos e sombra projetada. */
export function Cornija({ y, w, alta = 6 }: { y: number; w: number; alta?: number }) {
  return (
    <g>
      <path d={`M${-w + 1} ${y + alta}H${w - 1}L${w - 3} ${y + alta + 6}H${-w + 3}Z`} fill="#000" opacity={0.4} />
      <path d={`M${-w} ${y}H${w}L${w - 1.5} ${y + alta}H${-w + 1.5}Z`} fill="url(#tx-branca)" />
      <path d={`M${-w} ${y}H${w}L${w - 1.5} ${y + alta}H${-w + 1.5}Z`} fill="url(#sh-frente)" />
      <path d={`M${-w} ${y}H${w}`} stroke="#fffaf0" strokeWidth={0.8} opacity={0.7} />
      {Array.from({ length: Math.floor((w * 2) / 5) }, (_, i) => -w + 3 + i * 5).map((x) => (
        <rect key={x} x={x} y={y + alta - 2.2} width={2.4} height={2.2} fill="#0b0b10" opacity={0.45} />
      ))}
    </g>
  )
}

/** Balaustrada de pedra sobre uma cornija. */
export function Balaustrada({ y, w }: { y: number; w: number }) {
  const n = Math.floor((w * 2) / 4.4)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => -w + 2.2 + i * 4.4).map((x) => (
        <path key={x} d={`M${x - 1} ${y}Q${x - 1.8} ${y - 3.5} ${x} ${y - 4.5}Q${x + 1.8} ${y - 3.5} ${x + 1} ${y}Z M${x - 0.9} ${y - 4.5}H${x + 0.9}V${y - 7}H${x - 0.9}Z`} fill={x < 0 ? '#e9e6e0' : '#9d9a94'} />
      ))}
      <path d={`M${-w - 1} ${y - 8.2}H${w + 1}V${y - 6.6}H${-w - 1}Z`} fill="url(#tx-branca)" />
      <path d={`M${-w - 1} ${y - 8.2}H${w + 1}`} stroke="#fffaf0" strokeWidth={0.6} opacity={0.7} />
    </g>
  )
}

/** Pináculo de ardósia em escamas (duas faces), com crochês nas arestas e remate. */
export function Pinaculo({ yb, h, w, crochets = 4, remate }: { yb: number; h: number; w: number; crochets?: number; remate?: ReactNode }) {
  const top = yb - h
  return (
    <g>
      <path d={`M${-w} ${yb}L0 ${top}L${w * 0.15} ${yb}Z`} fill="url(#tx-telha)" />
      <path d={`M${-w} ${yb}L0 ${top}L${w * 0.15} ${yb}Z`} fill="url(#sh-telha)" />
      <path d={`M${w * 0.15} ${yb}L0 ${top}L${w} ${yb}Z`} fill="url(#tx-telha)" />
      <path d={`M${w * 0.15} ${yb}L0 ${top}L${w} ${yb}Z`} fill="#000" opacity={0.55} />
      <path d={`M0 ${top}L${w * 0.15} ${yb}`} stroke="#bab09f" strokeWidth={0.7} opacity={0.6} />
      <path d={`M${-w} ${yb}L0 ${top}`} stroke="#ece5d8" strokeWidth={0.6} opacity={0.5} />
      {Array.from({ length: crochets }, (_, i) => (i + 1) / (crochets + 1)).map((t) => (
        <g key={t}>
          <path d={voluta(-w * (1 - t), yb - h * t, Math.max(1.8, w * 0.16), -1)} fill="none" stroke="#6b6357" strokeWidth={0.9} strokeLinecap="round" />
          <path d={voluta(w * (1 - t), yb - h * t, Math.max(1.8, w * 0.16), 1)} fill="none" stroke="#38393c" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      ))}
      {remate}
    </g>
  )
}

/** Pináculo fino de pedra (agulha de contraforte), com flor no topo. */
export function Agulheta({ x, yb, h, w = 3 }: { x: number; yb: number; h: number; w?: number }) {
  return (
    <g>
      <path d={`M${x - w} ${yb}L${x} ${yb - h}L${x + w} ${yb}Z`} fill="url(#tx-branca)" />
      <path d={`M${x} ${yb}L${x} ${yb - h}L${x + w} ${yb}Z`} fill="#000" opacity={0.45} />
      <path d={`M${x - 1.6} ${yb - h + 2}L${x} ${yb - h - 3}L${x + 1.6} ${yb - h + 2}Z`} fill="url(#tw-steel)" />
      {[0.35, 0.6].map((t) => (
        <path key={t} d={voluta(x - w * (1 - t), yb - h * t, 1.6, -1)} fill="none" stroke="#8f8676" strokeWidth={0.6} />
      ))}
    </g>
  )
}

/** Gárgula: criatura de pedra saindo da cornija (perfil), virada para `s`. */
export function Gargula({ x, y, s = 1, k = 1 }: { x: number; y: number; s?: number; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k} ${k})`}>
      <path d="M0 0C4 -3 9 -3 12 -1L15 -3L14 0C16 1 17 3 15 4L11 3C8 5 4 5 0 3Z" fill="#4a4a50" />
      <path d="M0 0C4 -3 9 -3 12 -1" stroke="#9d9a94" strokeWidth={0.5} fill="none" />
      <path d="M4 -1.6C5 -5 8 -6 9 -3" fill="#38393c" />
      <circle cx={13} cy={0.6} r={0.6} fill="#c2b9ec" />
    </g>
  )
}

export type EstadoJanela = 'acesa' | 'atual' | 'apagada'

/** Vitral gótico: moldura de pedra com arquivolta, mainel, rosácea em trevo no tímpano e vidro com chumbo. */
export function Vitral({ x, y, w, h, estado }: { x: number; y: number; w: number; h: number; estado: EstadoJanela }) {
  const hw = w / 2
  const arco = (dx: number, dy: number) => `M${x - hw - dx} ${y + dy}V${y - h * 0.58}Q${x - hw - dx} ${y - h * 0.92 - dy} ${x} ${y - h - dy * 1.6}Q${x + hw + dx} ${y - h * 0.92 - dy} ${x + hw + dx} ${y - h * 0.58}V${y + dy}Z`
  const vidro = estado === 'acesa' ? 'url(#vt-aceso)' : estado === 'atual' ? 'url(#vt-atual)' : 'url(#vt-apagado)'
  return (
    <g>
      {estado !== 'apagada' && <ellipse cx={x} cy={y - h / 2} rx={w * 1.7} ry={h * 0.95} fill={estado === 'atual' ? 'url(#vt-halo-am)' : 'url(#vt-halo)'} />}
      {/* arquivolta (pedra) e recuo */}
      <path d={arco(1.8, 1.2)} fill="url(#tx-branca)" />
      <path d={arco(1.8, 1.2)} fill="#000" opacity={0.18} />
      <path d={arco(0.6, 0.4)} fill="#0b0b10" opacity={0.85} />
      <path d={arco(0, 0)} fill={vidro} />
      {estado !== 'apagada' && <path d={arco(0, 0)} fill="url(#vt-chumbo)" opacity={0.7} />}
      {/* mainel, travessa e trevo */}
      <path d={`M${x} ${y}V${y - h * 0.62}M${x - hw} ${y - h * 0.32}H${x + hw}`} stroke="#2c2a26" strokeWidth={Math.max(0.6, w * 0.07)} />
      <circle cx={x} cy={y - h * 0.76} r={w * 0.2} fill="none" stroke="#2c2a26" strokeWidth={Math.max(0.5, w * 0.05)} />
      <path d={`M${x - hw * 0.45} ${y - h * 0.62}Q${x - hw * 0.45} ${y - h * 0.68} ${x} ${y - h * 0.62}Q${x + hw * 0.45} ${y - h * 0.68} ${x + hw * 0.45} ${y - h * 0.62}`} stroke="#2c2a26" strokeWidth={Math.max(0.4, w * 0.04)} fill="none" />
      {/* pedra-chave */}
      <path d={`M${x - 1.2} ${y - h - 1.6}L${x} ${y - h - 4}L${x + 1.2} ${y - h - 1.6}Z`} fill="#e9e6e0" />
      {estado === 'apagada' && <path d={`M${x - hw * 0.6} ${y - h * 0.2}L${x + hw * 0.2} ${y - h * 0.7}`} stroke="#6f6b82" strokeWidth={0.5} opacity={0.6} />}
    </g>
  )
}

/** Janela redonda (óculo) com vitral em rosa. */
export function Oculo({ x, y, r, estado }: { x: number; y: number; r: number; estado: EstadoJanela }) {
  const vidro = estado === 'acesa' ? 'url(#vt-aceso)' : estado === 'atual' ? 'url(#vt-atual)' : 'url(#vt-apagado)'
  return (
    <g>
      {estado !== 'apagada' && <circle cx={x} cy={y} r={r * 2.4} fill={estado === 'atual' ? 'url(#vt-halo-am)' : 'url(#vt-halo)'} />}
      <circle cx={x} cy={y} r={r + 1.8} fill="url(#tx-branca)" />
      <circle cx={x} cy={y} r={r + 0.6} fill="#0b0b10" />
      <circle cx={x} cy={y} r={r} fill={vidro} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${x} ${y}L${x} ${y - r}`} stroke="#2c2a26" strokeWidth={0.5} transform={`rotate(${i * 60} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r * 0.35} fill="none" stroke="#2c2a26" strokeWidth={0.5} />
    </g>
  )
}

/** Rosácea grande com pétalas. */
export function Rosacea({ x, y, r, acesa }: { x: number; y: number; r: number; acesa: boolean }) {
  return (
    <g>
      {acesa && <circle cx={x} cy={y} r={r * 2.2} fill="url(#vt-halo)" />}
      <circle cx={x} cy={y} r={r + 3} fill="url(#tx-branca)" />
      <circle cx={x} cy={y} r={r + 3} fill="#000" opacity={0.15} />
      <circle cx={x} cy={y} r={r + 1} fill="#0b0b10" />
      <circle cx={x} cy={y} r={r} fill={acesa ? 'url(#vt-aceso)' : 'url(#vt-apagado)'} />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 30} ${x} ${y})`}>
          <path d={`M${x} ${y}L${x} ${y - r}`} stroke="#2c2a26" strokeWidth={0.7} />
          <circle cx={x} cy={y - r * 0.68} r={r * 0.2} fill="none" stroke="#2c2a26" strokeWidth={0.6} />
        </g>
      ))}
      <circle cx={x} cy={y} r={r * 0.3} fill={acesa ? '#fffaf0' : '#5a4f8f'} stroke="#2c2a26" strokeWidth={0.7} />
    </g>
  )
}

/** Portal gótico com arquivoltas em degraus, porta de madeira escura com ferragens. */
export function Portal({ w, h, aceso }: { w: number; h: number; aceso: boolean }) {
  const arco = (k: number) => {
    const hw = w / 2 + k * 2.4
    const hh = h + k * 3
    return `M${-hw} 0V${-hh * 0.6}Q${-hw} ${-hh * 0.93} 0 ${-hh}Q${hw} ${-hh * 0.93} ${hw} ${-hh * 0.6}V0Z`
  }
  return (
    <g>
      {[3, 2, 1].map((k) => (
        <g key={k}>
          <path d={arco(k)} fill="url(#tx-branca)" />
          <path d={arco(k)} fill="#000" opacity={0.12 + (3 - k) * 0.08} />
        </g>
      ))}
      <path d={arco(0)} fill={aceso ? 'url(#vt-aceso)' : '#1a1512'} />
      {!aceso && (
        <g stroke="#0b0907" strokeWidth={0.6}>
          {[-w / 4, 0, w / 4].map((x) => (
            <path key={x} d={`M${x} 0V${-h * 0.9}`} />
          ))}
        </g>
      )}
      <path d={`M${-w / 2} ${-h * 0.35}H${w / 2}M${-w / 2} ${-h * 0.7}H${w / 2}`} stroke="#6b6357" strokeWidth={0.9} />
      <circle cx={w * 0.18} cy={-h * 0.5} r={1.2} fill="#bab09f" />
      <path d={`M${-1.5} ${-h - 9}L0 ${-h - 13}L1.5 ${-h - 9}Z`} fill="url(#tw-steel)" />
    </g>
  )
}

/** Arcobotante: arco de pedra do contraforte até a parede, com agulheta no topo. */
export function Arcobotante({ s, xp, yp, xw, yw, h }: { s: number; xp: number; yp: number; xw: number; yw: number; h: number }) {
  return (
    <g>
      {/* contraforte */}
      <path d={`M${s * xp - 4} ${yp}H${s * xp + 4}V${yp - h}H${s * xp - 4}Z`} fill="url(#tx-branca)" />
      <path d={`M${s * xp + (s > 0 ? 0 : -4)} ${yp}H${s * xp + (s > 0 ? 4 : 0)}V${yp - h}H${s * xp + (s > 0 ? 0 : -4)}Z`} fill="#000" opacity={0.45} />
      {/* arco */}
      <path d={`M${s * xp} ${yp - h + 6}Q${s * (xp + xw) * 0.5} ${yp - h - 8} ${s * xw} ${yw}L${s * xw} ${yw + 5}Q${s * (xp + xw) * 0.5} ${yp - h - 2} ${s * xp} ${yp - h + 12}Z`} fill="url(#tx-branca)" />
      <path d={`M${s * xp} ${yp - h + 12}Q${s * (xp + xw) * 0.5} ${yp - h - 2} ${s * xw} ${yw + 5}`} stroke="#000" strokeWidth={1} opacity={0.4} fill="none" />
      <Agulheta x={s * xp} yb={yp - h} h={22} w={4} />
    </g>
  )
}

/** Estandarte de tecido lavanda com bordado em estrela e franja. */
export function Estandarte({ x, y, h, emblema }: { x: number; y: number; h: number; emblema?: ReactNode }) {
  return (
    <g>
      <path d={`M${x - 7} ${y}H${x + 7}`} stroke="url(#tw-steel)" strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M${x - 6} ${y}C${x - 6.5} ${y + h * 0.4} ${x - 5.5} ${y + h * 0.7} ${x - 6} ${y + h}L${x} ${y + h - 7}L${x + 6} ${y + h}C${x + 6.5} ${y + h * 0.7} ${x + 5.5} ${y + h * 0.4} ${x + 6} ${y}Z`} fill="#4e4580" />
      <path d={`M${x - 6} ${y}C${x - 6.5} ${y + h * 0.4} ${x - 5.5} ${y + h * 0.7} ${x - 6} ${y + h}L${x} ${y + h - 7}V${y}Z`} fill="#8a7cc8" opacity={0.35} />
      <path d={`M${x - 4.5} ${y + 3}H${x + 4.5}`} stroke="#bab09f" strokeWidth={0.6} />
      <g transform={`translate(${x} ${y + h * 0.45})`}>{emblema}</g>
    </g>
  )
}

/** Galo do cata-vento (silhueta de aço). */
export function CataVentoGalo({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M0 0V-16" stroke="url(#tw-steel)" strokeWidth={1.2} />
      <path d="M-6 -6H6M0 -12V0" stroke="#bab09f" strokeWidth={0.6} />
      <path d="M-7 -18C-6 -22 -2 -24 1 -23L2 -27L4 -24L6 -26L5 -22C8 -21 8 -18 6 -17L3 -16C1 -15 -3 -15 -5 -16C-8 -14 -10 -16 -11 -20C-9 -19 -8 -18 -7 -18Z" fill="url(#tw-steel)" />
      <circle cx={3.2} cy={-21} r={0.6} fill="#0c0c0e" />
    </g>
  )
}

/** Coroa de ameias com pontas e joias (parapeito do palácio do Imperador). */
export function Coroa({ y, w }: { y: number; w: number }) {
  const n = 7
  const pts = Array.from({ length: n }, (_, i) => -w + (i * (2 * w)) / (n - 1))
  return (
    <g>
      <path d={`M${-w - 2} ${y}H${w + 2}V${y - 6}H${-w - 2}Z`} fill="url(#tw-steel)" />
      <path d={`M${-w - 2} ${y - 3}H${w + 2}`} stroke="#5f584d" strokeWidth={0.6} />
      {pts.map((x, i) => {
        const alta = i % 2 === 0 ? 14 : 9
        return (
          <g key={i}>
            <path d={`M${x - 3.4} ${y - 6}L${x} ${y - 6 - alta}L${x + 3.4} ${y - 6}Z`} fill="url(#tw-steel)" />
            <path d={`M${x} ${y - 6}L${x} ${y - 6 - alta}L${x + 3.4} ${y - 6}Z`} fill="#000" opacity={0.3} />
            <circle cx={x} cy={y - 6 - alta - 1.6} r={1.6} fill={i % 2 === 0 ? '#8a7cc8' : '#ece5d8'} />
          </g>
        )
      })}
      {pts.slice(0, -1).map((x, i) => (
        <path key={`g${i}`} d={`M${x + w / (n - 1) - 1.6} ${y - 3}L${x + w / (n - 1)} ${y - 4.6}L${x + w / (n - 1) + 1.6} ${y - 3}L${x + w / (n - 1)} ${y - 1.4}Z`} fill={i % 2 ? '#ece5d8' : '#5a4f8f'} />
      ))}
    </g>
  )
}
