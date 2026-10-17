'use client'

/**
 * Peças locais da Sala de Jogos (cassino do DEVO). Tudo construído sobre o kit; o que for útil fora
 * daqui foi para o kit (Plaque, OddsBar); Medallion, VsSplit e AstrolabeDial seguem aqui (ver IDENTIDADE.md).
 */
import type { CSSProperties, ReactNode } from 'react'
import { GlyphArrow, NpcMedallion, PortraitFrame } from '@/components/devo/kit'
import type { GameId } from '@/lib/devo/arcade/games'
import { cn } from '@/lib/utils'
import { portraitFrameProps, type Expressao } from '@/lib/devo/npcs'

/* ── Placa de status (cabeçalho) ─────────────────────────────────────────────────────── */

const PLAQUE_LINE = {
  /** "Você": prata clara com um fio de ametista (único acento frio). */
  cobalt: 'bg-[linear-gradient(135deg,#ffffff,var(--dv-amethyst)_38%,#ecebef_62%,#5b5863)]',
  gold: 'bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_35%,var(--dv-gold)_65%,var(--dv-gold-deep))]',
  neutral: 'bg-[linear-gradient(135deg,rgba(236,238,242,0.42),var(--dv-line-strong)_40%,rgba(236,238,242,0.12))]',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
} as const

/** Plaque (placa de status) agora vive no kit: components/devo/kit/plaque.tsx. */
export { Plaque, type PlaqueTone } from '@/components/devo/kit'

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

/**
 * Medalhão com as iniciais. `tone` = cor do filete: aço champanhe (1º), prata (2º), aço escuro (3º —
 * o nome `bronze` ficou por compatibilidade, mas não há cobre), `cobalt` = você (prata + ametista),
 * `ivory` = medalhão de mármore branco (lado claro do confronto).
 */
export function Monogram({
  name,
  size = 'md',
  tone = 'neutral',
  className,
}: {
  name: string
  size?: keyof typeof MONO_SIZE
  tone?: 'neutral' | 'gold' | 'silver' | 'bronze' | 'cobalt' | 'ghost' | 'ivory'
  className?: string
}) {
  const line =
    tone === 'gold'
      ? PLAQUE_LINE.gold
      : tone === 'silver'
        ? 'bg-[linear-gradient(135deg,#ffffff,#9a9894_45%,#e6e5e2)]'
        : tone === 'bronze'
          ? 'bg-[linear-gradient(135deg,#9a9184,#4a453d_45%,#6b6357)]'
          : tone === 'cobalt'
            ? PLAQUE_LINE.cobalt
            : tone === 'ivory'
              ? 'bg-[linear-gradient(135deg,#ffffff,#8f8e8b_45%,#d9d8d4)]'
              : tone === 'ghost'
                ? 'bg-dv-line'
                : PLAQUE_LINE.neutral
  return (
    <span aria-hidden="true" className={cn('relative isolate grid shrink-0 place-items-center font-display font-semibold tracking-[0.04em]', MONO_SIZE[size], className)} style={{ '--dv-cut': '28%' } as CSSProperties}>
      <span className={cn('dv-cut absolute inset-0 -z-10', line)} />
      <span
        className={cn(
          'dv-cut absolute inset-[1.5px] -z-10',
          tone === 'ivory'
            ? 'bg-[linear-gradient(160deg,#ffffff,#e9e8e5_55%,#cfcdc8)]'
            : tone === 'cobalt'
              ? 'bg-[radial-gradient(90%_70%_at_50%_100%,rgb(var(--dv-amethyst-rgb)/0.35),transparent_70%),linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink-2)_60%,var(--dv-ink))]'
              : 'bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink-2)_60%,var(--dv-ink))]',
        )}
      />
      <span className={tone === 'ghost' ? 'text-dv-text-3' : tone === 'ivory' ? 'text-dv-porcelain-ink' : 'text-dv-text'}>{tone === 'ghost' ? '?' : initials(name)}</span>
    </span>
  )
}

/* ── Retrato do Javali (PortraitFrame do kit, mesmo tratamento do elenco) ───────────── */

/**
 * Javali no `PortraitFrame` (luz de borda, grão, vinheta, base em degradê). `shape="round"` com zoom
 * no rosto serve de medalhão; `arch` mostra busto e mesa.
 */
export function JavaliPortrait({
  pose,
  shape = 'arch',
  name,
  role,
  ornate,
  className,
  title = 'Javali, anfitrião da Sala de Jogos',
}: {
  /** Expressão do mapa de retratos (`lib/devo/npcs.ts`); sem ela, a de repouso. */
  pose?: Expressao
  shape?: 'arch' | 'round' | 'rect'
  name?: string
  role?: string
  ornate?: boolean
  className?: string
  title?: string
}) {
  // Medalhão: rosto inteiro do Javali (janela própria, kit/npc-anchor), sem tronco.
  if (shape === 'round')
    return (
      <span role="img" aria-label={title} className={cn('block shrink-0', className)}>
        <NpcMedallion npc="javali" pose={pose} size="100%" ring="rgba(186,176,159,0.55)" />
      </span>
    )
  return (
    <PortraitFrame
      {...(portraitFrameProps('javali', pose, 'bust') ?? {})}
      alt={title}
      tone="gold"
      shape={shape}
      name={name}
      role={role}
      ornate={ornate}
      className={className}
    />
  )
}

/** Compatibilidade: medalhão redondo do Javali com `size` em px. */
export function JavaliMedallion({ size = 56, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={cn('block shrink-0', className)} style={{ width: size }}>
      <JavaliPortrait shape="round" className="w-full" title={title} />
    </span>
  )
}

/* ── Arte dos jogos (cenas sem texto nem cursor, para cartaz e cartas) ──────────────── */

export const GAME_ART: Record<GameId, { src: string; position: string }> = {
  'memory-rush': { src: '/images/arcade/memory-rush.jpg', position: '50% 45%' },
  chess: { src: '/images/arcade/chess.jpg', position: '45% 50%' },
  'hot-bomb': { src: '/images/arcade/hot-bomb.jpg', position: '50% 55%' },
  bluff: { src: '/images/arcade/bluff.png', position: '45% 70%' },
}

/**
 * Tratamento das artes dos jogos: quase monocromático (mármore p/b), para que a arte não traga
 * vermelho ou ouro amarelo decorativos para a paleta. A cor volta um pouco no hover.
 */
export const GAME_ART_TONE = 'object-cover grayscale-[0.88] contrast-[1.08] brightness-[0.95]'

/* ── Link pequeno "ver mais" (≥ 44px de toque) ───────────────────────────────────────── */

export function MoreLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dv-focus group inline-flex min-h-11 items-center gap-1.5 pl-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-3 transition-colors hover:text-dv-text"
    >
      {label}
      <GlyphArrow className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

/* ── Barra de odds (público de cada lado) ────────────────────────────────────────────── */

/** OddsBar agora vive no kit: components/devo/kit/plaque.tsx. */
export { OddsBar } from '@/components/devo/kit'

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
      <circle cx={cx} cy={cy} r="128" stroke="var(--dv-marble-vein)" strokeOpacity="0.45" strokeWidth="1" />
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
            <circle cx={x} cy={y} r="15" fill={on ? 'var(--dv-porcelain)' : 'var(--dv-ink)'} stroke={on ? 'var(--dv-amethyst)' : 'var(--dv-gold)'} strokeOpacity={on ? 1 : 0.4} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill={on ? 'var(--dv-porcelain-ink)' : 'var(--dv-gold)'} fillOpacity={on ? 1 : 0.6} style={{ fontFamily: 'var(--font-card-title)' }}>
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
        stroke="var(--dv-gold-bright)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d={`M${cx} ${cy - 22} L${cx + 7} ${cy} L${cx} ${cy + 22} L${cx - 7} ${cy} Z`} fill="var(--dv-gold)" fillOpacity="0.7" />
      <circle cx={cx} cy={cy} r="4" fill="var(--dv-gold-bright)" />
    </svg>
  )
}
