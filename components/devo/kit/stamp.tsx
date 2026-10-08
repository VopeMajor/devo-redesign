import { useId, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type StampTone = 'blood' | 'cobalt' | 'gold' | 'ink'

const COLOR: Record<StampTone, string> = {
  blood: 'text-dv-blood',
  cobalt: 'text-dv-cobalt-deep',
  gold: 'text-dv-gold',
  ink: 'text-dv-paper-ink',
}

/** Máscara de tinta falhada (grão) aplicada a todo carimbo. */
const INK_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 1.6'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Carimbo de tinta: resultado de votação, "RESGATADO", "ELIMINADO", "APROVADO".
 * `round` traz texto em volta (anel) — ótimo para selos do Record; `rect` é o carimbo de despacho.
 * `animate` faz a batida (escala 2.1 → 1) — use na revelação, não em listas.
 */
export function Stamp({
  text,
  ring = 'DEVO · RECORD SYSTEM · DEADLY VOTE ·',
  tone = 'blood',
  shape = 'rect',
  rotate = -8,
  size = 120,
  animate = false,
  className,
}: {
  text: string
  /** Texto do anel (só `round`). */
  ring?: string
  tone?: StampTone
  shape?: 'rect' | 'round'
  rotate?: number
  /** Largura em px (round = diâmetro). */
  size?: number
  animate?: boolean
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const style = {
    '--dv-stamp-rot': `${rotate}deg`,
    transform: animate ? undefined : `rotate(${rotate}deg)`,
    WebkitMaskImage: INK_MASK,
    maskImage: INK_MASK,
    WebkitMaskSize: '120px 120px',
    maskSize: '120px 120px',
  } as CSSProperties

  if (shape === 'round') {
    return (
      <span role="img" aria-label={`Carimbo: ${text}`} className={cn('inline-block', COLOR[tone], animate && 'animate-dv-stamp', className)} style={{ ...style, width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="size-full" fill="none" stroke="currentColor" aria-hidden="true">
          <defs>
            <path id={`r${id}`} d="M60 60 m-43 0 a43 43 0 1 1 86 0 a43 43 0 1 1 -86 0" />
          </defs>
          <circle cx="60" cy="60" r="56" strokeWidth="3" />
          <circle cx="60" cy="60" r="51" strokeWidth="1" />
          <circle cx="60" cy="60" r="34" strokeWidth="1.5" />
          <text fill="currentColor" stroke="none" fontSize="9.5" letterSpacing="1.6" style={{ fontFamily: 'var(--font-mono)' }}>
            <textPath href={`#r${id}`}>{ring}</textPath>
          </text>
          <text x="60" y="64" textAnchor="middle" fill="currentColor" stroke="none" fontSize={text.length > 8 ? 11 : 14} fontWeight="700" letterSpacing="1.5" style={{ fontFamily: 'var(--font-oswald)' }}>
            {text.toUpperCase()}
          </text>
          <path d="M60 30 L62 34 L60 38 L58 34 Z M60 82 L62 86 L60 90 L58 86 Z" fill="currentColor" stroke="none" />
        </svg>
      </span>
    )
  }
  return (
    <span
      role="img"
      aria-label={`Carimbo: ${text}`}
      className={cn(
        'inline-flex items-center justify-center border-[3px] border-current px-3 py-1.5 font-impact font-bold uppercase leading-none tracking-[0.14em] outline outline-1 outline-offset-[3px] outline-current',
        COLOR[tone],
        animate && 'animate-dv-stamp',
        className,
      )}
      style={{ ...style, minWidth: size, fontSize: Math.max(14, Math.round(size / 6)) }}
    >
      {text}
    </span>
  )
}
