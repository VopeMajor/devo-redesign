import 'server-only'
import type { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { RecordError } from './errors'
import { type Queryable, run, txAs } from './fundacao-db'
import { consumeItem, grantItem } from './inventario-server'
import { getConfig, hasUnlock, unlocks } from './progresso-server'
import { conteudoEmVigor } from './torres/conteudo'
import { OPCOES_REFLEXAO } from './torres/galo'
import {
  type AndarDef,
  type AndarEstado,
  chaveItem,
  chavesDoAndar,
  type ConteudoTorres,
  custoDoAndar,
  type ItemSaldo,
  type SubirResposta,
  type TorreDef,
  type TorreEstado,
  type TorresPayload,
} from './torres/tipos'

/**
 * Torres de Ruptura no servidor. Toda regra de custo, ordem, chaves e recompensa vive aqui; o cliente só
 * desenha. Itens SEMPRE pelo inventário da Fundação (grantItem/consumeItem, com idem). Contrato: docs/redesign/TORRES.md.
 */

export const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para abrir as Torres de Ruptura.'
const ESSENCIA_GALO = 'essencia:galo'

/* ------------------------------------------------------------------ Conteúdo */

/** Conteúdo em vigor: `torres.conteudo` do Owner (se válido) ou o arquivo. */
export async function carregarConteudo(q: Queryable = pool): Promise<ConteudoTorres> {
  const cfg = await getConfig<unknown>('torres.conteudo', q).catch(() => null)
  const { conteudo, erros } = conteudoEmVigor(cfg?.value)
  if (erros.length) console.error('[torres] torres.conteudo inválido, usando o arquivo:', erros.slice(0, 5))
  return conteudo
}

/** Cria no catálogo a essência e a chave de torres novas (não mexe no que já existe). */
async function garantirItens(c: ConteudoTorres, q: Queryable) {
  const rows: [string, string, string, string, string][] = []
  for (const t of c.torres) {
    rows.push([t.essencia.item, 'essencia', t.essencia.nome, `Abre andares da ${t.nome}.`, JSON.stringify({ npc: t.npc.id, torre: t.id })])
    if (t.tipo === 'secundaria' || t.chave)
      rows.push([chaveItem(t.id), 'chave', t.chave?.nome ?? `Chave da ${t.nome}`, `Entregue pelos andares da ${t.nome}.`, JSON.stringify({ torre: t.id })])
  }
  for (const [key, kind, name, desc, meta] of rows)
    await run(q, `INSERT INTO item_defs (key, kind, name, description, rarity, stackable, meta) VALUES ($1, $2, $3, $4, 'incomum', true, $5::jsonb) ON CONFLICT (key) DO NOTHING`, [
      key,
      kind,
      name,
      desc,
      meta,
    ])
}

/* ------------------------------------------------------------------ Estado */

type Saldos = Map<string, number>

async function saldos(playerId: string, q: Queryable): Promise<Saldos> {
  const rows = await run<{ item_key: string; quantity: string }>(
    q,
    `SELECT item_key, quantity FROM player_items WHERE player_id = $1 AND (item_key LIKE 'essencia:%' OR item_key LIKE 'chave:%')`,
    [playerId],
  )
  return new Map(rows.map((r) => [r.item_key, Number(r.quantity)]))
}

async function nomesDeItens(q: Queryable): Promise<Map<string, string>> {
  const rows = await run<{ key: string; name: string }>(q, `SELECT key, name FROM item_defs WHERE kind IN ('essencia', 'chave', 'moeda', 'fragmento', 'capsula', 'cosmetico', 'outro')`)
  return new Map(rows.map((r) => [r.key, r.name]))
}

async function progresso(playerId: string, q: Queryable): Promise<Map<string, Set<number>>> {
  const rows = await run<{ tower_id: string; floor: number }>(q, 'SELECT tower_id, floor FROM tower_progress WHERE player_id = $1', [playerId])
  const m = new Map<string, Set<number>>()
  for (const r of rows) {
    if (!m.has(r.tower_id)) m.set(r.tower_id, new Set())
    m.get(r.tower_id)!.add(r.floor)
  }
  return m
}

function torreDoConteudo(c: ConteudoTorres, id: unknown): TorreDef {
  const t = c.torres.find((x) => x.id === id)
  if (!t) throw new RecordError('Torre não encontrada.', 404)
  return t
}

function montarAndar(torre: TorreDef, conteudo: ConteudoTorres, a: AndarDef, n: number, feitos: Set<number>, s: Saldos, nomes: Map<string, string>): AndarEstado {
  const concluidos = feitos.size
  const estado: AndarEstado['estado'] = feitos.has(n) ? 'concluido' : n === concluidos + 1 ? 'atual' : 'trancado'
  const custo = custoDoAndar(torre.custoBase, n)
  const chaves = (a.requisitos?.chaves ?? []).map((k) => {
    const item = chaveItem(k.torre)
    const dona = conteudo.torres.find((t) => t.id === k.torre)
    return { torre: k.torre, quantidade: Math.floor(k.quantidade), item, nome: nomes.get(item) ?? dona?.chave?.nome ?? `Chave da ${dona?.nome ?? k.torre}`, tem: s.get(item) ?? 0 }
  })
  const faltaEssencias = Math.max(0, custo - (s.get(torre.essencia.item) ?? 0))
  const faltaChaves = chaves.reduce((acc, k) => acc + Math.max(0, k.quantidade - k.tem), 0)
  return {
    n,
    titulo: a.titulo,
    resumo: a.resumo ?? null,
    npc: a.npc ?? torre.npc,
    estado,
    custo,
    chaves,
    gastaChaves: !!a.requisitos?.gastaChaves,
    faltaEssencias: estado === 'atual' ? faltaEssencias : 0,
    faltaChaves: estado === 'atual' ? faltaChaves : 0,
    podeSubir: estado === 'atual' && faltaEssencias === 0 && faltaChaves === 0,
    recompensas: {
      chaves: chavesDoAndar(torre, a),
      itens: (a.recompensas?.itens ?? []).map((it) => ({ item: it.item, nome: nomes.get(it.item) ?? it.item, quantidade: Math.floor(it.quantidade) })),
    },
    provisorio: !!a.provisorio,
    cena: estado === 'concluido' ? (a.cena ?? null) : null,
  }
}

function montarTorre(t: TorreDef, conteudo: ConteudoTorres, feitos: Set<number>, s: Saldos, nomes: Map<string, string>): TorreEstado {
  const chave: ItemSaldo | null =
    t.tipo === 'secundaria' || t.chave ? { item: chaveItem(t.id), nome: nomes.get(chaveItem(t.id)) ?? t.chave?.nome ?? `Chave da ${t.nome}`, quantidade: s.get(chaveItem(t.id)) ?? 0 } : null
  return {
    id: t.id,
    nome: t.nome,
    tipo: t.tipo,
    tema: t.tema,
    descricao: t.descricao ?? null,
    npc: t.npc,
    essencia: { item: t.essencia.item, nome: nomes.get(t.essencia.item) ?? t.essencia.nome, quantidade: s.get(t.essencia.item) ?? 0 },
    chave,
    arte: t.arte,
    mapa: { x: t.mapa.x, y: t.mapa.y, escala: t.mapa.escala ?? 1 },
    andares: t.andares.map((a, i) => montarAndar(t, conteudo, a, i + 1, feitos, s, nomes)),
    concluidos: feitos.size,
    provisorio: !!t.provisorio,
    ilustracao: t.ilustracao ?? null,
  }
}

/** Tudo o que a tela das Torres precisa (GET /api/torres). */
export async function estadoTorres(playerId: string): Promise<TorresPayload> {
  if (!(await hasUnlock(playerId, 'torres'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const conteudo = await carregarConteudo()
  await garantirItens(conteudo, pool)
  const [acesso, s, nomes, prog, tp] = await Promise.all([
    unlocks(playerId),
    saldos(playerId, pool),
    nomesDeItens(pool),
    progresso(playerId, pool),
    run<{ galo_intro_at: Date | null; galo_fan: boolean | null; reflexao_at: Date | null }>(pool, 'SELECT galo_intro_at, galo_fan, reflexao_at FROM tower_player WHERE player_id = $1', [playerId]),
  ])
  const p = tp[0]
  return {
    liberado: true,
    pularApresentacao: acesso.pularTutoriais,
    apresentacao: { galoVista: !!p?.galo_intro_at, galoFa: p?.galo_fan ?? null, reflexaoPendente: !!p?.galo_intro_at && !p?.reflexao_at },
    torres: conteudo.torres.map((t) => montarTorre(t, conteudo, prog.get(t.id) ?? new Set(), s, nomes)),
    provisorio: !!conteudo.provisorio,
    cenario: conteudo.cenario ?? null,
  }
}

async function exigirTorres(playerId: string, q: Queryable) {
  if (!(await hasUnlock(playerId, 'torres', q))) throw new RecordError('Este sistema ainda está trancado.', 403)
}

/* ------------------------------------------------------------------ Subir um andar */

/**
 * Sobe o andar `n` da torre: exige o andar anterior concluído, as chaves pedidas e as essências (custo dobrado).
 * Tudo numa transação com trava por jogador+torre; idempotente por andar (o mesmo andar nunca cobra nem
 * entrega duas vezes). Sem recurso: 409 e nada muda.
 */
export async function subirAndar(playerId: string, torreId: unknown, nRaw: unknown): Promise<SubirResposta> {
  const n = Math.floor(Number(nRaw))
  if (!Number.isFinite(n) || n < 1) throw new RecordError('Andar inválido.')
  const conteudo = await carregarConteudo()
  const torre = torreDoConteudo(conteudo, torreId)
  const andar = torre.andares[n - 1]
  if (!andar) throw new RecordError('Andar inválido.')
  await garantirItens(conteudo, pool)

  let chavesRecebidas = 0
  await txAs(playerId, async (c: PoolClient) => {
    await exigirTorres(playerId, c)
    await run(c, 'SELECT pg_advisory_xact_lock(hashtext($1))', [`devo-torre:${playerId}:${torre.id}`])
    const feitos = (await run<{ floor: number }>(c, 'SELECT floor FROM tower_progress WHERE player_id = $1 AND tower_id = $2', [playerId, torre.id])).map((r) => r.floor)
    if (feitos.includes(n)) throw new RecordError('Este andar já foi concluído.', 409)
    if (n !== feitos.length + 1) throw new RecordError('Suba os andares em ordem.', 409)

    // chaves pedidas (conferidas antes de gastar qualquer coisa)
    const s = await saldos(playerId, c)
    const pedidas = andar.requisitos?.chaves ?? []
    const falta = pedidas.filter((k) => (s.get(chaveItem(k.torre)) ?? 0) < k.quantidade)
    if (falta.length) throw new RecordError('Faltam chaves para este andar.', 409)

    const custo = custoDoAndar(torre.custoBase, n)
    const base = `torre:${torre.id}:andar:${n}:${playerId}`
    try {
      await consumeItem({ playerId, item: torre.essencia.item, quantidade: custo, motivo: 'torre', ref: `${torre.id}:${n}`, idem: `${base}:pago` }, c)
    } catch (err) {
      if (err instanceof RecordError && err.status === 409) throw new RecordError('Essências insuficientes para este andar.', 409)
      throw err
    }
    let gastas = 0
    if (andar.requisitos?.gastaChaves)
      for (const k of pedidas) {
        await consumeItem({ playerId, item: chaveItem(k.torre), quantidade: k.quantidade, motivo: 'torre', ref: `${torre.id}:${n}`, idem: `${base}:chave:${k.torre}` }, c)
        gastas += k.quantidade
      }
    await run(c, 'INSERT INTO tower_progress (player_id, tower_id, floor, cost, essence, keys_spent) VALUES ($1, $2, $3, $4, $5, $6)', [
      playerId,
      torre.id,
      n,
      custo,
      torre.essencia.item,
      gastas,
    ])
    chavesRecebidas = chavesDoAndar(torre, andar)
    if (chavesRecebidas > 0) await grantItem({ playerId, item: chaveItem(torre.id), quantidade: chavesRecebidas, motivo: 'torre', ref: `${torre.id}:${n}`, idem: `${base}:recompensa` }, c)
    for (const it of andar.recompensas?.itens ?? [])
      await grantItem({ playerId, item: it.item, quantidade: it.quantidade, motivo: 'torre', ref: `${torre.id}:${n}`, idem: `${base}:item:${it.item}` }, c)
  })

  const estado = await estadoTorres(playerId)
  if (!estado.liberado) throw new RecordError('Este sistema ainda está trancado.', 403)
  const t = estado.torres.find((x) => x.id === torre.id)!
  return { ok: true, torre: t, andar: t.andares[n - 1], cena: andar.cena ?? [], chavesRecebidas }
}

/* ------------------------------------------------------------------ Galo e reflexão */

/**
 * Oferta de virar fã do Galo: uma vez só. Aceitar entrega 1 Essência de Afinidade do Galo (idem por jogador);
 * a primeira resposta vale para sempre (recusar não pode virar aceitar depois, nem o contrário).
 */
export async function respostaFaDoGalo(playerId: string, aceitar: boolean): Promise<{ concedido: boolean; galoFa: boolean }> {
  return txAs(playerId, async (c) => {
    await exigirTorres(playerId, c)
    await run(c, 'INSERT INTO tower_player (player_id) VALUES ($1) ON CONFLICT DO NOTHING', [playerId])
    const [p] = await run<{ galo_fan: boolean | null }>(c, 'SELECT galo_fan FROM tower_player WHERE player_id = $1 FOR UPDATE', [playerId])
    if (p.galo_fan !== null) return { concedido: false, galoFa: p.galo_fan }
    await run(c, 'UPDATE tower_player SET galo_fan = $2, galo_fan_at = now() WHERE player_id = $1', [playerId, aceitar])
    if (aceitar)
      await grantItem({ playerId, item: ESSENCIA_GALO, quantidade: 1, motivo: 'dialogo', ref: 'torres:galo:fa', idem: `dialogo:torres-galo:fa:${playerId}` }, c)
    return { concedido: aceitar, galoFa: aceitar }
  })
}

/** Fim (ou pulo) da apresentação do Galo. */
export async function marcarApresentacao(playerId: string) {
  await exigirTorres(playerId, pool)
  await run(pool, `INSERT INTO tower_player (player_id, galo_intro_at) VALUES ($1, now()) ON CONFLICT (player_id) DO UPDATE SET galo_intro_at = coalesce(tower_player.galo_intro_at, now())`, [
    playerId,
  ])
}

/** Reflexão "Anfitrião de quê?" (1–5; a 4ª é "Anfitrião do Imperador"). Só a primeira resposta conta. */
export async function registrarReflexao(playerId: string, escolhaRaw: unknown) {
  const escolha = Math.floor(Number(escolhaRaw))
  if (!(escolha >= 1 && escolha <= OPCOES_REFLEXAO.length)) throw new RecordError('Escolha inválida.')
  const rows = await run(
    pool,
    `UPDATE tower_player SET reflexao_at = now(), reflexao_escolha = $2 WHERE player_id = $1 AND galo_intro_at IS NOT NULL AND reflexao_at IS NULL RETURNING player_id`,
    [playerId, escolha],
  )
  return { registrado: rows.length > 0 }
}
