'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import {
  diaBrasilia,
  edicaoN,
  EVENTO_ROTULO,
  formatDataHora,
  type SalaoCalendarioCfg,
  type SalaoEvento,
  type SalaoLiberado,
} from '@/lib/devo/salao'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'
import { EmblemMascaras } from '../kit/emblems'
import { GlyphSpark as GlyphStar } from '../kit/glyphs'
import { Sheet } from '../kit/sheet'
import { Erro, Selo } from './salao-ui'

type Agir = (body: Record<string, unknown>) => Promise<unknown>

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type Item = { id: string; tipo: 'edicao' | SalaoEvento['tipo']; titulo: string; inicio: number; fim: number; descricao?: string; destaques?: string[]; provisorio?: boolean; evento?: SalaoEvento }

/**
 * Calendário Devo (acessível pelo Salão): mês em grade com as aberturas do Salão (máscara) e os eventos quinzenais
 * e especiais (estrela), e a agenda dos próximos. Datas em horário de Brasília. O Owner edita o calendário do
 * Salão (âncora, intervalo, duração, abertura manual) e os eventos; valores provisórios ficam marcados.
 */
export function CalendarioDevo({ open, onClose, d, agir, onConfig }: { open: boolean; onClose: () => void; d: SalaoLiberado; agir: Agir; onConfig: () => void }) {
  const hoje = diaBrasilia(d.agora)
  const [ano0, mes0] = hoje.split('-').map(Number)
  const [mes, setMes] = useState({ ano: ano0, mes: mes0 - 1 })

  const itens = useMemo<Item[]>(() => {
    const out: Item[] = []
    // Aberturas: a corrente e as próximas 12 (o servidor manda o relógio; a série sai da âncora).
    const base = d.relogio.corrente
    const intervalo = d.relogio.proxima.inicio - base.inicio
    for (let k = -2; k <= 14; k++) {
      const inicio = base.inicio + k * intervalo
      const fim = inicio + (base.fim - base.inicio)
      out.push({ id: `ed-${base.n + k}`, tipo: 'edicao', titulo: `Abertura do Salão · Edição ${String(base.n + k + 1).padStart(2, '0')}`, inicio, fim })
    }
    for (const e of d.eventos) out.push({ id: e.id, tipo: e.tipo, titulo: e.titulo, inicio: e.inicio, fim: e.fim, descricao: e.descricao, destaques: e.destaques, provisorio: e.provisorio, evento: e })
    return out.sort((a, b) => a.inicio - b.inicio)
  }, [d])

  const porDia = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const it of itens) {
      const k = diaBrasilia(it.inicio)
      m.set(k, [...(m.get(k) ?? []), it])
    }
    return m
  }, [itens])

  const primeiro = new Date(Date.UTC(mes.ano, mes.mes, 1))
  const dias = new Date(Date.UTC(mes.ano, mes.mes + 1, 0)).getUTCDate()
  const offset = primeiro.getUTCDay()
  const celulas = Array.from({ length: Math.ceil((offset + dias) / 7) * 7 }, (_, i) => {
    const dia = i - offset + 1
    return dia >= 1 && dia <= dias ? dia : null
  })
  const chave = (dia: number) => `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const [sel, setSel] = useState<string | null>(null)
  const proximos = itens.filter((it) => it.fim > d.agora).slice(0, 8)
  const lista = sel ? (porDia.get(sel) ?? []) : proximos

  const mover = (delta: number) => {
    playSfx('click')
    setSel(null)
    setMes((m) => {
      const t = m.mes + delta
      return { ano: m.ano + Math.floor(t / 12), mes: ((t % 12) + 12) % 12 }
    })
  }

  return (
    <Sheet open={open} onClose={onClose} kicker="Salão das Máscaras" title="Calendário Devo" description="Aberturas do Salão e eventos quinzenais e especiais. Horário de Brasília." size="lg">
      <div className="flex flex-col gap-5">
        <section aria-label={`${MESES[mes.mes]} de ${mes.ano}`}>
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Mês anterior" onClick={() => mover(-1)} className="dv-focus grid size-11 place-items-center text-dv-text-2 hover:text-dv-text">
              <ChevronLeft className="size-5" strokeWidth={1.4} />
            </button>
            <p className="font-display text-[18px] font-semibold uppercase tracking-[0.16em] text-dv-text">
              {MESES[mes.mes]} <span className="font-impact text-dv-gold">{mes.ano}</span>
            </p>
            <button type="button" aria-label="Próximo mês" onClick={() => mover(1)} className="dv-focus grid size-11 place-items-center text-dv-text-2 hover:text-dv-text">
              <ChevronRight className="size-5" strokeWidth={1.4} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {SEMANA.map((s, i) => (
              <span key={i} className="pb-1 text-center font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">
                {s}
              </span>
            ))}
            {celulas.map((dia, i) => {
              if (!dia) return <span key={i} />
              const k = chave(dia)
              const its = porDia.get(k) ?? []
              const ed = its.some((x) => x.tipo === 'edicao')
              const ev = its.some((x) => x.tipo !== 'edicao')
              const eHoje = k === hoje
              const ativo = sel === k
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${dia} de ${MESES[mes.mes]}${ed ? ', abertura do Salão' : ''}${ev ? ', evento' : ''}`}
                  aria-pressed={ativo}
                  onClick={() => {
                    playSfx('click')
                    setSel(ativo ? null : k)
                  }}
                  className={cn(
                    'dv-focus relative flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 transition-colors',
                    ativo ? 'bg-[#1d1a2b] shadow-[inset_0_0_0_1px_rgba(138,124,200,0.8)]' : ed || ev ? 'bg-white/[0.04] shadow-[inset_0_0_0_1px_var(--dv-line)]' : 'hover:bg-white/[0.03]',
                  )}
                >
                  <span className={cn('font-impact text-[17px] leading-none dv-tabular', eHoje ? 'text-dv-gold-bright' : ed || ev ? 'text-dv-text' : 'text-dv-text-3')}>{dia}</span>
                  <span className="flex h-3 items-center gap-0.5">
                    {ed && <EmblemMascaras className="size-3 text-dv-gold" />}
                    {ev && <GlyphStar className="size-2.5 text-dv-amethyst-text" />}
                  </span>
                  {eHoje && <span aria-hidden="true" className="absolute inset-x-2 bottom-0.5 h-[2px] bg-dv-gold" />}
                </button>
              )
            })}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-2">
            <span className="flex items-center gap-1.5">
              <EmblemMascaras className="size-3.5 text-dv-gold" /> Abertura
            </span>
            <span className="flex items-center gap-1.5">
              <GlyphStar className="size-3 text-dv-amethyst-text" /> Evento
            </span>
          </p>
        </section>

        <section aria-label={sel ? 'Agenda do dia' : 'Próximas datas'} className="flex flex-col gap-2">
          <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-dv-text">{sel ? 'Neste dia' : 'Próximas datas'}</h3>
          {lista.length ? (
            <ul className="flex flex-col">
              {lista.map((it) => (
                <AgendaLinha key={it.id} it={it} owner={!!d.owner} agir={agir} />
              ))}
            </ul>
          ) : (
            <p className="font-body text-[15px] text-dv-text-2">Nada marcado.</p>
          )}
        </section>

        {d.owner && <OwnerCalendario cfg={d.owner.calendario} provisorio={d.owner.provisorio} agir={agir} onConfig={onConfig} />}
      </div>
    </Sheet>
  )
}

function AgendaLinha({ it, owner, agir }: { it: Item; owner: boolean; agir: Agir }) {
  const [ocupado, setOcupado] = useState(false)
  const ed = it.tipo === 'edicao'
  return (
    <li className="flex gap-3 border-b border-dv-line py-3 last:border-b-0">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center">
        {ed ? <EmblemMascaras metal className="size-7" /> : <GlyphStar className="size-4 text-dv-amethyst-text" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {!ed && <Selo tom="ametista">{EVENTO_ROTULO[it.tipo as SalaoEvento['tipo']]}</Selo>}
          {it.provisorio && <Selo tom="quieto">Provisório</Selo>}
        </div>
        <p className="mt-1 font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-dv-text">{it.titulo}</p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-2">{formatDataHora(it.inicio)}</p>
        {it.descricao && <p className="mt-1.5 font-body text-[14.5px] leading-relaxed text-dv-text-2">{it.descricao}</p>}
        {!!it.destaques?.length && <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-gold">{it.destaques.join(' · ')}</p>}
        {owner && it.evento && (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mt-1"
            loading={ocupado}
            onClick={async () => {
              setOcupado(true)
              try {
                await agir({ action: 'evento.remover', id: it.evento!.id })
              } finally {
                setOcupado(false)
              }
            }}
          >
            Remover evento
          </Button>
        )}
      </div>
    </li>
  )
}

/** "2026-10-15T20:00:00-03:00" → "2026-10-15T20:00" (campo datetime-local em Brasília). */
function paraCampo(ms: number) {
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(ms)
  return s.replace(' ', 'T')
}
const deCampo = (v: string) => (v ? `${v}:00-03:00` : '')

function OwnerCalendario({ cfg, provisorio, agir, onConfig }: { cfg: SalaoCalendarioCfg; provisorio: boolean; agir: Agir; onConfig: () => void }) {
  const [ancora, setAncora] = useState(paraCampo(edicaoN(cfg, 0).inicio))
  const [intervalo, setIntervalo] = useState(cfg.intervalo_dias)
  const [duracao, setDuracao] = useState(cfg.duracao_horas)
  const [forcar, setForcar] = useState<string>(cfg.forcar ?? '')
  const [ev, setEv] = useState({ titulo: '', tipo: 'especial', inicio: '', fim: '', destaques: '' })
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const campo = 'h-11 w-full bg-black/40 px-3 font-body text-[15px] text-dv-text outline-none shadow-[inset_0_0_0_1px_var(--dv-line-strong)] focus:shadow-[inset_0_0_0_1px_#bab09f] [color-scheme:dark]'
  const rot = 'dv-label mb-1.5 block text-[10px] tracking-[0.18em] text-dv-text-2'

  const salvarCal = async () => {
    setOcupado('cal')
    setErro(null)
    setOk(null)
    try {
      const r = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'config.definir',
          key: 'salao.calendario',
          value: { ancora: deCampo(ancora), intervalo_dias: Number(intervalo), duracao_horas: Number(duracao), forcar: forcar || null },
          provisional: true,
        }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível salvar.')
      playSfx('confirm')
      setOk('Calendário salvo.')
      onConfig()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  const salvarEvento = async () => {
    setOcupado('ev')
    setErro(null)
    setOk(null)
    try {
      await agir({
        action: 'evento.salvar',
        titulo: ev.titulo,
        tipo: ev.tipo,
        inicio: deCampo(ev.inicio),
        fim: ev.fim ? deCampo(ev.fim) : null,
        destaques: ev.destaques.split(',').map((x) => x.trim()).filter(Boolean),
        provisorio: true,
      })
      playSfx('confirm')
      setEv({ titulo: '', tipo: 'especial', inicio: '', fim: '', destaques: '' })
      setOk('Evento salvo.')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section aria-label="Calendário do Owner" className="flex flex-col gap-4 border-t border-dv-line-strong pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-dv-text">Ajustes do Owner</h3>
        {provisorio && <Selo tom="quieto">Provisório</Selo>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className={rot}>Primeira abertura (âncora)</span>
          <input type="datetime-local" value={ancora} onChange={(e) => setAncora(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className={rot}>A cada (dias)</span>
          <input type="number" min={1} max={60} value={intervalo} onChange={(e) => setIntervalo(Number(e.target.value))} className={campo} />
        </label>
        <label className="block">
          <span className={rot}>Aberto por (horas)</span>
          <input type="number" min={1} max={720} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} className={campo} />
        </label>
        <label className="col-span-2 block">
          <span className={rot}>Abertura manual</span>
          <select value={forcar} onChange={(e) => setForcar(e.target.value)} className={campo}>
            <option value="">Seguir o calendário</option>
            <option value="aberto">Abrir agora</option>
            <option value="fechado">Fechar agora (encerra a edição)</option>
          </select>
        </label>
      </div>
      <Button variant="secondary" size="sm" loading={ocupado === 'cal'} onClick={salvarCal}>
        Salvar calendário
      </Button>

      <div className="grid grid-cols-2 gap-3 border-t border-dv-line pt-4">
        <label className="col-span-2 block">
          <span className={rot}>Novo evento</span>
          <input value={ev.titulo} onChange={(e) => setEv({ ...ev, titulo: e.target.value })} placeholder="Título" className={campo} />
        </label>
        <label className="block">
          <span className={rot}>Tipo</span>
          <select value={ev.tipo} onChange={(e) => setEv({ ...ev, tipo: e.target.value })} className={campo}>
            <option value="especial">Especial</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="teatro">Teatro</option>
          </select>
        </label>
        <label className="block">
          <span className={rot}>Destaques</span>
          <input value={ev.destaques} onChange={(e) => setEv({ ...ev, destaques: e.target.value })} placeholder="separados por vírgula" className={campo} />
        </label>
        <label className="block">
          <span className={rot}>Início</span>
          <input type="datetime-local" value={ev.inicio} onChange={(e) => setEv({ ...ev, inicio: e.target.value })} className={campo} />
        </label>
        <label className="block">
          <span className={rot}>Fim</span>
          <input type="datetime-local" value={ev.fim} onChange={(e) => setEv({ ...ev, fim: e.target.value })} className={campo} />
        </label>
      </div>
      <Button variant="secondary" size="sm" loading={ocupado === 'ev'} disabled={ev.titulo.trim().length < 3 || !ev.inicio} onClick={salvarEvento}>
        Adicionar evento
      </Button>
      {ok && (
        <p role="status" className="font-mono text-[11px] uppercase tracking-[0.12em] text-dv-amethyst-text">
          {ok}
        </p>
      )}
      {erro && <Erro>{erro}</Erro>}
    </section>
  )
}
