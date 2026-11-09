import { getCurrentPlayer } from '@/app/actions/player'
import { papelImagem } from '@/lib/devo/corporacoes-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/corporacoes/papel?v=<versao> → a imagem do papel de parede que o líder enviou do aparelho (só membros da
 * mesma Corporação). A versão muda a cada troca, então a resposta pode ficar no cache do aparelho.
 * Sem scripts/corporacoes-chat-migration.sql: 503 { code: 'banco_desatualizado' }.
 */
export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return new Response(null, { status: 401 })
  try {
    const img = await papelImagem(player.id)
    if (!img) return new Response(null, { status: 404 })
    return new Response(new Uint8Array(img.body), {
      headers: { 'Content-Type': img.type, 'Cache-Control': 'private, max-age=31536000, immutable' },
    })
  } catch (err) {
    const code = (err as { code?: string } | null)?.code
    if (code === '42703' || code === '42P01' || code === '42883') {
      return Response.json({ ok: false, error: 'O banco de dados está desatualizado. Peça ao dono para rodar scripts/devo-banco-novo.sql.', code: 'banco_desatualizado' }, { status: 503 })
    }
    console.error('[corporacoes/papel]', err)
    return new Response(null, { status: 500 })
  }
}
