// Renderiza o kit2 com Playwright. Uso: node render.cjs [tela ...]
// Servidor estático NA RAIZ DO REPOSITÓRIO (as peças 3D importam node_modules/three):
//   cd <raiz do repo> && python3 -m http.server 8767
const { createRequire } = require('module');
const req = createRequire('/opt/node-tools/node_modules/x.js');
const { chromium } = req('playwright');
const path = require('path');
const OUT = path.resolve(__dirname, '..');
const BASE = 'http://127.0.0.1:8767/docs/redesign/v2/kit2/src/';
const TELAS = ['home', 'explorar', 'casa', 'cutin', 'confidentes', 'mapa', 'torre', 'dv', 'poco', 'vitrine', 'inventario', 'carta'];
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function abrir(ctx, url) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERRO', url, e.message));
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => window.__ok, null, { timeout: 180000 });
  await p.waitForTimeout(400);
  return p;
}

(async () => {
  const pedidas = process.argv.slice(2);
  const quer = (t) => !pedidas.length || pedidas.includes(t);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ARGS });
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const t of TELAS) {
    if (!quer(t)) continue;
    const p = await abrir(mob, 'celular.html?tela=' + t);
    await p.screenshot({ path: path.join(OUT, t + '.png') });
    await p.close();
    console.log('ok', t);
  }
  if (quer('cutin-quadros')) {
    for (const q of [1, 2]) {
      const p = await abrir(mob, `celular.html?tela=cutin&quadro=${q}`);
      await p.screenshot({ path: path.join(OUT, `cutin-q${q}.png`) });
      await p.close();
    }
    console.log('ok cutin-quadros');
  }
  if (quer('desktop')) {
    const d = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const p = await abrir(d, 'desktop.html');
    await p.screenshot({ path: path.join(OUT, 'desktop.png') });
    console.log('ok desktop');
  }
  if (quer('prancha')) {
    const d = await browser.newContext({ viewport: { width: 2580, height: 1000 }, deviceScaleFactor: 1 });
    const p = await abrir(d, 'celular.html');
    await p.screenshot({ path: path.join(OUT, 'kit2-celular.png'), fullPage: true });
    console.log('ok prancha');
  }
  await browser.close();
})();
