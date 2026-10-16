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
  moeda = 0,
  brilho = 0.5,
  className,
}: {
  palco?: PocoPalco
  balde?: BaldePosicao
  baldeTipo?: string
  girando?: boolean
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
        <Poco balde={balde} baldeTipo={baldeTipo} girando={girando} moeda={moeda} brilho={trancado ? 0.12 : longe ? 0.9 : brilho} />
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

/* ── O poço ─────────────────────────────────────────────────────────────────────────────── */

function Poco({ balde, baldeTipo, girando, moeda, brilho }: { balde: BaldePosicao; baldeTipo: string; girando: boolean; moeda: number; brilho: number }) {
  // Cilindro de pedra: centro x=200; boca em y=318; base em y=448.
  const rows = [348, 372, 396, 420]
  const juntas: [number, number][] = []
  rows.concat([444]).forEach((y, r) => {
    const top = r === 0 ? 324 : rows[r - 1]
    for (let k = 0; k < 8; k++) {
      const th = -Math.PI / 2 + ((k + (r % 2 ? 0.5 : 0)) / 8) * Math.PI
      if (Math.abs(th) > 1.45) continue
      juntas.push([200 + 120 * Math.sin(th), (top + y) / 2])
    }
  })
  const [w0, w1, w2] = WOOD[baldeTipo] ?? WOOD.madeira
  const baldeY = balde === 'cima' ? 0 : balde === 'subindo' ? 0 : 168
  return (
    <svg viewBox="0 0 400 500" className="block w-auto max-w-none" style={{ aspectRatio: '400 / 500', height: 'var(--poco-h, min(64vh, 500px))' }}>
      <defs>
        <linearGradient id="poco-pedra" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#151518" />
          <stop offset="0.3" stopColor="#4a4a50" />
          <stop offset="0.45" stopColor="#5a5a60" />
          <stop offset="0.75" stopColor="#2e2e33" />
          <stop offset="1" stopColor="#111114" />
        </linearGradient>
        <linearGradient id="poco-borda" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a7a80" />
          <stop offset="0.45" stopColor="#4c4c52" />
          <stop offset="1" stopColor="#26262b" />
        </linearGradient>
        <radialGradient id="poco-boca" cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="#2a2540" />
          <stop offset="0.35" stopColor="#0d0c14" />
          <stop offset="1" stopColor="#030304" />
        </radialGradient>
        <radialGradient id="poco-luz" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c2b9ec" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#8a7cc8" stopOpacity="0.18" />
          <stop offset="1" stopColor="#8a7cc8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="poco-aco" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.35" stopColor="#bab09f" />
          <stop offset="0.7" stopColor="#6b6357" />
          <stop offset="1" stopColor="#3a352e" />
        </linearGradient>
        <linearGradient id="poco-viga" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#17130f" />
          <stop offset="0.4" stopColor="#3a3029" />
          <stop offset="1" stopColor="#1b1612" />
        </linearGradient>
        <linearGradient id="poco-telha" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2c31" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
        <linearGradient id="poco-balde" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={w2} />
          <stop offset="0.4" stopColor={w1} />
          <stop offset="1" stopColor={w0} />
        </linearGradient>
        {/* o balde só aparece acima da borda ou dentro da boca */}
        <clipPath id="poco-clip-boca">
          <rect x="0" y="0" width="400" height="318" />
          <ellipse cx="200" cy="318" rx="98" ry="21" />
        </clipPath>
        <clipPath id="poco-clip-corda">
          <rect x="0" y="176" width="400" height="330" />
        </clipPath>
      </defs>

      {/* sombra no barro */}
      <ellipse cx="200" cy="452" rx="168" ry="34" fill="#050506" opacity="0.7" />
      {/* luz sobrenatural acima da boca */}
      <ellipse className="poco-glow" cx="200" cy="300" rx="150" ry="120" fill="url(#poco-luz)" fillOpacity={brilho} />

      {/* corpo de pedra */}
      <path d="M80 318V444A120 26 0 0 0 320 444V318Z" fill="url(#poco-pedra)" />
      {rows.map((y) => (
        <path key={y} d={`M80 ${y}A120 26 0 0 0 320 ${y}`} fill="none" stroke="#0c0c0e" strokeWidth="2" opacity="0.85" />
      ))}
      {rows.map((y) => (
        <path key={`h${y}`} d={`M84 ${y + 2}A116 25 0 0 0 316 ${y + 2}`} fill="none" stroke="#8f8e8b" strokeWidth="0.8" opacity="0.18" />
      ))}
      {juntas.map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 9}v${18 + (200 - Math.abs(x - 200)) * 0.04}`} stroke="#0c0c0e" strokeWidth="2" opacity="0.8" />
      ))}
      {/* musgo/sujeira na base */}
      <path d="M80 430Q140 456 200 452T320 430V444A120 26 0 0 1 80 444Z" fill="#101012" opacity="0.6" />

      {/* placa dos 500 anos (D em romano) */}
      <g transform="translate(26 360)">
        <rect x="14" y="40" width="5" height="52" fill="#1b1612" />
        <path d="M0 6L6 0H28L34 6V38L28 44H6L0 38Z" fill="url(#poco-borda)" stroke="#0c0c0e" strokeWidth="1.5" />
        <path d="M5 9L9 5H25L29 9V35L25 39H9L5 35Z" fill="none" stroke="#8f8e8b" strokeWidth="0.7" opacity="0.5" />
        <text x="17" y="27" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="15" fontWeight="600" fill="#151517" opacity="0.85">
          D
        </text>
        <path d="M10 31H24" stroke="#151517" strokeWidth="0.9" opacity="0.6" />
      </g>

      {/* postes do telhado */}
      <rect x="88" y="104" width="16" height="222" fill="url(#poco-viga)" />
      <rect x="296" y="104" width="16" height="222" fill="url(#poco-viga)" />
      <path d="M90 140H102M298 140H310M90 236H102M298 236H310" stroke="#0c0c0e" strokeWidth="1.2" opacity="0.7" />

      {/* telhado de duas águas com telhas */}
      <path d="M58 118L200 44L342 118L332 126L200 58L68 126Z" fill="#0f0f12" />
      <path d="M68 118L200 50L332 118V126L200 60L68 126Z" fill="url(#poco-telha)" />
      {[64, 76, 88, 100, 112].map((y, i) => (
        <path key={y} d={`M${200 - (y - 48) * 1.92} ${y}L200 ${y - 6 - i * 0.3}L${200 + (y - 48) * 1.92} ${y}`} fill="none" stroke="#3d3d44" strokeWidth="1.1" opacity="0.6" />
      ))}
      <path d="M196 44h8v8h-8z" transform="rotate(45 200 48)" fill="url(#poco-aco)" />

      {/* sarilho (eixo de aço champanhe) com a corda enrolada */}
      <rect x="100" y="164" width="200" height="22" rx="3" fill="url(#poco-aco)" />
      <g className={cn('poco-rope-wind', girando && 'poco-rope-wind-on')}>
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${166 + i * 5.5} 165l-4 20`} stroke="#6f675b" strokeWidth="3.4" strokeLinecap="round" />
        ))}
      </g>
      <rect x="100" y="164" width="200" height="4" fill="#ece5d8" opacity="0.35" />
      <circle cx="96" cy="175" r="9" fill="url(#poco-aco)" stroke="#2c2a26" />
      <circle cx="304" cy="175" r="9" fill="url(#poco-aco)" stroke="#2c2a26" />

      {/* boca do poço (vista de cima) e borda de pedra */}
      <ellipse cx="200" cy="318" rx="126" ry="32" fill="url(#poco-borda)" />
      <ellipse cx="200" cy="318" rx="126" ry="32" fill="none" stroke="#0c0c0e" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x1 = 200 + Math.cos(a) * 100
        const y1 = 318 + Math.sin(a) * 22
        const x2 = 200 + Math.cos(a) * 126
        const y2 = 318 + Math.sin(a) * 32
        return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#141417" strokeWidth="1.6" opacity="0.8" />
      })}
      <ellipse cx="200" cy="318" rx="100" ry="22" fill="url(#poco-boca)" />
      <ellipse className="poco-glow" cx="200" cy="322" rx="60" ry="11" fill="url(#poco-luz)" fillOpacity={0.35 + brilho * 0.4} />

      {/* moeda caindo + ondulação na água (reinicia a cada lançamento) */}
      {moeda > 0 && (
        <g key={moeda}>
          <g className="poco-coin">
            <ellipse cx="200" cy="232" rx="7" ry="7" fill="url(#poco-aco)" stroke="#3a352e" strokeWidth="1" />
            <path d="M200 227.5l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3z" fill="#5f584d" />
          </g>
          <ellipse className="poco-ripple" cx="200" cy="322" rx="40" ry="8" fill="none" stroke="#c2b9ec" strokeWidth="1.5" />
        </g>
      )}

      {/* corda + balde (sobem e descem juntos) */}
      <g clipPath="url(#poco-clip-boca)">
        <g clipPath="url(#poco-clip-corda)">
          <g className={cn('poco-bucket', balde === 'subindo' && 'poco-bucket-sobe')} style={{ transform: `translateY(${baldeY}px)` }}>
            <rect x="198.6" y="-260" width="2.8" height="470" fill="#7b7366" />
            <rect x="198.6" y="-260" width="0.9" height="470" fill="#b5ab9b" opacity="0.6" />
            <path d="M178 216Q200 192 222 216" fill="none" stroke="url(#poco-aco)" strokeWidth="2.4" />
            <path d="M176 214H224L219 258H181Z" fill="url(#poco-balde)" stroke="#0c0c0e" strokeWidth="1.4" />
            <path d="M177.5 224H222.5M179.5 248H220.5" stroke="url(#poco-aco)" strokeWidth="3" />
            {baldeTipo === 'madeira' && <path d="M190 214V258M205 214V258M197 230l3 9" stroke="#1b1612" strokeWidth="1" opacity="0.7" />}
            <ellipse cx="200" cy="214" rx="24" ry="4.5" fill="#0c0c0e" opacity="0.85" />
          </g>
        </g>
      </g>

      {/* frente da borda (sobrepõe a corda quando o balde está no fundo) */}
      <path d="M74 318A126 32 0 0 0 326 318A126 32 0 0 1 74 318Z" fill="url(#poco-borda)" opacity="0.9" />
      <path d="M74 318A126 32 0 0 0 326 318" fill="none" stroke="#9a9a9f" strokeWidth="1" opacity="0.35" />

      {/* manivela de aço (gira com a corda) */}
      <g className={cn('poco-crank', girando && 'poco-crank-on')} style={{ transformOrigin: '312px 175px' }}>
        <rect x="309" y="171" width="44" height="8" rx="2" fill="url(#poco-aco)" stroke="#2c2a26" strokeWidth="0.8" />
        <rect x="346" y="160" width="9" height="30" rx="3.5" fill="#2a2420" stroke="#0c0c0e" />
        <rect x="347.5" y="162" width="2" height="26" rx="1" fill="#5b4c40" opacity="0.6" />
      </g>
      <circle cx="312" cy="175" r="6" fill="url(#poco-aco)" stroke="#2c2a26" />
    </svg>
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
