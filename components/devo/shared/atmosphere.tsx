import Image from 'next/image'
import { cn } from '@/lib/utils'

const EMBERS = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280
  const r = seed / 233280
  return {
    left: `${(i * 37) % 100}%`,
    size: 1 + ((i * 7) % 3),
    duration: 11 + ((i * 13) % 14),
    delay: -((i * 17) % 22),
    dx: `${Math.round((r - 0.5) * 120)}px`,
    opacity: 0.25 + r * 0.55,
    red: i % 3 !== 0,
  }
})

export function Embers({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="devo-particle absolute -bottom-4 rounded-full"
          style={
            {
              left: e.left,
              width: e.size,
              height: e.size,
              background: e.red ? '#1647ff' : '#eceef2',
              boxShadow: e.red ? '0 0 6px 1px rgba(22,71,255,0.7)' : '0 0 4px rgba(236,238,242,0.6)',
              animation: `devo-drift ${e.duration}s linear ${e.delay}s infinite`,
              '--dx': e.dx,
              '--o': e.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** Fundo da catedral com névoa, vinheta e grão. Reutilizado pela landing, introdução e desktop. */
export function CathedralBackdrop({ dim = 0.55, className }: { dim?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <Image src="/images/background.png" alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-background" style={{ opacity: dim }} />
      <div className="animate-mist absolute -inset-[10%] bg-[radial-gradient(ellipse_at_30%_70%,rgba(22,71,255,0.18),transparent_55%),radial-gradient(ellipse_at_75%_30%,rgba(236,238,242,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
      <div className="devo-grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  )
}
