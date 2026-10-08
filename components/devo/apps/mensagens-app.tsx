'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Lock, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { availableChoices, getNpc, STICKER_PREFIX, stickerSrc, type DialogueChoice } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { cn } from '@/lib/utils'
import { formatClock } from '../hooks'
import { nextId, useDevo } from '../state/devo-store'
import { useBackHandler } from '../use-back-handler'
import { TypingDots } from './app-ui'

function Avatar({ npcId, className }: { npcId: string; className?: string }) {
  const npc = getNpc(npcId)
  const src = npc.portraits.neutral
  const Art = npc.art
  return (
    <span className={cn('relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-foreground/25 bg-secondary', className)}>
      {Art ? (
        <Art crop="face" className="absolute inset-0 size-full" />
      ) : src ? (
        <Image src={src} alt="" fill sizes="48px" className="object-cover object-top" />
      ) : (
        <span className="font-serif uppercase tracking-[0.08em] text-lg text-primary">?</span>
      )}
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

  return (
    <div className="flex h-full @container">
      <ul
        className={cn(
          'devo-scroll flex w-full flex-col overflow-y-auto border-foreground/10 @xl:w-64 @xl:shrink-0 @xl:border-r',
          active && 'hidden @xl:flex',
        )}
        aria-label="Conversas"
      >
        {state.threads.map((t) => {
          const npc = getNpc(t.npcId)
          if (npc.hidden && t.messages.length === 0 && !t.typing) return null
          const last = t.messages.at(-1)
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  playSfx('click')
                  setActiveId(t.id)
                }}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-foreground/10 px-4 py-3 text-left transition-colors hover:bg-foreground/5',
                  t.id === activeId && 'bg-primary/10',
                )}
              >
                <Avatar npcId={t.npcId} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">{npc.name}</span>
                    {last && <span className="text-[11px] text-muted-foreground">{formatClock(last.at)}</span>}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {t.typing ? 'digitando…' : last ? (stickerSrc(last.text) ? 'Figurinha' : last.text) : npc.title}
                  </span>
                </span>
                {t.unread > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">{t.unread}</span>
                )}
              </button>
            </li>
          )
        })}
        <li className="mt-auto border-t border-foreground/10 px-4 py-4" aria-label="Jogadores">
          <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            Jogadores
          </p>
          <div className="flex items-center gap-3 border border-dashed border-foreground/15 px-3 py-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            Conversas livres entre jogadores ainda não foram liberadas.
          </div>
        </li>
      </ul>

      {active ? (
        <Conversation key={active.id} threadId={active.id} onBack={() => setActiveId(null)} />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-2 p-6 text-center @xl:flex">
          <p className="font-serif uppercase tracking-[0.08em] text-4xl text-foreground/30">Devo</p>
          <p className="text-sm text-muted-foreground">Escolha uma conversa. Cuidado com quem responde.</p>
        </div>
      )}
    </div>
  )
}

function Conversation({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const { state, dispatch } = useDevo()
  const thread = state.threads.find((t) => t.id === threadId)!
  const npc = getNpc(thread.npcId)
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

  return (
    <section className="flex min-w-0 flex-1 flex-col" aria-label={`Conversa com ${npc.name}`}>
      <header className="flex items-center gap-3 border-b border-foreground/10 px-4 py-3">
        <button type="button" onClick={onBack} className="text-foreground/70 hover:text-foreground @xl:hidden" aria-label="Voltar para conversas">
          <ChevronLeft className="size-5" />
        </button>
        <Avatar npcId={thread.npcId} className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-foreground">{npc.name}</p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{npc.title}</p>
        </div>
      </header>
      <div ref={listRef} className="devo-scroll flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {thread.messages.length === 0 && <p className="m-auto text-sm italic text-muted-foreground">Nenhuma mensagem ainda.</p>}
        {thread.messages.map((m) => {
          const sticker = stickerSrc(m.text)
          return (
            <div key={m.id} className={cn('flex max-w-[80%] flex-col gap-1 animate-pop', m.from === 'me' ? 'self-end items-end' : 'self-start')}>
              {sticker ? (
                <Image src={sticker} alt="Figurinha" width={128} height={128} className="size-28 object-contain mix-blend-lighten" />
              ) : (
                <p
                  className={cn(
                    'px-3.5 py-2 text-[15px] leading-relaxed',
                    m.from === 'me' ? 'border border-primary/50 bg-primary/15 text-foreground' : 'border border-foreground/15 bg-secondary text-foreground/90',
                  )}
                >
                  {m.text}
                </p>
              )}
              <span className="text-[10px] text-muted-foreground">{formatClock(m.at)}</span>
            </div>
          )
        })}
        {thread.typing && (
          <div className="self-start border border-foreground/15 bg-secondary px-3.5 py-3">
            <TypingDots />
          </div>
        )}
      </div>
      <div className="border-t border-foreground/10 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {choices.length ? 'Escolha o que perguntar · a resposta não muda' : 'Nada mais a perguntar'}
        </p>
        {choices.length > 0 ? (
          <ul className="flex flex-col gap-1.5" aria-label="Escolhas de diálogo">
            {choices.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => ask(c)}
                  className="group flex w-full items-center gap-3 border border-foreground/20 bg-background/60 px-3 py-2 text-left text-[15px] text-foreground/85 transition-colors hover:border-primary/70 hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  {c.prompt}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-muted-foreground">{npc.doneText ?? `${npc.name} já disse tudo o que tinha a dizer. Por enquanto.`}</p>
        )}
      </div>
    </section>
  )
}
