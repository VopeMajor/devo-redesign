import * as THREE from 'three'

/**
 * Mármore procedural (canvas): base com manchas suaves, veios longos que atravessam a pedra e
 * rachaduras finas — o material da ref. `refs/ref-xadrez-marmore.png`. Semente fixa: o mesmo
 * tabuleiro em todos os aparelhos. Nada de imagem externa.
 */
export type MarbleSpec = { base: string; mottle: string; vein: string; veinAlpha: number; seed: number; size?: number; cracks?: number }

function makeRng(seed: number) {
  let s = Math.max(1, Math.floor(seed) % 2147483647)
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function drawMarble(ctx: CanvasRenderingContext2D, { base, mottle, vein, veinAlpha, seed, size = 256, cracks = 2 }: MarbleSpec) {
  const rnd = makeRng(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Nuvens de cor (o "leite" da pedra).
  for (let i = 0; i < 22; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = size * (0.1 + rnd() * 0.3)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, mottle)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 0.1 + rnd() * 0.14
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Veios: um feixe principal diagonal e ramos, com traço largo e esmaecido + núcleo fino.
  ctx.strokeStyle = vein
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const main = rnd() * Math.PI
  for (let i = 0; i < 6; i++) {
    const a = main + (rnd() - 0.5) * 0.9
    let x = size / 2 + Math.cos(a + Math.PI) * size * 0.8 + (rnd() - 0.5) * size * 0.6
    let y = size / 2 + Math.sin(a + Math.PI) * size * 0.8 + (rnd() - 0.5) * size * 0.6
    const pts: [number, number][] = [[x, y]]
    for (let k = 0; k < 14; k++) {
      x += Math.cos(a) * size * 0.13 + (rnd() - 0.5) * size * 0.09
      y += Math.sin(a) * size * 0.13 + (rnd() - 0.5) * size * 0.09
      pts.push([x, y])
    }
    const w = 0.5 + rnd() * (i === 0 ? 2.6 : 1.4)
    for (const [width, alpha] of [[w * 3.2, 0.12], [w, 0.75]] as const) {
      ctx.globalAlpha = veinAlpha * alpha * (0.5 + rnd() * 0.5)
      ctx.lineWidth = width * (size / 256)
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let k = 1; k < pts.length - 1; k++) ctx.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2)
      ctx.stroke()
    }
  }

  // Rachaduras finas e angulosas.
  for (let i = 0; i < cracks; i++) {
    let x = rnd() * size
    let y = rnd() * size
    let a = rnd() * Math.PI * 2
    ctx.globalAlpha = veinAlpha * 0.55
    ctx.lineWidth = 0.6 * (size / 256)
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 7; k++) {
      a += (rnd() - 0.5) * 1.2
      x += Math.cos(a) * size * 0.06
      y += Math.sin(a) * size * 0.06
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Grão.
  ctx.globalAlpha = 0.12
  for (let i = 0; i < size * 1.2; i++) {
    ctx.fillStyle = rnd() < 0.5 ? vein : mottle
    ctx.fillRect(rnd() * size, rnd() * size, 1, 1)
  }
  ctx.globalAlpha = 1
}

export function makeMarbleTexture(spec: MarbleSpec) {
  const size = spec.size ?? 256
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  drawMarble(c.getContext('2d')!, { ...spec, size })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

/** Mistura duas cores hex (t = 0 → a, 1 → b). */
export function mixHex(a: string, b: string, t: number) {
  return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`
}
