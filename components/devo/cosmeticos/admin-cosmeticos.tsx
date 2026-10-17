'use client'

import { type CSSProperties, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ARTE_IMAGEM, IMAGENS_CATALOGO, imagemDoAsset, type CosmeticoDef, type CosSlot, ORIGEM_LABEL, RARIDADE_PADRAO, RARIDADES, SLOT_LABEL } from '@/lib/devo/cosmeticos'
import type { ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, RecSelect, STAFF_KEY, staffGet } from '../system/staff-ui'
import { RecButton, RecInput, RecLabel, RecTextarea } from '../system/record-ui'
import { BALOES, EFEITOS, EMBLEMAS, MOLDURAS } from './art'
import { BalaoChat, Emblema, FotoMoldurada, classeEfeito } from './cosmetic-art'
import { cosPost, revalidarCosmeticos } from './use-cosmeticos'

type ItemAdmin = CosmeticoDef & { donos: number; equipados: number }
type Linha = { at: number; jogador: string; jogadorId: string; item: string; itemNome: string; delta: number; motivo: string; ator: string | null }

const get = async <T,>(u: string): Promise<T> => {
  const r = await fetch(u, { cache: 'no-store' })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((d as { error?: string }).error ?? 'Falha ao carregar.')
  return d as T
}

type Aba = 'catalogo' | 'conceder' | 'historico'

/**
 * Mesa › Cosméticos (Owner; texto do dono §13): catálogo (criar/editar, asset, raridade, disponibilidade,
 * Poço, animação), conceder/revogar e histórico de distribuição. O servidor exige `catalogo.editar` /
 * `item.conceder` em cada chamada. Anfitriões não editam o catálogo: só escolhem itens existentes como
 * recompensa (Recompensas / Semanais), quando autorizados.
 */
export function AdminCosmeticos() {
  const [aba, setAba] = useState<Aba>('catalogo')
  const { data, error, mutate } = useSWR<{ itens: ItemAdmin[] }>('/api/cosmeticos?view=admin', get)
  const [edit, setEdit] = useState<ItemAdmin | 'novo' | null>(null)

  return (
    <section aria-label="Cosméticos" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-in-fg-3">Catálogo global</p>
          <h3 className="mt-1 font-serif text-[26px] font-light uppercase leading-none tracking-[0.03em] text-in-fg">Cosméticos</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">{data ? `${data.itens.length} itens` : '—'}</p>
      </div>
      <div role="tablist" aria-label="Seções de cosméticos" className="grid grid-cols-3 gap-1">
        {(
          [
            ['catalogo', 'Catálogo'],
            ['conceder', 'Conceder'],
            ['historico', 'Histórico'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={aba === v}
            onClick={() => setAba(v)}
            className={cn('dv-focus min-h-11 font-sans text-[11px] font-medium uppercase tracking-[0.12em]', aba === v ? 'bg-dv-block text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]')}
          >
            {l}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : !data ? (
        <Loading>Abrindo o catálogo…</Loading>
      ) : aba === 'catalogo' ? (
        edit ? (
          <Editor
            item={edit === 'novo' ? null : edit}
            onClose={() => setEdit(null)}
            onSaved={async () => {
              setEdit(null)
              await mutate()
              await revalidarCosmeticos()
            }}
          />
        ) : (
          <>
            <RecButton surface="paper" variant="primary" block onClick={() => setEdit('novo')}>
              Novo cosmético
            </RecButton>
            <ul className="flex flex-col gap-1.5" aria-label="Itens do catálogo">
              {data.itens.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    onClick={() => setEdit(it)}
                    aria-label={`Editar ${it.name} (${SLOT_LABEL[it.categoria]})`}
                    className="dv-focus flex min-h-[68px] w-full items-center gap-3 bg-[color:var(--in-porcelain)] px-3 py-2 text-left shadow-[inset_0_0_0_1px_var(--in-line)] hover:shadow-[inset_0_0_0_1px_var(--in-fg-2)]"
                  >
                    <span className="grid size-[54px] shrink-0 place-items-center bg-dv-ink-2">
                      <Thumb def={it} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-body text-[16px] text-in-fg">{it.name}</span>
                        {!it.active && <span className="shrink-0 bg-dv-ink/10 px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-in-fg-2">inativo</span>}
                      </span>
                      <span className="block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">
                        {SLOT_LABEL[it.categoria]} · {RARIDADE_PADRAO[it.rarity].label}
                        {it.poco ? ' · Poço' : ''}
                        {it.animado ? ' · anim.' : ''}
                        {it.automatico ? ' · automático' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-mono text-[10px] uppercase leading-tight tracking-[0.1em] text-in-fg-2">
                      <span className="block font-impact text-[17px] text-in-fg dv-tabular">{it.donos}</span>donos
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )
      ) : aba === 'conceder' ? (
        <Conceder itens={data.itens.filter((i) => !i.automatico)} onDone={() => mutate()} />
      ) : (
        <Historico />
      )}
    </section>
  )
}

function Thumb({ def }: { def: CosmeticoDef }) {
  if (def.categoria === 'moldura_avatar') return <FotoMoldurada formato="avatar" src={null} moldura={def} largura={36} animar={false} />
  if (def.categoria === 'moldura_mini') return <FotoMoldurada formato="mini" src={null} moldura={def} largura={50} animar={false} />
  if (def.categoria === 'emblema') return <Emblema def={def} tamanho={34} animar={false} />
  if (def.categoria === 'balao')
    return (
      <BalaoChat def={def} animar={false} className="px-1.5 py-1 text-[9px]">
        Aa
      </BalaoChat>
    )
  return <span className={cn('cos-nome text-[14px] text-white', classeEfeito(def))}>Aa</span>
}

const ARTES: Record<CosSlot, string[]> = {
  moldura_avatar: [...ARTE_IMAGEM.moldura, ...Object.keys(MOLDURAS).map((k) => `devo:moldura/${k}`)],
  moldura_mini: [...ARTE_IMAGEM.moldura, ...Object.keys(MOLDURAS).map((k) => `devo:moldura/${k}`)],
  emblema: [...ARTE_IMAGEM.emblema, ...Object.keys(EMBLEMAS).map((k) => `devo:emblema/${k}`)],
  balao: [...ARTE_IMAGEM.balao, ...Object.keys(BALOES).map((k) => `devo:balao/${k}`)],
  efeito: Object.keys(EFEITOS).map((k) => `devo:efeito/${k}`),
}

function Editor({ item, onClose, onSaved }: { item: ItemAdmin | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(() => ({
    key: item?.key ?? 'cosmetico:',
    name: item?.name ?? '',
    description: item?.description ?? '',
    categoria: (item?.categoria ?? 'emblema') as CosSlot,
    rarity: (item?.rarity ?? 'comum') as ItemRarity,
    asset: item?.asset ?? '',
    animado: item?.animado ?? false,
    poco: item?.poco ?? false,
    origem: item?.origem ?? 'exclusivo',
    active: item?.active ?? true,
    ordem: item?.ordem ?? 500,
  }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const previa: CosmeticoDef = {
    ...f,
    description: f.description || null,
    automatico: !!item?.automatico,
    par: item?.par ?? null,
    imagem: imagemDoAsset(f.asset, IMAGENS_CATALOGO[f.asset]?.imagem ?? item?.imagem),
  }

  const enviar = async (fl: File) => {
    setErr(null)
    if (!['image/svg+xml', 'image/png', 'image/webp'].includes(fl.type)) return setErr('Use SVG, PNG ou WebP.')
    if (fl.size > 400_000) return setErr('O arquivo passa de 400 KB.')
    setBusy(true)
    try {
      const buf = new Uint8Array(await fl.arrayBuffer())
      let bin = ''
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
      const r = await cosPost<{ url: string }>({ action: 'admin.asset', mime: fl.type, base64: btoa(bin) })
      set({ asset: r.url })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const salvar = async () => {
    setBusy(true)
    setErr(null)
    try {
      await cosPost({ action: 'admin.salvar', item: f })
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article aria-label={item ? `Editar ${item.name}` : 'Novo cosmético'} className="dv-cut-diag flex flex-col gap-4 bg-[color:var(--in-porcelain)] p-4 shadow-[inset_0_0_0_1px_var(--in-line-strong)]" style={{ '--dv-cut': '10px' } as CSSProperties}>
      <div className="flex items-center gap-4">
        <span className="grid size-[96px] shrink-0 place-items-center bg-dv-ink-2">
          <Thumb def={previa} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-in-fg-3">{item ? 'Editar item' : 'Novo item'}</p>
          <p className="mt-1 truncate font-serif text-[22px] uppercase leading-none text-in-fg">{f.name || 'Sem nome'}</p>
          {item && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-2">{item.donos} donos · {item.equipados} em uso</p>}
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <RecLabel hint="cosmetico:nome-em-minusculas">Chave</RecLabel>
        <RecInput value={f.key} disabled={!!item} onChange={(e) => set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9:-]/g, '') })} />
      </label>
      <label className="flex flex-col gap-1.5">
        <RecLabel>Nome</RecLabel>
        <RecInput value={f.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1.5">
        <RecLabel>Descrição</RecLabel>
        <RecTextarea rows={2} value={f.description} maxLength={300} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <RecLabel>Categoria</RecLabel>
          <RecSelect value={f.categoria} onChange={(e) => set({ categoria: e.target.value as CosSlot, asset: '' })}>
            {(Object.keys(SLOT_LABEL) as CosSlot[]).map((s) => (
              <option key={s} value={s}>
                {SLOT_LABEL[s]}
              </option>
            ))}
          </RecSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel>Raridade</RecLabel>
          <RecSelect value={f.rarity} onChange={(e) => set({ rarity: e.target.value as ItemRarity })}>
            {RARIDADES.map((r) => (
              <option key={r} value={r}>
                {RARIDADE_PADRAO[r].label}
              </option>
            ))}
          </RecSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel>Origem</RecLabel>
          <RecSelect value={f.origem} onChange={(e) => set({ origem: e.target.value })}>
            {Object.entries(ORIGEM_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </RecSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel>Ordem</RecLabel>
          <RecInput inputMode="numeric" value={String(f.ordem)} onChange={(e) => set({ ordem: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || 0 })} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <RecLabel hint="arte da casa, arquivo enviado ou URL https">Asset</RecLabel>
        <RecSelect value={ARTES[f.categoria].includes(f.asset) ? f.asset : ''} onChange={(e) => e.target.value && set({ asset: e.target.value })}>
          <option value="">{f.asset && !ARTES[f.categoria].includes(f.asset) ? 'Arquivo/URL próprio' : 'Escolher arte da casa…'}</option>
          {ARTES[f.categoria].map((a) => (
            <option key={a} value={a}>
              {a.replace('devo:', '')}
            </option>
          ))}
        </RecSelect>
        <RecInput placeholder="https://… ou envie um arquivo" value={ARTES[f.categoria].includes(f.asset) ? '' : f.asset} onChange={(e) => set({ asset: e.target.value.trim() })} />
        <input ref={file} type="file" accept="image/svg+xml,image/png,image/webp" className="sr-only" aria-label="Enviar arquivo do asset" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
        <RecButton surface="paper" variant="secondary" size="sm" loading={busy} onClick={() => file.current?.click()}>
          Enviar arquivo (SVG, PNG, WebP · até 400 KB)
        </RecButton>
      </label>
      <fieldset className="grid grid-cols-1 gap-1">
        <legend className="sr-only">Disponibilidade</legend>
        {(
          [
            ['active', 'Disponível (ativo no catálogo)'],
            ['poco', 'Pode sair no Poço dos Milagres'],
            ['animado', 'Tem animação (desligável pelo jogador)'],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className="flex min-h-11 items-center gap-3 font-body text-[15px] text-in-fg">
            <input type="checkbox" checked={f[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<typeof f>)} className="size-5 accent-dv-block" />
            {l}
          </label>
        ))}
      </fieldset>
      {err && <ErrorLine>{err}</ErrorLine>}
      <div className="flex gap-2">
        <RecButton surface="paper" variant="primary" className="flex-1" loading={busy} onClick={salvar}>
          Salvar
        </RecButton>
        <RecButton surface="paper" variant="ghost" onClick={onClose}>
          Cancelar
        </RecButton>
      </div>
    </article>
  )
}

type Jogador = { id: string; name: string }

function Conceder({ itens, onDone }: { itens: ItemAdmin[]; onDone: () => void }) {
  const [q, setQ] = useState('')
  const { data } = useSWR<{ jogadores: Jogador[] }>(`${STAFF_KEY}?view=jogadores&q=${encodeURIComponent(q.trim())}`, staffGet, { keepPreviousData: true })
  const [pid, setPid] = useState<string | null>(null)
  const [key, setKey] = useState(itens[0]?.key ?? '')
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const nome = data?.jogadores.find((j) => j.id === pid)?.name
  const run = async (action: 'admin.conceder' | 'admin.revogar') => {
    if (!pid) return
    setBusy(true)
    setMsg(null)
    try {
      await cosPost({ action, playerId: pid, key, motivo })
      setMsg({ ok: true, t: action === 'admin.conceder' ? `Concedido a ${nome}.` : `Revogado de ${nome}.` })
      onDone()
      await revalidarCosmeticos()
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  const lista = useMemo(() => itens.slice().sort((a, b) => a.categoria.localeCompare(b.categoria) || a.name.localeCompare(b.name)), [itens])
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <RecLabel>Jogador</RecLabel>
        <RecInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo nome" />
      </label>
      <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto" aria-label="Resultados">
        {(data?.jogadores ?? []).slice(0, 12).map((j) => (
          <li key={j.id}>
            <button
              type="button"
              aria-pressed={pid === j.id}
              onClick={() => setPid(j.id)}
              className={cn('dv-focus flex min-h-11 w-full items-center px-3 text-left font-body text-[15px]', pid === j.id ? 'bg-dv-block text-white' : 'text-in-fg shadow-[inset_0_0_0_1px_var(--in-line)]')}
            >
              {j.name}
            </button>
          </li>
        ))}
      </ul>
      <label className="flex flex-col gap-1.5">
        <RecLabel>Cosmético</RecLabel>
        <RecSelect value={key} onChange={(e) => setKey(e.target.value)}>
          {lista.map((i) => (
            <option key={i.key} value={i.key}>
              {SLOT_LABEL[i.categoria]} · {i.name}
            </option>
          ))}
        </RecSelect>
      </label>
      <label className="flex flex-col gap-1.5">
        <RecLabel hint="vai para o registro">Motivo</RecLabel>
        <RecInput value={motivo} maxLength={120} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: prêmio do evento de sexta" />
      </label>
      {msg && <p className={cn('font-mono text-[11px] uppercase tracking-[0.12em]', msg.ok ? 'text-in-fg-2' : 'text-in-alert')}>{msg.t}</p>}
      <div className="grid grid-cols-2 gap-2">
        <RecButton surface="paper" variant="primary" disabled={!pid || !key} loading={busy} onClick={() => run('admin.conceder')}>
          Conceder
        </RecButton>
        <ConfirmButton surface="paper" variant="danger" disabled={!pid || !key} loading={busy} confirmLabel="Revogar mesmo" onConfirm={() => run('admin.revogar')}>
          Revogar
        </ConfirmButton>
      </div>
    </div>
  )
}

function Historico() {
  const { data, error } = useSWR<{ historico: Linha[] }>('/api/cosmeticos?view=historico', get)
  if (error) return <ErrorLine>{(error as Error).message}</ErrorLine>
  if (!data) return <Loading>Lendo o livro-razão…</Loading>
  if (!data.historico.length) return <EmptyLine title="Nenhuma distribuição ainda">Concessões, prêmios do Poço e recompensas aparecem aqui.</EmptyLine>
  return (
    <ol className="flex flex-col divide-y divide-in-line shadow-[inset_0_0_0_1px_var(--in-line)]" aria-label="Histórico de distribuição">
      {data.historico.map((h, i) => (
        <li key={`${h.at}-${i}`} className="flex items-center gap-3 bg-[color:var(--in-porcelain)] px-3 py-2.5">
          <span className={cn('w-7 shrink-0 text-center font-impact text-[17px]', h.delta > 0 ? 'text-in-fg' : 'text-in-alert')}>{h.delta > 0 ? '+' : '−'}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-[15px] text-in-fg">
              {h.itemNome} → {h.jogador}
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-in-fg-3">
              {h.motivo}
              {h.ator ? ` · por ${h.ator}` : ''} · {new Date(h.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
