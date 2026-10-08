import { ART, artId } from './palette'

/**
 * Melissa — guia da Companhia de Despertados. Arte original do DEVO (SVG desenhado à mão).
 * Uniforme próprio: sobretudo azul-noite de gola alta com fechamento diagonal debruado em marfim,
 * mantelete curto sobre os ombros, botões dourados e o broche da Companhia (um olho que desperta)
 * com fita vermelha. Cabelo escuro em corte reto na altura do queixo, franja lateral.
 */
export type MelissaMood = 'neutral' | 'soft' | 'serious'

export const MELISSA_VIEWBOX = '0 0 600 900'

/** Olho aberto: pálpebra com cílio na ponta, íris em degradê cobalto, pupila e dois brilhos. */
function openEye(cx: number, flip: boolean, iris: string, narrow = false) {
  const d = flip ? -1 : 1
  const x = (v: number) => cx + v * d
  const top = narrow ? 252 : 246
  return `
    <path d="M${x(-19)} 260 Q${x(-2)} ${top - 4} ${x(19)} ${top + 6} Q${x(4)} 274 ${x(-19)} 260 Z" fill="#fbf6ef"/>
    <ellipse cx="${cx}" cy="261" rx="10.5" ry="${narrow ? 10 : 12.5}" fill="url(#${iris})"/>
    <ellipse cx="${cx}" cy="262" rx="5" ry="6" fill="#0c0d1a"/>
    <circle cx="${x(-4)}" cy="255" r="3.2" fill="#fff"/>
    <circle cx="${x(4)}" cy="267" r="1.6" fill="#fff" opacity="0.8"/>
    <path d="M${x(-21)} 261 Q${x(-2)} ${top - 6} ${x(20)} ${top + 4} L${x(26)} ${top - 1} L${x(19)} ${top + 9} Q${x(0)} ${top - 1} ${x(-19)} 263 Z" fill="${ART.ink}"/>
    ${narrow ? `<path d="M${x(-19)} 258 Q${x(0)} ${top + 2} ${x(19)} ${top + 9}" fill="none" stroke="#c9a88a" stroke-width="2" opacity="0.8"/>` : ''}
    <path d="M${x(-15)} 273 Q${x(0)} 278 ${x(15)} 271" fill="none" stroke="${ART.ink}" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round"/>`
}

function face(mood: MelissaMood, iris: string) {
  const ink = ART.ink
  const blush = `
      <ellipse cx="254" cy="290" rx="15" ry="6" fill="${ART.red}" opacity="${mood === 'soft' ? 0.18 : 0.08}"/>
      <ellipse cx="346" cy="290" rx="15" ry="6" fill="${ART.red}" opacity="${mood === 'soft' ? 0.18 : 0.08}"/>`
  if (mood === 'soft') {
    return `
      <path d="M246 228 Q268 218 290 226" fill="none" stroke="#2a1f22" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M310 226 Q332 218 354 228" fill="none" stroke="#2a1f22" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M250 262 Q270 246 290 260" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M290 260 L296 256" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <path d="M310 260 Q330 246 350 262" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M310 260 L304 256" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      ${blush}
      <path d="M284 304 Q300 315 316 304" fill="none" stroke="#8a3d40" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M292 309 Q300 312 308 309" fill="none" stroke="#c46a6a" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`
  }
  if (mood === 'serious') {
    return `
      <path d="M244 230 L290 238" fill="none" stroke="#2a1f22" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M356 230 L310 238" fill="none" stroke="#2a1f22" stroke-width="5.5" stroke-linecap="round"/>
      ${openEye(270, false, iris, true)}
      ${openEye(330, true, iris, true)}
      ${blush}
      <path d="M287 309 Q300 305 313 309" fill="none" stroke="#6a3434" stroke-width="3.5" stroke-linecap="round"/>`
  }
  return `
    <path d="M246 228 Q268 220 290 228" fill="none" stroke="#2a1f22" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M310 228 Q332 220 354 228" fill="none" stroke="#2a1f22" stroke-width="4.5" stroke-linecap="round"/>
    ${openEye(270, false, iris)}
    ${openEye(330, true, iris)}
    ${blush}
    <path d="M288 307 Q300 312 312 307" fill="none" stroke="#7a3a3a" stroke-width="3.2" stroke-linecap="round"/>`
}

/** Conteúdo interno do <svg viewBox="0 0 600 900">. `uid` torna os ids de gradiente únicos. */
export function melissaMarkup(mood: MelissaMood, uid = 'm') {
  const coat = artId('mel-coat', uid)
  const cape = artId('mel-cape', uid)
  const skin = artId('mel-skin', uid)
  const hair = artId('mel-hair', uid)
  const rim = artId('mel-rim', uid)
  const iris = artId('mel-iris', uid)
  return `
  <defs>
    <linearGradient id="${coat}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ART.navyLight}"/>
      <stop offset="0.55" stop-color="${ART.navy}"/>
      <stop offset="1" stop-color="${ART.night}"/>
    </linearGradient>
    <linearGradient id="${cape}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2550"/>
      <stop offset="1" stop-color="#0b1022"/>
    </linearGradient>
    <radialGradient id="${skin}" cx="0.42" cy="0.38" r="0.75">
      <stop offset="0" stop-color="#f1dcc4"/>
      <stop offset="0.7" stop-color="${ART.skin}"/>
      <stop offset="1" stop-color="${ART.skinShade}"/>
    </radialGradient>
    <linearGradient id="${hair}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b1d24"/>
      <stop offset="1" stop-color="#0f0b10"/>
    </linearGradient>
    <linearGradient id="${iris}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a1a3a"/>
      <stop offset="0.6" stop-color="#2c3f8f"/>
      <stop offset="1" stop-color="${ART.cobaltSoft}"/>
    </linearGradient>
    <linearGradient id="${rim}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ART.cobalt}" stop-opacity="0"/>
      <stop offset="1" stop-color="${ART.cobalt}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <!-- cabelo (atrás) -->
  <path d="M206 236 C200 150 250 112 300 112 C356 112 404 150 396 240 L402 352 C380 366 356 360 344 348 L256 348 C244 360 220 366 198 352 Z" fill="url(#${hair})"/>

  <!-- pescoço -->
  <path d="M276 318 L324 318 L328 392 L272 392 Z" fill="${ART.skinShade}"/>

  <!-- braços / mangas -->
  <path d="M150 520 C130 620 128 760 136 900 L214 900 L222 560 Z" fill="url(#${coat})"/>
  <path d="M450 520 C470 620 472 760 464 900 L386 900 L378 560 Z" fill="url(#${coat})"/>

  <!-- sobretudo -->
  <path d="M188 470 C200 430 240 404 300 400 C360 404 400 430 412 470 L440 900 L160 900 Z" fill="url(#${coat})"/>
  <!-- fechamento diagonal debruado -->
  <path d="M336 404 C330 470 300 520 278 566 L278 900" fill="none" stroke="${ART.ivory}" stroke-width="7" stroke-linecap="round"/>
  <path d="M344 404 C338 474 308 526 288 570 L288 900" fill="none" stroke="${ART.goldDark}" stroke-width="2" stroke-opacity="0.7"/>
  <g fill="${ART.gold}" stroke="${ART.goldDark}" stroke-width="1.5">
    <circle cx="304" cy="620" r="7"/><circle cx="304" cy="810" r="7"/><circle cx="304" cy="866" r="7"/>
  </g>
  <!-- antebraços e mãos cruzadas à frente -->
  <path d="M176 584 C200 640 236 672 270 688 L282 734 C236 724 192 690 160 630 Z" fill="url(#${coat})" stroke="${ART.night}" stroke-width="2"/>
  <path d="M424 584 C400 640 364 672 330 688 L318 734 C364 724 408 690 440 630 Z" fill="url(#${coat})" stroke="${ART.night}" stroke-width="2"/>
  <path d="M262 684 L282 732" stroke="${ART.ivory}" stroke-width="8" stroke-linecap="round"/>
  <path d="M338 684 L318 732" stroke="${ART.ivory}" stroke-width="8" stroke-linecap="round"/>
  <path d="M272 700 C292 684 336 690 344 712 C350 732 326 750 300 748 C276 746 262 730 272 700 Z" fill="${ART.skin}" stroke="${ART.skinShade}" stroke-width="2.5"/>
  <path d="M330 700 C308 688 266 696 258 716 C254 734 278 750 304 746" fill="${ART.skin}" stroke="${ART.skinShade}" stroke-width="2.5"/>
  <path d="M286 714 C296 712 310 714 318 720 M284 726 C296 724 310 726 316 732" fill="none" stroke="${ART.skinShade}" stroke-width="2" stroke-linecap="round"/>

  <!-- cinto -->
  <rect x="166" y="756" width="268" height="20" fill="${ART.night}"/>
  <rect x="290" y="752" width="26" height="28" rx="3" fill="none" stroke="${ART.gold}" stroke-width="4"/>

  <!-- mantelete -->
  <path d="M142 506 C160 446 230 414 300 412 C370 414 440 446 458 506 L470 586 L420 572 L376 594 L330 576 L300 598 L270 576 L224 594 L180 572 L130 586 Z" fill="url(#${cape})" stroke="${ART.ivory}" stroke-opacity="0.85" stroke-width="3" stroke-linejoin="round"/>
  <path d="M146 520 C170 470 236 440 300 438" fill="none" stroke="url(#${rim})" stroke-width="3"/>

  <!-- gola alta -->
  <path d="M258 352 L342 352 L352 410 C330 420 270 420 248 410 Z" fill="${ART.navy}" stroke="${ART.ivory}" stroke-width="3"/>
  <path d="M262 368 L338 368" stroke="${ART.gold}" stroke-width="2" stroke-opacity="0.8"/>

  <!-- broche da Companhia: o olho que desperta -->
  <path d="M378 498 L372 540 L384 532 L392 544 L392 500 Z" fill="${ART.red}"/>
  <circle cx="384" cy="492" r="20" fill="${ART.night}" stroke="${ART.gold}" stroke-width="4"/>
  <path d="M370 492 Q384 480 398 492 Q384 504 370 492 Z" fill="none" stroke="${ART.goldLight}" stroke-width="2.5"/>
  <circle cx="384" cy="492" r="4" fill="${ART.goldLight}"/>
  <path d="M384 466 L384 472 M384 512 L384 518" stroke="${ART.gold}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- rosto -->
  <path d="M226 236 C226 172 262 140 300 140 C340 140 374 172 374 236 C374 296 340 334 300 338 C260 334 226 296 226 236 Z" fill="url(#${skin})"/>
  <path d="M240 290 C254 318 276 334 300 338 C324 334 346 318 360 290 C348 324 326 344 300 346 C274 344 252 324 240 290 Z" fill="${ART.skinShade}" opacity="0.5"/>
  <path d="M300 268 L294 290 Q300 294 306 290" fill="none" stroke="${ART.skinShade}" stroke-width="3" stroke-linecap="round"/>
  <!-- sombra da franja na testa -->
  <path d="M232 236 C252 222 300 214 340 182 C356 196 370 214 374 236 C350 214 330 214 300 226 C276 234 250 240 232 246 Z" fill="${ART.skinShade}" opacity="0.45"/>
  ${face(mood, iris)}

  <!-- cabelo (frente): franja lateral e mechas na altura do queixo -->
  <path d="M220 246 C214 168 258 124 312 126 C360 128 392 168 384 232 C376 206 360 186 340 176 C326 196 292 214 252 218 C240 226 234 238 232 250 Z" fill="url(#${hair})"/>
  <path d="M340 176 C318 200 286 212 250 216" fill="none" stroke="#4a3440" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
  <path d="M226 230 C220 280 222 320 236 352 L212 350 C202 314 204 270 212 236 Z" fill="url(#${hair})"/>
  <path d="M376 222 C384 270 382 318 366 352 L390 350 C400 312 398 268 390 230 Z" fill="url(#${hair})"/>
  <path d="M286 150 C318 146 352 162 368 196" fill="none" stroke="#4a3440" stroke-width="3" stroke-opacity="0.8" stroke-linecap="round"/>
  <!-- brilho do cabelo -->
  <path d="M248 168 C270 144 316 136 352 150" fill="none" stroke="#7a5f70" stroke-width="7" stroke-opacity="0.35" stroke-linecap="round"/>
  <path d="M232 260 C230 290 232 318 240 340 M370 254 C374 286 372 316 362 340" fill="none" stroke="#4a3440" stroke-width="2" stroke-opacity="0.6" stroke-linecap="round"/>
  <!-- grampo dourado -->
  <rect x="344" y="196" width="26" height="6" rx="3" transform="rotate(32 357 199)" fill="${ART.gold}"/>
`
}
