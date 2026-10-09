'use client'

/**
 * Player da dublagem (DIRECAO-2 §5). Toca o arquivo gerado no CI (public/audio/voz/<id>.ogg|.m4a) e, se não
 * houver, cai para o speechSynthesis pt-BR do aparelho. Respeita o mudo global (audio.ts) e o botão
 * "Dublagem" (preferência local). Abaixa a trilha do prólogo enquanto alguém fala.
 *
 *   const ms = speakLine({ id, text, cast })   // duração estimada em ms (null = sem voz)
 *   stopVoice()
 */
import { useSyncExternalStore } from 'react'
import { duckPrologueMusic, isMuted, playSfx, subscribeMuted } from './audio'
import { RATO_LAUGH_ID, ttsText, type VoiceCast } from './voice-lines'

type Entry = { cast: string; duration: number }
type Manifest = { version: number; formats: string[]; lines: Record<string, Entry> }

const BASE = '/audio/voz'
const DUB_KEY = 'devo_dublagem'

let manifest: Manifest | null = null
let loading: Promise<Manifest | null> | null = null
let current: HTMLAudioElement | null = null
let speaking = false

/* ── Preferência "Dublagem" (liga/desliga) ─────────────────────────────────────────────── */
let dubbing = true
let dubLoaded = false
const dubListeners = new Set<() => void>()

function readDub() {
  if (dubLoaded || typeof window === 'undefined') return dubbing
  dubLoaded = true
  try {
    dubbing = window.localStorage.getItem(DUB_KEY) !== '0'
  } catch {
    dubbing = true
  }
  return dubbing
}

export function isDubbingOn() {
  return readDub()
}

export function setDubbing(on: boolean) {
  dubbing = on
  dubLoaded = true
  try {
    window.localStorage.setItem(DUB_KEY, on ? '1' : '0')
  } catch {
    /* modo privado: fica só na memória */
  }
  if (!on) stopVoice()
  dubListeners.forEach((l) => l())
}

export function useDubbing() {
  return useSyncExternalStore(
    (l) => {
      dubListeners.add(l)
      return () => dubListeners.delete(l)
    },
    readDub,
    () => true,
  )
}

/* ── Manifesto ─────────────────────────────────────────────────────────────────────────── */
export function loadVoiceManifest() {
  if (manifest || typeof window === 'undefined') return Promise.resolve(manifest)
  loading ??= fetch(`${BASE}/manifest.json`, { cache: 'force-cache' })
    .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
    .then((m) => (manifest = m && m.lines ? m : null))
    .catch(() => null)
  return loading
}

/** Duração (ms) da fala gerada, se existir. */
export function voiceDuration(id: string) {
  const d = manifest?.lines[id]?.duration
  return d ? Math.round(d * 1000) : null
}

let ext: 'ogg' | 'm4a' | null = null
function format() {
  if (ext) return ext
  const probe = typeof document !== 'undefined' ? document.createElement('audio') : null
  ext = probe && probe.canPlayType('audio/ogg; codecs="opus"') ? 'ogg' : 'm4a'
  return ext
}

/* ── Reserva: voz do aparelho ──────────────────────────────────────────────────────────── */
const SYNTH: Record<VoiceCast, { pitch: number; rate: number }> = {
  narrator: { pitch: 1, rate: 1 },
  melissa: { pitch: 1.15, rate: 1.02 },
  voice: { pitch: 0.5, rate: 0.85 },
  system: { pitch: 1.05, rate: 1.08 },
  herdeiro: { pitch: 0.8, rate: 0.95 },
  rato: { pitch: 1.6, rate: 1.08 },
}

function ptVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return voices.find((v) => v.lang === 'pt-BR') ?? voices.find((v) => v.lang.startsWith('pt'))
}

function synthSpeak(text: string, cast: VoiceCast, onEnd: () => void) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  if (!synth) return null
  const say = ttsText(text)
  if (!say) return null
  const u = new SpeechSynthesisUtterance(say)
  u.lang = 'pt-BR'
  const v = ptVoice()
  if (v) u.voice = v
  u.pitch = SYNTH[cast].pitch
  u.rate = SYNTH[cast].rate
  u.onend = onEnd
  u.onerror = onEnd
  synth.cancel()
  synth.speak(u)
  // Estimativa (~15 caracteres por segundo em pt-BR na velocidade 1).
  return Math.round((say.length / 15) * 1000 / SYNTH[cast].rate)
}

/* ── Tocar / parar ─────────────────────────────────────────────────────────────────────── */
function done() {
  if (!speaking) return
  speaking = false
  duckPrologueMusic(false)
}

export function stopVoice() {
  if (current) {
    current.pause()
    current.src = ''
    current = null
  }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  done()
}

/**
 * Fala uma linha. Retorna a duração esperada (ms) para a digitação acompanhar, ou null se não houver voz
 * (dublagem desligada, mudo, texto sem palavras).
 */
export function speakLine({ id, text, cast, onEnd }: { id: string; text: string; cast: VoiceCast; onEnd?: () => void }) {
  stopVoice()
  if (!readDub() || isMuted() || typeof window === 'undefined') return null
  const end = () => {
    done()
    onEnd?.()
  }
  const entry = manifest?.lines[id]
  if (entry) {
    const a = new Audio(`${BASE}/${id}.${format()}`)
    a.volume = 0.95
    a.onended = end
    a.onerror = () => {
      // Arquivo ausente/corrompido: tenta a voz do aparelho.
      if (current === a) current = null
      if (synthSpeak(text, cast, end) === null) end()
    }
    current = a
    speaking = true
    duckPrologueMusic(true)
    void a.play().catch(() => end())
    return Math.round(entry.duration * 1000)
  }
  const ms = synthSpeak(text, cast, end)
  if (ms !== null) {
    speaking = true
    duckPrologueMusic(true)
  }
  return ms
}

/** Risadinha do Rato: a dublada (com tratamento) ou a sintetizada. */
export function playRatoLaugh() {
  if (isMuted()) return
  if (readDub() && manifest?.lines[RATO_LAUGH_ID]) {
    const a = new Audio(`${BASE}/${RATO_LAUGH_ID}.${format()}`)
    a.volume = 0.9
    void a.play().catch(() => playSfx('laugh'))
    return
  }
  playSfx('laugh')
}

if (typeof window !== 'undefined') {
  subscribeMuted(() => {
    if (isMuted()) stopVoice()
  })
}
