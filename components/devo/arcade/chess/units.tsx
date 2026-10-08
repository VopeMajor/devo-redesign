'use client'

import type { PieceSymbol } from 'chess.js'
import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import type { PieceSet, SidePalette } from '@/lib/devo/arcade/chess-themes'

export type UnitMats = {
  armor: THREE.MeshStandardMaterial
  cloth: THREE.MeshStandardMaterial
  trim: THREE.MeshStandardMaterial
  skin: THREE.MeshStandardMaterial
  magic: THREE.MeshStandardMaterial
  base: THREE.MeshStandardMaterial
  dark: THREE.MeshStandardMaterial
  wood: THREE.MeshStandardMaterial
}

export function useUnitMats(p: SidePalette, set: PieceSet): UnitMats {
  return useMemo(
    () => ({
      armor: new THREE.MeshStandardMaterial({ color: p.armor, metalness: set.metalness, roughness: set.roughness }),
      cloth: new THREE.MeshStandardMaterial({ color: p.cloth, roughness: 0.75, side: THREE.DoubleSide }),
      trim: new THREE.MeshStandardMaterial({ color: p.trim, metalness: 0.8, roughness: 0.28, emissive: p.trim, emissiveIntensity: 0.08 }),
      skin: new THREE.MeshStandardMaterial({ color: p.skin, roughness: 0.6 }),
      magic: new THREE.MeshStandardMaterial({ color: p.magic, emissive: p.magic, emissiveIntensity: 1.6, roughness: 0.2 }),
      base: new THREE.MeshStandardMaterial({ color: p.base, metalness: 0.4, roughness: 0.4, emissive: p.rim, emissiveIntensity: 0.18 }),
      dark: new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.7, metalness: 0.3 }),
      wood: new THREE.MeshStandardMaterial({ color: '#6b4a2c', roughness: 0.8 }),
    }),
    [p, set],
  )
}

export type ModelProps = {
  m: UnitMats
  arm: RefObject<THREE.Group | null>
  off: RefObject<THREE.Group | null>
  cape: RefObject<THREE.Mesh | null>
}

function Base({ m, r = 0.36 }: { m: UnitMats; r?: number }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} material={m.base} castShadow receiveShadow>
        <cylinderGeometry args={[r, r + 0.03, 0.06, 20]} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.trim}>
        <ringGeometry args={[r - 0.05, r - 0.02, 24]} />
      </mesh>
    </group>
  )
}

function Head({ m, y, helm = 'none' }: { m: UnitMats; y: number; helm?: 'cap' | 'great' | 'none' }) {
  return (
    <group position={[0, y, 0]}>
      <mesh material={m.skin} castShadow>
        <sphereGeometry args={[0.085, 12, 10]} />
      </mesh>
      {helm === 'cap' && (
        <mesh position={[0, 0.03, 0]} material={m.armor} castShadow>
          <sphereGeometry args={[0.095, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
      {helm === 'great' && (
        <group>
          <mesh position={[0, 0.01, 0]} material={m.armor} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.19, 12]} />
          </mesh>
          <mesh position={[0, 0, 0.098]} material={m.dark}>
            <boxGeometry args={[0.13, 0.025, 0.01]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Pawn({ m, arm, off }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.3} />
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]} material={m.dark} castShadow>
          <boxGeometry args={[0.07, 0.2, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0]} material={m.armor} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.22, 10]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={m.cloth} castShadow>
        <cylinderGeometry args={[0.135, 0.15, 0.08, 10]} />
      </mesh>
      <Head m={m} y={0.55} helm="cap" />
      <group ref={arm} position={[0.15, 0.44, 0]}>
        <mesh position={[0, -0.07, 0]} material={m.armor}>
          <boxGeometry args={[0.05, 0.14, 0.05]} />
        </mesh>
        <group position={[0, -0.12, 0.03]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
          <mesh position={[0, 0.12, 0]} material={m.wood}>
            <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={m.trim}>
            <coneGeometry args={[0.028, 0.09, 6]} />
          </mesh>
        </group>
      </group>
      <group ref={off} position={[-0.15, 0.38, 0.04]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.cloth} castShadow>
          <cylinderGeometry args={[0.085, 0.085, 0.025, 14]} />
        </mesh>
        <mesh position={[0, 0, 0.015]} material={m.trim}>
          <sphereGeometry args={[0.022, 8, 6]} />
        </mesh>
      </group>
    </group>
  )
}

function Rook({ m, arm, off }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.38} />
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} material={m.armor} castShadow>
          <boxGeometry args={[0.1, 0.26, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 0.46, 0]} material={m.armor} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={m.cloth} castShadow>
        <boxGeometry args={[0.32, 0.08, 0.22]} />
      </mesh>
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]} material={m.trim} castShadow>
          <sphereGeometry args={[0.075, 10, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.72, 0]} scale={1.15}>
        <Head m={m} y={0} helm="great" />
      </group>
      <group ref={arm} position={[0.22, 0.56, 0]}>
        <mesh position={[0, -0.09, 0]} material={m.armor}>
          <boxGeometry args={[0.08, 0.18, 0.08]} />
        </mesh>
        <group position={[0, -0.16, 0.05]} rotation={[Math.PI / 2 - 0.4, 0, 0]}>
          <mesh position={[0, 0.16, 0]} material={m.wood}>
            <cylinderGeometry args={[0.018, 0.018, 0.4, 6]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={m.armor} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.12]} />
          </mesh>
        </group>
      </group>
      <group ref={off} position={[-0.22, 0.42, 0.08]}>
        <mesh material={m.cloth} castShadow>
          <boxGeometry args={[0.05, 0.36, 0.22]} />
        </mesh>
        <mesh position={[-0.028, 0, 0]} material={m.trim}>
          <boxGeometry args={[0.01, 0.2, 0.04]} />
        </mesh>
      </group>
    </group>
  )
}

function Knight({ m, arm, cape }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.38} />
      {[
        [-0.08, 0.13],
        [0.08, 0.13],
        [-0.08, -0.13],
        [0.08, -0.13],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.16, z]} material={m.dark} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 0.22, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.cloth} castShadow>
        <capsuleGeometry args={[0.11, 0.22, 4, 10]} />
      </mesh>
      <mesh position={[0, 0.44, 0.17]} rotation={[-0.6, 0, 0]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.2, 8]} />
      </mesh>
      <mesh position={[0, 0.53, 0.25]} rotation={[0.5, 0, 0]} material={m.armor} castShadow>
        <boxGeometry args={[0.09, 0.09, 0.18]} />
      </mesh>
      <mesh position={[0, 0.36, -0.25]} rotation={[0.8, 0, 0]} material={m.dark}>
        <coneGeometry args={[0.035, 0.18, 6]} />
      </mesh>
      <mesh position={[0, 0.55, -0.02]} material={m.armor} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 10]} />
      </mesh>
      <Head m={m} y={0.72} helm="great" />
      <mesh position={[0, 0.86, -0.02]} material={m.cloth}>
        <coneGeometry args={[0.03, 0.12, 6]} />
      </mesh>
      <mesh ref={cape} position={[0, 0.56, -0.11]} rotation={[0.25, 0, 0]} material={m.cloth} castShadow>
        <planeGeometry args={[0.2, 0.3, 1, 3]} />
      </mesh>
      <group ref={arm} position={[0.11, 0.62, 0]}>
        <group position={[0, -0.05, 0.04]} rotation={[Math.PI / 2 - 0.05, 0, 0]}>
          <mesh position={[0, 0.2, 0]} material={m.wood}>
            <cylinderGeometry args={[0.012, 0.02, 0.62, 6]} />
          </mesh>
          <mesh position={[0, 0.54, 0]} material={m.trim}>
            <coneGeometry args={[0.026, 0.1, 6]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Bishop({ m, arm }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.32} />
      <mesh position={[0, 0.3, 0]} material={m.cloth} castShadow>
        <coneGeometry args={[0.2, 0.5, 14]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
        <torusGeometry args={[0.15, 0.012, 6, 18]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={m.armor} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 10]} />
      </mesh>
      <Head m={m} y={0.62} />
      <mesh position={[0, 0.7, -0.01]} material={m.cloth} castShadow>
        <coneGeometry args={[0.105, 0.26, 12, 1, true]} />
      </mesh>
      <mesh position={[0, 0.84, -0.01]} material={m.trim}>
        <sphereGeometry args={[0.02, 6, 6]} />
      </mesh>
      <group ref={arm} position={[0.14, 0.5, 0.02]}>
        <mesh position={[0, -0.06, 0]} material={m.cloth}>
          <boxGeometry args={[0.05, 0.13, 0.05]} />
        </mesh>
        <group position={[0, -0.1, 0.02]}>
          <mesh position={[0, 0.12, 0]} material={m.wood}>
            <cylinderGeometry args={[0.013, 0.013, 0.62, 6]} />
          </mesh>
          <mesh position={[0, 0.45, 0]} material={m.trim}>
            <torusGeometry args={[0.04, 0.008, 6, 14]} />
          </mesh>
          <mesh position={[0, 0.45, 0]} material={m.magic}>
            <sphereGeometry args={[0.032, 10, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Queen({ m, arm, cape }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.36} />
      <mesh position={[0, 0.3, 0]} material={m.cloth} castShadow>
        <coneGeometry args={[0.24, 0.52, 18]} />
      </mesh>
      {[0.12, 0.3].map((y, i) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
          <torusGeometry args={[0.2 - i * 0.07, 0.012, 6, 22]} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0]} material={m.armor} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 12]} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.66, 0]} material={m.trim}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      ))}
      <Head m={m} y={0.77} />
      <group position={[0, 0.86, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
          <torusGeometry args={[0.075, 0.016, 6, 16]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.075, 0.04, Math.sin(a) * 0.075]} material={m.trim}>
              <coneGeometry args={[0.016, 0.07, 5]} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.03, 0.08]} material={m.magic}>
          <sphereGeometry args={[0.018, 6, 6]} />
        </mesh>
      </group>
      <mesh ref={cape} position={[0, 0.48, -0.14]} rotation={[0.12, 0, 0]} material={m.cloth} castShadow>
        <planeGeometry args={[0.32, 0.52, 1, 4]} />
      </mesh>
      <group ref={arm} position={[0.14, 0.64, 0.02]}>
        <mesh position={[0, -0.07, 0]} material={m.armor}>
          <boxGeometry args={[0.045, 0.14, 0.045]} />
        </mesh>
        <group position={[0, -0.12, 0.02]}>
          <mesh position={[0, 0.14, 0]} material={m.trim}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={m.magic}>
            <octahedronGeometry args={[0.05, 0]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function King({ m, arm, cape }: ModelProps) {
  return (
    <group>
      <Base m={m} r={0.38} />
      <mesh position={[0, 0.25, 0]} material={m.cloth} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 0.4, 14]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={m.armor} castShadow>
        <cylinderGeometry args={[0.12, 0.13, 0.24, 12]} />
      </mesh>
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.trim}>
        <torusGeometry args={[0.135, 0.015, 6, 18]} />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.66, 0]} material={m.armor} castShadow>
          <sphereGeometry args={[0.065, 10, 8]} />
        </mesh>
      ))}
      <Head m={m} y={0.8} />
      <group position={[0, 0.9, 0]}>
        <mesh material={m.trim}>
          <cylinderGeometry args={[0.085, 0.08, 0.06, 12, 1, true]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} material={m.trim}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
        </mesh>
        <mesh position={[0, 0.1, 0]} material={m.trim}>
          <boxGeometry args={[0.07, 0.02, 0.02]} />
        </mesh>
      </group>
      <mesh ref={cape} position={[0, 0.5, -0.16]} rotation={[0.1, 0, 0]} material={m.cloth} castShadow>
        <planeGeometry args={[0.36, 0.6, 1, 4]} />
      </mesh>
      <group ref={arm} position={[0.19, 0.62, 0.02]}>
        <mesh position={[0, -0.08, 0]} material={m.armor}>
          <boxGeometry args={[0.06, 0.16, 0.06]} />
        </mesh>
        <group position={[0, -0.15, 0.03]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
          <mesh position={[0, 0.02, 0]} material={m.trim}>
            <boxGeometry args={[0.1, 0.018, 0.02]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={m.armor}>
            <boxGeometry args={[0.03, 0.34, 0.01]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export const MODELS: Record<PieceSymbol, (p: ModelProps) => React.JSX.Element> = { p: Pawn, r: Rook, n: Knight, b: Bishop, q: Queen, k: King }
