import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Conexão com o Postgres (Neon) em dois mundos:
 *
 * - Cloudflare Workers (produção via OpenNext): um Worker não pode reaproveitar sockets entre
 *   requisições ("Cannot perform I/O on behalf of a different request"). Por isso cada requisição
 *   ganha o próprio Pool, guardado num WeakMap pela `ctx` da requisição, com `maxUses: 1` como
 *   recomenda a doc do OpenNext (opennext.js.org/cloudflare/howtos/db): cada conexão atende uma
 *   consulta/transação e é fechada. Quem mantém as conexões quentes com o Neon é o Hyperdrive
 *   (binding `HYPERDRIVE`); sem ele, cai para `DATABASE_URL` direto.
 * - Node (`next dev`, `next start` do CI de capturas, qualquer host fora da Cloudflare): um Pool
 *   global comum lendo `DATABASE_URL`, como sempre foi.
 *
 * `pool` e `db` continuam exportados com a mesma cara de antes (better-auth, `pool.query`,
 * `pool.connect()` para transações e drizzle seguem iguais): são fachadas que, a cada acesso,
 * resolvem o Pool certo para o contexto atual.
 */

type Db = NodePgDatabase<typeof schema>
type Conn = { pool: Pool; db: Db }
type DevoEnv = { HYPERDRIVE?: { connectionString: string }; DATABASE_URL?: string }

const perRequest = new WeakMap<object, Conn>()
let nodeConn: Conn | null = null

/** Contexto da Cloudflare da requisição atual, ou `null` fora do Worker (Node, build, dev). */
function cloudflareRequest(): { env: DevoEnv; ctx: object } | null {
  try {
    const { env, ctx } = getCloudflareContext()
    return ctx ? { env: env as DevoEnv, ctx: ctx as object } : null
  } catch {
    return null
  }
}

function current(): Conn {
  const cf = cloudflareRequest()
  if (cf) {
    let conn = perRequest.get(cf.ctx)
    if (!conn) {
      const connectionString = cf.env.HYPERDRIVE?.connectionString ?? cf.env.DATABASE_URL ?? process.env.DATABASE_URL
      const pool = new Pool({ connectionString, maxUses: 1 })
      conn = { pool, db: drizzle(pool, { schema }) }
      perRequest.set(cf.ctx, conn)
    }
    return conn
  }
  if (!nodeConn) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    nodeConn = { pool, db: drizzle(pool, { schema }) }
  }
  return nodeConn
}

/** Pool da requisição atual (Worker) ou o global (Node). */
export function getPool(): Pool {
  return current().pool
}

/** Drizzle da requisição atual (Worker) ou o global (Node). */
export function getDb(): Db {
  return current().db
}

/**
 * Fachada que repassa cada acesso ao objeto real do contexto atual. O alvo herda do protótipo
 * certo para que `instanceof Pool` e `'connect' in pool` (é assim que o better-auth/Kysely
 * reconhece um pool do `pg`) continuem verdadeiros sem abrir conexão ao carregar o módulo.
 */
function facade<T extends object>(proto: object, resolve: () => T): T {
  return new Proxy(Object.create(proto) as T, {
    get(_target, prop) {
      const real = resolve()
      const value = Reflect.get(real, prop, real)
      return typeof value === 'function' ? value.bind(real) : value
    },
    has(target, prop) {
      return prop in target || prop in resolve()
    },
    set(_target, prop, value) {
      return Reflect.set(resolve(), prop, value)
    },
  })
}

export const pool: Pool = facade<Pool>(Pool.prototype, getPool)
export const db: Db = facade<Db>(Object.prototype, getDb)
