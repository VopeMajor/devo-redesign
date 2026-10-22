import 'server-only'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { ARCANOS_RASCUNHO, type ArcanoTexto, type ArcanoTextoCfg, completarEstagios, limparTexto, migrarTextoAntigo, N_ESTAGIOS } from './arcanos-textos'
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
  type ArcanoAcaoResultado,
  ARCANO_KEYS,
  arcanoInfo,
  CUSTO_ESTAGIO,
  ESTAGIO_MAX,
  ITEM_FRAGMENTO,
  ITEM_GRANDE_FRAGMENTO,
  numeralEstagio,
  type ArcanoKey,
  type ArcanoVista,
  type EstagioVista,
  type OrdemArcano,
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
  const linhas = (l: unknown) => Array.isArray(l) && l.every((x: EstagioLimite) => Number.isInteger(x?.estagio) && x.estagio >= 0 && x.estagio <= 50 && x.minimo >= 0 && x.teto > 0 && x.minimo <= x.teto)
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

/**
 * Textos dos Arcanos: o que o Owner editou (devo_config 'virtudes.arcanos') por cima do rascunho do código.
 * Edições gravadas antes dos Estágios 0..VII (sem `base: 0`) tinham os Estágios I..V: ganham a Essência na frente.
 */
export async function lerTextosArcanos(q: Queryable = pool): Promise<Record<ArcanoKey, ArcanoTextoCfg & { editado: boolean }>> {
  const c = await getConfig<Record<string, unknown>>('virtudes.arcanos', q).catch(() => null)
  const salvo = c?.value && typeof c.value === 'object' ? c.value : {}
  return Object.fromEntries(
    ARCANO_KEYS.map((k) => {
      const raw = salvo[k] as (ArcanoTexto & { provisorio?: unknown; base?: unknown }) | undefined
      const antigo = !!raw && raw.base !== 0
      const entrada = raw && antigo && Array.isArray(raw.estagios) ? { ...raw, estagios: raw.estagios.slice(0, N_ESTAGIOS - 1) } : raw
      const limpo = entrada ? limparTexto(entrada) : null
      const texto = limpo && antigo ? migrarTextoAntigo({ ...limpo, estagios: limpo.estagios.slice(0, entrada!.estagios.length) }) : limpo
      return [k, texto ? { ...texto, provisorio: raw?.provisorio !== false, editado: true } : { ...ARCANOS_RASCUNHO[k], provisorio: true, editado: false }]
    }),
  ) as Record<ArcanoKey, ArcanoTextoCfg & { editado: boolean }>
}

function extremosDaOrdem(o: OrdemArcano | undefined) {
  if (!o || !ordemValida(o)) return { excelente: null, deficiente: null }
  return { excelente: VIRTUDE_KEYS.find((v) => o[v] === 1) ?? null, deficiente: VIRTUDE_KEYS.find((v) => o[v] === 6) ?? null }
}

/** Um Arcano que o jogador tem: Estágio próprio; `original` = o de nascença (define as Virtudes). */
type Posse = { arcano: ArcanoKey; estagio: number; original: boolean; origem: string | null }

/**
 * Lista dos 22 para a tela do jogador. Não tem = só key/numeral/título/breve (nada mais sai do servidor). Tem:
 * detalhe com os Estágios 0..VII passado/atual/futuro pelo Estágio DAQUELE Arcano (futuro só com o nome, salvo
 * para a equipe). Equipe: tudo aberto. `provisorio` só para o Owner.
 */
function listaArcanos(textos: Record<ArcanoKey, ArcanoTextoCfg>, ordem: AfinidadesConfig['ordem'], posse: Posse[], equipe: boolean, owner: boolean): ArcanoVista[] {
  const tem = new Map(posse.map((p) => [p.arcano, p]))
  return ARCANO_KEYS.map((k) => {
    const info = arcanoInfo(k)
    const t = textos[k]
    const base: ArcanoVista = { key: k, numeral: info.numeral, titulo: info.titulo, breve: t.breve }
    const meu = tem.get(k)
    if (!meu && !equipe) return base
    const estagios = completarEstagios(t.estagios).map((x, i): EstagioVista => {
      const corpo = { ...(x.linha ? { linha: x.linha } : {}), ...(x.texto ? { texto: x.texto } : {}) }
      const v = { numero: i, nome: x.nome, revelado: !!x.nome }
      if (!meu) return { ...v, ...corpo, estado: 'aberto' }
      const estado: EstagioVista['estado'] = i < meu.estagio ? 'passado' : i === meu.estagio ? 'atual' : 'futuro'
      return estado === 'futuro' && !equipe ? { ...v, estado } : { ...v, ...corpo, estado }
    })
    return {
      ...base,
      ...(meu?.original ? { proprio: true as const } : {}),
      ...(meu ? { posse: { estagio: meu.estagio, original: meu.original } } : {}),
      ...(owner ? { provisorio: t.provisorio } : {}),
      detalhe: { descricao: t.descricao, fisiologia: t.fisiologia, ...extremosDaOrdem(ordem[k]), estagios },
    }
  })
}

/* ------------------------------------------------------------------ Arcanos do jogador (player_arcanos) */

const estagioValido = (n: unknown) => Math.min(ESTAGIO_MAX, Math.max(0, Math.floor(Number(n) || 0)))

/**
 * Arcanos de cada jogador. players.arcano manda no original: se a linha dele ainda não existe em player_arcanos
 * (banco recém-migrado, Arcano gravado direto no banco), ela é montada com players.arcano_estagio.
 */
async function posseDe(jogadores: { id: string; arcano: string | null; arcano_estagio: number }[], q: Queryable): Promise<Map<string, Posse[]>> {
  const ids = jogadores.map((j) => j.id)
  const rows = ids.length
    ? await run<{ player_id: string; arcano: string; estagio: number; original: boolean; origem: string | null }>(
        q,
        'SELECT player_id, arcano, estagio, original, origem FROM player_arcanos WHERE player_id = ANY($1) ORDER BY original DESC, obtido_em, arcano',
        [ids],
      )
    : []
  const m = new Map<string, Posse[]>()
  for (const j of jogadores) {
    const orig = isArcano(j.arcano) ? j.arcano : null
    const lista: Posse[] = []
    for (const r of rows) {
      if (r.player_id !== j.id || !isArcano(r.arcano)) continue
      lista.push({ arcano: r.arcano, estagio: estagioValido(r.estagio), original: r.arcano === orig, origem: r.origem })
    }
    if (orig && !lista.some((p) => p.original)) lista.unshift({ arcano: orig, estagio: estagioValido(j.arcano_estagio), original: true, origem: 'registro' })
    lista.sort((a, b) => Number(b.original) - Number(a.original))
    m.set(j.id, lista)
  }
  return m
}

/** Garante a linha do original em player_arcanos (dentro da transação, com a trava do jogador). */
async function garantirOriginal(c: PoolClient, playerId: string) {
  await run(
    c,
    `INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
     SELECT p.id, p.arcano, least(7, greatest(0, p.arcano_estagio)), true, 'registro' FROM players p
      WHERE p.id = $1 AND p.arcano IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM player_arcanos x WHERE x.player_id = p.id AND x.original)
     ON CONFLICT (player_id, arcano) DO UPDATE SET original = true, atualizado_em = now()`,
    [playerId],
  )
  // o espelho do Estágio do original (players.arcano_estagio) acompanha a linha
  await run(
    c,
    `UPDATE players p SET arcano_estagio = x.estagio FROM player_arcanos x
      WHERE p.id = $1 AND x.player_id = p.id AND x.original AND x.arcano = p.arcano AND p.arcano_estagio <> x.estagio`,
    [playerId],
  )
}

async function saldos(ids: string[], q: Queryable) {
  const rows = ids.length
    ? await run<{ player_id: string; item_key: string; quantity: string }>(q, 'SELECT player_id, item_key, quantity FROM player_items WHERE player_id = ANY($1) AND item_key = ANY($2)', [
        ids,
        [ITEM_FRAGMENTO, ITEM_GRANDE_FRAGMENTO],
      ])
    : []
  const m = new Map<string, { fragmentos: number; grandes: number }>()
  for (const id of ids) m.set(id, { fragmentos: 0, grandes: 0 })
  for (const r of rows) {
    const s = m.get(r.player_id)!
    if (r.item_key === ITEM_FRAGMENTO) s.fragmentos = Number(r.quantity)
    else s.grandes = Number(r.quantity)
  }
  return m
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

/** Virtude que mais e que menos cresceu numa Evolução (null se não havia P.P. para espalhar). */
function extremos(ganhos: Record<string, number>): { mais: VirtudeKey; menos: VirtudeKey } | null {
  const ord = VIRTUDE_KEYS.map((v) => [v, Number(ganhos?.[v] ?? 0)] as const).sort((a, b) => b[1] - a[1])
  if (!(ord[0][1] > 0)) return null
  return { mais: ord[0][0], menos: ord[ord.length - 1][0] }
}

/** Tela do jogador (GET /api/virtudes). SEM números de P.P.: nem P.P., nem teto, nem multiplicador, nem atributo. */
export async function estadoVirtudes(playerId: string): Promise<VirtudesPayload> {
  if (!(await hasUnlock(playerId, 'virtudes'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const [p] = await run<Linha>(pool, 'SELECT id, name, role, is_test, arcano, arcano_estagio FROM players WHERE id = $1', [playerId])
  if (!p) throw new RecordError('Registro não encontrado.', 404)
  const [cfg, textos, posses, saldo] = await Promise.all([lerConfigs(), lerTextosArcanos(), posseDe([p], pool), saldos([p.id], pool)])
  const cargo = normalizeCargo(p.role)
  const equipe = cargo === 'owner' || cargo === 'anfitriao'
  const arcano = isArcano(p.arcano) ? p.arcano : null
  const posse = posses.get(p.id) ?? []
  const estagio = posse.find((x) => x.original)?.estagio ?? estagioValido(p.arcano_estagio)
  const ordem = arcano ? cfg.afinidades.ordem[arcano] : null
  const pp = (await ppDe([p.id], pool)).get(p.id)!
  const total = soma(pp)
  const lim = limitesDoEstagio(cfg.estagios, arcano, estagio)
  const evol = await run<{ at: Date; de_estagio: number; para_estagio: number; arcano: string | null; ganhos: Record<string, number> }>(
    pool,
    'SELECT at, de_estagio, para_estagio, arcano, ganhos FROM virtude_evolucoes WHERE player_id = $1 ORDER BY at DESC, id DESC LIMIT 20',
    [p.id],
  )
  const top = VIRTUDE_KEYS.reduce<VirtudeKey | null>((best, v) => (pp[v] > 0 && (!best || pp[v] > pp[best]) ? v : best), null)
  const s = saldo.get(p.id)!
  return {
    liberado: true,
    arcano: arcano ? arcanoInfo(arcano) : null,
    estagio,
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
      return { at: e.at.getTime(), de: e.de_estagio, para: e.para_estagio, arcano: isArcano(e.arcano) ? arcanoInfo(e.arcano).titulo : null, maisCresceu: x?.mais ?? null, menosCresceu: x?.menos ?? null }
    }),
    arcanos: listaArcanos(textos, cfg.afinidades.ordem, posse, equipe, cargo === 'owner'),
    fragmentos: s.fragmentos,
    grandesFragmentos: s.grandes,
    verTodos: equipe,
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
  const owner = ator.cargo === 'owner'
  const [cfg, textos] = await Promise.all([lerConfigs(), owner ? lerTextosArcanos() : null])
  const [pp, niveis, evol, posses, saldo] = await Promise.all([
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
    posseDe(rows, pool),
    saldos(ids, pool),
  ])
  const jogadores: MesaJogador[] = rows.map((r) => {
    const arcano = isArcano(r.arcano) ? r.arcano : null
    const posse = posses.get(r.id) ?? []
    const estagio = posse.find((x) => x.original)?.estagio ?? estagioValido(r.arcano_estagio)
    const lim = limitesDoEstagio(cfg.estagios, arcano, estagio)
    const p = pp.get(r.id)!
    const nivel = Object.fromEntries(VIRTUDE_KEYS.map((v) => [v, 0])) as Record<VirtudeKey, number>
    for (const n of niveis) if (n.player_id === r.id) nivel[n.virtude] = Number(n.valor)
    const s = saldo.get(r.id)!
    return {
      id: r.id,
      nome: r.name,
      arcano,
      estagio,
      arcanos: posse.map((x) => ({ key: x.arcano, estagio: x.estagio, original: x.original, origem: x.origem })),
      fragmentos: s.fragmentos,
      grandesFragmentos: s.grandes,
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
    config: {
      afinidades: cfg.afinidades,
      afinidadesProvisorio: cfg.afinidadesProvisorio,
      estagios: cfg.estagios,
      estagiosProvisorio: cfg.estagiosProvisorio,
      evolucao: cfg.evolucao,
      ...(textos ? { arcanos: textos } : {}),
    },
  }
}

/* ------------------------------------------------------------------ Ações da equipe */

function exigirJogador(id: unknown): string {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new RecordError('Jogador inválido.')
  return id
}

const travar = (c: PoolClient, playerId: string) => run(c, 'SELECT pg_advisory_xact_lock(hashtext($1))', [`devo-virtudes:${playerId}`])

/**
 * Define (ou limpa, com null) o Arcano ORIGINAL de um jogador. Owner/Anfitrião. Não mexe nos P.P.
 * player_arcanos acompanha: a linha do original troca de Arcano e mantém o Estágio; se o novo já era um Arcano
 * despertado, ele vira o original (com o Estágio dele) e o antigo fica como despertado. Limpar tira a linha do
 * original (o Estágio continua guardado em players.arcano_estagio para quando ele for definido de novo).
 */
export async function definirArcano(atorId: string, playerIdRaw: unknown, arcanoRaw: unknown) {
  const playerId = exigirJogador(playerIdRaw)
  const arcano = arcanoRaw === null || arcanoRaw === '' ? null : arcanoRaw
  if (arcano !== null && !isArcano(arcano)) throw new RecordError('Arcano desconhecido.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'virtudes.evoluir')
    await travar(c, playerId)
    const [p] = await run<{ role: string; arcano: string | null }>(c, 'SELECT role, arcano FROM players WHERE id = $1 FOR UPDATE', [playerId])
    if (!p || (normalizeCargo(p.role) === 'owner' && ator.cargo !== 'owner')) throw new RecordError('Jogador não encontrado.', 404)
    await garantirOriginal(c, playerId)
    if (arcano === null) {
      await run(c, 'DELETE FROM player_arcanos WHERE player_id = $1 AND original', [playerId])
    } else if (arcano !== p.arcano) {
      const [ja] = await run<{ estagio: number }>(c, 'SELECT estagio FROM player_arcanos WHERE player_id = $1 AND arcano = $2', [playerId, arcano])
      if (ja) {
        await run(c, 'UPDATE player_arcanos SET original = false, atualizado_em = now() WHERE player_id = $1 AND original', [playerId])
        await run(c, 'UPDATE player_arcanos SET original = true, atualizado_em = now() WHERE player_id = $1 AND arcano = $2', [playerId, arcano])
        await run(c, 'UPDATE players SET arcano_estagio = $2 WHERE id = $1', [playerId, ja.estagio])
      } else {
        const mudou = await run(c, 'UPDATE player_arcanos SET arcano = $2, atualizado_em = now() WHERE player_id = $1 AND original RETURNING 1', [playerId, arcano])
        if (!mudou.length)
          await run(
            c,
            `INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
             SELECT id, $2, least(7, greatest(0, arcano_estagio)), true, 'mesa' FROM players WHERE id = $1`,
            [playerId, arcano],
          )
      }
    }
    await run(c, 'UPDATE players SET arcano = $2 WHERE id = $1', [playerId, arcano])
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.arcano', $2, $3)", [ator.id, playerId, JSON.stringify({ arcano })])
    return { arcano: arcano as ArcanoKey | null }
  })
}

/**
 * Recompensa 'arcano' (Deadly Vote do tutorial e outras): quem ainda não tem Arcano ganha este como ORIGINAL, no
 * Estágio em que já estava (0 para quem nunca teve). Quem já tem outro original ganha este como Arcano
 * despertado, no Estágio 0. Quem já tem este, nada muda. Roda dentro da transação da entrega.
 */
export async function concederArcano(c: PoolClient, playerId: string, arcano: ArcanoKey, origem: string): Promise<{ original: boolean; novo: boolean }> {
  await travar(c, playerId)
  const [p] = await run<{ arcano: string | null }>(c, 'SELECT arcano FROM players WHERE id = $1 FOR UPDATE', [playerId])
  if (!p) throw new RecordError('Jogador não encontrado.', 404)
  await garantirOriginal(c, playerId)
  if (p.arcano === arcano) return { original: true, novo: false }
  if (!p.arcano) {
    await run(c, 'UPDATE players SET arcano = $2 WHERE id = $1', [playerId, arcano])
    const [ja] = await run<{ estagio: number }>(c, 'UPDATE player_arcanos SET original = true, atualizado_em = now() WHERE player_id = $1 AND arcano = $2 RETURNING estagio', [playerId, arcano])
    if (ja) await run(c, 'UPDATE players SET arcano_estagio = $2 WHERE id = $1', [playerId, ja.estagio])
    else
      await run(
        c,
        `INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem)
         SELECT id, $2, least(7, greatest(0, arcano_estagio)), true, $3 FROM players WHERE id = $1`,
        [playerId, arcano, origem.slice(0, 40)],
      )
    return { original: true, novo: !ja }
  }
  const ins = await run(
    c,
    `INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem) VALUES ($1, $2, 0, false, $3)
     ON CONFLICT (player_id, arcano) DO NOTHING RETURNING 1`,
    [playerId, arcano, origem.slice(0, 40)],
  )
  return { original: false, novo: ins.length > 0 }
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

/* ------------------------------------------------------------------ Evolução de Estágio */

type EvolucaoFeita = { arcano: ArcanoKey; de: number; para: number; original: boolean; total: number; ganhos: Record<VirtudeKey, number> | null; jaFeito?: boolean }

/**
 * Sobe um Arcano do jogador um Estágio (0..VII), numa transação com a trava do jogador. `cobrar` = Fragmentos
 * Arcanos gastos (idem por Arcano e Estágio de destino: a mesma subida nunca cobra duas vezes). Se for o Arcano
 * ORIGINAL, os P.P. acumulados se espalham nas Virtudes pela afinidade (`distribuir`), sem mínimo, zeram, e o
 * espelho players.arcano_estagio acompanha. `de` (opcional) = Estágio que a tela mostrava: se o Arcano já está
 * no seguinte, foi um clique repetido e nada muda (`jaFeito`); se está em outro, recusa.
 */
async function aplicarEvolucao(
  c: PoolClient,
  o: { playerId: string; arcano: ArcanoKey; atorId: string; cobrar: (para: number) => number; de?: number | null; quem: 'jogador' | 'equipe' },
): Promise<EvolucaoFeita> {
  const { playerId, arcano } = o
  await travar(c, playerId)
  await run(c, 'SELECT 1 FROM players WHERE id = $1 FOR UPDATE', [playerId])
  await garantirOriginal(c, playerId)
  const [row] = await run<{ estagio: number; original: boolean }>(c, 'SELECT estagio, original FROM player_arcanos WHERE player_id = $1 AND arcano = $2 FOR UPDATE', [playerId, arcano])
  if (!row) throw new RecordError(o.quem === 'jogador' ? 'Você ainda não despertou este Arcano.' : 'O jogador não tem este Arcano.', 404)
  if (o.de != null && row.estagio !== o.de) {
    if (row.estagio === o.de + 1) return { arcano, de: o.de, para: row.estagio, original: row.original, total: 0, ganhos: null, jaFeito: true }
    throw new RecordError('O Estágio deste Arcano mudou. Atualize a tela.', 409)
  }
  if (row.estagio >= ESTAGIO_MAX) throw new RecordError(`Este Arcano já está no Estágio ${numeralEstagio(ESTAGIO_MAX)}, o último.`, 409)
  const de = row.estagio
  const para = de + 1
  const custo = Math.max(0, Math.floor(o.cobrar(para)))
  if (custo > 0)
    await consumeItem({ playerId, item: ITEM_FRAGMENTO, quantidade: custo, motivo: 'arcano.evolucao', ref: `${arcano}:${para}`, atorId: o.atorId, idem: `arcano:evoluir:${playerId}:${arcano}:${para}` }, c).catch((err) => {
      throw err instanceof RecordError && err.status === 409 ? new RecordError(`Fragmentos Arcanos insuficientes: o Estágio ${numeralEstagio(para)} custa ${custo}.`, 409) : err
    })
  let total = 0
  let ganhos: Record<VirtudeKey, number> | null = null
  if (row.original) {
    const cfg = await lerConfigs(c)
    const ordem = cfg.afinidades.ordem[arcano]
    if (!ordemValida(ordem)) throw new RecordError('A tabela de afinidade deste Arcano está incompleta. Avise a equipe.', 409)
    const pp = (await ppDe([playerId], c)).get(playerId)!
    total = soma(pp)
    ganhos = distribuir(total, ordem, cfg.afinidades.escala, pp, Number(cfg.evolucao.peso_direcao) || 0)
    if (total > 0)
      for (const v of VIRTUDE_KEYS)
        await run(
          c,
          `INSERT INTO virtude_nivel (player_id, virtude, valor) VALUES ($1, $2, $3)
           ON CONFLICT (player_id, virtude) DO UPDATE SET valor = virtude_nivel.valor + EXCLUDED.valor`,
          [playerId, v, ganhos[v]],
        )
    await run(c, 'DELETE FROM virtude_pp WHERE player_id = $1', [playerId])
    await run(c, 'UPDATE players SET arcano_estagio = $2 WHERE id = $1', [playerId, para])
    await run(c, 'INSERT INTO virtude_evolucoes (player_id, arcano, de_estagio, para_estagio, total, acumulado, ganhos, actor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
      playerId,
      arcano,
      de,
      para,
      total,
      JSON.stringify(pp),
      JSON.stringify(ganhos),
      o.atorId,
    ])
  }
  await run(c, 'UPDATE player_arcanos SET estagio = $3, atualizado_em = now() WHERE player_id = $1 AND arcano = $2', [playerId, arcano, para])
  await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.evolucao', $2, $3)", [
    o.atorId,
    playerId,
    JSON.stringify({ arcano, de, para, original: row.original, fragmentos: custo, por: o.quem, ...(row.original ? { total, ganhos } : {}) }),
  ])
  return { arcano, de, para, original: row.original, total, ganhos }
}

/**
 * Evolução pela Mesa (Owner/Anfitrião): sobe um Arcano do jogador (o original, se `arcano` não vier) sem exigir
 * mínimo de P.P. Cobra `virtudes.evolucao.fragmentos` (0 = de graça; o padrão).
 */
export async function evoluirEstagio(atorId: string, playerIdRaw: unknown, arcanoRaw?: unknown): Promise<EvolucaoResultado> {
  const playerId = exigirJogador(playerIdRaw)
  if (arcanoRaw != null && arcanoRaw !== '' && !isArcano(arcanoRaw)) throw new RecordError('Arcano desconhecido.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'virtudes.evoluir')
    const [p] = await run<{ role: string; arcano: string | null }>(c, 'SELECT role, arcano FROM players WHERE id = $1', [playerId])
    if (!p || (normalizeCargo(p.role) === 'owner' && ator.cargo !== 'owner')) throw new RecordError('Jogador não encontrado.', 404)
    const alvo = isArcano(arcanoRaw) ? arcanoRaw : isArcano(p.arcano) ? p.arcano : null
    if (!alvo) throw new RecordError('Defina o Arcano do jogador antes da Evolução de Estágio.', 409)
    const cfg = await lerConfigs(c)
    const frag = Math.max(0, Math.floor(Number(cfg.evolucao.fragmentos) || 0))
    const r = await aplicarEvolucao(c, { playerId, arcano: alvo, atorId: ator.id, cobrar: () => frag, quem: 'equipe' })
    return { ok: true, arcano: r.arcano, de: r.de, para: r.para, original: r.original, ...(r.ganhos ? { total: r.total, ganhos: r.ganhos } : {}) }
  })
}

/** Equipe (Owner/Anfitrião) não tem trava nem custo na tela dos Arcanos. */
async function exigirLiberado(c: PoolClient, playerId: string) {
  const ator = await requireActor(playerId, c)
  const equipe = ator.cargo === 'owner' || ator.cargo === 'anfitriao'
  if (!equipe && !(await hasUnlock(playerId, 'virtudes', c))) throw new RecordError(MOTIVO_TRANCADO, 403)
  return { ator, equipe }
}

async function saldoDe(c: PoolClient, playerId: string) {
  const s = (await saldos([playerId], c)).get(playerId)!
  return { fragmentos: s.fragmentos, grandesFragmentos: s.grandes }
}

/**
 * O JOGADOR sobe um Arcano seu pagando os Fragmentos Arcanos do próximo Estágio (I=25 … VII=1600). Se for o
 * original, os P.P. se espalham nas Virtudes nesse momento (sem mínimo). Clique repetido não cobra de novo.
 */
export async function evoluirArcano(playerId: string, arcanoRaw: unknown, deRaw?: unknown): Promise<ArcanoAcaoResultado> {
  if (!isArcano(arcanoRaw)) throw new RecordError('Arcano desconhecido.')
  const arcano = arcanoRaw
  const de = deRaw == null || deRaw === '' ? null : Number(deRaw)
  if (de !== null && !(Number.isInteger(de) && de >= 0 && de <= ESTAGIO_MAX)) throw new RecordError('Estágio inválido.')
  return txAs(playerId, async (c) => {
    const { equipe } = await exigirLiberado(c, playerId)
    const r = await aplicarEvolucao(c, { playerId, arcano, atorId: playerId, de, cobrar: (para) => (equipe ? 0 : CUSTO_ESTAGIO[para]), quem: 'jogador' })
    return { ok: true, arcano, estagio: r.para, ...(await saldoDe(c, playerId)), ...(r.jaFeito ? { jaFeito: true } : {}) }
  })
}

/**
 * O JOGADOR desperta outro Arcano com um Grande Fragmento Arcano: entra no Estágio 0 ("A Essência"), com Estágio
 * próprio. O original continua o mesmo (e continua definindo as Virtudes). Já tem esse Arcano → nada muda.
 */
export async function despertarArcano(playerId: string, arcanoRaw: unknown): Promise<ArcanoAcaoResultado> {
  if (!isArcano(arcanoRaw)) throw new RecordError('Arcano desconhecido.')
  const arcano = arcanoRaw
  return txAs(playerId, async (c) => {
    const { equipe } = await exigirLiberado(c, playerId)
    await travar(c, playerId)
    await garantirOriginal(c, playerId)
    const [ja] = await run<{ estagio: number }>(c, 'SELECT estagio FROM player_arcanos WHERE player_id = $1 AND arcano = $2', [playerId, arcano])
    if (ja) return { ok: true, arcano, estagio: ja.estagio, ...(await saldoDe(c, playerId)), jaFeito: true }
    if (!equipe)
      await consumeItem({ playerId, item: ITEM_GRANDE_FRAGMENTO, quantidade: 1, motivo: 'arcano.despertar', ref: arcano, atorId: playerId, idem: `arcano:despertar:${playerId}:${arcano}` }, c).catch((err) => {
        throw err instanceof RecordError && err.status === 409 ? new RecordError('Você precisa de um Grande Fragmento Arcano para despertar outro Arcano.', 409) : err
      })
    await run(c, "INSERT INTO player_arcanos (player_id, arcano, estagio, original, origem) VALUES ($1, $2, 0, false, $3)", [playerId, arcano, equipe ? 'equipe' : 'grande_fragmento'])
    await run(c, "INSERT INTO admin_log (actor_id, action, target_id, data) VALUES ($1, 'virtudes.arcano_despertado', $2, $3)", [
      playerId,
      playerId,
      JSON.stringify({ arcano, grandeFragmento: !equipe }),
    ])
    return { ok: true, arcano, estagio: 0, ...(await saldoDe(c, playerId)) }
  })
}

/* ------------------------------------------------------------------ Configuração (Owner) */

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
  if (!estagiosValidos(valor)) throw new RecordError('Limites de Estágio inválidos (estágio de 0 em diante, teto > 0, mínimo ≤ teto).')
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

/**
 * Owner grava (ou, com `valor` null, devolve ao rascunho do código) o texto de UM Arcano: breve, descrição,
 * fisiologia e Estágios. Uma instrução só (jsonb || / -), então duas edições de Arcanos diferentes não se
 * atropelam. Registra no admin_log.
 */
export async function definirTextoArcano(atorId: string, arcanoRaw: unknown, valor: unknown, provisorio = true) {
  if (!isArcano(arcanoRaw)) throw new RecordError('Arcano desconhecido.')
  const arcano = arcanoRaw
  const limpo = valor === null ? null : limparTexto(valor)
  if (valor !== null && !limpo) throw new RecordError('Preencha a frase breve, a descrição, a fisiologia e o nome de cada Estágio escrito (Estágio sem nome fica como “Ainda não revelado”).')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'config.editar')
    if (limpo) {
      await run(
        c,
        `INSERT INTO devo_config (key, value, provisional, updated_by, updated_at) VALUES ('virtudes.arcanos', jsonb_build_object($1::text, $2::jsonb), true, $3, now())
         ON CONFLICT (key) DO UPDATE SET value = coalesce(devo_config.value, '{}'::jsonb) || jsonb_build_object($1::text, $2::jsonb), updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [arcano, JSON.stringify({ ...limpo, base: 0, provisorio }), ator.id],
      )
    } else {
      await run(c, "UPDATE devo_config SET value = value - $1::text, updated_by = $2, updated_at = now() WHERE key = 'virtudes.arcanos'", [arcano, ator.id])
    }
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'virtudes.arcano_texto', $2, $3)", [
      ator.id,
      arcano,
      JSON.stringify(limpo ? { ...limpo, provisorio } : { restaurado: true }),
    ])
    return { ok: true, arcano, restaurado: !limpo }
  })
}
