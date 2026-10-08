import { cn } from '@/lib/utils'

const STAR =
  'M32 7C33.4 25.2 38.8 30.6 57 32C38.8 33.4 33.4 38.8 32 57C30.6 38.8 25.2 33.4 7 32C25.2 30.6 30.6 25.2 32 7Z' +
  'M32 27.6a4.4 4.4 0 1 0 0.001 0Z'

type Props = {
  className?: string
  /** `full` traz anéis de mira e marcações; `mark` é a versão reduzida para tamanhos pequenos. */
  variant?: 'full' | 'mark'
  animated?: boolean
  title?: string
}

/**
 * Símbolo oficial do DEADLY VOTE: estrela de voto (cruz), órbita de registro,
 * olho de observação no núcleo e anel de mira. Usa `currentColor`.
 */
export function DeadlyVoteSymbol({ className, variant = 'full', animated = false, title }: Props) {
  const full = variant === 'full'
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('shrink-0', animated && 'dv-symbol-in', className)}
    >
      {full && (
        <g stroke="currentColor">
          <circle cx="32" cy="32" r="29.5" strokeWidth="0.8" opacity="0.55" />
          <circle cx="32" cy="32" r="26" strokeWidth="1.6" strokeDasharray="0.8 3.3" opacity="0.7" />
          <path d="M32 0.5v4M32 59.5v4M0.5 32h4M59.5 32h4" strokeWidth="1" />
        </g>
      )}
      <g className={animated ? 'dv-orbit' : undefined}>
        <ellipse cx="32" cy="32" rx="27" ry="9.5" transform="rotate(-24 32 32)" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="55.6" cy="21.9" r="2.2" fill="currentColor" />
      </g>
      <path d={STAR} fill="currentColor" fillRule="evenodd" />
      <circle cx="32" cy="32" r="1.6" fill="currentColor" />
    </svg>
  )
}
