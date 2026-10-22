'use client'

import { type CSSProperties, type ReactNode, useContext, useMemo, useState } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { ITEM_RARITY_LABEL, type InventoryItem, type ItemKind, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { Spinner } from '../kit/button'
import { PacoteVisual } from '../casa/pacote-visual'
import { OsNavContext } from '../os/os-nav'
import { CardFace } from '../shared/devo-card'
import { stackInventory } from '../shared/deck-panel'
import { useDevo } from '../state/devo-store'

/**
 * Inventário (pedido do dono, 22/10): tudo o que o jogador tem num lugar só. Cartas vêm do save do cliente;
 * itens (moedas, essências, chaves, fragmentos, cápsulas, pacotes, cosméticos…) vêm de `/api/eu?parte=inventario`.
 * Daqui o jogador vai para onde o item é usado (Cartas, Casa › Pacotes).
 */

const ORDEM_TIPOS: ItemKind[] = ['pacote', 'essencia', 'chave', 'fragmento', 'moeda', 'capsula', 'cosmetico', 'outro']
const TIPO_ROTULO: Record<ItemKind, string> = {
  pacote: 'Pacotes',
  essencia: 'Essências',
  chave: 'Chaves',
  fragmento: 'Fragmentos',
  moeda: 'Moedas',
  capsula: 'Cápsulas',
  cosmetico: 'Cosméticos',
  convite: 'Convites',
  outro: 'Outros',
}
const COR_RARIDADE: Record<ItemRarity, string> = {
  comum: '#8f8e8b',
  incomum: '#d4d4d8',
  raro: '#d6cdbd',
  epico: '#bcb0e2',
  lendario: '#c2b9ec',
  arcano: '#e6dcff',
}

type Filtro = 'tudo' | 'cartas' | ItemKind

const getInventario = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'Não foi possível abrir o inventário.')
  return j as { inventario: InventoryItem[] }
}

export function InventarioApp() {
  const { state } = useDevo()
  const nav = useContext(OsNavContext)
  const { data, error, isLoading } = useSWR('/api/eu?parte=inventario', getInventario, { revalidateOnFocus: true })
  const [filtro, setFiltro] = useState<Filtro>('tudo')

  const pilhas = useMemo(
    () => stackInventory(state.inventory).sort((a, b) => RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order),
    [state.inventory],
  )
  const itens = (data?.inventario ?? []).filter((i) => i.kind !== 'convite')
  const porTipo = ORDEM_TIPOS.map((k) => ({ k, lista: itens.filter((i) => i.kind === k) })).filter((g) => g.lista.length)
  const totalItens = itens.reduce((s, i) => s + i.quantity, 0)

  const filtros: { id: Filtro; rotulo: string; n: number }[] = [
    { id: 'tudo', rotulo: 'Tudo', n: state.inventory.length + totalItens },
    { id: 'cartas', rotulo: 'Cartas', n: state.inventory.length },
    ...porTipo.map((g) => ({ id: g.k as Filtro, rotulo: TIPO_ROTULO[g.k], n: g.lista.reduce((s, i) => s + i.quantity, 0) })),
  ]
  const mostra = (f: Filtro) => filtro === 'tudo' || filtro === f

  return (
    <div className="relative flex h-full flex-col bg-[linear-gradient(180deg,#16141c_0%,#0f0e13_55%,#0b0a0e_100%)] @container">
      <div className="devo-scroll flex-1 overflow-y-auto px-4 pb-10 pt-5 @md:px-6">
        <dl className="grid grid-cols-2 gap-2">
          <Resumo rotulo="Cartas" valor={state.inventory.length} detalhe={`${pilhas.length} ${pilhas.length === 1 ? 'tipo' : 'tipos'}`} />
          <Resumo rotulo="Itens" valor={totalItens} detalhe={`${itens.length} ${itens.length === 1 ? 'tipo' : 'tipos'}`} />
        </dl>

        {/* filtros */}
        <div role="radiogroup" aria-label="Filtrar o inventário" className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filtro === f.id}
              onClick={() => {
                playSfx('click')
                setFiltro(f.id)
              }}
              className={cn(
                'dv-focus dv-cut-diag flex h-9 shrink-0 items-center gap-1.5 px-3 font-mono text-[11px] uppercase tracking-[0.12em]',
                filtro === f.id ? 'bg-[rgb(var(--dv-amethyst-rgb)/0.35)] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)]' : 'text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)] hover:text-dv-text',
              )}
              style={{ '--dv-cut': '6px' } as CSSProperties}
            >
              {f.rotulo}
              <span className="text-dv-text-3 dv-tabular">{f.n}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-6">
          {/* cartas */}
          {mostra('cartas') && (
            <Secao titulo="Cartas" acao={pilhas.length ? { rotulo: 'Abrir Cartas', onClick: () => nav?.open('cartas') } : undefined}>
              {pilhas.length ? (
                <ul className="grid grid-cols-4 gap-2.5 @md:grid-cols-6">
                  {pilhas.map((p) => (
                    <li key={p.cardId} className="relative">
                      <button type="button" onClick={() => nav?.open('cartas')} aria-label={`${getCard(p.cardId).name}, ${p.count} ${p.count === 1 ? 'cópia' : 'cópias'}`} className="dv-focus block w-full">
                        <CardFace cardId={p.cardId} className="w-full" />
                      </button>
                      {p.count > 1 && (
                        <span className="pointer-events-none absolute -right-1 -top-1 bg-dv-ink px-1.5 py-0.5 font-impact text-[14px] font-semibold leading-none text-dv-gold-bright shadow-[inset_0_0_0_1px_var(--dv-line-gold)] dv-tabular">
                          ×{p.count}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <Vazio>Nenhuma carta ainda.</Vazio>
              )}
            </Secao>
          )}

          {/* itens */}
          {isLoading && !data && (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              <Spinner className="size-4" /> Abrindo o inventário…
            </p>
          )}
          {error && (
            <p role="alert" className="font-body text-[15px] text-dv-blood-text">
              {(error as Error).message}
            </p>
          )}
          {porTipo
            .filter((g) => mostra(g.k))
            .map((g) => (
              <Secao key={g.k} titulo={TIPO_ROTULO[g.k]} acao={g.k === 'pacote' ? { rotulo: 'Abrir na Casa', onClick: () => nav?.open('casa') } : undefined}>
                <ul className="flex flex-col">
                  {g.lista.map((i) => (
                    <LinhaItem key={i.key} item={i} />
                  ))}
                </ul>
              </Secao>
            ))}
          {data && !itens.length && mostra('tudo') && <Vazio>Nenhum item ainda. Itens chegam do Poço, das Torres, dos Deadly Votes e dos prêmios da casa.</Vazio>}
        </div>
      </div>
    </div>
  )
}

function Resumo({ rotulo, valor, detalhe }: { rotulo: string; valor: number; detalhe: string }) {
  return (
    <div className="dv-cut bg-[rgba(255,255,255,0.03)] px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]" style={{ '--dv-cut': '8px' } as CSSProperties}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">{rotulo}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="font-impact text-[26px] font-semibold leading-none text-dv-text dv-tabular">{valor}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">{detalhe}</span>
      </dd>
    </div>
  )
}

function Secao({ titulo, acao, children }: { titulo: string; acao?: { rotulo: string; onClick: () => void }; children: ReactNode }) {
  return (
    <section aria-label={titulo}>
      <header className="mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="size-[7px] shrink-0 rotate-45 bg-[image:var(--dv-champagne-grad)]" />
        <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-dv-text">{titulo}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-[linear-gradient(90deg,rgb(var(--dv-champagne-rgb)/0.4),transparent)]" />
        {acao && (
          <button
            type="button"
            onClick={() => {
              playSfx('open')
              acao.onClick()
            }}
            className="dv-focus min-h-9 px-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-amethyst-text hover:text-dv-text"
          >
            {acao.rotulo} →
          </button>
        )}
      </header>
      {children}
    </section>
  )
}

function LinhaItem({ item }: { item: InventoryItem }) {
  const cor = COR_RARIDADE[item.rarity] ?? COR_RARIDADE.comum
  const pacote = item.kind === 'pacote' ? item.key.replace(/^pacote:/, '') : null
  return (
    <li className="flex min-h-16 items-center gap-3 border-b border-dv-line py-2.5 last:border-b-0">
      {pacote ? (
        <PacoteVisual id={pacote} colecao={pacote === 'xadrez' ? 'Xadrez' : ''} className="w-11 shrink-0" />
      ) : (
        <span aria-hidden="true" className="relative grid size-11 shrink-0 place-items-center">
          <span className="absolute inset-1.5 rotate-45 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(0,0,0,0.3))]" style={{ boxShadow: `inset 0 0 0 1px ${cor}` }} />
          <span className="relative size-2.5 rotate-45" style={{ background: cor, boxShadow: `0 0 8px ${cor}88` }} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text">{item.name}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: cor }}>
          {ITEM_RARITY_LABEL[item.rarity] ?? item.rarity}
        </p>
        {item.description && <p className="mt-1 line-clamp-2 font-body text-[13.5px] leading-snug text-dv-text-2">{item.description}</p>}
      </div>
      <span className="shrink-0 font-impact text-[22px] font-semibold leading-none text-dv-gold-bright dv-tabular">×{item.quantity}</span>
    </li>
  )
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="font-body text-[15px] italic leading-relaxed text-dv-text-3">{children}</p>
}
