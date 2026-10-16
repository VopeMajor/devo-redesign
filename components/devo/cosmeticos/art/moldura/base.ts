/**
 * Base comum das molduras:
 *   avatar  viewBox 0 0 300 400 — janela da foto (30,40)–(270,360), retrato 3:4 do Record
 *   mini    viewBox 0 0 120 120 — janela da foto (20,20)–(100,100), quadrada (chat, ranking, listas)
 * A moldura é uma camada por cima da foto: nada aqui toca a imagem do jogador.
 */
import { type Arte, catmull, espiral, n2, perola, type Pt } from '../kit'

export type MolduraArte = { avatar: Arte; mini: Arte }

export const AV = { vb: '0 0 300 400', x: 30, y: 40, w: 240, h: 320 }
export const MI = { vb: '0 0 120 120', x: 20, y: 20, w: 80, h: 80 }

/** Sombra projetada única por moldura de avatar (as minis não usam filtro: listas longas). */
export const sombra = (u: string, op = 0.55) =>
  `<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity="${op}"/></filter></defs>`

/** Voluta em fio: segmento de entrada + espiral. */
export function voluta(entrada: Pt[], cx: number, cy: number, r0: number, r1: number, voltas: number, a0: number, sentido = 1) {
  return catmull([...entrada, ...espiral(cx, cy, r0, r1, voltas, a0, sentido, 14)])
}

/** Fileira de pérolas ao longo de um segmento. */
export function fileiraPerolas(u: string, a: Pt, b: Pt, passo: number, r: number, contorno = '#6f665e') {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const n = Math.max(1, Math.floor(len / passo))
  let s = ''
  for (let i = 0; i <= n; i++) s += perola(u, a[0] + (dx * i) / n, a[1] + (dy * i) / n, r, contorno)
  return s
}

/** Fio de pérolas em catenária (guirlanda) entre dois pontos, caindo `queda`. */
export function guirlanda(u: string, a: Pt, b: Pt, queda: number, n: number, r: number) {
  let s = ''
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * queda
    s += perola(u, x, y, r * (0.8 + 0.2 * Math.sin(Math.PI * t)))
  }
  return s
}

export function tiques(cx: number, cy: number, r1: number, r2: number, de: number, ate: number, passo: number, cor: string, sw: number, ry = 1) {
  let d = ''
  for (let a = de; a <= ate + 0.01; a += passo) {
    const t = (a * Math.PI) / 180
    d += `M${n2(cx + Math.cos(t) * r1)} ${n2(cy + Math.sin(t) * r1 * ry)}L${n2(cx + Math.cos(t) * r2)} ${n2(cy + Math.sin(t) * r2 * ry)}`
  }
  return `<path d="${d}" stroke="${cor}" stroke-width="${sw}" fill="none"/>`
}

export function numerais(cx: number, cy: number, r: number, horas: number[], tam: number, cor: string, ry = 1, girar = true) {
  const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
  let s = ''
  for (const h of horas) {
    const ang = h * 30 - 90
    const a = (ang * Math.PI) / 180
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r * ry
    s += `<text x="${n2(x)}" y="${n2(y)}" text-anchor="middle" dominant-baseline="central" font-size="${tam}" fill="${cor}"${girar ? ` transform="rotate(${ang + 90} ${n2(x)} ${n2(y)})"` : ''} style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:600">${rom[h % 12]}</text>`
  }
  return s
}
