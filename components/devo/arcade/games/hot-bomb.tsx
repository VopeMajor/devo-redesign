'use client'

import { useEffect, useRef, useState } from 'react'
import type { BombState, GameOutcome, GameProps } from '@/lib/devo/arcade/client'
import { GAMES, botSkill } from '@/lib/devo/arcade/games'
import { roomOutcome, useOnlineGate, useRoom } from '../use-room'
import { PartidaV2 } from '../v2-partida'
import { ARTE_DIR, POINTS, montaBomba, type Auth, type Side } from './bomba/motor'
import './hot-bomb-v2.css'

/*
 * Bomba Quente no visual do v2 (protótipo aprovado: docs/redesign/v2/kit3/os-bomba.js, estilo em components/v2/os.css).
 * Arena-relógio em pixel num canvas pequeno, em pé no celular (sem girar a tela), joystick de toque e PULA.
 * Regras, física, rodadas e pontos são os do jogo; online o servidor decide passe, explosão, rodada e placar.
 * O desenho e a física moram em bomba/motor.ts e correm por refs: o React só redesenha ao entrar, sair e acabar.
 */

const meta = GAMES['hot-bomb']
const other = (s: Side): Side => (s === 'a' ? 'b' : 'a')
const bicho = (s: Side) => (s === 'a' ? 'Coelho' : 'Urso')

type Fim = { titulo: string; sub: string }

export default function HotBomb({ start, settings, onFinish, onQuit }: GameProps) {
  const mySide: Side = start.side ?? 'a'
  const online = !!start.roomId
  const nomeOp = start.opponent.name.split(' ')[0]

  const area = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const pad = useRef<HTMLDivElement>(null)
  const jb = useRef<HTMLDivElement>(null)
  const pula = useRef<HTMLButtonElement>(null)
  const nivel = useRef<HTMLElement>(null)
  const msgEl = useRef<HTMLDivElement>(null)
  const st = useRef<HTMLParagraphElement>(null)
  const s1 = useRef<HTMLSpanElement>(null)
  const s2 = useRef<HTMLSpanElement>(null)

  const [jogando, setJogando] = useState(false)
  const [fim, setFim] = useState<Fim | null>(null)
  const [som, setSom] = useState(settings.sound !== 'off')
  const somRef = useRef(som)
  somRef.current = som

  const auth = useRef<Auth | null>(null)
  const started = useRef(false)
  const ended = useRef(false)
  const me = useRef({ x: 0, y: 0, z: 0 })
  const oppNet = useRef<{ x: number; z: number; h: number } | null>(null)
  const motor = useRef<ReturnType<typeof montaBomba> | null>(null)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  /** Temporizador do resultado: limpo ao desmontar (sair na faixa final não traz o resultado de volta). */
  const finishTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(finishTimer.current), [])

  // A posição vai junto de cada consulta (110 ms, como sempre): o servidor confere o passe com ela.
  const { room, act, toLocal, lost } = useRoom(start, 110, () =>
    started.current && !ended.current ? { type: 'pos', x: me.current.x, y: me.current.z, h: me.current.y } : undefined,
  )
  const actRef = useRef(act)
  actRef.current = act
  const gateOpen = useOnlineGate(start)

  // Online: rodada, dono da bomba, explosão e placar vêm do servidor.
  useEffect(() => {
    if (!online || !room || room.status === 'waiting') return
    if (room.status === 'finished' || room.status === 'cancelled') {
      if (ended.current) return
      ended.current = true
      const st = room.state as BombState | undefined
      const winner = room.result?.winner as Side | null | undefined
      const mine = room.result?.mine?.stats ?? {}
      setJogando(true)
      setFim({
        titulo: winner === 'a' ? 'O Coelho venceu' : winner === 'b' ? 'O Urso venceu' : 'Empate',
        // "O oponente abandonou" só para quem ficou e venceu; quem abandonou vê o placar.
        sub: room.result?.reason === 'abandono' && winner === mySide ? 'O oponente abandonou a partida.' : `Placar: ${st?.wins.a ?? 0} × ${st?.wins.b ?? 0}`,
      })
      finishTimer.current = window.setTimeout(
        () => finishRef.current(roomOutcome(room, { bonus: (mine.clutch ?? 0) * 100, bonusLabel: `${mine.clutch ?? 0} CLUTCH` })),
        2600,
      )
      return
    }
    const s = room.state as BombState
    auth.current = {
      round: s.round,
      holder: s.holder,
      passAt: toLocal(s.passAt),
      explodeAt: toLocal(s.explodeAt),
      phase: s.phase,
      boomAt: toLocal(s.boomAt),
      wins: { ...s.wins },
      score: { ...s.score },
      passes: { ...s.passes },
      clutch: { ...s.clutch },
    }
    const live = room.oppLive as { x?: number; y?: number; h?: number } | null
    oppNet.current = live && typeof live.x === 'number' && typeof live.y === 'number' ? { x: live.x, z: live.y, h: live.h ?? 0 } : null
  }, [online, room, toLocal, mySide])

  // Online: a contagem começa ~3,2 s antes do início combinado, com o estado da sala já em mãos.
  useEffect(() => {
    if (!online || !gateOpen || started.current || ended.current || !auth.current) return
    started.current = true
    setJogando(true)
    motor.current?.liga()
  }, [online, gateOpen, room])

  useEffect(() => {
    const m = montaBomba({
      dom: {
        root: area.current!.closest('.bq') as HTMLElement,
        area: area.current!,
        cv: cv.current!,
        pad: pad.current!,
        jb: jb.current!,
        pula: pula.current!,
        nivel: nivel.current!,
        msg: msgEl.current!,
        st: st.current!,
        s1: s1.current!,
        s2: s2.current!,
      },
      seed: start.seed,
      mySide,
      online,
      skill: botSkill(start.opponent.rating),
      nomeOp,
      auth,
      started,
      ended,
      oppNet,
      me,
      mudo: () => !somRef.current,
      tag: () => void actRef.current({ type: 'tag' }),
      fimTreino: (A) => {
        const meWins = A.wins[mySide]
        const oppWins = A.wins[other(mySide)]
        setFim({ titulo: A.wins.a > A.wins.b ? 'O Coelho venceu' : 'O Urso venceu', sub: `Placar: ${A.wins.a} × ${A.wins.b}` })
        const out: GameOutcome = {
          result: meWins > oppWins ? 'win' : 'loss',
          score: Math.min(meta.maxScore, A.score[mySide]),
          oppScore: A.score[other(mySide)],
          bonus: A.clutch[mySide] * 100,
          bonusLabel: `${A.clutch[mySide]} CLUTCH`,
          stats: { passes: A.passes[mySide], clutch: A.clutch[mySide], roundsWon: meWins, roundsLost: oppWins },
        }
        finishTimer.current = window.setTimeout(() => finishRef.current(out), 2600)
      },
    })
    motor.current = m
    // Montou depois que a contagem online já tinha sido liberada.
    if (started.current) m.liga()
    return () => {
      m.destroi()
      motor.current = null
    }
    // O motor é montado uma vez; dados vivos chegam por refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const jogar = () => {
    if (started.current) return
    motor.current?.comecaTreino()
    setJogando(true)
  }

  return (
    <PartidaV2
      className="bq"
      label={meta.name}
      onQuit={onQuit}
      confirmQuit={online && !fim && room?.status !== 'finished' && room?.status !== 'cancelled'}
      connLost={lost}
    >
      {({ sair, chat }) => (
        <>
          <header className="mr-topo bq-topo">
            {/* Na entrada quem sai é o "Sair" dela (com o mesmo nome acessível); aqui o X fica só com a partida aberta. */}
            {jogando ? (
              <button type="button" className="chanfro mr-sair" aria-label="Desistir e sair" onClick={sair}>
                ×
              </button>
            ) : (
              <span />
            )}
            <div className="mr-pl eu">
              <small>Você · {bicho(mySide)}</small>
              <span ref={s1} className="bq-pips" aria-label="0 pontos" />
            </div>
            <div className="bq-nivel" title="Inclinação do chão" aria-hidden="true">
              <i ref={nivel} />
            </div>
            <div className="mr-pl op">
              <small>
                {nomeOp} · {bicho(other(mySide))}
              </small>
              <span ref={s2} className="bq-pips" aria-label="0 pontos" />
            </div>
          </header>
          <p ref={st} className="bq-st" aria-live="polite" />
          <div ref={area} className="bq-area">
            <canvas ref={cv} />
            <div ref={pad} className="bq-pad" />
            <div ref={msgEl} className="bq-msg" aria-live="polite" />
            <div ref={jb} className="bq-jb" hidden>
              <i />
            </div>
            <button ref={pula} type="button" className="bq-pula chanfro" aria-label="Pular">
              PULA
            </button>
            <button
              type="button"
              className={som ? 'bq-som chanfro' : 'bq-som chanfro off'}
              aria-pressed={som}
              aria-label="Som"
              onClick={() => setSom((s) => !s)}
            >
              ♪
            </button>
            {chat && <span className="bq-chat">{chat}</span>}
          </div>
          {!jogando && (
            <div className="bq-entrada fundo">
              <img className="bq-capa" src="/v2/art/os/jogos/capa-bomb.png" alt="" />
              <small>{online ? 'Partida · Sala de Jogos' : 'Treino · Sala de Jogos'}</small>
              <h2>{meta.name}</h2>
              <p>
                {meta.description} Vence quem fizer {POINTS} pontos.
              </p>
              <p className="bq-voce">
                <img src={`${ARTE_DIR}/${mySide === 'a' ? 'coelho' : 'urso'}.png`} alt="" className="bq-mini" />
                Você é o <b>{bicho(mySide)}</b>
              </p>
              <ul>
                <li>Celular: arraste o polegar na tela para andar e toque em PULA.</li>
                <li>Teclado: WASD ou setas para mover · Espaço ou Enter para pular.</li>
              </ul>
              {online ? (
                <p className="bq-espera" role="status">
                  Aguardando {start.opponent.name}…
                </p>
              ) : (
                <button type="button" className="r-bt chanfro s-forte s-larga" onClick={jogar}>
                  Jogar
                </button>
              )}
              <button type="button" className="r-link" aria-label="Desistir e sair" onClick={sair}>
                Sair
              </button>
            </div>
          )}
          {fim && (
            <div className="bq-fim" role="status">
              <small>Fim de partida</small>
              <h2>{fim.titulo}</h2>
              <p>{fim.sub}</p>
            </div>
          )}
        </>
      )}
    </PartidaV2>
  )
}
