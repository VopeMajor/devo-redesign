'use client'

import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { IconButton } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { arcadeFetcher, arcadeKey, arcadePost, type ChatLine } from '@/lib/devo/arcade/client'
import { REACTION_PREFIX } from '@/lib/devo/arcade/reactions'
import { cn } from '@/lib/utils'
import { usePlayerText } from '../state/player-text'
import { useOpenProfile } from './mini-profile'
import type { Visual } from '@/lib/devo/cosmeticos'
import { BalaoChat, FotoMoldurada, NomeVisual } from '../cosmeticos/cosmetic-art'
import { useCatalogo, useVisual, useVisuais } from '../cosmeticos/use-cosmeticos'

// Nomes no chat em tons da paleta (porcelana, aço, prata, lavanda, ametista clara): distintos sem virar arco-íris.
const NAME_COLORS = ['#f1f0ee', '#ece5d8', '#bab09f', '#c2b9ec', '#b7b3c9', '#d9d8d4', '#9a9184', '#cbc5e8']

export function nameColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return NAME_COLORS[h % NAME_COLORS.length]
}

export function useChatLines(channel: string, refreshInterval = 5000) {
  return useSWR<{ messages: ChatLine[] }>(arcadeKey('chat', `&channel=${channel}`), arcadeFetcher, { refreshInterval })
}

/** Foto pública de um jogador (Sala de Jogos). */
export function fotoPublica(pid: string | undefined, v: Visual | null | undefined) {
  return pid && v?.foto ? `/api/arcade?view=avatar&pid=${pid}&v=${v.foto}` : null
}

/**
 * Linha do chat com a aparência pública do autor (texto do dono §5–§6): miniperfil com moldura, nome com
 * efeito/emblema, balão equipado. Anfitrião tem selo e tipografia próprios (cargo público); Dealer, a marca D;
 * o Owner não tem marca nenhuma — aparece só com o que equipou, como qualquer jogador.
 * Em listas, as animações dos cosméticos ficam paradas (desempenho no celular).
 */
/** Um formatador só: toLocaleTimeString monta um novo a cada chamada, e o chat tem até 60 linhas. */
let timeFmt: Intl.DateTimeFormat | null = null
const formatTime = (at: number) => (timeFmt ??= new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })).format(at)

export function ChatMessage({ m, compact, visual }: { m: ChatLine; compact?: boolean; visual?: Visual | null }) {
  const openProfile = useOpenProfile()
  const proprio = useVisual(visual === undefined ? m.pid : null)
  const v = visual === undefined ? proprio : visual
  const { mapa } = useCatalogo()
  const color = m.bot ? '#8a90a0' : nameColor(m.author)
  const time = formatTime(m.at)
  const balao = v?.bal ? (mapa.get(v.bal) ?? null) : null
  const dealer = m.role === 'dealer' && (
    <span title="Dealer" className="inline-grid size-[18px] shrink-0 place-items-center bg-dv-gold font-mono text-[10px] font-bold text-dv-ink">
      D
    </span>
  )
  const nome = <NomeVisual nome={m.author} visual={v} cor={color} tamanhoEmblema={compact ? 14 : 16} parado />
  const nomeBotao =
    m.pid && openProfile ? (
      <button type="button" onClick={() => openProfile(m.pid as string)} className="dv-focus -my-2 inline-flex min-w-0 max-w-full py-2 hover:underline" aria-label={`Ver perfil de ${m.author}`}>
        {nome}
      </button>
    ) : (
      nome
    )
  if (compact) {
    return (
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 break-words font-body text-[14px] leading-snug">
        {dealer}
        {m.bot && <span className="inline-block border border-dv-line-strong px-1 align-[1px] font-mono text-[10px] uppercase text-dv-text-3">bot</span>}
        {nomeBotao}
        <span className="text-dv-text-3">:</span>
        <span className="text-dv-text">{m.body}</span>
      </p>
    )
  }
  const mini = v?.mini ? (mapa.get(v.mini) ?? null) : null
  return (
    <div className="flex min-w-0 gap-2.5">
      {m.pid && openProfile ? (
        <button type="button" onClick={() => openProfile(m.pid as string)} className="dv-focus shrink-0 self-start" aria-label={`Abrir miniperfil de ${m.author}`}>
          <FotoMoldurada formato="mini" src={fotoPublica(m.pid, v)} moldura={mini} largura={42} animar={false} />
        </button>
      ) : (
        <FotoMoldurada formato="mini" src={null} moldura={null} largura={42} animar={false} className="self-start opacity-60" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5 font-body text-[15px] leading-tight">
          {dealer}
          {m.bot && <span className="inline-block shrink-0 border border-dv-line-strong px-1 font-mono text-[10px] uppercase text-dv-text-3">bot</span>}
          <span className="min-w-0">{nomeBotao}</span>
          <time className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-dv-text-3">{time}</time>
        </p>
        {balao ? (
          <BalaoChat def={balao} animar={false} className="mt-1.5 w-fit max-w-full break-words font-body text-[15px] leading-snug">
            {m.body}
          </BalaoChat>
        ) : (
          <p className="mt-0.5 break-words font-body text-[15px] leading-snug text-dv-text">{m.body}</p>
        )}
      </div>
    </div>
  )
}

/** Memoizado: dentro de um jogo o pai redesenha a cada tique do relógio; o chat só muda quando chegam mensagens. */
export const ArcadeChat = memo(function ArcadeChat({
  channel,
  placeholder = 'Diga algo à mesa…',
  className,
  refreshInterval = 5000,
  toolbar,
  readOnly = false,
  emptyText,
}: {
  channel: string
  /** Só leitura: sem campo de digitar (registro da mesa). */
  readOnly?: boolean
  emptyText?: string
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
  const visualDe = useVisuais(lines.map((l) => l.pid))

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [count])

  const say = usePlayerText()
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
        {count === 0 && (
          <li className="py-6 text-center font-body text-[15px] text-dv-text-3">{emptyText ?? say('{Bem-vindo|Bem-vinda} ao chat. Seja {o primeiro|a primeira} a falar.')}</li>
        )}
        {lines.map((m) => (
          <li key={m.id} className="animate-dv-fade border-l border-transparent px-2 py-1.5 hover:border-dv-gold/50 hover:bg-white/[0.03]">
            <ChatMessage m={m} visual={visualDe(m.pid)} />
          </li>
        ))}
      </ul>
      {toolbar}
      {!readOnly && (
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
          className="min-h-11 min-w-0 flex-1 border border-dv-line-strong bg-dv-ink/80 px-3 font-body text-[16px] text-dv-text outline-none placeholder:text-dv-text-3 focus:border-dv-gold"
        />
        <IconButton type="submit" label="Enviar" variant="primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11.5 L21 3 L14.5 21 L11.5 13 Z" />
            <path d="M11.5 13 L21 3" />
          </svg>
        </IconButton>
      </form>
      )}
    </div>
  )
})
