import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { username } from 'better-auth/plugins'
import { pool } from '@/lib/db'

export const INVITE_HEADER = 'x-devo-invite'
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

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
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
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
          // The preview iframe host rotates between sessions; pin to v0's preview domains rather than one URL.
          'https://*.v0.build',
          'https://*.vercel.run',
          'https://*.vusercontent.net',
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
        ]
      : []),
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
          const { rows } = await pool.query<{ role: string; is_test: boolean }>(
            'UPDATE invite_codes SET used_by_user = $2 WHERE code = $1 RETURNING role, is_test',
            [code, user.id],
          )
          const role = rows[0]?.role ?? 'player'
          // Convite de teste gera conta de teste (fora de ranking, apostas e prêmios). Ver scripts/test-accounts-migration.sql.
          const isTest = !!rows[0]?.is_test
          const legacyId = legacyPlayerId(headerOf(ctx, 'cookie'))
          if (legacyId) {
            const linked = await pool.query(
              'UPDATE players SET user_id = $2, name = $3, role = CASE WHEN $4 = \'player\' THEN role ELSE $4 END, is_test = is_test OR $5 WHERE id = $1 AND user_id IS NULL',
              [legacyId, user.id, user.name, role, isTest],
            )
            if (linked.rowCount) return
          }
          await pool.query('INSERT INTO players (name, role, user_id, is_test) VALUES ($1, $2, $3, $4)', [user.name, role, user.id, isTest])
        },
      },
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
