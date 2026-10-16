import 'server-only'
import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { drainTime } from './arcade/server'
import { getCard } from './cards'
import { can, seesAllSystems } from './cargos'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { creditMinutes, deliverCard, pendingCardCount } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, hasUnlock, requireUnlock } from './progresso-server'
import {
  atendeRaridade,
  edicaoEncerrada,
  isRarity,
  lerBandeja,
  lerCalendario,
  lerContratos,
  RARIDADE_ROTULO,
  relogioSalao,
  repasse,
  SALAO_MAX_MIN,
  type SalaoAnuncio,
  type SalaoAnuncioTipo,
  type SalaoAvaliacao,
  type SalaoBandejaCfg,
  type SalaoContrato,
  type SalaoEvento,
  type SalaoLote,
  type SalaoLoteStatus,
  type SalaoOferta,
  type SalaoPayload,
  type SalaoRelogio,
} from './salao'
import type { Rarity } from './types'

/**
 * Salão das Máscaras — servidor. Contrato: docs/redesign/FUNDACAO.md §12.
 *
 * Moeda: Tempo (minutos). Débitos saem do pulso NA HORA (player_saves.timerEndsAt, com reserva mínima — o pulso
 * nunca fica negativo); créditos entram pelo livro-caixa do Tempo (arcade_profiles.time_pending_ms) e o cliente
 * recebe `timeDeltaMs` na próxima resposta. Todo movimento passa por salao_movimentos com idem_key único.
 *
 * Cartas: vivem no save do cliente. Enviar à Bandeja / vender no Mercado tira a carta do save na mesma transação
 * (e o /api/save descarta o uid dali em diante: `uidsNoSalao`). Arremate, compra e devolução chegam por
 * card_deliveries (o cliente resgata com POST /api/eu {action:'cartas.resgatar'}).
 *
 * Edições: calculadas da configuração (âncora + intervalo; Owner pode forçar). Não há cron: cada leitura/ação
 * liquida as edições encerradas (`liquidar`), de forma idempotente (status + idem por lote).
 */

const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para entrar no Salão das Máscaras.'
const MIN = 60_000

/* ------------------------------------------------------------------ Configuração */

type Cfg = {
  calendario: ReturnType<typeof lerCalendario>
  bandeja: SalaoBandejaCfg
  contratos: SalaoContrato[]
  anuncios: { custo_propaganda: number; duracao_dias: number }
  provisorio: boolean
}

async function cfg(q: Queryable = pool): Promise<Cfg> {
  const [cal, ban, con, anu] = await Promise.all([
    getConfig('salao.calendario', q),
    getConfig('salao.bandeja', q),
    getConfig('salao.contratos', q),
    getConfig<Record<string, unknown>>('salao.anuncios', q),
  ])
  const a = anu?.value ?? {}
  return {
    calendario: lerCalendario(cal?.value),
    bandeja: lerBandeja(ban?.value),
    contratos: lerContratos(con?.value),
    anuncios: {
      custo_propaganda: Math.max(0, Math.min(SALAO_MAX_MIN, Math.floor(Number(a.custo_propaganda ?? 60)) || 0)),
      duracao_dias: Math.max(1, Math.min(60, Math.floor(Number(a.duracao_dias ?? 9)) || 9)),
    },
    provisorio: [cal, ban, con, anu].some((c) => !c || c.provisional),
  }
}

async function contratoDe(playerId: string, c: Cfg, q: Queryable): Promise<SalaoContrato> {
  const [e] = await run<{ contrato: string }>(q, 'SELECT contrato FROM salao_estado WHERE player_id = $1', [playerId])
  return c.contratos.find((k) => k.id === e?.contrato) ?? c.contratos[0]
}

/* ------------------------------------------------------------------ Tempo (livro do Salão) */

/**
 * Debita minutos do pulso (o mesmo mecanismo das apostas da Sala de Jogos), mantendo `reserva` minutos.
 * Sem Tempo suficiente → 409 e nada muda (a transação inteira volta). Devolve o delta em ms (negativo).
 */
async function debitar(c: PoolClient, input: { playerId: string; minutos: number; motivo: string; ref: string | null; idem: string; reserva: number }) {
  const min = Math.floor(input.minutos)
  if (!Number.isFinite(min) || min <= 0) return 0
  const [mov] = await run<{ id: string }>(
    c,
    `INSERT INTO salao_movimentos (player_id, minutos, motivo, ref, idem_key) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,
    [input.playerId, -min, input.motivo, input.ref, input.idem],
  )
  if (!mov) throw new RecordError('Esta operação já foi registrada.', 409)
  const [paid] = await run<{ t: string }>(
    c,
    `UPDATE player_saves SET data = jsonb_set(data, '{timerEndsAt}', to_jsonb((data->>'timerEndsAt')::bigint - $2::bigint)), updated_at = now()
      WHERE player_id = $1 AND data ? 'timerEndsAt' AND (data->>'timerEndsAt')::bigint - $2::bigint > $3::bigint
      RETURNING data->>'timerEndsAt' AS t`,
    [input.playerId, min * MIN, Date.now() + input.reserva * MIN],
  )
  if (!paid) {
    const [s] = await run<{ t: string | null }>(c, "SELECT data->>'timerEndsAt' AS t FROM player_saves WHERE player_id = $1", [input.playerId])
    throw new RecordError(
      s?.t
        ? `Tempo insuficiente. Seu pulso precisa manter pelo menos ${input.reserva} minutos depois de pagar.`
        : 'Seu Tempo ainda não foi sincronizado. Tente de novo em instantes.',
      409,
    )
  }
  return -min * MIN
}

/** Credita minutos pelo livro-caixa do Tempo, uma vez por `idem`. Devolve se creditou agora. */
async function creditar(c: PoolClient, input: { playerId: string; minutos: number; motivo: string; ref: string | null; idem: string }) {
  const min = Math.floor(input.minutos)
  if (!Number.isFinite(min) || min <= 0) return false
  const [mov] = await run<{ id: string }>(
    c,
    `INSERT INTO salao_movimentos (player_id, minutos, motivo, ref, idem_key) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,
    [input.playerId, min, input.motivo, input.ref, input.idem],
  )
  if (!mov) return false
  await creditMinutes(input.playerId, min, c)
  return true
}

/* ------------------------------------------------------------------ Cartas do save */

type CartaSave = { uid: string; cardId: string; rarity: Rarity }

/** Tira a carta do save (linha travada). Sem a carta → 404. */
async function retirarDoSave(c: PoolClient, playerId: string, uidRaw: unknown): Promise<CartaSave> {
  const uid = typeof uidRaw === 'string' ? uidRaw.slice(0, 80) : ''
  if (!uid) throw new RecordError('Escolha uma carta.')
  const [row] = await run<{ card_id: string | null }>(
    c,
    `SELECT (SELECT e->>'cardId' FROM jsonb_array_elements(coalesce(data->'inventory', '[]'::jsonb)) e WHERE e->>'uid' = $2 LIMIT 1) AS card_id
       FROM player_saves WHERE player_id = $1 FOR UPDATE`,
    [playerId, uid],
  )
  if (!row?.card_id) throw new RecordError('Essa carta não está mais no seu inventário.', 404)
  let rarity: Rarity
  try {
    rarity = getCard(row.card_id).rarity
  } catch {
    throw new RecordError('Carta desconhecida.', 400)
  }
  // Já passou pelo Salão alguma vez (índices únicos também garantem): não volta a entrar com o mesmo uid.
  const [ja] = await run(c, 'SELECT 1 FROM salao_lotes WHERE seller_id = $1 AND card_uid = $2 UNION ALL SELECT 1 FROM salao_mercado WHERE seller_id = $1 AND card_uid = $2 LIMIT 1', [playerId, uid])
  if (ja) throw new RecordError('Essa carta já está no Salão.', 409)
  await run(
    c,
    `UPDATE player_saves SET data = jsonb_set(data, '{inventory}',
        coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e WHERE e->>'uid' <> $2), '[]'::jsonb)),
        updated_at = now()
      WHERE player_id = $1`,
    [playerId, uid],
  )
  return { uid, cardId: row.card_id, rarity }
}

/**
 * Uids que o jogador entregou ao Salão (lote ou oferta, em qualquer estado). O /api/save descarta esses uids do
 * inventário recebido: uma cópia antiga do save no cliente não faz a carta voltar (a devolução chega com outro uid).
 */
export async function uidsNoSalao(playerId: string, q: Queryable = pool): Promise<Set<string>> {
  if (!UUID_RE.test(playerId)) return new Set()
  const rows = await run<{ uid: string }>(
    q,
    'SELECT card_uid AS uid FROM salao_lotes WHERE seller_id = $1 UNION SELECT card_uid FROM salao_mercado WHERE seller_id = $1',
    [playerId],
  ).catch(() => [])
  return new Set(rows.map((r) => r.uid))
}

const cartaNome = (cardId: string) => {
  try {
    return getCard(cardId).name
  } catch {
    return cardId
  }
}

/* ------------------------------------------------------------------ Relógio e liquidação */

async function relogio(q: Queryable = pool): Promise<{ c: Cfg; rel: SalaoRelogio; now: number }> {
  const c = await cfg(q)
  const now = Date.now()
  return { c, rel: relogioSalao(c.calendario, now), now }
}

/**
 * Encerra os lotes das edições que já fecharam: com lance → vendido (carta ao vencedor, parte ao vendedor menos a
 * comissão); sem lance → devolvido (carta volta ao vendedor). Idempotente: cada lote trava, confere o status e usa
 * idem nas entregas e no crédito. Devolve quantos lotes encerrou.
 */
export async function liquidar(): Promise<number> {
  const { rel, now } = await relogio()
  const candidatos = await run<{ id: string; edicao: number }>(
    pool,
    "SELECT id, edicao FROM salao_lotes WHERE status = 'aprovado' AND edicao IS NOT NULL AND edicao <= $1 ORDER BY edicao, numero LIMIT 200",
    [rel.corrente.n],
  )
  let n = 0
  for (const cand of candidatos) {
    if (!edicaoEncerrada(cand.edicao, rel, now)) continue
    const fechou = await txAs(null, async (c) => {
      const [l] = await run<{ id: string; seller_id: string; card_id: string; status: string; comissao_pct: string; numero: number }>(
        c,
        'SELECT id, seller_id, card_id, status, comissao_pct, numero FROM salao_lotes WHERE id = $1 FOR UPDATE',
        [cand.id],
      )
      if (!l || l.status !== 'aprovado') return false
      const [top] = await run<{ id: string; player_id: string; valor: number }>(
        c,
        "SELECT id, player_id, valor FROM salao_lances WHERE lote_id = $1 AND status = 'ativo' FOR UPDATE",
        [l.id],
      )
      if (top) {
        const parte = repasse(top.valor, Number(l.comissao_pct))
        await run(c, "UPDATE salao_lances SET status = 'vencedor' WHERE id = $1", [top.id])
        await run(
          c,
          "UPDATE salao_lotes SET status = 'vendido', vencedor_id = $2, valor_final = $3, repasse = $4, encerrado_at = now() WHERE id = $1",
          [l.id, top.player_id, top.valor, parte],
        )
        await deliverCard({ playerId: top.player_id, cardId: l.card_id, origem: `Leilão do Salão · lote ${l.numero}`, ref: l.id, idem: `salao:lote:${l.id}:arremate` }, c)
        await creditar(c, { playerId: l.seller_id, minutos: parte, motivo: 'salao.venda', ref: l.id, idem: `salao:lote:${l.id}:repasse` })
      } else {
        await run(c, "UPDATE salao_lotes SET status = 'devolvido', encerrado_at = now() WHERE id = $1", [l.id])
        await deliverCard({ playerId: l.seller_id, cardId: l.card_id, origem: `Salão · lote ${l.numero} sem lances`, ref: l.id, idem: `salao:lote:${l.id}:devolucao` }, c)
      }
      return true
    })
    if (fechou) n++
  }
  return n
}

/* ------------------------------------------------------------------ Leitura */

type LoteRow = {
  id: string
  numero: number
  seller_id: string
  card_id: string
  card_rarity: string
  contrato: string
  status: SalaoLoteStatus
  edicao: number | null
  lance_minimo: number
  incremento: number
  valor_final: number | null
  repasse: number | null
  vencedor_id: string | null
  taxa_divulgacao: number
  comissao_pct: string
  nota: string | null
  created_at: Date
  vendedor: string
  maior: number | null
  maior_de: string | null
  n_lances: string
  meu_lance: number | null
}

const LOTE_SELECT = `
  SELECT l.id, l.numero, l.seller_id, l.card_id, l.card_rarity, l.contrato, l.status, l.edicao, l.lance_minimo, l.incremento,
         l.valor_final, l.repasse, l.vencedor_id, l.taxa_divulgacao, l.comissao_pct, l.nota, l.created_at,
         coalesce(nullif(p.character_name, ''), p.name) AS vendedor,
         top.valor AS maior, top.player_id AS maior_de,
         (SELECT count(*) FROM salao_lances x WHERE x.lote_id = l.id) AS n_lances,
         (SELECT max(valor) FROM salao_lances x WHERE x.lote_id = l.id AND x.player_id = $1) AS meu_lance
    FROM salao_lotes l
    JOIN players p ON p.id = l.seller_id
    LEFT JOIN LATERAL (SELECT valor, player_id FROM salao_lances WHERE lote_id = l.id AND status IN ('ativo', 'vencedor') ORDER BY valor DESC LIMIT 1) top ON true`

function lote(r: LoteRow, me: string): SalaoLote {
  const maior = r.maior ?? null
  return {
    id: r.id,
    numero: r.numero,
    cardId: r.card_id,
    raridade: (isRarity(r.card_rarity) ? r.card_rarity : 'comum') as Rarity,
    vendedor: r.vendedor,
    meu: r.seller_id === me,
    status: r.status,
    edicao: r.edicao,
    lanceMinimo: r.lance_minimo,
    incremento: r.incremento,
    maiorLance: maior,
    lances: Number(r.n_lances),
    lidero: maior !== null && r.maior_de === me,
    meuLance: r.meu_lance ?? null,
    proximoLance: maior === null ? r.lance_minimo : maior + r.incremento,
    valorFinal: r.valor_final,
    // A parte do vendedor só para o próprio vendedor.
    repasse: r.seller_id === me ? r.repasse : null,
    venci: r.status === 'vendido' && r.vencedor_id === me,
    taxaDivulgacao: r.taxa_divulgacao,
    comissaoPct: Number(r.comissao_pct),
    nota: r.seller_id === me ? r.nota : null,
    createdAt: r.created_at.getTime(),
  }
}

type OfertaRow = {
  id: string
  seller_id: string
  card_id: string
  card_rarity: string
  preco: number
  status: SalaoOferta['status']
  comprador_id: string | null
  repasse: number | null
  created_at: Date
  vendedor: string
}

const OFERTA_SELECT = `
  SELECT o.id, o.seller_id, o.card_id, o.card_rarity, o.preco, o.status, o.comprador_id, o.repasse, o.created_at,
         coalesce(nullif(p.character_name, ''), p.name) AS vendedor
    FROM salao_mercado o JOIN players p ON p.id = o.seller_id`

function oferta(r: OfertaRow, me: string): SalaoOferta {
  return {
    id: r.id,
    cardId: r.card_id,
    raridade: (isRarity(r.card_rarity) ? r.card_rarity : 'comum') as Rarity,
    vendedor: r.vendedor,
    meu: r.seller_id === me,
    preco: r.preco,
    status: r.status,
    comprei: r.comprador_id === me,
    repasse: r.seller_id === me ? r.repasse : null,
    createdAt: r.created_at.getTime(),
  }
}

type AnuncioRow = {
  id: string
  autor_id: string | null
  tipo: SalaoAnuncioTipo
  titulo: string
  texto: string
  corporacao: string | null
  custo: number
  status: SalaoAnuncio['status']
  created_at: Date
  expira_at: Date | null
  autor: string | null
}

const ANUNCIO_SELECT = `
  SELECT a.id, a.autor_id, a.tipo, a.titulo, a.texto, a.corporacao, a.custo, a.status, a.created_at, a.expira_at,
         coalesce(nullif(p.character_name, ''), p.name) AS autor
    FROM salao_anuncios a LEFT JOIN players p ON p.id = a.autor_id`

function anuncio(r: AnuncioRow, me: string): SalaoAnuncio {
  return {
    id: r.id,
    tipo: r.tipo,
    titulo: r.titulo,
    texto: r.texto,
    // Recrutamento fala pela Corporação; os demais assinam com o nome do personagem (sem cargo).
    autor: r.tipo === 'recrutamento' ? null : r.autor,
    corporacao: r.corporacao,
    meu: !!r.autor_id && r.autor_id === me,
    status: r.status,
    custo: r.autor_id === me ? r.custo : 0,
    createdAt: r.created_at.getTime(),
    expiraAt: r.expira_at?.getTime() ?? null,
  }
}

async function vagas(c: Cfg, edicao: number, q: Queryable) {
  const [r] = await run<{ n: string }>(q, "SELECT count(*) AS n FROM salao_lotes WHERE edicao = $1 AND status IN ('aprovado', 'vendido', 'devolvido')", [edicao])
  return { edicao, usadas: Number(r?.n ?? 0), total: c.bandeja.vagas_por_edicao }
}

async function eventos(q: Queryable): Promise<SalaoEvento[]> {
  const rows = await run<{ id: string; tipo: SalaoEvento['tipo']; titulo: string; descricao: string; inicio: Date; fim: Date; destaques: string[]; provisorio: boolean }>(
    q,
    "SELECT id, tipo, titulo, descricao, inicio, fim, destaques, provisorio FROM salao_eventos WHERE fim > now() - interval '45 days' ORDER BY inicio LIMIT 60",
  )
  return rows.map((e) => ({ ...e, inicio: e.inicio.getTime(), fim: e.fim.getTime() }))
}

export async function getSalao(playerId: string): Promise<SalaoPayload> {
  if (!(await hasUnlock(playerId, 'salao_mascaras'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  await liquidar().catch((e) => console.error('[salao] liquidar', e))
  const timeDeltaMs = await drainTime(playerId)
  const { c, rel, now } = await relogio()
  const ator = await requireActor(playerId)
  const owner = can(ator, 'config.editar')
  const [estado] = await run<{ apresentado_at: Date | null; aviso_anunciar_at: Date | null }>(
    pool,
    'SELECT apresentado_at, aviso_anunciar_at FROM salao_estado WHERE player_id = $1',
    [playerId],
  )
  const [corrente, proximos, encerrados, meus, mercado, minhasOfertas, anuncios, meusAnuncios, evs, contrato, vag, cartasPendentes] = await Promise.all([
    run<LoteRow>(pool, `${LOTE_SELECT} WHERE l.status = 'aprovado' AND l.edicao = $2 ORDER BY l.numero`, [playerId, rel.corrente.n]),
    run<LoteRow>(pool, `${LOTE_SELECT} WHERE l.status = 'aprovado' AND l.edicao > $2 ORDER BY l.edicao, l.numero LIMIT 30`, [playerId, rel.corrente.n]),
    run<LoteRow>(pool, `${LOTE_SELECT} WHERE l.status IN ('vendido', 'devolvido') ORDER BY l.encerrado_at DESC NULLS LAST LIMIT 12`, [playerId]),
    run<LoteRow>(pool, `${LOTE_SELECT} WHERE l.seller_id = $1 ORDER BY l.created_at DESC LIMIT 20`, [playerId]),
    run<OfertaRow>(pool, `${OFERTA_SELECT} WHERE o.status = 'ativa' ORDER BY o.created_at DESC LIMIT 40`),
    run<OfertaRow>(pool, `${OFERTA_SELECT} WHERE o.seller_id = $1 OR o.comprador_id = $1 ORDER BY o.created_at DESC LIMIT 20`, [playerId]),
    run<AnuncioRow>(pool, `${ANUNCIO_SELECT} WHERE a.status = 'publicado' AND (a.expira_at IS NULL OR a.expira_at > now()) ORDER BY (a.tipo = 'recrutamento') DESC, a.created_at DESC LIMIT 30`),
    run<AnuncioRow>(pool, `${ANUNCIO_SELECT} WHERE a.autor_id = $1 ORDER BY a.created_at DESC LIMIT 10`, [playerId]),
    eventos(pool),
    contratoDe(playerId, c, pool),
    vagas(c, rel.corrente.n + 1, pool),
    pendingCardCount(playerId),
  ])
  return {
    liberado: true,
    agora: now,
    relogio: rel,
    apresentado: !!estado?.apresentado_at,
    avisoAnunciar: !!estado?.aviso_anunciar_at,
    podePular: !!estado?.apresentado_at || seesAllSystems(ator.cargo),
    especialista: can(ator, 'salao.avaliar'),
    owner: owner ? { calendario: c.calendario, bandeja: c.bandeja, provisorio: c.provisorio } : null,
    contrato,
    contratos: c.contratos,
    bandeja: c.bandeja,
    vagas: vag,
    // Edição corrente: lotes em leilão só enquanto o Salão está aberto (fechado, já foram liquidados).
    leiloes: corrente.map((r) => lote(r, playerId)),
    proximos: proximos.map((r) => lote(r, playerId)),
    encerrados: encerrados.map((r) => lote(r, playerId)),
    meusLotes: meus.map((r) => lote(r, playerId)),
    mercado: mercado.map((r) => oferta(r, playerId)),
    minhasOfertas: minhasOfertas.map((r) => oferta(r, playerId)),
    anuncios: anuncios.map((r) => anuncio(r, playerId)),
    meusAnuncios: meusAnuncios.map((r) => anuncio(r, playerId)),
    custoPropaganda: c.anuncios.custo_propaganda,
    eventos: evs,
    timeDeltaMs,
    cartasPendentes,
  }
}

/* ------------------------------------------------------------------ Estado do jogador */

export async function concluirApresentacao(playerId: string) {
  await requireUnlock(playerId, 'salao_mascaras')
  await run(
    pool,
    `INSERT INTO salao_estado (player_id, apresentado_at) VALUES ($1, now())
     ON CONFLICT (player_id) DO UPDATE SET apresentado_at = coalesce(salao_estado.apresentado_at, now()), updated_at = now()`,
    [playerId],
  )
}

export async function lerAvisoAnunciar(playerId: string) {
  await requireUnlock(playerId, 'salao_mascaras')
  await run(
    pool,
    `INSERT INTO salao_estado (player_id, aviso_anunciar_at) VALUES ($1, now())
     ON CONFLICT (player_id) DO UPDATE SET aviso_anunciar_at = coalesce(salao_estado.aviso_anunciar_at, now()), updated_at = now()`,
    [playerId],
  )
}

/* ------------------------------------------------------------------ Bandeja */

const inteiro = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN
}

/**
 * Envia uma carta à Bandeja (pelo Shuffler): a carta sai do save, a taxa de divulgação do contrato é paga e o lote
 * fica "em avaliação de especialista". Raridade mínima, limite por jogador e lance mínimo vêm da configuração.
 */
export async function enviarBandeja(playerId: string, input: { uid: unknown; lanceMinimo?: unknown }) {
  await requireUnlock(playerId, 'salao_mascaras')
  const c = await cfg()
  const pedido = input.lanceMinimo === undefined || input.lanceMinimo === null || input.lanceMinimo === '' ? c.bandeja.lance_minimo : inteiro(input.lanceMinimo)
  if (!Number.isFinite(pedido) || pedido < c.bandeja.lance_minimo || pedido > SALAO_MAX_MIN) {
    throw new RecordError(`O lance mínimo precisa ficar entre ${c.bandeja.lance_minimo} e ${SALAO_MAX_MIN} minutos.`)
  }
  return txAs(playerId, async (q) => {
    const contrato = await contratoDe(playerId, c, q)
    const [ativos] = await run<{ n: string }>(q, "SELECT count(*) AS n FROM salao_lotes WHERE seller_id = $1 AND status IN ('avaliacao', 'aprovado')", [playerId])
    if (Number(ativos?.n ?? 0) >= c.bandeja.max_por_jogador) {
      throw new RecordError(`Você já tem ${c.bandeja.max_por_jogador} itens na Bandeja ou em leilão.`, 409)
    }
    const carta = await retirarDoSave(q, playerId, input.uid)
    if (!atendeRaridade(carta.rarity, c.bandeja.raridade_minima)) {
      throw new RecordError(`O Salão só aceita cartas a partir da raridade ${RARIDADE_ROTULO[c.bandeja.raridade_minima]}.`, 400)
    }
    const id = randomUUID()
    const timeDeltaMs = await debitar(q, { playerId, minutos: contrato.divulgacao, motivo: 'salao.divulgacao', ref: id, idem: `salao:lote:${id}:divulgacao`, reserva: c.bandeja.reserva_min })
    const [l] = await run<{ numero: number }>(
      q,
      `INSERT INTO salao_lotes (id, seller_id, card_uid, card_id, card_rarity, contrato, taxa_divulgacao, comissao_pct, lance_minimo, incremento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING numero`,
      [id, playerId, carta.uid, carta.cardId, carta.rarity, contrato.id, contrato.divulgacao, contrato.comissaoPct, pedido, c.bandeja.incremento],
    )
    return { loteId: id, numero: l.numero, uid: carta.uid, timeDeltaMs }
  })
}

/** O vendedor retira um lote ainda em avaliação: a carta volta (entrega) e a taxa de divulgação também. */
export async function retirarLote(playerId: string, loteId: unknown) {
  await requireUnlock(playerId, 'salao_mascaras')
  if (typeof loteId !== 'string' || !UUID_RE.test(loteId)) throw new RecordError('Lote inválido.')
  return txAs(playerId, async (q) => {
    const [l] = await run<{ seller_id: string; status: string; card_id: string; taxa_divulgacao: number; numero: number }>(
      q,
      'SELECT seller_id, status, card_id, taxa_divulgacao, numero FROM salao_lotes WHERE id = $1 FOR UPDATE',
      [loteId],
    )
    if (!l || l.seller_id !== playerId) throw new RecordError('Lote não encontrado.', 404)
    if (l.status !== 'avaliacao') throw new RecordError('Só itens ainda em avaliação podem ser retirados.', 409)
    await run(q, "UPDATE salao_lotes SET status = 'retirado', encerrado_at = now() WHERE id = $1", [loteId])
    await deliverCard({ playerId, cardId: l.card_id, origem: `Bandeja · lote ${l.numero} retirado`, ref: loteId, idem: `salao:lote:${loteId}:devolucao` }, q)
    await creditar(q, { playerId, minutos: l.taxa_divulgacao, motivo: 'salao.divulgacao.devolvida', ref: loteId, idem: `salao:lote:${loteId}:divulgacao:devolvida` })
    return { ok: true }
  })
}

/* ------------------------------------------------------------------ Lances */

/**
 * Lance em Tempo. Só durante a abertura, só em lote da edição corrente, nunca no próprio lote; valor inteiro
 * ≥ maior lance + incremento (ou ≥ lance mínimo). O valor sai do pulso na hora; quem foi superado recebe o seu de
 * volta (livro-caixa). Quem cobre o próprio lance paga só a diferença.
 */
export async function darLance(playerId: string, input: { loteId: unknown; valor: unknown }) {
  await requireUnlock(playerId, 'salao_mascaras')
  const loteId = input.loteId
  if (typeof loteId !== 'string' || !UUID_RE.test(loteId)) throw new RecordError('Lote inválido.')
  const valor = inteiro(input.valor)
  if (!Number.isFinite(valor) || valor <= 0) throw new RecordError('O lance precisa ser um número inteiro de minutos maior que zero.')
  if (valor > SALAO_MAX_MIN) throw new RecordError(`O lance máximo é de ${SALAO_MAX_MIN} minutos.`)
  await liquidar().catch(() => 0)
  const { c, rel } = await relogio()
  return txAs(playerId, async (q) => {
    const [l] = await run<{ seller_id: string; status: string; edicao: number | null; lance_minimo: number; incremento: number }>(
      q,
      'SELECT seller_id, status, edicao, lance_minimo, incremento FROM salao_lotes WHERE id = $1 FOR UPDATE',
      [loteId],
    )
    if (!l) throw new RecordError('Lote não encontrado.', 404)
    if (!rel.aberto || l.status !== 'aprovado' || l.edicao !== rel.corrente.n) {
      throw new RecordError('Os lances só valem durante a abertura do Salão, nos lotes desta edição.', 409)
    }
    if (l.seller_id === playerId) throw new RecordError('Você não pode dar lance no próprio lote.', 403)
    const [top] = await run<{ id: string; player_id: string; valor: number }>(
      q,
      "SELECT id, player_id, valor FROM salao_lances WHERE lote_id = $1 AND status = 'ativo' FOR UPDATE",
      [loteId],
    )
    const minimo = top ? top.valor + l.incremento : l.lance_minimo
    if (valor < minimo) throw new RecordError(`O lance precisa ser de pelo menos ${minimo} minutos.`, 409)
    const lanceId = randomUUID()
    const meu = top?.player_id === playerId
    const custo = meu ? valor - top.valor : valor
    const timeDeltaMs = await debitar(q, { playerId, minutos: custo, motivo: 'salao.lance', ref: loteId, idem: `salao:lance:${lanceId}`, reserva: c.bandeja.reserva_min })
    if (top) {
      await run(q, "UPDATE salao_lances SET status = 'superado' WHERE id = $1", [top.id])
      // Lance superado de outro jogador: o valor inteiro volta ao pulso dele (uma vez).
      if (!meu) await creditar(q, { playerId: top.player_id, minutos: top.valor, motivo: 'salao.lance.devolvido', ref: loteId, idem: `salao:lance:${top.id}:devolucao` })
    }
    await run(q, "INSERT INTO salao_lances (id, lote_id, player_id, valor, status) VALUES ($1, $2, $3, $4, 'ativo')", [lanceId, loteId, playerId, valor])
    return { lanceId, valor, timeDeltaMs }
  })
}

/* ------------------------------------------------------------------ Mercado */

export async function venderMercado(playerId: string, input: { uid: unknown; preco: unknown }) {
  await requireUnlock(playerId, 'salao_mascaras')
  const preco = inteiro(input.preco)
  if (!Number.isFinite(preco) || preco <= 0 || preco > SALAO_MAX_MIN) throw new RecordError(`O preço precisa ficar entre 1 e ${SALAO_MAX_MIN} minutos.`)
  const c = await cfg()
  return txAs(playerId, async (q) => {
    const [ativas] = await run<{ n: string }>(q, "SELECT count(*) AS n FROM salao_mercado WHERE seller_id = $1 AND status = 'ativa'", [playerId])
    if (Number(ativas?.n ?? 0) >= c.bandeja.max_por_jogador) throw new RecordError(`Você já tem ${c.bandeja.max_por_jogador} cartas à venda no Mercado.`, 409)
    const contrato = await contratoDe(playerId, c, q)
    const carta = await retirarDoSave(q, playerId, input.uid)
    const id = randomUUID()
    await run(
      q,
      'INSERT INTO salao_mercado (id, seller_id, card_uid, card_id, card_rarity, preco, comissao_pct) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, playerId, carta.uid, carta.cardId, carta.rarity, preco, contrato.comissaoPct],
    )
    return { ofertaId: id, uid: carta.uid }
  })
}

/** Compra no Mercado: só com o Salão aberto. O preço sai do pulso; o vendedor recebe a parte; a carta é entregue. */
export async function comprarMercado(playerId: string, ofertaId: unknown) {
  await requireUnlock(playerId, 'salao_mascaras')
  if (typeof ofertaId !== 'string' || !UUID_RE.test(ofertaId)) throw new RecordError('Oferta inválida.')
  const { c, rel } = await relogio()
  if (!rel.aberto) throw new RecordError('O Mercado só negocia durante a abertura do Salão.', 409)
  return txAs(playerId, async (q) => {
    const [o] = await run<{ seller_id: string; status: string; card_id: string; preco: number; comissao_pct: string }>(
      q,
      'SELECT seller_id, status, card_id, preco, comissao_pct FROM salao_mercado WHERE id = $1 FOR UPDATE',
      [ofertaId],
    )
    if (!o) throw new RecordError('Oferta não encontrada.', 404)
    if (o.status !== 'ativa') throw new RecordError('Essa carta já foi vendida ou retirada.', 409)
    if (o.seller_id === playerId) throw new RecordError('Você não pode comprar a própria carta.', 403)
    const timeDeltaMs = await debitar(q, { playerId, minutos: o.preco, motivo: 'salao.compra', ref: ofertaId, idem: `salao:oferta:${ofertaId}:pagamento`, reserva: c.bandeja.reserva_min })
    const parte = repasse(o.preco, Number(o.comissao_pct))
    await run(q, "UPDATE salao_mercado SET status = 'vendida', comprador_id = $2, repasse = $3, fechada_at = now() WHERE id = $1", [ofertaId, playerId, parte])
    await deliverCard({ playerId, cardId: o.card_id, origem: 'Mercado do Salão', ref: ofertaId, idem: `salao:oferta:${ofertaId}:compra` }, q)
    await creditar(q, { playerId: o.seller_id, minutos: parte, motivo: 'salao.mercado.venda', ref: ofertaId, idem: `salao:oferta:${ofertaId}:repasse` })
    return { carta: cartaNome(o.card_id), timeDeltaMs }
  })
}

export async function retirarOferta(playerId: string, ofertaId: unknown) {
  await requireUnlock(playerId, 'salao_mascaras')
  if (typeof ofertaId !== 'string' || !UUID_RE.test(ofertaId)) throw new RecordError('Oferta inválida.')
  return txAs(playerId, async (q) => {
    const [o] = await run<{ seller_id: string; status: string; card_id: string }>(q, 'SELECT seller_id, status, card_id FROM salao_mercado WHERE id = $1 FOR UPDATE', [ofertaId])
    if (!o || o.seller_id !== playerId) throw new RecordError('Oferta não encontrada.', 404)
    if (o.status !== 'ativa') throw new RecordError('Essa oferta já foi encerrada.', 409)
    await run(q, "UPDATE salao_mercado SET status = 'retirada', fechada_at = now() WHERE id = $1", [ofertaId])
    await deliverCard({ playerId, cardId: o.card_id, origem: 'Mercado · oferta retirada', ref: ofertaId, idem: `salao:oferta:${ofertaId}:devolucao` }, q)
    return { ok: true }
  })
}

/* ------------------------------------------------------------------ Propostas e anúncios */

function textoAnuncio(v: unknown, min: number, max: number, campo: string) {
  const t = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  if (t.length < min || t.length > max) throw new RecordError(`${campo} precisa ter entre ${min} e ${max} caracteres.`)
  return t
}

/** Proposta (sem custo) ou propaganda (custo em Tempo). Vai para a avaliação da equipe antes de aparecer. */
export async function criarAnuncio(playerId: string, input: { tipo: unknown; titulo: unknown; texto: unknown }) {
  await requireUnlock(playerId, 'salao_mascaras')
  const tipo = input.tipo === 'propaganda' ? 'propaganda' : input.tipo === 'proposta' ? 'proposta' : null
  if (!tipo) throw new RecordError('Tipo de anúncio inválido.')
  const titulo = textoAnuncio(input.titulo, 3, 80, 'O título')
  const texto = textoAnuncio(input.texto, 3, 600, 'O texto')
  const c = await cfg()
  return txAs(playerId, async (q) => {
    const [pend] = await run<{ n: string }>(q, "SELECT count(*) AS n FROM salao_anuncios WHERE autor_id = $1 AND status = 'pendente'", [playerId])
    if (Number(pend?.n ?? 0) >= 3) throw new RecordError('Você já tem 3 anúncios aguardando avaliação.', 409)
    const id = randomUUID()
    const custo = tipo === 'propaganda' ? c.anuncios.custo_propaganda : 0
    const timeDeltaMs = custo ? await debitar(q, { playerId, minutos: custo, motivo: 'salao.propaganda', ref: id, idem: `salao:anuncio:${id}:custo`, reserva: c.bandeja.reserva_min }) : 0
    await run(q, 'INSERT INTO salao_anuncios (id, autor_id, tipo, titulo, texto, custo) VALUES ($1, $2, $3, $4, $5, $6)', [id, playerId, tipo, titulo, texto, custo])
    return { anuncioId: id, timeDeltaMs }
  })
}

export async function retirarAnuncio(playerId: string, id: unknown) {
  await requireUnlock(playerId, 'salao_mascaras')
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new RecordError('Anúncio inválido.')
  return txAs(playerId, async (q) => {
    const [a] = await run<{ autor_id: string | null; status: string; custo: number }>(q, 'SELECT autor_id, status, custo FROM salao_anuncios WHERE id = $1 FOR UPDATE', [id])
    if (!a || a.autor_id !== playerId) throw new RecordError('Anúncio não encontrado.', 404)
    if (a.status !== 'pendente' && a.status !== 'publicado') throw new RecordError('Esse anúncio já foi encerrado.', 409)
    await run(q, "UPDATE salao_anuncios SET status = 'retirado' WHERE id = $1", [id])
    // Ainda não divulgado: o custo da propaganda volta.
    if (a.status === 'pendente') await creditar(q, { playerId, minutos: a.custo, motivo: 'salao.propaganda.devolvida', ref: id, idem: `salao:anuncio:${id}:custo:devolvido` })
    return { ok: true }
  })
}

/**
 * Anúncio de recrutamento de uma Corporação (DIRECAO-3 §2: "Anúncios de recrutamento de Corporações aparecem aqui").
 * Para o agente de Corporações: chame depois de validar no servidor quem pode recrutar pela Corporação. Publica
 * direto (sem custo nem avaliação); `ref` = id externo para não duplicar (idempotente por corporação + ref).
 */
export async function publicarRecrutamento(input: { corporacao: string; titulo: string; texto: string; autorId?: string | null; ref?: string | null; dias?: number }, q: Queryable = pool) {
  const corporacao = textoAnuncio(input.corporacao, 2, 60, 'A Corporação')
  const titulo = textoAnuncio(input.titulo, 3, 80, 'O título')
  const texto = textoAnuncio(input.texto, 3, 600, 'O texto')
  const c = await cfg(q)
  const dias = Math.max(1, Math.min(60, Math.floor(input.dias ?? c.anuncios.duracao_dias)))
  if (input.ref) {
    const [ja] = await run<{ id: string }>(q, "SELECT id FROM salao_anuncios WHERE tipo = 'recrutamento' AND corporacao = $1 AND nota = $2 AND status = 'publicado'", [corporacao, `ref:${input.ref}`])
    if (ja) return ja.id
  }
  const [a] = await run<{ id: string }>(
    q,
    `INSERT INTO salao_anuncios (autor_id, tipo, titulo, texto, corporacao, status, nota, expira_at)
     VALUES ($1, 'recrutamento', $2, $3, $4, 'publicado', $5, now() + make_interval(days => $6)) RETURNING id`,
    [input.autorId ?? null, titulo, texto, corporacao, input.ref ? `ref:${input.ref}` : null, dias],
  )
  return a.id
}

/* ------------------------------------------------------------------ Especialista (equipe) */

export async function filaAvaliacao(atorId: string): Promise<SalaoAvaliacao> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'salao.avaliar')
  const { c, rel } = await relogio()
  const [lotes, anuncios, vag] = await Promise.all([
    run<LoteRow>(pool, `${LOTE_SELECT} WHERE l.status = 'avaliacao' ORDER BY l.created_at LIMIT 50`, [atorId]),
    run<AnuncioRow>(pool, `${ANUNCIO_SELECT} WHERE a.status = 'pendente' ORDER BY a.created_at LIMIT 50`),
    vagas(c, rel.corrente.n + 1, pool),
  ])
  return {
    lotes: lotes.map((r) => ({ ...lote(r, atorId), vendedorId: r.seller_id, contrato: r.contrato, nota: r.nota })),
    anuncios: anuncios.map((r) => ({ ...anuncio(r, atorId), autorId: r.autor_id, autor: r.autor })),
    bandeja: c.bandeja,
    vagas: vag,
  }
}

/**
 * Parecer do especialista. Aprovar: o lote entra na próxima edição com vaga (as vagas são contadas sob trava, sem
 * estourar). Recusar: a carta volta ao vendedor e a taxa de divulgação também. O especialista pode ajustar o lance
 * mínimo ao aprovar.
 */
export async function decidirLote(atorId: string, input: { loteId: unknown; decisao: unknown; nota?: unknown; lanceMinimo?: unknown }) {
  const loteId = input.loteId
  if (typeof loteId !== 'string' || !UUID_RE.test(loteId)) throw new RecordError('Lote inválido.')
  const decisao = input.decisao === 'aprovar' ? 'aprovar' : input.decisao === 'recusar' ? 'recusar' : null
  if (!decisao) throw new RecordError('Decisão inválida.')
  const nota = typeof input.nota === 'string' ? input.nota.trim().slice(0, 240) || null : null
  const { c, rel } = await relogio()
  return txAs(atorId, async (q) => {
    const ator = await requireActor(atorId, q)
    requireCan(ator, 'salao.avaliar')
    const [l] = await run<{ seller_id: string; status: string; card_id: string; card_rarity: string; taxa_divulgacao: number; numero: number; lance_minimo: number }>(
      q,
      'SELECT seller_id, status, card_id, card_rarity, taxa_divulgacao, numero, lance_minimo FROM salao_lotes WHERE id = $1 FOR UPDATE',
      [loteId],
    )
    if (!l) throw new RecordError('Lote não encontrado.', 404)
    if (l.status !== 'avaliacao') throw new RecordError('Esse lote já foi avaliado.', 409)
    if (decisao === 'recusar') {
      await run(q, "UPDATE salao_lotes SET status = 'recusado', nota = $2, avaliado_por = $3, avaliado_at = now(), encerrado_at = now() WHERE id = $1", [loteId, nota, ator.id])
      await deliverCard({ playerId: l.seller_id, cardId: l.card_id, origem: `Bandeja · lote ${l.numero} recusado`, ref: loteId, idem: `salao:lote:${loteId}:devolucao` }, q)
      await creditar(q, { playerId: l.seller_id, minutos: l.taxa_divulgacao, motivo: 'salao.divulgacao.devolvida', ref: loteId, idem: `salao:lote:${loteId}:divulgacao:devolvida` })
      return { status: 'recusado' as const, edicao: null }
    }
    if (!atendeRaridade(l.card_rarity, c.bandeja.raridade_minima)) throw new RecordError('Essa carta está abaixo da raridade mínima atual.', 409)
    let minimo = l.lance_minimo
    if (input.lanceMinimo !== undefined && input.lanceMinimo !== null && input.lanceMinimo !== '') {
      minimo = inteiro(input.lanceMinimo)
      if (!Number.isFinite(minimo) || minimo <= 0 || minimo > SALAO_MAX_MIN) throw new RecordError('Lance mínimo inválido.')
    }
    // Vagas: serializa as aprovações e procura a primeira edição futura com lugar.
    await run(q, "SELECT pg_advisory_xact_lock(hashtext('salao:vagas'))")
    let edicao = rel.corrente.n + 1
    for (let i = 0; i < 60; i++, edicao++) {
      const v = await vagas(c, edicao, q)
      if (v.usadas < v.total) break
    }
    await run(
      q,
      "UPDATE salao_lotes SET status = 'aprovado', edicao = $2, lance_minimo = $3, nota = $4, avaliado_por = $5, avaliado_at = now() WHERE id = $1",
      [loteId, edicao, minimo, nota, ator.id],
    )
    await run(q, "INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, 'salao.lote.aprovado', $2, $3, $4)", [
      ator.id,
      l.seller_id,
      loteId,
      JSON.stringify({ edicao, lanceMinimo: minimo }),
    ])
    return { status: 'aprovado' as const, edicao }
  })
}

export async function decidirAnuncio(atorId: string, input: { id: unknown; decisao: unknown; nota?: unknown }) {
  const id = input.id
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new RecordError('Anúncio inválido.')
  const decisao = input.decisao === 'publicar' ? 'publicar' : input.decisao === 'recusar' ? 'recusar' : null
  if (!decisao) throw new RecordError('Decisão inválida.')
  const nota = typeof input.nota === 'string' ? input.nota.trim().slice(0, 240) || null : null
  const c = await cfg()
  return txAs(atorId, async (q) => {
    const ator = await requireActor(atorId, q)
    requireCan(ator, 'salao.avaliar')
    const [a] = await run<{ autor_id: string | null; status: string; custo: number }>(q, 'SELECT autor_id, status, custo FROM salao_anuncios WHERE id = $1 FOR UPDATE', [id])
    if (!a) throw new RecordError('Anúncio não encontrado.', 404)
    if (a.status !== 'pendente') throw new RecordError('Esse anúncio já foi avaliado.', 409)
    if (decisao === 'publicar') {
      await run(
        q,
        "UPDATE salao_anuncios SET status = 'publicado', nota = $2, avaliado_por = $3, avaliado_at = now(), expira_at = now() + make_interval(days => $4) WHERE id = $1",
        [id, nota, ator.id, c.anuncios.duracao_dias],
      )
    } else {
      await run(q, "UPDATE salao_anuncios SET status = 'recusado', nota = $2, avaliado_por = $3, avaliado_at = now() WHERE id = $1", [id, nota, ator.id])
      if (a.autor_id) await creditar(q, { playerId: a.autor_id, minutos: a.custo, motivo: 'salao.propaganda.devolvida', ref: id, idem: `salao:anuncio:${id}:custo:devolvido` })
    }
    return { ok: true }
  })
}

/* ------------------------------------------------------------------ Owner: calendário, eventos, contratos */

function dataValida(v: unknown, campo: string) {
  const t = typeof v === 'number' ? v : typeof v === 'string' ? Date.parse(v) : NaN
  if (!Number.isFinite(t)) throw new RecordError(`${campo} inválida.`)
  return new Date(t)
}

export async function salvarEvento(
  atorId: string,
  input: { id?: unknown; tipo?: unknown; titulo?: unknown; descricao?: unknown; inicio?: unknown; fim?: unknown; destaques?: unknown; provisorio?: unknown },
) {
  const tipo = input.tipo === 'quinzenal' || input.tipo === 'teatro' ? input.tipo : 'especial'
  const titulo = textoAnuncio(input.titulo, 3, 80, 'O título')
  const descricao = typeof input.descricao === 'string' ? input.descricao.trim().slice(0, 600) : ''
  const inicio = dataValida(input.inicio, 'Data de início')
  const fim = input.fim === undefined || input.fim === null || input.fim === '' ? new Date(inicio.getTime() + 3 * 3_600_000) : dataValida(input.fim, 'Data de fim')
  if (fim <= inicio) throw new RecordError('O fim precisa ser depois do início.')
  const destaques = Array.isArray(input.destaques) ? input.destaques.filter((d): d is string => typeof d === 'string').map((d) => d.trim().slice(0, 50)).filter(Boolean).slice(0, 6) : []
  const provisorio = input.provisorio !== false
  return txAs(atorId, async (q) => {
    const ator = await requireActor(atorId, q)
    requireCan(ator, 'config.editar')
    if (typeof input.id === 'string' && UUID_RE.test(input.id)) {
      const [r] = await run<{ id: string }>(
        q,
        'UPDATE salao_eventos SET tipo = $2, titulo = $3, descricao = $4, inicio = $5, fim = $6, destaques = $7, provisorio = $8, updated_at = now() WHERE id = $1 RETURNING id',
        [input.id, tipo, titulo, descricao, inicio, fim, destaques, provisorio],
      )
      if (!r) throw new RecordError('Evento não encontrado.', 404)
      return { id: r.id }
    }
    const [r] = await run<{ id: string }>(
      q,
      'INSERT INTO salao_eventos (tipo, titulo, descricao, inicio, fim, destaques, provisorio, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [tipo, titulo, descricao, inicio, fim, destaques, provisorio, ator.id],
    )
    return { id: r.id }
  })
}

export async function removerEvento(atorId: string, id: unknown) {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new RecordError('Evento inválido.')
  return txAs(atorId, async (q) => {
    const ator = await requireActor(atorId, q)
    requireCan(ator, 'config.editar')
    await run(q, 'DELETE FROM salao_eventos WHERE id = $1', [id])
    return { ok: true }
  })
}

/** Owner define o tipo de contrato de um jogador (as taxas seguem o contrato). */
export async function definirContrato(atorId: string, playerId: unknown, contrato: unknown) {
  if (typeof playerId !== 'string' || !UUID_RE.test(playerId)) throw new RecordError('Jogador inválido.')
  const c = await cfg()
  const k = c.contratos.find((x) => x.id === contrato)
  if (!k) throw new RecordError('Contrato desconhecido.')
  return txAs(atorId, async (q) => {
    const ator = await requireActor(atorId, q)
    requireCan(ator, 'config.editar')
    await run(
      q,
      `INSERT INTO salao_estado (player_id, contrato) VALUES ($1, $2)
       ON CONFLICT (player_id) DO UPDATE SET contrato = EXCLUDED.contrato, updated_at = now()`,
      [playerId, k.id],
    )
    return { ok: true, contrato: k.id }
  })
}
