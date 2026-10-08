'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

/**
 * O botão voltar do aparelho fecha a camada do topo (janela, conversa, modal).
 * Mantemos sempre uma entrada "guarda" no histórico. O Chrome ignora entradas
 * criadas sem interação do usuário, então a guarda é recriada a cada toque/tecla,
 * não só dentro do popstate. Sem camadas abertas, o primeiro voltar mostra um aviso
 * e só o segundo, em até 2s, sai do site.
 */
type Entry = { id: number; run: () => void }

const stack: Entry[] = []
let seq = 0
let started = false
let exitArmedUntil = 0
let leaving = false

let hintVisible = false
const hintListeners = new Set<() => void>()
function setHint(v: boolean) {
  hintVisible = v
  hintListeners.forEach((l) => l())
}

const isGuarded = () => (window.history.state as { devoGuard?: boolean } | null)?.devoGuard === true

function arm() {
  if (leaving || isGuarded()) return
  window.history.pushState({ ...(window.history.state ?? {}), devoGuard: true }, '')
}

function onPopState() {
  if (leaving) return
  const top = stack[stack.length - 1]
  if (top) {
    top.run()
    arm()
    return
  }
  if (Date.now() < exitArmedUntil) {
    leaving = true
    window.history.back()
    return
  }
  exitArmedUntil = Date.now() + 2000
  setHint(true)
  window.setTimeout(() => setHint(false), 2000)
  arm()
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('popstate', onPopState)
  window.addEventListener('pointerdown', arm, { capture: true, passive: true })
  window.addEventListener('keydown', arm, { capture: true })
  arm()
}

export function useBackHandler(active: boolean, onBack: () => void) {
  const ref = useRef(onBack)
  ref.current = onBack

  useEffect(() => {
    start()
    if (!active) return
    const entry: Entry = { id: ++seq, run: () => ref.current() }
    stack.push(entry)
    return () => {
      const i = stack.findIndex((e) => e.id === entry.id)
      if (i >= 0) stack.splice(i, 1)
    }
  }, [active])
}

export function BackExitHint() {
  const visible = useSyncExternalStore(
    (l) => {
      start()
      hintListeners.add(l)
      return () => hintListeners.delete(l)
    },
    () => hintVisible,
    () => false,
  )
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {visible && (
        <span className="rounded-full border border-border bg-card/95 px-4 py-2 text-sm text-foreground shadow-lg">
          Pressione voltar de novo para sair
        </span>
      )}
    </div>
  )
}
