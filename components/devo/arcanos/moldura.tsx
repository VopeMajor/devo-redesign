'use client'

import { useId, useState } from 'react'
import { arteDe, type ArteTipo } from '@/lib/devo/arcanos-arte'
import type { ArcanoKey } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Sigilo } from './sigilos'

/**
 * Moldura ornamentada (cartela com crista e pingente, em metal champanhe pelos tokens) e o retrato dentro.
 * Sem arte entregue, o retrato é o placeholder: nicho escuro com o sigilo grande. `cor`: o próprio Arcano (ou
 * aberto pela equipe) em cor; senão grisalha (estátua cinza, ref-05).
 */
export function Moldura({ arcano, cor, aceso, carregar, className }: { arcano: ArcanoKey; cor: boolean; aceso?: boolean; carregar: boolean; className?: string }) {
  const id = `mo-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div className={cn('relative aspect-[200/290] w-full', className)}>
      {/* retrato, recortado pelo vão da moldura */}
      <div className="absolute inset-x-[16%] bottom-[13%] top-[13%] overflow-hidden" style={{ clipPath: 'inset(0 round 50% 50% 16% 16% / 26% 26% 8% 8%)' }}>
        <Retrato arcano={arcano} tipo="retrato" cor={cor} aceso={aceso} carregar={carregar} />
      </div>
      <svg viewBox="0 0 200 290" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--dv-gold-bright)" />
            <stop offset="0.45" stopColor="var(--dv-gold)" />
            <stop offset="1" stopColor="var(--dv-gold-deep)" />
          </linearGradient>
        </defs>
        <g fill="none" stroke={`url(#${id}-g)`} strokeLinejoin="round" className={cn(!cor && 'opacity-70')}>
          {/* aro externo: arco alto, ombros recolhidos, base em quilha */}
          <path strokeWidth="7" d="M26 92C26 44 58 30 100 26C142 30 174 44 174 92V214C174 240 150 252 128 256L100 268L72 256C50 252 26 240 26 214Z" />
          <path strokeWidth="1.4" strokeOpacity="0.7" d="M36 94C36 52 64 40 100 36C136 40 164 52 164 94V212C164 232 144 243 124 246L100 256L76 246C56 243 36 232 36 212Z" />
          {/* crista: dois chifres e a ponta */}
          <path strokeWidth="4" strokeLinecap="round" d="M70 34C60 20 66 8 78 6M130 34C140 20 134 8 122 6" />
          <path strokeWidth="3" d="M100 26L92 12L100 2L108 12Z" />
          {/* ombros em voluta */}
          <path strokeWidth="3.4" strokeLinecap="round" d="M26 120C14 118 10 106 18 100M174 120C186 118 190 106 182 100M26 190C14 192 10 204 18 210M174 190C186 192 190 204 182 210" />
          {/* pingente */}
          <path strokeWidth="3" d="M100 268L92 278L100 288L108 278Z" />
        </g>
        <g fill={`url(#${id}-g)`} className={cn(!cor && 'opacity-70')}>
          <circle cx="100" cy="12" r="2.6" />
          <circle cx="26" cy="152" r="4" />
          <circle cx="174" cy="152" r="4" />
        </g>
      </svg>
    </div>
  )
}

/** A imagem (se houver e estiver liberada para carregar) ou o placeholder do sigilo. */
export function Retrato({ arcano, tipo, cor, aceso, carregar, translucido, className }: { arcano: ArcanoKey; tipo: ArteTipo; cor: boolean; aceso?: boolean; carregar: boolean; translucido?: boolean; className?: string }) {
  const arte = arteDe(arcano, tipo)
  const [falhou, setFalhou] = useState(false)
  const img = carregar && arte && !falhou
  return (
    <div className={cn('relative size-full', className)}>
      <div
        className={cn(
          'absolute inset-0',
          translucido && 'opacity-75',
          cor
            ? 'bg-[radial-gradient(70%_55%_at_50%_38%,color-mix(in_oklab,var(--dv-amethyst)_34%,transparent),transparent_72%),linear-gradient(180deg,var(--dv-night-2),var(--dv-ink))]'
            : 'bg-[radial-gradient(70%_55%_at_50%_38%,color-mix(in_oklab,var(--dv-text)_14%,transparent),transparent_72%),linear-gradient(180deg,var(--dv-ink-4),var(--dv-ink))]',
        )}
      />
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={arte.src}
          srcSet={arte.srcSet}
          sizes={tipo === 'figura' ? '(max-width: 480px) 90vw, 420px' : '(max-width: 480px) 60vw, 260px'}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className={cn('absolute inset-0 size-full object-cover object-top', !cor && 'grayscale brightness-[0.8] contrast-[1.05]')}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <Sigilo arcano={arcano} estado={aceso ? 'aceso' : cor ? 'aberto' : 'apagado'} className={cn('w-[62%]', !cor && 'opacity-80')} />
        </div>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,color-mix(in_oklab,var(--dv-ink)_70%,transparent))]" />
    </div>
  )
}
