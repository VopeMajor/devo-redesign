/* 1. HERANÇA DE MARFIM — prata em relevo, esmalte de marfim, fio de pérolas, camafeu e um laço de veludo negro
   torto no canto (ref-03: laço e corrente que pendem; ref-05: filigrana densa). Rosas de marfim embaixo. */
import { acanto, espelhoX, lin, losango, rad, volutaCheia } from '../kit'
import { bandaBisel, contas, folhaDefs, folhaVeias, gemaLapidada, laco, metalDefs, relevo, rosaDefs, rosaVolume, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const C = '#2a2825'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-pr`, 'prata')}${lin(`${u}-mf`, ['#fffaf0', '#efe6d4', '#d3c6ad', '#ece2cf'])}${rad(`${u}-perola`, ['#ffffff', '#f6f2ec', '#dcd3cf', '#9c93a0'], 0.4, 0.35, 0.7)}${lin(`${u}-cam`, ['#fcf7ee', '#e8dec9', '#c3b499'])}${rad(`${u}-camfundo`, ['#4c465b', '#2a2633', '#16141c'], 0.5, 0.4, 0.7)}${lin(`${u}-velu`, ['#4a4752', '#1d1c22', '#0a090c', '#2a2830'], 0, 0, 1, 1)}${lin(`${u}-velu-dobra`, ['rgba(255,255,255,.3)', 'rgba(255,255,255,0)', 'rgba(0,0,0,.5)'])}${rosaDefs(`${u}-rm`, 'marfim')}${folhaDefs(`${u}-fo`)}${texturaDefs(u)}</defs>`

function perfil(cx: number, cy: number, s: number) {
  const k = s / 30
  const p = (x: number, y: number) => `${(cx + x * k).toFixed(2)} ${(cy + y * k).toFixed(2)}`
  return `M${p(6, 14)}C${p(9, 10)} ${p(10, 6)} ${p(9, 2)}C${p(13, 0)} ${p(14, -6)} ${p(10, -10)}C${p(12, -14)} ${p(6, -17)} ${p(2, -15)}C${p(-2, -16)} ${p(-6, -13)} ${p(-6, -9)}C${p(-7, -7)} ${p(-7, -6)} ${p(-6.5, -5)}L${p(-9, -2)}L${p(-6.6, -1.4)}C${p(-7.2, 0)} ${p(-6.4, 0.6)} ${p(-6.8, 1.4)}C${p(-6.6, 2.4)} ${p(-5.4, 2.8)} ${p(-5.6, 3.8)}C${p(-5, 5.4)} ${p(-3.2, 5.6)} ${p(-2, 5)}C${p(-1.6, 7.6)} ${p(-3.4, 10)} ${p(-8, 12)}C${p(-11, 13)} ${p(-12, 15)} ${p(-12, 16)}H${p(12, 16)}C${p(11, 15)} ${p(8, 14)} ${p(6, 14)}Z`
}

function camafeu(u: string, cx: number, cy: number, rx: number, ry: number, s: number) {
  const anel = `M${cx - rx - 4 * s} ${cy}a${rx + 4 * s} ${ry + 4 * s} 0 1 0 ${2 * (rx + 4 * s)} 0a${rx + 4 * s} ${ry + 4 * s} 0 1 0 ${-2 * (rx + 4 * s)} 0Z`
  return `${relevo(anel, `${u}-pr`, 'prata', s)}${contas([cx - rx - 1.6 * s, cy], [cx + rx + 1.6 * s, cy], -(ry + 1.6 * s), 9, 1.25 * s, `${u}-perola`, '#6f665e')}${contas([cx - rx - 1.6 * s, cy], [cx + rx + 1.6 * s, cy], ry + 1.6 * s, 9, 1.25 * s, `${u}-perola`, '#6f665e')}<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${u}-camfundo)" stroke="${C}" stroke-width="${0.8 * s}"/><path d="${perfil(cx + rx * 0.08 + 0.6 * s, cy + ry * 0.08 + 0.8 * s, ry * 1.55)}" fill="#000" opacity=".5"/><path d="${perfil(cx + rx * 0.08, cy + ry * 0.08, ry * 1.55)}" fill="url(#${u}-cam)" stroke="#8d7f6a" stroke-width="${0.35 * s}"/><ellipse cx="${cx - rx * 0.35}" cy="${cy - ry * 0.5}" rx="${rx * 0.35}" ry="${ry * 0.18}" fill="#fff" opacity=".12"/>`
}

function crestaLado(u: string) {
  const s1 = volutaCheia([[170, 34], [186, 18], [208, 10], [230, 14]], 238, 28, 12, 2.4, 1.15, -80, 1, 9, 2.2)
  const s2 = volutaCheia([[172, 42], [190, 48], [206, 46]], 208, 36, 8, 1.6, 1.05, 90, -1, 6.5, 1.5)
  const s3 = volutaCheia([[240, 40], [254, 30], [266, 34]], 264, 46, 6, 1.4, 1.05, -70, 1, 5, 1.3)
  return `${relevo(s1 + s2 + s3, `${u}-pr`, 'prata')}${relevo(acanto(184, 24, 28, 10, -112, 0.6), `${u}-pr-d`, 'prata')}${relevo(acanto(206, 14, 22, 8, -40, 0.3), `${u}-pr-d`, 'prata')}${relevo(acanto(222, 40, 18, 7, 60, -0.3), `${u}-pr-d`, 'prata', 0.8)}${contas([238, 28], [238, 28], 0, 0, 3.6, `${u}-perola`, '#6f665e')}${contas([208, 36], [208, 36], 0, 0, 2.8, `${u}-perola`, '#6f665e')}`
}

function canto(u: string) {
  const a = volutaCheia([[30, 26], [44, 18], [62, 18], [74, 26]], 70, 36, 7, 1.6, 1.1, -90, 1, 7, 1.5)
  const b = volutaCheia([[16, 40], [10, 56], [12, 72], [20, 82]], 30, 80, 7, 1.6, 1.1, 180, -1, 7, 1.5)
  return `${relevo(a + b, `${u}-pr`, 'prata')}${relevo(acanto(18, 28, 24, 9, -135, 0.5), `${u}-pr-d`, 'prata')}${gemaLapidada(24, 36, 13, 13, 'perola', 'oval', `${u}-pr`)}`
}

function fileira(u: string, x0: number, y0: number, x1: number, y1: number, passo: number, r: number) {
  const n = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / passo))
  return contas([x0, y0], [x1, y1], 0, n, r, `${u}-perola`, '#7a7068')
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    const k = canto(u)
    const lado = crestaLado(u)
    return `${defs(u)}${sombra(u, 0.55)}
<g filter="url(#${u}-sombra)">
${bandaBisel(13, 23, 274, 354, 4.2, 'prata', `${u}-b1`)}
<path d="M17.2 27.2H282.8V372.8H17.2Z M27 37V363H273V37Z" fill="url(#${u}-mf)" fill-rule="evenodd" stroke="#a89c86" stroke-width=".6"/>
<path d="M17.2 27.2H282.8V372.8H17.2Z M27 37V363H273V37Z" fill="url(#${u}-grao)" fill-rule="evenodd"/>
${bandaBisel(26.4, 36.4, 247.2, 327.2, 3.6, 'prata', `${u}-b2`)}
<path d="M30.5 40.5H269.5V359.5H30.5Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
${fileira(u, 44, 32, 256, 32, 10, 2.3)}${fileira(u, 44, 368, 256, 368, 10, 2.3)}${fileira(u, 22, 54, 22, 346, 10, 2.3)}${fileira(u, 278, 54, 278, 346, 10, 2.3)}
${k}${espelhoX(300, k)}<g transform="matrix(1 0 0 -1 0 400)">${k}${espelhoX(300, k)}</g>
${lado}${espelhoX(300, lado)}
${contas([180, 46], [252, 42], 10, 12, 2.3, `${u}-perola`, '#6f665e')}${contas([120, 46], [48, 42], 10, 12, 2.3, `${u}-perola`, '#6f665e')}
<path d="${losango(8, 182, 6, 12)}${losango(8, 218, 6, 12)}" fill="url(#${u}-pr-d)" stroke="${C}" stroke-width=".7"/>
${gemaLapidada(8, 200, 9, 9, 'perola', 'oval', `${u}-pr`)}
${contas([262, 46], [292, 168], 18, 16, 2.6, `${u}-perola`, '#6f665e')}${contas([292, 168], [290, 214], 4, 4, 2.2, `${u}-perola`, '#6f665e')}
<path d="M290 216c3.6 3.4 5.4 6.8 5.4 9.6a5.4 5.4 0 0 1-10.8 0c0-2.8 1.8-6.2 5.4-9.6Z" fill="url(#${u}-perola)" stroke="#6f665e" stroke-width=".8"/>
${laco(256, 42, 1.45, `${u}-velu`, '#050406', undefined, `${u}-velu-dobra`, 22)}
${gemaLapidada(256, 42, 9, 9, 'perola', 'oval')}
${folhaVeias(`${u}-fo`, 34, 360, 30, 10, 170)}${folhaVeias(`${u}-fo`, 52, 382, 34, 10, 10)}${folhaVeias(`${u}-fo`, 18, 330, 26, 9, -100)}
${rosaVolume(`${u}-rm`, 'marfim', 58, 382, 22, 30)}
${rosaVolume(`${u}-rm`, 'marfim', 24, 358, 33, -10)}
${relevo('M136 378 Q150 362 164 378 Q150 372 136 378Z', `${u}-pr`, 'prata')}
<path d="M150 376 V384" stroke="#6f665e" stroke-width="1"/>
<path d="M150 383c3.6 3.2 5.2 6.4 5.2 9a5.2 5.2 0 0 1-10.8 0c0-2.6 1.6-5.8 5.6-9Z" fill="url(#${u}-perola)" stroke="#6f665e" stroke-width=".8"/><circle cx="148" cy="391" r="1.6" fill="#fff"/>
${relevo('M150 0 L157 8 L150 16 L143 8Z', `${u}-pr-d`, 'prata', 0.8)}
${contas([136, 9], [136, 9], 0, 0, 2.8, `${u}-perola`, '#6f665e')}${contas([164, 9], [164, 9], 0, 0, 2.8, `${u}-perola`, '#6f665e')}
${camafeu(u, 150, 31, 17, 21, 1)}
</g>`
  },
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => {
    const k = `${relevo(volutaCheia([[16, 12], [26, 7], [36, 9]], 36, 14, 3.6, 0.9, 1.05, -90, 1, 3.8, 1) + volutaCheia([[12, 16], [7, 26], [9, 36]], 14, 36, 3.6, 0.9, 1.05, 180, -1, 3.8, 1), `${u}-pr`, 'prata', 0.6)}${gemaLapidada(13, 13, 9, 9, 'perola', 'oval', `${u}-pr`)}`
    return `${defs(u)}
${bandaBisel(7, 7, 106, 106, 3.4, 'prata', `${u}-b1`)}
<path d="M10.4 10.4H109.6V109.6H10.4Z M17.4 17.4V102.6H102.6V17.4Z" fill="url(#${u}-mf)" fill-rule="evenodd"/>
${bandaBisel(16.8, 16.8, 86.4, 86.4, 3, 'prata', `${u}-b2`)}
${fileira(u, 26, 14, 94, 14, 7.5, 1.9)}${fileira(u, 26, 106, 94, 106, 7.5, 1.9)}${fileira(u, 14, 26, 14, 94, 7.5, 1.9)}${fileira(u, 106, 26, 106, 94, 7.5, 1.9)}
${k}${espelhoX(120, k)}<g transform="matrix(1 0 0 -1 0 120)">${espelhoX(120, k)}</g>
${rosaVolume(`${u}-rm`, 'marfim', 14, 106, 14, 0)}
${laco(103, 16, 0.6, `${u}-velu`, '#050406', undefined, `${u}-velu-dobra`, 20)}
${camafeu(u, 60, 11, 7.4, 8.6, 0.55)}`
  },
}

export const HERANCA: MolduraArte = { avatar, mini }
