'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CATEGORIA_LABEL, POCO_CATEGORIAS, porcentagens, type PocoMoeda, type PocoOwner, type PocoPesos } from '@/lib/devo/poco'
import { Button } from '@/components/devo/kit/button'

/**
 * Painel do Owner dentro de "Suas moedas" (o mesmo de components/devo/poco/poco-folhas.tsx, que não é exportado lá):
 * pesos por categoria, marcados PROVISÓRIOS, gravados em devo_config pela API da equipe. Sem desenho no protótipo:
 * a tela do v2 o mostra dentro de <Legado>, com as cores do jogo atual.
 */
export function OwnerProbabilidades({ owner, moedas, onSalvar }: { owner: PocoOwner; moedas: PocoMoeda[]; onSalvar: (v: Record<string, PocoPesos>) => Promise<void> }) {
  const [rascunho, setRascunho] = useState<Record<string, PocoPesos>>(() => {
    const base: Record<string, PocoPesos> = { ...owner.probabilidades }
    for (const m of moedas) if (!base[m.key]) base[m.key] = { lixo: 0, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 }
    return base
  })
  const [estado, setEstado] = useState<'idle' | 'salvando' | 'ok' | 'erro'>('idle')
  return (
    <section aria-label="Probabilidades do Poço" className="border border-dv-line-strong p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="dv-label text-[10px] text-dv-gold">Owner · probabilidades</p>
        {owner.provisorio && <span className="dv-label border border-dv-blood/60 px-2 py-0.5 text-[10px] text-dv-blood-text">Provisório</span>}
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-dv-text-3">Pesos relativos por categoria (não são porcentagens). Categoria com todos os pesos em zero fica fechada.</p>
      {Object.entries(rascunho).map(([moeda, pesos]) => {
        const pct = porcentagens(pesos)
        const nome = moedas.find((m) => m.key === moeda)?.nome ?? moeda
        return (
          <fieldset key={moeda} className="mt-3">
            <legend className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-dv-text">{nome}</legend>
            <div className="mt-1 grid grid-cols-5 gap-1.5">
              {POCO_CATEGORIAS.map((c) => (
                <label key={c} className="flex flex-col gap-1">
                  <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.06em] text-dv-text-3" title={CATEGORIA_LABEL[c]}>
                    {c}
                  </span>
                  <input
                    inputMode="decimal"
                    value={String(pesos[c])}
                    onChange={(e) => {
                      const n = Math.max(0, Number(e.target.value.replace(',', '.')) || 0)
                      setRascunho((r) => ({ ...r, [moeda]: { ...r[moeda], [c]: n } }))
                      setEstado('idle')
                    }}
                    aria-label={`${nome}: peso de ${CATEGORIA_LABEL[c]}`}
                    className="dv-focus dv-tabular h-11 w-full border border-dv-line-strong bg-dv-ink px-1.5 text-center font-mono text-[14px] text-dv-text"
                  />
                  <span className="dv-tabular text-center font-mono text-[10px] text-dv-text-3">{pct[c].toFixed(0)}%</span>
                </label>
              ))}
            </div>
          </fieldset>
        )
      })}
      <Button
        size="sm"
        block
        className="mt-3"
        loading={estado === 'salvando'}
        onClick={async () => {
          setEstado('salvando')
          try {
            const limpo = Object.fromEntries(Object.entries(rascunho).filter(([, p]) => POCO_CATEGORIAS.some((c) => p[c] > 0)))
            await onSalvar(limpo)
            setEstado('ok')
            playSfx('confirm')
          } catch {
            setEstado('erro')
            playSfx('error')
          }
        }}
      >
        Salvar como provisório
      </Button>
      {estado === 'ok' && <p className="mt-2 text-[12.5px] text-dv-amethyst-text">Probabilidades salvas (provisórias).</p>}
      {estado === 'erro' && <p className="mt-2 text-[12.5px] text-dv-blood-text">Não foi possível salvar.</p>}
    </section>
  )
}
