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
  g.addColorStop(0, '#0c1120')
  g.addColorStop(0.5, '#141c33')
  g.addColorStop(1, '#0a0e1a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(201,164,92,0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(12, 14, w - 24, 96)
  ctx.strokeRect(12, 124, w - 24, 118)
  // número da porta
  ctx.fillStyle = 'rgba(236,212,154,0.85)'
  ctx.font = '600 22px Cinzel, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(String((seed % 8) + 1).padStart(2, '0'), w / 2, 66)
  // fechadura
  ctx.fillStyle = 'rgba(239,230,210,0.95)'
  ctx.beginPath()
  ctx.arc(w * 0.78, 150, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(w * 0.78 - 3, 152, 6, 14)
  return finish(c)
}
