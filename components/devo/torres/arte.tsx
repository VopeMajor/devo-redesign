'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { Arte } from '@/lib/devo/torres/tipos'
import { voluta } from './ornamentos'
import { Agulheta, Arcobotante, Balaustrada, CataVentoGalo, Cilindro, Coroa, Cornija, type EstadoJanela, EstruturasDefs, Estandarte, Gargula, Oculo, Pinaculo, Portal, Prisma, Rosacea, Vitral } from './estruturas'

/**
 * Ilustração procedural das Torres de Ruptura (SVG, sem imagens externas): mármore branco e negro com veios,
 * aço champanhe nos filetes, janelas que acendem com os andares vencidos e um toque pequeno de ametista no
 * andar atual. Paleta: IDENTIDADE.md §0. A noite violeta é só atmosfera.
 */

/* ------------------------------------------------------------------ Definições compartilhadas */

export function TorresDefs() {
  return (
    <>
    <EstruturasDefs />
    <defs>
      {/* mármore branco iluminado pela lua (luz da esquerda) */}
      <linearGradient id="tw-white" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#f4f3f1" />
        <stop offset="0.38" stopColor="#dedcd7" />
        <stop offset="0.72" stopColor="#9d9b96" />
        <stop offset="1" stopColor="#55545a" />
      </linearGradient>
      <linearGradient id="tw-white-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="1" stopColor="#0c0c0e" stopOpacity="0.4" />
      </linearGradient>
      {/* mármore negro */}
      <linearGradient id="tw-black" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#57575d" />
        <stop offset="0.35" stopColor="#38393c" />
        <stop offset="0.75" stopColor="#1f1f22" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <linearGradient id="tw-slate" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#4a4a52" />
        <stop offset="0.5" stopColor="#25252a" />
        <stop offset="1" stopColor="#0e0e10" />
      </linearGradient>
      {/* aço champanhe */}
      <linearGradient id="tw-steel" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#f4efe6" />
        <stop offset="0.3" stopColor="#ece5d8" />
        <stop offset="0.6" stopColor="#bab09f" />
        <stop offset="1" stopColor="#5f584d" />
      </linearGradient>
      <linearGradient id="tw-steel-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ece5d8" />
        <stop offset="1" stopColor="#6b6357" />
      </linearGradient>
      <radialGradient id="tw-dome" cx="0.32" cy="0.25" r="0.9">
        <stop offset="0" stopColor="#f4efe6" />
        <stop offset="0.35" stopColor="#bab09f" />
        <stop offset="0.8" stopColor="#4a453d" />
        <stop offset="1" stopColor="#1f1f22" />
      </radialGradient>
      {/* sombra de cilindro por cima de listras */}
      <linearGradient id="tw-cyl" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.7" stopColor="#000000" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.75" />
      </linearGradient>
      {/* janela acesa (porcelana quente) e janela do andar atual (ametista pequena) */}
      <radialGradient id="tw-lit" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.55" stopColor="#ece5d8" />
        <stop offset="1" stopColor="#8f8676" />
      </radialGradient>
      <radialGradient id="tw-cur" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#e6e0ff" />
        <stop offset="0.6" stopColor="#8a7cc8" />
        <stop offset="1" stopColor="#4e4580" />
      </radialGradient>
      <radialGradient id="tw-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ece5d8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="tw-halo-am" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#8a7cc8" stopOpacity="0.6" />
        <stop offset="1" stopColor="#8a7cc8" stopOpacity="0" />
      </radialGradient>
      <pattern id="tw-stripes" width="12" height="10" patternUnits="userSpaceOnUse">
        <rect width="6" height="10" fill="#ebe9e4" />
        <rect x="6" width="6" height="10" fill="#18181b" />
      </pattern>
      <filter id="tw-blur-s" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <filter id="tw-blur-l" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
    </>
  )
}

/* ------------------------------------------------------------------ Peças */

/** Estrela de quatro pontas do sigilo (path centrado em x,y). */
export function starPath(x: number, y: number, r: number, w = 0.22) {
  const k = r * w
  return `M${x} ${y - r}C${x + k * 0.4} ${y - k} ${x + k} ${y - k * 0.4} ${x + r} ${y}C${x + k} ${y + k * 0.4} ${x + k * 0.4} ${y + k} ${x} ${y + r}C${x - k * 0.4} ${y + k} ${x - k} ${y + k * 0.4} ${x - r} ${y}C${x - k} ${y - k * 0.4} ${x - k * 0.4} ${y - k} ${x} ${y - r}Z`
}

/* ------------------------------------------------------------------ Torres (base no ponto 0,0; sobem para y negativo) */

/** Altura e largura de cada desenho em unidades (escala 1). */
export const ALTURA_ARTE: Record<Arte, number> = { agulha: 440, palacio: 296, observatorio: 280, picadeiro: 292 }
export const LARGURA_ARTE: Record<Arte, number> = { agulha: 140, palacio: 180, observatorio: 100, picadeiro: 116 }

const jan = (i: number, feitos: number, total: number): EstadoJanela => (i < feitos ? 'acesa' : i === feitos && i < total ? 'atual' : 'apagada')

function Sombra({ w }: { w: number }) {
  return <ellipse cx={0} cy={2} rx={w * 1.15} ry={8} fill="#000" opacity={0.6} filter="url(#tw-blur-s)" />
}

/** Torre principal (campanha): catedral-agulha gótica com arcobotantes, rosácea, galerias, mostrador e pináculo em escamas. */
function Agulha({ feitos, total, destaque }: { feitos: number; total: number; destaque: boolean }) {
  const J = (i: number) => jan(i, feitos, total)
  return (
    <g>
      <Sombra w={64} />
      <Prisma yb={0} yt={-10} w={66} tex="negra" />
      <Prisma yb={-10} yt={-18} w={60} />
      {[-1, 1].map((s) => (
        <Arcobotante key={s} s={s} xp={58} yp={-18} xw={40} yw={-118} h={64} />
      ))}
      {/* corpo baixo */}
      <Prisma yb={-18} yt={-150} w={42} wt={37}>
        <g transform="translate(0 -18)">
          <Portal w={18} h={34} aceso={feitos > 0} />
        </g>
        <Rosacea x={0} y={-98} r={10} acesa={feitos > 0} />
        {total > 0 && <Vitral x={-25} y={-56} w={7} h={24} estado={J(0)} />}
        {total > 1 && <Vitral x={25} y={-56} w={7} h={24} estado={J(1)} />}
        {total > 2 && <Vitral x={0} y={-118} w={9} h={22} estado={J(2)} />}
      </Prisma>
      {[-1, 1].map((s) => (
        <Estandarte key={s} x={s * 31} y={-148} h={42} emblema={<path d={starPath(0, 0, 4.4)} fill="#ece5d8" />} />
      ))}
      <Cornija y={-156} w={47} />
      <Balaustrada y={-156} w={44} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <Gargula x={s * 46} y={-151} s={s} />
          <Agulheta x={s * 44} yb={-164} h={32} w={3.4} />
          <Agulheta x={s * 24} yb={-164} h={18} w={2.4} />
        </g>
      ))}
      {/* corpo médio */}
      <Prisma yb={-160} yt={-252} w={32} wt={28}>
        {total > 3 && <Vitral x={-13} y={-180} w={7} h={28} estado={J(3)} />}
        {total > 4 && <Vitral x={13} y={-180} w={7} h={28} estado={J(4)} />}
        {total > 5 && <Vitral x={0} y={-218} w={8} h={22} estado={J(5)} />}
      </Prisma>
      <Cornija y={-256} w={34} />
      <Balaustrada y={-256} w={32} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <Gargula x={s * 33} y={-251} s={s} k={0.8} />
          <Agulheta x={s * 31} yb={-264} h={28} w={3} />
        </g>
      ))}
      {/* lanterna com mostrador */}
      <Prisma yb={-260} yt={-316} w={22} wt={20}>
        <circle cx={0} cy={-288} r={14} fill="url(#tx-branca)" />
        <circle cx={0} cy={-288} r={12} fill="#0c0c0e" stroke="url(#tw-steel)" strokeWidth={1.4} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <path key={i} d={`M${Math.sin(a) * 9} ${-288 - Math.cos(a) * 9}L${Math.sin(a) * 11} ${-288 - Math.cos(a) * 11}`} stroke="#bab09f" strokeWidth={i % 3 === 0 ? 1.3 : 0.6} />
        })}
        <path d="M0 -288L0 -296M0 -288L5 -285" stroke="#ece5d8" strokeWidth={1.1} strokeLinecap="round" />
      </Prisma>
      <Cornija y={-320} w={25} alta={5} />
      {/* pináculo em escamas */}
      <Pinaculo
        yb={-320}
        h={106}
        w={25}
        crochets={5}
        remate={
          <g>
            {destaque && <circle cx={0} cy={-436} r={22} fill="url(#tw-halo-am)" className="tw-pulse" />}
            <path d={starPath(0, -436, 10)} fill="url(#tw-steel)" />
          </g>
        }
      />
      {total > 6 && <Vitral x={0} y={-338} w={6} h={13} estado={J(6)} />}
      {total > 7 && <Vitral x={0} y={-362} w={4} h={9} estado={J(7)} />}
    </g>
  )
}

/** Torre do Imperador (do Galo): palácio com torreões, coroa de ameias, cúpula em escamas e cata-vento de galo. */
function Palacio({ feitos, total }: { feitos: number; total: number }) {
  const J = (i: number) => jan(i, feitos, total)
  return (
    <g>
      <Sombra w={80} />
      <Prisma yb={0} yt={-10} w={82} tex="negra" />
      {/* torreões */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 56} 0)`}>
          <Cilindro yb={-10} yt={-176} w={17} wt={15} tex="branca" aneis={[-64, -126]} />
          <Cornija y={-180} w={19} alta={5} />
          <Pinaculo yb={-182} h={64} w={20} crochets={3} remate={<g><path d="M0 -246V-262" stroke="url(#tw-steel)" strokeWidth={1} /><path d="M0 -262L12 -258L0 -254Z" fill="#ece5d8" /></g>} />
          {total > 3 + (s > 0 ? 1 : 0) && <Oculo x={0} y={-100} r={6} estado={J(3 + (s > 0 ? 1 : 0))} />}
          {total > 5 + (s > 0 ? 1 : 0) && <Vitral x={0} y={-150} w={5} h={14} estado={J(5 + (s > 0 ? 1 : 0))} />}
        </g>
      ))}
      {/* corpo do palácio */}
      <Prisma yb={-10} yt={-150} w={42} wt={40}>
        <g transform="translate(0 -10)">
          <Portal w={18} h={32} aceso={feitos > 0} />
        </g>
        {/* brasão com a coroa sobre o portal */}
        <g transform="translate(0 -66)">
          <path d="M-8 -8H8V2Q8 9 0 12Q-8 9 -8 2Z" fill="url(#tw-steel)" />
          <path d="M-6 -6H6V2Q6 7 0 9.6Q-6 7 -6 2Z" fill="#2b2547" />
          <path d="M-4 1L-4 -3L-2 -1L0 -4L2 -1L4 -3L4 1Z" fill="#ece5d8" />
        </g>
        {total > 0 && <Vitral x={-25} y={-44} w={8} h={24} estado={J(0)} />}
        {total > 1 && <Vitral x={25} y={-44} w={8} h={24} estado={J(1)} />}
        {total > 2 && <Vitral x={0} y={-110} w={11} h={30} estado={J(2)} />}
      </Prisma>
      <Cornija y={-154} w={46} />
      <Balaustrada y={-154} w={44} />
      {[-1, 1].map((s) => (
        <Gargula key={s} x={s * 45} y={-149} s={s} />
      ))}
      {/* andar nobre com coroa */}
      <Prisma yb={-158} yt={-212} w={32} wt={31}>
        {[-18, -6, 6, 18].map((x) => (
          <path key={x} d={`M${x - 2.5} -168V-188Q${x - 2.5} -194 ${x} -196Q${x + 2.5} -194 ${x + 2.5} -188V-168Z`} fill="#0b0b10" opacity={0.8} />
        ))}
      </Prisma>
      <Coroa y={-212} w={32} />
      {/* cúpula em escamas */}
      <path d="M-24 -218C-25 -246 -9 -258 0 -272C9 -258 25 -246 24 -218Z" fill="url(#tx-telha)" />
      <path d="M-24 -218C-25 -246 -9 -258 0 -272C9 -258 25 -246 24 -218Z" fill="url(#sh-telha)" />
      {[-12, 0, 12].map((x) => (
        <path key={x} d={`M${x} -218Q${x * 0.6} -250 0 -270`} stroke="#bab09f" strokeWidth={0.6} fill="none" opacity={0.6} />
      ))}
      <CataVentoGalo x={0} y={-272} />
      {/* estandartes com estrela */}
      {[-1, 1].map((s) => (
        <Estandarte key={s} x={s * 33} y={-148} h={34} emblema={<path d={starPath(0, 0, 3.6)} fill="#ece5d8" />} />
      ))}
    </g>
  )
}

/** Torre do Observatório: fuste redondo de pedra negra, galeria de ferro, cúpula de aço com fresta, luneta e esfera armilar. */
function Observatorio({ feitos, total }: { feitos: number; total: number }) {
  const J = (i: number) => jan(i, feitos, total)
  const slots: [number, number][] = [
    [0, -40],
    [0, -92],
    [0, -150],
    [-15, -120],
    [15, -120],
    [-15, -64],
    [15, -64],
    [0, -178],
  ]
  return (
    <g>
      <Sombra w={42} />
      <Prisma yb={0} yt={-10} w={44} tex="negra" />
      <Prisma yb={-10} yt={-18} w={38} />
      <Cilindro yb={-18} yt={-200} w={28} wt={25} tex="negra" aneis={[-70, -134]} />
      {/* contrafortes */}
      {[-20, 20].map((x) => (
        <g key={x}>
          <path d={`M${x - 2.5} -18L${x * 0.92 - 2} -196H${x * 0.92 + 2}L${x + 2.5} -18Z`} fill="url(#tx-branca)" />
          <path d={`M${x - 2.5} -18L${x * 0.92 - 2} -196H${x * 0.92 + 2}L${x + 2.5} -18Z`} fill={x > 0 ? '#000' : '#fff'} opacity={x > 0 ? 0.45 : 0.08} />
        </g>
      ))}
      {slots.slice(0, total).map(([x, y], i) => (
        <Oculo key={i} x={x} y={y} r={6} estado={J(i)} />
      ))}
      {/* galeria */}
      <Cornija y={-204} w={36} alta={5} />
      <ellipse cx={0} cy={-206} rx={38} ry={6} fill="#151517" stroke="url(#tw-steel)" strokeWidth={1} />
      {Array.from({ length: 13 }, (_, i) => -33 + i * 5.5).map((x) => (
        <path key={x} d={`M${x} -206V-216`} stroke="#bab09f" strokeWidth={0.7} />
      ))}
      <path d="M-37 -216Q0 -209 37 -216" stroke="url(#tw-steel)" strokeWidth={1.2} fill="none" />
      {[-1, 1].map((s) => (
        <path key={s} d={voluta(s * 26, -200, 5, s, -1)} fill="none" stroke="url(#tw-steel)" strokeWidth={1.2} strokeLinecap="round" />
      ))}
      {/* cúpula */}
      <path d="M-30 -214A30 30 0 0 1 30 -214Z" fill="url(#tw-dome)" />
      {[-18, -6, 6, 18].map((x) => (
        <path key={x} d={`M0 -244Q${x * 0.9} -240 ${x * 1.55} -214`} stroke="#4a453d" strokeWidth={0.7} fill="none" />
      ))}
      <path d="M-4 -243L4 -243L6 -214L-6 -214Z" fill="#0c0c0e" />
      <path d="M0 -242V-215" stroke="#8a7cc8" strokeWidth={0.8} opacity={0.75} />
      <g transform="rotate(-38 0 -232)">
        <rect x={-3.2} y={-270} width={6.4} height={40} rx={1} fill="url(#tw-steel)" />
        <rect x={-4.4} y={-272} width={8.8} height={5} rx={1} fill="url(#tw-steel-v)" />
      </g>
      <g transform="translate(-14 -246)">
        <path d="M0 6V0" stroke="url(#tw-steel)" strokeWidth={1.4} />
        <circle cy={-8} r={8} fill="none" stroke="url(#tw-steel)" strokeWidth={1.2} />
        <ellipse cy={-8} rx={8} ry={3} fill="none" stroke="#bab09f" strokeWidth={0.8} />
        <ellipse cy={-8} rx={3} ry={8} fill="none" stroke="#bab09f" strokeWidth={0.8} transform="rotate(30 0 -8)" />
        <circle cy={-8} r={1.8} fill="#8a7cc8" />
      </g>
      <g transform="translate(36 -204)">
        <path d="M0 0V10" stroke="#6b6357" strokeWidth={0.8} />
        <circle cy={16} r={8} fill="url(#tw-halo)" className="tw-flicker" />
        <path d="M-3 10H3L4 19H-4Z" fill="#ece5d8" stroke="#6b6357" strokeWidth={0.6} />
      </g>
    </g>
  )
}

/** Torre do Picadeiro: base de pedra branca, tambor de lona listrada com dobras, sanefa, cobertura cônica, bandeirolas e luzes. */
function Picadeiro({ feitos, total }: { feitos: number; total: number }) {
  const J = (i: number) => jan(i, feitos, total)
  const n = 12
  const wedges = Array.from({ length: n }, (_, k) => {
    const x0 = -52 + (104 / n) * k
    const x1 = x0 + 104 / n
    const luz = 1 - k / n
    return (
      <g key={k}>
        <path d={`M0 -272L${x0} -158Q${(x0 + x1) / 2} -154 ${x1} -158Z`} fill={k % 2 ? '#1a1a1e' : '#ebe9e4'} />
        <path d={`M0 -272L${x0} -158Q${(x0 + x1) / 2} -154 ${x1} -158Z`} fill="#0b0b12" opacity={0.08 + (1 - luz) * 0.55} />
      </g>
    )
  })
  const listras = Array.from({ length: 10 }, (_, k) => {
    const x0 = -32 + 6.4 * k
    return (
      <g key={k}>
        <path d={`M${x0} -20L${x0 + 0.3} -152H${x0 + 6.7}L${x0 + 6.4} -20Z`} fill={k % 2 ? '#1a1a1e' : '#ebe9e4'} />
        <path d={`M${x0 + 3.2} -20L${x0 + 3.4} -152`} stroke="#000" strokeWidth={0.6} opacity={0.18} />
      </g>
    )
  })
  const slots: [number, number][] = [
    [0, -50],
    [-16, -78],
    [16, -78],
    [0, -106],
    [-16, -132],
    [16, -132],
    [-16, -50],
    [16, -50],
  ]
  return (
    <g>
      <Sombra w={50} />
      <Prisma yb={0} yt={-10} w={50} tex="negra" />
      <Prisma yb={-10} yt={-20} w={44} />
      <g>{listras}</g>
      <path d="M-32 -20L-32 -152H32L32 -20Z" fill="url(#sh-cil)" />
      <g transform="translate(0 -20)">
        <Portal w={14} h={26} aceso={feitos > 0} />
      </g>
      {slots.slice(0, total).map(([x, y], i) => (
        <Vitral key={i} x={x} y={y} w={6} h={14} estado={J(i)} />
      ))}
      <g>{wedges}</g>
      <path d="M0 -272L-52 -158" stroke="#ece5d8" strokeWidth={0.8} opacity={0.5} />
      {Array.from({ length: n }, (_, k) => {
        const x0 = -52 + (104 / n) * k
        const x1 = x0 + 104 / n
        return <path key={k} d={`M${x0} -158Q${(x0 + x1) / 2} -147 ${x1} -158Z`} fill={k % 2 ? '#ebe9e4' : '#1a1a1e'} stroke="#8f8676" strokeWidth={0.4} />
      })}
      {Array.from({ length: n + 1 }, (_, k) => -52 + (104 / n) * k).map((x, k) => (
        <g key={k} className="tw-bulb" style={{ animationDelay: `${(k % 4) * 0.6}s` }}>
          <circle cx={x} cy={-158} r={4} fill="url(#tw-halo)" />
          <circle cx={x} cy={-158} r={1.3} fill="#fffaf0" />
        </g>
      ))}
      <rect x={-33} y={-160} width={66} height={3} fill="url(#tw-steel)" />
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M0 -272Q${s * 40} -222 ${s * 70} -124`} stroke="#6b6357" strokeWidth={0.6} fill="none" />
          {[0.18, 0.34, 0.5, 0.66, 0.82].map((t, i) => {
            const x = s * (2 * (1 - t) * t * 40 + t * t * 70)
            const y = (1 - t) * (1 - t) * -272 + 2 * (1 - t) * t * -222 + t * t * -124
            return <path key={t} d={`M${x - 3} ${y}L${x + 3} ${y}L${x} ${y + 7}Z`} fill={i % 2 ? '#ebe9e4' : '#4e4580'} />
          })}
        </g>
      ))}
      <path d="M0 -272V-292" stroke="url(#tw-steel)" strokeWidth={1.4} />
      <path d="M0 -292L18 -286L0 -280Z" fill="#ebe9e4" />
      <path d={starPath(0, -295, 4)} fill="url(#tw-steel)" />
    </g>
  )
}

/** Uma torre, com a base em (0,0). `feitos` acende vitrais; `destaque` dá o halo ametista no topo. */
export function TorreArte({ arte, feitos, total, destaque = false }: { arte: Arte; feitos: number; total: number; destaque?: boolean }) {
  if (arte === 'observatorio') return <Observatorio feitos={feitos} total={total} />
  if (arte === 'picadeiro') return <Picadeiro feitos={feitos} total={total} />
  if (arte === 'palacio') return <Palacio feitos={feitos} total={total} />
  return <Agulha feitos={feitos} total={total} destaque={destaque} />
}

/* ------------------------------------------------------------------ Cenário do mapa */

export const MAPA_W = 390
export const MAPA_H = 640

/** Pseudo-aleatório determinístico (mesmo céu em toda captura). */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const STARS = (() => {
  const r = rng(42)
  return Array.from({ length: 56 }, () => ({ x: r() * MAPA_W, y: r() * 300, s: 0.4 + r() * 1.1, d: r() * 6 }))
})()

/** Céu noturno, lua, montanhas e névoa (fundo do mapa e da tela da torre). */
export function CeuNoturno({ h = MAPA_H, horizonte = 330, lua = true }: { h?: number; horizonte?: number; lua?: boolean }) {
  return (
    <g>
      <linearGradient id="tw-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#09090b" />
        <stop offset={String(Math.min(0.9, horizonte / h - 0.1))} stopColor="#141319" />
        <stop offset={String(Math.min(0.95, horizonte / h))} stopColor="#222029" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      <rect width={MAPA_W} height={h} fill="url(#tw-sky)" />
      <ellipse cx={MAPA_W / 2} cy={horizonte - 150} rx={240} ry={190} fill="#2b2a35" opacity={0.35} filter="url(#tw-blur-l)" />
      {STARS.filter((s) => s.y < horizonte - 20).map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#eeedeb" className="tw-twinkle" style={{ animationDelay: `${s.d}s`, ['--tw-o' as string]: String(0.35 + (s.s - 0.4) * 0.4) } as CSSProperties} />
      ))}
      {/* lua (luz da esquerda) */}
      {lua && (
        <g>
          <circle cx={58} cy={74} r={34} fill="url(#tw-halo)" opacity={0.6} />
          <circle cx={58} cy={74} r={15} fill="#f1f0ee" />
          <circle cx={65} cy={70} r={14} fill="#141319" />
        </g>
      )}
      {/* montanhas */}
      <path d={`M0 ${horizonte - 22}L38 ${horizonte - 58}L70 ${horizonte - 34}L112 ${horizonte - 80}L150 ${horizonte - 40}L196 ${horizonte - 66}L236 ${horizonte - 30}L282 ${horizonte - 74}L330 ${horizonte - 36}L364 ${horizonte - 60}L390 ${horizonte - 42}V${horizonte + 40}H0Z`} fill="#19181f" />
      <path d={`M0 ${horizonte + 2}L52 ${horizonte - 26}L98 ${horizonte - 6}L140 ${horizonte - 30}L198 ${horizonte - 4}L250 ${horizonte - 32}L300 ${horizonte - 8}L352 ${horizonte - 28}L390 ${horizonte - 10}V${horizonte + 60}H0Z`} fill="#121115" />
      {/* bruma que corre devagar */}
      <g className="tw-drift" filter="url(#tw-blur-l)" opacity={0.55}>
        <ellipse cx={90} cy={horizonte + 8} rx={150} ry={16} fill="#6f6b82" opacity={0.35} />
        <ellipse cx={320} cy={horizonte + 18} rx={170} ry={14} fill="#6f6b82" opacity={0.3} />
      </g>
    </g>
  )
}

/**
 * Praça de mármore suspensa: piso xadrez em perspectiva, borda de pedra com filete de aço, caminhos de
 * mármore branco do portão até cada torre e lanternas.
 */
export function Praca({ caminhos }: { caminhos: { x: number; y: number }[] }) {
  const cx = MAPA_W / 2
  const cy = 474
  const rx = 192
  const ry = 96
  const gate = { x: cx, y: cy + ry - 8 }
  return (
    <g>
      <pattern id="tw-checker" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`translate(${cx} ${cy}) scale(1 0.5) rotate(45)`}>
        <rect width="22" height="22" fill="#2a2a2f" />
        <rect width="11" height="11" fill="#47474d" />
        <rect x="11" y="11" width="11" height="11" fill="#47474d" />
        <path d="M0 0H22V22" stroke="#6b6357" strokeWidth="0.5" fill="none" opacity="0.5" />
      </pattern>
      <radialGradient id="tw-plaza-light" cx="0.45" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#ece5d8" stopOpacity="0.22" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
      <linearGradient id="tw-rim" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#38393c" />
        <stop offset="1" stopColor="#0c0c0e" />
      </linearGradient>
      {/* sombra e borda (espessura) */}
      <ellipse cx={cx} cy={cy + 46} rx={rx * 0.92} ry={ry * 0.7} fill="#000" opacity={0.7} filter="url(#tw-blur-l)" />
      <path d={`M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${cy + 30}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy + 30}Z`} fill="url(#tw-rim)" />
      <path d={`M${cx - rx} ${cy + 30}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 30}`} stroke="#6b6357" strokeWidth={1} fill="none" opacity={0.6} />
      {/* tampo */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-checker)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tw-plaza-light)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="url(#tw-steel)" strokeWidth={2} />
      <ellipse cx={cx} cy={cy} rx={rx - 7} ry={ry - 4} fill="none" stroke="#bab09f" strokeWidth={0.6} opacity={0.5} />
      {/* caminhos de mármore branco */}
      {caminhos.map((p, i) => (
        <path
          key={i}
          d={`M${gate.x - 9} ${gate.y}Q${(gate.x + p.x) / 2 - 6} ${(gate.y + p.y) / 2 + 12} ${p.x - 7} ${p.y + 6}L${p.x + 7} ${p.y + 6}Q${(gate.x + p.x) / 2 + 6} ${(gate.y + p.y) / 2 + 12} ${gate.x + 9} ${gate.y}Z`}
          fill="#dcd9d3"
          opacity={0.32}
          stroke="#bab09f"
          strokeWidth={0.6}
        />
      ))}
      {/* portão de ferro na frente */}
      <g transform={`translate(${gate.x} ${gate.y + 2})`}>
        <path d="M-20 0V-24Q-20 -40 0 -44Q20 -40 20 -24V0" stroke="url(#tw-steel)" strokeWidth={1.6} fill="none" />
        {[-14, -7, 0, 7, 14].map((x) => (
          <path key={x} d={`M${x} 0V${-30 - (14 - Math.abs(x))}`} stroke="#bab09f" strokeWidth={0.8} />
        ))}
        <path d={starPath(0, -48, 5)} fill="url(#tw-steel)" />
      </g>
      {/* lanternas da borda */}
      {[0.12, 0.3, 0.7, 0.88].map((f, i) => {
        const a = Math.PI * (1 - f)
        const x = cx + Math.cos(a) * rx * 0.97
        const y = cy + Math.sin(a) * ry * 0.97
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 0V-22" stroke="#6b6357" strokeWidth={1.2} />
            <circle cx={0} cy={-25} r={9} fill="url(#tw-halo)" className="tw-flicker" style={{ animationDelay: `${i * 0.7}s` }} />
            <path d="M-2.6 -22H2.6L2 -28H-2Z" fill="#ece5d8" />
          </g>
        )
      })}
    </g>
  )
}

/** Poeira dourada subindo (poucas partículas, CSS). */
export function Poeira({ n = 14, h = MAPA_H }: { n?: number; h?: number }) {
  const r = rng(7)
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={20 + r() * (MAPA_W - 40)}
          cy={h * 0.45 + r() * h * 0.5}
          r={0.6 + r() * 1.1}
          fill="#ece5d8"
          className="tw-dust"
          style={{ animationDelay: `${-r() * 9}s`, animationDuration: `${8 + r() * 6}s` }}
        />
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ Escada em espiral (tela da torre) */

/** Geometria da escada: um giro por andar. */
export const ESCADA = { AX: 80, R: 48, PASSO: 172, TOPO: 170, BASE: 130 }

export function alturaEscada(andares: number) {
  return ESCADA.TOPO + ESCADA.BASE + andares * ESCADA.PASSO
}

/** y (no SVG) do patamar do andar n (1-based): onde fica o nó, na ponta direita da hélice. */
export function yDoAndar(n: number, andares: number) {
  const H = alturaEscada(andares)
  return H - ESCADA.BASE - ESCADA.PASSO * (n - 1) - ESCADA.PASSO / 4
}

/**
 * Escada em espiral de mármore com corrimão de aço em volta de uma coluna negra. Os degraus de trás ficam
 * escuros; os da frente, claros. Os trechos já subidos ficam um pouco mais acesos.
 */
export function Escada({ andares, feitos }: { andares: number; feitos: number }) {
  const { AX, R, PASSO } = ESCADA
  const H = alturaEscada(andares)
  const y0 = H - ESCADA.BASE
  const steps = 16
  const total = andares * steps + steps / 4
  const back: ReactNode[] = []
  const front: ReactNode[] = []
  const railBack: string[] = []
  const railFront: string[] = []
  let segB = ''
  let segF = ''
  for (let i = 0; i <= total; i++) {
    const t = (i / steps) * Math.PI * 2
    const t2 = ((i + 1) / steps) * Math.PI * 2
    const y = y0 - (t / (Math.PI * 2)) * PASSO
    const yy = y0 - (t2 / (Math.PI * 2)) * PASSO
    const sx = Math.sin(t)
    const sx2 = Math.sin(t2)
    const c = Math.cos(t)
    const isFront = c > -0.05
    const subido = t / (Math.PI * 2) < feitos + 0.25
    // degrau: trapézio entre o eixo e a borda
    const xi = AX + 9 * sx
    const xo = AX + R * sx
    const xi2 = AX + 9 * sx2
    const xo2 = AX + R * sx2
    const light = isFront ? 0.55 + 0.45 * c : 0.25 + 0.2 * (1 + c)
    const d = `M${xi} ${y}L${xo} ${y}L${xo2} ${yy}L${xi2} ${yy}Z`
    const riser = `M${xo} ${y}L${xo2} ${yy}L${xo2} ${yy + 5}L${xo} ${y + 5}Z`
    const el = (
      <g key={i}>
        {isFront && <path d={`M${xi + 3} ${y + 7}L${xo + 3} ${y + 7}L${xo2 + 3} ${yy + 9}L${xi2 + 3} ${yy + 9}Z`} fill="#000" opacity={0.28} />}
        <path d={d} fill="url(#tx-marmore)" />
        <path d={d} fill="#0b0b10" opacity={Math.max(0, Math.min(0.85, (1 - light) * 0.95 - (subido ? 0.06 : 0)))} stroke="#0c0c0e" strokeWidth={0.4} />
        <path d={`M${xi} ${y}L${xo} ${y}`} stroke="#fffaf0" strokeWidth={0.6} opacity={isFront ? 0.35 * light : 0.08} />
        <path d={riser} fill="url(#tx-marmore)" />
        <path d={riser} fill="#0b0b10" opacity={isFront ? 0.55 : 0.82} />
        {i % 2 === 0 &&
          (isFront ? (
            <path d={`M${xo} ${y}C${xo + 4} ${y - 5} ${xo - 4} ${y - 10} ${xo} ${y - 16}`} stroke="#d9d3c6" strokeWidth={0.9} fill="none" />
          ) : (
            <path d={`M${xo} ${y}V${y - 16}`} stroke="#4a453d" strokeWidth={0.7} />
          ))}
      </g>
    )
    ;(isFront ? front : back).push(el)
    const rp = `${AX + (R + 1) * sx} ${y - 16}`
    if (isFront) {
      if (segB) {
        railBack.push(segB)
        segB = ''
      }
      segF = segF ? `${segF}L${rp}` : `M${rp}`
    } else {
      if (segF) {
        railFront.push(segF)
        segF = ''
      }
      segB = segB ? `${segB}L${rp}` : `M${rp}`
    }
  }
  if (segB) railBack.push(segB)
  if (segF) railFront.push(segF)
  return (
    <g>
      {/* sombra no chão e coluna */}
      <ellipse cx={AX} cy={y0 + 26} rx={R + 30} ry={14} fill="#000" opacity={0.6} filter="url(#tw-blur-s)" />
      <g>{back}</g>
      {railBack.map((d, i) => (
        <path key={i} d={d} stroke="#5f584d" strokeWidth={1.6} fill="none" />
      ))}
      <rect x={AX - 8} y={ESCADA.TOPO - 40} width={16} height={y0 - ESCADA.TOPO + 60} fill="url(#tx-negra)" />
      <rect x={AX - 8} y={ESCADA.TOPO - 40} width={16} height={y0 - ESCADA.TOPO + 60} fill="url(#sh-cil)" />
      <rect x={AX - 7} y={ESCADA.TOPO - 40} width={2} height={y0 - ESCADA.TOPO + 60} fill="#8f8e8b" opacity={0.4} />
      <g>{front}</g>
      {railFront.map((d, i) => (
        <path key={i} d={d} stroke="url(#tw-steel-v)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      ))}
      {/* patamares: capitel na coluna e espinhos de aço que rasgam a escada (um par por andar) */}
      {Array.from({ length: andares }, (_, k) => {
        const y = y0 - PASSO * k - PASSO / 4
        return (
          <g key={`pt${k}`}>
            <rect x={AX - 10} y={y - 3} width={20} height={5} rx={1} fill="url(#tw-steel)" />
            <path d={`M${AX - 12} ${y + 2}H${AX + 12}`} stroke="#0c0c0e" strokeWidth={0.8} />
            <path d={`M${AX + R - 2} ${y - 14}L${AX + R + 1.6} ${y - 14}L${AX + R + 9} ${y - 64}Z`} fill="url(#tw-steel)" />
            <path d={`M${AX - R + 6} ${y - 50}L${AX - R + 9} ${y - 50}L${AX - R - 2} ${y - 96}Z`} fill="#5f584d" />
            <path d={voluta(AX + R - 1, y - 22, 6, 1)} fill="none" stroke="#d9d3c6" strokeWidth={1} strokeLinecap="round" />
            <path d={voluta(AX + R - 1, y - 34, 5, -1)} fill="none" stroke="#bab09f" strokeWidth={0.8} strokeLinecap="round" />
          </g>
        )
      })}
      {/* remate do topo: agulha com a estrela */}
      <path d={`M${AX - 9} ${ESCADA.TOPO - 40}L${AX} ${ESCADA.TOPO - 120}L${AX + 9} ${ESCADA.TOPO - 40}Z`} fill="url(#tw-slate)" />
      <path d={`M${AX - 9} ${ESCADA.TOPO - 40}L${AX} ${ESCADA.TOPO - 120}`} stroke="#ece5d8" strokeWidth={0.7} opacity={0.6} />
      <circle cx={AX} cy={ESCADA.TOPO - 128} r={20} fill="url(#tw-halo)" opacity={0.6} />
      <path d={starPath(AX, ESCADA.TOPO - 128, 11)} fill="url(#tw-steel)" />
      {/* base de pedra */}
      <path d={`M${AX - R - 22} ${y0 + 24}L${AX + R + 22} ${y0 + 24}L${AX + R + 12} ${y0 + 8}L${AX - R - 12} ${y0 + 8}Z`} fill="url(#tx-negra)" />
      <path d={`M${AX - R - 22} ${y0 + 24}L${AX + R + 22} ${y0 + 24}L${AX + R + 12} ${y0 + 8}L${AX - R - 12} ${y0 + 8}Z`} fill="url(#sh-frente)" />
      <path d={`M${AX - R - 12} ${y0 + 8}H${AX + R + 12}`} stroke="url(#tw-steel)" strokeWidth={1} />
    </g>
  )
}
