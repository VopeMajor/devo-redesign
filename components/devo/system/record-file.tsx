'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Frame, GlyphClip, GlyphClock, GlyphHourglass, Stamp, StatusSeal, TimeDigits } from '@/components/devo/kit'
import { lifeClock } from '@/lib/devo/deadly-votes'
import { SHUFFLER_LABEL } from '@/lib/devo/shuffler'
import { cn } from '@/lib/utils'
import type { SystemTone } from './primitives'
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

/**
 * Ficha do participante: dossiê em papel marfim (documento do tribunal) com a foto presa por
 * clipe, carimbo de registro e uma placa de terminal embutida onde corre o tempo de vida.
 * O azul-cobalto é a cor do sistema; o vermelho só aparece com tempo crítico ou eliminação.
 */
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
  const eliminated = data.remainingMs <= 0
  const shuffler = data.shuffler ?? SHUFFLER_LABEL.dormant
  const awake = shuffler !== SHUFFLER_LABEL.dormant
  const imgCode = `IMG_${data.recordId.slice(3, 7)}`

  return (
    <Frame
      as="article"
      variant="paper"
      tone="gold"
      ornate
      pad="none"
      cutSize={16}
      aria-label={`Record File de ${data.name}`}
      className={cn('drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]', className)}
    >
      {/* Cabeçalho do documento */}
      <header className="flex items-center gap-3 px-5 pb-3 pt-5">
        <DeadlyVoteSymbol variant="full" className="size-11 text-dv-cobalt-deep" />
        <div className="min-w-0 flex-1">
          <p className="dv-label text-[10px] text-dv-paper-ink/65">Deadly Vote · Record System</p>
          <h2 className="mt-1 flex flex-wrap items-baseline gap-x-2.5 font-display text-[22px] font-semibold uppercase leading-none tracking-[0.06em]">
            Record File
            <span lang="ja" className="font-sans text-[11px] font-normal tracking-[0.2em] text-dv-paper-ink/55">
              レコード・ファイル
            </span>
          </h2>
        </div>
      </header>

      {/* Faixa diagonal do sistema */}
      <div aria-hidden="true" className="relative mx-5 h-6 overflow-hidden">
        <span className="absolute inset-y-0 -left-2 right-10 -skew-x-[18deg] bg-dv-cobalt-deep" />
        <span className="absolute inset-y-0 right-0 w-7 -skew-x-[18deg] bg-dv-cobalt-deep/35" />
        <span className="relative flex h-full items-center whitespace-nowrap pl-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
          Arquivo confidencial · {data.recordId}
        </span>
      </div>

      <div className={cn('grid gap-4 px-5 pt-6', compact ? 'grid-cols-[36%_1fr]' : 'grid-cols-[42%_1fr] @xl:grid-cols-[13rem_1fr]')}>
        {/* Polaroide presa por clipe + carimbo */}
        <div className="flex min-w-0 flex-col gap-4">
          <figure className="relative" style={{ transform: 'rotate(-2.4deg)' } as CSSProperties}>
            <div className="bg-[#fbf8f0] p-1.5 pb-6 shadow-[0_6px_14px_rgba(28,26,34,0.28),0_0_0_1px_rgba(28,26,34,0.08)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-[linear-gradient(170deg,#1b2a7a,var(--dv-cobalt-dim)_55%,var(--dv-ink))]">
                {data.photoUrl ? (
                  // biome-ignore lint/performance/noImgElement: foto enviada pelo usuário, servida pela API privada
                  <img src={data.photoUrl} alt={`Foto de ${data.name}`} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div role="img" aria-label="Sem foto de perfil" className="absolute inset-0">
                    <Silhouette className="absolute inset-x-[10%] bottom-0 top-[22%] text-white/20" />
                    <DeadlyVoteSymbol variant="full" className="absolute left-1/2 top-[10%] size-[30%] -translate-x-1/2 text-dv-cobalt-text/40" />
                  </div>
                )}
                {/* Régua de identificação, como foto de ficha */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.45)_0_1px,transparent_1px_8px)]" />
              </div>
              <figcaption className="absolute inset-x-2 bottom-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-dv-paper-ink/65">
                <span>{imgCode}</span>
                <span className="dv-tabular">№ 01</span>
              </figcaption>
            </div>
            <GlyphClip className="absolute -top-5 left-3 size-10 -rotate-12 text-dv-gold-deep drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
            <div className="pointer-events-none absolute bottom-5 -right-3">
              {eliminated ? (
                <Stamp text="Eliminado" tone="blood" rotate={-14} size={96} animate />
              ) : data.critical ? (
                <Stamp text="Crítico" tone="blood" rotate={-12} size={86} />
              ) : (
                <Stamp text="Registrado" shape="round" tone="cobalt" rotate={14} size={76} className="opacity-90" />
              )}
            </div>
          </figure>
          {photoAction}
        </div>

        {/* Identificação */}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <p className="dv-label text-[10px] text-dv-paper-ink/60">Participante</p>
            <p className="mt-1 break-words font-impact text-[30px] font-bold uppercase leading-[0.95] tracking-[0.02em]">{data.name}</p>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-dv-paper-ink/85">
              <span className="text-dv-paper-ink/55">ID </span>
              {data.recordId}
            </p>
          </div>
          <dl className="flex flex-col gap-3 border-t border-dv-paper-ink/20 pt-3">
            <Field label="Status atual">
              <StatusSeal tone={data.status.tone}>{data.status.label}</StatusSeal>
            </Field>
            <Field label="Arcano">
              <span className={cn('font-display text-[15px] font-semibold uppercase tracking-[0.1em]', !data.arcano && 'text-dv-paper-ink/60')}>
                {data.arcano ?? 'Não revelado'}
              </span>
            </Field>
          </dl>
        </div>
      </div>

      {/* Placa de terminal: tempo de vida */}
      <div className="px-5 pt-6">
        <LifePlate remainingMs={data.remainingMs} critical={data.critical} />
      </div>

      {!compact && (
        <dl className="mx-5 mt-5 grid grid-cols-3 gap-3">
          {data.stats.map((st) => (
            <div key={st.label} className="relative pl-3">
              <span aria-hidden="true" className="absolute bottom-0.5 left-0 top-0.5 w-[2px] bg-dv-cobalt-deep" />
              <dt className="dv-label text-[10px] text-dv-paper-ink/65">{st.label}</dt>
              <dd className="mt-1 font-impact text-[28px] font-semibold leading-none dv-tabular">{st.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Shuffler + ação */}
      <div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-dv-paper-ink/35 pt-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn('grid size-9 place-items-center rounded-full border', awake ? 'border-dv-cobalt-deep text-dv-cobalt-deep' : 'border-dv-paper-ink/30 text-dv-paper-ink/50')}
          >
            <GlyphClock className={cn('size-5', awake && 'animate-[spin_9s_linear_infinite] motion-reduce:animate-none')} />
          </span>
          <dl>
            <dt className="dv-label text-[10px] text-dv-paper-ink/65">Card Shuffler</dt>
            <dd className={cn('font-display text-[15px] font-semibold uppercase tracking-[0.12em]', awake ? 'text-dv-cobalt-deep' : 'text-dv-paper-ink/60')}>{shuffler}</dd>
          </dl>
        </div>
        {action}
      </div>

      {/* Rodapé do documento */}
      <footer className="mx-5 mb-5 mt-4 flex items-end justify-between gap-3 border-t border-dv-paper-ink/20 pt-3">
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-dv-paper-ink/60">
          Emitido pelo Gerente
          <br />
          Folha 01/01 · Tribunal do Relógio
        </p>
        <Barcode seed={data.recordId} />
      </footer>
    </Frame>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="dv-label text-[10px] text-dv-paper-ink/60">{label}</dt>
      <dd className="flex">{children}</dd>
    </div>
  )
}

/** Visor escuro embutido no papel: o relógio de vida em dígitos de largura fixa (D:H:M:S). */
function LifePlate({ remainingMs, critical }: { remainingMs: number; critical: boolean }) {
  const [d, h, m, s] = lifeClock(remainingMs)
  return (
    <div
      className={cn(
        'dv-cut relative overflow-hidden bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))] px-4 pb-3 pt-3 text-dv-text shadow-[inset_0_0_0_1px_rgba(125,151,255,0.25)]',
        critical && 'shadow-[inset_0_0_0_1px_rgba(255,90,99,0.6)]',
      )}
      style={{ '--dv-cut': '10px' } as CSSProperties}
    >
      <span aria-hidden="true" className="dv-scanlines pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex items-center justify-between gap-2">
        <p className={cn('dv-label flex items-center gap-2 text-[10px]', critical ? 'text-dv-blood-text' : 'text-dv-cobalt-text')}>
          <GlyphHourglass className="size-3.5" />
          Tempo de vida
        </p>
        <p className={cn('dv-label text-[10px]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>{critical ? 'Pulso crítico' : 'Pulso estável'}</p>
      </div>
      <div className="relative mt-2 flex flex-col items-start">
        <TimeDigits value={`${d}:${h}:${m}:${s}`} size="md" tone={critical ? 'blood' : 'cobalt'} flip={false} blinkColon={critical} label="Tempo de vida" className="text-[36px]" />
        <span aria-hidden="true" className="mt-1 grid grid-cols-[1.2em_0.34em_1.2em_0.34em_1.2em_0.34em_1.2em] text-[36px] leading-none">
          {['Dias', '', 'Horas', '', 'Min', '', 'Seg'].map((u, i) => (
            <span key={i} className={cn('dv-label text-center text-[10px] tracking-[0.12em]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>
              {u}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

/** Silhueta neutra para ficha sem foto. */
function Silhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" aria-hidden="true" className={className} fill="currentColor" preserveAspectRatio="xMidYMax meet">
      <circle cx="50" cy="44" r="21" />
      <path d="M6 120 C8 88 27 72 50 72 C73 72 92 88 94 120 Z" />
    </svg>
  )
}

/** Código de barras decorativo derivado do ID (só traços). */
function Barcode({ seed }: { seed: string }) {
  const els: ReactNode[] = []
  let x = 0
  for (let i = 0; i < 28; i++) {
    const w = ((seed.charCodeAt(i % seed.length) * (i + 3)) % 3) + 1
    if (i % 2 === 0) els.push(<rect key={i} x={x} y="0" width={w} height="26" fill="currentColor" />)
    x += w + 1
  }
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${x} 26`} preserveAspectRatio="none" className="h-6 w-24 shrink-0 text-dv-paper-ink/70">
      {els}
    </svg>
  )
}
