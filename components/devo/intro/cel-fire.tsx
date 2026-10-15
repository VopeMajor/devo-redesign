import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const rand = (i: number) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)

/*
 * Fogo em gravura P&B (mesmo tratamento da tesoura do ato I): línguas de chama com hachura de buril
 * em porcelana/aço sobre o negro, miolo branco e só brasas rubi pequenas como cor. Animação limitada
 * (dois quadros alternados, como execução de anime), sem cor chapada.
 */
const LAYERS = [
  { hatch: 'wide', stroke: '#8f8e8b', sw: 0.9, count: 8, min: 120, max: 190, seed: 1, op: 0.75 },
  { hatch: 'mid', stroke: '#bab09f', sw: 1, count: 10, min: 85, max: 145, seed: 40, op: 0.9 },
  { hatch: 'dense', stroke: '#ece5d8', sw: 1.1, count: 12, min: 45, max: 95, seed: 90, op: 1 },
  { hatch: null, stroke: 'none', sw: 0, count: 8, min: 12, max: 34, seed: 150, op: 0.92 },
] as const

function tongues(count: number, min: number, max: number, seed: number) {
  const step = 400 / count
  return Array.from({ length: count + 1 }, (_, k) => {
    const x = k * step + (rand(seed + k) - 0.5) * step * 0.5
    const w = step * (0.7 + rand(seed + k + 7) * 0.4)
    const h = min + rand(seed + k + 13) * (max - min)
    const skew = (rand(seed + k + 21) - 0.5) * w * 1.4
    const y = 200 - h
    return `M${x - w} 200 Q${x - w} ${200 - h * 0.45} ${x + skew * 0.4} ${200 - h * 0.7} Q${x + skew * 0.2} ${200 - h * 0.86} ${x + skew} ${y} Q${x + w * 0.75} ${200 - h * 0.55} ${x + w} 200Z`
  }).join(' ')
}

/** Brasas: pontos rubi pequenos subindo devagar (a única cor do quadro). */
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  left: 6 + rand(i + 300) * 88,
  size: 1.5 + rand(i + 310) * 2,
  dur: 3.2 + rand(i + 320) * 3.4,
  delay: -rand(i + 330) * 6,
  dx: Math.round((rand(i + 340) - 0.5) * 60),
}))

export function CelFire({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0', className)}>
      {/* luz fria do fogo gravado: porcelana, não laranja */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_50%_100%,rgba(241,240,238,0.2),transparent_70%)]" />
      {[0, 1].map((frame) => (
        <svg
          key={frame}
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full animate-[pr-cel_0.38s_steps(1)_infinite]"
          style={{ animationDelay: frame ? '-0.19s' : '0s' }}
        >
          <defs>
            <pattern id={`cf-wide-${frame}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(68)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#8f8e8b" strokeWidth="0.9" />
            </pattern>
            <pattern id={`cf-mid-${frame}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(62)">
              <line x1="0" y1="0" x2="0" y2="3.2" stroke="#d6cdbd" strokeWidth="0.9" />
            </pattern>
            <pattern id={`cf-dense-${frame}`} width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
              <line x1="0" y1="0" x2="0" y2="2" stroke="#f1f0ee" strokeWidth="0.85" />
            </pattern>
          </defs>
          {LAYERS.map((l) => (
            <path
              key={l.seed}
              d={tongues(l.count, l.min, l.max, l.seed + frame * 300)}
              fill={l.hatch ? `url(#cf-${l.hatch}-${frame})` : '#f1f0ee'}
              stroke={l.stroke}
              strokeWidth={l.sw}
              strokeLinejoin="round"
              opacity={l.op}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ))}
      {/* pé do fogo afunda no negro */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black via-black/70 to-transparent" />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute bottom-[18%] rounded-full bg-[#c41a28] shadow-[0_0_6px_1px_rgba(163,18,31,0.85)] motion-reduce:hidden"
          style={
            {
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animation: `cf-rise ${s.dur}s linear ${s.delay}s infinite`,
              '--cf-dx': `${s.dx}px`,
            } as CSSProperties
          }
        />
      ))}
      <style>{`@keyframes cf-rise{0%{transform:translate(0,0);opacity:0}12%{opacity:1}100%{transform:translate(var(--cf-dx),-60vh);opacity:0}}`}</style>
    </div>
  )
}
