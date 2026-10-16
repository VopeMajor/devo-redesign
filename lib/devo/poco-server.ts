import 'server-only'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { can, normalizeCargo, seesAllSystems } from './cargos'
import { RecordError } from './errors'
import { type Queryable, run, txAs } from './fundacao-db'
import { consumeItem, grantItem } from './inventario-server'
import { loadActor } from './permissoes-server'
import {
  aplicarManivela,
  avaliarToques,
  categoriaPorRolagem,
  lerPesos,
  lixoPorId,
  MANIVELA_PADRAO,
  type ManivelaConfig,
  type ManivelaParams,
  POCO_LIXO,
  type PocoBalde,
  type PocoCategoria,
  type PocoGiroAberto,
  type PocoLetreiro,
  type PocoMoeda,
  type PocoPayload,
  type PocoPesos,
  type PocoResultado,
  toquesValidos,
} from './poco'
import type { ItemKind, ItemRarity } from './progresso'
import { getConfig, hasUnlock, requireUnlock } from './progresso-server'

/**
 * Poço dos Milagres — servidor. Contrato: docs/redesign/FUNDACAO.md §10.
 *
 * Fluxo de um giro (uma moeda por vez no poço):
 *   lançar moeda  → cria o giro com o segredo do sorteio (seed) e mostra o compromisso sha256(seed);
 *                   consome a moeda (ou o giro grátis do dia) na MESMA transação.
 *   girar         → minigame: o servidor deriva do seed os parâmetros do ponteiro, recebe só os INSTANTES
 *                   dos toques e conta os acertos ele mesmo; sorteia com os pesos da configuração e entrega
 *                   o prêmio no inventário (idempotente por giro).
 *   inspecionar   → revela o resultado e o seed (auditável: sha256(seed) === seedHash).
 */

const TZ = 'America/Sao_Paulo'
const CORVO_IDEM = (playerId: string) => `poco:corvo:${playerId}`
const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para abrir o Poço dos Milagres.'

/* ------------------------------------------------------------------ Aleatoriedade auditável */

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Número uniforme [0, 1) derivado do segredo do giro e de um rótulo (HMAC-SHA256, 48 bits). */
function unit(seed: string, label: string) {
  const h = createHmac('sha256', seed).update(label).digest('hex')
  return parseInt(h.slice(0, 12), 16) / 2 ** 48
}

/* ------------------------------------------------------------------ Configuração */

type GiroGratisCfg = { categoria: string; quantidade: number }

async function cfgProbabilidades(q: Queryable) {
  const c = await getConfig<Record<string, unknown>>('poco.probabilidades', q)
  return { value: (c?.value ?? {}) as Record<string, unknown>, provisional: c?.provisional ?? true }
}

async function cfgManivela(q: Queryable): Promise<ManivelaConfig> {
  const c = await getConfig<Partial<ManivelaConfig>>('poco.manivela', q)
  const v = { ...MANIVELA_PADRAO, ...(c?.value ?? {}) }
  const num = (x: unknown, d: number) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : d)
  const arr = (x: unknown, d: number[]) => (Array.isArray(x) && x.length ? x.map((n, i) => num(n, d[Math.min(i, d.length - 1)])) : d)
  return {
    max_acertos: Math.max(0, Math.min(10, Math.floor(num(v.max_acertos, MANIVELA_PADRAO.max_acertos)))),
    reducao_lixo_por_acerto: Math.min(0.2, num(v.reducao_lixo_por_acerto, MANIVELA_PADRAO.reducao_lixo_por_acerto)),
    janelas: arr(v.janelas, MANIVELA_PADRAO.janelas).map((j) => Math.min(0.8, j)),
    periodos_ms: arr(v.periodos_ms, MANIVELA_PADRAO.periodos_ms).map((p) => Math.max(400, p)),
    fator_lento: num(v.fator_lento, MANIVELA_PADRAO.fator_lento),
    rodada_max_ms: num(v.rodada_max_ms, MANIVELA_PADRAO.rodada_max_ms),
  }
}

async function cfgGiroGratis(q: Queryable): Promise<GiroGratisCfg> {
  const c = await getConfig<Partial<GiroGratisCfg>>('poco.giro_gratis_diario', q)
  return { categoria: String(c?.value?.categoria ?? 'dracma_comum'), quantidade: Math.max(0, Math.floor(Number(c?.value?.quantidade ?? 1))) }
}

async function cfgQuantidades(q: Queryable) {
  const c = await getConfig<Record<string, [number, number]>>('poco.quantidades', q)
  const v = c?.value ?? {}
  const faixa = (k: string, d: [number, number]): [number, number] => {
    const f = v[k]
    if (!Array.isArray(f)) return d
    const a = Math.max(1, Math.floor(Number(f[0]) || d[0]))
    return [a, Math.max(a, Math.floor(Number(f[1]) || a))]
  }
  return { fragmento: faixa('fragmento', [1, 2]), essencia: faixa('essencia', [1, 3]) }
}

async function cfgRaridadePesos(q: Queryable): Promise<Record<ItemRarity, number>> {
  const c = await getConfig<Record<string, number>>('poco.raridade_pesos', q)
  const v = c?.value ?? {}
  const base: Record<ItemRarity, number> = { comum: 50, incomum: 30, raro: 14, epico: 5, lendario: 1, arcano: 0 }
  for (const k of Object.keys(base) as ItemRarity[]) if (Number.isFinite(Number(v[k])) && Number(v[k]) >= 0) base[k] = Number(v[k])
  return base
}

/** Parâmetros do minigame derivados do segredo (o ponteiro do cliente é o mesmo que o servidor confere). */
export function manivelaParams(seed: string, cfg: ManivelaConfig, lento: boolean): ManivelaParams {
  const n = cfg.max_acertos
  const rodadas = Array.from({ length: n }, (_, i) => ({
    centro: Number((0.22 + 0.56 * unit(seed, `manivela:centro:${i}`)).toFixed(4)),
    janela: cfg.janelas[Math.min(i, cfg.janelas.length - 1)],
    periodo: Math.round(cfg.periodos_ms[Math.min(i, cfg.periodos_ms.length - 1)] * (lento ? cfg.fator_lento : 1)),
    fase: Number(unit(seed, `manivela:fase:${i}`).toFixed(4)),
  }))
  return { rodadas, rodadaMaxMs: cfg.rodada_max_ms, lento }
}

/* ------------------------------------------------------------------ Leitura */

async function hoje(q: Queryable) {
  const [r] = await run<{ dia: string; prox: string }>(
    q,
    `SELECT to_char((now() AT TIME ZONE $1)::date, 'YYYY-MM-DD') AS dia,
            (extract(epoch FROM ((date_trunc('day', now() AT TIME ZONE $1) + interval '1 day') AT TIME ZONE $1)) * 1000)::bigint AS prox`,
    [TZ],
  )
  return { dia: r.dia, proximoEm: Number(r.prox) }
}

type BaldeRow = { key: string; name: string; description: string | null; rarity: ItemRarity; meta: Record<string, unknown>; possui: boolean }

async function baldes(playerId: string, q: Queryable): Promise<BaldeRow[]> {
  return run<BaldeRow>(
    q,
    `SELECT d.key, d.name, d.description, d.rarity, d.meta,
            (d.key = 'balde:madeira' OR coalesce(i.quantity, 0) > 0) AS possui
       FROM item_defs d
       LEFT JOIN player_items i ON i.item_key = d.key AND i.player_id = $1
      WHERE d.active AND d.meta->>'poco_balde' = 'true'
      ORDER BY coalesce((d.meta->>'ordem')::int, 99), d.key`,
    [playerId],
  )
}

function baldeInfo(b: BaldeRow): PocoBalde {
  const tipo = b.meta.tipo === 'raro' ? 'raro' : b.meta.tipo === 'normal' ? 'normal' : 'inicial'
  return {
    id: b.key.slice('balde:'.length),
    nome: b.name,
    descricao: b.description,
    efeito: typeof b.meta.efeito === 'string' ? b.meta.efeito : 'Nenhum efeito.',
    tipo,
    raridade: b.rarity,
    possui: b.possui,
    provisorio: b.meta.provisorio === true,
  }
}

async function letreiro(q: Queryable): Promise<PocoLetreiro[]> {
  const rows = await run<{ nome: string; item: string; rarity: ItemRarity; categoria: PocoCategoria; quando: Date }>(
    q,
    `SELECT coalesce(nullif(p.character_name, ''), p.name) AS nome, d.name AS item, d.rarity, g.categoria, g.girado_at AS quando
       FROM poco_giros g
       JOIN players p ON p.id = g.player_id
       JOIN item_defs d ON d.key = g.item_key
      WHERE g.categoria IS NOT NULL AND g.categoria <> 'lixo' AND g.revelado_at IS NOT NULL
        AND NOT coalesce(p.is_test, false) AND g.girado_at > now() - interval '30 days'
      ORDER BY g.girado_at DESC
      LIMIT 12`,
  )
  // Owner nunca é identificado: só o nome do personagem, sem cargo.
  return rows.map((r) => ({ nome: r.nome, item: r.item, raridade: r.rarity, categoria: r.categoria, quando: r.quando.getTime() }))
}

type GiroRow = {
  id: string
  moeda: string
  gratis: boolean
  estado: 'lancado' | 'girando' | 'girado' | 'revelado'
  seed: string
  seed_hash: string
  balde: string
  lento: boolean
  manivela_ms: string | null
}

async function giroAberto(playerId: string, q: Queryable, forUpdate = false): Promise<GiroRow | null> {
  const [g] = await run<GiroRow>(
    q,
    `SELECT id, moeda, gratis, estado, seed, seed_hash, balde, lento,
            (extract(epoch FROM (clock_timestamp() - manivela_at)) * 1000)::bigint AS manivela_ms
       FROM poco_giros WHERE player_id = $1 AND estado <> 'revelado' ${forUpdate ? 'FOR UPDATE' : ''}`,
    [playerId],
  )
  return g ?? null
}

async function nomeItem(key: string, q: Queryable) {
  const [d] = await run<{ name: string }>(q, 'SELECT name FROM item_defs WHERE key = $1', [key])
  return d?.name ?? key
}

async function abertoInfo(g: GiroRow, q: Queryable): Promise<PocoGiroAberto> {
  return {
    id: g.id,
    moeda: g.moeda,
    moedaNome: await nomeItem(g.moeda, q),
    gratis: g.gratis,
    estado: g.estado === 'revelado' ? 'girado' : g.estado,
    seedHash: g.seed_hash,
    balde: g.balde,
  }
}

/** Tudo o que a tela do Poço precisa (só dados do próprio jogador + letreiro público). */
export async function getPoco(playerId: string): Promise<PocoPayload> {
  if (!(await hasUnlock(playerId, 'poco'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const ator = await loadActor(playerId)
  if (!ator) throw new RecordError('Registro não encontrado.', 404)
  const tudo = seesAllSystems(normalizeCargo(ator.cargo))

  const [estadoRows, moedasRows, probs, gratisCfg, dia, baldeRows, aberto, faixa] = await Promise.all([
    run<{ apresentado_at: Date | null; balde: string }>(pool, 'SELECT apresentado_at, balde FROM poco_estado WHERE player_id = $1', [playerId]),
    run<{ key: string; name: string; description: string | null; rarity: ItemRarity; quantity: string | null }>(
      pool,
      `SELECT d.key, d.name, d.description, d.rarity, i.quantity
         FROM item_defs d LEFT JOIN player_items i ON i.item_key = d.key AND i.player_id = $1
        WHERE d.kind = 'moeda' AND d.active AND d.meta->>'poco' = 'true'
        ORDER BY CASE d.rarity WHEN 'comum' THEN 0 WHEN 'incomum' THEN 1 WHEN 'raro' THEN 2 WHEN 'epico' THEN 3 WHEN 'lendario' THEN 4 ELSE 5 END, d.key`,
      [playerId],
    ),
    cfgProbabilidades(pool),
    cfgGiroGratis(pool),
    hoje(pool),
    baldes(playerId, pool),
    giroAberto(playerId, pool),
    letreiro(pool),
  ])
  const estado = estadoRows[0]
  const [{ n: usados }] = await run<{ n: string }>(pool, 'SELECT count(*) AS n FROM poco_giros WHERE player_id = $1 AND gratis AND dia = $2::date', [playerId, dia.dia])
  const restantes = Math.max(0, gratisCfg.quantidade - Number(usados))

  const moedas: PocoMoeda[] = moedasRows.map((m) => ({
    key: m.key,
    nome: m.name,
    descricao: m.description,
    raridade: m.rarity,
    quantidade: Number(m.quantity ?? 0),
    categoriaAtiva: !!lerPesos(probs.value[m.key]),
  }))
  const listaBaldes = baldeRows.map(baldeInfo).filter((b) => b.possui || b.tipo !== 'raro' || tudo)
  const baldeAtual = listaBaldes.find((b) => b.id === estado?.balde && b.possui)?.id ?? 'madeira'

  const payload: Extract<PocoPayload, { liberado: true }> = {
    liberado: true,
    apresentado: !!estado?.apresentado_at,
    podePular: tudo || !!estado?.apresentado_at,
    moedas,
    giroGratis: { disponivel: restantes > 0 && !!lerPesos(probs.value[gratisCfg.categoria]), restantes, categoria: gratisCfg.categoria, proximoEm: dia.proximoEm },
    baldes: listaBaldes,
    baldeAtual,
    aberto: aberto ? await abertoInfo(aberto, pool) : null,
    letreiro: faixa,
  }
  if (can(ator, 'config.editar')) {
    const [nota] = await run<{ note: string | null }>(pool, "SELECT note FROM devo_config WHERE key = 'poco.probabilidades'")
    const probabilidades: Record<string, PocoPesos> = {}
    for (const [k, v] of Object.entries(probs.value)) {
      const p = lerPesos(v)
      if (p) probabilidades[k] = p
    }
    payload.owner = { provisorio: probs.provisional, nota: nota?.note ?? null, probabilidades, manivela: await cfgManivela(pool) }
  }
  return payload
}

/* ------------------------------------------------------------------ Apresentação (figura encapuzada) */

/**
 * Fim da cena da neblina: entrega o Dracma de Raridade Incomum UMA vez (idem por jogador) e marca a cena como
 * vista. Chamar de novo não dá outra moeda. `recebeu` = true só na primeira vez.
 */
export async function concluirApresentacao(playerId: string) {
  await requireUnlock(playerId, 'poco')
  return txAs(playerId, async (c) => {
    const [antes] = await run<{ ok: boolean }>(c, 'SELECT EXISTS (SELECT 1 FROM item_ledger WHERE idem_key = $1) AS ok', [CORVO_IDEM(playerId)])
    const saldo = await grantItem({ playerId, item: 'dracma_incomum', quantidade: 1, motivo: 'poco', ref: 'apresentacao', idem: CORVO_IDEM(playerId) }, c)
    await run(
      c,
      `INSERT INTO poco_estado (player_id, apresentado_at) VALUES ($1, now())
       ON CONFLICT (player_id) DO UPDATE SET apresentado_at = coalesce(poco_estado.apresentado_at, now()), updated_at = now()`,
      [playerId],
    )
    return { recebeu: !antes?.ok, saldo }
  })
}

/* ------------------------------------------------------------------ Balde */

export async function escolherBalde(playerId: string, baldeRaw: unknown) {
  await requireUnlock(playerId, 'poco')
  const id = typeof baldeRaw === 'string' && /^[a-z0-9_-]{2,40}$/.test(baldeRaw) ? baldeRaw : ''
  const b = (await baldes(playerId, pool)).find((x) => x.key === `balde:${id}`)
  if (!b) throw new RecordError('Balde desconhecido.', 404)
  if (!b.possui) throw new RecordError('Você ainda não tem este balde.', 403)
  await run(
    pool,
    `INSERT INTO poco_estado (player_id, balde) VALUES ($1, $2)
     ON CONFLICT (player_id) DO UPDATE SET balde = EXCLUDED.balde, updated_at = now()`,
    [playerId, id],
  )
  return { balde: id }
}

/* ------------------------------------------------------------------ Lançar moeda */

export async function lancarMoeda(playerId: string, input: { moeda?: unknown; gratis?: unknown }) {
  await requireUnlock(playerId, 'poco')
  const gratis = input.gratis === true
  return txAs(playerId, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext('poco:' || $1))", [playerId])
    if (await giroAberto(playerId, c)) throw new RecordError('Já há uma moeda no poço. Gire a manivela e inspecione o balde primeiro.', 409)

    const probs = await cfgProbabilidades(c)
    let moeda: string
    let gratisN: number | null = null
    const dia = await hoje(c)
    if (gratis) {
      const cfg = await cfgGiroGratis(c)
      moeda = cfg.categoria
      const [{ n }] = await run<{ n: string }>(c, 'SELECT count(*) AS n FROM poco_giros WHERE player_id = $1 AND gratis AND dia = $2::date', [playerId, dia.dia])
      if (Number(n) >= cfg.quantidade) throw new RecordError('O giro grátis de hoje já foi usado.', 409)
      gratisN = Number(n) + 1
    } else {
      moeda = typeof input.moeda === 'string' ? input.moeda : ''
      const [def] = await run<{ key: string }>(c, "SELECT key FROM item_defs WHERE key = $1 AND kind = 'moeda' AND active AND meta->>'poco' = 'true'", [moeda])
      if (!def) throw new RecordError('Esta moeda não serve para o poço.', 400)
    }
    if (!lerPesos(probs.value[moeda])) throw new RecordError('Esta categoria do poço ainda não foi definida.', 409)

    const [est] = await run<{ balde: string }>(c, 'SELECT balde FROM poco_estado WHERE player_id = $1', [playerId])
    const lista = await baldes(playerId, c)
    const balde = lista.find((b) => b.key === `balde:${est?.balde}` && b.possui) ? (est?.balde as string) : 'madeira'

    const seed = randomBytes(32).toString('hex')
    const [g] = await run<{ id: string }>(
      c,
      `INSERT INTO poco_giros (player_id, moeda, gratis, dia, gratis_n, balde, seed, seed_hash)
       VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8) RETURNING id`,
      [playerId, moeda, gratis, dia.dia, gratisN, balde, seed, sha256(seed)],
    )
    // A moeda é consumida uma vez só (idem por giro), na mesma transação do giro.
    if (!gratis) await consumeItem({ playerId, item: moeda, quantidade: 1, motivo: 'poco', ref: g.id, idem: `poco:giro:${g.id}:moeda` }, c)
    const aberto = await giroAberto(playerId, c)
    return abertoInfo(aberto as GiroRow, c)
  })
}

/* ------------------------------------------------------------------ Manivela */

export async function iniciarManivela(playerId: string, input: { lento?: unknown }) {
  await requireUnlock(playerId, 'poco')
  return txAs(playerId, async (c) => {
    const g = await giroAberto(playerId, c, true)
    if (!g) throw new RecordError('Lance uma moeda antes de girar a manivela.', 409)
    if (g.estado !== 'lancado') throw new RecordError('A manivela já foi girada.', 409)
    const lento = input.lento === true
    await run(c, "UPDATE poco_giros SET estado = 'girando', manivela_at = clock_timestamp(), lento = $2 WHERE id = $1", [g.id, lento])
    return manivelaParams(g.seed, await cfgManivela(c), lento)
  })
}

type ItemDef = { key: string; kind: ItemKind; name: string; description: string | null; rarity: ItemRarity; meta: Record<string, unknown> }

async function escolherItem(c: PoolClient, playerId: string, categoria: PocoCategoria, seed: string): Promise<ItemDef | null> {
  if (categoria === 'lixo') return null
  if (categoria === 'fragmento') {
    const [d] = await run<ItemDef>(c, "SELECT key, kind, name, description, rarity, meta FROM item_defs WHERE key = 'fragmento_arcano'")
    return d ?? null
  }
  const cand = await run<ItemDef>(
    c,
    `SELECT d.key, d.kind, d.name, d.description, d.rarity, d.meta
       FROM item_defs d
      WHERE d.kind = $2 AND d.active
        AND (CASE WHEN d.kind = 'essencia' THEN coalesce(d.meta->>'poco', 'true') <> 'false' ELSE d.meta->>'poco' = 'true' END)
        AND (d.stackable OR NOT EXISTS (SELECT 1 FROM player_items i WHERE i.player_id = $1 AND i.item_key = d.key AND i.quantity > 0))
      ORDER BY d.key`,
    [playerId, categoria],
  )
  if (!cand.length) return null
  const u = unit(seed, 'item')
  if (categoria !== 'cosmetico') return cand[Math.floor(u * cand.length)]
  // Cosméticos: peso pela raridade (chances reduzidas para os raros; DIRECAO-3 / texto do dono §7).
  const pesos = await cfgRaridadePesos(c)
  const ws = cand.map((d) => pesos[d.rarity] ?? 0)
  const total = ws.reduce((a, b) => a + b, 0)
  if (total <= 0) return null
  let alvo = u * total
  for (let i = 0; i < cand.length; i++) {
    if (alvo < ws[i]) return cand[i]
    alvo -= ws[i]
  }
  return cand[cand.length - 1]
}

/**
 * Gira a manivela: confere os toques (instantes) contra os parâmetros derivados do seed, sorteia com os pesos
 * da configuração e entrega o prêmio. Sem minigame (estado 'lancado'), conta 0 acertos.
 */
export async function girarManivela(playerId: string, input: { toques?: unknown }) {
  await requireUnlock(playerId, 'poco')
  return txAs(playerId, async (c) => {
    const g = await giroAberto(playerId, c, true)
    if (!g) throw new RecordError('Lance uma moeda antes de girar a manivela.', 409)
    if (g.estado === 'girado') throw new RecordError('O balde já subiu. Inspecione o balde.', 409)
    const cfg = await cfgManivela(c)
    let acertos = 0
    let toques: number[] = []
    if (g.estado === 'girando') {
      const t = toquesValidos(input.toques ?? [], cfg.max_acertos)
      if (!t) throw new RecordError('Toques inválidos.', 400)
      // O cliente só começa a contar depois da resposta de "iniciar": nenhum toque pode ser posterior ao tempo
      // real decorrido no servidor (tolerância de 250 ms para relógio e rede).
      const decorrido = Number(g.manivela_ms ?? 0)
      if (t.length && t[t.length - 1] > decorrido + 250) throw new RecordError('Toques fora do tempo.', 400)
      toques = t
      acertos = avaliarToques(manivelaParams(g.seed, cfg, g.lento), t)
    }

    const probs = await cfgProbabilidades(c)
    const base = lerPesos(probs.value[g.moeda])
    if (!base) throw new RecordError('Esta categoria do poço ainda não foi definida.', 409)
    const pesos = aplicarManivela(base, acertos, cfg)
    const rolagem = unit(g.seed, 'categoria')
    const sorteada = categoriaPorRolagem(pesos, rolagem)

    let categoria: PocoCategoria = sorteada
    let item = await escolherItem(c, playerId, categoria, g.seed)
    // Sem item elegível (ex.: já tem todas as cápsulas, nenhum cosmético no Poço): vira fragmento.
    if (categoria !== 'lixo' && !item) {
      categoria = 'fragmento'
      item = await escolherItem(c, playerId, 'fragmento', g.seed)
      if (!item) categoria = 'lixo'
    }

    let quantidade = 0
    let lixo: string | null = null
    if (categoria === 'lixo') {
      lixo = POCO_LIXO[Math.floor(unit(g.seed, 'lixo') * POCO_LIXO.length)].id
    } else if (item) {
      quantidade = 1
      if (categoria === 'fragmento' || categoria === 'essencia') {
        const faixas = await cfgQuantidades(c)
        const [min, max] = faixas[categoria]
        const [bd] = await run<{ mult: string | null }>(c, "SELECT meta->>'mult_qtd' AS mult FROM item_defs WHERE key = $1", [`balde:${g.balde}`])
        const mult = Math.max(1, Number(bd?.mult ?? 1) || 1)
        quantidade = Math.ceil((min + Math.floor(unit(g.seed, 'quantidade') * (max - min + 1))) * mult)
      }
      await grantItem({ playerId, item: item.key, quantidade, motivo: 'poco', ref: g.id, idem: `poco:giro:${g.id}:premio` }, c)
    }

    await run(
      c,
      `UPDATE poco_giros SET estado = 'girado', toques = $2, acertos = $3, pesos = $4, provisorio = $5, rolagem = $6,
              categoria_sorteada = $7, categoria = $8, item_key = $9, lixo = $10, quantidade = $11, girado_at = clock_timestamp()
        WHERE id = $1`,
      [g.id, JSON.stringify(toques), acertos, JSON.stringify(pesos), probs.provisional, rolagem, sorteada, categoria, item?.key ?? null, lixo, quantidade],
    )
    return { acertos, maxAcertos: cfg.max_acertos }
  })
}

/* ------------------------------------------------------------------ Inspecionar balde */

export async function inspecionarBalde(playerId: string): Promise<PocoResultado> {
  await requireUnlock(playerId, 'poco')
  return txAs(playerId, async (c) => {
    const [g] = await run<{
      id: string
      moeda: string
      gratis: boolean
      categoria: PocoCategoria
      acertos: number
      quantidade: number
      lixo: string | null
      seed: string
      seed_hash: string
      item_key: string | null
    }>(
      c,
      `UPDATE poco_giros SET estado = 'revelado', revelado_at = clock_timestamp()
        WHERE player_id = $1 AND estado = 'girado'
        RETURNING id, moeda, gratis, categoria, acertos, quantidade, lixo, seed, seed_hash, item_key`,
      [playerId],
    )
    if (!g) throw new RecordError('O balde está vazio.', 409)
    const [d] = g.item_key ? await run<ItemDef>(c, 'SELECT key, kind, name, description, rarity, meta FROM item_defs WHERE key = $1', [g.item_key]) : []
    const l = g.lixo ? lixoPorId(g.lixo) : null
    return {
      id: g.id,
      moeda: g.moeda,
      gratis: g.gratis,
      categoria: g.categoria,
      acertos: g.acertos ?? 0,
      quantidade: g.quantidade ?? 0,
      item: d ? { key: d.key, kind: d.kind, nome: d.name, descricao: d.description, raridade: d.rarity, meta: d.meta ?? {} } : null,
      lixo: l,
      seed: g.seed,
      seedHash: g.seed_hash,
    }
  })
}
