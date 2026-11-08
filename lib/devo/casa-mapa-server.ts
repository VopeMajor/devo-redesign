import 'server-only'
import { randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import { drainTime } from './arcade/server'
import { type CasaEtapa, type CasaMapaPayload, lerAparencia, mesmaAparencia, TROCA_MINUTOS, type VisitaResultado } from './casa-aparencia'
import { contaFabricacoes, debitar, reservaDoTempo } from './casa-server'
import { seesAllSystems } from './cargos'
import { RecordError } from './errors'
import { run, txAs } from './fundacao-db'
import { grantItem } from './inventario-server'
import { requireActor } from './permissoes-server'
import { hasUnlock } from './progresso-server'

/**
 * Casa em RPG Maker (DEVO v2) — servidor do mapa: aparência do avatar e visitas na porta.
 * A Confecção e os Pacotes continuam em casa-server.ts (/api/casa); o mapa só mostra a mesa e abre a mesma tela.
 *
 * Aparência: a primeira é grátis; cada troca depois custa TROCA_MINUTOS do pulso (com a reserva da Confecção), na
 * mesma transação que grava a nova. Igual à anterior → nada muda e nada é cobrado.
 * Visitas: o Simon bate até ser atendido; quem fica com o guarda-chuva recebe o item `heranca:guarda_chuva`.
 */

const MOTIVO_TRANCADO = 'Vença o Deadly Vote do tutorial para receber as chaves da sua casa.'
const ITEM_GUARDA_CHUVA = 'heranca:guarda_chuva'

async function liberada(playerId: string) {
  if (!(await hasUnlock(playerId, 'galo_casa'))) throw new RecordError(MOTIVO_TRANCADO, 403)
}

export async function getCasaMapa(playerId: string): Promise<CasaMapaPayload & { timeDeltaMs?: number }> {
  if (!(await hasUnlock(playerId, 'galo_casa'))) return { liberado: false, motivo: MOTIVO_TRANCADO }
  const [ator, ap, fab, simon, timeDeltaMs] = await Promise.all([
    requireActor(playerId),
    run<{ aparencia: unknown }>(pool, 'SELECT aparencia FROM casa_aparencia WHERE player_id = $1', [playerId]),
    contaFabricacoes(playerId),
    run<{ resultado: VisitaResultado; detalhe: Record<string, unknown> }>(pool, "SELECT resultado, detalhe FROM casa_visitas WHERE player_id = $1 AND npc = 'simon'", [
      playerId,
    ]),
    drainTime(playerId),
  ])
  const equipe = seesAllSystems(ator.cargo)
  const etapa: CasaEtapa = equipe || fab.total > 0 ? 3 : 2
  const aparencia = lerAparencia(ap[0]?.aparencia)
  const s = simon[0] ?? null
  return {
    liberado: true,
    aparencia,
    etapa,
    andamento: fab.andamento,
    // o Simon é sempre o primeiro; enquanto não for atendido, volta a bater (só depois da aparência criada)
    visita: aparencia && s?.resultado !== 'atendeu' ? 'simon' : null,
    simon: s ? { resultado: s.resultado, detalhe: s.detalhe ?? {} } : null,
    trocaMinutos: TROCA_MINUTOS,
    equipe,
    timeDeltaMs,
  }
}

const idemDe = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(v) ? v : randomUUID())

/**
 * Salva a aparência. Sem aparência ainda → grátis (criação). Com aparência → troca do guarda-roupa: só no andar dos
 * quartos (etapa 3), custa TROCA_MINUTOS; igual à atual → { mudou: false }, nada cobrado.
 */
export async function salvarAparencia(playerId: string, input: { aparencia?: unknown; idem?: unknown }) {
  const nova = lerAparencia(input.aparencia)
  if (!nova) throw new RecordError('Aparência inválida.')
  await liberada(playerId)
  const idem = `aparencia:${playerId}:${idemDe(input.idem)}`
  return txAs(playerId, async (c) => {
    const [ja] = await run<{ id: string }>(c, 'SELECT id FROM casa_aparencia_trocas WHERE idem_key = $1', [idem])
    if (ja) throw new RecordError('Esta troca já foi feita.', 409)
    const [atual] = await run<{ aparencia: unknown }>(c, 'SELECT aparencia FROM casa_aparencia WHERE player_id = $1 FOR UPDATE', [playerId])
    const antes = atual ? lerAparencia(atual.aparencia) : null
    if (!atual) {
      await run(c, 'INSERT INTO casa_aparencia (player_id, aparencia) VALUES ($1, $2::jsonb) ON CONFLICT (player_id) DO NOTHING', [playerId, JSON.stringify(nova)])
      return { aparencia: nova, mudou: true, primeira: true, timeDeltaMs: 0 }
    }
    if (antes && mesmaAparencia(antes, nova)) return { aparencia: antes, mudou: false, primeira: false, timeDeltaMs: 0 }
    const ator = await requireActor(playerId, c)
    const { total } = await contaFabricacoes(playerId, c)
    if (!seesAllSystems(ator.cargo) && total === 0) throw new RecordError('O guarda-roupa fica no andar dos quartos, que ainda está fechado.', 403)
    const timeDeltaMs = await debitar(c, playerId, TROCA_MINUTOS, await reservaDoTempo(c))
    await run(c, 'INSERT INTO casa_aparencia_trocas (player_id, antes, depois, minutos, idem_key) VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)', [
      playerId,
      JSON.stringify(antes ?? atual.aparencia),
      JSON.stringify(nova),
      TROCA_MINUTOS,
      idem,
    ])
    await run(c, 'UPDATE casa_aparencia SET aparencia = $2::jsonb, trocas = trocas + 1, atualizada_em = now() WHERE player_id = $1', [playerId, JSON.stringify(nova)])
    return { aparencia: nova, mudou: true, primeira: false, timeDeltaMs }
  })
}

/**
 * Fim da visita do Simon. `fim`: 'atendeu' | 'ignorou'; `guardaChuva`: 'ficou' | 'deu' (só quando atendeu e ele
 * entrou na casa). Depois de atendida, a visita não muda mais (o guarda-chuva sai uma vez só, por idem).
 */
export async function fimVisitaSimon(playerId: string, input: { fim?: unknown; guardaChuva?: unknown; escolhas?: unknown }) {
  const fim = input.fim === 'atendeu' || input.fim === 'ignorou' ? input.fim : null
  if (!fim) throw new RecordError('Visita inválida.')
  const guardaChuva = input.guardaChuva === 'ficou' || input.guardaChuva === 'deu' ? input.guardaChuva : null
  const escolhas = Array.isArray(input.escolhas) ? input.escolhas.filter((e): e is string => typeof e === 'string' && /^[a-z]{1,20}$/.test(e)).slice(0, 30) : []
  await liberada(playerId)
  return txAs(playerId, async (c) => {
    const [ja] = await run<{ resultado: VisitaResultado; detalhe: Record<string, unknown> }>(
      c,
      "SELECT resultado, detalhe FROM casa_visitas WHERE player_id = $1 AND npc = 'simon' FOR UPDATE",
      [playerId],
    )
    if (ja?.resultado === 'atendeu') return { resultado: ja.resultado, detalhe: ja.detalhe, guardaChuva: false }
    const detalhe: Record<string, unknown> = { ...(guardaChuva ? { guardaChuva } : {}), ...(escolhas.length ? { escolhas } : {}) }
    await run(
      c,
      `INSERT INTO casa_visitas (player_id, npc, resultado, detalhe) VALUES ($1, 'simon', $2, $3::jsonb)
       ON CONFLICT (player_id, npc) DO UPDATE SET resultado = EXCLUDED.resultado, detalhe = EXCLUDED.detalhe,
         vezes = casa_visitas.vezes + 1, ultima_em = now()`,
      [playerId, fim, JSON.stringify(detalhe)],
    )
    let ganhou = false
    if (fim === 'atendeu' && guardaChuva === 'ficou') {
      await grantItem({ playerId, item: ITEM_GUARDA_CHUVA, quantidade: 1, motivo: 'visita', ref: 'simon', idem: `visita:simon:guarda-chuva:${playerId}` }, c)
      ganhou = true
    }
    return { resultado: fim, detalhe, guardaChuva: ganhou }
  })
}
