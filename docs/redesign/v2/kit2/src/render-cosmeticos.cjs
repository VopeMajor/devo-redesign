// Renderiza cosmeticos.html (390x844 @2), uma PNG por tela. Servidor estático na raiz do repo: python3 -m http.server 8767
// Uso: node docs/redesign/v2/kit2/src/render-cosmeticos.cjs [tela]
const { createRequire } = require('module');
const req = createRequire('/opt/node-tools/node_modules/x.js');
const { chromium } = req('playwright');
const path = require('path');
const OUT = path.resolve(__dirname, '..');
const BASE = 'http://127.0.0.1:8767/docs/redesign/v2/kit2/cosmeticos.html';
const TELAS = {
  espelho: 'cosmeticos.png', material: 'cosmeticos-material.png', album: 'cosmeticos-album.png',
  revelacao: 'cosmeticos-revelacao.png', cena: 'cosmeticos-cena.png', camadas: 'cosmeticos-camadas.png',
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const [t, f] of Object.entries(TELAS)) {
    if (process.argv[2] && process.argv[2] !== t) continue;
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log('ERRO', t, e.message));
    p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', t, m.text()));
    p.on('requestfailed', (r) => console.log('FALHOU', r.url()));
    p.on('response', (r) => r.status() >= 400 && console.log('HTTP', r.status(), r.url()));
    await p.goto(`${BASE}?tela=${t}&anima=0`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__ok, null, { timeout: 120000 });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, f) });
    await p.close();
    console.log('ok', f);
  }
  await b.close();
})();
