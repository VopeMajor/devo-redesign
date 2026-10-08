'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { INTRO_SCRIPT, INTRO_SPEAKERS } from '@/lib/devo/intro-script'
import { getNpc, type Expression } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { cn } from '@/lib/utils'
import { Sparkle } from '../ornaments'
import { CathedralBackdrop, Embers } from '../shared/atmosphere'
import { useAdvanceKeys } from '../hooks'
import { SoundToggle } from '../shared/sound-toggle'
import { TutorialVisualPanel } from './tutorial-visuals'

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

export function IntroScreen({ onFinish, playerName }: { onFinish: () => void; playerName: string | null }) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const script = INTRO_SCRIPT[index]
  const line = { ...script, text: withName(script.text, playerName) }
  const npc = getNpc(line.speaker)
  const done = shown >= line.text.length
  const last = index === INTRO_SCRIPT.length - 1

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => {
      setShown((s) => s + 1)
      if (shown % 3 === 0 && line.text[shown] !== ' ') playSfx('type')
    }, CHAR_MS)
    return () => window.clearTimeout(id)
  }, [shown, done, line.text])

  useEffect(() => {
    if (line.unlock || line.step) playSfx('reveal')
  }, [index, line.unlock, line.step])

  const advance = useCallback(() => {
    if (!done) {
      setShown(line.text.length)
      return
    }
    if (last) {
      playSfx('whoosh')
      onFinish()
      return
    }
    playSfx('click')
    setIndex((i) => i + 1)
    setShown(0)
  }, [done, last, line.text.length, onFinish])

  useAdvanceKeys(advance)

  return (
    <main className="relative flex h-dvh overflow-hidden bg-background text-foreground animate-[devo-fade-in_1.2s_ease-out_both]">
      <CathedralBackdrop dim={0.72} />
      <Embers className="opacity-60" />

      <div className="absolute right-5 top-5 z-30 flex items-center gap-5">
        <SoundToggle compact />
        <button
          type="button"
          onClick={() => {
            playSfx('whoosh')
            onFinish()
          }}
          className="text-[11px] uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
        >
          Pular introdução
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:pl-[min(34vw,480px)] lg:pr-10">
        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-5 pt-16 lg:px-0 lg:pb-8 lg:pt-14">
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            {line.visual && (
              <div key={`v-${index}`} className="origin-center [@media(max-height:760px)]:scale-[0.82] [@media(max-height:640px)]:scale-[0.7]">
                <TutorialVisualPanel visual={line.visual} step={line.step} />
              </div>
            )}
          </div>

          <div className="relative">
            {/* Retrato ancorado à caixa de diálogo: em cima dela no celular, à esquerda dela no desktop */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-full -mb-10 h-[min(44dvh,380px)] transition-[opacity,transform] duration-500 ease-out',
                'lg:inset-x-auto lg:-bottom-8 lg:right-full lg:mb-0 lg:mr-2 lg:h-[min(84dvh,760px)] lg:w-[min(34vw,480px)]',
                line.visual
                  ? 'translate-y-6 opacity-0 lg:translate-y-0 lg:opacity-100'
                  : 'translate-x-0 translate-y-0 opacity-100',
              )}
            >
              <div className="relative h-full w-full lg:animate-[devo-float_9s_ease-in-out_infinite]">
                <Portraits speaker={line.speaker} expression={line.expression} />
              </div>
            </div>
            {line.unlock && (
              <p key={`u-${index}`} className="relative z-10 mb-5 flex w-fit items-center gap-2 border border-[#6f8cff]/60 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#6f8cff] animate-pop">
                <Sparkle className="size-2.5" />
                Sistema apresentado: {line.unlock}
              </p>
            )}
            <button
              type="button"
              onClick={advance}
              aria-label={done ? (last ? 'Entrar no DEVO' : 'Próxima fala') : 'Mostrar fala completa'}
              className="group relative z-10 block w-full rounded-sm border border-[#d8b25a]/55 bg-[radial-gradient(ellipse_at_50%_0%,rgba(36,27,16,0.95),rgba(7,7,10,0.95)_75%)] p-1 text-left shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95),0_0_50px_-30px_rgba(216,178,90,0.7)] backdrop-blur-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d8b25a]"
            >
              {(['left-0 top-0', 'right-0 top-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'] as const).map((pos) => (
                <svg key={pos} viewBox="0 0 24 24" className={cn('pointer-events-none absolute size-6', pos)} aria-hidden="true">
                  <path d="M1 23 V6 Q1 1 6 1 H23" fill="none" stroke="#d8b25a" strokeWidth="1.4" />
                  <path d="M6 6 L9 3 L12 6 L9 9Z" fill="#d8b25a" />
                </svg>
              ))}
              <span className="absolute -top-5 left-6 flex items-center">
                <span className="relative z-10 -mr-2 grid size-9 place-items-center rotate-45 border border-[#d8b25a] bg-[#120c06] shadow-[0_0_14px_-2px_rgba(216,178,90,0.7)]" aria-hidden="true">
                  <Sparkle className="size-3 -rotate-45 text-[#f6dc93]" />
                </span>
                <span className="flex items-center gap-3 border-y border-r border-[#d8b25a]/70 bg-gradient-to-b from-[#2a1e10] to-[#0e0a06] py-1.5 pl-5 pr-6 [clip-path:polygon(0_0,100%_0,calc(100%-10px)_50%,100%_100%,0_100%)]">
                  <span className="font-serif text-sm uppercase tracking-[0.3em] text-[#f6dc93]">{npc.name}</span>
                  <span className="text-[11px] italic text-[#e9dcbc]/60">{npc.title}</span>
                </span>
              </span>
              <span className="block rounded-[2px] border border-[#d8b25a]/15 px-6 pb-3 pt-7 sm:px-8">
                <span className="block min-h-[4.5rem] text-pretty text-base leading-relaxed text-[#f3ecdc] sm:text-lg" aria-live="polite">
                  {line.text.slice(0, shown)}
                  {!done && <span className="ml-0.5 inline-block h-5 w-px translate-y-1 bg-[#f6dc93]/80 animate-blink" aria-hidden="true" />}
                </span>
                <span className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] text-[#e9dcbc]/55">
                  <span className="font-mono tabular-nums">
                    {String(index + 1).padStart(2, '0')}/{String(INTRO_SCRIPT.length).padStart(2, '0')}
                  </span>
                  <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#d8b25a]/15" aria-hidden="true">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8a6a2a] to-[#f6dc93] shadow-[0_0_8px_#d8b25a] transition-[width] duration-500"
                      style={{ width: `${((index + 1) / INTRO_SCRIPT.length) * 100}%` }}
                    />
                  </span>
                  <span className={cn('flex items-center gap-2 text-[#f6dc93] transition-opacity', done ? 'opacity-100' : 'opacity-0')}>
                    <kbd className="hidden rounded-sm border border-[#d8b25a]/50 px-1.5 py-0.5 font-mono text-[9px] text-[#e9dcbc]/70 sm:inline">Espaço</kbd>
                    {last ? 'Entrar no DEVO' : 'Continuar'}
                    <span className="animate-blink" aria-hidden="true">
                      ▶
                    </span>
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
