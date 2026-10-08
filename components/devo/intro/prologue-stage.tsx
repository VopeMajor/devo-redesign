'use client'

import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import type { MelissaMood, StageId } from '@/lib/devo/prologue-script'
import { cn } from '@/lib/utils'
import { MelissaArt } from '../npc-art/melissa'
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

export function PrologueStage({ stage, mood }: { stage: StageId; mood: MelissaMood }) {
  const theater = THEATER.includes(stage)
  const kids = KIDS.includes(stage)
  const together = TOGETHER.includes(stage)
  const fallen = stage === 'fall'
  const tripped = stage === 'trip'
  const omen = stage === 'omen' || tripped || fallen
  const deathOn = stage === 'death' || stage === 'fire'
  const fireOn = stage === 'fire' || stage === 'rise'
  const melissaOn = stage === 'mine'
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
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Teatro de papel */}
      <Layer on={theater}>
        <div
          className={cn('absolute inset-0 transition-[filter] duration-1000', tripped && 'animate-[pr-shake_0.6s_ease-out_both]')}
          style={{ filter: omen ? 'grayscale(0.75) sepia(0.3) contrast(1.15) brightness(0.75)' : 'none' }}
        >
          <Image src="/images/prologue/wallpaper.webp" alt="" fill priority sizes="100vw" className="object-cover" />

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
            <Image src="/images/prologue/death.webp" alt="A Morte estendendo a mão" width={469} height={717} className="h-full w-auto max-w-none drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]" />
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
          className={cn('absolute inset-0 size-full object-contain transition-[filter,opacity] duration-1000', stage === 'voice' ? 'opacity-40 blur-[2px]' : 'opacity-90')}
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
        <Image src="/images/prologue/mine.webp" alt="" fill sizes="100vw" className={cn('object-cover transition-[filter] duration-700', stage === 'phone' && 'blur-sm brightness-50')} />
        <div className="absolute inset-0 animate-[devo-flicker_3s_ease-in-out_infinite] bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(255,140,50,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </Layer>
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto h-[min(88dvh,820px)] max-w-3xl transition-[opacity,transform] duration-700 ease-out lg:left-[8%] lg:right-auto lg:w-[42vw]',
          melissaOn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        )}
      >
        {(['neutral', 'soft', 'serious'] as MelissaMood[]).map((m) => (
          <MelissaArt
            key={m}
            mood={m}
            title={m === mood && melissaOn ? 'Melissa, da Companhia de Despertados' : undefined}
            className={cn(
              'absolute inset-0 size-full transition-opacity duration-500 drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]',
              m === mood ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>

      {/* Celular */}
      <Layer on={stage === 'phone'} className="grid place-items-center">
        <div className="relative -mt-24 flex h-[min(52dvh,420px)] aspect-[9/18] flex-col items-center justify-center gap-3 rounded-[2rem] border-4 border-[#20232c] bg-gradient-to-b from-[#0b1a4d] to-[#05070d] shadow-[0_0_80px_rgba(111,140,255,0.35)]">
          <span className="absolute top-3 h-1.5 w-12 rounded-full bg-[#20232c]" />
          <span className="grid size-16 animate-[pr-buzz_2.4s_ease-in-out_infinite] place-items-center rounded-2xl border border-[#6f8cff]/60 bg-[#6f8cff]/15 font-[family-name:var(--font-unifraktur)] text-3xl text-foreground shadow-[0_0_30px_rgba(111,140,255,0.5)]">
            D
          </span>
          <span className="text-[11px] uppercase tracking-[0.4em] text-foreground/80">Devo</span>
        </div>
      </Layer>

      {/* Grão de papel e vinheta */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[-10%] animate-[pr-grain_0.5s_steps(3)_infinite] opacity-[0.08] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.85)]" />
    </div>
  )
}
