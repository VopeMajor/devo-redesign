import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { IconCorporacoes, IconLock, IconMascaras, IconPoco, IconTorre, IconVirtudes, IconArcano } from './icons'

/** Os seis sistemas reservados (Direção 2 §3). Nome, legenda e ícone únicos — use sempre daqui. */
export const FUTURE_SYSTEMS = [
  { id: 'torres', name: 'Torres de Ruptura', jp: '断裂の塔', hint: 'Andares I–IV', icon: <IconTorre /> },
  { id: 'poco', name: 'Poço dos Desejos', jp: '願いの井戸', hint: 'Invocações', icon: <IconPoco /> },
  { id: 'virtudes', name: 'Virtudes', jp: '美徳', hint: 'Atributos', icon: <IconVirtudes /> },
  { id: 'arcanos', name: 'Arcanos', jp: 'アルカナ', hint: 'Rank e poder', icon: <IconArcano /> },
  { id: 'corporacoes', name: 'Corporações', jp: '企業', hint: 'Guildas', icon: <IconCorporacoes /> },
  { id: 'mascaras', name: 'Salão das Máscaras', jp: '仮面の間', hint: 'Leilões', icon: <IconMascaras /> },
] as const

export type FutureSystemId = (typeof FUTURE_SYSTEMS)[number]['id']

/** Nó em estrela de quatro pontas (o sigilo) com cadeado — a "altura" trancada das Torres. */
export function LockedNode({ size = 64, lit = false, className }: { size?: number; lit?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" fill="none">
        <path d="M32 2C33.6 22 42 30.4 62 32 42 33.6 33.6 42 32 62 30.4 42 22 33.6 2 32 22 30.4 30.4 22 32 2Z" className="fill-in-bg stroke-in-fg-3" strokeWidth="1.1" />
        <path d="M32 12C33 25 39 31 52 32 39 33 33 39 32 52 31 39 25 33 12 32 25 31 31 25 32 12Z" className={lit ? 'fill-in-accent-fill/30 stroke-in-accent' : 'stroke-in-line-strong'} strokeWidth="0.8" />
      </svg>
      <IconLock className={cn('relative size-[34%]', lit ? 'text-in-accent' : 'text-in-fg-2')} />
    </span>
  )
}

/**
 * Sistema reservado ("em breve"): nó de estrela trancado + nome + legenda. Não é botão — é informação.
 * `row` = linha em lista; `tile` = cartão na grade; `node` = só o nó com rótulo (mapa das Torres).
 */
export function LockedFeature({
  name,
  jp,
  hint = 'Em breve',
  icon,
  variant = 'tile',
  className,
}: {
  name: string
  jp?: string
  hint?: string
  icon?: ReactNode
  variant?: 'tile' | 'row' | 'node'
  className?: string
}) {
  if (variant === 'node') {
    return (
      <div role="group" aria-label={`${name}: bloqueado. ${hint}`} className={cn('flex items-center gap-3', className)}>
        <LockedNode size={56} />
        <div className="min-w-0">
          <p className="font-serif text-[18px] font-light uppercase leading-none tracking-[0.04em] text-in-fg-2">{name}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">{hint}</p>
        </div>
      </div>
    )
  }
  if (variant === 'row') {
    return (
      <div role="group" aria-label={`${name}: bloqueado. ${hint}`} className={cn('flex min-h-14 items-center gap-3 border-b border-in-line py-2', className)}>
        <LockedNode size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="truncate font-serif text-[17px] font-light uppercase tracking-[0.04em] text-in-fg">{name}</span>
            {jp && <span lang="ja" className="text-[9px] tracking-[0.1em] text-in-fg-3">{jp}</span>}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">{hint}</p>
        </div>
        {icon && <span aria-hidden="true" className="flex size-7 items-center text-in-fg-3 [&>svg]:size-full">{icon}</span>}
      </div>
    )
  }
  return (
    <div role="group" aria-label={`${name}: bloqueado. ${hint}`} className={cn('relative flex min-h-[132px] flex-col items-center justify-center gap-2 px-2 py-3 text-center shadow-[inset_0_0_0_1px_var(--in-line-strong)]', className)}>
      <span aria-hidden="true" className="absolute inset-[5px] border border-dashed border-in-line" />
      <span aria-hidden="true" className="absolute right-2.5 top-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-in-fg-3">Reservado</span>
      {icon ? (
        <span aria-hidden="true" className="relative grid size-[52px] place-items-center text-in-fg-2 [&>svg]:size-full">
          <span className="contents opacity-55">{icon}</span>
          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center bg-in-bg text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]">
            <IconLock className="size-3.5" />
          </span>
        </span>
      ) : (
        <LockedNode size={52} />
      )}
      <p className="font-serif text-[16px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{name}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">{hint}</p>
    </div>
  )
}
