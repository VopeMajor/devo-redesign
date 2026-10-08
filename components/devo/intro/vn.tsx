'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { GlyphArrow, GlyphDiamond, toRoman } from '../kit/glyphs'
import { SoundToggle } from '../shared/sound-toggle'

/**
 * Peças de visual novel do DEVO (prólogo e tutorial): máquina de escrever com pausas de pontuação,
 * caixa de diálogo com placa do falante, indicador de avanço, escolhas em tiras e barra superior.
 * Candidatas ao kit (ver relatório da área ENTRADA).
 */

/** Pausa extra depois de pontuação: o texto "respira" como fala, não como impressora. */
function pauseAfter(ch: string | undefined) {
  if (!ch) return 0
  if (ch === '…') return 320
  if ('.!?'.includes(ch)) return 220
  if (',;:'.includes(ch)) return 110
  return 0
}

export function useTypewriter(text: string, charMs = 28) {
  // O progresso fica preso ao texto: ao trocar de fala, começa do zero no mesmo render (sem "piscar" pronto).
  const [state, setState] = useState({ text, shown: 0 })
  const shown = state.text === text ? state.shown : 0
  const done = shown >= text.length
  useEffect(() => {
    if (done) return
    const prev = text[shown - 1]
    const next = text[shown]
    const id = window.setTimeout(
      () => {
        setState({ text, shown: shown + 1 })
        if (shown % 3 === 0 && next !== ' ') playSfx('type')
      },
      charMs + (next === ' ' ? pauseAfter(prev) : 0),
    )
    return () => window.clearTimeout(id)
  }, [shown, done, text, charMs])
  return { shown, done, finish: () => setState({ text, shown: text.length }) }
}

export type PlateTone = 'cobalt' | 'gold' | 'void'

const PLATE: Record<PlateTone, { fill: string; edge: string; name: string }> = {
  cobalt: { fill: 'bg-[linear-gradient(100deg,#0d1f7a,var(--dv-cobalt-deep)_60%,#3d63ff)]', edge: 'bg-dv-gold', name: 'text-white' },
  gold: { fill: 'bg-[linear-gradient(100deg,var(--dv-gold-deep),#a8833e_55%,var(--dv-gold))]', edge: 'bg-dv-gold-bright', name: 'text-dv-ink' },
  void: { fill: 'bg-[linear-gradient(100deg,#000,var(--dv-ink-3)_70%,var(--dv-ink-4))]', edge: 'bg-dv-gold', name: 'text-dv-gold-bright' },
}

/** Placa do falante: paralelogramo inclinado que entra com corte a cada troca de falante. */
export function SpeakerPlate({ name, title, tone = 'cobalt', avatar }: { name: string; title?: string; tone?: PlateTone; avatar?: ReactNode }) {
  const p = PLATE[tone]
  return (
    <span className="absolute -top-[22px] left-3 z-10 flex items-end gap-2" aria-hidden="true">
      {avatar && (
        <span className="relative -mb-1 grid size-12 place-items-center overflow-hidden border border-dv-gold/70 bg-dv-ink-2 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
          {avatar}
        </span>
      )}
      <span className={cn('en-plate-in relative flex items-center px-5 py-1.5 shadow-[4px_4px_0_rgba(0,0,0,0.55)]', p.fill)}>
        <span className={cn('absolute inset-y-0 left-0 w-[3px]', p.edge)} />
        <span className="flex skew-x-[14deg] items-baseline gap-2.5">
          <span className={cn('font-display text-[15px] font-semibold uppercase tracking-[0.18em]', p.name)}>{name}</span>
          {title && <span className={cn('font-body text-[13px] italic', tone === 'gold' ? 'text-dv-ink/70' : 'text-white/65')}>{title}</span>}
        </span>
      </span>
    </span>
  )
}

/** Indicador de avanço: losango que respira e seta que quica. Some enquanto o texto ainda escreve. */
export function AdvanceIndicator({ visible, label, tone = 'cobalt' }: { visible: boolean; label?: string; tone?: 'cobalt' | 'paper' | 'gold' }) {
  const color = tone === 'paper' ? 'text-dv-cobalt-deep' : tone === 'gold' ? 'text-dv-gold-bright' : 'text-dv-cobalt-text'
  return (
    <span aria-hidden="true" className={cn('flex items-center gap-2 transition-opacity duration-[220ms]', visible ? 'opacity-100' : 'opacity-0', color)}>
      {label && <span className="dv-label text-[10px]">{label}</span>}
      <span className="en-bob relative grid size-4 place-items-center">
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <path d="M2 5 L8 12 L14 5 Z" />
        </svg>
      </span>
    </span>
  )
}

/** Fundo de caixa de diálogo: ink com filete (gold/cobalt) e chanfro diagonal. */
export function DialogueShell({
  tone = 'gold',
  className,
  children,
  style,
}: {
  tone?: 'gold' | 'cobalt' | 'neutral'
  className?: string
  children: ReactNode
  style?: CSSProperties
}) {
  const line =
    tone === 'gold'
      ? 'bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_30%,var(--dv-gold)_60%,var(--dv-gold-deep))]'
      : tone === 'cobalt'
        ? 'bg-[linear-gradient(135deg,#8ea6ff,var(--dv-cobalt)_35%,var(--dv-cobalt-dim)_70%,var(--dv-cobalt))]'
        : 'bg-dv-line-strong'
  return (
    <span className={cn('relative block', className)} style={{ '--dv-cut': '16px', ...style } as CSSProperties}>
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0', line)} />
      <span
        aria-hidden="true"
        className="dv-cut-diag absolute inset-px bg-[linear-gradient(180deg,rgba(17,26,46,0.94),rgba(10,15,28,0.95)_45%,rgba(5,7,13,0.97))] backdrop-blur-md"
        style={{ '--dv-cut': '15.6px' } as CSSProperties}
      />
      <span aria-hidden="true" className="absolute inset-x-[12%] top-px h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <span className="relative block">{children}</span>
    </span>
  )
}

/**
 * Escolha como tira: índice romano de impacto, texto em serifa, entra em cascata pela direita.
 * Estados: hover/foco (filete cobalto, desliza), pressionado (escala), ação (itálico + selo).
 */
export function ChoiceStrip({
  index,
  label,
  onClick,
  muted = false,
  action = false,
  delay = 0,
}: {
  index: number
  label: string
  onClick: () => void
  muted?: boolean
  action?: boolean
  delay?: number
}) {
  return (
    <div className="animate-dv-slide-left" style={{ animationDelay: `${delay}ms` }}>
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => playSfx('hover')}
      style={{ '--dv-cut': '12px' } as CSSProperties}
      className={cn(
        'group relative isolate flex min-h-12 w-full items-stretch text-left transition-transform duration-[220ms] ease-out',
        'dv-focus hover:translate-x-1 focus-visible:translate-x-1 active:scale-[0.98]',
        index % 2 === 1 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut-diag absolute inset-0 -z-10 transition-colors duration-[220ms]',
          muted ? 'bg-dv-line-strong' : 'bg-[linear-gradient(100deg,rgba(236,238,242,0.45),rgba(236,238,242,0.15))] group-hover:bg-[linear-gradient(100deg,#8ea6ff,var(--dv-cobalt))] group-focus-visible:bg-[linear-gradient(100deg,#8ea6ff,var(--dv-cobalt))]',
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut-diag dv-sheen absolute inset-px -z-10 overflow-hidden transition-colors duration-[220ms]',
          muted ? 'bg-dv-ink/85' : 'bg-[linear-gradient(90deg,rgba(10,15,28,0.94),rgba(5,7,13,0.9))] group-hover:bg-[linear-gradient(90deg,var(--dv-cobalt-dim),rgba(10,15,28,0.94))]',
        )}
        style={{ '--dv-cut': '11.6px' } as CSSProperties}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex w-12 shrink-0 items-center justify-center font-impact text-[22px] font-semibold leading-none -skew-x-[8deg] transition-colors',
          muted ? 'text-dv-text-3' : 'text-dv-cobalt-text group-hover:text-white',
        )}
      >
        {muted ? <GlyphArrow className="size-5 skew-x-[8deg]" /> : toRoman(index + 1)}
      </span>
      <span aria-hidden="true" className="my-2.5 w-px bg-dv-line-strong" />
      <span
        className={cn(
          'flex flex-1 items-center gap-2 py-2.5 pl-3.5 pr-4 font-body text-[16px] leading-snug',
          muted ? 'font-display text-[13px] uppercase tracking-[0.24em] text-dv-text-2' : 'text-dv-text',
          action && 'italic text-dv-gold-bright',
        )}
      >
        {action && <span className="dv-label shrink-0 border border-dv-gold/50 px-1.5 py-0.5 text-[10px] not-italic text-dv-gold">Ação</span>}
        {label}
      </span>
    </button>
    </div>
  )
}

/** Cabeçalho das escolhas: quem fala + linha. */
export function ChoiceHeader({ children }: { children: ReactNode }) {
  return (
    <p className="dv-label animate-dv-fade flex items-center gap-2 text-[10px] text-dv-text-2">
      <GlyphDiamond className="size-2.5 text-dv-cobalt-text" filled />
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" aria-hidden="true" />
    </p>
  )
}

/** Barra superior da encenação: capítulo à esquerda; som e "pular" à direita (discretos, ≥44px). */
export function VnTopBar({ chapter, skipLabel, onSkip }: { chapter: ReactNode; skipLabel: string; onSkip: () => void }) {
  return (
    <div className="dv-safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-8">
      <div className="pointer-events-auto min-w-0 pt-2.5">{chapter}</div>
      <div className="pointer-events-auto flex items-center gap-1">
        <SoundToggle compact className="min-h-11 min-w-11 justify-center text-dv-text-2 hover:text-dv-text" />
        <button
          type="button"
          onClick={() => {
            playSfx('whoosh')
            onSkip()
          }}
          className="dv-focus group flex min-h-11 items-center gap-2 px-2 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-text-2 transition-colors hover:text-dv-text"
        >
          {skipLabel}
          <GlyphArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
