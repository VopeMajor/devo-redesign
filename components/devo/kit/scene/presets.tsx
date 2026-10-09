'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DV_COLOR } from '../tokens'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  makeCardBackTexture,
  makeCheckerTexture,
  makeDialTexture,
  makeDoorTexture,
  makeEnvTexture,
  makeGlowTexture,
  makeGothicWindowTexture,
  makeMarbleCheckerTexture,
  makeMarbleTexture,
  makeMistTexture,
  makeShaftTexture,
  makeSkyDiscTexture,
} from './textures'
import type { SceneFocus, ScenePreset } from './types'

export type PresetProps = {
  /** 0..1 — escala luzes, brilho de partículas e velocidade. */
  intensity: number
  /** Pulso vermelho (tempo crítico, eliminação). */
  alert: boolean
  /** Onde fica o foco do preset na tela (só `sigil` usa). */
  focus?: SceneFocus
  /** Menos partículas/geometria (celular). */
  lite: boolean
}

/* ─────────────────────────── utilidades compartilhadas ─────────────────────────── */

/** Cria um recurso Three (textura/geometria/material) e o descarta ao desmontar. */
function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[] = []) {
  const value = useMemo(factory, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => value.dispose(), [value])
  return value
}

/** Valor 0..1 do pulso de alerta (suaviza entrada/saída). */
function useAlertPulse(alert: boolean) {
  const v = useRef({ level: 0, pulse: 0 })
  useFrame((state, dt) => {
    const target = alert ? 1 : 0
    v.current.level += (target - v.current.level) * Math.min(1, dt * 3)
    const beat = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * Math.PI * 1.6)
    v.current.pulse = v.current.level * (0.35 + 0.65 * beat * beat)
  })
  return v
}

/** Luz vermelha que pulsa com o alerta. */
function AlertLight({ alert, position = [0, 4, 2], power = 30 }: { alert: boolean; position?: [number, number, number]; power?: number }) {
  const light = useRef<THREE.PointLight>(null)
  const pulse = useAlertPulse(alert)
  useFrame(() => {
    if (light.current) light.current.intensity = pulse.current.pulse * power
  })
  return <pointLight ref={light} position={position} color={DV_COLOR.blood} intensity={0} distance={30} decay={1.6} />
}

/** Poeira/partículas que sobem devagar e reaparecem embaixo. */
function Dust({
  count,
  color,
  area,
  center = [0, 0, 0],
  speed = 0.12,
  size = 0.06,
  opacity = 0.8,
}: {
  count: number
  color: string
  area: [number, number, number]
  center?: [number, number, number]
  speed?: number
  size?: number
  opacity?: number
}) {
  const tex = useDisposable(() => makeGlowTexture(64))
  const geo = useDisposable(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = center[0] + (Math.random() - 0.5) * area[0]
      p[i * 3 + 1] = center[1] + (Math.random() - 0.5) * area[1]
      p[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2]
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [count])
  const seeds = useMemo(() => Float32Array.from({ length: count }, () => Math.random()), [count])
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const attr = geo.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const t = state.clock.elapsedTime
    const top = center[1] + area[1] / 2
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      arr[i * 3 + 1] += speed * dt * (0.4 + s)
      arr[i * 3] += Math.sin(t * 0.6 + s * 20) * dt * 0.04
      if (arr[i * 3 + 1] > top) arr[i * 3 + 1] = center[1] - area[1] / 2
    }
    attr.needsUpdate = true
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} color={color} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  )
}

/** Câmera fixa olhando para um ponto, com deriva lenta opcional. */
function CameraRig({ pos, look, drift = 0, orbit = 0 }: { pos: [number, number, number]; look: [number, number, number]; drift?: number; orbit?: number }) {
  const target = useMemo(() => new THREE.Vector3(...look), [look])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const cam = state.camera
    if (orbit) {
      const a = Math.sin(t * 0.07) * orbit
      const r = Math.hypot(pos[0], pos[2])
      cam.position.set(Math.sin(a) * r, pos[1] + Math.sin(t * 0.11) * drift, Math.cos(a) * r)
    } else {
      cam.position.set(pos[0] + Math.sin(t * 0.05) * drift, pos[1] + Math.cos(t * 0.07) * drift * 0.5, pos[2])
    }
    cam.lookAt(target)
  })
  return null
}

/** Estrela de quatro pontas do sigilo, com o furo do olho (mesma curva do SVG oficial). */
function makeStarGeometry(r = 1, depth = 0.08) {
  const s = new THREE.Shape()
  const a = 0.056 * r
  const b = 0.27 * r
  s.moveTo(0, r)
  s.bezierCurveTo(a, b, b, a, r, 0)
  s.bezierCurveTo(b, -a, a, -b, 0, -r)
  s.bezierCurveTo(-a, -b, -b, -a, -r, 0)
  s.bezierCurveTo(-b, a, -a, b, 0, r)
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.176 * r, 0, Math.PI * 2, true)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 20 })
  g.translate(0, 0, -depth / 2)
  return g
}

/** Ambiente refletido nos metais (sigil, tribunal). Desfaz ao desmontar. */
function useEnvironment(intensity = 1) {
  const scene = useThree((s) => s.scene)
  const env = useDisposable(() => makeEnvTexture())
  useEffect(() => {
    const prev = scene.environment
    scene.environment = env
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = prev
    }
  }, [scene, env, intensity])
}

/**
 * Metal com brilho de borda (fresnel): o contorno acende na cor `rim` conforme a superfície vira de
 * lado para a câmera. É um MeshStandardMaterial com 3 linhas a mais no shader — custo desprezível.
 */
function useRimMaterial({ color, rim, rimPower = 2.2, rimStrength = 1.4, metalness = 0.95, roughness = 0.24, emissive = '#000000', emissiveIntensity = 0 }: {
  color: string
  rim: string
  rimPower?: number
  rimStrength?: number
  metalness?: number
  roughness?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  const mat = useDisposable(() => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity, envMapIntensity: 1.3 })
    const uniforms = { uRim: { value: new THREE.Color(rim).multiplyScalar(rimStrength) }, uRimPow: { value: rimPower } }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim;\nuniform float uRimPow;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n{ float rimF = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), uRimPow); totalEmissiveRadiance += uRim * rimF; }',
        )
    }
    m.customProgramCacheKey = () => `dv-rim-${rimPower}`
    return m
  }, [color, rim, rimPower, rimStrength, metalness, roughness, emissive, emissiveIntensity])
  return mat
}

/** Coluna com caneluras, base moldurada e capitel com ábaco (uma geometria só, instanciável). */
function makeColumnGeometry(lite: boolean) {
  const seg = lite ? 24 : 36
  const flutes = 12
  const shaft = new THREE.CylinderGeometry(0.34, 0.4, 8.8, seg, 6, true)
  const p = shaft.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const a = Math.atan2(z, x)
    const k = 1 - 0.07 * Math.pow(Math.max(0, Math.cos(a * flutes)), 0.6)
    p.setX(i, x * k)
    p.setZ(i, z * k)
  }
  shaft.translate(0, 0.6 + 4.4, 0)
  shaft.deleteAttribute('uv')
  shaft.computeVertexNormals()
  const parts: THREE.BufferGeometry[] = [shaft]
  const ring = (rTop: number, rBot: number, h: number, y: number) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1)
    g.translate(0, y, 0)
    g.deleteAttribute('uv')
    parts.push(g)
  }
  // base: plinto + toro
  ring(0.58, 0.58, 0.28, 0.14)
  ring(0.46, 0.52, 0.16, 0.36)
  ring(0.42, 0.44, 0.12, 0.52)
  // capitel: colarinho, equino que se abre e ábaco quadrado
  ring(0.4, 0.37, 0.12, 9.46)
  ring(0.56, 0.4, 0.36, 9.7)
  const abacus = new THREE.BoxGeometry(1.2, 0.2, 1.2)
  abacus.translate(0, 9.98, 0)
  abacus.deleteAttribute('uv')
  parts.push(abacus)
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()))!
  parts.forEach((g) => g.dispose())
  merged.computeBoundingSphere()
  return merged
}

/** Faixas de bruma em camadas que se arrastam devagar (escondem fundos e bases). */
function MistLayers({ layers, color, opacity }: { layers: { y: number; z: number; w: number; h: number; speed: number }[]; color: string; opacity: number }) {
  const texA = useDisposable(() => makeMistTexture(3))
  const texB = useDisposable(() => makeMistTexture(7))
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    group.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (m.map) m.map.offset.x += Math.min(delta, 0.1) * layers[i].speed
    })
  })
  return (
    <group ref={group}>
      {layers.map((l, i) => (
        <mesh key={i} position={[0, l.y, l.z]}>
          <planeGeometry args={[l.w, l.h]} />
          <meshBasicMaterial map={i % 2 ? texB : texA} color={color} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────────────────────── SIGIL (landing/acesso) ─────────────────────────────── */

function SigilPreset({ intensity, alert, focus, lite }: PresetProps) {
  const rig = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const dialA = useRef<THREE.Mesh>(null)
  const dialB = useRef<THREE.Mesh>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const orbit = useRef<THREE.Group>(null)
  const moon = useRef<THREE.Mesh>(null)
  const hand = useRef<THREE.Group>(null)
  const star = useRef<THREE.Mesh>(null)
  const glowMat = useRef<THREE.SpriteMaterial>(null)
  const pulse = useAlertPulse(alert)
  const { camera } = useThree()

  const romanTex = useDisposable(() => makeDialTexture({ size: lite ? 768 : 1024, numerals: 'roman', ticks: 60 }), [lite])
  const hoursTex = useDisposable(() => makeDialTexture({ size: lite ? 512 : 768, numerals: 'hours72', ticks: 72, color: DV_COLOR.violetText, inner: 0.6 }), [lite])
  const glowTex = useDisposable(() => makeGlowTexture(128))
  const starGeo = useDisposable(() => makeStarGeometry(1, 0.1))
  const starMat = useRimMaterial({ color: '#e0dfdc', rim: '#b7b3c9', rimPower: 2.4, rimStrength: 1.4, metalness: 1, roughness: 0.24, emissive: '#19181f', emissiveIntensity: 0.4 })
  const v = useMemo(() => new THREE.Vector3(), [])
  useEnvironment(0.9)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime
    const speed = 0.4 + intensity * 0.6
    // posição/escala a partir do foco em tela
    if (rig.current) {
      const vp = state.viewport.getCurrentViewport(camera, v.set(0, 0, 0))
      const f = focus ?? { x: 0.5, y: 0.42, size: 0.9 }
      rig.current.position.set((f.x - 0.5) * vp.width, (0.5 - f.y) * vp.height, 0)
      // diâmetro do mostrador externo (4.2 + anéis) ≈ f.size × menor dimensão
      const s = (Math.min(vp.width, vp.height) * f.size) / 4.6
      rig.current.scale.setScalar(s)
    }
    if (tilt.current) {
      tilt.current.rotation.x = -0.32 + Math.sin(t * 0.21) * 0.05
      tilt.current.rotation.y = 0.18 + Math.sin(t * 0.17) * 0.08
    }
    if (dialA.current) dialA.current.rotation.z -= dt * 0.03 * speed
    if (dialB.current) dialB.current.rotation.z += dt * 0.05 * speed
    if (ringA.current) ringA.current.rotation.y += dt * 0.22 * speed
    if (ringB.current) ringB.current.rotation.x += dt * 0.16 * speed
    if (orbit.current && moon.current) {
      const a = t * 0.5 * speed
      moon.current.position.set(Math.cos(a) * 1.08, Math.sin(a) * 0.38, 0.02)
    }
    if (hand.current) hand.current.rotation.z = -((t % 60) / 60) * Math.PI * 2
    if (star.current) star.current.rotation.y = Math.sin(t * 0.4) * 0.25
    if (glowMat.current) {
      const p = pulse.current.pulse
      glowMat.current.color.setRGB(0.42 + p * 0.42, 0.4 - p * 0.3, 0.62 - p * 0.5)
      glowMat.current.opacity = 0.55 * intensity + p * 0.35
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4 * intensity} color={DV_COLOR.goldBright} />
      <pointLight position={[0, 0, 2.2]} intensity={8 * intensity} distance={7} color={DV_COLOR.violet} />
      <pointLight position={[-3, -2, 2]} intensity={3 * intensity} distance={8} color={DV_COLOR.cobaltDeep} />
      <AlertLight alert={alert} position={[0, 1, 3]} power={20} />

      <group ref={rig}>
        <sprite scale={[4.6, 4.6, 1]} position={[0, 0, -0.6]}>
          <spriteMaterial ref={glowMat} map={glowTex} color={DV_COLOR.violet} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        <group ref={tilt}>
          {/* mostrador romano (externo) */}
          <mesh ref={dialA} position={[0, 0, -0.15]}>
            <planeGeometry args={[4.2, 4.2]} />
            <meshBasicMaterial map={romanTex} transparent opacity={0.85 * (0.6 + intensity * 0.4)} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* mostrador de 72 horas (interno, cobalto) */}
          <mesh ref={dialB} position={[0, 0, -0.35]}>
            <planeGeometry args={[2.75, 2.75]} />
            <meshBasicMaterial map={hoursTex} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* anéis armilares */}
          <mesh ref={ringA}>
            <torusGeometry args={[2.22, 0.012, 6, lite ? 96 : 160]} />
            <meshStandardMaterial color={DV_COLOR.gold} metalness={0.85} roughness={0.3} emissive={DV_COLOR.goldDeep} emissiveIntensity={0.4} />
          </mesh>
          <mesh ref={ringB} rotation={[0, 0, 0.6]}>
            <torusGeometry args={[2.36, 0.008, 6, lite ? 96 : 160]} />
            <meshStandardMaterial color={DV_COLOR.goldBright} metalness={0.8} roughness={0.35} emissive={DV_COLOR.goldDeep} emissiveIntensity={0.3} />
          </mesh>
          {/* ponteiro de segundos (1 volta/min) */}
          <group ref={hand} position={[0, 0, 0.1]}>
            <mesh position={[0, 0.85, 0]}>
              <boxGeometry args={[0.018, 1.7, 0.01]} />
              <meshBasicMaterial color={DV_COLOR.goldBright} toneMapped={false} />
            </mesh>
            <mesh position={[0, 1.72, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.07, 0.07, 0.01]} />
              <meshBasicMaterial color={DV_COLOR.goldBright} toneMapped={false} />
            </mesh>
          </group>
          {/* órbita + lua */}
          <group ref={orbit} rotation={[0, 0, -0.42]} position={[0, 0, 0.06]}>
            <mesh scale={[1.08, 0.38, 1]}>
              <torusGeometry args={[1, 0.022, 8, lite ? 96 : 140]} />
              <meshStandardMaterial color="#ebeae8" metalness={0.9} roughness={0.25} emissive={DV_COLOR.night2} emissiveIntensity={0.35} />
            </mesh>
            <mesh ref={moon}>
              <sphereGeometry args={[0.06, 16, 12]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          </group>
          {/* estrela do sigilo + olho */}
          <mesh ref={star} geometry={starGeo} material={starMat} />
          <mesh>
            <circleGeometry args={[0.07, 24]} />
            <meshBasicMaterial color={DV_COLOR.porcelain} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <Dust count={lite ? 120 : 260} color={DV_COLOR.goldBright} area={[9, 12, 5]} speed={0.14 * (0.5 + intensity)} size={lite ? 0.07 : 0.06} opacity={0.75 * intensity} />
      <Dust count={lite ? 30 : 60} color={DV_COLOR.violetText} area={[9, 12, 4]} speed={0.08} size={0.1} opacity={0.6 * intensity} />
    </>
  )
}

/* ───────────────────────────── CATHEDRAL (sistema) ───────────────────────────── */

function CathedralPreset({ intensity, alert, lite }: PresetProps) {
  const pillars = useRef<THREE.InstancedMesh>(null)
  const cards = useRef<THREE.Group>(null)
  const shafts = useRef<THREE.Group>(null)
  const count = lite ? 12 : 16
  const pillarGeo = useDisposable(() => makeColumnGeometry(lite), [lite])
  const pillarMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#6e6e72', roughness: 0.62, metalness: 0.1, emissive: '#151517', emissiveIntensity: 0.5, flatShading: false }))
  const shaftTex = useDisposable(() => makeShaftTexture())
  const cardTex = useDisposable(() => makeCardBackTexture())
  const cardData = useMemo(
    () =>
      Array.from({ length: lite ? 9 : 14 }, (_, i) => ({
        x: (Math.random() - 0.5) * 6,
        y: 1.4 + Math.random() * 4.5,
        z: -2.5 - Math.random() * 16,
        r: Math.random() * Math.PI * 2,
        s: 0.15 + Math.random() * 0.25,
        k: i,
      })),
    [lite],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    if (!pillars.current) return
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1
      const row = Math.floor(i / 2)
      m.makeTranslation(side * 3.1, 0, 2 - row * 5)
      pillars.current.setMatrixAt(i, m)
    }
    pillars.current.instanceMatrix.needsUpdate = true
  }, [count])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime
    cards.current?.children.forEach((c, i) => {
      const d = cardData[i]
      c.rotation.y += dt * d.s * (0.4 + intensity)
      c.rotation.z = Math.sin(t * 0.3 + d.r) * 0.25
      c.position.y = d.y + Math.sin(t * 0.4 + d.r) * 0.25
    })
    shafts.current?.children.forEach((s, i) => {
      const m = (s as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = (0.2 + 0.1 * Math.sin(t * 0.35 + i * 1.7)) * intensity
    })
  })

  return (
    <>
      <color attach="background" args={[DV_COLOR.ink]} />
      <fog attach="fog" args={['#0e0c18', 6, 36]} />
      <CameraRig pos={[0, 1.6, 8]} look={[0, 3.2, -16]} drift={0.35} />
      <ambientLight intensity={0.9} color="#a3a2a8" />
      <hemisphereLight args={['#c9c7cf', '#151517', 0.8]} />
      <directionalLight position={[2, 10, -6]} intensity={2.4 * intensity} color="#e6e5e2" />
      <pointLight position={[0, 6, -10]} intensity={80 * intensity} distance={30} decay={1.4} color="#a9a6b4" />
      <pointLight position={[0, 3, 2]} intensity={30 * intensity} distance={14} decay={1.4} color={DV_COLOR.goldBright} />
      <AlertLight alert={alert} position={[0, 5, 0]} power={40} />
      <instancedMesh ref={pillars} args={[pillarGeo, pillarMat, count]} />
      {/* arquitrave sobre as colunas */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.1, 10.35, -14]}>
          <boxGeometry args={[1.3, 0.5, 44]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.85} />
        </mesh>
      ))}
      <MistLayers
        color="#c4c3c8"
        opacity={0.42 * intensity}
        layers={[
          { y: 0.9, z: 1, w: 16, h: 3, speed: 0.008 },
          { y: 1.4, z: -6, w: 18, h: 4, speed: -0.006 },
          { y: 2.4, z: -13, w: 20, h: 6, speed: 0.005 },
          { y: 9.6, z: -8, w: 20, h: 5, speed: -0.004 },
          { y: 5, z: -24, w: 26, h: 12, speed: 0.003 },
        ]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]}>
        <planeGeometry args={[14, 50]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.4} metalness={0.35} />
      </mesh>
      <group ref={shafts}>
        {[-1.6, 0.8, 2.2, -0.4].map((x, i) => (
          <mesh key={i} position={[x, 7, -6 - i * 4]} rotation={[0, 0, 0.32]}>
            <planeGeometry args={[1.1 + (i % 2) * 0.6, 16]} />
            <meshBasicMaterial map={shaftTex} color={i % 2 ? '#ebeae8' : DV_COLOR.violetText} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={cards}>
        {cardData.map((d) => (
          <mesh key={d.k} position={[d.x, d.y, d.z]} rotation={[0.2, d.r, 0]}>
            <planeGeometry args={[0.9, 1.26]} />
            <meshStandardMaterial map={cardTex} emissiveMap={cardTex} side={THREE.DoubleSide} roughness={0.5} metalness={0.3} emissive="#ffffff" emissiveIntensity={0.55} />
          </mesh>
        ))}
      </group>
      <Dust count={lite ? 100 : 220} color="#ece5d8" area={[8, 10, 26]} center={[0, 4, -10]} speed={0.1} size={0.08} opacity={0.6 * intensity} />
    </>
  )
}

/* ───────────────────────────── TABLE (Sala de Jogos) ───────────────────────────── */

/**
 * Espada de cerimônia em 3D (ponta para baixo, origem na ponta): lâmina losangular de prata,
 * guarda de latão com pontas em gota, punho escuro e pomo facetado com pedra. Geometrias simples
 * (≈ 60 triângulos); materiais compartilhados entre as espadas.
 */
function Sword3D({ position, rotation, scale = 1, steel, brass, grip, gem }: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: number
  steel: THREE.Material
  brass: THREE.Material
  grip: THREE.Material
  gem: THREE.Material
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* lâmina: pirâmide alongada de 4 lados, achatada */}
      <mesh position={[0, 0.8, 0]} scale={[1, 1, 0.32]} material={steel}>
        <cylinderGeometry args={[0.055, 0.004, 1.6, 4, 1]} />
      </mesh>
      {/* guarda */}
      <mesh position={[0, 1.63, 0]} material={brass}>
        <boxGeometry args={[0.46, 0.05, 0.07]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.25, 1.65, 0]} material={brass}>
          <octahedronGeometry args={[0.04, 0]} />
        </mesh>
      ))}
      {/* punho */}
      <mesh position={[0, 1.83, 0]} material={grip}>
        <cylinderGeometry args={[0.026, 0.03, 0.34, 6]} />
      </mesh>
      {/* pomo + pedra */}
      <mesh position={[0, 2.04, 0]} scale={[1, 1.3, 1]} material={brass}>
        <octahedronGeometry args={[0.07, 0]} />
      </mesh>
      <mesh position={[0, 1.64, 0.04]} rotation={[0, 0, Math.PI / 4]} material={gem}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
    </group>
  )
}

/** Peça de xadrez torneada (LatheGeometry): `king` (cruz no topo) ou `pawn`. */
function makePieceGeometry(kind: 'king' | 'pawn') {
  const pts =
    kind === 'pawn'
      ? [[0, 0], [0.16, 0], [0.16, 0.04], [0.12, 0.07], [0.07, 0.12], [0.05, 0.24], [0.09, 0.27], [0.05, 0.29], [0.08, 0.34], [0.085, 0.39], [0.06, 0.44], [0, 0.46]]
      : [[0, 0], [0.19, 0], [0.19, 0.05], [0.14, 0.09], [0.08, 0.16], [0.06, 0.42], [0.11, 0.45], [0.06, 0.48], [0.1, 0.56], [0.12, 0.6], [0.04, 0.62], [0, 0.62]]
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 20)
  if (kind === 'king') {
    const a = new THREE.BoxGeometry(0.03, 0.14, 0.03)
    a.translate(0, 0.69, 0)
    const b = new THREE.BoxGeometry(0.1, 0.03, 0.03)
    b.translate(0, 0.7, 0)
    const merged = mergeGeometries([g.toNonIndexed(), a.toNonIndexed(), b.toNonIndexed()])!
    ;[g, a, b].forEach((x) => x.dispose())
    merged.deleteAttribute('uv')
    merged.computeVertexNormals()
    return merged
  }
  return g
}

function TablePreset({ intensity, alert, lite }: PresetProps) {
  const lamp = useRef<THREE.Group>(null)
  const spot = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  // tabuleiro 8×8 de mármore branco/negro com rejunte de latão; laterais em mármore negro
  const boardTex = useDisposable(() => makeMarbleCheckerTexture({ size: lite ? 768 : 1024, cells: 8, seed: 21 }), [lite])
  const sideTex = useDisposable(() => makeMarbleTexture({ kind: 'black', size: 256, seed: 6, repeat: [4, 0.25] }))
  const floorTex = useDisposable(() => makeMarbleTexture({ kind: 'black', size: lite ? 512 : 768, seed: 2, repeat: [3, 3] }), [lite])
  const boardMats = useDisposable(() => {
    const side = new THREE.MeshStandardMaterial({ map: sideTex, color: '#8c8b90', roughness: 0.35, metalness: 0.1 })
    const top = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.22, metalness: 0.08 })
    const arr = [side, side, top, side, side, side]
    return Object.assign(arr, { dispose: () => [side, top].forEach((m) => m.dispose()) })
  }, [boardTex, sideTex])
  const cardTex = useDisposable(() => makeCardBackTexture())
  const glowTex = useDisposable(() => makeGlowTexture(128))
  const steel = useRimMaterial({ color: '#d9d8e0', rim: '#ebeae8', rimPower: 2.6, rimStrength: 0.9, metalness: 1, roughness: 0.2 })
  const brass = useRimMaterial({ color: DV_COLOR.gold, rim: DV_COLOR.goldBright, rimPower: 2.2, rimStrength: 0.8, metalness: 1, roughness: 0.3, emissive: DV_COLOR.goldDeep, emissiveIntensity: 0.25 })
  const grip = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#161618', roughness: 0.6, metalness: 0.2 }))
  const gem = useDisposable(() => new THREE.MeshStandardMaterial({ color: DV_COLOR.violet, emissive: DV_COLOR.night2, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3 }))
  const kingGeo = useDisposable(() => makePieceGeometry('king'))
  const pawnGeo = useDisposable(() => makePieceGeometry('pawn'))
  const blackPiece = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#161618', roughness: 0.18, metalness: 0.35 }))
  const whitePiece = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#e9e8e5', roughness: 0.3, metalness: 0.05 }))
  useEnvironment(0.7)
  const pulse = useAlertPulse(alert)
  const cards = useMemo(
    () => [
      { p: [-1.05, 0.252, 0.95], r: 0.4 },
      { p: [-0.6, 0.254, 1.25], r: -0.2 },
      { p: [0.95, 0.256, -0.2], r: 0.9 },
    ] as { p: [number, number, number]; r: number }[],
    [],
  )
  // espadas cravadas no tabuleiro e no chão (ponta enterrada), inclinadas como numa ruína
  const swords = useMemo(
    () =>
      [
        { p: [-1.5, -0.35, -1.25], r: [0.12, 0.4, 0.3], s: 1.45 },
        { p: [1.6, -0.4, -1.05], r: [-0.05, -0.3, -0.26], s: 1.55 },
        { p: [1.35, 0.0, 1.35], r: [0.3, 0.2, -0.16], s: 1.2 },
        ...(lite ? [] : [{ p: [-2.2, -0.4, 0.9], r: [0.2, 0.9, 0.4], s: 1.35 }]),
      ] as { p: [number, number, number]; r: [number, number, number]; s: number }[],
    [lite],
  )

  useEffect(() => {
    if (spot.current) spot.current.target = target
  }, [target])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (lamp.current) {
      lamp.current.rotation.z = Math.sin(t * 0.7) * 0.035
      lamp.current.rotation.x = Math.cos(t * 0.5) * 0.02
    }
    if (spot.current) {
      const p = pulse.current.pulse
      spot.current.intensity = (38 + Math.sin(t * 9) * 0.6) * intensity
      spot.current.color.setRGB(1, 0.95 - p * 0.65, 0.88 - p * 0.65)
    }
  })

  return (
    <>
      <color attach="background" args={[DV_COLOR.ink]} />
      <fog attach="fog" args={[DV_COLOR.ink, 6, 17]} />
      <CameraRig pos={[0, 4.4, 5.6]} look={[0, 0, 0]} drift={0.15} />
      <ambientLight intensity={0.3} color="#9c99ad" />
      <hemisphereLight args={['#b7b3c9', '#0c0c0e', 0.35]} />
      <pointLight position={[-4, 2.5, -3]} intensity={14 * intensity} distance={12} decay={1.4} color={DV_COLOR.violet} />
      <primitive object={target} position={[0, 0, 0]} />
      <group ref={lamp} position={[0, 3.4, 0]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 4, 4]} />
          <meshBasicMaterial color="#2a2a2e" />
        </mesh>
        <mesh>
          <coneGeometry args={[0.5, 0.42, 32, 1, true]} />
          <meshStandardMaterial color="#151517" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
          <torusGeometry args={[0.5, 0.014, 6, 48]} />
        </mesh>
        <sprite position={[0, -0.18, 0]} scale={[0.7, 0.7, 1]}>
          <spriteMaterial map={glowTex} color="#f8f5ee" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        {/* cone de luz visível */}
        <mesh position={[0, -1.75, 0]}>
          <coneGeometry args={[2.1, 3.1, 40, 1, true]} />
          <meshBasicMaterial color="#f1ede4" transparent opacity={0.04 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <spotLight ref={spot} position={[0, -0.15, 0]} angle={0.66} penumbra={0.6} decay={1.2} distance={12} intensity={38} color="#f2eee6" />
      </group>
      {/* chão de mármore negro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial map={floorTex} color="#6c6b70" roughness={0.42} metalness={0.15} />
      </mesh>
      {/* tabuleiro (placa de mármore) */}
      <mesh position={[0, 0.12, 0]} material={boardMats}>
        <boxGeometry args={[3.6, 0.24, 3.6]} />
      </mesh>
      {/* filete de latão na borda do tampo */}
      <mesh position={[0, 0.243, 0]} rotation={[-Math.PI / 2, 0, 0]} material={brass}>
        <ringGeometry args={[2.5, 2.56, 4, 1, Math.PI / 4]} />
      </mesh>
      {/* peças: rei negro de pé, peão branco tombado */}
      <mesh geometry={kingGeo} material={blackPiece} position={[0.67, 0.24, 0.67]} />
      <mesh geometry={pawnGeo} material={whitePiece} position={[-0.5, 0.33, -0.4]} rotation={[0, 0.6, Math.PI / 2]} />
      {cards.map((c, i) => (
        <mesh key={i} position={c.p} rotation={[-Math.PI / 2, 0, c.r]}>
          <planeGeometry args={[0.42, 0.59]} />
          <meshStandardMaterial map={cardTex} roughness={0.45} metalness={0.2} />
        </mesh>
      ))}
      {swords.map((s, i) => (
        <Sword3D key={i} position={s.p} rotation={s.r} scale={s.s} steel={steel} brass={brass} grip={grip} gem={gem} />
      ))}
      <AlertLight alert={alert} position={[0, 2.5, 1.5]} power={18} />
      <Dust count={lite ? 60 : 140} color={DV_COLOR.goldBright} area={[3.6, 3.2, 3.6]} center={[0, 1.6, 0]} speed={0.05} size={0.035} opacity={0.65 * intensity} />
    </>
  )
}

/* ─────────────────────────── CORRIDOR (Sala de Trocas) ─────────────────────────── */

function CorridorPreset({ intensity, alert, lite }: PresetProps) {
  const rig = useRef<THREE.Group>(null)
  const doors = lite ? 7 : 10
  const spacing = 3.2
  const doorTex = useDisposable(() => {
    // Atlas de 8 portas numeradas.
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const ctx = c.getContext('2d')!
    for (let i = 0; i < 8; i++) {
      const t = makeDoorTexture(i)
      ctx.drawImage(t.image as unknown as HTMLCanvasElement, i * 128, 0)
      t.dispose()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
  const floorTex = useDisposable(() => {
    const t = makeCheckerTexture({ light: '#6b6a70', dark: '#0c0c0e', cells: 8 })
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 16)
    return t
  })
  const glowTex = useDisposable(() => makeGlowTexture(64))
  const doorGeos = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const g = new THREE.PlaneGeometry(1.2, 2.4)
      const uv = g.getAttribute('uv') as THREE.BufferAttribute
      for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 8)
      uv.needsUpdate = true
      return g
    })
  }, [])
  useEffect(() => () => doorGeos.forEach((g) => g.dispose()), [doorGeos])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (rig.current) rig.current.position.z = ((t * 0.55 * (0.5 + intensity)) % (spacing * 2))
  })

  return (
    <>
      <color attach="background" args={[DV_COLOR.ink]} />
      <fog attach="fog" args={[DV_COLOR.ink, 3, lite ? 20 : 28]} />
      <CameraRig pos={[0, 1.45, 4]} look={[0, 1.3, -20]} drift={0.06} />
      <ambientLight intensity={0.3} color="#858393" />
      <pointLight position={[0, 2.6, -2]} intensity={6 * intensity} distance={10} color="#f0ebe0" />
      <pointLight position={[0, 2.4, -14]} intensity={10 * intensity} distance={16} color={DV_COLOR.violet} />
      <AlertLight alert={alert} position={[0, 2.5, -4]} power={26} />
      <group ref={rig}>
        {Array.from({ length: doors }, (_, i) => {
          const z = -i * spacing
          return (
            <group key={i}>
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 1.6, 1.2, z]} rotation={[0, -side * Math.PI / 2, 0]}>
                  <mesh geometry={doorGeos[(i * 2 + (side > 0 ? 1 : 0)) % 8]}>
                    <meshStandardMaterial map={doorTex} roughness={0.7} metalness={0.2} emissive="#17161d" emissiveIntensity={0.5} />
                  </mesh>
                  {/* batentes */}
                  <mesh position={[-0.66, 0, 0.02]}>
                    <boxGeometry args={[0.08, 2.56, 0.08]} />
                    <meshStandardMaterial color={DV_COLOR.goldDeep} metalness={0.7} roughness={0.4} />
                  </mesh>
                  <mesh position={[0.66, 0, 0.02]}>
                    <boxGeometry args={[0.08, 2.56, 0.08]} />
                    <meshStandardMaterial color={DV_COLOR.goldDeep} metalness={0.7} roughness={0.4} />
                  </mesh>
                  <mesh position={[0, 1.3, 0.02]}>
                    <boxGeometry args={[1.4, 0.1, 0.08]} />
                    <meshStandardMaterial color={DV_COLOR.goldDeep} metalness={0.7} roughness={0.4} />
                  </mesh>
                  <sprite position={[0.34, -0.1, 0.05]} scale={[0.22, 0.22, 1]}>
                    <spriteMaterial map={glowTex} color="#fff2d6" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                  </sprite>
                </group>
              ))}
              {i % 2 === 0 && (
                <sprite position={[0, 2.75, z]} scale={[0.5, 0.5, 1]}>
                  <spriteMaterial map={glowTex} color="#efe9dc" transparent opacity={0.8 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                </sprite>
              )}
            </group>
          )
        })}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -14]}>
        <planeGeometry args={[3.2, 40]} />
        <meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.95, -14]}>
        <planeGeometry args={[3.2, 40]} />
        <meshStandardMaterial color="#0c0c0e" roughness={1} />
      </mesh>
      {/* porta final, com a fechadura acesa */}
      <group position={[0, 1.3, -34]}>
        <mesh>
          <planeGeometry args={[2.2, 2.9]} />
          <meshStandardMaterial color="#161618" emissive="#17161d" emissiveIntensity={0.8} />
        </mesh>
        <sprite position={[0, -0.05, 0.1]} scale={[1.6, 1.6, 1]}>
          <spriteMaterial map={glowTex} color={DV_COLOR.paper} transparent opacity={0.9 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      </group>
      <Dust count={lite ? 60 : 120} color="#ece5d8" area={[3, 3, 20]} center={[0, 1.5, -8]} speed={0.04} size={0.04} opacity={0.5 * intensity} />
    </>
  )
}

/* ─────────────────────────── TRIBUNAL (Deadly Vote/Record) ─────────────────────────── */

function TribunalPreset({ intensity, alert, lite }: PresetProps) {
  const seats = useRef<THREE.InstancedMesh>(null)
  const plates = useRef<THREE.InstancedMesh>(null)
  const judge = useRef<THREE.Mesh>(null)
  const top = useRef<THREE.SpotLight>(null)
  const floorDial = useRef<THREE.Mesh>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const pulse = useAlertPulse(alert)
  const perTier = lite ? 9 : 11
  const total = perTier * 2
  const seatGeo = useDisposable(() => new THREE.BoxGeometry(0.9, 1.1, 0.7))
  const seatMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#221f2a', roughness: 0.7, metalness: 0.3, emissive: '#0c0c0e', emissiveIntensity: 0.5 }))
  const plateGeo = useDisposable(() => new THREE.PlaneGeometry(0.5, 0.1))
  const plateMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: DV_COLOR.paper, toneMapped: false }))
  const dialTex = useDisposable(() => makeDialTexture({ size: lite ? 768 : 1024, numerals: 'roman', color: DV_COLOR.gold }), [lite])
  const starGeo = useDisposable(() => makeStarGeometry(0.55, 0.08))
  const floorTex = useDisposable(() => makeMarbleTexture({ kind: 'black', size: lite ? 512 : 1024, seed: 9, repeat: [2, 2] }), [lite])
  const pulpitTex = useDisposable(() => makeMarbleTexture({ kind: 'black', size: 256, seed: 4 }))
  const judgeMat = useRimMaterial({ color: '#e9e8e5', rim: '#ece5d8', rimPower: 2, rimStrength: 1.4, metalness: 1, roughness: 0.22, emissive: '#1f1f22', emissiveIntensity: 0.4 })
  useEnvironment(0.8)

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    const p = new THREE.Vector3()
    const color = new THREE.Color()
    for (let tier = 0; tier < 2; tier++) {
      const r = tier ? 7.2 : 5.6
      for (let i = 0; i < perTier; i++) {
        const a = -1.25 + (i / (perTier - 1)) * 2.5
        const k = tier * perTier + i
        p.set(Math.sin(a) * r, 0.55 + tier * 0.9, -Math.cos(a) * r)
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a)
        m.compose(p, q, s)
        seats.current?.setMatrixAt(k, m)
        p.set(Math.sin(a) * (r - 0.36), 0.75 + tier * 0.9, -Math.cos(a) * (r - 0.36))
        m.compose(p, q, s)
        plates.current?.setMatrixAt(k, m)
        plates.current?.setColorAt(k, color.set(k % 5 === 2 ? DV_COLOR.violetText : DV_COLOR.porcelain))
      }
    }
    if (seats.current) seats.current.instanceMatrix.needsUpdate = true
    if (plates.current) {
      plates.current.instanceMatrix.needsUpdate = true
      if (plates.current.instanceColor) plates.current.instanceColor.needsUpdate = true
    }
  }, [perTier])

  useEffect(() => {
    if (top.current) top.current.target = target
  }, [target])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime
    const p = pulse.current.pulse
    if (judge.current) {
      judge.current.rotation.y += dt * 0.35 * (0.5 + intensity)
      judge.current.position.y = 2.1 + Math.sin(t * 0.8) * 0.06
    }
    if (floorDial.current) floorDial.current.rotation.z += dt * 0.02
    if (top.current) {
      top.current.intensity = (90 + p * 330) * intensity
      // aço frio em repouso; rubi só durante o alerta
      top.current.color.setRGB(0.86 - p * 0.22, 0.85 - p * 0.78, 0.82 - p * 0.7)
    }
    plateMat.color.setRGB(0.94, 0.9 - p * 0.7, 0.82 - p * 0.7)
  })

  return (
    <>
      <color attach="background" args={['#070609']} />
      <fog attach="fog" args={['#070609', 8, 22]} />
      <CameraRig pos={[0, 3.2, 8.4]} look={[0, 1.3, -1.5]} orbit={0.22} drift={0.12} />
      <ambientLight intensity={0.7} color="#858393" />
      <hemisphereLight args={['#b7b3c9', '#070609', 0.5]} />
      <pointLight position={[-6, 3, 2]} intensity={60 * intensity} distance={16} decay={1.4} color={DV_COLOR.violet} />
      <pointLight position={[6, 3, 2]} intensity={45 * intensity} distance={16} decay={1.4} color={DV_COLOR.cobaltDeep} />
      <pointLight position={[0, 2.6, -6]} intensity={30 * intensity} distance={12} decay={1.4} color={DV_COLOR.violet} />
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight ref={top} position={[0, 9, 1]} angle={0.5} penumbra={0.6} decay={1.2} distance={22} intensity={160} color="#dbd8d2" />
      <instancedMesh ref={seats} args={[seatGeo, seatMat, total]} />
      <instancedMesh ref={plates} args={[plateGeo, plateMat, total]} />
      {/* piso: disco escuro + mostrador gravado */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial map={floorTex} color="#9a98a6" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh ref={floorDial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[7.5, 7.5]} />
        <meshBasicMaterial map={dialTex} transparent opacity={0.8 * intensity} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* púlpito central e o juiz (estrela do sigilo) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 1, 24]} />
        <meshStandardMaterial map={pulpitTex} color="#8c8b90" metalness={0.2} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.015, 6, 48]} />
        <meshStandardMaterial color={DV_COLOR.gold} metalness={0.9} roughness={0.3} emissive={DV_COLOR.goldDeep} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={judge} geometry={starGeo} material={judgeMat} position={[0, 2.1, 0]} />
      <Dust count={lite ? 70 : 150} color="#ece5d8" area={[10, 6, 10]} center={[0, 3, -1]} speed={0.06} size={0.05} opacity={0.4 * intensity} />
    </>
  )
}

/* ─────────────────────── CLOCKHALL (Jornada: salão de valsa assombrado) ─────────────────────── */

/** Engrenagem extrudada (dentes trapezoidais, furo central). */
function makeGearGeometry(r: number, teeth: number, depth: number) {
  const s = new THREE.Shape()
  const ri = r * 0.84
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2
    const st = (Math.PI * 2) / teeth
    const pts: [number, number][] = [
      [Math.cos(a0) * ri, Math.sin(a0) * ri],
      [Math.cos(a0 + st * 0.18) * r, Math.sin(a0 + st * 0.18) * r],
      [Math.cos(a0 + st * 0.42) * r, Math.sin(a0 + st * 0.42) * r],
      [Math.cos(a0 + st * 0.6) * ri, Math.sin(a0 + st * 0.6) * ri],
    ]
    pts.forEach(([x, y], k) => (i === 0 && k === 0 ? s.moveTo(x, y) : s.lineTo(x, y)))
  }
  s.closePath()
  // janelas entre os raios
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    const h = new THREE.Path()
    h.absarc(Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48, r * 0.17, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 })
  g.translate(0, 0, -depth / 2)
  return g
}

/** Ogiva (arco gótico apontado) de largura w e altura h, base em y=0, com UV normalizado. */
function makeOgiveGeometry(w: number, h: number) {
  const s = new THREE.Shape()
  const r = w * 0.5
  const spring = h - w * 0.86
  s.moveTo(-r, 0)
  s.lineTo(-r, spring)
  s.quadraticCurveTo(-r, spring + w * 0.62, 0, h)
  s.quadraticCurveTo(r, spring + w * 0.62, r, spring)
  s.lineTo(r, 0)
  s.closePath()
  const g = new THREE.ShapeGeometry(s, 12)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + r) / w, p.getY(i) / h)
  uv.needsUpdate = true
  return g
}

/** Lanterna pendente 3D: corrente, chapéu, vidro aceso, base e halo. Balança devagar. */
function Lantern3D({ position, chain, phase, brass, glowTex, glassMat, intensity }: {
  position: [number, number, number]
  chain: number
  phase: number
  brass: THREE.Material
  glowTex: THREE.Texture
  glassMat: THREE.Material
  intensity: number
}) {
  const g = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (g.current) {
      g.current.rotation.z = Math.sin(t * 0.45 + phase) * 0.035
      g.current.rotation.x = Math.cos(t * 0.38 + phase) * 0.02
    }
  })
  return (
    <group ref={g} position={position}>
      <mesh position={[0, -chain / 2, 0]} material={brass}>
        <cylinderGeometry args={[0.012, 0.012, chain, 4]} />
      </mesh>
      <group position={[0, -chain, 0]}>
        <mesh position={[0, -0.1, 0]} material={brass}>
          <coneGeometry args={[0.26, 0.26, 6]} />
        </mesh>
        <mesh position={[0, -0.48, 0]} material={glassMat}>
          <cylinderGeometry args={[0.18, 0.15, 0.5, 6, 1]} />
        </mesh>
        <mesh position={[0, -0.76, 0]} material={brass}>
          <coneGeometry args={[0.2, 0.14, 6]} />
        </mesh>
        <mesh position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]} material={brass}>
          <coneGeometry args={[0.05, 0.16, 4]} />
        </mesh>
        <sprite position={[0, -0.48, 0]} scale={[1.9, 1.9, 1]}>
          <spriteMaterial map={glowTex} color="#efe9dc" transparent opacity={0.75 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      </group>
    </group>
  )
}

/**
 * Salão do relógio: mostrador gigante (céu noturno atrás do vidro, numerais romanos, aros de latão,
 * ponteiros lentos e engrenagens), arcos góticos com vitrais, colunas, balaustrada, lanternas
 * pendentes, piso xadrez de mármore que reflete o mostrador (cópia espelhada sob um piso
 * semitransparente — sem passe extra de render) e poeira dourada. A câmera recua sozinha em tela
 * retrato para o mostrador caber.
 */
function ClockhallPreset({ intensity, alert, lite }: PresetProps) {
  const size = useThree((st) => st.size)
  const fog = useRef<THREE.Fog>(null)
  const hourA = useRef<THREE.Group>(null)
  const minA = useRef<THREE.Group>(null)
  const hourB = useRef<THREE.Group>(null)
  const minB = useRef<THREE.Group>(null)
  const gear1 = useRef<THREE.Mesh>(null)
  const gear2 = useRef<THREE.Mesh>(null)
  const gear3 = useRef<THREE.Mesh>(null)
  const balusters = useRef<THREE.InstancedMesh>(null)
  const pillars = useRef<THREE.InstancedMesh>(null)
  const look = useMemo(() => new THREE.Vector3(), [])

  const DIAL_Y = 8.4
  const DIAL_Z = -11.8
  const R = 6.1

  const skyTex = useDisposable(() => makeSkyDiscTexture(lite ? 512 : 1024), [lite])
  const dialTex = useDisposable(() => makeDialTexture({ size: lite ? 1024 : 2048, numerals: 'roman', ticks: 60, color: '#e2dccf', inner: 0.6 }), [lite])
  const floorDialTex = useDisposable(() => makeDialTexture({ size: 1024, numerals: 'roman', ticks: 60, color: DV_COLOR.gold, inner: 0.55 }))
  const floorTex = useDisposable(() => {
    const t = makeMarbleCheckerTexture({ size: lite ? 768 : 1024, cells: 4, seed: 31 })
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(7, 7)
    return t
  }, [lite])
  const windowTex = useDisposable(() => makeGothicWindowTexture())
  const glowTex = useDisposable(() => makeGlowTexture(128))
  const ogiveGeo = useDisposable(() => makeOgiveGeometry(2.6, 7.4))
  const ogiveFrameGeo = useDisposable(() => makeOgiveGeometry(3.1, 8))
  const gearGeoA = useDisposable(() => makeGearGeometry(1.25, 18, 0.12))
  const gearGeoB = useDisposable(() => makeGearGeometry(0.8, 12, 0.1))
  const pillarGeo = useDisposable(() => makeColumnGeometry(lite), [lite])
  const pillarMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#4a4a50', roughness: 0.55, metalness: 0.1, emissive: '#111114', emissiveIntensity: 0.6 }))
  const balusterGeo = useDisposable(() => new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.1, 0.06], [0.05, 0.12], [0.09, 0.4], [0.05, 0.62], [0.07, 0.7], [0.1, 0.74], [0.1, 0.8], [0, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)), 8))
  const stoneMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#2a2834', roughness: 0.6, metalness: 0.15, emissive: '#0c0b14', emissiveIntensity: 0.5 }))
  const brass = useRimMaterial({ color: DV_COLOR.gold, rim: DV_COLOR.goldBright, rimPower: 2, rimStrength: 1.1, metalness: 0.9, roughness: 0.3, emissive: DV_COLOR.goldDeep, emissiveIntensity: 0.8 })
  const glassMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: '#efe9dc', transparent: true, opacity: 0.55, toneMapped: false }))
  const rubyMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: DV_COLOR.blood, emissive: '#5a0710', emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.4 }))
  useEnvironment(0.7)

  const BAL_N = lite ? 26 : 40
  const PIL = useMemo(() => [-13.6, -7.4, 7.4, 13.6], [])
  const lanterns = useMemo(
    () =>
      [
        { p: [-4.4, 17, -6.5], c: 5.4, ph: 0 },
        { p: [4.9, 17, -7.5], c: 4.2, ph: 1.7 },
        { p: [-7.6, 17, -3], c: 7.6, ph: 3.1 },
        ...(lite ? [] : [{ p: [7.2, 17, -2.4], c: 6.6, ph: 4.4 }, { p: [-1.6, 17, -9.5], c: 2.4, ph: 2.2 }, { p: [2.6, 17, -4], c: 8.4, ph: 5.3 }]),
      ] as { p: [number, number, number]; c: number; ph: number }[],
    [lite],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    if (balusters.current) {
      for (let i = 0; i < BAL_N; i++) {
        const x = -15 + (i / (BAL_N - 1)) * 30
        m.makeTranslation(x, 0.12, -7.2)
        balusters.current.setMatrixAt(i, m)
      }
      balusters.current.instanceMatrix.needsUpdate = true
    }
    if (pillars.current) {
      PIL.forEach((x, i) => {
        m.makeScale(1.1, 1.45, 1.1).setPosition(x, 0, -10.6)
        pillars.current!.setMatrixAt(i, m)
      })
      pillars.current.instanceMatrix.needsUpdate = true
    }
  }, [BAL_N, PIL])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime
    // câmera: recua em tela retrato para o mostrador caber; deriva lenta
    const aspect = size.width / Math.max(1, size.height)
    const tanH = Math.tan(THREE.MathUtils.degToRad(48 / 2)) * aspect
    const dist = THREE.MathUtils.clamp(9 / tanH, 23, 34)
    const cam = state.camera
    cam.position.set(Math.sin(t * 0.05) * 0.6, 5.4 + Math.cos(t * 0.07) * 0.15, DIAL_Z + dist)
    cam.lookAt(look.set(0, 5.4, DIAL_Z))
    if (fog.current) {
      fog.current.near = dist * 0.6
      fog.current.far = dist + 22
    }
    // ponteiros lentos (minuto: 1 volta em 4 min; hora: 48 min) + espelho
    const mn = -((t + 70) / 240) * Math.PI * 2
    const hr = -((t + 1500) / 2880) * Math.PI * 2
    if (minA.current) minA.current.rotation.z = mn
    if (hourA.current) hourA.current.rotation.z = hr
    if (minB.current) minB.current.rotation.z = mn
    if (hourB.current) hourB.current.rotation.z = hr
    if (gear1.current) gear1.current.rotation.z += dt * 0.12
    if (gear2.current) gear2.current.rotation.z -= dt * 0.19
    if (gear3.current) gear3.current.rotation.z += dt * 0.08
  })

  // mostrador (reutilizado no reflexo)
  const dial = (hour: React.RefObject<THREE.Group | null>, min: React.RefObject<THREE.Group | null>, mirror = false) => (
    <group>
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[R, lite ? 48 : 72]} />
        <meshBasicMaterial map={skyTex} side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[R * 2.06, R * 2.06]} />
        <meshBasicMaterial map={dialTex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh material={brass}>
        <torusGeometry args={[R + 0.12, 0.11, 8, lite ? 72 : 120]} />
      </mesh>
      <mesh material={brass}>
        <torusGeometry args={[R + 0.42, 0.045, 6, lite ? 72 : 120]} />
      </mesh>
      {!mirror && (
        <mesh material={brass}>
          <torusGeometry args={[R * 0.42, 0.03, 6, 72]} />
        </mesh>
      )}
      <group ref={hour} position={[0, 0, 0.12]}>
        <mesh position={[0, R * 0.28, 0]} material={brass}>
          <boxGeometry args={[0.16, R * 0.62, 0.04]} />
        </mesh>
        <mesh position={[0, R * 0.62, 0]} rotation={[0, 0, Math.PI / 4]} material={brass}>
          <boxGeometry args={[0.42, 0.42, 0.04]} />
        </mesh>
      </group>
      <group ref={min} position={[0, 0, 0.18]}>
        <mesh position={[0, R * 0.4, 0]} material={brass}>
          <boxGeometry args={[0.09, R * 0.9, 0.04]} />
        </mesh>
        <mesh position={[0, R * 0.86, 0]} rotation={[0, 0, Math.PI / 4]} material={brass}>
          <boxGeometry args={[0.28, 0.28, 0.04]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
      </mesh>
    </group>
  )

  return (
    <>
      <color attach="background" args={['#0f0e13']} />
      <fog ref={fog} attach="fog" args={['#141318', 12, 40]} />
      <ambientLight intensity={0.55} color="#9c99ad" />
      <hemisphereLight args={['#b7b3c9', '#0c0c0e', 0.6]} />
      <directionalLight position={[2, 12, 10]} intensity={1.7 * intensity} color="#ebeae8" />
      <pointLight position={[0, 4, -5]} intensity={45 * intensity} distance={20} decay={1.4} color={DV_COLOR.violet} />
      <pointLight position={[-4.4, 10.5, -6.5]} intensity={10 * intensity} distance={10} decay={1.5} color="#efe9dc" />
      {!lite && <pointLight position={[4.9, 12, -7.5]} intensity={8 * intensity} distance={10} decay={1.5} color="#efe9dc" />}
      <AlertLight alert={alert} position={[0, 5, -4]} power={30} />

      {/* parede do fundo */}
      <mesh position={[0, 9, -12.2]}>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#151419" roughness={0.9} />
      </mesh>
      {/* arco gótico que emoldura o mostrador */}
      <mesh position={[0, 0, -12.1]} scale={[5.4, 2.25, 1]} geometry={ogiveFrameGeo}>
        <meshStandardMaterial color="#1d1c22" roughness={0.8} emissive="#17161d" emissiveIntensity={0.6} />
      </mesh>
      {/* mostrador e engrenagens */}
      <group position={[0, DIAL_Y, DIAL_Z]}>
        {dial(hourA, minA)}
        <mesh ref={gear1} geometry={gearGeoA} material={brass} position={[R * 0.82, -R * 0.78, -0.12]} />
        <mesh ref={gear2} geometry={gearGeoB} material={brass} position={[R * 0.82 + 1.75, -R * 0.78 + 0.55, -0.1]} />
        <mesh ref={gear3} geometry={gearGeoA} material={brass} position={[-R * 0.9, R * 0.74, -0.12]} scale={0.8} />
        {/* gotas de rubi penduradas no aro (joia, não alerta) */}
        {[-0.62, 0.4, 0.95].map((a, i) => (
          <group key={i} position={[Math.sin(a) * (R + 0.2), -Math.cos(a) * (R + 0.2), 0.2]}>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 1, 3]} />
              <meshBasicMaterial color="#6b6357" />
            </mesh>
            <mesh position={[0, -1.08, 0]} scale={[0.7, 1.3, 0.7]} material={rubyMat}>
              <octahedronGeometry args={[0.12, 0]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* vitrais em ogiva nas laterais */}
      {(lite ? [-10.5, 10.5] : [-10.5, 10.5, -16.6, 16.6]).map((x) => (
        <group key={x} position={[x, 1.6, -11.9]}>
          <mesh geometry={ogiveFrameGeo} position={[0, -0.3, -0.05]}>
            <meshStandardMaterial color="#0d0c14" roughness={0.9} />
          </mesh>
          <mesh geometry={ogiveGeo}>
            <meshBasicMaterial map={windowTex} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={pillars} args={[pillarGeo, pillarMat, PIL.length]} />

      {/* balaustrada */}
      <instancedMesh ref={balusters} args={[balusterGeo, stoneMat, BAL_N]} />
      <mesh position={[0, 0.06, -7.2]} material={stoneMat}>
        <boxGeometry args={[30.6, 0.12, 0.34]} />
      </mesh>
      <mesh position={[0, 0.98, -7.2]} material={stoneMat}>
        <boxGeometry args={[30.6, 0.12, 0.34]} />
      </mesh>
      <mesh position={[0, 1.05, -7.04]} material={brass}>
        <boxGeometry args={[30.6, 0.02, 0.02]} />
      </mesh>

      {/* lanternas pendentes */}
      {lanterns.map((l, i) => (
        <Lantern3D key={i} position={l.p} chain={l.c} phase={l.ph} brass={brass} glowTex={glowTex} glassMat={glassMat} intensity={intensity} />
      ))}

      {/* reflexo: cópia espelhada do mostrador e dos halos, vista através do piso */}
      <group scale={[1, -1, 1]}>
        <group position={[0, DIAL_Y, DIAL_Z]}>{dial(hourB, minB, true)}</group>
        {lanterns.slice(0, 4).map((l, i) => (
          <sprite key={i} position={[l.p[0], l.p[1] - l.c - 0.48, l.p[2]]} scale={[1.6, 1.6, 1]}>
            <spriteMaterial map={glowTex} color="#efe9dc" transparent opacity={0.5 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        ))}
      </group>
      {/* piso xadrez de mármore (semitransparente = espelho encerado) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} renderOrder={1}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial map={floorTex} color="#c4c3c0" roughness={0.18} metalness={0.15} transparent opacity={0.74} />
      </mesh>
      {/* mostrador gravado no piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2.5]} renderOrder={2}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={floorDialTex} transparent opacity={0.4 * intensity} depthWrite={false} toneMapped={false} />
      </mesh>

      <Dust count={lite ? 90 : 220} color={DV_COLOR.goldBright} area={[22, 14, 14]} center={[0, 6, -5]} speed={0.12} size={lite ? 0.09 : 0.07} opacity={0.75 * intensity} />
      <Dust count={lite ? 30 : 70} color={DV_COLOR.violetText} area={[22, 14, 12]} center={[0, 7, -6]} speed={0.06} size={0.12} opacity={0.5 * intensity} />
    </>
  )
}

export const PRESETS: Record<ScenePreset, (p: PresetProps) => React.JSX.Element> = {
  sigil: SigilPreset,
  cathedral: CathedralPreset,
  table: TablePreset,
  corridor: CorridorPreset,
  tribunal: TribunalPreset,
  clockhall: ClockhallPreset,
}

/** Câmera inicial (antes do primeiro frame) por preset. */
export const PRESET_CAMERA: Record<ScenePreset, { position: [number, number, number]; fov: number }> = {
  sigil: { position: [0, 0, 8], fov: 34 },
  cathedral: { position: [0, 1.6, 8], fov: 52 },
  table: { position: [0, 4.4, 5.6], fov: 42 },
  corridor: { position: [0, 1.45, 4], fov: 58 },
  tribunal: { position: [0, 3.4, 9.2], fov: 46 },
  clockhall: { position: [0, 2.6, 6], fov: 48 },
}
