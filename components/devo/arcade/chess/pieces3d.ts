import type { Color, PieceSymbol } from 'chess.js'
import type { PieceSet } from '@/lib/devo/arcade/chess-themes'
import * as THREE from 'three'
import { makeMarbleTexture, mixHex } from './marble'
import { getTitanModel } from './titan-pieces'

type Halo = [x: number, y: number, z: number, size: number]

export type PieceModel = {
  body: THREE.BufferGeometry
  trim: THREE.BufferGeometry
  glow: THREE.BufferGeometry
  halos: Halo[]
  height: number
}

/** Todas as escolhas de material usam as mesmas esculturas. */
export function usePieceModel(type: PieceSymbol): PieceModel {
  return getTitanModel(type)
}

export type Deform = {
  uBend: { value: number }
  uSide: { value: number }
  uSquash: { value: number }
  uHeight: { value: number }
}

/**
 * As peças são malhas rígidas; a "vida" (inclinar, encolher, golpear, tombar) é feita no vertex
 * shader: o corpo dobra para frente/trás e para o lado progressivamente com a altura (a base fica
 * plantada) e comprime/estica.
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

/** Textura de mármore das peças (uma por conjunto e cor, compartilhada por todas as peças do lado). */
const pieceMaps = new Map<string, THREE.Texture>()
function pieceMarble(set: PieceSet, c: Color) {
  const key = `${set.id}-${c}`
  const hit = pieceMaps.get(key)
  if (hit) return hit
  const p = set[c]
  const tex = makeMarbleTexture({
    base: p.body,
    mottle: mixHex(p.body, c === 'w' ? '#d9d5cd' : '#3a3a40', 0.6),
    vein: p.vein,
    veinAlpha: c === 'w' ? 0.6 : 0.5,
    seed: c === 'w' ? 4211 : 9133,
    size: 256,
    cracks: 0,
  })
  tex.repeat.set(2, 1)
  pieceMaps.set(key, tex)
  return tex
}

/**
 * Materiais de um lado:
 * - mármore: pedra polida com veios (mapa procedural) e verniz;
 * - vidro: transparente com verniz alto e reflexo do estúdio;
 * - aço champanhe: metal escovado claro × aço escuro.
 * O filete é sempre metal; a joia é ametista.
 */
export function makeUnitMaterials(c: Color, set: PieceSet, lite = false) {
  const p = set[c]
  const deform: Deform = { uBend: { value: 0 }, uSide: { value: 0 }, uSquash: { value: 0 }, uHeight: { value: 1 } }
  const glass = set.material === 'glass'
  const marble = set.material === 'marble'
  // `lite` (qualidade baixa / renderizador por software): material padrão, sem verniz.
  const body = lite
    ? new THREE.MeshStandardMaterial({
        color: marble ? '#ffffff' : p.body,
        map: marble ? pieceMarble(set, c) : null,
        roughness: Math.max(0.3, set.roughness),
        metalness: set.metalness,
        envMapIntensity: 1,
        transparent: glass,
        opacity: p.opacity,
        emissive: new THREE.Color(c === 'w' ? '#ece5d8' : '#8a7cc8'),
        emissiveIntensity: 0,
      })
    : new THREE.MeshPhysicalMaterial({
    color: marble ? '#ffffff' : p.body,
    map: marble ? pieceMarble(set, c) : null,
    roughness: set.roughness,
    metalness: set.metalness,
    clearcoat: set.material === 'steel' ? 0.3 : 1,
    clearcoatRoughness: glass ? 0.02 : 0.12,
    envMapIntensity: glass ? 1.7 : set.material === 'steel' ? 1.25 : 0.95,
    transparent: glass,
    opacity: p.opacity,
    emissive: new THREE.Color(c === 'w' ? '#ece5d8' : '#8a7cc8'),
    emissiveIntensity: 0,
  })
  if (glass && body instanceof THREE.MeshPhysicalMaterial) {
    body.specularIntensity = 1
    body.ior = 1.5
    body.sheen = 0.4
    body.sheenColor = new THREE.Color(c === 'w' ? '#ffffff' : '#8a7cc8')
  }
  return {
    deform,
    body: withDeform(body, deform),
    trim: withDeform(new THREE.MeshStandardMaterial({ color: p.trim, roughness: 0.26, metalness: 1, envMapIntensity: 1.3 }), deform),
    glow: withDeform(
      new THREE.MeshStandardMaterial({ color: p.gem, roughness: 0.15, metalness: 0.2, emissive: new THREE.Color(p.gem), emissiveIntensity: 0.35, envMapIntensity: 1.4 }),
      deform,
    ),
  }
}

/** Brilho de base das peças (sobe no feitiço, no golpe e na promoção). */
export const BASE_EMISSIVE: Record<Color, number> = { w: 0, b: 0 }
