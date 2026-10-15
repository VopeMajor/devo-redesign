import type { CSSProperties } from 'react'

/**
 * Mármore da Sala de Jogos, calibrado na ref-mestra (`refs/ref-xadrez-marmore.png`): veios cinza
 * neutros (#797c81 → #8f8e8b), sem o veio de latão amarelado das utilidades globais. Procedural (SVG
 * feTurbulence numa imagem de 480 px que o navegador cacheia): os veios são a curva de nível do ruído
 * (linhas longas e finas, como rachaduras na pedra) com um halo difuso baixo; nada de manchas de fumaça. Candidato ao kit: substitui `dv-marble`/`dv-marble-dark`.
 */
function marbleSvg({ vein, cloud, fine, soft, seed }: { vein: string; cloud: string; fine: string; soft: string; seed: number }) {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'>` +
    `<filter id='m' x='0' y='0' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.0042 0.0105' numOctaves='4' seed='${seed}' stitchTiles='stitch' result='n'/>` +
    `<feColorMatrix in='n' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -1' result='a'/>` +
    // veio fino e nítido
    `<feComponentTransfer in='a' result='v1'><feFuncA type='table' tableValues='0 0 0 0 0 0 0 0 0 0.12 1 0.12 0 0 0 0 0 0 0 0 0'/></feComponentTransfer>` +
    `<feGaussianBlur in='v1' stdDeviation='0.45' result='v1b'/>` +
    `<feColorMatrix in='v1b' type='matrix' values='0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 ${fine} 0' result='c1'/>` +
    // veio largo e difuso
    `<feComponentTransfer in='a' result='v2'><feFuncA type='table' tableValues='0 0 0 0 0 0 0 0 0.25 0.6 1 0.6 0.25 0 0 0 0 0 0 0 0'/></feComponentTransfer>` +
    `<feGaussianBlur in='v2' stdDeviation='3' result='v2b'/>` +
    `<feColorMatrix in='v2b' type='matrix' values='0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 0 ${vein}  0 0 0 ${soft} 0' result='c2'/>` +
    // nuvem da pedra
    `<feColorMatrix in='n' type='matrix' values='0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  0 0 0 0 ${cloud}  0.1 0 0 0 -0.03' result='c3'/>` +
    `<feMerge><feMergeNode in='c3'/><feMergeNode in='c2'/><feMergeNode in='c1'/></feMerge>` +
    `</filter><rect width='100%' height='100%' filter='url(#m)'/></svg>`
  )
}

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

const INK_SVG = url(marbleSvg({ vein: '0.62', cloud: '0.42', fine: '0.42', soft: '0.1', seed: 23 }))
const PORCELAIN_SVG = url(marbleSvg({ vein: '0.5', cloud: '0.62', fine: '0.5', soft: '0.14', seed: 7 }))

/** Mármore negro (#101012) com veios cinza. */
export const MARBLE_INK: CSSProperties = {
  backgroundColor: '#111113',
  backgroundImage: `radial-gradient(120% 80% at 80% 0%, rgba(238,237,235,0.06), transparent 60%), ${INK_SVG}`,
  backgroundSize: 'auto, 480px 480px',
}

/** Mármore branco (porcelana #efeeeb) com veios cinza. */
export const MARBLE_PORCELAIN: CSSProperties = {
  backgroundColor: '#efeeeb',
  backgroundImage: `radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.75), transparent 60%), ${PORCELAIN_SVG}`,
  backgroundSize: 'auto, 480px 480px',
}
