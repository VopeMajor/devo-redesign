'use client'

import { Anchor, Club, Crown, Diamond, Dice5, Eye, Flame, Heart, Hourglass, Key, Moon, Skull, Spade, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { GameProps } from '@/lib/devo/arcade/client'
import type { MemoryState } from '@/lib/devo/arcade/client'
import { GAMES, MEMORY_PHASES, memoryAfterMiss, memoryDeck, memoryPairPoints, rng } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { Countdown321, GameFrame, PopLayer, ScoreChip, WaitingStart, usePops, vibrate } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'

const SYMBOLS: { icon: LucideIcon; color: string }[] = [
  { icon: Skull, color: '#eceef2' },
  { icon: Crown, color: '#6f8cff' },
  { icon: Dice5, color: '#c9a7ff' },
  { icon: Spade, color: '#9fb4ff' },
  { icon: Heart, color: '#8fa6ff' },
  { icon: Club, color: '#7fe0a6' },
  { icon: Diamond, color: '#ffb36b' },
  { icon: Moon, color: '#b8d8ff' },
  { icon: Flame, color: '#ff7a3a' },
  { icon: Eye, color: '#f0a6ff' },
  { icon: Key, color: '#e0d27a' },
  { icon: Hourglass, color: '#d6b48c' },
  { icon: Anchor, color: '#7ad7e0' },
]

const PHASES = MEMORY_PHASES
const TOTAL_MS = 120_000
const meta = GAMES['memory-rush']

type Card = { id: number; sym: number; owner: 'me' | 'opp' | null }

function buildPhase(seed: number, phase: number): Card[] {
  return memoryDeck(seed, phase).map((c) => ({ ...c, owner: null }))
}

const pairPoints = memoryPairPoints

/** O número do HUD é o mesmo que o servidor grava: limitado a 0..maxScore. */
const shownScore = (n: number) => Math.max(0, Math.min(meta.maxScore, n))

export default function MemoryRush({ start, onFinish, onQuit }: GameProps) {
  const { online, room, act, toLocal } = useRoom(start, 450)
  const gateOpen = useOnlineGate(start)
  const side = start.side ?? 'a'
  const oppSide = side === 'a' ? 'b' : 'a'
  const seenOppClaims = useRef(new Set<string>())
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [cards, setCards] = useState<Card[]>(() => buildPhase(start.seed, 0))
  const [open, setOpen] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [me, setMe] = useState({ score: 0, pairs: 0, combo: 0, bestCombo: 0, misses: 0 })
  const [opp, setOpp] = useState({ score: 0, pairs: 0, combo: 0 })
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(0)
  const [oppFlash, setOppFlash] = useState<number[]>([])
  /** Tutorial: cartas que o bot virou e errou ficam à mostra por um instante (didático). */
  const [oppPeek, setOppPeek] = useState<number[]>([])
  const { pops, push } = usePops()
  const phaseMisses = useRef(0)
  const wasBehind = useRef(false)
  const finished = useRef(false)
  const live = useRef({ cards, me, opp, open })
  live.current = { cards, me, opp, open }

  const botRand = useMemo(() => rng(start.seed ^ 0x9e3779b9), [start.seed])

  const finish = useCallback(() => {
    if (online || finished.current) return
    finished.current = true
    setRunning(false)
    const { me: m, opp: o } = live.current
    const myScore = shownScore(m.score)
    onFinish({
      result: m.score > o.score ? 'win' : m.score < o.score ? 'loss' : 'draw',
      score: myScore,
      oppScore: shownScore(o.score),
      bonus: 0,
      bonusLabel: `COMBO MÁX x${Math.max(1, m.bestCombo)}`,
      stats: { pairs: m.pairs, misses: m.misses, bestCombo: m.bestCombo, oppPairs: o.pairs },
    })
  }, [online, onFinish])

  // Online: o servidor é a fonte da verdade para pares, fases, placar e fim de jogo.
  useEffect(() => {
    if (!online || !room || room.status === 'waiting') return
    const s = room.state as MemoryState
    if (room.status === 'finished') {
      if (finished.current) return
      finished.current = true
      setRunning(false)
      const mine = room.result?.mine?.stats ?? {}
      onFinish(roomOutcome(room, { bonusLabel: `COMBO MÁX x${Math.max(1, mine.bestCombo ?? 1)}` }))
      return
    }
    setMe((m) => ({ ...m, score: s.score[side], pairs: s.pairs[side], combo: s.combo[side], bestCombo: s.best[side], misses: s.misses[side] }))
    setOpp({ score: s.score[oppSide], pairs: s.pairs[oppSide], combo: s.combo[oppSide] })
    setPhase((p) => {
      if (s.phase !== p) {
        push(s.phase === PHASES.length - 1 ? 'FASE FINAL' : `FASE ${s.phase + 1}`, 'white')
        playSfx('whoosh')
        setOpen([])
      }
      return s.phase
    })
    const fresh: number[] = []
    setCards((prev) => {
      const base = prev.length && Math.floor(prev[0].id / 100) === s.phase ? prev : buildPhase(start.seed, s.phase)
      return base.map((c) => {
        const owner = s.claimed[`${s.phase}:${c.sym}`]
        if (!owner) return c.owner === 'me' ? c : { ...c, owner: null }
        const key = `${s.phase}:${c.sym}`
        if (owner === oppSide && !seenOppClaims.current.has(key)) {
          fresh.push(c.id)
          if (fresh.length % 2 === 0) seenOppClaims.current.add(key)
        }
        return { ...c, owner: owner === side ? 'me' : 'opp' }
      })
    })
    if (fresh.length) {
      setOppFlash(fresh)
      window.setTimeout(() => setOppFlash([]), 700)
      push('OPONENTE ENCONTROU UM PAR!', 'red', 1000)
      playSfx('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, room])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [running])

  const remaining = running ? Math.max(0, endsAt - now) : TOTAL_MS
  useEffect(() => {
    if (running && now > 0 && remaining <= 0) finish()
  }, [running, now, remaining, finish])

  const lastTen = running && remaining <= 10_000
  useEffect(() => {
    if (lastTen) {
      push('ÚLTIMOS 10 SEGUNDOS', 'red', 1600)
      vibrate(80)
    }
  }, [lastTen, push])

  const nextPhase = useCallback(() => {
    if (phaseMisses.current === 0) push('PERFECT', 'gold')
    phaseMisses.current = 0
    setPhase((p) => {
      const n = p + 1
      if (n >= PHASES.length) {
        window.setTimeout(finish, 500)
        return p
      }
      window.setTimeout(() => {
        setCards(buildPhase(start.seed, n))
        setOpen([])
        playSfx('whoosh')
      }, 700)
      push(n === PHASES.length - 1 ? 'FASE FINAL' : `FASE ${n + 1}`, 'white')
      return n
    })
  }, [finish, push, start.seed])

  useEffect(() => {
    if (!online && running && cards.length && cards.every((c) => c.owner)) nextPhase()
  }, [online, cards, running, nextPhase])

  // Tutorial (só existe offline): o bot é didático. Começa devagar e errando — as cartas que ele
  // vira ficam à mostra por um instante, para o jogador ver o erro e o −50 — e acelera pouco.
  // Ritmo: 1ª tentativa ~5s depois do início; intervalo cai de ~5,5s para no mínimo ~3,5s.
  // Acerto: as 3 primeiras tentativas sempre erram; depois sobe aos poucos até no máximo 55%.
  useEffect(() => {
    if (!running || online) return
    let t: number
    let attempt = 0
    const loop = () => {
      const delay = Math.max(3500, 5500 - attempt * 150) + botRand() * 900
      t = window.setTimeout(() => {
        const { cards: cs, open: myOpen } = live.current
        const free = cs.filter((c) => !c.owner && !myOpen.includes(c.id))
        if (free.length >= 2) {
          const accuracy = attempt < 3 ? 0 : Math.min(0.55, 0.2 + (attempt - 3) * 0.05)
          const pick = free[Math.floor(botRand() * free.length)]
          const mate = free.find((c) => c.sym === pick.sym && c.id !== pick.id)
          const wrong = free.filter((c) => c.sym !== pick.sym)
          if (mate && botRand() < accuracy) {
            setOpp((o) => {
              const combo = o.combo + 1
              return { score: o.score + pairPoints(combo), pairs: o.pairs + 1, combo }
            })
            setCards((prev) => prev.map((c) => (c.id === pick.id || c.id === mate.id ? { ...c, owner: 'opp' } : c)))
            setOppFlash([pick.id, mate.id])
            window.setTimeout(() => setOppFlash([]), 700)
            push('OPONENTE ENCONTROU UM PAR!', 'red', 1000)
            playSfx('error')
          } else if (wrong.length) {
            const other = wrong[Math.floor(botRand() * wrong.length)]
            setOppPeek([pick.id, other.id])
            window.setTimeout(() => setOppPeek([]), 1100)
            setOpp((o) => ({ ...o, score: memoryAfterMiss(o.score), combo: 0 }))
            if (attempt < 3) push(`${start.opponent.name.split(' ')[0].toUpperCase()} ERROU · −50`, 'white', 1200)
          }
          attempt += 1
        }
        loop()
      }, attempt === 0 ? 5000 : delay)
    }
    loop()
    return () => window.clearTimeout(t)
  }, [running, online, botRand, push, start.opponent.name])

  useEffect(() => {
    if (!running) return
    if (opp.score - me.score >= 150) wasBehind.current = true
    if (wasBehind.current && me.score > opp.score) {
      wasBehind.current = false
      push('COMEBACK', 'gold')
    }
  }, [me.score, opp.score, running, push])

  const flip = (card: Card) => {
    if (!running || locked || card.owner || open.includes(card.id)) return
    playSfx('click')
    const next = [...open, card.id]
    setOpen(next)
    if (next.length < 2) return
    const [a, b] = next.map((id) => cards.find((c) => c.id === id)!)
    if (a.sym === b.sym) {
      const combo = me.combo + 1
      const pts = pairPoints(combo)
      setMe((m) => ({ ...m, score: m.score + pts, pairs: m.pairs + 1, combo, bestCombo: Math.max(m.bestCombo, combo) }))
      setCards((prev) => prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, owner: 'me' } : c)))
      setOpen([])
      playSfx('confirm')
      if (online) act({ type: 'pair', phase, sym: a.sym })
      if (combo >= 2) push(`COMBO x${Math.min(combo, 5)}`, 'gold', 800)
      if (lastTen && me.score + pts > opp.score && me.score <= opp.score) push('CLUTCH', 'gold')
    } else {
      setLocked(true)
      phaseMisses.current += 1
      setMe((m) => ({ ...m, score: memoryAfterMiss(m.score), combo: 0, misses: m.misses + 1 }))
      if (online) act({ type: 'miss' })
      vibrate(30)
      window.setTimeout(() => {
        setOpen([])
        setLocked(false)
      }, 620)
    }
  }

  // Par levado pelo oponente fecha qualquer carta minha aberta nele.
  useEffect(() => {
    setOpen((o) => o.filter((id) => !cards.find((c) => c.id === id)?.owner))
  }, [cards])

  const diff = me.score - opp.score
  const status =
    !running ? null : diff < 0 && diff >= -150 ? `VOCÊ ESTÁ A ${-diff} PONTOS` : diff < 0 ? 'ADVERSÁRIO ESTÁ NA FRENTE' : diff > 0 ? 'VOCÊ ESTÁ NA FRENTE' : 'EMPATE'
  const cols = cards.length >= 20 ? 'grid-cols-5' : cards.length >= 12 ? 'grid-cols-4' : 'grid-cols-4'
  const secs = Math.ceil(remaining / 1000)

  return (
    <GameFrame
      title={`${meta.name} · Fase ${phase + 1}/${PHASES.length}`}
      accent={meta.accent}
      onQuit={onQuit}
      top={
        <span className={cn('font-mono text-lg tabular-nums', lastTen ? 'animate-pulse text-[#8fa6ff]' : 'text-foreground')}>
          {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
        </span>
      }
    >
      <div className={cn('pointer-events-none absolute inset-0 z-0 transition-opacity duration-500', lastTen ? 'opacity-100' : 'opacity-0')} style={{ boxShadow: 'inset 0 0 120px #1647ff66' }} />
      <div className="relative z-10 flex shrink-0 items-stretch gap-2 px-3 pt-3">
        <ScoreChip label="Você" value={shownScore(me.score)} active={diff >= 0} />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">
            {me.pairs} x {opp.pairs} pares · combo x{Math.max(1, Math.min(me.combo, 5))}
          </span>
          {status && (
            <span className={cn('mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em]', diff < 0 ? 'text-[#8fa6ff]' : 'text-[#6f8cff]')}>{status}</span>
          )}
        </div>
        <ScoreChip label={start.opponent.name} value={shownScore(opp.score)} active={diff < 0} tone="opp" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-3">
        <div className={cn('grid w-full max-w-[min(100%,calc((100dvh-170px)*1.05))] gap-2 md:gap-3', cols)}>
          {cards.map((c) => {
            const peek = oppPeek.includes(c.id)
            const faceUp = !!c.owner || open.includes(c.id) || peek
            const S = SYMBOLS[c.sym]
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => flip(c)}
                disabled={!!c.owner}
                aria-label={faceUp ? 'Carta revelada' : 'Carta virada'}
                className="aspect-[3/4] [perspective:600px]"
              >
                <span
                  className={cn(
                    'relative block size-full transition-transform duration-300 [transform-style:preserve-3d]',
                    faceUp && '[transform:rotateY(180deg)]',
                    c.owner && 'opacity-60',
                    oppFlash.includes(c.id) && 'animate-pulse',
                  )}
                >
                  <span className="absolute inset-0 grid place-items-center border border-[#315dff]/30 bg-gradient-to-br from-[#1b1310] to-[#0c0807] [backface-visibility:hidden]">
                    <span className="size-1/3 rotate-45 border border-[#315dff]/40" />
                  </span>
                  <span
                    className={cn(
                      'absolute inset-0 grid place-items-center border bg-[#140f0d] [backface-visibility:hidden] [transform:rotateY(180deg)]',
                      c.owner === 'me' ? 'border-[#6f8cff]' : c.owner === 'opp' || peek ? 'border-primary' : 'border-foreground/40',
                    )}
                  >
                    <S.icon className="size-1/2" style={{ color: S.color }} strokeWidth={1.6} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <PopLayer pops={pops} />
      {!running && !finished.current && !gateOpen && <WaitingStart name={start.opponent.name} />}
      {!running && !finished.current && gateOpen && (
        <Countdown321
          onDone={() => {
            setEndsAt(online ? toLocal(start.startedAt + TOTAL_MS) : Date.now() + TOTAL_MS)
            setNow(Date.now())
            setRunning(true)
          }}
        />
      )}
    </GameFrame>
  )
}
