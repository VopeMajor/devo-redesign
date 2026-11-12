'use client'

import './bluff-v2.css'
import { type CSSProperties, type ReactNode, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMuted } from '@/components/devo/hooks'
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
import { playSfx, setMuted, unlockAudio } from '@/lib/devo/audio'
import { type PopTone, usePops, vibrate } from '../game-hud'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import { PartidaV2, Sincronizando } from '../v2-partida'

/*
 * Blefe no visual do v2 (protótipo aprovado: docs/redesign/v2/kit3/os-blefe.js, estilo em components/v2/os.css).
 * A partida acontece na mesa do Javali, que reage com as próprias expressões; o tambor de três balas é o centro
 * da revelação; o histórico fica escondido num botão. Regras, bot, servidor e pontuação são os do jogo
 * (lib/devo/arcade/bluff.ts). Leve: cada carta é um botão só (folha única de imagens, sem SVG), a mão é memoizada
 * e o relógio do turno só redesenha quando o segundo muda.
 */

const ARTE = '/v2/art/os/blefe'
const MESA = '/v2/art/os/jogos'
const NAIPES = ['espadas', 'copas', 'ouros', 'paus']
/** Folha cartas.png: cada carta tem 39×64 px na arte original. */
const CW = 39
const CH = 64
/** tons dos avisos do HUD → classes do protótipo */
const TOM: Record<PopTone, string> = { gold: '', amethyst: 'violeta', red: 'perigo', white: 'neutro' }

type Pose = 'convite' | 'neutro' | 'pensativo' | 'trama' | 'sombrio' | 'desdem' | 'riso'
const POSES: Pose[] = ['convite', 'neutro', 'pensativo', 'trama', 'sombrio', 'desdem', 'riso']

type CallEvent = Extract<BluffEvent, { t: 'call' }>

export default function Bluff({ start, onFinish, onQuit }: GameProps) {
  const { online, room, act, toLocal, lost } = useRoom(start, 600)
  const gateOpen = useOnlineGate(start)
  const me: Side = online ? (start.side ?? 'a') : 'a'
  const opp: Side = me === 'a' ? 'b' : 'a'
  /** Como no protótipo: o primeiro nome do oponente no cabeçalho e nas falas. */
  const nomeOp = start.opponent.name.split(' ')[0] || start.opponent.name

  const [running, setRunning] = useState(false)
  const [local, setLocal] = useState<BluffState | null>(null)
  const localRef = useRef(local)
  localRef.current = local
  const botRand = useMemo(() => rng(start.seed ^ 0x7b1ef), [start.seed])
  const [sel, setSel] = useState<number[]>([])
  const [reveal, setReveal] = useState<CallEvent | null>(null)
  /** A revelação já chegou ao veredito (o Javali troca a cara). */
  const [veredito, setVeredito] = useState(false)
  const [feed, setFeed] = useState<string[]>(['Cartas distribuídas.'])
  const [verFeed, setVerFeed] = useState(false)
  const { pops, push } = usePops()
  const muted = useMuted()
  const seenSeq = useRef(0)
  const finished = useRef(false)

  // No treino a visão só é recriada quando o estado muda (antes, a cada tique do relógio, e com ela a mão inteira).
  const localView = useMemo(() => (local ? bluffView(local, 'a') : null), [local])
  const view: BluffView | null = online ? ((room?.state as unknown as BluffView | undefined) ?? null) : localView
  /** Relógio do servidor online; relógio local no treino. */
  const toClock = useCallback((ms: number) => (online ? toLocal(ms) : ms), [online, toLocal])
  const nome = useCallback((s: Side) => (s === me ? 'Você' : nomeOp), [me, nomeOp])

  // As caras do Javali já carregadas: a troca de expressão não pisca.
  useEffect(() => {
    POSES.forEach((p) => {
      const img = new Image()
      img.src = `${ARTE}/javali-${p}.png`
    })
  }, [])

  const log = useCallback((line: string) => setFeed((f) => [line, ...f].slice(0, 6)), [])

  // Reage a cada evento novo (jogada, chamada ou passe), venha de quem vier.
  // Online, cada consulta (600 ms) traz um `ev` novo com o mesmo conteúdo: o efeito depende só do
  // número do evento, e os temporizadores da revelação ficam numa ref limpa só ao desmontar (antes a
  // limpeza cancelava o fim da revelação e o jogador ficava travado).
  const ev = view?.ev ?? null
  const evRef = useRef(ev)
  evRef.current = ev
  const winner = view?.winner ?? null
  const winnerRef = useRef(winner)
  winnerRef.current = winner
  const revealTimers = useRef<number[]>([])
  useEffect(() => () => revealTimers.current.forEach((id) => window.clearTimeout(id)), [])
  const evSeq = ev?.seq ?? 0
  useEffect(() => {
    const ev = evRef.current
    if (!ev || ev.seq <= seenSeq.current) return
    seenSeq.current = ev.seq
    if (ev.t === 'play') {
      playSfx('card')
      log(`${nome(ev.side)}${ev.auto ? ' (tempo esgotado)' : ''} jogou ${ev.n} × ${BLUFF_RANKS[ev.rank]}.`)
      if (ev.side !== me && ev.n >= 3) push(`${ev.n} × ${BLUFF_RANKS[ev.rank]}?`, 'white', 900)
    } else if (ev.t === 'call') {
      revealTimers.current.forEach((id) => window.clearTimeout(id))
      setVeredito(false)
      setReveal(ev)
      playSfx('bluff-shot')
      vibrate(40)
      log(`${nome(ev.caller)} chamou blefe: ${ev.truth ? 'era verdade' : 'era mentira'}. ${nome(ev.loser)} recolheu ${ev.taken}.`)
      const verdictAt = (ev.cards.length * 0.6 + 0.95) * 1000
      const t1 = window.setTimeout(() => {
        setVeredito(true)
        playSfx(ev.truth ? 'bluff-true' : 'bluff-lie')
        vibrate(ev.loser === me ? [60, 40, 60] : 30)
      }, verdictAt)
      const t2 = window.setTimeout(() => setReveal(null), bluffRevealMs(ev.cards.length))
      revealTimers.current = [t1, t2]
    } else {
      log(`${nome(ev.side)} deixou passar.`)
    }
  }, [evSeq, me, nome, log, push])

  const myHand = useMemo(() => view?.me ?? [], [view?.me])
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
  // `onFinish` muda de identidade a cada render da Sala (~30 s) e `room` a cada consulta: pelas refs,
  // o temporizador do resultado, uma vez marcado, só é cancelado se o jogo desmontar.
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const roomRef = useRef(room)
  roomRef.current = room
  const finishTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(finishTimer.current), [])
  const roomDone = online && room?.status === 'finished'
  useEffect(() => {
    if (finished.current) return
    if (online ? !roomDone : winner === null) return
    finished.current = true
    const last = evRef.current
    const lastCall = last?.t === 'call' ? last : null
    const wait = lastCall ? bluffRevealMs(lastCall.cards.length) + 400 : 1800
    finishTimer.current = window.setTimeout(() => {
      const r = roomRef.current
      if (online && r) {
        onFinishRef.current(roomOutcome(r, { bonusLabel: 'BLEFES PEGOS' }))
        return
      }
      const s = localRef.current!
      const mine = bluffScore(s, 'a')
      const theirs = bluffScore(s, 'b')
      onFinishRef.current({
        result: s.winner === 'a' ? 'win' : 'loss',
        score: mine.score,
        oppScore: theirs.score,
        bonus: s.hits.a * 150,
        bonusLabel: `BLEFES PEGOS x${s.hits.a}`,
        stats: mine.stats,
      })
    }, wait)
  }, [online, roomDone, winner])

  const cancelled = online && room?.status === 'cancelled'
  useEffect(() => {
    const r = roomRef.current
    if (!cancelled || finished.current || !r) return
    finished.current = true
    onFinishRef.current(roomOutcome(r))
  }, [cancelled])

  // Relógio do turno: só os segundos e o fim da trava da revelação viram estado (o React ignora o valor repetido),
  // então a tela redesenha uma vez por segundo, como no protótipo.
  const holdLocal = view ? toClock(view.holdUntil) : 0
  const deadline = view ? toClock(Math.max(view.turnAt, view.holdUntil)) + BLUFF_TURN_MS : 0
  const [seg, setSeg] = useState(Math.ceil(BLUFF_TURN_MS / 1000))
  const [solto, setSolto] = useState(true)
  const live = !!view && running && view.winner === null
  useEffect(() => {
    if (!live) return
    const upd = () => {
      const t = Date.now()
      setSeg(Math.ceil(Math.max(0, deadline - t) / 1000))
      setSolto(t >= holdLocal)
    }
    upd()
    const id = window.setInterval(upd, 200)
    return () => window.clearInterval(id)
  }, [live, deadline, holdLocal])

  const myTurn = live && view.turn === me && solto && !reveal
  const oppTurn = live && view.turn === opp
  const myBul = view?.bul[me] ?? BLUFF_BULLETS
  const oppBul = view?.bul[opp] ?? BLUFF_BULLETS
  const oppN = view?.oppN ?? 26
  const pileN = view?.pileN ?? 0
  const last = view?.last ?? null
  const pending = !!last && last.side === opp && view?.oppN === 0
  const pode = myTurn && !pending
  /** O oponente acabou de jogar: dá para chamar blefe (ou mostrar que faltam balas). */
  const duvida = myTurn && !!last && last.side === opp
  const canCall = duvida && myBul > 0

  const lastTick = useRef(0)
  useEffect(() => {
    if (!myTurn) return
    if (seg <= 5 && seg > 0 && seg !== lastTick.current) {
      lastTick.current = seg
      playSfx('chess-tick')
    }
  }, [myTurn, seg])

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
  // A mão recebe uma função estável e só redesenha quando as cartas, a seleção ou a vez mudam.
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle
  const onToggle = useCallback((id: number) => toggleRef.current(id), [])
  const pickRank = () => {
    if (!myTurn || pending || !view) return
    playSfx('card-select')
    setSel(myHand.filter((c) => c.r === view.rk).slice(0, 4).map((c) => c.id))
  }

  const beginLocal = () => {
    setRunning(true)
    if (!online) setLocal(bluffNew(start.seed, Date.now()))
  }

  const rkN = view?.rk ?? 0
  const rank = BLUFF_RANKS[rkN]

  // A fala da vez, com os valores em destaque (textos do protótipo).
  let diz: ReactNode = ''
  if (view && running) {
    if (view.winner !== null) diz = 'Fim de jogo.'
    else if (myTurn && last && last.side === opp)
      diz = pending ? (
        `${nomeOp} jogou a última carta. ${myBul > 0 ? 'Chame blefe agora, ou ele vence.' : 'Sem balas, você só pode deixá-lo vencer.'}`
      ) : (
        <>
          {nomeOp} diz{' '}
          <b>
            {last.n} × {BLUFF_RANKS[last.rank]}
          </b>
          . {myBul > 0 ? `Acredite e jogue ${rank}, ou chame blefe.` : `Você está sem balas. Jogue ${rank}.`}
        </>
      )
    else if (myTurn)
      diz = (
        <>
          Sua vez. Jogue cartas como <b>{rank}</b> (mentir vale).
        </>
      )
    else if (view.turn === opp && !reveal)
      diz =
        last && last.side === me ? (
          <>
            Você disse{' '}
            <b>
              {last.n} × {BLUFF_RANKS[last.rank]}
            </b>
            . {nomeOp} está pensando…
          </>
        ) : (
          `${nomeOp} está pensando…`
        )
  }

  // O Javali reage: convida antes da partida, pensa na sua vez, trama quando o oponente está quase lá,
  // fica sombrio na revelação e ri ou desdenha no veredito e no fim.
  let pose: Pose = 'convite'
  if (running && view) {
    if (reveal) pose = veredito ? (reveal.truth ? 'desdem' : 'riso') : 'sombrio'
    else if (view.winner !== null) pose = ev?.t === 'call' ? (ev.truth ? 'desdem' : 'riso') : view.winner === me ? 'desdem' : 'riso'
    else pose = view.turn === me ? 'pensativo' : oppN <= 3 ? 'trama' : 'neutro'
  }

  const perigo = myTurn && seg <= 6
  const relTxt = running && view ? (reveal ? '' : `${myTurn ? 'Sua vez' : nomeOp} · ${seg}s`) : ''
  const relBar = running ? Math.min(1, (seg * 1000) / BLUFF_TURN_MS) : 1

  return (
    <PartidaV2 className="bl" label="Blefe" onQuit={onQuit} confirmQuit={online && !roomDone && !cancelled} connLost={lost}>
      {({ sair, chat }) => (
        <>
          <header className={chat ? 'mr-topo bl-topo com-chat' : 'mr-topo bl-topo'}>
            <button type="button" className="chanfro mr-sair" aria-label="Desistir e sair" onClick={sair}>
              ×
            </button>
            <div className={oppTurn ? 'mr-pl op bl-op lid' : 'mr-pl op bl-op'}>
              <i className="bl-mono" aria-hidden="true">
                {nomeOp.charAt(0).toUpperCase()}
              </i>
              <div>
                <small>{nomeOp}</small>
                <b>
                  {oppN} <u>cartas</u>
                </b>
              </div>
              <Tambor tam={40} n={oppBul} />
            </div>
            {chat}
            <button
              type="button"
              className="chanfro mr-sair"
              aria-label="Últimas jogadas"
              aria-pressed={verFeed}
              onClick={() => setVerFeed((v) => !v)}
            >
              ≡
            </button>
            <button
              type="button"
              id="bl-som"
              className={muted ? 'chanfro mr-sair off' : 'chanfro mr-sair'}
              aria-label="Som"
              aria-pressed={!muted}
              onClick={() => {
                unlockAudio()
                setMuted(!muted)
              }}
            >
              ♪
            </button>
          </header>

          <div className="bl-cena">
            <div className="bl-mesa">
              <img className="f" src={`${MESA}/mesa.png`} alt="" />
              <img className="j" src={`${ARTE}/javali-${pose}.png`} alt="" />
              <img className="f t" src={`${MESA}/mesa-frente.png`} alt="" />
              <Pilha n={pileN} />
              <div className="bl-ficha" aria-label={`Valor da vez: ${rank}`}>
                <img src={`${ARTE}/ficha.png`} alt="" />
                <b>{rank}</b>
              </div>
              <span className="bl-ficha-l">valor da vez</span>
              <span className="bl-pn">{pileN ? `${pileN} ${pileN === 1 ? 'carta' : 'cartas'}` : ''}</span>
            </div>
            <ul className="bl-feed fundo" hidden={!verFeed} aria-label="Últimas jogadas">
              {feed.map((f, i) => (
                <li key={`${feed.length - i}-${f}`}>{f}</li>
              ))}
            </ul>
            <div className="mr-pops bl-pops" aria-live="polite">
              {pops.map((p) => (
                <p key={p.id} className={TOM[p.tone] ? `mr-pop ${TOM[p.tone]}` : 'mr-pop'}>
                  {p.text}
                </p>
              ))}
            </div>
          </div>

          <p className={myTurn ? 'bl-diz me' : 'bl-diz'} aria-live="polite">
            <span>{diz}</span>
          </p>

          <div className="bl-eu">
            <Tambor tam={56} n={myBul} />
            <div className="bl-bl">
              <small>Suas balas</small>
              <b>
                {myBul} / {BLUFF_BULLETS}
              </b>
            </div>
            <div className="bl-rel">
              <b role="timer" aria-label="Tempo do turno" className={perigo ? 'perigo' : undefined}>
                {relTxt}
              </b>
              <u>
                <s className={perigo ? 'perigo' : myTurn ? 'meu' : undefined} style={{ transform: `scaleX(${relBar.toFixed(3)})` }} />
              </u>
            </div>
            <button type="button" className="chanfro bl-marca" disabled={!pode} onClick={pickRank}>
              Marcar os {rank}
            </button>
          </div>

          <Mao cards={myHand} sel={sel} pode={pode} rk={rkN} onToggle={onToggle} />

          <div className="bl-acoes">
            {pending && myTurn ? (
              <button type="button" className="chanfro bl-bt fan" onClick={pass}>
                Deixar vencer
              </button>
            ) : (
              <button type="button" className="chanfro bl-bt" disabled={!pode || !sel.length} onClick={play}>
                {sel.length ? `Jogar ${sel.length} como ${rank}` : 'Escolha 1 a 4 cartas'}
              </button>
            )}
            <button type="button" className="chanfro bl-bt bad" hidden={!duvida} disabled={myBul < 1} onClick={call}>
              <img src={`${ARTE}/bala.png`} alt="" />
              {myBul < 1 ? ' Sem balas' : ' É blefe!'}
            </button>
          </div>

          {reveal && <Revelacao key={reveal.seq} ev={reveal} nome={nome} />}

          {!running && !finished.current && !gateOpen && <Sincronizando nome={start.opponent.name} />}
          {!running && !finished.current && gateOpen && <Contagem onDone={beginLocal} />}
        </>
      )}
    </PartidaV2>
  )
}

/** Tambor do revólver com até três balas. `gasta`: a bala que acabou de sair; `volta`: a que foi devolvida. */
const Tambor = memo(function Tambor({ tam, n, gasta, volta, gira }: { tam: number; n: number; gasta?: number; volta?: number; gira?: boolean }) {
  return (
    <span className={gira ? 'bl-tb gira' : 'bl-tb'} style={{ '--t': `${tam}px` } as CSSProperties} role="img" aria-label={`${n} de ${BLUFF_BULLETS} balas`}>
      <img className="t" src={`${ARTE}/tambor.png`} alt="" />
      {[0, 1, 2].map((i) => (
        <img
          key={i}
          className={volta === i ? 'b volta' : 'b'}
          hidden={i >= n && volta !== i}
          style={{ '--a': `${i * 120}deg` } as CSSProperties}
          src={gasta === i ? `${ARTE}/gasta.png` : `${ARTE}/bala.png`}
          alt=""
        />
      ))}
    </span>
  )
})

/** A pilha na mesa: até 12 versos, cada um caindo uma vez ao entrar. */
const Pilha = memo(function Pilha({ n }: { n: number }) {
  const k = Math.min(12, n)
  return (
    <div className="bl-pilha" aria-hidden="true">
      {Array.from({ length: k }, (_, i) => (
        <i
          key={i}
          className="nova"
          style={{ '--r': `${((i * 53 + 11) % 37) - 18}deg`, '--dx': `${((i * 29 + 5) % 13) - 6}%`, '--dy': `${((i * 17 + 3) % 11) - 5 - i * 1.2}%` } as CSSProperties}
        />
      ))}
    </div>
  )
})

/** A mão: uma folha de imagens, e cada carta só muda de lugar. Cartas novas (distribuídas ou recolhidas) caem na mão. */
const Mao = memo(function Mao({ cards, sel, pode, rk, onToggle }: { cards: BluffCard[]; sel: number[]; pode: boolean; rk: number; onToggle: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setW(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Cartas que acabaram de chegar ganham a animação de entrada por 900 ms.
  const vistas = useRef(new Set<number>())
  const [novas, setNovas] = useState<Set<number>>(() => new Set())
  const novasT = useRef(0)
  useEffect(() => () => window.clearTimeout(novasT.current), [])
  const chave = cards.map((c) => c.id).join(',')
  useLayoutEffect(() => {
    const chegaram = cards.filter((c) => !vistas.current.has(c.id)).map((c) => c.id)
    vistas.current = new Set(cards.map((c) => c.id))
    if (!chegaram.length) return
    setNovas(new Set(chegaram))
    window.clearTimeout(novasT.current)
    novasT.current = window.setTimeout(() => setNovas(new Set()), 900)
  }, [chave]) // eslint-disable-line react-hooks/exhaustive-deps

  const w = W || 340
  const esc = w >= 620 ? 2 : 1.5
  const cw = CW * esc
  const chh = CH * esc
  const n = cards.length
  const rows = Math.max(1, Math.ceil(n / 13))
  const per = Math.max(1, Math.ceil(n / rows))
  const gap = Math.round(chh * 0.46)

  return (
    <div
      ref={ref}
      className="bl-mao"
      role="group"
      aria-label={`Sua mão: ${n} cartas`}
      style={{ '--esc': esc, height: `${chh + (rows - 1) * gap + 10}px` } as CSSProperties}
    >
      {cards.map((c, idx) => {
        const r = Math.floor(idx / per)
        const i = idx - r * per
        const k = Math.min(per, n - r * per)
        const sp = k > 1 ? Math.min(cw * 0.62, (w - cw - 6) / (k - 1)) : 0
        const x = w / 2 - cw / 2 + (i - (k - 1) / 2) * sp
        const on = sel.includes(c.id)
        const cls = ['bl-c', on && 'sel', pode && c.r === rk && 'ok', novas.has(c.id) && 'dar'].filter(Boolean).join(' ')
        return (
          <button
            key={c.id}
            type="button"
            className={cls}
            disabled={!pode}
            aria-pressed={on}
            aria-label={`${BLUFF_RANKS[c.r]} de ${NAIPES[c.s]}`}
            onClick={() => onToggle(c.id)}
            style={
              {
                '--fx': c.r,
                '--fy': c.s,
                '--x': `${Math.round(x)}px`,
                '--y': `${r * gap}px`,
                '--i': Math.min(idx, 20),
                zIndex: r * 100 + i,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
})

/** A revelação: as cartas viram uma a uma, vem o veredito e o revólver decide a bala de quem duvidou. */
function Revelacao({ ev, nome }: { ev: CallEvent; nome: (s: Side) => string }) {
  const n = ev.cards.length
  const [virando, setVirando] = useState(0)
  const [abertas, setAbertas] = useState(0)
  /** 1 veredito · 2 revólver · 3 tiro (ou bala de volta) · 4 cartas recolhidas */
  const [passo, setPasso] = useState(0)
  const [treme, setTreme] = useState(false)
  const [clarao, setClarao] = useState(false)

  useEffect(() => {
    const ts: number[] = []
    const at = (ms: number, f: () => void) => ts.push(window.setTimeout(f, ms))
    const vd = (n * 0.6 + 0.95) * 1000
    for (let i = 0; i < n; i++) {
      at(i * 600 + 350, () => setVirando(i + 1))
      at(i * 600 + 350 + 110, () => {
        setAbertas(i + 1)
        playSfx('card-select')
      })
    }
    at(vd, () => {
      setPasso(1)
      if (!ev.truth) {
        setTreme(true)
        at(300, () => setTreme(false))
      }
    })
    at(vd + 150, () => setPasso(2))
    at(vd + 410, () => {
      setPasso(3)
      if (ev.bullet === 'lost') {
        setClarao(true)
        playSfx('bluff-shot')
        at(140, () => setClarao(false))
      }
    })
    at(vd + 700, () => setPasso(4))
    return () => ts.forEach((id) => window.clearTimeout(id))
  }, [ev, n])

  const perdeu = ev.bullet === 'lost'
  const antes = Math.max(perdeu ? ev.left + 1 : ev.left - 1, 0)
  const atirou = passo >= 3

  return (
    <div className={['bl-rev', !ev.truth && 'mentira', treme && 'treme'].filter(Boolean).join(' ')} role="alert">
      <small>
        {nome(ev.liar)} jogou {n} × {BLUFF_RANKS[ev.rank]} · {nome(ev.caller)} duvidou
      </small>
      <div className="bl-rc">
        {ev.cards.map((c, i) => {
          const aberta = i < abertas
          const cls = ['bl-rv', i < virando && 'vira', aberta && 'aberta', aberta && (c.r === ev.rank ? 'certa' : 'falsa')].filter(Boolean).join(' ')
          return (
            <i
              key={c.id}
              className={cls}
              style={{ '--fx': c.r, '--fy': c.s } as CSSProperties}
              role="img"
              aria-label={aberta ? `${BLUFF_RANKS[c.r]} de ${NAIPES[c.s]}` : 'Carta virada'}
            />
          )
        })}
      </div>
      <div className="bl-veredito" hidden={passo < 1}>
        {ev.truth ? 'Era verdade' : 'Blefe!'}
      </div>
      <div className="bl-arma" hidden={passo < 2}>
        <Tambor
          tam={84}
          n={antes}
          gasta={atirou && perdeu ? ev.left : undefined}
          volta={atirou && !perdeu ? ev.left - 1 : undefined}
          gira={atirou && perdeu}
        />
        <img className="clarao" src={`${ARTE}/clarao.png`} alt="" hidden={!clarao} />
        <img className="fumo" src={`${ARTE}/fumaca.png`} alt="" hidden={!(atirou && perdeu)} />
      </div>
      <p className="bl-ev" hidden={!atirou}>
        {perdeu ? `Bala perdida · ${nome(ev.caller)} fica com ${ev.left}` : `Bala devolvida a ${nome(ev.caller)}`}
      </p>
      <p className="bl-rec" hidden={passo < 4}>
        {nome(ev.loser)} recolhe {ev.taken} {ev.taken === 1 ? 'carta' : 'cartas'}
        {ev.burned > 0 && (
          <>
            {' · '}
            <img src={`${ARTE}/cinzas.png`} alt="" /> {ev.burned} queimadas
          </>
        )}
      </p>
    </div>
  )
}

/** 3 · 2 · 1 · JÁ em dígitos grandes de bronze sobre a mesa (igual ao Memory Rush). */
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
