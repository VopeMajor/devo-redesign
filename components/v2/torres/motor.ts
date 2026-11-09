import type { Aparencia } from '@/lib/devo/casa-aparencia'
import type { AndarEstado, Efeito, NpcRef, Passo, SubirResposta, TorreEstado } from '@/lib/devo/torres/tipos'
import { ANDAR_BOB, COL, folhaAndarFofo, PX_QUADRO } from '../casa/avatar-cor'
import { criaChibi, type ChibiNpc } from '../casa/npc-chibi'
import { calmo as calmoAgora, destravaSom, passo as passoSom } from '../casa/som'
import { ANFITRIOES, ARTE, ARTE_V, rostoSrc } from './anfitrioes'
import { tocaCena } from './cena'

/**
 * Torres de Ruptura em pixel no jogo (kit3/torres.html, aprovado pelo dono em 07/11: "Aprovo"), no mesmo motor e
 * acabamento da Casa: a ilha em 768x512 em escala inteira, o seu chibi andando por A* numa grade de 6 px, a câmera
 * que segue e deixa olhar arrastando, as portas das torres com o losango, a seta na borda, o cartão embaixo e a
 * bolsa com as essências e as chaves. Dentro da torre, a escada em espiral com um marcador por andar.
 * 1º andar: o encontro, diálogo longo com o retrato grande; os outros: conversa curta no patamar, com os chibis.
 * Os dados e as regras são do servidor (/api/torres): o motor só mostra e pede (subir, efeitos da cena).
 */

type Pt = [number, number]
type Porta = { x: number; y: number; ir: Pt }
type Ponto = Porta & {
  id: string
  curto: string
  titulo: string
  sub?: string
  rosto?: string | null
  texto: string
  acao: string
  faz: () => void
}

export type Premio = { titulo: string; nome: string; texto: string; cor: string }

export type TorresMotorOpcoes = {
  torres: TorreEstado[]
  aparencia: Aparencia
  /** Nome e gênero do jogador nos marcadores das falas. */
  texto: (s: string) => string
  /** Paga e registra o andar no servidor. Erro: a mensagem para o aviso. */
  onSubir: (torre: string, andar: number) => Promise<SubirResposta | { erro: string }>
  onCasa: () => void
}

const W = 768
const H = 512
const SEL = (p: Pt[]): Pt[] => p.map(([x, y]) => [x / 2, y / 2])
/** Portas medidas na arte original de 1536x1024 (kit3/torres.html). */
const PORTAS: Record<string, Porta> = {
  casa: { x: 428, y: 790, ir: [440, 860] },
  campanha: { x: 810, y: 330, ir: [810, 410] },
  imperador: { x: 395, y: 400, ir: [400, 470] },
  observatorio: { x: 1205, y: 395, ir: [1215, 465] },
  picadeiro: { x: 1235, y: 770, ir: [1235, 845] },
}
const CHAO = SEL([[40, 480], [180, 430], [560, 400], [600, 350], [1020, 350], [1100, 440], [1470, 420], [1490, 700], [1330, 830], [1100, 890], [700, 950], [420, 900], [170, 870], [60, 830]])
const BLOQUEIOS = (
  [
    [[150, 520], [580, 520], [585, 820], [400, 840], [150, 845]],
    [[200, 160], [495, 160], [495, 450], [200, 450]],
    [[590, 0], [1020, 0], [1020, 385], [590, 385]],
    [[1095, 160], [1395, 160], [1395, 445], [1095, 445]],
    [[1065, 450], [1420, 450], [1425, 805], [1075, 805]],
    [[80, 340], [205, 340], [205, 520], [80, 520]],
    [[820, 600], [930, 600], [930, 690], [820, 690]],
    [[690, 840], [800, 840], [800, 920], [690, 920]],
  ] as Pt[][]
).map(SEL)
/** Cor da essência de cada torre (bolsa, prêmio). */
const COR: Record<string, string> = { campanha: '#b9a3e8', imperador: '#d9b65c', observatorio: '#8fc7d6', picadeiro: '#d98a8a' }
const cor = (id: string) => COR[id] ?? '#b9a3e8'
/** Centro de cada patamar na arte de 1024x1536 do interior, de baixo para cima. */
const PATAMAR: Pt[] = [[560, 1100], [560, 915], [560, 735], [560, 555], [560, 375], [560, 195]]
const PASSO = 6
const GW = Math.ceil(W / PASSO)
const GH = Math.ceil(H / PASSO)
const TIQUE = 0.08

const limpa = (t: string | null | undefined) => String(t ?? '').replace(/^\[PROVISÓRIO\]\s*/, '')
const semProvisoria = (t: string) => t.replace(/\s*\(provisória\)/, '')
const essencias = (n: number) => `${n} ${n === 1 ? 'Essência' : 'Essências'}`

function dentro(x: number, y: number, p: Pt[]) {
  let c = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c
  }
  return c
}

const ESQUELETO = `
<div class="tv-vista" aria-label="Ilha das Torres. Toque no chão para andar.">
  <div class="tv-mundo"><div class="tv-fundo"></div><div class="tv-nevoa" aria-hidden="true"></div><div class="tv-alvo"></div></div>
</div>
<div class="tv-bolsa" aria-label="Essências e chaves"></div>
<button class="tv-lista-bt" aria-haspopup="dialog">Torres</button>
<div class="tv-dica">Toque no chão para andar</div>
<div class="tv-aviso" hidden role="status"></div>
<section class="tv-lista" hidden role="dialog" aria-label="As torres">
  <header><h2>Torres de Ruptura</h2><button class="tv-l-fechar" aria-label="Fechar">✕</button></header>
  <div class="tv-l-itens"></div>
</section>
<section class="tv-torre" hidden aria-label="Dentro da torre">
  <div class="tv-t-topo"><button class="tv-t-sair" aria-label="Sair da torre">‹</button><div class="tv-t-nome"></div></div>
  <div class="tv-t-vista"><div class="tv-t-palco"><div class="tv-t-arte"></div></div></div>
</section>
<div class="tv-patamar" hidden aria-hidden="true"><div class="tv-pa-mundo"></div></div>
<section class="tv-cartao" hidden aria-live="polite"><h2 class="c-tit"></h2><p class="c-txt"></p><div class="c-mais"></div><div class="c-acoes"></div></section>
<section class="tv-premio" hidden role="dialog" aria-label="Prêmio do andar" tabindex="-1"><i aria-hidden="true"></i><small></small><strong></strong><p></p></section>
<div class="tv-fim"></div>`

export function criaTorres(raiz: HTMLElement, o: TorresMotorOpcoes) {
  raiz.innerHTML = ESQUELETO
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => raiz.querySelector(s) as T
  const calmo = calmoAgora()
  let vivo = true
  const timers = new Set<number>()
  const depois = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t)
      if (vivo) fn()
    }, ms)
    timers.add(t)
    return t
  }
  let torres = o.torres
  const mundo = $('.tv-mundo')
  $('.tv-fundo').style.backgroundImage = `url(${ARTE}mapa.png?v=${ARTE_V})`
  $('.tv-t-arte').style.backgroundImage = `url(${ARTE}interior.png?v=${ARTE_V})`

  /* ---------- caminho: A* numa grade de 6 px, sem cortar quina ---------- */
  const grade = new Uint8Array(GW * GH)
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      const x = i * PASSO + 3
      const y = j * PASSO + 3
      grade[j * GW + i] = dentro(x, y, CHAO) && !BLOQUEIOS.some((b) => dentro(x, y, b)) ? 1 : 0
    }
  const livre = (i: number, j: number) => i >= 0 && j >= 0 && i < GW && j < GH && grade[j * GW + i] === 1
  function maisPerto(x: number, y: number): Pt | null {
    let m: Pt | null = null
    let d = 1e9
    for (let j = 0; j < GH; j++)
      for (let i = 0; i < GW; i++)
        if (livre(i, j)) {
          const v = (i * PASSO + 3 - x) ** 2 + (j * PASSO + 3 - y) ** 2
          if (v < d) {
            d = v
            m = [i, j]
          }
        }
    return m
  }
  function acha(de: Pt, para: Pt): Pt[] {
    const a = maisPerto(...de)
    const b = maisPerto(...para)
    if (!a || !b) return []
    const id = (i: number, j: number) => j * GW + i
    const g = new Map<number, number>([[id(...a), 0]])
    const veio = new Map<number, Pt>()
    const aberto: [number, number, number][] = [[a[0], a[1], 0]]
    while (aberto.length) {
      let k = 0
      for (let n = 1; n < aberto.length; n++) if (aberto[n][2] < aberto[k][2]) k = n
      const [i, j] = aberto.splice(k, 1)[0]
      if (i === b[0] && j === b[1]) break
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const u = i + dx
        const v = j + dy
        if (!livre(u, v)) continue
        if (dx && dy && (!livre(i + dx, j) || !livre(i, j + dy))) continue
        const n = g.get(id(i, j))! + Math.hypot(dx, dy)
        if (!g.has(id(u, v)) || n < g.get(id(u, v))!) {
          g.set(id(u, v), n)
          veio.set(id(u, v), [i, j])
          aberto.push([u, v, n + Math.hypot(u - b[0], v - b[1])])
        }
      }
    }
    if (!g.has(id(...b))) return []
    const c: Pt[] = []
    let p: Pt | undefined = b
    while (p) {
      c.unshift([p[0] * PASSO + 3, p[1] * PASSO + 3])
      p = veio.get(id(...p))
    }
    return alisa(c)
  }
  function visivel(a: Pt, b: Pt) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)
    for (let k = 0; k <= n; k++) {
      const x = a[0] + ((b[0] - a[0]) * k) / n
      const y = a[1] + ((b[1] - a[1]) * k) / n
      if (!livre(Math.floor(x / PASSO), Math.floor(y / PASSO))) return false
    }
    return true
  }
  function alisa(c: Pt[]) {
    if (c.length < 3) return c
    const r = [c[0]]
    let i = 0
    while (i < c.length - 1) {
      let j = c.length - 1
      while (j > i + 1 && !visivel(c[i], c[j])) j--
      r.push(c[j])
      i = j
    }
    return r
  }

  /* ---------- seu chibi e a câmera ---------- */
  const sombra = Object.assign(document.createElement('div'), { className: 'sombra' })
  const ator = Object.assign(document.createElement('div'), { className: 'ator' })
  mundo.append(sombra, ator)
  const eu = { x: 0, y: 0, dir: 3, rota: [] as Pt[], aoChegar: null as null | (() => void) }
  let esc = 1
  const cam = { x: 0, y: 0 }
  const camG = { x: 0, y: 0 }
  let olha = { x: 0, y: 0 }
  const limita = (v: number, lado: number, tela: number, sobra = 0) => (lado <= tela ? (tela - lado) / 2 - sobra : Math.min(0, Math.max(tela - lado, v)))
  const medida = () => {
    esc = Math.max(1, Math.floor(Math.min(raiz.clientWidth / W, raiz.clientHeight / H)))
  }
  function camera(dt: number) {
    const vw = raiz.clientWidth
    const vh = raiz.clientHeight
    const mw = W * esc
    const mh = H * esc
    const foco: Pt = [Math.round(eu.x), Math.round(eu.y) - 40]
    // o espaço de baixo fica livre para o cartão e a bolsa, então a cena sobe um pouco no celular
    const sobe = vh > mh + 120 ? 46 : 0
    const rx = vw / 2 - foco[0] * esc + olha.x
    const ry = vh / 2 - foco[1] * esc + olha.y - sobe
    const x = limita(rx, mw, vw)
    const y = limita(ry, mh, vh, sobe)
    // o que passa do limite não acumula: soltar o dedo não deixa uma zona morta
    olha.x += x - rx
    olha.y += y - ry
    const perto = Math.abs(x - cam.x) < 2 * esc && Math.abs(y - cam.y) < 2 * esc
    const k = dt === 0 || calmo || (perto && eu.rota.length) ? 1 : Math.min(1, dt * (eu.rota.length ? 9 : 7))
    cam.x += (x - cam.x) * k
    cam.y += (y - cam.y) * k
    // a câmera anda na grade do pixel da arte: o chibi e o chão andam juntos, sem tremer
    camG.x = Math.round(cam.x / esc) * esc
    camG.y = Math.round(cam.y / esc) * esc
    mundo.style.transform = `translate(${camG.x}px,${camG.y}px) scale(${esc})`
  }
  function anda(p: Pt, aoChegar?: () => void) {
    clearTimeout(cartaoT)
    const c = acha([eu.x, eu.y], p)
    olha = { x: 0, y: 0 }
    eu.rota = c.length ? c.slice(1) : []
    eu.aoChegar = aoChegar || null
    if (!eu.rota.length && aoChegar) {
      eu.aoChegar = null
      aoChegar()
    }
  }

  /* ---------- portas, setas e cartão ---------- */
  function pontos(): Ponto[] {
    const casa: Ponto = { id: 'casa', curto: 'Casa', titulo: 'Sua casa', sub: 'Porta de entrada', texto: 'Volta para dentro de casa.', acao: 'Entrar em casa', faz: () => sai(o.onCasa), ...PORTAS.casa }
    return [
      casa,
      ...torres
        .filter((t) => PORTAS[t.id])
        .map((t) => ({
          id: t.id,
          curto: limpa(t.nome).replace(/^Torre (do |da )?/, ''),
          titulo: limpa(t.nome),
          sub: `${t.npc.nome} · ${limpa(t.npc.titulo)}`,
          rosto: rostoSrc(t.npc.id),
          texto: `${limpa(t.descricao)} Andares: ${t.concluidos} de ${t.andares.length}.`.trim(),
          acao: 'Entrar',
          faz: () => entraTorre(t.id),
          ...PORTAS[t.id],
        })),
    ]
  }
  let setas: { el: HTMLButtonElement; p: Ponto }[] = []
  let pts: HTMLElement[] = []
  function pintaPontos() {
    pts.forEach((e) => e.remove())
    setas.forEach((s) => s.el.remove())
    const lista = pontos()
    setas = lista.map((p) => {
      const el = document.createElement('button')
      el.className = 'tv-seta'
      el.setAttribute('aria-label', 'Ir até: ' + p.titulo)
      el.append(document.createElement('span'), p.curto)
      el.onclick = () => escolhe(p)
      raiz.querySelector('.tv-vista')!.after(el)
      return { el, p }
    })
    pts = lista.map((p) => {
      const b = document.createElement('button')
      b.className = 'ponto' + (p.id === 'casa' ? ' casa' : '')
      b.style.left = Math.round(p.x / 2) + 'px'
      b.style.top = Math.round(p.y / 2) + 'px'
      b.style.zIndex = '900'
      b.setAttribute('aria-label', p.titulo)
      b.innerHTML = '<i></i>'
      b.addEventListener('pointerdown', (e) => e.stopPropagation())
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        escolhe(p)
      })
      mundo.append(b)
      return b
    })
  }
  function posicionaSetas() {
    const vw = raiz.clientWidth
    const vh = raiz.clientHeight
    for (const { el, p } of setas) {
      const sx = Math.round(p.x / 2) * esc + camG.x
      const sy = Math.round(p.y / 2) * esc + camG.y
      const fora = sx < 6 ? 'e' : sx > vw - 6 ? 'd' : ''
      el.classList.toggle('on', !!fora)
      if (!fora) continue
      ;(el.firstChild as HTMLElement).textContent = fora === 'e' ? '◂' : '▸'
      el.style.left = fora === 'e' ? '8px' : 'auto'
      el.style.right = fora === 'd' ? '8px' : 'auto'
      el.style.top = Math.round(Math.min(vh - 130, Math.max(60, sy - 24))) + 'px'
    }
    // duas setas do mesmo lado não se encostam: a de baixo desce
    for (const lado of ['8px', 'auto']) {
      const doLado = setas.filter(({ el }) => el.classList.contains('on') && el.style.left === lado).sort((a, b) => parseFloat(a.el.style.top) - parseFloat(b.el.style.top))
      for (let k = 1; k < doLado.length; k++) {
        const min = parseFloat(doLado[k - 1].el.style.top) + 56
        if (parseFloat(doLado[k].el.style.top) < min) doLado[k].el.style.top = min + 'px'
      }
    }
  }
  const viraPara = (x: number, y: number) => {
    const dx = x - eu.x
    const dy = y - eu.y
    eu.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3
  }
  let cartaoT = 0
  function escolhe(p: Ponto) {
    $('.tv-dica').hidden = true
    fechaCartao()
    $('.tv-lista').hidden = true
    anda(SEL([p.ir])[0], () => {
      viraPara(p.x / 2, p.y / 2)
      cartaoT = depois(() => abreCartao({ titulo: p.titulo, sub: p.sub, rosto: p.rosto, texto: p.texto, acao: p.acao, faz: p.faz }), 160)
    })
  }
  type Cartao = { titulo: string; sub?: string; rosto?: string | null; texto: string; mais?: string[]; acao?: string; desligado?: boolean; faz?: () => void }
  function abreCartao(c: Cartao) {
    const tit = $('.c-tit')
    tit.textContent = ''
    if (c.rosto) {
      const im = document.createElement('img')
      im.src = c.rosto
      im.alt = ''
      tit.append(im)
    }
    const s = document.createElement('span')
    s.textContent = c.titulo
    if (c.sub) {
      const sm = document.createElement('small')
      sm.textContent = c.sub
      s.append(sm)
    }
    tit.append(s)
    $('.c-txt').textContent = c.texto
    const mais = $('.c-mais')
    mais.textContent = ''
    for (const m of c.mais ?? []) {
      const l = document.createElement('small')
      l.textContent = m
      mais.append(l)
    }
    const a = $('.c-acoes')
    a.innerHTML = ''
    if (c.acao) {
      const b = document.createElement('button')
      b.textContent = c.acao
      b.disabled = !!c.desligado
      b.onclick = () => {
        if (b.disabled) return
        c.faz?.()
      }
      a.append(b)
    }
    const v = document.createElement('button')
    v.textContent = c.acao ? 'Agora não' : 'Entendi'
    if (c.acao) v.className = 'fraco'
    v.onclick = fechaCartao
    a.append(v)
    $('.tv-cartao').hidden = false
    ;((a.querySelector('button:not(:disabled)') as HTMLButtonElement | null) ?? v).focus({ preventScroll: true })
  }
  const fechaCartao = () => {
    clearTimeout(cartaoT)
    $('.tv-cartao').hidden = true
  }
  let avisoT = 0
  function aviso(t: string, ms = 2200) {
    const el = $('.tv-aviso')
    el.textContent = t
    el.hidden = false
    clearTimeout(avisoT)
    avisoT = depois(() => (el.hidden = true), ms)
  }
  /** Escurece em 5 quadros, troca a vista e clareia. */
  function sai(fn: () => void) {
    const f = $('.tv-fim')
    f.style.opacity = '1'
    depois(
      () => {
        fn()
        f.style.opacity = '0'
      },
      calmo ? 0 : 260,
    )
  }

  /* ---------- bolsa e lista das torres ---------- */
  function pintaBolsa() {
    const b = $('.tv-bolsa')
    b.textContent = ''
    for (const t of torres) {
      const s = document.createElement('span')
      s.style.setProperty('--c', cor(t.id))
      s.title = semProvisoria(t.essencia.nome)
      s.setAttribute('aria-label', `${semProvisoria(t.essencia.nome)}: ${t.essencia.quantidade}`)
      s.append(document.createElement('i'), String(t.essencia.quantidade))
      b.append(s)
    }
    for (const t of torres) {
      if (!t.chave?.quantidade) continue
      const s = document.createElement('span')
      s.className = 'chave'
      s.title = t.chave.nome
      s.setAttribute('aria-label', `${t.chave.nome}: ${t.chave.quantidade}`)
      s.append(document.createElement('i'), String(t.chave.quantidade))
      b.append(s)
    }
  }
  function abreLista() {
    fechaCartao()
    const box = $('.tv-l-itens')
    box.textContent = ''
    for (const t of torres) {
      const b = document.createElement('button')
      b.className = 'tv-l-item'
      const r = rostoSrc(t.npc.id)
      const f = document.createElement(r ? 'img' : 'i')
      if (r) Object.assign(f as HTMLImageElement, { src: r, alt: '' })
      else f.textContent = '?'
      const s = document.createElement('span')
      s.textContent = limpa(t.nome)
      const sm = document.createElement('small')
      sm.textContent = `${t.npc.nome} · ${t.concluidos} de ${t.andares.length} andares`
      s.append(sm)
      b.append(f, s)
      b.onclick = () => {
        const p = pontos().find((x) => x.id === t.id)
        if (p) escolhe(p)
        else {
          // torre nova sem porta no mapa: entra direto
          $('.tv-lista').hidden = true
          entraTorre(t.id)
        }
      }
      box.append(b)
    }
    $('.tv-lista').hidden = false
    $('.tv-l-fechar').focus({ preventScroll: true })
  }

  /* ---------- dentro da torre ---------- */
  let torreId: string | null = null
  const torreAtual = () => (torreId ? torres.find((t) => t.id === torreId) ?? null : null)
  let emCena = false
  function entraTorre(id: string) {
    fechaCartao()
    sai(() => {
      torreId = id
      $('.tv-torre').hidden = false
      pintaTorre(true)
    })
  }
  function saiTorre() {
    fechaCartao()
    sai(() => {
      torreId = null
      $('.tv-torre').hidden = true
      pintaPontos()
    })
  }
  let escT = 1
  function pintaTorre(rola = false) {
    const t = torreAtual()
    if (!t) return
    const nome = $('.tv-t-nome')
    nome.textContent = limpa(t.nome)
    const sm = document.createElement('small')
    sm.textContent = `${semProvisoria(t.essencia.nome)}: ${t.essencia.quantidade}`
    nome.append(sm)
    const arte = $('.tv-t-arte')
    arte.textContent = ''
    const v = $('.tv-t-vista')
    // escala inteira; num lugar estreito a arte fica cortada dos lados, centrada na escada
    escT = v.clientWidth >= 1100 && v.clientHeight >= 900 ? 2 : 1
    const aw = 512 * escT
    const left = aw <= v.clientWidth ? Math.round((v.clientWidth - aw) / 2) : Math.round(Math.min(0, Math.max(v.clientWidth - aw, v.clientWidth / 2 - 280 * escT)))
    arte.style.transform = `translate(${left}px,0) scale(${escT})`
    arte.parentElement!.style.height = 768 * escT + 'px'
    let atual: HTMLElement | null = null
    t.andares.forEach((a, n) => {
      const pos = PATAMAR[Math.min(n, PATAMAR.length - 1)]
      const acima = Math.max(0, n - (PATAMAR.length - 1))
      const est = a.estado === 'concluido' ? 'feito' : a.estado === 'atual' ? 'prox' : 'fechado'
      const b = document.createElement('button')
      b.className = 'tv-andar ' + est
      b.style.left = pos[0] / 2 + 'px'
      b.style.top = pos[1] / 2 - 44 * acima + 'px'
      const num = document.createElement('b')
      num.textContent = String(a.n)
      b.append(num, `${est === 'feito' ? '✓ ' : ''}${limpa(a.titulo)}`)
      b.setAttribute('aria-label', `Andar ${a.n}: ${limpa(a.titulo)}. ${est === 'feito' ? 'Concluído' : est === 'prox' ? 'Próximo' : 'Trancado'}`)
      b.onclick = () => cartaoAndar(t, a)
      arte.append(b)
      if (est === 'prox') atual = b
    })
    if (rola) {
      const y = atual ? parseFloat((atual as HTMLElement).style.top) * escT : 768 * escT
      v.scrollTop = Math.max(0, y - v.clientHeight * 0.6)
    }
  }
  function cartaoAndar(t: TorreEstado, a: AndarEstado) {
    const base = { titulo: `Andar ${a.n} · ${limpa(a.titulo)}`, sub: semProvisoria(t.essencia.nome), rosto: rostoSrc(a.npc.id) }
    if (a.estado === 'concluido')
      return abreCartao({ ...base, texto: 'Você já subiu este andar.', ...(a.cena?.length ? { acao: 'Rever a cena', faz: () => (fechaCartao(), cenaAndar(t, a, a.cena!, null)) } : {}) })
    if (a.estado === 'trancado') return abreCartao({ ...base, texto: 'Suba os andares de baixo primeiro.' })
    const mais: string[] = []
    for (const c of a.chaves) mais.push(`Pede ${c.quantidade} ${c.nome} (você tem ${c.tem})${a.gastaChaves ? '; as chaves são gastas' : ''}.`)
    const premio = [...(a.recompensas.chaves && t.chave ? [`${a.recompensas.chaves} ${t.chave.nome}`] : []), ...a.recompensas.itens.map((i) => `${i.quantidade} ${i.nome}`)]
    if (premio.length) mais.push(`Prêmio: ${premio.join(', ')}.`)
    if (limpa(a.resumo)) mais.unshift(limpa(a.resumo))
    const rotulo = a.podeSubir ? 'Subir' : a.faltaEssencias > 0 ? 'Faltam Essências' : 'Faltam chaves'
    abreCartao({
      ...base,
      texto: `Subir custa ${essencias(a.custo)} (você tem ${t.essencia.quantidade}). O custo dobra a cada andar.`,
      mais,
      acao: rotulo,
      desligado: !a.podeSubir,
      faz: () => void subir(t, a),
    })
  }
  let subindo = false
  async function subir(t: TorreEstado, a: AndarEstado) {
    if (subindo) return
    subindo = true
    const b = $('.c-acoes button') as HTMLButtonElement | null
    if (b) {
      b.disabled = true
      b.textContent = 'Subindo…'
    }
    const r = await o.onSubir(t.id, a.n)
    subindo = false
    if (!vivo) return
    if ('erro' in r) {
      fechaCartao()
      return aviso(r.erro, 3200)
    }
    fechaCartao()
    const fim = () => premio(premioDoAndar(t, r))
    if (r.cena.length) cenaAndar(r.torre, r.andar, r.cena, fim)
    else fim()
  }
  function premioDoAndar(t: TorreEstado, r: SubirResposta): Premio {
    const prox = r.torre.andares[r.andar.n]
    const itens = r.andar.recompensas.itens.map((i) => `+${i.quantidade} ${i.nome}`)
    if (r.chavesRecebidas && t.chave)
      return {
        titulo: 'Andar concluído',
        nome: r.chavesRecebidas > 1 ? `${r.chavesRecebidas} × ${t.chave.nome}` : t.chave.nome,
        texto: ['Guardada no seu inventário. Abre andares da Torre da Ruptura.', ...itens].join(' '),
        cor: cor(t.id),
      }
    return {
      titulo: 'Andar concluído',
      nome: `Andar ${r.andar.n} · ${limpa(r.andar.titulo)}`,
      texto: [...itens, prox ? `O andar ${prox.n} pede ${essencias(prox.custo)}.` : 'Você chegou ao topo desta torre.'].join(' '),
      cor: cor(t.id),
    }
  }

  /* ---------- prêmio ---------- */
  let premioFim: (() => void) | null = null
  let premioAte = 0
  function premio(p: Premio) {
    return new Promise<void>((ok) => {
      const el = $('.tv-premio')
      el.style.setProperty('--c', p.cor)
      el.querySelector('small')!.textContent = p.titulo
      el.querySelector('strong')!.textContent = p.nome
      el.querySelector('p')!.textContent = p.texto
      el.hidden = false
      // não fecha com o toque que terminou a cena (toque duplo)
      premioAte = performance.now() + 500
      el.focus({ preventScroll: true })
      premioFim = () => {
        el.hidden = true
        premioFim = null
        ok()
      }
    })
  }
  const fechaPremio = () => {
    if (performance.now() < premioAte) return false
    premioFim?.()
    return true
  }
  $('.tv-premio').onclick = () => void fechaPremio()

  /* ---------- cenas ---------- */
  let cena: { cancela(): void } | null = null
  function cenaAndar(t: TorreEstado, a: AndarEstado, passos: Passo[], fim: (() => void) | null) {
    const npc = a.npc
    const temRosto = !!ANFITRIOES[npc.id]
    const titulo = `${limpa(t.nome)} · Andar ${a.n}`
    // 1º andar: o encontro, longo, com o retrato grande; os outros: conversa curta no patamar
    if (temRosto && a.n > 1) return cenaPatamar(t, a, npc, passos, titulo, fim)
    emCena = true
    cena = tocaCena({
      raiz,
      passos,
      npc,
      modo: temRosto ? 'longa' : 'oculta',
      titulo,
      texto: o.texto,
      aoFim: () => {
        cena = null
        emCena = false
        fim?.()
      },
    })
  }
  /* conversa curta num close do patamar: a arte do andar em dobro (a porta fica do tamanho dos chibis), em escala
     inteira; você à esquerda, o anfitrião à direita com a boca mexendo, o rostinho na caixa */
  function cenaPatamar(t: TorreEstado, a: AndarEstado, npc: NpcRef, passos: Passo[], titulo: string, fim: (() => void) | null) {
    const cfg = ANFITRIOES[npc.id]
    const pos = PATAMAR[Math.min(a.n - 1, PATAMAR.length - 1)]
    const cx = pos[0] / 2
    const cy = pos[1] / 2 - 44 * Math.max(0, a.n - 1 - (PATAMAR.length - 1))
    const pa = $('.tv-patamar')
    const m = $('.tv-pa-mundo')
    m.textContent = ''
    m.style.backgroundImage = `url(${ARTE}interior.png?v=${ARTE_V})`
    // você, parado, olhando para o anfitrião (a mesma folha do chibi da ilha)
    const sb = document.createElement('i')
    sb.className = 'eu-sombra'
    const eu1 = document.createElement('i')
    eu1.className = 'eu'
    eu1.style.backgroundImage = ator.style.backgroundImage
    eu1.style.backgroundSize = ator.style.backgroundSize
    eu1.style.backgroundPosition = `-${COL.parado * 80}px -${2 * 96}px`
    m.append(sb, eu1)
    let s: ChibiNpc | null = null
    let ondeNpc = ''
    // o recorte acompanha o tamanho da tela e deixa o patamar a 72% da altura livre acima da caixa de texto
    const ajusta = () => {
      const r = raiz.getBoundingClientRect()
      const caixa = raiz.querySelector('.tv-cena .tv-caixa')
      const topo = (caixa ? caixa.getBoundingClientRect().top - r.top : r.height - 170) - 100
      const e = Math.max(1, Math.floor(Math.min(r.width / 400, topo / 520)))
      const Wp = Math.ceil(r.width / e)
      const Hp = Math.max(300, Math.floor(topo / e))
      const x0 = cx - Wp / 4
      const y0 = cy - (Hp * 0.72 - 14) / 2
      m.style.width = Wp + 'px'
      m.style.height = Hp + 'px'
      m.style.backgroundPosition = `${Math.round(-x0 * 2)}px ${Math.round(-y0 * 2)}px`
      m.style.transform = `translate(${Math.round((r.width - Wp * e) / 2)}px,0) scale(${e})`
      const chao = Math.round((cy - y0) * 2 + 14)
      const voce: Pt = [Math.round((cx - 30 - x0) * 2), chao]
      const anf: Pt = [Math.round((cx + 30 - x0) * 2), chao - 10]
      sb.style.cssText = `left:${voce[0]}px;top:${voce[1]}px;z-index:${voce[1] - 1}`
      eu1.style.left = voce[0] + 'px'
      eu1.style.top = voce[1] + 'px'
      eu1.style.zIndex = String(voce[1])
      // o motor dos chibis só sabe andar: para pôr o anfitrião no lugar sem deslizar, ele nasce ali
      const onde = anf.join(',')
      if (onde !== ondeNpc) {
        ondeNpc = onde
        s?.destroi()
        s = criaChibi(npc.id, { mundo: m, x: anf[0], y: anf[1], dir: 1, versao: ARTE_V, bocaMs: cfg.bocaMs, piscar: cfg.piscar, resp: cfg.resp })
      }
    }
    pa.getAnimations().forEach((x) => x.cancel())
    pa.hidden = false
    if (!calmo) pa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'steps(5,end)' })
    emCena = true
    const ro = new ResizeObserver(ajusta)
    cena = tocaCena({
      raiz,
      passos,
      npc,
      modo: 'curta',
      titulo,
      texto: o.texto,
      boneco: () => s,
      aoFim: () => {
        ro.disconnect()
        const fecha = () => {
          s?.destroi()
          s = null
          m.textContent = ''
          pa.hidden = true
          pa.getAnimations().forEach((x) => x.cancel())
          cena = null
          emCena = false
          fim?.()
        }
        if (calmo) return fecha()
        // sai como entrou: escurece em 5 quadros
        pa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'steps(5,end)', fill: 'forwards' }).finished.then(fecha, fecha)
      },
    })
    ajusta()
    ro.observe(raiz)
  }

  /* ---------- toque: tocar anda; arrastar olha em volta ---------- */
  let ini: { x: number; y: number; lx: number; ly: number; moveu: boolean } | null = null
  const vista = $('.tv-vista')
  raiz.addEventListener('pointerdown', destravaSom, true)
  vista.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) {
      ini = null
      return
    }
    ini = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moveu: false }
    try {
      vista.setPointerCapture(e.pointerId)
    } catch {}
  })
  vista.addEventListener('pointermove', (e) => {
    if (!ini || !e.isPrimary) return
    if (Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 10) ini.moveu = true
    if (ini.moveu) {
      olha.x += e.clientX - ini.lx
      olha.y += e.clientY - ini.ly
    }
    ini.lx = e.clientX
    ini.ly = e.clientY
  })
  vista.addEventListener('pointercancel', () => (ini = null))
  vista.addEventListener('pointerup', (e) => {
    const i = ini
    ini = null
    if (!i || i.moveu || !e.isPrimary) return
    fechaCartao()
    $('.tv-lista').hidden = true
    $('.tv-dica').hidden = true
    const r = raiz.getBoundingClientRect()
    const x = (e.clientX - r.left - camG.x) / esc
    const y = (e.clientY - r.top - camG.y) / esc
    const tocado = pontos().find((p) => Math.hypot(p.x / 2 - x, p.y / 2 - y) < 40)
    if (tocado) return escolhe(tocado)
    const a = $('.tv-alvo')
    const c = maisPerto(x, y)
    if (!c) return
    a.style.left = c[0] * PASSO + 3 + 'px'
    a.style.top = c[1] * PASSO + 3 + 'px'
    a.classList.remove('on')
    void a.offsetWidth
    a.classList.add('on')
    anda([x, y])
  })

  /* ---------- laço: anda, respira, pisca ---------- */
  let folhaPronta = false
  let t0 = performance.now()
  let andado = 0
  let quadroAnt = -1
  let andava = false
  let xAnt = 0
  let yAnt = 0
  let assenta = 0
  let respT = 0
  let proxPisca = 1.5 + Math.random() * 3
  let pisca = 0
  let trecho: Pt | undefined
  function laco(t: number) {
    if (!vivo) return
    const dt = Math.min(0.05, (t - t0) / 1000)
    t0 = t
    // dentro da torre a ilha não aparece: não precisa desenhar
    if (torreId) {
      requestAnimationFrame(laco)
      return
    }
    if (eu.rota.length) {
      const [x, y] = eu.rota[0]
      const dx = x - eu.x
      const dy = y - eu.y
      const d = Math.hypot(dx, dy)
      const v = 62 * dt // 62 px/s: casa com o passo do chibi (PX_QUADRO), o pé quase não patina
      if (d <= v) {
        eu.x = x
        eu.y = y
        eu.rota.shift()
        if (!eu.rota.length) {
          const f = eu.aoChegar
          eu.aoChegar = null
          f?.()
        }
      } else {
        // a direção é decidida uma vez por trecho do caminho; trecho curtinho não vira o corpo
        if (eu.rota[0] !== trecho) {
          trecho = eu.rota[0]
          if (d >= 8 || !andava) eu.dir = Math.abs(dx) > Math.abs(dy) * (eu.dir === 1 || eu.dir === 2 ? 1 : 1.3) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3
        }
        eu.x += (dx / d) * v
        eu.y += (dy / d) * v
      }
    }
    const andando = eu.rota.length > 0
    let col = COL.parado
    let sobe = false
    if (andando) {
      if (!andava) andado = 6 // começa com o pé saindo do chão
      andado += Math.hypot(eu.x - xAnt, eu.y - yAnt) / PX_QUADRO
      const k = Math.floor(andado) % 8
      col = 1 + k
      sobe = ANDAR_BOB[k] < 0
      if (k !== quadroAnt && k % 4 === 0) passoSom(k === 0)
      quadroAnt = k
      assenta = 0
    } else {
      if (andava) assenta = TIQUE
      quadroAnt = -1
      andado = 0
      if (assenta > 0) {
        assenta -= dt
        col = COL.assenta
      } else if (!calmo) {
        // respira: o peito sobe por ~0,9 s a cada 2,6 s; pisca ~110 ms a cada 3-6,5 s (de costas não)
        respT = (respT + dt) % 2.6
        const peito = respT > 1.7
        proxPisca -= dt
        if (proxPisca <= 0 && pisca <= 0) {
          pisca = TIQUE * 1.4
          proxPisca = 3 + Math.random() * 3.5
        }
        if (pisca > 0) pisca -= dt
        if (pisca > 0 && eu.dir !== 3) col = peito ? COL.piscaPeito : COL.pisca
        else if (peito) col = COL.peito
      }
    }
    andava = andando
    if (folhaPronta) ator.style.backgroundPosition = `-${col * 80}px -${eu.dir * 96}px`
    xAnt = eu.x
    yAnt = eu.y
    ator.style.left = Math.round(eu.x) + 'px'
    ator.style.top = Math.round(eu.y) + 'px'
    ator.style.zIndex = String(Math.round(eu.y))
    sombra.style.left = Math.round(eu.x) + 'px'
    sombra.style.top = Math.round(eu.y) + 'px'
    sombra.style.zIndex = String(Math.round(eu.y) - 1)
    sombra.style.width = sobe ? '38px' : ''
    sombra.style.marginLeft = sobe ? '-19px' : ''
    camera(dt)
    posicionaSetas()
    requestAnimationFrame(laco)
  }

  /* ---------- botões e teclado ---------- */
  $('.tv-lista-bt').onclick = abreLista
  $('.tv-l-fechar').onclick = () => ($('.tv-lista').hidden = true)
  $('.tv-t-sair').onclick = saiTorre
  /** Fecha a camada de cima. Devolve false se não havia nenhuma (aí o voltar fecha a janela). */
  function fechaTopo() {
    if (!$('.tv-premio').hidden) return fechaPremio(), true
    // no meio de uma cena o voltar não faz nada (a cena se perderia)
    if (emCena) return true
    if (!$('.tv-cartao').hidden) return fechaCartao(), true
    if (!$('.tv-lista').hidden) return ($('.tv-lista').hidden = true), true
    if (torreId) return saiTorre(), true
    return false
  }
  const tecla = (e: KeyboardEvent) => {
    if (!raiz.isConnected) return
    if (!$('.tv-premio').hidden && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
      e.preventDefault()
      e.stopImmediatePropagation()
      fechaPremio()
      return
    }
    // o Esc fecha a camada de cima das Torres antes de fechar a janela
    if (e.key === 'Escape' && fechaTopo()) {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
  }
  addEventListener('keydown', tecla, true)
  const ro = new ResizeObserver(() => {
    medida()
    camera(0)
    if (torreId) pintaTorre()
  })
  ro.observe(raiz)

  medida()
  ;[eu.x, eu.y] = SEL([PORTAS.casa.ir])[0]
  xAnt = eu.x
  yAnt = eu.y
  pintaPontos()
  pintaBolsa()
  camera(0)
  requestAnimationFrame(laco)

  // o chibi segue a aparência escolhida na Casa (o pedido mais novo vence)
  let pedidoFolha = 0
  let urlFolha: string | null = null
  function vestir(ap: Aparencia) {
    const meu = ++pedidoFolha
    folhaAndarFofo(ap)
      .then((cv) =>
        cv.toBlob((b) => {
          if (!vivo || meu !== pedidoFolha || !b) return
          if (urlFolha) URL.revokeObjectURL(urlFolha)
          urlFolha = URL.createObjectURL(b)
          ator.style.backgroundImage = `url(${urlFolha})`
          ator.style.backgroundSize = `${cv.width}px ${cv.height}px`
          folhaPronta = true
        }),
      )
      .catch(() => {})
  }
  vestir(o.aparencia)
  let aparencia = o.aparencia

  return {
    aviso,
    fechaTopo,
    premio,
    /** Cena fora de um andar (a apresentação do Galo): diálogo longo com o retrato grande. */
    apresentacao(passos: Passo[], npc: NpcRef, op: { titulo: string; onEfeito?: (e: Efeito) => Promise<void>; onPular?: () => void; aoFim: () => void }) {
      if (cena) return
      fechaCartao()
      emCena = true
      cena = tocaCena({
        raiz,
        passos,
        npc,
        modo: 'longa',
        titulo: op.titulo,
        texto: o.texto,
        onEfeito: op.onEfeito,
        onPular: op.onPular
          ? () => {
              cena = null
              emCena = false
              op.onPular?.()
            }
          : undefined,
        aoFim: () => {
          cena = null
          emCena = false
          op.aoFim()
        },
      })
    },
    /** Dados novos do servidor (saldos, andares, chaves, aparência). */
    atualiza(n: { torres?: TorreEstado[]; aparencia?: Aparencia }) {
      if (n.aparencia && JSON.stringify(n.aparencia) !== JSON.stringify(aparencia)) {
        aparencia = n.aparencia
        vestir(n.aparencia)
      }
      if (n.torres) {
        torres = n.torres
        pintaBolsa()
        if (torreId) pintaTorre()
        else pintaPontos()
      }
    },
    get emCena() {
      return emCena
    },
    destroi() {
      vivo = false
      cena?.cancela()
      if (urlFolha) URL.revokeObjectURL(urlFolha)
      timers.forEach(clearTimeout)
      timers.clear()
      ro.disconnect()
      removeEventListener('keydown', tecla, true)
      raiz.innerHTML = ''
    },
  }
}

export type TorresMotor = ReturnType<typeof criaTorres>
