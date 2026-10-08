'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { INTRO_SCRIPT, INTRO_SPEAKERS } from '@/lib/devo/intro-script'
import { getNpc, type Expression } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { GlyphSpark, toRoman } from '../kit/glyphs'
import { SceneBackdrop } from '../kit/scene'
import { TutorialVisualPanel } from './tutorial-visuals'
import { AdvanceIndicator, DialogueShell, SpeakerPlate, VnTopBar, useTypewriter } from './vn'

const CHAR_MS = 24

const PORTRAIT_STYLE = {
  cutout: 'drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]',
  blend: 'mix-blend-lighten [mask-image:radial-gradient(ellipse_34%_50%_at_50%_45%,black_35%,transparent_90%)]',
}

function Portraits({ speaker, expression }: { speaker: string; expression: Expression }) {
  return (
    <>
      {INTRO_SPEAKERS.map((id) => {
        const npc = getNpc(id)
        if (npc.art) {
          const Art = npc.art
          const exprs = npc.artExpressions ?? ['neutral']
          const target = exprs.includes(expression) ? expression : 'neutral'
          return exprs.map((expr) => {
            const visible = id === speaker && expr === target
            return (
              <Art
                key={`${id}-${expr}`}
                expression={expr}
                title={visible ? `${npc.name}, ${npc.title}` : undefined}
                className={cn('absolute inset-0 size-full transition-opacity duration-500', PORTRAIT_STYLE[npc.portraitStyle], visible ? 'opacity-100' : 'opacity-0')}
              />
            )
          })
        }
        const fallback = npc.portraits.neutral
        return (Object.entries(npc.portraits) as [Expression, string][]).map(([expr, src]) => {
          const target = npc.portraits[expression] ? expression : 'neutral'
          const visible = id === speaker && expr === target && Boolean(fallback)
          return (
            <Image
              key={`${id}-${expr}`}
              src={src}
              alt={visible ? `${npc.name}, ${npc.title}` : ''}
              fill
              priority={id === INTRO_SPEAKERS[0]}
              sizes="(min-width: 1024px) 40vw, 80vw"
              className={cn(
                'object-contain object-bottom transition-opacity duration-500',
                PORTRAIT_STYLE[npc.portraitStyle],
                visible ? 'opacity-100' : 'opacity-0',
              )}
            />
          )
        })
      })}
    </>
  )
}

/** Lado de entrada do retrato por falante (o Herdeiro vem da esquerda, o Rato da direita). */
const ENTER_FROM: Record<string, 'l' | 'r'> = { herdeiro: 'l', rato: 'r' }

function PlateAvatar({ speaker, expression }: { speaker: string; expression: Expression }) {
  const npc = getNpc(speaker)
  if (npc.art) {
    const Art = npc.art
    return <Art expression={expression} crop="face" className="size-full scale-[1.4]" />
  }
  const src = npc.portraits.neutral
  if (!src) return null
  return <Image src={src} alt="" width={48} height={48} className="size-full object-cover object-top" />
}

export function IntroScreen({ onFinish, playerName }: { onFinish: () => void; playerName: string | null }) {
  const [index, setIndex] = useState(0)
  const script = INTRO_SCRIPT[index]
  const line = { ...script, text: withName(script.text, playerName) }
  const npc = getNpc(line.speaker)
  const { shown, done, finish } = useTypewriter(line.text, CHAR_MS)
  const last = index === INTRO_SCRIPT.length - 1
  const total = INTRO_SCRIPT.length

  useEffect(() => {
    if (line.unlock || line.step) playSfx('reveal')
  }, [index, line.unlock, line.step])

  const advance = useCallback(() => {
    if (!done) {
      finish()
      return
    }
    if (last) {
      playSfx('whoosh')
      onFinish()
      return
    }
    playSfx('click')
    setIndex((i) => i + 1)
  }, [done, finish, last, onFinish])

  useAdvanceKeys(advance)

  return (
    <main className="relative flex h-dvh overflow-hidden bg-dv-ink text-dv-text">
      <SceneBackdrop preset="cathedral" intensity={0.6} dim={0.5} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_100%,rgba(5,7,13,0.9),transparent_60%)]" />

      <VnTopBar
        skipLabel="Pular introdução"
        onSkip={onFinish}
        chapter={
          <p className="dv-label flex items-center gap-2 text-[10px] text-dv-text-2">
            <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(index + 1)}</span>
            <span className="truncate">Deadly Vote</span>
          </p>
        }
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:pl-[min(34vw,480px)] lg:pr-10">
        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-16 lg:px-0 lg:pb-8 lg:pt-14">
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            {line.visual && (
              <div key={`v-${index}`} className="origin-center [@media(max-height:760px)]:scale-[0.86] [@media(max-height:640px)]:scale-[0.72]">
                <TutorialVisualPanel visual={line.visual} step={line.step} index={index + 1} />
              </div>
            )}
          </div>

          <div className="relative">
            {/* Retrato ancorado à caixa: em cima dela no celular, à esquerda no desktop. Entra pelo lado do falante. */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-full -mb-10 h-[min(44dvh,380px)] transition-[opacity,transform] duration-500 ease-out',
                'lg:inset-x-auto lg:-bottom-8 lg:right-full lg:mb-0 lg:mr-2 lg:h-[min(84dvh,760px)] lg:w-[min(34vw,480px)]',
                line.visual ? 'translate-y-6 opacity-0 lg:translate-y-0 lg:opacity-100' : 'translate-y-0 opacity-100',
              )}
            >
              <div key={line.speaker} className={cn('relative h-full w-full', ENTER_FROM[line.speaker] === 'l' ? 'en-portrait-in-l' : 'en-portrait-in-r')}>
                <div className="relative h-full w-full lg:animate-[devo-float_9s_ease-in-out_infinite]">
                  <Portraits speaker={line.speaker} expression={line.expression} />
                </div>
              </div>
            </div>

            {line.unlock && (
              <p
                key={`u-${index}`}
                className="animate-dv-toast-in relative z-10 mb-8 flex w-fit items-center gap-2.5 border-l-[3px] border-dv-gold bg-[linear-gradient(90deg,rgba(124,95,42,0.85),rgba(10,15,28,0.92))] py-1.5 pl-3 pr-5 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-gold-bright shadow-[0_8px_20px_rgba(0,0,0,0.55)] [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]"
              >
                <GlyphSpark className="size-3" />
                Sistema apresentado: {line.unlock}
              </p>
            )}

            <button
              type="button"
              onClick={advance}
              aria-label={done ? (last ? 'Entrar no DEVO' : 'Próxima fala') : 'Mostrar fala completa'}
              className={cn('dv-focus relative z-10 block w-full text-left', !line.unlock && 'mt-6')}
            >
              <DialogueShell tone="gold">
                <SpeakerPlate
                  key={line.speaker}
                  name={npc.name}
                  title={npc.title}
                  tone={line.speaker === 'rato' ? 'gold' : 'cobalt'}
                  avatar={<PlateAvatar speaker={line.speaker} expression={line.expression} />}
                />
                <span className="block px-6 pb-3 pt-8 sm:px-8">
                  <span className="block min-h-[4.5rem] text-pretty font-body text-[17px] leading-relaxed text-dv-text sm:text-lg" aria-live="polite">
                    {line.text.slice(0, shown)}
                    {!done && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-gold-bright" aria-hidden="true" />}
                  </span>
                  <span className="mt-3 flex items-center gap-3" aria-hidden="true">
                    <span className="dv-label dv-tabular text-[10px] text-dv-text-3">
                      {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                    </span>
                    <span className="relative h-[3px] flex-1 bg-dv-line">
                      <span className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--dv-cobalt-deep),var(--dv-cobalt-text))] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
                      {Array.from({ length: total - 1 }, (_, i) => (
                        <span key={i} className="absolute -top-[2px] h-[7px] w-px bg-dv-ink" style={{ left: `${((i + 1) / total) * 100}%` }} />
                      ))}
                    </span>
                    <span className="hidden font-mono text-[10px] text-dv-text-3 sm:inline">Espaço</span>
                    <AdvanceIndicator visible={done} label={last ? 'Entrar no DEVO' : 'Continuar'} tone="gold" />
                  </span>
                </span>
              </DialogueShell>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
