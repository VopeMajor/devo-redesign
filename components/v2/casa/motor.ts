import type { Aparencia, CasaEtapa } from '@/lib/devo/casa-aparencia'
import { ANDAR_BOB, COL, folhaAndarFofo, PX_QUADRO } from './avatar-cor'
import { criaChibi, type ChibiNpc } from './npc-chibi'
import { calmo as calmoAgora, destravaSom, passo as passoSom, som } from './som'
import { type FimSimon, type PalcoVisita, visitaSimon } from './visita-simon'

/**
 * Motor da Casa em RPG Maker (kit3/casa.html + chibi-vida.js, aprovados pelo dono): o mapa em pixel de 768x512 em
 * escala inteira, o chibi andando por A* numa grade de 6 px (sem cortar quina de móvel), a câmera que segue e deixa
 * olhar em volta arrastando, os objetos com o losango, a seta na borda para o que está fora da tela, o cartão
 * embaixo (ao alcance do polegar), os andares, a porta (viagem) e a campainha. A vida do chibi (respirar, piscar,
 * olhar, balões, passos) roda no mesmo laço.
 * Os dados vêm do jogo (aparência, etapa, mesa); as telas de verdade (mesa, guarda-roupa, Torres) são do React.
 */

type Pt = [number, number]
type Ponto = {
  id: string
  curto: string
  area: Pt[]
  x: number
  y: number
  ir: Pt
  titulo: string
  texto: string
  fala?: string
  fechado?: boolean
  acao?: string
  faz?: () => void
}
type Sala = {
  nome: (e: CasaEtapa) => string
  img: (e: CasaEtapa) => string
  chao: Pt[]
  bloqueios: (e: CasaEtapa) => Pt[][]
  frente: (e: CasaEtapa) => { y: number; p: Pt[] }[]
  inicio: Pt
  pontos: (e: CasaEtapa) => Ponto[]
}
export type SalaId = 'terreo' | 'quarto'

export type MotorOpcoes = {
  aparencia: Aparencia
  etapa: CasaEtapa
  andamento: number
  equipe: boolean
  sala?: SalaId
  onSair: () => void
  onMesa: () => void
  onGuardaRoupa: () => void
  onTorres: () => void
  onFimVisita: (r: FimSimon) => void
  /** Algo do React aberto por cima (mesa, guarda-roupa): o chibi fica quieto. */
  ocupado: () => boolean
}

const W = 768
const H = 512
const ARTE = '/v2/art/casa/'
/** Coordenadas medidas na arte original de 1536x1024; SEL converte para o pixel real. */
const SEL = (p: Pt[]): Pt[] => p.map(([x, y]) => [x / 2, y / 2])
const PASSO = 6
const GW = Math.ceil(W / PASSO)
const GH = Math.ceil(H / PASSO)
const NOVIDADE: Record<number, { id: string; txt: string; foco: Pt }> = {
  2: { id: 'mesa', txt: 'A mesa de oficina chegou', foco: [1095, 540] },
  3: { id: 'escada', txt: 'O andar dos quartos abriu', foco: [830, 430] },
}
const SOLEIRA = { simon: { dx: -124, dy: 35, voce: [62, -18] as Pt, dentro: [[250, 385], [165, 262], [100, 300]] as Pt[] } }

function dentro(x: number, y: number, p: Pt[]) {
  let c = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c
  }
  return c
}

const ESQUELETO = `
<div class="cv-vista" aria-label="Cena da casa. Toque no chão para andar.">
  <div class="cv-mundo"><div class="cv-fundo"></div><div class="cv-alvo"></div><div class="cv-fim"></div></div>
</div>
<div class="cv-topo">
  <button class="cv-sair" aria-label="Sair da casa">‹</button>
  <div class="cv-lugar" aria-live="polite"></div>
  <button class="cv-andares">Andares</button>
</div>
<div class="cv-teste" aria-label="Controle de teste da equipe" hidden><span>Teste</span><button data-e="1">1</button><button data-e="2">2</button><button data-e="3">3</button><button class="cv-campainha" aria-label="Tocar a campainha: visita do Simon">🔔</button></div>
<div class="cv-dica">Toque no chão para andar</div>
<div class="cv-aviso" hidden role="status"></div>
<section class="cv-cartao" hidden aria-live="polite"><h2 class="c-tit"></h2><p class="c-txt"></p><div class="c-acoes"></div></section>
<section class="cv-viagem" hidden role="dialog" aria-label="Sair de casa">
  <header><h2>Sair de casa</h2><button class="cv-v-fechar" aria-label="Fechar">✕</button></header>
  <p class="v-sub">Para onde?</p>
  <button class="destino" data-ir="torres"><b>Torres de Ruptura</b><small>A ilha das torres, logo ali fora</small></button>
  <button class="destino trancado" data-ir="catedral"><b>???</b><small>Ouvi dizer que existe uma igreja nas redondezas...</small></button>
  <button class="destino" data-ir="celular"><b>Voltar ao celular</b><small>O sistema do DEVO</small></button>
</section>
<section class="cv-casa" hidden aria-label="A casa inteira">
  <header><h2>Sua casa</h2><button class="cv-c-fechar" aria-label="Fechar">✕</button></header>
  <p class="historia">Oferecida pela Melissa, da Companhia de Despertados. Já pertenceu a outros Records no passado.</p>
  <button class="andar a-quartos"><b></b></button>
  <button class="andar a-terreo"><b></b></button>
</section>`

export function criaCasa(raiz: HTMLElement, o: MotorOpcoes) {
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
  let etapa: CasaEtapa = o.etapa
  let andamento = o.andamento

  const textoMesa = () => (andamento ? `Aqui você confecciona cartas. ${andamento === 1 ? 'Uma fabricação em andamento.' : `${andamento} fabricações em andamento.`}` : 'Aqui você confecciona cartas.')
  const SALAS: Record<SalaId, Sala> = {
    terreo: {
      nome: (e) => (e === 1 ? 'Térreo · Sala' : 'Térreo · Sala e oficina'),
      img: (e) => `${ARTE}terreo-${e}.png`,
      chao: SEL([[150, 575], [640, 290], [745, 350], [760, 440], [860, 495], [905, 440], [1000, 365], [1420, 590], [830, 815], [650, 800], [510, 740], [320, 655]]),
      bloqueios: (e) =>
        (
          [
            [[480, 480], [560, 410], [720, 490], [650, 570]],
            [[240, 530], [320, 480], [375, 545], [290, 610]],
            [[325, 620], [360, 595], [510, 680], [460, 740]],
            [[415, 570], [490, 530], [595, 580], [515, 625]],
            [[110, 520], [240, 440], [260, 480], [150, 560]],
            [[230, 440], [410, 345], [420, 400], [290, 480]],
            [[505, 335], [545, 305], [550, 350], [515, 365]],
            [[750, 410], [800, 375], [905, 430], [860, 490]],
            [[1030, 440], [1130, 370], [1330, 480], [1260, 540]],
            ...(e === 1
              ? [[[1000, 570], [1090, 520], [1180, 590], [1100, 650]]]
              : [
                  [[940, 520], [1060, 465], [1240, 600], [1165, 700], [1010, 640]],
                  [[985, 610], [1055, 610], [1040, 665], [1000, 665]],
                  [[1235, 570], [1300, 510], [1380, 590], [1280, 650]],
                ]),
          ] as Pt[][]
        ).map(SEL),
      frente: (e) =>
        (
          [
            { y: 285, p: [[480, 480], [560, 400], [725, 490], [650, 585], [560, 520]] },
            { y: 305, p: [[240, 530], [320, 470], [378, 545], [292, 615]] },
            { y: 370, p: [[325, 620], [360, 590], [515, 680], [462, 745]] },
            ...(e === 1
              ? [{ y: 325, p: [[1000, 570], [1090, 500], [1180, 590], [1100, 655]] }]
              : [
                  { y: 350, p: [[940, 520], [1060, 430], [1245, 590], [1165, 705], [1010, 645]] },
                  { y: 325, p: [[1235, 570], [1300, 490], [1385, 590], [1280, 655]] },
                ]),
          ] as { y: number; p: Pt[] }[]
        ).map((f) => ({ y: f.y, p: SEL(f.p) })),
      inicio: [600, 700],
      pontos: (e) => [
        { id: 'porta', curto: 'Porta', area: [[240, 640], [370, 640], [370, 830], [240, 830]], x: 300, y: 690, ir: [560, 770], titulo: 'Porta de entrada', texto: 'Sair de casa e viajar para outro lugar.', acao: 'Sair de casa', faz: abreViagem },
        e === 1
          ? { id: 'caixas', curto: 'Caixas', area: [[1000, 490], [1180, 490], [1180, 660], [1000, 660]], x: 1090, y: 520, ir: [960, 640], titulo: 'Caixas fechadas', texto: 'A mesa de oficina ainda não chegou.', fechado: true }
          : { id: 'mesa', curto: 'Mesa', area: [[940, 430], [1060, 430], [1245, 590], [1165, 705], [1010, 645]], x: 1095, y: 470, ir: [1000, 730], titulo: 'Mesa de Confecção', texto: textoMesa(), acao: 'Usar a mesa', faz: o.onMesa },
        e < 3
          ? { id: 'escada', curto: 'Portão', area: [[745, 290], [905, 290], [905, 495], [745, 495]], x: 830, y: 355, ir: [800, 530], titulo: 'Portão da escada', fala: '[Ainda não é uma boa ideia entrar aqui.]', texto: 'Abre depois da sua primeira fabricação na mesa.', fechado: true }
          : { id: 'escada', curto: 'Escada', area: [[745, 290], [905, 290], [905, 495], [745, 495]], x: 830, y: 355, ir: [800, 530], titulo: 'Escada', texto: 'Sobe para o andar dos quartos.', acao: 'Subir', faz: () => vai('quarto') },
      ],
    },
    quarto: {
      nome: () => 'Andar dos quartos',
      img: () => `${ARTE}quarto.png`,
      chao: SEL([[150, 590], [585, 395], [740, 480], [880, 460], [960, 470], [780, 560], [1100, 770], [1290, 660], [1380, 640], [1020, 840], [960, 790], [860, 730], [800, 720], [600, 825]]),
      bloqueios: () =>
        (
          [
            [[225, 510], [400, 440], [420, 490], [310, 610]],
            [[415, 545], [480, 540], [590, 630], [520, 730], [420, 660]],
            [[590, 590], [680, 590], [680, 680], [600, 680]],
            [[520, 400], [580, 395], [575, 460], [530, 460]],
          ] as Pt[][]
        ).map(SEL),
      frente: () =>
        (
          [
            { y: 335, p: [[415, 540], [480, 530], [590, 630], [520, 735], [420, 665]] },
            { y: 320, p: [[590, 560], [680, 560], [685, 685], [600, 685]] },
          ] as { y: number; p: Pt[] }[]
        ).map((f) => ({ y: f.y, p: SEL(f.p) })),
      inicio: [880, 700],
      pontos: () => [
        { id: 'descer', curto: 'Escada', area: [[850, 760], [970, 760], [970, 900], [850, 900]], x: 905, y: 800, ir: [880, 700], titulo: 'Escada', texto: 'Desce para o térreo.', acao: 'Descer', faz: () => vai('terreo') },
        { id: 'guarda', curto: 'Guarda-roupa', area: [[735, 190], [875, 190], [875, 495], [735, 495]], x: 805, y: 300, ir: [800, 515], titulo: 'Guarda-roupa', texto: 'Mudar a aparência custa 1 hora de Tempo. Só cobra se algo mudar.', acao: 'Abrir', faz: o.onGuardaRoupa },
      ],
    },
  }
  let sala: SalaId = o.sala === 'quarto' && etapa >= 3 ? 'quarto' : 'terreo'
  let S = SALAS[sala]
  let grade = new Uint8Array(GW * GH)
  let oc: HTMLElement[] = []
  let pts: HTMLElement[] = []
  const mundo = $('.cv-mundo')

  /* ---------- caminho: A* numa grade de 6 px, sem cortar quina de móvel ---------- */
  function montaGrade() {
    const bl = S.bloqueios(etapa)
    grade = new Uint8Array(GW * GH)
    for (let j = 0; j < GH; j++)
      for (let i = 0; i < GW; i++) {
        const x = i * PASSO + 3
        const y = j * PASSO + 3
        grade[j * GW + i] = dentro(x, y, S.chao) && !bl.some((b) => dentro(x, y, b)) ? 1 : 0
      }
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

  /* ---------- personagem e câmera ---------- */
  const sombra = Object.assign(document.createElement('div'), { className: 'sombra' })
  const ator = Object.assign(document.createElement('div'), { className: 'ator' })
  mundo.append(sombra, ator)
  const eu = { x: 0, y: 0, dir: 0, rota: [] as Pt[], aoChegar: null as null | (() => void) }
  let esc = 1
  const cam = { x: 0, y: 0 }
  let olha = { x: 0, y: 0 }
  let alvoCam: Pt | null = null
  const limita = (v: number, lado: number, tela: number, sobra = 0) => (lado <= tela ? (tela - lado) / 2 - sobra : Math.min(0, Math.max(tela - lado, v)))
  const medida = () => {
    esc = Math.max(1, Math.floor(Math.min(raiz.clientWidth / W, raiz.clientHeight / H)))
  }
  // deslocamento das animações de ociosidade (balançar ao cantarolar, pulinho), em pixel de arte inteiro
  const oc0 = { x: 0, y: 0 }
  function desenha() {
    ator.style.left = Math.round(eu.x) + oc0.x + 'px'
    ator.style.top = Math.round(eu.y) + oc0.y + 'px'
    ator.style.zIndex = String(Math.round(eu.y))
    sombra.style.left = Math.round(eu.x) + 'px'
    sombra.style.top = Math.round(eu.y) + 'px'
    sombra.style.zIndex = String(Math.round(eu.y) - 1)
  }
  function camera(dt: number) {
    const vw = raiz.clientWidth
    const vh = raiz.clientHeight
    const mw = W * esc
    const mh = H * esc
    const foco = alvoCam || [eu.x, eu.y - 40]
    // o espaço de baixo fica livre para o cartão, então a cena sobe um pouco no celular
    const sobe = vh > mh + 120 ? 46 : 0
    const rx = vw / 2 - foco[0] * esc + olha.x
    const ry = vh / 2 - foco[1] * esc + olha.y - sobe
    const x = limita(rx, mw, vw)
    const y = limita(ry, mh, vh, sobe)
    // o que passa do limite não acumula: soltar o dedo não deixa uma zona morta
    if (!alvoCam) {
      olha.x += x - rx
      olha.y += y - ry
    }
    const k = dt === 0 || calmo ? 1 : Math.min(1, dt * (alvoCam ? 3.5 : eu.rota.length ? 9 : 7))
    cam.x += (x - cam.x) * k
    cam.y += (y - cam.y) * k
    // a câmera anda na grade do pixel da arte (múltiplos da escala): o chibi e o chão andam juntos, sem o chibi tremer
    // 1 px de tela para lá e para cá enquanto a câmera o segue
    const gx = Math.round(cam.x / esc) * esc
    const gy = Math.round(cam.y / esc) * esc
    mundo.style.transform = `translate(${gx}px,${gy}px) scale(${esc})`
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

  /* ---------- setas na borda para objetos fora da tela ---------- */
  let setas: { el: HTMLButtonElement; p: Ponto }[] = []
  function posicionaSetas() {
    const vw = raiz.clientWidth
    const vh = raiz.clientHeight
    for (const { el, p } of setas) {
      const sx = (p.x / 2) * esc + cam.x
      const sy = (p.y / 2) * esc + cam.y
      const fora = sx < 6 ? 'e' : sx > vw - 6 ? 'd' : ''
      el.classList.toggle('on', !!fora)
      if (!fora) continue
      ;(el.firstChild as HTMLElement).textContent = fora === 'e' ? '◂' : '▸'
      el.style.left = fora === 'e' ? '8px' : 'auto'
      el.style.right = fora === 'd' ? '8px' : 'auto'
      el.style.top = Math.round(Math.min(vh - 130, Math.max(130, sy - 24))) + 'px'
    }
  }

  /* ---------- objetos e cartão ---------- */
  function pintaPontos(novoId?: string) {
    pts.forEach((e) => e.remove())
    pts = []
    setas.forEach((s) => s.el.remove())
    const lista = S.pontos(etapa)
    setas = lista.map((p) => {
      const el = document.createElement('button')
      el.className = 'cv-seta' + (p.fechado ? ' fechado' : '')
      el.setAttribute('aria-label', 'Ir até: ' + p.titulo)
      el.append(document.createElement('span'), (p.fechado ? '🔒 ' : '') + p.curto)
      el.onclick = () => escolhe(p)
      raiz.append(el)
      return { el, p }
    })
    for (const p of lista) {
      const b = document.createElement('button')
      b.className = 'ponto' + (p.fechado ? ' fechado' : '') + (p.id === novoId ? ' novo' : '')
      b.style.left = p.x / 2 + 'px'
      b.style.top = p.y / 2 + 'px'
      b.style.zIndex = '900'
      b.setAttribute('aria-label', p.titulo + (p.fechado ? ', trancado' : ''))
      b.innerHTML = '<i></i>'
      b.addEventListener('pointerdown', (e) => e.stopPropagation())
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        escolhe(p)
      })
      mundo.append(b)
      pts.push(b)
    }
  }
  const viraPara = (x: number, y: number) => {
    const dx = x - eu.x
    const dy = y - eu.y
    eu.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3
  }
  // o cartão abre 160 ms depois de chegar; qualquer outro toque, a campainha ou fechar cancela
  let cartaoT = 0
  function escolhe(p: Ponto) {
    $('.cv-dica').hidden = true
    fechaCartao()
    anda(SEL([p.ir])[0], () => {
      viraPara(p.x / 2, p.y / 2)
      cartaoT = depois(() => abreCartao(p), 160)
    })
  }
  function abreCartao(p: Ponto) {
    $('.c-tit').textContent = (p.fechado ? '🔒 ' : '') + p.titulo
    const txt = $('.c-txt')
    txt.textContent = ''
    if (p.fala) {
      const q = document.createElement('q')
      q.className = 'fala'
      q.textContent = p.fala
      const s = document.createElement('small')
      s.className = 'req'
      s.textContent = `🔒 ${p.texto}`
      txt.append(q, s)
    } else txt.textContent = p.texto
    const a = $('.c-acoes')
    a.innerHTML = ''
    if (p.acao) {
      const b = document.createElement('button')
      b.textContent = p.acao
      b.onclick = () => {
        fechaCartao()
        p.faz?.()
      }
      a.append(b)
    }
    const v = document.createElement('button')
    v.textContent = p.acao ? 'Agora não' : 'Entendi'
    if (p.acao) v.className = 'fraco'
    v.onclick = fechaCartao
    a.append(v)
    $('.cv-cartao').hidden = false
    ;(a.firstChild as HTMLButtonElement).focus({ preventScroll: true })
  }
  const fechaCartao = () => {
    clearTimeout(cartaoT)
    $('.cv-cartao').hidden = true
  }
  let avisoT = 0
  function aviso(t: string, ms = 1900) {
    const el = $('.cv-aviso')
    el.textContent = t
    el.hidden = false
    clearTimeout(avisoT)
    avisoT = depois(() => (el.hidden = true), ms)
  }

  /* ---------- cômodos e etapas ---------- */
  function cena() {
    S = SALAS[sala]
    const img = S.img(etapa)
    $('.cv-fundo').style.backgroundImage = `url(${img})`
    oc.forEach((e) => e.remove())
    oc = S.frente(etapa).map((f) => {
      const d = document.createElement('div')
      d.className = 'oc'
      d.style.backgroundImage = `url(${img})`
      d.style.clipPath = 'polygon(' + f.p.map(([x, y]) => `${x}px ${y}px`).join(',') + ')'
      d.style.zIndex = String(f.y)
      mundo.append(d)
      return d
    })
    montaGrade()
    $('.cv-lugar').textContent = S.nome(etapa)
    raiz.querySelectorAll<HTMLButtonElement>('.cv-teste button[data-e]').forEach((b) => b.classList.toggle('on', +b.dataset.e! === etapa))
  }
  function vai(nova: SalaId) {
    const veioDe = sala
    sala = nova
    fechaCartao()
    $('.cv-casa').hidden = true
    $('.cv-fim').style.opacity = '.9'
    depois(() => {
      cena()
      // quem desce chega ao pé da escada, não ao meio da sala
      ;[eu.x, eu.y] = SEL([nova === 'terreo' && veioDe === 'quarto' ? [800, 530] : S.inicio])[0]
      eu.rota = []
      eu.aoChegar = null
      eu.dir = nova === 'quarto' ? 3 : 0
      pintaPontos()
      olha = { x: 0, y: 0 }
      desenha()
      camera(0)
      $('.cv-fim').style.opacity = '0'
    }, calmo ? 0 : 350)
  }
  function mudaEtapa(e: CasaEtapa, anuncia = true) {
    const subiu = e > etapa
    etapa = e
    fechaCartao()
    if (sala !== 'terreo' && e < 3) sala = 'terreo'
    cena()
    if (!livre(Math.floor(eu.x / PASSO), Math.floor(eu.y / PASSO))) {
      const c = maisPerto(eu.x, eu.y)
      if (c) [eu.x, eu.y] = [c[0] * PASSO + 3, c[1] * PASSO + 3]
    }
    eu.rota = []
    const n = anuncia && subiu ? NOVIDADE[e] : null
    pintaPontos(n?.id)
    if (n) {
      // mostra o que chegou e devolve o controle ao jogador
      $('.cv-fim').style.opacity = '.55'
      depois(() => ($('.cv-fim').style.opacity = '0'), 120)
      alvoCam = SEL([n.foco])[0]
      aviso(n.txt, 2200)
      depois(() => (alvoCam = null), 2300)
      depois(() => pintaPontos(), 3600)
    }
  }
  function pintaCasa() {
    const quartos = etapa >= 3
    const set = (el: HTMLElement, img: string, tit: string, sub: string, fechado: boolean, aqui: boolean) => {
      el.style.backgroundImage = `url(${img})`
      el.className = el.className.replace(/ ?(fechado|aqui)/g, '') + (fechado ? ' fechado' : '') + (aqui ? ' aqui' : '')
      const b = el.querySelector('b')!
      b.textContent = `${fechado ? '🔒 ' : ''}${tit}`
      const s = document.createElement('small')
      s.textContent = sub
      b.append(s)
    }
    set($('.a-quartos'), `${ARTE}andar-quartos.png`, 'Andar dos quartos', quartos ? (sala === 'quarto' ? 'Você está aqui' : 'Toque para ir') : 'Abre depois da sua primeira fabricação na mesa', !quartos, sala === 'quarto')
    set($('.a-terreo'), `${ARTE}andar-terreo.png`, etapa === 1 ? 'Térreo · Sala' : 'Térreo · Sala e oficina', sala === 'terreo' ? 'Você está aqui' : 'Toque para ir', false, sala === 'terreo')
    $('.cv-casa').hidden = false
    $('.cv-c-fechar').focus({ preventScroll: true })
  }

  /* ---------- toque: tocar anda; arrastar olha em volta ---------- */
  let ini: { x: number; y: number; lx: number; ly: number; moveu: boolean } | null = null
  const vista = $('.cv-vista')
  // o primeiro toque também destrava o som (iPhone)
  raiz.addEventListener('pointerdown', destravaSom, true)
  vista.addEventListener('pointerdown', (e) => {
    // um toque acorda o chibi que cochilava
    if (dormindo) balao('!')
    acorda()
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
    $('.cv-dica').hidden = true
    const r = raiz.getBoundingClientRect()
    const x = (e.clientX - r.left - cam.x) / esc
    const y = (e.clientY - r.top - cam.y) / esc
    // tocar no próprio móvel leva até ele e abre o cartão
    const tocado = S.pontos(etapa).find((p) => dentro(x * 2, y * 2, p.area))
    if (tocado) return escolhe(tocado)
    const a = $('.cv-alvo')
    const c = maisPerto(x, y)
    if (!c) return
    a.style.left = c[0] * PASSO + 3 + 'px'
    a.style.top = c[1] * PASSO + 3 + 'px'
    a.classList.remove('on')
    void a.offsetWidth
    a.classList.add('on')
    if (calmo) depois(() => a.classList.remove('on'), 500)
    anda([x, y])
  })

  /* ---------- Sair de Casa / Viagem: a Catedral ainda não foi descoberta no jogo ---------- */
  function abreViagem() {
    $('.cv-viagem').hidden = false
    $('.cv-v-fechar').focus({ preventScroll: true })
  }
  raiz.querySelectorAll<HTMLButtonElement>('.destino').forEach(
    (b) =>
      (b.onclick = () => {
        const ir = b.dataset.ir
        if (ir === 'catedral') return aviso('Ainda não sei o caminho.')
        $('.cv-viagem').hidden = true
        $('.cv-fim').style.opacity = '.9'
        depois(() => (ir === 'torres' ? o.onTorres() : o.onSair()), 220)
      }),
  )
  $('.cv-v-fechar').onclick = () => ($('.cv-viagem').hidden = true)

  /* ---------- visitas: o Simon é sempre o primeiro (nota do Rup) ---------- */
  let visita: { cancela(): void } | null = null
  let tocando = false
  function campainha() {
    if (visita || tocando) return
    tocando = true
    fechaCartao()
    $('.cv-viagem').hidden = true
    $('.cv-casa').hidden = true
    const continua = () => {
      // só no térreo há porta: quem está no quarto desce primeiro
      if (sala !== 'terreo') {
        vai('terreo')
        return depois(continua, 420)
      }
      const porta = S.pontos(etapa).find((p) => p.id === 'porta')
      let foi = false
      const abre = () => {
        soltaPula()
        if (foi || !vivo) return
        foi = true
        // você fica de frente para a porta, do lado de dentro
        if (porta) {
          eu.rota = []
          ;[eu.x, eu.y] = SEL([porta.ir])[0]
          viraPara(porta.x / 2, porta.y / 2)
        }
        tocando = false
        // a primeira visita do Simon é um diálogo longo: retrato grande (dono, 06/11); ?palco=1 mostra o palco na porta
        const palco = porta && new URLSearchParams(window.location.search).has('palco') ? palcoVisita(porta) : null
        visita = visitaSimon(raiz, {
          aparencia: o.aparencia,
          palco,
          aoFim: (r) => {
            visita = null
            // o aviso do guarda-chuva vem do React, depois de o servidor confirmar
            if (r.fim === 'ignorou') aviso('Ninguém mais na porta')
            o.onFimVisita(r)
          },
        })
      }
      const pula = (e: Event) => {
        e.stopPropagation()
        e.preventDefault()
        abre()
      }
      if (!porta || calmo) return abre()
      // a campainha toca (o som sai na fala "[Som de campainha]", como no protótipo): "!" sobre o chibi, a cabeça vira
      // para a porta e ele vai atender (um toque pula)
      balao('!')
      const ate = SEL([porta.ir])[0]
      const rota = acha([eu.x, eu.y], ate)
      let dist = 0
      for (let k = 1; k < rota.length; k++) dist += Math.hypot(rota[k][0] - rota[k - 1][0], rota[k][1] - rota[k - 1][1])
      depois(() => {
        viraPara(porta.x / 2, porta.y / 2)
        depois(
          () =>
            anda(ate, () => {
              viraPara(porta.x / 2, porta.y / 2)
              depois(abre, 240)
            }),
          240,
        )
      }, 500)
      pulaAtivo = pula
      document.addEventListener('pointerdown', pula, true)
      // reserva: se algo travar a caminhada, a porta abre mesmo assim (sem teleportar no meio do caminho)
      depois(abre, 980 + (dist / 62) * 1000 + 1500)
    }
    continua()
  }
  let pulaAtivo: ((e: Event) => void) | null = null
  function soltaPula() {
    if (pulaAtivo) document.removeEventListener('pointerdown', pulaAtivo, true)
    pulaAtivo = null
  }
  /** Toca quando o jogador estiver livre: sem painel aberto, parado e com a aba à vista. */
  let esperaT = 0
  function campainhaQuandoLivre() {
    clearTimeout(esperaT)
    const livreAgora =
      $('.cv-cartao').hidden && $('.cv-viagem').hidden && $('.cv-casa').hidden && !eu.rota.length && document.visibilityState === 'visible' && !o.ocupado()
    if (livreAgora) campainha()
    else esperaT = depois(campainhaQuandoLivre, 1000)
  }
  /* palco das visitas curtas: o chibi do NPC na soleira, de frente para você; entra, revira a casa e volta */
  function palcoVisita(porta: Ponto): PalcoVisita {
    const cfg = SOLEIRA.simon
    const [px, py] = SEL([porta.ir])[0]
    const lugar: Pt = [px + cfg.dx, py + cfg.dy]
    let s: ChibiNpc | null = null
    const antes = alvoCam
    raiz.classList.add('em-visita')
    const perto: Pt = [lugar[0] + cfg.voce[0], lugar[1] + cfg.voce[1]]
    const olhaVoce = () => {
      s?.vira(0)
      viraPara(lugar[0], lugar[1])
    }
    const caminho = (de: Pt, para: Pt) => {
      const c = acha(de, para)
      return c.length ? c.slice(1) : [para]
    }
    return {
      get boneco() {
        return s
      },
      entra() {
        if (s) return
        s = criaChibi('simon', { mundo, x: lugar[0], y: lugar[1] + 18, dir: 3, versao: '202611060700', bocaMs: 100, piscar: [2.2, 5] })
        eu.rota = []
        ;[eu.x, eu.y] = perto
        s.anda([lugar], olhaVoce)
        alvoCam = [(perto[0] + lugar[0]) / 2, (perto[1] + lugar[1]) / 2 - 30]
      },
      fala() {
        if (s && !s.andando) olhaVoce()
      },
      entraCasa() {
        if (!s) return
        let de: Pt = [s.x, s.y]
        const rota: Pt[] = []
        for (const p of cfg.dentro) {
          rota.push(...caminho(de, p))
          de = p
        }
        s.anda(rota, () => s?.vira(3))
      },
      volta() {
        if (s) s.anda(caminho([s.x, s.y], lugar), olhaVoce)
      },
      sai() {
        if (!s) return
        som('baque')
        s.anda([[lugar[0], lugar[1] + 18]], () => s?.mostra(false))
      },
      fim() {
        s?.destroi()
        s = null
        alvoCam = antes
        raiz.classList.remove('em-visita')
      },
    }
  }

  /* ---------- vida do chibi (kit3/chibi-vida.js): respira, pisca, olha, balões, passos ---------- */
  const TIQUE = 0.08
  const TIPOS = ['!', '?', '…', '♪', 'gota', 'zz']
  const folhaBalao = (() => {
    const c = document.createElement('canvas')
    c.width = 160
    c.height = 120
    const x = c.getContext('2d')!
    const TINTA = '#231832'
    const CONT = '#c9b78e'
    const POR = '#f4eee6'
    const px = (a: number, b: number, w = 1, h = 1, cor = POR) => {
      x.fillStyle = cor
      x.fillRect(a, b, w, h)
    }
    function balao(ox: number, oy: number, t: number) {
      if (t <= 0) return
      const w = Math.round(4 + 12 * t)
      const h = Math.round(3 + 10 * t)
      const l = ox + 10 - (w >> 1)
      const top = oy + 14 - h
      x.fillStyle = CONT
      x.fillRect(l - 1, top, w + 2, h)
      x.fillRect(l, top - 1, w, h + 2)
      x.fillStyle = TINTA
      x.fillRect(l, top, w, h)
      if (t >= 1) {
        px(ox + 9, oy + 15, 2, 1, CONT)
        px(ox + 9, oy + 14, 2, 1, TINTA)
        px(ox + 8, oy + 16, 1, 1, CONT)
      }
    }
    const icone: Record<string, (ox: number, oy: number, f: number) => void> = {
      '!': (ox, oy, f) => {
        const s = f === 4 ? -1 : 0
        px(ox + 9, oy + 4 + s, 2, 5)
        px(ox + 9, oy + 10 + s, 2, 2)
      },
      '?': (ox, oy, f) => {
        const s = f === 5 ? 1 : 0
        px(ox + 8 + s, oy + 4, 4, 1)
        px(ox + 12 + s, oy + 5, 1, 2)
        px(ox + 10 + s, oy + 7, 2, 1)
        px(ox + 10 + s, oy + 8, 1, 1)
        px(ox + 10 + s, oy + 10, 1, 2)
      },
      '…': (ox, oy, f) => {
        const n = Math.min(3, f - 2)
        for (let k = 0; k < n; k++) px(ox + 6 + k * 3, oy + 9, 2, 2)
      },
      '♪': (ox, oy, f) => {
        const s = f % 2 ? -1 : 0
        px(ox + 11, oy + 4 + s, 1, 6)
        px(ox + 12, oy + 4 + s, 2, 1)
        px(ox + 13, oy + 5 + s, 1, 1)
        px(ox + 9, oy + 9 + s, 2, 2)
      },
      zz: (ox, oy, f) => {
        px(ox + 7, oy + 5, 4, 1)
        px(ox + 9, oy + 6, 1, 1)
        px(ox + 8, oy + 7, 1, 1)
        px(ox + 7, oy + 8, 4, 1)
        if (f >= 5) {
          px(ox + 12, oy + 3, 3, 1)
          px(ox + 13, oy + 4, 1, 1)
          px(ox + 12, oy + 5, 3, 1)
        }
      },
    }
    TIPOS.forEach((tp, lin) => {
      for (let f = 0; f < 8; f++) {
        const ox = f * 20
        const oy = lin * 20
        if (tp === 'gota') {
          if (f < 7) {
            const g = oy + 5 + Math.min(f, 4)
            px(ox + 14, g, 2, 3, '#9fd3e8')
            px(ox + 14, g - 1, 1, 1, '#9fd3e8')
            px(ox + 15, g + 2, 1, 1, '#5c8ea8')
          }
          continue
        }
        balao(ox, oy, f === 7 ? 0.5 : Math.min(1, (f + 1) / 3))
        if (f >= 3 && f < 7) icone[tp](ox, oy, f)
      }
    })
    return c.toDataURL()
  })()
  const bal = document.createElement('i')
  bal.className = 'chibi-balao'
  bal.hidden = true
  bal.style.backgroundImage = `url(${folhaBalao})`
  mundo.append(bal)
  let balT: number | null = null
  let balTipo = 0
  let balQ = 0
  const BAL_Q = [1, 1, 1, 1, 2, 2, 2, 1]
  function balao(tipo: string) {
    const k = TIPOS.indexOf(tipo)
    if (k < 0) return
    balTipo = k
    balQ = calmo ? 5 : 0
    balT = 0
    bal.hidden = false
  }
  const ocupado = () =>
    !$('.cv-cartao').hidden || !$('.cv-viagem').hidden || !$('.cv-casa').hidden || !!raiz.querySelector('.visita') || document.hidden || o.ocupado()

  let folhaPronta = false
  let t0 = performance.now()
  let relogio = 0
  let andado = 0
  let quadroAnt = -1
  let andava = false
  let xAnt = 0
  let yAnt = 0
  let assenta = 0
  let proxPisca = 1.5 + Math.random() * 3
  let pisca = 0
  let piscaDupla = false
  let proxOlha = 5 + Math.random() * 5
  let olhando = 0
  let colOlha = 0
  let respT = 0
  let trecho: Pt | undefined
  let dirAnt = 0
  /* ---- ociosidade: depois de ~4 s parado, de tempos em tempos (7-14 s) uma destas; parado 45 s, cochila ---- */
  type Ocio = { tipo: 'vira' | 'cantarola' | 'pulo'; t: number; dur: number; volta?: number }
  let ocio: Ocio | null = null
  let tParado = 0
  // ?ocio=rapido (só para as capturas): tudo acontece mais cedo, para caber num vídeo curto
  const OCIO_RAPIDO = new URLSearchParams(window.location.search).get('ocio') === 'rapido'
  const SONO = OCIO_RAPIDO ? 16 : 45
  const esperaOcio = () => (OCIO_RAPIDO ? 1.5 + Math.random() : 7 + Math.random() * 7)
  let proxOcio = OCIO_RAPIDO ? 2 : 6 + Math.random() * 5
  let dormindo = false
  let zzT = 0
  let pulo = -1
  const PULO = [-1, -2, -1, 0]
  function acorda() {
    if (dormindo) {
      dormindo = false
      proxPisca = 0.25
    }
    tParado = 0
    if (ocio) {
      if (ocio.tipo === 'vira' && !eu.rota.length && ocio.volta != null) eu.dir = ocio.volta
      ocio = null
      proxOcio = esperaOcio()
    }
    oc0.x = 0
    oc0.y = 0
    pulo = -1
  }
  function ocioso(dt: number) {
    tParado += dt
    if (dormindo) {
      zzT -= dt
      if (zzT <= 0) {
        balao('zz')
        zzT = 3.2
      }
      return
    }
    if (tParado > SONO && !ocio) {
      dormindo = true
      zzT = 0.6
      olhando = 0
      return
    }
    if (ocio) {
      ocio.t += dt
      // cantarola: balança 1 px para cada lado, no ritmo da musiquinha
      if (ocio.tipo === 'cantarola') oc0.x = [0, 1, 0, -1][Math.floor(ocio.t / 0.28) % 4]
      // pulinho: sobe 1, 2, 1 e assenta (um quadro de 80 ms cada)
      if (ocio.tipo === 'pulo') {
        const q = Math.floor(ocio.t / TIQUE)
        pulo = q < PULO.length ? q : -1
        oc0.y = q < PULO.length ? PULO[q] : 0
      }
      if (ocio.t >= ocio.dur) {
        if (ocio.tipo === 'vira' && ocio.volta != null) eu.dir = ocio.volta
        ocio = null
        oc0.x = 0
        oc0.y = 0
        pulo = -1
        proxOcio = esperaOcio()
      }
      return
    }
    if (tParado < (OCIO_RAPIDO ? 1 : 4) || olhando > 0 || balT !== null) return
    proxOcio -= dt
    if (proxOcio > 0) return
    const r = Math.random()
    if (r < 0.45) {
      // vira o corpo para olhar em volta e depois volta para onde estava
      const volta = eu.dir
      eu.dir = eu.dir === 0 ? (Math.random() < 0.5 ? 1 : 2) : eu.dir === 3 ? 0 : Math.random() < 0.6 ? 0 : eu.dir === 1 ? 2 : 1
      ocio = { tipo: 'vira', t: 0, dur: 1.3 + Math.random() * 0.8, volta }
    } else if (r < 0.8) {
      balao('♪')
      ocio = { tipo: 'cantarola', t: 0, dur: 2.2 }
    } else {
      ocio = { tipo: 'pulo', t: 0, dur: TIQUE * PULO.length + 0.05 }
      if (Math.random() < 0.5) balao('♪')
    }
  }
  function laco(t: number) {
    if (!vivo) return
    // mesa ou guarda-roupa por cima (painel opaco): o mapa não precisa desenhar
    if (o.ocupado()) {
      t0 = t
      requestAnimationFrame(laco)
      return
    }
    const dt = Math.min(0.05, (t - t0) / 1000)
    t0 = t
    // anda: 62 px/s, casa com o passo do chibi (PX_QUADRO), o pé quase não patina
    if (eu.rota.length) {
      const [x, y] = eu.rota[0]
      const dx = x - eu.x
      const dy = y - eu.y
      const d = Math.hypot(dx, dy)
      const v = 62 * dt
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
        // a direção é decidida uma vez por trecho do caminho (não a cada quadro): nas curvas o corpo não fica
        // trocando entre frente e lado; trecho curtinho (menos de 8 px) não vira o corpo
        if (eu.rota[0] !== trecho) {
          trecho = eu.rota[0]
          if (d >= 8 || !andava) eu.dir = Math.abs(dx) > Math.abs(dy) * (eu.dir === 1 || eu.dir === 2 ? 1 : 1.3) ? (dx < 0 ? 1 : 2) : dy > 0 ? 0 : 3
        }
        eu.x += (dx / d) * v
        eu.y += (dy / d) * v
        relogio += dt
      }
    }
    // vida do chibi
    const andando = eu.rota.length > 0
    let col = COL.parado
    let sobe = false
    if (andando) {
      if (!andava) andado = 6 // começa com o pé saindo do chão
      const lado = eu.dir === 1 || eu.dir === 2
      const mx = Math.abs(eu.x - xAnt)
      const my = Math.abs(eu.y - yAnt)
      andado += (lado ? Math.max(mx, my * 0.35) : Math.max(my, mx * 0.35)) / PX_QUADRO
      olhando = 0
      const k = Math.floor(andado) % 8
      col = 1 + k
      sobe = ANDAR_BOB[k] < 0
      if (k !== quadroAnt && k % 4 === 0) passoSom(k === 0)
      quadroAnt = k
      assenta = 0
    } else {
      if (andava) assenta = TIQUE // ao parar, 1 tique assentado
      quadroAnt = -1
      andado = 0
      if (assenta > 0) {
        assenta -= dt
        col = COL.assenta
      } else if (!calmo && !ocupado()) {
        // respira: peito sobe por ~0,9 s a cada 2,6 s
        respT = (respT + dt) % 2.6
        const peito = respT > 1.7
        // pisca: fecha ~110 ms a cada 3-6,5 s (às vezes duas vezes); pisca também logo depois de virar o corpo, como
        // quem vira a cabeça
        if (eu.dir !== dirAnt) {
          proxPisca = Math.min(proxPisca, 0.14)
          dirAnt = eu.dir
        }
        proxPisca -= dt
        if (proxPisca <= 0 && pisca <= 0) {
          pisca = TIQUE * 1.4
          piscaDupla = Math.random() < 0.1
          proxPisca = 3 + Math.random() * 3.5
        }
        if (pisca > 0) {
          pisca -= dt
          if (pisca <= 0) {
            if (piscaDupla) {
              piscaDupla = false
              pisca = -TIQUE
            } else pisca = 0
          }
        } else if (pisca < 0) {
          pisca += dt
          if (pisca >= 0) pisca = TIQUE * 1.2
        }
        // olha para o lado só com a cabeça, segura 1-1,6 s; de costas não olha
        proxOlha -= dt
        if (proxOlha <= 0 && olhando <= 0 && eu.dir !== 3 && !ocio && !dormindo) {
          olhando = 1 + Math.random() * 0.6
          colOlha = eu.dir === 0 ? (Math.random() < 0.5 ? COL.olhaE : COL.olhaD) : COL.olhaF
          proxOlha = 6 + Math.random() * 7
          if (Math.random() < 0.2) balao(Math.random() < 0.5 ? '?' : '…')
        }
        // animações de ociosidade (dono, 08/11: "crie animações de ociosidade"): virar o corpo para olhar em volta,
        // cantarolar balançando, um pulinho e, parado por muito tempo, cochilar
        ocioso(dt)
        if (dormindo) {
          col = peito ? COL.piscaPeito : COL.pisca
        } else if (olhando > 0) {
          olhando -= dt
          col = colOlha
        } else if (pisca > 0 && eu.dir !== 3) col = peito ? COL.piscaPeito : COL.pisca
        else if (peito) col = COL.peito
        if (pulo >= 0) sobe = true
      } else acorda()
    }
    if (andando || calmo) acorda()
    andava = andando
    if (folhaPronta) ator.style.backgroundPosition = `-${col * 80}px -${eu.dir * 96}px`
    xAnt = eu.x
    yAnt = eu.y
    // sombra em pixel: 2 px mais estreita quando o corpo sobe
    sombra.style.width = sobe ? '38px' : ''
    sombra.style.marginLeft = sobe ? '-19px' : ''
    if (balT !== null) {
      balT += dt
      while (balT >= BAL_Q[balQ] * TIQUE && balQ < 8) {
        balT -= BAL_Q[balQ] * TIQUE
        balQ++
      }
      if (balQ >= 8 || (calmo && balT > 1.2)) {
        bal.hidden = true
        balT = null
      } else {
        bal.style.backgroundPosition = `-${(calmo ? 5 : balQ) * 40}px -${balTipo * 40}px`
        bal.style.left = Math.round(eu.x) + 'px'
        bal.style.top = Math.round(eu.y) + 'px'
      }
    }
    desenha()
    camera(dt)
    posicionaSetas()
    requestAnimationFrame(laco)
  }
  void relogio

  /* ---------- botões ---------- */
  $('.cv-andares').onclick = pintaCasa
  $('.cv-c-fechar').onclick = () => ($('.cv-casa').hidden = true)
  $('.a-terreo').onclick = () => (sala === 'terreo' ? ($('.cv-casa').hidden = true) : vai('terreo'))
  $('.a-quartos').onclick = () => {
    if (etapa < 3) return aviso('O andar dos quartos abre depois da sua primeira fabricação na mesa')
    if (sala === 'quarto') $('.cv-casa').hidden = true
    else vai('quarto')
  }
  $('.cv-sair').onclick = () => o.onSair()
  if (o.equipe) {
    $('.cv-teste').hidden = false
    raiz.querySelectorAll<HTMLButtonElement>('.cv-teste button[data-e]').forEach((b) => (b.onclick = () => mudaEtapa(+b.dataset.e! as CasaEtapa)))
    $('.cv-campainha').onclick = campainha
  }
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      fechaCartao()
      $('.cv-casa').hidden = true
      $('.cv-viagem').hidden = true
    }
  }
  addEventListener('keydown', tecla)
  const ro = new ResizeObserver(() => {
    medida()
    camera(0)
  })
  ro.observe(raiz)

  medida()
  cena()
  ;[eu.x, eu.y] = SEL([S.inicio])[0]
  if (sala === 'quarto') eu.dir = 3
  xAnt = eu.x
  yAnt = eu.y
  pintaPontos()
  desenha()
  camera(0)
  requestAnimationFrame(laco)

  // o chibi segue a aparência escolhida
  // (o pedido mais novo vence; uma falha de rede tenta de novo uma vez)
  let pedidoFolha = 0
  let urlFolha: string | null = null
  function vestir(ap: Aparencia, tentativa = 0) {
    const meu = ++pedidoFolha
    folhaAndarFofo(ap)
      .then(
        (cv) =>
          new Promise<void>((ok) =>
            cv.toBlob((b) => {
              if (!vivo || meu !== pedidoFolha || !b) return ok()
              if (urlFolha) URL.revokeObjectURL(urlFolha)
              urlFolha = URL.createObjectURL(b)
              ator.style.backgroundImage = `url(${urlFolha})`
              ator.style.backgroundSize = `${cv.width}px ${cv.height}px`
              folhaPronta = true
              ok()
            }),
          ),
      )
      .catch(() => {
        if (vivo && meu === pedidoFolha && tentativa < 1) depois(() => vestir(ap, tentativa + 1), 1500)
      })
  }
  vestir(o.aparencia)
  ;($('.cv-sair') as HTMLButtonElement).focus({ preventScroll: true })

  return {
    aviso,
    campainha,
    campainhaQuandoLivre,
    mudaEtapa,
    vai,
    /** Fecha a camada de cima (cartão, viagem, andares). Devolve false se não havia nenhuma. */
    fechaTopo() {
      if (!$('.cv-cartao').hidden) return fechaCartao(), true
      if (!$('.cv-viagem').hidden) return ($('.cv-viagem').hidden = true), true
      if (!$('.cv-casa').hidden) return ($('.cv-casa').hidden = true), true
      return false
    },
    /** Visita na porta (ou a campainha tocando): o voltar não fecha a Casa no meio dela. */
    get emVisita() {
      return !!visita || tocando
    },
    /** Dados novos do servidor (fabricações, etapa, aparência). */
    atualiza(n: { etapa?: CasaEtapa; andamento?: number; aparencia?: Aparencia }) {
      if (n.aparencia && JSON.stringify(n.aparencia) !== JSON.stringify(o.aparencia)) {
        o.aparencia = n.aparencia
        vestir(n.aparencia)
      }
      if (n.andamento != null && n.andamento !== andamento) {
        andamento = n.andamento
        pintaPontos()
      }
      // a equipe testa as etapas pelo painel: o servidor (sempre 3 para ela) não desfaz o teste
      if (n.etapa && n.etapa !== etapa && !o.equipe) mudaEtapa(n.etapa)
    },
    get sala() {
      return sala
    },
    destroi() {
      vivo = false
      soltaPula()
      if (urlFolha) URL.revokeObjectURL(urlFolha)
      visita?.cancela()
      timers.forEach(clearTimeout)
      timers.clear()
      ro.disconnect()
      removeEventListener('keydown', tecla)
      raiz.innerHTML = ''
    },
  }
}

export type CasaMotor = ReturnType<typeof criaCasa>
