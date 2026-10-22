'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { mutate } from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { getCard, getCardPeso, PESO_TEXTO, RARITY_META } from '@/lib/devo/cards'
import type { DeadlyVote } from '@/lib/devo/deadly-votes'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { Sheet } from '../kit/sheet'
import { CardFace } from '../shared/devo-card'
import { useDevo } from '../state/devo-store'
import { RECORD_KEY, recordAction } from '../system/use-deadly-votes'

/**
 * Peso das cartas no Deadly Vote (dono, 22/10): num caso com peso máximo, o Record escolhe as cartas que leva; a soma
 * dos pesos não pode passar do limite (o servidor confere de novo e recusa). Aqui: a escolha (com o medidor de peso)
 * e o resumo do que está sendo levado, com o botão de trocar enquanto o caso está convocado.
 */

type Pilha = { cardId: string; uids: string[] }

export function EscolherCartasSheet({
  open,
  onClose,
  pesoMaximo,
  inicial,
  titulo,
  acao,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  pesoMaximo: number
  inicial: string[]
  titulo: string
  acao: string
  onConfirm: (uids: string[]) => Promise<void>
}) {
  const { state } = useDevo()
  const pilhas = useMemo<Pilha[]>(() => {
    const m = new Map<string, string[]>()
    for (const c of state.inventory) m.set(c.cardId, [...(m.get(c.cardId) ?? []), c.uid])
    return [...m.entries()]
      .map(([cardId, uids]) => ({ cardId, uids }))
      .sort((a, b) => RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order)
  }, [state.inventory])
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    if (!open) return
    const ini = new Set(inicial)
    setQtd(Object.fromEntries(pilhas.map((p) => [p.cardId, p.uids.filter((u) => ini.has(u)).length])))
    setErro(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const peso = pilhas.reduce((s, p) => s + (qtd[p.cardId] ?? 0) * getCardPeso(p.cardId), 0)
  const levadas = pilhas.reduce((s, p) => s + (qtd[p.cardId] ?? 0), 0)
  const acima = peso > pesoMaximo
  const mudar = (p: Pilha, d: number) => {
    const n = Math.max(0, Math.min(p.uids.length, (qtd[p.cardId] ?? 0) + d))
    playSfx('click')
    setQtd({ ...qtd, [p.cardId]: n })
  }
  const confirmar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      await onConfirm(pilhas.flatMap((p) => p.uids.slice(0, qtd[p.cardId] ?? 0)))
      playSfx('confirm')
      onClose()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      kicker="Peso das cartas"
      title={titulo}
      description={`A soma dos pesos das cartas que você leva não pode passar de ${pesoMaximo}.`}
      footer={
        <div className="flex flex-col gap-2">
          <MedidorPeso peso={peso} maximo={pesoMaximo} />
          {acima && <p className="font-body text-[14px] text-dv-blood-text">Acima do peso máximo: tire alguma carta para participar.</p>}
          {erro && (
            <p role="alert" className="font-body text-[14px] text-dv-blood-text">
              {erro}
            </p>
          )}
          <Button block loading={ocupado} disabled={acima} onClick={confirmar}>
            {acao} · {levadas} {levadas === 1 ? 'carta' : 'cartas'}
          </Button>
        </div>
      }
    >
      {pilhas.length ? (
        <ul className="flex flex-col">
          {pilhas.map((p) => {
            const n = qtd[p.cardId] ?? 0
            const pc = getCardPeso(p.cardId)
            const cabe = peso + pc <= pesoMaximo
            return (
              <li key={p.cardId} className="flex min-h-20 items-center gap-3 border-b border-dv-line py-2 last:border-b-0">
                <CardFace cardId={p.cardId} className="w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text">{getCard(p.cardId).name}</p>
                  <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">
                    Peso {pc} · você tem {p.uids.length}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Passo rotulo={`Levar uma ${getCard(p.cardId).name} a menos`} disabled={n === 0} onClick={() => mudar(p, -1)}>
                    −
                  </Passo>
                  <span className={cn('w-7 text-center font-impact text-[20px] font-semibold leading-none dv-tabular', n ? 'text-dv-text' : 'text-dv-text-3')} aria-live="polite">
                    {n}
                  </span>
                  <Passo rotulo={`Levar mais uma ${getCard(p.cardId).name}`} disabled={n >= p.uids.length || !cabe} onClick={() => mudar(p, 1)}>
                    +
                  </Passo>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="font-body text-[15px] italic text-dv-text-2">Você não tem cartas. Dá para participar levando nenhuma.</p>
      )}
      <details className="mt-4">
        <summary className="dv-focus cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-2">O que é o peso?</summary>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-dv-text-2">{PESO_TEXTO}</p>
      </details>
    </Sheet>
  )
}

function Passo({ children, rotulo, disabled, onClick }: { children: string; rotulo: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={disabled}
      onClick={onClick}
      className="dv-focus dv-cut grid size-11 place-items-center font-mono text-[20px] leading-none text-dv-text shadow-[inset_0_0_0_1px_var(--dv-line-strong)] hover:shadow-[inset_0_0_0_1px_var(--dv-amethyst-text)] disabled:opacity-30"
      style={{ '--dv-cut': '6px' } as CSSProperties}
    >
      {children}
    </button>
  )
}

/** Barra do peso: aço até o limite, rubi quando passa. */
export function MedidorPeso({ peso, maximo, className, papel = false }: { peso: number; maximo: number; className?: string; papel?: boolean }) {
  const acima = peso > maximo
  return (
    <div className={cn('flex items-center gap-3', className)} role="meter" aria-valuemin={0} aria-valuemax={maximo} aria-valuenow={peso} aria-label="Peso das cartas">
      <span className={cn('h-2 flex-1', papel ? 'bg-dv-ink/10' : 'bg-white/[0.08]')}>
        <span className={cn('block h-full transition-[width] duration-300', acima ? 'bg-dv-blood' : papel ? 'bg-dv-ink' : 'bg-[image:var(--dv-champagne-grad)]')} style={{ width: `${Math.min(100, (peso / Math.max(1, maximo)) * 100)}%` }} />
      </span>
      <span className={cn('shrink-0 font-mono text-[13px] dv-tabular', acima ? (papel ? 'text-dv-blood' : 'text-dv-blood-text') : papel ? 'text-dv-ink' : 'text-dv-text')}>
        {peso}/{maximo}
      </span>
    </div>
  )
}

/** Resumo do que o Record leva (no cartaz e no dossiê), com o botão de trocar enquanto o caso está convocado. */
export function CartasLevadas({ vote, surface = 'dark' }: { vote: DeadlyVote; surface?: 'dark' | 'paper' }) {
  const [trocar, setTrocar] = useState(false)
  if (vote.pesoMaximo == null || !vote.joined) return null
  const peso = vote.minhasCartas.reduce((s, c) => s + getCardPeso(c.cardId), 0)
  const papel = surface === 'paper'
  const fg2 = papel ? 'text-[#58585e]' : 'text-in-fg-2'
  return (
    <div className="flex flex-col gap-2">
      <p className={cn('font-mono text-[10.5px] uppercase tracking-[0.14em]', fg2)}>
        Suas cartas · {vote.minhasCartas.length ? vote.minhasCartas.map((c) => getCard(c.cardId).name).join(', ') : 'nenhuma'}
      </p>
      <MedidorPeso peso={peso} maximo={vote.pesoMaximo} papel={papel} />
      {vote.status === 'convocado' && (
        <button type="button" onClick={() => setTrocar(true)} className={cn('dv-focus min-h-9 self-start font-mono text-[10.5px] uppercase tracking-[0.14em] underline-offset-2 hover:underline', papel ? 'text-dv-ink' : 'text-dv-amethyst-text')}>
          Trocar as cartas
        </button>
      )}
      <EscolherCartasSheet
        open={trocar}
        onClose={() => setTrocar(false)}
        pesoMaximo={vote.pesoMaximo}
        inicial={vote.minhasCartas.map((c) => c.uid)}
        titulo="Trocar as cartas"
        acao="Salvar"
        onConfirm={async (uids) => {
          await recordAction({ action: 'cartas', voteId: vote.id, cartas: uids })
          await mutate(RECORD_KEY)
        }}
      />
    </div>
  )
}
