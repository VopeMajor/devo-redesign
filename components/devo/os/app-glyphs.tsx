import type { LucideProps } from 'lucide-react'

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
