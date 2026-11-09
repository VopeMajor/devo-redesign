'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import {
  BRASAO_COR,
  BRASAO_CORES,
  BRASAO_DIVISAO_ROTULO,
  BRASAO_DIVISOES,
  BRASAO_FORMA_ROTULO,
  BRASAO_FORMAS,
  BRASAO_ORNAMENTO_ROTULO,
  BRASAO_ORNAMENTOS,
  BRASAO_SIMBOLO_ROTULO,
  BRASAO_SIMBOLOS,
  type Brasao,
  type BrasaoCor,
  type BrasaoDivisao,
  type BrasaoForma,
  type BrasaoOrnamento,
  type BrasaoSimbolo,
} from '@/lib/devo/corporacoes'

/**
 * O brasão das Corporações em pixel (protótipo kit3/os-corp.js, aprovado pelo dono): forma, campo em uma ou duas
 * cores, figura e ornamento, compostos a partir das folhas de /v2/art/os/corp. O desenho (forma, cores, divisão,
 * figura, ornamento) é o do jogo (lib/devo/corporacoes.ts); aqui só se pinta.
 */

export const corpArte = (a: string) => `/v2/art/os/corp/${a}.png`

type Meta = { formas: Record<string, { cx: number; cy: number; s: number }> }
type Folhas = { meta: Meta; f: ImageData; fp: ImageData; g: ImageData; gp: ImageData; gpp: ImageData; o: ImageData; op: ImageData }

let FOLHAS: Folhas | null = null
let carregando: Promise<Folhas> | null = null
const CACHE = new Map<string, { url: string; w: number; h: number }>()

const imagem = (src: string) =>
  new Promise<HTMLImageElement>((ok, er) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = er
    i.src = src
  })
function pixels(img: HTMLImageElement) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const x = c.getContext('2d')!
  x.drawImage(img, 0, 0)
  return x.getImageData(0, 0, c.width, c.height)
}

export function carregarFolhas(): Promise<Folhas> {
  if (FOLHAS) return Promise.resolve(FOLHAS)
  if (!carregando) {
    carregando = Promise.all([
      fetch('/v2/art/os/corp/brasao.json').then((r) => r.json() as Promise<Meta>),
      ...['formas', 'formas-p', 'figuras', 'figuras-p', 'figuras-pp', 'ornatos', 'ornatos-p'].map((n) => imagem(corpArte(n))),
    ])
      .then(([meta, ...imgs]) => {
        const [f, fp, g, gp, gpp, o, op] = (imgs as HTMLImageElement[]).map(pixels)
        FOLHAS = { meta: meta as Meta, f, fp, g, gp, gpp, o, op }
        return FOLHAS
      })
      .catch((e) => {
        carregando = null
        throw e
      })
  }
  return carregando
}

/** As folhas do brasão: 'ok' quando prontas, 'erro' se não carregaram, null enquanto carregam. */
export function useFolhasBrasao(): 'ok' | 'erro' | null {
  const [st, setSt] = useState<'ok' | 'erro' | null>(() => (FOLHAS ? 'ok' : null))
  useEffect(() => {
    if (FOLHAS) return
    let vivo = true
    carregarFolhas().then(
      () => vivo && setSt('ok'),
      () => vivo && setSt('erro'),
    )
    return () => {
      vivo = false
    }
  }, [])
  return st
}

/* Rampas de cor em pixel (as mesmas do protótipo) e se a cor é clara (a figura usa tinta escura). */
const RAMPA: Record<BrasaoCor, [string, string, string, boolean]> = {
  aco: ['#ece5d8', '#bab09f', '#6b6357', true],
  porcelana: ['#ffffff', '#e0ddd8', '#8f8e8b', true],
  onix: ['#4f4f55', '#2c2c31', '#0c0c0e', false],
  ametista: ['#c2b9ec', '#8a7cc8', '#463d78', false],
  vinho: ['#8a2a33', '#5c1119', '#2a0609', false],
  noite: ['#4a4760', '#2b2a35', '#121118', false],
  rubi: ['#d0707c', '#a3121f', '#3f060b', false],
  marfim: ['#d6ccb7', '#e6dcc4', '#a79a7c', true],
  bronze: ['#c8a27a', '#8a6a48', '#3b2a1a', false],
  prata: ['#f1f2f5', '#b8bcc6', '#5f636e', true],
  cobalto: ['#7c86c9', '#3a4590', '#141a3d', false],
  musgo: ['#8fa08a', '#4f5f4b', '#1c241b', false],
}
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
// letras de 5×7 para a figura "Inicial"
const LETRAS: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '11111 00100 00100 00100 00100 00100 11111',
  J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
}
type Rgb = [number, number, number]
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

function divisao(d: string, u: number, v: number) {
  if (d === 'partido') return u >= 0.5
  if (d === 'cortado') return v >= 0.5
  if (d === 'quartelado') return u >= 0.5 !== v >= 0.5
  if (d === 'banda') return Math.abs(u - v) < 0.17
  if (d === 'chaveirao') {
    const c = 0.34 + Math.abs(u - 0.5) * 0.96
    return v >= c && v < c + 0.2
  }
  if (d === 'faixa') return v >= 0.4 && v < 0.6
  return false
}

function blit(dst: Uint8ClampedArray, W: number, src: ImageData, cel: number, ix: number, dx: number, dy: number, cada?: (r: number, g: number, b: number) => Rgb) {
  const cols = Math.floor(src.width / cel)
  const sx = (ix % cols) * cel
  const sy = Math.floor(ix / cols) * cel
  for (let y = 0; y < cel; y++)
    for (let x = 0; x < cel; x++) {
      const a = (sy + y) * src.width * 4 + (sx + x) * 4
      const X = dx + x
      const Y = dy + y
      if (!src.data[a + 3] || X < 0 || Y < 0 || X >= W || Y * W * 4 >= dst.length) continue
      const b = Y * W * 4 + X * 4
      const cor = cada ? cada(src.data[a], src.data[a + 1], src.data[a + 2]) : [src.data[a], src.data[a + 1], src.data[a + 2]]
      dst[b] = cor[0]
      dst[b + 1] = cor[1]
      dst[b + 2] = cor[2]
      dst[b + 3] = 255
    }
}

function desenha(S: Folhas, b: Brasao, mini: boolean, necro: boolean) {
  const e = mini ? 2 : 1
  const cw = 72 / e
  const ch = 88 / e
  const orn = !!b.ornamento && b.ornamento !== 'nenhum'
  const W = orn ? 112 / e : cw
  const H = orn ? 112 / e : ch
  const ox = orn ? 20 / e : 0
  const oy = orn ? 12 / e : 0
  const px = new Uint8ClampedArray(W * H * 4)
  const fs = mini ? S.fp : S.f
  if (orn) blit(px, W, mini ? S.op : S.o, 112 / e, BRASAO_ORNAMENTOS.indexOf(b.ornamento!) - 1, 0, 0)
  const iF = Math.max(0, BRASAO_FORMAS.indexOf(b.forma))
  const sx = (iF % 4) * cw
  const sy = Math.floor(iF / 4) * ch
  const mf = S.meta.formas[b.forma] ?? S.meta.formas.escudo
  const rampa = (k: BrasaoCor | null | undefined): Rgb[] => {
    const c = RAMPA[k ?? 'aco'] ?? RAMPA.aco
    const escuro = hex(c[2])
    return [hex(c[0]), hex(c[1]), escuro, escuro.map((v) => v * 0.62) as Rgb]
  }
  const r1 = rampa(b.cor)
  const r2 = rampa(b.cor2 || b.cor)
  const div = b.divisao || 'pleno'
  const lat = mini ? 6 : 12
  const eCampo = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return false
    const a = (sy + y) * fs.width * 4 + (sx + x) * 4
    return fs.data[a + 3] > 0 && fs.data[a] > 200 && fs.data[a + 1] < 60 && fs.data[a + 2] > 200
  }
  const rub: Rgb = [163, 18, 31]
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const a = (sy + y) * fs.width * 4 + (sx + x) * 4
      if (!fs.data[a + 3]) continue
      const d = (oy + y) * W * 4 + (ox + x) * 4
      let c: Rgb
      if (eCampo(x, y)) {
        const u = x / cw
        const v = y / ch
        const seg = divisao(div, u, v)
        const r = seg ? r2 : r1
        const lin = div !== 'pleno' && (divisao(div, (x + 1) / cw, v) !== seg || divisao(div, u, (y + 1) / ch) !== seg)
        const sombra = !eCampo(x - 1, y) || !eCampo(x, y - 1)
        let t = Math.min(2, Math.floor((u * 0.42 + v * 0.58) * 2.3 + (BAYER[y & 3][x & 3] / 16) * 0.7))
        if ((x + y) % lat === 0 || (((x - y) % lat) + lat) % lat === 0) t = Math.min(3, t + 1)
        if (sombra) t = 3
        c = lin ? [10, 10, 14] : r[t]
      } else {
        c = [fs.data[a], fs.data[a + 1], fs.data[a + 2]]
        if (necro) c = c.map((v, i) => v * 0.72 + rub[i] * 0.28) as Rgb
      }
      px[d] = c[0]
      px[d + 1] = c[1]
      px[d + 2] = c[2]
      px[d + 3] = 255
    }
  // figura no centro do campo, na tinta que contrasta com a cor principal
  const clara = (RAMPA[b.cor] ?? RAMPA.aco)[3]
  const tinta: Rgb[] = clara
    ? [[26, 26, 32], [43, 43, 51], [69, 69, 79], [106, 106, 116]]
    : [[107, 99, 87], [186, 176, 159], [236, 229, 216], [255, 248, 234]]
  const mapa = (R: number, G: number, B: number): Rgb => {
    const l = (R + G + B) / 3
    return l < 46 ? [10, 10, 14] : l < 110 ? tinta[0] : l < 165 ? tinta[1] : l < 220 ? tinta[2] : tinta[3]
  }
  const cx = ox + Math.round(mf.cx / e)
  const cy = oy + Math.round(mf.cy / e)
  const fig = b.simbolo || 'inicial'
  if (fig === 'inicial') {
    const L = (LETRAS[String(b.inicial || '?').normalize('NFD')[0]] || LETRAS.A).split(' ')
    const k = mini ? 1 : mf.s >= 30 ? 3 : mf.s >= 14 ? 2 : 1
    const lw = 5 * k
    const lh = 7 * k
    const x0 = cx - Math.floor(lw / 2)
    const y0 = cy - Math.floor(lh / 2)
    const on = (x: number, y: number) => x >= 0 && y >= 0 && x < lw && y < lh && L[Math.floor(y / k)][Math.floor(x / k)] === '1'
    for (let y = -1; y <= lh; y++)
      for (let x = -1; x <= lw; x++) {
        let c: Rgb | null = null
        if (on(x, y)) c = y < k ? tinta[3] : y >= lh - k ? tinta[1] : tinta[2]
        else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) c = [10, 10, 14]
        if (!c) continue
        const d = (y0 + y) * W * 4 + (x0 + x) * 4
        if (d < 0 || d >= px.length) continue
        px[d] = c[0]
        px[d + 1] = c[1]
        px[d + 2] = c[2]
        px[d + 3] = 255
      }
  } else {
    const iG = BRASAO_SIMBOLOS.indexOf(fig) - 1
    const tam = mini ? (mf.s >= 30 ? 20 : 12) : mf.s >= 34 ? 40 : 20
    const src = tam === 40 ? S.g : tam === 20 ? S.gp : S.gpp
    blit(px, W, src, tam, iG, cx - tam / 2, cy - tam / 2, mapa)
  }
  if (necro) {
    // a rachadura e a gota de rubi
    let n = 0
    for (const l of b.inicial || 'N') n += l.charCodeAt(0)
    let x = Math.round(mf.cx / e) + ((n % 5) - 2)
    for (let y = 0; y < ch; y++) {
      if (y % (mini ? 2 : 3) === 0) x += ((y * 7 + n) % 3) - 1
      if (!eCampo(x, y)) continue
      const d = (oy + y) * W * 4 + (ox + x) * 4
      px[d] = 8
      px[d + 1] = 2
      px[d + 2] = 5
      px[d + 3] = 255
      if (!mini && eCampo(x + 1, y)) {
        const f = d + 4
        px[f] = 120
        px[f + 1] = 14
        px[f + 2] = 24
        px[f + 3] = 255
      }
    }
    const G = mini ? ['010', '111', '010'] : ['00100', '01110', '01110', '11111', '11111', '01110']
    const gx = ox + Math.round(mf.cx / e) - (mini ? 1 : 2)
    const gy = oy + Math.min(ch - G.length - (mini ? 3 : 6), Math.round(mf.cy / e) + Math.round(mf.s / e / 2))
    G.forEach((l, yy) =>
      [...l].forEach((q, xx) => {
        if (q !== '1') return
        const d = (gy + yy) * W * 4 + (gx + xx) * 4
        const c = yy < 2 ? [224, 80, 92] : [163, 18, 31]
        px[d] = c[0]
        px[d + 1] = c[1]
        px[d + 2] = c[2]
        px[d + 3] = 255
      }),
    )
  }
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  cv.getContext('2d')!.putImageData(new ImageData(px, W, H), 0, 0)
  return { url: cv.toDataURL(), w: W, h: H }
}

/** O brasão em pixel (`<img class="co-b">`). `k` é a escala inteira; `mini` usa as folhas pequenas. */
export function BrasaoPx({ b, k = 1, mini = false, necro = false, alt = '' }: { b: Brasao; k?: number; mini?: boolean; necro?: boolean; alt?: string }) {
  const pronto = useFolhasBrasao() === 'ok'
  if (!pronto || !FOLHAS) return null
  const chave = JSON.stringify([b.forma, b.cor, b.cor2 ?? null, b.divisao ?? 'pleno', b.simbolo ?? 'inicial', b.ornamento ?? 'nenhum', b.inicial, mini, necro])
  let r = CACHE.get(chave)
  if (!r) {
    r = desenha(FOLHAS, b, mini, necro)
    CACHE.set(chave, r)
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="co-b" src={r.url} width={r.w * k} height={r.h * k} alt={alt} />
}

/* ------------------------------------------------------------------ editor (fundar e redesenhar) */

export type DesenhoBrasao = { forma: BrasaoForma; cor: BrasaoCor; cor2: BrasaoCor | null; divisao: BrasaoDivisao; simbolo: BrasaoSimbolo; ornamento: BrasaoOrnamento }
export const DESENHO_PADRAO: DesenhoBrasao = { forma: 'escudo', cor: 'aco', cor2: null, divisao: 'pleno', simbolo: 'inicial', ornamento: 'nenhum' }

/** As escolhas do brasão, como no protótipo: forma, cor, campo (+ segunda cor), figura e ornamento. */
export function EditorBrasao({ valor, onChange, inicial }: { valor: DesenhoBrasao; onChange: (v: DesenhoBrasao) => void; inicial?: string }) {
  const set = (p: Partial<DesenhoBrasao>) => {
    playSfx('card-select')
    onChange({ ...valor, ...p })
  }
  const mini = (p: Partial<DesenhoBrasao>): Brasao => ({ ...valor, inicial: inicial || 'A', ...p })
  const seg = valor.cor2 ?? BRASAO_CORES.find((c) => c !== valor.cor) ?? 'onix'
  const op = (id: string, atual: string, rot: string, br: Brasao, onClick: () => void) => (
    <button key={id} type="button" className="co-op" aria-pressed={atual === id} aria-label={rot} title={rot} onClick={onClick}>
      <BrasaoPx b={br} mini />
    </button>
  )
  const cores = (atual: BrasaoCor, rot: string, escolhe: (c: BrasaoCor) => void) => (
    <div className="co-cores">
      {BRASAO_CORES.map((k) => {
        const c = RAMPA[k]
        return (
          <button key={k} type="button" aria-pressed={atual === k} aria-label={`${rot}: ${BRASAO_COR[k].rotulo}`} title={BRASAO_COR[k].rotulo} onClick={() => escolhe(k)}>
            <i style={{ '--a': c[0], '--b': c[1], '--c': c[2] } as CSSProperties} />
          </button>
        )
      })}
    </div>
  )
  return (
    <>
      <fieldset>
        <legend>Forma</legend>
        <div className="co-ops">
          {BRASAO_FORMAS.map((f) => op(f, valor.forma, `Forma: ${BRASAO_FORMA_ROTULO[f]}`, mini({ forma: f, ornamento: 'nenhum', simbolo: 'inicial', divisao: 'pleno' }), () => set({ forma: f })))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Cor · {BRASAO_COR[valor.cor].rotulo}</legend>
        {cores(valor.cor, 'Cor', (cor) => set({ cor }))}
      </fieldset>
      <fieldset>
        <legend>Campo · {BRASAO_DIVISAO_ROTULO[valor.divisao]}</legend>
        <div className="co-ops">
          {BRASAO_DIVISOES.map((d) =>
            op(d, valor.divisao, `Campo: ${BRASAO_DIVISAO_ROTULO[d]}`, mini({ forma: 'escudo', divisao: d, cor2: seg, ornamento: 'nenhum', simbolo: 'inicial' }), () =>
              set({ divisao: d, cor2: d === 'pleno' ? null : seg }),
            ),
          )}
        </div>
      </fieldset>
      {valor.divisao !== 'pleno' && (
        <fieldset>
          <legend>Segunda cor · {BRASAO_COR[seg].rotulo}</legend>
          {cores(seg, 'Segunda cor', (cor2) => set({ cor2 }))}
        </fieldset>
      )}
      <fieldset>
        <legend>Figura · {BRASAO_SIMBOLO_ROTULO[valor.simbolo]}</legend>
        <div className="co-ops">
          {BRASAO_SIMBOLOS.map((s) => op(s, valor.simbolo, `Figura: ${BRASAO_SIMBOLO_ROTULO[s]}`, mini({ forma: 'escudo', simbolo: s, ornamento: 'nenhum', divisao: 'pleno' }), () => set({ simbolo: s })))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Ornamento · {BRASAO_ORNAMENTO_ROTULO[valor.ornamento]}</legend>
        <div className="co-ops o">
          {BRASAO_ORNAMENTOS.map((o) => op(o, valor.ornamento, `Ornamento: ${BRASAO_ORNAMENTO_ROTULO[o]}`, mini({ forma: 'escudo', ornamento: o, divisao: 'pleno', simbolo: 'inicial' }), () => set({ ornamento: o })))}
        </div>
      </fieldset>
    </>
  )
}
