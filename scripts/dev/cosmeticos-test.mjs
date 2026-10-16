// Teste de servidor dos Cosméticos (texto do dono §6, §7, §8, §11, §13): jogador não equipa o que não tem;
// Owner equipa qualquer item; payload público nunca leva o cargo de Owner; catálogo só o Owner edita; upload
// de asset recusa SVG com script; recompensas semanais seguem o fluxo de aprovação e distribuem uma vez só.
// Roda no CI depois das capturas (Postgres do workflow + servidor em http://localhost:3000).
// Usa os convites DEVO-COSM-* do 94-seed-cosmeticos.sql (contas de teste).
// Uso local: DATABASE_URL=... DEVO_URL=http://localhost:3000 node scripts/dev/cosmeticos-test.mjs
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
    return { status: res.status, json, text, headers: res.headers }
  }
  get(path) {
    return this.req('GET', path)
  }
  cos(body) {
    return this.req('POST', '/api/cosmeticos', body)
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
  const [p] = await q('SELECT id, role FROM players WHERE lower(name) = lower($1)', [name])
  s.id = p.id
  s.role = p.role
  return s
}
const ok200 = (r, what) => assert(r.status === 200, `${what}: ${r.status} ${r.text.slice(0, 300)}`)

const sfx = Date.now().toString(36).slice(-4)
const owner = await signUp(`CosOwner${sfx}`, 'DEVO-COSM-OWNR')
const anf = await signUp(`CosAnf${sfx}`, 'DEVO-COSM-ANF1')
const j1 = await signUp(`CosJog${sfx}`, 'DEVO-COSM-JOG1')
const j2 = await signUp(`CosDois${sfx}`, 'DEVO-COSM-JOG2')
console.log(`contas: owner=${owner.role} anf=${anf.role} j1=${j1.role} j2=${j2.role}`)

const MOLDURA = 'cosmetico:moldura-heranca-marfim'
const ARCANO = 'cosmetico:moldura-ultima-badalada'

await test('catálogo inicial: 8 molduras ×2, ≥10 emblemas, ≥5 balões, itens do Poço marcados', async () => {
  const r = await j1.get('/api/cosmeticos?view=catalogo')
  ok200(r, 'catálogo')
  const c = r.json.catalogo
  const n = (cat) => c.filter((x) => x.categoria === cat).length
  assert(n('moldura_avatar') >= 8 && n('moldura_mini') >= 8, `molduras: ${n('moldura_avatar')}/${n('moldura_mini')}`)
  assert(n('emblema') >= 10 && n('balao') >= 5, `emblemas ${n('emblema')} balões ${n('balao')}`)
  // Itens de teste do seed do Poço (cosmetico:poco_teste_*) não têm arte própria; o catálogo real precisa ter.
  assert(c.filter((x) => !String(x.key ?? x.id ?? '').includes('poco_teste')).every((x) => x.asset), 'todo item tem asset')
  const [{ n: poco }] = await q("SELECT count(*)::int AS n FROM item_defs WHERE kind = 'cosmetico' AND active AND meta->>'poco' = 'true'")
  assert(poco >= 10, `itens do Poço: ${poco}`)
})

await test('arte por IA: Asas e Coração com meta.imagem (janela, tamanhos, camada de brilho) e arquivos presentes', async () => {
  const r = await j1.get('/api/cosmeticos?view=catalogo')
  ok200(r, 'catálogo')
  const by = new Map(r.json.catalogo.map((x) => [x.key, x]))
  const asas = by.get('cosmetico:moldura-asas-crepusculo')
  const cor = by.get('cosmetico:emblema-coracao-condessa')
  assert(asas?.imagem?.janela?.raio?.[0] === 0.25 && asas.imagem.tamanhos.length === 5, `asas: ${JSON.stringify(asas?.imagem)}`)
  assert(by.get('cosmetico:mini-asas-crepusculo')?.imagem?.base === asas.imagem.base, 'mini usa a mesma arte por enquanto')
  assert(cor?.imagem?.camadas?.[0]?.anim === 'brilho' && cor.animado === true, `coração: ${JSON.stringify(cor?.imagem)}`)
  for (const u of [`${asas.imagem.base}-96.webp`, `${asas.imagem.base}-512.webp`, `${cor.imagem.base}-256.webp`, cor.imagem.camadas[0].src]) {
    const f = await fetch(`${BASE}${u}`)
    assert(f.ok && /webp/.test(f.headers.get('content-type') ?? ''), `${u}: ${f.status}`)
  }
})

await test('jogador não equipa o que não tem; nem item de outra categoria; nem o Selo automático', async () => {
  const r = await j1.cos({ action: 'equipar', slot: 'moldura_avatar', key: MOLDURA })
  assert(r.status === 403, `sem posse: ${r.status} ${r.text}`)
  const [row] = await q('SELECT moldura_avatar FROM player_cosmetics WHERE player_id = $1', [j1.id])
  assert(!row?.moldura_avatar, 'nada gravado')
  const errado = await j1.cos({ action: 'equipar', slot: 'emblema', key: MOLDURA })
  assert(errado.status === 400 || errado.status === 403, `categoria errada: ${errado.status}`)
  const selo = await anf.cos({ action: 'equipar', slot: 'emblema', key: 'cosmetico:emblema-selo-anfitriao' })
  assert(selo.status === 403, `selo automático: ${selo.status}`)
  const lixo = await j1.cos({ action: 'equipar', slot: 'nada', key: MOLDURA })
  assert(lixo.status === 400, `espaço inválido: ${lixo.status}`)
})

await test('Owner concede → jogador equipa → aparece no visual público; Owner revoga → some', async () => {
  const neg = await j2.cos({ action: 'admin.conceder', playerId: j1.id, key: MOLDURA })
  assert(neg.status === 403, `jogador concedendo: ${neg.status}`)
  ok200(await owner.cos({ action: 'admin.conceder', playerId: j1.id, key: MOLDURA, motivo: 'teste' }), 'owner concede')
  const meu = await j1.get('/api/cosmeticos')
  ok200(meu, 'meus cosméticos')
  assert(meu.json.possuidos.some((p) => p.key === MOLDURA) && meu.json.livre === false, 'posse e sem passe livre')
  ok200(await j1.cos({ action: 'equipar', slot: 'moldura_avatar', key: MOLDURA }), 'equipa o que tem')
  const v = await j2.get(`/api/cosmeticos?view=visuais&ids=${j1.id}`)
  assert(v.json.visuais[0].av === MOLDURA, `visual público: ${v.text}`)
  ok200(await owner.cos({ action: 'admin.revogar', playerId: j1.id, key: MOLDURA, motivo: 'teste' }), 'owner revoga')
  const v2 = await j2.get(`/api/cosmeticos?view=visuais&ids=${j1.id}`)
  assert(v2.json.visuais[0].av === null, 'revogado some do visual')
  const h = await owner.get(`/api/cosmeticos?view=historico&jogador=${j1.id}`)
  ok200(h, 'histórico')
  assert(h.json.historico.filter((x) => x.item === MOLDURA).length >= 2, 'histórico tem concessão e revogação')
})

await test('item expirado (temporário) deixa de valer para equipar', async () => {
  await q("SELECT devo_item_grant($1, 'cosmetico:emblema-as-espadas', 1, 'teste')", [j2.id])
  await q("UPDATE player_items SET expires_at = now() - interval '1 minute' WHERE player_id = $1 AND item_key = 'cosmetico:emblema-as-espadas'", [j2.id])
  const r = await j2.cos({ action: 'equipar', slot: 'emblema', key: 'cosmetico:emblema-as-espadas' })
  assert(r.status === 403, `expirado: ${r.status}`)
})

await test('Owner equipa qualquer cosmético, sem possuir (inclusive arcano e inativo)', async () => {
  const meu = await owner.get('/api/cosmeticos')
  assert(meu.json.livre === true && !meu.json.possuidos.some((p) => p.key === ARCANO), 'owner livre e sem posse')
  ok200(await owner.cos({ action: 'equipar', slot: 'moldura_avatar', key: ARCANO }), 'owner equipa arcano')
  ok200(await owner.cos({ action: 'equipar', slot: 'efeito', key: 'cosmetico:efeito-assinatura-noturna' }), 'owner equipa efeito')
  await q("UPDATE item_defs SET active = false WHERE key = 'cosmetico:balao-mesa-destino'")
  try {
    ok200(await owner.cos({ action: 'equipar', slot: 'balao', key: 'cosmetico:balao-mesa-destino' }), 'owner equipa inativo')
    const v = await j1.get(`/api/cosmeticos?view=visuais&ids=${owner.id}`)
    assert(v.json.visuais[0].bal === null, 'item inativo não aparece em público (não denuncia o Owner)')
  } finally {
    await q("UPDATE item_defs SET active = true WHERE key = 'cosmetico:balao-mesa-destino'")
  }
})

await test('payload público sem cargo de Owner (visuais, chat, miniperfil); Anfitrião é público', async () => {
  const v = await j1.get(`/api/cosmeticos?view=visuais&ids=${owner.id},${anf.id}`)
  ok200(v, 'visuais')
  const o = v.json.visuais.find((x) => x.id === owner.id)
  const a = v.json.visuais.find((x) => x.id === anf.id)
  assert(o.av === ARCANO && o.anfitriao === false, `owner aparece como jogador com o que equipou: ${JSON.stringify(o)}`)
  assert(a.anfitriao === true, 'anfitrião público')
  assert(!/owner|admin|livre|cargo|role/i.test(v.text), `payload de visuais vaza cargo: ${v.text.slice(0, 300)}`)
  assert(Object.keys(o).sort().join() === 'anfitriao,av,bal,ef,emb,foto,id,mini', `campos do visual: ${Object.keys(o)}`)
  // A mesa (lobby) é só registro: a mensagem digitada é recusada e a linha entra direto no banco.
  assert((await owner.req('POST', '/api/arcade', { action: 'chat', channel: 'lobby', body: `teste ${sfx}` })).status === 403, 'lobby recusa mensagem digitada')
  await q('INSERT INTO arcade_chat (channel, author, player_id, body) VALUES ($1,$2,$3,$4)', ['lobby', owner.name, owner.id, `teste ${sfx}`])
  const chat = await j1.get('/api/arcade?view=chat&channel=lobby')
  const linha = chat.json.messages.find((m) => m.pid === owner.id)
  assert(linha && (linha.role === 'player' || linha.role === undefined) && !chat.text.includes('"owner"'), `chat: ${JSON.stringify(linha)}`)
  const mp = await j1.get(`/api/arcade?view=profile&pid=${owner.id}`)
  assert(mp.json.role === 'player' && !mp.text.includes('"owner"'), `miniperfil: ${mp.text.slice(0, 200)}`)
})

await test('catálogo: só o Owner cria/edita; Anfitrião e jogador recebem 403', async () => {
  const item = { key: `cosmetico:teste-${sfx}`, name: 'Teste', categoria: 'emblema', rarity: 'raro', asset: 'devo:emblema/as-espadas', poco: false, origem: 'evento' }
  assert((await j1.cos({ action: 'admin.salvar', item })).status === 403, 'jogador')
  assert((await anf.cos({ action: 'admin.salvar', item })).status === 403, 'anfitrião')
  assert((await anf.get('/api/cosmeticos?view=admin')).status === 403, 'anfitrião lendo admin')
  ok200(await owner.cos({ action: 'admin.salvar', item }), 'owner cria')
  const ruim = await owner.cos({ action: 'admin.salvar', item: { ...item, asset: 'javascript:alert(1)' } })
  assert(ruim.status === 400, `asset inválido: ${ruim.status}`)
  const [d] = await q('SELECT kind, rarity, meta FROM item_defs WHERE key = $1', [item.key])
  assert(d.kind === 'cosmetico' && d.meta.categoria === 'emblema', 'gravado no catálogo')
})

await test('upload de asset: SVG com script recusado; SVG limpo servido com CSP fechada', async () => {
  const mal = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64')
  assert((await owner.cos({ action: 'admin.asset', mime: 'image/svg+xml', base64: mal })).status === 400, 'svg com script')
  const evt = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="x()"></svg>').toString('base64')
  assert((await owner.cos({ action: 'admin.asset', mime: 'image/svg+xml', base64: evt })).status === 400, 'svg com evento')
  assert((await j1.cos({ action: 'admin.asset', mime: 'image/svg+xml', base64: mal })).status === 403, 'jogador enviando')
  const bom = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>').toString('base64')
  const r = await owner.cos({ action: 'admin.asset', mime: 'image/svg+xml', base64: bom })
  ok200(r, 'svg limpo')
  const a = await j1.get(r.json.url)
  assert(a.status === 200 && a.headers.get('content-type') === 'image/svg+xml' && /default-src 'none'/.test(a.headers.get('content-security-policy') ?? ''), 'servido com CSP')
})

await test('semanais: Anfitrião propõe; só aprova com autorização; editar volta a pendente; distribui uma vez', async () => {
  const semana = (await owner.get('/api/cosmeticos?view=planos')).json.semanas.atual
  assert((await j1.cos({ action: 'plano.criar', semana, jogo: 'geral', criterio: 'top1', recurso: 'item', chave: 'cosmetico:emblema-coroa-partida', quantidade: 1 })).status === 403, 'jogador cria plano')
  const c = await anf.cos({ action: 'plano.criar', semana, jogo: 'geral', criterio: 'top1', recurso: 'item', chave: 'cosmetico:emblema-coroa-partida', quantidade: 1 })
  ok200(c, 'anfitrião propõe')
  const id = c.json.id
  const [p0] = await q('SELECT status FROM weekly_reward_plans WHERE id = $1', [id])
  assert(p0.status === 'proposta', `nasce proposta: ${p0.status}`)
  assert((await anf.cos({ action: 'plano.aprovar', id })).status === 403, 'anfitrião sem autorização')
  ok200(await owner.req('POST', '/api/staff', { action: 'autorizacao.conceder', granteeId: anf.id, escopo: 'recompensa.semanal', ref: `Semana ${semana}` }), 'owner autoriza a semana')
  ok200(await anf.cos({ action: 'plano.aprovar', id }), 'anfitrião autorizado aprova')
  ok200(await anf.cos({ action: 'plano.editar', id, quantidade: 1, criterio: 'top3' }), 'anfitrião edita')
  const [p1] = await q('SELECT status, revision, approved_by FROM weekly_reward_plans WHERE id = $1', [id])
  assert(p1.status === 'proposta' && p1.revision >= 1 && !p1.approved_by, `edição volta a pendente: ${JSON.stringify(p1)}`)
  ok200(await owner.cos({ action: 'plano.aprovar', id }), 'owner aprova')
  const d1 = await owner.cos({ action: 'plano.distribuir', id })
  ok200(d1, 'distribui')
  const [{ n }] = await q("SELECT count(*)::int AS n FROM reward_proposals WHERE kind = 'semanal' AND origin = $1 AND status = 'entregue'", [`Semana ${semana}`])
  assert(n === d1.json.distribuidos && n >= 1, `propostas entregues: ${n} / ${d1.json.distribuidos}`)
  const d2 = await owner.cos({ action: 'plano.distribuir', id })
  ok200(d2, 'segunda distribuição')
  const [{ n: n2 }] = await q("SELECT count(*)::int AS n FROM reward_proposals WHERE kind = 'semanal' AND origin = $1", [`Semana ${semana}`])
  assert(d2.json.ja === true && n2 === n, 'não duplica')
  const fechado = await owner.cos({ action: 'plano.editar', id, quantidade: 2 })
  assert(fechado.status === 409, `plano distribuído é imutável: ${fechado.status}`)
})

await db.end()
console.log(`\nCosméticos: ${passed} ok, ${failures.length} falha(s)${failures.length ? ': ' + failures.join(' | ') : ''}`)
process.exit(failures.length ? 1 : 0)
