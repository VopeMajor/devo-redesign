'use client'

import type { CSSProperties } from 'react'
import { CATEGORIA_LABEL, type PocoResultado } from '@/lib/devo/poco'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { FrameCorners } from '../kit/frame'
import { GlyphSpark } from '../kit/glyphs'
import { DracmaIcon } from './poco-cena'

const RARO: ItemRarity[] = ['raro', 'epico', 'lendario', 'arcano']

/** Para onde o prêmio foi (o lixo não vai a lugar nenhum). */
function destino(r: PocoResultado) {
  if (r.categoria === 'lixo') return 'Não vai para o inventário.'
  if (r.categoria === 'capsula') return 'Guardada no seu Diário.'
  if (r.categoria === 'cosmetico') return 'Guardado nos seus cosméticos.'
  return 'Guardado no seu inventário.'
}

/**
 * Revelação do balde: o resultado sobe com o balde e se abre. Lixo = papel apagado, sem moldura; prêmio =
 * tampo negro com filete de aço; raro (cápsula, cosmético, raridade ≥ rara) = cantos de filigrana e halo de
 * ametista. Rodapé com o selo do sorteio (compromisso e segredo revelado) para auditoria.
 */
export function PocoResultadoView({ r, onFechar }: { r: PocoResultado; onFechar: () => void }) {
  const lixo = r.categoria === 'lixo'
  const raro = !lixo && (r.categoria === 'capsula' || r.categoria === 'cosmetico' || (r.item && RARO.includes(r.item.raridade)))
  const nome = lixo ? (r.lixo?.nome ?? 'Nada') : (r.item?.nome ?? '')
  const texto = lixo
    ? r.lixo?.texto
    : r.categoria === 'capsula'
      ? String(r.item?.meta.texto ?? r.item?.descricao ?? '')
      : (r.item?.descricao ?? '')
  return (
    <div role="dialog" aria-modal="true" aria-label={`Resultado do balde: ${nome}`} className="absolute inset-0 z-40 flex flex-col items-center justify-end bg-[linear-gradient(180deg,rgba(12,12,14,0),rgba(12,12,14,0.72)_38%,rgba(12,12,14,0.95))] px-4 pb-5">
      {raro && <span aria-hidden="true" className="poco-halo pointer-events-none absolute left-1/2 top-[34%] size-[340px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(138,124,200,0.42),rgba(138,124,200,0.08)_55%,transparent_70%)]" />}

      <div className="poco-reveal relative w-full max-w-[380px]" style={{ '--dv-cut': '16px' } as CSSProperties}>
        <span aria-hidden="true" className={cn('dv-cut absolute inset-0', lixo ? 'bg-[#3a3a3f]' : 'bg-[linear-gradient(135deg,#f4efe6,#6b6357_28%,#bab09f_55%,#5f584d_80%,#ece5d8)]')} />
        <span
          aria-hidden="true"
          className={cn('dv-cut absolute inset-px', lixo ? 'bg-[linear-gradient(180deg,#1a1a1d,#131315)]' : 'bg-[#121214] bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px]')}
          style={{ '--dv-cut': '15.6px' } as CSSProperties}
        />
        {raro && <FrameCorners tone="gold" size={24} inset={5} />}
        <div className="relative flex flex-col items-center px-6 pb-5 pt-6 text-center">
          <p className={cn('dv-label flex items-center gap-2 text-[10px]', lixo ? 'text-dv-text-3' : 'text-dv-gold')}>
            {!lixo && <GlyphSpark className="size-3 text-dv-amethyst" />}
            {CATEGORIA_LABEL[r.categoria]}
            {r.gratis && <span className="text-dv-text-3">· giro grátis</span>}
          </p>
          <h2 className={cn('mt-3 text-balance font-display font-semibold uppercase leading-tight tracking-[0.08em]', lixo ? 'text-[22px] text-dv-text-2' : 'text-[26px] text-dv-porcelain')}>
            {nome}
            {r.quantidade > 1 && <span className="ml-2 font-impact text-[24px] tracking-normal text-dv-gold-bright">×{r.quantidade}</span>}
          </h2>
          {r.item && (
            <p className="mt-2 flex items-center gap-2">
              <span className={cn('dv-label border px-2 py-0.5 text-[10px]', raro ? 'border-dv-amethyst/60 text-dv-amethyst-text' : 'border-dv-line-strong text-dv-text-2')}>{ITEM_RARITY_LABEL[r.item.raridade]}</span>
              {r.item.meta.provisorio === true && <span className="dv-label border border-dv-line px-2 py-0.5 text-[10px] text-dv-text-3">Texto provisório</span>}
            </p>
          )}
          {texto && <p className={cn('mt-3 text-pretty font-body text-[15.5px] leading-relaxed', lixo ? 'italic text-dv-text-3' : 'text-dv-text-2')}>{texto}</p>}
          <p className={cn('mt-3 font-mono text-[11px] uppercase tracking-[0.14em]', lixo ? 'text-dv-text-3' : 'text-dv-text-2')}>{destino(r)}</p>

          <Button block className="mt-5" variant={lixo ? 'secondary' : 'primary'} sfx="confirm" onClick={onFechar}>
            {lixo ? 'Devolver ao poço' : 'Guardar'}
          </Button>

          <details className="mt-4 w-full text-left">
            <summary className="dv-focus flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-text-3">
              <DracmaIcon raridade="comum" className="size-4 opacity-70" />
              Selo do sorteio · {r.acertos} {r.acertos === 1 ? 'acerto' : 'acertos'} na manivela
            </summary>
            <dl className="mt-1 grid gap-1 break-all font-mono text-[10.5px] leading-snug text-dv-text-3">
              <dt className="text-dv-text-2">Compromisso (sha256)</dt>
              <dd>{r.seedHash}</dd>
              <dt className="text-dv-text-2">Segredo revelado</dt>
              <dd>{r.seed}</dd>
              <dt className="text-dv-text-2">Giro</dt>
              <dd>{r.id}</dd>
            </dl>
          </details>
        </div>
      </div>
    </div>
  )
}
