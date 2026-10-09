'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { TutorialVisual } from '@/lib/devo/intro-script'
import { cn } from '@/lib/utils'
import { formatDuration } from '../hooks'
import { GlyphCard, GlyphCheck, GlyphClock, GlyphDiamond, GlyphHourglass, GlyphKeyhole, GlyphSpark, toRoman } from '../kit/glyphs'
import { Stamp } from '../kit/stamp'
import { TimeDigits } from '../kit/time'
import { CardBack, CardFace } from '../shared/devo-card'
import { DeadlyVoteSymbol } from '../system/symbol'

/**
 * Ilustrações do tutorial como DIAGRAMAS DO SISTEMA DEVO: prancheta cobalto com grade, marcas de
 * registro, linhas de cota e legendas mono. Ouro só no que se admira; vermelho só onde se morre.
 */

/** Marca de toque: onde o jogador tocaria (anel que pulsa + ponto). */
function TapMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute z-20 size-7', className)}>
      <span className="en-ping absolute inset-0 rounded-full border-2 border-dv-cobalt-text" />
      <span className="en-tap absolute inset-[7px] rounded-full bg-dv-text shadow-[0_0_12px_color-mix(in_oklab,var(--dv-amethyst)_90%,transparent)]" />
    </span>
  )
}

/** Linha de cota com rótulo: liga uma peça do diagrama à legenda. */
function Callout({ label, className, tone = 'cobalt', side = 'right' }: { label: string; className?: string; tone?: 'cobalt' | 'gold' | 'blood'; side?: 'left' | 'right' }) {
  const color = tone === 'gold' ? 'text-dv-gold' : tone === 'blood' ? 'text-dv-blood-text' : 'text-dv-cobalt-text'
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute flex items-center gap-1.5', side === 'left' && 'flex-row-reverse', color, className)}>
      <span className="size-1.5 rotate-45 bg-current" />
      <span className="h-px w-6 bg-current opacity-70" />
      <span className="dv-label whitespace-nowrap text-[10px]">{label}</span>
    </span>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="dv-label flex items-center gap-2.5 text-center text-[10px] text-dv-text-2">
      <span className="h-px w-5 bg-gradient-to-r from-transparent to-dv-gold/70" aria-hidden="true" />
      {children}
      <span className="h-px w-5 bg-gradient-to-l from-transparent to-dv-gold/70" aria-hidden="true" />
    </p>
  )
}

function useCountdown(start: number) {
  const [secs, setSecs] = useState(start)
  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => (s > 0 ? s - 1 : start)), 1000)
    return () => window.clearInterval(id)
  }, [start])
  return secs
}

/** Régua do pulso (72 marcas) com o arco do tempo restante. */
function PulseRing({ ratio }: { ratio: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 132 132" aria-hidden="true" className="absolute inset-0 size-full">
      <circle cx="66" cy="66" r="62" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.45" strokeWidth="0.8" />
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2
        const long = i % 6 === 0
        return (
          <line
            key={i}
            x1={66 + Math.sin(a) * (long ? 57 : 59)}
            y1={66 - Math.cos(a) * (long ? 57 : 59)}
            x2={66 + Math.sin(a) * 62}
            y2={66 - Math.cos(a) * 62}
            stroke="var(--dv-gold)"
            strokeOpacity={long ? 0.9 : 0.4}
            strokeWidth={long ? 1.2 : 0.6}
          />
        )
      })}
      <circle cx="66" cy="66" r={r - 6} fill="none" stroke="color-mix(in oklab,var(--dv-porcelain) 12%,transparent)" strokeWidth="3" />
      <circle
        cx="66"
        cy="66"
        r={r - 6}
        fill="none"
        stroke="var(--dv-cobalt)"
        strokeWidth="3"
        strokeDasharray={`${(2 * Math.PI * (r - 6)) * ratio} ${c}`}
        transform="rotate(-90 66 66)"
        style={{ filter: 'drop-shadow(0 0 4px color-mix(in oklab,var(--dv-amethyst) 80%,transparent))' }}
      />
    </svg>
  )
}

function WristVisual() {
  const secs = useCountdown(72 * 3600 - 1)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-40 w-72 items-center justify-center">
        {/* pulseira */}
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 bg-[linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink-2)_70%)] [clip-path:polygon(4%_0,96%_0,100%_50%,96%_100%,4%_100%,0_50%)]" />
        <span aria-hidden="true" className="absolute inset-x-6 top-1/2 -translate-y-[26px] border-t border-dashed border-dv-gold/35" />
        <span aria-hidden="true" className="absolute inset-x-6 top-1/2 translate-y-[26px] border-t border-dashed border-dv-gold/35" />
        {/* mostrador */}
        <div className="relative grid size-[136px] place-items-center rounded-full bg-[radial-gradient(circle,var(--dv-ink-3),var(--dv-ink)_72%)] shadow-[0_0_30px_color-mix(in_oklab,var(--dv-amethyst)_30%,transparent)]">
          <PulseRing ratio={secs / (72 * 3600)} />
          <span className="relative flex flex-col items-center gap-0.5">
            <span className="dv-label text-[10px] text-dv-cobalt-text">Pulso</span>
            <TimeDigits value={formatDuration(secs * 1000)} size="sm" tone="text" label="Tempo no pulso" />
          </span>
        </div>
        <Callout label="72h = vida" className="right-0 top-2" tone="gold" side="left" />
        <Callout label="Zero = fim" className="bottom-2 left-0" tone="blood" />
        <TapMark className="bottom-7 right-16" />
      </div>
      <Caption>Tempo restante = vida restante</Caption>
    </div>
  )
}

function AppTile({ label, children, badge, delay }: { label: string; children: ReactNode; badge?: string; delay: number }) {
  return (
    <div className="animate-dv-pop relative flex flex-col items-center gap-1" style={{ animationDelay: `${delay}ms` }}>
      <span className="dv-cut grid size-12 place-items-center bg-[linear-gradient(160deg,var(--dv-ink-4),var(--dv-ink-2))] text-dv-text shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" style={{ '--dv-cut': '9px' } as CSSProperties}>
        <span className="flex size-6 [&>svg]:size-full">{children}</span>
      </span>
      {badge && <span className="dv-tabular absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-dv-blood font-mono text-[9px] text-white">{badge}</span>}
      <span className="font-sans text-[10px] text-dv-text-2">{label}</span>
    </div>
  )
}

function TradeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" />
    </svg>
  )
}
function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H10l-4 3.5V16H4Z" />
      <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" />
    </svg>
  )
}

function DeviceVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative mt-5 w-72">
        <div className="relative mx-auto w-44 rounded-[1.6rem] border border-dv-line-strong bg-[linear-gradient(160deg,var(--dv-ink-3),var(--dv-ink))] p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.95),0_0_40px_-16px_var(--dv-cobalt)]">
          <div className="relative overflow-hidden rounded-[1.2rem] bg-[radial-gradient(ellipse_at_50%_0%,var(--dv-cobalt-dim),var(--dv-ink)_70%)] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <DeadlyVoteSymbol variant="mark" className="size-4 text-dv-text" />
              <span className="dv-tabular font-impact text-[12px] tracking-[0.04em] text-dv-cobalt-text">71:59:12</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AppTile label="Pulso" delay={0}>
                <GlyphClock />
              </AppTile>
              <AppTile label="Cartas" badge="3" delay={120}>
                <GlyphCard />
              </AppTile>
              <AppTile label="Trocas" delay={240}>
                <TradeGlyph />
              </AppTile>
              <AppTile label="Mensagens" badge="2" delay={360}>
                <ChatGlyph />
              </AppTile>
            </div>
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-dv-text-3" />
          </div>
        </div>
        <Callout label="Pulso" className="-top-6 right-6" side="left" />
        <Callout label="Apps" className="left-0 top-24" />
        <TapMark className="bottom-14 right-[5.4rem]" />
      </div>
      <Caption>Um sistema dentro do sistema</Caption>
    </div>
  )
}

function CardsVisual() {
  const ids = ['ampulheta', 'mascara', 'chave']
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-52 w-72 items-end justify-center">
        <span className="absolute inset-x-8 bottom-1 h-12 rounded-[50%] bg-[radial-gradient(ellipse,color-mix(in_oklab,var(--dv-gold)_30%,transparent),transparent_70%)] blur-md" aria-hidden="true" />
        {ids.map((id, i) => (
          <div key={id} className="-mx-4 w-24" style={{ transform: `rotate(${(i - 1) * 14}deg) translateY(${i === 1 ? -16 : 0}px)`, transformOrigin: 'bottom center', zIndex: i === 1 ? 10 : 1 }}>
            <div className={cn('animate-dv-rise', i === 1 && 'drop-shadow-[0_0_18px_color-mix(in_oklab,var(--dv-gold)_50%,transparent)]')} style={{ animationDelay: `${i * 140}ms` }}>
              <CardFace cardId={id} size="sm" />
            </div>
          </div>
        ))}
        <TapMark className="bottom-6 left-[55%]" />
      </div>
      <span className="dv-cut-diag flex items-center gap-2 bg-dv-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-dv-gold-bright" style={{ '--dv-cut': '8px' } as CSSProperties}>
        <GlyphCard className="size-3.5 text-dv-gold" />
        Inventário · 3 cartas
      </span>
      <Caption>Ferramentas, armas ou moeda de troca</Caption>
    </div>
  )
}

const ROOMS = ['livre', 'ocupada', 'livre', 'ocupada', 'livre', 'ocupada'] as const

function RoomsVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative grid grid-cols-3 gap-3">
        {ROOMS.map((status, i) => {
          const chosen = i === 2
          const free = status === 'livre'
          return (
            <div
              key={i}
              className={cn(
                'relative flex h-24 w-20 flex-col items-center justify-between px-2 pb-2 pt-3 [clip-path:polygon(0_22%,50%_0,100%_22%,100%_100%,0_100%)]',
                chosen
                  ? 'bg-[linear-gradient(180deg,var(--dv-cobalt),var(--dv-cobalt-dim)_55%,var(--dv-ink-2))]'
                  : free
                    ? 'bg-[linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink-2))]'
                    : 'bg-dv-ink-2 opacity-50',
              )}
            >
              <span className={cn('mt-2 font-impact text-[22px] leading-none', chosen ? 'text-white' : free ? 'text-dv-text' : 'text-dv-text-3')}>{toRoman(i + 1)}</span>
              {free ? <span className={cn('size-1.5 rotate-45', chosen ? 'bg-dv-gold-bright' : 'bg-dv-cobalt-text')} aria-hidden="true" /> : <GlyphKeyhole className="size-4 text-dv-text-3" />}
              <span className={cn('dv-label text-[10px] tracking-[0.12em]', chosen ? 'text-white' : free ? 'text-dv-cobalt-text' : 'text-dv-text-3')}>{chosen ? 'Entrar' : status}</span>
            </div>
          )
        })}
        <TapMark className="right-5 top-10" />
      </div>
      <Caption>Uma negociação por sala</Caption>
    </div>
  )
}

/** Mesa de troca: prancheta escura com moldura tracejada. */
function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('dv-cut relative bg-[radial-gradient(ellipse_at_50%_40%,var(--dv-ink-4),var(--dv-ink-2)_70%)] p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]', className)} style={{ '--dv-cut': '14px' } as CSSProperties}>
      <span className="pointer-events-none absolute inset-2 border border-dashed border-dv-gold/20" aria-hidden="true" />
      {children}
    </div>
  )
}

function Slot({ label, children, highlight }: { label: string; children?: ReactNode; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('grid aspect-[9/20] w-[5.5rem] place-items-center border-2 border-dashed p-1', highlight ? 'border-dv-cobalt-text/80 bg-dv-cobalt-dim/40' : 'border-dv-line-strong bg-black/30')}>{children}</div>
      <span className={cn('dv-label text-[10px]', highlight ? 'text-dv-cobalt-text' : 'text-dv-text-3')}>{label}</span>
    </div>
  )
}

function SlotVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Table>
        <div className="relative flex items-start gap-6 px-1">
          <Slot label="Seu espaço" highlight>
            <div className="w-full animate-drop">
              <CardFace cardId="mascara" size="sm" />
            </div>
          </Slot>
          <span className="mt-20 -skew-x-[8deg] font-impact text-[22px] text-dv-gold" aria-hidden="true">
            VS
          </span>
          <Slot label="Outro jogador">
            <span className="font-impact text-[40px] text-dv-text-3">?</span>
          </Slot>
          <TapMark className="left-14 top-24" />
        </div>
      </Table>
      <Caption>Você não escolhe o que ele oferece</Caption>
    </div>
  )
}

function ClockVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative grid size-44 place-items-center">
        <svg viewBox="0 0 160 160" className="absolute inset-0 size-full text-dv-gold" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="80" cy="80" r="76" strokeWidth="1" opacity="0.5" />
          <circle cx="80" cy="80" r="56" strokeWidth="0.8" opacity="0.35" />
          <g className="en-sweep-hand-slow">
            <ellipse cx="80" cy="80" rx="74" ry="30" stroke="var(--dv-cobalt-text)" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 4" />
          </g>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <text key={i} x={80 + Math.sin(a) * 66} y={80 - Math.cos(a) * 66 + 3} textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" style={{ fontFamily: 'var(--font-card-title)' }}>
                {toRoman(i === 0 ? 12 : i)}
              </text>
            )
          })}
          <g className="en-sweep-hand">
            <line x1="80" y1="80" x2="80" y2="28" stroke="var(--dv-cobalt-text)" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
        <span className="relative grid size-12 place-items-center rounded-full border border-dv-gold/60 bg-dv-ink">
          <GlyphHourglass className="size-5 text-dv-gold-bright" />
        </span>
      </div>
      <p className="dv-label flex items-center gap-1 text-[11px] text-dv-text">
        Procurando oponente
        {[0, 1, 2].map((i) => (
          <span key={i} className="en-typing inline-block" style={{ animationDelay: `${i * 160}ms` }} aria-hidden="true">
            ·
          </span>
        ))}
      </p>
    </div>
  )
}

function HiddenVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Table className="px-6">
        <div className="flex items-center gap-6">
          {['Sua carta', 'Carta dele'].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={cn('relative w-24', i === 0 ? '-rotate-3' : 'rotate-3')}>
                <CardBack />
                <span className="absolute inset-0 grid place-items-center font-impact text-[44px] text-dv-gold-bright drop-shadow-[0_0_14px_color-mix(in_oklab,var(--dv-gold)_90%,transparent)]">?</span>
              </div>
              <span className="dv-label text-[10px] text-dv-text-2">{label}</span>
            </div>
          ))}
        </div>
      </Table>
      <span className="dv-cut-diag flex items-center gap-2 bg-dv-cobalt-dim px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-dv-cobalt-text" style={{ '--dv-cut': '8px' } as CSSProperties}>
        <GlyphDiamond className="size-3" filled />
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
      className={cn('dv-cut grid size-7 shrink-0 place-items-center font-mono text-[10px]', me ? 'bg-dv-cobalt-dim text-dv-cobalt-text' : 'bg-dv-ink-4 text-dv-gold-bright')}
      style={{ '--dv-cut': '6px' } as CSSProperties}
      aria-hidden="true"
    >
      {me ? 'EU' : '?'}
    </span>
  )
}

function ChatVisual() {
  return (
    <div className="flex w-72 flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-dv-line pb-2">
        <span className="dv-label text-[10px] text-dv-text-2">Sala III · Chat</span>
        <span className="dv-label flex items-center gap-1.5 text-[10px] text-dv-cobalt-text">
          <span className="size-1.5 animate-dv-blink rounded-full bg-dv-cobalt-text" />2 na sala
        </span>
      </div>
      {CHAT.map((m, i) => (
        <div key={i} className={cn('animate-dv-rise flex items-end gap-2', m.me && 'flex-row-reverse')} style={{ animationDelay: `${i * 420}ms` }}>
          <Avatar me={m.me} />
          <p className={cn('dv-cut-diag max-w-[78%] px-3 py-1.5 font-sans text-[13px] text-dv-text', m.me ? 'bg-dv-cobalt-dim' : 'bg-dv-ink-3')} style={{ '--dv-cut': '8px' } as CSSProperties}>
            {m.text}
          </p>
        </div>
      ))}
      <div className="animate-dv-rise flex items-center gap-2 [animation-delay:1400ms]">
        <Avatar me={false} />
        <span className="dv-cut-diag flex gap-1 bg-dv-ink-3 px-3 py-2.5" style={{ '--dv-cut': '8px' } as CSSProperties} aria-label="Digitando">
          {[0, 1, 2].map((i) => (
            <span key={i} className="en-typing size-1.5 rounded-full bg-dv-text-2" style={{ animationDelay: `${i * 150}ms` }} />
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
          lit ? 'border-dv-cobalt-text bg-[radial-gradient(circle_at_35%_30%,var(--dv-cobalt),var(--dv-cobalt-dim)_75%)] shadow-[0_0_30px_-4px_color-mix(in_oklab,var(--dv-amethyst)_80%,transparent)]' : 'border-dv-line-strong bg-dv-ink-3',
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <span className="absolute inset-1.5 rounded-full border border-dashed border-white/25" aria-hidden="true" />
        <GlyphCheck className={cn('size-8 transition-opacity duration-500', lit ? 'text-white opacity-100' : 'opacity-20')} style={{ transitionDelay: `${delay}ms` }} />
      </span>
      <span className="dv-label text-[10px] text-dv-text-2">{who}</span>
    </div>
  )
}

function AcceptVisual() {
  const [lit, setLit] = useState(false)
  const [sealed, setSealed] = useState(false)
  useEffect(() => {
    const a = window.setTimeout(() => setLit(true), 400)
    const b = window.setTimeout(() => setSealed(true), 1600)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center gap-5 pb-4">
        <Seal who="Você" lit={lit} delay={0} />
        <span className={cn('h-px w-12 transition-colors duration-700', lit ? 'bg-dv-gold' : 'bg-dv-line')} style={{ transitionDelay: '900ms' }} aria-hidden="true" />
        <Seal who="Outro jogador" lit={lit} delay={900} />
        <TapMark className="left-12 top-12" />
        {sealed && (
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <Stamp text="Troca selada" tone="gold" size={150} rotate={-6} animate />
          </span>
        )}
      </div>
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
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative flex gap-5">
        <span
          className="en-rays pointer-events-none absolute left-1/2 top-1/2 -ml-36 -mt-36 size-72 opacity-60"
          style={{ background: 'repeating-conic-gradient(color-mix(in oklab,var(--dv-gold) 35%,transparent) 0 6deg, transparent 6deg 18deg)', maskImage: 'radial-gradient(circle, black 20%, transparent 70%)' }}
          aria-hidden="true"
        />
        {['ampulheta', 'tesoura'].map((id, i) => (
          <div key={id} className={cn('relative w-24 [perspective:800px]', i === 0 ? '-rotate-6' : 'rotate-6')}>
            <div className={cn('relative transition-transform duration-700 [transform-style:preserve-3d]', flipped ? '' : '[transform:rotateY(180deg)]')} style={{ transitionDelay: `${i * 160}ms` }}>
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
      <span aria-hidden="true" className="en-kabum absolute top-14 font-impact text-[56px] font-bold uppercase leading-none tracking-[0.02em] text-dv-gold-bright [-webkit-text-stroke:1.5px_var(--dv-ink)] [text-shadow:4px_4px_0_var(--dv-cobalt-deep)]">
        Kabum!
      </span>
      <Caption>Sem devoluções</Caption>
    </div>
  )
}

function LostVisual() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="dv-cut relative flex h-44 w-72 items-center justify-start overflow-hidden bg-[radial-gradient(ellipse_at_30%_50%,var(--dv-ink-4),var(--dv-ink)_75%)] pl-8" style={{ '--dv-cut': '14px' } as CSSProperties}>
        <span className="pointer-events-none absolute inset-0 animate-[devo-mist_8s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_85%_40%,color-mix(in_oklab,var(--dv-amethyst)_18%,transparent),transparent_60%)]" aria-hidden="true" />
        <div className="en-drift w-20">
          <CardFace cardId="coroa" size="sm" />
        </div>
        {[
          ['right-8 top-6', 'text-[34px]'],
          ['bottom-8 right-16', 'text-[26px]'],
          ['right-24 top-10', 'text-[20px]'],
        ].map(([pos, size], i) => (
          <span key={i} className={cn('absolute font-impact text-dv-text-3 animate-dv-alert', pos, size)} style={{ animationDelay: `${i * 400}ms` }} aria-hidden="true">
            ?
          </span>
        ))}
        <Callout label="Paradeiro desconhecido" className="bottom-3 right-3" side="left" />
      </div>
      <Caption>Em qualquer lugar. Nas mãos de qualquer pessoa.</Caption>
    </div>
  )
}

function MessagesVisual() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <p className="dv-cut-diag animate-dv-rise self-start bg-dv-ink-3 px-3 py-2 font-body text-[14px] text-dv-text" style={{ '--dv-cut': '8px' } as CSSProperties}>
        Fale logo. Meu tempo vale mais que o seu.
      </p>
      <div className="relative flex flex-col gap-1.5">
        {['Quem é você, afinal?', 'Você pode me ajudar?', 'Nada. Esqueça.'].map((c, i) => (
          <span
            key={c}
            className={cn(
              'dv-cut-diag animate-dv-slide-left flex items-center gap-3 px-3 py-1.5 font-body text-[14px]',
              i === 0 ? 'bg-dv-cobalt-dim text-dv-text shadow-[inset_3px_0_0_var(--dv-cobalt)]' : 'bg-dv-ink-2 text-dv-text-2',
            )}
            style={{ animationDelay: `${200 + i * 120}ms`, '--dv-cut': '8px' } as CSSProperties}
          >
            <span className={cn('font-impact text-[14px]', i === 0 ? 'text-dv-cobalt-text' : 'text-dv-text-3')}>{toRoman(i + 1)}</span>
            {c}
          </span>
        ))}
        <TapMark className="right-8 top-1" />
      </div>
      <Caption>Cada pergunta, uma resposta</Caption>
    </div>
  )
}

const VISUALS: Record<TutorialVisual, { view: () => ReactNode; system: string }> = {
  wrist: { view: WristVisual, system: 'Pulso' },
  device: { view: DeviceVisual, system: 'Aparelho DEVO' },
  cards: { view: CardsVisual, system: 'Cartas' },
  rooms: { view: RoomsVisual, system: 'Sala de Trocas' },
  slot: { view: SlotVisual, system: 'Sala de Trocas' },
  clock: { view: ClockVisual, system: 'Sala de Trocas' },
  hidden: { view: HiddenVisual, system: 'Sala de Trocas' },
  chat: { view: ChatVisual, system: 'Sala de Trocas' },
  accept: { view: AcceptVisual, system: 'Sala de Trocas' },
  reveal: { view: RevealVisual, system: 'Sala de Trocas' },
  lost: { view: LostVisual, system: 'Sala de Trocas' },
  messages: { view: MessagesVisual, system: 'Mensagens' },
}

function StepBanner({ step }: { step: string }) {
  const match = step.match(/^(\d+)\.\s*(.*)$/)
  const num = match?.[1]
  const text = match?.[2] ?? step
  return (
    <figcaption className="animate-dv-cut-in absolute -top-6 left-3 right-3 z-10 flex items-center">
      {num && (
        <span className="relative z-10 grid h-12 w-11 -skew-x-[8deg] place-items-center bg-dv-gold font-impact text-[30px] font-bold leading-none text-dv-ink shadow-[3px_3px_0_rgba(0,0,0,0.6)]">
          <span className="skew-x-[8deg]">{num}</span>
        </span>
      )}
      <span className="-ml-1 flex min-w-0 flex-col bg-[linear-gradient(90deg,var(--dv-ink-4),var(--dv-ink-2))] py-1.5 pl-4 pr-5 shadow-[3px_3px_0_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]">
        <span className="dv-label text-[10px] text-dv-gold">Etapa</span>
        <span className="whitespace-nowrap font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-dv-text">{text}</span>
      </span>
    </figcaption>
  )
}

/** Prancheta do diagrama: grade cobalto, marcas de registro, cabeçalho "Fig." e linha de varredura. */
export function TutorialVisualPanel({ visual, step, index = 1 }: { visual: TutorialVisual; step?: string; index?: number }) {
  const { view: Visual, system } = VISUALS[visual]
  return (
    <figure className="animate-dv-pop relative lg:[zoom:1.25] xl:[zoom:1.35]">
      <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_32%,var(--dv-marble-black)_62%,var(--dv-gold)_88%,var(--dv-amethyst))]" style={{ '--dv-cut': '16px' } as CSSProperties} />
      <span
        aria-hidden="true"
        className="dv-cut absolute inset-px overflow-hidden bg-[color-mix(in_oklab,var(--dv-ink)_94%,transparent)] [background-image:linear-gradient(color-mix(in_oklab,var(--dv-amethyst)_8%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--dv-amethyst)_8%,transparent)_1px,transparent_1px)] [background-size:16px_16px]"
        style={{ '--dv-cut': '15.6px' } as CSSProperties}
      >
        <span className="en-scan absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-[color-mix(in_oklab,var(--dv-amethyst)_14%,transparent)] to-transparent" />
      </span>
      {/* marcas de registro */}
      {['left-3 top-3', 'right-3 top-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((p) => (
        <span key={p} aria-hidden="true" className={cn('absolute size-3 text-dv-gold/70', p)}>
          <span className="absolute left-1/2 top-0 h-full w-px bg-current" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
        </span>
      ))}
      {step && <StepBanner step={step} />}
      <div className={cn('relative flex flex-col items-center gap-3 px-7 pb-6', step ? 'pt-10' : 'pt-5')}>
        <div className="dv-label flex w-full items-center gap-3 text-[10px] text-dv-text-3">
          <span className="flex items-center gap-1.5 text-dv-cobalt-text">
            <GlyphSpark className="size-2.5" />
            Fig. {toRoman(index)}
          </span>
          <span className="h-px flex-1 bg-dv-line" aria-hidden="true" />
          <span>{system}</span>
        </div>
        <Visual />
      </div>
    </figure>
  )
}
