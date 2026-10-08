// Capturas no tamanho de celular para revisão visual (roda no CI contra o banco de teste).
// Gera shots/<nome>.png e shots/manifest.json com erros de console de cada etapa.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
// ESM ignora NODE_PATH: resolve o Playwright instalado fora do projeto (ou no próprio projeto).
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url)
const { chromium } = require('playwright')

const BASE = process.env.CAPTURE_URL ?? 'http://localhost:3000'
const OUT = 'shots'
const ONLY = (process.env.CAPTURE_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean)
mkdirSync(OUT, { recursive: true })

const manifest = { base: BASE, shots: [], errors: [], console: [] }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const want = (group) => ONLY.length === 0 || ONLY.includes(group)

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
})

async function phone() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') manifest.console.push({ url: page.url(), text: m.text().slice(0, 400) })
  })
  page.on('pageerror', (e) => manifest.console.push({ url: page.url(), text: `pageerror: ${String(e).slice(0, 400)}` }))
  return { ctx, page }
}

async function shot(page, name, note = '') {
  try {
    await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 })
    manifest.shots.push({ name, note, url: page.url() })
  } catch (e) {
    manifest.errors.push({ step: name, error: String(e).slice(0, 300) })
  }
}

async function step(name, fn) {
  try {
    await fn()
  } catch (e) {
    manifest.errors.push({ step: name, error: String(e).slice(0, 500) })
  }
}

async function clickText(page, text, opts = {}) {
  const loc = page.getByRole('button', { name: text, exact: false }).first()
  if (await loc.count()) return loc.click({ timeout: 4000, ...opts })
  return page.getByText(text, { exact: false }).first().click({ timeout: 4000, ...opts })
}

async function api(page, path, body, headers = {}) {
  return page.evaluate(
    async ([p, b, h]) => {
      const r = await fetch(p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b) })
      return { status: r.status, text: (await r.text()).slice(0, 300) }
    },
    [path, body, headers],
  )
}

function hexEmail(name) {
  return `u${Buffer.from(name.toLowerCase(), 'utf8').toString('hex')}@jogador.devo`
}

// ── 1. Novato: landing → convite → cadastro → prólogo → tutorial ─────────────────────────
if (want('novato')) {
  const { ctx, page } = await phone()
  await step('landing', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(2500)
    await shot(page, '01-landing')
    await page.mouse.wheel(0, 900)
    await wait(600)
    await shot(page, '01-landing-scroll')
  })
  await step('convite', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1200)
    await clickText(page, 'Começar')
    await wait(1200)
    await shot(page, '02-acesso-convite')
    await page.locator('#devo-code').fill('DEVO-TEST-0001')
    await page.keyboard.press('Enter')
    await wait(1500)
    await shot(page, '02-acesso-cadastro')
    await page.locator('#devo-user').fill('Aurora')
    await page.locator('#devo-pass').fill('teste123')
    await page.locator('#devo-pass2').fill('teste123')
    await shot(page, '02-acesso-preenchido')
    await page.keyboard.press('Enter')
    await page.waitForLoadState('networkidle')
    await wait(4000)
  })
  await step('prologo', async () => {
    for (let i = 0; i < 14; i++) {
      await shot(page, `03-prologo-${String(i).padStart(2, '0')}`)
      await page.mouse.click(195, 600)
      await wait(1800)
    }
  })
  await step('tutorial', async () => {
    for (let i = 0; i < 14; i++) {
      await shot(page, `04-tutorial-${String(i).padStart(2, '0')}`)
      const next = page.getByRole('button', { name: /continuar|próximo|avançar|entendi|ok|pular/i }).first()
      if (await next.count()) await next.click({ timeout: 2000 }).catch(() => page.mouse.click(195, 600))
      else await page.mouse.click(195, 600)
      await wait(1800)
    }
  })
  await ctx.close()
}

// ── 2. Veterano: conta pronta com save avançado → sistema e todos os apps ─────────────
const VET = 'Veterano'
const now = Date.now()
const save = {
  v: 1,
  welcomed: true,
  timerEndsAt: now + 51 * 3600_000 + 17 * 60_000,
  inventory: ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta', 'olho', 'relogio', 'laminas', 'chave'].map((cardId, i) => ({
    uid: `seed-${i}`,
    cardId,
    origin: i < 5 ? 'Kit inicial' : 'Sala de Trocas',
    acquiredAt: now - i * 3600_000,
  })),
  notifications: [],
  threads: [],
  tradesCompleted: 3,
  arcadeUnlocked: true,
  owlMet: true,
  javaliMet: true,
  seenApps: ['record', 'pulso', 'mensagens', 'cartas', 'trocas', 'ajustes', 'jogos'],
}

async function veteran() {
  const { ctx, page } = await phone()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const signUp = await api(
    page,
    '/api/auth/sign-up/email',
    { email: hexEmail(VET), password: 'teste123', name: VET, username: VET, displayUsername: VET },
    { 'x-devo-invite': 'DEVO-TEST-ADM1' },
  )
  if (signUp.status >= 400) {
    const signIn = await api(page, '/api/auth/sign-in/username', { username: VET, password: 'teste123' })
    manifest.errors.push({ step: 'veterano-auth', error: `signup ${signUp.status} ${signUp.text}; signin ${signIn.status}` })
  }
  const saved = await api(page, '/api/save', save)
  if (saved.status >= 400) manifest.errors.push({ step: 'veterano-save', error: `${saved.status} ${saved.text}` })
  return { ctx, page }
}

async function enterOS(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1200)
  await clickText(page, 'Continuar')
  await wait(3500)
}

const APPS = [
  ['record', 'Record'],
  ['pulso', 'Pulso'],
  ['mensagens', 'Mensagens'],
  ['cartas', 'Cartas'],
  ['trocas', 'Sala de Trocas'],
  ['ajustes', 'Ajustes'],
  ['jogos', 'Sala de Jogos'],
]

if (want('sistema') || want('apps') || want('jogos')) {
  const { ctx, page } = await veteran()
  if (want('sistema')) {
    await step('home', async () => {
      await enterOS(page)
      await shot(page, '10-home')
      await page.getByLabel('Abrir central de avisos').first().click({ timeout: 3000 })
      await wait(900)
      await shot(page, '10-home-avisos')
    })
  }
  for (const [id, label] of APPS) {
    if (!want('apps') && !(id === 'jogos' && want('jogos'))) continue
    await step(`app-${id}`, async () => {
      await enterOS(page)
      await clickText(page, label)
      await wait(2800)
      await shot(page, `20-app-${id}`)
      await page.mouse.wheel(0, 700)
      await wait(700)
      await shot(page, `20-app-${id}-scroll`)
    })
  }
  if (want('jogos')) {
    for (const game of ['Memory Rush', 'Living Chess', 'Bomba Quente', 'Blefe', 'Ranking', 'Agenda']) {
      await step(`jogo-${game}`, async () => {
        await enterOS(page)
        await clickText(page, 'Sala de Jogos')
        await wait(2500)
        await clickText(page, game)
        await wait(2500)
        await shot(page, `30-jogos-${game.toLowerCase().replace(/\s+/g, '-')}`)
        const play = page.getByRole('button', { name: /jogar|treino|treinar|entrar|tutorial/i }).first()
        if (await play.count()) {
          await play.click({ timeout: 2500 })
          await wait(4000)
          await shot(page, `30-jogos-${game.toLowerCase().replace(/\s+/g, '-')}-partida`)
        }
      })
    }
  }
  await ctx.close()
}

await browser.close()
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`capturas: ${manifest.shots.length}, erros: ${manifest.errors.length}, console: ${manifest.console.length}`)
