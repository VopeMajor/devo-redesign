import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/*
 * Peças locais do shell (área SISTEMA) na paleta do tabuleiro de mármore (DIRECAO-2 §6):
 * tampo de mármore negro com veio cinza e filete de aço champanhe; selo de estado em contorno
 * prata com ponto ametista. Candidatos ao kit (ver relatório da rodada 3).
 */

type SlabEdge = 'steel' | 'blood' | 'line'

const EDGE: Record<SlabEdge, string> = {
  steel: 'bg-[linear-gradient(135deg,#f4efe6_0%,#6b6357_26%,#bab09f_52%,#5f584d_78%,#ece5d8_100%)]',
  blood: 'bg-[linear-gradient(135deg,var(--dv-blood-text),var(--dv-blood)_45%,var(--dv-blood-deep))]',
  line: 'bg-[linear-gradient(135deg,rgba(238,237,235,0.34),rgba(238,237,235,0.12)_45%,rgba(238,237,235,0.26))]',
}

/**
 * Tampo de mármore negro (camadas recortadas: filete + pedra). O conteúdo não é recortado.
 * `cut` = chanfro nos 4 cantos (px). `edge` = cor do filete.
 */
export function MarbleSlab({
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
  edge?: SlabEdge
  cut?: number
  className?: string
  innerClassName?: string
  glow?: boolean
  as?: 'div' | 'section' | 'aside'
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  return (
    <Tag
      className={cn('relative isolate', glow && (edge === 'blood' ? 'drop-shadow-[0_0_18px_rgba(163,18,31,0.4)]' : 'drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)]'), className)}
      style={{ '--dv-cut': `${cut}px` } as CSSProperties}
      {...rest}
    >
      <span aria-hidden="true" className={cn('dv-cut pointer-events-none absolute inset-0 -z-10', EDGE[edge])} />
      <span aria-hidden="true" className="dv-cut dv-marble-dark pointer-events-none absolute inset-px -z-10" style={{ '--dv-cut': `${Math.max(0, cut - 0.4)}px` } as CSSProperties} />
      {/* luz rasante no tampo (polimento) */}
      <span
        aria-hidden="true"
        className="dv-cut pointer-events-none absolute inset-px -z-10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),transparent_38%,rgba(0,0,0,0.35))]"
        style={{ '--dv-cut': `${Math.max(0, cut - 0.4)}px` } as CSSProperties}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-[16%] top-px -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className={cn('relative', innerClassName)}>{children}</div>
    </Tag>
  )
}

/**
 * Selo de estado curto (ESTÁVEL, CRÍTICO, INSTALADO…). `steel` = contorno prata, texto porcelana,
 * ponto ametista; `blood` = só em alerta; `quiet` = contorno prata sem ponto. Texto ≥ 11px.
 */
export function StateSeal({ children, tone = 'steel', dot = true, live = false, className }: { children: ReactNode; tone?: 'steel' | 'blood' | 'quiet'; dot?: boolean; live?: boolean; className?: string }) {
  const blood = tone === 'blood'
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-7 shrink-0 items-center gap-2 px-3 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.16em]',
        blood
          ? 'bg-[#1a0d0f] text-dv-blood-text shadow-[inset_0_0_0_1px_var(--dv-blood)]'
          : 'bg-[rgba(12,12,14,0.72)] text-dv-text shadow-[inset_0_0_0_1px_rgba(206,201,192,0.62)]',
        className,
      )}
      style={{ '--dv-cut': '7px' } as CSSProperties}
    >
      {dot && tone !== 'quiet' && (
        <span
          aria-hidden="true"
          className={cn(
            'size-[7px] rotate-45',
            blood ? 'bg-dv-blood-text' : 'bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.9)]',
            live && 'animate-dv-blink',
          )}
        />
      )}
      {children}
    </span>
  )
}
