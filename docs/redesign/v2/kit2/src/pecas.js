// DEVO v2 — kit2: peças desenhadas em código (emblemas, molduras, mostrador, gemas, partículas).
// Tudo vetorial; as pinturas vêm de public/images (copiadas em img/).

const SIMBOLOS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
 <defs>
  <linearGradient id="g-metal" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stop-color="#fbf5ea"/><stop offset=".38" stop-color="#d9ccb3"/>
   <stop offset=".55" stop-color="#8e836e"/><stop offset=".74" stop-color="#d6c9ae"/><stop offset="1" stop-color="#f4ecdc"/>
  </linearGradient>
  <linearGradient id="g-prata" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d8d6e2"/><stop offset="1" stop-color="#9d9ab0"/>
  </linearGradient>
  <linearGradient id="g-ame" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stop-color="#efe9ff"/><stop offset=".35" stop-color="#a596e0"/><stop offset=".7" stop-color="#4b3f86"/><stop offset="1" stop-color="#231c46"/>
  </linearGradient>
  <radialGradient id="g-ceu" cx=".5" cy=".42" r=".62">
   <stop offset="0" stop-color="#3a2f6a"/><stop offset=".55" stop-color="#1b1633"/><stop offset="1" stop-color="#09080f"/>
  </radialGradient>
  <symbol id="estrela4" viewBox="0 0 48 48"><path d="M24 1 L27.2 20.8 L47 24 L27.2 27.2 L24 47 L20.8 27.2 L1 24 L20.8 20.8Z"/></symbol>

  <!-- Emblemas: silhueta clara, agulhas em losango, simetria. viewBox 48. -->
  <symbol id="e-record" viewBox="0 0 48 48">
   <path d="M3 24 C11 12 37 12 45 24 C37 36 11 36 3 24Z" fill="none" stroke="currentColor" stroke-width="2.2"/>
   <circle cx="24" cy="24" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6"/>
   <path d="M24 15.8 L25.6 22.4 L32.2 24 L25.6 25.6 L24 32.2 L22.4 25.6 L15.8 24 L22.4 22.4Z" fill="currentColor"/>
   <path d="M24 2 L25.4 8 L24 10.5 L22.6 8Z M24 46 L25.4 40 L24 37.5 L22.6 40Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-cartas" viewBox="0 0 48 48">
   <rect x="9" y="9" width="17" height="25" rx="1.5" transform="rotate(-18 17 21)" fill="none" stroke="currentColor" stroke-width="1.6"/>
   <rect x="22" y="9" width="17" height="25" rx="1.5" transform="rotate(18 30 21)" fill="none" stroke="currentColor" stroke-width="1.6"/>
   <rect x="15" y="10" width="18" height="27" rx="1.5" fill="currentColor"/>
   <path d="M24 15 L25.6 22 L31 23.5 L25.6 25 L24 32 L22.4 25 L17 23.5 L22.4 22Z" fill="#0d0c11"/>
   <path d="M24 41 L26 44 L24 47 L22 44Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-jogos" viewBox="0 0 48 48">
   <path d="M8 34 L6 15 L15 23 L24 9 L33 23 L42 15 L40 34Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
   <path d="M8 37 H40 V41 H8Z" fill="currentColor"/>
   <path d="M24 3 L26 7 L24 11 L22 7Z M6 10 L7.6 13 L6 16 L4.4 13Z M42 10 L43.6 13 L42 16 L40.4 13Z" fill="currentColor"/>
   <path d="M24 22 L25.5 27 L24 32 L22.5 27Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-mensagens" viewBox="0 0 48 48">
   <rect x="14" y="15" width="20" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>
   <path d="M14 16 L24 25 L34 16" fill="none" stroke="currentColor" stroke-width="1.6"/>
   <path d="M13 18 C7 16 3 12 1 7 C6 9 9 10 12 10 C8 12 9 16 13 18Z M35 18 C41 16 45 12 47 7 C42 9 39 10 36 10 C40 12 39 16 35 18Z" fill="currentColor"/>
   <path d="M24 33 L26.4 37 L24 41 L21.6 37Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-inventario" viewBox="0 0 48 48">
   <path d="M8 22 C8 12 40 12 40 22Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
   <rect x="8" y="22" width="32" height="17" fill="none" stroke="currentColor" stroke-width="1.8"/>
   <path d="M8 27 H40" stroke="currentColor" stroke-width="1.2"/>
   <path d="M24 23 L27 28 L24 33 L21 28Z" fill="currentColor"/>
   <path d="M24 3 L25.4 8 L24 10 L22.6 8Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-confidentes" viewBox="0 0 48 48">
   <path d="M24 42 C10 32 5 24 5 17 C5 10 10 6 15.5 6 C19.5 6 22.5 8.5 24 11.5 C25.5 8.5 28.5 6 32.5 6 C38 6 43 10 43 17 C43 24 38 32 24 42Z" fill="none" stroke="currentColor" stroke-width="2"/>
   <circle cx="24" cy="20" r="3.4" fill="currentColor"/><path d="M22.4 22 H25.6 L26.4 30 H21.6Z" fill="currentColor"/>
   <path d="M24 44 L25.6 46.5 L24 48 L22.4 46.5Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-casa" viewBox="0 0 48 48">
   <path d="M11 44 V20 C11 11 17 5 24 3 C31 5 37 11 37 20 V44" fill="none" stroke="currentColor" stroke-width="2"/>
   <path d="M16 44 V22 C16 16 19.5 12 24 10.5 C28.5 12 32 16 32 22 V44Z" fill="currentColor"/>
   <circle cx="28.4" cy="30" r="1.4" fill="#0d0c11"/>
   <path d="M24 14 L25.4 18 L24 22 L22.6 18Z" fill="#0d0c11"/>
   <path d="M6 44 H42" stroke="currentColor" stroke-width="2"/>
  </symbol>
  <symbol id="e-calendario" viewBox="0 0 48 48">
   <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/>
   <path d="M30 13 A12 12 0 1 0 30 35 A9.5 9.5 0 1 1 30 13Z" fill="currentColor"/>
   <path d="M24 1 L25.6 5 L24 8 L22.4 5Z M24 47 L25.6 43 L24 40 L22.4 43Z M1 24 L5 22.4 L8 24 L5 25.6Z M47 24 L43 22.4 L40 24 L43 25.6Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-ajustes" viewBox="0 0 48 48">
   <path d="M24 2 L27 21 L46 24 L27 27 L24 46 L21 27 L2 24 L21 21Z" fill="currentColor"/>
   <path d="M24 10 L32 16 L38 24 L32 32 L24 38 L16 32 L10 24 L16 16Z" fill="none" stroke="currentColor" stroke-width="1.3" transform="rotate(22.5 24 24)"/>
   <circle cx="24" cy="24" r="3" fill="#0d0c11"/>
  </symbol>
  <symbol id="e-avisos" viewBox="0 0 48 48">
   <path d="M24 2 V7" stroke="currentColor" stroke-width="1.6"/><circle cx="24" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/>
   <path d="M15 17 L24 11 L33 17Z" fill="currentColor"/>
   <path d="M16 17 H32 L30 37 H18Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
   <path d="M24 21 C27 25 27 29 24 32 C21 29 21 25 24 21Z" fill="currentColor"/>
   <path d="M17 37 H31 L28 42 H20Z" fill="currentColor"/>
  </symbol>
  <symbol id="e-torre" viewBox="0 0 48 48">
   <path d="M24 1 L29 16 H19Z" fill="currentColor"/>
   <path d="M18 16 H30 L32 44 H16Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
   <path d="M21.5 26 C21.5 22 26.5 22 26.5 26 V31 H21.5Z" fill="currentColor"/>
   <path d="M12 44 H36" stroke="currentColor" stroke-width="2"/>
  </symbol>
  <symbol id="e-espadas" viewBox="0 0 48 48">
   <path d="M8 6 L36 38 M40 6 L12 38" stroke="currentColor" stroke-width="2.4"/>
   <path d="M30 36 L38 32 M18 36 L10 32" stroke="currentColor" stroke-width="2"/>
   <path d="M24 14 L26 22 L34 24 L26 26 L24 34 L22 26 L14 24 L22 22Z" fill="currentColor"/>
  </symbol>
  <symbol id="avatar-costas" viewBox="0 0 130 260"><defs><linearGradient id="av-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0b12"/><stop offset=".7" stop-color="#1b1622"/><stop offset="1" stop-color="#3a2a26"/></linearGradient></defs>
   <path d="M65 14 C52 14 46 24 46 36 C46 46 48 54 44 66 C52 70 58 64 58 60 L58 66 C44 68 30 72 24 80 C20 86 18 96 18 110 L14 170 C13 176 20 178 22 172 L30 118 L36 150 L30 232 L44 258 H86 L100 232 L94 150 L100 118 L108 172 C110 178 117 176 116 170 L112 110 C112 96 110 86 106 80 C100 72 86 68 72 66 L72 60 C72 64 78 70 86 66 C82 54 84 46 84 36 C84 24 78 14 65 14Z" fill="url(#av-g)"/>
   <path d="M58 66 L65 92 L72 66" fill="none" stroke="#2c2433" stroke-width="2"/><path d="M65 92 V232" stroke="#241d2b" stroke-width="1.5"/>
   <path d="M84 36 C84 46 82 54 86 66 M106 80 C110 86 112 96 112 110 L116 170" fill="none" stroke="rgba(255,200,150,.55)" stroke-width="1.4"/></symbol>
  <symbol id="e-voltar" viewBox="0 0 24 24"><path d="M15 4 L7 12 L15 20" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
 </defs>
</svg>`;

function svgEmblema(id, cls = '', estilo = '') {
  return `<svg class="${cls}" style="${estilo}" viewBox="0 0 48 48"><use href="#${id}"/></svg>`;
}

// Moldura relicário: filete duplo com cantos cortados, estrelas nos cantos e remate no topo.
function moldura(w, h, o = {}) {
  const c = o.corte ?? 12, d = o.dentro ?? 5, cor = o.cor ?? 'url(#g-metal)', ame = o.joia ?? true;
  const p = (k) => `M${c + k} ${k} H${w - c - k} L${w - k} ${c + k} V${h - c - k} L${w - c - k} ${h - k} H${c + k} L${k} ${h - c - k} V${c + k}Z`;
  const est = (x, y, s) => `<use href="#estrela4" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="#efe6d2"/>`;
  let crista = '';
  if (o.crista !== false) {
    const cx = o.cristaX ?? w / 2;
    crista = `<path d="M${cx - 34} .5 H${cx - 10} L${cx} -8 L${cx + 10} .5 H${cx + 34}" fill="none" stroke="${cor}" stroke-width="1.2"/>
      <path d="M${cx} -15 L${cx + 6} -6 L${cx} 3 L${cx - 6} -6Z" fill="url(#g-ame)" stroke="#efe6d2" stroke-width=".8"/>`;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
    <path d="${p(.5)}" fill="none" stroke="${cor}" stroke-width="1.2"/>
    <path d="${p(d)}" fill="none" stroke="rgba(201,189,166,.32)" stroke-width="1"/>
    ${est(c * .55, c * .55, 9)}${est(w - c * .55, c * .55, 9)}${est(c * .55, h - c * .55, 9)}${est(w - c * .55, h - c * .55, 9)}
    ${ame ? crista : ''}
  </svg>`;
}

// Mostrador de relógio pequeno (pílula do Tempo)
function mostradorMini() {
  let t = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30 * Math.PI / 180, r1 = i % 3 ? 11.5 : 10, r2 = 13;
    t += `<line x1="${15 + r1 * Math.sin(a)}" y1="${15 - r1 * Math.cos(a)}" x2="${15 + r2 * Math.sin(a)}" y2="${15 - r2 * Math.cos(a)}" stroke="#d9ccb3" stroke-width="${i % 3 ? .7 : 1.4}"/>`;
  }
  return `<svg class="mostrador" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14.2" fill="url(#g-ceu)" stroke="url(#g-metal)" stroke-width="1.4"/>${t}
    <line x1="15" y1="15" x2="15" y2="6.5" stroke="#f2e9d8" stroke-width="1.4" stroke-linecap="round" transform="rotate(-62 15 15)"/>
    <line x1="15" y1="15" x2="15" y2="9" stroke="#8a7cc8" stroke-width="1.8" stroke-linecap="round" transform="rotate(118 15 15)"/>
    <circle cx="15" cy="15" r="1.8" fill="#d3caf5"/></svg>`;
}

function pulso(h = '71', m = '42', s = '09') {
  return `<div class="pulso">${mostradorMini()}<div><span class="rot">TEMPO</span><span class="dig metal-txt">${h}<small>:</small>${m}<small>:</small>${s}</span></div></div>`;
}

// Gema facetada (nós de andar, raridade)
function gema(tam, tipo = 'ame') {
  const cores = {
    ame: ['#f1ecff', '#a99be6', '#5a4c9e', '#241d4a'],
    apagada: ['#8a8792', '#55525e', '#2e2c35', '#16151b'],
    feita: ['#fff9ec', '#e3d6b9', '#9a8d74', '#4b4438'],
  }[tipo];
  return `<svg width="${tam}" height="${tam * 1.3}" viewBox="0 0 40 52" style="overflow:visible">
    <path d="M20 0 L40 20 L20 52 L0 20Z" fill="${cores[2]}"/>
    <path d="M20 0 L30 20 L20 52 L10 20Z" fill="${cores[1]}"/>
    <path d="M20 0 L40 20 H0Z" fill="${cores[0]}" opacity=".85"/>
    <path d="M20 0 L30 20 H10Z" fill="#fff" opacity=".55"/>
    <path d="M0 20 L20 52 L10 20Z" fill="${cores[3]}" opacity=".7"/>
    <path d="M20 0 L40 20 L20 52 L0 20Z" fill="none" stroke="url(#g-metal)" stroke-width="1.6"/>
  </svg>`;
}

// Poeira de luz: n pontos determinísticos numa caixa
function poeira(el, n, caixa, semente = 7, cor) {
  let s = semente;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let html = '';
  for (let i = 0; i < n; i++) {
    const t = r() * 2.6 + .6, a = r() * .7 + .15;
    html += `<i style="left:${caixa[0] + r() * caixa[2]}px;top:${caixa[1] + r() * caixa[3]}px;width:${t}px;height:${t}px;opacity:${a};${cor ? 'background:' + cor + ';' : ''}${t > 2.4 ? 'box-shadow:0 0 6px ' + (cor || '#f2e9d8') + ';' : ''}"></i>`;
  }
  el.insertAdjacentHTML('beforeend', html);
}

function vinculo(n, on, cls = '') {
  let b = '';
  for (let i = 0; i < n; i++) b += `<b class="${i < on ? 'on' : ''}"></b>`;
  return `<div class="vinculo ${cls}">${b}</div>`;
}

// Recorte de rosto (medalhão) a partir de npc-rostos.json: [cx, cy, janela]
const ROSTOS = {
  'galo-confiante': [544, 298, 560], 'galo-sorriso': [534, 373, 560], 'galo-malicia': [517, 329, 560], 'galo-piscadela': [552, 296, 560], 'galo-riso': [560, 339, 560],
  'coruja-sorriso': [511, 328, 560], 'javali-riso': [599, 388, 470], 'melissa-apresenta': [473, 331, 560], 'melissa-sorriso': [505, 335, 560],
  'herdeiro-neutro': [545, 330, 560], 'rato-apresenta': [637, 407, 560], 'rato-sorriso': [415, 380, 560],
};
function rosto(id, d, zoom = 1) {
  const [cx, cy, j] = ROSTOS[id];
  const s = d / (j / zoom);
  return `background:url(img/npc/${id}.webp) no-repeat;background-size:${1080 * s}px ${960 * s}px;background-position:${-(cx * s - d / 2)}px ${-(cy * s - d / 2)}px;`;
}

function barraAparelho(hora = '21:47') {
  return `<div class="aparelho"><b>${hora}</b><span style="display:flex;align-items:center"><span class="sinal"><s style="height:4px"></s><s style="height:6px"></s><s style="height:8px"></s><s style="height:10px"></s></span><i></i></span></div>`;
}

document.body.insertAdjacentHTML('afterbegin', SIMBOLOS);
