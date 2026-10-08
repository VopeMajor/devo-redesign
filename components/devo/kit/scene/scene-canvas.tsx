'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { PRESETS, PRESET_CAMERA } from './presets'
import type { SceneFocus, ScenePreset } from './types'

/**
 * Canvas R3F do SceneBackdrop. Carregado só no cliente via next/dynamic (não importe direto).
 * DPR ≤ 1.5, antialias desligado no celular, sem sombras, tonemapping ACES suave.
 */
export default function SceneCanvas({
  preset,
  intensity,
  alert,
  focus,
  lite,
  soft = false,
  frameloop,
  onReady,
  onFail,
}: {
  preset: ScenePreset
  intensity: number
  alert: boolean
  focus?: SceneFocus
  lite: boolean
  /** Renderizador por software: DPR 0.75 e 15 qps. */
  soft?: boolean
  frameloop: 'always' | 'demand' | 'never'
  onReady: () => void
  onFail: () => void
}) {
  const Preset = PRESETS[preset]
  // No celular: renderiza sob demanda a 30 qps (metade do custo; o movimento é lento de propósito).
  const throttle = (lite || soft) && frameloop === 'always'
  const cam = PRESET_CAMERA[preset]
  return (
    <Canvas
      dpr={soft ? 0.75 : lite ? [1, 1.25] : [1, 1.5]}
      frameloop={throttle ? 'demand' : frameloop}
      camera={{ position: cam.position, fov: cam.fov, near: 0.1, far: 80 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        const el = gl.domElement
        el.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
        // Espera dois quadros para não "piscar" a tela vazia.
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      {throttle && <Ticker fps={soft ? 15 : 30} />}
      <Preset intensity={intensity} alert={alert} focus={focus} lite={lite} />
    </Canvas>
  )
}

/** Pede um quadro a cada 1/fps s (usado com frameloop="demand"). */
function Ticker({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), 1000 / fps)
    return () => window.clearInterval(id)
  }, [fps, invalidate])
  return null
}
