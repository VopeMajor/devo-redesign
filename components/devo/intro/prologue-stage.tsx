'use client'

import Image from 'next/image'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { MelissaMood, StageId } from '@/lib/devo/prologue-script'
import { cn } from '@/lib/utils'
import { PortraitFrame } from '../kit/portrait'
import { MelissaArt } from '../npc-art/melissa'
import { DeadlyVoteSymbol } from '../system/symbol'
import { Embers } from '../shared/atmosphere'
import { CelFire } from './cel-fire'

const THEATER: StageId[] = ['rumor', 'kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall']
const KIDS: StageId[] = ['kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall']
const TOGETHER: StageId[] = ['hands', 'omen', 'trip', 'fall']
const TRANSITION = 'left 2.4s cubic-bezier(.3,.7,.3,1), bottom 1.2s ease-in, transform 1s ease, opacity .8s ease, filter .8s ease'

function Puppet({
  src,
  w,
  h,
  style,
  swayDelay = '0s',
  alt = '',
  priority,
}: {
  src: string
  w: number
  h: number
  style: CSSProperties
  swayDelay?: string
  alt?: string
  priority?: boolean
}) {
  return (
    <div className="absolute origin-bottom" style={{ transition: TRANSITION, ...style }}>
      <div className="h-full origin-bottom animate-[pr-sway_3.2s_ease-in-out_infinite]" style={{ animationDelay: swayDelay }}>
        <div className="h-full animate-[pr-bob_1.6s_ease-in-out_infinite]" style={{ animationDelay: swayDelay }}>
          <Image
            src={src}
            alt={alt}
            width={w}
            height={h}
            priority={priority}
            className="h-full w-auto max-w-none drop-shadow-[4px_6px_0_rgba(40,22,18,0.4)]"
            style={{ filter: RIM_GOLD }}
          />
        </div>
      </div>
    </div>
  )
}

const CRACK_LINE = 'M0 30 L38 29 L62 34 L96 25 L128 33 L158 26 L184 32 L200 28 L222 35 L250 24 L280 33 L310 27 L338 34 L366 28 L400 30'
const CHASM =
  'M0 30 L38 26 L62 22 L96 12 L128 18 L158 6 L184 14 L200 2 L222 12 L250 4 L280 16 L310 10 L338 22 L366 25 L400 30 L366 35 L338 42 L310 50 L280 46 L250 58 L222 52 L200 60 L184 50 L158 56 L128 44 L96 48 L62 38 L38 34 Z'

/** Rachadura no chão do teatro: primeiro risca o papel, depois se abre em fenda. */
function FloorCrack({ cracked, open }: { cracked: boolean; open: boolean }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="absolute bottom-[2%] left-1/2 h-[16%] w-[78%] -translate-x-1/2 overflow-visible"
      style={{ opacity: cracked ? 1 : 0 }}
    >
      <defs>
        <radialGradient id="pr-chasm" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="75%" stopColor="#050203" />
          <stop offset="100%" stopColor="#3a0a0e" />
        </radialGradient>
      </defs>
      <g
        className="origin-center transition-transform duration-[900ms] ease-[cubic-bezier(.6,0,.3,1.2)]"
        style={{ transform: `scaleY(${open ? 1 : 0.04})`, transformBox: 'fill-box' }}
      >
        <path d={CHASM} fill="url(#pr-chasm)" stroke="#1a0a08" strokeWidth="1.5" />
      </g>
      {cracked && (
        <path
          d={CRACK_LINE}
          fill="none"
          stroke="#160806"
          strokeWidth="2.5"
          strokeLinejoin="bevel"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray="1"
          className="animate-[pr-crack_0.7s_0.15s_ease-out_both]"
          style={{ opacity: open ? 0 : 1, transition: 'opacity .4s ease' }}
        />
      )}
    </svg>
  )
}

function Layer({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 transition-opacity duration-[1200ms]', on ? 'opacity-100' : 'opacity-0', className)}>
      {children}
    </div>
  )
}

/** Parallax pelo ponteiro (desktop): camadas longe/perto andam em sentidos opostos (vars --px/--py, −1..1). */
function usePointerParallax() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])
  return ref
}

const FAR: CSSProperties = { transform: 'translate3d(calc(var(--px, 0) * -10px), calc(var(--py, 0) * -6px), 0)', transition: 'transform 600ms var(--dv-ease-out)' }
const NEAR: CSSProperties = { transform: 'translate3d(calc(var(--px, 0) * 18px), calc(var(--py, 0) * 8px), 0)', transition: 'transform 600ms var(--dv-ease-out)' }

/** Presença da Melissa: fora, silhueta se aproximando, ou em cena. */
export type MelissaPresence = 'off' | 'approach' | 'on'

/** Luz de borda comum do elenco (mesma do PortraitFrame do kit): contorno claro + halo. */
const RIM_GOLD = 'drop-shadow(-1.5px -1px 0 rgba(236,212,154,0.5)) drop-shadow(0 0 12px rgba(236,212,154,0.22))'

export function PrologueStage({
  stage,
  mood,
  speaking = false,
  melissa = 'off',
  opening = false,
}: {
  stage: StageId
  mood: MelissaMood
  speaking?: boolean
  melissa?: MelissaPresence
  /** Primeiro quadro do prólogo: pálpebras abrindo sobre o sigilo. */
  opening?: boolean
}) {
  const root = usePointerParallax()
  const melissaRef = useRef<HTMLDivElement>(null)
  const prevMood = useRef(mood)
  // Troca de expressão: além do cross-fade, um "respiro" curto do retrato.
  useEffect(() => {
    if (prevMood.current === mood) return
    prevMood.current = mood
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    melissaRef.current?.animate?.([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-6px) scale(1.012)' }, { transform: 'translateY(0) scale(1)' }], {
      duration: 380,
      easing: 'cubic-bezier(0.16,1,0.3,1)',
    })
  }, [mood])

  const theater = THEATER.includes(stage)
  const kids = KIDS.includes(stage)
  const together = TOGETHER.includes(stage)
  const fallen = stage === 'fall'
  const tripped = stage === 'trip'
  const omen = stage === 'omen' || tripped || fallen
  const deathOn = stage === 'death' || stage === 'fire'
  const fireOn = stage === 'fire' || stage === 'rise'
  const melissaOn = stage === 'mine' && melissa !== 'off'
  const mineOn = stage === 'mine' || stage === 'phone'
  const mirrorOn = stage === 'void' || stage === 'voice'

  const focus = (who: 'boy' | 'girl') =>
    stage === 'boy' ? (who === 'boy' ? 1.12 : 0.92) : stage === 'girl' ? (who === 'girl' ? 1.12 : 0.92) : 1
  const dim = (who: 'boy' | 'girl') => (stage === 'boy' && who === 'girl') || (stage === 'girl' && who === 'boy')
  const solo = (who: 'boy' | 'girl') => ({
    opacity: together ? 0 : dim(who) ? 0.45 : 1,
    filter: dim(who) ? 'grayscale(1) brightness(0.7)' : 'none',
    transform: `scale(${focus(who)})`,
  })

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden bg-black">
      {/* Escuridão / vazio: o sigilo acende devagar no fundo, poeira na luz que cai do alto. */}
      <Layer on={stage === 'dark' || stage === 'void' || stage === 'voice'}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(125,151,255,0.22),transparent_70%),radial-gradient(80%_60%_at_50%_42%,rgba(11,26,77,0.7),rgba(2,3,7,1)_75%)]" />
        <div className="absolute inset-x-[22%] top-0 h-[70%] bg-[linear-gradient(180deg,rgba(236,238,242,0.12),transparent)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)] blur-md" />
        <div className="absolute left-1/2 top-[34%] size-[min(64vw,280px)] -translate-x-1/2 -translate-y-1/2" style={NEAR}>
          <svg viewBox="0 0 200 200" aria-hidden="true" className="en-sweep-hand-slow absolute inset-0 size-full text-dv-gold" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="96" strokeWidth="0.6" opacity="0.4" />
            <ellipse cx="100" cy="100" rx="96" ry="34" strokeWidth="0.7" opacity="0.35" strokeDasharray="2 5" />
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i / 60) * Math.PI * 2
              const r1 = i % 5 === 0 ? 84 : 88
              return <line key={i} x1={100 + Math.sin(a) * r1} y1={100 - Math.cos(a) * r1} x2={100 + Math.sin(a) * 92} y2={100 - Math.cos(a) * 92} strokeWidth={i % 5 === 0 ? 1.2 : 0.5} opacity="0.5" />
            })}
          </svg>
          <div className="en-ignite absolute inset-[26%] text-dv-text">
            <DeadlyVoteSymbol variant="mark" className="size-full drop-shadow-[0_0_24px_rgba(49,93,255,0.9)]" />
          </div>
        </div>
        <Embers className="opacity-70" />
      </Layer>

      {/* Teatro de papel */}
      <Layer on={theater}>
        <div
          className={cn('absolute inset-0 transition-[filter] duration-1000', tripped && 'animate-[pr-shake_0.6s_ease-out_both]')}
          style={{ filter: omen ? 'grayscale(0.75) sepia(0.3) contrast(1.15) brightness(0.75)' : 'none' }}
        >
          <div className="absolute -inset-[4%]" style={FAR}>
            <div className="en-cam-far absolute inset-0">
              <Image src="/images/prologue/wallpaper.webp" alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
          </div>

          <Puppet
            src="/images/prologue/girl.webp"
            w={312}
            h={706}
            alt="A irmã, de laços vermelhos e vestido azul"
            priority
            style={{ left: kids ? '27%' : '-30%', bottom: '9%', height: 'min(60%, 72vw)', ...solo('girl') }}
          />
          <Puppet
            src="/images/prologue/boy.webp"
            w={242}
            h={705}
            alt="O irmão caçula, de boina e roupa de marinheiro"
            swayDelay="-1.1s"
            style={{ left: kids ? '58%' : '115%', bottom: '9%', height: 'min(55%, 66vw)', ...solo('boy') }}
          />
          <Puppet
            src="/images/prologue/kids-hands.webp"
            w={514}
            h={693}
            alt="Os dois irmãos de mãos dadas"
            swayDelay="-0.6s"
            style={{
              left: '50%',
              bottom: fallen ? '-90%' : '9%',
              height: 'min(60%, 72vw)',
              opacity: together ? 1 : 0,
              transform: `translateX(-50%) rotate(${tripped ? -12 : fallen ? 35 : 0}deg)`,
              transitionDelay: fallen ? '0.9s' : '0s',
            }}
          />

          <FloorCrack cracked={tripped || fallen} open={fallen} />
          <div
            className="absolute left-[18%] h-[52%] transition-[top] duration-[1600ms] ease-out"
            style={{ top: omen ? '-12%' : '-75%' }}
          >
            <div className="h-full origin-top animate-[pr-dangle_3s_ease-in-out_infinite]">
              <Image src="/images/prologue/hand-scissors.png" alt="" width={312} height={718} className="h-full w-auto max-w-none" />
            </div>
          </div>
        </div>
        {tripped && <div className="absolute inset-0 animate-[pr-flash_0.9s_ease-out_both] bg-[#7a0c12]" />}
      </Layer>

      {/* A morte */}
      <Layer on={deathOn || stage === 'abyss'}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_55%_at_50%_55%,rgba(239,228,210,0.14),transparent_70%)]" />
        <div
          className="absolute left-1/2 h-[66%] -translate-x-1/2 transition-[bottom,opacity] duration-[1800ms] ease-out"
          style={{ bottom: deathOn ? '12%' : '-60%', opacity: deathOn ? 1 : 0 }}
        >
          <div className="h-full origin-bottom animate-[pr-sway_6s_ease-in-out_infinite]">
            <Image src="/images/prologue/death.webp" alt="A Morte estendendo a mão" width={469} height={717} className="h-full w-auto max-w-none" style={{ filter: `${RIM_GOLD} drop-shadow(0 0 40px rgba(0,0,0,0.9))` }} />
          </div>
        </div>
      </Layer>

      {/* Quem se reergueu */}
      <Layer on={stage === 'rise'}>
        <div
          className="absolute left-1/2 h-[46%] -translate-x-1/2 transition-[bottom] duration-[3000ms] ease-out"
          style={{ bottom: stage === 'rise' ? '16%' : '-50%' }}
        >
          <Image src="/images/prologue/girl.webp" alt="Uma silhueta pequena se levanta" width={312} height={706} className="h-full w-auto max-w-none brightness-0" />
        </div>
      </Layer>
      <Layer on={fireOn} className="pointer-events-none">
        <CelFire className={cn('h-[58%] transition-transform duration-[1400ms] ease-out', fireOn ? 'translate-y-0' : 'translate-y-full')} />
        <div className="absolute inset-0 animate-[devo-flicker_0.4s_steps(2)_infinite] bg-[#ff5a1f]/10 mix-blend-screen" />
        <Embers className="opacity-90" />
      </Layer>

      {/* O espelho e a voz */}
      <Layer on={mirrorOn}>
        <video
          src="/videos/mirror.mp4"
          autoPlay
          muted
          loop
          playsInline
          className={cn('absolute inset-0 size-full object-contain mix-blend-screen transition-[filter,opacity] duration-1000', stage === 'voice' ? 'opacity-40 blur-[2px]' : 'opacity-90')}
        />
      </Layer>
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[72dvh] transition-[opacity,transform,filter] duration-[1600ms] ease-out',
          stage === 'voice' ? 'translate-y-0 opacity-100 blur-0' : 'pointer-events-none translate-y-6 opacity-0 blur-sm',
        )}
      >
        <div className="relative h-full animate-[devo-float_9s_ease-in-out_infinite]">
          <Image
            src="/images/npc/voice-figure.jpg"
            alt="A Antiga Voz: uma silhueta sem rosto envolta em sombra, com um sol eclipsado dourado no peito e ornamentos góticos como auréola"
            fill
            sizes="100vw"
            className="object-cover mix-blend-lighten [mask-image:radial-gradient(ellipse_34%_42%_at_50%_46%,black_45%,transparent_100%)] sm:object-contain"
          />
        </div>
      </div>

      {/* Mina */}
      <Layer on={mineOn}>
        <div className="absolute -inset-[4%]" style={FAR}>
          <div className="en-cam-far absolute inset-0">
            <Image src="/images/prologue/mine.webp" alt="" fill sizes="100vw" className={cn('object-cover transition-[filter] duration-700', stage === 'phone' && 'blur-sm brightness-50')} />
          </div>
        </div>
        <div className="absolute inset-0 animate-[devo-flicker_3s_ease-in-out_infinite] bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(255,140,50,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </Layer>
      {/* Melissa: mesmo tratamento de retrato do elenco (PortraitFrame). Só entra depois da fala de cenário:
          primeiro como silhueta se aproximando, depois em luz; escurece quando não é ela quem fala. */}
      <div
        className="absolute inset-x-0 bottom-[25%] flex justify-center lg:bottom-[12%] lg:left-[6%] lg:right-auto lg:w-[36vw]"
        style={NEAR}
      >
        <div
          ref={melissaRef}
          className={cn(
            'w-[min(72vw,320px)] transition-[opacity,transform,filter] duration-[800ms] ease-[var(--dv-ease-out)] lg:w-full lg:max-w-[440px]',
            melissaOn ? 'translate-x-0 opacity-100' : 'translate-x-[14%] opacity-0',
            melissa === 'approach' ? 'brightness-[0.08]' : melissaOn && !speaking ? 'brightness-[0.62] saturate-[0.8]' : 'brightness-100',
          )}
        >
          <PortraitFrame alt={melissaOn ? 'Melissa, da Companhia de Despertados' : ''} tone="cobalt" ornate scale={1.55} className="w-full">
            <div className="relative size-full">
              {(['neutral', 'soft', 'serious'] as MelissaMood[]).map((m) => (
                <MelissaArt key={m} mood={m} className={cn('absolute inset-0 size-full transition-opacity duration-500', m === mood ? 'opacity-100' : 'opacity-0')} />
              ))}
            </div>
          </PortraitFrame>
        </div>
      </div>

      {/* Celular */}
      <Layer on={stage === 'phone'} className="grid place-items-center">
        <div className="relative -mt-24 flex h-[min(52dvh,420px)] aspect-[9/18] flex-col items-center justify-center gap-3 rounded-[2rem] border-4 border-[#20232c] bg-gradient-to-b from-dv-cobalt-dim to-dv-ink shadow-[0_0_80px_rgba(49,93,255,0.35)]">
          <span className="absolute top-3 h-1.5 w-12 rounded-full bg-[#20232c]" />
          <span className="dv-cut grid size-16 animate-[pr-buzz_2.4s_ease-in-out_infinite] place-items-center bg-[linear-gradient(160deg,var(--dv-cobalt),var(--dv-cobalt-dim))] text-dv-text shadow-[0_0_30px_rgba(49,93,255,0.5)]" style={{ '--dv-cut': '12px' } as CSSProperties}>
            <DeadlyVoteSymbol variant="mark" className="size-10" />
          </span>
          <span className="dv-label text-[11px] text-dv-text-2">Devo</span>
        </div>
      </Layer>

      {/* Grade de cor comum a todas as cenas (livro ilustrado, pintura, vetor): mesma noite cobalto. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,26,77,0.28),rgba(11,26,77,0.08)_40%,rgba(5,7,13,0.5))] mix-blend-multiply" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(49,93,255,0.07)] mix-blend-soft-light" />

      {/* Abrir os olhos: pálpebras se afastam no primeiro quadro. */}
      {opening && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
          <span className="en-lid-top absolute inset-x-0 top-0 h-1/2 bg-black shadow-[0_20px_40px_rgba(0,0,0,0.9)]" />
          <span className="en-lid-bottom absolute inset-x-0 bottom-0 h-1/2 bg-black shadow-[0_-20px_40px_rgba(0,0,0,0.9)]" />
        </div>
      )}

      {/* Grão de papel e vinheta */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[-10%] animate-[pr-grain_0.5s_steps(3)_infinite] opacity-[0.08] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.85)]" />
    </div>
  )
}
