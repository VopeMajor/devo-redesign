'use client'

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Color, PieceSymbol } from 'chess.js'
import { Suspense, memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { BoardTheme, PieceSet, Quality } from '@/lib/devo/arcade/chess-themes'
import { drawMarble, makeMarbleTexture, mixHex } from './marble'
import { BASE_EMISSIVE, makeUnitMaterials, usePieceModel } from './pieces3d'

/*
 * Living Chess — o tabuleiro de mármore do DEVO (ref. `refs/ref-xadrez-marmore.png`).
 * Câmera inclinada atrás das suas peças (assento fixo, como nos xadrezes clássicos de computador),
 * com órbita suave por arrasto que volta sozinha; peças grandes em escultura; mármore branco e
 * negro com veios, rejunte de aço champanhe com estrelas do sigilo nos cruzamentos e espadas de
 * cerimônia cravadas ao redor. Lances deslizam; capturas viram um golpe curto com estilhaços.
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

const HIT = new THREE.CylinderGeometry(0.4, 0.4, 1, 10).translate(0, 0.5, 0)
const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
const LEAN_AXIS = new THREE.Vector3()

type UnitProps = {
  u: UnitState
  animRef: RefObject<Anim | null>
  mateRef: RefObject<MateFx>
  selected: boolean
  set: PieceSet
  shadows: boolean
  lite: boolean
  onPick: (sq: string) => void
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const bump = (t: number) => Math.sin(clamp01(t) * Math.PI)

const Unit = memo(function Unit({ u, animRef, mateRef, selected, set, shadows, lite, onPick }: UnitProps) {
  const root = useRef<THREE.Group>(null)
  const leanG = useRef<THREE.Group>(null)
  const yawG = useRef<THREE.Group>(null)
  const restYaw = u.color === 'w' ? Math.PI : 0
  const heading = useRef(restYaw)
  const [sx, sz] = sqPos(u.square)
  const model = usePieceModel(u.type)
  const mats = useMemo(() => makeUnitMaterials(u.color, set, lite), [u.color, set, lite])
  const baseColor = useMemo(() => mats.body.color.clone(), [mats])
  useEffect(
    () => () => {
      mats.body.dispose()
      mats.trim.dispose()
      mats.glow.dispose()
    },
    [mats],
  )

  useFrame((_, delta) => {
    const g = root.current
    const lg = leanG.current
    const yg = yawG.current
    if (!g || !lg || !yg) return
    const n = nowS()
    let [x, z] = sqPos(u.square)
    let y = 0
    let lean = 0
    let tilt = 0
    let spin = 0
    let dissolve = 0
    let flash = 0
    let kneel = 0
    let glow = 0
    let bend = 0
    let side = Math.sin(n * 1.3 + u.id) * 0.012
    let squash = 0
    let moveDir: [number, number] | null = null
    let face: number | null = null
    const a = animRef.current
    const t = a ? Math.min(n - a.start, a.dur) : 99

    if (a) {
      const [fx, fz] = sqPos(a.from)
      const [tx, tz] = sqPos(a.to)
      const dx = tx - fx
      const dz = tz - fz
      const len = Math.hypot(dx, dz) || 1

      if (a.moverId === u.id) {
        moveDir = [dx, dz]
        const moveEnd = a.dur - (a.promo ? 0.7 : 0)
        if (t < moveEnd) face = Math.atan2(dx, dz)
        if (a.kind === 'walk' || a.kind === 'jump') {
          const e = ease(t / moveEnd)
          x = fx + dx * e
          z = fz + dz * e
          y = a.kind === 'jump' ? Math.sin(e * Math.PI) * 0.85 : Math.abs(Math.sin(e * Math.PI * Math.max(2, Math.round(len * 2)))) * 0.025
          lean = a.kind === 'jump' ? Math.sin(e * Math.PI * 2) * 0.15 : 0.06 * Math.sin(e * Math.PI)
          const p = clamp01(t / moveEnd)
          if (a.kind === 'jump') {
            squash = p < 0.15 ? -0.2 * bump(p / 0.15) : p > 0.8 ? -0.18 * bump((p - 0.8) / 0.2) : 0.16 * bump((p - 0.15) / 0.65)
            bend = 0.3 * bump(p) - 0.12 * bump(p / 0.15)
          } else {
            const ph = p * Math.PI * Math.max(2, Math.round(len * 2))
            const env = bump(p)
            bend = 0.22 * env - 0.1 * bump(t / 0.2)
            side = 0.09 * Math.sin(ph) * env
            squash = -0.07 * Math.abs(Math.cos(ph)) * env - 0.1 * bump(t / 0.2)
          }
        } else if (a.kind === 'cast') {
          const raise = clamp01(t / 0.3)
          const lower = clamp01((t - a.impact - 0.05) / 0.2)
          lean = -0.12 * raise * (1 - lower)
          glow = raise * (1 - lower)
          bend = -0.3 * raise * (1 - lower) + 0.45 * bump((t - a.impact + 0.08) / 0.28)
          squash = 0.16 * raise * (1 - lower) - 0.08 * bump((t - a.impact) / 0.25)
          side = 0.06 * Math.sin(t * 9) * raise * (1 - lower)
          if (a.queenFx && t > a.impact && t < a.impact + 0.3) y = Math.sin(((t - a.impact) / 0.3) * Math.PI) * 0.14
          const w = ease((t - a.impact - 0.1) / Math.max(0.1, moveEnd - a.impact - 0.1))
          x = fx + dx * w
          z = fz + dz * w
        } else {
          const approach = a.kind === 'heavy' ? 0.5 : 0.42
          const px = tx - (dx / len) * 0.62
          const pz = tz - (dz / len) * 0.62
          const e1 = ease(t / approach)
          x = fx + (px - fx) * e1
          z = fz + (pz - fz) * e1
          if (a.kind === 'charge') y = Math.sin(clamp01(t / approach) * Math.PI) * 0.45
          const wind = clamp01((t - approach) / (a.impact - approach))
          const strike = clamp01((t - a.impact + 0.06) / 0.12)
          const recover = clamp01((t - a.impact - 0.12) / 0.2)
          const amp = 1 + (a.variant - 0.5) * 0.4
          lean = (0.22 * strike - 0.1 * wind) * (1 - recover) * amp
          const heavy = a.kind === 'heavy' ? 1.25 : 1
          bend = (0.7 * strike - 0.45 * wind) * (1 - recover) * amp * heavy + 0.12 * bump(t / approach)
          squash = (0.14 * strike - 0.14 * wind) * (1 - recover) * heavy + (a.kind === 'charge' ? 0.12 * bump(t / approach) : 0)
          side = 0.07 * Math.sin(clamp01(t / approach) * Math.PI * 4) * (1 - wind) + (a.variant - 0.5) * 0.25 * strike * (1 - recover)
          const e2 = ease((t - a.impact - 0.15) / Math.max(0.1, moveEnd - a.impact - 0.15))
          x += (tx - px) * e2
          z += (tz - pz) * e2
        }
        if (a.promo && t > moveEnd) {
          const p = clamp01((t - moveEnd) / 0.7)
          y = Math.sin(p * Math.PI) * 0.3
          spin = ease(p) * Math.PI * 2
          glow = Math.sin(p * Math.PI)
          squash = 0.22 * bump(p) - 0.12 * bump((p - 0.8) / 0.2)
        }
      } else if (a.rook && a.rook.id === u.id) {
        const [rfx, rfz] = sqPos(a.rook.from)
        const [rtx, rtz] = sqPos(a.rook.to)
        const e = ease((t - 0.15) / (a.dur - 0.2))
        x = rfx + (rtx - rfx) * e
        z = rfz + (rtz - rfz) * e
        y = Math.abs(Math.sin(e * Math.PI * 3)) * 0.04
        moveDir = [rtx - rfx, rtz - rfz]
        if (t < a.dur - 0.05) face = Math.atan2(rtx - rfx, rtz - rfz)
      } else if (a.victimId === u.id) {
        moveDir = [dx, dz]
        face = Math.atan2(-dx, -dz)
        if (t < a.impact) {
          const brace = clamp01((t - a.impact + 0.35) / 0.25)
          lean = -0.06 * brace
          squash = -0.1 * brace
          side = 0.05 * Math.sin(n * 30) * brace
        } else {
          const k = clamp01((t - a.impact) / 0.35)
          bend = -0.65 * (1 - Math.pow(1 - k, 3))
          squash = -0.1 - 0.12 * k
          x += (dx / len) * 0.3 * k
          z += (dz / len) * 0.3 * k
          tilt = 0.85 * ease(k)
          y = Math.sin(k * Math.PI) * 0.12
          flash = 1 - k
          dissolve = clamp01((t - a.impact - 0.08) / 0.4)
        }
      }
    }

    const mate = mateRef.current
    if (mate && mate.loserKing === u.id) kneel = ease((n - mate.start - 0.4) / 0.8)

    const target = face ?? restYaw
    heading.current += wrapAngle(target - heading.current) * Math.min(1, delta * 9)

    g.position.set(x, y + (selected ? 0.16 + Math.sin(n * 4) * 0.03 : 0) - dissolve * 0.35, z)
    yg.rotation.y = heading.current + spin
    if (moveDir && (moveDir[0] || moveDir[1])) {
      LEAN_AXIS.set(moveDir[1], 0, -moveDir[0]).normalize()
      lg.quaternion.setFromAxisAngle(LEAN_AXIS, lean + tilt + kneel * 0.12)
    } else {
      lg.quaternion.setFromAxisAngle(LEAN_AXIS.set(u.color === 'w' ? -1 : 1, 0, 0), kneel * 0.22)
    }
    const breath = 1 + Math.sin(n * 1.6 + u.id * 1.7) * 0.006
    const shrink = 1 - dissolve * 0.85
    yg.scale.set(shrink * PIECE_SX, breath * shrink * (1 - kneel * 0.12) * PIECE_SY, shrink * PIECE_SX)

    if (selected) bend += 0.04 * Math.sin(n * 4)
    bend += kneel * 0.4
    mats.deform.uHeight.value = model.height
    mats.deform.uBend.value = Math.max(-0.8, Math.min(0.8, bend))
    mats.deform.uSide.value = side
    mats.deform.uSquash.value = Math.max(-0.3, Math.min(0.3, squash))

    mats.body.emissiveIntensity = BASE_EMISSIVE[u.color] + glow * 0.5 + flash * 1.2 + (selected ? 0.12 : 0)
    mats.body.color.copy(baseColor).multiplyScalar(1 - kneel * 0.55)
  })

  return (
    <group ref={root} position={[sx, 0, sz]}>
      <group ref={leanG}>
        <group ref={yawG} rotation={[0, restYaw, 0]} scale={[PIECE_SX, PIECE_SY, PIECE_SX]}>
          <mesh geometry={model.body} material={mats.body} castShadow={shadows} raycast={() => null} />
          <mesh geometry={model.trim} material={mats.trim} castShadow={shadows} raycast={() => null} />
          <mesh geometry={model.glow} material={mats.glow} raycast={() => null} />
        </group>
      </group>
      <mesh
        geometry={HIT}
        material={HIT_MAT}
        scale={[1.1, model.height * PIECE_SY, 1.1]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onPick(u.square)
        }}
      />
    </group>
  )
})

function Army(props: {
  units: UnitState[]
  animRef: RefObject<Anim | null>
  mateRef: RefObject<MateFx>
  selected: string | null
  set: PieceSet
  shadows: boolean
  lite: boolean
  onSquare: (sq: string) => void
}) {
  return (
    <>
      {props.units.map((u) => (
        <Unit
          key={u.id}
          u={u}
          animRef={props.animRef}
          mateRef={props.mateRef}
          selected={props.selected === u.square}
          set={props.set}
          shadows={props.shadows}
          lite={props.lite}
          onPick={props.onSquare}
        />
      ))}
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
  const shards = useRef<THREE.Group>(null)
  const shardMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.1 }), [])
  useEffect(() => () => shardMat.dispose(), [shardMat])
  const count = quality === 'low' ? 6 : 12
  const dirs = useMemo(() => Array.from({ length: count }, (_, i) => ({ a: (i / count) * Math.PI * 2 + (i % 3) * 0.3, up: 0.6 + ((i * 37) % 10) / 10, s: 0.6 + ((i * 53) % 10) / 14 })), [count])

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
        shards.current.position.set(tx, 0.55, tz)
        shards.current.children.forEach((c, i) => {
          const d = dirs[i]
          const r = it * 2.2 * d.s
          c.position.set(Math.cos(d.a) * r, it * (2.4 * d.up) - it * it * 9, Math.sin(d.a) * r)
          c.rotation.set(it * 9 * d.s, it * 7, 0)
          c.scale.setScalar(Math.max(0.001, 1 - it * 1.6))
        })
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
      <group ref={shards} visible={false}>
        {dirs.map((d, i) => (
          <mesh key={i} material={shardMat}>
            <tetrahedronGeometry args={[0.05 + (i % 3) * 0.02, 0]} />
          </mesh>
        ))}
      </group>
      <mesh ref={pillar} visible={false}>
        <cylinderGeometry args={[0.34, 0.42, 2.8, 24, 1, true]} />
        <meshBasicMaterial ref={pillarMat} color={theme.glow} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

function CameraRig({ cam, animRef }: { cam: RefObject<CamState>; animRef: RefObject<Anim | null> }) {
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
    const idle = Math.sin(clock.elapsedTime * 0.32) * 0.028
    const k = 1 - Math.pow(0.004, dt)
    const s = cur.current
    s.az += (c.az + (c.orbitX ?? 0) + idle - s.az) * (1 - Math.pow(0.04, dt))
    s.pol += (Math.max(0.35, Math.min(1.1, pol + tilt + (c.orbitY ?? 0))) - s.pol) * k
    s.rad += (rad * c.zoom * zoom - s.rad) * k
    look.current.lerp(focus.current, k)
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
function makeBoardTexture(theme: BoardTheme, px: number) {
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
  tex.anisotropy = 8
  return tex
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

/** Moldura em mármore negro: quatro réguas com filete de aço por dentro e por fora. */
function BoardFrame({ theme }: { theme: BoardTheme }) {
  const marble = useMemo(() => {
    const t = makeMarbleTexture({ base: theme.frame, mottle: mixHex(theme.frame, '#3a3a40', 0.7), vein: '#8f8e8b', veinAlpha: 0.38, seed: 771, size: 512, cracks: 3 })
    t.repeat.set(3, 0.4)
    return t
  }, [theme.frame])
  useEffect(() => () => marble.dispose(), [marble])
  const stone = useMemo(() => new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.6 }), [marble])
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: theme.trim, metalness: 1, roughness: 0.28, envMapIntensity: 1.3 }), [theme.trim])
  useEffect(() => () => {
    stone.dispose()
    metal.dispose()
  }, [stone, metal])
  const outer = 4 + FRAME_W
  const bars: [number, number, number, number][] = [
    [0, -(4 + FRAME_W / 2), outer * 2, FRAME_W],
    [0, 4 + FRAME_W / 2, outer * 2, FRAME_W],
    [-(4 + FRAME_W / 2), 0, FRAME_W, 8],
    [4 + FRAME_W / 2, 0, FRAME_W, 8],
  ]
  const rims = (half: number, y: number, w: number) =>
    ([
      [0, -half, half * 2 + w, w],
      [0, half, half * 2 + w, w],
      [-half, 0, w, half * 2 + w],
      [half, 0, w, half * 2 + w],
    ] as const).map(([x, z, sx, sz], i) => (
      <mesh key={`${half}-${i}`} position={[x, y, z]} material={metal}>
        <boxGeometry args={[sx, 0.03, sz]} />
      </mesh>
    ))
  return (
    <group>
      {bars.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, -SLAB_H / 2 + 0.005, z]} material={stone} receiveShadow>
          <boxGeometry args={[w, SLAB_H, d]} />
        </mesh>
      ))}
      <mesh position={[0, -SLAB_H / 2 - 0.02, 0]} material={stone}>
        <boxGeometry args={[8, SLAB_H - 0.04, 8]} />
      </mesh>
      {rims(4.02, 0.012, 0.05)}
      {rims(outer - 0.03, 0.012, 0.05)}
      {/* Rodapé de aço na base da laje. */}
      {rims(outer - 0.01, -SLAB_H + 0.03, 0.06)}
    </group>
  )
}

/** Espada de cerimônia cravada (lâmina em losango, guarda com pontas, punho escuro, pomo com ametista). */
function Sword({ position, rotation, scale = 1 }: { position: [number, number, number]; rotation: [number, number, number]; scale?: number }) {
  const parts = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({ color: '#d9d1c3', metalness: 1, roughness: 0.22, envMapIntensity: 1.4 })
    const brass = new THREE.MeshStandardMaterial({ color: '#bab09f', metalness: 1, roughness: 0.3, envMapIntensity: 1.2 })
    const grip = new THREE.MeshStandardMaterial({ color: '#1a1a1d', metalness: 0.3, roughness: 0.5 })
    const gem = new THREE.MeshStandardMaterial({ color: '#8a7cc8', metalness: 0.2, roughness: 0.1, emissive: new THREE.Color('#8a7cc8'), emissiveIntensity: 0.5 })
    return { steel, brass, grip, gem }
  }, [])
  useEffect(() => () => Object.values(parts).forEach((m) => m.dispose()), [parts])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* lâmina: losango que afina até a ponta (enterrada no chão) */}
      <mesh material={parts.steel} position={[0, 1.55, 0]} scale={[1, 1, 0.22]}>
        <cylinderGeometry args={[0.1, 0.012, 3.1, 4]} />
      </mesh>
      <mesh material={parts.brass} position={[0, 3.13, 0]}>
        <boxGeometry args={[0.9, 0.07, 0.1]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={parts.brass} position={[s * 0.5, 3.17, 0]} rotation={[0, 0, s * -0.6]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
        </mesh>
      ))}
      <mesh material={parts.brass} position={[0, 3.13, 0.06]}>
        <octahedronGeometry args={[0.07, 0]} />
      </mesh>
      <mesh material={parts.grip} position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.55, 10]} />
      </mesh>
      <mesh material={parts.brass} position={[0, 3.76, 0]}>
        <sphereGeometry args={[0.085, 16, 12]} />
      </mesh>
      <mesh material={parts.gem} position={[0, 3.86, 0]} scale={[0.8, 1.3, 0.8]}>
        <octahedronGeometry args={[0.055, 0]} />
      </mesh>
    </group>
  )
}

/** Chão: mármore negro que se dissolve no escuro (nenhum fundo chapado atrás do tabuleiro). */
function Floor() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')!
    drawMarble(ctx, { base: '#121214', mottle: '#1d1d21', vein: '#55555c', veinAlpha: 0.35, seed: 4242, size: 512, cracks: 4 })
    const g = ctx.createRadialGradient(256, 256, 60, 256, 256, 256)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={[0, -SLAB_H, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[16, 48]} />
      <meshStandardMaterial map={tex} transparent roughness={0.5} metalness={0} depthWrite={false} />
    </mesh>
  )
}

const MK_PLANE = new THREE.PlaneGeometry(0.94, 0.94)
const MK_EDGE = new THREE.RingGeometry(0.6, 0.66, 4, 1, Math.PI / 4)
const MK_DOT = new THREE.CircleGeometry(0.15, 28)
const MK_DOT_EDGE = new THREE.RingGeometry(0.15, 0.19, 28)
const MK_RING = new THREE.RingGeometry(0.36, 0.46, 40)

/** Marca plana sobre a casa (último lance, seleção, xeque, destinos). */
function FlatMark({ geo, sq, color, opacity, y, onSquare, blend }: { geo: THREE.BufferGeometry; sq: string; color: string; opacity: number; y: number; onSquare?: (sq: string) => void; blend?: boolean }) {
  const [x, z] = sqPos(sq)
  return (
    <mesh
      geometry={geo}
      position={[x, y, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={onSquare ? undefined : () => null}
      onClick={
        onSquare
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              onSquare(sq)
            }
          : undefined
      }
    >
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} blending={blend ? THREE.AdditiveBlending : THREE.NormalBlending} />
    </mesh>
  )
}

/** Xeque: casa do rei em rubi pulsando (perigo real). */
function CheckGlow({ square }: { square: string }) {
  const ref = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const p = (Math.sin(nowS() * 6) + 1) / 2
    if (ref.current) ref.current.opacity = 0.35 + p * 0.35
    if (light.current) light.current.intensity = 1.5 + p * 2.5
  })
  const [x, z] = sqPos(square)
  return (
    <>
      <mesh geometry={MK_PLANE} position={[x, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <meshBasicMaterial ref={ref} color="#a3121f" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#ff3b4a" distance={2.6} position={[x, 0.9, z]} />
    </>
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
  const tex = useMemo(() => makeBoardTexture(theme, quality === 'low' ? 1024 : 2048), [theme, quality])
  useEffect(() => () => tex.dispose(), [tex])
  const top = useMemo(
    () =>
      quality === 'low'
        ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0, envMapIntensity: 0.6 })
        : new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55 }),
    [tex, quality],
  )
  useEffect(() => () => top.dispose(), [top])
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
      <BoardFrame theme={theme} />
      {lastFrom && <FlatMark geo={MK_PLANE} sq={lastFrom} color={theme.trim} opacity={0.22} y={0.01} />}
      {lastTo && <FlatMark geo={MK_PLANE} sq={lastTo} color={theme.trim} opacity={0.34} y={0.01} />}
      {lastTo && <FlatMark geo={MK_EDGE} sq={lastTo} color="#ece5d8" opacity={0.7} y={0.012} />}
      {props.checkSq && <CheckGlow square={props.checkSq} />}
      {selected && <FlatMark geo={MK_PLANE} sq={selected} color="#8a7cc8" opacity={0.5} y={0.014} />}
      {selected && <FlatMark geo={MK_EDGE} sq={selected} color="#cbc5e8" opacity={0.95} y={0.016} />}
      {targets.map((sq) =>
        captureTargets.has(sq) ? (
          <group key={sq}>
            <FlatMark geo={MK_RING} sq={sq} color="#cbc5e8" opacity={0.95} y={0.02} onSquare={onSquare} />
            <FlatMark geo={MK_PLANE} sq={sq} color="#8a7cc8" opacity={0.28} y={0.018} />
          </group>
        ) : (
          <group key={sq}>
            <FlatMark geo={MK_DOT_EDGE} sq={sq} color="#0c0c0e" opacity={0.55} y={0.019} />
            <FlatMark geo={MK_DOT} sq={sq} color="#a99be0" opacity={0.95} y={0.02} onSquare={onSquare} />
          </group>
        ),
      )}
    </group>
  )
}

/** Reflexos de estúdio neutros (gradiente + três caixas de luz), pré-filtrados com PMREM. */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const x = c.getContext('2d')!
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

/** Luz de estúdio: chave quente-neutra do alto, contraluz ametista discreta e preenchimento frio. */
function StudioLights({ shadows, quality }: { shadows: boolean; quality: Quality }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const s = sun.current
    if (!s) return
    Object.assign(s.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 40 })
    s.shadow.camera.updateProjectionMatrix()
  }, [])
  return (
    <>
      <hemisphereLight args={['#f3f1ed', '#1a1a1f', 1.1]} />
      <directionalLight
        ref={sun}
        position={[5, 14, 8]}
        intensity={3.2}
        color="#fff6ea"
        castShadow={shadows}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 6, -9]} intensity={1.6} color="#b7b3c9" />
      <pointLight position={[0, 5, 9]} intensity={8} distance={22} decay={1.4} color="#eeedeb" />
    </>
  )
}

/** Memoizada: o relógio da partida redesenha a tela 10x por segundo; a cena só muda com lances, seleção e ajustes. */
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
}) {
  const { units, theme, set, quality, animRef, mateRef, cam, selected, onSquare } = props
  const shadows = quality !== 'low'
  return (
    <>
      <CameraRig cam={cam} animRef={animRef} />
      <StudioEnvironment />
      <StudioLights shadows={shadows} quality={quality} />
      <Floor />
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
      <Sword position={[-5.6, -SLAB_H, -4.6]} rotation={[0.22, 0.5, -0.3]} />
      <Sword position={[5.5, -SLAB_H, -5.2]} rotation={[0.3, -0.4, 0.26]} scale={1.08} />
      <Sword position={[-5.3, -SLAB_H, 3.2]} rotation={[-0.1, 0.9, -0.34]} scale={0.92} />
      <Sword position={[5.4, -SLAB_H, 2.4]} rotation={[-0.16, -0.7, 0.3]} scale={0.95} />
      <Suspense fallback={null}>
        <Army units={units} animRef={animRef} mateRef={mateRef} selected={selected} set={set} shadows={shadows} lite={quality === 'low'} onSquare={onSquare} />
      </Suspense>
      <Effects animRef={animRef} theme={theme} quality={quality} />
    </>
  )
})
