'use server'

import { headers } from 'next/headers'
import { auth, normalizeInvite } from '@/lib/auth'
import { pool } from '@/lib/db'

export type Player = { id: string; name: string; role: string }
export type InviteCheck = { ok: true } | { ok: false; error: string }

export async function getCurrentPlayer(): Promise<Player | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    const { rows } = await pool.query<Player>('SELECT id, name, role FROM players WHERE user_id = $1 LIMIT 1', [session.user.id])
    return rows[0] ?? null
  } catch {
    return null
  }
}

/** Pre-check only, for UX. The code is actually claimed atomically inside the sign-up hook. */
export async function checkInviteCode(raw: string): Promise<InviteCheck> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (session?.user) return { ok: false, error: 'Você já tem um registro. Use Continuar para voltar de onde parou.' }
  const code = normalizeInvite(raw)
  if (code.length < 6 || code.length > 32) return { ok: false, error: 'Código inválido.' }
  const { rows } = await pool.query<{ used_at: Date | null }>('SELECT used_at FROM invite_codes WHERE code = $1', [code])
  if (!rows.length) return { ok: false, error: 'Esse código não existe.' }
  if (rows[0].used_at) return { ok: false, error: 'Esse código já foi usado. Se você já tem conta, entre por Continuar.' }
  return { ok: true }
}
