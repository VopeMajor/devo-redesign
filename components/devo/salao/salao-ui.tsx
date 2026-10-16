'use client'

import { Minus, Plus } from 'lucide-react'
import { type CSSProperties, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { formatTempo } from '@/lib/devo/salao'
import type { Rarity } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { GlyphHourglass } from '../kit/glyphs'
import { MarbleSlab } from '../os/shell-ui'
import { CardFace } from '../shared/devo-card'

/*
 * Peças locais do Salão das Máscaras (mármore negro + aço champanhe). Candidatas ao kit: TempoCampo (campo de
 * minutos com passo), Selo (selo curto de estado) e Placa (tampo com título e numeração de lote).
 */

/** Tampo de mármore com título em caixa-alta serifada e legenda (seções das abas). */
export function Placa({
  titulo,
  legenda,
  direita,
  children,
  className,
  edge = 'line',
  ariaLabel,
}: {
  titulo?: string
  legenda?: string
  direita?: ReactNode
  children?: ReactNode
  className?: string
  edge?: 'line' | 'steel'
  ariaLabel?: string
}) {
  return (
    <MarbleSlab as="section" edge={edge} cut={12} quiet aria-label={ariaLabel ?? titulo} className={className} innerClassName="p-4">
      {titulo && (
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.14em] text-dv-text">{titulo}</h3>
            {legenda && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">{legenda}</p>}
          </div>
          {direita}
        </header>
      )}
      {children}
    </MarbleSlab>
  )
}

export type SeloTom = 'aco' | 'ametista' | 'quieto' | 'rubi'

/** Selo curto (Você lidera, Em avaliação, Vendido…). Texto ≥ 11px; rubi só alerta. */
export function Selo({ children, tom = 'aco', className }: { children: ReactNode; tom?: SeloTom; className?: string }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 font-mono text-[11px] uppercase leading-none tracking-[0.12em]',
        tom === 'aco' && 'bg-[rgba(12,12,14,0.75)] text-dv-text shadow-[inset_0_0_0_1px_rgba(206,201,192,0.6)]',
        tom === 'ametista' && 'bg-[#1d1a2b] text-dv-amethyst-text shadow-[inset_0_0_0_1px_rgba(138,124,200,0.7)]',
        tom === 'quieto' && 'text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
        tom === 'rubi' && 'bg-[#1a0d0f] text-dv-blood-text shadow-[inset_0_0_0_1px_var(--dv-blood)]',
        className,
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {tom === 'ametista' && <span aria-hidden="true" className="size-[6px] rotate-45 bg-dv-amethyst shadow-[0_0_6px_rgba(138,124,200,0.9)]" />}
      {children}
    </span>
  )
}

/** Valor em Tempo com ampulheta (números tabulares). */
export function Tempo({ min, className, forte = false }: { min: number; className?: string; forte?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 dv-tabular', className)}>
      <GlyphHourglass aria-hidden="true" className={cn('shrink-0', forte ? 'size-4 text-dv-gold' : 'size-3.5 text-dv-text-3')} />
      <span className={cn(forte ? 'font-impact text-[22px] font-semibold leading-none text-dv-text' : 'font-mono text-[13px] text-dv-text')}>{formatTempo(min)}</span>
    </span>
  )
}

/** Carta pequena (face do kit de cartas) com a cor da raridade no filete. */
export function CartaMini({ cardId, className }: { cardId: string; className?: string }) {
  return <CardFace cardId={cardId} className={cn('w-full', className)} />
}

export function nomeCarta(cardId: string) {
  try {
    return getCard(cardId).name
  } catch {
    return cardId
  }
}

export function RaridadeTexto({ r, className }: { r: Rarity; className?: string }) {
  const m = RARITY_META[r]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]', className)} style={{ color: m.color }}>
      <span aria-hidden="true" className="size-[7px] rotate-45" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

/** Campo de minutos com passo (− / +). Valor inteiro; o servidor confere de novo. */
export function TempoCampo({
  id,
  rotulo,
  valor,
  onChange,
  min,
  max,
  passo,
  dica,
}: {
  id: string
  rotulo: string
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  passo: number
  dica?: ReactNode
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v))))
  return (
    <div>
      <label htmlFor={id} className="dv-label block text-[10px] tracking-[0.2em] text-dv-text-2">
        {rotulo}
      </label>
      <div className="mt-2 flex items-stretch gap-2">
        <button
          type="button"
          aria-label={`Diminuir ${passo} minutos`}
          disabled={valor <= min}
          onClick={() => {
            playSfx('click')
            set(valor - passo)
          }}
          className="dv-focus dv-cut-diag grid min-h-12 w-12 place-items-center text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] enabled:hover:shadow-[inset_0_0_0_1px_#bab09f] disabled:opacity-35"
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <Minus className="size-4" strokeWidth={1.5} />
        </button>
        <span className="relative flex flex-1 items-center bg-black/40 shadow-[inset_0_0_0_1px_var(--dv-line-strong)] focus-within:shadow-[inset_0_0_0_1px_#bab09f]">
          <GlyphHourglass aria-hidden="true" className="ml-3 size-4 shrink-0 text-dv-gold" />
          <input
            id={id}
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(valor)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ''))
              onChange(Number.isFinite(n) ? Math.min(max, n) : min)
            }}
            onBlur={() => set(valor)}
            className="h-12 w-full bg-transparent px-2 font-impact text-[22px] font-semibold text-dv-text outline-none dv-tabular"
          />
          <span className="pr-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-3">min · {formatTempo(valor)}</span>
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${passo} minutos`}
          disabled={valor >= max}
          onClick={() => {
            playSfx('click')
            set(valor + passo)
          }}
          className="dv-focus dv-cut-diag grid min-h-12 w-12 place-items-center text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] enabled:hover:shadow-[inset_0_0_0_1px_#bab09f] disabled:opacity-35"
          style={{ '--dv-cut': '8px' } as CSSProperties}
        >
          <Plus className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      {dica && <p className="mt-2 font-body text-[14px] leading-snug text-dv-text-2">{dica}</p>}
    </div>
  )
}

/** Linha de dado (rótulo mono + valor). */
export function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border-b border-dv-line py-2 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">{rotulo}</span>
      <span className="text-right font-body text-[15px] text-dv-text">{children}</span>
    </div>
  )
}

/** Vazio com marca (losango aberto + frase). */
export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rotate-45 shadow-[inset_0_0_0_1.5px_var(--dv-line-strong)]" />
      <div>
        <p className="font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-dv-text">{titulo}</p>
        {children && <p className="mt-1 font-body text-[15px] leading-relaxed text-dv-text-2">{children}</p>}
      </div>
    </div>
  )
}

export function Erro({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="border border-dv-blood/50 bg-dv-blood-deep/50 px-3 py-2 font-body text-[14px] leading-snug text-dv-blood-text">
      {children}
    </p>
  )
}
