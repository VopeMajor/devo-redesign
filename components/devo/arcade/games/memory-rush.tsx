'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { GameProps } from '@/lib/devo/arcade/client'
import type { MemoryState } from '@/lib/devo/arcade/client'
import { GAMES, MEMORY_PHASES, memoryAfterMiss, memoryDeck, memoryPairPoints, rng } from '@/lib/devo/arcade/games'
import { usePops, vibrate, type PopTone } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import { PartidaV2, Sincronizando, mmss } from '../v2-partida'

/*
 * Memory Rush no visual do v2 (protótipo aprovado: docs/redesign/v2/kit3/os-memory.js, estilo em components/v2/os.css).
 * Mesa de feltro, cartas e 13 símbolos em pixel, placar de bronze, combo em losangos, faíscas no par, tremida no
 * erro e moldura de alerta nos últimos 10 segundos. Fases, pontos, teto, combo e tempo são os do jogo.
 * Leve: o relógio só redesenha quando o segundo muda e cada carta só troca de classe.
 */

const ARTE = '/v2/art/os/memory'
const PHASES = MEMORY_PHASES
const TOTAL_MS = 120_000
const meta = GAMES['memory-rush']
/** colunas × linhas de cada tamanho de mesa (cartas na mesa → grade) */
const GRADE: Record<number, [number, number]> = { 20: [5, 4], 16: [4, 4], 12: [4, 3], 8: [4, 2] }
/** tons dos avisos do HUD → classes do protótipo */
const TOM: Record<PopTone, string> = { gold: '', amethyst: 'violeta', red: 'perigo', white: 'neutro' }

type Card = { id: number; sym: number; owner: 'me' | 'opp' | null }

function buildPhase(seed: number, phase: number): Card[] {
  return memoryDeck(seed, phase).map((c) => ({ ...c, owner: null }))
}

const pairPoints = memoryPairPoints

/** O número do HUD é o mesmo que o servidor grava: limitado a 0..maxScore. */
const shownScore = (n: number) => Math.max(0, Math.min(meta.maxScore, n))

export default function MemoryRush({ start, onFinish, onQuit }: GameProps) {
  const { online, room, act, toLocal, lost } = useRoom(start, 450)
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
  /** Tempo restante arredondado para o segundo de cima: o relógio só mostra segundos, então a tela só redesenha 1x por segundo. */
  const [left, setLeft] = useState(TOTAL_MS)
  const [oppFlash, setOppFlash] = useState<number[]>([])
  /** Tutorial: cartas que o bot virou e errou ficam à mostra por um instante (didático). */
  const [oppPeek, setOppPeek] = useState<number[]>([])
  const { pops, push } = usePops()
  /** Cartas do par errado: tremem em vermelho enquanto ficam abertas. */
  const [wrong, setWrong] = useState<number[]>([])
  /** Faíscas de um par recém-feito: dourado é seu, violeta é do oponente. */
  const [sparks, setSparks] = useState<{ ids: number[]; tom: 'ouro' | 'violeta'; k: number } | null>(null)
  const [shake, setShake] = useState(false)
  const spark = useCallback((ids: number[], tom: 'ouro' | 'violeta') => {
    const k = Date.now() + Math.random()
    setSparks({ ids, tom, k })
    window.setTimeout(() => setSparks((x) => (x?.k === k ? null : x)), 480)
  }, [])
  const phaseMisses = useRef(0)
  const wasBehind = useRef(false)
  const finished = useRef(false)
  const live = useRef({ cards, me, opp, open, phase })
  live.current = { cards, me, opp, open, phase }
  /** `onFinish` muda de identidade a cada render da Sala; pela ref, `finish` e `nextPhase` ficam estáveis. */
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  /** Treino: troca de fase em andamento (os 700 ms em que o tabuleiro ainda está todo tomado). */
  const advancing = useRef(false)
  /** Online: pares que eu mandei e o servidor ainda não respondeu (a carta fica minha enquanto isso). */
  const pendingPairs = useRef(new Set<string>())
  const gone = useRef(false)
  useEffect(() => {
    gone.current = false
    return () => {
      gone.current = true
    }
  }, [])

  const botRand = useMemo(() => rng(start.seed ^ 0x9e3779b9), [start.seed])

  const finish = useCallback(() => {
    // Depois de sair da partida, nenhum temporizador atrasado pode gravar o treino.
    if (online || finished.current || gone.current) return
    finished.current = true
    setRunning(false)
    const { me: m, opp: o } = live.current
    const myScore = shownScore(m.score)
    onFinishRef.current({
      result: m.score > o.score ? 'win' : m.score < o.score ? 'loss' : 'draw',
      score: myScore,
      oppScore: shownScore(o.score),
      bonus: 0,
      bonusLabel: `COMBO MÁX x${Math.max(1, m.bestCombo)}`,
      stats: { pairs: m.pairs, misses: m.misses, bestCombo: m.bestCombo, oppPairs: o.pairs },
    })
  }, [online])

  // Online: o servidor é a fonte da verdade para pares, fases, placar e fim de jogo.
  useEffect(() => {
    if (!online || !room || room.status === 'waiting') return
    const s = room.state as MemoryState
    if (room.status === 'finished') {
      if (finished.current) return
      finished.current = true
      setRunning(false)
      const mine = room.result?.mine?.stats ?? {}
      onFinishRef.current(roomOutcome(room, { bonusLabel: `COMBO MÁX x${Math.max(1, mine.bestCombo ?? 1)}` }))
      return
    }
    // Cada consulta (a cada ~0,5s) devolvia objetos novos e redesenhava o tabuleiro inteiro mesmo sem mudança.
    setMe((m) =>
      m.score === s.score[side] && m.pairs === s.pairs[side] && m.combo === s.combo[side] && m.bestCombo === s.best[side] && m.misses === s.misses[side]
        ? m
        : { ...m, score: s.score[side], pairs: s.pairs[side], combo: s.combo[side], bestCombo: s.best[side], misses: s.misses[side] },
    )
    setOpp((o) =>
      o.score === s.score[oppSide] && o.pairs === s.pairs[oppSide] && o.combo === s.combo[oppSide]
        ? o
        : { score: s.score[oppSide], pairs: s.pairs[oppSide], combo: s.combo[oppSide] },
    )
    // A diferença é calculada fora dos atualizadores de estado (o React pode rodá-los depois, ou duas
    // vezes): antes o aviso "oponente encontrou um par" quase nunca saía.
    if (s.phase !== live.current.phase) {
      push(s.phase === PHASES.length - 1 ? 'Fase final' : `Fase ${s.phase + 1}`, 'white')
      playSfx('whoosh')
      setOpen([])
      setPhase(s.phase)
      live.current.phase = s.phase
    }
    /** Aplica o estado do servidor às cartas, sem efeitos colaterais (pode rodar dentro do atualizador). */
    const reconcile = (prev: Card[]) => {
      const base = prev.length && Math.floor(prev[0].id / 100) === s.phase ? prev : buildPhase(start.seed, s.phase)
      let changed = base !== prev
      const fresh: number[] = []
      const freshKeys = new Set<string>()
      const next = base.map((c) => {
        const key = `${s.phase}:${c.sym}`
        const owner = s.claimed[key]
        if (!owner) {
          // Par marcado como meu que o servidor não confirmou (e já respondeu): volta a ficar livre.
          if (c.owner === null || (c.owner === 'me' && pendingPairs.current.has(key))) return c
          changed = true
          return { ...c, owner: null }
        }
        if (owner === oppSide && (!seenOppClaims.current.has(key) || freshKeys.has(key))) {
          fresh.push(c.id)
          freshKeys.add(key)
        }
        const mine: Card['owner'] = owner === side ? 'me' : 'opp'
        if (c.owner === mine) return c
        changed = true
        return { ...c, owner: mine }
      })
      return { next: changed ? next : prev, fresh, freshKeys }
    }
    const { fresh, freshKeys } = reconcile(live.current.cards)
    freshKeys.forEach((k) => seenOppClaims.current.add(k))
    setCards((cur) => reconcile(cur).next)
    if (fresh.length) {
      setOppFlash(fresh)
      window.setTimeout(() => setOppFlash([]), 700)
      spark(fresh, 'violeta')
      push('Oponente encontrou um par!', 'amethyst', 1000)
      playSfx('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, room])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setLeft(Math.ceil(Math.max(0, endsAt - Date.now()) / 1000) * 1000), 100)
    return () => window.clearInterval(id)
  }, [running, endsAt])

  const remaining = running ? left : TOTAL_MS
  useEffect(() => {
    if (running && remaining <= 0) finish()
  }, [running, remaining, finish])

  const lastTen = running && remaining <= 10_000
  useEffect(() => {
    if (lastTen) {
      push('Últimos 10 segundos', 'red', 1600)
      vibrate(80)
    }
  }, [lastTen, push])

  // Treino: o tabuleiro fica todo tomado por 700 ms antes da fase nova; `advancing` impede que o efeito
  // abaixo, rodando de novo nesse intervalo, pule uma fase. Os efeitos ficam fora do atualizador.
  const nextPhase = useCallback(() => {
    if (advancing.current) return
    advancing.current = true
    if (phaseMisses.current === 0) push('Perfect', 'gold')
    phaseMisses.current = 0
    const n = live.current.phase + 1
    if (n >= PHASES.length) {
      window.setTimeout(finish, 500)
      return
    }
    setPhase(n)
    live.current.phase = n
    push(n === PHASES.length - 1 ? 'Fase final' : `Fase ${n + 1}`, 'white')
    window.setTimeout(() => {
      setCards(buildPhase(start.seed, n))
      setOpen([])
      playSfx('whoosh')
      advancing.current = false
    }, 700)
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
          const wrongs = free.filter((c) => c.sym !== pick.sym)
          if (mate && botRand() < accuracy) {
            setOpp((o) => {
              const combo = o.combo + 1
              return { score: o.score + pairPoints(combo), pairs: o.pairs + 1, combo }
            })
            setCards((prev) => prev.map((c) => (c.id === pick.id || c.id === mate.id ? { ...c, owner: 'opp' } : c)))
            setOppFlash([pick.id, mate.id])
            window.setTimeout(() => setOppFlash([]), 700)
            spark([pick.id, mate.id], 'violeta')
            push('Oponente encontrou um par!', 'amethyst', 1000)
            playSfx('error')
          } else if (wrongs.length) {
            const other = wrongs[Math.floor(botRand() * wrongs.length)]
            setOppPeek([pick.id, other.id])
            window.setTimeout(() => setOppPeek([]), 1100)
            setOpp((o) => ({ ...o, score: memoryAfterMiss(o.score), combo: 0 }))
            if (attempt < 3) push(`${start.opponent.name.split(' ')[0]} errou · −50`, 'white', 1200)
          }
          attempt += 1
        }
        loop()
      }, attempt === 0 ? 5000 : delay)
    }
    loop()
    return () => window.clearTimeout(t)
  }, [running, online, botRand, push, spark, start.opponent.name])

  useEffect(() => {
    if (!running) return
    if (opp.score - me.score >= 150) wasBehind.current = true
    if (wasBehind.current && me.score > opp.score) {
      wasBehind.current = false
      push('Comeback', 'gold')
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
      spark([a.id, b.id], 'ouro')
      playSfx('confirm')
      if (online) {
        // A carta fica minha até o servidor responder; se ele não confirmar o par, a próxima leitura
        // da sala devolve as cartas (antes elas ficavam roxas para sempre).
        const key = `${phase}:${a.sym}`
        pendingPairs.current.add(key)
        act({ type: 'pair', phase, sym: a.sym }).finally(() => pendingPairs.current.delete(key))
      }
      if (combo >= 2) push(`Combo x${Math.min(combo, 5)}`, 'gold', 800)
      if (lastTen && me.score + pts > opp.score && me.score <= opp.score) push('Clutch', 'gold')
    } else {
      setLocked(true)
      phaseMisses.current += 1
      setMe((m) => ({ ...m, score: memoryAfterMiss(m.score), combo: 0, misses: m.misses + 1 }))
      if (online) act({ type: 'miss' })
      vibrate(30)
      setWrong([a.id, b.id])
      setShake(true)
      window.setTimeout(() => setShake(false), 220)
      window.setTimeout(() => {
        setOpen([])
        setWrong([])
        setLocked(false)
      }, 620)
    }
  }

  // Par levado pelo oponente fecha qualquer carta minha aberta nele.
  useEffect(() => {
    setOpen((o) => (o.some((id) => cards.find((c) => c.id === id)?.owner) ? o.filter((id) => !cards.find((c) => c.id === id)?.owner) : o))
  }, [cards])

  const diff = me.score - opp.score
  const linha = diff < 0 && diff >= -150 ? `Você está a ${-diff} pontos` : diff < 0 ? 'Adversário está na frente' : diff > 0 ? 'Você está na frente' : 'Empate'
  const linhaTom = diff > 0 ? 'lid' : diff < 0 ? (lastTen ? 'perigo' : 'atras') : undefined
  const [cols, rows] = GRADE[cards.length] ?? [4, Math.ceil(cards.length / 4)]
  /** a grade entra de novo (cartas sendo dadas) a cada fase */
  const deckPhase = cards.length ? Math.floor(cards[0].id / 100) : phase

  return (
    <PartidaV2
      className={['mr', shake && 'treme', lastTen && 'ultimos'].filter(Boolean).join(' ')}
      label={meta.name}
      onQuit={onQuit}
      confirmQuit={online && room?.status !== 'finished' && room?.status !== 'cancelled'}
      connLost={lost}
    >
      {({ sair, chat }) => (
        <>
          <img className="mr-fundo" src={`${ARTE}/mesa.png`} alt="" />
          <header className="mr-topo">
            <button type="button" className="chanfro mr-sair" aria-label="Desistir e sair" onClick={sair}>
              ×
            </button>
            <div className={diff > 0 ? 'mr-pl eu lid' : 'mr-pl eu'}>
              <small>Você</small>
              <b>{shownScore(me.score)}</b>
            </div>
            <div className="mr-meio">
              <b role="timer" aria-label="Tempo restante">
                {mmss(remaining)}
              </b>
              <small>
                {phase === PHASES.length - 1 ? 'Fase final' : `Fase ${phase + 1}/${PHASES.length}`} · {PHASES[phase]} pares
              </small>
            </div>
            <div className={diff < 0 ? 'mr-pl op lid' : 'mr-pl op'}>
              <small>{start.opponent.name.split(' ')[0]}</small>
              <b>{shownScore(opp.score)}</b>
            </div>
          </header>
          <div className="mr-status">
            <span aria-label={`${me.pairs} a ${opp.pairs} pares`}>
              {me.pairs} <u>×</u> {opp.pairs}
            </span>
            <span className="mr-combo" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} className={i < Math.min(me.combo, 5) ? 'on' : undefined} />
              ))}
            </span>
            <em className={linhaTom}>{linha}</em>
            {chat}
          </div>
          <div className="mr-area">
            <div key={deckPhase} className="mr-grade entra" style={{ ['--c' as string]: cols, ['--r' as string]: rows }}>
              {cards.map((c, i) => {
                const peek = oppPeek.includes(c.id)
                const aberta = open.includes(c.id)
                const faceUp = !!c.owner || aberta || peek
                const cls = [
                  'mr-c',
                  aberta && !c.owner && 'aberta',
                  c.owner === 'me' && 'minha',
                  c.owner === 'opp' && 'dele',
                  oppFlash.includes(c.id) && 'chega',
                  peek && !c.owner && 'espia',
                  wrong.includes(c.id) && 'errada',
                ]
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={cls.filter(Boolean).join(' ')}
                    onClick={() => flip(c)}
                    disabled={!!c.owner}
                    aria-label={faceUp ? 'Carta revelada' : 'Carta virada'}
                    style={{ ['--i' as string]: Math.min(i, 20) }}
                  >
                    <img className="v" src={`${ARTE}/verso.png`} alt="" />
                    <span className="f">
                      <img src={`${ARTE}/frente.png`} alt="" />
                      <img className="s" src={`${ARTE}/s${c.sym}.png`} alt="" />
                    </span>
                    {sparks?.ids.includes(c.id) && (
                      <i key={sparks.k} className={`mr-fa ${sparks.tom}`} aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                          <u key={k} style={{ ['--a' as string]: `${k * 45}deg` }} />
                        ))}
                      </i>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mr-pops" aria-live="polite">
            {pops.map((p) => (
              <p key={p.id} className={TOM[p.tone] ? `mr-pop ${TOM[p.tone]}` : 'mr-pop'}>
                {p.text}
              </p>
            ))}
          </div>
          {!running && !finished.current && !gateOpen && <Sincronizando nome={start.opponent.name} />}
          {!running && !finished.current && gateOpen && (
            <Contagem
              onDone={() => {
                const ends = online ? toLocal(start.startedAt + TOTAL_MS) : Date.now() + TOTAL_MS
                setEndsAt(ends)
                setLeft(Math.ceil(Math.max(0, ends - Date.now()) / 1000) * 1000)
                setRunning(true)
              }}
            />
          )}
        </>
      )}
    </PartidaV2>
  )
}

/** 3 · 2 · 1 · JÁ em dígitos grandes de bronze sobre a mesa. */
function Contagem({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = [1, 2, 3].map((i) => window.setTimeout(() => setN(3 - i), i * 650))
    t.push(window.setTimeout(() => done.current(), 3 * 650 + 400))
    return () => t.forEach(clearTimeout)
  }, [])
  return (
    <div className="mr-conta" role="status" aria-label={n ? String(n) : 'Já'}>
      <b key={n}>{n || 'JÁ'}</b>
    </div>
  )
}
