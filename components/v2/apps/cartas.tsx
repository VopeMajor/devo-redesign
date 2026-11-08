'use client'

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CARDS, getCard, getCardArquetipo, getCardMeta, getCardPeso, getCardRadius, getCollections, PESO_TEXTO, RARITIES, RARITY_META } from '@/lib/devo/cards'
import { shufflerStatus } from '@/lib/devo/shuffler'
import type { Rarity } from '@/lib/devo/types'
import { CardBack, CardFace } from '@/components/devo/shared/devo-card'
import { stackInventory } from '@/components/devo/shared/deck-panel'
import { CorujaIntro } from '@/components/devo/apps/coruja-intro'
import { useOsNav } from '@/components/devo/os/os-nav'
import { useDevo } from '@/components/devo/state/devo-store'
import { useBackHandler } from '@/components/devo/use-back-handler'

/**
 * Cartas no v2 (protótipo kit3/os-cartas.js, no modo das telas de Cone de Luz do Star Rail): compêndio com o anel de
 * progresso, filtros por raridade com estrelas, cartas que inclinam com o dedo ou o mouse, coleções em leque e a ficha
 * com o palco de luz e a carta que vira de verdade. As cartas são as do inventário do jogador, com a moldura do jogo
 * (CardFace / CardBack). Do jogo continuam: o Card Shuffler (sorteia uma carta para ver), "Adquirir carta" (Sala de
 * Trocas), a origem e as cópias de cada carta, o voltar do celular e a apresentação da Coruja na primeira visita.
 */

type Filtro = Rarity | 'todas'
const parado = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ESTRELA = 'M12 2.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.8l-5.9 3.7 1.7-6.7-5.3-4.4 6.9-.5z'
export function Estrelas({ r }: { r: Rarity }) {
  const n = Math.min(5, RARITY_META[r].order + 1)
  return (
    <span className={'c-est r-' + r} aria-label={RARITY_META[r].label}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true">
          <path d={ESTRELA} />
        </svg>
      ))}
    </span>
  )
}

/** Inclina o elemento conforme o ponteiro (perspectiva 3D), com o reflexo de luz acompanhando. */
function inclina(forca: number) {
  return {
    onPointerMove: (e: RPointerEvent<HTMLElement>) => {
      if (parado()) return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--ry', (x * forca * 2).toFixed(2) + 'deg')
      el.style.setProperty('--rx', (-y * forca * 2).toFixed(2) + 'deg')
      el.style.setProperty('--lx', ((x + 0.5) * 100).toFixed(1) + '%')
      el.style.setProperty('--ly', ((y + 0.5) * 100).toFixed(1) + '%')
    },
    onPointerLeave: (e: RPointerEvent<HTMLElement>) => {
      e.currentTarget.style.setProperty('--ry', '0deg')
      e.currentTarget.style.setProperty('--rx', '0deg')
    },
  }
}

export function CartasV2() {
  const { state } = useDevo()
  const nav = useOsNav()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [sel, setSel] = useState<string | null>(null)
  const [embaralhando, setEmbaralhando] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const pilhas = stackInventory(state.inventory)
  const ordem = (a: string, b: string) => RARITY_META[getCard(b).rarity].order - RARITY_META[getCard(a).rarity].order || getCardMeta(a).universal - getCardMeta(b).universal
  const visiveis = pilhas.filter((s) => filtro === 'todas' || getCard(s.cardId).rarity === filtro).sort((a, b) => ordem(a.cardId, b.cardId))
  const tenho = new Set(pilhas.map((s) => s.cardId))
  const conta = (f: Filtro) => (f === 'todas' ? pilhas.length : pilhas.filter((s) => getCard(s.cardId).rarity === f).length)
  const copias = state.inventory.length
  const total = CARDS.length
  const pct = total ? pilhas.length / total : 0
  const R = 34
  const C = 2 * Math.PI * R
  useBackHandler(!!sel, () => setSel(null))
  useEffect(() => {
    raiz.current?.closest('.corpo')?.scrollTo({ top: 0 })
  }, [sel])

  const embaralha = () => {
    if (!state.arcadeUnlocked || embaralhando || !state.inventory.length) return
    playSfx('card')
    setEmbaralhando(true)
    window.setTimeout(
      () => {
        const c = state.inventory[Math.floor(Math.random() * state.inventory.length)]
        playSfx('reveal')
        setEmbaralhando(false)
        setFiltro('todas')
        setSel(c.cardId)
      },
      parado() ? 0 : 1200,
    )
  }

  return (
    <div id="car" className="cx" ref={raiz}>
      {sel && tenho.has(sel) ? (
        <Ficha id={sel} ordem={visiveis.some((s) => s.cardId === sel) ? visiveis.map((s) => s.cardId) : [...pilhas].sort((a, b) => ordem(a.cardId, b.cardId)).map((s) => s.cardId)} onVolta={() => setSel(null)} onAnda={setSel} />
      ) : (
        <>
          <header className="cx-topo">
            <div className="cx-anel" role="meter" aria-label="Compêndio reunido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pilhas.length}>
              <svg viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r={R} className="trilho" />
                <circle cx="40" cy="40" r={R} className="feito" style={{ strokeDasharray: `${(C * pct).toFixed(1)} ${C.toFixed(1)}` }} />
              </svg>
              <b>
                {Math.round(pct * 100)}
                <small>%</small>
              </b>
            </div>
            <div className="cx-tit">
              <small>Compêndio</small>
              <h3>Cartas</h3>
              <p>
                <b>{pilhas.length}</b> de {total} reunidas · <b>{copias}</b> {copias === 1 ? 'cópia' : 'cópias'}
              </p>
            </div>
          </header>

          <div className={'cx-shuf' + (embaralhando ? ' gira' : '')}>
            <span className="cx-shuf-ic" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="cx-shuf-tx">
              <small>Card Shuffler · {shufflerStatus(state.arcadeUnlocked, embaralhando ? 'shuffling' : 'idle')}</small>
              <span>{state.arcadeUnlocked ? 'Sorteia uma das suas cartas para ver.' : 'Desperta junto com a Sala de Jogos.'}</span>
            </span>
            <button className="r-bt chanfro" disabled={!state.arcadeUnlocked || embaralhando || !copias} onClick={embaralha}>
              {embaralhando ? 'Embaralhando…' : 'Embaralhar'}
            </button>
          </div>

          <div className="cx-filtros" role="radiogroup" aria-label="Filtrar por raridade">
            {(['todas', ...RARITIES] as Filtro[]).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={filtro === f}
                className={'r-' + f}
                onClick={() => {
                  if (filtro === f) return
                  playSfx('click')
                  setFiltro(f)
                }}
              >
                {f !== 'todas' && <Estrelas r={f} />}
                <span>{f === 'todas' ? 'Todas' : RARITY_META[f].label}</span>
                <b>{conta(f)}</b>
              </button>
            ))}
          </div>

          <ul className="cx-grade" aria-label="Suas cartas" key={filtro}>
            {visiveis.map((s, i) => {
              const c = getCard(s.cardId)
              return (
                <li key={s.cardId}>
                  <button
                    className={'cx-tile r-' + c.rarity}
                    style={{ '--i': i } as React.CSSProperties}
                    aria-label={`Ver ${c.name}: ${RARITY_META[c.rarity].label}, ${s.count} ${s.count === 1 ? 'cópia' : 'cópias'}`}
                    onClick={() => {
                      playSfx('open')
                      setSel(s.cardId)
                    }}
                  >
                    <span className="cx-tile-3d" {...inclina(9)}>
                      <span className="cx-face">
                        <CardFace cardId={s.cardId} className="w-full" />
                      </span>
                      <i className="cx-luz" />
                    </span>
                    <span className="cx-base">
                      <Estrelas r={c.rarity} />
                      <span className="cx-nome">{c.name}</span>
                    </span>
                    {s.count > 1 && <span className="cx-cop">×{s.count}</span>}
                  </button>
                </li>
              )
            })}
            {!visiveis.length && filtro !== 'todas' && <li className="cx-vazio">Nenhuma carta desta raridade.</li>}
            {filtro === 'todas' && (
              <li>
                <button
                  className="cx-adq"
                  onClick={() => {
                    playSfx('click')
                    nav.open('trocas')
                  }}
                >
                  <span>
                    <b>+</b>
                  </span>
                  <em>Adquirir carta</em>
                  <small>Sala de Trocas</small>
                </button>
              </li>
            )}
          </ul>

          <h4 className="sec">
            <span>Coleções</span>
          </h4>
          <ul className="cx-cols">
            {getCollections().map((col) => {
              const k = col.cards.filter((id) => tenho.has(id)).length
              const mostra = col.cards.slice(0, 4)
              return (
                <li key={col.name}>
                  <div className="cx-leque">
                    {mostra.map((id, j) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={id} src={`/images/cartas/${id}/arte-512.webp`} alt="" style={{ '--j': j - (mostra.length - 1) / 2 } as React.CSSProperties} className={tenho.has(id) ? '' : 'falta'} />
                    ))}
                  </div>
                  <div className="cx-col-tx">
                    <small>Coleção</small>
                    <strong>{col.name}</strong>
                    <span>
                      {k} de {col.size}
                    </span>
                    <div className="cx-col-barra">
                      <i style={{ width: `${((k / Math.max(1, col.size)) * 100).toFixed(0)}%` }} />
                    </div>
                  </div>
                  {k === col.size && <em className="cx-col-ok">Completa</em>}
                </li>
              )
            })}
          </ul>
        </>
      )}
      {!state.owlMet && <CorujaIntro />}
    </div>
  )
}

function Ficha({ id, ordem, onVolta, onAnda }: { id: string; ordem: string[]; onVolta: () => void; onAnda: (id: string) => void }) {
  const { state } = useDevo()
  const c = getCard(id)
  const meta = getCardMeta(id)
  const minhas = state.inventory.filter((x) => x.cardId === id)
  const n = minhas.length
  const origem = minhas[0]?.origin ?? '—'
  const [verso, setVerso] = useState(false)
  const [aba, setAba] = useState<'efeito' | 'descricao' | 'rito' | 'peso'>('efeito')
  const idx = Math.max(0, ordem.indexOf(id))
  const abas: [typeof aba, string][] = [['efeito', 'Na carta'], ...(c.detalhe ? ([['descricao', 'Descrição']] as [typeof aba, string][]) : []), ['rito', 'Rito'], ['peso', 'Peso']]
  const peso = getCardPeso(id)
  const raio = getCardRadius(id)
  useEffect(() => {
    setVerso(false)
    setAba('efeito')
  }, [id])
  const anda = (d: number) => {
    if (ordem.length < 2) return
    playSfx('card')
    onAnda(ordem[(idx + d + ordem.length) % ordem.length])
  }
  // ←/→ passam de carta, como no jogo
  const andaRef = useRef(anda)
  andaRef.current = anda
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') andaRef.current(-1)
      else if (e.key === 'ArrowRight') andaRef.current(1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <div className={'cx-det r-' + c.rarity}>
      <section className="cx-palco">
        <button
          className="cx-volta"
          aria-label="Voltar para as cartas"
          onClick={() => {
            playSfx('close')
            onVolta()
          }}
        >
          <svg className="seta" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Cartas
        </button>
        <span className="cx-pos">
          {idx + 1} / {ordem.length}
        </span>
        <button className="cx-seta ant" aria-label="Carta anterior" disabled={ordem.length < 2} onClick={() => anda(-1)}>
          <svg className="seta" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          className={'cx-carta-g' + (verso ? ' virada' : '')}
          aria-label={verso ? 'Ver a frente da carta' : `${c.name}. Ver o verso da carta`}
          onClick={() => {
            playSfx('card')
            setVerso((v) => !v)
          }}
          {...inclina(12)}
        >
          <span className="cx-vira">
            <span className="cx-lado frente">
              <CardFace cardId={id} className="w-full" />
              <i className="cx-luz" />
            </span>
            <span className="cx-lado verso">
              <CardBack className="w-full" />
              <i className="cx-luz" />
            </span>
          </span>
        </button>
        <button className="cx-seta prox" aria-label="Próxima carta" disabled={ordem.length < 2} onClick={() => anda(1)}>
          <svg className="seta" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <small className="cx-dica">Toque na carta para virar</small>
      </section>
      <section className="cx-info">
        <Estrelas r={c.rarity} />
        <h3>{c.name}</h3>
        <p className="cx-sub">
          Nº {c.numeral} · Coleção {meta.collection} · {RARITY_META[c.rarity].label}
        </p>
        <div className="cx-chips">
          {c.natureza && (
            <span>
              <small>Natureza</small>
              {c.natureza}
            </span>
          )}
          <span>
            <small>Arquétipo</small>
            {getCardArquetipo(c)}
          </span>
          <span>
            <small>Tipo</small>
            {c.type}
          </span>
          {raio !== '—' && (
            <span>
              <small>Raio</small>
              {raio}
            </span>
          )}
        </div>
        <div className="cx-stats">
          <div>
            <small>Peso</small>
            <b>{peso}</b>
            <i className="cx-peso">
              {Array.from({ length: 5 }, (_, k) => (
                <u key={k} className={k < peso ? 'on' : ''} />
              ))}
            </i>
          </div>
          <div>
            <small>Cópias</small>
            <b>×{n}</b>
            <i className="cx-sob">
              {Array.from({ length: 5 }, (_, k) => (
                <u key={k} className={k < n ? 'on' : ''} />
              ))}
            </i>
          </div>
          <div>
            <small>Origem</small>
            <b className="cx-origem">{origem}</b>
          </div>
        </div>
        <div className="cx-abas" role="tablist">
          {abas.map(([a, r]) => (
            <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)}>
              {r}
            </button>
          ))}
        </div>
        <div className="cx-texto">
          {aba === 'efeito' ? (
            <>
              <p className="cx-efeito">{c.effect}</p>
              {c.flavor && <p className="cx-flavor">“{c.flavor}”</p>}
            </>
          ) : aba === 'descricao' ? (
            <p>{c.detalhe}</p>
          ) : aba === 'rito' ? (
            <dl className="cx-rito">
              <div>
                <dt>Gestos</dt>
                <dd>Ainda não definidos</dd>
              </div>
              <div>
                <dt>Cântico da coleção</dt>
                <dd>Ainda não definido</dd>
              </div>
            </dl>
          ) : (
            <p>{PESO_TEXTO}</p>
          )}
        </div>
        <p className="cx-serie">
          {meta.serial} · {meta.orderLabel} na coleção
        </p>
      </section>
    </div>
  )
}
