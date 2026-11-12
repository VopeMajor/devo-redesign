// Teste de servidor da Sala de Jogos (arcade). Roda no CI depois das capturas, contra o Postgres do workflow e o
// servidor em http://localhost:3000 → arcade-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/arcade-test.mjs
// Cobre: inscrição em evento (sem 500; duas ao mesmo tempo entram; lista cheia recusa), partida casual curta não rende
// Tempo nem pontos, partida casual longa rende +3 min e pontos, Blefe sem seed e sem a mão adversária, Memory Rush
// conta dois pares seguidos e ignora símbolo fora da fase, aposta em confronto decidido recusada e aposta cobrada uma
// vez, fechamento do evento termina a sala abandonada (45 s) e acerta o confronto e as apostas uma vez, melhor placar
// da semana ignora o treino.
// O servidor não tranca a API da Sala de Jogos: o que a revela é `arcadeUnlocked` no save (lib/devo/progresso-server.ts),
// e o save das contas de teste já vem com ele.
import pg from 'pg'

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
  arcade(action, extra = {}) {
    return this.post('/api/arcade', { action, ...extra })
  }
  view(name) {
    return this.get(`/api/arcade?view=${name}`)
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
  const [p] = await q('SELECT id, name FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  s.name = p.name
  return s
}

/* ------------------------------------------------------------- Memory Rush: mesmo baralho do servidor (lib/devo/arcade/games.ts) */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle(list, r) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
const MEMORY_PHASES = [10, 8, 6, 4]
const MEMORY_SYMBOLS = 13
function memoryDeck(seed, phase) {
  const r = rng(seed + phase * 7919)
  const pool = shuffle(
    Array.from({ length: MEMORY_SYMBOLS }, (_, i) => i),
    r,
  ).slice(0, MEMORY_PHASES[phase])
  return shuffle([...pool, ...pool], r).map((sym, i) => ({ id: phase * 100 + i, sym }))
}

/* ------------------------------------------------------------- utilidades de banco */
const MIN = 60_000
const sfx = Date.now().toString(36)
const SFX = sfx.toUpperCase()
const now = Date.now()
const timer = async (id) => Number((await q("SELECT (data->>'timerEndsAt')::bigint AS t FROM player_saves WHERE player_id = $1", [id]))[0]?.t ?? 0)
const pendente = async (id) => Number((await q('SELECT time_pending_ms AS v FROM arcade_profiles WHERE player_id = $1', [id]))[0]?.v ?? 0)
/** Tempo total do jogador: o que já está no save + o que está no livro-caixa da Sala de Jogos esperando entrega. */
const tempoTotal = async (id) => (await timer(id)) + (await pendente(id))
const sala = async (id) => (await q('SELECT * FROM arcade_rooms WHERE id = $1', [id]))[0]
const save = (horas = 50) => ({
  v: 1,
  welcomed: true,
  timerEndsAt: now + horas * 3600_000,
  inventory: [],
  notifications: [],
  threads: [],
  tradesCompleted: 0,
  arcadeUnlocked: true,
})

/** Evento criado direto no banco; os tempos são em segundos a partir de agora (negativo = passado). */
async function criarEvento({ game = 'memory-rush', opens, closes, starts, ends, max = 8, locked = false, reward = { score: 50 } }) {
  const [e] = await q(
    `INSERT INTO arcade_events (game_id, label, registration_opens_at, registration_closes_at, starts_at, ends_at, max_players, reward, locked_at)
     VALUES ($1, $2, now() + ($3::int * interval '1 second'), now() + ($4::int * interval '1 second'),
             now() + ($5::int * interval '1 second'), now() + ($6::int * interval '1 second'), $7, $8::jsonb, CASE WHEN $9::boolean THEN now() END)
     RETURNING id`,
    [game, `arcade-test ${sfx}`, opens, closes, starts, ends, max, JSON.stringify(reward), locked],
  )
  return e.id
}
const cancelarEvento = (id) => q('UPDATE arcade_events SET cancelled = true WHERE id = $1', [id]).catch(() => {})

/** Junta dois jogadores numa sala casual pela fila (o primeiro fica no lado "a"). */
async function parear(a, b, gameId) {
  // salas de espera esquecidas por outros testes/capturas não podem roubar o par
  await q("UPDATE arcade_rooms SET status = 'cancelled' WHERE status = 'waiting' AND mode = 'casual' AND game_id = $1", [gameId])
  const ra = await a.arcade('queue', { gameId })
  assert(ra.status === 200 && ra.json?.status === 'waiting' && ra.json.side === 'a', `fila de ${a.name}: ${ra.status} ${ra.text.slice(0, 300)}`)
  const rb = await b.arcade('queue', { gameId })
  assert(rb.status === 200 && rb.json?.status === 'active' && rb.json.side === 'b' && rb.json.id === ra.json.id, `fila de ${b.name}: ${rb.status} ${rb.text.slice(0, 300)}`)
  return { roomId: ra.json.id, viewA: ra.json, viewB: rb.json }
}
/** Recua o início da partida (pula a contagem regressiva e simula partida em andamento há `seg` segundos). */
const iniciadaHa = (roomId, seg) => q("UPDATE arcade_rooms SET started_at = now() - ($2::int * interval '1 second') WHERE id = $1", [roomId, seg])

/* ------------------------------------------------------------- contas */
// P e Q disputam um confronto de evento com apostas: conta de teste (is_test) não aceita aposta, então elas nascem
// comuns e viram conta de teste no fim (para não aparecerem em rankings depois).
const CONTAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'p', 'q', 'x', 'y', 't']
await q(
  `INSERT INTO invite_codes (code, role, note, is_test)
   SELECT c, 'player', 'arcade-test', NOT (c LIKE '%-P' OR c LIKE '%-Q') FROM unnest($1::text[]) AS c
   ON CONFLICT (code) DO NOTHING`,
  [CONTAS.map((k) => `DEVO-AT-${SFX}-${k.toUpperCase()}`)],
)
const S = {}
await test('cadastro das contas de teste (save com a Sala de Jogos revelada)', async () => {
  for (const k of CONTAS) {
    S[k] = await signUp(`Arc${sfx}${k}`, `DEVO-AT-${SFX}-${k.toUpperCase()}`)
    const r = await S[k].post('/api/save', save())
    assert(r.status === 200, `save de ${k}: ${r.status}`)
  }
  const [{ n }] = await q("SELECT count(*)::int AS n FROM player_saves WHERE player_id = ANY($1) AND (data->>'arcadeUnlocked')::boolean", [CONTAS.map((k) => S[k].id)])
  assert(n === CONTAS.length, `todas com arcadeUnlocked (veio ${n})`)
  const d = await S.a.view('dashboard')
  assert(d.status === 200 && d.json?.me?.id === S.a.id, `dashboard: ${d.status} ${d.text.slice(0, 200)}`)
})
if (CONTAS.some((k) => !S[k])) {
  console.log('\nsem contas, abortando')
  await db.end()
  process.exit(1)
}
const { a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, p: P, q: Q, x: X, y: Y, t: T } = S

/* ------------------------------------------------------------- Inscrição */
await test('inscrição em evento: duas ao mesmo tempo entram (sem 500); com a lista cheia a terceira é recusada', async () => {
  const ev = await criarEvento({ opens: -3600, closes: 3600, starts: 7200, ends: 10800, max: 2 })
  try {
    const [x, y] = await Promise.all([X.arcade('register', { eventId: ev }), Y.arcade('register', { eventId: ev })])
    assert(x.status === 200 && x.json?.ok === true, `inscrição de X: ${x.status} ${x.text.slice(0, 200)}`)
    assert(y.status === 200 && y.json?.ok === true, `inscrição de Y: ${y.status} ${y.text.slice(0, 200)}`)
    const rows = await q('SELECT player_id FROM arcade_entries WHERE event_id = $1', [ev])
    assert(rows.length === 2 && rows.some((r) => r.player_id === X.id) && rows.some((r) => r.player_id === Y.id), `2 inscritos (veio ${rows.length})`)
    const t = await T.arcade('register', { eventId: ev })
    assert(t.status === 400 && /cheia/i.test(t.json?.error ?? ''), `lista cheia deveria ser 400 (veio ${t.status} ${t.text.slice(0, 200)})`)
    const [{ n }] = await q('SELECT count(*)::int AS n FROM arcade_entries WHERE event_id = $1', [ev])
    assert(n === 2, `continua com 2 inscritos (veio ${n})`)
    const v = await X.get(`/api/arcade?view=event&id=${ev}`)
    assert(v.status === 200 && v.json?.event?.joined === true && v.json.event.entries === 2, `visão do evento: ${v.status} ${v.text.slice(0, 200)}`)
  } finally {
    await cancelarEvento(ev)
  }
})

/* ------------------------------------------------------------- Partidas casuais */
await test('casual curta (desistência com 5 s de jogo): vencedor sem Tempo e com 0 ponto de ranking', async () => {
  const { roomId } = await parear(A, B, 'memory-rush')
  await iniciadaHa(roomId, 5) // Memory Rush: minDurationSec = 15
  const b0 = await tempoTotal(B.id)
  const r = await A.arcade('room', { roomId, act: { type: 'resign' } })
  assert(r.status === 200 && r.json?.status === 'finished', `desistência: ${r.status} ${r.text.slice(0, 300)}`)
  assert(r.json.finish && r.json.finish.result === 'loss', `quem desistiu perdeu (${JSON.stringify(r.json.finish)})`)
  const room = await sala(roomId)
  assert(room.status === 'finished' && room.result?.winner === 'b', `sala: ${room.status} ${JSON.stringify(room.result?.winner)}`)
  assert(room.result.b.timeGainMin === 0 && room.result.b.awarded === 0, `vencedor da curta: ${JSON.stringify(room.result.b)}`)
  const [m] = await q("SELECT result, points FROM arcade_matches WHERE player_id = $1 AND mode = 'casual' ORDER BY finished_at DESC LIMIT 1", [B.id])
  assert(m && m.result === 'win' && m.points === 0, `partida do vencedor no histórico com 0 ponto (${JSON.stringify(m)})`)
  const [w] = await q('SELECT coalesce(sum(score), 0)::int AS score, coalesce(sum(wins), 0)::int AS wins FROM arcade_week_scores WHERE player_id = $1', [B.id])
  assert(w.score === 0 && w.wins === 0, `semana do vencedor sem pontos nem vitória (${JSON.stringify(w)})`)
  const vb = await B.arcade('room', { roomId })
  assert(vb.status === 200 && vb.json?.finish?.timeGainMin === 0 && vb.json.finish.awarded === 0, `fim visto pelo vencedor: ${vb.text.slice(0, 300)}`)
  assert((await tempoTotal(B.id)) === b0, `Tempo do vencedor intacto (delta ${((await tempoTotal(B.id)) - b0) / MIN} min)`)
})

await test('casual longa terminada por desistência: vencedor ganha +3 min de Tempo (uma vez) e pontos', async () => {
  const { roomId } = await parear(C, D, 'memory-rush')
  await iniciadaHa(roomId, 30) // > 15 s (minDurationSec) e < 120 s (fim do Memory Rush)
  const d0 = await tempoTotal(D.id)
  const p0 = await pendente(D.id)
  const c0 = await tempoTotal(C.id)
  const r = await C.arcade('room', { roomId, act: { type: 'resign' } })
  assert(r.status === 200 && r.json?.status === 'finished', `desistência: ${r.status} ${r.text.slice(0, 300)}`)
  const room = await sala(roomId)
  assert(room.result?.winner === 'b' && room.result.reason === 'desistência', `sala: ${JSON.stringify({ w: room.result?.winner, r: room.result?.reason })}`)
  assert(room.result.b.timeGainMin === 3 && room.result.b.awarded > 0, `vencedor: ${JSON.stringify(room.result.b)}`)
  assert(room.result.a.timeGainMin === 0, `perdedor sem Tempo: ${JSON.stringify(room.result.a)}`)
  assert((await pendente(D.id)) - p0 === 3 * MIN, `+3 min no livro-caixa do vencedor (veio ${((await pendente(D.id)) - p0) / MIN})`)
  const vd = await D.arcade('room', { roomId })
  assert(vd.status === 200 && vd.json?.finish?.timeGainMin === 3 && vd.json.finish.awarded > 0, `fim visto pelo vencedor: ${vd.text.slice(0, 300)}`)
  assert(vd.json.finish.timeDeltaMs === p0 + 3 * MIN, `+3 min entregues ao save na resposta (veio ${vd.json.finish.timeDeltaMs})`)
  // consultas repetidas não pagam de novo
  await Promise.all([D.arcade('room', { roomId }), D.view('dashboard'), D.view('bets')])
  assert((await tempoTotal(D.id)) - d0 === 3 * MIN, `vencedor recebeu 3 min uma vez (veio ${((await tempoTotal(D.id)) - d0) / MIN})`)
  assert((await tempoTotal(C.id)) === c0, 'perdedor não ganhou Tempo')
  const [m] = await q("SELECT result, points FROM arcade_matches WHERE player_id = $1 AND mode = 'casual' ORDER BY finished_at DESC LIMIT 1", [D.id])
  assert(m && m.result === 'win' && m.points === room.result.b.awarded && m.points > 0, `pontos no histórico (${JSON.stringify(m)})`)
  const [w] = await q('SELECT coalesce(sum(score), 0)::int AS score, coalesce(sum(wins), 0)::int AS wins FROM arcade_week_scores WHERE player_id = $1', [D.id])
  assert(w.score === m.points && w.wins === 1, `semana do vencedor (${JSON.stringify(w)})`)
})

/* ------------------------------------------------------------- Blefe */
await test('Blefe: a sala enviada a cada jogador tem seed 0 e não contém a mão adversária', async () => {
  const { roomId, viewB } = await parear(E, F, 'bluff')
  try {
    const room = await sala(roomId)
    const hands = room.state?.hands
    assert(hands && hands.a?.length === 26 && hands.b?.length === 26, 'o servidor guarda as duas mãos')
    const checar = (v, lado, quem) => {
      assert(v.seed === 0, `${quem}: seed deveria ser 0 (veio ${v.seed})`)
      assert(v.side === lado, `${quem}: lado ${v.side}`)
      assert(v.state && !('hands' in v.state) && !('pile' in v.state), `${quem}: estado bruto vazou (${Object.keys(v.state ?? {}).join(',')})`)
      assert(!JSON.stringify(v).includes('"hands"'), `${quem}: "hands" na resposta`)
      const meus = (v.state.me ?? []).map((c) => c.id).sort((x, y) => x - y)
      const esperado = hands[lado].map((c) => c.id).sort((x, y) => x - y)
      assert(JSON.stringify(meus) === JSON.stringify(esperado), `${quem}: a própria mão confere com o servidor`)
      const adv = new Set(hands[lado === 'a' ? 'b' : 'a'].map((c) => c.id))
      assert(!meus.some((id) => adv.has(id)), `${quem}: carta adversária na resposta`)
      assert(v.state.oppN === 26, `${quem}: só a contagem da mão adversária (veio ${v.state.oppN})`)
      assert(!v.state.last || !('cards' in v.state.last), `${quem}: cartas da última jogada vazaram`)
    }
    checar(viewB, 'b', 'F ao entrar')
    const ve = await E.arcade('room', { roomId })
    assert(ve.status === 200, `consulta de E: ${ve.status} ${ve.text.slice(0, 200)}`)
    checar(ve.json, 'a', 'E na consulta')
    await iniciadaHa(roomId, 3)
    const vf = await F.arcade('room', { roomId })
    assert(vf.status === 200, `consulta de F: ${vf.status}`)
    checar(vf.json, 'b', 'F em jogo')
  } finally {
    await E.arcade('leave', { roomId })
  }
})

/* ------------------------------------------------------------- Memory Rush */
await test('Memory Rush: dois pares seguidos (< 220 ms) contam os dois; símbolo fora da fase é ignorado', async () => {
  const { roomId } = await parear(G, H, 'memory-rush')
  try {
    await iniciadaHa(roomId, 20)
    const { seed } = await sala(roomId)
    const deck0 = [...new Set(memoryDeck(seed, 0).map((c) => c.sym))]
    assert(deck0.length === MEMORY_PHASES[0], `fase 0 com ${MEMORY_PHASES[0]} símbolos (veio ${deck0.length})`)
    const [s1, s2] = deck0
    const t0 = Date.now()
    const r1 = await G.arcade('room', { roomId, act: { type: 'pair', phase: 0, sym: s1 } })
    const r2 = await G.arcade('room', { roomId, act: { type: 'pair', phase: 0, sym: s2 } })
    const dt = Date.now() - t0
    assert(r1.status === 200 && r2.status === 200, `pares: ${r1.status}/${r2.status} ${r2.text.slice(0, 200)}`)
    let st = (await sala(roomId)).state
    assert(st.pairs.a === 2 && st.claimed[`0:${s1}`] === 'a' && st.claimed[`0:${s2}`] === 'a', `os dois pares contam (em ${dt} ms): ${JSON.stringify({ pairs: st.pairs, claimed: st.claimed })}`)
    assert(st.score.a === 250, `placar 100 + 150 de combo (veio ${st.score.a})`)
    // símbolo que não está no tabuleiro da fase 0
    const fora = Array.from({ length: MEMORY_SYMBOLS }, (_, i) => i).find((s) => !deck0.includes(s))
    const r3 = await G.arcade('room', { roomId, act: { type: 'pair', phase: 0, sym: fora } })
    assert(r3.status === 200, `par fora da fase: ${r3.status}`)
    // fase errada (o tabuleiro ainda está na fase 0)
    const deck1 = [...new Set(memoryDeck(seed, 1).map((c) => c.sym))]
    const r4 = await G.arcade('room', { roomId, act: { type: 'pair', phase: 1, sym: deck1[0] } })
    assert(r4.status === 200, `par de outra fase: ${r4.status}`)
    // par já tomado pelo outro jogador
    const r5 = await H.arcade('room', { roomId, act: { type: 'pair', phase: 0, sym: s1 } })
    assert(r5.status === 200, `par repetido: ${r5.status}`)
    st = (await sala(roomId)).state
    assert(st.pairs.a === 2 && st.pairs.b === 0 && st.score.a === 250 && st.score.b === 0, `nada mudou com os pares inválidos: ${JSON.stringify({ pairs: st.pairs, score: st.score })}`)
    assert(st.phase === 0 && !(`0:${fora}` in st.claimed) && !(`1:${deck1[0]}` in st.claimed), `claimed sem os inválidos: ${JSON.stringify(st.claimed)}`)
    assert(Object.keys(st.claimed).length === 2, `2 pares tomados (veio ${Object.keys(st.claimed).length})`)
  } finally {
    await G.arcade('leave', { roomId })
  }
})

/* ------------------------------------------------------------- Apostas */
await test('apostas: confronto já decidido recusa; aposta cobrada uma vez (repetida e simultânea)', async () => {
  const ev = await criarEvento({ opens: -7200, closes: -3600, starts: -600, ends: 7200, locked: true })
  try {
    const [d1] = await q('INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating) VALUES ($1, 1, $2, $3, 1000, 1000) RETURNING id', [ev, `Ana${sfx}`, `Bia${sfx}`])
    const [d2] = await q(
      'INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating, winner_name, resolved_at) VALUES ($1, 2, $2, $3, 1000, 1000, $2, now()) RETURNING id',
      [ev, `Cid${sfx}`, `Duda${sfx}`],
    )
    const x0 = await tempoTotal(X.id)
    const ok = await X.arcade('bet', { duelId: d1.id, pick: `Ana${sfx}`, amount: 10 })
    assert(ok.status === 200 && ok.json?.ok === true && ok.json.timeDeltaMs === -10 * MIN, `aposta: ${ok.status} ${ok.text.slice(0, 200)}`)
    assert(x0 - (await tempoTotal(X.id)) === 10 * MIN, `cobrou 10 min (veio ${(x0 - (await tempoTotal(X.id))) / MIN})`)
    const de = await X.arcade('bet', { duelId: d1.id, pick: `Bia${sfx}`, amount: 10 })
    assert(de.status === 400, `segunda aposta no mesmo confronto deveria ser 400 (veio ${de.status})`)
    assert(x0 - (await tempoTotal(X.id)) === 10 * MIN, 'a segunda aposta recusada não cobrou')
    const y0 = await tempoTotal(Y.id)
    const [u, v] = await Promise.all([
      Y.arcade('bet', { duelId: d1.id, pick: `Bia${sfx}`, amount: 15 }),
      Y.arcade('bet', { duelId: d1.id, pick: `Bia${sfx}`, amount: 15 }),
    ])
    assert([u, v].filter((z) => z.status === 200).length === 1, `uma aposta simultânea só (${u.status}/${v.status})`)
    assert(y0 - (await tempoTotal(Y.id)) === 15 * MIN, `cobrou 15 min uma vez (veio ${(y0 - (await tempoTotal(Y.id))) / MIN})`)
    const [{ n }] = await q('SELECT count(*)::int AS n FROM arcade_bets WHERE duel_id = $1', [d1.id])
    assert(n === 2, `2 apostas no confronto (veio ${n})`)
    const x1 = await tempoTotal(X.id)
    const fim = await X.arcade('bet', { duelId: d2.id, pick: `Cid${sfx}`, amount: 10 })
    assert(fim.status === 400 && /terminou/.test(fim.json?.error ?? ''), `confronto decidido deveria ser 400 (veio ${fim.status} ${fim.text.slice(0, 200)})`)
    assert((await tempoTotal(X.id)) === x1, 'aposta recusada não cobrou')
    const [{ m }] = await q('SELECT count(*)::int AS m FROM arcade_bets WHERE duel_id = $1', [d2.id])
    assert(m === 0, 'nenhuma aposta gravada no confronto decidido')
  } finally {
    await cancelarEvento(ev)
  }
})

/* ------------------------------------------------------------- Fechamento do evento */
await test('fechamento do evento: sala abandonada (> 45 s) termina, confronto e apostas acertados uma vez', async () => {
  const ev = await criarEvento({ game: 'chess', opens: -7200, closes: -3600, starts: -600, ends: 3600, locked: true, reward: { score: 50 } })
  try {
    await q('INSERT INTO arcade_entries (event_id, name, player_id, rating) VALUES ($1, $2, $3, 1000), ($1, $4, $5, 1000)', [ev, P.name, P.id, Q.name, Q.id])
    const [duel] = await q('INSERT INTO arcade_duels (event_id, slot, a_name, b_name, a_rating, b_rating) VALUES ($1, 1, $2, $3, 1000, 1000) RETURNING id', [ev, P.name, Q.name])
    const bx = await X.arcade('bet', { duelId: duel.id, pick: P.name, amount: 20 })
    const by = await Y.arcade('bet', { duelId: duel.id, pick: Q.name, amount: 20 })
    assert(bx.status === 200 && by.status === 200, `apostas: ${bx.status} ${bx.text.slice(0, 150)} / ${by.status} ${by.text.slice(0, 150)}`)
    const jp = await P.arcade('duel', { eventId: ev })
    assert(jp.status === 200 && jp.json?.status === 'waiting', `P entra: ${jp.status} ${jp.text.slice(0, 200)}`)
    const jq = await Q.arcade('duel', { eventId: ev })
    assert(jq.status === 200 && jq.json?.status === 'active' && jq.json.id === jp.json.id, `Q entra: ${jq.status} ${jq.text.slice(0, 200)}`)
    const roomId = jp.json.id
    const x0 = await tempoTotal(X.id)
    const y0 = await tempoTotal(Y.id)

    // evento encerrado, mas os dois vistos há 30 s: ainda não é abandono (janela de 45 s)
    await q("UPDATE arcade_events SET ends_at = now() - interval '1 minute' WHERE id = $1", [ev])
    await q(
      "UPDATE arcade_rooms SET started_at = now() - interval '2 minutes', a_seen = now() - interval '30 seconds', b_seen = now() - interval '30 seconds' WHERE id = $1",
      [roomId],
    )
    const g1 = await Y.view('bets')
    assert(g1.status === 200, `bets: ${g1.status} ${g1.text.slice(0, 200)}`)
    let room = await sala(roomId)
    assert(room.status === 'active', `30 s sem consulta ainda não encerra a sala (veio ${room.status})`)
    const [e1] = await q('SELECT resolved_at FROM arcade_events WHERE id = $1', [ev])
    assert(!e1.resolved_at, 'evento continua aberto enquanto a sala está em jogo')

    // agora os dois sumiram há 60 s
    await q("UPDATE arcade_rooms SET a_seen = now() - interval '60 seconds', b_seen = now() - interval '60 seconds' WHERE id = $1", [roomId])
    const gs = await Promise.all([X.view('bets'), Y.view('dashboard'), P.view('dashboard')])
    assert(gs.every((g) => g.status === 200), `consultas: ${gs.map((g) => g.status).join('/')}`)
    room = await sala(roomId)
    assert(room.status === 'finished' && room.result?.reason === 'abandono', `sala encerrada por abandono (veio ${room.status} ${room.result?.reason})`)
    const [d] = await q('SELECT winner_name FROM arcade_duels WHERE id = $1', [duel.id])
    assert(d.winner_name === P.name || d.winner_name === Q.name, `confronto decidido (veio ${d.winner_name})`)
    const esperado = room.result.winner === 'a' ? room.a_name : room.b_name
    assert(d.winner_name === esperado, `vencedor do confronto = vencedor da sala (${d.winner_name} × ${esperado})`)
    const [e2] = await q('SELECT resolved_at FROM arcade_events WHERE id = $1', [ev])
    assert(e2.resolved_at, 'evento resolvido')
    const bets = await q('SELECT player_id, pick_name, amount, odds, status, payout, floor(amount * odds)::int AS esperado FROM arcade_bets WHERE duel_id = $1', [duel.id])
    assert(bets.length === 2, `2 apostas (veio ${bets.length})`)
    for (const b of bets) {
      if (b.pick_name === d.winner_name) {
        assert(b.status === 'won' && b.payout === b.esperado && b.payout > 0, `aposta vencedora: ${JSON.stringify(b)}`)
      } else {
        assert(b.status === 'lost' && b.payout === 0, `aposta perdedora: ${JSON.stringify(b)}`)
      }
    }
    // mais consultas (inclusive simultâneas) não pagam de novo
    await Promise.all([X.view('bets'), Y.view('bets'), X.view('dashboard'), Y.view('dashboard')])
    const ganhador = bets.find((b) => b.status === 'won')
    const delta = { [X.id]: (await tempoTotal(X.id)) - x0, [Y.id]: (await tempoTotal(Y.id)) - y0 }
    assert(delta[ganhador.player_id] === ganhador.payout * MIN, `prêmio pago uma vez (${delta[ganhador.player_id] / MIN} min × ${ganhador.payout})`)
    const perdedor = bets.find((b) => b.status === 'lost')
    assert(delta[perdedor.player_id] === 0, `quem perdeu a aposta não recebe (${delta[perdedor.player_id] / MIN} min)`)
    const [{ n }] = await q("SELECT count(*)::int AS n FROM arcade_matches WHERE duel_id = $1 AND mode = 'evento'", [duel.id])
    assert(n === 2, `uma partida registrada por lado (veio ${n})`)
  } finally {
    await cancelarEvento(ev)
  }
})

/* ------------------------------------------------------------- Melhor placar da semana */
await test('melhor placar da semana no painel ignora o treino', async () => {
  const st = await T.arcade('tutorial', { gameId: 'memory-rush' })
  assert(st.status === 200 && st.json?.matchId && st.json.mode === 'treino', `treino: ${st.status} ${st.text.slice(0, 200)}`)
  const fin = await T.arcade('finish', { matchId: st.json.matchId, result: 'win', score: 999999 })
  assert(fin.status === 200 && fin.json?.ok === true, `fim do treino: ${fin.status} ${fin.text.slice(0, 200)}`)
  const [m] = await q('SELECT mode, score FROM arcade_matches WHERE id = $1', [st.json.matchId])
  assert(m.mode === 'treino' && m.score === 6000, `treino gravado com o teto (${JSON.stringify(m)})`)
  let d = await T.view('dashboard')
  assert(d.status === 200, `dashboard: ${d.status}`)
  assert(!d.json.me.best['memory-rush'], `treino não vira melhor placar (veio ${d.json.me.best['memory-rush']})`)
  assert(d.json.rankings['memory-rush'].bestWeek === 0, `nem melhor semana (veio ${d.json.rankings['memory-rush'].bestWeek})`)
  await q(
    `INSERT INTO arcade_matches (player_id, game_id, mode, opponent_name, opponent_rating, seed, started_at, finished_at, result, score, stats, points)
     VALUES ($1, 'memory-rush', 'casual', 'Rival', 1000, 1, now() - interval '2 minutes', now(), 'win', 120, '{}'::jsonb, 64)`,
    [T.id],
  )
  d = await T.view('dashboard')
  assert(d.json.me.best['memory-rush'] === 120, `melhor placar = a partida casual (veio ${d.json.me.best['memory-rush']})`)
  assert(d.json.rankings['memory-rush'].bestWeek === 64, `melhor semana = pontos da casual (veio ${d.json.rankings['memory-rush'].bestWeek})`)
})

/* ------------------------------------------------------------- fim */
await q('UPDATE players SET is_test = true WHERE id = ANY($1)', [[P.id, Q.id]]).catch(() => {})
await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => `- ${f}`).join('\n'))
  process.exit(1)
}
