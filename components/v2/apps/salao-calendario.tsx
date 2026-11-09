'use client'

import { useMemo, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { diaBrasilia, edicaoN, EVENTO_ROTULO, formatDataHora, type SalaoCalendarioCfg, type SalaoEvento, type SalaoLiberado } from '@/lib/devo/salao'
import { erroTexto, px } from '../comum'
import { type Agir, ed, Erro, Folha } from './salao-pecas'

/**
 * Calendário Devo dentro do Salão (protótipo kit3/os-salao.js › calendario): o mês com as aberturas do Salão e os
 * eventos quinzenais, especiais e de teatro, a agenda e, para o Owner, os ajustes do calendário (âncora, intervalo,
 * duração, abertura manual; POST /api/staff config.definir 'salao.calendario') e dos eventos ('evento.salvar' e
 * 'evento.remover' em /api/salao). Horário de Brasília.
 */

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type Item = { id: string; tipo: 'edicao' | SalaoEvento['tipo']; titulo: string; inicio: number; fim: number; evento?: SalaoEvento }

/** ms → "2026-10-15T20:00" (campo datetime-local em Brasília). */
function paraCampo(ms: number) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .format(ms)
    .replace(' ', 'T')
}
const deCampo = (v: string) => (v ? `${v}:00-03:00` : '')

/** Grava o calendário do Salão (mesma chamada do Calendário Devo antigo). */
export async function salvarCalendario(value: SalaoCalendarioCfg) {
  const r = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'config.definir', key: 'salao.calendario', value, provisional: true }),
  })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'Não foi possível salvar.')
}

export function CalendarioFolha({ jan, d, agir, recarregar, onVolta }: { jan: Element | null; d: SalaoLiberado; agir: Agir; recarregar: () => void; onVolta: () => void }) {
  const hoje = diaBrasilia(d.agora)
  const [a0, m0] = hoje.split('-').map(Number)
  const [mes, setMes] = useState({ ano: a0, mes: m0 - 1 })
  const [sel, setSel] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const itens = useMemo<Item[]>(() => {
    const out: Item[] = []
    const base = d.relogio.corrente
    const iv = d.relogio.proxima.inicio - base.inicio
    for (let k = -2; k <= 14; k++) {
      const inicio = base.inicio + k * iv
      out.push({ id: `ed-${base.n + k}`, tipo: 'edicao', titulo: `Abertura do Salão · Edição ${ed(base.n + k)}`, inicio, fim: inicio + (base.fim - base.inicio) })
    }
    for (const e of d.eventos) out.push({ id: e.id, tipo: e.tipo, titulo: e.titulo, inicio: e.inicio, fim: e.fim, evento: e })
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

  const off = new Date(Date.UTC(mes.ano, mes.mes, 1)).getUTCDay()
  const dias = new Date(Date.UTC(mes.ano, mes.mes + 1, 0)).getUTCDate()
  const chave = (dia: number) => `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const lista = sel ? (porDia.get(sel) ?? []) : itens.filter((i) => i.fim > d.agora).slice(0, 8)
  const anda = (n: number) => {
    playSfx('click')
    setSel(null)
    setMes((m) => {
      const t = m.ano * 12 + m.mes + n
      return { ano: Math.floor(t / 12), mes: t % 12 }
    })
  }
  const remover = async (id: string) => {
    setErro(null)
    try {
      await agir({ action: 'evento.remover', id })
      playSfx('confirm')
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    }
  }

  return (
    <Folha jan={jan} sub="Salão das Máscaras" tit="Calendário Devo" onVolta={onVolta}>
      <div className="s-corpo">
        <p className="r-sub">Aberturas do Salão e eventos quinzenais e especiais. Horário de Brasília.</p>
        <div className="k-mes">
          <button type="button" className="m-volta chanfro" aria-label="Mês anterior" onClick={() => anda(-1)}>
            ‹
          </button>
          <strong>
            {MESES[mes.mes]} <span>{mes.ano}</span>
          </strong>
          <button type="button" className="m-volta chanfro" aria-label="Próximo mês" onClick={() => anda(1)}>
            ›
          </button>
        </div>
        <div className="k-semana" aria-hidden="true">
          {SEMANA.map((x, i) => (
            <span key={i}>{x}</span>
          ))}
        </div>
        <div className="k-grade s-grade-c">
          {Array.from({ length: off }, (_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: dias }, (_, i) => {
            const dia = i + 1
            const k = chave(dia)
            const l = porDia.get(k) ?? []
            const temEd = l.some((x) => x.tipo === 'edicao')
            const temEv = l.some((x) => x.tipo !== 'edicao')
            return (
              <button
                key={k}
                type="button"
                className={['k-d', k === hoje && 'hoje', (temEd || temEv) && 'ev', sel === k && 'sel'].filter(Boolean).join(' ')}
                aria-label={`${dia} de ${MESES[mes.mes]}${temEd ? ', abertura do Salão' : ''}${temEv ? ', evento' : ''}`}
                aria-pressed={sel === k}
                onClick={() => {
                  playSfx('click')
                  setSel(sel === k ? null : k)
                }}
              >
                {dia}
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {temEd && <img src={px('salao')} alt="" />}
                  {temEv && <u />}
                </span>
              </button>
            )
          })}
        </div>
        <p className="s-leg">
          <span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={px('salao')} alt="" />
            Abertura
          </span>
          <span>
            <u />
            Evento
          </span>
        </p>
        <h4>{sel ? 'Neste dia' : 'Próximas datas'}</h4>
        {lista.length ? (
          <ul className="s-agenda">
            {lista.map((it) => {
              const e = it.evento
              return (
                <li key={it.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={px(it.tipo === 'edicao' ? 'salao' : 'calendario')} alt="" />
                  <div>
                    {e && (
                      <>
                        <span className="s-sel lid">{EVENTO_ROTULO[e.tipo]}</span>
                        {e.provisorio && (
                          <>
                            {' '}
                            <span className="s-sel seu">Provisório</span>
                          </>
                        )}
                      </>
                    )}
                    <strong>{it.titulo}</strong>
                    <small>{formatDataHora(it.inicio)}</small>
                    {e?.descricao ? <p className="r-sub">{e.descricao}</p> : null}
                    {e?.destaques.length ? <p className="s-dest">{e.destaques.join(' · ')}</p> : null}
                    {d.owner && e && (
                      <button type="button" className="r-link s-esq-link" onClick={() => void remover(e.id)}>
                        Remover evento
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="r-sub">Nada marcado.</p>
        )}
        <Erro>{erro}</Erro>
        {d.owner && <AjustesOwner cfg={d.owner.calendario} provisorio={d.owner.provisorio} agir={agir} recarregar={recarregar} />}
      </div>
    </Folha>
  )
}

function AjustesOwner({ cfg, provisorio, agir, recarregar }: { cfg: SalaoCalendarioCfg; provisorio: boolean; agir: Agir; recarregar: () => void }) {
  const [ancora, setAncora] = useState(() => paraCampo(edicaoN(cfg, 0).inicio))
  const [intervalo, setIntervalo] = useState(String(cfg.intervalo_dias))
  const [duracao, setDuracao] = useState(String(cfg.duracao_horas))
  const [forcar, setForcar] = useState<string>(cfg.forcar ?? '')
  const [ev, setEv] = useState({ titulo: '', tipo: 'especial', inicio: '', fim: '', destaques: '' })
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const salvaCal = async () => {
    setErro(null)
    setOk(null)
    const i = Number(intervalo)
    const du = Number(duracao)
    if (!ancora || !Number.isFinite(Date.parse(deCampo(ancora))) || !(i >= 1 && i <= 60) || !(du >= 1)) {
      setErro('Confira a âncora, o intervalo e a duração.')
      return
    }
    setOcupado('cal')
    try {
      await salvarCalendario({ ancora: deCampo(ancora), intervalo_dias: i, duracao_horas: du, forcar: forcar === 'aberto' || forcar === 'fechado' ? forcar : null })
      playSfx('confirm')
      setOk('Calendário salvo.')
      recarregar()
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    } finally {
      setOcupado(null)
    }
  }
  const salvaEv = async () => {
    setErro(null)
    setOk(null)
    if (ev.fim && Date.parse(deCampo(ev.fim)) <= Date.parse(deCampo(ev.inicio))) {
      setErro('O fim precisa ser depois do início.')
      return
    }
    setOcupado('ev')
    try {
      await agir({
        action: 'evento.salvar',
        titulo: ev.titulo,
        tipo: ev.tipo,
        inicio: deCampo(ev.inicio),
        fim: ev.fim ? deCampo(ev.fim) : null,
        destaques: ev.destaques
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        provisorio: true,
      })
      playSfx('confirm')
      setEv({ titulo: '', tipo: 'especial', inicio: '', fim: '', destaques: '' })
      setOk('Evento salvo.')
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e))
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section className="s-ajustes" aria-label="Calendário do Owner">
      <div className="s-lin">
        <h4>Ajustes do Owner</h4>
        {provisorio && <span className="s-sel seu">Provisório</span>}
      </div>
      <div className="s-form">
        <label className="l2">
          Primeira abertura (âncora)
          <input type="datetime-local" value={ancora} onChange={(e) => setAncora(e.target.value)} />
        </label>
        <label>
          A cada (dias)
          <input type="number" min={1} max={60} value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
        </label>
        <label>
          Aberto por (horas)
          <input type="number" min={1} max={720} value={duracao} onChange={(e) => setDuracao(e.target.value)} />
        </label>
        <label className="l2">
          Abertura manual
          <select value={forcar} onChange={(e) => setForcar(e.target.value)}>
            <option value="">Seguir o calendário</option>
            <option value="aberto">Abrir agora</option>
            <option value="fechado">Fechar agora (encerra a edição)</option>
          </select>
        </label>
      </div>
      <button type="button" className="r-bt chanfro s-larga" disabled={ocupado !== null} aria-busy={ocupado === 'cal'} onClick={salvaCal}>
        Salvar calendário
      </button>
      <div className="s-form">
        <label className="l2">
          Novo evento
          <input placeholder="Título" value={ev.titulo} onChange={(e) => setEv({ ...ev, titulo: e.target.value })} />
        </label>
        <label>
          Tipo
          <select value={ev.tipo} onChange={(e) => setEv({ ...ev, tipo: e.target.value })}>
            <option value="especial">Especial</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="teatro">Teatro</option>
          </select>
        </label>
        <label>
          Destaques
          <input placeholder="separados por vírgula" value={ev.destaques} onChange={(e) => setEv({ ...ev, destaques: e.target.value })} />
        </label>
        <label>
          Início
          <input type="datetime-local" value={ev.inicio} onChange={(e) => setEv({ ...ev, inicio: e.target.value })} />
        </label>
        <label>
          Fim
          <input type="datetime-local" value={ev.fim} onChange={(e) => setEv({ ...ev, fim: e.target.value })} />
        </label>
      </div>
      <button
        type="button"
        className="r-bt chanfro s-larga"
        disabled={ocupado !== null || ev.titulo.trim().length < 3 || !ev.inicio}
        aria-busy={ocupado === 'ev'}
        onClick={salvaEv}
      >
        Adicionar evento
      </button>
      {ok && (
        <p className="s-ok" role="status">
          {ok}
        </p>
      )}
      <Erro>{erro}</Erro>
    </section>
  )
}
