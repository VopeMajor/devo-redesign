'use client'

import { X } from 'lucide-react'
import { Fredoka } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { BombState, GameOutcome, GameProps } from '@/lib/devo/arcade/client'
import { GAMES, botSkill, rng } from '@/lib/devo/arcade/games'
import { roomOutcome, useRoom } from '../use-room'

const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '700'] })
const meta = GAMES['hot-bomb']

type Side = 'a' | 'b'
type Pair = { a: number; b: number }
type Auth = {
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
type Menu = { title: string; sub: string; button?: boolean; note?: string }

const R = 9.5
const POINTS = 3
const COUNTDOWN_MS = 3200
const BOOM_MS = 2600
const other = (s: Side): Side => (s === 'a' ? 'b' : 'a')
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const norm = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y)
  return l > 1 ? [x / l, y / l] : [x, y]
}

/** Mesma sequência de eventos nos dois aparelhos: derivada da seed da sala e da rodada. */
function eventSchedule(seed: number, round: number) {
  const r = rng(seed + round * 977)
  const out: { t: number; e: number; r: () => number }[] = []
  let t = 4 + r() * 2
  while (t < 40) {
    out.push({ t, e: Math.floor(r() * 5), r: rng(seed + round * 977 + Math.floor(t * 100)) })
    t += 5 + r() * 3
  }
  return out
}

const CSS = `
.bq{--ink:#2a1650;--pink:#ff4d8d;--yel:#ffd23d;--cy:#3dd6ff;position:relative;width:100%;height:100%;overflow:hidden;background:#3b2a6b;color:#fff;touch-action:none;-webkit-user-select:none;user-select:none}
.bq *{box-sizing:border-box}
.bq.rot{position:fixed;top:0;left:0;width:100vh;width:100dvh;height:100vw;transform-origin:top left;transform:rotate(90deg) translateY(-100%);z-index:60}
.bq.rot .bq-jb{position:absolute}
.bq-cv,.bq-pad{position:absolute;inset:0}.bq canvas{display:block;width:100%;height:100%}
.bq-hud{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:0;right:0;display:flex;justify-content:center;gap:14px;pointer-events:none}
.bq-hud>div{display:flex;flex-direction:column;align-items:center;gap:4px}
.bq-hud span{background:rgba(42,22,80,.7);border:3px solid #fff;border-radius:18px;padding:4px 18px;font-size:28px;font-weight:700}
.bq-hud small{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85;max-width:9em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-hud small.me{color:var(--yel)}
.bq-hud>.bq-lvl{display:block;width:50px;height:50px;border-radius:50%;border:3px solid #fff;background:rgba(42,22,80,.7);position:relative;align-self:flex-start;flex:none}
.bq-lvl i{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px;border-radius:50%;background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.35);transition:background .2s}
.bq-msg{position:absolute;left:0;right:0;top:22%;text-align:center;font-weight:700;font-size:clamp(34px,9vw,84px);color:var(--yel);-webkit-text-stroke:3px var(--ink);paint-order:stroke fill;text-shadow:0 6px 0 var(--ink);pointer-events:none;opacity:0}
.bq-msg.pop{animation:bqpop .5s ease-out forwards}
@keyframes bqpop{0%{transform:scale(.3) rotate(-8deg);opacity:0}50%{transform:scale(1.2) rotate(3deg);opacity:1}100%{transform:scale(1);opacity:1}}
.bq-fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.bq-jb{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.6);display:none;pointer-events:none;z-index:4}
.bq-jb i{position:absolute;left:36px;top:36px;width:48px;height:48px;border-radius:50%;background:#fff;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.bq-jump{position:absolute;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:76px;height:76px;border-radius:50%;border:4px solid var(--ink);background:var(--yel);font:inherit;font-weight:700;font-size:15px;line-height:1.05;color:var(--ink);box-shadow:0 5px 0 var(--ink);display:none;align-items:center;justify-content:center;text-align:center;z-index:5;touch-action:none}
.bq-jump.j0{left:calc(50% - 96px)}.bq-jump.j1{left:calc(50% + 20px);background:var(--cy)}
@media (pointer:coarse){.bq-jump{display:flex}}
.bq-quit{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:10px;z-index:12;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:rgba(42,22,80,.7);border:3px solid #fff;color:#fff;cursor:pointer}
.bq-quit:focus-visible{outline:4px solid var(--yel)}
.bq-menu{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px;background:rgba(30,14,70,.62);backdrop-filter:blur(6px)}
.bq-menu h1{margin:0;font-size:clamp(44px,12vw,92px);color:var(--yel);-webkit-text-stroke:4px var(--ink);paint-order:stroke fill;text-shadow:0 7px 0 var(--ink);line-height:1.05}
.bq-menu p{margin:0;max-width:30em;font-size:19px;line-height:1.35}
.bq-menu button{font:inherit;font-weight:700;font-size:24px;color:var(--ink);background:var(--yel);border:4px solid var(--ink);border-radius:20px;padding:12px 30px;min-width:240px;box-shadow:0 6px 0 var(--ink);cursor:pointer}
.bq-menu button:active{transform:translateY(4px);box-shadow:0 2px 0 var(--ink)}
.bq-menu button:focus-visible{outline:4px solid #fff}
.bq-menu small{opacity:.8;font-size:15px}
.bq-wait{display:inline-block;animation:bqblink 1.2s ease-in-out infinite}
@keyframes bqblink{50%{opacity:.35}}
`

export default function HotBomb({ start, settings, onFinish, onQuit }: GameProps) {
  const root = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLDivElement>(null)
  const pad = useRef<HTMLDivElement>(null)
  const s1 = useRef<HTMLSpanElement>(null)
  const s2 = useRef<HTMLSpanElement>(null)
  const lvlEl = useRef<HTMLDivElement>(null)
  const msgEl = useRef<HTMLDivElement>(null)
  const flEl = useRef<HTMLDivElement>(null)
  const jbEl = useRef<HTMLDivElement>(null)
  const jumpBtn = useRef<HTMLButtonElement>(null)

  const mySide: Side = start.side ?? 'a'
  const myIdx = mySide === 'a' ? 0 : 1
  const online = !!start.roomId
  const skill = botSkill(start.opponent.rating)
  const quality = settings.quality ?? 'auto'
  const muted = settings.sound === 'off'

  const [menu, setMenu] = useState<Menu | null>(() =>
    online
      ? { title: 'Bomba Quente', sub: meta.description, note: `Aguardando ${start.opponent.name}…` }
      : { title: 'Bomba Quente', sub: `${meta.description} Vence quem fizer ${POINTS} pontos.`, button: true },
  )

  const auth = useRef<Auth | null>(null)
  const started = useRef(false)
  const ended = useRef(false)
  const me = useRef({ x: 0, y: 0, z: 0 })
  const oppNet = useRef<{ x: number; z: number; h: number } | null>(null)
  const startLocal = useRef(start.startedAt - (start.serverNow - Date.now()))
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const startOffline = useRef<() => void>(() => {})

  const { room, act, toLocal } = useRoom(start, 110, () =>
    started.current && !ended.current ? { type: 'pos', x: me.current.x, y: me.current.z, h: me.current.y } : undefined,
  )
  const actRef = useRef(act)
  actRef.current = act

  // Online: rodada, dono da bomba, explosão e placar vêm do servidor.
  useEffect(() => {
    if (!online || !room || room.status === 'waiting') return
    if (room.status === 'finished' || room.status === 'cancelled') {
      if (ended.current) return
      ended.current = true
      const st = room.state as BombState | undefined
      const winner = room.result?.winner as Side | null | undefined
      const mine = room.result?.mine?.stats ?? {}
      setMenu({
        title: winner === 'a' ? 'Coelhinho venceu! 🐰' : winner === 'b' ? 'Ursinho venceu! 🐻' : 'Empate!',
        sub: room.result?.reason === 'abandono' ? 'O oponente abandonou a partida.' : `Placar: ${st?.wins.a ?? 0} x ${st?.wins.b ?? 0}`,
      })
      window.setTimeout(() => finishRef.current(roomOutcome(room, { bonus: (mine.clutch ?? 0) * 100, bonusLabel: `${mine.clutch ?? 0} CLUTCH` })), 2600)
      return
    }
    const st = room.state as BombState
    auth.current = {
      round: st.round,
      holder: st.holder,
      passAt: toLocal(st.passAt),
      explodeAt: toLocal(st.explodeAt),
      phase: st.phase,
      boomAt: toLocal(st.boomAt),
      wins: { ...st.wins },
      score: { ...st.score },
      passes: { ...st.passes },
      clutch: { ...st.clutch },
    }
    const live = room.oppLive as { x?: number; y?: number; h?: number } | null
    oppNet.current = live && typeof live.x === 'number' && typeof live.y === 'number' ? { x: live.x, z: live.y, h: live.h ?? 0 } : null
  }, [online, room, toLocal])

  useEffect(() => {
    const host = cv.current!
    const shadows = quality !== 'low'
    let AC: AudioContext | null = null
    const snd = (f: number, d = 0.08, ty: OscillatorType = 'square', v = 0.05, sl = 0) => {
      if (muted) return
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

    /* ===== Cena ===== */
    const rd = new THREE.WebGLRenderer({ antialias: quality !== 'low' })
    rd.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? 1 : 2))
    rd.shadowMap.enabled = shadows
    rd.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(rd.domElement)
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    const bgc = new THREE.Color(0x3b2a6b)
    scene.background = bgc
    scene.fog = new THREE.Fog(0x3b2a6b, 40, 90)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8866cc, 0.95 * Math.PI))
    const sun = new THREE.DirectionalLight(0xffffff, 0.9 * Math.PI)
    sun.position.set(6, 16, 8)
    sun.castShadow = shadows
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 40 })
    scene.add(sun)
    // decay 1 reproduz a queda de luz do three r128 usado no original.
    const L1 = new THREE.PointLight(0xff3d8b, 1.3 * Math.PI, 32, 1)
    const L2 = new THREE.PointLight(0x3dd6ff, 1.3 * Math.PI, 32, 1)
    scene.add(L1, L2)
    const M = (c: THREE.ColorRepresentation, e: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0, ...e })
    const sph = (r: number) => new THREE.SphereGeometry(r, 24, 16)
    const arena = new THREE.Group()
    scene.add(arena)

    const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.8, R + 1.4, 1, 64), M(0x241a45))
    base.position.y = -0.5
    base.receiveShadow = true
    arena.add(base)
    const rings: THREE.MeshStandardMaterial[] = []
    for (let i = 0; i < 6; i++) {
      const m = M(0xffffff)
      const g = new THREE.Mesh(new THREE.RingGeometry((i * R) / 6 + 0.02, ((i + 1) * R) / 6 - 0.02, 64), m)
      g.rotation.x = -Math.PI / 2
      g.position.y = 0.01
      g.receiveShadow = true
      arena.add(g)
      rings.push(m)
    }
    const pil: THREE.Mesh[] = []
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * 6.283
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 16), M(i % 2 ? 0xffd23d : 0xff4d8d))
      p.position.set(Math.cos(a) * (R + 0.4), 0.5, Math.sin(a) * (R + 0.4))
      p.castShadow = true
      arena.add(p)
      pil.push(p)
    }
    const gs = [new THREE.OctahedronGeometry(1), new THREE.TorusGeometry(0.8, 0.3, 12, 24), new THREE.IcosahedronGeometry(1), new THREE.ConeGeometry(0.8, 1.6, 5)]
    const dec: THREE.Mesh[] = []
    const dr = rng(start.seed + 5)
    const drnd = (a: number, b: number) => a + dr() * (b - a)
    for (let i = 0; i < 34; i++) {
      const a = drnd(0, 6.28)
      const d = drnd(15, 34)
      const m = new THREE.Mesh(gs[i % 4], M(new THREE.Color().setHSL(dr(), 0.8, 0.62)))
      m.position.set(Math.cos(a) * d, drnd(1, 14), Math.sin(a) * d)
      m.scale.setScalar(drnd(0.7, 2))
      m.userData = { s: drnd(0.3, 1.2), y: m.position.y }
      scene.add(m)
      dec.push(m)
    }
    /* obstáculos: barras giratórias, hub central e bumpers */
    const sw = [0, 1].map((i) => {
      const g = new THREE.Group()
      const b = new THREE.Mesh(new THREE.BoxGeometry(R * 1.5, 0.5, 0.5), M(i ? 0x3dd6ff : 0xff7a3d))
      b.castShadow = true
      b.position.y = 0.4
      g.add(b)
      arena.add(g)
      return { g, a: i * 1.5, w: i ? -1.2 : 1.5, len: R * 0.75 }
    })
    const OB: { x: number; z: number; r: number; m: THREE.Mesh; bump: boolean; pop: number }[] = []
    const addOB = (x: number, z: number, r: number, h: number, c: number, bump: boolean) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 28), M(c))
      m.position.set(x, h / 2, z)
      m.castShadow = m.receiveShadow = true
      arena.add(m)
      OB.push({ x, z, r, m, bump, pop: 0 })
    }
    addOB(0, 0, 0.8, 1, 0xffffff, false)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.283 + 0.3
      addOB(Math.cos(a) * 5.6, Math.sin(a) * 5.6, 0.7, 0.9, i % 2 ? 0xff4d8d : 0xffd23d, true)
    }
    /* avatares: rig com cabeça, braços, pernas, orelhas e contorno */
    const OLM = new THREE.MeshBasicMaterial({ color: 0x1a0f2e, side: THREE.BackSide })
    const WH = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const mkAv = (col: number, bunny: boolean) => {
      const g = new THREE.Group()
      g.rotation.order = 'YXZ'
      const fit = new THREE.Group()
      fit.scale.setScalar(0.9)
      g.add(fit)
      const sqG = new THREE.Group()
      fit.add(sqG)
      const m = M(col, { roughness: 0.62 })
      const lt = M(bunny ? 0xfff1f7 : 0xdff3ff, { roughness: 0.85 })
      const dk = M(0x1b1b2b, { roughness: 0.2, metalness: 0.1 })
      const pk = M(0xff8fb3, { roughness: 0.8 })
      const rdm = M(0xff3d5a, { roughness: 0.6 })
      const mk = (par: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ol = 0) => {
        const o = new THREE.Mesh(geo, mat)
        o.position.set(x, y, z)
        o.scale.set(sx, sy, sz)
        o.castShadow = true
        par.add(o)
        if (ol) {
          const q = new THREE.Mesh(geo, OLM)
          q.position.set(x, y, z)
          q.scale.set(sx * (1 + ol), sy * (1 + ol), sz * (1 + ol))
          par.add(q)
        }
        return o
      }
      const grp = (par: THREE.Object3D, x: number, y: number, z: number) => {
        const o = new THREE.Group()
        o.position.set(x, y, z)
        par.add(o)
        return o
      }
      const bodyG = grp(sqG, 0, 0.62, 0)
      mk(bodyG, sph(0.5), m, 0, 0, 0, 1, 1.02, 0.92, 0.07)
      mk(bodyG, sph(0.36), lt, 0, -0.04, 0.22, 1, 1.1, 0.5)
      if (bunny) mk(bodyG, sph(0.19), lt, 0, -0.12, -0.46, 1, 1, 1, 0.08)
      else mk(bodyG, sph(0.14), m, 0, -0.1, -0.46, 1, 1, 1, 0.08)
      const legs = [-1, 1].map((s) => {
        const l = grp(sqG, s * 0.22, 0.3, 0.02)
        mk(l, sph(0.2), m, 0, -0.1, 0.1, 1, 0.62, bunny ? 1.6 : 1.3, 0.07)
        return l
      })
      const arms = [-1, 1].map((s) => {
        const a = grp(sqG, s * 0.47, 0.9, 0.02)
        mk(a, sph(0.15), m, 0, -0.17, 0, 1, 1.5, 1, 0.08)
        mk(a, sph(0.11), lt, 0, -0.4, 0.02)
        a.rotation.z = s * 0.12
        return a
      })
      const head = grp(sqG, 0, 1.38, 0)
      mk(head, sph(0.62), m, 0, 0, 0, 1.06, 0.94, 1, 0.055)
      const eyes = [-1, 1].map((s) => {
        const e = grp(head, s * 0.25, 0.06, 0.54)
        mk(e, sph(0.14), dk, 0, 0, 0, 0.9, 1.2, 0.6)
        mk(e, sph(0.05), WH, 0.035, 0.06, 0.075)
        mk(e, sph(0.026), WH, -0.035, -0.045, 0.075)
        return e
      })
      for (const s of [-1, 1]) mk(head, sph(0.11), pk, s * 0.4, -0.14, 0.46, 1, 0.65, 0.35)
      const brows = [-1, 1].map((s) => {
        const b = mk(head, new THREE.BoxGeometry(0.17, 0.035, 0.03), dk, s * 0.25, 0.3, 0.5)
        b.userData.s = s
        b.castShadow = false
        return b
      })
      let mouth: THREE.Mesh
      const ears: THREE.Group[] = []
      if (bunny) {
        mk(head, sph(0.05), M(0xff6f9f), 0, -0.04, 0.6, 1.3, 0.9, 0.8)
        mouth = mk(head, sph(0.065), dk, 0, -0.2, 0.57, 1, 0.6, 0.5)
        for (const s of [-1, 1]) mk(head, new THREE.BoxGeometry(0.05, 0.075, 0.03), WH, s * 0.028, -0.27, 0.6)
        const wm = new THREE.MeshBasicMaterial({ color: 0xffe9f2 })
        for (const s of [-1, 1])
          for (let i = 0; i < 3; i++) {
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4), wm)
            w.position.set(s * 0.58, -0.12 + i * 0.06, 0.42)
            w.rotation.z = Math.PI / 2 + s * (i - 1) * 0.18
            head.add(w)
          }
        for (const s of [-1, 1]) {
          const e = grp(head, s * 0.28, 0.42, -0.02)
          e.rotation.z = -s * 0.2
          mk(e, sph(0.17), m, 0, 0.3, 0, 1, 2, 0.5, 0.07)
          mk(e, sph(0.09), pk, 0, 0.3, 0.06, 1, 1.8, 0.3)
          ears.push(e)
        }
        const bow = grp(head, -0.36, 0.5, 0.28)
        bow.rotation.z = 0.4
        mk(bow, sph(0.1), rdm, -0.09, 0, 0, 1.4, 0.9, 0.6)
        mk(bow, sph(0.1), rdm, 0.09, 0, 0, 1.4, 0.9, 0.6)
        mk(bow, sph(0.055), rdm, 0, 0, 0.02)
      } else {
        mk(head, sph(0.2), lt, 0, -0.16, 0.5, 1.2, 0.85, 0.7)
        mk(head, sph(0.07), dk, 0, -0.08, 0.66, 1.3, 0.9, 0.8)
        mouth = mk(head, sph(0.06), dk, 0, -0.25, 0.62, 1, 0.6, 0.5)
        for (const s of [-1, 1]) {
          mk(head, sph(0.22), m, s * 0.42, 0.46, -0.05, 1, 1, 0.6, 0.07)
          mk(head, sph(0.12), lt, s * 0.42, 0.46, 0.04, 1, 1, 0.4)
        }
        const sc = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.1, 10, 24), rdm)
        sc.rotation.x = Math.PI / 2
        sc.position.set(0, 1.0, 0)
        sc.castShadow = true
        sqG.add(sc)
        mk(sqG, new THREE.BoxGeometry(0.16, 0.38, 0.06), rdm, 0.24, 0.8, 0.4)
      }
      const sweat = mk(head, sph(0.07), new THREE.MeshBasicMaterial({ color: 0x6fd3ff }), 0.5, 0.2, 0.38, 0.8, 1.25, 0.7)
      sweat.visible = false
      sweat.castShadow = false
      arena.add(g)
      const blob = new THREE.Mesh(
        new THREE.CircleGeometry(0.62, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }),
      )
      blob.rotation.x = -Math.PI / 2
      blob.position.y = 0.03
      arena.add(blob)
      return { g, body: sqG, head, eyes, brows, mouth, arms, legs, ears, sweat, blob }
    }
    const P = ([0, 1] as const).map((i) => ({
      i,
      side: (i ? 'b' : 'a') as Side,
      ...mkAv(i ? 0x5ec8ff : 0xff8fc4, !i),
      x: 0, z: 0, y: 0, vx: 0, vz: 0, kx: 0, kz: 0, face: 0, jv: 0, sq: 0, fly: 0, jr: 0,
    }))
    type Av = (typeof P)[number]
    const ME = P[myIdx]
    const OPP = P[1 - myIdx]
    /* bomba */
    const bomb = new THREE.Group()
    const bm = M(0x15151f, { roughness: 0.28, metalness: 0.45 })
    const bo = new THREE.Mesh(sph(0.38), bm)
    bo.castShadow = true
    bomb.add(bo)
    const bol = new THREE.Mesh(sph(0.38), OLM)
    bol.scale.setScalar(1.07)
    bomb.add(bol)
    const hl = new THREE.Mesh(sph(0.09), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }))
    hl.scale.set(1.6, 0.9, 0.6)
    hl.position.set(-0.17, 0.2, 0.27)
    hl.rotation.z = 0.6
    bomb.add(hl)
    const metal = M(0x9a9ab0, { metalness: 0.7, roughness: 0.3 })
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 14), metal)
    cap.position.y = 0.39
    bomb.add(cap)
    const capr = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), metal)
    capr.rotation.x = Math.PI / 2
    capr.position.y = 0.46
    bomb.add(capr)
    const fcurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.46, 0),
      new THREE.Vector3(0.1, 0.6, 0),
      new THREE.Vector3(-0.05, 0.74, 0),
      new THREE.Vector3(0.1, 0.88, 0),
    ])
    bomb.add(new THREE.Mesh(new THREE.TubeGeometry(fcurve, 16, 0.026, 6), M(0xd8b878)))
    const spark = new THREE.Mesh(sph(0.075), new THREE.MeshBasicMaterial({ color: 0xffe27a }))
    spark.add(new THREE.Mesh(sph(0.14), new THREE.MeshBasicMaterial({ color: 0xff9a2f, transparent: true, opacity: 0.5 })))
    bomb.add(spark)
    const bpup: THREE.Mesh[] = []
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(sph(0.075), WH)
      w.scale.set(1, 1.2, 0.5)
      w.position.set(s * 0.14, 0.06, 0.33)
      bomb.add(w)
      const pu = new THREE.Mesh(sph(0.045), new THREE.MeshBasicMaterial({ color: 0xff2a2a }))
      pu.position.set(s * 0.14, 0.055, 0.365)
      pu.scale.set(1, 1.2, 0.5)
      bomb.add(pu)
      bpup.push(pu)
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.03), new THREE.MeshBasicMaterial({ color: 0x07070d }))
      br.position.set(s * 0.14, 0.17, 0.34)
      br.rotation.z = s * 0.45
      bomb.add(br)
    }
    const bl = new THREE.PointLight(0xff3030, 0, 7, 1)
    bomb.add(bl)
    arena.add(bomb)
    /* partículas */
    const NP = 360
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial(), NP)
    const pd: { l: number; m: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; s: number }[] = []
    const dm = new THREE.Object3D()
    const cc = new THREE.Color()
    let pi = 0
    for (let i = 0; i < NP; i++) {
      pd.push({ l: 0, m: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 1 })
      pm.setColorAt(i, cc.set(0xffffff))
      dm.scale.setScalar(0)
      dm.updateMatrix()
      pm.setMatrixAt(i, dm.matrix)
    }
    pm.frustumCulled = false
    arena.add(pm)
    const burst = (x: number, y: number, z: number, n: number, sp: number, h: number, rg = 0.12) => {
      for (let k = 0; k < n; k++) {
        pi = (pi + 1) % NP
        const p = pd[pi]
        const a = rnd(0, 6.28)
        const e = rnd(-0.2, 1)
        const s = rnd(0.3, 1) * sp
        p.x = x
        p.y = y
        p.z = z
        p.vx = Math.cos(a) * s * (1 - e * 0.4)
        p.vz = Math.sin(a) * s * (1 - e * 0.4)
        p.vy = Math.abs(e) * s + 2
        p.l = p.m = rnd(0.5, 1.2)
        p.s = rnd(0.5, 1.5)
        pm.setColorAt(pi, cc.setHSL(h + rnd(0, rg), 1, 0.6))
      }
      if (pm.instanceColor) pm.instanceColor.needsUpdate = true
    }
    /* bolas da "chuva" */
    const balls: { m: THREE.Mesh; x: number; y: number; z: number; vx: number; vy: number; vz: number; l: number }[] = []
    const ball = (r: () => number) => {
      const m = new THREE.Mesh(sph(0.35), M(new THREE.Color().setHSL(r(), 0.9, 0.6)))
      m.castShadow = true
      arena.add(m)
      const a = r() * 6.28
      const d = r() * R * 0.8
      balls.push({ m, x: Math.cos(a) * d, y: 14, z: Math.sin(a) * d, vx: -3 + r() * 6, vy: 0, vz: -3 + r() * 6, l: 11 })
    }
    const waves: THREE.Mesh[] = []

    /* ===== Entrada ===== */
    const keys: Record<string, number> = {}
    const joy = { x: 0, y: 0 }
    const JK = new Set(['Space', 'Enter', 'ShiftRight'])
    const kd = (e: KeyboardEvent) => {
      keys[e.code] = 1
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
      if (!e.repeat && JK.has(e.code)) ME.jr = 0.15
    }
    const ku = (e: KeyboardEvent) => {
      keys[e.code] = 0
    }
    addEventListener('keydown', kd)
    addEventListener('keyup', ku)
    const padEl = pad.current!
    const jb = jbEl.current!
    let touchId: number | null = null
    let tx = 0
    let ty = 0
    // Em retrato no celular a arena é girada 90° via CSS; converte o toque para o espaço da arena.
    const local = (e: PointerEvent): [number, number] =>
      root.current?.classList.contains('rot') ? [e.clientY, window.innerWidth - e.clientX] : [e.clientX, e.clientY]
    const pdown = (e: PointerEvent) => {
      if (touchId !== null) return
      padEl.setPointerCapture(e.pointerId)
      touchId = e.pointerId
      ;[tx, ty] = local(e)
      jb.style.left = tx + 'px'
      jb.style.top = ty + 'px'
      jb.style.display = 'block'
    }
    const pmove = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return
      const [lx, ly] = local(e)
      const v = norm((lx - tx) / 55, (ly - ty) / 55)
      joy.x = v[0]
      joy.y = v[1]
      ;(jb.firstChild as HTMLElement).style.transform = `translate(${v[0] * 50}px,${v[1] * 50}px)`
    }
    const pend = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return
      touchId = null
      joy.x = joy.y = 0
      jb.style.display = 'none'
      ;(jb.firstChild as HTMLElement).style.transform = ''
    }
    padEl.addEventListener('pointerdown', pdown)
    padEl.addEventListener('pointermove', pmove)
    padEl.addEventListener('pointerup', pend)
    padEl.addEventListener('pointercancel', pend)
    const jbtn = jumpBtn.current!
    const jdown = (e: PointerEvent) => {
      e.preventDefault()
      ME.jr = 0.15
    }
    jbtn.addEventListener('pointerdown', jdown)

    /* ===== Jogo ===== */
    let state: 'menu' | 'cd' | 'play' | 'boom' = 'menu'
    let cd = 0
    let lastN = 0
    let shake = 0
    let inv = 0
    let swT = 0
    let bp = 0
    let onP = 0
    let T = 0
    let msgT = 0
    let seenRound = 0
    let boomRound = 0
    let boomLocal = 0
    let lastHolder: Side | null = null
    let lastTag = 0
    let lastWins = ''
    let sched: ReturnType<typeof eventSchedule> = []
    let evIdx = 0
    let botWob = 0
    const tl = [0, 0]
    const tilt = { m: 0, dx: 0, dz: 0 }
    let tiltWarn = false
    let tbUntil = 0
    let rseed = 0
    const later: { at: number; fn: () => void }[] = []
    const msgNode = msgEl.current!
    const flNode = flEl.current!

    const hud = (w: Pair) => {
      s1.current!.textContent = '🐰 ' + w.a
      s2.current!.textContent = '🐻 ' + w.b
    }
    const msg = (t: string, ms = 1500) => {
      msgNode.textContent = t
      msgNode.classList.remove('pop')
      void msgNode.offsetWidth
      msgNode.classList.add('pop')
      window.clearTimeout(msgT)
      msgT = window.setTimeout(() => {
        msgNode.style.opacity = '0'
        msgNode.classList.remove('pop')
      }, ms)
      msgNode.style.opacity = ''
    }
    const flash = () => {
      flNode.style.transition = 'none'
      flNode.style.opacity = '.9'
      window.setTimeout(() => {
        flNode.style.transition = 'opacity .6s'
        flNode.style.opacity = '0'
      }, 40)
    }
    const input = (): [number, number] => {
      const v = norm(
        (keys.KeyD || keys.ArrowRight || 0) - (keys.KeyA || keys.ArrowLeft || 0) + joy.x,
        (keys.KeyS || keys.ArrowDown || 0) - (keys.KeyW || keys.ArrowUp || 0) + joy.y,
      )
      return inv > 0 ? [-v[0], -v[1]] : v
    }
    const newRound = (A: Auth) => {
      seenRound = A.round
      lastN = 0
      cd = 0
      inv = swT = 0
      lastHolder = A.holder
      sched = eventSchedule(start.seed, A.round)
      evIdx = 0
      later.length = 0
      for (const p of P) {
        p.x = p.i ? 4 : -4
        p.z = 3
        p.vx = p.vz = p.kx = p.kz = 0
        p.y = 0
        p.jv = 0
        p.fly = 0
        p.g.scale.setScalar(1)
        p.g.rotation.z = 0
        p.face = p.i ? -1.2 : 1.2
      }
      oppNet.current = null
      tiltWarn = false
      tbUntil = 0
      rseed = rng(start.seed + A.round * 131)() * 6.28
      for (const b of balls) arena.remove(b.m)
      balls.length = 0
    }
    const boom = (holder: Side) => {
      boomLocal = 0
      const p = P[holder === 'a' ? 0 : 1]
      p.fly = 1
      burst(p.x, 1, p.z, 150, 12, 0.02, 0.14)
      burst(p.x, 1, p.z, 60, 8, 0.12, 0.1)
      shake = 1.4
      flash()
      snd(150, 0.7, 'sawtooth', 0.25, -110)
      msg('💥 BUUUM!', 2000)
      const wave = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffd23d, transparent: true }))
      wave.rotation.x = Math.PI / 2
      wave.position.set(p.x, 0.4, p.z)
      arena.add(wave)
      wave.userData.t = 0
      waves.push(wave)
    }
    const simulated = (p: Av) => p === ME || !online
    const EV: [string, (r: () => number, now: number) => void][] = [
      ['TERREMOTO!', () => {
        shake = 1
        for (const p of P) if (simulated(p)) {
          p.kx += rnd(-10, 10)
          p.kz += rnd(-10, 10)
        }
      }],
      ['CHUVA DE BOLAS!', (r, now) => {
        for (let i = 0; i < 9; i++) later.push({ at: now + i * 180, fn: () => ball(r) })
      }],
      ['BARRAS TURBO!', () => {
        swT = 5
      }],
      ['CONTROLES INVERTIDOS!', () => {
        inv = 4
      }],
      ['FOGOS DE ARTIFÍCIO!', (r, now) => {
        for (let i = 0; i < 5; i++) {
          const x = -8 + r() * 16
          const y = 5 + r() * 4
          const z = -8 + r() * 12
          const h = r()
          later.push({ at: now + i * 250, fn: () => burst(x, y, z, 50, 6, h) })
        }
      }],
      ['CHÃO INSTÁVEL!', (_r, now) => {
        tbUntil = now + 3000
      }],
    ]

    /* ===== Tutorial contra o bot: o próprio aparelho faz o papel do servidor ===== */
    const fuseMs = (round: number) => Math.round((14 + rng(start.seed + round * 131)() * 10) * 1000)
    const firstHolder = (round: number): Side => (rng(start.seed + round * 71)() < 0.5 ? 'a' : 'b')
    const offlineDone = () => {
      const A = auth.current!
      ended.current = true
      const meWins = A.wins[mySide]
      const oppWins = A.wins[other(mySide)]
      const winner: Side = A.wins.a > A.wins.b ? 'a' : 'b'
      setMenu({ title: winner === 'a' ? 'Coelhinho venceu! 🐰' : 'Ursinho venceu! 🐻', sub: `Placar: ${A.wins.a} x ${A.wins.b}` })
      const out: GameOutcome = {
        result: meWins > oppWins ? 'win' : 'loss',
        score: Math.min(meta.maxScore, A.score[mySide]),
        oppScore: A.score[other(mySide)],
        bonus: A.clutch[mySide] * 100,
        bonusLabel: `${A.clutch[mySide]} CLUTCH`,
        stats: { passes: A.passes[mySide], clutch: A.clutch[mySide], roundsWon: meWins, roundsLost: oppWins },
      }
      window.setTimeout(() => finishRef.current(out), 2600)
    }
    const driveOffline = (now: number) => {
      const A = auth.current
      if (!A || ended.current) return
      if (A.phase === 'play' && now >= A.explodeAt) {
        const w = other(A.holder)
        A.phase = 'boom'
        A.boomAt = now
        A.wins[w] += 1
        A.score[w] += 300
      } else if (A.phase === 'boom' && now >= A.boomAt + BOOM_MS) {
        if (A.wins.a >= POINTS || A.wins.b >= POINTS) return offlineDone()
        A.round += 1
        A.holder = firstHolder(A.round)
        A.phase = 'play'
        A.passAt = now + COUNTDOWN_MS
        A.explodeAt = A.passAt + fuseMs(A.round)
      }
    }
    startOffline.current = () => {
      const now = Date.now()
      const passAt = now + COUNTDOWN_MS
      auth.current = {
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
      started.current = true
      snd(600, 0.1, 'triangle', 0.1, 300)
      setMenu(null)
    }
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

    const physics = (p: Av, ix: number, iz: number, canAct: boolean, holder: Side | null, dt: number) => {
      let fl = 0
      for (const ob of OB) if (Math.hypot(p.x - ob.x, p.z - ob.z) < ob.r + 0.15 && p.y >= ob.m.position.y * 2 - 0.3) fl = Math.max(fl, ob.m.position.y * 2)
      if (p.jr > 0) p.jr -= dt
      if (canAct && !p.fly && p.y <= fl + 0.02 && p.jr > 0) {
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
            burst(p.x, fl + 0.1, p.z, 10, 3.5, 0.1, 0.05)
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
        if (d < mr && d > 0 && p.y < ob.m.position.y * 2 - 0.3) {
          const nx = dx / d
          const nz = dz / d
          p.x = ob.x + nx * mr
          p.z = ob.z + nz * mr
          if (ob.bump) {
            p.kx = nx * 13
            p.kz = nz * 13
            ob.pop = 1
            burst(p.x, 0.6, p.z, 12, 5, Math.random())
            snd(300, 0.1, 'sine', 0.12, 300)
          }
        }
      }
      for (const s of sw) {
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
          burst(p.x, 0.7, p.z, 8, 4, 0.55)
          snd(220, 0.08, 'square', 0.06, -80)
        }
      }
    }

    const passFx = () => {
      const a = P[0]
      const b = P[1]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const d = Math.hypot(dx, dz) || 0.01
      cd = 0.9
      if (simulated(a)) {
        a.kx = (-dx / d) * 9
        a.kz = (-dz / d) * 9
      }
      if (simulated(b)) {
        b.kx = (dx / d) * 9
        b.kz = (dz / d) * 9
      }
      burst((a.x + b.x) / 2, 1, (a.z + b.z) / 2, 30, 6, Math.random())
      snd(500, 0.12, 'triangle', 0.12, 500)
      shake = Math.max(shake, 0.35)
    }

    const camP = new THREE.Vector3()
    const update = (dt: number) => {
      T += dt
      const now = Date.now()
      if (!online && started.current) driveOffline(now)
      if (online && !started.current && auth.current && now >= startLocal.current - COUNTDOWN_MS) {
        started.current = true
        setMenu(null)
      }
      const A = auth.current
      if (!A || !started.current) state = 'menu'
      else {
        if (A.round !== seenRound) newRound(A)
        if (A.phase === 'boom' || (now >= A.explodeAt && A.phase === 'play')) state = 'boom'
        else if (now < A.passAt) state = 'cd'
        else state = 'play'
        if (state === 'boom' && boomRound !== A.round) {
          boomRound = A.round
          boom(A.holder)
        }
        const w = `${A.wins.a}:${A.wins.b}`
        if (w !== lastWins) {
          lastWins = w
          hud(A.wins)
        }
      }
      const holder = A && state !== 'menu' ? A.holder : null

      shake = Math.max(0, shake - dt * 1.2)
      inv = Math.max(0, inv - dt)
      swT = Math.max(0, swT - dt)
      cd -= dt
      for (let i = later.length - 1; i >= 0; i--)
        if (now >= later[i].at) {
          later[i].fn()
          later.splice(i, 1)
        }
      for (const s of sw) {
        s.a += s.w * dt * (swT > 0 ? 2.6 : 1)
        s.g.rotation.y = s.a
      }
      if (state === 'cd' && A) {
        const n = Math.min(3, Math.ceil((A.passAt - now) / 1000))
        if (n !== lastN && n > 0) {
          lastN = n
          msg(String(n), 900)
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
          msg(e[0], 1800)
          snd(200, 0.3, 'sawtooth', 0.08, 300)
          e[1](ev.r, now)
        }
        if (lastHolder !== null && A.holder !== lastHolder) passFx()
        lastHolder = A.holder
      }
      if (state === 'boom') boomLocal += dt

      /* chão inclinado: cresce com o tempo da rodada e com o placar; derivado do relógio da rodada para ficar igual nos dois lados */
      {
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
        arena.rotation.z = -tl[0]
        arena.rotation.x = tl[1]
        if (state === 'play' && tilt.m > 0.07 && !tiltWarn) {
          tiltWarn = true
          msg('O CHÃO ESTÁ CEDENDO!', 1700)
          snd(90, 0.6, 'sawtooth', 0.07, -30)
        }
        const dot = lvlEl.current?.firstElementChild as HTMLElement | null
        if (dot) {
          dot.style.transform = `translate(${(tl[0] / 0.34) * 16}px,${(tl[1] / 0.34) * 16}px)`
          dot.style.background = tilt.m > 0.22 ? '#ff3d5a' : tilt.m > 0.1 ? '#ffd23d' : '#ffffff'
        }
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
              for (const s of sw) {
                const t = clamp(p.x * Math.cos(s.a) - p.z * Math.sin(s.a), -s.len, s.len)
                if (Math.hypot(p.x - Math.cos(s.a) * t, p.z + Math.sin(s.a) * t) < 1.6) p.jr = 0.15
              }
            }
          }
          physics(p, ix, iz, state === 'play', holder, dt)
        } else if (!p.fly) {
          const net = oppNet.current
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
      me.current = { x: ME.x, y: ME.y, z: ME.z }

      const a = P[0]
      const b = P[1]
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
          if (A.holder === mySide && cd <= 0 && now - lastTag > 300) {
            lastTag = now
            actRef.current({ type: 'tag' })
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
        q.m.position.set(q.x, q.y, q.z)
        if (q.l < 1) q.m.scale.setScalar(Math.max(0.01, q.l))
        if (q.l <= 0) {
          arena.remove(q.m)
          balls.splice(i, 1)
        }
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.userData.t += dt
        const s = 1 + w.userData.t * 22
        w.scale.set(s, s, s)
        ;(w.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - w.userData.t * 1.6)
        if (w.userData.t > 0.7) {
          arena.remove(w)
          waves.splice(i, 1)
        }
      }
      /* animação dos avatares */
      for (const p of P) {
        const sp = Math.hypot(p.vx, p.vz)
        const k = Math.min(sp / 5, 1)
        const hold = holder === p.side && state !== 'boom'
        if (sp > 0.4) {
          const tg = Math.atan2(p.vx, p.vz)
          const df = ((tg - p.face + 9.4248) % 6.2832) - 3.1416
          p.face += df * Math.min(1, 12 * dt)
        }
        if (state !== 'play' && state !== 'cd' && !p.fly) {
          const o = P[1 - p.i]
          const tg = Math.atan2(o.x - p.x, o.z - p.z)
          p.face += (((tg - p.face + 9.4248) % 6.2832) - 3.1416) * Math.min(1, 4 * dt)
        }
        const g = p.g
        g.rotation.y = p.face
        g.rotation.x = k * 0.18
        if (p.fly) {
          p.y += 15 * dt
          g.rotation.z += dt * 14
          g.scale.setScalar(Math.max(0.0001, 1 - boomLocal / 1.4))
        }
        const tleft = A ? (A.explodeAt - now) / 1000 : 99
        const hop = Math.abs(Math.sin(T * 11 + p.i)) * 0.2 * k * (p.y < 0.05 ? 1 : 0)
        const jit = hold && tleft < 2.5 ? Math.sin(T * 70) * 0.06 : 0
        g.position.set(p.x + jit, hop + p.y, p.z)
        const sq = Math.sin(T * 22) * 0.06 * k
        p.sq = Math.max(0, p.sq - dt * 5)
        const st = (p.y > 0.05 && !p.fly ? clamp(p.jv * 0.015, -0.12, 0.2) : 0) - p.sq * 0.25
        p.body.scale.set(1 + sq - st * 0.6, 1 - sq + st, 1 - sq * 0.5 - st * 0.6)
        const air = p.y > 0.1 && !p.fly
        const wv = Math.sin(T * 11 + p.i * 1.7) * k
        const danger = hold && tleft < 2.5
        p.arms.forEach((a, j) => {
          const s = j ? 1 : -1
          a.rotation.x = hold ? -2.7 : (j ? -wv : wv) + (air ? -1.0 : 0)
          a.rotation.z = hold ? s * 0.3 : s * (0.12 + (air ? 0.7 : 0))
        })
        p.legs.forEach((l, j) => {
          l.rotation.x = air ? -0.6 : (j ? wv : -wv) * 0.95
        })
        p.head.position.y = 1.38 + Math.abs(Math.sin(T * 11 + p.i)) * 0.05 * k
        p.head.rotation.x = k * 0.1
        p.head.rotation.z = Math.sin(T * 3 + p.i) * 0.05 + (danger ? Math.sin(T * 70) * 0.08 : 0)
        p.ears.forEach((e, j) => {
          const s = j ? 1 : -1
          e.rotation.x = -0.1 - k * 0.4 + (air ? 0.45 : 0) + Math.sin(T * 9 + j) * 0.07 * k
          e.rotation.z = -s * (0.2 + (air ? 0.35 : 0) + (hold ? 0.25 : 0))
        })
        const bt = T * 2.3 + p.i * 5
        const blink = Math.floor(bt) % 6 === 0 && bt % 1 < 0.12 ? 0.12 : 1
        for (const e of p.eyes) e.scale.set(hold ? 1.2 : 1, (hold ? 1.3 : 1) * blink, 1)
        for (const b of p.brows) {
          b.rotation.z = hold ? -b.userData.s * 0.5 : b.userData.s * 0.08
          b.position.y = hold ? 0.34 : 0.3
        }
        p.sweat.visible = hold && tleft < 5 && state === 'play'
        p.sweat.position.y = 0.2 - ((T * 1.6) % 1) * 0.18
        p.mouth.scale.set(hold ? 1.7 : 1, hold ? 2.4 : 0.6, 0.5)
        p.blob.visible = !p.fly
        p.blob.position.set(p.x, 0.03, p.z)
        const bs = Math.max(0.3, 1 - p.y * 0.2)
        p.blob.scale.set(bs, bs, bs)
        ;(p.blob.material as THREE.MeshBasicMaterial).opacity = 0.32 * bs
      }
      /* bomba */
      bomb.visible = state === 'play' || state === 'cd'
      if (A && holder && (state === 'play' || state === 'cd')) {
        const h = P[holder === 'a' ? 0 : 1]
        const total = Math.max(1, A.explodeAt - A.passAt)
        const fr = clamp((A.explodeAt - Math.max(now, A.passAt)) / total, 0, 1)
        const fq = 2 + (1 - fr) * (1 - fr) * 16
        bp += fq * dt
        const on = Math.sin(bp * 6.283) > 0 ? 1 : 0
        if (on && !onP && state === 'play') snd(900 + (1 - fr) * 600, 0.05, 'square', 0.04)
        onP = on
        bm.emissive.setRGB(on * 0.9, 0, 0)
        bl.intensity = on * 2.5 * Math.PI
        bomb.scale.setScalar(1.15 * (1 + 0.18 * on + Math.sin(T * 8) * 0.03))
        spark.position.copy(fcurve.getPoint(0.12 + 0.88 * fr))
        spark.scale.setScalar(1 + Math.sin(T * 40) * 0.3)
        for (const u of bpup) u.scale.set(1 + (1 - fr) * 0.7, 1.2 + (1 - fr) * 0.7, 0.5)
        bomb.position.set(h.x, 3.0 + Math.sin(T * 6) * 0.1 + h.g.position.y, h.z)
        bomb.rotation.z = Math.sin(T * 5) * 0.2
        if (Math.random() < 0.5) burst(h.x + 0.1, 3.7, h.z, 1, 1.5, 0.1, 0.05)
      }
      /* decoração caótica */
      for (let i = 0; i < 6; i++) rings[i].color.setHSL((T * 0.12 + i * 0.11) % 1, 0.75, 0.62)
      pil.forEach((p, i) => {
        const s = 1 + 0.7 * Math.abs(Math.sin(T * 4 + i * 0.45))
        p.scale.y = s
        p.position.y = s / 2
      })
      dec.forEach((m, i) => {
        m.rotation.x += dt * m.userData.s
        m.rotation.y += dt * m.userData.s * 0.7
        m.position.y = m.userData.y + Math.sin(T * m.userData.s + i) * 1.2
      })
      for (const ob of OB)
        if (ob.bump) {
          ob.pop = Math.max(0, ob.pop - dt * 4)
          ob.m.scale.set(1 + ob.pop * 0.3, 1 - ob.pop * 0.2, 1 + ob.pop * 0.3)
        }
      L1.position.set(Math.cos(T * 0.9) * 10, 5, Math.sin(T * 0.9) * 10)
      L2.position.set(Math.cos(T * 0.9 + 3.14) * 10, 5, Math.sin(T * 0.9 + 3.14) * 10)
      bgc.setHSL(0.72 + 0.06 * Math.sin(T * 0.3), 0.5, 0.27)
      ;(scene.fog as THREE.Fog).color.copy(bgc)
      for (let i = 0; i < NP; i++) {
        const p = pd[i]
        if (p.l > 0) {
          p.l -= dt
          p.vy -= 14 * dt
          p.x += p.vx * dt
          p.y = Math.max(0.1, p.y + p.vy * dt)
          p.z += p.vz * dt
          dm.position.set(p.x, p.y, p.z)
          dm.scale.setScalar(p.s * Math.max(0, p.l / p.m))
          dm.rotation.set(T * 4 + i, T * 3, 0)
          dm.updateMatrix()
          pm.setMatrixAt(i, dm.matrix)
          if (p.l <= 0) {
            dm.scale.setScalar(0)
            dm.updateMatrix()
            pm.setMatrixAt(i, dm.matrix)
          }
        }
      }
      pm.instanceMatrix.needsUpdate = true
      const sk = shake * 0.5
      cam.position.set(camP.x + rnd(-sk, sk), camP.y + rnd(-sk, sk), camP.z)
      cam.lookAt(0, 0, 0)
    }

    const resize = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      rd.setSize(w, h)
      cam.aspect = w / h
      cam.updateProjectionMatrix()
      fitCamera()
    }
    // Binary-search the camera distance so the whole arena rim (incl. jump height) stays inside the viewport,
    // leaving room for the HUD on top and the controls at the bottom.
    const camDir = new THREE.Vector3(0, 15, 12).normalize()
    const rimPts: THREE.Vector3[] = []
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2
      for (const y of [0, 2.4]) rimPts.push(new THREE.Vector3(Math.cos(a) * (R + 0.8), y, Math.sin(a) * (R + 0.8)))
    }
    const tmpV = new THREE.Vector3()
    function fitCamera() {
      let lo = 10
      let hi = 120
      for (let k = 0; k < 18; k++) {
        const d = (lo + hi) / 2
        cam.position.copy(camDir).multiplyScalar(d)
        cam.lookAt(0, 0, 0)
        cam.updateMatrixWorld()
        let ok = true
        for (const p of rimPts) {
          tmpV.copy(p).project(cam)
          if (Math.abs(tmpV.x) > 0.94 || tmpV.y > 0.78 || tmpV.y < -0.9) {
            ok = false
            break
          }
        }
        if (ok) hi = d
        else lo = d
      }
      camP.copy(camDir).multiplyScalar(hi * 1.02)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    resize()
    hud({ a: 0, b: 0 })
    for (const p of P) {
      p.x = p.i ? 4 : -4
      p.z = 3
      p.face = p.i ? -1.2 : 1.2
    }

    let raf = 0
    let prev = performance.now()
    const loop = (t: number) => {
      const dt = Math.min((t - prev) / 1000, 0.05)
      prev = t
      update(dt)
      rd.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.clearTimeout(msgT)
      removeEventListener('keydown', kd)
      removeEventListener('keyup', ku)
      padEl.removeEventListener('pointerdown', pdown)
      padEl.removeEventListener('pointermove', pmove)
      padEl.removeEventListener('pointerup', pend)
      padEl.removeEventListener('pointercancel', pend)
      jbtn.removeEventListener('pointerdown', jdown)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      rd.dispose()
      rd.domElement.remove()
      AC?.close().catch(() => {})
    }
    // A cena é montada uma vez; dados vivos chegam por refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [rotated, setRotated] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (pointer: coarse)')
    const sync = () => setRotated(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    // Onde o navegador permite (Android), trava a tela em paisagem de verdade no primeiro toque.
    const lock = () => {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      if (!orientation?.lock || !mq.matches) return
      const el = document.documentElement
      const fs = document.fullscreenElement ? Promise.resolve() : el.requestFullscreen?.()
      Promise.resolve(fs)
        .then(() => orientation.lock?.('landscape'))
        .catch(() => {})
    }
    addEventListener('pointerdown', lock, { once: true })
    return () => {
      mq.removeEventListener('change', sync)
      removeEventListener('pointerdown', lock)
      const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void }
      orientation?.unlock?.()
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  const myEmoji = myIdx === 0 ? '🐰' : '🐻'

  return (
    <div ref={root} className={`bq ${fredoka.className}${rotated ? ' rot' : ''}`}>
      <style>{CSS}</style>
      <div ref={cv} className="bq-cv" />
      <div ref={pad} className="bq-pad" />
      <div className="bq-hud">
        <div>
          <span ref={s1} />
          <small className={myIdx === 0 ? 'me' : undefined}>{myIdx === 0 ? 'Você' : start.opponent.name}</small>
        </div>
        <div ref={lvlEl} className="bq-lvl" aria-hidden="true">
          <i />
        </div>
        <div>
          <span ref={s2} />
          <small className={myIdx === 1 ? 'me' : undefined}>{myIdx === 1 ? 'Você' : start.opponent.name}</small>
        </div>
      </div>
      <div ref={msgEl} className="bq-msg" aria-live="polite" />
      <div ref={flEl} className="bq-fl" />
      <div ref={jbEl} className="bq-jb">
        <i />
      </div>
      <button ref={jumpBtn} type="button" className={`bq-jump j${myIdx}`} aria-label="Pular">
        {myEmoji}
        <br />
        PULA
      </button>
      <button type="button" className="bq-quit" onClick={onQuit} aria-label="Desistir e sair">
        <X className="size-5" />
      </button>
      {menu && (
        <div className="bq-menu">
          <h1>{menu.title}</h1>
          <p>{menu.sub}</p>
          {menu.button && (
            <button type="button" onClick={() => startOffline.current()}>
              Jogar
            </button>
          )}
          {menu.note && <p className="bq-wait">{menu.note}</p>}
          {!ended.current && (
            <small>
              Você é o {myEmoji}. WASD ou setas para mover · Espaço ou Enter para pular.
              <br />
              No celular: arraste o polegar na tela e toque em PULA.
            </small>
          )}
        </div>
      )}
    </div>
  )
}
