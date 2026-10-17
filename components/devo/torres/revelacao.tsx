'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '../hooks'
import { starPath } from './arte'
import { BotaoTorre, Cadeado, ChaveOrnamental, CristalEssencia, EstrelaAndar } from './ornamentos'
import './torres.css'

/**
 * Revelação das Torres (mesma regra do Poço: ativação → suspense → revelação → resultado, com "Pular").
 * O servidor já decidiu tudo antes (a chamada voltou ok); aqui é só apresentação.
 *
 * - andar: as essências pagas voam para o cadeado, a argola salta, a luz cresce e surge a recompensa
 *   (chave da torre secundária, ou o selo do andar na principal).
 * - essencia: estilhaços de luz convergem e o cristal se forma (oferta do Galo).
 * A pompa cresce com a raridade (raios, segundo anel e faíscas a partir de "raro").
 */
export type ItemRevelado = { tipo: 'chave' | 'essencia' | 'selo'; nome: string; quantidade: number; raridade: ItemRarity; descricao: string }

type Fase = 'ativacao' | 'suspense' | 'revelacao' | 'resultado'
const TEMPOS: Record<Exclude<Fase, 'ativacao'>, number> = { suspense: 850, revelacao: 1750, resultado: 2700 }
const PESO: Record<ItemRarity, number> = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, arcano: 5 }

export function Revelacao({
  tipo,
  titulo,
  andar,
  gasto = 0,
  item,
  onFim,
}: {
  tipo: 'andar' | 'essencia'
  titulo: string
  andar?: number
  /** Essências pagas (animação). */
  gasto?: number
  item: ItemRevelado
  onFim: () => void
}) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [fase, setFase] = useState<Fase>(reduced ? 'resultado' : 'ativacao')
  useEffect(() => {
    if (reduced) {
      setFase('resultado')
      return
    }
    playSfx('ignite')
    const ts = [
      window.setTimeout(() => {
        setFase('suspense')
        playSfx('rumble')
      }, TEMPOS.suspense),
      window.setTimeout(() => {
        setFase('revelacao')
        playSfx('reveal')
      }, TEMPOS.revelacao),
      window.setTimeout(() => setFase('resultado'), TEMPOS.resultado),
    ]
    return () => ts.forEach(window.clearTimeout)
  }, [reduced])

  const peso = PESO[item.raridade] ?? 1
  const nRaios = 12 + peso * 4
  const nFaiscas = 6 + peso * 4
  const aberto = fase !== 'ativacao'
  const mostraItem = fase === 'revelacao' || fase === 'resultado'
  const nCristais = Math.min(Math.max(gasto, tipo === 'essencia' ? 6 : 1), 8)

  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-dv-ink/[0.97] animate-dv-fade" data-fase={fase}>
      {/* luz que cresce com a fase */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[40%] size-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,transform] duration-700"
        style={{
          background: 'radial-gradient(closest-side, rgb(var(--dv-amethyst-text-rgb) / 0.5), rgb(var(--dv-amethyst-rgb) / 0.18) 45%, transparent 72%)',
          opacity: fase === 'ativacao' ? 0.25 : fase === 'suspense' ? 0.55 : 0.9,
          transform: `translate(-50%,-50%) scale(${fase === 'ativacao' ? 0.5 : fase === 'suspense' ? 0.75 : 1})`,
        }}
      />
      {/* raios */}
      <svg aria-hidden="true" viewBox="-200 -200 400 400" className={cn('absolute left-1/2 top-[40%] w-[150vmin] max-w-[900px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500', mostraItem ? 'opacity-100' : 'opacity-0')}>
        <g className="tw-raios-lentos">
          {Array.from({ length: nRaios }, (_, i) => (
            <path key={i} d="M0 0L-7 -200L7 -200Z" fill={i % 2 ? '#cbc6dc' : '#ece5d8'} opacity={0.07 + (i % 3) * 0.03} transform={`rotate(${(360 / nRaios) * i})`} />
          ))}
        </g>
        {peso >= 2 && <circle r={150} fill="none" stroke="#cbc6dc" strokeWidth={0.8} opacity={0.4} strokeDasharray="2 6" className="tw-raios-lentos" />}
      </svg>

      <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-3">
        <p className="dv-label flex items-center gap-2 text-[11px] text-dv-gold">
          <span className="size-1.5 rotate-45 bg-dv-amethyst" />
          {titulo}
        </p>
        {fase !== 'resultado' && (
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh')
              setFase('resultado')
            }}
            className="dv-focus -mr-2 inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-text-3 hover:text-dv-text"
          >
            Pular
          </button>
        )}
      </div>

      {/* palco */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {/* cadeado (andar) ou núcleo de luz (essência) */}
        {!mostraItem && (
          <div className={cn('relative grid place-items-center', fase === 'suspense' && 'tw-tremor')}>
            {tipo === 'andar' ? (
              <Cadeado aberto={aberto} aceso={aberto} className="h-44 w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]" />
            ) : (
              <svg viewBox="-50 -50 100 100" className="tw-girar-lento h-40 w-40" aria-hidden="true">
                <path d={starPath(0, 0, 46, 0.12)} fill="#ece5d8" opacity={0.85} />
                <path d={starPath(0, 0, 30, 0.14)} fill="#cbc6dc" transform="rotate(45)" opacity={0.7} />
                <circle r={9} fill="#fffaf0" />
              </svg>
            )}
            {/* essências voando para o centro */}
            {Array.from({ length: nCristais }, (_, i) => {
              const a = (i / nCristais) * Math.PI * 2 - Math.PI / 2
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className="tw-voo absolute left-1/2 top-1/2"
                  style={{ '--dx': `${Math.cos(a) * 150}px`, '--dy': `${Math.sin(a) * 170}px`, animationDelay: `${120 + i * 70}ms` } as CSSProperties}
                >
                  <CristalEssencia className="h-12 w-auto -translate-x-1/2 -translate-y-1/2" />
                </span>
              )
            })}
          </div>
        )}

        {/* a recompensa */}
        {mostraItem && (
          <div className="tw-surge relative grid place-items-center">
            {item.tipo === 'chave' && <ChaveOrnamental className="w-[min(78vw,320px)] -rotate-[18deg] drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]" />}
            {item.tipo === 'essencia' && <CristalEssencia className="h-[min(42vh,300px)] w-auto drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]" />}
            {item.tipo === 'selo' && (
              <div className="relative grid place-items-center">
                <EstrelaAndar estado="concluido" className="size-[min(62vw,240px)] drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]" />
                              </div>
            )}
            {/* faíscas */}
            {Array.from({ length: nFaiscas }, (_, i) => {
              const ang = (i / nFaiscas) * Math.PI * 2
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className="tw-faisca absolute left-1/2 top-1/2 size-2 rotate-45 bg-[#ece5d8]"
                  style={{ '--dx': `${Math.cos(ang) * (110 + (i % 3) * 30)}px`, '--dy': `${Math.sin(ang) * (110 + (i % 3) * 30)}px`, animationDelay: `${(i % 4) * 40}ms` } as CSSProperties}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* resultado */}
      <div className={cn('dv-safe-bottom relative z-10 shrink-0 px-5 pb-5 transition-[opacity,transform] duration-500', fase === 'resultado' ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')} aria-live="polite">
        {fase === 'resultado' && (
          <>
            <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-amethyst-text">
              <span className="size-1.5 rotate-45 bg-dv-amethyst" />
              {item.tipo === 'selo' ? 'Andar concluído' : ITEM_RARITY_LABEL[item.raridade]}
              <span className="size-1.5 rotate-45 bg-dv-amethyst" />
            </p>
            <p className="mt-2 text-center font-display text-[22px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text [text-wrap:balance]">
              {item.quantidade > 1 ? `${item.quantidade}× ` : item.tipo !== 'selo' ? '+1 ' : ''}
              {item.nome}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-center font-body text-[15px] leading-relaxed text-dv-text-2">{item.descricao}</p>
            <div className="mx-auto mt-4 max-w-sm">
              <BotaoTorre
                autoFocus
                onClick={() => {
                  playSfx('confirm')
                  onFim()
                }}
              >
                Continuar
              </BotaoTorre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
