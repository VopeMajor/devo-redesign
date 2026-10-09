import { cn } from '@/lib/utils'
import { DeadlyVoteSymbol } from '../../system/symbol'
import { toRoman } from '../glyphs'
import { CheckerFloor, Lantern, RomanDial, Sword } from '../ornament/motifs'
import type { SceneFocus, ScenePreset } from './types'

const BASE: Record<ScenePreset, string> = {
  sigil: 'bg-[radial-gradient(70%_45%_at_50%_38%,#28273a_0%,#16151c_42%,var(--dv-ink)_100%)]',
  cathedral: 'bg-[linear-gradient(180deg,#19181f_0%,#0f0e1a_55%,var(--dv-ink)_100%)]',
  table: 'bg-[radial-gradient(60%_50%_at_50%_45%,#2b2830_0%,#0e0d13_55%,var(--dv-ink)_100%)]',
  corridor: 'bg-[radial-gradient(30%_30%_at_50%_44%,#2a2933_0%,#131217_50%,var(--dv-ink)_100%)]',
  tribunal: 'bg-[radial-gradient(55%_40%_at_50%_30%,#3f060b_0%,#14070c_50%,#070609_100%)]',
  clockhall: 'bg-[radial-gradient(75%_50%_at_50%_30%,#3c3b4a_0%,#19181f_48%,#0e0d12_100%)]',
}

/**
 * Fundo estático de cada preset: aparece na primeira pintura e quando o WebGL não está disponível.
 * Desenho em SVG/CSS (leve). `showArt=false` mantém só o gradiente (o 3D já está por cima).
 */
export function SceneFallback({ preset, focus, alert, showArt }: { preset: ScenePreset; focus?: SceneFocus; alert?: boolean; showArt: boolean }) {
  return (
    <div className={cn('absolute inset-0', BASE[preset])}>
      <div className={cn('absolute inset-0 transition-opacity duration-700', showArt ? 'opacity-100' : 'opacity-0')}>
        {preset === 'sigil' && <SigilArt focus={focus} />}
        {preset === 'cathedral' && <CathedralArt />}
        {preset === 'table' && <TableArt />}
        {preset === 'corridor' && <CorridorArt />}
        {preset === 'tribunal' && <TribunalArt alert={alert} />}
        {preset === 'clockhall' && <ClockhallArt />}
      </div>
    </div>
  )
}

function Dial({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="98" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="94" strokeWidth="0.5" opacity="0.6" />
      <circle cx="100" cy="100" r="62" strokeWidth="0.6" opacity="0.7" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2
        const r1 = i % 5 === 0 ? 85 : 89
        return <line key={i} x1={100 + Math.sin(a) * r1} y1={100 - Math.cos(a) * r1} x2={100 + Math.sin(a) * 93} y2={100 - Math.cos(a) * 93} strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <text key={i} x={100 + Math.sin(a) * 75} y={100 - Math.cos(a) * 75 + 3} textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" style={{ fontFamily: 'var(--font-card-title)' }}>
            {toRoman(i === 0 ? 12 : i)}
          </text>
        )
      })}
    </svg>
  )
}

function SigilArt({ focus }: { focus?: SceneFocus }) {
  const f = focus ?? { x: 0.5, y: 0.42, size: 0.9 }
  return (
    <div
      className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `min(${f.size * 100}vw, ${f.size * 100}vh)` }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(138,124,200,0.35),transparent_62%)]" />
      <Dial className="animate-dv-spin-slow absolute inset-0 text-dv-gold/70" />
      <div className="absolute inset-[18%] rounded-full border border-dv-cobalt-text/40" />
      <DeadlyVoteSymbol variant="mark" className="absolute inset-[30%] text-dv-text drop-shadow-[0_0_24px_rgba(138,124,200,0.7)]" />
    </div>
  )
}

function CathedralArt() {
  return (
    <>
      <div className="absolute inset-y-0 left-[8%] w-[14%] bg-gradient-to-b from-[#242329] to-transparent opacity-70" />
      <div className="absolute inset-y-0 right-[8%] w-[14%] bg-gradient-to-b from-[#242329] to-transparent opacity-70" />
      <div className="absolute inset-y-0 left-[28%] w-[8%] bg-gradient-to-b from-[#1c1b20] to-transparent opacity-60" />
      <div className="absolute inset-y-0 right-[28%] w-[8%] bg-gradient-to-b from-[#1c1b20] to-transparent opacity-60" />
      <div className="absolute -top-[10%] left-[34%] h-[90%] w-[10%] rotate-[18deg] bg-gradient-to-b from-[rgba(203,197,232,0.28)] to-transparent blur-md" />
      <div className="absolute -top-[10%] left-[52%] h-[80%] w-[6%] rotate-[18deg] bg-gradient-to-b from-[rgba(235,234,232,0.2)] to-transparent blur-md" />
    </>
  )
}

function TableArt() {
  return (
    <>
      <CheckerFloor tilt={60} cell={44} className="!h-[62%]" />
      <div className="absolute left-1/2 top-[30%] h-[56%] w-[80%] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_70%,rgba(242,234,214,0.22),transparent_70%)]" />
      <Sword className="absolute bottom-[12%] left-[12%] h-[52%] rotate-[14deg]" />
      <Sword className="absolute bottom-[16%] right-[14%] h-[46%] -rotate-[12deg]" gem="glass" />
      <div className="absolute left-1/2 top-0 h-[22%] w-px -translate-x-1/2 bg-white/20" />
      <div className="absolute left-1/2 top-[22%] h-6 w-20 -translate-x-1/2 rounded-t-full border-b-2 border-dv-gold bg-dv-ink-2" />
    </>
  )
}

function CorridorArt() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-dv-gold/40" fill="none" stroke="currentColor" strokeWidth="0.3">
      {Array.from({ length: 7 }, (_, i) => {
        const k = 1 - i * 0.13
        const w = 46 * k
        const h = 50 * k
        return <rect key={i} x={50 - w} y={44 - h * 0.6} width={w * 2} height={h * 1.2} opacity={1 - i * 0.12} vectorEffect="non-scaling-stroke" />
      })}
      <circle cx="50" cy="44" r="1.2" fill="rgba(233,232,229,0.8)" stroke="none" />
    </svg>
  )
}

function TribunalArt({ alert }: { alert?: boolean }) {
  return (
    <>
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="absolute inset-x-0 bottom-0 h-[70%] w-full text-[#232227]" fill="currentColor">
        {Array.from({ length: 2 }, (_, tier) =>
          Array.from({ length: 11 }, (_, i) => {
            const a = -1.2 + (i / 10) * 2.4
            const r = tier ? 44 : 34
            const x = 50 + Math.sin(a) * r
            const y = 40 - Math.cos(a) * r * 0.32 - tier * 6
            return <rect key={`${tier}-${i}`} x={x - 2.2} y={y - 3} width="4.4" height="5" opacity={0.9 - tier * 0.25} />
          }),
        )}
        <ellipse cx="50" cy="48" rx="30" ry="6" fill="none" stroke="rgba(186,176,159,0.35)" strokeWidth="0.3" />
      </svg>
      <div className={cn('absolute left-1/2 top-0 h-[70%] w-[50%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(170,20,32,0.35),transparent)] [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]', alert && 'animate-dv-alert')} />
    </>
  )
}

function ClockhallArt() {
  return (
    <>
      <div className="absolute left-1/2 top-[6%] aspect-square w-[min(118vw,78vh)] -translate-x-1/2 opacity-90">
        <RomanDial glass className="size-full" />
      </div>
      <CheckerFloor tilt={66} cell={52} className="!h-[30%]" />
      <Lantern chain={70} className="absolute left-[10%] top-0 w-[11%] min-w-10 opacity-90" />
      <Lantern chain={130} className="absolute right-[12%] top-0 w-[9%] min-w-8 opacity-80" style={{ animationDelay: '-3s' }} />
    </>
  )
}
