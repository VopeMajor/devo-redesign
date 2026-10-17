'use client'

import Image from 'next/image'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { MELISSA_MOODS, type MelissaMood, type StageId } from '@/lib/devo/prologue-script'
import { cn } from '@/lib/utils'
import { NpcAnchor, NpcBustLayer } from '../kit/npc-anchor'
import { SceneBackdrop } from '../kit/scene'
import { DeadlyVoteSymbol } from '../system/symbol'
import { Embers } from '../shared/atmosphere'
import { CelFire } from './cel-fire'
import { CLIP_BOTTOM, CLIP_TOP, CUT_Y, FallActors, FallCut } from './theater-fall'

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

function Layer({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 transition-opacity duration-[1200ms]', on ? 'opacity-100' : 'opacity-0', className)}>
      {children}
    </div>
  )
}

/** Papel de parede do teatro (camada longe, com parallax). Usado duas vezes na queda: cenário e aba do chão. */
function Wallpaper() {
  return (
    <div className="absolute -inset-[4%]" style={FAR}>
      <div className="en-cam-far absolute inset-0">
        <Image src="/images/prologue/wallpaper.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
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

/** Enquadramento por cena: escala e deslocamento (direção de câmera). */
const CAMERA: Partial<Record<StageId, [number, number, number]>> = {
  rumor: [1, 0, 0],
  kids: [1.04, 0, -1],
  boy: [1.12, -4, -2],
  girl: [1.12, 4, -2],
  hands: [1.06, 0, -1],
  // Presságio e golpe com o chão em quadro (a linha do corte fica visível acima da barra de cinema);
  // na queda a câmera desce atrás das crianças.
  omen: [1.1, 0, -7],
  trip: [1.16, 0, -8],
  fall: [1.1, 0, -16],
  abyss: [1.22, 0, 0],
  death: [1.1, 0, 2],
  fire: [1.04, 0, 0],
  rise: [1.14, 0, -3],
  voice: [1.08, 0, 1],
  phone: [1.12, 0, -2],
}
function camera(stage: StageId) {
  const [s, x, y] = CAMERA[stage] ?? [1, 0, 0]
  return `scale(${s}) translate3d(${x}%, ${y}%, 0)`
}
const LETTERBOX: StageId[] = ['rumor', 'kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall', 'abyss', 'death', 'fire', 'rise']

/** Presença da Melissa: fora, silhueta se aproximando, ou em cena. */
export type MelissaPresence = 'off' | 'approach' | 'on'

/** Luz de borda comum do elenco (mesma do PortraitFrame do kit): contorno claro + halo. */
const RIM_GOLD = 'drop-shadow(-1.5px -1px 0 color-mix(in oklab,var(--dv-gold-bright) 50%,transparent)) drop-shadow(0 0 12px color-mix(in oklab,var(--dv-gold-bright) 22%,transparent))'

/** Riscos de poeira subindo no abismo (sensação de queda): [esquerda %, altura %, duração ms, atraso ms]. */
const ABYSS_STREAKS: [number, number, number, number][] = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return [4 + r(1) * 92, 8 + r(2) * 16, 700 + r(3) * 900, -r(4) * 1600]
})

export function PrologueStage({
  stage,
  mood,
  speaking = false,
  melissa = 'off',
  opening = false,
  fala,
}: {
  stage: StageId
  mood: MelissaMood
  speaking?: boolean
  melissa?: MelissaPresence
  /** Primeiro quadro do prólogo: pálpebras abrindo sobre o sigilo. */
  opening?: boolean
  /** Caixa de fala atual: a Melissa se ancora nela. */
  fala?: HTMLElement | null
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
  // A queda (theater-fall.tsx): golpe da tesoura e corte no `trip`, as crianças escorregam no `fall`.
  const cut = tripped || fallen
  const fallPhase = tripped ? 'trip' : fallen ? 'fall' : null
  const deathOn = stage === 'death' || stage === 'fire'
  const fireOn = stage === 'fire' || stage === 'rise'
  const melissaOn = stage === 'mine' && melissa !== 'off'
  const letterbox = LETTERBOX.includes(stage)
  const mineOn = stage === 'mine' || stage === 'phone'
  const mirrorOn = stage === 'void'
  // Salão do relógio (cena 3D-chave da Jornada): monta já no vazio (carrega escondido) e aparece com a Voz.
  const hallMounted = stage === 'void' || stage === 'voice'
  const hallOn = stage === 'voice'

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
      {/* Câmera: cada cena tem enquadramento próprio (empurra, aproxima, desce), com transição lenta. */}
      <div className="absolute inset-0 transition-transform duration-[2600ms] ease-[cubic-bezier(.33,0,.15,1)] motion-reduce:transition-none" style={{ transform: camera(stage), transformOrigin: '50% 55%' }}>
      {/* Escuridão / vazio: o sigilo acende devagar no fundo, poeira na luz que cai do alto. Luz em
          porcelana sobre grafite (mármore); a ametista fica só no halo do sigilo. */}
      <Layer on={stage === 'dark' || stage === 'void' || stage === 'voice'}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,color-mix(in_oklab,var(--dv-porcelain)_7%,transparent),transparent_70%),radial-gradient(80%_60%_at_50%_42%,#1d1d20,var(--dv-ink)_75%)]" />
        <div className="absolute inset-x-[22%] top-0 h-[70%] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-porcelain)_12%,transparent),transparent)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)] blur-md" />
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
            <DeadlyVoteSymbol variant="mark" className="size-full drop-shadow-[0_0_20px_color-mix(in_oklab,var(--dv-amethyst)_55%,transparent)]" />
          </div>
        </div>
        <Embers className="opacity-70" />
      </Layer>

      {/* Teatro de papel */}
      <Layer on={theater}>
        <div
          data-theater=""
          className={cn('absolute inset-0 transition-[filter] duration-1000', tripped && 'en-fall-shake')}
          style={{ filter: omen ? 'grayscale(0.75) sepia(0.3) contrast(1.15) brightness(0.75)' : 'none' }}
        >
          {/* Cenário. Depois do golpe da tesoura, só a parte acima do rasgo fica; a faixa do chão cai (aba). */}
          <div className="absolute inset-0" style={{ clipPath: cut ? CLIP_TOP : undefined }}>
            <Wallpaper />
          </div>
          {tripped && (
            <div className="en-fall-flap absolute inset-0 z-[1]" style={{ clipPath: CLIP_BOTTOM, transformOrigin: `50% ${CUT_Y}%` }}>
              <Wallpaper />
            </div>
          )}

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
          {/* De mãos dadas. No golpe, a marionete dá lugar (sem transição) aos atores da queda, na mesma caixa. */}
          <Puppet
            src="/images/prologue/kids-hands.webp"
            w={514}
            h={693}
            alt="Os dois irmãos de mãos dadas"
            swayDelay="-0.6s"
            style={{
              left: '50%',
              bottom: '9%',
              height: 'min(60%, 72vw)',
              opacity: together && !cut ? 1 : 0,
              transform: 'translateX(-50%)',
              ...(cut ? { transition: 'none' } : {}),
            }}
          />

          {/* A tesoura balança no presságio; no golpe, sai do canto num tranco (quem desce é a dos atores). */}
          <div
            className={cn('absolute left-[18%] h-[52%] ease-out', cut ? 'transition-[top,opacity] duration-150' : 'transition-[top] duration-[1600ms]')}
            style={{ top: cut ? '-70%' : omen ? '-12%' : '-75%', opacity: cut ? 0 : 1 }}
          >
            <div className="h-full origin-top animate-[pr-dangle_3s_ease-in-out_infinite]">
              <Image src="/images/prologue/hand-scissors.png" alt="" width={312} height={718} className="h-full w-auto max-w-none" />
            </div>
          </div>

          {fallPhase && <FallActors key={fallPhase} phase={fallPhase} rim={RIM_GOLD} />}
        </div>
        {fallPhase && <FallCut key={fallPhase} phase={fallPhase} />}
        {/* clarão curto e vermelho no impacto (sai junto com o corte) */}
        {tripped && <div className="en-fall-flash absolute inset-0 bg-[var(--dv-blood-deep)]" />}
      </Layer>

      {/* O abismo: a fenda de luz encolhe lá em cima, poeira sobe (queda), dois vultos pequenos giram no escuro. */}
      <Layer on={stage === 'abyss'}>
        {(stage === 'abyss' || stage === 'death') && (
        <>
        <div className="en-rift absolute left-1/2 top-[13%] h-[24%] w-[44%] -translate-x-1/2">
          <div className="absolute -inset-[60%] bg-[radial-gradient(ellipse_26%_44%_at_50%_34%,color-mix(in_oklab,var(--dv-gold-bright)_20%,transparent),transparent_70%)]" />
          <div className="absolute inset-0 bg-dv-gold-bright/85 blur-[0.6px] [clip-path:polygon(47%_0,57%_0,53%_20%,62%_38%,52%_60%,58%_100%,47%_72%,40%_47%,50%_27%)]" />
        </div>
        {ABYSS_STREAKS.map(([left, h, dur, delay], i) => (
          <span
            key={i}
            className="en-streak absolute bottom-0 w-px bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--dv-text)_32%,transparent),transparent)]"
            style={{ left: `${left}%`, height: `${h}%`, animationDuration: `${dur}ms`, animationDelay: `${delay}ms` }}
          />
        ))}
        {(
          [
            ['/images/prologue/girl.webp', 312, 706, '34%', 'en-fall-a'],
            ['/images/prologue/boy.webp', 242, 705, '56%', 'en-fall-b'],
          ] as const
        ).map(([src, w, h, left, anim]) => (
          <div key={src} className={cn('absolute top-[34%] h-[15%]', anim)} style={{ left }}>
            <Image src={src} alt="" width={w} height={h} className="h-full w-auto max-w-none brightness-0" style={{ filter: `brightness(0) ${RIM_GOLD}` }} />
          </div>
        ))}
        </>
        )}
      </Layer>

      {/* A morte */}
      <Layer on={deathOn || stage === 'abyss'}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_55%_at_50%_55%,color-mix(in_oklab,var(--dv-gold-bright)_14%,transparent),transparent_70%)]" />
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
        {/* tremor de luz quente do fogo e brasas: as cores originais (exceção à paleta pedida pelo dono) */}
        <div className="absolute inset-0 animate-[devo-flicker_0.4s_steps(2)_infinite] bg-[#ff5a1f]/10 mix-blend-screen" />
        <Embers className="opacity-90" />
      </Layer>

      {/* O salão do relógio: a luz que a Voz promete. Entra de longe (câmera recua) com uma badalada. */}
      {hallMounted && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 transition-[opacity,transform,filter] duration-[2600ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none',
            hallOn ? 'scale-100 opacity-100 blur-0' : 'scale-[1.22] opacity-0 blur-sm',
          )}
        >
          <SceneBackdrop preset="clockhall" intensity={0.8} dim={0.22} />
          <div className="absolute inset-x-[18%] top-0 h-[78%] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-gold-bright)_16%,transparent),transparent)] [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)] blur-lg" />
        </div>
      )}

      {/* O espelho e a voz */}
      <Layer on={mirrorOn}>
        <video
          src="/videos/mirror.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-contain opacity-90 mix-blend-screen"
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
            className="object-cover [mask-image:radial-gradient(ellipse_38%_44%_at_50%_44%,black_40%,transparent_100%)] sm:object-contain"
          />
        </div>
      </div>

      {/* Mina */}
      <Layer on={mineOn}>
        <div className="absolute -inset-[4%]" style={FAR}>
          <div className="en-cam-far absolute inset-0">
            <Image
              src="/images/prologue/mine.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover transition-[filter] duration-700"
              // Pedra cinza-quente quase neutra (rodada 2 › correção 7): a Melissa é a única mancha de cor.
              style={{ filter: stage === 'phone' ? 'grayscale(0.9) sepia(0.12) brightness(0.42) contrast(1.05) blur(4px)' : 'grayscale(0.88) sepia(0.14) brightness(0.8) contrast(1.08)' }}
            />
          </div>
        </div>
        {/* o calor fica só no foco da lanterna/tocha da parede */}
        <div className="absolute inset-0 animate-[devo-flicker_3s_ease-in-out_infinite] bg-[radial-gradient(circle_at_19%_47%,rgba(255,176,96,0.30),rgba(255,150,70,0.10)_9%,transparent_22%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </Layer>
      {/* Melissa: mesmo tratamento de retrato do elenco (PortraitFrame). Só entra depois da fala de cenário:
          primeiro como silhueta se aproximando, depois em luz; escurece quando não é ela quem fala. */}
      <div ref={melissaRef} data-melissa={melissa} className="pointer-events-none absolute inset-0" style={NEAR}>
        {/* Ancorada à caixa de fala (kit/npc-anchor): a base do busto passa por trás do topo da caixa, sem
            vão, em qualquer altura de tela. Expressões trocam por opacidade; na aproximação só a silhueta. */}
        <NpcAnchor
          npc="melissa"
          pose={mood}
          poses={MELISSA_MOODS}
          fala={fala ?? null}
          alt={melissaOn && melissa === 'on' ? 'Melissa, da Companhia de Despertados' : undefined}
          cabeca="min(16dvh, 148px)"
          reserva={72}
          outerClassName="lg:!bottom-[12%] lg:!left-[6%] lg:![transform:none]"
          className={cn(
            'transition-[opacity,transform,filter] duration-[800ms] ease-[var(--dv-ease-out)]',
            melissaOn ? 'translate-x-0 opacity-100' : 'translate-x-[14%] opacity-0',
            melissaOn && !speaking && melissa !== 'approach' ? 'brightness-[0.62] saturate-[0.8]' : 'brightness-100',
            // só acende em cena ('on'): antes fica só a silhueta (sem piscar o retrato colorido)
            melissa !== 'on' && '[&>.npc-pose]:!opacity-0',
          )}
        >
          <NpcBustLayer
            npc="melissa"
            pose="convite"
            className={cn('z-10 transition-opacity duration-700', melissa === 'approach' ? 'opacity-100' : 'opacity-0')}
            style={{ filter: `brightness(0) ${RIM_GOLD}` }}
          />
        </NpcAnchor>
      </div>

      {/* Celular: objeto do mundo — moldura de aço, vidro facetado, reflexo do mostrador; o sigilo acende. */}
      <Layer on={stage === 'phone'} className="grid place-items-center">
        <div className={cn('relative -mt-24 aspect-[9/18] h-[min(52dvh,420px)]', stage === 'phone' && 'en-phone-rise')}>
          {/* moldura de aço escovado */}
          <span aria-hidden="true" className="absolute inset-0 rounded-[2.1rem] bg-[linear-gradient(135deg,#ece5d8,#6b6357_22%,#bab09f_48%,#5f584d_72%,#d6cdbd)] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95),0_0_0_1px_rgba(0,0,0,0.6)]" />
          <span aria-hidden="true" className="absolute inset-[3px] rounded-[1.95rem] bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink)_60%)]" />
          {/* vidro: tela negra com reflexo do mostrador e facetas em losango */}
          <div className="absolute inset-[9px] overflow-hidden rounded-[1.6rem] bg-[radial-gradient(120%_70%_at_50%_42%,var(--dv-ink-3),var(--dv-ink)_70%)]">
            <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute left-1/2 top-[42%] w-[150%] -translate-x-1/2 -translate-y-1/2 text-[#bab09f] opacity-[0.16]" fill="none" stroke="currentColor">
              <circle cx="100" cy="100" r="96" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="72" strokeWidth="0.5" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2
                return <line key={i} x1={100 + Math.sin(a) * 80} y1={100 - Math.cos(a) * 80} x2={100 + Math.sin(a) * 92} y2={100 - Math.cos(a) * 92} strokeWidth="1.4" />
              })}
            </svg>
            <span aria-hidden="true" className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(60deg,transparent_49.5%,#ece5d8_49.5%,#ece5d8_50.5%,transparent_50.5%),linear-gradient(-60deg,transparent_49.5%,#ece5d8_49.5%,#ece5d8_50.5%,transparent_50.5%)] [background-size:34px_58px]" />
            <span aria-hidden="true" className="en-phone-glare absolute -inset-y-10 left-[-60%] w-[46%] rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgba(241,240,238,0.14),transparent)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="relative grid size-24 place-items-center text-dv-porcelain">
                <span aria-hidden="true" className="en-sigil-halo absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(241,240,238,0.22),rgb(var(--dv-amethyst-rgb)/0.14)_45%,transparent_70%)]" />
                <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full text-[#bab09f]" fill="none" stroke="currentColor">
                  <circle cx="50" cy="50" r="46" strokeWidth="0.8" strokeDasharray="2 3"/>
                  <circle cx="50" cy="50" r="40" strokeWidth="1" pathLength={1} strokeDasharray="1" className="en-ring-draw" />
                </svg>
                <DeadlyVoteSymbol variant="mark" className="en-sigil-ignite relative size-14" />
              </span>
              <span className="dv-label en-sigil-label text-[11px] tracking-[0.42em] text-dv-text-2">Devo</span>
            </div>
          </div>
          {/* reflexo do vidro na borda superior */}
          <span aria-hidden="true" className="absolute inset-x-[14%] top-[10px] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          {/* alto-falante */}
          <span aria-hidden="true" className="absolute left-1/2 top-[16px] h-1 w-10 -translate-x-1/2 rounded-full bg-[#38393c]" />
        </div>
      </Layer>

      </div>

      {/* Barras de cinema nas cenas narradas (teatro, morte, fogo). */}
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 top-0 z-[5] h-[7dvh] bg-black transition-transform duration-[900ms] ease-[var(--dv-ease-out)]', letterbox ? 'translate-y-0' : '-translate-y-full')} />
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[7dvh] bg-black transition-transform duration-[900ms] ease-[var(--dv-ease-out)]', letterbox ? 'translate-y-0' : 'translate-y-full')} />

      {/* Grade de cor comum a todas as cenas: sombra da noite só como atmosfera discreta (paleta do mármore). */}
      {/* (fora do fogo: as chamas mantêm as cores originais, sem o escurecimento da grade) */}
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-night)_18%,transparent),color-mix(in_oklab,var(--dv-night)_8%,transparent)_40%,color-mix(in_oklab,var(--dv-ink)_50%,transparent))] mix-blend-multiply transition-opacity duration-[1200ms]', fireOn && 'opacity-0')} />

      {/* Abrir os olhos: pálpebras se afastam no primeiro quadro. */}
      {opening && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
          <span className="en-lid-top absolute inset-x-0 top-0 h-1/2 bg-black shadow-[0_20px_40px_rgba(0,0,0,0.9)]" />
          <span className="en-lid-bottom absolute inset-x-0 bottom-0 h-1/2 bg-black shadow-[0_-20px_40px_rgba(0,0,0,0.9)]" />
          {/* fresta de luz entre as pálpebras: o primeiro quadro nunca é só preto */}
          <span className="en-slit absolute inset-x-[6%] top-1/2 h-[3px] -translate-y-1/2 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--dv-gold-bright)_85%,transparent)_30%,var(--dv-porcelain)_50%,color-mix(in_oklab,var(--dv-gold-bright)_85%,transparent)_70%,transparent)] shadow-[0_0_24px_4px_color-mix(in_oklab,var(--dv-violet-text)_45%,transparent)]" />
        </div>
      )}

      {/* Grão de papel e vinheta */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[-10%] animate-[pr-grain_0.5s_steps(3)_infinite] opacity-[0.08] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.85)]" />
    </div>
  )
}
