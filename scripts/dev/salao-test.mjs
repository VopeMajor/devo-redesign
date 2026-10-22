// Teste de servidor do Salão das Máscaras (regras críticas). Roda no CI depois das capturas, contra o Postgres do
// workflow e o servidor em http://localhost:3000 → salao-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/salao-test.mjs
// Cobre: trava (Deadly Vote tutorial), raridade mínima, carta não duplica (sai do save, /api/save não a devolve,
// mesmo uid não entra duas vezes), lance fora da abertura recusado, lance inválido/negativo recusado, saldo do pulso
// nunca negativo (reserva), lance superado devolvido uma vez, dois lances simultâneos → um só, vendedor recebe uma
// vez (liquidação idempotente), arremate entregue uma vez, recusa do especialista devolve carta e taxa, Mercado.
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
  salao(action, extra = {}) {
    return this.post('/api/salao', { action, ...extra })
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
const cfgKey = 'salao.calendario'
const getCal = async () => (await q('SELECT value FROM devo_config WHERE key = $1', [cfgKey]))[0]?.value
const originalCal = await getCal()
const setForcar = async (forcar) => q('UPDATE devo_config SET value = $2 WHERE key = $1', [cfgKey, JSON.stringify({ ...originalCal, forcar })])
const edicaoAtual = async () => {
  const [r] = await q(
    `SELECT floor(extract(epoch FROM now() - (value->>'ancora')::timestamptz) / ((value->>'intervalo_dias')::numeric * 86400))::int AS n
       FROM devo_config WHERE key = $1`,
    [cfgKey],
  )
  return r.n
}
const timer = async (id) => Number((await q("SELECT (data->>'timerEndsAt')::bigint AS t FROM player_saves WHERE player_id = $1", [id]))[0]?.t ?? 0)
const inventario = async (id) => (await q("SELECT data->'inventory' AS i FROM player_saves WHERE player_id = $1", [id]))[0]?.i ?? []
const pendente = async (id) => Number((await q('SELECT time_pending_ms AS v FROM arcade_profiles WHERE player_id = $1', [id]))[0]?.v ?? 0)
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
async function liberar(s) {
  await q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'salao_mascaras', 'owner') ON CONFLICT DO NOTHING", [s.id])
}

await test('migração do Salão é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'salao-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM devo_config WHERE key LIKE 'salao.%'")
  assert(n === 4, `4 configurações do Salão (veio ${n})`)
})

await q(
  `INSERT INTO invite_codes (code, role, note, is_test) VALUES
     ($1, 'player', 'salao-test', true), ($2, 'player', 'salao-test', true), ($3, 'player', 'salao-test', true),
     ($4, 'player', 'salao-test', true), ($5, 'owner', 'salao-test', true)
   ON CONFLICT (code) DO NOTHING`,
  ['A', 'B', 'C', 'D', 'O'].map((k) => `DEVO-ST-${SFX}-${k}`),
)

let A, B, C, D, O
await test('cadastro das contas de teste', async () => {
  A = await signUp(`Sal${sfx}a`, `DEVO-ST-${SFX}-A`)
  B = await signUp(`Sal${sfx}b`, `DEVO-ST-${SFX}-B`)
  C = await signUp(`Sal${sfx}c`, `DEVO-ST-${SFX}-C`)
  D = await signUp(`Sal${sfx}d`, `DEVO-ST-${SFX}-D`)
  O = await signUp(`Sal${sfx}o`, `DEVO-ST-${SFX}-O`)
  for (const [s, cards, h] of [
    [A, [['a-rara', 'xadrez_bispo'], ['a-comum', 'escudo'], ['a-lend', 'xadrez_rainha'], ['a-inc', 'xadrez_peao']], 50],
    [B, [], 50],
    [C, [], 50],
    [D, [], 0.6],
  ]) {
    const r = await s.post('/api/save', save(cards, h))
    assert(r.status === 200, `save: ${r.status}`)
  }
})

if (!A || !O) {
  console.log('\nsem contas, abortando')
  process.exit(1)
}

/* ------------------------------------------------------------- Trava */
await test('trancado sem vencer o tutorial (GET sem erro; POST 403); Owner vê liberado', async () => {
  const r = await A.get('/api/salao')
  assert(r.status === 200 && r.json.liberado === false && /Deadly Vote/.test(r.json.motivo), `GET trancado: ${r.text}`)
  const p = await A.salao('bandeja.enviar', { uid: 'a-rara' })
  assert(p.status === 403, `POST trancado deveria ser 403 (veio ${p.status})`)
  const o = await O.get('/api/salao')
  assert(o.json.liberado === true && o.json.owner && o.json.owner.provisorio === true, 'Owner vê o Salão liberado e a configuração provisória')
  const j = await A.get('/api/salao?view=avaliacao')
  assert(j.status === 403, 'jogador não vê a fila do especialista')
})
for (const s of [A, B, C, D]) await liberar(s)
await setForcar('fechado')

/* ------------------------------------------------------------- Bandeja */
let lote
await test('raridade mínima: carta comum recusada e continua no inventário', async () => {
  const r = await A.salao('bandeja.enviar', { uid: 'a-comum' })
  assert(r.status === 400 && /raridade/i.test(r.json?.error ?? ''), `comum deveria ser 400 (veio ${r.status} ${r.text})`)
  const inv = await inventario(A.id)
  assert(inv.some((c) => c.uid === 'a-comum'), 'a carta comum continua no save')
})

await test('Ultra Rara na ordem: mínimo "ultra_rara" recusa a Rara (rara < ultra_rara < lendaria) com o rótulo novo', async () => {
  const [b] = await q("SELECT value FROM devo_config WHERE key = 'salao.bandeja'")
  try {
    await q("UPDATE devo_config SET value = $1 WHERE key = 'salao.bandeja'", [JSON.stringify({ ...b.value, raridade_minima: 'ultra_rara' })])
    const r = await A.salao('bandeja.enviar', { uid: 'a-rara' })
    assert(r.status === 400 && /Ultra Rara/.test(r.json?.error ?? ''), `rara abaixo da Ultra Rara deveria ser 400 com "Ultra Rara" (veio ${r.status} ${r.text})`)
    const inv = await inventario(A.id)
    assert(inv.some((c) => c.uid === 'a-rara'), 'a carta rara continua no save')
    const g = await A.get('/api/salao')
    assert(g.status === 200, `GET com mínimo Ultra Rara: ${g.status}`)
  } finally {
    await q("UPDATE devo_config SET value = $1 WHERE key = 'salao.bandeja'", [JSON.stringify(b.value)])
  }
})

await test('migração das raridades das cartas: idempotente; o banco aceita ultra_rara/unica/promocional e recusa o resto', async () => {
  const sql = readFileSync(join(here, '..', 'cartas-raridade-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  for (const t of ['salao_lotes', 'salao_mercado']) {
    const [c] = await q("SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = $1", [`${t}_card_rarity_chk`])
    assert(c && /ultra_rara/.test(c.d) && /unica/.test(c.d) && /promocional/.test(c.d), `${t}: constraint com as 7 raridades (veio ${c?.d})`)
  }
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    let erro = null
    try {
      await client.query("UPDATE salao_lotes SET card_rarity = 'ultra-rara' WHERE id = (SELECT id FROM salao_lotes LIMIT 1)")
      const [{ n }] = (await client.query('SELECT count(*)::int AS n FROM salao_lotes')).rows
      if (n === 0) erro = 'sem linhas (nada a testar)'
    } catch (e) {
      erro = String(e.message)
    }
    assert(erro && /card_rarity_chk|sem linhas/.test(erro), `raridade desconhecida deveria violar a constraint (veio ${erro})`)
  } finally {
    await client.query('ROLLBACK').catch(() => {})
    client.release()
  }
})

await test('enviar à Bandeja: carta sai do save, taxa de divulgação paga, lote em avaliação', async () => {
  const t0 = await timer(A.id)
  const r = await A.salao('bandeja.enviar', { uid: 'a-rara', lanceMinimo: 30 })
  assert(r.status === 200 && r.json.loteId && r.json.uid === 'a-rara', `enviar: ${r.status} ${r.text}`)
  lote = r.json.loteId
  const inv = await inventario(A.id)
  assert(!inv.some((c) => c.uid === 'a-rara'), 'a carta saiu do save')
  const t1 = await timer(A.id)
  assert(t0 - t1 === 20 * MIN && r.json.timeDeltaMs === -20 * MIN, `divulgação de 20 min (veio ${(t0 - t1) / MIN})`)
  const [l] = await q('SELECT status, card_id FROM salao_lotes WHERE id = $1', [lote])
  assert(l.status === 'avaliacao' && l.card_id === 'xadrez_bispo', 'lote em avaliação')
})

await test('carta não duplica: save antigo não a devolve e o mesmo uid não entra de novo', async () => {
  const velho = save([['a-rara', 'xadrez_bispo'], ['a-comum', 'escudo'], ['a-lend', 'xadrez_rainha'], ['a-inc', 'xadrez_peao']])
  velho.timerEndsAt = await timer(A.id)
  const r = await A.post('/api/save', velho)
  assert(r.status === 200, 'save aceito')
  const inv = await inventario(A.id)
  assert(!inv.some((c) => c.uid === 'a-rara'), 'o /api/save descartou o uid entregue ao Salão')
  assert(inv.some((c) => c.uid === 'a-lend'), 'as outras cartas continuam')
  const de = await A.salao('bandeja.enviar', { uid: 'a-rara' })
  assert(de.status === 404 || de.status === 409, `mesmo uid de novo deveria falhar (veio ${de.status})`)
  const merc = await A.salao('mercado.vender', { uid: 'a-rara', preco: 10 })
  assert(merc.status === 404 || merc.status === 409, `nem no Mercado (veio ${merc.status})`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM salao_lotes WHERE seller_id = $1 AND card_uid = $2', [A.id, 'a-rara'])
  assert(n === 1, 'um lote só para a carta')
})

await test('especialista: jogador não decide; equipe aprova para a próxima edição', async () => {
  const j = await A.salao('avaliacao.lote', { loteId: lote, decisao: 'aprovar' })
  assert(j.status === 403, `jogador não aprova (veio ${j.status})`)
  const fila = await O.get('/api/salao?view=avaliacao')
  assert(fila.status === 200 && fila.json.lotes.some((l) => l.id === lote), 'lote na fila do especialista')
  const r = await O.salao('avaliacao.lote', { loteId: lote, decisao: 'aprovar', nota: 'Peça autêntica.' })
  assert(r.status === 200 && r.json.status === 'aprovado', `aprovar: ${r.text}`)
  const n = await edicaoAtual()
  assert(r.json.edicao >= n + 1, `entra numa edição futura (${r.json.edicao} ≥ ${n + 1})`)
  const de = await O.salao('avaliacao.lote', { loteId: lote, decisao: 'recusar' })
  assert(de.status === 409, 'não decide duas vezes')
})

await test('recusa do especialista devolve a carta (entrega) e a taxa (uma vez)', async () => {
  const r = await A.salao('bandeja.enviar', { uid: 'a-inc' })
  assert(r.status === 200, `enviar incomum: ${r.text}`)
  const p0 = await pendente(A.id)
  const x = await O.salao('avaliacao.lote', { loteId: r.json.loteId, decisao: 'recusar', nota: 'Falsificada.' })
  assert(x.status === 200, `recusar: ${x.text}`)
  assert((await pendente(A.id)) - p0 === 20 * MIN, 'taxa devolvida pelo livro-caixa')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM card_deliveries WHERE player_id = $1 AND idem_key = $2', [A.id, `salao:lote:${r.json.loteId}:devolucao`])
  assert(n === 1, 'carta devolvida uma vez')
})

/* ------------------------------------------------------------- Lances */
await test('lance fora da abertura é recusado (Salão fechado)', async () => {
  const r = await B.salao('lance', { loteId: lote, valor: 30 })
  assert(r.status === 409 && /abertura/.test(r.json?.error ?? ''), `fechado: ${r.status} ${r.text}`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM salao_lances WHERE lote_id = $1', [lote])
  assert(n === 0, 'nenhum lance gravado')
})

await setForcar('aberto')
await test('lote de outra edição não aceita lance mesmo com o Salão aberto', async () => {
  const r = await B.salao('lance', { loteId: lote, valor: 30 })
  assert(r.status === 409, `edição futura: ${r.status}`)
})
const n0 = await edicaoAtual()
await q('UPDATE salao_lotes SET edicao = $2 WHERE id = $1', [lote, n0])

await test('lances inválidos: negativo, fracionado, abaixo do mínimo, no próprio lote', async () => {
  for (const valor of [-10, 0, 12.5, 'abc']) {
    const r = await B.salao('lance', { loteId: lote, valor })
    assert(r.status === 400, `valor ${valor} deveria ser 400 (veio ${r.status})`)
  }
  const baixo = await B.salao('lance', { loteId: lote, valor: 29 })
  assert(baixo.status === 409, 'abaixo do lance mínimo')
  const meu = await A.salao('lance', { loteId: lote, valor: 60 })
  assert(meu.status === 403, 'vendedor não dá lance no próprio lote')
})

await test('saldo não fica negativo: lance maior que o pulso (com reserva) é recusado e nada muda', async () => {
  const t0 = await timer(D.id)
  const r = await D.salao('lance', { loteId: lote, valor: 30 })
  assert(r.status === 409 && /Tempo insuficiente/.test(r.json?.error ?? ''), `D sem Tempo: ${r.status} ${r.text}`)
  assert((await timer(D.id)) === t0, 'pulso de D intacto')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM salao_movimentos WHERE player_id = $1', [D.id])
  assert(n === 0, 'nenhum movimento registrado para D')
})

await test('lance debita na hora; lance superado é devolvido uma vez; dois lances simultâneos → um só', async () => {
  const b0 = await timer(B.id)
  const r = await B.salao('lance', { loteId: lote, valor: 30 })
  assert(r.status === 200 && r.json.timeDeltaMs === -30 * MIN, `B: ${r.text}`)
  assert(b0 - (await timer(B.id)) === 30 * MIN, 'B pagou 30 min')
  const pB = await pendente(B.id)
  const c0 = await timer(C.id)
  // C e (de novo) C em paralelo com o mesmo valor: só um pode valer (lote travado + um lance ativo por lote).
  const [x, y] = await Promise.all([C.salao('lance', { loteId: lote, valor: 40 }), C.salao('lance', { loteId: lote, valor: 40 })])
  const oks = [x, y].filter((z) => z.status === 200).length
  assert(oks === 1, `um só lance de 40 vale (vieram ${x.status}/${y.status})`)
  assert(c0 - (await timer(C.id)) === 40 * MIN, 'C pagou uma vez só')
  assert((await pendente(B.id)) - pB === 30 * MIN, 'B recebeu os 30 min de volta (livro-caixa)')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM salao_movimentos WHERE player_id = $1 AND motivo = 'salao.lance.devolvido'", [B.id])
  assert(n === 1, 'devolução registrada uma vez')
  const [{ ativos }] = await q("SELECT count(*)::int AS ativos FROM salao_lances WHERE lote_id = $1 AND status = 'ativo'", [lote])
  assert(ativos === 1, 'um único lance ativo')
})

/* ------------------------------------------------------------- Liquidação */
await setForcar('fechado')
await test('fim da edição: vencedor recebe a carta e o vendedor a parte menos a comissão — uma vez', async () => {
  const a0 = await timer(A.id)
  const p0 = await pendente(A.id)
  const g1 = await A.get('/api/salao')
  assert(g1.status === 200, `GET: ${g1.text}`)
  await Promise.all([B.get('/api/salao'), C.get('/api/salao'), O.get('/api/salao'), A.get('/api/salao')])
  const [l] = await q('SELECT status, vencedor_id, valor_final, repasse FROM salao_lotes WHERE id = $1', [lote])
  assert(l.status === 'vendido' && l.vencedor_id === C.id && l.valor_final === 40, `lote: ${JSON.stringify(l)}`)
  assert(l.repasse === 34, `repasse 40 − 15% = 34 (veio ${l.repasse})`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM salao_movimentos WHERE idem_key = $1', [`salao:lote:${lote}:repasse`])
  assert(n === 1, 'repasse registrado uma vez')
  const ganho = (await timer(A.id)) - a0 + ((await pendente(A.id)) - p0)
  assert(ganho === 34 * MIN, `vendedor recebeu 34 min uma vez (veio ${ganho / MIN})`)
  const [{ c }] = await q('SELECT count(*)::int AS c FROM card_deliveries WHERE player_id = $1 AND card_id = $2 AND idem_key = $3', [C.id, 'xadrez_bispo', `salao:lote:${lote}:arremate`])
  assert(c === 1, 'arremate entregue uma vez ao vencedor')
  const res = await C.post('/api/eu', { action: 'cartas.resgatar' })
  assert(res.json?.cartas?.some((x) => x.cardId === 'xadrez_bispo'), 'vencedor resgata a carta')
})

/* ------------------------------------------------------------- Mercado */
await test('Mercado: compra só na abertura; vendedor recebe uma vez; carta não vende duas vezes', async () => {
  const v = await A.salao('mercado.vender', { uid: 'a-lend', preco: 50 })
  assert(v.status === 200 && v.json.uid === 'a-lend', `vender: ${v.text}`)
  assert(!(await inventario(A.id)).some((c) => c.uid === 'a-lend'), 'carta saiu do save')
  const fechado = await B.salao('mercado.comprar', { ofertaId: v.json.ofertaId })
  assert(fechado.status === 409, 'fechado: não compra')
  await setForcar('aberto')
  const [x, y] = await Promise.all([B.salao('mercado.comprar', { ofertaId: v.json.ofertaId }), C.salao('mercado.comprar', { ofertaId: v.json.ofertaId })])
  assert([x, y].filter((z) => z.status === 200).length === 1, `uma compra só (${x.status}/${y.status})`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM salao_movimentos WHERE idem_key = $1', [`salao:oferta:${v.json.ofertaId}:repasse`])
  assert(n === 1, 'vendedor recebe uma vez')
  const [{ d }] = await q("SELECT count(*)::int AS d FROM card_deliveries WHERE idem_key LIKE $1", [`salao:oferta:${v.json.ofertaId}:%`])
  assert(d === 1, 'uma entrega da carta')
})

await setForcar(originalCal?.forcar ?? null).catch(() => {})
await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => `- ${f}`).join('\n'))
  process.exit(1)
}
