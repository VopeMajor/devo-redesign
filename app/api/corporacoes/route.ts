import { getCurrentPlayer } from '@/app/actions/player'
import {
  cancelarConvite,
  cancelarFundacao,
  cancelarPedido,
  chatRecentes,
  classificar,
  concluirApresentacao,
  convidar,
  decidirFundacao,
  decidirPedido,
  definirCargo,
  definirEscopo,
  definirPapel,
  definirRivalidade,
  editarBrasao,
  editarLema,
  enviarMensagem,
  fundar,
  getCorporacoes,
  mesaCorporacoes,
  passarLideranca,
  pedirEntrada,
  previaCodigo,
  recrutar,
  removerMembro,
  responderConvite,
  sair,
  transferirCarta,
} from '@/lib/devo/corporacoes-server'
import { RecordError } from '@/lib/devo/errors'

export const dynamic = 'force-dynamic'

/**
 * Corporações (contrato: docs/redesign/FUNDACAO.md §14). Tudo decidido no servidor; o cliente só mostra.
 * GET  /api/corporacoes                  → CorpPayload ({ liberado: false, motivo } quando trancado)
 * GET  /api/corporacoes?codigo=CRP-…     → { corporacao } (prévia antes de pedir entrada) · 400/404
 * GET  /api/corporacoes?view=mesa        → CorpMesa (Owner/Anfitrião)
 * GET  /api/corporacoes?view=chat        → CorpChat (as últimas mensagens do chat; só membros)
 * GET  /api/corporacoes/papel?v=…        → a imagem do papel de parede enviada pelo líder (só membros)
 * POST /api/corporacoes { action }:
 *   'apresentacao.concluir'
 *   'entrar' { codigo } · 'pedido.cancelar' { id } · 'pedido.decidir' { id, decisao: 'aprovar'|'recusar' } (líder/vice)
 *   'sair' · 'membro.cargo' { playerId, cargo: 'vice'|'membro' } · 'membro.remover' { playerId } · 'lideranca.passar' { playerId } (líder)
 *   'fundar' { nome, lema?, forma, cor, idem } → { corporacaoId, timeDeltaMs } · 'fundacao.cancelar'
 *   'convite.enviar' { nome } · 'convite.responder' { id, aceitar } · 'convite.cancelar' { id }
 *   'carta.transferir' { uid, para } → { uid, carta } · 'recrutamento.publicar' { titulo, texto } (líder/vice)
 *   'chat.listar' → CorpChat · 'chat.enviar' { texto } → { mensagem } (membros; até 300 caracteres; ritmo → 429)
 *   'papel.definir' { papel: id do padrão | 'imagem' | null, imagem?: data URL } → { papel } (líder)
 *   (sem scripts/corporacoes-chat-migration.sql: 503 { code: 'banco_desatualizado' })
 *   equipe: 'mesa.fundacao' { id, decisao, nota? } · 'mesa.classificar' { id, classificacao: 'oficial'|'necro', nota? }
 *           'mesa.escopo' { id, escopo: 'local'|'global' } · 'mesa.rivalidade' { a, b, on, nota? }
 *   (custos, requisitos, perfil visível, regras e jogos: POST /api/staff {action:'config.definir', key:'corporacoes.*'})
 */

function fail(err: unknown) {
  if (err instanceof RecordError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[corporacoes]', err)
  const code = (err as { code?: string } | null)?.code
  if (code === '42703' || code === '42P01' || code === '42883') {
    return Response.json({ ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' }, { status: 503 })
  }
  return Response.json({ ok: false, error: 'A Companhia não respondeu. Tente de novo.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('view') === 'mesa') return Response.json(await mesaCorporacoes(player.id))
    if (url.searchParams.get('view') === 'chat') return Response.json(await chatRecentes(player.id))
    const codigo = url.searchParams.get('codigo')
    if (codigo !== null) return Response.json({ ok: true, ...(await previaCodigo(player.id, codigo)) })
    return Response.json(await getCorporacoes(player.id))
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const ok = (v: unknown) => Response.json({ ok: true, ...(v && typeof v === 'object' ? v : {}) })
  const me = player.id
  try {
    switch (b.action) {
      case 'apresentacao.concluir':
        await concluirApresentacao(me)
        return ok({})
      case 'entrar':
        return ok(await pedirEntrada(me, b.codigo))
      case 'pedido.cancelar':
        return ok(await cancelarPedido(me, b.id))
      case 'pedido.decidir':
        return ok(await decidirPedido(me, { id: b.id, decisao: b.decisao }))
      case 'sair':
        return ok(await sair(me))
      case 'membro.cargo':
        return ok(await definirCargo(me, { playerId: b.playerId, cargo: b.cargo }))
      case 'membro.remover':
        return ok(await removerMembro(me, b.playerId))
      case 'lideranca.passar':
        return ok(await passarLideranca(me, b.playerId))
      case 'fundar':
        return ok(await fundar(me, { nome: b.nome, lema: b.lema, forma: b.forma, cor: b.cor, cor2: b.cor2, divisao: b.divisao, simbolo: b.simbolo, ornamento: b.ornamento, idem: b.idem }))
      case 'fundacao.cancelar':
        return ok(await cancelarFundacao(me))
      case 'convite.enviar':
        return ok(await convidar(me, { nome: b.nome }))
      case 'convite.responder':
        return ok(await responderConvite(me, { id: b.id, aceitar: b.aceitar }))
      case 'convite.cancelar':
        return ok(await cancelarConvite(me, b.id))
      case 'carta.transferir':
        return ok(await transferirCarta(me, { uid: b.uid, para: b.para }))
      case 'brasao.editar':
        return ok(await editarBrasao(me, b))
      case 'lema.editar':
        return ok(await editarLema(me, { lema: b.lema }))
      case 'recrutamento.publicar':
        return ok(await recrutar(me, { titulo: b.titulo, texto: b.texto }))
      case 'chat.listar':
        return ok(await chatRecentes(me))
      case 'chat.enviar':
        return ok(await enviarMensagem(me, { texto: b.texto }))
      case 'papel.definir':
        return ok(await definirPapel(me, { papel: b.papel, imagem: b.imagem }))
      case 'mesa.fundacao':
        return ok(await decidirFundacao(me, { id: b.id, decisao: b.decisao, nota: b.nota }))
      case 'mesa.classificar':
        return ok(await classificar(me, { id: b.id, classificacao: b.classificacao, nota: b.nota }))
      case 'mesa.escopo':
        return ok(await definirEscopo(me, { id: b.id, escopo: b.escopo }))
      case 'mesa.rivalidade':
        return ok(await definirRivalidade(me, { a: b.a, b: b.b, on: b.on, nota: b.nota }))
      default:
        return Response.json({ ok: false, error: 'Ação desconhecida.' }, { status: 400 })
    }
  } catch (err) {
    return fail(err)
  }
}
