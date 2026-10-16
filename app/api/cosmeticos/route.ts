import { getCurrentPlayer } from '@/app/actions/player'
import {
  adminCatalogo,
  aprovarPlano,
  concederCosmetico,
  criarPlano,
  decidirPlano,
  distribuirPlano,
  editarPlano,
  enviarAsset,
  equiparCosmetico,
  historicoCosmeticos,
  lerAsset,
  listarPlanos,
  listCatalogo,
  meusCosmeticos,
  revogarCosmetico,
  salvarCosmetico,
  visuais,
} from '@/lib/devo/cosmeticos-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Cosméticos (contrato: docs/redesign/FUNDACAO.md §12).
 * GET  /api/cosmeticos                         → MeusCosmeticos (só do próprio jogador)
 * GET  ?view=catalogo                          → { catalogo } (itens ativos; dado público do jogo)
 * GET  ?view=visuais&ids=a,b,c                 → { visuais: Visual[] } (aparência pública, sem cargo de Owner)
 * GET  ?view=asset&id=<uuid>                   → arquivo enviado pelo Owner (CSP fechada)
 * GET  ?view=admin | historico | planos        → Owner / equipe
 * POST { action: 'equipar', slot, key|null }   → { ok, equipados }
 * POST admin.salvar | admin.asset | admin.conceder | admin.revogar (Owner)
 * POST plano.criar | plano.editar | plano.aprovar | plano.rejeitar | plano.cancelar | plano.distribuir (equipe, por cargo)
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[cosmeticos]', err)
  return Response.json({ ok: false, error: 'Falha nos cosméticos.' }, { status: 500 })
}

const s = (v: unknown) => (typeof v === 'string' ? v : '')

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const url = new URL(req.url)
  const p = (k: string) => url.searchParams.get(k)
  try {
    switch (p('view')) {
      case null:
      case '':
        return Response.json(await meusCosmeticos(player.id))
      case 'catalogo':
        return Response.json({ catalogo: await listCatalogo() }, { headers: { 'cache-control': 'private, max-age=60' } })
      case 'visuais':
        return Response.json({ visuais: await visuais((p('ids') ?? '').split(',')) })
      case 'asset': {
        const a = await lerAsset(p('id') ?? '')
        if (!a) return new Response(null, { status: 404 })
        return new Response(new Uint8Array(a.data), {
          headers: {
            'content-type': a.mime,
            'cache-control': 'private, max-age=86400, immutable',
            'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
            'x-content-type-options': 'nosniff',
          },
        })
      }
      case 'admin':
        return Response.json({ itens: await adminCatalogo(player.id) })
      case 'historico':
        return Response.json({ historico: await historicoCosmeticos(player.id, { key: p('item'), playerId: p('jogador') }) })
      case 'planos':
        return Response.json(await listarPlanos(player.id))
      default:
        return Response.json({ ok: false, error: 'Visão desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b || typeof b.action !== 'string') return Response.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 })
  const me = player.id
  try {
    switch (b.action) {
      case 'equipar':
        return Response.json({ ok: true, equipados: await equiparCosmetico(me, b.slot, b.key ?? null) })
      case 'admin.salvar':
        return Response.json({ ok: true, key: await salvarCosmetico(me, (b.item ?? {}) as Record<string, unknown>) })
      case 'admin.asset':
        return Response.json({ ok: true, ...(await enviarAsset(me, { mime: b.mime, base64: b.base64 })) })
      case 'admin.conceder':
        await concederCosmetico(me, s(b.playerId), s(b.key), s(b.motivo))
        break
      case 'admin.revogar':
        await revogarCosmetico(me, s(b.playerId), s(b.key), s(b.motivo))
        break
      case 'plano.criar':
        return Response.json({ ok: true, id: await criarPlano(me, b) })
      case 'plano.editar':
        await editarPlano(me, s(b.id), b)
        break
      case 'plano.aprovar':
        await aprovarPlano(me, s(b.id))
        break
      case 'plano.rejeitar':
        await decidirPlano(me, s(b.id), 'rejeitar')
        break
      case 'plano.cancelar':
        await decidirPlano(me, s(b.id), 'cancelar')
        break
      case 'plano.distribuir':
        return Response.json({ ok: true, ...(await distribuirPlano(me, s(b.id))) })
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
