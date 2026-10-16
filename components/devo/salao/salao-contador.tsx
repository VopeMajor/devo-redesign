'use client'

import { type CSSProperties } from 'react'
import { formatDataHora, type SalaoRelogio } from '@/lib/devo/salao'
import { cn } from '@/lib/utils'
import { useNow } from '../hooks'
import { TimeDigits } from '../kit/time'
import { StateSeal } from '../os/shell-ui'

function partes(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return [d, h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/**
 * "Aquele número enorme bem ali": contagem até a próxima abertura do Salão (fechado) ou até o fim da edição
 * (aberto). Dígitos de impacto com virada mascarada do kit, rótulos Dias/Horas/Min/Seg, selo de estado e a data
 * em horário de Brasília. `destaque` = a cena do Herdeiro aponta para ele (halo de aço).
 */
export function ContadorSalao({ relogio, className, destaque = false, compacto = false, manual = false }: { relogio: SalaoRelogio; className?: string; destaque?: boolean; compacto?: boolean; manual?: boolean }) {
  const now = useNow(1000)
  const aberto = relogio.aberto
  const alvo = aberto ? relogio.fechaEm : relogio.proxima.inicio
  const restante = alvo ? alvo - now : 0
  const valor = alvo ? partes(restante) : '--:--:--:--'
  return (
    <section
      aria-label={aberto ? 'Salão aberto: tempo até o fim da edição' : 'Contagem até a próxima abertura'}
      className={cn('relative flex flex-col items-center text-center', className)}
    >
      <div className="flex items-center gap-2">
        {aberto ? (
          <StateSeal live>Aberto · Edição {String(relogio.corrente.n + 1).padStart(2, '0')}</StateSeal>
        ) : (
          <StateSeal tone="quiet">Fechado</StateSeal>
        )}
        {manual && relogio.forcado && <span className="dv-label text-[10px] text-dv-text-3">manual</span>}
      </div>
      <p className="dv-label mt-3 text-[10px] tracking-[0.24em] text-dv-text-2">{aberto ? (alvo ? 'A edição fecha em' : 'Aberto até segunda ordem') : 'Próxima abertura em'}</p>
      <div
        className={cn(
          'relative mt-2 px-3 transition-[filter] duration-500',
          destaque && '[filter:drop-shadow(0_0_18px_rgba(236,229,216,0.55))]',
        )}
      >
        {destaque && <span aria-hidden="true" className="dv-cut absolute -inset-x-1 -inset-y-2 animate-dv-fade shadow-[inset_0_0_0_1px_rgba(236,229,216,0.7)]" style={{ '--dv-cut': '10px' } as CSSProperties} />}
        <TimeDigits
          value={valor}
          tone={aberto ? 'gold' : 'text'}
          units={['Dias', 'Horas', 'Min', 'Seg']}
          label={aberto ? 'Fecha em' : 'Abre em'}
          className={compacto ? 'text-[40px]' : 'text-[54px]'}
        />
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-2">
        {aberto
          ? relogio.fechaEm
            ? `Fecha ${formatDataHora(relogio.fechaEm)}`
            : 'Abertura extraordinária'
          : `Abre ${formatDataHora(relogio.proxima.inicio)} · Brasília`}
      </p>
    </section>
  )
}
