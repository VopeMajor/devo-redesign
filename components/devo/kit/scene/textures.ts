'use client'

import * as THREE from 'three'
import { DV_COLOR } from '../tokens'

/**
 * Texturas desenhadas em <canvas> (nenhum arquivo externo). Cada função cria uma textura nova;
 * quem cria deve chamar `.dispose()` ao desmontar (os presets fazem isso via useDisposable).
 */

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

function finish(c: HTMLCanvasElement, opts: { repeat?: [number, number]; srgb?: boolean } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(opts.repeat[0], opts.repeat[1])
  }
  t.anisotropy = 2
  t.needsUpdate = true
  return t
}

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

/**
 * Mostrador de astrolábio (transparente): anéis, marcações e numerais.
 * `ticks` = divisões (60 = minutos, 72 = horas do pulso). `numerals` = 'roman' | 'hours72' | 'none'.
 */
export function makeDialTexture({
  size = 1024,
  color = DV_COLOR.gold,
  ticks = 60,
  numerals = 'roman',
  inner = 0.62,
}: {
  size?: number
  color?: string
  ticks?: number
  numerals?: 'roman' | 'hours72' | 'none'
  inner?: number
} = {}) {
  const { c, ctx } = canvas(size)
  const R = size / 2
  ctx.translate(R, R)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'

  const ring = (r: number, w: number, alpha = 1) => {
    ctx.globalAlpha = alpha
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  ring(R * 0.985, size * 0.006)
  ring(R * 0.955, size * 0.002, 0.7)
  ring(R * inner, size * 0.003, 0.8)
  ring(R * (inner - 0.03), size * 0.0015, 0.5)

  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2
    const major = numerals === 'hours72' ? i % 6 === 0 : i % 5 === 0
    const r1 = R * (major ? 0.86 : 0.9)
    const r2 = R * 0.945
    ctx.globalAlpha = major ? 1 : 0.65
    ctx.lineWidth = size * (major ? 0.006 : 0.0025)
    ctx.beginPath()
    ctx.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1)
    ctx.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  if (numerals !== 'none') {
    const labels = numerals === 'roman' ? ROMAN : Array.from({ length: 12 }, (_, i) => String(i * 6).padStart(2, '0'))
    ctx.font = `600 ${Math.round(size * (numerals === 'roman' ? 0.05 : 0.04))}px Cinzel, Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    labels.forEach((label, i) => {
      const a = (i / 12) * Math.PI * 2
      const r = R * 0.76
      ctx.save()
      ctx.translate(Math.sin(a) * r, -Math.cos(a) * r)
      ctx.rotate(a)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })
  }

  // losangos entre os numerais
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * Math.PI * 2
    const r = R * 0.68
    ctx.save()
    ctx.translate(Math.sin(a) * r, -Math.cos(a) * r)
    ctx.rotate(a + Math.PI / 4)
    const d = size * 0.008
    ctx.fillRect(-d, -d, d * 2, d * 2)
    ctx.restore()
  }
  return finish(c)
}

/** Brilho radial (sprites de luz, poeira, halos). Branco; tinja pelo material. */
export function makeGlowTexture(size = 128) {
  const { c, ctx } = canvas(size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return finish(c, { srgb: false })
}

/** Feixe de luz vertical (gradiente alto → transparente). */
export function makeShaftTexture() {
  const { c, ctx } = canvas(64, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 256)
  const h = ctx.createLinearGradient(0, 0, 64, 0)
  h.addColorStop(0, 'rgba(0,0,0,1)')
  h.addColorStop(0.5, 'rgba(0,0,0,0)')
  h.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = h
  ctx.fillRect(0, 0, 64, 256)
  return finish(c, { srgb: false })
}

/** Piso xadrez marfim/noite. */
export function makeCheckerTexture({ light = '#c9c1ad', dark = '#0b0e17', cells = 8 }: { light?: string; dark?: string; cells?: number } = {}) {
  const size = 256
  const { c, ctx } = canvas(size)
  const s = size / cells
  for (let y = 0; y < cells; y++)
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 ? dark : light
      ctx.fillRect(x * s, y * s, s, s)
    }
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = i % 2 ? '#000' : '#fff'
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5)
  }
  return finish(c, { repeat: [1, 1] })
}

/** Verso de carta DEVO: noite, treliça dourada, losango central. */
export function makeCardBackTexture() {
  const w = 256
  const h = 358
  const { c, ctx } = canvas(w, h)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, DV_COLOR.ink4)
  g.addColorStop(1, DV_COLOR.ink)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = DV_COLOR.gold
  ctx.lineWidth = 6
  ctx.strokeRect(8, 8, w - 16, h - 16)
  ctx.lineWidth = 1.5
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  for (let i = -h; i < w + h; i += 22) {
    ctx.beginPath()
    ctx.moveTo(i, 18)
    ctx.lineTo(i + h, h - 18)
    ctx.moveTo(i + h, 18)
    ctx.lineTo(i, h - 18)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = DV_COLOR.ink
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, 52, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = DV_COLOR.goldBright
  ctx.beginPath()
  ctx.moveTo(w / 2, h / 2 - 40)
  ctx.quadraticCurveTo(w / 2 + 6, h / 2 - 6, w / 2 + 40, h / 2)
  ctx.quadraticCurveTo(w / 2 + 6, h / 2 + 6, w / 2, h / 2 + 40)
  ctx.quadraticCurveTo(w / 2 - 6, h / 2 + 6, w / 2 - 40, h / 2)
  ctx.quadraticCurveTo(w / 2 - 6, h / 2 - 6, w / 2, h / 2 - 40)
  ctx.fill()
  return finish(c)
}

/** Porta com fechadura luminosa (corredor da Sala de Trocas). */
export function makeDoorTexture(seed = 0) {
  const w = 128
  const h = 256
  const { c, ctx } = canvas(w, h)
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, '#0e0d14')
  g.addColorStop(0.5, '#1b1824')
  g.addColorStop(1, '#0c0b11')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(176,154,108,0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(12, 14, w - 24, 96)
  ctx.strokeRect(12, 124, w - 24, 118)
  // número da porta
  ctx.fillStyle = 'rgba(227,213,172,0.85)'
  ctx.font = '600 22px Cinzel, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(String((seed % 8) + 1).padStart(2, '0'), w / 2, 66)
  // fechadura
  ctx.fillStyle = 'rgba(236,233,227,0.95)'
  ctx.beginPath()
  ctx.arc(w * 0.78, 150, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(w * 0.78 - 3, 152, 6, 14)
  return finish(c)
}

/**
 * Ambiente equiretangular desenhado (céu violeta, faixa dourada no horizonte e "softboxes").
 * Dá reflexo aos metais sem HDR externo; o three gera o PMREM sozinho ao usar em scene.environment.
 */
export function makeEnvTexture() {
  const w = 512
  const h = 256
  const { c, ctx } = canvas(w, h)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#4a4c7a')
  g.addColorStop(0.42, '#1c1b33')
  g.addColorStop(0.5, '#2c2618')
  g.addColorStop(0.56, '#121019')
  g.addColorStop(1, '#050407')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const blob = (x: number, y: number, r: number, color: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, color)
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  blob(w * 0.2, h * 0.5, 90, 'rgba(227,213,172,0.85)')
  blob(w * 0.72, h * 0.22, 70, 'rgba(170,165,214,1)')
  blob(w * 0.45, h * 0.12, 26, 'rgba(242,240,236,0.6)')
  blob(w * 0.92, h * 0.45, 40, 'rgba(255,255,255,0.8)')
  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

/** Névoa em manchas (planos de bruma que escondem a geometria ao longe). Branca; tinja no material. */
export function makeMistTexture(seed = 1) {
  const w = 512
  const h = 128
  const { c, ctx } = canvas(w, h)
  let s = seed * 9301 + 49297
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 28; i++) {
    const x = rnd() * w
    const y = h * (0.35 + rnd() * 0.4)
    const r = 30 + rnd() * 70
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, `rgba(255,255,255,${0.18 + rnd() * 0.22})`)
    rg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // apaga as bordas superior/inferior para não haver linha reta
  const fade = ctx.createLinearGradient(0, 0, 0, h)
  fade.addColorStop(0, 'rgba(0,0,0,1)')
  fade.addColorStop(0.3, 'rgba(0,0,0,0)')
  fade.addColorStop(0.7, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.needsUpdate = true
  return t
}

/* ─────────────────────────────── mármore (procedural) ─────────────────────────────── */

/** Gerador pseudoaleatório com semente (mármore igual em todo carregamento). */
function seeded(seed: number) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

/** Desenha veios num contexto: caminhos aleatórios suaves, finos, com halo leve. */
function drawVeins(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, count: number, seed: number, width = 1.2, alpha = 1) {
  const rnd = seeded(seed)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 0; i < count; i++) {
    let x = rnd() * w
    let y = rnd() * h
    let a = rnd() * Math.PI * 2
    const steps = 18 + Math.floor(rnd() * 26)
    const lw = width * (0.35 + rnd() * 1.1)
    ctx.strokeStyle = color
    ctx.globalAlpha = (0.25 + rnd() * 0.55) * alpha
    ctx.lineWidth = lw
    ctx.shadowColor = color
    ctx.shadowBlur = lw * 1.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < steps; k++) {
      a += (rnd() - 0.5) * 0.9
      const len = 6 + rnd() * 16
      x += Math.cos(a) * len
      y += Math.sin(a) * len
      ctx.lineTo(x, y)
      // ramificação ocasional (veio fino)
      if (rnd() < 0.08) {
        ctx.save()
        ctx.globalAlpha *= 0.6
        ctx.lineWidth = lw * 0.5
        ctx.moveTo(x, y)
        let bx = x
        let by = y
        let ba = a + (rnd() - 0.5) * 2
        for (let j = 0; j < 6; j++) {
          ba += (rnd() - 0.5) * 0.8
          bx += Math.cos(ba) * 8
          by += Math.sin(ba) * 8
          ctx.lineTo(bx, by)
        }
        ctx.moveTo(x, y)
        ctx.restore()
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** Placa de mármore (branco ou negro) com nuvens e veios, em canvas. */
function marbleCanvas(size: number, kind: 'white' | 'black', seed: number) {
  const { c, ctx } = canvas(size)
  ctx.fillStyle = kind === 'white' ? '#e7e5e1' : '#1d1d22'
  ctx.fillRect(0, 0, size, size)
  // nuvens
  const rnd = seeded(seed + 7)
  for (let i = 0; i < 14; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = size * (0.1 + rnd() * 0.3)
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, kind === 'white' ? 'rgba(170,168,176,0.14)' : 'rgba(80,78,96,0.22)')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  if (kind === 'white') {
    drawVeins(ctx, size, size, 'rgba(110,108,116,1)', Math.round(size / 40), seed, size / 300)
    drawVeins(ctx, size, size, 'rgba(176,154,108,1)', 2, seed + 3, size / 500)
  } else {
    drawVeins(ctx, size, size, 'rgba(176,172,186,1)', Math.round(size / 60), seed, size / 420, 0.55)
    drawVeins(ctx, size, size, 'rgba(176,154,108,1)', 2, seed + 5, size / 500)
  }
  return { c, ctx }
}

/** Mármore liso (pedra única) — tampo, pedestal, colunas. */
export function makeMarbleTexture({ kind = 'white', size = 512, seed = 3, repeat = [1, 1] as [number, number] } = {}) {
  const { c } = marbleCanvas(size, kind as 'white' | 'black', seed)
  return finish(c, { repeat })
}

/**
 * Xadrez de mármore branco/negro com rejunte de latão (piso do salão, tabuleiro). Cada casa é
 * uma pedra própria (veios não continuam entre casas). `cells` por lado.
 */
export function makeMarbleCheckerTexture({ size = 1024, cells = 4, grout = true, seed = 11 }: { size?: number; cells?: number; grout?: boolean; seed?: number } = {}) {
  const white = marbleCanvas(size, 'white', seed).c
  const black = marbleCanvas(size, 'black', seed + 1).c
  const { c, ctx } = canvas(size)
  const s = size / cells
  for (let y = 0; y < cells; y++)
    for (let x = 0; x < cells; x++) {
      // cada casa recorta um trecho diferente da placa, para não repetir o mesmo veio
      const src = (x + y) % 2 ? black : white
      const ox = ((x * 3 + y * 5) % cells) * s
      const oy = ((x * 7 + y * 2) % cells) * s
      ctx.drawImage(src, ox, oy, s, s, x * s, y * s, s, s)
      // bisel leve: borda clara em cima/esquerda
      ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.35)'
      ctx.fillRect(x * s, y * s, s, 2)
      ctx.fillRect(x * s, y * s, 2, s)
    }
  if (grout) {
    ctx.strokeStyle = 'rgba(176,154,108,0.85)'
    ctx.lineWidth = Math.max(2, size / 400)
    for (let i = 0; i <= cells; i++) {
      ctx.beginPath()
      ctx.moveTo(i * s, 0)
      ctx.lineTo(i * s, size)
      ctx.moveTo(0, i * s)
      ctx.lineTo(size, i * s)
      ctx.stroke()
    }
  }
  return finish(c, { repeat: [1, 1] })
}

/** Céu noturno visto pelo vidro do relógio: disco azul-violeta com estrelas e brilho central. */
export function makeSkyDiscTexture(size = 512) {
  const { c, ctx } = canvas(size)
  const R = size / 2
  const g = ctx.createRadialGradient(R, R * 0.85, 0, R, R, R)
  g.addColorStop(0, '#6a6f9e')
  g.addColorStop(0.45, '#3e4170')
  g.addColorStop(0.85, '#1f1e3a')
  g.addColorStop(1, '#141329')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(R, R, R, 0, Math.PI * 2)
  ctx.fill()
  const rnd = seeded(5)
  for (let i = 0; i < 160; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * R * 0.96
    ctx.globalAlpha = 0.25 + rnd() * 0.65
    ctx.fillStyle = rnd() < 0.2 ? '#e3d5ac' : '#f2f0ec'
    const d = rnd() < 0.08 ? 2.2 : 1.1
    ctx.fillRect(R + Math.cos(a) * r, R + Math.sin(a) * r, d, d)
  }
  ctx.globalAlpha = 1
  return finish(c)
}

/** Vitral de ogiva (janela gótica acesa): gradiente noite com caixilhos em losango. */
export function makeGothicWindowTexture() {
  const w = 128
  const h = 256
  const { c, ctx } = canvas(w, h)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#5a5f8c')
  g.addColorStop(0.6, '#2c2d4d')
  g.addColorStop(1, '#16152a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(10,9,13,0.75)'
  ctx.lineWidth = 2
  for (let i = -h; i < w + h; i += 18) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + h, h)
    ctx.moveTo(i + h, 0)
    ctx.lineTo(i, h)
    ctx.stroke()
  }
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(w / 2, 0)
  ctx.lineTo(w / 2, h)
  ctx.moveTo(0, h * 0.55)
  ctx.lineTo(w, h * 0.55)
  ctx.stroke()
  return finish(c)
}
