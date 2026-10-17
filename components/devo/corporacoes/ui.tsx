'use client'

import { type CSSProperties, type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { MarbleSlab } from '../os/shell-ui'

/*
 * Peças locais das Corporações (mármore negro + aço champanhe). Candidatas ao kit (iguais em espírito às do
 * Salão): Placa (tampo com título), Selo (estado curto), Campo (input de mármore), Vazio, Erro.
 */

export function Placa({
  titulo,
  legenda,
  direita,
  children,
  className,
  edge = 'line',
  ariaLabel,
  glow,
}: {
  titulo?: string
  legenda?: string
  direita?: ReactNode
  children?: ReactNode
  className?: string
  edge?: 'line' | 'steel' | 'blood'
  ariaLabel?: string
  glow?: boolean
}) {
  return (
    <MarbleSlab as="section" edge={edge} cut={12} quiet glow={glow} aria-label={ariaLabel ?? titulo} className={className} innerClassName="p-4">
      {titulo && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.14em] text-dv-text">{titulo}</h3>
            {legenda && <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">{legenda}</p>}
          </div>
          {direita}
        </header>
      )}
      {children}
    </MarbleSlab>
  )
}

export type SeloTom = 'aco' | 'ametista' | 'quieto' | 'rubi'

export function Selo({ children, tom = 'aco', className }: { children: ReactNode; tom?: SeloTom; className?: string }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 font-mono text-[11px] uppercase leading-none tracking-[0.12em]',
        tom === 'aco' && 'bg-[rgb(var(--dv-ink-rgb)/0.75)] text-dv-text shadow-[inset_0_0_0_1px_rgba(206,201,192,0.6)]',
        tom === 'ametista' && 'bg-dv-cobalt-dim text-dv-amethyst-text shadow-[inset_0_0_0_1px_rgb(var(--dv-amethyst-rgb)/0.7)]',
        tom === 'quieto' && 'text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
        tom === 'rubi' && 'bg-[#1a0d0f] text-dv-blood-text shadow-[inset_0_0_0_1px_var(--dv-blood)]',
        className,
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {tom === 'ametista' && <span aria-hidden="true" className="size-[6px] rotate-45 bg-dv-amethyst shadow-[0_0_6px_rgb(var(--dv-amethyst-rgb)/0.9)]" />}
      {tom === 'rubi' && <span aria-hidden="true" className="size-[6px] rotate-45 bg-dv-blood" />}
      {children}
    </span>
  )
}

export const Campo = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Campo({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      {...rest}
      className={cn(
        'h-12 w-full bg-black/45 px-3 font-body text-[16px] text-dv-text outline-none shadow-[inset_0_0_0_1px_var(--dv-line-strong)] placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_#bab09f] disabled:opacity-50',
        className,
      )}
    />
  )
})

export function Rotulo({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="dv-label mb-2 block text-[10px] tracking-[0.2em] text-dv-text-2">
      {children}
    </label>
  )
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
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

/** Monograma de um Record (sem foto: inicial em aço sobre ônix). */
export function Monograma({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('dv-cut grid size-10 shrink-0 place-items-center bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink))] font-display text-[16px] font-semibold text-dv-gold-bright shadow-[inset_0_0_0_1px_rgba(186,176,159,0.5)]', className)}
      style={{ '--dv-cut': '7px' } as CSSProperties}
    >
      {(nome.trim()[0] ?? '?').toLocaleUpperCase('pt-BR')}
    </span>
  )
}

export function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-dv-line py-1.5 last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">{rotulo}</dt>
      <dd className="text-right font-body text-[15px] text-dv-text">{children}</dd>
    </div>
  )
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
/** "08 out" (horário de Brasília), curto para caber em uma linha. */
export function dataCurta(ms: number) {
  const [d, m] = new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).split('/')
  return `${d} ${MESES[Number(m) - 1] ?? ''}`
}
