'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { IconButton } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { arcadeFetcher, arcadeKey, arcadePost, type ChatLine } from '@/lib/devo/arcade/client'
import { REACTION_PREFIX } from '@/lib/devo/arcade/reactions'
import { cn } from '@/lib/utils'
import { useOpenProfile } from './mini-profile'

const NAME_COLORS = ['#7d97ff', '#a9bbff', '#ecd49a', '#7fdcb6', '#c9a6ff', '#7fd3ec', '#ffb07f', '#f08cc0']

export function nameColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return NAME_COLORS[h % NAME_COLORS.length]
}

export function useChatLines(channel: string, refreshInterval = 5000) {
  return useSWR<{ messages: ChatLine[] }>(arcadeKey('chat', `&channel=${channel}`), arcadeFetcher, { refreshInterval })
}

export function ChatMessage({ m, compact }: { m: ChatLine; compact?: boolean }) {
  const openProfile = useOpenProfile()
  const color = m.bot ? '#8a90a0' : nameColor(m.author)
  const staff = m.role === 'dealer' || m.role === 'admin'
  const time = new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const name = (
    <span className="font-semibold" style={{ color }}>
      {m.author}
    </span>
  )
  return (
    <p className={cn('break-words font-body leading-snug', compact ? 'text-[14px]' : 'text-[15px]')}>
      {!compact && <time className="mr-2 font-mono text-[11px] tabular-nums text-dv-text-3">{time}</time>}
      {staff && (
        <span title="Dealer" className="mr-1.5 inline-grid size-[18px] place-items-center bg-dv-gold align-[-3px] font-mono text-[10px] font-bold text-dv-ink">
          D
        </span>
      )}
      {m.bot && <span className="mr-1.5 inline-block border border-dv-line-strong px-1 align-[1px] font-mono text-[10px] uppercase text-dv-text-3">bot</span>}
      {m.pid && openProfile ? (
        <button type="button" onClick={() => openProfile(m.pid as string)} className="dv-focus -my-2 inline py-2 hover:underline" aria-label={`Ver perfil de ${m.author}`}>
          {name}
        </button>
      ) : (
        name
      )}
      <span className="text-dv-text-3">: </span>
      <span className="text-dv-text">{m.body}</span>
    </p>
  )
}

export function ArcadeChat({
  channel,
  placeholder = 'Diga algo à mesa…',
  className,
  refreshInterval = 5000,
  toolbar,
}: {
  channel: string
  placeholder?: string
  className?: string
  refreshInterval?: number
  toolbar?: ReactNode
}) {
  const { data, mutate } = useChatLines(channel, refreshInterval)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLUListElement>(null)
  const lines = (data?.messages ?? []).filter((m) => !m.body.startsWith(REACTION_PREFIX))
  const count = lines.length

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [count])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    try {
      await arcadePost({ action: 'chat', channel, body })
      playSfx('send')
      mutate()
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  return (
    <div className={cn('flex min-h-0 flex-col gap-2', className)}>
      <ul ref={listRef} className="devo-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1" aria-live="polite">
        {count === 0 && <li className="py-6 text-center font-body text-[15px] text-dv-text-3">Bem-vindo ao chat. Seja o primeiro a falar.</li>}
        {lines.map((m) => (
          <li key={m.id} className="animate-dv-fade border-l border-transparent px-2 py-1 hover:border-dv-gold/50 hover:bg-white/[0.03]">
            <ChatMessage m={m} />
          </li>
        ))}
      </ul>
      {toolbar}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
          }}
          maxLength={200}
          placeholder={placeholder}
          aria-label="Mensagem"
          className="min-h-11 min-w-0 flex-1 border border-dv-line-strong bg-dv-ink/80 px-3 font-body text-[16px] text-dv-text outline-none placeholder:text-dv-text-3 focus:border-dv-cobalt"
        />
        <IconButton type="submit" label="Enviar" variant="primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11.5 L21 3 L14.5 21 L11.5 13 Z" />
            <path d="M11.5 13 L21 3" />
          </svg>
        </IconButton>
      </form>
    </div>
  )
}
