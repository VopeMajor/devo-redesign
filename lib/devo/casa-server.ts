import 'server-only'
import { randomInt, randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { drainTime } from './arcade/server'
import { getCard } from './cards'
import {
  ALVOS_RARIDADE,
  type CasaPayload,
  chanceDoNivel,
  COMBINACAO_MAX,
  type ConfeccaoRegras,
  espacosDoNivel,
  lerReceitas,
  lerRegras,
  NIVEL_MAX,
  poolDaRaridade,
  RECEITA_MAX_MATERIAIS,
  RECEITA_RARIDADE,
  type Receita,
  type ReceitaConhecida,
  receitaDe,
  type Tentativa,
  type TentativaModo,
  type TentativaStatus,
} from './confeccao'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { consumeItem, deliverCard, grantItem, pendingCardCount } from './inventario-server'
import { getPacote, itemDoPacote, PACOTES, type PacotePremio, sortearPremio } from './pacotes'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, hasUnlock, setConfig } from './progresso-server'
import type { Rarity } from './types'

/**
 * Casa — servidor da Confecção de Cartas e dos Pacotes (texto do dono: docs/redesign/CASA-CONFECCAO-dono.md).
 *
 * Tempo: o custo sai do pulso NA HORA (player_saves.timerEndsAt, mantendo `regras.reserva` minutos), na mesma
 * transação que cria a tentativa. Cartas: vivem no save do cliente; os materiais saem do save aqui (e o /api/save
 * descarta esses uids dali em diante: `uidsNaConfeccao`). Resultado, cartas devolvidas e prêmios de pacote chegam por
 * card_deliveries (o cliente resgata com POST /api/eu {action:'cartas.resgatar'}).
 *
 * Sem cron: cada leitura/ação liquida as tentativas prontas (`liquidar`), de forma idempotente (status + idem).
 * A chance é a do nível da mesa NO INÍCIO da tentativa (gravada na linha).
 */

const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para receber as chaves da sua casa.'
const MIN = 60_000

/* ------------------------------------------------------------------ Configuração */

async function cfg(q: Queryable = pool) {
  const [r, rec] = await Promise.all([getConfig('confeccao.regras', q), getConfig('confeccao.receitas', q)])
  return { regras: lerRegras(r?.value), receitas: lerReceitas(rec?.value), provisorio: !r || r.provisional }
}

/* ------------------------------------------------------------------ Tempo */

/** Tira minutos do pulso mantendo a reserva. Sem Tempo → 409 (a transação inteira volta). Devolve o delta em ms. */
async function debitar(c: PoolClient, playerId: string, minutos: number, reserva: number) {
  const min = Math.floor(minutos)
  if (!Number.isFinite(min) || min <= 0) return 0
  const [paid] = await run<{ t: string }>(
    c,
    `UPDATE player_saves SET data = jsonb_set(data, '{timerEndsAt}', to_jsonb((data->>'timerEndsAt')::bigint - $2::bigint)), updated_at = now()
      WHERE player_id = $1 AND data ? 'timerEndsAt' AND (data->>'timerEndsAt')::bigint - $2::bigint > $3::bigint
      RETURNING data->>'timerEndsAt' AS t`,
    [playerId, min * MIN, Date.now() + reserva * MIN],
  )
  if (!paid) {
    const [s] = await run<{ t: string | null }>(c, "SELECT data->>'timerEndsAt' AS t FROM player_saves WHERE player_id = $1", [playerId])
    throw new RecordError(
      s?.t ? `Tempo insuficiente. Seu pulso precisa manter pelo menos ${reserva} minutos depois de pagar.` : 'Seu Tempo ainda não foi sincronizado. Tente de novo em instantes.',
      409,
    )
  }
  return -min * MIN
}

/* ------------------------------------------------------------------ Cartas do save */

type Material = { uid: string; cardId: string }

/** Tira as cartas do save (linha travada). Alguma ausente ou repetida → nada muda. */
async function retirarDoSave(c: PoolClient, playerId: string, uidsRaw: unknown, max: number): Promise<Material[]> {
  if (!Array.isArray(uidsRaw)) throw new RecordError('Escolha as cartas.')
  const uids = uidsRaw.filter((u): u is string => typeof u === 'string').map((u) => u.slice(0, 80))
  if (!uids.length) throw new RecordError('Escolha as cartas.')
  if (uids.length > max) throw new RecordError(`No máximo ${max} cartas por vez.`)
  if (new Set(uids).size !== uids.length) throw new RecordError('A mesma carta foi escolhida duas vezes.')
  const [row] = await run<{ inv: { uid: string; cardId: string }[] | null }>(
    c,
    `SELECT (SELECT jsonb_agg(jsonb_build_object('uid', e->>'uid', 'cardId', e->>'cardId'))
               FROM jsonb_array_elements(coalesce(data->'inventory', '[]'::jsonb)) e WHERE e->>'uid' = ANY($2)) AS inv
       FROM player_saves WHERE player_id = $1 FOR UPDATE`,
    [playerId, uids],
  )
  const achadas = new Map((row?.inv ?? []).map((m) => [m.uid, m.cardId]))
  if (uids.some((u) => !achadas.has(u))) throw new RecordError('Alguma dessas cartas não está mais no seu inventário. Atualize e tente de novo.', 404)
  const materiais = uids.map((uid) => ({ uid, cardId: achadas.get(uid)! }))
  for (const m of materiais) {
    try {
      getCard(m.cardId)
    } catch {
      throw new RecordError('Carta desconhecida.', 400)
    }
  }
  await run(
    c,
    `UPDATE player_saves SET data = jsonb_set(data, '{inventory}',
        coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e WHERE NOT (e->>'uid' = ANY($2))), '[]'::jsonb)),
        updated_at = now()
      WHERE player_id = $1`,
    [playerId, uids],
  )
  return materiais
}

/** Uids que entraram numa tentativa: o /api/save não deixa uma cópia antiga do save trazê-los de volta. */
export async function uidsNaConfeccao(playerId: string, q: Queryable = pool): Promise<Set<string>> {
  if (!UUID_RE.test(playerId)) return new Set()
  const rows = await run<{ uid: string }>(q, 'SELECT card_uid AS uid FROM confeccao_materiais WHERE player_id = $1', [playerId]).catch(() => [])
  return new Set(rows.map((r) => r.uid))
}

/* ------------------------------------------------------------------ Mesa */

async function nivelDaMesa(q: Queryable, playerId: string, lock = false) {
  await run(q, 'INSERT INTO confeccao_mesas (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [playerId])
  const [m] = await run<{ nivel: number }>(q, `SELECT nivel FROM confeccao_mesas WHERE player_id = $1${lock ? ' FOR UPDATE' : ''}`, [playerId])
  return Math.min(NIVEL_MAX, Math.max(1, m?.nivel ?? 1))
}

function vistaMesa(regras: ConfeccaoRegras, nivel: number) {
  const prox = nivel < NIVEL_MAX ? nivel + 1 : null
  return {
    nivel,
    chance: chanceDoNivel(nivel),
    espacos: espacosDoNivel(regras, nivel),
    proximo: prox ? { nivel: prox, chance: chanceDoNivel(prox), espacos: espacosDoNivel(regras, prox), minutos: regras.aprimorar[prox - 2] ?? 0 } : null,
  }
}

/* ------------------------------------------------------------------ Tentativas */

type TRow = {
  id: string
  modo: TentativaModo
  alvo: string | null
  receita_id: string | null
  resultado_previsto: string | null
  materiais: Material[]
  minutos: number
  chance: number
  nivel_mesa: number
  criada_em: Date
  pronta_em: Date
  status: TentativaStatus
  resultado: string | null
  descobriu: boolean
  resolvida_em: Date | null
}

const vista = (r: TRow): Tentativa => ({
  id: r.id,
  modo: r.modo,
  alvo: (r.alvo as Rarity | null) ?? null,
  materiais: (r.materiais ?? []).map((m) => m.cardId),
  minutos: r.minutos,
  chance: r.chance,
  nivelMesa: r.nivel_mesa,
  criadaEm: r.criada_em.getTime(),
  prontaEm: r.pronta_em.getTime(),
  status: r.status,
  resultado: r.resultado,
  descobriu: r.descobriu,
  resolvidaEm: r.resolvida_em?.getTime() ?? null,
})

/**
 * Resolve as tentativas prontas do jogador. Cada uma numa transação curta, travada (SKIP LOCKED: duas leituras
 * ao mesmo tempo não sorteiam duas vezes). Experimento → as cartas voltam; senão sorteia com a chance gravada.
 */
async function liquidar(playerId: string) {
  const prontas = await run<{ id: string }>(pool, "SELECT id FROM confeccao_tentativas WHERE player_id = $1 AND status = 'andamento' AND pronta_em <= now()", [playerId])
  for (const { id } of prontas) {
    await txAs(null, async (c) => {
      const [t] = await run<TRow>(c, "SELECT * FROM confeccao_tentativas WHERE id = $1 AND status = 'andamento' FOR UPDATE SKIP LOCKED", [id])
      if (!t) return
      if (t.modo === 'experimento') {
        for (const [i, m] of (t.materiais ?? []).entries()) {
          await deliverCard({ playerId, cardId: m.cardId, origem: 'Confecção · combinação sem efeito', ref: t.id, idem: `confeccao:${t.id}:volta:${i}` }, c)
        }
        await run(c, "UPDATE confeccao_tentativas SET status = 'sem_receita', resolvida_em = now() WHERE id = $1", [t.id])
        return
      }
      const sucesso = randomInt(100) < t.chance
      if (!sucesso) {
        await run(c, "UPDATE confeccao_tentativas SET status = 'falha', resolvida_em = now() WHERE id = $1", [t.id])
        return
      }
      let carta: string
      if (t.modo === 'receita' && t.resultado_previsto) carta = t.resultado_previsto
      else {
        const pool = poolDaRaridade((t.alvo as Rarity) ?? 'incomum')
        carta = pool[randomInt(pool.length)]
      }
      await deliverCard({ playerId, cardId: carta, origem: t.modo === 'receita' ? 'Confecção · combinação especial' : 'Confecção de Cartas', ref: t.id, idem: `confeccao:${t.id}` }, c)
      let descobriu = false
      if (t.modo === 'receita' && t.receita_id) {
        const ins = await run(c, 'INSERT INTO confeccao_descobertas (player_id, receita_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING receita_id', [playerId, t.receita_id])
        descobriu = ins.length > 0
      }
      await run(c, "UPDATE confeccao_tentativas SET status = 'sucesso', resultado = $2, descobriu = $3, resolvida_em = now() WHERE id = $1", [t.id, carta, descobriu])
    })
  }
}

/* ------------------------------------------------------------------ Livro de Receitas */

async function livro(playerId: string, receitas: Receita[]) {
  const [corp] = await run<{ id: string; nome: string }>(
    pool,
    'SELECT c.id, c.nome FROM corporacao_membros m JOIN corporacoes c ON c.id = m.corporacao_id WHERE m.player_id = $1',
    [playerId],
  ).catch(() => [])
  const rows = await run<{ receita_id: string; player_id: string; nome: string; em: Date }>(
    pool,
    `SELECT d.receita_id, d.player_id, p.name AS nome, d.em
       FROM confeccao_descobertas d JOIN players p ON p.id = d.player_id
      WHERE d.player_id = $1 OR ($2::uuid IS NOT NULL AND d.player_id IN (SELECT player_id FROM corporacao_membros WHERE corporacao_id = $2))
      ORDER BY (d.player_id = $1) DESC, d.em`,
    [playerId, corp?.id ?? null],
  )
  const porId = new Map(receitas.map((r) => [r.id, r]))
  const out: ReceitaConhecida[] = []
  const vistas = new Set<string>()
  for (const r of rows) {
    const rec = porId.get(r.receita_id)
    if (!rec || vistas.has(rec.id)) continue
    vistas.add(rec.id)
    out.push({ id: rec.id, materiais: rec.materiais, resultado: rec.resultado, minutos: rec.minutos, espera: rec.espera, por: r.player_id === playerId ? 'voce' : r.nome, em: r.em.getTime() })
  }
  return { livro: out, corporacao: corp?.nome ?? null }
}

/* ------------------------------------------------------------------ Leitura */

export async function getCasa(playerId: string): Promise<CasaPayload> {
  if (!(await hasUnlock(playerId, 'galo_casa'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  await liquidar(playerId)
  const ator = await requireActor(playerId)
  const { regras, receitas, provisorio } = await cfg()
  const [nivel, linhas, lv, pac, pendentes, timeDeltaMs] = await Promise.all([
    nivelDaMesa(pool, playerId),
    run<TRow>(pool, 'SELECT * FROM confeccao_tentativas WHERE player_id = $1 ORDER BY criada_em DESC LIMIT 60', [playerId]),
    livro(playerId, receitas),
    run<{ item_key: string; quantity: string }>(pool, "SELECT item_key, quantity FROM player_items WHERE player_id = $1 AND item_key LIKE 'pacote:%' AND quantity > 0", [playerId]),
    pendingCardCount(playerId),
    drainTime(playerId),
  ])
  const ts = linhas.map(vista)
  const owner = ator.cargo === 'owner'
  return {
    liberado: true,
    agora: Date.now(),
    mesa: vistaMesa(regras, nivel),
    regras,
    provisorio,
    andamento: ts.filter((t) => t.status === 'andamento').reverse(),
    historico: ts.filter((t) => t.status !== 'andamento'),
    livro: lv.livro,
    corporacao: lv.corporacao,
    pacotes: PACOTES.map((p) => ({ id: p.id, quantidade: Number(pac.find((x) => x.item_key === itemDoPacote(p.id))?.quantity ?? 0) })),
    cartasPendentes: pendentes,
    timeDeltaMs,
    ...(owner ? { receitas } : {}),
  }
}

/* ------------------------------------------------------------------ Ações */

const idemDe = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(v) ? v : randomUUID())

/**
 * Começa uma fabricação. `modo: 'raridade'` + `alvo` (Incomum…Lendária) + exatamente N cartas da raridade de baixo;
 * `modo: 'combinacao'` + 2..20 cartas quaisquer: se formam uma receita, vale a receita; senão é um experimento.
 */
export async function iniciarConfeccao(playerId: string, input: { modo?: unknown; alvo?: unknown; uids?: unknown; idem?: unknown }) {
  const idem = `confeccao:${playerId}:${idemDe(input.idem)}`
  return txAs(playerId, async (c) => {
    if (!(await hasUnlock(playerId, 'galo_casa', c))) throw new RecordError(MOTIVO_TRANCADO, 403)
    const [ja] = await run<{ id: string }>(c, 'SELECT id FROM confeccao_tentativas WHERE idem_key = $1', [idem])
    if (ja) throw new RecordError('Esta fabricação já foi iniciada.', 409)
    const { regras, receitas } = await cfg(c)
    const nivel = await nivelDaMesa(c, playerId, true)
    const [{ n }] = await run<{ n: string }>(c, "SELECT count(*) AS n FROM confeccao_tentativas WHERE player_id = $1 AND status = 'andamento'", [playerId])
    const espacos = espacosDoNivel(regras, nivel)
    if (Number(n) >= espacos) throw new RecordError(espacos === 1 ? 'Sua mesa já está ocupada. Espere a fabricação terminar ou aprimore a mesa.' : `Todos os ${espacos} espaços da mesa estão ocupados.`, 409)

    let modo: TentativaModo
    let alvo: Rarity | null = null
    let receita: Receita | null = null
    let custo: { minutos: number; espera: number }
    let materiais: Material[]
    if (input.modo === 'raridade') {
      if (!ALVOS_RARIDADE.includes(input.alvo as Rarity)) throw new RecordError('Escolha a raridade desejada.')
      alvo = input.alvo as Rarity
      const regra = RECEITA_RARIDADE[alvo]!
      materiais = await retirarDoSave(c, playerId, input.uids, regra.qtd)
      if (materiais.length !== regra.qtd) throw new RecordError(`São necessárias exatamente ${regra.qtd} cartas.`)
      if (materiais.some((m) => getCard(m.cardId).rarity !== regra.de)) throw new RecordError('Todas as cartas precisam ser da mesma raridade, logo abaixo da desejada.')
      modo = 'raridade'
      custo = regras.raridade[alvo]
    } else if (input.modo === 'combinacao') {
      materiais = await retirarDoSave(c, playerId, input.uids, Math.max(COMBINACAO_MAX, RECEITA_MAX_MATERIAIS))
      if (materiais.length < 2) throw new RecordError('Uma combinação precisa de pelo menos duas cartas.')
      receita = receitaDe(
        receitas,
        materiais.map((m) => m.cardId),
      )
      modo = receita ? 'receita' : 'experimento'
      alvo = receita ? getCard(receita.resultado).rarity : null
      custo = receita ? { minutos: receita.minutos, espera: receita.espera } : regras.experimento
    } else throw new RecordError('Modo de fabricação inválido.')

    const chance = chanceDoNivel(nivel)
    const [t] = await run<TRow>(
      c,
      `INSERT INTO confeccao_tentativas (player_id, modo, alvo, receita_id, resultado_previsto, materiais, minutos, chance, nivel_mesa, pronta_em, idem_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() + make_interval(mins => $10), $11) RETURNING *`,
      [playerId, modo, alvo, receita?.id ?? null, receita?.resultado ?? null, JSON.stringify(materiais), custo.minutos, chance, nivel, custo.espera, idem],
    )
    for (const m of materiais) {
      await run(c, 'INSERT INTO confeccao_materiais (player_id, card_uid, tentativa_id) VALUES ($1, $2, $3)', [playerId, m.uid, t.id]).catch((err) => {
        throw /duplicate key/.test(String((err as Error)?.message)) ? new RecordError('Uma dessas cartas já foi usada na Confecção.', 409) : err
      })
    }
    const timeDeltaMs = await debitar(c, playerId, custo.minutos, regras.reserva)
    return { tentativa: vista(t), uids: materiais.map((m) => m.uid), timeDeltaMs }
  })
}

/** Aprimora a mesa um nível (paga o Tempo da tabela). Repetir o mesmo nível não cobra de novo. */
export async function aprimorarMesa(playerId: string, input: { para?: unknown }) {
  return txAs(playerId, async (c) => {
    if (!(await hasUnlock(playerId, 'galo_casa', c))) throw new RecordError(MOTIVO_TRANCADO, 403)
    const { regras } = await cfg(c)
    const nivel = await nivelDaMesa(c, playerId, true)
    const para = Math.floor(Number(input.para))
    if (para !== nivel + 1) throw new RecordError(nivel >= NIVEL_MAX ? 'Sua mesa já está no nível máximo.' : 'A mesa mudou. Atualize e tente de novo.', 409)
    const minutos = regras.aprimorar[para - 2] ?? 0
    const ins = await run(c, 'INSERT INTO confeccao_aprimoramentos (player_id, nivel, minutos) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING nivel', [playerId, para, minutos])
    if (!ins.length) throw new RecordError('Este aprimoramento já foi feito.', 409)
    await run(c, 'UPDATE confeccao_mesas SET nivel = $2, atualizada_em = now() WHERE player_id = $1', [playerId, para])
    const timeDeltaMs = await debitar(c, playerId, minutos, regras.reserva)
    return { mesa: vistaMesa(regras, para), timeDeltaMs }
  })
}

/** Abre um Pacote do inventário: consome 1 e sorteia pela tabela. Carta → card_deliveries; item → inventário. */
export async function abrirPacote(playerId: string, input: { pacote?: unknown; idem?: unknown }): Promise<{ premio: PacotePremio; cartasPendentes: number }> {
  const p = typeof input.pacote === 'string' ? getPacote(input.pacote) : null
  if (!p) throw new RecordError('Pacote desconhecido.')
  const idem = `pacote:${playerId}:${idemDe(input.idem)}`
  return txAs(playerId, async (c) => {
    const [ja] = await run<{ premio: PacotePremio }>(c, 'SELECT premio FROM pacote_aberturas WHERE idem_key = $1', [idem])
    if (ja) return { premio: ja.premio, cartasPendentes: await pendingCardCount(playerId, c) }
    await consumeItem({ playerId, item: itemDoPacote(p.id), quantidade: 1, motivo: 'pacote', ref: p.id, idem }, c).catch((err) => {
      throw err instanceof RecordError && err.status === 409 ? new RecordError('Você não tem este pacote.', 409) : err
    })
    const premio = sortearPremio(p, randomInt(1_000_000) / 1_000_000)
    if (premio.tipo === 'carta') await deliverCard({ playerId, cardId: premio.cardId, origem: p.nome, ref: p.id, idem: `${idem}:carta` }, c)
    else await grantItem({ playerId, item: premio.item, quantidade: 1, motivo: 'pacote', ref: p.id, idem: `${idem}:item` }, c)
    await run(c, 'INSERT INTO pacote_aberturas (player_id, pacote, premio, idem_key) VALUES ($1, $2, $3, $4)', [playerId, p.id, JSON.stringify(premio), idem])
    return { premio, cartasPendentes: await pendingCardCount(playerId, c) }
  })
}

/* ------------------------------------------------------------------ Mesa do Owner */

export async function salvarRegras(atorId: string, valor: unknown, provisorio: unknown) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'config.editar')
  const regras = lerRegras(valor)
  await setConfig(atorId, 'confeccao.regras', regras, provisorio !== false)
  return regras
}

export async function salvarReceitas(atorId: string, valor: unknown) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'config.editar')
  if (!Array.isArray(valor)) throw new RecordError('Lista de receitas inválida.')
  const receitas = lerReceitas(valor)
  if (receitas.length !== valor.length) throw new RecordError('Alguma receita está incompleta: id (letras minúsculas), ao menos duas cartas e o resultado.')
  await setConfig(atorId, 'confeccao.receitas', receitas, false)
  return receitas
}
