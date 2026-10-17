// Teste de servidor das Virtudes: payload do jogador sem números (multiplicadores, P.P., teto), P.P. respeitam o
// teto do Estágio (e a idempotência), Evolução de Estágio distribui pela afinidade do Arcano, trava, permissões da
// Mesa e P.P. do Deadly Vote. Roda no CI depois das capturas, contra o Postgres do workflow e o servidor em
// http://localhost:3000. Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/virtudes-test.mjs
// Também: lista dos 22 Arcanos (trancado = só key/numeral/título/breve; o próprio abre) e edição dos textos dos
// Arcanos (só Owner, com admin_log). Convites DEVO-VIRT-TST1/TST2, DEVO-VIRT-OWN1 e DEVO-VIRT-ANF1 (95-seed-virtudes.sql). Sai com código 1 se algo falhar.
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
  virt(body) {
    return this.post('/api/virtudes', body)
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
    const inn = await s.req('POST', '/api/auth/sign-in/username', { username: name, password: 'senha-teste-123' })
    if (inn.status !== 200) throw new Error(`cadastro de ${name} falhou: ${r.status} ${r.text.slice(0, 200)}`)
  }
  const [p] = await q('SELECT id FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  return s
}
const VIRTUDES = ['paus', 'copas', 'ouros', 'espadas', 'tacas', 'escudos']
const ppTotal = async (id) => Number((await q('SELECT coalesce(sum(pp), 0) AS s FROM virtude_pp WHERE player_id = $1', [id]))[0].s)
const ppAdd = async (id, v, n, idem = null) => Number((await q("SELECT devo_virtude_pp_add($1, $2, $3, 'teste', NULL, NULL, $4) AS v", [id, v, n, idem]))[0].v)
const ARQUIVO = JSON.parse(readFileSync(join(here, '..', '..', 'lib', 'devo', 'virtudes-afinidades.json'), 'utf8'))

/* ------------------------------------------------------------- 1. Banco */
await test('migração das Virtudes é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'virtudes-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
})
await test('tabela de afinidade padrão = arquivo do doc, provisória, com divergências marcadas', async () => {
  const [c] = await q("SELECT value, provisional FROM devo_config WHERE key = 'virtudes.afinidades'")
  assert(c?.provisional === true, 'precisa estar marcada como provisória')
  // jsonb reordena as chaves: compara valor a valor
  for (const [k, o] of Object.entries(ARQUIVO.ordem)) for (const v of VIRTUDES) assert(c.value.ordem[k]?.[v] === o[v], `ordem difere do arquivo em ${k}.${v}`)
  assert(JSON.stringify(c.value.escala) === JSON.stringify(ARQUIVO.escala), 'escala difere do arquivo')
  assert(Object.keys(c.value.ordem).length === 22, `22 Arcanos, veio ${Object.keys(c.value.ordem).length}`)
  for (const [k, o] of Object.entries(c.value.ordem)) assert(Object.values(o).sort().join() === '1,2,3,4,5,6', `${k} não é permutação`)
  assert(c.value.ordem.morte.tacas === 1 && c.value.ordem.morte.paus === 6, 'Morte: Taças excelente, Paus deficiente (exemplo do doc)')
  for (const k of ['imperador', 'lua', 'imperatriz', 'diabo', 'sol', 'mundo', 'julgamento']) assert(c.value.divergencias[k]?.confirmar === true, `${k} deveria pedir confirmação do dono`)
})

/* ------------------------------------------------------------- 2. Contas */
const sfx = Date.now().toString(36).slice(-5)
const trancado = await signUp(`VirtT${sfx}`, 'DEVO-VIRT-TST2')
const jog = await signUp(`VirtJ${sfx}`, 'DEVO-VIRT-TST1')
const own = await signUp(`VirtO${sfx}`, 'DEVO-VIRT-OWN1')
const anf = await signUp(`VirtA${sfx}`, 'DEVO-VIRT-ANF1')

await test('jogador sem o tutorial vê as Virtudes trancadas, com motivo', async () => {
  const r = await trancado.get('/api/virtudes')
  assert(r.status === 200 && r.json?.liberado === false && /Deadly Vote/.test(r.json.motivo), `esperado trancado: ${r.text}`)
})
await test('jogador não abre a Mesa nem dispara Evolução, Arcano, P.P. ou tabela (403)', async () => {
  assert((await jog.get('/api/virtudes?view=mesa')).status === 403, 'mesa')
  for (const body of [
    { action: 'evoluir', playerId: jog.id },
    { action: 'arcano', playerId: jog.id, arcano: 'mundo' },
    { action: 'potencial', playerId: jog.id, virtude: 'paus', quantidade: 5 },
    { action: 'afinidades', value: ARQUIVO },
  ]) {
    const r = await jog.virt(body)
    assert(r.status === 403, `${body.action}: esperado 403, veio ${r.status}`)
  }
})

await test('Owner libera a flag e define o Arcano da Morte', async () => {
  const f = await own.post('/api/staff', { action: 'desbloqueio.definir', playerId: jog.id, flag: 'virtudes', on: true })
  assert(f.status === 200, `flag: ${f.status} ${f.text}`)
  const a = await own.virt({ action: 'arcano', playerId: jog.id, arcano: 'morte' })
  assert(a.status === 200 && a.json.arcano === 'morte', `arcano: ${a.text}`)
  const bad = await own.virt({ action: 'arcano', playerId: jog.id, arcano: 'gato' })
  assert(bad.status === 400, `arcano inválido: ${bad.status}`)
  const eu = await jog.get('/api/eu')
  assert(eu.json?.arcano?.titulo === 'Arcano da Morte' && eu.json.arcano.estagio === 1, `eu.arcano: ${JSON.stringify(eu.json?.arcano)}`)
})

/* ------------------------------------------------------------- 3. Teto */
await test('P.P. respeitam o teto do Estágio (soma das seis) e o idem', async () => {
  const [{ teto }] = await q('SELECT teto FROM devo_virtude_limite($1, 1)', ['morte'])
  const T = Number(teto)
  assert(T > 0, 'teto do Estágio 1')
  assert((await ppAdd(jog.id, 'tacas', 30, `vt:${jog.id}:a`)) === 30, 'primeiro lançamento')
  assert((await ppAdd(jog.id, 'tacas', 30, `vt:${jog.id}:a`)) === 30, 'idem devolve o mesmo aplicado')
  assert((await ppTotal(jog.id)) === 30, 'idem não soma de novo')
  const r = await own.virt({ action: 'potencial', playerId: jog.id, virtude: 'ouros', quantidade: 500, motivo: 'teste' })
  assert(r.status === 200 && r.json.aplicado === T - 30, `aplicado até o teto: ${r.text}`)
  assert((await ppTotal(jog.id)) === T, `soma = teto (${T}), veio ${await ppTotal(jog.id)}`)
  assert((await ppAdd(jog.id, 'paus', 10)) === 0, 'no teto não entra mais nada')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM virtude_pp_log WHERE player_id = $1 AND aplicado = 0 AND pedido = 10", [jog.id])
  assert(n === 1, 'tentativa no teto fica registrada com aplicado 0')
  const inv = await own.virt({ action: 'potencial', playerId: jog.id, virtude: 'naipe', quantidade: 1 })
  assert(inv.status === 400, `virtude inválida: ${inv.status}`)
})

/* ------------------------------------------------------------- 4. Payload qualitativo */
const PROIBIDO = ['pp', 'teto', 'minimo', 'total', 'escala', 'ordem', 'ganhos', 'acumulado', 'multiplicador', 'mult', 'pedido', 'aplicado']
function chaves(o, out = []) {
  if (Array.isArray(o)) o.forEach((x) => chaves(x, out))
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) out.push(k), chaves(v, out)
  return out
}
function semNumeros(r) {
  const ks = chaves(r.json)
  const vaz = ks.filter((k) => PROIBIDO.includes(k))
  assert(!vaz.length, `payload do jogador com campos numéricos: ${vaz.join(', ')}`)
  assert(!/×|0[.,]015|0[.,]5\b|0[.,]25|0[.,]15/.test(r.text), `payload com multiplicador: ${r.text.slice(0, 300)}`)
  // só números permitidos: estágio, nível da faixa (0..4), datas e Estágios do histórico
  const nums = []
  const walk = (o, k) => {
    if (typeof o === 'number') nums.push(k)
    else if (Array.isArray(o)) o.forEach((x) => walk(x, k))
    else if (o && typeof o === 'object') for (const [kk, v] of Object.entries(o)) walk(v, kk)
  }
  walk(r.json, '')
  const ok = new Set(['estagio', 'nivel', 'at', 'de', 'para'])
  const extra = nums.filter((k) => !ok.has(k))
  assert(!extra.length, `números inesperados no payload do jogador: ${extra.join(', ')}`)
}

await test('payload do jogador: afinidade em palavras, acúmulo qualitativo, sem multiplicadores nem P.P.', async () => {
  const r = await jog.get('/api/virtudes')
  assert(r.status === 200 && r.json.liberado === true, `liberado: ${r.text.slice(0, 200)}`)
  semNumeros(r)
  const af = Object.fromEntries(r.json.virtudes.map((v) => [v.key, v.afinidade]))
  assert(af.tacas === 'excelente' && af.paus === 'deficiente', `Morte: ${JSON.stringify(af)}`)
  assert(af.ouros === 'favorecida' && af.copas === 'dificil' && af.espadas === 'regular' && af.escudos === 'regular', `graus do meio: ${JSON.stringify(af)}`)
  assert(r.json.arcano.titulo === 'Arcano da Morte' && r.json.estagio === 1, 'arcano/estágio')
  assert(r.json.acumulo.cheio === true && r.json.acumulo.pronto === true && /limite/i.test(r.json.acumulo.rotulo), `acúmulo: ${JSON.stringify(r.json.acumulo)}`)
  assert(['ouros', 'tacas'].includes(r.json.tendencia), `tendência: ${r.json.tendencia}`)
  assert(r.json.virtudes.every((v) => typeof v.texto === 'string' && v.texto.length > 10), 'texto de cada Virtude')
})

/* ------------------------------------------------------------- 4b. Os vinte e dois Arcanos */
const PUBLICO = 'breve,key,numeral,titulo'
await test('lista dos Arcanos (jogador): trancados só com nome, numeral e breve; o próprio abre com Estágios', async () => {
  const r = await jog.get('/api/virtudes')
  semNumeros(r)
  const l = r.json.arcanos
  assert(Array.isArray(l) && l.length === 22, `22 Arcanos, veio ${l?.length}`)
  assert(r.json.verTodos === false, 'jogador não vê todos')
  assert(l[0].key === 'louco' && l[0].numeral === '0' && l[21].key === 'mundo' && l[21].numeral === 'XXI', 'ordem do tarô')
  for (const a of l.filter((x) => x.key !== 'morte')) {
    assert(Object.keys(a).sort().join() === PUBLICO, `${a.key} trancado expõe ${Object.keys(a).sort().join()}`)
    assert(typeof a.breve === 'string' && a.breve.length > 20 && a.breve.length <= 260, `${a.key}: breve`)
  }
  const m = l.find((x) => x.key === 'morte')
  assert(m.proprio === true && !('provisorio' in m), `próprio, sem selo de provisório: ${JSON.stringify(Object.keys(m))}`)
  const d = m.detalhe
  assert(d && d.descricao.length > 80 && d.fisiologia.length > 80, 'descrição e fisiologia')
  assert(d.excelente === 'tacas' && d.deficiente === 'paus', `extremos: ${d.excelente}/${d.deficiente}`)
  assert(d.estagios.length === 5, `cinco Estágios, veio ${d.estagios.length}`)
  assert(d.estagios[0].estado === 'atual' && d.estagios[0].linha, 'Estágio I atual, com a linha')
  for (const e of d.estagios.slice(1)) assert(e.estado === 'futuro' && e.nome && !('linha' in e), `futuro velado: ${JSON.stringify(e)}`)
  assert(!/"provisorio"/.test(r.text), 'nenhum "provisorio" no payload do jogador')
})
await test('lista dos Arcanos: jogador sem o tutorial não recebe nada; Anfitrião abre todos, sem selo; Owner vê o selo', async () => {
  const t = await trancado.get('/api/virtudes')
  assert(t.json.liberado === false && !('arcanos' in t.json), 'trancado sem lista')
  const a = await anf.get('/api/virtudes')
  assert(a.status === 200 && a.json.liberado === true && a.json.verTodos === true, `anfitrião: ${a.text.slice(0, 200)}`)
  assert(a.json.arcanos.every((x) => x.detalhe && x.detalhe.estagios.every((e) => e.linha)), 'anfitrião abre todos, com as linhas')
  assert(!/"provisorio"/.test(a.text), 'selo de provisório só para o Owner')
  const o = await own.get('/api/virtudes')
  assert(o.json.verTodos === true && o.json.arcanos.every((x) => x.detalhe && x.provisorio === true), 'Owner: todos abertos e marcados provisórios')
})

const NOVO = {
  breve: 'Frase breve de teste para a Morte, editada pelo Owner.',
  descricao: 'Descrição de teste da Morte, editada pelo Owner na Mesa das Virtudes.',
  fisiologia: 'Fisiologia de teste: Taças cresce, Paus quase não responde.',
  estagios: [
    { nome: 'Um', linha: 'Linha um.' },
    { nome: 'Dois', linha: 'Linha dois.' },
    { nome: 'Três', linha: 'Linha três.' },
    { nome: 'Quatro', linha: 'Linha quatro.' },
    { nome: 'Cinco', linha: 'Linha cinco.' },
  ],
}
await test('textos dos Arcanos: só o Owner edita (jogador e Anfitrião 403)', async () => {
  for (const s of [jog, anf]) {
    const r = await s.virt({ action: 'arcano-texto', arcano: 'morte', value: NOVO })
    assert(r.status === 403, `${s.name}: esperado 403, veio ${r.status}`)
    const z = await s.virt({ action: 'arcano-texto', arcano: 'morte', value: null })
    assert(z.status === 403, `${s.name} restaurar: esperado 403, veio ${z.status}`)
  }
  const m = await anf.get('/api/virtudes?view=mesa')
  assert(m.status === 200 && m.json.podeEditar === false && !('arcanos' in m.json.config), 'Mesa do Anfitrião sem os textos editáveis')
})
await test('textos dos Arcanos: Owner grava (admin_log), jogador vê; inválido 400; voltar ao rascunho', async () => {
  const antes = (await jog.get('/api/virtudes')).json.arcanos.find((x) => x.key === 'morte')
  const r = await own.virt({ action: 'arcano-texto', arcano: 'morte', value: NOVO, provisorio: false })
  assert(r.status === 200 && r.json.ok, `gravar: ${r.status} ${r.text}`)
  const [log] = await q("SELECT ref, data FROM admin_log WHERE action = 'virtudes.arcano_texto' AND ref = 'morte' ORDER BY id DESC LIMIT 1")
  assert(log && log.data.breve === NOVO.breve && log.data.provisorio === false, `admin_log: ${JSON.stringify(log)}`)
  const depois = (await jog.get('/api/virtudes')).json.arcanos.find((x) => x.key === 'morte')
  assert(depois.breve === NOVO.breve && depois.detalhe.descricao === NOVO.descricao && depois.detalhe.estagios[0].nome === 'Um', 'jogador vê o texto novo')
  assert(!('linha' in depois.detalhe.estagios[1]), 'futuro continua velado')
  const ol = (await own.get('/api/virtudes')).json.arcanos.find((x) => x.key === 'morte')
  assert(ol.provisorio === false, 'Owner: sem selo depois de marcar final')
  const mesa = await own.get('/api/virtudes?view=mesa')
  assert(Object.keys(mesa.json.config.arcanos).length === 22 && mesa.json.config.arcanos.morte.editado === true && mesa.json.config.arcanos.louco.editado === false, 'Mesa do Owner: textos em vigor')
  for (const [body, msg] of [
    [{ action: 'arcano-texto', arcano: 'morte', value: { ...NOVO, fisiologia: '  ' } }, 'sem fisiologia'],
    [{ action: 'arcano-texto', arcano: 'morte', value: { ...NOVO, estagios: [] } }, 'sem Estágios'],
    [{ action: 'arcano-texto', arcano: 'gato', value: NOVO }, 'Arcano desconhecido'],
  ]) {
    const b = await own.virt(body)
    assert(b.status === 400, `${msg}: esperado 400, veio ${b.status}`)
  }
  const z = await own.virt({ action: 'arcano-texto', arcano: 'morte', value: null })
  assert(z.status === 200 && z.json.restaurado === true, `restaurar: ${z.text}`)
  const volta = (await jog.get('/api/virtudes')).json.arcanos.find((x) => x.key === 'morte')
  assert(volta.breve === antes.breve && volta.detalhe.descricao === antes.detalhe.descricao, 'voltou ao rascunho do código')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM admin_log WHERE action = 'virtudes.arcano_texto' AND ref = 'morte'")
  assert(n >= 2, `duas entradas no admin_log, veio ${n}`)
})

/* ------------------------------------------------------------- 5. Evolução */
await test('Evolução abaixo do mínimo ou sem Arcano → 409, nada muda', async () => {
  const outro = trancado
  await q('UPDATE players SET arcano = NULL WHERE id = $1', [outro.id])
  const r = await own.virt({ action: 'evoluir', playerId: outro.id })
  assert(r.status === 409 && /Arcano/.test(r.json?.error ?? ''), `sem arcano: ${r.status} ${r.text}`)
  await own.virt({ action: 'arcano', playerId: outro.id, arcano: 'louco' })
  await ppAdd(outro.id, 'espadas', 1)
  const b = await own.virt({ action: 'evoluir', playerId: outro.id })
  assert(b.status === 409 && /mínimo/.test(b.json?.error ?? ''), `abaixo do mínimo: ${b.status} ${b.text}`)
  const [p] = await q('SELECT arcano_estagio FROM players WHERE id = $1', [outro.id])
  assert(p.arcano_estagio === 1 && (await ppTotal(outro.id)) === 1, 'nada mudou')
})

await test('Evolução distribui pela afinidade do Arcano (jogador não controla) e zera os P.P.', async () => {
  // P.P. iguais nas seis: a ordem dos ganhos tem de ser a da afinidade (Morte: Taças > Ouros > Espadas > Escudos > Copas > Paus)
  await q('DELETE FROM virtude_pp WHERE player_id = $1', [jog.id])
  for (const v of VIRTUDES) await ppAdd(jog.id, v, 10)
  const r = await own.virt({ action: 'evoluir', playerId: jog.id })
  assert(r.status === 200 && r.json.ok && r.json.de === 1 && r.json.para === 2, `evoluir: ${r.status} ${r.text}`)
  const g = r.json.ganhos
  const soma = Math.round(VIRTUDES.reduce((s, v) => s + g[v], 0) * 100) / 100
  assert(soma === 60 && r.json.total === 60, `soma dos ganhos = total (60), veio ${soma}`)
  const ordem = ['tacas', 'ouros', 'espadas', 'escudos', 'copas', 'paus']
  for (let i = 1; i < ordem.length; i++) assert(g[ordem[i - 1]] > g[ordem[i]], `${ordem[i - 1]} (${g[ordem[i - 1]]}) deveria ganhar mais que ${ordem[i]} (${g[ordem[i]]})`)
  assert((await ppTotal(jog.id)) === 0, 'P.P. zerados após a metamorfose')
  const [p] = await q('SELECT arcano_estagio FROM players WHERE id = $1', [jog.id])
  assert(p.arcano_estagio === 2, 'Estágio 2')
  const niv = await q('SELECT virtude, valor FROM virtude_nivel WHERE player_id = $1', [jog.id])
  assert(niv.length === 6 && Number(niv.find((n) => n.virtude === 'tacas').valor) === g.tacas, 'atributos somados')
  const again = await own.virt({ action: 'evoluir', playerId: jog.id })
  assert(again.status === 409, `sem P.P., segunda evolução recusada: ${again.status}`)
})

await test('esforço concentrado inclina, mas a afinidade continua mandando', async () => {
  const [{ teto }] = await q('SELECT teto FROM devo_virtude_limite($1, 2)', ['morte'])
  await ppAdd(jog.id, 'paus', Number(teto)) // tudo em Paus, a deficiente da Morte
  const r = await own.virt({ action: 'evoluir', playerId: jog.id })
  assert(r.status === 200, `evoluir: ${r.text}`)
  assert(r.json.ganhos.tacas > r.json.ganhos.paus, `Taças (excelente) ainda cresce mais que Paus: ${JSON.stringify(r.json.ganhos)}`)
})

await test('histórico do jogador mostra as Evoluções em palavras, sem números', async () => {
  const r = await jog.get('/api/virtudes')
  semNumeros(r)
  assert(r.json.estagio === 3 && r.json.evolucoes.length === 2, `estágio/histórico: ${r.json.estagio} ${r.json.evolucoes.length}`)
  const ultima = r.json.evolucoes.find((e) => e.de === 1)
  assert(ultima.maisCresceu === 'tacas' && ultima.menosCresceu === 'paus', `extremos: ${JSON.stringify(ultima)}`)
})

await test('Mesa (Owner) vê os números; tabela inválida é recusada; tabela válida grava', async () => {
  const m = await own.get('/api/virtudes?view=mesa&q=' + encodeURIComponent(`VirtJ${sfx}`))
  assert(m.status === 200 && m.json.podeEditar === true, `mesa: ${m.status}`)
  const j = m.json.jogadores.find((x) => x.id === jog.id)
  assert(j && j.estagio === 3 && j.evolucoes.length === 2 && typeof j.teto === 'number' && j.nivel.tacas > 0, `linha: ${JSON.stringify(j)?.slice(0, 300)}`)
  const ruim = structuredClone(m.json.config.afinidades)
  ruim.ordem.morte = { ...ruim.ordem.morte, paus: 1 }
  const r1 = await own.virt({ action: 'afinidades', value: ruim })
  assert(r1.status === 400 && /Morte/.test(r1.json?.error ?? ''), `inválida: ${r1.status} ${r1.text}`)
  const boa = structuredClone(m.json.config.afinidades)
  boa.divergencias.lua.confirmado = true
  const r2 = await own.virt({ action: 'afinidades', value: boa })
  assert(r2.status === 200, `válida: ${r2.status} ${r2.text}`)
  const [c] = await q("SELECT value, provisional FROM devo_config WHERE key = 'virtudes.afinidades'")
  assert(c.provisional === true && c.value.divergencias.lua.confirmado === true, 'gravou provisória com o conferido')
})

/* ------------------------------------------------------------- 6. Deadly Vote */
await test('Deadly Vote aplicado rende P.P. de participação e sobrevivência (uma vez)', async () => {
  const c = await own.post('/api/record', { action: 'create', title: `Caso Virtudes ${sfx}`, startsAt: Date.now() + 60_000 })
  assert(c.status === 200, `criar: ${c.status} ${c.text}`)
  const voteId = c.json.id
  assert((await jog.post('/api/record', { action: 'join', voteId })).status === 200, 'inscrição')
  for (const st of ['em-progresso', 'concluido']) assert((await own.post('/api/record', { action: 'status', voteId, status: st })).status === 200, st)
  assert((await own.post('/api/record', { action: 'decision', voteId, playerId: jog.id, decision: 'premio' })).status === 200, 'decisão')
  const a = await own.post('/api/record', { action: 'apply', voteId })
  assert(a.status === 200, `aplicar: ${a.status} ${a.text}`)
  const rows = await q('SELECT motivo, virtude FROM virtude_pp_log WHERE player_id = $1 AND ref = $2', [jog.id, voteId])
  assert(rows.some((r) => r.motivo === 'dv.participacao') && rows.some((r) => r.motivo === 'dv.sobreviveu'), `log: ${JSON.stringify(rows)}`)
  await own.post('/api/record', { action: 'apply', voteId })
  const after = await q('SELECT count(*)::int AS n FROM virtude_pp_log WHERE player_id = $1 AND ref = $2', [jog.id, voteId])
  assert(after[0].n === rows.length, 'segunda aplicação não duplica')
})

await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}
