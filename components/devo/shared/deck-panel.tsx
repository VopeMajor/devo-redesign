'use client'

import { Plus } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Frame, GlyphArrow, toRoman } from '@/components/devo/kit'
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
    <p className={cn('flex items-baseline gap-1 leading-none text-dv-text', className)} title={`Você tem ${count} de no máximo ${MAX_COPIES} cópias`}>
      <span className="font-mono text-[11px] text-dv-text-3">×</span>
      <span className="font-impact text-[20px] font-semibold dv-tabular">{count}</span>
      <span className="dv-label text-[10px] tracking-[0.12em] text-dv-text-3">{count === 1 ? 'cópia' : 'cópias'}</span>
    </p>
  )
}

export function AcquireTile({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ '--dv-cut': '10px' } as CSSProperties}
      className={cn(
        'dv-focus dv-cut group relative flex aspect-[5/7] w-full flex-col items-center justify-center gap-2 bg-dv-ink-2 text-dv-text-3 transition-colors hover:text-dv-cobalt-text',
        className,
      )}
    >
      <span aria-hidden="true" className="dv-cut absolute inset-[3px] border border-dashed border-dv-line-strong transition-colors group-hover:border-dv-cobalt" style={{ '--dv-cut': '8px' } as CSSProperties} />
      <Plus className="relative size-6" strokeWidth={1.2} aria-hidden="true" />
      <span className="relative px-1 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.12em]">Adquirir carta</span>
    </button>
  )
}

const TICKS = Array.from({ length: 72 }, (_, i) => i)
const NUMERALS = Array.from({ length: 12 }, (_, i) => toRoman(i === 0 ? 12 : i))
const ORBIT_CARDS = [0, 90, 180, 270]

type ShufflerState = ShufflerPhase

/** Animações próprias do mecanismo (escopo pelo prefixo dvshuf-). */
const SHUFFLER_CSS = `
@keyframes dvshuf-rot { to { transform: rotate(360deg) } }
@keyframes dvshuf-rev { to { transform: rotate(-360deg) } }
@keyframes dvshuf-riffle {
  0% { transform: translate(0,0) rotate(0) }
  35% { transform: translate(var(--tx), var(--ty)) rotate(var(--rr)) }
  65% { transform: translate(var(--tx), var(--ty)) rotate(calc(var(--rr) * -1)) }
  100% { transform: translate(0,0) rotate(0) }
}
@keyframes dvshuf-flash { 0% { opacity: .9; r: 52 } 100% { opacity: 0; r: 98 } }
@media (prefers-reduced-motion: reduce) { .dvshuf, .dvshuf * { animation: none !important; transition: none !important } }
`

/**
 * Card Shuffler: astrolábio de relógio (mostrador romano, anéis armilares, cartas em órbita e o
 * olho do sistema no centro). Toque embaralha: os anéis aceleram e as cartas cruzam o centro.
 * Antes da Sala de Jogos fica "Dormente" (parado, dessaturado). Nome de estado em lib/devo/shuffler.
 */
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
    setLook({ x: Math.max(-1, Math.min(1, dx)) * 6, y: Math.max(-1, Math.min(1, dy)) * 6 })
  }

  const shuffle = () => {
    if (!synced || phase === 'shuffling') return
    playSfx('card')
    setPhase('shuffling')
    timer.current = setTimeout(() => {
      setPhase('synced')
      playSfx('reveal')
      onShuffle?.()
      timer.current = setTimeout(() => setPhase('idle'), 1600)
    }, 1800)
  }

  const shuffling = phase === 'shuffling'
  const done = phase === 'synced'
  const status = shufflerStatus(synced, phase)
  const spin = (normal: number, fast: number, reverse = false): CSSProperties => ({
    transformBox: 'view-box',
    transformOrigin: '100px 100px',
    animation: synced ? `${reverse ? 'dvshuf-rev' : 'dvshuf-rot'} ${shuffling ? fast : normal}s linear infinite` : 'none',
  })

  return (
    <div className={cn('dvshuf flex flex-col items-center gap-3', className)}>
      <style>{SHUFFLER_CSS}</style>
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
        className="group relative aspect-square w-full max-w-[14rem] rounded-full outline-none transition-transform duration-[120ms] enabled:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-dv-cobalt-text focus-visible:ring-offset-4 focus-visible:ring-offset-dv-ink disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 200 200" className={cn('size-full overflow-visible transition-[filter,opacity] duration-500', !synced && 'opacity-55 grayscale')} aria-hidden="true">
          <defs>
            <linearGradient id="dvshuf-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ecd49a" />
              <stop offset="30%" stopColor="#7c5f2a" />
              <stop offset="55%" stopColor="#c9a45c" />
              <stop offset="80%" stopColor="#7c5f2a" />
              <stop offset="100%" stopColor="#ecd49a" />
            </linearGradient>
            <radialGradient id="dvshuf-face" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#13235e" />
              <stop offset="70%" stopColor="#0a0f1c" />
              <stop offset="100%" stopColor="#05070d" />
            </radialGradient>
            <radialGradient id="dvshuf-iris" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d6e0ff" />
              <stop offset="25%" stopColor="#7d97ff" />
              <stop offset="62%" stopColor="#1647ff" />
              <stop offset="100%" stopColor="#0b1a4d" />
            </radialGradient>
            <radialGradient id="dvshuf-glow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#315dff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#315dff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* halo */}
          <circle cx="100" cy="100" r="104" fill="url(#dvshuf-glow)" opacity={shuffling ? 1 : hover ? 0.75 : 0.45} style={{ transition: 'opacity 500ms' }} />

          {/* caixa e bisel dourado */}
          <circle cx="100" cy="100" r="97" fill="url(#dvshuf-face)" />
          <circle cx="100" cy="100" r="97" fill="none" stroke="url(#dvshuf-gold)" strokeWidth="3.2" />
          <circle cx="100" cy="100" r="91.5" fill="none" stroke="#c9a45c" strokeOpacity="0.5" strokeWidth="0.7" />

          {/* régua de 72 marcações (72h) */}
          <g style={spin(120, 3, true)}>
            {TICKS.map((i) => (
              <line
                key={i}
                x1="100"
                y1={i % 6 === 0 ? 4.5 : 6.5}
                x2="100"
                y2="10.5"
                stroke={i % 6 === 0 ? '#ecd49a' : '#7d97ff'}
                strokeOpacity={i % 6 === 0 ? 0.95 : 0.45}
                strokeWidth={i % 6 === 0 ? 1.2 : 0.6}
                transform={`rotate(${i * 5} 100 100)`}
              />
            ))}
          </g>

          {/* mostrador romano */}
          <g style={spin(90, 2.2)}>
            {NUMERALS.map((n, i) => {
              const a = (i * 30 * Math.PI) / 180
              return (
                <text
                  key={n}
                  x={100 + Math.sin(a) * 80}
                  y={100 - Math.cos(a) * 80 + 3}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#c9a45c"
                  letterSpacing="0.5"
                  transform={`rotate(${i * 30} ${100 + Math.sin(a) * 80} ${100 - Math.cos(a) * 80})`}
                  style={{ fontFamily: 'var(--font-display, serif)' }}
                >
                  {n}
                </text>
              )
            })}
          </g>
          <circle cx="100" cy="100" r="71" fill="none" stroke="#c9a45c" strokeOpacity="0.45" strokeWidth="0.6" />

          {/* anéis armilares (cobalto) */}
          <g style={spin(40, 1.6, true)}>
            <ellipse cx="100" cy="100" rx="66" ry="20" fill="none" stroke="#315dff" strokeOpacity="0.75" strokeWidth="1.1" transform="rotate(-24 100 100)" />
            <circle cx="160.3" cy="73.2" r="2.4" fill="#7d97ff" />
          </g>
          <g style={spin(55, 2, false)}>
            <ellipse cx="100" cy="100" rx="66" ry="14" fill="none" stroke="#7d97ff" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="10 4 2 4" transform="rotate(38 100 100)" />
          </g>

          {/* cartas em órbita */}
          <g style={spin(30, 0.9)}>
            {ORBIT_CARDS.map((deg, i) => {
              const a = (deg * Math.PI) / 180
              const cx = 100 + Math.sin(a) * 58
              const cy = 100 - Math.cos(a) * 58
              return (
                <g key={deg} transform={`translate(${cx} ${cy}) rotate(${deg})`}>
                  <g
                    style={
                      {
                        // No referencial girado da carta, o centro fica sempre 58px "abaixo".
                        '--tx': '0px',
                        '--ty': '58px',
                        '--rr': `${i % 2 ? 160 : -160}deg`,
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: shuffling ? `dvshuf-riffle 0.9s ${i * 0.12}s cubic-bezier(0.7,0,0.2,1) 2` : 'none',
                      } as CSSProperties
                    }
                  >
                    <rect x="-7" y="-10" width="14" height="20" rx="1.2" fill="#efe6d2" stroke="#c9a45c" strokeWidth="0.8" />
                    <rect x="-5" y="-8" width="10" height="16" rx="0.6" fill="none" stroke="#1647ff" strokeOpacity="0.55" strokeWidth="0.5" />
                    <path d="M0 -4.5 L3 0 L0 4.5 L-3 0 Z" fill="#1647ff" />
                  </g>
                </g>
              )
            })}
          </g>

          {/* ponteiros */}
          <g style={spin(60, 0.6)}>
            <line x1="100" y1="100" x2="100" y2="24" stroke="#7d97ff" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="100" cy="24" r="1.6" fill="#7d97ff" />
          </g>
          <g style={spin(720, 4)}>
            <path d="M100 100 L97 92 L100 46 L103 92 Z" fill="url(#dvshuf-gold)" />
          </g>

          {/* olho do sistema */}
          <g style={{ transform: `translate(${look.x}px, ${look.y}px)`, transition: 'transform 260ms cubic-bezier(.2,.8,.2,1)' }}>
            <circle cx="100" cy="100" r="31" fill="#05070d" stroke="url(#dvshuf-gold)" strokeWidth="2.2" />
            <circle cx="100" cy="100" r="25" fill="url(#dvshuf-iris)" />
            <circle cx="100" cy="100" r="19" fill="none" stroke="#d6e0ff" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="1.5 2.5" />
            <circle cx="100" cy="100" r={shuffling ? 4.5 : hover ? 7 : 9} fill="#01030d" stroke="#7d97ff" strokeOpacity="0.7" strokeWidth="0.8" style={{ transition: 'r 400ms cubic-bezier(.2,.8,.2,1)' }} />
            <circle cx="100" cy="100" r="1.8" fill="#d6e0ff" />
            <ellipse cx="92" cy="92" rx="4" ry="2.3" fill="#ffffff" opacity="0.6" transform="rotate(-30 92 92)" />
          </g>

          {/* sincronia: onda dourada */}
          {done && <circle cx="100" cy="100" r="52" fill="none" stroke="#ecd49a" strokeWidth="2" style={{ animation: 'dvshuf-flash 900ms cubic-bezier(0.16,1,0.3,1) both' }} />}
        </svg>
      </button>

      <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2" aria-live="polite">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rotate-45',
            !synced && 'bg-dv-text-3/50',
            synced && !done && 'bg-dv-cobalt shadow-[0_0_8px_var(--dv-cobalt)]',
            done && 'bg-dv-gold-bright shadow-[0_0_8px_var(--dv-gold)]',
            shuffling && 'animate-dv-blink',
          )}
        />
        Status: <span className={cn(synced ? (done ? 'text-dv-gold-bright' : 'text-dv-cobalt-text') : 'text-dv-text-3')}>{status}</span>
      </p>
    </div>
  )
}

export function ShufflerHeading() {
  return (
    <h3 className="flex flex-col gap-0.5">
      <span className="dv-label text-[10px] text-dv-gold">Mecanismo · Embaralhar</span>
      <span className="flex items-baseline gap-2.5 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">
        Card Shuffler
        <span className="font-sans text-[11px] font-normal tracking-[0.2em] text-dv-text-3" lang="ja">
          カード・シャッフラー
        </span>
      </span>
    </h3>
  )
}

export function DeckHeading() {
  return (
    <h3 className="flex flex-col gap-0.5">
      <span className="dv-label text-[10px] text-dv-gold">Inventário</span>
      <span className="flex items-baseline gap-2.5 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">
        Cartas DEVO
        <span className="font-sans text-[11px] font-normal tracking-[0.2em] text-dv-text-3" lang="ja">
          デボカード
        </span>
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
    <Frame as="section" aria-label="Cartas DEVO e Card Shuffler" cut="diag" cutSize={16} pad="none" className={cn('@container', className)}>
      <div className="grid @2xl:grid-cols-[1fr_16rem]">
        <div className="flex min-w-0 flex-col gap-4 p-4">
          <header className="flex items-end justify-between gap-3">
            <DeckHeading />
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="dv-focus group inline-flex min-h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-cobalt-text hover:text-dv-text"
              >
                Ver todas
                <GlyphArrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </header>

          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stacks.map((s, i) => (
              <li key={s.cardId} className="flex w-[23%] min-w-[4.6rem] max-w-[7rem] shrink-0 animate-dv-rise flex-col gap-1.5" style={{ animationDelay: `${i * 60}ms` }}>
                <button
                  type="button"
                  onClick={() => onSelect?.(s.cardId)}
                  disabled={!onSelect}
                  aria-label={`${getCard(s.cardId).name}: ${s.count} ${s.count === 1 ? 'cópia' : 'cópias'}`}
                  className="dv-focus block transition-transform duration-300 enabled:hover:-translate-y-1 enabled:active:scale-[0.97]"
                >
                  <ArtCard cardId={s.cardId} />
                </button>
                <CountLabel count={s.count} />
              </li>
            ))}
            <li className="flex w-[23%] min-w-[4.6rem] max-w-[7rem] shrink-0">
              <AcquireTile onClick={onAcquire} />
            </li>
          </ul>
        </div>

        <div className="relative flex flex-col gap-3 border-t border-dv-line p-4 @2xl:border-l @2xl:border-t-0">
          <ShufflerHeading />
          <CardShuffler synced={shufflerSynced} />
        </div>
      </div>
    </Frame>
  )
}
