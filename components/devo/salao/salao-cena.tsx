'use client'

import { type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EmblemMascaras } from '../kit/emblems'
import { MARBLE_INK } from '../os/shell-ui'

/**
 * Palco do Salão das Máscaras (ópera / baile de máscaras dentro da paleta DEVO): arco do proscênio em aço
 * champanhe com a máscara no fecho, cortinas de veludo negro (um fio de vinho só na sombra das pregas), sanefa
 * com franja, luz de canhão vinda do alto e plateia em piso xadrez de mármore. Tudo SVG/CSS (sem textura externa;
 * o mármore negro é o mesmo raster do shell). As cortinas respiram devagar (7 s) e param com movimento reduzido.
 *
 * `aberto`: cortinas recolhidas e luz cheia; fechado: cortinas quase fechadas, luz baixa.
 */
export function SalaoCena({ aberto = false, className, children, foco = 0.6 }: { aberto?: boolean; className?: string; children?: ReactNode; foco?: number }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0a0b]', className)}>
      <style>{CENA_CSS}</style>
      {/* parede de mármore negro, escurecida */}
      <span className={cn('absolute inset-0 opacity-70', MARBLE_INK)} />
      <span className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_20%,rgba(10,10,11,0.2),rgba(10,10,11,0.92)_70%)]" />

      {/* luz de canhão */}
      <span
        className="salao-luz absolute left-1/2 top-[-12%] h-[86%] w-[120%] -translate-x-1/2 transition-opacity duration-700"
        style={{
          opacity: aberto ? foco : foco * 0.45,
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(236,229,216,0.16) 172deg, rgba(244,239,230,0.24) 180deg, rgba(236,229,216,0.16) 188deg, transparent 200deg)',
        }}
      />

      {/* plateia: piso xadrez em perspectiva */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] [perspective:420px]">
        <div
          className="absolute inset-x-[-40%] bottom-[-10%] top-0 origin-bottom [transform:rotateX(62deg)]"
          style={{
            backgroundImage: 'repeating-conic-gradient(#1b1b1e 0 25%, #36363a 0 50%)',
            backgroundSize: '64px 64px',
          }}
        />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,#0a0a0b_0%,rgba(10,10,11,0.55)_45%,rgba(10,10,11,0.8)_100%)]" />
        <span className="absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-[#bab09f]/60 to-transparent" />
      </div>

      {/* proscênio: arco de aço champanhe com a máscara no fecho */}
      <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMin slice" className="absolute inset-x-0 top-0 h-[46%] w-full">
        <defs>
          <linearGradient id="salao-aco" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4efe6" />
            <stop offset="30%" stopColor="#6b6357" />
            <stop offset="55%" stopColor="#bab09f" />
            <stop offset="80%" stopColor="#5f584d" />
            <stop offset="100%" stopColor="#ece5d8" />
          </linearGradient>
        </defs>
        <path d="M18 300 V120 Q18 26 195 22 Q372 26 372 120 V300" fill="none" stroke="url(#salao-aco)" strokeWidth="2.2" opacity="0.85" />
        <path d="M28 300 V124 Q28 38 195 34 Q362 38 362 124 V300" fill="none" stroke="#bab09f" strokeOpacity="0.35" strokeWidth="0.8" />
        {/* caneluras do arco */}
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI * (0.08 + (i / 12) * 0.84)
          const x = 195 - Math.cos(a) * 172
          const y = 120 - Math.sin(a) * 92
          return <path key={i} d={`M${x} ${y} l0 0`} stroke="#ece5d8" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
        })}
      </svg>
      <span className="absolute left-1/2 top-[1.5%] w-[54px] -translate-x-1/2 opacity-80">
        <EmblemMascaras metal className="size-full" />
      </span>

      {/* cortinas */}
      <Cortina lado="esq" aberto={aberto} />
      <Cortina lado="dir" aberto={aberto} />

      {/* sanefa com franja */}
      <svg viewBox="0 0 390 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[9%] w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.7)]">
        <defs>
          <linearGradient id="salao-veludo-h" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#060607" />
            <stop offset="70%" stopColor="#141012" />
            <stop offset="100%" stopColor="#1c1417" />
          </linearGradient>
        </defs>
        <path d="M0 0 H390 V34 Q357 52 325 34 Q292 52 260 34 Q227 52 195 34 Q162 52 130 34 Q97 52 65 34 Q32 52 0 34 Z" fill="url(#salao-veludo-h)" />
        <path d="M0 34 Q32 52 65 34 Q97 52 130 34 Q162 52 195 34 Q227 52 260 34 Q292 52 325 34 Q357 52 390 34" fill="none" stroke="#bab09f" strokeOpacity="0.8" strokeWidth="1.2" />
        <path d="M0 38 Q32 56 65 38 Q97 56 130 38 Q162 56 195 38 Q227 56 260 38 Q292 56 325 38 Q357 56 390 38" fill="none" stroke="#bab09f" strokeOpacity="0.35" strokeWidth="2.4" strokeDasharray="0.8 2.2" />
      </svg>

      {/* vinheta */}
      <span className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />
      {children}
    </div>
  )
}

function Cortina({ lado, aberto }: { lado: 'esq' | 'dir'; aberto: boolean }) {
  const esq = lado === 'esq'
  return (
    <div
      className={cn('salao-cortina absolute top-0 h-[92%] transition-[width] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]', esq ? 'left-0' : 'right-0 -scale-x-100')}
      style={{ width: aberto ? '19%' : '34%', animationDelay: esq ? '0s' : '-3.5s' } as CSSProperties}
    >
      <svg viewBox="0 0 100 400" preserveAspectRatio="none" className="size-full drop-shadow-[10px_0_18px_rgba(0,0,0,0.85)]">
        <defs>
          <linearGradient id={`salao-prega-${lado}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#050506" />
            <stop offset="14%" stopColor="#1d1619" />
            <stop offset="24%" stopColor="#09080a" />
            <stop offset="40%" stopColor="#221a1d" />
            <stop offset="52%" stopColor="#0a0809" />
            <stop offset="68%" stopColor="#1f181b" />
            <stop offset="80%" stopColor="#0b090a" />
            <stop offset="92%" stopColor="#2a2024" />
            <stop offset="100%" stopColor="#0d0b0c" />
          </linearGradient>
        </defs>
        {/* o pano preso no alto e apanhado pela abraçadeira a 62% */}
        <path d="M0 0 H100 Q86 140 64 248 Q84 300 100 400 H0 Z" fill={`url(#salao-prega-${lado})`} />
        <path d="M100 0 Q86 140 64 248 Q84 300 100 400" fill="none" stroke="#bab09f" strokeOpacity="0.55" strokeWidth="0.8" />
        {/* abraçadeira de aço com borla */}
        <path d="M46 244 Q60 238 74 250" fill="none" stroke="#bab09f" strokeWidth="2.6" />
        <path d="M66 252 l3 22 l-6 0 Z" fill="#bab09f" opacity="0.85" />
        <circle cx="66" cy="250" r="2.4" fill="#ece5d8" />
      </svg>
    </div>
  )
}

const CENA_CSS = `
@keyframes salao-respira { 0%,100% { transform: skewX(0deg) } 50% { transform: skewX(-0.9deg) } }
@keyframes salao-luz { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.12) } }
.salao-cortina svg { animation: salao-respira 7s ease-in-out infinite; transform-origin: top center }
.salao-luz { animation: salao-luz 7s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .salao-cortina svg, .salao-luz { animation: none !important } }
`
