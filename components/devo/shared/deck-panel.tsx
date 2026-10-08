'use client'

import { Plus } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { shufflerStatus, type ShufflerPhase } from '@/lib/devo/shuffler'
import type { OwnedCard } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { CardFace } from './devo-card'

export const MAX_COPIES = 20

export type DeckStack = { cardId: string; count: number }

export function stackInventory(inventory: OwnedCard[]): DeckStack[] {
  const counts = new Map<string, number>()
  for (const c of inventory) counts.set(c.cardId, (counts.get(c.cardId) ?? 0) + 1)
  return [...counts.entries()]
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => b.count - a.count || RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order)
}

export function ArtCard({ cardId, className }: { cardId: string; className?: string }) {
  return <CardFace cardId={cardId} className={className} />
}

/**
 * Quantidade de cópias que o jogador tem. Não é numeração de coleção (essa vem de `getCardMeta`):
 * antes aparecia "01/20", que se confundia com a ordem na coleção.
 */
export function CountLabel({ count, className }: { count: number; className?: string }) {
  return (
    <p className={cn('flex items-baseline gap-1 font-serif leading-none', className)} title={`Você tem ${count} de no máximo ${MAX_COPIES} cópias`}>
      <span className="text-xs opacity-60">×</span>
      <span className="text-2xl tabular-nums">{count}</span>
      <span className="font-sans text-[9px] uppercase tracking-[0.14em] opacity-50">{count === 1 ? 'cópia' : 'cópias'}</span>
    </p>
  )
}

export function AcquireTile({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex aspect-[9/20] w-full flex-col items-center justify-center gap-2 rounded-[3px] border border-[#aab6dc]/25 bg-[#0f1426] text-[#aab6dc]/70 transition-colors hover:border-[#1f3bff] hover:text-[#1f3bff]',
        className,
      )}
    >
      <Plus className="size-6" strokeWidth={1.1} aria-hidden="true" />
      <span className="px-1 text-center font-sans text-[9px] font-semibold uppercase leading-tight tracking-[0.14em]">Adquirir carta</span>
    </button>
  )
}

const TICKS = Array.from({ length: 72 }, (_, i) => i)
const STRIAE = Array.from({ length: 40 }, (_, i) => i)

type ShufflerState = ShufflerPhase

export function CardShuffler({ synced, onShuffle, className }: { synced: boolean; onShuffle?: () => void; className?: string }) {
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [phase, setPhase] = useState<ShufflerState>('idle')
  const [hover, setHover] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    setLook({ x: Math.max(-1, Math.min(1, dx)) * 9, y: Math.max(-1, Math.min(1, dy)) * 9 })
  }

  const shuffle = () => {
    if (!synced || phase === 'shuffling') return
    playSfx('open')
    setPhase('shuffling')
    timer.current = setTimeout(() => {
      setPhase('synced')
      playSfx('click')
      onShuffle?.()
      timer.current = setTimeout(() => setPhase('idle'), 1600)
    }, 1800)
  }

  const shuffling = phase === 'shuffling'
  const status = shufflerStatus(synced, phase)
  const spin = (normal: number, fast: number, reverse = false) => ({
    transformBox: 'fill-box' as const,
    transformOrigin: 'center',
    animation: synced ? `spin ${shuffling ? fast : normal}s linear infinite${reverse ? ' reverse' : ''}` : 'none',
  })

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={shuffle}
        onPointerMove={onMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false)
          setLook({ x: 0, y: 0 })
        }}
        disabled={!synced}
        aria-label={synced ? 'Ativar o Card Shuffler' : `Card Shuffler ${shufflerStatus(false).toLowerCase()}`}
        className="group relative mx-auto aspect-square w-full max-w-[11rem] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1f3bff] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0d18] disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 200 200" className={cn('size-full transition-[filter] duration-500', !synced && 'grayscale opacity-50')} aria-hidden="true">
          <defs>
            <radialGradient id="dv-iris" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bfe0ff" />
              <stop offset="22%" stopColor="#3f7bff" />
              <stop offset="60%" stopColor="#1534d6" />
              <stop offset="100%" stopColor="#040b3a" />
            </radialGradient>
            <radialGradient id="dv-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3f7bff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3f7bff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dv-shell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1b2a7a" />
              <stop offset="55%" stopColor="#060c33" />
              <stop offset="100%" stopColor="#1b2a7a" />
            </linearGradient>
          </defs>

          <circle cx="100" cy="100" r="99" fill="url(#dv-glow)" opacity={shuffling ? 1 : hover ? 0.75 : 0.5} className="transition-opacity duration-500" />
          <circle cx="100" cy="100" r="96" fill="none" stroke="#6f8cff" strokeOpacity="0.25" strokeWidth="0.6" />

          <g style={spin(60, 4)}>
            {TICKS.map((i) => (
              <line
                key={i}
                x1="100"
                y1={i % 6 === 0 ? 5 : 8}
                x2="100"
                y2="12"
                stroke="#6f8cff"
                strokeOpacity={i % 6 === 0 ? 0.8 : 0.35}
                strokeWidth={i % 6 === 0 ? 1.2 : 0.6}
                transform={`rotate(${i * 5} 100 100)`}
              />
            ))}
          </g>

          <circle cx="100" cy="100" r="80" fill="url(#dv-shell)" />
          <g style={spin(40, 2.4, true)}>
            <circle cx="100" cy="100" r="76" fill="none" stroke="#6f8cff" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="22 6 3 6" />
          </g>
          <g style={spin(26, 1.4)}>
            <circle cx="100" cy="100" r="69" fill="none" stroke="#9cc4ff" strokeOpacity="0.8" strokeWidth="1.6" strokeDasharray="70 20 10 20" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="100" r="63" fill="#020619" stroke="#3f7bff" strokeOpacity="0.5" strokeWidth="0.8" />

          {[0, 90, 180, 270].map((a) => (
            <line key={a} x1="100" y1="22" x2="100" y2="34" stroke="#bfe0ff" strokeOpacity="0.7" strokeWidth="1" transform={`rotate(${a} 100 100)`} />
          ))}

          <g style={{ transform: `translate(${look.x}px, ${look.y}px)`, transition: 'transform 260ms cubic-bezier(.2,.8,.2,1)' }}>
            <circle cx="100" cy="100" r="52" fill="url(#dv-iris)" />
            <g style={spin(90, 1)}>
              {STRIAE.map((i) => (
                <line key={i} x1="100" y1="52" x2="100" y2={i % 2 ? 66 : 60} stroke="#e6f2ff" strokeOpacity="0.18" strokeWidth="0.7" transform={`rotate(${i * 9} 100 100)`} />
              ))}
            </g>
            <circle cx="100" cy="100" r="40" fill="none" stroke="#bfe0ff" strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="2 3" />
            <circle
              cx="100"
              cy="100"
              r={shuffling ? 9 : hover ? 13 : 17}
              fill="#01030d"
              stroke="#6f8cff"
              strokeOpacity="0.6"
              strokeWidth="1"
              style={{ transition: 'r 400ms cubic-bezier(.2,.8,.2,1)' }}
            />
            <circle cx="100" cy="100" r="3" fill="#bfe0ff" opacity={shuffling ? 1 : 0.7}>
              {synced && <animate attributeName="opacity" values="0.4;1;0.4" dur={shuffling ? '0.4s' : '2.4s'} repeatCount="indefinite" />}
            </circle>
            <ellipse cx="86" cy="84" rx="7" ry="4" fill="#ffffff" opacity="0.55" transform="rotate(-30 86 84)" />
          </g>
        </svg>
      </button>

      <p className="flex items-center justify-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aab6dc]" aria-live="polite">
        <span
          className={cn(
            'size-2 rounded-full',
            synced ? 'bg-[#1f3bff] shadow-[0_0_8px_#1f3bff]' : 'bg-[#aab6dc]/30',
            synced && (shuffling ? 'animate-ping' : 'animate-pulse'),
          )}
        />
        Status: {status}
      </p>
    </div>
  )
}

export function ShufflerHeading() {
  return (
    <h3 className="flex flex-col">
      <span className="font-serif text-lg uppercase tracking-[0.12em]">Card Shuffler</span>
      <span className="text-[10px] tracking-[0.2em] text-[#aab6dc]/50" lang="ja">
        カード・シャッフラー
      </span>
    </h3>
  )
}

export function DeckHeading() {
  return (
    <h3 className="flex items-baseline gap-2">
      <span className="font-serif text-lg uppercase tracking-[0.12em]">Cartas DEVO</span>
      <span className="text-[10px] tracking-[0.2em] text-[#aab6dc]/50" lang="ja">
        デボカード
      </span>
    </h3>
  )
}

type DeckPanelProps = {
  inventory: OwnedCard[]
  shufflerSynced: boolean
  limit?: number
  onViewAll?: () => void
  onAcquire?: () => void
  onSelect?: (cardId: string) => void
  className?: string
}

export function DeckPanel({ inventory, shufflerSynced, limit = 4, onViewAll, onAcquire, onSelect, className }: DeckPanelProps) {
  const stacks = stackInventory(inventory).slice(0, limit)

  return (
    <section
      aria-label="Cartas DEVO e Card Shuffler"
      className={cn('grid overflow-hidden rounded-sm border border-[#1d2440] bg-[#0a0d18] text-[#aab6dc] shadow-sm @2xl:grid-cols-[1fr_15rem]', className)}
    >
      <div className="flex min-w-0 flex-col gap-4 p-4">
        <header className="flex items-baseline justify-between gap-3">
          <DeckHeading />
          {onViewAll && (
            <button type="button" onClick={onViewAll} className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] hover:underline">
              Ver todas
            </button>
          )}
        </header>

        <ul className="flex gap-3 overflow-x-auto pb-1">
          {stacks.map((s) => (
            <li key={s.cardId} className="flex w-[22%] min-w-[4.5rem] max-w-[7rem] shrink-0 flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onSelect?.(s.cardId)}
                disabled={!onSelect}
                aria-label={`${getCard(s.cardId).name}: ${s.count} ${s.count === 1 ? 'cópia' : 'cópias'}`}
                className="block transition-transform duration-300 enabled:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-[#1f3bff]"
              >
                <ArtCard cardId={s.cardId} />
              </button>
              <CountLabel count={s.count} />
            </li>
          ))}
          <li className="flex w-[22%] min-w-[4.5rem] max-w-[7rem] shrink-0">
            <AcquireTile onClick={onAcquire} />
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#1d2440] p-4 @2xl:border-l @2xl:border-t-0">
        <ShufflerHeading />
        <CardShuffler synced={shufflerSynced} />
      </div>
    </section>
  )
}
