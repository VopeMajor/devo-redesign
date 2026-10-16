'use client'

import { useEffect } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { Stamp } from '../kit/stamp'
import type { SistemaDef } from './sistemas'

/**
 * Cerimônia de desbloqueio dos sistemas novos (mesmo padrão da revelação da Sala de Jogos — ArcadeUnlock):
 * raios atrás, filete de aço, emblemas entrando em sequência, selo "Liberado" e contagem. Toque fecha.
 */
export function CerimoniaDesbloqueio({ sistemas, onFim }: { sistemas: SistemaDef[]; onFim: () => void }) {
  const dur = 4200 + sistemas.length * 500
  useEffect(() => {
    playSfx('reveal')
    const s = window.setTimeout(() => playSfx('confirm'), 700)
    const ts = sistemas.map((_, i) => window.setTimeout(() => playSfx('card'), 900 + i * 260))
    const done = window.setTimeout(onFim, dur)
    return () => {
      window.clearTimeout(s)
      window.clearTimeout(done)
      ts.forEach((t) => window.clearTimeout(t))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const um = sistemas.length === 1
  return (
    <div
      role="alert"
      aria-label={`${um ? 'Novo sistema desbloqueado' : 'Novos sistemas desbloqueados'}: ${sistemas.map((s) => s.nome).join(', ')}`}
      className="fixed inset-0 z-[96] grid cursor-pointer place-items-center overflow-hidden bg-[color-mix(in_oklab,var(--dv-ink)_84%,transparent)] backdrop-blur-[3px] animate-dv-fade"
      onClick={onFim}
    >
      <span
        aria-hidden="true"
        className="en-rays pointer-events-none absolute left-1/2 top-[38%] -ml-[300px] -mt-[300px] size-[600px] opacity-55"
        style={{
          background: 'repeating-conic-gradient(color-mix(in oklab,var(--dv-gold-bright) 24%,transparent) 0 5deg, transparent 5deg 15deg)',
          WebkitMaskImage: 'radial-gradient(circle, #000 8%, transparent 48%)',
          maskImage: 'radial-gradient(circle, #000 8%, transparent 48%)',
        }}
      />
      <span aria-hidden="true" className="en-unlock-band absolute left-[-20%] top-[38%] h-[2px] w-[140%] bg-[linear-gradient(90deg,transparent,#6b6357_15%,#ece5d8_50%,#6b6357_85%,transparent)]" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        <p className="dv-label animate-dv-fade text-[12px] text-dv-gold-bright">{um ? 'Novo sistema desbloqueado' : 'Novos sistemas desbloqueados'}</p>

        <div className="relative flex items-end justify-center gap-4">
          {sistemas.map((s, i) => (
            <span key={s.id} className="en-icon-in flex flex-col items-center gap-2" style={{ animationDelay: `${350 + i * 260}ms` }}>
              <span className={`relative grid place-items-center ${um ? 'size-32' : 'size-20'}`}>
                <span aria-hidden="true" className="absolute inset-[-24%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--dv-amethyst)_16%,transparent),color-mix(in_oklab,var(--dv-gold-bright)_10%,transparent)_45%,transparent_70%)]" />
                <span aria-hidden="true" className="absolute inset-[6%] rounded-full border border-dv-gold/35" />
                <s.emblem metal className={`relative drop-shadow-[0_0_14px_color-mix(in_oklab,var(--dv-gold-bright)_40%,transparent)] ${um ? 'size-24' : 'size-14'}`} />
              </span>
              {!um && <span className="dv-label text-[10px] text-dv-text">{s.curto}</span>}
            </span>
          ))}
          <span className="absolute -right-12 top-2">
            <Stamp text="Liberado" tone="gold" size={84} rotate={-12} animate className="[animation-delay:1300ms]" />
          </span>
        </div>

        <h2 className="animate-dv-cut-in relative px-6 py-2 [animation-delay:700ms]">
          <span aria-hidden="true" className="absolute inset-0 -skew-x-[14deg] bg-[linear-gradient(90deg,color-mix(in_oklab,var(--dv-gold-deep)_35%,var(--dv-ink)),var(--dv-gold-deep)_45%,color-mix(in_oklab,var(--dv-gold-deep)_35%,var(--dv-ink)))] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <span className="absolute inset-x-0 top-0 h-px bg-dv-gold-bright/70" />
            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,#6b6357,#ece5d8_45%,#bab09f_70%,#6b6357)]" />
          </span>
          <span className={`relative block font-impact font-bold uppercase leading-[0.95] text-dv-text [text-shadow:0_2px_0_rgba(0,0,0,0.6)] ${um ? 'text-[44px]' : 'text-[34px]'}`}>
            {um ? sistemas[0].nome : 'O DEVO se abriu'}
          </span>
        </h2>

        <p className="animate-dv-rise max-w-xs font-body text-[16px] italic leading-relaxed text-dv-text-2 [animation-delay:1000ms]">
          {um ? 'Um novo ícone apareceu no menu do DEVO.' : 'Novos ícones apareceram no menu do DEVO. Explore com cuidado.'}
        </p>

        <div className="animate-dv-fade flex w-52 flex-col items-center gap-2.5 [animation-delay:1300ms]">
          <span aria-hidden="true" className="relative h-[2px] w-full bg-dv-line">
            <span className="en-countdown absolute inset-0 bg-dv-gold" style={{ animationDuration: `${dur}ms` }} />
          </span>
          <span className="dv-label text-[12px] text-dv-text-2">Toque para continuar</span>
        </div>
      </div>
    </div>
  )
}
