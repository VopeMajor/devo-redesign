'use client'

import { type CSSProperties, useId } from 'react'
import { BRASAO_COR, type Brasao, type BrasaoCor, type BrasaoDivisao, type BrasaoForma, type BrasaoOrnamento, type BrasaoSimbolo } from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'

/**
 * Brasão/sinete de uma Corporação, gerado a partir de forma + cor da paleta (escolhidos na fundação) e da
 * inicial do nome. SVG procedural: campo na cor escolhida (gradiente do próprio material) com losangos gravados,
 * aro de aço champanhe duplo, filete de pontos, bisel e a estrela de 4 pontas do sigilo (com raios) no topo. `necro` racha o campo e pinga uma gota de rubi (só alerta).
 */

const STAR = (cx: number, cy: number, r: number, k = 0.24) =>
  `M${cx} ${cy - r}L${cx + r * k} ${cy - r * k}L${cx + r} ${cy}L${cx + r * k} ${cy + r * k}L${cx} ${cy + r}L${cx - r * k} ${cy + r * k}L${cx - r} ${cy}L${cx - r * k} ${cy - r * k}Z`

/** Contorno de cada forma num quadro 100×120 (centro ≈ 50,62). */
const FORMA: Record<BrasaoForma, string> = {
  escudo: 'M50 10L86 22V58Q86 94 50 112Q14 94 14 58V22Z',
  losango: 'M50 8L92 62L50 116L8 62Z',
  estrela: STAR(50, 62, 50, 0.42),
  sol: (() => {
    const pts: string[] = []
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 48 : 38
      pts.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(62 + Math.sin(a) * r).toFixed(2)}`)
    }
    return `M${pts.join('L')}Z`
  })(),
  coroa: 'M14 40L30 56L40 26L50 46L60 26L70 56L86 40L80 104Q50 114 20 104Z',
  chave: 'M50 8A28 28 0 0 1 57 63.1V84H69V93H57V100H65V109H57V116H43V63.1A28 28 0 0 1 50 8Z',
  lua: 'M64 14A48 48 0 1 0 64 110A56 56 0 0 1 64 14Z',
  relogio: 'M50 18A45 45 0 1 1 49.99 18Z M43 6H57V18H43Z',
  ampulheta: 'M18 8H82V18L58 62L82 106V116H18V106L42 62L18 18Z',
  torre: 'M16 8H30V20H43V8H57V20H70V8H84V36L74 46V104L84 116H16L26 104V46L16 36Z',
  cruz: 'M36 8H64L58 40L92 34V76L58 70L64 116H36L42 70L8 76V34L42 40Z',
  rosa: 'M50 26Q73.73 4.72 75.46 36.54Q107.28 38.27 86 62Q107.28 85.73 75.46 87.46Q73.73 119.28 50 98Q26.27 119.28 24.54 87.46Q-7.28 85.73 14 62Q-7.28 38.27 24.54 36.54Q26.27 4.72 50 26Z',
}

/** Onde fica a inicial (o centro visual de cada forma). */
const CENTRO: Record<BrasaoForma, { x: number; y: number; s: number }> = {
  escudo: { x: 50, y: 66, s: 40 },
  losango: { x: 50, y: 64, s: 36 },
  estrela: { x: 50, y: 64, s: 30 },
  sol: { x: 50, y: 64, s: 36 },
  coroa: { x: 50, y: 82, s: 34 },
  chave: { x: 50, y: 38, s: 30 },
  lua: { x: 27, y: 62, s: 22 },
  relogio: { x: 50, y: 64, s: 38 },
  ampulheta: { x: 50, y: 94, s: 24 },
  torre: { x: 50, y: 76, s: 34 },
  cruz: { x: 50, y: 55, s: 24 },
  rosa: { x: 50, y: 63, s: 34 },
}

/** Figuras (em heráldica, "móveis") num quadro 48×48: `d` na cor da figura, `furos` na cor do campo, `detalhe` por cima. */
const FIGURA: Record<Exclude<BrasaoSimbolo, 'inicial'>, { d: string; furos?: string; detalhe?: string }> = {
  olho: {
    d: 'M3 24Q24 4 45 24Q24 44 3 24Z',
    furos: 'M24 15.5a8.5 8.5 0 1 0 0.01 0Z',
    detalhe: 'M24 19a5 5 0 1 0 0.01 0Z M24 7v4 M14 10l2.4 3.4 M34 10l-2.4 3.4',
  },
  chave: { d: 'M24 2a10 10 0 1 1-0.01 0Z M21.4 21.4H26.6V35H33V39.5H26.6V41H31V45H26.6V46H21.4Z', furos: 'M24 7.5a4.5 4.5 0 1 0 0.01 0Z' },
  ampulheta: {
    d: 'M10 3H38V8H35Q35 18 27 24Q35 30 35 40H38V45H10V40H13Q13 30 21 24Q13 18 13 8H10Z',
    furos: 'M16.5 8H31.5Q31.5 16 25 22H23Q16.5 16 16.5 8Z M23 26H25Q31.5 32 31.5 40H16.5Q16.5 32 23 26Z',
    detalhe: 'M19 40Q24 33 29 40Z M21 12H27Q25.5 16 24 17Q22.5 16 21 12Z',
  },
  espada: { d: 'M24 1L27.5 7V31H34V35H27V40.5a3.5 3.5 0 1 1-6 0V35H14V31H20.5V7Z', furos: 'M23.3 8H24.7V30H23.3Z' },
  rosa: {
    d: 'M24 6a7.5 7.5 0 0 1 7 4.8a7.5 7.5 0 0 1 6.6 11a7.5 7.5 0 0 1-4.3 10.8a7.5 7.5 0 0 1-9.3 5.6a7.5 7.5 0 0 1-9.3-5.6a7.5 7.5 0 0 1-4.3-10.8a7.5 7.5 0 0 1 6.6-11A7.5 7.5 0 0 1 24 6Z',
    furos: 'M24 15a7 7 0 1 0 0.01 0Z',
    detalhe: 'M24 18.5a3.5 3.5 0 1 0 0.01 0Z M22.5 38V47H25.5V38Z',
  },
  lua: { d: 'M30 3A21 21 0 1 0 30 45A24.5 24.5 0 0 1 30 3Z', detalhe: 'M38 12l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z' },
  coroa: { d: 'M4 14L13 25L17 8L24 21L31 8L35 25L44 14L39 38H9Z M9 40H39V45H9Z', furos: 'M21.5 30a2.5 2.5 0 1 0 0.01 0Z M12.5 31a1.8 1.8 0 1 0 0.01 0Z M33.5 31a1.8 1.8 0 1 0 0.01 0Z' },
  relogio: {
    d: 'M24 6a20 20 0 1 1-0.01 0Z M20.5 1H27.5V6H20.5Z',
    furos: 'M24 10a16 16 0 1 0 0.01 0Z',
    detalhe: 'M23.2 26V13.5H24.8V26Z M23.6 25.4L32.5 30.2L31.8 31.6L22.9 26.8Z M24 23.6a2.4 2.4 0 1 0 0.01 0Z M24 11.4v2.4 M24 38.2v2.4 M9.4 26h2.4 M36.2 26h2.4',
  },
  torre: { d: 'M9 3H16V9H20.5V3H27.5V9H32V3H39V16L35 20V40L39 45H9L13 40V20L9 16Z', furos: 'M20.5 45V35Q24 30 27.5 35V45Z M22.6 21H25.4V28H22.6Z' },
  mascara: {
    d: 'M3 15Q13 9 24 15Q35 9 45 15Q44 30 33.5 31Q27 31.4 24 26Q21 31.4 14.5 31Q4 30 3 15Z M22 30Q24 36 26 30Q26 40 24 46Q22 40 22 30Z',
    furos: 'M9 18.6Q14 15.6 19.6 19.4Q14 23 9 18.6Z M39 18.6Q34 15.6 28.4 19.4Q34 23 39 18.6Z',
  },
  estrela: {
    d: 'M24 1Q26.5 21.5 47 24Q26.5 26.5 24 47Q21.5 26.5 1 24Q21.5 21.5 24 1Z',
    detalhe: 'M24 17a7 7 0 1 0 0.01 0Z',
  },
  corvo: {
    d: 'M5 32Q8 19 21 16L31 7L30.5 14.5Q39 15 45 22L37.5 23Q36 32 27 35.5L22 45L19.8 36Q9.5 37 5 32Z',
    furos: 'M33.5 18.5a1.8 1.8 0 1 0 0.01 0Z',
  },
}

/** Cores claras pedem figura escura (tinta); as escuras, figura de aço. */
const CLARAS = new Set<BrasaoCor>(['aco', 'porcelana', 'marfim', 'prata'])

/** Partes do campo na segunda cor, por divisão (quadro 100×124). */
const DIVISAO: Record<Exclude<BrasaoDivisao, 'pleno'>, { area: string; linha: string }> = {
  partido: { area: 'M50 -5H110V130H50Z', linha: 'M50 -5V130' },
  cortado: { area: 'M-10 62H110V130H-10Z', linha: 'M-10 62H110' },
  quartelado: { area: 'M50 -5H110V62H50Z M-10 62H50V130H-10Z', linha: 'M50 -5V130 M-10 62H110' },
  banda: { area: 'M-10 6L8 -12L112 106L94 124Z', linha: 'M-10 6L8 -12 M94 124L112 106' },
  chaveirao: { area: 'M-10 104L50 44L110 104V128L50 68L-10 128Z', linha: 'M-10 104L50 44L110 104 M-10 128L50 68L110 128' },
  faixa: { area: 'M-10 50H110V76H-10Z', linha: 'M-10 50H110 M-10 76H110' },
}

/** Ornamentos atrás do brasão (podem sair do quadro: o SVG é overflow-visible). */
function Ornamento({ tipo, aco, tinta }: { tipo: BrasaoOrnamento; aco: string; tinta: string }) {
  if (tipo === 'nenhum') return null
  if (tipo === 'raios')
    return (
      <g opacity="0.85">
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2
          const r1 = 50
          const r2 = i % 2 ? 66 : 76
          const w = i % 2 ? 2 : 3.2
          const p = (r: number, da: number) => `${(50 + Math.cos(a + da) * r).toFixed(2)} ${(62 + Math.sin(a + da) * r).toFixed(2)}`
          return <path key={i} d={`M${p(r1, -w / r1)}L${p(r2, 0)}L${p(r1, w / r1)}Z`} fill={aco} />
        })}
      </g>
    )
  if (tipo === 'correntes')
    return (
      <g fill="none" stroke={aco} strokeWidth="2.2">
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2
          const x = 50 + Math.cos(a) * 60
          const y = 62 + Math.sin(a) * 66
          return <ellipse key={i} cx={x} cy={y} rx={i % 2 ? 6 : 3.4} ry={i % 2 ? 3.4 : 6} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />
        })}
      </g>
    )
  if (tipo === 'espadas')
    return (
      <g>
        {[-1, 1].map((lado) => (
          <g key={lado} transform={`rotate(${lado * 38} 50 66)`}>
            <path d="M50 -24L54 -16V112H46V-16Z" fill={aco} stroke={tinta} strokeOpacity="0.5" strokeWidth="0.6" />
            <path d="M49.4 -14H50.6V108H49.4Z" fill="#fff" opacity="0.35" />
            <path d="M36 112H64V117H36Z" fill={aco} stroke={tinta} strokeOpacity="0.5" strokeWidth="0.6" />
            <path d="M47 117H53V132H47Z" fill="#3a2f2a" />
            <circle cx="50" cy="135" r="4.5" fill={aco} />
          </g>
        ))}
      </g>
    )
  if (tipo === 'asas')
    return (
      <g>
        {[-1, 1].map((lado) => (
          <g key={lado} transform={lado === 1 ? 'translate(100 0) scale(-1 1)' : undefined}>
            {/* asa aberta: borda de cima em arco e penas recortadas embaixo */}
            <path
              d="M26 40C14 26 -6 12 -30 4C-25 14 -26 22 -20 27C-29 30 -27 38 -19 41C-27 45 -24 53 -15 54C-21 60 -16 67 -7 65C-10 72 -1 76 7 71C8 78 17 79 22 72C24 76 28 76 30 70Z"
              fill={aco}
              stroke={tinta}
              strokeOpacity="0.5"
              strokeWidth="0.7"
            />
            <path
              d="M24 46C12 38 -4 30 -22 26M24 52C12 46 -2 42 -16 41M24 58C14 54 2 54 -8 55M25 63C18 62 10 64 2 66M27 67C22 68 17 70 13 72"
              fill="none"
              stroke={tinta}
              strokeOpacity="0.45"
              strokeWidth="0.7"
            />
            <path d="M20 36C8 24 -8 14 -24 8" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
          </g>
        ))}
      </g>
    )
  // louros: dois ramos que sobem da base até a altura dos ombros
  const ramo = (t: number) => {
    const a = { x: 50, y: 126 }
    const b = { x: -10, y: 118 }
    const c = { x: -4, y: 22 }
    const u = 1 - t
    const x = u * u * a.x + 2 * u * t * b.x + t * t * c.x
    const y = u * u * a.y + 2 * u * t * b.y + t * t * c.y
    const dx = 2 * u * (b.x - a.x) + 2 * t * (c.x - b.x)
    const dy = 2 * u * (b.y - a.y) + 2 * t * (c.y - b.y)
    return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI }
  }
  return (
    <g>
      {[-1, 1].map((lado) => (
        <g key={lado} transform={lado === 1 ? 'translate(100 0) scale(-1 1)' : undefined}>
          <path d="M50 126Q-10 118 -4 22" fill="none" stroke={aco} strokeWidth="2" />
          {Array.from({ length: 12 }, (_, i) => {
            const t = 0.1 + (i / 11) * 0.86
            const p = ramo(t)
            const tam = 15 - t * 5
            return (
              <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.ang.toFixed(1)})`}>
                {/* folha de fora e folha de dentro, alternadas */}
                <path d={`M0 0Q${tam * 0.45} ${-tam * 0.42} ${tam} ${-tam * 0.34}Q${tam * 0.5} ${tam * 0.02} 0 0Z`} transform="rotate(-28)" fill={aco} stroke={tinta} strokeOpacity="0.45" strokeWidth="0.5" />
                <path d={`M0 0Q${tam * 0.45} ${tam * 0.42} ${tam * 0.9} ${tam * 0.3}Q${tam * 0.45} ${-tam * 0.02} 0 0Z`} transform="rotate(30)" fill={aco} opacity="0.9" stroke={tinta} strokeOpacity="0.4" strokeWidth="0.5" />
              </g>
            )
          })}
          <path d="M-4 22l2.2-6 2.6 5.6Z" fill={aco} />
        </g>
      ))}
    </g>
  )
}

/** Fita com o lema embaixo do brasão. */
function Fita({ lema, id, aco, tinta }: { lema: string; id: string; aco: string; tinta: string }) {
  const tam = Math.max(4.2, Math.min(7, 150 / Math.max(10, lema.length)))
  return (
    <g>
      <path d="M-4 112L8 108V124L-8 126L-2 118Z M104 112L92 108V124L108 126L102 118Z" fill={aco} opacity="0.7" stroke={tinta} strokeOpacity="0.4" strokeWidth="0.5" />
      <path d="M6 108Q50 120 94 108V122Q50 134 6 122Z" fill={aco} stroke={tinta} strokeOpacity="0.5" strokeWidth="0.6" />
      <path id={`fita${id}`} d="M8 117Q50 128.6 92 117" fill="none" />
      <text fontFamily="var(--font-display), Cinzel, serif" fontWeight={600} fontSize={tam} letterSpacing="0.6" fill="#1a1712" textAnchor="middle">
        <textPath href={`#fita${id}`} startOffset="50%" dominantBaseline="central">
          {lema.toLocaleUpperCase('pt-BR')}
        </textPath>
      </text>
    </g>
  )
}

export function BrasaoCorp({
  brasao,
  necro = false,
  className,
  title,
  style,
  lema,
}: {
  brasao: Brasao
  necro?: boolean
  className?: string
  style?: CSSProperties
  /** Nome acessível; sem ele o desenho é decorativo. */
  title?: string
  /** Lema na fita embaixo (só nos tamanhos grandes). */
  lema?: string | null
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const cor = BRASAO_COR[brasao.cor]
  const divisao = brasao.divisao ?? 'pleno'
  const cor2 = divisao !== 'pleno' && brasao.cor2 ? BRASAO_COR[brasao.cor2] : null
  const simbolo = brasao.simbolo ?? 'inicial'
  const ornamento = brasao.ornamento ?? 'nenhum'
  const d = FORMA[brasao.forma]
  const c = CENTRO[brasao.forma]
  const figura = simbolo === 'inicial' ? null : FIGURA[simbolo]
  const clara = CLARAS.has(brasao.cor)
  const corFigura = clara ? cor.tinta : `url(#a${id})`
  // tamanho da figura: a mesma "caixa" que a inicial ocupa, um pouco maior
  const lado = c.s * 1.15
  return (
    <svg viewBox="0 0 100 124" className={cn('overflow-visible', className)} style={style} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`f${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={cor.claro} />
          <stop offset="0.5" stopColor={cor.meio} />
          <stop offset="1" stopColor={cor.escuro} />
        </linearGradient>
        {cor2 && (
          <linearGradient id={`g${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor={cor2.claro} />
            <stop offset="0.5" stopColor={cor2.meio} />
            <stop offset="1" stopColor={cor2.escuro} />
          </linearGradient>
        )}
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.45" stopColor="#bab09f" />
          <stop offset="0.7" stopColor="#6b6357" />
          <stop offset="1" stopColor="#dcd5c8" />
        </linearGradient>
        <radialGradient id={`l${id}`} cx="0.35" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <path d={d} fillRule="evenodd" />
        </clipPath>
      </defs>
      <Ornamento tipo={ornamento} aco={`url(#a${id})`} tinta="#2a251f" />
      {/* sombra projetada */}
      <path d={d} fillRule="evenodd" fill="#000" opacity="0.55" transform="translate(0 3)" />
      {/* aro externo fino, afastado do campo */}
      <path d={d} fillRule="evenodd" fill="none" stroke={`url(#a${id})`} strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" transform="translate(50 62) scale(1.09) translate(-50 -62)" />
      {/* campo */}
      <path d={d} fillRule="evenodd" fill={`url(#f${id})`} />
      <g clipPath={`url(#c${id})`}>
        {cor2 && divisao !== 'pleno' && (
          <>
            <path d={DIVISAO[divisao].area} fill={`url(#g${id})`} />
            <path d={DIVISAO[divisao].linha} fill="none" stroke={`url(#a${id})`} strokeWidth="1.6" />
          </>
        )}
        {/* losangos gravados no campo (heráldica: "diapré") */}
        <path
          d={Array.from({ length: 13 }, (_, i) => `M${i * 12 - 60} 0L${i * 12 + 64} 124M${i * 12 + 64} 0L${i * 12 - 60} 124`).join('')}
          fill="none"
          stroke={cor.tinta}
          strokeOpacity="0.07"
          strokeWidth="0.7"
        />
        {/* veios do material */}
        <path d="M-4 40C22 30 30 62 58 50S96 70 108 58" fill="none" stroke={cor.tinta} strokeOpacity="0.12" strokeWidth="1.2" />
        <path d="M-6 88C20 80 44 100 70 86S100 98 110 90" fill="none" stroke={cor.tinta} strokeOpacity="0.1" strokeWidth="0.9" />
        <rect x="0" y="0" width="100" height="124" fill={`url(#l${id})`} />
        {necro && (
          <path d="M58 6L50 34L60 46L44 70L54 84L46 118" fill="none" stroke="#0c0c0e" strokeWidth="2.4" strokeLinejoin="bevel" opacity="0.85" />
        )}
      </g>
      {/* aro de aço */}
      <path d={d} fillRule="evenodd" fill="none" stroke={`url(#a${id})`} strokeWidth="3.2" strokeLinejoin="round" />
      <path d={d} fillRule="evenodd" fill="none" stroke={cor.tinta} strokeOpacity="0.35" strokeWidth="0.8" transform="translate(50 62) scale(0.88) translate(-50 -62)" />
      {/* filete de pontos gravados */}
      <path d={d} fillRule="evenodd" fill="none" stroke={cor.claro} strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 3.6" transform="translate(50 62) scale(0.8) translate(-50 -62)" />
      {/* brilho do bisel (luz do alto à esquerda) */}
      <path d={d} fillRule="evenodd" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.7" transform="translate(-0.8 -0.8)" clipPath={`url(#c${id})`} />
      {figura ? (
        <g transform={`translate(${c.x - lado / 2} ${c.y - lado / 2}) scale(${lado / 48})`}>
          {/* contorno escuro: a figura se lê sobre qualquer divisão */}
          <path d={figura.d} fill="none" stroke="#14110d" strokeOpacity="0.55" strokeWidth={48 / lado * 1.6} strokeLinejoin="round" />
          <path d={figura.d} fill={corFigura} />
          {figura.furos && <path d={figura.furos} fill={cor2 && divisao !== 'pleno' ? '#14110d' : cor.meio} opacity={cor2 && divisao !== 'pleno' ? 0.55 : 1} />}
          {figura.detalhe && <path d={figura.detalhe} fill={corFigura} stroke={corFigura} strokeWidth="1.4" strokeLinecap="round" />}
        </g>
      ) : (
        <text
          x={c.x}
          y={c.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-display), Cinzel, serif"
          fontWeight={600}
          fontSize={c.s}
          fill={cor.tinta}
          style={{ paintOrder: 'stroke' }}
          stroke={cor.claro}
          strokeOpacity="0.25"
          strokeWidth="0.6"
        >
          {brasao.inicial}
        </text>
      )}
      {/* estrela do sigilo, com raios finos */}
      {(() => {
        const sy = brasao.forma === 'relogio' ? 1.5 : brasao.forma === 'rosa' ? 2.5 : brasao.forma === 'losango' || brasao.forma === 'estrela' || brasao.forma === 'sol' ? 4 : 5
        return (
          <g>
            <path d={STAR(50, sy, 11, 0.06)} fill={`url(#a${id})`} opacity="0.55" />
            <path d={STAR(50, sy, 7, 0.24)} fill={`url(#a${id})`} stroke="#3a352e" strokeWidth="0.4" />
            <circle cx={50} cy={sy} r={1.4} fill={cor.claro} />
          </g>
        )
      })()}
      {lema && <Fita lema={lema} id={id} aco={`url(#a${id})`} tinta="#2a251f" />}
      {necro && <path d="M78 96C78 96 72 104 72 108A6 6 0 0 0 84 108C84 104 78 96 78 96Z" fill="#a3121f" stroke="#3f060b" strokeWidth="0.8" />}
    </svg>
  )
}

/** Brasão num nicho: halo (ametista, ou rubi na Necro) e dois hexágonos finos da Companhia atrás. */
export function NichoBrasao({
  brasao,
  necro = false,
  title,
  tamanho = 112,
  className,
  lema,
}: {
  brasao: Brasao
  necro?: boolean
  title?: string
  tamanho?: number
  className?: string
  lema?: string | null
}) {
  const w = tamanho
  const h = Math.round(tamanho * 1.25)
  // ornamento e fita saem do quadro: o escudo encolhe para caber tudo no nicho
  const k = (brasao.ornamento && brasao.ornamento !== 'nenhum' ? 0.62 : 0.8) * (lema ? 0.92 : 1)
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: w, height: h }}>
      <span aria-hidden="true" className={cn('absolute inset-0 rounded-full blur-md', necro ? 'bg-[radial-gradient(circle,rgb(var(--dv-blood-rgb)/0.35),transparent_68%)]' : 'bg-[radial-gradient(circle,rgb(var(--dv-amethyst-rgb)/0.3),transparent_68%)]')} />
      <svg aria-hidden="true" viewBox="0 0 112 140" className="absolute inset-0 size-full">
        <path d="M56 6 104 34v72L56 134 8 106V34Z" fill="none" stroke="#d6cdbd" strokeOpacity="0.18" />
        <path d="M56 14 97 38v64l-41 24-41-24V38Z" fill="none" stroke="#d6cdbd" strokeOpacity="0.1" strokeDasharray="2 4" />
      </svg>
      <BrasaoCorp brasao={brasao} necro={necro} title={title} lema={lema} className="animate-dv-pop relative drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)]" style={{ width: w * k, height: h * k }} />
    </span>
  )
}
