'use client'

import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { lerPesos, type PocoPremio, PREMIO_TIPO_LABEL, PREMIO_TIPOS, type PremioTipo, premioElegivel, tabelaChances } from '@/lib/devo/poco'
import type { PocoMesaPremios } from '@/lib/devo/poco-server'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecLabel, RecTag, RecTextarea } from '../system/record-ui'
import { EmptyLine, ErrorLine, Loading, RecSelect } from '../system/staff-ui'
import { ItemPoco } from './poco-itens'

/**
 * Mesa do Record › Poço (só Owner): prêmios do pool do Poço. Escolher um item existente (cosmético, fragmento,
 * moeda, essência, cápsula, chave), uma carta, Tempo, ou criar um prêmio lixo (nome, descrição e imagem, que não
 * vai ao inventário). Raridade, peso, moedas e estoque. A tabela de chances é recalculada ANTES de salvar com a
 * mesma conta do servidor (lib/devo/poco.ts tabelaChances). O servidor valida tudo e grava no admin_log.
 */

async function get(url: string): Promise<PocoMesaPremios> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'O poço não respondeu.')
  return j
}

async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/poco', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível salvar.')
  return j
}

type Rascunho = {
  id?: string
  tipo: PremioTipo
  itemKey: string
  cardId: string
  minutos: string
  quantidade: string
  nome: string
  descricao: string
  imagem: string
  raridade: ItemRarity
  peso: string
  moedas: string[]
  estoque: string
  ativo: boolean
}

const VAZIO: Rascunho = { tipo: 'lixo', itemKey: '', cardId: '', minutos: '60', quantidade: '1', nome: '', descricao: '', imagem: '', raridade: 'comum', peso: '5', moedas: [], estoque: '', ativo: true }

function deRascunho(p: PocoPremio): Rascunho {
  return {
    id: p.id,
    tipo: p.tipo,
    itemKey: p.itemKey ?? '',
    cardId: p.cardId ?? '',
    minutos: String(p.minutos ?? 60),
    quantidade: String(p.quantidade),
    nome: p.nome,
    descricao: p.descricao ?? '',
    imagem: p.imagem ?? '',
    raridade: p.raridade,
    peso: String(p.peso),
    moedas: p.moedas,
    estoque: p.estoque === null ? '' : String(p.estoque),
    ativo: p.ativo,
  }
}

const RARIDADES = Object.keys(ITEM_RARITY_LABEL) as ItemRarity[]

export function PocoMesa() {
  const { data, error, isLoading, mutate } = useSWR<PocoMesaPremios>('/api/poco?view=premios', get, { revalidateOnFocus: false })
  const [r, setR] = useState<Rascunho | null>(null)
  const [moedaVista, setMoedaVista] = useState('dracma_comum')
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const nomeDoRascunho = (x: Rascunho) =>
    x.nome.trim() ||
    (x.tipo === 'item' ? (data?.catalogo.find((c) => c.key === x.itemKey)?.nome ?? 'Item') : x.tipo === 'carta' ? `Carta: ${data?.cartas.find((c) => c.id === x.cardId)?.nome ?? '?'}` : x.tipo === 'tempo' ? `+${x.minutos} min de Tempo` : 'Prêmio lixo')

  // Prévia da tabela: prêmios atuais com o rascunho aplicado (mesma conta do servidor).
  const previa = useMemo(() => {
    if (!data) return { antes: [], depois: [] }
    const pesos = lerPesos(data.probabilidades[moedaVista])
    if (!pesos) return { antes: [], depois: [] }
    const linhas = (lista: PocoPremio[]) => tabelaChances(pesos, lista.filter((p) => premioElegivel(p, moedaVista)).map((p) => ({ id: p.id, nome: p.nome, peso: p.peso })))
    const antes = linhas(data.premios)
    if (!r) return { antes, depois: antes }
    const peso = Number(r.peso)
    const novo: PocoPremio = {
      id: r.id ?? 'novo',
      tipo: r.tipo,
      itemKey: r.itemKey || null,
      cardId: r.cardId || null,
      minutos: Number(r.minutos) || null,
      quantidade: Number(r.quantidade) || 1,
      nome: nomeDoRascunho(r),
      descricao: r.descricao || null,
      imagem: r.imagem || null,
      raridade: r.raridade,
      peso: Number.isFinite(peso) && peso > 0 ? peso : 0,
      moedas: r.moedas,
      estoque: r.estoque === '' ? null : Number(r.estoque),
      entregues: data.premios.find((p) => p.id === r.id)?.entregues ?? 0,
      ativo: r.ativo,
    }
    const lista = r.id ? data.premios.map((p) => (p.id === r.id ? novo : p)) : [...data.premios, novo]
    return { antes, depois: linhas(lista) }
  }, [data, r, moedaVista]) // eslint-disable-line react-hooks/exhaustive-deps

  const enviarImagem = async (fl: File) => {
    setAviso(null)
    try {
      if (fl.size > 400_000) throw new Error('Imagem maior que 400 KB.')
      const buf = new Uint8Array(await fl.arrayBuffer())
      let bin = ''
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
      const res = await fetch('/api/cosmeticos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'admin.asset', mime: fl.type, base64: btoa(bin) }) })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? 'Imagem recusada.')
      setR((x) => (x ? { ...x, imagem: j.url } : x))
      playSfx('confirm')
    } catch (e) {
      setAviso({ tom: 'erro', texto: e instanceof Error ? e.message : 'Imagem recusada.' })
      playSfx('error')
    }
  }

  const salvar = async () => {
    if (!r) return
    setSalvando(true)
    setAviso(null)
    try {
      await post({
        action: 'premio.salvar',
        premio: {
          id: r.id,
          tipo: r.tipo,
          itemKey: r.itemKey,
          cardId: r.cardId,
          minutos: Number(r.minutos),
          quantidade: Number(r.quantidade),
          nome: r.nome.trim() || undefined,
          descricao: r.descricao.trim() || undefined,
          imagem: r.imagem || undefined,
          raridade: r.raridade,
          peso: Number(r.peso),
          moedas: r.moedas,
          estoque: r.estoque === '' ? null : Number(r.estoque),
          ativo: r.ativo,
        },
      })
      setAviso({ tom: 'ok', texto: r.id ? 'Prêmio atualizado.' : 'Prêmio adicionado ao poço.' })
      setR(null)
      playSfx('confirm')
      mutate()
    } catch (e) {
      setAviso({ tom: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível salvar.' })
      playSfx('error')
    } finally {
      setSalvando(false)
    }
  }

  const alternar = async (p: PocoPremio) => {
    setAviso(null)
    try {
      await post({ action: 'premio.ativar', id: p.id, ativo: !p.ativo })
      playSfx('click')
      mutate()
    } catch (e) {
      setAviso({ tom: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível alterar.' })
    }
  }

  if (error) return <ErrorLine>{error.message}</ErrorLine>
  if (isLoading || !data) return <Loading>Descendo ao poço…</Loading>

  const set = (patch: Partial<Rascunho>) => setR((x) => (x ? { ...x, ...patch } : x))
  const moedasNome = new Map(data.moedas.map((m) => [m.key, m.nome]))

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Poço · Prêmios" jp="井戸" ornate headerRight={<HudCode code="DV_POCO_POOL" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Prêmios que você coloca no fundo do poço. O peso usa a mesma escala das categorias da moeda: a tabela abaixo mostra a chance de cada coisa sair (sem a manivela, que reduz o lixo). Prêmio desligado não sai para ninguém.
        </p>
        {aviso && (
          <p role={aviso.tom === 'erro' ? 'alert' : 'status'} className={cn('mt-3 border-l-2 px-3 py-2 font-sans text-[14px]', aviso.tom === 'erro' ? 'border-in-alert text-in-alert' : 'border-in-fg text-in-fg')}>
            {aviso.texto}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          {data.premios.length === 0 && <EmptyLine title="Nenhum prêmio do Owner ainda">O poço sorteia só as categorias da configuração.</EmptyLine>}
          {data.premios.map((p) => (
            <div key={p.id} className={cn('flex items-center gap-3 py-2 shadow-[inset_0_-1px_0_var(--in-line)]', !p.ativo && 'opacity-55')}>
              <span className="grid size-12 shrink-0 place-items-center bg-in-panel">
                <ItemPoco premio={p} tamanho={64} className="size-10" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[15px] font-medium text-in-fg">{p.nome}</p>
                <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">
                  {PREMIO_TIPO_LABEL[p.tipo]} · {ITEM_RARITY_LABEL[p.raridade]} · peso {p.peso}
                  {p.estoque !== null && ` · estoque ${p.entregues}/${p.estoque}`}
                  {p.moedas.length > 0 && ` · ${p.moedas.map((m) => moedasNome.get(m) ?? m).join(', ')}`}
                </p>
              </div>
              <RecTag tone={p.ativo ? 'solid' : 'line'}>{p.ativo ? 'Ativo' : 'Desligado'}</RecTag>
              <RecButton surface="paper" variant="ghost" size="sm" onClick={() => setR(deRascunho(p))} aria-label={`Editar ${p.nome}`}>
                Editar
              </RecButton>
              <RecButton surface="paper" variant="secondary" size="sm" onClick={() => alternar(p)} aria-label={`${p.ativo ? 'Desligar' : 'Ligar'} ${p.nome}`}>
                {p.ativo ? 'Desligar' : 'Ligar'}
              </RecButton>
            </div>
          ))}
        </div>
        {!r && (
          <RecButton surface="paper" className="mt-4" block onClick={() => setR({ ...VAZIO })}>
            Adicionar prêmio
          </RecButton>
        )}
      </RecordPanel>

      {r && (
        <RecordPanel variant="paper" title={r.id ? 'Editar prêmio' : 'Novo prêmio'} jp="景品">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              salvar()
            }}
          >
            <label className="flex flex-col gap-1.5">
              <RecLabel>Tipo</RecLabel>
              <RecSelect value={r.tipo} onChange={(e) => set({ tipo: e.target.value as PremioTipo })}>
                {PREMIO_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {PREMIO_TIPO_LABEL[t]}
                  </option>
                ))}
              </RecSelect>
            </label>

            {r.tipo === 'item' && (
              <label className="flex flex-col gap-1.5">
                <RecLabel hint="cosmético, fragmento, moeda, essência, cápsula, chave">Item existente</RecLabel>
                <RecSelect value={r.itemKey} onChange={(e) => set({ itemKey: e.target.value })} required>
                  <option value="">Escolha…</option>
                  {data.catalogo.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.nome} ({c.kind}, {ITEM_RARITY_LABEL[c.raridade]}){c.unico ? ' · único' : ''}
                    </option>
                  ))}
                </RecSelect>
              </label>
            )}
            {r.tipo === 'carta' && (
              <label className="flex flex-col gap-1.5">
                <RecLabel>Carta</RecLabel>
                <RecSelect value={r.cardId} onChange={(e) => set({ cardId: e.target.value })} required>
                  <option value="">Escolha…</option>
                  {data.cartas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.raridade})
                    </option>
                  ))}
                </RecSelect>
              </label>
            )}
            {r.tipo === 'tempo' && (
              <label className="flex flex-col gap-1.5">
                <RecLabel hint="1 a 10080">Minutos de Tempo</RecLabel>
                <RecInput type="number" inputMode="numeric" min={1} max={10080} value={r.minutos} onChange={(e) => set({ minutos: e.target.value })} required />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <RecLabel hint={r.tipo === 'lixo' ? 'obrigatório, até 60' : 'opcional: usa o nome do item'}>Nome</RecLabel>
              <RecInput value={r.nome} maxLength={60} onChange={(e) => set({ nome: e.target.value })} required={r.tipo === 'lixo'} placeholder={r.tipo === 'lixo' ? 'Ex.: Botão sem casa' : nomeDoRascunho(r)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <RecLabel hint="até 240">{r.tipo === 'lixo' ? 'Texto no balde' : 'Descrição'}</RecLabel>
              <RecTextarea rows={3} maxLength={240} value={r.descricao} onChange={(e) => set({ descricao: e.target.value })} required={r.tipo === 'lixo'} />
            </label>
            {r.tipo === 'lixo' && (
              <div className="flex items-center gap-3">
                <span className="grid size-16 shrink-0 place-items-center bg-in-panel">
                  {r.imagem ? <img src={r.imagem} alt="" className="size-14 object-contain" /> : <span className="font-mono text-[10px] uppercase text-dv-text-3">sem</span>}
                </span>
                <input ref={file} type="file" accept="image/svg+xml,image/png,image/webp" className="sr-only" aria-label="Enviar imagem do prêmio" onChange={(e) => e.target.files?.[0] && enviarImagem(e.target.files[0])} />
                <RecButton surface="paper" variant="secondary" size="sm" onClick={() => file.current?.click()}>
                  {r.imagem ? 'Trocar imagem' : 'Enviar imagem'}
                </RecButton>
                <span className="font-sans text-[12.5px] text-in-fg-3">PNG, WebP ou SVG, até 400 KB</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <RecLabel>Raridade</RecLabel>
                <RecSelect value={r.raridade} onChange={(e) => set({ raridade: e.target.value as ItemRarity })}>
                  {RARIDADES.map((k) => (
                    <option key={k} value={k}>
                      {ITEM_RARITY_LABEL[k]}
                    </option>
                  ))}
                </RecSelect>
              </label>
              <label className="flex flex-col gap-1.5">
                <RecLabel hint="maior que 0">Peso</RecLabel>
                <RecInput type="number" inputMode="decimal" min={0.001} step="any" value={r.peso} onChange={(e) => set({ peso: e.target.value })} required aria-invalid={!(Number(r.peso) > 0)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <RecLabel>Quantidade</RecLabel>
                <RecInput type="number" inputMode="numeric" min={1} max={999} value={r.quantidade} onChange={(e) => set({ quantidade: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <RecLabel hint="vazio = sem limite">Estoque</RecLabel>
                <RecInput type="number" inputMode="numeric" min={0} value={r.estoque} onChange={(e) => set({ estoque: e.target.value })} />
              </label>
            </div>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5">
                <RecLabel hint="nenhuma marcada = todas">Moedas</RecLabel>
              </legend>
              <div className="flex flex-wrap gap-2">
                {data.moedas.map((m) => {
                  const on = r.moedas.includes(m.key)
                  return (
                    <button
                      key={m.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ moedas: on ? r.moedas.filter((x) => x !== m.key) : [...r.moedas, m.key] })}
                      className={cn('dv-focus dv-cut-diag min-h-11 px-3 font-mono text-[11px] uppercase tracking-[0.12em]', on ? 'bg-in-accent-fill text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]')}
                    >
                      {m.nome}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <label className="flex min-h-11 items-center gap-3 font-sans text-[15px] text-in-fg">
              <input type="checkbox" checked={r.ativo} onChange={(e) => set({ ativo: e.target.checked })} className="size-5 accent-[var(--in-accent-fill)]" />
              Ativo (entra no sorteio)
            </label>

            <Chances
              moedas={data.moedas}
              moeda={moedaVista}
              onMoeda={setMoedaVista}
              antes={previa.antes}
              depois={previa.depois}
            />

            <div className="flex gap-2">
              <RecButton surface="paper" type="submit" loading={salvando} block disabled={!(Number(r.peso) > 0)}>
                {r.id ? 'Salvar alterações' : 'Adicionar ao poço'}
              </RecButton>
              <RecButton surface="paper" variant="secondary" onClick={() => setR(null)}>
                Cancelar
              </RecButton>
            </div>
          </form>
        </RecordPanel>
      )}

      {!r && (
        <RecordPanel variant="paper" title="Chances por moeda" jp="確率">
          <Chances moedas={data.moedas} moeda={moedaVista} onMoeda={setMoedaVista} antes={previa.antes} depois={previa.antes} />
        </RecordPanel>
      )}
    </div>
  )
}

function Chances({
  moedas,
  moeda,
  onMoeda,
  antes,
  depois,
}: {
  moedas: { key: string; nome: string }[]
  moeda: string
  onMoeda: (m: string) => void
  antes: { chave: string; nome: string; pct: number; premio: boolean }[]
  depois: { chave: string; nome: string; pct: number; premio: boolean }[]
}) {
  const ant = new Map(antes.map((l) => [l.chave, l.pct]))
  const soma = Math.round(depois.reduce((s, l) => s + l.pct, 0) * 10) / 10
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <RecLabel hint={`soma ${soma.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`}>Tabela de chances</RecLabel>
        <RecSelect value={moeda} onChange={(e) => onMoeda(e.target.value)} aria-label="Moeda da tabela">
          {moedas.map((m) => (
            <option key={m.key} value={m.key}>
              {m.nome}
            </option>
          ))}
        </RecSelect>
      </label>
      {depois.length === 0 ? (
        <p className="font-sans text-[14px] text-in-fg-3">Esta moeda ainda não tem probabilidades definidas (Ajustes).</p>
      ) : (
        <table className="w-full font-sans text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">
              <th className="py-1 font-normal">Resultado</th>
              <th className="py-1 text-right font-normal">Antes</th>
              <th className="py-1 text-right font-normal">Depois</th>
            </tr>
          </thead>
          <tbody>
            {depois.map((l) => {
              const a = ant.get(l.chave)
              const mudou = a === undefined || Math.abs(a - l.pct) >= 0.05
              return (
                <tr key={l.chave} className="shadow-[inset_0_-1px_0_var(--in-line)]">
                  <td className={cn('py-1.5 pr-2', l.premio ? 'text-in-accent' : 'text-in-fg')}>{l.nome}</td>
                  <td className="py-1.5 text-right tabular-nums text-in-fg-3">{a === undefined ? '—' : `${a.toFixed(1)}%`}</td>
                  <td className={cn('py-1.5 text-right tabular-nums', mudou ? 'font-semibold text-in-fg' : 'text-in-fg-2')}>{l.pct.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
