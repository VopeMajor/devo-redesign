'use client'

import { useSyncExternalStore } from 'react'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

type PwaState = {
  installEvent: InstallPromptEvent | null
  installed: boolean
  permission: NotificationPermission | 'unsupported'
  isIos: boolean
  isAndroid: boolean
  inIframe: boolean
}

const SERVER_STATE: PwaState = {
  installEvent: null,
  installed: false,
  permission: 'unsupported',
  isIos: false,
  isAndroid: false,
  inIframe: false,
}

type WindowWithInstall = Window & { __devoInstallEvent?: InstallPromptEvent | null }

let state: PwaState = SERVER_STATE
const listeners = new Set<() => void>()
let initialized = false

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const w = window as WindowWithInstall
  let inIframe = false
  try {
    inIframe = window.self !== window.top
  } catch {
    inIframe = true
  }
  state = {
    installEvent: w.__devoInstallEvent ?? null,
    installed: window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    isIos: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isAndroid: /android/i.test(navigator.userAgent),
    inIframe,
  }
  window.addEventListener('devo:installable', () => set({ installEvent: w.__devoInstallEvent ?? null }))
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    w.__devoInstallEvent = e as InstallPromptEvent
    set({ installEvent: e as InstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => {
    w.__devoInstallEvent = null
    set({ installed: true, installEvent: null })
  })
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        if ('Notification' in window && Notification.permission === 'granted') subscribePush()
      })
      .catch(() => {})
  }
}

function subscribe(listener: () => void) {
  init()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePwa() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  )
}

export async function promptInstall() {
  const event = state.installEvent
  if (!event) return false
  await event.prompt()
  const { outcome } = await event.userChoice
  ;(window as WindowWithInstall).__devoInstallEvent = null
  set({ installEvent: null, installed: outcome === 'accepted' })
  return outcome === 'accepted'
}

export async function requestNotifications() {
  if (!('Notification' in window)) return 'unsupported' as const
  const permission = await Notification.requestPermission()
  set({ permission })
  if (permission === 'granted') {
    await subscribePush()
    await showSystemNotification('O Anfitrião agradece', 'Agora eu posso te chamar mesmo quando você não estiver olhando.', true)
  }
  return permission
}

function base64ToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Registra o aparelho no servidor para receber notificações mesmo com o jogo fechado. */
export async function subscribePush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const res = await fetch('/api/push')
      const { publicKey } = (await res.json()) as { publicKey: string }
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) })
    }
    const saved = await fetch('/api/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
    return saved.ok
  } catch {
    return false
  }
}

export async function sendTestPush() {
  const ok = await subscribePush()
  if (!ok) return false
  const res = await fetch('/api/push/test', { method: 'POST' })
  return res.ok
}

export async function showSystemNotification(title: string, body: string, force = false) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (!force && document.visibilityState === 'visible') return
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png' }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, options)
    else new Notification(title, options)
  } catch {
    // Alguns navegadores bloqueiam o construtor direto; a notificação dentro do jogo continua valendo.
  }
}
