'use client'

import Image from 'next/image'
import { type CSSProperties, useState } from 'react'
import { Button, Frame, Kicker, SceneBackdrop, ScreenFrame, Stamp, TimeDigits } from '@/components/devo/kit'
import type { GameOutcome, MatchFinish, MatchStart } from '@/lib/devo/arcade/client'
import { formatPoints } from '@/lib/devo/arcade/client'
import { GAMES, type GameId, RANKING_RULE_CASUAL, RANKING_RULE_EVENT } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { formatMinutes } from './arcade-shared'
import { GAME_ART, JavaliPortrait, Monogram } from './sala-ui'

export type Running = { start: MatchStart; finish?: MatchFinish & { outcome: GameOutcome }; error?: string }

/* ── Fila: "Procurando oponente" ───────────────────────────────────────────────────── */

export function Searching({ gameId, duel, onCancel }: { gameId: GameId; duel: boolean; onCancel: () => void }) {
  const [since] = useState(() => Date.now())
  const now = useNow(1000)
  const secs = Math.max(0, Math.floor((now - since) / 1000))
  const g = GAMES[gameId]
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  return (
    <div className="absolute inset-0 z-30 flex animate-dv-fade flex-col overflow-y-auto bg-[rgba(3,4,8,0.9)] backdrop-blur-sm" role="status" aria-live="polite">
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-5 py-8 text-center">
        {/* radar: anéis, varredura e marcas de relógio */}
        <div aria-hidden="true" className="relative size-56 shrink-0">
          <span className="absolute inset-0 rounded-full border border-dv-gold/40" />
          <span className="absolute inset-[18%] rounded-full border border-dv-cobalt/40" />
          <span className="absolute inset-[36%] rounded-full border border-dv-cobalt/30" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-dv-line" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-dv-line" />
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="absolute left-1/2 top-0 h-full w-px" style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}>
              <span className={cn('absolute left-0 top-0 w-px bg-dv-gold', i % 3 === 0 ? 'h-3' : 'h-1.5 opacity-60')} />
            </span>
          ))}
          <span className="absolute inset-0 animate-dv-spin rounded-full bg-[conic-gradient(from_0deg,rgba(138,124,200,0.55),rgba(138,124,200,0)_28%,transparent_100%)] [animation-duration:2.6s]" />
          <span className="absolute left-[68%] top-[30%] size-2 animate-dv-blink rounded-full bg-dv-cobalt-text shadow-[0_0_10px_var(--dv-cobalt)]" />
          <span className="absolute left-[24%] top-[62%] size-1.5 animate-dv-blink rounded-full bg-dv-gold [animation-delay:-0.5s]" />
          <span className="dv-cut absolute inset-[34%] overflow-hidden" style={{ '--dv-cut': '12px' } as CSSProperties}>
            <Image src={GAME_ART[gameId].src} alt="" fill sizes="80px" className="object-cover" style={{ objectPosition: GAME_ART[gameId].position }} />
          </span>
        </div>

        <div>
          <Kicker tone="gold" className="justify-center">
            {g.name}
          </Kicker>
          <p className="mt-2 font-display text-[24px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text">{duel ? 'Aguardando seu adversário' : 'Procurando oponente'}</p>
          <div className="mt-3 flex justify-center">
            <TimeDigits value={clock} size="md" tone="cobalt" label="Tempo na fila" />
          </div>
        </div>
        <p className="font-body text-[16px] leading-relaxed text-dv-text-2">
          {duel ? 'A partida começa assim que o outro jogador da chave entrar.' : 'Você será pareado com outro jogador real que estiver na fila.'}
        </p>
        <Button variant="secondary" size="lg" block onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

/* ── Resultado ─────────────────────────────────────────────────────────────────────── */

export function ResultScreen({ run, onClose }: { run: Running; onClose: () => void }) {
  const f = run.finish!
  const o = f.outcome
  const win = o.result === 'win'
  const draw = o.result === 'draw'
  const loss = !win && !draw
  const g = GAMES[run.start.gameId as GameId]
  const title = win ? 'Vitória' : draw ? 'Empate' : 'Derrota'
  // Vermelho só quando a derrota custa Tempo. Treino nunca é alerta: ink com faixa neutra/cobalto.
  const costly = loss && !f.tutorial
  const band = win ? 'bg-dv-cobalt-deep' : costly ? 'bg-dv-blood' : f.tutorial ? 'bg-[linear-gradient(90deg,var(--dv-cobalt-dim),#1b2a6e_60%,var(--dv-ink-4))]' : 'bg-dv-ink-4'
  const javali = run.start.mode === 'treino' || /javali/i.test(run.start.opponent.name)
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <SceneBackdrop preset="table" intensity={0.5} dim={0.6} alert={costly} />
      <ScreenFrame tone={win ? 'gold' : costly ? 'blood' : 'cobalt'} />
      {/* corte diagonal que atravessa a tela */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute left-[-30%] top-[13%] h-32 w-[160%] -rotate-[14deg] animate-dv-cut-in opacity-90', band)} />
      <span aria-hidden="true" className="pointer-events-none absolute left-[-30%] top-[13%] h-32 w-[160%] -rotate-[14deg] translate-y-[8.5rem] border-t border-dv-gold/60" />

      <div className="devo-scroll relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 pb-[max(env(safe-area-inset-bottom),2rem)] pt-[max(env(safe-area-inset-top),2.5rem)]">
        <div className="flex w-full max-w-md flex-1 flex-col">
          <Kicker tone={costly ? 'blood' : 'gold'} className="animate-dv-fade">
            {g.name} · vs {run.start.opponent.name}
          </Kicker>
          <div className="relative mt-6 min-h-[11rem]">
            <h1 className="relative w-fit animate-dv-cut-in font-impact text-[76px] font-bold uppercase leading-[0.85] tracking-[0.01em] text-white [text-shadow:0_4px_0_rgba(0,0,0,0.45)] -skew-x-[8deg]">{title}</h1>
            <div className="absolute -right-1 top-[4.6rem]">
              {win ? (
                <Stamp shape="round" tone="gold" text="Vitória" ring="DEVO · SALA DE JOGOS · A CASA AGRADECE ·" size={104} rotate={12} animate />
              ) : f.tutorial ? (
                <Stamp shape="round" tone="cobalt" text="Treino" ring="SEM CUSTO · SEM RANKING · SEM TEMPO ·" size={104} rotate={-10} animate />
              ) : loss ? null : (
                <Stamp tone="cobalt" text="Empate" size={110} rotate={-8} animate />
              )}
            </div>
          </div>

          {/* placar: o número do HUD, igual ao gravado pelo servidor */}
          <dl className="mt-6 grid animate-dv-rise grid-cols-[1fr_auto_1fr] items-end gap-3 [animation-delay:200ms]">
            <div className="flex flex-col items-start gap-2">
              <Monogram name="Você" size="md" tone="cobalt" />
              <dt className="dv-label text-[10px] text-dv-text-3">Seu placar</dt>
              <dd className={cn('font-impact text-[52px] font-bold leading-none dv-tabular', win ? 'text-dv-text' : 'text-dv-text-2')}>{formatPoints(o.score)}</dd>
            </div>
            <span aria-hidden="true" className="pb-3 font-impact text-[22px] italic text-dv-text-3">
              ×
            </span>
            <div className="flex flex-col items-end gap-2 text-right">
              {javali ? <JavaliPortrait shape="round" className="w-12" title={run.start.opponent.name} /> : <Monogram name={run.start.opponent.name} size="md" tone="neutral" />}
              <dt className="dv-label text-[10px] text-dv-text-3">Placar do oponente</dt>
              <dd className={cn('font-impact text-[52px] font-bold leading-none dv-tabular', loss ? 'text-dv-text' : 'text-dv-text-2')}>{formatPoints(o.oppScore)}</dd>
            </div>
          </dl>
          {o.bonus > 0 && (
            <p className="dv-label mt-2 text-[10px] text-dv-text-3">
              Inclui +{formatPoints(o.bonus)} de {o.bonusLabel.toLowerCase()}
            </p>
          )}

          <Frame pad="md" tone={win ? 'gold' : costly ? 'blood' : 'cobalt'} className="mt-6 animate-dv-rise [animation-delay:320ms]">
            {/* Pontos de ranking = o que entra no ranking (rankingPoints), não o placar. */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <ResultStat label="Pontos de ranking" value={f.tutorial ? '—' : `+${formatPoints(f.awarded)}`} tone="cobalt" hint={f.tutorial ? 'não conta no treino' : undefined} />
              <ResultStat label="Tempo ganho" value={f.tutorial ? '—' : `+${formatMinutes(f.timeGainMin)}`} tone="gold" hint={f.tutorial ? 'treino é de graça' : undefined} />
              <ResultStat label="Pontos na semana" value={formatPoints(f.weekScore)} />
              <ResultStat label="Posição" value={f.rank ? `#${f.rank}` : '—'} />
            </dl>
            <p className="mt-4 border-t border-dv-line pt-3 font-body text-[14px] leading-relaxed text-dv-text-2">
              {f.tutorial ? 'Treino contra o bot não vale ranking nem Tempo.' : run.start.mode === 'evento' ? RANKING_RULE_EVENT : RANKING_RULE_CASUAL}
            </p>
          </Frame>

          <div className="mt-auto flex animate-dv-fade flex-col gap-4 pt-6 [animation-delay:450ms]">
            <div className="flex items-center gap-3">
              <JavaliPortrait shape="round" className="w-12" />
              <p className="font-body text-[16px] italic leading-snug text-dv-text-2">
                <span className="dv-label mb-0.5 block text-[10px] not-italic text-dv-gold">Javali</span>
                {f.tutorial ? 'Treino é por conta da casa. A próxima, querido, vale Tempo.' : win ? 'A casa agradece o espetáculo.' : costly ? 'O relógio cobra. A casa só observa.' : 'Empate não paga a casa. Tente de novo.'}
              </p>
            </div>
            <Button block size="lg" onClick={onClose} sfx="close">
              Voltar à mesa
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultStat({ label, value, tone, hint }: { label: string; value: string; tone?: 'cobalt' | 'gold'; hint?: string }) {
  return (
    <div className="relative pl-3">
      <span aria-hidden="true" className={cn('absolute bottom-1 left-0 top-1 w-[2px]', tone === 'cobalt' ? 'bg-dv-cobalt' : tone === 'gold' ? 'bg-dv-gold' : 'bg-dv-line-strong')} />
      <dt className="dv-label text-[10px] text-dv-text-3">{label}</dt>
      <dd className={cn('mt-1 font-impact text-[26px] font-semibold leading-none dv-tabular', tone === 'cobalt' ? 'text-dv-cobalt-text' : tone === 'gold' ? 'text-dv-gold-bright' : 'text-dv-text')}>{value}</dd>
      {hint && <dd className="mt-1 font-body text-[13px] italic text-dv-text-3">{hint}</dd>}
    </div>
  )
}
