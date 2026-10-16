import 'server-only'
import type { Pool, PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { RecordError } from './errors'

/** Pool ou cliente de uma transação: as funções da Fundação aceitam os dois. */
export type Queryable = Pool | PoolClient

/**
 * Transação com ator registrado (`devo.actor`): os gatilhos de log (admin_log, reward_log, histórico de
 * supervisão) gravam quem fez a mudança. Use sempre que alterar cargos, recompensas ou flags.
 */
export async function txAs<T>(actorId: string | null, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    if (actorId) await c.query("SELECT set_config('devo.actor', $1, true)", [actorId])
    const out = await fn(c)
    await c.query('COMMIT')
    return out
  } catch (err) {
    await c.query('ROLLBACK').catch(() => {})
    throw mapDbError(err)
  } finally {
    c.release()
  }
}

const DB_ERRORS: [RegExp, string, number][] = [
  [/SALDO_INSUFICIENTE/, 'Saldo insuficiente.', 409],
  [/ITEM_DESCONHECIDO/, 'Item desconhecido.', 400],
  [/QUANTIDADE_INVALIDA/, 'Quantidade inválida.', 400],
  [/KARMA_DELTA_INVALIDO/, 'Ajuste de karma inválido.', 400],
  [/JOGADOR_DESCONHECIDO/, 'Jogador não encontrado.', 404],
  [/DEALER_SEM_SUPERVISOR/, 'Dealer precisa de um supervisor.', 400],
  [/SUPERVISOR_INVALIDO/, 'O supervisor precisa ser um Anfitrião.', 400],
  [/SUPERVISOR_COM_DEALERS/, 'Transfira os Dealers deste supervisor antes de mudar o cargo.', 409],
  [/RECOMPENSA_FECHADA/, 'Esta recompensa já foi encerrada.', 409],
  [/APROVACAO_SO_DE_PENDENTE/, 'Só propostas pendentes podem ser aprovadas.', 409],
  [/APROVACAO_NAO_PERMITIDA/, 'Você não pode aprovar esta recompensa.', 403],
  [/ENTREGA_SEM_APROVACAO/, 'A recompensa precisa estar aprovada para ser entregue.', 409],
  // Staff / Deadly Vote (scripts/staff-migration.sql)
  [/RESULTADO_APLICADO/, 'O resultado deste Deadly Vote já foi aplicado aos perfis.', 409],
  [/APLICAR_SO_CONCLUIDO/, 'Conclua o Deadly Vote antes de aplicar o resultado.', 409],
  // Cosméticos / recompensas semanais (scripts/cosmeticos-migration.sql)
  [/PLANO_FECHADO/, 'Este plano já foi encerrado.', 409],
  [/PLANO_SEM_APROVACAO/, 'Aprove o plano antes de distribuir.', 409],
  // Virtudes (scripts/virtudes-migration.sql)
  [/VIRTUDE_DESCONHECIDA/, 'Virtude desconhecida.', 400],
  // Corporações (scripts/corporacoes-migration.sql)
  [/CORP_CLASSIFICACAO_NEGADA/, 'Só a equipe da Companhia classifica uma Corporação.', 403],
  [/violates (check|foreign key) constraint/, 'Dados inválidos.', 400],
  [/invalid input syntax for type uuid/, 'ID inválido.', 400],
]

/** Converte as exceções dos gatilhos/funções SQL em RecordError com mensagem em português. */
export function mapDbError(err: unknown): unknown {
  if (err instanceof RecordError) return err
  const msg = err instanceof Error ? err.message : ''
  for (const [re, text, status] of DB_ERRORS) if (re.test(msg)) return new RecordError(text, status)
  return err
}

/** Executa uma consulta convertendo erros do banco. */
export async function run<T = Record<string, unknown>>(q: Queryable, text: string, params: unknown[] = []): Promise<T[]> {
  try {
    return (await q.query(text, params)).rows as T[]
  } catch (err) {
    throw mapDbError(err)
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
