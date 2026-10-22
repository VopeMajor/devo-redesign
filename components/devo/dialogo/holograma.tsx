'use client'

import { type CSSProperties, useId } from 'react'
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

/** Hexágono (ponta para cima) de raio r em volta de (32,32). */
const hex = (r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${i ? 'L' : 'M'}${(32 + Math.cos(a) * r).toFixed(2)} ${(32 + Math.sin(a) * r).toFixed(2)}`
  }).join('') + 'Z'

/**
 * Selo da Companhia de Despertados: olho desperto num hexágono de aço. Aro duplo com rebites nos vértices,
 * um anel de marcas (o relógio da Companhia), olho com íris raiada e a estrela do sigilo no alto.
 */
export function SeloCompanhia({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`aco${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="0.4" stopColor="#bab09f" />
          <stop offset="0.7" stopColor="#6b6357" />
          <stop offset="1" stopColor="#d6cdbd" />
        </linearGradient>
        <radialGradient id={`iris${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d9d2f5" />
          <stop offset="0.55" stopColor="#8a7cc8" />
          <stop offset="1" stopColor="#3b3366" />
        </radialGradient>
      </defs>
      {/* corpo escuro e aro duplo */}
      <path d={hex(29)} fill="#121116" stroke={`url(#aco${id})`} strokeWidth="2" strokeLinejoin="round" />
      <path d={hex(25.2)} stroke="#8a7cc8" strokeOpacity="0.6" strokeWidth="0.7" />
      {/* rebites nos vértices */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        return <circle key={i} cx={32 + Math.cos(a) * 27.2} cy={32 + Math.sin(a) * 27.2} r="1.1" fill={`url(#aco${id})`} />
      })}
      {/* anel de marcas */}
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} d={i % 6 === 0 ? 'M32 11.2v3.2' : 'M32 11.6v1.8'} stroke="#bab09f" strokeOpacity={i % 6 === 0 ? 0.9 : 0.45} strokeWidth={i % 6 === 0 ? 1.1 : 0.7} transform={`rotate(${i * 15} 32 32)`} />
      ))}
      {/* olho */}
      <path d="M15.5 33c4.6-6.6 10.1-9.8 16.5-9.8S43.9 26.4 48.5 33c-4.6 6.6-10.1 9.8-16.5 9.8S20.1 39.6 15.5 33Z" fill="#0b0a0e" stroke={`url(#aco${id})`} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="32" cy="33" r="6.2" fill={`url(#iris${id})`} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M32 28.2v-1.6" stroke="#ece5d8" strokeOpacity="0.5" strokeWidth="0.5" transform={`rotate(${i * 30} 32 33)`} />
      ))}
      <circle cx="32" cy="33" r="2.3" fill="#0b0a0e" />
      <circle cx="30.6" cy="31.6" r="0.9" fill="#fff" opacity="0.85" />
      {/* cílios-raios */}
      {[-36, -18, 0, 18, 36].map((a) => (
        <path key={a} d="M32 21.4v-2.6" stroke={`url(#aco${id})`} strokeWidth="1" strokeLinecap="round" transform={`rotate(${a} 32 33)`} />
      ))}
      {/* estrela do sigilo no alto */}
      <path d="M32 1.2 33.2 3.8 35.8 5 33.2 6.2 32 8.8 30.8 6.2 28.2 5 30.8 3.8Z" fill={`url(#aco${id})`} />
    </svg>
  )
}

/**
 * Sala da projeção (fundo da chamada): chão em grade com perspectiva, o mostrador da Companhia girando devagar
 * atrás da figura, cantoneiras e leituras de canal (HUD discreto), partículas subindo. Aço + ametista, sem neon.
 */
export function SalaHolograma({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const linhasChao = Array.from({ length: 15 }, (_, i) => -140 + i * 20)
  return (
    <div aria-hidden="true" className={cn('holo-root pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_68%,#1c1928,#0e0d12_58%,#060608)]" />
      {/* mostrador da Companhia */}
      <svg viewBox="0 0 200 200" className="holo-gira absolute left-1/2 top-[34%] w-[118%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.55]">
        <defs>
          <path id={`arco${id}`} d="M100 100m-84 0a84 84 0 1 1 168 0a84 84 0 1 1-168 0" />
        </defs>
        <circle cx="100" cy="100" r="96" stroke="#bab09f" strokeOpacity="0.22" strokeWidth="0.6" fill="none" />
        <circle cx="100" cy="100" r="78" stroke="#8a7cc8" strokeOpacity="0.28" strokeWidth="0.5" fill="none" />
        <circle cx="100" cy="100" r="60" stroke="#bab09f" strokeOpacity="0.12" strokeWidth="0.5" fill="none" strokeDasharray="1 3" />
        {Array.from({ length: 72 }, (_, i) => (
          <path key={i} d={i % 6 === 0 ? 'M100 4v7' : 'M100 4v3'} stroke="#d6cdbd" strokeOpacity={i % 6 === 0 ? 0.45 : 0.2} strokeWidth={i % 6 === 0 ? 0.8 : 0.5} transform={`rotate(${i * 5} 100 100)`} />
        ))}
        <text fill="#bab09f" fillOpacity="0.35" fontSize="5.2" letterSpacing="2.4" fontFamily="var(--font-mono), monospace">
          <textPath href={`#arco${id}`}>COMPANHIA DE DESPERTADOS · CANAL SEGURO · REGISTRO DE RECORDS · COMPANHIA DE DESPERTADOS · CANAL SEGURO ·</textPath>
        </text>
      </svg>
      {/* chão em grade, fugindo para o horizonte */}
      <svg viewBox="-150 0 300 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[40%] w-full [mask-image:linear-gradient(0deg,#000_30%,transparent)]">
        {linhasChao.map((x) => (
          <path key={x} d={`M${x * 0.12} 0L${x * 1.6} 100`} stroke="#8a7cc8" strokeOpacity="0.28" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        ))}
        {[3, 9, 18, 31, 48, 70, 97].map((y) => (
          <path key={y} d={`M-150 ${y}H150`} stroke="#bab09f" strokeOpacity={0.08 + y / 500} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span className="absolute inset-x-0 bottom-[40%] h-px bg-[linear-gradient(90deg,transparent,rgba(186,176,159,0.3),transparent)]" />
      {/* partículas */}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="holo-sobe absolute bottom-[18%] size-[2px] rounded-full bg-[#d9d2f5]"
          style={{ left: `${12 + ((i * 37) % 76)}%`, animationDelay: `${(i * 0.73) % 6}s`, animationDuration: `${5 + (i % 4)}s`, opacity: 0.5 }}
        />
      ))}
      {/* cantoneiras e leituras */}
      {(['left-3 top-[12%]', 'right-3 top-[12%] rotate-90', 'left-3 bottom-[34%] -rotate-90', 'right-3 bottom-[34%] rotate-180'] as const).map((c) => (
        <svg key={c} viewBox="0 0 20 20" className={cn('absolute size-5', c)}>
          <path d="M1 14V1H14" stroke="#bab09f" strokeOpacity="0.5" strokeWidth="1" fill="none" />
        </svg>
      ))}
      <span className="absolute left-9 top-[12.4%] font-mono text-[9px] uppercase tracking-[0.22em] text-[#bab09f]/55">Canal 07 · seguro</span>
      <span className="absolute right-9 top-[12.4%] flex items-end gap-[2px]">
        {[3, 5, 7, 9].map((h, i) => (
          <span key={h} className="holo-sinal w-[3px] bg-[#b9b0e6]/70" style={{ height: h, animationDelay: `${i * 0.18}s` }} />
        ))}
      </span>
      <HoloStyles />
    </div>
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
        <svg aria-hidden="true" viewBox="0 0 100 100" className="holo-gira absolute -inset-3">
          <circle cx="50" cy="50" r="47" fill="none" stroke="#bab09f" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1.5 5" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="#8a7cc8" strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="22 8" />
        </svg>
        <SeloCompanhia className="holo-buzz relative size-16 drop-shadow-[0_0_10px_rgba(168,155,224,0.45)]" />
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <span className="dv-label text-[10px] text-dv-amethyst-text">Chamada holográfica · conectando<span className="holo-pontos" /></span>
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
      .holo-gira{animation:holo-gira 90s linear infinite}
      .holo-sobe{animation:holo-sobe 6s linear infinite}
      .holo-sinal{animation:holo-sinal 1.6s ease-in-out infinite}
      .holo-pontos::after{content:'';animation:holo-pontos 1.4s steps(4) infinite}
      @keyframes holo-gira{to{transform:rotate(360deg)}}
      @keyframes holo-sobe{0%{transform:translateY(0);opacity:0}15%{opacity:.6}100%{transform:translateY(-38vh);opacity:0}}
      @keyframes holo-sinal{0%,100%{opacity:.35}50%{opacity:1}}
      @keyframes holo-pontos{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
      @keyframes holo-ring{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.25);opacity:0}}
      @keyframes holo-buzz{0%,60%,100%{transform:rotate(0)}64%{transform:rotate(-4deg)}68%{transform:rotate(4deg)}72%{transform:rotate(-3deg)}76%{transform:rotate(2deg)}}
      @keyframes holo-in{0%{opacity:0;transform:scaleY(.02) scaleX(.6);filter:brightness(3)}45%{opacity:.9;transform:scaleY(1.04) scaleX(.98)}100%{opacity:1;transform:none;filter:none}}
      @keyframes holo-out{0%{opacity:1;transform:none}60%{opacity:.8;transform:scaleY(.04) scaleX(1.02);filter:brightness(2.5)}100%{opacity:0;transform:scaleY(0) scaleX(.2)}}
      @keyframes holo-flicker{0%,100%{opacity:1}31%{opacity:.82}32%{opacity:1}67%{opacity:.9}68%{opacity:1}}
      @keyframes holo-sweep{0%{top:-20%}100%{top:110%}}
      .holo-in,.holo-out{transform-origin:50% 100%}
      @media (prefers-reduced-motion: reduce){.holo-ring,.holo-buzz,.holo-flicker,.holo-sweep,.holo-gira,.holo-sobe,.holo-sinal,.holo-pontos::after{animation:none}.holo-in,.holo-out{animation-duration:.01s}}
    `}</style>
  )
}
