'use client'

import { Plus } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState, type PointerEvent } from 'react'
import { PanelLink, RecordPanel, RecordTitle, SigilStar, toRoman } from '@/components/devo/kit'
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
    <p className={cn('flex items-baseline gap-1 leading-none text-in-fg', className)} title={`Você tem ${count} de no máximo ${MAX_COPIES} cópias`}>
      <span className="font-mono text-[11px] text-in-fg-3">×</span>
      <span className="font-serif text-[21px] font-light dv-tabular">{count}</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-in-fg-3">{count === 1 ? 'cópia' : 'cópias'}</span>
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
        'dv-focus group relative flex aspect-[5/7] w-full flex-col items-center justify-center gap-2 text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] transition-[color,box-shadow] hover:text-in-fg hover:shadow-[inset_0_0_0_1px_var(--in-fg-2)]',
        className,
      )}
    >
      <Plus className="relative size-7" strokeWidth={1} aria-hidden="true" />
      <span className="relative px-1 text-center font-sans text-[9.5px] font-medium uppercase leading-tight tracking-[0.12em]">Adquirir carta</span>
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
        className="group relative aspect-square w-full max-w-[14rem] rounded-full outline-none transition-transform duration-[120ms] enabled:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-dv-amethyst focus-visible:ring-offset-4 focus-visible:ring-offset-transparent disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 200 200" className={cn('size-full overflow-visible transition-[filter,opacity] duration-500', !synced && 'opacity-55 grayscale')} aria-hidden="true">
          <defs>
            <linearGradient id="dvshuf-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4efe6" />
              <stop offset="24%" stopColor="#8f887c" />
              <stop offset="48%" stopColor="#dcd5c8" />
              <stop offset="70%" stopColor="#5d564c" />
              <stop offset="100%" stopColor="#f4efe6" />
            </linearGradient>
            <radialGradient id="dvshuf-face" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#2c2c31" />
              <stop offset="62%" stopColor="#151517" />
              <stop offset="100%" stopColor="#0c0c0e" />
            </radialGradient>
            <radialGradient id="dvshuf-iris" cx="46%" cy="42%" r="56%">
              <stop offset="0%" stopColor="#f6f5f2" />
              <stop offset="34%" stopColor="#b9b6c2" />
              <stop offset="66%" stopColor="#8a7cc8" />
              <stop offset="100%" stopColor="#1f1f22" />
            </radialGradient>
            <radialGradient id="dvshuf-glow" cx="50%" cy="50%" r="50%">
              <stop offset="58%" stopColor="#8a7cc8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8a7cc8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* halo */}
          <circle cx="100" cy="100" r="104" fill="url(#dvshuf-glow)" opacity={shuffling ? 1 : hover ? 0.75 : 0.45} style={{ transition: 'opacity 500ms' }} />

          {/* caixa e bisel de aço champanhe */}
          <circle cx="100" cy="100" r="97" fill="url(#dvshuf-face)" />
          <circle cx="100" cy="100" r="97" fill="none" stroke="url(#dvshuf-gold)" strokeWidth="3.2" />
          <circle cx="100" cy="100" r="91.5" fill="none" stroke="#bab09f" strokeOpacity="0.45" strokeWidth="0.7" />

          {/* régua de 72 marcações (72h) */}
          <g style={spin(120, 3, true)}>
            {TICKS.map((i) => (
              <line
                key={i}
                x1="100"
                y1={i % 6 === 0 ? 4.5 : 6.5}
                x2="100"
                y2="10.5"
                stroke={i % 6 === 0 ? '#ece5d8' : '#8f8e8b'}
                strokeOpacity={i % 6 === 0 ? 0.95 : 0.55}
                strokeWidth={i % 6 === 0 ? 1.2 : 0.6}
                transform={`rotate(${i * 5} 100 100)`}
              />
            ))}
          </g>

          {/* mostrador romano: limbo fixo (os numerais nunca ficam de cabeça para baixo) */}
          <g>
            {NUMERALS.map((n, i) => {
              const a = (i * 30 * Math.PI) / 180
              return (
                <text
                  key={n}
                  x={100 + Math.sin(a) * 80}
                  y={100 - Math.cos(a) * 80 + 3}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#bab09f"
                  letterSpacing="0.5"
                  style={{ fontFamily: 'var(--font-display, serif)' }}
                >
                  {n}
                </text>
              )
            })}
          </g>
          <circle cx="100" cy="100" r="71" fill="none" stroke="#bab09f" strokeOpacity="0.35" strokeWidth="0.6" />

          {/* anéis armilares (prata; um fio de ametista) */}
          <g style={spin(40, 1.6, true)}>
            <ellipse cx="100" cy="100" rx="66" ry="20" fill="none" stroke="#dcd9d3" strokeOpacity="0.55" strokeWidth="1" transform="rotate(-24 100 100)" />
            <path d="M160.3 70.2 L163.3 73.2 L160.3 76.2 L157.3 73.2 Z" fill="#8a7cc8" />
          </g>
          <g style={spin(55, 2, false)}>
            <ellipse cx="100" cy="100" rx="66" ry="14" fill="none" stroke="#8a7cc8" strokeOpacity="0.45" strokeWidth="0.7" strokeDasharray="10 4 2 4" transform="rotate(38 100 100)" />
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
                    <rect x="-7" y="-10" width="14" height="20" rx="0.8" fill="#151517" stroke="url(#dvshuf-gold)" strokeWidth="0.9" />
                    <rect x="-5.2" y="-8.2" width="10.4" height="16.4" rx="0.4" fill="none" stroke="#bab09f" strokeOpacity="0.45" strokeWidth="0.4" />
                    <path d="M0 -5 C0.4 -1.1 1.1 -0.4 4 0 C1.1 0.4 0.4 1.1 0 5 C-0.4 1.1 -1.1 0.4 -4 0 C-1.1 -0.4 -0.4 -1.1 0 -5 Z" fill="#ece5d8" />
                  </g>
                </g>
              )
            })}
          </g>

          {/* ponteiros */}
          <g style={spin(60, 0.6)}>
            <line x1="100" y1="100" x2="100" y2="24" stroke="#dcd9d3" strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M100 21.4 L102.2 24 L100 26.6 L97.8 24 Z" fill="#8a7cc8" />
          </g>
          <g style={spin(720, 4)}>
            <path d="M100 100 L97 92 L100 46 L103 92 Z" fill="url(#dvshuf-gold)" />
          </g>

          {/* olho do sistema */}
          <g style={{ transform: `translate(${look.x}px, ${look.y}px)`, transition: 'transform 260ms cubic-bezier(.2,.8,.2,1)' }}>
            <circle cx="100" cy="100" r="31" fill="#0c0c0e" stroke="url(#dvshuf-gold)" strokeWidth="2.4" />
            <circle cx="100" cy="100" r="25" fill="url(#dvshuf-iris)" />
            <circle cx="100" cy="100" r="19" fill="none" stroke="#f1f0ee" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="1.5 2.5" />
            <circle cx="100" cy="100" r={shuffling ? 4.5 : hover ? 7 : 9} fill="#0c0c0e" stroke="#dcd9d3" strokeOpacity="0.7" strokeWidth="0.8" style={{ transition: 'r 400ms cubic-bezier(.2,.8,.2,1)' }} />
            <circle cx="100" cy="100" r="1.8" fill="#f1f0ee" />
            <ellipse cx="92" cy="92" rx="4" ry="2.3" fill="#ffffff" opacity="0.6" transform="rotate(-30 92 92)" />
          </g>

          {/* sincronia: onda de aço */}
          {done && <circle cx="100" cy="100" r="52" fill="none" stroke="#ece5d8" strokeWidth="2" style={{ animation: 'dvshuf-flash 900ms cubic-bezier(0.16,1,0.3,1) both' }} />}
        </svg>
      </button>

      <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-in-fg-2" aria-live="polite">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rotate-45',
            !synced && 'bg-in-fg-3/50',
            synced && !done && 'bg-dv-amethyst shadow-[0_0_8px_var(--dv-amethyst)]',
            done && 'bg-[#bab09f] shadow-[0_0_8px_#ece5d8]',
            shuffling && 'animate-dv-blink',
          )}
        />
        Status: <span className={cn(synced ? (done ? 'text-in-gold' : 'text-in-fg') : 'text-in-fg-3')}>{status}</span>
      </p>
    </div>
  )
}

export function ShufflerHeading() {
  return <RecordTitle as="h3" title="Card Shuffler" jp="カード・シャッフラー" />
}

export function DeckHeading() {
  return <RecordTitle as="h3" title="Cartas DEVO" jp="デボカード" />
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

/**
 * Cartas DEVO + Card Shuffler (ref. do Record): painel negro com as cartas mais repetidas e a
 * contagem "12 / 20", e o mecanismo num painel de porcelana ao lado (embaixo, no celular).
 */
export function DeckPanel({ inventory, shufflerSynced, limit = 4, onViewAll, onAcquire, onSelect, className }: DeckPanelProps) {
  const stacks = stackInventory(inventory).slice(0, limit)
  const status = shufflerStatus(shufflerSynced)

  return (
    <section aria-label="Cartas DEVO e Card Shuffler" className={cn('@container grid gap-4 @2xl:grid-cols-[1fr_15rem]', className)}>
      <RecordPanel chamfer bodyClassName="pt-3">
        <header className="relative flex items-center justify-between gap-3 pb-2.5">
          <DeckHeading />
          {onViewAll && <PanelLink label="Ver todas" onClick={onViewAll} className="shrink-0" />}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,var(--in-brass)_0%,color-mix(in_oklab,var(--in-brass)_35%,transparent)_45%,transparent_100%)]" />
        </header>
        <ul className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stacks.map((s, i) => (
            <li key={s.cardId} className="flex w-[22%] min-w-[4.4rem] max-w-[7rem] shrink-0 animate-dv-rise flex-col items-center gap-2" style={{ animationDelay: `${i * 60}ms` }}>
              <button
                type="button"
                onClick={() => onSelect?.(s.cardId)}
                disabled={!onSelect}
                aria-label={`${getCard(s.cardId).name}: ${s.count} ${s.count === 1 ? 'cópia' : 'cópias'}`}
                className="dv-focus block w-full transition-transform duration-300 enabled:hover:-translate-y-1 enabled:active:scale-[0.97]"
              >
                <ArtCard cardId={s.cardId} />
              </button>
              <CountLabel count={s.count} />
            </li>
          ))}
          <li className="flex w-[22%] min-w-[4.4rem] max-w-[7rem] shrink-0 flex-col">
            <AcquireTile onClick={onAcquire} />
          </li>
        </ul>
      </RecordPanel>

      <RecordPanel variant="paper" bodyClassName="pt-3">
        <header className="relative flex items-center justify-between gap-3 pb-2.5">
          <ShufflerHeading />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-in-fg-3">{shufflerSynced ? 'DV_SHF_01' : 'Offline'}</span>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-in-line" />
        </header>
        <div className="relative mt-4 flex items-center justify-center">
          <SigilStar aria-hidden="true" className="pointer-events-none absolute -left-1 top-0 size-5 text-in-fg-3/50" />
          <CardShuffler synced={shufflerSynced} className="w-full max-w-[15rem]" />
        </div>
        <p className="sr-only">Card Shuffler: {status}</p>
      </RecordPanel>
    </section>
  )
}
