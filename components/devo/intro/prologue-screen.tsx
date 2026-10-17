'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { playMusic, playSfx, setPrologueMusic, stopMusic, type PrologueTrack, type Sfx } from '@/lib/devo/audio'
import {
  GENDER_OPTIONS,
  PROLOGUE,
  type Line,
  type MelissaMood,
  type ProfileField,
  type StageId,
} from '@/lib/devo/prologue-script'
import { cn } from '@/lib/utils'
import { APPEARANCE_KIND_LABEL, autoAppearance, appearancePool, chooseAppearance, type AppearanceKind } from '@/lib/devo/appearances'
import { useAdvanceKeys } from '../hooks'
import { playerText } from '@/lib/devo/player-name'
import { useDevo } from '../state/devo-store'
import { EntradaButton } from '../landing/entrada-button'
import { GlyphCard, GlyphSpark, toRoman } from '../kit/glyphs'
import { PrologueStage } from './prologue-stage'
import { FALL_IMPACT_MS } from './theater-fall'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, VnTopBar, useTypewriter } from './vn'

const CHAR_MS = 28
const FIRE_STAGES: StageId[] = ['fire', 'rise']
const PAPER_STAGES: StageId[] = ['rumor', 'kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall']
const SPEAKER_NAME = { voice: '???', melissa: 'Melissa', system: 'DEVO · Sistema' } as const
const SPEAKER_TONE = { voice: 'void', melissa: 'cobalt', system: 'system' } as const
const STAGE_TRACK: Partial<Record<StageId, PrologueTrack>> = {
  rumor: 'tale',
  kids: 'tale',
  boy: 'tale',
  girl: 'tale',
  hands: 'tale',
  omen: 'dread',
  trip: 'dread',
  fall: 'dread',
  abyss: 'dread',
  death: 'dread',
  fire: 'dread',
  rise: 'dread',
  void: 'void',
  voice: 'hall',
  mine: 'mine',
  phone: 'mine',
}
const STAGE_SFX: Partial<Record<StageId, Sfx>> = {
  rumor: 'curtain',
  kids: 'chirp',
  fall: 'fall',
  abyss: 'rumble',
  death: 'bell',
  fire: 'ignite',
  rise: 'crackle',
  void: 'crack',
  voice: 'toll',
  mine: 'drip',
}

const STAGE_SFX_AFTER: Partial<Record<StageId, [Sfx, number]>> = {
  void: ['shimmer', 420],
  voice: ['whisper', 1400],
  phone: ['tick', 300],
}

type Profile = Partial<Record<ProfileField, string>>

type Act = { n: number; title: string }
/** A Melissa só aparece depois da fala de cenário: na fala anterior à primeira dela, como silhueta. */
const FIRST_MELISSA = PROLOGUE.findIndex((b) => b.kind === 'line' && b.line.who === 'melissa')
/** Metadado de encenação: em que "ato" cada cenário fica (cartão de ato e capítulo no topo). */
const STAGE_ACT: Partial<Record<StageId, Act>> = {
  rumor: { n: 1, title: 'O rumor' },
  kids: { n: 1, title: 'O rumor' },
  boy: { n: 1, title: 'O rumor' },
  girl: { n: 1, title: 'O rumor' },
  hands: { n: 1, title: 'O rumor' },
  omen: { n: 1, title: 'O rumor' },
  trip: { n: 1, title: 'O rumor' },
  fall: { n: 1, title: 'O rumor' },
  abyss: { n: 2, title: 'A proposta' },
  death: { n: 2, title: 'A proposta' },
  fire: { n: 2, title: 'A proposta' },
  rise: { n: 2, title: 'A proposta' },
  void: { n: 3, title: 'A antiga voz' },
  voice: { n: 3, title: 'A antiga voz' },
  mine: { n: 4, title: 'A Companhia' },
  phone: { n: 4, title: 'A Companhia' },
}

/** Cartão de ato: faixa diagonal corta a tela, número de impacto, sai na mesma direção. Não bloqueia toques. */
function ActCard({ act }: { act: Act }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[9%] z-40 h-36 overflow-hidden">
      <span className="en-act-band absolute inset-y-6 -left-[10%] w-[120%] bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--dv-ink)_92%,transparent)_12%,color-mix(in_oklab,var(--dv-ink)_92%,transparent)_88%,transparent)]">
        <span className="absolute inset-x-0 top-0 h-[2px] bg-dv-gold/80" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,#6b6357_20%,#bab09f_50%,#6b6357_80%,transparent)]" />
      </span>
      <div className="en-act-text relative flex h-full items-center justify-center gap-4">
        <span className="font-impact text-[64px] font-bold uppercase leading-none text-transparent -skew-x-[8deg] [-webkit-text-stroke:1.5px_var(--dv-gold)]">
          {toRoman(act.n)}
        </span>
        <span className="flex flex-col">
          <span className="dv-label text-[10px] text-dv-gold">Prólogo · Ato {toRoman(act.n)}</span>
          <span className="font-display text-[26px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">{act.title}</span>
        </span>
      </div>
    </div>
  )
}

const fieldClass =
  'w-full border-b-2 border-dv-line-strong bg-dv-ink-2/85 px-3 py-3 font-sans text-[16px] text-dv-text outline-none backdrop-blur-md transition-colors placeholder:text-dv-text-3 focus:border-dv-gold-bright focus:bg-dv-ink-3'

const KIND_HINT: Record<AppearanceKind, string> = { art: 'Anime, jogo, animação', real: 'Ator, atriz, celebridade' }
const KIND_ARIA: Record<AppearanceKind, string> = { art: 'Aparência 2D/3D', real: 'Aparência real' }

/**
 * Segunda aparência (DIRECAO-2 §5, DIRECAO-3 §9): o jogador responde AS DUAS, uma de cada vez —
 * primeiro a 2D/3D, depois a real —, cada uma com nome e "Seleção automática" (lista preparada por
 * tipo, sexo e faixa etária — lib/devo/appearances.ts).
 */
function FaceInput({
  kind,
  previous,
  gender,
  age,
  onSubmit,
}: {
  kind: AppearanceKind
  /** Na segunda etapa: o nome escolhido na primeira (aparece como já respondido). */
  previous?: string
  gender?: string
  age?: number
  onSubmit: (kind: AppearanceKind, name: string, auto: boolean) => void
}) {
  const [name, setName] = useState('')
  const [auto, setAuto] = useState(false)
  const valid = name.trim().length > 0
  const pool = appearancePool(kind, gender, age)
  const step = kind === 'art' ? 1 : 2
  const inputId = kind === 'art' ? 'pr-appearance' : 'pr-appearance-real'
  return (
    <form
      aria-label={KIND_ARIA[kind]}
      className="animate-dv-rise flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSubmit(kind, name.trim(), auto)
      }}
    >
      {/* Etapas: as duas aparências são obrigatórias; a que já foi respondida fica marcada. */}
      <div className="flex items-stretch gap-2" aria-hidden="true">
        {(['art', 'real'] as AppearanceKind[]).map((k, i) => {
          const current = k === kind
          const answered = k === 'art' && step === 2
          return (
            <span
              key={k}
              className={cn(
                'dv-cut-diag flex min-w-0 flex-1 flex-col justify-center px-3 py-2 transition-colors duration-[220ms]',
                current
                  ? 'bg-dv-ink-3 text-dv-text shadow-[inset_3px_0_0_var(--dv-amethyst),inset_0_0_0_1px_color-mix(in_oklab,var(--dv-gold-bright)_38%,transparent),0_0_22px_-8px_var(--dv-amethyst)]'
                  : 'bg-dv-ink-2/80 text-dv-text-3',
              )}
              style={{ '--dv-cut': '10px' } as CSSProperties}
            >
              <span className="flex items-baseline gap-2">
                <span className={cn('font-impact text-[13px] leading-none', current ? 'text-dv-gold-bright' : 'text-dv-text-3')}>{toRoman(i + 1)}</span>
                <span className="font-display text-[15px] font-semibold uppercase tracking-[0.12em]">{APPEARANCE_KIND_LABEL[k]}</span>
              </span>
              <span className={cn('truncate font-sans text-[12px]', answered ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                {answered && previous ? previous : KIND_HINT[k]}
              </span>
            </span>
          )
        })}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={inputId} className="dv-label pb-1 text-[10px] text-dv-text-2">
            Nome da aparência
          </label>
          {/* Seleção automática: lista preparada por tipo, sexo e faixa etária (sorteia outra a cada toque). */}
          <button
            type="button"
            onClick={() => {
              playSfx('card')
              setName(autoAppearance(kind, gender, age, name))
              setAuto(true)
            }}
            className="dv-focus group -mr-1 flex min-h-11 items-center gap-1.5 px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-gold-bright transition-colors hover:text-dv-text"
          >
            <GlyphSpark className="size-3 transition-transform duration-[360ms] group-hover:rotate-90 group-active:scale-90" />
            <span className="border-b border-dv-gold/50 pb-px">Seleção automática</span>
          </button>
        </div>
        <input
          id={inputId}
          autoFocus
          maxLength={80}
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setAuto(false)
          }}
          placeholder={`Ex.: ${pool[0] ?? (kind === 'art' ? 'personagem' : 'ator ou atriz')}`}
          className={fieldClass}
        />
        {auto && <span className="dv-label pt-1 text-[10px] text-dv-amethyst-text">Escolhida da lista · toque de novo para sortear outra</span>}
      </div>
      <EntradaButton type="submit" tone="porcelain" size="md" block disabled={!valid} sfx="confirm">
        Responder
      </EntradaButton>
      <p className="font-sans text-[12px] leading-snug text-dv-text-3">
        {step === 1 ? 'Depois desta, você escolhe a aparência real. ' : ''}Cada aparência pode ser trocada por afinidade dentro do jogo, uma única vez.
      </p>
    </form>
  )
}

function ProfileInput({
  field,
  playerName,
  gender,
  knownAge,
  onSubmit,
  onAppearance,
  previousArt,
}: {
  field: ProfileField
  playerName: string
  gender?: string
  knownAge?: number
  onSubmit: (value: string) => void
  onAppearance: (kind: AppearanceKind, name: string, auto: boolean) => void
  /** Aparência 2D/3D já respondida (mostrada na etapa da real). */
  previousArt?: string
}) {
  const [age, setAge] = useState('')
  if (field === 'name') return <ChoiceStrip index={0} label={playerName} onClick={() => onSubmit(playerName)} />
  if (field === 'face') return <FaceInput kind="art" gender={gender} age={knownAge} onSubmit={onAppearance} />
  if (field === 'faceReal') return <FaceInput kind="real" previous={previousArt} gender={gender} age={knownAge} onSubmit={onAppearance} />
  if (field === 'gender') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {GENDER_OPTIONS.map((o, i) => (
          <ChoiceStrip key={o} index={i} delay={i * 60} label={o} onClick={() => onSubmit(o)} />
        ))}
      </div>
    )
  }
  const valid = /^\d{1,3}$/.test(age) && Number(age) >= 1 && Number(age) <= 150
  return (
    <form
      className="animate-dv-rise flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSubmit(age)
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="pr-age" className="dv-label text-[10px] text-dv-text-2">
          Sua idade
        </label>
        <input
          id="pr-age"
          inputMode="numeric"
          autoFocus
          value={age}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="Ex.: 27"
          className={cn(fieldClass, 'font-impact text-[22px] tracking-[0.08em]')}
        />
      </div>
      <EntradaButton type="submit" tone="porcelain" size="sm" disabled={!valid} sfx="confirm">
        Responder
      </EntradaButton>
    </form>
  )
}

/** Linha do rasgo da folha (ato I → ato II): um zigue-zague vertical no meio da caixa. */
const TEAR_LINE = [
  [52, 0], [49, 12], [54, 24], [47, 37], [53, 50], [48, 63], [55, 76], [49, 88], [52, 100],
] as const
const TEAR_LEFT = `polygon(0 0, ${TEAR_LINE.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 0 100%)`
const TEAR_RIGHT = `polygon(100% 0, ${TEAR_LINE.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 100% 100%)`

/** Caixa do ato I: papel creme pautado, levemente torto, com costura tracejada. */
function PaperBox({ text, done, live = false }: { text: string; done: boolean; live?: boolean }) {
  return (
    <span className="relative block -rotate-[0.6deg]">
      <span
        aria-hidden="true"
        className="dv-paper-bg absolute inset-0 shadow-[6px_8px_0_color-mix(in_oklab,var(--dv-ink)_60%,transparent)] [clip-path:polygon(0_4%,3%_0,40%_3%,70%_0,100%_5%,99%_60%,100%_100%,60%_97%,30%_100%,0_96%,1%_50%)]"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[8px] border border-dashed border-dv-paper-ink/25" />
      <span className="relative block px-6 pb-4 pt-5">
        <span aria-live={live ? 'polite' : undefined} className="block min-h-[3.25rem] text-pretty font-body text-[18px] leading-relaxed text-dv-paper-ink">
          {text}
        </span>
        <span className="mt-1 flex justify-end">
          <AdvanceIndicator visible={done} tone="paper" />
        </span>
      </span>
    </span>
  )
}

export function PrologueScreen({
  playerName,
  onFinish: onDone,
  startIndex = 0,
  startVars,
  onProgress,
}: {
  playerName: string | null
  onFinish: () => void
  /** Retomar de onde o jogador parou (Continuar). */
  startIndex?: number
  startVars?: Record<string, string>
  onProgress?: (index: number, vars: Record<string, string>) => void
}) {
  const onFinish = useCallback(() => {
    setPrologueMusic(null)
    playMusic()
    onDone()
  }, [onDone])
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), PROLOGUE.length - 1))
  // caixa de fala atual (a Melissa se ancora nela: kit/npc-anchor)
  const [fala, setFala] = useState<HTMLElement | null>(null)
  const lastStage = useRef<StageId | null>(null)
  const lastAct = useRef<Act | null>(null)

  useEffect(() => {
    stopMusic()
    return () => setPrologueMusic(null)
  }, [])
  const { dispatch, state: devo } = useDevo()
  const [replies, setReplies] = useState<Line[]>([])
  /** Qual opção gerou as respostas atuais (para achar o id da fala dublada). */
  const [replyFrom, setReplyFrom] = useState<{ option: number; total: number } | null>(null)
  const [explored, setExplored] = useState<string[]>([])
  const [profile, setProfile] = useState<Profile>(() => ({ ...(startVars as Profile | undefined) }))
  // Grava o ponto da encenação a cada quadro (o autosave manda ao servidor).
  useEffect(() => {
    onProgress?.(index, Object.fromEntries(Object.entries(profile).filter((e): e is [string, string] => typeof e[1] === 'string')))
  }, [index, profile]) // eslint-disable-line react-hooks/exhaustive-deps
  // Ao retomar pelo Continuar no meio da conversa, a Melissa já entra com a expressão da última fala dela
  // (sem trocar de retrato no primeiro quadro).
  const [mood, setMood] = useState<MelissaMood>(() => {
    for (let i = Math.min(startIndex, PROLOGUE.length - 1); i >= 0; i--) {
      const b = PROLOGUE[i]
      if (b.kind === 'line' && b.line.who === 'melissa' && b.line.mood) return b.line.mood
    }
    return 'convite'
  })

  const beat = PROLOGUE[index]
  const name = profile.name ?? playerName ?? 'Record'
  // Nome e gênero (marcadores {m|f}): antes da escolha de gênero vale a primeira forma; depois, a escolhida.
  const fill = (t: string) => playerText(t, { name, gender: profile.gender })
  const line: Line | null = replies[0] ?? (beat.kind === 'line' ? beat.line : null)
  const text = line ? fill(line.text) : ''
  const charMs = CHAR_MS
  const { shown, done, finish, inicio, pronto, guarda } = useTypewriter(text, charMs)

  const next = useCallback(() => {
    if (index >= PROLOGUE.length - 1) {
      playSfx('whoosh')
      onFinish()
      return
    }
    setIndex((i) => i + 1)
    setExplored([])
  }, [index, onFinish])

  useEffect(() => {
    if (line?.who === 'melissa' && line.mood) setMood(line.mood)
  }, [line])

  useEffect(() => {
    const stage = beat.stage
    if (lastStage.current === stage) return
    lastStage.current = stage
    const track = STAGE_TRACK[stage]
    if (track) setPrologueMusic(track)
    else if (stage === 'dark' && index > 0) setPrologueMusic(null)
    const sfx = STAGE_SFX[stage]
    if (sfx) playSfx(sfx)
    // Segunda camada de som em alguns cortes: o espelho cintila depois de trincar; a Voz sussurra depois da badalada.
    const after = STAGE_SFX_AFTER[stage]
    if (after) window.setTimeout(() => playSfx(after[0]), after[1])
  }, [beat.stage, index])

  useEffect(() => {
    // O impacto da queda soa no golpe da tesoura (FALL_IMPACT_MS), não no início do quadro.
    let impact = 0
    if (beat.kind === 'line' && beat.sfx === 'crush' && replies.length === 0) {
      const sfx = beat.sfx
      impact = window.setTimeout(() => playSfx(sfx), FALL_IMPACT_MS)
    } else if (beat.kind === 'line' && beat.sfx && replies.length === 0) playSfx(beat.sfx)
    if (beat.kind === 'line' && beat.auto) {
      const id = window.setTimeout(next, beat.auto)
      return () => {
        window.clearTimeout(id)
        window.clearTimeout(impact)
      }
    }
    return () => window.clearTimeout(impact)
  }, [beat, next, replies.length])

  const advance = useCallback(() => {
    if (!line) return
    if (!done) return finish()
    if (guarda()) return
    playSfx('click')
    if (replies.length > 0) {
      const rest = replies.slice(1)
      setReplies(rest)
      if (rest.length === 0 && beat.kind === 'choice') {
        const exhausted = beat.mode === 'one' || explored.length >= beat.options.length
        if (exhausted) next()
      }
      return
    }
    next()
  }, [line, done, finish, replies, beat, explored.length, next])

  useAdvanceKeys(advance)

  const choose = (label: string, reply: Line[]) => {
    playSfx('confirm')
    const option = beat.kind === 'choice' ? beat.options.findIndex((o) => o.label === label) : 0
    // "Devolver" as Cartas Iniciais é pra valer: o jogador fica sem cartas.
    if (beat.kind === 'choice' && beat.options[option]?.effect === 'return-starter-cards') dispatch({ type: 'RETURN_STARTER_CARDS' })
    setReplyFrom({ option, total: reply.length })
    setExplored((e) => [...e, label])
    setReplies(reply)
  }

  const submitProfile = (field: ProfileField, value: string) => {
    playSfx('confirm')
    setProfile((p) => ({ ...p, [field]: value }))
    // Idade e gênero vão para o perfil salvo (a Seleção automática usa os dois).
    if (field === 'age') dispatch({ type: 'SET_PROFILE', patch: { age: Number(value) } })
    if (field === 'gender') dispatch({ type: 'SET_PROFILE', patch: { gender: value } })
    next()
  }

  // As duas aparências vão para o perfil, cada uma no seu lugar e com a sua troca (lib/devo/appearances.ts).
  const submitAppearance = (kind: AppearanceKind, appearance: string, auto: boolean) => {
    playSfx('confirm')
    setProfile((p) => (kind === 'art' ? { ...p, face: `2D/3D: ${appearance}` } : { ...p, faceReal: `Real: ${appearance}` }))
    dispatch({ type: 'SET_PROFILE', patch: chooseAppearance(devo.profile, { kind, name: appearance, auto, chosenAt: Date.now() }) })
    next()
  }

  const paper = PAPER_STAGES.includes(beat.stage) && line?.who === 'narrator'
  const lastPaper = useRef('')
  const wasPaper = useRef(false)
  const [tear, setTear] = useState<{ text: string; seq: number } | null>(null)
  useEffect(() => {
    if (!line || !text) return
    if (paper) lastPaper.current = text
    else if (wasPaper.current) {
      setTear({ text: lastPaper.current, seq: index })
      playSfx('card')
    }
    wasPaper.current = paper
  }, [index, paper, line, text])
  useEffect(() => {
    if (!tear) return
    const t = window.setTimeout(() => setTear(null), 1400)
    return () => window.clearTimeout(t)
  }, [tear])
  const speaker = line && line.who !== 'narrator' ? line.who : null
  const choosing = !line && beat.kind === 'choice'
  const pending = choosing ? beat.options.filter((o) => !explored.includes(o.label)) : []
  const act = STAGE_ACT[beat.stage] ?? lastAct.current
  if (STAGE_ACT[beat.stage]) lastAct.current = STAGE_ACT[beat.stage]!
  // Momentos-evento do roteiro (metadado `sfx` das falas): item recebido, revelação, impacto.
  const itemGet = beat.kind === 'line' && beat.sfx === 'card' && replies.length === 0
  const glint = beat.kind === 'line' && beat.sfx === 'reveal' && replies.length === 0
  const slash = beat.kind === 'line' && beat.sfx === 'crush'

  // Momentos fortes da cutscene: golpe da queda (o corte vermelho está no palco), brilho do aparelho, entrada de cada ato.
  const actN = act?.n ?? 0
  const lastActSfx = useRef(0)
  useEffect(() => {
    // o silvo da tesoura descendo, logo antes do impacto
    if (slash) window.setTimeout(() => playSfx('slash'), FALL_IMPACT_MS - 150)
    if (glint) playSfx('shimmer')
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!actN || lastActSfx.current === actN) return
    lastActSfx.current = actN
    playSfx('thud')
  }, [actN])

  return (
    <main className="en-root relative h-dvh overflow-hidden bg-black text-dv-text">
      <PrologueStage
        stage={beat.stage}
        mood={mood}
        speaking={line?.who === 'melissa'}
        melissa={index >= FIRST_MELISSA ? 'on' : index === FIRST_MELISSA - 1 ? 'approach' : 'off'}
        opening={index === 0}
        fala={fala}
      />

      {/* Primeiro quadro: onde o jogador está. Entra quando os olhos abrem. */}
      {index === 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[56%] z-20 flex flex-col items-center gap-2 text-center">
          <span className="dv-label animate-dv-fade en-after-eyes text-[11px] text-dv-gold">Prólogo</span>
          <span className="animate-dv-cut-in en-after-eyes font-display text-[26px] font-semibold uppercase tracking-[0.1em] text-dv-text">Um lugar sem relógio</span>
          <span className="animate-dv-fade en-after-eyes font-body text-[16px] italic text-dv-text-2">Antes do primeiro voto. Antes do seu nome.</span>
        </div>
      )}

      {glint && <div key={`glint-${index}`} aria-hidden="true" className="en-glint pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(241,240,238,0.55),color-mix(in_oklab,var(--dv-amethyst)_22%,transparent)_30%,transparent_60%)]" />}
      {act && <div key={`cut-${act.n}`} aria-hidden="true" className="en-cut pointer-events-none absolute inset-0 z-[35] bg-black" />}
      {act && <ActCard key={`act-${act.n}`} act={act} />}

      <VnTopBar
        skipLabel="Pular prólogo"
        onSkip={onFinish}
        chapter={
          act ? (
            <p className="dv-label flex items-start gap-2 text-[10px] text-dv-text-2">
              <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(act.n)}</span>
              <span className="pt-px leading-[1.35] tracking-[0.12em]">{act.title}</span>
            </p>
          ) : null
        }
      />

      {/* Véu inferior: o texto sempre sobre fundo escuro, sem esconder a cena. */}
      {/* (some nos quadros sem fala, como o golpe da queda; no fogo fica leve, para as chamas manterem a cor original) */}
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[46%] bg-gradient-to-t from-black/90 via-black/55 to-transparent transition-opacity duration-300', beat.kind === 'line' && !text ? 'opacity-0' : FIRE_STAGES.includes(beat.stage) && 'opacity-40')} />

      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:pb-10">
        {itemGet && (
          <div key={`item-${index}`} aria-hidden="true" className="en-item mb-2 flex items-center gap-3 self-start border-l-[3px] border-dv-gold bg-[linear-gradient(90deg,color-mix(in_oklab,var(--dv-gold-deep)_90%,transparent),color-mix(in_oklab,var(--dv-ink-2)_92%,transparent))] py-2 pl-3 pr-5 shadow-[0_10px_24px_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            <GlyphCard className="size-6 text-dv-gold-bright" />
            <span className="flex flex-col">
              <span className="dv-label text-[10px] text-dv-gold-bright">Item adquirido</span>
              <span className="font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-dv-text">Cartas Iniciais</span>
            </span>
          </div>
        )}

        {/* Fim do ato I: a folha de papel rasga ao meio e cai na fenda; o vidro negro do ato II sobe. */}
        {tear && (
          <div key={tear.seq} aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-[max(env(safe-area-inset-bottom),1.25rem)] z-30 lg:bottom-10">
            <div className="en-tear-l" style={{ clipPath: TEAR_LEFT }}>
              <PaperBox text={tear.text} done={false} />
            </div>
            <div className="en-tear-r absolute inset-0" style={{ clipPath: TEAR_RIGHT }}>
              <PaperBox text={tear.text} done={false} />
            </div>
          </div>
        )}

        {line && text && (
          <button
            key={`${index}-${replies.length}`}
            ref={setFala}
            type="button"
            onClick={advance}
            aria-label={done ? 'Continuar' : 'Mostrar texto completo'}
            className={cn('en-box-in dv-focus relative block w-full text-left', speaker && 'mt-6', index === 0 && 'en-after-eyes', tear && 'en-box-late')}
          >
            {paper ? (
              <PaperBox text={text.slice(inicio, shown)} done={pronto} live />
            ) : (
              <DialogueShell tone={speaker === 'melissa' ? 'cobalt' : 'gold'}>
                {speaker && <SpeakerPlate key={speaker} name={SPEAKER_NAME[speaker]} tone={SPEAKER_TONE[speaker]} />}
                <span className={cn('block px-6 pb-3', speaker ? 'pt-7' : 'pt-5 text-center')}>
                  <span
                    aria-live="polite"
                    className={cn(
                      'block min-h-[3.25rem] text-pretty font-body leading-relaxed text-dv-text',
                      speaker ? 'text-[17px]' : 'text-[17px] italic text-dv-text-2',
                    )}
                  >
                    {text.slice(inicio, shown)}
                    {!pronto && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-porcelain" />}
                  </span>
                  <span className={cn('mt-1.5 flex items-center', speaker ? 'justify-between' : 'justify-center')}>
                    {speaker && (
                      <span aria-hidden="true" className="dv-label text-[10px] text-dv-text-3">
                        {act ? `Ato ${toRoman(act.n)}` : ''}
                      </span>
                    )}
                    <AdvanceIndicator visible={pronto} tone={speaker === 'voice' ? 'gold' : 'cobalt'} />
                  </span>
                </span>
              </DialogueShell>
            )}
          </button>
        )}

        {choosing && (
          <div className="flex flex-col gap-2" role="group" aria-label="Escolha o que dizer">
            <ChoiceHeader>{name} · escolha o que dizer</ChoiceHeader>
            {pending.map((o, i) => {
              const action = o.label.startsWith('Devolver') || o.label === 'Ir embora'
              return <ChoiceStrip key={o.label} index={i} delay={80 + i * 70} action={action} label={fill(o.label)} onClick={() => choose(o.label, o.reply)} />
            })}
            {beat.mode === 'explore' && explored.length > 0 && <ChoiceStrip muted index={pending.length} delay={80 + pending.length * 70} label="Continuar" onClick={next} />}
          </div>
        )}

        {!line && beat.kind === 'input' && (
          <div className="flex flex-col gap-2" role="group" aria-label="Sua resposta">
            <ChoiceHeader>Você responde</ChoiceHeader>
            <ProfileInput
              key={beat.field}
              field={beat.field}
              playerName={playerName ?? 'Record'}
              gender={profile.gender}
              knownAge={profile.age ? Number(profile.age) : undefined}
              onSubmit={(v) => submitProfile(beat.field, v)}
              onAppearance={submitAppearance}
              previousArt={profile.face?.replace(/^2D\/3D: /, '')}
            />
          </div>
        )}
      </div>
    </main>
  )
}
