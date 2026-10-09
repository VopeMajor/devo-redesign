import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Hash estável de uma string (para barras de código e códigos derivados). */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Código de sistema no formato do Record (ex.: DV_R084_0518) a partir de uma semente. */
export function hudCode(seed: string, prefix = 'DV') {
  const h = hash(seed)
  return `${prefix}_R${String(h % 1000).padStart(3, '0')}_${String((h >>> 10) % 10000).padStart(4, '0')}`
}

/** Barra de código decorativa (larguras derivadas do valor; estável entre renders). */
export function Barcode({ value, height = 12, width = 72, className }: { value: string; height?: number; width?: number; className?: string }) {
  const h = hash(value)
  const bars: { x: number; w: number }[] = []
  let x = 0
  let k = h
  while (x < width) {
    const w = 1 + (k % 3)
    const gap = 1 + ((k >>> 3) % 2)
    if (x + w > width) break
    bars.push({ x, w })
    x += w + gap
    k = Math.imul(k ^ (k >>> 7), 2654435761) >>> 0
  }
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={cn('shrink-0 text-in-fg', className)} fill="currentColor">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height={height} />
      ))}
    </svg>
  )
}

/**
 * Código de HUD: mono minúsculo em caixa-alta, com subcódigo opcional e barra de código.
 * Decorativo por padrão (aria-hidden); passe `readable` se o código for informação real (ID).
 */
export function HudCode({ code, sub, barcode = false, tone = 'fg', readable = false, className }: { code: string; sub?: string; barcode?: boolean; tone?: 'fg' | 'accent' | 'muted'; readable?: boolean; className?: string }) {
  return (
    <span aria-hidden={readable ? undefined : true} className={cn('inline-flex items-center gap-2 font-mono uppercase leading-none', className)}>
      <span className="flex flex-col gap-[3px]">
        <span className={cn('text-[11px] tracking-[0.14em]', tone === 'accent' ? 'text-in-accent' : tone === 'muted' ? 'text-in-fg-3' : 'text-in-fg')}>{code}</span>
        {sub && <span className="text-[8px] tracking-[0.16em] text-in-fg-3">{sub}</span>}
      </span>
      {barcode && <Barcode value={code} height={sub ? 18 : 11} width={56} className={tone === 'accent' ? 'text-in-accent' : undefined} />}
    </span>
  )
}

/**
 * Régua de HUD: linha fina com marcações (a cada `step` px, maior a cada 5), quadrado na ponta e
 * rótulo/código opcionais. `vertical` gira para as margens laterais. Decorativa.
 */
export function HudRule({
  label,
  code,
  vertical = false,
  tone = 'fg',
  ticks = true,
  className,
}: {
  label?: ReactNode
  code?: string
  vertical?: boolean
  tone?: 'fg' | 'accent'
  ticks?: boolean
  className?: string
}) {
  const color = tone === 'accent' ? 'text-in-accent' : 'text-in-fg-3'
  if (vertical) {
    return (
      <div aria-hidden="true" className={cn('relative flex w-3 flex-col items-center', color, className)}>
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current opacity-50" />
        {ticks && (
          <span
            className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 opacity-60"
            style={{ background: 'repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 10px)', WebkitMaskImage: 'linear-gradient(90deg,transparent 0 25%,#000 25% 75%,transparent 75%)', maskImage: 'linear-gradient(90deg,transparent 0 25%,#000 25% 75%,transparent 75%)' }}
          />
        )}
        <span className="relative mt-0 size-1.5 bg-current" />
      </div>
    )
  }
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-2', color, className)}>
      {label && <span className="font-mono text-[9px] uppercase tracking-[0.16em]">{label}</span>}
      <span className="relative h-2 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current opacity-55" />
        {ticks && (
          <span
            className="absolute inset-x-0 bottom-0 h-full opacity-60"
            style={{
              background:
                'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 6px) bottom/100% 3px no-repeat, repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 30px) bottom/100% 7px no-repeat',
            }}
          />
        )}
      </span>
      <span className="size-1.5 shrink-0 bg-current" />
      {code && <span className="font-mono text-[9px] uppercase tracking-[0.16em]">{code}</span>}
    </div>
  )
}

/** Mira "+" de canto (marcas de registro de impressão). */
export function HudCross({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn('size-3 text-in-fg-3', className)} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M6 0v12M0 6h12" />
    </svg>
  )
}
