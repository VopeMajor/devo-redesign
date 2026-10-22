'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { RARITY_META, getCard } from '@/lib/devo/cards'
import { partnerReply } from '@/lib/devo/trade-bots'
import { QUICK_PHRASES, TRADE_PROTOCOL, TRADE_RULES } from '@/lib/devo/trade-rooms'
import type { Room, TradeSession } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import {
  Button,
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
 * Tensão silenciosa: mármore negro, aço champanhe, a luz das fechaduras. Ametista só no que é seu.
 * Uma regra só para as oito salas (Direção 3 §8), a mesma do Rato: `lib/devo/trade-rooms.ts`.
 */

const STATUS_META: Record<Room['status'], { label: string }> = {
  livre: { label: 'Livre' },
  ocupada: { label: 'Ocupada' },
  sua: { label: 'Sua sala' },
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Uids entregues ao Salão das Máscaras (Bandeja/Mercado): não vão à mesa. Sem sessão no servidor, lista vazia. */
function usePresas(): Set<string> {
  const { data } = useSWR<{ presas?: string[] }>(
    '/api/trocas',
    (u: string) => fetch(u, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { presas: [] })).catch(() => ({ presas: [] })),
    { revalidateOnFocus: false, refreshInterval: 60_000 },
  )
  const list = data?.presas ?? []
  const key = list.join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Set(list), [key])
}

export function TrocasApp() {
  const { state } = useDevo()
  const trade = state.trade
  // Entrar numa sala (ou voltar ao corredor) começa do topo: a regra da casa é a primeira coisa que se lê.
  const scrollRef = useRef<HTMLDivElement>(null)
  const roomId = trade?.roomId
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [roomId])
  // A cena acompanha a tensão: o corredor anda devagar; dentro da sala, a luz baixa.
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink text-dv-text @container">
      <SceneBackdrop preset="corridor" intensity={trade ? 0.4 : 0.7} dim={trade ? 0.74 : 0.5} />
      <div ref={scrollRef} className="devo-scroll absolute inset-0 overflow-y-auto overflow-x-hidden">
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
  const presas = usePresas()
  const tradable = state.inventory.filter((c) => !presas.has(c.uid)).length
  // Quem não tem carta não troca: as portas ficam trancadas para ele, com o motivo à vista.
  const blocked = tradable === 0

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
        {/* régua do corredor: um segmento por sala (livre = prata acesa, sua = ametista, ocupada = apagada) */}
        <ol aria-hidden="true" className="mt-4 grid grid-cols-8 gap-1.5">
          {state.rooms.map((r) => (
            <li key={r.id} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'h-[3px] w-full',
                  r.status === 'livre'
                    ? 'bg-[linear-gradient(90deg,#8f877a,#ece5d8_50%,#8f877a)] shadow-[0_0_6px_rgba(236,229,216,0.45)]'
                    : r.status === 'sua'
                      ? 'bg-dv-amethyst shadow-[0_0_6px_rgb(var(--dv-amethyst-rgb)/0.7)]'
                      : 'bg-dv-text/12',
                )}
              />
              <span className={cn('font-mono text-[10px] leading-none tracking-[0.08em]', r.status === 'livre' ? 'text-dv-text-2' : 'text-dv-text-3/60')}>{toRoman(r.number)}</span>
            </li>
          ))}
        </ol>
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

      {blocked && (
        <p role="status" className="flex items-start gap-3 border border-dv-line-strong bg-dv-ink-2/90 px-4 py-3 font-body text-[15px] leading-snug text-dv-text-2">
          <span aria-hidden="true" className="mt-[7px] size-2 shrink-0 rotate-45 border border-dv-gold" />
          <span>
            <span className="block font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-dv-text">Nenhuma porta abre para você</span>
            Sem cartas, sem troca.{' '}
            {state.inventory.length > 0 ? 'As suas estão no Salão das Máscaras e não vão à mesa.' : 'Consiga uma carta e volte ao corredor.'}
          </span>
        </p>
      )}

      <Stagger as="ul" itemAs="li" className="grid grid-cols-2 gap-x-3 gap-y-6 @lg:grid-cols-4 @lg:gap-x-5" step={55} delay={160}>
        {state.rooms.map((room) => (
          <Door
            key={room.id}
            room={room}
            blocked={blocked}
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

const DOOR_LINE: Record<Room['status'], [string, string]> = {
  livre: ['Mesa vazia', 'Entre e ponha uma carta.'],
  ocupada: ['Em negociação', 'Dois estranhos à mesa.'],
  sua: ['Sua sala', 'Sua carta espera.'],
}

function Door({ room, blocked, onEnter }: { room: Room; blocked: boolean; onEnter: () => void }) {
  const meta = STATUS_META[room.status]
  const locked = blocked && room.status === 'livre'
  const free = room.status === 'livre' && !locked
  const mine = room.status === 'sua'
  const [title, line] = locked ? ['Trancada para você', 'Sem cartas, sem troca.'] : DOOR_LINE[room.status]
  return (
    <button
      type="button"
      disabled={!free}
      title={locked ? 'Você não tem cartas para trocar.' : undefined}
      onMouseEnter={() => free && playSfx('hover')}
      onClick={onEnter}
      aria-label={`Sala ${room.number}, ${meta.label}, ${title}: ${line}`}
      className={cn('dv-focus group relative flex h-full w-full flex-col text-left outline-none', free ? 'cursor-pointer' : 'cursor-not-allowed')}
    >
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
        <DoorArt status={locked ? 'ocupada' : room.status} className={cn('relative block w-full', !free && !mine && 'opacity-70 saturate-50')} />
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
        {/* estado gravado no painel baixo da porta */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 top-[89.3%] flex -translate-y-1/2 items-center justify-center gap-1.5 font-mono text-[10px] uppercase leading-none tracking-[0.2em]',
            free ? 'text-dv-gold-bright' : mine ? 'text-dv-amethyst-text' : 'text-dv-text-3',
          )}
        >
          <span
            className={cn(
              'size-1.5 rotate-45',
              free ? 'bg-dv-gold-bright shadow-[0_0_8px_rgba(255,246,230,0.9)]' : mine ? 'bg-dv-amethyst shadow-[0_0_8px_rgb(var(--dv-amethyst-rgb)/0.9)]' : 'border border-current',
            )}
          />
          {locked ? 'Trancada' : meta.label}
        </span>
      </span>

      {/* soleira de aço e o reflexo da porta no piso de mármore */}
      <span aria-hidden="true" className="relative -mx-[3%] block h-[5px] bg-[linear-gradient(180deg,#ece5d8,#bab09f_35%,#5f584d)] shadow-[0_2px_6px_rgba(0,0,0,0.8)] [clip-path:polygon(2%_0,98%_0,100%_100%,0_100%)]" />
      <span
        aria-hidden="true"
        className={cn(
          'relative block h-10 overflow-hidden [mask-image:linear-gradient(180deg,rgba(0,0,0,0.9),transparent_92%)]',
          free || mine ? 'opacity-[0.22]' : 'opacity-[0.12]',
        )}
      >
        <DoorArt status={locked ? 'ocupada' : room.status} className="absolute inset-x-0 top-0 block w-full -scale-y-100 blur-[0.6px]" />
      </span>

      {/* plaqueta da condição, abaixo da porta */}
      <span
        className={cn(
          'relative -mt-4 flex flex-1 flex-col items-center justify-center gap-1 border bg-[linear-gradient(180deg,rgba(31,31,34,0.92),rgb(var(--dv-ink-rgb)/0.94))] px-2 pb-2 pt-1.5 text-center transition-colors duration-[var(--dv-dur-2)]',
          free ? 'border-dv-gold/45 group-hover:border-dv-gold-bright/80' : 'border-dv-line',
        )}
      >
        <span aria-hidden="true" className={cn('absolute -left-px -top-px size-1.5 border-l border-t', free ? 'border-dv-gold-bright' : 'border-dv-line-strong')} />
        <span aria-hidden="true" className={cn('absolute -right-px -top-px size-1.5 border-r border-t', free ? 'border-dv-gold-bright' : 'border-dv-line-strong')} />
        <span className={cn('flex items-center gap-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em]', free ? 'text-dv-text' : 'text-dv-text-2')}>
          <SigilStar tone="current" className={cn('size-2.5 shrink-0', free ? 'text-dv-gold' : 'text-dv-text-3')} />
          {title}
        </span>
        <span className={cn('font-body text-[14px] leading-snug [word-spacing:0.08em]', free ? 'text-dv-text-2' : 'text-dv-text-3')}>{line}</span>
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

type HouseRule = 'raridade' | 'oculta' | 'chat' | 'revela'
const HOUSE_SIGILS: HouseRule[] = ['raridade', 'oculta', 'chat', 'revela']

/** Sigilos da regra da casa (traço fino, família dos glifos do kit), um por passo do Rato. */
function HouseSigil({ rule, className }: { rule: HouseRule; className?: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, className }
  switch (rule) {
    case 'raridade': // dois losangos iguais
      return (
        <svg {...common}>
          <path d="M7.5 6.5 11 12l-3.5 5.5L4 12z" />
          <path d="M16.5 6.5 20 12l-3.5 5.5L13 12z" />
        </svg>
      )
    case 'oculta': // olho fechado
      return (
        <svg {...common}>
          <path d="M3.5 11c2.4 3.2 5.2 4.8 8.5 4.8s6.1-1.6 8.5-4.8" />
          <path d="M6.5 14.4 5 16.6M12 15.8v2.6M17.5 14.4l1.5 2.2" />
        </svg>
      )
    case 'chat': // balão com a estrela
      return (
        <svg {...common}>
          <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" />
          <path d="M12 8l.7 2.3L15 11l-2.3.7L12 14l-.7-2.3L9 11l2.3-.7z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'revela': // duas cartas que viram
      return (
        <svg {...common}>
          <path d="M5 6.5h7v11H5z" />
          <path d="M14.5 5l5 1.6-3 10.6-5-1.5" />
          <path d="M8.5 10.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}

function Protocol() {
  return (
    <section aria-labelledby="trocas-protocolo" className="relative isolate overflow-hidden border border-dv-line-gold/60 bg-[linear-gradient(180deg,rgba(31,31,34,0.92),rgb(var(--dv-ink-rgb)/0.95))] px-4 pb-5 pt-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] @2xl:px-6">
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
  const finished = trade.stage === 'done' || trade.stage === 'abandoned'
  const number = pad2(room?.number ?? 0)
  const tableRef = useRef<HTMLDivElement>(null)

  // Quem está na mesa já vê quem sentou e o que recebeu: o aviso do sistema fica só na central, sem cobrir o canal.
  const roomToasts = state.toasts.filter((t) => t.appId === 'trocas' || t.appId === 'cartas').map((t) => t.id).join(',')
  useEffect(() => {
    if (!roomToasts) return
    for (const id of roomToasts.split(',')) dispatch({ type: 'DISMISS_TOAST', id })
  }, [roomToasts, dispatch])

  // Quando algo acontece na mesa (alguém senta, as cartas viram, a sala esvazia), a mesa volta ao centro do olhar.
  useEffect(() => {
    if (trade.stage === 'placing') return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    tableRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [trade.stage])

  const exit = () => {
    playSfx('close')
    dispatch({ type: 'TRADE_EXIT' })
  }

  // Sair antes de os dois aceitarem desfaz tudo: cada carta volta ao dono. Na revelação não há saída.
  const leave = () => {
    if (finished) return exit()
    playSfx('close')
    if (trade.myCard) dispatch({ type: 'TRADE_CANCEL' })
    dispatch({ type: 'TRADE_EXIT' })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-8 pt-4 @2xl:px-6 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:items-start @3xl:gap-5">
      <section aria-label="Mesa de troca" className="flex min-w-0 flex-col gap-4">
        <header>
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Kicker className="min-w-0 animate-dv-fade">Sala {number}</Kicker>
            {trade.stage !== 'revealing' && (
              <Button variant="secondary" size="sm" onClick={leave} className="shrink-0">
                {finished ? 'Sair' : 'Abandonar'}
              </Button>
            )}
          </div>
          {/* Título do momento: só a primeira tela da sala entra com corte; as viradas seguintes trocam o texto sem
              animação de recorte, para nunca deixar meia palavra visível. */}
          <p
            className={cn('mt-1 font-display text-[21px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-text', trade.stage === 'placing' && 'animate-dv-cut-in')}
            aria-live="polite"
          >
            {STAGE_TEXT[trade.stage]}
          </p>
        </header>

        <HouseRuleBanner expanded={trade.stage === 'placing'} />

        {trade.stage === 'placing' && <CardPicker />}

        <div ref={tableRef} className="scroll-mt-3">
          <TradeTable trade={trade} />
        </div>

        <TradeActions trade={trade} onExit={exit} />
      </section>

      <TradeChat trade={trade} />
    </div>
  )
}

/** A regra da casa (a mesma em todas as salas): completa enquanto você escolhe a carta, depois em uma linha. */
function HouseRuleBanner({ expanded }: { expanded: boolean }) {
  return (
    <div
      role="note"
      aria-label="Regra da casa: mesma raridade, às cegas até a revelação"
      className="relative isolate animate-dv-cut-in overflow-hidden border border-dv-line-strong bg-[linear-gradient(100deg,rgba(44,44,49,0.95),rgba(21,21,23,0.92)_55%,rgb(var(--dv-ink-rgb)/0.9))] [animation-delay:120ms]"
    >
      <div className="flex items-stretch">
        {/* faixa diagonal de aço com o sigilo da raridade; filete de ametista */}
        <span aria-hidden="true" className="relative grid w-[4.6rem] shrink-0 place-items-center">
          <span className="absolute inset-y-0 left-0 right-0 bg-dv-amethyst/80 [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]" />
          <span className="absolute inset-y-0 left-0 right-px bg-[linear-gradient(180deg,#ece5d8,#bab09f_50%,#7a7266)] [clip-path:polygon(0_0,calc(100%-1px)_0,calc(100%-15px)_100%,0_100%)]" />
          <HouseSigil rule="raridade" className="relative size-7 -translate-x-1 text-dv-ink" />
        </span>
        <div className="min-w-0 py-2.5 pl-3 pr-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dv-text-3">Regra da casa</p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[16px] font-semibold uppercase tracking-[0.12em] text-dv-text">Mesma raridade</span>
            <span className="font-body text-[14px] italic text-dv-text-2 [word-spacing:0.08em]">Às cegas até a revelação.</span>
          </p>
        </div>
      </div>
      {expanded && (
        <ol className="flex flex-col gap-2 border-t border-dv-line px-4 pb-3 pt-2.5">
          {TRADE_RULES.map((d, i) => (
            <li key={d} className="flex items-start gap-2.5 font-body text-[14px] leading-snug text-dv-text-2">
              <HouseSigil rule={HOUSE_SIGILS[i]} className="mt-px size-4 shrink-0 text-dv-gold" />
              {d}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** A mesa: tampo de mármore negro com o "Espaço do outro" e o "Seu espaço" frente a frente. */
function TradeTable({ trade }: { trade: TradeSession }) {
  const revealing = trade.stage === 'revealing'
  const revealed = revealing || trade.stage === 'done'
  const partnerLeft = trade.endReason === 'partner-left'
  // A raridade é a mesma nas duas (garantida); só a carta do outro fica oculta até a revelação.
  const myRarity = trade.myCard ? RARITY_META[getCard(trade.myCard.cardId).rarity] : null
  const theirRarity = trade.partnerCardId && revealed && !partnerLeft ? RARITY_META[getCard(trade.partnerCardId).rarity] : null

  return (
    <div className="relative isolate">
      <div className="dv-marble-dark relative overflow-hidden border border-dv-line-gold/70 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* véu para contraste e luz zenital da luminária */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-5%,rgba(255,246,230,0.14),transparent_70%),linear-gradient(180deg,rgb(var(--dv-ink-rgb)/0.35),rgb(var(--dv-ink-rgb)/0.7))]" />
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
                className={cn('w-[128px] transition-[transform,filter] duration-700 @lg:w-40', revealing && 'scale-[1.07] drop-shadow-[0_0_22px_rgba(255,246,230,0.5)]')}
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
            note={trade.stage === 'done' ? 'Entregue' : trade.myCard ? 'O outro vê o verso' : undefined}
          >
            {trade.myCard ? (
              <CardFace cardId={trade.myCard.cardId} size="md" className={cn('w-[128px] animate-dv-pop @lg:w-40', trade.stage === 'done' && 'opacity-55 saturate-50')} />
            ) : (
              <EmptySlot label={trade.stage === 'placing' ? 'Escolha abaixo' : undefined} />
            )}
          </Seat>
        </div>

        {/* plaqueta da raridade */}
        <div className="relative flex items-center justify-center gap-2 border-t border-dv-line px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em]">
          {revealing ? (
            <span className="animate-dv-cut-in font-impact text-[20px] uppercase leading-none tracking-[0.34em] text-dv-gold-bright [text-shadow:0_0_14px_rgba(255,246,230,0.45)]">Revelação</span>
          ) : myRarity ? (
            !revealed ? (
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
          ) : (
            <span className="flex items-center gap-2 text-dv-text-3">
              <HouseSigil rule="raridade" className="size-4" />
              Mesma raridade nas duas
            </span>
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
  left,
  children,
}: {
  label: string
  name: string
  accepted: boolean
  present: boolean
  mine?: boolean
  note?: string
  spotlight?: boolean
  left?: boolean
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
      </div>
      <p className={cn('mt-1 max-w-full truncate font-display text-[14px] font-semibold tracking-[0.06em]', present ? 'text-dv-text' : 'text-dv-text-3')}>{name}</p>
      {present && (
      <p
        className={cn(
          'flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.18em]',
          accepted ? 'bg-dv-ink text-dv-text shadow-[inset_0_0_0_1px_rgba(236,229,216,0.55)]' : 'text-dv-text-3 shadow-[inset_0_0_0_1px_var(--dv-line)]',
        )}
      >
        {accepted && <GlyphCheck className="size-3 text-dv-gold-bright" />}
        {accepted ? 'Aceitou' : left ? 'Saiu' : 'Indeciso'}
      </p>
      )}
      {note && <p className="font-body text-[12.5px] italic text-dv-text-3">{note}</p>}
    </div>
  )
}

function EmptySlot({ waiting, label }: { waiting?: boolean; label?: string }) {
  return (
    <div className="relative grid aspect-[9/20] w-[128px] place-items-center bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.025)_0_6px,transparent_6px_12px)] @lg:w-40">
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

/** Mão do jogador: escolha a carta que vai para o seu espaço. Carrossel com bordas esmaecidas e contador. */
const PICK_W = 92
const PICK_GAP = 12

function CardPicker() {
  const { state, dispatch } = useDevo()
  const listRef = useRef<HTMLUListElement>(null)
  const [pos, setPos] = useState({ index: 1, start: true, end: false })
  const presas = usePresas()
  // Cartas no Salão das Máscaras aparecem por último, trancadas: não vão à mesa.
  const hand = [...state.inventory].sort((a, b) => Number(presas.has(a.uid)) - Number(presas.has(b.uid)))
  const total = hand.length

  const measure = () => {
    const el = listRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setPos({
      index: Math.min(total, Math.max(1, Math.round(el.scrollLeft / (PICK_W + PICK_GAP)) + 1)),
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
    })
  }
  useEffect(measure, [total]) // eslint-disable-line react-hooks/exhaustive-deps

  const place = (uid: string) => {
    if (presas.has(uid)) {
      playSfx('error')
      return
    }
    playSfx('card-select')
    dispatch({ type: 'TRADE_PLACE', uid })
  }

  const fade = `linear-gradient(90deg, ${pos.start ? '#000' : 'transparent'} 0, #000 ${pos.start ? '0' : '28px'}, #000 calc(100% - ${pos.end ? '0px' : '44px'}), ${pos.end ? '#000' : 'transparent'} 100%)`

  return (
    <div className="animate-dv-rise">
      <div className="flex items-center justify-between gap-3">
        <p className="dv-label flex items-center gap-2 text-dv-gold">
          <SigilStar tone="current" className="size-2.5" />
          Escolha a carta que vai à mesa
        </p>
        {total > 0 && (
          <p className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-dv-text-3" aria-live="off">
            <span className="dv-tabular text-dv-text">{pos.index}</span> / <span className="dv-tabular">{total}</span>
          </p>
        )}
      </div>
      <ul
        ref={listRef}
        onScroll={measure}
        className="devo-scroll -mx-4 mt-3 flex snap-x scroll-px-4 overflow-x-auto px-4 pb-3 pt-2"
        style={{ gap: PICK_GAP, maskImage: fade, WebkitMaskImage: fade }}
        aria-label="Suas cartas"
      >
        {hand.map((c) => {
          const presa = presas.has(c.uid)
          const name = getCard(c.cardId).name
          return (
            <li key={c.uid} className="shrink-0 snap-start">
              <button
                type="button"
                disabled={presa}
                onClick={() => place(c.uid)}
                className="dv-focus relative block transition-transform duration-[var(--dv-dur-2)] ease-[var(--dv-ease-out)] enabled:hover:-translate-y-1.5 enabled:focus-visible:-translate-y-1.5 enabled:active:scale-[0.97] disabled:cursor-not-allowed"
                aria-label={presa ? `${name}: no Salão das Máscaras, não vai à mesa` : `Colocar ${name} na mesa`}
              >
                <CardFace cardId={c.cardId} size="sm" className={cn('w-[92px] shrink-0', presa && 'opacity-40 grayscale')} />
                {presa && (
                  <span aria-hidden="true" className="absolute inset-x-1 bottom-2 bg-dv-ink/90 py-1 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-2 shadow-[inset_0_0_0_1px_var(--dv-line-strong)]">
                    No Salão
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {total === 0 && <li className="font-body text-[15px] italic text-dv-text-3">Você não tem cartas para trocar.</li>}
      </ul>
    </div>
  )
}

function TradeActions({ trade, onExit }: { trade: TradeSession; onExit: () => void }) {
  const { dispatch } = useDevo()

  if (trade.stage === 'placing') return null

  if (trade.stage === 'done' && trade.partnerCardId) {
    const card = getCard(trade.partnerCardId)
    const rarity = RARITY_META[card.rarity]
    return (
      <div className="flex animate-dv-rise flex-col gap-3 border-t border-dv-line-gold/50 pt-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dv-text-3">Você recebeu</p>
            <p className="mt-1 font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-dv-gold-bright">{card.name}</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-2">
              <RarityMark color={rarity.color} />
              {rarity.label}
            </p>
          </div>
          <span aria-hidden="true" className="-my-2 shrink-0">
            <Stamp text="Troca final" shape="round" tone="gold" size={88} rotate={10} animate ring="SALA DE TROCAS · DEVO · SEM VOLTA ·" />
          </span>
        </div>
        <Button block onClick={onExit} sfx="click" icon={<GlyphArrow className="size-4 rotate-180" />}>
          Voltar ao corredor
        </Button>
      </div>
    )
  }

  if (trade.stage === 'abandoned') {
    return (
      <div className="flex animate-dv-rise flex-col gap-3 pt-2">
        <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
          {trade.endReason === 'partner-left' ? 'O outro jogador fugiu antes de aceitar. Sua carta voltou para você.' : 'Troca cancelada. Sua carta voltou para você.'}
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
          : 'Se os dois aceitarem, as cartas viram. Troca confirmada não se desfaz.'

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="flex items-start gap-2 font-body text-[15px] leading-snug text-dv-text-2" aria-live="polite">
        <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-dv-gold" />
        {status}
      </p>
      {trade.stage !== 'revealing' &&
        (trade.myAccept ? (
          // Aceito: selo em ink com o check em prata (não é mais um botão — não há volta).
          <p
            role="status"
            className="relative flex min-h-14 animate-dv-fade items-center justify-center gap-3 border border-dv-gold-bright/40 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))] font-display text-[15px] font-semibold uppercase tracking-[0.26em] text-dv-text"
          >
            <span aria-hidden="true" className="absolute -left-px -top-px size-2.5 border-l border-t border-dv-gold-bright" />
            <span aria-hidden="true" className="absolute -bottom-px -right-px size-2.5 border-b border-r border-dv-gold-bright" />
            <span className="grid size-6 place-items-center border border-dv-gold-bright/70 bg-dv-ink">
              <GlyphCheck className="size-3.5 text-dv-gold-bright" />
            </span>
            Troca aceita
          </p>
        ) : (
          <Button
            block
            size="lg"
            disabled={trade.stage !== 'negotiating'}
            onClick={() => {
              playSfx('confirm')
              dispatch({ type: 'TRADE_ACCEPT' })
            }}
            icon={<GlyphCheck className="size-4" />}
          >
            Aceitar troca
          </Button>
        ))}
    </div>
  )
}

function TradeChat({ trade }: { trade: TradeSession }) {
  const { dispatch } = useDevo()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const canChat = trade.stage === 'negotiating'

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
    <aside
      aria-label="Conversa da sala"
      className="relative isolate flex flex-col border border-dv-line-strong bg-[linear-gradient(180deg,rgba(21,21,23,0.94),rgb(var(--dv-ink-rgb)/0.96))] @3xl:sticky @3xl:top-4 @3xl:h-[34rem]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-dv-line px-4 py-2.5">
        <p className="flex items-baseline gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-dv-text">
          Canal da sala
          <span lang="ja" className="font-sans text-[10px] font-normal tracking-[0.18em] text-dv-text-3">
            密談
          </span>
        </p>
        <span className={cn('flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]', canChat ? 'text-dv-text-2' : 'text-dv-text-3')}>
          <HouseSigil rule="chat" className="size-3.5" />
          {canChat ? 'Negociação aberta' : trade.partner ? 'Canal fechado' : 'Esperando alguém'}
        </span>
      </header>
      <div
        ref={listRef}
        className={cn(
          'devo-scroll flex flex-col gap-3 overflow-y-auto px-4 @3xl:max-h-none @3xl:flex-1',
          trade.chat.length === 0 && !trade.partnerTyping ? 'py-3' : 'max-h-[15rem] min-h-[7rem] py-3',
        )}
        aria-live="polite"
      >
        {trade.chat.length === 0 && !trade.partnerTyping && (
          <p className="flex items-center gap-2.5 font-body text-[15px] italic text-dv-text-3">
            <span aria-hidden="true" className="h-px w-5 bg-dv-line-strong" />
            {trade.partner ? 'Ninguém disse nada ainda.' : 'Ninguém na sala ainda.'}
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
                  me ? 'bg-dv-porcelain text-dv-porcelain-ink shadow-[inset_-2px_0_0_var(--dv-gold)]' : 'bg-[linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink-3))] text-dv-text shadow-[inset_2px_0_0_var(--dv-marble-vein)]',
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
      <div className="border-t border-dv-line">
        <div className="grid grid-cols-2 gap-2 px-3 pt-3" role="group" aria-label="Frases prontas">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!canChat}
              onClick={() => say(p)}
              className="dv-focus dv-cut-diag flex h-12 items-center justify-center bg-dv-ink-3 px-2.5 text-center font-body text-[14px] leading-tight text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] transition-[background,box-shadow,transform] duration-[var(--dv-dur-2)] enabled:hover:shadow-[inset_0_0_0_1px_var(--dv-gold)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ '--dv-cut': '7px' } as CSSProperties}
            >
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="flex items-center gap-2 p-3">
          <label htmlFor="trade-chat" className="sr-only">
            Mensagem para o outro jogador
          </label>
          <input
            id="trade-chat"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canChat}
            placeholder={canChat ? 'Negocie, convença… ou minta.' : 'O canal abre quando alguém sentar.'}
            autoComplete="off"
            className="dv-focus min-h-11 min-w-0 flex-1 border-0 bg-dv-ink px-3 font-sans text-[15px] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] placeholder:text-dv-text-3 focus:shadow-[inset_0_0_0_1px_var(--dv-amethyst)] disabled:opacity-50"
          />
          <IconButton type="submit" label="Enviar" variant="primary" disabled={!canChat}>
            <GlyphArrow className="size-4" />
          </IconButton>
        </form>
      </div>
    </aside>
  )
}
