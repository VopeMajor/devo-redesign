'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { type ArcadeView, useApplyTime } from '@/components/devo/arcade/arcade-shared'
import { JavaliIntro } from '@/components/devo/arcade/javali-intro'
import { LiveMatchProvider } from '@/components/devo/arcade/live-match'
import { Mesa } from '@/components/devo/arcade/mesa'
import { MiniProfileHost } from '@/components/devo/arcade/mini-profile'
import { ResultScreen, type Running, Searching } from '@/components/devo/arcade/sala-match'
import { Agenda, Apostas, Ranking, type RankView } from '@/components/devo/arcade/sala-tabs'
import { MARBLE_INK } from '@/components/devo/arcade/sala-marble'
import { Plaque } from '@/components/devo/arcade/sala-ui'
import { Button, CRITICAL_MS, Countdown, Curtain, SceneBackdrop, Spinner, Tabs, Toast, ToastStack, useCurtain } from '@/components/devo/kit'
import {
  type Dashboard,
  type GameOutcome,
  type MatchFinish,
  type MatchStart,
  type RoomPoll,
  arcadeFetcher,
  arcadeKey,
  arcadePost,
  formatPoints,
  joinDuel,
  leaveRoom,
  pollRoom,
  queueCasual,
  roomToStart,
  startTutorial,
} from '@/lib/devo/arcade/client'
import type { GameId } from '@/lib/devo/arcade/games'
import { liveChannelFor } from '@/lib/devo/arcade/reactions'
import { playSfx, setArcadeAmbienceMuffled, startArcadeAmbience, stopArcadeAmbience } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { GAME_COMPONENTS } from '../arcade/game-loader'
import { useNow } from '../hooks'
import { useDevo } from '../state/devo-store'

type Tab = ArcadeView
const TABS: { value: Tab; label: string }[] = [
  { value: 'mesa', label: 'Mesa' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'apostas', label: 'Apostas' },
]
const ORDER: Tab[] = TABS.map((t) => t.value)

export function JogosApp() {
  const [tab, setTab] = useState<Tab>('mesa')
  const prevTab = useRef<Tab>('mesa')
  const [rankView, setRankView] = useState<RankView>('geral')
  const [running, setRunning] = useState<Running | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { state } = useDevo()
  const applyTime = useApplyTime()
  const { curtain, run } = useCurtain()
  useArcadeAmbience(!!running && !running.finish)
  const { data, error, mutate } = useSWR<Dashboard>(arcadeKey('dashboard'), arcadeFetcher, {
    refreshInterval: 30_000,
    onSuccess: (d) => applyTime(d),
  })

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(t)
  }, [notice])

  const fail = (e: unknown) => {
    playSfx('error')
    setNotice((e as Error).message)
  }

  /** Entrar numa partida é troca de fase: cortina com rótulo; o jogo monta no meio dela. */
  const enter = (start: MatchStart) => {
    const tutorial = start.mode === 'treino'
    const ok = run(tutorial ? 'Treinando' : 'Valendo Tempo', () => setRunning({ start }), { sfx: 'whoosh', tone: tutorial ? 'system' : 'gold' })
    if (!ok) setRunning({ start })
  }

  const launch = async (fn: () => Promise<MatchStart>) => {
    if (busy) return
    setBusy(true)
    try {
      enter(await fn())
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const [queue, setQueue] = useState<{ roomId: string; gameId: GameId; duel: boolean } | null>(null)
  useSWR<RoomPoll>(queue ? ['arcade-queue', queue.roomId] : null, () => pollRoom(queue!.roomId), {
    refreshInterval: 1500,
    dedupingInterval: 0,
    revalidateOnFocus: false,
    onSuccess: (r) => {
      if (r.status === 'active') {
        setQueue(null)
        enter(roomToStart(r))
      } else if (r.status === 'cancelled' || r.status === 'finished') setQueue(null)
    },
    onError: () => setQueue(null),
  })

  const enterRoom = async (fn: () => Promise<RoomPoll>, duel: boolean) => {
    if (busy || queue) return
    setBusy(true)
    try {
      const r = await fn()
      if (r.status === 'active') enter(roomToStart(r))
      else if (r.status === 'waiting' || duel) setQueue({ roomId: r.id, gameId: r.gameId, duel })
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  const cancelQueue = () => {
    if (!queue) return
    playSfx('close')
    leaveRoom(queue.roomId).catch(() => {})
    setQueue(null)
  }

  const quit = () => {
    const roomId = running?.start.roomId
    if (roomId && !running?.finish) leaveRoom(roomId).catch(() => {})
    setRunning(null)
    mutate()
  }

  const finish = async (outcome: GameOutcome) => {
    if (!running) return
    if (outcome.finish) {
      applyTime(outcome.finish)
      playSfx('reveal')
      setRunning({ start: running.start, finish: { ...outcome.finish, outcome } })
      mutate()
      return
    }
    try {
      const res = await arcadePost<MatchFinish>({
        action: 'finish',
        matchId: running.start.matchId,
        result: outcome.result,
        score: outcome.score,
        stats: outcome.stats,
      })
      applyTime(res)
      playSfx('reveal')
      setRunning({ start: running.start, finish: { ...res, outcome } })
    } catch (e) {
      setRunning({ ...running, error: (e as Error).message })
    }
    mutate()
  }

  const changeTab = (v: Tab) => {
    prevTab.current = tab
    setTab(v)
  }
  const forward = ORDER.indexOf(tab) >= ORDER.indexOf(prevTab.current)

  return (
    <MiniProfileHost>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-dv-ink text-dv-text">
        {/* na fila, o radar cobre a sala: a cena 3D dá lugar ao fundo em CSS (sem desfocar WebGL ao vivo) */}
        {!running && <SalaScene endsAt={state.timerEndsAt} quiet={tab !== 'mesa' || !!queue} />}

        <div className="relative z-10 shrink-0 px-4 pt-3">
          <h2 className="sr-only">Sala de Jogos</h2>
          <Header data={data} />
        </div>

        <Tabs
          label="Seções da Sala de Jogos"
          items={TABS}
          value={tab}
          onValueChange={changeTab}
          fill
          className="relative z-10 mt-1.5 flex min-h-0 flex-1 flex-col [&>div:first-child]:mx-4 [&_[role=tab]]:px-2 [&_[role=tab]]:text-[12px] [&_[role=tab]]:tracking-[0.14em]"
          panelClassName="devo-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-4"
        >
          {error && <p className="mb-3 border border-dv-blood/60 bg-dv-blood-deep/40 p-3 font-body text-[15px] text-dv-blood-text">{error.message}</p>}
          {!data && !error && (
            <p className="flex items-center gap-2.5 py-10 text-dv-text-3">
              <Spinner className="size-5" />
              <span className="dv-label text-[11px]">Embaralhando…</span>
            </p>
          )}
          <div key={tab} className={forward ? 'animate-dv-slide-left' : 'animate-dv-slide-right'}>
            {data && tab === 'mesa' && (
              <Mesa
                data={data}
                busy={busy || !!queue}
                onPlay={(g) => enterRoom(() => queueCasual(g), false)}
                onTutorial={(g) => launch(() => startTutorial(g))}
                onJoinEvent={(id) => enterRoom(() => joinDuel(id), true)}
                onChange={() => mutate()}
                onView={(v) => {
                  playSfx('click')
                  changeTab(v)
                }}
              />
            )}
            {data && tab === 'agenda' && (
              <Agenda
                data={data}
                busy={busy || !!queue}
                onPlay={(id) => enterRoom(() => joinDuel(id), true)}
                onQueue={(g) => enterRoom(() => queueCasual(g), false)}
                onRanking={(g) => {
                  setRankView(g)
                  playSfx('click')
                  changeTab('ranking')
                }}
                onChange={() => mutate()}
              />
            )}
            {data && tab === 'ranking' && <Ranking data={data} view={rankView} onView={setRankView} />}
            {tab === 'apostas' && <Apostas />}
          </div>
        </Tabs>

        {!state.javaliMet && <JavaliIntro />}

        {queue && !running && <Searching gameId={queue.gameId} duel={queue.duel} onCancel={cancelQueue} />}

        {notice && (
          <ToastStack>
            <Toast tone="alert" source="Sala de Jogos" title="A casa recusou" body={notice} onClose={() => setNotice(null)} />
          </ToastStack>
        )}

        {curtain && createPortal(<Curtain state={curtain} />, document.body)}

        {running &&
          createPortal(
            <div className="fixed inset-0 z-[80] bg-dv-ink">
              {running.finish ? (
                <ResultScreen run={running} onClose={quit} />
              ) : running.error ? (
                <div className="grid h-full place-items-center p-6 text-center">
                  <div className="flex max-w-sm flex-col items-center gap-5">
                    <p className="dv-label text-[11px] text-dv-blood-text">A partida não pôde ser registrada</p>
                    <p className="font-body text-[16px] text-dv-text-2">{running.error}</p>
                    <Button variant="secondary" onClick={quit} sfx="close">
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : (
                <GameRunner run={running} settings={(data?.me.settings ?? {}) as Record<string, string>} onFinish={finish} onQuit={quit} />
              )}
            </div>,
            document.body,
          )}
      </div>
    </MiniProfileHost>
  )
}

/**
 * Cena 3D da mesa atrás de tudo; pulsa em vermelho quando o Tempo do jogador fica crítico. Nas abas
 * de leitura (Agenda, Ranking, Apostas) a cena recua (`quiet`): mais véu e menos luz, para o texto
 * nunca disputar com as casas do tabuleiro.
 */
function SalaScene({ endsAt, quiet }: { endsAt: number; quiet?: boolean }) {
  const now = useNow(10_000)
  const left = endsAt - now
  const alert = left > 0 && left <= CRITICAL_MS
  if (quiet) return <QuietRoom alert={alert} />
  return <SceneBackdrop preset="table" intensity={0.65} dim={0.5} alert={alert} />
}

/**
 * Fundo das abas de leitura: a mesma sala, desenhada em CSS (nítida em qualquer DPR), sem o 3D
 * rasterizado por trás do texto. Mármore negro de veio cinza e piso xadrez em perspectiva sumindo no
 * escuro; rubi só quando o Tempo do jogador está crítico.
 */
function QuietRoom({ alert }: { alert: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-dv-ink">
      <span className="absolute inset-0 opacity-40" style={MARBLE_INK} />
      <span
        className="absolute inset-x-[-60%] bottom-[-6%] h-[52%] origin-bottom [transform:perspective(560px)_rotateX(64deg)]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(186,176,159,0.16) 1px, transparent 1px), linear-gradient(0deg, rgba(186,176,159,0.16) 1px, transparent 1px), conic-gradient(#26262a 25%, #0d0d0f 0 50%, #26262a 0 75%, #0d0d0f 0)',
          backgroundSize: '96px 96px, 96px 96px, 192px 192px',
          backgroundPosition: 'center bottom',
          maskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 92%)',
          WebkitMaskImage: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 92%)',
        }}
      />
      <span className="absolute inset-0 bg-[radial-gradient(85%_40%_at_50%_0%,rgba(236,229,216,0.07),transparent_70%)]" />
      <span className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_45%,transparent_40%,rgba(12,12,14,0.85)_100%)]" />
      {alert && <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(163,18,31,0.2),transparent_70%)]" />}
    </div>
  )
}

function useArcadeAmbience(inGame: boolean) {
  useEffect(() => {
    startArcadeAmbience()
    const resume = () => startArcadeAmbience()
    window.addEventListener('pointerdown', resume, { once: true })
    return () => {
      window.removeEventListener('pointerdown', resume)
      stopArcadeAmbience()
    }
  }, [])
  useEffect(() => setArcadeAmbienceMuffled(inGame), [inGame])
}

function GameRunner({ run, settings, onFinish, onQuit }: { run: Running; settings: Record<string, string>; onFinish: (o: GameOutcome) => void; onQuit: () => void }) {
  const Game = GAME_COMPONENTS[run.start.gameId as GameId]
  return (
    <LiveMatchProvider channel={liveChannelFor(run.start)}>
      <Game start={run.start} settings={settings} onFinish={onFinish} onQuit={onQuit} />
    </LiveMatchProvider>
  )
}

/**
 * Placas de status da Sala. O Tempo do jogador já está na pílula da barra de status (shell), então
 * aqui ficam só Pontos, Posição e Reset — o Reset em TimeDigits HH:MM:SS, o mesmo formato do sistema.
 */
function Header({ data }: { data?: Dashboard }) {
  const me = data?.me
  return (
    <dl className="grid animate-dv-fade grid-cols-[1fr_1fr_1.35fr] gap-1.5">
      <Plaque label="Pontos" tone="gold">
        <span className={cn(me && me.score > 0 ? 'text-dv-gold-bright' : 'text-dv-text')}>{me ? formatPoints(me.score) : '—'}</span>
      </Plaque>
      <Plaque label="Posição">{me?.rank ? `#${me.rank}` : '—'}</Plaque>
      <Plaque label="Ranking zera">
        {data ? <Countdown endsAt={data.week.resetsAt} size="sm" tone="text" sound={false} criticalMs={0} label="Ranking zera em" /> : '—'}
      </Plaque>
    </dl>
  )
}
