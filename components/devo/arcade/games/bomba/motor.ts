import { rng } from '@/lib/devo/arcade/games'
import { vibrate } from '../../game-hud'

/*
 * Motor da Bomba Quente no visual do v2 (protótipo aprovado: docs/redesign/v2/kit3/os-bomba.js).
 * Regras, física, rodadas, eventos e pontos são os do jogo de sempre; só o desenho mudou: sai o three.js e entra
 * um canvas pequeno ampliado em pixel (arena-relógio, ponteiros no lugar das barras, figuras mascaradas).
 * Online quem decide dono da bomba, explosão, rodada e placar é o servidor (lib/devo/arcade/rooms.ts); no treino o
 * próprio aparelho faz esse papel. Nada aqui passa pelo React a cada quadro: tudo vive em variáveis e refs.
 */

export type Side = 'a' | 'b'
export type Pair = { a: number; b: number }
export type Auth = {
  round: number
  holder: Side
  passAt: number
  explodeAt: number
  phase: 'play' | 'boom'
  boomAt: number
  wins: Pair
  score: Pair
  passes: Pair
  clutch: Pair
}

export const R = 9.5
export const POINTS = 3
export const COUNTDOWN_MS = 3200
export const BOOM_MS = 2600
const COOLDOWN = 0.9
const FUSE_MIN = 14
const FUSE_SPAN = 10
/** pixels por unidade, achatamento do chão e altura na tela */
const U = 10.5
const K = 0.72
const ALTO = 0.85
/** célula dos personagens e linha dos pés */
const CW = 36
const CH = 48
const PE = 46

export const ARTE_DIR = '/v2/art/os/bomba'
const ARTE = ['coelho', 'urso', 'arena', 'sala', 'bomba', 'bomba2', 'bumper', 'bumper2', 'plinto', 'bola', 'poste-b', 'poste-n', 'poeira', 'fogo', 'explosao'] as const
type Arte = (typeof ARTE)[number]
type Imgs = Partial<Record<Arte, HTMLImageElement>>

const FOGO = ['#a3121f', '#ff6670', '#ece5d8', '#fff4e0']
const PO = ['#ece5d8', '#fff4e0', '#bab09f']
const CONF = ['#f1f0ee', '#bab09f', '#38393c', '#ece5d8', '#2c2c31', '#8a7cc8', '#c2b9ec']

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a')
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const norm = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y)
  return l > 1 ? [x / l, y / l] : [x, y]
}

/** A arte é baixada uma vez por sessão (88 KB). Se alguma falhar, a próxima partida tenta de novo. */
let carregando: Promise<Imgs> | null = null
function carrega(): Promise<Imgs> {
  if (carregando) return carregando
  const p = Promise.all(
    ARTE.map(
      (n) =>
        new Promise<[Arte, HTMLImageElement | null]>((ok) => {
          const i = new Image()
          i.onload = () => ok([n, i])
          i.onerror = () => ok([n, null])
          i.src = `${ARTE_DIR}/${n}.png`
        }),
    ),
  ).then((l) => {
    const out: Imgs = {}
    for (const [n, i] of l) if (i) out[n] = i
    if (l.some(([, i]) => !i)) carregando = null
    return out
  })
  carregando = p
  return p
}

/** Quantos eventos existem (a lista EV abaixo). */
const EVENTOS = 6
/**
 * Mesma sequência de eventos nos dois aparelhos: derivada da seed da sala e da rodada.
 * Antes sorteava entre 5 numa lista de 6 e "CHÃO INSTÁVEL!" nunca saía. Os eventos só existem no aparelho
 * (o servidor não os conhece), então a correção não muda nada do que o servidor confere.
 */
export function eventSchedule(seed: number, round: number) {
  const r = rng(seed + round * 977)
  const out: { t: number; e: number; r: () => number }[] = []
  let t = 4 + r() * 2
  while (t < 40) {
    out.push({ t, e: Math.floor(r() * EVENTOS), r: rng(seed + round * 977 + Math.floor(t * 100)) })
    t += 5 + r() * 3
  }
  return out
}

export type BombaDom = {
  /** raiz `.bq` (recebe `perigo` nos últimos segundos com a bomba na mão) */
  root: HTMLElement
  area: HTMLElement
  cv: HTMLCanvasElement
  pad: HTMLElement
  jb: HTMLElement
  pula: HTMLElement
  /** o ponto do nível de inclinação (`.bq-nivel i`) */
  nivel: HTMLElement
  msg: HTMLElement
  st: HTMLElement
  /** losangos de pontos: meus e do oponente */
  s1: HTMLElement
  s2: HTMLElement
}

type Ref<T> = { current: T }

export type BombaCtx = {
  dom: BombaDom
  seed: number
  mySide: Side
  online: boolean
  /** força do bot do treino (pela nota do oponente) */
  skill: number
  nomeOp: string
  auth: Ref<Auth | null>
  started: Ref<boolean>
  ended: Ref<boolean>
  /** online: última posição do oponente vinda do servidor */
  oppNet: Ref<{ x: number; z: number; h: number } | null>
  /** minha posição, mandada ao servidor a cada consulta */
  me: Ref<{ x: number; y: number; z: number }>
  mudo: () => boolean
  /** online: pedir ao servidor o passe da bomba */
  tag: () => void
  /** treino: a partida acabou (o aparelho fez o papel do servidor) */
  fimTreino: (A: Auth) => void
}

type Pl = {
  i: 0 | 1
  side: Side
  sheet: 'coelho' | 'urso'
  x: number
  z: number
  y: number
  vx: number
  vz: number
  kx: number
  kz: number
  dir: number
  flip: boolean
  jv: number
  sq: number
  fly: number
  jr: number
  rot: number
}
type Ob = { x: number; z: number; r: number; h: number; bump: boolean; pop: number; art: Arte }
type Ponteiro = { a: number; w: number; len: number; cor: [string, string, string, string] }
type Bola = { x: number; y: number; z: number; vx: number; vy: number; vz: number; l: number }
type Part = { l: number; m: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; s: number; c: string }
type Item =
  | { z: number; t: 0; ob: Ob }
  | { z: number; t: 1; po: { x: number; z: number; art: Arte; i: number } }
  | { z: number; t: 2; s: Ponteiro; t0: number; t1: number; dx: number; dz: number; ponta: number }
  | { z: number; t: 3; q: Bola }
  | { z: number; t: 4; p: Pl }

export function montaBomba(ctx: BombaCtx) {
  const { dom, seed, mySide, online, skill } = ctx
  const myIdx = mySide === 'a' ? 0 : 1
  const x = dom.cv.getContext('2d', { alpha: false })!
  const parado = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  let img: Imgs | null = null
  let W = 232
  let H = 375
  let CX = 116
  let CY = 138

  /* ---- som: os bipes sintetizados de sempre ---- */
  let AC: AudioContext | null = null
  const snd = (f: number, d = 0.08, ty: OscillatorType = 'square', v = 0.05, sl = 0) => {
    if (ctx.mudo()) return
    try {
      AC = AC || new AudioContext()
      const o = AC.createOscillator()
      const g = AC.createGain()
      const n = AC.currentTime
      o.type = ty
      o.frequency.setValueAtTime(f, n)
      if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + sl), n + d)
      g.gain.setValueAtTime(v, n)
      g.gain.exponentialRampToValueAtTime(0.0001, n + d)
      o.connect(g)
      g.connect(AC.destination)
      o.start()
      o.stop(n + d)
    } catch {}
  }

  /* ---- mundo ---- */
  const P: [Pl, Pl] = [0, 1].map((i) => ({
    i: i as 0 | 1,
    side: (i ? 'b' : 'a') as Side,
    sheet: i ? 'urso' : 'coelho',
    x: i ? 4 : -4,
    z: 3,
    y: 0,
    vx: 0,
    vz: 0,
    kx: 0,
    kz: 0,
    dir: 0,
    flip: false,
    jv: 0,
    sq: 0,
    fly: 0,
    jr: 0,
    rot: 0,
  })) as [Pl, Pl]
  const ME = P[myIdx]
  const OPP = P[1 - myIdx]
  /** online o oponente vem da rede; só eu sou simulado aqui */
  const simulated = (p: Pl) => p === ME || !online

  // hub central (o plinto do relógio) e cinco bumpers
  const OB: Ob[] = [{ x: 0, z: 0, r: 0.8, h: 1, bump: false, pop: 0, art: 'plinto' }]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.283 + 0.3
    OB.push({ x: Math.cos(a) * 5.6, z: Math.sin(a) * 5.6, r: 0.7, h: 0.9, bump: true, pop: 0, art: 'bumper' })
  }
  // As duas barras giratórias do jogo são os ponteiros deste relógio.
  const SW: Ponteiro[] = [0, 1].map((i) => ({
    a: i * 1.5,
    w: i ? -1.2 : 1.5,
    len: R * 0.75,
    cor: (i ? ['#efe6d8', '#b5ab99', '#5f5a50', '#d9cfba'] : ['#d9b25c', '#a07c34', '#4f3d18', '#f2cf7a']) as Ponteiro['cor'],
  }))
  const POSTES = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 6.283 + 0.2
    return { x: Math.cos(a) * (R + 0.5), z: Math.sin(a) * (R + 0.5), art: (i % 2 ? 'poste-b' : 'poste-n') as Arte, i }
  })
  const NP = 220
  const pd: Part[] = Array.from({ length: NP }, () => ({ l: 0, m: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 1, c: '#fff' }))
  let pi = 0
  const balls: Bola[] = []
  const waves: { x: number; z: number; t: number }[] = []
  const later: { at: number; fn: () => void }[] = []

  let state: 'menu' | 'cd' | 'play' | 'boom' = 'menu'
  let cd = 0
  let lastN = 0
  let shake = 0
  let inv = 0
  let swT = 0
  let bp = 0
  let onP = 0
  let T = 0
  let seenRound = 0
  let boomRound = 0
  let boomT = 0
  let lastHolder: Side | null = null
  let lastTag = 0
  let lastWins = ''
  let lastClutch = 0
  let sched: ReturnType<typeof eventSchedule> = []
  let evIdx = 0
  let botWob = 0
  let tiltWarn = false
  let tbUntil = 0
  let rseed = 0
  let flashA = 0
  let perigo = false
  let nivelCss = ''
  const tl = [0, 0]
  const tilt = { m: 0, dx: 0, dz: 0 }
  const keys: Record<string, number> = {}
  const joy = { x: 0, y: 0 }

  const burst = (bx: number, by: number, bz: number, n: number, sp: number, h: number, rg = 0.12) => {
    for (let k = 0; k < n; k++) {
      pi = (pi + 1) % NP
      const p = pd[pi]
      const a = Math.random() * 6.28
      const e = -0.2 + Math.random() * 1.2
      const s = (0.3 + Math.random() * 0.7) * sp
      p.x = bx
      p.y = by
      p.z = bz
      p.vx = Math.cos(a) * s * (1 - e * 0.4)
      p.vz = Math.sin(a) * s * (1 - e * 0.4)
      p.vy = Math.abs(e) * s + 2
      p.l = p.m = 0.5 + Math.random() * 0.7
      p.s = Math.random() < 0.3 ? 3 : 2
      // explosão (matiz baixo, faixa larga) = fogo rubi; poeira/faísca = aço claro; resto = confete
      const l = h < 0.15 ? (rg >= 0.1 ? FOGO : PO) : CONF
      p.c = l[Math.floor(Math.random() * l.length)]
    }
  }

  /* ---- avisos ---- */
  let msgT = 0
  const msg = (t: string, ms = 1500, tom: 'ouro' | 'neutro' | 'perigo' = 'ouro') => {
    const c = dom.msg
    c.textContent = ''
    const p = document.createElement('p')
    p.className = `mr-pop ${tom}`
    p.textContent = t
    c.append(p)
    window.clearTimeout(msgT)
    msgT = window.setTimeout(() => p.remove(), ms)
  }
  const pips = (el: HTMLElement, n: number) => {
    el.textContent = ''
    for (let i = 0; i < POINTS; i++) {
      const d = document.createElement('i')
      if (i < n) d.className = 'on'
      el.append(d)
    }
    el.setAttribute('aria-label', `${n} ${n === 1 ? 'ponto' : 'pontos'}`)
  }
  const status = () => {
    const A = ctx.auth.current
    if (!A) return
    const meu = A.holder === mySide
    dom.st.textContent = meu ? `A bomba é sua. Encoste em ${ctx.nomeOp} para passar.` : `A bomba está com ${ctx.nomeOp}. Fuja.`
    dom.st.classList.toggle('meu', meu)
  }

  const EV: [string, (r: () => number, now: number) => void][] = [
    [
      'TERREMOTO!',
      () => {
        shake = 1
        for (const p of P)
          if (simulated(p)) {
            p.kx += -10 + Math.random() * 20
            p.kz += -10 + Math.random() * 20
          }
      },
    ],
    [
      'CHUVA DE BOLAS!',
      (r, now) => {
        for (let i = 0; i < 9; i++)
          later.push({
            at: now + i * 180,
            fn: () => {
              r() // a cor da bola no 3D: consumida para a sequência seguir igual à de antes
              const a = r() * 6.28
              const d = r() * R * 0.8
              balls.push({ x: Math.cos(a) * d, y: 14, z: Math.sin(a) * d, vx: -3 + r() * 6, vy: 0, vz: -3 + r() * 6, l: 11 })
            },
          })
      },
    ],
    ['BARRAS TURBO!', () => void (swT = 5)],
    ['CONTROLES INVERTIDOS!', () => void (inv = 4)],
    [
      'FOGOS DE ARTIFÍCIO!',
      (r, now) => {
        for (let i = 0; i < 5; i++) {
          const fx = -8 + r() * 16
          const fy = 5 + r() * 4
          const fz = -8 + r() * 12
          const h = r()
          later.push({ at: now + i * 250, fn: () => burst(fx, fy, fz, 40, 6, h) })
        }
      },
    ],
    ['CHÃO INSTÁVEL!', (_r, now) => void (tbUntil = now + 3000)],
  ]

  /* ---- treino: o aparelho faz o papel do servidor ---- */
  const fuseMs = (round: number) => Math.round((FUSE_MIN + rng(seed + round * 131)() * FUSE_SPAN) * 1000)
  const firstHolder = (round: number): Side => (rng(seed + round * 71)() < 0.5 ? 'a' : 'b')
  const driveOffline = (now: number) => {
    const A = ctx.auth.current
    if (!A || ctx.ended.current) return
    if (A.phase === 'play' && now >= A.explodeAt) {
      const w = other(A.holder)
      A.phase = 'boom'
      A.boomAt = now
      A.wins[w] += 1
      A.score[w] += 300
    } else if (A.phase === 'boom' && now >= A.boomAt + BOOM_MS) {
      if (A.wins.a >= POINTS || A.wins.b >= POINTS) {
        ctx.ended.current = true
        ctx.fimTreino(A)
        return
      }
      A.round += 1
      A.holder = firstHolder(A.round)
      A.phase = 'play'
      A.passAt = now + COUNTDOWN_MS
      A.explodeAt = A.passAt + fuseMs(A.round)
    }
  }
  const comecaTreino = () => {
    const now = Date.now()
    const passAt = now + COUNTDOWN_MS
    ctx.auth.current = {
      round: 1,
      holder: firstHolder(1),
      passAt,
      explodeAt: passAt + fuseMs(1),
      phase: 'play',
      boomAt: 0,
      wins: { a: 0, b: 0 },
      score: { a: 0, b: 0 },
      passes: { a: 0, b: 0 },
      clutch: { a: 0, b: 0 },
    }
    ctx.started.current = true
    snd(600, 0.1, 'triangle', 0.1, 300)
  }

  const newRound = (A: Auth) => {
    seenRound = A.round
    lastN = 0
    cd = 0
    inv = swT = 0
    lastHolder = A.holder
    lastClutch = A.clutch.a + A.clutch.b
    sched = eventSchedule(seed, A.round)
    evIdx = 0
    later.length = 0
    balls.length = 0
    tiltWarn = false
    tbUntil = 0
    rseed = rng(seed + A.round * 131)() * 6.28
    for (const p of P) {
      p.x = p.i ? 4 : -4
      p.z = 3
      p.vx = p.vz = p.kx = p.kz = 0
      p.y = 0
      p.jv = 0
      p.fly = 0
      p.rot = 0
    }
    ctx.oppNet.current = null
    status()
  }
  const boom = (holder: Side) => {
    boomT = 0
    const p = P[holder === 'a' ? 0 : 1]
    p.fly = 1
    burst(p.x, 1, p.z, 110, 12, 0.02, 0.14)
    burst(p.x, 1, p.z, 40, 8, 0.12, 0.1)
    shake = 1.4
    flashA = parado ? 0 : 0.65
    snd(150, 0.7, 'sawtooth', 0.25, -110)
    msg('BUUUM!', 2000, 'perigo')
    waves.push({ x: p.x, z: p.z, t: 0 })
    vibrate([40, 30, 80])
  }

  /* ---- entrada: teclado, joystick de toque e botão PULA ---- */
  const input = (): [number, number] => {
    const v = norm(
      (keys.KeyD || keys.ArrowRight || 0) - (keys.KeyA || keys.ArrowLeft || 0) + joy.x,
      (keys.KeyS || keys.ArrowDown || 0) - (keys.KeyW || keys.ArrowUp || 0) + joy.y,
    )
    return inv > 0 ? [-v[0], -v[1]] : v
  }
  const JK = new Set(['Space', 'Enter', 'ShiftRight'])
  /** Digitando no chat ao vivo, as teclas são do chat, não do jogo. */
  const digitando = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
  }
  const kd = (e: KeyboardEvent) => {
    if (digitando(e)) return
    keys[e.code] = 1
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
    if (!e.repeat && JK.has(e.code) && ctx.auth.current) ME.jr = 0.15
  }
  const ku = (e: KeyboardEvent) => {
    keys[e.code] = 0
  }
  addEventListener('keydown', kd)
  addEventListener('keyup', ku)
  const knob = dom.jb.firstElementChild as HTMLElement
  let toque: number | null = null
  let tx = 0
  let ty = 0
  const pdown = (e: PointerEvent) => {
    if (toque !== null) return
    dom.pad.setPointerCapture(e.pointerId)
    toque = e.pointerId
    const r = dom.area.getBoundingClientRect()
    tx = e.clientX
    ty = e.clientY
    dom.jb.style.left = `${tx - r.left}px`
    dom.jb.style.top = `${ty - r.top}px`
    dom.jb.hidden = false
  }
  const pmove = (e: PointerEvent) => {
    if (e.pointerId !== toque) return
    const v = norm((e.clientX - tx) / 55, (e.clientY - ty) / 55)
    joy.x = v[0]
    joy.y = v[1]
    knob.style.transform = `translate(${v[0] * 44}px,${v[1] * 44}px)`
  }
  const pend = (e: PointerEvent) => {
    if (e.pointerId !== toque) return
    toque = null
    joy.x = joy.y = 0
    dom.jb.hidden = true
    knob.style.transform = ''
  }
  const jdown = (e: PointerEvent) => {
    e.preventDefault()
    ME.jr = 0.15
  }
  dom.pad.addEventListener('pointerdown', pdown)
  dom.pad.addEventListener('pointermove', pmove)
  dom.pad.addEventListener('pointerup', pend)
  dom.pad.addEventListener('pointercancel', pend)
  dom.pula.addEventListener('pointerdown', jdown)

  /* ---- física: a mesma do jogo ---- */
  const botInput = (A: Auth): [number, number] => {
    botWob += 1 / 60
    const dx = ME.x - OPP.x
    const dz = ME.z - OPP.z
    const d = Math.hypot(dx, dz) || 0.01
    let ix: number
    let iz: number
    if (A.holder === OPP.side) {
      ix = dx / d
      iz = dz / d
    } else {
      const ax = -dx / d
      const az = -dz / d
      const wob = Math.sin(botWob * 1.7) * 0.8
      const r = Math.hypot(OPP.x, OPP.z) / R
      ix = ax - az * wob - OPP.x * 0.12 * r
      iz = az + ax * wob - OPP.z * 0.12 * r
    }
    const v = norm(ix, iz)
    const k = 0.72 + skill * 0.28
    return [v[0] * k, v[1] * k]
  }
  const fisica = (p: Pl, ix: number, iz: number, pode: boolean, holder: Side | null, dt: number) => {
    let fl = 0
    for (const ob of OB) if (Math.hypot(p.x - ob.x, p.z - ob.z) < ob.r + 0.15 && p.y >= ob.h - 0.3) fl = Math.max(fl, ob.h)
    if (p.jr > 0) p.jr -= dt
    if (pode && !p.fly && p.y <= fl + 0.02 && p.jr > 0) {
      p.jv = 11.5
      p.jr = 0
      snd(420, 0.15, 'triangle', 0.1, 500)
      burst(p.x, fl + 0.1, p.z, 6, 3, 0.1, 0.05)
    }
    if (!p.fly) {
      p.jv -= 32 * dt
      p.y += p.jv * dt
      if (p.y <= fl) {
        if (p.jv < -7) {
          burst(p.x, fl + 0.1, p.z, 8, 3.5, 0.1, 0.05)
          p.sq = 1
        }
        p.y = fl
        p.jv = 0
      }
    }
    const up = Math.max(0, -(ix * tilt.dx + iz * tilt.dz))
    const sp = (holder === p.side ? 5.9 : 5.2) * (1 - up * tilt.m * 1.2)
    const k = Math.min(1, 10 * dt)
    p.vx += (ix * sp - p.vx) * k
    p.vz += (iz * sp - p.vz) * k
    if (!p.fly && p.y <= fl + 0.05) {
      p.kx += tl[0] * 42 * dt
      p.kz += tl[1] * 42 * dt
    }
    const kdp = Math.exp(-4.5 * dt)
    p.kx *= kdp
    p.kz *= kdp
    p.x += (p.vx + p.kx) * dt
    p.z += (p.vz + p.kz) * dt
    const r = Math.hypot(p.x, p.z)
    if (r > R - 0.55) {
      const nx = p.x / r
      const nz = p.z / r
      p.x = nx * (R - 0.55)
      p.z = nz * (R - 0.55)
      const d = p.kx * nx + p.kz * nz
      if (d > 0) {
        p.kx -= 1.8 * d * nx
        p.kz -= 1.8 * d * nz
      }
    }
    for (const ob of OB) {
      const dx = p.x - ob.x
      const dz = p.z - ob.z
      const d = Math.hypot(dx, dz)
      const mr = ob.r + 0.5
      if (d < mr && d > 0 && p.y < ob.h - 0.3) {
        const nx = dx / d
        const nz = dz / d
        p.x = ob.x + nx * mr
        p.z = ob.z + nz * mr
        if (ob.bump) {
          p.kx = nx * 13
          p.kz = nz * 13
          ob.pop = 1
          burst(p.x, 0.6, p.z, 10, 5, Math.random())
          snd(300, 0.1, 'sine', 0.12, 300)
        }
      }
    }
    for (const s of SW) {
      const dx = Math.cos(s.a)
      const dz = -Math.sin(s.a)
      const t = clamp(p.x * dx + p.z * dz, -s.len, s.len)
      const ex = p.x - dx * t
      const ez = p.z - dz * t
      const d = Math.hypot(ex, ez)
      if (d < 0.78 && d > 0 && p.y < 0.75) {
        p.x = dx * t + (ex / d) * 0.78
        p.z = dz * t + (ez / d) * 0.78
        p.kx = (ex / d) * 11
        p.kz = (ez / d) * 11
        burst(p.x, 0.7, p.z, 6, 4, 0.55)
        snd(220, 0.08, 'square', 0.06, -80)
      }
    }
  }
  const passFx = (A: Auth) => {
    const [a, b] = P
    const dx = b.x - a.x
    const dz = b.z - a.z
    const d = Math.hypot(dx, dz) || 0.01
    cd = COOLDOWN
    if (simulated(a)) {
      a.kx = (-dx / d) * 9
      a.kz = (-dz / d) * 9
    }
    if (simulated(b)) {
      b.kx = (dx / d) * 9
      b.kz = (dz / d) * 9
    }
    burst((a.x + b.x) / 2, 1, (a.z + b.z) / 2, 24, 6, Math.random())
    snd(500, 0.12, 'triangle', 0.12, 500)
    shake = Math.max(shake, 0.35)
    // CLUTCH: o placar de clutches (do servidor, online) subiu com este passe
    const c = A.clutch.a + A.clutch.b
    if (c > lastClutch) msg('CLUTCH', 900)
    lastClutch = c
    status()
    vibrate(25)
  }

  function passo(dt: number) {
    T += dt
    const now = Date.now()
    if (!online && ctx.started.current) driveOffline(now)
    if (ctx.ended.current) return
    const A = ctx.auth.current
    if (!A || !ctx.started.current) state = 'menu'
    else {
      if (A.round !== seenRound) newRound(A)
      state = A.phase === 'boom' || (now >= A.explodeAt && A.phase === 'play') ? 'boom' : now < A.passAt ? 'cd' : 'play'
      if (state === 'boom' && boomRound !== A.round) {
        boomRound = A.round
        boom(A.holder)
      }
      const w = `${A.wins.a}:${A.wins.b}`
      if (w !== lastWins) {
        lastWins = w
        pips(dom.s1, A.wins[mySide])
        pips(dom.s2, A.wins[other(mySide)])
      }
    }
    const holder = A && state !== 'menu' ? A.holder : null
    shake = Math.max(0, shake - dt * 1.2)
    inv = Math.max(0, inv - dt)
    swT = Math.max(0, swT - dt)
    cd -= dt
    flashA = Math.max(0, flashA - dt * 1.8)
    for (let i = later.length - 1; i >= 0; i--)
      if (now >= later[i].at) {
        later[i].fn()
        later.splice(i, 1)
      }
    for (const s of SW) s.a += s.w * dt * (swT > 0 ? 2.6 : 1)
    if (state === 'cd' && A) {
      const n = Math.min(3, Math.ceil((A.passAt - now) / 1000))
      if (n !== lastN && n > 0) {
        lastN = n
        msg(String(n), 900, 'neutro')
        snd(440, 0.1, 'square', 0.08)
      }
    }
    if (state === 'play' && A) {
      if (lastN > 0) {
        lastN = 0
        msg('VAI!', 900)
        snd(880, 0.2, 'square', 0.08)
      }
      const ev = sched[evIdx]
      if (ev && now >= A.passAt + ev.t * 1000) {
        evIdx += 1
        const e = EV[ev.e]
        msg(e[0], 1800, 'neutro')
        snd(200, 0.3, 'sawtooth', 0.08, 300)
        e[1](ev.r, now)
      }
      if (lastHolder !== null && A.holder !== lastHolder) passFx(A)
      lastHolder = A.holder
    }
    if (state === 'boom') boomT += dt

    /* chão inclinado: cresce com o tempo da rodada e com o placar; vem do relógio da rodada, igual nos dois lados */
    let ta = 0
    let tdir = 0
    if (state === 'play' && A) {
      const age = (now - A.passAt) / 1000
      const ramp = clamp((age - 3.5) / 9, 0, 1)
      const tb = Math.max(0, (tbUntil - now) / 1000)
      ta = ramp * Math.min(0.2 + 0.035 * (A.wins.a + A.wins.b), 0.34) + (tb > 0 ? 0.12 * Math.min(1, tb) : 0)
      tdir = rseed + age * 0.5 + Math.sin(age * 0.8) * 1.3
    }
    const tk = Math.min(1, 2.5 * dt)
    tl[0] += (Math.cos(tdir) * ta - tl[0]) * tk
    tl[1] += (Math.sin(tdir) * ta - tl[1]) * tk
    tilt.m = Math.hypot(tl[0], tl[1])
    tilt.dx = tilt.m > 0.001 ? tl[0] / tilt.m : 0
    tilt.dz = tilt.m > 0.001 ? tl[1] / tilt.m : 0
    if (state === 'play' && tilt.m > 0.07 && !tiltWarn) {
      tiltWarn = true
      msg('O CHÃO ESTÁ CEDENDO!', 1700, 'perigo')
      snd(90, 0.6, 'sawtooth', 0.07, -30)
    }
    // o nível só é reescrito quando muda de pixel ou de cor
    const css = `${((tl[0] / 0.34) * 12).toFixed(0)},${((tl[1] / 0.34) * 12).toFixed(0)},${tilt.m > 0.22 ? 'perigo' : tilt.m > 0.1 ? 'meio' : ''}`
    if (css !== nivelCss) {
      nivelCss = css
      const [nx, nz, cls] = css.split(',')
      dom.nivel.style.transform = `translate(${nx}px,${nz}px)`
      dom.nivel.className = cls
    }

    for (const p of P) {
      if (simulated(p)) {
        let ix = 0
        let iz = 0
        if (state === 'play' && !p.fly && A) {
          const v = p === ME ? input() : botInput(A)
          ix = v[0]
          iz = v[1]
          if (p !== ME && p.y <= 0.02 && Math.random() < dt * (0.4 + skill)) {
            for (const s of SW) {
              const t = clamp(p.x * Math.cos(s.a) - p.z * Math.sin(s.a), -s.len, s.len)
              if (Math.hypot(p.x - Math.cos(s.a) * t, p.z + Math.sin(s.a) * t) < 1.6) p.jr = 0.15
            }
          }
        }
        fisica(p, ix, iz, state === 'play', holder, dt)
      } else if (!p.fly) {
        // oponente online: segue a última posição que o servidor devolveu, suavizada
        const net = ctx.oppNet.current
        const px = p.x
        const pz = p.z
        if (net) {
          const k = Math.min(1, dt * 12)
          p.x += (net.x - p.x) * k
          p.z += (net.z - p.z) * k
          p.y += (net.h - p.y) * k
        }
        const k2 = Math.min(1, dt * 8)
        p.vx += ((p.x - px) / Math.max(dt, 0.001) - p.vx) * k2
        p.vz += ((p.z - pz) / Math.max(dt, 0.001) - p.vz) * k2
      }
    }
    ctx.me.current.x = ME.x
    ctx.me.current.y = ME.y
    ctx.me.current.z = ME.z

    const [a, b] = P
    const dx = b.x - a.x
    const dz = b.z - a.z
    const d = Math.hypot(dx, dz) || 0.01
    if (state === 'play' && A && d < 1.1 && Math.abs(a.y - b.y) < 0.9) {
      if (!online) {
        if (cd <= 0) {
          const from = A.holder
          A.passes[from] += 1
          A.score[from] += 20
          if (A.explodeAt - now < 2000) {
            A.clutch[from] += 1
            A.score[from] += 100
          }
          A.holder = other(from)
        } else if (d < 1) {
          const o = (1 - d) / 2
          a.x -= (dx / d) * o
          a.z -= (dz / d) * o
          b.x += (dx / d) * o
          b.z += (dz / d) * o
        }
      } else {
        // online quem passa a bomba é o servidor (confere a distância com as posições enviadas)
        if (A.holder === mySide && cd <= 0 && now - lastTag > 300) {
          lastTag = now
          ctx.tag()
        }
        if (d < 1) {
          const o = 1 - d
          const sgn = ME === a ? -1 : 1
          ME.x += sgn * (dx / d) * o
          ME.z += sgn * (dz / d) * o
        }
      }
    }
    for (let i = balls.length - 1; i >= 0; i--) {
      const q = balls[i]
      q.l -= dt
      q.vy -= 22 * dt
      if (q.y < 0.6) {
        q.vx += tl[0] * 34 * dt
        q.vz += tl[1] * 34 * dt
      }
      q.x += q.vx * dt
      q.y += q.vy * dt
      q.z += q.vz * dt
      if (q.y < 0.35) {
        q.y = 0.35
        q.vy = Math.abs(q.vy) * 0.85
      }
      const r = Math.hypot(q.x, q.z)
      if (r > R - 0.4) {
        const nx = q.x / r
        const nz = q.z / r
        const v = q.vx * nx + q.vz * nz
        if (v > 0) {
          q.vx -= 2 * v * nx
          q.vz -= 2 * v * nz
        }
      }
      for (const ob of OB) {
        const ex = q.x - ob.x
        const ez = q.z - ob.z
        const e = Math.hypot(ex, ez)
        if (e < ob.r + 0.35 && e > 0) {
          const nx = ex / e
          const nz = ez / e
          const v = q.vx * nx + q.vz * nz
          if (v < 0) {
            q.vx -= 2 * v * nx
            q.vz -= 2 * v * nz
          }
        }
      }
      if (state !== 'cd')
        for (const p of P) {
          const ex = p.x - q.x
          const ez = p.z - q.z
          const e = Math.hypot(ex, ez)
          if (e < 0.85 && q.y < 1.3 && e > 0 && !p.fly && p.y < 0.9) {
            if (simulated(p)) {
              p.kx += (ex / e) * 8
              p.kz += (ez / e) * 8
            }
            q.vx = (-ex / e) * 7
            q.vz = (-ez / e) * 7
            q.vy = 5
            snd(380, 0.08, 'sine', 0.1, 200)
          }
        }
      if (q.l <= 0) balls.splice(i, 1)
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      waves[i].t += dt
      if (waves[i].t > 0.7) waves.splice(i, 1)
    }
    for (const p of P) {
      const sp = Math.hypot(p.vx, p.vz)
      if (sp > 0.4) {
        if (Math.abs(p.vx) > Math.abs(p.vz) * 0.8) {
          p.dir = 2
          p.flip = p.vx < 0
        } else p.dir = p.vz > 0 ? 0 : 1
      }
      if (p.fly) {
        p.y += 15 * dt
        p.rot += dt * 14
      }
      p.sq = Math.max(0, p.sq - dt * 5)
    }
    for (const ob of OB) if (ob.bump) ob.pop = Math.max(0, ob.pop - dt * 4)
    for (const q of pd)
      if (q.l > 0) {
        q.l -= dt
        q.vy -= 14 * dt
        q.x += q.vx * dt
        q.y = Math.max(0.1, q.y + q.vy * dt)
        q.z += q.vz * dt
      }
    if (A && holder && state === 'play') {
      const fr = clamp((A.explodeAt - Math.max(now, A.passAt)) / Math.max(1, A.explodeAt - A.passAt), 0, 1)
      const fq = 2 + (1 - fr) * (1 - fr) * 16
      bp += fq * dt
      const on = Math.sin(bp * 6.283) > 0 ? 1 : 0
      if (on && !onP) snd(900 + (1 - fr) * 600, 0.05, 'square', 0.04)
      onP = on
    } else if (state === 'cd') {
      bp += 2 * dt
      onP = Math.sin(bp * 6.283) > 0 ? 1 : 0
    }
    const pg = !!(A && state === 'play' && A.holder === mySide && A.explodeAt - now < 2500)
    if (pg !== perigo) {
      perigo = pg
      dom.root.classList.toggle('perigo', pg)
    }
  }

  /* ---- desenho: uma passada por quadro, só cópia de imagens e retângulos ---- */
  const scr = (wx: number, wy: number, wz: number): [number, number] => {
    const h = -(wx * tl[0] + wz * tl[1])
    return [CX + wx * U, CY + wz * U * K - (wy + h) * U * ALTO]
  }
  const lista: Item[] = []
  /** preenche um polígono sem suavizar, linha a linha */
  const poli = (pts: [number, number][], cor: string) => {
    let y0 = 1e9
    let y1 = -1e9
    for (const p of pts) {
      y0 = Math.min(y0, p[1])
      y1 = Math.max(y1, p[1])
    }
    x.fillStyle = cor
    for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) {
      let a = 1e9
      let b = -1e9
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        const q = pts[(i + 1) % pts.length]
        if ((p[1] <= y && q[1] >= y) || (q[1] <= y && p[1] >= y)) {
          const t = q[1] === p[1] ? 0 : (y - p[1]) / (q[1] - p[1])
          const xx = p[0] + (q[0] - p[0]) * t
          a = Math.min(a, xx)
          b = Math.max(b, xx)
        }
      }
      if (b >= a) x.fillRect(Math.round(a), y, Math.max(1, Math.round(b) - Math.round(a)), 1)
    }
  }
  const sombra = (wx: number, wz: number, r: number) => {
    const [sx, sy] = scr(wx, 0, wz)
    const w = Math.round(r * U * 2)
    const h = Math.max(2, Math.round(w * K * 0.6))
    x.fillStyle = 'rgba(0,0,0,.42)'
    for (let i = 0; i < h; i++) {
      const t = ((i + 0.5) / h) * 2 - 1
      const l = Math.round(w * Math.sqrt(1 - t * t))
      x.fillRect(Math.round(sx - l / 2), Math.round(sy - h / 2 + i), l, 1)
    }
  }
  const desenhaBomba = (sx: number, topo: number) => {
    const A = ctx.auth.current
    const b = onP ? img!.bomba2 : img!.bomba
    if (!b) return
    const fr = A ? clamp((A.explodeAt - Math.max(Date.now(), A.passAt)) / Math.max(1, A.explodeAt - A.passAt), 0, 1) : 1
    const pul = onP ? 1 : 0
    const w = b.width + pul * 2
    const h = b.height + pul * 2
    const bx = Math.round(sx - w / 2)
    const by = Math.round(topo - h + 1 + Math.sin(T * 6))
    x.drawImage(b, bx, by, w, h)
    // a faísca desce pelo pavio conforme o tempo acaba
    const f = Math.round(fr * 4)
    const fa = [1, 3][Math.floor(T * 20) % 2]
    x.fillStyle = '#fff4e0'
    x.fillRect(bx + w - 5 + f - 2, by - 1 - f + 1, fa, fa)
    x.fillStyle = '#ff6670'
    x.fillRect(bx + w - 6 + f - 2, by + 1 - f + 1, 1, 1)
  }
  const desenhaPersonagem = (p: Pl) => {
    const s = img![p.sheet]
    if (!s) return
    const A = ctx.auth.current
    const sp = Math.hypot(p.vx, p.vz)
    const k = Math.min(sp / 5, 1)
    const hold = !!A && A.holder === p.side && state !== 'boom' && state !== 'menu'
    const tleft = A ? (A.explodeAt - Date.now()) / 1000 : 99
    // colunas da folha: 0 parado, 1 e 2 passos (1 também no ar), 3 com a bomba no alto
    let col = hold ? 3 : 0
    if (!hold && sp > 0.6) {
      const c = Math.floor(T * 9 + p.i) % 4
      col = c === 0 ? 1 : c === 2 ? 2 : 0
    }
    const air = p.y > 0.1 && !p.fly
    if (air && !hold) col = 1
    const hop = Math.abs(Math.sin(T * 11 + p.i)) * 0.2 * k * (p.y < 0.05 ? 1 : 0)
    const jit = hold && tleft < 2.5 ? Math.round(Math.sin(T * 70)) : 0
    const [sx, sy] = scr(p.x, p.y + hop, p.z)
    const st = (air ? clamp(p.jv * 0.015, -0.12, 0.2) : 0) - p.sq * 0.25
    const dw = CW
    const dh = Math.round(CH * (1 + st))
    if (p.fly) {
      const e = Math.max(0, 1 - boomT / 1.4)
      if (e <= 0) return
      x.save()
      x.translate(Math.round(sx), Math.round(sy - 20))
      x.rotate(p.rot)
      x.scale(e, e)
      x.drawImage(s, col * CW, p.dir * CH, CW, CH, -CW / 2, -PE / 2, CW, CH)
      x.restore()
      return
    }
    const px = Math.round(sx - dw / 2) + jit
    const py = Math.round(sy - PE * (dh / CH))
    if (p.dir === 2 && p.flip) {
      x.save()
      x.translate(px + dw, py)
      x.scale(-1, 1)
      x.drawImage(s, col * CW, 2 * CH, CW, CH, 0, 0, dw, dh)
      x.restore()
    } else x.drawImage(s, col * CW, p.dir * CH, CW, CH, px, py, dw, dh)
    const topo = py + 2
    if (hold && (state === 'play' || state === 'cd')) desenhaBomba(sx + jit, topo)
    else if (p === ME && state !== 'boom') {
      // setinha ametista: este é você
      x.fillStyle = '#a795ec'
      const my = topo - 6 + Math.round(Math.sin(T * 5))
      for (let i = 0; i < 3; i++) x.fillRect(Math.round(sx) - 2 + i, my + i, 5 - 2 * i, 1)
    }
    if (hold && tleft < 5 && state === 'play') {
      // gota de suor
      x.fillStyle = '#cbc5e8'
      x.fillRect(Math.round(sx + 7), topo + 8 + Math.round(((T * 1.6) % 1) * 7), 1, 2)
    }
  }
  function desenha() {
    if (!img) return
    const A = ctx.auth.current
    const sk = shake * 3
    const ox = Math.round((Math.random() - 0.5) * sk)
    const oy = Math.round((Math.random() - 0.5) * sk)
    x.setTransform(1, 0, 0, 1, 0, 0)
    x.imageSmoothingEnabled = false
    x.fillStyle = '#07070a'
    x.fillRect(0, 0, W, H)
    if (img.sala) {
      const sx = Math.round(CX - 170) + ox
      const sy = Math.round(CY - 287) + oy
      x.drawImage(img.sala, sx, sy)
      // janela mais larga que a sala: o mesmo cenário espelhado nas laterais
      if (W > 340) {
        x.save()
        x.scale(-1, 1)
        x.drawImage(img.sala, -sx, sy)
        x.drawImage(img.sala, -sx - 680, sy)
        x.restore()
      }
    }
    const ccx = CX
    const ccy = CY
    CX += ox
    CY += oy
    if (img.arena) {
      // o mostrador inclina junto com o chão (cisalhamento simples)
      const aw = img.arena.width
      const b = tl[0] * ALTO
      const d = 1 + (tl[1] * ALTO) / K
      x.setTransform(1, b, 0, d, CX, CY)
      x.drawImage(img.arena, -aw / 2, -Math.round((R + 0.8) * U * K))
      x.setTransform(1, 0, 0, 1, 0, 0)
    }
    for (const p of P)
      if (!p.fly) {
        const e = Math.max(0.3, 1 - p.y * 0.2)
        sombra(p.x, p.z, 0.55 * e)
      }
    if (A && (state === 'play' || state === 'cd')) {
      // anel vermelho sob quem está com a bomba
      const p = P[A.holder === 'a' ? 0 : 1]
      const [sx, sy] = scr(p.x, 0, p.z)
      const r = 13 + onP * 2
      x.fillStyle = onP ? '#ff6a5a' : '#a3121f'
      for (let i = 0; i < 28; i++) {
        const an = (i / 28) * 6.283
        x.fillRect(Math.round(sx + Math.cos(an) * r), Math.round(sy + Math.sin(an) * r * K), 2, 1)
      }
    }
    for (const q of balls) sombra(q.x, q.z, 0.3)
    // objetos em ordem de profundidade, para um passar por trás do outro
    lista.length = 0
    for (const ob of OB) lista.push({ z: ob.z, t: 0, ob })
    for (const po of POSTES) lista.push({ z: po.z, t: 1, po })
    for (const s of SW) {
      const dx = Math.cos(s.a)
      const dz = -Math.sin(s.a)
      const n = 8
      for (let i = 0; i < n; i++) {
        const t0 = -s.len + (i / n) * 2 * s.len
        const t1 = t0 + (2 * s.len) / n
        lista.push({ z: ((t0 + t1) / 2) * dz, t: 2, s, t0, t1, dx, dz, ponta: i === 0 ? -1 : i === n - 1 ? 1 : 0 })
      }
    }
    for (const q of balls) lista.push({ z: q.z, t: 3, q })
    for (const p of P) lista.push({ z: p.z + (p.fly ? 100 : 0), t: 4, p })
    lista.sort((a, b) => a.z - b.z)
    for (const it of lista) {
      if (it.t === 0) {
        const ob = it.ob
        const im = ob.bump && ob.pop > 0.2 ? img.bumper2 : img[ob.art]
        if (!im) continue
        const [sx, sy] = scr(ob.x, 0, ob.z)
        x.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + im.height * 0.32))
      } else if (it.t === 1) {
        // postes da borda pulsam como as colunas do 3D
        const po = it.po
        const im = img[po.art]
        if (!im) continue
        const [sx, sy] = scr(po.x, 0, po.z)
        const h = Math.round(im.height * (1 + 0.35 * Math.abs(Math.sin(T * 4 + po.i * 0.9))))
        x.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - h + 3), im.width, h)
      } else if (it.t === 2) {
        const { s, t0, t1, dx, dz, ponta } = it
        const nx = -dz * 0.36
        const nz = dx * 0.36
        const ALT = 0.9
        // a ponta do ponteiro afina em lança
        const fa = ponta === -1 ? 0 : 1
        const fb = ponta === 1 ? 0 : 1
        const a: [number, number] = [t0 * dx + nx * fa, t0 * dz + nz * fa]
        const b: [number, number] = [t1 * dx + nx * fb, t1 * dz + nz * fb]
        const c: [number, number] = [t1 * dx - nx * fb, t1 * dz - nz * fb]
        const e: [number, number] = [t0 * dx - nx * fa, t0 * dz - nz * fa]
        const front = nz > 0 ? [a, b] : [e, c]
        const back = nz > 0 ? [e, c] : [a, b]
        const topo = [a, b, c, e].map((v) => scr(v[0], ALT, v[1]))
        poli(
          [scr(front[0][0], 0.1, front[0][1]), scr(front[1][0], 0.1, front[1][1]), scr(front[1][0], ALT, front[1][1]), scr(front[0][0], ALT, front[0][1])],
          s.cor[2],
        )
        poli(topo, s.cor[0])
        const fio = (p0: [number, number], p1: [number, number], cor: string) => {
          const q0 = scr(p0[0], ALT, p0[1])
          const q1 = scr(p1[0], ALT, p1[1])
          const n = Math.ceil(Math.max(Math.abs(q1[0] - q0[0]), Math.abs(q1[1] - q0[1])))
          x.fillStyle = cor
          for (let i = 0; i <= n; i++) {
            const k = n ? i / n : 0
            x.fillRect(Math.round(q0[0] + (q1[0] - q0[0]) * k), Math.round(q0[1] + (q1[1] - q0[1]) * k), 1, 1)
          }
        }
        fio(front[0], front[1], s.cor[1])
        fio(back[0], back[1], s.cor[3])
        if (!ponta) {
          const m = scr(((t0 + t1) / 2) * dx, ALT, ((t0 + t1) / 2) * dz)
          x.fillStyle = s.cor[2]
          x.fillRect(Math.round(m[0]) - 1, Math.round(m[1]) - 1, 2, 2)
        }
      } else if (it.t === 3) {
        const q = it.q
        const im = img.bola
        if (!im) continue
        const [sx, sy] = scr(q.x, q.y, q.z)
        const e = q.l < 1 ? Math.max(0.1, q.l) : 1
        x.drawImage(im, Math.round(sx - (im.width * e) / 2), Math.round(sy - im.height * e), im.width * e, im.height * e)
      } else desenhaPersonagem(it.p)
    }
    for (const w of waves) {
      const [sx, sy] = scr(w.x, 0.4, w.z)
      const r = (1 + w.t * 22) * U * 0.7
      x.fillStyle = `rgba(236,229,216,${Math.max(0, 1 - w.t * 1.6).toFixed(2)})`
      for (let i = 0; i < 56; i++) {
        const an = (i / 56) * 6.283
        x.fillRect(Math.round(sx + Math.cos(an) * r), Math.round(sy + Math.sin(an) * r * K), 2, 2)
      }
    }
    if (A && state === 'boom' && boomT < 0.55 && img.explosao) {
      const p = P[A.holder === 'a' ? 0 : 1]
      const [sx, sy] = scr(p.x, 0, p.z)
      const e = 0.5 + boomT * 2.2
      const w = img.explosao.width * e
      const h = img.explosao.height * e
      x.globalAlpha = Math.min(1, (0.55 - boomT) * 4)
      x.drawImage(img.explosao, Math.round(sx - w / 2), Math.round(sy - h * 0.7), w, h)
      x.globalAlpha = 1
    }
    for (const q of pd)
      if (q.l > 0) {
        const [sx, sy] = scr(q.x, q.y, q.z)
        const e = q.l / q.m
        x.fillStyle = q.c
        const z = e > 0.5 ? q.s : 1
        x.fillRect(Math.round(sx), Math.round(sy), z, z)
      }
    CX = ccx
    CY = ccy
    if (flashA > 0.01) {
      x.fillStyle = `rgba(255,255,255,${flashA.toFixed(2)})`
      x.fillRect(0, 0, W, H)
    }
  }

  /* ---- medidas: o canvas tem poucos pixels e a tela amplia em blocos inteiros (ou quartos) ---- */
  function medida() {
    const r = dom.area.getBoundingClientRect()
    if (!r.width || !r.height) return
    const arenaW = (R + 0.8) * U * 2 + 16
    const alto = (R + 0.8) * U * K * 2 + 78
    const px = Math.max(1, Math.round(Math.min(r.width / arenaW, r.height / alto) * 4) / 4)
    W = Math.ceil(r.width / px)
    H = Math.ceil(r.height / px)
    dom.cv.width = W
    dom.cv.height = H
    const retrato = r.height / r.width > 1.1
    const meia = (R + 0.8) * U * K
    CX = Math.round(W / 2)
    CY = Math.round(retrato ? Math.min(meia + 100, H / 2) : Math.max(meia + 58, H / 2 + 18))
    x.imageSmoothingEnabled = false
    // mudar o tamanho apaga o canvas: parado (fim de partida), redesenha uma vez
    if (!rodando) desenha()
  }
  const ro = new ResizeObserver(medida)
  ro.observe(dom.area)

  /* ---- laço: só roda com a partida em andamento ---- */
  let raf = 0
  let rodando = false
  let querRodar = false
  let prev = 0
  let vivo = true
  const laco = (t: number) => {
    const dt = Math.min((t - prev) / 1000, 0.05)
    prev = t
    passo(dt)
    desenha()
    if (ctx.ended.current) {
      rodando = false
      raf = 0
      return
    }
    raf = requestAnimationFrame(laco)
  }
  const tenta = () => {
    if (!vivo || !img || !querRodar || rodando || ctx.ended.current) return
    rodando = true
    prev = performance.now()
    raf = requestAnimationFrame(laco)
  }
  pips(dom.s1, 0)
  pips(dom.s2, 0)
  carrega().then((l) => {
    if (!vivo) return
    img = l
    medida()
    tenta()
  })

  return {
    /** treino: o jogador tocou em Jogar */
    comecaTreino() {
      comecaTreino()
      querRodar = true
      tenta()
    },
    /** online: a contagem da sala começou */
    liga() {
      querRodar = true
      tenta()
    },
    destroi() {
      vivo = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.clearTimeout(msgT)
      removeEventListener('keydown', kd)
      removeEventListener('keyup', ku)
      dom.pad.removeEventListener('pointerdown', pdown)
      dom.pad.removeEventListener('pointermove', pmove)
      dom.pad.removeEventListener('pointerup', pend)
      dom.pad.removeEventListener('pointercancel', pend)
      dom.pula.removeEventListener('pointerdown', jdown)
      AC?.close().catch(() => {})
    },
  }
}
