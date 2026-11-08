// Gera kit3/os-xadrez-3d.js e .css a partir da cena real do jogo. Uso: node xadrez_3d.mjs <pasta com node_modules> (three, react, chess.js, esbuild, tailwindcss)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const KIT = path.dirname(AQUI)
const REPO = path.resolve(KIT, '../../../..')
const NM = path.join(process.argv[2], 'node_modules')
const require = createRequire(path.join(process.argv[2], 'x.js'))
const esbuild = await import(pathToFileURL(require.resolve('esbuild')).href)

await esbuild.build({
  entryPoints: [path.join(AQUI, 'xadrez-3d-entrada.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  jsx: 'automatic',
  target: 'es2020',
  outfile: path.join(KIT, 'os-xadrez-3d.js'),
  nodePaths: [NM],
  alias: { '@': REPO },
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  plugins: [
    {
      name: 'arena',
      setup(b) {
        b.onLoad({ filter: /clock-backdrop\.tsx$/ }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8').replace('/images/chess/clock-arena.webp', 'art/os/jogos/clock-arena.webp'), loader: 'tsx' }))
      },
    },
  ],
  logLevel: 'error',
})
fs.copyFileSync(path.join(REPO, 'public/images/chess/clock-arena.webp'), path.join(KIT, 'art/os/jogos/clock-arena.webp'))

// Só as classes do fundo do relógio, sem o reset do Tailwind (que mexeria no resto do protótipo).
const glob = fs.readFileSync(path.join(REPO, 'app/globals.css'), 'utf8').replace(/\r/g, '')
const ini = glob.indexOf('@keyframes chess-drift')
const fim = glob.indexOf('.chess-anim { animation: none')
const keyframes = glob.slice(ini, glob.lastIndexOf('@media', fim))
const entrada = path.join(process.argv[2], 'xz.src.css')
fs.writeFileSync(entrada, `@layer theme, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n@source "${REPO.replace(/\\/g, '/')}/components/devo/arcade/chess/clock-backdrop.tsx";\n${keyframes}\n@media (prefers-reduced-motion: reduce) { .chess-anim { animation: none !important; } }\n`)
execFileSync(process.execPath, [path.join(NM, '@tailwindcss/cli/dist/index.mjs'), '-i', entrada, '-o', path.join(KIT, 'os-xadrez-3d.css'), '--minify'], { cwd: process.argv[2], stdio: 'inherit' })
for (const f of ['os-xadrez-3d.js', 'os-xadrez-3d.css']) console.log(f, Math.round(fs.statSync(path.join(KIT, f)).size / 1024), 'KB')
