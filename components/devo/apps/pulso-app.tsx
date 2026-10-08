'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { arcadeFetcher, arcadeKey, type PlayerStats } from '@/lib/devo/arcade/client'
import { PULSE_CRITICAL_MS, pulseRemaining, pulseRing } from '@/lib/devo/pulse'
import { formatDuration, useNow } from '../hooks'
import { useDevo } from '../state/devo-store'
import { Panel, SectionLabel } from './app-ui'

const RULES = [
  'Cada jogador possui um timer no pulso. Quando ele zera, o jogador morre.',
  'A única forma de ganhar horas é jogando — e vencendo.',
  'Cartas podem alterar jogos, tempo e destinos. Guarde-as bem.',
  'O Anfitrião sempre observa.',
]

export function PulsoApp() {
  const { state } = useDevo()
  const now = useNow(1000)
  // Mesma fonte e mesmo formato da barra de status e do cartão da home (lib/devo/pulse.ts).
  const remaining = pulseRemaining(state.timerEndsAt, now)
  const { ratio, excess } = pulseRing(remaining)
  const critical = remaining < PULSE_CRITICAL_MS
  const r = 92
  const circ = 2 * Math.PI * r
  const outer = r + 10
  const outerCirc = 2 * Math.PI * outer
  const seconds = Math.floor(remaining / 1000) % 60
  const { data: stats } = useSWR<PlayerStats>(state.arcadeUnlocked ? arcadeKey('stats') : null, arcadeFetcher, { revalidateOnFocus: false })

  return (
    <div className="devo-scroll h-full overflow-y-auto @container">
      <div className="flex flex-col gap-5 p-5 @2xl:flex-row">
        <section aria-label="Tempo restante" className="flex flex-col items-center gap-4 @2xl:w-1/2">
          <div className="relative grid size-56 place-items-center">
            <svg viewBox="0 0 220 220" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(236,238,242,0.1)" strokeWidth="2" />
              <circle cx="110" cy="110" r={outer} fill="none" stroke="rgba(236,238,242,0.08)" strokeWidth="1" strokeDasharray="2 6" />
              {excess > 0 && (
                <circle
                  cx="110"
                  cy="110"
                  r={outer}
                  fill="none"
                  stroke="#d8b25a"
                  strokeWidth="1.5"
                  strokeDasharray={outerCirc}
                  strokeDashoffset={outerCirc * (1 - excess)}
                  aria-hidden="true"
                />
              )}
              <circle
                cx="110"
                cy="110"
                r={r}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio)}
                className="drop-shadow-[0_0_8px_var(--primary)] transition-[stroke-dashoffset] duration-1000"
              />
              <SweepHand timerEndsAt={state.timerEndsAt} />
            </svg>
            <div className="relative text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Restante</p>
              <p className="mt-1 font-mono text-4xl tabular-nums text-foreground" aria-live="off">
                {formatDuration(remaining)}
              </p>
              <p className={critical ? 'mt-2 text-xs uppercase tracking-[0.3em] text-primary animate-blink' : 'mt-2 text-xs uppercase tracking-[0.3em] text-foreground/60'}>
                {critical ? 'Crítico' : 'Estável'}
              </p>
              {excess > 0 && <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#d8b25a]">Acima de 72h</p>}
            </div>
          </div>
          <div className="flex w-full items-end justify-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => (
              <span
                key={i}
                className="w-1 bg-primary/70"
                style={{ height: `${6 + ((i * 37 + seconds * 11) % 22)}px`, opacity: i / 40 < ratio ? 1 : 0.2 }}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4 @2xl:w-1/2">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Cartas" value={state.inventory.length} />
            <Stat label="Trocas" value={state.tradesCompleted} />
            <Stat label="Jogos" value={state.arcadeUnlocked ? (stats?.games ?? '—') : 0} />
          </div>
          <Panel>
            <SectionLabel>Regras do pulso</SectionLabel>
            <ol className="mt-3 flex flex-col gap-2.5">
              {RULES.map((rule, i) => (
                <li key={rule} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                  {rule}
                </li>
              ))}
            </ol>
          </Panel>
          <p className="text-center text-sm italic text-muted-foreground">O tempo é a vida. O jogo é a única fonte dela.</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Ponteiro de segundos contínuo (antes saltava de segundo em segundo e "voltava" a cada minuto).
 * Gira no sentido da contagem regressiva, atualizado por requestAnimationFrame sem re-render.
 */
function SweepHand({ timerEndsAt }: { timerEndsAt: number }) {
  const ref = useRef<SVGLineElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const left = Math.max(0, timerEndsAt - Date.now())
      const angle = ((left % 60_000) / 60_000) * 360
      ref.current?.setAttribute('transform', `rotate(${angle + 90} 110 110)`)
      if (left > 0) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [timerEndsAt])
  return <line ref={ref} x1="110" y1="110" x2="110" y2="24" stroke="rgba(236,238,242,0.5)" strokeWidth="1" />
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Panel className="p-3 text-center">
      <p className="text-2xl text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
    </Panel>
  )
}
