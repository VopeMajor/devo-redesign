'use client'

import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { Spinner } from '@/components/devo/kit'
import { playSfx, type Sfx } from '@/lib/devo/audio'
import { DEADLY_VOTE_STATUS, type DeadlyVoteStatus, STATUS_FLOW } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'

/**
 * Peças locais do Record sobre o interior (papel frio + painéis de mármore negro). Tudo lê os tokens
 * `--in-*`, então funciona igual no papel (`.dv-interior`) e dentro de painel preto
 * (`.dv-interior-dark`), onde as cores invertem sozinhas.
 * Candidatos ao kit: RecButton (primário porcelana/negro), StatusMark/StatusChip/LifecycleTrack
 * (os cinco estados do Deadly Vote) e RecInput (campo sublinhado do papel).
 */

/* ────────────────────────── Estados do Deadly Vote ────────────────────────── */

/**
 * Tratamento visual de cada estado, dentro da paleta do mármore:
 * - convocado (não iniciado): anel em ametista-grafite, joia ametista pequena — "à espera";
 * - em andamento: nó cheio na cor do texto (branco no painel, negro no papel) com halo pulsando;
 * - encerrado: losango cheio em aço champanhe — caso arquivado;
 * - cancelado: anel tracejado cinza com barra, rótulo riscado — suspenso, sem alarme;
 * - falha: rubi (único estado em vermelho).
 */
export const STATUS_TEXT: Record<DeadlyVoteStatus, string> = {
  convocado: 'text-in-accent',
  'em-progresso': 'text-in-fg font-semibold',
  concluido: 'text-in-gold',
  cancelado: 'text-in-fg-3 line-through decoration-1',
  falha: 'text-in-alert',
}

export function StatusMark({ status, size = 12, className }: { status: DeadlyVoteStatus; size?: number; className?: string }) {
  const s = { width: size, height: size } as CSSProperties
  return (
    <span aria-hidden="true" className={cn('relative grid shrink-0 place-items-center', className)} style={s}>
      {status === 'convocado' && (
        <>
          <span className="absolute inset-0 rounded-full border-[1.5px] border-in-accent bg-in-bg" />
          <span className="relative size-[34%] rotate-45 bg-dv-amethyst" />
        </>
      )}
      {status === 'em-progresso' && (
        <>
          <span className="absolute -inset-[45%] rounded-full bg-in-fg/15 motion-safe:animate-ping" />
          <span className="absolute -inset-[22%] rounded-full shadow-[0_0_0_1px_color-mix(in_oklab,var(--in-fg)_35%,transparent),0_0_10px_var(--in-accent-glow)]" />
          <span className="absolute inset-0 rounded-full bg-in-fg" />
          <span className="relative size-[30%] rounded-full bg-in-bg" />
        </>
      )}
      {status === 'concluido' && <span className="absolute inset-[8%] rotate-45 bg-[linear-gradient(135deg,#f4efe6,#9a9184_40%,#dcd5c8_60%,#5d564c)] shadow-[0_0_0_1px_var(--in-brass)]" />}
      {status === 'cancelado' && (
        <>
          <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-in-fg-3 bg-in-bg" />
          <span className="relative h-[1.5px] w-[120%] -rotate-45 bg-in-fg-3" />
        </>
      )}
      {status === 'falha' && (
        <>
          <span className="absolute inset-0 rounded-full border-[1.5px] border-in-alert bg-in-bg shadow-[0_0_8px_color-mix(in_oklab,var(--in-alert)_60%,transparent)]" />
          <span className="relative size-[44%] rounded-full bg-in-alert" />
        </>
      )}
    </span>
  )
}

/** Selo de estado (marca + rótulo) para cabeçalhos de caso e listas. */
export function StatusChip({ status, label, className }: { status: DeadlyVoteStatus; label?: string; className?: string }) {
  const live = status === 'em-progresso'
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-7 items-center gap-2 px-2.5 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.16em]',
        live ? 'bg-in-fg text-in-bg' : status === 'falha' ? 'bg-in-alert text-white' : 'shadow-[inset_0_0_0_1px_var(--in-line-strong)]',
        !live && status !== 'falha' && STATUS_TEXT[status],
        className,
      )}
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {live ? (
        <span aria-hidden="true" className="size-1.5 animate-dv-blink rounded-full bg-current" />
      ) : status === 'falha' ? (
        <span aria-hidden="true" className="size-1.5 rotate-45 bg-white" />
      ) : (
        <StatusMark status={status} size={9} />
      )}
      {label ?? DEADLY_VOTE_STATUS[status].label}
    </span>
  )
}

/**
 * Ciclo do caso: convocado → em andamento → encerrado (nós ligados por filete), e o desvio
 * (cancelado/falha) no lugar do passo em que o caso parou.
 */
export function LifecycleTrack({ status, className }: { status: DeadlyVoteStatus; className?: string }) {
  const broken = status === 'cancelado' || status === 'falha'
  // Desvio: mostra o ciclo até "em andamento" e troca o último passo pelo estado de interrupção.
  const steps: DeadlyVoteStatus[] = broken ? ['convocado', 'em-progresso', status] : STATUS_FLOW
  const at = broken ? 2 : STATUS_FLOW.indexOf(status)
  return (
    <ol aria-label={`Estado: ${DEADLY_VOTE_STATUS[status].label}`} className={cn('relative grid grid-cols-3', className)}>
      <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-[7px] h-px bg-in-line-strong" />
      <span
        aria-hidden="true"
        className={cn('absolute left-[16.6%] top-[7px] h-px', broken ? (status === 'falha' ? 'bg-in-alert' : 'bg-in-fg-3') : 'bg-in-fg')}
        style={{ width: `${(Math.max(0, at) / 2) * 66.8}%` }}
      />
      {steps.map((st, i) => {
        const done = i < at
        const current = i === at
        return (
          <li key={st} aria-current={current ? 'step' : undefined} className="relative flex flex-col items-center gap-1.5 text-center">
            {current ? (
              <StatusMark status={st} size={15} />
            ) : (
              <span aria-hidden="true" className={cn('relative mt-[3px] size-[9px] rotate-45', done ? 'bg-in-fg-2' : 'bg-in-bg shadow-[inset_0_0_0_1px_var(--in-line-strong)]')} />
            )}
            <span className={cn('font-mono text-[10px] uppercase leading-tight tracking-[0.12em]', current ? STATUS_TEXT[st] : done ? 'text-in-fg-2' : 'text-in-fg-3', current && st === 'cancelado' && 'no-underline')}>
              {DEADLY_VOTE_STATUS[st].short}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ──────────────────────────────── Botões ──────────────────────────────── */

export type RecButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type RecSurface = 'paper' | 'dark'

const REC_SIZE = {
  sm: 'min-h-11 px-4 text-[11px] tracking-[0.16em]',
  md: 'min-h-12 px-5 text-[12px] tracking-[0.18em]',
  lg: 'min-h-14 px-7 text-[13px] tracking-[0.2em]',
} as const

function recClass(variant: RecButtonVariant, surface: RecSurface, size: keyof typeof REC_SIZE, block?: boolean) {
  return cn(
    'dv-focus group relative isolate inline-flex select-none items-center justify-center gap-2.5 font-sans font-medium uppercase leading-tight',
    'transition-[transform,background-color,color,box-shadow] duration-[120ms] ease-out active:scale-[0.97] aria-disabled:pointer-events-none disabled:cursor-not-allowed disabled:[&:not([aria-busy])]:opacity-40',
    variant !== 'ghost' && 'dv-cut-diag',
    REC_SIZE[size],
    variant === 'primary' &&
      (surface === 'dark'
        ? // Porcelana com filete de aço: o primário sobre o mármore negro (ametista só no halo).
          'bg-[linear-gradient(180deg,#f7f6f3_0%,#e6e4df_100%)] text-dv-ink shadow-[inset_0_0_0_1px_#bab09f,inset_0_1px_0_#fff] enabled:hover:bg-[linear-gradient(180deg,#ffffff_0%,#ecebe7_100%)] hover:shadow-[inset_0_0_0_1px_#ece5d8,0_0_20px_-6px_rgb(var(--dv-amethyst-rgb)/0.75)]'
        : // Bloco negro sobre o papel.
          'bg-dv-block text-white shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)] enabled:hover:bg-dv-ink hover:shadow-[inset_0_0_0_1px_#bab09f,0_0_20px_-6px_rgb(var(--dv-amethyst-rgb)/0.7)]'),
    variant === 'secondary' && 'text-in-fg shadow-[inset_0_0_0_1px_var(--in-line-strong)] enabled:hover:shadow-[inset_0_0_0_1px_var(--in-fg)] hover:bg-in-fg/[0.04]',
    variant === 'ghost' && 'px-2 text-in-accent underline decoration-in-accent/40 underline-offset-[6px] hover:decoration-in-accent',
    variant === 'danger' && 'overflow-hidden bg-dv-blood text-white enabled:hover:bg-[#b8141f]',
    block && 'w-full',
  )
}

function RecInner({ icon, iconRight, children, variant, loading }: { icon?: ReactNode; iconRight?: ReactNode; children?: ReactNode; variant: RecButtonVariant; loading?: boolean }) {
  return (
    <>
      {variant === 'danger' && (
        <span aria-hidden="true" className="absolute inset-y-0 right-0 w-14 opacity-45 [background-image:repeating-linear-gradient(-55deg,rgba(255,255,255,0.4)_0_4px,transparent_4px_9px)]" />
      )}
      <span className={cn('relative flex items-center gap-2.5 text-center', loading && 'invisible')}>
        {icon && <span className="flex size-[1.3em] shrink-0 items-center [&>svg]:size-full">{icon}</span>}
        {children}
        {iconRight ? (
          <span className="flex size-[1.3em] shrink-0 items-center transition-transform group-hover:translate-x-0.5 [&>svg]:size-full">{iconRight}</span>
        ) : (
          variant !== 'ghost' && (
            <span aria-hidden="true" className="text-[1.3em] leading-none opacity-60 transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          )
        )}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-5" />
          <span className="sr-only">Carregando</span>
        </span>
      )}
    </>
  )
}

type RecCommon = {
  variant?: RecButtonVariant
  surface?: RecSurface
  size?: keyof typeof REC_SIZE
  block?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  sfx?: Sfx | false
}

/**
 * Botão do Record. Primário: porcelana com filete de aço no painel negro; bloco negro no papel.
 * Secundário: filete na cor do texto. Perigo: rubi com faixa (só alerta). Estados: hover (halo de
 * ametista), pressionado (0.97), foco (anel), desabilitado (40%), carregando (relógio).
 */
export const RecButton = forwardRef<HTMLButtonElement, RecCommon & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }>(function RecButton(
  { variant = 'primary', surface = 'dark', size = 'md', block, icon, iconRight, sfx, loading, className, children, disabled, onClick, type = 'button', style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) return
        if (sfx) playSfx(sfx)
        onClick?.(e)
      }}
      style={{ '--dv-cut': '9px', ...style } as CSSProperties}
      className={cn(recClass(variant, surface, size, block), className)}
      {...rest}
    >
      <RecInner icon={icon} iconRight={iconRight} variant={variant} loading={loading}>
        {children}
      </RecInner>
    </button>
  )
})

/** Mesmo visual do RecButton, como link (ex.: "Entrar no grupo", que abre o WhatsApp). */
export function RecLink({ variant = 'primary', surface = 'dark', size = 'md', block, icon, iconRight, sfx = 'confirm', className, children, onClick, style, ...rest }: RecCommon & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        if (sfx) playSfx(sfx)
        onClick?.(e)
      }}
      style={{ '--dv-cut': '9px', ...style } as CSSProperties}
      className={cn(recClass(variant, surface, size, block), className)}
    >
      <RecInner icon={icon} iconRight={iconRight} variant={variant}>
        {children}
      </RecInner>
    </a>
  )
}

/* ──────────────────────────────── Campos ──────────────────────────────── */

/** Rótulo de campo impresso (mono caixa-alta) — o padrão do formulário de acesso, no interior. */
export function RecLabel({ children, hint, className }: { children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <span className={cn('flex items-baseline justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-in-fg-2', className)}>
      <span>{children}</span>
      {hint && <span className="text-[10px] normal-case tracking-[0.04em] text-in-fg-3">{hint}</span>}
    </span>
  )
}

const FIELD =
  'peer w-full rounded-none border-b-2 border-in-line-strong bg-in-fg/[0.035] px-3 font-sans text-[16px] text-in-fg outline-none transition-[border-color,background-color] duration-200 placeholder:text-in-fg-3 focus:border-in-fg focus:bg-in-fg/[0.06] aria-[invalid=true]:border-in-alert'

/** Campo sublinhado com marcador lateral de foco (papel ou painel negro). */
export const RecInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function RecInput({ className, ...rest }, ref) {
  return (
    <span className="relative block">
      <input ref={ref} className={cn(FIELD, 'h-12', className)} {...rest} />
      <span aria-hidden="true" className="pointer-events-none absolute -left-2.5 bottom-1.5 top-1.5 w-[3px] origin-center scale-y-0 bg-dv-amethyst transition-transform duration-200 peer-focus:scale-y-100" />
    </span>
  )
})

export function RecTextarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <span className="relative block">
      <textarea className={cn(FIELD, 'resize-none py-2.5 leading-relaxed', className)} {...rest} />
      <span aria-hidden="true" className="pointer-events-none absolute -left-2.5 bottom-1.5 top-1.5 w-[3px] origin-center scale-y-0 bg-dv-amethyst transition-transform duration-200 peer-focus:scale-y-100" />
    </span>
  )
}

/** Etiqueta pequena (não clicável) do interior: filete na cor do texto; `solid` = bloco. */
export function RecTag({ children, tone = 'line', dot, className }: { children: ReactNode; tone?: 'line' | 'solid' | 'muted' | 'accent'; dot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.16em]',
        tone === 'line' && 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]',
        tone === 'solid' && 'bg-in-fg text-in-bg',
        tone === 'muted' && 'text-in-fg-3 shadow-[inset_0_0_0_1px_var(--in-line)]',
        tone === 'accent' && 'text-in-accent shadow-[inset_0_0_0_1px_var(--in-accent)]',
        className,
      )}
      style={{ '--dv-cut': '5px' } as CSSProperties}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-amethyst" />}
      {children}
    </span>
  )
}

/** Aba de pasta com o número do caso (bloco na cor do texto, número de impacto). */
export function CaseTab({ number, muted, className }: { number: number; muted?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('dv-cut-diag flex w-12 shrink-0 flex-col items-center justify-center py-1.5', muted ? 'bg-in-fg/10 text-in-fg-2' : 'bg-in-fg text-in-bg', className)}
      style={{ '--dv-cut': '8px' } as CSSProperties}
    >
      <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] opacity-70">Caso</span>
      <span className="font-impact text-[20px] font-bold leading-none dv-tabular">{String(number).padStart(3, '0')}</span>
    </span>
  )
}
