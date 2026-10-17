'use client'

import { useId, type CSSProperties, type ReactNode } from 'react'
import type { ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'

/**
 * Ornamentos desenhados para o Poço (SVG vetorial, sem filtros em tempo real): pontas de filigrana das faixas,
 * os três botões de invocação (placas góticas e o medalhão dentado do centro) e a moldura de resultado, cuja
 * ornamentação cresce com a raridade (comum: filete; incomum: volutas; raro: joias de ametista e brasão;
 * épico+: espinhos, segunda moldura e coroa de agulhas).
 */

/* ── gradientes compartilhados (ids únicos por instância) ─────────────────────────────── */
function Metal({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f1e7" />
        <stop offset="0.3" stopColor="#cfc5b3" />
        <stop offset="0.6" stopColor="#8d8371" />
        <stop offset="1" stopColor="#3a352e" />
      </linearGradient>
      <linearGradient id={`${id}-h`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4c463d" />
        <stop offset="0.3" stopColor="#f4eee3" />
        <stop offset="0.6" stopColor="#a59a87" />
        <stop offset="1" stopColor="#2a2621" />
      </linearGradient>
      <radialGradient id={`${id}-j`} cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#f1eff4" />
        <stop offset="0.25" stopColor="#b6a9ee" />
        <stop offset="0.6" stopColor="#4e3f92" />
        <stop offset="1" stopColor="#15102c" />
      </radialGradient>
    </>
  )
}

/** Voluta (espiral de filigrana) como caminho SVG. */
function voluta(x: number, y: number, r: number, dir = 1, voltas = 1.5, ang0 = 0) {
  let d = ''
  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    const a = ((ang0 + dir * t * voltas * 360) * Math.PI) / 180
    const rr = r * (1 - t * 0.8)
    d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(2)} ${(y + Math.sin(a) * rr).toFixed(2)}`
  }
  return d
}
const star4 = (cx: number, cy: number, r: number, w = 0.2) =>
  `M${cx} ${cy - r}L${cx + r * w} ${cy - r * w}L${cx + r} ${cy}L${cx + r * w} ${cy + r * w}L${cx} ${cy + r}L${cx - r * w} ${cy + r * w}L${cx - r} ${cy}L${cx - r * w} ${cy - r * w}Z`

/* ── Ponta de faixa (filigrana) ───────────────────────────────────────────────────────── */

/** Ponta ornamental de uma faixa: lança, duas volutas e um losango. `lado` espelha. */
export function PontaFiligrana({ lado = 'esq', className }: { lado?: 'esq' | 'dir'; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 40" className={cn('shrink-0', className)} aria-hidden="true" style={lado === 'dir' ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <Metal id={id} />
      </defs>
      <path d="M2 20L16 16.5L64 18V22L16 23.5Z" fill={`url(#${id}-h)`} />
      <path d={voluta(30, 12, 9, -1, 1.4, 90)} stroke={`url(#${id}-m)`} strokeWidth="2" fill="none" />
      <path d={voluta(30, 28, 9, 1, 1.4, 270)} stroke={`url(#${id}-m)`} strokeWidth="2" fill="none" />
      <path d="M44 20L50 14L56 20L50 26Z" fill={`url(#${id}-j)`} stroke="#d8cfbf" strokeWidth="0.8" />
      <path d={star4(12, 20, 5, 0.2)} fill="#ece5d8" />
    </svg>
  )
}

/** Faixa ornamental horizontal (fundo de mármore negro com filetes de aço e pontas de filigrana). */
export function FaixaOrnamental({ children, className, tom = 'aco' }: { children: ReactNode; className?: string; tom?: 'aco' | 'ametista' }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <PontaFiligrana lado="esq" className="relative z-10 -mr-3 h-9 w-14" />
      <div className="relative min-w-0 flex-1 self-stretch">
        <span aria-hidden="true" className="absolute inset-x-0 top-[3px] h-px bg-[linear-gradient(90deg,#6b6357,#ece5d8_30%,#bab09f_70%,#6b6357)]" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[3px] h-px bg-[linear-gradient(90deg,#6b6357,#bab09f_30%,#ece5d8_70%,#6b6357)]" />
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 inset-y-[5px] bg-dv-ink-2 bg-[url(/images/os/marmore-negro.webp)] bg-[length:420px_420px]',
            tom === 'ametista' && 'shadow-[inset_0_0_24px_rgb(var(--dv-amethyst-rgb)/0.35)]',
          )}
        />
        <div className="relative flex h-full items-center justify-center px-2">{children}</div>
      </div>
      <PontaFiligrana lado="dir" className="relative z-10 -ml-3 h-9 w-14" />
    </div>
  )
}

/* ── Botões de invocação ───────────────────────────────────────────────────────────────── */

/**
 * Placa gótica (Moeda / Balde): arco ogival no topo, base em ponta, filete duplo de aço, crista com losango.
 * `ativo` acende a joia e o filete de ametista; desabilitado escurece o metal.
 */
export function PlacaGotica({ ativo, apagado, className }: { ativo: boolean; apagado: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  const corpo = 'M8 34Q8 14 50 6Q92 14 92 34V96L50 112L8 96Z'
  const dentro = 'M14 36Q14 20 50 13Q86 20 86 36V92L50 105L14 92Z'
  return (
    <svg viewBox="0 0 100 118" preserveAspectRatio="none" className={cn('absolute inset-0 size-full', className)} aria-hidden="true">
      <defs>
        <Metal id={id} />
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25242a" />
          <stop offset="0.5" stopColor="#141417" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
      </defs>
      <path d={corpo} fill={apagado ? '#2a2a2e' : `url(#${id}-m)`} />
      <path d={dentro} fill={`url(#${id}-f)`} stroke={ativo ? '#8f86b4' : apagado ? '#38383d' : '#6b6357'} strokeWidth="1.2" />
      <path d="M20 40Q20 26 50 20Q80 26 80 40" fill="none" stroke={apagado ? '#3a3a3f' : '#bab09f'} strokeWidth="0.7" opacity="0.7" />
      {/* crista */}
      <path d="M50 0L56 7L50 14L44 7Z" fill={ativo ? `url(#${id}-j)` : apagado ? '#3a3a3f' : `url(#${id}-m)`} stroke="#1d1a16" strokeWidth="0.6" />
      {/* volutas laterais */}
      {!apagado && (
        <>
          <path d={voluta(8, 60, 6, -1, 1.3, 0)} stroke={`url(#${id}-m)`} strokeWidth="1.6" fill="none" />
          <path d={voluta(92, 60, 6, 1, 1.3, 180)} stroke={`url(#${id}-m)`} strokeWidth="1.6" fill="none" />
        </>
      )}
      <path d="M50 105L50 118" stroke={apagado ? '#38383d' : `url(#${id}-m)`} strokeWidth="1.4" />
    </svg>
  )
}

/** Medalhão dentado (Girar): coroa de engrenagem, anel de joias, disco de mármore. */
export function MedalhaoDentado({ ativo, apagado, className }: { ativo: boolean; apagado: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  let dentes = ''
  for (let i = 0; i < 32; i++) {
    const a0 = ((i * 11.25 - 3.4) * Math.PI) / 180
    const a1 = ((i * 11.25 - 2) * Math.PI) / 180
    const a2 = ((i * 11.25 + 2) * Math.PI) / 180
    const a3 = ((i * 11.25 + 3.4) * Math.PI) / 180
    const p = (a: number, r: number) => `${(60 + Math.cos(a) * r).toFixed(2)} ${(60 + Math.sin(a) * r).toFixed(2)}`
    dentes += `${i ? 'L' : 'M'}${p(a0, 52)}L${p(a1, 58)}L${p(a2, 58)}L${p(a3, 52)}`
  }
  dentes += 'Z'
  return (
    <svg viewBox="0 0 120 120" className={cn('absolute inset-0 size-full', className)} aria-hidden="true">
      <defs>
        <Metal id={id} />
        <radialGradient id={`${id}-d`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor={ativo ? '#3b3170' : '#2a2a30'} />
          <stop offset="0.7" stopColor="#121214" />
          <stop offset="1" stopColor="#08080a" />
        </radialGradient>
      </defs>
      <path d={dentes} fill={apagado ? '#2c2c31' : `url(#${id}-m)`} stroke="#1d1a16" strokeWidth="0.6" />
      <circle cx="60" cy="60" r="50" fill="#0f0f12" stroke={apagado ? '#3a3a3f' : `url(#${id}-h)`} strokeWidth="3" />
      <circle cx="60" cy="60" r="43" fill={`url(#${id}-d)`} stroke={ativo ? '#cbc6dc' : '#5f584d'} strokeWidth="0.8" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180
        const x = 60 + Math.cos(a) * 46.5
        const y = 60 + Math.sin(a) * 46.5
        return <path key={i} d={`M${x} ${y - 3.2}L${x + 2.4} ${y}L${x} ${y + 3.2}L${x - 2.4} ${y}Z`} fill={ativo ? `url(#${id}-j)` : apagado ? '#3a3a3f' : '#8d8371'} />
      })}
    </svg>
  )
}

/* ── Moldura de resultado (ornamento proporcional à raridade) ─────────────────────────── */

const NIVEL: Record<ItemRarity, number> = { comum: 1, incomum: 2, raro: 3, epico: 4, lendario: 4, arcano: 4 }

/**
 * Moldura do resultado. `nivel` 0 = lixo (papel rasgado, sem metal). A partir de 1, o metal cresce com a
 * raridade: filete → volutas → joias + brasão → espinhos e moldura dupla.
 */
export function MolduraResultado({ raridade, lixo = false, children, className }: { raridade?: ItemRarity; lixo?: boolean; children: ReactNode; className?: string }) {
  const id = useId().replace(/:/g, '')
  const n = lixo ? 0 : NIVEL[raridade ?? 'comum']
  if (n === 0) {
    return (
      <div className={cn('relative', className)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          <path d="M2 4L14 2L30 5L46 1L62 4L80 2L98 5L97 30L99 52L96 74L98 97L80 95L62 99L44 96L26 99L8 96L2 98L4 72L1 50L3 28Z" fill="#1b1b1e" stroke="#3a3a3f" strokeWidth="0.5" />
          <path d="M70 99L76 90L84 95" fill="none" stroke="#2c2c31" strokeWidth="0.6" />
        </svg>
        <div className="relative">{children}</div>
      </div>
    )
  }
  return (
    <div className={cn('relative', className)} style={{ '--n': n } as CSSProperties}>
      <svg viewBox="0 0 340 420" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <Metal id={id} />
          <linearGradient id={`${id}-fundo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={n >= 3 ? '#211d33' : '#1c1c20'} />
            <stop offset="0.45" stopColor="#121214" />
            <stop offset="1" stopColor="#0b0b0d" />
          </linearGradient>
        </defs>
        {/* corpo: arco ogival no topo, base chanfrada */}
        <path d="M14 70Q14 30 170 12Q326 30 326 70V384L302 408H38L14 384Z" fill={`url(#${id}-fundo)`} stroke={`url(#${id}-m)`} strokeWidth={n >= 2 ? 3 : 2} />
        {n >= 2 && <path d="M24 74Q24 40 170 24Q316 40 316 74V378L296 398H44L24 378Z" fill="none" stroke="#bab09f" strokeWidth="0.8" opacity="0.6" />}
        {n >= 4 && <path d="M32 78Q32 48 170 34Q308 48 308 78V372L292 388H48L32 372Z" fill="none" stroke="#8f86b4" strokeWidth="1" opacity="0.7" />}
        {/* volutas nos cantos */}
        {n >= 2 &&
          [
            [14, 120, -1, 0],
            [326, 120, 1, 180],
            [14, 340, -1, 0],
            [326, 340, 1, 180],
          ].map(([x, y, d, a], i) => <path key={i} d={voluta(x, y, 14, d, 1.4, a)} stroke={`url(#${id}-m)`} strokeWidth="2.6" fill="none" />)}
        {/* brasão no topo */}
        {n >= 3 && (
          <g>
            <path d="M170 0L188 14L184 34L170 44L156 34L152 14Z" fill={`url(#${id}-m)`} stroke="#1d1a16" />
            <path d="M170 7L182 16L179 31L170 37L161 31L158 16Z" fill={`url(#${id}-j)`} />
            <path d={star4(170, 22, 7, 0.2)} fill="#f1eff4" />
            <path d={voluta(144, 22, 12, -1, 1.3, 20)} stroke={`url(#${id}-m)`} strokeWidth="2.4" fill="none" />
            <path d={voluta(196, 22, 12, 1, 1.3, 160)} stroke={`url(#${id}-m)`} strokeWidth="2.4" fill="none" />
          </g>
        )}
        {/* joias laterais */}
        {n >= 3 &&
          [
            [14, 230],
            [326, 230],
          ].map(([x, y], i) => <path key={i} d={`M${x} ${y - 13}L${x + 8} ${y}L${x} ${y + 13}L${x - 8} ${y}Z`} fill={`url(#${id}-j)`} stroke="#d8cfbf" strokeWidth="1" />)}
        {/* coroa de agulhas (épico+) */}
        {n >= 4 &&
          [-1, 1].map((s) =>
            [0, 1, 2].map((k) => {
              const x = 170 + s * (34 + k * 26)
              const y = 18 + k * 6
              return <path key={`${s}${k}`} d={`M${x} ${y + 10}L${x + s * 4} ${y - 14 + k * 4}L${x + s * 2} ${y + 12}Z`} fill={`url(#${id}-m)`} />
            }),
          )}
        {/* ponta inferior */}
        <path d="M150 408L170 420L190 408" fill="none" stroke={`url(#${id}-m)`} strokeWidth="2" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  )
}

/**
 * Etiqueta ornamental (estados do topo: balde em uso, giro grátis): placa de mármore negro com filete duplo de
 * aço, ponta de lança à direita e joia em losango à esquerda (acesa em ametista quando `aceso`).
 */
export function Etiqueta({ children, aceso = false, joia = true, className }: { children: ReactNode; aceso?: boolean; joia?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={cn('relative flex min-h-8 w-fit max-w-full items-center pl-6 pr-6', className)}>
      <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <Metal id={id} />
        </defs>
        <path d="M10 2H186L198 16L186 30H10L2 16Z" fill="#0f0f12" fillOpacity="0.9" />
        <path d="M10 2H186L198 16L186 30H10L2 16Z" fill="none" stroke={`url(#${id}-m)`} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path d="M12 5H184L193 16L184 27H12L6 16Z" fill="none" stroke={aceso ? '#8f86b4' : '#5f584d'} strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.9" />
      </svg>
      {joia && (
        <span aria-hidden="true" className="absolute left-[7px] top-1/2 size-2.5 -translate-y-1/2 rotate-45 border border-[#d8cfbf]" style={{ background: aceso ? 'radial-gradient(circle at 35% 30%,#f1eff4,#8f86b4 55%,#2a2638)' : 'linear-gradient(135deg,#6b6357,#2a2621)', boxShadow: aceso ? '0 0 8px rgba(138,124,200,0.9)' : undefined }} />
      )}
      <div className="relative flex min-w-0 items-center gap-2">{children}</div>
    </div>
  )
}
