import * as THREE from 'three'

type MarbleSpec = { base: string; mottle: string; vein: string; veinAlpha: number; seed: number }

function makeRng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function makeMarbleTexture({ base, mottle, vein, veinAlpha, seed }: MarbleSpec) {
  const size = 256
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  const rnd = makeRng(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 26; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 20 + rnd() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, mottle)
    g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.12 + rnd() * 0.12
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  ctx.strokeStyle = vein
  ctx.lineCap = 'round'
  for (let i = 0; i < 7; i++) {
    let x = rnd() * size
    let y = rnd() < 0.5 ? 0 : rnd() * size
    ctx.globalAlpha = veinAlpha * (0.4 + rnd() * 0.6)
    ctx.lineWidth = 0.6 + rnd() * 1.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 6; k++) {
      const nx = x + (rnd() - 0.3) * 90
      const ny = y + rnd() * 70
      ctx.quadraticCurveTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 60, nx, ny)
      x = nx
      y = ny
    }
    ctx.stroke()
  }

  ctx.globalAlpha = 0.18
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = rnd() < 0.5 ? vein : mottle
    ctx.fillRect(rnd() * size, rnd() * size, 1, 1)
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

export const IVORY_MARBLE = { base: '#e9e1d2', mottle: '#cfc3ad', vein: '#9c8f7c', veinAlpha: 0.55 }
export const GRAPHITE_MARBLE = { base: '#24201e', mottle: '#3a3430', vein: '#b9a88c', veinAlpha: 0.32 }
