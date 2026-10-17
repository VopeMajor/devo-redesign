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
  join(root, 'scripts', 'deadly-votes-group-migration.sql'),
  join(root, 'scripts', 'auth-migration.sql'),
  join(root, 'scripts', 'arcade-migration.sql'),
  join(root, 'scripts', 'arcade-points-migration.sql'),
  join(root, 'scripts', 'arcade-rooms-migration.sql'),
  join(root, 'scripts', 'test-accounts-migration.sql'),
  join(root, 'scripts', 'character-name-migration.sql'),
  join(root, 'scripts', 'fundacao-migration.sql'),
  join(root, 'scripts', 'poco-migration.sql'),
  join(root, 'scripts', 'staff-migration.sql'),
  join(root, 'scripts', 'torres-migration.sql'),
  join(root, 'scripts', 'salao-migration.sql'),
  join(root, 'scripts', 'cosmeticos-migration.sql'),
  join(root, 'scripts', 'virtudes-migration.sql'),
  join(root, 'scripts', 'corporacoes-migration.sql'),
  join(root, 'scripts', 'narrativa-migration.sql'),
  join(root, 'scripts', 'calendario-migration.sql'),
  ...(fresh ? [join(here, '90-seed.sql'), join(here, '91-seed-poco.sql'), join(here, '92-seed-torres.sql'), join(here, '93-seed-salao.sql'), join(here, '94-seed-cosmeticos.sql'), join(here, '95-seed-virtudes.sql'), join(here, '96-seed-corporacoes.sql'), join(here, '91-seed-narrativa.sql'), join(here, '97-seed-calendario.sql')] : []),
]
for (const f of files) await db.exec(readFileSync(f, 'utf8'))

const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' })
await server.start()
console.log(`[devo] banco local pronto em postgres://postgres@127.0.0.1:${port}/postgres${fresh ? ' (dados de teste criados)' : ''}`)
console.log('[devo] convites de teste: DEVO-TEST-0001 … 0004, owner: DEVO-TEST-ADM1')

const stop = async () => {
  await server.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
