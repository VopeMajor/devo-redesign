'use client'

import { X } from 'lucide-react'
import { useContext, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { RARITY_META, getCard } from '@/lib/devo/cards'
import type { Rarity } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { OsNavContext } from '../os/os-nav'
import { AcquireTile, ArtCard, CardShuffler, CountLabel, DeckHeading, MAX_COPIES, ShufflerHeading, stackInventory } from '../shared/deck-panel'
import { CardFace } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { CorujaIntro } from './coruja-intro'

const FILTERS: (Rarity | 'todas')[] = ['todas', 'comum', 'incomum', 'rara', 'lendaria']

export function CartasApp() {
  const { state } = useDevo()
  const [filter, setFilter] = useState<Rarity | 'todas'>('todas')
  const [selected, setSelected] = useState<string | null>(null)

  const nav = useContext(OsNavContext)
  const stacks = stackInventory(state.inventory)
    .filter((s) => filter === 'todas' || getCard(s.cardId).rarity === filter)
    .sort((a, b) => RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order)
  const detail = state.inventory.find((c) => c.uid === selected)
  useBackHandler(!!detail, () => setSelected(null))

  const drawRandom = () => {
    if (state.inventory.length === 0) return
    const pick = state.inventory[Math.floor(Math.random() * state.inventory.length)]
    setSelected(pick.uid)
  }

  return (
    <div className="relative flex h-full flex-col @container">
      <div className="devo-scroll flex-1 overflow-y-auto p-3 @md:p-5">
        <section
          aria-label="Cartas DEVO"
          className="grid min-h-full overflow-hidden rounded-sm border border-[#1d2440] bg-[#0a0d18] text-[#aab6dc] @2xl:grid-cols-[1fr_16rem]"
        >
          <div className="order-2 flex min-w-0 flex-col gap-4 p-4 @2xl:order-1 @md:p-5">
            <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#1d2440] pb-3">
              <div className="flex flex-col gap-1">
                <DeckHeading />
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aab6dc]/55">
                  {state.inventory.length} cartas · {stackInventory(state.inventory).length} tipos
                </p>
              </div>
              <div role="radiogroup" aria-label="Filtrar por raridade" className="flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={filter === f}
                    onClick={() => {
                      playSfx('click')
                      setFilter(f)
                    }}
                    className={cn(
                      'rounded-[2px] border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors',
                      filter === f ? 'border-[#1f3bff] bg-[#1f3bff] text-[#e6ebf7]' : 'border-transparent text-[#aab6dc]/60 hover:text-[#aab6dc]',
                    )}
                  >
                    {f === 'todas' ? 'Todas' : RARITY_META[f].label}
                  </button>
                ))}
              </div>
            </header>

            <ul className="grid grid-cols-3 content-start gap-x-3 gap-y-4 @md:grid-cols-4 @3xl:grid-cols-5">
              {stacks.map((s) => {
                const owned = state.inventory.find((c) => c.cardId === s.cardId)
                return (
                  <li key={s.cardId} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!owned) return
                        playSfx('open')
                        setSelected(owned.uid)
                      }}
                      className="block w-full transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f3bff]"
                      aria-label={`Ver ${getCard(s.cardId).name}: ${s.count} de ${MAX_COPIES}`}
                    >
                      <ArtCard cardId={s.cardId} className="w-full" />
                    </button>
                    <CountLabel count={s.count} />
                    <p className="truncate font-sans text-[10px] uppercase tracking-[0.12em] text-[#aab6dc]/60">{getCard(s.cardId).name}</p>
                  </li>
                )
              })}
              {filter === 'todas' && (
                <li>
                  <AcquireTile onClick={() => nav?.open('trocas')} />
                </li>
              )}
              {stacks.length === 0 && filter !== 'todas' && (
                <li className="col-span-full py-10 text-center font-sans text-xs uppercase tracking-[0.18em] text-[#aab6dc]/50">Nenhuma carta desta raridade.</li>
              )}
            </ul>
          </div>

          <aside className="order-1 flex flex-col gap-3 border-b border-[#1d2440] p-4 @2xl:order-2 @2xl:border-b-0 @2xl:border-l @md:p-5">
            <ShufflerHeading />
            <div className="@2xl:sticky @2xl:top-4">
              <CardShuffler synced={state.arcadeUnlocked} onShuffle={drawRandom} />
              <p className="mt-3 text-center font-sans text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#aab6dc]/50">
                {state.arcadeUnlocked ? 'Toque no olho para embaralhar' : 'Desperte o Shuffler para ativar'}
              </p>
            </div>
          </aside>
        </section>
      </div>

      {!state.owlMet && <CorujaIntro />}

      {detail && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-5 backdrop-blur-sm animate-pop" role="dialog" aria-modal="true" aria-label={getCard(detail.cardId).name}>
          <button
            type="button"
            onClick={() => {
              playSfx('close')
              setSelected(null)
            }}
            className="absolute right-4 top-4 text-foreground/60 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <CardDetail cardId={detail.cardId} origin={detail.origin} />
        </div>
      )}
    </div>
  )
}

function CardDetail({ cardId, origin }: { cardId: string; origin: string }) {
  const card = getCard(cardId)
  const rarity = RARITY_META[card.rarity]
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 @lg:flex-row">
      <CardFace cardId={cardId} size="lg" className="w-64 max-w-full shrink-0 @lg:w-72" />
      <div className="flex flex-col gap-3 text-center @lg:text-left">
        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: rarity.color }}>
          {rarity.label} · {card.type} · {card.numeral}
        </p>
        <h3 className="text-3xl text-foreground">{card.name}</h3>
        <p className="leading-relaxed text-foreground/85">{card.effect}</p>
        <p className="italic text-muted-foreground">{`"${card.flavor}"`}</p>
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Origem: {origin}</p>
      </div>
    </div>
  )
}
