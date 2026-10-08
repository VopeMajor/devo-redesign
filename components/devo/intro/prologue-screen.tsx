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
import { SoundToggle } from '../shared/sound-toggle'
import { PrologueStage } from './prologue-stage'

const CHAR_MS = 30
const PAPER_STAGES: StageId[] = ['rumor', 'kids', 'boy', 'girl', 'hands', 'omen', 'trip', 'fall']
const SPEAKER_NAME = { voice: '???', melissa: 'Melissa' } as const
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

function useTypewriter(text: string) {
  const [shown, setShown] = useState(0)
  const done = shown >= text.length
  useEffect(() => setShown(0), [text])
  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => {
      setShown((s) => s + 1)
      if (shown % 3 === 0 && text[shown] !== ' ') playSfx('type')
    }, CHAR_MS)
    return () => window.clearTimeout(id)
  }, [shown, done, text])
  return { shown, done, finish: () => setShown(text.length) }
}

function ChoiceButton({ label, onClick, muted }: { label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => playSfx('hover')}
      className={cn(
        'group flex w-full items-baseline gap-3 border border-foreground/20 bg-background/80 px-4 py-3 text-left text-sm leading-relaxed backdrop-blur-md transition-colors hover:border-primary hover:bg-[#0b1a4d]/70 focus-visible:border-primary focus-visible:outline-none sm:text-base',
        muted ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      <span className="text-primary transition-transform group-hover:translate-x-1" aria-hidden="true">
        ▸
      </span>
      {label}
    </button>
  )
}

const FACE_BOXES = [
  { id: 'art', label: 'Rosto 2D', placeholder: 'Personagem de anime' },
  { id: 'real', label: 'Rosto Real Life', placeholder: 'Celebridade' },
] as const

function FaceInput({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [values, setValues] = useState({ real: '', art: '' })
  const real = values.real.trim()
  const art = values.art.trim()
  const valid = Boolean(real && art)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSubmit(`2D: ${art} | Real Life: ${real}`)
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        {FACE_BOXES.map((box, i) => (
          <div key={box.id} className="flex min-w-0 flex-col gap-1">
            <label htmlFor={`pr-face-${box.id}`} className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">
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
              className="w-full border border-foreground/25 bg-background/85 px-3 py-2 text-sm leading-relaxed text-foreground backdrop-blur-md placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:text-base"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={!valid}
        className="self-end border border-primary/70 bg-[#0b1a4d] px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-foreground transition-opacity disabled:opacity-40"
      >
        Responder
      </button>
    </form>
  )
}

function ProfileInput({ field, playerName, onSubmit }: { field: ProfileField; playerName: string; onSubmit: (value: string) => void }) {
  const [age, setAge] = useState('')
  if (field === 'name') return <ChoiceButton label={playerName} onClick={() => onSubmit(playerName)} />
  if (field === 'face') return <FaceInput onSubmit={onSubmit} />
  if (field === 'gender') {
    const options = GENDER_OPTIONS
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <ChoiceButton key={o} label={o} onClick={() => onSubmit(o)} />
        ))}
      </div>
    )
  }
  const valid = /^\d{1,3}$/.test(age) && Number(age) >= 1 && Number(age) <= 150
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSubmit(age)
      }}
    >
      <label htmlFor="pr-age" className="sr-only">
        Sua idade
      </label>
      <input
        id="pr-age"
        inputMode="numeric"
        autoFocus
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
        placeholder="Sua idade"
        className="min-w-0 flex-1 border border-foreground/25 bg-background/85 px-4 py-3 text-base text-foreground backdrop-blur-md placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={!valid}
        className="border border-primary/70 bg-[#0b1a4d] px-5 text-[11px] uppercase tracking-[0.3em] text-foreground transition-opacity disabled:opacity-40"
      >
        Responder
      </button>
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
  const { shown, done, finish } = useTypewriter(text)

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

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
  const speaker = line && line.who !== 'narrator' ? SPEAKER_NAME[line.who] : null
  const choosing = !line && beat.kind === 'choice'
  const pending = choosing ? beat.options.filter((o) => !explored.includes(o.label)) : []

  return (
    <main className="relative h-dvh overflow-hidden bg-black text-foreground">
      <PrologueStage stage={beat.stage} mood={mood} />

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
          Pular prólogo
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 pb-6 lg:pb-10">
        {line && text && (
          <button
            key={`${index}-${replies.length}`}
            type="button"
            onClick={advance}
            aria-label={done ? 'Continuar' : 'Mostrar texto completo'}
            className={cn(
              'relative block w-full text-left animate-[devo-fade-in_0.6s_ease-out_both] focus-visible:outline-none',
              paper
                ? 'rotate-[-0.6deg] bg-[#e9dcc6] px-6 py-5 text-[#2a1a20] shadow-[6px_8px_0_rgba(20,10,14,0.55)] [clip-path:polygon(0_4%,3%_0,40%_3%,70%_0,100%_5%,99%_60%,100%_100%,60%_97%,30%_100%,0_96%,1%_50%)]'
                : 'border border-foreground/30 bg-background/85 px-6 pb-4 pt-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-md sm:px-8',
              !speaker && !paper && 'pt-5 text-center italic',
            )}
          >
            {speaker && (
              <span className="absolute -top-4 left-6 border border-primary/70 bg-gradient-to-b from-[#0b1a4d] to-[#0b0e16] px-4 py-1.5 text-sm uppercase not-italic tracking-[0.3em] text-foreground">
                {speaker}
              </span>
            )}
            <span
              aria-live="polite"
              className={cn('block min-h-[3.25rem] text-pretty leading-relaxed', paper ? 'text-lg sm:text-xl' : 'text-base sm:text-lg')}
            >
              {text.slice(0, shown)}
            </span>
            <span className={cn('mt-1 block text-right text-xs transition-opacity', done ? 'opacity-100' : 'opacity-0', paper ? 'text-[#7a0c12]' : 'text-primary')} aria-hidden="true">
              <span className="animate-blink">▼</span>
            </span>
          </button>
        )}

        {choosing && (
          <div className="flex flex-col gap-2 animate-[devo-fade-in_0.5s_ease-out_both]" role="group" aria-label="Escolha o que dizer">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{name}</p>
            {pending.map((o) => (
              <ChoiceButton key={o.label} label={o.label.startsWith('Devolver') || o.label === 'Ir embora' ? `*${o.label}*` : o.label} onClick={() => choose(o.label, o.reply)} />
            ))}
            {beat.mode === 'explore' && explored.length > 0 && <ChoiceButton muted label="Continuar" onClick={next} />}
          </div>
        )}

        {!line && beat.kind === 'input' && (
          <div className="flex flex-col gap-2 animate-[devo-fade-in_0.5s_ease-out_both]">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Você responde</p>
            <ProfileInput key={beat.field} field={beat.field} playerName={playerName ?? 'Record'} onSubmit={(v) => submitProfile(beat.field, v)} />
          </div>
        )}
      </div>
    </main>
  )
}
