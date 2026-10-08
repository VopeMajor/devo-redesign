'use client'

import { UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { lifeClock } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { RecordID, SystemLabel, SystemStatus, type SystemTone } from './primitives'
import { DeadlyVoteSymbol } from './symbol'

export type RecordFileData = {
  name: string
  recordId: string
  status: { label: string; tone: SystemTone }
  remainingMs: number
  critical: boolean
  arcano?: string | null
  shuffler?: string | null
  stats: { label: string; value: number | string }[]
  photoUrl?: string | null
}

/** Ficha de identificação do participante. Painel escuro: informação confidencial do sistema. */
export function RecordFile({
  data,
  action,
  photoAction,
  compact = false,
  className,
}: {
  data: RecordFileData
  action?: ReactNode
  photoAction?: ReactNode
  compact?: boolean
  className?: string
}) {
  const [d, h, m, s] = lifeClock(data.remainingMs)
  return (
    <article aria-label={`Record File de ${data.name}`} className={cn('dv-dark @container relative overflow-hidden border border-border bg-background text-foreground', className)}>
      <span aria-hidden="true" className="dv-scanlines pointer-events-none absolute inset-0" />
      <header className="relative flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="flex items-baseline gap-3">
          <span className="font-serif text-lg uppercase tracking-[0.04em]">Record File</span>
          <span lang="ja" className="text-[9px] tracking-[0.25em] text-muted-foreground">
            レコード・ファイル
          </span>
        </span>
        <SystemStatus tone="critical" className="text-[9px]">
          Rec
        </SystemStatus>
      </header>

      <div className={cn('relative flex', compact ? 'flex-row' : 'flex-col @md:flex-row')}>
        <div
          className={cn(
            'relative shrink-0 overflow-hidden bg-dv-blue-dark',
            compact ? 'w-[38%]' : 'h-[clamp(11rem,48cqw,20rem)] w-full @md:h-auto @md:min-h-64 @md:w-[clamp(12rem,36cqw,24rem)]',
          )}
        >
          {data.photoUrl ? (
            // biome-ignore lint/performance/noImgElement: foto enviada pelo usuário, servida pela API privada
            <img src={data.photoUrl} alt={`Foto de ${data.name}`} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div role="img" aria-label="Sem foto de perfil" className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-dv-blue/30 to-dv-blue-dark">
              <span className="flex aspect-square w-[min(55%,9rem)] items-center justify-center rounded-full border border-white/20 bg-white/5">
                <UserRound className="size-3/5 text-white/55" strokeWidth={1.25} aria-hidden="true" />
              </span>
            </div>
          )}
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-dv-blue-dark/70 via-transparent to-transparent" />
          <DeadlyVoteSymbol variant="mark" className="absolute bottom-3 left-3 size-12 text-white/85" />
          <SystemLabel className="absolute right-2 top-2 text-[9px] text-white/70">IMG_{data.recordId.slice(3, 7)}</SystemLabel>
          {photoAction && <div className="absolute bottom-3 right-3">{photoAction}</div>}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
          <div>
            <p className="truncate font-mono text-2xl uppercase tracking-[0.08em]">{data.name}</p>
            <RecordID value={data.recordId} className="mt-1 block text-[10px]" />
          </div>

          <dl className={cn('grid gap-x-4 gap-y-3 border-t border-border pt-3', compact ? 'grid-cols-2' : 'grid-cols-2 @lg:grid-cols-3')}>
            <Field label="Status atual">
              <SystemStatus tone={data.status.tone} className="text-[13px] tracking-[0.12em]">
                {data.status.label}
              </SystemStatus>
            </Field>
            <Field label="Arcano">
              <span className={cn('font-mono text-[13px] uppercase tracking-[0.12em]', !data.arcano && 'text-muted-foreground')}>{data.arcano ?? 'Não revelado'}</span>
            </Field>
            <Field label="Tempo de vida" wide={compact}>
              <span className={cn('font-mono text-xl tabular-nums tracking-[0.06em]', data.critical ? 'text-destructive' : 'text-foreground')}>
                {d}:{h}:{m}:{s}
              </span>
              <span aria-hidden="true" className="mt-0.5 grid w-max grid-cols-4 gap-[1.35ch] pl-[0.55ch] font-mono text-[8px] text-muted-foreground">
                <span>D</span>
                <span>H</span>
                <span>M</span>
                <span>S</span>
              </span>
            </Field>
          </dl>

          {!compact && (
            <dl className="grid grid-cols-3 border-y border-border">
              {data.stats.map((st, i) => (
                <div key={st.label} className={cn('px-3 py-2', i > 0 && 'border-l border-border')}>
                  <dt>
                    <SystemLabel className="text-[9px]">{st.label}</SystemLabel>
                  </dt>
                  <dd className="font-mono text-lg tabular-nums">{st.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
            <Field label="Shuffler">
              <span className={cn('font-mono text-[13px] uppercase tracking-[0.12em]', data.shuffler ? 'text-primary' : 'text-muted-foreground')}>
                {data.shuffler ?? 'Adormecido'}
              </span>
            </Field>
            {action}
          </div>
        </div>
      </div>
    </article>
  )
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', wide && 'col-span-2')}>
      <dt>
        <SystemLabel className="text-[9px]">{label}</SystemLabel>
      </dt>
      <dd className="flex flex-col">{children}</dd>
    </div>
  )
}
