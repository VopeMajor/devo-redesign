'use client'

import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { type CSSProperties, type KeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ArcanoVista } from '@/lib/devo/virtudes'
import { Button } from '../kit/button'
import { toRoman } from '../kit'
import { prng, reduzMovimento, sentir } from './fx'
import { Cartela, Moldura } from './moldura'

/**
 * Galeria (ref-05 + ref-04): carrossel com arrasto e encaixe nativos. O do centro fica grande, aceso por um facho
 * de luz com poeira subindo; os laterais giram em Y, encolhem, recuam, perdem a cor e escurecem (grisalha de
 * verdade: grayscale + brightness + um leve desfoque), tudo amarrado à posição da rolagem (sem re-render por
 * quadro). Trancado = estátua de pedra com selo rachado; o próprio em cor. Cartela de nome embaixo, com setas.
 */

const nomeCurto = (t: string) => t.replace(/^Arcano d[aoe]s? /, '')
export const VT_FIGURA = 'arc-figura'

const POEIRA = (() => {
  const r = prng(7)
  return Array.from({ length: 18 }, () => ({ x: 30 + r() * 40, y: 35 + r() * 55, s: 1 + r() * 2.2, o: 0.35 + r() * 0.5, d: 7 + r() * 7, a: -r() * 12, dx: (r() - 0.5) * 30 }))
})()

export function Galeria({
  lista,
  inicial,
  estagio,
  onIndice,
  onAbrir,
  semVt,
}: {
  lista: ArcanoVista[]
  inicial: number
  estagio: number
  onIndice: (i: number) => void
  onAbrir: (i: number) => void
  /** Durante a transição para o altar o nome compartilhado sai do carrossel. */
  semVt?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const itens = useRef<(HTMLLIElement | null)[]>([])
  const idxRef = useRef(inicial)
  const [idx, setIdx] = useState(inicial)
  const quadro = useRef(0)

  const medir = useCallback(() => {
    quadro.current = 0
    const el = ref.current
    if (!el) return
    const meio = el.scrollLeft + el.clientWidth / 2
    let melhor = idxRef.current
    let menor = Infinity
    itens.current.forEach((it, i) => {
      if (!it) return
      const c = it.offsetLeft + it.offsetWidth / 2
      const dist = c - meio
      it.style.setProperty('--t', Math.min(1.6, Math.abs(dist) / it.offsetWidth).toFixed(3))
      it.style.setProperty('--s', dist < 0 ? '-1' : '1')
      it.style.zIndex = String(100 - Math.round(Math.abs(dist) / 10))
      if (Math.abs(dist) < menor) {
        menor = Math.abs(dist)
        melhor = i
      }
    })
    if (melhor !== idxRef.current) {
      idxRef.current = melhor
      setIdx(melhor)
      sentir('troca')
    }
  }, [])
  const onScroll = () => {
    if (!quadro.current) quadro.current = requestAnimationFrame(medir)
  }
  useEffect(() => () => cancelAnimationFrame(quadro.current), [])
  useEffect(() => {
    const t = setTimeout(() => onIndice(idx), 250)
    return () => clearTimeout(t)
  }, [idx, onIndice])

  const centro = (i: number) => {
    const el = ref.current
    const it = itens.current[i]
    return el && it ? it.offsetLeft + it.offsetWidth / 2 - el.clientWidth / 2 : 0
  }
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollLeft = centro(inicial)
    medir()
    // só na montagem: depois quem manda é o dedo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const irPara = (i: number) => {
    const alvo = Math.max(0, Math.min(lista.length - 1, i))
    ref.current?.scrollTo({ left: centro(alvo), behavior: reduzMovimento() ? 'auto' : 'smooth' })
  }
  const teclado = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') irPara(idx + 1)
    else if (e.key === 'ArrowLeft') irPara(idx - 1)
    else if (e.key === 'Home') irPara(0)
    else if (e.key === 'End') irPara(lista.length - 1)
    else if (e.key === 'Enter' && lista[idx]?.detalhe) onAbrir(idx)
    else return
    e.preventDefault()
  }
  const a = lista[idx]
  const aberto = !!a?.detalhe

  return (
    <div className="relative flex h-full flex-col">
      {/* facho volumétrico e poeira sobre o centro */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[78%] overflow-hidden">
        <span className="arc-raios absolute left-1/2 top-[-10%] h-[115%] w-[78%] -translate-x-1/2 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-amethyst-text)_38%,transparent),color-mix(in_oklab,var(--dv-amethyst)_14%,transparent)_55%,transparent)] blur-[10px] [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]" />
        <span className="absolute left-1/2 top-[-10%] h-[100%] w-[30%] -translate-x-1/2 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-gold-bright)_22%,transparent),transparent_80%)] blur-[6px] [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
        {aberto && (
          <span className="absolute bottom-[4%] left-1/2 h-10 w-[62%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-amethyst)_55%,transparent),transparent)]" />
        )}
        {POEIRA.map((p, i) => (
          <span
            key={i}
            className="arc-poeira absolute rounded-full bg-dv-gold-bright"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, '--o': p.o, '--d': `${p.d}s`, '--atraso': `${p.a}s`, '--dx': `${p.dx}px`, opacity: 0, boxShadow: '0 0 4px var(--dv-gold-bright)' } as CSSProperties}
          />
        ))}
      </div>
      <div
        ref={ref}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Galeria dos Arcanos"
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={teclado}
        className="dv-focus relative flex min-h-0 flex-1 snap-x snap-mandatory items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ '--card': 'min(56vw, 236px, 34svh)', paddingInline: 'calc(50% - var(--card) / 2)' } as CSSProperties}
      >
        <ul className="flex items-center py-4">
          {lista.map((x, i) => {
            const abre = !!x.detalhe
            return (
              <li
                key={x.key}
                ref={(el) => {
                  itens.current[i] = el
                }}
                role="group"
                aria-roledescription="Arcano"
                aria-label={`${x.numeral} · ${nomeCurto(x.titulo)}${x.proprio ? ', seu Arcano' : abre ? '' : ' (trancado)'}`}
                className="relative -mx-[calc(var(--card)*0.13)] w-[var(--card)] shrink-0 snap-center"
                style={{ '--t': i === inicial ? 0 : 1, '--s': i < inicial ? -1 : 1 } as CSSProperties}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => (i === idx ? abre && onAbrir(i) : irPara(i))}
                  className="block w-full origin-center [transform:perspective(900px)_translateY(calc(min(var(--t),1)*10px))_rotateY(calc(var(--s)*min(var(--t),1)*-38deg))_scale(calc(1-min(var(--t),1)*0.26))] [filter:grayscale(min(var(--t),1))_brightness(calc(1-min(var(--t),1)*0.55))_blur(calc(min(var(--t),1)*1px))]"
                >
                  <Moldura arcano={x.key} modo={abre ? 'cor' : 'pedra'} aceso={x.proprio || (abre && i === idx)} carregar={Math.abs(i - idx) <= 1} vt={i === idx && !semVt ? VT_FIGURA : undefined} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* cartela com setas (ref-05) */}
      <div className="relative shrink-0 px-2 pb-5">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => irPara(idx - 1)} disabled={idx === 0} aria-label="Arcano anterior" className="dv-focus grid size-11 shrink-0 place-items-center text-dv-gold transition-opacity disabled:opacity-25">
            <ChevronLeft className="size-8" strokeWidth={1.25} />
          </button>
          <div aria-live="polite" className="min-w-0 flex-1">
            {a && (
              <Cartela numeral={a.numeral} aceso={a.proprio}>
                <div className="text-center">
                  <h2 className="flex items-center justify-center gap-2 font-display text-[21px] font-semibold uppercase leading-tight tracking-[0.1em] text-dv-text">
                    {nomeCurto(a.titulo)}
                    {!aberto && <Lock aria-label="trancado" className="size-4 text-dv-text-3" strokeWidth={1.75} />}
                  </h2>
                  {a.proprio && <p className="dv-label mt-0.5 text-[9.5px] text-dv-amethyst-text">Seu Arcano · Estágio {toRoman(estagio)}</p>}
                  <p className="mx-auto mt-1.5 max-w-[30ch] font-body text-[14.5px] leading-snug text-dv-text-2">{a.breve}</p>
                </div>
              </Cartela>
            )}
          </div>
          <button type="button" onClick={() => irPara(idx + 1)} disabled={idx === lista.length - 1} aria-label="Próximo Arcano" className="dv-focus grid size-11 shrink-0 place-items-center text-dv-gold transition-opacity disabled:opacity-25">
            <ChevronRight className="size-8" strokeWidth={1.25} />
          </button>
        </div>
        <div className="mt-2.5 flex min-h-11 justify-center">
          {a &&
            (aberto ? (
              <Button size="sm" onClick={() => onAbrir(idx)}>
                {a.proprio ? 'Abrir seu Arcano' : 'Abrir'}
              </Button>
            ) : (
              <p className="self-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Selado · só o portador conhece o resto</p>
            ))}
        </div>
      </div>
    </div>
  )
}
