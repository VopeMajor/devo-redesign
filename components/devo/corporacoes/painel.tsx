import { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/*
 * Painel das Corporações (pedido do dono: sem mármore). Documento da Companhia: fundo de uma cor com degradê
 * leve, aro de aço recortado, rebites de aço junto aos chanfros e um traço de luz no topo. `edge` segue o
 * MarbleSlab (steel = destaque, blood = Necro, line = comum, amethyst = Companhia).
 */

type Aro = 'steel' | 'blood' | 'line' | 'amethyst'

const ARO: Record<Aro, string> = {
  steel: 'bg-[image:var(--dv-champagne-grad)]',
  amethyst: 'bg-[linear-gradient(135deg,var(--dv-amethyst-light)_0%,var(--dv-amethyst-deep)_30%,var(--dv-champagne)_55%,var(--dv-amethyst-deep)_80%,var(--dv-amethyst-light)_100%)]',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
  line: 'bg-[linear-gradient(135deg,rgb(var(--dv-champagne-rgb)/0.45),rgb(var(--dv-champagne-rgb)/0.12)_45%,rgb(var(--dv-champagne-rgb)/0.34))]',
}

const CORPO: Record<Aro, string> = {
  steel: 'bg-[linear-gradient(180deg,#1d1b22_0%,#141318_55%,#0f0e12_100%)]',
  amethyst: 'bg-[linear-gradient(180deg,#1e1a2a_0%,#15131c_55%,#0f0e14_100%)]',
  blood: 'bg-[linear-gradient(180deg,#22141a_0%,#160f12_55%,#100b0d_100%)]',
  line: 'bg-[linear-gradient(180deg,#19181d_0%,#131216_60%,#0f0e12_100%)]',
}

const COR_CANTO: Record<Aro, string> = { steel: '#d6cdbd', amethyst: '#b9aeea', blood: '#d0707c', line: '#9a9184' }

/** Rebite em losango junto a cada chanfro. */
function Rebite({ style, cor }: { style: CSSProperties; cor: string }) {
  return <span aria-hidden="true" className="pointer-events-none absolute size-[5px] rotate-45" style={{ background: cor, boxShadow: `0 0 4px ${cor}66`, ...style }} />
}

export function Painel({
  children,
  edge = 'line',
  cut = 12,
  className,
  innerClassName,
  glow = false,
  as: Tag = 'div',
  ...rest
}: {
  children?: ReactNode
  edge?: Aro
  cut?: number
  className?: string
  innerClassName?: string
  glow?: boolean
  /** Compatível com o MarbleSlab (sem efeito: o painel já é calmo). */
  quiet?: boolean
  as?: 'div' | 'section' | 'aside'
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const { quiet: _q, ...attrs } = rest as typeof rest & { quiet?: boolean }
  const cor = COR_CANTO[edge]
  const dentro = `${Math.max(0, cut - 0.4)}px`
  return (
    <Tag
      className={cn('relative isolate', glow && (edge === 'blood' ? 'drop-shadow-[0_0_18px_rgb(var(--dv-blood-rgb)/0.35)]' : 'drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)]'), className)}
      style={{ '--dv-cut': `${cut}px` } as CSSProperties}
      {...attrs}
    >
      <span aria-hidden="true" className={cn('dv-cut pointer-events-none absolute inset-0 -z-10', ARO[edge])} />
      <span aria-hidden="true" className={cn('dv-cut pointer-events-none absolute inset-px -z-10', CORPO[edge])} style={{ '--dv-cut': dentro } as CSSProperties} />
      {/* luz fria no alto, como papel timbrado sob a lâmpada */}
      <span
        aria-hidden="true"
        className="dv-cut pointer-events-none absolute inset-px -z-10 bg-[radial-gradient(90%_55%_at_50%_0%,rgb(var(--dv-amethyst-rgb)/0.09),transparent_70%)]"
        style={{ '--dv-cut': dentro } as CSSProperties}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-[16%] top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <Rebite cor={cor} style={{ left: cut * 0.5 + 3, top: cut * 0.5 + 3 }} />
      <Rebite cor={cor} style={{ right: cut * 0.5 + 3, top: cut * 0.5 + 3 }} />
      <Rebite cor={cor} style={{ left: cut * 0.5 + 3, bottom: cut * 0.5 + 3 }} />
      <Rebite cor={cor} style={{ right: cut * 0.5 + 3, bottom: cut * 0.5 + 3 }} />
      <div className={cn('relative', innerClassName)}>{children}</div>
    </Tag>
  )
}
