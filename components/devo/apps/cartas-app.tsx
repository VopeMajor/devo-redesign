'use client'

import { ChevronLeft, ChevronRight, Plus, RotateCcw, X } from 'lucide-react'
import { useCallback, useContext, useEffect, useRef, useState, type PointerEvent } from 'react'
import { HudCode, HudRule, PaperSheet, RecordPanel, RecordTitle, hudCode } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { ARCHETYPE_BY_TYPE, CARDS, RARITIES, RARITY_META, getCard, getCardMeta, getCardRadius, getCollections } from '@/lib/devo/cards'
import type { Rarity } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { OsNavContext } from '../os/os-nav'
import { CardShuffler, MAX_COPIES, stackInventory } from '../shared/deck-panel'
import { CardBack, CardFace, RARITY_SKIN, RarityGem, RarityPips, marbleBlack } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { CorujaIntro } from './coruja-intro'

type Filter = Rarity | 'todas'
const FILTERS: Filter[] = ['todas', ...RARITIES]
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

const copiesLabel = (n: number) => (n === 1 ? 'cópia' : 'cópias')

export function CartasApp() {
  const { state } = useDevo()
  const [filter, setFilter] = useState<Filter>('todas')
  const [selected, setSelected] = useState<string | null>(null)

  const nav = useContext(OsNavContext)
  const allStacks = stackInventory(state.inventory)
  const stacks = allStacks
    .filter((s) => filter === 'todas' || getCard(s.cardId).rarity === filter)
    .sort(
      (a, b) =>
        RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order || getCardMeta(a.cardId).universal - getCardMeta(b.cardId).universal,
    )
  const owned = new Set(allStacks.map((s) => s.cardId))
  const countBy = (r: Filter) => (r === 'todas' ? allStacks.length : allStacks.filter((s) => getCard(s.cardId).rarity === r).length)
  const totalBy = (r: Filter) => (r === 'todas' ? CARDS.length : CARDS.filter((c) => c.rarity === r).length)
  const detail = state.inventory.find((c) => c.uid === selected)
  const close = useCallback(() => {
    playSfx('close')
    setSelected(null)
  }, [])
  useBackHandler(!!detail, () => setSelected(null))

  const drawRandom = () => {
    if (state.inventory.length === 0) return
    const pick = state.inventory[Math.floor(Math.random() * state.inventory.length)]
    setSelected(pick.uid)
  }

  const openCard = (cardId: string) => {
    const c = state.inventory.find((x) => x.cardId === cardId)
    if (!c) return
    playSfx('open')
    setSelected(c.uid)
  }

  // Navegação no detalhe: segue a ordem da grade (filtro atual); se a carta não estiver nela, usa todas.
  const order = detail && stacks.some((s) => s.cardId === detail.cardId) ? stacks : allStacks
  const step = (dir: 1 | -1) => {
    if (!detail || order.length < 2) return
    const i = order.findIndex((s) => s.cardId === detail.cardId)
    const next = order[(i + dir + order.length) % order.length]
    const c = state.inventory.find((x) => x.cardId === next.cardId)
    if (c) {
      playSfx('card')
      setSelected(c.uid)
    }
  }

  return (
    <div className="relative flex h-full flex-col @container">
      <div className="devo-scroll flex-1 overflow-y-auto">
        <PaperSheet code={false} className="min-h-full">
          <div className="grid gap-5 px-4 pb-10 pt-5 @md:px-6 @2xl:grid-cols-[minmax(0,1fr)_18rem] @2xl:gap-6">
            <div className="flex min-w-0 flex-col gap-5">
              <CollectionHeader ownedTypes={allStacks.length} copies={state.inventory.length} legendary={countBy('lendaria')} />

              <div
                role="radiogroup"
                aria-label="Filtrar por raridade"
                className="grid animate-dv-fade grid-cols-5 bg-[color-mix(in_oklab,var(--in-bg)_55%,white)] shadow-[inset_0_0_0_1px_var(--in-line-strong)]"
                style={{ animationDelay: '120ms' }}
              >
                {FILTERS.map((f, i) => {
                  const active = filter === f
                  const legend = f === 'lendaria'
                  return (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        if (active) return
                        playSfx('click')
                        setFilter(f)
                      }}
                      className={cn(
                        'dv-focus relative flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1.5 px-0.5 transition-colors duration-200',
                        active ? 'bg-in-accent-fill text-white' : 'text-in-fg-2 hover:bg-black/[0.04] hover:text-in-fg',
                      )}
                    >
                      {!active && i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-in-line" />}
                      <span className="max-w-full truncate font-sans text-[10px] font-medium uppercase tracking-[0.1em]">{f === 'todas' ? 'Todas' : RARITY_META[f].label}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] leading-none tabular-nums">
                        {f === 'todas' ? (
                          <span aria-hidden="true" className="opacity-70">
                            ◇
                          </span>
                        ) : (
                          <RarityPips rarity={f} className="text-[8px]" style={{ color: active ? RARITY_SKIN[f].light : RARITY_SKIN[f].ink }} />
                        )}
                        <span className="opacity-80">{countBy(f)}</span>
                      </span>
                      {active && legend && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[2px] bg-dv-amethyst" />}
                    </button>
                  )
                })}
              </div>

              <RecordPanel
                title="Cartas DEVO"
                jp="デボカード"
                ornate
                className="animate-dv-rise"
                style={{ animationDelay: '160ms' }}
                headerRight={
                  <span className="flex items-baseline gap-1.5 font-impact text-[22px] font-normal leading-none tracking-[0.02em] text-in-fg tabular-nums">
                    {String(stacks.length).padStart(2, '0')}
                    <span className="font-mono text-[11px] tracking-[0.1em] text-in-fg-3">/ {String(totalBy(filter)).padStart(2, '0')}</span>
                  </span>
                }
              >
                <ul key={filter} className="grid grid-cols-3 gap-x-3 gap-y-5 @md:grid-cols-4 @3xl:grid-cols-5">
                  {stacks.map((s, i) => {
                    const card = getCard(s.cardId)
                    const skin = RARITY_SKIN[card.rarity]
                    const legend = card.rarity === 'lendaria'
                    return (
                      <li key={s.cardId} className="flex min-w-0 animate-dv-rise flex-col" style={{ animationDelay: `${Math.min(i, 8) * 55 + 220}ms` }}>
                        <button
                          type="button"
                          onClick={() => openCard(s.cardId)}
                          aria-label={`Ver ${card.name}: ${s.count} ${copiesLabel(s.count)}`}
                          className="dv-focus group relative block w-full transition-transform duration-300 ease-out hover:-translate-y-1 active:scale-[0.97]"
                        >
                          <CardFace cardId={s.cardId} className="w-full" />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-1 rounded-[8%/6%] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                            style={{ boxShadow: `0 0 0 1px ${skin.filet}, 0 0 18px ${skin.glow}` }}
                          />
                        </button>
                        <Copies count={s.count} className="mt-2" />
                        <p
                          className={cn('mt-1 line-clamp-2 min-h-[2.7em] font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.08em]', !legend && 'text-in-fg-2')}
                          style={legend ? { color: RARITY_SKIN.lendaria.light } : undefined}
                        >
                          {card.name}
                        </p>
                      </li>
                    )
                  })}
                  {filter === 'todas' && (
                    <li className="animate-dv-rise" style={{ animationDelay: `${Math.min(stacks.length, 8) * 55 + 220}ms` }}>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('click')
                          nav?.open('trocas')
                        }}
                        className="dv-focus group relative flex aspect-[5/7] w-full flex-col items-center justify-center gap-2 rounded-[5%/3.6%] text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] transition-colors hover:text-in-fg"
                      >
                        <span aria-hidden="true" className="absolute inset-[5px] rounded-[4%/3%] border border-dashed border-in-line transition-colors group-hover:border-in-line-strong" />
                        <Plus className="relative size-6" strokeWidth={1.1} aria-hidden="true" />
                        <span className="relative px-1 text-center font-sans text-[10px] font-medium uppercase leading-tight tracking-[0.12em]">Adquirir carta</span>
                      </button>
                    </li>
                  )}
                  {stacks.length === 0 && filter !== 'todas' && (
                    <li className="col-span-full flex flex-col items-center gap-3 py-10 text-center">
                      <RarityGem rarity={filter} className="h-10 w-7 opacity-60" />
                      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-in-fg-3">Nenhuma carta desta raridade.</p>
                    </li>
                  )}
                </ul>
              </RecordPanel>

              <CollectionsPanel owned={owned} />
            </div>

            <aside className="flex flex-col gap-4">
              <RecordPanel title="Card Shuffler" jp="カード・シャッフラー" className="animate-dv-rise @2xl:sticky @2xl:top-4" style={{ animationDelay: '260ms' }}>
                <p className="-mt-1 mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Mecanismo · Embaralhar</p>
                {/* PROVISÓRIO: o mostrador do Shuffler (shared/deck-panel.tsx) é da área Record e ainda tem ouro
                    amarelo e olho azul; aqui ele é dessaturado até virar aço. Remover quando o Record trocar. */}
                <div className="[filter:saturate(0.12)_contrast(1.06)_brightness(1.04)]">
                  <CardShuffler synced={state.arcadeUnlocked} onShuffle={drawRandom} />
                </div>
                <p className="mt-3 text-center font-sans text-[10px] font-medium uppercase leading-relaxed tracking-[0.14em] text-in-fg-3">
                  {state.arcadeUnlocked ? 'Toque no olho para embaralhar' : 'Desperte o Shuffler para ativar'}
                </p>
              </RecordPanel>
            </aside>
          </div>
        </PaperSheet>
      </div>

      {!state.owlMet && <CorujaIntro />}

      {detail && (
        <CardDetail
          cardId={detail.cardId}
          origin={detail.origin}
          copies={allStacks.find((s) => s.cardId === detail.cardId)?.count ?? 1}
          canStep={order.length > 1}
          onStep={step}
          onClose={close}
        />
      )}
    </div>
  )
}

/** "× N cópias" — quantidade que o jogador tem (não é numeração de coleção). */
function Copies({ count, className }: { count: number; className?: string }) {
  return (
    <p className={cn('flex items-baseline gap-1 leading-none text-in-fg', className)} title={`Você tem ${count} de no máximo ${MAX_COPIES} cópias`}>
      <span className="font-mono text-[12px] text-in-fg-3">×</span>
      <span className="font-impact text-[18px] font-normal tabular-nums">{count}</span>
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.1em] text-in-fg-3">{copiesLabel(count)}</span>
    </p>
  )
}

/** Cabeçalho do inventário: régua de HUD, título e o progresso no Compêndio ("10 / 16"). */
function CollectionHeader({ ownedTypes, copies, legendary }: { ownedTypes: number; copies: number; legendary: number }) {
  const total = CARDS.length
  return (
    <header className="flex flex-col gap-3">
      <div className="flex animate-dv-fade items-start justify-between gap-3">
        <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Inventário · arquivo de cartas</span>
        <HudCode code={hudCode('cartas')} sub="DV_CARD_ARCHIVE" />
      </div>
      <HudRule className="-mt-1 animate-dv-fade" />
      <div className="flex animate-dv-cut-in items-end justify-between gap-4" style={{ animationDelay: '60ms' }}>
        <div className="min-w-0">
          <RecordTitle title="Compêndio" jp="コンペンディオ" size="lg" as="h1" />
          <p className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-in-fg-2">
            {copies} {copies === 1 ? 'carta' : 'cartas'} · {ownedTypes} tipos
          </p>
        </div>
        <p className="shrink-0 text-right leading-none" aria-label={`${ownedTypes} de ${total} cartas do Compêndio`}>
          <span className="font-impact text-[44px] font-normal tabular-nums tracking-[0.01em] text-in-fg">{String(ownedTypes).padStart(2, '0')}</span>
          <span className="ml-1.5 font-mono text-[13px] tracking-[0.08em] text-in-fg-3">/ {total}</span>
        </p>
      </div>
      <div className="flex animate-dv-fade items-center gap-3" style={{ animationDelay: '120ms' }}>
        <div className="relative h-[7px] flex-1" role="meter" aria-label="Compêndio reunido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={ownedTypes}>
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-in-line-strong" />
          <span aria-hidden="true" className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-in-data" style={{ width: `${(ownedTypes / total) * 100}%` }} />
          {Array.from({ length: total - 1 }, (_, i) => (
            <span key={i} aria-hidden="true" className="absolute inset-y-0 w-px bg-in-line-strong" style={{ left: `${((i + 1) / total) * 100}%` }} />
          ))}
        </div>
        {legendary > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: RARITY_SKIN.lendaria.ink }}>
            <RarityGem rarity="lendaria" className="h-4 w-3" />
            {legendary} {legendary === 1 ? 'Lendária' : 'Lendárias'}
          </span>
        )}
      </div>
    </header>
  )
}

/** Coleções Arcanas: uma linha por coleção, com uma casa por carta (cheia quando você tem). */
function CollectionsPanel({ owned }: { owned: Set<string> }) {
  const cols = getCollections()
  return (
    <RecordPanel title="Coleções Arcanas" jp="アルカナ・コレクション" variant="paper" className="animate-dv-rise" style={{ animationDelay: '320ms' }}>
      <ul className="flex flex-col">
        {cols.map((c, i) => {
          const have = c.cards.filter((id) => owned.has(id)).length
          const full = have === c.size
          return (
            <li key={c.name} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-in-line')}>
              <span aria-hidden="true" className="w-7 shrink-0 font-serif text-[18px] font-light leading-none text-in-fg-3">
                {ROMAN[i]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[18px] leading-tight text-in-fg">{c.name}</p>
                <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
                  {c.cards.map((id) => {
                    const r = getCard(id).rarity
                    const has = owned.has(id)
                    return (
                      <svg key={id} viewBox="0 0 10 14" className="h-[14px] w-[10px]" style={{ color: has ? RARITY_SKIN[r].ink : 'var(--in-line-strong)' }}>
                        <path d="M5 0.8 L9.2 7 L5 13.2 L0.8 7 Z" fill={has ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" />
                      </svg>
                    )
                  })}
                </div>
              </div>
              <span aria-hidden="true" className={cn('shrink-0 font-mono text-[12px] tabular-nums tracking-[0.06em]', full ? 'text-in-fg' : 'text-in-fg-3')}>
                {String(have).padStart(2, '0')}/{String(c.size).padStart(2, '0')}
              </span>
              <span className="sr-only">
                {have} de {c.size} cartas
              </span>
            </li>
          )
        })}
      </ul>
    </RecordPanel>
  )
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Duração e curva do giro (o roteiro de captura congela o giro no meio, ~240 ms). */
const FLIP_MS = 760
const FLIP_EASE = 'cubic-bezier(0.45,0,0.2,1)'

const DETAIL_CSS = `
@keyframes dvcard-deal { 0% { transform: translateY(22px) rotateY(-180deg) scale(.9); opacity: 0 } 14% { opacity: 1 } 100% { transform: none; opacity: 1 } }
@keyframes dvcard-flash { 0% { background-position: 140% 0; opacity: 0 } 12% { opacity: 1 } 70% { opacity: 1 } 100% { background-position: -40% 0; opacity: 0 } }
.dvcard-deal { animation: dvcard-deal 900ms cubic-bezier(0.2,0.8,0.2,1) both; transform-style: preserve-3d; }
.dvcard-flash { animation: dvcard-flash ${FLIP_MS}ms linear both; background-image: linear-gradient(100deg, transparent 30%, rgba(236,229,216,0.0) 38%, rgba(246,243,236,0.55) 47%, rgba(255,255,255,0.85) 50%, rgba(236,229,216,0.4) 53%, transparent 64%); background-size: 260% 100%; mix-blend-mode: screen; }
@media (prefers-reduced-motion: reduce) { .dvcard-deal, .dvcard-flash { animation: none !important } }
`

/** "Congela seu pulso por 12 horas." → o número ganha destaque de aço (mono). */
function EffectText({ text }: { text: string }) {
  const parts = text.split(/([+−-]?\d+\s?(?:horas?|h\b|M\b)?)/)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="whitespace-nowrap font-mono text-[15px] tracking-[0.02em] text-dv-gold-bright [box-shadow:inset_0_-1px_0_rgba(186,176,159,0.75)]">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  )
}

/**
 * Inspeção da carta: a carta é "dada" na mesa (entra pelo verso girando até a frente); arrastar na
 * horizontal gira a peça com o dedo e solta no lado mais próximo; tocar vira; "Frente/Verso" também.
 * No desktop o ponteiro inclina a carta e guia a holografia. Setas e ←/→ passam de carta; Esc fecha.
 */
function CardDetail({
  cardId,
  origin,
  copies,
  canStep,
  onStep,
  onClose,
}: {
  cardId: string
  origin: string
  copies: number
  canStep: boolean
  onStep: (dir: 1 | -1) => void
  onClose: () => void
}) {
  const card = getCard(cardId)
  const rarity = RARITY_META[card.rarity]
  const skin = RARITY_SKIN[card.rarity]
  const meta = getCardMeta(cardId)
  // Giro acumulado em graus (0 = frente). Guardado junto do id: trocar de carta zera sem animar.
  const [flip, setFlip] = useState({ id: cardId, rot: 0, flips: 0 })
  const rot = flip.id === cardId ? flip.rot : 0
  const flips = flip.id === cardId ? flip.flips : 0
  const rotRef = useRef(rot)
  rotRef.current = rot
  const [dragging, setDragging] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; rot: number; moved: boolean; id: number } | null>(null)
  const side: 'front' | 'back' = (((Math.round(rot / 180) % 2) + 2) % 2) === 0 ? 'front' : 'back'

  const setRot = useCallback((r: number, bump = false) => setFlip((f) => ({ id: cardId, rot: r, flips: (f.id === cardId ? f.flips : 0) + (bump ? 1 : 0) })), [cardId])

  // Uma varredura holográfica depois de a carta chegar (no celular não há ponteiro para guiar o brilho).
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (prefersReduced()) return
    const el = stageRef.current
    if (!el) return
    let raf = 0
    const t0 = performance.now() + 700
    const run = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 1400))
      el.style.setProperty('--hx', `${10 + p * 80}%`)
      el.style.setProperty('--hy', `${20 + p * 60}%`)
      if (p < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [cardId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && canStep) onStep(1)
      else if (e.key === 'ArrowLeft' && canStep) onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep, canStep])

  const turn = () => {
    playSfx('card')
    setRot(Math.round(rotRef.current / 180) * 180 + 180, true)
  }
  const flipTo = (to: 'front' | 'back') => {
    if (to !== side) turn()
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, rot: rotRef.current, moved: false, id: e.pointerId }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d && d.id === e.pointerId) {
      const dx = e.clientX - d.x
      if (!d.moved && Math.abs(dx) > 8) {
        d.moved = true
        setDragging(true)
        setTilt({ x: 0, y: 0 })
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
      if (d.moved) setRot(d.rot + dx * 0.8)
      return
    }
    if (e.pointerType !== 'mouse' || prefersReduced()) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    e.currentTarget.style.setProperty('--hx', `${px * 100}%`)
    e.currentTarget.style.setProperty('--hy', `${py * 100}%`)
    setTilt({ x: (0.5 - py) * 14, y: (px - 0.5) * 16 })
  }
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      if (e.type === 'pointerup') turn()
      return
    }
    setDragging(false)
    const snapped = Math.round(rotRef.current / 180) * 180
    if (snapped !== Math.round(d.rot / 180) * 180) playSfx('card')
    setRot(snapped, true)
  }

  const spot = skin.glow.replace(/[\d.]+\)$/, '0.14)')

  return (
    <div role="dialog" aria-modal="true" aria-label={card.name} className="dv-interior-dark absolute inset-0 z-10 flex animate-dv-fade flex-col overflow-hidden bg-[#0c0c0e]">
      <style>{DETAIL_CSS}</style>
      {/* vitrine: mármore negro neutro, luz de cima e piso xadrez quase invisível */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80" style={marbleBlack(640)} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(46% 30% at 50% 4%, rgba(236,229,216,0.10), transparent 70%), radial-gradient(60% 40% at 50% 30%, ${spot}, transparent 72%), radial-gradient(120% 70% at 50% 110%, rgba(0,0,0,0.85), transparent 60%)` }}
      />
      <span aria-hidden="true" className="dv-checker-faint pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-50 [mask-image:linear-gradient(to_top,#000,transparent)]" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-3">
        <HudCode code={hudCode(cardId)} sub={`${meta.serial} · ${meta.orderLabel}`} barcode />
        <button
          type="button"
          onClick={onClose}
          className="dv-focus grid size-11 place-items-center text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)] transition-colors hover:text-in-fg hover:shadow-[inset_0_0_0_1px_var(--in-brass)]"
          aria-label="Fechar"
        >
          <X className="size-5" strokeWidth={1.4} />
        </button>
      </header>

      <div className="devo-scroll relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pb-8 pt-2 @2xl:flex-row @2xl:items-start @2xl:justify-center @2xl:gap-10 @2xl:pt-8">
          {/* palco */}
          <div className="flex w-full shrink-0 flex-col items-center gap-4 @2xl:w-auto">
            <div className="flex w-full items-center justify-center gap-1">
              <StepButton dir={-1} disabled={!canStep} onStep={onStep} />
              <div
                ref={stageRef}
                data-stage=""
                className={cn('relative w-[min(58cqw,250px)] touch-pan-y [perspective:1100px]', dragging ? 'cursor-grabbing' : 'cursor-grab')}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onPointerLeave={() => !drag.current && setTilt({ x: 0, y: 0 })}
              >
                {/* sombra na mesa: estreita quando a carta está de lado */}
                <span aria-hidden="true" className="absolute inset-x-[12%] -bottom-4 h-6 rounded-[50%] bg-black/70 blur-md" />
                <div className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d]" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                  <div key={cardId} className="dvcard-deal relative">
                    <div
                      data-flip=""
                      className="relative [transform-style:preserve-3d]"
                      style={{ transform: `rotateY(${rot}deg)`, transition: dragging || prefersReduced() ? 'none' : `transform ${FLIP_MS}ms ${FLIP_EASE}` }}
                    >
                      <div className="relative [backface-visibility:hidden]">
                        <CardFace cardId={cardId} holo className="w-full" />
                        {flips > 0 && <span key={flips} aria-hidden="true" className="dvcard-flash pointer-events-none absolute inset-0 rounded-[5%/3.6%]" />}
                      </div>
                      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <CardBack className="h-full w-full" />
                        {flips > 0 && <span key={flips} aria-hidden="true" className="dvcard-flash pointer-events-none absolute inset-0 rounded-[5%/3.6%]" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <StepButton dir={1} disabled={!canStep} onStep={onStep} />
            </div>

            <div role="group" aria-label="Lado da carta" className="flex shadow-[inset_0_0_0_1px_var(--in-line-strong)]">
              {(['front', 'back'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={side === s}
                  onClick={() => flipTo(s)}
                  className={cn(
                    'dv-focus flex min-h-11 min-w-[108px] items-center justify-center gap-2 px-4 font-sans text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200',
                    side === s ? 'bg-in-fg text-in-bg' : 'text-in-fg-2 hover:text-in-fg',
                  )}
                >
                  {s === 'back' && <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden="true" />}
                  {s === 'front' ? 'Frente' : 'Verso'}
                </button>
              ))}
            </div>
            <p aria-hidden="true" className="-mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">Arraste para girar · toque para virar</p>
          </div>

          {/* ficha */}
          <section aria-label="Ficha da carta" className="dv-record-panel relative w-full max-w-md animate-dv-rise px-4 pb-4 pt-3.5" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: skin.light }}>
                <RarityGem rarity={card.rarity} className="h-5 w-3.5" />
                {rarity.label}
                <RarityPips rarity={card.rarity} className="text-[9px]" />
              </p>
              <Copies count={copies} />
            </div>

            <h3 className="mt-3 font-serif text-[32px] font-light uppercase leading-[0.95] tracking-[0.02em] text-in-fg">{card.name}</h3>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">
              {meta.collection} · {meta.orderLabel} · {meta.serial}
            </p>
            <span aria-hidden="true" className="mt-3 block h-px bg-[linear-gradient(90deg,var(--in-brass),rgba(186,176,159,0.3)_50%,transparent)]" />

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                ['Tipo', card.type],
                ['Arquétipo', ARCHETYPE_BY_TYPE[card.type]],
                ['Raio', getCardRadius(cardId)],
                ['Moldura', skin.material],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">{k}</dt>
                  <dd className="mt-1 truncate font-serif text-[18px] leading-tight text-in-fg">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-fg-3">Função</p>
              <p className="mt-1 font-body text-[17px] leading-relaxed text-in-fg">
                <EffectText text={card.effect} />
              </p>
            </div>
            <blockquote className="mt-4 border-l pl-3 font-serif text-[17px] italic leading-snug text-in-fg-2" style={{ borderColor: skin.filet }}>
              {`“${card.flavor}”`}
            </blockquote>
            <p className="mt-4 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">
              <span>Origem: {origin}</span>
              <span>{card.numeral}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

function StepButton({ dir, disabled, onStep }: { dir: 1 | -1; disabled: boolean; onStep: (d: 1 | -1) => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft
  return (
    <button
      type="button"
      onClick={() => onStep(dir)}
      disabled={disabled}
      aria-label={dir === 1 ? 'Próxima carta' : 'Carta anterior'}
      className="dv-focus grid size-11 shrink-0 place-items-center text-in-fg-3 transition-colors hover:text-in-fg disabled:opacity-0"
    >
      <Icon className="size-6" strokeWidth={1.2} aria-hidden="true" />
    </button>
  )
}
