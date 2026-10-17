'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { NeblinaPalco } from '@/lib/devo/poco-neblina'
import { POCO_PINTADO, POCO_PINTURA, srcset } from './poco-pintura'

/**
 * Cena do Poço dos Milagres: ilustração em camadas (sem WebGL, então não há fallback a esperar nem custo de
 * GPU no celular). De trás para a frente: céu de neblina com a lua velada, casas antigas (duas janelas acesas),
 * rua de barro com poças, o pátio de pedra gasta com a inscrição circular, a estela dos 500 anos, o poço
 * (camadas de arte em public/images/poco), as oferendas deixadas por quem veio antes (velas, uma rosa vinho,
 * moedas que ninguém ousou buscar) e três faixas de névoa. Paleta do Refinamento 4: abismo, pedra de névoa,
 * vinho e prata apagada; a luz do poço é prata fria com um fundo vinho (sem roxo neon).
 *
 * Camadas pintadas opcionais: poco-pintura.ts (cada uma substitui a parte desenhada correspondente).
 * Toda animação para com prefers-reduced-motion (poco.css).
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
  figuraBase,
  className,
}: {
  /** Pé da figura ancorado ao topo da caixa de fala (px a partir do pé da cena; kit/npc-anchor useFalaAncora). */
  figuraBase?: { bottom: number; espaco: number } | null
  palco?: PocoPalco
  balde?: BaldePosicao
  baldeTipo?: string
  girando?: boolean
  /** Invocação em curso: o anel acelera, a aura pulsa e as partículas sobem mais rápido. */
  ativo?: boolean
  /** Muda a cada moeda lançada: dispara o arco da moeda, o respingo e as ondas. */
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
    <div aria-hidden="true" className={cn('poco-cena pointer-events-none absolute inset-0 overflow-hidden bg-dv-ink [container-type:size]', className)}>
      {POCO_PINTADO ? (
        <CenaPintada longe={longe} balde={balde} baldeTipo={baldeTipo} girando={girando} ativo={ativo} moeda={moeda} brilho={trancado ? 0.12 : longe ? 0.9 : brilho} apagado={trancado} />
      ) : (
        <>
        {POCO_PINTURA.fundo ? (
          <img src={POCO_PINTURA.fundo} alt="" draggable={false} className="absolute inset-0 size-full object-cover object-bottom" />
        ) : (
          <>
            <Ceu />
            <Casas className={cn('poco-t absolute inset-x-0 top-[14%] h-[38%] w-full', longe ? 'opacity-95' : 'opacity-70')} />
            <Rua className="absolute inset-x-0 bottom-0 h-[58%] w-full" />
          </>
        )}
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
          <Poco balde={balde} baldeTipo={baldeTipo} girando={girando} ativo={ativo} moeda={moeda} brilho={trancado ? 0.12 : longe ? 0.9 : brilho} apagado={trancado} />
        </div>
        </>
      )}

      {/* figura encapuzada (o Corvo, nunca nomeado): silhueta sem rosto, dissolvida na névoa */}
      <Figura estado={figura ? 'visivel' : partiu ? 'partindo' : 'oculta'} base={figuraBase} />

      {POCO_PINTURA.nevoa ? (
        <img src={POCO_PINTURA.nevoa} alt="" draggable={false} className="poco-fog absolute -inset-x-1/4 bottom-[-4%] h-[40%] w-[150%] max-w-none object-cover opacity-80" />
      ) : (
        <>
          <Nevoa layer={1} className="bottom-[8%] opacity-70" />
          <Nevoa layer={2} className="bottom-[-6%] opacity-80" />
        </>
      )}
      {/* a mão: a cena se fecha e esfria (sem ilustrar o horror; o texto dá conta) */}
      <div className={cn('poco-t absolute inset-0 bg-[radial-gradient(60%_45%_at_60%_48%,transparent_0%,rgba(9,9,9,0.86)_70%,#050505_100%)]', palco === 'mao' ? 'opacity-100' : 'opacity-0')} />
      {/* vinheta: pedra nas bordas, um fundo vinho no pé */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_48%,rgba(9,9,9,0.8)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(30,27,43,0.6),transparent)]" />
      <div className="devo-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
      {trancado && <div className="absolute inset-0 bg-dv-ink/45" />}
    </div>
  )
}

/* ── Cena pintada (infra/arte): rua de barro + poço milenar, com a luz e os efeitos do app por cima ─── */

/**
 * A rua cobre a tela como `object-cover`, mas ancorada pela BASE DO POÇO: o pé do poço cai em
 * `--poco-base` (altura da tela; cada tela escolhe, para não ficar atrás dos botões). Abaixo do fim da
 * pintura, o barro some no abismo. Tudo em unidades de contêiner (cqw/cqh) da raiz da cena.
 */
function CenaPintada({ longe, balde, baldeTipo, girando, ativo, moeda, brilho, apagado }: { longe: boolean; balde: BaldePosicao; baldeTipo: string; girando: boolean; ativo: boolean; moeda: number; brilho: number; apagado: boolean }) {
  const C = POCO_PINTADO!
  const tipo = ['madeira', 'ferro', 'cobre', 'prata'].includes(baldeTipo) ? baldeTipo : 'madeira'
  // largura da moldura da rua: cobre a tela com folga; altura = largura / aspecto
  const W = 'max(100cqw, 72cqh)'
  const H = `calc(${W} / ${C.rua.aspecto})`
  const frame = {
    width: W,
    height: H,
    top: `calc(var(--poco-base, 70cqh) - ${C.baseY} * ${H})`,
  } as CSSProperties
  // o poço: largura em fração da rua; o pé encosta na base. Longe = menor e mais ao fundo da rua.
  const s = longe ? 0.5 : 1
  const poco = {
    left: `${C.baseX * 100}%`,
    top: `${(longe ? 0.66 : C.baseY) * 100}%`,
    width: `${C.largura * 100}%`,
    aspectRatio: `${C.poco.aspecto}`,
    transform: `translate(-50%, -${C.pe * 100}%) scale(${s})`,
    transformOrigin: `50% ${C.pe * 100}%`,
    '--brilho': brilho,
  } as CSSProperties
  return (
    <div className="absolute left-1/2 -translate-x-1/2" style={frame}>
      <img
        src={`${C.rua.base}-1024.webp`}
        srcSet={srcset(C.rua.base, C.rua.lados)}
        sizes="(max-width: 600px) 100vw, 768px"
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      {/* fim da pintura: o barro some no abismo (a tela pode ser mais alta que a rua) */}
      <div className="absolute inset-x-0 top-full h-[60%] bg-dv-ink" />
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-[linear-gradient(180deg,transparent,var(--dv-ink))]" />
      <Nevoa layer={0} className="top-[44%] opacity-50" />

      <div className={cn('poco-t absolute', (girando || ativo) && 'poco-ativo')} style={poco}>
        {/* luz da boca: prata fria com o pé vinho, atrás da pedra */}
        <span className="poco-aura absolute left-[-20%] top-[10%] h-[80%] w-[140%] bg-[radial-gradient(42%_40%_at_50%_55%,rgba(220,218,214,0.2),rgb(var(--dv-amethyst-rgb)/0.26)_55%,transparent_75%)]" />
        <img
          src={`${C.poco.base}-512.webp`}
          srcSet={srcset(C.poco.base, C.poco.lados)}
          sizes="(max-width: 600px) 60vw, 420px"
          alt=""
          draggable={false}
          className={cn('absolute inset-0 size-full', apagado && 'brightness-75 saturate-50')}
        />
        {/* névoa que pulsa na boca (camada da arte) */}
        <img src={C.brilho} alt="" draggable={false} className="poco-brilho-boca absolute left-[22%] top-[40%] h-[20%] w-[58%] max-w-none mix-blend-screen" />
        {/* balde subindo pela corda até a boca */}
        <div className="absolute overflow-hidden" style={{ left: `${(C.corda.x - 0.085) * 100}%`, top: `${C.corda.topo * 100}%`, width: '17%', height: `${(C.boca.y - C.corda.topo + 0.02) * 100}%` }}>
          <div
            className={cn('poco-bucket-pintado absolute inset-x-0', balde === 'subindo' && 'poco-bucket-sobe')}
            style={{ aspectRatio: '1 / 1', bottom: balde === 'fundo' ? '-70%' : '30%' }}
          >
            {/* o mesmo balde do gacha (ícone pintado do item), não um desenho à parte */}
            <img src={`${ART}/itens/balde-${tipo}-256.webp`} alt="" draggable={false} className="absolute inset-0 size-full object-contain" />
            {/* água escorrendo do balde enquanto sobe; pingos depois que chega à boca */}
            {balde !== 'fundo' && <AguaDoBalde forte={balde === 'subindo'} />}
          </div>
        </div>
        {/* partículas de névoa subindo da boca */}
        <div className="absolute left-[24%] top-[6%] h-[48%] w-[56%] overflow-hidden">
          {PARTICULAS.map((p, i) => (
            <span
              key={i}
              className="poco-particula absolute bottom-0 rotate-45 bg-[#e2e0dc]"
              style={{ left: `${p.x * 1.5 - 30}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` } as CSSProperties}
            />
          ))}
        </div>
        {/* oferendas no chão, à frente da pedra */}
        <Oferendas apagado={apagado} className="absolute left-[-14%] top-[83%] h-[22%] w-[90%]" />
        {moeda > 0 && <Lancamento key={moeda} agua={{ x: C.boca.x * 100, y: C.boca.y * 100 }} boca={C.boca.largura * 100 * 0.7} />}
      </div>
    </div>
  )
}

/**
 * Água que cai do balde: dois filetes finos que escorrem pela borda (só enquanto sobe) e gotas em queda com
 * aceleração, alongando no caminho, em tempos desencontrados. Só transform/opacidade; para com movimento reduzido.
 */
const GOTAS_BALDE = [
  { x: 22, d: 0, t: 900, s: 3 },
  { x: 74, d: 260, t: 1050, s: 2.5 },
  { x: 48, d: 520, t: 820, s: 3.5 },
  { x: 33, d: 780, t: 980, s: 2 },
  { x: 63, d: 1040, t: 880, s: 3 },
  { x: 80, d: 1300, t: 1120, s: 2 },
]
function AguaDoBalde({ forte }: { forte: boolean }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[88%] h-[260%]">
      {forte && (
        <>
          <span className="poco-filete absolute left-[24%] top-0 h-full w-[2px]" />
          <span className="poco-filete absolute left-[71%] top-0 h-full w-[1.5px]" style={{ animationDelay: '-400ms' } as CSSProperties} />
        </>
      )}
      {GOTAS_BALDE.slice(0, forte ? 6 : 3).map((g, i) => (
        <span
          key={i}
          className="poco-gota-cai absolute top-0 rounded-full"
          style={{ left: `${g.x}%`, width: g.s, height: g.s * 1.6, animationDelay: `${g.d * (forte ? 1 : 1.8)}ms`, animationDuration: `${forte ? g.t : g.t * 1.4}ms` } as CSSProperties}
        />
      ))}
    </span>
  )
}

/* ── Fundo ──────────────────────────────────────────────────────────────────────────────── */

/** Céu de neblina: pedra de névoa no alto, lua velada atrás da bruma, horizonte com um resto de vinho. */
function Ceu() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_28%,#2c2a2a_0%,#1a1818_42%,#090909_100%)]" />
      <div className="absolute inset-x-0 top-[26%] h-[30%] bg-[radial-gradient(70%_60%_at_50%_100%,rgba(78,69,128,0.32),transparent_75%)]" />
      {/* lua velada: disco de prata apagada com halo largo, quase engolido pela neblina */}
      <div className="poco-lua absolute right-[14%] top-[7%] size-[54px] rounded-full bg-[radial-gradient(circle_at_42%_40%,#d9d7d3,#a9a7a3_55%,#7d7b78)] opacity-55 blur-[1.5px]" />
      <div className="absolute right-[14%] top-[7%] size-[54px] scale-[4.2] rounded-full bg-[radial-gradient(closest-side,rgba(172,172,172,0.16),transparent)]" />
      <div className="absolute inset-x-0 top-[6%] h-[16%] bg-[linear-gradient(180deg,transparent,rgba(53,53,53,0.45)_45%,transparent)]" />
    </>
  )
}

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
          <stop offset="0" stopColor="#242222" />
          <stop offset="1" stopColor="#131111" />
        </linearGradient>
        <radialGradient id="poco-janela" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#b59a72" stopOpacity="0.5" />
          <stop offset="1" stopColor="#b59a72" stopOpacity="0" />
        </radialGradient>
      </defs>
      {casas.map((c, i) => {
        const base = 160
        const top = base - c.h
        const acesa = i === 2 || i === 5
        return (
          <g key={i}>
            <path d={`M${c.x} ${base}V${top + c.r}L${c.x + c.w / 2} ${top}L${c.x + c.w} ${top + c.r}V${base}Z`} fill="url(#poco-casa)" />
            <path d={`M${c.x - 3} ${top + c.r + 2}L${c.x + c.w / 2} ${top - 2}L${c.x + c.w + 3} ${top + c.r + 2}`} fill="none" stroke="#3a3737" strokeWidth="2" />
            {/* reboco gasto: duas linhas tortas por casa */}
            <path d={`M${c.x + 6} ${top + c.r + 30}h${c.w * 0.3}M${c.x + c.w * 0.5} ${top + c.r + 48}h${c.w * 0.36}`} stroke="#0d0c0c" strokeWidth="1" opacity="0.6" />
            {i % 2 === 0 && <rect x={c.x + c.w * 0.68} y={top + c.r * 0.2} width="6" height="14" fill="#1d1b1b" />}
            {acesa && <circle cx={c.x + c.w * 0.32 + 2.5} cy={top + c.r + 17.5} r="12" fill="url(#poco-janela)" className="poco-janela" />}
            <rect x={c.x + c.w * 0.32} y={top + c.r + 14} width="5" height="7" fill={acesa ? '#8c7756' : '#181616'} opacity={acesa ? 0.75 : 1} />
            {acesa && <path d={`M${c.x + c.w * 0.32 + 2.5} ${top + c.r + 14}v7M${c.x + c.w * 0.32} ${top + c.r + 17.5}h5`} stroke="#1a1716" strokeWidth="0.8" />}
          </g>
        )
      })}
    </svg>
  )
}

function Rua({ className }: { className?: string }) {
  // Rua de barro em perspectiva: sulcos de roda convergindo para o fim, onde o poço espera; poças refletem a lua.
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="poco-barro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#221d19" />
          <stop offset="0.5" stopColor="#2c241e" />
          <stop offset="1" stopColor="#17120f" />
        </linearGradient>
        <linearGradient id="poco-chao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1818" />
          <stop offset="1" stopColor="#0c0b0b" />
        </linearGradient>
        <linearGradient id="poco-poca" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#acacac" stopOpacity="0" />
          <stop offset="0.5" stopColor="#acacac" stopOpacity="0.22" />
          <stop offset="1" stopColor="#acacac" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#poco-chao)" />
      <path d="M176 0H224L400 300H0Z" fill="url(#poco-barro)" />
      {['M190 0L92 300', 'M196 0L140 300', 'M204 0L262 300', 'M210 0L310 300'].map((d) => (
        <path key={d} d={d} stroke="#100d0b" strokeWidth="2.2" opacity="0.7" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx={60 + ((i * 97) % 280)} cy={60 + ((i * 53) % 230)} rx={4 + (i % 4) * 2} ry={1.2 + (i % 3) * 0.6} fill="#100d0b" opacity="0.6" />
      ))}
      {/* poças rasas com o reflexo frio da lua */}
      <ellipse cx="128" cy="236" rx="34" ry="5" fill="#0e0c0b" />
      <ellipse cx="128" cy="235" rx="30" ry="3" fill="url(#poco-poca)" />
      <ellipse cx="282" cy="196" rx="22" ry="3.4" fill="#0e0c0b" />
      <ellipse cx="282" cy="195.4" rx="19" ry="2" fill="url(#poco-poca)" />
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
              ? 'radial-gradient(40% 50% at 30% 50%,rgba(172,172,172,0.26),transparent 70%),radial-gradient(35% 45% at 75% 40%,rgba(172,172,172,0.2),transparent 70%)'
              : layer === 1
                ? 'radial-gradient(45% 50% at 25% 60%,rgba(180,178,176,0.28),transparent 70%),radial-gradient(40% 50% at 70% 50%,rgba(172,170,168,0.24),transparent 72%)'
                : 'radial-gradient(55% 60% at 50% 70%,rgba(186,184,182,0.28),transparent 70%)',
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

function Poco({ balde, baldeTipo, girando, ativo, moeda, brilho, apagado }: { balde: BaldePosicao; baldeTipo: string; girando: boolean; ativo: boolean; moeda: number; brilho: number; apagado: boolean }) {
  const tipo = ['madeira', 'ferro', 'cobre', 'prata'].includes(baldeTipo) ? baldeTipo : 'madeira'
  return (
    <div className={cn('poco-stage relative', (girando || ativo) && 'poco-ativo')} style={{ aspectRatio: '400 / 500', height: 'var(--poco-h, min(64vh, 500px))', '--brilho': brilho } as CSSProperties}>
      {/* luz do poço: halo de prata fria com o pé vinho (a aura pintada entra dessaturada por cima) */}
      <span className="poco-aura absolute left-[-24%] top-[2%] h-[90%] w-[148%] bg-[radial-gradient(45%_42%_at_50%_58%,rgba(220,218,214,0.22),rgb(var(--dv-amethyst-rgb)/0.24)_55%,transparent_75%)]" />
      <img src={`${ART}/aura.webp`} alt="" draggable={false} className="poco-aura poco-dessatura absolute left-[-14%] top-[-6%] w-[128%] max-w-none opacity-70" />
      {/* anel astral: numerais e runas girando devagar (acelera na invocação) */}
      <div className="absolute left-[9%] top-[5.2%] w-[82%]">
        <img src={`${ART}/anel.webp`} alt="" draggable={false} className="poco-anel poco-dessatura block w-full opacity-50" />
      </div>
      {/* feixe de luar vindo do alto à direita (onde está a lua) */}
      <span className="poco-feixe absolute right-[-34%] top-[-24%] h-[100%] w-[70%] origin-top-right rotate-[22deg] bg-[linear-gradient(270deg,transparent,rgba(214,212,208,0.12)_45%,rgba(214,212,208,0.04)_70%,transparent)]" />

      {/* pátio de pedra gasta e a estela dos 500 anos (atrás da base) */}
      {POCO_PINTURA.patio ? (
        <img src={POCO_PINTURA.patio} alt="" draggable={false} className="absolute left-[-35%] top-[70%] w-[170%] max-w-none" />
      ) : (
        <>
          <Patio className="absolute left-[-35%] top-[76%] h-[40%] w-[170%]" />
          <Estela className="absolute left-[-5%] top-[62%] h-[34%] w-auto" />
        </>
      )}

      <img src={`${ART}/estrutura.webp`} alt="" draggable={false} className="poco-pedra absolute inset-0 w-full" />
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
      {/* partículas subindo da água */}
      <div className="absolute left-[18%] top-[18%] h-[52%] w-[64%] overflow-hidden">
        {PARTICULAS.map((p, i) => (
          <span
            key={i}
            className="poco-particula absolute bottom-0 rotate-45 bg-[#e2e0dc]"
            style={{ left: `${p.x * 1.5 - 30}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` } as CSSProperties}
          />
        ))}
      </div>
      <img src={`${ART}/base.webp`} alt="" draggable={false} className="poco-pedra absolute inset-0 w-full" />
      {/* inscrição gasta na borda de pedra (o poço tem nome e regra) */}
      <Inscricao className="absolute left-[19%] top-[86.5%] w-[62%]" />
      {/* roda da manivela (gira com a corrente) */}
      <div className="absolute left-[72.4%] top-[35.4%] w-[19.6%]">
        <img src={`${ART}/roda.webp`} alt="" draggable={false} className={cn('poco-roda poco-pedra block w-full', girando && 'poco-roda-on')} />
      </div>

      {/* oferendas de quem veio antes: velas, uma rosa vinho, moedas que ninguém foi buscar */}
      {POCO_PINTURA.frente ? (
        <img src={POCO_PINTURA.frente} alt="" draggable={false} className="absolute left-[-10%] top-[84%] w-[120%] max-w-none" />
      ) : (
        <Oferendas apagado={apagado} className="absolute left-[-10%] top-[86%] h-[24%] w-[120%]" />
      )}

      {/* a moeda lançada: arco, rastro, respingo e ondas */}
      {moeda > 0 && <Lancamento key={moeda} />}
    </div>
  )
}

/**
 * Arco da moeda (de baixo à esquerda, onde fica o botão Moeda, até a água), em unidades de contêiner
 * (cqw/cqh) para cair no mesmo ponto em qualquer altura de tela. Rastro = três cópias atrasadas.
 * Ao tocar a água (~900 ms): respingo pintado, três ondas, lampejo de prata e gotas.
 * `agua` = ponto da água em % da caixa; `boca` = largura da boca em % da caixa.
 */
function Lancamento({ agua = { x: 50, y: 65 }, boca = 40 }: { agua?: { x: number; y: number }; boca?: number }) {
  const x0 = 8
  const y0 = 128
  const vars = {
    '--ax': `${agua.x - x0}cqw`,
    '--ay': `${agua.y - y0}cqh`,
    '--apico': `${agua.y - y0 - 42}cqh`,
  } as CSSProperties
  return (
    <div className="pointer-events-none absolute inset-0 [container-type:size]" style={vars}>
      {[3, 2, 1, 0].map((k) => (
        <span key={k} className="poco-arco-x absolute" style={{ left: `${x0}%`, top: `${y0}%`, animationDelay: `${k * 34}ms` } as CSSProperties}>
          <span className="poco-arco-y block" style={{ animationDelay: `${k * 34}ms` } as CSSProperties}>
            <span
              className={cn('poco-arco-moeda block size-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbf6ec,#bab09f_45%,#5f584d)]', k === 0 ? 'shadow-[0_0_12px_rgba(236,229,216,0.75)]' : 'opacity-[var(--rastro)] blur-[1px]')}
              style={{ animationDelay: `${k * 34}ms`, '--rastro': 0.42 - k * 0.11 } as CSSProperties}
            />
          </span>
        </span>
      ))}
      {/* névoa que sobe da água depois do respingo */}
      <span className="poco-nevoa-sobe absolute rounded-[50%]" style={{ left: `${agua.x - boca * 0.6}%`, top: `${agua.y - 40}%`, width: `${boca * 1.2}%`, height: '42%' }} />
      {/* água: lampejo, ondas e respingo */}
      <span className="poco-lampejo absolute rounded-[50%] bg-[radial-gradient(closest-side,rgba(236,235,233,0.7),rgba(172,172,172,0.25)_50%,transparent)]" style={{ left: `${agua.x - boca * 0.7}%`, top: `${agua.y - 5}%`, width: `${boca * 1.4}%`, height: '14%' }} />
      {[0, 1, 2].map((i) => (
        <span key={i} className="poco-onda absolute rounded-[50%] border border-[#dcdad6]/70" style={{ left: `${agua.x - boca / 2}%`, top: `${agua.y - 3.5}%`, width: `${boca}%`, height: '7%', animationDelay: `${900 + i * 260}ms` } as CSSProperties} />
      ))}
      <img src={`${ART}/respingo.webp`} alt="" draggable={false} className="poco-respingo-moeda poco-dessatura absolute max-w-none" style={{ left: `${agua.x - boca * 0.58}%`, top: `${agua.y - 13}%`, width: `${boca * 1.16}%` }} />
      {[-3, -1.6, -0.6, 0.6, 1.7, 2.8].map((dx, i) => (
        <span key={i} className="poco-gota absolute size-[3px] rounded-full bg-[#e8e6e2]" style={{ left: `${agua.x}%`, top: `${agua.y - 1}%`, '--gx': `${dx * 9}px`, '--gy': `${-26 - (i % 3) * 12}px`, animationDelay: `${900 + i * 20}ms` } as CSSProperties} />
      ))}
    </div>
  )
}

/** Pátio: lajes de pedra gasta em elipse ao redor da base, rachaduras, musgo seco e poeira de barro na borda. */
function Patio({ className }: { className?: string }) {
  const lajes: string[] = []
  // anéis de lajes irregulares (determinístico)
  for (let anel = 0; anel < 3; anel++) {
    const rx0 = 150 + anel * 70
    const rx1 = rx0 + 66
    const ry = (r: number) => r * 0.27
    const n = 12 + anel * 4
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + anel * 0.21
      const a1 = ((i + 1) / n) * Math.PI * 2 + anel * 0.21 - 0.035
      const p = (r: number, a: number) => `${(340 + Math.cos(a) * r).toFixed(1)} ${(80 + Math.sin(a) * ry(r)).toFixed(1)}`
      lajes.push(`M${p(rx0, a0)}L${p(rx1, a0 + 0.01)}L${p(rx1, a1)}L${p(rx0, a1 - 0.01)}Z`)
    }
  }
  return (
    <svg viewBox="0 0 680 200" preserveAspectRatio="none" className={className}>
      <defs>
        <radialGradient id="poco-patio" cx="0.5" cy="0.4" r="0.55">
          <stop offset="0" stopColor="#3b3838" />
          <stop offset="0.55" stopColor="#262323" />
          <stop offset="1" stopColor="#141212" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="poco-patio-luz" cx="0.5" cy="0.35" r="0.5">
          <stop offset="0" stopColor="#dcdad6" stopOpacity="0.16" />
          <stop offset="1" stopColor="#dcdad6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="340" cy="80" rx="345" ry="100" fill="url(#poco-patio)" />
      {lajes.map((d, i) => (
        <path key={i} d={d} fill={i % 5 === 0 ? '#2b2828' : i % 3 === 0 ? '#353232' : '#302d2d'} stroke="#121010" strokeWidth="2.4" opacity={0.92 - (i % 4) * 0.08} />
      ))}
      {/* rachaduras e musgo seco */}
      <path d="M210 92l18 6 6 12 14 3M470 70l-14 9-4 13M300 128l12-4 9 7" stroke="#0d0c0c" strokeWidth="1.4" fill="none" />
      {[
        [196, 104],
        [492, 96],
        [410, 132],
        [262, 64],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={10 + i * 2} ry="3" fill="#3a3d33" opacity="0.45" />
      ))}
      <ellipse cx="340" cy="78" rx="230" ry="62" fill="url(#poco-patio-luz)" />
    </svg>
  )
}

/** Estela dos 500 anos: lápide de pedra gasta, lascada no alto, com a inscrição meio apagada. */
function Estela({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" className={className}>
      <defs>
        <linearGradient id="poco-estela" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2727" />
          <stop offset="0.45" stopColor="#474343" />
          <stop offset="1" stopColor="#1c1a1a" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="116" rx="30" ry="4" fill="#000" opacity="0.55" />
      <path d="M6 116V30C6 14 16 6 30 6c9 0 15 3 19 8l-4 5 6 2c2 3 3 6 3 9v86Z" fill="url(#poco-estela)" stroke="#121010" strokeWidth="1.2" />
      <path d="M10 112V32C10 19 18 11 30 11" fill="none" stroke="#6b6767" strokeWidth="0.7" opacity="0.5" />
      {/* inscrição: numeral grande e linhas gastas */}
      <text x="30" y="46" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="#121010" letterSpacing="1">D</text>
      <text x="30" y="45.4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="#8a8686" opacity="0.55" letterSpacing="1">D</text>
      <text x="30" y="57" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6.2" fill="#8a8686" opacity="0.5" letterSpacing="1.2">ANNI</text>
      {[66, 73, 80, 87].map((y, i) => (
        <path key={y} d={`M${15 + (i % 2) * 2} ${y}h${26 - (i % 3) * 5}`} stroke="#121010" strokeWidth="1.6" opacity={0.75 - i * 0.12} strokeDasharray={i === 2 ? '4 2 7 3' : undefined} />
      ))}
      <path d="M40 22l-6 14 3 9-5 11M14 92l8 6 2 9" stroke="#0e0c0c" strokeWidth="1" fill="none" />
      <ellipse cx="14" cy="112" rx="9" ry="3" fill="#3a3d33" opacity="0.5" />
    </svg>
  )
}

/** Inscrição circular na borda de pedra, quase apagada (lida pela metade — o resto o tempo comeu). */
function Inscricao({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 248 40" className={className}>
      <defs>
        <path id="poco-inscr" d="M8 8Q124 40 240 8" />
      </defs>
      <text fontFamily="Georgia, serif" fontSize="8.6" letterSpacing="2.2" fill="#0c0b0b" opacity="0.8">
        <textPath href="#poco-inscr" startOffset="50%" textAnchor="middle">
          · O QUE CAI NÃO VOLTA · NÃO DESÇA ·
        </textPath>
      </text>
      <text fontFamily="Georgia, serif" fontSize="8.6" letterSpacing="2.2" fill="#b4b0aa" opacity="0.32" transform="translate(0 -0.7)">
        <textPath href="#poco-inscr" startOffset="50%" textAnchor="middle">
          · O QUE CAI NÃO VOLTA · NÃO DESÇA ·
        </textPath>
      </text>
    </svg>
  )
}

/** Oferendas no chão, à frente da base: três velas (chama viva), uma rosa vinho caída e moedas esquecidas. */
function Oferendas({ className, apagado }: { className?: string; apagado: boolean }) {
  const velas = [
    { x: 92, h: 30, w: 9 },
    { x: 106, h: 20, w: 8 },
    { x: 382, h: 26, w: 9 },
  ]
  const moedas = [
    [150, 44],
    [168, 52],
    [304, 50],
    [330, 42],
    [262, 58],
  ]
  return (
    <svg viewBox="0 0 480 100" preserveAspectRatio="xMidYMin meet" className={className}>
      <defs>
        <radialGradient id="poco-vela-luz" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e8d3b0" stopOpacity="0.4" />
          <stop offset="0.4" stopColor="#b08a62" stopOpacity="0.14" />
          <stop offset="1" stopColor="#b08a62" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="poco-cera" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f8a82" />
          <stop offset="0.5" stopColor="#d6d1c8" />
          <stop offset="1" stopColor="#77726a" />
        </linearGradient>
        <radialGradient id="poco-moeda-chao" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.5" stopColor="#9a9080" />
          <stop offset="1" stopColor="#3e3a33" />
        </radialGradient>
      </defs>
      {/* velas */}
      {velas.map((v, i) => {
        const topo = 70 - v.h
        return (
          <g key={i}>
            {!apagado && <circle cx={v.x + v.w / 2} cy={topo - 6} r="34" fill="url(#poco-vela-luz)" className="poco-vela-luz" style={{ animationDelay: `${i * 0.7}s` } as CSSProperties} />}
            <ellipse cx={v.x + v.w / 2} cy="71" rx={v.w * 0.9} ry="2.4" fill="#000" opacity="0.6" />
            <path d={`M${v.x} 71V${topo + 2}q${v.w / 2} -3 ${v.w} 0V71Z`} fill="url(#poco-cera)" />
            {/* cera escorrida */}
            <path d={`M${v.x + 1} ${topo + 2}q1 6 0 ${8 + i * 3}`} stroke="#e4e0d8" strokeWidth="1.4" fill="none" opacity="0.7" />
            <path d={`M${v.x + v.w / 2} ${topo}v-3`} stroke="#141212" strokeWidth="0.9" />
            {!apagado && (
              <g className="dv-flame" style={{ transformOrigin: `${v.x + v.w / 2}px ${topo - 3}px`, animationDelay: `${i * 0.5}s` } as CSSProperties}>
                <path d={`M${v.x + v.w / 2} ${topo - 14}q4 6 0 11q-4 -5 0 -11Z`} fill="#f1e2c4" opacity="0.95" />
                <path d={`M${v.x + v.w / 2} ${topo - 9}q1.8 3 0 5.6q-1.8 -2.6 0 -5.6Z`} fill="#fff8ea" />
              </g>
            )}
          </g>
        )
      })}
      {/* rosa vinho caída (como na referência da paleta), haste com folhas secas */}
      <g transform="translate(206 52) rotate(-8)">
        <path d="M-2 10C10 14 34 16 58 12" stroke="#2b3027" strokeWidth="2" fill="none" />
        <path d="M22 13q5 -8 12 -6q-4 7 -12 6Z" fill="#30352b" />
        <path d="M40 13q3 6 10 6q-2 -7 -10 -6Z" fill="#2b2f26" />
        <circle cx="-6" cy="6" r="9.5" fill="#3a2f5c" />
        <path d="M-14 4q4 -9 12 -7q6 2 6 9q-6 -6 -12 -3Z" fill="#5a4f8f" />
        <path d="M-10 9q4 -6 9 -4q3 2 2 6q-5 -4 -11 -2Z" fill="#8a7cc8" />
        <path d="M-5 4q2 -2 4 0" stroke="#1e1b2b" strokeWidth="1" fill="none" />
        <path d="M-12 1q2 -3 5 -3" stroke="#a46670" strokeWidth="0.7" fill="none" opacity="0.6" />
      </g>
      {/* moedas esquecidas, com um brilho que vem e vai */}
      {moedas.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 1.4} rx="6" ry="2" fill="#000" opacity="0.5" />
          <ellipse cx={x} cy={y} rx="5.6" ry="2.4" fill="url(#poco-moeda-chao)" />
          {i % 2 === 0 && !apagado && <path className="poco-cintila" d={`M${x - 1} ${y - 4}l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1z`} fill="#fbf6ec" style={{ animationDelay: `${i * 1.3}s` } as CSSProperties} />}
        </g>
      ))}
    </svg>
  )
}

function Figura({ estado, base }: { estado: 'oculta' | 'visivel' | 'partindo'; base?: { bottom: number; espaco: number } | null }) {
  return (
    <svg
      viewBox="0 0 120 320"
      // com a caixa de fala medida, o manto (que se dissolve no pé) passa por trás do topo da caixa, sem vão
      style={base ? { bottom: base.bottom - 28, height: `min(46%, ${base.espaco + 28}px)` } : undefined}
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
          <stop offset="0" stopColor="#7c7a78" stopOpacity="0" />
          <stop offset="0.85" stopColor="#7c7a78" stopOpacity="0" />
          <stop offset="1" stopColor="#c4c2bf" stopOpacity="0.35" />
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
        <path d="M16 10.5L20 16L16 21.5L12 16Z" fill="#8a7cc8" stroke="#4e4580" strokeWidth="0.8" />
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
