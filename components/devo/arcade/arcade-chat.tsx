'use client'

import { Send } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { arcadeFetcher, arcadeKey, arcadePost, type ChatLine } from '@/lib/devo/arcade/client'
import { REACTION_PREFIX } from '@/lib/devo/arcade/reactions'
import { cn } from '@/lib/utils'
import { useOpenProfile } from './mini-profile'

const NAME_COLORS = ['#6f8cff', '#8fa6ff', '#e2b95c', '#5fd3a5', '#c08bff', '#5ec8e8', '#ff9d5c', '#e86fb0']

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
    <p className={cn('break-words leading-snug', compact ? 'text-[13px]' : 'text-sm')}>
      {!compact && <time className="mr-1.5 font-mono text-[10px] tabular-nums text-foreground/30">{time}</time>}
      {staff && (
        <span title="Dealer" className="mr-1 inline-grid size-4 place-items-center bg-[#8fa6ff] align-[-2px] font-mono text-[9px] font-bold text-black">
          D
        </span>
      )}
      {m.bot && <span className="mr-1 inline-block border border-foreground/25 px-1 align-[1px] font-mono text-[8px] uppercase text-foreground/50">bot</span>}
      {m.pid && openProfile ? (
        <button type="button" onClick={() => openProfile(m.pid as string)} className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-1" aria-label={`Ver perfil de ${m.author}`}>
          {name}
        </button>
      ) : (
        name
      )}
      <span className="text-foreground/50">: </span>
      <span className="text-foreground/85">{m.body}</span>
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
      <ul ref={listRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1" aria-live="polite">
        {count === 0 && <li className="py-6 text-center text-xs text-foreground/40">Bem-vindo ao chat. Seja o primeiro a falar.</li>}
        {lines.map((m) => (
          <li key={m.id} className="rounded-sm px-1 py-0.5 hover:bg-white/[0.04]">
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
          className="min-w-0 flex-1 border border-foreground/20 bg-black/50 px-3 py-2 text-sm outline-none focus:border-[#6f8cff]/60"
        />
        <button type="submit" className="border border-[#6f8cff]/60 px-3 text-[#6f8cff] hover:bg-[#6f8cff]/10" aria-label="Enviar">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}
