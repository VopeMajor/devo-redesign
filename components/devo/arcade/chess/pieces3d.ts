import type { Color, PieceSymbol } from 'chess.js'
import type { PieceSet } from '@/lib/devo/arcade/chess-themes'
import { useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getTitanModel } from './titan-pieces'

type V3 = [number, number, number]
type Halo = [x: number, y: number, z: number, size: number]
type Parts = { body: THREE.BufferGeometry[]; trim: THREE.BufferGeometry[]; glow: THREE.BufferGeometry[]; halos: Halo[] }

export type PieceModel = {
  body: THREE.BufferGeometry
  trim: THREE.BufferGeometry
  glow: THREE.BufferGeometry
  halos: Halo[]
  height: number
}

const UP = new THREE.Vector3(0, 1, 0)
const TAU = Math.PI * 2

function flat(g: THREE.BufferGeometry) {
  if (!g.index) return g
  const out = g.toNonIndexed()
  g.dispose()
  return out
}

function put(g: THREE.BufferGeometry, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: number | V3 = 1) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...p),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),
    typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s),
  )
  return flat(g.applyMatrix4(m))
}

function orient(g: THREE.BufferGeometry, at: V3, dir: THREE.Vector3) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
  return flat(g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at), q, new THREE.Vector3(1, 1, 1))))
}

function spike(len: number, rad: number, at: V3, dir: V3, seg = 8) {
  return orient(new THREE.ConeGeometry(rad, len, seg).translate(0, len / 2, 0), at, new THREE.Vector3(...dir))
}

function rod(a: V3, b: V3, r: number, seg = 10) {
  const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a))
  const len = d.length()
  return orient(new THREE.CylinderGeometry(r * 0.85, r, len, seg).translate(0, len / 2, 0), a, d)
}

function lathe(pts: [number, number][], smooth = true, seg = 48) {
  const v = pts.map(([x, y]) => new THREE.Vector2(x, y))
  const profile = smooth ? new THREE.SplineCurve(v).getPoints(pts.length * 8) : v
  return flat(new THREE.LatheGeometry(profile, seg))
}

function ring(n: number, offset: number, fn: (sin: number, cos: number, a: number) => THREE.BufferGeometry) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + offset
    return fn(Math.sin(a), Math.cos(a), a)
  })
}

function base(p: Parts) {
  p.trim.push(
    lathe([[0, 0], [0.41, 0], [0.425, 0.022], [0.405, 0.048], [0.365, 0.058], [0.365, 0.092], [0.335, 0.1], [0, 0.1]], false),
  )
  p.body.push(lathe([[0.335, 0.1], [0.345, 0.125], [0.31, 0.15], [0.315, 0.175], [0.27, 0.2], [0, 0.2]], false))
  p.glow.push(put(new THREE.TorusGeometry(0.367, 0.011, 6, 64), [0, 0.075, 0], [Math.PI / 2, 0, 0]))
  p.body.push(...ring(10, Math.PI / 10, (s, c) => spike(0.11, 0.032, [0.29 * s, 0.15, 0.29 * c], [s * 0.9, 1, c * 0.9], 6)))
}

function hood(p: Parts, y: number, r: number, tip: number, back = -0.35) {
  p.trim.push(put(new THREE.SphereGeometry(r * 0.86, 24, 16), [0, y, 0]))
  p.body.push(put(new THREE.SphereGeometry(r, 36, 20, Math.PI / 2 + 0.9, TAU - 1.8), [0, y, 0]))
  p.body.push(spike(tip, r * 0.74, [0, y + r * 0.5, -r * 0.12], [0, 1, back], 18))
  for (const s of [-1, 1]) {
    p.glow.push(put(new THREE.SphereGeometry(r * 0.17, 12, 8), [s * r * 0.33, y + r * 0.12, r * 0.79], [0, 0, s * 0.45], [1.5, 0.75, 0.6]))
  }
  p.glow.push(put(new THREE.BoxGeometry(r * 0.56, r * 0.07, r * 0.1), [0, y - r * 0.3, r * 0.78]))
  p.halos.push([0, y, r * 0.95, r * 3.2])
}

function face(p: Parts, y: number, r: number) {
  p.trim.push(put(new THREE.SphereGeometry(r, 24, 16), [0, y, 0]))
  for (const s of [-1, 1]) {
    p.glow.push(put(new THREE.SphereGeometry(r * 0.2, 12, 8), [s * r * 0.36, y + r * 0.1, r * 0.9], [0, 0, s * 0.45], [1.5, 0.7, 0.6]))
  }
  p.halos.push([0, y, r * 1.05, r * 3.6])
}

function gem(p: Parts, at: V3, r: number) {
  p.glow.push(put(new THREE.OctahedronGeometry(r, 0), at, [0, 0, 0], [0.8, 1.3, 0.6]))
}

function pawn(p: Parts) {
  p.body.push(lathe([[0.27, 0.19], [0.25, 0.28], [0.2, 0.42], [0.15, 0.55], [0.12, 0.62], [0, 0.64]]))
  p.trim.push(put(new THREE.TorusGeometry(0.13, 0.018, 8, 40), [0, 0.585, 0], [Math.PI / 2, 0, 0]))
  p.body.push(...ring(6, 0.3, (s, c) => spike(0.1, 0.03, [0.11 * s, 0.6, 0.11 * c], [s, 0.9, c], 6)))
  for (const s of [-1, 1]) p.trim.push(spike(0.12, 0.022, [s * 0.17, 0.46, 0.04], [s, -0.2, 0.7], 6))
  gem(p, [0, 0.33, 0.232], 0.035)
  hood(p, 0.76, 0.15, 0.25)
  return 1.1
}

function rook(p: Parts) {
  p.body.push(
    lathe(
      [[0.31, 0.19], [0.3, 0.23], [0.25, 0.32], [0.22, 0.75], [0.24, 0.82], [0.31, 0.88], [0.31, 1.0], [0.25, 1.0], [0.25, 0.94], [0, 0.94]],
      false,
    ),
  )
  p.trim.push(put(new THREE.TorusGeometry(0.248, 0.016, 8, 48), [0, 0.32, 0], [Math.PI / 2, 0, 0]))
  p.trim.push(put(new THREE.TorusGeometry(0.236, 0.016, 8, 48), [0, 0.81, 0], [Math.PI / 2, 0, 0]))
  p.body.push(...ring(6, 0, (s, c, a) => put(new THREE.BoxGeometry(0.1, 0.12, 0.07), [0.28 * s, 1.06, 0.28 * c], [0, a, 0])))
  p.trim.push(...ring(6, Math.PI / 6, (s, c) => spike(0.12, 0.028, [0.3 * s, 0.9, 0.3 * c], [s, 0.4, c], 6)))
  p.glow.push(...ring(4, Math.PI / 4, (s, c, a) => put(new THREE.BoxGeometry(0.05, 0.17, 0.03), [0.232 * s, 0.56, 0.232 * c], [0, a, 0])))
  p.glow.push(put(new THREE.BoxGeometry(0.09, 0.13, 0.03), [0, 0.4, 0.243], [-0.07, 0, 0]))
  p.glow.push(put(new THREE.CircleGeometry(0.245, 32), [0, 0.945, 0], [-Math.PI / 2, 0, 0]))
  p.glow.push(spike(0.16, 0.09, [0, 0.94, 0], [0, 1, 0], 10))
  p.halos.push([0, 1.02, 0, 0.75], [0, 0.4, 0.26, 0.3])
  return 1.12
}

function knight(p: Parts) {
  p.body.push(lathe([[0.26, 0.19], [0.21, 0.26], [0.17, 0.33], [0, 0.36]]))
  const outline = [
    [-0.17, 0.33], [-0.2, 0.58], [-0.16, 0.84], [-0.08, 1.0], [-0.04, 1.11], [0.02, 0.99], [0.12, 0.95],
    [0.27, 0.83], [0.33, 0.74], [0.3, 0.68], [0.18, 0.68], [0.08, 0.72], [0.06, 0.6], [0.14, 0.45], [0.17, 0.33],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const shape = new THREE.Shape()
  shape.moveTo(outline[0].x, outline[0].y)
  shape.splineThru(outline.slice(1))
  shape.closePath()
  const head = new THREE.ExtrudeGeometry(shape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 8,
    curveSegments: 64,
  })
  p.body.push(flat(head.translate(0, 0, -0.085).rotateY(-Math.PI / 2)))
  p.body.push(put(new THREE.SphereGeometry(0.17, 28, 18), [0, 0.5, 0.02], [0, 0, 0], [1, 1.35, 1.05]))
  p.body.push(put(new THREE.SphereGeometry(0.11, 24, 16), [0, 0.86, 0.06], [0.5, 0, 0], [0.95, 0.9, 1.25]))
  p.body.push(put(new THREE.CylinderGeometry(0.07, 0.095, 0.24, 20), [0, 0.76, 0.2], [1.25, 0, 0]))
  const mane: [number, number][] = [[-0.19, 0.42], [-0.21, 0.54], [-0.21, 0.66], [-0.19, 0.78], [-0.15, 0.89], [-0.1, 0.98]]
  mane.forEach(([z, y], i) => p.trim.push(spike(0.15 - i * 0.012, 0.045, [0, y, z], [0, 0.55 + i * 0.12, -1], 6)))
  for (const s of [-1, 1]) {
    p.trim.push(spike(0.24, 0.032, [s * 0.05, 1.0, -0.05], [s * 0.25, 1, -0.95], 8))
    p.glow.push(put(new THREE.SphereGeometry(0.03, 12, 8), [s * 0.112, 0.87, 0.1], [0, 0, 0], [0.6, 0.8, 1.6]))
    p.glow.push(put(new THREE.SphereGeometry(0.018, 8, 6), [s * 0.05, 0.755, 0.335]))
  }
  p.halos.push([0, 0.87, 0.12, 0.5], [0, 0.75, 0.36, 0.25])
  const turn = 0.85
  for (const list of [p.body, p.trim, p.glow]) for (const g of list) g.rotateY(turn)
  p.halos = p.halos.map(([x, y, z, s]) => [x * Math.cos(turn) + z * Math.sin(turn), y, -x * Math.sin(turn) + z * Math.cos(turn), s])
  return 1.14
}

function bishop(p: Parts) {
  p.body.push(lathe([[0.29, 0.19], [0.27, 0.3], [0.22, 0.5], [0.17, 0.72], [0.15, 0.86], [0, 0.9]]))
  p.trim.push(put(new THREE.TorusGeometry(0.235, 0.016, 8, 48), [0, 0.44, 0], [Math.PI / 2, 0, 0]))
  p.trim.push(put(new THREE.TorusGeometry(0.135, 0.02, 8, 40), [0, 0.9, 0], [Math.PI / 2, 0, 0]))
  for (const s of [-1, 1]) {
    p.body.push(spike(0.18, 0.04, [s * 0.13, 0.84, -0.02], [s, 0.8, -0.25], 8))
    p.trim.push(spike(0.14, 0.03, [s * 0.08, 0.86, -0.1], [s * 0.4, 1, -0.6], 6))
  }
  gem(p, [0, 0.66, 0.188], 0.045)
  p.halos.push([0, 0.66, 0.2, 0.3])
  hood(p, 1.01, 0.155, 0.44, -0.2)
  return 1.45
}

function queen(p: Parts) {
  p.body.push(
    lathe([[0.31, 0.19], [0.3, 0.25], [0.23, 0.42], [0.15, 0.65], [0.11, 0.82], [0.14, 0.95], [0.12, 1.03], [0.05, 1.08], [0, 1.09]]),
  )
  p.trim.push(put(new THREE.TorusGeometry(0.112, 0.016, 8, 40), [0, 0.82, 0], [Math.PI / 2, 0, 0]))
  p.trim.push(...ring(8, 0, (s, c) => spike(0.12, 0.03, [0.26 * s, 0.32, 0.26 * c], [s, 0.5, c], 6)))
  p.body.push(...ring(5, 0, (_s, _c, a) => spike(0.3, 0.045, [0, 1.04, -0.06], [Math.sin(a * 0.6 - 1.2) * 0.8, 1, -0.45], 8)))
  for (const s of [-1, 1]) {
    p.body.push(rod([s * 0.12, 1.0, 0], [s * 0.21, 0.74, 0.07], 0.032))
    p.trim.push(spike(0.26, 0.032, [s * 0.05, 1.3, -0.01], [s * 0.75, 1, -0.2], 8))
  }
  p.body.push(rod([0, 1.04, 0], [0, 1.16, 0], 0.035))
  face(p, 1.22, 0.088)
  p.trim.push(...ring(7, 0, (s, c) => spike(0.11, 0.022, [0.065 * s, 1.28, 0.065 * c], [s * 0.4, 1, c * 0.4], 6)))
  gem(p, [0, 0.93, 0.138], 0.035)
  p.glow.push(put(new THREE.SphereGeometry(0.055, 16, 12), [0.22, 0.73, 0.11]))
  p.halos.push([0.22, 0.73, 0.11, 0.55])
  return 1.56
}

function king(p: Parts) {
  p.body.push(lathe([[0.32, 0.19], [0.3, 0.27], [0.24, 0.5], [0.19, 0.8], [0.17, 1.0], [0.2, 1.08], [0.13, 1.15], [0, 1.16]]))
  p.body.push(put(new THREE.CylinderGeometry(0.21, 0.35, 0.9, 40, 1, true, Math.PI / 2 + 0.25, Math.PI - 0.5), [0, 0.65, -0.025]))
  p.trim.push(put(new THREE.TorusGeometry(0.218, 0.02, 8, 48), [0, 0.62, 0], [Math.PI / 2, 0, 0]))
  for (const s of [-1, 1]) {
    p.trim.push(put(new THREE.SphereGeometry(0.09, 20, 12), [s * 0.18, 1.09, 0], [0, 0, 0], [1, 0.7, 1]))
    p.body.push(spike(0.14, 0.03, [s * 0.2, 1.13, 0], [s * 0.6, 1, -0.1], 6))
  }
  p.body.push(rod([0.18, 1.05, 0], [0.27, 0.86, 0.1], 0.04))
  p.trim.push(rod([0.27, 0.2, 0.1], [0.27, 1.52, 0.1], 0.02))
  p.trim.push(...ring(3, 0, (s, c) => spike(0.12, 0.018, [0.27, 1.5, 0.1], [s * 0.5 + 0.0001, 1, c * 0.5], 6).translate(0.04 * s, 0, 0.04 * c)))
  p.glow.push(put(new THREE.OctahedronGeometry(0.07, 0), [0.27, 1.62, 0.1], [0, 0, 0], [0.8, 1.4, 0.8]))
  face(p, 1.27, 0.1)
  p.trim.push(put(new THREE.CylinderGeometry(0.1, 0.095, 0.06, 32, 1, true), [0, 1.35, 0]))
  p.trim.push(...ring(5, 0, (s, c) => spike(0.13, 0.026, [0.095 * s, 1.37, 0.095 * c], [s * 0.3, 1, c * 0.3], 6)))
  gem(p, [0, 1.35, 0.105], 0.025)
  p.halos.push([0.27, 1.62, 0.1, 0.75])
  return 1.7
}

const BUILDERS: Record<PieceSymbol, (p: Parts) => number> = { p: pawn, r: rook, n: knight, b: bishop, q: queen, k: king }
const cache = new Map<PieceSymbol, PieceModel>()

export function getPieceModel(type: PieceSymbol): PieceModel {
  const hit = cache.get(type)
  if (hit) return hit
  const parts: Parts = { body: [], trim: [], glow: [], halos: [] }
  base(parts)
  const height = BUILDERS[type](parts)
  const merge = (list: THREE.BufferGeometry[]) => {
    const g = mergeGeometries(list, false)!
    list.forEach((x) => x.dispose())
    g.computeBoundingSphere()
    return g
  }
  const model = { body: merge(parts.body), trim: merge(parts.trim), glow: merge(parts.glow), halos: parts.halos, height }
  cache.set(type, model)
  return model
}

const GLB_HEIGHT: Record<PieceSymbol, number> = { p: 1.05, r: 1.15, n: 1.25, b: 1.4, q: 1.55, k: 1.7 }
const PEDESTAL_TOP = 0.1
const MAX_FOOTPRINT = 0.68
const glbModels = new Map<PieceSymbol, PieceModel>()
const glbListeners = new Set<() => void>()
let glbLoading = false
let pedestal: { trim: THREE.BufferGeometry; glow: THREE.BufferGeometry } | null = null

function getPedestal() {
  if (pedestal) return pedestal
  const p: Parts = { body: [], trim: [], glow: [], halos: [] }
  p.trim.push(
    lathe([[0, 0], [0.41, 0], [0.425, 0.022], [0.405, 0.048], [0.365, 0.058], [0.365, 0.092], [0.335, PEDESTAL_TOP], [0, PEDESTAL_TOP]], false),
  )
  p.glow.push(put(new THREE.TorusGeometry(0.367, 0.011, 6, 64), [0, 0.075, 0], [Math.PI / 2, 0, 0]))
  pedestal = { trim: mergeGeometries(p.trim, false)!, glow: mergeGeometries(p.glow, false)! }
  return pedestal
}

function toFloat(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
  const out = new Float32Array(attr.count * 3)
  for (let i = 0; i < attr.count; i++) {
    out[i * 3] = attr.getX(i)
    out[i * 3 + 1] = attr.getY(i)
    out[i * 3 + 2] = attr.getZ(i)
  }
  return new THREE.BufferAttribute(out, 3)
}

function normalizeGlb(scene: THREE.Object3D, type: PieceSymbol): PieceModel {
  scene.updateMatrixWorld(true)
  const parts: THREE.BufferGeometry[] = []
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const src = mesh.geometry
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', toFloat(src.getAttribute('position')))
    if (src.getAttribute('normal')) g.setAttribute('normal', toFloat(src.getAttribute('normal')))
    if (src.index) g.setIndex(Array.from(src.index.array))
    g.applyMatrix4(mesh.matrixWorld)
    parts.push(g)
  })
  const body = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)!
  if (!body.getAttribute('normal')) body.computeVertexNormals()
  body.computeBoundingBox()
  const box = body.boundingBox!
  const size = box.getSize(new THREE.Vector3())
  const height = GLB_HEIGHT[type]
  const scale = Math.min((height - PEDESTAL_TOP) / size.y, MAX_FOOTPRINT / Math.max(size.x, size.z))
  const cx = (box.min.x + box.max.x) / 2
  const cz = (box.min.z + box.max.z) / 2
  body.translate(-cx, -box.min.y, -cz)
  body.scale(scale, scale, scale)
  body.translate(0, PEDESTAL_TOP - 0.005, 0)
  body.computeBoundingSphere()
  const ped = getPedestal()
  return { body, trim: ped.trim, glow: ped.glow, halos: [], height: PEDESTAL_TOP + size.y * scale }
}

export function loadGlbPieces() {
  if (glbLoading || typeof window === 'undefined') return
  glbLoading = true
  void (async () => {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    ])
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    const types: PieceSymbol[] = ['p', 'r', 'n', 'b', 'q', 'k']
    await Promise.all(
      types.map(async (t) => {
        try {
          const gltf = await loader.loadAsync(`/models/chess/${t}.glb`)
          glbModels.set(t, normalizeGlb(gltf.scene, t))
          glbListeners.forEach((fn) => fn())
        } catch (err) {
          console.error('[chess] falha ao carregar modelo', t, err)
        }
      }),
    )
  })()
}

function subscribeGlb(fn: () => void) {
  glbListeners.add(fn)
  return () => glbListeners.delete(fn)
}

/** Every set uses the Titan Chess turned pieces. */
export function usePieceModel(type: PieceSymbol, _setId?: string): PieceModel {
  return getTitanModel(type)
}

export type Deform = {
  uBend: { value: number }
  uSide: { value: number }
  uSquash: { value: number }
  uHeight: { value: number }
}

/**
 * The GLB pieces are single rigid meshes, so articulation is done in the vertex shader:
 * the body bends forward/back and sways sideways progressively with height (base stays planted)
 * and squashes/stretches, which reads as a torso winding up, striking, recoiling and landing.
 */
function withDeform<M extends THREE.Material>(m: M, d: Deform): M {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, d)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uBend;\nuniform float uSide;\nuniform float uSquash;\nuniform float uHeight;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  float hN = clamp(transformed.y / max(uHeight, 0.001), 0.0, 1.0);
  float h2 = hN * hN;
  transformed.y *= 1.0 + uSquash * hN;
  transformed.xz *= 1.0 - uSquash * 0.45 * hN;
  transformed.z += uBend * h2 * uHeight;
  transformed.x += uSide * h2 * uHeight;
}`,
      )
  }
  m.customProgramCacheKey = () => 'devo-deform'
  return m
}

export const BASE_EMISSIVE: Record<Color, number> = { w: 0, b: 0 }

/** Same materials as Titan Chess: clear-coated lacquer body, polished gold trim, and details in the opposite colour. */
export function makeUnitMaterials(c: Color, set: PieceSet) {
  const p = set[c]
  const deform: Deform = { uBend: { value: 0 }, uSide: { value: 0 }, uSquash: { value: 0 }, uHeight: { value: 1 } }
  const lacquer = (color: string) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: set.roughness,
      metalness: set.metalness,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1,
      emissive: p.trim,
      emissiveIntensity: 0,
    })
  return {
    deform,
    body: withDeform(lacquer(p.armor), deform),
    trim: withDeform(new THREE.MeshStandardMaterial({ color: p.trim, roughness: 0.22, metalness: 1, envMapIntensity: 1.2 }), deform),
    glow: withDeform(lacquer(p.magic), deform),
  }
}

function radialTexture(stops: [number, string][]) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  stops.forEach(([o, col]) => g.addColorStop(o, col))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const haloMats = new Map<string, Record<Color, THREE.SpriteMaterial>>()
let haloTex: THREE.Texture | null = null
export function getHaloMaterials(set: PieceSet) {
  const hit = haloMats.get(set.id)
  if (hit) return hit
  haloTex ??= radialTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']])
  const mk = (c: Color) =>
    new THREE.SpriteMaterial({ map: haloTex, color: set[c].magic, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const mats = { w: mk('w'), b: mk('b') }
  haloMats.set(set.id, mats)
  return mats
}

let shadowMat: THREE.MeshBasicMaterial | null = null
export function getShadowMaterial() {
  shadowMat ??= new THREE.MeshBasicMaterial({
    map: radialTexture([[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]),
    transparent: true,
    depthWrite: false,
  })
  return shadowMat
}

export const SHADOW_GEO = new THREE.PlaneGeometry(1.15, 1.15).rotateX(-Math.PI / 2)
