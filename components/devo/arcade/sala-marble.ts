import type { CSSProperties } from 'react'

/**
 * Mármore da Sala de Jogos, calibrado na ref-mestra (`refs/ref-xadrez-marmore.png`): pedra quase lisa,
 * nuvem baixa e poucos veios cinza neutros (#797c81 → #8f8e8b) correndo na diagonal, finos e quebrados
 * como rachaduras, com um halo difuso. Sem o veio de latão amarelado das utilidades globais e sem o
 * desenho de "curva de nível" do ruído puro.
 *
 * Procedural: um SVG de 800 px (cacheado pelo navegador) com os veios traçados à mão e deformados por
 * `feDisplacementMap` (uma deformação larga para o meandro e uma fina para o serrilhado da rachadura).
 * Tamanho fixo e centralizado: não escala (o veio mantém a espessura em qualquer peça) e não ladrilha
 * (sem emenda). Candidato ao kit: substitui `dv-marble`/`dv-marble-dark`.
 */

/** Veios: [traçado, espessura, opacidade]. Principal, ramos e fios quase invisíveis. */
const VEINS: [string, number, number][] = [
  ['M-30 110 L70 160 L150 150 L250 238 L330 246 L410 326 L470 336 L555 428 L640 446 L725 540 L830 590', 1.4, 1],
  ['M250 238 L298 302 L286 362 L340 428 L352 470', 0.8, 0.7],
  ['M555 428 L604 380 L684 362 L770 292 L830 270', 0.7, 0.6],
  ['M-30 520 L78 560 L142 612 L232 628 L302 702 L382 722 L440 830', 1.1, 0.7],
  ['M382 -30 L452 58 L522 92 L602 172 L702 204 L830 262', 0.6, 0.5],
  ['M40 330 L118 384 L162 452 L150 520', 0.5, 0.45],
  ['M600 620 L660 690 L742 712 L830 790', 0.6, 0.5],
]

type Stone = { vein: string; cloud: string; cloudA: number; veinA: number; halo: number; seed: number; flip: boolean }

function marbleSvg({ vein, cloud, cloudA, veinA, halo, seed, flip }: Stone) {
  const paths = VEINS.map(([d, w, o]) => `<path d='${d}' stroke-width='${w}' stroke-opacity='${(o * veinA).toFixed(3)}'/>`).join('')
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>` +
    // nuvem: manchas largas e muito baixas, como a pedra sob luz difusa
    `<filter id='c' x='0' y='0' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.0028 0.0055' numOctaves='4' seed='${seed}'/>` +
    `<feColorMatrix type='matrix' values='0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  ${cloudA} 0 0 0 ${(-cloudA * 0.35).toFixed(3)}'/>` +
    `</filter>` +
    // veios: meandro largo + serrilhado fino + halo difuso
    `<filter id='v' x='-10%' y='-10%' width='120%' height='120%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.011' numOctaves='2' seed='${seed + 3}' result='t1'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='t1' scale='34' xChannelSelector='R' yChannelSelector='G' result='d1'/>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.11' numOctaves='2' seed='${seed + 9}' result='t2'/>` +
    `<feDisplacementMap in='d1' in2='t2' scale='4' xChannelSelector='G' yChannelSelector='R' result='d2'/>` +
    `<feGaussianBlur in='d2' stdDeviation='5' result='h'/>` +
    `<feComponentTransfer in='h' result='h2'><feFuncA type='linear' slope='${halo}'/></feComponentTransfer>` +
    `<feMerge><feMergeNode in='h2'/><feMergeNode in='d2'/></feMerge>` +
    `</filter>` +
    `<rect width='800' height='800' filter='url(#c)'/>` +
    `<g filter='url(#v)'><g fill='none' stroke='${vein}' stroke-linecap='round' stroke-linejoin='round'${flip ? ` transform='matrix(-1 0 0 1 800 0)'` : ''}>${paths}</g></g>` +
    `</svg>`
  )
}

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

const INK_SVG = url(marbleSvg({ vein: '#8f8e8b', cloud: '0.55', cloudA: 0.22, veinA: 0.62, halo: 0.5, seed: 23, flip: false }))
const PORCELAIN_SVG = url(marbleSvg({ vein: '#797c81', cloud: '0.42', cloudA: 0.2, veinA: 0.55, halo: 0.45, seed: 7, flip: true }))

/** Mármore negro (#111113) com veios cinza. */
export const MARBLE_INK: CSSProperties = {
  backgroundColor: '#111113',
  backgroundImage: `radial-gradient(120% 80% at 80% 0%, rgba(238,237,235,0.06), transparent 60%), ${INK_SVG}`,
  backgroundSize: 'auto, 800px 800px',
  backgroundPosition: 'center, center',
  backgroundRepeat: 'no-repeat',
}

/** Mármore branco (porcelana #efeeeb) com veios cinza. */
export const MARBLE_PORCELAIN: CSSProperties = {
  backgroundColor: '#efeeeb',
  backgroundImage: `radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.7), transparent 60%), ${PORCELAIN_SVG}`,
  backgroundSize: 'auto, 800px 800px',
  backgroundPosition: 'center, center',
  backgroundRepeat: 'no-repeat',
}
