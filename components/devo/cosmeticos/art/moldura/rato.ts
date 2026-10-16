/* 7. FORTUNA DO RATO — bronze gasto em bisel, cadeado com fechadura no alto, corrente fina que cai pelo lado com
   uma moeda, pilha de moedas antigas (com o rabo do Rato aparecendo), carta e dado, e um carrossel de feira em
   miniatura no canto (ref-03). Truques pequenos espalhados — nada simétrico. */
import { circulo, estrela4, lin, n2, naipe } from '../kit'
import { bandaBisel, contas, gemaLapidada, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-bz`, 'bronze')}${metalDefs(`${u}-pr`, 'prata')}${metalDefs(`${u}-ou`, 'ouro')}${lin(`${u}-esm`, ['#2a231c', '#14100c'])}${lin(`${u}-listra`, ['#f4ecdc', '#cfc3ad'])}${lin(`${u}-carta`, ['#fffcf4', '#ece3d0'], 0, 0, 1, 1)}<radialGradient id="${u}-moeda" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff0c4"/><stop offset=".35" stop-color="#d9b46c"/><stop offset=".75" stop-color="#8d6830"/><stop offset="1" stop-color="#4a3216"/></radialGradient><radialGradient id="${u}-moedap" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#d4d2cd"/><stop offset=".8" stop-color="#85827b"/><stop offset="1" stop-color="#47453f"/></radialGradient>${texturaDefs(u)}</defs>`

/** Moeda antiga com aro serrilhado, perfil cunhado e reflexo; `inc` < 1 = deitada (perspectiva). */
function moeda(u: string, cx: number, cy: number, r: number, prata = false, inc = 1) {
  const g = prata ? `${u}-moedap` : `${u}-moeda`
  let serr = ''
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    serr += `M${n2(Math.cos(a) * r * 0.9)} ${n2(Math.sin(a) * r * 0.9)}L${n2(Math.cos(a) * r)} ${n2(Math.sin(a) * r)}`
  }
  const lado = inc < 1 ? `<path d="M${n2(-r)} 0V${n2(r * 0.28)}A${n2(r)} ${n2(r)} 0 0 0 ${n2(r)} ${n2(r * 0.28)}V0Z" fill="#5a4119" transform="scale(1 ${inc})"/>` : ''
  return `<g transform="translate(${n2(cx)} ${n2(cy)})"><ellipse cx="1.2" cy="${n2(1.8 + r * 0.2 * (1 - inc))}" rx="${n2(r)}" ry="${n2(r * inc)}" fill="#000" opacity=".4"/>${lado}<g transform="scale(1 ${inc})"><circle r="${n2(r)}" fill="url(#${g})" stroke="#2a1d0e" stroke-width="${n2(r * 0.08)}"/><path d="${serr}" stroke="#2a1d0e" stroke-opacity=".45" stroke-width="${n2(r * 0.05)}"/><circle r="${n2(r * 0.74)}" fill="none" stroke="#2a1d0e" stroke-opacity=".5" stroke-width="${n2(r * 0.05)}"/><path d="M${n2(-r * 0.32)} ${n2(r * 0.34)}C${n2(-r * 0.38)} ${n2(-r * 0.1)} ${n2(-r * 0.04)} ${n2(-r * 0.44)} ${n2(r * 0.3)} ${n2(-r * 0.3)}C${n2(r * 0.12)} ${n2(-r * 0.12)} ${n2(r * 0.22)} ${n2(r * 0.12)} ${n2(r * 0.36)} ${n2(r * 0.28)}C${n2(r * 0.1)} ${n2(r * 0.38)} ${n2(-r * 0.1)} ${n2(r * 0.42)} ${n2(-r * 0.32)} ${n2(r * 0.34)}Z" fill="#2a1d0e" fill-opacity=".38"/><path d="M${n2(-r * 0.6)} ${n2(-r * 0.4)}A${n2(r * 0.72)} ${n2(r * 0.72)} 0 0 1 ${n2(r * 0.1)} ${n2(-r * 0.72)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${n2(r * 0.09)}" stroke-linecap="round"/></g></g>`
}

function pilhaMoedas(u: string, cx: number, base: number, r: number, n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += moeda(u, cx + ((i * 37) % 5) - 2, base - i * r * 0.36, r, i % 3 === 2, 0.42)
  return s
}

function dado(x: number, y: number, s: number, ang: number) {
  const p = (cx: number, cy: number) => `<circle cx="${n2(x + cx * s)}" cy="${n2(y + cy * s)}" r="${n2(s * 0.085)}" fill="#2a1d0e"/>`
  return `<g transform="rotate(${ang} ${n2(x + s / 2)} ${n2(y + s / 2)})"><rect x="${n2(x + 1.2)}" y="${n2(y + 1.8)}" width="${s}" height="${s}" rx="${n2(s * 0.2)}" fill="#000" opacity=".45"/><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${n2(s * 0.2)}" fill="#f3ebdb" stroke="#2a1d0e" stroke-width="${n2(s * 0.05)}"/><path d="M${n2(x + s * 0.14)} ${n2(y + s * 0.08)}H${n2(x + s * 0.8)}" stroke="#fff" stroke-width="${n2(s * 0.06)}" stroke-linecap="round"/>${p(0.28, 0.28)}${p(0.72, 0.72)}${p(0.5, 0.5)}${p(0.72, 0.28)}${p(0.28, 0.72)}</g>`
}

/** Carrossel de feira em miniatura (cúpula listrada com franja, mastros, cavalinho, base). */
function carrossel(u: string, cx: number, base: number, s: number) {
  const P = (x: number, y: number) => `${n2(cx + x * s)} ${n2(base + y * s)}`
  let franja = ''
  for (let i = 0; i < 8; i++) {
    const x0 = -32 + i * 8
    franja += `M${P(x0, -48)}Q${P(x0 + 4, -42)} ${P(x0 + 8, -48)}`
  }
  let listras = ''
  for (let i = 0; i < 8; i += 2) listras += `M${P(0, -76)}L${P(-32 + i * 8, -48)}L${P(-32 + (i + 1) * 8, -48)}Z`
  const cavalo = `M${P(-9, -22)}C${P(-8, -28)} ${P(-2, -30)} ${P(4, -28)}L${P(8, -34)}L${P(11, -33)}L${P(10, -27)}C${P(13, -25)} ${P(12, -21)} ${P(9, -22)}L${P(8, -18)}L${P(10, -12)}L${P(7, -12)}L${P(5, -17)}L${P(-5, -17)}L${P(-7, -12)}L${P(-10, -12)}L${P(-8, -18)}Z`
  return `<g><ellipse cx="${P(1.5, 2).split(' ')[0]}" cy="${n2(base + 3 * s)}" rx="${n2(36 * s)}" ry="${n2(7 * s)}" fill="#000" opacity=".45"/>${relevo(`M${P(-34, -6)}H${n2(cx + 34 * s)}V${n2(base + 2 * s)}H${n2(cx - 34 * s)}Z`, `${u}-bz`, 'bronze', s)}<path d="M${P(-26, -48)}V${P(-26, -6).split(' ')[1]}M${P(0, -48)}V${P(0, -6).split(' ')[1]}M${P(26, -48)}V${P(26, -6).split(' ')[1]}" stroke="url(#${u}-ou)" stroke-width="${n2(1.6 * s)}"/><g class="cos-a-carrossel"><path d="M${P(0, -40)}V${P(0, -14).split(' ')[1]}" stroke="url(#${u}-pr)" stroke-width="${n2(1.2 * s)}"/><path d="${cavalo}" fill="#f4ecdc" stroke="#1a1410" stroke-width="${n2(0.7 * s)}"/><path d="M${P(-6, -26)}Q${P(0, -24)} ${P(5, -27)}" fill="none" stroke="#7c1325" stroke-width="${n2(1.2 * s)}"/></g>${relevo(`M${P(-34, -48)}L${P(0, -76)}L${P(34, -48)}Z`, `${u}-esm`, 'ferro', s)}<path d="${listras}" fill="url(#${u}-listra)" opacity=".92"/><path d="${franja}" fill="none" stroke="url(#${u}-ou)" stroke-width="${n2(1.6 * s)}"/><path d="M${P(-34, -48)}H${n2(cx + 34 * s)}" stroke="url(#${u}-ou)" stroke-width="${n2(2 * s)}"/>${gemaLapidada(cx, base - 80 * s, 5 * s, 6 * s, 'rubi', 'losango', `${u}-ou`)}</g>`
}

function rabo(x: number, y: number) {
  return `<path d="M${x} ${y}C${x + 10} ${y + 2} ${x + 18} ${y - 6} ${x + 16} ${y - 14}C${x + 15} ${y - 20} ${x + 8} ${y - 20} ${x + 9} ${y - 14}" fill="none" stroke="#2a1d16" stroke-width="2.6" stroke-linecap="round"/><path d="M${x} ${y}C${x + 10} ${y + 2} ${x + 18} ${y - 6} ${x + 16} ${y - 14}C${x + 15} ${y - 20} ${x + 8} ${y - 20} ${x + 9} ${y - 14}" fill="none" stroke="#c99a8a" stroke-width="1.4" stroke-linecap="round"/>`
}

function cadeado(u: string, cx: number, cy: number, s: number) {
  const P = (x: number, y: number) => `${n2(cx + x * s)} ${n2(cy + y * s)}`
  return `<path d="M${P(-9, -2)}V${P(-9, -10).split(' ')[1]}A${n2(9 * s)} ${n2(9 * s)} 0 0 1 ${P(9, -10)}V${P(9, -2).split(' ')[1]}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="${n2(5 * s)}" transform="translate(1 1.5)"/><path d="M${P(-9, -2)}V${P(-9, -10).split(' ')[1]}A${n2(9 * s)} ${n2(9 * s)} 0 0 1 ${P(9, -10)}V${P(9, -2).split(' ')[1]}" fill="none" stroke="url(#${u}-pr)" stroke-width="${n2(3.6 * s)}"/>${relevo(`M${P(-15, -3)}H${n2(cx + 15 * s)}V${n2(cy + 18 * s)}Q${P(0, 24)} ${P(-15, 18)}Z`, `${u}-bz`, 'bronze', s)}<path d="${circulo(cx, cy + 6 * s, 3.4 * s)}M${P(-1.4, 7)}L${P(-2.4, 15)}H${n2(cx + 2.4 * s)}L${P(1.4, 7)}Z" fill="#120c07"/>${gemaLapidada(cx - 9 * s, cy + 2 * s, 3.4 * s, 3.4 * s, 'esmeralda', 'oval')}${gemaLapidada(cx + 9 * s, cy + 2 * s, 3.4 * s, 3.4 * s, 'esmeralda', 'oval')}`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => `${defs(u)}${sombra(u, 0.55)}
<g filter="url(#${u}-sombra)">
${bandaBisel(16, 26, 268, 348, 11, 'bronze', `${u}-b1`)}
<path d="M19.5 29.5H280.5V370.5H19.5Z M24.5 34.5V365.5H275.5V34.5Z" fill="url(#${u}-esm)" fill-rule="evenodd"/>
<path d="M16 26H284V374H16Z M27 37V363H273V37Z" fill="url(#${u}-esc)" fill-rule="evenodd"/>
${bandaBisel(26.5, 36.5, 247, 327, 3, 'bronze', `${u}-b2`)}
<path d="M30.5 40.5H269.5V359.5H30.5Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
${relevo('M16 26 L56 26 L16 66Z', `${u}-bz-d`, 'bronze')}${relevo('M284 26 L244 26 L284 66Z', `${u}-bz-d`, 'bronze')}
${contas([46, 34], [254, 34], 22, 38, 1.7, `${u}-pr-r`, '#2a2724')}
${contas([254, 34], [290, 160], 14, 22, 1.6, `${u}-pr-r`, '#2a2724')}${contas([290, 160], [286, 210], 2, 8, 1.5, `${u}-pr-r`, '#2a2724')}
${moeda(u, 286, 222, 11, true)}
${cadeado(u, 150, 22, 1.1)}
${dado(250, 46, 16, 18)}
<g transform="rotate(-24 30 92)"><rect x="18" y="66" width="28" height="40" rx="2.6" fill="#000" opacity=".4" transform="translate(1.2 1.8)"/><rect x="18" y="66" width="28" height="40" rx="2.6" fill="url(#${u}-carta)" stroke="#2a2018" stroke-width=".9"/><rect x="20.6" y="68.6" width="22.8" height="34.8" rx="1.6" fill="none" stroke="url(#${u}-ou)" stroke-width=".8"/><path d="${naipe('espadas', 32, 88, 14)}" fill="#141118"/><text x="23" y="76" font-size="8" fill="#141118" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">A</text></g>
${rabo(56, 376)}
${pilhaMoedas(u, 34, 386, 20, 9)}
${pilhaMoedas(u, 70, 392, 15, 4)}
${moeda(u, 18, 316, 13)}${moeda(u, 96, 388, 10, true, 0.5)}
${carrossel(u, 252, 392, 0.95)}
<path d="${estrela4(214, 380, 3)}${estrela4(108, 368, 2.6)}" fill="#fff0c4" class="cos-a-cintila"/>
</g>`,
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
${bandaBisel(8, 8, 104, 104, 8, 'bronze', `${u}-b1`)}
${bandaBisel(16.6, 16.6, 86.8, 86.8, 2.4, 'bronze', `${u}-b2`)}
${contas([22, 14], [98, 14], 7, 16, 1.3, `${u}-pr-r`, '#2a2724')}
${cadeado(u, 60, 10, 0.55)}
${pilhaMoedas(u, 15, 112, 11, 5)}
${carrossel(u, 102, 114, 0.38)}`,
}

export const RATO: MolduraArte = { avatar, mini }
