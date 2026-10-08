'use client'

import { setMuted, unlockAudio } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useMuted } from '../hooks'

/**
 * Liga/desliga o som. `compact` = só o equalizador (barras de status, landing, prólogo);
 * completo = chave chanfrada com rótulo (Ajustes). Mesmo nome acessível nos dois.
 */
export function SoundToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const muted = useMuted()
  const bars = (
    <span aria-hidden="true" className="flex h-3.5 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('w-[2px] origin-bottom bg-current', muted ? 'h-[3px]' : 'animate-[devo-eq_1.1s_ease-in-out_infinite]')}
          style={{ animationDelay: `${i * 0.18}s`, height: muted ? undefined : '100%' }}
        />
      ))}
    </span>
  )
  const toggle = () => {
    unlockAudio()
    setMuted(!muted)
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!muted}
        aria-label={muted ? 'Ativar som' : 'Silenciar som'}
        className={cn(
          'flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/60 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
          className,
        )}
      >
        {bars}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som' : 'Silenciar som'}
      className={cn('dv-focus group flex min-h-11 items-center gap-3', muted ? 'text-dv-text-3' : 'text-dv-gold', className)}
    >
      {bars}
      <span className="dv-label w-[5.5em] text-right text-[10px] text-dv-text-2">{muted ? 'Desligado' : 'Ligado'}</span>
      <span aria-hidden="true" className={cn('dv-cut-hex relative h-7 w-14 transition-colors duration-200 [--dv-cut:10px]', muted ? 'bg-dv-line-strong' : 'bg-dv-cobalt')}>
        <span className={cn('dv-cut-hex absolute inset-px [--dv-cut:9.5px]', muted ? 'bg-dv-ink-2' : 'bg-dv-cobalt-dim')} />
        <span
          className={cn(
            'absolute top-1/2 size-4 -translate-y-1/2 rotate-45 transition-[left,background-color] duration-200 ease-out',
            muted ? 'left-2 bg-dv-text-3' : 'left-[calc(100%-1.5rem)] bg-white shadow-[0_0_10px_var(--dv-cobalt)]',
          )}
        />
      </span>
    </button>
  )
}
