import { getCurrentPlayer } from '@/app/actions/player'
import { isGameId } from '@/lib/devo/arcade/games'
import {
  ArcadeError,
  claimReward,
  finishMatch,
  getBetBoard,
  getChat,
  getDashboard,
  getEvent,
  getMiniProfile,
  placeBet,
  postChat,
  registerEntry,
  saveSettings,
  startTutorial,
} from '@/lib/devo/arcade/server'
import { joinDuel, leaveRoom, pollRoom, queueCasual } from '@/lib/devo/arcade/rooms'
import { getAvatar } from '@/lib/devo/record-server'

export const dynamic = 'force-dynamic'

const CHANNEL_RE = /^[a-z0-9-]{1,48}$/
const UUID_RE = /^[0-9a-f-]{36}$/i

function fail(err: unknown) {
  if (err instanceof ArcadeError) return Response.json({ ok: false, error: err.message }, { status: err.status })
  console.error('[arcade]', err)
  return Response.json({ ok: false, error: 'Falha no servidor da Sala de Jogos.' }, { status: 500 })
}

export async function GET(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  const url = new URL(req.url)
  const view = url.searchParams.get('view')
  try {
    if (view === 'dashboard') return Response.json(await getDashboard(player))
    if (view === 'bets') return Response.json(await getBetBoard(player))
    if (view === 'event') {
      const id = url.searchParams.get('id') ?? ''
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ArcadeError('ID inválido.')
      return Response.json(await getEvent(player, id))
    }
    if (view === 'chat') {
      const channel = url.searchParams.get('channel') ?? 'lobby'
      if (!CHANNEL_RE.test(channel)) throw new ArcadeError('Canal inválido.')
      return Response.json({ messages: await getChat(channel), serverNow: Date.now() })
    }
    if (view === 'profile') {
      const pid = url.searchParams.get('pid') ?? ''
      if (!UUID_RE.test(pid)) throw new ArcadeError('Jogador inválido.')
      return Response.json(await getMiniProfile(player, pid))
    }
    if (view === 'avatar') {
      const pid = url.searchParams.get('pid') ?? ''
      if (!UUID_RE.test(pid)) return new Response(null, { status: 400 })
      const img = await getAvatar(pid).catch(() => null)
      if (!img) return new Response(null, { status: 404 })
      return new Response(new Uint8Array(img.body), {
        headers: { 'Content-Type': img.type, 'Cache-Control': 'private, max-age=31536000, immutable' },
      })
    }
    throw new ArcadeError('Visão desconhecida.', 404)
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: Request) {
  const player = await getCurrentPlayer()
  if (!player) return Response.json({ ok: false, error: 'Sessão ausente.' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return Response.json({ ok: false, error: 'JSON inválido.' }, { status: 400 })
  }
  const s = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '')
  try {
    switch (body.action) {
      case 'register':
        return Response.json(await registerEntry(player, s('eventId')))
      case 'bet':
        return Response.json(await placeBet(player, s('duelId'), s('pick'), Number(body.amount)))
      case 'tutorial': {
        const gameId = s('gameId')
        if (!isGameId(gameId)) throw new ArcadeError('Jogo inválido.')
        return Response.json(await startTutorial(player, gameId))
      }
      case 'queue': {
        const gameId = s('gameId')
        if (!isGameId(gameId)) throw new ArcadeError('Jogo inválido.')
        return Response.json(await queueCasual(player, gameId))
      }
      case 'duel':
        return Response.json(await joinDuel(player, s('eventId')))
      case 'room': {
        const roomId = s('roomId')
        if (!UUID_RE.test(roomId)) throw new ArcadeError('Sala inválida.')
        return Response.json(await pollRoom(player, roomId, body.act))
      }
      case 'leave': {
        const roomId = s('roomId')
        if (!UUID_RE.test(roomId)) throw new ArcadeError('Sala inválida.')
        return Response.json(await leaveRoom(player, roomId))
      }
      case 'finish':
        return Response.json(
          await finishMatch(player, s('matchId'), {
            result: s('result'),
            score: Number(body.score),
            stats: typeof body.stats === 'object' && body.stats ? (body.stats as Record<string, number>) : undefined,
          }),
        )
      case 'claim':
        return Response.json(await claimReward(player))
      case 'chat': {
        const channel = s('channel') || 'lobby'
        if (!CHANNEL_RE.test(channel)) throw new ArcadeError('Canal inválido.')
        return Response.json(await postChat(player, channel, s('body')))
      }
      case 'settings':
        return Response.json(await saveSettings(player, (body.settings as Record<string, unknown>) ?? {}))
      default:
        throw new ArcadeError('Ação desconhecida.', 404)
    }
  } catch (err) {
    return fail(err)
  }
}
