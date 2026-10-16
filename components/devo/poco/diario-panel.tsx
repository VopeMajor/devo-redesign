'use client'

import type { CSSProperties } from 'react'
import { LockedFeature, RecordPanel, RecordTitle } from '@/components/devo/kit'
import { IconPoco } from '@/components/devo/kit/interior/icons'
import { ITEM_RARITY_LABEL, type InventoryItem } from '@/lib/devo/progresso'
import { useOsNav } from '../os/os-nav'
import { useEu } from '../state/use-acesso'
import { RecButton, RecTag } from '../system/record-ui'

const fmtData = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Diário (DIRECAO-3 §2): guarda as cápsulas do tempo que o Poço devolve — informações e curiosidades do mundo
 * de DEVO. Lê o inventário genérico (kind 'capsula'); o texto de cada cápsula fica em `item_defs.meta.texto`
 * (provisório até o dono escrever). Trancado até vencer o Deadly Vote tutorial (flag 'diario').
 */
export function DiarioPanel() {
  const nav = useOsNav()
  const { data, error, isLoading } = useEu()
  const liberado = !!data?.acesso.sistemas.diario
  const pocoLivre = !!data?.acesso.sistemas.poco
  const capsulas = (data?.inventario ?? []).filter((i) => i.kind === 'capsula').sort((a, b) => b.firstAt - a.firstAt)

  if (!data) {
    return (
      <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-in-fg-3" aria-busy={isLoading || undefined}>
        {error ? 'Não foi possível abrir o Diário.' : 'Abrindo o Diário…'}
      </p>
    )
  }
  if (!liberado) {
    return <LockedFeature variant="row" name="Diário" jp="日記" hint="Vença o Deadly Vote do tutorial" icon={<IconPoco />} />
  }

  return (
    <section aria-label="Diário" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <RecordTitle title="Diário" jp="日記" size="lg" as="h2" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">
          {capsulas.length} {capsulas.length === 1 ? 'cápsula' : 'cápsulas'}
        </span>
      </div>
      <p className="font-body text-[15px] leading-relaxed text-in-fg-2">Cápsulas do tempo que o Poço dos Milagres devolveu. Cada uma guarda um pedaço do mundo de DEVO.</p>

      {capsulas.length === 0 ? (
        <RecordPanel variant="paper" chamfer pad="md">
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="font-body text-[15.5px] italic leading-relaxed text-in-fg-2">Nenhuma cápsula ainda. O poço às vezes devolve uma, no fundo do balde.</p>
            {pocoLivre && (
              <RecButton surface="paper" size="sm" sfx="open" onClick={() => nav.open('poco')}>
                Ir ao Poço
              </RecButton>
            )}
          </div>
        </RecordPanel>
      ) : (
        <ol className="flex flex-col gap-3">
          {capsulas.map((c, i) => (
            <Capsula key={c.key} item={c} n={capsulas.length - i} />
          ))}
        </ol>
      )}
    </section>
  )
}

function Capsula({ item, n }: { item: InventoryItem; n: number }) {
  const titulo = typeof item.meta.titulo === 'string' ? item.meta.titulo : item.name
  const texto = typeof item.meta.texto === 'string' ? item.meta.texto : (item.description ?? '')
  const provisorio = item.meta.provisorio === true
  return (
    <li>
      <article
        className="relative bg-[color:var(--in-porcelain)] px-4 pb-4 pt-3.5 shadow-[inset_0_0_0_1px_var(--in-line-strong),inset_0_1px_0_#fff]"
        style={{ '--dv-cut': '10px' } as CSSProperties}
      >
        {/* costura do diário na margem esquerda */}
        <span aria-hidden="true" className="absolute inset-y-3 left-1.5 w-px border-l border-dashed border-in-line-strong" />
        <header className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">
              Nº {String(n).padStart(3, '0')} · {fmtData(item.firstAt)}
            </p>
            <h3 className="mt-1 font-serif text-[20px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{titulo}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <RecTag tone="accent">{ITEM_RARITY_LABEL[item.rarity]}</RecTag>
            {provisorio && <RecTag tone="muted">Provisório</RecTag>}
          </div>
        </header>
        <p className="mt-2.5 pl-2 font-body text-[15.5px] leading-relaxed text-in-fg">{texto}</p>
      </article>
    </li>
  )
}
