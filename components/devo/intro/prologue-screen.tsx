'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useAdvanceKeys } from '../hooks'
import { Button } from '../kit/button'
import { GlyphCard, toRoman } from '../kit/glyphs'
import { PrologueStage } from './prologue-stage'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, VnTopBar, useTypewriter } from './vn'

const CHAR_MS = 28
const PAPER_STAGES: StageId[] = ['rumor', 'kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall']
const SPEAKER_NAME = { voice: '???', melissa: 'Melissa' } as const
const SPEAKER_TONE = { voice: 'void', melissa: 'cobalt' } as const
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
  voice: 'void',
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
  void: 'heartbeat',
  voice: 'whisper',
  mine: 'drip',
}

type Profile = Partial<Record<ProfileField, string>>

type Act = { n: number; title: string }
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[26%] z-40 h-36 overflow-hidden">
      <span className="en-act-band absolute inset-y-6 -left-[10%] w-[120%] bg-[linear-gradient(90deg,transparent,rgba(5,7,13,0.92)_12%,rgba(5,7,13,0.92)_88%,transparent)]">
        <span className="absolute inset-x-0 top-0 h-[2px] bg-dv-gold/80" />
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-dv-cobalt-deep" />
      </span>
      <div className="en-act-text relative flex h-full items-center justify-center gap-4">
        <span className="font-impact text-[64px] font-bold uppercase leading-none text-transparent -skew-x-[8deg] [-webkit-text-stroke:1.5px_var(--dv-gold)]">
          {toRoman(act.n)}
        </span>
        <span className="flex flex-col">
          <span className="dv-label text-[10px] text-dv-cobalt-text">Prólogo · Ato {toRoman(act.n)}</span>
          <span className="font-display text-[26px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">{act.title}</span>
        </span>
      </div>
    </div>
  )
}

const FACE_BOXES = [
  { id: 'art', label: 'Rosto 2D', placeholder: 'Personagem de anime' },
  { id: 'real', label: 'Rosto Real Life', placeholder: 'Celebridade' },
] as const

const fieldClass =
  'w-full border-b-2 border-dv-line-strong bg-dv-ink-2/85 px-3 py-3 font-sans text-[16px] text-dv-text outline-none backdrop-blur-md transition-colors placeholder:text-dv-text-3 focus:border-dv-cobalt focus:bg-dv-cobalt-dim/60'

function FaceInput({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [values, setValues] = useState({ real: '', art: '' })
  const real = values.real.trim()
  const art = values.art.trim()
  const valid = Boolean(real && art)
  return (
    <form
      className="animate-dv-rise flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSubmit(`2D: ${art} | Real Life: ${real}`)
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        {FACE_BOXES.map((box, i) => (
          <div key={box.id} className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`pr-face-${box.id}`} className="dv-label text-[10px] text-dv-text-2">
              {box.label}
            </label>
            <input
              id={`pr-face-${box.id}`}
              autoFocus={i === 0}
              maxLength={80}
              autoComplete="off"
              value={values[box.id]}
              onChange={(e) => setValues((v) => ({ ...v, [box.id]: e.target.value }))}
              placeholder={box.placeholder}
              className={fieldClass}
            />
          </div>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={!valid} className="self-end" sfx="confirm">
        Responder
      </Button>
    </form>
  )
}

function ProfileInput({ field, playerName, onSubmit }: { field: ProfileField; playerName: string; onSubmit: (value: string) => void }) {
  const [age, setAge] = useState('')
  if (field === 'name') return <ChoiceStrip index={0} label={playerName} onClick={() => onSubmit(playerName)} />
  if (field === 'face') return <FaceInput onSubmit={onSubmit} />
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
      <Button type="submit" size="sm" disabled={!valid} sfx="confirm">
        Responder
      </Button>
    </form>
  )
}

export function PrologueScreen({ playerName, onFinish: onDone }: { playerName: string | null; onFinish: () => void }) {
  const onFinish = useCallback(() => {
    setPrologueMusic(null)
    playMusic()
    onDone()
  }, [onDone])
  const [index, setIndex] = useState(0)
  const lastStage = useRef<StageId | null>(null)
  const lastAct = useRef<Act | null>(null)

  useEffect(() => {
    stopMusic()
    return () => setPrologueMusic(null)
  }, [])
  const [replies, setReplies] = useState<Line[]>([])
  const [explored, setExplored] = useState<string[]>([])
  const [profile, setProfile] = useState<Profile>({})
  const [mood, setMood] = useState<MelissaMood>('neutral')

  const beat = PROLOGUE[index]
  const name = profile.name ?? playerName ?? 'Record'
  const fill = (t: string) => t.replaceAll('{nome}', name)
  const line: Line | null = replies[0] ?? (beat.kind === 'line' ? beat.line : null)
  const text = line ? fill(line.text) : ''
  const { shown, done, finish } = useTypewriter(text, CHAR_MS)

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
  }, [beat.stage, index])

  useEffect(() => {
    if (beat.kind === 'line' && beat.sfx && replies.length === 0) playSfx(beat.sfx)
    if (beat.kind === 'line' && beat.auto) {
      const id = window.setTimeout(next, beat.auto)
      return () => window.clearTimeout(id)
    }
  }, [beat, next, replies.length])

  const advance = useCallback(() => {
    if (!line) return
    if (!done) return finish()
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
    setExplored((e) => [...e, label])
    setReplies(reply)
  }

  const submitProfile = (field: ProfileField, value: string) => {
    playSfx('confirm')
    setProfile((p) => ({ ...p, [field]: value }))
    next()
  }

  const paper = PAPER_STAGES.includes(beat.stage) && line?.who === 'narrator'
  const speaker = line && line.who !== 'narrator' ? line.who : null
  const choosing = !line && beat.kind === 'choice'
  const pending = choosing ? beat.options.filter((o) => !explored.includes(o.label)) : []
  const act = STAGE_ACT[beat.stage] ?? lastAct.current
  if (STAGE_ACT[beat.stage]) lastAct.current = STAGE_ACT[beat.stage]!
  // Momentos-evento do roteiro (metadado `sfx` das falas): item recebido, revelação, impacto.
  const itemGet = beat.kind === 'line' && beat.sfx === 'card' && replies.length === 0
  const glint = beat.kind === 'line' && beat.sfx === 'reveal' && replies.length === 0
  const slash = beat.kind === 'line' && beat.sfx === 'crush'

  return (
    <main className="relative h-dvh overflow-hidden bg-black text-dv-text">
      <PrologueStage stage={beat.stage} mood={mood} speaking={line?.who === 'melissa'} />

      {slash && (
        <div key={`slash-${index}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <span className="en-slash absolute left-[-20%] top-[44%] h-3 w-[140%] bg-dv-blood shadow-[0_0_30px_rgba(213,31,43,0.9)]" />
        </div>
      )}
      {glint && <div key={`glint-${index}`} aria-hidden="true" className="en-glint pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(125,151,255,0.9),transparent_60%)]" />}
      {act && <ActCard key={`act-${act.n}`} act={act} />}

      <VnTopBar
        skipLabel="Pular prólogo"
        onSkip={onFinish}
        chapter={
          act ? (
            <p className="dv-label flex items-center gap-2 text-[10px] text-dv-text-2">
              <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(act.n)}</span>
              <span className="truncate">{act.title}</span>
            </p>
          ) : null
        }
      />

      {/* Véu inferior: o texto sempre sobre fundo escuro, sem esconder a cena. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[46%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:pb-10">
        {itemGet && (
          <div key={`item-${index}`} aria-hidden="true" className="en-item mb-2 flex items-center gap-3 self-start border-l-[3px] border-dv-gold bg-[linear-gradient(90deg,rgba(124,95,42,0.9),rgba(10,15,28,0.92))] py-2 pl-3 pr-5 shadow-[0_10px_24px_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            <GlyphCard className="size-6 text-dv-gold-bright" />
            <span className="flex flex-col">
              <span className="dv-label text-[10px] text-dv-gold-bright">Item adquirido</span>
              <span className="font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-dv-text">Cartas Iniciais</span>
            </span>
          </div>
        )}

        {line && text && (
          <button
            key={`${index}-${replies.length}`}
            type="button"
            onClick={advance}
            aria-label={done ? 'Continuar' : 'Mostrar texto completo'}
            className={cn('en-box-in dv-focus relative block w-full text-left', speaker && 'mt-6')}
          >
            {paper ? (
              <span className="relative block -rotate-[0.6deg]">
                <span
                  aria-hidden="true"
                  className="dv-paper-bg absolute inset-0 shadow-[6px_8px_0_rgba(5,7,13,0.6)] [clip-path:polygon(0_4%,3%_0,40%_3%,70%_0,100%_5%,99%_60%,100%_100%,60%_97%,30%_100%,0_96%,1%_50%)]"
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-[8px] border border-dashed border-dv-paper-ink/25" />
                <span className="relative block px-6 pb-4 pt-5">
                  <span aria-live="polite" className="block min-h-[3.25rem] text-pretty font-body text-[18px] leading-relaxed text-dv-paper-ink">
                    {text.slice(0, shown)}
                  </span>
                  <span className="mt-1 flex justify-end">
                    <AdvanceIndicator visible={done} tone="paper" />
                  </span>
                </span>
              </span>
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
                    {text.slice(0, shown)}
                    {!done && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-cobalt-text" />}
                  </span>
                  <span className={cn('mt-1.5 flex items-center', speaker ? 'justify-between' : 'justify-center')}>
                    {speaker && (
                      <span aria-hidden="true" className="dv-label text-[10px] text-dv-text-3">
                        {act ? `Ato ${toRoman(act.n)}` : ''}
                      </span>
                    )}
                    <AdvanceIndicator visible={done} tone={speaker === 'voice' ? 'gold' : 'cobalt'} />
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
              return <ChoiceStrip key={o.label} index={i} delay={80 + i * 70} action={action} label={o.label} onClick={() => choose(o.label, o.reply)} />
            })}
            {beat.mode === 'explore' && explored.length > 0 && <ChoiceStrip muted index={pending.length} delay={80 + pending.length * 70} label="Continuar" onClick={next} />}
          </div>
        )}

        {!line && beat.kind === 'input' && (
          <div className="flex flex-col gap-2" role="group" aria-label="Sua resposta">
            <ChoiceHeader>Você responde</ChoiceHeader>
            <ProfileInput key={beat.field} field={beat.field} playerName={playerName ?? 'Record'} onSubmit={(v) => submitProfile(beat.field, v)} />
          </div>
        )}
      </div>
    </main>
  )
}
