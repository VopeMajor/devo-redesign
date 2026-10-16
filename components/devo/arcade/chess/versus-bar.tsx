import type { CSSProperties } from 'react'
import { TimeDigits } from '@/components/devo/kit'
import { cn } from '@/lib/utils'

export type PlateSide = {
  name: string
  /** Corte (lado do tabuleiro): "Corte de Marfim" / "Corte de Ônix". */
  court: string
  color: 'w' | 'b'
  portrait: string | null
  ms: number
  /** Material capturado (soma dos valores das peças). */
  captures: number
  active: boolean
  mine: boolean
}

/** ≤10s: atenção (branco pulsando); ≤5s: perigo real (rubi). */
function urgency(ms: number, active: boolean) {
  const s = ms / 1000
  return !active ? 0 : s <= 5 ? 2 : s <= 10 ? 1 : 0
}

/**
 * Plaqueta de um jogador no Living Chess: retrato (ou monograma), nome, corte e material
 * capturado à esquerda; relógio grande à direita; régua de tempo embaixo. Uma linha, sem
 * sobreposição de textos — o código da partida mora no cabeçalho.
 */
export function PlayerPlate({ side, total, className }: { side: PlateSide; total: number; className?: string }) {
  const level = urgency(side.ms, side.active)
  const pct = Math.max(0, Math.min(100, (side.ms / total) * 100))
  const secs = Math.max(0, Math.ceil(side.ms / 1000))
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  const edge = level === 2 ? 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]' : side.active ? (side.mine ? 'bg-[linear-gradient(135deg,#cbc5e8,#5a4f8f_45%,#2c2c31)]' : 'bg-[linear-gradient(135deg,#ece5d8,#6b6357_45%,#2c2c31)]') : 'bg-dv-line'
  return (
    <div className={cn('relative isolate transition-opacity duration-[220ms]', !side.active && 'opacity-80', className)} style={{ '--dv-cut': '10px' } as CSSProperties}>
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', edge)} />
      <span aria-hidden="true" className="dv-cut-diag dv-velvet absolute inset-px -z-10" style={{ '--dv-cut': '9.5px' } as CSSProperties} />
      <div className="flex items-center gap-3 px-2.5 py-2">
        {side.portrait ? (
          <img src={side.portrait} alt={`Foto de ${side.name}`} className="size-11 shrink-0 object-cover dv-brass-edge" />
        ) : (
          <span
            role="img"
            aria-label={`${side.name} sem foto`}
            className={cn(
              'grid size-11 shrink-0 place-items-center font-display text-[20px] font-semibold dv-brass-edge',
              side.color === 'w' ? 'dv-porcelain' : 'dv-marble-dark text-dv-text',
            )}
          >
            {side.name.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="w-full truncate font-display text-[14px] font-semibold uppercase leading-none tracking-[0.1em] text-dv-text">{side.name}</p>
          <p className="dv-label flex w-full min-w-0 items-center gap-2 text-[10px] leading-none tracking-[0.16em] text-dv-text-3">
            <span aria-hidden="true" className={cn('size-2 shrink-0 rotate-45 border border-dv-gold/70', side.color === 'w' ? 'bg-dv-porcelain' : 'bg-dv-ink')} />
            <span className="truncate">{side.court}</span>
            {side.captures > 0 && <span className="shrink-0 text-dv-gold-bright">+{side.captures}</span>}
          </p>
        </div>
        <div className={cn('flex shrink-0 flex-col items-end', level === 1 && 'animate-dv-alert')}>
          <TimeDigits value={clock} size="md" tone={level === 2 ? 'blood' : side.active ? 'text' : 'text'} flip label={`Relógio de ${side.name}`} className={cn(!side.active && 'opacity-70')} />
        </div>
      </div>
      <div className="mx-2.5 mb-1.5 h-[3px] bg-white/10" aria-hidden="true">
        <div
          className={cn('h-full transition-[width] duration-200 ease-linear', level === 2 ? 'bg-dv-blood-text' : side.mine ? 'bg-dv-amethyst' : 'bg-dv-gold')}
          style={{ width: `${side.active ? pct : 100}%`, opacity: side.active ? 1 : 0.35 }}
        />
      </div>
    </div>
  )
}
