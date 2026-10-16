/**
 * Materiais de acabamento (rodada 2 da arte — POCO-REFORMULACAO-dono.md §7, refs/cosmeticos): metal com bisel,
 * reflexo e oclusão falsa; gemas lapidadas por facetas; rosas em volume; laços com céu estrelado; cartas de
 * tarô; textura escovada. Tudo SVG puro em string, sem filtros (barato no celular): sombra e luz são camadas.
 */
import { catmull, circulo, estrela4, n2, type Pt } from './kit'

/** Paleta de metal: [brilho, claro, médio, escuro, fundo]. */
export const METAIS = {
  prata: ['#ffffff', '#e2e0dc', '#a6a39d', '#57544f', '#2a2825'],
  champanhe: ['#fffaf0', '#e4d8bf', '#ad9e83', '#5e564a', '#2b2620'],
  ouro: ['#fff3c8', '#e2c27a', '#a8823d', '#5a4119', '#2a1d09'],
  ferro: ['#a7a4ad', '#5d5a62', '#36343a', '#18171b', '#08070a'],
  bronze: ['#f6dfb2', '#c79e64', '#8a663c', '#47321a', '#20160b'],
  lua: ['#ffffff', '#e8edf4', '#aab3c3', '#5e6576', '#2b303b'],
  ferrugem: ['#e9c9a3', '#b0805a', '#76503a', '#3d271c', '#1c110b'],
} as const
export type Metal = keyof typeof METAIS

const stops = (pares: [number, string][]) => pares.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')

/**
 * Gradientes de um metal: `${id}` vertical em bisel (reflexo forte no terço de cima, faixa escura no meio, luz
 * rebatida embaixo), `${id}-d` diagonal, `${id}-r` radial (botões/cabeças de rebite), `${id}-f` plano escuro (lado).
 */
export function metalDefs(id: string, m: Metal) {
  const [hi, cl, md, es, fu] = METAIS[m]
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, cl],
    [0.16, hi],
    [0.3, cl],
    [0.46, md],
    [0.56, es],
    [0.7, md],
    [0.86, cl],
    [1, md],
  ])}</linearGradient><linearGradient id="${id}-d" x1="0" y1="0" x2="1" y2="1">${stops([
    [0, hi],
    [0.22, cl],
    [0.45, md],
    [0.6, es],
    [0.78, md],
    [1, cl],
  ])}</linearGradient><radialGradient id="${id}-r" cx=".38" cy=".32" r=".75">${stops([
    [0, hi],
    [0.3, cl],
    [0.65, md],
    [1, es],
  ])}</radialGradient><linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, es],
    [1, fu],
  ])}</linearGradient>`
}

/** Cor escura de contorno de um metal (para AO). */
export const contornoDe = (m: Metal) => METAIS[m][4]

/**
 * Peça de metal em relevo: sombra projetada (oclusão), corpo com gradiente, borda escura, fio de luz no alto à
 * esquerda e fio de sombra embaixo à direita. `s` = escala do traço (1 no avatar, ~0.5 no mini).
 */
export function relevo(d: string, grad: string, m: Metal, s = 1, extra = '') {
  const k = contornoDe(m)
  return `<path d="${d}" fill="#000" opacity=".42" transform="translate(${n2(1.2 * s)} ${n2(1.8 * s)})"/><path d="${d}" fill="url(#${grad})" stroke="${k}" stroke-width="${n2(0.9 * s)}" stroke-linejoin="round"${extra}/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${n2(0.6 * s)}" transform="translate(${n2(-0.45 * s)} ${n2(-0.6 * s)})" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${n2(0.6 * s)}" transform="translate(${n2(0.45 * s)} ${n2(0.6 * s)})" stroke-linejoin="round"/>`
}

/** Fio de metal em relevo (traço em vez de preenchimento). */
export function fioRelevo(d: string, grad: string, m: Metal, w: number) {
  const k = contornoDe(m)
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="${n2(w + 1.4)}" stroke-linecap="round" transform="translate(1 1.6)"/><path d="${d}" fill="none" stroke="${k}" stroke-width="${n2(w + 1.2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#${grad})" stroke-width="${n2(w)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="${n2(Math.max(0.35, w * 0.25))}" stroke-linecap="round" transform="translate(${n2(-w * 0.2)} ${n2(-w * 0.25)})"/>`
}

/** Moldura de bandas em bisel: chanfro claro em cima/esquerda, escuro embaixo/direita (lê como volume real). */
export function bandaBisel(x: number, y: number, w: number, h: number, e: number, m: Metal, id: string) {
  const [hi, cl, md, es, fu] = METAIS[m]
  const xi = x + e
  const yi = y + e
  const xo = x + w
  const yo = y + h
  const xi2 = xo - e
  const yi2 = yo - e
  const tra = (pts: number[][], cor: string) => `<path d="M${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join('L')}Z" fill="${cor}"/>`
  return `<g>${tra(
    [
      [x, y],
      [xo, y],
      [xi2, yi],
      [xi, yi],
    ],
    `url(#${id}-bt)`,
  )}${tra(
    [
      [x, y],
      [xi, yi],
      [xi, yi2],
      [x, yo],
    ],
    `url(#${id}-bl)`,
  )}${tra(
    [
      [xo, y],
      [xo, yo],
      [xi2, yi2],
      [xi2, yi],
    ],
    `url(#${id}-br)`,
  )}${tra(
    [
      [x, yo],
      [xi, yi2],
      [xi2, yi2],
      [xo, yo],
    ],
    `url(#${id}-bb)`,
  )}<path d="M${x} ${y}H${xo}V${yo}H${x}Z M${xi} ${yi}V${yi2}H${xi2}V${yi}Z" fill="none" stroke="${fu}" stroke-width=".8"/><path d="M${n2(x + 0.8)} ${n2(yo - 1)}V${n2(y + 0.8)}H${n2(xo - 1)}" fill="none" stroke="${hi}" stroke-opacity=".8" stroke-width=".7"/></g><defs><linearGradient id="${id}-bt" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, hi],
    [0.5, cl],
    [1, md],
  ])}</linearGradient><linearGradient id="${id}-bl" x1="0" y1="0" x2="1" y2="0">${stops([
    [0, cl],
    [0.6, md],
    [1, es],
  ])}</linearGradient><linearGradient id="${id}-br" x1="1" y1="0" x2="0" y2="0">${stops([
    [0, es],
    [0.6, md],
    [1, fu],
  ])}</linearGradient><linearGradient id="${id}-bb" x1="0" y1="1" x2="0" y2="0">${stops([
    [0, fu],
    [0.5, es],
    [1, md],
  ])}</linearGradient></defs>`
}

/** Textura escovada (pattern de fios finos), para preencher bandas de metal por cima, com opacidade baixa. */
export function texturaDefs(id: string) {
  return `<pattern id="${id}-esc" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><path d="M0 1h6M0 3.6h6" stroke="#fff" stroke-opacity=".12" stroke-width=".5"/><path d="M0 2.4h6M0 5h6" stroke="#000" stroke-opacity=".14" stroke-width=".5"/></pattern><pattern id="${id}-grao" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="2" r=".45" fill="#fff" fill-opacity=".18"/><circle cx="6" cy="5.5" r=".4" fill="#000" fill-opacity=".25"/><circle cx="4" cy="8" r=".35" fill="#fff" fill-opacity=".12"/><circle cx="8" cy="1" r=".3" fill="#000" fill-opacity=".2"/></pattern>`
}

/* ───────────────────────────────── Gemas lapidadas ─── */

export const GEMAS = {
  ametista: ['#f3eeff', '#c9b9ff', '#9179e0', '#5a44ad', '#2c1f66', '#150e36'],
  rubi: ['#ffe3e7', '#ff8295', '#d4304b', '#94142c', '#560818', '#28030a'],
  safira: ['#e6f0ff', '#93b6ff', '#4a6fd6', '#263f99', '#13205a', '#070c27'],
  esmeralda: ['#e8fff0', '#8fe0ad', '#3ea16a', '#1e6b42', '#0d3a22', '#04170d'],
  perola: ['#ffffff', '#f7f2ec', '#e3dad4', '#c2b7b6', '#9a8f97', '#5d5560'],
  onix: ['#c8c6cf', '#6d6a76', '#3c3a43', '#1f1e24', '#0d0c10', '#000000'],
  vinho: ['#ffd9de', '#e07a8a', '#a8283d', '#6e1022', '#3f0610', '#1a0206'],
} as const
export type Gema = keyof typeof GEMAS

/**
 * Gema lapidada (brilhante/oval/gota/losango): coroa de facetas triangulares em tons alternados, mesa clara,
 * estrela de brilho e cravação de metal (`metalGrad` opcional).
 */
export function gemaLapidada(cx: number, cy: number, w: number, h: number, g: Gema, forma: 'oval' | 'losango' | 'gota' = 'oval', cravacao?: string) {
  const c = GEMAS[g]
  const n = forma === 'losango' ? 4 : 10
  const pt = (i: number, k: number): Pt => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    let rx = (w / 2) * k
    let ry = (h / 2) * k
    if (forma === 'gota') {
      // achata em cima (ponta), arredonda embaixo
      const t = Math.sin(a)
      ry = (h / 2) * k * (t < 0 ? 1.15 : 0.9)
      rx = (w / 2) * k * (t < 0 ? 0.55 + 0.45 * (1 + t) : 1)
    }
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  }
  const P = (p: Pt) => `${n2(p[0])} ${n2(p[1])}`
  let fac = ''
  const tons = [c[1], c[3], c[2], c[4], c[2], c[3]]
  for (let i = 0; i < n; i++) {
    const a = pt(i, 1)
    const b = pt(i + 1, 1)
    const ai = pt(i + 0.5, 0.55)
    fac += `<path d="M${P(a)}L${P(b)}L${P(ai)}Z" fill="${tons[i % tons.length]}"/>`
    const t1 = pt(i, 0.42)
    const t2 = pt(i + 1, 0.42)
    fac += `<path d="M${P(t1)}L${P(ai)}L${P(t2)}Z" fill="${tons[(i + 2) % tons.length]}" opacity=".9"/>`
  }
  let mesa = ''
  for (let i = 0; i <= n; i++) mesa += `${i ? 'L' : 'M'}${P(pt(i, 0.42))}`
  let borda = ''
  for (let i = 0; i <= n; i++) borda += `${i ? 'L' : 'M'}${P(pt(i, 1))}`
  const sw = n2(Math.max(0.35, Math.min(w, h) * 0.06))
  const crav = cravacao
    ? (() => {
        let p = ''
        for (let i = 0; i <= n; i++) p += `${i ? 'L' : 'M'}${P(pt(i, 1.22))}`
        let garras = ''
        for (let i = 0; i < 4; i++) {
          const q = pt((i * n) / 4 + n / 8, 1.12)
          garras += circulo(q[0], q[1], Math.max(0.5, w * 0.07))
        }
        return `<path d="${p}Z" fill="url(#${cravacao})" stroke="${c[5]}" stroke-width="${sw}"/><path d="${garras}" fill="url(#${cravacao})" stroke="#000" stroke-opacity=".5" stroke-width="${n2(+sw * 0.5)}"/>`
      })()
    : ''
  return `${crav}<path d="${borda}Z" fill="${c[3]}" stroke="${c[5]}" stroke-width="${sw}"/>${fac}<path d="${mesa}Z" fill="${c[1]}" opacity=".75"/><path d="${mesa}Z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${n2(+sw * 0.5)}"/><path d="${estrela4(cx - w * 0.16, cy - h * 0.18, Math.min(w, h) * 0.22, 0.14)}" fill="#fff" opacity=".95"/><circle cx="${n2(cx + w * 0.2)}" cy="${n2(cy + h * 0.22)}" r="${n2(Math.min(w, h) * 0.06)}" fill="#fff" opacity=".6"/>`
}

/* ───────────────────────────────── Rosas e folhas ─── */

export const ROSAS = {
  carmim: { base: '#2a0309', meio: '#7a1123', borda: '#c7354d', luz: '#ff9aaa' },
  vinho: { base: '#1a0207', meio: '#4e0a19', borda: '#8f2238', luz: '#d97a8c' },
  negra: { base: '#050405', meio: '#1c1a1f', borda: '#3d3a42', luz: '#8d8a95' },
  marfim: { base: '#6f655c', meio: '#cbbfb0', borda: '#f3ece2', luz: '#ffffff' },
} as const
export type Rosa = keyof typeof ROSAS

export function rosaDefs(id: string, r: Rosa) {
  const c = ROSAS[r]
  return `<radialGradient id="${id}" cx=".5" cy=".9" r="1">${stops([
    [0, c.base],
    [0.45, c.meio],
    [0.85, c.borda],
    [1, c.luz],
  ])}</radialGradient><radialGradient id="${id}-s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c.base}" stop-opacity=".85"/><stop offset=".7" stop-color="${c.base}" stop-opacity=".35"/><stop offset="1" stop-color="${c.base}" stop-opacity="0"/></radialGradient><radialGradient id="${id}-c" cx=".5" cy=".5" r=".6">${stops([
    [0, c.base],
    [0.7, c.meio],
    [1, c.borda],
  ])}</radialGradient>`
}

/** Pétala em concha apontando para cima, base em (0,0), altura h e largura w (coordenadas locais). */
function petala(w: number, h: number) {
  return `M0 0C${n2(-w * 0.55)} ${n2(-h * 0.1)} ${n2(-w * 0.62)} ${n2(-h * 0.78)} ${n2(-w * 0.18)} ${n2(-h)}C${n2(-w * 0.06)} ${n2(-h * 0.9)} ${n2(w * 0.06)} ${n2(-h * 0.9)} ${n2(w * 0.18)} ${n2(-h)}C${n2(w * 0.62)} ${n2(-h * 0.78)} ${n2(w * 0.55)} ${n2(-h * 0.1)} 0 0Z`
}

/**
 * Rosa em volume (vista 3/4): três coroas de pétalas em concha, cada uma com gradiente base escura → borda
 * clara, bordas viradas com fio de luz, e o botão central em espiral. `grad` vem de `rosaDefs`.
 */
export function rosaVolume(grad: string, r: Rosa, cx: number, cy: number, raio: number, rot = 0) {
  const c = ROSAS[r]
  let s = `<g transform="translate(${n2(cx)} ${n2(cy)}) rotate(${rot})">`
  s += `<ellipse cx="${n2(raio * 0.1)}" cy="${n2(raio * 0.18)}" rx="${n2(raio * 0.86)}" ry="${n2(raio * 0.8)}" fill="#000" opacity=".3"/>`
  const coroa = (n: number, dist: number, w: number, h: number, off: number, op = 1) => {
    let t = ''
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + off
      t += `<g transform="rotate(${n2(a)}) translate(0 ${n2(-dist)})"><path d="${petala(w, h)}" fill="url(#${grad})" stroke="${c.base}" stroke-width="${n2(raio * 0.03)}" opacity="${op}" transform="rotate(180)"/><path d="M${n2(-w * 0.16)} ${n2(h * 0.97)}Q0 ${n2(h * 0.84)} ${n2(w * 0.16)} ${n2(h * 0.97)}" fill="none" stroke="${c.luz}" stroke-opacity=".7" stroke-width="${n2(raio * 0.035)}" stroke-linecap="round"/></g>`
    }
    return t
  }
  s += coroa(6, raio * 0.18, raio * 0.95, raio * 0.82, 0)
  s += `<circle r="${n2(raio * 0.62)}" fill="url(#${grad}-s)"/>`
  s += coroa(5, raio * 0.1, raio * 0.72, raio * 0.6, 30)
  s += `<circle r="${n2(raio * 0.42)}" fill="url(#${grad}-s)"/>`
  s += coroa(4, raio * 0.04, raio * 0.52, raio * 0.42, 12)
  s += `<circle r="${n2(raio * 0.3)}" fill="url(#${grad}-c)"/>`
  s += `<path d="${catmull(espiralLocal(raio * 0.26, raio * 0.03, 1.8))}" fill="none" stroke="${c.base}" stroke-width="${n2(raio * 0.06)}" stroke-linecap="round"/>`
  s += `<path d="${catmull(espiralLocal(raio * 0.28, raio * 0.05, 1.5, 25))}" fill="none" stroke="${c.luz}" stroke-opacity=".55" stroke-width="${n2(raio * 0.03)}" stroke-linecap="round"/>`
  return `${s}</g>`
}

function espiralLocal(r0: number, r1: number, voltas: number, a0 = 0): Pt[] {
  const out: Pt[] = []
  const n = Math.round(voltas * 14)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = ((a0 + t * voltas * 360) * Math.PI) / 180
    const r = r0 + (r1 - r0) * t
    out.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return out
}

/** Folha com nervuras, em gradiente (verde escuro acinzentado do DEVO). */
export function folhaVeias(id: string, x: number, y: number, comp: number, larg: number, ang: number) {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number) => `${n2(x + ux * comp * t + nx * larg * s)} ${n2(y + uy * comp * t + ny * larg * s)}`
  let veias = ''
  for (let i = 1; i < 5; i++) {
    const t = i * 0.18
    veias += `M${p(t, 0)}L${p(t + 0.14, 0.42)}M${p(t, 0)}L${p(t + 0.14, -0.42)}`
  }
  return `<path d="M${p(0, 0)}C${p(0.3, 0.75)} ${p(0.75, 0.55)} ${p(1, 0)}C${p(0.75, -0.55)} ${p(0.3, -0.75)} ${p(0, 0)}Z" fill="url(#${id})" stroke="#070806" stroke-width=".7"/><path d="M${p(0, 0)}L${p(0.95, 0)}${veias}" fill="none" stroke="#8d9a83" stroke-opacity=".45" stroke-width=".5"/><path d="M${p(0.15, -0.3)}C${p(0.4, -0.5)} ${p(0.7, -0.4)} ${p(0.9, -0.1)}" fill="none" stroke="#c9d6be" stroke-opacity=".3" stroke-width=".5"/>`
}

export const folhaDefs = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops([
    [0, '#5f6b58'],
    [0.5, '#2f382c'],
    [1, '#121610'],
  ])}</linearGradient>`

/* ───────────────────────────────── Laços e fitas ─── */

/** Céu estrelado (fita de veludo noturno, ref-04): gradiente + pattern de estrelas. */
export function ceuDefs(id: string) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops([
    [0, '#3b3466'],
    [0.35, '#221d44'],
    [0.7, '#141128'],
    [1, '#2d2350'],
  ])}</linearGradient><pattern id="${id}-est" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".55" fill="#fff"/><circle cx="9" cy="7" r=".35" fill="#e9e4ff"/><circle cx="5" cy="11" r=".4" fill="#fff" opacity=".8"/><circle cx="12" cy="1.5" r=".3" fill="#d9cfff"/><path d="M11 11.5l.35 1 .95.35-.95.35-.35 1-.35-1-.95-.35.95-.35Z" fill="#fff8e6"/></pattern><linearGradient id="${id}-dobra" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, 'rgba(255,255,255,.28)'],
    [0.4, 'rgba(255,255,255,0)'],
    [1, 'rgba(0,0,0,.45)'],
  ])}</linearGradient>`
}

/** Laço de fita com duas alças, nó e duas pontas; `fundo` = gradiente; `estrelas` = id do pattern (opcional). */
export function laco(cx: number, cy: number, s: number, fundo: string, borda: string, estrelas?: string, dobra?: string, rot = 0) {
  const P = (x: number, y: number) => `${n2(x * s)} ${n2(y * s)}`
  const alcaE = `M0 0C${P(-6, -12)} ${P(-26, -18)} ${P(-30, -6)}C${P(-33, 4)} ${P(-18, 10)} ${P(0, 2)}Z`
  const alcaD = `M0 0C${P(6, -12)} ${P(26, -18)} ${P(30, -6)}C${P(33, 4)} ${P(18, 10)} ${P(0, 2)}Z`
  const pontaE = `M${P(-2, 3)}C${P(-8, 14)} ${P(-14, 24)} ${P(-20, 34)}L${P(-12, 32)}L${P(-10, 38)}C${P(-5, 26)} ${P(-1, 14)} ${P(2, 4)}Z`
  const pontaD = `M${P(2, 3)}C${P(10, 12)} ${P(18, 20)} ${P(26, 28)}L${P(18, 29)}L${P(18, 35)}C${P(10, 24)} ${P(4, 14)} ${P(-1, 4)}Z`
  const no = `M${P(-5, -5)}C${P(-2, -7)} ${P(2, -7)} ${P(5, -5)}C${P(6, -1)} ${P(6, 3)} ${P(4, 6)}C${P(1, 7)} ${P(-1, 7)} ${P(-4, 6)}C${P(-6, 3)} ${P(-6, -1)} ${P(-5, -5)}Z`
  const camada = (d: string) =>
    `<path d="${d}" fill="url(#${fundo})" stroke="${borda}" stroke-width="${n2(0.8 * s)}"/>${estrelas ? `<path d="${d}" fill="url(#${estrelas})"/>` : ''}${dobra ? `<path d="${d}" fill="url(#${dobra})"/>` : ''}`
  const sombra = (d: string) => `<path d="${d}" fill="#000" opacity=".4" transform="translate(${n2(1.4 * s)} ${n2(2 * s)})"/>`
  return `<g transform="translate(${n2(cx)} ${n2(cy)}) rotate(${rot})">${sombra(pontaE)}${sombra(pontaD)}${sombra(alcaE)}${sombra(alcaD)}${camada(pontaE)}${camada(pontaD)}${camada(alcaE)}${camada(alcaD)}<path d="M${P(-24, -7)}C${P(-16, -6)} ${P(-8, -3)} ${P(-3, 0)}M${P(24, -7)}C${P(16, -6)} ${P(8, -3)} ${P(3, 0)}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${n2(0.8 * s)}"/>${camada(no)}<path d="M${P(-3, -4)}Q${P(0, -5.5)} ${P(3, -4)}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="${n2(0.6 * s)}"/></g>`
}

/* ───────────────────────────────── Cartas ─── */

/** Carta de tarô em miniatura (sol, lua ou estrela), marfim com moldura negra e numeral. */
export function cartaTaro(x: number, y: number, w: number, h: number, rot: number, motivo: 'sol' | 'lua' | 'estrela' | 'torre', numeral: string, ouro: string) {
  const cx = x + w / 2
  const cy = y + h * 0.46
  const r = w * 0.24
  let arte = ''
  if (motivo === 'sol') {
    let raios = ''
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      raios += `M${n2(cx + Math.cos(a) * r * 1.15)} ${n2(cy + Math.sin(a) * r * 1.15)}L${n2(cx + Math.cos(a + 0.13) * r * 1.7)} ${n2(cy + Math.sin(a + 0.13) * r * 1.7)}L${n2(cx + Math.cos(a + 0.26) * r * 1.15)} ${n2(cy + Math.sin(a + 0.26) * r * 1.15)}`
    }
    arte = `<path d="${raios}" fill="#1a1716"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="#f6efe0" stroke="#1a1716" stroke-width="${n2(w * 0.03)}"/><path d="M${n2(cx - r * 0.45)} ${n2(cy - r * 0.15)}h${n2(r * 0.25)}M${n2(cx + r * 0.2)} ${n2(cy - r * 0.15)}h${n2(r * 0.25)}M${n2(cx - r * 0.35)} ${n2(cy + r * 0.35)}q${n2(r * 0.35)} ${n2(r * 0.25)} ${n2(r * 0.7)} 0" fill="none" stroke="#1a1716" stroke-width="${n2(w * 0.025)}"/>`
  } else if (motivo === 'lua') {
    arte = `<path d="M${n2(cx + r * 0.2)} ${n2(cy - r * 1.2)}A${n2(r * 1.2)} ${n2(r * 1.2)} 0 1 0 ${n2(cx + r * 0.9)} ${n2(cy + r * 0.85)}A${n2(r)} ${n2(r)} 0 1 1 ${n2(cx + r * 0.2)} ${n2(cy - r * 1.2)}Z" fill="#f6efe0" stroke="#1a1716" stroke-width="${n2(w * 0.03)}"/><path d="${estrela4(cx + r * 1.1, cy - r * 0.9, r * 0.35)}" fill="#f6efe0"/>`
  } else if (motivo === 'estrela') {
    arte = `<path d="${estrela4(cx, cy, r * 1.5, 0.16)}" fill="#f6efe0" stroke="#1a1716" stroke-width="${n2(w * 0.03)}"/><path d="${estrela4(cx - r * 1.3, cy - r * 1.1, r * 0.35)}${estrela4(cx + r * 1.2, cy + r * 1.2, r * 0.3)}" fill="#f6efe0"/>`
  } else {
    arte = `<path d="M${n2(cx - r * 0.6)} ${n2(cy + r * 1.4)}V${n2(cy - r * 0.6)}L${n2(cx)} ${n2(cy - r * 1.4)}L${n2(cx + r * 0.6)} ${n2(cy - r * 0.6)}V${n2(cy + r * 1.4)}Z" fill="#f6efe0" stroke="#1a1716" stroke-width="${n2(w * 0.03)}"/><path d="M${n2(cx - r * 0.2)} ${n2(cy)}h${n2(r * 0.4)}" stroke="#1a1716" stroke-width="${n2(w * 0.04)}"/><path d="M${n2(cx + r * 0.8)} ${n2(cy - r * 1.6)}l${n2(-r * 0.5)} ${n2(r * 0.7)} ${n2(r * 0.3)} 0 ${n2(-r * 0.5)} ${n2(r * 0.8)}" fill="none" stroke="#f6efe0" stroke-width="${n2(w * 0.035)}"/>`
  }
  return `<g transform="rotate(${rot} ${n2(cx)} ${n2(y + h / 2)})"><rect x="${n2(x + 1.2)}" y="${n2(y + 2)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(w * 0.06)}" fill="#000" opacity=".45"/><rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(w * 0.06)}" fill="#f4ecdc" stroke="#141110" stroke-width="${n2(w * 0.035)}"/><rect x="${n2(x + w * 0.08)}" y="${n2(y + w * 0.08)}" width="${n2(w * 0.84)}" height="${n2(h - w * 0.16)}" fill="#1c1917"/><rect x="${n2(x + w * 0.13)}" y="${n2(y + w * 0.13)}" width="${n2(w * 0.74)}" height="${n2(h - w * 0.26)}" fill="none" stroke="url(#${ouro})" stroke-width="${n2(w * 0.025)}"/>${arte}<text x="${n2(cx)}" y="${n2(y + h * 0.12 + w * 0.06)}" font-size="${n2(w * 0.13)}" fill="#e8dcc0" text-anchor="middle" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">${numeral}</text><rect x="${n2(x + w * 0.13)}" y="${n2(y + h * 0.8)}" width="${n2(w * 0.74)}" height="${n2(h * 0.09)}" fill="#f4ecdc"/><text x="${n2(cx)}" y="${n2(y + h * 0.865)}" font-size="${n2(w * 0.1)}" fill="#141110" text-anchor="middle" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700;letter-spacing:.05em">${motivo === 'sol' ? 'SOL' : motivo === 'lua' ? 'LUA' : motivo === 'estrela' ? 'ESTRELA' : 'TORRE'}</text></g>`
}

/** Fio de pérolas/contas em catenária (para correntes de joia). */
export function contas(a: Pt, b: Pt, queda: number, n: number, r: number, grad: string, borda: string) {
  let s = ''
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * queda
    s += `<circle cx="${n2(x + r * 0.25)}" cy="${n2(y + r * 0.35)}" r="${n2(r)}" fill="#000" opacity=".4"/><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="url(#${grad})" stroke="${borda}" stroke-width="${n2(r * 0.16)}"/><circle cx="${n2(x - r * 0.3)}" cy="${n2(y - r * 0.32)}" r="${n2(r * 0.28)}" fill="#fff" opacity=".85"/>`
  }
  return s
}
