'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/*
 * A queda das crianças (ato I → "Com um simples acidente.").
 *
 * Uma sequência só, em dois golpes, com o vermelho nascendo do impacto (não um traço solto na tela):
 *   trip (1,7 s, sem texto): a tesoura do teatro desce num golpe sobre o chão de papel → no impacto
 *     (FALL_IMPACT_MS) o tranco, o clarão local e o CORTE: um rasgo vermelho que corre do ponto do
 *     golpe para os dois lados, sob os pés das crianças → a faixa de chão abaixo do corte dobra para
 *     dentro do escuro → as crianças perdem o apoio e pendem na borda.
 *   fall (fala "A fenda… os engoliu."): as duas escorregam para a escuridão, com rastro (cópias
 *     atrasadas = borrão de movimento) e riscos de velocidade; a câmera desce acompanhando (CAMERA em
 *     prologue-stage.tsx); a borda do corte esfria para um vermelho escuro.
 *
 * Tudo em CSS (keyframes `en-fall-*` em landing/entrada.css): transform/opacity, ≤ ~1,5 s por golpe.
 * O estado BASE de cada peça é o estado final, então com prefers-reduced-motion (animações desligadas
 * pelo entrada.css) a cena vira um corte seco: corte desenhado → crianças fora de quadro.
 * Coordenadas em % do palco do teatro (o mesmo `absolute inset-0` das marionetes, já sob a câmera).
 */

/** Momento do impacto da tesoura (ms desde o início do quadro `trip`): som, tranco e corte saem daqui. */
export const FALL_IMPACT_MS = 240

/** Altura do corte (topo, % do palco): logo acima dos pés das crianças (que pisam em bottom: 9%). */
export const CUT_Y = 89

/** Rasgo de papel: zigue-zague curto ao longo da linha do chão (x, desvio em y). */
const TEAR: [number, number][] = [
  [-10, 0.4], [4, -0.6], [12, 0.5], [21, -0.3], [29, 0.7], [37, -0.5], [44, 0.3], [50, -0.2], [56, 0.6], [63, -0.4],
  [71, 0.5], [79, -0.6], [87, 0.4], [95, -0.3], [110, 0.2],
]
const tearPts = TEAR.map(([x, dy]) => `${x}% ${CUT_Y + dy}%`)
const above = (shift: number) => `polygon(-10% -10%, 110% -10%, ${TEAR.map(([x, dy]) => `${x}% ${CUT_Y + dy + shift}%`).reverse().join(', ')})`
/** Parte de cima do cenário (fica): tudo acima do rasgo. */
export const CLIP_TOP = above(0)
/** Recorte das crianças: um pouco abaixo do rasgo (os sapatos pisam nele), para sumirem já dentro do vão. */
const CLIP_KIDS = above(2.4)
/** Faixa do chão abaixo do rasgo (cai). */
export const CLIP_BOTTOM = `polygon(${tearPts.join(', ')}, 110% 110%, -10% 110%)`

/** O rasgo em coordenadas do SVG (viewBox -10 0 120 100: cobre o palco com folga nas laterais). */
const CUT_PATH = TEAR.map(([x, dy], i) => `${i ? 'L' : 'M'}${x} ${CUT_Y + dy}`).join(' ')

/** Lascas de papel que saltam do impacto: [dx px, dy px, giro graus, tamanho px]. */
const FLECKS: [number, number, number, number][] = [
  [-46, -38, -140, 6], [-22, -58, 90, 4], [8, -66, -60, 5], [30, -50, 160, 4], [52, -30, -110, 6], [-64, -14, 70, 3], [70, -12, 120, 3],
]

/** Riscos de velocidade no vão durante a queda: [esquerda %, altura %, atraso ms]. */
const SPEED: [number, number, number][] = [
  [30, 9, 0], [38, 13, 120], [45, 8, 60], [52, 12, 200], [58, 10, 40], [64, 14, 160], [70, 9, 90],
]

const KIDS_BOX: CSSProperties = { left: '50%', bottom: '9%', height: 'min(60%, 72vw)', transform: 'translateX(-50%)' }

/** As crianças de mãos dadas (mesma caixa da marionete do teatro, para a troca não pular). */
function KidsSprite({ filter }: { filter: string }) {
  return <Image src="/images/prologue/kids-hands.webp" alt="" width={514} height={693} className="h-full w-auto max-w-none" style={{ filter }} />
}

export type FallPhase = 'trip' | 'fall'

/**
 * Atores da queda (vão, crianças, tesoura). Vai DENTRO da camada do teatro que recebe o filtro do
 * presságio (dessaturação), para casar com o cenário e com a marionete que ela substitui.
 */
export function FallActors({ phase, rim }: { phase: FallPhase; rim: string }) {
  const trip = phase === 'trip'
  return (
    <div data-fall={phase} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* O vão: escuro com a luz vermelha do corte escorrendo para dentro. */}
      <div
        className={trip ? 'en-fall-void absolute inset-x-0 bottom-[-10%]' : 'absolute inset-x-0 bottom-[-10%]'}
        style={{ top: `${CUT_Y}%`, background: 'linear-gradient(180deg, color-mix(in oklab, var(--dv-blood) 38%, #000) 0%, #120304 9%, #000 40%)' }}
      />

      {/* Riscos de velocidade no vão (só na queda). */}
      {!trip && (
        <div className="absolute inset-x-0 overflow-hidden" style={{ top: `${CUT_Y + 1}%`, height: '30%' }}>
          {SPEED.map(([left, h, delay], i) => (
            <span
              key={i}
              className="en-fall-speed absolute top-0 w-px bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--dv-text)_40%,transparent),transparent)]"
              style={{ left: `${left}%`, height: `${h * 4}%`, animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}

      {/* As crianças: pendem na borda no golpe; escorregam para o escuro na fala seguinte, com rastro.
          Recortadas pela linha do rasgo: o que passa da borda some dentro do vão (são engolidas). */}
      <div className="absolute inset-0 z-[2]" style={{ clipPath: CLIP_KIDS }}>
      <div className="absolute" style={KIDS_BOX}>
        {!trip &&
          [110, 55].map((lag, i) => (
            <div key={lag} className="en-fall-ghost absolute inset-0" style={{ animationDelay: `${lag}ms`, '--g': i ? 0.45 : 0.25 } as CSSProperties}>
              <div className="en-fall-kids h-full origin-bottom" style={{ animationDelay: `${lag}ms` }}>
                <KidsSprite filter="brightness(0.25) sepia(1) saturate(4) hue-rotate(-28deg) blur(2px)" />
              </div>
            </div>
          ))}
        <div className={trip ? 'en-fall-teeter relative h-full origin-bottom' : 'en-fall-kids relative h-full origin-bottom'}>
          <KidsSprite filter={`drop-shadow(4px 6px 0 rgba(40,22,18,0.4)) ${rim}`} />
        </div>
      </div>
      </div>

      {/* A tesoura: some do canto e desce num golpe só no centro, fecha as lâminas e recolhe. */}
      {trip && (
        <div className="absolute left-1/2 z-[3] h-[52%]" style={{ top: `${CUT_Y - 50.5}%` }}>
          <div className="en-fall-strike h-full origin-bottom">
            <Image src="/images/prologue/hand-scissors.png" alt="" width={312} height={718} className="h-full w-auto max-w-none" />
          </div>
        </div>
      )}

    </div>
  )
}

/** O vermelho da queda, FORA do filtro do presságio (fica vermelho de verdade): corte, clarão, lascas. */
export function FallCut({ phase }: { phase: FallPhase }) {
  const trip = phase === 'trip'
  return (
    <div data-fall={phase} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* O corte: nasce do ponto do golpe e corre para os dois lados; na queda, esfria na borda. */}
      {/* Revelado do centro para os lados por um recorte que se abre (en-fall-open), não por traço tracejado. */}
      <svg
        viewBox="-10 0 120 100"
        preserveAspectRatio="none"
        className={cn('absolute inset-y-0 -left-[10%] h-full w-[120%] overflow-visible', trip && 'en-fall-open')}
        style={{ filter: 'drop-shadow(0 0 3px rgba(255,70,84,1)) drop-shadow(0 0 12px rgba(224,40,58,0.9)) drop-shadow(0 0 28px rgba(170,20,32,0.8))' }}
      >
        <g className={trip ? undefined : 'en-fall-rim'}>
          <path d={CUT_PATH} fill="none" stroke="var(--dv-blood)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.55" />
          <path d={CUT_PATH} fill="none" stroke="#ff3a4c" strokeWidth="4" strokeLinejoin="bevel" vectorEffect="non-scaling-stroke" />
          {trip && <path d={CUT_PATH} fill="none" stroke="#fff3ee" strokeWidth="1.6" strokeLinejoin="bevel" vectorEffect="non-scaling-stroke" className="en-fall-core" />}
        </g>
      </svg>

      {/* Clarão e lascas no ponto do golpe. */}
      {trip && (
        <div className="absolute left-1/2" style={{ top: `${CUT_Y}%` }}>
          <span className="en-fall-burst absolute -left-[90px] -top-[90px] size-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,243,238,0.95),color-mix(in_oklab,var(--dv-blood)_80%,transparent)_28%,transparent_66%)]" />
          {FLECKS.map(([dx, dy, rot, size], i) => (
            <span
              key={i}
              className="en-fall-fleck absolute bg-[#efe6d4] shadow-[0_0_4px_rgba(224,40,58,0.8)]"
              style={{ width: size, height: size * 0.6, '--dx': `${dx}px`, '--dy': `${dy}px`, '--rot': `${rot}deg` } as CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  )
}
