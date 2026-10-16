'use client'

import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SigilStar, Spinner, TimeDigits } from '@/components/devo/kit'
import { cn } from '@/lib/utils'
import { LiveLayerTarget, LiveMatchLayer, useLiveChannel } from './live-match'

/*
 * HUD comum dos quatro jogos da Sala de Jogos (Memory Rush, Living Chess, Bomba Quente, Blefe).
 * Paleta do mármore (IDENTIDADE §0): negro e branco com veios, aço champanhe nos filetes, ametista
 * pequena no que é seu/ativo, rubi só para perigo real (tempo acabando, peça grande perdida).
 */

/**
 * Tons dos avisos:
 * - `gold`: conquista (combo, perfect, captura) — aço champanhe;
 * - `amethyst`: pressão do oponente (ele achou um par, ele capturou) — ametista, sem alarme;
 * - `red`: perigo real (últimos segundos, sua dama caiu) — rubi;
 * - `white`: informação neutra (fase, roque).
 */
export type PopTone = 'gold' | 'amethyst' | 'red' | 'white'
export type Pop = { id: number; text: string; tone: PopTone }

/** Avisos curtos (COMBO x3, CLUTCH...) que aparecem e somem sem poluir a tela. */
export function usePops() {
  const [pops, setPops] = useState<Pop[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone: PopTone = 'gold', ms = 1100) => {
    const id = ++seq.current
    setPops((p) => [...p.slice(-1), { id, text, tone }])
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), ms)
  }, [])
  return { pops, push }
}

const POP_TEXT: Record<PopTone, string> = {
  gold: 'dv-brass-text',
  amethyst: 'text-dv-amethyst-text',
  red: 'text-white',
  white: 'text-dv-text',
}

const POP_BAND: Record<PopTone, string> = {
  gold: 'bg-[linear-gradient(90deg,transparent,rgba(12,12,14,0.92)_14%,rgba(21,21,23,0.95)_50%,rgba(12,12,14,0.92)_86%,transparent)]',
  amethyst: 'bg-[linear-gradient(90deg,transparent,rgba(30,27,43,0.92)_14%,rgba(42,37,66,0.95)_50%,rgba(30,27,43,0.92)_86%,transparent)]',
  red: 'bg-[linear-gradient(90deg,transparent,rgba(63,6,11,0.94)_14%,rgba(110,10,20,0.96)_50%,rgba(63,6,11,0.94)_86%,transparent)]',
  white: 'bg-[linear-gradient(90deg,transparent,rgba(12,12,14,0.88)_14%,rgba(21,21,23,0.9)_50%,rgba(12,12,14,0.88)_86%,transparent)]',
}

const POP_LINE: Record<PopTone, string> = {
  gold: 'via-dv-gold/80',
  amethyst: 'via-dv-amethyst',
  red: 'via-dv-blood-text',
  white: 'via-white/35',
}

const POP_STAR: Record<PopTone, string> = {
  gold: 'text-dv-gold',
  amethyst: 'text-dv-amethyst',
  red: 'text-dv-blood-text',
  white: 'text-dv-text-3',
}

/** Faixa de corte inclinada (−5°) que atravessa a tela: lida em 1 segundo, sai sozinha. */
export function PopLayer({ pops, className }: { pops: Pop[]; className?: string }) {
  return (
    <div aria-live="polite" className={cn('pointer-events-none absolute inset-x-0 top-[24%] z-30 flex flex-col items-center gap-2', className)}>
      {pops.map((p) => (
        <div key={p.id} className="relative w-full -rotate-[5deg] animate-dv-cut-in">
          <span aria-hidden="true" className={cn('absolute inset-0', POP_BAND[p.tone])} />
          <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent', POP_LINE[p.tone])} />
          <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent', POP_LINE[p.tone])} />
          <p className="relative flex items-center justify-center gap-3 px-6 py-2.5 text-center">
            <SigilStar className={cn('size-3 shrink-0', POP_STAR[p.tone])} />
            <span className={cn('font-impact text-[24px] font-semibold uppercase leading-none tracking-[0.12em] md:text-[30px]', POP_TEXT[p.tone])}>{p.text}</span>
            <SigilStar className={cn('size-3 shrink-0', POP_STAR[p.tone])} />
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Moldura de partida: cabeçalho de veludo negro com filete de aço, botão de sair (44px), título do
 * jogo e um subtítulo de estado (fase, modo); o resto do cabeçalho é livre (`top`).
 * O fundo é mármore negro com uma luz fria discreta no alto (atmosfera, não cor de tela).
 */
export function GameFrame({
  title,
  sub,
  onQuit,
  children,
  top,
  className,
  chat = true,
}: {
  title: string
  /** Linha pequena sob o título (fase, modo). */
  sub?: string
  /** Mantido por compatibilidade (cor antiga de cada jogo); a paleta agora é única. */
  accent?: string
  onQuit: () => void
  children: ReactNode
  top?: ReactNode
  className?: string
  chat?: boolean
}) {
  const liveChannel = useLiveChannel()
  const [layerEl, setLayerEl] = useState<HTMLDivElement | null>(null)
  return (
    <LiveLayerTarget el={layerEl}>
      <div className={cn('dv-marble-dark relative flex h-full w-full flex-col overflow-hidden text-dv-text', className)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 45% at 50% 0%, rgba(111,107,130,0.16), transparent 70%), radial-gradient(120% 80% at 50% 120%, rgba(0,0,0,0.75), transparent 60%)',
          }}
        />
        <header className="dv-velvet relative z-20 flex shrink-0 items-center gap-2 pl-1 pr-2 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={onQuit}
            aria-label="Desistir e sair"
            className="dv-focus grid size-11 shrink-0 place-items-center text-dv-text-3 transition-[color,transform] hover:text-dv-text active:scale-95"
          >
            <X className="size-5" strokeWidth={1.4} />
          </button>
          <div className="flex min-w-0 flex-col py-2">
            <p className="truncate font-display text-[13px] font-semibold uppercase leading-tight tracking-[0.16em] text-dv-text">{title}</p>
            {sub && <p className="dv-label mt-0.5 truncate text-[10px] leading-tight tracking-[0.18em] text-dv-gold">{sub}</p>}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 py-1.5">
            {top}
            {chat && liveChannel && <LiveMatchLayer channel={liveChannel} />}
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dv-gold/60 to-transparent" />
        </header>
        <div ref={setLayerEl} className="relative flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </LiveLayerTarget>
  )
}

/** Relógio da partida (mm:ss) em dígitos de largura fixa; vira rubi e pulsa quando `critical`. */
export function HudClock({ ms, critical = false, label = 'Tempo restante', size = 'sm' }: { ms: number; critical?: boolean; label?: string; size?: 'sm' | 'md' }) {
  const secs = Math.max(0, Math.ceil(ms / 1000))
  const value = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  return (
    <span className={cn('inline-flex items-center gap-2 border px-2.5 py-1.5', critical ? 'border-dv-blood bg-dv-blood-deep/70' : 'border-dv-line-strong bg-dv-ink/70')}>
      <span aria-hidden="true" className={cn('size-1.5 rotate-45', critical ? 'animate-dv-blink bg-dv-blood-text' : 'bg-dv-gold')} />
      <TimeDigits value={value} size={size} tone={critical ? 'blood' : 'text'} label={label} />
    </span>
  )
}

/**
 * Plaqueta de placar: rótulo pequeno + número de impacto. `me` é o seu lado (branco, com joia
 * ametista quando você lidera); `opp` é o oponente (aço). `active` = quem está na frente/na vez.
 */
export function ScoreChip({
  label,
  value,
  active,
  tone = 'me',
  align,
  className,
}: {
  label: string
  value: ReactNode
  active?: boolean
  tone?: 'me' | 'opp'
  align?: 'left' | 'right'
  className?: string
}) {
  const me = tone === 'me'
  const right = (align ?? (me ? 'left' : 'right')) === 'right'
  return (
    <div
      className={cn('relative isolate flex min-w-0 flex-col gap-1 px-3 py-1.5', right ? 'items-end text-right' : 'items-start', className)}
      style={{ '--dv-cut': '8px' } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut-diag absolute inset-0 -z-10 transition-opacity duration-[220ms]',
          active ? (me ? 'bg-[linear-gradient(135deg,#cbc5e8,#5a4f8f_40%,#2c2c31)]' : 'bg-[linear-gradient(135deg,#ece5d8,#6b6357_45%,#2c2c31)]') : 'bg-dv-line-strong',
        )}
      />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]" style={{ '--dv-cut': '7.5px' } as CSSProperties} />
      <span className={cn('flex max-w-full items-center gap-1.5', right && 'flex-row-reverse')}>
        <span
          aria-hidden="true"
          className={cn('size-1.5 shrink-0 rotate-45', active ? (me ? 'bg-dv-amethyst shadow-[0_0_8px_var(--dv-amethyst)]' : 'bg-dv-gold-bright') : 'bg-dv-text-3')}
        />
        <span className="dv-label truncate text-[10px] tracking-[0.18em] text-dv-text-2">{label}</span>
      </span>
      <span className={cn('font-impact text-[26px] font-semibold leading-none dv-tabular', me ? 'text-white' : 'text-dv-gold-bright')}>{value}</span>
    </div>
  )
}

/** Linha de estado da partida (centro do placar): neutra, de liderança, de pressão (ametista) ou de perigo (rubi). */
export function PressureLine({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'lead' | 'amethyst' | 'alert' }) {
  return (
    <span
      key={text}
      className={cn(
        'dv-label inline-block animate-dv-fade whitespace-nowrap text-[10px] tracking-[0.16em]',
        tone === 'alert' && 'text-dv-blood-text',
        tone === 'amethyst' && 'text-dv-amethyst-text',
        tone === 'lead' && 'text-white',
        tone === 'neutral' && 'text-dv-text-3',
      )}
    >
      {text}
    </span>
  )
}

const DIAL_TICKS = Array.from({ length: 12 }, (_, i) => i)

/** Contagem 3·2·1·JÁ dentro de um pequeno mostrador de aço (o relógio é o juiz). */
export function Countdown321({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    const timers = [1, 2, 3].map((i) => window.setTimeout(() => setN(3 - i), i * 650))
    timers.push(window.setTimeout(() => doneRef.current(), 3 * 650 + 400))
    return () => timers.forEach(clearTimeout)
  }, [])
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-dv-ink/75 backdrop-blur-[2px]" role="status" aria-label={n === 0 ? 'Já' : String(n)}>
      <style>{'@keyframes dv-countdown-arc{to{stroke-dashoffset:0}}'}</style>
      <div className="relative grid size-52 place-items-center">
        <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full">
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.55" strokeWidth="1" />
          <circle cx="100" cy="100" r="84" fill="rgba(12,12,14,0.72)" stroke="var(--dv-gold)" strokeOpacity="0.25" strokeWidth="0.6" />
          {DIAL_TICKS.map((i) => (
            <line
              key={i}
              x1="100"
              y1="10"
              x2="100"
              y2={i % 3 === 0 ? 22 : 17}
              stroke="var(--dv-gold-bright)"
              strokeOpacity={i % 3 === 0 ? 0.9 : 0.45}
              strokeWidth={i % 3 === 0 ? 2 : 1}
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
          <circle
            key={n}
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="var(--dv-amethyst)"
            strokeWidth="2"
            strokeDasharray="578"
            strokeDashoffset="578"
            transform="rotate(-90 100 100)"
            className="motion-reduce:hidden"
            style={{ animation: 'dv-countdown-arc 650ms linear forwards' }}
          />
        </svg>
        <span
          key={n}
          aria-hidden="true"
          className={cn('relative animate-dv-pop font-impact font-semibold leading-none', n === 0 ? 'text-[64px] tracking-[0.08em] text-white' : 'dv-brass-text text-[110px]')}
        >
          {n === 0 ? 'JÁ' : n}
        </span>
      </div>
    </div>
  )
}

/** Antes da contagem online: mostra o adversário real enquanto o servidor sincroniza o início. */
export function WaitingStart({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-dv-ink/80 px-6 backdrop-blur-[2px]" role="status">
      <span className="dv-label text-[10px] text-dv-gold">Oponente encontrado</span>
      <span aria-hidden="true" className="h-px w-24 bg-gradient-to-r from-transparent via-dv-gold/70 to-transparent" />
      <span className="animate-dv-pop text-balance text-center font-display text-[26px] font-semibold uppercase tracking-[0.08em] text-white">{name}</span>
      <span className="flex items-center gap-2 text-dv-text-3">
        <Spinner className="size-4" />
        <span className="dv-label text-[10px]">Sincronizando…</span>
      </span>
    </div>
  )
}

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms)
  } catch {}
}
