'use client'

import { Check, ChevronLeft, ChevronRight, FastForward, HelpCircle, Shield, Swords } from 'lucide-react'
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { BrassCorners, HudRule } from '@/components/devo/kit'
import { RARITIES, RARITY_META, getCardMeta, getCollections } from '@/lib/devo/cards'
import type { Rarity } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { CardFace, RARITY_SKIN, RarityGem, RarityPips } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { CorujaSprite, type CorujaExpression } from './coruja-sprite'

type Visual = 'cards' | 'rarities' | 'secret' | 'roles' | 'collections' | 'numbers'
type Chapter = 'Apresentação' | 'Raridades' | 'Segredos' | 'Funções' | 'Coleções'

type Step =
  | { kind: 'line'; text: string; visual?: Visual; face: CorujaExpression; chapter: Chapter }
  | { kind: 'choice'; chapter: Chapter }
  | { kind: 'quiz'; chapter: Chapter }
  | { kind: 'system'; text: string; chapter: Chapter }

const CHAPTERS: Chapter[] = ['Apresentação', 'Raridades', 'Segredos', 'Funções', 'Coleções']

const line = (chapter: Chapter, text: string, face: CorujaExpression, visual?: Visual): Step => ({ kind: 'line', text, visual, face, chapter })

const SCRIPT: Step[] = [
  line('Apresentação', 'Um Record, hm? Você não é nada mal. Até que gosto. Que rosto interessante.', 'warai'),
  line('Apresentação', 'Eu me chamo Coruja, mas pode me chamar como bem quiser.', 'warai2'),
  line('Apresentação', 'Estas são as Cartas Devo. Você já deve ter ouvido falar delas, não é?', 'majime', 'cards'),
  line('Raridades', `As Cartas Devo são separadas por diferentes tipos de raridade: ${RARITIES.map((r) => RARITY_META[r].plural).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`, 'majime', 'rarities'),
  line('Raridades', 'Essas últimas sendo mais… raras. Repetitivo, não?', 'komaru', 'rarities'),
  line('Raridades', 'Por sorte, todas também estão separadas por cores. Você pode saber a raridade de uma apenas notando esse detalhe.', 'warai', 'rarities'),
  line('Raridades', 'Vamos ver se você prestou atenção.', 'warai2', 'rarities'),
  { kind: 'quiz', chapter: 'Raridades' },
  line('Segredos', 'Ah, é verdade…', 'odoroki'),
  line('Segredos', 'Ainda há outras duas raridades.', 'majime'),
  line('Segredos', 'Geralmente eu mantenho em segredo, mas eu gostei de você.', 'warai2'),
  line('Segredos', 'Cartas Únicas e Promocionais. Essas são as mais difíceis de se encontrar. Você pode nunca ter a chance de ver uma na vida, não importa quanto se esforce.', 'majime', 'secret'),
  line('Segredos', 'Jogos comuns não costumam oferecer cartas de tal patamar. Para elas, a régua é muito mais alta.', 'fuman', 'secret'),
  { kind: 'choice', chapter: 'Segredos' },
  line('Funções', 'Além da raridade atribuída, existem outras formas de distribuição detalhadas no sistema. Algumas cartas são feitas para suporte, outras para ataques.', 'majime', 'roles'),
  line('Funções', 'Há até mesmo aquelas que parecem ser completamente inúteis, mas isso é pura questão de perspectiva.', 'warai', 'roles'),
  line('Coleções', 'A Coleção Arcana também é um fator importante para uma Carta.', 'majime', 'collections'),
  line('Coleções', `Diferentes tipos de Carta ocupam diferentes Coleções Arcanas, como ${getCollections().slice(0, 3).map((c) => c.name).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`, 'warai', 'collections'),
  line('Coleções', 'Toda Carta contém um número que representa sua Ordem na Coleção. O outro, mais contido, é o universal de série: seu lugar no que chamamos de Compêndio.', 'majime', 'numbers'),
  line('Coleções', 'Isso pode representar formas úteis ou até um pouco estranhas de se usar uma carta em conexão com outra, como combinações, apoio ou até descarte.', 'komaru', 'collections'),
  line('Coleções', 'Por conta disso, muitos Records buscam reunir o máximo possível de Cartas de uma mesma Coleção Arcana.', 'majime', 'collections'),
  line('Coleções', 'Há também outro motivo… ainda que, no momento, eu não possa te dizer qual.', 'fuman'),
  line('Coleções', 'À medida que você for evoluindo, novas possibilidades se abrirão diante dos seus olhos. E eu espero que você os tenha bem abertos quando esse momento chegar, meu querido Record.', 'warai2'),
  { kind: 'system', text: 'A Coruja desaparece sem se despedir adequadamente.', chapter: 'Coleções' },
]

const QUESTIONS: { id: string; prompt: string; reply: string; face: CorujaExpression }[] = [
  { id: 'quem', prompt: 'Quem é você?', reply: 'Já se esqueceu? Eu sou Coruja.', face: 'warai' },
  { id: 'unicas', prompt: 'Como posso obter cartas Únicas ou Promocionais?', reply: 'Esse é um conhecimento que não te convém agora.', face: 'fuman' },
  { id: 'sair', prompt: 'Não existe mesmo uma forma de sair desse lugar?', reply: 'Quem sabe…?', face: 'warai2' },
]

// Nomes, cores e ordem vêm de RARITY_META (lib/devo/cards.ts); aqui só as falas da Coruja.
const RARITY_HINTS: Record<(typeof RARITIES)[number], string> = {
  comum: 'O que circula de mão em mão.',
  incomum: 'Já vale uma boa conversa.',
  rara: 'Poucos aceitam trocá-la.',
  lendaria: 'Gente já mentiu por menos.',
}

const RARITY_TIERS = RARITIES.map((r) => ({ id: r as Rarity, label: RARITY_META[r].label, hint: RARITY_HINTS[r] }))

// As duas raridades "secretas" não existem no inventário: pedras próprias, fora de RARITY_META.
const SECRET_TIERS = [
  { id: 'unica', label: 'Única', hint: 'Existe apenas uma.', gem: ['#ffffff', '#f1f0ee', '#b9b6c4'] as const },
  { id: 'promo', label: 'Promocional', hint: 'Nenhum jogo comum a entrega.', gem: ['#efeafd', '#6f63b0', '#1d1838'] as const },
]

const QUIZ_TARGET = RARITY_TIERS.find((t) => t.id === 'rara') ?? RARITY_TIERS[0]

const TYPE_SPEED_MS = 18

function useTypewriter(text: string) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    setCount(0)
    if (!text) return
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, TYPE_SPEED_MS)
    return () => window.clearInterval(id)
  }, [text])
  return { shown: text.slice(0, count), done: count >= text.length, finish: () => setCount(text.length) }
}

export function CorujaIntro() {
  const { state, dispatch } = useDevo()
  const [index, setIndex] = useState(0)
  const [reply, setReply] = useState<{ text: string; face: CorujaExpression } | null>(null)
  const [asked, setAsked] = useState<string[]>([])
  const [quiz, setQuiz] = useState<{ picked: string; correct: boolean } | null>(null)
  const [leaving, setLeaving] = useState(false)

  const step = SCRIPT[index]
  const lastVisual = [...SCRIPT.slice(0, index + 1)].reverse().find((s): s is Extract<Step, { kind: 'line' }> => s.kind === 'line' && !!s.visual)?.visual
  const visual = step.kind === 'line' ? step.visual : step.kind === 'system' ? undefined : step.kind === 'quiz' ? 'rarities' : lastVisual
  const sampleCards = Array.from(new Set(state.inventory.map((c) => c.cardId))).slice(0, 3)

  const face: CorujaExpression =
    step.kind === 'line'
      ? step.face
      : step.kind === 'choice'
        ? (reply?.face ?? 'majime')
        : step.kind === 'quiz'
          ? quiz
            ? quiz.correct
              ? 'warai2'
              : 'komaru'
            : 'majime'
          : 'majime'

  const spoken =
    step.kind === 'line'
      ? step.text
      : step.kind === 'choice'
        ? (reply?.text ?? '')
        : step.kind === 'quiz'
          ? quiz
            ? quiz.correct
              ? 'Bons olhos. Guarde essa cor, ela vai te poupar de muitas mentiras.'
              : 'Não. Olhe de novo… com mais calma.'
            : 'Esta pedra tem a cor de qual raridade?'
          : step.text
  const typer = useTypewriter(spoken)

  const chapterIndex = CHAPTERS.indexOf(step.chapter)
  const isLast = index === SCRIPT.length - 1
  const blocked = step.kind === 'quiz' && !quiz?.correct

  const finish = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => dispatch({ type: 'OWL_MET' }), 900)
  }, [dispatch])

  const advance = useCallback(() => {
    if (leaving) return
    if (!typer.done) {
      typer.finish()
      return
    }
    if (blocked) return
    playSfx('click')
    setReply(null)
    setQuiz(null)
    if (isLast) finish()
    else setIndex((i) => i + 1)
  }, [leaving, typer, blocked, isLast, finish])

  const back = useCallback(() => {
    if (leaving || index === 0) return
    playSfx('click')
    setReply(null)
    setQuiz(null)
    let prev = index - 1
    while (prev > 0 && SCRIPT[prev].kind === 'quiz') prev--
    setIndex(prev)
  }, [leaving, index])

  useAdvanceKeys(advance, { onBack: back, arrows: true })

  const ask = (q: (typeof QUESTIONS)[number]) => {
    playSfx('click')
    setReply({ text: q.reply, face: q.face })
    setAsked((a) => (a.includes(q.id) ? a : [...a, q.id]))
  }

  const answer = (id: string) => {
    if (quiz?.correct) return
    const correct = id === QUIZ_TARGET.id
    playSfx(correct ? 'confirm' : 'error')
    setQuiz({ picked: id, correct })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coruja"
      className={cn('dv-interior-dark absolute inset-0 z-20 flex animate-dv-fade flex-col overflow-hidden bg-[#0a0a0c] transition-opacity duration-700', leaving && 'opacity-0')}
    >
      {/* salão de mármore negro: veios, luz de vela fria vinda do alto e xadrez quase invisível no chão */}
      <div aria-hidden="true" className="dv-marble-dark pointer-events-none absolute inset-0 opacity-80" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_18%,rgba(236,229,216,0.09),transparent_70%),radial-gradient(60%_40%_at_15%_85%,rgba(111,107,130,0.14),transparent_70%)]" />
      <div aria-hidden="true" className="dv-checker-faint pointer-events-none absolute inset-x-0 bottom-0 h-2/5 opacity-50 [mask-image:linear-gradient(to_top,#000,transparent)]" />

      <header className="relative z-10 flex items-center gap-3 px-4 pt-3 @md:px-5">
        <ol className="flex flex-1 items-center gap-1.5" aria-label="Lições">
          {CHAPTERS.map((c, i) => (
            <li key={c} className="flex flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  'relative h-[3px] transition-all duration-500',
                  i < chapterIndex ? 'bg-[#a59d90]' : i === chapterIndex ? 'bg-[#eeedeb] shadow-[0_0_10px_rgba(138,124,200,0.8)]' : 'bg-white/15',
                )}
              />
              <span className={cn('hidden truncate font-sans text-[10px] font-medium uppercase tracking-[0.16em] @lg:block', i === chapterIndex ? 'text-[#eeedeb]' : 'text-white/40')}>{c}</span>
              <span className="sr-only">{i < chapterIndex ? 'concluída' : i === chapterIndex ? 'atual' : 'pendente'}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => {
            playSfx('click')
            finish()
          }}
          className="dv-focus flex min-h-11 items-center gap-1.5 px-3 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 shadow-[inset_0_0_0_1px_rgba(238,237,235,0.22)] transition-colors hover:text-white hover:shadow-[inset_0_0_0_1px_#bab09f]"
        >
          <FastForward className="size-3.5" aria-hidden="true" />
          Pular
        </button>
      </header>

      <p className="relative z-10 px-4 pt-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-white/55 @lg:hidden" aria-hidden="true">
        Lição {ROMAN_CH[chapterIndex]} · {step.chapter}
      </p>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 @2xl:pr-[40%]">
        {visual && (
          <div key={visual} className="relative z-10 w-full max-w-md animate-dv-rise">
            <SceneFrame>
              <SceneVisual visual={visual} sampleCards={sampleCards} quiz={step.kind === 'quiz' ? { picked: quiz?.picked ?? null, correct: !!quiz?.correct, onAnswer: answer } : null} />
            </SceneFrame>
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-0 right-1/2 h-[78%] w-[22rem] translate-x-1/2 transition-all duration-700 @2xl:right-0 @2xl:h-[96%] @2xl:w-[46%] @2xl:translate-x-0',
          step.kind === 'system' && 'opacity-0 blur-sm',
          visual && 'opacity-[0.22] @2xl:opacity-100',
        )}
        style={{ maskImage: 'linear-gradient(to top, transparent 0%, #000 18%)' }}
      >
        <CorujaSprite expression={face} className="h-full w-full drop-shadow-[0_0_30px_rgba(236,229,216,0.08)]" />
      </div>

      <div className="relative z-10 px-3 pb-3 @md:px-5 @md:pb-5">
        <DialogueBox speaker={step.kind === 'system' ? null : 'Coruja'}>
          {step.kind === 'system' ? (
            <p className="py-3 text-center font-sans text-[12px] font-medium uppercase tracking-[0.24em] text-white/70">{typer.shown}</p>
          ) : (
            <p className="min-h-[3.5rem] font-serif text-[19px] leading-relaxed text-[#eeedeb] @md:text-xl" aria-live="polite">
              {spoken ? (
                <>
                  {typer.shown}
                  {!typer.done && <span className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-blink bg-[#cbc5e8]" aria-hidden="true" />}
                </>
              ) : (
                <span className="italic text-white/60">Pergunte o que quiser. Ou não.</span>
              )}
            </p>
          )}

          {step.kind === 'choice' && (
            <ul className="mt-3 grid gap-1.5 @lg:grid-cols-3" aria-label="Escolhas de diálogo">
              {QUESTIONS.map((q) => {
                const done = asked.includes(q.id)
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => ask(q)}
                      className={cn(
                        'dv-focus group flex h-full min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left font-sans text-[14px] leading-snug transition-colors',
                        done ? 'text-white/45 shadow-[inset_0_0_0_1px_rgba(238,237,235,0.1)]' : 'text-[#eeedeb] shadow-[inset_0_0_0_1px_rgba(238,237,235,0.28)] hover:bg-white/[0.05] hover:shadow-[inset_0_0_0_1px_#bab09f]',
                      )}
                    >
                      <HelpCircle className={cn('size-4 shrink-0', done ? 'text-white/30' : 'text-[#cbc5e8]')} aria-hidden="true" />
                      {q.prompt}
                      {done && <span className="sr-only"> (já perguntado)</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-2.5">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              className="dv-focus flex min-h-11 items-center gap-1 pr-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Voltar
            </button>
            <span className="hidden items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-white/40 @md:flex" aria-hidden="true">
              <kbd className="px-1.5 py-0.5 font-mono shadow-[inset_0_0_0_1px_rgba(238,237,235,0.25)]">Espaço</kbd>
              avançar
            </span>
            <button
              type="button"
              onClick={advance}
              disabled={typer.done && blocked}
              className="dv-focus dv-cut-diag flex min-h-11 items-center gap-1.5 bg-[#eeedeb] px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0c0c0e] transition-[background-color,box-shadow] hover:bg-white hover:shadow-[0_0_22px_-4px_rgba(138,124,200,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ '--dv-cut': '10px' } as CSSProperties}
            >
              {!typer.done ? 'Mostrar' : blocked ? 'Responda' : isLast ? 'Fechar' : 'Continuar'}
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </DialogueBox>
      </div>
    </div>
  )
}

const ROMAN_CH = ['I', 'II', 'III', 'IV', 'V']

/** Caixa de fala: veludo negro, filete de aço por dentro e plaqueta de porcelana com o nome. */
function DialogueBox({ speaker, children }: { speaker: string | null; children: ReactNode }) {
  return (
    <div className="dv-record-panel relative px-4 pb-2 pt-6 shadow-[0_24px_50px_-20px_rgba(0,0,0,1)] @md:px-6">
      <BrassCorners size={22} inset={3} />
      {speaker && (
        <span className="dv-porcelain absolute -top-3.5 left-5 flex items-center gap-2 px-4 py-1 font-serif text-[15px] uppercase tracking-[0.3em] text-[#0c0c0e] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(13,13,15,0.25)] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,8px_100%,0_50%)]">
          {speaker}
        </span>
      )}
      {children}
    </div>
  )
}

/** Vitrine da lição: painel de veludo com régua de HUD no topo. */
function SceneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="dv-record-panel relative px-5 pb-5 pt-4 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.95)] @md:px-7">
      <HudRule label="Cartas DEVO · aula" code="OWL" className="mb-4 opacity-80" />
      {children}
    </div>
  )
}

/** Pedra + nome + losangos (+ dica). Como botão (quiz) mostra só o nome, para não entregar a resposta. */
function TierTile({
  rarity,
  label,
  hint,
  gem,
  onSelect,
  state,
}: {
  rarity?: Rarity
  label: string
  hint?: string
  gem?: readonly [string, string, string]
  onSelect?: () => void
  state?: 'right' | 'wrong' | null
}) {
  const light = rarity ? RARITY_SKIN[rarity].light : '#eeedeb'
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'dv-focus relative flex min-h-12 w-full items-center justify-center px-2 font-sans text-[12px] font-medium uppercase tracking-[0.16em] transition-colors',
          state === 'right'
            ? 'bg-[#eeedeb] text-[#0c0c0e] shadow-[0_0_20px_-4px_rgba(138,124,200,0.8)]'
            : state === 'wrong'
              ? 'text-[#ff8a92] shadow-[inset_0_0_0_1px_#a3121f]'
              : 'text-[#eeedeb] shadow-[inset_0_0_0_1px_rgba(238,237,235,0.28)] hover:bg-white/[0.05] hover:shadow-[inset_0_0_0_1px_#bab09f]',
        )}
      >
        {label}
        {state === 'right' && <Check className="absolute right-2.5 size-4" aria-hidden="true" />}
      </button>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2 px-2 pb-3 pt-3.5 text-center shadow-[inset_0_0_0_1px_rgba(238,237,235,0.12)]">
      {rarity ? <RarityGem rarity={rarity} className="h-12 w-8" /> : gem ? <LooseGem colors={gem} className="h-12 w-8" /> : null}
      <span className="mt-0.5 font-sans text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: light }}>
        {label}
      </span>
      {rarity && <RarityPips rarity={rarity} className="text-[9px]" style={{ color: light }} />}
      {hint && <span className="font-serif text-[14px] italic leading-snug text-white/65">{hint}</span>}
    </div>
  )
}

/** Pedra avulsa (raridades secretas): mesmo desenho do RarityGem, com engaste de prata. */
function LooseGem({ colors, className }: { colors: readonly [string, string, string]; className?: string }) {
  const [hi, mid, lo] = colors
  return (
    <svg viewBox="0 0 32 48" className={cn('drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]', className)} aria-hidden="true">
      <path d="M16 0.8 L31.2 24 L16 47.2 L0.8 24 Z" fill="#c9c6d0" />
      <path d="M16 3.8 L28.4 24 L16 44.2 L3.6 24 Z" fill="#0a090e" />
      <path d="M16 5 L27.2 24 L16 24 Z" fill={mid} />
      <path d="M16 5 L4.8 24 L16 24 Z" fill={hi} />
      <path d="M4.8 24 L16 43 L16 24 Z" fill={mid} />
      <path d="M27.2 24 L16 43 L16 24 Z" fill={lo} />
      <path d="M16 15 L21.5 24 L16 33 L10.5 24 Z" fill={mid} />
      <path d="M10 15 L12 13 L13 17 Z" fill="#fff" opacity="0.85" />
    </svg>
  )
}

type QuizProps = { picked: string | null; correct: boolean; onAnswer: (id: string) => void } | null

function SceneVisual({ visual, sampleCards, quiz }: { visual: Visual; sampleCards: string[]; quiz: QuizProps }) {
  if (quiz) {
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid place-items-center">
          <span aria-hidden="true" className="absolute size-28 rounded-full bg-[radial-gradient(closest-side,rgba(138,124,200,0.35),transparent)] animate-dv-breathe" />
          <RarityGem rarity={QUIZ_TARGET.id} title="Pedra de raridade misteriosa" className="relative h-24 w-16" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          {RARITY_TIERS.map((t) => (
            <TierTile
              key={t.id}
              label={t.label}
              onSelect={() => quiz.onAnswer(t.id)}
              state={quiz.picked === t.id ? (quiz.correct ? 'right' : 'wrong') : quiz.correct && t.id === QUIZ_TARGET.id ? 'right' : null}
            />
          ))}
        </div>
      </div>
    )
  }
  if (visual === 'cards') {
    return (
      <div className="relative flex h-56 items-end justify-center">
        <span className="absolute inset-x-6 bottom-0 h-12 rounded-[50%] bg-[radial-gradient(closest-side,rgba(236,229,216,0.18),transparent)] blur-md" aria-hidden="true" />
        {sampleCards.map((id, i) => (
          <div
            key={id}
            className={cn('-mx-2.5 w-[5.6rem] origin-bottom animate-dv-rise @md:w-24', i === 1 && 'z-10')}
            style={{ transform: `rotate(${(i - 1) * 11}deg) translateY(${i === 1 ? -14 : 0}px)`, animationDelay: `${i * 120}ms` }}
          >
            <CardFace cardId={id} size="sm" />
          </div>
        ))}
      </div>
    )
  }
  if (visual === 'rarities') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="grid w-full grid-cols-2 gap-2">
          {RARITY_TIERS.map((t, i) => (
            <div key={t.id} className="animate-dv-rise" style={{ animationDelay: `${i * 90}ms` }}>
              <TierTile rarity={t.id} label={t.label} hint={t.hint} />
            </div>
          ))}
        </div>
        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">A cor e os losangos revelam a raridade</span>
      </div>
    )
  }
  if (visual === 'secret') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="grid w-full grid-cols-2 gap-2">
          {SECRET_TIERS.map((t, i) => (
            <div key={t.id} className="animate-dv-rise" style={{ animationDelay: `${i * 110}ms` }}>
              <TierTile label={t.label} hint={t.hint} gem={t.gem} />
            </div>
          ))}
        </div>
        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">Raridades ocultas</span>
      </div>
    )
  }
  if (visual === 'roles') {
    const roles = [
      { label: 'Suporte', icon: Shield, hint: 'Protege e prolonga.' },
      { label: 'Ataque', icon: Swords, hint: 'Tira de quem tem.' },
      { label: 'Inútil?', icon: HelpCircle, hint: 'Depende de quem olha.' },
    ]
    return (
      <div className="grid grid-cols-3 gap-2">
        {roles.map(({ label, icon: Icon, hint }, i) => (
          <div key={label} className="flex animate-dv-rise flex-col items-center gap-2 px-1.5 pb-3 pt-3.5 text-center shadow-[inset_0_0_0_1px_rgba(238,237,235,0.12)]" style={{ animationDelay: `${i * 100}ms` }}>
            <span className="grid size-12 place-items-center rounded-full p-[2px]" style={{ background: RARITY_SKIN.incomum.frame }}>
              <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#2c2c31,#0c0c0e_72%)] text-[#eeedeb]">
                <Icon className="size-5" strokeWidth={1.4} aria-hidden="true" />
              </span>
            </span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#eeedeb]">{label}</span>
            <span className="font-serif text-[13px] italic leading-snug text-white/65">{hint}</span>
          </div>
        ))}
      </div>
    )
  }
  if (visual === 'collections') {
    return (
      <ul className="flex flex-col">
        {getCollections().map((c, i) => (
          <li key={c.name} className={cn('flex animate-dv-rise items-center gap-3 py-2.5', i > 0 && 'border-t border-white/10')} style={{ animationDelay: `${i * 100}ms` }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full p-[1.5px]" style={{ background: RARITY_SKIN.incomum.frame }}>
              <span className="grid size-full place-items-center rounded-full bg-[#0c0c0e] font-serif text-[15px] text-[#eeedeb]">{ROMAN_CH[i] ?? i + 1}</span>
            </span>
            <span className="flex-1 font-serif text-[19px] leading-tight text-[#eeedeb]">{c.name}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{c.size} cartas</span>
          </li>
        ))}
      </ul>
    )
  }
  const sampleId = sampleCards[0] ?? 'ampulheta'
  const sampleMeta = getCardMeta(sampleId)
  return (
    <div className="flex items-center gap-5">
      <div className="w-28 shrink-0 @md:w-32">
        <CardFace cardId={sampleId} size="sm" />
      </div>
      <dl className="flex min-w-0 flex-col gap-4">
        <div className="border-l border-[#bab09f] pl-3">
          <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">Ordem na Coleção</dt>
          <dd className="font-serif text-[34px] font-light leading-none tabular-nums text-[#eeedeb]">{sampleMeta.orderLabel}</dd>
          <dd className="mt-1 font-sans text-[11px] uppercase tracking-[0.14em] text-white/65">{sampleMeta.collection}</dd>
        </div>
        <div className="border-l border-white/25 pl-3">
          <dt className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">Série universal</dt>
          <dd className="font-mono text-[14px] tracking-[0.08em] text-white/80">{sampleMeta.serial}</dd>
        </div>
      </dl>
    </div>
  )
}
