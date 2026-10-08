export const REACTION_IDS = ['gg', 'fogo', 'caveira', 'kkk', 'choque', 'coracao', 'f', 'rato'] as const
export type ReactionId = (typeof REACTION_IDS)[number]

export const REACTION_PREFIX = '::'

export function reactionOf(body: string): ReactionId | null {
  if (!body.startsWith(REACTION_PREFIX)) return null
  const id = body.slice(REACTION_PREFIX.length) as ReactionId
  return REACTION_IDS.includes(id) ? id : null
}

/** Canal efêmero compartilhado pelos dois lados da mesma partida. */
export function liveChannelFor(start: { roomId?: string; matchId: string }) {
  return `match-${String(start.roomId ?? start.matchId).toLowerCase().replace(/[^a-z0-9-]/g, '')}`.slice(0, 48)
}
