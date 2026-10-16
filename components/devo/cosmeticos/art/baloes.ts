/**
 * Balões de chat (texto do dono §5). Cada balão = material (fundo, borda, cor do texto) + ornamentos SVG
 * pequenos nos cantos, FORA da área do texto (o padding reserva o espaço). Contraste do texto ≥ AA.
 */
import { type Arte, circulo, estrela4, lin, naipe, rad, volutaCheia } from './kit'
import { contas, folhaDefs, folhaVeias, gemaLapidada, metalDefs, relevo, rosaDefs, rosaVolume } from './material'

export type Balao = {
  /** CSS background do balão */
  fundo: string
  /** cor da borda (1px) e do filete interno */
  borda: string
  filete: string
  /** cor do texto da mensagem e do nome sobre o balão */
  texto: string
  /** ornamento de canto (viewBox 0 0 24 24), desenhado para o canto superior esquerdo; o inferior direito é espelho */
  canto: Arte
  /** selo pequeno no fim (opcional, viewBox 0 0 24 24) */
  selo?: Arte
  /** textura opcional (CSS background-image extra, por cima do fundo) */
  textura?: string
}

const K = '#15110d'

const V = '0 0 32 32'

/** Filigrana dourada em relevo, pérolas e um rubi lapidado (Correspondência Real). */
const cantoReal: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metalDefs(`${u}-o`, 'ouro')}<radialGradient id="${u}-p" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#ece5df"/><stop offset="1" stop-color="#9c93a0"/></radialGradient></defs>
${relevo(volutaCheia([[3, 22], [3, 10], [9, 4], [20, 3]], 22, 9, 4.6, 1.1, 1.1, -90, 1, 3.2, 0.9), `${u}-o`, 'ouro', 0.5)}
${relevo(volutaCheia([[6, 14], [9, 9], [14, 8]], 13, 13, 2.6, 0.7, 1, -60, 1, 2, 0.6), `${u}-o-d`, 'ouro', 0.4)}
${contas([3, 26], [3, 31], 0, 2, 0.9, `${u}-p`, '#6f665e')}${contas([24, 3], [30, 3], 0, 2, 0.9, `${u}-p`, '#6f665e')}
${gemaLapidada(6, 6, 6, 6, 'rubi', 'oval', `${u}-o`)}`,
}

const seloCera: Arte = {
  vb: '0 0 24 24',
  corpo: (u) => `<defs>${rad(`${u}-c`, ['#e05a70', '#9c1f33', '#5a0a16', '#2a0309'], 0.38, 0.3, 0.75)}</defs>
<path d="M12.6 3.4 C15.8 2.8 19 4.6 20 7 C22.2 8.6 22.4 12 21.2 14 C21.8 16.8 20 19.8 17.4 20.6 C15.4 22.4 12 22.6 10 21.2 C7 21.4 4.2 19 4 16.2 C2.4 13.8 2.8 10.2 4.8 8.6 C5 5.6 8 3.2 10.6 3.6Z" fill="#000" opacity=".45" transform="translate(.8 1.2)"/>
<path d="M12 2.6 C15 2 18.4 3.6 19.6 6 C21.8 7.6 22 11 20.8 13 C21.4 15.8 19.6 19 17 19.8 C15 21.8 11.6 22 9.6 20.6 C6.6 20.8 3.8 18.4 3.6 15.6 C2 13.2 2.4 9.6 4.4 8 C4.6 5 7.6 2.6 10.2 3 Z" fill="url(#${u}-c)" stroke="#33060e" stroke-width=".6"/>
<circle cx="12" cy="11.8" r="5.8" fill="none" stroke="#33060e" stroke-opacity=".6" stroke-width="1.2"/><circle cx="12" cy="11.8" r="5.8" fill="none" stroke="#f0a5b1" stroke-opacity=".45" stroke-width=".6" transform="translate(-.4 -.5)"/>
<path d="${estrela4(12, 11.8, 4.2)}" fill="#33060e" opacity=".55" transform="translate(.4 .5)"/><path d="${estrela4(12, 11.8, 4.2)}" fill="#f4c6cd" fill-opacity=".85"/>
<path d="M6.5 7 Q8.5 4.6 11.6 4.2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".8" stroke-linecap="round"/>`,
}

/** Rosa de vinho em volume, folhas e um ramo de espinhos (Confissão Carmesim). */
const cantoCarmesim: Arte = {
  vb: V,
  corpo: (u) => `<defs>${rosaDefs(`${u}-r`, 'vinho')}${folhaDefs(`${u}-f`)}</defs>
<path d="M8 8 C14 10 20 8 31 3" fill="none" stroke="#050604" stroke-width="2"/><path d="M8 8 C14 10 20 8 31 3" fill="none" stroke="url(#${u}-f)" stroke-width="1.2"/><path d="M18 8.6 l2.6 -3 -.4 3.6Z M24 6 l1.4 -2.8 .8 2.6Z" fill="#20261d"/>
<path d="M8 8 C10 14 8 20 3 31" fill="none" stroke="#050604" stroke-width="2"/><path d="M8 8 C10 14 8 20 3 31" fill="none" stroke="url(#${u}-f)" stroke-width="1.2"/><path d="M8.6 18 l-3 2.6 3.6 -.4Z" fill="#20261d"/>
${folhaVeias(`${u}-f`, 10, 12, 11, 4, 60)}${folhaVeias(`${u}-f`, 12, 9, 11, 4, 10)}
${rosaVolume(`${u}-r`, 'vinho', 8, 8, 8, 10)}`,
}

/** Crescente de aço, ametista lapidada e glifos que acendem (Ecos do Arcano). */
const cantoArcano: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metalDefs(`${u}-m`, 'champanhe')}</defs>
<path d="M2 28 V8 L8 2 H28" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1.6" transform="translate(.6 .9)"/><path d="M2 28 V8 L8 2 H28" fill="none" stroke="#8a7cc8" stroke-width="1.2"/>
${relevo('M4 14 C4 8 8 4 14 4 C10 6 8 9 8 14 C8 18 10 21 14 23 C8 23 4 19 4 14Z', `${u}-m-d`, 'champanhe', 0.5)}
${gemaLapidada(9, 9, 6.4, 6.4, 'ametista', 'losango')}
<g class="cos-a-runa"><path d="M18 5 v5 M16.4 6.4 l3.2 1.8 M24 4.6 l-1.6 4.4 1.6 0 M5.4 20 a1.8 1.8 0 1 0 .01 0 M5.4 25 v4" fill="none" stroke="#d6ccff" stroke-width=".9" stroke-linecap="round"/></g>
<path d="${estrela4(14, 14, 2.4)}" fill="#fff6e6" class="cos-a-cintila"/>`,
}

/** Relógio de bolso em relevo de prata fria, com corrente (Último Suspiro). */
const cantoSuspiro: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metalDefs(`${u}-l`, 'lua')}${rad(`${u}-d`, ['#f6f9fc', '#d2dbe5', '#8693a3'])}</defs>
${contas([16, 4], [30, 4], 1.2, 7, 0.7, `${u}-l-r`, '#2c3440')}${contas([4, 16], [4, 30], 1.2, 7, 0.7, `${u}-l-r`, '#2c3440')}
${relevo('M10 1 h4 v3 h-4Z', `${u}-l`, 'lua', 0.4)}
<circle cx="12.6" cy="12.6" r="9" fill="#000" opacity=".45"/>
${relevo('M3 12 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0Z', `${u}-l-d`, 'lua', 0.5)}
<circle cx="12" cy="12" r="6.8" fill="url(#${u}-d)" stroke="#2c3440" stroke-width=".6"/>
<path d="M12 5.8 v1.4 M18.2 12 h-1.4 M12 18.2 v-1.4 M5.8 12 h1.4" stroke="#2c3440" stroke-width=".8"/>
<g class="cos-a-ponteiro" style="transform-origin:12px 12px"><path d="M12 12 V6.8" stroke="#2c3440" stroke-width=".9" stroke-linecap="round"/></g>
<path d="M12 12 L15 14" stroke="#2c3440" stroke-width=".9" stroke-linecap="round"/><circle cx="12" cy="12" r=".9" fill="#2c3440"/>
<path d="M7 8 a6.4 6.4 0 0 1 5 -2.4" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".7" stroke-linecap="round"/>`,
}

/** Carta, ficha e dado em relevo (Mesa do Destino). */
const cantoMesa: Arte = {
  vb: V,
  corpo: (u) => {
    let marcas = ''
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      marcas += circulo(21 + Math.cos(a) * 5.2, 21 + Math.sin(a) * 5.2, 1)
    }
    return `<defs>${lin(`${u}-p`, ['#fffcf4', '#e3dbc9'], 0, 0, 1, 1)}${metalDefs(`${u}-o`, 'ouro')}</defs>
<g transform="rotate(-14 8 11)"><rect x="3.8" y="3.6" width="12" height="17" rx="1.6" fill="#000" opacity=".45"/><rect x="2.6" y="2" width="12" height="17" rx="1.6" fill="url(#${u}-p)" stroke="${K}" stroke-width=".6"/><rect x="3.8" y="3.2" width="9.6" height="14.6" rx="1" fill="none" stroke="url(#${u}-o)" stroke-width=".5"/><path d="${naipe('espadas', 8.6, 11, 7)}" fill="${K}"/><text x="4.8" y="6.8" font-size="3.2" fill="${K}" style="font-family:var(--font-card-title),Cinzel,Georgia,serif;font-weight:700">A</text></g>
<ellipse cx="21.8" cy="22.4" rx="7" ry="6.6" fill="#000" opacity=".45"/>
<circle cx="21" cy="21" r="7" fill="#7c1325" stroke="${K}" stroke-width=".6"/><path d="${marcas}" fill="#f3ead6"/><circle cx="21" cy="21" r="3.2" fill="url(#${u}-o)" stroke="${K}" stroke-width=".4"/><path d="M16.4 17.4 a6 6 0 0 1 6 -2.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>`
  },
}

export const BALOES: Record<string, Balao> = {
  'correspondencia-real': {
    fundo: 'linear-gradient(170deg,#f6f1e6,#ebe2cf)',
    borda: '#a88b4f',
    filete: 'rgba(168,139,79,.55)',
    texto: '#1d1a16',
    canto: cantoReal,
    selo: seloCera,
    textura: 'repeating-linear-gradient(180deg,transparent 0 21px,rgba(120,100,60,.08) 21px 22px)',
  },
  'confissao-carmesim': {
    fundo: 'linear-gradient(160deg,#3a0c15,#22070c 70%)',
    borda: '#7c1a2b',
    filete: 'rgba(201,138,149,.35)',
    texto: '#f6e8ea',
    canto: cantoCarmesim,
  },
  'ecos-arcano': {
    fundo: 'radial-gradient(120% 140% at 0% 0%,#28213f,#141120 60%,#0e0c16)',
    borda: '#4d4285',
    filete: 'rgba(194,185,236,.35)',
    texto: '#eeebf8',
    canto: cantoArcano,
    textura: 'radial-gradient(1px 1px at 20% 30%,rgba(194,185,236,.5),transparent),radial-gradient(1px 1px at 70% 60%,rgba(194,185,236,.35),transparent),radial-gradient(1px 1px at 45% 85%,rgba(194,185,236,.3),transparent)',
  },
  'ultimo-suspiro': {
    fundo: 'linear-gradient(170deg,#1e2730,#131920 70%)',
    borda: '#5d6b7a',
    filete: 'rgba(220,228,236,.28)',
    texto: '#eaf0f4',
    canto: cantoSuspiro,
  },
  'mesa-destino': {
    fundo: 'linear-gradient(165deg,#1d1012,#120a0b 70%)',
    borda: '#8a7a5a',
    filete: 'rgba(186,176,159,.4)',
    texto: '#f1ece2',
    canto: cantoMesa,
    textura: 'repeating-linear-gradient(90deg,rgba(124,19,37,.0) 0 10px,rgba(124,19,37,.18) 10px 12px)',
  },
}

export const BALAO_IDS = Object.keys(BALOES)
