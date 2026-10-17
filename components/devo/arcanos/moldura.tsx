'use client'

import { type CSSProperties, type ReactNode, useId, useState } from 'react'
import { arteDe, type ArteTipo, comum, MOLDURA } from '@/lib/devo/arcanos-arte'
import type { ArcanoKey } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { SIGILO, Sigilo } from './sigilos'

/* ────────────────────────────────────────────────────────────────────────────────────────
   Ornamentos dos Arcanos em aço champanhe (tokens --dv-gold*) com acento ametista:
   moldura em camadas metálicas, medalhão, cartela de nome, título com filigrana, selo rachado.
   Desenhos originais; a moldura pintada do agente de arte entra por cima quando existir.
   ──────────────────────────────────────────────────────────────────────────────────────── */

const uid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '')

/** Gradientes de metal reutilizados (ids únicos por instância). */
function Metal({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-aco`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--dv-gold-bright)" />
        <stop offset="0.22" stopColor="var(--dv-gold)" />
        <stop offset="0.4" stopColor="var(--dv-gold-deep)" />
        <stop offset="0.55" stopColor="var(--dv-gold-bright)" />
        <stop offset="0.75" stopColor="var(--dv-gold)" />
        <stop offset="1" stopColor="var(--dv-gold-deep)" />
      </linearGradient>
      <linearGradient id={`${id}-brilho`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--dv-gold-bright)" stopOpacity="0.95" />
        <stop offset="1" stopColor="var(--dv-gold-bright)" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id={`${id}-gema`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="var(--dv-amethyst-text)" />
        <stop offset="0.45" stopColor="var(--dv-amethyst)" />
        <stop offset="1" stopColor="var(--dv-amethyst-deep)" />
      </linearGradient>
    </>
  )
}

/** Silhueta de figura velada (busto com capuz): o "corpo" da estátua enquanto a pintura não chega. */
const SILHUETA = 'M50 16C38 16 31 28 32 41C33 51 39 57 43 60C29 64 19 77 15 97L10 140H90L85 97C81 77 71 64 57 60C61 57 67 51 68 41C69 28 62 16 50 16Z'

/* ------------------------------------------------------------------ moldura */

const ARO = 'M26 92C26 44 58 30 100 26C142 30 174 44 174 92V214C174 240 150 252 128 256L100 268L72 256C50 252 26 240 26 214Z'
const ARO_IN = 'M35 94C35 52 64 39 100 35C136 39 165 52 165 94V212C165 233 144 244 124 247L100 257L76 247C56 244 35 233 35 212Z'
const CONTAS = [
  ...[110, 130, 150, 170, 190].flatMap((y) => [
    [26, y],
    [174, y],
  ]),
  [46, 50],
  [154, 50],
  [70, 33],
  [130, 33],
] as const

export type ModoRetrato = 'cor' | 'pedra'

/**
 * Moldura ornamentada com o retrato dentro. `modo`: `cor` (o próprio, ou aberto pela equipe) ou `pedra`
 * (trancado: estátua de pedra e selo rachado). `vt`: nome de view-transition (elemento compartilhado com o altar).
 */
export function Moldura({ arcano, modo, aceso, carregar, vt, className }: { arcano: ArcanoKey; modo: ModoRetrato; aceso?: boolean; carregar: boolean; vt?: string; className?: string }) {
  const id = `mo${uid(useId())}`
  const pintada = comum('moldura')
  const [semMoldura, setSemMoldura] = useState(false)
  const estilo = vt ? ({ viewTransitionName: vt } as CSSProperties) : undefined
  if (pintada && !semMoldura) {
    // moldura pintada (768×1024, arco aberto): o retrato vai por baixo, na janela de moldura.json
    const j = MOLDURA.janela
    return (
      <div className={cn('relative aspect-[3/4] w-full', className)} style={estilo}>
        <div
          className="absolute overflow-hidden"
          style={{ left: `${(j.x - 0.01) * 100}%`, top: `${(j.y - 0.005) * 100}%`, width: `${(j.w + 0.02) * 100}%`, height: `${(j.h + 0.01) * 100}%`, clipPath: 'inset(0 round 50% 50% 2% 2% / 24% 24% 1% 1%)' }}
        >
          <Retrato arcano={arcano} tipo="retrato" modo={modo} aceso={aceso} carregar={carregar} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pintada.src}
          srcSet={pintada.srcSet}
          sizes="(max-width: 480px) 60vw, 280px"
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setSemMoldura(true)}
          className={cn('pointer-events-none absolute inset-0 size-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.65)]', 'arc-tom-moldura')}
        />
        {aceso && <span aria-hidden="true" className="arc-halo pointer-events-none absolute bottom-[8.5%] left-1/2 size-[9%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--dv-amethyst-text),transparent)] mix-blend-screen" />}
        {modo === 'pedra' && <SeloRachado className="absolute bottom-[3%] left-1/2 w-[20%] -translate-x-1/2" />}
      </div>
    )
  }
  return (
    <div className={cn('relative aspect-[200/290] w-full', className)} style={estilo}>
      <div className="absolute inset-x-[17.5%] bottom-[11.5%] top-[12.5%] overflow-hidden" style={{ clipPath: 'inset(0 round 50% 50% 16% 16% / 26% 26% 8% 8%)' }}>
        <Retrato arcano={arcano} tipo="retrato" modo={modo} aceso={aceso} carregar={carregar} />
      </div>
      {(
        <svg viewBox="0 0 200 290" aria-hidden="true" className="absolute inset-0 size-full overflow-visible drop-shadow-[0_10px_18px_rgba(0,0,0,0.65)]">
          <defs>
            <Metal id={id} />
          </defs>
          {/* camadas do aro: base escura, aço escovado, filete de luz, chanfro interno */}
          <path d={ARO} fill="none" stroke="var(--dv-ink)" strokeWidth="13" strokeLinejoin="round" />
          <path d={ARO} fill="none" stroke={`url(#${id}-aco)`} strokeWidth="9" strokeLinejoin="round" />
          <path d={ARO} fill="none" stroke="var(--dv-gold-bright)" strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" transform="translate(0 -1.6)" />
          <path d={ARO_IN} fill="none" stroke={`url(#${id}-aco)`} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={ARO_IN} fill="none" stroke="var(--dv-ink)" strokeOpacity="0.8" strokeWidth="1.2" transform="translate(0 1.4)" />
          {CONTAS.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="2.6" fill={`url(#${id}-aco)`} stroke="var(--dv-ink)" strokeWidth="0.6" />
              <circle cx={x - 0.7} cy={y - 0.8} r="0.8" fill="var(--dv-gold-bright)" />
            </g>
          ))}
          {/* crista: volutas em C, chifres e a gema */}
          <g fill="none" stroke={`url(#${id}-aco)`} strokeLinecap="round">
            <path strokeWidth="4.2" d="M72 33C60 22 64 8 77 7C86 7 88 16 82 19" />
            <path strokeWidth="4.2" d="M128 33C140 22 136 8 123 7C114 7 112 16 118 19" />
            <path strokeWidth="2.4" d="M86 27C80 20 84 14 90 15M114 27C120 20 116 14 110 15" />
          </g>
          <path d="M100 -2L110 13L100 30L90 13Z" fill={`url(#${id}-aco)`} stroke="var(--dv-ink)" strokeWidth="1" />
          <path d="M100 4L106 13L100 24L94 13Z" fill={aceso ? `url(#${id}-gema)` : 'var(--dv-ink-4)'} />
          <path d="M100 5L103 11L100 13Z" fill="var(--dv-gold-bright)" opacity="0.8" />
          {/* ombros em voluta dupla */}
          <g fill="none" stroke={`url(#${id}-aco)`} strokeLinecap="round" strokeWidth="3.4">
            <path d="M26 118C12 118 8 104 17 98C23 94 28 100 24 104" />
            <path d="M174 118C188 118 192 104 183 98C177 94 172 100 176 104" />
            <path d="M26 192C12 192 8 206 17 212C23 216 28 210 24 206" />
            <path d="M174 192C188 192 192 206 183 212C177 216 172 210 176 206" />
          </g>
          <circle cx="26" cy="155" r="5" fill={`url(#${id}-aco)`} stroke="var(--dv-ink)" strokeWidth="0.8" />
          <circle cx="174" cy="155" r="5" fill={`url(#${id}-aco)`} stroke="var(--dv-ink)" strokeWidth="0.8" />
          {/* pingente com gema menor */}
          <path d="M100 262L111 276L100 292L89 276Z" fill={`url(#${id}-aco)`} stroke="var(--dv-ink)" strokeWidth="1" />
          <path d="M100 268L105 276L100 284L95 276Z" fill={aceso ? `url(#${id}-gema)` : 'var(--dv-ink-4)'} />
          <path strokeWidth="2" stroke={`url(#${id}-aco)`} fill="none" strokeLinecap="round" d="M80 262C86 270 92 268 94 264M120 262C114 270 108 268 106 264" />
        </svg>
      )}
      {modo === 'pedra' && <SeloRachado className="absolute bottom-[4%] left-1/2 w-[24%] -translate-x-1/2" />}
    </div>
  )
}

/* ------------------------------------------------------------------ retrato (arte ou placeholder) */

/**
 * A pintura (se houver e puder carregar) ou o placeholder: silhueta velada + sigilo. `cor`: luz ametista e metal
 * claro; `pedra`: mármore cinza, sigilo gravado, sem luz.
 */
export function Retrato({ arcano, tipo, modo, aceso, carregar, translucido, className }: { arcano: ArcanoKey; tipo: ArteTipo; modo: ModoRetrato; aceso?: boolean; carregar: boolean; translucido?: boolean; className?: string }) {
  const arte = arteDe(arcano, tipo)
  const [falhou, setFalhou] = useState(false)
  const img = carregar && arte && !falhou
  const pedra = modo === 'pedra'
  return (
    <div className={cn('relative size-full', className)}>
      <div
        className={cn(
          'absolute inset-0',
          translucido && 'opacity-70',
          pedra
            ? 'bg-[radial-gradient(70%_60%_at_50%_35%,var(--dv-ink-4),var(--dv-ink)_80%)]'
            : 'bg-[radial-gradient(70%_55%_at_50%_36%,color-mix(in_oklab,var(--dv-amethyst)_42%,transparent),transparent_72%),linear-gradient(180deg,var(--dv-night-2),var(--dv-ink))]',
        )}
      />
      {pedra && <span aria-hidden="true" className="absolute inset-0 bg-[url(/images/os/marmore-branco.webp)] bg-[length:260px_260px] opacity-[0.16] mix-blend-luminosity grayscale" />}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <>
          <img
            src={pedra ? arte.menor : arte.src}
            srcSet={pedra ? undefined : arte.srcSet}
            sizes={tipo === 'figura' ? '(max-width: 480px) 90vw, 420px' : '(max-width: 480px) 60vw, 260px'}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFalhou(true)}
            className={cn(
              'absolute inset-0 size-full object-cover object-top',
              // trancado: estátua — sem cor, escura, contraste alto e desfocada (a forma fica, os detalhes não)
              pedra ? 'brightness-[0.38] contrast-[1.5] blur-[2.5px] grayscale' : 'arc-tom-figura',
            )}
          />
          {pedra && <span aria-hidden="true" className="absolute inset-0 bg-[url(/images/os/marmore-branco.webp)] bg-[length:200px_200px] opacity-25 mix-blend-overlay grayscale" />}
        </>
      ) : (
        <svg viewBox="0 0 100 140" aria-hidden="true" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full">
          <defs>
            <radialGradient id={`rt-${arcano}-${modo}`} cx="0.5" cy="0.3" r="0.7">
              <stop offset="0" stopColor={pedra ? 'var(--dv-ink-4)' : 'var(--dv-amethyst-deep)'} stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--dv-ink)" stopOpacity="0.95" />
            </radialGradient>
          </defs>
          <path d={SILHUETA} fill={`url(#rt-${arcano}-${modo})`} stroke={pedra ? 'var(--dv-text-3)' : 'var(--dv-gold)'} strokeOpacity={pedra ? 0.25 : 0.45} strokeWidth="0.6" />
          {!pedra && <path d={SILHUETA} fill="none" stroke="var(--dv-amethyst-text)" strokeOpacity="0.35" strokeWidth="1.4" transform="translate(-0.8 -0.8)" style={{ filter: 'blur(1px)' }} />}
          <g transform="translate(29 76) scale(0.875)">
            {pedra ? (
              <>
                <path d={SIGILO[arcano].traco} fill="none" stroke="var(--dv-gold-bright)" strokeOpacity="0.22" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" transform="translate(0.5 0.6)" />
                <path d={SIGILO[arcano].traco} fill="none" stroke="var(--dv-ink)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : (
              <>
                <path d={SIGILO[arcano].traco} fill="none" stroke="var(--dv-amethyst)" strokeOpacity="0.7" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(1.6px)' }} />
                <path d={SIGILO[arcano].traco} fill="none" stroke="var(--dv-gold-bright)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                {SIGILO[arcano].cheio && <path d={SIGILO[arcano].cheio} fill="var(--dv-gold-bright)" />}
              </>
            )}
          </g>
        </svg>
      )}
      {aceso && !pedra && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_30%_at_50%_30%,color-mix(in_oklab,var(--dv-amethyst-text)_22%,transparent),transparent)] mix-blend-screen" />}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,color-mix(in_oklab,var(--dv-ink)_75%,transparent))]" />
    </div>
  )
}

/* ------------------------------------------------------------------ selo rachado (trancado) */

export function SeloRachado({ className }: { className?: string }) {
  const id = `se${uid(useId())}`
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className={cn('drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]', className)}>
      <defs>
        <radialGradient id={`${id}-p`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="var(--dv-ink-4)" />
          <stop offset="0.7" stopColor="var(--dv-ink-3)" />
          <stop offset="1" stopColor="var(--dv-ink)" />
        </radialGradient>
      </defs>
      {/* bordas irregulares de lacre */}
      <path d="M30 2L35 6L41 4L44 10L51 11L51 18L57 22L54 29L58 35L52 39L52 46L45 48L42 55L35 53L30 58L25 53L18 55L15 48L8 46L8 39L2 35L6 29L3 22L9 18L9 11L16 10L19 4L25 6Z" fill={`url(#${id}-p)`} stroke="var(--dv-gold-deep)" strokeWidth="0.8" />
      <circle cx="30" cy="30" r="17" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.45" strokeWidth="1" />
      {/* fechadura gravada */}
      <path d="M30 21A5 5 0 0 1 32.6 30.3L34 39H26L27.4 30.3A5 5 0 0 1 30 21Z" fill="var(--dv-ink)" stroke="var(--dv-gold)" strokeOpacity="0.55" strokeWidth="0.8" />
      {/* rachadura */}
      <path d="M12 16L21 24L19 30L27 35L25 43L33 47L38 58" fill="none" stroke="var(--dv-ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12.6 15.2L21.8 23.4L19.8 29.4L27.8 34.3L25.8 42.4L33.8 46.4L38.8 57" fill="none" stroke="var(--dv-gold-bright)" strokeOpacity="0.28" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M21 24L28 21M27 35L36 33" fill="none" stroke="var(--dv-ink)" strokeWidth="1" />
    </svg>
  )
}

/* ------------------------------------------------------------------ medalhão (mapa e linha dos Estágios) */

/**
 * Medalhão de aço champanhe. `estado`: aceso (o próprio: aro ametista e pulso), aberto (metal claro),
 * apagado (aço escurecido, sigilo cinza).
 */
export function Medalhao({ estado, children, pulso, className }: { estado: 'aceso' | 'aberto' | 'apagado'; children: ReactNode; pulso?: boolean; className?: string }) {
  return (
    <span className={cn('relative grid place-items-center rounded-full', className)}>
      {estado === 'aceso' && (
        <span
          aria-hidden="true"
          className={cn('absolute -inset-[45%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--dv-amethyst)_70%,transparent),transparent)]', pulso && 'arc-pulso')}
        />
      )}
      <span
        aria-hidden="true"
        className={cn('absolute inset-0 rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.7)]', estado === 'apagado' && 'brightness-[0.55] saturate-0')}
        style={{ background: 'conic-gradient(from 200deg, var(--dv-gold-bright), var(--dv-gold-deep) 18%, var(--dv-gold) 34%, var(--dv-gold-bright) 50%, var(--dv-gold-deep) 68%, var(--dv-gold) 84%, var(--dv-gold-bright))' }}
      />
      {estado === 'aceso' && <span aria-hidden="true" className="absolute -inset-[3px] rounded-full shadow-[0_0_0_1.5px_var(--dv-amethyst),0_0_14px_var(--dv-amethyst)]" />}
      <span aria-hidden="true" className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_50%_35%,var(--dv-ink-3),var(--dv-ink)_75%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),inset_0_-1px_0_color-mix(in_oklab,var(--dv-gold-bright)_25%,transparent)]" />
      <span className="relative flex flex-col items-center">{children}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ cartela do nome */

/** Cartela ornamentada (placa de nome) com o numeral num medalhão no alto. */
export function Cartela({ numeral, aceso, children, className }: { numeral: string; aceso?: boolean; children: ReactNode; className?: string }) {
  const id = `ca${uid(useId())}`
  return (
    <div className={cn('relative px-7 pb-7 pt-8', className)}>
      <svg viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <Metal id={id} />
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--dv-ink-3)" stopOpacity="0.92" />
            <stop offset="1" stopColor="var(--dv-ink)" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d="M22 14H298L314 40V100L298 126H22L6 100V40Z" fill={`url(#${id}-f)`} />
        <path d="M22 14H298L314 40V100L298 126H22L6 100V40Z" fill="none" stroke={`url(#${id}-aco)`} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        <path d="M27 20H293L307 42V98L293 120H27L13 98V42Z" fill="none" stroke="var(--dv-gold)" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d="M6 70H-6M314 70H326" stroke={`url(#${id}-aco)`} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* pontas em voluta (fora do esticamento) */}
      <svg viewBox="0 0 24 40" aria-hidden="true" className="absolute -left-3 top-1/2 h-10 w-6 -translate-y-1/2">
        <path d="M20 20C10 20 6 12 11 8C15 5 19 10 15 13M20 20C10 20 6 28 11 32C15 35 19 30 15 27" fill="none" stroke="var(--dv-gold)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 24 40" aria-hidden="true" className="absolute -right-3 top-1/2 h-10 w-6 -translate-y-1/2 -scale-x-100">
        <path d="M20 20C10 20 6 12 11 8C15 5 19 10 15 13M20 20C10 20 6 28 11 32C15 35 19 30 15 27" fill="none" stroke="var(--dv-gold)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <Medalhao estado={aceso ? 'aceso' : 'aberto'} className="absolute left-1/2 top-0 size-12 -translate-x-1/2 -translate-y-1/3">
        <span className="dv-brass-text font-impact text-[17px] font-semibold leading-none">{numeral}</span>
      </Medalhao>
      <div className="relative">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ título com filigrana */

function Filigrana({ espelho }: { espelho?: boolean }) {
  return (
    <svg viewBox="0 0 90 16" aria-hidden="true" className={cn('h-4 w-16 shrink-0 text-dv-gold', espelho && '-scale-x-100')}>
      <path d="M0 8H62M62 8C70 8 72 2 78 3C83 4 82 10 77 10C74 10 74 7 76 6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M86 8L89 5L90 8L89 11Z" fill="currentColor" />
      <path d="M40 8L44 5.5L48 8L44 10.5Z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function TituloOrnado({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h3 id={id} className={cn('flex items-center justify-center gap-2.5', className)}>
      <Filigrana />
      <span className="dv-label whitespace-nowrap text-[10.5px] text-dv-gold-bright">{children}</span>
      <Filigrana espelho />
    </h3>
  )
}

export { Sigilo }
