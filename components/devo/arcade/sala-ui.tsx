'use client'

/**
 * Peças locais da Sala de Jogos (cassino do DEVO). Tudo construído sobre o kit; o que for útil fora
 * daqui está listado no relatório como candidato ao kit (Plaque, Medallion, VsSplit, AstrolabeDial).
 */
import type { CSSProperties, ReactNode } from 'react'
import { GlyphArrow } from '@/components/devo/kit'
import { cn } from '@/lib/utils'
import { JavaliArt } from '../npc-art/javali'

/* ── Placa de status (cabeçalho) ─────────────────────────────────────────────────────── */

const PLAQUE_LINE = {
  cobalt: 'bg-[linear-gradient(135deg,#a9bbff,var(--dv-cobalt)_35%,var(--dv-cobalt-dim)_75%,var(--dv-cobalt))]',
  gold: 'bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_35%,var(--dv-gold)_65%,var(--dv-gold-deep))]',
  neutral: 'bg-[linear-gradient(135deg,rgba(236,238,242,0.42),var(--dv-line-strong)_40%,rgba(236,238,242,0.12))]',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
} as const

export type PlaqueTone = keyof typeof PLAQUE_LINE

/** Placa metálica pequena com rótulo e número (Tempo, Pontos, Posição, Reset). Fica dentro de um <dl>. */
export function Plaque({ label, tone = 'neutral', children, className }: { label: string; tone?: PlaqueTone; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate min-w-0 px-2.5 pb-2 pt-1.5', className)} style={{ '--dv-cut': '9px' } as CSSProperties}>
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', PLAQUE_LINE[tone])} />
      <span
        aria-hidden="true"
        className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3)_0%,var(--dv-ink-2)_55%,var(--dv-ink)_100%)]"
        style={{ '--dv-cut': '8.6px' } as CSSProperties}
      />
      <span aria-hidden="true" className="absolute inset-x-3 top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <dt className="dv-label truncate text-[10px] tracking-[0.16em] text-dv-text-3">{label}</dt>
      <dd className="mt-1 flex min-h-[20px] items-baseline font-impact text-[18px] font-semibold leading-none text-dv-text dv-tabular">{children}</dd>
    </div>
  )
}

/* ── Monograma (iniciais num losango chanfrado) ──────────────────────────────────────── */

export function initials(name: string) {
  return (
    name
      .replace(/[^\p{L}\p{N} ]/gu, ' ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

const MONO_SIZE = { sm: 'size-8 text-[12px]', md: 'size-10 text-[14px]', lg: 'size-14 text-[19px]', xl: 'size-[72px] text-[24px]' } as const

/** Medalhão com as iniciais. `tone` = cor do filete: ouro (1º), prata (2º), bronze (3º), cobalto (você). */
export function Monogram({
  name,
  size = 'md',
  tone = 'neutral',
  className,
}: {
  name: string
  size?: keyof typeof MONO_SIZE
  tone?: 'neutral' | 'gold' | 'silver' | 'bronze' | 'cobalt' | 'ghost'
  className?: string
}) {
  const line =
    tone === 'gold'
      ? PLAQUE_LINE.gold
      : tone === 'silver'
        ? 'bg-[linear-gradient(135deg,#f4f6fb,#8a92a6_45%,#dfe3ec)]'
        : tone === 'bronze'
          ? 'bg-[linear-gradient(135deg,#e0a872,#7a4a22_45%,#c98a52)]'
          : tone === 'cobalt'
            ? PLAQUE_LINE.cobalt
            : tone === 'ghost'
              ? 'bg-dv-line'
              : PLAQUE_LINE.neutral
  return (
    <span aria-hidden="true" className={cn('relative isolate grid shrink-0 place-items-center font-display font-semibold tracking-[0.04em]', MONO_SIZE[size], className)} style={{ '--dv-cut': '28%' } as CSSProperties}>
      <span className={cn('dv-cut absolute inset-0 -z-10', line)} />
      <span
        className={cn('dv-cut absolute inset-[1.5px] -z-10', tone === 'cobalt' ? 'bg-[linear-gradient(160deg,#1b2f8c,var(--dv-cobalt-dim)_60%,var(--dv-ink))]' : 'bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink-2)_60%,var(--dv-ink))]')}
      />
      <span className={tone === 'ghost' ? 'text-dv-text-3' : 'text-dv-text'}>{tone === 'ghost' ? '?' : initials(name)}</span>
    </span>
  )
}

/* ── Medalhão do Javali (recorte do rosto da arte original) ─────────────────────────── */

/** Rosto do anfitrião num octógono com filete dourado. `size` em px. */
export function JavaliMedallion({ size = 56, className, title }: { size?: number; className?: string; title?: string }) {
  // Janela de recorte na arte (viewBox 1200×500, pose "table"): x 470–730, y 18–278.
  const s = size / 260
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('relative isolate block shrink-0', className)}
      style={{ width: size, height: size, '--dv-cut': `${Math.round(size * 0.24)}px` } as CSSProperties}
    >
      <span className={cn('dv-cut absolute inset-0 -z-10', PLAQUE_LINE.gold)} />
      <span className="dv-cut absolute inset-[2px] -z-10 overflow-hidden bg-[radial-gradient(90%_80%_at_50%_30%,#1f2a55,var(--dv-ink)_75%)]">
        <span className="absolute" style={{ width: 1200 * s, height: 500 * s, left: -470 * s, top: -18 * s }}>
          <JavaliArt pose="table" className="size-full" />
        </span>
      </span>
    </span>
  )
}

/* ── Link pequeno "ver mais" (≥ 44px de toque) ───────────────────────────────────────── */

export function MoreLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dv-focus group inline-flex min-h-11 items-center gap-1.5 pl-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-3 transition-colors hover:text-dv-cobalt-text"
    >
      {label}
      <GlyphArrow className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

/* ── Barra de odds (público de cada lado) ────────────────────────────────────────────── */

export function OddsBar({ a, b, thin }: { a: number; b: number; thin?: boolean }) {
  return (
    <div>
      <div className={cn('mb-1 flex justify-between font-mono tabular-nums', thin ? 'text-[11px]' : 'text-[12px]')}>
        <span className="text-dv-cobalt-text">{a}% do público</span>
        <span className="text-dv-gold">{b}%</span>
      </div>
      <div className={cn('relative flex overflow-hidden bg-dv-ink-4', thin ? 'h-1' : 'h-1.5')}>
        <span className="h-full bg-[linear-gradient(90deg,var(--dv-cobalt-deep),var(--dv-cobalt))] transition-[width] duration-500" style={{ width: `${a}%` }} />
        <span aria-hidden="true" className="h-full w-[3px] -skew-x-[30deg] bg-dv-ink" />
        <span className="h-full flex-1 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-gold))]" />
      </div>
    </div>
  )
}

/* ── Mostrador de astrolábio (decoração da Agenda) ───────────────────────────────────── */

const ROMAN_7 = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** Meio mostrador de 7 casas (dias), com o dia atual aceso. Decorativo. */
export function AstrolabeDial({ active, className }: { active: number; className?: string }) {
  const cx = 200
  const cy = 200
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={cn('pointer-events-none', className)} fill="none">
      <circle cx={cx} cy={cy} r="190" stroke="var(--dv-gold)" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="176" stroke="var(--dv-gold)" strokeOpacity="0.2" strokeWidth="0.8" strokeDasharray="2 6" />
      <circle cx={cx} cy={cy} r="128" stroke="var(--dv-cobalt)" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="64" stroke="var(--dv-gold)" strokeOpacity="0.3" strokeWidth="0.8" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2
        const long = i % 6 === 0
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * (long ? 160 : 168)}
            y1={cy - Math.cos(a) * (long ? 160 : 168)}
            x2={cx + Math.sin(a) * 176}
            y2={cy - Math.cos(a) * 176}
            stroke="var(--dv-gold)"
            strokeOpacity={long ? 0.6 : 0.3}
            strokeWidth={long ? 1.4 : 0.7}
          />
        )
      })}
      {ROMAN_7.map((r, i) => {
        const a = (i / 7) * Math.PI * 2
        const on = i === active
        const x = cx + Math.sin(a) * 146
        const y = cy - Math.cos(a) * 146
        return (
          <g key={r}>
            <circle cx={x} cy={y} r="15" fill={on ? 'var(--dv-cobalt-dim)' : 'var(--dv-ink)'} stroke={on ? 'var(--dv-cobalt)' : 'var(--dv-gold)'} strokeOpacity={on ? 1 : 0.4} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill={on ? '#c9d4ff' : 'var(--dv-gold)'} fillOpacity={on ? 1 : 0.6} style={{ fontFamily: 'var(--font-card-title)' }}>
              {r}
            </text>
          </g>
        )
      })}
      {/* ponteiro até o dia atual */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.sin((active / 7) * Math.PI * 2) * 124}
        y2={cy - Math.cos((active / 7) * Math.PI * 2) * 124}
        stroke="var(--dv-cobalt)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d={`M${cx} ${cy - 22} L${cx + 7} ${cy} L${cx} ${cy + 22} L${cx - 7} ${cy} Z`} fill="var(--dv-gold)" fillOpacity="0.7" />
      <circle cx={cx} cy={cy} r="4" fill="var(--dv-gold-bright)" />
    </svg>
  )
}
