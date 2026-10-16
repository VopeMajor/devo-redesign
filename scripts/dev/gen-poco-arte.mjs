// Gera as artes do Poço dos Milagres (camadas WebP transparentes em public/images/poco/).
// Desenho vetorial detalhado (SVG com filtros de textura e luz) rasterizado UMA vez pelo Chromium: no celular
// só há imagens prontas e transforms CSS — nenhum filtro em tempo real.
//
// Uso: PLAYWRIGHT_FROM=/caminho/package.json node scripts/dev/gen-poco-arte.mjs   (precisa de python3 + Pillow)
// Saída: public/images/poco/{anel,estrutura,corrente,base,roda,raios,aura,lixo-*,…}.webp
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const OUT = join(root, 'public', 'images', 'poco')
const TMP = process.env.POCO_TMP ?? '/tmp/poco-arte'
mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url)
const { chromium } = require('playwright')

/* ───────────────────────────── utilitários de desenho ───────────────────────────── */
const f = (n) => Math.round(n * 100) / 100
const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('') + 'Z'
const rad = (d) => (d * Math.PI) / 180
const polar = (cx, cy, r, a) => [cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r]
/** Estrela de 4 pontas (o sigilo). */
const star4 = (cx, cy, r, w = 0.2) => P([[cx, cy - r], [cx + r * w, cy - r * w], [cx + r, cy], [cx + r * w, cy + r * w], [cx, cy + r], [cx - r * w, cy + r * w], [cx - r, cy], [cx - r * w, cy - r * w]])
/** Lança/agulha: losango alongado de (x1,y1) a (x2,y2). */
function needle(x1, y1, x2, y2, w, at = 0.32) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L
  const mx = x1 + dx * at, my = y1 + dy * at
  return P([[x1, y1], [mx + nx * w, my + ny * w], [x2, y2], [mx - nx * w, my - ny * w]])
}
/** Voluta (espiral de filigrana) começando em (x,y), girando `dir` (+1/-1). */
function voluta(x, y, r, dir = 1, voltas = 1.6, ang0 = 0) {
  const pts = []
  const n = 40
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = ang0 + dir * t * voltas * 360
    const rr = r * (1 - t * 0.82)
    pts.push(polar(x, y, rr, a))
  }
  return pts.map(([px, py], i) => `${i ? 'L' : 'M'}${f(px)} ${f(py)}`).join('')
}
/** Cristal facetado (prisma com ponta), base em (x,y), altura h, inclinação deg. */
function cristal(x, y, h, w, deg, id, tone = 'ame') {
  const c = tone === 'ame' ? ['#e4defa', '#a597e0', '#5b4c9a', '#231c45'] : ['#f6f3ee', '#cfc9bd', '#7c766c', '#2c2a26']
  const tip = h * 0.24
  const body = [[-w, 0], [-w * 0.92, -h + tip], [0, -h], [w * 0.92, -h + tip], [w, 0]]
  const tr = `translate(${f(x)} ${f(y)}) rotate(${deg})`
  return `<g transform="${tr}">
    <path d="${P(body)}" fill="url(#${id}-c)" stroke="${c[3]}" stroke-width="0.8"/>
    <path d="${P([[-w * 0.92, -h + tip], [0, -h], [0, 0], [-w, 0]])}" fill="${c[0]}" opacity="0.35"/>
    <path d="M0 ${-h}L0 0" stroke="${c[0]}" stroke-width="0.7" opacity="0.8"/>
    <path d="M${-w * 0.92} ${-h + tip}L0 ${-h + tip * 1.5}L${w * 0.92} ${-h + tip}" stroke="${c[0]}" stroke-width="0.5" fill="none" opacity="0.6"/>
  </g>`
}
const cristalGrad = (id, tone = 'ame') => {
  const c = tone === 'ame' ? ['#e4defa', '#a597e0', '#5b4c9a', '#231c45'] : ['#f6f3ee', '#cfc9bd', '#7c766c', '#2c2a26']
  return `<linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="${c[1]}"/><stop offset="0.45" stop-color="${c[0]}"/><stop offset="0.55" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></linearGradient>`
}

/* ───────────────────────────── materiais (defs) ───────────────────────────── */
const DEFS = `
<defs>
  <!-- aço champanhe envelhecido: luz de cima-esquerda -->
  <linearGradient id="aco" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f6f1e7"/><stop offset="0.22" stop-color="#d7cdbb"/><stop offset="0.5" stop-color="#9a907f"/>
    <stop offset="0.78" stop-color="#5a5248"/><stop offset="1" stop-color="#2a2621"/>
  </linearGradient>
  <linearGradient id="aco-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a352e"/><stop offset="0.18" stop-color="#bdb3a1"/><stop offset="0.32" stop-color="#f4eee3"/>
    <stop offset="0.5" stop-color="#a59a87"/><stop offset="0.8" stop-color="#4c463d"/><stop offset="1" stop-color="#1f1c18"/>
  </linearGradient>
  <linearGradient id="aco-escuro" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8e8574"/><stop offset="0.5" stop-color="#4a443b"/><stop offset="1" stop-color="#1c1a17"/>
  </linearGradient>
  <linearGradient id="marmore" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0d0d0f"/><stop offset="0.22" stop-color="#3a3a3f"/><stop offset="0.4" stop-color="#55555b"/>
    <stop offset="0.62" stop-color="#2a2a2e"/><stop offset="1" stop-color="#0a0a0c"/>
  </linearGradient>
  <linearGradient id="marmore-topo" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6e6e74"/><stop offset="0.5" stop-color="#3b3b40"/><stop offset="1" stop-color="#18181b"/>
  </linearGradient>
  <radialGradient id="agua" cx="0.5" cy="0.45" r="0.6">
    <stop offset="0" stop-color="#d9d1fb"/><stop offset="0.18" stop-color="#8f7fd6"/><stop offset="0.45" stop-color="#3b2f73"/>
    <stop offset="0.8" stop-color="#120e24"/><stop offset="1" stop-color="#050408"/>
  </radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#cfc6f5" stop-opacity="0.85"/><stop offset="0.35" stop-color="#8a7cc8" stop-opacity="0.35"/><stop offset="1" stop-color="#8a7cc8" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="joia" cx="0.38" cy="0.32" r="0.75">
    <stop offset="0" stop-color="#f3efff"/><stop offset="0.2" stop-color="#b6a9ee"/><stop offset="0.55" stop-color="#4e3f92"/><stop offset="1" stop-color="#15102c"/>
  </radialGradient>
  <linearGradient id="madeira" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1a1410"/><stop offset="0.35" stop-color="#4b3d32"/><stop offset="0.6" stop-color="#3a2f27"/><stop offset="1" stop-color="#140f0c"/>
  </linearGradient>
  ${cristalGrad('ca')}${cristalGrad('cb', 'pra')}
  <!-- grão de metal batido / pátina -->
  <filter id="patina" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0 0.08  0 0 0 -0.9 0.48" result="g"/>
    <feComposite in="g" in2="SourceAlpha" operator="in" result="gi"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge>
  </filter>
  <!-- grão fino da pedra (os veios são traços desenhados: veiosPedra) -->
  <filter id="veios" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="11" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.82  0 0 0 0.28 -0.14" result="gg"/>
    <feComposite in="gg" in2="SourceAlpha" operator="in" result="ggi"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="ggi"/></feMerge>
  </filter>
  <filter id="brilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="brilho-p" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dy="5" dx="2"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.75 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`

/* ───────────────────────────── camadas ───────────────────────────── */

/** Anel astral (gira devagar atrás do poço): numerais, runas, agulhas e losangos. */
function anel() {
  const cx = 200, cy = 200
  const parts = []
  parts.push(`<circle cx="${cx}" cy="${cy}" r="176" fill="none" stroke="url(#aco-escuro)" stroke-width="3"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="168" fill="none" stroke="#8a7cc8" stroke-width="0.8" opacity="0.6"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="url(#aco-escuro)" stroke-width="16" opacity="0.92"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="158" fill="none" stroke="#c9bfae" stroke-width="0.8" opacity="0.7"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="142" fill="none" stroke="#c9bfae" stroke-width="0.8" opacity="0.7"/>`)
  for (let i = 0; i < 120; i++) {
    const a = i * 3 - 90
    const big = i % 10 === 0
    const [x1, y1] = polar(cx, cy, 168, a)
    const [x2, y2] = polar(cx, cy, big ? 160 : 164, a)
    parts.push(`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke="#d8cfbf" stroke-width="${big ? 1.4 : 0.6}" opacity="${big ? 0.9 : 0.5}"/>`)
  }
  const num = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
  num.forEach((n, i) => {
    const a = i * 30 - 90
    const [x, y] = polar(cx, cy, 150, a)
    parts.push(`<text x="${f(x)}" y="${f(y)}" transform="rotate(${a + 90} ${f(x)} ${f(y)})" text-anchor="middle" dominant-baseline="central" font-family="Cinzel, 'Cormorant Garamond', serif" font-weight="700" font-size="11" fill="#e9e2d4" opacity="0.85">${n}</text>`)
    const [lx, ly] = polar(cx, cy, 150, a + 15)
    parts.push(`<path d="${star4(lx, ly, 4.2, 0.2)}" fill="#c2b9ec" opacity="0.8"/>`)
  })
  // anel interno de runas (traços esotéricos)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="124" fill="none" stroke="url(#aco-escuro)" stroke-width="7" opacity="0.8"/>`)
  for (let i = 0; i < 48; i++) {
    const a = i * 7.5
    const [x, y] = polar(cx, cy, 124, a)
    const k = i % 4
    const g = k === 0 ? `M-2 -3L2 3M2 -3L-2 3` : k === 1 ? `M0 -3.5V3.5M-2.5 -1H2.5` : k === 2 ? `M-2.5 3L0 -3.5L2.5 3` : `M-2 -3H2V3H-2`
    parts.push(`<path transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})" d="${g}" stroke="#e1d8f8" stroke-width="0.8" fill="none" opacity="0.75"/>`)
  }
  // agulhas cardeais + losangos
  for (let i = 0; i < 8; i++) {
    const a = i * 45 - 90
    const long = i % 2 === 0
    const [x1, y1] = polar(cx, cy, 112, a)
    const [x2, y2] = polar(cx, cy, long ? 198 : 186, a)
    parts.push(`<path d="${needle(x1, y1, x2, y2, long ? 3.4 : 2.2, 0.6)}" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.5"/>`)
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 90 - 45
    const [x, y] = polar(cx, cy, 176, a)
    parts.push(`<path d="${P([[x, y - 8], [x + 5.5, y], [x, y + 8], [x - 5.5, y]])}" fill="url(#joia)" stroke="#d8cfbf" stroke-width="0.8"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${DEFS}<g filter="url(#patina)">${parts.join('')}</g></svg>`
}

/** Pilar torcido com capitel, base e lança no topo. */
function pilar(x, top, bottom, mirror = false) {
  const w = 17
  const p = []
  // fuste
  p.push(`<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" fill="url(#aco-h)"/>`)
  // espiral (torção)
  for (let y = top + 6; y < bottom - 6; y += 9) {
    p.push(`<path d="M${x - w / 2} ${y + 6}Q${x} ${y - 1} ${x + w / 2} ${y - 3}" stroke="#1d1a16" stroke-width="1.6" fill="none" opacity="0.75"/>`)
    p.push(`<path d="M${x - w / 2} ${y + 7.5}Q${x} ${y + 0.5} ${x + w / 2} ${y - 1.5}" stroke="#f3ede2" stroke-width="0.7" fill="none" opacity="0.55"/>`)
  }
  // anéis
  for (const y of [top + 4, (top + bottom) / 2, bottom - 8]) p.push(`<rect x="${x - w / 2 - 3}" y="${y - 3}" width="${w + 6}" height="6" rx="1" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.6"/>`)
  // capitel com folhas
  p.push(`<path d="M${x - 15} ${top}L${x - 9} ${top - 12}H${x + 9}L${x + 15} ${top}Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.7"/>`)
  p.push(`<path d="${voluta(x - 12, top - 5, 6, -1, 1.2, 0)}" stroke="#2a2621" stroke-width="1.1" fill="none"/>`)
  p.push(`<path d="${voluta(x + 12, top - 5, 6, 1, 1.2, 180)}" stroke="#2a2621" stroke-width="1.1" fill="none"/>`)
  // base
  p.push(`<path d="M${x - 16} ${bottom}L${x - 11} ${bottom - 10}H${x + 11}L${x + 16} ${bottom}Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.7"/>`)
  // pináculo: torreta + lança
  p.push(`<path d="M${x - 8} ${top - 12}L${x - 6} ${top - 34}H${x + 6}L${x + 8} ${top - 12}Z" fill="url(#aco-h)" stroke="#1d1a16" stroke-width="0.7"/>`)
  p.push(`<path d="M${x - 3} ${top - 18}V${top - 28}M${x + 3} ${top - 18}V${top - 28}" stroke="#15130f" stroke-width="1.6"/>`)
  p.push(`<path d="${needle(x, top - 34, x, top - 76, 4.2, 0.3)}" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.6"/>`)
  p.push(`<path d="${star4(x, top - 40, 6, 0.2)}" fill="#e9e2d4"/>`)
  return p.join('')
}

/** Corrente: elos alternados ao longo de uma linha vertical. */
function corrente(x, y1, y2, s = 1) {
  const p = []
  let y = y1
  let i = 0
  while (y < y2) {
    if (i % 2 === 0) p.push(`<rect x="${x - 3.4 * s}" y="${y}" width="${6.8 * s}" height="${10 * s}" rx="${3.4 * s}" fill="none" stroke="url(#aco-h)" stroke-width="${2 * s}"/>`)
    else p.push(`<rect x="${x - 1}" y="${y}" width="2" height="${10 * s}" rx="1" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.4"/>`)
    y += 7.6 * s
    i++
  }
  return p.join('')
}

/** Arco catenário de corrente entre dois pontos (decorativo). */
function correnteCurva(x1, y1, x2, y2, sag) {
  const p = []
  const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 6.4)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t + sag * 4 * t * (1 - t)
    const tx = x2 - x1, ty = y2 - y1 + sag * 4 * (1 - 2 * t)
    const a = (Math.atan2(ty, tx) * 180) / Math.PI
    p.push(
      i % 2 === 0
        ? `<rect transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})" x="-4.6" y="-2.6" width="9.2" height="5.2" rx="2.6" fill="none" stroke="url(#aco-h)" stroke-width="1.4"/>`
        : `<rect transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})" x="-3.6" y="-0.8" width="7.2" height="1.6" rx="0.8" fill="#a99f8d"/>`,
    )
  }
  return p.join('')
}

/** Estrutura (atrás do balde): pilares, arco gótico, brasão, cristal pendente, sarilho, boca d'água. */
function estrutura() {
  const p = []
  // boca do poço (parte de trás da borda + água luminosa)
  p.push(`<ellipse cx="200" cy="352" rx="132" ry="34" fill="url(#marmore-topo)" filter="url(#veios)"/>`)
  p.push(`<clipPath id="aro"><ellipse cx="200" cy="352" rx="132" ry="34"/></clipPath><g clip-path="url(#aro)">${veiosPedra(68, 318, 264, 40, 6, 4)}</g>`)
  p.push(`<ellipse cx="200" cy="352" rx="112" ry="25" fill="url(#agua)"/>`)
  p.push(`<ellipse cx="200" cy="349" rx="70" ry="13" fill="url(#halo)" opacity="0.9"/>`)
  for (const [rx, ry, o] of [[30, 6, 0.5], [54, 11, 0.32], [80, 17, 0.2], [100, 22, 0.12]]) p.push(`<ellipse cx="200" cy="350" rx="${rx}" ry="${ry}" fill="none" stroke="#d9d1fb" stroke-width="0.8" opacity="${o}"/>`)
  p.push(`<path d="M150 344Q200 336 250 344" stroke="#f1edff" stroke-width="1.2" fill="none" opacity="0.35"/>`)
  for (let i = 0; i < 26; i++) {
    const x = 120 + ((i * 53) % 160), y = 342 + ((i * 29) % 18)
    p.push(`<circle cx="${x}" cy="${y}" r="${0.5 + (i % 3) * 0.35}" fill="#f1edff" opacity="${0.4 + (i % 4) * 0.12}"/>`)
  }
  // feixe de luz que sai da água
  p.push(`<path d="M150 350L118 120H282L250 350Z" fill="url(#halo)" opacity="0.16"/>`)
  // pilares
  p.push(pilar(92, 170, 356))
  p.push(pilar(308, 170, 356, true))
  // arco gótico duplo
  const arco = (o) => `M${92 + o} ${168}C${92 + o} ${110 - o * 0.4} ${150} ${74 + o * 0.9} ${200} ${58 + o}C${250} ${74 + o * 0.9} ${308 - o} ${110 - o * 0.4} ${308 - o} ${168}`
  p.push(`<path d="${arco(0)}" fill="none" stroke="url(#aco)" stroke-width="9"/>`)
  p.push(`<path d="${arco(0)}" fill="none" stroke="#1d1a16" stroke-width="9" stroke-dasharray="1 7" opacity="0.6"/>`)
  p.push(`<path d="${arco(15)}" fill="none" stroke="url(#aco-escuro)" stroke-width="4"/>`)
  // tracery: arcos trilobados entre os dois arcos
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    const x = 92 + 216 * t
    const yTop = 168 - Math.sin(Math.PI * t) * 104 - (t > 0.35 && t < 0.65 ? 6 : 0)
    p.push(`<path d="M${f(x)} ${f(yTop + 6)}v13" stroke="url(#aco)" stroke-width="2"/>`)
    p.push(`<circle cx="${f(x)}" cy="${f(yTop + 22)}" r="3" fill="none" stroke="#bdb3a1" stroke-width="1.1"/>`)
  }
  // crochês (espinhos) ao longo do arco externo
  for (let i = 1; i < 12; i++) {
    const t = i / 12
    const x = 92 + 216 * t
    const y = 168 - Math.sin(Math.PI * t) * 110
    const ang = Math.atan2(-Math.cos(Math.PI * t) * 110 * Math.PI, 216)
    const nx = Math.sin(ang), ny = -Math.cos(ang)
    p.push(`<path d="${needle(x, y, x + nx * 15, y + ny * 15, 2.2, 0.4)}" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.4"/>`)
  }
  // lanças cruzadas atrás do brasão
  p.push(`<path d="${needle(150, 112, 248, 18, 3.6, 0.75)}" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.6"/>`)
  p.push(`<path d="${needle(250, 112, 152, 18, 3.6, 0.75)}" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.6"/>`)
  // brasão: medalhão com lua crescente e estrela
  p.push(`<g filter="url(#sombra)">`)
  p.push(`<path d="M200 22L226 44L222 74L200 90L178 74L174 44Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="1"/>`)
  p.push(`<path d="M200 30L219 46L216 70L200 82L184 70L181 46Z" fill="#141217" stroke="#c9bfae" stroke-width="0.8"/>`)
  p.push(`<path d="M206 41A16 16 0 1 0 206 71A12.5 12.5 0 0 1 206 41Z" fill="url(#aco)"/>`)
  p.push(`<path d="${star4(211, 52, 6.5, 0.2)}" fill="#c2b9ec"/>`)
  p.push(`<path d="${voluta(170, 54, 12, -1, 1.35, 30)}" stroke="url(#aco)" stroke-width="2.4" fill="none"/>`)
  p.push(`<path d="${voluta(230, 54, 12, 1, 1.35, 150)}" stroke="url(#aco)" stroke-width="2.4" fill="none"/>`)
  p.push(`</g>`)
  // cristal pendente sob o brasão
  p.push(`<path d="M200 90V106" stroke="url(#aco)" stroke-width="1.6"/>`)
  p.push(`<g transform="translate(200 104) rotate(180)">${cristal(0, -32, 34, 8, 0, 'ca').replace('<g transform="translate(0 -32) rotate(0)">', '<g>')}</g>`)
  p.push(`<ellipse cx="200" cy="124" rx="18" ry="22" fill="url(#halo)" opacity="0.7"/>`)
  // correntes caindo do arco aos pilares (festões)
  p.push(correnteCurva(110, 150, 168, 110, 26))
  p.push(correnteCurva(232, 110, 290, 150, 26))
  // sarilho (eixo) de aço com corrente enrolada
  p.push(`<rect x="100" y="198" width="200" height="20" rx="4" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.8"/>`)
  for (let i = 0; i < 15; i++) p.push(`<rect x="${166 + i * 4.7}" y="197" width="4" height="22" rx="2" fill="none" stroke="#2e2a24" stroke-width="1.5"/>`)
  for (let i = 0; i < 15; i++) p.push(`<rect x="${166.6 + i * 4.7}" y="198" width="2.6" height="20" rx="1.3" fill="none" stroke="#e5ddcf" stroke-width="0.6" opacity="0.8"/>`)
  for (const x of [112, 288]) p.push(`<rect x="${x - 5}" y="194" width="10" height="28" rx="2" fill="url(#aco-h)" stroke="#1d1a16" stroke-width="0.6"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">${DEFS}<g filter="url(#patina)">${p.join('')}</g></svg>`
}

/** Balde de metal com cintas e alça, na ponta de uma corrente longa (a corrente sobe para fora do quadro). */
function balde(tipo = 'madeira') {
  const corpo = tipo === 'madeira' ? 'url(#madeira)' : tipo === 'ferro' ? 'url(#aco-escuro)' : tipo === 'cobre' ? '#6b4430' : 'url(#aco-h)'
  const p = []
  p.push(corrente(60, 0, 300))
  p.push(`<path d="M34 318Q60 280 86 318" fill="none" stroke="url(#aco)" stroke-width="3"/>`)
  p.push(`<path d="M30 316H90L84 372H36Z" fill="${corpo}" stroke="#0c0c0e" stroke-width="1.3"/>`)
  if (tipo === 'madeira') for (const x of [42, 52, 62, 72, 80]) p.push(`<path d="M${x} 317L${x - (x - 60) * 0.1} 371" stroke="#120d0a" stroke-width="0.9" opacity="0.8"/>`)
  for (const y of [326, 360]) p.push(`<path d="M${30 + (y - 316) * 0.107} ${y}H${90 - (y - 316) * 0.107}" stroke="url(#aco-h)" stroke-width="4.2"/>`)
  for (const [x, y] of [[36, 326], [84, 326], [39, 360], [81, 360]]) p.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="#f4eee3"/>`)
  p.push(`<ellipse cx="60" cy="316" rx="30" ry="5" fill="#0b0a0c"/>`)
  p.push(`<path d="${star4(60, 344, 6, 0.22)}" fill="#c9bfae" opacity="0.7"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 380" width="120" height="380">${DEFS}<g filter="url(#patina)">${p.join('')}</g></svg>`
}

/** Veios de mármore: linhas finas que serpenteiam (com ramificações), cinza claro em baixa opacidade. */
function veiosPedra(x0, y0, w, h, n, seed = 1) {
  let r = seed * 9301 + 49297
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  const out = []
  for (let i = 0; i < n; i++) {
    let x = x0 + rnd() * w, y = y0 + rnd() * h * 0.3
    let d = `M${f(x)} ${f(y)}`
    const dx = (rnd() - 0.5) * 7
    for (let k = 0; k < 18; k++) {
      x += dx + (rnd() - 0.5) * 9
      y += 4 + rnd() * 6
      d += `L${f(x)} ${f(y)}`
    }
    out.push(`<path d="${d}" stroke="#b9b8b4" stroke-width="${f(0.5 + rnd() * 1.1)}" fill="none" opacity="${f(0.18 + rnd() * 0.3)}" stroke-linejoin="round"/>`)
  }
  return out.join('')
}

/** Borda e corpo da frente do poço: mármore negro, cinta de inscrições, medalhão e cristais na base. */
function base() {
  const p = []
  // corpo cilíndrico (frente)
  p.push(`<clipPath id="corpo"><path d="M66 352A134 34 0 0 0 334 352V452A134 32 0 0 1 66 452Z"/></clipPath>`)
  p.push(`<path d="M66 352A134 34 0 0 0 334 352V452A134 32 0 0 1 66 452Z" fill="url(#marmore)" filter="url(#veios)"/>`)
  p.push(`<g clip-path="url(#corpo)">${veiosPedra(66, 340, 268, 120, 9)}</g>`)
  // fiadas de pedra
  for (const y of [384, 416]) p.push(`<path d="M68 ${y}A132 32 0 0 0 332 ${y}" stroke="#08080a" stroke-width="2.2" fill="none" opacity="0.9"/>`)
  for (const y of [386, 418]) p.push(`<path d="M72 ${y}A128 31 0 0 0 328 ${y}" stroke="#9a9aa0" stroke-width="0.6" fill="none" opacity="0.25"/>`)
  const juntas = []
  ;[[352, 384, 0], [384, 416, 0.5], [416, 452, 0]].forEach(([a, b, off]) => {
    for (let k = 0; k < 9; k++) {
      const th = -Math.PI / 2 + ((k + off) / 8) * Math.PI
      if (Math.abs(th) > 1.42) continue
      const x = 200 + 132 * Math.sin(th)
      const y0 = a + 2 + Math.cos(th) * 30, y1 = b + Math.cos(th) * 30
      juntas.push(`<path d="M${f(x)} ${f(y0)}L${f(x)} ${f(y1)}" stroke="#08080a" stroke-width="1.8" opacity="0.85"/>`)
    }
  })
  p.push(juntas.join(''))
  // cinta de metal com inscrições (logo abaixo da borda)
  p.push(`<path d="M66 364A134 33 0 0 0 334 364V376A134 33 0 0 1 66 376Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.8"/>`)
  for (let i = 0; i < 34; i++) {
    const th = -Math.PI / 2 + ((i + 0.5) / 34) * Math.PI
    const x = 200 + 132 * Math.sin(th)
    const y = 370 + Math.cos(th) * 33
    const k = i % 5
    const g = k === 0 ? 'M-1.6 -2.4L1.6 2.4M1.6 -2.4L-1.6 2.4' : k === 1 ? 'M0 -2.6V2.6M-1.8 -0.6H1.8' : k === 2 ? 'M-1.8 2.4L0 -2.6L1.8 2.4' : k === 3 ? 'M-1.6 -2.4H1.6V2.4' : 'M0 -2.6L1.8 0L0 2.6L-1.8 0Z'
    p.push(`<path transform="translate(${f(x)} ${f(y)}) scale(${f(0.55 + 0.45 * Math.cos(th))} 1)" d="${g}" stroke="#2a251f" stroke-width="0.9" fill="none"/>`)
  }
  // lábio da borda (frente)
  p.push(`<path d="M66 352A134 34 0 0 0 334 352A134 34 0 0 1 66 352Z" fill="url(#marmore-topo)"/>`)
  p.push(`<path d="M66 352A134 34 0 0 0 334 352" stroke="#c9c9cf" stroke-width="1.2" fill="none" opacity="0.5"/>`)
  p.push(`<path d="M66 352A134 34 0 0 0 334 352" stroke="url(#aco)" stroke-width="3.2" fill="none" transform="translate(0 6)" opacity="0.9"/>`)
  // medalhão central com volutas
  p.push(`<g filter="url(#sombra)" transform="translate(200 410)">`)
  p.push(`<path d="${voluta(-26, 0, 15, -1, 1.4, 0)}" stroke="url(#aco)" stroke-width="3" fill="none"/>`)
  p.push(`<path d="${voluta(26, 0, 15, 1, 1.4, 180)}" stroke="url(#aco)" stroke-width="3" fill="none"/>`)
  p.push(`<path d="M0 -26L18 -10L14 14L0 26L-14 14L-18 -10Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="1"/>`)
  p.push(`<path d="M0 -19L12 -8L9.5 10L0 18L-9.5 10L-12 -8Z" fill="url(#joia)" stroke="#e9e2d4" stroke-width="0.8"/>`)
  p.push(`<path d="${star4(0, 0, 9, 0.18)}" fill="#f3efff" opacity="0.85"/>`)
  p.push(`<path d="${needle(0, 26, 0, 46, 3, 0.3)}" fill="url(#aco)"/>`)
  p.push(`</g>`)
  // cristais crescendo na base (esquerda e direita)
  const grupo = (x, y, s, dir) =>
    [
      cristal(x, y, 46 * s, 8 * s, -14 * dir, 'ca'),
      cristal(x + 12 * dir * s, y + 4, 30 * s, 6 * s, 22 * dir, 'ca'),
      cristal(x - 11 * dir * s, y + 3, 26 * s, 5.5 * s, -36 * dir, 'cb'),
      cristal(x + 22 * dir * s, y + 6, 18 * s, 4.5 * s, 44 * dir, 'ca'),
    ].join('')
  p.push(`<ellipse cx="74" cy="468" rx="40" ry="10" fill="url(#halo)" opacity="0.7"/>`)
  p.push(`<ellipse cx="328" cy="470" rx="34" ry="9" fill="url(#halo)" opacity="0.6"/>`)
  p.push(grupo(74, 470, 1, 1))
  p.push(grupo(330, 472, 0.8, -1))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">${DEFS}<g>${p.join('')}</g></svg>`
}

/** Roda da manivela: engrenagem ornamental com raios em voluta e pega. */
function roda() {
  const p = []
  const cx = 60, cy = 60
  const dentes = []
  for (let i = 0; i < 24; i++) {
    const a = i * 15
    const [x1, y1] = polar(cx, cy, 44, a - 4), [x2, y2] = polar(cx, cy, 50, a - 2.5), [x3, y3] = polar(cx, cy, 50, a + 2.5), [x4, y4] = polar(cx, cy, 44, a + 4)
    dentes.push(`L${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}L${f(x4)} ${f(y4)}`)
  }
  p.push(`<path d="M${dentes.join('').slice(1)}Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.8"/>`)
  p.push(`<circle cx="${cx}" cy="${cy}" r="38" fill="#121014" stroke="url(#aco-h)" stroke-width="3"/>`)
  for (let i = 0; i < 6; i++) {
    const a = i * 60
    const [x, y] = polar(cx, cy, 36, a)
    p.push(`<path d="M${cx} ${cy}Q${f(polar(cx, cy, 22, a + 24)[0])} ${f(polar(cx, cy, 22, a + 24)[1])} ${f(x)} ${f(y)}" stroke="url(#aco)" stroke-width="3.2" fill="none"/>`)
    const [vx, vy] = polar(cx, cy, 24, a + 30)
    p.push(`<path d="${star4(vx, vy, 3.2, 0.25)}" fill="#c2b9ec" opacity="0.9"/>`)
  }
  p.push(`<circle cx="${cx}" cy="${cy}" r="10" fill="url(#joia)" stroke="url(#aco)" stroke-width="3"/>`)
  // braço e pega
  p.push(`<path d="M${cx} ${cy - 4}L${cx + 52} ${cy - 30}L${cx + 55} ${cy - 23}L${cx + 3} ${cy + 4}Z" fill="url(#aco)" stroke="#1d1a16" stroke-width="0.7"/>`)
  p.push(`<rect x="${cx + 46}" y="${cy - 52}" width="13" height="34" rx="6" transform="rotate(-26 ${cx + 52} ${cy - 35})" fill="url(#madeira)" stroke="#0c0c0e" stroke-width="0.8"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 120" width="130" height="120">${DEFS}<g filter="url(#patina)">${p.join('')}</g></svg>`
}

/** Raios de revelação (leque de feixes finos e longos), cor neutra prata: o CSS tinge por raridade. */
function raios(tom) {
  const cor = tom === 'ame' ? ['#e9e4ff', '#8a7cc8'] : tom === 'ouro' ? ['#fbf6ec', '#d8cbb2'] : ['#ffffff', '#c9c6cf']
  const p = []
  for (let i = 0; i < 36; i++) {
    const a = i * 10 + (i % 3) * 2.3
    const L = i % 2 ? 190 : 240
    const w = i % 3 === 0 ? 7 : 3.5
    const [x1, y1] = polar(250, 250, 18, a - w / 4), [x2, y2] = polar(250, 250, L, a), [x3, y3] = polar(250, 250, 18, a + w / 4)
    p.push(`<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}Z" fill="url(#r)" opacity="${i % 3 === 0 ? 0.9 : 0.55}"/>`)
  }
  for (let i = 0; i < 16; i++) {
    const [x, y] = polar(250, 250, 60 + ((i * 37) % 150), i * 22.5 + 7)
    p.push(`<path d="${star4(x, y, 3 + (i % 3) * 2.5, 0.18)}" fill="${cor[0]}" opacity="0.85"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><defs><radialGradient id="r" cx="250" cy="250" r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${cor[0]}"/><stop offset="0.35" stop-color="${cor[1]}" stop-opacity="0.75"/><stop offset="1" stop-color="${cor[1]}" stop-opacity="0"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(#b)">${p.join('')}</g><circle cx="250" cy="250" r="70" fill="url(#r)" opacity="0.8"/></svg>`
}

/** Aura suave (névoa luminosa) — fundo atrás do mecanismo. */
function aura() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs><radialGradient id="a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7d6fbd" stop-opacity="0.55"/><stop offset="0.4" stop-color="#4a3f80" stop-opacity="0.25"/><stop offset="1" stop-color="#19181f" stop-opacity="0"/></radialGradient><filter id="t"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.58  0 0 0 0 0.7  0 0 0 0.9 -0.25"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs><circle cx="200" cy="200" r="200" fill="url(#a)"/><circle cx="200" cy="200" r="190" fill="url(#a)" filter="url(#t)" opacity="0.8"/></svg>`
}

/* ── Prêmios: lixo (com humor) e recursos ─────────────────────────────────────────────── */
const ITENS = {
  // lixo (não vai ao inventário)
  'lixo-agua_suja': `<path d="M30 70Q60 40 90 70Q96 96 60 102Q24 96 30 70Z" fill="#4c5248"/><path d="M38 72Q60 56 82 72" stroke="#7c826f" stroke-width="2" fill="none"/><circle cx="48" cy="80" r="3" fill="#6b705d"/><circle cx="72" cy="86" r="2" fill="#6b705d"/><path d="M58 30Q64 46 58 52Q52 46 58 30Z" fill="#59604f"/>`,
  'lixo-pedra': `<path d="M22 86L34 52L62 40L92 54L100 84L74 100L38 98Z" fill="url(#marmore)" filter="url(#veios)" stroke="#0a0a0c" stroke-width="1.5"/><path d="M34 52L62 40L92 54L60 62Z" fill="#6c6c72" opacity="0.6"/>`,
  'lixo-tampa': `<ellipse cx="60" cy="72" rx="34" ry="12" fill="#5a5248"/>${Array.from({ length: 21 }, (_, i) => { const a = (i / 21) * Math.PI; return `<path d="M${f(60 + Math.cos(a) * 34)} ${f(72 + Math.sin(a) * 12)}v10" stroke="#3a352e" stroke-width="2.4"/>` }).join('')}<ellipse cx="60" cy="66" rx="34" ry="12" fill="url(#aco)"/><ellipse cx="60" cy="66" rx="26" ry="8" fill="none" stroke="#6b6357" stroke-width="1"/><path d="M44 62L58 70L76 60" stroke="#7a1a22" stroke-width="2" fill="none" opacity="0.5"/>`,
  'lixo-tampao': `<ellipse cx="60" cy="74" rx="44" ry="14" fill="#2c2c31"/><ellipse cx="60" cy="68" rx="44" ry="14" fill="url(#aco-escuro)"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="60" cy="68" rx="${36 - i * 7}" ry="${11.5 - i * 2.2}" fill="none" stroke="#24221e" stroke-width="1.2" opacity="0.8"/>`).join('')}<path d="M44 58Q44 44 60 44Q76 44 76 58" fill="none" stroke="url(#aco)" stroke-width="5"/><path d="M30 64Q36 60 40 66M84 70Q90 64 94 70" stroke="#5c6a3c" stroke-width="2.2" fill="none" opacity="0.8"/><path d="M52 36Q48 26 54 18M66 36Q70 24 64 14" stroke="#7f8a62" stroke-width="1.4" fill="none" opacity="0.6"/>`,
  'lixo-curativo': `<g transform="rotate(-24 60 64)"><rect x="18" y="52" width="84" height="26" rx="13" fill="#c9a98d"/><rect x="44" y="54" width="32" height="22" rx="3" fill="#e9ddcc"/><path d="M48 60Q56 64 52 70Q62 66 70 72" stroke="#7a2a2a" stroke-width="3" fill="none" opacity="0.7"/>${[26, 32, 88, 94].map((x) => `<circle cx="${x}" cy="65" r="1.2" fill="#8a6b52"/>`).join('')}</g>`,
  'lixo-meia': `<path d="M44 20H74V70Q74 92 94 96Q102 104 92 108H50Q40 106 42 92Z" fill="#6b6357"/><path d="M44 20H74V30H44Z" fill="#4a443b"/><circle cx="58" cy="56" r="5" fill="#2a2621"/><circle cx="82" cy="100" r="4" fill="#2a2621"/>`,
  'lixo-dente': `<path d="M38 30Q60 18 82 30Q90 52 78 70L72 100Q66 104 64 92L60 74L56 92Q54 104 48 100L42 70Q30 52 38 30Z" fill="#e7dfcf" stroke="#9a907f" stroke-width="1.5"/><path d="M48 36Q60 30 72 36" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/>`,
  'lixo-boleto': `<g transform="rotate(8 60 60)"><rect x="26" y="22" width="68" height="84" fill="#e9e8e5"/>${[34, 42, 50, 58].map((y) => `<path d="M34 ${y}H${70 + (y % 3) * 6}" stroke="#58585e" stroke-width="2"/>`).join('')}${Array.from({ length: 22 }, (_, i) => `<rect x="${32 + i * 2.6}" y="78" width="${i % 3 ? 1.2 : 2}" height="18" fill="#141416"/>`).join('')}<text x="60" y="72" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8" fill="#a3121f">VENCIDO</text></g>`,
  'lixo-chiclete': `<path d="M30 70Q34 48 56 52Q66 36 84 48Q100 56 92 74Q98 92 74 92Q60 104 44 92Q24 90 30 70Z" fill="#b98aa0"/><path d="M44 64Q58 58 70 66" stroke="#d9b3c4" stroke-width="3" fill="none"/>`,
  'lixo-chave_torta': `<circle cx="38" cy="60" r="16" fill="none" stroke="url(#aco)" stroke-width="6"/><path d="M52 62Q70 58 78 70T100 74" stroke="url(#aco)" stroke-width="6" fill="none"/><path d="M88 72v10M96 74v8" stroke="url(#aco)" stroke-width="5"/>`,
  'lixo-nada': `<path d="M34 36Q60 10 86 36" fill="none" stroke="url(#aco)" stroke-width="3"/><path d="M28 36H92L84 96H36Z" fill="url(#madeira)" stroke="#0c0c0e" stroke-width="1.5"/><path d="M30 48H90M33 84H87" stroke="url(#aco-h)" stroke-width="4"/><ellipse cx="60" cy="36" rx="32" ry="6" fill="#050506"/><ellipse cx="60" cy="37" rx="26" ry="3.5" fill="#1d1a2e"/>${[[46, 102, 4], [62, 110, 5], [74, 104, 3.5]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2.2}Q${x + r} ${y} ${x} ${y + r}Q${x - r} ${y} ${x} ${y - r * 2.2}Z" fill="#8f86b8" opacity="0.75"/>`).join('')}`,
  // recursos
  fragmento: `${cristal(60, 104, 82, 15, -8, 'ca')}${cristal(36, 106, 46, 9, -30, 'ca')}${cristal(86, 106, 52, 10, 24, 'cb')}<path d="${star4(66, 30, 10, 0.18)}" fill="#fff"/>`,
  essencia: `<path d="M48 20H72V34Q96 50 92 80Q86 108 60 108Q34 108 28 80Q24 50 48 34Z" fill="url(#joia)" stroke="url(#aco)" stroke-width="3"/><rect x="46" y="12" width="28" height="10" rx="2" fill="url(#aco)"/><path d="M40 70Q60 58 80 72Q78 98 60 100Q42 98 40 70Z" fill="#c2b9ec" opacity="0.55"/><path d="${star4(60, 80, 9, 0.2)}" fill="#fff" opacity="0.9"/>`,
  capsula: `<g transform="rotate(-18 60 60)"><rect x="40" y="14" width="40" height="92" rx="20" fill="url(#aco-h)" stroke="#1d1a16" stroke-width="1.5"/><rect x="40" y="56" width="40" height="8" fill="#2a2621"/><rect x="46" y="22" width="28" height="28" rx="6" fill="url(#joia)" opacity="0.9"/><path d="M50 74H70M50 82H70M50 90H64" stroke="#2a2621" stroke-width="1.6"/></g>`,
}
const LIXO_IDS = Object.keys(ITENS).filter((k) => k.startsWith('lixo-'))
function item(key) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${DEFS}<g filter="url(#patina)">${ITENS[key]}</g></svg>`
}

/* ───────────────────────────── render ───────────────────────────── */
const jobs = [
  ['anel', anel(), 400, 400, 2],
  ['estrutura', estrutura(), 400, 500, 2],
  ['base', base(), 400, 500, 2],
  ['roda', roda(), 130, 120, 3],
  ['balde-madeira', balde('madeira'), 120, 380, 2],
  ['balde-ferro', balde('ferro'), 120, 380, 2],
  ['balde-cobre', balde('cobre'), 120, 380, 2],
  ['balde-prata', balde('prata'), 120, 380, 2],
  ['raios-prata', raios('prata'), 500, 500, 1.4],
  ['raios-ame', raios('ame'), 500, 500, 1.4],
  ['raios-ouro', raios('ouro'), 500, 500, 1.4],
  ['aura', aura(), 400, 400, 1],
  ...Object.keys(ITENS).map((k) => [k, item(k), 120, 120, 3]),
]
const only = (process.env.POCO_ONLY ?? '').split(',').filter(Boolean)
const browser = await chromium.launch()
const page = await browser.newPage()
const fonts = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=block">`
for (const [name, svg, w, h, scale] of jobs) {
  if (only.length && !only.includes(name)) continue
  await page.setViewportSize({ width: Math.round(w * scale), height: Math.round(h * scale) })
  const html = `<!doctype html><html><head>${fonts}<style>html,body{margin:0;background:transparent}svg{display:block;width:${w * scale}px;height:${h * scale}px}</style></head><body>${svg}</body></html>`
  await page.setContent(html, { waitUntil: 'load' }).catch(() => {})
  await page.waitForTimeout(150)
  const png = join(TMP, `${name}.png`)
  await page.screenshot({ path: png, omitBackground: true })
  writeFileSync(join(TMP, `${name}.svg`), svg)
}
await browser.close()
// PNG → WebP (com alfa) pelo Pillow
execFileSync('python3', ['-c', `
import sys,glob,os
from PIL import Image
tmp, out, only = sys.argv[1], sys.argv[2], [x for x in sys.argv[3].split(',') if x]
for p in sorted(glob.glob(os.path.join(tmp,'*.png'))):
    n=os.path.basename(p)[:-4]
    if only and n not in only: continue
    im=Image.open(p).convert('RGBA'); bb=im.getbbox()
    im.save(os.path.join(out,n+'.webp'),'WEBP',quality=88,method=6)
    print(n, im.size, os.path.getsize(os.path.join(out,n+'.webp'))//1024,'KB')
`, TMP, OUT, only.join(',')], { stdio: 'inherit' })
console.log('lixo:', LIXO_IDS.join(' '))
