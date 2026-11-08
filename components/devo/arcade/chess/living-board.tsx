'use client'

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Color, PieceSymbol } from 'chess.js'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { BoardTheme, PieceSet, Quality } from '@/lib/devo/arcade/chess-themes'
import { drawMarble, makeMarbleTexture, mixHex } from './marble'
import { BASE_EMISSIVE, getPieceModel, makeSideMaterials, type PieceModel } from './pieces3d'

/*
 * Living Chess — o tabuleiro de mármore do DEVO (ref. `refs/ref-xadrez-marmore.png`).
 * Câmera inclinada atrás das suas peças (assento fixo, como nos xadrezes clássicos de computador),
 * com órbita suave por arrasto que volta sozinha; peças grandes em escultura; mármore branco e
 * negro com veios, rejunte de aço champanhe com estrelas do sigilo nos cruzamentos e espadas de
 * cerimônia cravadas ao redor. Lances deslizam; capturas viram um golpe curto com estilhaços.
 *
 * Desempenho: a cena desenha sob demanda (`Pacer`). Parada, gasta quase nada; só anda em ritmo
 * cheio durante lance, seleção, xeque ou arrasto. As peças saem em lote (uma malha por tipo e lado)
 * e nenhuma luz entra ou sai durante a partida, porque isso recompila todos os shaders e trava a tela.
 */

export type UnitState = { id: number; type: PieceSymbol; color: Color; square: string }

export type AnimKind = 'walk' | 'jump' | 'melee' | 'heavy' | 'charge' | 'cast' | 'royal'

export type Anim = {
  start: number
  dur: number
  impact: number
  kind: AnimKind
  moverId: number
  from: string
  to: string
  victimId?: number
  victimSq?: string
  rook?: { id: number; from: string; to: string }
  promo?: boolean
  queenFx?: boolean
  variant: number
  side: Color
}

export type MateFx = { loserKing: number; start: number } | null

/**
 * Estado da câmera (mutável, lido a cada quadro). `az` = assento (0 brancas, π pretas);
 * `orbitX/orbitY` = órbita do arrasto (volta sozinha a 0); `zoom` = pinça.
 */
export type CamState = { az: number; pol: number; rad: number; zoom: number; spectator: boolean; dragDist: number; orbitX?: number; orbitY?: number; holdUntil?: number }

export const sqPos = (sq: string): [number, number] => [sq.charCodeAt(0) - 97 - 3.5, 3.5 - (Number(sq[1]) - 1)]
const nowS = () => performance.now() / 1000
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const ease = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

export function planAnim(
  type: PieceSymbol,
  side: Color,
  moverId: number,
  from: string,
  to: string,
  victim: { id: number; sq: string } | null,
  extra: { rook?: Anim['rook']; promo?: boolean; queenFx?: boolean },
): Anim {
  const [fx, fz] = sqPos(from)
  const [tx, tz] = sqPos(to)
  const dist = Math.hypot(tx - fx, tz - fz)
  let kind: AnimKind
  let dur: number
  let impact = 0
  if (!victim) {
    kind = type === 'n' ? 'jump' : 'walk'
    dur = type === 'n' ? 0.8 : Math.min(1.05, 0.62 + dist * 0.07) + (type === 'r' ? 0.1 : 0)
    if (extra.rook) dur = 1.05
  } else if (type === 'b' || type === 'q') {
    kind = 'cast'
    impact = type === 'q' ? 0.72 : 0.6
    dur = impact + 0.3 + Math.min(0.45, dist * 0.06) + (type === 'q' ? 0.15 : 0)
  } else {
    kind = type === 'r' ? 'heavy' : type === 'n' ? 'charge' : type === 'k' ? 'royal' : 'melee'
    impact = kind === 'heavy' ? 0.78 : kind === 'charge' ? 0.6 : 0.62
    dur = impact + 0.5
  }
  if (extra.promo) dur += 0.7
  return { start: nowS(), dur, impact, kind, moverId, from, to, victimId: victim?.id, victimSq: victim?.sq, variant: Math.random(), side, ...extra }
}


/** Escala das esculturas: um pouco mais largas e bem mais altas que a casa (leitura no celular). */
export const PIECE_SX = 1.06
export const PIECE_SY = 1.32
/** Compatibilidade: escala vertical. */
export const PIECE_SCALE = PIECE_SY
const KING_H = 1.72 * PIECE_SY

const LOOK = new THREE.Vector3(0, 0.35, 0.15)
const FAR_TOPS = [-3.5, 3.5].map((x) => new THREE.Vector3(x, KING_H * 0.92, -3.5))
const FAR_EDGE = [-4, 4].map((x) => new THREE.Vector3(x, 0, -4))
const NEAR_EDGE = [-4, 4].map((x) => new THREE.Vector3(x, 0, 4))
const fitCam = new THREE.PerspectiveCamera()
const fitNdc = new THREE.Vector3()

/** Lente longa (pouca distorção): as peças do fundo ficam quase do tamanho das da frente. */
export const fovFor = (aspect: number) => (aspect < 1 ? 30 : 32)

/**
 * Assento atrás das suas peças: vista de três quartos em que as oito colunas ocupam a largura
 * inteira no celular (o filete da moldura pode sangrar) e a fileira do fundo, com o rei, fica toda
 * visível. A distância é resolvida numericamente contra o viewport real.
 */
export function fitCamera(aspect: number) {
  const portrait = aspect < 1
  const pol = portrait ? 0.74 : 0.82
  fitCam.fov = fovFor(aspect)
  fitCam.aspect = aspect
  fitCam.near = 0.1
  fitCam.far = 120
  fitCam.updateProjectionMatrix()
  const fits = (rad: number) => {
    fitCam.position.set(LOOK.x, LOOK.y + Math.cos(pol) * rad, LOOK.z + Math.sin(pol) * rad)
    fitCam.lookAt(LOOK)
    fitCam.updateMatrixWorld()
    const ok = (p: THREE.Vector3, xMax: number, yMin: number, yMax: number) => {
      fitNdc.copy(p).project(fitCam)
      return Math.abs(fitNdc.x) <= xMax && fitNdc.y >= yMin && fitNdc.y <= yMax
    }
    return (
      NEAR_EDGE.every((p) => ok(p, portrait ? 1.0 : 0.9, -0.97, 1)) &&
      FAR_EDGE.every((p) => ok(p, 0.98, -1, 0.9)) &&
      FAR_TOPS.every((p) => ok(p, 0.98, -1, 0.97))
    )
  }
  let lo = 4
  let hi = 60
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) hi = mid
    else lo = mid
  }
  return { pol, rad: hi }
}

const HIT = new THREE.CylinderGeometry(0.4, 0.4, 1, 8).translate(0, 0.5, 0)
const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
const LEAN_AXIS = new THREE.Vector3()

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const bump = (t: number) => Math.sin(clamp01(t) * Math.PI)

/** Estado "precisa de quadro" que cada parte da cena informa ao `Pacer`. */
type Busy = { army: boolean; cam: boolean }

/** Uma peça saindo em quadro: posição, giro e o que o shader deforma. */
type Pose = { x: number; y: number; z: number; lean: number; tilt: number; spin: number; dissolve: number; flash: number; kneel: number; glow: number; bend: number; side: number; squash: number; moveDir: [number, number] | null; face: number | null }

/** Coreografia de uma peça neste instante (lance, golpe, queda, promoção). */
function poseOf(u: UnitState, a: Anim | null, n: number, p: Pose) {
  const [sx, sz] = sqPos(u.square)
  p.x = sx
  p.y = 0
  p.z = sz
  p.lean = p.tilt = p.spin = p.dissolve = p.flash = p.kneel = p.glow = p.bend = p.squash = 0
  p.side = Math.sin(n * 1.3 + u.id) * 0.012
  p.moveDir = null
  p.face = null
  if (!a) return
  const t = Math.min(n - a.start, a.dur)
  const [fx, fz] = sqPos(a.from)
  const [tx, tz] = sqPos(a.to)
  const dx = tx - fx
  const dz = tz - fz
  const len = Math.hypot(dx, dz) || 1

  if (a.moverId === u.id) {
    p.moveDir = [dx, dz]
    const moveEnd = a.dur - (a.promo ? 0.7 : 0)
    if (t < moveEnd) p.face = Math.atan2(dx, dz)
    if (a.kind === 'walk' || a.kind === 'jump') {
      const e = ease(t / moveEnd)
      p.x = fx + dx * e
      p.z = fz + dz * e
      p.y = a.kind === 'jump' ? Math.sin(e * Math.PI) * 0.85 : Math.abs(Math.sin(e * Math.PI * Math.max(2, Math.round(len * 2)))) * 0.025
      p.lean = a.kind === 'jump' ? Math.sin(e * Math.PI * 2) * 0.15 : 0.06 * Math.sin(e * Math.PI)
      const q = clamp01(t / moveEnd)
      if (a.kind === 'jump') {
        p.squash = q < 0.15 ? -0.2 * bump(q / 0.15) : q > 0.8 ? -0.18 * bump((q - 0.8) / 0.2) : 0.16 * bump((q - 0.15) / 0.65)
        p.bend = 0.3 * bump(q) - 0.12 * bump(q / 0.15)
      } else {
        const ph = q * Math.PI * Math.max(2, Math.round(len * 2))
        const env = bump(q)
        p.bend = 0.22 * env - 0.1 * bump(t / 0.2)
        p.side = 0.09 * Math.sin(ph) * env
        p.squash = -0.07 * Math.abs(Math.cos(ph)) * env - 0.1 * bump(t / 0.2)
      }
    } else if (a.kind === 'cast') {
      const raise = clamp01(t / 0.3)
      const lower = clamp01((t - a.impact - 0.05) / 0.2)
      p.lean = -0.12 * raise * (1 - lower)
      p.glow = raise * (1 - lower)
      p.bend = -0.3 * raise * (1 - lower) + 0.45 * bump((t - a.impact + 0.08) / 0.28)
      p.squash = 0.16 * raise * (1 - lower) - 0.08 * bump((t - a.impact) / 0.25)
      p.side = 0.06 * Math.sin(t * 9) * raise * (1 - lower)
      if (a.queenFx && t > a.impact && t < a.impact + 0.3) p.y = Math.sin(((t - a.impact) / 0.3) * Math.PI) * 0.14
      const w = ease((t - a.impact - 0.1) / Math.max(0.1, moveEnd - a.impact - 0.1))
      p.x = fx + dx * w
      p.z = fz + dz * w
    } else {
      const approach = a.kind === 'heavy' ? 0.5 : 0.42
      const px = tx - (dx / len) * 0.62
      const pz = tz - (dz / len) * 0.62
      const e1 = ease(t / approach)
      p.x = fx + (px - fx) * e1
      p.z = fz + (pz - fz) * e1
      if (a.kind === 'charge') p.y = Math.sin(clamp01(t / approach) * Math.PI) * 0.45
      const wind = clamp01((t - approach) / (a.impact - approach))
      const strike = clamp01((t - a.impact + 0.06) / 0.12)
      const recover = clamp01((t - a.impact - 0.12) / 0.2)
      const amp = 1 + (a.variant - 0.5) * 0.4
      p.lean = (0.22 * strike - 0.1 * wind) * (1 - recover) * amp
      const heavy = a.kind === 'heavy' ? 1.25 : 1
      p.bend = (0.7 * strike - 0.45 * wind) * (1 - recover) * amp * heavy + 0.12 * bump(t / approach)
      p.squash = (0.14 * strike - 0.14 * wind) * (1 - recover) * heavy + (a.kind === 'charge' ? 0.12 * bump(t / approach) : 0)
      p.side = 0.07 * Math.sin(clamp01(t / approach) * Math.PI * 4) * (1 - wind) + (a.variant - 0.5) * 0.25 * strike * (1 - recover)
      const e2 = ease((t - a.impact - 0.15) / Math.max(0.1, moveEnd - a.impact - 0.15))
      p.x += (tx - px) * e2
      p.z += (tz - pz) * e2
    }
    if (a.promo && t > moveEnd) {
      const q = clamp01((t - moveEnd) / 0.7)
      p.y = Math.sin(q * Math.PI) * 0.3
      p.spin = ease(q) * Math.PI * 2
      p.glow = Math.sin(q * Math.PI)
      p.squash = 0.22 * bump(q) - 0.12 * bump((q - 0.8) / 0.2)
    }
  } else if (a.rook && a.rook.id === u.id) {
    const [rfx, rfz] = sqPos(a.rook.from)
    const [rtx, rtz] = sqPos(a.rook.to)
    const e = ease((t - 0.15) / (a.dur - 0.2))
    p.x = rfx + (rtx - rfx) * e
    p.z = rfz + (rtz - rfz) * e
    p.y = Math.abs(Math.sin(e * Math.PI * 3)) * 0.04
    p.moveDir = [rtx - rfx, rtz - rfz]
    if (t < a.dur - 0.05) p.face = Math.atan2(rtx - rfx, rtz - rfz)
  } else if (a.victimId === u.id) {
    p.moveDir = [dx, dz]
    p.face = Math.atan2(-dx, -dz)
    if (t < a.impact) {
      const brace = clamp01((t - a.impact + 0.35) / 0.25)
      p.lean = -0.06 * brace
      p.squash = -0.1 * brace
      p.side = 0.05 * Math.sin(n * 30) * brace
    } else {
      const k = clamp01((t - a.impact) / 0.35)
      p.bend = -0.65 * (1 - Math.pow(1 - k, 3))
      p.squash = -0.1 - 0.12 * k
      p.x += (dx / len) * 0.3 * k
      p.z += (dz / len) * 0.3 * k
      p.tilt = 0.85 * ease(k)
      p.y = Math.sin(k * Math.PI) * 0.12
      p.flash = 1 - k
      p.dissolve = clamp01((t - a.impact - 0.08) / 0.4)
    }
  }
}

/** Lote de um tipo de peça de um lado: até três malhas que compartilham posições e dados por peça. */
type Lote = { model: PieceModel; meshes: THREE.InstancedMesh[]; life: THREE.InstancedBufferAttribute; fx: THREE.InstancedBufferAttribute; n: number }

/** Promoção pode criar até oito peças a mais do mesmo tipo. */
const CAPACITY: Record<PieceSymbol, number> = { p: 8, n: 10, b: 10, r: 10, q: 9, k: 1 }
const TYPES: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q', 'k']

function makeLote(type: PieceSymbol, color: Color, quality: Quality, mats: ReturnType<typeof makeSideMaterials>, shadows: boolean): Lote {
  const model = getPieceModel(type, quality)
  const cap = CAPACITY[type]
  const life = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage)
  const fx = new THREE.InstancedBufferAttribute(new Float32Array(cap * 2), 2).setUsage(THREE.DynamicDrawUsage)
  const mk = (g: THREE.BufferGeometry, m: THREE.Material, cast: boolean, shared?: THREE.InstancedBufferAttribute) => {
    const shell = new THREE.BufferGeometry()
    shell.setIndex(g.index)
    for (const k of Object.keys(g.attributes)) shell.setAttribute(k, g.attributes[k])
    shell.setAttribute('aLife', life)
    shell.setAttribute('aFx', fx)
    const mesh = new THREE.InstancedMesh(shell, m, cap)
    if (shared) mesh.instanceMatrix = shared
    else mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.castShadow = cast
    mesh.raycast = () => null
    mesh.name = `${color}${type}`
    return mesh
  }
  const body = mk(model.body, mats.body, shadows)
  const meshes = [body, mk(model.trim, mats.trim, false, body.instanceMatrix)]
  if (model.glow) meshes.push(mk(model.glow, mats.glow, false, body.instanceMatrix))
  return { model, meshes, life, fx, n: 0 }
}

const m4 = new THREE.Matrix4()
const v3 = new THREE.Vector3()
const v3s = new THREE.Vector3()
const qLean = new THREE.Quaternion()
const qYaw = new THREE.Quaternion()
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const AXIS_REST = new THREE.Vector3()
const PLANE_Y0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

/** Sombra de contato (qualidade baixa, sem mapa de sombras): um disco escuro sob cada peça. */
function makeBlobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(32, 32, 6, 32, 32, 32)
  g.addColorStop(0, 'rgba(0,0,0,0.72)')
  g.addColorStop(0.6, 'rgba(0,0,0,0.42)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}
const BLOB_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)

/**
 * Qual peça o toque quis dizer: a que está mais perto do eixo do dedo, com a área afinando para o
 * alto como as próprias peças (um cilindro reto fazia o rei cobrir por inteiro o peão atrás dele).
 * Tocar de novo na peça já selecionada passa para a próxima que está sob o dedo.
 */
function pickUnit(ray: THREE.Ray, units: UnitState[], quality: Quality, selected: string | null) {
  const { origin: o, direction: d } = ray
  const dd = d.x * d.x + d.z * d.z || 1e-6
  const hits: { u: UnitState; score: number }[] = []
  for (const u of units) {
    const [x, z] = sqPos(u.square)
    const H = getPieceModel(u.type, quality).height * PIECE_SY
    let t = Math.max(0, ((x - o.x) * d.x + (z - o.z) * d.z) / dd)
    const y = Math.max(0, Math.min(H, o.y + d.y * t))
    if (d.y) t = (y - o.y) / d.y
    const r = Math.hypot(o.x + d.x * t - x, o.z + d.z * t - z)
    const R = 0.42 - 0.22 * (y / H)
    if (r <= R) hits.push({ u, score: r / R + t * 0.01 })
  }
  hits.sort((a, b) => a.score - b.score)
  return hits.length > 1 && hits[0].u.square === selected ? hits[1].u : hits[0]?.u
}

function Army({
  units,
  animRef,
  mateRef,
  selected,
  set,
  quality,
  busy,
  targets,
  onSquare,
}: {
  units: UnitState[]
  animRef: RefObject<Anim | null>
  mateRef: RefObject<MateFx>
  selected: string | null
  set: PieceSet
  quality: Quality
  busy: RefObject<Busy>
  targets: string[]
  onSquare: (sq: string) => void
}) {
  const shadows = quality !== 'low'
  const gl = useThree((s) => s.gl)
  const mats = useMemo(() => ({ w: makeSideMaterials('w', set, quality), b: makeSideMaterials('b', set, quality) }), [set, quality])
  useEffect(
    () => () => {
      for (const m of [mats.w, mats.b]) {
        m.body.dispose()
        m.trim.dispose()
        m.glow.dispose()
      }
    },
    [mats],
  )
  const lotes = useMemo(() => {
    const out = new Map<string, Lote>()
    for (const c of ['w', 'b'] as const) for (const t of TYPES) out.set(`${c}${t}`, makeLote(t, c, quality, mats[c], shadows))
    return out
  }, [mats, quality, shadows])
  const todas = useMemo(() => [...lotes.values()].flatMap((l) => l.meshes), [lotes])
  useEffect(
    () => () => {
      for (const m of todas) {
        m.geometry.dispose()
        m.dispose()
      }
    },
    [todas],
  )

  const blobTex = useMemo(() => (shadows ? null : makeBlobTexture()), [shadows])
  const blobMat = useMemo(() => (blobTex ? new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }) : null), [blobTex])
  const blobs = useMemo(() => {
    if (!blobMat) return null
    const m = new THREE.InstancedMesh(BLOB_GEO, blobMat, 40)
    m.count = 0
    m.frustumCulled = false
    m.raycast = () => null
    return m
  }, [blobMat])
  useEffect(
    () => () => {
      blobTex?.dispose()
      blobMat?.dispose()
      blobs?.dispose()
    },
    [blobTex, blobMat, blobs],
  )

  const heading = useRef(new Map<number, number>())
  const pose = useRef<Pose>({ x: 0, y: 0, z: 0, lean: 0, tilt: 0, spin: 0, dissolve: 0, flash: 0, kneel: 0, glow: 0, bend: 0, side: 0, squash: 0, moveDir: null, face: null })

  // Mapa de sombras sob demanda: só é refeito quando alguma peça se move de verdade.
  useEffect(() => {
    const sm = gl.shadowMap
    const prev = sm.autoUpdate
    sm.autoUpdate = false
    sm.needsUpdate = true
    return () => {
      sm.autoUpdate = prev
    }
  }, [gl])

  // Toque nas peças: um único lote invisível de cilindros, refeito só quando as peças mudam de casa.
  const hit = useRef<THREE.InstancedMesh>(null)
  const hitUnits = useRef<UnitState[]>([])
  useLayoutEffect(() => {
    const h = hit.current
    if (!h) return
    units.forEach((u, i) => {
      const [x, z] = sqPos(u.square)
      m4.makeScale(1.1, getPieceModel(u.type, quality).height * PIECE_SY, 1.1).setPosition(x, 0, z)
      h.setMatrixAt(i, m4)
    })
    h.count = units.length
    h.instanceMatrix.needsUpdate = true
    h.boundingSphere = null
    h.computeBoundingSphere()
    hitUnits.current = units
    gl.shadowMap.needsUpdate = true
  }, [units, quality, gl])

  useFrame((_, delta) => {
    const n = nowS()
    const a = animRef.current
    const mate = mateRef.current
    const p = pose.current
    let moving = !!a
    for (const l of lotes.values()) l.n = 0
    let nb = 0
    for (const u of units) {
      const l = lotes.get(`${u.color}${u.type}`)
      if (!l || l.n >= CAPACITY[u.type]) continue
      poseOf(u, a, n, p)
      // O cavalo descansa de perfil, olhando para o centro: de frente, a cabeça vira uma placa fina.
      const restYaw = (u.color === 'w' ? Math.PI : 0) + (u.type === 'n' ? (u.square[0] < 'e' ? 1 : -1) * (u.color === 'w' ? -1 : 1) * 1.05 : 0)
      if (mate && mate.loserKing === u.id) {
        const age = n - mate.start
        p.kneel = ease((age - 0.4) / 0.8)
        if (age < 1.4) moving = true
      }
      const isSel = selected === u.square
      const target = p.face ?? restYaw
      let h = heading.current.get(u.id) ?? restYaw
      const dh = wrapAngle(target - h)
      if (Math.abs(dh) > 0.002) {
        h += dh * Math.min(1, delta * 9)
        moving = true
      }
      heading.current.set(u.id, h)
      if (isSel) moving = true

      const breath = 1 + Math.sin(n * 1.6 + u.id * 1.7) * 0.006
      const shrink = 1 - p.dissolve * 0.85
      v3.set(p.x, p.y + (isSel ? 0.16 + Math.sin(n * 4) * 0.03 : 0) - p.dissolve * 0.35, p.z)
      if (p.moveDir && (p.moveDir[0] || p.moveDir[1])) qLean.setFromAxisAngle(AXIS_REST.set(p.moveDir[1], 0, -p.moveDir[0]).normalize(), p.lean + p.tilt + p.kneel * 0.12)
      else if (p.kneel) qLean.setFromAxisAngle(AXIS_REST.set(u.color === 'w' ? -1 : 1, 0, 0), p.kneel * 0.22)
      else qLean.identity()
      qYaw.setFromAxisAngle(AXIS_Y, h + p.spin)
      qLean.multiply(qYaw)
      v3s.set(shrink * PIECE_SX, breath * shrink * (1 - p.kneel * 0.12) * PIECE_SY, shrink * PIECE_SX)
      m4.compose(v3, qLean, v3s)
      const i = l.n++
      m4.toArray(l.meshes[0].instanceMatrix.array, i * 16)

      let bend = p.bend
      if (isSel) bend += 0.04 * Math.sin(n * 4)
      bend += p.kneel * 0.4
      l.life.setXYZW(i, Math.max(-0.8, Math.min(0.8, bend)), p.side, Math.max(-0.3, Math.min(0.3, p.squash)), l.model.height)
      l.fx.setXY(i, BASE_EMISSIVE[u.color] + p.glow * 0.5 + p.flash * 1.2 + (isSel ? 0.12 : 0), 1 - p.kneel * 0.55)

      if (blobs) {
        m4.makeScale(0.98 * shrink, 1, 0.98 * shrink).setPosition(p.x, 0.006, p.z)
        blobs.setMatrixAt(nb++, m4)
      }
    }
    for (const l of lotes.values()) {
      for (const m of l.meshes) m.count = l.n
      if (l.n) {
        l.meshes[0].instanceMatrix.needsUpdate = true
        l.life.needsUpdate = true
        l.fx.needsUpdate = true
      }
    }
    if (blobs) {
      blobs.count = nb
      blobs.instanceMatrix.needsUpdate = true
    }
    busy.current.army = moving
    if (moving && shadows) gl.shadowMap.needsUpdate = true
  })

  return (
    <>
      {todas.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      {blobs && <primitive object={blobs} />}
      <instancedMesh
        ref={hit}
        args={[HIT, HIT_MAT, 40]}
        frustumCulled={false}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          // Uma casa possível atrás de uma peça alta: o toque vale para a casa, não para a peça da frente.
          if (e.ray.intersectPlane(PLANE_Y0, v3)) {
            const under = SQ_FROM_POINT(v3.x, v3.z)
            if (under && targets.includes(under)) {
              onSquare(under)
              return
            }
          }
          const u = pickUnit(e.ray, hitUnits.current, quality, selected)
          if (u) onSquare(u.square)
          else if (e.ray.intersectPlane(PLANE_Y0, v3)) {
            const sq = SQ_FROM_POINT(v3.x, v3.z)
            if (sq) onSquare(sq)
          }
        }}
      />
    </>
  )
}

/** Cores do combate: o lado branco golpeia em aço champanhe; o negro, em ametista. */
const SIDE_FX: Record<Color, string> = { w: '#ece5d8', b: '#a99be0' }

function Effects({ animRef, theme, quality }: { animRef: RefObject<Anim | null>; theme: BoardTheme; quality: Quality }) {
  const bolt = useRef<THREE.Mesh>(null)
  const boltMat = useRef<THREE.MeshBasicMaterial>(null)
  const flash = useRef<THREE.Mesh>(null)
  const flashMat = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const pillar = useRef<THREE.Mesh>(null)
  const pillarMat = useRef<THREE.MeshBasicMaterial>(null)
  const shards = useRef<THREE.InstancedMesh>(null)
  const shardMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.1 }), [])
  useEffect(() => () => shardMat.dispose(), [shardMat])
  const count = quality === 'low' ? 6 : 12
  const dirs = useMemo(() => Array.from({ length: count }, (_, i) => ({ a: (i / count) * Math.PI * 2 + (i % 3) * 0.3, up: 0.6 + ((i * 37) % 10) / 10, s: (0.6 + ((i * 53) % 10) / 14) * (1 + (i % 3) * 0.4) })), [count])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const a = animRef.current
    const t = a ? nowS() - a.start : 99
    const all = [bolt, flash, ring, pillar]
    if (!a || t > a.dur + 0.5) {
      for (const m of all) if (m.current) m.current.visible = false
      if (shards.current) shards.current.visible = false
      return
    }
    const [fx, fz] = sqPos(a.from)
    const [tx, tz] = sqPos(a.victimSq ?? a.to)
    const color = SIDE_FX[a.side]

    if (bolt.current && boltMat.current) {
      const on = a.kind === 'cast' && t > 0.28 && t < a.impact
      bolt.current.visible = on
      if (on) {
        const p = clamp01((t - 0.28) / (a.impact - 0.28))
        bolt.current.position.set(fx + (tx - fx) * p, 1.2 - p * 0.6 + Math.sin(p * Math.PI) * 0.6, fz + (tz - fz) * p)
        bolt.current.scale.setScalar(a.queenFx ? 1.6 : 1)
        bolt.current.rotation.y += 0.3
        boltMat.current.color.set(color)
      }
    }
    const it = t - a.impact
    const hit = !!a.victimSq && it > 0 && it < 0.5
    if (flash.current && flashMat.current) {
      flash.current.visible = hit && it < 0.35
      if (hit) {
        flash.current.position.set(tx, 0.7, tz)
        flash.current.scale.setScalar((0.25 + it * 2.4) * (a.queenFx ? 1.5 : 1))
        flashMat.current.opacity = Math.max(0, 0.85 - it * 2.6)
        flashMat.current.color.set(color)
      }
    }
    if (ring.current && ringMat.current) {
      ring.current.visible = hit
      if (hit) {
        ring.current.position.set(tx, 0.03, tz)
        ring.current.scale.setScalar(0.45 + it * (a.kind === 'heavy' ? 4 : 2.8))
        ringMat.current.opacity = Math.max(0, 0.85 - it * 1.8)
        ringMat.current.color.set(color)
      }
    }
    if (shards.current) {
      // Estilhaços de pedra da peça abatida (cor do lado que caiu).
      shards.current.visible = hit
      if (hit) {
        shardMat.color.set(a.side === 'w' ? '#2a2a2e' : '#ecebe8')
        const sm = shards.current
        dirs.forEach((d, i) => {
          const r = it * 2.2 * d.s
          dummy.position.set(tx + Math.cos(d.a) * r, 0.55 + it * (2.4 * d.up) - it * it * 9, tz + Math.sin(d.a) * r)
          dummy.rotation.set(it * 9 * d.s, it * 7, 0)
          dummy.scale.setScalar(Math.max(0.001, (1 - it * 1.6) * (1 + (i % 3) * 0.4)))
          dummy.updateMatrix()
          sm.setMatrixAt(i, dummy.matrix)
        })
        sm.instanceMatrix.needsUpdate = true
      }
    }
    if (pillar.current && pillarMat.current) {
      const pt = t - (a.dur - 0.75)
      const on = !!a.promo && pt > 0
      pillar.current.visible = on
      if (on) {
        const [px, pz] = sqPos(a.to)
        pillar.current.position.set(px, 1.4, pz)
        pillar.current.scale.set(1, Math.max(0.01, Math.min(1, pt * 3)), 1)
        pillarMat.current.opacity = 0.5 * Math.sin(clamp01(pt / 1.1) * Math.PI)
      }
    }
  })

  return (
    <>
      <mesh ref={bolt} visible={false}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshBasicMaterial ref={boltMat} toneMapped={false} />
      </mesh>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.35, 14, 10]} />
        <meshBasicMaterial ref={flashMat} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.42, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial ref={ringMat} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={shards} args={[undefined, shardMat, count]} visible={false} frustumCulled={false} raycast={() => null}>
        <tetrahedronGeometry args={[0.05, 0]} />
      </instancedMesh>
      <mesh ref={pillar} visible={false}>
        <cylinderGeometry args={[0.34, 0.42, 2.8, 24, 1, true]} />
        <meshBasicMaterial ref={pillarMat} color={theme.glow} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

function CameraRig({ cam, animRef, busy, breathe }: { cam: RefObject<CamState>; animRef: RefObject<Anim | null>; busy: RefObject<Busy>; breathe: boolean }) {
  const look = useRef(LOOK.clone())
  const focus = useRef(new THREE.Vector3())
  const cur = useRef<{ az: number; pol: number; rad: number } | null>(null)
  const fit = useRef({ aspect: 0, pol: 0.8, rad: 13 })
  useFrame(({ camera, clock }, dt) => {
    const c = cam.current
    if (!c) return
    const pc = camera as THREE.PerspectiveCamera
    if (Math.abs(fit.current.aspect - pc.aspect) > 0.001) {
      fit.current = { aspect: pc.aspect, ...fitCamera(pc.aspect) }
      const wantFov = fovFor(pc.aspect)
      if (pc.fov !== wantFov) {
        pc.fov = wantFov
        pc.far = 120
        pc.updateProjectionMatrix()
      }
    }
    const { pol, rad } = fit.current
    // Entrada à moda dos xadrezes de mesa clássicos: a câmera desce em arco até o seu assento.
    if (!cur.current) cur.current = { az: c.az + 1.15, pol: Math.max(0.35, pol - 0.32), rad: rad * 1.45 }
    // A órbita do arrasto volta sozinha ao assento quando o dedo solta.
    const now = performance.now()
    if (!c.holdUntil || now > c.holdUntil) {
      const back = 1 - Math.pow(0.12, dt)
      c.orbitX = (c.orbitX ?? 0) * (1 - back)
      c.orbitY = (c.orbitY ?? 0) * (1 - back)
    }
    const a = animRef.current
    const t = a ? nowS() - a.start : 99
    const facing = Math.cos(c.az) >= 0 ? 1 : -1
    const baseZ = LOOK.z * facing
    focus.current.set(0, LOOK.y, baseZ)
    let zoom = 1
    let tilt = 0
    let shake = 0
    const hold = a ? a.dur + 0.4 : 0
    if (a && t < hold) {
      const capture = !!(a.victimSq || a.promo)
      const moveEnd = a.dur - (a.promo ? 0.7 : 0)
      const [fx, fz] = sqPos(a.from)
      const [tx, tz] = sqPos(a.to)
      const e = ease(t / moveEnd)
      const px = fx + (tx - fx) * e
      const pz = fz + (tz - fz) * e
      const w = ease(Math.min(t / 0.35, (hold - t) / 0.5, 1)) * (capture ? 0.55 : 0.12)
      focus.current.set(px * w, LOOK.y + 0.3 * w, baseZ + (pz - baseZ) * w)
      zoom = 1 - (capture ? (a.queenFx ? 0.3 : 0.24) : 0.03) * ease(Math.min(t / 0.35, (hold - t) / 0.5, 1))
      tilt = capture ? 0.06 : 0
      const it = t - a.impact
      if (a.victimSq && it > 0 && it < 0.22) shake = (1 - it / 0.22) * (a.queenFx ? 0.05 : 0.025)
    }
    // Respiração lenta da câmera (órbita de ±1,6°): a cena nunca fica congelada.
    const idle = breathe ? Math.sin(clock.elapsedTime * 0.32) * 0.028 : 0
    const k = 1 - Math.pow(0.004, dt)
    const s = cur.current
    s.az += (c.az + (c.orbitX ?? 0) + idle - s.az) * (1 - Math.pow(0.04, dt))
    s.pol += (Math.max(0.35, Math.min(1.1, pol + tilt + (c.orbitY ?? 0))) - s.pol) * k
    s.rad += (rad * c.zoom * zoom - s.rad) * k
    look.current.lerp(focus.current, k)
    // Ainda chegando ao assento (entrada, arrasto, zoom ou retorno do golpe): pede quadro cheio.
    const azGoal = c.az + (c.orbitX ?? 0) + idle
    busy.current.cam =
      Math.abs(wrapAngle(azGoal - s.az)) > 0.004 ||
      Math.abs(rad * c.zoom * zoom - s.rad) > 0.01 ||
      Math.abs(pol + tilt + (c.orbitY ?? 0) - s.pol) > 0.002 ||
      look.current.distanceToSquared(focus.current) > 1e-5 ||
      Math.abs(c.orbitX ?? 0) > 0.002 ||
      Math.abs(c.orbitY ?? 0) > 0.002 ||
      shake > 0
    camera.position.set(
      look.current.x + Math.sin(s.az) * Math.sin(s.pol) * s.rad + (Math.random() - 0.5) * shake,
      look.current.y + Math.cos(s.pol) * s.rad + (Math.random() - 0.5) * shake,
      look.current.z + Math.cos(s.az) * Math.sin(s.pol) * s.rad,
    )
    camera.lookAt(look.current)
  })
  return null
}

/** Estrela de 4 pontas do sigilo desenhada no canvas (cruzamentos do rejunte). */
function canvasStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const k = r * 0.22
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x + k, y - k, x + r, y)
  ctx.quadraticCurveTo(x + k, y + k, x, y + r)
  ctx.quadraticCurveTo(x - k, y + k, x - r, y)
  ctx.quadraticCurveTo(x - k, y - k, x, y - r)
  ctx.closePath()
  ctx.fill()
}

/**
 * Textura do tampo (um canvas só, uma malha só): 64 casas de mármore com veios próprios, chanfro
 * claro/escuro nas bordas de cada pedra, rejunte de aço champanhe e estrelas nos cruzamentos.
 */
function drawBoardTexture(theme: BoardTheme, px: number) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const ctx = c.getContext('2d')!
  const cell = px / 8
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rankIdx = 7 - r
      const light = (f + rankIdx) % 2 === 1
      ctx.save()
      ctx.translate(f * cell, r * cell)
      ctx.beginPath()
      ctx.rect(0, 0, cell, cell)
      ctx.clip()
      drawMarble(ctx, {
        base: light ? theme.light : theme.dark,
        mottle: light ? mixHex(theme.light, '#cfccc5', 0.7) : mixHex(theme.dark, '#4a4a50', 0.6),
        vein: light ? theme.lightVein : theme.darkVein,
        veinAlpha: light ? 0.62 : 0.42,
        seed: 97 + f * 31 + r * 211,
        size: cell,
        cracks: (f * 7 + r * 3) % 5 === 0 ? 2 : 0,
      })
      // Chanfro da pedra: luz no alto/esquerda, sombra embaixo/direita.
      const b = Math.max(2, cell * 0.035)
      ctx.globalAlpha = light ? 0.55 : 0.18
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cell, b)
      ctx.fillRect(0, 0, b, cell)
      ctx.globalAlpha = light ? 0.22 : 0.45
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, cell - b, cell, b)
      ctx.fillRect(cell - b, 0, b, cell)
      ctx.globalAlpha = 1
      ctx.restore()
    }
  }
  // Rejunte: sulco escuro + filete de aço.
  const metal = ctx.createLinearGradient(0, 0, px, px)
  metal.addColorStop(0, '#f4efe6')
  metal.addColorStop(0.3, theme.trim)
  metal.addColorStop(0.55, mixHex(theme.trim, '#5f584d', 0.5))
  metal.addColorStop(0.8, theme.trim)
  metal.addColorStop(1, '#f4efe6')
  for (let i = 0; i <= 8; i++) {
    const p = i * cell
    ctx.fillStyle = 'rgba(8,8,10,0.75)'
    ctx.fillRect(p - cell * 0.03, 0, cell * 0.06, px)
    ctx.fillRect(0, p - cell * 0.03, px, cell * 0.06)
  }
  ctx.fillStyle = metal
  for (let i = 0; i <= 8; i++) {
    const p = i * cell
    ctx.fillRect(p - cell * 0.012, 0, cell * 0.024, px)
    ctx.fillRect(0, p - cell * 0.012, px, cell * 0.024)
  }
  // Estrelas do sigilo nos cruzamentos internos.
  for (let i = 1; i < 8; i++)
    for (let j = 1; j < 8; j++) {
      ctx.fillStyle = 'rgba(8,8,10,0.6)'
      canvasStar(ctx, i * cell, j * cell, cell * 0.13)
      ctx.fillStyle = metal
      canvasStar(ctx, i * cell, j * cell, cell * 0.1)
    }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = px > 1024 ? 8 : 4
  return tex
}

/** Pintar o tampo é o passo mais caro de abrir a partida: guarda o último para a revanche abrir na hora. */
let boardCache: { key: string; tex: THREE.CanvasTexture } | null = null
function boardTexture(theme: BoardTheme, px: number) {
  const key = `${theme.id}-${px}`
  if (boardCache?.key === key) return boardCache.tex
  boardCache?.tex.dispose()
  boardCache = { key, tex: drawBoardTexture(theme, px) }
  return boardCache.tex
}

const SQ_FROM_POINT = (x: number, z: number) => {
  const f = Math.floor(x + 4)
  const r = 7 - Math.floor(z + 4)
  if (f < 0 || f > 7 || r < 0 || r > 7) return null
  return `${String.fromCharCode(97 + f)}${r + 1}`
}

const TOP = new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2)
const FRAME_W = 0.55
const SLAB_H = 0.42

/** Junta caixas numa malha só (um desenho, em vez de um por régua). */
function mergedBoxes(list: readonly (readonly [x: number, y: number, z: number, sx: number, sy: number, sz: number])[]) {
  const parts = list.map(([x, y, z, sx, sy, sz]) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z))
  const g = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  return g
}

/** Moldura em mármore negro: quatro réguas com filete de aço por dentro e por fora. */
function BoardFrame({ theme, quality }: { theme: BoardTheme; quality: Quality }) {
  const marble = useMemo(() => {
    const t = makeMarbleTexture({ base: theme.frame, mottle: mixHex(theme.frame, '#3a3a40', 0.7), vein: '#8f8e8b', veinAlpha: 0.38, seed: 771, size: quality === 'high' ? 512 : 256, cracks: 3 })
    t.repeat.set(3, 0.4)
    return t
  }, [theme.frame, quality])
  useEffect(() => () => marble.dispose(), [marble])
  const stone = useMemo(
    () =>
      quality === 'high'
        ? new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.6 })
        : new THREE.MeshStandardMaterial({ map: marble, roughness: 0.36, envMapIntensity: 0.42 }),
    [marble, quality],
  )
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: theme.trim, metalness: 1, roughness: 0.28, envMapIntensity: 1.3 }), [theme.trim])
  useEffect(() => () => {
    stone.dispose()
    metal.dispose()
  }, [stone, metal])
  const geos = useMemo(() => {
    const outer = 4 + FRAME_W
    const y = -SLAB_H / 2 + 0.005
    const stoneGeo = mergedBoxes([
      [0, y, -(4 + FRAME_W / 2), outer * 2, SLAB_H, FRAME_W],
      [0, y, 4 + FRAME_W / 2, outer * 2, SLAB_H, FRAME_W],
      [-(4 + FRAME_W / 2), y, 0, FRAME_W, SLAB_H, 8],
      [4 + FRAME_W / 2, y, 0, FRAME_W, SLAB_H, 8],
      [0, -SLAB_H / 2 - 0.02, 0, 8, SLAB_H - 0.04, 8],
    ])
    const rims = (half: number, ry: number, w: number) =>
      [
        [0, ry, -half, half * 2 + w, 0.03, w],
        [0, ry, half, half * 2 + w, 0.03, w],
        [-half, ry, 0, w, 0.03, half * 2 + w],
        [half, ry, 0, w, 0.03, half * 2 + w],
      ] as const
    // Filetes por dentro e por fora + rodapé de aço na base da laje.
    const metalGeo = mergedBoxes([...rims(4.02, 0.012, 0.05), ...rims(outer - 0.03, 0.012, 0.05), ...rims(outer - 0.01, -SLAB_H + 0.03, 0.06)])
    return { stoneGeo, metalGeo }
  }, [])
  useEffect(() => () => {
    geos.stoneGeo.dispose()
    geos.metalGeo.dispose()
  }, [geos])
  return (
    <group>
      <mesh geometry={geos.stoneGeo} material={stone} receiveShadow raycast={() => null} />
      <mesh geometry={geos.metalGeo} material={metal} raycast={() => null} />
    </group>
  )
}

type SwordSpot = { position: [number, number, number]; rotation: [number, number, number]; scale?: number }

/** Espadas de cerimônia cravadas: uma malha por material, com as quatro espadas juntas. */
function Swords({ spots }: { spots: SwordSpot[] }) {
  const parts = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({ color: '#d9d1c3', metalness: 1, roughness: 0.22, envMapIntensity: 1.4 })
    const brass = new THREE.MeshStandardMaterial({ color: '#bab09f', metalness: 1, roughness: 0.3, envMapIntensity: 1.2 })
    const grip = new THREE.MeshStandardMaterial({ color: '#1a1a1d', metalness: 0.3, roughness: 0.5 })
    const gem = new THREE.MeshStandardMaterial({ color: '#8a7cc8', metalness: 0.2, roughness: 0.1, emissive: new THREE.Color('#8a7cc8'), emissiveIntensity: 0.5 })
    return { steel, brass, grip, gem }
  }, [])
  const geos = useMemo(() => {
    const bag = { steel: [] as THREE.BufferGeometry[], brass: [] as THREE.BufferGeometry[], grip: [] as THREE.BufferGeometry[], gem: [] as THREE.BufferGeometry[] }
    const dummy = new THREE.Object3D()
    const flat = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g)
    const put = (list: THREE.BufferGeometry[], g: THREE.BufferGeometry, base: THREE.Matrix4, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1]) => {
      dummy.position.set(...p)
      dummy.rotation.set(...r)
      dummy.scale.set(...s)
      dummy.updateMatrix()
      list.push(flat(g).applyMatrix4(new THREE.Matrix4().multiplyMatrices(base, dummy.matrix)))
    }
    for (const { position, rotation, scale = 1 } of spots) {
      dummy.position.set(...position)
      dummy.rotation.set(...rotation)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      const base = dummy.matrix.clone()
      // lâmina: losango que afina até a ponta (enterrada no chão)
      put(bag.steel, new THREE.CylinderGeometry(0.1, 0.012, 3.1, 4), base, [0, 1.55, 0], [0, 0, 0], [1, 1, 0.22])
      put(bag.brass, new THREE.BoxGeometry(0.9, 0.07, 0.1), base, [0, 3.13, 0])
      for (const k of [-1, 1]) put(bag.brass, new THREE.ConeGeometry(0.05, 0.2, 6), base, [k * 0.5, 3.17, 0], [0, 0, k * -0.6])
      put(bag.brass, new THREE.OctahedronGeometry(0.07, 0), base, [0, 3.13, 0.06])
      put(bag.grip, new THREE.CylinderGeometry(0.045, 0.05, 0.55, 8), base, [0, 3.45, 0])
      put(bag.brass, new THREE.SphereGeometry(0.085, 10, 8), base, [0, 3.76, 0])
      put(bag.gem, new THREE.OctahedronGeometry(0.055, 0), base, [0, 3.86, 0], [0, 0, 0], [0.8, 1.3, 0.8])
    }
    const merge = (l: THREE.BufferGeometry[]) => {
      const g = mergeGeometries(l, false)!
      l.forEach((x) => x.dispose())
      return g
    }
    return { steel: merge(bag.steel), brass: merge(bag.brass), grip: merge(bag.grip), gem: merge(bag.gem) }
  }, [spots])
  useEffect(() => () => {
    Object.values(parts).forEach((m) => m.dispose())
    Object.values(geos).forEach((g) => g.dispose())
  }, [parts, geos])
  return (
    <>
      <mesh geometry={geos.steel} material={parts.steel} raycast={() => null} />
      <mesh geometry={geos.brass} material={parts.brass} raycast={() => null} />
      <mesh geometry={geos.grip} material={parts.grip} raycast={() => null} />
      <mesh geometry={geos.gem} material={parts.gem} raycast={() => null} />
    </>
  )
}

/** Chão: mármore negro que se dissolve no escuro (nenhum fundo chapado atrás do tabuleiro). */
function Floor({ quality }: { quality: Quality }) {
  const high = quality === 'high'
  const tex = useMemo(() => {
    const size = high ? 512 : 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    drawMarble(ctx, { base: '#121214', mottle: '#1d1d21', vein: '#55555c', veinAlpha: 0.35, seed: 4242, size, cracks: 4 })
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [high])
  useEffect(() => () => tex.dispose(), [tex])
  // O chão cobre boa parte da tela: fora da qualidade alta, sem cálculo de luz nele.
  return (
    <mesh position={[0, -SLAB_H, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={high} raycast={() => null}>
      <circleGeometry args={[16, 48]} />
      {high ? <meshStandardMaterial map={tex} transparent roughness={0.5} metalness={0} depthWrite={false} /> : <meshBasicMaterial map={tex} transparent depthWrite={false} color="#c8c8cc" />}
    </mesh>
  )
}

const MK_PLANE = new THREE.PlaneGeometry(0.94, 0.94)
const MK_EDGE = new THREE.RingGeometry(0.6, 0.66, 4, 1, Math.PI / 4)
const MK_DOT = new THREE.CircleGeometry(0.15, 20)
const MK_DOT_EDGE = new THREE.RingGeometry(0.15, 0.19, 20)
const MK_RING = new THREE.RingGeometry(0.36, 0.46, 28)
const MK_HALO = new THREE.PlaneGeometry(2.2, 2.2)

const markMats = new Map<string, THREE.MeshBasicMaterial>()
/** Materiais das marcas, compartilhados: selecionar uma peça não cria material nenhum. */
function markMat(color: string, opacity: number) {
  const key = `${color}-${opacity}`
  let m = markMats.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })
    markMats.set(key, m)
  }
  return m
}

/** Marca plana sobre a casa (último lance, seleção). Fica montada e só aparece quando há casa, para já nascer compilada. */
function FlatMark({ geo, sq, color, opacity, y }: { geo: THREE.BufferGeometry; sq: string | null; color: string; opacity: number; y: number }) {
  const [x, z] = sq ? sqPos(sq) : [0, 0]
  return <mesh geometry={geo} material={markMat(color, opacity)} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} visible={!!sq} raycast={() => null} />
}

/** Casas possíveis da peça selecionada, em lote (uma dama no meio do tabuleiro chega a 27 casas). */
function TargetLayer({ geo, squares, color, opacity, y }: { geo: THREE.BufferGeometry; squares: string[]; color: string; opacity: number; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    d.rotation.x = -Math.PI / 2
    squares.forEach((sq, i) => {
      const [x, z] = sqPos(sq)
      d.position.set(x, y, z)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    })
    m.count = squares.length
    m.instanceMatrix.needsUpdate = true
  }, [squares, y])
  return <instancedMesh ref={ref} args={[geo, markMat(color, opacity), 28]} frustumCulled={false} raycast={() => null} />
}

let haloTex: THREE.CanvasTexture | null = null
function checkHaloTexture() {
  if (haloTex) return haloTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,59,74,0.9)')
  g.addColorStop(1, 'rgba(255,59,74,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  haloTex = new THREE.CanvasTexture(c)
  return haloTex
}

/**
 * Xeque: casa do rei em rubi pulsando (perigo real). Antes era uma luz de verdade, e acender uma
 * luz nova recompila todos os shaders e trava a tela bem na hora do xeque; agora é um halo pintado.
 */
function CheckGlow({ square }: { square: string | null }) {
  const plane = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (!square) return
    const p = (Math.sin(nowS() * 6) + 1) / 2
    if (plane.current) plane.current.opacity = 0.35 + p * 0.35
    if (halo.current) halo.current.opacity = 0.45 + p * 0.45
  })
  const [x, z] = square ? sqPos(square) : [0, 0]
  return (
    <group visible={!!square} position={[x, 0, z]}>
      <mesh geometry={MK_PLANE} position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <meshBasicMaterial ref={plane} color="#a3121f" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={MK_HALO} position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <meshBasicMaterial ref={halo} map={checkHaloTexture()} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function Board(props: {
  theme: BoardTheme
  quality: Quality
  lastFrom: string | null
  lastTo: string | null
  selected: string | null
  targets: string[]
  captureTargets: Set<string>
  checkSq: string | null
  onSquare: (sq: string) => void
}) {
  const { theme, quality, lastFrom, lastTo, selected, targets, captureTargets, onSquare } = props
  const tex = useMemo(() => boardTexture(theme, quality === 'high' ? 2048 : 1024), [theme, quality])
  const top = useMemo(
    () =>
      quality === 'high'
        ? new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55 })
        : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.22, metalness: 0, envMapIntensity: 0.62 }),
    [tex, quality],
  )
  useEffect(() => () => top.dispose(), [top])
  const quiet = useMemo(() => targets.filter((sq) => !captureTargets.has(sq)), [targets, captureTargets])
  const hits = useMemo(() => targets.filter((sq) => captureTargets.has(sq)), [targets, captureTargets])
  return (
    <group>
      <mesh
        geometry={TOP}
        material={top}
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          const sq = SQ_FROM_POINT(e.point.x, e.point.z)
          if (sq) onSquare(sq)
        }}
      />
      <BoardFrame theme={theme} quality={quality} />
      <FlatMark geo={MK_PLANE} sq={lastFrom} color={theme.trim} opacity={0.22} y={0.01} />
      <FlatMark geo={MK_PLANE} sq={lastTo} color={theme.trim} opacity={0.34} y={0.01} />
      <FlatMark geo={MK_EDGE} sq={lastTo} color="#ece5d8" opacity={0.7} y={0.012} />
      <CheckGlow square={props.checkSq} />
      <FlatMark geo={MK_PLANE} sq={selected} color="#8a7cc8" opacity={0.5} y={0.014} />
      <FlatMark geo={MK_EDGE} sq={selected} color="#cbc5e8" opacity={0.95} y={0.016} />
      <TargetLayer geo={MK_PLANE} squares={hits} color="#8a7cc8" opacity={0.28} y={0.018} />
      <TargetLayer geo={MK_RING} squares={hits} color="#cbc5e8" opacity={0.95} y={0.02} />
      <TargetLayer geo={MK_DOT_EDGE} squares={quiet} color="#0c0c0e" opacity={0.55} y={0.019} />
      <TargetLayer geo={MK_DOT} squares={quiet} color="#a99be0" opacity={0.95} y={0.02} />
    </group>
  )
}

/** Reflexos de estúdio neutros (gradiente + três caixas de luz), pré-filtrados com PMREM. */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const c = document.createElement('canvas')
    // 256×128 basta para reflexos largos como estes, e o pré-filtro fica quatro vezes menor.
    c.width = 256
    c.height = 128
    const x = c.getContext('2d')!
    x.scale(0.5, 0.5)
    const g = x.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#e9e7e3')
    g.addColorStop(0.45, '#6a6970')
    g.addColorStop(0.6, '#2b2a35')
    g.addColorStop(1, '#0c0c0e')
    x.fillStyle = g
    x.fillRect(0, 0, 512, 256)
    x.fillStyle = '#fffaf2'
    x.globalAlpha = 0.95
    for (const [a, b, w, h] of [[60, 40, 100, 30], [300, 34, 130, 26], [440, 64, 46, 44]]) x.fillRect(a, b, w, h)
    x.fillStyle = '#b7b3c9'
    x.globalAlpha = 0.6
    x.fillRect(200, 92, 60, 18)
    const t = new THREE.CanvasTexture(c)
    t.mapping = THREE.EquirectangularReflectionMapping
    t.colorSpace = THREE.SRGBColorSpace
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromEquirectangular(t).texture
    pm.dispose()
    t.dispose()
    const prevEnv = scene.environment
    const prevTone = gl.toneMapping
    const prevExposure = gl.toneMappingExposure
    scene.environment = env
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    return () => {
      scene.environment = prevEnv
      gl.toneMapping = prevTone
      gl.toneMappingExposure = prevExposure
      env.dispose()
    }
  }, [gl, scene])
  return null
}

/**
 * Luz de estúdio: chave quente-neutra do alto, contraluz ametista discreta e preenchimento frio.
 * Cada luz é repetida em todo pixel: fora da qualidade alta, o preenchimento vem do hemisfério.
 */
function StudioLights({ shadows, quality }: { shadows: boolean; quality: Quality }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const s = sun.current
    if (!s) return
    Object.assign(s.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 40 })
    s.shadow.camera.updateProjectionMatrix()
  }, [])
  const high = quality === 'high'
  return (
    <>
      <hemisphereLight args={['#f3f1ed', '#1a1a1f', high ? 1.1 : 1.28]} />
      <directionalLight
        ref={sun}
        position={[5, 14, 8]}
        intensity={3.2}
        color="#fff6ea"
        castShadow={shadows}
        shadow-mapSize={high ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 6, -9]} intensity={1.6} color="#b7b3c9" />
      {high && <pointLight position={[0, 5, 9]} intensity={8} distance={22} decay={1.4} color="#eeedeb" />}
    </>
  )
}

/** Desenha uma vez o que hoje está escondido. O quadro seguinte, no mesmo instante, cobre este. */
function warmUp(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const hidden: THREE.Object3D[] = []
  const empty: THREE.InstancedMesh[] = []
  scene.traverse((o) => {
    if (!o.visible) {
      o.visible = true
      hidden.push(o)
    }
    if (o instanceof THREE.InstancedMesh && o.count === 0) {
      o.count = 1
      empty.push(o)
    }
  })
  gl.render(scene, camera)
  for (const o of hidden) o.visible = false
  for (const o of empty) o.count = 0
}

/** Quadros por segundo com a cena parada (só a respiração da câmera e das peças). Baixa: nenhum. */
const IDLE_FPS: Record<Quality, number> = { low: 0, medium: 20, high: 30 }

/**
 * Marca-passo da cena (`frameloop="demand"`): pede quadro cheio só quando há o que mostrar e, com
 * tudo parado, um ritmo baixo. Se os quadros cheios não derem conta, baixa a resolução aos poucos e,
 * no limite, avisa para cair de qualidade (`onSlow`, só com gráficos em automático).
 */
function Pacer({ animRef, mateRef, cam, busy, selected, checkSq, quality, onSlow }: { animRef: RefObject<Anim | null>; mateRef: RefObject<MateFx>; cam: RefObject<CamState>; busy: RefObject<Busy>; selected: string | null; checkSq: string | null; quality: Quality; onSlow?: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  const setDpr = useThree((s) => s.setDpr)
  const dprNow = useRef(0)
  const dpr = useThree((s) => s.viewport.dpr)
  dprNow.current = dpr
  const need = useRef(false)
  need.current = !!selected || !!checkSq
  const amostra = useRef({ soma: 0, n: 0 })
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  // Já compila os shaders de tudo (efeitos de golpe e marcas inclusive) e, no primeiro quadro, desenha
  // tudo uma vez por baixo do quadro real: alguns drivers só terminam o shader no primeiro uso, e sem
  // isso a primeira captura travaria a tela.
  const aquecido = useRef<Quality | null>(null)
  useEffect(() => {
    gl.compile(scene, camera)
    invalidate()
  }, [gl, scene, camera, invalidate, quality])

  // O lance chega por ref, sem passar pelo React: uma olhada leve a cada 50 ms acorda a cena a tempo.
  useEffect(() => {
    let ult = 0
    let visto = 0
    const idle = IDLE_FPS[quality]
    const id = window.setInterval(() => {
      const c = cam.current
      const agora = performance.now()
      // Zoom, órbita e assento também chegam por ref: qualquer mudança neles acorda a cena.
      const sinal = c ? c.az + c.zoom * 7 + (c.orbitX ?? 0) * 13 + (c.orbitY ?? 0) * 17 : 0
      const mudou = sinal !== visto
      visto = sinal
      const ativo = mudou || !!animRef.current || need.current || busy.current.army || busy.current.cam || !!(c?.holdUntil && c.holdUntil > agora)
      if (ativo || (idle > 0 && agora - ult >= 1000 / idle - 5)) {
        ult = agora
        invalidate()
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [animRef, busy, cam, invalidate, quality])

  useFrame((_, delta) => {
    if (aquecido.current !== quality) {
      aquecido.current = quality
      warmUp(gl, scene, camera)
    }
    const c = cam.current
    const m = mateRef.current
    const ativo = !!animRef.current || need.current || busy.current.army || busy.current.cam || !!(c?.holdUntil && c.holdUntil > performance.now()) || !!(m && nowS() - m.start < 1.4)
    if (!ativo) {
      amostra.current = { soma: 0, n: 0 }
      return
    }
    invalidate()
    if (!onSlow || delta > 0.25) return
    const a = amostra.current
    a.soma += delta
    a.n++
    if (a.n < 45) return
    const media = a.soma / a.n
    amostra.current = { soma: 0, n: 0 }
    if (media < 0.036) return
    if (dprNow.current > 0.8) setDpr(Math.max(0.75, dprNow.current - 0.25))
    else if (quality !== 'low') onSlow()
  })
  return null
}

const SWORD_SPOTS: SwordSpot[] = [
  { position: [-5.6, -SLAB_H, -4.6], rotation: [0.22, 0.5, -0.3] },
  { position: [5.5, -SLAB_H, -5.2], rotation: [0.3, -0.4, 0.26], scale: 1.08 },
  { position: [-5.3, -SLAB_H, 3.2], rotation: [-0.1, 0.9, -0.34], scale: 0.92 },
  { position: [5.4, -SLAB_H, 2.4], rotation: [-0.16, -0.7, 0.3], scale: 0.95 },
]

/** Memoizada: o relógio da partida redesenha a tela; a cena só muda com lances, seleção e ajustes. */
export const LivingScene = memo(function LivingScene(props: {
  units: UnitState[]
  theme: BoardTheme
  set: PieceSet
  quality: Quality
  animRef: RefObject<Anim | null>
  mateRef: RefObject<MateFx>
  cam: RefObject<CamState>
  selected: string | null
  targets: string[]
  captureTargets: Set<string>
  lastFrom: string | null
  lastTo: string | null
  checkSq: string | null
  onSquare: (sq: string) => void
  /** Chamado se a cena não der conta nem na menor resolução (só com gráficos em automático). */
  onSlow?: () => void
}) {
  const { units, theme, set, quality, animRef, mateRef, cam, selected, onSquare, onSlow } = props
  const shadows = quality !== 'low'
  const busy = useRef<Busy>({ army: false, cam: false })
  return (
    <>
      <CameraRig cam={cam} animRef={animRef} busy={busy} breathe={IDLE_FPS[quality] > 0} />
      <StudioEnvironment />
      <StudioLights shadows={shadows} quality={quality} />
      <Floor quality={quality} />
      <Board
        theme={theme}
        quality={quality}
        lastFrom={props.lastFrom}
        lastTo={props.lastTo}
        selected={selected}
        targets={props.targets}
        captureTargets={props.captureTargets}
        checkSq={props.checkSq}
        onSquare={onSquare}
      />
      {/* Espadas de cerimônia cravadas ao redor (como na ref): duas atrás, uma de cada lado à frente. */}
      <Swords spots={SWORD_SPOTS} />
      <Army units={units} animRef={animRef} mateRef={mateRef} selected={selected} set={set} quality={quality} busy={busy} targets={props.targets} onSquare={onSquare} />
      <Effects animRef={animRef} theme={theme} quality={quality} />
      <Pacer animRef={animRef} mateRef={mateRef} cam={cam} busy={busy} selected={selected} checkSq={props.checkSq} quality={quality} onSlow={onSlow} />
    </>
  )
})
