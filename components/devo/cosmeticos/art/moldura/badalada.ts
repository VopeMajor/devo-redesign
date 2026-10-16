/* 8. ÚLTIMA BADALADA (animada) — caixa de relógio sobrenatural: esmalte de céu noturno com estrelas, anel de
   horas em volta do retrato, filigrana de champanhe em relevo, sino no alto com mostrador pequeno, chamas
   espectrais de ametista nos lados e pêndulo com ametista lapidada. Movimento: sino toca de vez em quando,
   pêndulo, ponteiros, chamas e brilho do anel — tudo lento. */
import { estrela4, n2, volutaCheia } from '../kit'
import { ceuDefs, fioRelevo, gemaLapidada, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, numerais, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-ch`, 'champanhe')}${metalDefs(`${u}-fe`, 'ferro')}${ceuDefs(`${u}-ceu`)}${texturaDefs(u)}<linearGradient id="${u}-chama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#efeaff" stop-opacity=".95"/><stop offset=".45" stop-color="#ab98ee" stop-opacity=".75"/><stop offset="1" stop-color="#5a4f8f" stop-opacity="0"/></linearGradient><linearGradient id="${u}-anel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14121c"/><stop offset=".5" stop-color="#1f1b2e"/><stop offset="1" stop-color="#0c0b12"/></linearGradient></defs>`

function sino(u: string, cx: number, cy: number, s: number) {
  const P = (x: number, y: number) => `${n2(cx + x * s)} ${n2(cy + y * s)}`
  const corpo = `M${P(-13, 9)}C${P(-13, -2)} ${P(-10, -13)} ${P(0, -13)}C${P(10, -13)} ${P(13, -2)} ${P(13, 9)}L${P(17, 12)}H${n2(cx - 17 * s)}Z`
  return `<g class="cos-a-sino" style="transform-origin:${cx}px ${n2(cy - 14 * s)}px">${relevo(corpo, `${u}-ch`, 'champanhe', s)}<path d="M${P(-10, 4)}H${n2(cx + 10 * s)}" stroke="#2b2620" stroke-width="${n2(0.8 * s)}"/><circle cx="${cx}" cy="${n2(cy + 14.5 * s)}" r="${n2(3 * s)}" fill="url(#${u}-ch-r)" stroke="#16120d" stroke-width="${n2(0.6 * s)}"/></g>${relevo(`M${P(-3, -18)}a${n2(3 * s)} ${n2(3 * s)} 0 1 1 ${n2(6 * s)} 0v${n2(3 * s)}h${n2(-6 * s)}Z`, `${u}-ch-d`, 'champanhe', s)}`
}

function chamas(u: string, x: number, y: number, s: number, atraso = false) {
  const lingua = (dx: number, h: number, w: number, k: string) =>
    `<path d="M${n2(x + dx)} ${y}C${n2(x + dx - w)} ${n2(y - h * 0.4)} ${n2(x + dx + w * 0.4)} ${n2(y - h * 0.6)} ${n2(x + dx - w * 0.2)} ${n2(y - h)}C${n2(x + dx + w * 1.1)} ${n2(y - h * 0.62)} ${n2(x + dx + w * 0.9)} ${n2(y - h * 0.3)} ${n2(x + dx + w * 0.3)} ${y}Z" fill="url(#${u}-chama)" class="cos-a-chama${k}"/>`
  return `${lingua(0, 46 * s, 9 * s, atraso ? ' cos-a-atraso' : '')}${lingua(4 * s, 30 * s, 6 * s, atraso ? '' : ' cos-a-atraso')}${lingua(-5 * s, 22 * s, 5 * s, '')}`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    let marcas = ''
    for (let h = 0; h < 60; h++) {
      const a = ((h * 6 - 90) * Math.PI) / 180
      const longo = h % 5 === 0
      marcas += `M${n2(150 + Math.cos(a) * 136)} ${n2(200 + Math.sin(a) * 176)}L${n2(150 + Math.cos(a) * (longo ? 126 : 132))} ${n2(200 + Math.sin(a) * (longo ? 166 : 172))}`
    }
    const caixa = 'M22 24 Q150 -2 278 24 V382 H22 Z M150 40 A120 160 0 1 0 150.1 40 Z'
    const canto = relevo(volutaCheia([[30, 64], [32, 42], [50, 32]], 60, 44, 9, 1.8, 1.1, -90, 1, 7, 1.6) + volutaCheia([[30, 74], [40, 96], [36, 118]], 28, 122, 6, 1.4, 1.05, 0, 1, 5.5, 1.3), `${u}-ch`, 'champanhe')
    return `${defs(u)}${sombra(u, 0.6)}
<g filter="url(#${u}-sombra)">
<path d="${caixa}" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="${caixa}" fill="url(#${u}-ceu-est)" fill-rule="evenodd"/>
${fioRelevo('M22 24 Q150 -2 278 24 V382 H22 Z', `${u}-ch`, 'champanhe', 3.2)}
<path d="M150 22 A138 178 0 1 1 149.9 22 Z M150 40 A120 160 0 1 0 150.1 40 Z" fill="url(#${u}-anel)" fill-rule="evenodd"/>
<ellipse cx="150" cy="200" rx="138" ry="178" fill="none" stroke="url(#${u}-ch)" stroke-width="2.6"/>
<ellipse cx="150" cy="200" rx="128" ry="168" fill="none" stroke="#c2b9ec" stroke-opacity=".5" stroke-width="5" class="cos-a-pulso"/>
${fioRelevo('M150 40 A120 160 0 1 0 150.1 40 Z', `${u}-ch`, 'champanhe', 3)}
<path d="M150 40.5 A119.5 159.5 0 1 0 150.1 40.5 Z" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2.4"/>
<path d="${marcas}" stroke="#e5dccb" stroke-width="1.1"/>
${numerais(150, 200, 129.5, [3, 6, 9], 12, '#ece5d8', 1.3, false)}
${canto}<g transform="matrix(-1 0 0 1 300 0)">${canto}</g><g transform="matrix(1 0 0 -1 0 400)">${canto}</g><g transform="matrix(-1 0 0 -1 300 400)">${canto}</g>
${chamas(u, 12, 196, 1.1)}${chamas(u, 14, 292, 0.85, true)}<g transform="matrix(-1 0 0 1 300 0)">${chamas(u, 12, 222, 1, true)}${chamas(u, 14, 312, 0.75)}</g>
${relevo('M126 26 Q150 4 174 26 L168 30 Q150 14 132 30 Z', `${u}-ch`, 'champanhe')}
<circle cx="150" cy="28" r="17" fill="url(#${u}-ceu)" stroke="url(#${u}-ch)" stroke-width="2.6"/>
${(() => {
      let t = ''
      for (let h = 0; h < 12; h++) {
        const a = (h * 30 * Math.PI) / 180
        t += `M${n2(150 + Math.cos(a) * 14)} ${n2(28 + Math.sin(a) * 14)}L${n2(150 + Math.cos(a) * (h % 3 ? 12 : 10.5))} ${n2(28 + Math.sin(a) * (h % 3 ? 12 : 10.5))}`
      }
      return `<path d="${t}" stroke="#ece5d8" stroke-width="1"/>`
    })()}
<g class="cos-a-ponteiro" style="transform-origin:150px 28px"><path d="M150 28 L148.8 17 L150 13 L151.2 17Z" fill="#ece5d8"/></g><g class="cos-a-ponteiro-lento" style="transform-origin:150px 28px"><path d="M150 28 L157 23 L159 22 L158 24Z" fill="#ece5d8"/></g>
${gemaLapidada(150, 28, 4.4, 4.4, 'ametista', 'oval')}
${sino(u, 150, 2, 0.9)}
<path d="${estrela4(104, 18, 6)}${estrela4(196, 18, 6)}" fill="url(#${u}-ch-d)" stroke="#16120d" stroke-width=".6"/>
<g class="cos-a-pendulo" style="transform-origin:150px 366px"><path d="M150 366 V384" stroke="url(#${u}-ch)" stroke-width="2.2"/>${gemaLapidada(150, 390, 14, 16, 'ametista', 'gota', `${u}-ch`)}</g>
<path d="${estrela4(14, 44, 4)}${estrela4(288, 60, 3.4)}${estrela4(10, 340, 3)}${estrela4(290, 352, 3.6)}${estrela4(60, 392, 2.6)}" fill="#ece5d8" class="cos-a-cintila"/>
</g>`
  },
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => {
    let marcas = ''
    for (let h = 0; h < 12; h++) {
      const a = ((h * 30 - 90) * Math.PI) / 180
      marcas += `M${n2(60 + Math.cos(a) * 55)} ${n2(60 + Math.sin(a) * 55)}L${n2(60 + Math.cos(a) * (h % 3 ? 50 : 46))} ${n2(60 + Math.sin(a) * (h % 3 ? 50 : 46))}`
    }
    return `${defs(u)}
<path d="M60 1 A59 59 0 1 1 59.9 1 Z M60 20 A40 40 0 1 0 60.1 20 Z" fill="url(#${u}-ceu)" fill-rule="evenodd"/>
<path d="M60 1 A59 59 0 1 1 59.9 1 Z M60 20 A40 40 0 1 0 60.1 20 Z" fill="url(#${u}-ceu-est)" fill-rule="evenodd"/>
${fioRelevo('M60 2 A58 58 0 1 1 59.9 2 Z', `${u}-ch`, 'champanhe', 2.2)}
<circle cx="60" cy="60" r="44" fill="none" stroke="#c2b9ec" stroke-opacity=".45" stroke-width="5" class="cos-a-pulso"/>
${fioRelevo('M60 19.5 A40.5 40.5 0 1 0 60.1 19.5 Z', `${u}-ch`, 'champanhe', 2)}
<path d="${marcas}" stroke="#e5dccb" stroke-width="1.8"/>
${sino(u, 60, 4, 0.42)}
<g class="cos-a-pendulo" style="transform-origin:60px 108px">${gemaLapidada(60, 113, 8, 9, 'ametista', 'gota', `${u}-ch`)}</g>`
  },
}

export const BADALADA: MolduraArte = { avatar, mini }
