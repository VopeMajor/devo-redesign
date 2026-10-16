/* 1. HERANÇA DE MARFIM — filigrana de prata, pérolas e um camafeu: a joia de família que passa de mão em mão. */
import { acanto, banda, espelhoX, espelhoY, lin, losango, metal, perola, rad, roseta, volutaCheia } from '../kit'
import { AV, fileiraPerolas, guirlanda, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metal(`${u}-pr`, 'prata')}${metal(`${u}-prd`, 'prata', true)}${lin(`${u}-mf`, ['#fbf7ee', '#ece4d3', '#cbbfa8', '#e9e0cf'])}${rad(
    `${u}-perola`,
    ['#ffffff', '#f6f2ec', '#dad2ce', '#9c93a0'],
    0.4,
    0.35,
    0.7,
  )}${lin(`${u}-cam`, ['#fbf6ec', '#e6dcc8', '#c6b89e'])}${rad(`${u}-camfundo`, ['#4a4458', '#2a2633', '#18161e'], 0.5, 0.4, 0.7)}</defs>`

const C = '#2a2622'

/** Perfil de dama (camafeu), em torno de (cx,cy), altura ~ s. */
function perfil(cx: number, cy: number, s: number) {
  const k = s / 30
  const p = (x: number, y: number) => `${(cx + x * k).toFixed(2)} ${(cy + y * k).toFixed(2)}`
  // nuca → coque → testa → nariz → lábios → queixo → pescoço → busto
  return `M${p(6, 14)}C${p(9, 10)} ${p(10, 6)} ${p(9, 2)}C${p(13, 0)} ${p(14, -6)} ${p(10, -10)}C${p(12, -14)} ${p(6, -17)} ${p(2, -15)}C${p(-2, -16)} ${p(-6, -13)} ${p(-6, -9)}C${p(-7, -7)} ${p(-7, -6)} ${p(-6.5, -5)}L${p(-9, -2)}L${p(-6.6, -1.4)}C${p(-7.2, 0)} ${p(-6.4, 0.6)} ${p(-6.8, 1.4)}C${p(-6.6, 2.4)} ${p(-5.4, 2.8)} ${p(-5.6, 3.8)}C${p(-5, 5.4)} ${p(-3.2, 5.6)} ${p(-2, 5)}C${p(-1.6, 7.6)} ${p(-3.4, 10)} ${p(-8, 12)}C${p(-11, 13)} ${p(-12, 15)} ${p(-12, 16)}H${p(12, 16)}C${p(11, 15)} ${p(8, 14)} ${p(6, 14)}Z`
}

function camafeu(u: string, cx: number, cy: number, rx: number, ry: number, sw: number) {
  let contas = ''
  const n = 22
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    contas += perola(u, cx + Math.cos(a) * (rx + 1.6 * sw), cy + Math.sin(a) * (ry + 1.6 * sw), 1.25 * sw)
  }
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 3 * sw}" ry="${ry + 3 * sw}" fill="url(#${u}-pr)" stroke="${C}" stroke-width="${sw}"/>${contas}<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${u}-camfundo)" stroke="${C}" stroke-width="${sw * 0.8}"/><path d="${perfil(cx + rx * 0.08, cy + ry * 0.08, ry * 1.55)}" fill="url(#${u}-cam)" stroke="#8d7f6a" stroke-width="${sw * 0.35}"/>`
}

function crestaLado(u: string) {
  // metade direita do frontão (a esquerda é espelho)
  const s1 = volutaCheia([[170, 34], [186, 18], [208, 10], [230, 14]], 238, 28, 12, 2.4, 1.15, -80, 1, 8, 2)
  const s2 = volutaCheia([[172, 42], [190, 48], [206, 46]], 208, 36, 8, 1.6, 1.05, 90, -1, 5.5, 1.4)
  const s3 = volutaCheia([[240, 40], [254, 30], [266, 34]], 264, 46, 6, 1.4, 1.05, -70, 1, 4, 1.2)
  return `<path d="${s1}${s2}${s3}" fill="url(#${u}-prd)" stroke="${C}" stroke-width="1"/>
<path d="${acanto(184, 24, 26, 9, -112, 0.6)}" fill="url(#${u}-pr)" stroke="${C}" stroke-width=".9"/>
<path d="${acanto(206, 14, 20, 7, -40, 0.3)}" fill="url(#${u}-pr)" stroke="${C}" stroke-width=".9"/>
<path d="${acanto(222, 40, 16, 6, 60, -0.3)}" fill="url(#${u}-pr)" stroke="${C}" stroke-width=".8"/>
${perola(u, 238, 28, 3.4)}${perola(u, 208, 36, 2.6)}
${guirlanda(u, [180, 44], [252, 42], 9, 12, 2.1)}`
}

function canto(u: string) {
  // canto superior esquerdo, centrado na roseta (24,34)
  const a = volutaCheia([[30, 26], [44, 18], [62, 18], [74, 26]], 70, 36, 7, 1.6, 1.1, -90, 1, 6.5, 1.4)
  const b = volutaCheia([[16, 40], [10, 56], [12, 72], [20, 82]], 30, 80, 7, 1.6, 1.1, 180, -1, 6.5, 1.4)
  return `<path d="${a}${b}" fill="url(#${u}-prd)" stroke="${C}" stroke-width="1"/>
<path d="${acanto(18, 28, 22, 8, -135, 0.5)}" fill="url(#${u}-pr)" stroke="${C}" stroke-width=".9"/>
${roseta(`${u}-pr`, 24, 36, 9, C)}${perola(u, 24, 36, 4)}`
}

function pingente(u: string) {
  const v = volutaCheia([[150, 368], [136, 374], [126, 386]], 132, 392, 5, 1.2, 1.05, 160, 1, 4.5, 1.2)
  return `${espelhoX(300, `<path d="${v}" fill="url(#${u}-prd)" stroke="${C}" stroke-width=".9"/>`)}<path d="${v}" fill="url(#${u}-prd)" stroke="${C}" stroke-width=".9"/>
<path d="M136 376 Q150 360 164 376 Q150 372 136 376Z" fill="url(#${u}-pr)" stroke="${C}" stroke-width=".9"/>
<path d="M150 376 V384" stroke="#6f665e" stroke-width="1"/>
<path d="M150 383c3.6 3.2 5.2 6.4 5.2 9a5.2 5.2 0 0 1-10.4 0c0-2.6 1.6-5.8 5.2-9Z" fill="url(#${u}-perola)" stroke="#6f665e" stroke-width=".8"/><circle cx="148" cy="391" r="1.6" fill="#fff"/>`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    const lado = crestaLado(u)
    const k = canto(u)
    const lat = `<path d="${losango(10, 182, 6, 12)}${losango(10, 218, 6, 12)}" fill="url(#${u}-prd)" stroke="${C}" stroke-width=".7"/>${roseta(`${u}-pr`, 10, 200, 6, C)}${perola(u, 10, 200, 2.6)}`
    return `${defs(u)}${sombra(u)}
<g filter="url(#${u}-sombra)">
${banda(14, 24, 272, 352, 16, `${u}-mf`, '#3a342d', 1.2)}
${banda(14, 24, 272, 352, 3.4, `${u}-pr`, C, 0.9)}
${banda(26.6, 36.6, 246.8, 326.8, 3.4, `${u}-pr`, C, 0.9)}
${fileiraPerolas(u, [44, 30.5], [256, 30.5], 10, 2.2)}${fileiraPerolas(u, [44, 369.5], [256, 369.5], 10, 2.2)}${fileiraPerolas(u, [20.5, 56], [20.5, 344], 10, 2.2)}${fileiraPerolas(u, [279.5, 56], [279.5, 344], 10, 2.2)}
${k}${espelhoX(300, k)}${espelhoY(400, k + espelhoX(300, k))}
${lado}${espelhoX(300, lado)}
${lat}${espelhoX(300, lat)}
${pingente(u)}
<path d="M150 0 L156 7 L150 14 L144 7Z" fill="url(#${u}-prd)" stroke="${C}" stroke-width=".8"/>
${perola(u, 136, 8, 2.6)}${perola(u, 164, 8, 2.6)}
${camafeu(u, 150, 30, 17, 21, 1)}
</g>`
  },
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => {
    const k = `<path d="${volutaCheia([[16, 12], [26, 7], [36, 9]], 36, 14, 3.6, 0.9, 1.05, -90, 1, 3.4, 0.9)}${volutaCheia([[12, 16], [7, 26], [9, 36]], 14, 36, 3.6, 0.9, 1.05, 180, -1, 3.4, 0.9)}" fill="url(#${u}-prd)" stroke="${C}" stroke-width=".7"/>${roseta(`${u}-pr`, 13, 13, 6, C)}${perola(u, 13, 13, 2.8)}`
    return `${defs(u)}
${banda(8, 8, 104, 104, 12, `${u}-mf`, '#3a342d', 0.9)}
${banda(8, 8, 104, 104, 2.8, `${u}-pr`, C, 0.7)}
${banda(17.4, 17.4, 85.2, 85.2, 2.8, `${u}-pr`, C, 0.7)}
${fileiraPerolas(u, [27, 13.5], [93, 13.5], 7.5, 1.8)}${fileiraPerolas(u, [27, 106.5], [93, 106.5], 7.5, 1.8)}${fileiraPerolas(u, [13.5, 27], [13.5, 93], 7.5, 1.8)}${fileiraPerolas(u, [106.5, 27], [106.5, 93], 7.5, 1.8)}
${k}${espelhoX(120, k)}${espelhoY(120, k + espelhoX(120, k))}
${camafeu(u, 60, 11, 7.4, 8.6, 0.6)}`
  },
}

export const HERANCA: MolduraArte = { avatar, mini }
