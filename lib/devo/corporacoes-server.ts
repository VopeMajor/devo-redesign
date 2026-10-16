import 'server-only'
import { randomInt } from 'node:crypto'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { drainTime } from './arcade/server'
import { getCard } from './cards'
import { seesAllSystems } from './cargos'
import {
  type Brasao,
  type BrasaoCor,
  type BrasaoForma,
  CODIGO_ALFABETO,
  CODIGO_RE,
  type CorpCargo,
  type CorpClassificacao,
  type CorpConviteRecebido,
  type CorpEscopo,
  type CorpMesa,
  type CorpPayload,
  type CorpResumo,
  type CriacaoInfo,
  inicialDe,
  isBrasaoCor,
  isBrasaoForma,
  type JogoColetivo,
  type MinhaCorp,
  normalizarCodigo,
  type PerfilCandidato,
  podeDecidir,
  type Requisito,
} from './corporacoes'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { creditMinutes, deliverCard, pendingCardCount } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, hasUnlock, requireUnlock } from './progresso-server'
import { publicarRecrutamento, uidsNoSalao } from './salao-server'

/**
 * Corporações — servidor. Contrato: docs/redesign/FUNDACAO.md §12. Regras do dono (diálogo da Melissa):
 * - entrar: o Record insere o código de identificação → pedido → líder ou vice aprova (vendo só partes permitidas
 *   do perfil); ou recebe um convite direto de um membro;
 * - fundar: custa Tempo (pago no pedido) e passa pela avaliação administrativa da Companhia (Owner/Anfitrião na
 *   Mesa do Record), que considera os requisitos do perfil;
 * - vantagens: transferir cartas entre membros (sem duplicar; cartas presas no Salão não saem), jogos coletivos
 *   especiais (só dados, "em breve");
 * - status legal: oficial ou Necro-Corporação — classificação SÓ pela equipe (servidor + gatilho no banco).
 * Toda rota chama a trava `corporacoes` (Owner e Anfitrião: liberado).
 */

const MOTIVO_TRANCADO = 'A Companhia de Despertados ainda não entrou em contato. Corporações abrem depois da chamada da Melissa.'
const MIN = 60_000
const NOME = "coalesce(nullif(p.character_name, ''), p.name)"

/* ------------------------------------------------------------------ Configuração (PROVISÓRIA, editável pelo Owner) */

type Cfg = {
  custo: number
  reserva: number
  devolver: boolean
  maxMembros: number
  requisitos: { deadly_votes_sobrevividos: number; dias_de_registro: number; cartas_minimas: number }
  perfil: Set<string>
  porDia: number
  regras: { titulo: string; artigos: string[] }
  jogos: JogoColetivo[]
  provisorio: boolean
}

const int = (v: unknown, def: number, min: number, max: number) => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def
}

async function cfg(q: Queryable = pool): Promise<Cfg> {
  const [cri, per, tra, reg, jog] = await Promise.all([
    getConfig<Record<string, unknown>>('corporacoes.criacao', q),
    getConfig<unknown>('corporacoes.perfil_visivel', q),
    getConfig<Record<string, unknown>>('corporacoes.transferencia', q),
    getConfig<Record<string, unknown>>('corporacoes.codigo_regras', q),
    getConfig<unknown>('corporacoes.jogos_coletivos', q),
  ])
  const c = cri?.value ?? {}
  const r = (c.requisitos ?? {}) as Record<string, unknown>
  const perfil = Array.isArray(per?.value) ? (per.value as unknown[]).filter((x): x is string => typeof x === 'string') : ['personagem', 'registro_desde', 'deadly_votes', 'cartas']
  const artigos = Array.isArray(reg?.value?.artigos) ? (reg.value.artigos as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 30) : []
  const jogos = (Array.isArray(jog?.value) ? (jog.value as Record<string, unknown>[]) : [])
    .filter((j) => j && typeof j.id === 'string' && typeof j.titulo === 'string')
    .slice(0, 12)
    .map((j) => ({ id: String(j.id), titulo: String(j.titulo), descricao: String(j.descricao ?? ''), minMembros: int(j.min_membros, 2, 1, 99) }))
  return {
    custo: int(c.custo_minutos, 360, 0, 72 * 60),
    reserva: int(c.reserva_minutos, 120, 0, 72 * 60),
    devolver: c.devolver_se_recusada !== false,
    maxMembros: int(c.max_membros, 12, 2, 200),
    requisitos: {
      deadly_votes_sobrevividos: int(r.deadly_votes_sobrevividos, 1, 0, 999),
      dias_de_registro: int(r.dias_de_registro, 0, 0, 3650),
      cartas_minimas: int(r.cartas_minimas, 3, 0, 999),
    },
    perfil: new Set(['personagem', ...perfil]),
    porDia: int(tra?.value?.por_dia, 5, 0, 100),
    regras: { titulo: typeof reg?.value?.titulo === 'string' ? reg.value.titulo : 'Código da Companhia de Despertados', artigos },
    jogos,
    provisorio: [cri, per, tra, reg, jog].some((x) => !x || x.provisional),
  }
}

/* ------------------------------------------------------------------ Linhas e conversões */

type CorpRow = {
  id: string
  codigo: string | null
  nome: string
  lema: string | null
  brasao_forma: string
  brasao_cor: string
  status: string
  classificacao: CorpClassificacao
  classificacao_nota: string | null
  escopo: CorpEscopo
  fundador_id: string | null
  custo_pago: number
  requisitos: Requisito[]
  decisao_nota: string | null
  created_at: Date
  membros: string
}

const CORP_SELECT = `SELECT c.*, (SELECT count(*) FROM corporacao_membros m WHERE m.corporacao_id = c.id) AS membros FROM corporacoes c`

const brasaoDe = (r: Pick<CorpRow, 'brasao_forma' | 'brasao_cor' | 'nome'>): Brasao => ({
  forma: isBrasaoForma(r.brasao_forma) ? r.brasao_forma : 'escudo',
  cor: isBrasaoCor(r.brasao_cor) ? r.brasao_cor : 'aco',
  inicial: inicialDe(r.nome),
})

const resumo = (r: CorpRow): CorpResumo => ({
  id: r.id,
  nome: r.nome,
  lema: r.lema,
  codigo: r.codigo,
  brasao: brasaoDe(r),
  classificacao: r.classificacao,
  escopo: r.escopo,
  membros: Number(r.membros ?? 0),
})

async function corpPorId(q: Queryable, id: string, lock = false): Promise<CorpRow | null> {
  if (!UUID_RE.test(id)) return null
  const [r] = await run<CorpRow>(q, lock ? 'SELECT c.*, 0 AS membros FROM corporacoes c WHERE c.id = $1 FOR UPDATE' : `${CORP_SELECT} WHERE c.id = $1`, [id])
  return r ?? null
}

type Membro = { corporacao_id: string; cargo: CorpCargo }

async function membroDe(q: Queryable, playerId: string): Promise<Membro | null> {
  const [m] = await run<Membro>(q, 'SELECT corporacao_id, cargo FROM corporacao_membros WHERE player_id = $1', [playerId])
  return m ?? null
}

async function nomeDe(q: Queryable, playerId: string) {
  const [r] = await run<{ n: string }>(q, `SELECT ${NOME} AS n FROM players p WHERE p.id = $1`, [playerId])
  return r?.n ?? 'Record'
}

const texto = (raw: unknown, min: number, max: number, campo: string, opcional = false) => {
  const s = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : ''
  if (!s && opcional) return null
  if (s.length < min) throw new RecordError(`${campo} precisa de pelo menos ${min} caracteres.`)
  if (s.length > max) throw new RecordError(`${campo} pode ter no máximo ${max} caracteres.`)
  return s
}

const uuid = (raw: unknown, msg = 'Registro inválido.') => {
  if (typeof raw !== 'string' || !UUID_RE.test(raw)) throw new RecordError(msg, 400)
  return raw
}

async function log(c: PoolClient, input: { ator: string | null; acao: string; alvo: string | null; ref: string; data: Record<string, unknown> }) {
  await run(c, 'INSERT INTO admin_log (actor_id, action, target_id, ref, data) VALUES ($1, $2, $3, $4, $5)', [input.ator, input.acao, input.alvo, input.ref, JSON.stringify(input.data)])
}

/* ------------------------------------------------------------------ Tempo */

/** Débito direto no pulso (como o Salão), mantendo `reserva` minutos; idempotente por `idem`. */
async function debitar(c: PoolClient, input: { playerId: string; minutos: number; motivo: string; ref: string; idem: string; reserva: number }) {
  const min = Math.floor(input.minutos)
  if (!Number.isFinite(min) || min <= 0) return 0
  const [mov] = await run<{ id: string }>(
    c,
    `INSERT INTO corporacao_movimentos (player_id, minutos, motivo, ref, idem_key) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,
    [input.playerId, -min, input.motivo, input.ref, input.idem],
  )
  if (!mov) throw new RecordError('Este pagamento já foi registrado.', 409)
  const [pago] = await run<{ t: string }>(
    c,
    `UPDATE player_saves SET data = jsonb_set(data, '{timerEndsAt}', to_jsonb((data->>'timerEndsAt')::bigint - $2::bigint)), updated_at = now()
      WHERE player_id = $1 AND data ? 'timerEndsAt' AND (data->>'timerEndsAt')::bigint - $2::bigint > $3::bigint
      RETURNING data->>'timerEndsAt' AS t`,
    [input.playerId, min * MIN, Date.now() + input.reserva * MIN],
  )
  if (!pago) {
    const [s] = await run<{ t: string | null }>(c, "SELECT data->>'timerEndsAt' AS t FROM player_saves WHERE player_id = $1", [input.playerId])
    throw new RecordError(
      s?.t ? `Tempo insuficiente. Seu pulso precisa manter pelo menos ${input.reserva} minutos depois de pagar.` : 'Seu Tempo ainda não foi sincronizado. Tente de novo em instantes.',
      409,
    )
  }
  return -min * MIN
}

/** Crédito pelo livro-caixa do Tempo, uma vez por `idem`. */
async function creditar(c: PoolClient, input: { playerId: string; minutos: number; motivo: string; ref: string; idem: string }) {
  const min = Math.floor(input.minutos)
  if (!Number.isFinite(min) || min <= 0) return false
  const [mov] = await run<{ id: string }>(
    c,
    `INSERT INTO corporacao_movimentos (player_id, minutos, motivo, ref, idem_key) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,
    [input.playerId, min, input.motivo, input.ref, input.idem],
  )
  if (!mov) return false
  await creditMinutes(input.playerId, min, c)
  return true
}

/* ------------------------------------------------------------------ Perfil (requisitos e o que o líder vê) */

type PerfilRow = { created_at: Date; nome: string; participou: string; sobreviveu: string; cartas: string | null; aparencia: { kind?: string; name?: string } | null }

async function perfilRow(q: Queryable, playerId: string): Promise<PerfilRow | null> {
  const [r] = await run<PerfilRow>(
    q,
    `SELECT p.created_at, ${NOME} AS nome,
            (SELECT count(*) FROM deadly_vote_entries e WHERE e.player_id = p.id AND e.admission = 'aceita') AS participou,
            (SELECT count(*) FROM deadly_vote_entries e WHERE e.player_id = p.id AND e.outcome = 'sobreviveu') AS sobreviveu,
            (SELECT jsonb_array_length(coalesce(s.data->'inventory', '[]'::jsonb)) FROM player_saves s WHERE s.player_id = p.id) AS cartas,
            (SELECT s.data->'profile'->'appearance' FROM player_saves s WHERE s.player_id = p.id) AS aparencia
       FROM players p WHERE p.id = $1`,
    [playerId],
  )
  return r ?? null
}

function requisitos(c: Cfg, p: PerfilRow | null): Requisito[] {
  const dias = p ? Math.floor((Date.now() - p.created_at.getTime()) / 86_400_000) : 0
  const lista: Requisito[] = [
    { id: 'deadly_votes', rotulo: 'Deadly Votes sobrevividos', exigido: c.requisitos.deadly_votes_sobrevividos, atual: Number(p?.sobreviveu ?? 0), ok: false },
    { id: 'registro', rotulo: 'Dias de registro no DEVO', exigido: c.requisitos.dias_de_registro, atual: dias, ok: false },
    { id: 'cartas', rotulo: 'Cartas no inventário', exigido: c.requisitos.cartas_minimas, atual: Number(p?.cartas ?? 0), ok: false },
  ]
  return lista.filter((r) => r.exigido > 0).map((r) => ({ ...r, ok: r.atual >= r.exigido }))
}

/** Só as partes do perfil liberadas em `corporacoes.perfil_visivel` (nunca cargo, karma, e-mail ou senha). */
function perfilVisivel(c: Cfg, p: PerfilRow): PerfilCandidato {
  const out: PerfilCandidato = { personagem: p.nome }
  if (c.perfil.has('registro_desde')) out.registroDesde = p.created_at.getTime()
  if (c.perfil.has('deadly_votes')) out.deadlyVotes = { participou: Number(p.participou), sobreviveu: Number(p.sobreviveu) }
  if (c.perfil.has('cartas')) out.cartas = Number(p.cartas ?? 0)
  if (c.perfil.has('aparencia')) {
    const a = p.aparencia
    out.aparencia = a && typeof a.name === 'string' && a.name ? { tipo: a.kind === 'real' ? 'Real' : '2D / 3D', nome: a.name.slice(0, 60) } : null
  }
  return out
}

/* ------------------------------------------------------------------ Leitura */

export async function getCorporacoes(playerId: string): Promise<CorpPayload> {
  if (!(await hasUnlock(playerId, 'corporacoes'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const timeDeltaMs = await drainTime(playerId)
  const ator = await requireActor(playerId)
  const c = await cfg()
  const [estado] = await run<{ apresentado_at: Date | null }>(pool, 'SELECT apresentado_at FROM corporacao_estado WHERE player_id = $1', [playerId])
  const eu = await membroDe(pool, playerId)

  const [pedidoRow] = await run<CorpRow & { pedido_id: string; origem: 'codigo' | 'convite'; pedido_at: Date }>(
    pool,
    `SELECT c.*, d.id AS pedido_id, d.origem, d.created_at AS pedido_at,
            (SELECT count(*) FROM corporacao_membros m WHERE m.corporacao_id = c.id) AS membros
       FROM corporacao_pedidos d JOIN corporacoes c ON c.id = d.corporacao_id
      WHERE d.player_id = $1 AND d.status = 'pendente'`,
    [playerId],
  )

  const convitesRows = eu
    ? []
    : await run<CorpRow & { convite_id: string; de: string | null; de_cargo: CorpCargo | null; convite_at: Date }>(
        pool,
        `SELECT c.*, v.id AS convite_id, v.created_at AS convite_at, ${NOME} AS de, dm.cargo AS de_cargo,
                (SELECT count(*) FROM corporacao_membros m WHERE m.corporacao_id = c.id) AS membros
           FROM corporacao_convites v
           JOIN corporacoes c ON c.id = v.corporacao_id AND c.status = 'ativa'
           LEFT JOIN players p ON p.id = v.de_id
           LEFT JOIN corporacao_membros dm ON dm.player_id = v.de_id AND dm.corporacao_id = v.corporacao_id
          WHERE v.para_id = $1 AND v.status = 'pendente'
          ORDER BY v.created_at DESC LIMIT 10`,
        [playerId],
      )
  const convites: CorpConviteRecebido[] = convitesRows.map((r) => ({
    id: r.convite_id,
    corporacao: resumo(r),
    de: r.de,
    direto: podeDecidir(r.de_cargo),
    createdAt: r.convite_at.getTime(),
  }))

  const perfil = await perfilRow(pool, playerId)
  const reqs = requisitos(c, perfil)
  const [pend] = await run<CorpRow>(pool, `${CORP_SELECT} WHERE c.fundador_id = $1 AND c.status = 'pendente'`, [playerId])
  const [recusada] = pend
    ? []
    : await run<CorpRow & { devolvido: boolean }>(
        pool,
        `SELECT c.*, 0 AS membros, EXISTS (SELECT 1 FROM corporacao_movimentos mv WHERE mv.idem_key = 'corp:fundar:' || c.id || ':devolucao') AS devolvido
           FROM corporacoes c WHERE c.fundador_id = $1 AND c.status = 'recusada' AND c.decidida_at > now() - interval '14 days'
          ORDER BY c.decidida_at DESC LIMIT 1`,
        [playerId],
      )
  const criacao: CriacaoInfo = {
    custo: c.custo,
    reserva: c.reserva,
    maxMembros: c.maxMembros,
    requisitos: reqs,
    atende: reqs.every((r) => r.ok),
    provisorio: c.provisorio,
    pendente: pend ? { id: pend.id, nome: pend.nome, brasao: brasaoDe(pend), createdAt: pend.created_at.getTime(), custo: pend.custo_pago } : null,
    recusada: recusada && !eu ? { nome: recusada.nome, nota: recusada.decisao_nota, devolvido: recusada.devolvido } : null,
  }

  return {
    liberado: true,
    agora: Date.now(),
    apresentado: !!estado?.apresentado_at,
    podePular: !!estado?.apresentado_at || seesAllSystems(ator.cargo),
    minha: eu ? await minhaCorp(playerId, eu, c) : null,
    pedido: pedidoRow ? { id: pedidoRow.pedido_id, corporacao: resumo(pedidoRow), origem: pedidoRow.origem, createdAt: pedidoRow.pedido_at.getTime() } : null,
    convites,
    criacao,
    regras: { ...c.regras, provisorio: c.provisorio },
    jogos: { lista: c.jogos, provisorio: c.provisorio },
    timeDeltaMs,
    cartasPendentes: await pendingCardCount(playerId),
  }
}

async function minhaCorp(playerId: string, eu: Membro, c: Cfg): Promise<MinhaCorp | null> {
  const corp = await corpPorId(pool, eu.corporacao_id)
  if (!corp) return null
  const decide = podeDecidir(eu.cargo)
  const [membros, pedidos, convites, transf, hoje, rivais] = await Promise.all([
    run<{ id: string; nome: string; cargo: CorpCargo; entrou_at: Date }>(
      pool,
      `SELECT m.player_id AS id, ${NOME} AS nome, m.cargo, m.entrou_at FROM corporacao_membros m JOIN players p ON p.id = m.player_id
        WHERE m.corporacao_id = $1 ORDER BY CASE m.cargo WHEN 'lider' THEN 0 WHEN 'vice' THEN 1 ELSE 2 END, m.entrou_at`,
      [corp.id],
    ),
    decide
      ? run<{ id: string; player_id: string; origem: 'codigo' | 'convite'; convidado: string | null; created_at: Date }>(
          pool,
          `SELECT d.id, d.player_id, d.origem, (SELECT ${NOME} FROM players p WHERE p.id = d.convidado_por) AS convidado, d.created_at
             FROM corporacao_pedidos d WHERE d.corporacao_id = $1 AND d.status = 'pendente' ORDER BY d.created_at LIMIT 30`,
          [corp.id],
        )
      : Promise.resolve([]),
    run<{ id: string; para: string; de: string | null; created_at: Date }>(
      pool,
      `SELECT v.id, (SELECT ${NOME} FROM players p WHERE p.id = v.para_id) AS para, (SELECT ${NOME} FROM players p WHERE p.id = v.de_id) AS de, v.created_at
         FROM corporacao_convites v WHERE v.corporacao_id = $1 AND v.status = 'pendente' ORDER BY v.created_at DESC LIMIT 20`,
      [corp.id],
    ),
    run<{ id: string; de_id: string; para_id: string; de: string; para: string; card_id: string; created_at: Date }>(
      pool,
      `SELECT t.id, t.de_id, t.para_id, (SELECT ${NOME} FROM players p WHERE p.id = t.de_id) AS de, (SELECT ${NOME} FROM players p WHERE p.id = t.para_id) AS para, t.card_id, t.created_at
         FROM corporacao_transferencias t WHERE t.corporacao_id = $1 ORDER BY t.created_at DESC LIMIT 12`,
      [corp.id],
    ),
    transferenciasHoje(pool, playerId),
    run<CorpRow & { provisorio: boolean }>(
      pool,
      `SELECT c.*, 0 AS membros, r.provisorio FROM corporacao_rivalidades r
         JOIN corporacoes c ON c.id = CASE WHEN r.a_id = $1 THEN r.b_id ELSE r.a_id END
        WHERE (r.a_id = $1 OR r.b_id = $1) AND c.status = 'ativa' LIMIT 8`,
      [corp.id],
    ),
  ])
  const perfis = await Promise.all(pedidos.map((d) => perfilRow(pool, d.player_id)))
  return {
    ...resumo(corp),
    meuCargo: eu.cargo,
    membrosLista: membros.map((m) => ({ id: m.id, personagem: m.nome, cargo: m.cargo, entrouAt: m.entrou_at.getTime(), eu: m.id === playerId })),
    pedidos: pedidos.flatMap((d, i) => {
      const p = perfis[i]
      return p ? [{ id: d.id, origem: d.origem, convidadoPor: d.convidado, createdAt: d.created_at.getTime(), perfil: perfilVisivel(c, p) }] : []
    }),
    convitesEnviados: convites.map((v) => ({ id: v.id, para: v.para, de: v.de, createdAt: v.created_at.getTime() })),
    transferencias: transf.map((t) => ({ id: t.id, de: t.de, para: t.para, cardId: t.card_id, createdAt: t.created_at.getTime(), minha: t.de_id === playerId || t.para_id === playerId })),
    transferenciasHoje: hoje,
    transferenciasPorDia: c.porDia,
    rivais: rivais.map((r) => ({ nome: r.nome, brasao: brasaoDe(r), provisorio: r.provisorio })),
    maxMembros: c.maxMembros,
  }
}

async function transferenciasHoje(q: Queryable, playerId: string) {
  const [r] = await run<{ n: string }>(
    q,
    `SELECT count(*) AS n FROM corporacao_transferencias
      WHERE de_id = $1 AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date`,
    [playerId],
  )
  return Number(r?.n ?? 0)
}

/** Prévia pelo código (antes de pedir entrada): o Record vê o brasão, o nome e o status legal. */
export async function previaCodigo(playerId: string, raw: unknown): Promise<{ corporacao: CorpResumo }> {
  await requireUnlock(playerId, 'corporacoes')
  const codigo = normalizarCodigo(raw)
  if (!CODIGO_RE.test(codigo)) throw new RecordError('Código inválido. O formato é CRP-XXXX-XXXX.', 400)
  const [r] = await run<CorpRow>(pool, `${CORP_SELECT} WHERE c.codigo = $1 AND c.status = 'ativa'`, [codigo])
  if (!r) throw new RecordError('Nenhuma Corporação ativa com esse código.', 404)
  return { corporacao: resumo(r) }
}

/* ------------------------------------------------------------------ Apresentação */

export async function concluirApresentacao(playerId: string) {
  await requireUnlock(playerId, 'corporacoes')
  await run(
    pool,
    `INSERT INTO corporacao_estado (player_id, apresentado_at) VALUES ($1, now())
     ON CONFLICT (player_id) DO UPDATE SET apresentado_at = coalesce(corporacao_estado.apresentado_at, now()), updated_at = now()`,
    [playerId],
  )
}

/* ------------------------------------------------------------------ Entrar, sair, decidir */

/** Trava a linha do jogador: serializa as ações de entrada/fundação do mesmo Record. */
async function travarJogador(c: PoolClient, playerId: string) {
  await run(c, 'SELECT id FROM players WHERE id = $1 FOR UPDATE', [playerId])
}

async function semVinculo(c: PoolClient, playerId: string) {
  if (await membroDe(c, playerId)) throw new RecordError('Você já faz parte de uma Corporação.', 409)
  const [p] = await run(c, "SELECT 1 FROM corporacao_pedidos WHERE player_id = $1 AND status = 'pendente'", [playerId])
  if (p) throw new RecordError('Você já tem um pedido de entrada aguardando resposta.', 409)
  const [f] = await run(c, "SELECT 1 FROM corporacoes WHERE fundador_id = $1 AND status = 'pendente'", [playerId])
  if (f) throw new RecordError('Sua Corporação ainda está em análise pela Companhia.', 409)
}

export async function pedirEntrada(playerId: string, raw: unknown) {
  await requireUnlock(playerId, 'corporacoes')
  const codigo = normalizarCodigo(raw)
  if (!CODIGO_RE.test(codigo)) throw new RecordError('Código inválido. O formato é CRP-XXXX-XXXX.', 400)
  return txAs(playerId, async (c) => {
    await travarJogador(c, playerId)
    const [corp] = await run<CorpRow>(c, `${CORP_SELECT} WHERE c.codigo = $1 AND c.status = 'ativa'`, [codigo])
    if (!corp) throw new RecordError('Nenhuma Corporação ativa com esse código.', 404)
    await semVinculo(c, playerId)
    const [d] = await run<{ id: string }>(
      c,
      "INSERT INTO corporacao_pedidos (corporacao_id, player_id, origem) VALUES ($1, $2, 'codigo') RETURNING id",
      [corp.id, playerId],
    )
    return { pedidoId: d.id, corporacao: resumo(corp) }
  })
}

export async function cancelarPedido(playerId: string, idRaw: unknown) {
  await requireUnlock(playerId, 'corporacoes')
  const id = uuid(idRaw, 'Pedido inválido.')
  const rows = await run(pool, "UPDATE corporacao_pedidos SET status = 'cancelado', decidido_at = now() WHERE id = $1 AND player_id = $2 AND status = 'pendente' RETURNING id", [id, playerId])
  if (!rows.length) throw new RecordError('Esse pedido não está mais pendente.', 409)
  return { cancelado: true }
}

async function entrarComo(c: PoolClient, corpId: string, playerId: string, cargo: CorpCargo, max: number) {
  const [n] = await run<{ n: string }>(c, 'SELECT count(*) AS n FROM corporacao_membros WHERE corporacao_id = $1', [corpId])
  if (Number(n?.n ?? 0) >= max) throw new RecordError(`A Corporação já está completa (${max} membros).`, 409)
  const ins = await run(c, 'INSERT INTO corporacao_membros (player_id, corporacao_id, cargo) VALUES ($1, $2, $3) ON CONFLICT (player_id) DO NOTHING RETURNING player_id', [playerId, corpId, cargo])
  if (!ins.length) throw new RecordError('Esse Record já faz parte de outra Corporação.', 409)
  // Entrou: convites pendentes para ele deixam de valer.
  await run(c, "UPDATE corporacao_convites SET status = 'cancelado', respondido_at = now() WHERE para_id = $1 AND status = 'pendente'", [playerId])
}

/** Líder ou vice da Corporação do pedido decide. Ninguém mais (nem a equipe) aprova pelo líder. */
export async function decidirPedido(playerId: string, input: { id: unknown; decisao: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const id = uuid(input.id, 'Pedido inválido.')
  if (input.decisao !== 'aprovar' && input.decisao !== 'recusar') throw new RecordError('Decisão inválida.')
  const c0 = await cfg()
  return txAs(playerId, async (c) => {
    const [d] = await run<{ id: string; corporacao_id: string; player_id: string; status: string }>(c, 'SELECT id, corporacao_id, player_id, status FROM corporacao_pedidos WHERE id = $1 FOR UPDATE', [id])
    if (!d) throw new RecordError('Pedido não encontrado.', 404)
    const eu = await membroDe(c, playerId)
    if (!eu || eu.corporacao_id !== d.corporacao_id || !podeDecidir(eu.cargo)) throw new RecordError('Só o líder ou o vice-líder decide os pedidos de entrada.', 403)
    if (d.status !== 'pendente') throw new RecordError('Esse pedido já foi decidido.', 409)
    const corp = await corpPorId(c, d.corporacao_id, true)
    if (!corp || corp.status !== 'ativa') throw new RecordError('A Corporação não está ativa.', 409)
    if (input.decisao === 'aprovar') await entrarComo(c, corp.id, d.player_id, 'membro', c0.maxMembros)
    await run(c, 'UPDATE corporacao_pedidos SET status = $2, decidido_por = $3, decidido_at = now() WHERE id = $1', [id, input.decisao === 'aprovar' ? 'aprovado' : 'recusado', playerId])
    return { decisao: input.decisao }
  })
}

export async function sair(playerId: string) {
  await requireUnlock(playerId, 'corporacoes')
  return txAs(playerId, async (c) => {
    const eu = await membroDe(c, playerId)
    if (!eu) throw new RecordError('Você não faz parte de uma Corporação.', 409)
    await corpPorId(c, eu.corporacao_id, true)
    const [n] = await run<{ n: string }>(c, 'SELECT count(*) AS n FROM corporacao_membros WHERE corporacao_id = $1', [eu.corporacao_id])
    const sozinho = Number(n?.n ?? 0) <= 1
    if (eu.cargo === 'lider' && !sozinho) throw new RecordError('Passe a liderança para outro membro antes de sair.', 409)
    await run(c, 'DELETE FROM corporacao_membros WHERE player_id = $1', [playerId])
    if (sozinho) {
      // Último membro saiu: a Corporação se dissolve (código deixa de valer; pedidos e convites caem).
      await run(c, "UPDATE corporacoes SET status = 'dissolvida', dissolvida_at = now() WHERE id = $1", [eu.corporacao_id])
      await run(c, "UPDATE corporacao_pedidos SET status = 'cancelado', decidido_at = now() WHERE corporacao_id = $1 AND status = 'pendente'", [eu.corporacao_id])
      await run(c, "UPDATE corporacao_convites SET status = 'cancelado', respondido_at = now() WHERE corporacao_id = $1 AND status = 'pendente'", [eu.corporacao_id])
    }
    return { saiu: true, dissolvida: sozinho }
  })
}

async function exigirLider(c: PoolClient, playerId: string) {
  const eu = await membroDe(c, playerId)
  if (!eu || eu.cargo !== 'lider') throw new RecordError('Só o líder pode fazer isso.', 403)
  await corpPorId(c, eu.corporacao_id, true)
  return eu
}

async function alvoNaMesma(c: PoolClient, corpId: string, alvoRaw: unknown) {
  const alvo = uuid(alvoRaw, 'Membro inválido.')
  const m = await membroDe(c, alvo)
  if (!m || m.corporacao_id !== corpId) throw new RecordError('Esse Record não é membro da sua Corporação.', 404)
  return { alvo, m }
}

export async function definirCargo(playerId: string, input: { playerId: unknown; cargo: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  if (input.cargo !== 'vice' && input.cargo !== 'membro') throw new RecordError('Cargo inválido.')
  return txAs(playerId, async (c) => {
    const eu = await exigirLider(c, playerId)
    const { alvo, m } = await alvoNaMesma(c, eu.corporacao_id, input.playerId)
    if (m.cargo === 'lider') throw new RecordError('Use "Passar liderança" para mudar o líder.', 409)
    await run(c, 'UPDATE corporacao_membros SET cargo = $2 WHERE player_id = $1', [alvo, input.cargo])
    return { cargo: input.cargo }
  })
}

export async function removerMembro(playerId: string, alvoRaw: unknown) {
  await requireUnlock(playerId, 'corporacoes')
  return txAs(playerId, async (c) => {
    const eu = await exigirLider(c, playerId)
    const { alvo, m } = await alvoNaMesma(c, eu.corporacao_id, alvoRaw)
    if (m.cargo === 'lider') throw new RecordError('O líder não pode remover a si mesmo.', 409)
    await run(c, 'DELETE FROM corporacao_membros WHERE player_id = $1', [alvo])
    return { removido: true }
  })
}

export async function passarLideranca(playerId: string, alvoRaw: unknown) {
  await requireUnlock(playerId, 'corporacoes')
  return txAs(playerId, async (c) => {
    const eu = await exigirLider(c, playerId)
    const { alvo, m } = await alvoNaMesma(c, eu.corporacao_id, alvoRaw)
    if (m.cargo === 'lider') throw new RecordError('Você já é o líder.', 409)
    await run(c, "UPDATE corporacao_membros SET cargo = 'vice' WHERE player_id = $1", [playerId])
    await run(c, "UPDATE corporacao_membros SET cargo = 'lider' WHERE player_id = $1", [alvo])
    return { lider: alvo }
  })
}

/* ------------------------------------------------------------------ Fundar (Tempo + aprovação administrativa) */

export async function fundar(playerId: string, input: { nome: unknown; lema?: unknown; forma: unknown; cor: unknown; idem?: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const nome = texto(input.nome, 3, 40, 'O nome')!
  const lema = texto(input.lema, 3, 90, 'O lema', true)
  if (!isBrasaoForma(input.forma)) throw new RecordError('Escolha a forma do brasão.')
  if (!isBrasaoCor(input.cor)) throw new RecordError('Escolha a cor do brasão.')
  const forma: BrasaoForma = input.forma
  const cor: BrasaoCor = input.cor
  const idem = typeof input.idem === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(input.idem) ? input.idem : null
  const c0 = await cfg()
  return txAs(playerId, async (c) => {
    await travarJogador(c, playerId)
    // Repetição do mesmo envio (toque duplo, rede instável): devolve a fundação já registrada, sem cobrar de novo.
    if (idem) {
      const [ja] = await run<{ id: string }>(c, 'SELECT id FROM corporacoes WHERE fundador_id = $1 AND envio_idem = $2', [playerId, idem])
      if (ja) return { corporacaoId: ja.id, timeDeltaMs: 0, repetido: true }
    }
    await semVinculo(c, playerId)
    const reqs = requisitos(c0, await perfilRow(c, playerId))
    if (!reqs.every((r) => r.ok)) throw new RecordError('Seu perfil ainda não atende aos requisitos da Companhia.', 409)
    const [dup] = await run(c, "SELECT 1 FROM corporacoes WHERE lower(nome) = lower($1) AND status IN ('pendente', 'ativa')", [nome])
    if (dup) throw new RecordError('Já existe uma Corporação com esse nome.', 409)
    const [corp] = await run<{ id: string }>(
      c,
      `INSERT INTO corporacoes (nome, lema, brasao_forma, brasao_cor, fundador_id, custo_pago, requisitos, envio_idem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nome, lema, forma, cor, playerId, c0.custo, JSON.stringify(reqs), idem],
    )
    const timeDeltaMs = await debitar(c, { playerId, minutos: c0.custo, motivo: 'fundar', ref: corp.id, idem: `corp:fundar:${corp.id}`, reserva: c0.reserva })
    return { corporacaoId: corp.id, timeDeltaMs, repetido: false }
  })
}

/** O fundador desiste enquanto a Companhia avalia: o Tempo volta (uma vez). */
export async function cancelarFundacao(playerId: string) {
  await requireUnlock(playerId, 'corporacoes')
  return txAs(playerId, async (c) => {
    const [corp] = await run<{ id: string; custo_pago: number }>(c, "SELECT id, custo_pago FROM corporacoes WHERE fundador_id = $1 AND status = 'pendente' FOR UPDATE", [playerId])
    if (!corp) throw new RecordError('Não há Corporação sua em análise.', 409)
    await run(c, "UPDATE corporacoes SET status = 'cancelada', decidida_at = now() WHERE id = $1", [corp.id])
    const devolvido = await creditar(c, { playerId, minutos: corp.custo_pago, motivo: 'fundar:devolucao', ref: corp.id, idem: `corp:fundar:${corp.id}:devolucao` })
    return { cancelada: true, devolvido }
  })
}

/* ------------------------------------------------------------------ Convites diretos */

export async function convidar(playerId: string, input: { nome: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const nome = texto(input.nome, 2, 40, 'O nome do Record')!
  return txAs(playerId, async (c) => {
    const eu = await membroDe(c, playerId)
    if (!eu) throw new RecordError('Só membros de uma Corporação podem convidar.', 403)
    const corp = await corpPorId(c, eu.corporacao_id, true)
    if (!corp || corp.status !== 'ativa') throw new RecordError('A Corporação não está ativa.', 409)
    const alvos = await run<{ id: string }>(
      c,
      `SELECT p.id FROM players p WHERE (lower(p.character_name) = lower($1) OR (coalesce(p.character_name, '') = '' AND lower(p.name) = lower($1))) AND coalesce(p.is_test, false) = coalesce((SELECT is_test FROM players WHERE id = $2), false) LIMIT 2`,
      [nome, playerId],
    )
    if (alvos.length !== 1) throw new RecordError('Nenhum Record encontrado com esse nome.', 404)
    const para = alvos[0].id
    if (para === playerId) throw new RecordError('Você já faz parte desta Corporação.', 409)
    if (await membroDe(c, para)) throw new RecordError('Esse Record já faz parte de uma Corporação.', 409)
    const ins = await run<{ id: string }>(
      c,
      'INSERT INTO corporacao_convites (corporacao_id, de_id, para_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
      [corp.id, playerId, para],
    )
    if (!ins.length) throw new RecordError('Esse Record já tem um convite pendente desta Corporação.', 409)
    return { conviteId: ins[0].id }
  })
}

/**
 * Responder a um convite. Convite de líder/vice: aceitar entra direto. De membro comum: aceitar vira um pedido
 * (origem 'convite') que o líder ou o vice decide — a entrada sempre passa por eles.
 */
export async function responderConvite(playerId: string, input: { id: unknown; aceitar: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const id = uuid(input.id, 'Convite inválido.')
  const c0 = await cfg()
  return txAs(playerId, async (c) => {
    await travarJogador(c, playerId)
    const [v] = await run<{ id: string; corporacao_id: string; de_id: string | null; status: string }>(
      c,
      'SELECT id, corporacao_id, de_id, status FROM corporacao_convites WHERE id = $1 AND para_id = $2 FOR UPDATE',
      [id, playerId],
    )
    if (!v) throw new RecordError('Convite não encontrado.', 404)
    if (v.status !== 'pendente') throw new RecordError('Esse convite não está mais pendente.', 409)
    if (input.aceitar !== true) {
      await run(c, "UPDATE corporacao_convites SET status = 'recusado', respondido_at = now() WHERE id = $1", [id])
      return { aceito: false, entrou: false }
    }
    const corp = await corpPorId(c, v.corporacao_id, true)
    if (!corp || corp.status !== 'ativa') throw new RecordError('Essa Corporação não está mais ativa.', 409)
    await semVinculo(c, playerId)
    const de = v.de_id ? await membroDe(c, v.de_id) : null
    const direto = !!de && de.corporacao_id === corp.id && podeDecidir(de.cargo)
    await run(c, "UPDATE corporacao_convites SET status = 'aceito', respondido_at = now() WHERE id = $1", [id])
    if (direto) {
      await entrarComo(c, corp.id, playerId, 'membro', c0.maxMembros)
      return { aceito: true, entrou: true }
    }
    await run(c, "INSERT INTO corporacao_pedidos (corporacao_id, player_id, origem, convidado_por) VALUES ($1, $2, 'convite', $3)", [corp.id, playerId, v.de_id])
    return { aceito: true, entrou: false }
  })
}

export async function cancelarConvite(playerId: string, idRaw: unknown) {
  await requireUnlock(playerId, 'corporacoes')
  const id = uuid(idRaw, 'Convite inválido.')
  return txAs(playerId, async (c) => {
    const eu = await membroDe(c, playerId)
    const [v] = await run<{ corporacao_id: string; de_id: string | null }>(c, "SELECT corporacao_id, de_id FROM corporacao_convites WHERE id = $1 AND status = 'pendente' FOR UPDATE", [id])
    if (!v || !eu || eu.corporacao_id !== v.corporacao_id || (v.de_id !== playerId && !podeDecidir(eu.cargo))) throw new RecordError('Você não pode cancelar esse convite.', 403)
    await run(c, "UPDATE corporacao_convites SET status = 'cancelado', respondido_at = now() WHERE id = $1", [id])
    return { cancelado: true }
  })
}

/* ------------------------------------------------------------------ Transferir cartas entre membros */

/**
 * A carta sai do save do remetente (linha travada) e chega ao destinatário por card_deliveries (outro uid), na
 * mesma transação. O uid fica registrado: não sai duas vezes e o /api/save não o devolve. Cartas presas no Salão
 * das Máscaras (Bandeja/Mercado) não podem ser transferidas.
 */
export async function transferirCarta(playerId: string, input: { uid: unknown; para: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const uid = typeof input.uid === 'string' ? input.uid.slice(0, 80) : ''
  if (!uid) throw new RecordError('Escolha uma carta.')
  const para = uuid(input.para, 'Escolha um membro.')
  if (para === playerId) throw new RecordError('Escolha outro membro.')
  const c0 = await cfg()
  return txAs(playerId, async (c) => {
    const eu = await membroDe(c, playerId)
    if (!eu) throw new RecordError('Só membros de uma Corporação transferem cartas.', 403)
    const corp = await corpPorId(c, eu.corporacao_id)
    if (!corp || corp.status !== 'ativa') throw new RecordError('A Corporação não está ativa.', 409)
    const alvo = await membroDe(c, para)
    if (!alvo || alvo.corporacao_id !== eu.corporacao_id) throw new RecordError('O destinatário precisa ser membro da sua Corporação.', 403)
    if ((await uidsNoSalao(playerId, c)).has(uid)) throw new RecordError('Essa carta está no Salão das Máscaras e não pode ser transferida.', 409)
    const [row] = await run<{ card_id: string | null }>(
      c,
      `SELECT (SELECT e->>'cardId' FROM jsonb_array_elements(coalesce(data->'inventory', '[]'::jsonb)) e WHERE e->>'uid' = $2 LIMIT 1) AS card_id
         FROM player_saves WHERE player_id = $1 FOR UPDATE`,
      [playerId, uid],
    )
    if (!row?.card_id) throw new RecordError('Essa carta não está mais no seu inventário.', 404)
    let nomeCarta = row.card_id
    try {
      nomeCarta = getCard(row.card_id).name
    } catch {
      throw new RecordError('Carta desconhecida.', 400)
    }
    if ((await transferenciasHoje(c, playerId)) >= c0.porDia) throw new RecordError(`Limite de ${c0.porDia} transferências por dia atingido.`, 409)
    const [t] = await run<{ id: string }>(
      c,
      'INSERT INTO corporacao_transferencias (corporacao_id, de_id, para_id, card_uid, card_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (de_id, card_uid) DO NOTHING RETURNING id',
      [corp.id, playerId, para, uid, row.card_id],
    )
    if (!t) throw new RecordError('Essa carta já foi transferida.', 409)
    await run(
      c,
      `UPDATE player_saves SET data = jsonb_set(data, '{inventory}',
          coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(data->'inventory') e WHERE e->>'uid' <> $2), '[]'::jsonb)),
          updated_at = now()
        WHERE player_id = $1`,
      [playerId, uid],
    )
    const de = await nomeDe(c, playerId)
    await deliverCard({ playerId: para, cardId: row.card_id, origem: `${corp.nome} · de ${de}`, ref: t.id, idem: `corp:transf:${t.id}` }, c)
    return { transferenciaId: t.id, uid, carta: nomeCarta }
  })
}

/** Uids que saíram do save por transferência (o /api/save descarta: cópia velha do cliente não ressuscita a carta). */
export async function uidsTransferidos(playerId: string, q: Queryable = pool): Promise<Set<string>> {
  if (!UUID_RE.test(playerId)) return new Set()
  const rows = await run<{ uid: string }>(q, 'SELECT card_uid AS uid FROM corporacao_transferencias WHERE de_id = $1', [playerId]).catch(() => [])
  return new Set(rows.map((r) => r.uid))
}

/* ------------------------------------------------------------------ Recrutamento no Salão das Máscaras */

export async function recrutar(playerId: string, input: { titulo: unknown; texto: unknown }) {
  await requireUnlock(playerId, 'corporacoes')
  const titulo = texto(input.titulo, 3, 80, 'O título')!
  const corpo = texto(input.texto, 3, 480, 'O texto')!
  const eu = await membroDe(pool, playerId)
  if (!eu || !podeDecidir(eu.cargo)) throw new RecordError('Só o líder ou o vice-líder publica o recrutamento.', 403)
  const corp = await corpPorId(pool, eu.corporacao_id)
  if (!corp || corp.status !== 'ativa' || !corp.codigo) throw new RecordError('A Corporação não está ativa.', 409)
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const id = await publicarRecrutamento({
    corporacao: corp.nome,
    titulo,
    texto: `${corpo}\nCódigo de identificação: ${corp.codigo}`,
    autorId: playerId,
    ref: `corp:${corp.id}:${dia}`,
  })
  return { anuncioId: id }
}

/* ------------------------------------------------------------------ Equipe (Mesa do Record) */

export async function mesaCorporacoes(atorId: string): Promise<CorpMesa> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'corporacao.aprovar')
  const c0 = await cfg()
  const [pend, ativas] = await Promise.all([
    run<CorpRow & { fundador: string | null }>(
      pool,
      `SELECT c.*, 0 AS membros, (SELECT ${NOME} FROM players p WHERE p.id = c.fundador_id) AS fundador
         FROM corporacoes c WHERE c.status = 'pendente' ORDER BY c.created_at LIMIT 50`,
    ),
    run<CorpRow & { lider: string | null }>(
      pool,
      `${CORP_SELECT.replace('FROM corporacoes c', `, (SELECT ${NOME} FROM corporacao_membros m JOIN players p ON p.id = m.player_id WHERE m.corporacao_id = c.id AND m.cargo = 'lider') AS lider FROM corporacoes c`)}
        WHERE c.status = 'ativa' ORDER BY (c.classificacao = 'necro') DESC, c.created_at DESC LIMIT 60`,
    ),
  ])
  return {
    pendentes: pend.map((r) => ({
      ...resumo(r),
      fundador: r.fundador ?? '—',
      fundadorId: r.fundador_id,
      custo: r.custo_pago,
      lema: r.lema,
      requisitos: Array.isArray(r.requisitos) ? r.requisitos : [],
      createdAt: r.created_at.getTime(),
    })),
    ativas: ativas.map((r) => ({ ...resumo(r), lider: r.lider, classificacaoNota: r.classificacao_nota, createdAt: r.created_at.getTime() })),
    provisorio: c0.provisorio,
  }
}

async function novoCodigo(c: PoolClient) {
  for (let i = 0; i < 8; i++) {
    const s = Array.from({ length: 8 }, () => CODIGO_ALFABETO[randomInt(CODIGO_ALFABETO.length)]).join('')
    const codigo = `CRP-${s.slice(0, 4)}-${s.slice(4)}`
    const [ja] = await run(c, 'SELECT 1 FROM corporacoes WHERE codigo = $1', [codigo])
    if (!ja) return codigo
  }
  throw new RecordError('Não foi possível gerar o código. Tente de novo.', 500)
}

/** Avaliação administrativa (Owner/Anfitrião). Aprovar gera o código e faz do fundador o líder. */
export async function decidirFundacao(atorId: string, input: { id: unknown; decisao: unknown; nota?: unknown }) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'corporacao.aprovar')
  const id = uuid(input.id, 'Corporação inválida.')
  if (input.decisao !== 'aprovar' && input.decisao !== 'recusar') throw new RecordError('Decisão inválida.')
  const nota = texto(input.nota, 2, 240, 'O parecer', true)
  const c0 = await cfg()
  return txAs(atorId, async (c) => {
    const corp = await corpPorId(c, id, true)
    if (!corp) throw new RecordError('Corporação não encontrada.', 404)
    if (corp.status !== 'pendente') throw new RecordError('Essa fundação já foi decidida.', 409)
    if (input.decisao === 'recusar') {
      await run(c, "UPDATE corporacoes SET status = 'recusada', decisao_nota = $2, decidida_por = $3, decidida_at = now() WHERE id = $1", [id, nota, atorId])
      const devolvido =
        c0.devolver && corp.fundador_id
          ? await creditar(c, { playerId: corp.fundador_id, minutos: corp.custo_pago, motivo: 'fundar:devolucao', ref: id, idem: `corp:fundar:${id}:devolucao` })
          : false
      await log(c, { ator: atorId, acao: 'corporacao.recusada', alvo: corp.fundador_id, ref: id, data: { nome: corp.nome, nota, devolvido } })
      return { decisao: 'recusar', devolvido }
    }
    if (!corp.fundador_id) throw new RecordError('A Corporação não tem fundador.', 409)
    const codigo = await novoCodigo(c)
    await run(c, "UPDATE corporacoes SET status = 'ativa', codigo = $2, decisao_nota = $3, decidida_por = $4, decidida_at = now() WHERE id = $1", [id, codigo, nota, atorId])
    await entrarComo(c, id, corp.fundador_id, 'lider', c0.maxMembros)
    await log(c, { ator: atorId, acao: 'corporacao.aprovada', alvo: corp.fundador_id, ref: id, data: { nome: corp.nome, codigo } })
    return { decisao: 'aprovar', codigo }
  })
}

/** Status legal: oficial ↔ Necro-Corporação. Só a equipe (can + gatilho no banco). */
export async function classificar(atorId: string, input: { id: unknown; classificacao: unknown; nota?: unknown }) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'corporacao.classificar', undefined, 'Só a equipe da Companhia classifica uma Corporação.')
  const id = uuid(input.id, 'Corporação inválida.')
  if (input.classificacao !== 'oficial' && input.classificacao !== 'necro') throw new RecordError('Classificação inválida.')
  const nota = texto(input.nota, 2, 240, 'A justificativa', true)
  return txAs(atorId, async (c) => {
    const corp = await corpPorId(c, id, true)
    if (!corp || corp.status !== 'ativa') throw new RecordError('Corporação não encontrada.', 404)
    await run(c, 'UPDATE corporacoes SET classificacao = $2, classificacao_nota = $3 WHERE id = $1', [id, input.classificacao, nota])
    await log(c, { ator: atorId, acao: 'corporacao.classificada', alvo: corp.fundador_id, ref: id, data: { nome: corp.nome, classificacao: input.classificacao, nota } })
    return { classificacao: input.classificacao }
  })
}

/** PROVISÓRIO: rótulo "Corporação Global". */
export async function definirEscopo(atorId: string, input: { id: unknown; escopo: unknown }) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'corporacao.classificar')
  const id = uuid(input.id, 'Corporação inválida.')
  if (input.escopo !== 'local' && input.escopo !== 'global') throw new RecordError('Escopo inválido.')
  const rows = await run(pool, "UPDATE corporacoes SET escopo = $2 WHERE id = $1 AND status = 'ativa' RETURNING id", [id, input.escopo])
  if (!rows.length) throw new RecordError('Corporação não encontrada.', 404)
  return { escopo: input.escopo }
}

/** PROVISÓRIO: marcar/desmarcar duas Corporações como rivais. */
export async function definirRivalidade(atorId: string, input: { a: unknown; b: unknown; on: unknown; nota?: unknown }) {
  const ator = await requireActor(atorId)
  requireCan(ator, 'corporacao.classificar')
  const a = uuid(input.a, 'Corporação inválida.')
  const b = uuid(input.b, 'Corporação inválida.')
  if (a === b) throw new RecordError('Escolha duas Corporações diferentes.')
  const [x, y] = a < b ? [a, b] : [b, a]
  if (input.on === false) {
    await run(pool, 'DELETE FROM corporacao_rivalidades WHERE a_id = $1 AND b_id = $2', [x, y])
    return { rivais: false }
  }
  await run(pool, 'INSERT INTO corporacao_rivalidades (a_id, b_id, nota, criada_por) VALUES ($1, $2, $3, $4) ON CONFLICT (a_id, b_id) DO NOTHING', [x, y, texto(input.nota, 2, 160, 'A nota', true), atorId])
  return { rivais: true }
}

