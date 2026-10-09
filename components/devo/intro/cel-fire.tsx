import { cn } from '@/lib/utils'

const rand = (i: number) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)

const LAYERS = [
  { color: 'var(--dv-blood)', stroke: '#2a0a0a', count: 9, min: 120, max: 190, seed: 1 },
  { color: '#ff4f12', stroke: 'none', count: 11, min: 85, max: 145, seed: 40 },
  { color: '#ffb52e', stroke: 'none', count: 13, min: 45, max: 95, seed: 90 },
  { color: '#ffe066', stroke: 'none', count: 9, min: 14, max: 40, seed: 150 },
]

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

/** Chamas chapadas em animação limitada (dois quadros alternados), como uma execução de anime. */
export function CelFire({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_50%_100%,rgba(255,90,20,0.45),transparent_70%)]" />
      {[0, 1].map((frame) => (
        <svg
          key={frame}
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full animate-[pr-cel_0.34s_steps(1)_infinite]"
          style={{ animationDelay: frame ? '-0.17s' : '0s' }}
        >
          {LAYERS.map((l) => (
            <path
              key={l.seed}
              d={tongues(l.count, l.min, l.max, l.seed + frame * 300)}
              fill={l.color}
              stroke={l.stroke}
              strokeWidth={l.stroke === 'none' ? 0 : 1.5}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      ))}
    </div>
  )
}
