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
        const t = sat((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] - 40) / 95)
        for (let k = 0; k < 3; k++) d[i + k] = lerp(os[k], om[k], 0.25 + 0.75 * t)
      }
    }
    x.putImageData(id, 0, 0)
    return c
  }
  const rc = pinta(roupa, msk)
  const fc = pinta(rosto, rmsk)
  const [hc, hx] = tela(cab)
  const ih = hx.getImageData(0, 0, hc.width, hc.height)
  pintaCabelo(ih.data, CAB[cfg.corCabelo || 0])
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
  const hDados = [0, 1, 2, 3].map((d) => hx.getImageData(d * CEL_X, 0, CEL_X, CEL_Y).data)
  for (let dir = 0; dir < 4; dir++) {
    const [ox, oy] = D[dir] || [0, 0]
    for (let col = 0; col < ANDAR_COLS; col++) {
      const src = col === 14 ? FOFO_OLHA_F[dir] : FOFO_COL[col]
      const x = col * CEL_X
      const y = dir * CEL_Y + 1
      const dx = A[dir][src][0] + ox
      const dy = A[dir][src][1] + oy
      // cabelo com 1 quadro de atraso no andar (dono, 08/11: "corpo e cabeça"): quica de leve em vez de grudar na cabeça
      const hdy = (src < 8 ? A[dir][(src + 7) % 8][1] : A[dir][src][1]) + oy
      const testa = T[dir]
      cel.clearRect(0, 0, CEL_X, CEL_Y)
      cel.drawImage(rc, src * CEL_X, dir * CEL_Y, CEL_X, CEL_Y, 0, 0, CEL_X, CEL_Y)
      if (dir < 3) cel.drawImage(fc, dir * CEL_X, (FOFO_ROSTO[src] || 0) * CEL_Y, CEL_X, CEL_Y, dx, dy, CEL_X, CEL_Y)
      // acima da testa, a cabeça careca só fica onde há cabelo por cima na mesma coluna
      if (testa != null) {
        const cd = cel.getImageData(0, 0, CEL_X, CEL_Y)
        const hd = hDados[dir]
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
      ctx.drawImage(celv, x, y)
      ctx.drawImage(hc, dir * CEL_X, 0, CEL_X, CEL_Y, x + dx, y + hdy, CEL_X, CEL_Y)
    }
  }
  return cv
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
