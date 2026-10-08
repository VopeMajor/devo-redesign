'use client'

import { Check, DoorClosed, DoorOpen, Gem, Layers, Lock, MessageSquare, Pointer, Repeat, Search, Timer } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { TutorialVisual } from '@/lib/devo/intro-script'
import { cn } from '@/lib/utils'
import { CardBack, CardFace } from '../shared/devo-card'

const GOLD = '#d8b25a'

/** A mão que aponta e "toca" no elemento explicado. */
function PointingHand({ className }: { className?: string }) {
  return (
    <span className={cn('pointer-events-none absolute z-20', className)} aria-hidden="true">
      <span className="absolute -left-1 -top-1 size-6 rounded-full border-2 border-[#d8b25a] animate-ping-slow" />
      <Pointer className="size-9 fill-[#f4ead2] text-[#1a1208] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] animate-tap" strokeWidth={1.4} />
    </span>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-center text-[11px] uppercase tracking-[0.3em] text-[#e9dcbc]/70">
      <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#d8b25a]/70" aria-hidden="true" />
      {children}
      <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#d8b25a]/70" aria-hidden="true" />
    </p>
  )
}

/** Cantoneira dourada usada nas molduras do tutorial. */
function Corner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('pointer-events-none absolute size-9', className)} aria-hidden="true">
      <path d="M2 38 V10 Q2 2 10 2 H38" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <path d="M7 38 V13 Q7 7 13 7 H38" fill="none" stroke={GOLD} strokeWidth=".7" opacity=".6" />
      <path d="M10 10 L14 6 L18 10 L14 14Z" fill={GOLD} />
    </svg>
  )
}

function Velvet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('relative rounded-xl border border-[#d8b25a]/50 p-4 shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_12px_30px_-10px_rgba(0,0,0,0.9)]', className)}
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1f3a2c, #0d1a14 70%, #070d0a)' }}
    >
      <span className="pointer-events-none absolute inset-1.5 rounded-lg border border-dashed border-[#d8b25a]/20" aria-hidden="true" />
      {children}
    </div>
  )
}

function useCountdown(start: number) {
  const [secs, setSecs] = useState(start)
  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => (s > 0 ? s - 1 : start)), 1000)
    return () => window.clearInterval(id)
  }, [start])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return { label: [h, m, s].map((n) => String(n).padStart(2, '0')).join(':'), secs }
}

function WristVisual() {
  const { label, secs } = useCountdown(72 * 3600 - 1)
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex h-28 w-72 items-center justify-center rounded-[3rem] border border-[#d8b25a]/40 bg-[linear-gradient(180deg,#2a211c,#120e0c_60%,#070505)] shadow-[inset_0_3px_14px_rgba(0,0,0,0.95),0_14px_30px_-10px_rgba(0,0,0,0.9)]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('absolute size-1.5 rounded-full bg-[#d8b25a]/70 shadow-[0_0_4px_#d8b25a]', i < 2 ? 'top-3' : 'bottom-3', i % 2 ? 'right-10' : 'left-10')} aria-hidden="true" />
        ))}
        <div className="relative flex flex-col items-center gap-1 rounded-md border border-primary/80 bg-[#04070f] px-5 py-2 shadow-[0_0_30px_-4px_var(--color-primary),inset_0_0_14px_rgba(49,93,255,0.25)]">
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.35em] text-primary">
            <Timer className="size-3" aria-hidden="true" />
            Pulso
          </span>
          <span className="font-mono text-3xl tabular-nums tracking-wider text-[#e8eeff] [text-shadow:0_0_12px_rgba(120,150,255,0.8)]">{label}</span>
          <span key={secs} className="absolute -right-8 top-1 font-mono text-xs text-dv-red animate-[devo-drift-away_1s_ease-out_both]">-1s</span>
        </div>
        <PointingHand className="-bottom-6 right-10" />
      </div>
      <svg viewBox="0 0 200 24" className="w-56" aria-hidden="true">
        <path d="M0 12 H70 L78 4 L86 20 L94 12 H200" fill="none" stroke="var(--color-dv-red)" strokeWidth="1.5" className="[stroke-dasharray:240] animate-[dv-line_1.4s_linear_infinite]" />
      </svg>
      <Caption>Tempo restante = vida restante</Caption>
    </div>
  )
}

const DEVICE_APPS = [
  { icon: Timer, label: 'Pulso', badge: null },
  { icon: Layers, label: 'Cartas', badge: '3' },
  { icon: Repeat, label: 'Trocas', badge: '!' },
  { icon: MessageSquare, label: 'Mensagens', badge: '2' },
]

function DeviceVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-48 rounded-[1.8rem] border-2 border-[#d8b25a]/50 bg-[linear-gradient(160deg,#141a2b,#06080f)] p-1.5 shadow-[0_24px_40px_-12px_rgba(0,0,0,0.95),0_0_40px_-16px_var(--color-primary)]">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-foreground/10 bg-[radial-gradient(ellipse_at_50%_0%,#13246b,#05070e_70%)] p-3">
          <div className="mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-foreground/60">
            <span className="text-[#d8b25a]">Devo</span>
            <span className="font-mono text-dv-red">71:59:12</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEVICE_APPS.map(({ icon: Icon, label, badge }, i) => (
              <div key={label} className="flex flex-col items-center gap-1 animate-pop" style={{ animationDelay: `${i * 140}ms` }}>
                <span className="relative grid size-12 place-items-center rounded-2xl border border-[#d8b25a]/40 bg-[linear-gradient(160deg,#20294a,#0b0f1e)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <Icon className="size-5 text-[#f1e3bd]" strokeWidth={1.4} aria-hidden="true" />
                  {badge && (
                    <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-dv-red text-[9px] font-semibold text-white shadow-[0_0_8px_var(--color-dv-red)]">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="text-[9px] tracking-wide text-foreground/75">{label}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-foreground/30" />
        </div>
        <PointingHand className="bottom-16 right-5" />
      </div>
      <Caption>Um sistema dentro do sistema</Caption>
    </div>
  )
}

function CardsVisual() {
  const ids = ['ampulheta', 'mascara', 'chave']
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex h-52 w-72 items-end justify-center">
        <span className="absolute inset-x-6 bottom-0 h-16 rounded-full bg-[radial-gradient(ellipse,rgba(216,178,90,0.35),transparent_70%)] blur-md" aria-hidden="true" />
        {ids.map((id, i) => (
          <div
            key={id}
            className={cn('-mx-4 w-24 origin-bottom animate-pop transition-transform', i === 1 && 'z-10 drop-shadow-[0_0_18px_rgba(216,178,90,0.55)]')}
            style={{ transform: `rotate(${(i - 1) * 14}deg) translateY(${i === 1 ? -16 : 0}px)`, animationDelay: `${i * 160}ms` }}
          >
            <CardFace cardId={id} size="sm" />
          </div>
        ))}
        <PointingHand className="-bottom-4 left-[55%]" />
      </div>
      <span className="flex items-center gap-2 rounded-full border border-[#d8b25a]/50 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#e9dcbc]">
        <Layers className="size-3 text-[#d8b25a]" aria-hidden="true" />
        Inventário · 3 cartas
      </span>
      <Caption>Ferramentas, armas ou moeda de troca</Caption>
    </div>
  )
}

const ROOMS = ['livre', 'ocupada', 'livre', 'ocupada', 'livre', 'ocupada'] as const

function RoomsVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative grid grid-cols-3 gap-3">
        {ROOMS.map((status, i) => {
          const chosen = i === 2
          const free = status === 'livre'
          const Icon = chosen ? DoorOpen : free ? DoorClosed : Lock
          return (
            <div
              key={i}
              className={cn(
                'relative flex h-24 w-20 flex-col items-center justify-between rounded-t-[2.2rem] border px-2 pb-2 pt-4 transition-all',
                free ? 'border-[#d8b25a]/45 bg-[linear-gradient(180deg,#2a1e14,#120c08)]' : 'border-foreground/10 bg-[#0a0a0c] opacity-45 grayscale',
                chosen && 'border-[#d8b25a] bg-[linear-gradient(180deg,#3b2a12,#160f08)] shadow-[0_0_26px_-4px_rgba(216,178,90,0.7)]',
              )}
            >
              <Icon className={cn('size-6', chosen ? 'text-[#f6dc93]' : free ? 'text-[#d8b25a]/80' : 'text-foreground/40')} strokeWidth={1.3} aria-hidden="true" />
              <span className="font-serif text-[11px] tracking-[0.15em] text-[#e9dcbc]">{`Sala ${String(i + 1).padStart(2, '0')}`}</span>
              <span className={cn('flex items-center gap-1 text-[9px] uppercase tracking-[0.2em]', free ? 'text-emerald-300/80' : 'text-dv-red/80')}>
                <span className={cn('size-1.5 rounded-full', free ? 'bg-emerald-300/80 shadow-[0_0_6px_#6ee7b7]' : 'bg-dv-red/80')} />
                {status}
              </span>
              {chosen && (
                <span className="absolute -bottom-3 rounded-sm border border-[#d8b25a] bg-[#1a1208] px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-[#f6dc93] animate-pop">
                  Entrar
                </span>
              )}
            </div>
          )
        })}
        <PointingHand className="right-3 top-14" />
      </div>
      <Caption>Uma negociação por sala</Caption>
    </div>
  )
}

function Slot({ label, children, highlight }: { label: string; children?: ReactNode; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'grid aspect-[9/20] w-[5.5rem] place-items-center rounded-[0.6rem] border-2 border-dashed p-1',
          highlight ? 'border-[#d8b25a]/80 bg-[#d8b25a]/10 shadow-[inset_0_0_20px_rgba(216,178,90,0.25)]' : 'border-foreground/20 bg-black/30',
        )}
      >
        {children}
      </div>
      <span className={cn('text-[10px] uppercase tracking-[0.25em]', highlight ? 'text-[#f6dc93]' : 'text-[#e9dcbc]/50')}>{label}</span>
    </div>
  )
}

function UnknownPlayer() {
  return (
    <span className="flex flex-col items-center gap-1 text-[#e9dcbc]/35">
      <span className="font-serif text-4xl animate-pulse">?</span>
      <span className="text-[8px] uppercase tracking-[0.3em]">Vazio</span>
    </span>
  )
}

function SlotVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <Velvet>
        <div className="relative flex items-start gap-8 px-2">
          <Slot label="Seu espaço" highlight>
            <div className="w-full animate-drop">
              <CardFace cardId="mascara" size="sm" />
            </div>
          </Slot>
          <span className="mt-20 font-serif text-lg text-[#d8b25a]/70" aria-hidden="true">
            vs
          </span>
          <Slot label="Outro jogador">
            <UnknownPlayer />
          </Slot>
          <PointingHand className="left-16 top-24" />
        </div>
      </Velvet>
      <Caption>Você não escolhe o que ele oferece</Caption>
    </div>
  )
}

function ClockVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative grid size-40 place-items-center rounded-full border-2 border-[#d8b25a]/60 bg-[radial-gradient(circle,#1a1424,#07060a_70%)] shadow-[0_0_40px_-10px_rgba(216,178,90,0.5),inset_0_0_30px_rgba(0,0,0,0.9)]">
        <span className="absolute inset-2 rounded-full border border-dashed border-[#d8b25a]/30 animate-[pr-rays_30s_linear_infinite]" aria-hidden="true" />
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="absolute h-full w-px py-3" style={{ transform: `rotate(${i * 30}deg)` }} aria-hidden="true">
            <span className={cn('block w-px bg-[#d8b25a]', i % 3 === 0 ? 'h-3' : 'h-1.5 opacity-60')} />
          </span>
        ))}
        <span className="absolute h-1/2 w-full animate-[spin_4s_linear_infinite]" aria-hidden="true">
          <span className="absolute bottom-0 left-1/2 h-14 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-t from-[#d8b25a] to-[#f6dc93] shadow-[0_0_8px_#d8b25a]" />
        </span>
        <span className="relative grid size-12 place-items-center rounded-full border border-[#d8b25a]/60 bg-black">
          <Search className="size-5 text-[#f6dc93]" strokeWidth={1.4} aria-hidden="true" />
        </span>
      </div>
      <p className="flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-[#e9dcbc]">
        Procurando oponente
        {[0, 1, 2].map((i) => (
          <span key={i} className="animate-blink" style={{ animationDelay: `${i * 200}ms` }}>
            .
          </span>
        ))}
      </p>
    </div>
  )
}

function HiddenVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <Velvet className="px-6">
        <div className="flex items-center gap-6">
          {['Sua carta', 'Carta dele'].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={cn('relative w-24', i === 0 ? '-rotate-3' : 'rotate-3')}>
                <CardBack />
                <span className="absolute inset-0 grid place-items-center font-serif text-5xl text-[#f6dc93] drop-shadow-[0_0_14px_rgba(216,178,90,0.9)] animate-pulse">?</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#e9dcbc]/60">{label}</span>
            </div>
          ))}
        </div>
      </Velvet>
      <span className="flex items-center gap-2 rounded-full border border-[#8fa8ff]/60 bg-[#0b1440]/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#a9bcff] shadow-[0_0_18px_-6px_#6f8cff]">
        <Gem className="size-3" aria-hidden="true" />
        Mesma raridade
      </span>
    </div>
  )
}

const CHAT = [
  { me: false, text: 'Minha carta é lendária. Confia.' },
  { me: true, text: 'Todo mundo diz isso.' },
  { me: false, text: 'Mas eu estou falando a verdade.' },
]

function Avatar({ me }: { me: boolean }) {
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full border text-[10px] font-semibold',
        me ? 'border-primary/70 bg-primary/20 text-[#c9d4ff]' : 'border-[#d8b25a]/60 bg-[#2a1e10] text-[#f6dc93]',
      )}
      aria-hidden="true"
    >
      {me ? 'EU' : '?'}
    </span>
  )
}

function ChatVisual() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#d8b25a]/30 pb-2 text-[10px] uppercase tracking-[0.3em] text-[#e9dcbc]/60">
        <span>Sala 03 · Chat</span>
        <span className="flex items-center gap-1 text-emerald-300/80">
          <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#6ee7b7]" />2 na sala
        </span>
      </div>
      {CHAT.map((m, i) => (
        <div key={i} className={cn('flex items-end gap-2 animate-pop', m.me && 'flex-row-reverse')} style={{ animationDelay: `${i * 500}ms` }}>
          <Avatar me={m.me} />
          <p
            className={cn(
              'max-w-[78%] rounded-2xl px-3 py-1.5 text-sm',
              m.me ? 'rounded-br-sm border border-primary/50 bg-primary/20' : 'rounded-bl-sm border border-[#d8b25a]/30 bg-[#1d160e]',
            )}
          >
            {m.text}
          </p>
        </div>
      ))}
      <div className="flex items-center gap-2 animate-pop" style={{ animationDelay: '1600ms' }}>
        <Avatar me={false} />
        <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-[#d8b25a]/30 bg-[#1d160e] px-3 py-2.5" aria-label="Digitando">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-[#e9dcbc]/70 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      </div>
      <Caption>Negociem. Convençam. Mintam.</Caption>
    </div>
  )
}

function Seal({ who, lit, delay }: { who: string; lit: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          'relative grid size-20 place-items-center rounded-full border-2 transition-all duration-500',
          lit
            ? 'border-[#f6dc93] bg-[radial-gradient(circle_at_35%_30%,#c43a2c,#6e1414_70%)] shadow-[0_0_30px_-4px_rgba(196,58,44,0.8)]'
            : 'border-foreground/20 bg-[radial-gradient(circle_at_35%_30%,#2a2a30,#0c0c10_70%)]',
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <span className="absolute inset-1.5 rounded-full border border-dashed border-[#f6dc93]/40" aria-hidden="true" />
        <Check className={cn('size-8 transition-opacity', lit ? 'text-[#f6dc93] opacity-100' : 'opacity-20')} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-[#e9dcbc]/70">{who}</span>
    </div>
  )
}

function AcceptVisual() {
  const [lit, setLit] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setLit(true), 400)
    return () => window.clearTimeout(id)
  }, [])
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex items-center gap-6">
        <Seal who="Você" lit={lit} delay={0} />
        <span className={cn('h-px w-12 transition-colors duration-700', lit ? 'bg-[#d8b25a]' : 'bg-foreground/20')} style={{ transitionDelay: '900ms' }} aria-hidden="true" />
        <Seal who="Outro jogador" lit={lit} delay={900} />
        <PointingHand className="left-12 top-12" />
      </div>
      <span className={cn('rounded-sm border px-4 py-1 text-[11px] uppercase tracking-[0.35em] transition-all duration-500', lit ? 'border-[#d8b25a] text-[#f6dc93]' : 'border-transparent text-transparent')} style={{ transitionDelay: '1300ms' }}>
        Troca selada
      </span>
      <Caption>Os dois precisam aceitar</Caption>
    </div>
  )
}

function RevealVisual() {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setFlipped(true), 500)
    return () => window.clearTimeout(id)
  }, [])
  return (
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative flex gap-5">
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 animate-[pr-rays_14s_linear_infinite] opacity-60"
          style={{ background: 'repeating-conic-gradient(rgba(216,178,90,0.35) 0 6deg, transparent 6deg 18deg)', maskImage: 'radial-gradient(circle, black 20%, transparent 70%)' }}
          aria-hidden="true"
        />
        {['ampulheta', 'tesoura'].map((id, i) => (
          <div key={id} className={cn('relative w-24 [perspective:800px]', i === 0 ? '-rotate-6' : 'rotate-6')}>
            <div className={cn('relative transition-transform duration-700 [transform-style:preserve-3d]', flipped ? '' : '[transform:rotateY(180deg)]')}>
              <div className="[backface-visibility:hidden]">
                <CardFace cardId={id} size="sm" />
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <CardBack className="h-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="absolute top-14 font-serif text-6xl uppercase tracking-[0.06em] text-[#f6dc93] [-webkit-text-stroke:1px_#5a1a0e] drop-shadow-[0_0_24px_rgba(216,90,40,0.9)] animate-kabum">Kabum!</span>
      <Caption>Sem devoluções</Caption>
    </div>
  )
}

function LostVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex h-44 w-72 items-center justify-start overflow-hidden rounded-xl border border-[#d8b25a]/30 bg-[radial-gradient(ellipse_at_30%_50%,#1a1520,#060508_75%)] pl-8">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_40%,rgba(200,190,230,0.18),transparent_60%)] animate-[devo-mist_8s_ease-in-out_infinite]" aria-hidden="true" />
        <div className="w-20 animate-drift-away">
          <CardFace cardId="coroa" size="sm" />
        </div>
        {[
          ['right-8 top-6', 'text-3xl'],
          ['bottom-6 right-16', 'text-2xl'],
          ['right-24 top-10', 'text-xl'],
        ].map(([pos, size], i) => (
          <span key={i} className={cn('absolute font-serif text-[#e9dcbc]/25 animate-pulse', pos, size)} style={{ animationDelay: `${i * 400}ms` }} aria-hidden="true">
            ?
          </span>
        ))}
      </div>
      <Caption>Em qualquer lugar. Nas mãos de qualquer pessoa.</Caption>
    </div>
  )
}

function MessagesVisual() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <p className="self-start rounded-2xl rounded-bl-sm border border-[#d8b25a]/30 bg-[#1d160e] px-3 py-2 text-sm">Fale logo. Meu tempo vale mais que o seu.</p>
      <div className="relative flex flex-col gap-1.5">
        {['Quem é você, afinal?', 'Você pode me ajudar?', 'Nada. Esqueça.'].map((c, i) => (
          <span
            key={c}
            className={cn(
              'flex items-center gap-3 rounded-sm border px-3 py-1.5 text-sm animate-pop',
              i === 0 ? 'border-[#d8b25a] bg-[#d8b25a]/15 text-[#f6dc93] shadow-[0_0_16px_-6px_#d8b25a]' : 'border-foreground/15 bg-black/30 text-foreground/65',
            )}
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span className={cn('grid size-5 place-items-center rounded-sm border font-mono text-[10px]', i === 0 ? 'border-[#d8b25a]' : 'border-foreground/25')}>{i + 1}</span>
            {c}
            {i === 0 && <span className="ml-auto text-[#d8b25a]" aria-hidden="true">◆</span>}
          </span>
        ))}
        <PointingHand className="right-8 top-4" />
      </div>
      <Caption>Cada pergunta, uma resposta</Caption>
    </div>
  )
}

const VISUALS: Record<TutorialVisual, () => ReactNode> = {
  wrist: WristVisual,
  device: DeviceVisual,
  cards: CardsVisual,
  rooms: RoomsVisual,
  slot: SlotVisual,
  clock: ClockVisual,
  hidden: HiddenVisual,
  chat: ChatVisual,
  accept: AcceptVisual,
  reveal: RevealVisual,
  lost: LostVisual,
  messages: MessagesVisual,
}

function StepBanner({ step }: { step: string }) {
  const match = step.match(/^(\d+)\.\s*(.*)$/)
  const num = match?.[1]
  const text = match?.[2] ?? step
  return (
    <figcaption className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center whitespace-nowrap">
      {num && (
        <span className="relative z-10 -mr-3 grid size-10 place-items-center rounded-full border-2 border-[#d8b25a] bg-[radial-gradient(circle_at_35%_30%,#3a2a12,#120c06)] font-serif text-lg text-[#f6dc93] shadow-[0_0_16px_-2px_rgba(216,178,90,0.7)]">
          {num}
        </span>
      )}
      <span className="border-y border-r border-[#d8b25a]/70 bg-gradient-to-b from-[#2a1e10] to-[#0e0a06] py-1.5 pl-6 pr-5 text-[11px] uppercase tracking-[0.3em] text-[#f1e3bd] [clip-path:polygon(0_0,100%_0,calc(100%-10px)_50%,100%_100%,0_100%)]">
        {num ? `Etapa · ${text}` : text}
      </span>
    </figcaption>
  )
}

export function TutorialVisualPanel({ visual, step }: { visual: TutorialVisual; step?: string }) {
  const Visual = VISUALS[visual]
  return (
    <figure className="relative flex flex-col items-center gap-4 rounded-sm border border-[#d8b25a]/40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(40,30,18,0.92),rgba(8,8,12,0.94)_70%)] px-8 pb-7 pt-10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95),0_0_60px_-30px_rgba(216,178,90,0.6)] backdrop-blur-md animate-pop lg:[zoom:1.25] xl:[zoom:1.35]">
      <span className="pointer-events-none absolute inset-1.5 rounded-sm border border-[#d8b25a]/15" aria-hidden="true" />
      <Corner className="left-0 top-0" />
      <Corner className="right-0 top-0 rotate-90" />
      <Corner className="bottom-0 right-0 rotate-180" />
      <Corner className="bottom-0 left-0 -rotate-90" />
      {step && <StepBanner step={step} />}
      <Visual />
    </figure>
  )
}
