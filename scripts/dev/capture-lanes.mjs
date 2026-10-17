// Roteiro de capturas em DUAS FILAS paralelas (o roteiro inteiro em série passava de 90 min).
// Fila A: grupos que usam a conta compartilhada "Veterano" (o save dela não pode ser disputado por dois
// navegadores ao mesmo tempo). Fila B: o resto (contas próprias). Cada fila grava em shots-a/ e shots-b/;
// no fim tudo vai para shots/ com um manifest.json só (tempos de cada fila em `filas`).
//
// Uso (CI): CAPTURE_ONLY="grupo,grupo" node scripts/dev/capture-lanes.mjs
import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const TODOS = ['novato', 'sistema', 'apps', 'jogos', 'genero', 'partidas', 'estilo', 'staff', 'torres', 'desktop', 'narrativa', 'poco', 'salao', 'corporacoes', 'cosmeticos', 'virtudes', 'calendario']
// grupos que mexem no save do Veterano (mesma fila, em série)
const VETERANO = new Set(['sistema', 'apps', 'jogos', 'partidas', 'torres', 'poco', 'salao', 'corporacoes', 'virtudes', 'calendario'])

const pedido = (process.env.CAPTURE_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const grupos = pedido.length ? pedido : TODOS
const filas = [
  { id: 'a', grupos: grupos.filter((g) => VETERANO.has(g)) },
  { id: 'b', grupos: grupos.filter((g) => !VETERANO.has(g)) },
].filter((f) => f.grupos.length)

function rodar(fila) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const out = `shots-${fila.id}`
    const p = spawn(process.execPath, ['scripts/dev/capture.mjs'], {
      env: { ...process.env, CAPTURE_ONLY: fila.grupos.join(','), CAPTURE_OUT: out },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const pref = (b) => b.toString().split('\n').filter(Boolean).map((l) => `[${fila.id}] ${l}`).join('\n') + '\n'
    p.stdout.on('data', (b) => process.stdout.write(pref(b)))
    p.stderr.on('data', (b) => process.stderr.write(pref(b)))
    p.on('close', (code) => resolve({ ...fila, out, code, min: Math.round((Date.now() - t0) / 6000) / 10 }))
  })
}

const t0 = Date.now()
const feitas = await Promise.all(filas.map(rodar))
mkdirSync('shots', { recursive: true })
const manifest = { base: '', shots: [], errors: [], console: [], tempos: [], filas: [] }
for (const f of feitas) {
  manifest.filas.push({ fila: f.id, grupos: f.grupos, minutos: f.min, saida: f.code })
  if (!existsSync(f.out)) continue
  for (const arq of readdirSync(f.out)) if (arq !== 'manifest.json') copyFileSync(`${f.out}/${arq}`, `shots/${arq}`)
  const m = existsSync(`${f.out}/manifest.json`) ? JSON.parse(readFileSync(`${f.out}/manifest.json`, 'utf8')) : null
  if (!m) {
    manifest.errors.push({ step: `fila-${f.id}`, error: `sem manifest (saída ${f.code})` })
    continue
  }
  manifest.base = m.base
  for (const k of ['shots', 'errors', 'console', 'tempos']) manifest[k].push(...(m[k] ?? []))
}
manifest.minutos = Math.round((Date.now() - t0) / 6000) / 10
writeFileSync('shots/manifest.json', JSON.stringify(manifest, null, 2))
console.log(`capturas: ${manifest.shots.length}, erros: ${manifest.errors.length}, console: ${manifest.console.length}, ${manifest.minutos} min (${feitas.map((f) => `${f.id}=${f.min}`).join(', ')})`)
