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
  // 'phone' = 390×844; 'phone-sm' = 360×740 (Android pequeno)
  const phone = kind === 'phone' || kind === 'phone-sm'
  const ctx = await browser.newContext({
    viewport: kind === 'phone-sm' ? { width: 360, height: 740 } : phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
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

/**
 * Cenas com fala de NPC: além de 390×844, repete o quadro numa tela alta (390×900) e numa baixa (360×740)
 * para provar que o retrato fica ancorado na caixa de fala em qualquer altura (DIRECAO-3 §9, NpcAnchor). O mapa
 * das Torres (t20/t25) também, para conferir placas e chips nas três alturas. A Mesa dos textos dos Arcanos (v35/v36) e a
 * tela própria dos Arcanos (arc-*) também: mapa, galeria (inclusive no meio do giro) e altar nas três alturas.
 */
const NPC_VARIANT = /^(03-prologo-(0[2-9]|1\d)|04-tutorial-0[1-6]|26-coruja-0[13]|26-coruja-promocionais|27-javali-[01]|34-javali-[01]|salao-0[2-5]|t10-galo-abertura|t11b-galo-fala|t23-andar-cena|t20-mapa|t25-mapa-progresso|t21-torre-imperador|t45-torre-principal|t22-andar-ficha|t47-torre-picadeiro|poco-0[5-9]|03-melissa-3|n-1[0-7]|n-2[06]|n-3[24]|corp-0[34]|v3[0-7]-|cal-|arc-\d\d)/
const VARIANT_SIZES = [
  [390, 900],
  [360, 740],
]

async function shot(page, name, note = '') {
  try {
    await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 })
    manifest.shots.push({ name, note, url: page.url() })
  } catch (e) {
    manifest.errors.push({ step: name, error: String(e).slice(0, 300) })
  }
  const vp = page.viewportSize()
  if (!NPC_VARIANT.test(name) || !vp || vp.width !== 390 || vp.height !== 844) return
  for (const [width, height] of VARIANT_SIZES) {
    try {
      await page.setViewportSize({ width, height })
      await wait(450)
      await page.screenshot({ path: `${OUT}/${name}@${width}x${height}.jpg`, type: 'jpeg', quality: 82 })
      manifest.shots.push({ name: `${name}@${width}x${height}`, note, url: page.url() })
    } catch (e) {
      manifest.errors.push({ step: `${name}@${width}x${height}`, error: String(e).slice(0, 300) })
    }
  }
  await page.setViewportSize(vp).catch(() => {})
  await wait(300)
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
    const seenLook = new Set()
    for (let i = 0; i < 220; i++) {
      await wait(800)
      if (i % 5 === 0) await shot(page, `03-prologo-${String(n++).padStart(2, '0')}`)
      // As duas aparências (DIRECAO-3 §9): primeiro a 2D/3D, depois a real. Foto de cada painel antes e
      // depois da Seleção automática.
      const look = [
        ['art', 'Aparência 2D/3D', '03-prologo-aparencia'],
        ['real', 'Aparência real', '03-prologo-aparencia-real'],
      ].find(([k]) => !seenLook.has(k))
      if (look && (await page.getByRole('form', { name: look[1] }).count())) {
        seenLook.add(look[0])
        await wait(700)
        await shot(page, look[2])
        await tryClick(btn(page, 'Seleção automática'), 1500)
        await wait(500)
        await shot(page, `${look[2]}-auto`)
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

/**
 * Home do celular em telas deslizáveis (Direção 3 §9): se o alvo está noutra tela, desliza até ela pelos
 * botões "Próxima tela do início"/"Tela anterior do início" (o mesmo efeito do arrasto) antes do clique.
 * Fora da home (ou no desktop) não faz nada.
 */
async function revealOnHome(page, target) {
  for (let i = 0; i < 4; i++) {
    const side = await target
      .evaluate((el) => {
        const r = el.getBoundingClientRect()
        return r.right <= 0 ? 'left' : r.left >= window.innerWidth ? 'right' : 'in'
      })
      .catch(() => 'in')
    if (side === 'in') return
    const nav = page.getByRole('button', { name: side === 'right' ? 'Próxima tela do início' : 'Tela anterior do início', exact: true }).first()
    if (!(await tryClick(nav, 3000))) return
    await wait(700)
  }
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
    await revealOnHome(page, exact.first())
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
      // Tela 2 da home (Sistemas): fecha a central e desliza pelo botão de próxima tela.
      await page.getByLabel('Fechar central de avisos').first().click({ timeout: 3000 }).catch(() => {})
      await wait(500)
      await page.getByRole('button', { name: 'Próxima tela do início', exact: true }).first().click({ timeout: 5000 })
      await wait(900)
      await shot(page, '10-home-tela-2', 'home deslizada para a tela dos Sistemas')
      // Arrasto real (toque): volta para a tela 1 rolando o carrossel como o dedo faria.
      await page
        .getByRole('group', { name: 'Telas do início', exact: true })
        .first()
        .evaluate((el) => {
          el.style.scrollSnapType = 'none' // segura o quadro no meio do arrasto (sem o snap)
          el.scrollBy({ left: -el.clientWidth / 2.2, behavior: 'instant' })
        })
      await wait(120)
      await shot(page, '10-home-arrasto', 'meio do arrasto entre as telas')
      await page.getByRole('group', { name: 'Telas do início', exact: true }).first().evaluate((el) => (el.style.scrollSnapType = '')).catch(() => {})
      await page.getByRole('button', { name: 'Tela anterior do início', exact: true }).first().click({ timeout: 5000 }).catch(() => {})
      await wait(900)
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
      // Sala 1: regra da casa ao entrar (mesma raridade, às cegas), mão com contador, canal com atalhos e chat livre.
      if (await tryClick(page.getByRole('button', { name: /^Sala 1,/ }).first())) {
        await wait(1500)
        await shot(page, '24-trocas-sala')
        await tryClick(page.getByRole('button', { name: /^Colocar / }).first())
        await wait(7500)
        await shot(page, '24-trocas-sala-negociando')
        await tryClick(page.getByRole('button', { name: 'Qual o tipo da sua carta?' }).first())
        await wait(3800)
        await shot(page, '24-trocas-sala-frase')
        // Chat livre da sala (Direção 3 §8: todas as salas negociam pelo canal).
        const chat = page.locator('#trade-chat')
        if (await chat.count()) {
          await chat.fill('Troco agora se você aceitar primeiro.').catch(() => {})
          await tryClick(btn(page, 'Enviar', true))
          await wait(3800)
          await shot(page, '24-trocas-sala-chat')
        }
        // Abandonar antes de os dois aceitarem: a carta volta para a mão.
        await tryClick(btn(page, /abandonar|sair/i))
        await wait(800)
        await tryClick(btn(page, /voltar ao corredor/i))
        await wait(800)
      }
      // Corredor rolado até o Protocolo.
      await page.mouse.move(195, 500)
      await page.mouse.wheel(0, 1600)
      await wait(900)
      await shot(page, '24-trocas-scroll')
      await page.mouse.wheel(0, -4000)
      await wait(500)
      // Aceitar e revelar numa sala livre qualquer (o parceiro pode desistir: até 3 tentativas).
      for (let attempt = 0, revealedOk = false; attempt < 3 && !revealedOk; attempt++) {
        if (!(await tryClick(page.getByRole('button', { name: /^Sala \d+, Livre,/ }).first()))) break
        await wait(1200)
        await tryClick(page.getByRole('button', { name: /^Colocar / }).first())
        await wait(7500)
        const accepted = await tryClick(btn(page, 'Aceitar troca', true), 1500)
        if (accepted) {
          await wait(800)
          await shot(page, '24-trocas-aceitou')
          const revealing = await page
            .getByText('Revelando cartas…')
            .first()
            .waitFor({ timeout: 8000 })
            .then(() => true)
            .catch(() => false)
          if (revealing) {
            revealedOk = true
            await wait(900)
            await shot(page, '24-trocas-revelacao')
            await wait(3200)
            await shot(page, '24-trocas-revelada')
          }
        }
        // Sai da sala (concluída ou desfeita) antes da próxima tentativa.
        if (!(await tryClick(btn(page, /voltar ao corredor/i), 1500))) {
          await tryClick(btn(page, /^abandonar$/i), 1500)
        }
        await wait(1000)
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
      // a primeira tela da apresentação monta a cena; dá tempo antes da primeira captura
      await wait(2500)
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
    let promo = false
    let quizShot = false
    for (let i = 0; i < 26; i++) {
      // Fala das Únicas e Promocionais: espera a digitação terminar e fotografa as palavras com efeito.
      if (!promo && (await page.locator('p[aria-live="polite"] .dv-txt-holo').count())) {
        promo = true
        await wait(3600)
        await shot(page, '26-coruja-promocionais')
      }
      if ([1, 3, 5, 7, 11, 14, 16, 18].includes(i)) await shot(page, `26-coruja-${String(i).padStart(2, '0')}`)
      const quiz = page.getByRole('button', { name: /^Rara$/ })
      if (await quiz.count()) {
        if (!quizShot) {
          quizShot = true
          await wait(1200)
          await shot(page, '26-coruja-quiz')
        }
        await tryClick(quiz.first())
      }
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
      // As duas aparências (2D/3D e real), cada uma pela Seleção automática; foto da segunda com a primeira já respondida.
      const look = [['art', 'Aparência 2D/3D'], ['real', 'Aparência real']].find(([k]) => !seen.has(`aparencia-${k}`))
      if (look && (await page.getByRole('form', { name: look[1] }).count())) {
        seen.add(`aparencia-${look[0]}`)
        await tryClick(btn(page, 'Seleção automática'), 1500)
        await wait(400)
        if (look[0] === 'real') await shot(page, '06-genero-aparencia-real')
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

// ── 2d. Prólogo: a queda das crianças e a entrada da Melissa (convite 0009, Brisa) ───────────────
// Quadros intermediários da queda (DIRECAO-3 §9): o relógio da página é parado (page.clock) para o
// golpe (quadro com avanço automático) esperar as fotos, e as animações do teatro são postas em
// instantes fixos (ms desde o início do quadro). Depois, a Melissa entrando: nunca em cor antes da hora.
if (want('novato')) {
  const { ctx, page } = await account('Brisa', 'DEVO-TEST-0009', [], 'phone', {
    welcomed: false,
    owlMet: false,
    javaliMet: false,
    profile: { appearanceChangesLeft: 1 },
    // índice 7 = "Com um simples acidente." (o próximo quadro é o golpe)
    story: { part: 'prologue', index: 7, vars: { name: 'Brisa' } },
  })
  /** Pausa tudo e põe as animações dentro de `scope` (seletor) no instante `at`. */
  const freezeIn = (scope, at, up = 0) =>
    page
      .evaluate(
        ([scope, at, up]) => {
          let root = document.querySelector(scope)
          for (let k = 0; k < up && root; k++) root = root.parentElement
          if (!root) return false
          for (const a of document.getAnimations()) {
            a.pause()
            const t = a.effect?.target
            if (t && root.contains(t)) a.currentTime = at
          }
          return true
        },
        [scope, at, up],
      )
      .catch(() => false)
  const thaw = () => page.evaluate(() => document.getAnimations().forEach((a) => a.play())).catch(() => {})
  await step('queda', async () => {
    await page.clock.install()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1000)
    await btn(page, 'Continuar').click({ timeout: 15000 })
    await page.getByText('Com um simples acidente.').first().waitFor({ timeout: 8000 })
    await wait(2600)
    const t0 = await page.evaluate(() => Date.now())
    await page.keyboard.press('Enter')
    await page.clock.pauseAt(t0 + 400)
    await page.locator('[data-fall="trip"]').first().waitFor({ state: 'attached', timeout: 4000 })
    await wait(150)
    // o golpe: tesoura no chão, clarão e o corte nascendo do ponto do impacto
    await freezeIn('[data-theater]', 330, 1)
    await shot(page, '03-queda-1-golpe')
    // o corte aberto para os dois lados, a faixa do chão dobrando para o escuro, as crianças na borda
    await freezeIn('[data-theater]', 1050, 1)
    await shot(page, '03-queda-2-corte')
    await thaw()
    await page.clock.resume()
    await page.locator('[data-fall="fall"]').first().waitFor({ state: 'attached', timeout: 6000 })
    await wait(150)
    // a queda: as crianças escorregando para o vão, com rastro
    await freezeIn('[data-theater]', 480, 1)
    await shot(page, '03-queda-3-queda')
    await thaw()
    await wait(2600)
    await shot(page, '03-queda-4-fenda')
  })
  await step('melissa-entrada', async () => {
    // Volta o save para a fala de cenário da mina (índice 27), numa página que não é o app.
    const p2 = await ctx.newPage()
    await p2.goto(`${BASE}/images/card-back.png`)
    await api(p2, '/api/save', makeSave([], { welcomed: false, owlMet: false, javaliMet: false, profile: { appearanceChangesLeft: 1 }, story: { part: 'prologue', index: 27, vars: { name: 'Brisa' } } })).then(
      (r) => r.status >= 400 && manifest.errors.push({ step: 'melissa-save', error: `${r.status} ${r.text}` }),
    )
    await p2.close()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1000)
    await btn(page, 'Continuar').click({ timeout: 15000 })
    await page.getByText(/A paisagem se abre/).first().waitFor({ timeout: 8000 })
    // espera a fala de cenário terminar de digitar sozinha (Enter aqui só completaria o texto)
    await wait(4600)
    // "Alguém parece se aproximar.": a silhueta entra. Fotos no começo da transição (onde ela piscava).
    const approach = page.locator('[data-melissa="approach"]')
    await page.keyboard.press('Enter')
    await approach.first().waitFor({ state: 'attached', timeout: 4000 })
    await wait(40)
    await freezeIn('[data-melissa]', 160)
    await shot(page, '03-melissa-1-silhueta-160ms')
    await freezeIn('[data-melissa]', 900)
    await shot(page, '03-melissa-2-silhueta')
    await thaw()
    await wait(1800)
    const on = page.locator('[data-melissa="on"]')
    for (let k = 0; k < 4 && !(await on.count()); k++) {
      await page.keyboard.press('Enter')
      await wait(300)
    }
    await on.first().waitFor({ state: 'attached', timeout: 4000 })
    await wait(1400)
    await shot(page, '03-melissa-3-em-cena')
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
      // Memory Rush online: A procura um par de verdade (carta 1 × cada outra) e as duas telas
      // mostram o par levado — prova que as cartas viram e que o par sincroniza com o oponente.
      if (slug === 'memory-rush') {
        const cards = A.page.getByRole('button', { name: /^Carta (virada|revelada)$/ })
        const n = await cards.count()
        for (let k = 1; k < n; k++) {
          if (!(await tryClick(cards.nth(0), 1500))) break
          await wait(120)
          if (k === 1) await shot(A.page, `40-partida-${slug}-a3-virada`)
          if (!(await tryClick(cards.nth(k), 1500))) break
          await wait(220)
          if (await cards.nth(0).isDisabled().catch(() => false)) break
          await wait(650)
        }
        await shot(A.page, `40-partida-${slug}-a3`)
        await wait(1400)
        await shot(B.page, `40-partida-${slug}-b3`)
      }
    })
  }
  // Living Chess: demonstração guiada do Javali (sem bot): entrada da câmera, lances explicados, mate e fim.
  await step('partida-xadrez-demo', async () => {
    const { page } = A
    await tryClick(page.getByRole('button', { name: /desistir e sair/i }).first(), 4000)
    await wait(1500)
    await tryClick(page.getByRole('button', { name: /voltar à mesa/i }).first(), 4000)
    await page.goto('about:blank').catch(() => {})
    await openApp(page, 'Sala de Jogos')
    const card = page.locator('[aria-label="Jogos da semana"] > *').filter({ hasText: /Living Chess/i }).first()
    await card.getByRole('button', { name: /tutorial/i }).first().click({ timeout: 12000 })
    await wait(1800)
    await shot(page, '41-xadrez-entrada')
    await wait(2600)
    await shot(page, '41-xadrez-lance')
    await wait(900)
    await shot(page, '41-xadrez-lance-b')
    await wait(6000)
    await shot(page, '41-xadrez-meio')
    await tryClick(page.getByRole('button', { name: 'Histórico de lances' }).first(), 3000)
    await wait(700)
    await shot(page, '41-xadrez-historico')
    await tryClick(page.getByRole('button', { name: 'Histórico de lances' }).first(), 3000)
    await tryClick(page.getByRole('button', { name: 'Configurações' }).first(), 3000)
    await wait(700)
    await shot(page, '41-xadrez-config')
    await tryClick(page.getByRole('button', { name: 'Configurações' }).first(), 3000)
    await page.getByRole('heading', { name: /demonstração concluída/i }).waitFor({ timeout: 30000 }).catch(() => {})
    await wait(800)
    await shot(page, '41-xadrez-fim')
    await tryClick(page.getByRole('button', { name: /voltar à mesa/i }).first(), 3000)
    await wait(2500)
    await page.evaluate(() => document.querySelector('[aria-label="Registro das partidas"]')?.scrollIntoView({ block: 'center' }))
    await wait(1200)
    await shot(page, '42-mesa-registro')
  })
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

// ── 3c. Raridades das cartas (pedido do dono 17/10): uma carta por raridade em /estilo, incluindo Ultra Rara,
// Única (granada) e Promocional (holográfica), em 390×844 e 360×740, mais um recorte de cada carta.
if (want('raridades')) {
  await step('raridades', async () => {
    const { ctx, page } = await device()
    await page.goto(`${BASE}/estilo`, { waitUntil: 'networkidle' })
    await wait(3000)
    for (const [w, h] of [
      [390, 844],
      [360, 740],
    ]) {
      await page.setViewportSize({ width: w, height: h })
      await wait(500)
      const tag = `${w}x${h}`
      for (const [k, sel] of [
        ['1', '[data-estilo="raridades"]'],
        ['2', '[data-raridade="rara"]'],
        ['3', '[data-raridade="lendaria"]'],
        ['4', '[data-raridade="promocional"]'],
      ]) {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel)
        await wait(1100)
        await shot(page, `85-raridades-${k}@${tag}`)
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await wait(500)
    for (const r of ['comum', 'incomum', 'rara', 'ultra_rara', 'lendaria', 'unica', 'promocional']) {
      const el = page.locator(`[data-raridade="${r}"]`).first()
      try {
        await el.scrollIntoViewIfNeeded({ timeout: 3000 })
        await wait(700)
        await el.screenshot({ path: `${OUT}/85-raridade-${r}.jpg`, type: 'jpeg', quality: 88 })
        manifest.shots.push({ name: `85-raridade-${r}`, note: 'carta da raridade', url: page.url() })
      } catch (e) {
        manifest.errors.push({ step: `85-raridade-${r}`, error: String(e).slice(0, 300) })
      }
    }
    // Movimento reduzido: a Promocional fica num gradiente iridescente parado (sem animação).
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await wait(600)
    const promo = page.locator('[data-raridade="promocional"]').first()
    await promo.screenshot({ path: `${OUT}/85-raridade-promocional-reduzido.jpg`, type: 'jpeg', quality: 88 }).catch((e) => manifest.errors.push({ step: 'promo-reduzido', error: String(e).slice(0, 300) }))
    manifest.shots.push({ name: '85-raridade-promocional-reduzido', note: 'prefers-reduced-motion', url: page.url() })
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
        await wait(1300)
        await shot(page, 't13b-galo-revelacao', 'cristal se formando')
        await wait(2200)
        await shot(page, 't14-galo-essencia', '+1 Essência de Afinidade do Galo')
        await tryClick(btn(page, 'Continuar', true))
        await wait(800)
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
  const PRINCIPAL = '[PROVISÓRIO] Torre da Ruptura'
  await step('torres-imperador', async () => {
    const page = B.page
    await page.getByRole('button', { name: 'Torre do Imperador', exact: true }).click({ timeout: 10000 })
    await wait(250)
    await shot(page, 't21a-transicao')
    await wait(1400)
    await shot(page, 't21-torre-imperador', 'secundária do Galo')
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't22-andar-ficha')
    await btn(page, 'Subir ao andar I').click({ timeout: 8000 })
    await wait(1300)
    await shot(page, 't23a-revelacao', 'cadeado abrindo')
    await wait(2300)
    await shot(page, 't23b-revelacao-chave', '+1 Chave do Imperador')
    await btn(page, 'Continuar', true).click({ timeout: 8000 })
    await wait(2200)
    await shot(page, 't23-andar-cena')
    await passarCena(page, /Torre do Imperador · Andar I$/)
    await wait(700)
    await shot(page, 't24-andar-concluido')
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
  await staff({ action: 'item.conceder', playerId: bid, item: 'essencia:campanha', quantidade: 1, motivo: 'captura' })
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
    await wait(3600)
    await shot(page, 't41a-revelacao-chave', '+1 Chave do Observatório')
    await btn(page, 'Continuar', true).click({ timeout: 8000 })
    await wait(1500)
    await passarCena(page, /Torre do Observatório · Andar I$/)
    await wait(500)
    await shot(page, 't41-secundaria-chave')
    await btn(page, 'Voltar ao mapa').click({ timeout: 8000 })
    await wait(1200)
    await page.getByRole('button', { name: PRINCIPAL, exact: true }).click({ timeout: 10000 })
    await wait(1600)
    await shot(page, 't45-torre-principal', 'principal sem NPC definido')
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(800)
    await btn(page, 'Subir ao andar I').click({ timeout: 8000 })
    await wait(3600)
    await shot(page, 't46-revelacao-selo', 'andar I da principal')
    await btn(page, 'Continuar', true).click({ timeout: 8000 })
    await wait(1500)
    await passarCena(page, /Torre da Ruptura · Andar I$/)
    await wait(500)
    await page.getByRole('button', { name: /^Andar II:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't42-andar-trancado-essencia', 'tem a chave do Imperador; faltam 2 essências')
  })
  await staff({ action: 'item.conceder', playerId: bid, item: 'essencia:campanha', quantidade: 2, motivo: 'captura' })
  await step('torres-chave', async () => {
    const page = B.page
    await enterOS(page)
    await abrirTorres(page)
    await page.getByRole('button', { name: PRINCIPAL, exact: true }).click({ timeout: 10000 })
    await wait(1600)
    await page.getByRole('button', { name: /^Andar II:/ }).first().click({ timeout: 8000 })
    await wait(800)
    await btn(page, 'Subir ao andar II').click({ timeout: 8000 })
    await wait(3600)
    await tryClick(btn(page, 'Continuar', true), 6000)
    await wait(1500)
    await passarCena(page, /Torre da Ruptura · Andar II$/)
    await wait(500)
    await page.getByRole('button', { name: /^Andar III:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't43-andar-trancado-chave', 'falta a chave do Picadeiro')
    await page.keyboard.press('Escape')
    await wait(600)
    await page.getByRole('button', { name: /^Andar I:/ }).first().click({ timeout: 8000 })
    await wait(900)
    await shot(page, 't44-andar-concluido-ficha', 'concluído: Rever cena')
    await page.keyboard.press('Escape')
    await wait(600)
    await btn(page, 'Voltar ao mapa').click({ timeout: 8000 })
    await wait(1200)
    await page.getByRole('button', { name: 'Torre do Picadeiro', exact: true }).click({ timeout: 10000 })
    await wait(1800)
    await shot(page, 't47-torre-picadeiro')
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

// ── 5. Narrativa e progressão (sys/narrativa): trava → cerimônia → explorar → Galo (Karma) → Melissa ──────
// Contas: Lacre (DEVO-NARR-0002, sem tutorial) e Sirius (DEVO-NARR-0001, tutorial vencido via SQL).
if (want('narrativa')) {
  const { default: pg } = await import('pg')
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const sql = (t, p) => db.query(t, p).then((r) => r.rows)
  // A cena do motor é a última <section role=dialog> (outras telas podem ter diálogos ocultos antes).
  const dlg = (page) => page.locator('section[data-cena]').last()
  // textContent (não innerText): a legenda de som é caixa-alta só no CSS.
  const textoDlg = (page) => dlg(page).evaluate((el) => el.textContent ?? '', null, { timeout: 2000 }).catch(() => '')
  /** Avança a cena até o texto aparecer (por inteiro); escolhas no caminho: a primeira, ou `pick` por rótulo. */
  async function ate(page, alvo, { pick = {}, max = 400 } = {}) {
    for (let i = 0; i < max; i++) {
      const t = await textoDlg(page)
      if (!t) {
        // Sem cena aberta: não adianta apertar teclas na home.
        await wait(500)
        if (!(await textoDlg(page))) break
        continue
      }
      if (typeof alvo === 'string' ? t.includes(alvo) : alvo.test(t)) {
        await wait(1600)
        return true
      }
      const grupo = page.locator('[aria-label="Escolha o que dizer"]')
      if (await grupo.count()) {
        const quer = Object.entries(pick).find(([k]) => t.includes(k))
        const alvoBtn = quer ? page.getByRole('button', { name: quer[1], exact: true }) : grupo.locator('button:not([disabled])')
        await tryClick(alvoBtn.first(), 4000)
        await wait(700)
        continue
      }
      // Espera a fala terminar de digitar (o texto inteiro fica no DOM) e só então toca para avançar.
      const pronto = dlg(page).getByRole('button', { name: 'Continuar', exact: true }).first()
      if (await pronto.count()) {
        await tryClick(pronto, 2000)
        await wait(450)
      } else await wait(300)
    }
    manifest.errors.push({ step: 'narrativa-ate', error: `não chegou em ${alvo}; último texto: ${(await textoDlg(page)).slice(-160)}` })
    return false
  }

  await step('narrativa-trancado', async () => {
    const { ctx, page } = await account('Lacre', 'DEVO-NARR-0002', VET_CARDS)
    await enterOS(page)
    await wait(1500)
    await page.locator('section[aria-label="Sistemas"]').first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
    await wait(800)
    await shot(page, 'n-01-home-trancado', 'sem o Deadly Vote tutorial: sistemas novos trancados com o motivo')
    // Erro: cena com flag exigida aberta à força → o servidor recusa (403) e a cena mostra o aviso.
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('devo:cena', { detail: 'galo-casa' })))
    await wait(2200)
    await shot(page, 'n-50-cena-trancada', 'erro: cena exige flag (403 do servidor)')
    await ctx.close()
  })

  const { ctx, page } = await account('Sirius', 'DEVO-NARR-0001', VET_CARDS)
  await step('narrativa-desbloqueio', async () => {
    const [p] = await sql('SELECT id FROM players WHERE lower(name) = lower($1)', ['Sirius'])
    for (const f of ['salao_mascaras', 'poco', 'torres', 'diario', 'galo_casa']) {
      await sql("INSERT INTO player_unlocks (player_id, flag, source, ref) VALUES ($1, $2, 'deadly_vote', 'captura') ON CONFLICT DO NOTHING", [p.id, f])
    }
    await enterOS(page)
    await wait(1200)
    await shot(page, 'n-02-cerimonia', 'cerimônia de desbloqueio depois do tutorial')
    await wait(7000)
    await page.locator('section[aria-label="Sistemas"]').first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
    await wait(900)
    await shot(page, 'n-03-home-liberado', 'ícones novos destrancados (losango = ainda não aberto)')
    await btn(page, 'Poço dos Milagres', true).click({ timeout: 8000 })
    await wait(2600)
    await shot(page, 'n-04-sistema-aberto', 'sistema liberado abre a própria tela (Poço) e conta como explorado')
    // Explorou Poço e Torres (as apresentações deles têm roteiro próprio): grava no save e volta à home.
    await page.goto(`${BASE}/images/card-back.png`)
    await api(page, '/api/save', makeSave(VET_CARDS, { sistemasVistos: ['poco', 'torres'], desbloqueiosVistos: ['salao', 'poco', 'torres'] }))
    await enterOS(page)
    await wait(1500)
    const agora = page.getByRole('button', { name: 'Ir para casa' }).first()
    await agora.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
    await wait(600)
    await shot(page, 'n-05-cartao-galo', 'depois de explorar: cartão "Ir para casa" (visita do Galo)')
  })

  await step('narrativa-galo', async () => {
    await page.getByRole('button', { name: 'Ir para casa' }).first().click({ timeout: 8000 })
    await wait(2600)
    await shot(page, 'n-10-galo-abertura', 'narração entre colchetes')
    await ate(page, 'Som de porta abrindo')
    await shot(page, 'n-11-galo-som', 'legenda de som')
    await ate(page, 'Um cativeiro, completamente')
    await shot(page, 'n-12-galo-escolha', 'escolhas numeradas')
    await ate(page, 'a campainha toca')
    await shot(page, 'n-13-galo-campainha')
    await ate(page, 'Que estranho')
    await shot(page, 'n-14-galo-pensamento', 'pensamento entre aspas')
    await ate(page, 'Ir abrir a porta')
    await shot(page, 'n-15-galo-escolha-acao', 'opções de ação (negrito no texto do dono)')
    await ate(page, 'Um Anfitrião apareceu')
    await shot(page, 'n-16-galo-aparece')
    await ate(page, 'Cláudio')
    await shot(page, 'n-17-galo-lembra')
    await page.getByRole('button', { name: 'Galo…?', exact: true }).first().click({ timeout: 5000 })
    await wait(2600)
    await shot(page, 'n-18-galo-bingo', 'resposta por opção')
    await ate(page, 'de tempo para você')
    await shot(page, 'n-19-galo-tempo', 'Galo transfere Tempo (valor provisório) — selo de Tempo')
    // Recarregar no meio: retoma no passo salvo e não repete o Tempo.
    await wait(1200)
    await enterOS(page)
    await wait(1500)
    await page.getByRole('button', { name: 'Ir para casa' }).first().click({ timeout: 8000 })
    await wait(2800)
    await shot(page, 'n-20-galo-retomada', 'recarregou: retoma onde parou')
    await ate(page, 'A luz pisca')
    await wait(200)
    await shot(page, 'n-21-galo-luz')
    await ate(page, 'Sistema de Karma')
    await shot(page, 'n-22-galo-sistema-karma', 'caixa de sistema')
    await ate(page, 'medido pela linha do destino')
    await shot(page, 'n-23-destino-neutro', 'linha do destino (sem número)')
    await ate(page, 'sobe conforme')
    await shot(page, 'n-24-destino-ordem')
    await ate(page, 'rumo ao caos')
    await shot(page, 'n-25-destino-caos')
    await ate(page, 'Você come minhocas')
    await shot(page, 'n-26-galo-duvida')
    await ate(page, 'Novo contato em Mensagens')
    await shot(page, 'n-27-galo-contato')
    await ate(page, 'Pelo menos ele se despediu')
    await shot(page, 'n-28-galo-fim')
    await page.keyboard.press('Enter')
    await wait(2500)
  })

  await step('narrativa-melissa', async () => {
    // A chamada da Companhia chega alguns segundos depois de voltar para a home.
    await enterOS(page)
    await page.getByRole('dialog', { name: 'Uma chamada da Companhia' }).waitFor({ timeout: 20000 })
    await wait(1800)
    await shot(page, 'n-30-melissa-chamada', 'ícone da Companhia + chamada holográfica')
    await ate(page, 'holograma se materializar')
    await wait(600)
    await shot(page, 'n-31-melissa-materializa')
    await ate(page, 'Sou eu mais uma vez')
    await shot(page, 'n-32-melissa-holograma', 'holograma em luz fria (ametista/aço)')
    await ate(page, 'Necro-Corporação?')
    await shot(page, 'n-33-melissa-escolha')
    await page.getByRole('button', { name: 'Parece interessante. Onde encontro uma Necro-Corporação?', exact: true }).first().click({ timeout: 5000 })
    await ate(page, 'retirada do seu Shuffler')
    await shot(page, 'n-34-melissa-multa', 'opção 2 tira Tempo do Shuffler (provisório)')
    await ate(page, 'A chamada é encerrada')
    await shot(page, 'n-35-melissa-encerra')
    await ate(page, 'tomar mais cuidado')
    await page.keyboard.press('Enter')
    await wait(3000)
    await shot(page, 'n-36-corporacoes-liberado', 'Corporações liberado ao fim da chamada (cerimônia)')
  })

  await step('narrativa-mensagens', async () => {
    await wait(6000)
    await openApp(page, 'Mensagens')
    await shot(page, 'n-40-mensagens-galo', 'contato do Galo em Mensagens')
  })

  await step('narrativa-reflexao', async () => {
    await enterOS(page)
    await wait(1500)
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('devo:cena', { detail: { id: 'anfitriao-de-que' }, cancelable: true })))
    await wait(1500)
    await ate(page, 'Anfitrião do Imperador.')
    await shot(page, 'n-41-reflexao', 'reflexão "Anfitrião do quê?" (ao sair das Torres): cinco opções')
    await page.getByRole('button', { name: 'Anfitrião do Imperador.', exact: true }).first().click({ timeout: 5000 })
    await wait(3600)
    await shot(page, 'n-42-reflexao-resposta')
  })
  await ctx.close()
  await db.end()
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
  const view = (page, sel, block = 'start') =>
    page.locator(sel).first().evaluate((el, b) => el.scrollIntoView({ block: b }), block).catch(() => {})
  /**
   * Quadros de uma animação do Poço: congela tudo (CSS e o fim da revelação, via window.__pocoCongelado) e põe
   * as animações dentro de `escopo` no instante `ms` depois de montarem. O clique é feito por `acao`.
   */
  const quadros = async (page, acao, escopo, frames) => {
    await page.evaluate(() => (window.__pocoCongelado = true)).catch(() => {})
    await acao()
    await page.locator(escopo).first().waitFor({ state: 'attached', timeout: 8000 }).catch(() => {})
    for (const [ms, nome] of frames) {
      await page
        .evaluate(
          ([escopo, ms]) => {
            const raiz = document.querySelector(escopo)
            for (const a of document.getAnimations()) {
              a.pause()
              const t = a.effect?.target
              if (raiz && t && raiz.contains(t)) a.currentTime = ms
            }
          },
          [escopo, ms],
        )
        .catch(() => {})
      await wait(120)
      await shot(page, nome)
    }
    await page.evaluate(() => {
      window.__pocoCongelado = false
      document.getAnimations().forEach((a) => a.play())
    }).catch(() => {})
  }

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
    // etapa 1 — ativação: a moeda em arco (com rastro), o respingo e a névoa subindo
    await quadros(page, () => tryClick(btn(page, 'Usar o giro grátis', true)), '.poco-arco-x', [])
    await quadros(page, async () => {}, '.poco-cena', [
      [330, 'poco-15-moeda-caindo'],
      [1000, 'poco-15b-respingo'],
      [1700, 'poco-15c-nevoa'],
    ])
    await wait(600)
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
    // lixo: a luz tosse cinza, o item cai murcho, poeira
    await quadros(page, () => tryClick(btn(page, 'Inspecionar Balde', true)), '[aria-label^="Resultado do balde"]', [
      [250, 'poco-19a-lixo-luz'],
      [700, 'poco-19b-lixo-cai'],
      [1250, 'poco-19c-lixo-poeira'],
    ])
    await wait(1800)
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
    // raro: sobe prata (como um comum), engasga, explode na cor da raridade, emerge
    await quadros(page, () => tryClick(btn(page, 'Inspecionar Balde', true)), '[aria-label^="Resultado do balde"]', [
      [320, 'poco-22b-raro-prata'],
      [700, 'poco-22c-raro-engasgo'],
      [1150, 'poco-22d-raro-surto'],
      [1750, 'poco-22a-revelacao-raro'],
    ])
    await wait(3200)
    await shot(page, 'poco-22-resultado-raro')
    await tryClick(btn(page, 'Guardar', true))
    await wait(800)
  })

  // Uma revelação por categoria (fragmento, essência e os três tipos de cosmético de teste).
  await step('poco-categorias', async () => {
    await sql("SELECT devo_item_grant(id, 'dracma_comum', 6, 'captura', NULL, NULL, 'captura-poco-moedas:' || id) FROM players WHERE lower(name) = 'brasa'")
    await abrirPoco(page, 'Poço dos Milagres')
    const giroUI = async (nome) => {
      await tryClick(btn(page, 'Lançar Moeda', true))
      await wait(800)
      await tryClick(btn(page, 'Lançar Dracma Comum', true))
      await wait(1400)
      await tryClick(btn(page, 'Girar Manivela', true))
      await wait(900)
      await tryClick(btn(page, 'Soltar a manivela', true))
      await wait(2900)
      await tryClick(btn(page, 'Inspecionar Balde', true))
      await wait(2500)
      await shot(page, nome)
      if (!(await tryClick(btn(page, 'Guardar', true), 1500))) await tryClick(btn(page, 'Devolver ao poço', true), 1500)
      await wait(900)
    }
    await forcar('dracma_comum', 'fragmento')
    await giroUI('poco-26-resultado-fragmento')
    await forcar('dracma_comum', 'essencia')
    await giroUI('poco-27-resultado-essencia')
    await forcar('dracma_comum', 'cosmetico')
    await giroUI('poco-28-resultado-cosmetico-1')
    await giroUI('poco-29-resultado-cosmetico-2')
    await giroUI('poco-30-resultado-cosmetico-3')
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
    await o.page.keyboard.press('Escape')
    await wait(500)

    // Prêmios do pool (Mesa do Owner). Criados pela API do próprio Owner; só na moeda Dracma Rara para não
    // mexer nas outras capturas nem no poco-test. No fim ficam desligados.
    const api = async (body) => {
      const r = await o.page.request.post(`${BASE}/api/poco`, { data: body })
      const j = await r.json().catch(() => null)
      if (!r.ok()) manifest.errors.push({ step: 'poco-premios-api', error: `${r.status()} ${JSON.stringify(j).slice(0, 200)}` })
      return j
    }
    const tempo = await api({ action: 'premio.salvar', premio: { tipo: 'tempo', minutos: 30, nome: 'Meia hora esquecida', descricao: 'Trinta minutos que alguém jogou fora.', raridade: 'comum', peso: 1000000, moedas: ['dracma_rara'] } })
    const botao = await api({ action: 'premio.salvar', premio: { tipo: 'lixo', nome: 'Botão sem casa', descricao: 'Um botão de casaco, sem casaco e sem casa. O poço achou graça.', imagem: '/images/poco/lixo-tampa.webp', raridade: 'comum', peso: 1000000, moedas: ['dracma_rara'], ativo: false } })
    await api({ action: 'premio.salvar', premio: { tipo: 'carta', cardId: 'olho', raridade: 'raro', peso: 2, estoque: 3, ativo: false } })

    await step('poco-mesa-premios', async () => {
      await openApp(o.page, 'Record')
      await tryClick(o.page.getByRole('tab', { name: /Mesa/i }).first())
      await wait(2000)
      await view(o.page, 'nav[aria-label="Seções da mesa"]', 'start')
      await tryClick(desk(o.page, 'Poço'))
      await wait(2200)
      await shot(o.page, 'poco-40-mesa-premios')
      if (await tryClick(btn(o.page, 'Adicionar prêmio', true))) {
        await wait(800)
        await o.page.getByLabel(/^Nome/).first().fill('Dente de leite').catch(() => {})
        await o.page.getByLabel(/^Texto no balde/).first().fill('Pequeno, branco e de alguém. Não pergunte de quem.').catch(() => {})
        await o.page.getByLabel(/^Peso/).first().fill('40').catch(() => {})
        await wait(400)
        await shot(o.page, 'poco-41-mesa-novo-premio')
        await o.page.getByRole('combobox', { name: 'Moeda da tabela' }).first().selectOption('dracma_comum').catch(() => {})
        await o.page.getByRole('combobox', { name: 'Moeda da tabela' }).first().scrollIntoViewIfNeeded().catch(() => {})
        await wait(600)
        await shot(o.page, 'poco-42-mesa-chances-previa')
        await tryClick(btn(o.page, 'Cancelar', true))
        await wait(500)
      }
    })

    // Giro do Owner com os prêmios do pool: comum (Tempo) e o prêmio lixo novo.
    await sql("SELECT devo_item_grant(id, 'dracma_rara', 3, 'captura', NULL, NULL, 'captura-poco-rara:' || id) FROM players WHERE lower(name) = 'veterano'")
    if (original) await sql("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify({ ...original, dracma_rara: { lixo: 0.0001, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 } })])
    const giroOwner = async (prefixo, frames) => {
      await abrirPoco(o.page, 'Poço dos Milagres')
      await tryClick(btn(o.page, 'Lançar Moeda', true))
      await wait(800)
      await tryClick(btn(o.page, 'Lançar Dracma Rara', true))
      await wait(1600)
      await tryClick(btn(o.page, 'Girar Manivela', true))
      await wait(900)
      await shot(o.page, `${prefixo}-a-manivela`)
      await tryClick(btn(o.page, 'Soltar a manivela', true))
      await wait(700)
      await shot(o.page, `${prefixo}-b-subindo`)
      await wait(2300)
      await quadros(o.page, () => tryClick(btn(o.page, 'Inspecionar Balde', true)), '[aria-label^="Resultado do balde"]', frames.map(([ms, nome]) => [ms, `${prefixo}-${nome}`]))
      await wait(3000)
      await shot(o.page, `${prefixo}-e-resultado`)
      if (!(await tryClick(btn(o.page, 'Guardar', true), 1500))) await tryClick(btn(o.page, 'Devolver ao poço', true), 1500)
      await wait(900)
    }
    await step('poco-giro-comum', async () => {
      await giroOwner('poco-50-comum', [[300, 'c-luz'], [800, 'd-revela']])
    })
    await step('poco-giro-premio-lixo', async () => {
      if (tempo?.id) await api({ action: 'premio.ativar', id: tempo.id, ativo: false })
      if (botao?.id) await api({ action: 'premio.ativar', id: botao.id, ativo: true })
      await giroOwner('poco-51-lixo-owner', [[300, 'c-luz'], [800, 'd-cai']])
    })
    if (botao?.id) await api({ action: 'premio.ativar', id: botao.id, ativo: false })
    if (tempo?.id) await api({ action: 'premio.ativar', id: tempo.id, ativo: false })
    await restaurar()
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
    await tryClick(page.getByRole('dialog').getByRole('button', { name: 'Enviar pedido', exact: true }).first())
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
    await tryClick(btn(page, 'Transferir carta', true))
    await wait(1800)
    await page.getByRole('status').filter({ hasText: 'foi para' }).first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(page, 'corp-17-transferida')
    // A cena da Narrativa "Uma chamada da Companhia" pode abrir por cima (gatilho do enredo): avança as falas
    // dela (Enter / primeira escolha) e, se ainda estiver aberta, sai pelo botão "Sair" antes de seguir.
    const chamada = page.getByRole('dialog', { name: 'Uma chamada da Companhia' })
    if (await chamada.first().waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)) {
      await shot(page, 'corp-17b-chamada-da-companhia', 'cena da Narrativa por cima das Corporações')
      for (let k = 0; k < 40 && (await chamada.count()); k++) {
        const opcao = chamada.locator('[aria-label="Sua resposta"] button:not([disabled]), [aria-label="Escolhas de diálogo"] button:not([disabled])')
        if (await opcao.count()) await tryClick(opcao.first())
        else await page.keyboard.press('Enter')
        await wait(500)
      }
      if (await chamada.count()) await tryClick(chamada.getByRole('button', { name: 'Sair', exact: true }).first(), 4000)
      await chamada.first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {})
      await wait(800)
    }
    await aba(page, 'Recrutar')
    await page.locator('#corp-rec-titulo').fill('Procuramos Records de nervos firmes')
    await page.locator('#corp-rec-texto').fill('Duas vagas para quem já sobreviveu a um Deadly Vote. Reuniões depois de cada edição do Salão.')
    await tryClick(btn(page, 'Publicar no Salão', true))
    await wait(1600)
    await shot(page, 'corp-18-recrutamento')
    await aba(page, 'Membros')
    await page.locator('section[aria-label="Jogos coletivos especiais"]').first().scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
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
    const f = btn(page, 'Fundar', true)
    await f.scrollIntoViewIfNeeded().catch(() => {})
    await tryClick(f)
    await wait(1000)
    await page.locator('#corp-nome').fill('Círculo de Ametista')
    await page.locator('#corp-lema').fill('Nenhuma joia brilha sozinha.')
    await tryClick(btn(page, 'Forma: Coroa', true))
    await tryClick(btn(page, 'Cor: Ametista', true))
    await wait(500)
    await shot(page, 'corp-23-fundar-brasao')
    const pagar = btn(page, 'Pagar e enviar', true)
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
    if (!(await tryClick(item.getByRole('button', { name: 'Aprovar fundação', exact: true }), 8000))) {
      const [c] = await sql("SELECT id FROM corporacoes WHERE nome = 'Círculo de Ametista' AND status = 'pendente'").catch(() => [])
      if (c) await api(o.page, '/api/corporacoes', { action: 'mesa.fundacao', id: c.id, decisao: 'aprovar' })
      await tryClick(desk(o.page, 'Corporações'))
    }
    await wait(2200)
    const ativa = o.page.getByRole('listitem', { name: 'Corporação Círculo de Ametista' }).first()
    await ativa.scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(o.page, 'corp-28-mesa-aprovada')
    await tryClick(ativa.getByRole('button', { name: 'Classificar como Necro', exact: true }), 8000)
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

// ── Cosméticos: coleção (arte), inventário, pré-visualização, perfil, chat, ranking, admin, Owner oculto ──
if (want('cosmeticos')) {
  const SEED = {
    Matheus: '00000000-0000-4000-8000-000000000003',
    Mordomo: '00000000-0000-4000-8000-000000000011',
    Sentinela: '00000000-0000-4000-8000-000000000010',
  }
  const INV = { Matheus: 'DEVO-STAF-MATH', Mordomo: 'DEVO-STAF-MORD', Sentinela: 'DEVO-STAF-SENT' }
  const seedAcc = async (name, kind = 'phone') => {
    const d = await device(kind)
    await d.ctx.addCookies([{ name: 'devo_player', value: SEED[name], url: BASE }])
    await d.page.goto(BASE, { waitUntil: 'networkidle' })
    let up
    for (let i = 0; i < 6; i++) {
      up = await api(d.page, '/api/auth/sign-up/email', { email: hexEmail(name), password: 'teste123', name, username: name, displayUsername: name }, { 'x-devo-invite': INV[name] })
      if (up.status !== 429) break
      await wait(11000)
    }
    if (up.status >= 400) {
      const inn = await api(d.page, '/api/auth/sign-in/username', { username: name, password: 'teste123' })
      if (inn.status >= 400) manifest.errors.push({ step: `cos-${name}-auth`, error: `signup ${up.status} ${up.text}; signin ${inn.status}` })
    }
    const saved = await api(d.page, '/api/save', makeSave(VET_CARDS))
    if (saved.status >= 400) manifest.errors.push({ step: `cos-${name}-save`, error: `${saved.status} ${saved.text}` })
    return d
  }
  const view = (page, sel, block = 'start') =>
    page.locator(sel).first().evaluate((el, b) => el.scrollIntoView({ block: b }), block).catch(() => {})
  const full = async (page, name) => {
    try {
      await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80, fullPage: true })
      manifest.shots.push({ name, note: 'página inteira', url: page.url() })
    } catch (e) {
      manifest.errors.push({ step: name, error: String(e).slice(0, 300) })
    }
  }
  const abrirColecao = async (page) => {
    await openApp(page, 'Record')
    await wait(1200)
    await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
    await wait(500)
    await tryClick(btn(page, 'Abrir coleção', true), 4000)
    await wait(1500)
    await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
    await wait(500)
  }
  const aba = (page, nome) => tryClick(page.getByRole('tablist', { name: 'Categorias da coleção' }).getByRole('tab', { name: nome, exact: true }).first())
  const item = (page, nome) => page.locator('ul[aria-label^="Itens:"] button').filter({ hasText: nome }).first()

  // Vitrine da coleção inteira (arte em tamanho grande): celular e área de trabalho.
  await step('cos-galeria', async () => {
    const { ctx, page } = await device('phone')
    await page.goto(`${BASE}/estilo/cosmeticos`, { waitUntil: 'networkidle' })
    await wait(1500)
    await shot(page, 'cos-00-galeria-topo')
    await view(page, 'section[aria-label="Prévia da nova direção"]')
    await wait(800)
    await shot(page, 'cos-80-previa-asas')
    await view(page, 'article[aria-label="Prévia: Coração da Condessa"]')
    await wait(500)
    await shot(page, 'cos-81-previa-coracao')
    for (const [sel, nome] of [['article[aria-label="Olho do Arcano"]', 'cos-01-galeria-arcano'], ['article[aria-label="Última Badalada"]', 'cos-02-galeria-badalada'], ['section[aria-label="Emblemas"]', 'cos-03-galeria-emblemas'], ['section[aria-label="Balões"]', 'cos-04-galeria-baloes'], ['section[aria-label="Efeitos do nome"]', 'cos-05-galeria-efeitos']]) {
      await view(page, sel)
      await wait(500)
      await shot(page, nome)
    }
    await ctx.close()
    const d = await device('desktop')
    await d.page.goto(`${BASE}/estilo/cosmeticos`, { waitUntil: 'networkidle' })
    await wait(1500)
    await full(d.page, 'cos-06-galeria-grade-completa')
    await d.ctx.close()
  })

  const mat = await seedAcc('Matheus')
  const sen = await seedAcc('Sentinela')
  const mor = await seedAcc('Mordomo')

  // Jogador com coleção: perfil equipado, inventário, pré-visualização, bloqueados, equipar.
  await step('cos-jogador', async () => {
    const page = mat.page
    await openApp(page, 'Record')
    await wait(1200)
    await shot(page, 'cos-10-record-moldura')
    await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
    await wait(600)
    await shot(page, 'cos-11-record-identidade')
    await tryClick(btn(page, 'Abrir coleção', true), 4000)
    await wait(1500)
    await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
    await wait(500)
    await shot(page, 'cos-12-colecao')
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(500)
    await shot(page, 'cos-13-colecao-grade-molduras')
    if (await tryClick(item(page, 'Pacto Carmesim'))) {
      await wait(600)
      await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
      await wait(400)
      await shot(page, 'cos-14-preview-bloqueado')
      await view(page, 'article[aria-label^="Detalhe:"]', 'center')
      await wait(400)
      await shot(page, 'cos-15-detalhe-bloqueado')
    }
    if (await tryClick(item(page, 'Asas da Coruja'))) {
      await wait(600)
      await view(page, 'article[aria-label^="Detalhe:"]', 'center')
      await shot(page, 'cos-16-detalhe-obtido')
      await tryClick(page.locator('article[aria-label^="Detalhe:"]').getByRole('button', { name: 'Equipar', exact: true }))
      await wait(1600)
      await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
      await wait(400)
      await shot(page, 'cos-17-equipado-sem-recarregar')
    }
    await view(page, 'div[aria-label="Formato da moldura"]', 'start')
    await tryClick(page.getByRole('button', { name: 'Miniperfil · quadrada' }).first())
    await wait(700)
    await shot(page, 'cos-18-colecao-miniperfil')
    for (const [t, n] of [['Emblemas', 'cos-19-colecao-emblemas'], ['Balões', 'cos-20-colecao-baloes'], ['Efeitos', 'cos-21-colecao-efeitos']]) {
      await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
      await aba(page, t)
      await wait(700)
      await shot(page, n)
    }
    await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
    await aba(page, 'Balões')
    await wait(400)
    if (await tryClick(item(page, 'Ecos do Arcano'))) {
      await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
      await wait(600)
      await shot(page, 'cos-22-preview-balao')
    }
    // Volta a moldura original (o roteiro pode rodar de novo).
    await api(page, '/api/cosmeticos', { action: 'equipar', slot: 'moldura_avatar', key: 'cosmetico:moldura-asas-crepusculo' })
  })

  // Chat da mesa com balões, miniperfis e o Anfitrião; o Owner (Sentinela) aparece como jogador comum.
  await step('cos-chat', async () => {
    const page = mat.page
    await openApp(page, 'Sala de Jogos')
    await wait(1500)
    await view(page, 'section[aria-label="Registro das partidas"]', 'start')
    await wait(1800)
    await shot(page, 'cos-30-chat-baloes')
    await page.evaluate(() => document.querySelector('section[aria-label="Registro das partidas"] ul')?.scrollTo(0, 0))
    await wait(600)
    await shot(page, 'cos-31-chat-anfitriao')
    if (await tryClick(page.getByRole('button', { name: 'Abrir miniperfil de Sentinela' }).first())) {
      await wait(1800)
      await shot(page, 'cos-32-miniperfil-owner-oculto')
      await page.keyboard.press('Escape')
      await wait(500)
    }
    if (await tryClick(page.getByRole('button', { name: 'Abrir miniperfil de Ísis' }).first())) {
      await wait(1800)
      await shot(page, 'cos-33-miniperfil-jogadora')
      await page.keyboard.press('Escape')
      await wait(500)
    }
    if (await tryClick(page.getByRole('button', { name: 'Abrir miniperfil de Matheus' }).first())) {
      await wait(1800)
      await shot(page, 'cos-35-previa-miniperfil-asas')
      await page.keyboard.press('Escape')
      await wait(500)
    }
    if (await tryClick(page.getByRole('button', { name: 'Abrir miniperfil de Mordomo' }).first())) {
      await wait(1800)
      await shot(page, 'cos-34-miniperfil-anfitriao')
      await page.keyboard.press('Escape')
      await wait(500)
    }
  })

  await step('cos-ranking', async () => {
    const page = mat.page
    await openApp(page, 'Sala de Jogos')
    await view(page, 'section[aria-label="Ranking da semana"]', 'start')
    await wait(1500)
    await shot(page, 'cos-40-ranking-mesa')
    await page.getByRole('tab', { name: 'Ranking', exact: true }).first().click({ timeout: 3000 }).catch(() => {})
    await wait(1800)
    await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 330))
    await wait(900)
    await shot(page, 'cos-41-ranking-podio')
    await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 420))
    await wait(900)
    await shot(page, 'cos-42-ranking-lista')
  })

  // Owner: a própria coleção inteira liberada e a Mesa › Cosméticos / Semanais.
  await step('cos-owner', async () => {
    const page = sen.page
    await openApp(page, 'Record')
    await wait(1200)
    await shot(page, 'cos-50-owner-record')
    await abrirColecao(page)
    await shot(page, 'cos-51-owner-colecao-livre')
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(500)
    await shot(page, 'cos-52-owner-grade')
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await view(page, 'nav[aria-label="Seções da mesa"]', 'start')
    await tryClick(desk(page, 'Cosméticos'))
    await wait(2000)
    await shot(page, 'cos-53-admin-catalogo')
    if (await tryClick(page.getByRole('button', { name: /^Editar Última Badalada/ }).first())) {
      await wait(1000)
      await shot(page, 'cos-54-admin-editor')
      await view(page, 'fieldset', 'center')
      await wait(400)
      await shot(page, 'cos-55-admin-editor-disponibilidade')
      await tryClick(btn(page, 'Cancelar', true))
      await wait(600)
    }
    await tryClick(page.getByRole('tab', { name: 'Conceder', exact: true }).first())
    await wait(1500)
    await tryClick(page.locator('ul[aria-label="Resultados"] button').first())
    await wait(400)
    await shot(page, 'cos-56-admin-conceder')
    await tryClick(page.getByRole('tab', { name: 'Histórico', exact: true }).first())
    await wait(1500)
    await shot(page, 'cos-57-admin-historico')
    await view(page, 'nav[aria-label="Seções da mesa"]', 'start')
    await tryClick(desk(page, 'Semanais'))
    await wait(1800)
    await shot(page, 'cos-58-owner-semanais')
    if (await tryClick(btn(page, 'Criar plano', true))) {
      await wait(900)
      await shot(page, 'cos-59-owner-semanal-novo')
    }
  })

  await step('cos-anfitriao', async () => {
    const page = mor.page
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await view(page, 'nav[aria-label="Seções da mesa"]', 'start')
    await tryClick(desk(page, 'Semanais'))
    await wait(1800)
    await shot(page, 'cos-60-anfitriao-semanais')
    await openApp(page, 'Record')
    await wait(1200)
    await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
    await wait(600)
    await shot(page, 'cos-61-anfitriao-identidade')
  })

  // Conta nova (ainda sem vencer o tutorial): coleção trancada com o motivo.
  await step('cos-trancado', async () => {
    const { ctx, page } = await account('Cardo', 'DEVO-TEST-0008', VET_CARDS)
    await openApp(page, 'Record')
    await wait(1200)
    await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
    await wait(600)
    await shot(page, 'cos-70-colecao-trancada')
    await ctx.close()
  })

  // Lote 2 da arte (infra/arte 2cce492): vitrine das molduras e balões em imagem (minis a 48/36 px), coleção com os
  // itens novos, o Registro das partidas com cada balão, Record de três contas e miniperfis com molduras diferentes.
  await step('cos-lote2', async () => {
    const g = await device('phone')
    await g.page.goto(`${BASE}/estilo/cosmeticos`, { waitUntil: 'networkidle' })
    await wait(1500)
    const arts = await g.page.locator('article[aria-label^="Lote 2: "]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
    let i = 0
    for (const a of arts) {
      await view(g.page, `article[aria-label="${a}"]`, 'start')
      await wait(700)
      await shot(g.page, `cos-l2-${String(++i).padStart(2, '0')}-moldura-${a.slice(8).toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().replace(/ +/g, '-')}`)
    }
    await view(g.page, 'section[aria-label="Lote 2 · balões"]', 'start')
    await wait(800)
    await shot(g.page, 'cos-l2-20-baloes-1')
    await g.page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.85))
    await wait(700)
    await shot(g.page, 'cos-l2-21-baloes-2')
    await g.page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.85))
    await wait(700)
    await shot(g.page, 'cos-l2-22-baloes-3')
    await g.ctx.close()

    // Coleção do Matheus: molduras (grade com os itens novos) e balões.
    const page = mat.page
    await abrirColecao(page)
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(600)
    await shot(page, 'cos-l2-30-colecao-molduras')
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8))
    await wait(600)
    await shot(page, 'cos-l2-31-colecao-molduras-2')
    await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
    await aba(page, 'Balões')
    await wait(800)
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(600)
    await shot(page, 'cos-l2-32-colecao-baloes')

    // Registro das partidas: cada fala (cada balão) e miniperfis com molduras diferentes.
    await openApp(page, 'Sala de Jogos')
    await wait(1500)
    await view(page, 'section[aria-label="Registro das partidas"]', 'start')
    await wait(1800)
    let n = 40
    for (const autor of ['Mordomo', 'Matheus', 'Ísis', 'Sentinela', 'Lírio', 'Corvo', 'Nyx']) {
      const li = page.locator('section[aria-label="Registro das partidas"] li').filter({ has: page.getByRole('button', { name: `Abrir miniperfil de ${autor}` }) }).first()
      if (!(await li.count())) continue
      await li.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
      await wait(700)
      await shot(page, `cos-l2-${n++}-chat-${autor.normalize('NFD').replace(/[^A-Za-z]/g, '').toLowerCase()}`)
    }
    n = 50
    for (const autor of ['Lírio', 'Ísis', 'Corvo']) {
      const b = page.getByRole('button', { name: `Abrir miniperfil de ${autor}` }).first()
      await b.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
      if (await tryClick(b)) {
        await wait(2000)
        await shot(page, `cos-l2-${n++}-miniperfil-${autor.normalize('NFD').replace(/[^A-Za-z]/g, '').toLowerCase()}`)
        await page.keyboard.press('Escape')
        await wait(600)
      }
    }
    // Record de outras contas: Mordomo (Banquete do Javali) e Sentinela (Última Badalada).
    for (const [d, nome] of [[mor, 'mordomo'], [sen, 'sentinela']]) {
      await openApp(d.page, 'Record')
      await wait(1800)
      await shot(d.page, `cos-l2-60-record-${nome}`)
    }
  })

  // Lote 3 (infra/arte da41f23): emblemas, Relógio do Fim e Última Badalada animados (dois quadros com 3 s de
  // intervalo: ponteiro, engrenagens e sino giram no próprio eixo) e itens bloqueados na coleção.
  await step('cos-lote3', async () => {
    const g = await device('phone')
    await g.page.goto(`${BASE}/estilo/cosmeticos`, { waitUntil: 'networkidle' })
    await wait(1500)
    await view(g.page, 'section[aria-label="Lote 3 · emblemas"]', 'start')
    await wait(900)
    for (let k = 0; k < 4; k++) {
      await shot(g.page, `cos-l3-0${k + 1}-emblemas`)
      await g.page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.85))
      await wait(700)
    }
    for (const [nome, slug] of [['Relógio do Fim', 'relogio'], ['Última Badalada', 'badalada'], ['Engrenagem do Herdeiro', 'engrenagem']]) {
      const sel = slug === 'engrenagem' ? `article[aria-label="Lote 3: ${nome}"]` : `article[aria-label="Lote 2: ${nome}"]`
      await view(g.page, sel, 'start')
      await wait(1200)
      await shot(g.page, `cos-l3-1-${slug}-quadro-a`)
      await wait(3000)
      await shot(g.page, `cos-l3-1-${slug}-quadro-b`)
    }
    await g.ctx.close()

    const page = mat.page
    await abrirColecao(page)
    await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
    await aba(page, 'Emblemas')
    await wait(900)
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(700)
    await shot(page, 'cos-l3-20-colecao-emblemas')
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8))
    await wait(700)
    await shot(page, 'cos-l3-21-colecao-emblemas-2')
    await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
    await aba(page, 'Molduras')
    await wait(900)
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(700)
    await shot(page, 'cos-l3-22-colecao-bloqueados')
    await view(page, 'div[aria-label="Formato da moldura"]', 'start')
    await tryClick(page.getByRole('button', { name: 'Miniperfil · quadrada' }).first())
    await wait(900)
    await view(page, 'ul[aria-label^="Itens:"]', 'start')
    await wait(700)
    await shot(page, 'cos-l3-23-colecao-minis')
  })

  // Foto do perfil no celular (REFINAMENTO-4 §2.4), 390×844: HEIC recusado com mensagem clara, foto da galeria
  // (PNG de 2,2 MB, comprimida no aparelho), recorte quadrado com o guia redondo da moldura, arrasto e zoom,
  // envio, foto viva depois de recarregar (URL com ?v=) e erro sem conexão.
  await step('cos-foto', async () => {
    const { readFileSync } = await import('node:fs')
    let db = null
    try {
      const pg = (await import('pg')).default
      if (process.env.DATABASE_URL) db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    } catch {}
    const { ctx, page } = await account('Vela', 'DEVO-COSM-FOTO', VET_CARDS)
    try {
      if (db) {
        await db.query("SELECT devo_item_grant(id, k, 1, 'recompensa', NULL, NULL, 'captura-foto:' || id || k) FROM players, unnest(ARRAY['cosmetico:moldura-heranca-marfim', 'cosmetico:mini-heranca-marfim']) k WHERE lower(name) = 'vela'")
        await db.query("INSERT INTO player_cosmetics (player_id, moldura_avatar, moldura_mini) SELECT id, 'cosmetico:moldura-heranca-marfim', 'cosmetico:mini-heranca-marfim' FROM players WHERE lower(name) = 'vela' ON CONFLICT (player_id) DO UPDATE SET moldura_avatar = EXCLUDED.moldura_avatar, moldura_mini = EXCLUDED.moldura_mini")
      }
      await openApp(page, 'Record')
      await wait(1800)
      const arquivo = page.locator('input[aria-label="Arquivo da foto do perfil"]')
      await page.getByRole('button', { name: 'Escolher foto do perfil' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
      await wait(500)
      await shot(page, 'cos-foto-01-sem-foto')
      await arquivo.setInputFiles({ name: 'IMG_0412.HEIC', mimeType: 'image/heic', buffer: Buffer.from('ftypheic-falso') })
      await wait(800)
      await shot(page, 'cos-foto-02-heic-recusado')
      await arquivo.setInputFiles({ name: 'galeria.png', mimeType: 'image/png', buffer: readFileSync('public/images/rabbit.png') })
      await page.getByRole('dialog', { name: 'Ajustar foto do perfil' }).waitFor({ timeout: 10000 })
      await wait(900)
      await shot(page, 'cos-foto-03-recorte')
      const area = page.getByTestId('recorte-foto')
      for (let k = 0; k < 3; k++) await tryClick(page.getByRole('button', { name: 'Aumentar zoom' }).first(), 1500)
      const box = await area.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 60, { steps: 8 })
        await page.mouse.up()
      }
      await wait(600)
      await shot(page, 'cos-foto-04-ajustado')
      await tryClick(page.getByRole('button', { name: 'Salvar foto' }).first())
      await page.getByRole('status').filter({ hasText: 'Foto atualizada.' }).first().waitFor({ timeout: 15000 }).catch((e) => manifest.errors.push({ step: 'cos-foto-envio', error: String(e).slice(0, 200) }))
      await wait(1500)
      await page.getByRole('button', { name: 'Escolher foto do perfil' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
      await wait(500)
      await shot(page, 'cos-foto-05-enviada')
      await page.reload({ waitUntil: 'networkidle' })
      await wait(1000)
      await openApp(page, 'Record')
      await wait(2200)
      const v = await page.locator('img[src*="/api/record/avatar?v="]').count()
      if (!v) manifest.errors.push({ step: 'cos-foto-persistencia', error: 'foto sem ?v= depois de recarregar' })
      await shot(page, 'cos-foto-06-depois-de-recarregar')
      // Sem conexão: escolhe de novo, ajusta e tenta enviar offline.
      await arquivo.setInputFiles({ name: 'retrato.jpg', mimeType: 'image/jpeg', buffer: readFileSync('public/images/cosmeticos/amostra-retrato.jpg') })
      await page.getByRole('dialog', { name: 'Ajustar foto do perfil' }).waitFor({ timeout: 10000 }).catch(() => {})
      await wait(700)
      await ctx.setOffline(true)
      await tryClick(page.getByRole('button', { name: 'Salvar foto' }).first())
      await wait(1500)
      await page.getByRole('button', { name: 'Escolher foto do perfil' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
      await shot(page, 'cos-foto-07-sem-conexao')
      await ctx.setOffline(false)
    } finally {
      await ctx.close().catch(() => {})
      await db?.end().catch(() => {})
    }
  })

  // Pedido do dono (17/10): estilo do nome à Discord, borda do perfil, balões provisórios e o miniperfil em folha
  // (estrutura de card de perfil à Wild Rift). Em 390×844 e 360×740.
  for (const [kind, tam] of [['phone', '390'], ['phone-sm', '360']]) {
    await step(`cos-4-${tam}`, async () => {
      const d = kind === 'phone' ? mat : await seedAcc('Matheus', kind)
      const page = d.page
      try {
        const nm = (n) => `cos-4-${tam}-${n}`
        // Record: cartão de identidade com a borda e o nome (animados) + coleção nas abas novas
        await openApp(page, 'Record')
        await wait(1200)
        await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
        await wait(1200)
        await shot(page, nm('01-record-identidade'))
        await tryClick(btn(page, 'Abrir coleção', true), 4000)
        await wait(1500)
        for (const [t, n] of [['Nome', '02-colecao-nome'], ['Bordas', '03-colecao-bordas'], ['Balões', '04-colecao-baloes']]) {
          await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
          await aba(page, t)
          await wait(900)
          await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
          await wait(600)
          await shot(page, nm(`${n}-palco`))
          await view(page, 'ul[aria-label^="Itens:"]', 'start')
          await wait(600)
          await shot(page, nm(n))
        }
        // chat (Registro das partidas): nomes parados, balões provisórios
        await openApp(page, 'Sala de Jogos')
        await wait(1500)
        await view(page, 'section[aria-label="Registro das partidas"]', 'start')
        await wait(1800)
        let k = 10
        for (const autor of ['Matheus', 'Sentinela', 'Lírio', 'Nyx']) {
          const li = page.locator('section[aria-label="Registro das partidas"] li').filter({ has: page.getByRole('button', { name: `Abrir miniperfil de ${autor}` }) }).first()
          if (!(await li.count())) continue
          await li.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
          await wait(600)
          await shot(page, nm(`${k++}-chat-${autor.normalize('NFD').replace(/[^A-Za-z]/g, '').toLowerCase()}`))
        }
        // miniperfis (folha): várias combinações de borda/nome/moldura/vitrine; Anfitrião e Owner (como jogador)
        k = 20
        for (const autor of ['Matheus', 'Ísis', 'Lírio', 'Nyx', 'Corvo', 'Mordomo', 'Sentinela']) {
          const b = page.getByRole('button', { name: `Abrir miniperfil de ${autor}` }).first()
          await b.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
          if (await tryClick(b)) {
            await wait(2200)
            await shot(page, nm(`${k++}-miniperfil-${autor.normalize('NFD').replace(/[^A-Za-z]/g, '').toLowerCase()}`))
            if (autor === 'Matheus') {
              await page.locator('section[aria-label="Vitrine de cosméticos"]').first().evaluate((el) => el.scrollIntoView({ block: 'end' })).catch(() => {})
              await wait(500)
              await shot(page, nm(`${k++}-miniperfil-matheus-vitrine`))
            }
            await page.keyboard.press('Escape')
            await wait(600)
          }
        }
        // ranking com os nomes (parados)
        await page.getByRole('tab', { name: 'Ranking', exact: true }).first().click({ timeout: 3000 }).catch(() => {})
        await wait(1800)
        await page.evaluate(() => document.querySelector('[role="tabpanel"]')?.scrollBy(0, 330))
        await wait(900)
        await shot(page, nm('40-ranking'))
      } finally {
        if (kind !== 'phone') await d.ctx.close().catch(() => {})
      }
    })
  }

  // Arte por IA (pipeline infra/arte; dono escolheu Asas do Crepúsculo v02 e Coração da Condessa v02) aplicada
  // em Record, coleção, chat, miniperfil e no resultado do Poço. Matheus tem os dois equipados (94-seed).
  await step('cos-ia-aplicada', async () => {
    const page = mat.page
    await api(page, '/api/cosmeticos', { action: 'equipar', slot: 'moldura_avatar', key: 'cosmetico:moldura-asas-crepusculo' })
    await openApp(page, 'Record')
    await wait(1800)
    await shot(page, 'cos-82-ia-record')
    await view(page, 'section[aria-label="Identidade e coleção"]', 'center')
    await wait(700)
    await shot(page, 'cos-83-ia-record-identidade')
    await tryClick(btn(page, 'Abrir coleção', true), 4000)
    await wait(1500)
    if (await tryClick(item(page, 'Asas do Crepúsculo'))) {
      await wait(900)
      await view(page, 'section[aria-label="Coleção de cosméticos"]', 'start')
      await wait(500)
      await shot(page, 'cos-84-ia-colecao-asas')
      await view(page, 'article[aria-label^="Detalhe:"]', 'center')
      await wait(400)
      await shot(page, 'cos-85-ia-colecao-asas-detalhe')
    }
    await view(page, 'div[aria-label="Categorias da coleção"]', 'start')
    await aba(page, 'Emblemas')
    await wait(700)
    if (await tryClick(item(page, 'Coração da Condessa'))) {
      await wait(900)
      await view(page, 'article[aria-label^="Detalhe:"]', 'center')
      await wait(1200)
      await shot(page, 'cos-86-ia-colecao-coracao')
    }
    await openApp(page, 'Sala de Jogos')
    await wait(1500)
    await view(page, 'section[aria-label="Registro das partidas"]', 'start')
    await wait(1800)
    const minha = page.locator('section[aria-label="Registro das partidas"] li').filter({ has: page.getByRole('button', { name: 'Abrir miniperfil de Matheus' }) }).last()
    await minha.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
    await wait(800)
    await shot(page, 'cos-87-ia-chat')
    if (await tryClick(page.getByRole('button', { name: 'Abrir miniperfil de Matheus' }).last())) {
      await wait(2000)
      await shot(page, 'cos-88-ia-miniperfil')
      await page.keyboard.press('Escape')
      await wait(500)
    }
  })

  // Resultado do Poço com cada um dos dois itens: o banco deixa só o item-alvo no sorteio de cosméticos e força a
  // categoria (como na captura do Poço); tudo volta ao original no fim.
  await step('cos-ia-poco', async () => {
    let db = null
    try {
      const pg = (await import('pg')).default
      if (process.env.DATABASE_URL) db = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    } catch {}
    if (!db) return manifest.errors.push({ step: 'cos-ia-poco', error: 'sem DATABASE_URL' })
    const sql = async (text, params) => (await db.query(text, params)).rows
    const probs = (await sql("SELECT value FROM devo_config WHERE key = 'poco.probabilidades'"))[0]?.value
    const noPoco = (await sql("SELECT key FROM item_defs WHERE kind = 'cosmetico' AND meta->>'poco' = 'true'")).map((r) => r.key)
    const { ctx, page } = await account('Lume', 'DEVO-COSM-POCO', VET_CARDS)
    try {
      await sql("INSERT INTO player_unlocks (player_id, flag, source) SELECT id, 'poco', 'owner' FROM players WHERE lower(name) = 'lume' ON CONFLICT DO NOTHING")
      await sql("INSERT INTO poco_estado (player_id, apresentado_at) SELECT id, now() FROM players WHERE lower(name) = 'lume' ON CONFLICT (player_id) DO UPDATE SET apresentado_at = coalesce(poco_estado.apresentado_at, now())")
      await sql("SELECT devo_item_grant(id, 'dracma_comum', 4, 'captura', NULL, NULL, 'captura-cos-poco:' || id) FROM players WHERE lower(name) = 'lume'")
      if (probs) await sql("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify({ ...probs, dracma_comum: { lixo: 0, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 100 } })])
      // A entrada ("Continuar") pode disparar uma navegação que o clique fica esperando (timeout de 15 s visto na
      // rodada da janela quadrada): aqui o clique não espera a navegação e a entrada é refeita uma vez se preciso.
      const abrir = page.getByRole('button', { name: 'Poço dos Milagres', exact: true }).first()
      for (let t = 0; t < 2; t++) {
        await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {})
        await wait(1000)
        await btn(page, 'Continuar').click({ timeout: 15000, noWaitAfter: true }).catch((e) => manifest.errors.push({ step: `cos-ia-poco-entrada-${t}`, error: String(e).slice(0, 200) }))
        await wait(3600)
        if (await abrir.isVisible().catch(() => false)) break
        await shot(page, `cos-ia-poco-entrada-${t}`)
      }
      await abrir.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      await abrir.scrollIntoViewIfNeeded().catch(() => {})
      await tryClick(abrir, 8000)
      await wait(2600)
      for (const [alvo, nome] of [['cosmetico:moldura-asas-crepusculo', 'cos-89-ia-poco-asas'], ['cosmetico:emblema-coracao-condessa', 'cos-90-ia-poco-coracao']]) {
        await sql("UPDATE item_defs SET meta = jsonb_set(meta, '{poco}', to_jsonb(key = $1)) WHERE kind = 'cosmetico'", [alvo])
        await tryClick(btn(page, 'Lançar Moeda', true))
        await wait(800)
        await tryClick(btn(page, 'Lançar Dracma Comum', true))
        await wait(1400)
        await tryClick(btn(page, 'Girar Manivela', true))
        await wait(900)
        await tryClick(btn(page, 'Soltar a manivela', true))
        await wait(2900)
        await tryClick(btn(page, 'Inspecionar Balde', true))
        await wait(1200)
        await shot(page, `${nome}-revelacao`)
        await wait(2000)
        await shot(page, nome)
        if (!(await tryClick(btn(page, 'Guardar', true), 1500))) await tryClick(btn(page, 'Devolver ao poço', true), 1500)
        await wait(900)
      }
    } finally {
      await sql("UPDATE item_defs SET meta = jsonb_set(meta, '{poco}', to_jsonb(key = ANY($1))) WHERE kind = 'cosmetico'", [noPoco]).catch(() => {})
      if (probs) await sql("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify(probs)]).catch(() => {})
      await ctx.close().catch(() => {})
      await db.end().catch(() => {})
    }
  })

  for (const d of [mat, sen, mor]) await d.ctx.close().catch(() => {})
}

// ── Virtudes (DIRECAO-3 §2; VIRTUDES.md): trancado, sem Arcano, Arcano da Morte, outro Arcano, Evolução antes/depois,
// Mesa da equipe e erro. Convites DEVO-VIRT-CAP1..3 (95-seed-virtudes.sql). O Owner (Veterano) libera a flag, define
// o Arcano, lança P.P. e dispara a Evolução pela API, como faria na Mesa.
if (want('virtudes')) {
  const own = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
  const meuId = (page) => page.evaluate(async () => (await (await fetch('/api/eu')).json()).id)
  const chamar = async (path, body, tag) => {
    const r = await api(own.page, path, body)
    if (r.status >= 400) manifest.errors.push({ step: `virtudes-${tag ?? body.action}`, error: `${r.status} ${r.text}` })
  }
  const virt = (body) => chamar('/api/virtudes', body)
  const abrirVirtudes = async (page) => {
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    const b = page.getByRole('button', { name: /^Virtudes/ }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    await tryClick(b, 8000)
    await wait(2400)
  }
  const abrirArcanos = async (page) => {
    await enterOS(page)
    await page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    const b = page.getByRole('button', { name: /^Arcanos/ }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    await tryClick(b, 8000)
    await wait(2400)
  }
  /** Mapa → galeria no Arcano pelo nome do sigilo (ex.: /Torre/). */
  const galeriaEm = async (page, nome) => {
    await tryClick(page.getByRole('button', { name: 'Mapa', exact: true }).first())
    await wait(500)
    // os medalhões giram (nunca "estáveis" para o Playwright): clique direto no elemento
    await page.getByRole('region', { name: 'Mapa dos vinte e dois Arcanos' }).getByRole('button', { name: nome }).first().evaluate((el) => el.click()).catch(() => {})
    await wait(1600)
  }
  /** Rola a tela das Virtudes até o elemento (cabeçalho ou região) pelo nome. */
  const ir = async (page, nome) => {
    await page
      .getByRole('heading', { name: nome })
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'start' }))
      .catch(() => {})
    await wait(600)
  }

  // 1. Jogador comum, sem o tutorial: emblema trancado e a tela com o motivo
  const A = await account('Virtuosa', 'DEVO-VIRT-CAP1', VET_CARDS)
  await step('virtudes-trancado', async () => {
    await enterOS(A.page)
    await wait(1000)
    await A.page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    await wait(400)
    await shot(A.page, 'v01-home-trancado')
    await abrirVirtudes(A.page)
    await shot(A.page, 'v02-trancado', 'jogador sem o tutorial: motivo')
    await abrirArcanos(A.page)
    await shot(A.page, 'arc-00-trancado', 'Arcanos trancado (mesma regra das Virtudes)')
  })
  await A.ctx.close()

  // 2. Outro Arcano (e antes disso: liberado sem Arcano registrado = estado vazio)
  const C = await account('Vigilante', 'DEVO-VIRT-CAP3', VET_CARDS)
  const cid = await meuId(C.page).catch(() => null)
  await chamar('/api/staff', { action: 'desbloqueio.definir', playerId: cid, flag: 'virtudes', on: true }, 'flag-c')
  await step('virtudes-sem-arcano', async () => {
    await abrirVirtudes(C.page)
    await shot(C.page, 'v03-sem-arcano', 'liberado, Arcano ainda sem registro (vazio)')
  })
  await virt({ action: 'arcano', playerId: cid, arcano: 'imperatriz' })
  for (const [v, n] of [['escudos', 9], ['copas', 6]]) await virt({ action: 'potencial', playerId: cid, virtude: v, quantidade: n, motivo: 'captura' })
  await step('virtudes-outro-arcano', async () => {
    await abrirVirtudes(C.page)
    await shot(C.page, 'v04-imperatriz-roda', 'Arcano da Imperatriz: Taças excelente, Paus deficiente')
    await ir(C.page, 'Pouco acumulado')
    await shot(C.page, 'v05-imperatriz-potencial', 'pouco acumulado')
    await ir(C.page, 'Mais vagas')
    await shot(C.page, 'v06-imperatriz-antigas')
  })
  await C.ctx.close()

  // 3. Arcano da Morte (como o exemplo do doc): roda, naipes, acúmulo perto do limite → Evolução → depois
  const B = await account('Morgana', 'DEVO-VIRT-CAP2', VET_CARDS)
  const bid = await meuId(B.page).catch(() => null)
  await chamar('/api/staff', { action: 'desbloqueio.definir', playerId: bid, flag: 'virtudes', on: true }, 'flag-b')
  await virt({ action: 'arcano', playerId: bid, arcano: 'morte' })
  for (const [v, n] of [['tacas', 34], ['ouros', 28], ['espadas', 18], ['paus', 6], ['escudos', 8]]) await virt({ action: 'potencial', playerId: bid, virtude: v, quantidade: n, motivo: 'captura' })
  await step('virtudes-morte', async () => {
    await enterOS(B.page)
    await B.page.getByRole('region', { name: 'Sistemas', exact: true }).scrollIntoViewIfNeeded().catch(() => {})
    await wait(500)
    await shot(B.page, 'v07-home-liberado')
    await abrirVirtudes(B.page)
    await shot(B.page, 'v08-morte-roda', 'Arcano da Morte, Estágio 0 (A Essência)')
    await ir(B.page, 'Perto do limite')
    await shot(B.page, 'v09-evolucao-antes', 'P.P. perto do limite, pronto para a metamorfose')
    await ir(B.page, 'Bases claras')
    await shot(B.page, 'v10-morte-naipes', 'afinidades em palavras')
    await ir(B.page, 'Evoluções de Estágio')
    await shot(B.page, 'v11-historico-vazio')
    // Arcanos: tela própria. Entrada pelas Virtudes ("Seu Arcano → abrir Arcanos")
    await abrirVirtudes(B.page)
    await shot(B.page, 'arc-01-virtudes-link', 'Virtudes: só a entrada para os Arcanos, sem a lista')
    await tryClick(B.page.getByRole('button', { name: /Abrir Arcanos/ }).first())
    await wait(2400)
    await shot(B.page, 'arc-02-mapa', 'mapa orbital: o próprio aceso, os outros apagados')
    await galeriaEm(B.page, /Torre \(trancado\)/)
    await shot(B.page, 'arc-03-galeria-trancado', 'galeria centrada num trancado: estátua cinza, nome e frase breve')
    await galeriaEm(B.page, /seu Arcano/)
    await shot(B.page, 'arc-04-galeria-proprio', 'galeria no próprio: em cor, botão Abrir')
    await B.page.getByRole('region', { name: 'Galeria dos Arcanos' }).first().evaluate((el) => el.scrollBy({ left: 70, behavior: 'instant' })).catch(() => {})
    await wait(500)
    await shot(B.page, 'arc-04b-galeria-giro', 'no meio do arrasto: laterais giram, encolhem e perdem a cor')
    await B.page.getByRole('region', { name: 'Galeria dos Arcanos' }).first().evaluate((el) => el.scrollBy({ left: -70, behavior: 'instant' })).catch(() => {})
    await wait(900)
    await tryClick(B.page.getByRole('button', { name: /Abrir seu Arcano/ }).first())
    await wait(1600)
    await shot(B.page, 'arc-05-detalhe', 'altar: vitral vermelho, velas, a figura (placeholder) e o nome')
    await ir(B.page, 'Fisiologia')
    await shot(B.page, 'arc-06-detalhe-fisiologia', 'Descrição e Fisiologia (mais natural / mais custosa)')
    await ir(B.page, 'Estágios de evolução')
    await shot(B.page, 'arc-07-detalhe-estagios', 'Estágio I atual, os seguintes velados')
  })
  await virt({ action: 'evoluir', playerId: bid })
  await virt({ action: 'potencial', playerId: bid, virtude: 'tacas', quantidade: 12, motivo: 'captura' })
  await step('virtudes-evolucao-depois', async () => {
    await abrirVirtudes(B.page)
    await shot(B.page, 'v12-evolucao-depois', 'Estágio II')
    await ir(B.page, 'Quase nada acumulado')
    await ir(B.page, 'Pouco acumulado')
    await shot(B.page, 'v13-depois-potencial', 'acúmulo recomeça')
    await ir(B.page, 'Evoluções de Estágio')
    await shot(B.page, 'v14-depois-historico', 'histórico: mais cresceu / menos cresceu')
    await abrirArcanos(B.page)
    await galeriaEm(B.page, /seu Arcano/)
    await tryClick(B.page.getByRole('button', { name: /Abrir seu Arcano/ }).first())
    await wait(1600)
    await ir(B.page, 'Estágios de evolução')
    await shot(B.page, 'arc-08-estagio-ii', 'depois da Evolução: I alcançado, II atual')
    // o Record mostra o Arcano na ficha
    await openApp(B.page, 'Record')
    await wait(1500)
    await shot(B.page, 'v15-record-arcano', 'ficha do Record com o Arcano')
  })
  await B.ctx.close()

  // 4. Mesa da equipe (Owner): jogadores com números, detalhes, Evolução, tabela de afinidade e divergências
  await step('virtudes-mesa', async () => {
    const page = own.page
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await page.locator('nav[aria-label="Seções da mesa"]').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await tryClick(desk(page, 'Virtudes'))
    await wait(2000)
    await shot(page, 'v16-mesa-jogadores')
    const busca = page.getByRole('textbox', { name: 'Buscar jogador' }).first()
    await busca.fill('Morgana').catch(() => {})
    await wait(1600)
    await tryClick(page.getByRole('listitem', { name: 'Virtudes de Morgana' }).getByRole('button', { name: 'Detalhes' }).first())
    await wait(700)
    await page.getByRole('listitem', { name: 'Virtudes de Morgana' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(400)
    await shot(page, 'v17-mesa-detalhes', 'P.P., atributos, afinidade e histórico com números')
    await busca.fill('Lírio').catch(() => {})
    await wait(1600)
    await page.getByRole('listitem', { name: 'Virtudes de Lírio' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
    await tryClick(page.getByRole('button', { name: 'Evoluir Estágio' }).first())
    await wait(500)
    await shot(page, 'v18-mesa-evoluir-armado', 'confirmação em dois toques')
    await tryClick(page.getByRole('button', { name: 'Voltar', exact: true }).first())
    await page.getByRole('region', { name: 'Tabela de afinidade' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(500)
    await shot(page, 'v19-mesa-tabela', 'tabela editável, provisória')
    await tryClick(page.getByRole('button', { name: 'Divergência do doc: Arcano da Lua' }).first())
    await wait(500)
    await page.getByRole('button', { name: 'Divergência do doc: Arcano da Lua' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
    await wait(300)
    await shot(page, 'v20-mesa-divergencia', 'nota da divergência para o dono confirmar')
    await page.getByRole('region', { name: 'Limites por Estágio' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(400)
    await shot(page, 'v21-mesa-limites')
    await page.getByRole('region', { name: 'Textos dos Arcanos' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await page.getByRole('combobox', { name: 'Arcano a editar' }).first().selectOption('morte').catch(() => {})
    await wait(600)
    await shot(page, 'v35-mesa-textos', 'Owner edita os textos do Arcano (provisório)')
    await page.getByRole('button', { name: 'Gravar texto' }).first().evaluate((el) => el.scrollIntoView({ block: 'end' })).catch(() => {})
    await wait(400)
    await shot(page, 'v36-mesa-textos-estagios', 'Estágios e o botão de gravar')
    // Arcanos vistos pelo Owner: todos abrem, selo "Texto provisório"
    await abrirArcanos(page)
    await shot(page, 'arc-09-owner-mapa', 'Owner: todos os sigilos abertos')
    await galeriaEm(page, /Louco/)
    await shot(page, 'arc-10-owner-galeria', 'Owner: qualquer Arcano abre')
    await tryClick(page.getByRole('button', { name: 'Abrir', exact: true }).first())
    await wait(1600)
    await shot(page, 'arc-11-owner-detalhe', 'Owner: detalhe de outro Arcano, com o selo de provisório')

    await page.route(/\/api\/virtudes$/, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"As Virtudes não responderam. Tente de novo."}' }))
    await abrirVirtudes(page)
    await shot(page, 'v22-erro')
  })
  await own.ctx.close()
}

if (want('calendario')) {
  const { default: pg } = await import('pg')
  const db = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null
  const sql = (t, p) => (db ? db.query(t, p).then((r) => r.rows) : Promise.resolve([]))
  const dlg = (page) => page.locator('section[data-cena]').last()
  const textoDlg = (page) => dlg(page).evaluate((el) => el.textContent ?? '', null, { timeout: 2000 }).catch(() => '')
  /** Avança a cena do motor até o texto aparecer (por inteiro). */
  async function ate(page, alvo, max = 200) {
    for (let i = 0; i < max; i++) {
      const t = await textoDlg(page)
      if (!t) {
        await wait(500)
        if (!(await textoDlg(page))) return false
        continue
      }
      if (t.includes(alvo)) {
        await wait(1600)
        return true
      }
      const pronto = dlg(page).getByRole('button', { name: 'Continuar', exact: true }).first()
      if (await pronto.count()) {
        await tryClick(pronto, 2000)
        await wait(450)
      } else await wait(300)
    }
    manifest.errors.push({ step: 'cal-ate', error: `não chegou em ${alvo}; último texto: ${(await textoDlg(page)).slice(-160)}` })
    return false
  }
  async function ateOFim(page) {
    for (let i = 0; i < 120; i++) {
      if (!(await textoDlg(page))) return
      const pronto = dlg(page).getByRole('button', { name: 'Continuar', exact: true }).first()
      if (!(await tryClick(pronto, 1500))) await page.keyboard.press('Enter').catch(() => {})
      await wait(450)
    }
  }
  const abrirCal = async (page) => {
    await enterOS(page)
    const b = page.getByRole('button', { name: 'Calendário', exact: true }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    await revealOnHome(page, b)
    await tryClick(b, 8000)
    await wait(2800)
  }
  const regiao = async (page, nome, block = 'start') => {
    await page.getByRole('region', { name: nome, exact: true }).first().evaluate((el, b) => el.scrollIntoView({ block: b }), block).catch(() => {})
    await wait(600)
  }
  const idDe = async (nome) => (await sql('SELECT id FROM players WHERE lower(name) = lower($1)', [nome]))[0]?.id
  /** Histórico: `n` check-ins diários nos dias anteriores (Dia 1 há n dias … Dia n ontem) e a apresentação já vista. */
  const historico = async (nome, n) => {
    const id = await idDe(nome)
    if (!id) return manifest.errors.push({ step: `cal-hist-${nome}`, error: 'jogador não encontrado' })
    await sql(
      `INSERT INTO calendario_checkins (player_id, dia, tipo, posicao, recompensa)
       SELECT $1, (now() AT TIME ZONE 'America/Sao_Paulo')::date - ($2::int - k + 1), 'diario', k, '{"tipo": "pp", "quantidade": 50}'::jsonb
         FROM generate_series(1, $2::int) k ON CONFLICT DO NOTHING`,
      [id, n],
    )
    await sql("INSERT INTO dialog_progress (player_id, scene_id, step, done_at) VALUES ($1, 'melissa-calendario', 0, now()) ON CONFLICT (player_id, scene_id) DO UPDATE SET done_at = now()", [id])
  }

  // 1. Primeira entrada: ícone na tela de Sistemas, apresentação da Melissa (Natal projetado), Dia 1, revelação.
  const A = await account('Calendula', 'DEVO-CAL-0001', VET_CARDS)
  await step('cal-primeira-entrada', async () => {
    const page = A.page
    await enterOS(page)
    const b = page.getByRole('button', { name: 'Calendário', exact: true }).first()
    await b.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    await revealOnHome(page, b)
    await wait(900)
    await shot(page, 'cal-00-home-sistemas', 'ícone do Calendário na tela de Sistemas (liberado desde o início)')
    await tryClick(b, 8000)
    await wait(3200)
    await ate(page, 'Grandioso Calendário Devo!!!')
    await shot(page, 'cal-01-melissa', 'holograma da Melissa: boas-vindas')
    await ate(page, 'quais dias você tem mais folga')
    await wait(600)
    await shot(page, 'cal-02-natal', '"Mostra exemplo de Evento de Natal": o Natal do calendário projetado por cima da cena')
    await ate(page, 'mais de um tipo de check-in')
    await shot(page, 'cal-03-checkin-fala', 'fala do check-in de datas comemorativas')
    await ateOFim(page)
    await wait(1600)
    await shot(page, 'cal-04-tela', 'Calendário: check-in diário no Dia 1')
    await tryClick(page.getByRole('button', { name: /^Marcar presença: 50 PP/ }).first(), 6000)
    await wait(1500)
    await shot(page, 'cal-05-revelacao', 'revelação do resgate (pulável)')
    await tryClick(page.getByRole('button', { name: 'Pular', exact: true }).first(), 3000)
    await wait(900)
    await shot(page, 'cal-06-marcado', 'Dia 1 carimbado, contagem para amanhã')
    await regiao(page, 'Check-in dos Arcanos')
    await shot(page, 'cal-07-extra', 'check-in extra da data comemorativa de hoje')
    await tryClick(page.getByRole('button', { name: /^Marcar presença no evento: \+30 Minutos/ }).first(), 6000)
    await wait(1500)
    await shot(page, 'cal-08-extra-revelacao', 'revelação do check-in do evento (+30 min)')
    await tryClick(page.getByRole('button', { name: 'Pular', exact: true }).first(), 3000)
    await wait(700)
    await regiao(page, 'Mês')
    await shot(page, 'cal-09-mes', 'mês com eventos marcados (atenção / folga / hoje)')
    await tryClick(page.getByRole('gridcell', { name: /^31 de outubro/ }).first(), 3000)
    await wait(600)
    await regiao(page, 'Mês', 'end')
    await shot(page, 'cal-10-dia', 'dia escolhido: Halloween')
    await regiao(page, 'Próximos eventos')
    await shot(page, 'cal-11-proximos', 'próximos eventos (arte, data, destaque)')
    await page.getByRole('region', { name: 'Próximos eventos', exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'end' })).catch(() => {})
    await wait(500)
    await shot(page, 'cal-12-proximos-fim')
  })
  await A.ctx.close()

  // 2. Assídua: três dias feitos, hoje é o Dia 4 (+2 Horas).
  const B = await account('Assidua', 'DEVO-CAL-0002', VET_CARDS)
  await historico('Assidua', 3)
  await step('cal-dia-4', async () => {
    const page = B.page
    await abrirCal(page)
    await shot(page, 'cal-13-dia4', 'três dias carimbados, Dia 4 em destaque')
    await tryClick(page.getByRole('button', { name: /^Marcar presença: \+2 Horas/ }).first(), 6000)
    await wait(1500)
    await shot(page, 'cal-14-revelacao-horas', '+2 Horas entram no pulso')
    await tryClick(page.getByRole('button', { name: 'Pular', exact: true }).first(), 3000)
    await wait(800)
    await shot(page, 'cal-15-dia4-feito')
  })
  await B.ctx.close()

  // 3. Dia 7: a Carta Incomum (entregue pelo servidor, resgatada para o inventário).
  const C = await account('Setima', 'DEVO-CAL-0003', VET_CARDS)
  await historico('Setima', 6)
  await step('cal-dia-7', async () => {
    const page = C.page
    await abrirCal(page)
    await shot(page, 'cal-16-dia7', 'seis carimbos, a carta no fim do ciclo')
    await tryClick(page.getByRole('button', { name: /^Marcar presença: Carta Incomum/ }).first(), 6000)
    await wait(1800)
    await shot(page, 'cal-17-revelacao-carta', 'revelação da Carta Incomum')
  })
  await C.ctx.close()

  // 4. Mesa do Owner: eventos, novo evento com check-in próprio, regras do diário.
  const own = await account('Veterano', 'DEVO-TEST-ADM1', VET_CARDS)
  await step('cal-mesa', async () => {
    const page = own.page
    await openApp(page, 'Record')
    await tryClick(page.getByRole('tab', { name: /Mesa/i }).first())
    await wait(2000)
    await page.locator('nav[aria-label="Seções da mesa"]').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await tryClick(desk(page, 'Calendário'))
    await wait(2000)
    await shot(page, 'cal-20-mesa', 'Mesa › Calendário')
    await page.getByRole('region', { name: 'Eventos programados' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(500)
    await shot(page, 'cal-21-mesa-eventos')
    await tryClick(page.getByRole('button', { name: 'Novo evento', exact: true }).first())
    await wait(700)
    const f = page.getByRole('form', { name: 'Novo evento' }).first()
    await f.getByRole('textbox').first().fill('Noite da Lua Vermelha').catch(() => {})
    await f.locator('textarea').first().fill('Os relógios atrasam. Ninguém sabe por quê.').catch(() => {})
    await f.getByRole('checkbox', { name: 'Check-in próprio nestas datas' }).check().catch(() => {})
    await wait(400)
    await f.evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(400)
    await shot(page, 'cal-22-mesa-novo', 'formulário: nome, datas, destaque, arte')
    await page.getByRole('checkbox', { name: 'Check-in próprio nestas datas' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
    await wait(400)
    await shot(page, 'cal-23-mesa-checkin', 'check-in do evento (só o Owner)')
    await tryClick(page.getByRole('button', { name: 'Criar evento', exact: true }).first())
    await wait(1600)
    await page.getByRole('listitem', { name: 'Evento Noite da Lua Vermelha' }).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {})
    await wait(500)
    await shot(page, 'cal-24-mesa-criado', 'evento criado (vai para o admin_log)')
    await page.getByRole('region', { name: 'Check-in diário' }).first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    await wait(500)
    await shot(page, 'cal-25-mesa-diario', 'ciclo do dono + regras provisórias')
    await page.route(/\/api\/calendario$/, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"O Calendário não respondeu. Tente de novo."}' }))
    await abrirCal(page)
    await shot(page, 'cal-26-erro', 'erro com tentar de novo')
  })
  await own.ctx.close()
  if (db) await db.end().catch(() => {})
}

await browser.close()
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`capturas: ${manifest.shots.length}, erros: ${manifest.errors.length}, console: ${manifest.console.length}`)
