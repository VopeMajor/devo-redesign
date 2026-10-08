import { rng, type Side } from './games'

/**
 * Motor puro do Blefe. O estado completo só existe no servidor (ou no navegador, no treino);
 * cada jogador recebe `bluffView`, que nunca contém a mão adversária nem as cartas da pilha.
 */

export const BLUFF_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const BLUFF_SUITS = ['♠', '♥', '♦', '♣']
/** Máximo de cartas recolhidas por castigo; o resto da pilha queima. */
export const BLUFF_CAP = 6
export const BLUFF_BULLETS = 3
export const BLUFF_TURN_MS = 25_000
/** Tolerância de latência antes do servidor jogar no lugar de quem estourou o tempo. */
export const BLUFF_GRACE_MS = 1500

export type BluffCard = { id: number; r: number; s: number }
type Pair<T> = { a: T; b: T }

export type BluffEvent =
  | { seq: number; t: 'play'; side: Side; n: number; rank: number; auto?: boolean }
  | {
      seq: number
      t: 'call'
      caller: Side
      liar: Side
      truth: boolean
      cards: BluffCard[]
      rank: number
      loser: Side
      taken: number
      burned: number
      bullet: 'lost' | 'back'
      left: number
    }
  | { seq: number; t: 'pass'; side: Side; auto?: boolean }

export type BluffState = {
  hands: Pair<BluffCard[]>
  pile: BluffCard[]
  last: { side: Side; n: number; rank: number; cards: BluffCard[] } | null
  turn: Side
  rk: number
  bul: Pair<number>
  /** Início do turno atual (relógio do servidor). */
  turnAt: number
  /** Ações ficam travadas até a revelação terminar. */
  holdUntil: number
  seq: number
  ev: BluffEvent | null
  winner: Side | null
  calls: Pair<number>
  hits: Pair<number>
  caught: Pair<number>
}

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a')

export function bluffRevealMs(n: number) {
  return Math.round((n * 0.6 + 0.95 + 2.8) * 1000)
}

function sortHand(h: BluffCard[]) {
  return h.slice().sort((x, y) => x.r - y.r || x.s - y.s)
}

export function bluffNew(seed: number, startAt: number): BluffState {
  const r = rng(seed ^ 0x51ed27)
  const deck: BluffCard[] = []
  for (let s = 0; s < 4; s++) for (let k = 0; k < 13; k++) deck.push({ id: s * 13 + k, r: k, s })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  const hands: Pair<BluffCard[]> = { a: [], b: [] }
  deck.forEach((c, i) => hands[i % 2 === 0 ? 'a' : 'b'].push(c))
  return {
    hands: { a: sortHand(hands.a), b: sortHand(hands.b) },
    pile: [],
    last: null,
    turn: r() < 0.5 ? 'a' : 'b',
    rk: 0,
    bul: { a: BLUFF_BULLETS, b: BLUFF_BULLETS },
    turnAt: startAt,
    holdUntil: startAt,
    seq: 0,
    ev: null,
    winner: null,
    calls: { a: 0, b: 0 },
    hits: { a: 0, b: 0 },
    caught: { a: 0, b: 0 },
  }
}

/** O jogador anterior esvaziou a mão: agora só dá para chamar blefe ou deixá-lo vencer. */
export function bluffPending(s: BluffState) {
  return !!s.last && s.hands[s.last.side].length === 0
}

export function bluffCanAct(s: BluffState, side: Side, now: number) {
  return s.winner === null && s.turn === side && now >= s.holdUntil
}

export function bluffPlay(s: BluffState, side: Side, ids: number[], now: number, auto = false) {
  if (!bluffCanAct(s, side, now) || bluffPending(s)) return false
  if (!ids.length || ids.length > 4 || new Set(ids).size !== ids.length) return false
  const hand = s.hands[side]
  const cards = ids.map((id) => hand.find((c) => c.id === id))
  if (cards.some((c) => !c)) return false
  const picked = cards as BluffCard[]
  s.hands[side] = hand.filter((c) => !ids.includes(c.id))
  s.pile = s.pile.concat(picked)
  s.last = { side, n: picked.length, rank: s.rk, cards: picked }
  s.ev = { seq: ++s.seq, t: 'play', side, n: picked.length, rank: s.rk, auto }
  s.rk = (s.rk + 1) % 13
  s.turn = other(side)
  s.turnAt = now
  return true
}

export function bluffCall(s: BluffState, side: Side, now: number) {
  if (!bluffCanAct(s, side, now) || !s.last || s.last.side === side || s.bul[side] < 1) return false
  const L = s.last
  const truth = L.cards.every((c) => c.r === L.rank)
  s.calls[side] += 1
  if (truth) s.bul[side] -= 1
  else {
    s.hits[side] += 1
    s.caught[L.side] += 1
  }
  const loser = truth ? side : L.side
  const taken = s.pile.slice(-BLUFF_CAP)
  const burned = s.pile.length - taken.length
  s.hands[loser] = sortHand(s.hands[loser].concat(taken))
  s.pile = []
  s.ev = {
    seq: ++s.seq,
    t: 'call',
    caller: side,
    liar: L.side,
    truth,
    cards: L.cards,
    rank: L.rank,
    loser,
    taken: taken.length,
    burned,
    bullet: truth ? 'lost' : 'back',
    left: s.bul[side],
  }
  s.last = null
  s.holdUntil = now + bluffRevealMs(L.cards.length)
  s.turnAt = s.holdUntil
  if (truth && s.hands[L.side].length === 0) s.winner = L.side
  return true
}

export function bluffPass(s: BluffState, side: Side, now: number, auto = false) {
  if (!bluffCanAct(s, side, now) || !s.last || !bluffPending(s)) return false
  s.winner = s.last.side
  s.ev = { seq: ++s.seq, t: 'pass', side, auto }
  return true
}

/** Jogada automática quando o tempo do turno acaba: descarta uma carta (a verdadeira, se tiver). */
export function bluffTimeout(s: BluffState, now: number) {
  if (s.winner !== null || now < Math.max(s.turnAt, s.holdUntil) + BLUFF_TURN_MS + BLUFF_GRACE_MS) return false
  const side = s.turn
  const at = Math.max(s.turnAt, s.holdUntil) + BLUFF_TURN_MS
  if (bluffPending(s)) return bluffPass(s, side, at, true)
  const hand = s.hands[side]
  const pick = hand.find((c) => c.r === s.rk) ?? farthest(hand, s.rk)
  return pick ? bluffPlay(s, side, [pick.id], Math.max(at, s.holdUntil), true) : false
}

function farthest(hand: BluffCard[], rk: number) {
  return hand.slice().sort((x, y) => ((y.r - rk + 13) % 13) - ((x.r - rk + 13) % 13))[0]
}

export function bluffView(s: BluffState, side: Side) {
  const opp = other(side)
  return {
    me: s.hands[side],
    oppN: s.hands[opp].length,
    pileN: s.pile.length,
    last: s.last ? { side: s.last.side, n: s.last.n, rank: s.last.rank } : null,
    turn: s.turn,
    rk: s.rk,
    bul: s.bul,
    turnAt: s.turnAt,
    holdUntil: s.holdUntil,
    ev: s.ev,
    winner: s.winner,
    calls: s.calls,
    hits: s.hits,
  }
}

export type BluffView = ReturnType<typeof bluffView>

export function bluffScore(s: BluffState, side: Side) {
  const discarded = Math.max(0, 26 - s.hands[side].length)
  const score = s.hits[side] * 150 + s.bul[side] * 80 + discarded * 10 + (s.winner === side ? 600 : 0)
  return {
    score,
    stats: {
      calls: s.calls[side],
      hits: s.hits[side],
      caught: s.caught[side],
      cardsLeft: s.hands[side].length,
      bulletsLeft: s.bul[side],
    },
  }
}

/** Bot do treino: a mesma heurística do protótipo, adaptada para mesa de dois. */
export function bluffBotMove(s: BluffState, side: Side, now: number, rand: () => number = Math.random) {
  const L = s.last
  const hand = s.hands[side]
  const bl = s.bul[side]
  if (L) {
    const liarN = s.hands[L.side].length
    const mine = hand.filter((c) => c.r === L.rank).length
    const sure = mine + L.n > 4
    if (bl > 0) {
      let pr: number
      if (sure) pr = 1
      else if (liarN === 0) pr = 0.9
      else {
        pr = [0, 0.05, 0.12, 0.25, 0.4][L.n]
        if (liarN <= 2) pr += 0.2
        pr += Math.min(s.pile.length, 20) / 200
        if (hand.length > 14) pr -= 0.1
        if (bl === 1) pr *= 0.55
        else if (bl === 2) pr *= 0.85
      }
      if (rand() < pr) return bluffCall(s, side, now)
    }
    if (liarN === 0) return bluffPass(s, side, now)
  }
  const rk = s.rk
  const own = hand.filter((c) => c.r === rk)
  let pick: BluffCard[] = []
  if (own.length) {
    let k = own.length
    if (k > 1 && rand() < 0.25) k = 1 + Math.floor(rand() * k)
    pick = own.slice(0, k)
  }
  let extra = 0
  if (!own.length) extra = 1 + (rand() < 0.5 ? 1 : 0) + (rand() < 0.25 ? 1 : 0)
  else if (pick.length < 4 && hand.length > pick.length && rand() < 0.22) extra = 1
  if (extra) {
    const rest = hand.filter((c) => !pick.includes(c)).sort((x, y) => ((y.r - rk + 13) % 13) - ((x.r - rk + 13) % 13))
    pick = pick.concat(rest.slice(0, Math.min(extra, 4 - pick.length)))
  }
  return bluffPlay(s, side, pick.map((c) => c.id), now)
}
