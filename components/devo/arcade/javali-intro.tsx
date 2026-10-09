'use client'

import { type CSSProperties, useState } from 'react'
import { Badge, FrameCorners, GlyphArrow, GlyphDiamond, GlyphHourglass, Kicker, TimeDigits } from '@/components/devo/kit'
import { GAMES, PATENTES } from '@/lib/devo/arcade/games'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { npcPortrait } from '@/lib/devo/npcs'
import { formatDuration, useNow } from '../hooks'
import { useDevo } from '../state/devo-store'

type Frame = 'table' | 'door' | 'point'
type Visual = 'tempo' | 'jogos' | 'tutorial' | 'agenda' | 'ranking' | 'apostas' | 'chat'

// Cenas do Javali, uma por pose (mapa de retratos em lib/devo/npcs.ts).
const FRAMES: Frame[] = ['table', 'door', 'point']

const SCRIPT: { text: string; frame: Frame; visual?: Visual }[] = [
  { text: 'Ora, ora! Um rosto novo na minha mesa. Entre, entre, querido. Bem-vindo à Sala de Jogos!', frame: 'table' },
  { text: 'Eu sou o Javali, anfitrião desta casa. Ninguém joga aqui sem antes ouvir as regras da casa. E as regras da casa sou eu.', frame: 'point' },
  { text: 'Primeiro, o mais importante: aqui ninguém aposta dinheiro. Aposta-se Tempo. O seu relógio, lá em cima, é tudo o que você tem.', frame: 'point', visual: 'tempo' },
  { text: 'Ganhe e ele cresce. Perca... bem, digamos que ele encolhe. Quando zera, a festa acaba para você. Simples, não?', frame: 'door' },
  { text: 'Na Mesa ficam os jogos. Cada um com seu adversário de carne e osso.', frame: 'table', visual: 'jogos' },
  { text: 'Inseguro? Não se acanhe. Todo jogo tem um Tutorial. Treine à vontade, que lá a casa não cobra nada.', frame: 'door', visual: 'tutorial' },
  { text: 'Na Agenda você encontra as partidas marcadas e os torneios. Inscreva-se a tempo, porque eu não espero ninguém.', frame: 'door', visual: 'agenda' },
  { text: 'Cada vitória rende pontos. Pontos sobem sua Patente e sua posição no Ranking.', frame: 'point', visual: 'ranking' },
  { text: 'Toda semana o Ranking zera. Os melhores colocados levam prêmios antes do reset. Fique de olho no relógio do Reset.', frame: 'table' },
  { text: 'Prefere assistir? Nas Apostas você aposta Tempo em quem vai vencer as partidas dos outros. Lucro sem suar a camisa.', frame: 'point', visual: 'apostas' },
  { text: 'E no Chat você conversa com os outros Records da sala. Provoque, negocie, faça amigos. Ou inimigos. Eu adoro os dois.', frame: 'door', visual: 'chat' },
  { text: 'Isso é tudo, querido. Puxe uma cadeira e lembre-se: a casa sempre agradece.', frame: 'table' },
]

const SECTIONS: { visual: Visual; label: string }[] = [
  { visual: 'jogos', label: 'Mesa' },
  { visual: 'agenda', label: 'Agenda' },
  { visual: 'ranking', label: 'Ranking' },
  { visual: 'apostas', label: 'Apostas' },
  { visual: 'chat', label: 'Chat' },
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
    playSfx('whoosh')
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
        'absolute inset-0 z-40 flex animate-dv-fade flex-col overflow-hidden bg-[radial-gradient(120%_70%_at_50%_0%,#151d3d,var(--dv-ink)_65%)] transition-opacity duration-700',
        leaving && 'opacity-0',
      )}
    >
      {/* holofote dourado sobre o anfitrião e piso xadrez da casa */}
      <span aria-hidden="true" className="javali-spot pointer-events-none absolute inset-x-0 top-0 mx-auto h-[75%] w-[30rem] max-w-full bg-[radial-gradient(ellipse_at_top,rgba(236,212,154,0.26),transparent_70%)]" />
      <span aria-hidden="true" className="dv-checker pointer-events-none absolute inset-x-[-40%] bottom-[-10%] h-[45%] opacity-40 [mask-image:linear-gradient(to_top,black,transparent)] [transform:perspective(520px)_rotateX(62deg)]" />

      <div className="relative flex shrink-0 items-center justify-between px-4 pt-2">
        <Kicker tone="gold">
          A casa recebe · {index + 1}/{SCRIPT.length}
        </Kicker>
        <button
          type="button"
          onClick={finish}
          className="dv-focus -mr-2 inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-text-3 transition-colors hover:text-dv-text"
        >
          Pular
        </button>
      </div>

      {/* o relógio do jogador fica à vista desde o primeiro passo */}
      <div className="relative flex shrink-0 justify-center px-4 pt-1">
        <TempoCue />
      </div>

      {/* palco: ocupa todo o espaço livre, mesmo enquadramento em todos os passos */}
      <div className="relative flex min-h-0 flex-1 flex-col px-4 pt-3">
        <div className="relative isolate mx-auto min-h-[220px] w-full max-w-xl flex-1" style={{ '--dv-cut': '18px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_30%,var(--dv-gold)_60%,var(--dv-gold-deep))]" />
          <div className="dv-cut absolute inset-[2px] overflow-hidden bg-black" style={{ '--dv-cut': '17px' } as CSSProperties}>
            {FRAMES.map((name) => {
              const active = name === step.frame
              const art = npcPortrait('javali', name)
              if (!art) return null
              // Cena larga num palco alto: a cena inteira (contain) sobre um fundo da própria cena, desfocado,
              // em vez de recortar só o rosto.
              return (
                <div
                  key={name}
                  aria-hidden={active ? undefined : true}
                  className={cn('absolute inset-0 transition-[opacity,transform] duration-500', active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.src} alt="" draggable={false} className="absolute inset-0 size-full scale-110 object-cover opacity-45 blur-xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={art.src}
                    alt={active ? 'Javali, anfitrião da Sala de Jogos' : ''}
                    draggable={false}
                    style={{ objectPosition: art.position }}
                    className="absolute inset-0 size-full object-contain contrast-[1.05] saturate-[0.92] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_92%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_92%,transparent)]"
                  />
                </div>
              )
            })}
            {/* luz de borda e vinheta: o mesmo tratamento do PortraitFrame */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_28%,rgba(236,212,154,0.16),transparent_70%)] mix-blend-screen" />
            <span aria-hidden="true" className="devo-grain pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-overlay" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />
            {step.visual && step.visual !== 'tempo' && (
              <div key={step.visual} className="absolute inset-x-3 top-3 flex animate-dv-pop justify-center">
                <VisualCue visual={step.visual} />
              </div>
            )}
          </div>
          <FrameCorners tone="gold" size={26} inset={4} />
          {/* placa com o nome */}
          <div className="absolute -bottom-4 left-4 flex items-end">
            <span className="relative">
              <span aria-hidden="true" className="absolute -left-2 bottom-[8%] h-[40%] w-[calc(100%+1rem)] -skew-x-[18deg] bg-dv-cobalt-deep" />
              <span className="relative font-impact text-[40px] font-bold uppercase leading-none text-white [text-shadow:0_2px_0_rgba(0,0,0,0.6)]">Javali</span>
            </span>
            <span className="dv-label mb-1 ml-3 bg-dv-ink/70 px-1 text-[10px] text-dv-gold">Anfitrião</span>
          </div>
        </div>
      </div>

      <div className="relative shrink-0 p-3 pt-7">
        <button type="button" onClick={advance} className="dv-focus group relative isolate mx-auto flex w-full max-w-xl flex-col gap-2 p-4 text-left" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--dv-gold),var(--dv-gold-deep)_45%,var(--dv-line-strong))]" />
          <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink)_90%)]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
          <span key={index} className="animate-dv-fade font-body text-[17px] leading-relaxed text-dv-text">
            {step.text}
          </span>
          <span className="flex items-center justify-between gap-3">
            <span aria-hidden="true" className="flex gap-1">
              {SCRIPT.map((_, i) => (
                <span key={i} className={cn('h-1 w-2.5 -skew-x-[30deg] transition-colors', i < index ? 'bg-dv-gold/60' : i === index ? 'bg-dv-gold-bright' : 'bg-dv-line-strong')} />
              ))}
            </span>
            <span className="flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-dv-gold transition-colors group-hover:text-dv-gold-bright">
              {last ? 'Puxar a cadeira' : 'Continuar'}
              <GlyphArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

/** Relógio do jogador (o mesmo TimeDigits da barra de status), sempre visível na apresentação. */
function TempoCue() {
  const { state } = useDevo()
  const now = useNow(1000)
  return (
    <div className="relative isolate flex items-center gap-3 px-4 py-2" style={{ '--dv-cut': '10px' } as CSSProperties}>
      <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-dv-cobalt/80" />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,#14287a,var(--dv-ink))]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
      <GlyphHourglass className="size-5 text-dv-cobalt-text" />
      <div className="leading-tight">
        <p className="dv-label text-[10px] text-dv-text-3">Seu Tempo</p>
        <TimeDigits value={formatDuration(Math.max(0, state.timerEndsAt - now))} size="sm" tone="cobalt" label="Seu Tempo" />
      </div>
    </div>
  )
}

function VisualCue({ visual }: { visual: Visual }) {
  if (visual === 'jogos') {
    return (
      <ul className="flex max-w-lg flex-wrap justify-center gap-1.5" aria-label="Jogos">
        {Object.values(GAMES).map((g) => (
          <li key={g.name}>
            <Badge tone="gold">{g.name}</Badge>
          </li>
        ))}
      </ul>
    )
  }
  if (visual === 'tutorial') {
    return (
      <Badge tone="cobalt" dot>
        Tutorial · treino grátis
      </Badge>
    )
  }
  if (visual === 'ranking') {
    return (
      <ol className="flex max-w-lg flex-wrap justify-center gap-x-1.5 gap-y-1" aria-label="Patentes">
        {PATENTES.map((p, i) => (
          <li key={p.name} className={cn('flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em]', i === PATENTES.length - 1 ? 'text-dv-gold-bright' : 'text-dv-text-2')}>
            {p.name}
            {i < PATENTES.length - 1 && <GlyphDiamond filled className="size-1.5 text-dv-text-3" />}
          </li>
        ))}
      </ol>
    )
  }
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {SECTIONS.map((t) => (
        <Badge key={t.visual} tone={t.visual === visual ? 'cobalt' : 'neutral'}>
          {t.label}
        </Badge>
      ))}
    </div>
  )
}
