'use client'

import type { ReactNode } from 'react'
import { MAPA_H, MAPA_W, starPath } from './arte'
import { voluta } from './ornamentos'

/**
 * Cenário do mapa das Torres em camadas (de trás para a frente): cidade de agulhas ao longe, feixe de luar,
 * ilha de pedra suspensa com o piso de mármore, cerca de ferro forjado com cordões de luz, postes, portão e
 * a moldura de ferro em primeiro plano. Tudo vetorial + duas texturas raster (céu e névoa) leves.
 */

export const ILHA = { cx: MAPA_W / 2, cy: 470, rx: 178, ry: 88 }

/** Ponto na borda da ilha no ângulo `a` (graus; 0 = direita, 90 = frente). */
export function bordaIlha(a: number, k = 1) {
  const t = (a * Math.PI) / 180
  return { x: ILHA.cx + Math.cos(t) * ILHA.rx * k, y: ILHA.cy + Math.sin(t) * ILHA.ry * k }
}

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Cidade de agulhas góticas no horizonte (silhueta em duas profundidades). */
export function CidadeAoLonge() {
  const r = rng(11)
  const camada = (y: number, cor: string, n: number, hMax: number, op: number) => {
    const els: ReactNode[] = []
    for (let i = 0; i < n; i++) {
      const x = 8 + (i / (n - 1)) * (MAPA_W - 16) + (r() - 0.5) * 14
      const h = 18 + r() * hMax
      const w = 5 + r() * 7
      els.push(
        <g key={i}>
          <path d={`M${x - w} ${y}V${y - h}L${x} ${y - h - w * 2.6}L${x + w} ${y - h}V${y}Z`} fill={cor} />
          {r() > 0.55 && <rect x={x - 1} y={y - h * 0.6} width={2} height={3} fill="#ece5d8" opacity={0.35 * op} />}
          {r() > 0.6 && <path d={`M${x - w - 3} ${y}V${y - h * 0.55}L${x - w - 1.5} ${y - h * 0.55 - 5}L${x - w} ${y - h * 0.55}V${y}Z`} fill={cor} />}
        </g>,
      )
    }
    return els
  }
  return (
    <g>
      <g opacity={0.9}>{camada(352, '#1b1a21', 22, 48, 0.6)}</g>
      <path d="M0 340Q60 330 120 338T240 336T390 340V372H0Z" fill="#16151b" />
      <g>{camada(370, '#121116', 16, 30, 1)}</g>
      <rect y={366} width={MAPA_W} height={40} fill="#0f0e13" />
    </g>
  )
}

/** Feixe de luar diagonal (luz direcionada sobre a torre principal). */
export function Feixe() {
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      <linearGradient id="tw-feixe" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.2" />
        <stop offset="0.6" stopColor="#c2b9ec" stopOpacity="0.06" />
        <stop offset="1" stopColor="#c2b9ec" stopOpacity="0" />
      </linearGradient>
      <path d="M20 40L110 20L330 520L150 560Z" fill="url(#tw-feixe)" />
      <path d="M70 30L95 25L250 470L210 480Z" fill="url(#tw-feixe)" opacity={0.7} />
    </g>
  )
}

/** Ilha de pedra suspensa: base rochosa com estalactites e o tampo xadrez de mármore. */
export function Ilha({ caminhos }: { caminhos: { x: number; y: number }[] }) {
  const { cx, cy, rx, ry } = ILHA
  const r = rng(5)
  // contorno de baixo da rocha (irregular)
  const pts: string[] = []
  const n = 22
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = cx - rx + t * rx * 2
    const base = cy + Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * ry
    const fundo = base + 18 + Math.sin(t * Math.PI) * 70 + (i % 2 ? 22 : 0) * Math.sin(t * Math.PI) + r() * 10
    pts.push(`L${x.toFixed(1)} ${fundo.toFixed(1)}`)
  }
  const gate = bordaIlha(90, 0.93)
  return (
    <g>
      <pattern id="tw-rocha" width="256" height="256" patternUnits="userSpaceOnUse">
        <image href="/images/torres/rocha.webp" width="256" height="256" />
      </pattern>
      <linearGradient id="tw-rocha-luz" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.22" />
        <stop offset="0.4" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.85" />
      </linearGradient>
      <pattern id="tw-checker" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`translate(${cx} ${cy}) scale(1 0.5) rotate(45)`}>
        <rect width="22" height="22" fill="#2e2e33" />
        <rect width="11" height="11" fill="#55555c" />
        <rect x="11" y="11" width="11" height="11" fill="#55555c" />
        <path d="M0 0H22V22" stroke="#8f8676" strokeWidth="0.5" fill="none" opacity="0.55" />
      </pattern>
      <radialGradient id="tw-plaza-light" cx="0.4" cy="0.25" r="0.8">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.28" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.6" />
      </radialGradient>
      {/* rocha */}
      <path d={`M${cx - rx} ${cy}${pts.join('')}L${cx + rx} ${cy}Z`} fill="url(#tw-rocha)" />
      <path d={`M${cx - rx} ${cy}${pts.join('')}L${cx + rx} ${cy}Z`} fill="url(#tw-rocha-luz)" />
      {/* correntes penduradas sob a ilha */}
      {[-0.55, 0.62].map((k) => {
        const x = cx + k * rx
        return (
          <g key={k}>
            <path d={`M${x} ${cy + 40}V${cy + 120}`} stroke="#5f584d" strokeWidth={1.2} strokeDasharray="3 2" />
            <circle cx={x} cy={cy + 128} r={8} fill="url(#tw-halo)" className="tw-flicker" />
            <path d={`M${x - 3} ${cy + 121}H${x + 3}L${x + 2} ${cy + 131}H${x - 2}Z`} fill="#ece5d8" />
          </g>
        )
      })}
      {/* aro de pedra e tampo */}
      <path d={`M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${cy + 14}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy + 14}Z`} fill="#1f1f22" />
      <path d={`M${cx - rx} ${cy + 14}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 14}`} stroke="url(#tw-steel)" strokeWidth={1.2} fill="none" opacity={0.7} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-checker)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-plaza-light)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="url(#tw-steel)" strokeWidth={2.2} />
      <ellipse cx={cx} cy={cy} rx={rx - 9} ry={ry - 5} fill="none" stroke="#bab09f" strokeWidth={0.6} opacity={0.5} strokeDasharray="1 5" />
      {/* rosa dos ventos no centro do piso */}
      <g transform={`translate(${cx} ${cy + 22}) scale(1 0.5)`} opacity={0.5}>
        <circle r={30} fill="none" stroke="#bab09f" strokeWidth={1} />
        <path d={starPath(0, 0, 28, 0.16)} fill="#8f8676" />
        <path d={starPath(0, 0, 18, 0.2)} fill="#ece5d8" transform="rotate(45)" opacity={0.6} />
      </g>
      {/* caminhos de mármore branco com bordas de aço */}
      {caminhos.map((p, i) => {
        const mx = (gate.x + p.x) / 2 + (p.x - gate.x) * 0.08
        const my = (gate.y + p.y) / 2 + 10
        return (
          <g key={i}>
            <path d={`M${gate.x - 10} ${gate.y}Q${mx - 8} ${my} ${p.x - 9} ${p.y + 5}L${p.x + 9} ${p.y + 5}Q${mx + 8} ${my} ${gate.x + 10} ${gate.y}Z`} fill="#e9e6e0" opacity={0.42} />
            <path d={`M${gate.x - 10} ${gate.y}Q${mx - 8} ${my} ${p.x - 9} ${p.y + 5}M${p.x + 9} ${p.y + 5}Q${mx + 8} ${my} ${gate.x + 10} ${gate.y}`} stroke="#bab09f" strokeWidth={0.8} fill="none" opacity={0.8} />
          </g>
        )
      })}
    </g>
  )
}

/** Poste de luz de ferro com lanterna (base em 0,0). */
export function Poste({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0V-30" stroke="#2c2c31" strokeWidth={2.4} />
      <path d="M0 0V-30" stroke="#8f8676" strokeWidth={0.6} />
      <path d={voluta(0, -26, 3, 1)} fill="none" stroke="#6b6357" strokeWidth={0.9} />
      <circle cx={0} cy={-36} r={11} fill="url(#tw-halo)" className="tw-flicker" />
      <path d="M-3.2 -32H3.2L2.6 -40H-2.6Z" fill="#fffaf0" stroke="#6b6357" strokeWidth={0.6} />
      <path d="M-3.8 -40.5H3.8L0 -44Z" fill="#38393c" />
    </g>
  )
}

/**
 * Cerca de ferro forjado em volta da ilha com cordões de luz entre os postes. `parte`: 'tras' (atrás das
 * torres) ou 'frente' (na frente delas).
 */
export function Cerca({ parte }: { parte: 'tras' | 'frente' }) {
  const angs = parte === 'tras' ? [180, 198, 216, 234, 252, 270, 288, 306, 324, 342, 360] : [0, 18, 36, 54, 72, 108, 126, 144, 162, 180]
  const postes = angs.map((a) => ({ a, ...bordaIlha(a, 0.985) }))
  const h = parte === 'tras' ? 12 : 17
  const els: ReactNode[] = []
  for (let i = 0; i < postes.length - 1; i++) {
    const p = postes[i]
    const q = postes[i + 1]
    if (Math.abs(q.a - p.a) > 20) continue // abertura do portão
    // grade: barras
    const nb = 6
    for (let b = 1; b < nb; b++) {
      const t = b / nb
      const x = p.x + (q.x - p.x) * t
      const y = p.y + (q.y - p.y) * t
      els.push(<path key={`b${i}-${b}`} d={`M${x} ${y}V${y - h * 0.82}`} stroke="#4a4a50" strokeWidth={0.9} />)
      els.push(<path key={`p${i}-${b}`} d={`M${x - 1} ${y - h * 0.82}L${x} ${y - h * 0.82 - 2.6}L${x + 1} ${y - h * 0.82}Z`} fill="#8f8676" />)
    }
    els.push(<path key={`r${i}`} d={`M${p.x} ${p.y - h * 0.62}L${q.x} ${q.y - h * 0.62}`} stroke="#6b6357" strokeWidth={1} />)
    // cordão de luz (catenária) entre os topos dos postes
    const mx = (p.x + q.x) / 2
    const my = (p.y + q.y) / 2 - h + 7
    els.push(<path key={`c${i}`} d={`M${p.x} ${p.y - h}Q${mx} ${my + 6} ${q.x} ${q.y - h}`} stroke="#5f584d" strokeWidth={0.5} fill="none" />)
    for (let k = 1; k < 5; k++) {
      const t = k / 5
      const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * q.x
      const y = (1 - t) * (1 - t) * (p.y - h) + 2 * (1 - t) * t * (my + 6) + t * t * (q.y - h)
      els.push(
        <g key={`l${i}-${k}`} className="tw-bulb" style={{ animationDelay: `${((i * 5 + k) % 7) * 0.5}s` }}>
          <circle cx={x} cy={y} r={3.2} fill="url(#tw-halo)" />
          <circle cx={x} cy={y} r={0.9} fill="#fffaf0" />
        </g>,
      )
    }
  }
  postes.forEach((p, i) =>
    els.push(
      <g key={`pt${i}`}>
        <path d={`M${p.x} ${p.y}V${p.y - h}`} stroke="#2c2c31" strokeWidth={2.4} />
        <path d={`M${p.x - 0.6} ${p.y}V${p.y - h}`} stroke="#8f8676" strokeWidth={0.6} />
        <path d={starPath(p.x, p.y - h - 3, 3, 0.2)} fill="url(#tw-steel)" />
      </g>,
    ),
  )
  return <g>{els}</g>
}

/** Portão de ferro forjado na frente da ilha (arco com volutas e estrela). */
export function Portao() {
  const { x, y } = bordaIlha(90, 0.98)
  return (
    <g transform={`translate(${x} ${y})`}>
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 24 - 3} y={-40} width={6} height={40} fill="#1f1f22" stroke="#6b6357" strokeWidth={0.8} />
          <path d={starPath(s * 24, -46, 5, 0.2)} fill="url(#tw-steel)" />
          <circle cx={s * 24} cy={-52} r={10} fill="url(#tw-halo)" className="tw-flicker" />
          <path d={voluta(s * 21, -20, 6, -s)} fill="none" stroke="#bab09f" strokeWidth={1.1} />
        </g>
      ))}
      <path d="M-21 -32Q0 -58 21 -32" stroke="url(#tw-steel)" strokeWidth={2} fill="none" />
      <path d="M-21 -28Q0 -50 21 -28" stroke="#6b6357" strokeWidth={0.8} fill="none" />
      {[-15, -9, -3, 3, 9, 15].map((bx) => (
        <path key={bx} d={`M${bx} 0V${-30 - (15 - Math.abs(bx)) * 1.1}`} stroke="#8f8676" strokeWidth={0.9} />
      ))}
      <path d={voluta(-2, -36, 5, -1)} fill="none" stroke="#bab09f" strokeWidth={1} />
      <path d={voluta(2, -36, 5, 1)} fill="none" stroke="#bab09f" strokeWidth={1} />
      <path d={starPath(0, -56, 7, 0.18)} fill="url(#tw-steel)" />
    </g>
  )
}

/** Moldura de ferro em primeiro plano (galhos e volutas escuras nos cantos de baixo): profundidade. */
export function MolduraFrente() {
  return (
    <g fill="none" stroke="#070708" strokeLinecap="round">
      {/* galho seco à esquerda */}
      <path d={`M-6 ${MAPA_H - 40}C40 ${MAPA_H - 70} 54 ${MAPA_H - 120} 46 ${MAPA_H - 170}`} strokeWidth={7} />
      <path d={`M30 ${MAPA_H - 100}C52 ${MAPA_H - 116} 70 ${MAPA_H - 112} 84 ${MAPA_H - 128}`} strokeWidth={3.5} />
      <path d={`M44 ${MAPA_H - 150}C30 ${MAPA_H - 170} 24 ${MAPA_H - 196} 30 ${MAPA_H - 214}`} strokeWidth={2.4} />
      <path d={`M60 ${MAPA_H - 116}C68 ${MAPA_H - 136} 82 ${MAPA_H - 142} 92 ${MAPA_H - 140}`} strokeWidth={1.6} />
      {/* volutas de ferro à direita */}
      <path d={`M${MAPA_W + 6} ${MAPA_H - 30}C${MAPA_W - 30} ${MAPA_H - 40} ${MAPA_W - 46} ${MAPA_H - 70} ${MAPA_W - 40} ${MAPA_H - 96}`} strokeWidth={5} />
      <path d={voluta(MAPA_W - 40, MAPA_H - 96, 10, -1)} strokeWidth={3} />
      <path d={voluta(MAPA_W - 22, MAPA_H - 40, 8, -1, -1)} strokeWidth={2.4} />
      <path d={`M${MAPA_W - 34} ${MAPA_H - 70}L${MAPA_W - 46} ${MAPA_H - 92}L${MAPA_W - 32} ${MAPA_H - 86}`} fill="#070708" strokeWidth={1} />
    </g>
  )
}
