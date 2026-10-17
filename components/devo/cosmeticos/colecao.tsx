'use client'

import { Lock } from 'lucide-react'
import { type CSSProperties, useMemo, useState } from 'react'
import { Button } from '@/components/devo/kit'
import {
  COS_ABAS,
  type CosAba,
  type CosmeticoDef,
  type CosSlot,
  type Equipados,
  MOTIVO_LABEL,
  naColecao,
  ORIGEM_LABEL,
  type RaridadeVisual,
  SLOT_LABEL,
  type Visual,
} from '@/lib/devo/cosmeticos'
import type { ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { BalaoChat, Emblema, FotoMoldurada, NomeVisual, classeEfeito } from './cosmetic-art'
import { equipar, useAnimarCosmeticos, useMeusCosmeticos } from './use-cosmeticos'

const fmtData = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Aparência "como ficaria": equipados + o item em pré-visualização no espaço dele. */
function visualCom(eq: Equipados, id: string, foto: number | null, preview: CosmeticoDef | null, anfitriao = false): Visual {
  const e = { ...eq }
  if (preview) e[preview.categoria] = preview.key
  return { id, foto, av: e.moldura_avatar, mini: e.moldura_mini, emb: e.emblema, bal: e.balao, ef: e.efeito, anfitriao }
}

/**
 * Coleção de cosméticos do jogador (texto do dono §9): categorias, possuídos × bloqueados (silhueta), detalhe
 * com raridade e origem, pré-visualização no próprio avatar e nome, equipar/desequipar. O servidor confere a
 * posse em cada troca; a tela só reflete.
 */
export function Colecao({ nome, fotoSrc, onVoltar }: { nome: string; fotoSrc: string | null; onVoltar?: () => void }) {
  const { data, error, isLoading, mutate } = useMeusCosmeticos()
  const [aba, setAba] = useState<CosAba>('molduras')
  const [formato, setFormato] = useState<'moldura_avatar' | 'moldura_mini'>('moldura_avatar')
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'erro'; text: string } | null>(null)
  const animar = useAnimarCosmeticos()

  const posse = useMemo(() => new Map((data?.possuidos ?? []).map((p) => [p.key, p])), [data])
  const slots: CosSlot[] = aba === 'molduras' ? [formato] : (COS_ABAS.find((a) => a.id === aba)?.slots ?? [])
  const itens = (data?.catalogo ?? []).filter((c) => slots.includes(c.categoria) && naColecao(c))
  const total = (data?.catalogo ?? []).filter((c) => naColecao(c) && c.active).length
  const meus = (data?.catalogo ?? []).filter((c) => naColecao(c) && posse.has(c.key)).length
  const atual = itens.find((c) => c.key === sel) ?? null
  const eq = data?.equipados

  if (error) return <p className="p-6 text-center font-body text-[15px] text-in-fg-2">Não foi possível abrir a coleção. Tente de novo em instantes.</p>
  if (isLoading || !data || !eq)
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <span className="h-64 animate-pulse bg-[#1c1c1f]/80" />
        <span className="h-40 animate-pulse bg-[#1c1c1f]/40" />
      </div>
    )

  const pode = (c: CosmeticoDef) => data.livre || posse.has(c.key)
  const v = visualCom(eq, 'eu', null, atual)
  const mapa = new Map(data.catalogo.map((c) => [c.key, c]))
  const ativo = (slot: CosSlot) => eq[slot]

  const trocar = async (slot: CosSlot, key: string | null) => {
    setBusy(true)
    setMsg(null)
    try {
      await equipar(slot, key)
      await mutate()
      setMsg({ tone: 'ok', text: key ? `${mapa.get(key)?.name ?? 'Item'} equipado.` : `${SLOT_LABEL[slot]}: nenhum.` })
    } catch (e) {
      setMsg({ tone: 'erro', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Coleção de cosméticos" className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Identidade · cosméticos</p>
          <h2 className="mt-1 font-serif text-[30px] font-light uppercase leading-none tracking-[0.03em] text-in-fg">Coleção</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {onVoltar && (
            <button type="button" onClick={onVoltar} className="dv-focus min-h-11 px-1 font-mono text-[11px] uppercase tracking-[0.16em] text-in-accent underline-offset-4 hover:underline">
              ← Voltar ao Record
            </button>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">
            <span className="font-impact text-[20px] text-in-fg dv-tabular">{meus}</span> / {total} obtidos
          </p>
        </div>
      </header>

      {/* Palco: o próprio avatar e nome com o item aplicado */}
      <div className="dv-cut relative overflow-hidden bg-[#0c0c0e] text-dv-text shadow-[inset_0_0_0_1px_rgba(186,176,159,0.45)]" style={{ '--dv-cut': '14px' } as CSSProperties}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:520px_520px] opacity-50" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_30%_40%,rgba(236,229,216,0.12),transparent_70%)]" />
        <div className="relative grid grid-cols-[42%_1fr] gap-3 p-4" role="group" aria-label="Pré-visualização">
          <FotoMoldurada formato="avatar" src={fotoSrc} moldura={v.av ? mapa.get(v.av) : null} animar={animar} alt={`Foto de ${nome}`} />
          <div className="flex min-w-0 flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FotoMoldurada formato="mini" src={fotoSrc} moldura={v.mini ? mapa.get(v.mini) : null} largura={64} animar={animar} />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">No chat</p>
                <NomeVisual nome={nome} visual={v} className="text-[17px]" tamanhoEmblema={18} cor="#ece5d8" />
              </div>
            </div>
            <BalaoChat def={v.bal ? mapa.get(v.bal) : null} className="text-[15px] leading-snug">
              <p className="font-body">Boa sorte na mesa esta noite.</p>
            </BalaoChat>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dv-text-3">
              {atual ? (pode(atual) ? 'Pré-visualizando' : 'Pré-visualização de item bloqueado') : 'Como você aparece agora'}
            </p>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div role="tablist" aria-label="Categorias da coleção" className="grid grid-cols-4 gap-1">
        {COS_ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => {
              setAba(a.id)
              setSel(null)
            }}
            className={cn(
              'dv-focus min-h-11 font-sans text-[11px] font-medium uppercase tracking-[0.1em]',
              aba === a.id ? 'bg-in-accent-fill text-white shadow-[0_0_14px_-4px_rgba(138,124,200,0.8)]' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]',
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      {aba === 'molduras' && (
        <div className="flex gap-1" role="group" aria-label="Formato da moldura">
          {(['moldura_avatar', 'moldura_mini'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={formato === f}
              onClick={() => {
                setFormato(f)
                setSel(null)
              }}
              className={cn('dv-focus min-h-11 flex-1 font-mono text-[11px] uppercase tracking-[0.14em]', formato === f ? 'bg-[#1c1c1f] text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line)]')}
            >
              {f === 'moldura_avatar' ? 'Avatar · retrato' : 'Miniperfil · quadrada'}
            </button>
          ))}
        </div>
      )}

      {/* Grade: possuídos em cor; bloqueados como silhueta escurecida */}
      <ul className="grid grid-cols-3 gap-2" aria-label={`Itens: ${COS_ABAS.find((a) => a.id === aba)?.label}`}>
        {itens.map((c) => (
          <li key={c.key}>
            <ItemTile
              def={c}
              possui={posse.has(c.key)}
              livre={data.livre}
              equipado={ativo(c.categoria) === c.key}
              selecionado={sel === c.key}
              raridade={data.raridades[c.rarity]}
              fotoSrc={fotoSrc}
              onClick={() => setSel(sel === c.key ? null : c.key)}
            />
          </li>
        ))}
      </ul>

      {/* Detalhe */}
      {atual ? (
        <Detalhe
          def={atual}
          raridade={data.raridades[atual.rarity]}
          possui={posse.get(atual.key) ?? null}
          livre={data.livre}
          equipado={ativo(atual.categoria) === atual.key}
          busy={busy}
          onEquipar={() => trocar(atual.categoria, atual.key)}
          onTirar={() => trocar(atual.categoria, null)}
        />
      ) : (
        <p className="border border-dashed border-in-line-strong px-4 py-3 font-body text-[15px] leading-snug text-in-fg-2">
          Toque num item para ver de onde ele vem e como fica em você.
        </p>
      )}
      {msg && (
        <p role="status" className={cn('font-mono text-[11px] uppercase tracking-[0.12em]', msg.tone === 'erro' ? 'text-in-alert' : 'text-in-fg-2')}>
          {msg.text}
        </p>
      )}

      {/* Equipados agora */}
      <dl className="grid grid-cols-1 gap-px bg-in-line-strong shadow-[inset_0_0_0_1px_var(--in-line-strong)]">
        {(Object.keys(SLOT_LABEL) as CosSlot[]).map((s) => {
          const d = eq[s] ? mapa.get(eq[s] as string) : null
          return (
            <div key={s} className="flex min-h-12 items-center justify-between gap-3 bg-[color:var(--in-porcelain)] px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">{SLOT_LABEL[s]}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate font-body text-[15px] text-in-fg">{d?.name ?? 'Nenhum'}</span>
                {d && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => trocar(s, null)}
                    aria-label={`Desequipar ${SLOT_LABEL[s].toLowerCase()}`}
                    className="dv-focus min-h-11 shrink-0 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-in-accent disabled:opacity-40"
                  >
                    Tirar
                  </button>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function Miniatura({ def, fotoSrc, apagado }: { def: CosmeticoDef; fotoSrc: string | null; apagado: boolean }) {
  const efClasse = classeEfeito(def)
  if (def.categoria === 'moldura_avatar') return <FotoMoldurada formato="avatar" src={apagado ? null : fotoSrc} moldura={def} largura={66} animar={false} />
  if (def.categoria === 'moldura_mini') return <FotoMoldurada formato="mini" src={apagado ? null : fotoSrc} moldura={def} largura={82} animar={false} />
  if (def.categoria === 'emblema') return <Emblema def={def} tamanho={52} animar={false} />
  if (def.categoria === 'balao')
    return (
      <BalaoChat def={def} animar={false} className="w-full px-2.5 py-2 text-[12px]">
        <span className="font-body">Olá…</span>
      </BalaoChat>
    )
  return <span className={cn('cos-nome text-[19px]', efClasse)}>Nome</span>
}

function ItemTile({
  def,
  possui,
  livre,
  equipado,
  selecionado,
  raridade,
  fotoSrc,
  onClick,
}: {
  def: CosmeticoDef
  possui: boolean
  livre: boolean
  equipado: boolean
  selecionado: boolean
  raridade: RaridadeVisual
  fotoSrc: string | null
  onClick: () => void
}) {
  const bloqueado = !possui && !livre
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionado}
      aria-label={`${def.name}, ${raridade.label}${bloqueado ? ', bloqueado' : possui ? ', obtido' : ''}${equipado ? ', equipado' : ''}`}
      className={cn(
        'dv-focus group relative flex h-full min-h-[132px] w-full flex-col items-center justify-between gap-1.5 overflow-hidden bg-[#121214] px-1.5 pb-2 pt-2.5 text-dv-text transition-transform active:scale-[0.97]',
        selecionado ? 'shadow-[inset_0_0_0_2px_#c2b9ec,0_0_16px_-4px_rgba(138,124,200,0.9)]' : 'shadow-[inset_0_0_0_1px_rgba(186,176,159,0.3)]',
      )}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: raridade.cor, boxShadow: `0 0 10px ${raridade.brilho}` }} />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_40%,rgba(236,229,216,0.07),transparent_70%)]" />
      <span className={cn('relative grid min-h-[86px] w-full place-items-center', bloqueado && 'opacity-85 [filter:grayscale(0.8)_brightness(0.86)]')}>
        <Miniatura def={def} fotoSrc={fotoSrc} apagado={bloqueado} />
      </span>
      {bloqueado && (
        <span aria-hidden="true" className="absolute left-1/2 top-[42%] grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 shadow-[0_0_0_1px_rgba(186,176,159,0.45)] backdrop-blur-[1px]">
          <Lock className="size-3.5 text-[#bab09f]" />
        </span>
      )}
      <span className={cn('relative w-full truncate text-center font-display text-[11px] font-semibold uppercase leading-tight tracking-[0.04em]', bloqueado ? 'text-dv-text-3' : 'text-dv-text')}>{def.name}</span>
      {equipado && <span className="absolute right-1 top-1.5 bg-dv-porcelain px-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-dv-porcelain-ink">Em uso</span>}
      {def.animado && !bloqueado && <span className="absolute left-1 top-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-dv-amethyst-text">Anim.</span>}
    </button>
  )
}

function Detalhe({
  def,
  raridade,
  possui,
  livre,
  equipado,
  busy,
  onEquipar,
  onTirar,
}: {
  def: CosmeticoDef
  raridade: RaridadeVisual
  possui: { source: string | null; firstAt: number; expiresAt: number | null } | null
  livre: boolean
  equipado: boolean
  busy: boolean
  onEquipar: () => void
  onTirar: () => void
}) {
  const pode = livre || !!possui
  return (
    <article aria-label={`Detalhe: ${def.name}`} className="dv-cut-diag relative bg-[color:var(--in-porcelain)] px-4 pb-4 pt-3.5 shadow-[inset_0_0_0_1px_var(--in-line-strong)]" style={{ '--dv-cut': '10px' } as CSSProperties}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: raridade.cor }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">
            {SLOT_LABEL[def.categoria]} · <span style={{ color: raridadeTinta(def.rarity) }}>{raridade.label}</span>
            {def.animado ? ' · animado' : ''}
          </p>
          <h3 className="mt-1 font-serif text-[24px] font-normal uppercase leading-none tracking-[0.03em] text-in-fg">{def.name}</h3>
        </div>
        {equipado && <span className="shrink-0 bg-[#1c1c1f] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">Em uso</span>}
      </div>
      {def.description && <p className="mt-2 font-body text-[15px] leading-relaxed text-in-fg">{def.description}</p>}
      <dl className="mt-3 grid grid-cols-1 gap-1.5 border-t border-in-line pt-2.5">
        <div className="flex justify-between gap-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Origem</dt>
          <dd className="text-right font-body text-[14px] text-in-fg">{ORIGEM_LABEL[def.origem] ?? def.origem}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">{possui ? 'Como obteve' : 'Situação'}</dt>
          <dd className="text-right font-body text-[14px] text-in-fg">
            {possui ? `${MOTIVO_LABEL[possui.source ?? ''] ?? 'Concedido'} · ${fmtData(possui.firstAt)}` : livre ? 'Disponível para você' : 'Ainda não obtido'}
          </dd>
        </div>
        {possui?.expiresAt && (
          <div className="flex justify-between gap-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-in-fg-3">Válido até</dt>
            <dd className="font-body text-[14px] text-in-fg">{fmtData(possui.expiresAt)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 flex gap-2">
        {pode ? (
          equipado ? (
            <Button theme="interior" variant="secondary" size="md" block loading={busy} onClick={onTirar}>
              Desequipar
            </Button>
          ) : (
            <Button theme="interior" variant="primary" size="md" block loading={busy} onClick={onEquipar}>
              Equipar
            </Button>
          )
        ) : (
          <p className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#0d0d0f]/[0.06] font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">
            <Lock className="size-3.5" aria-hidden="true" /> Bloqueado · {ORIGEM_LABEL[def.origem] ?? 'evento'}
          </p>
        )}
      </div>
    </article>
  )
}

/** Tinta da raridade legível sobre papel (as cores claras de raridade escurecem aqui). */
function raridadeTinta(r: ItemRarity) {
  return { comum: '#58585e', incomum: '#5f584d', raro: '#3d3d42', epico: '#7c1a2b', lendario: '#6b5a2a', arcano: '#4a4180' }[r]
}
