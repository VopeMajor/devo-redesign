'use client'

import type { CSSProperties } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { TorreEstado } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { RomanDial, toRoman } from '../kit'
import { ALTURA_ARTE, LARGURA_ARTE, MAPA_H, MAPA_W, Poeira, TorreArte, TorresDefs } from './arte'
import { bordaIlha, Cerca, CidadeAoLonge, Feixe, Ilha, MolduraFrente, Portao, Poste } from './mapa-cena'
import { Cartela, ChaveOrnamental, CristalEssencia } from './ornamentos'
import './torres.css'

/**
 * Mapa das Torres: composição cinematográfica em camadas — céu de nuvens ao luar (textura), mostrador
 * romano gigante no céu, cidade de agulhas no horizonte, névoa que corre, feixe de luar, ilha de pedra
 * suspensa com piso de mármore, cerca de ferro com cordões de luz, postes, a torre principal ao fundo e as
 * secundárias à frente, portão e moldura de ferro em primeiro plano. Cada torre é um botão (nome acessível =
 * nome da torre) com cartela ornamental de progresso.
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
  const ordem = [...torres].sort((a, b) => a.mapa.y - b.mapa.y)
  const pos = (t: TorreEstado) => ({ x: (t.mapa.x / 100) * MAPA_W, y: (t.mapa.y / 100) * MAPA_H })
  const caminho = torres.map(pos)
  return (
    <div className={cn('relative mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]', !largura && 'w-full max-w-[460px]')} style={{ aspectRatio: `${MAPA_W} / ${MAPA_H}`, width: largura }}>
      {/* mostrador gigante no céu (o tempo julga até as torres) */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[1%] w-[96%] -translate-x-1/2 opacity-[0.16] [mask-image:radial-gradient(closest-side,#000_60%,transparent)]">
        <RomanDial tone="silver" />
      </div>
      <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="absolute inset-0 size-full">
        <TorresDefs />
        <Feixe />
        <CidadeAoLonge />
        <image href="/images/torres/nevoa.webp" x={-80} y={300} width={560} height={110} opacity={0.5} className="tw-drift" preserveAspectRatio="none" />
        <Ilha caminhos={caminho} />
        <Cerca parte="tras" />
        {caminho.map((p, i) => {
          const g = bordaIlha(90, 0.93)
          const t = 0.55
          return <Poste key={i} x={g.x + (p.x - g.x) * t + (p.x < g.x ? -12 : 12)} y={g.y + (p.y - g.y) * t + 6} s={0.9} />
        })}
        {ordem.map((t) => {
          const p = pos(t)
          return (
            <g key={t.id} transform={`translate(${p.x} ${p.y}) scale(${t.mapa.escala})`}>
              <ellipse cx={0} cy={2} rx={LARGURA_ARTE[t.arte] * 0.6} ry={9} fill="#000" opacity={0.55} filter="url(#tw-blur-s)" />
              <TorreArte arte={t.arte} feitos={t.concluidos} total={t.andares.length} destaque={t.tipo === 'principal'} />
            </g>
          )
        })}
        <Cerca parte="frente" />
        <Portao />
        <image href="/images/torres/nevoa.webp" x={-120} y={MAPA_H - 120} width={640} height={130} opacity={0.65} className="tw-drift-lento" preserveAspectRatio="none" />
        <Poeira />
        <MolduraFrente />
        <radialGradient id="tw-vinheta" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.65" />
        </radialGradient>
        <rect width={MAPA_W} height={MAPA_H} fill="url(#tw-vinheta)" />
      </svg>

      {ordem.map((t) => {
        const w = (LARGURA_ARTE[t.arte] * t.mapa.escala) / MAPA_W
        const h = (ALTURA_ARTE[t.arte] * t.mapa.escala) / MAPA_H
        const total = t.andares.length
        const principal = t.tipo === 'principal'
        // secundárias do fundo levam a cartela acima do telhado (no céu); as da frente e a principal, abaixo da base
        const acima = !principal && t.mapa.y < 80
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
              <span aria-hidden="true" className="absolute inset-x-[5%] bottom-0 h-1/2 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(194,185,236,0.28),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />
            </button>
            {/* cartela de progresso */}
            <div
              aria-hidden="true"
              className={cn('pointer-events-none absolute -translate-x-1/2', acima && '-translate-y-full')}
              style={{ left: `${Math.min(84, Math.max(16, t.mapa.x))}%`, top: acima ? `${t.mapa.y - h * 100 - 0.6}%` : `${t.mapa.y + 1.4}%` }}
            >
              <Cartela h={principal ? 46 : 40} destaque={principal}>
                <span className={cn('whitespace-nowrap font-display font-semibold uppercase leading-none tracking-[0.1em] text-dv-text', principal ? 'text-[13px]' : 'text-[11.5px]')}>
                  {t.nome.replace(/^\[PROVISÓRIO\]\s*/, '').replace(/^Torre d[oa]s? /, '')}
                </span>
                <span className="dv-tabular mt-1 flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-dv-text-3">
                  {principal ? 'Campanha' : 'Secundária'}
                  <span className={principal ? 'text-dv-amethyst-text' : 'text-dv-gold'}>
                    {t.concluidos ? toRoman(t.concluidos) : '0'}/{toRoman(total)}
                  </span>
                </span>
              </Cartela>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Fila de recursos (essências e chaves) com quantidade, em medalhões. */
export function Recursos({ torres, className }: { torres: TorreEstado[]; className?: string }) {
  const essencias = torres.map((t) => t.essencia)
  const chaves = torres.flatMap((t) => (t.chave ? [t.chave] : []))
  return (
    <ul aria-label="Seus recursos das torres" className={cn('flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]', className)}>
      {essencias.map((e) => (
        <RecursoChip key={e.item} nome={e.nome} curto={e.nome.replace(/^Essência (de Afinidade )?d[oa] /, '').replace(/\s*\(provisória\)/, '')} quantidade={e.quantidade} tipo="essencia" />
      ))}
      {chaves.map((c) => (
        <RecursoChip key={c.item} nome={c.nome} curto={c.nome.replace(/^Chave d[oa] /, '')} quantidade={c.quantidade} tipo="chave" />
      ))}
    </ul>
  )
}

/** Medalhão de recurso: o cristal ou a chave desenhados, nome curto e quantidade. */
export function RecursoChip({ nome, curto, quantidade, tipo, className }: { nome: string; curto: string; quantidade: number; tipo: 'essencia' | 'chave'; className?: string }) {
  return (
    <li className={cn('relative isolate flex h-10 shrink-0 items-center gap-1.5 pl-1 pr-3', !quantidade && 'opacity-70', className)} style={{ '--dv-cut': '8px' } as CSSProperties} title={nome}>
      <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(100deg,#ece5d8,#6b6357_40%,#bab09f_75%,#5a4f8f)] opacity-70" />
      <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,rgba(31,31,34,0.96),rgba(12,12,14,0.96))]" style={{ '--dv-cut': '7.6px' } as CSSProperties} />
      <span aria-hidden="true" className="grid h-9 w-7 place-items-center">
        {tipo === 'essencia' ? <CristalEssencia className="h-8 w-auto" brilho={quantidade > 0} /> : <ChaveOrnamental className="w-8 -rotate-45" />}
      </span>
      <span className="sr-only">{nome}:</span>
      <span aria-hidden="true" className="max-w-[86px] truncate font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-dv-text-2">
        {curto}
      </span>
      <span className={cn('dv-tabular font-mono text-[14px]', quantidade ? 'text-dv-text' : 'text-dv-text-3')}>×{quantidade}</span>
    </li>
  )
}
