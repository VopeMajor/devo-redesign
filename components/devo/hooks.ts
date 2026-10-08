'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { isMuted, subscribeMuted } from '@/lib/devo/audio'

export function useMediaQuery(query: string, serverFallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  )
}

export function useMuted() {
  return useSyncExternalStore(subscribeMuted, isMuted, () => false)
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const INTERACTIVE_SELECTOR = 'button, a[href], input, textarea, select, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="radio"], [role="tab"], [role="checkbox"], [role="link"]'

/** O alvo do teclado já tem ação nativa (Espaço/Enter clicam um botão focado, digitam num campo…). */
export function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR)
}

/**
 * Teclas de avanço de diálogo (Enter/Espaço, e opcionalmente setas) — um único lugar para
 * prólogo, tutorial e aulas. Regras:
 * - ignora tecla segurada (`e.repeat`);
 * - ignora quando o foco está num elemento interativo (o clique nativo já trata; antes o mesmo
 *   Espaço avançava duas vezes);
 * - aplica um intervalo mínimo entre avanços (`minIntervalMs`).
 */
export function useAdvanceKeys(
  onAdvance: () => void,
  { onBack, arrows = false, enabled = true, minIntervalMs = 250 }: { onBack?: () => void; arrows?: boolean; enabled?: boolean; minIntervalMs?: number } = {},
) {
  const advanceRef = useRef(onAdvance)
  const backRef = useRef(onBack)
  advanceRef.current = onAdvance
  backRef.current = onBack
  const lastRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const forward = e.key === 'Enter' || e.key === ' ' || (arrows && e.key === 'ArrowRight')
      const backward = arrows && e.key === 'ArrowLeft' && !!backRef.current
      if (!forward && !backward) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (isInteractiveTarget(e.target)) return
      e.preventDefault()
      if (e.repeat) return
      const now = performance.now()
      if (now - lastRef.current < minIntervalMs) return
      lastRef.current = now
      if (forward) advanceRef.current()
      else backRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, arrows, minIntervalMs])
}
