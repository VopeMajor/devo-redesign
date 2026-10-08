export type GameId = 'chess' | 'hot-bomb' | 'memory-rush' | 'bluff'

export type GameMeta = {
  id: GameId
  name: string
  tagline: string
  description: string
  players: number
  /** Duração aproximada de uma partida, em segundos. */
  durationSec: number
  /** O servidor recusa resultados enviados antes desse tempo desde o início da partida. */
  minDurationSec: number
  /** Teto de pontuação aceito pelo servidor para uma partida. */
  maxScore: number
  rules: string[]
  scoring: string[]
  accent: string
  thumbnail: string
  status: 'disponivel' | 'em-breve'
}

/**
 * Registro de jogos da Sala de Jogos. Para adicionar um jogo novo:
 * 1. adicione o id em `GameId` e os metadados aqui;
 * 2. crie o componente em `components/devo/arcade/games/` e registre em `components/devo/arcade/game-loader.tsx`;
 * 3. crie uma linha em `arcade_schedule` para agendá-lo.
 */
export const GAMES: Record<GameId, GameMeta> = {
  'memory-rush': {
    id: 'memory-rush',
    name: 'Memory Rush',
    tagline: 'Mesmo tabuleiro. Dois cérebros. Um vencedor.',
    description: 'Os dois jogadores recebem o mesmo tabuleiro ao mesmo tempo. Cada par encontrado é seu; cada erro custa caro.',
    players: 2,
    durationSec: 120,
    minDurationSec: 15,
    maxScore: 6000,
    rules: [
      'Quatro fases: 10, 8, 6 e 4 pares.',
      'Os dois competem pelo mesmo tabuleiro em tempo real.',
      'Par encontrado pelo oponente sai do seu tabuleiro.',
    ],
    scoring: ['Par: +100', 'Erro: -50', 'Combo multiplica o par seguinte'],
    accent: '#c9a227',
    thumbnail: '/images/arcade/banner-memory-rush.png',
    status: 'disponivel',
  },
  chess: {
    id: 'chess',
    name: 'Living Chess',
    tagline: 'Cada captura é um combate.',
    description: 'Xadrez rápido com exércitos vivos: soldados, guardiões, cavaleiros e magos lutam a cada captura. 30 segundos de relógio, +2s por lance.',
    players: 2,
    durationSec: 70,
    minDurationSec: 8,
    maxScore: 3000,
    rules: ['30 segundos de relógio por jogador.', 'Promoção automática para dama.', 'Tempo zerado é derrota.'],
    scoring: ['Vitória: +600', 'Captura: + valor da peça x10', 'Tempo restante vira bônus'],
    accent: '#b3141c',
    thumbnail: '/images/arcade/banner-living-chess.png',
    status: 'disponivel',
  },
  'hot-bomb': {
    id: 'hot-bomb',
    name: 'Bomba Quente',
    tagline: 'Passe adiante. Ou exploda.',
    description: 'Dois jogadores, uma bomba. Passe-a para o outro antes que ela exploda! Quem estiver com ela quando estourar perde o ponto.',
    players: 2,
    durationSec: 120,
    minDurationSec: 14,
    maxScore: 2500,
    rules: ['Vence quem fizer 3 pontos.', 'Encoste no oponente para passar a bomba.', 'Quem estiver com ela quando estourar perde o ponto.', 'Pule, desvie das barras e aguente os eventos caóticos.'],
    scoring: ['Rodada vencida: +300', 'Passe: +20', 'Passe nos últimos 2s: CLUTCH +100'],
    accent: '#e0672a',
    thumbnail: '/images/arcade/banner-hot-bomb.png',
    status: 'disponivel',
  },
  bluff: {
    id: 'bluff',
    name: 'Blefe',
    tagline: 'Quem mente melhor sobrevive.',
    description: 'Cartas viradas, um valor por vez e três balas para desmascarar o oponente. Minta, duvide e esvazie a mão primeiro.',
    players: 2,
    durationSec: 300,
    minDurationSec: 20,
    maxScore: 3000,
    rules: [
      'A mesa pede A, 2, 3… até K, e recomeça.',
      'Jogue de 1 a 4 cartas viradas como o valor da vez. Pode mentir.',
      'Chamar blefe gasta uma bala; acertou, ela volta.',
      'Quem perde a disputa recolhe até 6 cartas; o resto queima.',
      '25 segundos por turno.',
    ],
    scoring: ['Vitória: +600', 'Blefe desmascarado: +150', 'Bala guardada: +80', 'Carta descartada: +10'],
    accent: '#d6334f',
    thumbnail: '/images/arcade/banner-blefe.png',
    status: 'disponivel',
  },
}

export const GAME_LIST = Object.values(GAMES)

export function isGameId(v: unknown): v is GameId {
  return typeof v === 'string' && v in GAMES
}

/** `hours` é Tempo de vida devolvido ao jogador — a moeda da Sala de Jogos. */
export type Reward = { score?: number; virtue?: number; arcane?: number; cards?: number; hours?: number }

/** Patentes semanais por jogo, pelo total de pontos da semana. */
export const PATENTES = [
  { name: 'Aprendiz', min: 0 },
  { name: 'Iniciado', min: 100 },
  { name: 'Adepto', min: 250 },
  { name: 'Veterano', min: 500 },
  { name: 'Mestre', min: 800 },
  { name: 'Grão-mestre', min: 1200 },
] as const

export function patenteIndex(points: number) {
  let i = 0
  while (i + 1 < PATENTES.length && points >= PATENTES[i + 1].min) i++
  return i
}

export type EventStatus = 'UPCOMING' | 'REGISTRATION' | 'LOCKED' | 'LIVE' | 'FINISHED' | 'CANCELLED'

export const STATUS_LABEL: Record<EventStatus, string> = {
  UPCOMING: 'Em breve',
  REGISTRATION: 'Inscrições abertas',
  LOCKED: 'Inscrições encerradas',
  LIVE: 'Ao vivo',
  FINISHED: 'Encerrada',
  CANCELLED: 'Cancelada',
}

export const WEEKDAY_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** Recompensas semanais por colocação, resgatáveis depois do reset de segunda. */
export function rankReward(rank: number): Reward | null {
  if (rank === 1) return { virtue: 3, arcane: 2, cards: 1, hours: 12 }
  if (rank === 2) return { virtue: 2, arcane: 1, hours: 8 }
  if (rank === 3) return { virtue: 1, arcane: 1, hours: 5 }
  if (rank <= 10) return { virtue: 1, hours: 2 }
  if (rank <= 50) return { hours: 1 }
  return null
}

export function rewardParts(r: Reward): string[] {
  const out: string[] = []
  if (r.score) out.push(`${r.score} de score`)
  if (r.virtue) out.push(`${r.virtue} Ponto${r.virtue > 1 ? 's' : ''} de Virtude`)
  if (r.arcane) out.push(`${r.arcane} Fragmento${r.arcane > 1 ? 's' : ''} de Arcano`)
  if (r.cards) out.push(`${r.cards} Carta${r.cards > 1 ? 's' : ''}`)
  if (r.hours) out.push(`+${r.hours}h de Tempo`)
  return out
}

/** Gerador pseudoaleatório determinístico (mulberry32), usado pelo servidor e pelos bots. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type Side = 'a' | 'b'

/** `treino` é o tutorial contra o bot; `casual` e `evento` são partidas reais entre jogadores. */
export type MatchStart = {
  matchId: string
  gameId: GameId
  mode: 'treino' | 'casual' | 'evento'
  seed: number
  opponent: { name: string; rating: number }
  startedAt: number
  serverNow: number
  roomId?: string
  side?: Side
}

export const MEMORY_PHASES = [10, 8, 6, 4]
export const MEMORY_SYMBOLS = 13
export const MEMORY_TOTAL_MS = 120_000

function shuffle<T>(list: T[], r: () => number) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/** Baralho de uma fase: mesmo resultado no navegador e no servidor para a mesma semente. */
export function memoryDeck(seed: number, phase: number) {
  const r = rng(seed + phase * 7919)
  const pool = shuffle(
    Array.from({ length: MEMORY_SYMBOLS }, (_, i) => i),
    r,
  ).slice(0, MEMORY_PHASES[phase])
  return shuffle([...pool, ...pool], r).map((sym, i) => ({ id: phase * 100 + i, sym }))
}

export function memoryPairPoints(combo: number) {
  return 100 + 50 * (Math.min(combo, 5) - 1)
}

/** 0..1 — quão forte é o bot (rating 800..1600). */
export function botSkill(rating: number) {
  return Math.max(0, Math.min(1, (rating - 800) / 800))
}
