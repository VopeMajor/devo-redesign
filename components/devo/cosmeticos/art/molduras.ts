/**
 * Coleção inicial de molduras (texto do dono §3). Cada moldura tem dois formatos com a mesma identidade:
 *   avatar  viewBox 0 0 300 400 — janela da foto (30,40)–(270,360), retrato 3:4 do Record
 *   mini    viewBox 0 0 120 120 — janela da foto (20,20)–(100,100), quadrada (chat, ranking, listas)
 * A moldura é uma camada por cima da foto: nada aqui toca a imagem do jogador.
 */
import {
  volutaCheia,
  espelhoY,
  type Arte,
  banda,
  catmull,
  circulo,
  engrenagem,
  espelhoX,
  espiral,
  estrela4,
  fio,
  folha,
  g,
  gema,
  gemaGrad,
  lin,
  losango,
  metal,
  n2,
  naipe,
  peca,
  perola,
  type Pt,
  rad,
} from './kit'

import { AV, MI, type MolduraArte, voluta } from './moldura/base'
import { HERANCA } from './moldura/heranca'
export type { MolduraArte }

/* ═══════════════════════════════════════════ 2. RELÓGIO DO FIM ═══ */
/* Mecanismo exposto: mostrador em arco sobre o retrato, engrenagens de latão escuro e ponteiros. */

function relogioDefs(u: string) {
  return `<defs>${metal(`${u}-ch`, 'champanhe')}${metal(`${u}-chd`, 'champanhe', true)}${metal(`${u}-br`, 'bronze', true)}${metal(`${u}-fe`, 'ferro')}${rad(`${u}-dial`, ['#f4efe4', '#ddd3c0', '#b3a78f'], 0.5, 0.45, 0.65)}${rad(
    `${u}-perola`,
    ['#ffffff', '#f2eee8', '#cfc8c4', '#8f8791'],
    0.4,
    0.35,
    0.7,
  )}${gemaGrad(`${u}-rubi`, 'rubi')}</defs>`
}

function numeraisArco(cx: number, cy: number, r: number, de: number, ate: number, tam: number, cor: string) {
  const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
  let s = ''
  for (let h = 0; h < 12; h++) {
    const ang = h * 30 - 90
    if (ang < de || ang > ate) continue
    const a = (ang * Math.PI) / 180
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    s += `<text x="${n2(x)}" y="${n2(y)}" text-anchor="middle" dominant-baseline="central" font-size="${tam}" fill="${cor}" transform="rotate(${ang + 90} ${n2(x)} ${n2(y)})" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:600">${rom[h]}</text>`
  }
  return s
}

function tiques(cx: number, cy: number, r1: number, r2: number, de: number, ate: number, passo: number, cor: string, sw: number) {
  let d = ''
  for (let a = de; a <= ate + 0.01; a += passo) {
    const t = (a * Math.PI) / 180
    d += `M${n2(cx + Math.cos(t) * r1)} ${n2(cy + Math.sin(t) * r1)}L${n2(cx + Math.cos(t) * r2)} ${n2(cy + Math.sin(t) * r2)}`
  }
  return `<path d="${d}" stroke="${cor}" stroke-width="${sw}" fill="none"/>`
}

const relogioAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const gear = (cx: number, cy: number, r: number, dentes: number, cls: string, grad: string) =>
      `<g class="${cls}" style="transform-origin:${cx}px ${cy}px"><path d="${engrenagem(cx, cy, r, r * 0.84, dentes, r * 0.2, 5)}" fill="url(#${grad})" fill-rule="evenodd" stroke="#16120d" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${n2(r * 0.12)}" fill="#16120d"/></g>`
    return `${relogioDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".6"/></filter><clipPath id="${u}-semi"><path d="M106 40 A44 44 0 0 1 194 40 Z"/></clipPath></defs>
<g filter="url(#${u}-sombra)">
${gear(34, 350, 34, 18, 'cos-a-spin', `${u}-br`)}
${gear(78, 382, 19, 12, 'cos-a-spin-rev', `${u}-ch`)}
${gear(270, 62, 28, 15, 'cos-a-spin-rev', `${u}-br`)}
${gear(290, 104, 14, 10, 'cos-a-spin', `${u}-ch`)}
${banda(18, 30, 264, 342, 12, `${u}-fe`, '#0c0b0e', 1.1)}
${banda(18, 30, 264, 342, 3.2, `${u}-ch`, '#16120d', 0.9)}
${banda(26.8, 38.8, 246.4, 324.4, 3, `${u}-ch`, '#16120d', 0.9)}
<path d="M24 120 V70 M276 300 V230 M24 300 V230" stroke="#bab09f" stroke-opacity=".5" stroke-width="1" stroke-dasharray="1.5 4.5"/>
${(() => {
      let r = ''
      for (let y = 70; y <= 340; y += 18) r += `<circle cx="24" cy="${y}" r="1.7"/><circle cx="276" cy="${y}" r="1.7"/>`
      for (let x = 60; x <= 240; x += 18) if (x < 92 || x > 208) r += `<circle cx="${x}" cy="36" r="1.7"/>`
      for (let x = 60; x <= 240; x += 18) r += `<circle cx="${x}" cy="366" r="1.7"/>`
      return `<g fill="url(#${u}-ch)" stroke="#16120d" stroke-width=".5">${r}</g>`
    })()}
${(() => {
      const k = `<path d="M12 22 H62 V30 H22 V70 H12 Z" fill="url(#${u}-chd)" stroke="#16120d" stroke-width="1"/><circle cx="17" cy="27" r="2.4" fill="url(#${u}-ch)" stroke="#16120d" stroke-width=".6"/><circle cx="54" cy="26" r="1.6" fill="#16120d"/><circle cx="17" cy="62" r="1.6" fill="#16120d"/>`
      return k + espelhoX(300, k) + espelhoY(400, k + espelhoX(300, k))
    })()}
<path d="M98 40 A52 52 0 0 1 202 40 Z" fill="url(#${u}-fe)" stroke="#0c0b0e" stroke-width="1"/>
<path d="M98 40 A52 52 0 0 1 202 40" fill="none" stroke="url(#${u}-ch)" stroke-width="3.2"/>
<path d="M106 40 A44 44 0 0 1 194 40 Z" fill="url(#${u}-dial)" stroke="#5f584d" stroke-width=".8"/>
${tiques(150, 40, 38, 42.5, -180, 0, 7.5, '#3b352d', 0.9)}
${tiques(150, 40, 35, 42.5, -180, 0, 30, '#2a251f', 1.6)}
${numeraisArco(150, 40, 29, -150, -30, 7.5, '#2a251f')}
<path d="${estrela4(150, 26, 5)}" fill="#bab09f" opacity=".7"/>
<g clip-path="url(#${u}-semi)"><g class="cos-a-ponteiro" style="transform-origin:150px 40px"><path d="M150 40 L148.6 14 L150 6 L151.4 14 Z" fill="url(#${u}-fe)" stroke="#0c0b0e" stroke-width=".5"/></g><path d="M150 40 L170 26 L173 23 L168 28Z" fill="url(#${u}-fe)" stroke="#0c0b0e" stroke-width=".5"/></g>
<circle cx="150" cy="40" r="5.4" fill="url(#${u}-ch)" stroke="#16120d" stroke-width=".9"/>
<circle cx="150" cy="40" r="2.4" fill="url(#${u}-rubi)"/>
<path d="M90 40 H210" stroke="url(#${u}-ch)" stroke-width="3.4"/>
<path d="M10 192h14v16H10zM276 192h14v16h-14z" fill="url(#${u}-ch)" stroke="#16120d"/>
<circle cx="17" cy="200" r="3.2" fill="url(#${u}-rubi)" stroke="#16120d" stroke-width=".6"/><circle cx="283" cy="200" r="3.2" fill="url(#${u}-rubi)" stroke="#16120d" stroke-width=".6"/>
<g class="cos-a-pendulo" style="transform-origin:150px 372px"><path d="M150 372 V388" stroke="url(#${u}-ch)" stroke-width="2"/><circle cx="150" cy="392" r="6" fill="url(#${u}-ch)" stroke="#16120d"/><circle cx="150" cy="392" r="2.4" fill="url(#${u}-rubi)"/></g>
<path d="M200 386 h60 M212 380 v12 M226 380 v12 M240 380 v12 M254 380 v12" stroke="url(#${u}-ch)" stroke-width="2.2" stroke-linecap="round"/>
</g>`
  },
}

const relogioMini: Arte = {
  vb: MI.vb,
  corpo: (u) => `${relogioDefs(u)}
<g class="cos-a-spin" style="transform-origin:16px 104px"><path d="${engrenagem(16, 104, 15, 12.4, 12, 3, 4)}" fill="url(#${u}-br)" fill-rule="evenodd" stroke="#16120d" stroke-width=".8"/></g>
${banda(9, 11, 102, 99, 9, `${u}-fe`, '#0c0b0e', 0.8)}
${banda(9, 11, 102, 99, 2.4, `${u}-ch`, '#16120d', 0.6)}
${banda(16.5, 18.5, 87, 84, 2.2, `${u}-ch`, '#16120d', 0.6)}
<path d="M24 26 A40 40 0 0 1 96 26 L90 26 A34 34 0 0 0 30 26Z" fill="url(#${u}-dial)" stroke="#16120d" stroke-width=".8"/>
${tiques(60, 62, 36, 39.5, -150, -30, 15, '#2a251f', 0.9)}
<circle cx="60" cy="13" r="8" fill="url(#${u}-ch)" stroke="#16120d" stroke-width=".8"/>
<circle cx="60" cy="13" r="3.2" fill="url(#${u}-rubi)" stroke="#16120d" stroke-width=".5"/>
<g class="cos-a-spin-rev" style="transform-origin:104px 104px"><path d="${engrenagem(104, 104, 11, 9, 9, 2.4, 3)}" fill="url(#${u}-ch)" fill-rule="evenodd" stroke="#16120d" stroke-width=".7"/></g>`,
}

/* ═══════════════════════════════════════════ 3. PACTO CARMESIM ═══ */
/* Ferro enegrecido envolto em ramos de espinhos; rosas de vinho fechando os cantos. */

function carmesimDefs(u: string) {
  return `<defs>${metal(`${u}-fe`, 'ferro')}${metal(`${u}-pr`, 'prata')}${rad(`${u}-petala`, ['#d0475c', '#8c1a2c', '#4a0912', '#22040a'], 0.45, 0.4, 0.7)}${rad(
    `${u}-petala2`,
    ['#b5364a', '#6e1222', '#33060e'],
    0.5,
    0.3,
    0.8,
  )}${lin(`${u}-folha`, ['#56604f', '#2b3229', '#141812'])}${gemaGrad(`${u}-rubi`, 'rubi')}</defs>`
}

/** Rosa em camadas (vista de cima). */
function rosa(u: string, cx: number, cy: number, r: number, rot = 0) {
  let s = `<g transform="rotate(${rot} ${cx} ${cy})">`
  // pétalas externas
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const px = cx + Math.cos(a) * r * 0.55
    const py = cy + Math.sin(a) * r * 0.55
    s += `<ellipse cx="${n2(px)}" cy="${n2(py)}" rx="${n2(r * 0.55)}" ry="${n2(r * 0.42)}" transform="rotate(${n2((a * 180) / Math.PI + 90)} ${n2(px)} ${n2(py)})" fill="url(#${u}-petala)" stroke="#1a0307" stroke-width="${n2(r * 0.05)}"/>`
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6
    const px = cx + Math.cos(a) * r * 0.3
    const py = cy + Math.sin(a) * r * 0.3
    s += `<ellipse cx="${n2(px)}" cy="${n2(py)}" rx="${n2(r * 0.36)}" ry="${n2(r * 0.28)}" transform="rotate(${n2((a * 180) / Math.PI + 90)} ${n2(px)} ${n2(py)})" fill="url(#${u}-petala2)" stroke="#1a0307" stroke-width="${n2(r * 0.045)}"/>`
  }
  s += `<path d="${catmull(espiral(cx, cy, r * 0.3, r * 0.04, 1.6, 0, 1, 12))}" fill="none" stroke="#1a0307" stroke-width="${n2(r * 0.07)}"/><path d="${catmull(espiral(cx, cy, r * 0.32, r * 0.06, 1.5, 20, 1, 12))}" fill="none" stroke="#e1798a" stroke-opacity=".55" stroke-width="${n2(r * 0.035)}"/></g>`
  return s
}

/** Ramo com espinhos ao longo de pontos. */
function ramo(u: string, pts: Pt[], largura: number, espinhos = 8) {
  const d = catmull(pts)
  let thorns = ''
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const k = Math.max(1, Math.round(espinhos / pts.length))
    for (let j = 0; j < k; j++) {
      const t = (j + 0.5) / k
      const x = a[0] + (b[0] - a[0]) * t
      const y = a[1] + (b[1] - a[1]) * t
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + ((i + j) % 2 ? 1 : -1) * 1.1
      const l = largura * 2.4
      const bx = Math.cos(ang - Math.sign(Math.sin(ang)) * 0) * l
      thorns += `<path d="M${n2(x - Math.cos(ang - 1.57) * largura * 0.6)} ${n2(y - Math.sin(ang - 1.57) * largura * 0.6)}L${n2(x + bx)} ${n2(y + Math.sin(ang) * l)}L${n2(x + Math.cos(ang - 1.57) * largura * 0.6)} ${n2(y + Math.sin(ang - 1.57) * largura * 0.6)}Z" fill="#1d1f1b" stroke="#0a0b09" stroke-width=".4"/>`
    }
  }
  return `<path d="${d}" fill="none" stroke="#0b0c0a" stroke-width="${n2(largura + 1.2)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${u}-folha)" stroke-width="${n2(largura)}" stroke-linecap="round"/>${thorns}`
}

const pactoAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const fol = (x: number, y: number, c: number, l: number, a: number, k = 0) =>
      `<path d="${folha(x, y, c, l, a, k)}" fill="url(#${u}-folha)" stroke="#0a0b09" stroke-width=".7"/><path d="M${x} ${y}l${n2(Math.cos((a * Math.PI) / 180) * c * 0.8)} ${n2(Math.sin((a * Math.PI) / 180) * c * 0.8)}" stroke="#7b8672" stroke-opacity=".5" stroke-width=".6"/>`
    return `${carmesimDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000" flood-opacity=".6"/></filter></defs>
<g filter="url(#${u}-sombra)">
${banda(20, 30, 260, 340, 10, `${u}-fe`, '#060507', 1)}
${banda(26.5, 36.5, 247, 327, 3, `${u}-pr`, '#0c0b0e', 0.7)}
${ramo(u, [[150, 26], [110, 18], [70, 24], [40, 34], [24, 60], [18, 110], [24, 170]], 2.6, 14)}
${ramo(u, [[150, 26], [196, 30], [236, 22], [266, 36], [282, 70], [278, 120]], 2.2, 10)}
${ramo(u, [[276, 390], [250, 376], [206, 380], [170, 372]], 2.4, 8)}
${ramo(u, [[282, 360], [284, 300], [276, 250]], 2.2, 6)}
${ramo(u, [[20, 330], [12, 370], [40, 384], [96, 380]], 2.2, 8)}
${fol(56, 26, 22, 7, -150)}${fol(36, 52, 20, 6, 150)}${fol(44, 36, 18, 6, 200)}${fol(246, 26, 18, 6, -30)}${fol(260, 352, 20, 7, 210)}${fol(250, 378, 22, 7, 160)}${fol(232, 374, 16, 5, -100)}${fol(30, 372, 18, 6, 20)}
${rosa(u, 34, 40, 21, 10)}${rosa(u, 64, 22, 13, 40)}${rosa(u, 18, 76, 11, -20)}
${rosa(u, 264, 364, 24, -15)}${rosa(u, 232, 386, 13, 30)}${rosa(u, 286, 330, 11, 60)}
${rosa(u, 276, 40, 10, 0)}${rosa(u, 26, 362, 10, 0)}
${gema(150, 26, 12, 18, `${u}-rubi`, 'gota')}
<path d="M150 360 v18" stroke="url(#${u}-pr)" stroke-width="1.4"/>
${gema(150, 386, 9, 14, `${u}-rubi`, 'gota')}
</g>`
  },
}

const pactoMini: Arte = {
  vb: MI.vb,
  corpo: (u) => `${carmesimDefs(u)}
${banda(11, 11, 98, 98, 7, `${u}-fe`, '#060507', 0.8)}
${banda(15.5, 15.5, 89, 89, 2, `${u}-pr`, '#0c0b0e', 0.5)}
${ramo(u, [[60, 9], [36, 8], [16, 16], [9, 40], [10, 62]], 1.6, 8)}
${ramo(u, [[110, 60], [112, 86], [104, 106], [80, 112], [60, 110]], 1.6, 8)}
<path d="${folha(30, 9, 11, 3.6, -160)}${folha(10, 34, 11, 3.6, 110)}${folha(110, 84, 11, 3.6, -70)}${folha(86, 110, 11, 3.6, 20)}" fill="url(#${u}-folha)" stroke="#0a0b09" stroke-width=".5"/>
${rosa(u, 15, 15, 12.5, 15)}${rosa(u, 105, 105, 12.5, -20)}
${rosa(u, 36, 7, 6.5, 40)}${rosa(u, 113, 82, 6.5, 0)}
${gema(60, 10, 6, 9, `${u}-rubi`, 'gota')}`,
}

/* ═══════════════════════════════════════════ 4. OLHO DO ARCANO ═══ */
/* Arco de aço com o olho que vê o destino; cristais de ametista e uma órbita de glifos. */

function arcanoDefs(u: string) {
  return `<defs>${metal(`${u}-ch`, 'champanhe')}${metal(`${u}-chd`, 'champanhe', true)}${metal(`${u}-fe`, 'ferro')}${lin(`${u}-cri`, ['#f3eeff', '#b9a8f2', '#6d58c0', '#2c2068'], 0, 0, 1, 1)}${lin(`${u}-cri2`, ['#ded4ff', '#8f7bd8', '#3d2f86'], 1, 0, 0, 1)}${rad(
    `${u}-iris`,
    ['#f6f2ff', '#a796ea', '#4b3c9e', '#17112f'],
    0.5,
    0.5,
    0.55,
  )}${rad(`${u}-halo`, ['rgba(160,140,230,.55)', 'rgba(138,124,200,0)'], 0.5, 0.5, 0.5)}${lin(`${u}-esmalte`, ['#2a2340', '#14111f'])}</defs>`
}

function cristal(u: string, x: number, y: number, comp: number, larg: number, ang: number) {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number): string => `${n2(x + ux * t + nx * s)} ${n2(y + uy * t + ny * s)}`
  return `<path d="M${p(0, -larg * 0.5)}L${p(comp * 0.72, -larg * 0.5)}L${p(comp, 0)}L${p(comp * 0.72, larg * 0.5)}L${p(0, larg * 0.5)}Z" fill="url(#${u}-cri)" stroke="#120d26" stroke-width=".8"/><path d="M${p(0, 0)}L${p(comp, 0)}M${p(comp * 0.72, -larg * 0.5)}L${p(comp * 0.6, 0)}L${p(comp * 0.72, larg * 0.5)}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".6"/>`
}

function glifos(cx: number, cy: number, r: number, de: number, ate: number, n: number, tam: number, cor: string) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = ((de + ((ate - de) * i) / Math.max(1, n - 1)) * Math.PI) / 180
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    const k = i % 4
    const h = tam / 2
    if (k === 0) d += `M${n2(x)} ${n2(y - h)}V${n2(y + h)}M${n2(x - h * 0.6)} ${n2(y - h * 0.3)}L${n2(x + h * 0.6)} ${n2(y + h * 0.3)}`
    else if (k === 1) d += `M${n2(x - h * 0.6)} ${n2(y + h)}L${n2(x)} ${n2(y - h)}L${n2(x + h * 0.6)} ${n2(y + h)}M${n2(x - h * 0.3)} ${n2(y + h * 0.2)}H${n2(x + h * 0.3)}`
    else if (k === 2) d += `${circulo(x, y, h * 0.55)}M${n2(x)} ${n2(y - h)}V${n2(y - h * 0.55)}`
    else d += `M${n2(x - h * 0.6)} ${n2(y - h)}L${n2(x + h * 0.6)} ${n2(y + h)}M${n2(x + h * 0.6)} ${n2(y - h)}L${n2(x - h * 0.6)} ${n2(y + h)}`
  }
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${n2(tam * 0.14)}" stroke-linecap="round"/>`
}

function olho(u: string, cx: number, cy: number, w: number, h: number) {
  return `<path d="M${n2(cx - w / 2)} ${cy}Q${cx} ${n2(cy - h)} ${n2(cx + w / 2)} ${cy}Q${cx} ${n2(cy + h)} ${n2(cx - w / 2)} ${cy}Z" fill="#f4f1ea" stroke="#16120d" stroke-width="${n2(h * 0.12)}"/><circle cx="${cx}" cy="${cy}" r="${n2(h * 0.62)}" fill="url(#${u}-iris)" stroke="#16120d" stroke-width="${n2(h * 0.06)}"/><path d="${estrela4(cx, cy, h * 0.42, 0.18)}" fill="#0d0a1c"/><circle cx="${n2(cx - h * 0.2)}" cy="${n2(cy - h * 0.22)}" r="${n2(h * 0.12)}" fill="#fff"/><path d="M${n2(cx - w / 2 - h * 0.4)} ${cy}Q${cx} ${n2(cy - h * 1.35)} ${n2(cx + w / 2 + h * 0.4)} ${cy}" fill="none" stroke="url(#${u}-ch)" stroke-width="${n2(h * 0.2)}" stroke-linecap="round"/>`
}

const arcanoAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const lado = `${cristal(u, 22, 120, 30, 9, 200)}${cristal(u, 20, 140, 22, 7, 180)}${cristal(u, 22, 158, 26, 8, 160)}${cristal(u, 24, 300, 18, 6, 195)}${cristal(u, 22, 316, 24, 8, 168)}`
    return `${arcanoDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".55"/></filter></defs>
<circle cx="150" cy="22" r="40" fill="url(#${u}-halo)" class="cos-a-pulso"/>
<g filter="url(#${u}-sombra)">
<path d="M16 26 H284 V378 H16 Z M30 360 H270 V160 A120 120 0 0 0 30 160 Z" fill="url(#${u}-esmalte)" fill-rule="evenodd" stroke="#0d0a16" stroke-width="1"/>
<path d="M16 26 H284 V378 H16 Z" fill="none" stroke="url(#${u}-ch)" stroke-width="3.4"/>
<path d="M30 360 H270 V160 A120 120 0 0 0 30 160 Z" fill="none" stroke="url(#${u}-ch)" stroke-width="2.6"/>
<path d="M22 32 H278 V372 H22 Z" fill="none" stroke="#c2b9ec" stroke-opacity=".35" stroke-width=".8"/>
${glifos(150, 160, 130, -172, -8, 22, 7, '#c2b9ec')}
<path d="M24 200 V350 M276 200 V350" stroke="#c2b9ec" stroke-opacity=".5" stroke-width="1" stroke-dasharray="1 5"/>
${lado}${espelhoX(300, lado)}
${cristal(u, 150, 380, 22, 9, 90)}${cristal(u, 136, 376, 16, 7, 120)}${cristal(u, 164, 376, 16, 7, 60)}
<path d="M150 -2 L156 18 L150 30 L144 18Z" fill="url(#${u}-chd)" stroke="#16120d" stroke-width=".8"/>
<path d="M112 12 Q150 -8 188 12" fill="none" stroke="url(#${u}-ch)" stroke-width="2"/>
${olho(u, 150, 30, 64, 16)}
<path d="${estrela4(98, 20, 7)}${estrela4(202, 20, 7)}${estrela4(150, 62, 5)}" fill="url(#${u}-chd)" stroke="#16120d" stroke-width=".6"/>
<path d="M60 52 a10 10 0 1 0 8 -14 a8 8 0 1 1 -8 14Z M240 52 a10 10 0 1 1 -8 -14 a8 8 0 1 0 8 14Z" fill="url(#${u}-chd)" stroke="#16120d" stroke-width=".7"/>
</g>`
  },
}

const arcanoMini: Arte = {
  vb: MI.vb,
  corpo: (u) => `${arcanoDefs(u)}
<circle cx="60" cy="9" r="15" fill="url(#${u}-halo)" class="cos-a-pulso"/>
${banda(10, 12, 100, 98, 8, `${u}-esmalte`, '#0d0a16', 0.8)}
${banda(10, 12, 100, 98, 2, `${u}-ch`, '#0d0a16', 0.5)}
${banda(16.5, 18.5, 87, 85, 1.8, `${u}-ch`, '#0d0a16', 0.5)}
${glifos(60, 60, 45, 202, 338, 0, 4, '#c2b9ec')}
<path d="M10 40 V96 M110 40 V96" stroke="#c2b9ec" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="1 4"/>
${cristal(u, 11, 30, 13, 5, 205)}${cristal(u, 11, 40, 10, 4, 175)}${cristal(u, 109, 30, 13, 5, -25)}${cristal(u, 109, 40, 10, 4, 5)}
${cristal(u, 60, 109, 10, 5, 90)}
${olho(u, 60, 12, 30, 8)}`,
}

/* ═══════════════════════════════════════════ 5. BANQUETE DO JAVALI ═══ */
/* Ouro envelhecido, volutas barrocas, presas do Javali coroando, cartas e fichas da mesa. */

function javaliDefs(u: string) {
  return `<defs>${metal(`${u}-ou`, 'ouro')}${metal(`${u}-oud`, 'ouro', true)}${lin(`${u}-feltro`, ['#3b0f17', '#22070c'])}${lin(`${u}-carta`, ['#fbf7ee', '#e9e1cf'])}${lin(`${u}-presa`, ['#fffaf0', '#e3d6bd', '#a8977a'], 0, 0, 1, 1)}${gemaGrad(`${u}-rubi`, 'rubi')}${gemaGrad(
    `${u}-esm`,
    'esmeralda',
  )}</defs>`
}

function carta(u: string, x: number, y: number, w: number, h: number, ang: number, tipo: 'espadas' | 'copas' | 'ouros' | 'paus', letra: string) {
  const cor = tipo === 'copas' || tipo === 'ouros' ? '#8c1a2c' : '#17141a'
  return `<g transform="rotate(${ang} ${n2(x + w / 2)} ${n2(y + h / 2)})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${n2(w * 0.1)}" fill="url(#${u}-carta)" stroke="#2a2018" stroke-width="${n2(w * 0.035)}"/><rect x="${n2(x + w * 0.08)}" y="${n2(y + w * 0.08)}" width="${n2(w * 0.84)}" height="${n2(h - w * 0.16)}" rx="${n2(w * 0.06)}" fill="none" stroke="#b49a63" stroke-width="${n2(w * 0.02)}"/><path d="${naipe(tipo, x + w / 2, y + h * 0.55, w * 0.5)}" fill="${cor}"/><text x="${n2(x + w * 0.2)}" y="${n2(y + h * 0.24)}" font-size="${n2(w * 0.3)}" fill="${cor}" text-anchor="middle" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">${letra}</text></g>`
}

function ficha(u: string, cx: number, cy: number, r: number, cor: string, sombra = true) {
  let marcas = ''
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    marcas += `M${n2(cx + Math.cos(a - 0.14) * r * 0.98)} ${n2(cy + Math.sin(a - 0.14) * r * 0.98)}L${n2(cx + Math.cos(a + 0.14) * r * 0.98)} ${n2(cy + Math.sin(a + 0.14) * r * 0.98)}L${n2(cx + Math.cos(a + 0.12) * r * 0.74)} ${n2(cy + Math.sin(a + 0.12) * r * 0.74)}L${n2(cx + Math.cos(a - 0.12) * r * 0.74)} ${n2(cy + Math.sin(a - 0.12) * r * 0.74)}Z`
  }
  return `${sombra ? `<ellipse cx="${n2(cx)}" cy="${n2(cy + r * 0.22)}" rx="${n2(r)}" ry="${n2(r * 0.98)}" fill="#120a06"/>` : ''}<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="${cor}" stroke="#120a06" stroke-width="${n2(r * 0.08)}"/><path d="${marcas}" fill="#f3ead6"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r * 0.56)}" fill="none" stroke="url(#${u}-ou)" stroke-width="${n2(r * 0.12)}"/><path d="${estrela4(cx, cy, r * 0.34)}" fill="url(#${u}-ou)"/>`
}

function presa(u: string, x: number, y: number, s: number, espelho = false) {
  const d = `M${x} ${y}C${n2(x + 4 * s)} ${n2(y - 14 * s)} ${n2(x + 16 * s)} ${n2(y - 22 * s)} ${n2(x + 26 * s)} ${n2(y - 20 * s)}C${n2(x + 18 * s)} ${n2(y - 16 * s)} ${n2(x + 10 * s)} ${n2(y - 8 * s)} ${n2(x + 8 * s)} ${n2(y + 2 * s)}Z`
  return `<path d="${d}" fill="url(#${u}-presa)" stroke="#2b2116" stroke-width="${n2(0.9 * s)}"${espelho ? ` transform="matrix(-1 0 0 1 ${2 * x} 0)"` : ''}/>`
}

const javaliAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const voluta1 = `${fio(voluta([[150, 30], [120, 22], [90, 26], [70, 36]], 62, 48, 10, 2.4, 1.2, -80, -1), `${u}-ou`, 4)}${fio(voluta([[100, 32], [80, 44], [72, 60]], 80, 66, 6, 1.6, 1.1, 180, -1), `${u}-ou`, 2.6)}${peca(folha(118, 22, 22, 6, -170, -3), `${u}-oud`, '#2b1d0b', 0.9)}${peca(folha(92, 28, 18, 5, 160, 2), `${u}-oud`, '#2b1d0b', 0.9)}`
    const canto = `<path d="${volutaCheia([[24, 340], [12, 360], [16, 384], [40, 390]], 54, 380, 8, 1.8, 1.1, 150, -1, 7, 1.6)}" fill="url(#${u}-oud)" stroke="#2b1d0b" stroke-width=".9"/><path d="${folha(22, 374, 22, 7, -60)}" fill="url(#${u}-ou)" stroke="#2b1d0b" stroke-width=".8"/><circle cx="20" cy="380" r="5" fill="url(#${u}-ou)" stroke="#2b1d0b"/>${gema(20, 380, 5, 5, `${u}-rubi`, 'oval')}`
    return `${javaliDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2.4" stdDeviation="1.8" flood-color="#000" flood-opacity=".6"/></filter></defs>
<g filter="url(#${u}-sombra)">
${banda(14, 26, 272, 350, 16, `${u}-ou`, '#2b1d0b', 1.2)}
${banda(20, 32, 260, 338, 7, `${u}-feltro`, '#1a0408', 0.6)}
${banda(26.5, 38.5, 247, 323, 2.6, `${u}-oud`, '#2b1d0b', 0.7)}
<path d="M14 26h272v350H14z" fill="none" stroke="#fff3cf" stroke-opacity=".35" stroke-width=".8" transform="translate(1.5 1.5) scale(.99)"/>
${voluta1}${espelhoX(300, voluta1)}
${canto}${espelhoX(300, canto)}
${presa(u, 132, 24, 1.15, true)}${presa(u, 168, 24, 1.15)}
<path d="M128 26 L136 6 L144 18 L150 0 L156 18 L164 6 L172 26 Z" fill="url(#${u}-oud)" stroke="#2b1d0b" stroke-width="1"/>
<path d="M126 26 H174 V34 H126Z" fill="url(#${u}-ou)" stroke="#2b1d0b" stroke-width="1"/>
${gema(150, 30, 9, 8, `${u}-rubi`, 'oval')}${gema(136, 30, 5, 5, `${u}-esm`, 'oval')}${gema(164, 30, 5, 5, `${u}-esm`, 'oval')}
<circle cx="136" cy="6" r="2.6" fill="url(#${u}-ou)" stroke="#2b1d0b" stroke-width=".7"/><circle cx="164" cy="6" r="2.6" fill="url(#${u}-ou)" stroke="#2b1d0b" stroke-width=".7"/><circle cx="150" cy="0" r="3" fill="url(#${u}-ou)" stroke="#2b1d0b" stroke-width=".7"/>
${carta(u, 2, 52, 30, 44, -22, 'espadas', 'A')}${carta(u, 18, 44, 30, 44, -6, 'copas', 'K')}
${ficha(u, 266, 368, 17, '#7c1325')}${ficha(u, 250, 382, 14, '#16151a')}${ficha(u, 280, 386, 12, '#7c1325')}
<path d="M281 74 l10 12 -10 12 -10 -12Z" fill="url(#${u}-ou)" stroke="#2b1d0b"/>${gema(281, 86, 7, 10, `${u}-rubi`)}
<path d="M10 200 h10 M280 200 h10" stroke="url(#${u}-ou)" stroke-width="4"/>${gema(10, 200, 7, 10, `${u}-esm`)}${gema(290, 200, 7, 10, `${u}-esm`)}
</g>`
  },
}

const javaliMini: Arte = {
  vb: MI.vb,
  corpo: (u) => `${javaliDefs(u)}
${banda(8, 10, 104, 102, 11, `${u}-ou`, '#2b1d0b', 0.9)}
${banda(12, 14, 96, 94, 4.6, `${u}-feltro`, '#1a0408', 0.4)}
${banda(16.5, 18.5, 87, 85, 2, `${u}-oud`, '#2b1d0b', 0.5)}
${presa(u, 52, 11, 0.55, true)}${presa(u, 68, 11, 0.55)}
<path d="M50 12 L54 2 L58 8 L60 0 L62 8 L66 2 L70 12Z" fill="url(#${u}-oud)" stroke="#2b1d0b" stroke-width=".7"/>
${gema(60, 12, 6, 5, `${u}-rubi`, 'oval')}
${carta(u, 1, 82, 15, 22, -18, 'espadas', 'A')}
${ficha(u, 104, 106, 9, '#7c1325')}${ficha(u, 93, 112, 7, '#16151a')}`,
}

/* ═══════════════════════════════════════════ 6. ASAS DA CORUJA ═══ */
/* Prata lunar: crescente no alto, asas de penas finas abrindo dos ombros, estrelas pequenas. */

function corujaDefs(u: string) {
  return `<defs>${metal(`${u}-lu`, 'lua')}${metal(`${u}-lud`, 'lua', true)}${lin(`${u}-pena`, ['#ffffff', '#dfe4ec', '#9aa3b4', '#5d6475'], 0, 0, 1, 0)}${lin(`${u}-pena2`, ['#eef1f6', '#b7bfcd', '#6d7586'], 0, 0, 1, 0)}${lin(`${u}-ceu`, ['#2b2a35', '#19181f'])}${rad(
    `${u}-halo`,
    ['rgba(220,228,245,.45)', 'rgba(220,228,245,0)'],
  )}</defs>`
}

function pena(u: string, x: number, y: number, comp: number, larg: number, ang: number, grad = 'pena') {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number): string => `${n2(x + ux * t + nx * s)} ${n2(y + uy * t + ny * s)}`
  let barbas = ''
  for (let i = 1; i < 6; i++) {
    const t = comp * (0.18 + i * 0.13)
    barbas += `M${p(t, 0)}L${p(t + comp * 0.08, larg * 0.42)}`
  }
  return `<path d="M${p(0, 0)}Q${p(comp * 0.35, larg * 0.62)} ${p(comp, larg * 0.1)}Q${p(comp * 0.6, -larg * 0.38)} ${p(comp * 0.1, -larg * 0.2)}Z" fill="url(#${u}-${grad})" stroke="#2f3442" stroke-width=".7"/><path d="M${p(0, 0)}L${p(comp * 0.96, larg * 0.08)}" stroke="#4d5465" stroke-width=".7"/><path d="${barbas}" stroke="#7d8597" stroke-width=".45" fill="none"/>`
}

/** Asa aberta: penas saindo de um "osso" (pontos), girando de angA (base) a angB (ponta); as mais longas na ponta. */
function asa(u: string, osso: Pt[], angA: number, angB: number, compA: number, compB: number, larg: number, n: number) {
  const pts = osso
  const at = (t: number): Pt => {
    const f = t * (pts.length - 1)
    const i = Math.min(pts.length - 2, Math.floor(f))
    const k = f - i
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]
  }
  let prim = ''
  let cob = ''
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1)
    const [x, y] = at(t)
    const ang = angA + (angB - angA) * t
    prim += pena(u, x, y, compA + (compB - compA) * t * t, larg * (0.8 + 0.4 * t), ang, i % 2 ? 'pena2' : 'pena')
  }
  for (let i = 0; i < n - 2; i++) {
    const t = (i + 0.5) / (n - 1)
    const [x, y] = at(t)
    cob += pena(u, x, y, (compA + (compB - compA) * t) * 0.5, larg * 0.75, angA + (angB - angA) * t + 8, 'pena')
  }
  return prim + cob
}

const corujaAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const asaE = asa(u, [[124, 30], [94, 20], [62, 22], [38, 38], [24, 66], [20, 96]], -100, 128, 16, 46, 16, 12)
    return `${corujaDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".5"/></filter></defs>
<g filter="url(#${u}-sombra)">
<path d="M20 30 H280 V372 H20 Z M30 360 H270 V160 A120 120 0 0 0 30 160 Z" fill="url(#${u}-ceu)" fill-rule="evenodd" stroke="#0e0d13"/>
<path d="M20 30 H280 V372 H20 Z" fill="none" stroke="url(#${u}-lu)" stroke-width="3"/>
<path d="M30 360 H270 V160 A120 120 0 0 0 30 160 Z" fill="none" stroke="url(#${u}-lu)" stroke-width="2"/>
<path d="M34 160 A116 116 0 0 1 266 160" fill="none" stroke="#e9edf3" stroke-opacity=".35" stroke-width=".8" stroke-dasharray="2 3"/>
<path d="${estrela4(56, 150, 3)}${estrela4(244, 170, 3.4)}${estrela4(26, 250, 2.6)}${estrela4(274, 280, 2.6)}${estrela4(90, 24, 2.4)}${estrela4(212, 30, 2.8)}" fill="#e9edf3"/>
${asaE}${espelhoX(300, asaE)}
<circle cx="150" cy="28" r="34" fill="url(#${u}-halo)"/>
<path d="M150 4 a26 26 0 1 0 22 40 a21 21 0 1 1 -22 -40Z" fill="url(#${u}-lud)" stroke="#2f3442" stroke-width="1.1" transform="rotate(-20 150 30)"/>
<path d="${estrela4(156, 26, 6)}" fill="#fff" class="cos-a-cintila"/>
<path d="M118 376 Q150 360 182 376" fill="none" stroke="url(#${u}-lu)" stroke-width="2.4"/>
${pena(u, 150, 372, 22, 8, 100)}${pena(u, 146, 372, 18, 7, 120, 'pena2')}${pena(u, 154, 372, 18, 7, 60, 'pena2')}
</g>`
  },
}

const corujaMini: Arte = {
  vb: MI.vb,
  corpo: (u) => {
    const asaE = asa(u, [[50, 10], [34, 8], [20, 14], [12, 28], [10, 40]], -100, 128, 7, 19, 7, 8)
    return `${corujaDefs(u)}
${banda(12, 14, 96, 96, 6, `${u}-ceu`, '#0e0d13', 0.7)}
${banda(12, 14, 96, 96, 1.8, `${u}-lu`, '#2f3442', 0.4)}
${banda(16.2, 18.2, 87.6, 87.6, 1.5, `${u}-lu`, '#2f3442', 0.4)}
${asaE}${espelhoX(120, asaE)}
<path d="M60 1 a12 12 0 1 0 10 18 a9.6 9.6 0 1 1 -10 -18Z" fill="url(#${u}-lud)" stroke="#2f3442" stroke-width=".8" transform="rotate(-20 60 13)"/>
<path d="${estrela4(14, 70, 2.2)}${estrela4(106, 84, 2.2)}" fill="#e9edf3"/>
${pena(u, 60, 109, 10, 4.4, 90)}`
  },
}

/* ═══════════════════════════════════════════ 7. FORTUNA DO RATO ═══ */
/* Bronze gasto, moedas antigas empilhadas, correntes finas e pequenos sinais de trapaça. */

function ratoDefs(u: string) {
  return `<defs>${metal(`${u}-bz`, 'bronze')}${metal(`${u}-bzd`, 'bronze', true)}${metal(`${u}-pr`, 'prata', true)}${rad(`${u}-moeda`, ['#f4e2b4', '#c9a160', '#7d5a2c', '#4a3216'], 0.4, 0.35, 0.75)}${rad(`${u}-moedap`, ['#ffffff', '#cfcdc8', '#8a8780', '#4c4a46'], 0.4, 0.35, 0.75)}${lin(`${u}-esm`, ['#24201b', '#120f0c'])}</defs>`
}

function moeda(u: string, cx: number, cy: number, r: number, prata = false, inclina = 1) {
  const gr = prata ? `${u}-moedap` : `${u}-moeda`
  return `<g transform="translate(${n2(cx)} ${n2(cy)}) scale(1 ${inclina})"><circle r="${n2(r)}" fill="url(#${gr})" stroke="#2a1d0e" stroke-width="${n2(r * 0.09)}"/><circle r="${n2(r * 0.78)}" fill="none" stroke="#2a1d0e" stroke-opacity=".55" stroke-width="${n2(r * 0.06)}" stroke-dasharray="${n2(r * 0.12)} ${n2(r * 0.1)}"/><path d="M${n2(-r * 0.32)} ${n2(r * 0.3)}C${n2(-r * 0.36)} ${n2(-r * 0.1)} ${n2(-r * 0.06)} ${n2(-r * 0.42)} ${n2(r * 0.3)} ${n2(-r * 0.3)}C${n2(r * 0.12)} ${n2(-r * 0.12)} ${n2(r * 0.22)} ${n2(r * 0.12)} ${n2(r * 0.36)} ${n2(r * 0.26)}C${n2(r * 0.1)} ${n2(r * 0.36)} ${n2(-r * 0.1)} ${n2(r * 0.4)} ${n2(-r * 0.32)} ${n2(r * 0.3)}Z" fill="#2a1d0e" fill-opacity=".45"/><circle cx="${n2(r * 0.12)}" cy="${n2(-r * 0.2)}" r="${n2(r * 0.05)}" fill="#2a1d0e"/></g>`
}

function corrente(u: string, pts: Pt[], elo: number) {
  // elos alternados ao longo da polilinha
  let s = ''
  let k = 0
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.max(1, Math.floor(len / (elo * 1.5)))
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
    for (let j = 0; j < n; j++) {
      const t = j / n
      const x = a[0] + (b[0] - a[0]) * t
      const y = a[1] + (b[1] - a[1]) * t
      s +=
        k++ % 2
          ? `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(elo)}" ry="${n2(elo * 0.32)}" transform="rotate(${n2(ang)} ${n2(x)} ${n2(y)})" fill="url(#${u}-pr)" stroke="#2a2724" stroke-width=".5"/>`
          : `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(elo)}" ry="${n2(elo * 0.55)}" transform="rotate(${n2(ang)} ${n2(x)} ${n2(y)})" fill="none" stroke="url(#${u}-pr)" stroke-width="${n2(elo * 0.32)}"/><ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(elo)}" ry="${n2(elo * 0.55)}" transform="rotate(${n2(ang)} ${n2(x)} ${n2(y)})" fill="none" stroke="#2a2724" stroke-width=".4"/>`
    }
  }
  return s
}

function dado(x: number, y: number, s: number, ang: number) {
  const p = (cx: number, cy: number) => `<circle cx="${n2(x + cx * s)}" cy="${n2(y + cy * s)}" r="${n2(s * 0.09)}" fill="#2a1d0e"/>`
  return `<g transform="rotate(${ang} ${n2(x + s / 2)} ${n2(y + s / 2)})"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${n2(s * 0.18)}" fill="#f2ead9" stroke="#2a1d0e" stroke-width="${n2(s * 0.06)}"/>${p(0.28, 0.28)}${p(0.72, 0.72)}${p(0.5, 0.5)}${p(0.72, 0.28)}${p(0.28, 0.72)}</g>`
}

const ratoAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => `${ratoDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity=".55"/></filter></defs>
<g filter="url(#${u}-sombra)">
${banda(20, 30, 260, 340, 10, `${u}-esm`, '#0b0907', 0.9)}
${banda(20, 30, 260, 340, 3, `${u}-bz`, '#24180b', 0.8)}
${banda(27.5, 37.5, 245, 325, 2.6, `${u}-bz`, '#24180b', 0.7)}
<path d="M20 30 L52 30 L20 62Z M280 30 L248 30 L280 62Z M20 370 L52 370 L20 338Z M280 370 L248 370 L280 338Z" fill="url(#${u}-bzd)" stroke="#24180b" stroke-width=".8"/>
${corrente(u, [[44, 30], [76, 42], [114, 48], [150, 50], [186, 48], [224, 42], [256, 30]], 3.6)}
${moeda(u, 150, 56, 7, true)}
${(() => {
      const k = `<path d="${volutaCheia([[20, 66], [12, 46], [18, 26], [40, 18]], 52, 28, 7, 1.6, 1.1, -100, 1, 6, 1.4)}" fill="url(#${u}-bzd)" stroke="#24180b" stroke-width=".9"/>`
      return k + espelhoX(300, k)
    })()}
${corrente(u, [[280, 120], [290, 170], [284, 220]], 3.4)}
${moeda(u, 284, 230, 8)}
${moeda(u, 34, 368, 18, false, 0.42)}${moeda(u, 34, 360, 18, false, 0.42)}${moeda(u, 34, 352, 18, false, 0.42)}${moeda(u, 34, 344, 18, false, 0.42)}${moeda(u, 30, 336, 18, false, 0.42)}
${moeda(u, 68, 384, 15, true, 0.42)}${moeda(u, 66, 376, 15, true, 0.42)}
${moeda(u, 18, 314, 14)}${moeda(u, 52, 330, 11)}
${dado(242, 362, 22, -14)}
<g transform="rotate(16 268 380)"><rect x="258" y="360" width="22" height="32" rx="2.4" fill="#f6f0e2" stroke="#24180b" stroke-width=".9"/><path d="${naipe('espadas', 269, 378, 12)}" fill="#17141a"/><text x="262.5" y="369" font-size="7" fill="#17141a" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">A</text></g>
<path d="M150 14 c-8 0 -14 6 -14 12 c0 4 2 7 6 9 l-2 6 h20 l-2 -6 c4 -2 6 -5 6 -9 c0 -6 -6 -12 -14 -12Z" fill="url(#${u}-bz)" stroke="#24180b"/>
<circle cx="150" cy="26" r="4" fill="#120f0c"/><path d="M148.6 28 h2.8 l1 7 h-4.8Z" fill="#120f0c"/>
<path d="M126 22 q-10 -12 -22 -6 M174 22 q10 -12 22 -6" fill="none" stroke="url(#${u}-bz)" stroke-width="2.4" stroke-linecap="round"/>
</g>`,
}

const ratoMini: Arte = {
  vb: MI.vb,
  corpo: (u) => `${ratoDefs(u)}
${banda(11, 11, 98, 98, 7, `${u}-esm`, '#0b0907', 0.7)}
${banda(11, 11, 98, 98, 2.2, `${u}-bz`, '#24180b', 0.5)}
${banda(16, 16, 88, 88, 1.8, `${u}-bz`, '#24180b', 0.5)}
${corrente(u, [[20, 12], [40, 18], [60, 20], [80, 18], [100, 12]], 2.2)}
${moeda(u, 60, 22, 3.6, true)}
${moeda(u, 15, 108, 10, false, 0.45)}${moeda(u, 15, 103, 10, false, 0.45)}${moeda(u, 15, 98, 10, false, 0.45)}${moeda(u, 15, 93, 10, false, 0.45)}
${moeda(u, 34, 112, 7, true, 0.5)}
${dado(96, 96, 14, -14)}`,
}

/* ═══════════════════════════════════════════ 8. ÚLTIMA BADALADA (animada) ═══ */
/* Relógio sobrenatural: o retrato dentro do mostrador, sino no alto, pêndulo que nunca para. */

function badaladaDefs(u: string) {
  return `<defs>${metal(`${u}-ch`, 'champanhe')}${metal(`${u}-chd`, 'champanhe', true)}${metal(`${u}-fe`, 'ferro')}${lin(`${u}-noite`, ['#2b2a35', '#151420', '#0b0a10'])}${rad(`${u}-espectro`, ['rgba(194,185,236,.55)', 'rgba(138,124,200,.18)', 'rgba(138,124,200,0)'])}${gemaGrad(
    `${u}-ame`,
    'ametista',
  )}${lin(`${u}-chama`, ['rgba(237,232,255,.95)', 'rgba(170,152,235,.75)', 'rgba(90,79,143,0)'], 0, 1, 0, 0)}</defs>`
}

function sino(u: string, cx: number, cy: number, s: number) {
  return `<g class="cos-a-sino" style="transform-origin:${cx}px ${n2(cy - 12 * s)}px"><path d="M${n2(cx - 12 * s)} ${n2(cy + 8 * s)}C${n2(cx - 12 * s)} ${n2(cy - 2 * s)} ${n2(cx - 9 * s)} ${n2(cy - 12 * s)} ${cx} ${n2(cy - 12 * s)}C${n2(cx + 9 * s)} ${n2(cy - 12 * s)} ${n2(cx + 12 * s)} ${n2(cy - 2 * s)} ${n2(cx + 12 * s)} ${n2(cy + 8 * s)}L${n2(cx + 15 * s)} ${n2(cy + 11 * s)}H${n2(cx - 15 * s)}Z" fill="url(#${u}-ch)" stroke="#16120d" stroke-width="${n2(s)}"/><circle cx="${cx}" cy="${n2(cy + 13 * s)}" r="${n2(2.6 * s)}" fill="url(#${u}-chd)" stroke="#16120d" stroke-width="${n2(0.7 * s)}"/></g>`
}

const badaladaAvatar: Arte = {
  vb: AV.vb,
  corpo: (u) => {
    const chamaE = `<path d="M24 170 C14 150 26 136 22 118 C34 132 36 150 30 168 Z" fill="url(#${u}-chama)" class="cos-a-chama"/><path d="M26 250 C16 232 26 218 24 202 C34 216 36 232 30 250 Z" fill="url(#${u}-chama)" class="cos-a-chama cos-a-atraso"/>`
    let marcas = ''
    for (let h = 0; h < 60; h++) {
      const a = ((h * 6 - 90) * Math.PI) / 180
      const longo = h % 5 === 0
      const r1 = 136
      const r2 = longo ? 128 : 132.5
      marcas += `M${n2(150 + Math.cos(a) * r1)} ${n2(200 + Math.sin(a) * r1 * 1.24)}L${n2(150 + Math.cos(a) * r2)} ${n2(200 + Math.sin(a) * r2 * 1.24)}`
    }
    return `${badaladaDefs(u)}
<defs><filter id="${u}-sombra" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".6"/></filter></defs>
${chamaE}${espelhoX(300, chamaE)}
<g filter="url(#${u}-sombra)">
<path d="M24 22 Q150 -4 276 22 V380 H24 Z M150 40 A120 160 0 1 0 150.1 40 Z" fill="url(#${u}-noite)" fill-rule="evenodd" stroke="#0b0a10" stroke-width="1"/>
<path d="M24 22 Q150 -4 276 22 V380 H24 Z" fill="none" stroke="url(#${u}-ch)" stroke-width="3"/>
<ellipse cx="150" cy="200" rx="138" ry="178" fill="none" stroke="url(#${u}-ch)" stroke-width="1.4" stroke-opacity=".55"/>
<ellipse cx="150" cy="200" rx="120" ry="160" fill="none" stroke="url(#${u}-ch)" stroke-width="3"/>
<path d="${marcas}" stroke="#d8cfbd" stroke-width="1.1"/>
${[0, 3, 6, 9].map((h) => {
  const a = ((h * 30 - 90) * Math.PI) / 180
  const x = 150 + Math.cos(a) * 129
  const y = 200 + Math.sin(a) * 129 * 1.24
  return `<text x="${n2(x)}" y="${n2(y)}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#ece5d8" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:600">${['XII', 'III', 'VI', 'IX'][h / 3]}</text>`
}).join('')}
<ellipse cx="150" cy="200" rx="129" ry="169" fill="none" stroke="#c2b9ec" stroke-opacity=".35" stroke-width="10" class="cos-a-pulso"/>
<path d="M150 22 V8" stroke="url(#${u}-ch)" stroke-width="3"/>
${sino(u, 150, 8, 1)}
<path d="M114 26 Q150 2 186 26" fill="none" stroke="url(#${u}-ch)" stroke-width="3" stroke-linecap="round"/>
<path d="${estrela4(104, 26, 6)}${estrela4(196, 26, 6)}" fill="url(#${u}-chd)" stroke="#16120d" stroke-width=".6"/>${(() => { const k = `<path d="${volutaCheia([[30, 60], [34, 40], [50, 32]], 58, 44, 8, 1.6, 1.1, -90, 1, 6, 1.4)}${volutaCheia([[30, 70], [40, 90], [38, 110]], 30, 116, 6, 1.4, 1.05, 0, 1, 5, 1.2)}" fill="url(#${u}-chd)" stroke="#16120d" stroke-width=".8"/>`; return k + espelhoX(300, k) + espelhoY(400, k + espelhoX(300, k)) })()}
<circle cx="150" cy="30" r="17" fill="url(#${u}-noite)" stroke="url(#${u}-ch)" stroke-width="2.4"/>${(() => { let t = ""; for (let h = 0; h < 12; h++) { const a = (h * 30 * Math.PI) / 180; t += `M${n2(150 + Math.cos(a) * 14)} ${n2(30 + Math.sin(a) * 14)}L${n2(150 + Math.cos(a) * 11.5)} ${n2(30 + Math.sin(a) * 11.5)}` } return `<path d="${t}" stroke="#ece5d8" stroke-width="1"/>` })()}<g class="cos-a-ponteiro" style="transform-origin:150px 30px"><path d="M150 30 L148.8 19 L150 15 L151.2 19Z" fill="#ece5d8"/></g><g class="cos-a-ponteiro-lento" style="transform-origin:150px 30px"><path d="M150 30 L157 25 L159 24 L158 26Z" fill="#ece5d8"/></g><circle cx="150" cy="30" r="2" fill="url(#${u}-ame)"/>
<g class="cos-a-pendulo" style="transform-origin:150px 360px"><path d="M150 360 V384" stroke="url(#${u}-ch)" stroke-width="2"/><circle cx="150" cy="390" r="9" fill="url(#${u}-ch)" stroke="#16120d"/>${gema(150, 390, 7, 9, `${u}-ame`)}</g>
<path d="${estrela4(20, 40, 4)}${estrela4(282, 52, 3.4)}${estrela4(14, 330, 3)}${estrela4(288, 360, 3.6)}" fill="#ece5d8" class="cos-a-cintila"/>
</g>`
  },
}

const badaladaMini: Arte = {
  vb: MI.vb,
  corpo: (u) => {
    let marcas = ''
    for (let h = 0; h < 12; h++) {
      const a = ((h * 30 - 90) * Math.PI) / 180
      marcas += `M${n2(60 + Math.cos(a) * 55)} ${n2(60 + Math.sin(a) * 55)}L${n2(60 + Math.cos(a) * (h % 3 ? 50 : 46))} ${n2(60 + Math.sin(a) * (h % 3 ? 50 : 46))}`
    }
    return `${badaladaDefs(u)}
<path d="M60 1 A59 59 0 1 1 59.9 1 Z M60 20 A40 40 0 1 0 60.1 20 Z" fill="url(#${u}-noite)" fill-rule="evenodd" stroke="#0b0a10" stroke-width=".8"/>
<circle cx="60" cy="60" r="58" fill="none" stroke="url(#${u}-ch)" stroke-width="2.2"/>
<circle cx="60" cy="60" r="44" fill="none" stroke="#c2b9ec" stroke-opacity=".4" stroke-width="5" class="cos-a-pulso"/>
<circle cx="60" cy="60" r="40.6" fill="none" stroke="url(#${u}-ch)" stroke-width="2"/>
<path d="${marcas}" stroke="#d8cfbd" stroke-width="1.6"/>

${sino(u, 60, 4, 0.42)}
<g class="cos-a-pendulo" style="transform-origin:60px 112px">${gema(60, 114, 6, 8, `${u}-ame`)}</g>`
  },
}

export const MOLDURAS: Record<string, MolduraArte> = {
  'heranca-marfim': HERANCA,
  'relogio-fim': { avatar: relogioAvatar, mini: relogioMini },
  'pacto-carmesim': { avatar: pactoAvatar, mini: pactoMini },
  'olho-arcano': { avatar: arcanoAvatar, mini: arcanoMini },
  'banquete-javali': { avatar: javaliAvatar, mini: javaliMini },
  'asas-coruja': { avatar: corujaAvatar, mini: corujaMini },
  'fortuna-rato': { avatar: ratoAvatar, mini: ratoMini },
  'ultima-badalada': { avatar: badaladaAvatar, mini: badaladaMini },
}
