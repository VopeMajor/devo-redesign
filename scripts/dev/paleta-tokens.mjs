// Paleta do Refinamento 4 (docs/redesign/IDENTIDADE.md §0): troca cores fixas por tokens.
//   node scripts/dev/paleta-tokens.mjs [--dry] [pasta ...]
// 1) Em contextos CSS (valores arbitrários do Tailwind [...] e propriedades CSS de objetos style):
//    hex/rgba conhecidos → var(--dv-*) / rgb(var(--dv-*-rgb) / a) / utilitário nomeado (bg-dv-ink…).
// 2) Em qualquer lugar (inclusive atributos SVG): ametista antiga saturada → ametista dessaturada (literal).
// Atributos SVG e canvas/three nunca recebem var(). Arte de cosméticos e jogos fica de fora.
// Sem pastas, varre components/ e app/. Idempotente: pode rodar de novo depois de um merge.
import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const dry = process.argv.includes('--dry')
const alvos = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const AMETISTA = { '#8a7cc8': '#8f86b4', '#c2b9ec': '#cbc6dc', '#463d78': '#4d4668', '#2b2450': '#2a2638', '#f3efff': '#f1eff4', '#e4defa': '#e2e0dc', '#5a4f8f': '#5a1d26', '#4e4580': '#4d4668' }
const EXCLUDE = [/cosmeticos\/art\//, /arcade\/games\//, /arcade\/chess\//, /kit\/scene\//, /system\/photo-picker/, /\/estilo\//]
const HEX = {
  '#0c0c0e': 'ink', '#121214': 'ink-2', '#151517': 'ink-2', '#1f1f22': 'ink-3', '#2c2c31': 'ink-4',
  '#8a7cc8': 'amethyst', '#c2b9ec': 'amethyst-text', '#d4cfee': 'amethyst-text', '#cbc5e8': 'amethyst-text',
  '#a3121f': 'blood', '#3f060b': 'blood-deep', '#ff6670': 'blood-text', '#1d1a2b': 'cobalt-dim', '#1c1c1f': 'block',
  '#eeedeb': 'text', '#0d0d0f': 'ink', '#0e0e10': 'ink', '#0b0b0d': 'ink', '#08080a': 'ink', '#111113': 'ink-2', '#161618': 'ink-2', '#1a1a1d': 'ink-3', '#1c1b20': 'ink-3', '#23212c': 'ink-3', '#242329': 'ink-4', '#0b0b10': 'ink', '#1d0609': 'wine-0', '#2a070b': 'wine', '#1a0507': 'wine-0', '#5a4f8f': 'cobalt', '#463d78': 'cobalt-deep', '#4e4580': 'amethyst-deep',
  '#b7b3c9': 'violet-text', '#6f6b82': 'violet', '#19181f': 'night', '#2b2a35': 'night-2',
}
const RGB = {
  '138,124,200': 'amethyst-rgb', '168,156,224': 'amethyst-rgb', '168,155,224': 'amethyst-rgb', '140,134,200': 'amethyst-rgb',
  '194,185,236': 'amethyst-text-rgb', '163,18,31': 'blood-rgb', '63,6,11': 'wine-rgb', '12,12,14': 'ink-rgb', '10,10,12': 'ink-rgb',
  '238,237,235': 'text-rgb', '111,107,130': 'violet-rgb',
}
const PREFIX = ['bg', 'text', 'border', 'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y', 'from', 'via', 'to', 'fill', 'stroke', 'accent', 'outline', 'ring', 'decoration', 'caret', 'divide', 'placeholder']
let total = 0
const files = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(tsx|ts|css)$/.test(e.name) && !EXCLUDE.some((r) => r.test(p))) files.push(p)
  }
}
for (const d of alvos.length ? alvos : ['components', 'app']) walk(path.join(root, d))
const colorRe = /#[0-9a-fA-F]{6}(?![0-9a-fA-F])|rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g
function swap(s, spaceOk) {
  return s.replace(colorRe, (m, r, g, b, a) => {
    if (m.startsWith('#')) {
      const t = HEX[m.toLowerCase()]
      return t ? `var(--dv-${t})` : m
    }
    const t = RGB[`${r},${g},${b}`]
    return t ? `rgb(var(--dv-${t})${spaceOk ? ' / ' : '/'}${a})` : m
  })
}
const report = {}
const ametista = (s) => s.replace(/#(8a7cc8|c2b9ec|463d78|2b2450|f3efff|e4defa|5a4f8f|4e4580)(?![0-9a-fA-F])/gi, (m) => AMETISTA[m.toLowerCase()])
for (const f of files) {
  if (/kit\/tokens\.ts$/.test(f)) continue
  const src = fs.readFileSync(f, 'utf8')
  let out
  if (f.endsWith('.css')) {
    // só fora de :root/definições de token (globals.css é editado à mão)
    if (f.endsWith('globals.css')) continue
    out = swap(src, true)
  } else {
    out = src
      // 1) classe inteira prefix-[#hex] (com /opacidade opcional) → utilitário nomeado
      .replace(/(?<![\w-])((?:[\w-]+:)*)(-?)([a-z-]+)-\[(#[0-9a-fA-F]{6})\]/g, (m, v, neg, pre, hex) => {
        const t = HEX[hex.toLowerCase()]
        return t && PREFIX.includes(pre) ? `${v}${neg}${pre}-dv-${t}` : m
      })
      // 2) qualquer outro valor arbitrário [...] dentro de strings de classe
      .replace(/\[([^\]\s'"`{}]*(?:#[0-9a-fA-F]{6}|rgba\()[^\]\s'"`{}]*)\]/g, (m, inner) => `[${swap(inner, false)}]`)
      // 3) propriedades CSS em objetos style
      .replace(/\b(background|backgroundColor|backgroundImage|boxShadow|color|borderColor|textShadow|filter|outlineColor|border|borderTop|borderBottom|WebkitTextStroke)\s*:\s*(['"`])([^'"`]*)\2/g, (m, k, q, v) => `${k}: ${q}${swap(v, true)}${q}`)
  }
  out = ametista(out)
  if (out !== src) {
    const n = (src.match(colorRe) || []).length - (out.match(colorRe) || []).length
    total += n
    report[path.relative(root, f)] = n
    if (!dry) fs.writeFileSync(f, out)
  }
}
console.log(JSON.stringify(report, null, 1))
console.log('total substituídas:', total)
