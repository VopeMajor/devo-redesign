import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BrassCorners } from '../ornament/brass'
import { LaceEdge } from '../ornament/jewelry'
import { HudCode, HudCross, HudRule, hudCode } from './hud'

export type PanelAction = { label: string; onClick?: MouseEventHandler<HTMLButtonElement>; href?: string }

/** "VER TODAS ›" — link de ação do cabeçalho de painel (alvo de 44px). */
export function PanelLink({ label, onClick, href, className }: PanelAction & { className?: string }) {
  const cls = cn(
    'dv-focus -my-3 -mr-2 inline-flex min-h-11 items-center gap-1 px-2 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-in-accent transition-opacity hover:opacity-80',
    className,
  )
  const content = (
    <>
      {label}
      <span aria-hidden="true" className="text-[13px] leading-none">›</span>
    </>
  )
  if (href)
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    )
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  )
}

/** Título do interior: serifada fina caixa-alta + legenda japonesa pequena em cobalto. */
export function RecordTitle({ title, jp, size = 'md', as: Tag = 'h2', className }: { title: string; jp?: string; size?: 'sm' | 'md' | 'lg'; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
  return (
    <Tag className={cn('flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5', className)}>
      <span className={cn('font-serif font-light uppercase leading-none tracking-[0.03em] text-in-fg', size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-[22px]' : 'text-[18px]')}>{title}</span>
      {jp && (
        <span lang="ja" className="font-sans text-[10px] font-normal leading-none tracking-[0.12em] text-in-accent">
          {jp}
        </span>
      )}
    </Tag>
  )
}

export type RecordPanelVariant = 'dark' | 'paper' | 'cobalt'

/**
 * Painel do Record. `dark` = painel preto (padrão, inverte os tokens do interior para dentro);
 * `paper` = folha clara com filete; `cobalt` = cabeçalho em bloco cobalto (painel-destaque, como ARCANO).
 * Cabeçalho: título serifado fino caixa-alta + legenda japonesa + ação "VER TODAS ›".
 */
export function RecordPanel({
  title,
  jp,
  action,
  variant = 'dark',
  chamfer = false,
  pad = 'md',
  as: Tag = 'section',
  headerRight,
  ornate = false,
  className,
  bodyClassName,
  children,
  style,
}: {
  title?: string
  jp?: string
  action?: PanelAction
  variant?: RecordPanelVariant
  /** Chanfro no canto superior-esquerdo/inferior-direito. */
  chamfer?: boolean
  pad?: 'none' | 'sm' | 'md'
  as?: 'section' | 'div' | 'article' | 'aside'
  /** Substitui a ação (ex.: selo REC, contador). */
  headerRight?: ReactNode
  /** Cantos de filigrana em latão (painel-foco da tela; no máximo 2 por tela). */
  ornate?: boolean
  className?: string
  bodyClassName?: string
  children?: ReactNode
  style?: CSSProperties
}) {
  const dark = variant !== 'paper'
  const p = pad === 'none' ? '' : pad === 'sm' ? 'px-3 pb-3' : 'px-4 pb-4'
  return (
    <Tag
      aria-label={title}
      className={cn(
        'relative min-w-0',
        dark ? 'dv-interior-dark dv-record-panel' : 'bg-[color:var(--in-porcelain)] bg-[radial-gradient(90%_60%_at_25%_0%,rgba(255,255,255,0.9),transparent_60%)] shadow-[inset_0_0_0_1px_var(--in-line-strong),inset_0_1px_0_#fff]',
        chamfer && 'dv-cut-diag',
        className,
      )}
      style={{ '--dv-cut': '12px', ...style } as CSSProperties}
    >
      {title && (
        <header
          className={cn(
            'relative flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5',
            variant === 'cobalt' && 'bg-[linear-gradient(100deg,var(--in-accent-fill)_0%,#1035c4_55%,transparent_100%)] pb-3',
          )}
        >
          <RecordTitle title={title} jp={jp} className={variant === 'cobalt' ? '[&_span]:!text-white' : undefined} />
          {headerRight ?? (action && <PanelLink {...action} className={variant === 'cobalt' ? '!text-white' : undefined} />)}
          <span aria-hidden="true" className={cn('absolute inset-x-4 bottom-0 h-px', dark ? 'bg-[linear-gradient(90deg,var(--in-brass)_0%,rgba(176,154,108,0.35)_45%,transparent_100%)]' : 'bg-in-line')} />
        </header>
      )}
      {ornate && <BrassCorners size={dark ? 26 : 22} inset={3} />}
      <div className={cn(title ? 'pt-3' : pad === 'none' ? '' : 'pt-4', p, bodyClassName)}>{children}</div>
    </Tag>
  )
}

/**
 * Folha de papel do interior: fundo frio com retícula e grão, réguas de HUD nas margens, código do
 * documento e marcas de registro. Use como fundo de tela do interior (ativa o escopo .dv-interior).
 */
export function PaperSheet({
  code,
  sub,
  children,
  rulers = true,
  lace = true,
  className,
  innerClassName,
  as: Tag = 'div',
}: {
  /** Código do documento (ex.: hudCode('perfil')). */
  code?: string
  sub?: string
  children?: ReactNode
  /** Réguas e marcas nas margens. */
  rulers?: boolean
  /** Renda de borda (gravada, quase invisível) no topo da folha. */
  lace?: boolean
  className?: string
  innerClassName?: string
  as?: 'div' | 'main' | 'section'
}) {
  const c = code ?? hudCode('devo')
  return (
    <Tag className={cn('dv-interior dv-cold-paper relative isolate min-h-full', className)}>
      {rulers && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <HudRule vertical className="absolute bottom-24 left-1.5 top-24" />
          <span className="absolute left-0.5 top-[38%] origin-left -rotate-90 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.3em] text-in-fg-3">Archive / Record System</span>
          <HudCross className="absolute left-2 top-2" />
          <HudCross className="absolute right-2 top-2" />
          <HudCross className="absolute bottom-2 left-2" />
          <HudCross className="absolute bottom-2 right-2" />
          <div className="absolute right-3 top-3">
            <HudCode code={c} sub={sub ?? 'DV_MS_2024_0518'} />
          </div>
          {/* mancha de retícula violeta no canto (tinta de impressão) */}
          <span className="dv-halftone absolute -right-10 top-28 size-40 rounded-full text-in-violet opacity-[0.16] [mask-image:radial-gradient(closest-side,#000,transparent)]" />
          {/* xadrez de mármore quase invisível no pé da folha */}
          <span className="dv-checker-faint absolute inset-x-0 bottom-0 h-[40%] [mask-image:linear-gradient(to_top,#000,transparent)]" />
        </div>
      )}
      {lace && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 opacity-[0.09]">
          <LaceEdge tone="ink" height={14} />
        </div>
      )}
      <div className={cn('relative', innerClassName)}>{children}</div>
    </Tag>
  )
}
