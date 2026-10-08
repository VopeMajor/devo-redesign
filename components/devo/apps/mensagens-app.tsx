'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { availableChoices, getNpc, STICKER_PREFIX, stickerSrc, type DialogueChoice } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { cn } from '@/lib/utils'
import { formatClock } from '../hooks'
import { Badge } from '../kit/badge'
import { IconButton } from '../kit/button'
import { Frame } from '../kit/frame'
import { GlyphArrow, GlyphKeyhole, toRoman } from '../kit/glyphs'
import { Kicker } from '../kit/typography'
import { nextId, useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { TypingDots } from './app-ui'

/** Identidade visual de cada remetente (só apresentação). */
type Accent = 'gold' | 'cobalt' | 'paper' | 'neutral'
const ACCENT: Record<string, Accent> = { rato: 'gold', herdeiro: 'cobalt', coruja: 'paper', desconhecido: 'neutral' }
const accentOf = (npcId: string): Accent => ACCENT[npcId] ?? 'neutral'

const RING: Record<Accent, string> = {
  gold: 'bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_40%,var(--dv-gold)_70%,var(--dv-gold-deep))]',
  cobalt: 'bg-[linear-gradient(135deg,#a9bbff,var(--dv-cobalt)_45%,var(--dv-cobalt-deep))]',
  paper: 'bg-[linear-gradient(135deg,var(--dv-paper),var(--dv-paper-2)_50%,var(--dv-gold-deep))]',
  neutral: 'bg-dv-line-strong',
}
const NAME: Record<Accent, string> = {
  gold: 'text-dv-gold',
  cobalt: 'text-dv-cobalt-text',
  paper: 'text-dv-paper',
  neutral: 'text-dv-text-2',
}

/** Retrato octogonal com filete na cor do remetente. */
function Portrait({ npcId, size = 52, className }: { npcId: string; size?: number; className?: string }) {
  const npc = getNpc(npcId)
  const src = npc.portraits.neutral
  const Art = npc.art
  const cut = Math.round(size * 0.24)
  return (
    <span
      aria-hidden="true"
      className={cn('relative isolate grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, '--dv-cut': `${cut}px` } as CSSProperties}
    >
      <span className={cn('dv-cut absolute inset-0 -z-10', RING[accentOf(npcId)])} />
      <span className="dv-cut absolute inset-[1.5px] -z-10 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,var(--dv-ink-4),var(--dv-ink))]" style={{ '--dv-cut': `${cut - 1}px` } as CSSProperties}>
        {Art ? (
          <Art crop="face" className="absolute inset-0 size-full" />
        ) : src ? (
          <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover object-top" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-impact text-[26px] font-bold text-dv-text-2 [text-shadow:2px_0_0_rgba(213,31,43,0.6),-2px_0_0_rgba(49,93,255,0.6)]">?</span>
        )}
      </span>
    </span>
  )
}

export function MensagensApp() {
  const { state, dispatch } = useDevo()
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = state.threads.find((t) => t.id === activeId) ?? null

  useEffect(() => {
    if (active?.unread) dispatch({ type: 'THREAD_READ', threadId: active.id })
  }, [active?.id, active?.unread, dispatch])

  const visible = state.threads.filter((t) => !(getNpc(t.npcId).hidden && t.messages.length === 0 && !t.typing))

  return (
    <div className="flex h-full @container">
      <div className={cn('devo-scroll flex w-full flex-col overflow-y-auto @xl:w-72 @xl:shrink-0 @xl:border-r @xl:border-dv-line', active && 'hidden @xl:flex')}>
        <div className="animate-dv-fade flex items-center justify-between gap-3 px-4 pb-2 pt-4">
          <Kicker tone="gold">Canal seguro · {visible.length} conversas</Kicker>
        </div>
        <ul className="flex flex-col gap-2 px-3 pb-3" aria-label="Conversas">
          {visible.map((t, i) => {
            const npc = getNpc(t.npcId)
            const last = t.messages.at(-1)
            const selected = t.id === activeId
            const fresh = t.unread > 0
            return (
              <li key={t.id} className="animate-dv-rise" style={{ animationDelay: `${80 + Math.min(i, 8) * 60}ms` }}>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('open')
                    setActiveId(t.id)
                  }}
                  aria-current={selected || undefined}
                  className="dv-focus group relative isolate flex w-full items-center gap-3 py-3 pl-3 pr-3 text-left transition-transform duration-[120ms] active:scale-[0.985]"
                  style={{ '--dv-cut': '12px' } as CSSProperties}
                >
                  <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', selected || fresh ? 'bg-dv-cobalt/70' : 'bg-dv-line')} />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'dv-cut-diag absolute inset-px -z-10 transition-colors',
                      selected ? 'bg-dv-cobalt-dim' : 'bg-[linear-gradient(100deg,var(--dv-ink-3),var(--dv-ink-2)_70%)] group-hover:bg-dv-ink-3',
                    )}
                    style={{ '--dv-cut': '11.6px' } as CSSProperties}
                  />
                  {fresh && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-[2px] bg-dv-cobalt" />}
                  <Portrait npcId={t.npcId} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-[16px] font-semibold tracking-[0.03em] text-dv-text">{npc.name}</span>
                      {last && <span className="dv-tabular shrink-0 font-mono text-[11px] text-dv-text-3">{formatClock(last.at)}</span>}
                    </span>
                    <span className={cn('dv-label block text-[10px]', NAME[accentOf(t.npcId)])}>{npc.title}</span>
                    <span className={cn('mt-1 block truncate font-body text-[15px]', fresh ? 'text-dv-text' : 'text-dv-text-2')}>
                      {t.typing ? (
                        <span className="inline-flex items-center gap-2 italic text-dv-cobalt-text">
                          digitando <TypingDots />
                        </span>
                      ) : last ? (
                        stickerSrc(last.text) ? (
                          'Figurinha'
                        ) : (
                          last.text
                        )
                      ) : (
                        <span className="italic text-dv-text-3">Nenhuma mensagem ainda.</span>
                      )}
                    </span>
                  </span>
                  {fresh && (
                    <span className="dv-tabular grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-dv-blood px-1 font-mono text-[11px] text-white shadow-[0_0_10px_rgba(213,31,43,0.7)]">
                      {t.unread}
                      <span className="sr-only"> não lidas</span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <section className="animate-dv-rise mt-auto px-3 pb-4 pt-2 [animation-delay:420ms]" aria-label="Jogadores">
          <div className="mb-2 flex items-center gap-3 px-1">
            <span className="dv-label text-[10px] text-dv-text-3">Jogadores</span>
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-line-strong to-transparent" />
          </div>
          <Frame pad="md" cutSize={12} className="opacity-90">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center border border-dashed border-dv-line-strong text-dv-text-3">
                <GlyphKeyhole className="size-6" />
              </span>
              <div className="min-w-0">
                <Badge tone="neutral">Bloqueado</Badge>
                <p className="mt-2 font-body text-[15px] leading-snug text-dv-text-2">Conversas livres entre jogadores ainda não foram liberadas.</p>
                <p className="mt-1 font-body text-[14px] italic leading-snug text-dv-text-3">O Anfitrião decide quando este canal abre. Até lá, só ele e os convidados dele falam com você.</p>
              </div>
            </div>
          </Frame>
        </section>
      </div>

      {active ? (
        <Conversation key={active.id} threadId={active.id} onBack={() => setActiveId(null)} />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-6 text-center @xl:flex">
          <p className="font-serif text-[44px] uppercase tracking-[0.08em] text-dv-text/25">Devo</p>
          <p className="font-body text-[15px] italic text-dv-text-3">Escolha uma conversa. Cuidado com quem responde.</p>
        </div>
      )}
    </div>
  )
}

function Conversation({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const { state, dispatch } = useDevo()
  const thread = state.threads.find((t) => t.id === threadId)!
  const npc = getNpc(thread.npcId)
  const accent = accentOf(npc.id)
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const choices = availableChoices(npc, thread.answered)
  useBackHandler(true, onBack)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.messages.length, thread.typing])

  const ask = (choice: DialogueChoice) => {
    if (pending || thread.answered.includes(choice.id)) return
    setPending(true)
    playSfx('send')
    dispatch({ type: 'THREAD_ANSWER', threadId, choiceId: choice.id })
    if (!choice.silent) {
      const text = choice.sticker ? `${STICKER_PREFIX}${choice.sticker}` : choice.prompt
      dispatch({ type: 'THREAD_MESSAGE', threadId, countUnread: false, message: { id: nextId('m'), from: 'me', text, at: Date.now() } })
    }
    if (choice.reply.length === 0) {
      window.setTimeout(() => setPending(false), 400)
      return
    }
    let delay = 700
    choice.reply.forEach((line, i) => {
      window.setTimeout(() => dispatch({ type: 'THREAD_TYPING', threadId, typing: true }), delay)
      delay += 1100 + line.length * 18
      window.setTimeout(() => {
        dispatch({
          type: 'THREAD_MESSAGE',
          threadId,
          countUnread: false,
          message: { id: nextId('m'), from: npc.id, text: withName(line, state.playerName), at: Date.now() },
        })
        playSfx('notify')
        if (i === choice.reply.length - 1) setPending(false)
      }, delay)
      delay += 300
    })
  }

  const Art = npc.art
  const portrait = npc.portraits.neutral

  return (
    <section className="animate-dv-slide-left relative isolate flex min-w-0 flex-1 flex-col overflow-hidden" aria-label={`Conversa com ${npc.name}`}>
      {/* retrato grande ao fundo, como numa cena */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_85%_35%,rgba(49,93,255,0.16),transparent_70%)]" />
        <div className="absolute -right-12 top-10 h-[62%] w-[78%] opacity-[0.17] [mask-image:linear-gradient(90deg,transparent,#000_45%)]">
          {Art ? (
            <Art className="size-full" />
          ) : portrait ? (
            <Image src={portrait} alt="" fill sizes="320px" className="object-contain object-right-top" />
          ) : (
            <span className="absolute right-6 top-0 font-impact text-[260px] font-bold leading-none text-dv-text/60">?</span>
          )}
        </div>
      </div>

      <header className="relative flex items-center gap-3 bg-dv-ink/70 px-2 py-2.5 backdrop-blur-md">
        <IconButton label="Voltar para conversas" variant="ghost" onClick={onBack} className="@xl:hidden">
          <GlyphArrow className="rotate-180" />
        </IconButton>
        <Portrait npcId={thread.npcId} size={46} className="@xl:ml-2" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[18px] font-semibold uppercase leading-none tracking-[0.06em] text-dv-text">{npc.name}</p>
          <p className={cn('dv-label mt-1.5 text-[10px]', NAME[accent])}>{thread.typing ? 'digitando…' : npc.title}</p>
        </div>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-dv-gold/60 via-dv-gold/20 to-transparent" />
      </header>

      <div ref={listRef} className="devo-scroll flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4" aria-live="polite">
        {thread.messages.length === 0 && (
          <p className="m-auto max-w-[16rem] text-center font-body text-[16px] italic text-dv-text-3">Nenhuma mensagem ainda. A primeira palavra é sua.</p>
        )}
        {thread.messages.map((m, i) => {
          const mine = m.from === 'me'
          const first = thread.messages[i - 1]?.from !== m.from
          return <Bubble key={m.id} text={m.text} at={m.at} mine={mine} first={first} name={mine ? 'Você' : npc.name} accent={accent} />
        })}
        {thread.typing && (
          <div className="animate-dv-fade mt-2 self-start">
            <BubbleShell mine={false} accent={accent}>
              <TypingDots className={accent === 'paper' ? 'text-dv-paper-ink' : 'text-dv-text-2'} />
            </BubbleShell>
          </div>
        )}
      </div>

      <div className="relative border-t border-dv-line bg-dv-ink/85 px-3 pb-3 pt-3 backdrop-blur-md">
        <p className="dv-label mb-2.5 px-1 text-[10px] text-dv-text-3">{choices.length ? 'Escolha o que perguntar · a resposta não muda' : 'Nada mais a perguntar'}</p>
        {choices.length > 0 ? (
          <ul className="flex flex-col gap-2" aria-label="Escolhas de diálogo">
            {choices.map((c, i) => (
              <li key={c.id} className="animate-dv-slide-right" style={{ animationDelay: `${i * 70}ms` }}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => ask(c)}
                  className="dv-focus group relative isolate flex min-h-12 w-full items-center gap-3 py-2 pl-3 pr-4 text-left transition-transform duration-200 enabled:hover:translate-x-1 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:grayscale"
                  style={{ '--dv-cut': '10px', rotate: `${i % 2 ? 0.5 : -0.5}deg` } as CSSProperties}
                >
                  <span aria-hidden="true" className="dv-cut-diag dv-paper-bg absolute inset-0 -z-10 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.9)]" />
                  <span aria-hidden="true" className="absolute inset-y-1.5 left-11 -z-10 border-l border-dashed border-dv-paper-ink/25" />
                  <span aria-hidden="true" className="w-7 shrink-0 text-center font-impact text-[20px] font-semibold leading-none text-dv-cobalt-deep">
                    {toRoman(i + 1)}
                  </span>
                  <span className="flex-1 pl-2 font-body text-[16px] leading-snug text-dv-paper-ink">{c.prompt}</span>
                  <GlyphArrow aria-hidden="true" className="size-4 shrink-0 text-dv-paper-ink/60 transition-transform group-enabled:group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 font-body text-[15px] italic text-dv-text-3">{npc.doneText ?? `${npc.name} já disse tudo o que tinha a dizer. Por enquanto.`}</p>
        )}
      </div>
    </section>
  )
}

const BUBBLE_LINE: Record<Accent, string> = {
  gold: 'bg-dv-gold/70',
  cobalt: 'bg-dv-cobalt/70',
  paper: 'bg-dv-gold-deep',
  neutral: 'bg-dv-line-strong',
}

function BubbleShell({ mine, accent, children }: { mine: boolean; accent: Accent; children: React.ReactNode }) {
  const paper = !mine && accent === 'paper'
  return (
    <div className="relative isolate px-4 py-2.5" style={{ '--dv-cut': '10px' } as CSSProperties}>
      <span aria-hidden="true" className={cn('dv-cut-diag absolute inset-0 -z-10', mine && '-scale-x-100', mine ? 'bg-dv-cobalt/80' : BUBBLE_LINE[accent])} />
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut-diag absolute inset-px -z-10',
          mine && '-scale-x-100',
          mine ? 'bg-[linear-gradient(160deg,#16297a,var(--dv-cobalt-dim)_60%)]' : paper ? 'dv-paper-bg' : 'bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink-2)_70%)]',
        )}
        style={{ '--dv-cut': '9.6px' } as CSSProperties}
      />
      {!mine && !paper && <span aria-hidden="true" className={cn('absolute inset-y-2 left-0 w-[2px]', accent === 'gold' ? 'bg-dv-gold' : accent === 'cobalt' ? 'bg-dv-cobalt' : 'bg-dv-text-3')} />}
      {children}
    </div>
  )
}

function Bubble({ text, at, mine, first, name, accent }: { text: string; at: number; mine: boolean; first: boolean; name: string; accent: Accent }) {
  const sticker = stickerSrc(text)
  const paper = !mine && accent === 'paper'
  return (
    <div className={cn('flex max-w-[84%] flex-col gap-1', mine ? 'animate-dv-slide-left items-end self-end' : 'animate-dv-slide-right self-start', first && 'mt-2.5')}>
      {first && <span className={cn('dv-label px-1 text-[10px]', mine ? 'text-dv-cobalt-text' : NAME[accent])}>{name}</span>}
      {sticker ? (
        <Image src={sticker} alt="Figurinha" width={128} height={128} className="size-28 object-contain mix-blend-lighten" />
      ) : (
        <BubbleShell mine={mine} accent={accent}>
          <p className={cn('font-body text-[16px] leading-relaxed', paper ? 'text-dv-paper-ink' : 'text-dv-text')}>{text}</p>
        </BubbleShell>
      )}
      <span className="dv-tabular px-1 font-mono text-[10px] text-dv-text-3">{formatClock(at)}</span>
    </div>
  )
}
