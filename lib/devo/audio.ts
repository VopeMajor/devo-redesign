'use client'

export type Sfx =
  | 'hover'
  | 'click'
  | 'open'
  | 'close'
  | 'notify'
  | 'type'
  | 'error'
  | 'reveal'
  | 'confirm'
  | 'whoosh'
  | 'send'
  | 'chess-move'
  | 'chess-capture'
  | 'chess-check'
  | 'chess-tick'
  | 'card'
  | 'card-select'
  | 'bluff-shot'
  | 'bluff-true'
  | 'bluff-lie'
  | 'crush'
  | 'curtain'
  | 'chirp'
  | 'fall'
  | 'rumble'
  | 'bell'
  | 'ignite'
  | 'crackle'
  | 'heartbeat'
  | 'whisper'
  | 'drip'
  /** Explosão/impacto (o "KABUM!" do tutorial). */
  | 'explosion'
  /** Risadinha do Rato sintetizada (reserva quando não há a dublada). */
  | 'laugh'
  /** Corte de lâmina (faixa vermelha da queda). */
  | 'slash'
  /** Brilho de vidro/espelho. */
  | 'shimmer'
  /** Impacto grave curto (cortes de cena, cartão de ato). */
  | 'thud'
  /** Badalada do relógio gigante (o salão do relógio aparece). */
  | 'toll'
  /** Tique-taque seco de relojoaria. */
  | 'tick'
  /** Vidro do espelho trincando. */
  | 'crack'
  /** Folhas de papel (tutorial: cada etapa nova "vira a página"). */
  | 'paper'

let ctx: AudioContext | null = null
let master: GainNode | null = null
/** Preferência de som do jogador (Ajustes / equalizador): guardada no aparelho e lida ao carregar. */
const MUDO_KEY = 'devo.som.mudo'
let muted = lerMudo()
function lerMudo() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUDO_KEY) === '1'
  } catch {
    return false
  }
}
let ambient: { stop: () => void; bus: GainNode; level: number } | null = null
let ambientDucked = false

/** Abaixa o som de fundo enquanto a trilha principal toca. */
function setAmbientDucked(next: boolean) {
  ambientDucked = next
  if (!ambient || !ctx) return
  ambient.bus.gain.cancelScheduledValues(ctx.currentTime)
  ambient.bus.gain.setTargetAtTime(next ? ambient.level * 0.25 : ambient.level, ctx.currentTime, 0.8)
}
const listeners = new Set<() => void>()

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.8
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type ToneOpts = { type?: OscillatorType; gain?: number; attack?: number; slideTo?: number; delay?: number; dest?: AudioNode }

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  const c = ensure()
  if (!c || !master) return
  const { type = 'sine', gain = 0.12, attack = 0.005, slideTo, delay = 0, dest = master } = opts
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

type NoiseOpts = { gain?: number; freq?: number; q?: number; delay?: number; sweepTo?: number; dest?: AudioNode }

function noise(dur: number, opts: NoiseOpts = {}) {
  const c = ensure()
  if (!c || !master) return
  const { gain = 0.08, freq = 1200, q = 1, delay = 0, sweepTo, dest = master } = opts
  const t = c.currentTime + delay
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, Math.max(dur, 0.05))
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(freq, t)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  filter.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(dest)
  src.start(t)
  src.stop(t + dur + 0.05)
}

export function playSfx(kind: Sfx) {
  if (muted) return
  switch (kind) {
    case 'explosion':
      // estalo + corpo grave + cauda de detritos
      noise(0.08, { gain: 0.5, freq: 2400, q: 0.5 })
      noise(1.4, { gain: 0.42, freq: 380, q: 0.4, sweepTo: 60 })
      noise(0.9, { gain: 0.2, freq: 1600, q: 0.8, delay: 0.05, sweepTo: 300 })
      tone(62, 1.2, { gain: 0.42, type: 'sine', slideTo: 28 })
      tone(124, 0.5, { gain: 0.16, type: 'triangle', slideTo: 40 })
      noise(1.2, { gain: 0.06, freq: 5200, q: 3, delay: 0.25, sweepTo: 2600 })
      break
    case 'laugh':
      // "hi-hi-hi-hi" agudo e nasal, cada vez mais alto
      ;[0, 0.13, 0.26, 0.39].forEach((d, i) => {
        tone(820 + i * 40, 0.09, { type: 'square', gain: 0.03 + i * 0.006, slideTo: 980 + i * 50, delay: d })
        noise(0.06, { gain: 0.03, freq: 3600, q: 4, delay: d })
      })
      break
    case 'slash':
      noise(0.28, { gain: 0.3, freq: 5200, q: 1.2, sweepTo: 900 })
      tone(1900, 0.2, { gain: 0.05, type: 'sawtooth', slideTo: 420 })
      break
    case 'shimmer':
      ;[1568, 1976, 2349, 3136].forEach((f, i) => tone(f, 1.4, { gain: 0.025, delay: i * 0.07, attack: 0.02 }))
      noise(1.2, { gain: 0.04, freq: 7000, q: 6, sweepTo: 4000 })
      break
    case 'thud':
      tone(55, 0.6, { gain: 0.32, slideTo: 32 })
      noise(0.25, { gain: 0.14, freq: 180, q: 0.7 })
      break
    case 'toll':
      // martelo no bronze + parciais de sino grave com batimento lento + sub
      noise(0.05, { gain: 0.22, freq: 1800, q: 0.8 })
      ;[1, 2.0, 2.4, 3.0, 4.2, 5.4].forEach((p, i) => {
        tone(98 * p, 6.5 - i * 0.8, { gain: 0.09 / (i + 1), attack: 0.003 })
        tone(98 * p * 1.004, 6 - i * 0.8, { gain: 0.05 / (i + 1), attack: 0.003 })
      })
      tone(49, 4.5, { gain: 0.16, attack: 0.02, slideTo: 46 })
      break
    case 'tick':
      noise(0.025, { gain: 0.09, freq: 4200, q: 6 })
      tone(2100, 0.03, { gain: 0.02, type: 'square' })
      noise(0.025, { gain: 0.07, freq: 3100, q: 6, delay: 0.5 })
      tone(1600, 0.03, { gain: 0.016, type: 'square', delay: 0.5 })
      break
    case 'crack':
      for (let i = 0; i < 7; i++) noise(0.02 + Math.random() * 0.05, { gain: 0.12 + Math.random() * 0.1, freq: 3000 + Math.random() * 4000, q: 3, delay: i * 0.035 + Math.random() * 0.02 })
      tone(2600, 0.5, { gain: 0.03, slideTo: 1400, delay: 0.05 })
      noise(0.6, { gain: 0.05, freq: 6000, q: 2, delay: 0.1, sweepTo: 3000 })
      break
    case 'hover':
      tone(1400, 0.05, { gain: 0.018, type: 'triangle' })
      break
    case 'paper':
      somPapel(master ?? undefined)
      break
    case 'crush':
      noise(0.35, { gain: 0.32, freq: 260, q: 0.8, sweepTo: 90 })
      noise(0.18, { gain: 0.22, freq: 900, q: 2, delay: 0.03, sweepTo: 300 })
      noise(0.28, { gain: 0.16, freq: 480, q: 1.4, delay: 0.12, sweepTo: 140 })
      tone(70, 0.4, { gain: 0.2, type: 'sine', slideTo: 38 })
      break
    case 'curtain':
      noise(1.3, { gain: 0.12, freq: 500, q: 0.6, sweepTo: 2400 })
      noise(0.9, { gain: 0.06, freq: 3000, q: 1, delay: 0.3, sweepTo: 900 })
      break
    case 'chirp':
      for (let i = 0; i < 3; i++) tone(2800 + Math.random() * 600, 0.09, { gain: 0.025, slideTo: 3600, delay: i * 0.14 })
      tone(3300, 0.08, { gain: 0.02, slideTo: 2500, delay: 0.75 })
      tone(3000, 0.08, { gain: 0.018, slideTo: 3700, delay: 0.88 })
      break
    case 'fall':
      tone(1300, 1.6, { gain: 0.06, type: 'triangle', slideTo: 90 })
      noise(1.8, { gain: 0.18, freq: 2000, q: 0.7, sweepTo: 120 })
      tone(52, 1.4, { gain: 0.22, delay: 1.3, slideTo: 30 })
      noise(0.5, { gain: 0.22, freq: 180, q: 0.6, delay: 1.3, sweepTo: 70 })
      break
    case 'rumble':
      noise(2.6, { gain: 0.24, freq: 90, q: 0.5, sweepTo: 55 })
      tone(41, 2.6, { gain: 0.14, type: 'sawtooth', attack: 0.5, slideTo: 36 })
      break
    case 'bell':
      for (const at of [0, 2.4]) {
        ;[1, 2.01, 2.76, 4.07, 5.4].forEach((p, i) => tone(146.8 * p, 4.5 - i * 0.7, { gain: 0.07 / (i + 1), attack: 0.004, delay: at }))
      }
      break
    case 'ignite':
      noise(1.4, { gain: 0.3, freq: 350, q: 0.5, sweepTo: 3000 })
      tone(80, 1.3, { gain: 0.14, type: 'sawtooth', attack: 0.2, slideTo: 170 })
      for (let i = 0; i < 18; i++) noise(0.03 + Math.random() * 0.04, { gain: 0.05 + Math.random() * 0.08, freq: 1500 + Math.random() * 3000, q: 4, delay: 0.6 + Math.random() * 2.4 })
      break
    case 'crackle':
      for (let i = 0; i < 26; i++) noise(0.03 + Math.random() * 0.04, { gain: 0.04 + Math.random() * 0.07, freq: 1400 + Math.random() * 3200, q: 4, delay: Math.random() * 3.5 })
      noise(3.5, { gain: 0.05, freq: 300, q: 0.4 })
      break
    case 'heartbeat':
      for (let k = 0; k < 3; k++) {
        tone(62, 0.2, { gain: 0.26, delay: k * 1.1, slideTo: 40 })
        tone(56, 0.22, { gain: 0.18, delay: k * 1.1 + 0.28, slideTo: 38 })
      }
      break
    case 'whisper':
      noise(2.4, { gain: 0.07, freq: 1800, q: 3, sweepTo: 700 })
      noise(2, { gain: 0.05, freq: 3200, q: 5, delay: 0.4, sweepTo: 1400 })
      tone(1318.5, 2.6, { gain: 0.02, attack: 0.8, delay: 0.3 })
      tone(1975.5, 2.2, { gain: 0.012, attack: 0.8, delay: 0.7 })
      break
    case 'drip':
      for (let i = 0; i < 3; i++) tone(900 + Math.random() * 400, 0.12, { gain: 0.06, slideTo: 2400, delay: i * 0.9 + Math.random() * 0.3 })
      break
    case 'click':
      noise(0.04, { gain: 0.06, freq: 2600, q: 6 })
      tone(220, 0.08, { gain: 0.05, type: 'triangle' })
      break
    case 'type':
      tone(520 + Math.random() * 160, 0.03, { gain: 0.025, type: 'square' })
      break
    case 'open':
      tone(196, 0.25, { gain: 0.06, type: 'triangle', slideTo: 392 })
      noise(0.2, { gain: 0.03, freq: 800, sweepTo: 3000 })
      break
    case 'close':
      tone(392, 0.2, { gain: 0.05, type: 'triangle', slideTo: 150 })
      break
    case 'send':
      tone(660, 0.08, { gain: 0.04, type: 'sine' })
      tone(990, 0.1, { gain: 0.03, type: 'sine', delay: 0.06 })
      break
    case 'notify':
      tone(622, 0.5, { gain: 0.06 })
      tone(933, 0.7, { gain: 0.04, delay: 0.12 })
      break
    case 'error':
      tone(110, 0.3, { gain: 0.08, type: 'sawtooth', slideTo: 70 })
      break
    case 'confirm':
      tone(293.7, 0.6, { gain: 0.06, type: 'triangle' })
      tone(440, 0.8, { gain: 0.05, type: 'triangle', delay: 0.1 })
      tone(587.3, 1.2, { gain: 0.04, type: 'sine', delay: 0.2 })
      break
    case 'reveal':
      noise(0.6, { gain: 0.08, freq: 400, sweepTo: 5000, q: 0.8 })
      tone(146.8, 1.6, { gain: 0.09, type: 'sawtooth', attack: 0.02 })
      tone(155.6, 1.6, { gain: 0.06, type: 'sawtooth', attack: 0.02 })
      break
    case 'whoosh':
      noise(0.9, { gain: 0.1, freq: 200, sweepTo: 4000, q: 0.7 })
      tone(55, 1.4, { gain: 0.15, type: 'sine', attack: 0.05 })
      break
    case 'chess-move':
      tone(150, 0.14, { gain: 0.14, type: 'sine', slideTo: 85 })
      noise(0.05, { gain: 0.07, freq: 1800, q: 3 })
      tone(1760, 0.35, { gain: 0.012, type: 'sine', delay: 0.02 })
      break
    case 'chess-capture':
      noise(0.18, { gain: 0.12, freq: 3500, q: 1.5, sweepTo: 900 })
      tone(110, 0.4, { gain: 0.16, type: 'triangle', slideTo: 55 })
      tone(659.3, 1.2, { gain: 0.03, delay: 0.05 })
      tone(987.8, 1.4, { gain: 0.02, delay: 0.09 })
      break
    case 'chess-check':
      tone(880, 1.8, { gain: 0.05, attack: 0.002 })
      tone(1318.5, 1.6, { gain: 0.03, attack: 0.002 })
      tone(2093, 1.2, { gain: 0.012, attack: 0.002 })
      tone(880, 1.8, { gain: 0.04, attack: 0.002, delay: 0.32 })
      break
    case 'chess-tick':
      noise(0.03, { gain: 0.09, freq: 4200, q: 10 })
      tone(1975, 0.06, { gain: 0.03, type: 'square' })
      break
    case 'card':
      noise(0.07, { gain: 0.09, freq: 2400, q: 1.2, sweepTo: 900 })
      tone(240, 0.08, { gain: 0.05, type: 'triangle', slideTo: 160 })
      break
    case 'card-select':
      noise(0.03, { gain: 0.05, freq: 3600, q: 4 })
      tone(880, 0.05, { gain: 0.02, type: 'triangle' })
      break
    case 'bluff-shot':
      noise(0.35, { gain: 0.3, freq: 900, q: 0.6, sweepTo: 180 })
      tone(110, 0.3, { gain: 0.22, type: 'sine', slideTo: 40 })
      tone(1760, 0.6, { gain: 0.01, delay: 0.05 })
      break
    case 'bluff-true':
      tone(160, 0.5, { gain: 0.1, type: 'sawtooth', slideTo: 70 })
      tone(233.1, 0.7, { gain: 0.04, type: 'triangle', delay: 0.08 })
      break
    case 'bluff-lie':
      tone(523.3, 0.18, { gain: 0.08 })
      tone(784, 0.28, { gain: 0.08, delay: 0.12 })
      tone(1046.5, 0.5, { gain: 0.05, delay: 0.24 })
      break
  }
}

let arcadeAmbient: { stop: () => void; bus: GainNode; lp: BiquadFilterNode } | null = null
const ARCADE_LEVEL = 0.55

/**
 * Som ambiente da Sala de Jogos: lounge noturno em lá menor. Pad com tremolo, baixo pulsado,
 * crepitar de vinil, notas soltas de piano elétrico e fichas tilintando ao longe.
 */
export function startArcadeAmbience() {
  const c = ensure()
  if (!c || !master || arcadeAmbient) return
  setAmbientDucked(true)
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(ARCADE_LEVEL, c.currentTime + 3)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2400
  lp.connect(bus)
  bus.connect(master)

  const chords = [
    [220, 261.6, 329.6, 392, 493.9],
    [174.6, 220, 261.6, 329.6, 392],
    [146.8, 174.6, 220, 261.6, 329.6],
    [164.8, 207.7, 246.9, 293.7, 392],
  ]
  const roots = [55, 43.65, 36.7, 41.2]
  const tremolo = c.createOscillator()
  tremolo.frequency.value = 3.2
  const tremDepth = c.createGain()
  tremDepth.gain.value = 0.25
  const padGain = c.createGain()
  padGain.gain.value = 0.75
  tremolo.connect(tremDepth).connect(padGain.gain)
  tremolo.start()
  const padFilter = c.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 900
  padGain.connect(padFilter).connect(lp)

  const voices = chords[0].map((f, i) => {
    const o = c.createOscillator()
    o.type = i % 2 ? 'sine' : 'triangle'
    o.frequency.value = f
    o.detune.value = (i - 2) * 3
    const g = c.createGain()
    g.gain.value = 0.022
    o.connect(g).connect(padGain)
    o.start()
    return o
  })

  let bar = 0
  const setChord = () => {
    const chord = chords[bar % chords.length]
    voices.forEach((o, i) => o.frequency.setTargetAtTime(chord[i], c.currentTime, 0.6))
  }

  let beat = 0
  const beatTimer = window.setInterval(() => {
    if (muted) return
    const root = roots[bar % roots.length]
    if (beat % 2 === 0) tone(beat % 4 === 0 ? root : root * 1.5, 0.55, { gain: 0.09, type: 'sine', attack: 0.01, dest: lp })
    if (beat % 2 === 1) noise(0.05, { gain: 0.015, freq: 7000, q: 2 })
    if (beat % 8 === 5 && Math.random() < 0.6) {
      const chord = chords[bar % chords.length]
      const f = chord[2 + Math.floor(Math.random() * 3)] * 2
      tone(f, 1.6, { gain: 0.03, attack: 0.004, dest: lp })
      tone(f * 2.01, 0.8, { gain: 0.006, attack: 0.004, dest: lp })
    }
    beat++
    if (beat % 8 === 0) {
      bar++
      setChord()
    }
  }, 430)

  const crackle = c.createBufferSource()
  const len = c.sampleRate * 3
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.012
  crackle.buffer = buf
  crackle.loop = true
  const crackleFilter = c.createBiquadFilter()
  crackleFilter.type = 'highpass'
  crackleFilter.frequency.value = 1200
  const crackleGain = c.createGain()
  crackleGain.gain.value = 0.18
  crackle.connect(crackleFilter).connect(crackleGain).connect(bus)
  crackle.start()

  const chipTimer = window.setInterval(() => {
    if (muted || Math.random() < 0.45) return
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      const d = i * (0.05 + Math.random() * 0.04)
      noise(0.03, { gain: 0.025, freq: 5200 + Math.random() * 1600, q: 12, delay: d })
      tone(2600 + Math.random() * 900, 0.08, { gain: 0.006, delay: d, dest: bus })
    }
  }, 5200)

  arcadeAmbient = {
    bus,
    lp,
    stop: () => {
      const t = c.currentTime
      bus.gain.cancelScheduledValues(t)
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t)
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      window.clearInterval(beatTimer)
      window.clearInterval(chipTimer)
      window.setTimeout(() => {
        voices.forEach((o) => o.stop())
        tremolo.stop()
        crackle.stop()
        bus.disconnect()
      }, 1300)
      if (!musicPlaying) setAmbientDucked(false)
    },
  }
}

/** Abafa o ambiente da sala enquanto uma partida está aberta, sem cortar o clima. */
export function setArcadeAmbienceMuffled(on: boolean) {
  if (!arcadeAmbient || !ctx) return
  const t = ctx.currentTime
  arcadeAmbient.bus.gain.cancelScheduledValues(t)
  arcadeAmbient.bus.gain.setTargetAtTime(on ? ARCADE_LEVEL * 0.28 : ARCADE_LEVEL, t, 0.6)
  arcadeAmbient.lp.frequency.setTargetAtTime(on ? 600 : 2400, t, 0.6)
}

export function stopArcadeAmbience() {
  arcadeAmbient?.stop()
  arcadeAmbient = null
}

let chessAmbient: { stop: () => void } | null = null

/** Trilha própria do xadrez: caixinha de música em ré menor sobre um relógio que faz tique-taque. */
export function startChessAmbience() {
  const c = ensure()
  if (!c || !master || chessAmbient) return
  setAmbientDucked(true)
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 3)
  bus.connect(master)

  const pad = [73.4, 110, 146.8].map((f, i) => {
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    o.detune.value = i * 4
    const g = c.createGain()
    g.gain.value = 0.05
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    o.connect(lp).connect(g).connect(bus)
    o.start()
    return o
  })

  const phrases = [
    [587.3, 698.5, 880, 1174.7, 880, 698.5],
    [523.3, 659.3, 784, 1046.5, 784, 659.3],
    [466.2, 587.3, 698.5, 932.3, 698.5, 587.3],
    [440, 554.4, 659.3, 880, 659.3, 554.4],
  ]
  let step = 0
  const boxTimer = window.setInterval(() => {
    if (muted) return
    const phrase = phrases[Math.floor(step / 12) % phrases.length]
    if (step % 2 === 0) {
      const f = phrase[(step / 2) % phrase.length]
      tone(f, 2.2, { gain: 0.035, attack: 0.003, dest: bus })
      tone(f * 2, 1.1, { gain: 0.008, attack: 0.003, dest: bus })
    }
    step++
  }, 260)

  let tock = false
  const tickTimer = window.setInterval(() => {
    if (muted) return
    noise(0.025, { gain: 0.05, freq: tock ? 2400 : 3600, q: 9 })
    tock = !tock
  }, 1000)

  chessAmbient = {
    stop: () => {
      const t = c.currentTime
      bus.gain.cancelScheduledValues(t)
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t)
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 1)
      window.clearInterval(boxTimer)
      window.clearInterval(tickTimer)
      window.setTimeout(() => {
        pad.forEach((o) => o.stop())
        bus.disconnect()
      }, 1100)
      if (!musicPlaying) setAmbientDucked(false)
    },
  }
}

export function stopChessAmbience() {
  chessAmbient?.stop()
  chessAmbient = null
}

export function startAmbient(level = 0.32) {
  const c = ensure()
  if (!c || !master || ambient) return
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(ambientDucked ? level * 0.25 : level, c.currentTime + 4)
  const lowpass = c.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 380
  lowpass.connect(bus)
  bus.connect(master)

  const oscillators = [
    { f: 55, type: 'triangle' as const, g: 0.28 },
    { f: 55.35, type: 'sawtooth' as const, g: 0.12 },
    { f: 82.4, type: 'triangle' as const, g: 0.08 },
    { f: 116.5, type: 'sine' as const, g: 0.05 },
  ].map(({ f, type, g }) => {
    const o = c.createOscillator()
    o.type = type
    o.frequency.value = f
    const gain = c.createGain()
    gain.gain.value = g
    o.connect(gain).connect(lowpass)
    o.start()
    return o
  })

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.06
  const lfoGain = c.createGain()
  lfoGain.gain.value = 160
  lfo.connect(lfoGain).connect(lowpass.frequency)
  lfo.start()

  const wind = c.createBufferSource()
  wind.buffer = noiseBuffer(c, 4)
  wind.loop = true
  const windFilter = c.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 500
  windFilter.Q.value = 0.5
  const windGain = c.createGain()
  windGain.gain.value = 0.05
  wind.connect(windFilter).connect(windGain).connect(bus)
  wind.start()

  const bells = [311.1, 293.7, 233.1, 207.7, 155.6]
  const bellTimer = window.setInterval(() => {
    if (muted) return
    tone(bells[Math.floor(Math.random() * bells.length)], 5, { gain: 0.025, attack: 0.01, dest: bus })
  }, 6500)
  const tickTimer = window.setInterval(() => {
    if (muted) return
    noise(0.025, { gain: 0.035, freq: 3200, q: 9 })
  }, 1000)

  ambient = {
    bus,
    level,
    stop: () => {
      const t = c.currentTime
      bus.gain.cancelScheduledValues(t)
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t)
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      window.clearInterval(bellTimer)
      window.clearInterval(tickTimer)
      window.setTimeout(() => {
        oscillators.forEach((o) => o.stop())
        lfo.stop()
        wind.stop()
        bus.disconnect()
      }, 1300)
    },
  }
}

export function stopAmbient() {
  ambient?.stop()
  ambient = null
}

/** Trilha de caixinha de música do prólogo, sintetizada em tempo real. */
/** `hall` = valsa lenta do salão do relógio, com tique-taque no compasso. */
export type PrologueTrack = 'tale' | 'dread' | 'void' | 'mine' | 'hall'

const PRO_MELODY = [81, 84, 88, 86, 84, 83, 84, 81, 76, 77, 76, 74, 76, 80, 83, 86, 84, 83, 81, 0, 76, 81, 0, 0]
const PRO_BASS = [45, 43, 45, 50, 40, 40, 45, 45]
const PRO_TRACKS: Record<PrologueTrack, { beat: number; shift: number; level: number; cutoff: number; melody: boolean; drone: boolean; warp: number; tick?: boolean }> = {
  hall: { beat: 0.78, shift: -12, level: 0.75, cutoff: 2600, melody: true, drone: true, warp: 0.008, tick: true },
  tale: { beat: 0.55, shift: 0, level: 0.9, cutoff: 7000, melody: true, drone: false, warp: 0 },
  dread: { beat: 0.9, shift: -12, level: 0.85, cutoff: 1900, melody: true, drone: true, warp: 0.014 },
  void: { beat: 1.1, shift: 0, level: 0.7, cutoff: 1400, melody: false, drone: true, warp: 0.006 },
  mine: { beat: 0.72, shift: -12, level: 0.55, cutoff: 2400, melody: true, drone: false, warp: 0.004 },
}

let pro: { track: PrologueTrack; bus: GainNode; filter: BiquadFilterNode; timer: number; next: number; step: number } | null = null
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12)

function musicBox(freq: number, when: number, dest: AudioNode, gain: number) {
  if (!ctx) return
  const delay = Math.max(0, when - ctx.currentTime)
  tone(freq, 1.8, { gain, attack: 0.004, delay, dest })
  tone(freq * 2, 0.7, { gain: gain * 0.25, attack: 0.003, delay, dest })
  tone(freq * 4.2, 0.25, { gain: gain * 0.07, attack: 0.002, delay, dest })
}

function scheduleProStep() {
  if (!pro || !ctx) return
  const cfg = PRO_TRACKS[pro.track]
  const i = pro.step
  const bar = Math.floor(i / 3) % PRO_BASS.length
  const beatInBar = i % 3
  const t = pro.next
  const warp = () => 1 + (Math.random() - 0.5) * cfg.warp
  const note = PRO_MELODY[i % PRO_MELODY.length]

  if (cfg.melody && note) musicBox(midiHz(note + cfg.shift) * warp(), t, pro.filter, 0.05)
  if (!cfg.melody && beatInBar === 0 && Math.random() < 0.4) musicBox(midiHz((note || 81) + 12) * warp(), t, pro.filter, 0.025)

  if (pro.track !== 'void') {
    const root = PRO_BASS[bar] + 12 + Math.min(cfg.shift, 0)
    if (beatInBar === 0) musicBox(midiHz(root), t, pro.filter, 0.035)
    else musicBox(midiHz(root + (beatInBar === 1 ? 7 : 12)), t, pro.filter, 0.014)
  }

  if (cfg.tick) {
    // tique-taque de relojoaria no tempo da valsa (forte no 1, leve no 2 e 3)
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, 0.04)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = beatInBar === 0 ? 2200 : 1700
    f.Q.value = 7
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(beatInBar === 0 ? 0.11 : 0.06, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
    src.connect(f).connect(g).connect(pro.filter)
    src.start(t)
    src.stop(t + 0.05)
  }

  if (cfg.drone && beatInBar === 0 && bar % 2 === 0) {
    const f = midiHz(PRO_BASS[bar] - 12)
    const delay = Math.max(0, t - ctx.currentTime)
    tone(f, cfg.beat * 6.5, { type: 'sawtooth', gain: 0.03, attack: 1.2, delay, dest: pro.filter })
    tone(f * 1.006, cfg.beat * 6.5, { type: 'sawtooth', gain: 0.025, attack: 1.4, delay, dest: pro.filter })
  }

  pro.step++
  pro.next += cfg.beat
}

let proDucked = false
/** Abaixa a trilha do prólogo enquanto uma fala dublada toca (e volta ao fim). */
export function duckPrologueMusic(on: boolean) {
  proDucked = on
  if (!pro || !ctx) return
  const level = PRO_TRACKS[pro.track].level * (on ? 0.38 : 1)
  pro.bus.gain.cancelScheduledValues(ctx.currentTime)
  pro.bus.gain.setTargetAtTime(level, ctx.currentTime, on ? 0.12 : 0.6)
}

export function setPrologueMusic(track: PrologueTrack | null) {
  const c = ensure()
  if (!c || !master || pro?.track === track) return
  if (pro) {
    const old = pro
    window.clearInterval(old.timer)
    old.bus.gain.cancelScheduledValues(c.currentTime)
    old.bus.gain.setTargetAtTime(0.0001, c.currentTime, 0.5)
    window.setTimeout(() => old.bus.disconnect(), 3000)
    pro = null
  }
  if (!track) {
    setAmbientDucked(musicPlaying)
    return
  }
  const cfg = PRO_TRACKS[track]
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(cfg.level * (proDucked ? 0.38 : 1), c.currentTime + 1.6)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cfg.cutoff
  filter.connect(bus)
  bus.connect(master)
  const state = { track, bus, filter, timer: 0, next: c.currentTime + 0.4, step: 0 }
  state.timer = window.setInterval(() => {
    while (pro === state && state.next < c.currentTime + 0.35) scheduleProStep()
  }, 100)
  pro = state
  setAmbientDucked(true)
}

function synthIntroSting() {
  playSfx('whoosh')
  tone(73.4, 3.5, { gain: 0.12, type: 'sawtooth', attack: 0.3, delay: 0.4 })
  tone(77.8, 3.5, { gain: 0.1, type: 'sawtooth', attack: 0.3, delay: 0.4 })
  tone(587.3, 3, { gain: 0.03, attack: 0.5, delay: 0.9 })
}

/** Trilha principal fornecida pelo usuário (YouTube). */
export const MUSIC_VIDEO_ID = 'GI_CiC3FB08'
const MUSIC_VOLUME = 70

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  mute: () => void
  unMute: () => void
  setVolume: (v: number) => void
  getVolume: () => number
}
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      width?: number
      height?: number
      playerVars?: Record<string, string | number>
      events?: { onReady?: () => void; onError?: () => void; onStateChange?: (e: { data: number }) => void }
    },
  ) => YTPlayer
}

let ytPlayer: YTPlayer | null = null
let ytReady = false
let ytFailed = false
let musicWanted = false
let musicPlaying = false
let musicFade: number | null = null

export function preloadMusic() {
  if (typeof window === 'undefined' || document.getElementById('devo-yt-host')) return
  const host = document.createElement('div')
  host.id = 'devo-yt-host'
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, {
    position: 'fixed',
    width: '200px',
    height: '200px',
    left: '-400px',
    bottom: '0',
    opacity: '0',
    pointerEvents: 'none',
  })
  const mount = document.createElement('div')
  host.appendChild(mount)
  document.body.appendChild(host)

  const w = window as unknown as { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
  const create = () => {
    if (!w.YT) return
    ytPlayer = new w.YT.Player(mount, {
      videoId: MUSIC_VIDEO_ID,
      width: 200,
      height: 200,
      playerVars: { autoplay: 0, controls: 0, playsinline: 1, disablekb: 1, rel: 0 },
      events: {
        onStateChange: (e) => {
          if (e.data === 0) {
            musicPlaying = false
            musicWanted = false
            setAmbientDucked(false)
          }
        },
        onReady: () => {
          ytReady = true
          ytPlayer?.setVolume(MUSIC_VOLUME)
          if (muted) ytPlayer?.mute()
          if (musicWanted) startPlayer()
        },
        onError: () => {
          ytFailed = true
          if (musicWanted && !muted) synthIntroSting()
        },
      },
    })
  }
  if (w.YT?.Player) {
    create()
    return
  }
  const prev = w.onYouTubeIframeAPIReady
  w.onYouTubeIframeAPIReady = () => {
    prev?.()
    create()
  }
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  script.async = true
  script.onerror = () => {
    ytFailed = true
  }
  document.head.appendChild(script)
}

function startPlayer() {
  if (!ytPlayer) return
  if (musicFade) window.clearInterval(musicFade)
  ytPlayer.setVolume(MUSIC_VOLUME)
  if (muted) ytPlayer.mute()
  else ytPlayer.unMute()
  ytPlayer.seekTo(0, true)
  ytPlayer.playVideo()
  musicPlaying = true
  setAmbientDucked(true)
}

/** Toca a trilha uma única vez, do início, a cada COMEÇAR/CONTINUAR. Chamar dentro de um gesto do usuário. */
export function playMusic() {
  ensure()
  musicWanted = true
  if (ytReady) startPlayer()
  else if (ytFailed && !muted) synthIntroSting()
  else preloadMusic()
}

export function stopMusic() {
  musicWanted = false
  if (!ytPlayer || !musicPlaying) return
  musicPlaying = false
  setAmbientDucked(false)
  let vol = MUSIC_VOLUME
  if (musicFade) window.clearInterval(musicFade)
  musicFade = window.setInterval(() => {
    vol -= 6
    if (vol <= 0) {
      if (musicFade) window.clearInterval(musicFade)
      musicFade = null
      ytPlayer?.pauseVideo()
      return
    }
    ytPlayer?.setVolume(vol)
  }, 60)
}

export function setMuted(next: boolean) {
  muted = next
  try {
    window.localStorage.setItem(MUDO_KEY, next ? '1' : '0')
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.8, ctx.currentTime, 0.05)
  if (ytPlayer && ytReady) {
    if (next) ytPlayer.mute()
    else ytPlayer.unMute()
  }
  listeners.forEach((l) => l())
}

export function isMuted() {
  return muted
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function unlockAudio() {
  ensure()
}

/* ══════════════════════════════════════════════════════════════════ Sons narrativos (cenas de diálogo) */

/** Papel: algumas folhas mexidas (ruído agudo em rajadas curtas). */
function somPapel(dest?: AudioNode) {
  const d = dest
  for (let i = 0; i < 6; i++) {
    noise(0.05 + Math.random() * 0.09, { gain: 0.035 + Math.random() * 0.03, freq: 2600 + Math.random() * 2600, q: 0.8, delay: i * 0.07 + Math.random() * 0.04, sweepTo: 1800 + Math.random() * 1200, dest: d })
  }
  noise(0.35, { gain: 0.02, freq: 5200, q: 0.6, delay: 0.1, sweepTo: 3000, dest: d })
}

/**
 * Sons das marcações do roteiro (*Som de porta se abrindo*, *campainha*, *lata*…). Cada um é tocado num barramento
 * próprio: um som novo abaixa o anterior em 0,2 s (nada se sobrepõe) e o mesmo som pedido de novo em menos de
 * 1,5 s é ignorado (retomada da cena, efeito duplo do React). Volume moderado; o mudo global vale para todos.
 */
export type Deixa =
  | 'porta-abre'
  | 'porta-fecha'
  | 'campainha'
  | 'lata'
  | 'holograma'
  | 'holograma-fim'
  | 'aparicao'
  | 'sistema'
  | 'luz'
  | 'passos'
  | 'cozinha'
  | 'tempo'
  | 'tempo-perde'
  | 'item'
  | 'papel'
  | 'chamada'

let deixaBus: GainNode | null = null
let ultimaDeixa: { id: string; at: number } | null = null

export function playDeixa(id: Deixa | string) {
  if (muted) return
  const c = ensure()
  if (!c || !master) return
  const agora = performance.now()
  if (ultimaDeixa && ultimaDeixa.id === id && agora - ultimaDeixa.at < 1500) return
  ultimaDeixa = { id, at: agora }
  // o som anterior sai em 0,2 s: um efeito por vez
  if (deixaBus) {
    const velho = deixaBus
    velho.gain.cancelScheduledValues(c.currentTime)
    velho.gain.setValueAtTime(Math.max(velho.gain.value, 0.0001), c.currentTime)
    velho.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2)
    window.setTimeout(() => velho.disconnect(), 400)
  }
  const bus = c.createGain()
  bus.gain.value = 0.85
  bus.connect(master)
  deixaBus = bus
  const o = { dest: bus }
  switch (id) {
    case 'porta-abre':
      // trinco + rangido de dobradiça + ar do corredor
      noise(0.04, { gain: 0.12, freq: 2600, q: 4, ...o })
      tone(1200, 0.05, { gain: 0.02, type: 'square', ...o })
      for (let i = 0; i < 7; i++) tone(150 + Math.random() * 70, 0.13, { type: 'sawtooth', gain: 0.018, delay: 0.14 + i * 0.1, slideTo: 120 + Math.random() * 90, ...o })
      noise(1.2, { gain: 0.05, freq: 380, q: 0.6, delay: 0.1, sweepTo: 900, ...o })
      break
    case 'porta-fecha':
      tone(68, 0.4, { gain: 0.24, slideTo: 42, ...o })
      noise(0.14, { gain: 0.12, freq: 260, q: 0.8, ...o })
      noise(0.04, { gain: 0.08, freq: 3000, q: 5, delay: 0.16, ...o })
      tone(1400, 0.04, { gain: 0.015, type: 'square', delay: 0.16, ...o })
      break
    case 'campainha':
      // "ding… dong": duas notas de sino de porta com parciais
      for (const [f, at] of [[659.3, 0], [523.3, 0.62]] as const) {
        tone(f, 1.8, { gain: 0.07, attack: 0.004, delay: at, ...o })
        tone(f * 2.76, 0.6, { gain: 0.012, attack: 0.003, delay: at, ...o })
        tone(f * 5.4, 0.25, { gain: 0.006, attack: 0.002, delay: at, ...o })
      }
      break
    case 'lata':
      // lacre abrindo + gás + "tim" do alumínio
      noise(0.03, { gain: 0.14, freq: 4800, q: 3, ...o })
      tone(2400, 0.18, { gain: 0.018, slideTo: 2200, ...o })
      noise(0.9, { gain: 0.05, freq: 6200, q: 0.9, delay: 0.03, sweepTo: 3200, ...o })
      for (let i = 0; i < 8; i++) noise(0.012, { gain: 0.02, freq: 7000 + Math.random() * 2000, q: 8, delay: 0.2 + Math.random() * 0.7, ...o })
      break
    case 'holograma':
    case 'chamada':
      // interferência: rajadas filtradas + portadora que oscila e assenta
      for (let i = 0; i < 6; i++) noise(0.03 + Math.random() * 0.06, { gain: 0.05 + Math.random() * 0.04, freq: 1400 + Math.random() * 3200, q: 5, delay: i * 0.09 + Math.random() * 0.05, ...o })
      tone(420, 0.9, { type: 'square', gain: 0.012, slideTo: 980, delay: 0.05, ...o })
      tone(880, 1.4, { gain: 0.02, attack: 0.3, delay: 0.5, ...o })
      tone(1318.5, 1.2, { gain: 0.01, attack: 0.3, delay: 0.6, ...o })
      break
    case 'holograma-fim':
      tone(980, 0.6, { type: 'square', gain: 0.012, slideTo: 260, ...o })
      for (let i = 0; i < 4; i++) noise(0.04, { gain: 0.05, freq: 2000 + Math.random() * 2500, q: 5, delay: i * 0.08, ...o })
      tone(1760, 0.08, { gain: 0.02, delay: 0.55, ...o })
      break
    case 'aparicao':
      // um corpo grave que cresce + brilho frio por cima
      tone(55, 2.4, { gain: 0.13, attack: 0.9, slideTo: 49, ...o })
      tone(82.4, 2.2, { gain: 0.05, type: 'triangle', attack: 1, ...o })
      noise(1.8, { gain: 0.05, freq: 300, q: 0.6, sweepTo: 2200, ...o })
      ;[1174.7, 1568, 2093].forEach((f, i) => tone(f, 1.6, { gain: 0.012, attack: 0.25, delay: 0.7 + i * 0.12, ...o }))
      break
    case 'sistema':
      // revelação do sistema: varredura + acorde de vidro
      noise(0.7, { gain: 0.06, freq: 400, q: 0.8, sweepTo: 5000, ...o })
      ;[587.3, 880, 1174.7].forEach((f, i) => tone(f, 1.8, { gain: 0.03 - i * 0.006, attack: 0.02, delay: 0.25 + i * 0.06, ...o }))
      tone(146.8, 1.6, { gain: 0.05, type: 'triangle', attack: 0.05, ...o })
      break
    case 'luz':
      // zumbido elétrico que falha
      tone(100, 0.7, { type: 'sawtooth', gain: 0.02, ...o })
      tone(120, 0.5, { type: 'square', gain: 0.008, delay: 0.25, ...o })
      for (const at of [0, 0.26, 0.5]) noise(0.03, { gain: 0.08, freq: 3600, q: 5, delay: at, ...o })
      break
    case 'passos':
      for (let i = 0; i < 4; i++) {
        tone(80, 0.12, { gain: 0.09 - i * 0.015, slideTo: 55, delay: i * 0.46, ...o })
        noise(0.06, { gain: 0.04 - i * 0.006, freq: 900, q: 1, delay: i * 0.46, ...o })
      }
      break
    case 'cozinha':
      // passos, gaveta e louça mexida
      for (let i = 0; i < 3; i++) tone(80, 0.12, { gain: 0.07, slideTo: 55, delay: i * 0.42, ...o })
      noise(0.5, { gain: 0.05, freq: 700, q: 1.4, delay: 1.3, sweepTo: 1300, ...o })
      for (let i = 0; i < 4; i++) tone(1900 + Math.random() * 1400, 0.22, { gain: 0.015, delay: 1.9 + i * 0.16 + Math.random() * 0.08, ...o })
      break
    case 'tempo':
      for (let k = 0; k < 2; k++) {
        tone(62, 0.2, { gain: 0.2, delay: k * 1.0, slideTo: 40, ...o })
        tone(56, 0.22, { gain: 0.14, delay: k * 1.0 + 0.28, slideTo: 38, ...o })
      }
      ;[587.3, 880].forEach((f, i) => tone(f, 1.2, { gain: 0.025, delay: 0.1 + i * 0.12, ...o }))
      break
    case 'tempo-perde':
      for (let k = 0; k < 2; k++) {
        tone(62, 0.2, { gain: 0.2, delay: k * 1.0, slideTo: 40, ...o })
        tone(56, 0.22, { gain: 0.14, delay: k * 1.0 + 0.28, slideTo: 38, ...o })
      }
      tone(220, 1.1, { type: 'triangle', gain: 0.04, slideTo: 110, delay: 0.1, ...o })
      break
    case 'item':
      noise(0.07, { gain: 0.08, freq: 2400, q: 1.2, sweepTo: 900, ...o })
      ;[987.8, 1318.5, 1975.5].forEach((f, i) => tone(f, 1.2, { gain: 0.025, delay: 0.08 + i * 0.07, ...o }))
      break
    case 'papel':
      somPapel(bus)
      break
    default:
      noise(0.04, { gain: 0.05, freq: 2600, q: 6, ...o })
  }
}

/* ══════════════════════════════════════════════════════════════════ Trilha da Sala de Jogos */

/**
 * Tema da Sala de Jogos: "cassino gótico" em ré menor, 72 bpm — cordas sustentadas, piano em arpejo com uma melodia
 * no agudo e um pulso grave suave. 24 compassos (80 s) em laço, agendado no relógio do WebAudio (lookahead de 1 s,
 * temporizador de 250 ms): poucos osciladores vivos por vez, leve no celular.
 *
 * TROCAR POR UM ARQUIVO DE ÁUDIO: ponha o arquivo em `public/audio/` e aponte `SALA_MUSICA_ARQUIVO` para ele
 * (ex.: '/audio/sala-de-jogos.mp3'). Com o caminho definido, a síntese não é usada; volume, mudo, fade e "abafar
 * durante a partida" continuam iguais.
 */
export const SALA_MUSICA_ARQUIVO: string | null = null

const SALA_PREFS_KEY = 'devo.musica.sala'
export type SalaMusicaPrefs = { volume: number; mudo: boolean }
let salaPrefs: SalaMusicaPrefs = lerSalaPrefs()
const salaListeners = new Set<() => void>()
function lerSalaPrefs(): SalaMusicaPrefs {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(SALA_PREFS_KEY) : null
    const v = raw ? (JSON.parse(raw) as Partial<SalaMusicaPrefs>) : {}
    const volume = typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1 ? v.volume : 0.6
    return { volume, mudo: v.mudo === true }
  } catch {
    return { volume: 0.6, mudo: false }
  }
}
export function getSalaMusica() {
  return salaPrefs
}
export function subscribeSalaMusica(l: () => void) {
  salaListeners.add(l)
  return () => {
    salaListeners.delete(l)
  }
}
export function setSalaMusica(next: Partial<SalaMusicaPrefs>) {
  salaPrefs = { ...salaPrefs, ...next }
  try {
    window.localStorage.setItem(SALA_PREFS_KEY, JSON.stringify(salaPrefs))
  } catch {
    /* só nesta sessão */
  }
  aplicarNivelSala(0.25)
  salaListeners.forEach((l) => l())
}

const SALA_BPM = 72
const SALA_BEAT = 60 / SALA_BPM
const SALA_BAR = SALA_BEAT * 4
const SALA_BARS = 24
// acordes (2 compassos cada): Dm Bb Gm A | Dm F C A7 | Bb Gm Eb(napolitano) A
const SALA_ACORDES: { raiz: number; voz: number[] }[] = [
  { raiz: 38, voz: [50, 53, 57, 62] },
  { raiz: 34, voz: [50, 53, 58, 62] },
  { raiz: 31, voz: [50, 55, 58, 62] },
  { raiz: 33, voz: [49, 52, 57, 61] },
  { raiz: 38, voz: [50, 53, 57, 62] },
  { raiz: 41, voz: [48, 53, 57, 60] },
  { raiz: 36, voz: [48, 52, 55, 60] },
  { raiz: 33, voz: [49, 52, 55, 57] },
  { raiz: 34, voz: [50, 53, 58, 62] },
  { raiz: 31, voz: [50, 55, 58, 62] },
  { raiz: 39, voz: [51, 55, 58, 63] },
  { raiz: 33, voz: [49, 52, 57, 61] },
]
// melodia do piano no agudo: [compasso, tempo (em colcheias), nota MIDI, duração em tempos]
const SALA_MELODIA: [number, number, number, number][] = [
  [0, 0, 74, 2], [0, 4, 77, 1.5], [0, 7, 76, 0.5], [1, 0, 74, 3],
  [2, 0, 74, 1], [2, 2, 72, 1], [2, 4, 70, 2], [3, 0, 69, 3],
  [4, 0, 67, 2], [4, 4, 70, 1.5], [4, 7, 69, 0.5], [5, 0, 67, 3],
  [6, 0, 69, 1], [6, 2, 70, 1], [6, 4, 73, 2], [7, 0, 76, 3],
  [8, 0, 74, 2], [8, 4, 77, 1.5], [8, 7, 79, 0.5], [9, 0, 81, 3],
  [10, 0, 77, 1], [10, 2, 76, 1], [10, 4, 74, 2], [11, 0, 72, 3],
  [12, 0, 70, 2], [12, 4, 74, 2], [13, 0, 77, 3],
  [14, 0, 79, 2], [14, 4, 77, 1], [14, 6, 74, 1], [15, 0, 70, 3],
  [16, 0, 74, 1.5], [16, 3, 72, 0.5], [16, 4, 70, 2], [17, 0, 69, 3],
  [18, 0, 70, 1], [18, 2, 74, 1], [18, 4, 79, 2], [19, 0, 78, 3],
  [20, 0, 75, 2], [20, 4, 74, 1], [20, 6, 70, 1], [21, 0, 67, 3],
  [22, 0, 69, 2], [22, 4, 73, 2], [23, 0, 76, 2], [23, 4, 73, 2],
]
// arpejo do piano (índices da voz do acorde, uma oitava acima; -1 = pausa), alterna por compasso
const SALA_ARPEJO = [
  [0, 2, 1, 3, 2, 1, -1, 2],
  [0, -1, 2, 1, 3, -1, 2, -1],
]

type SalaSynth = { bus: GainNode; lp: BiquadFilterNode; timer: number; next: number; passo: number; parar: () => void }
type SalaArquivo = { bus: GainNode; lp: BiquadFilterNode; el: HTMLAudioElement; parar: () => void }
let sala: SalaSynth | SalaArquivo | null = null
let salaAbafada = false
let salaEsperaGesto: (() => void) | null = null

function nivelSala() {
  if (salaPrefs.mudo) return 0.0001
  return Math.max(0.0001, salaPrefs.volume * 0.5 * (salaAbafada ? 0.3 : 1))
}
function aplicarNivelSala(t: number) {
  if (!sala || !ctx) return
  sala.bus.gain.cancelScheduledValues(ctx.currentTime)
  sala.bus.gain.setTargetAtTime(nivelSala(), ctx.currentTime, t)
  sala.lp.frequency.setTargetAtTime(salaAbafada ? 650 : 5200, ctx.currentTime, 0.5)
}

/**
 * Ambiência barata (sem ConvolverNode, que pesa no celular): dois ecos curtos com realimentação e filtro grave,
 * o bastante para "sala de pedra". Entrada → saída molhada.
 */
function eco(c: AudioContext) {
  const entrada = c.createGain()
  const saida = c.createGain()
  for (const [tempo, fb] of [
    [0.137, 0.42],
    [0.211, 0.36],
  ] as const) {
    const d = c.createDelay(0.5)
    d.delayTime.value = tempo
    const g = c.createGain()
    g.gain.value = fb
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1800
    entrada.connect(d)
    d.connect(lp).connect(g).connect(d)
    lp.connect(saida)
  }
  return { entrada, saida }
}

/** Uma voz de cordas: duas serras levemente desafinadas, envelope lento. */
function corda(c: AudioContext, f: number, t: number, dur: number, gain: number, dest: AudioNode) {
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 1.3)
  g.gain.setValueAtTime(gain, t + Math.max(1.4, dur - 1.2))
  g.gain.linearRampToValueAtTime(0, t + dur)
  g.connect(dest)
  for (const det of [-7, 6]) {
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    o.detune.value = det
    o.connect(g)
    o.start(t)
    o.stop(t + dur + 0.05)
  }
}

/** Nota de piano: triângulo + harmônico, ataque seco e queda longa. */
function piano(c: AudioContext, f: number, t: number, dur: number, gain: number, dest: AudioNode) {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006)
  g.gain.exponentialRampToValueAtTime(gain * 0.35, t + 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  g.connect(dest)
  const o = c.createOscillator()
  o.type = 'triangle'
  o.frequency.value = f
  o.connect(g)
  const h = c.createOscillator()
  h.type = 'sine'
  h.frequency.value = f * 2.003
  const hg = c.createGain()
  hg.gain.value = 0.3
  h.connect(hg).connect(g)
  o.start(t)
  h.start(t)
  o.stop(t + dur + 0.05)
  h.stop(t + dur + 0.05)
}

function pulso(c: AudioContext, f: number, t: number, gain: number, dest: AudioNode) {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
  g.connect(dest)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(f, t)
  o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.5)
  o.connect(g)
  o.start(t)
  o.stop(t + 0.6)
}

/** Agenda uma colcheia da trilha (o laço dá a volta em 24 compassos). */
function salaColcheia(s: SalaSynth, cordas: AudioNode, pianoBus: AudioNode, grave: AudioNode) {
  if (!ctx) return
  const c = ctx
  const p = s.passo % (SALA_BARS * 8)
  const compasso = Math.floor(p / 8)
  const colcheia = p % 8
  const t = s.next
  const ac = SALA_ACORDES[Math.floor(compasso / 2) % SALA_ACORDES.length]
  const midi = (m: number) => 440 * 2 ** ((m - 69) / 12)
  if (!muted) {
    // cordas: um acorde a cada 2 compassos
    if (compasso % 2 === 0 && colcheia === 0) for (const m of ac.voz) corda(c, midi(m), t, SALA_BAR * 2 + 0.9, 0.016, cordas)
    // pulso grave: tempos 1 e 3 (e um eco leve no "e" do 2, como um coração)
    if (colcheia === 0 || colcheia === 4) pulso(c, midi(ac.raiz), t, colcheia === 0 ? 0.16 : 0.1, grave)
    if (colcheia === 3) pulso(c, midi(ac.raiz), t, 0.05, grave)
    // arpejo do piano (mais ralo nos 4 primeiros compassos: entrada)
    const ar = SALA_ARPEJO[compasso % 2][colcheia]
    if (ar >= 0 && (compasso >= 2 || colcheia % 2 === 0)) piano(c, midi(ac.voz[ar] + 12), t, 1.8, 0.03, pianoBus)
    // melodia
    for (const [b, e, n, d] of SALA_MELODIA) if (b === compasso && e === colcheia) piano(c, midi(n), t, Math.max(1.6, d * SALA_BEAT + 1.2), 0.05, pianoBus)
  }
  s.passo++
  s.next += SALA_BEAT / 2
}

function iniciarSala() {
  const c = ensure()
  if (!c || !master || sala) return
  const bus = c.createGain()
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = salaAbafada ? 650 : 5200
  lp.connect(bus)
  bus.connect(master)
  setAmbientDucked(true)

  if (SALA_MUSICA_ARQUIVO) {
    const el = new Audio(SALA_MUSICA_ARQUIVO)
    el.loop = true
    el.preload = 'auto'
    c.createMediaElementSource(el).connect(lp)
    void el.play().catch(() => {})
    sala = {
      bus,
      lp,
      el,
      parar: () => {
        window.setTimeout(() => {
          el.pause()
          bus.disconnect()
        }, 2200)
      },
    }
  } else {
    const rev = eco(c)
    const molhado = c.createGain()
    molhado.gain.value = 0.3
    rev.saida.connect(molhado).connect(lp)
    const cordasLp = c.createBiquadFilter()
    cordasLp.type = 'lowpass'
    cordasLp.frequency.value = 1150
    cordasLp.Q.value = 0.4
    cordasLp.connect(lp)
    cordasLp.connect(rev.entrada)
    const pianoBus = c.createGain()
    pianoBus.gain.value = 1
    pianoBus.connect(lp)
    pianoBus.connect(rev.entrada)
    const grave = c.createBiquadFilter()
    grave.type = 'lowpass'
    grave.frequency.value = 220
    grave.connect(lp)
    const s: SalaSynth = {
      bus,
      lp,
      timer: 0,
      next: c.currentTime + 0.3,
      passo: 0,
      parar: () => {
        window.clearInterval(s.timer)
        window.setTimeout(() => bus.disconnect(), 2600)
      },
    }
    s.timer = window.setInterval(() => {
      while (sala === s && s.next < c.currentTime + 1) salaColcheia(s, cordasLp, pianoBus, grave)
    }, 250)
    sala = s
  }
  // fade in
  bus.gain.setValueAtTime(0.0001, c.currentTime)
  bus.gain.exponentialRampToValueAtTime(nivelSala(), c.currentTime + 2.5)
}

/**
 * Liga a trilha da Sala de Jogos (fade in de 2,5 s). Nunca toca antes de um gesto do jogador: sem ativação da
 * página, espera o primeiro toque/tecla. O mudo global (equalizador) e o mudo/volume próprios valem sempre.
 */
export function startSalaMusica() {
  if (typeof window === 'undefined' || sala || salaEsperaGesto) return
  const ativa = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive
  const ok = ativa ?? ctx?.state === 'running'
  if (ok) {
    iniciarSala()
    return
  }
  const gesto = () => {
    window.removeEventListener('pointerdown', gesto)
    window.removeEventListener('keydown', gesto)
    salaEsperaGesto = null
    iniciarSala()
  }
  salaEsperaGesto = () => {
    window.removeEventListener('pointerdown', gesto)
    window.removeEventListener('keydown', gesto)
    salaEsperaGesto = null
  }
  window.addEventListener('pointerdown', gesto)
  window.addEventListener('keydown', gesto)
}

/** Desliga a trilha (fade out de 1,8 s). */
export function stopSalaMusica() {
  salaEsperaGesto?.()
  if (!sala || !ctx) return
  const s = sala
  sala = null
  const t = ctx.currentTime
  s.bus.gain.cancelScheduledValues(t)
  s.bus.gain.setValueAtTime(Math.max(s.bus.gain.value, 0.0001), t)
  s.bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
  s.parar()
  if (!musicPlaying) setAmbientDucked(false)
}

/** Abafa a trilha enquanto uma partida está aberta (sem cortar o clima). */
export function setSalaMusicaAbafada(on: boolean) {
  salaAbafada = on
  aplicarNivelSala(0.6)
}
