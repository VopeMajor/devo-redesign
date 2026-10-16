/* 2. RELÓGIO DO FIM — mecanismo exposto: ferro rebitado em bisel, engrenagens de bronze atrás da moldura (uma
   grande saindo pelo alto à direita), meio mostrador de marfim no alto com ponteiros, chave de corda pendurada
   numa corrente à esquerda e pêndulo embaixo. Animado: engrenagens, ponteiro e pêndulo, devagar. */
import { engrenagem, n2 } from '../kit'
import { bandaBisel, contas, gemaLapidada, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, numerais, sombra, tiques } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-fe`, 'ferro')}${metalDefs(`${u}-ch`, 'champanhe')}${metalDefs(`${u}-br`, 'bronze')}${metalDefs(`${u}-ou`, 'ouro')}<radialGradient id="${u}-dial" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#fbf6ea"/><stop offset=".7" stop-color="#e3d8c2"/><stop offset="1" stop-color="#b7a98e"/></radialGradient>${texturaDefs(u)}</defs>`

function gear(u: string, cx: number, cy: number, r: number, dentes: number, cls: string, grad: string, m: 'bronze' | 'champanhe' | 'ferro') {
  return `<g class="${cls}" style="transform-origin:${cx}px ${cy}px">${relevo(engrenagem(cx, cy, r, r * 0.84, dentes, r * 0.18, 5), grad, m, Math.max(0.5, r / 30), ' fill-rule="evenodd"')}<circle cx="${cx}" cy="${cy}" r="${n2(r * 0.42)}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${n2(r * 0.06)}"/><circle cx="${cx}" cy="${cy}" r="${n2(r * 0.12)}" fill="url(#${u}-ch-r)" stroke="#16120d" stroke-width=".6"/></g>`
}

function rebites(u: string, pts: [number, number][], r: number) {
  return pts.map(([x, y]) => `<circle cx="${x + 0.5}" cy="${y + 0.8}" r="${r}" fill="#000" opacity=".5"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}-ch-r)" stroke="#16120d" stroke-width=".4"/>`).join('')
}

function chave(u: string, x: number, y: number, s: number) {
  const P = (a: number, b: number) => `${n2(x + a * s)} ${n2(y + b * s)}`
  return `${relevo(`M${P(-1.6, 0)}H${n2(x + 1.6 * s)}V${n2(y + 30 * s)}H${n2(x + 6 * s)}V${n2(y + 33 * s)}H${n2(x + 1.6 * s)}V${n2(y + 36 * s)}H${n2(x + 5 * s)}V${n2(y + 39 * s)}H${n2(x - 1.6 * s)}Z`, `${u}-br`, 'bronze', s)}${relevo(`M${P(-7, -8)}a${n2(7 * s)} ${n2(7 * s)} 0 1 0 ${n2(14 * s)} 0a${n2(7 * s)} ${n2(7 * s)} 0 1 0 ${n2(-14 * s)} 0Z M${P(-3, -8)}a${n2(3 * s)} ${n2(3 * s)} 0 1 1 ${n2(6 * s)} 0a${n2(3 * s)} ${n2(3 * s)} 0 1 1 ${n2(-6 * s)} 0Z`, `${u}-br-d`, 'bronze', s, ' fill-rule="evenodd"')}`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    const rb: [number, number][] = []
    for (let y = 64; y <= 344; y += 20) rb.push([22, y], [278, y])
    for (let x = 52; x <= 248; x += 20) if (x < 96 || x > 204) rb.push([x, 32])
    for (let x = 52; x <= 248; x += 20) rb.push([x, 368])
    const canto = `${relevo('M10 20 H66 V29 H20 V74 H10 Z', `${u}-ch-d`, 'champanhe')}`
    return `${defs(u)}${sombra(u, 0.6)}
<defs><clipPath id="${u}-semi"><path d="M104 40 A46 46 0 0 1 196 40 Z"/></clipPath></defs>
<g filter="url(#${u}-sombra)">
${gear(u, 266, 58, 40, 20, 'cos-a-spin-rev', `${u}-br-d`, 'bronze')}
${gear(u, 292, 116, 17, 11, 'cos-a-spin', `${u}-ch-d`, 'champanhe')}
${gear(u, 30, 350, 38, 18, 'cos-a-spin', `${u}-br-d`, 'bronze')}
${gear(u, 78, 384, 20, 12, 'cos-a-spin-rev', `${u}-ch-d`, 'champanhe')}
${gear(u, 10, 270, 14, 10, 'cos-a-spin-rev', `${u}-br-d`, 'bronze')}
${bandaBisel(16, 26, 268, 348, 11, 'ferro', `${u}-b1`)}
<path d="M16 26H284V374H16Z M27 37V363H273V37Z" fill="url(#${u}-esc)" fill-rule="evenodd"/>
${bandaBisel(26.5, 36.5, 247, 327, 3.4, 'champanhe', `${u}-b2`)}
<path d="M30.5 40.5H269.5V359.5H30.5Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
${rebites(u, rb, 1.9)}
${canto}<g transform="matrix(-1 0 0 1 300 0)">${canto}</g><g transform="matrix(1 0 0 -1 0 400)">${canto}</g><g transform="matrix(-1 0 0 -1 300 400)">${canto}</g>
${relevo('M94 40 A56 56 0 0 1 206 40 Z', `${u}-fe`, 'ferro')}
${relevo('M98 40 A52 52 0 0 1 202 40 L196 40 A46 46 0 0 0 104 40 Z', `${u}-ch`, 'champanhe')}
<path d="M104 40 A46 46 0 0 1 196 40 Z" fill="url(#${u}-dial)" stroke="#5f584d" stroke-width=".8"/>
${tiques(150, 40, 40, 44.5, -180, 0, 6, '#3b352d', 0.8)}
${tiques(150, 40, 36, 44.5, -180, 0, 30, '#2a251f', 1.8)}
${numerais(150, 40, 30, [9, 10, 11, 0, 1, 2, 3], 7.5, '#2a251f')}
<g clip-path="url(#${u}-semi)"><g class="cos-a-ponteiro" style="transform-origin:150px 40px"><path d="M150 40 L148.4 12 L150 4 L151.6 12 Z" fill="url(#${u}-fe)" stroke="#0c0b0e" stroke-width=".5"/></g><path d="M150 40 L172 25 L176 22 L170 28Z" fill="url(#${u}-fe)" stroke="#0c0b0e" stroke-width=".5"/></g>
${gemaLapidada(150, 40, 9, 9, 'rubi', 'oval', `${u}-ch`)}
${relevo('M84 40 H216 V45 H84 Z', `${u}-ch`, 'champanhe')}
${relevo('M8 190h16v20H8zM276 190h16v20h-16z', `${u}-ch`, 'champanhe')}
${gemaLapidada(16, 200, 8, 10, 'rubi', 'losango')}${gemaLapidada(284, 200, 8, 10, 'rubi', 'losango')}
${contas([12, 74], [8, 150], 4, 14, 1.4, `${u}-ch-r`, '#16120d')}
${chave(u, 8, 160, 1.1)}
<g class="cos-a-pendulo" style="transform-origin:150px 372px"><path d="M150 372 V388" stroke="url(#${u}-ch)" stroke-width="2.2"/>${gemaLapidada(150, 392, 13, 13, 'rubi', 'oval', `${u}-ch`)}</g>
</g>`
  },
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
${gear(u, 106, 14, 17, 12, 'cos-a-spin-rev', `${u}-br-d`, 'bronze')}
${gear(u, 14, 106, 15, 11, 'cos-a-spin', `${u}-br-d`, 'bronze')}
${bandaBisel(8, 9, 104, 103, 8, 'ferro', `${u}-b1`)}
${bandaBisel(16.4, 17.4, 87.2, 86.2, 2.6, 'champanhe', `${u}-b2`)}
${relevo('M36 20 A24 24 0 0 1 84 20 Z', `${u}-ch`, 'champanhe', 0.6)}
<path d="M40 20 A20 20 0 0 1 80 20 Z" fill="url(#${u}-dial)" stroke="#5f584d" stroke-width=".6"/>
${tiques(60, 20, 15, 19, -180, 0, 30, '#2a251f', 1.4)}
<g class="cos-a-ponteiro" style="transform-origin:60px 20px"><path d="M60 20 L59 6 L60 3 L61 6Z" fill="#16120d"/></g>
${gemaLapidada(60, 20, 6, 6, 'rubi', 'oval', `${u}-ch`)}`,
}

export const RELOGIO: MolduraArte = { avatar, mini }
