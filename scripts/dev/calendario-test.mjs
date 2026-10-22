// Teste de servidor do Calendário (regras críticas). Roda no CI depois das capturas, contra o Postgres do workflow e
// o servidor em http://localhost:3000 → calendario-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/calendario-test.mjs
// Cobre: migração idempotente; liberado desde o início (desbloqueio.livres); um check-in por dia (repetido e
// simultâneo → um só); o ciclo de 7 dias anda só com o resgate e entrega cada recompensa no inventário certo (P.P. na
// Virtude do Arcano ou na padrão, Fragmentos, Tempo pelo livro-caixa, Dracmas, Carta Incomum por card_deliveries);
// falta pausa (padrão) ou reinicia (config); check-ins de evento (lista própria, um por dia, acaba a lista → 409);
// permissões da Mesa (Jogador nada; Anfitrião eventos sem check-in; Owner tudo) e admin_log.
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
  cal(action, extra = {}) {
    return this.post('/api/calendario', { action, ...extra })
  }
  checkin(extra = {}) {
    return this.cal('checkin', extra)
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

const sfx = Date.now().toString(36)
const SFX = sfx.toUpperCase()
const MIN = 60_000
const now = Date.now()
const save = (horas = 40) => ({ v: 1, welcomed: true, timerEndsAt: now + horas * 3600_000, inventory: [], notifications: [], threads: [], tradesCompleted: 0, arcadeUnlocked: true })
const saldo = async (id, item) => Number((await q('SELECT quantity FROM player_items WHERE player_id = $1 AND item_key = $2', [id, item]))[0]?.quantity ?? 0)
const pp = async (id) => Object.fromEntries((await q('SELECT virtude, pp::float AS pp FROM virtude_pp WHERE player_id = $1', [id])).map((r) => [r.virtude, r.pp]))
const timer = async (id) => Number((await q("SELECT (data->>'timerEndsAt')::bigint AS t FROM player_saves WHERE player_id = $1", [id]))[0]?.t ?? 0)
/** "Volta no tempo": todos os check-ins do jogador ficam `n` dias mais antigos (o servidor usa o relógio do banco). */
// Em dois passos (longe e de volta): mover dias vizinhos num UPDATE só esbarraria na PK (player_id, dia, tipo).
const desloca = async (id, n, tipo = null) => {
  await q('UPDATE calendario_checkins SET dia = dia - 20000 WHERE player_id = $1 AND ($2::text IS NULL OR tipo = $2)', [id, tipo])
  await q('UPDATE calendario_checkins SET dia = dia + 20000 - $3::int WHERE player_id = $1 AND ($2::text IS NULL OR tipo = $2)', [id, tipo, n])
}
const ontem = (id, n = 1) => desloca(id, n)
const regras = (v) => q("UPDATE devo_config SET value = $1 WHERE key = 'calendario.checkin.regras'", [JSON.stringify(v)])
const REGRAS_PADRAO = { falta: 'pausa', pp_virtude: 'arcano', pp_virtude_padrao: 'paus' }
const DEV_EVENTO = async () => (await q("SELECT id FROM calendario_eventos WHERE slug = 'dev-noite-dos-arcanos'"))[0]?.id
const NATAL = async () => (await q("SELECT id FROM calendario_eventos WHERE slug = 'natal'"))[0]?.id

await test('migração do Calendário é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'calendario-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM devo_config WHERE key IN ('calendario.checkin.ciclo', 'calendario.checkin.regras', 'desbloqueio.livres')")
  assert(n === 3, `3 configurações (veio ${n})`)
  const [{ e }] = await q("SELECT count(*)::int AS e FROM calendario_eventos WHERE slug IN ('natal', 'halloween', 'festa-junina', 'carnaval-2027')")
  assert(e === 4, `4 datas comemorativas, sem duplicar (veio ${e})`)
})

await q(
  `INSERT INTO invite_codes (code, role, note, is_test) VALUES
     ($1, 'player', 'cal-test', true), ($2, 'player', 'cal-test', true), ($3, 'player', 'cal-test', true),
     ($4, 'anfitriao', 'cal-test', true), ($5, 'owner', 'cal-test', true)
   ON CONFLICT (code) DO NOTHING`,
  ['A', 'B', 'C', 'H', 'O'].map((k) => `DEVO-CAL-${SFX}-${k}`),
)

let A, B, C, H, O
await test('cadastro das contas de teste', async () => {
  A = await signUp(`Cal${sfx}a`, `DEVO-CAL-${SFX}-A`)
  B = await signUp(`Cal${sfx}b`, `DEVO-CAL-${SFX}-B`)
  C = await signUp(`Cal${sfx}c`, `DEVO-CAL-${SFX}-C`)
  H = await signUp(`Cal${sfx}h`, `DEVO-CAL-${SFX}-H`)
  O = await signUp(`Cal${sfx}o`, `DEVO-CAL-${SFX}-O`)
  for (const s of [A, B, C, H, O]) {
    const r = await s.post('/api/save', save())
    assert(r.status < 400, `save de ${s.name}: ${r.status} ${r.text.slice(0, 120)}`)
  }
})

await test('Calendário liberado desde o início para um Jogador novo (sem tutorial)', async () => {
  const r = await A.get('/api/calendario')
  assert(r.status === 200 && r.json?.liberado === true, `liberado: ${r.status} ${r.text.slice(0, 200)}`)
  assert(r.json.diario.posicao === 1 && r.json.diario.feitoHoje === false, 'começa no Dia 1, sem presença')
  assert(r.json.diario.slots.length === 7, '7 dias no ciclo')
  assert(r.json.diario.slots.map((s) => s.recompensa.rotulo).join(' | ') === '50 PP | 75 PP | +2 Fragmentos Arcanos | +2 Horas | +5 Dracmas Comuns | +2 Dracmas Incomuns | Carta Incomum', `rótulos do dono: ${r.json.diario.slots.map((s) => s.recompensa.rotulo).join(' | ')}`)
  assert(r.json.eventos.some((e) => e.titulo === 'Natal' && e.ocorrencia.endsWith('-12-25')), 'Natal (25/12) na lista')
  assert(r.json.extras.some((x) => x.evento === 'Noite dos Arcanos'), 'check-in extra do evento de hoje')
  assert(r.json.podeEditar === false, 'Jogador não edita')
  const eu = await A.get('/api/eu')
  assert(eu.json?.acesso?.sistemas?.calendario === true, '/api/eu: acesso.sistemas.calendario = true')
})

await test('Desbloqueio livre é configurável: tirar de desbloqueio.livres tranca o Calendário', async () => {
  await q("UPDATE devo_config SET value = '[]'::jsonb WHERE key = 'desbloqueio.livres'")
  try {
    const r = await C.get('/api/calendario')
    assert(r.status === 200 && r.json?.liberado === false, `trancado: ${r.text.slice(0, 160)}`)
    const c = await C.checkin()
    assert(c.status === 403, `check-in trancado → 403 (veio ${c.status})`)
    const own = await O.get('/api/calendario')
    assert(own.json?.liberado === true, 'Owner continua vendo')
  } finally {
    await q("UPDATE devo_config SET value = '[\"calendario\"]'::jsonb WHERE key = 'desbloqueio.livres'")
  }
})

await test('Dia 1: 50 PP na Virtude padrão (sem Arcano → Paus); a segunda vez no mesmo dia é recusada', async () => {
  const r = await A.checkin()
  assert(r.status === 200 && r.json?.ok, `check-in: ${r.status} ${r.text.slice(0, 200)}`)
  assert(r.json.posicao === 1 && r.json.recompensa.rotulo === '50 PP', `Dia 1 / 50 PP (veio ${r.json.posicao} ${r.json.recompensa.rotulo})`)
  assert(r.json.aplicado.virtude === 'paus' && r.json.aplicado.pp === 50, `P.P. em Paus: ${JSON.stringify(r.json.aplicado)}`)
  assert((await pp(A.id)).paus === 50, 'virtude_pp.paus = 50')
  const de = await A.checkin()
  assert(de.status === 409, `repetido → 409 (veio ${de.status})`)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM calendario_checkins WHERE player_id = $1 AND tipo = 'diario'", [A.id])
  assert(n === 1, `uma linha (veio ${n})`)
  const g = await A.get('/api/calendario')
  assert(g.json.diario.feitoHoje === true && g.json.diario.posicao === 1, 'estado: presença marcada no Dia 1')
  assert(g.json.diario.slots[0].estado === 'feito' && g.json.diario.slots[1].estado === 'proximo', 'Dia 1 carimbado, Dia 2 por vir')
})

await test('toque duplo / simultâneo: 6 resgates ao mesmo tempo → um só entregue', async () => {
  const rs = await Promise.all(Array.from({ length: 6 }, () => B.checkin()))
  const oks = rs.filter((r) => r.status === 200).length
  const conf = rs.filter((r) => r.status === 409).length
  assert(oks === 1 && conf === 5, `1 ok e 5 recusados (veio ${rs.map((r) => r.status).join(',')})`)
  assert((await pp(B.id)).paus === 50, `P.P. uma vez só (veio ${(await pp(B.id)).paus})`)
})

await test('o ciclo anda só com o resgate e cada dia entrega a recompensa certa no inventário', async () => {
  // Dia 2 (amanhã): 75 PP, mas o teto do Estágio I (100) só deixa entrar 50.
  await ontem(A.id)
  let r = await A.checkin()
  assert(r.status === 200 && r.json.posicao === 2 && r.json.recompensa.rotulo === '75 PP', `Dia 2: ${r.text.slice(0, 160)}`)
  assert(r.json.aplicado.pp === 50, `teto do Estágio: entram 50 (veio ${r.json.aplicado.pp})`)
  // Dia 3: +2 Fragmentos Arcanos
  await ontem(A.id)
  const f0 = await saldo(A.id, 'fragmento_arcano')
  r = await A.checkin()
  assert(r.json?.posicao === 3 && (await saldo(A.id, 'fragmento_arcano')) === f0 + 2, `Dia 3: fragmentos ${f0} → ${await saldo(A.id, 'fragmento_arcano')}`)
  // Dia 4: +2 Horas (livro-caixa → drainTime → relógio do save)
  await ontem(A.id)
  const t0 = await timer(A.id)
  r = await A.checkin()
  assert(r.json?.posicao === 4 && r.json.timeDeltaMs === 120 * MIN, `Dia 4: timeDeltaMs ${r.json?.timeDeltaMs}`)
  assert((await timer(A.id)) - t0 === 120 * MIN, `relógio do save +2h (veio ${((await timer(A.id)) - t0) / MIN} min)`)
  // Dia 5: +5 Dracmas Comuns · Dia 6: +2 Dracmas Incomuns
  await ontem(A.id)
  const c0 = await saldo(A.id, 'dracma_comum')
  r = await A.checkin()
  assert(r.json?.posicao === 5 && (await saldo(A.id, 'dracma_comum')) === c0 + 5, 'Dia 5: +5 Dracmas Comuns')
  await ontem(A.id)
  const i0 = await saldo(A.id, 'dracma_incomum')
  r = await A.checkin()
  assert(r.json?.posicao === 6 && (await saldo(A.id, 'dracma_incomum')) === i0 + 2, 'Dia 6: +2 Dracmas Incomuns')
  // Dia 7: Carta Incomum pela entrega de cartas (o cliente resgata por /api/eu)
  await ontem(A.id)
  r = await A.checkin()
  assert(r.json?.posicao === 7 && r.json.recompensa.rotulo === 'Carta Incomum', `Dia 7: ${r.text.slice(0, 160)}`)
  const cartas = await q("SELECT card_id, origin FROM card_deliveries WHERE player_id = $1 AND origin LIKE 'Calendário%'", [A.id])
  assert(cartas.length === 1 && ['xadrez_peao'].includes(cartas[0].card_id), `uma carta incomum (veio ${JSON.stringify(cartas)})`)
  assert(r.json.aplicado.cartaId === cartas[0].card_id, 'a revelação mostra a carta entregue')
  const res = await A.post('/api/eu', { action: 'cartas.resgatar' })
  assert(res.json?.cartas?.some((c) => c.cardId === cartas[0].card_id), 'resgate pelo /api/eu devolve a carta')
  // Depois do 7: volta ao Dia 1
  await ontem(A.id)
  const g = await A.get('/api/calendario')
  assert(g.json.diario.posicao === 1 && !g.json.diario.feitoHoje && g.json.diario.slots.every((s, i) => s.estado === (i === 0 ? 'hoje' : 'proximo')), 'novo ciclo começa no Dia 1')
  assert(g.json.diario.total === 7, `7 check-ins no total (veio ${g.json.diario.total})`)
})

await test('faltar dias PAUSA o ciclo (padrão): continua de onde parou', async () => {
  // B: Dia 1 hoje. Volta 4 dias (faltou 3): o próximo é o Dia 2.
  await ontem(B.id, 4)
  const g = await B.get('/api/calendario')
  assert(g.json.diario.posicao === 2 && g.json.diario.falta === 'pausa', `posição 2 depois de faltar (veio ${g.json.diario.posicao})`)
  const r = await B.checkin()
  assert(r.json?.posicao === 2, 'resgata o Dia 2')
})

await test('regra "reinicia" (config do Owner): faltar volta ao Dia 1', async () => {
  await regras({ ...REGRAS_PADRAO, falta: 'reinicia' })
  try {
    await ontem(B.id, 3)
    const g = await B.get('/api/calendario')
    assert(g.json.diario.posicao === 1 && g.json.diario.falta === 'reinicia', `reiniciou (veio ${g.json.diario.posicao})`)
    await ontem(B.id, -2) // agora o último foi ontem: sem falta, continua (Dia 3)
    const g2 = await B.get('/api/calendario')
    assert(g2.json.diario.posicao === 3, `sem falta continua (veio ${g2.json.diario.posicao})`)
  } finally {
    await regras(REGRAS_PADRAO)
  }
})

await test('P.P. vão para a Virtude Excelente do Arcano do jogador', async () => {
  const cfg = (await q("SELECT value FROM devo_config WHERE key = 'virtudes.afinidades'"))[0]?.value
  const ordem = cfg?.ordem?.imperatriz ?? JSON.parse(readFileSync(join(here, '..', '..', 'lib', 'devo', 'virtudes-afinidades.json'), 'utf8')).ordem.imperatriz
  const excelente = Object.keys(ordem).find((k) => ordem[k] === 1)
  await q("UPDATE players SET arcano = 'imperatriz' WHERE id = $1", [C.id])
  const r = await C.checkin()
  assert(r.status === 200 && r.json.aplicado.virtude === excelente, `Imperatriz → ${excelente} (veio ${JSON.stringify(r.json?.aplicado)})`)
  assert((await pp(C.id))[excelente] === 50, 'virtude_pp na Virtude do Arcano')
})

await test('check-in de evento: lista própria, um por dia, separado do diário; acabou a lista → 409', async () => {
  const ev = await DEV_EVENTO()
  assert(ev, 'evento de hoje do seed')
  const t0 = await timer(B.id)
  let r = await B.checkin({ tipo: 'evento', eventoId: ev })
  assert(r.status === 200 && r.json.tipo === 'evento' && r.json.posicao === 1 && r.json.timeDeltaMs === 30 * MIN, `1º resgate do evento: ${r.text.slice(0, 200)}`)
  assert((await timer(B.id)) - t0 === 30 * MIN, '+30 min no relógio')
  r = await B.checkin({ tipo: 'evento', eventoId: ev })
  assert(r.status === 409, `repetido no mesmo dia → 409 (veio ${r.status})`)
  const g = await B.get('/api/calendario')
  const x = g.json.extras.find((e) => e.eventoId === ev)
  assert(x?.feitoHoje && x.slots[0].estado === 'feito' && x.slots[1].estado === 'proximo', 'cartão extra: 1 carimbado, 2 por vir')
  // amanhã (o evento dura dois dias): 2º resgate = +1 Fragmento
  await desloca(B.id, 1, `evento:${ev}`)
  const f0 = await saldo(B.id, 'fragmento_arcano')
  r = await B.checkin({ tipo: 'evento', eventoId: ev })
  assert(r.status === 200 && r.json.posicao === 2 && (await saldo(B.id, 'fragmento_arcano')) === f0 + 1, `2º resgate: ${r.text.slice(0, 160)}`)
  await desloca(B.id, 1, `evento:${ev}`)
  r = await B.checkin({ tipo: 'evento', eventoId: ev })
  assert(r.status === 409 && /todas as recompensas/.test(r.json?.error ?? ''), `lista acabou → 409 (veio ${r.status} ${r.json?.error})`)
  const natal = await NATAL()
  r = await B.checkin({ tipo: 'evento', eventoId: natal })
  assert(r.status === 409, `evento que não é hoje → 409 (veio ${r.status})`)
  r = await B.checkin({ tipo: 'evento', eventoId: 'nao-e-uuid' })
  assert(r.status === 400, `id inválido → 400 (veio ${r.status})`)
})

let criado = null
await test('Mesa: Jogador não vê nem edita; Anfitrião cria/edita/remove eventos sem check-in; tudo no admin_log', async () => {
  let r = await A.get('/api/calendario?view=mesa')
  assert(r.status === 403, `Jogador na Mesa → 403 (veio ${r.status})`)
  r = await A.cal('evento.salvar', { titulo: 'Golpe', inicio: '2026-12-01' })
  assert(r.status === 403, `Jogador cria → 403 (veio ${r.status})`)

  r = await H.get('/api/calendario?view=mesa')
  assert(r.status === 200 && Array.isArray(r.json?.eventos) && r.json.podeRecompensas === false, `Anfitrião vê a Mesa: ${r.text.slice(0, 160)}`)
  r = await H.cal('evento.salvar', { titulo: `Vigília ${sfx}`, descricao: 'Teste do Anfitrião.', inicio: '2027-03-10', fim: '2027-03-11', enfase: 'atencao', anual: false })
  assert(r.status === 200 && r.json?.id, `Anfitrião cria: ${r.text.slice(0, 160)}`)
  criado = r.json.id
  r = await H.cal('evento.salvar', { id: criado, titulo: `Vigília ${sfx}`, descricao: 'Editado.', inicio: '2027-03-10', enfase: 'folga', checkin: { titulo: 'X', recompensas: [{ tipo: 'pp', quantidade: 999 }] } })
  assert(r.status === 403, `Anfitrião põe check-in → 403 (veio ${r.status} ${r.text.slice(0, 120)})`)
  r = await H.cal('evento.salvar', { id: criado, titulo: `Vigília ${sfx}`, descricao: 'Editado.', inicio: '2027-03-10', enfase: 'folga' })
  assert(r.status === 200, `Anfitrião edita: ${r.text.slice(0, 120)}`)
  const [e] = await q('SELECT descricao, enfase, fim::text FROM calendario_eventos WHERE id = $1', [criado])
  assert(e.descricao === 'Editado.' && e.enfase === 'folga' && e.fim === '2027-03-10', `editado no banco: ${JSON.stringify(e)}`)
  const natal = await NATAL()
  r = await H.cal('evento.remover', { id: natal })
  assert(r.status === 403, `Anfitrião remove evento com check-in (Natal no seed) → 403 (veio ${r.status})`)
  r = await H.cal('regras', { falta: 'reinicia', ppVirtude: 'arcano', ppVirtudePadrao: 'paus' })
  assert(r.status === 403, `Anfitrião muda regras → 403 (veio ${r.status})`)
  r = await H.cal('evento.salvar', { titulo: 'X', inicio: '2027-01-01' })
  assert(r.status === 400, `nome curto → 400 (veio ${r.status})`)
  r = await H.cal('evento.salvar', { titulo: 'Datas ao contrário', inicio: '2027-01-05', fim: '2027-01-01' })
  assert(r.status === 400, `fim antes do início → 400 (veio ${r.status})`)
  r = await H.cal('evento.salvar', { titulo: 'Arte perigosa', inicio: '2027-01-05', arte: 'javascript:alert(1)' })
  assert(r.status === 400, `arte inválida → 400 (veio ${r.status})`)
  r = await H.cal('evento.remover', { id: criado })
  assert(r.status === 200, `Anfitrião remove: ${r.text.slice(0, 120)}`)
  const [rm] = await q('SELECT removido_at FROM calendario_eventos WHERE id = $1', [criado])
  assert(rm.removido_at, 'remoção suave (removido_at)')
  const g = await A.get('/api/calendario')
  assert(!g.json.eventos.some((x) => x.id === criado), 'removido some do calendário dos jogadores')
  const log = await q("SELECT action FROM admin_log WHERE ref = $1 ORDER BY id", [criado])
  assert(log.map((l) => l.action).join(',') === 'calendario.evento.criado,calendario.evento.editado,calendario.evento.removido', `admin_log: ${log.map((l) => l.action).join(',')}`)
})

await test('Owner: evento com check-in próprio aparece como cartão extra; regras com log', async () => {
  const hoje = (await q("SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d"))[0].d
  let r = await O.cal('evento.salvar', {
    titulo: `Festa ${sfx}`,
    descricao: 'Evento do Owner com check-in.',
    inicio: hoje,
    enfase: 'folga',
    checkin: { titulo: 'Check-in da Festa', recompensas: [{ tipo: 'carta', raridade: 'rara' }, { tipo: 'item', item: 'dracma_comum', quantidade: 3 }] },
  })
  assert(r.status === 200, `Owner cria com check-in: ${r.text.slice(0, 160)}`)
  const id = r.json.id
  r = await O.cal('evento.salvar', { titulo: 'Item inexistente', inicio: hoje, checkin: { titulo: 'X', recompensas: [{ tipo: 'item', item: 'nao_existe', quantidade: 1 }] } })
  assert(r.status === 400, `item fora do catálogo → 400 (veio ${r.status})`)
  const g = await C.get('/api/calendario')
  const x = g.json.extras.find((e) => e.eventoId === id)
  assert(x && x.slots.length === 2 && x.slots[0].recompensa.rotulo === 'Carta Rara', `cartão extra do Owner: ${JSON.stringify(x?.slots?.map((s) => s.recompensa.rotulo))}`)
  r = await C.checkin({ tipo: 'evento', eventoId: id })
  assert(r.status === 200 && ['xadrez_rei', 'xadrez_cavalo', 'xadrez_bispo', 'xadrez_torre'].includes(r.json.aplicado.cartaId), `carta rara: ${JSON.stringify(r.json?.aplicado)}`)
  r = await O.cal('regras', { falta: 'pausa', ppVirtude: 'arcano', ppVirtudePadrao: 'copas', provisorio: true })
  assert(r.status === 200, `Owner muda regras: ${r.text.slice(0, 120)}`)
  const [cfg] = await q("SELECT value FROM devo_config WHERE key = 'calendario.checkin.regras'")
  assert(cfg.value.pp_virtude_padrao === 'copas', 'regra gravada')
  const [lg] = await q("SELECT action FROM admin_log WHERE action = 'calendario.regras' AND actor_id = $1", [O.id])
  assert(lg, 'admin_log calendario.regras')
  await regras(REGRAS_PADRAO)
  await O.cal('evento.remover', { id })
})

await test('Ultra Rara: aceita no check-in, rótulo próprio e entrega uma carta (Rainha ou Tabuleiro do Xadrez); secretas recusadas', async () => {
  const hoje = (await q("SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d"))[0].d
  let r = await O.cal('evento.salvar', {
    titulo: `Ultra ${sfx}`,
    descricao: 'Check-in com Carta Ultra Rara.',
    inicio: hoje,
    enfase: 'normal',
    checkin: { titulo: 'Check-in Ultra', recompensas: [{ tipo: 'carta', raridade: 'ultra_rara' }, { tipo: 'carta', raridade: 'lendaria' }] },
  })
  assert(r.status === 200, `Owner cria com Carta Ultra Rara: ${r.text.slice(0, 160)}`)
  const id = r.json.id
  for (const secreta of ['unica', 'promocional', 'ultra-rara']) {
    const x = await O.cal('evento.salvar', { titulo: `Secreta ${secreta}`, inicio: hoje, checkin: { titulo: 'X', recompensas: [{ tipo: 'carta', raridade: secreta }] } })
    assert(x.status === 400, `carta ${secreta} no check-in → 400 (veio ${x.status})`)
  }
  const g = await C.get('/api/calendario')
  const x = g.json.extras.find((e) => e.eventoId === id)
  const rotulos = x?.slots?.map((s) => s.recompensa.rotulo)
  assert(rotulos?.[0] === 'Carta Ultra Rara' && rotulos?.[1] === 'Carta Lendária', `rótulos: ${JSON.stringify(rotulos)}`)
  r = await C.checkin({ tipo: 'evento', eventoId: id })
  assert(r.status === 200 && ['xadrez_rainha', 'xadrez_tabuleiro'].includes(r.json.aplicado.cartaId), `Ultra Rara entrega uma Ultra Rara (Coleção Xadrez): ${JSON.stringify(r.json?.aplicado)}`)
  await O.cal('evento.remover', { id })
})

await test('a cena da Melissa está registrada e só termina uma vez', async () => {
  const r = await A.get('/api/dialogo?cena=melissa-calendario')
  assert(r.status === 200 && r.json?.progresso, `cena registrada: ${r.status} ${r.text.slice(0, 120)}`)
  const f = await A.post('/api/dialogo', { action: 'concluir', cena: 'melissa-calendario' })
  assert(f.status === 200, `concluir: ${f.status}`)
  const s = await A.get('/api/dialogo')
  assert(s.json?.cenas?.['melissa-calendario']?.fim === true, 'vista no resumo (não repete)')
})

console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => ` - ${f}`).join('\n'))
  process.exitCode = 1
}
await db.end()
