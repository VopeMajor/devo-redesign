'use client'

import type { CSSProperties } from 'react'
import useSWR from 'swr'
import { arcadeFetcher, arcadeKey, type PlayerStats } from '@/lib/devo/arcade/client'
import { PULSE_CRITICAL_MS, PULSE_START_HOURS, pulseRemaining, pulseRing } from '@/lib/devo/pulse'
import { cn } from '@/lib/utils'
import { formatDuration, useNow } from '../hooks'
import { Badge } from '../kit/badge'
import { Frame } from '../kit/frame'
import { GlyphAlert, GlyphHourglass, toRoman } from '../kit/glyphs'
import { Stamp } from '../kit/stamp'
import { Stat, StatGrid } from '../kit/stat'
import { TimeDigits } from '../kit/time'
import { Divider, Kicker } from '../kit/typography'
import { PulseDial } from '../os/pulse-dial'
import { useDevo } from '../state/devo-store'

const RULES = [
  'Cada jogador possui um timer no pulso. Quando ele zera, o jogador morre.',
  'A única forma de ganhar horas é jogando — e vencendo.',
  'Cartas podem alterar jogos, tempo e destinos. Guarde-as bem.',
  'O Anfitrião sempre observa.',
]

const HOUR = 3600 * 1000

export function PulsoApp() {
  const { state } = useDevo()
  const now = useNow(1000)
  // Mesma fonte e mesmo formato da barra de status e do cartão da home (lib/devo/pulse.ts).
  const remaining = pulseRemaining(state.timerEndsAt, now)
  const { excess } = pulseRing(remaining)
  const critical = remaining < PULSE_CRITICAL_MS
  const hoursLeft = Math.min(PULSE_START_HOURS, Math.ceil(remaining / HOUR))
  const extraHours = Math.max(0, Math.floor(remaining / HOUR) - PULSE_START_HOURS)
  const { data: stats } = useSWR<PlayerStats>(state.arcadeUnlocked ? arcadeKey('stats') : null, arcadeFetcher, { revalidateOnFocus: false })

  return (
    <div className="devo-scroll relative h-full overflow-y-auto @container">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[520px]',
          critical
            ? 'animate-dv-alert bg-[radial-gradient(60%_50%_at_50%_40%,rgba(213,31,43,0.28),transparent_70%)]'
            : 'bg-[radial-gradient(60%_50%_at_50%_40%,rgba(49,93,255,0.22),transparent_70%)]',
        )}
      />
      <div className="relative flex flex-col gap-5 px-4 pb-8 pt-4 @2xl:flex-row @2xl:items-start @2xl:gap-8 @2xl:px-6">
        {/* Herói: o mostrador */}
        <section aria-label="Tempo restante" className="flex flex-col items-center @2xl:w-1/2">
          <div className="animate-dv-fade flex w-full items-center justify-between gap-3">
            <Kicker tone={critical ? 'blood' : 'gold'}>Sinal vital · 72 horas</Kicker>
            {critical ? (
              <Badge tone="blood" live>
                Crítico
              </Badge>
            ) : (
              <Badge tone="cobalt" dot>
                Estável
              </Badge>
            )}
          </div>

          <div className="animate-dv-pop relative mt-3 grid aspect-square w-[min(88vw,330px)] place-items-center [animation-delay:120ms]">
            <PulseDial remaining={remaining} timerEndsAt={state.timerEndsAt} critical={critical} className="absolute inset-0 size-full" />
            <div className="relative flex flex-col items-center text-center">
              <p className={cn('dv-label text-[10px]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>Restante</p>
              <TimeDigits
                value={formatDuration(remaining)}
                size="lg"
                tone={critical ? 'blood' : 'text'}
                blinkColon={critical}
                label="Tempo restante"
                className="mt-1.5 text-[40px] [text-shadow:0_2px_16px_rgba(5,7,13,0.95)]"
              />
              <p
                className={cn(
                  'mt-2 font-display text-[13px] font-semibold uppercase tracking-[0.32em]',
                  critical ? 'animate-dv-blink text-dv-blood-text' : 'text-dv-cobalt-text',
                )}
              >
                {critical ? 'Crítico' : 'Estável'}
              </p>
              {excess > 0 && <p className="dv-label mt-1 text-[10px] text-dv-gold-bright">Acima de 72h</p>}
            </div>
          </div>

          {/* Barras: uma célula por hora das 72 */}
          <div className="animate-dv-rise mt-4 w-full [animation-delay:260ms]">
            <div className="flex items-baseline justify-between">
              <span className="dv-label text-[10px] text-dv-text-3">Reserva</span>
              <span className="dv-tabular font-mono text-[12px] text-dv-text-2">
                <span className={critical ? 'text-dv-blood-text' : 'text-dv-text'}>{hoursLeft}</span> / {PULSE_START_HOURS} h
                {extraHours > 0 && <span className="text-dv-gold-bright"> +{extraHours} h</span>}
              </span>
            </div>
            <div aria-hidden="true" className="mt-2 grid h-5 grid-cols-[repeat(72,minmax(0,1fr))] items-end gap-px">
              {Array.from({ length: PULSE_START_HOURS }, (_, i) => {
                const lit = i < hoursLeft
                const major = (i + 1) % 6 === 0
                return (
                  <span
                    key={i}
                    className={cn(
                      'block transition-colors duration-500',
                      major ? 'h-full' : 'h-3/5',
                      lit ? (critical ? 'bg-dv-blood shadow-[0_0_6px_rgba(213,31,43,0.8)]' : 'bg-dv-cobalt') : 'bg-dv-line',
                      lit && i === hoursLeft - 1 && 'animate-dv-blink',
                    )}
                  />
                )
              })}
            </div>
            <div aria-hidden="true" className="mt-1 flex justify-between font-display text-[10px] text-dv-gold/70">
              {[0, 2, 4, 6, 8, 10, 12].map((n) => (
                <span key={n}>{n === 0 ? '0' : toRoman(n)}</span>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 @2xl:w-1/2">
          {critical && (
            <Frame variant="alert" pad="md" className="animate-dv-cut-in" role="alert">
              <div className="flex items-start gap-3">
                <GlyphAlert className="mt-0.5 size-6 text-dv-blood-text" />
                <div>
                  <p className="font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">Tempo crítico</p>
                  <p className="mt-1 font-body text-[15px] leading-snug text-dv-text-2">Menos de 6 horas. Jogue e vença para recuperar horas antes que o pulso pare.</p>
                </div>
              </div>
            </Frame>
          )}

          <Frame pad="md" className="animate-dv-rise [animation-delay:320ms]">
            <StatGrid>
              <Stat label="Cartas" value={state.inventory.length} tone="cobalt" />
              <Stat label="Trocas" value={state.tradesCompleted} />
              <Stat label="Jogos" value={state.arcadeUnlocked ? (stats?.games ?? '—') : 0} tone="gold" />
            </StatGrid>
          </Frame>

          {/* Regras como documento */}
          <Frame variant="paper" cutSize={14} pad="none" className="animate-dv-rise [animation-delay:400ms]" innerClassName="px-5 pb-6 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Kicker tone="paper">Regulamento · Art. 1</Kicker>
                <h2 className="mt-1.5 font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-paper-ink">Regras do pulso</h2>
              </div>
              <GlyphHourglass className="mt-1 size-6 shrink-0 text-dv-cobalt-deep" />
            </div>
            <Divider variant="stitch" tone="paper" className="mt-3" />
            <ol className="mt-4 flex flex-col gap-3">
              {RULES.map((rule, i) => (
                <li key={rule} className="flex gap-3 font-body text-[16px] leading-relaxed text-dv-paper-ink">
                  <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 text-right font-display text-[14px] font-semibold text-dv-cobalt-deep">
                    {toRoman(i + 1)}.
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
            <div className="pointer-events-none absolute -bottom-3 right-3" style={{ '--dv-stamp-rot': '-10deg' } as CSSProperties}>
              <Stamp text="Pulso" shape="round" tone="cobalt" size={86} rotate={-10} />
            </div>
          </Frame>

          <p className="animate-dv-fade pt-2 text-center font-body text-[16px] italic text-dv-text-2 [animation-delay:480ms]">O tempo é a vida. O jogo é a única fonte dela.</p>
        </div>
      </div>
    </div>
  )
}
