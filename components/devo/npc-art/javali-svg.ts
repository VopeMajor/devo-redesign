import { ART, artId } from './palette'

/**
 * Javali — anfitrião do cassino da Sala de Jogos. Arte original do DEVO (SVG desenhado à mão).
 * Um homem de smoking azul-noite usando uma máscara de javali em bronze dourado (presas de marfim,
 * crina escura, olhos acesos em cobalto), gravata-borboleta vermelha, luvas pretas e cartas na mão.
 *
 * Poses (camadas sobre o mesmo corpo):
 * - `table`: as duas mãos na mesa, leque de cartas (também é o "anfitrião debruçado" da Mesa);
 * - `point`: aponta para o jogador com uma das mãos;
 * - `door`: de pé ao lado de uma porta, apresentando a casa.
 * `scene` desenha o fundo (parede, mesa ou porta). Sem `scene`, o fundo é transparente.
 */
export type JavaliPose = 'table' | 'point' | 'door'

export const JAVALI_VIEWBOX = '0 0 1200 500'

const BRONZE = '#a07a3c'
const BRONZE_DARK = '#5e4320'
const SUIT = '#141a33'
const SUIT_DARK = '#0a0e1e'
const GLOVE = '#16131a'

function mask(uid: string, wink = false) {
  const metal = artId('jav-metal', uid)
  const eye = artId('jav-eye', uid)
  return `
  <defs>
    <linearGradient id="${metal}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ART.goldLight}"/>
      <stop offset="0.45" stop-color="${BRONZE}"/>
      <stop offset="1" stop-color="${BRONZE_DARK}"/>
    </linearGradient>
    <radialGradient id="${eye}">
      <stop offset="0" stop-color="#cfe0ff"/>
      <stop offset="0.5" stop-color="${ART.cobaltSoft}"/>
      <stop offset="1" stop-color="${ART.cobalt}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- crina -->
  <path d="M520 92 L536 50 L552 84 L566 36 L582 78 L600 28 L618 78 L634 36 L648 84 L664 50 L680 92 Z" fill="#1d1712"/>
  <!-- orelhas -->
  <path d="M520 112 L488 48 L548 86 Z" fill="url(#${metal})" stroke="${BRONZE_DARK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M680 112 L712 48 L652 86 Z" fill="url(#${metal})" stroke="${BRONZE_DARK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M512 92 L500 64 L532 86 Z" fill="${ART.red}" opacity="0.55"/>
  <path d="M688 92 L700 64 L668 86 Z" fill="${ART.red}" opacity="0.55"/>
  <!-- crânio da máscara -->
  <path d="M512 150 C506 98 548 74 600 74 C652 74 694 98 688 150 C684 184 664 204 646 214 L554 214 C536 204 516 184 512 150 Z" fill="url(#${metal})" stroke="${BRONZE_DARK}" stroke-width="3"/>
  <!-- gravura na testa -->
  <path d="M572 104 L600 120 L628 104 M582 92 L600 102 L618 92" fill="none" stroke="${BRONZE_DARK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- olhos -->
  <path d="M548 146 Q566 130 586 146 Q566 156 548 146 Z" fill="#0b0b12"/>
  ${
    wink
      ? `<path d="M614 148 Q632 140 652 146" fill="none" stroke="#0b0b12" stroke-width="5" stroke-linecap="round"/>`
      : `<path d="M614 146 Q634 130 652 146 Q634 156 614 146 Z" fill="#0b0b12"/>
         <circle cx="633" cy="145" r="12" fill="url(#${eye})"/><circle cx="633" cy="145" r="3" fill="#e8f0ff"/>`
  }
  <circle cx="567" cy="145" r="12" fill="url(#${eye})"/><circle cx="567" cy="145" r="3" fill="#e8f0ff"/>
  <path d="M542 132 L590 140 M658 132 L610 140" stroke="${BRONZE_DARK}" stroke-width="5" stroke-linecap="round"/>
  <!-- focinho -->
  <path d="M556 170 C556 160 644 160 644 170 L654 232 C654 252 546 252 546 232 Z" fill="url(#${metal})" stroke="${BRONZE_DARK}" stroke-width="3"/>
  <ellipse cx="600" cy="236" rx="40" ry="20" fill="${BRONZE_DARK}"/>
  <ellipse cx="600" cy="232" rx="36" ry="16" fill="#c49a58"/>
  <ellipse cx="586" cy="233" rx="7" ry="9" fill="#1d1712"/>
  <ellipse cx="614" cy="233" rx="7" ry="9" fill="#1d1712"/>
  <!-- presas de marfim -->
  <path d="M552 236 C534 232 524 214 528 192 C536 210 546 220 562 224 Z" fill="${ART.ivory}" stroke="${ART.ivoryShade}" stroke-width="2"/>
  <path d="M648 236 C666 232 676 214 672 192 C664 210 654 220 638 224 Z" fill="${ART.ivory}" stroke="${ART.ivoryShade}" stroke-width="2"/>
  <!-- queixo humano por baixo da máscara -->
  <path d="M566 248 C574 268 626 268 634 248 L626 262 C614 274 586 274 574 262 Z" fill="${ART.skinShade}"/>
`
}

function torso() {
  return `
  <!-- tronco: smoking azul-noite -->
  <path d="M452 500 C452 380 470 300 520 268 C552 252 576 248 600 248 C624 248 648 252 680 268 C730 300 748 380 748 500 Z" fill="${SUIT}"/>
  <path d="M600 262 L560 262 L582 380 L600 404 L618 380 L640 262 Z" fill="${ART.ivory}"/>
  <path d="M600 404 L600 500" stroke="${ART.ivoryShade}" stroke-width="2"/>
  <circle cx="600" cy="420" r="4" fill="${ART.night}"/><circle cx="600" cy="452" r="4" fill="${ART.night}"/>
  <!-- lapelas de cetim -->
  <path d="M556 260 L520 280 L566 420 L596 404 Z" fill="${SUIT_DARK}" stroke="#2a3360" stroke-width="2"/>
  <path d="M644 260 L680 280 L634 420 L604 404 Z" fill="${SUIT_DARK}" stroke="#2a3360" stroke-width="2"/>
  <!-- gravata-borboleta vermelha -->
  <path d="M600 272 L566 256 L566 290 Z" fill="${ART.red}"/>
  <path d="M600 272 L634 256 L634 290 Z" fill="${ART.red}"/>
  <rect x="592" y="264" width="16" height="16" rx="3" fill="#9e1219"/>
  <!-- lenço de bolso e corrente do relógio -->
  <path d="M664 318 L700 312 L694 330 L684 322 L676 334 Z" fill="${ART.gold}"/>
  <path d="M574 420 C590 440 612 440 628 420" fill="none" stroke="${ART.gold}" stroke-width="2.5"/>
`
}

/** Mão enluvada (preta) com anel de ouro. */
function glove(x: number, y: number, rot = 0, flip = false) {
  const s = flip ? -1 : 1
  return `
  <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s} 1)">
    <path d="M-26 -14 C-20 -30 22 -30 28 -12 L32 14 C24 26 -20 26 -28 12 Z" fill="${GLOVE}" stroke="#2a2630" stroke-width="2"/>
    <path d="M-10 -24 L-10 -6 M2 -26 L2 -6 M14 -24 L14 -6" stroke="#2a2630" stroke-width="2"/>
    <rect x="-1" y="-8" width="8" height="6" rx="2" fill="${ART.gold}"/>
  </g>`
}

function cardFan(x: number, y: number, rot = 0) {
  const card = (r: number, face: boolean) => `
    <g transform="rotate(${r})">
      <rect x="-22" y="-74" width="44" height="64" rx="4" fill="${face ? ART.ivory : ART.navy}" stroke="${face ? ART.ivoryShade : ART.gold}" stroke-width="2"/>
      ${
        face
          ? `<path d="M0 -58 L8 -46 L0 -34 L-8 -46 Z" fill="${ART.red}"/><text x="-16" y="-60" font-family="Georgia,serif" font-size="11" fill="${ART.ink}">A</text>`
          : `<rect x="-16" y="-68" width="32" height="52" rx="2" fill="none" stroke="${ART.gold}" stroke-opacity="0.6"/><path d="M0 -54 L6 -42 L0 -30 L-6 -42 Z" fill="${ART.gold}" opacity="0.7"/>`
      }
    </g>`
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${card(-22, false)}${card(-4, false)}${card(16, true)}</g>`
}

function arms(pose: JavaliPose) {
  const sleeve = (d: string) => `<path d="${d}" fill="${SUIT}" stroke="${SUIT_DARK}" stroke-width="3" stroke-linejoin="round"/>`
  const cuff = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${ART.ivory}" stroke-width="9" stroke-linecap="round"/>`
  // Braço esquerdo da figura (lado direito da tela) — na mesa em todas as poses, exceto `door`.
  const leftOnTable = `${sleeve('M690 276 C740 300 772 336 764 384 L704 394 C716 356 700 330 664 312 Z')}${cuff(704, 392, 760, 382)}${glove(728, 402, -6, true)}`
  if (pose === 'point') {
    return `
      ${leftOnTable}
      ${sleeve('M512 274 C470 260 420 220 372 168 L400 140 C440 180 486 214 540 232 Z')}
      ${cuff(380, 164, 398, 146)}
      <g transform="translate(362 142) rotate(-42)">
        <path d="M-22 -10 C-16 -24 16 -24 22 -8 L24 14 C16 24 -16 24 -22 12 Z" fill="${GLOVE}" stroke="#2a2630" stroke-width="2"/>
        <path d="M-4 -18 L-4 -62 C-4 -70 8 -70 8 -62 L8 -16 Z" fill="${GLOVE}" stroke="#2a2630" stroke-width="2"/>
        <rect x="-2" y="-12" width="8" height="6" rx="2" fill="${ART.gold}"/>
      </g>`
  }
  if (pose === 'door') {
    return `
      ${sleeve('M690 276 C730 300 752 352 746 420 L700 426 C704 372 694 334 664 312 Z')}${cuff(700, 424, 744, 420)}${glove(722, 440, 4, true)}
      ${sleeve('M512 274 C468 288 420 300 360 300 L356 330 C424 336 486 324 534 310 Z')}
      ${cuff(366, 300, 362, 330)}
      <g transform="translate(330 314) rotate(-90)">
        <path d="M-24 -12 C-18 -28 20 -28 26 -10 L28 16 C20 26 -18 26 -26 12 Z" fill="${GLOVE}" stroke="#2a2630" stroke-width="2"/>
        <path d="M-12 -24 L-18 -48 M0 -26 L0 -54 M12 -24 L18 -48" stroke="${GLOVE}" stroke-width="9" stroke-linecap="round"/>
      </g>`
  }
  return `
    ${leftOnTable}
    ${sleeve('M510 276 C460 300 428 336 436 384 L496 394 C484 356 500 330 536 312 Z')}
    ${cuff(442, 382, 496, 392)}
    ${cardFan(468, 392, -10)}
    ${glove(468, 402, 6)}`
}

function scene(pose: JavaliPose, uid: string) {
  const wall = artId('jav-wall', uid)
  const lamp = artId('jav-lamp', uid)
  const door = artId('jav-door', uid)
  const base = `
  <defs>
    <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1026"/>
      <stop offset="1" stop-color="${ART.night}"/>
    </linearGradient>
    <radialGradient id="${lamp}" cx="0.5" cy="0" r="0.8">
      <stop offset="0" stop-color="${ART.goldLight}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${ART.goldLight}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${door}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ART.cobalt}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#0a1a6e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" fill="url(#${wall})"/>
  <!-- painéis da parede com frisos dourados -->
  <g fill="none" stroke="${ART.goldDark}" stroke-opacity="0.55" stroke-width="2">
    <rect x="40" y="60" width="200" height="300"/><rect x="960" y="60" width="200" height="300"/>
    <rect x="60" y="80" width="160" height="260" stroke-opacity="0.3"/><rect x="980" y="80" width="160" height="260" stroke-opacity="0.3"/>
  </g>
  <ellipse cx="600" cy="0" rx="420" ry="330" fill="url(#${lamp})"/>
  <path d="M600 0 L600 20" stroke="${ART.gold}" stroke-width="3"/>`
  const doorArt =
    pose === 'door'
      ? `
  <path d="M230 470 L230 170 C230 100 270 70 330 70 C390 70 430 100 430 170 L430 470 Z" fill="#05060c" stroke="${ART.gold}" stroke-width="6"/>
  <path d="M248 470 L248 176 C248 116 282 90 330 90 C378 90 412 116 412 176 L412 470 Z" fill="url(#${door})" opacity="0.85"/>
  <path d="M330 90 L330 470" stroke="${ART.night}" stroke-width="4"/>
  <path d="M248 470 L412 470 L470 500 L190 500 Z" fill="${ART.cobalt}" opacity="0.18"/>
  <circle cx="346" cy="300" r="7" fill="${ART.gold}"/>`
      : ''
  return base + doorArt
}

function table(withFelt: boolean) {
  return `
  <!-- mesa: feltro cobalto escuro com borda dourada -->
  ${withFelt ? `<path d="M0 404 L1200 404 L1200 500 L0 500 Z" fill="#0b1a55"/>` : `<path d="M180 404 L1020 404 L1020 500 L180 500 Z" fill="#0b1a55"/>`}
  <path d="M${withFelt ? 0 : 180} 404 L${withFelt ? 1200 : 1020} 404" stroke="${ART.gold}" stroke-width="5"/>
  <path d="M${withFelt ? 0 : 180} 414 L${withFelt ? 1200 : 1020} 414" stroke="${ART.goldDark}" stroke-width="2"/>
  <g fill="${ART.night}" stroke="${ART.gold}" stroke-width="2">
    <ellipse cx="860" cy="436" rx="26" ry="9"/><ellipse cx="860" cy="428" rx="26" ry="9"/><ellipse cx="860" cy="420" rx="26" ry="9" fill="${ART.red}"/>
    <ellipse cx="910" cy="436" rx="26" ry="9"/><ellipse cx="910" cy="428" rx="26" ry="9" fill="${ART.cobalt}"/>
  </g>`
}

/**
 * Conteúdo interno do <svg viewBox="0 0 1200 500">.
 * `wink` fecha um olho (usado nas falas mais marotas).
 */
export function javaliMarkup(pose: JavaliPose, opts: { scene?: boolean; wink?: boolean; uid?: string } = {}) {
  const uid = opts.uid ?? 'j'
  const dx = pose === 'door' ? 140 : 0
  // Ordem das camadas: fundo → tronco e máscara → mesa → braços e mãos (apoiados sobre a mesa).
  const body = `<g transform="translate(${dx} 0)">${torso()}${mask(uid, opts.wink)}</g>`
  const front = pose === 'door' ? '' : table(!!opts.scene)
  const hands = `<g transform="translate(${dx} 0)">${arms(pose)}</g>`
  return `${opts.scene ? scene(pose, uid) : ''}${body}${front}${hands}`
}
