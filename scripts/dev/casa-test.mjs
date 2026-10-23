// Teste de servidor da Casa (Confecção de Cartas e Pacotes). Roda no CI depois das capturas, contra o Postgres do
// workflow e o servidor em http://localhost:3000 → casa-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/casa-test.mjs
// Cobre: trava (tutorial), materiais por raridade (quantidade e raridade exatas), cartas saem do save e o /api/save não
// as devolve, Tempo debitado com reserva, espaços da mesa, sucesso/falha pela chance gravada, liquidação idempotente,
// experimento devolve as cartas, receita entrega a carta definida e entra no Livro (só para a própria Corporação),
// aprimorar a mesa (uma vez por nível), Pacote (consome 1, entrega o prêmio; sem pacote → 409), peso máximo do DV.
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

/* ------------------------------------------------------------- HTTP com cookies (mesmo do salao-test) */
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
  casa(action, extra = {}) {
    return this.post('/api/casa', { action, ...extra })
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

const MIN = 60_000
const sfx = Date.now().toString(36)
const SFX = sfx.toUpperCase()
const timer = async (id) => Number((await q("SELECT (data->>'timerEndsAt')::bigint AS t FROM player_saves WHERE player_id = $1", [id]))[0]?.t ?? 0)
const inventario = async (id) => (await q("SELECT data->'inventory' AS i FROM player_saves WHERE player_id = $1", [id]))[0]?.i ?? []
const entregas = async (id) => q('SELECT card_id, origin FROM card_deliveries WHERE player_id = $1 ORDER BY created_at, card_id', [id])
const now = Date.now()
const save = (cards, horas = 50) => ({
  v: 1,
  welcomed: true,
  timerEndsAt: now + horas * 3600_000,
  inventory: cards.map(([uid, cardId]) => ({ uid, cardId, origin: 'teste', acquiredAt: now })),
  notifications: [],
  threads: [],
  tradesCompleted: 0,
  arcadeUnlocked: true,
})
const liberar = (s) => q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'galo_casa', 'owner') ON CONFLICT DO NOTHING", [s.id])
/** Termina as tentativas em andamento do jogador já (e opcionalmente força a chance). */
const terminar = (s, chance) =>
  q(`UPDATE confeccao_tentativas SET pronta_em = now() - interval '1 second'${chance === undefined ? '' : ', chance = $2'} WHERE player_id = $1 AND status = 'andamento'`, chance === undefined ? [s.id] : [s.id, chance])
const comuns = (p, n, card = 'escudo') => Array.from({ length: n }, (_, i) => [`${p}-c${i}`, card])

await test('migração da Casa é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'casa-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM devo_config WHERE key LIKE 'confeccao.%'")
  assert(n === 2, `2 configurações da Confecção (veio ${n})`)
  const [{ k }] = await q("SELECT count(*)::int AS k FROM item_defs WHERE key IN ('pacote:xadrez', 'estetico:molde_xadrez')")
  assert(k === 2, 'itens do pacote no catálogo')
})

await q(
  `INSERT INTO invite_codes (code, role, note, is_test) VALUES
     ($1, 'player', 'casa-test', true), ($2, 'player', 'casa-test', true), ($3, 'player', 'casa-test', true), ($4, 'owner', 'casa-test', true)
   ON CONFLICT (code) DO NOTHING`,
  ['A', 'B', 'C', 'O'].map((k) => `DEVO-CA-${SFX}-${k}`),
)

let A, B, C, O
await test('cadastro das contas de teste', async () => {
  A = await signUp(`Cas${sfx}a`, `DEVO-CA-${SFX}-A`)
  B = await signUp(`Cas${sfx}b`, `DEVO-CA-${SFX}-B`)
  C = await signUp(`Cas${sfx}c`, `DEVO-CA-${SFX}-C`)
  O = await signUp(`Cas${sfx}o`, `DEVO-CA-${SFX}-O`)
  const cartasA = [...comuns('a', 12), ['a-inc1', 'xadrez_peao'], ['a-rara', 'xadrez_bispo'], ['a-peao1', 'xadrez_peao'], ['a-peao2', 'xadrez_peao'], ['a-x1', 'escudo'], ['a-x2', 'escudo']]
  for (const [s, cards, h] of [
    [A, cartasA, 200],
    [B, [['b-peao1', 'xadrez_peao'], ['b-peao2', 'xadrez_peao']], 200],
    [C, comuns('c', 5), 0.9],
  ]) {
    const r = await s.post('/api/save', save(cards, h))
    assert(r.status === 200, `save: ${r.status}`)
  }
})
if (!A || !O) {
  console.log('\nsem contas, abortando')
  process.exit(1)
}

await test('trancado sem o tutorial (GET liberado:false; POST 403); Owner vê liberado com as receitas', async () => {
  const r = await A.get('/api/casa')
  assert(r.status === 200 && r.json.liberado === false, `GET trancado: ${r.text}`)
  const p = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c0', 'a-c1', 'a-c2', 'a-c3', 'a-c4'] })
  assert(p.status === 403, `POST trancado deveria ser 403 (veio ${p.status})`)
  const o = await O.get('/api/casa')
  assert(o.json.liberado === true && Array.isArray(o.json.receitas), 'Owner vê a Casa e as receitas')
  const a = await A.get('/api/casa')
  assert(a.json.receitas === undefined, 'jogador não recebe as receitas')
})
for (const s of [A, B, C]) await liberar(s)

await test('raridade: quantidade errada e raridade errada são recusadas sem tirar cartas', async () => {
  const r1 = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c0', 'a-c1', 'a-c2', 'a-c3'] })
  assert(r1.status === 400, `4 comuns deveria ser 400 (veio ${r1.status} ${r1.text})`)
  const r2 = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c0', 'a-c1', 'a-c2', 'a-c3', 'a-inc1'] })
  assert(r2.status === 400, `incomum misturada deveria ser 400 (veio ${r2.status} ${r2.text})`)
  const r3 = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c0', 'a-c0', 'a-c1', 'a-c2', 'a-c3'] })
  assert(r3.status === 400, 'carta repetida recusada')
  const inv = await inventario(A.id)
  assert(inv.length === 18, `inventário intacto (${inv.length})`)
})

let t1
await test('5 comuns → tentativa: cartas saem do save, Tempo debitado, save antigo não devolve', async () => {
  const antes = await timer(A.id)
  const r = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c0', 'a-c1', 'a-c2', 'a-c3', 'a-c4'], idem: `t1-${sfx}` })
  assert(r.status === 200 && r.json.tentativa?.status === 'andamento', `iniciar: ${r.status} ${r.text}`)
  t1 = r.json.tentativa
  assert(t1.chance === 50 && t1.nivelMesa === 1, 'chance do nível 1 = 50%')
  const depois = await timer(A.id)
  assert(antes - depois === 30 * MIN && r.json.timeDeltaMs === -30 * MIN, `30 min debitados (${(antes - depois) / MIN})`)
  const inv = await inventario(A.id)
  assert(!inv.some((c) => ['a-c0', 'a-c4'].includes(c.uid)), 'materiais saíram do save')
  const cartasA = [...comuns('a', 12), ['a-inc1', 'xadrez_peao'], ['a-rara', 'xadrez_bispo'], ['a-peao1', 'xadrez_peao'], ['a-peao2', 'xadrez_peao'], ['a-x1', 'escudo'], ['a-x2', 'escudo']]
  await A.post('/api/save', save(cartasA, 200))
  const inv2 = await inventario(A.id)
  assert(!inv2.some((c) => c.uid === 'a-c0'), 'save antigo não traz o material de volta')
  const dup = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c5', 'a-c6', 'a-c7', 'a-c8', 'a-c9'], idem: `t1-${sfx}` })
  assert(dup.status === 409, `mesmo idem não cobra de novo (veio ${dup.status})`)
})

await test('mesa nível 1 tem um espaço: segunda fabricação recusada', async () => {
  const r = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c5', 'a-c6', 'a-c7', 'a-c8', 'a-c9'] })
  assert(r.status === 409 && /ocupada/.test(r.json?.error ?? ''), `espaço ocupado: ${r.status} ${r.text}`)
  const inv = await inventario(A.id)
  assert(inv.some((c) => c.uid === 'a-c5'), 'cartas continuam no save')
})

await test('sucesso (chance 100): uma carta Incomum entregue, uma vez só', async () => {
  await terminar(A, 100)
  const g1 = await A.get('/api/casa')
  const g2 = await A.get('/api/casa')
  const h = g2.json.historico.find((t) => t.id === t1.id)
  assert(h?.status === 'sucesso' && h.resultado, `tentativa resolvida: ${JSON.stringify(h)}`)
  const e = (await entregas(A.id)).filter((x) => x.origin === 'Confecção de Cartas')
  assert(e.length === 1, `uma entrega (${e.length})`)
  assert(g1.json.cartasPendentes >= 1, 'cartas pendentes para resgatar')
})

await test('falha (chance 0): nada entregue e os materiais se perdem', async () => {
  const r = await A.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['a-c5', 'a-c6', 'a-c7', 'a-c8', 'a-c9'] })
  assert(r.status === 200, `iniciar: ${r.text}`)
  await terminar(A, 0)
  const g = await A.get('/api/casa')
  const h = g.json.historico.find((t) => t.id === r.json.tentativa.id)
  assert(h?.status === 'falha' && !h.resultado, 'falhou')
  const e = (await entregas(A.id)).filter((x) => x.origin === 'Confecção de Cartas')
  assert(e.length === 1, 'nenhuma entrega nova')
})

await test('combinação sem receita: paga o Tempo e as cartas voltam (com outro uid)', async () => {
  const antes = await timer(A.id)
  const r = await A.casa('confeccao.iniciar', { modo: 'combinacao', uids: ['a-x1', 'a-x2'] })
  assert(r.status === 200 && r.json.tentativa.modo === 'experimento', `experimento: ${r.text}`)
  assert(antes - (await timer(A.id)) === 60 * MIN, 'Tempo do experimento debitado')
  await terminar(A)
  const g = await A.get('/api/casa')
  assert(g.json.historico.find((t) => t.id === r.json.tentativa.id)?.status === 'sem_receita', 'sem receita')
  const e = (await entregas(A.id)).filter((x) => /sem efeito/.test(x.origin)).map((x) => x.card_id).sort()
  assert(e.join() === 'escudo,escudo', `cartas devolvidas: ${e}`)
})

await test('receita: entrega a carta definida, entra no Livro da Corporação e não aparece para outras', async () => {
  const receitas = [{ id: 'dois-peoes', materiais: ['xadrez_peao', 'xadrez_peao'], resultado: 'xadrez_rainha', minutos: 10, espera: 5, ativa: true }]
  const neg = await A.casa('receitas.salvar', { receitas })
  assert(neg.status === 403, 'jogador não salva receitas')
  const s = await O.casa('receitas.salvar', { receitas })
  assert(s.status === 200, `Owner salva: ${s.text}`)
  // A e B na mesma Corporação; C fora.
  const [corp] = await q("INSERT INTO corporacoes (nome, status, fundador_id) VALUES ($1, 'ativa', $2) RETURNING id", [`Casa ${sfx}`, A.id])
  await q("INSERT INTO corporacao_membros (player_id, corporacao_id, cargo) VALUES ($1, $3, 'lider'), ($2, $3, 'membro')", [A.id, B.id, corp.id])
  const r = await A.casa('confeccao.iniciar', { modo: 'combinacao', uids: ['a-peao1', 'a-peao2'] })
  assert(r.status === 200 && r.json.tentativa.modo === 'receita' && r.json.tentativa.alvo === 'ultra_rara', `receita: ${r.text}`)
  await terminar(A, 100)
  const g = await A.get('/api/casa')
  const h = g.json.historico.find((t) => t.id === r.json.tentativa.id)
  assert(h?.status === 'sucesso' && h.resultado === 'xadrez_rainha' && h.descobriu === true, `resultado específico: ${JSON.stringify(h)}`)
  assert(g.json.livro.some((x) => x.id === 'dois-peoes' && x.por === 'voce'), 'no Livro de quem descobriu')
  const b = await B.get('/api/casa')
  assert(b.json.livro.some((x) => x.id === 'dois-peoes' && x.por !== 'voce'), 'no Livro do companheiro de Corporação')
  const c = await C.get('/api/casa')
  assert(!c.json.livro.length, 'fora da Corporação não vê')
})

await test('aprimorar a mesa: nível 2 (60%), Tempo debitado, repetir recusa', async () => {
  const antes = await timer(A.id)
  const r = await A.casa('mesa.aprimorar', { para: 2 })
  assert(r.status === 200 && r.json.mesa.nivel === 2 && r.json.mesa.chance === 60, `aprimorar: ${r.text}`)
  assert(antes - (await timer(A.id)) === 180 * MIN, '180 min debitados')
  const d = await A.casa('mesa.aprimorar', { para: 2 })
  assert(d.status === 409, 'mesmo nível não cobra de novo')
  const pulo = await A.casa('mesa.aprimorar', { para: 4 })
  assert(pulo.status === 409, 'não pula níveis')
})

await test('reserva: sem Tempo suficiente a fabricação é recusada e nada muda', async () => {
  const r = await C.casa('confeccao.iniciar', { modo: 'raridade', alvo: 'incomum', uids: ['c-c0', 'c-c1', 'c-c2', 'c-c3', 'c-c4'] })
  assert(r.status === 409 && /Tempo insuficiente/.test(r.json?.error ?? ''), `reserva: ${r.status} ${r.text}`)
  const inv = await inventario(C.id)
  assert(inv.length === 5, 'cartas continuam no save')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM confeccao_materiais WHERE player_id = $1", [C.id])
  assert(n === 0, 'nenhum material registrado')
})

await test('pacote: sem pacote → 409; com pacote abre, consome 1 e entrega o prêmio', async () => {
  const sem = await B.casa('pacote.abrir', { pacote: 'xadrez' })
  assert(sem.status === 409, `sem pacote: ${sem.status} ${sem.text}`)
  await q("SELECT devo_item_grant($1, 'pacote:xadrez', 2, 'teste', NULL, NULL, NULL)", [B.id])
  const g = await B.get('/api/casa')
  assert(g.json.pacotes.find((p) => p.id === 'xadrez')?.quantidade === 2, 'dois pacotes no inventário')
  const r = await B.casa('pacote.abrir', { pacote: 'xadrez', idem: `pk-${sfx}` })
  assert(r.status === 200 && r.json.premio?.rotulo, `abrir: ${r.text}`)
  const again = await B.casa('pacote.abrir', { pacote: 'xadrez', idem: `pk-${sfx}` })
  assert(again.status === 200 && again.json.premio.rotulo === r.json.premio.rotulo, 'mesmo idem devolve o mesmo prêmio')
  const [{ quantity }] = await q("SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = 'pacote:xadrez'", [B.id])
  assert(Number(quantity) === 1, `consumiu um (${quantity})`)
  const p = r.json.premio
  assert(p.tipo === 'carta' || p.tipo === 'item', `prêmio concreto (nada de linha aleatória crua): ${JSON.stringify(p)}`)
  if (p.tipo === 'carta') {
    const recebidos = (await entregas(B.id)).filter((x) => x.origin === 'Pacote Raro: Coleção de Xadrez').length
    assert(recebidos === 1, `uma carta entregue (${recebidos})`)
  } else {
    const [it] = await q('SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = $2', [B.id, p.item])
    assert(it && Number(it.quantity) >= 1, `item entregue: ${p.item}`)
  }
})

await test('pacote: a tabela soma 100 e as linhas aleatórias viram carta ou item', async () => {
  await q("SELECT devo_item_grant($1, 'pacote:xadrez', 12, 'teste', NULL, NULL, NULL)", [B.id])
  const tipos = new Set()
  for (let i = 0; i < 12; i++) {
    const r = await B.casa('pacote.abrir', { pacote: 'xadrez', idem: `pk-${sfx}-${i}` })
    assert(r.status === 200, `abrir ${i}: ${r.text}`)
    assert(r.json.premio.tipo === 'carta' || r.json.premio.tipo === 'item', `prêmio ${i}: ${JSON.stringify(r.json.premio)}`)
    tipos.add(r.json.premio.tipo)
  }
  const g = await B.get('/api/casa')
  const tabela = g.json.pacotesTabela ?? null
  if (tabela) assert(Math.abs(tabela.reduce((s, x) => s + x.chance, 0) - 100) < 0.01, 'chances somam 100')
})

await test('Pacote Iniciante e Intermediário: várias cartas por pacote, todas entregues', async () => {
  const pendentes = async () => Number((await q("SELECT count(*)::int AS n FROM card_deliveries WHERE player_id = $1 AND claimed_at IS NULL", [B.id]))[0].n)
  await q("SELECT devo_item_grant($1, 'pacote:iniciante', 3, 'teste', NULL, NULL, NULL), devo_item_grant($1, 'pacote:intermediario', 2, 'teste', NULL, NULL, NULL), devo_item_grant($1, 'pacote:presente', 1, 'teste', NULL, NULL, NULL)", [B.id])
  for (let i = 0; i < 3; i++) {
    const p0 = await pendentes()
    const r = await B.casa('pacote.abrir', { pacote: 'iniciante', idem: `pi-${sfx}-${i}` })
    assert(r.status === 200 && r.json.premio.tipo === 'cartas', `iniciante ${i}: ${r.text}`)
    const n = r.json.premio.cartas.length
    assert(n >= 5 && n <= 6, `iniciante entrega 5 ou 6 cartas (${n})`)
    assert((await pendentes()) - p0 === n, 'todas as cartas viraram entrega')
  }
  for (let i = 0; i < 2; i++) {
    const r = await B.casa('pacote.abrir', { pacote: 'intermediario', idem: `pm-${sfx}-${i}` })
    assert(r.status === 200 && r.json.premio.tipo === 'cartas', `intermediário ${i}: ${r.text}`)
    const n = r.json.premio.cartas.length
    assert(n >= 9 && n <= 12, `intermediário entrega 9 a 12 cartas (${n})`)
  }
  const pr = await B.casa('pacote.abrir', { pacote: 'presente', idem: `pp-${sfx}` })
  assert(pr.status === 200 && (pr.json.premio.tipo === 'carta' || pr.json.premio.tipo === 'item'), `presente: ${pr.text}`)
  if (pr.json.premio.tipo === 'item') assert(!pr.json.premio.item.startsWith('essencia'), 'presente não dá essência')
})

await test('peso das cartas: acima do limite não se inscreve; dentro do limite entra; troca também respeita o peso', async () => {
  const r = await O.post('/api/record', { action: 'create', title: `Peso ${sfx} b`, startsAt: Date.now() + 86400_000, pesoMaximo: 5, admission: 'livre' })
  assert(r.status === 200, `convocar: ${r.text.slice(0, 200)}`)
  const id = r.json.id
  const inv = [['pw-rainha', 'xadrez_rainha'], ['pw-torre', 'xadrez_torre'], ['pw-peao', 'xadrez_peao'], ['pw-bispo', 'xadrez_bispo']].map(([uid, cardId]) => ({ uid, cardId, origin: 'teste', acquiredAt: Date.now() }))
  await q("UPDATE player_saves SET data = jsonb_set(data, '{inventory}', $2::jsonb) WHERE player_id = $1", [A.id, JSON.stringify(inv)])
  const acima = await A.post('/api/record', { action: 'join', voteId: id, cartas: ['pw-rainha', 'pw-torre'] })
  assert(acima.status === 409 && /peso/i.test(acima.json?.error ?? ''), `rainha 4 + torre 3 = 7 > 5 recusado: ${acima.status} ${acima.text}`)
  const alheia = await A.post('/api/record', { action: 'join', voteId: id, cartas: ['nao-e-minha'] })
  assert(alheia.status === 409, `carta de fora do inventário: ${alheia.status}`)
  const g0 = await A.get('/api/record')
  assert(!g0.json.votes.find((v) => v.id === id)?.joined, 'recusado não ficou inscrito')
  const ok = await A.post('/api/record', { action: 'join', voteId: id, cartas: ['pw-rainha', 'pw-peao'] })
  assert(ok.status === 200, `rainha 4 + peão 1 = 5 entra: ${ok.text}`)
  const g = await A.get('/api/record')
  const v = g.json.votes.find((x) => x.id === id)
  assert(v.joined && v.minhasCartas.length === 2, `inscrito com 2 cartas: ${JSON.stringify(v.minhasCartas)}`)
  const trocaRuim = await A.post('/api/record', { action: 'cartas', voteId: id, cartas: ['pw-rainha', 'pw-bispo'] })
  assert(trocaRuim.status === 409, `troca para 6 recusada: ${trocaRuim.status}`)
  const troca = await A.post('/api/record', { action: 'cartas', voteId: id, cartas: ['pw-torre', 'pw-bispo'] })
  assert(troca.status === 200 && troca.json.cartas.length === 2, `troca para torre 3 + bispo 2 = 5: ${troca.text}`)
  const board = await O.get('/api/record?view=staff').catch(() => null)
  if (board?.status === 200 && board.json?.votes) {
    const e = board.json.votes.find((x) => x.id === id)?.entries?.find((x) => x.playerId === A.id)
    assert(e?.cartas?.length === 2, 'a Mesa vê as cartas do participante')
  }
})

await test('peso máximo do Deadly Vote: salvo na convocação e visto pelo jogador', async () => {
  const r = await O.post('/api/record', { action: 'create', title: `Peso ${sfx}`, startsAt: Date.now() + 86400_000, pesoMaximo: 7, admission: 'livre' })
  assert(r.status === 200, `convocar: ${r.status} ${r.text.slice(0, 200)}`)
  const g = await A.get('/api/record')
  const v = g.json.votes.find((x) => x.title === `Peso ${sfx}`)
  assert(v?.pesoMaximo === 7, `peso no payload: ${JSON.stringify(v)}`)
})

console.log(`\n${passed} ok, ${failures.length} falhas${failures.length ? `: ${failures.join(' · ')}` : ''}`)
await db.end()
process.exit(failures.length ? 1 : 0)
