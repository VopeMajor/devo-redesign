import { getCurrentPlayer } from '@/app/actions/player'
import { aplicarEfeito, cenasDisponiveis, concluir, escolher, estadoCena, resumoCenas, salvarPasso } from '@/lib/devo/dialogo/dialogo-server'
import { RecordError } from '@/lib/devo/errors'
import { getConfig } from '@/lib/devo/progresso-server'

export const dynamic = 'force-dynamic'

/**
 * Motor de diálogo (Narrativa). Contrato: docs/redesign/DIALOGO.md.
 * GET  /api/dialogo                 → { cenas: { [id]: { passo, fim } }, disponiveis: string[], config: { galoExplorarMin } }
 * GET  /api/dialogo?cena=<id>       → CenaEstado (progresso, tempos, itens exigidos, destino)
 * POST { action: 'passo',    cena, passo }            → { ok }
 * POST { action: 'escolher', cena, escolha, opcao }   → EfeitoAplicado (efeitos uma vez só)
 * POST { action: 'efeito',   cena, efeito }           → EfeitoAplicado
 * POST { action: 'concluir', cena }                   → EfeitoAplicado
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[dialogo]', err)
  return Response.json({ ok: false, error: 'Falha no diálogo.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    const cena = new URL(req.url).searchParams.get('cena')
    if (cena) return Response.json(await estadoCena(player.id, cena))
    const explorar = await getConfig<number>('narrativa.galo_casa.explorar_min').catch(() => null)
    const cenas = await resumoCenas(player.id)
    const disponiveis = await cenasDisponiveis(player.id, cenas).catch(() => [] as string[])
    return Response.json({ cenas, disponiveis, config: { galoExplorarMin: Math.max(0, Number(explorar?.value ?? 2)) } })
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  try {
    switch (b?.action) {
      case 'passo':
        return Response.json(await salvarPasso(player.id, b.cena, b.passo))
      case 'escolher':
        return Response.json(await escolher(player.id, b.cena, b.escolha, b.opcao))
      case 'efeito':
        return Response.json(await aplicarEfeito(player.id, b.cena, b.efeito))
      case 'concluir':
        return Response.json(await concluir(player.id, b.cena))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
