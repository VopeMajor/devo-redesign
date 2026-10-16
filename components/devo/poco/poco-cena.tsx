'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { NeblinaPalco } from '@/lib/devo/poco-neblina'

/**
 * Cena do Poço dos Milagres: ilustração vetorial de alto acabamento (sem WebGL, então não há fallback a
 * esperar nem custo de GPU no celular). Camadas: céu de neblina, casas antigas em silhueta, rua de barro, o
 * poço de pedra com telhado, sarilho de aço champanhe e manivela, balde na corda, placa dos 500 anos e três
 * faixas de névoa que derivam devagar. Toda animação para com prefers-reduced-motion (poco.css).
 *
 * `palco`: 'rua' (poço pequeno no fim da rua), 'poco'/'tela' (poço de perto), 'figura' (silhueta encapuzada
 * na névoa), 'mao' (vinheta fechada), 'partiu' (a figura some).
 */
export type PocoPalco = NeblinaPalco | 'tela' | 'trancado'
export type BaldePosicao = 'fundo' | 'subindo' | 'cima'

const WOOD: Record<string, [string, string, string]> = {
  madeira: ['#3a3029', '#5b4c40', '#241d18'],
  ferro: ['#3c3d41', '#6c6e73', '#1f2023'],
  cobre: ['#4a3426', '#7d5a43', '#2a1c14'],
  prata: ['#8d8f95', '#d9dade', '#55575c'],
}

export function PocoCena({
  palco = 'tela',
  balde = 'fundo',
  baldeTipo = 'madeira',
  girando = false,
  ativo = false,
  moeda = 0,
  brilho = 0.5,
  className,
}: {
  palco?: PocoPalco
  balde?: BaldePosicao
  baldeTipo?: string
  girando?: boolean
  /** Invocação em curso: o anel acelera, a aura pulsa e as partículas sobem mais rápido. */
  ativo?: boolean
  /** Muda a cada moeda lançada: dispara a queda e a ondulação. */
  moeda?: number
  /** 0..1: luz sobrenatural que sai da boca do poço. */
  brilho?: number
  className?: string
}) {
  const longe = palco === 'rua'
  const figura = palco === 'figura' || palco === 'mao'
  const partiu = palco === 'partiu'
  const trancado = palco === 'trancado'
  return (
    <div aria-hidden="true" className={cn('poco-cena pointer-events-none absolute inset-0 overflow-hidden bg-[#0d0d10]', className)}>
      {/* céu de neblina: grafite com um resto de luz lavanda (atmosfera, nunca superfície) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_30%,#26252c_0%,#17161b_45%,#0d0d10_100%)]" />
      <Casas className={cn('poco-t absolute inset-x-0 top-[14%] h-[38%] w-full', longe ? 'opacity-90' : 'opacity-55')} />
      <Rua className="absolute inset-x-0 bottom-0 h-[58%] w-full" />
      <Nevoa layer={0} className="top-[30%] opacity-60" />

      {/* o poço: pequeno no fim da rua; de perto no resto */}
      <div
        className="poco-t poco-well absolute left-1/2 top-[var(--poco-top,50%)]"
        style={
          {
            '--poco-y': longe ? '-44%' : '-50%',
            '--poco-s': longe ? 0.3 : 1,
          } as CSSProperties
        }
      >
        <Poco balde={balde} baldeTipo={baldeTipo} girando={girando} ativo={ativo} moeda={moeda} brilho={trancado ? 0.12 : longe ? 0.9 : brilho} />
      </div>

      {/* figura encapuzada (o Corvo, nunca nomeado): silhueta sem rosto, dissolvida na névoa */}
      <Figura estado={figura ? 'visivel' : partiu ? 'partindo' : 'oculta'} />

      <Nevoa layer={1} className="bottom-[8%] opacity-70" />
      <Nevoa layer={2} className="bottom-[-6%] opacity-80" />
      {/* a mão: a cena se fecha e esfria (sem ilustrar o horror; o texto dá conta) */}
      <div className={cn('poco-t absolute inset-0 bg-[radial-gradient(60%_45%_at_60%_48%,transparent_0%,rgba(6,6,9,0.86)_70%,#050507_100%)]', palco === 'mao' ? 'opacity-100' : 'opacity-0')} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,3,6,0.82)_100%)]" />
      <div className="devo-grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
      {trancado && <div className="absolute inset-0 bg-[#0c0c0e]/45" />}
    </div>
  )
}

/* ── Fundo ──────────────────────────────────────────────────────────────────────────────── */

function Casas({ className }: { className?: string }) {
  // Casas antigas e simples: telhados de duas águas, chaminés, poucas janelas apagadas (duas acesas, fracas).
  const casas = [
    { x: 0, w: 70, h: 92, r: 30 },
    { x: 62, w: 58, h: 70, r: 24 },
    { x: 116, w: 66, h: 104, r: 30 },
    { x: 178, w: 46, h: 78, r: 20 },
    { x: 220, w: 62, h: 96, r: 28 },
    { x: 278, w: 54, h: 74, r: 22 },
    { x: 328, w: 72, h: 100, r: 30 },
  ]
  return (
    <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className={className}>
      <defs>
        <linearGradient id="poco-casa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1c21" />
          <stop offset="1" stopColor="#121115" />
        </linearGradient>
      </defs>
      {casas.map((c, i) => {
        const base = 160
        const top = base - c.h
        return (
          <g key={i}>
            <path d={`M${c.x} ${base}V${top + c.r}L${c.x + c.w / 2} ${top}L${c.x + c.w} ${top + c.r}V${base}Z`} fill="url(#poco-casa)" />
            <path d={`M${c.x - 3} ${top + c.r + 2}L${c.x + c.w / 2} ${top - 2}L${c.x + c.w + 3} ${top + c.r + 2}`} fill="none" stroke="#2c2b31" strokeWidth="2" />
            {i % 2 === 0 && <rect x={c.x + c.w * 0.68} y={top + c.r * 0.2} width="6" height="14" fill="#1a191e" />}
            <rect x={c.x + c.w * 0.32} y={top + c.r + 14} width="5" height="7" fill={i === 2 || i === 5 ? '#4a4438' : '#17161a'} opacity={i === 2 || i === 5 ? 0.6 : 1} />
          </g>
        )
      })}
    </svg>
  )
}

function Rua({ className }: { className?: string }) {
  // Rua de barro em perspectiva: sulcos de roda convergindo para o fim, onde o poço espera.
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="poco-barro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1916" />
          <stop offset="0.5" stopColor="#25201b" />
          <stop offset="1" stopColor="#14110e" />
        </linearGradient>
        <linearGradient id="poco-chao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141317" />
          <stop offset="1" stopColor="#0b0b0d" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#poco-chao)" />
      <path d="M176 0H224L400 300H0Z" fill="url(#poco-barro)" />
      {[
        'M190 0L92 300',
        'M196 0L140 300',
        'M204 0L262 300',
        'M210 0L310 300',
      ].map((d) => (
        <path key={d} d={d} stroke="#0f0d0b" strokeWidth="2.2" opacity="0.7" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx={60 + ((i * 97) % 280)} cy={60 + ((i * 53) % 230)} rx={4 + (i % 4) * 2} ry={1.2 + (i % 3) * 0.6} fill="#0f0d0b" opacity="0.6" />
      ))}
    </svg>
  )
}

function Nevoa({ layer, className }: { layer: number; className?: string }) {
  return (
    <div className={cn('absolute -inset-x-1/4 h-[34%]', className)}>
      <div
        className={cn('poco-fog absolute inset-0', layer === 1 && 'poco-fog-b', layer === 2 && 'poco-fog-c')}
        style={{
          background:
            layer === 0
              ? 'radial-gradient(40% 50% at 30% 50%,rgba(150,148,160,0.3),transparent 70%),radial-gradient(35% 45% at 75% 40%,rgba(150,148,160,0.24),transparent 70%)'
              : layer === 1
                ? 'radial-gradient(45% 50% at 25% 60%,rgba(170,168,178,0.3),transparent 70%),radial-gradient(40% 50% at 70% 50%,rgba(160,158,170,0.26),transparent 72%)'
                : 'radial-gradient(55% 60% at 50% 70%,rgba(180,178,188,0.3),transparent 70%)',
        }}
      />
    </div>
  )
}

/* ── O mecanismo (camadas de arte em public/images/poco, geradas por scripts/dev/gen-poco-arte.mjs) ─── */

const ART = '/images/poco'

/** Partículas discretas subindo da água (transform + opacidade apenas; 9 no máximo). */
const PARTICULAS = [
  { x: 38, d: 0, t: 7.5, s: 3 },
  { x: 46, d: 1.6, t: 9, s: 2 },
  { x: 52, d: 3.1, t: 8, s: 2.5 },
  { x: 58, d: 0.8, t: 10, s: 2 },
  { x: 62, d: 4.4, t: 7, s: 3 },
  { x: 43, d: 5.5, t: 9.5, s: 2 },
  { x: 55, d: 6.6, t: 8.5, s: 1.5 },
  { x: 49, d: 2.4, t: 11, s: 1.5 },
  { x: 66, d: 3.8, t: 9, s: 2 },
]

function Poco({ balde, baldeTipo, girando, ativo, moeda, brilho }: { balde: BaldePosicao; baldeTipo: string; girando: boolean; ativo: boolean; moeda: number; brilho: number }) {
  const tipo = ['madeira', 'ferro', 'cobre', 'prata'].includes(baldeTipo) ? baldeTipo : 'madeira'
  return (
    <div className={cn('poco-stage relative', (girando || ativo) && 'poco-ativo')} style={{ aspectRatio: '400 / 500', height: 'var(--poco-h, min(64vh, 500px))', '--brilho': brilho } as CSSProperties}>
      {/* aura violeta atrás de tudo (respira) */}
      <img src={`${ART}/aura.webp`} alt="" draggable={false} className="poco-aura absolute left-[-14%] top-[-6%] w-[128%] max-w-none" />
      {/* anel astral: numerais e runas girando devagar (acelera na invocação) */}
      <div className="absolute left-[9%] top-[5.2%] w-[82%]">
        <img src={`${ART}/anel.webp`} alt="" draggable={false} className="poco-anel block w-full opacity-60" />
      </div>
      {/* feixe de luz direcionada vindo do alto à esquerda */}
      <span className="poco-feixe absolute left-[-30%] top-[-20%] h-[95%] w-[70%] origin-top-left rotate-[-24deg] bg-[linear-gradient(90deg,transparent,rgba(214,206,246,0.13)_45%,rgba(214,206,246,0.05)_70%,transparent)]" />
      <img src={`${ART}/estrutura.webp`} alt="" draggable={false} className="absolute inset-0 w-full" />
      {/* corrente + balde: recortados entre o sarilho e a linha d'água */}
      <div className="absolute left-[35%] top-[41.6%] h-[28.8%] w-[30%] overflow-hidden">
        <img
          src={`${ART}/balde-${tipo}.webp`}
          alt=""
          draggable={false}
          className={cn('poco-bucket absolute left-0 top-0 w-full max-w-none', balde === 'subindo' && 'poco-bucket-sobe')}
          style={{ transform: `translateY(${balde === 'fundo' ? '-38%' : '-74.5%'})` }}
        />
      </div>
      {/* moeda caindo e ondas na água */}
      {moeda > 0 && (
        <div key={moeda} className="absolute left-[44%] top-[34%] h-[38%] w-[12%]">
          <span className="poco-coin absolute left-1/2 top-0 block size-[18px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbf6ec,#bab09f_45%,#5f584d)] shadow-[0_0_10px_rgba(236,229,216,0.6)]" />
        </div>
      )}
      {moeda > 0 && <span key={`r${moeda}`} className="poco-ripple absolute left-[30%] top-[66.5%] h-[8%] w-[40%] rounded-[50%] border border-[#c2b9ec]/70" />}
      {/* partículas subindo da água */}
      <div className="absolute left-[18%] top-[18%] h-[52%] w-[64%] overflow-hidden">
        {PARTICULAS.map((p, i) => (
          <span
            key={i}
            className="poco-particula absolute bottom-0 rotate-45 bg-[#e4defa]"
            style={{ left: `${p.x * 1.5 - 30}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` } as CSSProperties}
          />
        ))}
      </div>
      <img src={`${ART}/base.webp`} alt="" draggable={false} className="absolute inset-0 w-full" />
      {/* roda da manivela (gira com a corrente) */}
      <div className="absolute left-[72.4%] top-[35.4%] w-[19.6%]">
        <img src={`${ART}/roda.webp`} alt="" draggable={false} className={cn('poco-roda block w-full', girando && 'poco-roda-on')} />
      </div>
    </div>
  )
}

function Figura({ estado }: { estado: 'oculta' | 'visivel' | 'partindo' }) {
  return (
    <svg
      viewBox="0 0 120 320"
      className={cn(
        'poco-t absolute bottom-[20%] right-[-5%] h-[46%] w-auto',
        estado === 'visivel' ? 'translate-x-0 opacity-80' : estado === 'partindo' ? 'translate-x-6 opacity-0' : 'translate-x-10 opacity-0',
      )}
    >
      <defs>
        <linearGradient id="poco-manto" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#09090b" />
          <stop offset="0.7" stopColor="#0c0c0f" stopOpacity="0.95" />
          <stop offset="1" stopColor="#0c0c0f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="poco-manto-luz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6f6b82" stopOpacity="0" />
          <stop offset="0.85" stopColor="#6f6b82" stopOpacity="0" />
          <stop offset="1" stopColor="#b7b3c9" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {/* capuz pontudo, ombros estreitos, manto longo até o chão */}
      <path d="M60 6C44 18 38 38 40 58C30 66 24 84 22 110C16 170 12 240 6 316H114C108 240 104 170 98 110C96 84 90 66 80 58C82 38 76 18 60 6Z" fill="url(#poco-manto)" />
      <path d="M60 6C44 18 38 38 40 58C30 66 24 84 22 110C16 170 12 240 6 316H114C108 240 104 170 98 110C96 84 90 66 80 58C82 38 76 18 60 6Z" fill="url(#poco-manto-luz)" />
      {/* vazio do capuz: sem rosto */}
      <path d="M60 24C51 32 48 44 50 56C54 60 66 60 70 56C72 44 69 32 60 24Z" fill="#020203" />
      <path d="M48 120C52 160 50 220 46 300M74 118C72 170 76 230 80 300" stroke="#1a1a1f" strokeWidth="1.2" fill="none" opacity="0.8" />
    </svg>
  )
}

/** Moeda (Dracma) por raridade: aço frio, aço champanhe ou com joia de ametista. */
export function DracmaIcon({ raridade = 'comum', className }: { raridade?: string; className?: string }) {
  const tone = raridade === 'comum' ? ['#d9d7d2', '#8f8e8b', '#3c3c40'] : ['#ece5d8', '#bab09f', '#5f584d']
  const gem = raridade !== 'comum' && raridade !== 'incomum'
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`dracma-${raridade}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone[0]} />
          <stop offset="0.55" stopColor={tone[1]} />
          <stop offset="1" stopColor={tone[2]} />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill={`url(#dracma-${raridade})`} stroke="#0c0c0e" strokeWidth="1" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#0c0c0e" strokeWidth="0.8" opacity="0.55" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <path key={i} d={`M${16 + Math.cos(a) * 11.6} ${16 + Math.sin(a) * 11.6}L${16 + Math.cos(a) * 13.2} ${16 + Math.sin(a) * 13.2}`} stroke="#0c0c0e" strokeWidth="0.6" opacity="0.5" />
      })}
      {gem ? (
        <path d="M16 10.5L20 16L16 21.5L12 16Z" fill="#8a7cc8" stroke="#463d78" strokeWidth="0.8" />
      ) : (
        <path d="M16 9.5l1.6 4.9 4.9 1.6-4.9 1.6-1.6 4.9-1.6-4.9-4.9-1.6 4.9-1.6z" fill="#0c0c0e" opacity={raridade === 'incomum' ? 0.75 : 0.55} />
      )}
    </svg>
  )
}

/** Balde (ícone pequeno) por material. */
export function BaldeIcon({ tipo = 'madeira', className }: { tipo?: string; className?: string }) {
  const [w0, w1, w2] = WOOD[tipo] ?? WOOD.madeira
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M8 11Q16 2 24 11" fill="none" stroke="#bab09f" strokeWidth="1.6" />
      <path d="M6 11H26L23.5 28H8.5Z" fill={w1} stroke="#0c0c0e" strokeWidth="1" />
      <path d="M6 11H12L11 28H8.5Z" fill={w2} opacity="0.8" />
      <path d="M20 11H26L23.5 28H21Z" fill={w0} opacity="0.6" />
      <path d="M6.6 15H25.4M7.6 24H24.4" stroke="#bab09f" strokeWidth="1.8" />
      <ellipse cx="16" cy="11" rx="10" ry="1.8" fill="#0c0c0e" />
    </svg>
  )
}
