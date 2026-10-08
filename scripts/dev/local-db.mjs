// Banco local de teste para o DEVO, sem Neon e sem instalar Postgres.
// Sobe um Postgres embutido (PGlite) na porta 5433, aplica o schema e os dados de teste.
// Uso: pnpm dev:local  (ou: node scripts/dev/local-db.mjs --reset para apagar e recriar)
import { readFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const dataDir = join(root, '.devo-local-db')
const port = Number(process.env.DEVO_LOCAL_DB_PORT ?? 5433)

if (process.argv.includes('--reset') && existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true })
const fresh = !existsSync(dataDir)

const db = await PGlite.create(dataDir)
const files = [
  join(here, '00-base.sql'),
  join(root, 'scripts', 'deadly-votes-migration.sql'),
  join(root, 'scripts', 'auth-migration.sql'),
  join(root, 'scripts', 'arcade-migration.sql'),
  join(root, 'scripts', 'arcade-points-migration.sql'),
  join(root, 'scripts', 'arcade-rooms-migration.sql'),
  ...(fresh ? [join(here, '90-seed.sql')] : []),
]
for (const f of files) await db.exec(readFileSync(f, 'utf8'))

const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' })
await server.start()
console.log(`[devo] banco local pronto em postgres://postgres@127.0.0.1:${port}/postgres${fresh ? ' (dados de teste criados)' : ''}`)
console.log('[devo] convites de teste: DEVO-TEST-0001 … 0004, admin: DEVO-TEST-ADM1')

const stop = async () => {
  await server.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
