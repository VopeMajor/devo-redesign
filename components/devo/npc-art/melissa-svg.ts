import { ART, artId } from './palette'

/**
 * Melissa — guia da Companhia de Despertados. Arte original do DEVO (SVG desenhado à mão).
 * Uniforme próprio: sobretudo azul-noite de gola alta com fechamento diagonal debruado em marfim,
 * mantelete curto sobre os ombros, botões dourados e o broche da Companhia (um olho que desperta)
 * com fita vermelha. Cabelo escuro em corte reto na altura do queixo, franja lateral.
 */
export type MelissaMood = 'neutral' | 'soft' | 'serious'

export const MELISSA_VIEWBOX = '0 0 600 900'

function face(mood: MelissaMood) {
  const ink = ART.ink
  if (mood === 'soft') {
    return `
      <path d="M244 226 Q268 214 290 224" fill="none" stroke="#2a1f22" stroke-width="5" stroke-linecap="round"/>
      <path d="M312 224 Q334 214 356 226" fill="none" stroke="#2a1f22" stroke-width="5" stroke-linecap="round"/>
      <path d="M252 258 Q270 246 288 258" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M312 258 Q330 246 348 258" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
      <path d="M254 262 Q270 270 286 263" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="2"/>
      <path d="M314 263 Q330 270 346 262" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="2"/>
      <ellipse cx="256" cy="284" rx="14" ry="6" fill="${ART.red}" opacity="0.12"/>
      <ellipse cx="344" cy="284" rx="14" ry="6" fill="${ART.red}" opacity="0.12"/>
      <path d="M284 304 Q300 314 316 304" fill="none" stroke="#7a3a3a" stroke-width="4" stroke-linecap="round"/>`
  }
  if (mood === 'serious') {
    return `
      <path d="M244 222 L290 234" fill="none" stroke="#2a1f22" stroke-width="6" stroke-linecap="round"/>
      <path d="M356 222 L310 234" fill="none" stroke="#2a1f22" stroke-width="6" stroke-linecap="round"/>
      <path d="M252 256 Q270 248 288 256 Q270 262 252 256 Z" fill="${ink}"/>
      <path d="M312 256 Q330 248 348 256 Q330 262 312 256 Z" fill="${ink}"/>
      <path d="M250 252 Q270 244 290 252" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M310 252 Q330 244 350 252" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="274" cy="255" r="1.8" fill="${ART.cobaltSoft}"/>
      <circle cx="334" cy="255" r="1.8" fill="${ART.cobaltSoft}"/>
      <path d="M286 309 Q300 305 314 309" fill="none" stroke="#6a3434" stroke-width="4" stroke-linecap="round"/>
      <path d="M262 236 L284 240" stroke="${ink}" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>
      <path d="M338 236 L316 240" stroke="${ink}" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>`
  }
  return `
    <path d="M244 224 Q268 216 290 226" fill="none" stroke="#2a1f22" stroke-width="5" stroke-linecap="round"/>
    <path d="M310 226 Q332 216 356 224" fill="none" stroke="#2a1f22" stroke-width="5" stroke-linecap="round"/>
    <path d="M252 256 Q270 242 288 256 Q270 266 252 256 Z" fill="${ink}"/>
    <path d="M312 256 Q330 242 348 256 Q330 266 312 256 Z" fill="${ink}"/>
    <path d="M249 253 Q270 238 291 252" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M309 252 Q330 238 351 253" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="274" cy="253" r="2.4" fill="${ART.cobaltSoft}"/>
    <circle cx="334" cy="253" r="2.4" fill="${ART.cobaltSoft}"/>
    <path d="M286 306 Q300 309 314 306" fill="none" stroke="#7a3a3a" stroke-width="4" stroke-linecap="round"/>`
}

/** Conteúdo interno do <svg viewBox="0 0 600 900">. `uid` torna os ids de gradiente únicos. */
export function melissaMarkup(mood: MelissaMood, uid = 'm') {
  const coat = artId('mel-coat', uid)
  const cape = artId('mel-cape', uid)
  const skin = artId('mel-skin', uid)
  const hair = artId('mel-hair', uid)
  const rim = artId('mel-rim', uid)
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
  ${face(mood)}

  <!-- cabelo (frente): franja lateral e mechas na altura do queixo -->
  <path d="M220 246 C214 168 258 124 312 126 C360 128 392 168 384 232 C376 206 360 186 340 176 C326 196 292 214 252 218 C240 226 234 238 232 250 Z" fill="url(#${hair})"/>
  <path d="M340 176 C318 200 286 212 250 216" fill="none" stroke="#4a3440" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
  <path d="M226 230 C220 280 222 320 236 352 L212 350 C202 314 204 270 212 236 Z" fill="url(#${hair})"/>
  <path d="M376 222 C384 270 382 318 366 352 L390 350 C400 312 398 268 390 230 Z" fill="url(#${hair})"/>
  <path d="M286 150 C318 146 352 162 368 196" fill="none" stroke="#4a3440" stroke-width="3" stroke-opacity="0.8" stroke-linecap="round"/>
  <!-- grampo dourado -->
  <rect x="344" y="196" width="26" height="6" rx="3" transform="rotate(32 357 199)" fill="${ART.gold}"/>
`
}
