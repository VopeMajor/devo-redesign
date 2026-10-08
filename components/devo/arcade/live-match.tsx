'use client'

import { Flame, Heart, MessageSquare, Rat, Skull, X, Zap, type LucideIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { arcadePost, type ChatLine } from '@/lib/devo/arcade/client'
import { REACTION_IDS, REACTION_PREFIX, reactionOf, type ReactionId } from '@/lib/devo/arcade/reactions'
import { cn } from '@/lib/utils'
import { ArcadeChat, ChatMessage, useChatLines } from './arcade-chat'

const REACTIONS: Record<ReactionId, { label: string; icon?: LucideIcon; text?: string; color: string }> = {
  gg: { label: 'GG', text: 'GG', color: '#5fd3a5' },
  fogo: { label: 'Fogo', icon: Flame, color: '#ff9d5c' },
  caveira: { label: 'Caveira', icon: Skull, color: '#e8e8ee' },
  kkk: { label: 'Risada', text: 'KKK', color: '#e2b95c' },
  choque: { label: 'Choque', icon: Zap, color: '#5ec8e8' },
  coracao: { label: 'Coração', icon: Heart, color: '#8fa6ff' },
  f: { label: 'F', text: 'F', color: '#c08bff' },
  rato: { label: 'Rato', icon: Rat, color: '#8a90a0' },
}

type Floating = { key: string; id: ReactionId; x: number; drift: number }

const LiveContext = createContext<string | null>(null)

export function LiveMatchProvider({ channel, children }: { channel: string; children: ReactNode }) {
  return <LiveContext.Provider value={channel}>{children}</LiveContext.Provider>
}

export function useLiveChannel() {
  return useContext(LiveContext)
}

function ReactionGlyph({ id, className }: { id: ReactionId; className?: string }) {
  const r = REACTIONS[id]
  if (r.icon) {
    const Icon = r.icon
    return <Icon className={className} style={{ color: r.color }} strokeWidth={2} aria-hidden="true" />
  }
  return (
    <span className={cn('font-mono font-black leading-none', className)} style={{ color: r.color }} aria-hidden="true">
      {r.text}
    </span>
  )
}

/** Chat ao vivo da partida: botão no cabeçalho, painel lateral, reações flutuantes e mensagens rápidas sobre o jogo. */
export function LiveMatchLayer({ channel }: { channel: string }) {
  const [open, setOpen] = useState(false)
  const { data, mutate } = useChatLines(channel, 2000)
  const [floating, setFloating] = useState<Floating[]>([])
  const [toasts, setToasts] = useState<ChatLine[]>([])
  const [unread, setUnread] = useState(0)
  const seen = useRef<Set<string> | null>(null)
  const openRef = useRef(open)
  openRef.current = open

  const spawn = (id: ReactionId) => {
    const key = `${Date.now()}-${Math.random()}`
    setFloating((f) => [...f.slice(-18), { key, id, x: 8 + Math.random() * 30, drift: (Math.random() - 0.5) * 60 }])
    window.setTimeout(() => setFloating((f) => f.filter((x) => x.key !== key)), 2800)
  }

  useEffect(() => {
    const msgs = data?.messages
    if (!msgs) return
    if (!seen.current) {
      seen.current = new Set(msgs.map((m) => m.id))
      return
    }
    const fresh = msgs.filter((m) => !seen.current?.has(m.id))
    if (!fresh.length) return
    for (const m of fresh) seen.current.add(m.id)
    const texts: ChatLine[] = []
    for (const m of fresh) {
      const r = reactionOf(m.body)
      if (r) spawn(r)
      else if (!m.body.startsWith(REACTION_PREFIX)) texts.push(m)
    }
    if (texts.length && !openRef.current) {
      setUnread((u) => u + texts.length)
      setToasts((t) => [...t, ...texts].slice(-3))
      const ids = new Set(texts.map((t) => t.id))
      window.setTimeout(() => setToasts((t) => t.filter((x) => !ids.has(x.id))), 6000)
    }
  }, [data])

  const react = async (id: ReactionId) => {
    spawn(id)
    playSfx('send')
    try {
      await arcadePost({ action: 'chat', channel, body: `${REACTION_PREFIX}${id}` })
      mutate()
    } catch {
      /* limite de taxa: a reação local já apareceu */
    }
  }

  const toggle = () => {
    setOpen((o) => !o)
    setUnread(0)
    setToasts([])
  }

  const viewers = new Set((data?.messages ?? []).map((m) => m.author)).size

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Fechar chat ao vivo' : 'Abrir chat ao vivo'}
        className={cn(
          'relative flex h-8 items-center gap-1.5 border px-2.5 text-[10px] uppercase tracking-[0.25em] transition-colors',
          open ? 'border-[#8fa6ff]/70 bg-[#8fa6ff]/10 text-[#8fa6ff]' : 'border-foreground/20 text-foreground/70 hover:border-[#8fa6ff]/60 hover:text-foreground',
        )}
      >
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-[#8fa6ff] shadow-[0_0_8px_#8fa6ff]" />
        <MessageSquare className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Ao vivo</span>
        {unread > 0 && !open && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-[#8fa6ff] px-1 font-mono text-[9px] text-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <LivePortalTarget>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
          {floating.map((f) => (
            <span
              key={f.key}
              className="dv-react-rise absolute bottom-16 grid size-11 place-items-center rounded-full border border-white/15 bg-black/55 backdrop-blur-sm"
              style={{ right: `${f.x}%`, ['--drift' as string]: `${f.drift}px` }}
            >
              <ReactionGlyph id={f.id} className="size-5 text-sm" />
            </span>
          ))}
        </div>

        {!open && toasts.length > 0 && (
          <ul className="pointer-events-none absolute bottom-3 left-3 z-[26] flex max-w-[min(20rem,70%)] flex-col gap-1">
            {toasts.map((m) => (
              <li key={m.id} className="dv-enter border-l-2 bg-black/70 px-2.5 py-1.5 backdrop-blur-sm" style={{ borderColor: '#8fa6ff' }}>
                <ChatMessage m={m} compact />
              </li>
            ))}
          </ul>
        )}

        {open && (
          <aside
            aria-label="Chat ao vivo da partida"
            className="absolute inset-x-0 bottom-0 z-30 flex h-[62%] flex-col border-t border-[#8fa6ff]/30 bg-[#0b0d12]/95 backdrop-blur-md sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:h-auto sm:w-80 sm:border-l sm:border-t-0"
          >
            <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="flex items-center gap-1.5 bg-[#8fa6ff] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-black">
                <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-black" />
                Live
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">Chat da partida</span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-foreground/45" title="Participantes no chat">
                {viewers} no chat
              </span>
              <button type="button" onClick={toggle} aria-label="Fechar chat" className="grid size-7 place-items-center text-foreground/50 hover:text-foreground">
                <X className="size-4" />
              </button>
            </header>
            <p className="border-b border-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-foreground/35">
              As mensagens somem quando a partida acaba
            </p>
            <ArcadeChat
              channel={channel}
              refreshInterval={2000}
              placeholder="Enviar mensagem"
              className="min-h-0 flex-1 p-3"
              toolbar={<ReactionBar onReact={react} />}
            />
          </aside>
        )}

        {!open && (
          <div className="absolute bottom-3 right-3 z-[26] hidden flex-col gap-1 md:flex">
            {(['gg', 'fogo', 'kkk', 'caveira'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => react(id)}
                aria-label={`Reagir: ${REACTIONS[id].label}`}
                className="grid size-9 place-items-center rounded-full border border-white/10 bg-black/50 opacity-60 backdrop-blur-sm transition hover:scale-110 hover:opacity-100"
              >
                <ReactionGlyph id={id} className="size-4 text-[11px]" />
              </button>
            ))}
          </div>
        )}
      </LivePortalTarget>
    </>
  )
}

function ReactionBar({ onReact }: { onReact: (id: ReactionId) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1 border-y border-white/10 py-1.5" role="group" aria-label="Reações">
      {REACTION_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onReact(id)}
          aria-label={`Reagir: ${REACTIONS[id].label}`}
          className="grid h-8 place-items-center rounded-sm transition hover:scale-110 hover:bg-white/5"
        >
          <ReactionGlyph id={id} className="size-4 text-[11px]" />
        </button>
      ))}
    </div>
  )
}

/** O botão vive no cabeçalho; as camadas sobrepostas vão para a área do jogo via contexto. */
const LayerTargetContext = createContext<HTMLElement | null>(null)

export function LiveLayerTarget({ el, children }: { el: HTMLElement | null; children: ReactNode }) {
  return <LayerTargetContext.Provider value={el}>{children}</LayerTargetContext.Provider>
}

function LivePortalTarget({ children }: { children: ReactNode }) {
  const el = useContext(LayerTargetContext)
  if (!el) return null
  return createPortal(children, el)
}
