'use client'

import { useEffect, useRef, useState } from 'react'
import type { CenarioId, DestinoDemo, Fx, HoloFase } from '@/lib/devo/dialogo/formato'
import { npcPortrait } from '@/lib/devo/npcs'
import type { Destino } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { NpcAnchor, useFalaAncora } from '../kit/npc-anchor'
import { CasaNoite } from './casa-noite'
import { ChamadaMelissa, HologramaMelissa } from './holograma'
import { LinhaDestino, PlacaDestino } from './linha-destino'

/**
 * PALCO das cenas: cenário (CSS puro, leve no celular), retrato do NPC em cena (ou silhueta), efeitos
 * momentâneos (luz pisca, porta, campainha…), linha do destino e holograma. Cenário novo: um `case` em
 * `Cenario` (e o id em `CenarioId`, lib/devo/dialogo/formato.ts).
 */
export type PalcoEstado = {
  cenario: CenarioId
  npc: string | null
  /** Id do retrato (lib/devo/npcs.ts) do NPC em cena. */
  retrato: string | null
  expressao?: string
  destino: DestinoDemo
  holo: HoloFase
  /** Porta da casa aberta (persiste entre passos; anima quando muda). */
  porta?: boolean
}

export function Palco({
  estado,
  fx,
  fxKey,
  destinoReal,
  falando,
  fala = null,
}: {
  estado: PalcoEstado
  fx?: Fx
  fxKey: number
  destinoReal?: Destino
  falando: boolean
  /** Coluna da caixa de fala: retrato e holograma se ancoram no topo dela (kit/npc-anchor). */
  fala?: HTMLElement | null
}) {
  const shake = fx === 'campainha' || fx === 'tremor'
  const marca = useRef<HTMLDivElement>(null)
  const ancora = useFalaAncora(fala, marca, 64)
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden', shake && 'pl-shake')} key={shake ? `s${fxKey}` : 'palco'}>
      <div ref={marca} className="pointer-events-none absolute inset-0" />
      <Cenario id={estado.cenario} portaAberta={!!estado.porta} anima={fx === 'porta-abre' || fx === 'porta-fecha'} fxKey={fxKey} luzFalha={fx === 'luz-pisca'} />

      {estado.cenario === 'holograma' && estado.holo === 'chamada' && (
        <div className="absolute inset-x-0 top-[20%] z-10 flex justify-center">
          <ChamadaMelissa />
        </div>
      )}

      {estado.cenario === 'holograma' && estado.holo && estado.holo !== 'chamada' && (
        <div className="absolute inset-x-0 bottom-[30%] top-[9%] mx-auto max-w-md" style={ancora ? { bottom: ancora.bottom - 6 } : undefined}>
          <HologramaMelissa fase={estado.holo} expressao={estado.expressao} />
        </div>
      )}

      {estado.npc && estado.cenario !== 'holograma' && <Retrato key={estado.npc} npc={estado.retrato ?? estado.npc} expressao={estado.expressao} falando={falando} fala={fala} ancora={ancora} />}

      {estado.destino && (
        <div className="absolute inset-x-0 top-[16%] z-10 px-4">
          <PlacaDestino>
            <LinhaDestino key={estado.destino} demo={estado.destino === 'seu' ? undefined : estado.destino} destino={estado.destino === 'seu' ? destinoReal : undefined} />
          </PlacaDestino>
        </div>
      )}

      {fx === 'luz-pisca' && <span key={`lp${fxKey}`} className="pl-flicker absolute inset-0 z-20 bg-black" />}
      {fx === 'escurece' && <span key={`es${fxKey}`} className="animate-dv-fade absolute inset-0 z-[5] bg-black/60" />}
      {fx === 'revela' && <span key={`rv${fxKey}`} className="pl-flash absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_42%,rgba(244,239,228,0.5),rgba(138,124,200,0.14)_32%,transparent_62%)]" />}
      <style>{PALCO_CSS}</style>
    </div>
  )
}

function Cenario({ id, portaAberta, anima, fxKey, luzFalha }: { id: CenarioId; portaAberta: boolean; anima: boolean; fxKey: number; luzFalha: boolean }) {
  switch (id) {
    case 'casa-noite':
      return <CasaNoite portaAberta={portaAberta} anima={anima} fxKey={fxKey} luzFalha={luzFalha} />
    case 'holograma':
      return (
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_70%,#1a1824,#0c0c0e_60%,#050506)]">
          <span className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,transparent,rgba(12,12,14,0.95))]" />
          <span className="absolute inset-x-0 bottom-[30%] h-px bg-[linear-gradient(90deg,transparent,rgba(186,176,159,0.25),transparent)]" />
        </div>
      )
    case 'nevoa':
      return (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1b1b1e,#29282b_55%,#141416)]">
          <span className="pl-fog absolute -inset-x-1/2 top-[20%] h-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(236,229,216,0.12),transparent_70%)]" />
          <span className="pl-fog absolute -inset-x-1/2 top-[45%] h-[40%] bg-[radial-gradient(50%_50%_at_40%_50%,rgba(236,229,216,0.1),transparent_70%)] [animation-delay:-9s]" />
        </div>
      )
    case 'salao':
      return (
        <div className="absolute inset-0 bg-[#0c0c0e]">
          <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#2a0d12_0_22px,#1a070b_22px_44px)] opacity-80 [mask-image:linear-gradient(180deg,#000,transparent_75%)]" />
          <span className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,#6b6357,#151517)]" />
        </div>
      )
    case 'torres':
      return (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#121216,#1f1f22_60%,#0c0c0e)]">
          <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[55%] w-full" fill="#0a0a0c">
            <path d="M40 300V150l14-30 14 30v150ZM160 300V80l22-50 22 50v220ZM300 300V170l12-24 12 24v130Z" />
          </svg>
        </div>
      )
    case 'sobreposto':
      return <div className="animate-dv-fade absolute inset-0 bg-[rgba(8,8,10,0.78)] backdrop-blur-[2px]" />
    default:
      return <div className="absolute inset-0 bg-black" />
  }
}

/** Retrato do NPC em cena; sem arte no mapa de elenco → silhueta (ex.: Corvo, ou Galo antes do Elenco). */
function Retrato({
  npc,
  expressao,
  falando,
  fala,
  ancora,
}: {
  npc: string
  expressao?: string
  falando: boolean
  fala: HTMLElement | null
  ancora: { bottom: number; espaco: number } | null
}) {
  const art = npcPortrait(npc, expressao)
  const [erro, setErro] = useState(false)
  useEffect(() => setErro(false), [art?.src])
  // elenco: busto ANCORADO ao topo da caixa de fala (base atrás da caixa, sem vão, em qualquer altura)
  if (art && !erro && !art.src.endsWith('.svg'))
    return (
      <NpcAnchor
        npc={npc}
        pose={expressao}
        fala={fala}
        cabeca="min(16dvh, 150px)"
        reserva={64}
        outerClassName="z-[4]"
        className={cn('pl-npc-in drop-shadow-[0_18px_30px_rgba(0,0,0,0.7)] transition-[filter] duration-300', !falando && 'brightness-[0.82]')}
      />
    )
  return (
    <div
      className={cn('pl-npc-in absolute inset-x-0 bottom-[22%] top-[10%] z-[4] mx-auto max-w-md transition-[filter] duration-300', !falando && 'brightness-[0.82]')}
      style={ancora ? { bottom: ancora.bottom - 16 } : undefined}
    >
      {art && !erro ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={art.src}
          src={art.src}
          alt=""
          onError={() => setErro(true)}
          className="animate-dv-fade size-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.7)]"
          style={{ WebkitMaskImage: 'linear-gradient(0deg, transparent 0%, #000 16%)', maskImage: 'linear-gradient(0deg, transparent 0%, #000 16%)' }}
        />
      ) : (
        <Silhueta npc={npc} />
      )}
    </div>
  )
}

/** Silhueta de reserva: busto de terno com contraluz de aço (Galo ganha o reflexo acobreado do cabelo ruivo). */
function Silhueta({ npc }: { npc: string }) {
  const cobre = npc === 'galo'
  const capuz = npc === 'corvo'
  return (
    <svg viewBox="0 0 300 400" className="size-full" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`sil-${npc}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1b20" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      {capuz ? (
        <path d="M150 40c-48 0-76 44-80 96-3 40 6 66 6 66-40 16-66 52-74 198h296c-8-146-34-182-74-198 0 0 9-26 6-66-4-52-32-96-80-96Z" fill={`url(#sil-${npc})`} stroke="#6b6357" strokeOpacity="0.6" />
      ) : (
        <>
          <path d="M106 236c-50 14-84 40-96 164h280c-12-124-46-150-96-164l-44 52Z" fill={`url(#sil-${npc})`} stroke="#6b6357" strokeOpacity="0.6" />
          <path d="M150 288 128 236h44Z" fill="#26252a" />
          <path d="M141 242h18l-4 30h-10Z" fill={cobre ? '#5a2a20' : '#2c2b30'} />
          <ellipse cx="150" cy="168" rx="50" ry="62" fill={`url(#sil-${npc})`} stroke="#6b6357" strokeOpacity="0.6" />
          <path d="M126 222h48v24h-48Z" fill="#141317" />
          {cobre && <path d="M98 160c-2-50 26-82 58-82 34 0 58 26 52 70-10-26-30-40-56-40-24 0-42 18-54 52Z" fill="#7a3a26" opacity="0.85" />}
          {cobre && <path d="M104 132c18-30 66-44 98-8" stroke="#c4704a" strokeOpacity="0.55" strokeWidth="2" fill="none" />}
        </>
      )}
      <path d="M40 400c10-110 40-140 80-156" stroke="#bab09f" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

const PALCO_CSS = `
.pl-shake{animation:pl-shake .45s cubic-bezier(.36,.07,.19,.97) both}
.pl-flicker{animation:pl-flicker 1.1s steps(1) both;pointer-events:none}
.pl-flash{animation:pl-flash 1.2s ease-out both}
.pl-door-open{animation:pl-door 1.2s cubic-bezier(.16,1,.3,1) both}
.pl-door-close{animation:pl-door 1s cubic-bezier(.6,0,.9,.4) reverse both}
.pl-door-light{animation:pl-door-light 1.2s ease-out both}
.pl-npc-in{animation:pl-npc .7s cubic-bezier(.16,1,.3,1) both}
.pl-fog{animation:pl-fog 22s linear infinite alternate}
@keyframes pl-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-3px)}40%,60%{transform:translateX(3px)}}
@keyframes pl-flicker{0%{opacity:0}12%{opacity:1}24%{opacity:.15}36%{opacity:1}62%{opacity:.4}74%{opacity:0}100%{opacity:0}}
@keyframes pl-flash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
@keyframes pl-door{0%{transform:perspective(500px) rotateY(0)}100%{transform:perspective(500px) rotateY(-72deg)}}
@keyframes pl-door-light{0%{opacity:0}100%{opacity:1}}
@keyframes pl-npc{0%{opacity:0;transform:translateY(18px)}100%{opacity:1;transform:none}}
@keyframes pl-fog{0%{transform:translateX(-8%)}100%{transform:translateX(8%)}}
@media (prefers-reduced-motion: reduce){.pl-shake,.pl-flicker,.pl-flash,.pl-npc-in,.pl-fog,.pl-door-open{animation-duration:.01s}}
`
