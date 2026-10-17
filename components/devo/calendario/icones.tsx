'use client'

import type { IconeRecompensa } from '@/lib/devo/calendario'
import { cn } from '@/lib/utils'
import { EmblemCalendario } from '../kit/emblems'

const ARTE_ICONE: Record<IconeRecompensa, string> = {
  pp: 'pp',
  fragmento: 'fragmento',
  tempo: 'ampulheta',
  dracma_comum: 'dracma-comum',
  dracma_incomum: 'dracma-incomum',
  carta: 'carta-incomum',
  item: 'presente',
}

/**
 * Ícone pintado de cada recompensa de check-in (infra/arte → public/images/calendario/icones/<nome>-{64,128,256}.webp,
 * com alfa): P.P., fragmento, ampulheta, dracmas, carta e o presente (item genérico / check-in de evento).
 */
export function RecompensaIcone({ icone, className, grande = false }: { icone: IconeRecompensa | 'presente'; className?: string; grande?: boolean }) {
  const nome = icone === 'presente' ? 'presente' : ARTE_ICONE[icone]
  const base = `/images/calendario/icones/${nome}`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}-${grande ? 256 : 128}.webp`}
      srcSet={grande ? `${base}-256.webp 256w` : `${base}-64.webp 64w, ${base}-128.webp 128w, ${base}-256.webp 256w`}
      sizes={grande ? '144px' : '46px'}
      alt=""
      draggable={false}
      className={cn('size-full select-none object-contain', className)}
    />
  )
}

/** srcSet de uma arte de evento do pipeline (`/images/calendario/<nome>-<lado>.webp`); outras artes: só o src. */
export function srcSetArte(arte: string): string | undefined {
  const m = arte.match(/^(\/images\/calendario\/[a-z0-9-]+)-(256|512|768|1024)\.webp$/)
  return m ? [256, 512, 768, 1024].map((n) => `${m[1]}-${n}.webp ${n}w`).join(', ') : undefined
}

/** Placa ornamental no espaço da arte de um evento sem ilustração própria. */
export function ArteVazia({ dia, mes, enfase, className }: { dia: number; mes: string; enfase: 'atencao' | 'folga' | 'normal'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid size-full place-items-center overflow-hidden',
        enfase === 'atencao' ? 'bg-[linear-gradient(160deg,var(--dv-wine),var(--dv-wine-deep)_60%,var(--dv-abyss))]' : 'bg-[linear-gradient(160deg,var(--dv-fog),var(--dv-ink-2)_60%,var(--dv-abyss))]',
        className,
      )}
    >
      <EmblemCalendario className={cn('absolute -right-3 -top-3 size-20 opacity-[0.12]', enfase === 'atencao' ? 'text-dv-wine-text' : 'text-dv-silver')} />
      <span className="relative flex flex-col items-center leading-none">
        <span className="font-serif text-[38px] font-medium text-dv-text dv-tabular">{String(dia).padStart(2, '0')}</span>
        <span className={cn('mt-1 font-mono text-[10px] uppercase tracking-[0.22em]', enfase === 'atencao' ? 'text-dv-wine-text' : 'text-dv-silver')}>{mes}</span>
      </span>
    </span>
  )
}
