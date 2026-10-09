import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FrameCorners } from './frame'

export type PortraitTone = 'cobalt' | 'gold' | 'blood' | 'neutral'
export type PortraitShape = 'arch' | 'rect' | 'round'

/** Luz de borda (segue o contorno do PNG/SVG via drop-shadow) e brilho de fundo por tom. */
const RIM: Record<PortraitTone, { rim: string; glow: string; line: string; floor: string }> = {
  cobalt: { rim: '125,151,255', glow: 'rgba(49,93,255,0.42)', line: 'border-dv-cobalt-text/45', floor: 'rgba(49,93,255,0.45)' },
  gold: { rim: '236,212,154', glow: 'rgba(201,164,92,0.32)', line: 'border-dv-gold/55', floor: 'rgba(201,164,92,0.4)' },
  blood: { rim: '255,90,99', glow: 'rgba(213,31,43,0.38)', line: 'border-dv-blood/55', floor: 'rgba(213,31,43,0.45)' },
  neutral: { rim: '236,238,242', glow: 'rgba(236,238,242,0.12)', line: 'border-dv-line-strong', floor: 'rgba(236,238,242,0.2)' },
}

const SHAPE: Record<PortraitShape, string> = {
  arch: 'aspect-[3/4] rounded-t-[999px] rounded-b-[6px]',
  rect: 'aspect-[3/4] rounded-[6px]',
  round: 'aspect-square rounded-full',
}

/**
 * Moldura de retrato de NPC — o MESMO tratamento para elenco raster (PNG/WebP) e SVG:
 * fundo noite com brilho do tom, luz de borda que acompanha a silhueta, leve correção de cor,
 * grão, vinheta e BASE QUE SE DISSOLVE em degradê (nunca o corte reto do arquivo).
 *
 *   <PortraitFrame src="/images/npc/rato.png" alt="O Rato" name="O Rato" role="Anfitrião" tone="gold" />
 *   <PortraitFrame {...portraitFrameProps('melissa', 'soft')} alt="Melissa" tone="cobalt" />  // mapa em lib/devo/npcs.ts
 */
export function PortraitFrame({
  src,
  alt,
  children,
  name,
  role,
  tone = 'cobalt',
  shape = 'arch',
  ornate = false,
  position = '50% 0%',
  scale = 1,
  className,
}: {
  /** Imagem raster. Use `children` para arte em SVG/React. */
  src?: string
  /** Descrição do retrato (obrigatória; vira o nome acessível). */
  alt: string
  children?: ReactNode
  /** Nome na plaqueta (opcional). */
  name?: string
  /** Papel/título curto sob o nome. */
  role?: string
  tone?: PortraitTone
  shape?: PortraitShape
  /** Cantos de filigrana (retrato-foco da tela). */
  ornate?: boolean
  /** object-position da imagem (enquadre o rosto). */
  position?: string
  /** Zoom da arte (1 = cabe inteira). */
  scale?: number
  className?: string
}) {
  const t = RIM[tone]
  const art: CSSProperties = {
    // a base some em degradê; topo e laterais ficam inteiros
    WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 58%, rgba(0,0,0,0.55) 78%, transparent 97%)',
    maskImage: 'linear-gradient(to bottom, #000 0%, #000 58%, rgba(0,0,0,0.55) 78%, transparent 97%)',
    filter: `drop-shadow(-1.5px -1px 0 rgba(${t.rim},0.55)) drop-shadow(1px 0 0 rgba(${t.rim},0.25)) drop-shadow(0 0 10px rgba(${t.rim},0.28)) contrast(1.05) saturate(0.92)`,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: '50% 20%',
  }
  return (
    <figure className={cn('relative w-[160px] shrink-0', className)}>
      <div role="img" aria-label={alt} className={cn('relative isolate overflow-hidden bg-dv-ink', SHAPE[shape])}>
        {/* fundo: noite + brilho do tom atrás da cabeça */}
        <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: `radial-gradient(70% 55% at 50% 32%, ${t.glow}, transparent 70%), linear-gradient(180deg, var(--dv-ink-3), var(--dv-ink) 85%)` }} />
        {/* arte */}
        <div aria-hidden="true" className="absolute inset-0" style={art}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" style={{ objectPosition: position }} />
          ) : (
            <div className="size-full [&>svg]:size-full">{children}</div>
          )}
        </div>
        {/* chão: halo do tom onde a base dissolveu */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-[-10%] bottom-[-14%] h-[34%]" style={{ background: `radial-gradient(50% 50% at 50% 50%, ${t.floor}, transparent 70%)` }} />
        {/* grão + vinheta */}
        <span aria-hidden="true" className="devo-grain pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-overlay" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_55%,rgba(2,3,7,0.7)_100%)]" />
        {/* filete */}
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 border', t.line, SHAPE[shape].replace(/aspect-\S+/, ''))} />
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-[5px] border border-white/[0.06]', SHAPE[shape].replace(/aspect-\S+/, ''))} />
      </div>
      {ornate && <FrameCorners tone={tone === 'neutral' ? 'gold' : tone} size={20} inset={-4} />}
      {(name || role) && (
        <figcaption className="relative -mt-5 flex flex-col items-center text-center">
          {name && (
            <span className="dv-cut-diag bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))] px-3 py-1 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-gold)]" style={{ '--dv-cut': '7px' } as CSSProperties}>
              {name}
            </span>
          )}
          {role && <span className="dv-label mt-1.5 text-[10px] text-dv-text-3">{role}</span>}
        </figcaption>
      )}
    </figure>
  )
}
