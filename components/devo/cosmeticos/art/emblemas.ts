/**
 * Emblemas (texto do dono §4): símbolos pequenos ao lado do nome. viewBox 0 0 32 32, desenhados para 16–24 px:
 * silhueta de metal cheia com contorno escuro (lê no negro e no papel), um acento de cor por peça.
 */
import { gemaLapidada, rosaDefs, rosaVolume } from './material'
import { type Arte, circulo, engrenagem, estrela4, gemaGrad, lin, losango, metal, n2, naipe, rad } from './kit'

const K = '#120f0d'
const VB = '0 0 32 32'

const rosaSangue: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'prata', true)}${rosaDefs(`${u}-rv`, 'carmim')}</defs>
<path d="M16 29 C15 24 17 21 16 17" fill="none" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/><path d="M16 29 C15 24 17 21 16 17" fill="none" stroke="url(#${u}-m)" stroke-width="1.8" stroke-linecap="round"/>
<path d="M16 24 C12 23 9.5 20.5 9 18 C12 18.5 14.5 20.5 16 24Z M16.4 21.6 l3 -1.6 -1.6 3Z" fill="url(#${u}-m)" stroke="${K}" stroke-width=".7"/>
${rosaVolume(`${u}-rv`, 'carmim', 16, 10.4, 9.4, 8)}
<path d="M23.4 17.6 c1.4 1.6 2 2.8 2 3.8 a2 2 0 0 1 -4 0 c0 -1 .6 -2.2 2 -3.8Z" fill="#a3213a" stroke="${K}" stroke-width=".6"/>`,
}

const coroaPartida: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'champanhe')}${gemaGrad(`${u}-g`, 'ametista')}</defs>
<path d="M3.5 24 L2.6 11 L8.6 16.4 L11.6 7.6 L15 14 L15.6 24.4Z" fill="url(#${u}-m)" stroke="${K}" stroke-width="1" stroke-linejoin="round"/>
<path d="M17.4 25 L17.2 13.6 L20.6 7.4 L23.6 16 L29.4 10.6 L28.4 23.6Z" fill="url(#${u}-m)" stroke="${K}" stroke-width="1" stroke-linejoin="round" transform="rotate(6 23 18)"/>
<path d="M3.2 22.6 H15.6 V26.4 H3.6Z" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9"/>
<path d="M17.6 23.4 H28.6 L28.2 27.2 H17.6Z" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9" transform="rotate(6 23 18)"/>
<path d="M15.8 12 L16.8 15.2 L15.9 18 L17 21.2 L16.2 27" fill="none" stroke="${K}" stroke-width=".9"/>
<circle cx="2.6" cy="10.6" r="1.6" fill="url(#${u}-m)" stroke="${K}" stroke-width=".6"/><circle cx="11.6" cy="7.2" r="1.6" fill="url(#${u}-m)" stroke="${K}" stroke-width=".6"/><circle cx="20.6" cy="7" r="1.6" fill="url(#${u}-m)" stroke="${K}" stroke-width=".6"/>
${gemaLapidada(9.4, 19.6, 4.6, 6.2, 'ametista', 'losango')}
<path d="M19.6 30 l1.4 -2 1.2 1.4" fill="none" stroke="url(#${u}-m)" stroke-width="1"/>`,
}

const ampulheta: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'ouro')}${lin(`${u}-v`, ['rgba(240,236,250,.55)', 'rgba(200,196,215,.25)'])}${lin(`${u}-a`, ['#f3dfa4', '#c79a4c'])}</defs>
<path d="M9 5.6 H23 C23 11.4 18.4 13.6 17.4 16 C18.4 18.4 23 20.6 23 26.4 H9 C9 20.6 13.6 18.4 14.6 16 C13.6 13.6 9 11.4 9 5.6Z" fill="url(#${u}-v)" stroke="${K}" stroke-width=".9"/>
<path d="M11.6 9.4 H20.4 C19.6 11.6 17.4 13 16 14.4 C14.6 13 12.4 11.6 11.6 9.4Z" fill="url(#${u}-a)"/>
<path d="M16 15.6 V22" stroke="#e9cf87" stroke-width=".8"/>
<path d="M11 25.8 C11.6 22.6 14 21.2 16 21 C18 21.2 20.4 22.6 21 25.8Z" fill="url(#${u}-a)"/>
<rect x="6" y="2.6" width="20" height="3.6" rx="1" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9"/>
<rect x="6" y="25.8" width="20" height="3.6" rx="1" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9"/>
<path d="M7.4 6 V26 M24.6 6 V26" stroke="${K}" stroke-width="2.6"/><path d="M7.4 6 V26 M24.6 6 V26" stroke="url(#${u}-m)" stroke-width="1.4"/>
<circle cx="16" cy="1.8" r="1.4" fill="url(#${u}-m)" stroke="${K}" stroke-width=".5"/>`,
}

const olhoDestino: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'champanhe', true)}${rad(`${u}-i`, ['#f2eeff', '#a796ea', '#4b3c9e', '#17112f'], 0.5, 0.5, 0.55)}</defs>
<path d="${estrela4(16, 16, 15.4, 0.12)}" fill="url(#${u}-m)" stroke="${K}" stroke-width=".8"/>
<path d="M3.6 16 Q16 4.6 28.4 16 Q16 27.4 3.6 16Z" fill="#f4f1ea" stroke="${K}" stroke-width="1.1"/>
${gemaLapidada(16, 16, 11.4, 11.4, 'ametista', 'oval')}
<path d="${estrela4(16, 16, 3.4, 0.18)}" fill="#0d0a1c" opacity=".85"/>
<circle cx="14.2" cy="14" r="1.1" fill="#fff" class="cos-a-cintila"/>
<path d="M5 13 Q16 4 27 13" fill="none" stroke="url(#${u}-m)" stroke-width="1.6"/>`,
}

const chaveProibida: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'prata', true)}${metal(`${u}-c`, 'champanhe', true)}${gemaGrad(`${u}-g`, 'rubi')}</defs>
<g transform="rotate(-45 16 16)">
<path d="M14.6 13 H17.4 V29 H14.6Z" fill="url(#${u}-m)" stroke="${K}" stroke-width=".8"/>
<path d="M17.4 22 H21.4 V24.2 H19.6 V26 H17.4Z M17.4 26.6 H20.4 V28.6 H17.4Z" fill="url(#${u}-m)" stroke="${K}" stroke-width=".7"/>
<path d="${circulo(16, 7.4, 6.6)}${circulo(16, 7.4, 3.4)}" fill="url(#${u}-c)" fill-rule="evenodd" stroke="${K}" stroke-width=".9"/>
<path d="M16 0.4 L17.4 2.4 L16 4 L14.6 2.4Z M9 7.4 L11 6 L11 8.8Z M23 7.4 L21 6 L21 8.8Z" fill="url(#${u}-c)" stroke="${K}" stroke-width=".5"/>
${gemaLapidada(16, 7.4, 3.6, 4.6, 'rubi', 'losango')}
<path d="M13.6 14.6 H18.4 V16.2 H13.6Z" fill="url(#${u}-c)" stroke="${K}" stroke-width=".6"/>
</g>`,
}

const asEspadas: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${lin(`${u}-p`, ['#fbf8f1', '#e6dfd0'])}${metal(`${u}-m`, 'champanhe')}${metal(`${u}-n`, 'ferro')}</defs>
<g transform="rotate(-10 16 16)">
<rect x="6.4" y="2.4" width="19.2" height="27.2" rx="2.2" fill="url(#${u}-p)" stroke="${K}" stroke-width="1"/>
<rect x="8" y="4" width="16" height="24" rx="1.4" fill="none" stroke="url(#${u}-m)" stroke-width=".8"/>
<path d="${naipe('espadas', 16, 16.4, 13)}" fill="url(#${u}-n)" stroke="${K}" stroke-width=".5"/>
<path d="${estrela4(16, 15, 2.2)}" fill="#bab09f"/>
<text x="10" y="9.2" font-size="5" text-anchor="middle" fill="${K}" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">A</text>
</g>`,
}

const luaEscarlate: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${rad(`${u}-l`, ['#ffb1bb', '#c63249', '#6e0d1e', '#2f040c'], 0.35, 0.35, 0.8)}${metal(`${u}-m`, 'prata')}</defs>
<path d="M18.4 2.6 A13.4 13.4 0 1 0 29.4 21.8 A11 11 0 1 1 18.4 2.6Z" fill="url(#${u}-l)" stroke="${K}" stroke-width="1.1"/>
<path d="M9.6 9.4 A10 10 0 0 0 8.8 21" fill="none" stroke="#ffd6dc" stroke-width=".9" stroke-linecap="round" opacity=".7"/>
<circle cx="11.6" cy="17.4" r="1.4" fill="#4a0612" opacity=".6"/><circle cx="14" cy="23.4" r="1" fill="#4a0612" opacity=".6"/>
<path d="${estrela4(25.4, 7.4, 4.2)}" fill="url(#${u}-m)" stroke="${K}" stroke-width=".6" class="cos-a-cintila"/>
<path d="${estrela4(28.6, 14.4, 2)}" fill="url(#${u}-m)" stroke="${K}" stroke-width=".4"/>`,
}

const fragmento: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${lin(`${u}-c`, ['#f7f3ff', '#c2b2f6', '#7562c8', '#2f2470'], 0, 0, 1, 1)}${lin(`${u}-c2`, ['#e3dbff', '#8d79d6', '#3b2e86'], 1, 0, 0, 1)}${rad(`${u}-h`, ['rgba(194,185,236,.6)', 'rgba(194,185,236,0)'])}</defs>
<circle cx="16" cy="16" r="15" fill="url(#${u}-h)" class="cos-a-pulso"/>
<path d="M16 1.6 L21.6 11.4 L19.4 28.2 L16 30.4 L12.6 28.2 L10.4 11.4Z" fill="url(#${u}-c)" stroke="#120d26" stroke-width="1"/>
<path d="M16 1.6 L16 30.4 M10.4 11.4 L16 14 L21.6 11.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>
<path d="M16 14 L19.4 28.2 L16 30.4Z" fill="url(#${u}-c2)" opacity=".8"/>
<path d="${estrela4(6, 7, 3.4)}${estrela4(26.6, 20.6, 2.8)}${estrela4(5.6, 23, 2)}" fill="#efeaff" stroke="#120d26" stroke-width=".4" class="cos-a-cintila"/>`,
}

const engrenagemHerdeiro: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'champanhe', true)}${metal(`${u}-b`, 'bronze', true)}${gemaGrad(`${u}-g`, 'ametista')}</defs>
<g class="cos-a-spin-lento" style="transform-origin:16px 17px"><path d="${engrenagem(16, 17, 13.4, 11.2, 12, 0)}" fill="url(#${u}-b)" stroke="${K}" stroke-width=".9"/></g>
<circle cx="16" cy="17" r="8.4" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9"/>
<path d="M10.6 15.4 L11 10.6 L13.4 13 L16 9.4 L18.6 13 L21 10.6 L21.4 15.4Z" fill="url(#${u}-b)" stroke="${K}" stroke-width=".7" stroke-linejoin="round"/>
${gemaLapidada(16, 19.4, 5.4, 7, 'ametista', 'losango')}
<path d="M11 15.4 H21" stroke="${K}" stroke-width=".7"/>`,
}

const seloAnfitriao: Arte = {
  vb: VB,
  corpo: (u) => {
    let louro = ''
    for (let i = 0; i < 5; i++) {
      const a = (200 + i * 22) * (Math.PI / 180)
      const x = 16 + Math.cos(a) * 12.4
      const y = 16 + Math.sin(a) * 12.4
      louro += `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="2.6" ry="1.2" transform="rotate(${n2((a * 180) / Math.PI + 60)} ${n2(x)} ${n2(y)})" fill="url(#${u}-m)" stroke="${K}" stroke-width=".4"/>`
    }
    return `<defs>${metal(`${u}-m`, 'champanhe', true)}${rad(`${u}-s`, ['#3d3566', '#231d40', '#120e24'], 0.4, 0.35, 0.75)}${gemaGrad(`${u}-g`, 'ametista')}</defs>
<path d="${(() => {
      let d = ''
      const n = 16
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const r = i % 2 ? 13 : 14.6
        d += `${i ? 'L' : 'M'}${n2(16 + Math.cos(a) * r)} ${n2(16 + Math.sin(a) * r)}`
      }
      return `${d}Z`
    })()}" fill="url(#${u}-m)" stroke="${K}" stroke-width=".9"/>
<circle cx="16" cy="16" r="10.6" fill="url(#${u}-s)" stroke="${K}" stroke-width=".8"/>
${louro}<g transform="matrix(-1 0 0 1 32 0)">${louro}</g>
<path d="${estrela4(16, 15.4, 7.4, 0.2)}" fill="url(#${u}-m)" stroke="${K}" stroke-width=".6"/>
${gemaLapidada(16, 15.4, 3.6, 4.4, 'ametista', 'losango')}
<path d="M11.6 22.4 Q16 25.4 20.4 22.4" fill="none" stroke="url(#${u}-m)" stroke-width="1.1"/>`
  },
}

const penaCoruja: Arte = {
  vb: VB,
  corpo: (u) => `<defs>${lin(`${u}-p`, ['#ffffff', '#dfe4ec', '#9aa3b4', '#5d6475'], 0, 0, 1, 0)}${metal(`${u}-l`, 'lua', true)}</defs>
<path d="M7 29 C8 20 12 9 25 3 C24.6 11 20 21.6 9.4 27.4Z" fill="url(#${u}-p)" stroke="#262b38" stroke-width="1"/>
<path d="M7 29 C11 21 16 12 24 4" fill="none" stroke="#3c4252" stroke-width=".9"/>
<path d="M12 21 L9.6 18.6 M14.6 17 L12.2 14 M17.4 13 L15.4 9.6 M15 22 L17.6 21.6 M18 17.6 L21 17.2 M20.6 13 L23.2 12.4" stroke="#6d7586" stroke-width=".6"/>
<path d="M22 22.6 a4.6 4.6 0 1 0 4.6 5.2 a3.6 3.6 0 1 1 -4.6 -5.2Z" fill="url(#${u}-l)" stroke="#262b38" stroke-width=".6"/>`,
}

const fichaJavali: Arte = {
  vb: VB,
  corpo: (u) => {
    let marcas = ''
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      marcas += `M${n2(16 + Math.cos(a - 0.17) * 13.6)} ${n2(17 + Math.sin(a - 0.17) * 13.6)}L${n2(16 + Math.cos(a + 0.17) * 13.6)} ${n2(17 + Math.sin(a + 0.17) * 13.6)}L${n2(16 + Math.cos(a + 0.15) * 10)} ${n2(17 + Math.sin(a + 0.15) * 10)}L${n2(16 + Math.cos(a - 0.15) * 10)} ${n2(17 + Math.sin(a - 0.15) * 10)}Z`
    }
    return `<defs>${metal(`${u}-o`, 'ouro', true)}${lin(`${u}-f`, ['#8c1a2c', '#4a0912'])}${lin(`${u}-t`, ['#fffaf0', '#d9cbb0'], 0, 0, 1, 1)}</defs>
<circle cx="16" cy="18.2" r="13.8" fill="#1b0b06"/>
<circle cx="16" cy="17" r="13.8" fill="url(#${u}-f)" stroke="${K}" stroke-width="1"/>
<path d="${marcas}" fill="#f3ead6"/>
<circle cx="16" cy="17" r="7.6" fill="url(#${u}-o)" stroke="${K}" stroke-width=".8"/>
<path d="M11.8 16.4 C12.4 13.4 13.6 12 15.4 11.6 C14.2 13 13.8 14.6 14 16.4Z M20.2 16.4 C19.6 13.4 18.4 12 16.6 11.6 C17.8 13 18.2 14.6 18 16.4Z" fill="url(#${u}-t)" stroke="${K}" stroke-width=".5"/>
<path d="M13.4 18 Q16 22.6 18.6 18 Q16 19.4 13.4 18Z" fill="${K}" opacity=".75"/>
<circle cx="14.6" cy="19.4" r=".6" fill="#f3ead6"/><circle cx="17.4" cy="19.4" r=".6" fill="#f3ead6"/>`
  },
}

export const EMBLEMAS: Record<string, Arte> = {
  'rosa-sangue': rosaSangue,
  'coroa-partida': coroaPartida,
  'ampulheta-dourada': ampulheta,
  'olho-destino': olhoDestino,
  'chave-proibida': chaveProibida,
  'as-espadas': asEspadas,
  'lua-escarlate': luaEscarlate,
  'fragmento-celestial': fragmento,
  'engrenagem-herdeiro': engrenagemHerdeiro,
  'selo-anfitriao': seloAnfitriao,
  'pena-coruja': penaCoruja,
  'ficha-javali': fichaJavali,
}

