import { cn } from '@/lib/utils'

/** Nota → fração da barra, se `value` não vier. */
const GRADE_VALUE: Record<string, number> = { SS: 0.98, 'S+': 0.92, S: 0.86, 'A+': 0.78, A: 0.7, 'A-': 0.64, 'B+': 0.56, B: 0.48, 'B-': 0.42, C: 0.32, D: 0.2, E: 0.1 }

/**
 * Atributo com barra fina e nota (Virtudes: PERSUASÃO ··· SS). A nota é serifada fina na tinta do sistema;
 * `locked` mostra "—" e a barra tracejada (atributo ainda não revelado).
 */
export function GradeBar({ label, grade, value, locked = false, className }: { label: string; grade?: string; value?: number; locked?: boolean; className?: string }) {
  const v = Math.max(0, Math.min(1, value ?? (grade ? GRADE_VALUE[grade.toUpperCase()] ?? 0.5 : 0)))
  return (
    <div className={cn('flex items-end gap-3', className)}>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-in-fg-2">{label}</p>
        <div className="relative mt-2 h-[3px]" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={locked ? undefined : Math.round(v * 100)} aria-valuetext={locked ? 'não revelado' : grade}>
          <span aria-hidden="true" className={cn('absolute inset-x-0 top-1/2 h-px -translate-y-1/2', locked ? 'bg-[repeating-linear-gradient(90deg,var(--in-line-strong)_0_3px,transparent_3px_6px)]' : 'bg-in-line')} />
          {!locked && <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-in-accent-fill shadow-[0_0_8px_var(--in-accent-glow)]" style={{ width: `${v * 100}%` }} />}
        </div>
      </div>
      <span aria-hidden="true" className={cn('w-9 shrink-0 text-right font-serif text-[24px] font-light leading-none', locked ? 'text-in-fg-3' : 'text-in-accent')}>
        {locked ? '—' : grade}
      </span>
    </div>
  )
}
