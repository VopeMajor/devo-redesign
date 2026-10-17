'use client'

import { type CSSProperties, Fragment, type ReactNode, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CENA_MELISSA_CORPORACOES, type PassoHolo, ROTEIRO_MELISSA } from '@/lib/devo/corporacoes-melissa'
import { NpcAnchor } from '../kit/npc-anchor'
import { cn } from '@/lib/utils'
import { GlyphArrow } from '../kit/glyphs'
import { usePlayerText } from '../state/player-text'

/**
 * Companhia de Despertados — "sempre que for algo relacionado à Companhia, aparece o ícone + animação/tela
 * holográfica com a Melissa" (dono). Aqui ficam:
 * - `pedirChamadaMelissa()`: dispara o evento `devo:cena` ({ id: 'melissa-corporacoes' }). O motor da Narrativa
 *   assume com `event.preventDefault()`; se ninguém assumir, a página toca o fallback abaixo;
 * - `SeloCompanhia`: o ícone da Companhia (olho desperto num hexágono de aço) com luz holográfica;
 * - `ChamadaHolograma`: fallback simples da chamada (texto literal do dono, sem efeitos de Tempo).
 * Candidato a ser trocado pelo `HologramaMelissa` da Narrativa quando ela entrar na redesign.
 */

export const EVENTO_CENA = 'devo:cena'

/** Pede a cena da Melissa. Devolve true se alguém (Narrativa) assumiu; false → toque o fallback. */
export function pedirChamadaMelissa(replay = false): boolean {
  if (typeof window === 'undefined') return false
  const ev = new CustomEvent(EVENTO_CENA, { detail: { id: CENA_MELISSA_CORPORACOES, replay, origem: 'corporacoes' }, cancelable: true })
  window.dispatchEvent(ev)
  return ev.defaultPrevented
}

export function SeloCompanhia({ className, aceso = false, style }: { className?: string; aceso?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={cn(aceso && 'corp-holo-pulse', className)} style={style} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="corp-cia-aco" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.45" stopColor="#bab09f" />
          <stop offset="1" stopColor="#6b6357" />
        </linearGradient>
      </defs>
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29Z" stroke="url(#corp-cia-aco)" strokeWidth="1.8" />
      <path d="M32 9 52 20.5v23L32 55 12 43.5v-23Z" stroke="#8a7cc8" strokeOpacity="0.6" strokeWidth="0.9" />
      <path d="M14 32c5-7.5 11-11 18-11s13 3.5 18 11c-5 7.5-11 11-18 11s-13-3.5-18-11Z" stroke="url(#corp-cia-aco)" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="5.5" fill="url(#corp-cia-aco)" />
      <circle cx="32" cy="32" r="2" fill="#151517" />
      {[-40, -20, 0, 20, 40].map((a) => (
        <path key={a} d="M32 14v-4" stroke="#bab09f" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${a} 32 32)`} />
      ))}
    </svg>
  )
}

/** *ênfase* do texto do dono → itálico em aço claro. */
function Enfase({ texto }: { texto: string }) {
  const partes = texto.split(/(\*[^*]+\*)/g)
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <em key={i} className="not-italic text-dv-gold-bright">
            {p.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

export function ChamadaHolograma({ podePular, onFim }: { podePular: boolean; onFim: () => void }) {
  const pt = usePlayerText()
  const [fila, setFila] = useState<PassoHolo[]>(ROTEIRO_MELISSA)
  const [pose, setPose] = useState('sorriso')
  // caixa de fala: a projeção se ancora nela
  const [caixa, setCaixa] = useState<HTMLElement | null>(null)
  const [fase, setFase] = useState<'chamada' | 'ativo' | 'encerra'>('chamada')
  const atual = fila[0]

  useEffect(() => {
    playSfx('notify')
    const t = window.setTimeout(() => setFase('ativo'), 1400)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    if (atual?.tipo === 'fala' && atual.pose) setPose(atual.pose)
  }, [atual])

  const encerrar = () => {
    if (fase === 'encerra') return
    setFase('encerra')
    playSfx('close')
    window.setTimeout(onFim, 700)
  }
  const avancar = () => {
    if (fase === 'chamada') return setFase('ativo')
    if (!atual || atual.tipo === 'escolha') return
    playSfx('click')
    if (fila.length <= 1) return encerrar()
    setFila(fila.slice(1))
  }
  const escolher = (i: number) => {
    if (atual?.tipo !== 'escolha') return
    playSfx('confirm')
    const resto = [...atual.opcoes[i].resposta, ...fila.slice(1)]
    if (!resto.length) return encerrar()
    setFila(resto)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chamada holográfica da Companhia de Despertados"
      className={cn('absolute inset-0 z-40 flex flex-col overflow-hidden bg-dv-ink/95', fase === 'encerra' && 'corp-holo-fora')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          avancar()
        }
      }}
      tabIndex={-1}
    >
      <HoloEstilos />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_70%,rgb(var(--dv-amethyst-rgb)/0.22),transparent_70%)]" />
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4">
        <span className="flex items-center gap-2.5">
          <SeloCompanhia aceso className="size-8" />
          <span>
            <span className="dv-label block text-[10px] text-dv-amethyst-text">Chamada holográfica</span>
            <span className="block font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-dv-text">Companhia de Despertados</span>
          </span>
        </span>
        {podePular && (
          <button type="button" onClick={encerrar} className="dv-focus min-h-11 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-text-2 hover:text-dv-text">
            Pular chamada
          </button>
        )}
      </header>

      {/* projeção */}
      <div className="relative min-h-0 flex-1" onClick={avancar}>
        {fase === 'chamada' ? (
          <div role="status" aria-label="Chamada chegando" className="absolute inset-0 grid place-items-center">
            <span className="relative grid size-32 place-items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} aria-hidden="true" className="corp-holo-anel absolute inset-0 rounded-full border border-[#a89be0]/50" style={{ animationDelay: `${i * 0.5}s` }} />
              ))}
              <SeloCompanhia aceso className="relative size-16 drop-shadow-[0_0_12px_rgb(var(--dv-amethyst-rgb)/0.5)]" />
            </span>
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0">
            <span className="absolute inset-x-0 bottom-0 top-[6%]" style={{ background: 'linear-gradient(0deg, rgb(var(--dv-amethyst-rgb) / 0.3), rgba(186,176,159,0.08) 50%, transparent 88%)', clipPath: 'polygon(44% 100%, 56% 100%, 94% 0, 6% 0)' }} />
            {/* Melissa projetada, ANCORADA à caixa de fala (kit/npc-anchor): a base some atrás do topo da caixa */}
            <NpcAnchor
              npc="melissa"
              pose={pose}
              fala={caixa}
              cabeca="min(16dvh, 148px)"
              reserva={8}
              sobreposicao={14}
              className="corp-holo-entra corp-holo-tremor opacity-[0.85] [filter:grayscale(1)_sepia(0.55)_hue-rotate(205deg)_saturate(1.7)_brightness(1.12)_contrast(1.05)_drop-shadow(0_0_14px_rgb(var(--dv-amethyst-rgb)/0.55))]"
              sobreArte={
                <>
                  <span className="absolute inset-0 opacity-25" style={{ background: 'repeating-linear-gradient(0deg, rgba(236,229,216,0.5) 0 1px, transparent 1px 4px)' }} />
                  <span className="corp-holo-varre absolute inset-x-0 h-1/5" style={{ background: 'linear-gradient(180deg, transparent, rgba(236,229,216,0.3), transparent)' }} />
                </>
              }
            />
          </div>
        )}
      </div>

      {/* diálogo */}
      <div ref={setCaixa} className="relative z-10 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {fase !== 'chamada' && atual && atual.tipo !== 'escolha' && (
          <Caixa key={fila.length + atual.texto.slice(0, 12)} quem={atual.tipo === 'fala' ? 'Melissa' : null} onAvancar={avancar}>
            {atual.tipo === 'narra' ? (
              <p className="font-body text-[16px] italic leading-relaxed text-dv-text-2">
                <Enfase texto={pt(atual.texto)} />
              </p>
            ) : (
              <p className="font-body text-[17px] leading-relaxed text-dv-text">
                — <Enfase texto={pt(atual.texto)} />
              </p>
            )}
          </Caixa>
        )}
        {fase !== 'chamada' && atual?.tipo === 'escolha' && (
          <div role="group" aria-label="Sua resposta" className="animate-dv-rise flex flex-col gap-2">
            {atual.opcoes.map((o, i) => (
              <button
                key={o.texto}
                type="button"
                onClick={() => escolher(i)}
                className="dv-focus dv-cut-diag flex min-h-12 items-center gap-3 bg-[linear-gradient(100deg,var(--dv-ink-3),var(--dv-ink-2))] px-4 py-2.5 text-left font-body text-[16px] text-dv-text shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)] hover:shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)] active:scale-[0.99]"
                style={{ '--dv-cut': '9px' } as CSSProperties}
              >
                <span aria-hidden="true" className="font-mono text-[12px] text-dv-amethyst-text">{i + 1}</span>
                {pt(o.texto)}
              </button>
            ))}
          </div>
        )}
        {fase === 'chamada' && (
          <button type="button" onClick={() => setFase('ativo')} className="dv-focus mx-auto mb-2 flex min-h-12 items-center gap-2 px-5 font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-dv-text">
            Atender
          </button>
        )}
      </div>
    </div>
  )
}

function Caixa({ quem, children, onAvancar }: { quem: string | null; children: ReactNode; onAvancar: () => void }) {
  return (
    <section className="animate-dv-fade relative" style={{ '--dv-cut': '12px' } as CSSProperties}>
      <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--dv-amethyst-text-rgb)/0.55),rgba(186,176,159,0.25)_50%,rgb(var(--dv-amethyst-text-rgb)/0.4))]" />
      <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,rgba(24,23,30,0.96),rgb(var(--dv-ink-rgb)/0.97))]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      <div className="relative p-4 pb-3">
        {quem && <p className="dv-label mb-1.5 text-[10px] text-dv-amethyst-text">{quem} · Companhia de Despertados</p>}
        {children}
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={onAvancar} aria-label="Próxima fala" className="dv-focus grid size-11 place-items-center text-dv-text-2 hover:text-dv-text">
            <GlyphArrow className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export function HoloEstilos() {
  return (
    <style>{`
      .corp-holo-anel{animation:corp-anel 1.6s cubic-bezier(.16,1,.3,1) infinite}
      .corp-holo-pulse{animation:corp-pulse 3.6s ease-in-out infinite}
      .corp-holo-entra{animation:corp-entra 1.1s cubic-bezier(.16,1,.3,1) both;transform-origin:50% 100%}
      .corp-holo-tremor img{animation:corp-tremor 5.5s steps(1) infinite}
      .corp-holo-varre{animation:corp-varre 3.2s linear infinite}
      .corp-holo-fora{animation:corp-fora .7s cubic-bezier(.6,0,.9,.4) both}
      @keyframes corp-anel{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.25);opacity:0}}
      @keyframes corp-pulse{0%,100%{filter:drop-shadow(0 0 2px rgba(168,155,224,.3))}50%{filter:drop-shadow(0 0 9px rgba(168,155,224,.75))}}
      @keyframes corp-entra{0%{opacity:0;transform:scaleY(.02) scaleX(.6);filter:brightness(3)}45%{opacity:.9;transform:scaleY(1.04) scaleX(.98)}100%{opacity:1;transform:none;filter:none}}
      @keyframes corp-tremor{0%,100%{opacity:.85}31%{opacity:.68}32%{opacity:.85}67%{opacity:.75}68%{opacity:.85}}
      @keyframes corp-varre{0%{top:-20%}100%{top:110%}}
      @keyframes corp-fora{to{opacity:0;transform:scaleY(.96)}}
      @media (prefers-reduced-motion: reduce){.corp-holo-anel,.corp-holo-pulse,.corp-holo-tremor img,.corp-holo-varre{animation:none}.corp-holo-entra,.corp-holo-fora{animation-duration:.01s}}
    `}</style>
  )
}
