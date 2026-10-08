'use client'

import './bluff.css'
import { type CSSProperties, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GameProps } from '@/lib/devo/arcade/client'
import {
  BLUFF_BULLETS,
  BLUFF_RANKS,
  BLUFF_TURN_MS,
  type BluffCard,
  type BluffEvent,
  type BluffState,
  type BluffView,
  bluffBotMove,
  bluffCall,
  bluffNew,
  bluffPass,
  bluffPlay,
  bluffRevealMs,
  bluffScore,
  bluffTimeout,
  bluffView,
} from '@/lib/devo/arcade/bluff'
import { rng, type Side } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { Countdown321, GameFrame, WaitingStart, vibrate } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'

const ACCENT = '#d6334f'
const OPP_COLOR = '#d6334f'
const SUIT_NAMES = ['espadas', 'copas', 'ouros', 'paus']

const SUIT_PATHS = [
  'M50 6C50 6 10 38 10 62c0 14 10 22 22 22 8 0 14-4 16-8-1 10-4 16-10 18h24c-6-2-9-8-10-18 2 4 8 8 16 8 12 0 22-8 22-22C90 38 50 6 50 6z',
  'M50 90C20 64 8 48 8 31 8 17 19 8 31 8c9 0 16 5 19 12 3-7 10-12 19-12 12 0 23 9 23 23 0 17-12 33-42 59z',
  'M50 4 88 50 50 96 12 50z',
  'M50 8c-10 0-17 7-17 16 0 6 3 11 7 14-4-2-7-3-11-3-10 0-18 7-18 17s8 17 18 17c8 0 14-4 18-9-1 12-4 22-11 30h28c-7-8-10-18-11-30 4 5 10 9 18 9 10 0 18-7 18-17s-8-17-18-17c-4 0-7 1-11 3 4-3 7-8 7-14 0-9-7-16-17-16z',
]

const PIPS: Record<number, [number, number][]> = {
  0: [[0.5, 0.5]],
  1: [[0.5, 0.2], [0.5, 0.8]],
  2: [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8]],
  3: [[0.32, 0.2], [0.68, 0.2], [0.32, 0.8], [0.68, 0.8]],
  4: [[0.32, 0.2], [0.68, 0.2], [0.5, 0.5], [0.32, 0.8], [0.68, 0.8]],
  5: [[0.32, 0.2], [0.68, 0.2], [0.32, 0.5], [0.68, 0.5], [0.32, 0.8], [0.68, 0.8]],
  6: [[0.32, 0.2], [0.68, 0.2], [0.5, 0.35], [0.32, 0.5], [0.68, 0.5], [0.32, 0.8], [0.68, 0.8]],
  7: [[0.32, 0.2], [0.68, 0.2], [0.5, 0.35], [0.32, 0.5], [0.68, 0.5], [0.5, 0.65], [0.32, 0.8], [0.68, 0.8]],
  8: [[0.32, 0.18], [0.68, 0.18], [0.32, 0.39], [0.68, 0.39], [0.5, 0.5], [0.32, 0.61], [0.68, 0.61], [0.32, 0.82], [0.68, 0.82]],
  9: [[0.32, 0.18], [0.68, 0.18], [0.5, 0.29], [0.32, 0.39], [0.68, 0.39], [0.32, 0.61], [0.68, 0.61], [0.5, 0.71], [0.32, 0.82], [0.68, 0.82]],
}

/** Verso com a ampulheta: o tempo é a moeda do DEVO. */
const BACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 88"><defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#15174a"/><path d="M0 5h10M5 0v10" stroke="#23277a" stroke-width=".6"/></pattern><radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3a3fa8" stop-opacity=".9"/><stop offset="1" stop-color="#15174a" stop-opacity="0"/></radialGradient></defs><rect width="60" height="88" fill="url(#p)"/><rect width="60" height="88" fill="url(#g)"/><rect x="3.5" y="3.5" width="53" height="81" rx="3" fill="none" stroke="#d9b25c" stroke-width=".9"/><rect x="6" y="6" width="48" height="76" rx="2" fill="none" stroke="#d9b25c" stroke-width=".4" opacity=".7"/><circle cx="30" cy="44" r="15" fill="#0c0d30" stroke="#d9b25c" stroke-width=".9"/><path d="M23 34h14M23 54h14M24.5 34l5.5 10-5.5 10M35.5 34 30 44l5.5 10" fill="none" stroke="#d9b25c" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.5 52h7l-3.5-5z" fill="#d9b25c"/><path d="M8 8l4 4M52 8l-4 4M8 80l4-4M52 80l-4-4" stroke="#d9b25c" stroke-width=".7"/></svg>'
const BACK_URL = `url("data:image/svg+xml,${encodeURIComponent(BACK_SVG)}")`

type CallEvent = Extract<BluffEvent, { t: 'call' }>

export default function Bluff({ start, onFinish, onQuit }: GameProps) {
  const { online, room, act, toLocal } = useRoom(start, 600)
  const gateOpen = useOnlineGate(start)
  const me: Side = online ? (start.side ?? 'a') : 'a'
  const opp: Side = me === 'a' ? 'b' : 'a'
  const oppName = start.opponent.name

  const [running, setRunning] = useState(false)
  const [local, setLocal] = useState<BluffState | null>(null)
  const localRef = useRef(local)
  localRef.current = local
  const botRand = useMemo(() => rng(start.seed ^ 0x7b1ef), [start.seed])
  const [now, setNow] = useState(() => Date.now())
  const [sel, setSel] = useState<number[]>([])
  const [reveal, setReveal] = useState<CallEvent | null>(null)
  const [feed, setFeed] = useState<string[]>(['Cartas distribuídas.'])
  const seenSeq = useRef(0)
  const finished = useRef(false)

  const view: BluffView | null = online ? ((room?.state as unknown as BluffView | undefined) ?? null) : local ? bluffView(local, 'a') : null
  /** Relógio do servidor online; relógio local no treino. */
  const toClock = useCallback((ms: number) => (online ? toLocal(ms) : ms), [online, toLocal])
  const nameOf = useCallback((s: Side) => (s === me ? 'Você' : oppName), [me, oppName])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const log = useCallback((line: string) => setFeed((f) => [line, ...f].slice(0, 3)), [])

  // Reage a cada evento novo (jogada, chamada ou passe), venha de quem vier.
  const ev = view?.ev ?? null
  useEffect(() => {
    if (!ev || ev.seq <= seenSeq.current) return
    seenSeq.current = ev.seq
    if (ev.t === 'play') {
      playSfx('card')
      log(`${nameOf(ev.side)}${ev.auto ? ' (tempo esgotado)' : ''} jogou ${ev.n} × ${BLUFF_RANKS[ev.rank]}.`)
    } else if (ev.t === 'call') {
      setReveal(ev)
      playSfx('bluff-shot')
      vibrate(40)
      log(`${nameOf(ev.caller)} chamou blefe: ${ev.truth ? 'era verdade' : 'era mentira'}. ${nameOf(ev.loser)} recolheu ${ev.taken}.`)
      const verdictAt = (ev.cards.length * 0.6 + 0.95) * 1000
      const t1 = window.setTimeout(() => {
        playSfx(ev.truth ? 'bluff-true' : 'bluff-lie')
        vibrate(ev.loser === me ? [60, 40, 60] : 30)
      }, verdictAt)
      const t2 = window.setTimeout(() => setReveal(null), bluffRevealMs(ev.cards.length))
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    } else {
      log(`${nameOf(ev.side)} deixou passar.`)
    }
  }, [ev, me, nameOf, log])

  const myHand = view?.me ?? []
  const handKey = myHand.map((c) => c.id).join(',')
  useEffect(() => setSel((s) => s.filter((id) => myHand.some((c) => c.id === id))), [handKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Treino: bot e tempo do turno rodam no navegador.
  const mutateLocal = useCallback((fn: (s: BluffState) => boolean) => {
    const cur = localRef.current
    if (!cur) return false
    const next = structuredClone(cur)
    if (!fn(next)) return false
    setLocal(next)
    return true
  }, [])

  useEffect(() => {
    if (online || !local || local.winner) return
    const t = Date.now()
    if (local.turn === 'b') {
      const delay = Math.max(0, local.holdUntil - t) + 900 + botRand() * 1300
      const id = window.setTimeout(() => mutateLocal((s) => bluffBotMove(s, 'b', Date.now(), botRand)), delay)
      return () => window.clearTimeout(id)
    }
    const due = Math.max(local.turnAt, local.holdUntil) + BLUFF_TURN_MS + 1600 - t
    const id = window.setTimeout(() => mutateLocal((s) => bluffTimeout(s, Date.now())), Math.max(0, due))
    return () => window.clearTimeout(id)
  }, [online, local, botRand, mutateLocal])

  // Fim da partida: espera a revelação terminar antes de mostrar o resultado.
  const winner = view?.winner ?? null
  const roomDone = online && room?.status === 'finished'
  useEffect(() => {
    if (finished.current) return
    if (online ? !roomDone : winner === null) return
    finished.current = true
    const lastCall = ev?.t === 'call' ? ev : null
    const wait = lastCall ? bluffRevealMs(lastCall.cards.length) + 400 : 1800
    const id = window.setTimeout(() => {
      if (online && room) {
        onFinish(roomOutcome(room, { bonusLabel: 'BLEFES PEGOS' }))
        return
      }
      const s = localRef.current!
      const mine = bluffScore(s, 'a')
      const theirs = bluffScore(s, 'b')
      onFinish({
        result: s.winner === 'a' ? 'win' : 'loss',
        score: mine.score,
        oppScore: theirs.score,
        bonus: s.hits.a * 150,
        bonusLabel: `BLEFES PEGOS x${s.hits.a}`,
        stats: mine.stats,
      })
    }, wait)
    return () => window.clearTimeout(id)
  }, [online, roomDone, winner, ev, room, onFinish])

  const cancelled = online && room?.status === 'cancelled'
  useEffect(() => {
    if (!cancelled || finished.current || !room) return
    finished.current = true
    onFinish(roomOutcome(room))
  }, [cancelled, room, onFinish])

  const holdLocal = view ? toClock(view.holdUntil) : 0
  const deadline = view ? toClock(Math.max(view.turnAt, view.holdUntil)) + BLUFF_TURN_MS : 0
  const left = Math.max(0, deadline - now)
  const live = !!view && running && view.winner === null
  const myTurn = live && view.turn === me && now >= holdLocal && !reveal
  const oppTurn = live && view.turn === opp
  const myBul = view?.bul[me] ?? BLUFF_BULLETS
  const pending = !!view?.last && view.last.side === opp && view.oppN === 0
  const canCall = myTurn && !!view?.last && view.last.side === opp && myBul > 0

  const lastTick = useRef(0)
  useEffect(() => {
    if (!myTurn) return
    const s = Math.ceil(left / 1000)
    if (s <= 5 && s > 0 && s !== lastTick.current) {
      lastTick.current = s
      playSfx('chess-tick')
    }
  }, [myTurn, left])

  const play = () => {
    if (!myTurn || pending || !sel.length || !view) return
    const ids = sel
    setSel([])
    playSfx('whoosh')
    if (online) act({ type: 'bplay', ids })
    else mutateLocal((s) => bluffPlay(s, 'a', ids, Date.now()))
  }
  const call = () => {
    if (!canCall) return
    if (online) act({ type: 'bcall' })
    else mutateLocal((s) => bluffCall(s, 'a', Date.now()))
  }
  const pass = () => {
    if (!myTurn || !pending) return
    if (online) act({ type: 'bpass' })
    else mutateLocal((s) => bluffPass(s, 'a', Date.now()))
  }
  const toggle = (id: number) => {
    if (!myTurn || pending) return
    playSfx('card-select')
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]))
  }
  const pickRank = () => {
    if (!myTurn || pending || !view) return
    playSfx('card-select')
    setSel(myHand.filter((c) => c.r === view.rk).slice(0, 4).map((c) => c.id))
  }

  const beginLocal = () => {
    setRunning(true)
    if (!online) setLocal(bluffNew(start.seed, Date.now()))
  }

  const rank = BLUFF_RANKS[view?.rk ?? 0]
  const last = view?.last ?? null

  let msg = '…'
  let mine = false
  if (view?.winner != null) msg = 'Fim de jogo.'
  else if (view && myTurn && last && last.side === opp) {
    mine = true
    msg = pending
      ? `${oppName} jogou a última carta. ${myBul > 0 ? 'Chame blefe agora, ou ele vence.' : 'Sem balas, você só pode deixá-lo vencer.'}`
      : `${oppName} diz que jogou ${last.n} × ${BLUFF_RANKS[last.rank]}. ${myBul > 0 ? `Acredite e jogue ${rank}, ou chame blefe.` : `Você está sem balas. Jogue ${rank}.`}`
  } else if (view && myTurn) {
    mine = true
    msg = `Sua vez. Jogue cartas como ${rank} (mentir vale).`
  } else if (oppTurn) msg = `${oppName} está pensando…`

  return (
    <GameFrame
      title="Blefe"
      accent={ACCENT}
      onQuit={onQuit}
      className="bf"
      top={<span className="bf-cap hidden sm:inline">Duvide ou acredite</span>}
    >
      <div className="bf relative z-10 flex min-h-0 flex-1 flex-col" style={{ '--bk': BACK_URL, background: 'transparent' } as CSSProperties}>
        <Stage view={view} me={me} oppName={oppName} oppTurn={oppTurn} rank={rank} />

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-3">
          <p className={cn('bf-msg', mine && 'me')} aria-live="polite">
            {msg}
          </p>
          <ul className="bf-feed" aria-label="Últimas jogadas">
            {feed.map((f, i) => (
              <li key={`${f}-${i}`}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="bf-player mx-auto mt-1 w-full max-w-3xl">
          <div className="bf-pl-top">
            <div className="l">
              <Cylinder n={myBul} size={52} />
              <div className="t">
                <span className="bf-cap">Suas balas</span>
                <b>
                  {myBul} / {BLUFF_BULLETS}
                </b>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('font-mono text-[11px] tabular-nums tracking-[0.15em]', myTurn && left < 6000 ? 'text-[#ff8a90]' : 'text-[#8d8ba8]')}>
                {live ? `${myTurn ? 'Sua vez' : `Vez de ${oppName}`} · ${Math.ceil(left / 1000)}s` : ''}
              </span>
              <button type="button" className="bf-mini" onClick={pickRank} disabled={!myTurn || pending}>
                Marcar os {rank}
              </button>
            </div>
          </div>
          <div className="bf-timer" aria-hidden="true">
            <i
              style={{
                width: live ? `${Math.min(100, (left / BLUFF_TURN_MS) * 100)}%` : '0%',
                background: left < 6000 ? OPP_COLOR : myTurn ? '#7286f8' : '#5c5b78',
              }}
            />
          </div>

          <Hand cards={myHand} sel={sel} active={myTurn && !pending} rank={view?.rk ?? 0} onToggle={toggle} />

          <div className="bf-acts">
            {pending && myTurn ? (
              <button type="button" className="bf-btn ghost" onClick={pass}>
                Deixar vencer
              </button>
            ) : (
              <button type="button" className="bf-btn" onClick={play} disabled={!myTurn || !sel.length}>
                {sel.length ? `Jogar ${sel.length} como ${rank}` : 'Escolha 1 a 4 cartas'}
              </button>
            )}
            {canCall ? (
              <button type="button" className="bf-btn bad" onClick={call}>
                É blefe! <small>({myBul})</small>
              </button>
            ) : myTurn && last?.side === opp && myBul === 0 ? (
              <button type="button" className="bf-btn bad" disabled>
                Sem balas
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {reveal && <Reveal ev={reveal} nameOf={nameOf} />}

      {!running && !finished.current && !gateOpen && <WaitingStart name={oppName} />}
      {!running && !finished.current && gateOpen && <Countdown321 onDone={beginLocal} />}
    </GameFrame>
  )
}

function Stage({ view, me, oppName, oppTurn, rank }: { view: BluffView | null; me: Side; oppName: string; oppTurn: boolean; rank: string }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 })
  const pileN = view?.pileN ?? 0
  const show = Math.min(12, pileN)
  const oppN = view?.oppN ?? 26
  const last = view?.last ?? null

  useLayoutEffect(() => {
    const st = stageRef.current
    if (!st) return
    const measure = () => {
      const m = markRef.current
      if (!m) return
      const s = st.getBoundingClientRect()
      const r = m.getBoundingClientRect()
      setPos({ x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, w: s.width })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    return () => ro.disconnect()
  }, [])

  const narrow = pos.w < 520
  const off = narrow ? Math.min(120, pos.w * 0.32) : 170

  return (
    <div ref={stageRef} className="bf-stage">
      <div className="bf-scene" aria-hidden="true">
        <div className="bf-tbl">
          <div className="bf-tshadow" />
          <div className="bf-felt" />
          <div className="bf-inlay" />
          <div className="bf-pilewrap">
            {show > 0 ? <div className="bf-pshadow" /> : <div className="bf-empty" />}
            {Array.from({ length: show }, (_, i) => {
              const r = ((i * 53 + 11) % 37) - 18
              const dx = ((i * 29 + 5) % 13) - 6
              const dy = ((i * 17 + 3) % 11) - 5
              return (
                <div key={i} className={cn('bf-pc', i === show - 1 && 'new')} style={{ transform: `translate3d(${dx}px, ${dy}px, ${i * 1.6 + 1}px) rotate(${r}deg)` }}>
                  <div key={i === show - 1 ? pileN : undefined} className="bf-cback" />
                </div>
              )
            })}
            <div ref={markRef} className="bf-pmark" />
          </div>
        </div>
      </div>
      <div className="bf-spot" aria-hidden="true" />

      <div className="bf-seats">
        <div className={cn('bf-seat', oppTurn && 'turn')}>
          <div className="bf-av" style={{ '--c': OPP_COLOR } as CSSProperties} aria-hidden="true">
            {oppName.charAt(0).toUpperCase()}
          </div>
          <div className="bf-inf">
            <span className="bf-nm">{oppName}</span>
            <div className="bf-ro">
              <Cylinder n={view?.bul[me === 'a' ? 'b' : 'a'] ?? BLUFF_BULLETS} size={30} />
              <span className="bf-ct">
                <b>{oppN}</b> cartas
              </span>
              <span className="bf-fan hidden sm:flex" aria-hidden="true">
                {Array.from({ length: Math.min(oppN, 8) }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </div>
            <span className="bf-tag">
              {oppTurn ? (
                <>
                  pensando<span className="bf-dots" />
                </>
              ) : oppN <= 3 ? (
                'quase lá'
              ) : (
                ''
              )}
            </span>
          </div>
        </div>
      </div>

      {pos.w > 0 && (
        <>
          <div className="bf-coin" style={{ left: pos.x - off, top: pos.y - 6 }} aria-label={`Valor da vez: ${rank}`}>
            <b key={rank}>{rank}</b>
          </div>
          <div className="bf-coin-l" style={{ left: pos.x - off, top: pos.y - 6 }} aria-hidden="true">
            valor da vez
          </div>
          {pileN > 0 && (
            <div className="bf-pcnt" style={{ left: pos.x + (narrow ? 34 : 44), top: pos.y - 8 }}>
              {pileN} {pileN === 1 ? 'carta' : 'cartas'}
            </div>
          )}
          <div className="bf-say" style={{ left: pos.x, top: pos.y + (narrow ? 42 : 50) }}>
            <span className="bf-cap">{last ? 'Última jogada' : 'Pilha vazia'}</span>
            <span className="big">
              {last ? (
                <>
                  {last.side === me ? 'Você' : oppName} jogou{' '}
                  <em>
                    {last.n} × {BLUFF_RANKS[last.rank]}
                  </em>
                </>
              ) : (
                'Ninguém a desafiar'
              )}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function SuitIcon({ s, className, style }: { s: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden="true">
      <path d={SUIT_PATHS[s]} />
    </svg>
  )
}

function CardFace({ c }: { c: BluffCard }) {
  const red = c.s === 1 || c.s === 2
  const R = BLUFF_RANKS[c.r]
  const ixStyle = { fontSize: R === '10' ? '.82em' : '1em' }
  return (
    <div className={cn('bf-cf', red && 'red')}>
      <div className="ix tl" style={ixStyle}>
        <b>{R}</b>
        <SuitIcon s={c.s} />
      </div>
      <div className="ix br" style={ixStyle}>
        <b>{R}</b>
        <SuitIcon s={c.s} />
      </div>
      {c.r >= 10 ? (
        <div className="fcd">
          <i>{R}</i>
          <SuitIcon s={c.s} className="a" />
          <SuitIcon s={c.s} className="b" />
        </div>
      ) : (
        PIPS[c.r].map(([x, y], i) => <SuitIcon key={i} s={c.s} className={cn('pip', c.r === 0 && 'big', y > 0.5 && 'f')} style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />)
      )}
      <div className="shine" />
    </div>
  )
}

function Cylinder({ n, size, mark }: { n: number; size: number; mark?: { idx: number; name: 'spent' | 'ret' } }) {
  const uid = useId().replace(/:/g, '')
  const chambers = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 90) * Math.PI) / 180
    return { x: Math.cos(a) * 29, y: Math.sin(a) * 29, slot: i % 2 === 0, j: i / 2 }
  })
  const round = (x: number, y: number, cls?: string) => (
    <g className={cls}>
      <circle cx={x} cy={y} r="10" fill={`url(#b${uid})`} stroke="#6f5a22" strokeWidth="1" />
      <circle cx={x} cy={y} r="5.6" fill={`url(#c${uid})`} />
    </g>
  )
  return (
    <svg className="bf-cyl" width={size} height={size} viewBox="-52 -52 104 104" role="img" aria-label={`${n} de ${BLUFF_BULLETS} balas`}>
      <defs>
        <radialGradient id={`b${uid}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f6e3a0" />
          <stop offset=".55" stopColor="#c9a24b" />
          <stop offset="1" stopColor="#7a5f1e" />
        </radialGradient>
        <radialGradient id={`c${uid}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#e6a174" />
          <stop offset=".6" stopColor="#b4623a" />
          <stop offset="1" stopColor="#6a2f18" />
        </radialGradient>
        <radialGradient id={`g${uid}`} cx="40%" cy="30%" r="85%">
          <stop offset="0" stopColor="#4a4a6c" />
          <stop offset=".6" stopColor="#23233c" />
          <stop offset="1" stopColor="#0e0e1e" />
        </radialGradient>
      </defs>
      <g className="cg">
        <circle r="50" fill={`url(#g${uid})`} stroke="#5a5880" strokeWidth="2.5" />
        <circle r="42" fill="none" stroke="#2c2c4a" strokeWidth="1.5" />
        {chambers.map(({ x, y, slot, j }, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="12.5" fill="#05050b" stroke="#3a3858" strokeWidth="1.5" />
            {slot &&
              (j < n ? (
                round(x, y, mark?.idx === j ? mark.name : undefined)
              ) : mark?.idx === j && mark.name === 'spent' ? (
                <>
                  {round(x, y, 'spent')}
                  <circle className="puff" cx={x} cy={y} r="12" fill="#8d8ba8" />
                </>
              ) : (
                <circle cx={x} cy={y} r="8" fill="none" stroke="#2a2850" strokeWidth="1" strokeDasharray="2 3" />
              ))}
          </g>
        ))}
        <circle r="9" fill="#2a2850" stroke="#5a5880" strokeWidth="1.5" />
        <circle r="3" fill="#07070d" />
      </g>
    </svg>
  )
}

function Hand({ cards, sel, active, rank, onToggle }: { cards: BluffCard[]; sel: number[]; active: boolean; rank: number; onToggle: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(340)
  const [deal, setDeal] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dealt = cards.length > 0
  useEffect(() => {
    if (!dealt) return
    const id = window.setTimeout(() => setDeal(false), 1800)
    return () => window.clearTimeout(id)
  }, [dealt])

  const cw = W < 400 ? 52 : W >= 660 ? 70 : 60
  const ch = Math.round(cw * 1.46)
  const n = cards.length
  const rows = Math.max(1, Math.ceil(n / 13))
  const per = Math.max(1, Math.ceil(n / rows))
  const rowGap = Math.round(ch * 0.42)

  return (
    <div
      ref={ref}
      className={cn('bf-hand', deal && 'deal')}
      style={{ height: ch + (rows - 1) * rowGap + 12, '--cw': `${cw}px`, '--ch': `${ch}px` } as CSSProperties}
      role="group"
      aria-label={`Sua mão: ${n} cartas`}
    >
      {Array.from({ length: rows }, (_, r) => {
        const chunk = cards.slice(r * per, (r + 1) * per)
        const k = chunk.length
        const sp = k > 1 ? Math.min(cw * 0.72, (W - cw - 14) / (k - 1)) : 0
        return chunk.map((c, i) => {
          const t = k > 1 ? (i - (k - 1) / 2) / ((k - 1) / 2) : 0
          const x = (i - (k - 1) / 2) * sp
          const y = t * t * (k > 8 ? 14 : 9) - (rows - 1 - r) * rowGap
          const rot = t * (k > 8 ? 7 : 5)
          const picked = sel.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              disabled={!active}
              aria-pressed={picked}
              aria-label={`${BLUFF_RANKS[c.r]} de ${SUIT_NAMES[c.s]}`}
              className={cn('bf-pcard', picked && 'sel', c.r === rank && 'match')}
              style={{ '--x': `${x.toFixed(1)}px`, '--y': `${y.toFixed(1)}px`, '--r': `${rot.toFixed(1)}deg`, '--z': r * 100 + i, '--i': r * per + i } as CSSProperties}
            >
              <CardFace c={c} />
            </button>
          )
        })
      })}
    </div>
  )
}

function Reveal({ ev, nameOf }: { ev: CallEvent; nameOf: (s: Side) => string }) {
  const n = ev.cards.length
  const vd = `${n * 0.6 + 0.95}s`
  const mark = ev.bullet === 'lost' ? ({ idx: ev.left, name: 'spent' } as const) : ({ idx: ev.left - 1, name: 'ret' } as const)
  return (
    <div className={cn('bf bf-ov', !ev.truth && 'lie')} style={{ '--vd': vd, '--bk': BACK_URL } as CSSProperties} role="alert">
      <div className="bf-box">
        <span className="bf-cap">
          {nameOf(ev.liar)} jogou {n} × {BLUFF_RANKS[ev.rank]} · {nameOf(ev.caller)} duvidou
        </span>
        <div className={cn('bf-rv', !ev.truth && 'sh')}>
          {ev.cards.map((c, i) => (
            <div key={c.id} className="bf-rc" style={{ '--i': i } as CSSProperties}>
              <div className="fr">
                <div className={c.r === ev.rank ? 'ok' : 'lie'} style={{ position: 'absolute', inset: 0 }}>
                  <CardFace c={c} />
                </div>
              </div>
              <div className="bk">
                <div className="bf-cback" />
              </div>
            </div>
          ))}
        </div>
        <div className={cn('bf-verdict', ev.truth ? 'true' : 'lie')}>{ev.truth ? 'Era verdade' : 'Blefe!'}</div>
        <div className="bf-late bf-cylw" style={{ animationDelay: `calc(${vd} + .15s)` }}>
          <Cylinder n={ev.left} size={84} mark={mark} />
          {ev.bullet === 'back' ? (
            <span className="bf-ev back">Bala devolvida a {nameOf(ev.caller)}</span>
          ) : (
            <span className="bf-ev lost">
              Bala perdida · {nameOf(ev.caller)} fica com {ev.left}
            </span>
          )}
        </div>
        <div className="bf-late" style={{ animationDelay: `calc(${vd} + .45s)` }}>
          {nameOf(ev.loser)} recolhe {ev.taken} {ev.taken === 1 ? 'carta' : 'cartas'}
          {ev.burned > 0 && ` · ${ev.burned} queimadas`}
        </div>
      </div>
    </div>
  )
}
