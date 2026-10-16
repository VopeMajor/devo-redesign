/**
 * Ferramentas de desenho da coleção de cosméticos (SVG procedural, sem imagens externas).
 * Tudo aqui é PURO (string → string): a arte é montada como marcação SVG com ids prefixados por instância
 * (`u`), para várias molduras na mesma tela não trocarem gradientes entre si.
 *
 * Animações: só classes `cos-a-*` (definidas em ../cosmeticos.css), ativas apenas dentro de `.cos-anim`
 * — o componente liga/desliga conforme Ajustes e `prefers-reduced-motion`.
 */

export type Pt = [number, number]

export const n2 = (v: number) => Math.round(v * 100) / 100
const P = (p: Pt) => `${n2(p[0])} ${n2(p[1])}`

/** Paletas de metal: claro → escuro, com reflexo no fim (lê como bisel quando o gradiente é vertical). */
export const METAL = {
  prata: ['#ffffff', '#e4e2de', '#a9a6a0', '#5f5c58', '#d6d4cf'],
  champanhe: ['#fbf6ea', '#ddd1b8', '#a99b81', '#5f584d', '#cdbfa5'],
  ouro: ['#f6e7b9', '#d7b56c', '#9b7838', '#4f3a17', '#c9a45a'],
  ferro: ['#8a8790', '#4b4950', '#25242a', '#0e0d11', '#5a5760'],
  bronze: ['#ead2a6', '#bf9a63', '#7f603a', '#3e2d18', '#ad8b5c'],
  lua: ['#ffffff', '#e9edf3', '#b4bccb', '#666d7c', '#dfe4ec'],
} as const
export type MetalNome = keyof typeof METAL

export const GEMA = {
  ametista: ['#efe9ff', '#b5a5ee', '#6b58b8', '#2b2163'],
  rubi: ['#ffd3d8', '#d04459', '#7c1325', '#33060e'],
  perola: ['#ffffff', '#f2eee8', '#cfc8c4', '#8f8791'],
  noite: ['#c9d4ff', '#5d6aa8', '#232a52', '#0c0f22'],
  onix: ['#9a98a3', '#3b3a42', '#16151a', '#050407'],
  esmeralda: ['#d7f2df', '#5f9c74', '#24533a', '#0b2216'],
} as const
export type GemaNome = keyof typeof GEMA

/** Gradiente linear (0..1 em bounding box). */
export function lin(id: string, cores: readonly string[], x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const stops = cores.map((c, i) => `<stop offset="${n2(i / Math.max(1, cores.length - 1))}" stop-color="${c}"/>`).join('')
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`
}

export function rad(id: string, cores: readonly string[], cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy) {
  const stops = cores.map((c, i) => `<stop offset="${n2(i / Math.max(1, cores.length - 1))}" stop-color="${c}"/>`).join('')
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stops}</radialGradient>`
}

/** Gradiente de metal (vertical por padrão, diagonal com `diag`). */
export function metal(id: string, nome: MetalNome, diag = false) {
  // bisel com reflexo forte em cima, faixa escura no meio e luz rebatida embaixo (rodada 2 de acabamento)
  const [c0, c1, c2, c3, c4] = METAL[nome]
  const pares: [number, string][] = [[0, c1], [0.18, c0], [0.36, c1], [0.5, c2], [0.6, c3], [0.78, c2], [0.92, c4], [1, c2]]
  const st = pares.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')
  return diag ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${st}</linearGradient>` : `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${st}</linearGradient>`
}

/** Gradiente de gema (brilho no alto à esquerda). */
export function gemaGrad(id: string, nome: GemaNome) {
  return rad(id, GEMA[nome], 0.38, 0.32, 0.75, 0.3, 0.25)
}

/** Curva suave (Catmull-Rom → cúbicas) por pontos. */
export function catmull(pts: Pt[], fechado = false): string {
  if (pts.length < 2) return ''
  const p = fechado ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]]
  let d = `M${P(p[1])}`
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`
  }
  return fechado ? `${d}Z` : d
}

/** Espiral (voluta de filigrana): do raio r0 ao r1 em `voltas`, começando no ângulo a0 (graus). */
export function espiral(cx: number, cy: number, r0: number, r1: number, voltas: number, a0 = 0, sentido = 1, passos = 18): Pt[] {
  const out: Pt[] = []
  const n = Math.max(4, Math.round(passos * voltas))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = ((a0 + sentido * t * voltas * 360) * Math.PI) / 180
    const r = r0 + (r1 - r0) * t
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return out
}

/** Folha/acanto: base em (x,y), comprimento e largura, ângulo em graus, `curva` dobra a ponta. */
export function folha(x: number, y: number, comp: number, larg: number, ang: number, curva = 0): string {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const tip: Pt = [x + ux * comp + nx * curva, y + uy * comp + ny * curva]
  const m1: Pt = [x + ux * comp * 0.45 + nx * larg, y + uy * comp * 0.45 + ny * larg]
  const m2: Pt = [x + ux * comp * 0.5 - nx * larg * 0.8, y + uy * comp * 0.5 - ny * larg * 0.8]
  return `M${P([x, y])}Q${P(m1)} ${P(tip)}Q${P(m2)} ${P([x, y])}Z`
}

/** Estrela de 4 pontas (sigilo do DEVO). */
export function estrela4(cx: number, cy: number, r: number, cintura = 0.22): string {
  const k = r * cintura
  return `M${n2(cx)} ${n2(cy - r)}Q${n2(cx + k)} ${n2(cy - k)} ${n2(cx + r)} ${n2(cy)}Q${n2(cx + k)} ${n2(cy + k)} ${n2(cx)} ${n2(cy + r)}Q${n2(cx - k)} ${n2(cy + k)} ${n2(cx - r)} ${n2(cy)}Q${n2(cx - k)} ${n2(cy - k)} ${n2(cx)} ${n2(cy - r)}Z`
}

/** Losango. */
export function losango(cx: number, cy: number, w: number, h: number): string {
  return `M${n2(cx)} ${n2(cy - h / 2)}L${n2(cx + w / 2)} ${n2(cy)}L${n2(cx)} ${n2(cy + h / 2)}L${n2(cx - w / 2)} ${n2(cy)}Z`
}

/** Engrenagem com furo central (use fill-rule="evenodd"). */
export function engrenagem(cx: number, cy: number, rExt: number, rInt: number, dentes: number, furo: number, raios = 0): string {
  let d = ''
  const passo = (Math.PI * 2) / dentes
  for (let i = 0; i < dentes; i++) {
    const a = i * passo
    const pts: Pt[] = [
      [cx + Math.cos(a - passo * 0.32) * rInt, cy + Math.sin(a - passo * 0.32) * rInt],
      [cx + Math.cos(a - passo * 0.18) * rExt, cy + Math.sin(a - passo * 0.18) * rExt],
      [cx + Math.cos(a + passo * 0.18) * rExt, cy + Math.sin(a + passo * 0.18) * rExt],
      [cx + Math.cos(a + passo * 0.32) * rInt, cy + Math.sin(a + passo * 0.32) * rInt],
    ]
    d += `${i === 0 ? 'M' : 'L'}${P(pts[0])}L${P(pts[1])}L${P(pts[2])}L${P(pts[3])}`
    const prox = a + passo - passo * 0.32
    d += `A${n2(rInt)} ${n2(rInt)} 0 0 1 ${P([cx + Math.cos(prox) * rInt, cy + Math.sin(prox) * rInt])}`
  }
  d += 'Z'
  d += circulo(cx, cy, furo)
  // janelas entre raios
  if (raios > 0) {
    const r1 = furo + (rInt - furo) * 0.22
    const r2 = rInt * 0.78
    for (let i = 0; i < raios; i++) {
      const a0 = (i / raios) * Math.PI * 2 + 0.22
      const a1 = ((i + 1) / raios) * Math.PI * 2 - 0.22
      d += `M${P([cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1])}L${P([cx + Math.cos(a0) * r2, cy + Math.sin(a0) * r2])}A${n2(r2)} ${n2(r2)} 0 0 1 ${P([cx + Math.cos(a1) * r2, cy + Math.sin(a1) * r2])}L${P([cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1])}A${n2(r1)} ${n2(r1)} 0 0 0 ${P([cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1])}Z`
    }
  }
  return d
}

export function circulo(cx: number, cy: number, r: number): string {
  return `M${n2(cx - r)} ${n2(cy)}a${n2(r)} ${n2(r)} 0 1 0 ${n2(r * 2)} 0a${n2(r)} ${n2(r)} 0 1 0 ${n2(-r * 2)} 0Z`
}

/** Pérola: esfera com reflexo (gradiente `${u}-perola` precisa estar nas defs). */
export function perola(u: string, cx: number, cy: number, r: number, contorno = '#2a2522'): string {
  return `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="url(#${u}-perola)" stroke="${contorno}" stroke-width="${n2(Math.max(0.35, r * 0.18))}"/><circle cx="${n2(cx - r * 0.32)}" cy="${n2(cy - r * 0.34)}" r="${n2(r * 0.28)}" fill="#fff" opacity=".9"/>`
}

/** Gema lapidada: losango/gota/oval com facetas. `grad` = id do gradiente. */
export function gema(cx: number, cy: number, w: number, h: number, grad: string, forma: 'losango' | 'oval' | 'gota' = 'losango', contorno = '#16131a'): string {
  const sw = n2(Math.max(0.4, Math.min(w, h) * 0.08))
  if (forma === 'oval') {
    return `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(w / 2)}" ry="${n2(h / 2)}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${sw}"/><path d="M${n2(cx - w * 0.3)} ${n2(cy)}L${n2(cx)} ${n2(cy - h * 0.3)}L${n2(cx + w * 0.3)} ${n2(cy)}L${n2(cx)} ${n2(cy + h * 0.3)}Z" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${n2(sw * 0.6)}"/><ellipse cx="${n2(cx - w * 0.15)}" cy="${n2(cy - h * 0.2)}" rx="${n2(w * 0.12)}" ry="${n2(h * 0.08)}" fill="#fff" opacity=".7"/>`
  }
  if (forma === 'gota') {
    const d = `M${n2(cx)} ${n2(cy - h / 2)}C${n2(cx + w * 0.2)} ${n2(cy - h * 0.15)} ${n2(cx + w / 2)} ${n2(cy + h * 0.05)} ${n2(cx + w / 2)} ${n2(cy + h * 0.2)}A${n2(w / 2)} ${n2(w / 2)} 0 0 1 ${n2(cx - w / 2)} ${n2(cy + h * 0.2)}C${n2(cx - w / 2)} ${n2(cy + h * 0.05)} ${n2(cx - w * 0.2)} ${n2(cy - h * 0.15)} ${n2(cx)} ${n2(cy - h / 2)}Z`
    return `<path d="${d}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${sw}"/><path d="M${n2(cx - w * 0.18)} ${n2(cy + h * 0.05)}q${n2(w * 0.05)} ${n2(-h * 0.2)} ${n2(w * 0.16)} ${n2(-h * 0.3)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${n2(sw * 0.9)}" stroke-linecap="round"/>`
  }
  return `<path d="${losango(cx, cy, w, h)}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${sw}"/><path d="M${n2(cx - w / 2)} ${n2(cy)}L${n2(cx + w / 2)} ${n2(cy)}M${n2(cx)} ${n2(cy - h / 2)}L${n2(cx - w * 0.18)} ${n2(cy)}L${n2(cx)} ${n2(cy + h / 2)}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="${n2(sw * 0.55)}"/><path d="M${n2(cx - w * 0.08)} ${n2(cy - h * 0.3)}L${n2(cx - w * 0.22)} ${n2(cy - h * 0.06)}" stroke="#fff" stroke-opacity=".85" stroke-width="${n2(sw * 0.9)}" stroke-linecap="round"/>`
}

/** Traço de metal com contorno escuro e filete de luz (lê como fio de metal fundido). */
export function fio(d: string, grad: string, largura: number, contorno = '#17130f', luz = true): string {
  return `<path d="${d}" fill="none" stroke="${contorno}" stroke-width="${n2(largura + 1.4)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#${grad})" stroke-width="${n2(largura)}" stroke-linecap="round" stroke-linejoin="round"/>${
    luz ? `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="${n2(Math.max(0.3, largura * 0.22))}" stroke-linecap="round" transform="translate(-${n2(largura * 0.18)} -${n2(largura * 0.22)})"/>` : ''
  }`
}

/** Peça cheia de metal com contorno. */
export function peca(d: string, grad: string, contorno = '#17130f', sw = 1, extra = ''): string {
  return `<path d="${d}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${n2(sw)}" stroke-linejoin="round"${extra}/>`
}

/** Moldura retangular de bandas (bisel): retângulo externo e interno com espessura `e`. */
export function banda(x: number, y: number, w: number, h: number, e: number, grad: string, contorno = '#15120f', sw = 1, raio = 0): string {
  const r = raio
  const fora = r
    ? `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
    : `M${x} ${y}H${x + w}V${y + h}H${x}Z`
  const ri = Math.max(0, r - e)
  const xi = x + e
  const yi = y + e
  const wi = w - 2 * e
  const hi = h - 2 * e
  const dentro = ri
    ? `M${xi + ri} ${yi}Q${xi} ${yi} ${xi} ${yi + ri}V${yi + hi - ri}Q${xi} ${yi + hi} ${xi + ri} ${yi + hi}H${xi + wi - ri}Q${xi + wi} ${yi + hi} ${xi + wi} ${yi + hi - ri}V${yi + ri}Q${xi + wi} ${yi} ${xi + wi - ri} ${yi}Z`
    : `M${xi} ${yi}V${yi + hi}H${xi + wi}V${yi}Z`
  return `<path d="${fora}${dentro}" fill="url(#${grad})" fill-rule="evenodd" stroke="${contorno}" stroke-width="${n2(sw)}"/>`
}

/** Espelha horizontalmente um trecho dentro de uma caixa de largura `w`. */
export const espelhoX = (w: number, conteudo: string) => `<g transform="matrix(-1 0 0 1 ${w} 0)">${conteudo}</g>`
export const espelhoY = (h: number, conteudo: string) => `<g transform="matrix(1 0 0 -1 0 ${h})">${conteudo}</g>`
export const g = (attrs: string, conteudo: string) => `<g ${attrs}>${conteudo}</g>`

/** Naipes (para cartas e fichas). Caixa ~1×1 centrada em (cx,cy) escalada por s. */
export function naipe(tipo: 'espadas' | 'copas' | 'ouros' | 'paus', cx: number, cy: number, s: number): string {
  const t = (x: number, y: number) => `${n2(cx + x * s)} ${n2(cy + y * s)}`
  switch (tipo) {
    case 'copas':
      return `M${t(0, 0.42)}C${t(-0.55, 0.02)} ${t(-0.52, -0.45)} ${t(-0.25, -0.45)}C${t(-0.08, -0.45)} ${t(0, -0.32)} ${t(0, -0.22)}C${t(0, -0.32)} ${t(0.08, -0.45)} ${t(0.25, -0.45)}C${t(0.52, -0.45)} ${t(0.55, 0.02)} ${t(0, 0.42)}Z`
    case 'espadas':
      return `M${t(0, -0.5)}C${t(-0.15, -0.25)} ${t(-0.5, -0.08)} ${t(-0.48, 0.14)}C${t(-0.46, 0.34)} ${t(-0.2, 0.36)} ${t(-0.05, 0.2)}L${t(-0.14, 0.48)}L${t(0.14, 0.48)}L${t(0.05, 0.2)}C${t(0.2, 0.36)} ${t(0.46, 0.34)} ${t(0.48, 0.14)}C${t(0.5, -0.08)} ${t(0.15, -0.25)} ${t(0, -0.5)}Z`
    case 'ouros':
      return `M${t(0, -0.5)}Q${t(0.12, -0.12)} ${t(0.38, 0)}Q${t(0.12, 0.12)} ${t(0, 0.5)}Q${t(-0.12, 0.12)} ${t(-0.38, 0)}Q${t(-0.12, -0.12)} ${t(0, -0.5)}Z`
    case 'paus':
      return `${circulo(cx, cy - 0.22 * s, 0.2 * s)}${circulo(cx - 0.24 * s, cy + 0.06 * s, 0.2 * s)}${circulo(cx + 0.24 * s, cy + 0.06 * s, 0.2 * s)}M${t(-0.05, 0.05)}L${t(-0.14, 0.48)}L${t(0.14, 0.48)}L${t(0.05, 0.05)}Z`
  }
}

/** Arte: viewBox + corpo (marcação interna, recebe o prefixo de ids). */
export type Arte = { vb: string; corpo: (u: string) => string }

/** Amostra a curva Catmull-Rom que passa pelos pontos (densidade `porSeg` por segmento). */
export function amostrar(pts: Pt[], porSeg = 8): Pt[] {
  if (pts.length < 3) return pts
  const p = [pts[0], ...pts, pts[pts.length - 1]]
  const out: Pt[] = []
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]]
    for (let k = 0; k < porSeg; k++) {
      const t = k / porSeg
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/**
 * Faixa afunilada ao longo de uma curva (voluta "caligráfica" cheia, como metal fundido): largura w0 no
 * começo e w1 no fim. Devolve um `d` fechado.
 */
export function afunilada(pts: Pt[], w0: number, w1: number, porSeg = 6): string {
  const s = amostrar(pts, porSeg)
  const L: Pt[] = []
  const R: Pt[] = []
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)]
    const b = s[Math.min(s.length - 1, i + 1)]
    let dx = b[0] - a[0]
    let dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    const t = i / (s.length - 1)
    // engrossa no meio do caminho (barriga da voluta) e afina nas pontas
    const w = (w0 + (w1 - w0) * t) * (0.75 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.2))) * 0.5
    L.push([s[i][0] - dy * w, s[i][1] + dx * w])
    R.push([s[i][0] + dy * w, s[i][1] - dx * w])
  }
  const pts2 = [...L, ...R.reverse()]
  return `M${pts2.map((p) => `${n2(p[0])} ${n2(p[1])}`).join('L')}Z`
}

/** Voluta cheia: entrada + espiral, afunilando até a ponta enrolada. */
export function volutaCheia(entrada: Pt[], cx: number, cy: number, r0: number, r1: number, voltas: number, a0: number, sentido: number, w0: number, w1: number): string {
  return afunilada([...entrada, ...espiral(cx, cy, r0, r1, voltas, a0, sentido, 10)], w0, w1)
}

/** Botão/roseta: círculo de metal com anel de contas. */
export function roseta(grad: string, cx: number, cy: number, r: number, contorno = '#17130f'): string {
  let contas = ''
  const n = Math.max(6, Math.round(r * 1.6))
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    contas += circulo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.17)
  }
  return `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${n2(r * 0.1)}"/><path d="${contas}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${n2(r * 0.05)}"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r * 0.45)}" fill="url(#${grad})" stroke="${contorno}" stroke-width="${n2(r * 0.08)}"/>`
}

/** Acanto: folha recortada em 3 lóbulos (base em x,y, apontando para `ang`). */
export function acanto(x: number, y: number, comp: number, larg: number, ang: number, dobra = 0.4): string {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number): Pt => [x + ux * comp * t + nx * larg * s, y + uy * comp * t + ny * larg * s]
  const pts: Pt[] = [p(0, 0), p(0.2, 0.55), p(0.32, 0.38), p(0.48, 0.7), p(0.6, 0.42), p(0.78, 0.55), p(1, dobra), p(0.8, 0.05), p(0.62, -0.25), p(0.44, -0.12), p(0.3, -0.38), p(0.14, -0.2)]
  return catmull(pts, true)
}
