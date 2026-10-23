// Teste de servidor das Corporações (regras críticas). Roda no CI depois das capturas, contra o Postgres do
// workflow e o servidor em http://localhost:3000 → corporacoes-test.log.
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/corporacoes-test.mjs
// Cobre: trava (flag corporacoes), código inválido/inexistente, fundar debita Tempo uma vez (toques simultâneos e
// repetição do envio), requisitos, aprovação administrativa só pela equipe, Necro só pela equipe (servidor e gatilho
// do banco), só líder/vice aprova pedido de entrada (nem membro comum nem a equipe), carta não duplica na
// transferência (simultânea, save antigo, carta presa no Salão, destinatário de fora), recrutamento no Salão.
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
  corp(action, extra = {}) {
    return this.post('/api/corporacoes', { action, ...extra })
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
const cfgCriacao = async () => (await q("SELECT value FROM devo_config WHERE key = 'corporacoes.criacao'"))[0]?.value
const liberar = (s) => q("INSERT INTO player_unlocks (player_id, flag, source) VALUES ($1, 'corporacoes', 'owner') ON CONFLICT DO NOTHING", [s.id])
const sobreviveu = (s) =>
  q("INSERT INTO deadly_vote_entries (vote_id, player_id, outcome) VALUES ('c0a90002-0000-4000-8000-000000000001', $1, 'sobreviveu') ON CONFLICT DO NOTHING", [s.id])

await test('migração das Corporações é idempotente', async () => {
  const sql = readFileSync(join(here, '..', 'corporacoes-migration.sql'), 'utf8')
  await db.query(sql)
  await db.query(sql)
  const [{ n }] = await q("SELECT count(*)::int AS n FROM devo_config WHERE key LIKE 'corporacoes.%'")
  assert(n === 5, `5 configurações das Corporações (veio ${n})`)
})

await q(
  `INSERT INTO invite_codes (code, role, note, is_test) VALUES
     ($1, 'player', 'corp-test', true), ($2, 'player', 'corp-test', true), ($3, 'player', 'corp-test', true),
     ($4, 'player', 'corp-test', true), ($5, 'owner', 'corp-test', true)
   ON CONFLICT (code) DO NOTHING`,
  ['A', 'B', 'C', 'D', 'O'].map((k) => `DEVO-CT-${SFX}-${k}`),
)

let A, B, C, D, O
await test('cadastro das contas de teste', async () => {
  A = await signUp(`Cor${sfx}a`, `DEVO-CT-${SFX}-A`)
  B = await signUp(`Cor${sfx}b`, `DEVO-CT-${SFX}-B`)
  C = await signUp(`Cor${sfx}c`, `DEVO-CT-${SFX}-C`)
  D = await signUp(`Cor${sfx}d`, `DEVO-CT-${SFX}-D`)
  O = await signUp(`Cor${sfx}o`, `DEVO-CT-${SFX}-O`)
  for (const [s, cards] of [
    [A, [['a-1', 'xadrez_bispo'], ['a-2', 'escudo'], ['a-3', 'xadrez_cavalo']]],
    [B, [['b-1', 'xadrez_rainha'], ['b-2', 'xadrez_bispo'], ['b-3', 'xadrez_cavalo']]],
    [C, [['c-1', 'escudo']]],
    [D, [['d-1', 'xadrez_cavalo'], ['d-2', 'xadrez_bispo'], ['d-3', 'escudo']]],
  ]) {
    const r = await s.post('/api/save', save(cards))
    assert(r.status === 200, `save: ${r.status}`)
  }
})
if (!A || !O) {
  console.log('\nsem contas, abortando')
  process.exit(1)
}

/* ------------------------------------------------------------- Trava */
await test('trancado sem a flag (GET sem erro; POST 403); Owner vê liberado', async () => {
  const r = await A.get('/api/corporacoes')
  assert(r.status === 200 && r.json.liberado === false && r.json.motivo, `GET trancado: ${r.text}`)
  const p = await A.corp('entrar', { codigo: 'CRP-HQRA-3746' })
  assert(p.status === 403, `POST trancado deveria ser 403 (veio ${p.status})`)
  const o = await O.get('/api/corporacoes')
  assert(o.json.liberado === true, 'Owner vê Corporações liberado')
})
for (const s of [A, B, C, D]) await liberar(s)

await test('código inválido → 400; código bem formado sem Corporação → 404; prévia do código oficial', async () => {
  const a = await A.get('/api/corporacoes?codigo=XYZ')
  assert(a.status === 400, `inválido: ${a.status}`)
  const b = await A.get('/api/corporacoes?codigo=CRP-AAAA-AAAA')
  assert(b.status === 404, `inexistente: ${b.status}`)
  const c = await A.get('/api/corporacoes?codigo=crp hqra 3746')
  assert(c.status === 200 && c.json.corporacao?.nome === 'Ordem do Relógio Partido', `prévia: ${c.text}`)
  const necro = await A.get('/api/corporacoes?codigo=CRP-CNXA-9X4T')
  assert(necro.json.corporacao?.classificacao === 'necro', 'prévia mostra a Necro-Corporação')
})

/* ------------------------------------------------------------- Fundar */
let corpA
await test('fundar exige os requisitos do perfil (nada é cobrado)', async () => {
  const t0 = await timer(A.id)
  const r = await A.corp('fundar', { nome: `Casa ${SFX}`, forma: 'coroa', cor: 'ametista', idem: `idem-${sfx}-0` })
  assert(r.status === 409 && /requisitos/i.test(r.json?.error ?? ''), `sem requisitos deveria ser 409 (veio ${r.status} ${r.text})`)
  assert((await timer(A.id)) === t0, 'Tempo intacto')
})

await test('fundar debita Tempo UMA vez (dois toques simultâneos com o mesmo envio + um envio diferente)', async () => {
  await sobreviveu(A)
  const custo = (await cfgCriacao()).custo_minutos
  const t0 = await timer(A.id)
  const idem = `idem-${sfx}-1`
  const body = { nome: `Casa ${SFX}`, lema: 'Teste.', forma: 'coroa', cor: 'ametista' }
  const rs = await Promise.all([A.corp('fundar', { ...body, idem }), A.corp('fundar', { ...body, idem }), A.corp('fundar', { ...body, idem: `idem-${sfx}-2` })])
  const oks = rs.filter((r) => r.status === 200)
  assert(oks.length >= 1, `alguma fundação deveria passar (${rs.map((r) => r.status)})`)
  assert(rs.every((r) => r.status === 200 || r.status === 409), `respostas 200/409 (${rs.map((r) => `${r.status} ${r.text}`).join(' | ')})`)
  const pend = await q("SELECT id FROM corporacoes WHERE fundador_id = $1 AND status = 'pendente'", [A.id])
  assert(pend.length === 1, `uma fundação em análise (veio ${pend.length})`)
  corpA = pend[0].id
  const t1 = await timer(A.id)
  assert(t0 - t1 === custo * MIN, `debitou ${custo} min uma vez (veio ${(t0 - t1) / MIN})`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM corporacao_movimentos WHERE player_id = $1 AND minutos < 0', [A.id])
  assert(n === 1, `um débito no livro (veio ${n})`)
  const [{ envio }] = await q('SELECT envio_idem AS envio FROM corporacoes WHERE id = $1', [corpA])
  const rep = await A.corp('fundar', { ...body, idem: envio })
  assert(rep.status === 200 && rep.json.repetido === true && rep.json.corporacaoId === corpA, `repetir o envio devolve a mesma fundação: ${rep.text}`)
  assert((await timer(A.id)) === t1, 'repetição não cobra')
})

let codigoA
await test('aprovação administrativa: jogador não aprova; Owner aprova e o fundador vira líder com código', async () => {
  const x = await B.corp('mesa.fundacao', { id: corpA, decisao: 'aprovar' })
  assert(x.status === 403, `jogador aprovando: ${x.status}`)
  const v = await B.get('/api/corporacoes?view=mesa')
  assert(v.status === 403, 'jogador não vê a fila da Mesa')
  const m = await O.get('/api/corporacoes?view=mesa')
  assert(m.status === 200 && m.json.pendentes.some((p) => p.id === corpA), 'Owner vê a fundação na fila')
  const r = await O.corp('mesa.fundacao', { id: corpA, decisao: 'aprovar' })
  assert(r.status === 200 && /^CRP-/.test(r.json.codigo), `aprovar: ${r.text}`)
  codigoA = r.json.codigo
  const again = await O.corp('mesa.fundacao', { id: corpA, decisao: 'aprovar' })
  assert(again.status === 409, 'segunda aprovação → 409')
  const [mb] = await q('SELECT cargo FROM corporacao_membros WHERE player_id = $1', [A.id])
  assert(mb?.cargo === 'lider', 'fundador é o líder')
})

await test('Necro-Corporação só pela equipe (servidor e gatilho do banco)', async () => {
  const p = await A.corp('mesa.classificar', { id: corpA, classificacao: 'necro' })
  assert(p.status === 403, `líder classificando: ${p.status}`)
  let bloqueou = false
  try {
    await q("UPDATE corporacoes SET classificacao = 'necro' WHERE id = $1", [corpA])
  } catch (e) {
    bloqueou = /CORP_CLASSIFICACAO_NEGADA/.test(String(e))
  }
  assert(bloqueou, 'UPDATE direto sem ator da equipe é barrado pelo gatilho')
  const o = await O.corp('mesa.classificar', { id: corpA, classificacao: 'necro', nota: 'teste' })
  assert(o.status === 200, `Owner classifica: ${o.text}`)
  const [c] = await q('SELECT classificacao, classificada_por FROM corporacoes WHERE id = $1', [corpA])
  assert(c.classificacao === 'necro' && c.classificada_por === O.id, 'classificada pelo Owner')
  const g = await A.get('/api/corporacoes')
  assert(g.json.minha?.classificacao === 'necro', 'membros veem o status Necro')
  await O.corp('mesa.classificar', { id: corpA, classificacao: 'oficial' })
})

/* ------------------------------------------------------------- Entrada: só líder/vice aprova */
await test('pedido pelo código; só líder ou vice aprova (membro comum e equipe não)', async () => {
  const pc = await C.corp('entrar', { codigo: codigoA })
  assert(pc.status === 200, `C pede: ${pc.text}`)
  const dupla = await C.corp('entrar', { codigo: 'CRP-HQRA-3746' })
  assert(dupla.status === 409, 'um pedido pendente por vez')
  const ap = await A.corp('pedido.decidir', { id: pc.json.pedidoId, decisao: 'aprovar' })
  assert(ap.status === 200, `líder aprova C: ${ap.text}`)

  const pb = await B.corp('entrar', { codigo: codigoA })
  assert(pb.status === 200, `B pede: ${pb.text}`)
  const lider = await A.get('/api/corporacoes')
  const pedido = lider.json.minha.pedidos.find((p) => p.id === pb.json.pedidoId)
  assert(pedido && pedido.perfil.personagem && !('cargo' in pedido.perfil) && !('karma' in pedido.perfil), 'líder vê só o perfil permitido')
  const comum = await C.corp('pedido.decidir', { id: pb.json.pedidoId, decisao: 'aprovar' })
  assert(comum.status === 403, `membro comum aprovando: ${comum.status}`)
  const equipe = await O.corp('pedido.decidir', { id: pb.json.pedidoId, decisao: 'aprovar' })
  assert(equipe.status === 403, `Owner de fora aprovando: ${equipe.status}`)
  const fora = await D.corp('pedido.decidir', { id: pb.json.pedidoId, decisao: 'aprovar' })
  assert(fora.status === 403, 'Record de fora não aprova')
  const vice = await A.corp('membro.cargo', { playerId: C.id, cargo: 'vice' })
  assert(vice.status === 200, `promover C a vice: ${vice.text}`)
  const ok = await C.corp('pedido.decidir', { id: pb.json.pedidoId, decisao: 'aprovar' })
  assert(ok.status === 200, `vice aprova: ${ok.text}`)
  const dup = await A.corp('pedido.decidir', { id: pb.json.pedidoId, decisao: 'aprovar' })
  assert(dup.status === 409, 'pedido já decidido → 409')
  const [{ n }] = await q('SELECT count(*)::int AS n FROM corporacao_membros WHERE corporacao_id = $1', [corpA])
  assert(n === 3, `3 membros (veio ${n})`)
})

/* ------------------------------------------------------------- Transferência de cartas */
await test('carta não duplica: duas transferências simultâneas do mesmo uid → uma só', async () => {
  const [x, y] = await Promise.all([B.corp('carta.transferir', { uid: 'b-1', para: A.id }), B.corp('carta.transferir', { uid: 'b-1', para: C.id })])
  assert([x, y].filter((r) => r.status === 200).length === 1, `uma transferência (${x.status} ${x.text} / ${y.status} ${y.text})`)
  assert(!(await inventario(B.id)).some((c) => c.uid === 'b-1'), 'a carta saiu do save de B')
  const [{ d }] = await q("SELECT count(*)::int AS d FROM card_deliveries WHERE idem_key LIKE 'corp:transf:%' AND card_id = 'xadrez_rainha' AND player_id IN ($1, $2)", [A.id, C.id])
  assert(d === 1, `uma entrega (veio ${d})`)
  const [{ t }] = await q("SELECT count(*)::int AS t FROM corporacao_transferencias WHERE de_id = $1 AND card_uid = 'b-1'", [B.id])
  assert(t === 1, 'um registro de transferência')
})

await test('save antigo não ressuscita a carta transferida; o mesmo uid não sai de novo', async () => {
  const velho = save([['b-1', 'xadrez_rainha'], ['b-2', 'xadrez_bispo'], ['b-3', 'xadrez_cavalo']])
  velho.timerEndsAt = await timer(B.id)
  const r = await B.post('/api/save', velho)
  assert(r.status === 200, 'save aceito')
  assert(!(await inventario(B.id)).some((c) => c.uid === 'b-1'), '/api/save descartou o uid transferido')
  const again = await B.corp('carta.transferir', { uid: 'b-1', para: A.id })
  assert(again.status === 404 || again.status === 409, `segunda transferência: ${again.status}`)
})

await test('carta presa no Salão não sai; destinatário de fora da Corporação não recebe', async () => {
  await q(
    "INSERT INTO salao_mercado (seller_id, card_uid, card_id, card_rarity, preco, comissao_pct) VALUES ($1, 'b-2', 'xadrez_bispo', 'rara', 50, 15)",
    [B.id],
  )
  // Força o uid de volta ao save (como se o cliente estivesse atrasado) para provar a checagem do servidor.
  await q("UPDATE player_saves SET data = jsonb_set(data, '{inventory}', data->'inventory' || '[{\"uid\":\"b-2\",\"cardId\":\"olho\",\"origin\":\"teste\",\"acquiredAt\":1}]'::jsonb) WHERE player_id = $1", [B.id])
  const s = await B.corp('carta.transferir', { uid: 'b-2', para: A.id })
  assert(s.status === 409 && /Salão/.test(s.json?.error ?? ''), `carta no Salão: ${s.status} ${s.text}`)
  const fora = await B.corp('carta.transferir', { uid: 'b-3', para: D.id })
  assert(fora.status === 403, `destinatário de fora: ${fora.status}`)
  assert((await inventario(B.id)).some((c) => c.uid === 'b-3'), 'a carta continua com B')
})

/* ------------------------------------------------------------- Recrutamento */
await test('recrutamento no Salão: líder publica (com o código); membro comum não', async () => {
  const r = await A.corp('recrutamento.publicar', { titulo: 'Procuramos Records', texto: 'Vagas abertas.' })
  assert(r.status === 200 && r.json.anuncioId, `publicar: ${r.text}`)
  const [a] = await q("SELECT tipo, texto FROM salao_anuncios WHERE id = $1", [r.json.anuncioId])
  assert(a.tipo === 'recrutamento' && a.texto.includes(codigoA), 'anúncio de recrutamento com o código')
  await A.corp('membro.cargo', { playerId: C.id, cargo: 'membro' })
  const c = await C.corp('recrutamento.publicar', { titulo: 'Outro', texto: 'Outro texto.' })
  assert(c.status === 403, `membro comum publicando: ${c.status}`)
})

await test('lema opcional: o líder põe, troca e tira; membro comum não; formas e cores novas na fundação', async () => {
  const r = await A.corp('lema.editar', { lema: 'O tempo é a vida' })
  assert(r.status === 200 && r.json.lema === 'O tempo é a vida', `pôr lema: ${r.text}`)
  const c = await C.corp('lema.editar', { lema: 'Golpe' })
  assert(c.status === 403, `membro comum mudando o lema: ${c.status}`)
  const t = await A.corp('lema.editar', { lema: '' })
  assert(t.status === 200 && t.json.lema === null, `tirar lema: ${t.text}`)
  const g = await A.get('/api/corporacoes')
  assert(g.json.minha.lema === null, 'lema saiu da tela')
})

await test('brasão: o líder redesenha (divisão, segunda cor, figura, ornamento); membro não; desenho inválido recusado', async () => {
  const r = await A.corp('brasao.editar', { forma: 'torre', cor: 'cobalto', cor2: 'marfim', divisao: 'quartelado', simbolo: 'corvo', ornamento: 'asas' })
  assert(r.status === 200, `redesenhar: ${r.text}`)
  const g = await A.get('/api/corporacoes')
  const b = g.json.minha.brasao
  assert(b.forma === 'torre' && b.cor2 === 'marfim' && b.divisao === 'quartelado' && b.simbolo === 'corvo' && b.ornamento === 'asas', `brasão salvo: ${JSON.stringify(b)}`)
  const c = await C.corp('brasao.editar', { forma: 'escudo', cor: 'aco' })
  assert(c.status === 403, `membro redesenhando: ${c.status}`)
  const sem2 = await A.corp('brasao.editar', { forma: 'escudo', cor: 'aco', divisao: 'partido' })
  assert(sem2.status === 400, `divisão sem segunda cor: ${sem2.status}`)
  const ruim = await A.corp('brasao.editar', { forma: 'escudo', cor: 'aco', simbolo: 'dragao' })
  assert(ruim.status === 400, `figura inválida: ${ruim.status}`)
  const pleno = await A.corp('brasao.editar', { forma: 'escudo', cor: 'aco' })
  assert(pleno.status === 200, 'brasão simples continua valendo (padrões)')
})

await test('líder não sai sem passar a liderança; recusar fundação devolve o Tempo uma vez', async () => {
  const s = await A.corp('sair')
  assert(s.status === 409, `líder saindo: ${s.status}`)
  await sobreviveu(D)
  const t0 = await timer(D.id)
  const f = await D.corp('fundar', { nome: `Outra ${SFX}`, forma: 'rosa', cor: 'cobalto', cor2: 'rubi', divisao: 'banda', simbolo: 'rosa', ornamento: 'louros', idem: `idem-${sfx}-d` })
  assert(f.status === 200, `D funda: ${f.text}`)
  const r = await O.corp('mesa.fundacao', { id: f.json.corporacaoId, decisao: 'recusar', nota: 'teste' })
  assert(r.status === 200 && r.json.devolvido === true, `recusar devolve: ${r.text}`)
  const [{ n }] = await q('SELECT count(*)::int AS n FROM corporacao_movimentos WHERE idem_key = $1', [`corp:fundar:${f.json.corporacaoId}:devolucao`])
  assert(n === 1, 'devolução registrada uma vez')
  const g = await D.get('/api/corporacoes')
  assert(g.json.timeDeltaMs > 0 && (await timer(D.id)) > t0 - 360 * MIN, 'Tempo devolvido pelo livro-caixa')
})

await db.end()
console.log(`\n${passed} ok, ${failures.length} falha(s)`)
if (failures.length) {
  console.log(failures.map((f) => `- ${f}`).join('\n'))
  process.exit(1)
}
