import type { Color, PieceSymbol } from 'chess.js'
import type { PieceSet, Quality } from '@/lib/devo/arcade/chess-themes'
import * as THREE from 'three'
import { makeMarbleTexture, mixHex } from './marble'
import { getTitanModel } from './titan-pieces'

export type PieceModel = {
  body: THREE.BufferGeometry
  trim: THREE.BufferGeometry
  /** O peão não tem joia: uma malha a menos para desenhar. */
  glow: THREE.BufferGeometry | null
  height: number
}

/** Todas as escolhas de material usam as mesmas esculturas; muda só o detalhe da malha. */
export function getPieceModel(type: PieceSymbol, quality: Quality): PieceModel {
  return getTitanModel(type, quality)
}

/**
 * As peças são malhas rígidas desenhadas em lote (uma malha por tipo e lado). A "vida" (inclinar,
 * encolher, golpear, tombar) é feita no vertex shader com dados por peça: `aLife` = dobra para
 * frente, dobra para o lado, compressão e altura do modelo; o corpo dobra progressivamente com a
 * altura e a base fica plantada. `aFx` = brilho e escurecimento, só no corpo.
 */
function withDeform<M extends THREE.Material>(m: M, fx: boolean): M {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec4 aLife;${fx ? '\nattribute vec2 aFx;\nvarying vec2 vFx;' : ''}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  float hN = clamp(transformed.y / max(aLife.w, 0.001), 0.0, 1.0);
  float h2 = hN * hN;
  transformed.y *= 1.0 + aLife.z * hN;
  transformed.xz *= 1.0 - aLife.z * 0.45 * hN;
  transformed.z += aLife.x * h2 * aLife.w;
  transformed.x += aLife.y * h2 * aLife.w;
${fx ? '  vFx = aFx;' : ''}
}`,
      )
    if (fx)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vFx;')
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= vFx.y;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vFx.x;')
  }
  m.customProgramCacheKey = () => (fx ? 'devo-deform-fx' : 'devo-deform')
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
 * Materiais de um lado (compartilhados por todas as peças dele):
 * - mármore: pedra polida com veios (mapa procedural);
 * - vidro: transparente com reflexo do estúdio;
 * - aço champanhe: metal escovado claro × aço escuro.
 * O filete é sempre metal; a joia é ametista. Só a qualidade alta paga o verniz (clearcoat), que
 * dobra o cálculo de brilho em cada pixel; nas outras o polimento vem de rugosidade baixa e reflexo.
 */
export function makeSideMaterials(c: Color, set: PieceSet, quality: Quality) {
  const p = set[c]
  const glass = set.material === 'glass'
  const marble = set.material === 'marble'
  const base = {
    color: marble ? '#ffffff' : p.body,
    map: marble ? pieceMarble(set, c) : null,
    metalness: set.metalness,
    transparent: glass,
    opacity: p.opacity,
    emissive: new THREE.Color(c === 'w' ? '#ece5d8' : '#8a7cc8'),
    emissiveIntensity: 1,
  }
  const body =
    quality === 'high'
      ? new THREE.MeshPhysicalMaterial({
          ...base,
          roughness: set.roughness,
          clearcoat: set.material === 'steel' ? 0.3 : 1,
          clearcoatRoughness: glass ? 0.02 : 0.12,
          envMapIntensity: glass ? 1.7 : set.material === 'steel' ? 1.25 : 0.95,
        })
      : new THREE.MeshStandardMaterial({
          ...base,
          roughness: Math.max(0.14, set.roughness - 0.04),
          envMapIntensity: glass ? 1.6 : set.material === 'steel' ? 1.25 : 1.3,
        })
  if (glass && body instanceof THREE.MeshPhysicalMaterial) {
    body.specularIntensity = 1
    body.ior = 1.5
    body.sheen = 0.4
    body.sheenColor = new THREE.Color(c === 'w' ? '#ffffff' : '#8a7cc8')
  }
  return {
    body: withDeform(body, true),
    trim: withDeform(new THREE.MeshStandardMaterial({ color: p.trim, roughness: 0.26, metalness: 1, envMapIntensity: 1.3 }), false),
    glow: withDeform(
      new THREE.MeshStandardMaterial({ color: p.gem, roughness: 0.15, metalness: 0.2, emissive: new THREE.Color(p.gem), emissiveIntensity: 0.35, envMapIntensity: 1.4 }),
      false,
    ),
  }
}

/** Brilho de base das peças (sobe no feitiço, no golpe e na promoção). */
export const BASE_EMISSIVE: Record<Color, number> = { w: 0, b: 0 }
