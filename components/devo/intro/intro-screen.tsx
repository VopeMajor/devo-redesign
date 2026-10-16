'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { INTRO_SCRIPT } from '@/lib/devo/intro-script'
import { loadVoiceManifest, playRatoLaugh } from '@/lib/devo/voice'
import { LAST_RATO_LINE } from '@/lib/devo/voice-lines'
import { getNpc, portraitFrameProps, type Expression } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useAdvanceKeys } from '../hooks'
import { GlyphSpark, toRoman } from '../kit/glyphs'
import { PortraitFrame } from '../kit/portrait'
import { SceneBackdrop } from '../kit/scene'
import { TutorialVisualPanel } from './tutorial-visuals'
import { AdvanceIndicator, DialogueShell, SpeakerPlate, VnTopBar, useTypewriter } from './vn'

const CHAR_MS = 24

/** Tom do retrato por falante: todos em aço champanhe (paleta do mármore; ametista só como acento). */
const TONE: Record<string, 'gold' | 'cobalt'> = { rato: 'gold', herdeiro: 'gold' }

/** Retrato do falante no PortraitFrame do kit; todas as expressões ficam montadas e trocam por opacidade. */
function Portrait({ speaker, expression, className }: { speaker: string; expression: Expression; className?: string }) {
  const npc = getNpc(speaker)
  const alt = `${npc.name}, ${npc.title}`
  const exprs = npc.expressions.length ? npc.expressions : (['neutral'] as Expression[])
  const target = exprs.includes(expression) ? expression : 'neutral'
  return (
    <div className={cn('relative', className)}>
      {exprs.map((expr) => {
        const art = portraitFrameProps(speaker, expr)
        if (!art) return null
        const on = expr === target
        return (
          <div key={expr} className={cn('transition-opacity duration-500', on ? 'relative opacity-100' : 'absolute inset-0 opacity-0')} aria-hidden={on ? undefined : true}>
            <PortraitFrame {...art} alt={on ? alt : ''} tone={TONE[speaker] ?? 'gold'} ornate className="w-full" />
          </div>
        )
      })}
    </div>
  )
}

/** Lado de entrada do retrato por falante (o Herdeiro vem da esquerda, o Rato da direita). */
const ENTER_FROM: Record<string, 'l' | 'r'> = { herdeiro: 'l', rato: 'r' }

function PlateAvatar({ speaker, expression }: { speaker: string; expression: Expression }) {
  const art = portraitFrameProps(speaker, expression, 'face')
  if (!art) return null
  return <PortraitFrame {...art} alt="" shape="round" tone={TONE[speaker] ?? 'gold'} className="w-12" />
}

/**
 * Selo "Sistema apresentado": plaqueta negra com filete de aço; a estrela em ametista é o único acento.
 * Duas linhas (rótulo pequeno em cima, nome do sistema embaixo) para nunca quebrar no meio de "Sala de Trocas".
 */
function UnlockSeal({ name, className }: { name: string; className?: string }) {
  return (
    <p
      className={cn(
        'animate-dv-toast-in relative z-10 flex w-fit items-center gap-3 bg-[linear-gradient(90deg,#1f1f22,#151517_70%,rgba(21,21,23,0.92))] py-2 pl-3.5 pr-7 shadow-[0_8px_20px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(186,176,159,0.4)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#ece5d8,#bab09f_50%,#6b6357)]" />
      <GlyphSpark className="size-3.5 shrink-0 text-dv-amethyst" />
      <span className="flex flex-col gap-0.5">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">Sistema apresentado</span>
        <span className="whitespace-nowrap font-display text-[14px] font-semibold uppercase leading-tight tracking-[0.16em] text-dv-porcelain">{name}</span>
      </span>
    </p>
  )
}

export function IntroScreen({ onFinish, playerName }: { onFinish: () => void; playerName: string | null }) {
  const [index, setIndex] = useState(0)
  const script = INTRO_SCRIPT[index]
  const line = { ...script, text: withName(script.text, playerName) }
  const npc = getNpc(line.speaker)
  const isLastRato = index === LAST_RATO_LINE
  // Sem dublagem no tutorial (DIRECAO-2 §5: voz só na cutscene inicial).
  const { shown, done, finish } = useTypewriter(line.text, CHAR_MS)

  useEffect(() => {
    void loadVoiceManifest()
  }, [])

  // O salão entra primeiro no desenho estático do preset; o WebGL só monta depois da cortina e da
  // entrada do salão (en-hall-in: 450ms + 2000ms). Compilar os shaders no meio da animação custava
  // quadros no celular (e travava a captura da cortina no CI, que roda em renderizador por software).
  const [sceneLive, setSceneLive] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSceneLive(true), 2600)
    return () => window.clearTimeout(t)
  }, [])

  // KABUM!: explosão no mesmo instante em que o letreiro bate no diagrama (en-kabum: 760ms).
  useEffect(() => {
    if (line.visual !== 'reveal') return
    const t = window.setTimeout(() => playSfx('explosion'), 760)
    return () => window.clearTimeout(t)
  }, [index, line.visual])

  // A risadinha do Rato ("hihihi") fecha a última fala dele, quando o texto termina de aparecer.
  const laughed = useRef(-1)
  useEffect(() => {
    if (!isLastRato || !done || laughed.current === index) return
    laughed.current = index
    const t = window.setTimeout(playRatoLaugh, 160)
    return () => window.clearTimeout(t)
  }, [done, isLastRato, index])
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
    <main className="en-root relative flex h-dvh overflow-hidden bg-dv-ink text-dv-text">
      {/* Ponte "subindo à superfície": a pedra da mina desce e some enquanto o salão do relógio desce
          do alto para o lugar (a câmera sobe da mina para o salão). */}
      <div aria-hidden="true" className="en-hall-in absolute inset-0">
        <SceneBackdrop preset="clockhall" intensity={0.65} dim={0.5} staticOnly={!sceneLive} />
      </div>
      {/* Mármore, não noite: tira ~80% da saturação do salão (o céu índigo do preset vira grafite).
          A noite violeta fica só como resto de luz. Fica FORA da camada animada (en-hall-in), para a
          mistura não ser refeita junto com a animação. Candidato ao kit: `tone="marble"` no SceneBackdrop. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#7a7a7a] opacity-80 mix-blend-saturation" />
      <div aria-hidden="true" className="en-surface pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <Image src="/images/prologue/mine.webp" alt="" fill sizes="100vw" className="object-cover" style={{ filter: 'grayscale(0.9) sepia(0.12) brightness(0.42) contrast(1.05)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_100%,color-mix(in_oklab,var(--dv-ink)_90%,transparent),transparent_60%)]" />

      <VnTopBar
        skipLabel="Pular introdução"
        onSkip={onFinish}
        chapter={
          <p className="dv-label flex items-center gap-2 text-[10px] text-dv-text-2">
            <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(index + 1)}</span>
            <span className="whitespace-nowrap tracking-[0.14em]">Deadly Vote</span>
          </p>
        }
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:pl-[min(34vw,480px)] lg:pr-10">
        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-16 lg:px-0 lg:pb-8 lg:pt-14">
          {/* No celular a figura assenta logo acima da fala (figura + legenda + fala = uma unidade; o salão fica
              em cima como palco), sem o terço vazio entre elas. No desktop continua centrada. */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-end gap-5 pb-1 pt-4 lg:justify-center lg:py-4">
            {line.visual && (
              <div key={`v-${index}`} className="origin-center [@media(max-height:760px)]:scale-[0.86] [@media(max-height:640px)]:scale-[0.72] [@media(min-height:820px)_and_(max-width:600px)]:mt-6 [@media(min-height:820px)_and_(max-width:600px)]:scale-[1.06]">
                <TutorialVisualPanel visual={line.visual} step={line.step} index={index + 1} />
              </div>
            )}
            {/* Com figura: o selo vira legenda logo abaixo dela (não fica colado à fala). */}
            {line.visual && line.unlock && <UnlockSeal key={`u-${index}`} name={line.unlock} />}
          </div>

          <div className="relative">
            {/* Retrato ancorado à caixa: em cima dela no celular, à esquerda no desktop. Entra pelo lado do falante. */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-full mb-4 flex justify-center transition-[opacity,transform] duration-500 ease-out',
                'lg:inset-x-auto lg:bottom-0 lg:right-full lg:mb-0 lg:mr-8 lg:w-[min(30vw,400px)]',
                line.visual ? 'translate-y-6 opacity-0 lg:translate-y-0 lg:opacity-100' : 'translate-y-0 opacity-100',
              )}
            >
              <div key={line.speaker} className={cn('w-[min(58vw,240px)] lg:w-full', ENTER_FROM[line.speaker] === 'l' ? 'en-portrait-in-l' : 'en-portrait-in-r')}>
                <Portrait speaker={line.speaker} expression={line.expression} className="w-full" />
              </div>
            </div>

            {line.unlock && !line.visual && <UnlockSeal key={`u-${index}`} name={line.unlock} className="mb-8" />}

            <button
              type="button"
              onClick={advance}
              aria-label={done ? (last ? 'Entrar no DEVO' : 'Próxima fala') : 'Mostrar fala completa'}
              className={cn('dv-focus relative z-10 block w-full text-left', !(line.unlock && !line.visual) && 'mt-6')}
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
                      <span className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-porcelain))] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
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
