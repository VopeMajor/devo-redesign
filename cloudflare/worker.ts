/**
 * Worker de entrada na Cloudflare (ver opennext.js.org/cloudflare/howtos/custom-worker).
 *
 * Reaproveita o `fetch` gerado pelo OpenNext e acrescenta o handler `scheduled` do Cron Trigger
 * (`triggers.crons` em wrangler.jsonc), que substitui o cron da Vercel (`vercel.json`).
 *
 * O cron não duplica lógica: ele chama a própria rota `/api/cron/pulse` através do `fetch` do
 * OpenNext, com o mesmo `Authorization: Bearer <CRON_SECRET>` que a Vercel mandava. Assim a rota
 * roda dentro do contexto de requisição do OpenNext (banco por requisição, Hyperdrive, env).
 *
 * Este arquivo fica fora do `tsconfig` (o `.open-next/` só existe depois do build).
 */

// @ts-ignore `.open-next/worker.js` é gerado por `opennextjs-cloudflare build`
import { default as handler } from '../.open-next/worker.js'

type Env = {
  CRON_SECRET?: string
  DEVO_PUBLIC_URL?: string
  BETTER_AUTH_URL?: string
  [key: string]: unknown
}

type Ctx = { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }
type Controller = { cron: string; scheduledTime: number; noRetry(): void }

/** Rotas chamadas por cada expressão cron. Mantenha em sincronia com `triggers.crons`. */
const CRON_ROUTES: Record<string, string> = {
  // 21:00 UTC = 18:00 em Brasília (mesmo horário que estava no vercel.json)
  '0 21 * * *': '/api/cron/pulse',
}

function publicOrigin(env: Env) {
  for (const url of [env.DEVO_PUBLIC_URL, env.BETTER_AUTH_URL]) {
    try {
      if (url) return new URL(url).origin
    } catch {
      /* ignora URL inválida */
    }
  }
  return 'https://devo.workers.dev'
}

export default {
  fetch: handler.fetch,

  async scheduled(controller: Controller, env: Env, ctx: Ctx) {
    const path = CRON_ROUTES[controller.cron]
    if (!path) {
      console.warn(`[cron] expressão sem rota: ${controller.cron}`)
      return
    }
    const headers = new Headers({ 'user-agent': 'devo-cron' })
    if (env.CRON_SECRET) headers.set('authorization', `Bearer ${env.CRON_SECRET}`)
    const request = new Request(new URL(path, publicOrigin(env)), { method: 'GET', headers })
    const response: Response = await handler.fetch(request, env, ctx)
    const body = await response.text()
    console.log(`[cron] ${controller.cron} → ${path}: ${response.status} ${body.slice(0, 300)}`)
    if (!response.ok) throw new Error(`[cron] ${path} respondeu ${response.status}`)
  },
}
