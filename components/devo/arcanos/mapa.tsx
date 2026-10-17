'use client'

import { ChevronRight } from 'lucide-react'
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react'
import type { VirtudesPayload } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { EmblemArcanos } from '../kit/emblems'
import { toRoman } from '../kit'
import { comum } from '@/lib/devo/arcanos-arte'
import { prng, reduzMovimento, sentir } from './fx'
import { Medalhao } from './moldura'
import { SigiloPintado } from './sigilos'

/**
 * Mapa orbital (ref-06) com profundidade de verdade: os três anéis são círculos num plano inclinado, projetados
 * em perspectiva a cada quadro (JS, sem re-render: só `transform` nos medalhões e o `d` dos traços). Os anéis
 * giram devagar (cada um no seu ritmo), arrastar gira o mapa com inércia e inclina o plano (mouse), o giroscópio
 * inclina um pouco (Android), e as três camadas de estrelas andam em paralaxe. As linhas da constelação ligam os
 * Arcanos na ordem do tarô (0 → XXI). O numeral fica DENTRO do medalhão: nada colide em tela estreita.
 * Movimento reduzido: sem giro automático, sem inércia, sem giroscópio, estrelas paradas.
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>
const nomeCurto = (t: string) => t.replace(/^Arcano d[aoe]s? /, '')

const ANEIS = [
  { de: 0, n: 6, r: 0.185, ritmo: 1 },
  { de: 6, n: 8, r: 0.305, ritmo: -0.62 },
  { de: 14, n: 8, r: 0.42, ritmo: 0.4 },
] as const
const anelDe = (i: number) => ANEIS.find((a) => i >= a.de && i < a.de + a.n)!
const baseDe = (i: number) => {
  const a = anelDe(i)
  return ((i - a.de) / a.n) * Math.PI * 2 + a.de * 0.37
}
const OMEGA = (Math.PI * 2) / 180 // uma volta a cada 3 minutos no anel de dentro
const INCL = { min: 36, max: 60, padrao: 46 }

const CAMADAS = (() => {
  const r = prng(41)
  return [44, 30, 14].map((n, k) =>
    Array.from({ length: n }, () => ({ x: r() * 100, y: r() * 100, s: (k + 1) * (0.6 + r() * 0.9), o: 0.25 + r() * 0.5 + k * 0.1, d: 3 + r() * 5, a: -r() * 6 })),
  )
})()

export function Mapa({ d, onEscolher }: { d: Liberado; onEscolher: (i: number) => void }) {
  const caixa = useRef<HTMLDivElement>(null)
  const nos = useRef<(HTMLButtonElement | null)[]>([])
  const aneis = useRef<(SVGPathElement | null)[]>([])
  const marcas = useRef<SVGPathElement>(null)
  const trilha = useRef<SVGPathElement>(null)
  const trilhaMinha = useRef<SVGPathElement>(null)
  const camadas = useRef<(HTMLDivElement | null)[]>([])
  const fundo = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(360)
  const meuIdx = d.arcanos.findIndex((a) => a.proprio)
  const orbital = comum('orbital')
  const meu = meuIdx >= 0 ? d.arcanos[meuIdx] : null
  const H = Math.round(w * 0.98)

  const fisica = useRef({
    phi: meuIdx >= 0 ? (Math.PI / 2 - baseDe(meuIdx)) / anelDe(meuIdx).ritmo : 0,
    vphi: 0,
    incl: INCL.padrao,
    gx: 0,
    arrasto: null as null | { x: number; y: number; phi: number; incl: number; t: number; ult: number; moveu: boolean },
    moveu: false,
  })

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(Math.min(460, e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // giroscópio (só onde o navegador entrega sem pedir permissão) e arrasto
  useEffect(() => {
    const f = fisica.current
    const gyro = (e: DeviceOrientationEvent) => {
      if (reduzMovimento() || e.gamma == null) return
      f.gx = Math.max(-1, Math.min(1, e.gamma / 35)) * 0.12
    }
    window.addEventListener('deviceorientation', gyro)
    const mover = (e: PointerEvent) => {
      const a = f.arrasto
      if (!a) return
      const dx = e.clientX - a.x
      const dy = e.clientY - a.y
      if (Math.abs(dx) + Math.abs(dy) > 6) a.moveu = true
      const agora = performance.now()
      const nova = a.phi + dx / (w * 0.35)
      f.vphi = ((nova - f.phi) / Math.max(1, agora - a.ult)) * 16
      a.ult = agora
      f.phi = nova
      if (e.pointerType === 'mouse') f.incl = Math.max(INCL.min, Math.min(INCL.max, a.incl + dy * 0.12))
    }
    const soltar = () => {
      if (!f.arrasto) return
      f.moveu = f.arrasto.moveu
      f.arrasto = null
      if (reduzMovimento()) f.vphi = 0
      setTimeout(() => (f.moveu = false), 50)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('deviceorientation', gyro)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [w])

  // laço de desenho
  useEffect(() => {
    const f = fisica.current
    const cx = w / 2
    const cy = H * 0.5
    const P = w * 2.4
    let quadro = 0
    let antes = performance.now()
    const proj = (x: number, z: number, cos: number, sin: number) => {
      const prof = z * sin
      const s = P / (P - prof)
      return { X: cx + x * s, Y: cy + z * cos * s, s, prof }
    }
    const desenhar = (agora: number) => {
      const dt = Math.min(64, agora - antes)
      antes = agora
      const parado = reduzMovimento()
      if (!f.arrasto) {
        f.phi += f.vphi
        f.vphi *= 0.93
        if (Math.abs(f.vphi) < 0.0001) f.vphi = 0
        if (!parado) f.phi += (OMEGA * dt) / 1000
      }
      const inc = (f.incl * Math.PI) / 180
      const cos = Math.cos(inc)
      const sin = Math.sin(inc)
      const pos: { X: number; Y: number; s: number; prof: number }[] = []
      d.arcanos.forEach((a, i) => {
        const anel = anelDe(i)
        const R = anel.r * w * 1.0
        const t = baseDe(i) + (f.phi + f.gx) * anel.ritmo
        const p = proj(Math.cos(t) * R, Math.sin(t) * R, cos, sin)
        pos.push(p)
        const no = nos.current[i]
        if (!no) return
        const k = Math.max(0.7, Math.min(1.15, p.s))
        no.style.transform = `translate3d(${(p.X - 20).toFixed(1)}px, ${(p.Y - 20).toFixed(1)}px, 0) scale(${k.toFixed(3)})`
        no.style.zIndex = String(Math.round(1000 + p.prof))
        no.style.opacity = (0.5 + 0.5 * ((Math.sin(t) + 1) / 2)).toFixed(2)
      })
      // anéis (só mudam com a inclinação) e marcas do anel externo (giram)
      ANEIS.forEach((anel, k) => {
        const R = anel.r * w
        let dd = ''
        for (let j = 0; j <= 72; j++) {
          const t = (j / 72) * Math.PI * 2
          const p = proj(Math.cos(t) * R, Math.sin(t) * R, cos, sin)
          dd += `${j ? 'L' : 'M'}${p.X.toFixed(1)} ${p.Y.toFixed(1)}`
        }
        aneis.current[k]?.setAttribute('d', dd)
      })
      {
        const R = 0.475 * w
        let dd = ''
        for (let j = 0; j <= 96; j++) {
          const t = (j / 96) * Math.PI * 2
          const p = proj(Math.cos(t) * R, Math.sin(t) * R, cos, sin)
          dd += `${j ? 'L' : 'M'}${p.X.toFixed(1)} ${p.Y.toFixed(1)}`
        }
        aneis.current[3]?.setAttribute('d', dd)
        let mm = ''
        for (let j = 0; j < 36; j++) {
          const t = (j / 36) * Math.PI * 2 + f.phi * 0.25
          const a = proj(Math.cos(t) * R, Math.sin(t) * R, cos, sin)
          const L = j % 3 ? 0.035 : 0.07
          const b = proj(Math.cos(t) * R * (1 - L), Math.sin(t) * R * (1 - L), cos, sin)
          mm += `M${a.X.toFixed(1)} ${a.Y.toFixed(1)}L${b.X.toFixed(1)} ${b.Y.toFixed(1)}`
        }
        marcas.current?.setAttribute('d', mm)
      }
      // constelação 0 → XXI (os trechos do próprio em ametista)
      let tr = ''
      let trm = ''
      for (let i = 0; i < pos.length - 1; i++) {
        const seg = `M${pos[i].X.toFixed(1)} ${pos[i].Y.toFixed(1)}L${pos[i + 1].X.toFixed(1)} ${pos[i + 1].Y.toFixed(1)}`
        if (i === meuIdx || i + 1 === meuIdx) trm += seg
        else tr += seg
      }
      trilha.current?.setAttribute('d', tr)
      trilhaMinha.current?.setAttribute('d', trm || 'M0 0')
      // paralaxe: a pintura orbital ao fundo anda pouco, as estrelas mais
      if (fundo.current) fundo.current.style.transform = `translate3d(${(Math.sin(f.phi * 0.5) * 4).toFixed(1)}px, ${((f.incl - INCL.padrao) * 0.3).toFixed(1)}px, 0) rotate(${(Math.sin(f.phi * 0.25) * 1.5).toFixed(2)}deg)`
      camadas.current.forEach((c, k) => {
        if (!c) return
        const fator = (k + 1) * 7
        c.style.transform = `translate3d(${(Math.sin(f.phi * 0.5) * fator).toFixed(1)}px, ${((f.incl - INCL.padrao) * (k + 1) * 0.5).toFixed(1)}px, 0)`
      })
      quadro = requestAnimationFrame(desenhar)
    }
    quadro = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(quadro)
  }, [w, H, d.arcanos, meuIdx])

  const escolher = (i: number) => {
    if (fisica.current.moveu) return
    sentir('toque')
    onEscolher(i)
  }
  const id = `mp${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex max-w-md flex-col pb-10">
        <section
          ref={caixa}
          aria-label="Mapa dos vinte e dois Arcanos"
          aria-describedby={`${id}-dica`}
          className="relative w-full touch-pan-y select-none overflow-hidden"
          style={{ height: H }}
          onPointerDown={(e) => {
            const f = fisica.current
            f.arrasto = { x: e.clientX, y: e.clientY, phi: f.phi, incl: f.incl, t: performance.now(), ult: performance.now(), moveu: false }
            f.vphi = 0
          }}
        >
          <p id={`${id}-dica`} className="sr-only">
            Arraste para girar. Cada medalhão abre a galeria naquele Arcano.
          </p>
          {/* pintura orbital (infra/arte) no fundo, no tom ametista; céu em três camadas (paralaxe) + névoa */}
          {orbital && (
            <div ref={fundo} aria-hidden="true" className="pointer-events-none absolute -inset-[6%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={orbital.src} srcSet={orbital.srcSet} sizes="(max-width: 480px) 140vw, 640px" alt="" decoding="async" className="arc-tom-fundo size-full object-cover opacity-80" />
              <span className="absolute inset-0 bg-dv-amethyst opacity-20 mix-blend-color" />
            </div>
          )}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_45%,color-mix(in_oklab,var(--dv-amethyst-deep)_45%,transparent),transparent_70%),radial-gradient(40%_30%_at_78%_20%,color-mix(in_oklab,var(--dv-night-2)_80%,transparent),transparent)]" />
          {CAMADAS.map((estrelas, k) => (
            <div
              key={k}
              ref={(el) => {
                camadas.current[k] = el
              }}
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8"
            >
              {estrelas.map((s, j) => (
                <span
                  key={j}
                  className="arc-cintila absolute rounded-full bg-dv-gold-bright"
                  style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, '--o': s.o, opacity: s.o, '--d': `${s.d}s`, '--atraso': `${s.a}s`, boxShadow: k === 2 ? '0 0 6px var(--dv-gold-bright)' : undefined } as CSSProperties}
                />
              ))}
            </div>
          ))}
          <svg aria-hidden="true" width={w} height={H} className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible">
            <defs>
              <linearGradient id={`${id}-aco`} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                <stop offset="0" stopColor="var(--dv-gold-deep)" />
                <stop offset="0.3" stopColor="var(--dv-gold-bright)" />
                <stop offset="0.55" stopColor="var(--dv-gold)" />
                <stop offset="0.8" stopColor="var(--dv-gold-bright)" />
                <stop offset="1" stopColor="var(--dv-gold-deep)" />
              </linearGradient>
            </defs>
            <path ref={(el) => void (aneis.current[3] = el)} fill="none" stroke={`url(#${id}-aco)`} strokeWidth="2.6" strokeOpacity="0.85" />
            <path ref={marcas} fill="none" stroke="var(--dv-gold)" strokeWidth="1" strokeOpacity="0.55" />
            {ANEIS.map((_, k) => (
              <path key={k} ref={(el) => void (aneis.current[k] = el)} fill="none" stroke={`url(#${id}-aco)`} strokeWidth={k === 2 ? 1.6 : 1.1} strokeOpacity={0.55 - k * 0.08} strokeDasharray={k === 1 ? '6 5' : undefined} />
            ))}
            <path ref={trilha} fill="none" stroke="var(--dv-gold-bright)" strokeOpacity="0.32" strokeWidth="0.9" />
            <path ref={trilhaMinha} fill="none" stroke="var(--dv-amethyst-text)" strokeOpacity="0.85" strokeWidth="1.4" style={{ filter: 'drop-shadow(0 0 3px var(--dv-amethyst))' }} />
          </svg>
          {/* centro */}
          <button
            type="button"
            onClick={() => escolher(Math.max(0, meuIdx))}
            aria-label={meu ? `Seu Arcano: ${nomeCurto(meu.titulo)}. Abrir na galeria` : 'Abrir a galeria'}
            className="dv-focus absolute left-1/2 top-1/2 z-[1000] grid size-[56px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          >
            <span aria-hidden="true" className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-gold-bright)_22%,transparent),transparent)]" />
            <Medalhao estado={meu ? 'aceso' : 'aberto'} className="size-full">
              {meu ? <span className="dv-brass-text font-impact text-[19px] font-semibold leading-none">{meu.numeral}</span> : <EmblemArcanos className="size-9 text-dv-gold" />}
            </Medalhao>
          </button>
          {d.arcanos.map((a, i) => {
            const aberto = !!a.detalhe
            const estado = a.proprio ? 'aceso' : aberto ? 'aberto' : 'apagado'
            return (
              <button
                key={a.key}
                ref={(el) => {
                  nos.current[i] = el
                }}
                type="button"
                onClick={() => escolher(i)}
                aria-label={`${a.numeral} · ${nomeCurto(a.titulo)}${a.proprio ? ', seu Arcano' : aberto ? '' : ' (trancado)'}`}
                className="dv-focus absolute left-0 top-0 size-10 rounded-full will-change-transform before:absolute before:-inset-1 before:content-['']"
              >
                <Medalhao estado={estado} pulso={a.proprio} className="size-full">
                  <SigiloPintado arcano={a.key} estado={estado} px={22} className="-mt-0.5 size-[22px]" />
                  <span className={cn('-mt-[1px] font-mono text-[7.5px] leading-none tracking-[0.04em]', a.proprio ? 'text-dv-amethyst-text' : aberto ? 'text-dv-gold' : 'text-dv-text-3')}>{a.numeral}</span>
                </Medalhao>
              </button>
            )
          })}
        </section>

        <div className="mt-2 flex flex-col gap-4 px-4">
          <header className="text-center">
            <p className="dv-label text-[10px] text-dv-gold">Arcanos maiores</p>
            <h2 className="mt-1 font-display text-[23px] font-semibold uppercase tracking-[0.12em] text-dv-text [text-shadow:0_0_18px_color-mix(in_oklab,var(--dv-amethyst)_45%,transparent)]">Os vinte e dois</h2>
            <p className="mx-auto mt-2 max-w-[34ch] font-body text-[15px] leading-relaxed text-dv-text-2">
              {d.verTodos
                ? 'Acesso da equipe: todos os Arcanos abrem. O jogador só abre o próprio.'
                : 'Cada pessoa desperta sob um único Arcano. Dos outros vinte e um, só se sabe o nome.'}
            </p>
          </header>
          {meu ? (
            <button
              type="button"
              onClick={() => escolher(meuIdx)}
              className="dv-focus group relative flex min-h-16 items-center gap-3 overflow-hidden bg-dv-ink-2/90 px-3 py-3 text-left shadow-[inset_0_0_0_1px_var(--dv-line-gold)]"
            >
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-24 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-amethyst)_35%,transparent),transparent)]" />
              <Medalhao estado="aceso" className="size-12">
                <SigiloPintado arcano={meu.key} estado="aceso" px={30} className="size-[30px]" />
              </Medalhao>
              <span className="relative min-w-0 flex-1">
                <span className="dv-label block text-[10px] text-dv-amethyst-text">Seu Arcano · Estágio {toRoman(d.estagio)}</span>
                <span className="block font-display text-[17px] font-semibold uppercase tracking-[0.08em] text-dv-text">
                  {meu.numeral} · {nomeCurto(meu.titulo)}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 text-dv-gold transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
            </button>
          ) : (
            !d.verTodos && (
              <p role="status" className="mx-auto max-w-[34ch] text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-dv-gold">
                Seu Arcano aparece quando o Anfitrião registrá-lo.
              </p>
            )
          )}
          <p aria-hidden="true" className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">
            Arraste para girar · toque num medalhão
          </p>
        </div>
      </div>
    </div>
  )
}
