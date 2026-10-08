// Capturas no tamanho de celular para revisão visual (roda no CI contra o banco de teste).
// Gera shots/<nome>.jpg e shots/manifest.json (etapas, erros e erros de console).
//
// IMPORTANTE para quem refizer telas: este roteiro navega pelos NOMES ACESSÍVEIS
// (texto de botões, aria-label, ids #devo-code/#devo-user/#devo-pass/#devo-pass2).
// Se mudar um desses nomes, atualize o roteiro no mesmo commit.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

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

async function device(kind = 'phone') {
  const phone = kind === 'phone'
  const ctx = await browser.newContext({
    viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone,
    hasTouch: phone,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    ...(phone
      ? { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' }
      : {}),
  })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const loc = m.location()
    manifest.console.push({ page: page.url(), text: m.text().slice(0, 300), src: loc?.url?.slice(0, 200) })
  })
  page.on('response', (r) => {
    if (r.status() >= 400) manifest.console.push({ page: page.url(), text: `HTTP ${r.status()}`, src: r.url().slice(0, 200) })
  })
  page.on('pageerror', (e) => manifest.console.push({ page: page.url(), text: `pageerror: ${String(e).slice(0, 400)}` }))
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
    manifest.errors.push({ step: name, error: String(e).slice(0, 1500) })
  }
}

const btn = (page, name, exact = false) => page.getByRole('button', { name, exact }).first()

async function tryClick(locator, timeout = 2500) {
  try {
    if (!(await locator.count())) return false
    await locator.click({ timeout })
    return true
  } catch {
    return false
  }
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

const hexEmail = (name) => `u${Buffer.from(name.toLowerCase(), 'utf8').toString('hex')}@jogador.devo`

/** Avança diálogos: escolhe a primeira opção quando houver escolha; senão Enter. */
async function advanceDialogue(page) {
  const choices = page.locator('[aria-label="Escolhas de diálogo"] button, [aria-label="Escolha o que dizer"] button')
  if (await choices.count()) return tryClick(choices.first())
  // Respostas de perfil no prólogo (nome, gênero…) são botões "▸ opção" sem grupo.
  const option = page.locator('main button').filter({ hasText: '▸' })
  if (await option.count()) return tryClick(option.first())
  const input = page.locator('main input:visible').first()
  if (await input.count()) {
    await input.fill('Aurora').catch(() => {})
    await page.keyboard.press('Enter')
    return true
  }
  await page.keyboard.press('Enter')
  return true
}

// ── 1. Novato: landing → convite → cadastro → prólogo → tutorial → sistema ─────────────
if (want('novato')) {
  const { ctx, page } = await device()
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
    await btn(page, 'Começar').click({ timeout: 4000 })
    await wait(300)
    await shot(page, '02-transicao-acesso')
    await wait(1000)
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
    await wait(400)
    await shot(page, '03-transicao-despertando')
    await wait(3500)
  })
  await step('prologo', async () => {
    for (let i = 0; i < 40; i++) {
      if (i % 2 === 0) await shot(page, `03-prologo-${String(i / 2).padStart(2, '0')}`)
      await wait(1400)
      await advanceDialogue(page)
      if (!(await page.getByText(/pular prólogo/i).count())) break
    }
  })
  await step('tutorial', async () => {
    await wait(2500)
    for (let i = 0; i < 40; i++) {
      if (i % 2 === 0) await shot(page, `04-tutorial-${String(i / 2).padStart(2, '0')}`)
      await wait(1400)
      if (await tryClick(btn(page, /^depois$/i))) break
      await advanceDialogue(page)
    }
    await wait(1500)
    await shot(page, '04-tutorial-fim')
  })
  await ctx.close()
}

// ── 2. Contas prontas com save avançado ───────────────────────────────────────────────
const now = Date.now()
const makeSave = (cards, extra = {}) => ({
  v: 1,
  welcomed: true,
  timerEndsAt: now + 51 * 3600_000 + 17 * 60_000,
  inventory: cards.map((cardId, i) => ({ uid: `seed-${i}`, cardId, origin: i < 5 ? 'Kit inicial' : 'Sala de Trocas', acquiredAt: now - i * 3600_000 })),
  notifications: [],
  threads: [],
  tradesCompleted: 3,
  arcadeUnlocked: true,
  owlMet: true,
  javaliMet: true,
  seenApps: ['record', 'pulso', 'mensagens', 'cartas', 'trocas', 'ajustes', 'jogos'],
  ...extra,
})

async function account(name, invite, cards, kind = 'phone', extra = {}) {
  const d = await device(kind)
  await d.page.goto(BASE, { waitUntil: 'networkidle' })
  const up = await api(d.page, '/api/auth/sign-up/email', { email: hexEmail(name), password: 'teste123', name, username: name, displayUsername: name }, { 'x-devo-invite': invite })
  if (up.status >= 400) {
    const inn = await api(d.page, '/api/auth/sign-in/username', { username: name, password: 'teste123' })
    if (inn.status >= 400) manifest.errors.push({ step: `${name}-auth`, error: `signup ${up.status} ${up.text}; signin ${inn.status}` })
  }
  const saved = await api(d.page, '/api/save', makeSave(cards, extra))
  if (saved.status >= 400) manifest.errors.push({ step: `${name}-save`, error: `${saved.status} ${saved.text}` })
  return d
}

async function enterOS(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1000)
  await btn(page, 'Continuar').click({ timeout: 15000 })
  await wait(3600)
}

async function openApp(page, label) {
  await enterOS(page)
  const exact = page.getByRole('button', { name: label, exact: true })
  if (!(await tryClick(exact.first(), 3000))) await btn(page, label).click({ timeout: 3000 })
  await wait(2600)
}

const VET_CARDS = ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta', 'olho', 'relogio', 'laminas', 'chave', 'coroa']

if (want('sistema') || want('apps') || want('jogos')) {
  const { ctx, page } = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)

  if (want('sistema')) {
    await step('home', async () => {
      await enterOS(page)
      await shot(page, '10-home')
      await page.getByLabel('Abrir central de avisos').first().click({ timeout: 3000 })
      await wait(900)
      await shot(page, '10-home-avisos')
    })
  }

  if (want('apps')) {
    await step('record', async () => {
      await openApp(page, 'Record')
      await shot(page, '20-record')
      await page.mouse.wheel(0, 800)
      await wait(600)
      await shot(page, '20-record-scroll')
      for (const tab of ['Deadly Votes', 'Convites']) {
        if (await tryClick(page.getByRole('tab', { name: new RegExp(tab, 'i') }).first())) {
          await wait(1500)
          await shot(page, `20-record-${tab.toLowerCase().replace(/\s+/g, '-')}`)
        }
      }
    })
    await step('pulso', async () => {
      await openApp(page, 'Pulso')
      await shot(page, '21-pulso')
      await page.mouse.wheel(0, 700)
      await wait(600)
      await shot(page, '21-pulso-scroll')
    })
    await step('mensagens', async () => {
      await openApp(page, 'Mensagens')
      await shot(page, '22-mensagens')
      if (await tryClick(page.getByRole('button', { name: /o rato/i }).first())) {
        await wait(1800)
        await shot(page, '22-mensagens-conversa')
      }
    })
    await step('cartas', async () => {
      await openApp(page, 'Cartas')
      await shot(page, '23-cartas')
      await page.mouse.wheel(0, 700)
      await wait(600)
      await shot(page, '23-cartas-scroll')
      const card = page.locator('[aria-label="Cartas DEVO"] button').first()
      if (await tryClick(card)) {
        await wait(1500)
        await shot(page, '23-cartas-detalhe')
      }
    })
    await step('trocas', async () => {
      await openApp(page, 'Sala de Trocas')
      await shot(page, '24-trocas')
      // Sala 1 (Às cegas): regra explicada ao entrar, raridade oculta, frases prontas.
      if (await tryClick(page.getByRole('button', { name: /^Sala 1,/ }).first())) {
        await wait(1500)
        await shot(page, '24-trocas-sala')
        await tryClick(page.getByRole('button', { name: /^Colocar / }).first())
        await wait(7500)
        await shot(page, '24-trocas-sala-negociando')
        await tryClick(page.getByRole('button', { name: 'Qual o tipo da sua carta?' }).first())
        await wait(3800)
        await shot(page, '24-trocas-sala-frase')
        await tryClick(btn(page, /abandonar|sair/i))
        await wait(800)
        await tryClick(btn(page, /voltar ao corredor/i))
        await wait(800)
      }
      // Sala 3 (Sem retorno): sair depois de pôr a carta pede confirmação e custa a carta.
      if (await tryClick(page.getByRole('button', { name: /^Sala 3,/ }).first())) {
        await wait(1200)
        await shot(page, '24-trocas-sem-retorno')
        await tryClick(page.getByRole('button', { name: /^Colocar / }).first())
        await wait(800)
        await tryClick(btn(page, /^abandonar$/i))
        await wait(600)
        await shot(page, '24-trocas-sem-retorno-confirmar')
        await tryClick(btn(page, /perder a carta/i))
        await wait(800)
        await shot(page, '24-trocas-sem-retorno-perdeu')
      }
    })
    await step('ajustes', async () => {
      await openApp(page, 'Ajustes')
      await shot(page, '25-ajustes')
      await page.mouse.wheel(0, 800)
      await wait(600)
      await shot(page, '25-ajustes-scroll')
      // Reiniciar sessão: dois passos, salva no servidor, não pede convite.
      await btn(page, 'Reiniciar sessão', true).click({ timeout: 3000 })
      await wait(500)
      await page.mouse.wheel(0, 800)
      await shot(page, '25-ajustes-reiniciar-confirmar')
      await btn(page, 'Sim, reiniciar', true).click({ timeout: 3000 })
      await wait(2500)
      await shot(page, '25-ajustes-reiniciar-feito')
      await openApp(page, 'Pulso')
      await shot(page, '25-ajustes-reiniciar-pulso')
    })
  }

  if (want('jogos')) {
    await step('jogos-mesa', async () => {
      await openApp(page, 'Sala de Jogos')
      await shot(page, '30-jogos-mesa')
      await page.mouse.wheel(0, 700)
      await wait(700)
      await shot(page, '30-jogos-mesa-scroll')
      await page.mouse.wheel(0, 900)
      await wait(700)
      await shot(page, '30-jogos-mesa-scroll2')
    })
    for (const tab of ['Agenda', 'Ranking', 'Apostas']) {
      await step(`jogos-${tab}`, async () => {
        await openApp(page, 'Sala de Jogos')
        // As seções da Sala de Jogos são abas do kit (role="tab").
        await page.getByRole('tab', { name: tab, exact: true }).first().click({ timeout: 3000 })
        await wait(1800)
        await shot(page, `31-jogos-${tab.toLowerCase()}`)
        if (tab !== 'Apostas') {
          await page.mouse.move(195, 600)
          await page.mouse.wheel(0, 800)
          await wait(700)
          await shot(page, `31-jogos-${tab.toLowerCase()}-scroll`)
        }
        if (tab === 'Ranking' && (await tryClick(page.getByRole('button', { name: 'Memory Rush', exact: true }).first()))) {
          await wait(1200)
          await shot(page, '31-jogos-ranking-jogo')
        }
      })
    }
    // Tutoriais contra o bot.
    for (const game of ['Memory Rush', 'Living Chess', 'Bomba Quente', 'Blefe']) {
      const slug = game.toLowerCase().replace(/\s+/g, '-')
      await step(`tutorial-${slug}`, async () => {
        await openApp(page, 'Sala de Jogos')
        const card = page.locator('[aria-label="Jogos da semana"] > *').filter({ hasText: new RegExp(game, 'i') }).first()
        await card.getByRole('button', { name: /tutorial/i }).first().click({ timeout: 3000 })
        await wait(3000)
        await shot(page, `32-tutorial-${slug}-a`)
        await wait(5000)
        await shot(page, `32-tutorial-${slug}-b`)
        await wait(8000)
        await shot(page, `32-tutorial-${slug}-c`)
      })
    }
    // Fila "Procurando oponente" (sozinho na fila) e cancelar.
    await step('jogos-fila', async () => {
      await openApp(page, 'Sala de Jogos')
      const card = page.locator('[aria-label="Jogos da semana"] > *').filter({ hasText: /Memory Rush/i }).first()
      await card.getByRole('button', { name: /jogar/i }).first().click({ timeout: 3000 })
      await wait(2500)
      await shot(page, '33-jogos-fila')
      await btn(page, 'Cancelar', true).click({ timeout: 3000 })
      await wait(800)
      await shot(page, '33-jogos-fila-cancelada')
    })
    await step('jogos-mesa-fim', async () => {
      await openApp(page, 'Sala de Jogos')
      await page.mouse.move(195, 600)
      await page.mouse.wheel(0, 2600)
      await wait(800)
      await shot(page, '30-jogos-mesa-scroll3')
      await page.mouse.wheel(0, 1600)
      await wait(800)
      await shot(page, '30-jogos-mesa-chat')
    })
    // Apresentação do Javali para quem nunca entrou na sala.
    await step('jogos-javali', async () => {
      const g = await account('Convidado', 'DEVO-TEST-0004', VET_CARDS, 'phone', { javaliMet: false })
      await openApp(g.page, 'Sala de Jogos')
      for (let i = 0; i < 4; i++) {
        await shot(g.page, `34-javali-${i}`)
        await tryClick(g.page.getByRole('button', { name: /continuar/i }).last())
        await wait(900)
      }
      await g.ctx.close()
    })
  }
  await ctx.close()
}

// ── 2b. Primeiras visitas: aula da Coruja, apresentação do Javali, retrato do Herdeiro ───────
if (want('apps')) {
  const { ctx, page } = await account('Visitante', 'DEVO-TEST-0003', VET_CARDS, 'phone', { owlMet: false, javaliMet: false })
  await step('coruja', async () => {
    await openApp(page, 'Cartas')
    for (let i = 0; i < 26; i++) {
      if ([1, 3, 5, 16, 18].includes(i)) await shot(page, `26-coruja-${String(i).padStart(2, '0')}`)
      const quiz = page.getByRole('button', { name: /^Rara$/ })
      if (await quiz.count()) await tryClick(quiz.first())
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur()).catch(() => {})
      await page.keyboard.press('Enter')
      await wait(700)
      await page.keyboard.press('Enter')
      await wait(500)
    }
  })
  await step('javali-intro', async () => {
    await openApp(page, 'Sala de Jogos')
    for (let i = 0; i < 4; i++) {
      await shot(page, `27-javali-${i}`)
      await tryClick(page.getByRole('button', { name: /continuar/i }).last())
      await wait(900)
    }
  })
  await step('herdeiro', async () => {
    await openApp(page, 'Mensagens')
    if (await tryClick(page.getByRole('button', { name: /herdeiro/i }).first())) {
      await wait(1500)
      await shot(page, '28-mensagens-herdeiro')
    }
  })
  await ctx.close()
}

// ── 3. Partidas reais entre duas contas (fila online) ───────────────────────────────────
if (want('partidas')) {
  const A = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
  const B = await account('Rival', 'DEVO-TEST-0002', ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta'])
  for (const game of ['Memory Rush', 'Living Chess', 'Bomba Quente', 'Blefe']) {
    const slug = game.toLowerCase().replace(/\s+/g, '-')
    await step(`partida-${slug}`, async () => {
      for (const { page } of [A, B]) {
        await openApp(page, 'Sala de Jogos')
        const card = page.locator('[aria-label="Jogos da semana"] > *').filter({ hasText: new RegExp(game, 'i') }).first()
        await card.getByRole('button', { name: /jogar/i }).first().click({ timeout: 3000 })
        await wait(800)
      }
      await shot(A.page, `40-partida-${slug}-fila`)
      await wait(6000)
      await shot(A.page, `40-partida-${slug}-a1`)
      await shot(B.page, `40-partida-${slug}-b1`)
      await wait(10000)
      await shot(A.page, `40-partida-${slug}-a2`)
      await shot(B.page, `40-partida-${slug}-b2`)
    })
  }
  await A.ctx.close()
  await B.ctx.close()
}

// ── 3b. Vitrine da identidade (/estilo; requer DEVO_STYLEGUIDE=1 em produção) ─────────────
if (want('estilo')) {
  await step('estilo', async () => {
    const { ctx, page } = await device()
    await page.goto(`${BASE}/estilo`, { waitUntil: 'networkidle' })
    await wait(3500)
    await shot(page, '80-estilo-00-topo')
    for (const id of ['cores', 'tipografia', 'botoes', 'molduras', 'selos', 'navegacao', 'avisos', 'cartas', 'movimento']) {
      await page.locator(`[data-estilo="${id}"]`).scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
      await page.evaluate((i) => document.querySelector(`[data-estilo="${i}"]`)?.scrollIntoView({ block: 'start' }), id)
      await wait(1200)
      await shot(page, `80-estilo-${id}`)
    }
    await page.mouse.wheel(0, 760)
    await wait(900)
    await shot(page, '80-estilo-movimento-2')
    // Estado pressionado/foco num botão (teclado).
    await page.evaluate(() => document.querySelector('[data-estilo="botoes"]')?.scrollIntoView({ block: 'start' }))
    await wait(400)
    await page.keyboard.press('Tab')
    await page.locator('[data-estilo="botoes"] button').first().focus().catch(() => {})
    await wait(500)
    await shot(page, '80-estilo-botoes-foco')
    // Folha (Sheet) aberta.
    await tryClick(btn(page, 'Abrir folha'))
    await wait(900)
    await shot(page, '81-estilo-sheet')
    await page.keyboard.press('Escape')
    await wait(600)
    await tryClick(btn(page, 'Abrir diálogo'))
    await wait(900)
    await shot(page, '81-estilo-dialog')
    await page.keyboard.press('Escape')
    await wait(600)
    // Cortina em três momentos.
    await page.evaluate(() => document.querySelector('[data-estilo="movimento"]')?.scrollIntoView({ block: 'start' }))
    await wait(400)
    for (const [label, slug] of [['Cortina · avançar', 'avancar'], ['Cortina · alerta', 'alerta']]) {
      if (await tryClick(btn(page, label))) {
        await wait(260)
        await shot(page, `82-estilo-cortina-${slug}-a`)
        await wait(500)
        await shot(page, `82-estilo-cortina-${slug}-b`)
        await wait(1300)
      }
    }
    // Cenas 3D: cada preset, normal e alerta.
    for (const p of ['sigil', 'cathedral', 'table', 'corridor', 'tribunal']) {
      await page.evaluate((i) => document.querySelector(`[data-estilo-preset="${i}"]`)?.scrollIntoView({ block: 'center' }), p)
      await wait(3500)
      await shot(page, `83-estilo-cena-${p}`)
    }
    if (await tryClick(btn(page, 'Modo alerta'))) {
      await page.evaluate(() => document.querySelector('[data-estilo-preset="tribunal"]')?.scrollIntoView({ block: 'center' }))
      await wait(2500)
      await shot(page, '83-estilo-cena-tribunal-alerta')
      await page.evaluate(() => document.querySelector('[data-estilo-preset="table"]')?.scrollIntoView({ block: 'center' }))
      await wait(2000)
      await shot(page, '83-estilo-cena-table-alerta')
    }
    await ctx.close()
  })
  await step('estilo-desktop', async () => {
    const { ctx, page } = await device('desktop')
    await page.goto(`${BASE}/estilo`, { waitUntil: 'networkidle' })
    await wait(3500)
    await shot(page, '91-desktop-estilo')
    await ctx.close()
  })
}

// ── 4. Uma referência no desktop ────────────────────────────────────────────────────────
if (want('desktop')) {
  await step('desktop', async () => {
    const { ctx, page } = await device('desktop')
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(2000)
    await shot(page, '90-desktop-landing')
    await ctx.close()
  })
}

await browser.close()
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`capturas: ${manifest.shots.length}, erros: ${manifest.errors.length}, console: ${manifest.console.length}`)
