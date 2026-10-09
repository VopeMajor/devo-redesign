'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { RARITY_META, getCard } from '@/lib/devo/cards'
import { partnerReply } from '@/lib/devo/trade-bots'
import { QUICK_PHRASES, ROOM_RULES, TRADE_PROTOCOL, type RoomRule, type RoomRuleMeta } from '@/lib/devo/trade-rooms'
import type { Room, TradeSession } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import {
  Button,
  Dialog,
  FrameCorners,
  GlyphArrow,
  GlyphCheck,
  IconButton,
  Kicker,
  LaceEdge,
  Reveal,
  SceneBackdrop,
  SigilStar,
  Spinner,
  Stagger,
  Stamp,
  toRoman,
} from '../kit'
import { CardFace, DevoCard } from '../shared/devo-card'
import { nextId, useDevo } from '../state/devo-store'
import { TypingDots } from './app-ui'

/**
 * Sala de Trocas — o corredor de portas (cena `corridor`) e a mesa de troca às cegas.
 * Tensão silenciosa: mármore negro, aço champanhe, a luz das fechaduras. Ametista só no que é seu;
 * rubi só na perda. As regras de cada sala vêm de `lib/devo/trade-rooms.ts` (fonte única).
 */

const STATUS_META: Record<Room['status'], { label: string; note: string }> = {
  livre: { label: 'Livre', note: 'A fechadura está acesa.' },
  ocupada: { label: 'Ocupada', note: 'Alguém negocia lá dentro.' },
  sua: { label: 'Sua sala', note: 'Sua carta espera na mesa.' },
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function TrocasApp() {
  const { state } = useDevo()
  const trade = state.trade
  const finished = trade?.stage === 'done' || trade?.stage === 'abandoned'
  // A cena acompanha a tensão: o corredor anda devagar; dentro da sala, a luz baixa.
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink text-dv-text @container">
      <SceneBackdrop preset="corridor" intensity={trade ? 0.4 : 0.7} dim={trade ? 0.74 : 0.5} alert={trade?.endReason === 'forfeit' && finished} />
      <div className="devo-scroll absolute inset-0 overflow-y-auto overflow-x-hidden">
        {trade ? (
          <Reveal key={`sala-${trade.roomId}`} variant="right">
            <TradeRoom trade={trade} />
          </Reveal>
        ) : (
          <Reveal key="corredor" variant="left">
            <Lobby />
          </Reveal>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────── Corredor ─────────────────────────────── */

function Lobby() {
  const { state, dispatch } = useDevo()
  const free = state.rooms.filter((r) => r.status === 'livre').length
  const busy = state.rooms.filter((r) => r.status === 'ocupada').length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-5 @2xl:px-6">
      <header className="relative">
        <Kicker className="animate-dv-fade">Corredor B · Andar 3</Kicker>
        <h2 className="mt-2 flex animate-dv-cut-in flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[30px] font-semibold uppercase leading-none tracking-[0.06em] text-dv-text @lg:text-[36px]">Sala de Trocas</span>
          <span lang="ja" className="font-sans text-[11px] tracking-[0.2em] text-dv-text-3">
            交換の回廊
          </span>
        </h2>
        <p className="mt-2 max-w-md animate-dv-fade font-body text-[15px] italic leading-snug text-dv-text-2 [animation-delay:200ms]">
          Oito portas. Atrás de cada uma, uma mesa e um estranho.
        </p>
        <div aria-hidden="true" className="relative mt-4 h-px">
          <span className="absolute inset-0 bg-gradient-to-r from-dv-gold/70 via-dv-gold/25 to-transparent" />
          <span className="absolute -top-[3px] left-0 h-[7px] w-px bg-dv-gold" />
          <span className="absolute -top-[1px] left-[22%] h-[3px] w-8 bg-dv-amethyst/80" />
        </div>
        <dl className="mt-3 flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-gold-bright shadow-[0_0_8px_rgba(255,246,230,0.9)]" />
            <dt className="sr-only">Salas livres</dt>
            <dd aria-live="polite">
              <span className="dv-tabular text-dv-text">{free}</span> de {state.rooms.length} salas livres
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rotate-45 border border-dv-text-3" />
            <dt className="sr-only">Ocupadas</dt>
            <dd>
              <span className="dv-tabular text-dv-text-2">{busy}</span> ocupadas
            </dd>
          </div>
        </dl>
      </header>

      <Stagger as="ul" itemAs="li" className="grid grid-cols-2 gap-x-3 gap-y-6 @lg:grid-cols-4 @lg:gap-x-5" step={55} delay={160}>
        {state.rooms.map((room) => (
          <Door
            key={room.id}
            room={room}
            onEnter={() => {
              playSfx('open')
              dispatch({ type: 'TRADE_ENTER', roomId: room.id })
            }}
          />
        ))}
      </Stagger>

      <Reveal inView variant="rise">
        <Protocol />
      </Reveal>
    </div>
  )
}

function Door({ room, onEnter }: { room: Room; onEnter: () => void }) {
  const meta = STATUS_META[room.status]
  const rule = ROOM_RULES[room.rule]
  const free = room.status === 'livre'
  const mine = room.status === 'sua'
  return (
    <button
      type="button"
      disabled={!free}
      onMouseEnter={() => free && playSfx('hover')}
      onClick={onEnter}
      aria-label={`Sala ${room.number}, ${meta.label}, ${room.condition}: ${rule.summary}`}
      className={cn('dv-focus group relative flex w-full flex-col text-left outline-none', free ? 'cursor-pointer' : 'cursor-not-allowed')}
    >
      {/* lintel: número e estado */}
      <span className="flex items-center justify-between gap-2 px-0.5 pb-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="text-dv-text-3">Nº {pad2(room.number)}</span>
        <span className={cn('flex items-center gap-1.5', free ? 'text-dv-gold-bright' : mine ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rotate-45',
              free ? 'bg-dv-gold-bright shadow-[0_0_8px_rgba(255,246,230,0.9)]' : mine ? 'bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.9)]' : 'border border-current',
            )}
          />
          {meta.label}
        </span>
      </span>

      {/* a porta */}
      <span
        className={cn(
          'relative block transition-transform duration-[var(--dv-dur-3)] ease-[var(--dv-ease-out)]',
          free && 'group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-active:scale-[0.98]',
        )}
      >
        {/* luz que escapa por baixo da porta */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-[16%] -bottom-1.5 h-3 rounded-[50%] blur-[6px] transition-opacity duration-[var(--dv-dur-3)]',
            free ? 'bg-[#fff1da] opacity-45 group-hover:opacity-80' : mine ? 'bg-dv-amethyst opacity-60' : 'opacity-0',
          )}
        />
        <DoorArt status={room.status} className={cn('relative block w-full', !free && !mine && 'opacity-70 saturate-50')} />
        {/* numeral na ogiva */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 top-[40%] -translate-y-1/2 text-center font-display text-[32px] font-semibold leading-none tracking-[0.04em] @lg:text-[36px]',
            free ? 'dv-brass-text drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]' : mine ? 'text-dv-amethyst-text' : 'text-dv-text-3/70',
          )}
        >
          {pad2(room.number)}
        </span>
      </span>

      {/* placa da condição */}
      <span
        className={cn(
          'relative mt-2.5 flex flex-col gap-1 border-l px-2.5 py-1.5 transition-colors duration-[var(--dv-dur-2)]',
          free ? 'border-dv-gold/70 group-hover:border-dv-gold-bright' : 'border-dv-line-strong',
        )}
      >
        <span className={cn('flex items-center gap-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em]', free ? 'text-dv-text' : 'text-dv-text-2')}>
          <RuleSigil rule={room.rule} className={cn('size-4 shrink-0', free ? 'text-dv-gold' : 'text-dv-text-3')} />
          {room.condition}
        </span>
        <span className={cn('font-body text-[13px] leading-snug', free ? 'text-dv-text-2' : 'text-dv-text-3')}>{rule.summary}</span>
      </span>
    </button>
  )
}

/** Porta gótica em mármore negro com batente de aço champanhe e fechadura (acesa quando livre). */
function DoorArt({ status, className }: { status: Room['status']; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const free = status === 'livre'
  const mine = status === 'sua'
  const lit = free || mine
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.3" stopColor="#8f877a" />
          <stop offset="0.58" stopColor="#bab09f" />
          <stop offset="1" stopColor="#4d473f" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={lit ? '#2c2c31' : '#1c1c1f'} />
          <stop offset="0.55" stopColor={lit ? '#18181b' : '#121214'} />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
        <radialGradient id={`${id}k`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={mine ? '#cbc5e8' : '#fff6e6'} stopOpacity="0.95" />
          <stop offset="0.35" stopColor={mine ? '#8a7cc8' : '#ece5d8'} stopOpacity="0.4" />
          <stop offset="1" stopColor="#ece5d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* batente externo em ogiva */}
      <path d="M5 150V54C5 26 28 5 60 2c32 3 55 24 55 52v96" stroke={`url(#${id}s)`} strokeWidth="2.2" />
      {/* folha da porta */}
      <path d="M12 150V56c0-24 20-42 48-45 28 3 48 21 48 45v94z" fill={`url(#${id}l)`} stroke={`url(#${id}s)`} strokeOpacity="0.55" strokeWidth="0.8" />
      {/* veios do mármore */}
      <path d="M16 62c12 8 18 22 36 27s28 20 36 36 12 18 18 20" stroke="#8f8e8b" strokeOpacity="0.16" strokeWidth="0.7" />
      <path d="M84 30c-6 12-2 22-12 30" stroke="#8f8e8b" strokeOpacity="0.1" strokeWidth="0.6" />
      {/* painel em ogiva e painel baixo */}
      <path d="M28 96V58c0-16 14-28 32-30 18 2 32 14 32 30v38z" stroke="#bab09f" strokeOpacity={lit ? 0.32 : 0.18} strokeWidth="0.7" />
      <rect x="28" y="124" width="64" height="20" stroke="#bab09f" strokeOpacity={lit ? 0.26 : 0.14} strokeWidth="0.7" />
      {/* estrela do sigilo no topo da ogiva */}
      <path d="M60 14l1.4 4.2 4.2 1.4-4.2 1.4L60 25.2l-1.4-4.2-4.2-1.4 4.2-1.4z" fill={`url(#${id}s)`} opacity={lit ? 0.9 : 0.4} />
      {/* espelho da fechadura */}
      <path d="M60 98l7.5 7v11.5L60 123l-7.5-6.5V105z" fill="#0c0c0e" stroke={`url(#${id}s)`} strokeWidth="0.9" />
      {lit && <circle cx="60" cy="110" r="15" fill={`url(#${id}k)`} />}
      {lit ? (
        <path d="M60 104.6a2.7 2.7 0 0 1 1.5 4.9l1.1 5.3h-5.2l1.1-5.3a2.7 2.7 0 0 1 1.5-4.9z" fill={mine ? '#e6e1f7' : '#fff7ea'} />
      ) : (
        // ocupada: cadeado pendurado na fechadura
        <g stroke="#8f8e8b" strokeWidth="0.9">
          <path d="M57.2 109v-2.4a2.8 2.8 0 0 1 5.6 0v2.4" />
          <rect x="55.6" y="109" width="8.8" height="6.6" fill="#1f1f22" />
          <path d="M60 111.4v2" />
        </g>
      )}
      {/* maçaneta */}
      <circle cx="95" cy="112" r="2.4" fill={`url(#${id}s)`} opacity={lit ? 0.95 : 0.45} />
      {/* sombra no pé e soleira */}
      <rect x="12" y="118" width="96" height="32" fill={`url(#${id}f)`} />
      <path d="M0 149.2h120" stroke={`url(#${id}s)`} strokeWidth="1.6" />
    </svg>
  )
}

/** Sigilo de cada condição (traço fino, família dos glifos do kit). */
function RuleSigil({ rule, className }: { rule: RoomRule; className?: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, className }
  switch (rule) {
    case 'cegas': // olho fechado
      return (
        <svg {...common}>
          <path d="M3.5 11c2.4 3.2 5.2 4.8 8.5 4.8s6.1-1.6 8.5-4.8" />
          <path d="M6.5 14.4 5 16.6M12 15.8v2.6M17.5 14.4l1.5 2.2" />
        </svg>
      )
    case 'mesma-raridade': // dois losangos iguais
      return (
        <svg {...common}>
          <path d="M7.5 6.5 11 12l-3.5 5.5L4 12z" />
          <path d="M16.5 6.5 20 12l-3.5 5.5L13 12z" />
        </svg>
      )
    case 'sem-retorno': // seta que entra e a barra que não deixa sair
      return (
        <svg {...common}>
          <path d="M3.5 12h11M11 8.5l3.5 3.5-3.5 3.5" />
          <path d="M19 5v14" />
        </svg>
      )
    case 'chat-livre': // balão com a estrela
      return (
        <svg {...common}>
          <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" />
          <path d="M12 8l.7 2.3L15 11l-2.3.7L12 14l-.7-2.3L9 11l2.3-.7z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'silencio': // balão lacrado
      return (
        <svg {...common}>
          <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" />
          <path d="M8.5 10.5h7" />
        </svg>
      )
  }
}

function Protocol() {
  return (
    <section aria-labelledby="trocas-protocolo" className="relative isolate overflow-hidden border border-dv-line-gold/60 bg-[linear-gradient(180deg,rgba(31,31,34,0.92),rgba(12,12,14,0.95))] px-4 pb-5 pt-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] @2xl:px-6">
      <FrameCorners tone="gold" size={20} inset={3} />
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="trocas-protocolo" className="flex flex-wrap items-baseline gap-x-2.5 font-display text-[18px] font-semibold uppercase tracking-[0.12em] text-dv-text">
          Protocolo
          <span lang="ja" className="font-sans text-[10px] font-normal tracking-[0.2em] text-dv-text-3">
            取引規約
          </span>
        </h3>
        <span aria-hidden="true" className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">
          DV_TR_0803
        </span>
      </div>
      <div aria-hidden="true" className="mt-2.5 h-px bg-gradient-to-r from-dv-gold/60 via-dv-gold/20 to-transparent" />
      <ol className="mt-3.5 flex flex-col gap-3">
        {TRADE_PROTOCOL.map((rule, i) => (
          <li key={rule} className="grid grid-cols-[2rem_1fr] gap-2 font-body text-[15px] leading-relaxed text-dv-text-2">
            <span aria-hidden="true" className="pt-0.5 text-right font-display text-[13px] font-semibold tracking-[0.06em] text-dv-gold">
              {toRoman(i + 1)}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
      <figure className="mt-5 border-t border-dv-line pt-4">
        <blockquote className="font-body text-[15px] italic leading-relaxed text-dv-text-2">“Uma troca às cegas é um teste de caráter.”</blockquote>
        <figcaption className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">— O Herdeiro</figcaption>
      </figure>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 opacity-[0.07]">
        <LaceEdge tone="porcelain" side="bottom" height={14} />
      </div>
    </section>
  )
}

/* ─────────────────────────────── Sala ─────────────────────────────── */

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
  const ruleKey: RoomRule = room?.rule ?? 'mesma-raridade'
  const rule = ROOM_RULES[ruleKey]
  const finished = trade.stage === 'done' || trade.stage === 'abandoned'
  const forfeitRisk = rule.forfeitOnLeave && !finished && !!trade.myCard
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [lostCardId, setLostCardId] = useState<string | null>(null)
  const number = pad2(room?.number ?? 0)

  const exit = () => {
    playSfx('close')
    dispatch({ type: 'TRADE_EXIT' })
  }

  const leave = () => {
    if (finished) return exit()
    if (forfeitRisk) {
      playSfx('click')
      setConfirmLeave(true)
      return
    }
    playSfx('close')
    if (trade.myCard) dispatch({ type: 'TRADE_CANCEL', forfeit: false })
    dispatch({ type: 'TRADE_EXIT' })
  }

  const forfeit = () => {
    setConfirmLeave(false)
    setLostCardId(trade.myCard?.cardId ?? null)
    playSfx('error')
    dispatch({ type: 'TRADE_CANCEL', forfeit: true })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-8 pt-4 @2xl:px-6 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:items-start @3xl:gap-5">
      <section aria-label="Mesa de troca" className="flex min-w-0 flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Kicker className="animate-dv-fade">
              Sala {number} · {room?.condition}
            </Kicker>
            <p className="mt-2 animate-dv-cut-in font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text" aria-live="polite">
              {STAGE_TEXT[trade.stage]}
            </p>
          </div>
          <Button variant={forfeitRisk ? 'danger' : 'secondary'} size="sm" onClick={leave} className="shrink-0">
            {finished ? 'Sair' : 'Abandonar'}
          </Button>
        </header>

        <RoomRuleBanner rule={rule} ruleKey={ruleKey} expanded={trade.stage === 'placing'} />

        <TradeTable trade={trade} rule={rule} lostCardId={lostCardId} />

        <TradeActions trade={trade} rule={rule} lostCardId={lostCardId} onExit={exit} />
      </section>

      <TradeChat trade={trade} rule={rule} />

      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        tone="alert"
        kicker={`Sala ${number} · Sem retorno`}
        title="Sair e perder a carta?"
        description={
          trade.myCard ? (
            <>
              Esta sala não devolve nada. Se você sair agora, <strong className="font-semibold text-dv-text">{getCard(trade.myCard.cardId).name}</strong> fica na mesa e deixa de ser sua.
            </>
          ) : undefined
        }
        footer={
          <div className="flex flex-col gap-2.5 @md:flex-row-reverse">
            <Button variant="danger" block onClick={forfeit}>
              Sair e perder a carta
            </Button>
            <Button variant="secondary" block onClick={() => setConfirmLeave(false)} sfx="click">
              Ficar na sala
            </Button>
          </div>
        }
      />
    </div>
  )
}

/** Faixa com a regra da sala: completa enquanto você escolhe a carta, depois em uma linha. */
function RoomRuleBanner({ rule, ruleKey, expanded }: { rule: RoomRuleMeta; ruleKey: RoomRule; expanded: boolean }) {
  return (
    <div
      role="note"
      aria-label={`Regra da sala: ${rule.label}`}
      className="relative isolate animate-dv-cut-in overflow-hidden border border-dv-line-strong bg-[linear-gradient(100deg,rgba(44,44,49,0.95),rgba(21,21,23,0.92)_55%,rgba(12,12,14,0.9))] [animation-delay:120ms]"
    >
      {/* faixa diagonal de aço com o sigilo da condição */}
      <span aria-hidden="true" className="absolute inset-y-0 -left-3 -z-10 w-[4.25rem] -skew-x-[14deg] bg-[linear-gradient(180deg,#ece5d8,#bab09f_45%,#6b6357)] opacity-95" />
      <span aria-hidden="true" className="absolute inset-y-0 left-[3.6rem] -z-10 w-px -skew-x-[14deg] bg-dv-amethyst/70" />
      <div className="flex items-center gap-4 py-2.5 pl-3 pr-4">
        <RuleSigil rule={ruleKey} className="size-7 shrink-0 text-dv-ink" />
        <div className="min-w-0 pl-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dv-text-3">Regra da sala</p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[16px] font-semibold uppercase tracking-[0.12em] text-dv-text">{rule.label}</span>
            <span className="font-body text-[14px] italic text-dv-text-2">{rule.summary}</span>
          </p>
        </div>
      </div>
      {expanded && (
        <ul className="flex flex-col gap-1.5 border-t border-dv-line px-4 pb-3 pt-2.5 pl-[4.75rem]">
          {rule.details.map((d) => (
            <li key={d} className="flex gap-2 font-body text-[14px] leading-snug text-dv-text-2">
              <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rotate-45 border border-dv-gold" />
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** A mesa: tampo de mármore negro com o "Espaço do outro" e o "Seu espaço" frente a frente. */
function TradeTable({ trade, rule, lostCardId }: { trade: TradeSession; rule: RoomRuleMeta; lostCardId: string | null }) {
  const revealing = trade.stage === 'revealing'
  const revealed = revealing || trade.stage === 'done'
  const partnerLeft = trade.endReason === 'partner-left'
  const forfeited = trade.endReason === 'forfeit'
  const myRarity = trade.myCard && rule.showRarity ? RARITY_META[getCard(trade.myCard.cardId).rarity] : null
  const theirRarity = trade.partnerCardId && rule.showRarity && !partnerLeft ? RARITY_META[getCard(trade.partnerCardId).rarity] : null

  return (
    <div className="relative isolate">
      <div className="dv-marble-dark relative overflow-hidden border border-dv-line-gold/70 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* véu para contraste e luz zenital da luminária */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-5%,rgba(255,246,230,0.14),transparent_70%),linear-gradient(180deg,rgba(12,12,14,0.35),rgba(12,12,14,0.7))]" />
        <FrameCorners tone="gold" size={18} inset={3} />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-1 px-2 pb-4 pt-4 @md:px-6">
          <Seat
            label="Espaço do outro"
            name={partnerLeft ? 'Saiu da sala' : (trade.partner?.handle ?? 'Vazio')}
            present={!!trade.partner && !partnerLeft}
            accepted={trade.partnerAccept}
            note={revealed ? 'Revelada' : trade.partnerCardId && !partnerLeft ? 'Virada para baixo' : undefined}
            spotlight={revealing}
          >
            {trade.partner && trade.partnerCardId && !partnerLeft ? (
              <DevoCard
                cardId={trade.partnerCardId}
                faceDown={!revealed}
                size="md"
                className={cn('w-[104px] transition-[transform,filter] duration-700 @lg:w-32', revealing && 'scale-[1.07] drop-shadow-[0_0_22px_rgba(255,246,230,0.5)]')}
              />
            ) : (
              <EmptySlot waiting={trade.stage === 'waiting'} label={partnerLeft ? 'Cadeira vazia' : undefined} />
            )}
          </Seat>

          {/* costura central da mesa */}
          <div aria-hidden="true" className="flex h-full flex-col items-center gap-2 pt-7">
            <span className="w-px flex-1 bg-gradient-to-b from-transparent via-dv-gold/50 to-dv-gold/70" />
            <SigilStar tone="brass" className={cn('size-4 transition-transform duration-700', revealing && 'rotate-45 scale-125')} />
            <span className="w-px flex-1 bg-gradient-to-b from-dv-gold/70 via-dv-gold/50 to-transparent" />
          </div>

          <Seat
            label="Seu espaço"
            name="Você"
            present
            mine
            accepted={trade.myAccept}
            note={forfeited ? 'Perdida' : trade.stage === 'done' ? 'Entregue' : trade.myCard ? 'O outro vê o verso' : undefined}
          >
            {forfeited && lostCardId ? (
              <div className="relative">
                <CardFace cardId={lostCardId} size="md" className="w-[104px] opacity-40 grayscale @lg:w-32" />
                <span className="absolute inset-0 grid place-items-center">
                  <Stamp text="Perdida" tone="blood" size={96} rotate={-14} animate />
                </span>
              </div>
            ) : trade.myCard ? (
              <CardFace cardId={trade.myCard.cardId} size="md" className={cn('w-[104px] animate-dv-pop @lg:w-32', trade.stage === 'done' && 'opacity-55 saturate-50')} />
            ) : (
              <EmptySlot label={trade.stage === 'placing' ? 'Escolha abaixo' : undefined} />
            )}
          </Seat>
        </div>

        {/* plaqueta da raridade */}
        <div className="relative flex items-center justify-center gap-2 border-t border-dv-line px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em]">
          {myRarity ? (
            rule.sameRarity ? (
              <span className="flex items-center gap-2 text-dv-text-2">
                <RarityMark color={myRarity.color} />
                <span className="text-dv-text">{myRarity.label}</span> · garantida nas duas
              </span>
            ) : (
              <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-dv-text-3">
                <span className="flex items-center gap-1.5">
                  Dele: {theirRarity ? (<><RarityMark color={theirRarity.color} /><span className="text-dv-text">{theirRarity.label}</span></>) : <span className="text-dv-text-2">?</span>}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  Sua: <RarityMark color={myRarity.color} />
                  <span className="text-dv-text">{myRarity.label}</span>
                </span>
              </span>
            )
          ) : trade.myCard ? (
            <span className="flex items-center gap-2 text-dv-text-2">
              <RuleSigil rule="cegas" className="size-4 text-dv-text-3" />
              Raridade oculta
            </span>
          ) : (
            <span className="text-dv-text-3">Mesa de mármore · {rule.label}</span>
          )}
        </div>

        {/* momento da revelação */}
        {revealing && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute inset-0 animate-dv-fade bg-[radial-gradient(60%_70%_at_27%_45%,transparent_30%,rgba(5,5,6,0.8)_100%)]" />
            <span className="absolute -top-6 left-[27%] h-[115%] w-28 -translate-x-1/2 animate-dv-fade bg-[linear-gradient(180deg,rgba(255,246,230,0.4),rgba(255,246,230,0.05)_80%,transparent)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]" />
          </div>
        )}
      </div>

      {revealing && (
        <p className="pointer-events-none absolute inset-x-0 -bottom-3 z-10 flex justify-center">
          <span className="animate-dv-cut-in bg-dv-ink px-3 font-impact text-[22px] uppercase tracking-[0.3em] text-dv-gold-bright">Revelação</span>
        </p>
      )}
      {trade.stage === 'done' && (
        <span className="pointer-events-none absolute -right-1 -top-4 z-10">
          <Stamp text="Troca final" shape="round" tone="gold" size={92} rotate={10} animate ring="SALA DE TROCAS · DEVO · SEM VOLTA ·" />
        </span>
      )}
    </div>
  )
}

function RarityMark({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block size-2 shrink-0 rotate-45 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]" style={{ background: color }} />
}

function Seat({
  label,
  name,
  accepted,
  present,
  mine,
  note,
  spotlight,
  children,
}: {
  label: string
  name: string
  accepted: boolean
  present: boolean
  mine?: boolean
  note?: string
  spotlight?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative flex min-w-0 flex-col items-center gap-2 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dv-text-3">{label}</p>
      <div className={cn('relative grid place-items-center p-2', spotlight && 'z-10')}>
        {/* contorno gravado do espaço no tampo */}
        <span aria-hidden="true" className={cn('absolute inset-0 border', mine ? 'border-dv-amethyst/35' : 'border-dv-line-strong')} />
        <span aria-hidden="true" className={cn('absolute -left-px -top-px size-2 border-l border-t', mine ? 'border-dv-amethyst-text' : 'border-dv-gold')} />
        <span aria-hidden="true" className={cn('absolute -bottom-px -right-px size-2 border-b border-r', mine ? 'border-dv-amethyst-text' : 'border-dv-gold')} />
        {children}
        {accepted && (
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            <Stamp text="Aceitou" tone="gold" size={78} rotate={mine ? 8 : -8} animate />
          </span>
        )}
      </div>
      <p className={cn('mt-1 max-w-full truncate font-display text-[14px] font-semibold tracking-[0.06em]', present ? 'text-dv-text' : 'text-dv-text-3')}>{name}</p>
      <p
        className={cn(
          'flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.18em]',
          accepted ? 'bg-dv-cobalt-dim text-dv-amethyst-text shadow-[inset_0_0_0_1px_var(--dv-amethyst)]' : 'text-dv-text-3 shadow-[inset_0_0_0_1px_var(--dv-line)]',
        )}
      >
        {accepted && <GlyphCheck className="size-3" />}
        {accepted ? 'Aceitou' : present ? 'Indeciso' : '—'}
      </p>
      {note && <p className="font-body text-[12.5px] italic text-dv-text-3">{note}</p>}
    </div>
  )
}

function EmptySlot({ waiting, label }: { waiting?: boolean; label?: string }) {
  return (
    <div className="relative grid aspect-[420/940] w-[104px] place-items-center bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.025)_0_6px,transparent_6px_12px)] @lg:w-32">
      <span aria-hidden="true" className="absolute inset-1.5 border border-dashed border-dv-line-strong" />
      {waiting ? (
        <span className="flex flex-col items-center gap-2.5 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">
          <Spinner className="size-6 text-dv-gold" label="Esperando outro jogador" />
          Esperando
        </span>
      ) : (
        <span className="flex flex-col items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">
          <SigilStar tone="current" className="size-4 opacity-40" />
          {label}
        </span>
      )}
    </div>
  )
}

function TradeActions({ trade, rule, lostCardId, onExit }: { trade: TradeSession; rule: RoomRuleMeta; lostCardId: string | null; onExit: () => void }) {
  const { state, dispatch } = useDevo()

  if (trade.stage === 'placing') {
    return (
      <div className="animate-dv-rise">
        <p className="dv-label flex items-center gap-2 text-dv-gold">
          <SigilStar tone="current" className="size-2.5" />
          Escolha a carta que vai à mesa
        </p>
        <ul className="devo-scroll -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-3 pt-2" aria-label="Suas cartas">
          {state.inventory.map((c) => (
            <li key={c.uid} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => {
                  playSfx('card-select')
                  dispatch({ type: 'TRADE_PLACE', uid: c.uid })
                }}
                className="dv-focus block transition-transform duration-[var(--dv-dur-2)] ease-[var(--dv-ease-out)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 active:scale-[0.97]"
                aria-label={`Colocar ${getCard(c.cardId).name} na mesa`}
              >
                <CardFace cardId={c.cardId} size="sm" className="w-[76px]" />
              </button>
            </li>
          ))}
          {state.inventory.length === 0 && <li className="font-body text-[15px] italic text-dv-text-3">Você não tem cartas para trocar.</li>}
        </ul>
      </div>
    )
  }

  if (trade.stage === 'done' && trade.partnerCardId) {
    const card = getCard(trade.partnerCardId)
    const rarity = RARITY_META[card.rarity]
    return (
      <div className="flex animate-dv-rise flex-col gap-3 border-t border-dv-line-gold/50 pt-4">
        <p className="font-body text-[16px] leading-relaxed text-dv-text">
          Você recebeu <strong className="font-semibold text-dv-gold-bright">{card.name}</strong>
          <span className="ml-2 inline-flex items-center gap-1.5 align-middle font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-2">
            <RarityMark color={rarity.color} />
            {rarity.label}
          </span>
        </p>
        <Button block onClick={onExit} sfx="click" icon={<GlyphArrow className="size-4 rotate-180" />}>
          Voltar ao corredor
        </Button>
      </div>
    )
  }

  if (trade.stage === 'abandoned') {
    const lost = lostCardId ? getCard(lostCardId).name : null
    return (
      <div className="flex animate-dv-rise flex-col gap-3 pt-2">
        <p className={cn('font-body text-[15px] leading-relaxed', trade.endReason === 'forfeit' ? 'text-dv-blood-text' : 'text-dv-text-2')}>
          {trade.endReason === 'partner-left'
            ? 'O outro jogador fugiu. Sua carta voltou para você.'
            : trade.endReason === 'forfeit'
              ? `Você saiu de uma sala Sem retorno. ${lost ? `${lost} ficou na mesa.` : 'Sua carta ficou na mesa.'}`
              : 'Troca cancelada.'}
        </p>
        <Button variant="secondary" block onClick={onExit} icon={<GlyphArrow className="size-4 rotate-180" />}>
          Voltar ao corredor
        </Button>
      </div>
    )
  }

  const status =
    trade.stage === 'waiting'
      ? 'Sua carta está na mesa, virada para baixo. Passos no corredor…'
      : trade.stage === 'revealing'
        ? 'As duas cartas viram ao mesmo tempo.'
        : trade.myAccept
          ? 'Você aceitou. Não há volta.'
          : 'Aceitar é definitivo assim que ambos confirmarem.'

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="flex items-start gap-2 font-body text-[15px] leading-snug text-dv-text-2" aria-live="polite">
        <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-dv-gold" />
        {status}
      </p>
      <Button
        block
        size="lg"
        disabled={trade.stage !== 'negotiating' || trade.myAccept}
        onClick={() => {
          playSfx('confirm')
          dispatch({ type: 'TRADE_ACCEPT' })
        }}
        icon={<GlyphCheck className="size-4" />}
      >
        Aceitar troca
      </Button>
      {rule.forfeitOnLeave && trade.stage !== 'revealing' && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-dv-blood-text">Sem retorno · sair agora custa a sua carta</p>
      )}
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

  const channel = silent ? 'Sala do silêncio · chat bloqueado' : rule.chat === 'frases' ? 'Frases prontas' : 'Chat livre'

  return (
    <aside
      aria-label="Conversa da sala"
      className="relative isolate flex h-[19rem] flex-col border border-dv-line-strong bg-[linear-gradient(180deg,rgba(21,21,23,0.94),rgba(12,12,14,0.96))] @3xl:sticky @3xl:top-4 @3xl:h-[34rem]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-dv-line px-4 py-2.5">
        <p className="flex items-baseline gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-dv-text">
          Canal da sala
          <span lang="ja" className="font-sans text-[10px] font-normal tracking-[0.18em] text-dv-text-3">
            密談
          </span>
        </p>
        <span className={cn('flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]', silent ? 'text-dv-text-3' : 'text-dv-text-2')}>
          <RuleSigil rule={silent ? 'silencio' : 'chat-livre'} className="size-3.5" />
          {channel}
        </span>
      </header>
      <div ref={listRef} className="devo-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {trade.chat.length === 0 && (
          <p className="m-auto max-w-[16rem] text-center font-body text-[15px] italic text-dv-text-3">
            {silent ? 'Aqui ninguém fala. Decida pelos olhos.' : trade.partner ? 'Diga algo. Ou não.' : 'Ninguém na sala ainda.'}
          </p>
        )}
        {trade.chat.map((m) => {
          const me = m.from === 'me'
          return (
            <div key={m.id} className={cn('flex max-w-[86%] flex-col gap-1', me ? 'animate-dv-slide-right items-end self-end' : 'animate-dv-slide-left self-start')}>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">{me ? 'Você' : m.from}</span>
              <p
                className={cn(
                  'dv-cut-diag px-3 py-2 font-body text-[15px] leading-snug',
                  me ? 'bg-[linear-gradient(180deg,#2c2c31,#1f1f22)] text-dv-text shadow-[inset_-2px_0_0_var(--dv-amethyst)]' : 'bg-dv-porcelain text-dv-porcelain-ink',
                )}
                style={{ '--dv-cut': '7px' } as CSSProperties}
              >
                {m.text}
              </p>
            </div>
          )
        })}
        {trade.partnerTyping && (
          <div className="self-start bg-dv-ink-3 px-3 py-2.5 text-dv-text-2">
            <TypingDots />
          </div>
        )}
      </div>
      {silent ? (
        <p className="border-t border-dv-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">Silêncio · nenhuma palavra sai desta mesa</p>
      ) : rule.chat === 'frases' ? (
        <div className="flex flex-wrap gap-2 border-t border-dv-line p-3" role="group" aria-label="Frases prontas">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!canChat}
              onClick={() => say(p)}
              className="dv-focus dv-cut-diag min-h-11 bg-dv-ink-3 px-3 font-body text-[14px] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] transition-[background,box-shadow,transform] duration-[var(--dv-dur-2)] enabled:hover:shadow-[inset_0_0_0_1px_var(--dv-gold)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ '--dv-cut': '7px' } as CSSProperties}
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 border-t border-dv-line p-3">
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
            className="dv-focus min-h-11 min-w-0 flex-1 border-0 bg-dv-ink px-3 font-sans text-[15px] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_var(--dv-amethyst)] disabled:opacity-50"
          />
          <IconButton type="submit" label="Enviar" variant="primary" disabled={!canChat}>
            <GlyphArrow className="size-4" />
          </IconButton>
        </form>
      )}
    </aside>
  )
}
