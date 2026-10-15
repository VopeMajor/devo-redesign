// Lista os pacotes que mais pesam num metafile do esbuild (bytes no arquivo de saída, sem compressão).
// Uso: node .github/scripts/cf-bundle-top.mjs <arquivo.meta.json>
import { readFileSync } from 'node:fs'

const meta = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const byPkg = new Map()
let total = 0
for (const [outFile, out] of Object.entries(meta.outputs ?? {})) {
  if (outFile.endsWith('.map')) continue
  for (const [input, info] of Object.entries(out.inputs ?? {})) {
    const m = input.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/)
    const key = m ? m[1] : input.startsWith('.open-next/') || input.startsWith('.next/') ? input.split('/').slice(0, 4).join('/') : '(app) ' + input.split('/').slice(0, 2).join('/')
    byPkg.set(key, (byPkg.get(key) ?? 0) + info.bytesInOutput)
    total += info.bytesInOutput
  }
}
const kib = (n) => (n / 1024).toFixed(1).padStart(9) + ' KiB'
console.log(`total ${kib(total)}  (${process.argv[2]})`)
for (const [k, v] of [...byPkg].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`${kib(v)}  ${k}`)
