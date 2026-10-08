import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type Side = { name: string; court: string; portrait: string | null; ms: number; captures: number; active: boolean }

function urgency(ms: number, active: boolean) {
  const s = ms / 1000
  return !active ? 0 : s <= 3 ? 3 : s <= 5 ? 2 : s <= 10 ? 1 : 0
}

function PlayerCard({ side, total, align }: { side: Side; total: number; align: 'left' | 'right' }) {
  const level = urgency(side.ms, side.active)
  const pct = Math.max(0, Math.min(100, (side.ms / total) * 100))
  const blue = align === 'left'
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-stretch gap-2 border bg-black/55 p-1.5 backdrop-blur-sm transition-colors sm:gap-3',
        align === 'right' && 'flex-row-reverse',
        side.active ? (blue ? 'border-[#5aa8ff]/70' : 'border-[#ff4a4a]/70') : 'border-white/10',
      )}
    >
      {side.portrait ? (
        <img
          src={side.portrait}
          alt={`Foto de ${side.name}`}
          className={cn('size-11 shrink-0 border object-cover sm:size-14', blue ? 'border-[#5aa8ff]/50' : 'border-[#ff4a4a]/50')}
        />
      ) : (
        <span
          role="img"
          aria-label={`${side.name} sem foto`}
          className={cn('grid size-11 shrink-0 place-items-center border bg-white/5 sm:size-14', blue ? 'border-[#5aa8ff]/50' : 'border-[#ff4a4a]/50')}
        >
          <UserRound className="size-3/5 text-white/55" strokeWidth={1.25} aria-hidden="true" />
        </span>
      )}
      <div className={cn('flex min-w-0 flex-1 flex-col justify-between', align === 'right' && 'items-end text-right')}>
        <div className="min-w-0">
          <p className="truncate font-serif text-xs uppercase tracking-[0.18em] text-white sm:text-sm">{side.name}</p>
          <p className="hidden truncate text-[9px] uppercase tracking-[0.25em] text-white/55 sm:block">
            {side.court} · +{side.captures}
          </p>
        </div>
        <span
          className={cn(
            'font-mono text-xl leading-none tabular-nums transition-all sm:text-3xl',
            level === 0 && (blue ? 'text-[#cfe6ff]' : 'text-white'),
            level === 1 && 'text-[#ffb347]',
            level === 2 && 'animate-pulse text-[#ff4a4a]',
            level === 3 && 'animate-pulse text-[#ff2a2a] [text-shadow:0_0_12px_#ff2a2a]',
          )}
        >
          {`00:${String(Math.ceil(side.ms / 1000)).padStart(2, '0')}`}
        </span>
        <div className="mt-1 h-1 w-full bg-white/10" aria-hidden="true">
          <div
            className={cn('h-full transition-[width] duration-200', blue ? 'bg-[#4a9cff]' : 'ml-auto bg-[#e3262f]')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function VersusBar({ white, black, total, match, status }: { white: Side; black: Side; total: number; match: string; status: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-2 pt-2 sm:px-4">
      <div className="flex w-full max-w-3xl items-start gap-1.5 sm:gap-3">
        <PlayerCard side={white} total={total} align="left" />
        <div className="flex shrink-0 flex-col items-center pt-1">
          <span className="border border-white/15 bg-black/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.3em] text-white/60">{match}</span>
          <span className="mt-1 font-serif text-2xl text-white [text-shadow:0_2px_12px_#000] sm:text-3xl">VS</span>
        </div>
        <PlayerCard side={black} total={total} align="right" />
      </div>
      <p className="mt-1.5 text-center text-[9px] uppercase tracking-[0.35em] text-white/80 [text-shadow:0_1px_6px_#000]" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
