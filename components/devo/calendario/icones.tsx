'use client'

import type { IconeRecompensa } from '@/lib/devo/calendario'
import { cn } from '@/lib/utils'
import { EmblemCalendario, EmblemVirtudes } from '../kit/emblems'
import { GlyphCard, GlyphHourglass, GlyphSpark } from '../kit/glyphs'
import { DracmaIcon } from '../poco/poco-cena'

/**
 * Ícone de cada recompensa de check-in, com a arte que já existe no jogo: P.P. = emblema das Virtudes,
 * Fragmentos = cristais pintados do Poço, Horas = ampulheta, Dracmas = moedas do Poço, Carta = carta do Shuffler.
 */
export function RecompensaIcone({ icone, className, grande = false }: { icone: IconeRecompensa; className?: string; grande?: boolean }) {
  switch (icone) {
    case 'pp':
      return <EmblemVirtudes metal className={cn('size-full', className)} />
    case 'fragmento':
      // eslint-disable-next-line @next/next/no-img-element
      return <img src="/images/poco/fragmento.webp" alt="" draggable={false} className={cn('size-full object-contain', grande ? '' : 'scale-[1.25]', className)} />
    case 'tempo':
      return <GlyphHourglass className={cn('size-full text-dv-gold-bright', className)} />
    case 'dracma_comum':
      return <DracmaIcon raridade="comum" className={cn('size-full', className)} />
    case 'dracma_incomum':
      return <DracmaIcon raridade="incomum" className={cn('size-full', className)} />
    case 'carta':
      return <GlyphCard className={cn('size-full text-dv-gold-bright', className)} />
    default:
      return <GlyphSpark className={cn('size-full text-dv-gold-bright', className)} />
  }
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
