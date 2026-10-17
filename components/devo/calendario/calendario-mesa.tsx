'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { HudCode, RecordPanel } from '@/components/devo/kit'
import { playSfx } from '@/lib/devo/audio'
import { RARITIES, RARITY_META } from '@/lib/devo/cards'
import { type CalendarioMesa, dataCurtaFaixa, ENFASE_ROTULO, type Enfase, type EventoBase, type Recompensa, verRecompensa } from '@/lib/devo/calendario'
import type { Rarity } from '@/lib/devo/types'
import { VIRTUDE_KEYS, VIRTUDES } from '@/lib/devo/virtudes'
import { RecButton, RecInput, RecLabel, RecTag, RecTextarea } from '../system/record-ui'
import { ConfirmButton, EmptyLine, ErrorLine, Loading, RecSelect } from '../system/staff-ui'
import { calGet, calPost } from './dados'

const KEY = '/api/calendario?view=mesa'

/** Eventos programados (para a Mesa). */
export function useMesaCalendario(enabled = true) {
  return useSWR<CalendarioMesa>(enabled ? KEY : null, calGet, { revalidateOnFocus: false })
}

type Evento = CalendarioMesa['eventos'][number]

/* Linha de recompensa no formulário (presets do texto do dono + carta por raridade). */
type TipoForm = 'pp' | 'fragmento_arcano' | 'dracma_comum' | 'dracma_incomum' | 'tempo' | 'carta'
type LinhaForm = { tipo: TipoForm; quantidade: string; raridade: Rarity }
const TIPOS: [TipoForm, string][] = [
  ['pp', 'Pontos de Potencial (PP)'],
  ['fragmento_arcano', 'Fragmentos Arcanos'],
  ['dracma_comum', 'Dracmas Comuns'],
  ['dracma_incomum', 'Dracmas Incomuns'],
  ['tempo', 'Tempo (minutos)'],
  ['carta', 'Carta'],
]
// Raridades de jogo (Comum → Lendária, com a Ultra Rara); Única e Promocional não saem em check-in.
const RARIDADES: [Rarity, string][] = RARITIES.map((r) => [r, RARITY_META[r].label])

const paraLinha = (r: Recompensa): LinhaForm =>
  r.tipo === 'pp'
    ? { tipo: 'pp', quantidade: String(r.quantidade), raridade: 'incomum' }
    : r.tipo === 'tempo'
      ? { tipo: 'tempo', quantidade: String(r.minutos), raridade: 'incomum' }
      : r.tipo === 'carta'
        ? { tipo: 'carta', quantidade: '1', raridade: r.raridade }
        : { tipo: (['fragmento_arcano', 'dracma_comum', 'dracma_incomum'].includes(r.item) ? r.item : 'dracma_comum') as TipoForm, quantidade: String(r.quantidade), raridade: 'incomum' }

const paraRecompensa = (l: LinhaForm): Recompensa => {
  const n = Math.max(1, Math.floor(Number(l.quantidade) || 1))
  if (l.tipo === 'pp') return { tipo: 'pp', quantidade: n }
  if (l.tipo === 'tempo') return { tipo: 'tempo', minutos: n }
  if (l.tipo === 'carta') return { tipo: 'carta', raridade: l.raridade }
  return { tipo: 'item', item: l.tipo, quantidade: n }
}

type Form = {
  id: string | null
  titulo: string
  descricao: string
  inicio: string
  fim: string
  anual: boolean
  enfase: Enfase
  arte: string
  comCheckin: boolean
  checkinTitulo: string
  linhas: LinhaForm[]
}

const vazio = (hoje: string): Form => ({ id: null, titulo: '', descricao: '', inicio: hoje, fim: '', anual: false, enfase: 'atencao', arte: '', comCheckin: false, checkinTitulo: '', linhas: [] })
const deEvento = (e: EventoBase): Form => ({
  id: e.id,
  titulo: e.titulo,
  descricao: e.descricao,
  inicio: e.inicio,
  fim: e.fim === e.inicio ? '' : e.fim,
  anual: e.anual,
  enfase: e.enfase,
  arte: e.arte ?? '',
  comCheckin: !!e.checkin,
  checkinTitulo: e.checkin?.titulo ?? '',
  linhas: (e.checkin?.recompensas ?? []).map(paraLinha),
})

/**
 * Mesa do Record › Calendário (Owner/Anfitrião): eventos programados (criar, editar, remover — tudo no admin_log)
 * e o check-in diário. Check-in de evento e regras do diário: só o Owner (o servidor confere de novo).
 */
export function CalendarioMesaPanel() {
  const { data, error, isLoading, mutate } = useMesaCalendario()
  const [form, setForm] = useState<Form | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const act = async (key: string, body: Record<string, unknown>, depois?: () => void) => {
    setBusy(key)
    setErro(null)
    try {
      await calPost(body)
      playSfx('confirm')
      depois?.()
      await mutate()
    } catch (e) {
      playSfx('error')
      setErro((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const salvar = () => {
    if (!form) return
    const body: Record<string, unknown> = {
      action: 'evento.salvar',
      id: form.id,
      titulo: form.titulo,
      descricao: form.descricao,
      inicio: form.inicio,
      fim: form.fim || null,
      anual: form.anual,
      enfase: form.enfase,
      arte: form.arte || null,
    }
    if (data?.podeRecompensas) body.checkin = form.comCheckin && form.linhas.length ? { titulo: form.checkinTitulo || `Check-in: ${form.titulo}`, recompensas: form.linhas.map(paraRecompensa) } : null
    void act('salvar', body, () => setForm(null))
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPanel variant="paper" title="Calendário" jp="暦" ornate headerRight={<HudCode code="DV_CAL" />}>
        <p className="font-body text-[15px] leading-relaxed text-in-fg-2">
          Eventos programados do Grandioso Calendário Devo: os jogadores veem a data, o nome, a descrição, a arte e se é dia de ficar atento ou de folga. Toda mudança fica no registro administrativo.
        </p>
        {data && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-in-fg-2">
            Hoje · {dataCurtaFaixa(data.hoje, data.hoje)} · {data.checkinsHoje} {data.checkinsHoje === 1 ? 'check-in diário' : 'check-ins diários'}
          </p>
        )}
        {erro && (
          <div className="mt-3">
            <ErrorLine>{erro}</ErrorLine>
          </div>
        )}
      </RecordPanel>

      {isLoading ? (
        <Loading>Abrindo o calendário…</Loading>
      ) : error ? (
        <ErrorLine>{(error as Error).message}</ErrorLine>
      ) : data ? (
        <>
          {form ? (
            <EventoForm form={form} setForm={setForm} podeRecompensas={data.podeRecompensas} busy={busy === 'salvar'} onSalvar={salvar} onCancelar={() => setForm(null)} />
          ) : (
            <RecButton block onClick={() => setForm(vazio(data.hoje))}>
              Novo evento
            </RecButton>
          )}

          <RecordPanel title="Eventos programados" jp="予定" headerRight={<RecTag tone="muted">{data.eventos.length}</RecTag>}>
            {data.eventos.length ? (
              <ul className="flex flex-col">
                {data.eventos.map((e) => (
                  <EventoLinha
                    key={e.id}
                    e={e}
                    podeRecompensas={data.podeRecompensas}
                    busy={busy}
                    onEditar={() => setForm(deEvento(e))}
                    onRemover={() => act(`rm:${e.id}`, { action: 'evento.remover', id: e.id })}
                  />
                ))}
              </ul>
            ) : (
              <EmptyLine title="Calendário vazio">Crie o primeiro evento acima.</EmptyLine>
            )}
          </RecordPanel>

          <CheckinDiarioMesa data={data} busy={busy === 'regras'} onSalvar={(b) => act('regras', { action: 'regras', ...b })} />
        </>
      ) : null}
    </div>
  )
}

function EventoLinha({ e, podeRecompensas, busy, onEditar, onRemover }: { e: Evento; podeRecompensas: boolean; busy: string | null; onEditar: () => void; onRemover: () => void }) {
  const travado = !!e.checkin && !podeRecompensas
  return (
    <li aria-label={`Evento ${e.titulo}`} className="border-b border-in-line py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <RecTag tone={e.enfase === 'atencao' ? 'accent' : 'line'}>{ENFASE_ROTULO[e.enfase]}</RecTag>
        {e.anual && <RecTag tone="muted">Todo ano</RecTag>}
        {e.checkin && <RecTag tone="solid">Check-in · {e.checkin.recompensas.length}</RecTag>}
      </div>
      <p className="mt-1.5 break-words font-serif text-[19px] font-light uppercase leading-tight tracking-[0.03em] text-in-fg">{e.titulo}</p>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-in-fg-2">
        {dataCurtaFaixa(e.inicio, e.fim)} {e.inicio.slice(0, 4)}
        {e.autor ? ` · por ${e.autor}` : ''}
      </p>
      {e.descricao && <p className="mt-1 font-body text-[14.5px] leading-snug text-in-fg-2">{e.descricao}</p>}
      {e.checkin && (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-in-fg-2">
          {e.checkin.titulo}: {e.checkin.recompensas.map((r) => verRecompensa(r).rotulo).join(' · ')}
        </p>
      )}
      {travado ? (
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">Com check-in próprio · só o Owner edita</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <RecButton size="sm" variant="secondary" onClick={onEditar}>
            Editar
          </RecButton>
          <ConfirmButton size="sm" variant="secondary" surface="dark" confirmLabel="Remover evento" loading={busy === `rm:${e.id}`} onConfirm={onRemover}>
            Remover
          </ConfirmButton>
        </div>
      )}
    </li>
  )
}

function EventoForm({
  form,
  setForm,
  podeRecompensas,
  busy,
  onSalvar,
  onCancelar,
}: {
  form: Form
  setForm: (f: Form) => void
  podeRecompensas: boolean
  busy: boolean
  onSalvar: () => void
  onCancelar: () => void
}) {
  const set = (p: Partial<Form>) => setForm({ ...form, ...p })
  const setLinha = (i: number, p: Partial<LinhaForm>) => set({ linhas: form.linhas.map((l, k) => (k === i ? { ...l, ...p } : l)) })
  return (
    <RecordPanel title={form.id ? 'Editar evento' : 'Novo evento'} jp="編集">
      <form
        aria-label={form.id ? 'Editar evento' : 'Novo evento'}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSalvar()
        }}
      >
        <label className="flex flex-col gap-1.5">
          <RecLabel hint={`${form.titulo.length}/60`}>Nome</RecLabel>
          <RecInput required minLength={2} maxLength={60} value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Ex.: Natal" />
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel hint={`${form.descricao.length}/240`}>Descrição curta</RecLabel>
          <RecTextarea rows={2} maxLength={240} value={form.descricao} onChange={(e) => set({ descricao: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex min-w-0 flex-col gap-1.5">
            <RecLabel>Início</RecLabel>
            <RecInput type="date" required value={form.inicio} onChange={(e) => set({ inicio: e.target.value })} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <RecLabel hint="opcional">Fim</RecLabel>
            <RecInput type="date" min={form.inicio} value={form.fim} onChange={(e) => set({ fim: e.target.value })} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <RecLabel>Destaque</RecLabel>
          <RecSelect value={form.enfase} onChange={(e) => set({ enfase: e.target.value as Enfase })}>
            <option value="atencao">{ENFASE_ROTULO.atencao}</option>
            <option value="folga">{ENFASE_ROTULO.folga}</option>
            <option value="normal">{ENFASE_ROTULO.normal}</option>
          </RecSelect>
        </label>
        <label className="flex min-h-11 items-center gap-3 font-body text-[15px] text-in-fg">
          <input type="checkbox" checked={form.anual} onChange={(e) => set({ anual: e.target.checked })} className="size-5 accent-[var(--dv-wine)]" />
          Repete todo ano neste dia
        </label>
        <label className="flex flex-col gap-1.5">
          <RecLabel hint="/images/… ou https://">Arte</RecLabel>
          <RecInput value={form.arte} onChange={(e) => set({ arte: e.target.value })} placeholder="Sem arte: placa ornamental com a data" />
        </label>

        {podeRecompensas ? (
          <fieldset className="flex flex-col gap-3 border-t border-in-line pt-4">
            <legend className="sr-only">Check-in do evento</legend>
            <label className="flex min-h-11 items-center gap-3 font-body text-[15px] text-in-fg">
              <input
                type="checkbox"
                checked={form.comCheckin}
                onChange={(e) => set({ comCheckin: e.target.checked, linhas: e.target.checked && !form.linhas.length ? [{ tipo: 'pp', quantidade: '50', raridade: 'incomum' }] : form.linhas })}
                className="size-5 accent-[var(--dv-wine)]"
              />
              Check-in próprio nestas datas
            </label>
            {form.comCheckin && (
              <>
                <label className="flex flex-col gap-1.5">
                  <RecLabel>Título do check-in</RecLabel>
                  <RecInput maxLength={60} value={form.checkinTitulo} onChange={(e) => set({ checkinTitulo: e.target.value })} placeholder={`Check-in: ${form.titulo || 'evento'}`} />
                </label>
                <p className="font-body text-[14px] leading-snug text-in-fg-2">Um resgate por dia do evento; o 1º resgate entrega a 1ª recompensa, o 2º a 2ª… Quando a lista acaba, o check-in do evento fica completo.</p>
                <ol className="flex flex-col gap-3">
                  {form.linhas.map((l, i) => (
                    <li key={i} aria-label={`Recompensa ${i + 1}`} className="grid grid-cols-[1fr_88px] items-end gap-2">
                      <label className="flex min-w-0 flex-col gap-1">
                        <RecLabel>{`Resgate ${i + 1}`}</RecLabel>
                        <RecSelect value={l.tipo} onChange={(e) => setLinha(i, { tipo: e.target.value as TipoForm })}>
                          {TIPOS.map(([v, t]) => (
                            <option key={v} value={v}>
                              {t}
                            </option>
                          ))}
                        </RecSelect>
                      </label>
                      {l.tipo === 'carta' ? (
                        <label className="flex flex-col gap-1">
                          <RecLabel>Raridade</RecLabel>
                          <RecSelect value={l.raridade} onChange={(e) => setLinha(i, { raridade: e.target.value as Rarity })}>
                            {RARIDADES.map(([v, t]) => (
                              <option key={v} value={v}>
                                {t}
                              </option>
                            ))}
                          </RecSelect>
                        </label>
                      ) : (
                        <label className="flex flex-col gap-1">
                          <RecLabel>Qtd.</RecLabel>
                          <RecInput type="number" inputMode="numeric" min={1} value={l.quantidade} onChange={(e) => setLinha(i, { quantidade: e.target.value })} />
                        </label>
                      )}
                      <button type="button" onClick={() => set({ linhas: form.linhas.filter((_, k) => k !== i) })} className="dv-focus col-span-2 justify-self-start font-mono text-[10.5px] uppercase tracking-[0.14em] text-in-fg-2 underline-offset-4 hover:underline">
                        Tirar resgate {i + 1}
                      </button>
                    </li>
                  ))}
                </ol>
                {form.linhas.length < 10 && (
                  <RecButton size="sm" variant="secondary" onClick={() => set({ linhas: [...form.linhas, { tipo: 'dracma_comum', quantidade: '1', raridade: 'incomum' }] })}>
                    Mais uma recompensa
                  </RecButton>
                )}
              </>
            )}
          </fieldset>
        ) : (
          <p className="border-t border-in-line pt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-3">Check-in de evento: só o Owner define</p>
        )}

        <div className="flex flex-wrap gap-2">
          <RecButton type="submit" loading={busy}>
            {form.id ? 'Salvar evento' : 'Criar evento'}
          </RecButton>
          <RecButton variant="ghost" sfx="close" onClick={onCancelar}>
            Cancelar
          </RecButton>
        </div>
      </form>
    </RecordPanel>
  )
}

function CheckinDiarioMesa({ data, busy, onSalvar }: { data: CalendarioMesa; busy: boolean; onSalvar: (b: Record<string, unknown>) => void }) {
  const [r, setR] = useState(data.regras)
  const mudou = r.falta !== data.regras.falta || r.ppVirtude !== data.regras.ppVirtude || r.ppVirtudePadrao !== data.regras.ppVirtudePadrao
  return (
    <RecordPanel title="Check-in diário" jp="出席" headerRight={data.regras.provisorio ? <RecTag tone="accent">Regras provisórias</RecTag> : undefined}>
      <ol aria-label="Ciclo de 7 dias" className="flex flex-col">
        {data.ciclo.map((c, i) => (
          <li key={i} className="flex min-h-10 items-baseline justify-between gap-3 border-b border-in-line py-2 last:border-b-0">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-in-fg-2">Dia {String(i + 1).padStart(2, '0')}</span>
            <span className="text-right font-body text-[15px] text-in-fg">{c.rotulo}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 font-body text-[13.5px] leading-snug text-in-fg-3">Valores do texto do dono. Para mudar: Ajustes › calendario.checkin.ciclo.</p>
      {data.podeRecompensas ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-in-line pt-4">
          <label className="flex flex-col gap-1.5">
            <RecLabel>Se o jogador faltar um dia</RecLabel>
            <RecSelect value={r.falta} onChange={(e) => setR({ ...r, falta: e.target.value as 'pausa' | 'reinicia' })}>
              <option value="pausa">Pausa: continua de onde parou</option>
              <option value="reinicia">Reinicia: volta ao Dia 1</option>
            </RecSelect>
          </label>
          <label className="flex flex-col gap-1.5">
            <RecLabel>PP vão para</RecLabel>
            <RecSelect value={r.ppVirtude} onChange={(e) => setR({ ...r, ppVirtude: e.target.value })}>
              <option value="arcano">Virtude Excelente do Arcano do jogador</option>
              {VIRTUDE_KEYS.map((v) => (
                <option key={v} value={v}>
                  Sempre {VIRTUDES[v].nome}
                </option>
              ))}
            </RecSelect>
          </label>
          {r.ppVirtude === 'arcano' && (
            <label className="flex flex-col gap-1.5">
              <RecLabel>Sem Arcano registrado</RecLabel>
              <RecSelect value={r.ppVirtudePadrao} onChange={(e) => setR({ ...r, ppVirtudePadrao: e.target.value })}>
                {VIRTUDE_KEYS.map((v) => (
                  <option key={v} value={v}>
                    {VIRTUDES[v].nome}
                  </option>
                ))}
              </RecSelect>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <RecButton size="sm" loading={busy} disabled={!mudou && !data.regras.provisorio} onClick={() => onSalvar({ falta: r.falta, ppVirtude: r.ppVirtude, ppVirtudePadrao: r.ppVirtudePadrao, provisorio: false })}>
              Confirmar regras
            </RecButton>
          </div>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-in-fg-2">
          Falta: {data.regras.falta === 'pausa' ? 'pausa o ciclo' : 'reinicia o ciclo'} · PP: {data.regras.ppVirtude === 'arcano' ? 'Virtude do Arcano' : data.regras.ppVirtude}
        </p>
      )}
    </RecordPanel>
  )
}
