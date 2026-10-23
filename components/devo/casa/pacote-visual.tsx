'use client'

import type { CSSProperties } from 'react'
import { getPacote } from '@/lib/devo/pacotes'
import { cn } from '@/lib/utils'

/**
 * Pacote lacrado (visual do item). Envelope alto com as pontas de alumínio serrilhadas, a arte da coleção na
 * frente, faixa com o nome, selo de raridade e um reflexo que atravessa a embalagem. `rasgando` arranca a tira
 * de cima (animação da abertura). A arte vem de `public/images/pacotes/<id>/arte-{384,768}.webp`.
 */
const arteDe = (id: string) => ({ src: `/images/pacotes/${id}/arte-384.webp`, srcSet: `/images/pacotes/${id}/arte-384.webp 384w, /images/pacotes/${id}/arte-768.webp 768w` })
const ARTE: Record<string, { src: string; srcSet: string }> = {
  xadrez: arteDe('xadrez'),
  iniciante: arteDe('iniciante'),
  intermediario: arteDe('intermediario'),
  presente: arteDe('presente'),
}

/** Serrilhado: dentes ao longo de uma borda (25 dentes, profundidade em % da altura do elemento). */
const dentes = (y0: number, y1: number, invertido = false) =>
  Array.from({ length: 26 }, (_, i) => {
    const x = invertido ? 100 - i * 4 : i * 4
    return `${x}% ${i % 2 ? y1 : y0}%`
  }).join(', ')
/** Tira de cima: serra no topo. */
const CLIP_TIRA = `polygon(${dentes(0, 14)}, 100% 100%, 0% 100%)`
/** Corpo: serra na base. */
const CLIP_CORPO = `polygon(0% 0%, 100% 0%, ${dentes(100, 97.5, true)})`

export function PacoteVisual({
  id,
  colecao,
  raro,
  rasgando = false,
  className,
  style,
}: {
  id: string
  /** Nome grande no envelope (padrão: a coleção do pacote, ou o nome dele). */
  colecao?: string
  raro?: boolean
  rasgando?: boolean
  className?: string
  style?: CSSProperties
}) {
  const arte = ARTE[id]
  const def = getPacote(id)
  const titulo = colecao || def?.colecao || def?.nome.replace(/^Pacote /, '') || ''
  const selo = def?.selo ?? 'Pacote · Coleção'
  const ehRaro = raro ?? def?.raro ?? true
  return (
    <div className={cn('pv-raiz relative aspect-[5/8] [container-type:inline-size]', className)} style={style} aria-hidden="true">
      <style>{PV_CSS}</style>
      {/* sombra no chão */}
      <span className="absolute inset-x-[8%] -bottom-[3%] h-[6%] rounded-[50%] bg-black/70 blur-md" />
      <div className="pv-corpo absolute inset-0 drop-shadow-[0_14px_22px_rgba(0,0,0,0.65)]">
        {/* tira de cima (a que rasga) */}
        <div className={cn('absolute inset-x-0 top-0 h-[11%] origin-[0%_100%]', rasgando && 'pv-rasga')} style={{ clipPath: CLIP_TIRA }}>
          <Folha />
          <span className="absolute inset-x-0 bottom-0 h-px border-b border-dashed border-black/50" />
        </div>
        {/* corpo */}
        <div className="absolute inset-x-0 bottom-0 top-[11%]" style={{ clipPath: CLIP_CORPO }}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#1b1824,#0e0d12)]" />
          {/* arte */}
          <div className="absolute inset-x-[6%] bottom-[18%] top-[3%] overflow-hidden shadow-[inset_0_0_0_1px_rgba(214,205,189,0.5)]">
            {arte ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={arte.src} srcSet={arte.srcSet} sizes="200px" alt="" className="size-full object-cover object-[50%_35%]" />
            ) : (
              <div className="size-full bg-[radial-gradient(circle_at_50%_40%,#3a2f63,#0e0d12)]" />
            )}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,18,0.1)_40%,rgba(14,13,18,0.9))]" />
            {/* selo de raridade no alto */}
            {ehRaro && (
              <span className="absolute left-1/2 top-[4%] flex -translate-x-1/2 items-center gap-[1.5cqw] bg-[rgba(14,13,18,0.75)] px-[3cqw] py-[1.2cqw] font-mono text-[4.2cqw] uppercase tracking-[0.2em] text-[#d9d2f5] shadow-[inset_0_0_0_1px_rgba(185,174,234,0.7)]">
                <span className="size-[2.4cqw] rotate-45 bg-[#b9aeea] shadow-[0_0_6px_#b9aeea]" />
                Raro
              </span>
            )}
          </div>
          {/* faixa do nome */}
          <div className="absolute inset-x-0 bottom-[5%] flex h-[12%] flex-col items-center justify-center">
            <span className="font-mono text-[3.6cqw] uppercase tracking-[0.3em] text-[#9a9184]">{selo}</span>
            <span className={cn('mt-[0.6cqw] font-display font-semibold uppercase leading-none tracking-[0.1em] text-[#f4efe6]', titulo.length > 9 ? 'text-[7cqw]' : 'text-[9cqw]')}>{titulo}</span>
          </div>
          {/* ponta de alumínio de baixo */}
          <span className="absolute inset-x-0 bottom-0 h-[4.5%] overflow-hidden">
            <Folha />
          </span>
          {/* reflexo de alumínio */}
          <span className="pv-brilho absolute inset-0 mix-blend-screen" />
          {/* vincos do envelope */}
          <span className="absolute inset-y-0 left-[3%] w-px bg-white/10" />
          <span className="absolute inset-y-0 right-[3%] w-px bg-black/40" />
        </div>
      </div>
    </div>
  )
}

/** Alumínio escovado das pontas. */
function Folha() {
  return (
    <span className="absolute inset-0 bg-[linear-gradient(90deg,#6b6357,#d6cdbd_18%,#9a9184_35%,#f4efe6_52%,#8a8278_70%,#d6cdbd_86%,#6b6357)]">
      <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_3px)]" />
    </span>
  )
}

const PV_CSS = `
.pv-brilho{background:linear-gradient(105deg,transparent 35%,rgba(244,239,230,.28) 48%,rgba(185,174,234,.22) 52%,transparent 65%);background-size:300% 100%;animation:pv-brilho 5s ease-in-out infinite}
.pv-raiz:hover .pv-corpo{transform:translateY(-2%) rotate(-1deg)}
.pv-corpo{transition:transform .35s cubic-bezier(.16,1,.3,1)}
.pv-rasga{animation:pv-rasga .7s cubic-bezier(.5,0,.75,0) forwards}
@keyframes pv-brilho{0%{background-position:150% 0}60%,100%{background-position:-50% 0}}
@keyframes pv-rasga{0%{transform:none}30%{transform:rotate(-6deg) translateY(-6%)}100%{transform:translate(70%,-160%) rotate(-38deg);opacity:0}}
@media (prefers-reduced-motion: reduce){.pv-brilho{animation:none}.pv-rasga{animation-duration:.01s}}
`
