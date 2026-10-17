'use client'

import { useId, useSyncExternalStore } from 'react'
import { getSalaMusica, setSalaMusica, subscribeSalaMusica } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useMuted } from '../hooks'

const PADRAO = { volume: 0.6, mudo: false }

/**
 * Controle da trilha da Sala de Jogos: mudo e volume PRÓPRIOS (guardados no aparelho), separados do som geral.
 * Com o som geral desligado, a trilha também fica muda (e o controle avisa).
 */
export function MusicaSala({ className }: { className?: string }) {
  const prefs = useSyncExternalStore(subscribeSalaMusica, getSalaMusica, () => PADRAO)
  const geralMudo = useMuted()
  const id = useId()
  const calado = prefs.mudo || geralMudo
  return (
    <div className={cn('flex items-center justify-end gap-2.5', className)}>
      <button
        type="button"
        onClick={() => setSalaMusica({ mudo: !prefs.mudo })}
        aria-pressed={!prefs.mudo}
        aria-label={prefs.mudo ? 'Ligar a trilha da Sala de Jogos' : 'Silenciar a trilha da Sala de Jogos'}
        className={cn('dv-focus flex min-h-11 items-center gap-2 px-1', calado ? 'text-dv-text-3' : 'text-dv-gold')}
      >
        <NotaGlyph mudo={calado} className="size-[18px]" />
        <span className="dv-label text-[10px] text-dv-text-2">{geralMudo ? 'Trilha · som desligado' : prefs.mudo ? 'Trilha desligada' : 'Trilha'}</span>
      </button>
      <label htmlFor={id} className="sr-only">
        Volume da trilha da Sala de Jogos
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(prefs.volume * 100)}
        disabled={prefs.mudo}
        onChange={(e) => setSalaMusica({ volume: Number(e.target.value) / 100 })}
        className="dv-focus h-11 w-24 cursor-pointer accent-[var(--dv-gold)] disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  )
}

function NotaGlyph({ mudo, className }: { mudo: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M8 15V4.5l8-1.8V13" strokeLinejoin="round" />
      <ellipse cx="5.8" cy="15.2" rx="2.3" ry="1.7" fill="currentColor" stroke="none" />
      <ellipse cx="13.8" cy="13.3" rx="2.3" ry="1.7" fill="currentColor" stroke="none" />
      {mudo && <path d="M3 3l14 14" strokeLinecap="round" />}
    </svg>
  )
}
