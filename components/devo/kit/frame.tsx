import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CornerFiligree } from './glyphs'
import { FiligreeCorner } from './ornament/brass'
import { SectionHeader } from './typography'

export type FrameVariant = 'ink' | 'paper' | 'alert' | 'glass'
export type FrameTone = 'gold' | 'cobalt' | 'neutral' | 'blood'
export type FrameCut = 'all' | 'diag' | 'none'

/** Cor do filete (camada de borda) por tom. Ouro tem gradiente "metal escovado". */
export const FRAME_LINE: Record<FrameTone, string> = {
  gold: 'bg-[linear-gradient(135deg,var(--dv-gold-bright)_0%,var(--dv-gold-deep)_28%,var(--dv-gold)_55%,var(--dv-gold-deep)_80%,var(--dv-gold-bright)_100%)]',
  cobalt: 'bg-[linear-gradient(135deg,#8ea6ff_0%,var(--dv-cobalt)_35%,var(--dv-cobalt-dim)_70%,var(--dv-cobalt)_100%)]',
  neutral: 'bg-dv-line-strong',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
}

const FILL: Record<FrameVariant, string> = {
  ink: 'bg-[linear-gradient(180deg,var(--dv-ink-3)_0%,var(--dv-ink-2)_55%,var(--dv-ink)_100%)]',
  paper: 'dv-paper-bg',
  alert: 'bg-[linear-gradient(160deg,var(--dv-blood-deep)_0%,#1a0507_45%,var(--dv-ink)_100%)]',
  glass: 'bg-[color-mix(in_oklab,var(--dv-ink-2)_72%,transparent)] backdrop-blur-md',
}

const TEXT: Record<FrameVariant, string> = {
  ink: 'text-dv-text',
  paper: 'text-dv-paper-ink',
  alert: 'text-dv-text',
  glass: 'text-dv-text',
}

const CUT: Record<FrameCut, string> = { all: 'dv-cut', diag: 'dv-cut-diag', none: '' }

export type FrameProps = HTMLAttributes<HTMLElement> & {
  variant?: FrameVariant
  tone?: FrameTone
  cut?: FrameCut
  /** Tamanho do chanfro em px (padrão 12). */
  cutSize?: number
  /** Cantos de filigrana dourada (use em 1–2 elementos por tela: o foco). */
  ornate?: boolean
  /** Brilho externo na cor do tom. */
  glow?: boolean
  as?: 'div' | 'section' | 'article' | 'aside' | 'figure' | 'header' | 'footer'
  /** Padding interno: none | sm (12) | md (16) | lg (24). */
  pad?: 'none' | 'sm' | 'md' | 'lg'
  innerClassName?: string
  children?: ReactNode
}

const PAD = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const

const GLOW: Record<FrameTone, string> = {
  gold: 'drop-shadow-[0_0_14px_rgba(236,229,216,0.22)]',
  cobalt: 'drop-shadow-[0_0_18px_rgba(138,124,200,0.4)]',
  neutral: 'drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]',
  blood: 'drop-shadow-[0_0_18px_rgba(170,20,32,0.45)]',
}

/**
 * Moldura base do DEVO: duas camadas recortadas (filete + preenchimento) e conteúdo livre por cima.
 * O conteúdo NÃO é recortado (carimbos e selos podem vazar a borda).
 */
export function Frame({
  variant = 'ink',
  tone = variant === 'alert' ? 'blood' : variant === 'paper' ? 'gold' : 'neutral',
  cut = 'all',
  cutSize = 12,
  ornate = false,
  glow = false,
  as: Tag = 'div',
  pad = 'md',
  className,
  innerClassName,
  style,
  children,
  ...rest
}: FrameProps) {
  const vars = { '--dv-cut': `${cutSize}px`, ...style } as CSSProperties
  return (
    <Tag className={cn('relative isolate', TEXT[variant], glow && GLOW[tone], className)} style={vars} {...rest}>
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-10', CUT[cut], FRAME_LINE[tone])} />
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-px -z-10', CUT[cut], FILL[variant])}
        style={{ '--dv-cut': `${Math.max(0, cutSize - 0.4)}px` } as CSSProperties}
      />
      {variant === 'ink' && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-[14%] top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}
      {variant === 'alert' && (
        <span aria-hidden="true" className="dv-hazard pointer-events-none absolute bottom-2 right-3 -z-10 h-2.5 w-14 opacity-80" />
      )}
      {ornate && <FrameCorners tone={tone === 'neutral' ? 'gold' : tone} />}
      <div className={cn('relative', PAD[pad], innerClassName)}>{children}</div>
    </Tag>
  )
}

/** Quatro cantos de filigrana. Fica dentro do Frame; use avulso em qualquer bloco `relative`. */
export function FrameCorners({ tone = 'gold', size = 22, inset = 3, className }: { tone?: FrameTone; size?: number; inset?: number; className?: string }) {
  const color = tone === 'gold' ? 'text-dv-gold' : tone === 'cobalt' ? 'text-dv-cobalt-text' : tone === 'blood' ? 'text-dv-blood-text' : 'text-dv-text-3'
  const pos = [
    { s: { left: inset, top: inset }, r: 0 },
    { s: { right: inset, top: inset }, r: 90 },
    { s: { right: inset, bottom: inset }, r: 180 },
    { s: { left: inset, bottom: inset }, r: 270 },
  ]
  // Ouro = filigrana de latão (metal com gradiente); os outros tons seguem o desenho em linha.
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', color, className)}>
      {pos.map((p) =>
        tone === 'gold' ? (
          <FiligreeCorner key={p.r} className="absolute drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" style={{ ...p.s, width: size + 6, height: size + 6, transform: `rotate(${p.r}deg)` }} />
        ) : (
          <CornerFiligree key={p.r} className="absolute" style={{ ...p.s, width: size, height: size, transform: `rotate(${p.r}deg)` }} />
        ),
      )}
    </span>
  )
}

/**
 * Painel = Frame + cabeçalho opcional (kicker/título/ação). É o bloco padrão das telas de app.
 */
export function Panel({
  kicker,
  title,
  jp,
  action,
  children,
  ...frame
}: Omit<FrameProps, 'title'> & { kicker?: string; title?: string; jp?: string; action?: ReactNode }) {
  return (
    <Frame as="section" {...frame}>
      {(title || kicker) && <SectionHeader kicker={kicker} title={title ?? ''} jp={jp} action={action} size="sm" className="mb-3" tone={frame.variant === 'paper' ? 'paper' : 'ink'} />}
      {children}
    </Frame>
  )
}

/**
 * Moldura de página (tela cheia): filete fino com cantos de filigrana e marcações de relógio
 * nas laterais. Respeita a área segura. Decorativa (pointer-events: none).
 */
export function ScreenFrame({ tone = 'gold', className }: { tone?: FrameTone; className?: string }) {
  const color = tone === 'gold' ? 'text-dv-gold/70' : tone === 'blood' ? 'text-dv-blood/80' : 'text-dv-cobalt-text/70'
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute z-10', color, className)}
      style={{
        top: 'calc(env(safe-area-inset-top) + 10px)',
        bottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        left: 'calc(env(safe-area-inset-left) + 10px)',
        right: 'calc(env(safe-area-inset-right) + 10px)',
      }}
    >
      <span className="absolute inset-[6px] border border-current opacity-35" />
      <FrameCorners tone={tone} size={26} inset={0} className={color} />
      {/* marcações de relógio no meio das laterais */}
      <span className="absolute left-1/2 top-[6px] h-2 w-px -translate-x-1/2 bg-current" />
      <span className="absolute bottom-[6px] left-1/2 h-2 w-px -translate-x-1/2 bg-current" />
      <span className="absolute left-[6px] top-1/2 h-px w-2 -translate-y-1/2 bg-current" />
      <span className="absolute right-[6px] top-1/2 h-px w-2 -translate-y-1/2 bg-current" />
    </div>
  )
}
