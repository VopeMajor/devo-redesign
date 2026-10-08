'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DV_COLOR } from '../tokens'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { makeCardBackTexture, makeCheckerTexture, makeDialTexture, makeDoorTexture, makeEnvTexture, makeGlowTexture, makeMistTexture, makeShaftTexture } from './textures'
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
  const hoursTex = useDisposable(() => makeDialTexture({ size: lite ? 512 : 768, numerals: 'hours72', ticks: 72, color: DV_COLOR.cobaltText, inner: 0.6 }), [lite])
  const glowTex = useDisposable(() => makeGlowTexture(128))
  const starGeo = useDisposable(() => makeStarGeometry(1, 0.1))
  const starMat = useRimMaterial({ color: '#8ea4ff', rim: '#9fb4ff', rimPower: 2.4, rimStrength: 1.5, metalness: 1, roughness: 0.26, emissive: '#0b1a4d', emissiveIntensity: 0.4 })
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
      glowMat.current.color.setRGB(0.19 + p * 0.65, 0.36 - p * 0.24, 1 - p * 0.8)
      glowMat.current.opacity = 0.55 * intensity + p * 0.35
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4 * intensity} color={DV_COLOR.goldBright} />
      <pointLight position={[0, 0, 2.2]} intensity={8 * intensity} distance={7} color={DV_COLOR.cobalt} />
      <pointLight position={[-3, -2, 2]} intensity={3 * intensity} distance={8} color={DV_COLOR.cobaltDeep} />
      <AlertLight alert={alert} position={[0, 1, 3]} power={20} />

      <group ref={rig}>
        <sprite scale={[4.6, 4.6, 1]} position={[0, 0, -0.6]}>
          <spriteMaterial ref={glowMat} map={glowTex} color={DV_COLOR.cobalt} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
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
              <meshStandardMaterial color="#dfe6ff" metalness={0.9} roughness={0.25} emissive="#24348c" emissiveIntensity={0.35} />
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
            <meshBasicMaterial color={DV_COLOR.cobalt} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <Dust count={lite ? 120 : 260} color={DV_COLOR.goldBright} area={[9, 12, 5]} speed={0.14 * (0.5 + intensity)} size={lite ? 0.07 : 0.06} opacity={0.75 * intensity} />
      <Dust count={lite ? 30 : 60} color={DV_COLOR.cobaltText} area={[9, 12, 4]} speed={0.08} size={0.1} opacity={0.6 * intensity} />
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
  const pillarMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#4a5680', roughness: 0.78, metalness: 0.12, emissive: '#0a1128', emissiveIntensity: 0.5, flatShading: false }))
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
      <fog attach="fog" args={['#070b18', 6, 36]} />
      <CameraRig pos={[0, 1.6, 8]} look={[0, 3.2, -16]} drift={0.35} />
      <ambientLight intensity={0.9} color="#7f90d0" />
      <hemisphereLight args={['#9fb2ff', '#0a0f1c', 0.8]} />
      <directionalLight position={[2, 10, -6]} intensity={2.4 * intensity} color="#c9d4ff" />
      <pointLight position={[0, 6, -10]} intensity={90 * intensity} distance={30} decay={1.4} color={DV_COLOR.cobalt} />
      <pointLight position={[0, 3, 2]} intensity={30 * intensity} distance={14} decay={1.4} color={DV_COLOR.goldBright} />
      <AlertLight alert={alert} position={[0, 5, 0]} power={40} />
      <instancedMesh ref={pillars} args={[pillarGeo, pillarMat, count]} />
      {/* arquitrave sobre as colunas */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.1, 10.35, -14]}>
          <boxGeometry args={[1.3, 0.5, 44]} />
          <meshStandardMaterial color="#2a3354" roughness={0.85} />
        </mesh>
      ))}
      <MistLayers
        color="#9fb2ff"
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
        <meshStandardMaterial color="#1a2340" roughness={0.4} metalness={0.35} />
      </mesh>
      <group ref={shafts}>
        {[-1.6, 0.8, 2.2, -0.4].map((x, i) => (
          <mesh key={i} position={[x, 7, -6 - i * 4]} rotation={[0, 0, 0.32]}>
            <planeGeometry args={[1.1 + (i % 2) * 0.6, 16]} />
            <meshBasicMaterial map={shaftTex} color={i % 2 ? '#c9d4ff' : DV_COLOR.cobaltText} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
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
      <Dust count={lite ? 100 : 220} color="#c9d4ff" area={[8, 10, 26]} center={[0, 4, -10]} speed={0.1} size={0.08} opacity={0.6 * intensity} />
    </>
  )
}

/* ───────────────────────────── TABLE (Sala de Jogos) ───────────────────────────── */

function TablePreset({ intensity, alert, lite }: PresetProps) {
  const lamp = useRef<THREE.Group>(null)
  const spot = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const floorTex = useDisposable(() => {
    const t = makeCheckerTexture({ light: '#bdb5a0', dark: '#0a0d16', cells: 8 })
    t.repeat.set(5, 5)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  })
  const cardTex = useDisposable(() => makeCardBackTexture())
  const glowTex = useDisposable(() => makeGlowTexture(128))
  const pulse = useAlertPulse(alert)
  const cards = useMemo(
    () => [
      { p: [-0.9, 0.012, 0.4], r: 0.4 },
      { p: [-0.35, 0.014, 0.75], r: -0.2 },
      { p: [0.5, 0.016, 0.2], r: 0.9 },
      { p: [1.1, 0.018, 0.9], r: -0.6 },
      { p: [0.05, 0.02, -0.5], r: 0.15 },
    ] as { p: [number, number, number]; r: number }[],
    [],
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
      spot.current.intensity = (34 + Math.sin(t * 9) * 0.6) * intensity
      spot.current.color.setRGB(1, 0.9 - p * 0.6, 0.76 - p * 0.6)
    }
  })

  return (
    <>
      <color attach="background" args={[DV_COLOR.ink]} />
      <fog attach="fog" args={[DV_COLOR.ink, 5, 16]} />
      <CameraRig pos={[0, 4.4, 5.6]} look={[0, 0, 0]} drift={0.15} />
      <ambientLight intensity={0.18} color="#7b88b8" />
      <primitive object={target} position={[0, 0, 0]} />
      <group ref={lamp} position={[0, 3.4, 0]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 4, 4]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh>
          <coneGeometry args={[0.5, 0.42, 32, 1, true]} />
          <meshStandardMaterial color="#141a2c" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.012, 6, 48]} />
          <meshStandardMaterial color={DV_COLOR.gold} metalness={0.9} roughness={0.3} emissive={DV_COLOR.goldDeep} emissiveIntensity={0.6} />
        </mesh>
        <sprite position={[0, -0.18, 0]} scale={[0.7, 0.7, 1]}>
          <spriteMaterial map={glowTex} color="#fff2d6" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        {/* cone de luz visível */}
        <mesh position={[0, -1.75, 0]}>
          <coneGeometry args={[2.1, 3.1, 40, 1, true]} />
          <meshBasicMaterial color="#ffe9c2" transparent opacity={0.045 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <spotLight ref={spot} position={[0, -0.15, 0]} angle={0.62} penumbra={0.65} decay={1.2} distance={12} intensity={34} color="#fff0d2" />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial map={floorTex} roughness={0.42} metalness={0.15} />
      </mesh>
      {cards.map((c, i) => (
        <mesh key={i} position={c.p} rotation={[-Math.PI / 2, 0, c.r]}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshStandardMaterial map={cardTex} roughness={0.45} metalness={0.2} />
        </mesh>
      ))}
      <AlertLight alert={alert} position={[0, 2.5, 1.5]} power={18} />
      <Dust count={lite ? 60 : 140} color="#fff0d2" area={[3.2, 3.2, 3.2]} center={[0, 1.6, 0]} speed={0.05} size={0.035} opacity={0.7 * intensity} />
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
    const t = makeCheckerTexture({ light: '#4b4a52', dark: '#07090f', cells: 8 })
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
      <ambientLight intensity={0.3} color="#6f7cae" />
      <pointLight position={[0, 2.6, -2]} intensity={6 * intensity} distance={10} color="#ffe9c2" />
      <pointLight position={[0, 2.4, -14]} intensity={10 * intensity} distance={16} color={DV_COLOR.cobalt} />
      <AlertLight alert={alert} position={[0, 2.5, -4]} power={26} />
      <group ref={rig}>
        {Array.from({ length: doors }, (_, i) => {
          const z = -i * spacing
          return (
            <group key={i}>
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 1.6, 1.2, z]} rotation={[0, -side * Math.PI / 2, 0]}>
                  <mesh geometry={doorGeos[(i * 2 + (side > 0 ? 1 : 0)) % 8]}>
                    <meshStandardMaterial map={doorTex} roughness={0.7} metalness={0.2} emissive="#0b1430" emissiveIntensity={0.5} />
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
                  <spriteMaterial map={glowTex} color="#ffe6b8" transparent opacity={0.8 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
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
        <meshStandardMaterial color="#070a12" roughness={1} />
      </mesh>
      {/* porta final, com a fechadura acesa */}
      <group position={[0, 1.3, -34]}>
        <mesh>
          <planeGeometry args={[2.2, 2.9]} />
          <meshStandardMaterial color="#0d1324" emissive="#0b1430" emissiveIntensity={0.8} />
        </mesh>
        <sprite position={[0, -0.05, 0.1]} scale={[1.6, 1.6, 1]}>
          <spriteMaterial map={glowTex} color={DV_COLOR.paper} transparent opacity={0.9 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      </group>
      <Dust count={lite ? 60 : 120} color="#ffe9c2" area={[3, 3, 20]} center={[0, 1.5, -8]} speed={0.04} size={0.04} opacity={0.5 * intensity} />
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
  const seatMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#262a36', roughness: 0.75, metalness: 0.35, emissive: '#07090f', emissiveIntensity: 0.5 }))
  const plateGeo = useDisposable(() => new THREE.PlaneGeometry(0.5, 0.1))
  const plateMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: DV_COLOR.paper, toneMapped: false }))
  const dialTex = useDisposable(() => makeDialTexture({ size: lite ? 768 : 1024, numerals: 'roman', color: DV_COLOR.gold }), [lite])
  const starGeo = useDisposable(() => makeStarGeometry(0.55, 0.08))
  const judgeMat = useRimMaterial({ color: '#e9dcd8', rim: '#ff3a48', rimPower: 2, rimStrength: 1.8, metalness: 1, roughness: 0.22, emissive: '#3a0a12', emissiveIntensity: 0.4 })
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
        plates.current?.setColorAt(k, color.set(k % 5 === 2 ? DV_COLOR.cobaltText : DV_COLOR.paper))
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
      top.current.intensity = (160 + p * 260) * intensity
      top.current.color.setRGB(0.75 + p * 0.25, 0.16 + (1 - p) * 0.12, 0.2 + (1 - p) * 0.1)
    }
    plateMat.color.setRGB(0.94, 0.9 - p * 0.7, 0.82 - p * 0.7)
  })

  return (
    <>
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#04050a', 8, 22]} />
      <CameraRig pos={[0, 3.2, 8.4]} look={[0, 1.3, -1.5]} orbit={0.22} drift={0.12} />
      <ambientLight intensity={0.7} color="#6b78a8" />
      <hemisphereLight args={['#8a9cff', '#05060a', 0.5]} />
      <pointLight position={[-6, 3, 2]} intensity={60 * intensity} distance={16} decay={1.4} color={DV_COLOR.cobalt} />
      <pointLight position={[6, 3, 2]} intensity={45 * intensity} distance={16} decay={1.4} color={DV_COLOR.cobaltDeep} />
      <pointLight position={[0, 2.6, -6]} intensity={40 * intensity} distance={12} decay={1.4} color="#ff3a48" />
      <primitive object={target} position={[0, 0, 0]} />
      <spotLight ref={top} position={[0, 9, 1]} angle={0.5} penumbra={0.6} decay={1.2} distance={22} intensity={160} color="#c0303c" />
      <instancedMesh ref={seats} args={[seatGeo, seatMat, total]} />
      <instancedMesh ref={plates} args={[plateGeo, plateMat, total]} />
      {/* piso: disco escuro + mostrador gravado */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#0a0e19" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh ref={floorDial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[7.5, 7.5]} />
        <meshBasicMaterial map={dialTex} transparent opacity={0.8 * intensity} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* púlpito central e o juiz (estrela do sigilo) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 1, 24]} />
        <meshStandardMaterial color="#121a2e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.015, 6, 48]} />
        <meshStandardMaterial color={DV_COLOR.gold} metalness={0.9} roughness={0.3} emissive={DV_COLOR.goldDeep} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={judge} geometry={starGeo} material={judgeMat} position={[0, 2.1, 0]} />
      <Dust count={lite ? 70 : 150} color="#ffb3b8" area={[10, 6, 10]} center={[0, 3, -1]} speed={0.06} size={0.05} opacity={0.4 * intensity} />
    </>
  )
}

export const PRESETS: Record<ScenePreset, (p: PresetProps) => React.JSX.Element> = {
  sigil: SigilPreset,
  cathedral: CathedralPreset,
  table: TablePreset,
  corridor: CorridorPreset,
  tribunal: TribunalPreset,
}

/** Câmera inicial (antes do primeiro frame) por preset. */
export const PRESET_CAMERA: Record<ScenePreset, { position: [number, number, number]; fov: number }> = {
  sigil: { position: [0, 0, 8], fov: 34 },
  cathedral: { position: [0, 1.6, 8], fov: 52 },
  table: { position: [0, 4.4, 5.6], fov: 42 },
  corridor: { position: [0, 1.45, 4], fov: 58 },
  tribunal: { position: [0, 3.4, 9.2], fov: 46 },
}
