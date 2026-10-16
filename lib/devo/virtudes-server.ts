import 'server-only'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { normalizeCargo } from './cargos'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { consumeItem } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, hasUnlock } from './progresso-server'
import {
  acumuloQualitativo,
  AFINIDADES_PADRAO,
  type AfinidadesConfig,
  afinidadeDaOrdem,
  arcanoInfo,
  type ArcanoKey,
  distribuir,
  ESTAGIOS_PADRAO,
  type EstagioLimite,
  type EstagiosConfig,
  EVOLUCAO_PADRAO,
  type EvolucaoConfig,
  type EvolucaoResultado,
  isArcano,
  isVirtude,
  limitesDoEstagio,
  type MesaJogador,
  ordemValida,
  VIRTUDE_KEYS,
  type VirtudeKey,
  VIRTUDES,
  type VirtudesMesa,
  type VirtudesPayload,
} from './virtudes'

/**
 * Virtudes no servidor (contrato: docs/redesign/FUNDACAO.md §13). Os números (P.P., teto, multiplicadores,
 * atributos) só existem aqui e na Mesa; o payload do jogador é qualitativo.
 */

export const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para despertar as Virtudes.'

type Fontes = {
  jogos: Record<string, { virtude: string; vitoria: number; empate: number; derrota: number }>
  deadly_vote: { participacao: Record<string, number>; sobreviveu: Record<string, number> }
}
const FONTES_PADRAO: Fontes = {
  jogos: {
    chess: { virtude: 'ouros', vitoria: 3, empate: 2, derrota: 1 },
    'memory-rush': { virtude: 'ouros', vitoria: 3, empate: 2, derrota: 1 },
    'hot-bomb': { virtude: 'espadas', vitoria: 3, empate: 2, derrota: 1 },
    bluff: { virtude: 'escudos', vitoria: 3, empate: 2, derrota: 1 },
  },
  deadly_vote: { participacao: { paus: 2 }, sobreviveu: { tacas: 2, paus: 1 } },
}

/* ------------------------------------------------------------------ Configuração */

function afinidadesValidas(v: unknown): v is AfinidadesConfig {
  const a = v as AfinidadesConfig
  return !!a && Array.isArray(a.escala) && a.escala.length === 6 && a.escala.every((n) => typeof n === 'number' && n >= 0) && !!a.ordem && typeof a.ordem === 'object'
}
function estagiosValidos(v: unknown): v is EstagiosConfig {
  const e = v as EstagiosConfig
  const linhas = (l: unknown) => Array.isArray(l) && l.every((x: EstagioLimite) => Number.isInteger(x?.estagio) && x.estagio >= 1 && x.minimo >= 0 && x.teto > 0 && x.minimo <= x.teto)
  return !!e && linhas(e.padrao) && (e.padrao as unknown[]).length > 0 && (!e.porArcano || Object.values(e.porArcano).every(linhas))
}

export async function lerConfigs(q: Queryable = pool) {
  const [a, e, ev, f] = await Promise.all([
    getConfig<AfinidadesConfig>('virtudes.afinidades', q).catch(() => null),
    getConfig<EstagiosConfig>('virtudes.estagios', q).catch(() => null),
    getConfig<EvolucaoConfig>('virtudes.evolucao', q).catch(() => null),
    getConfig<Fontes>('virtudes.fontes', q).catch(() => null),
  ])
  const av: unknown = a?.value
  const evv: unknown = e?.value
  return {
    afinidades: afinidadesValidas(av) ? av : AFINIDADES_PADRAO,
    afinidadesProvisorio: a?.provisional ?? true,
    estagios: estagiosValidos(evv) ? { padrao: evv.padrao, porArcano: evv.porArcano ?? {} } : ESTAGIOS_PADRAO,
    estagiosProvisorio: e?.provisional ?? true,
    evolucao: { ...EVOLUCAO_PADRAO, ...(ev?.value ?? {}) },
    fontes: (f?.value as Fontes | undefined) ?? FONTES_PADRAO,
  }
}

/* ------------------------------------------------------------------ Pontos de Potencial */

export type PotencialOpts = { ref?: string | null; atorId?: string | null; idem?: string | null }

/**
 * Soma P.P. de uma Virtude para o jogador (jogos, ações, recompensas). Respeita o teto do Estágio: devolve o
 * quanto coube (0 = já está no limite). `idem` evita somar duas vezes a mesma origem. Não exige o sistema
 * liberado: os P.P. sobem sozinhos; só a tela fica trancada.
 */
export async function addPotencial(playerId: string, virtude: VirtudeKey, qtd: number, motivo: string, opts: PotencialOpts = {}, q: Queryable = pool): Promise<number> {
  if (!isVirtude(virtude)) throw new RecordError('Virtude desconhecida.')
  const n = Number(qtd)
  if (!(n > 0 && n <= 1000)) throw new RecordError('Quantidade inválida.')
  const [r] = await run<{ v: string }>(q, 'SELECT devo_virtude_pp_add($1, $2, $3, $4, $5, $6, $7) AS v', [
    playerId,
    virtude,
    n,
    motivo.slice(0, 60),
    opts.ref ?? null,
    opts.atorId ?? null,
    opts.idem ?? null,
  ])
  return Number(r.v)
}

/**
 * Versão para dentro de outra transação (fechamento de partida, resultado de Deadly Vote): usa SAVEPOINT e
 * NUNCA lança — uma falha nos P.P. não pode derrubar a partida nem o voto.
 */
export async function addPotencialSeguro(c: PoolClient, playerId: string, virtude: string, qtd: number, motivo: string, opts: PotencialOpts = {}): Promise<number> {
  if (!isVirtude(virtude) || !(qtd > 0)) return 0
  try {
    await c.query('SAVEPOINT devo_pp')
    const v = await addPotencial(playerId, virtude, qtd, motivo, opts, c)
    await c.query('RELEASE SAVEPOINT devo_pp')
    return v
  } catch (err) {
    await c.query('ROLLBACK TO SAVEPOINT devo_pp').catch(() => {})
    console.error('[virtudes] P.P. não registrados:', err instanceof Error ? err.message : err)
    return 0
  }
}

/** Sala de Jogos: participação e vitória numa partida real (chamado no fechamento da sala). */
export async function potencialDaPartida(c: PoolClient, r: { playerId: string; gameId: string; result: 'win' | 'loss' | 'draw'; matchRef: string }) {
  const cfg = await getConfig<Fontes>('virtudes.fontes', c).catch(() => null)
  const f = (cfg?.value ?? FONTES_PADRAO).jogos?.[r.gameId]
  if (!f) return 0
  const qtd = r.result === 'win' ? f.vitoria : r.result === 'draw' ? f.empate : f.derrota
  return addPotencialSeguro(c, r.playerId, f.virtude, Number(qtd) || 0, r.result === 'win' ? 'jogo.vitoria' : 'jogo.participacao', {
    ref: `${r.gameId}:${r.matchRef}`,
    idem: `jogo:${r.matchRef}:${r.playerId}`,
  })
}

/** Deadly Vote: participação (quem jogou) e sobrevivência (quem recebeu prêmio), ao aplicar o resultado. */
export async function potencialDoDeadlyVote(c: PoolClient, voteId: string, entries: { player_id: string; decision: string | null }[]) {
  const cfg = await getConfig<Fontes>('virtudes.fontes', c).catch(() => null)
  const dv = (cfg?.value ?? FONTES_PADRAO).deadly_vote ?? FONTES_PADRAO.deadly_vote
  for (const e of entries) {
    if (!e.decision || e.decision === 'ausente') continue
    for (const [v, q] of Object.entries(dv.participacao ?? {}))
      await addPotencialSeguro(c, e.player_id, v, Number(q), 'dv.participacao', { ref: voteId, idem: `dv:${voteId}:${e.player_id}:participacao:${v}` })
    if (e.decision === 'premio')
      for (const [v, q] of Object.entries(dv.sobreviveu ?? {}))
        await addPotencialSeguro(c, e.player_id, v, Number(q), 'dv.sobreviveu', { ref: voteId, idem: `dv:${voteId}:${e.player_id}:sobreviveu:${v}` })
  }
}

/* ------------------------------------------------------------------ Leitura */

type Linha = { id: string; name: string; role: string; is_test: boolean | null; arcano: string | null; arcano_estagio: number }

async function ppDe(ids: string[], q: Queryable) {
  const rows = ids.length ? await run<{ player_id: string; virtude: VirtudeKey; pp: string }>(q, 'SELECT player_id, virtude, pp FROM virtude_pp WHERE player_id = ANY($1)', [ids]) : []
  const m = new Map<string, Record<VirtudeKey, number>>()
  for (const id of ids) m.set(id, Object.fromEntries(VIRTUDE_KEYS.map((v) => [v, 0])) as Record<VirtudeKey, number>)
  for (const r of rows) m.get(r.player_id)![r.virtude] = Number(r.pp)
  return m
}
const soma = (o: Record<VirtudeKey, number>) => Math.round(VIRTUDE_KEYS.reduce((s, v) => s + o[v], 0) * 100) / 100

function extremos(ganhos: Record<string, number>): { mais: VirtudeKey; menos: VirtudeKey } {
  const ord = VIRTUDE_KEYS.map((v) => [v, Number(ganhos?.[v] ?? 0)] as const).sort((a, b) => b[1] - a[1])
  return { mais: ord[0][0], menos: ord[ord.length - 1][0] }
}

/** Tela do jogador (GET /api/virtudes). SEM números: nem P.P., nem teto, nem multiplicador, nem atributo. */
export async function estadoVirtudes(playerId: string): Promise<VirtudesPayload> {
  if (!(await hasUnlock(playerId, 'virtudes'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const [p] = await run<Linha>(pool, 'SELECT id, name, role, is_test, arcano, arcano_estagio FROM players WHERE id = $1', [playerId])
  if (!p) throw new RecordError('Registro não encontrado.', 404)
  const cfg = await lerConfigs()
  const arcano = isArcano(p.arcano) ? p.arcano : null
  const ordem = arcano ? cfg.afinidades.ordem[arcano] : null
  const pp = (await ppDe([p.id], pool)).get(p.id)!
  const total = soma(pp)
  const lim = limitesDoEstagio(cfg.estagios, arcano, p.arcano_estagio)
  const evol = await run<{ at: Date; de_estagio: number; para_estagio: number; arcano: string | null; ganhos: Record<string, number> }>(
    pool,
    'SELECT at, de_estagio, para_estagio, arcano, ganhos FROM virtude_evolucoes WHERE player_id = $1 ORDER BY at DESC, id DESC LIMIT 20',
    [p.id],
  )
  const top = VIRTUDE_KEYS.reduce<VirtudeKey | null>((best, v) => (pp[v] > 0 && (!best || pp[v] > pp[best]) ? v : best), null)
  return {
    liberado: true,
    arcano: arcano ? arcanoInfo(arcano) : null,
    estagio: p.arcano_estagio,
    ultimoEstagio: lim.ultimo,
    virtudes: VIRTUDE_KEYS.map((v) => ({
      key: v,
      nome: VIRTUDES[v].nome,
      antiga: VIRTUDES[v].antiga,
      texto: VIRTUDES[v].texto,
      afinidade: ordem && ordemValida(ordem) ? afinidadeDaOrdem(ordem[v]) : null,
    })),
    acumulo: acumuloQualitativo(total, lim.minimo, lim.teto),
    tendencia: top,
    evolucoes: evol.map((e) => {
      const x = extremos(e.ganhos)
      return { at: e.at.getTime(), de: e.de_estagio, para: e.para_estagio, arcano: isArcano(e.arcano) ? arcanoInfo(e.arcano).titulo : null, maisCresceu: x.mais, menosCresceu: x.menos }
    }),
  }
}

/** Mesa › Virtudes (Owner/Anfitrião): números de verdade, por jogador. Owner só aparece para Owner. */
export async function mesaVirtudes(atorId: string, busca?: string | null): Promise<VirtudesMesa> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'virtudes.ver')
  const termo = typeof busca === 'string' ? busca.trim().slice(0, 40).replace(/[%_\\]/g, '') : ''
  const rows = await run<Linha>(
    pool,
    `SELECT id, name, role, is_test, arcano, arcano_estagio FROM players
      WHERE ($1 = '' OR name ILIKE '%' || $1 || '%') AND ($2 OR role <> 'owner')
      ORDER BY (arcano IS NULL), is_test, lower(name) LIMIT 60`,
    [termo, ator.cargo === 'owner'],
  )
  const ids = rows.map((r) => r.id)
  const cfg = await lerConfigs()
  const [pp, niveis, evol] = await Promise.all([
    ppDe(ids, pool),
    ids.length ? run<{ player_id: string; virtude: VirtudeKey; valor: string }>(pool, 'SELECT player_id, virtude, valor FROM virtude_nivel WHERE player_id = ANY($1)', [ids]) : [],
    ids.length
      ? run<{ player_id: string; at: Date; de_estagio: number; para_estagio: number; total: string; ganhos: Record<VirtudeKey, number>; por: string | null; por_role: string | null }>(
          pool,
          `SELECT e.player_id, e.at, e.de_estagio, e.para_estagio, e.total, e.ganhos, a.name AS por, a.role AS por_role
             FROM virtude_evolucoes e LEFT JOIN players a ON a.id = e.actor_id WHERE e.player_id = ANY($1) ORDER BY e.at DESC, e.id DESC`,
          [ids],
        )
      : [],
  ])
  const jogadores: MesaJogador[] = rows.map((r) => {
    const arcano = isArcano(r.arcano) ? r.arcano : null
    const lim = limitesDoEstagio(cfg.estagios, arcano, r.arcano_estagio)
    const p = pp.get(r.id)!
    const nivel = Object.fromEntries(VIRTUDE_KEYS.map((v) => [v, 0])) as Record<VirtudeKey, number>
    for (const n of niveis) if (n.player_id === r.id) nivel[n.virtude] = Number(n.valor)
    return {
      id: r.id,
      nome: r.name,
      arcano,
      estagio: r.arcano_estagio,
      pp: p,
      total: soma(p),
      minimo: lim.minimo,
      teto: lim.teto,
      ultimoEstagio: lim.ultimo,
      nivel,
      evolucoes: evol
        .filter((e) => e.player_id === r.id)
        .slice(0, 6)
        .map((e) => ({
          at: e.at.getTime(),
          de: e.de_estagio,
          para: e.para_estagio,
          total: Number(e.total),
          ganhos: e.ganhos,
          // quem disparou: Owner não é revelado a quem não é Owner
          por: e.por && (normalizeCargo(e.por_role) !== 'owner' || ator.cargo === 'owner') ? e.por : e.por ? 'Equipe' : null,
        })),
      isTest: !!r.is_test,
    }
  })
  return {
    podeEvoluir: true,
    podeEditar: ator.cargo === 'owner',
    jogadores,
    config: { afinidades: cfg.afinidades, afinidadesProvisorio: cfg.afinidadesProvisorio, estagios: cfg.estagios, estagiosProvisorio: cfg.estagiosProvisorio, evolucao: cfg.evolucao },
  }
}

/* ------------------------------------------------------------------ Ações da equipe */

function exigirJogador(id: unknown): string {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new RecordError('Jogador inválido.')
  return id
}

/** Define (ou limpa, com null) o Arcano de um jogador. Owner/Anfitrião. Não mexe no Estágio nem nos P.P. */
export async function definirArcano(atorId: string, playerIdRaw: unknown, arcanoRaw: unknown) {
  const playerId = exigirJogador(playerIdRaw)
  const arcano = arcanoRaw === null || arcanoRaw === '' ? null : arcanoRaw
  if (arcano !== null && !isArcano(arcano)) throw new RecordError('Arcano desconhecido.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'virtudes.evoluir')
    const rows = await run<{ role: string }>(c, 'UPDATE players SET arcano = $2 WHERE id = $1 RETURNING role', [playerId, arcano])
    if (!rows.length) throw new RecordError('Jogador não encontrado.', 404)
    if (normalizeCargo(rows[0].role) === 'owner' && ator.cargo !== 'owner') throw new RecordError('Jogador não encontrado.', 404)
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.arcano', $2, $3)", [ator.id, playerId, JSON.stringify({ arcano })])
    return { arcano: arcano as ArcanoKey | null }
  })
}

/** Lançamento manual de P.P. (Owner), com log. Respeita o teto como qualquer outra fonte. */
export async function ajustarPotencial(atorId: string, playerIdRaw: unknown, virtudeRaw: unknown, qtdRaw: unknown, motivoRaw: unknown) {
  const playerId = exigirJogador(playerIdRaw)
  if (!isVirtude(virtudeRaw)) throw new RecordError('Virtude desconhecida.')
  const motivo = typeof motivoRaw === 'string' && motivoRaw.trim() ? motivoRaw.trim().slice(0, 60) : 'ajuste_owner'
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'virtudes.ajustar')
    const aplicado = await addPotencial(playerId, virtudeRaw, Number(qtdRaw), motivo, { atorId: ator.id, ref: 'mesa' }, c)
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.potencial', $2, $3)", [
      ator.id,
      playerId,
      JSON.stringify({ virtude: virtudeRaw, pedido: Number(qtdRaw), aplicado, motivo }),
    ])
    return { aplicado }
  })
}

/**
 * Evolução de Estágio (Owner/Anfitrião dispara; o jogador não controla). Exige Arcano definido e P.P. no
 * mínimo do Estágio; espalha o total pela afinidade do Arcano (`distribuir`), soma nos atributos, zera os P.P.
 * e sobe o Estágio — tudo numa transação, com a trava do jogador (a mesma das entradas de P.P.).
 */
export async function evoluirEstagio(atorId: string, playerIdRaw: unknown): Promise<EvolucaoResultado> {
  const playerId = exigirJogador(playerIdRaw)
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'virtudes.evoluir')
    await run(c, 'SELECT pg_advisory_xact_lock(hashtext($1))', [`devo-virtudes:${playerId}`])
    const [p] = await run<Linha>(c, 'SELECT id, name, role, is_test, arcano, arcano_estagio FROM players WHERE id = $1 FOR UPDATE', [playerId])
    if (!p || (normalizeCargo(p.role) === 'owner' && ator.cargo !== 'owner')) throw new RecordError('Jogador não encontrado.', 404)
    if (!isArcano(p.arcano)) throw new RecordError('Defina o Arcano do jogador antes da Evolução de Estágio.', 409)
    const cfg = await lerConfigs(c)
    const ordem = cfg.afinidades.ordem[p.arcano]
    if (!ordemValida(ordem)) throw new RecordError('A tabela de afinidade deste Arcano está incompleta.', 409)
    const lim = limitesDoEstagio(cfg.estagios, p.arcano, p.arcano_estagio)
    if (lim.ultimo) throw new RecordError('Este jogador já está no último Estágio configurado.', 409)
    const pp = (await ppDe([p.id], c)).get(p.id)!
    const total = soma(pp)
    if (total <= 0 || total < lim.minimo) throw new RecordError('Os Pontos de Potencial ainda não alcançaram o mínimo do Estágio.', 409)
    const frag = Math.max(0, Math.floor(Number(cfg.evolucao.fragmentos) || 0))
    if (frag > 0)
      await consumeItem({ playerId, item: 'fragmento_arcano', quantidade: frag, motivo: 'evolucao', ref: `estagio:${p.arcano_estagio + 1}`, atorId: ator.id, idem: `virtudes:evolucao:${playerId}:${p.arcano_estagio + 1}` }, c).catch(
        (err) => {
          throw err instanceof RecordError && err.status === 409 ? new RecordError('Fragmentos de Arcano insuficientes para a Evolução.', 409) : err
        },
      )
    const ganhos = distribuir(total, ordem, cfg.afinidades.escala, pp, Number(cfg.evolucao.peso_direcao) || 0)
    for (const v of VIRTUDE_KEYS)
      await run(
        c,
        `INSERT INTO virtude_nivel (player_id, virtude, valor) VALUES ($1, $2, $3)
         ON CONFLICT (player_id, virtude) DO UPDATE SET valor = virtude_nivel.valor + EXCLUDED.valor`,
        [playerId, v, ganhos[v]],
      )
    await run(c, 'DELETE FROM virtude_pp WHERE player_id = $1', [playerId])
    const para = p.arcano_estagio + 1
    await run(c, 'UPDATE players SET arcano_estagio = $2 WHERE id = $1', [playerId, para])
    await run(c, 'INSERT INTO virtude_evolucoes (player_id, arcano, de_estagio, para_estagio, total, acumulado, ganhos, actor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
      playerId,
      p.arcano,
      p.arcano_estagio,
      para,
      total,
      JSON.stringify(pp),
      JSON.stringify(ganhos),
      ator.id,
    ])
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.evolucao', $2, $3)", [
      ator.id,
      playerId,
      JSON.stringify({ arcano: p.arcano, de: p.arcano_estagio, para, total, ganhos }),
    ])
    return { ok: true, de: p.arcano_estagio, para, total, ganhos }
  })
}

/** Owner grava a tabela de afinidade (cada linha precisa ser uma permutação de 1..6). Marca provisório. */
export async function definirAfinidades(atorId: string, valor: unknown, provisorio = true) {
  const a = valor as AfinidadesConfig
  if (!afinidadesValidas(a)) throw new RecordError('Tabela de afinidade inválida.')
  for (const [k, o] of Object.entries(a.ordem)) {
    if (!isArcano(k)) throw new RecordError(`Arcano desconhecido: ${k}.`)
    if (!ordemValida(o)) throw new RecordError(`${arcanoInfo(k).titulo}: use cada posição de 1 a 6 uma vez só.`)
  }
  const limpo: AfinidadesConfig = {
    fonte: a.fonte,
    escala: a.escala.map(Number),
    ordem: Object.fromEntries(Object.entries(a.ordem).map(([k, o]) => [k, Object.fromEntries(VIRTUDE_KEYS.map((v) => [v, o[v]]))])) as AfinidadesConfig['ordem'],
    divergencias: Object.fromEntries(
      Object.entries(a.divergencias ?? {})
        .filter(([k]) => isArcano(k))
        .map(([k, d]) => [k, { confirmar: !!d.confirmar, nota: String(d.nota ?? '').slice(0, 600), confirmado: !!d.confirmado }]),
    ),
  }
  return gravarConfig(atorId, 'virtudes.afinidades', limpo, provisorio)
}

export async function definirEstagios(atorId: string, valor: unknown, provisorio = true) {
  if (!estagiosValidos(valor)) throw new RecordError('Limites de Estágio inválidos (estágio ≥ 1, teto > 0, mínimo ≤ teto).')
  return gravarConfig(atorId, 'virtudes.estagios', { padrao: valor.padrao, porArcano: valor.porArcano ?? {} }, provisorio)
}

async function gravarConfig(atorId: string, key: string, value: unknown, provisorio: boolean) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'config.editar')
    await run(
      c,
      `INSERT INTO devo_config (key, value, provisional, updated_by, updated_at) VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, provisional = EXCLUDED.provisional, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [key, JSON.stringify(value), provisorio, ator.id],
    )
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'config.alterada', $2, $3)", [ator.id, key, JSON.stringify({ value, provisional: provisorio })])
    return { ok: true }
  })
}
