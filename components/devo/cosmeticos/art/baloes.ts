/**
 * Balões de chat (texto do dono §5). Cada balão = material (fundo, borda, cor do texto) + ornamentos SVG
 * pequenos nos cantos, FORA da área do texto (o padding reserva o espaço). Contraste do texto ≥ AA.
 */
import { type Arte, circulo, estrela4, gemaGrad, lin, losango, metal, naipe, rad } from './kit'

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
const V = '0 0 24 24'

/** Filigrana dourada de canto (Correspondência Real). */
const cantoReal: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metal(`${u}-o`, 'ouro', true)}</defs>
<path d="M2 22 V8 Q2 2 8 2 H22" fill="none" stroke="url(#${u}-o)" stroke-width="1.6"/>
<path d="M5 18 C5 11 7 7.4 11 6 C9 9 9.4 11.4 12 12 C10.6 9.6 12.6 7.4 15 8.6 C14 5.6 16.6 4.6 19 5" fill="none" stroke="url(#${u}-o)" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="5" cy="5" r="2" fill="url(#${u}-o)" stroke="${K}" stroke-width=".4"/>`,
}

const seloCera: Arte = {
  vb: V,
  corpo: (u) => `<defs>${rad(`${u}-c`, ['#d0475c', '#8c1a2c', '#4a0912'], 0.4, 0.35, 0.7)}</defs>
<path d="M12 2.6 C15 2 18.4 3.6 19.6 6 C21.8 7.6 22 11 20.8 13 C21.4 15.8 19.6 19 17 19.8 C15 21.8 11.6 22 9.6 20.6 C6.6 20.8 3.8 18.4 3.6 15.6 C2 13.2 2.4 9.6 4.4 8 C4.6 5 7.6 2.6 10.2 3 Z" fill="url(#${u}-c)" stroke="#33060e" stroke-width=".6"/>
<circle cx="12" cy="11.8" r="5.6" fill="none" stroke="#e9a2ad" stroke-opacity=".55" stroke-width=".8"/>
<path d="${estrela4(12, 11.8, 4.2)}" fill="#f2c3ca" fill-opacity=".75"/>`,
}

/** Rosa escura com espinho (Confissão Carmesim). */
const cantoCarmesim: Arte = {
  vb: V,
  corpo: (u) => `<defs>${rad(`${u}-r`, ['#d0475c', '#8c1a2c', '#4a0912', '#22040a'], 0.45, 0.4, 0.7)}${lin(`${u}-f`, ['#56604f', '#22281f'])}</defs>
<path d="M7 7 C12 9 16 8 22 3" fill="none" stroke="url(#${u}-f)" stroke-width="1.4"/><path d="M15 7.6 l2.4 -2.8 -0.6 3.4Z M11 8.8 l0.6 -3 1.4 2.8Z" fill="#1d1f1b"/>
<path d="M7 7 C9 12 8 16 3 22" fill="none" stroke="url(#${u}-f)" stroke-width="1.4"/><path d="M7.6 15 l-2.8 2.4 3.4 -.6Z" fill="#1d1f1b"/>
<circle cx="7" cy="7" r="6" fill="url(#${u}-r)" stroke="#1a0307" stroke-width=".6"/>
<path d="M4 6.4 C5 3.6 9 3.6 10 6.4 C8.6 5.4 5.4 5.4 4 6.4Z M7 4.8 C9.4 5.4 9.6 8 7.6 9 C7.4 8 6.4 7.6 5.6 8 C5.4 6.6 6 5.4 7 4.8Z" fill="#2a0309" opacity=".6"/>
<path d="M14 14 h.01" stroke="#c98a95" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
}

/** Glifos e estrela (Ecos do Arcano). */
const cantoArcano: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metal(`${u}-m`, 'champanhe', true)}${gemaGrad(`${u}-g`, 'ametista')}</defs>
<path d="M2 20 V6 L6 2 H20" fill="none" stroke="#8a7cc8" stroke-width="1.1"/>
<path d="${losango(6.5, 6.5, 6, 6)}" fill="url(#${u}-g)" stroke="#120d26" stroke-width=".5"/>
<g class="cos-a-runa"><path d="M13 5 v4 M11.6 6.2 l2.8 1.6 M18 4.6 l-1.4 4 1.4 0 M5 13 a1.6 1.6 0 1 0 .01 0 M5 17.4 v3" fill="none" stroke="#c2b9ec" stroke-width=".9" stroke-linecap="round"/></g>`,
}

/** Pequeno relógio frio (Último Suspiro). */
const cantoSuspiro: Arte = {
  vb: V,
  corpo: (u) => `<defs>${metal(`${u}-l`, 'lua', true)}${rad(`${u}-d`, ['#f2f6fa', '#c8d2dd', '#8693a3'])}</defs>
<path d="M14 3 H22 M3 14 V22" stroke="url(#${u}-l)" stroke-width="1"/>
<circle cx="8" cy="8" r="6.4" fill="url(#${u}-d)" stroke="#2c3440" stroke-width=".9"/>
<circle cx="8" cy="8" r="6.4" fill="none" stroke="url(#${u}-l)" stroke-width="1.2"/>
<path d="M8 3.4 v1 M12.6 8 h-1 M8 12.6 v-1 M3.4 8 h1" stroke="#2c3440" stroke-width=".7"/>
<g class="cos-a-ponteiro" style="transform-origin:8px 8px"><path d="M8 8 V4.4" stroke="#2c3440" stroke-width=".8" stroke-linecap="round"/></g>
<path d="M8 8 L10.4 9.6" stroke="#2c3440" stroke-width=".8" stroke-linecap="round"/>
<path d="M8 0.6 v1.2" stroke="url(#${u}-l)" stroke-width="1.4"/>`,
}

/** Carta e ficha (Mesa do Destino). */
const cantoMesa: Arte = {
  vb: V,
  corpo: (u) => {
    let marcas = ''
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      marcas += circulo(16 + Math.cos(a) * 4.3, 16 + Math.sin(a) * 4.3, 0.9)
    }
    return `<defs>${lin(`${u}-p`, ['#fbf8f1', '#e3dbc9'])}${metal(`${u}-o`, 'champanhe', true)}</defs>
<g transform="rotate(-14 7 9)"><rect x="2" y="2" width="10" height="14" rx="1.4" fill="url(#${u}-p)" stroke="${K}" stroke-width=".6"/><path d="${naipe('espadas', 7, 9.4, 6.4)}" fill="${K}"/></g>
<circle cx="16" cy="16" r="5.6" fill="#7c1325" stroke="${K}" stroke-width=".6"/><path d="${marcas}" fill="#f3ead6"/><circle cx="16" cy="16" r="2.4" fill="url(#${u}-o)"/>`
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
