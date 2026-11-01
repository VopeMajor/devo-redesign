// kit2 (revisão) · montagem das telas. As peças 3D estão em telas3d.js / cena3d.js.
const $ = (s) => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const pedida = Q.get('tela');
if (pedida) { document.body.classList.add('so'); const f = $('#f-' + pedida); if (f) f.classList.add('ativa'); }
if (Q.has('notas')) document.body.classList.add('notas');
if (Q.get('quadro')) { const c = $('#cutin'); c.classList.remove('q3'); c.classList.add('q' + Q.get('quadro')); }

document.querySelectorAll('.tela').forEach((t) => t.insertAdjacentHTML('afterbegin', barraAparelho()));
function encaixa(sel, w, h, o) { const el = $(sel); if (el) el.innerHTML = moldura(w, h, o); }
['#exp-pulso', '#casa-pulso', '#mapa-pulso', '#dv-pulso', '#vit-pulso', '#carta-pulso'].forEach((s) => { const el = $(s); if (el) el.innerHTML = pulso(); });

// Meio-tom com gradiente de tamanho (pontos crescem na direção da borda)
function meioTom(canvas, { passo = 9, max = 4.6, dir = 'x', cor = '#000', ang = 0 } = {}) {
  const w = canvas.clientWidth, h = canvas.clientHeight, d = 2;
  canvas.width = w * d; canvas.height = h * d;
  const g = canvas.getContext('2d'); g.scale(d, d); g.fillStyle = cor;
  g.translate(w / 2, h / 2); g.rotate(ang); g.translate(-w / 2, -h / 2);
  for (let y = -h; y < h * 2; y += passo) for (let x = -w; x < w * 2; x += passo) {
    const ox = (Math.round(y / passo) % 2) * passo / 2;
    let t = dir === 'x' ? (x + ox) / w : dir === 'y' ? y / h : Math.hypot(x / w - .5, y / h - .5) * 1.6;
    t = Math.max(0, Math.min(1, t));
    const r = max * Math.pow(t, 1.4);
    if (r > .25) { g.beginPath(); g.arc(x + ox, y, r, 0, Math.PI * 2); g.fill(); }
  }
}
// Linhas de velocidade ao longo da diagonal
function velocidade(canvas, ang, cor, n = 70, semente = 3) {
  const w = canvas.clientWidth, h = canvas.clientHeight, d = 2;
  canvas.width = w * d; canvas.height = h * d;
  const g = canvas.getContext('2d'); g.scale(d, d);
  let s = semente; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.translate(w / 2, h / 2); g.rotate(ang);
  for (let i = 0; i < n; i++) {
    const y = (r() - .5) * h * 1.3, x = (r() - .5) * w * 1.6, L = 60 + r() * 260, esp = r() * 2.2 + .3;
    const gr = g.createLinearGradient(x, 0, x + L, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, cor.replace('A', (r() * .5 + .25).toFixed(2))); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x, y, L, esp);
  }
}

/* ======================= a) HOME ======================= */
(function home() {
  poeira($('#home-poeira'), 110, [0, 60, 390, 640], 7, '#d3caf5');
  poeira($('#home-poeira'), 30, [120, 120, 220, 420], 19, '#fff1dc');
  encaixa('#tempo-fil', 246, 96, { corte: 16, dentro: 5, crista: true });
})();

/* ======================= b) EXPLORAR ======================= */
(function explorar() {
  poeira($('#exp-poeira'), 120, [150, 280, 160, 380], 11, '#ffd9a6');
  poeira($('#exp-poeira'), 30, [0, 120, 390, 600], 5, '#d3caf5');
})();

/* ======================= c) CASA · VN ======================= */
(function casa() {
  meioTom($('#mt-casa'), { passo: 8, max: 4, dir: 'x', cor: '#2a0f08' });
  $('#vn-arco').innerHTML = `<svg width="230" height="400" viewBox="0 0 230 400"><path d="M8 400 V130 Q8 8 115 2 Q222 8 222 130 V400" fill="rgba(10,9,13,.35)" stroke="url(#g-metal)" stroke-width="1.6"/><path d="M18 400 V134 Q18 18 115 12 Q212 18 212 134 V400" fill="none" stroke="rgba(201,189,166,.35)"/><use href="#estrela4" x="105" y="-8" width="20" height="20" fill="#f2e9d8"/></svg>`;
  encaixa('#vn-fil', 370, 164, { corte: 12, dentro: 5, cristaX: 300 });
  $('#vn-vinc').innerHTML = vinculo(8, 3);
  poeira($('#casa-poeira'), 80, [0, 80, 390, 560], 13, '#ffd9a6');
})();

/* ======================= d) CUT-IN ======================= */
(function cutin() {
  velocidade($('#cut-vel'), -.21, 'rgba(242,161,94,A)', 90, 3);
  meioTom($("#mt-cut"), { passo: 10, max: 5, dir: "x", cor: "#2a0f08" });
  let e = ''; let s = 4; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 26; i++) {
    const x = r() * 390, y = 280 + r() * 360, t = 4 + r() * 16, rot = r() * 360;
    e += `<i style="position:absolute;left:${x}px;top:${y}px;width:${t}px;height:${t * .6}px;background:${i % 3 ? '#0a090d' : '#c9542a'};transform:rotate(${rot}deg) skewX(30deg);box-shadow:0 0 0 1px rgba(242,233,216,.25)"></i>`;
  }
  $('#cut-est').innerHTML = e;
  poeira($('#cut-poeira'), 70, [0, 260, 390, 420], 17, '#f2a15e');
})();

/* ======================= e) CONFIDENTES ======================= */
(function conf() {
  meioTom($('#mt-conf'), { passo: 8, max: 4, dir: 'r', cor: '#2a0f08' });
  encaixa('#tarot-fil', 136, 214, { corte: 8, dentro: 4, crista: false });
  $('#b-afin').innerHTML = vinculo(10, 4);
  $('#b-rom').innerHTML = vinculo(10, 2, 'romance');
  const npcs = [
    ['coruja-sorriso', 'A Coruja', '--coruja', 3], ['melissa-sorriso', 'Melissa', '--melissa', 5], ['herdeiro-neutro', 'O Herdeiro', '--herdeiro', 1],
    ['rato-sorriso', 'O Rato', '--rato', 2], [null, '? ? ?', '--champ-lo', 0],
  ];
  $('#conf-lista').innerHTML = npcs.map(([id, n, c, v]) => `<li class="${id ? '' : 'sil'}" style="--c:var(${c})"><div class="med" style="${id ? rosto(id, 54) : ''}">${id ? '' : '?'}</div><b>${n}</b><span>ARCANO ?</span>${vinculo(5, v)}</li>`).join('');
  poeira($('#conf-poeira'), 60, [100, 60, 290, 380], 23, '#f2a15e');
})();

/* ======================= f) MAPA ======================= */
(function mapa() { poeira($('#mapa-poeira'), 90, [0, 100, 390, 560], 31, '#d3caf5'); })();

/* ======================= g) TORRE ======================= */
(function torre() {
  // posições medidas sobre a pintura (patamares da escada); fora delas a cena funciona igual
  const nos = window.TORRE_NOS || [
    ['VII', 'trancado', 'tranc', 236, 176, 0], ['VI', 'trancado', 'tranc', 130, 236, 1], ['V', 'trancado', 'tranc', 268, 318, 0],
    ['IV', 'você está aqui', 'atual', 150, 420, 1], ['III', 'concluído', 'feito', 262, 520, 0], ['II', 'concluído', 'feito', 120, 590, 1],
  ];
  $('#torre-nos').innerHTML = nos.map(([n, s, cls, x, y, esq]) => `<div class="no-andar ${cls} ${esq ? 'esq' : ''}" style="left:${x}px;top:${y}px"><div class="emblema-no"><svg><use href="#${cls === 'tranc' ? 'e-torre' : cls === 'feito' ? 'estrela4' : 'e-casa'}"/></svg></div><div class="rot"><b>ANDAR ${n}</b><span>${s.toUpperCase()}</span></div></div>`).join('')
    + `<img class="no-avatar" src="img/v2/avatar-capa-costas.webp" style="left:${(nos[3][3]) + 20}px;top:${nos[3][4] - 60}px" alt="">`;
  $('.torre-guia .med').setAttribute('style', rosto('galo-confiante', 48));
  poeira($('#torre-poeira'), 110, [60, 80, 270, 520], 37, '#e6ecff');
  poeira($('#torre-poeira'), 30, [90, 360, 160, 140], 41, '#ffd29a');
})();

/* ======================= h) DEADLY VOTE ======================= */
(function dv() {
  const ids = ['melissa-sorriso', 'rato-apresenta', 'coruja-sorriso', 'herdeiro-neutro', 'javali-riso', 'galo-piscadela'];
  $('#dv-jog').innerHTML = ids.map((id) => `<i style="${rosto(id, 28)}"></i>`).join('') + '<i class="vazio"></i>'.repeat(6);
  const cartas = [['img/cartas/rei.webp', 2], ['img/cartas/peao.webp', 1]];
  $('#dv-cartas').innerHTML = cartas.map(([s, p]) => `<div class="dv-carta"><img src="${s}" alt=""><b>${p}</b></div>`).join('') + '<div class="dv-carta vazia">+</div>'.repeat(3);
  poeira($('#dv-poeira'), 90, [0, 90, 390, 420], 43, '#fff1dc');
})();

/* ======================= i) POÇO ======================= */
(function poco() { poeira($('#poco-poeira'), 100, [40, 200, 310, 420], 47, '#d3caf5'); })();

/* ======================= j) VITRINE ======================= */
(function vit() {
  const its = [['img/v2/badalada.webp', 'arcano', 1], ['img/cos/relogio-fim-512.webp', 'epico'], ['img/cos/olho-arcano-512.webp', 'lendario'], ['img/cos/asas-coruja-512.webp', 'raro'], ['img/cos/pacto-carmesim-512.webp', 'epico']];
  $('#vit-car').innerHTML = its.map(([s, r, on]) => `<div class="it ${on ? 'on' : ''}"><img src="${s}" alt=""><span class="gema-rar ${r}"></span></div>`).join('');
  poeira($('#vit-poeira'), 100, [20, 130, 350, 520], 53, '#d3caf5');
  poeira($('#vit-poeira'), 25, [120, 140, 150, 300], 59, '#fff1dc');
})();

/* ======================= k) COLEÇÃO ======================= */
(function inv() {
  const its = [
    ['img/v2/badalada.webp', 'Última Badalada', 'arcano', 1], ['img/cos/olho-arcano-512.webp', 'Olho do Arcano', 'lendario'], ['img/cos/banquete-javali-512.webp', 'Banquete do Javali', 'lendario'],
    ['img/cos/relogio-fim-512.webp', 'Relógio do Fim', 'epico'], ['img/cos/pacto-carmesim-512.webp', 'Pacto Carmesim', 'epico'], ['img/cos/asas-coruja-512.webp', 'Asas da Coruja', 'raro'],
    ['img/cos/heranca-marfim-512.webp', 'Herança de Marfim', 'raro'], ['img/cos/fortuna-rato-512.webp', 'Fortuna do Rato', 'incomum'], ['img/cos/catedral-esquecida-512.webp', 'Catedral Esquecida', 'raro'],
  ];
  const brilho = { arcano: 'rgba(138,124,200,.45)', lendario: 'rgba(214,190,140,.35)', epico: 'rgba(163,46,64,.35)', raro: 'rgba(217,216,212,.2)', incomum: 'rgba(183,179,168,.15)' };
  const borda = { lendario: 'rgba(227,211,174,.6)', epico: 'rgba(201,138,149,.55)', raro: 'rgba(217,216,212,.4)', incomum: 'rgba(183,179,168,.3)' };
  $('#inv-grade').innerHTML = its.map(([s, n, r, eq]) => `<div class="inv-it ${r} ${eq ? 'equip' : ''}" style="--g:${brilho[r]};--b:${borda[r] || 'transparent'}"><span class="gema-rar ${r}"></span><img src="${s}" alt=""><b>${n}</b></div>`).join('');
})();

/* ======================= l) CARTA ======================= */
(function carta() {
  encaixa('#carta-mold', 170, 238, { corte: 9, dentro: 5, crista: false });
  const g = [{ n: 'I', l: 'GESTO 1' }, { n: 'II', l: 'GESTO 2' }, { n: 'III', l: 'GESTO 3', c: true }];
  $('#gestos').innerHTML = g.map((x) => `<div class="gesto ${x.c ? 'cortado' : ''}"><div class="gm"><b>${x.n}</b></div><span>${x.l}</span></div>`).join('') +
    `<div class="tacas">TAÇAS CORTA 1 GESTO<br><span style="color:var(--texto-3)">nomes dos Gestos: do dono</span></div>`;
  const linhas = ['Imagine que isso é um poema muito bom.', 'Esse poema é tão incrível que você vai amar.', 'Sinta a força desse poema maravilhoso.', 'Sob o luar.', 'Lindo.'];
  $('#cant').innerHTML = linhas.map((l, i) => `<li class="${i < 2 ? 'marcado' : 'fora'}"><span class="n">${i + 1}</span>
    ${i < 1 ? '<span class="mt" style="background:var(--r-comum)"></span>' : ''}${i < 2 ? '<span class="mt rara" style="background:var(--r-rara)"></span>' : ''}${l}</li>`).join('');
  poeira($('#carta-poeira'), 80, [60, 90, 280, 320], 29, '#a4b5ff');
})();
