import { bip, calmo as calmoAgora, som, type Voz } from './som'

/**
 * Motor das figuras de NPC nas cenas de diálogo (kit3/npc-vn.js, revisado por críticos de animação e aprovado):
 * tudo em pixel de arte inteiro (u), quadro a quadro, nada de rotação, escala ou desfoque no sprite.
 *  - escala inteira; a figura fica presa pela cabeça (trocar de pose não faz o rosto pular);
 *  - respira (sobe 1u e volta); reage ao trocar de pose (pula, susto, treme, tremor, murcha, inclina, ergue, balança);
 *  - texto letra a letra (relógio por tempo), pausas na pontuação e voz curta; o primeiro toque completa;
 *  - entra pela porta (fresta que abre) e sai com o painel que fecha a porta;
 *  - pisca (o retrato só pisca: dono, 06/11; a boca mexe só nos chibis).
 * Com movimento reduzido: sem respiração, reações, letra a letra nem fresta; o nome ganha um sinal (!, #, …, ♪).
 */

const rapido = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('semraf')

type Reacao = { q: [number, number][]; d: number; fica?: boolean }
const REACOES: Record<string, Reacao> = {
  assenta: { q: [[0, 2], [0, 0]], d: 140 },
  susto: { q: [[0, -6], [0, -2], [0, 0]], d: 210 },
  pula: { q: [[0, -4], [0, 0], [0, -2], [0, 0]], d: 320 },
  treme: { q: [[2, 0], [-2, 0], [2, 0], [-2, 0], [1, 0], [0, 0]], d: 240 },
  tremor: { q: [[1, 0], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0], [-1, 0], [0, 0]], d: 480 },
  murcha: { q: [[0, 1], [0, 2], [0, 3]], d: 600, fica: true },
  murchaLenta: { q: [[0, 1], [0, 2], [0, 3]], d: 800, fica: true },
  inclina: { q: [[1, 0], [2, 1], [3, 1]], d: 180, fica: true },
  ergue: { q: [[0, -1]], d: 60, fica: true },
}
const SINAL: Record<string, string> = { susto: '!', treme: '#', tremor: '…', murcha: '…', murchaLenta: '…', balanca: '♪' }

/** Meio da cabeça: mediana x dos pixels opacos numa faixa de 6% a partir do topo do desenho. */
const cabecas = new Map<string, number>()
function cabeca(img: HTMLImageElement) {
  const k = img.src
  if (cabecas.has(k)) return cabecas.get(k)!
  let f = 0.5
  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const x = c.getContext('2d', { willReadFrequently: true })!
    x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, w, h).data
    let topo = 0
    achou: for (; topo < h; topo++) for (let xx = 0; xx < w; xx++) if (d[(topo * w + xx) * 4 + 3] > 100) break achou
    const xs: number[] = []
    for (let yy = topo; yy < Math.min(h, topo + Math.round(h * 0.06)); yy++) for (let xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 100) xs.push(xx)
    if (xs.length) {
      xs.sort((a, b) => a - b)
      f = xs[xs.length >> 1] / w
    }
  } catch {}
  cabecas.set(k, f)
  return f
}

export type Boneco = { fala: (on: boolean) => void } | null
type El = HTMLElement | null
type Opcoes = {
  voz?: Voz | null
  resp?: number
  nome?: () => El
  caixa?: () => El
  rosto?: string | null
  versao?: string
  piscar?: [number, number]
  piscaMs?: number
  bocaMs?: number
  letraMs?: number
  boca?: () => Boneco
}

export type Figura = ReturnType<typeof monta>

export function monta(img: HTMLImageElement, o: Opcoes = {}) {
  const { voz = null, resp = 3, nome = null, caixa = null, rosto = null, versao = '', piscar = [2.5, 6], piscaMs = 110, bocaMs = 110, letraMs = 24, boca = null } = o
  const calmo = calmoAgora()
  const bocaChibi = (on: boolean) => {
    try {
      boca?.()?.fala(on)
    } catch {}
  }
  let u = 1
  let fica: string | null = null
  let balanco: Animation | null = null
  let ultimaPose: string | null = null
  let digitando: { el: HTMLElement; texto: string; fim?: () => void; t: number } | null = null
  let rostoInfo: Record<string, { pisca?: boolean; boca?: boolean }> | null = null
  let olhoFechado = false
  let bocaTrocada = false
  let vivo = true
  let semPiscarAte = 0
  const timers = new Set<number>()
  const depois = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t)
      fn()
    }, ms)
    timers.add(t)
    return t
  }
  const v = versao ? '?v=' + versao : ''
  const rostoPronto = rosto
    ? fetch(rosto + 'anim.json' + v)
        .then((r) => r.json())
        .then((j) => {
          rostoInfo = j
        })
        .catch(() => {})
    : Promise.resolve()
  const nomePose = (src: string) => (src || '').split('?')[0].split('/').pop()!.replace(/\.png$/, '')
  function variante(src: string, olho: boolean, bc: boolean) {
    const n = nomePose(src)
    const i = rostoInfo && rostoInfo[n]
    if (!i) return src
    const suf = [olho && i.pisca ? 'pisca' : '', bc && i.boca ? 'boca' : ''].filter(Boolean).join('-')
    return suf ? `${rosto}${n}-${suf}.png${v}` : src
  }
  function mostraRosto() {
    if (!ultimaPose) return
    const s = variante(ultimaPose, olhoFechado, bocaTrocada)
    if (img.getAttribute('src') !== s) img.src = s
  }
  function variantes(src: string) {
    const n = nomePose(src)
    if (!rostoInfo || !rostoInfo[n]) return []
    return [variante(src, true, false), variante(src, false, true), variante(src, true, true)].filter((x) => x !== src)
  }
  function agendaPisca() {
    if (calmo || !vivo) return
    depois(
      () => {
        if (!img.hidden && ultimaPose && performance.now() >= semPiscarAte) {
          olhoFechado = true
          mostraRosto()
          const dupla = Math.random() < 0.15
          depois(() => {
            olhoFechado = false
            mostraRosto()
            if (dupla)
              depois(() => {
                if (performance.now() < semPiscarAte) return
                olhoFechado = true
                mostraRosto()
                depois(() => {
                  olhoFechado = false
                  mostraRosto()
                }, piscaMs)
              }, piscaMs * 1.4)
          }, piscaMs)
        }
        agendaPisca()
      },
      (piscar[0] + Math.random() * (piscar[1] - piscar[0])) * 1000,
    )
  }
  agendaPisca()
  const respAt = -Math.random() * resp
  // escala inteira: no busto arredonda para cima (a parte de baixo fica atrás da caixa, cortada 8u abaixo do topo dela)
  function escala() {
    if (!img.naturalHeight || img.hidden) return
    img.style.height = ''
    img.style.clipPath = ''
    const alvo = img.getBoundingClientRect().height || parseFloat(getComputedStyle(img).height)
    const busto = !img.classList.contains('inteiro') && !img.classList.contains('longe')
    const dpr = devicePixelRatio || 1
    const r = (alvo * dpr) / img.naturalHeight
    const k = Math.max(1, busto ? Math.ceil(r) : Math.floor(r)) / dpr
    u = k
    const H = img.naturalHeight * k
    img.style.height = H + 'px'
    img.style.setProperty('--u', k + 'px')
    img.style.translate = `${-cabeca(img) * 100}% 0`
    const cx = caixa?.()
    if (busto && cx) {
      const top = img.getBoundingClientRect().top
      const corte = cx.getBoundingClientRect().top + 8 * u - top
      img.style.clipPath = `inset(0 0 ${Math.max(0, H - corte)}px 0)`
    }
  }
  const ro = new ResizeObserver(() => {
    escala()
    if (fica) aplica(fica, true)
  })
  ro.observe(document.documentElement)
  {
    const cx = caixa?.()
    if (cx) ro.observe(cx)
  }
  img.style.imageRendering = 'pixelated'
  const anims = (id: string) => img.getAnimations().filter((a) => a.id === id)
  function respira(on: boolean) {
    anims('resp').forEach((a) => a.cancel())
    if (!on || calmo) return
    const st = 'steps(1,end)'
    const a = img.animate(
      [
        { transform: 'translateY(0)', offset: 0, easing: st },
        { transform: 'translateY(0)', offset: 0.55, easing: st },
        { transform: `translateY(${-u}px)`, offset: 0.6, easing: st },
        { transform: `translateY(${-u}px)`, offset: 0.95, easing: st },
        { transform: 'translateY(0)', offset: 1 },
      ],
      { duration: resp * 1000, iterations: Infinity, easing: 'linear', composite: 'add', delay: respAt * 1000 },
    )
    a.id = 'resp'
  }
  function aplica(r: string, instante = false) {
    const R = REACOES[r]
    if (!R) return
    anims('reage').forEach((a) => a.cancel())
    const q = R.q.map(([x, y]) => ({ transform: `translate(${x * u}px,${y * u}px)` }))
    const a = img.animate(instante ? [q[q.length - 1], q[q.length - 1]] : [...q, q[q.length - 1]], {
      duration: instante ? 1 : R.d,
      easing: `steps(${instante ? 1 : q.length},end)`,
      fill: R.fica ? 'forwards' : 'none',
      composite: 'add',
    })
    a.id = 'reage'
    fica = R.fica ? r : null
  }
  function solta() {
    if (!fica) return
    const R = REACOES[fica]
    const [x, y] = R.q[R.q.length - 1]
    fica = null
    anims('reage').forEach((a) => a.cancel())
    const a = img.animate(
      [{ transform: `translate(${x * u}px,${y * u}px)` }, { transform: `translate(${(x * u) / 2}px,${(y * u) / 2}px)` }, { transform: 'translate(0,0)' }],
      { duration: 200, easing: 'steps(2,end)', composite: 'add' },
    )
    a.id = 'reage'
  }
  function balanca(on: boolean) {
    if (balanco) {
      balanco.cancel()
      balanco = null
    }
    if (!on || calmo) return
    balanco = img.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${u}px)` }, { transform: 'translateX(0)' }, { transform: `translateX(${-u}px)` }, { transform: 'translateX(0)' }],
      { duration: 1600, iterations: Infinity, easing: 'steps(4,end)', composite: 'add' },
    )
  }
  function sinal(r: string) {
    const el = nome?.()
    if (el) el.dataset.sinal = calmo && SINAL[r] ? SINAL[r] : ''
  }
  const carregadas = new Map<string, Promise<void>>()
  const espera = (im: HTMLImageElement, ms = 1200) =>
    new Promise<void>((ok) => {
      if (im.complete && im.naturalWidth) return ok()
      const t = setTimeout(ok, ms)
      im.addEventListener('load', () => (clearTimeout(t), ok()), { once: true })
      im.addEventListener('error', () => (clearTimeout(t), ok()), { once: true })
    })
  function precarrega(srcs: string[]) {
    const um = (s: string) => {
      if (carregadas.has(s)) return
      const i = new Image()
      i.src = s
      carregadas.set(s, espera(i))
    }
    srcs.forEach(um)
    if (rosto) void rostoPronto.then(() => srcs.forEach((s) => variantes(s).forEach(um)))
  }
  async function pose(src: string, { reage = null, mesma = false }: { reage?: string | null; mesma?: boolean } = {}) {
    if (!carregadas.has(src)) precarrega([src])
    await carregadas.get(src)
    const nova = src !== ultimaPose
    if (nova) {
      olhoFechado = false
      bocaTrocada = false
      ultimaPose = src
      semPiscarAte = performance.now() + ((reage && REACOES[reage]?.d) || 0) + 400
      if (img.getAttribute('src') !== src) img.src = src
      await espera(img, 600)
      escala()
    }
    if (!mesma && (nova || reage)) {
      if (fica && reage !== fica) solta()
      const r = reage || 'assenta'
      balanca(r === 'balanca')
      sinal(r)
      if (r !== 'balanca' && r !== 'nada' && !calmo) aplica(r)
    }
  }
  function fala(el: HTMLElement, texto: string, fim?: () => void, { comVoz = true }: { comVoz?: boolean } = {}) {
    completa(true)
    if (calmo || rapido()) {
      el.textContent = texto
      fim?.()
      return
    }
    let i = 0
    let proxima = performance.now()
    let letras = 0
    let bocaPasso = bocaMs
    let bocaT = 0
    el.textContent = ''
    const pausa = (ch: string) => (ch === ',' ? 90 : '.!?'.includes(ch) ? 220 : ch === '…' ? 300 : 0)
    digitando = { el, texto, fim, t: 0 }
    const passo = (t: number) => {
      if (!digitando) return
      let bipou = false
      while (i < texto.length && t >= proxima) {
        const ch = texto[i++]
        el.textContent = texto.slice(0, i)
        proxima += letraMs + pausa(ch)
        if (comVoz && voz && !bipou && /[A-Za-zÀ-ú0-9]/.test(ch) && ++letras % voz.cada === 0) {
          bip(voz)
          bipou = true
        }
        if (comVoz) bocaChibi(!pausa(ch))
        if (comVoz && rostoInfo) {
          if (pausa(ch)) {
            if (bocaTrocada) {
              bocaTrocada = false
              mostraRosto()
            }
          } else if (/[A-Za-zÀ-ú0-9]/.test(ch) && t - bocaT >= bocaPasso) {
            bocaT = t
            bocaPasso = bocaMs * (0.75 + Math.random() * 0.5)
            bocaTrocada = !bocaTrocada
            mostraRosto()
          }
        }
      }
      if (i >= texto.length) {
        const f = digitando.fim
        digitando = null
        bocaChibi(false)
        if (bocaTrocada) {
          bocaTrocada = false
          mostraRosto()
        }
        f?.()
        return
      }
      digitando.t = window.setTimeout(() => passo(performance.now()), 16)
    }
    digitando.t = window.setTimeout(() => passo(performance.now()), 16)
  }
  function completa(silencio = false) {
    if (!digitando) return false
    clearTimeout(digitando.t)
    const { el, texto, fim } = digitando
    digitando = null
    bocaChibi(false)
    if (bocaTrocada) {
      bocaTrocada = false
      mostraRosto()
    }
    if (!silencio) {
      el.textContent = texto
      fim?.()
    }
    return true
  }
  async function entra(tipo: 'porta') {
    if (tipo === 'porta' && !calmo) {
      som('range')
      const a = img.animate([{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, easing: 'steps(6,end)' })
      await a.finished.catch(() => {})
    }
  }
  async function sai(tipo: 'porta', palco?: HTMLElement) {
    if (tipo === 'porta') {
      som('baque')
      if (!calmo && palco) {
        const p = document.createElement('i')
        p.className = 'npc-porta'
        palco.append(p)
        await p.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 360, easing: 'steps(4,end)' }).finished.catch(() => {})
        setTimeout(() => p.remove(), 40)
      }
    }
    balanca(false)
  }
  function mostra(on: boolean) {
    img.hidden = !on
    if (on) {
      olhoFechado = false
      bocaTrocada = false
      mostraRosto()
      escala()
      respira(true)
    } else respira(false)
  }
  function destroi() {
    vivo = false
    timers.forEach(clearTimeout)
    timers.clear()
    completa(true)
    ro.disconnect()
    img.getAnimations().forEach((a) => a.cancel())
    balanco = null
  }
  return {
    pose,
    fala,
    completa,
    entra,
    sai,
    mostra,
    precarrega,
    destroi,
    escala,
    respira,
    get digitando() {
      return !!digitando
    },
  }
}

/* rostinho na caixa (dono, 06/11: "Rosto na caixa"): a cabeça da pose atual, recortada da própria arte, sempre 76 px */
const recortes = new Map<string, Promise<string | null>>()
function recorte(src: string) {
  if (recortes.has(src)) return recortes.get(src)!
  const p = new Promise<string | null>((ok) => {
    const im = new Image()
    im.onload = () => {
      const w = im.naturalWidth
      const h = im.naturalHeight
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const x = c.getContext('2d', { willReadFrequently: true })!
      x.drawImage(im, 0, 0)
      const d = x.getImageData(0, 0, w, h).data
      let topo = 0
      achou: for (; topo < h; topo++) for (let xx = 0; xx < w; xx++) if (d[(topo * w + xx) * 4 + 3] > 100) break achou
      const fim = Math.min(h, topo + Math.round(h * 0.2))
      let sx = 0
      let sy = 0
      let n = 0
      for (let yy = topo; yy < fim; yy++)
        for (let xx = 0; xx < w; xx++) {
          const i = (yy * w + xx) * 4
          if (d[i + 3] > 100 && d[i] - d[i + 2] > 25 && d[i] > 110 && d[i + 1] > 60) {
            sx += xx
            sy += yy
            n++
          }
        }
      const z = Math.max(1, Math.round((h * 0.19) / 76))
      const S = 76 * z
      const cx = n ? sx / n : w / 2
      const cy = n ? sy / n : topo + S / 2
      const o = document.createElement('canvas')
      o.width = o.height = S
      o.getContext('2d')!.drawImage(im, Math.round(cx - S / 2), Math.round(cy - S * 0.45), S, S, 0, 0, S, S)
      ok(o.toDataURL())
    }
    im.onerror = () => ok(null)
    im.src = src
  })
  recortes.set(src, p)
  return p
}
export const preRostos = (srcs: string[]) => srcs.forEach(recorte)
export async function rostinho(el: (HTMLElement & { _pedido?: number }) | null, src: string | null, { px = 76 }: { px?: number } = {}) {
  if (!el) return
  const meu = (el._pedido = (el._pedido || 0) + 1)
  if (!src) {
    el.hidden = true
    return
  }
  const url = await recorte(src)
  if (meu !== el._pedido || !url) return
  el.style.backgroundImage = `url(${url})`
  el.style.width = el.style.height = px + 'px'
  el.style.backgroundSize = '100% 100%'
  el.hidden = false
}
