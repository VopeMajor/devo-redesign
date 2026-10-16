'use client'

import type { CSSProperties } from 'react'
import { npcPortrait } from '@/lib/devo/npcs'
import type { HoloFase } from '@/lib/devo/dialogo/formato'
import { cn } from '@/lib/utils'

/**
 * HOLOGRAMA DA MELISSA — Companhia de Despertados. Luz fria e discreta (aço + ametista; nada de azul neon),
 * linhas de varredura finas, leve tremulação. Use SEMPRE que o assunto for a Companhia:
 * - `<SeloCompanhia />`: o ícone da Companhia (chamada chegando, avisos);
 * - `<ChamadaMelissa />`: o ícone tocando (anéis) — antes da projeção;
 * - `<HologramaMelissa fase expressao />`: a projeção (materializa → ativo → encerra).
 * Respeita `prefers-reduced-motion` (sem tremulação nem varredura).
 */

/** Selo da Companhia de Despertados: olho desperto num hexágono de aço. */
export function SeloCompanhia({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cia-aco" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.45" stopColor="#bab09f" />
          <stop offset="1" stopColor="#6b6357" />
        </linearGradient>
      </defs>
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29Z" stroke="url(#cia-aco)" strokeWidth="1.6" />
      <path d="M32 9 52 20.5v23L32 55 12 43.5v-23Z" stroke="#8a7cc8" strokeOpacity="0.55" strokeWidth="0.8" />
      <path d="M14 32c5-7.5 11-11 18-11s13 3.5 18 11c-5 7.5-11 11-18 11s-13-3.5-18-11Z" stroke="url(#cia-aco)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="5.5" fill="url(#cia-aco)" />
      <circle cx="32" cy="32" r="2" fill="#151517" />
      {[-40, -20, 0, 20, 40].map((a) => (
        <path key={a} d="M32 14v-4" stroke="#bab09f" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${a} 32 32)`} />
      ))}
    </svg>
  )
}

/** Chamada holográfica chegando: o selo vibra entre anéis de luz fria. */
export function ChamadaMelissa({ className, label = 'Companhia de Despertados' }: { className?: string; label?: string }) {
  return (
    <div role="status" aria-label={`Chamada holográfica: ${label}`} className={cn('holo-root flex flex-col items-center gap-3', className)}>
      <span className="relative grid size-28 place-items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true" className="holo-ring absolute inset-0 rounded-full border border-[#a89be0]/50" style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
        <span aria-hidden="true" className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(168,155,224,0.22),rgba(186,176,159,0.08)_55%,transparent_72%)]" />
        <SeloCompanhia className="holo-buzz relative size-16 drop-shadow-[0_0_10px_rgba(168,155,224,0.45)]" />
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <span className="dv-label text-[10px] text-dv-amethyst-text">Chamada holográfica</span>
        <span className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-dv-text">{label}</span>
      </span>
      <HoloStyles />
    </div>
  )
}

/** A projeção da Melissa sobre um emissor (o celular do jogador). */
export function HologramaMelissa({ fase, expressao, className }: { fase: Exclude<HoloFase, null>; expressao?: string; className?: string }) {
  const art = npcPortrait('melissa', expressao)
  const on = fase === 'materializa' || fase === 'ativo'
  return (
    <div aria-hidden="true" className={cn('holo-root pointer-events-none relative h-full w-full', className)}>
      {/* Cone de luz fria saindo do emissor (embaixo). */}
      <span
        className={cn('absolute inset-x-0 bottom-[6%] top-[4%] transition-opacity duration-700', on ? 'opacity-100' : 'opacity-0')}
        style={{
          background: 'linear-gradient(0deg, rgba(168,155,224,0.30), rgba(186,176,159,0.10) 45%, transparent 85%)',
          clipPath: 'polygon(46% 100%, 54% 100%, 92% 0, 8% 0)',
        }}
      />
      {/* Figura projetada: aço/ametista, sem cor de pele, com varredura e tremulação. */}
      <div className={cn('absolute inset-x-[8%] bottom-[9%] top-[2%]', fase === 'materializa' && 'holo-in', fase === 'encerra' && 'holo-out', fase === 'ativo' && 'holo-flicker', fase === 'chamada' && 'opacity-0')}>
        {art ? (
          <span
            className="absolute inset-0"
            style={{
              // Tudo recortado pela silhueta do próprio sprite: a luz fria só existe onde há figura.
              WebkitMaskImage: `linear-gradient(0deg, transparent 0%, #000 22%), url(${art.src})`,
              maskImage: `linear-gradient(0deg, transparent 0%, #000 22%), url(${art.src})`,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
              WebkitMaskSize: '100% 100%, contain',
              maskSize: '100% 100%, contain',
              WebkitMaskPosition: 'center, bottom',
              maskPosition: 'center, bottom',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.src} alt="" className="size-full object-contain object-bottom opacity-80 [filter:grayscale(1)_brightness(1.2)_contrast(1.05)]" />
            <span className="absolute inset-0 mix-blend-color" style={{ background: 'linear-gradient(180deg,#b9b0e6,#8a7cc8 60%,#6b6357)' }} />
            <span className="holo-scan absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: 'repeating-linear-gradient(0deg, rgba(236,229,216,0.35) 0 1px, transparent 1px 4px)' }} />
            <span className="holo-sweep absolute inset-x-0 h-1/5" style={{ background: 'linear-gradient(180deg, transparent, rgba(236,229,216,0.22), transparent)' }} />
          </span>
        ) : null}
        <span className="absolute inset-x-[20%] bottom-0 h-1/3 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(168,155,224,0.28),transparent)] [filter:blur(6px)]" />
      </div>
      {/* Emissor: o celular do jogador, tela acesa. */}
      <span className="absolute bottom-[3%] left-1/2 h-[6%] w-[30%] -translate-x-1/2">
        <span className="absolute inset-0 skew-x-[-12deg] bg-[linear-gradient(180deg,#1f1f22,#0c0c0e)] shadow-[inset_0_0_0_1px_rgba(186,176,159,0.5)]" />
        <span className={cn('absolute inset-x-[12%] top-[18%] h-[30%] skew-x-[-12deg] transition-colors duration-500', on || fase === 'chamada' ? 'bg-[#b9b0e6]/70 shadow-[0_0_18px_rgba(168,155,224,0.7)]' : 'bg-[#2a2a2e]')} />
      </span>
      <HoloStyles />
    </div>
  )
}

function HoloStyles() {
  return (
    <style>{`
      .holo-ring{animation:holo-ring 1.8s cubic-bezier(.16,1,.3,1) infinite}
      .holo-buzz{animation:holo-buzz 1.8s ease-in-out infinite}
      .holo-in{animation:holo-in 1.2s cubic-bezier(.16,1,.3,1) both}
      .holo-out{animation:holo-out .9s cubic-bezier(.6,0,.9,.4) both}
      .holo-flicker{animation:holo-flicker 5.5s steps(1) infinite}
      .holo-sweep{animation:holo-sweep 3.2s linear infinite}
      @keyframes holo-ring{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.25);opacity:0}}
      @keyframes holo-buzz{0%,60%,100%{transform:rotate(0)}64%{transform:rotate(-4deg)}68%{transform:rotate(4deg)}72%{transform:rotate(-3deg)}76%{transform:rotate(2deg)}}
      @keyframes holo-in{0%{opacity:0;transform:scaleY(.02) scaleX(.6);filter:brightness(3)}45%{opacity:.9;transform:scaleY(1.04) scaleX(.98)}100%{opacity:1;transform:none;filter:none}}
      @keyframes holo-out{0%{opacity:1;transform:none}60%{opacity:.8;transform:scaleY(.04) scaleX(1.02);filter:brightness(2.5)}100%{opacity:0;transform:scaleY(0) scaleX(.2)}}
      @keyframes holo-flicker{0%,100%{opacity:1}31%{opacity:.82}32%{opacity:1}67%{opacity:.9}68%{opacity:1}}
      @keyframes holo-sweep{0%{top:-20%}100%{top:110%}}
      .holo-in,.holo-out{transform-origin:50% 100%}
      @media (prefers-reduced-motion: reduce){.holo-ring,.holo-buzz,.holo-flicker,.holo-sweep{animation:none}.holo-in,.holo-out{animation-duration:.01s}}
    `}</style>
  )
}
