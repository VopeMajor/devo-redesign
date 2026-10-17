'use client'

import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Assets ornamentais das Torres (SVG desenhado à mão, sem primitivas cruas): cadeado, chave, cristal de
 * essência, estrela de andar, cartela e botão. Metal = aço champanhe; joia = ametista pequena; rubi só alerta.
 * Todos aceitam `className` (tamanho pelo pai) e são decorativos (aria-hidden) salvo indicação.
 */

const r2 = (n: number) => Math.round(n * 100) / 100
const uid = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '')

/** Gradientes de metal e joia locais (ids únicos por instância). */
function useDefs() {
  const id = uid(useId())
  return {
    steel: `tws-${id}`,
    steelV: `twsv-${id}`,
    dark: `twd-${id}`,
    gem: `twg-${id}`,
    gemHi: `twgh-${id}`,
    glow: `twgl-${id}`,
    defs: (
      <defs>
        <linearGradient id={`tws-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fbf8f2" />
          <stop offset="0.28" stopColor="#ece5d8" />
          <stop offset="0.55" stopColor="#bab09f" />
          <stop offset="0.8" stopColor="#6b6357" />
          <stop offset="1" stopColor="#a39886" />
        </linearGradient>
        <linearGradient id={`twsv-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="0.5" stopColor="#bab09f" />
          <stop offset="1" stopColor="#5f584d" />
        </linearGradient>
        <linearGradient id={`twd-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3a3a40" />
          <stop offset="0.5" stopColor="#1f1f22" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`twg-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e6e0ff" />
          <stop offset="0.35" stopColor="#a99be0" />
          <stop offset="0.7" stopColor="#5a1d26" />
          <stop offset="1" stopColor="#2b2547" />
        </linearGradient>
        <radialGradient id={`twgh-${id}`} cx="0.4" cy="0.35" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#cbc6dc" stopOpacity="0.6" />
          <stop offset="1" stopColor="#8f86b4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`twgl-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#cbc6dc" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#8f86b4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#8f86b4" stopOpacity="0" />
        </radialGradient>
      </defs>
    ),
  }
}

/** Voluta (espiral de ferro forjado) a partir de (x,y), virada para `s` (1 direita, −1 esquerda). */
export function voluta(x: number, y: number, r: number, s = 1, up = 1) {
  const k = r * s
  const u = r * up
  return `M${r2(x)} ${r2(y)}C${r2(x + k * 0.6)} ${r2(y - u * 0.9)} ${r2(x + k * 1.9)} ${r2(y - u * 0.7)} ${r2(x + k * 1.8)} ${r2(y + u * 0.15)}C${r2(x + k * 1.7)} ${r2(y + u * 0.75)} ${r2(x + k * 1.05)} ${r2(y + u * 0.7)} ${r2(x + k * 1.05)} ${r2(y + u * 0.25)}C${r2(x + k * 1.05)} ${r2(y)} ${r2(x + k * 1.35)} ${r2(y - u * 0.05)} ${r2(x + k * 1.42)} ${r2(y + u * 0.2)}`
}

/** Estrela de N pontas facetada: cada ponta em duas metades (luz e sombra). */
function facetada(R: number, r: number, n: number, rot = -90) {
  const pts: { tip: [number, number]; l: [number, number]; rr: [number, number] }[] = []
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180
    const w = Math.PI / n
    pts.push({
      tip: [Math.cos(a) * R, Math.sin(a) * R],
      l: [Math.cos(a - w) * r, Math.sin(a - w) * r],
      rr: [Math.cos(a + w) * r, Math.sin(a + w) * r],
    })
  }
  return pts.map((p) => ({
    luz: `M0 0L${r2(p.l[0])} ${r2(p.l[1])}L${r2(p.tip[0])} ${r2(p.tip[1])}Z`,
    sombra: `M0 0L${r2(p.tip[0])} ${r2(p.tip[1])}L${r2(p.rr[0])} ${r2(p.rr[1])}Z`,
    contorno: `M${r2(p.l[0])} ${r2(p.l[1])}L${r2(p.tip[0])} ${r2(p.tip[1])}L${r2(p.rr[0])} ${r2(p.rr[1])}`,
  }))
}

/* ------------------------------------------------------------------ Cadeado */

/**
 * Cadeado ornamental: escudo de aço escurecido com volutas gravadas, fechadura em estrela, rebites, joia
 * ametista na ponta e argola grossa com brilho. `aberto` ergue e gira a argola (anima com a classe tw-shackle).
 */
export function Cadeado({ aberto = false, aceso = false, className, style }: { aberto?: boolean; aceso?: boolean; className?: string; style?: CSSProperties }) {
  const d = useDefs()
  return (
    <svg viewBox="0 0 100 124" aria-hidden="true" className={className} style={style}>
      {d.defs}
      {aceso && <ellipse cx={50} cy={78} rx={52} ry={50} fill={`url(#${d.glow})`} />}
      {/* argola */}
      <g className="tw-shackle" style={{ transformOrigin: '72px 58px', transform: aberto ? 'translateY(-12px) rotate(-38deg)' : undefined }}>
        <path d="M28 60V36A22 22 0 0 1 72 36V60" fill="none" stroke="#2c2a26" strokeWidth={12} strokeLinecap="round" />
        <path d="M28 60V36A22 22 0 0 1 72 36V60" fill="none" stroke={`url(#${d.steel})`} strokeWidth={9} strokeLinecap="round" />
        <path d="M31 58V36.5A19 19 0 0 1 48 17.6" fill="none" stroke="#fffaf0" strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
        {[40, 48].map((y) => (
          <path key={y} d={`M24 ${y}H32M68 ${y}H76`} stroke="#5f584d" strokeWidth={1} />
        ))}
      </g>
      {/* ombros com volutas */}
      <path d={voluta(16, 60, 7, -1)} fill="none" stroke={`url(#${d.steel})`} strokeWidth={2.2} strokeLinecap="round" />
      <path d={voluta(84, 60, 7, 1)} fill="none" stroke={`url(#${d.steel})`} strokeWidth={2.2} strokeLinecap="round" />
      {/* corpo em escudo */}
      <path d="M17 56H83Q91 56 91 64V88Q91 106 50 120Q9 106 9 88V64Q9 56 17 56Z" fill={`url(#${d.steel})`} />
      <path d="M19.5 59.5H80.5Q87.5 59.5 87.5 66V87.5Q87.5 103.5 50 116Q12.5 103.5 12.5 87.5V66Q12.5 59.5 19.5 59.5Z" fill={`url(#${d.dark})`} />
      {/* faixa superior com rebites */}
      <path d="M12.5 67H87.5" stroke="#6b6357" strokeWidth={1} />
      {[22, 36, 64, 78].map((x) => (
        <circle key={x} cx={x} cy={63.3} r={1.6} fill={`url(#${d.steel})`} />
      ))}
      {/* volutas gravadas */}
      <g fill="none" stroke="#bab09f" strokeWidth={1.1} strokeLinecap="round" opacity={0.85}>
        <path d={voluta(46, 92, 6, -1, -1)} />
        <path d={voluta(54, 92, 6, 1, -1)} />
        <path d="M50 99Q44 104 38 101M50 99Q56 104 62 101" />
        <path d={voluta(30, 78, 5, -1)} />
        <path d={voluta(70, 78, 5, 1)} />
      </g>
      {/* fechadura em estrela */}
      <path d="M50 70C51 76 53 78 59 79 53 80 51 82 50 88 49 82 47 80 41 79 47 78 49 76 50 70Z" fill={`url(#${d.steel})`} />
      <circle cx={50} cy={79} r={3.2} fill="#0c0c0e" />
      <path d="M48.6 80.5H51.4L52.2 86H47.8Z" fill="#0c0c0e" />
      {/* joia */}
      <path d="M50 104L54 109L50 114L46 109Z" fill={`url(#${d.gem})`} stroke={`url(#${d.steel})`} strokeWidth={0.8} />
      {aceso && <circle cx={50} cy={109} r={3} fill={`url(#${d.gemHi})`} />}
    </svg>
  )
}

/* ------------------------------------------------------------------ Chave */

/** Chave ornamental: cabeça em estrela de quatro pontas com voluta e joia, colar, haste gravada e palhetão. */
export function ChaveOrnamental({ className, style }: { className?: string; style?: CSSProperties }) {
  const d = useDefs()
  const star = facetada(30, 11, 4, -45)
  return (
    <svg viewBox="0 0 200 84" aria-hidden="true" className={className} style={style}>
      {d.defs}
      {/* palhetão */}
      <path d="M150 46V66H157V58H163V70H170V58H176V46Z" fill={`url(#${d.steelV})`} stroke="#5f584d" strokeWidth={0.8} />
      {/* haste */}
      <rect x={78} y={38} width={102} height={9} rx={2} fill={`url(#${d.steelV})`} />
      <path d="M82 40.5H176" stroke="#fffaf0" strokeWidth={1} opacity={0.7} />
      <path d="M96 45H140" stroke="#6b6357" strokeWidth={0.8} />
      {[100, 112, 124].map((x) => (
        <path key={x} d={`M${x} 47.2l3 -3 3 3`} fill="none" stroke="#6b6357" strokeWidth={0.6} />
      ))}
      <path d="M180 42.5L188 38L196 42.5L188 47Z" fill={`url(#${d.steel})`} />
      {/* colar */}
      {[74, 80, 86].map((x, i) => (
        <rect key={x} x={x} y={34 + (i === 1 ? -3 : 0)} width={4} height={17 + (i === 1 ? 6 : 0)} rx={1.5} fill={`url(#${d.steelV})`} />
      ))}
      {/* cabeça */}
      <g transform="translate(40 42)">
        <circle r={40} fill={`url(#${d.glow})`} opacity={0.55} />
        {star.map((p, i) => (
          <g key={i}>
            <path d={p.luz} fill="#f4efe6" />
            <path d={p.sombra} fill="#8f8676" />
          </g>
        ))}
        {[45, 135, 225, 315].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d={voluta(0, -20, 6, 1)} fill="none" stroke={`url(#${d.steel})`} strokeWidth={2} strokeLinecap="round" />
            <path d={voluta(0, -20, 6, -1)} fill="none" stroke={`url(#${d.steel})`} strokeWidth={2} strokeLinecap="round" />
          </g>
        ))}
        <circle r={15} fill="none" stroke={`url(#${d.steel})`} strokeWidth={5} />
        <circle r={12} fill="#0c0c0e" />
        <path d="M0 -10L7 0L0 10L-7 0Z" fill={`url(#${d.gem})`} />
        <path d="M0 -10L7 0L0 0Z" fill="#e6e0ff" opacity={0.55} />
        <circle r={10} fill={`url(#${d.gemHi})`} opacity={0.6} />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ Cristal de essência */

/** Cristal de Essência de Afinidade: bipirâmide facetada em ametista, presa por garras de aço com asas de filigrana. */
export function CristalEssencia({ className, style, brilho = true }: { className?: string; style?: CSSProperties; brilho?: boolean }) {
  const d = useDefs()
  const F: [string, string][] = [
    ['M50 6L27 50L50 58Z', '#a99be0'],
    ['M50 6L73 50L50 58Z', '#5a1d26'],
    ['M50 6L40 50L50 58Z', '#e6e0ff'],
    ['M27 50L31 96L50 58Z', '#8f86b4'],
    ['M73 50L69 96L50 58Z', '#4d4668'],
    ['M31 96L50 58L69 96L50 104Z', '#6f63b0'],
    ['M31 96L50 128L50 104Z', '#5a1d26'],
    ['M69 96L50 128L50 104Z', '#2b2547'],
  ]
  return (
    <svg viewBox="0 0 100 136" aria-hidden="true" className={className} style={style}>
      {d.defs}
      {brilho && <ellipse cx={50} cy={64} rx={50} ry={62} fill={`url(#${d.glow})`} />}
      {/* asas de filigrana */}
      <g fill="none" stroke={`url(#${d.steel})`} strokeLinecap="round">
        <path d="M27 58C16 52 8 40 6 26C14 34 20 38 28 40" strokeWidth={2} />
        <path d="M27 64C14 64 6 56 2 46C10 52 18 54 27 54" strokeWidth={1.4} />
        <path d="M73 58C84 52 92 40 94 26C86 34 80 38 72 40" strokeWidth={2} />
        <path d="M73 64C86 64 94 56 98 46C90 52 82 54 73 54" strokeWidth={1.4} />
        <path d={voluta(10, 30, 4, 1)} strokeWidth={1.2} />
        <path d={voluta(90, 30, 4, -1)} strokeWidth={1.2} />
      </g>
      {F.map(([p, c], i) => (
        <path key={i} d={p} fill={c} stroke="#2b2547" strokeWidth={0.4} />
      ))}
      <ellipse cx={46} cy={44} rx={9} ry={20} fill={`url(#${d.gemHi})`} />
      <path d="M50 6L40 50" stroke="#ffffff" strokeWidth={0.8} opacity={0.8} />
      {/* engaste: cinta de aço na cintura do cristal com rebites e garras finas */}
      <path d="M26.6 47L73.4 47L72.8 55L27.2 55Z" fill={`url(#${d.steel})`} />
      <path d="M27 49.5H73" stroke="#fffaf0" strokeWidth={0.6} opacity={0.7} />
      {[34, 44, 56, 66].map((x) => (
        <circle key={x} cx={x} cy={51} r={1.1} fill="#5f584d" />
      ))}
      <path d="M50 47L53 51L50 55L47 51Z" fill={`url(#${d.gem})`} stroke="#ece5d8" strokeWidth={0.4} />
      <path d="M28 55L31 66L33 55Z M72 55L69 66L67 55Z" fill={`url(#${d.steel})`} />
    </svg>
  )
}

/* ------------------------------------------------------------------ Estrela do andar */

export type EstadoAndar = 'concluido' | 'atual' | 'pronto' | 'trancado'

/**
 * Patamar do andar: estrela de oito pontas facetada (quatro longas, quatro curtas) com medalhão central.
 * concluído = aço claro com selo gravado; atual = obsidiana com aresta ametista e joia acesa (pronto) ou
 * cadeado (falta recurso); trancado = pedra escura com cadeado.
 */
export function EstrelaAndar({ estado, className, style }: { estado: EstadoAndar; className?: string; style?: CSSProperties }) {
  const d = useDefs()
  const longas = facetada(46, 9, 4)
  const curtas = facetada(26, 8, 4, -45)
  const pal =
    estado === 'concluido'
      ? { luz: '#f4efe6', sombra: '#8f8676', linha: '#5f584d' }
      : estado === 'trancado'
        ? { luz: '#3a3a40', sombra: '#16161a', linha: '#6b6357' }
        : { luz: '#2c2a38', sombra: '#0c0c10', linha: '#a99be0' }
  const viva = estado === 'atual' || estado === 'pronto'
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true" className={className} style={style}>
      {d.defs}
      {viva && (
        <g className="tw-raios">
          <circle r={58} fill={`url(#${d.glow})`} />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M0 -58L1.2 -30L-1.2 -30Z" fill="#cbc6dc" opacity={0.45} transform={`rotate(${i * 30 + 15})`} />
          ))}
        </g>
      )}
      {estado === 'concluido' && <circle r={50} fill="url(#tw-halo)" opacity={0.6} />}
      {curtas.map((p, i) => (
        <g key={`c${i}`}>
          <path d={p.luz} fill={pal.luz} />
          <path d={p.sombra} fill={pal.sombra} />
          <path d={p.contorno} fill="none" stroke={pal.linha} strokeWidth={0.8} />
        </g>
      ))}
      {longas.map((p, i) => (
        <g key={`l${i}`}>
          <path d={p.luz} fill={pal.luz} />
          <path d={p.sombra} fill={pal.sombra} />
          <path d={p.contorno} fill="none" stroke={pal.linha} strokeWidth={1} />
        </g>
      ))}
      {/* medalhão */}
      <circle r={15} fill={estado === 'concluido' ? '#1f1f22' : '#0c0c0e'} stroke={estado === 'trancado' ? '#6b6357' : `url(#${d.steel})`} strokeWidth={2.6} />
      <circle r={11.5} fill="none" stroke={estado === 'concluido' ? '#bab09f' : '#38393c'} strokeWidth={0.6} />
      {estado === 'concluido' && <path d="M-6 0.5L-1.6 5L6.5 -4.5" fill="none" stroke={`url(#${d.steel})`} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />}
      {estado === 'pronto' && (
        <g>
          <path d="M0 -10L7 0L0 10L-7 0Z" fill={`url(#${d.gem})`} />
          <path d="M0 -10L7 0L0 0Z" fill="#e6e0ff" opacity={0.6} />
          <circle r={12} fill={`url(#${d.gemHi})`} className="tw-pulse" />
        </g>
      )}
      {(estado === 'trancado' || estado === 'atual') && (
        <g transform="translate(-8.5 -11) scale(0.17)">
          <Cadeado.Simbolo cor={estado === 'atual' ? '#cbc6dc' : '#bab09f'} />
        </g>
      )}
    </svg>
  )
}

/** Silhueta de cadeado para caber num medalhão (usa só formas, sem gradiente). */
Cadeado.Simbolo = function Simbolo({ cor }: { cor: string }) {
  return (
    <g fill="none" stroke={cor}>
      <path d="M28 60V36A22 22 0 0 1 72 36V60" strokeWidth={10} strokeLinecap="round" />
      <path d="M17 56H83Q91 56 91 64V88Q91 106 50 120Q9 106 9 88V64Q9 56 17 56Z" fill={cor} stroke="none" />
      <path d="M50 70C51 76 53 78 59 79 53 80 51 82 50 88 49 82 47 80 41 79 47 78 49 76 50 70Z" fill="#0c0c0e" stroke="none" />
    </g>
  )
}

/* ------------------------------------------------------------------ Cartela e botão */

/** Remate em voluta (ponta de cartela/botão), desenhado para a altura `h`. */
function Remate({ h, lado, tom }: { h: number; lado: 'esq' | 'dir'; tom: string }) {
  const s = lado === 'esq' ? 1 : -1
  const w = h * 0.62
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" className="shrink-0" style={{ transform: s < 0 ? 'scaleX(-1)' : undefined }}>
      <path d={`M${w} 1H${w * 0.55}L1 ${h / 2}L${w * 0.55} ${h - 1}H${w}`} fill="var(--tw-fill,#0f0f12)" stroke={tom} strokeWidth={1.2} />
      <path d={`M${w} 4H${w * 0.6}L5 ${h / 2}L${w * 0.6} ${h - 4}H${w}`} fill="none" stroke={tom} strokeWidth={0.6} opacity={0.5} />
      <path d={voluta(w * 0.66, h / 2, h * 0.13, 1)} fill="none" stroke={tom} strokeWidth={1.1} strokeLinecap="round" />
      <path d={`M${w * 0.4} ${h / 2 - 2.6}L${w * 0.4 + 2.6} ${h / 2}L${w * 0.4} ${h / 2 + 2.6}L${w * 0.4 - 2.6} ${h / 2}Z`} fill={tom} />
    </svg>
  )
}

/** Cartela ornamental (plaqueta com remates em voluta); o meio estica com o conteúdo. */
export function Cartela({ children, h = 44, destaque = false, className }: { children: ReactNode; h?: number; destaque?: boolean; className?: string }) {
  const tom = destaque ? '#ece5d8' : '#bab09f'
  return (
    <span className={cn('flex items-stretch drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]', className)} style={{ height: h, '--tw-fill': destaque ? '#151320' : '#0f0f12' } as CSSProperties}>
      <Remate h={h} lado="esq" tom={tom} />
      <span className="relative -mx-px flex min-w-0 flex-col items-center justify-center border-y px-1.5" style={{ borderColor: tom, background: 'var(--tw-fill)' }}>
        <span aria-hidden="true" className="absolute inset-x-0 top-[3px] h-px opacity-50" style={{ background: tom }} />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[3px] h-px opacity-50" style={{ background: tom }} />
        {children}
      </span>
      <Remate h={h} lado="dir" tom={tom} />
    </span>
  )
}

/**
 * Botão ornamental das Torres: corpo em porcelana e aço com pontas em voluta e joia ametista; estados de
 * hover (brilho atravessa), pressionado (afunda e acende), foco (anel ametista), desabilitado (pedra fosca,
 * cadeado) e carregando (estrela girando).
 */
export function BotaoTorre({
  children,
  sub,
  carregando = false,
  trancado = false,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { sub?: ReactNode; carregando?: boolean; trancado?: boolean }) {
  const off = disabled || carregando
  return (
    <button
      type="button"
      {...rest}
      disabled={off}
      aria-busy={carregando || undefined}
      className={cn('tw-botao dv-focus group relative isolate flex min-h-[60px] w-full items-stretch outline-none', off && 'cursor-not-allowed', className)}
      data-estado={disabled ? 'off' : carregando ? 'carregando' : 'on'}
    >
      <svg viewBox="0 0 360 60" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 -z-10 size-full">
        <defs>
          <linearGradient id="tw-bt-face" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={disabled ? '#2c2c31' : '#f7f5f1'} />
            <stop offset="0.55" stopColor={disabled ? '#1f1f22' : '#dcd9d3'} />
            <stop offset="1" stopColor={disabled ? '#151517' : '#b5b1aa'} />
          </linearGradient>
          <linearGradient id="tw-bt-edge" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#6b6357" />
            <stop offset="0.3" stopColor="#ece5d8" />
            <stop offset="0.5" stopColor="#8f86b4" />
            <stop offset="0.7" stopColor="#ece5d8" />
            <stop offset="1" stopColor="#6b6357" />
          </linearGradient>
        </defs>
        <path d="M22 2H338L358 30L338 58H22L2 30Z" fill="url(#tw-bt-edge)" opacity={disabled ? 0.45 : 1} />
        <path d="M24 5H336L353 30L336 55H24L7 30Z" fill="url(#tw-bt-face)" />
        <path d="M30 9H330L344 30L330 51H30L16 30Z" fill="none" stroke={disabled ? '#38393c' : '#8f8676'} strokeWidth={0.8} />
      </svg>
      {/* volutas e joias das pontas */}
      <svg viewBox="0 0 40 60" aria-hidden="true" className="absolute left-2 top-0 -z-10 h-full w-auto">
        <path d={voluta(26, 30, 6, -1)} fill="none" stroke={disabled ? '#5f584d' : '#6b6357'} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M30 26L34 30L30 34L26 30Z" fill={disabled ? '#38393c' : '#5a1d26'} />
      </svg>
      <svg viewBox="0 0 40 60" aria-hidden="true" className="absolute right-2 top-0 -z-10 h-full w-auto -scale-x-100">
        <path d={voluta(26, 30, 6, -1)} fill="none" stroke={disabled ? '#5f584d' : '#6b6357'} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M30 26L34 30L30 34L26 30Z" fill={disabled ? '#38393c' : '#5a1d26'} />
      </svg>
      <span aria-hidden="true" className="tw-botao-brilho pointer-events-none absolute inset-[5px] -z-10 overflow-hidden [clip-path:polygon(5%_0,95%_0,100%_50%,95%_100%,5%_100%,0_50%)]" />
      <span className="flex flex-1 flex-col items-center justify-center px-14 py-2 text-center">
        <span className={cn('flex items-center gap-2 font-display text-[15px] font-semibold uppercase tracking-[0.2em]', disabled ? 'text-dv-text-3' : 'text-[#141416]')}>
          {carregando ? <span aria-hidden="true" className="tw-girar inline-block size-4 [clip-path:polygon(50%_0,62%_38%,100%_50%,62%_62%,50%_100%,38%_62%,0_50%,38%_38%)] bg-dv-cobalt" /> : null}
          {trancado && !carregando ? <Cadeado className="h-4 w-auto opacity-80" /> : null}
          {children}
        </span>
        {sub && <span className={cn('mt-0.5 font-body text-[13px] italic', disabled ? 'text-dv-text-3' : 'text-[#3a3633]')}>{sub}</span>}
      </span>
    </button>
  )
}
