import type { PieceSymbol } from 'chess.js'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { PieceModel } from './pieces3d'

type V3 = [number, number, number]
type P2 = [number, number]

function place(g: THREE.BufferGeometry, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0]) {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(1, 1, 1)))
  const out = g.index ? g.toNonIndexed() : g
  if (out !== g) g.dispose()
  if (!out.getAttribute('uv')) out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((out.getAttribute('position').count) * 2), 2))
  return out
}

const lathe = (pts: P2[]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 48)
const smooth = (pts: P2[], top: number) =>
  lathe(
    new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)))
      .getPoints(28)
      .map((v) => [Math.max(v.x, 0), v.y] as P2)
      .concat([[0, top]]),
  )
const sph = (r: number, sy = 1) => new THREE.SphereGeometry(r, 32, 20).scale(1, sy, 1)
const cyl = (a: number, b: number, h: number) => new THREE.CylinderGeometry(a, b, h, 40)
const tor = (r: number, t: number) => new THREE.TorusGeometry(r, t, 12, 48).rotateX(Math.PI / 2)

const FOOT: P2[] = [[0, 0], [0.37, 0], [0.38, 0.03], [0.38, 0.07], [0.33, 0.09], [0.33, 0.12], [0.28, 0.15], [0.26, 0.2], [0, 0.2]]
const BODY: Partial<Record<PieceSymbol, P2[]>> = {
  p: [[0.26, 0.2], [0.17, 0.3], [0.11, 0.44], [0.11, 0.52]],
  r: [[0.26, 0.2], [0.2, 0.3], [0.17, 0.5], [0.2, 0.68]],
  b: [[0.26, 0.2], [0.18, 0.3], [0.12, 0.5], [0.13, 0.66]],
  q: [[0.26, 0.2], [0.17, 0.32], [0.11, 0.5], [0.15, 0.8], [0.2, 0.96]],
  k: [[0.26, 0.2], [0.17, 0.32], [0.11, 0.5], [0.15, 0.8], [0.2, 0.96]],
}
const TOP: Record<PieceSymbol, number> = { p: 0.52, r: 0.68, b: 0.66, q: 0.96, k: 0.96, n: 0.26 }
const HEIGHT: Record<PieceSymbol, number> = { p: 0.9, r: 1.04, b: 1.36, q: 1.5, k: 1.7, n: 1.05 }

function horseShape() {
  const sh = new THREE.Shape()
  const pts: P2[] = [[-0.22, 0.2], [0.22, 0.2], [0.2, 0.4], [0.1, 0.56], [0.2, 0.6], [0.4, 0.58], [0.43, 0.68], [0.3, 0.82], [0.2, 0.9], [0.15, 1], [0.06, 0.92], [-0.04, 0.98], [-0.1, 0.85], [-0.2, 0.7], [-0.25, 0.45]]
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)))
  return new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 4 }).translate(0, 0, -0.11)
}

const cache = new Map<PieceSymbol, PieceModel>()

/** Peças torneadas do Titan Chess (pé, corpo em perfil de torno e anéis dourados), no formato usado pelo tabuleiro vivo. */
export function getTitanModel(t: PieceSymbol): PieceModel {
  const hit = cache.get(t)
  if (hit) return hit
  const body: THREE.BufferGeometry[] = []
  const trim: THREE.BufferGeometry[] = []
  const glow: THREE.BufferGeometry[] = []
  const B = (g: THREE.BufferGeometry, p?: V3, r?: V3) => body.push(place(g, p, r))
  const T = (g: THREE.BufferGeometry, p?: V3, r?: V3) => trim.push(place(g, p, r))
  const L = (g: THREE.BufferGeometry, p?: V3, r?: V3) => glow.push(place(g, p, r))

  B(lathe(FOOT))
  T(tor(0.35, 0.016), [0, 0.095, 0])
  const prof = BODY[t]
  B(prof ? smooth(prof, TOP[t]) : lathe([[0.26, 0.2], [0.22, 0.26], [0, 0.26]]))

  if (t === 'p') {
    B(cyl(0.2, 0.16, 0.07), [0, 0.54, 0])
    T(tor(0.2, 0.016), [0, 0.575, 0])
    B(sph(0.17), [0, 0.72, 0])
  }
  if (t === 'r') {
    T(tor(0.21, 0.018), [0, 0.7, 0])
    B(cyl(0.3, 0.22, 0.18), [0, 0.8, 0])
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      B(new THREE.BoxGeometry(0.1, 0.14, 0.1), [0.235 * Math.cos(a), 0.97, 0.235 * Math.sin(a)])
    }
  }
  if (t === 'b') {
    B(cyl(0.21, 0.16, 0.06), [0, 0.69, 0])
    T(tor(0.21, 0.018), [0, 0.725, 0])
    B(sph(0.2, 1.4), [0, 0.98, 0])
    T(sph(0.06), [0, 1.3, 0])
    L(new THREE.BoxGeometry(0.3, 0.035, 0.5), [0, 1, 0], [0, 0, 0.75])
  }
  if (t === 'q' || t === 'k') {
    T(tor(0.27, 0.016), [0, 1, 0])
    B(cyl(t === 'q' ? 0.27 : 0.26, t === 'q' ? 0.18 : 0.19, 0.2), [0, 1.12, 0])
  }
  if (t === 'q') {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      const x = 0.22 * Math.cos(a)
      const z = 0.22 * Math.sin(a)
      B(new THREE.ConeGeometry(0.045, 0.2, 12), [x, 1.32, z], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25])
      T(sph(0.035), [x * 1.18, 1.43, z * 1.18])
    }
    T(sph(0.09), [0, 1.24, 0])
  }
  if (t === 'k') {
    B(new THREE.SphereGeometry(0.19, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), [0, 1.22, 0])
    T(new THREE.BoxGeometry(0.09, 0.38, 0.09), [0, 1.55, 0])
    T(new THREE.BoxGeometry(0.28, 0.09, 0.09), [0, 1.58, 0])
  }
  if (t === 'n') {
    T(tor(0.21, 0.018), [0, 0.24, 0])
    // Cabeça do cavalo olha para +z, a frente usada pelo tabuleiro vivo.
    B(horseShape(), [0, 0, 0], [0, -Math.PI / 2, 0])
    for (const z of [-0.15, 0.15]) L(sph(0.025), [-z, 0.78, 0.2])
  }
  if (!glow.length) L(sph(0.001), [0, 0.05, 0])

  const merge = (list: THREE.BufferGeometry[]) => {
    const g = mergeGeometries(list, false)!
    list.forEach((x) => x.dispose())
    g.computeBoundingSphere()
    return g
  }
  const model: PieceModel = { body: merge(body), trim: merge(trim), glow: merge(glow), halos: [], height: HEIGHT[t] }
  cache.set(t, model)
  return model
}
