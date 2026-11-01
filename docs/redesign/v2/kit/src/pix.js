// DEVO v2 — desenho em pixel para o kit (provisório; só para provar paleta, escala e regras).
// Tudo é desenhado a 1x num canvas pequeno e ampliado por CSS (image-rendering: pixelated).
// Regra da bíblia: 1 pixel de arte = 3 px CSS no celular, 4 px CSS no desktop.

export const P = {
  // tinta (contorno e texto)
  tinta: '#241d2b', tinta2: '#3d3247', tinta3: '#5e4f69',
  // papel
  papel0: '#fbf3e4', papel1: '#f3e4cc', papel2: '#e6cfae', papel3: '#c9a985', papel4: '#9c7b5e',
  // lavanda
  lav0: '#ece4f3', lav1: '#cdbfe2', lav2: '#a493c6', lav3: '#7b6aa3',
  // rosa
  rosa0: '#f7d9de', rosa1: '#e9aab7', rosa2: '#c97a8f', rosa3: '#94506a',
  // verde
  ver0: '#dfe8c4', ver1: '#b5c98f', ver2: '#82a46a', ver3: '#587a4e', ver4: '#3b5440',
  // pedra / caminho
  ped0: '#e3d6cf', ped1: '#c9b5ad', ped2: '#9a8580', ped3: '#6e5c5c',
  // água
  agua0: '#bfe0e6', agua1: '#7fb5c6', agua2: '#4c7f99',
  // cobalto (sistema, Record)
  cob0: '#c9d3ff', cob1: '#6d85ff', cob2: '#1647ff', cob3: '#0b23a0',
  // ouro (Honra)
  ouro0: '#f6e3a1', ouro1: '#e2b85c', ouro2: '#b07f2e',
  // necro
  nec0: '#9be3b5', nec1: '#6b4e8f', nec2: '#2a2138',
  // alerta
  verm: '#e0533f', lar: '#f2a65a',
  // preto do Record
  rec0: '#0b0b12', rec1: '#1a1a26', rec2: '#2b2b3d',
  branco: '#ffffff',
};

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
export const D = (g, x, y, c) => R(g, x, y, 1, 1, c);

// ---------- tiles top-down 3/4 (16x16) ----------
export function grama(g, x, y, r) {
  R(g, x, y, 16, 16, P.ver1);
  for (let i = 0; i < 9; i++) {
    const a = (r() * 15) | 0, b = (r() * 14) | 0;
    D(g, x + a, y + b, P.ver2); D(g, x + a, y + b + 1, P.ver2);
  }
  for (let i = 0; i < 4; i++) D(g, x + ((r() * 16) | 0), y + ((r() * 16) | 0), P.ver0);
}
export function caminho(g, x, y, r) {
  R(g, x, y, 16, 16, P.ped0);
  for (let i = 0; i < 5; i++) {
    const a = (r() * 13) | 0, b = (r() * 13) | 0;
    R(g, x + a, y + b, 3, 2, P.ped1); D(g, x + a, y + b + 2, P.ped2);
  }
}
export function borda(g, x, y, lado) {
  // tufos de grama sobre o caminho
  for (let i = 0; i < 16; i += 2) {
    if (lado === 'cima') { D(g, x + i, y, P.ver2); D(g, x + i + 1, y + 1, P.ver2); }
    if (lado === 'baixo') { D(g, x + i, y + 15, P.ver2); D(g, x + i + 1, y + 14, P.ver2); }
    if (lado === 'esq') { D(g, x, y + i, P.ver2); D(g, x + 1, y + i + 1, P.ver2); }
    if (lado === 'dir') { D(g, x + 15, y + i, P.ver2); D(g, x + 14, y + i + 1, P.ver2); }
  }
}
export function agua(g, x, y, r) {
  R(g, x, y, 16, 16, P.agua1);
  for (let i = 0; i < 3; i++) { const a = (r() * 12) | 0, b = (r() * 15) | 0; R(g, x + a, y + b, 4, 1, P.agua0); }
}
export function piso(g, x, y, claro) {
  // assoalho: tábuas de 4 px, emendas desencontradas
  for (let k = 0; k < 4; k++) {
    R(g, x, y + k * 4, 16, 4, (k + (claro ? 0 : 1)) % 2 ? P.papel2 : '#ecd8b9');
    R(g, x, y + k * 4 + 3, 16, 1, P.papel3);
    D(g, x + ((k * 5 + (claro ? 3 : 11)) % 16), y + k * 4, P.papel3); D(g, x + ((k * 5 + (claro ? 3 : 11)) % 16), y + k * 4 + 1, P.papel3); D(g, x + ((k * 5 + (claro ? 3 : 11)) % 16), y + k * 4 + 2, P.papel3);
  }
}

export function arvore(g, x, y, flor) {
  // copa 32x28 + tronco; flor = cerejeira
  const c0 = flor ? P.rosa0 : P.ver2, c1 = flor ? P.rosa1 : P.ver3, c2 = flor ? P.rosa2 : P.ver4;
  R(g, x + 13, y + 24, 6, 12, P.papel4); R(g, x + 13, y + 24, 2, 12, P.tinta3); R(g, x + 11, y + 34, 10, 2, P.ver3);
  const blob = [[6, 4, 20, 22], [2, 9, 28, 13], [9, 1, 14, 5]];
  for (const [a, b, w, h] of blob) R(g, x + a - 1, y + b - 1, w + 2, h + 2, P.tinta2);
  for (const [a, b, w, h] of blob) R(g, x + a, y + b, w, h, c1);
  R(g, x + 3, y + 18, 26, 4, c2); R(g, x + 8, y + 23, 16, 2, c2);
  R(g, x + 8, y + 3, 10, 3, c0); R(g, x + 5, y + 7, 6, 4, c0); R(g, x + 14, y + 8, 8, 3, c0);
  if (flor) for (let i = 0; i < 10; i++) D(g, x + 4 + ((i * 7) % 24), y + 6 + ((i * 5) % 14), P.branco);
}

export function cerca(g, x, y, n) {
  for (let i = 0; i < n; i++) {
    R(g, x + i * 8, y, 3, 10, P.papel4); D(g, x + i * 8 + 1, y, P.papel2);
  }
  R(g, x, y + 3, n * 8 - 5, 2, P.papel3); R(g, x, y + 7, n * 8 - 5, 1, P.papel4);
}
export function flores(g, x, y, r, cores) {
  for (let i = 0; i < 6; i++) {
    const a = (r() * 14) | 0, b = (r() * 12) | 0, c = cores[(r() * cores.length) | 0];
    D(g, x + a, y + b + 1, P.ver3); D(g, x + a, y + b, c); D(g, x + a + 1, y + b, c);
  }
}
export function casa(g, x, y, w, telhado, parede) {
  // fachada vista 3/4: telhado (h=22), parede (h=26), porta e janelas
  const h = 48;
  R(g, x - 1, y - 1, w + 2, h + 2, P.tinta2);
  R(g, x, y + 22, w, 26, parede[0]); R(g, x, y + 44, w, 4, parede[1]);
  for (let i = 0; i < 22; i++) {
    const inset = Math.max(0, 6 - i);
    R(g, x + inset, y + i, w - inset * 2, 1, i % 4 === 3 ? telhado[2] : (i < 6 ? telhado[0] : telhado[1]));
  }
  R(g, x, y + 21, w, 2, P.tinta2);
  const pd = x + (w >> 1) - 6;
  R(g, pd - 1, y + 29, 14, 19, P.tinta2); R(g, pd, y + 30, 12, 18, P.papel4); R(g, pd + 6, y + 30, 1, 18, P.tinta3);
  D(g, pd + 4, y + 39, P.ouro1); D(g, pd + 8, y + 39, P.ouro1);
  for (const jx of [x + 6, x + w - 18]) {
    R(g, jx - 1, y + 28, 14, 12, P.tinta2); R(g, jx, y + 29, 12, 10, P.agua0); R(g, jx + 6, y + 29, 1, 10, P.papel3); R(g, jx, y + 34, 12, 1, P.papel3);
    R(g, jx - 1, y + 40, 14, 3, P.ver3); D(g, jx + 2, y + 40, P.rosa1); D(g, jx + 7, y + 40, P.rosa1); D(g, jx + 10, y + 41, P.lav1);
  }
}
export function poco(g, x, y) {
  // Poço dos Milagres: 24x28
  R(g, x + 2, y + 2, 2, 12, P.papel4); R(g, x + 20, y + 2, 2, 12, P.papel4);
  for (let i = 0; i < 6; i++) R(g, x + i, y + 4 - (i >> 1) + 3, 24 - i * 2, 1, i < 2 ? P.rosa3 : P.rosa2);
  R(g, x, y + 1, 24, 2, P.rosa3); R(g, x + 3, y + 7, 18, 1, P.tinta2);
  R(g, x - 1, y + 13, 26, 15, P.tinta2); R(g, x, y + 14, 24, 13, P.ped1);
  for (let i = 0; i < 4; i++) R(g, x + 1 + i * 6, y + 18 + (i % 2) * 4, 5, 1, P.ped2);
  R(g, x + 3, y + 13, 18, 3, P.agua2); R(g, x + 5, y + 13, 6, 1, P.cob1);
}
export function poste(g, x, y) {
  R(g, x + 2, y + 4, 2, 22, P.tinta2); R(g, x, y, 6, 5, P.tinta2); R(g, x + 1, y + 1, 4, 3, P.ouro0);
  R(g, x, y + 25, 6, 2, P.tinta2);
}
export function placa(g, x, y) {
  R(g, x + 6, y + 8, 2, 8, P.papel4); R(g, x - 1, y - 1, 16, 10, P.tinta2); R(g, x, y, 14, 8, P.papel2);
  R(g, x + 2, y + 3, 10, 1, P.papel4); R(g, x + 2, y + 5, 7, 1, P.papel4);
}

// ---------- personagem 16x32 (chibi 3/4) ----------
// c = { cabelo:[claro,escuro], pele:[claro,sombra], roupa:[claro,escuro], calca, olho }
export function boneco(g, x, y, c, dir = 'baixo', passo = 0) {
  const T = P.tinta;
  // sombra no chão
  R(g, x + 3, y + 30, 10, 2, 'rgba(36,29,43,.25)');
  // pernas
  const pe = passo ? 1 : 0;
  R(g, x + 4, y + 24, 3, 6 - pe, c.calca); R(g, x + 9, y + 24, 3, 6 - (1 - pe) * pe, c.calca);
  R(g, x + 4, y + 29 - pe, 3, 1, T); R(g, x + 9, y + 29, 3, 1, T);
  // corpo
  R(g, x + 2, y + 15, 12, 10, T); R(g, x + 3, y + 16, 10, 8, c.roupa[0]); R(g, x + 3, y + 22, 10, 2, c.roupa[1]);
  R(g, x + 1, y + 17, 2, 6, T); R(g, x + 13, y + 17, 2, 6, T); R(g, x + 1, y + 22, 2, 2, c.pele[0]); R(g, x + 13, y + 22, 2, 2, c.pele[0]);
  // cabeça
  R(g, x + 1, y + 1, 14, 15, T); R(g, x + 2, y + 2, 12, 13, c.pele[0]);
  R(g, x + 2, y + 13, 12, 2, c.pele[1]);
  // cabelo
  R(g, x + 1, y, 14, 6, T); R(g, x + 2, y + 1, 12, 5, c.cabelo[0]);
  if (dir === 'cima') { R(g, x + 2, y + 2, 12, 12, c.cabelo[0]); R(g, x + 2, y + 10, 12, 3, c.cabelo[1]); }
  else {
    R(g, x + 2, y + 6, 2, 6, c.cabelo[1]); R(g, x + 12, y + 6, 2, 6, c.cabelo[1]);
    R(g, x + 5, y + 6, 3, 2, c.cabelo[0]); R(g, x + 2, y + 1, 12, 1, c.cabelo[1]);
    if (dir === 'baixo') { R(g, x + 5, y + 9, 1, 2, c.olho); R(g, x + 10, y + 9, 1, 2, c.olho); D(g, x + 4, y + 11, P.rosa1); D(g, x + 11, y + 11, P.rosa1); }
    else { R(g, x + (dir === 'dir' ? 10 : 5), y + 9, 1, 2, c.olho); }
  }
  if (c.extra) c.extra(g, x, y);
}
export const AVATAR = { cabelo: [P.lav2, P.lav3], pele: [P.papel1, P.papel2], roupa: [P.cob1, P.cob3], calca: P.tinta2, olho: P.tinta };
export const NPC_CORUJA = { cabelo: [P.tinta3, P.tinta2], pele: [P.papel2, P.papel3], roupa: [P.papel4, P.tinta3], calca: P.tinta, olho: P.lar,
  extra: (g, x, y) => { R(g, x + 3, y + 1, 2, 7, P.papel0); } };

// ---------- isométrico (2:1) ----------
// losango de piso: centro (cx,cy), meia-largura a (múltiplo de 2), meia-altura a/2
export function isoLosango(g, cx, cy, a, cor, linha) {
  for (let i = 0; i <= a / 2; i++) {
    const w = i * 4;
    R(g, cx - w / 2 * 1, cy - a / 2 + i, w, 1, cor);
    R(g, cx - w / 2 * 1, cy + a / 2 - i, w, 1, cor);
  }
  if (linha) {
    for (let i = 0; i <= a / 2; i++) {
      const w = i * 2;
      D(g, cx - w, cy - a / 2 + i, linha); D(g, cx + w - 1, cy - a / 2 + i, linha);
      D(g, cx - w, cy + a / 2 - i, linha); D(g, cx + w - 1, cy + a / 2 - i, linha);
    }
  }
}
// caixa isométrica (móvel) com base em (cx,cy) = vértice de baixo; w,d em px de meia-largura; h altura
export function isoCaixa(g, cx, cy, w, d, h, cores) {
  const [topo, esq, dir, lin] = cores;
  // face esquerda
  for (let i = 0; i < w; i++) {
    const yy = cy - (i >> 1);
    R(g, cx - i - 1, yy - h, 1, h, esq);
  }
  for (let i = 0; i < d; i++) {
    const yy = cy - (i >> 1);
    R(g, cx + i, yy - h, 1, h, dir);
  }
  // topo
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    D(g, cx - i + j - 1, cy - h - ((i + j) >> 1) - 1, topo);
    D(g, cx - i + j, cy - h - ((i + j) >> 1) - 1, topo);
  }
  if (lin) {
    for (let i = 0; i < w; i++) { D(g, cx - i - 1, cy - (i >> 1), lin); D(g, cx - i - 1, cy - h - (i >> 1) - 1, lin); }
    for (let i = 0; i < d; i++) { D(g, cx + i, cy - (i >> 1), lin); D(g, cx + i, cy - h - (i >> 1) - 1, lin); }
    R(g, cx - w - 1, cy - (w >> 1) - h, 1, h, lin); R(g, cx + d, cy - (d >> 1) - h, 1, h, lin); R(g, cx - 1, cy - h, 1, h, lin);
  }
}

// ---------- glifos 16x16 (ícones de app e gestos) ----------
const GL = {
  record: ['................', '..############..', '..#..........#..', '..#.########.#..', '..#..........#..', '..#.######...#..', '..#..........#..', '..#.#########...', '..#..........#..', '..#.#######..#..', '..#..........#..', '..#....####..#..', '..#...#....#.#..', '..#....####..#..', '..############..', '................'],
  pulso: ['......####......', '......####......', '....########....', '...#........#...', '..#....#.....#..', '..#....#.....#..', '..#....#.....#..', '..#....####..#..', '..#..........#..', '..#..........#..', '...#........#...', '....########....', '......####......', '......####......', '......####......', '................'],
  msg: ['................', '................', '.############...', '.#..........#...', '.#.########.#...', '.#..........#...', '.#.######...#...', '.#..........#...', '.######..####...', '......#.#.......', '......##........', '.......#........', '................', '................', '................', '................'],
  cartas: ['................', '....########....', '...#........#...', '..#.######..#...', '..#.#....#..#...', '..#.#.##.#..#...', '..#.#....#..#...', '..#.#.##.#..#...', '..#.#....#..#...', '..#.######..#...', '..#.........#...', '..#..####...#...', '..#.........#...', '..###########...', '................', '................'],
  vinculo: ['................', '................', '..###....###....', '.#...#..#...#...', '#.....##.....#..', '#............#..', '#............#..', '.#..........#...', '..#........#....', '...#......#.....', '....#....#......', '.....#..#.......', '......##........', '................', '................', '................'],
  casa: ['................', '.......##.......', '......#..#......', '.....#....#.....', '....#......#....', '...#........#...', '..############..', '...#........#...', '...#.##..##.#...', '...#.##..##.#...', '...#........#...', '...#...##...#...', '...#...##...#...', '...##########...', '................', '................'],
  mapa: ['................', '.#####.....####.', '.#...######...#.', '.#...#....#...#.', '.#...#....#...#.', '.#...#.#..#...#.', '.#...#....#...#.', '.#...#....#...#.', '.#...#..#.#...#.', '.#...#....#...#.', '.#...#....#...#.', '.#####....#####.', '.....######.....', '................', '................', '................'],
  inv: ['................', '.....######.....', '....#......#....', '..############..', '..#..........#..', '..#....##....#..', '..#...#..#...#..', '..############..', '..#..........#..', '..#..........#..', '..#..........#..', '..############..', '................', '................', '................', '................'],
  ajustes: ['................', '.......##.......', '...##..##..##...', '...##########...', '....#......#....', '..###..##..###..', '..#...#..#...#..', '..#...#..#...#..', '..###..##..###..', '....#......#....', '...##########...', '...##..##..##...', '.......##.......', '................', '................', '................'],
  // gestos (repertório): mão aberta, punho, dois dedos, cruz no peito
  g_mao: ['................', '....#.#.#.......', '....#.#.#.#.....', '....#.#.#.#.....', '....#.#.#.#.....', '....#######.##..', '....#.......#...', '...#........#...', '...#.......#....', '...#.......#....', '....#.....#.....', '.....#####......', '................', '................', '................', '................'],
  g_dois: ['................', '.....#..#.......', '.....#..#.......', '.....#..#.......', '.....#..#.......', '....##..###.....', '....#.......#...', '....#..####.#...', '....#.......#...', '....#.......#...', '.....#.....#....', '......#####.....', '................', '................', '................', '................'],
  g_circ: ['................', '.....######.....', '....#......#....', '...#........#...', '..#..........#..', '..#.....##...#..', '..#....####..#..', '..#.....##...#..', '..#..........#..', '...#.......##...', '....#......###..', '.....######.....', '................', '................', '................', '................'],
};
export function glifo(g, nome, x, y, cor) {
  const m = GL[nome]; if (!m) return;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (m[j][i] === '#') D(g, x + i, y + j, cor);
}
export function glifoCanvas(nome, cor, escala = 3) {
  const [c, g] = mk(16, 16); glifo(g, nome, 0, 0, cor);
  c.style.width = 16 * escala + 'px'; c.style.height = 16 * escala + 'px'; c.className = 'px';
  return c;
}

export function montar(canvas, alvo, escala) {
  canvas.style.width = canvas.width * escala + 'px';
  canvas.style.height = canvas.height * escala + 'px';
  canvas.className = 'px';
  alvo.appendChild(canvas);
}
