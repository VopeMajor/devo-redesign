type FullscreenTarget = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FullscreenDoc = Document & { webkitFullscreenElement?: Element | null }

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches
}

/** Must be called synchronously inside a user gesture (click/keydown). */
export function enterFullscreen() {
  if (typeof document === 'undefined' || isStandalone()) return
  const doc = document as FullscreenDoc
  if (doc.fullscreenElement || doc.webkitFullscreenElement) return
  const el = document.documentElement as FullscreenTarget
  try {
    const request = el.requestFullscreen
      ? el.requestFullscreen({ navigationUI: 'hide' })
      : el.webkitRequestFullscreen?.()
    // Blocked inside iframes or unsupported (iPhone Safari): the 100dvh layout is the fallback.
    Promise.resolve(request).catch(() => {})
  } catch {}
}
