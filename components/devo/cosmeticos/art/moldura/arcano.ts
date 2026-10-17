/* 4. OLHO DO ARCANO — caixa em arco de esmalte noturno estrelado, crescente de aço com lanças (ref-02), olho com
   íris de ametista lapidada, cachos de cristal facetado assimétricos, órbita de glifos e cartas de tarô em leque
   saindo pelo canto (ref-03). Animada: halo do olho pulsa e os cristais cintilam. */
import { circulo, estrela4, n2, rad } from '../kit'
import { cartaTaro, ceuDefs, fioRelevo, gemaLapidada, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-ch`, 'champanhe')}${metalDefs(`${u}-ou`, 'ouro')}${ceuDefs(`${u}-ceu`)}${texturaDefs(u)}${rad(`${u}-halo`, ['rgba(176,156,245,.6)', 'rgba(138,124,200,.18)', 'rgba(138,124,200,0)'])}<linearGradient id="${u}-cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4efff"/><stop offset="1" stop-color="#a996ee"/></linearGradient><linearGradient id="${u}-ce" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a55c4"/><stop offset="1" stop-color="#22184f"/></linearGradient></defs>`

/** Cristal facetado: face clara, face escura, ponta e brilho. */
function cristal(u: string, x: number, y: number, comp: number, larg: number, ang: number) {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number) => `${n2(x + ux * t + nx * s)} ${n2(y + uy * t + ny * s)}`
  const w = larg / 2
  return `<path d="M${p(0, -w)}L${p(comp * 0.74, -w)}L${p(comp, 0)}L${p(comp * 0.74, w)}L${p(0, w)}Z" fill="#000" opacity=".4" transform="translate(1.2 1.8)"/><path d="M${p(0, -w)}L${p(comp * 0.74, -w)}L${p(comp, 0)}L${p(0, 0)}Z" fill="url(#${u}-cl)"/><path d="M${p(0, 0)}L${p(comp, 0)}L${p(comp * 0.74, w)}L${p(0, w)}Z" fill="url(#${u}-ce)"/><path d="M${p(comp * 0.74, -w)}L${p(comp, 0)}L${p(comp * 0.74, w)}" fill="#c9b9ff" opacity=".55"/><path d="M${p(0, -w)}L${p(comp * 0.74, -w)}L${p(comp, 0)}L${p(comp * 0.74, w)}L${p(0, w)}Z" fill="none" stroke="#120d26" stroke-width=".8"/><path d="M${p(comp * 0.1, -w * 0.6)}L${p(comp * 0.6, -w * 0.6)}" stroke="#fff" stroke-opacity=".8" stroke-width=".7" stroke-linecap="round"/>`
}

function cacho(u: string, x: number, y: number, s: number, base: number) {
  const pecas: [number, number, number][] = [
    [34, 11, base - 40],
    [46, 14, base - 12],
    [30, 10, base + 20],
    [22, 8, base + 48],
    [20, 7, base - 66],
  ]
  return pecas.map(([c, l, a]) => cristal(u, x, y, c * s, l * s, a)).join('') + `<circle cx="${x}" cy="${y}" r="${n2(5 * s)}" fill="#120d26"/>`
}

function crescente(u: string, s: number, cx: number, cy: number) {
  const P = (x: number, y: number) => `${n2(cx + x * s)} ${n2(cy + y * s)}`
  // crescente aberto para baixo com lança no alto e duas lâminas laterais
  const lua = `M${P(-58, 12)}C${P(-52, -24)} ${P(-24, -40)} ${P(0, -40)}C${P(24, -40)} ${P(52, -24)} ${P(58, 12)}C${P(44, -12)} ${P(24, -24)} ${P(0, -24)}C${P(-24, -24)} ${P(-44, -12)} ${P(-58, 12)}Z`
  const lanca = `M${P(0, -74)}L${P(5, -50)}L${P(2, -38)}L${P(-2, -38)}L${P(-5, -50)}Z`
  const laminaE = `M${P(-58, 12)}L${P(-80, 22)}L${P(-60, 2)}Z`
  const laminaD = `M${P(58, 12)}L${P(80, 22)}L${P(60, 2)}Z`
  return `${relevo(lanca, `${u}-ch-d`, 'champanhe', s)}${relevo(laminaE + laminaD, `${u}-ch-d`, 'champanhe', s)}${relevo(lua, `${u}-ch`, 'champanhe', s)}<path d="${P(-30, -30).replace(/^/, 'M')}L${P(-34, -38)}M${P(30, -30)}L${P(34, -38)}M${P(-46, -16)}L${P(-52, -22)}M${P(46, -16)}L${P(52, -22)}" stroke="url(#${u}-ch)" stroke-width="${n2(2.2 * s)}" stroke-linecap="round"/>${gemaLapidada(cx, cy - 47 * s, 6 * s, 8 * s, 'ametista', 'losango')}`
}

function olho(u: string, cx: number, cy: number, w: number, h: number, s: number) {
  return `<circle cx="${cx}" cy="${cy}" r="${n2(w * 0.85)}" fill="url(#${u}-halo)" class="cos-a-pulso"/><path d="M${n2(cx - w / 2 - 2 * s)} ${cy}Q${cx} ${n2(cy - h - 3 * s)} ${n2(cx + w / 2 + 2 * s)} ${cy}Q${cx} ${n2(cy + h + 3 * s)} ${n2(cx - w / 2 - 2 * s)} ${cy}Z" fill="url(#${u}-ch)" stroke="#16120d" stroke-width="${n2(0.8 * s)}"/><path d="M${n2(cx - w / 2)} ${cy}Q${cx} ${n2(cy - h)} ${n2(cx + w / 2)} ${cy}Q${cx} ${n2(cy + h)} ${n2(cx - w / 2)} ${cy}Z" fill="#f4f0e8" stroke="#16120d" stroke-width="${n2(0.9 * s)}"/>${gemaLapidada(cx, cy, h * 1.25, h * 1.25, 'ametista', 'oval')}<path d="${estrela4(cx, cy, h * 0.42, 0.18)}" fill="#0d0a1c" opacity=".85"/><path d="M${n2(cx - w / 2)} ${cy}Q${cx} ${n2(cy - h)} ${n2(cx + w / 2)} ${cy}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${n2(2 * s)}" transform="translate(0 ${n2(1.4 * s)})"/>`
}

function glifos(cx: number, cy: number, rx: number, ry: number, de: number, ate: number, n: number, tam: number) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = ((de + ((ate - de) * i) / Math.max(1, n - 1)) * Math.PI) / 180
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    const h = tam / 2
    const k = i % 5
    if (k === 0) d += `M${n2(x)} ${n2(y - h)}V${n2(y + h)}M${n2(x - h * 0.6)} ${n2(y - h * 0.3)}L${n2(x + h * 0.6)} ${n2(y + h * 0.3)}`
    else if (k === 1) d += `M${n2(x - h * 0.6)} ${n2(y + h)}L${n2(x)} ${n2(y - h)}L${n2(x + h * 0.6)} ${n2(y + h)}`
    else if (k === 2) d += `${circulo(x, y, h * 0.5)}M${n2(x)} ${n2(y - h)}V${n2(y - h * 0.5)}`
    else if (k === 3) d += `M${n2(x - h * 0.6)} ${n2(y - h)}L${n2(x + h * 0.6)} ${n2(y + h)}M${n2(x + h * 0.6)} ${n2(y - h)}L${n2(x - h * 0.6)} ${n2(y + h)}`
    else d += `M${n2(x - h * 0.5)} ${n2(y)}a${n2(h * 0.5)} ${n2(h * 0.5)} 0 1 0 ${n2(h)} 0`
  }
  return `<path d="${d}" fill="none" stroke="#d6ccff" stroke-width="${n2(tam * 0.13)}" stroke-linecap="round" class="cos-a-runa"/>`
}

const CAIXA = 'M16 26 H284 V378 H16 Z M30 360 H270 V160 A120 120 0 0 0 30 160 Z'

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => `${defs(u)}${sombra(u, 0.55)}
<g filter="url(#${u}-sombra)">
<path d="${CAIXA}" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="${CAIXA}" fill="url(#${u}-ceu-est)" fill-rule="evenodd" opacity=".9"/>
<path d="${CAIXA}" fill="url(#${u}-grao)" fill-rule="evenodd"/>
${fioRelevo('M16 26 H284 V378 H16 Z', `${u}-ch`, 'champanhe', 3.4)}
${fioRelevo('M30 360 H270 V160 A120 120 0 0 0 30 160 Z', `${u}-ch`, 'champanhe', 2.6)}
<path d="M30.5 359.5V160 A119.5 119.5 0 0 1 269.5 160 V359.5" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
${glifos(150, 160, 131, 131, -170, -10, 26, 7)}
<path d="M24 210 V350 M276 210 V350" stroke="#c2b9ec" stroke-opacity=".45" stroke-width="1" stroke-dasharray="1 5"/>
<ellipse cx="150" cy="34" rx="92" ry="16" fill="none" stroke="url(#${u}-ch)" stroke-width="1.6" transform="rotate(-8 150 34)"/>
${cacho(u, 22, 150, 1.05, 180)}
${cacho(u, 282, 262, 0.75, 0)}
${cristal(u, 300 - 22, 120, 26, 8, -20)}${cristal(u, 20, 300, 22, 7, 200)}
${crescente(u, 1, 150, 44)}
${olho(u, 150, 30, 58, 14, 1)}
<path d="${estrela4(86, 18, 6)}${estrela4(216, 14, 4.6)}${estrela4(52, 60, 3.4)}${estrela4(250, 70, 3)}" fill="#fff6e6" class="cos-a-cintila"/>
${cartaTaro(210, 318, 40, 64, -18, 'estrela', 'XVII', `${u}-ou`)}
${cartaTaro(240, 326, 40, 64, 10, 'lua', 'XVIII', `${u}-ou`)}
${gemaLapidada(150, 374, 14, 10, 'ametista', 'oval', `${u}-ch`)}
</g>`,
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
<path d="M8 10 H112 V112 H8 Z M20 100 H100 V60 A40 40 0 0 0 20 60 Z" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="M8 10 H112 V112 H8 Z M20 100 H100 V60 A40 40 0 0 0 20 60 Z" fill="url(#${u}-ceu-est)" fill-rule="evenodd"/>
${fioRelevo('M8 10 H112 V112 H8 Z', `${u}-ch`, 'champanhe', 2.2)}
${fioRelevo('M20 100 H100 V60 A40 40 0 0 0 20 60 Z', `${u}-ch`, 'champanhe', 1.8)}
${cacho(u, 9, 58, 0.48, 180)}
${crescente(u, 0.42, 60, 20)}
${olho(u, 60, 13, 28, 7, 0.5)}
${cartaTaro(92, 86, 18, 28, 14, 'lua', 'XVIII', `${u}-ou`)}`,
}

export const ARCANO: MolduraArte = { avatar, mini }
