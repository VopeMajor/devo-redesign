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
/** Seção da Mesa da equipe no Record (Casos, Recompensas, Equipe, Jogadores, Convites, Registro, Ajustes). */
const desk = (page, label) =>
  page.getByRole('navigation', { name: 'Seções da mesa' }).getByRole('button', { name: new RegExp(`^${label}`) }).first()

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

/** Avança diálogos: preenche campos de resposta; escolhe a primeira opção quando houver escolha; senão Enter. */
async function advanceDialogue(page) {
  // Campos de perfil no prólogo (rosto: dois campos; idade: numérico). Preenche todos e envia.
  const inputs = page.locator('main input:visible')
  const n = await inputs.count()
  if (n) {
    for (let k = 0; k < n; k++) {
      const el = inputs.nth(k)
      const numeric = (await el.getAttribute('inputmode').catch(() => null)) === 'numeric'
      await el.fill(numeric ? '27' : 'Aurora').catch(() => {})
    }
    await inputs.nth(n - 1).press('Enter').catch(() => {})
    return true
  }
  const choices = page.locator(
    '[aria-label="Escolhas de diálogo"] button:not([disabled]), [aria-label="Escolha o que dizer"] button:not([disabled]), [aria-label="Sua resposta"] button:not([disabled])',
  )
  if (await choices.count()) return tryClick(choices.first())
  // Respostas de perfil antigas (botões "▸ opção" sem grupo).
  const option = page.locator('main button').filter({ hasText: '▸' })
  if (await option.count()) return tryClick(option.first())
  await page.keyboard.press('Enter')
  return true
}

// Congela a cortina da Jornada num instante (ms) para a foto: a animação CSS e o relógio do React
// correm em paralelo, e a foto no CI (renderizador por software) às vezes cai depois do quadro certo.
// Espera a cortina aparecer (role=status com o rótulo), pausa as animações dela em `at` e devolve true.
async function freezeCurtain(page, label, at = 900, timeout = 3000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    const ok = await page
      .evaluate(
        ([label, at]) => {
          const el = [...document.querySelectorAll('[role="status"]')].find((n) => n.textContent?.includes(label))
          if (!el) return false
          for (const a of el.getAnimations({ subtree: true })) {
            a.pause()
            a.currentTime = at
          }
          return true
        },
        [label, at],
      )
      .catch(() => false)
    if (ok) return true
    await wait(40)
  }
  return false
}
async function thawCurtain(page, label) {
  await page
    .evaluate((label) => {
      const el = [...document.querySelectorAll('[role="status"]')].find((n) => n.textContent?.includes(label))
      if (el) for (const a of el.getAnimations({ subtree: true })) a.play()
    }, label)
    .catch(() => {})
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
    // Nome do personagem (DIRECAO-2 §5): é como os NPCs chamam o jogador.
    await page.locator('#devo-char').fill('Lune Arcanjo')
    await page.locator('#devo-pass').fill('teste123')
    await page.locator('#devo-pass2').fill('teste123')
    await shot(page, '02-acesso-preenchido')
    // A cortina "Despertando" dispara logo depois do recarregamento: a espera começa antes do Enter.
    await page.keyboard.press('Enter')
    // Atravessa o recarregamento: procura o rótulo da cortina a cada 100ms (até 20s).
    // A cortina é um role=status com o rótulo; espera ela entrar (até 20s) e fotografa no meio (lâmina cobrindo).
    await page.getByRole('status').filter({ hasText: 'Despertando' }).first().waitFor({ timeout: 20000 }).catch(() => {})
    await wait(600)
    await shot(page, '03-transicao-despertando')
    await wait(3000)
  })
  await step('prologo', async () => {
    // O prólogo tem ~60 falas (cada uma: 1 Enter completa o texto, outro avança). Foto a cada 5 passos.
    let n = 0
    let seenLook = false
    for (let i = 0; i < 220; i++) {
      await wait(800)
      if (i % 5 === 0) await shot(page, `03-prologo-${String(n++).padStart(2, '0')}`)
      // Escolha da segunda aparência (DIRECAO-2 §5): foto do painel antes e depois da Seleção automática.
      if (!seenLook && (await page.getByRole('radiogroup', { name: 'Tipo de aparência' }).count())) {
        seenLook = true
        await wait(700)
        await shot(page, '03-prologo-aparencia')
        await tryClick(btn(page, 'Seleção automática'), 1500)
        await wait(500)
        await shot(page, '03-prologo-aparencia-auto')
        await tryClick(btn(page, 'Responder', true), 1500)
        continue
      }
      await advanceDialogue(page)
      // A última fala do prólogo chama a cortina "Deadly Vote": congela no meio (lâmina cobrindo) e fotografa.
      if (await freezeCurtain(page, 'Deadly Vote', 900, 300)) {
        await shot(page, '03-transicao-deadly-vote')
        await thawCurtain(page, 'Deadly Vote')
        break
      }
      if (!(await page.getByText(/pular prólogo/i).count())) break
    }
  })
  await step('tutorial', async () => {
    await wait(2500)
    // O salão do relógio monta o WebGL ~2,6s depois de entrar: espera o canvas aparecer e assentar.
    await page.locator('main canvas').first().waitFor({ state: 'attached', timeout: 8000 }).catch(() => {})
    await wait(1200)
    let n = 0
    let seenBorder = false
    let seenKabum = false
    for (let i = 0; i < 90; i++) {
      await wait(900)
      if (i % 3 === 0) await shot(page, `04-tutorial-${String(n++).padStart(2, '0')}`)
      const later = btn(page, /^depois$/i)
      if (await later.count()) {
        await wait(900)
        await shot(page, '04-tutorial-pwa')
        await tryClick(later, 1500)
        break
      }
      if (await page.getByText(/pular introdução/i).count()) await advanceDialogue(page)
      // KABUM! (troca sem volta): letreiro em porcelana com o corte rubi, depois que ele bate no diagrama.
      if (!seenKabum && (await page.getByText('Kabum!', { exact: true }).count())) {
        seenKabum = true
        await wait(1500)
        await shot(page, '04-tutorial-kabum')
      }
      // Fronteira noite → papel (DIRECAO-2 §2): a folha de registro sendo impressa, no meio da cortina.
      if (!seenBorder && (await freezeCurtain(page, 'Inicializando DEVO', 1150, 400))) {
        seenBorder = true
        await shot(page, '04-transicao-sistema')
        await thawCurtain(page, 'Inicializando DEVO')
      }
    }
    await wait(1500)
    await shot(page, '04-tutorial-fim')
  })
  // Revelação da Sala de Jogos: save com os 5 apps iniciais vistos e a sala ainda trancada.
  // Página nova (a anterior, no sistema, poderia salvar por cima do save preparado).
  await step('sala-de-jogos-revelacao', async () => {
    await page.close()
    const p2 = await ctx.newPage()
    // Uma página que não é o app (mesma origem, mesmos cookies): nada salva por cima do save preparado.
    await p2.goto(`${BASE}/images/card-back.png`)
    const t = Date.now()
    await api(p2, '/api/save', {
      v: 1,
      welcomed: true,
      timerEndsAt: t + 70 * 3600_000,
      inventory: [],
      notifications: [],
      threads: [],
      tradesCompleted: 0,
      arcadeUnlocked: false,
      seenApps: ['pulso', 'mensagens', 'cartas', 'trocas', 'ajustes'],
    }).then((r) => r.status >= 400 && manifest.errors.push({ step: 'sala-de-jogos-save', error: `${r.status} ${r.text}` }))
    await p2.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1000)
    await btn(p2, 'Continuar').click({ timeout: 15000 })
    await p2.getByText('Novo aplicativo desbloqueado').first().waitFor({ timeout: 12000 })
    await wait(1500)
    await shot(p2, '05-sala-de-jogos-revelacao')
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
  // O nome acessível do ícone é o nome do app (aria-label). No CI (WebGL por software) a página pode
  // ficar ocupada alguns segundos montando a cena 3D da home: espera o ícone visível e dá folga ao clique.
  // Até 3 tentativas: um clique que estoura o tempo com a página ocupada é repetido quando ela respira.
  // (Se o clique entrou mas a confirmação atrasou, o app já está aberto: a folha do app é uma região
  // com o nome dele.)
  const opened = () => page.getByRole('region', { name: label, exact: true }).first().isVisible().catch(() => false)
  for (let attempt = 1; ; attempt++) {
    await exact.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    if (await tryClick(exact.first(), 8000)) break
    await wait(2000)
    if (await opened()) break
    if (attempt === 3) {
      await btn(page, label).click({ timeout: 8000 })
      break
    }
  }
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
    // Transição de abrir/voltar (quadro no meio da animação).
    await step('home-transicao', async () => {
      await enterOS(page)
      // Arma o congelamento ANTES do clique: toda animação WAAPI de 200–700 ms criada a partir daí nasce
      // pausada no ponto pedido (o quadro prova a direção do movimento, não o estado final).
      const freeze = (p) =>
        page.evaluate((pct) => {
          const w = window
          if (!w.__dvAnimate) w.__dvAnimate = Element.prototype.animate
          w.__dvFrozen = []
          Element.prototype.animate = function (k, o) {
            const a = w.__dvAnimate.call(this, k, o)
            const d = typeof o === 'number' ? o : Number(o?.duration) || 0
            if (d > 200 && d < 700) {
              a.pause()
              a.currentTime = d * pct
              w.__dvFrozen.push(a)
            }
            return a
          }
        }, p)
      const resume = () =>
        page.evaluate(() => {
          const w = window
          if (w.__dvAnimate) Element.prototype.animate = w.__dvAnimate
          for (const a of w.__dvFrozen ?? []) a.finish()
          w.__dvFrozen = []
        })
      // abrir: ease-out → aos 14% do tempo a folha está a ~meio caminho, com o corte diagonal visível
      await freeze(0.14)
      await page.getByRole('button', { name: 'Mensagens', exact: true }).first().click({ timeout: 3000 })
      await wait(250)
      await shot(page, '11-transicao-abrir')
      await resume()
      await wait(1500)
      // voltar: ease-in → aos 62% do tempo a folha já saiu ~40% para a direita
      await freeze(0.62)
      await btn(page, 'Voltar ao início', true).click({ timeout: 3000 })
      await wait(250)
      await shot(page, '11-transicao-voltar')
      await resume()
    })
    // Estados do pulso: crítico (< 6h, com avisos na central) e acima de 72h.
    await step('pulso-estados', async () => {
      const t = Date.now()
      const notes = [
        { id: 'cap-n1', appId: 'pulso', title: 'Tempo crítico', body: 'Menos de 6 horas restantes. Jogue para recuperar horas.', createdAt: t - 60_000, tone: 'danger' },
        { id: 'cap-n2', appId: 'mensagens', title: 'O Rato', body: 'Dica do Anfitrião: a Sala de Trocas está aberta.', createdAt: t - 600_000 },
        { id: 'cap-n3', appId: 'cartas', title: 'Nova carta', body: 'Ampulheta foi adicionada ao seu inventário.', createdAt: t - 3_600_000 },
      ]
      await api(page, '/api/save', makeSave(VET_CARDS, { timerEndsAt: t + 4 * 3600_000 + 12 * 60_000, notifications: notes }))
      await enterOS(page)
      await shot(page, '10-home-critico')
      await page.getByLabel('Abrir central de avisos').first().click({ timeout: 3000 })
      await wait(900)
      await shot(page, '10-home-avisos-lista')
      await page.getByLabel('Fechar central de avisos').first().click({ timeout: 3000 })
      await wait(400)
      await page.getByRole('button', { name: 'Pulso', exact: true }).first().click({ timeout: 8000 })
      await wait(2600)
      await shot(page, '21-pulso-critico')
      await api(page, '/api/save', makeSave(VET_CARDS, { timerEndsAt: Date.now() + 90 * 3600_000 }))
      await openApp(page, 'Pulso')
      await shot(page, '21-pulso-excedente')
      await api(page, '/api/save', makeSave(VET_CARDS))
    })
  }

  if (want('apps')) {
    await step('record', async () => {
      await openApp(page, 'Record')
      await shot(page, '20-record')
      await page.mouse.wheel(0, 800)
      await wait(600)
      await shot(page, '20-record-scroll')
      // Equipe (Veterano é Owner): a 3ª aba é a Mesa (casos, recompensas, equipe, convites…); Jogador vê "Convites".
      for (const [tab, name] of [['Deadly Votes', 'deadly-votes'], ['Mesa', 'mesa']]) {
        if (await tryClick(page.getByRole('tab', { name: new RegExp(tab, 'i') }).first())) {
          await wait(1500)
          await shot(page, `20-record-${name}`)
        }
      }
      if (await tryClick(desk(page, 'Convites'))) {
        await wait(1500)
        await shot(page, '20-record-convites')
      }
    })
    // Record (área): foto com recorte, Shuffler embaralhando, cartaz → dossiê do caso, mesa do Dealer.
    await step('record-detalhes', async () => {
      const tab = (name) => page.getByRole('tab', { name: new RegExp(name, 'i') }).first()
      await tryClick(tab('Record File'))
      await wait(1200)
      const file = page.locator('input[type=file][accept*="image"]').first()
      if (await file.count()) {
        await file.setInputFiles('public/images/devo-sigil.png')
        await wait(1500)
        await shot(page, '20-record-foto-ajuste')
        await tryClick(btn(page, 'Salvar foto', true))
        await wait(3000)
        await shot(page, '20-record-foto')
      }
      const shuffler = btn(page, 'Ativar o Card Shuffler', true)
      if (await shuffler.count()) {
        await shuffler.scrollIntoViewIfNeeded().catch(() => {})
        await wait(600)
        await tryClick(shuffler)
        await wait(800)
        await shot(page, '20-record-shuffler')
        await wait(1600)
      }
      await page
        .locator('section[aria-labelledby="dv-history"]')
        .first()
        .evaluate((el) => el.scrollIntoView({ block: 'start' }))
        .catch(() => {})
      await wait(800)
      await shot(page, '20-record-arquivo')
      if (await tryClick(tab('Deadly Votes'))) {
        await wait(1500)
        await page
          .locator('section[aria-labelledby="dv-history"]')
          .first()
          .evaluate((el) => el.scrollIntoView({ block: 'start' }))
          .catch(() => {})
        await wait(800)
        await shot(page, '20-record-deadly-votes-scroll')
        await page
          .getByRole('tablist', { name: 'Seções do registro' })
          .first()
          .evaluate((el) => el.scrollIntoView({ block: 'start' }))
          .catch(() => {})
        await wait(500)
        if (await tryClick(btn(page, 'Ver dossiê do caso'))) {
          await wait(1500)
          await shot(page, '20-record-dossie')
          await tryClick(btn(page, 'Todos os Deadly Votes'))
          await wait(800)
        }
      }
      if (await tryClick(tab('Mesa'))) {
        await wait(1500)
        await tryClick(desk(page, 'Casos'))
        await wait(900)
        await page.getByRole('heading', { name: /Mesa do Dealer/i }).first().scrollIntoViewIfNeeded().catch(() => {})
        await wait(1200)
        await shot(page, '20-record-dealer')
        if (await tryClick(btn(page, /^(Inscrições|Registrar resultados) ·/))) {
          await wait(900)
          await shot(page, '20-record-dealer-resultados')
        }
        const conv = page.getByRole('button', { name: 'Convocar', exact: true }).first()
        await conv.scrollIntoViewIfNeeded().catch(() => {})
        if (await tryClick(conv)) {
          await wait(900)
          await shot(page, '20-record-dealer-convocar')
        }
      }
    })
    // Deadly Vote (Direção 2 §4): o admin lança uma edição, se inscreve, abre o caso e informa o link do
    // grupo. Fotografa o inscrito com "Entrar no grupo", o caso em andamento sem inscrição, os cinco
    // estados (livro + arquivo), os dossiês de falha/cancelado/andamento, a Mesa com o link e o Gerente.
    await step('record-deadly-vote', async () => {
      const post = (body) => api(page, '/api/record', body)
      const made = await post({
        action: 'create',
        title: 'Valsa do Relógio Parado',
        arc: 'Arco II',
        briefing: 'Quem parar de dançar perde o compasso. Quem perder o compasso perde horas.',
        startsAt: Date.now() - 20 * 60_000,
        maxParticipants: 8,
      })
      const id = (() => {
        try {
          return JSON.parse(made.text).id
        } catch {
          return null
        }
      })()
      if (!id) throw new Error(`create: ${made.status} ${made.text}`)
      for (const body of [
        { action: 'join', voteId: id },
        { action: 'status', voteId: id, status: 'em-progresso' },
        { action: 'group', voteId: id, groupUrl: 'https://chat.whatsapp.com/DevoTesteValsa0002' },
      ]) {
        const r = await post(body)
        if (r.status >= 400) manifest.errors.push({ step: `record-deadly-vote-${body.action}`, error: `${r.status} ${r.text}` })
      }
      const tab = (name) => page.getByRole('tab', { name: new RegExp(name, 'i') }).first()
      const toView = (sel, block = 'start') =>
        page
          .locator(sel)
          .first()
          .evaluate((el, b) => el.scrollIntoView({ block: b }), block)
          .catch(() => {})
      await openApp(page, 'Record')
      await shot(page, '20-record-dv-gerente')
      await toView('section[aria-label="Avisos do Gerente"]', 'center')
      await wait(700)
      await shot(page, '20-record-dv-gerente-aviso')
      if (await tryClick(tab('Deadly Votes'))) {
        await wait(1500)
        await toView('article[aria-label="Convocação: Valsa do Relógio Parado"]')
        await wait(700)
        await shot(page, '20-record-dv-andamento')
        await toView('article[aria-label="Convocação: Valsa do Relógio Parado"]', 'end')
        await wait(600)
        await shot(page, '20-record-dv-entrar-no-grupo')
        await toView('article[aria-label="Convocação: Baile dos Ponteiros"]', 'end')
        await wait(600)
        await shot(page, '20-record-dv-nao-inscrito')
        await toView('section[aria-label="Estados dos casos"]')
        await wait(700)
        await shot(page, '20-record-dv-estados')
        for (const [name, file] of [
          [/Torre Invertida/, '20-record-dv-dossie-falha'],
          [/Jantar de Prata/, '20-record-dv-dossie-cancelado'],
        ]) {
          await toView('section[aria-labelledby="dv-history"]')
          if (await tryClick(btn(page, name))) {
            await wait(1400)
            await shot(page, file)
            await tryClick(btn(page, 'Todos os Deadly Votes'))
            await wait(900)
          }
        }
        await toView('[role="tablist"]')
        if (await tryClick(btn(page, 'Ver dossiê do caso'))) {
          await wait(1400)
          await page.mouse.wheel(0, 700)
          await wait(700)
          await shot(page, '20-record-dv-dossie-andamento')
          await tryClick(btn(page, 'Todos os Deadly Votes'))
          await wait(800)
        }
      }
      if (await tryClick(tab('Mesa'))) {
        await wait(1800)
        await tryClick(desk(page, 'Casos'))
        await wait(900)
        await toView('article[aria-label*="Valsa do Relógio Parado"]')
        await wait(900)
        await shot(page, '20-record-dealer-link')
        await page.mouse.wheel(0, 420)
        await wait(600)
        await shot(page, '20-record-dealer-link-scroll')
      }
    })
    // Record no desktop (janela), com o mesmo Veterano.
    await step('record-desktop', async () => {
      const d = await device('desktop')
      await d.page.goto(BASE, { waitUntil: 'networkidle' })
      const inn = await api(d.page, '/api/auth/sign-in/username', { username: 'Veterano', password: 'teste123' })
      if (inn.status >= 400) throw new Error(`signin ${inn.status} ${inn.text}`)
      await enterOS(d.page)
      await d.page.getByRole('button', { name: 'Record', exact: true }).first().dblclick({ timeout: 10000 })
      await wait(2600)
      await shot(d.page, '20-record-desktop')
      await d.ctx.close()
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
        if (await tryClick(page.locator('[aria-label="Escolhas de diálogo"] button').first())) {
          await wait(1300)
          await shot(page, '22-mensagens-digitando')
          await wait(4500)
          await shot(page, '22-mensagens-resposta')
        }
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
        const dlg = page.getByRole('dialog').last()
        // Ficha da carta (rola o diálogo) e o verso.
        await page.mouse.move(195, 600)
        await page.mouse.wheel(0, 600)
        await wait(300)
        // Garante a rolagem da ficha (o wheel no contexto touch nem sempre chega) e registra as medidas.
        const sc = await dlg
          .locator('.devo-scroll')
          .first()
          .evaluate((el) => {
            if (el.scrollTop < 100) el.scrollTop = 600
            return `scrollTop=${el.scrollTop} scrollHeight=${el.scrollHeight} clientHeight=${el.clientHeight}`
          })
          .catch((e) => String(e).slice(0, 120))
        await wait(400)
        await shot(page, '23-cartas-detalhe-ficha', sc)
        await page.mouse.wheel(0, -900)
        await wait(400)
        if (await tryClick(dlg.getByRole('button', { name: 'Verso', exact: true }).first())) {
          // Congela o giro no meio (~240 ms de 760 ms ≈ 60°) para provar a virada e o brilho de aço.
          await page
            .waitForFunction(
              () => {
                const anims = document.getAnimations().filter((a) => a.effect?.target?.closest?.('[data-stage]'))
                const flip = anims.find((a) => a.effect?.target?.hasAttribute?.('data-flip'))
                if (!flip) return false
                for (const a of anims) {
                  a.pause()
                  a.currentTime = a === flip || String(a.animationName ?? '').startsWith('dvcard-flash') ? 240 : a.currentTime
                }
                return true
              },
              null,
              { timeout: 2000 },
            )
            .catch(() => {})
          await wait(150)
          await shot(page, '23-cartas-detalhe-girando')
          await page.evaluate(() => document.getAnimations().forEach((a) => a.playState === 'paused' && a.play())).catch(() => {})
          await wait(1100)
          await shot(page, '23-cartas-detalhe-verso')
        }
        await tryClick(dlg.getByRole('button', { name: 'Fechar', exact: true }).first())
        await wait(500)
      }
      // Filtro por raridade: Lendárias (moldura champanhe + holografia).
      if (await tryClick(page.getByRole('radio', { name: /Lendária/ }).first())) {
        await page.locator('[aria-label="Cartas DEVO"]').first().scrollIntoViewIfNeeded().catch(() => {})
        await wait(1200)
        await shot(page, '23-cartas-lendarias')
        if (await tryClick(page.locator('[aria-label="Cartas DEVO"] button').first())) {
          await wait(1500)
          await shot(page, '23-cartas-detalhe-lendaria')
          await tryClick(page.getByRole('dialog').last().getByRole('button', { name: 'Fechar', exact: true }).first())
          await wait(400)
        }
        await tryClick(page.getByRole('radio', { name: /Todas/ }).first())
      }
      await page.mouse.wheel(0, 1400)
      await wait(700)
      await shot(page, '23-cartas-colecoes')
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
        await tryClick(btn(page, /voltar ao corredor/i))
        await wait(1000)
      }
      // Corredor rolado até o Protocolo.
      await page.mouse.move(195, 500)
      await page.mouse.wheel(0, 1600)
      await wait(900)
      await shot(page, '24-trocas-scroll')
      await page.mouse.wheel(0, -4000)
      await wait(500)
      // Aceitar e revelar numa sala livre qualquer (o parceiro pode desistir: depende da sorte).
      if (await tryClick(page.locator('button[aria-label^="Sala "]:not([disabled])').first())) {
        await wait(1200)
        await tryClick(page.getByRole('button', { name: /^Colocar / }).first())
        await wait(7500)
        if (await tryClick(btn(page, 'Aceitar troca', true), 1500)) {
          await wait(800)
          await shot(page, '24-trocas-aceitou')
          const revealing = await page
            .getByText('Revelando cartas…')
            .first()
            .waitFor({ timeout: 8000 })
            .then(() => true)
            .catch(() => false)
          if (revealing) {
            await wait(900)
            await shot(page, '24-trocas-revelacao')
            await wait(3200)
            await shot(page, '24-trocas-revelada')
          }
          await tryClick(btn(page, /voltar ao corredor/i))
          await wait(800)
        }
      }
    })
    await step('ajustes', async () => {
      await openApp(page, 'Ajustes')
      await shot(page, '25-ajustes')
      await page.mouse.wheel(0, 800)
      await wait(600)
      await shot(page, '25-ajustes-scroll')
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
          await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 760))
          await wait(900)
          await shot(page, `31-jogos-${tab.toLowerCase()}-scroll`)
          await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 760))
          await wait(900)
          await shot(page, `31-jogos-${tab.toLowerCase()}-scroll2`)
        }
        if (tab === 'Apostas') {
          await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 560))
          await wait(800)
          await shot(page, '31-jogos-apostas-duelos')
          if (await tryClick(page.getByRole('button', { name: /^Apostar em / }).first())) {
            await wait(1200)
            await shot(page, '31-jogos-apostas-folha')
            await page.keyboard.press('Escape')
            await wait(600)
          }
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
        // Se o resultado acabou de abrir, deixa a entrada (faixa, placar, painel) assentar antes do quadro.
        const done = page.getByRole('button', { name: /voltar à mesa/i })
        if (await done.count()) await wait(2500)
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
      const panel = () => page.evaluate((y) => document.querySelector('[role="tabpanel"]')?.scrollBy(0, y), 760)
      for (const name of ['30-jogos-mesa-scroll3', '30-jogos-mesa-scroll4', '30-jogos-mesa-scroll5', '30-jogos-mesa-chat']) {
        await panel()
        await wait(900)
        if (name === '30-jogos-mesa-scroll3') {
          await panel()
          await panel()
          await wait(600)
        }
        await shot(page, name)
      }
    })
    // Apresentação do Javali para quem nunca entrou na sala.
    await step('jogos-javali', async () => {
      // a Mesa do Veterano (cena 3D) fica parada enquanto a segunda conta tira as capturas
      await page.goto('about:blank').catch(() => {})
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
      if ([1, 3, 5, 7, 11, 14, 16, 18].includes(i)) await shot(page, `26-coruja-${String(i).padStart(2, '0')}`)
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

// ── 2c. Gênero nos textos: a mesma conta escolhe "Feminino" no prólogo (convite 0006, Lumina) ──────────
// Compare com o novato (Aurora escolhe a primeira opção, "Masculino") e com a Visitante (2b).
if (want('genero')) {
  // Retoma o prólogo pouco antes da pergunta de gênero (índice 32 = idade) pelo Continuar.
  const { ctx, page } = await account('Lumina', 'DEVO-TEST-0006', [], 'phone', {
    welcomed: false,
    owlMet: false,
    javaliMet: false,
    profile: { appearanceChangesLeft: 1 },
    story: { part: 'prologue', index: 32, vars: { name: 'Lumina' } },
  })
  await step('genero-prologo', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1000)
    await btn(page, 'Continuar').click({ timeout: 15000 })
    await wait(3600)
    const seen = new Set()
    // Fotografa a fala com o texto completo (espera a digitação terminar sozinha; Enter aqui avançaria).
    const grab = async (key, re, name) => {
      if (seen.has(key) || !(await page.getByText(re).count())) return false
      seen.add(key)
      await wait(2500)
      await shot(page, name)
      return true
    }
    for (let i = 0; i < 80; i++) {
      await wait(700)
      const fem = page.getByRole('button', { name: /^Feminino/ })
      if (!seen.has('genero') && (await fem.count())) {
        seen.add('genero')
        await shot(page, '06-genero-escolha')
        await tryClick(fem.first())
        continue
      }
      if (!seen.has('aparencia') && (await page.getByRole('radiogroup', { name: 'Tipo de aparência' }).count())) {
        seen.add('aparencia')
        await tryClick(btn(page, 'Seleção automática'), 1500)
        await wait(400)
        await tryClick(btn(page, 'Responder', true), 1500)
        continue
      }
      await grab('confusa', /Confusa sobre essa parte/, '06-genero-prologo-confusa')
      await grab('estranha', /sentindo estranha agora/, '06-genero-prologo-estranha')
      const thanks = page.getByRole('button', { name: /Obrigada\. Eu vou usar bem/ })
      if (await thanks.count()) {
        await wait(600)
        await shot(page, '06-genero-prologo-obrigada')
        await tryClick(thanks.first())
        await wait(2500)
        await shot(page, '06-genero-prologo-depois')
        break
      }
      await advanceDialogue(page)
    }
  })
  // Já no sistema: save pronto com o perfil feminino e as primeiras visitas por fazer.
  await step('genero-sistema', async () => {
    await page.close()
    const p2 = await ctx.newPage()
    await p2.goto(`${BASE}/images/card-back.png`)
    await api(p2, '/api/save', makeSave(VET_CARDS, { owlMet: false, javaliMet: false, profile: { gender: 'Feminino', age: 24, appearanceChangesLeft: 1 } })).then(
      (r) => r.status >= 400 && manifest.errors.push({ step: 'genero-save', error: `${r.status} ${r.text}` }),
    )
    await enterOS(p2)
    await shot(p2, '07-genero-home')
    await openApp(p2, 'Mensagens')
    if (await tryClick(p2.getByRole('button', { name: /o rato/i }).first())) {
      await wait(1500)
      if (await tryClick(p2.locator('[aria-label="Escolhas de diálogo"] button').first())) {
        await wait(6500)
        await shot(p2, '07-genero-mensagens-rato')
      }
    }
    await openApp(p2, 'Cartas')
    await wait(2500)
    await shot(p2, '07-genero-coruja')
    await openApp(p2, 'Sala de Jogos')
    await wait(1500)
    await shot(p2, '07-genero-javali')
  })
  await ctx.close()
}

// ── 3. Partidas reais entre duas contas (fila online)───────────────────────────────────
if (want('partidas')) {
  const A = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
  const B = await account('Rival', 'DEVO-TEST-0002', ['fosforo', 'escudo', 'moeda', 'dado', 'ampulheta'])
  for (const game of ['Memory Rush', 'Living Chess', 'Bomba Quente', 'Blefe']) {
    const slug = game.toLowerCase().replace(/\s+/g, '-')
    await step(`partida-${slug}`, async () => {
      // Sai da partida anterior pelo próprio jogo (desistência registrada no servidor) e fecha o resultado:
      // sem isso a sala continua ativa e a próxima fila reconecta nela.
      for (const { page } of [A, B]) {
        await tryClick(page.getByRole('button', { name: /desistir e sair/i }).first(), 4000)
        await wait(1500)
        await tryClick(page.getByRole('button', { name: /voltar à mesa/i }).first(), 4000)
      }
      await wait(1000)
      // Depois descarrega as duas páginas: dois 3D (jogo + sala) ao mesmo tempo no WebGL por
      // software do CI travam a página e o clique em "Jogar"/"Sala de Jogos" estoura o tempo.
      for (const { page } of [A, B]) await page.goto('about:blank').catch(() => {})
      for (const [who, { page }] of [['A', A], ['B', B]]) {
        await openApp(page, 'Sala de Jogos')
        const card = page.locator('[aria-label="Jogos da semana"] > *').filter({ hasText: new RegExp(game, 'i') }).first()
        try {
          await card.getByRole('button', { name: /jogar/i }).first().click({ timeout: 12000 })
        } catch (e) {
          // Diagnóstico: o que a conta estava vendo quando "Jogar" não respondeu.
          await shot(page, `40-partida-${slug}-sem-jogar-${who}`)
          throw e
        }
        // Quem saiu da partida anterior sem fechar volta para a sala dela (reconexão) e cai no
        // resultado: fecha o resultado e entra de novo na fila do jogo certo.
        const back = page.getByRole('button', { name: /voltar à mesa/i })
        if (await back.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false)) {
          await shot(page, `40-partida-${slug}-reconexao-${who}`)
          await tryClick(back.first(), 4000)
          await wait(1500)
          await card.getByRole('button', { name: /jogar/i }).first().click({ timeout: 12000 })
          await wait(800)
        }
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
    for (const id of ['cores', 'material', 'emblemas', 'tipografia', 'botoes', 'molduras', 'selos', 'navegacao', 'avisos', 'cartas', 'movimento', 'retratos']) {
      await page.locator(`[data-estilo="${id}"]`).scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
      await page.evaluate((i) => document.querySelector(`[data-estilo="${i}"]`)?.scrollIntoView({ block: 'start' }), id)
      await wait(1200)
      await shot(page, `80-estilo-${id}`)
    }
    await page.mouse.wheel(0, 760)
    await wait(900)
    await shot(page, '80-estilo-movimento-2')
    // Paleta e materiais (§0): mais dois quadros de cada.
    for (const [id, n] of [['cores', 2], ['material', 3], ['emblemas', 2]]) {
      await page.evaluate((i) => document.querySelector(`[data-estilo="${i}"]`)?.scrollIntoView({ block: 'start' }), id)
      for (let k = 2; k <= n; k++) {
        await page.mouse.wheel(0, 760)
        await wait(900)
        await shot(page, `80-estilo-${id}-${k}`)
      }
    }
    // Virada dos dígitos: vários quadros seguidos do relógio acelerado (nenhum pode faltar dígito).
    await page.evaluate(() => document.querySelector('[data-estilo="selos"]')?.scrollIntoView({ block: 'start' }))
    await page.mouse.wheel(0, 700)
    await wait(600)
    for (let i = 0; i < 4; i++) {
      await shot(page, `80-estilo-digitos-${i}`)
      await wait(120)
    }
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
    for (const p of ['clockhall', 'sigil', 'cathedral', 'table', 'corridor', 'tribunal']) {
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
  await step('estilo-interior', async () => {
    const { ctx, page } = await device()
    await page.goto(`${BASE}/estilo`, { waitUntil: 'networkidle' })
    await wait(2500)
    for (const id of ['interior', 'interior-abas', 'interior-controles', 'interior-paineis', 'interior-cartas', 'interior-reservados', 'interior-nav', 'interior-fronteira']) {
      await page.evaluate((i) => document.querySelector(`[data-estilo="${i}"]`)?.scrollIntoView({ block: 'start' }), id)
      await wait(900)
      await shot(page, `84-${id}`)
    }
    await page.evaluate(() => document.querySelector('[data-estilo="interior-paineis"]')?.scrollIntoView({ block: 'start' }))
    await page.mouse.wheel(0, 760)
    await wait(700)
    await shot(page, '84-interior-paineis-2')
    await page.evaluate(() => document.querySelector('[data-estilo="interior-reservados"]')?.scrollIntoView({ block: 'start' }))
    await page.mouse.wheel(0, 760)
    await wait(700)
    await shot(page, '84-interior-reservados-2')
    // Fronteira ao vivo.
    await page.evaluate(() => document.querySelector('[data-estilo="interior-fronteira"]')?.scrollIntoView({ block: 'start' }))
    await wait(400)
    if (await tryClick(btn(page, 'Ver fronteira'))) {
      await wait(250)
      await shot(page, '85-fronteira-a')
      await wait(350)
      await shot(page, '85-fronteira-b')
      await wait(1600)
    }
    // Tela-modelo do Perfil.
    await page.goto(`${BASE}/estilo/perfil`, { waitUntil: 'networkidle' })
    await wait(2000)
    await shot(page, '86-perfil-00')
    for (let i = 1; i <= 5; i++) {
      await page.mouse.wheel(0, 700)
      await wait(700)
      await shot(page, `86-perfil-0${i}`)
    }
    await ctx.close()
    const d = await device('desktop')
    await d.page.goto(`${BASE}/estilo/perfil`, { waitUntil: 'networkidle' })
    await wait(2000)
    await shot(d.page, '93-desktop-perfil')
    await d.ctx.close()
  })
  await step('estilo-desktop', async () => {
    const { ctx, page } = await device('desktop')
    await page.goto(`${BASE}/estilo`, { waitUntil: 'networkidle' })
    await wait(3500)
    await shot(page, '91-desktop-estilo')
    await ctx.close()
  })
}

// ── 3b. Staff e Deadly Vote (DIRECAO-3 §3/§4): a Mesa do Record por cargo ──────────────────────────────
// Contas do seed ligadas a um login pelo cookie devo_player (ver 90-seed.sql): Matheus (jogador comum),
// Narrador (Dealer), Mordomo (Anfitrião) e Sentinela (Owner, nunca revelado).
if (want('staff')) {
  const SEED = {
    Matheus: '00000000-0000-4000-8000-000000000003',
    Narrador: '00000000-0000-4000-8000-000000000006',
    Mordomo: '00000000-0000-4000-8000-000000000011',
    Sentinela: '00000000-0000-4000-8000-000000000010',
  }
  const seedAccount = async (name, invite) => {
    const d = await device('phone')
    await d.ctx.addCookies([{ name: 'devo_player', value: SEED[name], url: BASE }])
    await d.page.goto(BASE, { waitUntil: 'networkidle' })
    let up
    for (let i = 0; i < 6; i++) {
      up = await api(d.page, '/api/auth/sign-up/email', { email: hexEmail(name), password: 'teste123', name, username: name, displayUsername: name }, { 'x-devo-invite': invite })
      if (up.status !== 429) break
      await wait(11000)
    }
    if (up.status >= 400) {
      const inn = await api(d.page, '/api/auth/sign-in/username', { username: name, password: 'teste123' })
      if (inn.status >= 400) manifest.errors.push({ step: `staff-${name}-auth`, error: `signup ${up.status} ${up.text}; signin ${inn.status}` })
    }
    const saved = await api(d.page, '/api/save', makeSave(VET_CARDS))
    if (saved.status >= 400) manifest.errors.push({ step: `staff-${name}-save`, error: `${saved.status} ${saved.text}` })
    return d
  }
  const getJson = (page, path) => page.evaluate(async (p) => (await fetch(p)).json(), path)
  const post = async (page, path, body, label) => {
    const r = await api(page, path, body)
    if (r.status >= 400) manifest.errors.push({ step: `staff-${label}`, error: `${r.status} ${r.text}` })
    try {
      return JSON.parse(r.text)
    } catch {
      return {}
    }
  }
  const tabOf = (page, name) => page.getByRole('tab', { name: new RegExp(name, 'i') }).first()
  const view = (page, sel, block = 'start') =>
    page
      .locator(sel)
      .first()
      .evaluate((el, b) => el.scrollIntoView({ block: b }), block)
      .catch(() => {})
  const openMesa = async (page) => {
    await openApp(page, 'Record')
    await tryClick(tabOf(page, 'Mesa'))
    await wait(2000)
  }
  const section = async (page, label) => {
    await view(page, 'nav[aria-label="Seções da mesa"]', 'start')
    await tryClick(desk(page, label))
    await wait(1800)
  }

  const mat = await seedAccount('Matheus', 'DEVO-STAF-MATH')
  const nar = await seedAccount('Narrador', 'DEVO-STAF-NARR')
  const mor = await seedAccount('Mordomo', 'DEVO-STAF-MORD')
  const sen = await seedAccount('Sentinela', 'DEVO-STAF-SENT')

  // Jogador comum: sem Mesa; pedido de inscrição em análise; cota de 1 convite.
  await step('staff-jogador', async () => {
    const page = mat.page
    await openApp(page, 'Record')
    await shot(page, '60-staff-jogador-record')
    if (await tryClick(tabOf(page, 'Deadly Votes'))) {
      await wait(1500)
      await view(page, 'article[aria-label="Convocação: Leilão de Sombras"]', 'end')
      await wait(700)
      await shot(page, '60-staff-jogador-inscricao-em-analise')
    }
    if (await tryClick(tabOf(page, 'Convites'))) {
      await wait(1500)
      await shot(page, '60-staff-jogador-convites')
    }
  })

  // Dealer: Mesa, inscrições, resultado por participante, aplicação (vai para aprovação), convocação e propostas.
  await step('staff-dealer', async () => {
    const page = nar.page
    await openMesa(page)
    await shot(page, '61-staff-dealer-mesa')
    const leilao = 'article[aria-label*="Leilão de Sombras"]'
    await view(page, `${leilao} button[aria-expanded]`, 'start')
    await wait(700)
    await shot(page, '61-staff-dealer-inscricoes')
    if (await tryClick(page.locator(leilao).getByRole('button', { name: 'Aceitar Matheus', exact: true }))) {
      await wait(1500)
      await view(page, `${leilao} button[aria-expanded]`, 'start')
      await wait(500)
      await shot(page, '61-staff-dealer-inscricao-aceita')
    }
    const sala = 'article[aria-label*="A Sala Sem Relógio"]'
    await view(page, `${sala} button[aria-expanded]`, 'start')
    await wait(700)
    await shot(page, '61-staff-dealer-decisao')
    await view(page, '[aria-label="Resultado de Ísis"]', 'center')
    await wait(500)
    await shot(page, '61-staff-dealer-decisao-lista')
    if (await tryClick(page.locator(sala).getByRole('button', { name: 'Prêmio para todos' }))) await wait(1500)
    if (await tryClick(page.locator(sala).getByRole('button', { name: 'Aplicar aos perfis' }))) {
      await wait(500)
      await view(page, `${sala} button:has-text("Confirmar aplicação")`, 'center')
      await wait(400)
      await shot(page, '61-staff-dealer-aplicar-confirmar')
      await tryClick(page.locator(sala).getByRole('button', { name: 'Confirmar aplicação' }))
      await wait(2200)
      await view(page, `${sala} button[aria-expanded]`, 'start')
      await wait(600)
      await shot(page, '61-staff-dealer-aplicado')
    }
    await view(page, 'nav[aria-label="Seções da mesa"]')
    if (await tryClick(btn(page, 'Convocar', true))) {
      await wait(900)
      const form = page.getByRole('form', { name: 'Convocar Deadly Vote' })
      await form.getByPlaceholder('Leilão de Sombras').fill('Vigília das Velas').catch(() => {})
      await form.getByPlaceholder(/Salão principal/).fill('Capela do terceiro andar').catch(() => {})
      await form.getByPlaceholder('O que os participantes precisam saber.').fill('Uma vela por pessoa. Quem deixar a sua apagar sai do caso.').catch(() => {})
      await view(page, 'form[aria-label="Convocar Deadly Vote"]')
      await wait(500)
      await shot(page, '61-staff-dealer-convocar')
      if (await tryClick(form.getByRole('button', { name: 'Adicionar recompensa' }))) {
        await wait(800)
        await tryClick(form.getByRole('button', { name: 'Incluir recompensa' }))
        await wait(500)
      }
      await view(page, 'form[aria-label="Convocar Deadly Vote"] button[type=submit]', 'end')
      await wait(500)
      await shot(page, '61-staff-dealer-convocar-recompensas')
      await tryClick(form.getByRole('button', { name: 'Convocar' }))
      await wait(2000)
    }
    await section(page, 'Recompensas')
    await shot(page, '61-staff-dealer-recompensas')
    await page.mouse.wheel(0, 700)
    await wait(600)
    await shot(page, '61-staff-dealer-recompensas-scroll')
  })

  // Estado de erro: a Mesa sem resposta do servidor.
  await step('staff-erro', async () => {
    const page = await nar.ctx.newPage()
    await page.route('**/api/record?view=staff*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"Falha no servidor do Record."}' }))
    await openMesa(page)
    await view(page, 'nav[aria-label="Seções da mesa"]')
    await wait(600)
    await shot(page, '61-staff-erro')
    await page.close()
  })

  // Anfitrião: aprovações dos seus Dealers, tutorial vencido pela tela nova, equipe, jogadores e convites.
  await step('staff-anfitriao', async () => {
    const page = mor.page
    await post(page, '/api/staff', {
      action: 'recompensa.propor', tipo: 'externa', origem: 'Ajuda no evento de sábado', destinatarioId: SEED.Matheus,
      recurso: 'tempo', quantidade: 90, justificativa: 'Organizou a fila de inscritos e trouxe dois jogadores.',
    }, 'externa')
    const t = await post(page, '/api/record', {
      action: 'create', title: 'Voto de Iniciação', arc: 'Prólogo', location: 'Átrio do relógio', tutorial: true,
      briefing: 'O primeiro voto de quem acabou de chegar.', startsAt: Date.now() - 3600_000,
      prizes: [{ recurso: 'item', chave: 'dracma_comum', quantidade: 1, label: 'boas-vindas' }],
    }, 'tutorial-criar')
    if (t.id) {
      await post(mat.page, '/api/record', { action: 'join', voteId: t.id }, 'tutorial-inscricao')
      await post(page, '/api/record', { action: 'status', voteId: t.id, status: 'concluido' }, 'tutorial-concluir')
    }
    await openMesa(page)
    await shot(page, '62-staff-anfitriao-mesa')
    await section(page, 'Recompensas')
    await shot(page, '62-staff-anfitriao-aprovacoes')
    if (await tryClick(page.getByRole('button', { name: /^Aprovar e entregar a recompensa de/ }).first())) {
      await wait(1800)
      await shot(page, '62-staff-anfitriao-aprovado')
    }
    await section(page, 'Casos')
    const tut = 'article[aria-label*="Voto de Iniciação"]'
    if (await tryClick(page.locator(tut).getByRole('button', { name: 'Matheus: Recebe prêmio' }))) {
      await wait(1500)
      await view(page, `${tut} button[aria-expanded]`, 'start')
      await wait(500)
      await shot(page, '62-staff-anfitriao-tutorial-decisao')
      if (await tryClick(page.locator(tut).getByRole('button', { name: 'Aplicar aos perfis' }))) {
        await wait(400)
        await tryClick(page.locator(tut).getByRole('button', { name: 'Confirmar aplicação' }))
        await wait(2200)
        await view(page, `${tut} button[aria-expanded]`, 'start')
        await wait(500)
        await shot(page, '62-staff-anfitriao-tutorial-aplicado')
      }
    }
    const eu = await getJson(mat.page, '/api/eu').catch(() => null)
    if (!eu?.desbloqueios?.poco) manifest.errors.push({ step: 'staff-tutorial-desbloqueio', error: `Matheus deveria ter o Poço liberado: ${JSON.stringify(eu?.desbloqueios)}` })
    await section(page, 'Equipe')
    await shot(page, '62-staff-anfitriao-equipe')
    await section(page, 'Jogadores')
    if (await tryClick(page.getByRole('button', { name: /^Lírio/ }).first())) {
      await wait(1500)
      await shot(page, '62-staff-anfitriao-jogador')
    }
    await section(page, 'Convites')
    await shot(page, '62-staff-anfitriao-convites')
  })

  // Owner: selo neutro no Record (nunca "Owner"), Mesa completa, externas, vínculos, desbloqueios, registro e ajustes.
  await step('staff-owner', async () => {
    const page = sen.page
    await openApp(page, 'Record')
    await shot(page, '63-staff-owner-record')
    await tryClick(tabOf(page, 'Mesa'))
    await wait(2000)
    await shot(page, '63-staff-owner-mesa')
    await section(page, 'Recompensas')
    await shot(page, '63-staff-owner-recompensas')
    await section(page, 'Equipe')
    await shot(page, '63-staff-owner-equipe')
    await section(page, 'Jogadores')
    if (await tryClick(page.getByRole('button', { name: /^Matheus/ }).first())) {
      await wait(1600)
      await view(page, '[role="switch"]', 'center')
      await wait(500)
      await shot(page, '63-staff-owner-jogador')
    }
    await section(page, 'Registro')
    await shot(page, '63-staff-owner-registro')
    await section(page, 'Ajustes')
    await shot(page, '63-staff-owner-ajustes')
  })

  // Jogador depois do tutorial vencido: o Record com o resultado.
  await step('staff-jogador-depois', async () => {
    await openApp(mat.page, 'Record')
    if (await tryClick(tabOf(mat.page, 'Deadly Votes'))) {
      await wait(1500)
      await view(mat.page, 'section[aria-labelledby="dv-history"]')
      await wait(600)
      await shot(mat.page, '60-staff-jogador-depois')
    }
  })

  for (const d of [mat, nar, mor, sen]) await d.ctx.close()
}

// ── 4. Uma referência no desktop ────────────────────────────────────────────────────────
// ── Torres de Ruptura (DIRECAO-3 §2): trancado, apresentação do Galo, mapa, torres, andares ─────────────
// Convites DEVO-TORR-CAP1/2 (92-seed-torres.sql). O Owner (Veterano) libera a flag e concede essências pela
// API da equipe, como faria no painel.
if (want('torres')) {
  const own = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
  const meuId = (page) => page.evaluate(async () => (await (await fetch('/api/eu')).json()).id)
  const staff = async (body) => {
    const r = await api(own.page, '/api/staff', body)
    if (r.status >= 400) manifest.errors.push({ step: `torres-staff-${body.action}`, error: `${r.status} ${r.text}` })
  }
  const abrirTorres = async (page) => {
    await page.getByRole('button', { name: /^Torres de Ruptura/ }).first().click({ timeout: 15000 })
    await wait(2600)
  }
  /** Avança uma cena (Enter termina a digitação; outro Enter avança) até o diálogo `nome` sumir. */
  const passarCena = async (page, nome, max = 30) => {
    for (let i = 0; i < max; i++) {
      if (!(await page.getByRole('dialog', { name: nome }).count())) return
      const choices = page.locator('[aria-label="Sua resposta"] button:not([disabled])')
      if (await choices.count()) await tryClick(choices.first())
      else {
        await page.keyboard.press('Enter')
        await wait(250)
        await page.keyboard.press('Enter')
      }
      await wait(650)
    }
  }

  const A = await account('Torreada', 'DEVO-TORR-CAP1', VET_CARDS)
  await step('torres-trancado', async () => {
    await enterOS(A.page)
    await wait(1200)
    await A.page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(A.page, 't01-torres-home-trancado')
    await abrirTorres(A.page)
    await shot(A.page, 't02-torres-trancado', 'jogador sem o tutorial: motivo')
  })
  await A.ctx.close()

  const B = await account('Torreira', 'DEVO-TORR-CAP2', VET_CARDS)
  const bid = await meuId(B.page).catch(() => null)
  await staff({ action: 'desbloqueio.definir', playerId: bid, flag: 'torres', on: true })
  const galo = 'O Galo apresenta as Torres de Ruptura'
  await step('torres-galo', async () => {
    const page = B.page
    await enterOS(page)
    await wait(1200)
    await page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(page, 't03-torres-home-liberado')
    await abrirTorres(page)
    await wait(1800)
    await shot(page, 't10-galo-abertura')
    const seen = new Set()
    for (let i = 0; i < 90; i++) {
      if (!(await page.getByRole('dialog', { name: galo }).count())) break
      const choices = page.locator('[aria-label="Sua resposta"] button:not([disabled])')
      const aceitar = page.locator('[aria-label="Sua resposta"] button').filter({ hasText: 'Aceitar' })
      if (await aceitar.count()) {
        await shot(page, 't13-galo-oferta')
        await tryClick(aceitar.first())
        await wait(900)
        await shot(page, 't14-galo-essencia', '+1 Essência de Afinidade do Galo')
        continue
      }
      if (await choices.count()) {
        if (!seen.has('escolha')) {
          seen.add('escolha')
          await wait(500)
          await shot(page, 't11-galo-escolha')
        }
        await tryClick(choices.first())
        await wait(700)
        continue
      }
      if (!seen.has('bloco') && (await page.getByText('Torre de Ruptura]').count())) {
        seen.add('bloco')
        await wait(900)
        await shot(page, 't12-galo-bloco', 'quadro [Torre de Ruptura]')
      }
      if (!seen.has('fala') && (await page.getByText(/torre baixa nada mais/).count())) {
        seen.add('fala')
        await shot(page, 't11b-galo-fala')
      }
      if (!seen.has('sistema') && (await page.getByText(/entre cinco e oito andares/).count())) {
        seen.add('sistema')
        await shot(page, 't15-galo-sistema')
      }
      await page.keyboard.press('Enter')
      await wait(300)
      await page.keyboard.press('Enter')
      await wait(600)
    }
    await wait(1500)
    await shot(page, 't20-mapa')
  })
  await step('torres-principal', async () => {
    const page = B.page
    await page.getByRole('button', { name: 'Torre do Imperador', exact: true }).click({ timeout: 10000 })
    await wait(250)
    await shot(page, 't21a-transicao')
    await wait(1400)
    await shot(page, 't21-torre-principal')
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't22-andar-ficha')
    await btn(page, 'Subir ao andar I').click({ timeout: 8000 })
    await wait(2200)
    await shot(page, 't23-andar-cena')
    await passarCena(page, /Torre do Imperador · Andar I$/)
    await wait(700)
    await shot(page, 't24-andar-concluido', 'andar I concluído; II trancado por essência e chave')
    await btn(page, 'Voltar ao mapa').click({ timeout: 8000 })
    await wait(1200)
    await shot(page, 't25-mapa-progresso')
  })
  await step('torres-reflexao', async () => {
    const page = B.page
    await btn(page, 'Voltar ao início').click({ timeout: 8000 })
    await wait(1800)
    await shot(page, 't30-reflexao')
    for (let i = 0; i < 6 && !(await page.locator('[aria-label="Sua resposta"] button').count()); i++) {
      await page.keyboard.press('Enter')
      await wait(500)
    }
    await wait(600)
    await shot(page, 't31-reflexao-escolha')
    await tryClick(page.locator('[aria-label="Sua resposta"] button').filter({ hasText: 'Anfitrião do Imperador' }).first())
    await wait(2600)
    await shot(page, 't32-reflexao-resposta')
    await passarCena(page, 'Anfitrião de quê?', 6)
  })
  await staff({ action: 'item.conceder', playerId: bid, item: 'essencia:coruja', quantidade: 1, motivo: 'captura' })
  await step('torres-secundaria', async () => {
    const page = B.page
    await enterOS(page)
    await abrirTorres(page)
    await page.getByRole('button', { name: 'Torre do Observatório', exact: true }).click({ timeout: 10000 })
    await wait(1600)
    await shot(page, 't40-torre-secundaria')
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(800)
    await btn(page, 'Subir ao andar I').click({ timeout: 8000 })
    await wait(1500)
    await passarCena(page, /Torre do Observatório · Andar I$/)
    await wait(500)
    await shot(page, 't41-secundaria-chave', '+1 Chave do Observatório')
    await btn(page, 'Voltar ao mapa').click({ timeout: 8000 })
    await wait(1200)
    await page.getByRole('button', { name: 'Torre do Imperador', exact: true }).click({ timeout: 10000 })
    await wait(1600)
    await page.getByRole('button', { name: /^Andar II:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't42-andar-trancado-essencia', 'tem a chave; faltam 2 essências')
  })
  await staff({ action: 'item.conceder', playerId: bid, item: 'essencia:galo', quantidade: 2, motivo: 'captura' })
  await step('torres-chave', async () => {
    const page = B.page
    await enterOS(page)
    await abrirTorres(page)
    await page.getByRole('button', { name: 'Torre do Imperador', exact: true }).click({ timeout: 10000 })
    await wait(1600)
    await page.getByRole('button', { name: /^Andar II:/ }).first().click({ timeout: 8000 })
    await wait(800)
    await btn(page, 'Subir ao andar II').click({ timeout: 8000 })
    await wait(1500)
    await passarCena(page, /Torre do Imperador · Andar II$/)
    await wait(500)
    await page.getByRole('button', { name: /^Andar III:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't43-andar-trancado-chave', 'falta a chave do Picadeiro')
    await page.keyboard.press('Escape')
    await wait(600)
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't44-andar-concluido-ficha', 'concluído: Rever cena')
  })
  await B.ctx.close()
  await own.ctx.close()
}

if (want('desktop')) {
  await step('desktop', async () => {
    const { ctx, page } = await device('desktop')
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(2000)
    await shot(page, '90-desktop-landing')
    await ctx.close()
  })
  await step('desktop-os', async () => {
    const { ctx, page } = await account('Mesa', 'DEVO-TEST-0005', VET_CARDS, 'desktop')
    await enterOS(page)
    await shot(page, '92-desktop-os')
    // A cena 3D do papel de parede monta logo depois (WebGL por software no CI ocupa a página alguns
    // segundos): o clique duplo espera o ícone visível e tem folga.
    await page.getByRole('button', { name: 'Pulso', exact: true }).first().waitFor({ state: 'visible', timeout: 15000 })
    await page.getByRole('button', { name: 'Pulso', exact: true }).first().dblclick({ timeout: 10000 })
    await wait(2000)
    await shot(page, '92-desktop-pulso')
    await page.getByRole('button', { name: 'Mensagens', exact: true }).first().dblclick({ timeout: 10000 })
    await wait(2000)
    await shot(page, '92-desktop-janelas')
    await page.getByRole('button', { name: 'Central de avisos' }).first().click({ timeout: 10000 })
    await wait(900)
    await shot(page, '92-desktop-avisos')
    await ctx.close()
  })
}

// ── Poço dos Milagres (sistema novo, DIRECAO-3 §2) ─────────────────────────────────────────
// Brasa (DEVO-POCO-0001) recebe as flags do Poço e do Diário pelo banco (como se tivesse vencido o tutorial);
// Cinza (DEVO-POCO-0002) continua trancada. As probabilidades são forçadas pelo banco só para fotografar o
// lixo e o resultado raro, e voltam ao valor original no fim.
if (want('poco')) {
  let db = null
  try {
    const pg = (await import('pg')).default
    if (process.env.DATABASE_URL) db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  } catch {}
  const sql = async (text, params) => (db ? (await db.query(text, params)).rows : [])
  const original = (await sql("SELECT value FROM devo_config WHERE key = 'poco.probabilidades'").catch(() => []))[0]?.value
  const forcar = async (moeda, cat) => {
    if (!original) return
    const v = { ...original, [moeda]: { lixo: 0, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0, [cat]: 100 } }
    await sql("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify(v)])
  }
  const restaurar = async () => original && sql("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify(original)])
  const abrirPoco = async (page, name) => {
    await enterOS(page)
    const b = page.getByRole('button', { name, exact: true }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 })
    await b.scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(b, 8000)
    await wait(2600)
  }
  const fala = (page) => page.getByRole('button', { name: /^(Próxima fala|Mostrar fala completa)$/ }).first()
  const escolhas = (page) => page.locator('[aria-label="Escolhas de diálogo"] button:not([disabled])')

  await step('poco-trancado', async () => {
    const { ctx, page } = await account('Cinza', 'DEVO-POCO-0002', VET_CARDS)
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(600)
    await shot(page, 'poco-00-home-trancado')
    await abrirPoco(page, 'Poço dos Milagres: trancado')
    await shot(page, 'poco-01-trancado')
    await ctx.close()
  })

  const { ctx, page } = await account('Brasa', 'DEVO-POCO-0001', VET_CARDS)
  await sql(
    "INSERT INTO player_unlocks (player_id, flag, source) SELECT id, f, 'owner' FROM players, unnest(ARRAY['poco','diario']) f WHERE lower(name) = 'brasa' ON CONFLICT DO NOTHING",
  ).catch((e) => manifest.errors.push({ step: 'poco-flags', error: String(e).slice(0, 300) }))

  await step('poco-diario-vazio', async () => {
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Diário/ }).first())
    await wait(1500)
    await shot(page, 'poco-02-diario-vazio')
  })

  await step('poco-neblina', async () => {
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(800)
    await shot(page, 'poco-03-home-liberado')
    await abrirPoco(page, 'Poço dos Milagres')
    await shot(page, 'poco-04-neblina-rua')
    const vistos = new Set()
    const marcar = async (re, nome) => {
      if (vistos.has(nome)) return
      if (await page.getByText(re).count()) {
        vistos.add(nome)
        await tryClick(page.getByRole('button', { name: 'Mostrar fala completa' }).first(), 800)
        await wait(1200)
        await shot(page, nome)
      }
    }
    for (let i = 0; i < 120; i++) {
      if (!(await page.locator('main[aria-label="Poço dos Milagres: apresentação"]').count())) break
      const ops = escolhas(page)
      if (await ops.count()) {
        await wait(700)
        if (!vistos.has('poco-06-neblina-escolha-moeda') && (await page.getByText('Usar moeda especial (se houver).').count())) {
          vistos.add('poco-06-neblina-escolha-moeda')
          await shot(page, 'poco-06-neblina-escolha-moeda')
        }
        const sim = page.locator('[aria-label="Escolhas de diálogo"] button', { hasText: 'Sim, por favor.' })
        if (await sim.count()) await tryClick(sim.first())
        else await tryClick(ops.first())
        await wait(600)
        continue
      }
      await marcar(/Ao se aproximar, você descobre um poço milenar/, 'poco-05-neblina-poco')
      await marcar(/alguém se aproxima/, 'poco-07-neblina-figura')
      await marcar(/o mais puro osso/, 'poco-08-neblina-mao')
      await marcar(/Você recebeu um Dracma/, 'poco-09-neblina-dracma')
      await marcar(/Nunca tente entrar no poço/, 'poco-10-neblina-aviso')
      await tryClick(fala(page), 1500)
      await wait(260)
    }
    await wait(1500)
    await shot(page, 'poco-11-tela')
  })

  await step('poco-moedas', async () => {
    await tryClick(btn(page, 'Suas moedas', true))
    await wait(900)
    await shot(page, 'poco-12-moedas')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('poco-baldes', async () => {
    await tryClick(btn(page, 'Inspecionar Balde', true))
    await wait(900)
    await shot(page, 'poco-13-baldes-bloqueado')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('poco-giro-lixo', async () => {
    await forcar('dracma_comum', 'lixo')
    await tryClick(btn(page, 'Lançar Moeda', true))
    await wait(900)
    await shot(page, 'poco-14-lancar')
    await tryClick(btn(page, 'Usar o giro grátis', true))
    await wait(500)
    await shot(page, 'poco-15-moeda-caindo')
    await wait(900)
    await tryClick(btn(page, 'Girar Manivela', true))
    await wait(1100)
    await shot(page, 'poco-16-minigame')
    for (let k = 0; k < 3; k++) {
      await tryClick(page.getByRole('button', { name: 'Puxar a manivela' }).first(), 1500)
      await wait(450)
    }
    await wait(350)
    await shot(page, 'poco-17-minigame-fim')
    await wait(1400)
    await shot(page, 'poco-18-balde-subindo')
    await wait(2200)
    await tryClick(btn(page, 'Inspecionar Balde', true))
    await wait(1400)
    await shot(page, 'poco-19-resultado-lixo')
    await tryClick(btn(page, 'Devolver ao poço', true))
    await wait(900)
    await shot(page, 'poco-20-giro-gratis-usado')
    await tryClick(btn(page, 'Lançar Moeda', true))
    await wait(900)
    await shot(page, 'poco-21-lancar-gratis-usado')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('poco-giro-raro', async () => {
    await forcar('dracma_incomum', 'capsula')
    await tryClick(btn(page, 'Lançar Moeda', true))
    await wait(800)
    await tryClick(btn(page, 'Lançar Dracma Incomum', true))
    await wait(1500)
    await tryClick(btn(page, 'Girar Manivela', true))
    await wait(1000)
    await tryClick(btn(page, 'Soltar a manivela', true))
    await wait(3800)
    await tryClick(btn(page, 'Inspecionar Balde', true))
    await wait(1600)
    await shot(page, 'poco-22-resultado-raro')
    await tryClick(btn(page, 'Guardar', true))
    await wait(800)
  })
  await restaurar()

  await step('poco-diario', async () => {
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Diário/ }).first())
    await wait(1500)
    await shot(page, 'poco-23-diario')
  })
  await ctx.close()

  await step('poco-owner', async () => {
    const o = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
    await abrirPoco(o.page, 'Poço dos Milagres')
    await shot(o.page, 'poco-24-owner-cena-pular')
    if (await tryClick(btn(o.page, 'Pular apresentação', true))) await wait(1800)
    await tryClick(btn(o.page, 'Suas moedas', true))
    await wait(900)
    await o.page.getByRole('region', { name: 'Probabilidades do Poço' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(o.page, 'poco-25-owner-probabilidades')
    await o.ctx.close()
  })
  await db?.end().catch(() => {})
}

// ── Salão das Máscaras (sistema novo, DIRECAO-3 §2) ────────────────────────────────────────
// Fosca (DEVO-SALA-0002) continua trancada; Velada (DEVO-SALA-0001) recebe a flag pelo banco. O estado aberto/fechado
// é forçado pelo banco (salao.calendario.forcar, como o Owner faria) e os lotes do seed passam para a próxima edição
// enquanto o Salão está fechado (para não serem liquidados) e voltam à edição corrente quando ele abre.
if (want('salao')) {
  let db = null
  try {
    const pg = (await import('pg')).default
    if (process.env.DATABASE_URL) db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  } catch {}
  const sql = async (text, params) => (db ? (await db.query(text, params)).rows : [])
  const cal = (await sql("SELECT value FROM devo_config WHERE key = 'salao.calendario'").catch(() => []))[0]?.value
  const edicao = async () =>
    (await sql(
      `SELECT floor(extract(epoch FROM now() - (value->>'ancora')::timestamptz) / ((value->>'intervalo_dias')::numeric * 86400))::int AS n
         FROM devo_config WHERE key = 'salao.calendario'`,
    ).catch(() => []))[0]?.n ?? 0
  const SEED_LOTES = ['5a1a0001-0000-4000-8000-000000000001', '5a1a0001-0000-4000-8000-000000000002', '5a1a0001-0000-4000-8000-000000000003']
  const estado = async (forcar) => {
    if (!cal) return
    await sql("UPDATE devo_config SET value = $1 WHERE key = 'salao.calendario'", [JSON.stringify({ ...cal, forcar })]).catch((e) => manifest.errors.push({ step: 'salao-config', error: String(e).slice(0, 200) }))
    const n = await edicao()
    await sql("UPDATE salao_lotes SET edicao = $2 WHERE id = ANY($1) AND status = 'aprovado'", [SEED_LOTES, forcar === 'fechado' ? n + 1 : n]).catch(() => {})
  }
  const abrirSalao = async (page, name = 'Salão das Máscaras') => {
    await enterOS(page)
    const b = page.getByRole('button', { name, exact: true }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 })
    await b.scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(b, 8000)
    await wait(2800)
  }
  const aba = async (page, nome) => {
    await page.getByRole('tablist', { name: 'Seções do Salão' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(page.getByRole('tab', { name: new RegExp(`^${nome}`) }).first())
    await wait(1100)
    await page
      .getByRole('tablist', { name: 'Seções do Salão' })
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'start' }))
      .catch(() => {})
    await wait(400)
  }

  await estado('fechado')

  await step('salao-trancado', async () => {
    const { ctx, page } = await account('Fosca', 'DEVO-SALA-0002', VET_CARDS)
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(600)
    await shot(page, 'salao-00-home-trancado')
    await abrirSalao(page, 'Salão das Máscaras: trancado')
    await shot(page, 'salao-01-trancado')
    await ctx.close()
  })

  const { ctx, page } = await account('Velada', 'DEVO-SALA-0001', VET_CARDS)
  await sql(
    "INSERT INTO player_unlocks (player_id, flag, source) SELECT id, 'salao_mascaras', 'owner' FROM players WHERE lower(name) = 'velada' ON CONFLICT DO NOTHING",
  ).catch((e) => manifest.errors.push({ step: 'salao-flag', error: String(e).slice(0, 300) }))

  await step('salao-herdeiro', async () => {
    await abrirSalao(page)
    await wait(800)
    await shot(page, 'salao-02-herdeiro-inicio')
    const vistos = new Set()
    const marcar = async (re, nome) => {
      if (vistos.has(nome) || !(await page.getByText(re).count())) return
      vistos.add(nome)
      await tryClick(page.getByRole('button', { name: 'Mostrar fala completa' }).first(), 800)
      await wait(900)
      await shot(page, nome)
    }
    for (let i = 0; i < 60; i++) {
      if (!(await page.locator('main[aria-label="Salão das Máscaras: apresentação"]').count())) break
      await marcar(/Este é o/, 'salao-03-herdeiro-salao')
      await marcar(/aquele número enorme/, 'salao-04-herdeiro-contador')
      await marcar(/aba chamada/, 'salao-05-herdeiro-bandeja')
      await marcar(/o único maestro sou eu/, 'salao-06-herdeiro-fim')
      await tryClick(page.getByRole('button', { name: /^(Próxima fala|Mostrar fala completa)$/ }).first(), 1500)
      await wait(220)
    }
    await wait(1600)
    await shot(page, 'salao-07-fechado-contador')
    await aba(page, 'Leilões')
    await shot(page, 'salao-08-fechado-proxima-edicao')
  })

  await estado('aberto')
  await step('salao-aberto', async () => {
    await abrirSalao(page)
    await shot(page, 'salao-09-aberto')
    await aba(page, 'Leilões')
    await shot(page, 'salao-10-leilao-lotes')
    await tryClick(page.getByRole('button', { name: 'Dar lance no lote 3' }).first())
    await wait(1000)
    await shot(page, 'salao-11-lance-folha')
    await tryClick(btn(page, 'Aumentar 10 minutos', true))
    await wait(300)
    await tryClick(btn(page, 'Confirmar lance', true))
    await wait(1800)
    await page.getByRole('region', { name: /Lote 3:/ }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(page, 'salao-12-leilao-voce-lidera')
  })

  await step('salao-mercado', async () => {
    await aba(page, 'Mercado')
    await shot(page, 'salao-13-mercado')
    await tryClick(btn(page, 'Vender carta', true))
    await wait(900)
    await shot(page, 'salao-14-mercado-vender')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('salao-anuncios', async () => {
    await aba(page, 'Anúncios')
    await shot(page, 'salao-15-anuncios')
    await tryClick(btn(page, 'Anunciar', true))
    await wait(900)
    await shot(page, 'salao-16-anuncio-novo')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('salao-bandeja', async () => {
    await aba(page, 'Bandeja')
    await shot(page, 'salao-17-bandeja-aviso')
    await tryClick(btn(page, 'Enviar pelo Shuffler', true))
    await wait(900)
    await shot(page, 'salao-18-bandeja-escolher')
    await tryClick(page.getByRole('button', { name: 'Escolher Ampulheta Invertida' }).first())
    await wait(700)
    await page.locator('#salao-bandeja-valor').first().scrollIntoViewIfNeeded().catch(() => {})
    await shot(page, 'salao-19-bandeja-carta')
    await tryClick(page.getByRole('dialog').getByRole('button', { name: 'Enviar à Bandeja', exact: true }).first())
    await wait(1800)
    await shot(page, 'salao-20-bandeja-enviado')
    await page.keyboard.press('Escape')
    await wait(900)
    await page.getByRole('region', { name: 'Seus itens na Bandeja' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(page, 'salao-21-bandeja-em-avaliacao')
  })

  await step('salao-calendario', async () => {
    await page.evaluate(() => document.querySelector('.devo-scroll')?.scrollTo({ top: 0 })).catch(() => {})
    await tryClick(btn(page, 'Calendário Devo', true))
    await wait(1100)
    await shot(page, 'salao-22-calendario')
  })

  await step('salao-record-shuffler', async () => {
    await page.keyboard.press('Escape')
    await openApp(page, 'Record')
    const b = page.getByRole('button', { name: 'Enviar à Bandeja', exact: true }).first()
    await b.scrollIntoViewIfNeeded().catch(() => {})
    await wait(700)
    await shot(page, 'salao-23-record-shuffler')
  })
  await ctx.close()

  await step('salao-mesa', async () => {
    const o = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
    await openApp(o.page, 'Record')
    await tryClick(o.page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await o.page.locator('nav[aria-label="Seções da mesa"]').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await tryClick(desk(o.page, 'Salão'))
    await wait(1800)
    await shot(o.page, 'salao-24-mesa-fila')
    await o.page.getByRole('region', { name: 'Bandeja em avaliação' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(o.page, 'salao-25-mesa-avaliacao')
    await tryClick(o.page.getByRole('button', { name: 'Aprovar', exact: true }).first())
    await wait(1600)
    await shot(o.page, 'salao-26-mesa-aprovado')

    await abrirSalao(o.page)
    await shot(o.page, 'salao-27-owner-pular')
    if (await tryClick(btn(o.page, 'Pular apresentação', true))) await wait(1600)
    await tryClick(btn(o.page, 'Calendário Devo', true))
    await wait(1100)
    await o.page.getByRole('region', { name: 'Calendário do Owner' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(o.page, 'salao-28-owner-calendario')
    await o.page.keyboard.press('Escape')
    await wait(500)

    await o.page.route('**/api/salao', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"O Salão não respondeu. Tente de novo."}' }))
    await abrirSalao(o.page)
    await shot(o.page, 'salao-29-erro')
    await o.ctx.close()
  })

  await estado(null)
  await sql("UPDATE devo_config SET value = $1 WHERE key = 'salao.calendario'", [JSON.stringify(cal)]).catch(() => {})
  await db?.end().catch(() => {})
}

// ── Corporações (DIRECAO-3 §2): trancado, holograma (fallback), página vazia, código inválido, pedido,
// aprovação pelo líder, membros, transferência de carta, criar com custo, fila na Mesa, Necro, erro.
// Convites DEVO-CORP-0001…0004 (96-seed-corporacoes.sql). Flags e o líder da Ordem vêm por SQL (como o Salão).
if (want('corporacoes')) {
  let db = null
  try {
    const pg = (await import('pg')).default
    if (process.env.DATABASE_URL) db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  } catch {}
  const sql = async (text, params) => (db ? (await db.query(text, params)).rows : [])
  const ORDEM = 'c0a90000-0000-4000-8000-000000000001'
  const liberarCorp = (nome, apresentado = true) =>
    sql(
      `WITH p AS (SELECT id FROM players WHERE lower(name) = lower($1))
       , f AS (INSERT INTO player_unlocks (player_id, flag, source) SELECT id, 'corporacoes', 'owner' FROM p ON CONFLICT DO NOTHING)
       INSERT INTO corporacao_estado (player_id, apresentado_at) SELECT id, CASE WHEN $2 THEN now() END FROM p ON CONFLICT DO NOTHING`,
      [nome, apresentado],
    ).catch((e) => manifest.errors.push({ step: `corp-flag-${nome}`, error: String(e).slice(0, 300) }))
  const abrirCorp = async (page, name = 'Corporações') => {
    await enterOS(page)
    const b = page.getByRole('button', { name, exact: true }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 })
    await b.scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(b, 8000)
    await wait(2600)
  }
  const aba = async (page, nome) => {
    await tryClick(page.getByRole('tab', { name: new RegExp(`^${nome}`) }).first())
    await wait(900)
    await page.getByRole('tablist', { name: 'Seções da Corporação' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(400)
  }
  const codigo = async (page, c) => {
    await page.locator('#corp-codigo').fill(c)
    await tryClick(btn(page, 'Consultar código', true))
    await wait(1400)
  }

  await step('corp-trancado', async () => {
    const { ctx, page } = await account('Cortesa', 'DEVO-CORP-0001', VET_CARDS)
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(600)
    await shot(page, 'corp-00-home-trancado')
    await abrirCorp(page, 'Corporações: trancado')
    await shot(page, 'corp-01-trancado')
    await ctx.close()
  })

  const cand = await account('Candida', 'DEVO-CORP-0002', VET_CARDS.slice(0, 5))
  await liberarCorp('Candida', false)
  await step('corp-holograma', async () => {
    const page = cand.page
    await abrirCorp(page)
    await shot(page, 'corp-02-holograma-chamada')
    const dlg = page.getByRole('dialog', { name: 'Chamada holográfica da Companhia de Despertados' })
    let falou = false
    let escolheu = false
    for (let i = 0; i < 60; i++) {
      if (!(await dlg.count())) break
      const choices = page.locator('[aria-label="Sua resposta"] button')
      if (await choices.count()) {
        if (!escolheu) {
          escolheu = true
          await wait(500)
          await shot(page, 'corp-04-holograma-escolha')
        }
        await tryClick(choices.first())
      } else if (!(await tryClick(btn(page, 'Próxima fala', true), 1500))) {
        await tryClick(btn(page, 'Atender', true), 1500)
      }
      await wait(350)
      if (!falou && (await page.getByText('Sou eu mais uma vez').count())) {
        falou = true
        await wait(1200)
        await shot(page, 'corp-03-holograma-melissa')
      }
    }
    await wait(1200)
    await shot(page, 'corp-05-vazia')
    await page.locator('section[aria-label="Fundar uma Corporação"]').first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(page, 'corp-06-vazia-fundar')
  })

  await step('corp-codigo', async () => {
    const page = cand.page
    await page.evaluate(() => document.querySelector('.devo-scroll')?.scrollTo({ top: 0 })).catch(() => {})
    await codigo(page, 'CRP-AAAA-AAAA')
    await shot(page, 'corp-07-codigo-invalido')
    await codigo(page, 'crp-cnxa-9x4t')
    await shot(page, 'corp-08-codigo-necro')
    await page.keyboard.press('Escape')
    await wait(700)
    await codigo(page, 'CRP-HQRA-3746')
    await shot(page, 'corp-09-codigo-previa')
    await tryClick(page.getByRole('dialog').getByRole('button', { name: 'Enviar pedido de entrada', exact: true }).first())
    await wait(1800)
    await page.evaluate(() => document.querySelector('.devo-scroll')?.scrollTo({ top: 0 })).catch(() => {})
    await shot(page, 'corp-10-pedido-enviado')
  })

  const lid = await account('Lidera', 'DEVO-CORP-0003', VET_CARDS)
  await sql("UPDATE corporacao_membros SET cargo = 'membro' WHERE corporacao_id = $1 AND cargo = 'lider'", [ORDEM]).catch((e) => manifest.errors.push({ step: 'corp-lider-1', error: String(e).slice(0, 300) }))
  await sql(
    "INSERT INTO corporacao_membros (player_id, corporacao_id, cargo) SELECT id, $1, 'lider' FROM players WHERE lower(name) = 'lidera' ON CONFLICT DO NOTHING",
    [ORDEM],
  ).catch((e) => manifest.errors.push({ step: 'corp-lider-2', error: String(e).slice(0, 300) }))
  await liberarCorp('Lidera')
  await step('corp-lider', async () => {
    const page = lid.page
    await abrirCorp(page)
    await shot(page, 'corp-11-lider-heroi')
    await aba(page, 'Pedidos')
    await shot(page, 'corp-12-pedidos-perfil')
    await tryClick(page.getByRole('button', { name: 'Aprovar', exact: true }).first())
    await wait(1800)
    await shot(page, 'corp-13-pedido-aprovado')
    await aba(page, 'Membros')
    await shot(page, 'corp-14-membros')
    await tryClick(page.getByRole('button', { name: 'Gerir Candida' }).first())
    await wait(900)
    await shot(page, 'corp-15-gerir-membro')
    await page.keyboard.press('Escape')
    await wait(600)
  })

  await step('corp-transferencia', async () => {
    const page = lid.page
    await aba(page, 'Cartas')
    await tryClick(page.getByRole('group', { name: 'Destinatário' }).getByRole('button', { name: 'Candida' }).first())
    await wait(300)
    await tryClick(page.getByRole('list', { name: 'Suas cartas' }).getByRole('button').first())
    await wait(500)
    await shot(page, 'corp-16-transferir-escolha')
    await tryClick(page.getByRole('button', { name: /^Transferir para/ }).first())
    await wait(1800)
    await page.getByRole('status').filter({ hasText: 'foi para' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(page, 'corp-17-transferida')
    await aba(page, 'Recrutar')
    await page.locator('#corp-rec-titulo').fill('Procuramos Records de nervos firmes')
    await page.locator('#corp-rec-texto').fill('Duas vagas para quem já sobreviveu a um Deadly Vote. Reuniões depois de cada edição do Salão.')
    await tryClick(btn(page, 'Publicar no Salão', true))
    await wait(1600)
    await shot(page, 'corp-18-recrutamento')
    await aba(page, 'Jogos')
    await shot(page, 'corp-19-jogos-em-breve')
  })
  await lid.ctx.close()

  await step('corp-membro', async () => {
    const page = cand.page
    await abrirCorp(page)
    await shot(page, 'corp-20-membro-nova')
    await openApp(page, 'Cartas')
    await shot(page, 'corp-21-carta-recebida')
  })
  await cand.ctx.close()

  const fun = await account('Fundadora', 'DEVO-CORP-0004', VET_CARDS)
  await liberarCorp('Fundadora')
  await step('corp-fundar', async () => {
    const page = fun.page
    await abrirCorp(page)
    await page.locator('section[aria-label="Fundar uma Corporação"]').first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(page, 'corp-22-requisitos-faltando')
    await sql(
      "INSERT INTO deadly_vote_entries (vote_id, player_id, outcome) SELECT 'c0a90002-0000-4000-8000-000000000001', id, 'sobreviveu' FROM players WHERE lower(name) = 'fundadora' ON CONFLICT DO NOTHING",
    ).catch((e) => manifest.errors.push({ step: 'corp-dv', error: String(e).slice(0, 300) }))
    await abrirCorp(page)
    const f = btn(page, 'Fundar Corporação', true)
    await f.scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(f)
    await wait(1000)
    await page.locator('#corp-nome').fill('Círculo de Ametista')
    await page.locator('#corp-lema').fill('Nenhuma joia brilha sozinha.')
    await tryClick(btn(page, 'Forma: Coroa', true))
    await tryClick(btn(page, 'Cor: Ametista', true))
    await wait(500)
    await shot(page, 'corp-23-fundar-brasao')
    const pagar = btn(page, 'Pagar e enviar à Companhia', true)
    await pagar.scrollIntoViewIfNeeded().catch(() => {})
    await shot(page, 'corp-24-fundar-custo')
    await tryClick(pagar)
    await wait(2000)
    await page.locator('section[aria-label="Fundar uma Corporação"]').first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(page, 'corp-25-fundacao-em-analise')
  })

  await step('corp-mesa', async () => {
    const o = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
    await openApp(o.page, 'Record')
    await tryClick(o.page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await o.page.locator('nav[aria-label="Seções da mesa"]').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await tryClick(desk(o.page, 'Corporações'))
    await wait(1800)
    await shot(o.page, 'corp-26-mesa-fila')
    const item = o.page.getByRole('listitem', { name: 'Fundação: Círculo de Ametista' }).first()
    await item.scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(o.page, 'corp-27-mesa-fundacao')
    await tryClick(item.getByRole('button', { name: 'Aprovar fundação', exact: true }))
    await wait(1800)
    const ativa = o.page.getByRole('listitem', { name: 'Corporação Círculo de Ametista' }).first()
    await ativa.scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(o.page, 'corp-28-mesa-aprovada')
    await tryClick(ativa.getByRole('button', { name: 'Classificar como Necro', exact: true }))
    await wait(1800)
    await o.page.getByRole('listitem', { name: 'Corporação Círculo de Ametista' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(o.page, 'corp-29-mesa-necro')
    await o.ctx.close()
  })

  await step('corp-necro', async () => {
    const page = fun.page
    await abrirCorp(page)
    await shot(page, 'corp-30-necro')
    await page.route('**/api/corporacoes', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"A Companhia não respondeu. Tente de novo."}' }))
    await abrirCorp(page)
    await shot(page, 'corp-31-erro')
  })
  await fun.ctx.close()
  await db?.end().catch(() => {})
}

await browser.close()
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`capturas: ${manifest.shots.length}, erros: ${manifest.errors.length}, console: ${manifest.console.length}`)
