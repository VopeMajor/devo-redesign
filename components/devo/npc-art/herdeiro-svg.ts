import { ART, artId } from './palette'

/**
 * O Herdeiro — herdeiro arrogante. Arte original do DEVO (SVG desenhado à mão).
 * Cabelo preto penteado para trás com uma mecha caída, queixo erguido, olhos semicerrados.
 * Casaca de veludo preto com cordão dourado no ombro, colete marfim, gravata plastrom cobalto
 * com alfinete de ouro e anel de sinete. Sem óculos, sem terno de escritório.
 */
export type HerdeiroExpression = 'neutral' | 'smirk'

export const HERDEIRO_VIEWBOX = '0 0 600 900'
/** Recorte no rosto, para avatares redondos. */
export const HERDEIRO_FACE_VIEWBOX = '200 110 200 200'

function face(expr: HerdeiroExpression) {
  const ink = ART.ink
  const brows =
    expr === 'smirk'
      ? `<path d="M246 222 Q268 210 290 220" fill="none" stroke="#120f14" stroke-width="6" stroke-linecap="round"/>
         <path d="M312 214 Q336 196 358 206" fill="none" stroke="#120f14" stroke-width="6" stroke-linecap="round"/>`
      : `<path d="M246 220 Q268 212 290 220" fill="none" stroke="#120f14" stroke-width="6" stroke-linecap="round"/>
         <path d="M312 220 Q334 212 356 218" fill="none" stroke="#120f14" stroke-width="6" stroke-linecap="round"/>`
  // Olhos semicerrados: pálpebra superior pesada e reta.
  const eyes = `
    <path d="M252 246 L290 246 Q272 258 252 246 Z" fill="${ink}"/>
    <path d="M312 246 L350 246 Q330 258 312 246 Z" fill="${ink}"/>
    <path d="M248 245 L293 244" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M309 244 L354 245" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="275" cy="249" r="2" fill="${ART.gold}"/>
    <circle cx="333" cy="249" r="2" fill="${ART.gold}"/>`
  const mouth =
    expr === 'smirk'
      ? `<path d="M282 304 Q300 306 312 302 Q324 298 330 288" fill="none" stroke="#5a2a2c" stroke-width="4" stroke-linecap="round"/>
         <path d="M330 288 Q334 292 334 298" fill="none" stroke="#5a2a2c" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M284 304 Q302 302 318 304" fill="none" stroke="#5a2a2c" stroke-width="4" stroke-linecap="round"/>`
  return `${brows}${eyes}${mouth}`
}

export function herdeiroMarkup(expr: HerdeiroExpression, uid = 'h') {
  const coat = artId('her-coat', uid)
  const skin = artId('her-skin', uid)
  const hair = artId('her-hair', uid)
  const vest = artId('her-vest', uid)
  return `
  <defs>
    <linearGradient id="${coat}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#262a36"/>
      <stop offset="0.5" stop-color="#11131b"/>
      <stop offset="1" stop-color="#05060a"/>
    </linearGradient>
    <radialGradient id="${skin}" cx="0.45" cy="0.35" r="0.8">
      <stop offset="0" stop-color="#f0dcc6"/>
      <stop offset="0.75" stop-color="${ART.skin}"/>
      <stop offset="1" stop-color="${ART.skinShade}"/>
    </radialGradient>
    <linearGradient id="${hair}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22232c"/>
      <stop offset="1" stop-color="#07070b"/>
    </linearGradient>
    <linearGradient id="${vest}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ART.ivory}"/>
      <stop offset="1" stop-color="${ART.ivoryShade}"/>
    </linearGradient>
  </defs>

  <!-- pescoço -->
  <path d="M272 300 L330 300 L334 364 L268 364 Z" fill="${ART.skinShade}"/>

  <!-- casaca -->
  <path d="M120 900 C124 700 150 520 196 452 C230 420 266 404 300 402 C334 404 370 420 404 452 C450 520 476 700 480 900 Z" fill="url(#${coat})"/>
  <!-- colete marfim -->
  <path d="M252 420 L348 420 L380 900 L220 900 Z" fill="url(#${vest})"/>
  <g fill="${ART.gold}" stroke="${ART.goldDark}" stroke-width="1.5">
    <circle cx="282" cy="560" r="6"/><circle cx="318" cy="560" r="6"/>
    <circle cx="282" cy="640" r="6"/><circle cx="318" cy="640" r="6"/>
    <circle cx="282" cy="720" r="6"/><circle cx="318" cy="720" r="6"/>
  </g>
  <!-- lapelas largas de veludo -->
  <path d="M252 414 L298 560 L236 520 L206 456 Z" fill="#05060a" stroke="#2b2f3e" stroke-width="2"/>
  <path d="M348 414 L302 560 L364 520 L394 456 Z" fill="#05060a" stroke="#2b2f3e" stroke-width="2"/>
  <!-- cordão dourado do ombro -->
  <path d="M404 452 C430 500 418 560 372 590" fill="none" stroke="${ART.gold}" stroke-width="5" stroke-linecap="round"/>
  <path d="M410 470 C440 530 420 590 360 612" fill="none" stroke="${ART.goldDark}" stroke-width="4" stroke-linecap="round"/>
  <rect x="392" y="440" width="44" height="18" rx="4" transform="rotate(28 414 449)" fill="${ART.gold}"/>

  <!-- gola alta e plastrom cobalto -->
  <path d="M260 336 L340 336 L348 420 L300 404 L252 420 Z" fill="${ART.ivory}" stroke="${ART.ivoryShade}" stroke-width="2"/>
  <path d="M278 392 C290 386 310 386 322 392 L314 470 C306 478 294 478 286 470 Z" fill="#1433b0"/>
  <path d="M286 394 L314 394 L308 416 L292 416 Z" fill="#0b2185"/>
  <path d="M290 420 L296 466" stroke="${ART.cobaltSoft}" stroke-opacity="0.5" stroke-width="2"/>
  <circle cx="300" cy="440" r="7" fill="${ART.goldLight}" stroke="${ART.goldDark}" stroke-width="2"/>
  <path d="M300 433 L300 447 M293 440 L307 440" stroke="${ART.red}" stroke-width="2"/>

  <!-- mão no lapela com anel de sinete -->
  <path d="M196 640 C214 600 236 560 262 540 L284 556 C264 584 246 624 232 662 Z" fill="url(#${coat})" stroke="#05060a" stroke-width="2"/>
  <path d="M254 532 C268 520 288 524 292 540 C294 556 282 566 266 566 C254 564 246 548 254 532 Z" fill="${ART.skin}" stroke="${ART.skinShade}" stroke-width="2"/>
  <path d="M262 546 L286 540 M262 556 L284 552" stroke="${ART.skinShade}" stroke-width="2" stroke-linecap="round"/>
  <rect x="270" y="532" width="10" height="9" rx="2" fill="${ART.gold}" stroke="${ART.goldDark}" stroke-width="1.5"/>
  <path d="M250 548 L240 560" stroke="${ART.ivory}" stroke-width="7" stroke-linecap="round"/>

  <!-- rosto (queixo erguido) -->
  <g transform="rotate(-4 300 240)">
    <path d="M232 226 C232 166 264 132 302 132 C342 132 370 166 370 226 C370 278 344 316 302 326 C262 318 232 280 232 226 Z" fill="url(#${skin})"/>
    <path d="M244 280 C258 306 278 320 302 326 C326 320 346 304 360 280 C352 312 330 332 302 336 C274 332 252 314 244 280 Z" fill="${ART.skinShade}" opacity="0.55"/>
    <path d="M302 254 L296 284 L310 286" fill="none" stroke="${ART.skinShade}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${face(expr)}
    <!-- cabelo penteado para trás, mecha caída -->
    <path d="M226 230 C214 150 262 104 314 106 C368 108 398 152 380 222 C376 196 360 176 330 166 C300 160 268 166 250 184 C238 196 232 212 230 232 Z" fill="url(#${hair})"/>
    <path d="M250 166 C280 140 330 136 364 164" fill="none" stroke="#3a3c4a" stroke-width="3" stroke-linecap="round"/>
    <path d="M258 150 C290 126 338 126 372 150" fill="none" stroke="#3a3c4a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M332 158 C326 182 306 200 290 230 C308 212 328 196 344 174 Z" fill="url(#${hair})"/>
    <path d="M226 230 C222 250 224 268 230 282 L238 282 C234 262 234 246 236 232 Z" fill="url(#${hair})"/>
    <path d="M378 222 C382 244 380 262 374 278 L366 278 C370 258 370 240 368 226 Z" fill="url(#${hair})"/>
  </g>
`
}
