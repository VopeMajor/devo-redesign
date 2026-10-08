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

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
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

type NoiseOpts = { gain?: number; freq?: number; q?: number; delay?: number; sweepTo?: number }

function noise(dur: number, opts: NoiseOpts = {}) {
  const c = ensure()
  if (!c || !master) return
  const { gain = 0.08, freq = 1200, q = 1, delay = 0, sweepTo } = opts
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
  src.connect(filter).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.05)
}

export function playSfx(kind: Sfx) {
  if (muted) return
  switch (kind) {
    case 'hover':
      tone(1400, 0.05, { gain: 0.018, type: 'triangle' })
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
export type PrologueTrack = 'tale' | 'dread' | 'void' | 'mine'

const PRO_MELODY = [81, 84, 88, 86, 84, 83, 84, 81, 76, 77, 76, 74, 76, 80, 83, 86, 84, 83, 81, 0, 76, 81, 0, 0]
const PRO_BASS = [45, 43, 45, 50, 40, 40, 45, 45]
const PRO_TRACKS: Record<PrologueTrack, { beat: number; shift: number; level: number; cutoff: number; melody: boolean; drone: boolean; warp: number }> = {
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

  if (cfg.drone && beatInBar === 0 && bar % 2 === 0) {
    const f = midiHz(PRO_BASS[bar] - 12)
    const delay = Math.max(0, t - ctx.currentTime)
    tone(f, cfg.beat * 6.5, { type: 'sawtooth', gain: 0.03, attack: 1.2, delay, dest: pro.filter })
    tone(f * 1.006, cfg.beat * 6.5, { type: 'sawtooth', gain: 0.025, attack: 1.4, delay, dest: pro.filter })
  }

  pro.step++
  pro.next += cfg.beat
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
  bus.gain.exponentialRampToValueAtTime(cfg.level, c.currentTime + 1.6)
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
