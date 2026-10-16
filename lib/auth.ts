import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { username } from 'better-auth/plugins'
import { pool } from '@/lib/db'

export const INVITE_HEADER = 'x-devo-invite'
/** Nome do personagem no cadastro (codificado com encodeURIComponent: cabeçalhos HTTP não aceitam acento). */
export const CHARACTER_HEADER = 'x-devo-character'

export function decodeCharacterName(raw: string | null | undefined) {
  if (!raw) return null
  try {
    const name = decodeURIComponent(raw).trim().replace(/\s+/g, ' ').slice(0, 40)
    return name || null
  } catch {
    return null
  }
}
const LEGACY_COOKIE = 'devo_player'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function normalizeInvite(raw: unknown) {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function legacyPlayerId(cookieHeader: string | null | undefined) {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${LEGACY_COOKIE}=([^;]+)`))
  const id = match ? decodeURIComponent(match[1]) : null
  return id && UUID_RE.test(id) ? id : null
}

type HookContext = { headers?: Headers; request?: Request } | null

function headerOf(ctx: HookContext, name: string) {
  return ctx?.headers?.get(name) ?? ctx?.request?.headers.get(name) ?? null
}

function ownOrigin(request?: Request) {
  const host = request?.headers.get('x-forwarded-host') ?? request?.headers.get('host')
  if (!host) return []
  const proto = request?.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return [`${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`]
}

function originOf(url: string | undefined) {
  if (!url?.trim()) return []
  try {
    return [new URL(url.trim()).origin]
  } catch {
    return []
  }
}

function publicURL() {
  const url = process.env.BETTER_AUTH_URL || process.env.DEVO_PUBLIC_URL
  return url?.trim() || undefined
}

export const auth = betterAuth({
  database: pool,
  // Endereço público fixo quando houver (BETTER_AUTH_URL ou DEVO_PUBLIC_URL, ex.: https://devo.<conta>.workers.dev).
  // Sem nenhum dos dois, o better-auth deduz a origem de cada requisição.
  baseURL: publicURL(),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  // Players pick any name (spaces, accents, symbols); the only rule is that it is unique, which
  // the plugin enforces case-insensitively through its lowercase normalization.
  plugins: [
    username({
      minUsernameLength: 1,
      maxUsernameLength: 40,
      usernameValidator: (value) => value.trim().length > 0,
      displayUsernameValidator: (value) => value.trim().length > 0,
      usernameNormalization: (value) => value.trim().replace(/\s+/g, ' ').toLowerCase(),
    }),
  ],
  // A request coming from the same host that serves the app (custom domain, branch URL, preview
  // iframe) is same-origin by definition, so it is trusted alongside the static list.
  trustedOrigins: (request?: Request) => [
    ...ownOrigin(request),
    ...[process.env.BETTER_AUTH_URL, process.env.DEVO_PUBLIC_URL].flatMap((url) => originOf(url)),
    // Origens extras separadas por vírgula (ex.: um domínio próprio no futuro, ou um preview).
    ...(process.env.DEVO_EXTRA_ORIGINS ?? '').split(',').flatMap((url) => originOf(url)),
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        // Every account must burn exactly one unused invite code. The UPDATE ... WHERE used_at IS NULL
        // claims it atomically, so two simultaneous sign-ups can never share a code.
        before: async (user, ctx) => {
          const code = normalizeInvite(headerOf(ctx, INVITE_HEADER))
          if (!code) throw new APIError('FORBIDDEN', { message: 'INVITE_REQUIRED' })

          const name = String(user.displayUsername ?? user.name ?? user.username ?? '')
            .trim()
            .replace(/\s+/g, ' ')
          const legacyId = legacyPlayerId(headerOf(ctx, 'cookie'))
          const { rows: clash } = await pool.query(
            'SELECT 1 FROM players WHERE lower(name) = lower($1) AND ($2::uuid IS NULL OR id <> $2::uuid) LIMIT 1',
            [name, legacyId],
          )
          if (clash.length) throw new APIError('BAD_REQUEST', { message: 'NAME_TAKEN' })

          const { rows } = await pool.query(
            'UPDATE invite_codes SET used_at = now() WHERE code = $1 AND used_at IS NULL RETURNING code',
            [code],
          )
          if (!rows.length) throw new APIError('FORBIDDEN', { message: 'INVITE_INVALID' })
          return { data: { ...user, name } }
        },
        after: async (user, ctx) => {
          const code = normalizeInvite(headerOf(ctx, INVITE_HEADER))
          const { rows } = await pool.query<{ role: string; is_test: boolean; supervisor_id: string | null; created_by: string | null }>(
            'UPDATE invite_codes SET used_by_user = $2 WHERE code = $1 RETURNING role, is_test, supervisor_id, created_by',
            [code, user.id],
          )
          // Cargos (lib/devo/cargos.ts): o antigo 'admin' vale como 'owner'.
          let role = rows[0]?.role === 'admin' ? 'owner' : (rows[0]?.role ?? 'player')
          // Dealer exige supervisor (Anfitrião ou Owner): o do convite, senão quem gerou, senão o Owner mais antigo.
          let supervisor: string | null = null
          if (role === 'dealer') {
            const { rows: sup } = await pool.query<{ id: string }>(
              `SELECT id FROM players WHERE role IN ('anfitriao', 'owner') AND id = ANY($1::uuid[])
               ORDER BY array_position($1::uuid[], id) LIMIT 1`,
              [[rows[0]?.supervisor_id, rows[0]?.created_by].filter(Boolean)],
            )
            supervisor = sup[0]?.id ?? null
            if (!supervisor) {
              const { rows: owner } = await pool.query<{ id: string }>("SELECT id FROM players WHERE role = 'owner' ORDER BY created_at LIMIT 1")
              supervisor = owner[0]?.id ?? null
            }
            if (!supervisor) role = 'player'
          }
          // Convite de teste gera conta de teste (fora de ranking, apostas e prêmios). Ver scripts/test-accounts-migration.sql.
          const isTest = !!rows[0]?.is_test
          const legacyId = legacyPlayerId(headerOf(ctx, 'cookie'))
          const character = decodeCharacterName(headerOf(ctx, CHARACTER_HEADER)) ?? user.name
          // Grava o nome do personagem sem derrubar o cadastro se a coluna ainda não existir (migração pendente).
          const saveCharacter = async () => {
            try {
              await pool.query('UPDATE players SET character_name = $2 WHERE user_id = $1', [user.id, character])
            } catch {
              /* scripts/character-name-migration.sql ainda não rodou */
            }
          }
          // Cota inicial de convites do Jogador (1, não renova). Idempotente; ignora se a migração da Fundação não rodou.
          const grantQuota = async () => {
            try {
              await pool.query(
                `SELECT devo_item_grant(p.id, 'convite', 1, 'cota_inicial', NULL, NULL, 'cota-inicial:' || p.id::text)
                   FROM players p WHERE p.user_id = $1 AND p.role = 'player'`,
                [user.id],
              )
            } catch {
              /* scripts/fundacao-migration.sql ainda não rodou */
            }
          }
          if (legacyId) {
            const linked = await pool.query(
              'UPDATE players SET user_id = $2, name = $3, role = CASE WHEN $4 = \'player\' THEN role ELSE $4 END, supervisor_id = CASE WHEN $4 = \'player\' THEN supervisor_id ELSE $6::uuid END, is_test = is_test OR $5 WHERE id = $1 AND user_id IS NULL',
              [legacyId, user.id, user.name, role, isTest, supervisor],
            )
            if (linked.rowCount) {
              await grantQuota()
              return saveCharacter()
            }
          }
          await pool.query('INSERT INTO players (name, role, user_id, is_test, supervisor_id) VALUES ($1, $2, $3, $4, $5)', [user.name, role, user.id, isTest, supervisor])
          await grantQuota()
          await saveCharacter()
        },
      },
    },
  },
  // Cookies: sem `advanced` de propósito. O better-auth marca `Secure` (prefixo `__Secure-`) quando o
  // baseURL é https — ou em produção sem baseURL — e usa `HttpOnly` + `SameSite=Lax`, o certo para o
  // app servido na própria origem (devo.<conta>.workers.dev). O antigo `SameSite=None` só existia
  // para o iframe de preview do v0. No CI (http://localhost) os cookies seguem sem `Secure`.
})
