/* 5. BANQUETE DO JAVALI — ouro envelhecido em bisel, faixa de veludo vinho, coroa cravejada (gomos de veludo,
   arcos com pérolas, gemas lapidadas — ref-08) entre duas presas, leque de cartas saindo pelo alto e pilhas de
   fichas e dados no canto de baixo. Mesa de cassino aristocrático. */
import { estrela4, lin, n2, naipe, volutaCheia } from '../kit'
import { bandaBisel, contas, gemaLapidada, metalDefs, relevo, texturaDefs } from '../material'
import { AV, MI, type MolduraArte, sombra } from './base'

const defs = (u: string) =>
  `<defs>${metalDefs(`${u}-ou`, 'ouro')}${metalDefs(`${u}-pr`, 'prata')}${lin(`${u}-vel`, ['#5a1424', '#3a0b16', '#22050c'], 0, 0, 0, 1)}${lin(`${u}-gomo`, ['#8d2a3f', '#5a1224', '#2a0710'], 0, 0, 1, 0)}${lin(`${u}-carta`, ['#fffcf4', '#ece3d0'], 0, 0, 1, 1)}${lin(`${u}-presa`, ['#fffaf0', '#eadfc6', '#b3a184', '#6f6250'], 0, 0, 1, 1)}<radialGradient id="${u}-perola" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#ece5df"/><stop offset="1" stop-color="#9c93a0"/></radialGradient>${texturaDefs(u)}</defs>`

const K = '#2a1d09'

function carta(u: string, x: number, y: number, w: number, h: number, ang: number, tipo: 'espadas' | 'copas' | 'ouros' | 'paus', letra: string) {
  const cor = tipo === 'copas' || tipo === 'ouros' ? '#9b1b30' : '#141118'
  const cx = x + w / 2
  return `<g transform="rotate(${ang} ${n2(cx)} ${n2(y + h)})"><rect x="${n2(x + 1.4)}" y="${n2(y + 2)}" width="${w}" height="${h}" rx="${n2(w * 0.09)}" fill="#000" opacity=".45"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${n2(w * 0.09)}" fill="url(#${u}-carta)" stroke="#2a2018" stroke-width="${n2(w * 0.03)}"/><rect x="${n2(x + w * 0.09)}" y="${n2(y + w * 0.09)}" width="${n2(w * 0.82)}" height="${n2(h - w * 0.18)}" rx="${n2(w * 0.05)}" fill="none" stroke="url(#${u}-ou)" stroke-width="${n2(w * 0.035)}"/><path d="${naipe(tipo, cx, y + h * 0.55, w * 0.55)}" fill="${cor}"/><text x="${n2(x + w * 0.22)}" y="${n2(y + h * 0.22)}" font-size="${n2(w * 0.28)}" fill="${cor}" text-anchor="middle" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">${letra}</text><path d="${naipe(tipo, x + w * 0.22, y + h * 0.32, w * 0.16)}" fill="${cor}"/></g>`
}

/** Pilha de fichas em perspectiva (de baixo para cima). */
function pilha(u: string, cx: number, base: number, r: number, n: number, cores: string[]) {
  let s = `<ellipse cx="${n2(cx + 1.5)}" cy="${n2(base + 2)}" rx="${n2(r * 1.05)}" ry="${n2(r * 0.42)}" fill="#000" opacity=".45"/>`
  for (let i = 0; i < n; i++) {
    const y = base - i * r * 0.26
    const cor = cores[i % cores.length]
    let marcas = ''
    for (let k = 0; k < 6; k++) {
      const t = -0.8 + k * 0.32
      marcas += `<rect x="${n2(cx + Math.sin(t) * r - r * 0.08)}" y="${n2(y - r * 0.02)}" width="${n2(r * 0.16)}" height="${n2(r * 0.22)}" fill="#f3ead6" opacity="${n2(0.95 - Math.abs(t) * 0.4)}"/>`
    }
    s += `<path d="M${n2(cx - r)} ${n2(y - r * 0.12)}V${n2(y + r * 0.1)}A${n2(r)} ${n2(r * 0.4)} 0 0 0 ${n2(cx + r)} ${n2(y + r * 0.1)}V${n2(y - r * 0.12)}Z" fill="${cor}" stroke="#0d0604" stroke-width=".5"/>${marcas}<ellipse cx="${cx}" cy="${n2(y - r * 0.12)}" rx="${r}" ry="${n2(r * 0.4)}" fill="${cor}" stroke="#0d0604" stroke-width=".5"/><ellipse cx="${cx}" cy="${n2(y - r * 0.12)}" rx="${n2(r * 0.6)}" ry="${n2(r * 0.24)}" fill="none" stroke="url(#${u}-ou)" stroke-width="${n2(r * 0.08)}"/>`
  }
  return s
}

function dado(x: number, y: number, s: number, ang: number) {
  const p = (cx: number, cy: number) => `<circle cx="${n2(x + cx * s)}" cy="${n2(y + cy * s)}" r="${n2(s * 0.085)}" fill="#7c1325"/>`
  return `<g transform="rotate(${ang} ${n2(x + s / 2)} ${n2(y + s / 2)})"><rect x="${n2(x + 1.2)}" y="${n2(y + 1.8)}" width="${s}" height="${s}" rx="${n2(s * 0.2)}" fill="#000" opacity=".45"/><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${n2(s * 0.2)}" fill="#f7f0e2" stroke="#2a1d0e" stroke-width="${n2(s * 0.05)}"/><path d="M${n2(x + s * 0.12)} ${n2(y + s * 0.08)}H${n2(x + s * 0.8)}" stroke="#fff" stroke-width="${n2(s * 0.06)}" stroke-linecap="round"/>${p(0.28, 0.28)}${p(0.72, 0.72)}${p(0.5, 0.5)}${p(0.72, 0.28)}${p(0.28, 0.72)}</g>`
}

function presa(u: string, x: number, y: number, s: number, espelho = false) {
  const d = `M${x} ${y}C${n2(x + 4 * s)} ${n2(y - 16 * s)} ${n2(x + 18 * s)} ${n2(y - 26 * s)} ${n2(x + 30 * s)} ${n2(y - 24 * s)}C${n2(x + 20 * s)} ${n2(y - 18 * s)} ${n2(x + 11 * s)} ${n2(y - 8 * s)} ${n2(x + 9 * s)} ${n2(y + 3 * s)}Z`
  return `<g${espelho ? ` transform="matrix(-1 0 0 1 ${2 * x} 0)"` : ''}><path d="${d}" fill="#000" opacity=".4" transform="translate(1.2 1.8)"/><path d="${d}" fill="url(#${u}-presa)" stroke="#2b2116" stroke-width="${n2(0.9 * s)}"/><path d="M${n2(x + 3 * s)} ${n2(y - 6 * s)}C${n2(x + 8 * s)} ${n2(y - 16 * s)} ${n2(x + 18 * s)} ${n2(y - 22 * s)} ${n2(x + 26 * s)} ${n2(y - 23 * s)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${n2(0.9 * s)}" stroke-linecap="round"/></g>`
}

/** Coroa cravejada (ref-08): aro com gemas, gomos de veludo, arcos de ouro com pérolas e a estrela no alto. */
function coroa(u: string, cx: number, base: number, s: number) {
  const P = (x: number, y: number) => `${n2(cx + x * s)} ${n2(base + y * s)}`
  const gomos = `M${P(-30, -6)}C${P(-34, -28)} ${P(-16, -40)} ${P(0, -42)}C${P(16, -40)} ${P(34, -28)} ${P(30, -6)}Z`
  const arcos = [-24, -12, 0, 12, 24]
    .map((x) => `M${P(x * 1.15, -6)}C${P(x * 1.2, -24)} ${P(x * 0.5, -38)} ${P(0, -44)}`)
    .join('')
  let perolas = ''
  for (const [x, y] of [[-34, -14], [-17, -34], [17, -34], [34, -14], [0, -44]] as const)
    perolas += `<circle cx="${n2(cx + x * s)}" cy="${n2(base + y * s)}" r="${n2(3 * s)}" fill="url(#${u}-perola)" stroke="#6f665e" stroke-width="${n2(0.4 * s)}"/>`
  const aro = `M${P(-34, -2)}H${n2(cx + 34 * s)}V${n2(base + 8 * s)}H${n2(cx - 34 * s)}Z`
  return `${relevo(gomos, `${u}-gomo`, 'ouro', s)}<path d="${arcos}" fill="none" stroke="#2a1d09" stroke-width="${n2(3.4 * s)}" stroke-linecap="round"/><path d="${arcos}" fill="none" stroke="url(#${u}-ou-d)" stroke-width="${n2(2.2 * s)}" stroke-linecap="round"/>${relevo(`M${P(-36, -14)}L${P(-30, -2)}H${P(30, -2)}L${P(36, -14)}L${P(30, -6)}H${P(-30, -6)}Z`, `${u}-ou`, 'ouro', s)}${relevo(aro, `${u}-ou`, 'ouro', s)}${perolas}${relevo(`M${P(0, -62)}L${P(5, -52)}L${P(0, -46)}L${P(-5, -52)}Z`, `${u}-ou-d`, 'ouro', s)}${gemaLapidada(cx, base - 53 * s, 6 * s, 9 * s, 'rubi', 'losango')}${gemaLapidada(cx, base + 3 * s, 12 * s, 9 * s, 'rubi', 'oval', `${u}-ou`)}${gemaLapidada(cx - 20 * s, base + 3 * s, 6 * s, 6 * s, 'ametista', 'oval', `${u}-ou`)}${gemaLapidada(cx + 20 * s, base + 3 * s, 6 * s, 6 * s, 'ametista', 'oval', `${u}-ou`)}${contas([cx - 32 * s, base + 3 * s], [cx - 26 * s, base + 3 * s], 0, 1, 1.4 * s, `${u}-perola`, '#6f665e')}${contas([cx + 26 * s, base + 3 * s], [cx + 32 * s, base + 3 * s], 0, 1, 1.4 * s, `${u}-perola`, '#6f665e')}`
}

const avatar = {
  vb: AV.vb,
  corpo: (u: string) => {
    const canto = `${relevo(volutaCheia([[28, 26], [44, 14], [66, 16], [78, 26]], 72, 38, 8, 1.8, 1.1, -90, 1, 8, 1.8) + volutaCheia([[14, 42], [8, 60], [12, 78], [22, 88]], 32, 84, 7, 1.6, 1.1, 180, -1, 7, 1.6), `${u}-ou`, 'ouro')}${gemaLapidada(22, 34, 13, 13, 'rubi', 'oval', `${u}-ou`)}`
    return `${defs(u)}${sombra(u, 0.6)}
<g filter="url(#${u}-sombra)">
${bandaBisel(12, 22, 276, 356, 7, 'ouro', `${u}-b1`)}
<path d="M19 29H281V371H19Z M27 37V363H273V37Z" fill="url(#${u}-vel)" fill-rule="evenodd"/>
<path d="M19 29H281V371H19Z M27 37V363H273V37Z" fill="url(#${u}-grao)" fill-rule="evenodd"/>
${bandaBisel(26, 36, 248, 328, 3.4, 'ouro', `${u}-b2`)}
<path d="M30.5 40.5H269.5V359.5H30.5Z" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2.2"/>
${canto}<g transform="matrix(1 0 0 -1 0 400)">${canto}</g><g transform="matrix(-1 0 0 -1 300 400)">${canto}</g><g transform="matrix(-1 0 0 1 300 0)">${canto}</g>
${[110, 200, 290].map((y) => `${gemaLapidada(12, y, 8, 11, 'rubi', 'losango', `${u}-ou`)}${gemaLapidada(288, y, 8, 11, 'rubi', 'losango', `${u}-ou`)}`).join('')}
${presa(u, 118, 34, 1.25, true)}${presa(u, 182, 34, 1.25)}
${coroa(u, 150, 32, 1)}
${carta(u, -2, 46, 34, 50, -30, 'ouros', 'Q')}${carta(u, 8, 36, 34, 50, -14, 'copas', 'K')}${carta(u, 22, 30, 34, 50, 2, 'espadas', 'A')}
${pilha(u, 252, 392, 15, 6, ['#7c1325', '#16151a'])}${pilha(u, 282, 382, 12, 4, ['#16151a', '#7c1325'])}${pilha(u, 222, 396, 12, 3, ['#7c1325'])}
${dado(186, 372, 18, -16)}${dado(200, 386, 14, 22)}
<path d="${estrela4(46, 380, 4)}${estrela4(286, 140, 3.4)}" fill="#fff3c8"/>
</g>`
  },
}

const mini = {
  vb: MI.vb,
  corpo: (u: string) => `${defs(u)}
${bandaBisel(6, 8, 108, 106, 5, 'ouro', `${u}-b1`)}
<path d="M11 13H109V109H11Z M17 19V101H103V19Z" fill="url(#${u}-vel)" fill-rule="evenodd"/>
${bandaBisel(16.6, 18.6, 86.8, 82.8, 2.4, 'ouro', `${u}-b2`)}
${presa(u, 46, 15, 0.6, true)}${presa(u, 74, 15, 0.6)}
${coroa(u, 60, 15, 0.42)}
${carta(u, 0, 80, 18, 26, -18, 'espadas', 'A')}
${pilha(u, 102, 114, 10, 4, ['#7c1325', '#16151a'])}`,
}

export const JAVALI: MolduraArte = { avatar, mini }
