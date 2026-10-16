// Teste de servidor do Staff e Deadly Vote (DIRECAO-3 §3 e §4): inscrições com aprovação, decisão por
// participante aplicada UMA vez, Dealer nunca aprova, recompensas do caso nunca vazam para o jogador,
// tutorial vencido desbloqueia pela tela nova. Roda no CI depois das capturas (contra o Postgres do workflow e
// o servidor em http://localhost:3000). Usa os convites DEVO-STFT-* do 90-seed.sql (contas de teste).
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/staff-test.mjs
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

function internalEmail(name) {
  return `u${Buffer.from(name.toLowerCase(), 'utf8').toString('hex')}@jogador.devo`
}
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
  record(body) {
    return this.post('/api/record', body)
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
    await new Promise((ok) => setTimeout(ok, 11_000))
  }
  if (r.status !== 200) throw new Error(`cadastro de ${name} falhou: ${r.status} ${r.text.slice(0, 200)}`)
  const [p] = await q('SELECT id, role, supervisor_id FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  s.role = p.role
  return s
}
const ok200 = (r, what) => assert(r.status === 200, `${what}: ${r.status} ${r.text.slice(0, 300)}`)

const sfx = Date.now().toString(36)
const SEGREDO = `PremioSecreto${sfx}`

await test('migração do staff é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'staff-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
})

let owner, anf, dealer, j1, j2, j3
await test('contas: owner, anfitrião, dealer (convite do anfitrião) e três jogadores', async () => {
  owner = await signUp(`StfOwn${sfx}`, 'DEVO-STFT-OWNR')
  anf = await signUp(`StfAnf${sfx}`, 'DEVO-STFT-ANF1')
  const inv = await anf.post('/api/invites', { action: 'create', role: 'dealer' })
  ok200(inv, 'convite de dealer')
  dealer = await signUp(`StfDlr${sfx}`, inv.json.code)
  j1 = await signUp(`StfJogA${sfx}`, 'DEVO-STFT-JOG1')
  j2 = await signUp(`StfJogB${sfx}`, 'DEVO-STFT-JOG2')
  j3 = await signUp(`StfJogC${sfx}`, 'DEVO-STFT-JOG3')
  assert(dealer.role === 'dealer' && anf.role === 'anfitriao' && owner.role === 'owner', 'cargos')
})

let voteId
await test('Dealer convoca com local, aprovação de inscrição e recompensas privadas', async () => {
  const r = await dealer.record({
    action: 'create',
    title: `Caso Staff ${sfx}`,
    location: 'Salão de teste',
    briefing: 'Descrição pública do caso.',
    startsAt: Date.now() + 3600_000,
    maxParticipants: 5,
    admission: 'aprovacao',
    prizes: [
      { recurso: 'item', chave: 'dracma_comum', quantidade: 2, label: SEGREDO },
      { recurso: 'tempo', quantidade: 30 },
    ],
  })
  ok200(r, 'criar')
  voteId = r.json.id
  const [v] = await q('SELECT location, admission FROM deadly_votes WHERE id = $1', [voteId])
  assert(v.location === 'Salão de teste' && v.admission === 'aprovacao', `campos: ${JSON.stringify(v)}`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM deadly_vote_prizes WHERE vote_id = $1', [voteId])
  assert(n === 2, `2 recompensas planejadas, veio ${n}`)
  const bad = await dealer.record({ action: 'create', title: 'Prêmio inválido', startsAt: Date.now(), prizes: [{ recurso: 'item', chave: 'nao_existe', quantidade: 1 }] })
  assert(bad.status === 400, `item desconhecido: ${bad.status}`)
})

await test('recompensa privada não vaza para o jogador (Record, Mesa e API da equipe)', async () => {
  const rec = await j1.get('/api/record')
  ok200(rec, 'record do jogador')
  const v = rec.json.votes.find((x) => x.id === voteId)
  assert(v && v.location === 'Salão de teste' && v.admission === 'aprovacao', 'voto visível com local')
  assert(!('prizes' in v), 'payload público tem prizes')
  assert(!rec.text.includes(SEGREDO) && !rec.text.includes('dracma_comum'), 'payload público contém a recompensa')
  const mesa = await j1.get('/api/record?view=staff')
  assert(mesa.status === 403, `jogador na Mesa: ${mesa.status}`)
  const st = await j1.get('/api/staff?view=recompensas')
  assert(st.status === 403, `jogador nas recompensas: ${st.status}`)
  const board = await dealer.get('/api/record?view=staff')
  const mine = board.json.votes.find((x) => x.id === voteId)
  assert(mine?.prizes?.length === 2 && board.text.includes(SEGREDO), 'a Mesa do dono do caso vê as recompensas')
  const other = await anf.get('/api/record?view=staff')
  assert(other.json.votes.some((x) => x.id === voteId), 'Anfitrião vê o caso do seu Dealer')
})

await test('inscrição com aprovação: pendente → aceita/recusada; grupo só para aceitos', async () => {
  for (const s of [j1, j2, j3]) ok200(await s.record({ action: 'join', voteId }), `inscrição ${s.name}`)
  let v = (await j1.get('/api/record')).json.votes.find((x) => x.id === voteId)
  assert(v.entryStatus === 'pendente' && v.joined === true, `j1 pendente: ${JSON.stringify(v.entryStatus)}`)
  const intruso = await j1.record({ action: 'admission', voteId, playerId: j1.id, admission: 'aceita' })
  assert(intruso.status === 403, `jogador se aceitando: ${intruso.status}`)
  ok200(await dealer.record({ action: 'admission', voteId, playerId: j1.id, admission: 'aceita' }), 'aceitar j1')
  ok200(await dealer.record({ action: 'admission', voteId, playerId: j2.id, admission: 'aceita' }), 'aceitar j2')
  ok200(await dealer.record({ action: 'admission', voteId, playerId: j3.id, admission: 'recusada' }), 'recusar j3')
  const again = await j3.record({ action: 'join', voteId })
  assert(again.status === 409, `recusado se inscrevendo de novo: ${again.status}`)
  ok200(await dealer.record({ action: 'group', voteId, groupUrl: 'https://chat.whatsapp.com/StaffTesteGrupo01' }), 'link')
  const cedo = await dealer.record({ action: 'decision', voteId, playerId: j1.id, decision: 'premio' })
  assert(cedo.status === 409, `decidir antes de concluir: ${cedo.status}`)
  ok200(await dealer.record({ action: 'status', voteId, status: 'em-progresso' }), 'em andamento')
  v = (await j1.get('/api/record')).json.votes.find((x) => x.id === voteId)
  assert(v.groupUrl && v.entryStatus === 'aceita', 'aceito vê o grupo')
  const r3 = (await j3.get('/api/record')).json.votes.find((x) => x.id === voteId)
  assert(r3.entryStatus === 'recusada' && r3.joined === false && r3.groupUrl === null, `recusado: ${JSON.stringify(r3)}`)
})

await test('aplicar exige concluir e decidir todos os aceitos', async () => {
  const cedo = await dealer.record({ action: 'apply', voteId })
  assert(cedo.status === 409, `aplicar em andamento: ${cedo.status}`)
  ok200(await dealer.record({ action: 'status', voteId, status: 'concluido' }), 'concluir')
  ok200(await dealer.record({ action: 'decision', voteId, playerId: j1.id, decision: 'premio' }), 'j1 prêmio')
  const falta = await dealer.record({ action: 'apply', voteId })
  assert(falta.status === 409 && /faltam 1/.test(falta.json?.error ?? ''), `aplicar com decisão faltando: ${falta.status} ${falta.text}`)
  const semNota = await dealer.record({ action: 'decision', voteId, playerId: j2.id, decision: 'outro' })
  assert(semNota.status === 400, `"outro" sem nota: ${semNota.status}`)
  const recusado = await dealer.record({ action: 'decision', voteId, playerId: j3.id, decision: 'premio' })
  assert(recusado.status === 404, `decidir recusado: ${recusado.status}`)
  ok200(await dealer.record({ action: 'decision', voteId, playerId: j2.id, decision: 'morreu' }), 'j2 morreu')
})

await test('decisão por participante aplicada UMA vez (inclusive em corrida)', async () => {
  const [a, b] = await Promise.all([dealer.record({ action: 'apply', voteId }), dealer.record({ action: 'apply', voteId })])
  ok200(a, 'apply 1')
  ok200(b, 'apply 2')
  const aplicou = [a.json.aplicou, b.json.aplicou].filter(Boolean).length
  assert(aplicou === 1, `exatamente uma aplicação, vieram ${aplicou}`)
  const first = a.json.aplicou ? a.json : b.json
  assert(first.propostas === 2 && first.entregues === 0 && first.pendentes === 2, `resumo do Dealer: ${JSON.stringify(first)}`)
  const again = await dealer.record({ action: 'apply', voteId })
  assert(again.status === 200 && again.json.aplicou === false, `terceira aplicação: ${again.text}`)
  const props = await q('SELECT recipient_id, status, proposed_by, prize_id FROM reward_proposals WHERE vote_id = $1', [voteId])
  assert(props.length === 2 && props.every((p) => p.recipient_id === j1.id && p.status === 'pendente' && p.proposed_by === dealer.id && p.prize_id), `propostas: ${JSON.stringify(props)}`)
  const ents = await q('SELECT player_id, outcome, admission FROM deadly_vote_entries WHERE vote_id = $1', [voteId])
  const o = Object.fromEntries(ents.map((e) => [e.player_id, e.outcome]))
  assert(o[j1.id] === 'sobreviveu' && o[j2.id] === 'eliminado' && o[j3.id] === null, `resultados: ${JSON.stringify(o)}`)
  const [log] = await q("SELECT count(*)::int AS n FROM admin_log WHERE action = 'deadly_vote.resultado' AND ref = $1", [voteId])
  assert(log.n === 1, `log da aplicação: ${log.n}`)
})

await test('resultado aplicado fica selado (decisão, resultado e estado)', async () => {
  const d = await dealer.record({ action: 'decision', voteId, playerId: j2.id, decision: 'premio' })
  assert(d.status === 409, `mudar decisão: ${d.status}`)
  const o = await dealer.record({ action: 'outcome', voteId, playerId: j2.id, outcome: 'sobreviveu' })
  assert(o.status === 409, `mudar resultado: ${o.status}`)
  const s = await dealer.record({ action: 'status', voteId, status: 'em-progresso' })
  assert(s.status === 409, `mudar estado: ${s.status}`)
  const e = await dealer.record({ action: 'edit', voteId, title: 'Outro', startsAt: Date.now() })
  assert(e.status === 409, `editar ficha: ${e.status}`)
})

await test('Dealer não aprova nem entrega; Anfitrião aprova e a entrega é idempotente', async () => {
  const [p] = await q("SELECT id FROM reward_proposals WHERE vote_id = $1 AND resource = 'item'", [voteId])
  const ap = await dealer.post('/api/staff', { action: 'recompensa.aprovar', id: p.id, entregar: true })
  assert(ap.status === 403, `dealer aprovando: ${ap.status}`)
  const en = await dealer.post('/api/staff', { action: 'recompensa.entregar', id: p.id })
  assert(en.status === 403, `dealer entregando: ${en.status}`)
  const [still] = await q('SELECT status, authorized_by FROM reward_proposals WHERE id = $1', [p.id])
  assert(still.status === 'pendente' && still.authorized_by === null, `continua pendente: ${JSON.stringify(still)}`)
  const lista = await dealer.get('/api/staff?view=recompensas')
  assert(lista.json.recompensas.every((r) => r.podeAprovar === false), 'Mesa do Dealer não oferece aprovar')
  const inv0 = (await j1.get('/api/eu?parte=inventario&tipo=moeda')).json.inventario.find((i) => i.key === 'dracma_comum')?.quantity ?? 0
  assert(inv0 === 0, `j1 sem dracmas antes da aprovação (${inv0})`)
  ok200(await anf.post('/api/staff', { action: 'recompensa.aprovar', id: p.id, entregar: true }), 'anfitrião aprova e entrega')
  const de2 = await anf.post('/api/staff', { action: 'recompensa.entregar', id: p.id })
  assert(de2.status === 200 && de2.json.entregou === false, `segunda entrega: ${de2.text}`)
  const inv = (await j1.get('/api/eu?parte=inventario&tipo=moeda')).json.inventario.find((i) => i.key === 'dracma_comum')?.quantity
  assert(inv === 2, `j1 deveria ter 2 dracmas, tem ${inv}`)
  const rec = await j1.get('/api/record')
  assert(!rec.text.includes(SEGREDO), 'Record do jogador continua sem a recompensa depois da entrega')
})

await test('tutorial: vencer pela decisão "recebe prêmio" desbloqueia; aplicar em corrida entrega 1 vez', async () => {
  const t = await anf.record({ action: 'create', title: `Tutorial Staff ${sfx}`, startsAt: Date.now(), tutorial: true, prizes: [{ recurso: 'convite', quantidade: 1 }] })
  ok200(t, 'anfitrião cria tutorial')
  const tid = t.json.id
  ok200(await j3.record({ action: 'join', voteId: tid }), 'j3 inscrito (livre)')
  ok200(await j2.record({ action: 'join', voteId: tid }), 'j2 inscrito (livre)')
  ok200(await anf.record({ action: 'status', voteId: tid, status: 'concluido' }), 'concluir tutorial')
  const before = await j3.get('/api/eu')
  assert(before.json.desbloqueios.poco === false, 'concluir sem decisão não desbloqueia')
  const alheio = await dealer.record({ action: 'decision', voteId: tid, playerId: j3.id, decision: 'premio' })
  assert(alheio.status === 403, `dealer decidindo caso do anfitrião: ${alheio.status}`)
  ok200(await anf.record({ action: 'decision', voteId: tid, playerId: j3.id, decision: 'premio' }), 'j3 prêmio')
  ok200(await anf.record({ action: 'decision', voteId: tid, playerId: j2.id, decision: 'ausente' }), 'j2 ausente')
  const convites0 = (await j3.get('/api/eu')).json.convites
  const rs = await Promise.all([anf.record({ action: 'apply', voteId: tid }), anf.record({ action: 'apply', voteId: tid }), anf.record({ action: 'apply', voteId: tid })])
  rs.forEach((r, i) => ok200(r, `apply ${i}`))
  const res = rs.find((r) => r.json.aplicou)?.json
  assert(rs.filter((r) => r.json.aplicou).length === 1, 'uma aplicação só')
  assert(res.propostas === 1 && res.entregues === 1, `anfitrião aprova e entrega o próprio caso: ${JSON.stringify(res)}`)
  const after = await j3.get('/api/eu')
  assert(after.json.desbloqueios.poco && after.json.desbloqueios.salao_mascaras && after.json.desbloqueios.torres, `flags: ${JSON.stringify(after.json.desbloqueios)}`)
  assert(after.json.convites === convites0 + 1, `convite entregue uma vez: ${convites0} → ${after.json.convites}`)
  const ausente = await j2.get('/api/eu')
  assert(ausente.json.desbloqueios.poco === false, 'ausente continua trancado')
})

await test('Owner nunca aparece na Mesa de outro cargo nem no Record público', async () => {
  const v = await owner.record({ action: 'create', title: `Caso do Owner ${sfx}`, startsAt: Date.now() + 3600_000 })
  ok200(v, 'owner cria')
  const pub = await j1.get('/api/record')
  const mine = pub.json.votes.find((x) => x.id === v.json.id)
  assert(mine && mine.host === null && !pub.text.includes(owner.name), 'Record público sem o nome do Owner')
  const lista = await anf.get(`/api/staff?view=jogadores&q=${encodeURIComponent(owner.name)}`)
  ok200(lista, 'jogadores (anfitrião)')
  const o = lista.json.jogadores.find((x) => x.id === owner.id)
  assert(o && o.cargo === 'player' && !lista.text.includes('"owner"'), `Owner na lista do Anfitrião: ${JSON.stringify(o)}`)
  const own = await owner.get(`/api/staff?view=jogadores&q=${encodeURIComponent(owner.name)}`)
  assert(own.json.jogadores.find((x) => x.id === owner.id)?.cargo === 'owner', 'Owner vê o próprio cargo')
  const dj = await dealer.get('/api/staff?view=jogadores')
  assert(dj.status === 403, `dealer listando jogadores: ${dj.status}`)
  const resumo = await anf.get(`/api/staff?view=jogador&id=${j1.id}`)
  ok200(resumo, 'resumo do jogador')
  assert(resumo.json.deadlyVotes.sobreviveu >= 1 && !('completo' in resumo.json) && !('karma' in resumo.json), 'resumo sem dados completos')
})

await db.end()
console.log(`\nStaff: ${passed} ok, ${failures.length} falha(s)${failures.length ? ': ' + failures.join(' | ') : ''}`)
process.exit(failures.length ? 1 : 0)
