'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../../hooks'
import { SceneFallback } from './fallback'
import type { SceneFocus, ScenePreset } from './types'

const SceneCanvas = dynamic(() => import('./scene-canvas'), { ssr: false, loading: () => null })

/** Tempo máximo para o WebGL aparecer antes de ficarmos de vez no fallback estático. */
const READY_TIMEOUT_MS = 7000

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** 'none' = sem WebGL; 'soft' = renderizador por software (SwiftShader/llvmpipe): modo econômico. */
function webglTier(): 'none' | 'soft' | 'gpu' {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return 'none'
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer) ? 'soft' : 'gpu'
  } catch {
    return 'none'
  }
}

export type SceneBackdropProps = {
  preset: ScenePreset
  /** 0..1 (padrão 0.8). Abaixe para telas com muito texto. */
  intensity?: number
  /** Pulso vermelho: tempo crítico, eliminação, voto em andamento. */
  alert?: boolean
  /** Ponto focal do preset (só `sigil`). */
  focus?: SceneFocus
  /** Escurece por cima (0..1) para garantir contraste do texto. Padrão 0.25. */
  dim?: number
  /** Só monta o WebGL quando o bloco entra na tela (vitrines, listas). */
  lazy?: boolean
  /** Força o fallback estático (testes, economia de bateria). */
  staticOnly?: boolean
  className?: string
}

/**
 * Fundo 3D compartilhado. A primeira pintura é SEMPRE o fallback estático (gradiente + desenho
 * SVG do preset); o WebGL carrega depois (next/dynamic, ssr:false), entra com fade e substitui o
 * desenho. Pausa com a aba oculta ou fora da tela; com prefers-reduced-motion desenha um quadro só.
 * Se o WebGL falhar, lançar erro, perder o contexto ou demorar > 7s, fica no fallback.
 */
export function SceneBackdrop({ preset, intensity = 0.8, alert = false, focus, dim = 0.25, lazy = false, staticOnly = false, className }: SceneBackdropProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mount, setMount] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [onScreen, setOnScreen] = useState(!lazy)
  const [soft, setSoft] = useState(false)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const coarse = useMediaQuery('(pointer: coarse)')
  const narrow = useMediaQuery('(max-width: 767px)')
  const lite = coarse || narrow

  // Visibilidade da aba.
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden')
    on()
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  // Na tela? (pausa fora dela; com `lazy`, só monta quando aparecer)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Monta o WebGL depois da primeira pintura (ocioso), se suportado.
  useEffect(() => {
    if (staticOnly || failed || mount) return
    if (lazy && !onScreen) return
    const tier = webglTier()
    if (tier === 'none') {
      setFailed(true)
      return
    }
    setSoft(tier === 'soft')
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    let id = 0
    if (w.requestIdleCallback) id = w.requestIdleCallback(() => setMount(true), { timeout: 700 })
    else id = window.setTimeout(() => setMount(true), 120)
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [staticOnly, failed, mount, lazy, onScreen])

  // Desiste se demorar demais.
  useEffect(() => {
    if (!mount || ready || failed) return
    const t = window.setTimeout(() => setFailed(true), READY_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [mount, ready, failed])

  const live = mount && !failed && !staticOnly
  const frameloop = !visible || !onScreen ? 'never' : reduced ? 'demand' : 'always'

  return (
    <div ref={ref} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <SceneFallback preset={preset} focus={focus} alert={alert} showArt={!ready || !live} />
      {live && (
        <div className={cn('absolute inset-0 transition-opacity duration-700 ease-out', ready ? 'opacity-100' : 'opacity-0')}>
          <SceneBoundary onError={() => setFailed(true)}>
            <SceneCanvas
              preset={preset}
              intensity={Math.max(0, Math.min(1, intensity))}
              alert={alert}
              focus={focus}
              lite={lite || soft}
              soft={soft}
              frameloop={frameloop}
              onReady={() => setReady(true)}
              onFail={() => setFailed(true)}
            />
          </SceneBoundary>
        </div>
      )}
      {/* Camadas de acabamento: escurecer, vinheta, grão e pulso de alerta. */}
      {dim > 0 && <div className="absolute inset-0 bg-dv-ink" style={{ opacity: dim }} />}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,3,6,0.85)_100%)]" />
      <div className="devo-grain absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      {alert && (
        <div className="animate-dv-alert absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(170,20,32,0.35)_100%)] motion-reduce:opacity-60" />
      )}
    </div>
  )
}
