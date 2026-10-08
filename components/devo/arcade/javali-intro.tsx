'use client'

import { Coins, Crown, Dices, GraduationCap, Hourglass, Radio, Timer, Trophy } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { GAMES, PATENTES } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { useDevo } from '../state/devo-store'

type Frame = 'table' | 'door' | 'point'
type Visual = 'tempo' | 'jogos' | 'tutorial' | 'agenda' | 'ranking' | 'apostas' | 'chat'

const FRAME_ART: Record<Frame, { src: string; position: string }> = {
  table: { src: '/images/npc/javali-scene-table.webp', position: '50% 40%' },
  door: { src: '/images/npc/javali-scene-door.webp', position: '60% 35%' },
  point: { src: '/images/npc/javali-scene-point.webp', position: '35% 35%' },
}

const FRAMES = Object.keys(FRAME_ART) as Frame[]

const SCRIPT: { text: string; frame: Frame; visual?: Visual }[] = [
  { text: 'Ora, ora! Um rosto novo na minha mesa. Entre, entre, querido. Bem-vindo à Sala de Jogos!', frame: 'table' },
  { text: 'Eu sou o Javali, anfitrião desta casa. Ninguém joga aqui sem antes ouvir as regras da casa. E as regras da casa sou eu.', frame: 'point' },
  { text: 'Primeiro, o mais importante: aqui ninguém aposta dinheiro. Aposta-se Tempo. O seu relógio, lá em cima, é tudo o que você tem.', frame: 'point', visual: 'tempo' },
  { text: 'Ganhe e ele cresce. Perca... bem, digamos que ele encolhe. Quando zera, a festa acaba para você. Simples, não?', frame: 'door' },
  { text: 'No Lobby ficam as mesas. Cada uma com seu jogo, cada jogo com seu adversário de carne e osso.', frame: 'table', visual: 'jogos' },
  { text: 'Inseguro? Não se acanhe. Toda mesa tem um Tutorial. Treine à vontade, que lá a casa não cobra nada.', frame: 'door', visual: 'tutorial' },
  { text: 'Na Agenda você encontra as partidas marcadas e os torneios. Inscreva-se a tempo, porque eu não espero ninguém.', frame: 'door' },
  { text: 'Cada vitória rende pontos de Score. Pontos sobem sua Patente e sua posição no Ranking.', frame: 'point', visual: 'ranking' },
  { text: 'Toda semana o Ranking zera. Os melhores colocados levam prêmios antes do reset. Fique de olho no relógio do Reset.', frame: 'table' },
  { text: 'Prefere assistir? Nas Apostas você aposta Tempo em quem vai vencer as partidas dos outros. Lucro sem suar a camisa.', frame: 'point' },
  { text: 'E no Chat você conversa com os outros Records da sala. Provoque, negocie, faça amigos. Ou inimigos. Eu adoro os dois.', frame: 'door', visual: 'chat' },
  { text: 'Isso é tudo, querido. Puxe uma cadeira e lembre-se: a casa sempre agradece.', frame: 'table' },
]

const TABS: { visual: Visual; label: string; icon: typeof Dices }[] = [
  { visual: 'jogos', label: 'Lobby', icon: Dices },
  { visual: 'agenda', label: 'Agenda', icon: Timer },
  { visual: 'ranking', label: 'Ranking', icon: Trophy },
  { visual: 'apostas', label: 'Apostas', icon: Coins },
  { visual: 'chat', label: 'Chat', icon: Radio },
]

export function JavaliIntro() {
  const { dispatch } = useDevo()
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const step = SCRIPT[index]
  const last = index === SCRIPT.length - 1

  const finish = () => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(() => dispatch({ type: 'JAVALI_MET' }), 700)
  }

  const advance = () => {
    if (leaving) return
    playSfx('click')
    if (last) finish()
    else setIndex(index + 1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Javali apresenta a Sala de Jogos"
      className={cn(
        'absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#08060d]/95 backdrop-blur-sm transition-opacity duration-700',
        leaving && 'opacity-0',
      )}
    >
      <span aria-hidden="true" className="javali-spot pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70%] w-[28rem] max-w-full bg-[radial-gradient(ellipse_at_top,rgba(201,168,240,0.32),transparent_70%)]" />

      <button
        type="button"
        onClick={finish}
        className="absolute right-3 top-3 z-10 font-sans text-[10px] uppercase tracking-[0.3em] text-foreground/40 transition-colors hover:text-foreground"
      >
        Pular
      </button>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-end gap-4 px-4 pt-10">
        {step.visual && (
          <div key={step.visual} className="animate-pop">
            <Visual visual={step.visual} />
          </div>
        )}
        <div className="relative mb-2 aspect-[12/5] max-h-[42vh] w-full max-w-2xl shrink-0 overflow-hidden border-y-[10px] border-black bg-black shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
          {FRAMES.map((name) => {
            const art = FRAME_ART[name]
            const active = name === step.frame
            return (
              <Image
                key={name}
                src={art.src}
                alt={active ? 'Javali' : ''}
                aria-hidden={active ? undefined : true}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 672px"
                style={{ objectPosition: art.position }}
                className={cn(
                  'object-cover sepia-[0.15] transition-opacity duration-300',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
            )
          })}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.65)]" />
        </div>
      </div>
      <span aria-hidden="true" className="relative h-4 shrink-0 border-t-2 border-[#c9a8f0]/50 bg-[linear-gradient(to_bottom,#3a2150,#1a0f24)]" />

      <div className="relative shrink-0 p-3 md:p-4">
        <button
          type="button"
          onClick={advance}
          className="group mx-auto flex w-full max-w-2xl flex-col gap-1.5 border border-[#a07ad8]/50 bg-[#160f1f] p-4 text-left focus-visible:outline-2 focus-visible:outline-[#c9a8f0]"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#c9a8f0]">Javali</span>
          <span key={index} className="animate-pop text-[15px] leading-relaxed text-foreground/90 md:text-base">
            {step.text}
          </span>
          <span className="flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.25em] text-foreground/40">
            <span className="tabular-nums">
              {index + 1}/{SCRIPT.length}
            </span>
            <span className="transition-colors group-hover:text-[#c9a8f0]">{last ? 'Puxar a cadeira' : 'Continuar'} ›</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function Pill({ icon: Icon, label, active }: { icon: typeof Dices; label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 border px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]',
        active ? 'border-[#6f8cff] bg-[#6f8cff]/10 text-[#a9bcff]' : 'border-foreground/15 text-foreground/40',
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

function Visual({ visual }: { visual: Visual }) {
  if (visual === 'tempo') {
    return (
      <div className="flex items-center gap-3 border border-[#6f8cff]/50 bg-[#6f8cff]/10 px-4 py-2 shadow-[0_0_24px_rgba(111,140,255,0.25)]">
        <Hourglass className="size-5 text-[#6f8cff]" aria-hidden="true" />
        <div className="leading-tight">
          <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/50">Seu Tempo</p>
          <p className="font-mono text-xl tabular-nums text-[#a9bcff]">71:59:42</p>
        </div>
      </div>
    )
  }
  if (visual === 'jogos') {
    return (
      <ul className="flex max-w-lg flex-wrap justify-center gap-2" aria-label="Jogos">
        {Object.values(GAMES).map((g) => (
          <li key={g.name} className="border border-[#c9a8f0]/40 bg-black/40 px-3 py-1.5 font-serif text-sm tracking-wide text-foreground/85">
            {g.name}
          </li>
        ))}
      </ul>
    )
  }
  if (visual === 'tutorial') {
    return <Pill icon={GraduationCap} label="Tutorial" active />
  }
  if (visual === 'ranking') {
    return (
      <div className="flex flex-col items-center gap-2">
        <Pill icon={Trophy} label="Ranking" active />
        <ol className="flex max-w-lg flex-wrap justify-center gap-1.5" aria-label="Patentes">
          {PATENTES.map((p, i) => (
            <li key={p.name} className="flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-foreground/60">
              {i === PATENTES.length - 1 && <Crown className="size-3 text-[#d8b25a]" aria-hidden="true" />}
              {p.name}
              {i < PATENTES.length - 1 && <span aria-hidden="true" className="text-foreground/25">›</span>}
            </li>
          ))}
        </ol>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {TABS.map((t) => (
        <Pill key={t.visual} icon={t.icon} label={t.label} active={t.visual === visual} />
      ))}
    </div>
  )
}
