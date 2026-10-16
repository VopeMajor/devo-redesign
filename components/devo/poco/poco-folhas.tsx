'use client'

import { useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { CATEGORIA_LABEL, POCO_CATEGORIAS, porcentagens, type PocoBalde, type PocoMoeda, type PocoOwner, type PocoPesos } from '@/lib/devo/poco'
import { ITEM_RARITY_LABEL } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { GlyphKeyhole } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { Countdown } from '../kit/time'
import { BaldeIcon, DracmaIcon } from './poco-cena'

type GiroGratis = { disponivel: boolean; restantes: number; categoria: string; proximoEm: number }

/* ── ⋯ Suas moedas ──────────────────────────────────────────────────────────────────────── */

export function MoedasSheet({
  open,
  onClose,
  moedas,
  giroGratis,
  owner,
  onSalvarProbabilidades,
}: {
  open: boolean
  onClose: () => void
  moedas: PocoMoeda[]
  giroGratis: GiroGratis
  owner?: PocoOwner
  onSalvarProbabilidades: (v: Record<string, PocoPesos>) => Promise<void>
}) {
  return (
    <Sheet open={open} onClose={onClose} kicker="Poço dos Milagres" title="Suas moedas" description="Cada moeda abre a sua própria categoria de sorteio. Lançada, não volta.">
      <ul className="flex flex-col">
        {moedas.map((m) => (
          <li key={m.key} className={cn('flex gap-3 border-b border-dv-line py-3 last:border-b-0', m.quantidade === 0 && 'opacity-60')}>
            <DracmaIcon raridade={m.raridade} className="size-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-dv-text">{m.nome}</span>
                <span className="font-impact dv-tabular text-[22px] leading-none text-dv-gold-bright">×{m.quantidade}</span>
              </p>
              <p className="dv-label mt-0.5 text-[10px] text-dv-text-3">
                {ITEM_RARITY_LABEL[m.raridade]} · {m.key === giroGratis.categoria ? 'Sorteio base' : 'Categoria especial'}
                {!m.categoriaAtiva && ' · ainda não definida'}
              </p>
              {m.descricao && <p className="mt-1 font-body text-[14.5px] leading-snug text-dv-text-2">{m.descricao}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-dv-line pt-3 font-body text-[14px] leading-snug text-dv-text-2">
        Todo dia há um giro grátis na categoria do Dracma Comum.{' '}
        {giroGratis.disponivel ? (
          <span className="text-dv-amethyst-text">Disponível agora.</span>
        ) : (
          <span className="inline-flex items-baseline gap-1.5 text-dv-text-3">
            Volta em <Countdown endsAt={giroGratis.proximoEm} size="sm" tone="text" criticalMs={0} sound={false} label="Próximo giro grátis" />
          </span>
        )}
      </p>
      {owner && <OwnerProbabilidades owner={owner} moedas={moedas} onSalvar={onSalvarProbabilidades} />}
    </Sheet>
  )
}

/** Painel do Owner: pesos por categoria, marcados PROVISÓRIOS, gravados em devo_config pela API da equipe. */
function OwnerProbabilidades({ owner, moedas, onSalvar }: { owner: PocoOwner; moedas: PocoMoeda[]; onSalvar: (v: Record<string, PocoPesos>) => Promise<void> }) {
  const [rascunho, setRascunho] = useState<Record<string, PocoPesos>>(() => {
    const base: Record<string, PocoPesos> = { ...owner.probabilidades }
    for (const m of moedas) if (!base[m.key]) base[m.key] = { lixo: 0, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 }
    return base
  })
  const [estado, setEstado] = useState<'idle' | 'salvando' | 'ok' | 'erro'>('idle')
  return (
    <section aria-label="Probabilidades do Poço" className="mt-5 border border-dv-line-strong p-3">
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

/* ── Lançar Moeda ───────────────────────────────────────────────────────────────────────── */

export function LancarSheet({
  open,
  onClose,
  moedas,
  giroGratis,
  ocupado,
  erro,
  onLancar,
}: {
  open: boolean
  onClose: () => void
  moedas: PocoMoeda[]
  giroGratis: GiroGratis
  ocupado: string | null
  erro: string | null
  onLancar: (o: { gratis: true } | { moeda: string }) => void
}) {
  const base = moedas.find((m) => m.key === giroGratis.categoria)
  return (
    <Sheet open={open} onClose={onClose} kicker="Poço dos Milagres" title="Lançar Moeda" description="Escolha o que vai para o fundo do poço. Depois, gire a manivela.">
      <div className="flex flex-col gap-2.5">
        <div className={cn('flex items-center gap-3 border p-3', giroGratis.disponivel ? 'border-dv-amethyst/50 bg-dv-cobalt-dim' : 'border-dv-line')}>
          <DracmaIcon raridade="comum" className={cn('size-10 shrink-0', !giroGratis.disponivel && 'opacity-50')} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-dv-text">Giro grátis do dia</p>
            <p className="text-[13px] leading-snug text-dv-text-2">
              {giroGratis.disponivel ? (
                `Categoria ${base?.nome ?? 'Dracma Comum'}. Não gasta moeda.`
              ) : (
                <span className="inline-flex items-baseline gap-1.5">
                  Usado hoje. Volta em <Countdown endsAt={giroGratis.proximoEm} size="sm" tone="text" criticalMs={0} sound={false} label="Próximo giro grátis" />
                </span>
              )}
            </p>
          </div>
          <Button size="sm" disabled={!giroGratis.disponivel || !!ocupado} loading={ocupado === 'gratis'} onClick={() => onLancar({ gratis: true })} aria-label="Usar o giro grátis">
            Usar
          </Button>
        </div>
        {moedas.map((m) => {
          const pode = m.quantidade > 0 && m.categoriaAtiva
          return (
            <div key={m.key} className="flex items-center gap-3 border border-dv-line p-3">
              <DracmaIcon raridade={m.raridade} className={cn('size-10 shrink-0', !pode && 'opacity-50')} />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-dv-text">{m.nome}</span>
                  <span className="font-impact dv-tabular text-[18px] leading-none text-dv-gold-bright">×{m.quantidade}</span>
                </p>
                <p className="text-[13px] leading-snug text-dv-text-3">{!m.categoriaAtiva ? 'Categoria ainda não definida.' : m.quantidade === 0 ? 'Você não tem esta moeda.' : `Lança 1 ${m.nome}.`}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={!pode || !!ocupado} loading={ocupado === m.key} onClick={() => onLancar({ moeda: m.key })} aria-label={`Lançar ${m.nome}`}>
                Lançar
              </Button>
            </div>
          )
        })}
        {erro && <p className="text-[13px] text-dv-blood-text">{erro}</p>}
      </div>
    </Sheet>
  )
}

/* ── Baldes ─────────────────────────────────────────────────────────────────────────────── */

export function BaldesSheet({
  open,
  onClose,
  baldes,
  atual,
  ocupado,
  onEscolher,
}: {
  open: boolean
  onClose: () => void
  baldes: PocoBalde[]
  atual: string
  ocupado: boolean
  onEscolher: (id: string) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} kicker="Inspecionar Balde" title="Baldes" description="O balde vazio espera no fundo. Escolha qual desce na próxima coleta.">
      <ul className="flex flex-col gap-2.5">
        {baldes.map((b) => {
          const ativo = b.id === atual
          return (
            <li key={b.id}>
              <div
                className={cn(
                  'flex items-center gap-3 border p-3',
                  ativo ? 'border-dv-amethyst/60 bg-dv-cobalt-dim' : b.possui ? 'border-dv-line-strong' : 'border-dv-line bg-[#09090b]',
                )}
              >
                <span className={cn('relative grid size-12 shrink-0 place-items-center', !b.possui && 'brightness-[0.25] grayscale')}>
                  <BaldeIcon tipo={b.id} className="size-11" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-display text-[14px] font-semibold uppercase tracking-[0.08em]', b.possui ? 'text-dv-text' : 'text-dv-text-3')}>{b.nome}</p>
                  <p className="dv-label mt-0.5 text-[10px] text-dv-text-3">
                    {b.tipo === 'inicial' ? 'Inicial' : ITEM_RARITY_LABEL[b.raridade]} · {b.efeito}
                    {b.provisorio && ' (provisório)'}
                  </p>
                  {b.possui && b.descricao && <p className="mt-1 font-body text-[14px] leading-snug text-dv-text-2">{b.descricao}</p>}
                </div>
                {b.possui ? (
                  ativo ? (
                    <span className="dv-label shrink-0 px-2 text-[10px] text-dv-amethyst-text">Em uso</span>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => onEscolher(b.id)} aria-label={`Usar ${b.nome}`}>
                      Usar
                    </Button>
                  )
                ) : (
                  <span className="flex shrink-0 items-center gap-1 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-3">
                    <GlyphKeyhole className="size-4" />
                    Bloqueado
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[13px] leading-snug text-dv-text-3">Há baldes mais raros que nem aparecem aqui até serem encontrados.</p>
    </Sheet>
  )
}
