// Cenas do kit (provisórias): rua top-down 3/4, interior top-down 3/4 e casa em corte isométrica.
import * as X from './pix.js';
const { P, R, D } = X;

export function rua(W, H, seed = 7, oy = 0) {
  const [c, g] = X.mk(W, H); const r = X.rng(seed);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) X.grama(g, x, y, r);
  for (let i = 0; i < 6; i++) X.flores(g, (i * 23) % W, 4 + (i % 2) * 8, r, [P.rosa1, P.branco]);
  g.save(); g.translate(0, oy);
  // caminho horizontal (linha 4) e vertical (colunas 3-4)
  const hy = 64, vx = 48;
  for (let x = 0; x < W; x += 16) { X.caminho(g, x, hy, r); X.borda(g, x, hy, 'cima'); X.borda(g, x, hy, 'baixo'); }
  for (let y = hy + 16; y < H; y += 16) for (const x of [vx, vx + 16]) X.caminho(g, x, y, r);
  for (let y = hy + 16; y < H; y += 16) { X.borda(g, vx, y, 'esq'); X.borda(g, vx + 16, y, 'dir'); }
  // lago
  for (let y = H - 64; y < H - 16; y += 16) for (let x = 0; x < 32; x += 16) X.agua(g, x, y, r);
  R(g, 0, H - 65, 33, 1, P.ver3); R(g, 32, H - 64, 1, 48, P.ver3);
  // casas
  X.casa(g, 4, 10, 54, [P.rosa1, P.rosa2, P.rosa3], [P.papel1, P.papel2]);
  X.casa(g, 70, 10, 56, [P.lav1, P.lav2, P.lav3], [P.papel0, P.papel2]);
  if (W > 140) X.casa(g, 140, 10, 60, [P.ouro0, P.ouro1, P.ouro2], [P.papel1, P.papel2]);
  if (W > 210) X.casa(g, 214, 10, 54, [P.ver1, P.ver2, P.ver3], [P.papel0, P.papel2]);
  X.placa(g, 30, 50); X.placa(g, 100, 50);
  X.poste(g, 40, 82); X.poste(g, 84, 140);
  // jardim e poço
  X.cerca(g, 2, 96, 5); X.flores(g, 4, 108, r, [P.rosa1, P.lav1, P.branco]); X.flores(g, 18, 112, r, [P.rosa1, P.ouro0]);
  X.poco(g, 94, 100); X.placa(g, 112, 128);
  X.flores(g, 92, 132, r, [P.lav1, P.rosa0]);
  X.arvore(g, 2, 120, true); X.arvore(g, 96, 170, true); X.arvore(g, 0, 182, false);
  if (W > 140) { X.arvore(g, 150, 96, true); X.arvore(g, 200, 150, false); X.poco; X.cerca(g, 140, 210, 8); X.flores(g, 150, 222, r, [P.rosa1, P.branco]); }
  g.restore();
  // pétalas
  for (let i = 0; i < 40; i++) { const x = (r() * W) | 0, y = (r() * H) | 0; D(g, x, y, P.rosa0); D(g, x + 1, y, P.rosa1); }
  return [c, g];
}

export function interior(W, H, seed = 3) {
  const [c, g] = X.mk(W, H); const r = X.rng(seed);
  R(g, 0, 0, W, H, P.tinta);
  // parede do fundo (3/4): 40 px de altura
  const top = 22;
  R(g, 6, top, W - 12, 40, P.lav0);
  for (let x = 6; x < W - 6; x += 8) R(g, x, top, 1, 40, P.lav1);
  R(g, 6, top + 34, W - 12, 6, P.papel3); R(g, 6, top + 34, W - 12, 1, P.papel4);
  // janela e quadro
  R(g, 20, top + 8, 24, 18, P.tinta2); R(g, 21, top + 9, 22, 16, P.agua0); R(g, 32, top + 9, 1, 16, P.papel3);
  R(g, 21, top + 9, 22, 4, P.rosa0);
  R(g, 84, top + 10, 16, 12, P.ouro2); R(g, 85, top + 11, 14, 10, P.rosa1);
  // piso
  for (let y = top + 40; y < H - 10; y += 16) for (let x = 6; x < W - 6; x += 16) X.piso(g, x, y, ((x + y) >> 4) % 2);
  // tapete
  R(g, 34, top + 92, 62, 40, P.lav3); R(g, 36, top + 94, 58, 36, P.lav2); R(g, 40, top + 98, 50, 28, P.lav1);
  for (let x = 40; x < 90; x += 6) D(g, x, top + 112, P.lav0);
  // cama
  R(g, 98, top + 44, 26, 36, P.tinta2); R(g, 99, top + 45, 24, 10, P.papel0); R(g, 99, top + 55, 24, 24, P.rosa1); R(g, 99, top + 70, 24, 9, P.rosa2);
  // armário (esconderijo)
  R(g, 8, top + 20, 20, 44, P.tinta2); R(g, 9, top + 21, 18, 42, P.papel4); R(g, 18, top + 21, 1, 42, P.tinta3); D(g, 16, top + 42, P.ouro1); D(g, 20, top + 42, P.ouro1);
  // mesa com o Card Shuffler
  R(g, 12, top + 140, 28, 16, P.tinta2); R(g, 13, top + 141, 26, 10, P.papel4); R(g, 13, top + 151, 26, 4, P.papel3);
  R(g, 20, top + 136, 12, 8, P.tinta2); R(g, 21, top + 137, 10, 6, P.cob1); D(g, 25, top + 138, P.cob0);
  // planta
  R(g, 108, top + 140, 12, 14, P.tinta2); R(g, 109, top + 146, 10, 7, P.papel4); R(g, 106, top + 130, 16, 12, P.ver2); R(g, 109, top + 128, 8, 4, P.ver1);
  // porta
  R(g, 56, H - 12, 20, 6, P.papel4); R(g, 56, H - 12, 20, 1, P.ouro1);
  return [c, g];
}

function salaIso(g, cx, cy, a, h, cores, trancada) {
  // a = meia-largura do piso (px), h = altura da parede
  const [chao, chaoLin, parE, parD, rodape] = cores;
  // parede esquerda: do vértice esquerdo (cx-a, cy) ao topo (cx, cy-a/2)
  for (let i = 0; i < a; i++) { const x = cx - a + i, y = cy - (i >> 1); R(g, x, y - h, 1, h, parE); D(g, x, y - h, P.tinta2); D(g, x, y - 3, rodape); D(g, x, y - 2, rodape); }
  for (let i = 0; i < a; i++) { const x = cx + i, y = cy - (a >> 1) + (i >> 1); R(g, x, y - h, 1, h, parD); D(g, x, y - h, P.tinta2); D(g, x, y - 3, rodape); D(g, x, y - 2, rodape); }
  R(g, cx - 1, cy - (a >> 1) - h, 1, h, P.tinta2);
  // piso
  X.isoLosango(g, cx, cy, a, chao, chaoLin);
  if (trancada) {
    for (let y = cy - (a >> 1) - h; y < cy + (a >> 1); y++) for (let x = cx - a; x < cx + a; x++) if (((x + y) & 3) === 0) D(g, x, y, 'rgba(36,29,43,.55)');
  }
}

export function casaCorte(W, H) {
  const [c, g] = X.mk(W, H);
  // céu em faixas (sem degradê liso: faixas de 1 cor)
  const faixas = [P.lav1, P.lav0, P.rosa0, P.papel0];
  for (let i = 0; i < 4; i++) R(g, 0, (H * i / 4) | 0, W, Math.ceil(H / 4), faixas[i]);
  for (let i = 0; i < 4; i++) { const y = (H * (i + 1) / 4) | 0; for (let x = 0; x < W; x += 4) D(g, x + (i % 2) * 2, y - 1, faixas[i]); }
  // nuvens
  for (const [x, y, w] of [[8, 20, 30], [86, 34, 34], [40, 60, 22]]) { R(g, x, y, w, 6, P.branco); R(g, x + 4, y - 3, w - 10, 3, P.branco); R(g, x, y + 5, w, 1, P.lav0); }
  // terreno
  const cx = W >> 1, base = H - 30;
  X.isoLosango(g, cx, base, 60, P.ver2, P.ver3);
  X.isoLosango(g, cx, base - 2, 56, P.ver1, null);
  // térreo: sala (esq) e cozinha (dir)
  const corA = [P.papel2, P.papel3, P.lav0, P.lav1, P.papel4];
  const corB = [P.ped0, P.ped1, P.rosa0, P.rosa1, P.rosa3];
  salaIso(g, cx - 24, base - 14, 24, 26, corA);
  salaIso(g, cx + 24, base - 14, 24, 26, corB);
  // móveis térreo
  X.isoCaixa(g, cx - 30, base - 12, 8, 5, 6, [P.rosa1, P.rosa2, P.rosa3, P.tinta2]); // sofá
  X.isoCaixa(g, cx - 14, base - 8, 4, 4, 5, [P.papel3, P.papel4, P.tinta3, P.tinta2]); // mesa shuffler
  D(g, cx - 14, base - 15, P.cob2); D(g, cx - 13, base - 15, P.cob1);
  X.isoCaixa(g, cx + 32, base - 18, 10, 4, 9, [P.papel0, P.ped1, P.ped2, P.tinta2]); // balcão
  // andar de cima: quarto (esq) e quarto de hóspedes trancado (dir)
  const up = base - 14 - 36;
  salaIso(g, cx - 24, up, 24, 24, [P.lav1, P.lav2, P.papel0, P.papel1, P.lav3]);
  salaIso(g, cx + 24, up, 24, 24, [P.papel2, P.papel3, P.papel1, P.papel2, P.papel4], true);
  // laje entre andares
  for (let i = 0; i < 48; i++) { D(g, cx - 48 + i, up + 1 + (i >> 1) - 24 + 24, P.tinta2); }
  X.isoCaixa(g, cx - 26, up + 2, 9, 6, 5, [P.papel0, P.lav1, P.lav2, P.tinta2]); // cama
  R(g, cx - 34, up - 9, 6, 2, P.rosa1);
  X.isoCaixa(g, cx - 10, up - 2, 3, 3, 10, [P.ver1, P.ver2, P.ver3, P.tinta2]); // planta
  // cadeado no quarto trancado
  const lx = cx + 22, ly = up - 22;
  R(g, lx, ly, 7, 6, P.ouro1); R(g, lx + 1, ly - 4, 5, 1, P.ouro2); R(g, lx + 1, ly - 4, 1, 4, P.ouro2); R(g, lx + 5, ly - 4, 1, 4, P.ouro2); D(g, lx + 3, ly + 2, P.tinta2);
  // telhado em corte (só a linha)
  for (let i = 0; i < 50; i++) { D(g, cx - 50 + i, up - 24 - 25 + (i >> 1) + 1, P.rosa3); D(g, cx + i, up - 24 - (i >> 1), P.rosa3); }
  // mini avatar no quarto (iso: só parado/sentado)
  R(g, cx - 18, up - 12, 3, 2, P.lav2); R(g, cx - 18, up - 10, 3, 3, P.papel1); R(g, cx - 18, up - 7, 3, 3, P.cob1);
  return [c, g];
}

export function mostrador(escala = 3, hora = 2) {
  const [c, g] = X.mk(11, 11);
  const anel = [[3, 0, 5, 1], [1, 1, 2, 1], [8, 1, 2, 1], [0, 3, 1, 5], [10, 3, 1, 5], [1, 2, 1, 1], [9, 2, 1, 1], [1, 8, 1, 1], [9, 8, 1, 1], [1, 9, 2, 1], [8, 9, 2, 1], [3, 10, 5, 1]];
  R(g, 1, 1, 9, 9, P.papel0); R(g, 2, 1, 7, 9, P.papel0);
  for (const [x, y, w, h] of anel) R(g, x, y, w, h, P.tinta2);
  D(g, 5, 2, P.tinta3); D(g, 8, 5, P.tinta3); D(g, 5, 8, P.tinta3); D(g, 2, 5, P.tinta3);
  D(g, 5, 5, P.cob2);
  const ponteiros = [[[5, 4], [5, 3]], [[6, 4], [7, 3]], [[6, 5], [7, 5]], [[6, 6], [7, 7]]];
  for (const [x, y] of ponteiros[hora % 4]) D(g, x, y, P.cob2);
  c.style.width = c.style.height = 11 * escala + 'px'; c.className = 'px';
  return c;
}
export function avancar(escala = 3) {
  // ponteiro de avançar: seta cobalto num arco de marcas
  const [c, g] = X.mk(9, 9);
  for (const [x, y] of [[4, 0], [7, 1], [8, 4], [7, 7], [4, 8], [1, 7], [0, 4], [1, 1]]) D(g, x, y, P.tinta3);
  R(g, 3, 2, 1, 5, P.cob2); R(g, 4, 3, 1, 3, P.cob2); D(g, 5, 4, P.cob2);
  c.style.width = c.style.height = 9 * escala + 'px'; c.className = 'px';
  return c;
}
