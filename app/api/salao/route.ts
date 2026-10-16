import { getCurrentPlayer } from '@/app/actions/player'
import { RecordError } from '@/lib/devo/errors'
import {
  comprarMercado,
  concluirApresentacao,
  criarAnuncio,
  darLance,
  decidirAnuncio,
  decidirLote,
  definirContrato,
  enviarBandeja,
  filaAvaliacao,
  getSalao,
  lerAvisoAnunciar,
  removerEvento,
  retirarAnuncio,
  retirarLote,
  retirarOferta,
  salvarEvento,
  venderMercado,
} from '@/lib/devo/salao-server'

export const dynamic = 'force-dynamic'

/**
 * Salão das Máscaras (contrato: docs/redesign/FUNDACAO.md §11). Tudo decidido no servidor; o cliente só mostra.
 * GET  /api/salao                 → SalaoPayload ({ liberado: false, motivo } quando trancado)
 * GET  /api/salao?view=avaliacao  → SalaoAvaliacao (equipe: fila do especialista)
 * POST /api/salao { action }:
 *   'apresentacao.concluir' · 'aviso.lido'
 *   'bandeja.enviar' { uid, lanceMinimo? }   → { loteId, numero, uid, timeDeltaMs }   (a carta sai do inventário)
 *   'bandeja.retirar' { loteId }             → { ok }                                (só em avaliação)
 *   'lance' { loteId, valor }                → { lanceId, valor, timeDeltaMs }       (só durante a abertura)
 *   'mercado.vender' { uid, preco }          → { ofertaId, uid }
 *   'mercado.comprar' { ofertaId }           → { carta, timeDeltaMs }                (só durante a abertura)
 *   'mercado.retirar' { ofertaId }           → { ok }
 *   'anuncio.criar' { tipo, titulo, texto }  → { anuncioId, timeDeltaMs }            (proposta | propaganda)
 *   'anuncio.retirar' { id }                 → { ok }
 *   equipe: 'avaliacao.lote' { loteId, decisao: 'aprovar'|'recusar', nota?, lanceMinimo? } · 'avaliacao.anuncio' { id, decisao: 'publicar'|'recusar', nota? }
 *   Owner:  'evento.salvar' { id?, tipo, titulo, descricao, inicio, fim, destaques[] } · 'evento.remover' { id } · 'contrato.definir' { playerId, contrato }
 *   (calendário, bandeja, contratos e anúncios: POST /api/staff {action:'config.definir', key:'salao.*'})
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[salao]', err)
  return Response.json({ ok: false, error: 'O Salão não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    const view = new URL(req.url).searchParams.get('view')
    if (view === 'avaliacao') return Response.json(await filaAvaliacao(player.id))
    return Response.json(await getSalao(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const ok = (v: unknown) => Response.json({ ok: true, ...(v && typeof v === 'object' ? v : {}) })
  try {
    switch (b.action) {
      case 'apresentacao.concluir':
        return ok(await concluirApresentacao(player.id))
      case 'aviso.lido':
        return ok(await lerAvisoAnunciar(player.id))
      case 'bandeja.enviar':
        return ok(await enviarBandeja(player.id, { uid: b.uid, lanceMinimo: b.lanceMinimo }))
      case 'bandeja.retirar':
        return ok(await retirarLote(player.id, b.loteId))
      case 'lance':
        return ok(await darLance(player.id, { loteId: b.loteId, valor: b.valor }))
      case 'mercado.vender':
        return ok(await venderMercado(player.id, { uid: b.uid, preco: b.preco }))
      case 'mercado.comprar':
        return ok(await comprarMercado(player.id, b.ofertaId))
      case 'mercado.retirar':
        return ok(await retirarOferta(player.id, b.ofertaId))
      case 'anuncio.criar':
        return ok(await criarAnuncio(player.id, { tipo: b.tipo, titulo: b.titulo, texto: b.texto }))
      case 'anuncio.retirar':
        return ok(await retirarAnuncio(player.id, b.id))
      case 'avaliacao.lote':
        return ok(await decidirLote(player.id, { loteId: b.loteId, decisao: b.decisao, nota: b.nota, lanceMinimo: b.lanceMinimo }))
      case 'avaliacao.anuncio':
        return ok(await decidirAnuncio(player.id, { id: b.id, decisao: b.decisao, nota: b.nota }))
      case 'evento.salvar':
        return ok(await salvarEvento(player.id, b))
      case 'evento.remover':
        return ok(await removerEvento(player.id, b.id))
      case 'contrato.definir':
        return ok(await definirContrato(player.id, b.playerId, b.contrato))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
