// Renderiza a arte do Escudo de Papelão (as do Xadrez são pintadas: ver compor.py) em PNG 1024 de largura.
// Uso (na raiz do repositório, com node_modules instalado):
//   python3 -m http.server 8765 --bind 127.0.0.1 &
//   node scripts/dev/arte-cartas/render.mjs [ids...]   → /var/tmp/render/final-<id>.png
// Depois: redimensionar para public/images/cartas/<id>/arte-{512,768,1024}.webp.
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })
const W = 1024, H = Math.round(W * 144 / 74)
const jobs = {
  escudo: 'p=escudo',
}
const so = process.argv.slice(2)
for (const [id, v] of Object.entries(jobs)) {
  if (so.length && !so.includes(id)) continue
  const pg = await b.newPage({ viewport: { width: W, height: H } })
  pg.on('pageerror', (e) => console.log('pageerror', e.message))
  await pg.goto(`http://127.0.0.1:8765/scripts/dev/arte-cartas/cena.html?w=${W}&${v}`)
  await pg.waitForFunction(() => document.title.startsWith('ok') || document.title.startsWith('erro'), null, { timeout: 600000 })
  console.log(id, await pg.title()); await import('node:fs').then((fs) => fs.mkdirSync('/var/tmp/render', { recursive: true })); await pg.screenshot({ path: `/var/tmp/render/final-${id}.png` }); await pg.close()
}
await b.close()
