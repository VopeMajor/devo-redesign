'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { arteEssencia } from '@/lib/devo/essencias-arte'
import { ITEM_RARITY_LABEL, type InventoryItem, type ItemKind } from '@/lib/devo/progresso'
import { PacoteVisual } from '@/components/devo/casa/pacote-visual'
import { useOsNav } from '@/components/devo/os/os-nav'
import { CardFace } from '@/components/devo/shared/devo-card'
import { stackInventory } from '@/components/devo/shared/deck-panel'
import { useDevo } from '@/components/devo/state/devo-store'

/**
 * Inventário no v2 (protótipo kit3/os-inventario.js): o resumo (cartas e itens), filtros em cápsula e as seções.
 * Cartas do save; itens (pacotes, essências, chaves, fragmentos, moedas, cápsulas, cosméticos…) de
 * /api/eu?parte=inventario, como no jogo. Daqui o jogador vai para onde o item é usado (Cartas, Casa › Pacotes).
 */

const ORDEM: ItemKind[] = ['pacote', 'essencia', 'chave', 'fragmento', 'moeda', 'capsula', 'cosmetico', 'outro']
const ROTULO: Record<ItemKind, string> = {
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
type Filtro = 'tudo' | 'cartas' | ItemKind

/** Arte do protótipo para os itens que já têm desenho no v2 (moedas, fragmentos, baldes, cápsulas). */
function arteV2(key: string): string | null {
  const m = /^dracma_(comum|incomum|rara)$/.exec(key)
  if (m) return `/v2/art/os/poco/dracma-${m[1]}.png`
  if (key === 'fragmento_arcano') return '/v2/art/os/poco/fragmento.png'
  if (key === 'grande_fragmento_arcano') return '/v2/art/os/poco/grande-fragmento.png'
  const b = /^balde:(madeira|cobre|ferro|prata)$/.exec(key)
  if (b) return `/v2/art/os/poco/balde-${b[1]}.png`
  if (key.startsWith('capsula')) return '/v2/art/os/poco/capsula.png'
  return null
}

const lerInventario = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'Não foi possível abrir o inventário.')
  return j as { inventario: InventoryItem[] }
}

export function InventarioV2() {
  const { state } = useDevo()
  const nav = useOsNav()
  const { data, error, isLoading } = useSWR('/api/eu?parte=inventario', lerInventario, { revalidateOnFocus: true })
  const [filtro, setFiltro] = useState<Filtro>('tudo')
  const faixa = useRef<HTMLDivElement>(null)
  const pilhas = useMemo(
    () => stackInventory(state.inventory).sort((a, b) => RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order),
    [state.inventory],
  )
  const itens = (data?.inventario ?? []).filter((i) => i.kind !== 'convite')
  const grupos = ORDEM.map((k) => ({ k, lista: itens.filter((i) => i.kind === k) })).filter((g) => g.lista.length)
  const qtd = itens.reduce((s, i) => s + i.quantity, 0)
  const copias = state.inventory.length
  const filtros: [Filtro, string, number][] = [
    ['tudo', 'Tudo', copias + qtd],
    ['cartas', 'Cartas', copias],
    ...grupos.map((g) => [g.k, ROTULO[g.k], g.lista.reduce((s, i) => s + i.quantity, 0)] as [Filtro, string, number]),
  ]
  const mostra = (f: Filtro) => filtro === 'tudo' || filtro === f
  const abre = (id: 'cartas' | 'casa') => {
    playSfx('open')
    nav.open(id)
  }

  return (
    <>
      <dl className="i-resumo">
        <div className="fundo">
          <dt>Cartas</dt>
          <dd>
            {copias}
            <small>
              {pilhas.length} {pilhas.length === 1 ? 'tipo' : 'tipos'}
            </small>
          </dd>
        </div>
        <div className="fundo">
          <dt>Itens</dt>
          <dd>
            {qtd}
            <small>
              {itens.length} {itens.length === 1 ? 'tipo' : 'tipos'}
            </small>
          </dd>
        </div>
      </dl>
      <div className="i-filtros" role="radiogroup" aria-label="Filtrar o inventário" ref={faixa}>
        {filtros.map(([id, nome, n]) => (
          <button
            key={id}
            className="chanfro"
            role="radio"
            aria-checked={filtro === id}
            onClick={() => {
              playSfx('click')
              setFiltro(id)
            }}
          >
            {nome} <b>{n}</b>
          </button>
        ))}
      </div>
      <div className="i-lista">
        {mostra('cartas') && (
          <Secao titulo="Cartas" acao={pilhas.length ? ['Abrir Cartas', () => abre('cartas')] : null}>
            {pilhas.length ? (
              <ul className="i-cartas">
                {pilhas.map((p) => {
                  const c = getCard(p.cardId)
                  return (
                    <li key={p.cardId}>
                      <button className={'r-' + c.rarity} aria-label={`${c.name}, ${p.count} ${p.count === 1 ? 'cópia' : 'cópias'}`} onClick={() => abre('cartas')}>
                        <CardFace cardId={p.cardId} className="w-full" />
                        {p.count > 1 && <b>×{p.count}</b>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="r-sub i-vazio">Nenhuma carta ainda.</p>
            )}
          </Secao>
        )}
        {isLoading && !data && <p className="r-sub i-vazio">Abrindo o inventário…</p>}
        {error && (
          <p className="r-erro" role="alert">
            {(error as Error).message}
          </p>
        )}
        {grupos
          .filter((g) => mostra(g.k))
          .map((g) => (
            <Secao key={g.k} titulo={ROTULO[g.k]} acao={g.k === 'pacote' ? ['Abrir na Casa', () => abre('casa')] : null}>
              <ul className="i-itens">
                {g.lista.map((i) => (
                  <Item key={i.key} i={i} />
                ))}
              </ul>
            </Secao>
          ))}
        {data && !itens.length && filtro === 'tudo' && (
          <p className="r-sub i-vazio">Nenhum item ainda. Itens chegam do Poço, das Torres, dos Deadly Votes e dos prêmios da casa.</p>
        )}
      </div>
    </>
  )
}

function Secao({ titulo, acao, children }: { titulo: string; acao: [string, () => void] | null; children: ReactNode }) {
  return (
    <section aria-label={titulo}>
      <header className="i-sec">
        <h4>{titulo}</h4>
        {acao && (
          <button className="r-link i-acao" onClick={acao[1]}>
            {acao[0]} ›
          </button>
        )}
      </header>
      {children}
    </section>
  )
}

function Item({ i }: { i: InventoryItem }) {
  const pacote = i.kind === 'pacote' ? i.key.replace(/^pacote:/, '') : null
  const essencia = i.kind === 'essencia' ? arteEssencia(i.key, 128) : null
  const arte = arteV2(i.key)
  return (
    <li className={'r-' + i.rarity} title={i.description ?? ''}>
      {pacote ? (
        <span className="i-pacote">
          <PacoteVisual id={pacote} className="w-full" />
        </span>
      ) : essencia ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...essencia} alt="" />
      ) : arte ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={arte} alt="" />
      ) : (
        <span className={'i-joia r-' + i.rarity} aria-hidden="true">
          <u />
        </span>
      )}
      <div>
        <strong>{i.name}</strong>
        <small className={'r-' + i.rarity}>{ITEM_RARITY_LABEL[i.rarity] ?? i.rarity}</small>
        {i.description && <p>{i.description}</p>}
      </div>
      <b>×{i.quantity}</b>
    </li>
  )
}
