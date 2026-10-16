// Teste de servidor da Fundação (cargos, permissões, recompensas, inventário, desbloqueios, karma, convites).
// Roda no CI depois das capturas, contra o Postgres do workflow e o servidor em http://localhost:3000.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/fundacao-test.mjs
// Sai com código 1 se algum caso falhar. Usa os convites DEVO-FUND-* do 90-seed.sql (contas de teste).
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
async function rejects(promise, re, msg) {
  try {
    await promise
  } catch (err) {
    if (re && !re.test(String(err?.message))) throw new Error(`${msg}: erro inesperado ${err?.message}`)
    return
  }
  throw new Error(`${msg}: deveria falhar`)
}
const q = async (text, params) => (await db.query(text, params)).rows

/* ------------------------------------------------------------- HTTP com cookies */
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
    return {
      'content-type': 'application/json',
      origin: BASE,
      cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
      ...extra,
    }
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
}
async function signUp(name, invite) {
  const s = new Session(name)
  let r
  // O better-auth limita cadastros (429 em rajadas): espera a janela e tenta de novo.
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
  s.supervisorId = p.supervisor_id
  return s
}

/* ------------------------------------------------------------- 1. Banco (funções e gatilhos) */
const sfx = Date.now().toString(36)

await test('migração é idempotente (roda de novo sem erro)', async () => {
  const sql = readFileSync(join(here, '..', 'fundacao-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
})

const [tmp] = await q("INSERT INTO players (name, role, is_test) VALUES ($1, 'player', true) RETURNING id", [`fund-tmp-${sfx}`])

await test('grant/consume: nunca deixa negativo e é idempotente', async () => {
  const [{ v: a }] = await q("SELECT devo_item_grant($1, 'dracma_comum', 3, 'teste', NULL, NULL, $2) AS v", [tmp.id, `t:${sfx}:1`])
  assert(Number(a) === 3, `saldo 3 esperado, veio ${a}`)
  const [{ v: b }] = await q("SELECT devo_item_grant($1, 'dracma_comum', 3, 'teste', NULL, NULL, $2) AS v", [tmp.id, `t:${sfx}:1`])
  assert(Number(b) === 3, `idem repetido não pode conceder de novo (veio ${b})`)
  await rejects(q("SELECT devo_item_consume($1, 'dracma_comum', 5, 'teste')", [tmp.id]), /SALDO_INSUFICIENTE/, 'consumir 5 de 3')
  const [{ quantity }] = await q("SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = 'dracma_comum'", [tmp.id])
  assert(Number(quantity) === 3, 'saldo mudou após consumo recusado')
  const [{ v: c }] = await q("SELECT devo_item_consume($1, 'dracma_comum', 3, 'teste') AS v", [tmp.id])
  assert(Number(c) === 0, 'consumir 3 de 3 deveria zerar')
  await rejects(q("SELECT devo_item_consume($1, 'dracma_comum', 1, 'teste')", [tmp.id]), /SALDO_INSUFICIENTE/, 'consumir de saldo zero')
  await rejects(q("UPDATE player_items SET quantity = -1 WHERE player_id = $1 AND item_key = 'dracma_comum'", [tmp.id]), /check constraint/, 'quantidade negativa direta')
  await rejects(q("SELECT devo_item_grant($1, 'item_que_nao_existe', 1, 'teste')", [tmp.id]), /ITEM_DESCONHECIDO/, 'item desconhecido')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM item_ledger WHERE player_id = $1', [tmp.id])
  assert(n === 2, `livro-razão deveria ter 2 linhas (entrada + saída), tem ${n}`)
})

await test('item único (cosmético) fica com quantidade 1', async () => {
  await q("SELECT devo_item_grant($1, 'cosmetico:moldura-exemplo', 1, 'teste')", [tmp.id])
  const [{ v }] = await q("SELECT devo_item_grant($1, 'cosmetico:moldura-exemplo', 1, 'teste') AS v", [tmp.id])
  assert(Number(v) === 1, `cosmético duplicado: ${v}`)
})

await test('karma ajusta com histórico e idem', async () => {
  const [{ v }] = await q("SELECT devo_karma_ajustar($1, -4, 'teste', NULL, NULL, $2) AS v", [tmp.id, `k:${sfx}`])
  const [{ v: v2 }] = await q("SELECT devo_karma_ajustar($1, -4, 'teste', NULL, NULL, $2) AS v", [tmp.id, `k:${sfx}`])
  assert(v === -4 && v2 === -4, `karma esperado -4, veio ${v}/${v2}`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM karma_log WHERE player_id = $1', [tmp.id])
  assert(n === 1, 'histórico de karma')
})

await test('Dealer sem supervisor é recusado pelo banco', async () => {
  await rejects(q("INSERT INTO players (name, role, is_test) VALUES ($1, 'dealer', true)", [`fund-dlr-${sfx}`]), /DEALER_SEM_SUPERVISOR/, 'dealer sem supervisor')
  await rejects(q("UPDATE players SET role = 'dealer' WHERE id = $1", [tmp.id]), /DEALER_SEM_SUPERVISOR/, 'promover sem supervisor')
})

await test('banco: Dealer não aprova; aprovada editada volta a pendente; externa só Owner', async () => {
  const [anf] = await q("SELECT id FROM players WHERE role = 'anfitriao' ORDER BY created_at LIMIT 1")
  const [dlr] = await q("SELECT id FROM players WHERE role = 'dealer' ORDER BY created_at LIMIT 1")
  const [own] = await q("SELECT id FROM players WHERE role = 'owner' ORDER BY created_at LIMIT 1")
  const [r] = await q(
    `INSERT INTO reward_proposals (kind, origin, recipient_id, resource, resource_key, quantity, justification, proposed_by, status, authorized_by)
     VALUES ('evento', 'teste', $1, 'item', 'dracma_comum', 2, 'teste de banco', $2, 'aprovada', $2) RETURNING id, status`,
    [tmp.id, dlr.id],
  )
  assert(r.status === 'pendente', 'proposta deve nascer pendente mesmo pedindo aprovada')
  await rejects(q("UPDATE reward_proposals SET status = 'aprovada', authorized_by = $2 WHERE id = $1", [r.id, dlr.id]), /APROVACAO_NAO_PERMITIDA/, 'dealer aprovando')
  await rejects(q("UPDATE reward_proposals SET status = 'entregue' WHERE id = $1", [r.id]), /ENTREGA_SEM_APROVACAO/, 'entregar pendente')
  await q("UPDATE reward_proposals SET status = 'aprovada', authorized_by = $2 WHERE id = $1", [r.id, anf.id])
  const [e] = await q('UPDATE reward_proposals SET quantity = 5 WHERE id = $1 RETURNING status, authorized_by, revision', [r.id])
  assert(e.status === 'pendente' && e.authorized_by === null && e.revision === 2, `editar aprovada: ${JSON.stringify(e)}`)
  const [x] = await q(
    `INSERT INTO reward_proposals (kind, origin, recipient_id, resource, quantity, justification, proposed_by)
     VALUES ('externa', 'teste', $1, 'tempo', 30, 'externa de teste', $2) RETURNING id`,
    [tmp.id, anf.id],
  )
  await rejects(q("UPDATE reward_proposals SET status = 'aprovada', authorized_by = $2 WHERE id = $1", [x.id, anf.id]), /APROVACAO_NAO_PERMITIDA/, 'anfitrião aprovando externa')
  await q("UPDATE reward_proposals SET status = 'aprovada', authorized_by = $2 WHERE id = $1", [x.id, own.id])
  await q("UPDATE reward_proposals SET status = 'entregue' WHERE id = $1", [x.id])
  await rejects(q('UPDATE reward_proposals SET quantity = 1 WHERE id = $1', [x.id]), /RECOMPENSA_FECHADA/, 'editar entregue')
  const log = await q('SELECT action FROM reward_log WHERE proposal_id = $1 ORDER BY id', [r.id])
  assert(log.map((l) => l.action).join(',') === 'criada,aprovada,editada', `reward_log: ${log.map((l) => l.action)}`)
})

await test('seed: tutorial vencido desbloqueia; contas antigas continuam trancadas', async () => {
  const [lirio] = await q("SELECT devo_tem_desbloqueio('00000000-0000-4000-8000-000000000005', 'poco') AS ok")
  const [nyx] = await q("SELECT devo_tem_desbloqueio('00000000-0000-4000-8000-000000000004', 'poco') AS ok")
  const [own] = await q("SELECT devo_tem_desbloqueio('00000000-0000-4000-8000-000000000010', 'corporacoes') AS ok")
  assert(lirio.ok === true, 'Lírio (sobreviveu ao tutorial) deveria ter o Poço')
  assert(nyx.ok === false, 'Nyx (eliminada) não deveria ter o Poço')
  assert(own.ok === true, 'Owner vê tudo liberado')
})

/* ------------------------------------------------------------- 2. API (com sessões reais) */
let owner, anf, anf2, dealer, j1, j2
await test('cadastro por convite de cada cargo', async () => {
  owner = await signUp(`FundSent${sfx}`, 'DEVO-FUND-OWNR')
  anf = await signUp(`FundAnf${sfx}`, 'DEVO-FUND-ANF1')
  anf2 = await signUp(`FundAnfB${sfx}`, 'DEVO-FUND-ANF2')
  j1 = await signUp(`FundJog${sfx}`, 'DEVO-FUND-JOG1')
  j2 = await signUp(`FundJogB${sfx}`, 'DEVO-FUND-JOG2')
  assert(owner.role === 'owner' && anf.role === 'anfitriao' && j1.role === 'player', 'cargos vindos do convite')
})

await test('Anfitrião gera convite de Dealer; Dealer nasce sob ele', async () => {
  const r = await anf.post('/api/invites', { action: 'create', role: 'dealer' })
  assert(r.status === 200 && r.json?.code, `convite de dealer: ${r.status} ${r.text}`)
  dealer = await signUp(`FundDlr${sfx}`, r.json.code)
  assert(dealer.role === 'dealer' && dealer.supervisorId === anf.id, `dealer ${dealer.role} sup ${dealer.supervisorId}`)
})

await test('Dealer não gera convites; Jogador gera 1 (cota) e não fica negativo', async () => {
  const d = await dealer.post('/api/invites', { action: 'create', role: 'player' })
  assert(d.status === 403, `dealer gerando convite: ${d.status}`)
  const eu = await j1.get('/api/eu')
  assert(eu.json?.convites === 1, `cota inicial 1, veio ${eu.json?.convites}`)
  const a = await j1.post('/api/invites', { action: 'create', role: 'player' })
  assert(a.status === 200, `1º convite do jogador: ${a.status} ${a.text}`)
  const b = await j1.post('/api/invites', { action: 'create', role: 'player' })
  assert(b.status === 403, `2º convite deveria falhar: ${b.status}`)
  const c = await j1.post('/api/invites', { action: 'create', role: 'dealer' })
  assert(c.status === 403, 'jogador não gera convite de dealer')
  const [row] = await q("SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = 'convite'", [j1.id])
  assert(Number(row.quantity) === 0, `cota deveria ser 0, é ${row.quantity}`)
})

await test('/api/eu: Jogador trancado, Owner e Anfitrião com tudo liberado, sem karma cru', async () => {
  const p = await j1.get('/api/eu')
  assert(p.status === 200 && p.json.cargo === 'player', `eu: ${p.status}`)
  assert(Object.values(p.json.desbloqueios).every((v) => v === false), 'jogador novo deveria estar trancado')
  assert(!('karma' in p.json), 'payload do jogador não expõe o karma cru')
  const o = await owner.get('/api/eu')
  assert(o.json.tudoLiberado === true && o.json.desbloqueios.poco === true, 'owner com tudo liberado')
  const ac = o.json.acesso
  assert(ac?.total && ac.salaJogos && ac.todosApps && ac.pularTutoriais, `acesso total do owner: ${JSON.stringify(ac)}`)
  assert(p.json.acesso.total === false && p.json.acesso.salaJogos === false, 'jogador novo sem Sala de Jogos revelada')
  const a = await anf.get('/api/eu')
  assert(a.json.tudoLiberado === true, 'anfitrião com tudo liberado')
  const d = await dealer.get('/api/eu')
  assert(d.json.tudoLiberado === false, 'dealer segue a regra do tutorial')
})

let voteId, rewardId
await test('recompensa: Dealer propõe e NÃO aprova; Anfitrião aprova', async () => {
  const v = await dealer.post('/api/record', { action: 'create', title: `Caso Fundação ${sfx}`, startsAt: Date.now() + 3600_000 })
  assert(v.status === 200 && v.json?.id, `dealer cria DV: ${v.status} ${v.text}`)
  voteId = v.json.id
  const p = await dealer.post('/api/staff', {
    action: 'recompensa.propor', tipo: 'evento', voteId, destinatarioId: j1.id, recurso: 'item', chave: 'dracma_comum', quantidade: 2, justificativa: 'Venceu a rodada final.',
  })
  assert(p.status === 200 && p.json?.id, `dealer propõe: ${p.status} ${p.text}`)
  rewardId = p.json.id
  const ap = await dealer.post('/api/staff', { action: 'recompensa.aprovar', id: rewardId })
  assert(ap.status === 403, `dealer aprovando: ${ap.status}`)
  const auto = await dealer.post('/api/staff', {
    action: 'recompensa.propor', tipo: 'evento', voteId, destinatarioId: j1.id, recurso: 'tempo', quantidade: 30, justificativa: 'Tentando autoaprovar.', aprovar: true,
  })
  assert(auto.status === 403, `dealer autoaprovando na proposta: ${auto.status}`)
  const outro = await anf2.post('/api/staff', { action: 'recompensa.aprovar', id: rewardId })
  assert(outro.status === 403, `anfitrião de outro dealer aprovando: ${outro.status}`)
  const ok = await anf.post('/api/staff', { action: 'recompensa.aprovar', id: rewardId })
  assert(ok.status === 200, `anfitrião aprova: ${ok.status} ${ok.text}`)
})

await test('editar recompensa aprovada volta a pendente', async () => {
  const e = await dealer.post('/api/staff', { action: 'recompensa.editar', id: rewardId, quantidade: 3 })
  assert(e.status === 200 && e.json.recompensa.status === 'pendente' && e.json.recompensa.autorizadoPor === null, `editar: ${e.text}`)
  const ent = await anf.post('/api/staff', { action: 'recompensa.entregar', id: rewardId })
  assert(ent.status === 409, `entregar pendente: ${ent.status}`)
})

await test('entrega idempotente', async () => {
  const ok = await anf.post('/api/staff', { action: 'recompensa.aprovar', id: rewardId, entregar: true })
  assert(ok.status === 200, `aprovar+entregar: ${ok.status} ${ok.text}`)
  const again = await anf.post('/api/staff', { action: 'recompensa.entregar', id: rewardId })
  assert(again.status === 200 && again.json.entregou === false, `segunda entrega: ${again.text}`)
  const inv = await j1.get('/api/eu?parte=inventario&tipo=moeda')
  const dr = inv.json.inventario.find((i) => i.key === 'dracma_comum')
  assert(dr?.quantity === 3, `jogador deveria ter 3 dracmas, tem ${dr?.quantity}`)
  const [log] = await q("SELECT count(*)::int AS n FROM admin_log WHERE action = 'recompensa.entregue' AND ref = $1", [rewardId])
  assert(log.n === 1, 'log administrativo da concessão')
})

await test('recompensa externa do Anfitrião exige Owner', async () => {
  const p = await anf.post('/api/staff', { action: 'recompensa.propor', tipo: 'externa', origem: 'Ajuda no evento', destinatarioId: j2.id, recurso: 'convite', quantidade: 1, justificativa: 'Trouxe dois jogadores.' })
  assert(p.status === 200, `anfitrião propõe externa: ${p.text}`)
  const a = await anf.post('/api/staff', { action: 'recompensa.aprovar', id: p.json.id })
  assert(a.status === 403, `anfitrião aprovando externa: ${a.status}`)
  const o = await owner.post('/api/staff', { action: 'recompensa.aprovar', id: p.json.id, entregar: true })
  assert(o.status === 200, `owner aprova externa: ${o.text}`)
  const eu = await j2.get('/api/eu')
  assert(eu.json.convites === 2, `j2 deveria ter 2 convites (1 + recompensa), tem ${eu.json.convites}`)
})

await test('Jogador não acessa a API da equipe', async () => {
  const r = await j1.get('/api/staff?view=recompensas')
  assert(r.status === 403, `jogador listando recompensas: ${r.status}`)
  const k = await anf.post('/api/staff', { action: 'karma.ajustar', playerId: j1.id, delta: 5, motivo: 'x' })
  assert(k.status === 403, `anfitrião ajustando karma: ${k.status}`)
})

await test('transferência de Dealer preserva o supervisor original nas propostas', async () => {
  const t = await anf.post('/api/staff', { action: 'dealer.transferir', dealerId: dealer.id, supervisorId: anf2.id })
  assert(t.status === 403, 'anfitrião não transfere')
  const ok = await owner.post('/api/staff', { action: 'dealer.transferir', dealerId: dealer.id, supervisorId: anf2.id })
  assert(ok.status === 200, `owner transfere: ${ok.text}`)
  const [p] = await q('SELECT supervisor_id FROM reward_proposals WHERE id = $1', [rewardId])
  assert(p.supervisor_id === anf.id, 'proposta antiga mantém o supervisor original')
  const hist = await q('SELECT supervisor_id, ended_at FROM dealer_supervisions WHERE dealer_id = $1 ORDER BY id', [dealer.id])
  assert(hist.length === 2 && hist[0].ended_at && !hist[1].ended_at && hist[1].supervisor_id === anf2.id, `histórico: ${JSON.stringify(hist)}`)
  const [log] = await q("SELECT actor_id FROM admin_log WHERE action = 'dealer.supervisor' AND target_id = $1", [dealer.id])
  assert(log?.actor_id === owner.id, 'log da transferência com o Owner como ator')
})

await test('payload público nunca contém o cargo owner', async () => {
  // A mesa (lobby) é só registro: ninguém digita ali. A linha entra direto no banco para conferir a leitura.
  const c = await owner.post('/api/arcade', { action: 'chat', channel: 'lobby', body: 'Mensagem do teste da fundação.' })
  assert(c.status === 403, `lobby deveria recusar mensagem digitada: ${c.status}`)
  await q('INSERT INTO arcade_chat (channel, author, player_id, body) VALUES ($1,$2,$3,$4)', ['lobby', owner.name, owner.id, 'Mensagem do teste da fundação.'])
  const chat = await j1.get('/api/arcade?view=chat&channel=lobby')
  const mine = chat.json.messages.find((m) => m.pid === owner.id)
  assert(mine && mine.role === 'player', `role do owner no chat: ${mine?.role}`)
  assert(!chat.text.includes('"owner"'), 'chat contém "owner"')
  const prof = await j1.get(`/api/arcade?view=profile&pid=${owner.id}`)
  assert(prof.status === 200 && prof.json.role === 'player' && prof.json.border !== 'dealer', `perfil do owner: ${prof.text.slice(0, 200)}`)
  assert(!prof.text.includes('owner'), 'perfil público contém "owner"')
  const anfProf = await j1.get(`/api/arcade?view=profile&pid=${anf.id}`)
  assert(anfProf.json.role === 'anfitriao', 'anfitrião pode ser público')
  const dash = await j1.get('/api/arcade?view=dashboard')
  assert(dash.status === 200 && !dash.text.includes('"owner"'), 'dashboard/ranking contém "owner"')
  const bets = await j1.get('/api/arcade?view=bets')
  assert(!bets.text.includes('"owner"'), 'apostas contém "owner"')
})

await test('Deadly Vote tutorial vencido desbloqueia; Owner sem nome público como anfitrião do caso', async () => {
  const v = await owner.post('/api/record', { action: 'create', title: `Tutorial ${sfx}`, startsAt: Date.now() + 3600_000, tutorial: true })
  assert(v.status === 200, `owner cria tutorial: ${v.text}`)
  const dt = await dealer.post('/api/record', { action: 'create', title: `Tutorial falso ${sfx}`, startsAt: Date.now(), tutorial: true })
  assert(dt.status === 403, `dealer criando tutorial: ${dt.status}`)
  const tid = v.json.id
  for (const s of [j1, j2]) assert((await s.post('/api/record', { action: 'join', voteId: tid })).status === 200, 'inscrição')
  const rec = await j1.get('/api/record')
  const vote = rec.json.votes.find((x) => x.id === tid)
  assert(vote && vote.host === null, `host do owner deveria ser null, veio ${vote?.host}`)
  assert(!rec.text.includes(owner.name), 'Record público contém o nome do owner como anfitrião')
  const blocked = await dealer.post('/api/record', { action: 'status', voteId: tid, status: 'concluido' })
  assert(blocked.status === 403, `dealer mexendo no voto do owner: ${blocked.status}`)
  await owner.post('/api/record', { action: 'status', voteId: tid, status: 'em-progresso' })
  await owner.post('/api/record', { action: 'outcome', voteId: tid, playerId: j1.id, outcome: 'sobreviveu' })
  await owner.post('/api/record', { action: 'outcome', voteId: tid, playerId: j2.id, outcome: 'eliminado' })
  const before = await j1.get('/api/eu')
  assert(before.json.desbloqueios.poco === false, 'só desbloqueia ao concluir')
  const st = await owner.post('/api/record', { action: 'status', voteId: tid, status: 'concluido' })
  assert(st.status === 200, `concluir: ${st.text}`)
  const after = await j1.get('/api/eu')
  assert(after.json.desbloqueios.poco && after.json.desbloqueios.salao_mascaras && after.json.desbloqueios.torres, `flags de j1: ${JSON.stringify(after.json.desbloqueios)}`)
  const loser = await j2.get('/api/eu')
  assert(loser.json.desbloqueios.poco === false, 'eliminado continua trancado')
})

await test('override de flag e karma pelo Owner (linha do destino sem número)', async () => {
  const f = await owner.post('/api/staff', { action: 'desbloqueio.definir', playerId: j2.id, flag: 'corporacoes', on: true })
  assert(f.status === 200, `override: ${f.text}`)
  const bad = await anf.post('/api/staff', { action: 'desbloqueio.definir', playerId: j2.id, flag: 'poco', on: true })
  assert(bad.status === 403, 'anfitrião sem override')
  const k = await owner.post('/api/staff', { action: 'karma.ajustar', playerId: j2.id, delta: -30, motivo: 'teste' })
  assert(k.status === 200 && k.json.karma === -30, `karma: ${k.text}`)
  const eu = await j2.get('/api/eu')
  assert(eu.json.desbloqueios.corporacoes === true, 'corporações liberado')
  assert(eu.json.destino.direcao === 'caos' && eu.json.destino.intensidade === 2, `destino: ${JSON.stringify(eu.json.destino)}`)
})

await test('cargos: Anfitrião promove Jogador a Dealer sob si, não promove a Anfitrião', async () => {
  const r = await anf.post('/api/staff', { action: 'cargo.definir', playerId: j2.id, cargo: 'anfitriao' })
  assert(r.status === 403, `anfitrião criando anfitrião: ${r.status}`)
  const ok = await anf.post('/api/staff', { action: 'cargo.definir', playerId: j2.id, cargo: 'dealer' })
  assert(ok.status === 200 && ok.json.supervisorId === anf.id, `promover: ${ok.text}`)
  const back = await anf.post('/api/staff', { action: 'cargo.definir', playerId: j2.id, cargo: 'player' })
  assert(back.status === 200, `rebaixar o próprio dealer: ${back.text}`)
  const [log] = await q("SELECT count(*)::int AS n FROM admin_log WHERE action = 'cargo.alterado' AND target_id = $1", [j2.id])
  assert(log.n === 2, 'mudanças de cargo no log')
})

await db.end()
console.log(`\nFundação: ${passed} ok, ${failures.length} falha(s)${failures.length ? ': ' + failures.join(' | ') : ''}`)
process.exit(failures.length ? 1 : 0)
