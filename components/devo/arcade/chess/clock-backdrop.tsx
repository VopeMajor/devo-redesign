import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

const SPARKLES = [
  { x: 8, y: 14, s: 18, d: 0 },
  { x: 20, y: 38, s: 10, d: 1.4 },
  { x: 14, y: 70, s: 14, d: 2.6 },
  { x: 31, y: 9, s: 8, d: 3.3 },
  { x: 72, y: 12, s: 12, d: 0.8 },
  { x: 86, y: 30, s: 20, d: 2.1 },
  { x: 92, y: 58, s: 10, d: 3.8 },
  { x: 78, y: 82, s: 14, d: 1.1 },
  { x: 56, y: 6, s: 9, d: 4.4 },
  { x: 40, y: 88, s: 11, d: 2.9 },
]

const DUST = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1
  return { x: r(1) * 100, size: 1.5 + r(2) * 3, dur: 9 + r(3) * 12, delay: -r(4) * 20, drift: (r(5) - 0.5) * 60 }
})

const GEARS = [
  { x: '-6%', y: '-8%', size: '34vmin', teeth: 14, dur: 38, rev: false },
  { x: '-4%', y: '74%', size: '26vmin', teeth: 11, dur: 26, rev: true },
  { x: '82%', y: '78%', size: '30vmin', teeth: 12, dur: 32, rev: false },
  { x: '86%', y: '-6%', size: '22vmin', teeth: 10, dur: 22, rev: true },
]

function gearPath(teeth: number) {
  const pts: string[] = []
  const outer = 48
  const inner = 40
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2
    const r = i % 2 === 0 ? outer : inner
    pts.push(`${50 + Math.cos(a0) * r},${50 + Math.sin(a0) * r}`, `${50 + Math.cos(a1) * r},${50 + Math.sin(a1) * r}`)
  }
  return `M${pts.join('L')}Z`
}

function Gear({ teeth }: { teeth: number }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <path d={gearPath(teeth)} fill="#1a1d36" stroke="#5b628f" strokeWidth="1" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="#5b628f" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map((k) => (
        <line key={k} x1="50" y1="50" x2={50 + Math.cos((k / 5) * Math.PI * 2) * 26} y2={50 + Math.sin((k / 5) * Math.PI * 2) * 26} stroke="#5b628f" strokeWidth="3" />
      ))}
      <circle cx="50" cy="50" r="7" fill="#0b0d1c" stroke="#7d84b8" strokeWidth="1.5" />
    </svg>
  )
}

function NumeralRing({ radius, font }: { radius: number; font: number }) {
  return (
    <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
      <circle cx="100" cy="100" r={radius + font * 0.9} fill="none" stroke="#c9cdf0" strokeOpacity="0.35" strokeWidth="0.6" />
      <circle cx="100" cy="100" r={radius - font * 0.9} fill="none" stroke="#c9cdf0" strokeOpacity="0.25" strokeWidth="0.4" />
      {NUMERALS.map((n, i) => (
        <text
          key={n}
          x="100"
          y={100 - radius}
          transform={`rotate(${i * 30} 100 100)`}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="serif"
          fontSize={font}
          fill="#e3e6ff"
          fillOpacity="0.55"
        >
          {n}
        </text>
      ))}
    </svg>
  )
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#e6e9ff" />
    </svg>
  )
}

const anim = (value: string): CSSProperties => ({ animation: value })

/**
 * Fundo vivo do xadrez: a arte do relógio respira, anéis de numerais giram em sentidos opostos,
 * engrenagens trabalham nos cantos, poeira sobe, e a cor do tema escolhido tinge a cena.
 * A cada troca de turno uma onda percorre o mostrador.
 */
export function ClockBackdrop({ danger, tint, turnKey }: { danger: boolean; tint: string; turnKey: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0b0d1c]" aria-hidden="true">
      <div
        className="chess-anim absolute -inset-[6%] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/chess/clock-arena.webp')", ...anim('chess-drift 18s ease-in-out infinite alternate') }}
      />

      <div className="absolute left-1/2 top-[48%] size-[118vmin] -translate-x-1/2 -translate-y-1/2">
        <div className="chess-anim absolute inset-0" style={anim('chess-spin 120s linear infinite')}>
          <NumeralRing radius={86} font={9} />
        </div>
        <div className="chess-anim absolute inset-[22%]" style={anim('chess-spin 70s linear infinite reverse')}>
          <NumeralRing radius={82} font={11} />
        </div>
        <div className="chess-anim absolute inset-[38%]" style={anim('chess-spin 40s linear infinite')}>
          <NumeralRing radius={76} font={14} />
        </div>
        <div key={turnKey} className="chess-anim absolute inset-[30%] rounded-full border-2 opacity-0" style={{ borderColor: tint, ...anim('chess-ripple 1.4s ease-out 1') }} />
      </div>

      <div className="absolute left-1/2 top-[48%] size-0">
        <div className="chess-anim absolute -left-px bottom-0 h-[40vmin] w-[2px] origin-bottom rounded-full bg-[#dfe3ff]/75 shadow-[0_0_10px_#aab4ff]" style={anim('chess-spin 60s linear infinite')} />
        <div className="chess-anim absolute -left-[2px] bottom-0 h-[26vmin] w-[4px] origin-bottom rounded-full bg-[#dfe3ff]/50" style={anim('chess-spin 720s linear infinite')} />
        <div className="absolute -left-[6px] -top-[6px] size-[12px] rounded-full bg-[#dfe3ff]/85" />
      </div>

      {GEARS.map((g, i) => (
        <div key={i} className="absolute opacity-70" style={{ left: g.x, top: g.y, width: g.size, height: g.size }}>
          <div className="chess-anim size-full" style={anim(`chess-spin ${g.dur}s linear infinite${g.rev ? ' reverse' : ''}`)}>
            <Gear teeth={g.teeth} />
          </div>
        </div>
      ))}

      <div
        className="chess-anim absolute -inset-x-1/4 bottom-0 h-3/5 bg-[radial-gradient(ellipse_at_30%_80%,#6d6fb555,transparent_60%),radial-gradient(ellipse_at_75%_90%,#4a4f9a55,transparent_55%)]"
        style={anim('chess-mist 11s ease-in-out infinite alternate')}
      />

      {DUST.map((p, i) => (
        <span
          key={i}
          className="chess-anim absolute bottom-[-4%] rounded-full bg-[#dfe3ff]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            ['--dust-x' as string]: `${p.drift}px`,
            boxShadow: `0 0 6px ${tint}`,
            ...anim(`chess-rise ${p.dur}s linear ${p.delay}s infinite`),
          }}
        />
      ))}

      {SPARKLES.map((p, i) => (
        <span key={i} className="chess-anim absolute opacity-0" style={{ left: `${p.x}%`, top: `${p.y}%`, ...anim(`chess-twinkle 4s ease-in-out ${p.d}s infinite`) }}>
          <Sparkle size={p.s} />
        </span>
      ))}

      <div className="absolute inset-0 mix-blend-soft-light transition-colors duration-700" style={{ backgroundColor: tint, opacity: 0.35 }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_40%,rgba(6,7,18,0.82)_100%)]" />
      <div
        className={cn('absolute inset-0 shadow-[inset_0_0_90px_#b3141c88] transition-opacity duration-300', danger ? 'opacity-100' : 'opacity-0')}
        style={danger ? anim('chess-danger 1s ease-in-out infinite') : undefined}
      />
    </div>
  )
}
