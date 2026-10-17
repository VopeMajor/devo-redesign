// Teste de servidor da Narrativa (motor de diálogo): progresso salvo, trava por flag, efeitos UMA vez só
// (recarregar/repetir não devolve Tempo nem repete flag/contato), primeira escolha vale, concorrência.
// Roda no CI depois das capturas, contra o Postgres do workflow e o servidor em http://localhost:3000.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/narrativa-test.mjs
// Usa os convites DEVO-NARR-0003/0004 de scripts/dev/91-seed-narrativa.sql (contas de teste).
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


const MIN = 60_000
const timer = async (id) => Number((await q("SELECT (data->>'timerEndsAt')::bigint AS t FROM player_saves WHERE player_id = $1", [id]))[0]?.t ?? 0)

await test('migração é idempotente (roda de novo sem erro)', async () => {
  const sql = readFileSync(join(here, '..', 'narrativa-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
})

const sfx = Date.now().toString(36).slice(-5)
const j = await signUp(`Narr${sfx}`, 'DEVO-NARR-0003')
const j2 = await signUp(`Narx${sfx}`, 'DEVO-NARR-0004')
const T0 = Date.now() + 10 * 3600_000
await j.post('/api/save', { v: 1, welcomed: true, timerEndsAt: T0, inventory: [], notifications: [], threads: [], tradesCompleted: 0 })

await test('cena trancada sem a flag (403), cena e escolha inexistentes recusadas', async () => {
  const r = await j.get('/api/dialogo?cena=galo-casa')
  assert(r.status === 403, `sem galo_casa deveria ser 403, veio ${r.status}`)
  const x = await j.get('/api/dialogo?cena=nao-existe')
  assert(x.status === 404, `cena inexistente: ${x.status}`)
  const e = await j.post('/api/dialogo', { action: 'escolher', cena: 'melissa-corporacoes', escolha: 'nao-existe', opcao: 0 })
  assert(e.status === 400, `escolha inexistente: ${e.status}`)
  const o = await j.post('/api/dialogo', { action: 'escolher', cena: 'melissa-corporacoes', escolha: 'entrar', opcao: 9 })
  assert(o.status === 400, `opção inexistente: ${o.status}`)
})

await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'galo_casa', 'sistema') ON CONFLICT DO NOTHING", [j.id])

await test('progresso: guarda o passo e retoma de onde parou', async () => {
  const a = await j.get('/api/dialogo?cena=galo-casa')
  assert(a.status === 200 && a.json.progresso.passo === 0 && a.json.progresso.fim === false, `inicial: ${a.text}`)
  assert(a.json.tempos['lembra:2'] > 0, `tempo do Galo resolvido: ${JSON.stringify(a.json.tempos)}`)
  const p = await j.post('/api/dialogo', { action: 'passo', cena: 'galo-casa', passo: 17 })
  assert(p.status === 200, `salvar passo: ${p.text}`)
  const b = await j.get('/api/dialogo?cena=galo-casa')
  assert(b.json.progresso.passo === 17, `retomar no 17, veio ${b.json.progresso.passo}`)
  const bad = await j.post('/api/dialogo', { action: 'passo', cena: 'galo-casa', passo: 9999 })
  assert(bad.status === 400, 'passo fora da cena')
})

await test('Galo "Galo...?" transfere Tempo UMA vez (repetir/recarregar não repete)', async () => {
  const cfg = Number((await q("SELECT value FROM devo_config WHERE key = 'narrativa.galo_casa.tempo_min'"))[0].value)
  const r1 = await j.post('/api/dialogo', { action: 'escolher', cena: 'galo-casa', escolha: 'lembra', opcao: 2 })
  assert(r1.status === 200 && r1.json.opcao === 2, `escolher: ${r1.text}`)
  assert(r1.json.timeDeltaMs === cfg * MIN, `delta ${r1.json.timeDeltaMs} != ${cfg} min`)
  assert(r1.json.aplicados.length === 1 && r1.json.aplicados[0].minutos === cfg, `aplicados: ${JSON.stringify(r1.json.aplicados)}`)
  const r2 = await j.post('/api/dialogo', { action: 'escolher', cena: 'galo-casa', escolha: 'lembra', opcao: 2 })
  assert(r2.status === 200 && r2.json.timeDeltaMs === 0 && r2.json.aplicados.length === 0, `repetido aplicou de novo: ${r2.text}`)
  const r3 = await j.post('/api/dialogo', { action: 'escolher', cena: 'galo-casa', escolha: 'lembra', opcao: 0 })
  assert(r3.json.opcao === 2 && r3.json.timeDeltaMs === 0, `primeira escolha vale: ${r3.text}`)
  assert((await timer(j.id)) === T0 + cfg * MIN, `relógio salvo: ${(await timer(j.id)) - T0} ms a mais`)
  const est = await j.get('/api/dialogo?cena=galo-casa')
  assert(JSON.stringify(est.json.progresso.escolhas.lembra) === '[2]', `escolhas: ${JSON.stringify(est.json.progresso.escolhas)}`)
})

await test('efeito de contato e conclusão valem uma vez', async () => {
  const c1 = await j.post('/api/dialogo', { action: 'efeito', cena: 'galo-casa', efeito: 'contato-galo' })
  assert(c1.status === 200 && c1.json.contatos[0] === 'galo' && c1.json.aplicados.length === 1, `contato: ${c1.text}`)
  const c2 = await j.post('/api/dialogo', { action: 'efeito', cena: 'galo-casa', efeito: 'contato-galo' })
  assert(c2.json.aplicados.length === 0, 'contato aplicado duas vezes')
  const f1 = await j.post('/api/dialogo', { action: 'concluir', cena: 'galo-casa' })
  assert(f1.status === 200, `concluir: ${f1.text}`)
  const f2 = await j.post('/api/dialogo', { action: 'concluir', cena: 'galo-casa' })
  assert(f2.status === 200 && f2.json.aplicados.length === 0, 'concluir duas vezes')
  const r = await j.get('/api/dialogo')
  assert(r.json.cenas['galo-casa']?.fim === true, `resumo: ${r.text}`)
  const p = await j.post('/api/dialogo', { action: 'passo', cena: 'galo-casa', passo: 3 })
  assert(p.status === 200, 'passo depois de concluir')
  const e = await j.get('/api/dialogo?cena=galo-casa')
  assert(e.json.progresso.fim === true && e.json.progresso.passo > 3, 'cena concluída não volta atrás')
})

await test('Melissa: a opção da Necro-Corporação tira Tempo uma vez; concluir libera Corporações uma vez', async () => {
  const before = await timer(j.id)
  const cfg = Number((await q("SELECT value FROM devo_config WHERE key = 'narrativa.melissa_corporacoes.multa_min'"))[0].value)
  assert(cfg === -90, `multa da Necro-Corporação deveria ser 1h30 (−90), veio ${cfg}`)
  const rs = await Promise.all([1, 2, 3, 4, 5].map(() => j.post('/api/dialogo', { action: 'escolher', cena: 'melissa-corporacoes', escolha: 'entrar', opcao: 1 })))
  assert(rs.every((r) => r.status === 200), `concorrência: ${rs.map((r) => r.status)}`)
  const soma = rs.reduce((a, r) => a + r.json.timeDeltaMs, 0)
  assert(soma === cfg * MIN, `cinco pedidos simultâneos somaram ${soma} ms (esperado ${cfg * MIN})`)
  assert((await timer(j.id)) === before + cfg * MIN, 'relógio salvo depois da multa')
  const f = await j.post('/api/dialogo', { action: 'concluir', cena: 'melissa-corporacoes' })
  assert(f.json.aplicados.some((e) => e.tipo === 'flag' && e.flag === 'corporacoes'), `flag: ${f.text}`)
  await j.post('/api/dialogo', { action: 'concluir', cena: 'melissa-corporacoes' })
  const [u] = await q("SELECT source FROM player_unlocks WHERE player_id = $1 AND flag = 'corporacoes'", [j.id])
  assert(u?.source === 'narrativa', 'corporações liberado pela narrativa')
  const eu = await j.get('/api/eu')
  assert(eu.json.desbloqueios.corporacoes === true, 'corporações no /api/eu')
})

await test('config do Owner muda o Tempo; outro jogador sem a flag não abre a reflexão das Torres', async () => {
  await q("UPDATE devo_config SET value = '15'::jsonb WHERE key = 'narrativa.galo_casa.tempo_min'")
  try {
    await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'galo_casa', 'sistema') ON CONFLICT DO NOTHING", [j2.id])
    const r = await j2.post('/api/dialogo', { action: 'escolher', cena: 'galo-casa', escolha: 'lembra', opcao: 2 })
    assert(r.json.aplicados[0]?.minutos === 15, `config: ${r.text}`)
  } finally {
    await q("UPDATE devo_config SET value = '60'::jsonb WHERE key = 'narrativa.galo_casa.tempo_min'")
  }
  const t = await j2.get('/api/dialogo?cena=reflexao-anfitriao')
  assert(t.status === 403, `reflexão sem torres: ${t.status}`)
})

await test('banco: evento repetido é barrado pela chave primária', async () => {
  const n = (await q("SELECT count(*)::int AS n FROM dialog_events WHERE player_id = $1 AND scene_id = 'galo-casa' AND key = 'e:lembra'", [j.id]))[0].n
  assert(n === 1, `eventos de "lembra": ${n}`)
  let falhou = false
  try {
    await q("INSERT INTO dialog_events (player_id, scene_id, key) VALUES ($1, 'galo-casa', 'e:lembra')", [j.id])
  } catch {
    falhou = true
  }
  assert(falhou, 'inserir evento repetido deveria falhar')
})


await test('Melissa: Necro-Corporação vai para o histórico (admin_log) e tira karma uma vez', async () => {
  const h = await q("SELECT ref, data FROM admin_log WHERE target_id = $1 AND action = 'dialogo.tempo' ORDER BY at", [j.id])
  const multa = h.filter((r) => r.ref === 'melissa-corporacoes:e:entrar')
  assert(multa.length === 1 && multa[0].data.minutos === -90 && multa[0].data.motivo === 'penalidade', `histórico da multa: ${JSON.stringify(h)}`)
  const galo = h.filter((r) => r.ref === 'galo-casa:e:lembra')
  assert(galo.length === 1 && galo[0].data.minutos > 0, `histórico do Tempo do Galo: ${JSON.stringify(h)}`)
  const k = await q("SELECT delta FROM karma_log WHERE player_id = $1 AND ref = 'melissa-corporacoes:e:entrar'", [j.id])
  assert(k.length === 1 && Number(k[0].delta) === -2, `karma da Necro-Corporação: ${JSON.stringify(k)}`)
})

await test('Melissa: "Salão das Máscaras?" e "E se eu quiser criar uma?" exploráveis (uma vez cada); "Entendi." registra e segue', async () => {
  for (const o of [0, 0, 1, 2]) {
    const r = await j.post('/api/dialogo', { action: 'escolher', cena: 'melissa-corporacoes', escolha: 'salao', opcao: o })
    assert(r.status === 200 && r.json.opcao === o, `explorar ${o}: ${r.text}`)
  }
  const ev = await q("SELECT key FROM dialog_events WHERE player_id = $1 AND scene_id = 'melissa-corporacoes' AND key LIKE 'e:salao%' ORDER BY key", [j.id])
  assert(JSON.stringify(ev.map((e) => e.key)) === JSON.stringify(['e:salao:0', 'e:salao:1', 'e:salao:2']), `eventos: ${JSON.stringify(ev)}`)
  const est = await j.get('/api/dialogo?cena=melissa-corporacoes')
  assert(JSON.stringify(est.json.progresso.escolhas.salao) === '[0,1,2]', `escolhas: ${JSON.stringify(est.json.progresso.escolhas)}`)
})

await test('Galo: "Agradeço." dá karma +1 uma vez só', async () => {
  const antes = Number((await q('SELECT karma FROM players WHERE id = $1', [j.id]))[0].karma)
  for (let i = 0; i < 3; i++) await j.post('/api/dialogo', { action: 'escolher', cena: 'galo-casa', escolha: 'contato', opcao: 0 })
  const depois = Number((await q('SELECT karma FROM players WHERE id = $1', [j.id]))[0].karma)
  assert(depois - antes === 1, `karma ${antes} → ${depois}`)
})

const dracmas = async (id) => Number((await q("SELECT coalesce(sum(quantity), 0)::int AS n FROM player_items WHERE player_id = $1 AND item_key = 'dracma_incomum'", [id]))[0].n)

const p1 = await signUp(`Npoc${sfx}`, 'DEVO-NARR-0005')
const p2 = await signUp(`Npoz${sfx}`, 'DEVO-NARR-0006')

await test('Poço: encontro exige a flag do Poço (403 sem ela)', async () => {
  const r = await p1.get('/api/dialogo?cena=poco-encontro')
  assert(r.status === 403, `sem poco: ${r.status}`)
})
for (const p of [p1, p2]) await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'poco', 'sistema') ON CONFLICT DO NOTHING", [p.id])

await test('Poço: o encapuzado dá 1 Dracma Incomum uma vez (motor e servidor do Poço com a mesma chave)', async () => {
  const st = await p1.get('/api/dialogo?cena=poco-encontro')
  assert(st.status === 200, `estado: ${st.text}`)
  const rs = await Promise.all([1, 2, 3].map(() => p1.post('/api/dialogo', { action: 'efeito', cena: 'poco-encontro', efeito: 'dracma' })))
  assert(rs.every((r) => r.status === 200), `efeito: ${rs.map((r) => r.status)}`)
  assert(rs.filter((r) => r.json.aplicados.length === 1).length === 1, `aplicado mais de uma vez: ${rs.map((r) => r.text)}`)
  assert((await dracmas(p1.id)) === 1, `saldo depois do motor: ${await dracmas(p1.id)}`)
  const ap = await p1.post('/api/poco', { action: 'apresentacao.concluir' })
  assert(ap.status === 200, `apresentacao.concluir: ${ap.text}`)
  assert((await dracmas(p1.id)) === 1, `servidor do Poço deu outra moeda: ${await dracmas(p1.id)}`)
  // ordem inversa: o servidor do Poço primeiro, depois o motor
  const ap2 = await p2.post('/api/poco', { action: 'apresentacao.concluir' })
  assert(ap2.status === 200, `apresentacao.concluir (2): ${ap2.text}`)
  const e2 = await p2.post('/api/dialogo', { action: 'efeito', cena: 'poco-encontro', efeito: 'dracma' })
  assert(e2.status === 200, `efeito (2): ${e2.text}`)
  assert((await dracmas(p2.id)) === 1, `motor deu outra moeda: ${await dracmas(p2.id)}`)
})

await test('Poço: "Sim, por favor." registra e "Obrigado/Obrigada." dá karma +1 uma vez', async () => {
  const s1 = await p1.post('/api/dialogo', { action: 'escolher', cena: 'poco-encontro', escolha: 'oferta', opcao: 1 })
  assert(s1.status === 200 && s1.json.opcao === 1, `oferta: ${s1.text}`)
  const k0 = Number((await q('SELECT karma FROM players WHERE id = $1', [p1.id]))[0].karma)
  await p1.post('/api/dialogo', { action: 'escolher', cena: 'poco-encontro', escolha: 'agradece', opcao: 0 })
  await p1.post('/api/dialogo', { action: 'escolher', cena: 'poco-encontro', escolha: 'agradece', opcao: 0 })
  const k1 = Number((await q('SELECT karma FROM players WHERE id = $1', [p1.id]))[0].karma)
  assert(k1 - k0 === 1, `karma ${k0} → ${k1}`)
  const f = await p1.post('/api/dialogo', { action: 'concluir', cena: 'poco-encontro' })
  assert(f.status === 200, `concluir: ${f.text}`)
  const r = await p1.get('/api/dialogo')
  assert(r.json.cenas['poco-encontro']?.fim === true, `resumo: ${r.text}`)
})

await db.end()
console.log(`\nNarrativa: ${passed} ok, ${failures.length} falha(s)${failures.length ? ': ' + failures.join(' | ') : ''}`)
process.exit(failures.length ? 1 : 0)
