'use client'

import { ChevronLeft, ChevronRight, FastForward, Gem, HelpCircle, Shield, Sparkles, Swords } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { RARITIES, RARITY_META, getCardMeta, getCollections } from '@/lib/devo/cards'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { CardFace } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { CorujaSprite, type CorujaExpression } from './coruja-sprite'

const GOLD = '#d8b25a'

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

const RARITY_TIERS = RARITIES.map((r) => ({ id: r as string, label: RARITY_META[r].label, color: RARITY_META[r].color, hint: RARITY_HINTS[r] }))

const SECRET_TIERS = [
  { id: 'unica', label: 'Única', color: '#e9e4f7', hint: 'Existe apenas uma.' },
  { id: 'promo', label: 'Promocional', color: '#8f6bff', hint: 'Nenhum jogo comum a entrega.' },
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
      className={cn('absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#05060c] transition-opacity duration-700', leaving && 'opacity-0')}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(216,178,90,0.12),transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(138,124,200,0.08),transparent_55%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#d8b25a_1px,transparent_1px)] [background-size:22px_22px]" />

      <header className="relative z-10 flex items-center gap-3 px-4 pt-3 @md:px-5">
        <ol className="flex flex-1 items-center gap-1.5" aria-label="Lições">
          {CHAPTERS.map((c, i) => (
            <li key={c} className="flex flex-1 flex-col gap-1">
              <span
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  i < chapterIndex ? 'bg-[#d8b25a]' : i === chapterIndex ? 'bg-[#f6dc93] shadow-[0_0_10px_#d8b25a]' : 'bg-foreground/15',
                )}
              />
              <span className={cn('hidden truncate text-[9px] uppercase tracking-[0.25em] @lg:block', i === chapterIndex ? 'text-[#f6dc93]' : 'text-foreground/35')}>
                {c}
              </span>
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
          className="flex items-center gap-1.5 rounded-sm border border-foreground/15 bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55 transition-colors hover:border-[#d8b25a]/60 hover:text-[#f6dc93]"
        >
          <FastForward className="size-3" aria-hidden="true" />
          Pular
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 @2xl:pr-[40%]">
        {visual && (
          <div key={visual} className="relative animate-pop">
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
          visual && 'opacity-25 @2xl:opacity-100',
        )}
        style={{ maskImage: 'linear-gradient(to top, transparent 0%, #000 18%)' }}
      >
        <CorujaSprite expression={face} className="h-full w-full drop-shadow-[0_0_30px_rgba(216,178,90,0.15)]" />
      </div>

      <div className="relative z-10 p-3 @md:p-5">
        <DialogueBox speaker={step.kind === 'system' ? null : 'Coruja'}>
          {step.kind === 'system' ? (
            <p className="py-3 text-center font-sans text-xs uppercase tracking-[0.3em] text-[#aab6dc]/75">{typer.shown}</p>
          ) : (
            <p className="min-h-[3.5rem] font-serif text-lg leading-relaxed text-[#e6ebf7] @md:text-xl" aria-live="polite">
              {spoken ? (
                <>
                  {typer.shown}
                  {!typer.done && <span className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-blink bg-[#f6dc93]" aria-hidden="true" />}
                </>
              ) : (
                <span className="italic text-[#aab6dc]/70">Pergunte o que quiser. Ou não.</span>
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
                        'group flex h-full w-full items-center gap-2.5 rounded-sm border px-3 py-2 text-left text-sm transition-all hover:-translate-y-0.5',
                        done ? 'border-foreground/10 bg-black/30 text-foreground/45' : 'border-[#d8b25a]/35 bg-[#1a140c]/80 text-[#e6ebf7]/90 hover:border-[#d8b25a] hover:bg-[#d8b25a]/10',
                      )}
                    >
                      <HelpCircle className={cn('size-4 shrink-0', done ? 'text-foreground/30' : 'text-[#d8b25a]')} aria-hidden="true" />
                      {q.prompt}
                      {done && <span className="sr-only"> (já perguntado)</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#d8b25a]/15 pt-2.5">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-[#aab6dc]/55 transition-colors hover:text-[#f6dc93] disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              Voltar
            </button>
            <span className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-[#aab6dc]/35 @md:flex" aria-hidden="true">
              <kbd className="rounded-sm border border-foreground/20 px-1.5 py-0.5 font-mono">Espaço</kbd>
              avançar
            </span>
            <button
              type="button"
              onClick={advance}
              disabled={typer.done && blocked}
              className="flex items-center gap-1.5 rounded-sm border border-[#d8b25a]/60 bg-[#d8b25a]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f1dfae] transition-colors hover:bg-[#d8b25a]/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!typer.done ? 'Mostrar' : blocked ? 'Responda' : isLast ? 'Fechar' : 'Continuar'}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </DialogueBox>
      </div>
    </div>
  )
}

function Corner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('pointer-events-none absolute size-7', className)} aria-hidden="true">
      <path d="M2 38 V10 Q2 2 10 2 H38" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <path d="M10 10 L14 6 L18 10 L14 14Z" fill={GOLD} />
    </svg>
  )
}

function DialogueBox({ speaker, children }: { speaker: string | null; children: ReactNode }) {
  return (
    <div className="relative rounded-sm border border-[#d8b25a]/45 bg-[linear-gradient(180deg,rgba(18,16,24,0.96),rgba(7,8,14,0.97))] px-4 pb-3 pt-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,1),inset_0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md @md:px-6">
      <span className="pointer-events-none absolute inset-1 rounded-sm border border-[#d8b25a]/10" aria-hidden="true" />
      <Corner className="left-0 top-0" />
      <Corner className="right-0 top-0 rotate-90" />
      <Corner className="bottom-0 right-0 rotate-180" />
      <Corner className="bottom-0 left-0 -rotate-90" />
      {speaker && (
        <span className="absolute -top-3.5 left-6 flex items-center gap-2 border border-[#d8b25a] bg-[linear-gradient(180deg,#3a2a12,#140e07)] px-4 py-1 font-serif text-sm uppercase tracking-[0.3em] text-[#f6dc93] shadow-[0_0_16px_-4px_rgba(216,178,90,0.8)] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,8px_100%,0_50%)]">
          {speaker}
        </span>
      )}
      {children}
    </div>
  )
}

function SceneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-sm border border-[#d8b25a]/35 bg-[radial-gradient(ellipse_at_50%_0%,rgba(40,30,18,0.85),rgba(8,8,12,0.9)_70%)] px-6 py-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95),0_0_60px_-30px_rgba(216,178,90,0.6)] @md:px-8">
      <Corner className="left-0 top-0" />
      <Corner className="right-0 top-0 rotate-90" />
      <Corner className="bottom-0 right-0 rotate-180" />
      <Corner className="bottom-0 left-0 -rotate-90" />
      {children}
    </div>
  )
}

type Tier = { id: string; label: string; color: string; hint: string }

function TierGem({ tier, active, onSelect, state }: { tier: Tier; active?: boolean; onSelect?: () => void; state?: 'right' | 'wrong' | null }) {
  const Comp = onSelect ? 'button' : 'div'
  return (
    <Comp
      {...(onSelect ? { type: 'button' as const, onClick: onSelect } : {})}
      className={cn(
        'group flex w-28 flex-col items-center gap-2 rounded-sm border px-2 pb-2.5 pt-3 text-center transition-all',
        onSelect && 'hover:-translate-y-1',
        state === 'right' ? 'border-emerald-300/80 bg-emerald-300/10' : state === 'wrong' ? 'border-dv-red/80 bg-dv-red/10' : 'border-foreground/10 bg-black/30 hover:border-foreground/30',
        active && 'border-[#d8b25a]/70',
      )}
    >
      <span
        className="relative size-10 rotate-45 rounded-[3px] transition-transform group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, #ffffffaa, ${tier.color} 40%, ${tier.color}88)`, boxShadow: `0 0 18px ${tier.color}aa, inset 0 0 6px #0008` }}
        aria-hidden="true"
      />
      <span className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: onSelect ? '#e6ebf7' : tier.color }}>
        {tier.label}
      </span>
      {!onSelect && <span className="text-[10px] leading-snug text-[#aab6dc]/65">{tier.hint}</span>}
    </Comp>
  )
}

type QuizProps = { picked: string | null; correct: boolean; onAnswer: (id: string) => void } | null

function SceneVisual({ visual, sampleCards, quiz }: { visual: Visual; sampleCards: string[]; quiz: QuizProps }) {
  if (quiz) {
    return (
      <div className="flex flex-col items-center gap-5">
        <span
          className="size-16 rotate-45 rounded-md animate-pulse"
          style={{ background: `linear-gradient(135deg, #ffffffaa, ${QUIZ_TARGET.color} 40%, ${QUIZ_TARGET.color}88)`, boxShadow: `0 0 34px ${QUIZ_TARGET.color}` }}
          aria-label="Pedra de raridade misteriosa"
          role="img"
        />
        <div className="flex flex-wrap justify-center gap-2">
          {RARITY_TIERS.map((t) => (
            <TierGem
              key={t.id}
              tier={{ ...t, color: '#8a8fa3' }}
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
      <div className="relative flex h-56 items-end justify-center gap-3">
        <span className="absolute inset-x-4 bottom-0 h-14 rounded-full bg-[radial-gradient(ellipse,rgba(216,178,90,0.35),transparent_70%)] blur-md" aria-hidden="true" />
        {sampleCards.map((id, i) => (
          <div key={id} className={cn('-mx-3 w-20 origin-bottom animate-pop @md:w-24', i === 1 && 'z-10 drop-shadow-[0_0_18px_rgba(216,178,90,0.55)]')} style={{ transform: `rotate(${(i - 1) * 12}deg) translateY(${i === 1 ? -14 : 0}px)`, animationDelay: `${i * 140}ms` }}>
            <CardFace cardId={id} size="sm" />
          </div>
        ))}
      </div>
    )
  }
  if (visual === 'rarities' || visual === 'secret') {
    const tiers = visual === 'rarities' ? RARITY_TIERS : SECRET_TIERS
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {tiers.map((t, i) => (
            <div key={t.id} className="animate-pop" style={{ animationDelay: `${i * 120}ms` }}>
              <TierGem tier={t} />
            </div>
          ))}
        </div>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#e9dcbc]/60">
          {visual === 'secret' ? <Sparkles className="size-3 text-[#d8b25a]" aria-hidden="true" /> : <Gem className="size-3 text-[#d8b25a]" aria-hidden="true" />}
          {visual === 'secret' ? 'Raridades ocultas' : 'A cor revela a raridade'}
        </span>
      </div>
    )
  }
  if (visual === 'roles') {
    const roles = [
      { label: 'Suporte', color: '#5f86ff', icon: Shield, hint: 'Protege e prolonga.' },
      { label: 'Ataque', color: '#d4161f', icon: Swords, hint: 'Tira de quem tem.' },
      { label: 'Inútil?', color: '#8a8fa3', icon: HelpCircle, hint: 'Depende de quem olha.' },
    ]
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {roles.map(({ label, color, icon: Icon, hint }, i) => (
          <div key={label} className="flex w-28 flex-col items-center gap-2 rounded-sm border bg-black/30 px-2 py-3 text-center animate-pop" style={{ borderColor: `${color}66`, animationDelay: `${i * 120}ms` }}>
            <span className="grid size-11 place-items-center rounded-full border" style={{ borderColor: color, boxShadow: `0 0 16px -2px ${color}` }}>
              <Icon className="size-5" style={{ color }} aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
              {label}
            </span>
            <span className="text-[10px] text-[#aab6dc]/65">{hint}</span>
          </div>
        ))}
      </div>
    )
  }
  if (visual === 'collections') {
    return (
      <ul className="flex flex-col items-stretch gap-2">
        {getCollections().map((c) => ({ name: c.name, count: `${c.size} cartas` })).map((c, i) => (
          <li key={c.name} className="flex items-center gap-4 rounded-sm border border-[#d8b25a]/30 bg-[#140f0a]/80 px-4 py-2 animate-pop" style={{ animationDelay: `${i * 140}ms` }}>
            <span className="grid size-8 place-items-center rounded-full border border-[#d8b25a]/60 font-serif text-sm text-[#f6dc93]">{['I', 'II', 'III', 'IV', 'V', 'VI'][i] ?? i + 1}</span>
            <span className="flex-1 font-serif text-lg text-[#e6ebf7]/90">{c.name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#aab6dc]/55">{c.count}</span>
          </li>
        ))}
      </ul>
    )
  }
  const sampleId = sampleCards[0] ?? 'ampulheta'
  const sampleMeta = getCardMeta(sampleId)
  return (
    <div className="flex items-center gap-5">
      <div className="w-24 @md:w-28">
        <CardFace cardId={sampleId} size="sm" />
      </div>
      <dl className="flex flex-col gap-3">
        <div className="border-l-2 border-[#d8b25a] pl-3">
          <dt className="text-[10px] uppercase tracking-[0.25em] text-[#aab6dc]/60">Ordem na Coleção</dt>
          <dd className="font-serif text-3xl text-[#f6dc93]">{sampleMeta.orderLabel}</dd>
          <dd className="text-[10px] uppercase tracking-[0.2em] text-[#aab6dc]/60">{sampleMeta.collection}</dd>
        </div>
        <div className="border-l-2 border-foreground/25 pl-3">
          <dt className="text-[10px] uppercase tracking-[0.25em] text-[#aab6dc]/60">Série universal</dt>
          <dd className="font-mono text-sm text-[#aab6dc]/80">{sampleMeta.serial}</dd>
        </div>
      </dl>
    </div>
  )
}
