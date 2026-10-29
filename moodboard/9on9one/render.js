// Renderiza moodboard.svg -> moodboard.png (2x) e assets/*.svg -> assets/*.png (fundo transparente)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 2 });
  const files = [path.join(__dirname, 'moodboard.svg'),
    ...fs.readdirSync(path.join(__dirname, 'assets')).filter(f => f.endsWith('.svg')).map(f => path.join(__dirname, 'assets', f))];
  for (const f of files) {
    const svg = fs.readFileSync(f, 'utf8');
    const [, w, h] = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
    await p.setViewportSize({ width: Math.ceil(+w), height: Math.ceil(+h) });
    await p.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
    await p.screenshot({ path: f.replace(/\.svg$/, '.png'), omitBackground: true });
  }
  await b.close();
})();
