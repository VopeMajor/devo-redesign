'use client'

import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LiveLayerTarget, LiveMatchLayer, useLiveChannel } from './live-match'

export type Pop = { id: number; text: string; tone: 'gold' | 'red' | 'white' }

/** Avisos curtos (COMBO x3, CLUTCH...) que aparecem e somem sem poluir a tela. */
export function usePops() {
  const [pops, setPops] = useState<Pop[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone: Pop['tone'] = 'gold', ms = 1100) => {
    const id = ++seq.current
    setPops((p) => [...p.slice(-2), { id, text, tone }])
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), ms)
  }, [])
  return { pops, push }
}

export function PopLayer({ pops }: { pops: Pop[] }) {
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[22%] z-30 flex flex-col items-center gap-2">
      {pops.map((p) => (
        <span
          key={p.id}
          className={cn(
            'animate-[devo-pop_0.35s_ease-out] font-mono text-2xl font-bold uppercase tracking-[0.2em] [text-shadow:0_0_18px_currentColor] md:text-3xl',
            p.tone === 'gold' && 'text-[#6f8cff]',
            p.tone === 'red' && 'text-[#8fa6ff]',
            p.tone === 'white' && 'text-foreground',
          )}
        >
          {p.text}
        </span>
      ))}
    </div>
  )
}

export function GameFrame({
  title,
  accent,
  onQuit,
  children,
  top,
  className,
  chat = true,
}: {
  title: string
  accent: string
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
    <div className={cn('relative flex h-full w-full flex-col overflow-hidden bg-[#090b0f] text-foreground', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}26, transparent 60%)` }}
      />
      <header className="relative z-20 flex shrink-0 items-center gap-3 border-b border-foreground/10 bg-black/40 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <button
          type="button"
          onClick={onQuit}
          aria-label="Desistir e sair"
          className="grid size-10 place-items-center text-foreground/60 transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.35em]" style={{ color: accent }}>
          {title}
        </p>
        <div className="ml-auto flex items-center gap-3 py-2">
          {top}
          {chat && liveChannel && <LiveMatchLayer channel={liveChannel} />}
        </div>
      </header>
      <div ref={setLayerEl} className="relative flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </div>
    </LiveLayerTarget>
  )
}

export function ScoreChip({ label, value, active, tone = 'me' }: { label: string; value: ReactNode; active?: boolean; tone?: 'me' | 'opp' }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col border px-2.5 py-1 transition-colors',
        tone === 'me' ? 'border-[#6f8cff]/40' : 'border-primary/40',
        active && (tone === 'me' ? 'bg-[#6f8cff]/10' : 'bg-primary/15'),
      )}
    >
      <span className="truncate text-[9px] uppercase tracking-[0.25em] text-foreground/50">{label}</span>
      <span className={cn('font-mono text-base tabular-nums leading-tight', tone === 'me' ? 'text-[#6f8cff]' : 'text-[#8fa6ff]')}>{value}</span>
    </div>
  )
}

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
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 backdrop-blur-[2px]">
      <span key={n} className="animate-[devo-pop_0.35s_ease-out] font-mono text-7xl font-bold text-foreground [text-shadow:0_0_30px_var(--primary)]">
        {n === 0 ? 'JÁ' : n}
      </span>
    </div>
  )
}

/** Antes da contagem online: mostra o adversário real enquanto o servidor sincroniza o início. */
export function WaitingStart({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-[2px]" role="status">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/50">Oponente encontrado</span>
      <span className="animate-[devo-pop_0.35s_ease-out] text-balance px-6 text-center font-mono text-2xl font-bold text-foreground [text-shadow:0_0_24px_var(--primary)]">
        {name}
      </span>
      <span className="font-mono text-xs text-foreground/50">Sincronizando...</span>
    </div>
  )
}

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms)
  } catch {}
}
