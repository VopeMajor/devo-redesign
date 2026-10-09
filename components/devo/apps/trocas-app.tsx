'use client'

import { Check, DoorOpen, Lock, LogOut, Send, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { RARITY_META, getCard } from '@/lib/devo/cards'
import { partnerReply } from '@/lib/devo/trade-bots'
import { QUICK_PHRASES, ROOM_RULES, TRADE_PROTOCOL, type RoomRuleMeta } from '@/lib/devo/trade-rooms'
import type { Room, TradeSession } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { Sparkle } from '../ornaments'
import { CardFace, DevoCard } from '../shared/devo-card'
import { nextId, useDevo } from '../state/devo-store'
import { ActionButton, Panel, SectionLabel, TypingDots } from './app-ui'

const STATUS_META: Record<Room['status'], { label: string; dot: string }> = {
  livre: { label: 'Livre', dot: 'bg-foreground/70' },
  ocupada: { label: 'Ocupada', dot: 'bg-primary' },
  sua: { label: 'Sua sala', dot: 'bg-[#c2b9ec]' },
}

const RULES = TRADE_PROTOCOL

export function TrocasApp() {
  const { state } = useDevo()
  return <div className="h-full @container">{state.trade ? <TradeRoom trade={state.trade} /> : <Lobby />}</div>
}

function Lobby() {
  const { state, dispatch } = useDevo()
  const free = state.rooms.filter((r) => r.status === 'livre').length
  return (
    <div className="devo-scroll flex h-full flex-col gap-5 overflow-y-auto p-5 @3xl:flex-row">
      <div className="flex flex-col gap-4 @3xl:flex-1">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionLabel>Corredor B · Andar 3</SectionLabel>
            <h2 className="mt-1 text-3xl text-foreground">Sala de Trocas</h2>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {free} de {state.rooms.length} salas livres
          </p>
        </header>
        <ul className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
          {state.rooms.map((room) => {
            const meta = STATUS_META[room.status]
            const free = room.status === 'livre'
            return (
              <li key={room.id}>
                <button
                  type="button"
                  disabled={!free}
                  onMouseEnter={() => free && playSfx('hover')}
                  onClick={() => {
                    playSfx('open')
                    dispatch({ type: 'TRADE_ENTER', roomId: room.id })
                  }}
                  aria-label={`Sala ${room.number}, ${meta.label}, ${room.condition}: ${ROOM_RULES[room.rule].summary}`}
                  className={cn(
                    'group relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden border p-3 text-left transition-all duration-300',
                    free
                      ? 'border-foreground/25 bg-card/80 hover:-translate-y-0.5 hover:border-foreground/60 hover:shadow-[0_10px_30px_-12px_var(--primary)]'
                      : 'cursor-not-allowed border-foreground/10 bg-background/60 opacity-60',
                  )}
                >
                  <span aria-hidden="true" className="absolute inset-x-4 bottom-0 top-8 rounded-t-full border border-b-0 border-foreground/15 transition-colors group-hover:border-primary/50" />
                  <span aria-hidden="true" className="absolute inset-x-[42%] bottom-0 h-1/3 bg-gradient-to-t from-primary/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">SALA</span>
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground/70">
                      <span className={cn('size-1.5 rounded-full', meta.dot, room.status === 'ocupada' && 'animate-blink')} />
                      {meta.label}
                    </span>
                  </span>
                  <span className="relative text-center font-serif uppercase tracking-[0.08em] text-5xl text-foreground/90">{String(room.number).padStart(2, '0')}</span>
                  <span className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    {room.condition}
                    {free ? <DoorOpen className="size-3.5 text-foreground/70" /> : <Lock className="size-3.5" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <Panel className="flex flex-col gap-3 @3xl:w-72 @3xl:shrink-0">
        <SectionLabel>Protocolo</SectionLabel>
        <ol className="flex flex-col gap-3">
          {RULES.map((rule, i) => (
            <li key={rule} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
              <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
              {rule}
            </li>
          ))}
        </ol>
        <p className="mt-auto border-t border-foreground/10 pt-3 text-sm italic text-muted-foreground">
          {'"Uma troca às cegas é um teste de caráter." — O Herdeiro'}
        </p>
      </Panel>
    </div>
  )
}

const STAGE_TEXT: Record<TradeSession['stage'], string> = {
  placing: 'Escolha uma carta para o seu espaço',
  waiting: 'Aguardando outro jogador…',
  negotiating: 'Negociação aberta',
  revealing: 'Revelando cartas…',
  done: 'Troca concluída',
  abandoned: 'Sala esvaziada',
}

function TradeRoom({ trade }: { trade: TradeSession }) {
  const { state, dispatch } = useDevo()
  const room = state.rooms.find((r) => r.id === trade.roomId)
  const rule = ROOM_RULES[room?.rule ?? 'mesma-raridade']
  const rarity = trade.myCard && rule.showRarity ? RARITY_META[getCard(trade.myCard.cardId).rarity] : null
  const partnerRarity = trade.partnerCardId && rule.showRarity ? RARITY_META[getCard(trade.partnerCardId).rarity] : null
  const revealed = trade.stage === 'revealing' || trade.stage === 'done'
  const finished = trade.stage === 'done' || trade.stage === 'abandoned'
  const forfeitRisk = rule.forfeitOnLeave && !finished && !!trade.myCard
  const [confirmLeave, setConfirmLeave] = useState(false)

  const leave = () => {
    if (forfeitRisk && !confirmLeave) {
      playSfx('click')
      setConfirmLeave(true)
      return
    }
    playSfx('close')
    if (!finished && trade.myCard) dispatch({ type: 'TRADE_CANCEL', forfeit: rule.forfeitOnLeave })
    dispatch({ type: 'TRADE_EXIT' })
  }

  return (
    <div className="flex h-full flex-col @3xl:flex-row">
      <section className="devo-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto" aria-label="Mesa de troca">
        <header className="flex items-center justify-between gap-3 border-b border-foreground/10 px-5 py-3">
          <div>
            <SectionLabel>
              Sala {String(room?.number ?? 0).padStart(2, '0')} · {room?.condition}
            </SectionLabel>
            <p className="mt-1 text-lg text-foreground" aria-live="polite">
              {STAGE_TEXT[trade.stage]}
            </p>
          </div>
          <ActionButton tone="danger" onClick={leave}>
            <LogOut className="size-3.5" />
            {finished ? 'Sair' : confirmLeave ? 'Sair e perder a carta' : 'Abandonar'}
          </ActionButton>
        </header>
        <RoomRuleBanner rule={rule} expanded={trade.stage === 'placing'} />

        <div className="relative flex flex-1 flex-col items-center justify-between gap-4 bg-[radial-gradient(ellipse_at_center,rgba(138,124,200,0.12),transparent_65%)] px-5 py-6">
          <Seat
            label="Espaço do outro"
            name={trade.partner?.handle ?? 'Vazio'}
            accepted={trade.partnerAccept}
            present={!!trade.partner}
            left={trade.endReason === 'partner-left'}
          >
            {trade.partner && trade.partnerCardId ? (
              <DevoCard cardId={trade.partnerCardId} faceDown={!revealed} size="md" className="w-28 @lg:w-32" />
            ) : (
              <EmptySlot waiting={trade.stage === 'waiting'} />
            )}
          </Seat>

          <div className="flex w-full max-w-md items-center gap-3 text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground/30" />
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]">
              <Sparkle className="size-2.5 text-primary" />
              {rarity ? (
                <span style={{ color: rarity.color }}>
                  {rule.sameRarity ? `${rarity.label} · garantida` : `Sua: ${rarity.label}`}
                  {!rule.sameRarity && partnerRarity && <span style={{ color: partnerRarity.color }}>{` · Dele: ${partnerRarity.label}`}</span>}
                </span>
              ) : trade.myCard ? (
                'Raridade oculta'
              ) : (
                'Mesa'
              )}
              <Sparkle className="size-2.5 text-primary" />
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-foreground/30" />
          </div>

          <Seat label="Seu espaço" name="Você" accepted={trade.myAccept} present mine>
            {trade.myCard ? (
              <CardFace cardId={trade.myCard.cardId} size="md" className="w-28 animate-pop @lg:w-32" />
            ) : (
              <EmptySlot />
            )}
          </Seat>
        </div>

        <TradeFooter trade={trade} onLeave={leave} />
      </section>

      <TradeChat trade={trade} rule={rule} />
    </div>
  )
}

function Seat({
  label,
  name,
  accepted,
  present,
  mine,
  left,
  children,
}: {
  label: string
  name: string
  accepted: boolean
  present: boolean
  mine?: boolean
  left?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-5', mine && 'flex-row-reverse')}>
      {children}
      <div className={cn('flex flex-col gap-1.5', mine ? 'items-end text-right' : 'items-start')}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <p className={cn('flex items-center gap-2 text-foreground', !present && 'text-muted-foreground')}>
          <User className="size-3.5" aria-hidden="true" />
          {left ? 'Saiu da sala' : name}
        </p>
        <p
          className={cn(
            'flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] transition-colors',
            accepted ? 'border-[#c2b9ec]/70 text-[#c2b9ec]' : 'border-foreground/15 text-muted-foreground',
          )}
        >
          {accepted && <Check className="size-3" />}
          {accepted ? 'Aceitou' : 'Indeciso'}
        </p>
      </div>
    </div>
  )
}

function EmptySlot({ waiting }: { waiting?: boolean }) {
  return (
    <div className="relative grid aspect-[9/20] w-28 place-items-center border border-dashed border-foreground/25 @lg:w-32">
      {waiting ? (
        <span className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="size-6 animate-spin rounded-full border border-foreground/20 border-t-primary" />
          Esperando
        </span>
      ) : (
        <Sparkle className="size-4 text-foreground/25" />
      )}
    </div>
  )
}

function TradeFooter({ trade, onLeave }: { trade: TradeSession; onLeave: () => void }) {
  const { state, dispatch } = useDevo()

  if (trade.stage === 'placing') {
    return (
      <div className="border-t border-foreground/10 p-4">
        <SectionLabel>Escolha a carta que vai à mesa</SectionLabel>
        <ul className="devo-scroll mt-3 flex gap-3 overflow-x-auto pb-2">
          {state.inventory.map((c) => (
            <li key={c.uid} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSfx('confirm')
                  dispatch({ type: 'TRADE_PLACE', uid: c.uid })
                }}
                className="block transition-transform duration-300 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none"
                aria-label={`Colocar ${getCard(c.cardId).name} na mesa`}
              >
                <CardFace cardId={c.cardId} size="sm" className="w-20" />
              </button>
            </li>
          ))}
          {state.inventory.length === 0 && <li className="text-sm italic text-muted-foreground">Você não tem cartas para trocar.</li>}
        </ul>
      </div>
    )
  }

  if (trade.stage === 'done' && trade.partnerCardId) {
    const card = getCard(trade.partnerCardId)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 p-4 animate-pop">
        <p className="text-foreground">
          Você recebeu <span style={{ color: RARITY_META[card.rarity].color }}>{card.name}</span>.
        </p>
        <ActionButton tone="primary" onClick={onLeave}>
          Voltar ao corredor
        </ActionButton>
      </div>
    )
  }

  if (trade.stage === 'abandoned') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 p-4 animate-pop">
        <p className="text-muted-foreground">
          {trade.endReason === 'partner-left'
            ? 'O outro jogador fugiu. Sua carta voltou para você.'
            : trade.endReason === 'forfeit'
              ? 'Você saiu de uma sala Sem retorno. Sua carta ficou na mesa.'
              : 'Troca cancelada.'}
        </p>
        <ActionButton onClick={onLeave}>Voltar ao corredor</ActionButton>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 p-4">
      <p className="text-sm text-muted-foreground">
        {trade.stage === 'waiting'
          ? 'Sua carta está na mesa, virada para baixo.'
          : trade.myAccept
            ? 'Você aceitou. Não há volta.'
            : 'Aceitar é definitivo assim que ambos confirmarem.'}
      </p>
      <ActionButton
        tone="primary"
        disabled={trade.stage !== 'negotiating' || trade.myAccept}
        onClick={() => {
          playSfx('confirm')
          dispatch({ type: 'TRADE_ACCEPT' })
        }}
      >
        <Check className="size-3.5" />
        Aceitar troca
      </ActionButton>
    </div>
  )
}

function TradeChat({ trade, rule }: { trade: TradeSession; rule: RoomRuleMeta }) {
  const { dispatch } = useDevo()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const silent = rule.chat === 'nenhum'
  const canChat = trade.stage === 'negotiating' && !silent

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [trade.chat.length, trade.partnerTyping])

  const send = (e: FormEvent) => {
    e.preventDefault()
    say(draft.trim())
  }

  const say = (text: string) => {
    if (!text || !canChat || !trade.partner || !trade.partnerCardId) return
    const { partner, partnerCardId } = trade
    setDraft('')
    playSfx('send')
    dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: 'me', text, at: Date.now() } })
    window.setTimeout(() => dispatch({ type: 'TRADE_PARTNER_TYPING', typing: true }), 600)
    window.setTimeout(() => {
      dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: partner.handle, text: partnerReply(partner, partnerCardId, text), at: Date.now() } })
    }, 1800 + Math.random() * 1600)
  }

  return (
    <aside className="flex h-64 shrink-0 flex-col border-t border-foreground/10 bg-background/40 @3xl:h-auto @3xl:w-80 @3xl:border-l @3xl:border-t-0" aria-label="Conversa da sala">
      <p className="border-b border-foreground/10 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {silent ? 'Sala do silêncio · chat bloqueado' : rule.chat === 'frases' ? 'Canal da sala · frases prontas' : 'Canal da sala · chat livre'}
      </p>
      <div ref={listRef} className="devo-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto p-4" aria-live="polite">
        {trade.chat.length === 0 && (
          <p className="m-auto text-center text-sm italic text-muted-foreground">
            {silent ? 'Aqui ninguém fala. Decida pelos olhos.' : trade.partner ? 'Diga algo. Ou não.' : 'Ninguém na sala ainda.'}
          </p>
        )}
        {trade.chat.map((m) => (
          <div key={m.id} className={cn('flex max-w-[85%] flex-col gap-0.5 animate-pop', m.from === 'me' ? 'self-end items-end' : 'self-start')}>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{m.from === 'me' ? 'Você' : m.from}</span>
            <p className={cn('px-3 py-1.5 text-sm leading-relaxed', m.from === 'me' ? 'border border-primary/50 bg-primary/15' : 'border border-foreground/15 bg-secondary')}>
              {m.text}
            </p>
          </div>
        ))}
        {trade.partnerTyping && (
          <div className="self-start border border-foreground/15 bg-secondary px-3 py-2.5">
            <TypingDots />
          </div>
        )}
      </div>
      {rule.chat === 'frases' ? (
        <div className="flex flex-wrap gap-1.5 border-t border-foreground/10 p-3" role="group" aria-label="Frases prontas">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!canChat}
              onClick={() => say(p)}
              className="border border-foreground/20 px-2.5 py-1.5 text-xs text-foreground/85 transition-colors enabled:hover:border-primary/60 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 border-t border-foreground/10 p-3">
          <label htmlFor="trade-chat" className="sr-only">
            Mensagem para o outro jogador
          </label>
          <input
            id="trade-chat"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canChat}
            placeholder={canChat ? 'Pergunte sobre a carta…' : 'Chat indisponível'}
            autoComplete="off"
            className="min-w-0 flex-1 border border-foreground/20 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canChat}
            className="grid size-9 place-items-center border border-primary/60 text-primary transition-colors enabled:hover:bg-primary/15 disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}
    </aside>
  )
}

/** Explica a condição da sala ao entrar (completa enquanto escolhe a carta, depois em uma linha). */
function RoomRuleBanner({ rule, expanded }: { rule: RoomRuleMeta; expanded: boolean }) {
  return (
    <div className="border-b border-foreground/10 bg-primary/5 px-5 py-2.5" aria-label={`Regra da sala: ${rule.label}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/80">
        <span className="text-primary">{rule.label}</span> · {rule.summary}
      </p>
      {expanded && (
        <ul className="mt-1.5 flex list-disc flex-col gap-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
          {rule.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
