'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DeadlyVoteSymbol } from '../system/symbol'
import { CornerFiligree, GlyphDiamond } from './glyphs'

export type CardTone = 'neutral' | 'cobalt' | 'gold' | 'blood'
export type CardSize = 'sm' | 'md' | 'lg'

const WIDTH: Record<CardSize, string> = { sm: 'w-[92px]', md: 'w-[148px]', lg: 'w-[220px]' }

const BORDER: Record<CardTone, string> = {
  neutral: 'from-[#cfd3dc] via-[#6c7180] to-[#cfd3dc]',
  cobalt: 'from-[#a9bbff] via-[var(--dv-cobalt-deep)] to-[#a9bbff]',
  gold: 'from-[var(--dv-gold-bright)] via-[var(--dv-gold-deep)] to-[var(--dv-gold-bright)]',
  blood: 'from-[var(--dv-blood-text)] via-[var(--dv-blood-deep)] to-[var(--dv-blood-text)]',
}
const ACCENT: Record<CardTone, string> = {
  neutral: 'text-[#d9dce3]',
  cobalt: 'text-dv-cobalt-text',
  gold: 'text-dv-gold-bright',
  blood: 'text-dv-blood-text',
}

/**
 * Moldura de carta/item (proporção 5:7). Use para cartas do inventário, prêmios e itens.
 * `face="back"` desenha o verso oficial (noite + treliça dourada + sigilo).
 * `holo` liga o brilho holográfico que acompanha o ponteiro. Se `onClick`, vira botão.
 */
export function CardFrame({
  title,
  index,
  tone = 'gold',
  size = 'md',
  face = 'front',
  holo = false,
  selected = false,
  label,
  children,
  className,
  onClick,
  disabled,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'type'> & {
  /** Nome no rodapé da carta. */
  title?: string
  /** Índice de canto ("07", "VII"). */
  index?: string
  tone?: CardTone
  size?: CardSize
  face?: 'front' | 'back'
  holo?: boolean
  selected?: boolean
  /** Nome acessível quando é botão (padrão: título). */
  label?: string
  /** Arte da carta (frente). */
  children?: ReactNode
}) {
  const interactive = !!onClick
  const small = size === 'sm'
  const body = (
    <>
      {/* moldura metálica */}
      <span aria-hidden="true" className={cn('absolute inset-0 rounded-[7%/5%] bg-gradient-to-br', BORDER[tone])} />
      <span aria-hidden="true" className="absolute inset-[3px] overflow-hidden rounded-[6%/4.3%] bg-dv-ink">
        {face === 'back' ? <CardBack tone={tone} small={small} /> : <span className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_20%,var(--dv-ink-4),var(--dv-ink))]" />}
      </span>
      {face === 'front' && (
        <span className="absolute inset-[3px] flex flex-col overflow-hidden rounded-[6%/4.3%]">
          <span className="relative flex-1 overflow-hidden">{children}</span>
          {title && (
            <span className={cn('relative border-t border-white/10 bg-black/45 px-1.5 text-center font-display font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text', small ? 'py-1 text-[9px]' : 'py-1.5 text-[12px]')}>
              {title}
            </span>
          )}
        </span>
      )}
      {/* filete interno + cantos */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-[7px] rounded-[4%/3%] border border-current opacity-50', ACCENT[tone])} />
      {!small && (
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-[5px]', ACCENT[tone])}>
          <CornerFiligree className="absolute left-0 top-0 size-5" />
          <CornerFiligree className="absolute right-0 top-0 size-5 rotate-90" />
          <CornerFiligree className="absolute bottom-0 right-0 size-5 rotate-180" />
          <CornerFiligree className="absolute bottom-0 left-0 size-5 -rotate-90" />
        </span>
      )}
      {index && face === 'front' && (
        <span aria-hidden="true" className={cn('absolute left-2.5 top-2.5 flex flex-col items-center font-impact font-semibold leading-none dv-tabular [text-shadow:0_1px_2px_#000]', small ? 'text-[11px]' : 'text-[15px]', ACCENT[tone])}>
          {index}
          <GlyphDiamond filled className={small ? 'mt-0.5 size-1.5' : 'mt-1 size-2'} />
        </span>
      )}
      {holo && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[6%/4.3%] opacity-60 mix-blend-color-dodge transition-[background-position] duration-500"
          style={{
            backgroundImage:
              'linear-gradient(115deg, transparent 20%, rgba(125,151,255,0.35) 36%, rgba(236,212,154,0.4) 46%, rgba(255,90,99,0.22) 54%, transparent 70%)',
            backgroundSize: '250% 250%',
            backgroundPosition: 'var(--hx, 30%) var(--hy, 30%)',
          }}
        />
      )}
      {selected && <span aria-hidden="true" className="pointer-events-none absolute -inset-[3px] rounded-[8%/6%] shadow-[0_0_0_2px_var(--dv-cobalt),0_0_22px_rgba(49,93,255,0.7)]" />}
    </>
  )

  const shared = cn('relative block aspect-[5/7] shrink-0 select-none', WIDTH[size], className)
  const onMove = holo
    ? (e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--hx', `${((e.clientX - r.left) / r.width) * 100}%`)
        e.currentTarget.style.setProperty('--hy', `${((e.clientY - r.top) / r.height) * 100}%`)
      }
    : undefined

  if (interactive) {
    return (
      <button
        type="button"
        aria-label={label ?? title}
        aria-pressed={selected}
        onClick={onClick}
        disabled={disabled}
        onPointerMove={onMove}
        className={cn(shared, 'dv-focus transition-transform duration-200 ease-out enabled:hover:-translate-y-1 enabled:active:scale-[0.97] disabled:opacity-50')}
        {...rest}
      >
        {body}
      </button>
    )
  }
  return (
    <div role="img" aria-label={label ?? title ?? 'Carta'} className={shared} onPointerMove={onMove} style={rest.style as CSSProperties | undefined}>
      {body}
    </div>
  )
}

/** Verso oficial: noite com treliça dourada (losangos) e o sigilo ao centro. */
function CardBack({ tone, small }: { tone: CardTone; small: boolean }) {
  return (
    <span className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,var(--dv-ink-4),var(--dv-ink))]">
      <span
        className="absolute inset-[10%] opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(45deg, transparent 47%, var(--dv-gold-deep) 48%, var(--dv-gold-deep) 52%, transparent 53%), linear-gradient(-45deg, transparent 47%, var(--dv-gold-deep) 48%, var(--dv-gold-deep) 52%, transparent 53%)',
          backgroundSize: small ? '12px 12px' : '20px 20px',
        }}
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className={cn('grid aspect-square w-[52%] place-items-center rounded-full border border-current bg-dv-ink/90', ACCENT[tone === 'neutral' ? 'gold' : tone])}>
          <DeadlyVoteSymbol variant={small ? 'mark' : 'full'} className="size-[78%]" />
        </span>
      </span>
    </span>
  )
}
