import type { Aparencia } from '@/lib/devo/casa-aparencia'

/**
 * Aparência do avatar (kit3/avatar-cor.js, aprovado): as peças são cinza e a cor vem destas amostras, sempre de
 * catálogo. Usado na criação/guarda-roupa (busto) e na Casa (chibi fofo em peças), para os dois saírem iguais.
 */
type Rgb = [number, number, number]
export const CAB: [string, Rgb, Rgb, Rgb][] = [
  ['Preto', [26, 24, 28], [52, 48, 54], [110, 104, 112]], ['Noite', [24, 22, 40], [58, 52, 92], [120, 112, 170]], ['Castanho escuro', [42, 26, 20], [78, 50, 36], [136, 98, 72]],
  ['Castanho', [70, 44, 28], [120, 80, 50], [186, 142, 96]], ['Mel', [120, 76, 30], [176, 120, 56], [226, 180, 110]], ['Loiro', [150, 96, 30], [214, 160, 60], [246, 214, 130]],
  ['Platinado', [166, 150, 135], [232, 220, 200], [250, 244, 232]], ['Cinza', [92, 90, 98], [150, 148, 156], [214, 212, 218]], ['Branco', [170, 172, 186], [226, 228, 236], [252, 252, 254]],
  ['Ruivo', [110, 44, 20], [176, 80, 36], [232, 140, 84]], ['Vinho', [64, 16, 34], [112, 28, 56], [180, 70, 100]], ['Rubi', [110, 28, 44], [176, 50, 66], [236, 120, 120]],
  ['Rosa', [170, 84, 120], [226, 132, 166], [250, 196, 214]], ['Violeta', [70, 40, 110], [130, 90, 190], [200, 170, 240]], ['Cobalto', [24, 40, 120], [50, 84, 200], [130, 160, 244]],
  ['Céu', [40, 70, 110], [90, 140, 190], [180, 220, 240]], ['Verdete', [20, 76, 80], [44, 136, 134], [140, 212, 200]], ['Musgo', [44, 60, 30], [86, 110, 56], [160, 180, 110]],
]
export const OLHOS: [string, Rgb, Rgb][] = [
  ['Violeta', [90, 62, 170], [160, 130, 225]], ['Âmbar', [120, 70, 16], [214, 150, 50]], ['Castanho', [58, 36, 22], [120, 80, 50]], ['Preto', [20, 18, 24], [64, 60, 70]],
  ['Mel', [80, 60, 30], [190, 150, 80]], ['Verde', [50, 90, 50], [130, 190, 110]], ['Azul-petróleo', [20, 90, 110], [70, 190, 200]], ['Azul', [30, 60, 130], [90, 140, 230]],
  ['Cinza', [70, 76, 88], [150, 158, 172]], ['Vermelho', [120, 40, 40], [220, 100, 90]], ['Rosa', [150, 60, 110], [234, 130, 180]], ['Branco', [150, 150, 160], [226, 226, 232]],
]
export const PELES: [string, Rgb, Rgb][] = [
  ['Pele 1', [250, 226, 214], [228, 196, 186]], ['Pele 2', [248, 217, 195], [226, 184, 162]], ['Pele 3', [240, 204, 170], [212, 166, 132]], ['Pele 4', [226, 180, 140], [194, 144, 106]], ['Pele 5', [196, 142, 104], [160, 106, 76]],
  ['Pele 6', [168, 116, 82], [134, 88, 60]], ['Pele 7', [140, 92, 64], [106, 66, 46]], ['Pele 8', [112, 72, 50], [84, 52, 38]], ['Pele 9', [92, 60, 44], [66, 42, 32]], ['Pele 10', [66, 44, 36], [46, 30, 26]],
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const sat = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
type Px = Uint8ClampedArray

/* ---- opções novas (dono, 09/11: "deixe o avatar mais bonito e adicione mais opções de customização") ---- */
function rgbHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l]
  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
function hslRgb(h: number, s: number, l: number): [number, number, number] {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
  }
  return [f(h / 360 + 1 / 3) * 255, f(h / 360) * 255, f(h / 360 - 1 / 3) * 255]
}
/** Variações de cor das roupas (CORES_ROUPA): matiz novo; Grafite e Preto tiram a cor; Areia clareia. */
const ALVOS_ROUPA: ({ h: number; s?: number; l?: number; claro?: number } | null)[] = [
  null,
  { h: 348 },
  { h: 224 },
  { h: 95, s: 0.32 },
  { h: 290 },
  { h: 250, s: 0.06, l: 0.8, claro: 0.14 },
  { h: 28, s: 0.22, l: 1, claro: 0.3 },
  { h: 270, s: 0.06, l: 0.62 },
]
/** Amostra de cada cor de roupa, para os botões da criação. */
export const AMOSTRA_ROUPA = ALVOS_ROUPA.map((a) => (a ? hslRgb(a.h, a.s ?? 0.5, (a.claro ?? 0) + 0.36 * (a.l ?? 1)) : null))
const suave = (a: number, b: number, x: number) => {
  const t = sat((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const difMatiz = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}
/**
 * Cor da roupa (crítico de arte, 09/11): só o TECIDO PRINCIPAL muda. O matiz principal da roupa é o pico do histograma
 * dos pixels bem coloridos; pintam-se só os pixels perto desse matiz (até 30°, sumindo até 45°), com mistura gradual
 * pela saturação e pela luz (sem manchas). Couro, renda, camisa clara, dourado, pele e íris ficam. Se a cor pedida já
 * é a da roupa (menos de 25°), entra o verdete, para o botão sempre mudar algo.
 */
export function pintaRoupa(d: Px, indice: number, mascara?: Px) {
  const a0 = ALVOS_ROUPA[indice]
  if (!a0) return
  const hist = new Float32Array(36)
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3] || (mascara && (mascara[i] > 0 || mascara[i + 1] > 0))) continue
    const [h, s, l] = rgbHsl(d[i], d[i + 1], d[i + 2])
    if (s > 0.3 && l > 0.08 && l < 0.7) hist[Math.floor(h / 10) % 36] += s
  }
  let pico = 0
  for (let k = 1; k < 36; k++) if (hist[k] + hist[(k + 35) % 36] + hist[(k + 1) % 36] > hist[pico] + hist[(pico + 35) % 36] + hist[(pico + 1) % 36]) pico = k
  const principal = pico * 10 + 5
  const a = a0.s == null && difMatiz(a0.h, principal) < 25 ? { ...a0, h: 175 } : a0
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue
    if (mascara && (mascara[i] > 0 || mascara[i + 1] > 0)) continue
    const [h, s, l] = rgbHsl(d[i], d[i + 1], d[i + 2])
    if (l > 0.6 && s < 0.35) continue // renda, camisa e outros tecidos claros
    if (h >= 34 && h <= 62 && s > 0.4 && l > 0.42) continue // dourado dos detalhes
    const w = suave(0.1, 0.28, s) * suave(0.04, 0.12, l) * (1 - suave(30, 45, difMatiz(h, principal)))
    if (w <= 0) continue
    const nl = Math.min(0.92, l * (a.l ?? 1) + (a.claro ?? 0) * sat((l - 0.15) / 0.3))
    const c = hslRgb(a.h, a.s ?? Math.min(0.75, s), nl)
    for (let k = 0; k < 3; k++) d[i + k] = d[i + k] * (1 - w) + c[k] * w
  }
}
/**
 * Pontas do cabelo de outra cor (crítico de arte, 09/11): medidas por COLUNA, na última mecha de cada coluna, então a
 * cor segue a ponta de cada mecha (e não uma faixa reta). Só mechas que descem abaixo de 45% da altura da célula têm
 * ponta colorida; a ponta é o último terço da mecha (no mínimo "minimo" px), com transição de "fade" da mecha.
 */
export function pesoPontas(d: Px, w: number, cel = w, minimo = 4, fade = 0.35, limiar = 0.45): Float32Array {
  const h = d.length / 4 / w
  const out = new Float32Array(w * h)
  const opaco = (x: number, y: number) => d[(y * w + x) * 4 + 3] > 24
  for (let c0 = 0; c0 < w; c0 += cel) {
    for (let x = c0; x < Math.min(w, c0 + cel); x++) {
      // do topo do cabelo na coluna para baixo, até o primeiro vão grande (vãos pequenos entre mechas não cortam;
      // pixels soltos lá embaixo não contam)
      let ya = 0
      while (ya < h && !opaco(x, ya)) ya++
      if (ya >= h) continue
      const vao = Math.max(3, Math.round(h / 40))
      let yb = ya
      let y = ya
      while (y < h) {
        if (opaco(x, y)) {
          yb = y
          y++
        } else if (y - yb > vao) break
        else y++
      }
      if (yb < h * limiar) continue
      const len = yb - ya + 1
      const ponta = Math.max(minimo, Math.round(len / 3))
      const ini = yb - ponta
      const meio = Math.max(1, Math.round(ponta * fade))
      for (let y = Math.max(ya, ini - meio); y <= yb; y++) out[y * w + x] = sat((y - (ini - meio)) / (2 * meio))
    }
  }
  // no retrato (ilustração grande), a cor das pontas se espalha um pouco para os lados: sem emenda reta entre colunas
  if (cel >= 256) {
    const R = Math.round(cel / 64)
    const tmp = new Float32Array(out)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!opaco(x, y)) continue
        let soma = 0
        let n = 0
        for (let k = -R; k <= R; k++) {
          const xx = x + k
          if (xx < 0 || xx >= w || !opaco(xx, y)) continue
          soma += tmp[y * w + xx]
          n++
        }
        out[y * w + x] = Math.max(tmp[y * w + x] * 0.5, n ? soma / n : 0)
      }
  }
  return out
}
/** Mistura de duas cores pelo HSL (matiz pelo caminho mais curto): o meio do degradê não acinzenta. */
function misturaCor(a: number[], b: number[], t: number): number[] {
  if (t <= 0) return a
  if (t >= 1) return b
  const A = rgbHsl(a[0], a[1], a[2])
  const B = rgbHsl(b[0], b[1], b[2])
  let dh = B[0] - A[0]
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  // matiz de um cinza não conta: usa o da outra cor
  const h = A[1] < 0.08 ? B[0] : B[1] < 0.08 ? A[0] : A[0] + dh * t
  return hslRgb((h + 360) % 360, lerp(A[1], B[1], t), lerp(A[2], B[2], t))
}
export function pintaCabelo(d: Px, c: (typeof CAB)[number], pontas?: (typeof CAB)[number] | null, w = 0) {
  const peso = pontas && w ? pesoPontas(d, w, w, 24, 0.6) : null
  const base = [20, 14, 26]
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue
    const v = d[i]
    const t1 = sat((v - 95) / 80)
    const t2 = sat((v - 175) / 60)
    const t0 = sat((v - 25) / 46)
    const tp = peso ? suave(0, 1, peso[p]) : 0
    const s = pontas ? misturaCor(c[1], pontas[1], tp) : c[1]
    const m = pontas ? misturaCor(c[2], pontas[2], tp) : c[2]
    const l = pontas ? misturaCor(c[3], pontas[3], tp) : c[3]
    for (let k = 0; k < 3; k++) {
      let x = lerp(s[k], m[k], t1)
      x = lerp(x, l[k], t2)
      d[i + k] = lerp(base[k], x, t0)
    }
  }
}
function tonsChibi(c: (typeof CAB)[number], indice: number) {
  const [, s0, m, l0] = c
  // no Preto a sombra clareia um pouco, para o contorno se separar dela
  const s = indice === 0 ? s0.map((v) => lerp(v, 255, 0.06)) : s0.map((v, k) => lerp(v, [48, 32, 72][k], 0.2))
  const l = indice === 0 ? [84, 78, 96] : l0.map((v, k) => lerp(v, [255, 244, 226][k], 0.15))
  return { s, m: m as number[], l }
}
/**
 * Cabelo do chibi em 4 tons fixos (contorno, sombra, meio, luz), sem os cinzas intermediários da redução da arte, que
 * deixavam o cabelo granulado (crítico de arte, 09/11). Sombra puxada para o frio e luz para o quente. Com "pontas",
 * a segunda cor entra em xadrez na transição e fica inteira no fim do cabelo.
 */
export function pintaCabeloChibi(d: Px, c: (typeof CAB)[number], indice: number, w: number, pontas = -1) {
  const a = tonsChibi(c, indice)
  const b = pontas >= 0 ? tonsChibi(CAB[pontas], pontas) : null
  const peso = b ? pesoPontas(d, w, CEL_X, 4, 0, 0.6) : null
  const cont = [20, 14, 26]
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue
    const v = d[i]
    // entre a sombra e o meio, xadrez 1x1 (a mecha escura mantém o desenho em vez de virar chapa)
    const xadrez = ((p % w) + Math.floor(p / w)) & 1
    // pontas: corte serrilhado por mecha (cada coluna desce 0 a 2 px a mais), sem xadrez
    const x = p % w
    const serra = ((x * 7919) >> 3) % 3
    const ponta = peso && b && peso[p] > 0 && (peso[p] >= 1 || p + serra * w < d.length / 4 && peso[p + serra * w] > 0)
    const T = ponta && b ? b : a
    const cor = v < 48 ? cont : v < 105 ? T.s : v < 135 ? (xadrez ? T.s : T.m) : v < 205 ? T.m : T.l
    for (let k = 0; k < 3; k++) d[i + k] = cor[k]
  }
}

/** Brilhos brancos soltos na roupa (pareciam sujeira): grupos claros de até 4 px cercados de tons escuros viram a média
 *  da borda do grupo. */
function limpaPontinhos(c: HTMLCanvasElement, msk: HTMLImageElement) {
  const x = c.getContext('2d', { willReadFrequently: true })!
  const im = x.getImageData(0, 0, c.width, c.height)
  const d = im.data
  const o = new Uint8ClampedArray(d)
  const mc = document.createElement('canvas')
  mc.width = msk.width
  mc.height = msk.height
  const mx = mc.getContext('2d', { willReadFrequently: true })!
  mx.drawImage(msk, 0, 0)
  const m = mx.getImageData(0, 0, mc.width, mc.height).data
  const W = c.width
  const H = c.height
  const lum = (i: number) => 0.3 * o[i] + 0.59 * o[i + 1] + 0.11 * o[i + 2]
  const claro = (p: number) => o[p * 4 + 3] > 0 && !m[p * 4] && !m[p * 4 + 1] && lum(p * 4) > 200
  const visto = new Uint8Array(W * H)
  for (let p0 = 0; p0 < W * H; p0++) {
    if (visto[p0] || !claro(p0)) continue
    const grupo: number[] = []
    const borda = new Set<number>()
    const fila = [p0]
    visto[p0] = 1
    let ok = true
    while (fila.length) {
      const p = fila.pop()!
      grupo.push(p)
      if (grupo.length > 4) ok = false
      const xx = p % W
      const yy = Math.floor(p / W)
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = xx + a
        const ny = yy + b
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
          ok = false
          continue
        }
        const q = ny * W + nx
        if (claro(q)) {
          if (!visto[q]) {
            visto[q] = 1
            fila.push(q)
          }
        } else if (!o[q * 4 + 3] || lum(q * 4) >= 130) ok = false
        else borda.add(q)
      }
    }
    if (!ok || !borda.size) continue
    const med = [0, 0, 0]
    for (const q of borda) for (let k = 0; k < 3; k++) med[k] += o[q * 4 + k] / borda.size
    for (const p of grupo) for (let k = 0; k < 3; k++) d[p * 4 + k] = med[k]
  }
  x.putImageData(im, 0, 0)
}

export function pintaCorpo(d: Px, pele: (typeof PELES)[number]) {
  const [, tom, som] = pele
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3] || d[i] - d[i + 2] <= 30) continue
    const v = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]
    const t = sat((v - 150) / 65)
    for (let k = 0; k < 3; k++) d[i + k] = lerp(som[k], tom[k], t)
  }
}

/** Faixa dos olhos: acima são sobrancelhas, abaixo é a boca (e as olheiras do rosto 14). */
export type CaixaOlho = { x0: number; x1: number; y0: number; y1: number }
export function pintaRosto(
  d: Px,
  w: number,
  indice: number,
  olho: (typeof OLHOS)[number],
  cabelo: (typeof CAB)[number],
  pele: (typeof PELES)[number],
  olho2?: (typeof OLHOS)[number] | null,
  caixas?: CaixaOlho[],
) {
  const cx: CaixaOlho[] = [
    { x0: w, x1: -1, y0: w, y1: -1 },
    { x0: w, x1: -1, y0: w, y1: -1 },
  ]
  const esc = w / 512
  const y0 = 186 * esc
  const y1 = (indice === 13 ? 219 : 240) * esc
  const max = indice === 7 ? 176 : 208
  const [, s, m] = olho
  const sob = cabelo[1]
  const claro = pele[1]
  const lab = [Math.max(70, claro[0] - 70), Math.max(40, claro[1] - 90), Math.max(40, claro[2] - 80)]
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue
    const v = d[i]
    if (v <= 58 || v >= max) continue
    const y = Math.floor(p / w)
    const x = p % w
    const t = sat((v - 58) / 90)
    // segundo olho (heterocromia): o olho da metade direita da imagem
    const o2 = x >= w / 2 && olho2
    const ss = o2 ? olho2[1] : s
    const mm = o2 ? olho2[2] : m
    if (y >= y0 && y < y1) {
      const c = cx[x < w / 2 ? 0 : 1]
      c.x0 = Math.min(c.x0, x)
      c.x1 = Math.max(c.x1, x)
      c.y0 = Math.min(c.y0, y)
      c.y1 = Math.max(c.y1, y)
    }
    for (let k = 0; k < 3; k++) d[i + k] = y < y0 ? sob[k] * (0.75 + 0.5 * t) : y < y1 ? lerp(ss[k], mm[k], t) : lab[k] * (0.7 + 0.6 * t)
  }
  if (caixas) caixas.push(...cx.filter((c) => c.x1 >= 0))
}

/** Detalhe do rosto no busto (MARCAS): sardas, pinta ou bochechas coradas, logo abaixo dos olhos. */
export function marcasBusto(ctx: CanvasRenderingContext2D, w: number, marca: number, caixas: CaixaOlho[], pele: (typeof PELES)[number]) {
  if (!marca || !caixas.length) return
  const e = w / 512
  const som = pele[2]
  const cor = (a: number) => `rgba(${Math.round(som[0] * 0.7)},${Math.round(som[1] * 0.56)},${Math.round(som[2] * 0.5)},${a})`
  ctx.save()
  // sardas no nariz, entre os olhos
  if (marca === 1 && caixas.length === 2) {
    const nx = (caixas[0].x1 + caixas[1].x0) / 2
    const ny = Math.max(caixas[0].y1, caixas[1].y1) + 22 * e
    for (const [dx, dy, r, o] of [
      [-6, 0, 1.6, 0.6],
      [5, 3, 1.4, 0.55],
      [-1, 6, 1.8, 0.7],
    ]) {
      ctx.fillStyle = cor(o)
      ctx.beginPath()
      ctx.arc(nx + dx * e, ny + dy * e, r * e, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  caixas.forEach((c, n) => {
    const cx = (c.x0 + c.x1) / 2
    const by = c.y1 + 18 * e
    // a bochecha da esquerda é o espelho da direita
    const lado = caixas.length === 2 && n === 0 ? -1 : 1
    if (marca === 1) {
      for (const [dx, dy, r, o] of [
        [16, 2, 2.2, 0.85],
        [6, 8, 1.6, 0.6],
        [-4, 1, 2.0, 0.75],
        [-13, 7, 1.5, 0.55],
        [1, 14, 2.4, 0.8],
        [11, 15, 1.4, 0.5],
        [-8, 13, 1.8, 0.65],
        [20, 10, 1.5, 0.6],
      ]) {
        ctx.fillStyle = cor(o)
        ctx.beginPath()
        ctx.arc(cx + dx * lado * e, by + dy * e, r * e, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (marca === 2 && n === caixas.length - 1) {
      ctx.fillStyle = 'rgb(58,32,34)'
      ctx.beginPath()
      ctx.arc(c.x1 - 2 * e, by + 6 * e, 4.5 * e, 0, Math.PI * 2)
      ctx.fill()
    } else if (marca === 3) {
      const g = ctx.createRadialGradient(cx, by + 8 * e, 0, cx, by + 8 * e, 26 * e)
      g.addColorStop(0, 'rgba(236,104,122,0.38)')
      g.addColorStop(1, 'rgba(236,104,122,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(cx, by + 8 * e, 26 * e, 13 * e, 0, 0, Math.PI * 2)
      ctx.fill()
      // risquinhos de rubor, à moda do anime
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = 'rgba(214,92,110,0.55)'
      ctx.lineWidth = 1.6 * e
      ctx.lineCap = 'round'
      for (const k of [-1, 0, 1]) {
        ctx.beginPath()
        ctx.moveTo(cx + (k * 7 - 3) * e, by + 12 * e)
        ctx.lineTo(cx + (k * 7 + 3) * e, by + 4 * e)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    }
  })
  ctx.restore()
}

export const CEL_X = 80
export const CEL_Y = 96
/**
 * Folha de andar (16 colunas por direção): 0 parado · 1..8 passos · 9 assentar · 10 piscar · 11 peito ·
 * 12/13 olhar com os olhos (esquerda/direita) · 14 olhar para trás (de lado) · 15 piscar com o peito levantado.
 */
export const ANDAR_COLS = 16
export const PX_QUADRO = 5
export const COL = { parado: 0, assenta: 9, pisca: 10, peito: 11, olhaE: 12, olhaD: 13, olhaF: 14, piscaPeito: 15 }
/** Quanto o corpo sobe em cada passo (a altura já está na arte; a sombra estreita no alto). */
export const ANDAR_BOB = [0, 1, 0, -1, 0, 1, 0, -1]

const ARTE = '/v2/art/avatar/'
const V = '?v=202611071900'

const imgs = new Map<string, Promise<HTMLImageElement>>()
export function carregaImg(src: string): Promise<HTMLImageElement> {
  let p = imgs.get(src)
  if (!p) {
    p = new Promise((ok, erro) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = erro
      i.src = src
    })
    p.catch(() => imgs.delete(src))
    imgs.set(src, p)
  }
  return p
}
const json = new Map<string, Promise<unknown>>()
function carregaJson<T>(src: string): Promise<T> {
  let p = json.get(src)
  if (!p) {
    p = fetch(src).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    p.catch(() => json.delete(src))
    json.set(src, p)
  }
  return p as Promise<T>
}

/* Chibi fofo (dono, 07/11: "estilo ddtank" → "Aprovo"). Peças em art/avatar/fofo/, por camadas: roupa (corpo careca já
   vestido + máscara: vermelho = pele, verde = íris + json com as âncoras), rosto escolhido, cabelo em cinza. */
const FOFO_COL = [8, 0, 1, 2, 3, 4, 5, 6, 7, 14, 9, 10, 11, 12, 8, 13]
const FOFO_OLHA_F = [8, 12, 11, 8]
const FOFO_ROSTO: Record<number, number> = { 9: 1, 13: 1, 11: 2, 12: 3 }
type FofoInfo = { anc: [number, number][][]; testa?: Record<number, number>; desvio?: Record<number, [number, number]> }

function tela(im: CanvasImageSource & { width: number; height: number }): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = im.width
  c.height = im.height
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(im, 0, 0)
  return [c, x]
}

/** Detalhe do rosto no chibi, em pixel: sardas (2 px por bochecha), pinta (1 px) ou bochechas coradas (2 px rosados),
 *  logo abaixo dos olhos, só em cima de pele. Uma célula por direção (colunas) e por variação do rosto (linhas). */
function marcasChibi(fc: HTMLCanvasElement, rmsk: HTMLImageElement, marca: number, tom: number[]) {
  const x = fc.getContext('2d', { willReadFrequently: true })!
  const im = x.getImageData(0, 0, fc.width, fc.height)
  const d = im.data
  const [, mx] = tela(rmsk)
  const m = mx.getImageData(0, 0, rmsk.width, rmsk.height).data
  const W = fc.width
  const pele = (xx: number, yy: number) => m[(yy * W + xx) * 4] > 0 && d[(yy * W + xx) * 4 + 3] > 0
  const poe = (xx: number, yy0: number, cor: number[]) => {
    // se o pixel exato não é pele (cílio de baixo), procura até 3 px para baixo
    let yy = yy0
    while (yy < yy0 + 3 && yy < fc.height && !(xx >= 0 && xx < W && pele(xx, yy))) yy++
    if (xx < 0 || yy < 0 || xx >= W || yy >= fc.height || !pele(xx, yy)) return
    const i = (yy * W + xx) * 4
    d[i] = cor[0]
    d[i + 1] = cor[1]
    d[i + 2] = cor[2]
  }

  const sarda = tom.map((v, k) => v * [0.72, 0.6, 0.55][k])
  const rosa = tom.map((v, k) => lerp(v, [236, 104, 122][k], 0.55))
  for (let cy = 0; cy * CEL_Y < fc.height; cy++)
    for (let cxx = 0; cxx * CEL_X < W; cxx++) {
      // olhos da célula: colunas com íris (verde), agrupadas
      const cols = new Map<number, number>()
      for (let yy = cy * CEL_Y; yy < Math.min(fc.height, (cy + 1) * CEL_Y); yy++)
        for (let xx = cxx * CEL_X; xx < Math.min(W, (cxx + 1) * CEL_X); xx++) if (m[(yy * W + xx) * 4 + 1] > 0) cols.set(xx, Math.max(cols.get(xx) ?? 0, yy))
      if (!cols.size) continue
      const xs = [...cols.keys()].sort((a, b) => a - b)
      const grupos: number[][] = []
      for (const xx of xs) {
        const g = grupos[grupos.length - 1]
        if (g && xx - g[g.length - 1] <= 2) g.push(xx)
        else grupos.push([xx])
      }
      grupos.forEach((g, n) => {
        const cx = Math.round((g[0] + g[g.length - 1]) / 2)
        const by = Math.max(...g.map((xx) => cols.get(xx)!)) + 2
        if (marca === 1) {
          poe(cx - 1, by, sarda)
          poe(cx + 1, by + 1, sarda)
        } else if (marca === 2 && n === grupos.length - 1) poe(g[g.length - 1] + 1, by + 1, [62, 34, 36])
        else if (marca === 3) {
          poe(cx, by + 1, rosa)
          poe(cx + 1, by + 1, rosa)
        }
      })
    }
  x.putImageData(im, 0, 0)
}

export async function folhaAndarFofo(cfg: Aparencia): Promise<HTMLCanvasElement> {
  const b = ARTE + 'fofo/'
  const lado = cfg.corpo ? 'm' : 'f'
  const nr = (cfg.roupa || 0) + 1
  const [roupa, msk, info, cab, rosto, rmsk] = await Promise.all([
    carregaImg(`${b}roupa-${nr}-${lado}.png${V}`),
    carregaImg(`${b}roupa-${nr}-${lado}-mascara.png${V}`),
    carregaJson<FofoInfo>(`${b}roupa-${nr}-${lado}.json${V}`),
    carregaImg(`${b}cabelo-${(cfg.cabelo || 0) + 1}.png${V}`),
    carregaImg(`${b}rosto-${(cfg.rosto || 0) + 1}.png${V}`),
    carregaImg(`${b}rosto-${(cfg.rosto || 0) + 1}-mascara.png${V}`),
  ])
  // pele: cada canal pela razão entre o tom escolhido e o tom da arte; íris pela rampa da cor dos olhos
  const tom = PELES[cfg.pele || 0][1]
  const [, os, om] = OLHOS[cfg.corOlhos || 0]
  const [, os2, om2] = OLHOS[cfg.olho2 ? cfg.olho2 - 1 : cfg.corOlhos || 0]
  let ref: number[] | null = null
  const pinta = (im: HTMLImageElement, mk: HTMLImageElement) => {
    const [c, x] = tela(im)
    const [, mx] = tela(mk)
    const id = x.getImageData(0, 0, c.width, c.height)
    const d = id.data
    const m = mx.getImageData(0, 0, c.width, c.height).data
    if (!ref) {
      const r = [0, 0, 0]
      let n = 0
      for (let i = 0; i < d.length; i += 4)
        if (m[i] > 0 && d[i + 3]) {
          const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]
          if (l > 185 && l < 225) {
            r[0] += d[i]
            r[1] += d[i + 1]
            r[2] += d[i + 2]
            n++
          }
        }
      ref = r.map((v) => (n ? v / n : 200))
    }
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue
      if (m[i] > 0) {
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, (d[i + k] * tom[k]) / ref[k])
      } else if (m[i + 1] > 0) {
        // íris em 3 tons (pupila, íris, luz); o brilho branco da arte continua branco (crítico de arte, 09/11)
        const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]
        if (l > 215) continue
        const t = sat((l - 40) / 95)
        // segundo olho (heterocromia): a metade direita de cada célula
        const [a1, a2] = ((i / 4) % c.width) % CEL_X >= CEL_X / 2 ? [os2, om2] : [os, om]
        for (let k = 0; k < 3; k++) d[i + k] = t < 0.25 ? a1[k] * 0.55 : t < 0.6 ? a1[k] : a2[k]
      }
    }
    x.putImageData(id, 0, 0)
    return c
  }
  const rc = pinta(roupa, msk)
  const fc = pinta(rosto, rmsk)
  limpaPontinhos(rc, msk)
  if (cfg.corRoupa) {
    const rx = rc.getContext('2d', { willReadFrequently: true })!
    const ri = rx.getImageData(0, 0, rc.width, rc.height)
    const [, mmx] = tela(msk)
    pintaRoupa(ri.data, cfg.corRoupa, mmx.getImageData(0, 0, msk.width, msk.height).data)
    rx.putImageData(ri, 0, 0)
  }
  if (cfg.marca) marcasChibi(fc, rmsk, cfg.marca, tom)
  const [, mkx] = tela(msk)
  const mskL = msk.width
  const mskDados = mkx.getImageData(0, 0, msk.width, msk.height).data
  const [, rmx] = tela(rmsk)
  const rmL = rmsk.width
  const rmDados = rmx.getImageData(0, 0, rmsk.width, rmsk.height).data
  const olhosCache = new Map<number, HTMLCanvasElement | null>()
  const [hc, hx] = tela(cab)
  const ih = hx.getImageData(0, 0, hc.width, hc.height)
  pintaCabeloChibi(ih.data, CAB[cfg.corCabelo || 0], cfg.corCabelo || 0, hc.width, cfg.corPontas ? cfg.corPontas - 1 : -1)
  hx.putImageData(ih, 0, 0)
  const A = info.anc
  const T = info.testa || {}
  const D = info.desvio || {}
  const cv = document.createElement('canvas')
  cv.width = CEL_X * ANDAR_COLS
  cv.height = CEL_Y * 4
  const ctx = cv.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const celv = document.createElement('canvas')
  celv.width = CEL_X
  celv.height = CEL_Y
  const cel = celv.getContext('2d', { willReadFrequently: true })!
  const hBase = [0, 1, 2, 3].map((d) => hx.getImageData(d * CEL_X, 0, CEL_X, CEL_Y))
  // limites do cabelo em cada direção (primeira e última linha com pixel)
  const hLim = hBase.map((im) => {
    let topo = CEL_Y
    let fundo = 0
    for (let yy = 0; yy < CEL_Y; yy++)
      for (let xx = 0; xx < CEL_X; xx++)
        if (im.data[(yy * CEL_X + xx) * 4 + 3]) {
          topo = Math.min(topo, yy)
          fundo = Math.max(fundo, yy)
        }
    return { topo, fundo }
  })
  /* Cabelo que anda (dono, 09/11: "parece que meu boneco anda e o cabelo é um objeto estático"): a coroa fica presa à
     cabeça e, da linha dos olhos para baixo, o cabelo se curva aos poucos até as pontas (deslocamento por linha, em
     pixel inteiro). As pontas sobem e descem 1 quadro depois da cabeça, ficam para trás no andar de lado e balançam
     de um lado para o outro de frente e de costas. Parado, o cabelo fica como na arte. */
  const LADO = [1, 2, 3, 2, 1, 2, 3, 2]
  const FRENTE = [0, 1, 1, 1, 0, -1, -1, -1]
  const hCache = new Map<string, { cv: HTMLCanvasElement; d: Uint8ClampedArray }>()
  const cabeloQuadro = (dir: number, src: number) => {
    const anda = src < 8
    const vLag = anda ? A[dir][(src + 7) % 8][1] - A[dir][src][1] : 0
    const lado = dir === 1 || dir === 2
    const hs = anda ? (lado ? (dir === 1 ? 1 : -1) * LADO[src] : 2 * FRENTE[src]) : src === 14 && lado ? (dir === 1 ? 1 : -1) : 0
    const chave = `${dir}:${vLag}:${hs}`
    const ja = hCache.get(chave)
    if (ja) return ja
    const base = hBase[dir]
    const { fundo } = hLim[dir]
    const coroa = Math.min(fundo - 2, (T[dir] ?? hLim[dir].topo + 20) + 8)
    const out = new ImageData(CEL_X, CEL_Y)
    for (let yy = 0; yy < CEL_Y; yy++) {
      const w = yy <= coroa ? 0 : Math.pow(Math.min(1, (yy - coroa) / Math.max(1, fundo - coroa)), 1.3)
      const oy = Math.round(w * vLag)
      const ox = Math.round(w * hs)
      const sy = yy - oy
      if (sy < 0 || sy >= CEL_Y) continue
      for (let xx = 0; xx < CEL_X; xx++) {
        const sx = xx - ox
        if (sx < 0 || sx >= CEL_X) continue
        const i = (sy * CEL_X + sx) * 4
        const o = (yy * CEL_X + xx) * 4
        out.data[o] = base.data[i]
        out.data[o + 1] = base.data[i + 1]
        out.data[o + 2] = base.data[i + 2]
        out.data[o + 3] = base.data[i + 3]
      }
    }
    const cv = document.createElement('canvas')
    cv.width = CEL_X
    cv.height = CEL_Y
    cv.getContext('2d')!.putImageData(out, 0, 0)
    const r = { cv, d: out.data }
    hCache.set(chave, r)
    return r
  }
  for (let dir = 0; dir < 4; dir++) {
    const [ox, oy] = D[dir] || [0, 0]
    for (let col = 0; col < ANDAR_COLS; col++) {
      const src = col === 14 ? FOFO_OLHA_F[dir] : FOFO_COL[col]
      const x = col * CEL_X
      const y = dir * CEL_Y + 1
      const dx = A[dir][src][0] + ox
      const dy = A[dir][src][1] + oy
      // o cabelo acompanha a cabeça (a coroa) e as pontas atrasam e balançam (cabeloQuadro)
      const hdy = dy
      const hq = cabeloQuadro(dir, src)
      const testa = T[dir]
      cel.clearRect(0, 0, CEL_X, CEL_Y)
      cel.drawImage(rc, src * CEL_X, dir * CEL_Y, CEL_X, CEL_Y, 0, 0, CEL_X, CEL_Y)
      if (dir < 3) cel.drawImage(fc, dir * CEL_X, (FOFO_ROSTO[src] || 0) * CEL_Y, CEL_X, CEL_Y, dx, dy, CEL_X, CEL_Y)
      // acima da testa, a cabeça careca só fica onde há cabelo por cima na mesma coluna
      if (testa != null) {
        const cd = cel.getImageData(0, 0, CEL_X, CEL_Y)
        const hd = hq.d
        for (let xx = 0; xx < CEL_X; xx++) {
          const hx2 = xx - dx
          let primeiro = CEL_Y
          if (hx2 >= 0 && hx2 < CEL_X)
            for (let yy = 0; yy < CEL_Y; yy++) {
              if (hd[(yy * CEL_X + hx2) * 4 + 3]) {
                primeiro = yy + hdy
                break
              }
            }
          for (let yy = 0; yy < Math.min(CEL_Y, testa + A[dir][src][1]); yy++) if (yy < primeiro) cd.data[(yy * CEL_X + xx) * 4 + 3] = 0
        }
        // de lado, até a altura das orelhas: a cabeça não passa da borda de trás do cabelo
        if (dir === 1 || dir === 2)
          for (let yy = 0; yy < Math.min(CEL_Y, testa + A[dir][src][1] + 12); yy++) {
            const hy = yy - hdy
            if (hy < 0 || hy >= CEL_Y) continue
            let borda = -1
            for (let xx = 0; xx < CEL_X; xx++)
              if (hd[(hy * CEL_X + xx) * 4 + 3]) {
                if (dir === 1 || borda < 0) borda = xx + dx
                if (dir === 2) {
                  borda = xx + dx
                  break
                }
              }
            if (borda < 0) continue
            for (let xx = 0; xx < CEL_X; xx++) if (dir === 1 ? xx > borda : xx < borda) cd.data[(yy * CEL_X + xx) * 4 + 3] = 0
          }
        cel.putImageData(cd, 0, 0)
      }
      // mãos balançando de frente e de costas (de lado a arte já balança)
      if ((dir === 0 || dir === 3) && src < 8 && testa != null) balancaMaos(dir, src, dx, testa + A[dir][src][1] + 14)
      // o cabelo entra na mesma célula (para o contorno valer para o boneco inteiro)
      cel.drawImage(hq.cv, dx, hdy)
      // de frente, olhos, cílios e sobrancelhas por cima da franja (como no anime): a borda da franja não corta mais os
      // olhos nem os faz "piscar" quando o cabelo balança
      if (dir === 0) {
        const ov = olhosPorCima(FOFO_ROSTO[src] || 0)
        if (ov) olhosSobreFranja(ov, src, dx, dy, hq.d, hdy)
      }
      contorno()
      ctx.drawImage(celv, x, y)
    }
  }
  return cv

  /* ---- design (crítico de arte, 09/11) ---- */
  // o olho passa por cima da franja só onde ela cobre no máximo 2 px dele (mecha que desce bem abaixo do olho continua
  // escondendo); e só dentro da cabeça (máscara de pele da roupa)
  function olhosSobreFranja(ov: HTMLCanvasElement, src: number, dx: number, dy: number, hd: Uint8ClampedArray, hdy: number) {
    const od = ov.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, CEL_X, CEL_Y).data
    const im = cel.getImageData(0, 0, CEL_X, CEL_Y)
    const d = im.data
    const fimFranja = new Int16Array(CEL_X).fill(-99)
    for (let xx = 0; xx < CEL_X; xx++) {
      const hx2 = xx - dx
      if (hx2 < 0 || hx2 >= CEL_X) continue
      let yy = 0
      while (yy < CEL_Y && !hd[(yy * CEL_X + hx2) * 4 + 3]) yy++
      if (yy >= CEL_Y) continue // coluna sem cabelo: o olho aparece normal
      while (yy < CEL_Y && hd[(yy * CEL_X + hx2) * 4 + 3]) yy++
      fimFranja[xx] = yy - 1 + hdy
    }
    for (let oy = 0; oy < CEL_Y; oy++)
      for (let ox = 0; ox < CEL_X; ox++) {
        const s = (oy * CEL_X + ox) * 4
        if (!od[s + 3]) continue
        const xx = ox + dx
        const yy = oy + dy
        if (xx < 0 || yy < 0 || xx >= CEL_X || yy >= CEL_Y) continue
        if (!mskDados[(yy * mskL + src * CEL_X + xx) * 4]) continue
        if (yy < fimFranja[xx] - 2) continue
        const t = (yy * CEL_X + xx) * 4
        for (let k = 0; k < 4; k++) d[t + k] = od[s + k]
      }
    cel.putImageData(im, 0, 0)
  }
  // contorno único do boneco inteiro: borda opaca com vizinho vazio (4 direções) e luz acima de 70 vira o tom escuro
  // do contorno; pixels já escuros ficam, e o boneco não engorda
  function contorno() {
    const im = cel.getImageData(0, 0, CEL_X, CEL_Y)
    const d = im.data
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] < 128 ? 0 : 255
    const borda: number[] = []
    for (let yy = 0; yy < CEL_Y; yy++)
      for (let xx = 0; xx < CEL_X; xx++) {
        const i = (yy * CEL_X + xx) * 4
        if (!d[i + 3]) continue
        const vazio = (a: number, b: number) => a < 0 || b < 0 || a >= CEL_X || b >= CEL_Y || !d[(b * CEL_X + a) * 4 + 3]
        if (!(vazio(xx - 1, yy) || vazio(xx + 1, yy) || vazio(xx, yy - 1) || vazio(xx, yy + 1))) continue
        if (Math.abs(d[i] - 20) + Math.abs(d[i + 1] - 14) + Math.abs(d[i + 2] - 26) > 30) borda.push(i)
      }
    for (const i of borda) {
      d[i] = 20
      d[i + 1] = 14
      d[i + 2] = 26
    }
    cel.putImageData(im, 0, 0)
  }
  // mãos: pixels de pele (máscara vermelha) abaixo do queixo, separados pelo meio do corpo; sobem e descem 1 px em
  // oposição, no ritmo do passo; o buraco de cima é coberto pelo pixel do punho
  function balancaMaos(dir: number, src: number, dx: number, abaixo: number) {
    const fase = src >= 1 && src <= 3 ? 1 : src >= 5 && src <= 7 ? -1 : 0
    if (!fase) return
    const im = cel.getImageData(0, 0, CEL_X, CEL_Y)
    const d = im.data
    const orig = new Uint8ClampedArray(d)
    const m = mskDados
    const meio = CEL_X / 2 + dx
    const pele = (xx: number, yy: number) => {
      const mi = ((dir * CEL_Y + yy) * mskL + src * CEL_X + xx) * 4
      return m[mi] > 0 && orig[(yy * CEL_X + xx) * 4 + 3] > 0
    }
    // só grupos de pele separados da cabeça (as mãos): o grupo que sobe acima do queixo (cabeça, pescoço) não mexe
    const mov = new Uint8Array(CEL_X * CEL_Y)
    const visto = new Uint8Array(CEL_X * CEL_Y)
    for (let p0 = 0; p0 < CEL_X * CEL_Y; p0++) {
      if (visto[p0] || !pele(p0 % CEL_X, Math.floor(p0 / CEL_X))) continue
      const grupo: number[] = []
      const fila = [p0]
      visto[p0] = 1
      let topo = CEL_Y
      while (fila.length) {
        const q = fila.pop()!
        grupo.push(q)
        const qx = q % CEL_X
        const qy = Math.floor(q / CEL_X)
        topo = Math.min(topo, qy)
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = qx + a
          const ny = qy + b
          if (nx < 0 || ny < 0 || nx >= CEL_X || ny >= CEL_Y) continue
          const r = ny * CEL_X + nx
          if (!visto[r] && pele(nx, ny)) {
            visto[r] = 1
            fila.push(r)
          }
        }
      }
      if (topo >= abaixo) for (const q of grupo) mov[q] = 1
    }
    for (let yy = CEL_Y - 1; yy >= 0; yy--)
      for (let xx = 0; xx < CEL_X; xx++) if (mov[yy * CEL_X + xx]) d[(yy * CEL_X + xx) * 4 + 3] = 0
    for (let yy = 0; yy < CEL_Y; yy++)
      for (let xx = 0; xx < CEL_X; xx++) {
        if (!mov[yy * CEL_X + xx]) continue
        const lado = (xx < meio ? 1 : -1) * (dir === 3 ? -1 : 1)
        const ny = yy + lado * fase
        if (ny < 0 || ny >= CEL_Y) continue
        const s = (yy * CEL_X + xx) * 4
        const t = (ny * CEL_X + xx) * 4
        for (let k = 0; k < 4; k++) d[t + k] = orig[s + k]
      }
    // buraco que sobrou: o pixel de cima (o punho)
    for (let yy = abaixo; yy < CEL_Y; yy++)
      for (let xx = 0; xx < CEL_X; xx++) {
        const i = (yy * CEL_X + xx) * 4
        if (d[i + 3] || !orig[i + 3]) continue
        const a = ((yy - 1) * CEL_X + xx) * 4
        for (let k = 0; k < 4; k++) d[i + k] = orig[a + k]
      }
    cel.putImageData(im, 0, 0)
  }
  // a parte dos olhos do rosto (sem a pele), numa faixa da íris −3 até +1, para desenhar por cima da franja
  function olhosPorCima(v: number) {
    if (olhosCache.has(v)) return olhosCache.get(v)!
    const faixa = (vv: number) => {
      let a = CEL_Y
      let b = -1
      for (let yy = 0; yy < CEL_Y; yy++)
        for (let xx = 0; xx < CEL_X; xx++)
          if (rmDados[((vv * CEL_Y + yy) * rmL + xx) * 4 + 1] > 0) {
            a = Math.min(a, yy)
            b = Math.max(b, yy)
          }
      return b >= 0 ? [a, b] : null
    }
    const f = faixa(v) ?? faixa(0)
    if (!f) return olhosCache.set(v, null), null
    const o = document.createElement('canvas')
    o.width = CEL_X
    o.height = CEL_Y
    const ox = o.getContext('2d')!
    ox.drawImage(fc, 0, v * CEL_Y, CEL_X, CEL_Y, 0, 0, CEL_X, CEL_Y)
    const im = ox.getImageData(0, 0, CEL_X, CEL_Y)
    for (let yy = 0; yy < CEL_Y; yy++)
      for (let xx = 0; xx < CEL_X; xx++) {
        const i = (yy * CEL_X + xx) * 4
        const pele = rmDados[((v * CEL_Y + yy) * rmL + xx) * 4] > 0
        if (yy < f[0] - 3 || yy > f[1] + 1 || pele) im.data[i + 3] = 0
      }
    ox.putImageData(im, 0, 0)
    olhosCache.set(v, o)
    return o
  }
}

/* ---- busto da criação e do guarda-roupa (kit3/avatar.html) ---- */
export type PecasBusto = { corpo: HTMLImageElement[]; cabelo: HTMLImageElement[]; rosto: HTMLImageElement[]; roupa: HTMLImageElement[][] }

export async function carregaBusto(): Promise<PecasBusto> {
  const n = 18
  const [corpo, cabelo, rosto, roupaF, roupaM] = await Promise.all([
    Promise.all(['f', 'm'].map((c) => carregaImg(`${ARTE}corpo-${c}.png`))),
    Promise.all(Array.from({ length: n }, (_, i) => carregaImg(`${ARTE}cabelo-${i + 1}.png`))),
    Promise.all(Array.from({ length: n }, (_, i) => carregaImg(`${ARTE}rosto-${i + 1}.png`))),
    Promise.all(Array.from({ length: 6 }, (_, i) => carregaImg(`${ARTE}roupa-${i + 1}-f.png`))),
    Promise.all(Array.from({ length: 6 }, (_, i) => carregaImg(`${ARTE}roupa-${i + 1}-m.png`))),
  ])
  return { corpo, cabelo, rosto, roupa: [roupaF, roupaM] }
}

let tmp: HTMLCanvasElement | null = null
function camada(im: HTMLImageElement, w: number, fn: (d: Px, w: number) => void) {
  tmp = tmp ?? document.createElement('canvas')
  tmp.width = tmp.height = w
  const t = tmp.getContext('2d', { willReadFrequently: true })!
  t.imageSmoothingQuality = 'high'
  t.drawImage(im, 0, 0, w, w)
  const id = t.getImageData(0, 0, w, w)
  fn(id.data, w)
  t.putImageData(id, 0, 0)
  return tmp
}

export function desenhaBusto(ctx: CanvasRenderingContext2D, w: number, p: PecasBusto, c: Aparencia) {
  const cc = CAB[c.corCabelo]
  const pl = PELES[c.pele]
  ctx.clearRect(0, 0, w, w)
  ctx.drawImage(camada(p.corpo[c.corpo], w, (d) => pintaCorpo(d, pl)), 0, 0)
  ctx.imageSmoothingQuality = 'high'
  if (c.corRoupa) ctx.drawImage(camada(p.roupa[c.corpo][c.roupa], w, (d) => pintaRoupa(d, c.corRoupa)), 0, 0)
  else ctx.drawImage(p.roupa[c.corpo][c.roupa], 0, 0, w, w)
  const caixas: CaixaOlho[] = []
  ctx.drawImage(camada(p.rosto[c.rosto], w, (d, ww) => pintaRosto(d, ww, c.rosto, OLHOS[c.corOlhos], cc, pl, c.olho2 ? OLHOS[c.olho2 - 1] : null, caixas)), 0, 0)
  marcasBusto(ctx, w, c.marca, caixas, pl)
  // sombra do cabelo na pele (crítico de arte, 09/11): a silhueta do cabelo, 4 px abaixo e 2 px ao lado, desfocada, no
  // tom de sombra da pele, só por cima do que já foi desenhado (corpo, roupa e rosto)
  const cab = camada(p.cabelo[c.cabelo], w, (d, ww) => pintaCabelo(d, cc, c.corPontas ? CAB[c.corPontas - 1] : null, ww))
  const sombra = document.createElement('canvas')
  sombra.width = sombra.height = w
  const sx = sombra.getContext('2d')!
  sx.drawImage(cab, 0, 0)
  sx.globalCompositeOperation = 'source-in'
  sx.fillStyle = `rgb(${pl[2].map((v) => Math.round(v * 0.82)).join(',')})`
  sx.fillRect(0, 0, w, w)
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = 0.45
  ctx.filter = `blur(${Math.max(1, 3 * (w / 512))}px)`
  ctx.drawImage(sombra, 2 * (w / 512), 4 * (w / 512))
  ctx.restore()
  ctx.drawImage(cab, 0, 0)

}
