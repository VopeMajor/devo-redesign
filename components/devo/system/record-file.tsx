'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Barcode, BrassCorners, GlyphClip, GlyphClock, GlyphHourglass, IconLock, Stamp, TimeDigits } from '@/components/devo/kit'
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

/** Borda inferior serrilhada (picote de formulário): a folha "termina" sobre o papel da mesa. */
const PERFORATION: CSSProperties = {
  background: 'radial-gradient(circle at 7px 0, var(--in-porcelain) 5.5px, transparent 6px) 0 0 / 14px 8px repeat-x',
}

/**
 * Ficha do participante: folha de porcelana presa à mesa de papel frio, com a foto (polaroide com
 * clipe de aço), faixa negra de "arquivo confidencial", carimbo em grafite e um visor de mármore
 * negro onde corre o tempo de vida. Preto, branco e aço; ametista só num losango; rubi só no crítico.
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
    <article aria-label={`Record File de ${data.name}`} className={cn('relative mb-2 text-[#0d0d0f] drop-shadow-[0_16px_22px_rgba(13,13,15,0.28)]', className)}>
      <div className="dv-cut relative bg-[color:var(--in-porcelain)] bg-[radial-gradient(110%_60%_at_20%_0%,#ffffff,transparent_65%)] shadow-[inset_0_0_0_1px_rgba(13,13,15,0.14)]" style={{ '--dv-cut': '14px' } as CSSProperties}>
        <BrassCorners size={28} inset={4} />
        {/* pauta finíssima do formulário */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-16 top-28 bg-[repeating-linear-gradient(180deg,transparent_0_27px,rgba(13,13,15,0.05)_27px_28px)]" />

        {/* Cabeçalho do documento */}
        <header className="relative flex items-center gap-3 px-5 pb-3 pt-6">
          <DeadlyVoteSymbol variant="full" className="size-11 text-[#1c1c1f]" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#58585e]">Deadly Vote · Record System</p>
            <h2 className="mt-1 flex flex-wrap items-baseline gap-x-2.5 font-serif text-[27px] font-light uppercase leading-none tracking-[0.03em]">
              Record File
              <span lang="ja" className="font-sans text-[10px] font-normal tracking-[0.16em] text-[#58585e]">
                レコード・ファイル
              </span>
            </h2>
          </div>
        </header>

        {/* Faixa do arquivo: tinta negra, texto branco; a joia ametista é o único acento frio */}
        <div className="relative mx-5 flex h-7 items-center gap-2 overflow-hidden">
          <span aria-hidden="true" className="absolute inset-y-0 -left-2 right-9 -skew-x-[18deg] bg-[#1c1c1f]" />
          <span aria-hidden="true" className="absolute inset-y-0 right-3 w-3 -skew-x-[18deg] bg-[#1c1c1f]/70" />
          <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1 -skew-x-[18deg] bg-[#1c1c1f]/40" />
          <span className="relative flex min-w-0 items-center gap-2 whitespace-nowrap pl-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
            <span aria-hidden="true" className="size-[7px] shrink-0 rotate-45 bg-dv-amethyst shadow-[0_0_6px_rgba(138,124,200,0.9)]" />
            Arquivo confidencial · {data.recordId}
          </span>
        </div>

        <div className={cn('relative grid gap-4 px-5 pt-6', compact ? 'grid-cols-[36%_1fr]' : 'grid-cols-[43%_1fr] @xl:grid-cols-[13rem_1fr]')}>
          {/* Polaroide presa por clipe de aço + carimbo */}
          <div className="flex min-w-0 flex-col gap-4">
            <figure className="relative" style={{ transform: 'rotate(-2.2deg)' } as CSSProperties}>
              <div className="bg-[#fbfaf7] p-1.5 pb-6 shadow-[0_6px_14px_rgba(13,13,15,0.3),0_0_0_1px_rgba(13,13,15,0.08)]">
                <div className="bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] relative aspect-[3/4] overflow-hidden bg-[#1f1f22]">
                  {data.photoUrl ? (
                    // biome-ignore lint/performance/noImgElement: foto enviada pelo usuário, servida pela API privada
                    <img src={data.photoUrl} alt={`Foto de ${data.name}`} className="absolute inset-0 size-full object-cover grayscale-[0.15]" />
                  ) : (
                    <div role="img" aria-label="Sem foto de perfil" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_30%,rgba(241,240,238,0.10),transparent_70%)]">
                      <Silhouette className="absolute inset-x-[12%] bottom-0 top-[24%] text-[#8f8e8b]/45" />
                      <DeadlyVoteSymbol variant="full" className="absolute left-1/2 top-[8%] size-[26%] -translate-x-1/2 text-[#bab09f]/45" />
                    </div>
                  )}
                  {/* Régua de identificação, como foto de ficha */}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-[repeating-linear-gradient(180deg,rgba(241,240,238,0.4)_0_1px,transparent_1px_8px)]" />
                </div>
                <figcaption className="absolute inset-x-2 bottom-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[#58585e]">
                  <span>{imgCode}</span>
                  <span className="dv-tabular">№ 01</span>
                </figcaption>
              </div>
              <GlyphClip className="absolute -top-5 left-3 size-10 -rotate-12 text-[#8f8e8b] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]" />
              <div className="pointer-events-none absolute -right-3 bottom-5">
                {eliminated ? (
                  <Stamp text="Eliminado" tone="blood" rotate={-14} size={96} animate />
                ) : data.critical ? (
                  <Stamp text="Crítico" tone="blood" rotate={-12} size={86} />
                ) : (
                  <Stamp text="Registrado" shape="round" tone="ink" rotate={14} size={76} className="opacity-75" />
                )}
              </div>
            </figure>
            {photoAction}
          </div>

          {/* Identificação */}
          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#58585e]">Participante</p>
              <p className="mt-1 break-words font-impact text-[30px] font-bold uppercase leading-[0.95] tracking-[0.02em]">{data.name}</p>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#0d0d0f]/85">
                <span className="text-[#58585e]">ID.Record </span>
                {data.recordId}
              </p>
            </div>
            <dl className="flex flex-col gap-3 border-t border-[#0d0d0f]/20 pt-3">
              <Field label="Status atual">
                <StatusBlock tone={data.status.tone}>{data.status.label}</StatusBlock>
              </Field>
              <Field label="Arcano">
                <span className="flex items-center gap-2">
                  <span className={cn('font-serif text-[18px] font-light uppercase leading-none tracking-[0.06em]', !data.arcano && 'text-[#58585e]')}>{data.arcano ?? 'Não revelado'}</span>
                  {!data.arcano && <IconLock className="size-3.5 text-[#58585e]" />}
                </span>
              </Field>
            </dl>
          </div>
        </div>

        {/* Visor de mármore negro: tempo de vida */}
        <div className="relative px-5 pt-6">
          <LifePlate remainingMs={data.remainingMs} critical={data.critical} />
        </div>

        {!compact && (
          <dl className="relative mx-5 mt-5 grid grid-cols-3 gap-3">
            {data.stats.map((st) => (
              <div key={st.label} className="relative pl-3">
                <span aria-hidden="true" className="absolute bottom-0.5 left-0 top-0.5 w-[2px] bg-[linear-gradient(180deg,#bab09f,#6b6357)]" />
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#58585e]">{st.label}</dt>
                <dd className="mt-1 font-impact text-[28px] font-semibold leading-none dv-tabular">{st.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Shuffler + ação */}
        <div className="relative mx-5 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#0d0d0f]/30 pt-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={cn('grid size-9 place-items-center rounded-full border', awake ? 'border-[#1c1c1f] text-[#1c1c1f]' : 'border-[#0d0d0f]/30 text-[#58585e]')}>
              <GlyphClock className={cn('size-5', awake && 'animate-[spin_9s_linear_infinite] motion-reduce:animate-none')} />
            </span>
            <dl>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#58585e]">Card Shuffler</dt>
              <dd className={cn('font-serif text-[18px] font-light uppercase leading-tight tracking-[0.08em]', awake ? 'text-[#0d0d0f]' : 'text-[#58585e]')}>{shuffler}</dd>
            </dl>
          </div>
          {action}
        </div>

        {/* Rodapé do documento (24px de respiro antes do picote) */}
        <footer className="relative mx-5 mt-4 flex items-end justify-between gap-3 border-t border-[#0d0d0f]/20 pb-6 pt-3">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-[#58585e]">
            Emitido pelo Gerente
            <br />
            Folha 01/01 · Tribunal do Relógio
          </p>
          <Barcode value={data.recordId} height={22} width={88} className="text-[#1c1c1f]/80" />
        </footer>
      </div>
      <span aria-hidden="true" className="absolute inset-x-[14px] -bottom-[7px] h-2" style={PERFORATION} />
    </article>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#58585e]">{label}</dt>
      <dd className="flex">{children}</dd>
    </div>
  )
}

/** Status no papel: bloco negro (ativo, com joia ametista), rubi (crítico) ou tinta (inativo). */
function StatusBlock({ tone, children }: { tone: SystemTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'dv-cut-diag inline-flex h-8 items-center gap-2 px-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em]',
        tone === 'active' && 'bg-[#1c1c1f] text-white',
        tone === 'critical' && 'bg-[#a3121f] text-white',
        tone === 'idle' && 'bg-[#0d0d0f]/10 text-[#0d0d0f]',
      )}
      style={{ '--dv-cut': '7px' } as CSSProperties}
    >
      <span aria-hidden="true" className={cn('size-[7px] rotate-45', tone === 'active' ? 'bg-dv-amethyst' : 'bg-current', tone === 'critical' && 'animate-dv-blink')} />
      {children}
    </span>
  )
}

/** Visor de mármore negro embutido na folha: o relógio de vida (D:H:M:S) em porcelana. */
function LifePlate({ remainingMs, critical }: { remainingMs: number; critical: boolean }) {
  const [d, h, m, s] = lifeClock(remainingMs)
  return (
    <div
      className={cn(
        'dv-cut bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] relative overflow-hidden bg-[#0c0c0e] px-4 pb-3 pt-3 text-dv-text shadow-[inset_0_0_0_1px_rgba(186,176,159,0.5)]',
        critical && 'shadow-[inset_0_0_0_1px_rgba(255,90,99,0.6)]',
      )}
      style={{ '--dv-cut': '10px' } as CSSProperties}
    >
      <span aria-hidden="true" className="dv-scanlines pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex items-center justify-between gap-2">
        <p className={cn('flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]', critical ? 'text-dv-blood-text' : 'text-dv-gold')}>
          <GlyphHourglass className="size-3.5" />
          Tempo de vida
        </p>
        <p className={cn('flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]', critical ? 'text-dv-blood-text' : 'text-dv-text-3')}>
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', critical ? 'animate-dv-blink bg-current' : 'bg-dv-amethyst')} />
          {critical ? 'Pulso crítico' : 'Pulso estável'}
        </p>
      </div>
      <div className="relative mt-2">
        <TimeDigits
          value={`${d}:${h}:${m}:${s}`}
          size="md"
          tone={critical ? 'blood' : 'text'}
          flip={false}
          blinkColon={critical}
          label="Tempo de vida"
          units={['Dias', 'Horas', 'Min', 'Seg']}
          className="text-[38px]"
        />
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
