'use client'

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Color, PieceSymbol } from 'chess.js'
import { Suspense, memo, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { BoardTheme, PieceSet, Quality } from '@/lib/devo/arcade/chess-themes'
import { GRAPHITE_MARBLE, IVORY_MARBLE, makeMarbleTexture } from './marble'
import { BASE_EMISSIVE, SHADOW_GEO, getHaloMaterials, getShadowMaterial, loadGlbPieces, makeUnitMaterials, usePieceModel } from './pieces3d'

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

export type CamState = { az: number; pol: number; rad: number; zoom: number; spectator: boolean; dragDist: number }

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

/** Titan Chess pieces at their original size relative to 1-unit squares. */
export const PIECE_SCALE = 1
const LOOK_Y = 0.15
const LOOK_Z = 0.2
/** Only the playing squares are framed (not the frame/braziers), and the near corners may bleed off-screen slightly. */
const FAR_POINTS = [
  ...[-4, 4].map((x) => new THREE.Vector3(x, 0, -4)),
  ...[-3.5, 3.5].map((x) => new THREE.Vector3(x, 1.75 * PIECE_SCALE, -3.5)),
]
const NEAR_POINTS = [-4, 4].map((x) => new THREE.Vector3(x, 0, 4))
const fitCam = new THREE.PerspectiveCamera()
const fitNdc = new THREE.Vector3()

export const fovFor = (aspect: number) => (aspect < 1 ? 48 : 36)

/**
 * Fixed seat behind the player's side, Windows 7 Chess Titans style: a steady three-quarter view
 * where the near edge sits at the bottom of the frame and the far back rank stays fully visible.
 * The radius is solved numerically against the real viewport so the board fills it on any aspect.
 */
export function fitCamera(aspect: number) {
  const portrait = aspect < 1
  const pol = portrait ? 0.6 : 0.8
  fitCam.fov = fovFor(aspect)
  fitCam.aspect = aspect
  fitCam.near = 0.1
  fitCam.far = 100
  fitCam.updateProjectionMatrix()
  const top = portrait ? 0.74 : 0.8
  const fits = (rad: number) => {
    fitCam.position.set(0, LOOK_Y + Math.cos(pol) * rad, LOOK_Z + Math.sin(pol) * rad)
    fitCam.lookAt(0, LOOK_Y, LOOK_Z)
    fitCam.updateMatrixWorld()
    const farOk = FAR_POINTS.every((p) => {
      fitNdc.copy(p).project(fitCam)
      return Math.abs(fitNdc.x) <= 0.98 && fitNdc.y <= top
    })
    return (
      farOk &&
      NEAR_POINTS.every((p) => {
        fitNdc.copy(p).project(fitCam)
        return Math.abs(fitNdc.x) <= 1.1 && fitNdc.y >= -1.02
      })
    )
  }
  let lo = 4
  let hi = 40
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) hi = mid
    else lo = mid
  }
  return { pol, rad: hi }
}
const HIT = new THREE.CylinderGeometry(0.34, 0.34, 1, 10).translate(0, 0.5, 0)
const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
const LEAN_AXIS = new THREE.Vector3()
const PLANE = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)

type UnitProps = {
  u: UnitState
  animRef: RefObject<Anim | null>
  mateRef: RefObject<MateFx>
  selected: boolean
  set: PieceSet
  onPick: (sq: string) => void
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const bump = (t: number) => Math.sin(clamp01(t) * Math.PI)

const Unit = memo(function Unit({ u, animRef, mateRef, selected, set, onPick }: UnitProps) {
  const root = useRef<THREE.Group>(null)
  const leanG = useRef<THREE.Group>(null)
  const yawG = useRef<THREE.Group>(null)
  const halos = useRef<THREE.Group>(null)
  const restYaw = u.color === 'w' ? Math.PI : 0
  const heading = useRef(restYaw)
  const [sx, sz] = sqPos(u.square)
  const model = usePieceModel(u.type, set.id)
  const mats = useMemo(() => makeUnitMaterials(u.color, set), [u.color, set])
  const baseColors = useMemo(() => ({ body: mats.body.color.clone(), glow: mats.glow.color.clone() }), [mats])
  const haloMat = getHaloMaterials(set)[u.color]
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
          y = a.kind === 'jump' ? Math.sin(e * Math.PI) * 0.85 : Math.abs(Math.sin(e * Math.PI * Math.max(2, Math.round(len * 2)))) * 0.06
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

    g.position.set(x, y + (selected ? 0.1 + Math.sin(n * 5) * 0.025 : 0) - dissolve * 0.35, z)
    yg.rotation.y = heading.current + spin
    if (moveDir && (moveDir[0] || moveDir[1])) {
      LEAN_AXIS.set(moveDir[1], 0, -moveDir[0]).normalize()
      lg.quaternion.setFromAxisAngle(LEAN_AXIS, lean + tilt + kneel * 0.12)
    } else {
      lg.quaternion.setFromAxisAngle(LEAN_AXIS.set(u.color === 'w' ? -1 : 1, 0, 0), kneel * 0.22)
    }
    const breath = 1 + Math.sin(n * 2.1 + u.id * 1.7) * 0.012
    const shrink = (1 - dissolve * 0.85) * PIECE_SCALE
    yg.scale.set(shrink, breath * shrink * (1 - kneel * 0.12), shrink)

    if (selected) bend += 0.05 * Math.sin(n * 4)
    bend += kneel * 0.4
    mats.deform.uHeight.value = model.height
    mats.deform.uBend.value = Math.max(-0.8, Math.min(0.8, bend))
    mats.deform.uSide.value = side
    mats.deform.uSquash.value = Math.max(-0.3, Math.min(0.3, squash))

    const pulse = 1 + Math.sin(n * 3 + u.id) * 0.12
    mats.body.emissiveIntensity = BASE_EMISSIVE[u.color] + glow * 0.6 + flash * 1.5
    mats.body.color.copy(baseColors.body).multiplyScalar(1 - kneel * 0.55)
    mats.glow.color.copy(baseColors.glow)
    if (halos.current) {
      halos.current.visible = dissolve < 0.3 && kneel < 0.9
      const hs = pulse + glow * 0.8 + (selected ? 0.3 : 0)
      halos.current.children.forEach((c, i) => {
        const s = model.halos[i][3] * hs
        c.scale.set(s, s, 1)
      })
    }
  })

  return (
    <group ref={root} position={[sx, 0, sz]}>
      <group ref={leanG}>
        <group ref={yawG} rotation={[0, restYaw, 0]}>
          <mesh geometry={model.body} material={mats.body} castShadow raycast={() => null} />
          <mesh geometry={model.trim} material={mats.trim} castShadow raycast={() => null} />
          <mesh geometry={model.glow} material={mats.glow} raycast={() => null} />
          <group ref={halos}>
            {model.halos.map(([hx, hy, hz, s], i) => (
              <sprite key={i} material={haloMat} position={[hx, hy, hz]} scale={[s, s, 1]} raycast={() => null} />
            ))}
          </group>
        </group>
      </group>
      <mesh
        geometry={HIT}
        material={HIT_MAT}
        scale={[1.15, model.height * PIECE_SCALE, 1.15]}
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
          onPick={props.onSquare}
        />
      ))}
    </>
  )
}

function Effects({ animRef, theme, quality }: { animRef: RefObject<Anim | null>; theme: BoardTheme; quality: Quality }) {
  const bolt = useRef<THREE.Mesh>(null)
  const boltMat = useRef<THREE.MeshBasicMaterial>(null)
  const flash = useRef<THREE.Mesh>(null)
  const flashMat = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const pillar = useRef<THREE.Mesh>(null)
  const pillarMat = useRef<THREE.MeshBasicMaterial>(null)
  const sparks = useRef<THREE.Group>(null)
  const sparkCount = quality === 'low' ? 4 : 8
  const dirs = useMemo(() => Array.from({ length: sparkCount }, (_, i) => (i / sparkCount) * Math.PI * 2), [sparkCount])

  useFrame(() => {
    const a = animRef.current
    const t = a ? nowS() - a.start : 99
    const all = [bolt, flash, ring, pillar]
    if (!a || t > a.dur + 0.4) {
      for (const m of all) if (m.current) m.current.visible = false
      if (sparks.current) sparks.current.visible = false
      return
    }
    const [fx, fz] = sqPos(a.from)
    const [tx, tz] = sqPos(a.victimSq ?? a.to)
    const color = a.side === 'w' ? '#9fe0ff' : '#ff6a7a'

    if (bolt.current && boltMat.current) {
      const on = a.kind === 'cast' && t > 0.28 && t < a.impact
      bolt.current.visible = on
      if (on) {
        const p = clamp01((t - 0.28) / (a.impact - 0.28))
        bolt.current.position.set(fx + (tx - fx) * p, 0.95 - p * 0.45 + Math.sin(p * Math.PI) * 0.5, fz + (tz - fz) * p)
        bolt.current.scale.setScalar(a.queenFx ? 1.6 : 1)
        bolt.current.rotation.y += 0.3
        boltMat.current.color.set(color)
      }
    }
    const it = t - a.impact
    const hit = !!a.victimSq && it > 0 && it < 0.45
    if (flash.current && flashMat.current) {
      flash.current.visible = hit
      if (hit) {
        flash.current.position.set(tx, 0.45, tz)
        flash.current.scale.setScalar((0.2 + it * 2.2) * (a.queenFx ? 1.5 : 1))
        flashMat.current.opacity = Math.max(0, 0.9 - it * 2.2)
        flashMat.current.color.set(a.kind === 'cast' ? color : '#fff2c8')
      }
    }
    if (ring.current && ringMat.current) {
      ring.current.visible = hit
      if (hit) {
        ring.current.position.set(tx, 0.09, tz)
        ring.current.scale.setScalar(0.4 + it * (a.kind === 'heavy' ? 4 : 2.6))
        ringMat.current.opacity = Math.max(0, 0.8 - it * 1.9)
        ringMat.current.color.set(a.kind === 'heavy' ? '#e0d2b4' : color)
      }
    }
    if (sparks.current) {
      sparks.current.visible = hit && a.kind !== 'cast'
      if (hit) {
        sparks.current.position.set(tx, 0.4, tz)
        sparks.current.children.forEach((c, i) => {
          const d = dirs[i]
          const r = it * 2.4
          c.position.set(Math.cos(d) * r, it * (1 - it * 3), Math.sin(d) * r)
          c.scale.setScalar(Math.max(0.001, 1 - it * 2.2))
        })
      }
    }
    if (pillar.current && pillarMat.current) {
      const pt = t - (a.dur - 0.75)
      const on = !!a.promo && pt > 0
      pillar.current.visible = on
      if (on) {
        const [px, pz] = sqPos(a.to)
        pillar.current.position.set(px, 1.2, pz)
        pillar.current.scale.set(1, Math.max(0.01, Math.min(1, pt * 3)), 1)
        pillarMat.current.opacity = 0.55 * Math.sin(clamp01(pt / 1.1) * Math.PI)
      }
    }
  })

  return (
    <>
      <mesh ref={bolt} visible={false}>
        <icosahedronGeometry args={[0.09, 1]} />
        <meshBasicMaterial ref={boltMat} toneMapped={false} />
      </mesh>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.35, 14, 10]} />
        <meshBasicMaterial ref={flashMat} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial ref={ringMat} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={sparks} visible={false}>
        {dirs.map((d) => (
          <mesh key={d}>
            <boxGeometry args={[0.035, 0.035, 0.035]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh ref={pillar} visible={false}>
        <cylinderGeometry args={[0.32, 0.4, 2.4, 20, 1, true]} />
        <meshBasicMaterial ref={pillarMat} color={theme.glow} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

function CheckRing({ square }: { square: string | null }) {
  const ref = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    m.visible = !!square
    if (light.current) light.current.visible = !!square
    if (!square) return
    const [x, z] = sqPos(square)
    const p = (Math.sin(nowS() * 6) + 1) / 2
    m.position.set(x, 0.1, z)
    m.scale.setScalar(1 + p * 0.25)
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.45 + p * 0.45
    if (light.current) {
      light.current.position.set(x, 0.8, z)
      light.current.intensity = 1.5 + p * 2
    }
  })
  return (
    <>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.38, 0.48, 32]} />
        <meshBasicMaterial color="#ff3b3b" transparent toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#ff3b3b" distance={2.5} visible={false} />
    </>
  )
}

function CameraRig({ cam, animRef }: { cam: RefObject<CamState>; animRef: RefObject<Anim | null> }) {
  const look = useRef(new THREE.Vector3(0, 0, 0.3))
  const focus = useRef(new THREE.Vector3())
  const cur = useRef<{ az: number; pol: number; rad: number } | null>(null)
  const fit = useRef({ aspect: 0, pol: 0.8, rad: 13 })
  useFrame(({ camera }, dt) => {
    const c = cam.current
    if (!c) return
    const pc = camera as THREE.PerspectiveCamera
    if (Math.abs(fit.current.aspect - pc.aspect) > 0.001) {
      fit.current = { aspect: pc.aspect, ...fitCamera(pc.aspect) }
      const wantFov = fovFor(pc.aspect)
      if (pc.fov !== wantFov) {
        pc.fov = wantFov
        pc.updateProjectionMatrix()
      }
    }
    const { pol, rad } = fit.current
    if (!cur.current) cur.current = { az: c.az, pol, rad }
    const a = animRef.current
    const t = a ? nowS() - a.start : 99
    const facing = Math.cos(c.az) >= 0 ? 1 : -1
    const baseZ = LOOK_Z * facing
    focus.current.set(0, LOOK_Y, baseZ)
    let zoom = 1
    let tilt = 0
    let shake = 0
    const special = a && (a.victimSq || a.promo || a.queenFx)
    const hold = a ? a.dur + 0.45 : 0
    if (a && t < hold) {
      const moveEnd = a.dur - (a.promo ? 0.7 : 0)
      const [fx, fz] = sqPos(a.from)
      const [tx, tz] = sqPos(a.to)
      const e = a.kind === 'cast' ? 0.45 + 0.55 * ease(t / moveEnd) : ease(t / moveEnd)
      const px = fx + (tx - fx) * e
      const pz = fz + (tz - fz) * e
      const w = ease(Math.min(t / 0.3, (hold - t) / 0.5, 1))
      focus.current.set(px * w, LOOK_Y + 0.55 * PIECE_SCALE * w, baseZ + (pz - baseZ) * w)
      zoom = 1 - (a.queenFx ? 0.68 : special ? 0.64 : 0.6) * w
      tilt = 0.2 * w
      const it = t - a.impact
      if (it > 0 && it < 0.22) shake = (1 - it / 0.22) * (a.queenFx ? 0.06 : 0.03)
    }
    const k = 1 - Math.pow(0.003, dt)
    const s = cur.current
    s.az += (c.az - s.az) * (1 - Math.pow(0.05, dt))
    s.pol += (Math.min(1.15, pol + tilt) - s.pol) * k
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

const CORNERS: [number, number][] = [
  [-5.05, -5.05],
  [5.05, -5.05],
  [-5.05, 5.05],
  [5.05, 5.05],
]

function makeFlameTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 96, 2, 32, 80, 60)
  g.addColorStop(0, 'rgba(255,250,220,1)')
  g.addColorStop(0.25, 'rgba(255,200,90,0.95)')
  g.addColorStop(0.55, 'rgba(255,110,30,0.6)')
  g.addColorStop(1, 'rgba(255,60,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(32, 2)
  ctx.bezierCurveTo(58, 50, 62, 90, 32, 126)
  ctx.bezierCurveTo(2, 90, 6, 50, 32, 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Braziers({ theme, quality }: { theme: BoardTheme; quality: Quality }) {
  const flames = useRef<(THREE.Mesh | null)[]>([])
  const lights = useRef<(THREE.PointLight | null)[]>([])
  const flameMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: makeFlameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    [],
  )
  useEffect(() => () => flameMat.dispose(), [flameMat])
  useFrame(({ camera }) => {
    const n = nowS()
    flames.current.forEach((f, i) => {
      if (!f) return
      const [x, z] = CORNERS[i]
      f.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z)
      const fl = 1 + Math.sin(n * 11 + i * 2) * 0.08 + Math.sin(n * 17 + i) * 0.05
      f.scale.set(0.55 * (2 - fl), 0.95 * fl, 1)
    })
    lights.current.forEach((l, i) => {
      if (l) l.intensity = 5 + Math.sin(n * 13 + i * 3) * 1.2
    })
  })
  return (
    <>
      {CORNERS.map(([x, z], i) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.62, 1.3, 0.62]} />
            <meshStandardMaterial color={theme.frame} roughness={0.55} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.84, 0]}>
            <cylinderGeometry args={[0.36, 0.2, 0.22, 14]} />
            <meshStandardMaterial color={theme.trim} metalness={0.85} roughness={0.28} />
          </mesh>
          <mesh
            ref={(m) => {
              flames.current[i] = m
            }}
            geometry={PLANE}
            material={flameMat}
            position={[0, 0.88, 0]}
          />
          {quality !== 'low' && (i < 2 || quality === 'high') && (
            <pointLight
              ref={(l) => {
                lights.current[i] = l
              }}
              position={[0, 1.4, 0]}
              color="#ff9a4a"
              distance={7}
              decay={1.6}
            />
          )}
        </group>
      ))}
    </>
  )
}

function Arena(props: {
  theme: BoardTheme
  quality: Quality
  lastFrom: string | null
  lastTo: string | null
  selected: string | null
  selColor: Color
  targets: string[]
  captureTargets: Set<string>
  checkSq: string | null
  onSquare: (sq: string) => void
}) {
  const { theme, lastFrom, lastTo, selected, targets, captureTargets, onSquare } = props
  const click = (sq: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSquare(sq)
  }
  const squares = useMemo(() => {
    const out: { sq: string; light: boolean }[] = []
    for (let i = 0; i < 64; i++) out.push({ sq: `${String.fromCharCode(97 + (i & 7))}${(i >> 3) + 1}`, light: ((i >> 3) + (i & 7)) % 2 === 1 })
    return out
  }, [])
  return (
    <group>
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[10, 10, 0.3, 72]} />
        <meshStandardMaterial color={theme.table} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshStandardMaterial color={theme.frame} roughness={0.5} metalness={0.1} />
      </mesh>
      {([[0, 4.25, 9, 0.5], [0, -4.25, 9, 0.5], [4.25, 0, 0.5, 8], [-4.25, 0, 0.5, 8]] as const).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, -0.08, z]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.24, d]} />
          <meshStandardMaterial color={theme.frame} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
      {squares.map(({ sq, light }) => {
        const [x, z] = sqPos(sq)
        return (
          <mesh key={sq} geometry={SQ_GEO} position={[x, -0.1, z]} receiveShadow onClick={click(sq)}>
            <meshStandardMaterial color={light ? theme.light : theme.dark} roughness={0.4} metalness={0.05} envMapIntensity={0.5} />
          </mesh>
        )
      })}
      {lastFrom && <FlatMark geo={MK_PLANE} sq={lastFrom} color="#d9a441" opacity={0.3} y={0.012} />}
      {lastTo && <FlatMark geo={MK_PLANE} sq={lastTo} color="#d9a441" opacity={0.42} y={0.012} />}
      {props.checkSq && <FlatMark geo={MK_PLANE} sq={props.checkSq} color="#ff3b3b" opacity={0.55} y={0.014} />}
      {selected && <FlatMark geo={MK_PLANE} sq={selected} color="#4aa8ff" opacity={0.5} y={0.016} />}
      {targets.map((sq) =>
        captureTargets.has(sq) ? (
          <FlatMark key={sq} geo={MK_RING} sq={sq} color="#ff5a5f" opacity={0.85} y={0.02} onSquare={onSquare} />
        ) : (
          <FlatMark key={sq} geo={MK_DOT} sq={sq} color="#3ddc97" opacity={0.8} y={0.02} onSquare={onSquare} />
        ),
      )}
    </group>
  )
}

const SQ_GEO = new THREE.BoxGeometry(1, 0.2, 1)
const MK_PLANE = new THREE.PlaneGeometry(0.96, 0.96)
const MK_DOT = new THREE.CircleGeometry(0.16, 28)
const MK_RING = new THREE.RingGeometry(0.34, 0.46, 36)

/** Flat square markers exactly like Titan Chess (last move, check, selection, legal targets). */
function FlatMark({ geo, sq, color, opacity, y, onSquare }: { geo: THREE.BufferGeometry; sq: string; color: string; opacity: number; y: number; onSquare?: (sq: string) => void }) {
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
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/** Studio reflections from Titan Chess: a vertical gradient with three soft-box highlights, prefiltered with PMREM. */
function TitanEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const x = c.getContext('2d')!
    const g = x.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#d5ddee')
    g.addColorStop(0.5, '#6b7385')
    g.addColorStop(1, '#1a1c22')
    x.fillStyle = g
    x.fillRect(0, 0, 512, 256)
    x.fillStyle = '#fff'
    x.globalAlpha = 0.9
    for (const [a, b, w, h] of [[60, 50, 90, 34], [300, 40, 120, 30], [430, 70, 50, 50]]) x.fillRect(a, b, w, h)
    const t = new THREE.CanvasTexture(c)
    t.mapping = THREE.EquirectangularReflectionMapping
    t.colorSpace = THREE.SRGBColorSpace
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromEquirectangular(t).texture
    pm.dispose()
    t.dispose()
    const prevEnv = scene.environment
    const prevExposure = gl.toneMapping
    const prevValue = gl.toneMappingExposure
    scene.environment = env
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.15
    return () => {
      scene.environment = prevEnv
      gl.toneMapping = prevExposure
      gl.toneMappingExposure = prevValue
      env.dispose()
    }
  }, [gl, scene])
  return null
}

/** Legacy (pre-r155) three.js light units used by the HTML, converted to physical units. */
const LEGACY = Math.PI

function TitanLights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const s = sun.current
    if (!s) return
    Object.assign(s.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 35 })
    s.shadow.camera.updateProjectionMatrix()
  }, [])
  return (
    <>
      <hemisphereLight args={['#fff4e0', '#2a2d3a', 0.4 * LEGACY]} />
      <directionalLight
        ref={sun}
        position={[6, 13, 7]}
        intensity={1.15 * LEGACY}
        color="#ffe9c8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-9, 6, -9]} intensity={0.7 * LEGACY} distance={40} decay={1} color="#c2b9ec" />
    </>
  )
}

/** Marble texture spec derived from a theme square colour, keeping the stone's mottling and veins. */
function marbleFrom(hex: string, ref: typeof IVORY_MARBLE): typeof IVORY_MARBLE {
  const base = new THREE.Color(hex)
  const lum = base.getHSL({ h: 0, s: 0, l: 0 }).l
  const bright = lum > 0.35
  const mottle = base.clone().offsetHSL(0, -0.04, bright ? -0.07 : 0.06)
  const vein = base.clone().offsetHSL(0, -0.08, bright ? -0.28 : 0.3)
  return { base: `#${base.getHexString()}`, mottle: `#${mottle.getHexString()}`, vein: `#${vein.getHexString()}`, veinAlpha: ref.veinAlpha }
}

const TILE = (() => {
  const s = 0.465
  const shape = new THREE.Shape()
  shape.moveTo(-s, -s)
  shape.lineTo(s, -s)
  shape.lineTo(s, s)
  shape.lineTo(-s, s)
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 2 })
  g.rotateX(-Math.PI / 2)
  return g
})()
const MARK_EDGE = new THREE.RingGeometry(0.575, 0.63, 4, 1, Math.PI / 4)
const MARK_INNER = new THREE.RingGeometry(0.5, 0.52, 4, 1, Math.PI / 4)
const MARK_FILL = new THREE.PlaneGeometry(0.88, 0.88)
const MARK_RUNE = new THREE.RingGeometry(0.1, 0.13, 4, 1, 0)

function SquareMarks(props: {
  squares: string[]
  color: string
  fill: number
  edge: number
  pulse: boolean
  rune?: boolean
  double?: boolean
  onSquare?: (sq: string) => void
}) {
  const { squares, color, fill, edge, pulse, rune, double, onSquare } = props
  const mats = useMemo(() => {
    const mk = (o: number) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    return { edge: mk(edge), fill: mk(fill) }
  }, [color, edge, fill])
  useEffect(() => () => { mats.edge.dispose(); mats.fill.dispose() }, [mats])
  useFrame(() => {
    if (!pulse) return
    const p = 0.75 + Math.sin(nowS() * 4) * 0.25
    mats.edge.opacity = edge * p
    mats.fill.opacity = fill * (0.6 + p * 0.4)
  })
  return (
    <>
      {squares.map((sq) => {
        const [x, z] = sqPos(sq)
        return (
          <group
            key={sq}
            position={[x, 0.016, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={
              onSquare
                ? (e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation()
                    onSquare(sq)
                  }
                : undefined
            }
          >
            <mesh geometry={MARK_FILL} material={mats.fill} />
            <mesh geometry={MARK_EDGE} material={mats.edge} raycast={() => null} />
            {double && <mesh geometry={MARK_INNER} material={mats.edge} raycast={() => null} />}
            {rune && <mesh geometry={MARK_RUNE} material={mats.edge} raycast={() => null} />}
          </group>
        )
      })}
    </>
  )
}

export function LivingScene(props: {
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
  useEffect(() => loadGlbPieces(), [])
  return (
    <>
      <CameraRig cam={cam} animRef={animRef} />
      <TitanEnvironment />
      <TitanLights />
      <Arena
        checkSq={props.checkSq}
        theme={theme}
        quality={quality}
        lastFrom={props.lastFrom}
        lastTo={props.lastTo}
        selected={selected}
        selColor={units.find((u) => u.square === selected)?.color ?? 'w'}
        targets={props.targets}
        captureTargets={props.captureTargets}
        onSquare={onSquare}
      />
      <Suspense fallback={null}>
        <Army units={units} animRef={animRef} mateRef={mateRef} selected={selected} set={set} onSquare={onSquare} />
      </Suspense>
      <Effects animRef={animRef} theme={theme} quality={quality} />
    </>
  )
}
