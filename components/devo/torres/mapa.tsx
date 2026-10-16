'use client'

import type { CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { TorreEstado } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { toRoman } from '../kit'
import { ALTURA_ARTE, CeuNoturno, LARGURA_ARTE, MAPA_H, MAPA_W, Poeira, Praca, TorreArte, TorresDefs } from './arte'
import { ChaveIcone, Essencia } from './cena'
import './torres.css'

/**
 * Mapa das Torres: praça de mármore suspensa na noite, a torre principal ao fundo e as secundárias à frente.
 * Cada torre é um botão (nome acessível = nome da torre) com plaqueta de progresso. A ilustração tem
 * proporção fixa; os botões e plaquetas são posicionados em % dela.
 */
export function MapaTorres({
  torres,
  onAbrir,
  inerte = false,
  largura,
}: {
  torres: TorreEstado[]
  /** Abre a torre; `origem` = retângulo do botão da torre na tela (a transição sai dali). */
  onAbrir?: (id: string, origem: DOMRect) => void
  inerte?: boolean
  /** Largura em px (o pai encaixa o mapa na altura disponível). Sem ela, ocupa a largura. */
  largura?: number
}) {
  // desenha de trás para a frente (menor y primeiro)
  const ordem = [...torres].sort((a, b) => a.mapa.y - b.mapa.y)
  return (
    <div className={cn('relative mx-auto', !largura && 'w-full max-w-[460px]')} style={{ aspectRatio: `${MAPA_W} / ${MAPA_H}`, width: largura }}>
      <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="absolute inset-0 size-full">
        <TorresDefs />
        <CeuNoturno />
        <Praca caminhos={torres.map((t) => ({ x: (t.mapa.x / 100) * MAPA_W, y: (t.mapa.y / 100) * MAPA_H }))} />
        {ordem.map((t) => (
          <g key={t.id} transform={`translate(${(t.mapa.x / 100) * MAPA_W} ${(t.mapa.y / 100) * MAPA_H}) scale(${t.mapa.escala})`}>
            <TorreArte arte={t.arte} feitos={t.concluidos} total={t.andares.length} destaque={t.tipo === 'principal'} />
          </g>
        ))}
        <Poeira />
        {/* bruma da frente e vinheta */}
        <rect y={MAPA_H - 90} width={MAPA_W} height={90} fill="url(#tw-fog-front)" />
        <linearGradient id="tw-fog-front" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0c0c0e" stopOpacity="0" />
          <stop offset="1" stopColor="#0c0c0e" stopOpacity="0.95" />
        </linearGradient>
      </svg>

      {ordem.map((t) => {
        const w = (LARGURA_ARTE[t.arte] * t.mapa.escala) / MAPA_W
        const h = (ALTURA_ARTE[t.arte] * t.mapa.escala) / MAPA_H
        const total = t.andares.length
        const principal = t.tipo === 'principal'
        return (
          <div key={t.id}>
            <button
              type="button"
              disabled={inerte}
              aria-label={t.nome}
              onClick={(e) => {
                playSfx('open')
                onAbrir?.(t.id, e.currentTarget.getBoundingClientRect())
              }}
              className="dv-focus group absolute"
              style={{ left: `${t.mapa.x - (w * 100) / 2}%`, top: `${t.mapa.y - h * 100}%`, width: `${w * 100}%`, height: `${h * 100 + 2}%` }}
            >
              <span aria-hidden="true" className="absolute inset-x-[10%] bottom-0 h-1/3 bg-[radial-gradient(50%_50%_at_50%_100%,rgba(236,229,216,0.18),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />
            </button>
            {/* plaqueta */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${t.mapa.x}%`, top: `${t.mapa.y + 1.2}%` }}
            >
              <span className="relative isolate flex flex-col items-center px-3 pb-1.5 pt-1" style={{ '--dv-cut': '7px' } as CSSProperties}>
                <span className={cn('dv-cut-diag absolute inset-0 -z-10', principal ? 'bg-[linear-gradient(135deg,#ece5d8,#6b6357_40%,#bab09f_70%,#8a7cc8)]' : 'bg-[linear-gradient(135deg,rgba(236,229,216,0.7),rgba(95,88,77,0.8))]')} />
                <span className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,#1f1f22,#0c0c0e)]" style={{ '--dv-cut': '6.6px' } as CSSProperties} />
                <span className={cn('whitespace-nowrap font-display font-semibold uppercase tracking-[0.1em] text-dv-text', principal ? 'text-[13px]' : 'text-[11.5px]')}>{t.nome.replace(/^Torre d[oa]s? /, '')}</span>
                <span className="dv-tabular mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-3">
                  {principal ? 'Campanha' : 'Secundária'}
                  <span className="text-dv-gold">
                    {t.concluidos ? toRoman(t.concluidos) : '0'}/{toRoman(total)}
                  </span>
                </span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Fila de recursos (essências e chaves) com quantidade. */
export function Recursos({ torres, className }: { torres: TorreEstado[]; className?: string }) {
  const essencias = torres.map((t) => t.essencia)
  const chaves = torres.flatMap((t) => (t.chave ? [t.chave] : []))
  return (
    <ul aria-label="Seus recursos das torres" className={cn('flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]', className)}>
      {essencias.map((e) => (
        <RecursoChip key={e.item} nome={e.nome} curto={e.nome.replace(/^Essência de Afinidade d[oa] /, '')} quantidade={e.quantidade} tipo="essencia" />
      ))}
      {chaves.map((c) => (
        <RecursoChip key={c.item} nome={c.nome} curto={c.nome.replace(/^Chave d[oa] /, '')} quantidade={c.quantidade} tipo="chave" />
      ))}
    </ul>
  )
}

export function RecursoChip({ nome, curto, quantidade, tipo, className }: { nome: string; curto: string; quantidade: number; tipo: 'essencia' | 'chave'; className?: string }) {
  return (
    <li className={cn('relative isolate flex h-9 shrink-0 items-center gap-1.5 pl-1.5 pr-2.5', className)} style={{ '--dv-cut': '7px' } as CSSProperties} title={nome}>
      <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(206,201,192,0.5),rgba(186,176,159,0.2))]" />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,#1f1f22,#111113)]" style={{ '--dv-cut': '6.6px' } as CSSProperties} />
      {tipo === 'essencia' ? <Essencia className="size-5" /> : <ChaveIcone className="size-5" />}
      <span className="sr-only">{nome}:</span>
      <span aria-hidden="true" className="max-w-[86px] truncate font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-dv-text-2">
        {curto}
      </span>
      <span className={cn('dv-tabular font-mono text-[13px]', quantidade ? 'text-dv-text' : 'text-dv-text-3')}>×{quantidade}</span>
    </li>
  )
}
