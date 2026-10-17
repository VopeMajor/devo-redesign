/* 6. ASAS DA CORUJA — caixa em arco de esmalte noturno, prata lunar, asas de penas em camadas abrindo do crescente
   (a esquerda maior: assimetria), estrelas penduradas em correntes finas e um laço de fita com céu estrelado
   embaixo (ref-04). */
import { estrela4, lin, n2, type Pt } from '../kit'
import { ceuDefs, fioRelevo, gemaLapidada, laco, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-lu`, 'lua')}${ceuDefs(`${u}-ceu`)}${texturaDefs(u)}${lin(`${u}-pena`, ['#ffffff', '#e4e9f1', '#a7b0c1', '#5d6475'], 0, 0, 1, 0)}${lin(`${u}-pena2`, ['#f3f5fa', '#c3cad7', '#7b8395', '#3e4452'], 0, 0, 1, 0)}<radialGradient id="${u}-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e9eef8" stop-opacity=".55"/><stop offset="1" stop-color="#e9eef8" stop-opacity="0"/></radialGradient></defs>`

function pena(u: string, x: number, y: number, comp: number, larg: number, ang: number, grad: string) {
  const a = (ang * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  const p = (t: number, s: number) => `${n2(x + ux * t + nx * s)} ${n2(y + uy * t + ny * s)}`
  let barbas = ''
  for (let i = 1; i < 7; i++) {
    const t = comp * (0.14 + i * 0.12)
    barbas += `M${p(t, larg * 0.02)}L${p(t + comp * 0.07, larg * 0.4)}M${p(t, -larg * 0.02)}L${p(t + comp * 0.06, -larg * 0.24)}`
  }
  const d = `M${p(0, 0)}Q${p(comp * 0.35, larg * 0.62)} ${p(comp, larg * 0.08)}Q${p(comp * 0.6, -larg * 0.36)} ${p(comp * 0.1, -larg * 0.2)}Z`
  return `<path d="${d}" fill="#000" opacity=".35" transform="translate(1 1.5)"/><path d="${d}" fill="url(#${u}-${grad})" stroke="#262b38" stroke-width=".7"/><path d="${barbas}" stroke="#6f7789" stroke-opacity=".7" stroke-width=".45" fill="none"/><path d="M${p(0, 0)}L${p(comp * 0.97, larg * 0.07)}" stroke="#3a4050" stroke-width=".8"/><path d="M${p(comp * 0.15, -larg * 0.12)}Q${p(comp * 0.5, -larg * 0.26)} ${p(comp * 0.85, -larg * 0.02)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".5"/>`
}

function asa(u: string, osso: Pt[], angA: number, angB: number, compA: number, compB: number, larg: number, n: number) {
  const at = (t: number): Pt => {
    const f = t * (osso.length - 1)
    const i = Math.min(osso.length - 2, Math.floor(f))
    const k = f - i
    return [osso[i][0] + (osso[i + 1][0] - osso[i][0]) * k, osso[i][1] + (osso[i + 1][1] - osso[i][1]) * k]
  }
  let s = ''
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1)
    const [x, y] = at(t)
    s += pena(u, x, y, compA + (compB - compA) * t * t, larg * (0.8 + 0.45 * t), angA + (angB - angA) * t, i % 2 ? 'pena2' : 'pena')
  }
  for (let i = 0; i < n - 2; i++) {
    const t = (i + 0.5) / (n - 1)
    const [x, y] = at(t)
    s += pena(u, x, y, (compA + (compB - compA) * t) * 0.55, larg * 0.8, angA + (angB - angA) * t + 10, 'pena')
  }
  for (let i = 0; i < n - 3; i++) {
    const t = (i + 0.3) / (n - 1)
    const [x, y] = at(t)
    s += pena(u, x, y, (compA + (compB - compA) * t) * 0.3, larg * 0.7, angA + (angB - angA) * t + 16, 'pena2')
  }
  return s
}

/** Estrela de prata pendurada numa corrente fina; balança devagar quando animada. */
function pingente(u: string, x: number, y0: number, comp: number, r: number) {
  return `<g class="cos-a-balanco" style="transform-origin:${x}px ${y0}px"><path d="M${x} ${y0}V${y0 + comp}" stroke="url(#${u}-lu)" stroke-width=".9" stroke-dasharray="1.6 1"/><path d="${estrela4(x + 0.8, y0 + comp + r + 1.2, r, 0.24)}" fill="#000" opacity=".4"/><path d="${estrela4(x, y0 + comp + r, r, 0.24)}" fill="url(#${u}-lu-r)" stroke="#3a4050" stroke-width=".5"/><circle cx="${x}" cy="${y0 + comp + r}" r="${n2(r * 0.22)}" fill="#fff"/></g>`
}

const CAIXA = 'M18 28 H282 V374 H18 Z M30 360 H270 V160 A120 120 0 0 0 30 160 Z'

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => `${defs(u)}${sombra(u, 0.5)}
<g filter="url(#${u}-sombra)">
<path d="${CAIXA}" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="${CAIXA}" fill="url(#${u}-ceu-est)" fill-rule="evenodd"/>
${fioRelevo('M18 28 H282 V374 H18 Z', `${u}-lu`, 'lua', 3)}
${fioRelevo('M30 360 H270 V160 A120 120 0 0 0 30 160 Z', `${u}-lu`, 'lua', 2.2)}
<path d="M30.5 359.5V160 A119.5 119.5 0 0 1 269.5 160 V359.5" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
<path d="M36 160 A114 114 0 0 1 264 160" fill="none" stroke="#e9edf3" stroke-opacity=".35" stroke-width=".8" stroke-dasharray="2 3"/>
${asa(u, [[126, 30], [94, 18], [60, 20], [34, 36], [20, 66], [14, 104]], -100, 126, 18, 54, 18, 13)}
<g transform="matrix(-1 0 0 1 300 0)">${asa(u, [[126, 30], [100, 20], [74, 22], [52, 34], [40, 58]], -100, 128, 16, 40, 15, 9)}</g>
${pingente(u, 50, 100, 22, 6)}${pingente(u, 72, 84, 40, 4.6)}${pingente(u, 34, 130, 14, 3.6)}${pingente(u, 236, 88, 26, 5)}${pingente(u, 256, 106, 14, 3.8)}
<circle cx="150" cy="28" r="38" fill="url(#${u}-halo)" class="cos-a-pulso"/>
${relevo('M150 0 a30 30 0 1 0 25 46 a24 24 0 1 1 -25 -46Z', `${u}-lu-d`, 'lua', 1.1, ' transform="rotate(-22 150 28)"')}
${gemaLapidada(158, 24, 11, 11, 'perola', 'oval', `${u}-lu`)}
<path d="${estrela4(186, 10, 4)}${estrela4(112, 52, 3)}${estrela4(26, 250, 3)}${estrela4(276, 290, 3.4)}" fill="#fff" class="cos-a-cintila"/>
${pena(u, 56, 382, 34, 10, -14, 'pena')}${pena(u, 262, 336, 26, 8, 104, 'pena2')}
${laco(150, 362, 1.45, `${u}-ceu`, '#0b0918', `${u}-ceu-est`, `${u}-ceu-dobra`)}
${gemaLapidada(150, 362, 8, 8, 'safira', 'oval', `${u}-lu`)}
</g>`,
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
<path d="M9 11 H111 V112 H9 Z M20 100 H100 V60 A40 40 0 0 0 20 60 Z" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="M9 11 H111 V112 H9 Z M20 100 H100 V60 A40 40 0 0 0 20 60 Z" fill="url(#${u}-ceu-est)" fill-rule="evenodd"/>
${fioRelevo('M9 11 H111 V112 H9 Z', `${u}-lu`, 'lua', 2)}
${fioRelevo('M20 100 H100 V60 A40 40 0 0 0 20 60 Z', `${u}-lu`, 'lua', 1.6)}
${asa(u, [[50, 12], [32, 9], [16, 16], [8, 32]], -100, 124, 8, 22, 8, 7)}
<g transform="matrix(-1 0 0 1 120 0)">${asa(u, [[50, 12], [34, 10], [22, 18]], -100, 124, 7, 16, 7, 5)}</g>
${relevo('M60 0 a13 13 0 1 0 11 20 a10.4 10.4 0 1 1 -11 -20Z', `${u}-lu-d`, 'lua', 0.6, ' transform="rotate(-22 60 12)"')}
${laco(60, 106, 0.62, `${u}-ceu`, '#0b0918', `${u}-ceu-est`, `${u}-ceu-dobra`)}`,
}

export const CORUJA: MolduraArte = { avatar, mini }
