// Gera kit3/os-blefe-motor.js com as regras e o bot do jogo, sem alterar nada (lib/devo/arcade/bluff.ts). Uso: node blefe_motor.mjs <pasta com esbuild>
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(AQUI, '../../../../..')
const require = createRequire(path.join(process.argv[2], 'x.js'))
const esbuild = await import(pathToFileURL(require.resolve('esbuild')).href)
await esbuild.build({ entryPoints: [path.join(REPO, 'lib/devo/arcade/bluff.ts')], bundle: true, minifySyntax: true, format: 'iife', globalName: 'BF', target: 'es2020', outfile: path.join(AQUI, '..', 'os-blefe-motor.js'), legalComments: 'none', logLevel: 'error', banner: { js: '// Gerado por art-src/blefe_motor.mjs a partir de lib/devo/arcade/bluff.ts. Não editar.' } })
console.log('ok')
