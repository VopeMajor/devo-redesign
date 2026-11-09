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

export function pintaCabelo(d: Px, c: (typeof CAB)[number]) {
  const [, s, m, l] = c
  const base = [20, 14, 26]
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue
    const v = d[i]
    const t1 = sat((v - 95) / 80)
    const t2 = sat((v - 175) / 60)
    const t0 = sat((v - 25) / 46)
    for (let k = 0; k < 3; k++) {
      let x = lerp(s[k], m[k], t1)
      x = lerp(x, l[k], t2)
      d[i + k] = lerp(base[k], x, t0)
    }
  }
}

/**
 * Cabelo do chibi em 4 tons fixos (contorno, sombra, meio, luz), sem os cinzas intermediários da redução da arte, que
 * deixavam o cabelo granulado (crítico de arte, 09/11). Sombra puxada para o frio e luz para o quente. O busto da
 * criação continua com pintaCabelo (ilustração, tons contínuos).
 */
export function pintaCabeloChibi(d: Px, c: (typeof CAB)[number], indice: number, w: number) {
  const [, s0, m, l0] = c
  // no Preto a sombra clareia um pouco, para o contorno se separar dela
  const s = indice === 0 ? s0.map((v) => lerp(v, 255, 0.06)) : s0.map((v, k) => lerp(v, [48, 32, 72][k], 0.2))
  const l = indice === 0 ? [84, 78, 96] : l0.map((v, k) => lerp(v, [255, 244, 226][k], 0.15))
  const cont = [20, 14, 26]
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue
    const v = d[i]
    // entre a sombra e o meio, xadrez 1x1 (a mecha escura mantém o desenho em vez de virar chapa)
    const xadrez = ((p % w) + Math.floor(p / w)) & 1
    const cor = v < 48 ? cont : v < 105 ? s : v < 135 ? (xadrez ? s : m) : v < 205 ? m : l
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
export function pintaRosto(d: Px, w: number, indice: number, olho: (typeof OLHOS)[number], cabelo: (typeof CAB)[number], pele: (typeof PELES)[number]) {
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
    const t = sat((v - 58) / 90)
    for (let k = 0; k < 3; k++) d[i + k] = y < y0 ? sob[k] * (0.75 + 0.5 * t) : y < y1 ? lerp(s[k], m[k], t) : lab[k] * (0.7 + 0.6 * t)
  }
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
        for (let k = 0; k < 3; k++) d[i + k] = t < 0.25 ? os[k] * 0.55 : t < 0.6 ? os[k] : om[k]
      }
    }
    x.putImageData(id, 0, 0)
    return c
  }
  const rc = pinta(roupa, msk)
  const fc = pinta(rosto, rmsk)
  limpaPontinhos(rc, msk)
  const [, mkx] = tela(msk)
  const mskL = msk.width
  const mskDados = mkx.getImageData(0, 0, msk.width, msk.height).data
  const [, rmx] = tela(rmsk)
  const rmL = rmsk.width
  const rmDados = rmx.getImageData(0, 0, rmsk.width, rmsk.height).data
  const olhosCache = new Map<number, HTMLCanvasElement | null>()
  const [hc, hx] = tela(cab)
  const ih = hx.getImageData(0, 0, hc.width, hc.height)
  pintaCabeloChibi(ih.data, CAB[cfg.corCabelo || 0], cfg.corCabelo || 0, hc.width)
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
  ctx.drawImage(p.roupa[c.corpo][c.roupa], 0, 0, w, w)
  ctx.drawImage(camada(p.rosto[c.rosto], w, (d, ww) => pintaRosto(d, ww, c.rosto, OLHOS[c.corOlhos], cc, pl)), 0, 0)
  ctx.drawImage(camada(p.cabelo[c.cabelo], w, (d) => pintaCabelo(d, cc)), 0, 0)
}
