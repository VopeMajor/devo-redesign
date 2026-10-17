import 'server-only'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { drainTime } from './arcade/server'
import {
  type CalendarioMesa,
  type CalendarioPayload,
  type CheckinDiario,
  type CheckinEvento,
  type CheckinExtra,
  type CheckinSlot,
  type Dia,
  diaValido,
  diasEntre,
  type EventoBase,
  type EventoVista,
  isEnfase,
  ocorrenciaEm,
  ocorrencias,
  type Recompensa,
  type ResgateResultado,
  somaDias,
  verRecompensa,
} from './calendario'
import { can } from './cargos'
import { RARITIES, randomCardOfRarity } from './cards'
import { RecordError } from './errors'
import { type Queryable, run, txAs, UUID_RE } from './fundacao-db'
import { creditMinutes, deliverCard, grantItem, pendingCardCount } from './inventario-server'
import { requireActor, requireCan } from './permissoes-server'
import { getConfig, hasUnlock } from './progresso-server'
import type { Rarity } from './types'
import { isArcano, isVirtude, ordemValida, VIRTUDE_KEYS, type VirtudeKey } from './virtudes'
import { addPotencialSeguro, lerConfigs } from './virtudes-server'

/**
 * Grandioso Calendário Devo — servidor. Contrato: docs/redesign/FUNDACAO.md §15.
 * - Eventos programados (Owner/Anfitrião pela Mesa; check-in de evento só o Owner), com admin_log.
 * - Check-in diário: ciclo de 7 dias (`calendario.checkin.ciclo`), um por jogador por dia de Brasília (PK no banco),
 *   o ciclo só anda com o resgate; faltar um dia PAUSA (padrão provisório) ou reinicia (`calendario.checkin.regras`).
 * - Check-in de evento (datas comemorativas): cada evento ativo hoje com lista própria; um resgate por dia, o n-ésimo
 *   resgate daquela edição entrega a n-ésima recompensa (a lista acabou → completo).
 * - Recompensas pelas funções seguras: P.P. (`addPotencialSeguro`), itens (`grantItem`), Tempo (`creditMinutes` +
 *   `drainTime`), carta (`deliverCard` → o cliente resgata por /api/eu). Tudo com `idem` do resgate.
 */

const MOTIVO_TRANCADO = 'O Calendário ainda está trancado para você.'
const DIARIO = 'diario'
const tipoEvento = (id: string) => `evento:${id}`

/* ------------------------------------------------------------------ Configuração */

type Regras = { falta: 'pausa' | 'reinicia'; ppVirtude: 'arcano' | VirtudeKey; ppVirtudePadrao: VirtudeKey; provisorio: boolean }

const CICLO_PADRAO: Recompensa[] = [
  { tipo: 'pp', quantidade: 50 },
  { tipo: 'pp', quantidade: 75 },
  { tipo: 'item', item: 'fragmento_arcano', quantidade: 2 },
  { tipo: 'tempo', minutos: 120 },
  { tipo: 'item', item: 'dracma_comum', quantidade: 5 },
  { tipo: 'item', item: 'dracma_incomum', quantidade: 2 },
  { tipo: 'carta', raridade: 'incomum' },
]

/** Valida uma recompensa vinda do banco ou da Mesa (null = inválida). Itens: só a forma; a Mesa confere o catálogo. */
export function recompensaValida(v: unknown): Recompensa | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const n = (x: unknown, max: number) => {
    const k = Math.floor(Number(x))
    return Number.isFinite(k) && k >= 1 && k <= max ? k : null
  }
  switch (r.tipo) {
    case 'pp': {
      const q = n(r.quantidade, 1000)
      return q ? { tipo: 'pp', quantidade: q } : null
    }
    case 'tempo': {
      const m = n(r.minutos, 72 * 60)
      return m ? { tipo: 'tempo', minutos: m } : null
    }
    case 'item': {
      const q = n(r.quantidade, 999)
      return q && typeof r.item === 'string' && /^[a-z0-9_]+(:[a-z0-9_-]+)?$/.test(r.item) ? { tipo: 'item', item: r.item, quantidade: q } : null
    }
    case 'carta':
      return (RARITIES as unknown[]).includes(r.raridade) ? { tipo: 'carta', raridade: r.raridade as Rarity } : null
    default:
      return null
  }
}

async function lerCiclo(q: Queryable): Promise<Recompensa[]> {
  const cfg = await getConfig<unknown>('calendario.checkin.ciclo', q).catch(() => null)
  const lista = Array.isArray(cfg?.value) ? (cfg.value as unknown[]).map(recompensaValida) : []
  return lista.length && lista.every(Boolean) ? (lista as Recompensa[]).slice(0, 14) : CICLO_PADRAO
}

async function lerRegras(q: Queryable): Promise<Regras> {
  const cfg = await getConfig<Record<string, unknown>>('calendario.checkin.regras', q).catch(() => null)
  const v = cfg?.value ?? {}
  return {
    falta: v.falta === 'reinicia' ? 'reinicia' : 'pausa',
    ppVirtude: isVirtude(v.pp_virtude) ? v.pp_virtude : 'arcano',
    ppVirtudePadrao: isVirtude(v.pp_virtude_padrao) ? v.pp_virtude_padrao : 'paus',
    provisorio: cfg?.provisional ?? true,
  }
}

/** Dia de hoje no horário de Brasília, pelo relógio do BANCO (o mesmo que grava os resgates). */
async function hojeDb(q: Queryable): Promise<Dia> {
  const [r] = await run<{ d: string }>(q, "SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d")
  return r.d
}

/** Próxima meia-noite de Brasília (ms). */
async function proximaVirada(q: Queryable): Promise<number> {
  const [r] = await run<{ t: Date }>(q, "SELECT ((((now() AT TIME ZONE 'America/Sao_Paulo')::date + 1)::timestamp) AT TIME ZONE 'America/Sao_Paulo') AS t")
  return r.t.getTime()
}

/**
 * Virtude que recebe os P.P. do check-in (REGRA PROVISÓRIA, decisão do dono): a de afinidade Excelente (ordem 1) do
 * Arcano do jogador; sem Arcano registrado, `pp_virtude_padrao` (Paus). O Owner pode fixar uma Virtude em `pp_virtude`.
 */
async function virtudeDoCheckin(c: Queryable, playerId: string, regras: Regras): Promise<VirtudeKey> {
  if (regras.ppVirtude !== 'arcano') return regras.ppVirtude
  const [p] = await run<{ arcano: string | null }>(c, 'SELECT arcano FROM players WHERE id = $1', [playerId])
  if (p && isArcano(p.arcano)) {
    const { afinidades } = await lerConfigs(c)
    const ordem = afinidades.ordem[p.arcano]
    if (ordemValida(ordem)) return VIRTUDE_KEYS.find((v) => ordem[v] === 1) ?? regras.ppVirtudePadrao
  }
  return regras.ppVirtudePadrao
}

/* ------------------------------------------------------------------ Eventos */

type EventoRow = {
  id: string
  titulo: string
  descricao: string
  inicio: string
  fim: string
  anual: boolean
  enfase: string
  arte: string | null
  checkin: unknown
  autor: string | null
  updated_at: Date
}

const EVENTO_SELECT = `SELECT e.id, e.titulo, e.descricao, to_char(e.inicio, 'YYYY-MM-DD') AS inicio, to_char(e.fim, 'YYYY-MM-DD') AS fim,
    e.anual, e.enfase, e.arte, e.checkin, e.updated_at, coalesce(nullif(p.character_name, ''), p.name) AS autor
  FROM calendario_eventos e LEFT JOIN players p ON p.id = e.criado_por`

function checkinDe(v: unknown): CheckinEvento | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const recompensas = Array.isArray(o.recompensas) ? (o.recompensas as unknown[]).map(recompensaValida).filter((x): x is Recompensa => !!x) : []
  if (!recompensas.length) return null
  return { titulo: typeof o.titulo === 'string' && o.titulo.trim() ? o.titulo.trim().slice(0, 60) : 'Check-in especial', recompensas: recompensas.slice(0, 10) }
}

const eventoDe = (r: EventoRow): EventoBase => ({
  id: r.id,
  titulo: r.titulo,
  descricao: r.descricao,
  inicio: r.inicio,
  fim: r.fim,
  anual: r.anual,
  enfase: isEnfase(r.enfase) ? r.enfase : 'normal',
  arte: r.arte,
  checkin: checkinDe(r.checkin),
})

async function lerEventos(q: Queryable): Promise<(EventoBase & { autor: string | null; atualizadoEm: number })[]> {
  const rows = await run<EventoRow>(q, `${EVENTO_SELECT} WHERE e.removido_at IS NULL ORDER BY e.inicio, e.titulo`)
  return rows.map((r) => ({ ...eventoDe(r), autor: r.autor, atualizadoEm: r.updated_at.getTime() }))
}

/* ------------------------------------------------------------------ Estado do jogador */

const slots = (lista: Recompensa[], posicao: number, feitoHoje: boolean, nomes: Record<string, string>): CheckinSlot[] =>
  lista.map((r, i) => {
    const p = i + 1
    return { posicao: p, recompensa: verRecompensa(r, nomes), estado: p < posicao || (p === posicao && feitoHoje) ? 'feito' : p === posicao ? 'hoje' : 'proximo' }
  })

async function nomesItens(q: Queryable): Promise<Record<string, string>> {
  const rows = await run<{ key: string; name: string }>(q, "SELECT key, name FROM item_defs WHERE kind <> 'cosmetico'")
  return Object.fromEntries(rows.map((r) => [r.key, r.name]))
}

/** Posição do ciclo para hoje: a já resgatada hoje, ou a próxima (pausa: continua; reinicia: volta ao 1 após falta). */
async function posicaoDiaria(q: Queryable, playerId: string, hoje: Dia, tamanho: number, falta: Regras['falta']) {
  const [last] = await run<{ dia: string; posicao: number }>(
    q,
    "SELECT to_char(dia, 'YYYY-MM-DD') AS dia, posicao FROM calendario_checkins WHERE player_id = $1 AND tipo = 'diario' ORDER BY dia DESC LIMIT 1",
    [playerId],
  )
  if (!last) return { posicao: 1, feitoHoje: false }
  if (last.dia === hoje) return { posicao: Math.min(last.posicao, tamanho), feitoHoje: true }
  if (falta === 'reinicia' && diasEntre(last.dia, hoje) > 1) return { posicao: 1, feitoHoje: false }
  return { posicao: (last.posicao % tamanho) + 1, feitoHoje: false }
}

/** Resgates da ocorrência de um evento (quantos e se hoje já foi). */
async function resgatesEvento(q: Queryable, playerId: string, eventoId: string, ocorrencia: Dia, hoje: Dia) {
  const rows = await run<{ dia: string }>(
    q,
    "SELECT to_char(dia, 'YYYY-MM-DD') AS dia FROM calendario_checkins WHERE player_id = $1 AND tipo = $2 AND ocorrencia = $3",
    [playerId, tipoEvento(eventoId), ocorrencia],
  )
  return { n: rows.length, feitoHoje: rows.some((r) => r.dia === hoje) }
}

export async function getCalendario(playerId: string): Promise<CalendarioPayload> {
  if (!(await hasUnlock(playerId, 'calendario'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const ator = await requireActor(playerId)
  const [hoje, ciclo, regras, eventos, nomes, virada] = await Promise.all([hojeDb(pool), lerCiclo(pool), lerRegras(pool), lerEventos(pool), nomesItens(pool), proximaVirada(pool)])

  // Ocorrências: do começo do mês passado até ~13 meses à frente (mês e lista de próximos).
  const de = `${somaDias(`${hoje.slice(0, 7)}-01`, -1).slice(0, 7)}-01`
  const ate = somaDias(hoje, 400)
  const vistas: EventoVista[] = eventos
    .flatMap((e) => ocorrencias(e, de, ate))
    .map((o) => ({ ...o, emDias: diasEntre(hoje, o.ocorrencia), autor: undefined }))
    .sort((a, b) => (a.ocorrencia < b.ocorrencia ? -1 : a.ocorrencia > b.ocorrencia ? 1 : a.titulo.localeCompare(b.titulo)))

  const d = await posicaoDiaria(pool, playerId, hoje, ciclo.length, regras.falta)
  const [{ total }] = await run<{ total: number }>(pool, "SELECT count(*)::int AS total FROM calendario_checkins WHERE player_id = $1 AND tipo = 'diario'", [playerId])
  const diario: CheckinDiario = { posicao: d.posicao, feitoHoje: d.feitoHoje, slots: slots(ciclo, d.posicao, d.feitoHoje, nomes), falta: regras.falta, total, proximoDiaEm: virada }

  const extras: CheckinExtra[] = []
  for (const e of eventos) {
    if (!e.checkin) continue
    const o = ocorrenciaEm(e, hoje)
    if (!o) continue
    const r = await resgatesEvento(pool, playerId, e.id, o.ocorrencia, hoje)
    const lista = e.checkin.recompensas
    const posicao = r.feitoHoje ? r.n : Math.min(r.n + 1, lista.length + 1)
    extras.push({
      eventoId: e.id,
      titulo: e.checkin.titulo,
      evento: e.titulo,
      enfase: e.enfase,
      ocorrencia: o.ocorrencia,
      ate: o.ate,
      feitoHoje: r.feitoHoje || r.n >= lista.length,
      posicao,
      slots: slots(lista, posicao, r.feitoHoje, nomes),
    })
  }

  const timeDeltaMs = await drainTime(playerId).catch(() => 0)
  return {
    liberado: true,
    hoje,
    eventos: vistas,
    diario,
    extras,
    podeEditar: can(ator, 'calendario.editar'),
    podePular: can(ator, 'calendario.editar'),
    timeDeltaMs: timeDeltaMs || undefined,
    cartasPendentes: await pendingCardCount(playerId),
  }
}

/* ------------------------------------------------------------------ Resgate */

async function aplicar(c: PoolClient, playerId: string, r: Recompensa, regras: Regras, idem: string, ref: string): Promise<ResgateResultado['aplicado']> {
  switch (r.tipo) {
    case 'pp': {
      const virtude = await virtudeDoCheckin(c, playerId, regras)
      const pp = await addPotencialSeguro(c, playerId, virtude, r.quantidade, 'calendario.checkin', { ref, idem })
      return { pp, virtude }
    }
    case 'item': {
      const saldo = await grantItem({ playerId, item: r.item, quantidade: r.quantidade, motivo: 'calendario', ref, idem }, c)
      return { saldo }
    }
    case 'tempo':
      await creditMinutes(playerId, r.minutos, c)
      return { minutos: r.minutos }
    case 'carta': {
      const carta = randomCardOfRarity(r.raridade)
      await deliverCard({ playerId, cardId: carta.id, origem: 'Calendário Devo · check-in', ref, idem }, c)
      return { cartaId: carta.id }
    }
  }
}

/**
 * Marca presença e entrega a recompensa (uma vez por dia e por tipo). `alvo`: `{ tipo: 'diario' }` ou
 * `{ tipo: 'evento', eventoId }`. Toque duplo / requisições simultâneas: a trava do jogador serializa e a PK
 * (player_id, dia, tipo) garante; o segundo recebe 409 "Presença de hoje já marcada." e nada é entregue de novo.
 */
export async function resgatar(playerId: string, alvo: { tipo?: unknown; eventoId?: unknown }): Promise<ResgateResultado> {
  if (!(await hasUnlock(playerId, 'calendario'))) throw new RecordError(MOTIVO_TRANCADO, 403)
  const evento = alvo.tipo === 'evento'
  if (!evento && alvo.tipo !== undefined && alvo.tipo !== 'diario') throw new RecordError('Check-in desconhecido.')
  const eventoId = evento ? String(alvo.eventoId ?? '') : null
  if (evento && !UUID_RE.test(eventoId!)) throw new RecordError('Evento inválido.')

  const out = await txAs(playerId, async (c) => {
    await run(c, 'SELECT pg_advisory_xact_lock(hashtext($1))', [`devo-calendario:${playerId}`])
    const hoje = await hojeDb(c)
    const regras = await lerRegras(c)
    let recompensa: Recompensa
    let posicao: number
    let tipo: string
    let ocorrencia: Dia | null = null
    if (!evento) {
      const ciclo = await lerCiclo(c)
      const d = await posicaoDiaria(c, playerId, hoje, ciclo.length, regras.falta)
      if (d.feitoHoje) throw new RecordError('Presença de hoje já marcada. Volte amanhã.', 409)
      posicao = d.posicao
      recompensa = ciclo[posicao - 1]
      tipo = DIARIO
    } else {
      const [row] = await run<EventoRow>(c, `${EVENTO_SELECT} WHERE e.id = $1 AND e.removido_at IS NULL`, [eventoId])
      const e = row ? eventoDe(row) : null
      if (!e) throw new RecordError('Evento não encontrado.', 404)
      const o = ocorrenciaEm(e, hoje)
      if (!e.checkin || !o) throw new RecordError('Este evento não tem check-in hoje.', 409)
      const r = await resgatesEvento(c, playerId, e.id, o.ocorrencia, hoje)
      if (r.feitoHoje) throw new RecordError('Presença de hoje já marcada neste evento.', 409)
      if (r.n >= e.checkin.recompensas.length) throw new RecordError('Você já resgatou todas as recompensas deste evento.', 409)
      posicao = r.n + 1
      recompensa = e.checkin.recompensas[r.n]
      tipo = tipoEvento(e.id)
      ocorrencia = o.ocorrencia
    }
    const inserted = await run(
      c,
      `INSERT INTO calendario_checkins (player_id, dia, tipo, evento_id, ocorrencia, posicao, recompensa)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING RETURNING dia`,
      [playerId, hoje, tipo, eventoId, ocorrencia, posicao, JSON.stringify(recompensa)],
    )
    if (!inserted.length) throw new RecordError('Presença de hoje já marcada. Volte amanhã.', 409)
    // A PK (jogador, dia, tipo) já garante uma vez; a posição entra no idem só por segurança extra.
    const idem = `calendario:${playerId}:${hoje}:${tipo}:${posicao}`
    const aplicado = await aplicar(c, playerId, recompensa, regras, idem, `${tipo}:${hoje}`)
    await run(c, 'UPDATE calendario_checkins SET aplicado = $4 WHERE player_id = $1 AND dia = $2 AND tipo = $3', [playerId, hoje, tipo, JSON.stringify(aplicado)])
    return { posicao, recompensa, aplicado }
  })
  const timeDeltaMs = out.recompensa.tipo === 'tempo' ? await drainTime(playerId).catch(() => 0) : 0
  return { ok: true, tipo: evento ? 'evento' : 'diario', posicao: out.posicao, recompensa: verRecompensa(out.recompensa, await nomesItens(pool)), aplicado: out.aplicado, timeDeltaMs }
}

/* ------------------------------------------------------------------ Mesa (Owner/Anfitrião) */

export async function mesaCalendario(atorId: string): Promise<CalendarioMesa> {
  const ator = await requireActor(atorId)
  requireCan(ator, 'calendario.editar')
  const [eventos, ciclo, regras, nomes, hoje] = await Promise.all([lerEventos(pool), lerCiclo(pool), lerRegras(pool), nomesItens(pool), hojeDb(pool)])
  const [{ n }] = await run<{ n: number }>(pool, "SELECT count(*)::int AS n FROM calendario_checkins WHERE dia = $1 AND tipo = 'diario'", [hoje])
  return {
    eventos,
    ciclo: ciclo.map((r) => verRecompensa(r, nomes)),
    regras: { falta: regras.falta, ppVirtude: regras.ppVirtude, ppVirtudePadrao: regras.ppVirtudePadrao, provisorio: regras.provisorio },
    podeRecompensas: can(ator, 'calendario.recompensas'),
    hoje,
    checkinsHoje: n,
  }
}

const texto = (v: unknown, min: number, max: number, campo: string) => {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  if (s.length < min || s.length > max) throw new RecordError(min ? `${campo}: entre ${min} e ${max} caracteres.` : `${campo}: até ${max} caracteres.`)
  return s
}

function arteValida(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v !== 'string' || v.length > 300) throw new RecordError('Arte: caminho ou endereço inválido.')
  const s = v.trim()
  if (/^\/images\/[a-z0-9/_.-]+\.(webp|png|jpe?g|svg)$/i.test(s) && !s.includes('..')) return s
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s
  throw new RecordError('Arte: use um caminho /images/… ou um endereço https.')
}

async function checkinValido(c: Queryable, v: unknown): Promise<CheckinEvento | null> {
  if (v === null || v === undefined) return null
  const o = v as Record<string, unknown>
  if (!o || typeof o !== 'object' || !Array.isArray(o.recompensas)) throw new RecordError('Check-in do evento inválido.')
  if (!o.recompensas.length) return null
  if (o.recompensas.length > 10) throw new RecordError('No máximo 10 recompensas por evento.')
  const recompensas: Recompensa[] = []
  for (const x of o.recompensas) {
    const r = recompensaValida(x)
    if (!r) throw new RecordError('Recompensa inválida no check-in do evento.')
    if (r.tipo === 'item') {
      const [d] = await run<{ kind: string }>(c, 'SELECT kind FROM item_defs WHERE key = $1 AND active', [r.item])
      if (!d || d.kind === 'cosmetico' || d.kind === 'capsula') throw new RecordError(`Item fora do catálogo de recompensas: ${r.item}.`)
    }
    recompensas.push(r)
  }
  return { titulo: texto(o.titulo ?? 'Check-in especial', 2, 60, 'Título do check-in'), recompensas }
}

/**
 * Cria (sem `id`) ou edita um evento. Anfitrião: eventos sem check-in. Check-in de evento (lista de recompensas):
 * só quem tem `calendario.recompensas` (Owner), e um evento que já tem check-in só o Owner edita.
 */
export async function salvarEvento(atorId: string, b: Record<string, unknown>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'calendario.editar')
    const id = b.id === undefined || b.id === null || b.id === '' ? null : String(b.id)
    if (id && !UUID_RE.test(id)) throw new RecordError('Evento inválido.')
    const titulo = texto(b.titulo, 2, 60, 'Nome')
    const descricao = texto(b.descricao ?? '', 0, 240, 'Descrição')
    if (!diaValido(b.inicio)) throw new RecordError('Data de início inválida.')
    const inicio = b.inicio
    const fim = b.fim === undefined || b.fim === null || b.fim === '' ? inicio : b.fim
    if (!diaValido(fim) || fim < inicio) throw new RecordError('A data final precisa ser igual ou depois do início.')
    if (diasEntre(inicio, fim) > 31) throw new RecordError('Um evento dura no máximo 32 dias.')
    const enfase = isEnfase(b.enfase) ? b.enfase : 'normal'
    const anual = b.anual === true
    const arte = arteValida(b.arte)
    let antigo: EventoRow | null = null
    if (id) {
      antigo = (await run<EventoRow>(c, `${EVENTO_SELECT} WHERE e.id = $1 AND e.removido_at IS NULL FOR UPDATE OF e`, [id]))[0] ?? null
      if (!antigo) throw new RecordError('Evento não encontrado.', 404)
      if (antigo.checkin && !can(ator, 'calendario.recompensas')) throw new RecordError('Este evento tem check-in próprio: só o Owner edita.', 403)
    }
    // checkin ausente no corpo = mantém o atual.
    const mexeCheckin = Object.prototype.hasOwnProperty.call(b, 'checkin')
    // Permissão antes de validar: quem não pode mexer no check-in recebe 403, não o erro de um campo.
    if (mexeCheckin && (b.checkin != null || antigo?.checkin)) requireCan(ator, 'calendario.recompensas', undefined, 'Só o Owner define o check-in de um evento.')
    const checkin = mexeCheckin ? await checkinValido(c, b.checkin) : antigo ? checkinDe(antigo.checkin) : null
    const params = [titulo, descricao, inicio, fim, anual, enfase, arte, checkin ? JSON.stringify(checkin) : null, ator.id]
    let eventoId: string
    if (id) {
      await run(
        c,
        `UPDATE calendario_eventos SET titulo = $1, descricao = $2, inicio = $3, fim = $4, anual = $5, enfase = $6, arte = $7, checkin = $8,
           atualizado_por = $9, updated_at = now() WHERE id = $10`,
        [...params, id],
      )
      eventoId = id
    } else {
      const [r] = await run<{ id: string }>(
        c,
        `INSERT INTO calendario_eventos (titulo, descricao, inicio, fim, anual, enfase, arte, checkin, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`,
        params,
      )
      eventoId = r.id
    }
    await run(c, 'INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, $2, $3, $4)', [
      ator.id,
      id ? 'calendario.evento.editado' : 'calendario.evento.criado',
      eventoId,
      JSON.stringify({ titulo, inicio, fim, anual, enfase, arte, checkin, antes: antigo ? { titulo: antigo.titulo, inicio: antigo.inicio, fim: antigo.fim, enfase: antigo.enfase } : null }),
    ])
    return { id: eventoId }
  })
}

export async function removerEvento(atorId: string, idRaw: unknown) {
  const id = String(idRaw ?? '')
  if (!UUID_RE.test(id)) throw new RecordError('Evento inválido.')
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'calendario.editar')
    const [e] = await run<EventoRow>(c, `${EVENTO_SELECT} WHERE e.id = $1 AND e.removido_at IS NULL FOR UPDATE OF e`, [id])
    if (!e) throw new RecordError('Evento não encontrado.', 404)
    if (e.checkin && !can(ator, 'calendario.recompensas')) throw new RecordError('Este evento tem check-in próprio: só o Owner remove.', 403)
    await run(c, 'UPDATE calendario_eventos SET removido_at = now(), atualizado_por = $2, updated_at = now() WHERE id = $1', [id, ator.id])
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'calendario.evento.removido', $2, $3)", [ator.id, id, JSON.stringify({ titulo: e.titulo, inicio: e.inicio })])
    return { id }
  })
}

/** Regras do check-in diário (Owner): falta (pausa | reinicia) e para qual Virtude vão os P.P. */
export async function definirRegras(atorId: string, b: Record<string, unknown>) {
  return txAs(atorId, async (c) => {
    const ator = await requireActor(atorId, c)
    requireCan(ator, 'calendario.recompensas')
    const falta = b.falta === 'reinicia' ? 'reinicia' : b.falta === 'pausa' ? 'pausa' : null
    if (!falta) throw new RecordError('Regra de falta inválida.')
    const ppVirtude = b.ppVirtude === 'arcano' || isVirtude(b.ppVirtude) ? b.ppVirtude : null
    const ppPadrao = isVirtude(b.ppVirtudePadrao) ? b.ppVirtudePadrao : null
    if (!ppVirtude || !ppPadrao) throw new RecordError('Virtude inválida.')
    const value = { falta, pp_virtude: ppVirtude, pp_virtude_padrao: ppPadrao }
    const provisional = b.provisorio !== false
    await run(
      c,
      `INSERT INTO devo_config (key, value, provisional, updated_by, updated_at) VALUES ('calendario.checkin.regras', $1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, provisional = EXCLUDED.provisional, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [JSON.stringify(value), provisional, ator.id],
    )
    await run(c, "INSERT INTO admin_log (actor_id, action, ref, data) VALUES ($1, 'calendario.regras', 'calendario.checkin.regras', $2)", [ator.id, JSON.stringify({ ...value, provisional })])
    return { regras: value }
  })
}
