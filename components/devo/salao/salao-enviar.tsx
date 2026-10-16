'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { atendeRaridade, formatTempo, RARIDADE_ROTULO, repasse, SALAO_MAX_MIN, type SalaoLiberado } from '@/lib/devo/salao'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphKeyhole } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { useDevo } from '../state/devo-store'
import { useAcesso } from '../state/use-acesso'
import { RecButton } from '../system/record-ui'
import { useSalao } from './salao-dados'
import { CartaMini, Erro, Linha, nomeCarta, TempoCampo } from './salao-ui'

export type ModoEnvio = 'bandeja' | 'mercado'

/**
 * Folha "Enviar à Bandeja" / "Vender no Mercado": escolhe UMA carta do inventário (cada cópia tem o próprio uid),
 * define o lance mínimo (Bandeja) ou o preço (Mercado) e mostra as taxas do contrato. Abaixo da raridade mínima a
 * carta aparece trancada. O servidor tira a carta do save na mesma transação; aqui ela sai do inventário local.
 */
export function EnviarCartaSheet({ open, onClose, modo, dados }: { open: boolean; onClose: () => void; modo: ModoEnvio; dados: SalaoLiberado | null }) {
  const { state } = useDevo()
  const { agir } = useSalao(open)
  const [uid, setUid] = useState<string | null>(null)
  const [valor, setValor] = useState(60)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  const cfg = dados?.bandeja
  const contrato = dados?.contrato

  useEffect(() => {
    if (!open) return
    setUid(null)
    setErro(null)
    setFeito(null)
    setValor(modo === 'bandeja' ? (cfg?.lance_minimo ?? 30) : 60)
  }, [open, modo, cfg?.lance_minimo])

  const cartas = useMemo(
    () =>
      [...state.inventory].sort((a, b) => {
        const ra = RARITY_META[getCard(a.cardId).rarity].order
        const rb = RARITY_META[getCard(b.cardId).rarity].order
        return rb - ra || a.cardId.localeCompare(b.cardId)
      }),
    [state.inventory],
  )
  const escolhida = cartas.find((c) => c.uid === uid) ?? null
  const minima = cfg?.raridade_minima ?? 'incomum'
  const minValor = modo === 'bandeja' ? (cfg?.lance_minimo ?? 30) : 1
  const comissao = contrato?.comissaoPct ?? 0

  const enviar = async () => {
    if (!escolhida) return
    setOcupado(true)
    setErro(null)
    try {
      if (modo === 'bandeja') await agir({ action: 'bandeja.enviar', uid: escolhida.uid, lanceMinimo: valor })
      else await agir({ action: 'mercado.vender', uid: escolhida.uid, preco: valor })
      playSfx('confirm')
      setFeito(nomeCarta(escolhida.cardId))
      setUid(null)
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  const titulo = modo === 'bandeja' ? 'Enviar à Bandeja' : 'Vender no Mercado'
  return (
    <Sheet
      open={open}
      onClose={onClose}
      kicker={modo === 'bandeja' ? 'Shuffler · Salão das Máscaras' : 'Mercado do Salão'}
      title={titulo}
      description={
        modo === 'bandeja'
          ? `A carta sai do seu inventário e espera a avaliação de um especialista. Raridade mínima: ${RARIDADE_ROTULO[minima]}.`
          : 'A carta sai do seu inventário e fica à venda por um preço fixo em Tempo. As compras acontecem durante a abertura.'
      }
      size="lg"
      footer={
        feito ? (
          <Button variant="secondary" size="md" block onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <Button variant="primary" size="md" block disabled={!escolhida || !dados} loading={ocupado} onClick={enviar}>
            {modo === 'bandeja' ? 'Enviar à Bandeja' : 'Pôr à venda'}
          </Button>
        )
      }
    >
      {feito ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
          <span aria-hidden="true" className="size-3 rotate-45 bg-dv-amethyst shadow-[0_0_12px_rgba(138,124,200,0.9)]" />
          <p className="font-display text-[18px] font-semibold uppercase tracking-[0.12em] text-dv-text">{feito}</p>
          <p className="max-w-xs font-body text-[15px] leading-relaxed text-dv-text-2">
            {modo === 'bandeja' ? 'Na Bandeja, em avaliação de especialista. Acompanhe na aba Bandeja do Salão.' : 'À venda no Mercado do Salão.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {!cartas.length ? (
            <p className="font-body text-[15px] text-dv-text-2">Você não tem cartas no inventário.</p>
          ) : (
            <ul aria-label="Suas cartas" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {cartas.map((c) => {
                const card = getCard(c.cardId)
                const ok = modo === 'mercado' || atendeRaridade(card.rarity, minima)
                const sel = c.uid === uid
                return (
                  <li key={c.uid}>
                    <button
                      type="button"
                      disabled={!ok}
                      aria-pressed={sel}
                      aria-label={ok ? `Escolher ${card.name}` : `${card.name}: abaixo da raridade mínima`}
                      onClick={() => {
                        playSfx('card-select')
                        setUid(sel ? null : c.uid)
                      }}
                      className={cn(
                        'dv-focus relative block w-full transition-transform duration-200 enabled:active:scale-[0.97]',
                        sel && '-translate-y-1 [filter:drop-shadow(0_0_10px_rgba(138,124,200,0.85))]',
                        !ok && 'cursor-not-allowed',
                      )}
                    >
                      <CartaMini cardId={c.cardId} className={cn(!ok && 'opacity-35 grayscale')} />
                      {!ok && (
                        <span className="absolute inset-x-1 bottom-2 flex items-center justify-center gap-1 bg-black/80 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-dv-text-2">
                          <GlyphKeyhole aria-hidden="true" className="size-3" /> Mínimo {RARIDADE_ROTULO[minima]}
                        </span>
                      )}
                      {sel && (
                        <span
                          aria-hidden="true"
                          className="dv-cut absolute inset-0 shadow-[inset_0_0_0_2px_#c2b9ec]"
                          style={{ '--dv-cut': '8px' } as CSSProperties}
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {escolhida && (
            <div className="animate-dv-rise flex flex-col gap-4 border-t border-dv-line pt-4">
              <p className="font-display text-[16px] font-semibold uppercase tracking-[0.12em] text-dv-text">{nomeCarta(escolhida.cardId)}</p>
              <TempoCampo
                id={`salao-${modo}-valor`}
                rotulo={modo === 'bandeja' ? 'Lance mínimo' : 'Preço'}
                valor={valor}
                onChange={setValor}
                min={minValor}
                max={SALAO_MAX_MIN}
                passo={modo === 'bandeja' ? (cfg?.incremento ?? 10) : 10}
              />
              <dl>
                <Linha rotulo="Contrato">{contrato?.nome ?? '—'}</Linha>
                {modo === 'bandeja' && <Linha rotulo="Taxa de divulgação">{formatTempo(contrato?.divulgacao ?? 0)} · paga agora</Linha>}
                <Linha rotulo="Comissão na venda">{comissao}%</Linha>
                <Linha rotulo={modo === 'bandeja' ? 'Você recebe no lance mínimo' : 'Você recebe'}>{formatTempo(repasse(valor, comissao))}</Linha>
              </dl>
              {modo === 'bandeja' && (
                <p className="font-body text-[14px] leading-snug text-dv-text-2">Se o especialista recusar, a carta e a taxa voltam para você.</p>
              )}
            </div>
          )}
          {erro && <Erro>{erro}</Erro>}
        </div>
      )}
    </Sheet>
  )
}

/**
 * Ação "Enviar à Bandeja" no Card Shuffler (Record). Só aparece com o Salão liberado (servidor decide, via
 * `acesso`); abre a mesma folha da aba Bandeja.
 */
export function EnviarBandejaAcao({ className }: { className?: string }) {
  const acesso = useAcesso()
  const liberado = !!acesso?.sistemas.salao_mascaras
  const [aberto, setAberto] = useState(false)
  const { data } = useSalao(liberado && aberto)
  if (!liberado) return null
  return (
    <>
      <RecButton surface="paper" variant="secondary" size="sm" block className={className} sfx="click" onClick={() => setAberto(true)}>
        Enviar à Bandeja
      </RecButton>
      <EnviarCartaSheet open={aberto} onClose={() => setAberto(false)} modo="bandeja" dados={data && data.liberado ? data : null} />
    </>
  )
}
