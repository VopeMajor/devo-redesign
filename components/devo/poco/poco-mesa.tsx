'use client'

import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { CATEGORIA_LABEL, lerPesos, POCO_CATEGORIAS, type PocoCategoria, type PocoPesos, type PocoPremio, PREMIO_TIPO_LABEL, PREMIO_TIPOS, type PremioTipo, premioElegivel, tabelaChances } from '@/lib/devo/poco'
import type { PocoMesaPremios } from '@/lib/devo/poco-server'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { RecButton, RecInput, RecLabel, RecTag, RecTextarea } from '../system/record-ui'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, RecSelect } from '../system/staff-ui'
import { ItemPoco, MoedaPoco } from './poco-itens'

/**
 * Mesa do Record › Poço (só Owner). Por Dracma: as seções do sorteio (nada de valor, cápsula, fragmento,
 * essência, item estético) com peso e porcentagem — peso 0 tira a seção — e o que cada seção sorteia por dentro
 * (liga/desliga cada item). Abaixo, as recompensas do Owner: qualquer coisa que vá ao inventário (o mesmo
 * catálogo das recompensas normais), uma carta, Tempo ou um prêmio lixo; editar, desligar ou remover.
 * A tabela de chances é recalculada ANTES de salvar com a mesma conta do servidor (lib/devo/poco.ts
 * tabelaChances). O servidor valida tudo e grava no admin_log.
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
const ZERO: PocoPesos = { lixo: 0, capsula: 0, fragmento: 0, essencia: 0, cosmetico: 0 }
/** Seções que sorteiam um item por dentro (o Owner liga/desliga cada um). */
const COM_ITENS = ['capsula', 'essencia', 'cosmetico'] as const
const KIND_ROTULO: Record<string, string> = { cosmetico: 'Cosméticos', fragmento: 'Fragmentos', moeda: 'Moedas', essencia: 'Essências', capsula: 'Cápsulas', chave: 'Chaves', pacote: 'Pacotes', outro: 'Outros' }

export function PocoMesa() {
  const { data, error, isLoading, mutate } = useSWR<PocoMesaPremios>('/api/poco?view=premios', get, { revalidateOnFocus: false })
  const [r, setR] = useState<Rascunho | null>(null)
  const [moedaVista, setMoedaVista] = useState('dracma_comum')
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const [pesosRasc, setPesosRasc] = useState<Record<string, PocoPesos>>({})
  const [aberta, setAberta] = useState<PocoCategoria | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const nomeDoRascunho = (x: Rascunho) =>
    x.nome.trim() ||
    (x.tipo === 'item' ? (data?.catalogo.find((c) => c.key === x.itemKey)?.nome ?? 'Item') : x.tipo === 'carta' ? `Carta: ${data?.cartas.find((c) => c.id === x.cardId)?.nome ?? '?'}` : x.tipo === 'tempo' ? `+${x.minutos} min de Tempo` : 'Prêmio lixo')

  // Prévia da tabela: prêmios atuais com o rascunho aplicado (mesma conta do servidor).
  const previa = useMemo(() => {
    if (!data) return { antes: [], depois: [] }
    const pesos = lerPesos(data.probabilidades[moedaVista])
    if (!pesos) return { antes: [], depois: [] }
    const pesosNovos = lerPesos(pesosRasc[moedaVista]) ?? pesos
    const linhas = (lista: PocoPremio[], ps: PocoPesos = pesos) => tabelaChances(ps, lista.filter((p) => premioElegivel(p, moedaVista)).map((p) => ({ id: p.id, nome: p.nome, peso: p.peso })))
    const antes = linhas(data.premios)
    if (!r) return { antes, depois: linhas(data.premios, pesosNovos) }
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
    return { antes, depois: linhas(lista, pesosNovos) }
  }, [data, r, moedaVista, pesosRasc]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const acao = async (chave: string, body: Record<string, unknown>, ok: string) => {
    setOcupado(chave)
    setAviso(null)
    try {
      await post(body)
      setAviso({ tom: 'ok', texto: ok })
      playSfx('confirm')
      await mutate()
      return true
    } catch (e) {
      setAviso({ tom: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível salvar.' })
      playSfx('error')
      return false
    } finally {
      setOcupado(null)
    }
  }

  if (error) return <ErrorLine>{error.message}</ErrorLine>
  if (isLoading || !data) return <Loading>Descendo ao poço…</Loading>

  const set = (patch: Partial<Rascunho>) => setR((x) => (x ? { ...x, ...patch } : x))
  const moedasNome = new Map(data.moedas.map((m) => [m.key, m.nome]))

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Poço · Recompensas" jp="井戸" ornate headerRight={<HudCode code="DV_POCO_POOL" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Escolha a Dracma. Cada seção tem um peso e a porcentagem que ele dá; peso 0 tira a seção dessa moeda. Abaixo ficam as suas recompensas: qualquer coisa que vá ao inventário, uma carta ou Tempo. A manivela reduz só o lixo.
        </p>
        {aviso && (
          <p role={aviso.tom === 'erro' ? 'alert' : 'status'} className={cn('mt-3 border-l-2 px-3 py-2 font-sans text-[14px]', aviso.tom === 'erro' ? 'border-in-alert text-in-alert' : 'border-in-fg text-in-fg')}>
            {aviso.texto}
          </p>
        )}

        {/* Dracma */}
        <div role="radiogroup" aria-label="Dracma" className="mt-4 flex flex-wrap gap-2">
          {data.moedas.map((m) => {
            const on = m.key === moedaVista
            return (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  playSfx('click')
                  setMoedaVista(m.key)
                  setAberta(null)
                }}
                className={cn('dv-focus dv-cut-diag flex min-h-11 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.12em]', on ? 'bg-in-accent-fill text-white' : 'text-in-fg-2 shadow-[inset_0_0_0_1px_var(--in-line-strong)]')}
              >
                <MoedaPoco chave={m.key} tamanho={22} className="size-5" />
                {m.nome}
              </button>
            )
          })}
        </div>

        <Secoes
          data={data}
          moeda={moedaVista}
          pesos={pesosRasc[moedaVista] ?? data.probabilidades[moedaVista] ?? null}
          salvos={data.probabilidades[moedaVista] ?? null}
          linhas={previa.depois}
          aberta={aberta}
          onAbrir={(k) => setAberta((x) => (x === k ? null : k))}
          onPeso={(k, n) => setPesosRasc((x) => ({ ...x, [moedaVista]: { ...(x[moedaVista] ?? data.probabilidades[moedaVista] ?? ZERO), [k]: n } }))}
          onDescartar={() => setPesosRasc((x) => { const { [moedaVista]: _, ...resto } = x; return resto })}
          salvando={ocupado === 'pesos'}
          onSalvar={async () => {
            if (await acao('pesos', { action: 'pesos.salvar', moeda: moedaVista, pesos: pesosRasc[moedaVista] }, 'Seções salvas.')) setPesosRasc((x) => { const { [moedaVista]: _, ...resto } = x; return resto })
          }}
          ocupado={ocupado}
          onItem={(key, noPoco, nome) => acao(`item:${key}`, { action: 'secao.item', key, noPoco }, noPoco ? `${nome} voltou ao poço.` : `${nome} saiu do poço.`)}
        />

        {/* recompensas do Owner nesta moeda */}
        <header className="mt-6 flex items-center gap-2">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg-2">Suas recompensas nesta Dracma</h3>
          <span aria-hidden="true" className="h-px flex-1 bg-in-line" />
        </header>
        <div className="mt-2 flex flex-col gap-2">
          {(() => {
            const pct = new Map(previa.depois.map((l) => [l.chave, l.pct]))
            const lista = data.premios.filter((p) => p.moedas.length === 0 || p.moedas.includes(moedaVista))
            if (!lista.length) return <EmptyLine title="Nenhuma recompensa sua nesta Dracma">O poço sorteia só as seções acima.</EmptyLine>
            return lista.map((p) => (
              <div key={p.id} className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 py-2 shadow-[inset_0_-1px_0_var(--in-line)]', !p.ativo && 'opacity-55')}>
                <span className="grid size-12 shrink-0 place-items-center bg-in-panel">
                  <ItemPoco premio={p} tamanho={64} className="size-10" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[15px] font-medium text-in-fg">{p.nome}</p>
                  <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">
                    {PREMIO_TIPO_LABEL[p.tipo]} · {ITEM_RARITY_LABEL[p.raridade]} · peso {p.peso}
                    {p.quantidade > 1 && ` · ×${p.quantidade}`}
                    {p.estoque !== null && ` · estoque ${p.entregues}/${p.estoque}`}
                    {p.moedas.length > 0 ? ` · ${p.moedas.map((m) => moedasNome.get(m) ?? m).join(', ')}` : ' · todas as Dracmas'}
                  </p>
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-[14px] font-semibold text-in-fg tabular-nums">{p.ativo && premioElegivel(p, moedaVista) ? `${(pct.get(`premio:${p.id}`) ?? 0).toFixed(1)}%` : '—'}</span>
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <RecButton surface="paper" variant="ghost" size="sm" onClick={() => setR(deRascunho(p))} aria-label={`Alterar ${p.nome}`}>
                    Alterar
                  </RecButton>
                  <RecButton surface="paper" variant="secondary" size="sm" onClick={() => alternar(p)} aria-label={`${p.ativo ? 'Desligar' : 'Ligar'} ${p.nome}`}>
                    {p.ativo ? 'Desligar' : 'Ligar'}
                  </RecButton>
                  <ConfirmButton size="sm" variant="secondary" confirmLabel="Remover de vez" loading={ocupado === `rm:${p.id}`} onConfirm={() => acao(`rm:${p.id}`, { action: 'premio.remover', id: p.id }, `${p.nome} saiu do poço.`)}>
                    Remover
                  </ConfirmButton>
                </div>
              </div>
            ))
          })()}
        </div>
        {!r && (
          <RecButton surface="paper" className="mt-4" block onClick={() => setR({ ...VAZIO, tipo: 'item', moedas: [moedaVista] })}>
            Adicionar recompensa
          </RecButton>
        )}
      </RecordPanel>

      {r && (
        <RecordPanel variant="paper" title={r.id ? 'Alterar recompensa' : 'Nova recompensa'} jp="景品">
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
                <RecLabel hint="o mesmo inventário das recompensas normais">Item</RecLabel>
                <RecSelect
                  value={r.itemKey}
                  onChange={(e) => {
                    const c = data.catalogo.find((x) => x.key === e.target.value)
                    set({ itemKey: e.target.value, ...(c ? { raridade: c.raridade } : {}) })
                  }}
                  required
                >
                  <option value="">Escolha…</option>
                  {[...new Set(data.catalogo.map((c) => c.kind))].map((k) => (
                    <optgroup key={k} label={KIND_ROTULO[k] ?? k}>
                      {data.catalogo
                        .filter((c) => c.kind === k)
                        .map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.nome} ({ITEM_RARITY_LABEL[c.raridade]}){c.unico ? ' · único' : ''}
                          </option>
                        ))}
                    </optgroup>
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
          <Chances moedas={data.moedas} moeda={moedaVista} onMoeda={setMoedaVista} antes={previa.antes} depois={previa.depois} />
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

function Secoes({
  data,
  moeda,
  pesos,
  salvos,
  linhas,
  aberta,
  onAbrir,
  onPeso,
  onDescartar,
  onSalvar,
  salvando,
  ocupado,
  onItem,
}: {
  data: PocoMesaPremios
  moeda: string
  pesos: PocoPesos | null
  salvos: PocoPesos | null
  linhas: { chave: string; pct: number }[]
  aberta: PocoCategoria | null
  onAbrir: (k: PocoCategoria) => void
  onPeso: (k: PocoCategoria, n: number) => void
  onDescartar: () => void
  onSalvar: () => void
  salvando: boolean
  ocupado: string | null
  onItem: (key: string, noPoco: boolean, nome: string) => void
}) {
  const p = pesos ?? ZERO
  const pct = new Map(linhas.map((l) => [l.chave, l.pct]))
  const sujo = !!pesos && JSON.stringify(pesos) !== JSON.stringify(salvos ?? ZERO)
  return (
    <section aria-label="Seções do sorteio" className="mt-5">
      <header className="flex items-center gap-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-in-fg-2">Seções</h3>
        <span aria-hidden="true" className="h-px flex-1 bg-in-line" />
      </header>
      {!salvos && !pesos && <p className="mt-2 font-sans text-[14px] text-in-fg-3">Esta Dracma ainda não tem seções: dê peso a alguma abaixo.</p>}
      <ul className="mt-1 flex flex-col">
        {POCO_CATEGORIAS.map((k) => {
          const peso = p[k] ?? 0
          const fora = peso <= 0
          const itens = (COM_ITENS as readonly string[]).includes(k) ? data.secoes[k as (typeof COM_ITENS)[number]] : null
          const ligados = itens?.filter((i) => i.noPoco).length ?? 0
          return (
            <li key={`${moeda}:${k}`} className="border-b border-dashed border-in-line last:border-b-0">
              <div className={cn('flex flex-col gap-2 py-3', fora && 'opacity-60')}>
                <div className="flex items-baseline gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[15px] text-in-fg">{CATEGORIA_LABEL[k]}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">
                      {fora ? 'fora desta Dracma' : itens ? `${ligados} de ${itens.length} itens no poço` : k === 'fragmento' ? 'Fragmento Arcano' : 'some no balde'}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[16px] font-semibold text-in-fg tabular-nums">{fora ? '—' : `${(pct.get(k) ?? 0).toFixed(1)}%`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-in-fg-3">Peso</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Peso de ${CATEGORIA_LABEL[k]}`}
                      value={String(peso)}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, '').slice(0, 7) || 0)
                        if (Number.isFinite(n)) onPeso(k, n)
                      }}
                      className="dv-focus h-10 w-16 border-b-2 border-in-line-strong bg-in-fg/[0.035] px-2 text-right font-mono text-[15px] text-in-fg outline-none focus:border-in-fg dv-tabular"
                    />
                  </label>
                  <span className="flex-1" />
                  {itens && (
                    <RecButton surface="paper" variant="ghost" size="sm" aria-expanded={aberta === k} onClick={() => onAbrir(k)}>
                      {aberta === k ? 'Fechar' : 'Itens'}
                    </RecButton>
                  )}
                  <RecButton surface="paper" variant="secondary" size="sm" onClick={() => onPeso(k, fora ? Math.max(1, salvos?.[k] || 5) : 0)} aria-label={`${fora ? 'Repor' : 'Remover'} ${CATEGORIA_LABEL[k]}`}>
                    {fora ? 'Repor' : 'Remover'}
                  </RecButton>
                </div>
              </div>
              {itens && aberta === k && (
                <ul className="mb-3 flex flex-col bg-[color:var(--in-porcelain)] px-3 py-1 shadow-[inset_0_0_0_1px_var(--in-line)]">
                  {itens.length === 0 && <li className="py-2 font-sans text-[14px] text-in-fg-3">Nenhum item desta seção no catálogo.</li>}
                  {itens.map((i) => (
                    <li key={i.key} className={cn('flex min-h-11 items-center gap-3 border-b border-in-line last:border-b-0', !i.noPoco && 'opacity-60')}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-[14px] text-in-fg">{i.nome}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-in-fg-3">{ITEM_RARITY_LABEL[i.raridade]}</span>
                      </span>
                      <RecButton surface="paper" variant={i.noPoco ? 'secondary' : 'primary'} size="sm" loading={ocupado === `item:${i.key}`} onClick={() => onItem(i.key, !i.noPoco, i.nome)} aria-label={`${i.noPoco ? 'Tirar' : 'Pôr'} ${i.nome} ${i.noPoco ? 'do' : 'no'} poço`}>
                        {i.noPoco ? 'Tirar' : 'Pôr'}
                      </RecButton>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {sujo && (
        <div className="mt-3 flex gap-2">
          <RecButton surface="paper" block loading={salvando} onClick={onSalvar}>
            Salvar seções
          </RecButton>
          <RecButton surface="paper" variant="secondary" onClick={onDescartar}>
            Desfazer
          </RecButton>
        </div>
      )}
    </section>
  )
}
