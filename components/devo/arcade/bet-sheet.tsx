'use client'

import { type CSSProperties, useState } from 'react'
import { Button, Frame, GlyphAlert, Sheet, TimeDigits } from '@/components/devo/kit'
import { type BetBoard, arcadePost } from '@/lib/devo/arcade/client'
import { playSfx } from '@/lib/devo/audio'
import { cn } from '@/lib/utils'
import { formatDuration, useNow } from '../hooks'
import { useDevo } from '../state/devo-store'
import { BET_OPTIONS, BET_RESERVE_MIN, formatMinutes, useApplyTime } from './arcade-shared'
import { Monogram } from './sala-ui'

export type Duel = BetBoard['events'][number]['duels'][number]

/** Abre a folha de aposta para um duelo; devolve o gatilho e o nó a renderizar. */
export function useBetSheet(onDone: () => void) {
  const [target, setTarget] = useState<{ duel: Duel; pick: string } | null>(null)
  const [open, setOpen] = useState(false)
  return {
    open: (duel: Duel, pick: string) => {
      setTarget({ duel, pick })
      setOpen(true)
    },
    node: target ? (
      <BetSheet
        open={open}
        duel={target.duel}
        pick={target.pick}
        onPick={(pick) => setTarget({ ...target, pick })}
        onClose={() => setOpen(false)}
        onDone={onDone}
      />
    ) : null,
  }
}

function BetSheet({ open, duel, pick, onPick, onClose, onDone }: { open: boolean; duel: Duel; pick: string; onPick: (p: string) => void; onClose: () => void; onDone: () => void }) {
  const { state } = useDevo()
  const now = useNow(1000)
  const applyTime = useApplyTime()
  const remainingMs = Math.max(0, state.timerEndsAt - now)
  const remainingMin = Math.floor(remainingMs / 60_000)
  const affordable = (v: number) => remainingMin - v >= BET_RESERVE_MIN
  const [amount, setAmount] = useState(() => BET_OPTIONS.find(affordable) ?? BET_OPTIONS[0])
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const side = duel.sides.find((s) => s.name === pick) ?? duel.sides[0]
  const payout = Math.round(amount * side.odds)

  const confirm = async () => {
    if (!affordable(amount)) {
      playSfx('error')
      return setError(`Você precisa manter ao menos ${BET_RESERVE_MIN}min no relógio.`)
    }
    setSending(true)
    setError('')
    try {
      applyTime(await arcadePost<{ timeDeltaMs?: number }>({ action: 'bet', duelId: duel.id, pick: side.name, amount }))
      playSfx('confirm')
      onDone()
      onClose()
    } catch (e) {
      playSfx('error')
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      kicker={`Livro da casa · duelo ${duel.slot + 1}`}
      title="Apostar Tempo"
      description="Escolha o lado e quanto do seu relógio está disposto a arriscar."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="sm:min-w-36">
            Cancelar
          </Button>
          <Button variant="danger" loading={sending} disabled={side.isMe} onClick={confirm} className="sm:min-w-48">
            Confirmar {formatMinutes(amount)}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Lado" className="grid grid-cols-2 gap-2">
        {duel.sides.map((s, i) => {
          const on = s.name === side.name
          return (
            <button
              key={s.name}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={s.isMe}
              onClick={() => {
                playSfx('card-select')
                onPick(s.name)
              }}
              className={cn(
                'dv-focus relative isolate flex min-h-[112px] flex-col items-center justify-center gap-1.5 px-2 py-3 transition-[transform,opacity] duration-200 enabled:active:scale-[0.97] disabled:opacity-40',
              )}
              style={{ '--dv-cut': '12px' } as CSSProperties}
            >
              <span aria-hidden="true" className={cn('dv-cut absolute inset-0 -z-10', on ? (i === 0 ? 'bg-dv-cobalt' : 'bg-dv-gold') : 'bg-dv-line-strong')} />
              <span
                aria-hidden="true"
                className={cn('dv-cut absolute inset-px -z-10', on ? (i === 0 ? 'bg-[linear-gradient(180deg,#14287a,var(--dv-ink))]' : 'bg-[linear-gradient(180deg,#2a2010,var(--dv-ink))]') : 'bg-dv-ink-2')}
                style={{ '--dv-cut': '11.6px' } as CSSProperties}
              />
              <Monogram name={s.name} size="md" tone={on ? (i === 0 ? 'cobalt' : 'gold') : 'neutral'} />
              <span className="max-w-full truncate font-body text-[15px] text-dv-text">{s.isMe ? `${s.name} (você)` : s.name}</span>
              <span className={cn('font-impact text-[26px] font-semibold leading-none dv-tabular', on ? (i === 0 ? 'text-dv-cobalt-text' : 'text-dv-gold-bright') : 'text-dv-text-2')}>
                {s.odds.toFixed(2).replace('.', ',')}×
              </span>
            </button>
          )
        })}
      </div>

      <p className="dv-label mb-2 mt-4 text-[10px] text-dv-text-3">Quanto do seu Tempo</p>
      <div role="radiogroup" aria-label="Valor" className="grid grid-cols-3 gap-1.5">
        {BET_OPTIONS.map((v) => {
          const on = amount === v
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!affordable(v)}
              onClick={() => {
                playSfx('click')
                setAmount(v)
                setError('')
              }}
              className={cn(
                'dv-focus min-h-11 -skew-x-[8deg] border font-impact text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                on ? 'border-dv-blood bg-dv-blood-deep text-white shadow-[0_0_16px_-4px_var(--dv-blood)]' : 'border-dv-line-strong bg-dv-ink-2 text-dv-text enabled:hover:border-dv-text-3',
              )}
            >
              <span className="inline-block skew-x-[8deg]">{formatMinutes(v)}</span>
            </button>
          )
        })}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-dv-line py-3">
        <div>
          <dt className="dv-label text-[10px] text-dv-text-3">Seu Tempo agora</dt>
          <dd className="mt-1">
            <TimeDigits value={formatDuration(remainingMs)} size="sm" tone="cobalt" flip={false} />
          </dd>
        </div>
        <div>
          <dt className="dv-label text-[10px] text-dv-text-3">Depois da aposta</dt>
          <dd className="mt-1">
            <TimeDigits value={formatDuration(Math.max(0, remainingMs - amount * 60_000))} size="sm" tone="text" flip={false} />
          </dd>
        </div>
        <div>
          <dt className="dv-label text-[10px] text-dv-text-3">Se {side.name} vencer</dt>
          <dd className="mt-1 font-impact text-[20px] font-semibold leading-none text-dv-cobalt-text dv-tabular">+{formatMinutes(payout)}</dd>
        </div>
        <div>
          <dt className="dv-label text-[10px] text-dv-text-3">Se perder</dt>
          <dd className="mt-1 font-impact text-[20px] font-semibold leading-none text-dv-blood-text dv-tabular">−{formatMinutes(amount)}</dd>
        </div>
      </dl>

      <Frame variant="alert" pad="sm" className="mt-4">
        <p className="flex gap-2.5 font-body text-[14px] leading-snug text-dv-text-2">
          <GlyphAlert className="mt-0.5 size-4 shrink-0 text-dv-blood-text" />
          <span>
            O Tempo apostado sai do seu pulso na hora. Se {side.name} perder, ele some. Se ganhar, volta multiplicado pela odd. Você precisa manter ao menos {BET_RESERVE_MIN}min.
          </span>
        </p>
      </Frame>
      {error && (
        <p role="alert" className="mt-3 font-body text-[14px] text-dv-blood-text">
          {error}
        </p>
      )}
    </Sheet>
  )
}
