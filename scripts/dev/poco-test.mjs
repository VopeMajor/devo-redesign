// Teste de servidor do Poço dos Milagres (regras críticas). Roda no CI depois das capturas, contra o Postgres do
// workflow e o servidor em http://localhost:3000 → poco-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/poco-test.mjs
// Cobre: trava (Deadly Vote tutorial), Dracma do encapuzado entregue uma vez, giro grátis 1×/dia, moeda
// consumida uma vez (e nunca com outra moeda no poço), probabilidade lida da configuração, minigame contado no
// servidor (toques fora do tempo recusados; acertos reais contados), painel do Owner e letreiro sem cargo.
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
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms))

/* ------------------------------------------------------------- HTTP com cookies (mesmo do fundacao-test) */
const internalEmail = (name) => `u${Buffer.from(name.toLowerCase(), 'utf8').toString('hex')}@jogador.devo`
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
  headers(extra = {}) {
    return { 'content-type': 'application/json', origin: BASE, cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...extra }
  }
  async req(method, path, body, extra) {
    const res = await fetch(BASE + path, { method, headers: this.headers(extra), body: body === undefined ? undefined : JSON.stringify(body) })
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
  poco(action, extra = {}) {
    return this.post('/api/poco', { action, ...extra })
  }
}
async function signUp(name, invite) {
  const s = new Session(name)
  let r
  for (let attempt = 0; attempt < 8; attempt++) {
    r = await s.req(
      'POST',
      '/api/auth/sign-up/email',
      { email: internalEmail(name), password: 'senha-teste-123', name, username: name, displayUsername: name },
      { 'x-devo-invite': invite, 'x-devo-character': encodeURIComponent(name) },
    )
    if (r.status !== 429) break
    await sleep(11_000)
  }
  if (r.status !== 200) throw new Error(`cadastro de ${name} falhou: ${r.status} ${r.text.slice(0, 200)}`)
  const [p] = await q('SELECT id, role FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  return s
}

const saldo = async (playerId, item) => Number((await q('SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = $2', [playerId, item]))[0]?.quantity ?? 0)
const getCfg = async () => (await q("SELECT value FROM devo_config WHERE key = 'poco.probabilidades'"))[0]?.value
const setCfg = (v) => q("UPDATE devo_config SET value = $1 WHERE key = 'poco.probabilidades'", [JSON.stringify(v)])

/** Um giro completo sem minigame: lançar → girar → inspecionar. */
async function giro(s, lancar) {
  const a = await s.poco('moeda.lancar', lancar)
  assert(a.status === 200, `lançar: ${a.status} ${a.text}`)
  const g = await s.poco('manivela.girar', { toques: [] })
  assert(g.status === 200, `girar: ${g.status} ${g.text}`)
  const i = await s.poco('balde.inspecionar')
  assert(i.status === 200, `inspecionar: ${i.status} ${i.text}`)
  return i.json.resultado
}

/* ------------------------------------------------------------- Banco */
const sfx = Date.now().toString(36)
const SFX = sfx.toUpperCase()
const originalCfg = await getCfg()

await test('migração do Poço é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'poco-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM item_defs WHERE key LIKE 'capsula:0%'")
  assert(n === 8, `8 cápsulas no catálogo (veio ${n})`)
})

await q(
  `INSERT INTO invite_codes (code, role, note, is_test) VALUES ($1, 'player', 'poco-test', true), ($2, 'player', 'poco-test', true), ($3, 'owner', 'poco-test', true)
   ON CONFLICT (code) DO NOTHING`,
  [`DEVO-PT-${SFX}-A`, `DEVO-PT-${SFX}-B`, `DEVO-PT-${SFX}-O`],
)

let jog, owner
await test('cadastro das contas de teste', async () => {
  jog = await signUp(`Poco${sfx}a`, `DEVO-PT-${SFX}-A`)
  owner = await signUp(`Poco${sfx}o`, `DEVO-PT-${SFX}-O`)
})

/* ------------------------------------------------------------- Trava */
await test('trancado sem vencer o tutorial (GET sem erro; POST 403)', async () => {
  const r = await jog.get('/api/poco')
  assert(r.status === 200 && r.json.liberado === false && /Deadly Vote/.test(r.json.motivo), `GET trancado: ${r.text}`)
  const p = await jog.poco('moeda.lancar', { gratis: true })
  assert(p.status === 403, `POST trancado deveria ser 403 (veio ${p.status})`)
  const o = await owner.get('/api/poco')
  assert(o.json.liberado === true, 'Owner vê o Poço liberado')
})

if (!jog || !owner) {
  console.log('sem contas de teste: abortando')
  await db.end()
  process.exit(1)
}
await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'poco', 'owner'), ($1, 'diario', 'owner') ON CONFLICT DO NOTHING", [jog.id])

/* ------------------------------------------------------------- Dracma do Corvo */
await test('Dracma do encapuzado é entregue uma vez só', async () => {
  const antes = await jog.get('/api/poco')
  assert(antes.json.liberado && antes.json.apresentado === false, 'cena ainda não vista')
  const a = await jog.poco('apresentacao.concluir')
  const b = await jog.poco('apresentacao.concluir')
  const c = await jog.poco('apresentacao.concluir')
  assert(a.json.recebeu === true && b.json.recebeu === false && c.json.recebeu === false, `recebeu: ${a.text} / ${b.text}`)
  assert((await saldo(jog.id, 'dracma_incomum')) === 1, 'saldo de Dracma Incomum = 1')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM item_ledger WHERE idem_key = $1', [`poco:corvo:${jog.id}`])
  assert(n === 1, `uma entrada no livro-razão (veio ${n})`)
  const depois = await jog.get('/api/poco')
  assert(depois.json.apresentado === true, 'cena marcada como vista')
})

/* ------------------------------------------------------------- Giro grátis */
await test('giro grátis: 1 por dia na categoria normal', async () => {
  const p0 = await jog.get('/api/poco')
  assert(p0.json.giroGratis.disponivel === true && p0.json.giroGratis.categoria === 'dracma_comum', `giro grátis disponível: ${JSON.stringify(p0.json.giroGratis)}`)
  const r = await giro(jog, { gratis: true })
  assert(r.gratis === true && r.moeda === 'dracma_comum', 'resultado do giro grátis na categoria Dracma Comum')
  const de_novo = await jog.poco('moeda.lancar', { gratis: true })
  assert(de_novo.status === 409 && /grátis de hoje/.test(de_novo.json.error), `segundo giro grátis recusado (veio ${de_novo.status} ${de_novo.text})`)
  const p1 = await jog.get('/api/poco')
  assert(p1.json.giroGratis.disponivel === false && p1.json.giroGratis.restantes === 0, 'payload mostra giro usado')
  assert(p1.json.giroGratis.proximoEm > Date.now(), 'próximo giro grátis no futuro (meia-noite de Brasília)')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM poco_giros WHERE player_id = $1 AND gratis AND dia = (now() AT TIME ZONE 'America/Sao_Paulo')::date", [jog.id])
  assert(n === 1, `um giro grátis hoje no banco (veio ${n})`)
  // O banco também recusa um segundo registro do mesmo dia/ordem.
  let recusou = false
  try {
    await q(
      `INSERT INTO poco_giros (player_id, moeda, gratis, dia, gratis_n, seed, seed_hash, estado)
       VALUES ($1, 'dracma_comum', true, (now() AT TIME ZONE 'America/Sao_Paulo')::date, 1, 'x', 'x', 'revelado')`,
      [jog.id],
    )
  } catch {
    recusou = true
  }
  assert(recusou, 'índice único do giro grátis por dia')
})

/* ------------------------------------------------------------- Moeda consumida uma vez */
await test('moeda é consumida uma vez; outra moeda com o poço ocupado é recusada', async () => {
  await q("SELECT devo_item_grant($1, 'dracma_comum', 2, 'teste', NULL, NULL, $2)", [jog.id, `poco-test:${sfx}:moedas`])
  const a = await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  assert(a.status === 200, `lançar: ${a.text}`)
  assert((await saldo(jog.id, 'dracma_comum')) === 1, 'saldo 2 → 1')
  const ocupado = await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  assert(ocupado.status === 409, `com moeda no poço: 409 (veio ${ocupado.status})`)
  assert((await saldo(jog.id, 'dracma_comum')) === 1, 'saldo continua 1 depois da recusa')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM item_ledger WHERE idem_key = $1', [`poco:giro:${a.json.aberto.id}:moeda`])
  assert(n === 1, 'uma saída no livro-razão para o giro')
  await jog.poco('manivela.girar', { toques: [] })
  await jog.poco('balde.inspecionar')
  await giro(jog, { moeda: 'dracma_comum' })
  assert((await saldo(jog.id, 'dracma_comum')) === 0, 'saldo 0')
  const sem = await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  assert(sem.status === 409 && /Saldo insuficiente/.test(sem.json.error), `sem moeda: ${sem.text}`)
  const [{ n: abertos }] = await q("SELECT count(*)::int AS n FROM poco_giros WHERE player_id = $1 AND estado <> 'revelado'", [jog.id])
  assert(abertos === 0, 'nenhum giro órfão depois do saldo insuficiente')
})

/* ------------------------------------------------------------- Probabilidade da configuração */
await test('a probabilidade vem da configuração (fragmento 100% → fragmento; lixo 100% → nada no inventário)', async () => {
  await q("SELECT devo_item_grant($1, 'dracma_comum', 2, 'teste', NULL, NULL, $2)", [jog.id, `poco-test:${sfx}:cfg`])
  await setCfg({ ...originalCfg, dracma_comum: { lixo: 0, capsula: 0, fragmento: 100, essencia: 0, cosmetico: 0 } })
  const f0 = await saldo(jog.id, 'fragmento_arcano')
  const r1 = await giro(jog, { moeda: 'dracma_comum' })
  assert(r1.categoria === 'fragmento' && r1.item?.key === 'fragmento_arcano', `esperado fragmento: ${JSON.stringify(r1)}`)
  assert((await saldo(jog.id, 'fragmento_arcano')) === f0 + r1.quantidade && r1.quantidade >= 1, 'fragmentos entregues no inventário')

  await setCfg({ ...originalCfg, dracma_comum: { lixo: 100, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 } })
  const inv0 = (await q('SELECT coalesce(sum(quantity),0)::int AS s FROM player_items WHERE player_id = $1 AND item_key <> 'dracma_comum'', [jog.id]))[0].s
  const r2 = await giro(jog, { moeda: 'dracma_comum' })
  assert(r2.categoria === 'lixo' && r2.item === null && r2.lixo?.nome, `esperado lixo: ${JSON.stringify(r2)}`)
  const inv1 = (await q('SELECT coalesce(sum(quantity),0)::int AS s FROM player_items WHERE player_id = $1 AND item_key <> 'dracma_comum'', [jog.id]))[0].s
  assert(inv1 === inv0, 'lixo não entra no inventário')
  // Auditoria: o segredo revelado bate com o compromisso mostrado antes.
  const { createHash } = await import('node:crypto')
  assert(createHash('sha256').update(r2.seed).digest('hex') === r2.seedHash, 'sha256(seed) === seedHash')
  const [row] = await q('SELECT pesos, provisorio FROM poco_giros WHERE id = $1', [r2.id])
  assert(row.pesos.lixo > 0 && row.provisorio === true, 'pesos e marca de provisório gravados no giro')

  // Categoria sem pesos na configuração fica fechada.
  await setCfg({ dracma_incomum: originalCfg.dracma_incomum })
  const fechado = await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  assert(fechado.status === 409, `categoria sem configuração recusada (veio ${fechado.status})`)
  await setCfg(originalCfg)
})

/* ------------------------------------------------------------- Minigame contado no servidor */
const tri = (x) => {
  const f = x - Math.floor(x)
  return 1 - Math.abs(2 * f - 1)
}
/** Primeiro instante (ms, ≥ 40) em que o ponteiro da rodada passa pelo centro da janela. */
function noCentro(r) {
  let t = (((r.centro / 2 - r.fase) % 1) + 1) % 1
  let ms = t * r.periodo
  if (ms < 40) ms += r.periodo
  return Math.round(ms)
}

await test('manivela: toques fora do tempo são recusados e os acertos são contados pelo servidor', async () => {
  await q("SELECT devo_item_grant($1, 'dracma_comum', 3, 'teste', NULL, NULL, $2)", [jog.id, `poco-test:${sfx}:manivela`])
  await setCfg({ ...originalCfg, dracma_comum: { lixo: 100, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 } })

  // 1) toques no futuro (antes de o tempo passar de verdade) → 400
  await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  const ini = await jog.poco('manivela.iniciar', {})
  assert(ini.status === 200 && ini.json.params.rodadas.length === 5, `iniciar: ${ini.text}`)
  const dup = await jog.poco('manivela.iniciar', {})
  assert(dup.status === 409, 'não dá para reiniciar o minigame (sem nova tentativa)')
  const cedo = await jog.poco('manivela.girar', { toques: [8000] })
  assert(cedo.status === 400, `toque no futuro recusado (veio ${cedo.status})`)
  const ruim = await jog.poco('manivela.girar', { toques: [5, 'x'] })
  assert(ruim.status === 400, 'toques inválidos recusados')
  await jog.poco('manivela.girar', { toques: [] })
  await jog.poco('balde.inspecionar')

  // 2) toques perfeitos (calculados dos parâmetros) depois do tempo real → 5 acertos
  await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  const p = (await jog.poco('manivela.iniciar', {})).json.params
  const toques = []
  let acc = 0
  for (const r of p.rodadas) {
    acc += noCentro(r)
    toques.push(acc)
  }
  await sleep(acc + 300)
  const ok = await jog.poco('manivela.girar', { toques })
  assert(ok.status === 200 && ok.json.acertos === 5, `5 acertos esperados: ${ok.text}`)
  const res = (await jog.poco('balde.inspecionar')).json.resultado
  assert(res.acertos === 5, 'resultado guarda os acertos')
  const [row] = await q('SELECT pesos FROM poco_giros WHERE id = $1', [res.id])
  assert(row.pesos.lixo < 100, `manivela reduziu o peso do lixo (veio ${row.pesos.lixo})`)

  // 3) primeiro toque fora da janela → 0 acertos
  await jog.poco('moeda.lancar', { moeda: 'dracma_comum' })
  const p2 = (await jog.poco('manivela.iniciar', {})).json.params
  const r0 = p2.rodadas[0]
  // meio período depois do centro, o ponteiro está no lado oposto
  const fora = noCentro(r0) + Math.round(r0.periodo / 2)
  await sleep(fora + 200)
  const errou = await jog.poco('manivela.girar', { toques: [fora] })
  const pos = tri(fora / r0.periodo + r0.fase)
  const esperado = Math.abs(pos - r0.centro) <= r0.janela / 2 ? 1 : 0
  assert(errou.status === 200 && errou.json.acertos === esperado, `acertos ${errou.json?.acertos} (esperado ${esperado})`)
  await jog.poco('balde.inspecionar')
  await setCfg(originalCfg)
})

/* ------------------------------------------------------------- Owner, baldes e letreiro */
await test('painel do Owner (provisório) só para o Owner; baldes raros ocultos ao jogador', async () => {
  const j = (await jog.get('/api/poco')).json
  assert(j.owner === undefined, 'jogador não recebe o painel de probabilidades')
  const ids = j.baldes.map((b) => b.id)
  assert(ids.includes('madeira') && ids.includes('ferro') && !ids.includes('prata'), `baldes visíveis: ${ids}`)
  assert(j.baldes.find((b) => b.id === 'ferro').possui === false, 'balde normal aparece bloqueado')
  const usar = await jog.poco('balde.escolher', { balde: 'ferro' })
  assert(usar.status === 403, 'não usa balde que não tem')
  const o = (await owner.get('/api/poco')).json
  assert(o.owner && o.owner.provisorio === true && o.owner.probabilidades.dracma_comum, 'Owner recebe as probabilidades marcadas como provisórias')
})

await test('letreiro: só nome do personagem, sem cargo, sem contas de teste', async () => {
  const j = (await jog.get('/api/poco')).json
  for (const l of j.letreiro) {
    const keys = Object.keys(l).sort().join(',')
    assert(keys === 'categoria,item,nome,quando,raridade', `campos do letreiro: ${keys}`)
    assert(l.nome !== `Poco${sfx}a`, 'conta de teste não aparece no letreiro')
  }
  assert(!JSON.stringify(j.letreiro).includes('owner'), 'nenhum cargo no letreiro')
})

await setCfg(originalCfg).catch(() => {})
await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => `- ${f}`).join('\n'))
  process.exit(1)
}
