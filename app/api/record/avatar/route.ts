import { getCurrentPlayer } from '@/app/actions/player'
import { getAvatar } from '@/lib/devo/record-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) return new Response(null, { status: 401 })
  const img = await getAvatar(player.id).catch(() => null)
  if (!img) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(img.body), {
    headers: { 'Content-Type': img.type, 'Cache-Control': 'private, max-age=31536000, immutable' },
  })
}
