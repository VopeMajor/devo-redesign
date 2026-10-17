/* 3. PACTO CARMESIM — ferro negro chanfrado, ramos de espinhos e buquês de rosas em volume que transbordam da
   moldura (ref-01, ref-07). Assimétrico: buquê grande no alto à esquerda, menor embaixo à direita. */
import { catmull, n2, type Pt } from '../kit'
import { bandaBisel, ceuDefs, folhaDefs, folhaVeias, gemaLapidada, metalDefs, relevo, rosaDefs, rosaVolume, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-fe`, 'ferro')}${metalDefs(`${u}-pr`, 'prata')}${rosaDefs(`${u}-rc`, 'carmim')}${rosaDefs(`${u}-rv`, 'vinho')}${rosaDefs(`${u}-rn`, 'negra')}${folhaDefs(`${u}-fo`)}${texturaDefs(u)}${ceuDefs(`${u}-ceu`)}</defs>`

/** Ramo espinhoso em relevo (caule escuro + espinhos curvos alternados). */
function ramo(u: string, pts: Pt[], w: number, passo = 16) {
  const d = catmull(pts)
  let esp = ''
  let k = 0
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.max(1, Math.floor(len / passo))
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n
      const x = a[0] + (b[0] - a[0]) * t
      const y = a[1] + (b[1] - a[1]) * t
      const lado = k++ % 2 ? 1 : -1
      const nx = -Math.sin(ang) * lado
      const ny = Math.cos(ang) * lado
      const tx = x + nx * w * 2.6 + Math.cos(ang) * w * 1.2
      const ty = y + ny * w * 2.6 + Math.sin(ang) * w * 1.2
      esp += `<path d="M${n2(x - Math.cos(ang) * w * 0.8)} ${n2(y - Math.sin(ang) * w * 0.8)}Q${n2(x + nx * w)} ${n2(y + ny * w)} ${n2(tx)} ${n2(ty)}Q${n2(x + nx * w * 0.6 + Math.cos(ang) * w)} ${n2(y + ny * w * 0.6 + Math.sin(ang) * w)} ${n2(x + Math.cos(ang) * w)} ${n2(y + Math.sin(ang) * w)}Z" fill="#20261d" stroke="#050604" stroke-width=".4"/>`
    }
  }
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="${n2(w + 1.6)}" stroke-linecap="round" transform="translate(1 1.6)"/><path d="${d}" fill="none" stroke="#050604" stroke-width="${n2(w + 1.1)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${u}-fo)" stroke-width="${n2(w)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#9fae93" stroke-opacity=".35" stroke-width="${n2(w * 0.25)}" stroke-linecap="round" transform="translate(-.4 -.5)"/>${esp}`
}

function petalaSolta(x: number, y: number, s: number, rot: number, u: string) {
  return `<path d="M0 0C${n2(-6 * s)} ${n2(-2 * s)} ${n2(-7 * s)} ${n2(-9 * s)} ${n2(-2 * s)} ${n2(-12 * s)}C${n2(1 * s)} ${n2(-10 * s)} ${n2(4 * s)} ${n2(-11 * s)} ${n2(6 * s)} ${n2(-8 * s)}C${n2(6 * s)} ${n2(-3 * s)} ${n2(3 * s)} 0 0 0Z" fill="url(#${u}-rc)" stroke="#2a0309" stroke-width=".5" transform="translate(${x} ${y}) rotate(${rot})"/>`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    const fo = (x: number, y: number, c: number, l: number, a: number) => folhaVeias(`${u}-fo`, x, y, c, l, a)
    return `${defs(u)}${sombra(u, 0.6)}
<g filter="url(#${u}-sombra)">
${bandaBisel(16, 26, 268, 348, 12, 'ferro', `${u}-b1`)}
<path d="M16 26H284V374H16Z M28 38V362H272V38Z" fill="url(#${u}-esc)" fill-rule="evenodd"/>
${bandaBisel(27, 37, 246, 326, 3.2, 'prata', `${u}-b2`)}
<path d="M30.5 40.5H269.5V359.5H30.5Z" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2.4"/>
${relevo('M150 4 C160 12 168 20 170 30 L160 34 C156 26 152 22 150 22 C148 22 144 26 140 34 L130 30 C132 20 140 12 150 4Z', `${u}-fe`, 'ferro')}
${gemaLapidada(150, 25, 11, 13, 'rubi', 'gota', `${u}-pr`)}
${ramo(u, [[150, 30], [196, 22], [236, 30], [270, 26], [288, 52], [282, 110], [288, 170]], 2.4)}
${ramo(u, [[286, 214], [278, 268], [286, 318], [270, 352]], 2.2)}
${ramo(u, [[150, 372], [110, 384], [64, 378], [26, 386], [12, 352], [18, 300], [10, 250]], 2.4)}
${ramo(u, [[12, 120], [20, 170], [10, 214]], 2)}
${rosaVolume(`${u}-rc`, 'carmim', 287, 172, 11, 30)}
${fo(30, 104, 40, 12, 112)}${fo(70, 80, 46, 13, 50)}${fo(112, 30, 34, 11, -20)}${fo(10, 70, 30, 10, 200)}${fo(88, 62, 30, 9, 80)}${fo(128, 16, 24, 8, 20)}
${rosaVolume(`${u}-rn`, 'negra', 14, 124, 27, -30)}
${rosaVolume(`${u}-rv`, 'vinho', 104, 20, 34, 40)}
${rosaVolume(`${u}-rc`, 'carmim', 36, 50, 58, 10)}
${rosaVolume(`${u}-rv`, 'vinho', 124, 8, 13, 10)}
${rosaVolume(`${u}-rc`, 'carmim', 84, 74, 18, 60)}
${fo(224, 352, 40, 12, 200)}${fo(276, 316, 38, 12, -80)}${fo(208, 388, 30, 10, 170)}${fo(290, 290, 26, 9, -100)}
${rosaVolume(`${u}-rn`, 'negra', 286, 296, 20, 0)}
${rosaVolume(`${u}-rv`, 'vinho', 214, 384, 28, 20)}
${rosaVolume(`${u}-rc`, 'carmim', 262, 354, 48, -20)}
${petalaSolta(70, 392, 1.1, 40, u)}${petalaSolta(118, 394, 0.8, -60, u)}${petalaSolta(286, 250, 0.9, 120, u)}
<path d="M150 362 V384" stroke="url(#${u}-pr)" stroke-width="1.6"/>
<circle cx="150" cy="362" r="2.4" fill="url(#${u}-pr-r)" stroke="#2a2825" stroke-width=".5"/>
${gemaLapidada(150, 390, 10, 15, 'rubi', 'gota', `${u}-pr`)}
</g>`
  },
}

/** Mini (16–48 px): banda grossa, um buquê no alto à esquerda e uma rosa embaixo à direita. Nada fino demais. */
const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
${bandaBisel(8, 8, 104, 104, 10, 'ferro', `${u}-b1`)}
${bandaBisel(16.5, 16.5, 87, 87, 2.4, 'prata', `${u}-b2`)}
<path d="M19.5 19.5H100.5V100.5H19.5Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1.6"/>
${folhaVeias(`${u}-fo`, 14, 34, 20, 7, 100)}${folhaVeias(`${u}-fo`, 30, 14, 22, 7, -5)}${folhaVeias(`${u}-fo`, 96, 108, 16, 6, 180)}
${rosaVolume(`${u}-rv`, 'vinho', 38, 9, 9, 30)}
${rosaVolume(`${u}-rc`, 'carmim', 16, 16, 21, 10)}
${rosaVolume(`${u}-rc`, 'carmim', 104, 104, 17, -20)}
${gemaLapidada(60, 10, 7, 9, 'rubi', 'gota', `${u}-pr`)}`,
}

export const PACTO: MolduraArte = { avatar, mini }
