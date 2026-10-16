// Teste de servidor das Torres de Ruptura (custo que dobra, chave entregue uma vez, não sobe sem recurso,
// ordem dos andares, trava, oferta do Galo uma vez só, reflexão). Roda no CI depois das capturas, contra o
// Postgres do workflow e o servidor em http://localhost:3000.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/torres-test.mjs
// Usa os convites DEVO-TORR-TST* do 91-seed-torres.sql (contas de teste). Sai com código 1 se algo falhar.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.DEVO_URL ?? 'http://localhost:3000'
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL })

let passed = 0
const failures = []
async function test(name, fn) {
  try {
    await fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (err) {
    failures.push(name)
    console.log(`FAIL ${name}\n     ${err?.stack ?? err}`)
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
const q = async (text, params) => (await db.query(text, params)).rows

/* ------------------------------------------------------------- HTTP com cookies */
class Session {
  constructor(name) {
    this.name = name
    this.cookies = new Map()
  }
  store(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';')
      const i = pair.indexOf('=')
      this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1))
    }
  }
  async req(method, path, body, extra = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', origin: BASE, cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    this.store(res)
    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {}
    return { status: res.status, json, text }
  }
  get(path) {
    return this.req('GET', path)
  }
  post(path, body) {
    return this.req('POST', path, body)
  }
}
const email = (name) => `u${Buffer.from(name.toLowerCase(), 'utf8').toString('hex')}@jogador.devo`
async function signUp(name, invite) {
  const s = new Session(name)
  let r
  for (let attempt = 0; attempt < 8; attempt++) {
    r = await s.req('POST', '/api/auth/sign-up/email', { email: email(name), password: 'senha-teste-123', name, username: name, displayUsername: name }, { 'x-devo-invite': invite, 'x-devo-character': encodeURIComponent(name) })
    if (r.status !== 429) break
    await new Promise((ok) => setTimeout(ok, 11_000))
  }
  if (r.status !== 200) {
    // conta já existe (teste rodado de novo no mesmo banco): entra
    const inn = await s.req('POST', '/api/auth/sign-in/username', { username: name, password: 'senha-teste-123' })
    if (inn.status !== 200) throw new Error(`cadastro de ${name} falhou: ${r.status} ${r.text.slice(0, 200)}`)
  }
  const [p] = await q('SELECT id FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  return s
}
const saldo = async (id, item) => Number((await q('SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = $2', [id, item]))[0]?.quantity ?? 0)
const grant = (id, item, n, tag) => q("SELECT devo_item_grant($1, $2, $3, 'teste', NULL, NULL, $4)", [id, item, n, `torres-test:${tag}:${id}`])
const andares = async (id, torre) => (await q('SELECT floor FROM tower_progress WHERE player_id = $1 AND tower_id = $2 ORDER BY floor', [id, torre])).map((r) => r.floor)

/* ------------------------------------------------------------- 1. Banco */
await test('migração das torres é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'torres-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
})

/* ------------------------------------------------------------- 2. Trava */
const sfx = Date.now().toString(36).slice(-5)
const trancado = await signUp(`TorreT${sfx}`, 'DEVO-TORR-TST2')
const jog = await signUp(`TorreJ${sfx}`, 'DEVO-TORR-TST1')

await test('jogador sem o tutorial vê as torres trancadas, com motivo', async () => {
  const r = await trancado.get('/api/torres')
  assert(r.status === 200 && r.json?.liberado === false && /Deadly Vote/.test(r.json.motivo), `esperado trancado com motivo: ${r.text}`)
})
await test('jogador trancado não sobe andar (403) nem ganha a essência do Galo', async () => {
  await grant(trancado.id, 'essencia:galo', 5, 'trancado')
  const r = await trancado.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 1 })
  assert(r.status === 403, `esperado 403, veio ${r.status}`)
  const f = await trancado.post('/api/torres', { action: 'galo.fa', aceitar: true })
  assert(f.status === 403, `galo.fa trancado: esperado 403, veio ${f.status}`)
  assert((await saldo(trancado.id, 'essencia:galo')) === 5, 'saldo não pode mudar')
})

await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'torres', 'owner') ON CONFLICT DO NOTHING", [jog.id])

/* ------------------------------------------------------------- 3. Conteúdo e custos no payload */
let estado
await test('liberado: 1 torre principal, secundárias, 5–8 andares e custo dobrando no payload', async () => {
  const r = await jog.get('/api/torres')
  estado = r.json
  assert(r.status === 200 && estado?.liberado === true, `esperado liberado: ${r.text}`)
  assert(estado.torres.filter((t) => t.tipo === 'principal').length === 1, 'exatamente 1 principal')
  assert(estado.torres.filter((t) => t.tipo === 'secundaria').length >= 2, 'ao menos 2 secundárias')
  for (const t of estado.torres) {
    assert(t.andares.length >= 5 && t.andares.length <= 8, `${t.id}: ${t.andares.length} andares`)
    t.andares.forEach((a, i) => i && assert(a.custo === t.andares[i - 1].custo * 2, `${t.id}: andar ${a.n} custa ${a.custo}, anterior ${t.andares[i - 1].custo}`))
  }
  assert(estado.apresentacao.galoVista === false, 'apresentação ainda não vista')
  assert(estado.torres.every((t) => t.andares.every((a) => (a.estado === 'concluido') === !!a.cena)), 'cena só nos andares concluídos')
})

/* ------------------------------------------------------------- 4. Oferta do Galo */
await test('oferta de fã do Galo entrega 1 essência, uma vez só', async () => {
  const a = await jog.post('/api/torres', { action: 'galo.fa', aceitar: true })
  assert(a.status === 200 && a.json?.concedido === true, `primeira: ${a.text}`)
  const b = await jog.post('/api/torres', { action: 'galo.fa', aceitar: true })
  assert(b.status === 200 && b.json?.concedido === false, `segunda não concede: ${b.text}`)
  const c = await jog.post('/api/torres', { action: 'galo.fa', aceitar: false })
  assert(c.json?.galoFa === true, 'a primeira resposta vale para sempre')
  assert((await saldo(jog.id, 'essencia:galo')) === 1, 'saldo 1 essência do Galo')
})

/* ------------------------------------------------------------- 5. Subir */
await test('sobe o 1º andar da principal pagando 1 essência', async () => {
  const r = await jog.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 1 })
  assert(r.status === 200 && r.json?.andar?.estado === 'concluido', `subir: ${r.text}`)
  assert((await saldo(jog.id, 'essencia:galo')) === 0, 'essência gasta')
})
await test('não repete andar concluído nem pula andar', async () => {
  const r = await jog.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 1 })
  assert(r.status === 409, `repetir: esperado 409, veio ${r.status}`)
  await grant(jog.id, 'essencia:coruja', 100, 'pular')
  const p = await jog.post('/api/torres', { action: 'subir', torre: 'observatorio', andar: 3 })
  assert(p.status === 409 && /ordem/.test(p.json?.error), `pular: ${p.text}`)
  await q("SELECT devo_item_consume($1, 'essencia:coruja', 100, 'teste')", [jog.id])
})
await test('custo dobra a cada andar e a chave da secundária sai uma vez por andar', async () => {
  await grant(jog.id, 'essencia:coruja', 7, 'dobra')
  const gastos = []
  for (const n of [1, 2, 3]) {
    const antes = await saldo(jog.id, 'essencia:coruja')
    const r = await jog.post('/api/torres', { action: 'subir', torre: 'observatorio', andar: n })
    assert(r.status === 200 && r.json?.chavesRecebidas === 1, `andar ${n}: ${r.text}`)
    gastos.push(antes - (await saldo(jog.id, 'essencia:coruja')))
  }
  assert(JSON.stringify(gastos) === '[1,2,4]', `custos pagos ${JSON.stringify(gastos)} (esperado [1,2,4])`)
  assert((await saldo(jog.id, 'chave:observatorio')) === 3, '3 chaves')
  const rep = await jog.post('/api/torres', { action: 'subir', torre: 'observatorio', andar: 2 })
  assert(rep.status === 409, 'repetir andar 2 deve falhar')
  assert((await saldo(jog.id, 'chave:observatorio')) === 3, 'chave não pode sair de novo')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM item_ledger WHERE player_id = $1 AND item_key = 'chave:observatorio' AND delta > 0", [jog.id])
  assert(n === 3, `3 entregas no livro-razão, veio ${n}`)
})
await test('sem essência suficiente não sobe e nada muda', async () => {
  const r = await jog.post('/api/torres', { action: 'subir', torre: 'observatorio', andar: 4 })
  assert(r.status === 409 && /Essências insuficientes/.test(r.json?.error), `esperado 409: ${r.text}`)
  assert(JSON.stringify(await andares(jog.id, 'observatorio')) === '[1,2,3]', 'progresso igual')
  assert((await saldo(jog.id, 'chave:observatorio')) === 3, 'chaves iguais')
})
await test('andar da principal exige chaves: sem a chave não sobe e não cobra essência', async () => {
  await grant(jog.id, 'essencia:galo', 2, 'p2')
  const ok2 = await jog.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 2 })
  assert(ok2.status === 200, `andar 2 com 1 chave do Observatório: ${ok2.text}`)
  assert((await saldo(jog.id, 'chave:observatorio')) === 3, 'chaves não são gastas por padrão')
  await grant(jog.id, 'essencia:galo', 4, 'p3')
  const r = await jog.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 3 })
  assert(r.status === 409 && /chaves/.test(r.json?.error), `sem chave do Picadeiro: ${r.text}`)
  assert((await saldo(jog.id, 'essencia:galo')) === 4, 'essência não pode ser cobrada')
  const e = await jog.get('/api/torres')
  const a3 = e.json.torres.find((t) => t.id === 'imperador').andares[2]
  assert(a3.estado === 'atual' && !a3.podeSubir && a3.faltaChaves === 1, `andar 3 trancado por chave: ${JSON.stringify(a3).slice(0, 200)}`)
})
await test('dois pedidos simultâneos do mesmo andar cobram uma vez só', async () => {
  await grant(jog.id, 'essencia:javali', 10, 'corrida')
  const [a, b] = await Promise.all([
    jog.post('/api/torres', { action: 'subir', torre: 'picadeiro', andar: 1 }),
    jog.post('/api/torres', { action: 'subir', torre: 'picadeiro', andar: 1 }),
  ])
  const oks = [a, b].filter((r) => r.status === 200).length
  assert(oks === 1, `exatamente um 200 (veio ${a.status}/${b.status})`)
  assert((await saldo(jog.id, 'essencia:javali')) === 9, 'cobrou 1 só')
  assert((await saldo(jog.id, 'chave:picadeiro')) === 1, 'uma chave só')
})

/* ------------------------------------------------------------- 6. Apresentação e reflexão */
await test('apresentação vista e reflexão "Anfitrião de quê?" registram uma vez', async () => {
  const pre = await jog.post('/api/torres', { action: 'reflexao', escolha: 4 })
  assert(pre.json?.registrado === false, 'sem apresentação não registra reflexão')
  await jog.post('/api/torres', { action: 'galo.visto' })
  const e = await jog.get('/api/torres')
  assert(e.json.apresentacao.galoVista && e.json.apresentacao.reflexaoPendente, 'reflexão pendente')
  const r1 = await jog.post('/api/torres', { action: 'reflexao', escolha: 4 })
  const r2 = await jog.post('/api/torres', { action: 'reflexao', escolha: 2 })
  assert(r1.json?.registrado === true && r2.json?.registrado === false, `reflexão: ${r1.text} ${r2.text}`)
  const [row] = await q('SELECT reflexao_escolha FROM tower_player WHERE player_id = $1', [jog.id])
  assert(row.reflexao_escolha === 4, 'escolha 4 gravada')
  const inv = await jog.post('/api/torres', { action: 'reflexao', escolha: 9 })
  assert(inv.status === 400, 'escolha inválida → 400')
})

await test('torre ou andar inexistente → erro claro', async () => {
  const a = await jog.post('/api/torres', { action: 'subir', torre: 'nao-existe', andar: 1 })
  const b = await jog.post('/api/torres', { action: 'subir', torre: 'imperador', andar: 99 })
  assert(a.status === 404 && b.status === 400, `${a.status} ${b.status}`)
})

await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}
