'use client'

import { setMuted, unlockAudio } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useMuted } from '../hooks'

export function SoundToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const muted = useMuted()
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio()
        setMuted(!muted)
      }}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som' : 'Silenciar som'}
      className={cn(
        'flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/60 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
        className,
      )}
    >
      <span aria-hidden="true" className="flex h-3.5 items-end gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('w-[2px] origin-bottom bg-current', muted ? 'h-[3px]' : 'animate-[devo-eq_1.1s_ease-in-out_infinite]')}
            style={{ animationDelay: `${i * 0.18}s`, height: muted ? undefined : '100%' }}
          />
        ))}
      </span>
      {!compact && <span>{muted ? 'Som desligado' : 'Som ligado'}</span>}
    </button>
  )
}
