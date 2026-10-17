'use client'

import { ChevronLeft } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { type ArcanoVista, type EstagioVista, VIRTUDES } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { toRoman } from '../kit'
import { Naipe } from '../virtudes/naipes'
import { prng } from './fx'
import { VT_FIGURA } from './galeria'
import { Cartela, Medalhao, Retrato, TituloOrnado } from './moldura'

/**
 * Detalhe no altar (ref-07, sem copiar): parede de mármore, rosácea de vitral em ametista com a luz passando
 * (fachos que respiram), colunas, a figura num nicho com brilho suave e luz de contorno, degraus com velas que
 * tremulam, fumaça e brasas subindo. Por cima, em painéis: Descrição, Fisiologia (mais natural / mais custosa) e
 * a linha dos Estágios (medalhões ligados por um fio: alcançados em aço, o atual em ametista pulsando, os
 * seguintes velados). A figura é o elemento compartilhado com a moldura da galeria (View Transitions).
 */

const nomeCurto = (t: string) => t.replace(/^Arcano d[aoe]s? /, '')

export function Altar({ a, estagio, voltar }: { a: ArcanoVista; estagio: number; voltar: () => void }) {
  const d = a.detalhe!
  const topo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    topo.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-30 -mb-14 flex h-14 items-center bg-[linear-gradient(180deg,var(--dv-ink),color-mix(in_oklab,var(--dv-ink)_70%,transparent)_65%,transparent)] px-3">
          <button
            type="button"
            onClick={voltar}
            className="dv-focus dv-cut-diag flex min-h-11 items-center gap-1 bg-dv-ink/80 pl-2 pr-4 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-gold)]"
            style={{ '--dv-cut': '7px' } as CSSProperties}
          >
            <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
            Galeria
          </button>
        </div>

        {/* cena em camadas */}
        <div className="relative h-[72svh] max-h-[620px] min-h-[480px]">
          <Fundo />
          <div className="absolute inset-x-[23%] bottom-[22%] top-[11%]" style={{ viewTransitionName: VT_FIGURA } as CSSProperties}>
            <span aria-hidden="true" className="arc-halo absolute -inset-x-[30%] -bottom-[8%] top-[0%] rounded-full bg-[radial-gradient(50%_46%_at_50%_46%,color-mix(in_oklab,var(--dv-amethyst)_42%,transparent),color-mix(in_oklab,var(--dv-gold-bright)_8%,transparent)_55%,transparent_72%)]" style={{ '--d': '5s' } as CSSProperties} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 round 50% 50% 10% 10% / 26% 26% 6% 6%)' }}>
              <Retrato arcano={a.key} tipo="figura" modo="cor" aceso carregar translucido />
            </div>
            {/* luz de contorno do nicho */}
            <svg aria-hidden="true" viewBox="0 0 100 160" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              <path d="M1 44C1 16 22 1 50 1C78 1 99 16 99 44V150C99 155 96 159 90 159H10C4 159 1 155 1 150Z" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.55" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              <path d="M1 44C1 16 22 1 50 1C78 1 99 16 99 44" fill="none" stroke="var(--dv-amethyst-text)" strokeOpacity="0.6" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: 'blur(2px)' }} />
            </svg>
          </div>
          <Velas />
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,var(--dv-ink)_62%)] px-4 pb-3 pt-16">
            <Cartela numeral={a.numeral} aceso={a.proprio} className="mx-auto max-w-[340px]">
              <div className="text-center">
                <h2 ref={topo} tabIndex={-1} className="font-display text-[26px] font-semibold uppercase leading-none tracking-[0.12em] text-dv-text outline-none">
                  {nomeCurto(a.titulo)}
                </h2>
                <p className="dv-label mt-1.5 text-[9.5px] text-dv-gold">
                  Arcano {a.numeral}
                  {a.proprio ? ` · Estágio ${toRoman(estagio)}` : ''}
                </p>
                {a.provisorio && <span className="mt-1.5 inline-flex h-5 items-center px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-dv-gold shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">Texto provisório</span>}
              </div>
            </Cartela>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-md flex-col gap-4 px-4 pb-12 pt-2">
          <p className="arc-entra mx-auto max-w-[32ch] text-center font-body text-[16px] italic leading-relaxed text-dv-text-2">{a.breve}</p>
          <Painel titulo="Descrição" atraso={0.05}>
            <p className="font-body text-[15.5px] leading-relaxed text-dv-text">{d.descricao}</p>
          </Painel>
          <Painel titulo="Fisiologia" atraso={0.12}>
            <p className="font-body text-[15.5px] leading-relaxed text-dv-text">{d.fisiologia}</p>
            {(d.excelente || d.deficiente) && (
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                {d.excelente && (
                  <div className="relative flex items-center gap-2.5 overflow-hidden bg-dv-amethyst/10 px-2.5 py-2.5 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--dv-amethyst)_55%,transparent)]">
                    <span aria-hidden="true" className="absolute -left-4 top-1/2 size-16 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-amethyst)_45%,transparent),transparent)]" />
                    <Naipe virtude={d.excelente} className="relative size-9" />
                    <span className="relative">
                      <span className="dv-label block text-[9.5px] text-dv-amethyst-text">Mais natural</span>
                      <span className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text">{VIRTUDES[d.excelente].nome}</span>
                    </span>
                  </div>
                )}
                {d.deficiente && (
                  <div className="flex items-center gap-2.5 bg-dv-ink-3/60 px-2.5 py-2.5 shadow-[inset_0_0_0_1px_var(--dv-line)]">
                    <Naipe virtude={d.deficiente} className="size-9" apagado />
                    <span>
                      <span className="dv-label block text-[9.5px] text-dv-text-3">Mais custosa</span>
                      <span className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text-2">{VIRTUDES[d.deficiente].nome}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </Painel>
          <Painel titulo="Estágios de evolução" atraso={0.2}>
            <Linha estagios={d.estagios} />
          </Painel>
        </div>
      </div>
    </div>
  )
}

/** Painel de vidro escuro com filete de aço e cantoneiras. */
function Painel({ titulo, atraso, children }: { titulo: string; atraso: number; children: ReactNode }) {
  return (
    <section className="arc-entra relative bg-dv-ink-2/90 px-4 pb-4 pt-3.5 shadow-[inset_0_0_0_1px_var(--dv-line-gold),var(--dv-shadow-1)] backdrop-blur-sm" style={{ '--atraso': `${atraso}s` } as CSSProperties}>
      {(['left-1 top-1', 'right-1 top-1 -scale-x-100', 'left-1 bottom-1 -scale-y-100', 'right-1 bottom-1 -scale-100'] as const).map((pos) => (
        <svg key={pos} viewBox="0 0 14 14" aria-hidden="true" className={cn('absolute size-3.5 text-dv-gold', pos)}>
          <path d="M1 13V5C1 2.8 2.8 1 5 1H13M4 13V7C4 5.3 5.3 4 7 4H13" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
      <TituloOrnado className="mb-3">{titulo}</TituloOrnado>
      {children}
    </section>
  )
}

/** Linha dos Estágios: medalhões ligados por um fio (inteiro até o atual, tracejado depois). */
function Linha({ estagios }: { estagios: EstagioVista[] }) {
  const atual = estagios.findIndex((e) => e.estado === 'atual')
  const ate = atual >= 0 ? atual : estagios.every((e) => e.estado === 'aberto') ? estagios.length - 1 : -1
  return (
    <ol className="relative flex flex-col">
      {estagios.map((e, i) => {
        const futuro = e.estado === 'futuro'
        const cur = e.estado === 'atual'
        const ultimo = i === estagios.length - 1
        return (
          <li key={i} aria-current={cur ? 'step' : undefined} className="relative flex gap-3.5 pb-4 last:pb-0">
            {!ultimo && (
              <span
                aria-hidden="true"
                className={cn('absolute left-[21px] top-11 -bottom-0 w-[2px]', i < ate ? 'bg-[linear-gradient(180deg,var(--dv-gold-bright),var(--dv-gold))]' : 'bg-[repeating-linear-gradient(180deg,var(--dv-line-strong)_0_4px,transparent_4px_8px)]')}
              />
            )}
            <Medalhao estado={cur ? 'aceso' : futuro ? 'apagado' : 'aberto'} pulso={cur} className="size-11 shrink-0">
              <span className={cn('font-impact text-[15px] font-semibold leading-none', cur ? 'text-dv-gold-bright' : futuro ? 'text-dv-text-3' : 'dv-brass-text')}>{toRoman(i + 1)}</span>
            </Medalhao>
            <div className={cn('min-w-0 flex-1 pt-1', cur && '-mr-1 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--dv-amethyst)_16%,transparent),transparent)] px-2 py-1.5')}>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn('font-display text-[15.5px] font-semibold uppercase tracking-[0.08em]', cur ? 'text-dv-text' : futuro ? 'text-dv-text-3' : 'text-dv-text-2')}>{e.nome}</span>
                {cur && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-amethyst-text">Atual</span>}
                {e.estado === 'passado' && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-gold">Alcançado</span>}
                {futuro && <span className="sr-only">(ainda não alcançado)</span>}
              </p>
              {e.linha ? (
                <p className={cn('mt-0.5 font-body text-[15px] leading-relaxed', cur ? 'text-dv-text' : futuro ? 'text-dv-text-3' : 'text-dv-text-2')}>{e.linha}</p>
              ) : futuro ? (
                <p className="mt-0.5 font-body text-[14px] italic leading-relaxed text-dv-text-3">Ainda velado.</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ cenário */

/** Parede, rosácea de vitral em ametista com a luz passando, colunas e degraus. Só SVG e tokens. */
function Fundo() {
  const vidro = useMemo(() => {
    const r = prng(13)
    const cacos: { d: string; c: string; o: number }[] = []
    const cores = ['var(--dv-amethyst)', 'var(--dv-amethyst-deep)', 'var(--dv-violet)', 'var(--dv-night-2)', 'var(--dv-amethyst-text)']
    // 3 coroas × 12 setores, cada caco um trapézio de anel
    ;[
      [46, 78],
      [78, 112],
      [112, 146],
    ].forEach(([r0, r1], k) => {
      const n = 12 * (k + 1)
      for (let i = 0; i < n; i++) {
        const t0 = (i / n) * Math.PI * 2
        const t1 = ((i + 1) / n) * Math.PI * 2
        const p = (rr: number, t: number) => `${(200 + Math.cos(t) * rr).toFixed(1)} ${(190 + Math.sin(t) * rr).toFixed(1)}`
        cacos.push({ d: `M${p(r0, t0)}L${p(r1, t0)}A${r1} ${r1} 0 0 1 ${p(r1, t1)}L${p(r0, t1)}A${r0} ${r0} 0 0 0 ${p(r0, t0)}Z`, c: cores[Math.floor(r() * cores.length)], o: 0.45 + r() * 0.45 })
      }
    })
    return cacos
  }, [])
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <span className="absolute inset-0 bg-[linear-gradient(180deg,var(--dv-ink-2),var(--dv-night)_45%,var(--dv-ink)_100%)]" />
      <span className="absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:420px_420px] opacity-50" />
      <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMin slice" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="alt-luz" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--dv-gold-bright)" stopOpacity="0.65" />
            <stop offset="0.5" stopColor="var(--dv-amethyst-text)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--dv-amethyst)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="alt-facho" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="var(--dv-amethyst-text)" stopOpacity="0.4" />
            <stop offset="1" stopColor="var(--dv-amethyst-text)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="alt-coluna" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--dv-ink)" />
            <stop offset="0.7" stopColor="var(--dv-ink-3)" />
            <stop offset="1" stopColor="var(--dv-ink-2)" />
          </linearGradient>
        </defs>
        {/* vitral */}
        <circle cx="200" cy="190" r="150" fill="var(--dv-ink)" />
        {vidro.map((c, i) => (
          <path key={i} d={c.d} fill={c.c} fillOpacity={c.o} />
        ))}
        <circle cx="200" cy="190" r="46" fill="var(--dv-amethyst-deep)" fillOpacity="0.85" />
        <circle cx="200" cy="190" r="150" fill="url(#alt-luz)" style={{ mixBlendMode: 'screen' }} />
        {/* chumbo e aço */}
        <g fill="none" stroke="var(--dv-ink)" strokeLinejoin="round">
          <circle cx="200" cy="190" r="46" strokeWidth="4" />
          <circle cx="200" cy="190" r="78" strokeWidth="3" />
          <circle cx="200" cy="190" r="112" strokeWidth="3" />
          {Array.from({ length: 12 }, (_, i) => {
            const t = (i * Math.PI) / 6
            return <path key={i} d={`M${200 + Math.cos(t) * 46} ${190 + Math.sin(t) * 46}L${200 + Math.cos(t) * 150} ${190 + Math.sin(t) * 150}`} strokeWidth="3" />
          })}
        </g>
        <circle cx="200" cy="190" r="152" fill="none" stroke="var(--dv-gold-deep)" strokeWidth="9" />
        <circle cx="200" cy="190" r="152" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.6" strokeWidth="1.2" />
        <circle cx="200" cy="190" r="146" fill="none" stroke="var(--dv-ink)" strokeWidth="2" />
        {/* fachos que atravessam o vidro */}
        <g className="arc-raios" style={{ mixBlendMode: 'screen' }}>
          <path d="M150 250L70 520H190Z" fill="url(#alt-facho)" style={{ filter: 'blur(6px)' }} />
          <path d="M250 250L210 520H330Z" fill="url(#alt-facho)" style={{ filter: 'blur(6px)' }} />
          <path d="M200 260L160 520H240Z" fill="url(#alt-facho)" opacity="0.7" style={{ filter: 'blur(8px)' }} />
        </g>
        {/* colunas e arco */}
        <path d="M0 0H44V520H0Z" fill="url(#alt-coluna)" />
        <path d="M400 0H356V520H400Z" fill="url(#alt-coluna)" />
        <path d="M44 0V30Q200 -40 356 30V0Z" fill="var(--dv-ink)" />
        <path d="M44 30Q200 -40 356 30" fill="none" stroke="var(--dv-gold-deep)" strokeWidth="2" />
        <path d="M44 0V520M356 0V520" stroke="var(--dv-gold)" strokeOpacity="0.25" strokeWidth="1" />
        {/* degraus do altar */}
        <g stroke="var(--dv-gold-deep)" strokeOpacity="0.5" strokeWidth="1">
          <path d="M80 390H320L340 410H60Z" fill="var(--dv-ink-3)" />
          <path d="M60 410H340L366 438H34Z" fill="var(--dv-ink-2)" />
          <path d="M34 438H366L400 474H0Z" fill="var(--dv-ink)" />
        </g>
        <path d="M80 390H320" stroke="var(--dv-gold-bright)" strokeOpacity="0.35" strokeWidth="1" />
      </svg>
    </div>
  )
}

const VELAS = [
  [62, 400, 36],
  [84, 394, 54],
  [104, 402, 28],
  [296, 402, 30],
  [316, 394, 50],
  [338, 400, 38],
  [40, 432, 24],
  [362, 432, 26],
  [140, 418, 18],
  [260, 418, 20],
  [176, 412, 14],
  [224, 412, 16],
] as const

/** Velas que tremulam, com halo, fumaça e brasas subindo (somem com movimento reduzido). */
function Velas() {
  const r = useMemo(() => prng(5), [])
  const var_ = useMemo(() => VELAS.map(() => ({ d: 1.1 + r() * 0.9, a: -r() * 2, f: 5 + r() * 4, dx: (r() - 0.5) * 30 })), [r])
  return (
    <svg aria-hidden="true" viewBox="0 0 400 520" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <radialGradient id="alt-halo">
          <stop offset="0" stopColor="var(--dv-gold-bright)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--dv-gold-bright)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="alt-cera" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--dv-paper)" />
          <stop offset="0.6" stopColor="var(--dv-paper-2)" />
          <stop offset="1" stopColor="var(--dv-gold-deep)" />
        </linearGradient>
      </defs>
      {VELAS.map(([x, base, h], i) => {
        const v = var_[i]
        const topo = base - h
        return (
          <g key={i}>
            <rect x={x - 4} y={topo} width="8" height={h} fill="url(#alt-cera)" />
            <path d={`M${x - 4} ${topo}Q${x - 2} ${topo + 4} ${x - 3} ${topo + 9}`} fill="none" stroke="var(--dv-paper)" strokeWidth="1.4" />
            <circle className="arc-halo" cx={x} cy={topo - 6} r="18" fill="url(#alt-halo)" style={{ '--d': `${v.d * 1.6}s`, '--atraso': `${v.a}s` } as CSSProperties} />
            <path
              className="arc-chama"
              d={`M${x} ${topo - 16}C${x + 3.6} ${topo - 9} ${x + 3.2} ${topo - 2} ${x} ${topo - 1}C${x - 3.2} ${topo - 2} ${x - 3.6} ${topo - 9} ${x} ${topo - 16}Z`}
              fill="var(--dv-gold-bright)"
              style={{ '--d': `${v.d}s`, '--atraso': `${v.a}s` } as CSSProperties}
            />
            <path className="arc-chama" d={`M${x} ${topo - 8}C${x + 1.4} ${topo - 5} ${x + 1.2} ${topo - 2} ${x} ${topo - 1.5}C${x - 1.2} ${topo - 2} ${x - 1.4} ${topo - 5} ${x} ${topo - 8}Z`} fill="var(--dv-amethyst-text)" opacity="0.7" style={{ '--d': `${v.d}s`, '--atraso': `${v.a}s` } as CSSProperties} />
            {i < 6 && (
              <circle className="arc-fumaca" cx={x} cy={topo - 18} r="6" fill="var(--dv-text-3)" style={{ '--d': `${v.f}s`, '--atraso': `${v.a * 2}s`, '--dx': `${v.dx}px`, filter: 'blur(5px)', transformBox: 'fill-box', transformOrigin: 'center' } as CSSProperties} />
            )}
            {i % 3 === 0 && (
              <circle className="arc-poeira" cx={x + 2} cy={topo - 14} r="0.9" fill="var(--dv-gold-bright)" style={{ '--d': `${v.f + 2}s`, '--atraso': `${v.a * 3}s`, '--dx': `${v.dx * 0.6}px`, '--o': 0.9 } as CSSProperties} />
            )}
          </g>
        )
      })}
    </svg>
  )
}
