import type { PieceSymbol } from 'chess.js'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { PieceModel } from './pieces3d'

/*
 * Peças em escultura (perfil de torno, no espírito Staunton das peças clássicas de computador, sem
 * copiar nenhum modelo): pé largo com filete de metal, corpo esguio, colarinho e coroa bem marcados.
 * Silhuetas pensadas para ler de longe no celular: cada tipo tem um topo inconfundível
 * (bola, ameias, mitra fendida, cabeça de cavalo, coroa de pontas, cruz).
 * Unidades: casa = 1. A escala vertical extra é aplicada no tabuleiro (PIECE_SY).
 */

type V3 = [number, number, number]
type P2 = [number, number]

function place(g: THREE.BufferGeometry, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s)))
  const out = g.index ? g.toNonIndexed() : g
  if (out !== g) g.dispose()
  if (!out.getAttribute('uv')) out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(out.getAttribute('position').count * 2), 2))
  if (!out.getAttribute('normal')) out.computeVertexNormals()
  return out
}

const SEG = 48
const lathe = (pts: P2[]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), SEG)
/** Perfil suave (spline) fechado no eixo no topo. */
const smooth = (pts: P2[], close = true) => {
  const v = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(pts.length * 10)
  const out = v.map((p) => [Math.max(p.x, 0), p.y] as P2)
  if (close) out.push([0, out[out.length - 1][1]])
  return lathe(out)
}
const sph = (r: number) => new THREE.SphereGeometry(r, 32, 20)
const cyl = (top: number, bottom: number, h: number, seg = SEG) => new THREE.CylinderGeometry(top, bottom, h, seg)
const tor = (r: number, t: number) => new THREE.TorusGeometry(r, t, 12, SEG).rotateX(Math.PI / 2)

/** Pé comum: degraus com chanfro (o metal vai no filete do meio). */
const FOOT: P2[] = [
  [0, 0],
  [0.355, 0],
  [0.37, 0.018],
  [0.37, 0.055],
  [0.35, 0.07],
  [0.335, 0.085],
  [0.335, 0.105],
  [0.3, 0.125],
  [0.285, 0.155],
  [0.255, 0.175],
  [0, 0.175],
]

/** Cabeça do cavalo: perfil lateral (nariz para +x) com crina, orelhas e queixo. */
function horse() {
  const pts: P2[] = [
    [-0.2, 0.3],
    [-0.245, 0.48],
    [-0.235, 0.66],
    [-0.18, 0.84],
    [-0.1, 0.98],
    [-0.05, 1.1],
    [0.0, 1.16],
    [0.03, 1.06],
    [0.08, 1.12],
    [0.11, 1.03],
    [0.2, 0.95],
    [0.31, 0.84],
    [0.39, 0.74],
    [0.42, 0.66],
    [0.39, 0.6],
    [0.3, 0.57],
    [0.2, 0.58],
    [0.12, 0.54],
    [0.1, 0.46],
    [0.16, 0.38],
    [0.2, 0.3],
  ]
  const sh = new THREE.Shape()
  sh.moveTo(pts[0][0], pts[0][1])
  sh.splineThru(pts.slice(1).map(([x, y]) => new THREE.Vector2(x, y)))
  sh.closePath()
  return new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.07, bevelSegments: 5, curveSegments: 48 }).translate(0, 0, -0.08)
}

const HEIGHT: Record<PieceSymbol, number> = { p: 0.9, r: 1.06, n: 1.2, b: 1.34, q: 1.5, k: 1.72 }

const cache = new Map<PieceSymbol, PieceModel>()

export function getTitanModel(t: PieceSymbol): PieceModel {
  const hit = cache.get(t)
  if (hit) return hit
  const body: THREE.BufferGeometry[] = []
  const trim: THREE.BufferGeometry[] = []
  const glow: THREE.BufferGeometry[] = []
  const B = (g: THREE.BufferGeometry, p?: V3, r?: V3, s?: V3) => body.push(place(g, p, r, s))
  const T = (g: THREE.BufferGeometry, p?: V3, r?: V3, s?: V3) => trim.push(place(g, p, r, s))
  const L = (g: THREE.BufferGeometry, p?: V3, r?: V3, s?: V3) => glow.push(place(g, p, r, s))

  B(lathe(FOOT))
  T(tor(0.338, 0.014), [0, 0.095, 0])

  if (t === 'p') {
    B(smooth([[0.255, 0.175], [0.2, 0.23], [0.14, 0.33], [0.112, 0.44], [0.11, 0.5]]))
    B(cyl(0.165, 0.185, 0.045), [0, 0.52, 0])
    T(tor(0.17, 0.014), [0, 0.545, 0])
    B(cyl(0.1, 0.13, 0.05), [0, 0.57, 0])
    B(sph(0.165), [0, 0.72, 0])
  }
  if (t === 'r') {
    B(smooth([[0.27, 0.175], [0.23, 0.24], [0.2, 0.4], [0.195, 0.6], [0.215, 0.7]]))
    T(tor(0.22, 0.016), [0, 0.705, 0])
    B(cyl(0.285, 0.235, 0.12), [0, 0.78, 0])
    B(cyl(0.285, 0.285, 0.14), [0, 0.91, 0])
    // Ameias: seis dentes com vãos.
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3
      B(new THREE.BoxGeometry(0.15, 0.1, 0.09), [0.235 * Math.cos(a), 1.03, 0.235 * Math.sin(a)], [0, -a + Math.PI / 2, 0])
    }
    B(cyl(0.17, 0.17, 0.04), [0, 0.99, 0])
    L(cyl(0.06, 0.06, 0.02, 16), [0, 1.01, 0])
  }
  if (t === 'b') {
    B(smooth([[0.26, 0.175], [0.19, 0.25], [0.13, 0.42], [0.105, 0.6], [0.11, 0.68]]))
    B(cyl(0.19, 0.15, 0.05), [0, 0.7, 0])
    T(tor(0.18, 0.015), [0, 0.725, 0])
    B(cyl(0.11, 0.14, 0.05), [0, 0.76, 0])
    // Mitra: gota alongada com a fenda em diagonal (a fenda é a joia).
    B(smooth([[0.12, 0.78], [0.17, 0.86], [0.175, 0.96], [0.14, 1.08], [0.07, 1.18], [0.02, 1.22]]))
    L(new THREE.BoxGeometry(0.36, 0.035, 0.05), [0, 1.0, 0.13], [0, 0, 0.7])
    T(sph(0.055), [0, 1.27, 0])
  }
  if (t === 'q' || t === 'k') {
    const tall = t === 'k' ? 0.06 : 0
    B(smooth([[0.27, 0.175], [0.19, 0.26], [0.125, 0.45], [0.105, 0.68 + tall], [0.12, 0.86 + tall], [0.17, 0.96 + tall]]))
    T(tor(0.18, 0.016), [0, 0.97 + tall, 0])
    B(cyl(0.21, 0.17, 0.06), [0, 1.0 + tall, 0])
    B(cyl(0.13, 0.16, 0.05), [0, 1.045 + tall, 0])
  }
  if (t === 'q') {
    // Coroa aberta: taça com oito pontas e pérolas de metal, bola no centro.
    B(smooth([[0.13, 1.07], [0.19, 1.16], [0.235, 1.27], [0.25, 1.3]], false))
    B(cyl(0.2, 0.2, 0.02), [0, 1.2, 0])
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      const x = 0.235 * Math.cos(a)
      const z = 0.235 * Math.sin(a)
      B(new THREE.ConeGeometry(0.038, 0.12, 10), [x, 1.35, z])
      T(sph(0.03), [x, 1.42, z])
    }
    B(sph(0.11), [0, 1.33, 0])
    L(sph(0.055), [0, 1.46, 0])
  }
  if (t === 'k') {
    // Coroa fechada com cúpula e cruz de metal (a joia fica no centro da cruz).
    B(smooth([[0.13, 1.13], [0.2, 1.22], [0.23, 1.32], [0.22, 1.36]], false))
    B(new THREE.SphereGeometry(0.2, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), [0, 1.34, 0])
    T(tor(0.215, 0.016), [0, 1.34, 0])
    T(cyl(0.04, 0.05, 0.06, 16), [0, 1.56, 0])
    T(new THREE.BoxGeometry(0.075, 0.24, 0.075), [0, 1.7, 0])
    T(new THREE.BoxGeometry(0.21, 0.07, 0.075), [0, 1.71, 0])
    L(new THREE.OctahedronGeometry(0.04, 0), [0, 1.71, 0.045])
  }
  if (t === 'n') {
    B(smooth([[0.26, 0.175], [0.22, 0.22], [0.2, 0.27], [0.2, 0.3]]))
    T(tor(0.2, 0.016), [0, 0.3, 0])
    // A cabeça olha para +z, a frente usada pelo tabuleiro vivo.
    B(horse(), [0, 0, 0], [0, -Math.PI / 2, 0])
    for (const s of [-1, 1]) L(sph(0.03), [s * 0.15, 0.87, 0.2])
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
