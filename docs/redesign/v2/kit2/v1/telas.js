// kit2 · montagem das telas (peças repetitivas geradas aqui)
const $ = (s) => document.querySelector(s);

/* ---------- escolha de tela (?tela=id) ---------- */
const pedida = new URLSearchParams(location.search).get('tela');
if (pedida) { document.body.classList.add('so'); const f = $('#f-' + pedida); if (f) f.classList.add('ativa'); }

/* ---------- comuns ---------- */
document.querySelectorAll('.tela').forEach((t) => t.insertAdjacentHTML('afterbegin', barraAparelho()));
function encaixa(sel, w, h, o) { const el = $(sel); if (el) el.innerHTML = moldura(w, h, o); }

function engrenagem(r, dentes, cor, furo = .32) {
  let d = '';
  for (let i = 0; i < dentes; i++) {
    const a0 = (i / dentes) * Math.PI * 2, a1 = a0 + Math.PI / dentes * .5, a2 = a0 + Math.PI / dentes, a3 = a0 + Math.PI / dentes * 1.5;
    const p = (a, rr) => `${(r + rr * Math.cos(a)).toFixed(1)} ${(r + rr * Math.sin(a)).toFixed(1)}`;
    d += (i ? 'L' : 'M') + p(a0, r * .84) + 'L' + p(a1, r) + 'L' + p(a2, r) + 'L' + p(a3, r * .84);
  }
  let raios = '';
  for (let i = 0; i < 6; i++) { const a = i * 60 * Math.PI / 180; raios += `<line x1="${r}" y1="${r}" x2="${r + r * .7 * Math.cos(a)}" y2="${r + r * .7 * Math.sin(a)}" stroke="${cor}" stroke-width="${r * .07}"/>`; }
  return `<svg width="${r * 2}" height="${r * 2}" viewBox="0 0 ${r * 2} ${r * 2}"><path d="${d}Z" fill="none" stroke="${cor}" stroke-width="${r * .05}"/>
    <circle cx="${r}" cy="${r}" r="${r * .72}" fill="none" stroke="${cor}" stroke-width="${r * .04}"/>${raios}<circle cx="${r}" cy="${r}" r="${r * furo * .5}" fill="${cor}"/></svg>`;
}

/* ======================= a) HOME ======================= */
(function home() {
  // vitrais góticos atrás do relógio
  const v = $('.home-vitrais');
  const arco = (x, y, w, h) => `M${x} ${y + h} V${y + w * .55} Q${x} ${y} ${x + w / 2} ${y - w * .1} Q${x + w} ${y} ${x + w} ${y + w * .55} V${y + h}Z`;
  let s = `<defs><linearGradient id="vidro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5fb0" stop-opacity=".55"/><stop offset=".6" stop-color="#2b2350" stop-opacity=".35"/><stop offset="1" stop-color="#0a090d" stop-opacity="0"/></linearGradient></defs>`;
  [[118, 120, 154, 560, 1], [22, 210, 78, 420, .55], [290, 210, 78, 420, .55]].forEach(([x, y, w, h, o]) => {
    s += `<g opacity="${o}"><path d="${arco(x, y, w, h)}" fill="url(#vidro)" stroke="rgba(201,189,166,.35)" stroke-width="1.4"/>`;
    for (let k = 1; k < 4; k++) s += `<line x1="${x + w * k / 4}" y1="${y + w * .3}" x2="${x + w * k / 4}" y2="${y + h}" stroke="rgba(10,9,13,.55)" stroke-width="1.5"/>`;
    for (let k = 1; k < 9; k++) s += `<line x1="${x}" y1="${y + w * .5 + k * h / 9}" x2="${x + w}" y2="${y + w * .5 + k * h / 9}" stroke="rgba(10,9,13,.45)" stroke-width="1"/>`;
    s += `<circle cx="${x + w / 2}" cy="${y + w * .42}" r="${w * .26}" fill="none" stroke="rgba(201,189,166,.4)" stroke-width="1.2"/>`;
    s += `<use href="#estrela4" x="${x + w / 2 - w * .16}" y="${y + w * .42 - w * .16}" width="${w * .32}" height="${w * .32}" fill="rgba(211,202,245,.5)"/></g>`;
  });
  v.innerHTML = s;

  // relógio 3D em camadas
  const rig = $('#rig');
  const camada = (html, tam, z, extra = '') => `<div style="width:${tam}px;height:${tam}px;margin:${-tam / 2}px 0 0 ${-tam / 2}px;transform:translateZ(${z}px);${extra}">${html}</div>`;
  let h = '';
  h += camada(engrenagem(92, 22, 'rgba(201,189,166,.55)'), 184, -90, 'left:22%;top:26%;border-radius:0');
  h += camada(engrenagem(64, 16, 'rgba(138,124,200,.55)'), 128, -70, 'left:82%;top:70%;border-radius:0');
  h += camada(engrenagem(44, 12, 'rgba(201,189,166,.45)'), 88, -110, 'left:84%;top:18%;border-radius:0');
  // espessura (aro em lâminas)
  for (let z = -26; z <= -8; z += 3) h += camada('', 300, z, `background:${z === -26 ? '#2a2620' : '#4f483d'};box-shadow:inset 0 0 0 2px #8d8373;`);
  // aro metálico
  let numerais = '';
  const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * Math.PI / 180, g = i % 5 === 0;
    numerais += `<line x1="${150 + 128 * Math.sin(a)}" y1="${150 - 128 * Math.cos(a)}" x2="${150 + (g ? 117 : 123) * Math.sin(a)}" y2="${150 - (g ? 117 : 123) * Math.cos(a)}" stroke="${g ? '#f2e9d8' : 'rgba(242,233,216,.55)'}" stroke-width="${g ? 2 : .8}"/>`;
  }
  rom.forEach((n, i) => {
    const a = i * 30 * Math.PI / 180;
    numerais += `<text x="${150 + 100 * Math.sin(a)}" y="${150 - 100 * Math.cos(a) + 6}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${i % 3 ? 14 : 18}" fill="url(#g-metal)" transform="rotate(${i * 30} ${150 + 100 * Math.sin(a)} ${150 - 100 * Math.cos(a)})">${n}</text>`;
  });
  const mostrador = `<svg width="300" height="300" viewBox="0 0 300 300">
    <defs><clipPath id="cf"><circle cx="150" cy="150" r="134"/></clipPath>
      <radialGradient id="aro" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#2a2620"/><stop offset=".9" stop-color="#f2e9d8"/><stop offset=".93" stop-color="#8d8373"/><stop offset=".97" stop-color="#e7dcc6"/><stop offset="1" stop-color="#4f483d"/></radialGradient></defs>
    <circle cx="150" cy="150" r="150" fill="url(#aro)"/>
    <image href="img/torres/ceu-noite.webp" x="0" y="-60" width="300" height="420" clip-path="url(#cf)" preserveAspectRatio="xMidYMid slice" opacity=".95"/>
    <circle cx="150" cy="150" r="134" fill="url(#g-ceu)" opacity=".55"/>
    <circle cx="150" cy="150" r="134" fill="none" stroke="rgba(211,202,245,.35)" stroke-width="1"/>
    ${numerais}</svg>`;
  h += camada(mostrador, 300, -4, 'box-shadow:0 30px 60px rgba(0,0,0,.6), 0 0 80px rgba(138,124,200,.35)');
  // anel interno de losangos (72 h)
  let anel = `<svg width="190" height="190" viewBox="0 0 190 190"><circle cx="95" cy="95" r="88" fill="none" stroke="rgba(201,189,166,.6)" stroke-width="1"/><circle cx="95" cy="95" r="70" fill="none" stroke="rgba(211,202,245,.35)" stroke-width="1" stroke-dasharray="2 4"/>`;
  for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180; anel += `<rect x="${95 + 79 * Math.sin(a) - 2.5}" y="${95 - 79 * Math.cos(a) - 2.5}" width="5" height="5" fill="${i % 6 ? 'rgba(211,202,245,.55)' : '#f2e9d8'}" transform="rotate(${45 + i * 15} ${95 + 79 * Math.sin(a)} ${95 - 79 * Math.cos(a)})"/>`; }
  anel += `<text x="95" y="128" text-anchor="middle" font-family="IBM Plex Mono" font-size="7" letter-spacing="3" fill="rgba(211,202,245,.8)">72 · H</text></svg>`;
  h += camada(anel, 190, 14);
  // sub-mostrador
  h += camada(`<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="rgba(10,9,13,.7)" stroke="url(#g-metal)" stroke-width="1.6"/><path d="M30 30 L30 8" stroke="#8a7cc8" stroke-width="2" transform="rotate(210 30 30)"/><circle cx="30" cy="30" r="3" fill="#f2e9d8"/></svg>`, 60, 20, 'left:50%;top:68%');
  // ponteiros
  h += camada(`<svg width="300" height="300" viewBox="0 0 300 300">
    <g transform="rotate(-48 150 150)"><path d="M150 150 L144 120 L150 58 L156 120Z" fill="url(#g-metal)" stroke="#2a2620" stroke-width=".6"/><path d="M150 62 L156 52 L150 40 L144 52Z" fill="url(#g-ame)"/></g>
    <g transform="rotate(118 150 150)"><path d="M150 168 L146 130 L150 30 L154 130Z" fill="url(#g-metal)" stroke="#2a2620" stroke-width=".6"/></g>
    <g transform="rotate(200 150 150)"><line x1="150" y1="175" x2="150" y2="34" stroke="#d3caf5" stroke-width="1.2"/></g>
    <circle cx="150" cy="150" r="9" fill="url(#g-metal)"/><circle cx="150" cy="150" r="4.5" fill="url(#g-ame)"/></svg>`, 300, 34);
  // vidro
  h += camada('', 268, 50, 'background:radial-gradient(60% 40% at 34% 24%, rgba(255,255,255,.22), transparent 70%), radial-gradient(closest-side, transparent 80%, rgba(211,202,245,.12));');
  rig.innerHTML = h;

  // órbita (metade de trás atrás do relógio, metade da frente na frente)
  const cx = 195, cy = 318, rx = 162, ry = 58, tilt = -10 * Math.PI / 180;
  const ponto = (t) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
  const arcoOrb = (t0, t1) => { let d = ''; for (let k = 0; k <= 60; k++) { const [x, y] = ponto(t0 + (t1 - t0) * k / 60); d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return d; };
  const svgOrb = (d, op) => `<svg width="390" height="844" style="position:absolute;inset:0"><path d="${d}" fill="none" stroke="url(#g-metal)" stroke-width="1.4" opacity="${op}"/><path d="${d}" fill="none" stroke="rgba(211,202,245,.5)" stroke-width="5" opacity="${op * .25}"/></svg>`;
  $('#orb-tras').innerHTML = svgOrb(arcoOrb(Math.PI, Math.PI * 2), .5);
  $('#orb-frente').innerHTML = svgOrb(arcoOrb(0, Math.PI), 1);
  const apps = [
    { id: 'e-mensagens', nome: 'Mensagens', t: 194, tam: 52, tras: true, marca: true },
    { id: 'e-jogos', nome: 'Sala de Jogos', t: 344, tam: 52, tras: true },
    { id: 'e-record', nome: 'Record', t: 128, tam: 66 },
    { id: 'e-cartas', nome: 'Cartas', t: 56, tam: 66 },
  ];
  apps.forEach((a) => {
    const [x, y] = ponto(a.t * Math.PI / 180);
    const el = `<div class="no-app ${a.tras ? 'tras' : ''}" style="left:${x - 43}px;top:${y - a.tam / 2}px;width:86px">
      <div class="disco" style="width:${a.tam}px;height:${a.tam}px">${a.marca ? '<i class="marca"></i>' : ''}<svg style="width:${a.tam * .52}px;height:${a.tam * .52}px"><use href="#${a.id}"/></svg></div><span>${a.nome}</span></div>`;
    (a.tras ? $('#orb-tras') : $('#orb-frente')).insertAdjacentHTML('beforeend', el);
  });
  encaixa('#conv-fil', 362, 92, { crista: false, corte: 12 });
  poeira($('#home-poeira'), 70, [20, 120, 350, 420], 11);
  poeira($('#home-poeira'), 18, [40, 520, 310, 160], 5, '#d3caf5');
})();

/* ======================= b) CASA ======================= */
(function casa() {
  $('#casa-pulso').innerHTML = pulso('71', '42', '09');
  encaixa('#vn-fil', 370, 154, { corte: 14, cristaX: 205 });
  $('#vn-vinc').innerHTML = vinculo(6, 2);
  // janela em arco gótico de onde o retrato sai
  $('#vn-janela').innerHTML = `<svg width="170" height="260" viewBox="0 0 170 260" style="overflow:visible">
    <path d="M4 260 V100 Q4 24 85 4 Q166 24 166 100 V260" fill="rgba(10,9,13,.35)" stroke="url(#g-metal)" stroke-width="1.6"/>
    <path d="M12 260 V102 Q12 34 85 14 Q158 34 158 102 V260" fill="none" stroke="rgba(201,189,166,.35)" stroke-width="1"/>
    <use href="#estrela4" x="75" y="-6" width="20" height="20" fill="#f2e9d8"/></svg>`;
  poeira($('#casa-poeira'), 60, [150, 160, 200, 380], 3, '#ffd7a8');
})();

/* ======================= c) CUT-IN ======================= */
(function cutin() {
  const rasgo = (seed, amp) => {
    let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const top = [], bot = [];
    for (let x = 0; x <= 100; x += 2.5) { top.push(`${x}% ${(r() * amp).toFixed(1)}px`); bot.unshift(`${x}% calc(100% - ${(r() * amp).toFixed(1)}px)`); }
    return `polygon(${top.join(',')},${bot.join(',')})`;
  };
  const t = $('#cutin');
  t.style.setProperty('--rasgo', rasgo(3, 18));
  t.style.setProperty('--rasgo2', rasgo(9, 26));
  $('.cut-rosto').setAttribute('style', rosto('galo-malicia', 400, 1.45) + 'width:400px;height:400px;left:150px;top:-57px');
  $('#cut-eco').textContent = 'ANFITRIÃO · IV · O IMPERADOR · '.repeat(8);
  const est = [[300, 120, 46, 70, 20], [36, 560, 30, 44, -30], [330, 590, 22, 34, 40], [250, 250, 16, 22, 10], [70, 170, 18, 26, -60], [352, 470, 14, 20, 0]];
  $('#cut-est').innerHTML = est.map(([x, y, w, h, r]) => `<i style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${r}deg);clip-path:polygon(50% 0,100% 70%,20% 100%)"></i>`).join('');
  poeira($('#cut-poeira'), 40, [0, 140, 390, 560], 21, '#f2a15e');
})();

/* ======================= d) CONFIDENTES ======================= */
(function conf() {
  encaixa('#tarot-fil', 150, 230, { corte: 8, crista: false, dentro: 4 });
  $('#b-afin').innerHTML = vinculo(8, 5);
  $('#b-rom').innerHTML = vinculo(8, 2, 'romance');
  const lista = [
    { n: 'A Coruja', r: 'coruja-sorriso', c: 'var(--coruja)', a: 3, p: false },
    { n: 'O Javali', r: 'javali-riso', c: 'var(--javali)', a: 2, p: false },
    { n: 'Melissa', r: 'melissa-sorriso', c: 'var(--melissa)', a: 4, p: true },
    { n: 'O Herdeiro', r: 'herdeiro-neutro', c: 'var(--herdeiro-hi)', a: 1, p: false },
    { n: 'O Rato', r: 'rato-sorriso', c: 'var(--rato)', a: 2, p: false },
    { n: '? ? ?', r: null, c: 'var(--corvo)', a: 0, p: false, oculto: true },
  ];
  $('#conf-lista').innerHTML = lista.map((x) => `<li class="conf-it ${x.oculto ? 'oculto' : ''}" style="--cor:${x.c}">
    <div class="med" style="${x.r ? rosto(x.r, 44, 1.12) : 'background:radial-gradient(circle at 50% 40%, #0e2328, #050407)'}">${x.oculto ? '<svg viewBox="0 0 48 48" style="width:44px;height:44px;color:#1c4e58"><path d="M24 6 C14 10 12 22 12 30 L8 44 H40 L36 30 C36 22 34 10 24 6Z" fill="currentColor"/></svg>' : ''}</div>
    <div><h4>${x.n}</h4><div class="sub"><span class="arc">ARCANO ?</span>${x.oculto ? '<span class="arc">AINDA NÃO VISITOU</span>' : ''}</div></div>
    <div class="direita">${x.oculto ? '' : `<svg viewBox="0 0 48 48" style="${x.p ? 'color:var(--paixao-hi);filter:drop-shadow(0 0 5px var(--paixao))' : ''}"><use href="#e-confidentes"/></svg>`}${x.oculto ? '' : vinculo(5, x.a)}</div></li>`).join('');
  poeira($('#conf-poeira'), 40, [100, 90, 290, 330], 13);
})();

/* ======================= e) TORRE ======================= */
// Escada em espiral projetada à mão (2.5D): lajes de mármore ordenadas por profundidade, coluna, corrimão, nós de andar.
(function torre() {
  const W = 390, CX = 195, CY = 400, F = 640, D = 860, YC = 400, BETA = 24 * Math.PI / 180;
  const RIN = 26, ROUT = 122, RISE = 15.5, N = 52, DPHI = 360 / 14, BASE = -100, T = 9;
  const rad = (g) => g * Math.PI / 180;
  const P = (r, phi, y) => { const X = r * Math.cos(rad(phi)), Z0 = r * Math.sin(rad(phi)), y0 = y - YC; const Y = y0 * Math.cos(BETA) - Z0 * Math.sin(BETA), Z = y0 * Math.sin(BETA) + Z0 * Math.cos(BETA); const k = F / (D - Z); return [CX + X * k, CY - Y * k, Z]; };
  const poly = (pts) => pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const andarDe = (i) => (i - 3) % 7 === 0 ? (i - 3) / 7 : -1;
  const slabs = [];
  for (let i = 0; i < N; i++) {
    const fl = andarDe(i), larga = fl >= 0;
    const p0 = BASE + i * DPHI, p1 = p0 + DPHI * (larga ? 1.55 : .9), y = i * RISE;
    const arc = (r, yy) => { const a = []; for (let k = 0; k <= 4; k++) a.push(P(r, p0 + (p1 - p0) * k / 4, yy)); return a; };
    const topOut = arc(ROUT, y), topIn = arc(RIN, y), botOut = arc(ROUT, y - T), botIn = arc(RIN, y - T);
    const zc = P(ROUT * .6, (p0 + p1) / 2, y)[2];
    const acima = false; // câmera de cima: só os tampos aparecem
    const nevoa = Math.max(0, Math.min(.9, (y - 600) / 260));
    const luz = .62 + .38 * Math.max(0, Math.sin(rad((p0 + p1) / 2)));
    let g = '';
    if (acima) g += `<polygon points="${poly([...botIn, ...botOut.slice().reverse()])}" fill="#2b2733"/>`;
    g += `<polygon points="${poly([...botOut, ...topOut.slice().reverse()])}" fill="url(#t-borda)"/>`;
    // faces radiais
    g += `<polygon points="${poly([topIn[0], topOut[0], botOut[0], botIn[0]])}" fill="#6b6357"/>`;
    g += `<polygon points="${poly([topIn[4], topOut[4], botOut[4], botIn[4]])}" fill="#4f483d"/>`;
    if (!acima) {
      g += `<polygon points="${poly([...topIn, ...topOut.slice().reverse()])}" fill="url(#t-marmore)"/>`;
      g += `<polygon points="${poly([...topIn, ...topOut.slice().reverse()])}" fill="#0a090d" opacity="${(1 - luz).toFixed(2)}"/>`;
      g += `<polyline points="${poly(topOut)}" fill="none" stroke="#f2e9d8" stroke-width=".9" opacity=".8"/>`;
      if (larga) { const c = P((RIN + ROUT) / 2 + 10, (p0 + p1) / 2, y); g += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${16 * F / (D - c[2])}" ry="${4.5 * F / (D - c[2])}" fill="none" stroke="${fl === 3 ? '#d3caf5' : 'rgba(201,189,166,.7)'}" stroke-width="1.2"/>`; }
    }
    // balaústre e corrimão
    const b0 = P(ROUT - 5, (p0 + p1) / 2, y), b1 = P(ROUT - 5, (p0 + p1) / 2, y + 58);
    g += `<line x1="${b0[0]}" y1="${b0[1]}" x2="${b1[0]}" y2="${b1[1]}" stroke="url(#t-metal)" stroke-width="${1.6 * F / (D - b0[2])}"/>`;
    const r0 = P(ROUT - 5, p0, y + 58), rm = P(ROUT - 5, (p0 + p1) / 2, y + 58 + RISE * .25), r1 = P(ROUT - 5, p0 + DPHI, y + 58 + RISE);
    g += `<polyline points="${poly([r0, rm, r1])}" fill="none" stroke="url(#t-metal)" stroke-width="${2.4 * F / (D - b0[2])}" stroke-linecap="round"/>`;
    if (nevoa > 0) g = `<g opacity="${(1 - nevoa).toFixed(2)}">${g}</g>`;
    slabs.push({ z: zc, g, i });
  }
  slabs.sort((a, b) => a.z - b.z);
  const atrasDaColuna = (sl) => { const ph = BASE + sl.i * DPHI + DPHI / 2; return Math.sin(rad(ph)) < 0; };
  const tras = slabs.filter(atrasDaColuna).map((s) => s.g).join('');
  const frente = slabs.filter((s) => !atrasDaColuna(s)).map((s) => s.g).join('');
  // coluna
  const ct = P(0, 90, 980), cb = P(0, 90, -80), cw = RIN * F / D;
  const coluna = `<rect x="${CX - cw}" y="${ct[1]}" width="${cw * 2}" height="${cb[1] - ct[1]}" fill="url(#t-coluna)"/>
    <rect x="${CX - cw}" y="${ct[1]}" width="${cw * 2}" height="${cb[1] - ct[1]}" fill="url(#t-colmar)" opacity=".35"/>`;
  const defs = `<defs>
    <pattern id="t-marmore" patternUnits="userSpaceOnUse" width="140" height="140"><image href="img/torres/marmore.webp" width="140" height="140"/></pattern>
    <pattern id="t-colmar" patternUnits="userSpaceOnUse" width="90" height="90"><image href="img/torres/pedra-branca.webp" width="90" height="90"/></pattern>
    <linearGradient id="t-borda" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7dcc6"/><stop offset=".4" stop-color="#8d8373"/><stop offset="1" stop-color="#3b362f"/></linearGradient>
    <linearGradient id="t-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#857a68"/><stop offset=".5" stop-color="#f2e9d8"/><stop offset="1" stop-color="#857a68"/></linearGradient>
    <linearGradient id="t-coluna" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121016"/><stop offset=".35" stop-color="#6e685f"/><stop offset=".55" stop-color="#a39c90"/><stop offset="1" stop-color="#1a171f"/></linearGradient>
  </defs>`;
  $('.escada3d').innerHTML = `<svg width="${W}" height="844" viewBox="0 0 ${W} 844">${defs}${tras}${coluna}${frente}</svg>`;

  // nós de andar (HTML por cima, ancorados na projeção)
  const andares = [
    { r: 'I', s: 'CONCLUÍDO', tipo: 'feita' }, { r: 'II', s: 'CONCLUÍDO', tipo: 'feita' },
    { r: 'III', s: 'AQUI', tipo: 'feita', aqui: true }, { r: 'IV', s: 'PRÓXIMO', tipo: 'ame', atual: true },
    { r: 'V', s: 'TRANCADO', tipo: 'apagada' }, { r: 'VI', s: 'TRANCADO', tipo: 'apagada' }, { r: 'VII', s: '? ? ?', tipo: 'apagada' },
  ];
  let nos = '';
  andares.forEach((a, k) => {
    if (k === 0) return; // o Andar I fica atrás da ficha
    const i = 3 + 7 * k, p0 = BASE + i * DPHI, pm = p0 + DPHI * .78, y = i * RISE;
    const [x, sy, z] = P(ROUT + 12, pm, y + 8);
    const esq = x < CX;
    const fog = Math.max(0, Math.min(.8, (y - 640) / 260));
    nos += `<div class="no-andar ${a.atual ? 'atual' : ''} ${a.tipo === 'apagada' ? 'fechado' : ''}" style="left:${x}px;top:${sy}px;opacity:${(1 - fog).toFixed(2)};${esq ? 'flex-direction:row-reverse;transform:translate(calc(-100% + 14px),-50%)' : 'transform:translate(-14px,-50%)'}">
      <div class="g">${gema(a.atual ? 28 : 20, a.tipo)}</div><div class="rot"><span>ANDAR</span><b>${a.r}</b><span>${a.s}</span></div></div>`;
    if (a.aqui) {
      const [ax, ay, az] = P(78, p0 + DPHI * .7, y); const k2 = F / (D - az);
      nos += `<svg class="avatar-mini" viewBox="0 0 130 260" style="left:${ax - 14 * k2}px;top:${ay - 54 * k2}px;width:${28 * k2}px;height:${56 * k2}px"><use href="#avatar-costas"/></svg>`;
    }
  });
  $('#torre-nos').innerHTML = nos;
  encaixa('#andar-fil', 370, 216, { corte: 14, cristaX: 300 });
  $('.torre-guia .med').setAttribute('style', '--d:44px;' + rosto('galo-sorriso', 44, 1.15));
  $('.torre-janelas').innerHTML = `<svg width="390" height="844">
    <defs><linearGradient id="luar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3caf5" stop-opacity=".55"/><stop offset="1" stop-color="#3b3168" stop-opacity="0"/></linearGradient></defs>
    <path d="M-10 560 V270 Q-10 210 22 192 Q54 210 54 270 V560Z" fill="url(#luar)" stroke="rgba(201,189,166,.35)"/>
    <path d="M338 520 V240 Q338 186 366 170 Q394 186 394 240 V520Z" fill="url(#luar)" stroke="rgba(201,189,166,.35)"/>
    <path d="M30 260 L250 640 L150 640 Z" fill="rgba(211,202,245,.05)"/></svg>`;
  poeira($('#torre-poeira'), 70, [30, 120, 330, 470], 17, '#d3caf5');
})();

/* ======================= f) CARTA ======================= */
(function carta() {
  $('#carta-pulso').innerHTML = pulso('71', '42', '09');
  encaixa('#carta-mold', 176, 246, { corte: 9, dentro: 5, crista: false });
  $('.carta-gema').innerHTML = `<div style="margin-left:-9px;margin-top:-6px">${gema(18, 'ame')}</div>`;
  const g = [{ n: 'I', l: 'GESTO 1' }, { n: 'II', l: 'GESTO 2' }, { n: 'III', l: 'GESTO 3', c: true }];
  $('#gestos').innerHTML = g.map((x) => `<div class="gesto ${x.c ? 'cortado' : ''}"><div class="gm"><b>${x.n}</b></div><span>${x.l}</span></div>`).join('') +
    `<div class="tacas">TAÇAS CORTA 1<br><span style="color:var(--texto-3)">nível: pendente</span></div>`;
  const linhas = ['Imagine que isso é um poema muito bom.', 'Esse poema é tão incrível que você vai amar.', 'Sinta a força desse poema maravilhoso.', 'Sob o luar.', 'Lindo.'];
  $('#cant').innerHTML = linhas.map((l, i) => `<li class="${i < 2 ? 'marcado' : 'fora'}"><span class="n">${i + 1}</span>
    ${i < 1 ? '<span class="mt" style="background:var(--r-comum)"></span>' : ''}${i < 2 ? '<span class="mt rara" style="background:var(--r-rara)"></span>' : ''}${l}</li>`).join('');
  poeira($('#carta-poeira'), 50, [60, 100, 280, 300], 29, '#a4b5ff');
})();
