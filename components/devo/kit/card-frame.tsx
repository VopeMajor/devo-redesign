'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DeadlyVoteSymbol } from '../system/symbol'
import { GlyphDiamond } from './glyphs'

export type CardTone = 'neutral' | 'cobalt' | 'gold' | 'blood'
export type CardSize = 'sm' | 'md' | 'lg'

const WIDTH: Record<CardSize, string> = { sm: 'w-[92px]', md: 'w-[148px]', lg: 'w-[220px]' }

/**
 * Mesma matéria da Carta DEVO (components/devo/shared/devo-card.tsx, padrão único do jogo):
 * moldura de metal, bisel, mármore negro, janela ogival e filete. Os tons mapeiam as peles:
 * neutral = ferro, cobalt = prata (sistema), gold = champanhe, blood = ferro com filete rubi.
 */
const SKIN: Record<CardTone, { frame: string; filet: string; light: string }> = {
  neutral: { frame: 'linear-gradient(150deg,#77767b 0%,#2c2c31 32%,#8f8e8b 52%,#1f1f22 74%,#5d5c61 100%)', filet: '#8f8e8b', light: '#c4c3c7' },
  cobalt: { frame: 'linear-gradient(150deg,#ffffff 0%,#9a97a3 24%,#ecebef 48%,#5b5863 72%,#f3f1f6 100%)', filet: '#dcdae2', light: '#eceaf0' },
  gold: { frame: 'linear-gradient(150deg,#f4efe6 0%,#9a9184 20%,#ece5d8 40%,#5d564c 62%,#d8d0c2 82%,#f4efe6 100%)', filet: '#d6cdbd', light: '#ece5d8' },
  blood: { frame: 'linear-gradient(150deg,#77767b 0%,#2c2c31 32%,#8f8e8b 52%,#1f1f22 74%,#5d5c61 100%)', filet: '#a3121f', light: '#ff6670' },
}
const ACCENT: Record<CardTone, string> = {
  neutral: 'text-[#c4c3c7]',
  cobalt: 'text-[#eceaf0]',
  gold: 'text-dv-gold-bright',
  blood: 'text-dv-blood-text',
}

/** Janela ogival (polígono em %), igual à da Carta DEVO. */
const ARCH_CLIP = (() => {
  const rise = 17
  const c = 74
  const end = Math.acos(1 - 50 / c)
  const n = 12
  const at = (i: number) => {
    const a = (end * i) / n
    return [c - c * Math.cos(a), rise * (1 - Math.sin(a) / Math.sin(end))] as const
  }
  const pts: [number, number][] = [[0, 100], [0, rise]]
  for (let i = 1; i <= n; i++) pts.push([...at(i)] as [number, number])
  for (let i = n - 1; i >= 1; i--) {
    const [x, y] = at(i)
    pts.push([100 - x, y])
  }
  pts.push([100, rise], [100, 100])
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`
})()
const STAR4 = 'M12 0.5 C12.6 8.6 15.4 11.4 23.5 12 C15.4 12.6 12.6 15.4 12 23.5 C11.4 15.4 8.6 12.6 0.5 12 C8.6 11.4 11.4 8.6 12 0.5 Z'

/**
 * Moldura de carta/item (proporção 5:7). Use para cartas do inventário, prêmios e itens.
 * Mesma matéria da Carta DEVO (mármore negro, aço, janela ogival). `face="back"` desenha o verso oficial.
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
  const skin = SKIN[tone]
  const body = (
    <>
      {/* moldura de metal + bisel */}
      <span aria-hidden="true" className="absolute inset-0 rounded-[5cqw]" style={{ background: skin.frame, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 26px -14px rgba(0,0,0,0.9)' }} />
      <span aria-hidden="true" className="absolute inset-[1.5cqw] rounded-[3.9cqw] shadow-[0_0_0_0.5px_rgba(0,0,0,0.55),inset_0_0_0_0.5px_rgba(255,255,255,0.18)]" />
      <span className="absolute inset-[2.6cqw] overflow-hidden rounded-[3.2cqw] bg-[#0c0c0e]">
        <span aria-hidden="true" className="dv-marble-dark absolute inset-0 opacity-90" />
        {face === 'back' ? (
          <CardBackArt />
        ) : (
          <>
            <span className="absolute inset-x-[3cqw] top-[3cqw] h-[96cqw] overflow-hidden" style={{ clipPath: ARCH_CLIP }}>
              <span className="absolute inset-0 [&>*]:size-full">{children}</span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[35%] bg-[linear-gradient(to_top,rgba(12,12,14,0.9),transparent)]" />
            </span>
            {title && (
              <span className="absolute inset-x-[4cqw] bottom-[3cqw] hidden h-[25cqw] items-center justify-center text-center @min-[110px]:flex">
                <span className="line-clamp-2 pt-[0.14em] font-display text-[max(10px,8cqw)] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-[#eeedeb]">{title}</span>
              </span>
            )}
          </>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-[1.8cqw] rounded-[2cqw] border-solid opacity-45" style={{ borderColor: skin.filet, borderWidth: 'max(0.5px, 0.3cqw)' }} />
      </span>
      {index && face === 'front' && (
        <span aria-hidden="true" className={cn('absolute left-[7cqw] top-[22cqw] flex flex-col items-center font-display text-[max(9px,7cqw)] font-semibold leading-none dv-tabular [text-shadow:0_1px_2px_#000]', ACCENT[tone])}>
          {index}
          <GlyphDiamond filled className="mt-[1cqw] size-[0.5em]" />
        </span>
      )}
      {holo && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2.6cqw] rounded-[3.2cqw] opacity-35 mix-blend-color-dodge transition-[background-position] duration-500"
          style={{
            backgroundImage: 'linear-gradient(115deg, transparent 20%, rgba(203,197,232,0.35) 36%, rgba(236,229,216,0.42) 46%, rgba(170,214,220,0.2) 54%, transparent 70%)',
            backgroundSize: '250% 250%',
            backgroundPosition: 'var(--hx, 30%) var(--hy, 30%)',
          }}
        />
      )}
      {selected && <span aria-hidden="true" className="pointer-events-none absolute -inset-[3px] rounded-[6cqw] shadow-[0_0_0_2px_var(--dv-amethyst),0_0_18px_rgba(138,124,200,0.6)]" />}
    </>
  )

  const shared = cn('relative block aspect-[5/7] shrink-0 select-none [container-type:inline-size]', WIDTH[size], className)
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

/** Verso oficial (o mesmo da Carta DEVO): treliça de losangos em aço, sigilo num medalhão, duas estrelas. */
function CardBackArt() {
  const frame = SKIN.gold.frame
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-[5cqw] opacity-55"
        style={{
          backgroundImage:
            'linear-gradient(60deg, transparent 48.8%, #a59d90 49.4%, #a59d90 50.6%, transparent 51.2%), linear-gradient(-60deg, transparent 48.8%, #a59d90 49.4%, #a59d90 50.6%, transparent 51.2%)',
          backgroundSize: '16cqw 27.7cqw',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(70% 58% at 50% 50%, #000 35%, transparent 100%)',
        }}
      />
      <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[1.1cqw]" style={{ background: frame, boxShadow: '0 0 6cqw rgba(0,0,0,0.9)' }}>
        <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_38%,#2c2c31,#0c0c0e_70%)] text-[#ece5d8]">
          <DeadlyVoteSymbol variant="full" className="size-[80%]" />
        </span>
      </span>
      {['top-[6.5cqw]', 'bottom-[6.5cqw]'].map((p) => (
        <svg key={p} aria-hidden="true" viewBox="0 0 24 24" className={cn('absolute left-1/2 size-[8cqw] -translate-x-1/2 text-[#d6cdbd]', p)}>
          <path d={STAR4} fill="currentColor" />
        </svg>
      ))}
    </>
  )
}
