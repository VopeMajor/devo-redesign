import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'
import {
  EmblemAjustes,
  EmblemArcanos,
  EmblemAvisos,
  EmblemCartas,
  EmblemCorporacoes,
  EmblemJogos,
  EmblemMascaras,
  EmblemMensagens,
  EmblemPoco,
  EmblemPulso,
  EmblemRecord,
  EmblemTorres,
  EmblemTrocas,
  EmblemVirtudes,
  EmblemVotes,
} from '../emblems'

/**
 * Ícones do interior (barra inferior, abas, sistemas futuros). Desde a Direção 2 §6 são os EMBLEMAS
 * do kit (`kit/emblems.tsx`): silhueta branca/prata sem fundo, `currentColor`, decorativos. Os nomes
 * `Icon*` ficam por compatibilidade. Só o cadeado continua em traço fino (é sinal, não emblema).
 */
type P = SVGProps<SVGSVGElement> & { className?: string }
const base = (c?: string) => cn('inline-block shrink-0', c)
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
type EP = { className?: string }

export const IconRecord = ({ className }: EP) => <EmblemRecord className={className} />
export const IconArcano = ({ className }: EP) => <EmblemArcanos className={className} />
export const IconCartas = ({ className }: EP) => <EmblemCartas className={className} />
export const IconVotes = ({ className }: EP) => <EmblemVotes className={className} />
export const IconAvisos = ({ className }: EP) => <EmblemAvisos className={className} />
export const IconPulso = ({ className }: EP) => <EmblemPulso className={className} />
export const IconMensagens = ({ className }: EP) => <EmblemMensagens className={className} />
export const IconTrocas = ({ className }: EP) => <EmblemTrocas className={className} />
export const IconJogos = ({ className }: EP) => <EmblemJogos className={className} />
export const IconAjustes = ({ className }: EP) => <EmblemAjustes className={className} />
export const IconTorre = ({ className }: EP) => <EmblemTorres className={className} />
export const IconPoco = ({ className }: EP) => <EmblemPoco className={className} />
export const IconVirtudes = ({ className }: EP) => <EmblemVirtudes className={className} />
export const IconCorporacoes = ({ className }: EP) => <EmblemCorporacoes className={className} />
export const IconMascaras = ({ className }: EP) => <EmblemMascaras className={className} />

export function IconLock({ className, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={base(className)} {...S} {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="1" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </svg>
  )
}
