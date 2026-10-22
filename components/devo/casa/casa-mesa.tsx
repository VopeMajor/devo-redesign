'use client'

import { useEffect, useState } from 'react'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { CARDS, RARITY_META } from '@/lib/devo/cards'
import { ALVOS_RARIDADE, type ConfeccaoRegras, formatMinutos, nomeCarta, type Receita } from '@/lib/devo/confeccao'
import { RecButton, RecInput, RecLabel, RecTag } from '../system/record-ui'
import { EmptyLine, ErrorLine, Loading, RecSelect } from '../system/staff-ui'
import { casaPost, useCasa } from './dados'

/**
 * Mesa › Casa (Owner): regras da Confecção (custos e esperas provisórios, espaços e aprimoramentos) e as receitas
 * (combinações exatas). As receitas não aparecem para ninguém até alguém descobrir: aí entram no Livro de quem
 * descobriu e da Corporação dele.
 */
export function CasaMesa() {
  const { data, error, mutate } = useCasa()
  if (error) return <ErrorLine>{(error as Error).message}</ErrorLine>
  if (!data) return <Loading />
  if (!data.liberado || !data.receitas) return <ErrorLine>Só o Owner configura a Casa.</ErrorLine>
  return (
    <>
      <RecordPanel variant="paper" title="Casa" jp="家" ornate headerRight={<HudCode code="DV_CASA" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Confecção de Cartas: materiais por raridade (5/10/15/20) e chance por nível da mesa (50% a 95%) seguem o texto do dono. Custos, esperas e espaços abaixo são provisórios até você decidir.
        </p>
      </RecordPanel>
      <Regras inicial={data.regras} provisorio={data.provisorio} onSalvo={() => mutate()} />
      <Receitas inicial={data.receitas} onSalvo={() => mutate()} />
    </>
  )
}

const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0))

function Num({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <RecLabel hint={hint}>{label}</RecLabel>
      <RecInput inputMode="numeric" value={String(value)} onChange={(e) => onChange(num(e.target.value))} className="dv-tabular" />
    </label>
  )
}

function Regras({ inicial, provisorio, onSalvo }: { inicial: ConfeccaoRegras; provisorio: boolean; onSalvo: () => void }) {
  const [r, setR] = useState(inicial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => setR(inicial), [inicial])
  const salvar = async (prov: boolean) => {
    setBusy(true)
    setMsg(null)
    try {
      await casaPost({ action: 'regras.salvar', regras: r, provisorio: prov })
      playSfx('confirm')
      setMsg(prov ? 'Salvo (ainda provisório).' : 'Salvo como definitivo.')
      onSalvo()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <RecordPanel title="Regras da Confecção" jp="規則" headerRight={<RecTag tone={provisorio ? 'accent' : 'muted'}>{provisorio ? 'provisório' : 'definido'}</RecTag>}>
      <div className="flex flex-col gap-4">
        {ALVOS_RARIDADE.map((a) => (
          <div key={a} className="grid grid-cols-2 gap-3">
            <Num label={`${RARITY_META[a].label} · Tempo`} hint="min" value={r.raridade[a].minutos} onChange={(n) => setR({ ...r, raridade: { ...r.raridade, [a]: { ...r.raridade[a], minutos: n } } })} />
            <Num label="Espera" hint={formatMinutos(r.raridade[a].espera)} value={r.raridade[a].espera} onChange={(n) => setR({ ...r, raridade: { ...r.raridade, [a]: { ...r.raridade[a], espera: n } } })} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <Num label="Combinação sem receita · Tempo" hint="min" value={r.experimento.minutos} onChange={(n) => setR({ ...r, experimento: { ...r.experimento, minutos: n } })} />
          <Num label="Espera" hint={formatMinutos(r.experimento.espera)} value={r.experimento.espera} onChange={(n) => setR({ ...r, experimento: { ...r.experimento, espera: n } })} />
        </div>
        <div>
          <RecLabel hint="níveis 1 a 6">Espaços por nível</RecLabel>
          <div className="mt-1 grid grid-cols-6 gap-1.5">
            {r.espacos.map((e, i) => (
              <RecInput key={i} aria-label={`Espaços no nível ${i + 1}`} inputMode="numeric" value={String(e)} onChange={(ev) => setR({ ...r, espacos: r.espacos.map((x, j) => (j === i ? Math.max(1, num(ev.target.value)) : x)) })} className="px-1 text-center dv-tabular" />
            ))}
          </div>
        </div>
        <div>
          <RecLabel hint="minutos de Tempo para chegar aos níveis 2 a 6">Custo de aprimorar</RecLabel>
          <div className="mt-1 grid grid-cols-5 gap-1.5">
            {r.aprimorar.map((e, i) => (
              <RecInput key={i} aria-label={`Custo do nível ${i + 2}`} inputMode="numeric" value={String(e)} onChange={(ev) => setR({ ...r, aprimorar: r.aprimorar.map((x, j) => (j === i ? num(ev.target.value) : x)) })} className="px-1 text-center dv-tabular" />
            ))}
          </div>
        </div>
        <Num label="Reserva do pulso" hint="minutos que o jogador precisa manter depois de pagar" value={r.reserva} onChange={(n) => setR({ ...r, reserva: n })} />
        <div className="flex flex-wrap gap-2">
          <RecButton loading={busy} onClick={() => salvar(false)}>
            Salvar como definitivo
          </RecButton>
          <RecButton variant="secondary" loading={busy} onClick={() => salvar(true)}>
            Salvar provisório
          </RecButton>
        </div>
        {msg && <p role="status" className="font-mono text-[12px] text-in-fg-2">{msg}</p>}
      </div>
    </RecordPanel>
  )
}

const CARTAS = [...CARDS].sort((a, b) => RARITY_META[a.rarity].order - RARITY_META[b.rarity].order || a.name.localeCompare(b.name))

function Receitas({ inicial, onSalvo }: { inicial: Receita[]; onSalvo: () => void }) {
  const [lista, setLista] = useState(inicial)
  const [nova, setNova] = useState<Receita>({ id: '', materiais: [], resultado: CARTAS[0].id, minutos: 60, espera: 120, ativa: true })
  const [mat, setMat] = useState(CARTAS[0].id)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => setLista(inicial), [inicial])
  const gravar = async (proxima: Receita[]) => {
    setBusy(true)
    setErro(null)
    try {
      await casaPost({ action: 'receitas.salvar', receitas: proxima })
      playSfx('confirm')
      setLista(proxima)
      onSalvo()
      return true
    } catch (e) {
      setErro((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const idOk = /^[a-z0-9_-]{2,40}$/.test(nova.id) && !lista.some((r) => r.id === nova.id)
  return (
    <RecordPanel title="Receitas" jp="調合" headerRight={<RecTag tone="muted">{lista.length}</RecTag>}>
      <div className="flex flex-col gap-4">
        {lista.length ? (
          <ul className="flex flex-col divide-y divide-in-line">
            {lista.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-3">{r.id}{r.ativa ? '' : ' · desligada'}</p>
                  <p className="font-body text-[15px] text-in-fg">{r.materiais.map(nomeCarta).join(' + ')}</p>
                  <p className="font-body text-[14px] text-in-fg-2">
                    → {nomeCarta(r.resultado)} · {formatMinutos(r.minutos)} · espera {formatMinutos(r.espera)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <RecButton size="sm" variant="secondary" disabled={busy} onClick={() => gravar(lista.map((x) => (x.id === r.id ? { ...x, ativa: !x.ativa } : x)))}>
                    {r.ativa ? 'Desligar' : 'Ligar'}
                  </RecButton>
                  <RecButton size="sm" variant="ghost" disabled={busy} onClick={() => gravar(lista.filter((x) => x.id !== r.id))}>
                    Apagar
                  </RecButton>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine title="Nenhuma receita">Crie a primeira combinação abaixo. Ninguém vê a receita até descobri-la.</EmptyLine>
        )}

        <div className="flex flex-col gap-3 border-t border-in-line pt-4">
          <RecLabel hint="letras minúsculas, números e hífen">Nova receita · identificador</RecLabel>
          <RecInput value={nova.id} onChange={(e) => setNova({ ...nova, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) })} placeholder="dois-peoes" />
          <RecLabel hint="exatamente estas cartas; repita para pedir duas cópias">Materiais</RecLabel>
          <div className="flex gap-2">
            <RecSelect value={mat} onChange={(e) => setMat(e.target.value)} className="min-w-0 flex-1">
              {CARTAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({RARITY_META[c.rarity].label})
                </option>
              ))}
            </RecSelect>
            <RecButton size="sm" variant="secondary" disabled={nova.materiais.length >= 20} onClick={() => setNova({ ...nova, materiais: [...nova.materiais, mat] })}>
              Pôr
            </RecButton>
          </div>
          {nova.materiais.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {nova.materiais.map((m, i) => (
                <button key={i} type="button" onClick={() => setNova({ ...nova, materiais: nova.materiais.filter((_, j) => j !== i) })} className="dv-focus min-h-9 px-2 font-body text-[14px] text-in-fg shadow-[inset_0_0_0_1px_var(--in-line-strong)]" aria-label={`Tirar ${nomeCarta(m)}`}>
                  {nomeCarta(m)} ×
                </button>
              ))}
            </div>
          )}
          <RecLabel>Resultado</RecLabel>
          <RecSelect value={nova.resultado} onChange={(e) => setNova({ ...nova, resultado: e.target.value })}>
            {CARTAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({RARITY_META[c.rarity].label})
              </option>
            ))}
          </RecSelect>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <RecLabel hint="min">Tempo</RecLabel>
              <RecInput inputMode="numeric" value={String(nova.minutos)} onChange={(e) => setNova({ ...nova, minutos: num(e.target.value) })} />
            </label>
            <label className="flex flex-col gap-1">
              <RecLabel hint="min">Espera</RecLabel>
              <RecInput inputMode="numeric" value={String(nova.espera)} onChange={(e) => setNova({ ...nova, espera: num(e.target.value) })} />
            </label>
          </div>
          <RecButton
            disabled={!idOk || nova.materiais.length < 2}
            loading={busy}
            onClick={async () => {
              if (await gravar([...lista, nova])) setNova({ ...nova, id: '', materiais: [] })
            }}
          >
            Criar receita
          </RecButton>
          {erro && <ErrorLine>{erro}</ErrorLine>}
        </div>
      </div>
    </RecordPanel>
  )
}
