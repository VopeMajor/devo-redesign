// kit2 · liga as peças 3D (cena3d.js) às telas. Marca window.__ok quando tudo pintou.
import { relogio, tabuleiro, orbita, pedestal } from './cena3d.js';
const vis = (id) => { const f = document.getElementById(id)?.closest('figure'); return !document.body.classList.contains('so') || f?.classList.contains('ativa'); };
await document.fonts.ready;
await document.fonts.load('600 40px Cinzel');
const jobs = [];
if (vis('c-relogio')) jobs.push(relogio(document.getElementById('c-relogio')));
if (vis('c-tabuleiro')) jobs.push(tabuleiro(document.getElementById('c-tabuleiro')));
if (vis('c-pedestal')) jobs.push(pedestal(document.getElementById('c-pedestal'), null));
if (vis('c-orbita')) {
  const torres = [
    { nome: 'Agulha', sub: 'TORRE PRINCIPAL', img: 'img/torres/agulha-512.webp', ang: -1.62, anel: 0, alt: 1.9 },
    { nome: 'Torre do Imperador', sub: 'ANDAR IV', img: 'img/torres/imperador-512.webp', ang: .55, anel: 1, cor: 0xc9542a, on: 1 },
    { nome: 'Observatório', sub: 'ABERTA', img: 'img/torres/observatorio-512.webp', ang: 2.55, anel: 1 },
    { nome: 'Picadeiro', sub: 'TRANCADA', img: 'img/torres/picadeiro-512.webp', ang: -.55, anel: 2, trancada: true },
  ];
  jobs.push(orbita(document.getElementById('c-orbita'), torres).then((pos) => {
    document.getElementById('mapa-rot').innerHTML = pos.map(([x, y], i) => `<div class="mapa-rot ${torres[i].on ? 'on' : ''}" style="left:${Math.max(70, Math.min(320, x))}px;top:${y}px"><b>${torres[i].nome}</b><span>${torres[i].sub}</span></div>`).join('');
  }));
}
await Promise.all(jobs);
window.__ok = 1;
