import { isMuted } from '@/lib/devo/audio'

/**
 * Sons curtos da Casa, sintetizados como no protótipo (kit3/npc-vn.js, chibi-vida.js, visita-simon.js): voz das letras,
 * passos, campainha, porta, holograma. Um só AudioContext; nada toca com o som do jogo desligado.
 */
let ctx: AudioContext | null = null

export function audio(): AudioContext | null {
  if (isMuted()) return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export type Voz = { tipo: OscillatorType; f0: number; f1: number; dur: number; cada: number; vol?: number }

/** Destrava o som num toque (o iPhone só deixa o áudio começar dentro de um gesto). */
export function destravaSom() {
  void audio()
}

/** Só agenda som com o contexto rodando: agendar suspenso faz tudo sair junto ("estouro") quando ele destrava. */
const pronto = () => {
  const c = audio()
  return c && c.state === 'running' ? c : null
}

export function bip({ tipo, f0, f1, dur, vol = 0.06 }: Voz) {
  const c = pronto()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  const t = c.currentTime
  o.type = tipo
  o.frequency.value = f0 + Math.random() * (f1 - f0)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur / 1000)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur / 1000 + 0.02)
}

export type Som = 'range' | 'holograma' | 'holograma-sai' | 'baque' | 'campainha'

export function som(nome: Som) {
  const c = pronto()
  if (!c) return
  const t = c.currentTime
  const tom = (tipo: OscillatorType, ini: number, vol: number, dur: number, f: (o: OscillatorNode) => void) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = tipo
    f(o)
    g.gain.setValueAtTime(vol, ini)
    g.gain.exponentialRampToValueAtTime(0.0001, ini + dur)
    o.connect(g).connect(c.destination)
    o.start(ini)
    o.stop(ini + dur + 0.02)
  }
  if (nome === 'range')
    tom('sawtooth', t, 0.025, 0.55, (o) => {
      o.frequency.setValueAtTime(140, t)
      o.frequency.linearRampToValueAtTime(95, t + 0.5)
    })
  if (nome === 'holograma' || nome === 'holograma-sai') {
    const sobe = nome === 'holograma'
    ;[0, 0.09].forEach((d, i) => tom('square', t + d, 0.03, 0.12, (o) => o.frequency.setValueAtTime(sobe ? [660, 990][i] : [990, 520][i], t + d)))
  }
  if (nome === 'baque')
    tom('sine', t, 0.18, 0.3, (o) => {
      o.frequency.setValueAtTime(90, t)
      o.frequency.exponentialRampToValueAtTime(40, t + 0.25)
    })
  if (nome === 'campainha')
    tom('triangle', t, 0.15, 0.7, (o) => {
      o.frequency.setValueAtTime(880, t)
      o.frequency.setValueAtTime(660, t + 0.25)
    })
}

/** Passo baixo dentro de casa (o pé que toca o chão). */
export function passo(alto: boolean) {
  const c = calmo() ? null : pronto()
  if (!c || c.state !== 'running') return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(alto ? 150 : 130, t)
  o.frequency.exponentialRampToValueAtTime(70, t + 0.06)
  g.gain.setValueAtTime(0.03, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + 0.09)
}

export const calmo = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion:reduce)').matches
