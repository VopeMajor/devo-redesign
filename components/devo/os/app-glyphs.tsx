import type { LucideProps } from 'lucide-react'

/**
 * Glifos dos aplicativos do DEVO. Mesmo traço do kit (1.4 em 24px, `currentColor`, cantos
 * arredondados), desenhados no projeto para que todos os ícones da home sejam da mesma família.
 * A assinatura de props segue a do lucide (o registro `apps.tsx` aceita os dois).
 */
type GlyphProps = Pick<LucideProps, 'className' | 'strokeWidth' | 'aria-hidden'>

function Glyph({ className, strokeWidth = 1.4, children, ...rest }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={rest['aria-hidden'] ?? true}
    >
      {children}
    </svg>
  )
}

/** Record: dossiê com o olho de registro e linhas de ficha. */
export function RecordGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6 2.8h8.6L19 7.2v14H6Z" />
      <path d="M14.6 2.8v4.4H19" opacity="0.6" />
      <path d="M8.6 12.2c1.6-2.3 6.2-2.3 7.8 0-1.6 2.3-6.2 2.3-7.8 0Z" />
      <circle cx="12.5" cy="12.2" r="1.1" fill="currentColor" stroke="none" />
      <path d="M8.8 16.6h7.4M8.8 18.8h4.6" opacity="0.6" />
    </Glyph>
  )
}

/** Pulso: mostrador de pulso com a linha do batimento cortando o centro. */
export function PulseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 2v1.6M12 20.4V22M2 12h1.6M20.4 12H22" opacity="0.7" />
      <path d="M5.2 12.4h3l1.4-3.2 2.4 6.4 1.6-4.6 1 1.4h4.2" strokeWidth={1.6} />
    </Glyph>
  )
}

/** Mensagens: dois balões chanfrados sobrepostos. */
export function MessagesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 5.6 5.4 3.2h10.4v8.6l-2.4 2.4H8.2L5 17v-2.8H3Z" />
      <path d="M18.6 8.4H21v8.2h-2v2.8l-3-2.8h-5.2L9 14.8" opacity="0.6" />
      <path d="M7 8.2h5.4M7 10.8h3.6" opacity="0.8" />
    </Glyph>
  )
}

export function CardsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.2" y="5.2" width="9" height="13.5" rx="1.2" transform="rotate(-14 7.7 12)" opacity="0.45" />
      <rect x="11.8" y="5.2" width="9" height="13.5" rx="1.2" transform="rotate(14 16.3 12)" opacity="0.45" />
      <rect x="7.5" y="3.5" width="9" height="15" rx="1.2" fill="var(--glyph-fill, transparent)" />
      <rect x="8.9" y="4.9" width="6.2" height="12.2" rx="0.6" opacity="0.35" />
      <path d="M12 8.2 14 11l-2 2.8L10 11Z" fill="currentColor" stroke="none" />
      <path d="M9.6 6.4h.01M14.4 15.6h.01" strokeWidth={2} />
    </Glyph>
  )
}

export function TradeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="2.8" y="6" width="7" height="10.5" rx="1" />
      <path d="M6.3 9.4 7.6 11.2 6.3 13l-1.3-1.8Z" fill="currentColor" stroke="none" />
      <rect x="14.2" y="7.5" width="7" height="10.5" rx="1" opacity="0.55" />
      <path d="m17.7 10.9 1.3 1.8-1.3 1.8-1.3-1.8Z" fill="currentColor" stroke="none" opacity="0.55" />
      <path d="M6 4.4C8.6 1.9 13.4 1.7 16.6 4.6" />
      <path d="m16.9 2.4-.2 2.4-2.4-.1" />
      <path d="M18 19.6c-2.6 2.5-7.4 2.7-10.6-.2" />
      <path d="m7.1 21.6.2-2.4 2.4.1" />
    </Glyph>
  )
}

const TEETH = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  const p = (r: number) => `${(12 + Math.sin(a) * r).toFixed(2)} ${(12 - Math.cos(a) * r).toFixed(2)}`
  return { d: `M${p(7.4)}L${p(9.6)}`, major: i % 2 === 0 }
})

/** Ajustes: engrenagem de astrolábio (anel com dentes e mira). */
export function SettingsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="2.2" />
      {TEETH.map((t) => (
        <path key={t.d} d={t.d} strokeWidth={t.major ? 1.8 : 1.2} />
      ))}
    </Glyph>
  )
}

/** Sala de Jogos: dado em perspectiva sobre o piso. */
export function GamesGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 2.8 19 6.6v7.6L12 18l-7-3.8V6.6Z" />
      <path d="M5 6.6 12 10.4l7-3.8M12 10.4V18" opacity="0.6" />
      <circle cx="12" cy="6.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.4" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <path d="M2.8 21.2h18.4" opacity="0.5" />
      <path d="M6 21.2v-1.4M10 21.2v-1.4M14 21.2v-1.4M18 21.2v-1.4" opacity="0.4" />
    </Glyph>
  )
}
