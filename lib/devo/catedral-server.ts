import 'server-only'
import { randomInt, randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import { seesAllSystems } from './cargos'
import { type CatedralPayload, itemDaOferenda, OFERENDAS, OFERENDAS_INICIAIS, type OferendaId, type RitualResultado } from './catedral'
import { RecordError } from './errors'
import { type Queryable, run, txAs } from './fundacao-db'
import { consumeItem, grantItem } from './inventario-server'
import { requireActor } from './permissoes-server'
import { adjustKarma, hasUnlock } from './progresso-server'

/**
 * Catedral de Damasco (DEVO v2) — servidor. Destino do "Sair de casa": quem tem a Casa chega até ela.
 * A primeira visita (o diálogo da Ordem) termina com a Catedral descoberta (casa_visitas, npc 'catedral'); a escolha
 * "Senti que este lugar era especial" dá +100 Karma de Caos (o jogo tem um Karma só: caos é negativo), uma vez.
 * As oferendas são itens do inventário; o sorteio do ritual é feito aqui, com as probabilidades do Rup.
 */

const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para receber as chaves da sua casa.'
const OFERENDA_IDS = OFERENDAS.map((o) => o.id)
const ehOferenda = (v: unknown): v is OferendaId => typeof v === 'string' && (OFERENDA_IDS as string[]).includes(v)

async function temCasa(playerId: string) {
  if (!(await hasUnlock(playerId, 'galo_casa'))) throw new RecordError(MOTIVO_TRANCADO, 403)
}

async function descoberta(playerId: string, q: Queryable = pool) {
  const [v] = await run<{ resultado: string }>(q, "SELECT resultado FROM casa_visitas WHERE player_id = $1 AND npc = 'catedral'", [playerId])
  return v?.resultado === 'atendeu'
}

async function oferendas(playerId: string, q: Queryable = pool): Promise<Record<OferendaId, number>> {
  const rows = await run<{ item_key: string; quantity: string }>(q, "SELECT item_key, quantity FROM player_items WHERE player_id = $1 AND item_key LIKE 'oferenda:%'", [playerId])
  const r = Object.fromEntries(OFERENDA_IDS.map((id) => [id, 0])) as Record<OferendaId, number>
  for (const x of rows) {
    const id = x.item_key.slice('oferenda:'.length)
    if (ehOferenda(id)) r[id] = Number(x.quantity)
  }
  return r
}

export async function getCatedral(playerId: string): Promise<CatedralPayload> {
  if (!(await hasUnlock(playerId, 'galo_casa'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const [ator, foi, inv] = await Promise.all([requireActor(playerId), descoberta(playerId), oferendas(playerId)])
  return { liberado: true, descoberta: foi, oferendas: inv, equipe: seesAllSystems(ator.cargo) }
}

/**
 * Fim da primeira visita. `fim`: 'altar' (foi até o fim: a Catedral fica descoberta) · 'casa' (deixou para outro dia).
 * `escolhas`: os nós do diálogo, para o Karma de Caos. Tudo uma vez só (idem por jogador).
 */
export async function fimPrimeiraVisita(playerId: string, input: { fim?: unknown; escolhas?: unknown }) {
  const fim = input.fim === 'altar' || input.fim === 'casa' ? input.fim : null
  if (!fim) throw new RecordError('Visita inválida.')
  const escolhas = Array.isArray(input.escolhas) ? input.escolhas.filter((e): e is string => typeof e === 'string' && /^[a-z0-9]{1,12}$/.test(e)).slice(0, 30) : []
  await temCasa(playerId)
  return txAs(playerId, async (c) => {
    const [ja] = await run<{ resultado: string }>(c, "SELECT resultado FROM casa_visitas WHERE player_id = $1 AND npc = 'catedral' FOR UPDATE", [playerId])
    if (ja?.resultado === 'atendeu') return { descoberta: true, caos: false, oferendas: await oferendas(playerId, c) }
    const resultado = fim === 'altar' ? 'atendeu' : 'ignorou'
    await run(
      c,
      `INSERT INTO casa_visitas (player_id, npc, resultado, detalhe) VALUES ($1, 'catedral', $2, $3::jsonb)
       ON CONFLICT (player_id, npc) DO UPDATE SET resultado = EXCLUDED.resultado, detalhe = EXCLUDED.detalhe,
         vezes = casa_visitas.vezes + 1, ultima_em = now()`,
      [playerId, resultado, JSON.stringify(escolhas.length ? { escolhas } : {})],
    )
    let caos = false
    if (fim === 'altar') {
      if (escolhas.includes('e3')) {
        await adjustKarma({ playerId, delta: -100, motivo: 'catedral', ref: 'primeira-visita:e3', idem: `catedral:caos:${playerId}` }, c)
        caos = true
      }
      for (const [id, n] of Object.entries(OFERENDAS_INICIAIS) as [OferendaId, number][]) {
        await grantItem({ playerId, item: itemDaOferenda(id), quantidade: n, motivo: 'catedral', ref: 'primeira-visita', idem: `catedral:oferendas-iniciais:${id}:${playerId}` }, c)
      }
    }
    return { descoberta: fim === 'altar', caos, oferendas: await oferendas(playerId, c) }
  })
}

const idemDe = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(v) ? v : randomUUID())

/** Queima uma oferenda no altar e sorteia o resultado. A equipe pode forçar o resultado (índice) para testar. */
export async function ritual(playerId: string, input: { oferenda?: unknown; idem?: unknown; forca?: unknown }): Promise<RitualResultado> {
  if (!ehOferenda(input.oferenda)) throw new RecordError('Oferenda inválida.')
  const of = OFERENDAS.find((o) => o.id === input.oferenda)!
  await temCasa(playerId)
  const idem = `catedral:ritual:${playerId}:${idemDe(input.idem)}`
  return txAs(playerId, async (c) => {
    if (!(await descoberta(playerId, c))) throw new RecordError('Você ainda não conhece o caminho até o altar.', 403)
    const [ja] = await run<{ resultado: string }>(c, 'SELECT resultado FROM catedral_rituais WHERE idem_key = $1', [idem])
    if (ja) return { oferenda: of.id, resultado: ja.resultado, restam: (await oferendas(playerId, c))[of.id] }
    const restam = await consumeItem({ playerId, item: itemDaOferenda(of.id), quantidade: 1, motivo: 'catedral', ref: 'ritual', idem }, c)
    let forcado = false
    let resultado = 'Nada'
    const f = Number(input.forca)
    if (Number.isInteger(f) && f >= 0 && f < of.resultados.length && seesAllSystems((await requireActor(playerId, c)).cargo)) {
      resultado = of.resultados[f][0]
      forcado = true
    } else {
      let x = randomInt(100)
      for (const [nome, p] of of.resultados) {
        if (x < p) {
          resultado = nome
          break
        }
        x -= p
      }
    }
    await run(c, 'INSERT INTO catedral_rituais (player_id, oferenda, resultado, forcado, idem_key) VALUES ($1, $2, $3, $4, $5)', [playerId, of.id, resultado, forcado, idem])
    return { oferenda: of.id, resultado, restam }
  })
}
