'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import {
  type CalendarioPayload,
  type CheckinSlot,
  dataCurtaFaixa,
  dataLonga,
  type Dia,
  diaDaSemana,
  ENFASE_ROTULO,
  type EventoVista,
  type IconeRecompensa,
  mesCurto,
  nomeMes,
  partes,
  type ResgateResultado,
  SEMANA_CURTA,
  somaDias,
} from '@/lib/devo/calendario'
import type { InventoryItem } from '@/lib/devo/progresso'
import { CalErro, useCalendario } from '@/components/devo/calendario/dados'
import { ProjecaoNatal } from '@/components/devo/calendario/calendario-app'
import { useCenas } from '@/components/devo/dialogo'
import { CardFace } from '@/components/devo/shared/devo-card'
import { usePlayerText } from '@/components/devo/state/player-text'

/**
 * Calendário no v2 (protótipo kit3/os-calendario.js, no modo do roster de Reverse: 1999 que o dono fixou): barra com os
 * recursos, a folha de papel com o prêmio de hoje, o de amanhã e "Marcar presença", e à direita as cartas altas da
 * Semana, os Eventos e o Mês. Os dados e as regras são os do jogo (/api/calendario): ciclo do check-in diário, os
 * check-ins extras das datas comemorativas, a revelação do prêmio, os eventos da Companhia e a apresentação da
 * Melissa (cena `melissa-calendario` do motor de diálogo, com o exemplo do Natal).
 */

const CENA = 'melissa-calendario'
const ICONE: Record<IconeRecompensa | 'presente', string> = {
  pp: 'pp',
  fragmento: 'fragmento',
  tempo: 'ampulheta',
  dracma_comum: 'dracma-comum',
  dracma_incomum: 'dracma-incomum',
  carta: 'carta-incomum',
  item: 'presente',
  presente: 'presente',
}
const ico = (i: IconeRecompensa | 'presente', t: 64 | 128 | 256) => `/images/calendario/icones/${ICONE[i]}-${t}.webp`
const TINTA = ['#6b5a8e', '#6b5a8e', '#7a4a8e', '#8a6a3a', '#7a5a3a', '#6a6a72', '#8a3a2a']
/** Artes do protótipo para os eventos conhecidos; outros usam a arte do próprio evento. */
const ARTE_EVENTO: [RegExp, string][] = [
  [/natal/i, 'natal'],
  [/halloween/i, 'halloween'],
  [/carnaval/i, 'carnaval'],
  [/junina/i, 'junina'],
]
const arteDe = (e: EventoVista) => {
  const k = ARTE_EVENTO.find(([r]) => r.test(e.titulo))?.[1]
  return k ? `/v2/art/os/eventos/${k}.png` : e.arte
}
const quando = (e: EventoVista) => (e.emDias < 0 || (e.emDias === 0 && e.ate > e.ocorrencia) ? 'Acontecendo agora' : e.emDias === 0 ? 'Hoje' : e.emDias === 1 ? 'Amanhã' : `Em ${e.emDias} dias`)

type Liberado = Extract<CalendarioPayload, { liberado: true }>
type Aba = 'semana' | 'eventos' | 'mes'

function useRelogio(alvo: number) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const ms = Math.max(0, alvo - agora)
  const s = Math.floor(ms / 1000)
  return { ms, txt: `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
}

const lerInventario = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) return { inventario: [] as InventoryItem[] }
  return (await r.json()) as { inventario: InventoryItem[] }
}

export function CalendarioV2() {
  const { data, error, isLoading, mutate, checkin } = useCalendario()
  const cenas = useCenas()
  const pedida = useRef(false)
  const [natal, setNatal] = useState(false)

  // a Melissa apresenta uma vez (estado "vista" do motor de cenas, no servidor)
  useEffect(() => {
    if (!data?.liberado || !cenas.carregado || pedida.current) return
    pedida.current = true
    cenas.abrir(CENA, { seNaoVista: true })
  }, [data?.liberado, cenas])
  // "*Mostra exemplo de Evento de Natal*": o motor avisa o passo; o Natal fica projetado enquanto durar
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ cena?: string; id?: string | null }>).detail
      if (d?.cena === CENA) setNatal(d.id === 'exemplo-natal')
    }
    window.addEventListener('devo:cena-passo', on)
    return () => window.removeEventListener('devo:cena-passo', on)
  }, [])

  return (
    <div id="cal">
      {!data ? (
        <div className="r19-msg">
          {error ? (
            <>
              <p role="alert">{(error as Error).message}</p>
              <button className="r-bt chanfro" onClick={() => mutate()}>
                Tentar de novo
              </button>
            </>
          ) : (
            <p>{isLoading ? 'Abrindo o calendário…' : ''}</p>
          )}
        </div>
      ) : !data.liberado ? (
        <div className="r19-msg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/v2/art/os/px/aco/cadeado.png" alt="" />
          <strong>Calendário trancado</strong>
          <p>{data.motivo}</p>
        </div>
      ) : (
        <Tela d={data} checkin={checkin} recarregar={() => void mutate()} onMelissa={() => cenas.abrir(CENA)} />
      )}
      {natal && data?.liberado && <ProjecaoNatal eventos={data.eventos} hoje={data.hoje} />}
    </div>
  )
}

type Checkin = ReturnType<typeof useCalendario>['checkin']

function Tela({ d, checkin, recarregar, onMelissa }: { d: Liberado; checkin: Checkin; recarregar: () => void; onMelissa: () => void }) {
  const [aba, setAba] = useState<Aba>('semana')
  const ancora = useRef<HTMLSpanElement>(null)
  const [revela, setRevela] = useState<(ResgateResultado & { titulo: string }) | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inv = useSWR('/api/eu?parte=inventario', lerInventario, { revalidateOnFocus: true })
  const qtd = (k: string) => (inv.data?.inventario ?? []).find((i) => i.key === k)?.quantity ?? 0
  const c = d.diario
  const relogio = useRelogio(c.proximoDiaEm)
  // virou o dia (meia-noite de Brasília) com a tela aberta: pede o estado novo uma vez
  const virou = useRef(false)
  useEffect(() => {
    if (!c.feitoHoje || relogio.ms > 0 || virou.current) return
    virou.current = true
    recarregar()
  }, [c.feitoHoje, relogio.ms, recarregar])

  const marca = async (chave: string, alvo: { tipo: 'diario' } | { tipo: 'evento'; eventoId: string }, titulo: string) => {
    if (ocupado) return
    setOcupado(chave)
    setErro(null)
    try {
      const r = await checkin(alvo)
      setRevela({ ...r, titulo })
      void inv.mutate()
    } catch (e) {
      playSfx('error')
      setErro(e instanceof CalErro && e.status === 409 ? e.message : (e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  const n = c.slots.length || 7
  const hoje = c.slots[c.posicao - 1]
  const amanha = c.slots[c.posicao % n]
  const hojeTxt = dataLonga(d.hoje)

  return (
    <div className="r19">
      <div className="r19-top">
        <span className="r19-rec" title="Fragmentos Arcanos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ico('fragmento', 64)} alt="" />
          <b>{qtd('fragmento_arcano')}</b>
        </span>
        <span className="r19-rec" title="Dracmas Comuns">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ico('dracma_comum', 64)} alt="" />
          <b>{qtd('dracma_comum')}</b>
        </span>
        <div className="r19-abas" role="tablist">
          {(
            [
              ['semana', 'Semana'],
              ['eventos', 'Eventos'],
              ['mes', 'Mês'],
            ] as [Aba, string][]
          ).map(([k, r]) => (
            <button
              key={k}
              role="tab"
              aria-selected={aba === k}
              onClick={() => {
                playSfx('click')
                setAba(k)
              }}
            >
              {r}
              <i />
            </button>
          ))}
          <button
            className="r19-tudo k-mel"
            aria-label="Rever a apresentação da Melissa"
            onClick={() => {
              playSfx('open')
              onMelissa()
            }}
          >
            Melissa
          </button>
        </div>
      </div>

      <section className="r19-papel" aria-label="Check-in diário">
        <span className="r19-arco e" aria-hidden="true" />
        <span className="r19-arco d" aria-hidden="true" />
        <p className="r19-data">{hojeTxt.charAt(0).toUpperCase() + hojeTxt.slice(1)}</p>
        <div className="r19-tri">
          <svg viewBox="0 0 200 176" aria-hidden="true">
            <path d="M100 6 L194 170 H6 Z" className="o" />
            <path d="M100 22 L180 162 H20 Z" className="m" />
            <path d="M14 162 H186" className="base" />
            <circle cx="34" cy="160" r="3" className="pt" />
            <circle cx="166" cy="160" r="3" className="pt" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {hoje && <img src={ico(hoje.recompensa.icone, 256)} alt="" />}
        </div>
        <p className="r19-lv">
          <span>Dia.</span> {c.posicao}
          <i>/</i>
          {n}
        </p>
        <hr className="r19-pont" />
        <div className="r19-itens">
          {hoje && (
            <span>
              <i>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ico(hoje.recompensa.icone, 64)} alt="" />
              </i>
              <b>{hoje.recompensa.valor}</b>
              <small>Hoje</small>
            </span>
          )}
          {amanha && (
            <span>
              <i>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ico(amanha.recompensa.icone, 64)} alt="" />
              </i>
              <b>{amanha.recompensa.valor}</b>
              <small>Amanhã</small>
            </span>
          )}
        </div>
        {c.feitoHoje ? (
          <p className="r19-ok" role="status">
            Presença marcada · a próxima abre em {relogio.txt}
          </p>
        ) : (
          <button className="r19-bt k-marca" disabled={ocupado === 'diario'} aria-label={`Marcar presença: ${hoje?.recompensa.rotulo ?? ''}`} onClick={() => marca('diario', { tipo: 'diario' }, 'Check-in diário')}>
            <span>{ocupado === 'diario' ? 'Marcando…' : 'Marcar presença'}</span>
            <small>CHECK-IN</small>
            <i />
          </button>
        )}
        <p className="r19-nota">{c.falta === 'pausa' ? 'Perdeu um dia? O ciclo espera e continua de onde parou.' : 'Perder um dia faz o ciclo voltar ao Dia 1.'}</p>
        {erro && (
          <p className="r19-erro" role="alert">
            {erro}
          </p>
        )}
        {d.extras.map((x) => (
          <div key={x.eventoId} className="r19-extra">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ico('presente', 128)} alt="" />
            <div>
              <small>Data comemorativa · {x.evento}</small>
              <strong>{x.titulo}</strong>
              <span>
                Até {dataCurtaFaixa(x.ate, x.ate)} · {x.slots.filter((s) => s.estado === 'feito').length} de {x.slots.length}
              </span>
            </div>
            {x.feitoHoje ? (
              <em>{x.slots.every((s) => s.estado === 'feito') ? 'Tudo resgatado' : 'Volte amanhã'}</em>
            ) : (
              <button className="r-bt chanfro" disabled={ocupado === x.eventoId} onClick={() => marca(x.eventoId, { tipo: 'evento', eventoId: x.eventoId }, x.titulo)}>
                {ocupado === x.eventoId ? 'Marcando…' : 'Marcar presença'}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="r19-dir">
        {aba === 'semana' ? <Semana slots={c.slots} /> : aba === 'eventos' ? <Eventos d={d} /> : <Mes d={d} />}
      </section>
      <p className="r19-rodape">Grandioso Calendário Devo · ciclo de {n} dias · as datas seguem o horário de Brasília</p>
      <span ref={ancora} hidden />
      {revela && ancora.current?.closest('.jan') && createPortal(<Revelacao r={revela} onFim={() => setRevela(null)} />, ancora.current.closest('.jan')!)}
    </div>
  )
}

function Semana({ slots }: { slots: CheckinSlot[] }) {
  return (
    <ul className="r19-cartas">
      {slots.map((s, i) => (
        <li key={s.posicao} className={'r19-c ' + (s.estado === 'feito' ? 'feito' : s.estado === 'hoje' ? 'hoje' : '') + (i === slots.length - 1 ? ' ouro' : '')} style={{ '--tinta-c': TINTA[i % TINTA.length] } as React.CSSProperties}>
          <span className="r19-arte" style={{ '--arte': `url(/v2/art/os/cal/dia-${(i % 7) + 1}.webp)` } as React.CSSProperties} />
          <i className="r19-ic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ico(s.recompensa.icone, 64)} alt="" />
          </i>
          {s.estado === 'hoje' ? <em className="r19-new">HOJE</em> : s.estado === 'proximo' ? <em className="r19-new suave">NEW</em> : null}
          {s.estado === 'feito' && <span className="r19-faixa">Resgatado</span>}
          <span className="r19-pe">
            <small>Dia. {s.posicao}</small>
            <b>
              {s.recompensa.valor} {s.recompensa.legenda}
            </b>
            <u>{s.recompensa.rotulo}</u>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Eventos({ d }: { d: Liberado }) {
  const lista = d.eventos.filter((e) => e.ate >= d.hoje).slice(0, 12)
  if (!lista.length) return <p className="kc-nada">Nada programado por enquanto. A Companhia avisa quando houver.</p>
  return (
    <ul className="r19-cartas r19-evs">
      {lista.map((e) => {
        const p = partes(e.ocorrencia)
        const arte = arteDe(e)
        return (
          <li key={`${e.id}-${e.ocorrencia}`} className={'r19-c ev ' + e.enfase} style={{ '--tinta-c': e.enfase === 'atencao' ? '#8a3a2a' : '#3a5a4a' } as React.CSSProperties} title={e.descricao || undefined}>
            <span className="r19-arte" style={arte ? ({ '--arte': `url(${arte})` } as React.CSSProperties) : undefined} />
            <i className="r19-ic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ico('presente', 64)} alt="" />
            </i>
            <em className="r19-new">{quando(e).toUpperCase()}</em>
            {e.checkin && <span className="r19-faixa">Check-in especial</span>}
            <span className="r19-pe">
              <small>
                {String(p.dia).padStart(2, '0')} {mesCurto(p.mes)}
              </small>
              <b>{e.titulo}</b>
              <u>{ENFASE_ROTULO[e.enfase]}</u>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Mes({ d }: { d: Liberado }) {
  const h = partes(d.hoje)
  const [cursor, setCursor] = useState({ ano: h.ano, mes: h.mes })
  const [sel, setSel] = useState<Dia>(d.hoje)
  // do mês passado até 12 meses à frente (o servidor manda as ocorrências dessa janela)
  const idx = (c: { ano: number; mes: number }) => c.ano * 12 + c.mes
  const min = idx(h) - 1
  const max = idx(h) + 12
  const anda = (n: number) => {
    const v = idx(cursor) + n
    if (v < min || v > max) return
    playSfx('click')
    setCursor({ ano: Math.floor((v - 1) / 12), mes: ((v - 1) % 12) + 1 })
  }
  const primeiro = `${cursor.ano}-${String(cursor.mes).padStart(2, '0')}-01`
  const eventos = useMemo(() => d.eventos.filter((e) => e.ocorrencia.slice(0, 7) <= primeiro.slice(0, 7) && e.ate.slice(0, 7) >= primeiro.slice(0, 7)), [d.eventos, primeiro])
  const vazio = diaDaSemana(primeiro)
  const ultimo = partes(somaDias(`${cursor.mes === 12 ? cursor.ano + 1 : cursor.ano}-${String(cursor.mes === 12 ? 1 : cursor.mes + 1).padStart(2, '0')}-01`, -1)).dia
  const dias = Array.from({ length: ultimo }, (_, i) => `${primeiro.slice(0, 8)}${String(i + 1).padStart(2, '0')}`)
  const doDia = (dia: Dia) => eventos.filter((e) => e.ocorrencia <= dia && e.ate >= dia)
  const nomeM = nomeMes(cursor.mes)
  const NomeM = nomeM.charAt(0).toUpperCase() + nomeM.slice(1)
  const evSel = doDia(sel)
  const ps = partes(sel)
  return (
    <div className="r19-mes">
      <div className="k-mes">
        <button className="kc-nav" aria-label="Mês anterior" disabled={idx(cursor) <= min} onClick={() => anda(-1)}>
          <svg className="seta" viewBox="0 0 24 24">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <strong>
          {NomeM} <span>{cursor.ano}</span>
        </strong>
        <button className="kc-nav" aria-label="Próximo mês" disabled={idx(cursor) >= max} onClick={() => anda(1)}>
          <svg className="seta" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className="k-semana" aria-hidden="true">
        {SEMANA_CURTA.map((x, i) => (
          <span key={i}>{x}</span>
        ))}
      </div>
      <div className="k-grade" role="grid" aria-label={`${NomeM} de ${cursor.ano}`}>
        {Array.from({ length: vazio }, (_, i) => (
          <span key={'v' + i} />
        ))}
        {dias.map((dia) => {
          const evs = doDia(dia)
          const arte = evs[0] ? arteDe(evs[0]) : null
          return (
            <button
              key={dia}
              className={'k-d' + (dia === d.hoje ? ' hoje' : '') + (evs.length ? ` ev ${evs[0].enfase}` : '') + (sel === dia ? ' sel' : '')}
              aria-label={`${partes(dia).dia} de ${nomeM}${evs.length ? `: ${evs.map((e) => e.titulo).join(', ')}` : ''}`}
              onClick={() => setSel(dia)}
            >
              <span>{partes(dia).dia}</span>
              {evs.length > 0 && <i style={arte ? ({ '--arte': `url(${arte})` } as React.CSSProperties) : undefined} />}
            </button>
          )
        })}
      </div>
      <div className="kc-leg" aria-hidden="true">
        <span className="folga">Dia de folga</span>
        <span className="atencao">Fique atento</span>
        <span className="hoje">Hoje</span>
      </div>
      <div className="k-dia">
        {evSel.length ? (
          evSel.map((e) => {
            const arte = arteDe(e)
            return (
              <div key={`${e.id}-${e.ocorrencia}`} className="kc-diaev" style={arte ? ({ '--arte': `url(${arte})` } as React.CSSProperties) : undefined}>
                <em className={e.enfase}>{ENFASE_ROTULO[e.enfase]}</em>
                <strong>{e.titulo}</strong>
                <p>
                  {dataCurtaFaixa(e.ocorrencia, e.ate)}
                  {e.descricao ? ` · ${e.descricao}` : ''}
                </p>
              </div>
            )
          })
        ) : (
          <p className="kc-nada">
            {ps.dia} de {nomeMes(ps.mes)} · Nenhum evento programado.
          </p>
        )}
      </div>
    </div>
  )
}

/** A revelação do prêmio (protótipo: k-revela kc-revela), dentro da janela. Toque, Esc ou Pular fecham. */
function Revelacao({ r, onFim }: { r: ResgateResultado & { titulo: string }; onFim: () => void }) {
  const pt = usePlayerText()
  const fim = useRef(onFim)
  fim.current = onFim
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    botao.current?.focus({ preventScroll: true })
    playSfx('bell')
    const t1 = window.setTimeout(() => playSfx(r.recompensa.icone === 'carta' ? 'card' : 'reveal'), 260)
    const t2 = window.setTimeout(() => playSfx('thud'), 820)
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      fim.current()
    }
    window.addEventListener('keydown', esc, true)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('keydown', esc, true)
    }
  }, [r.recompensa.icone])
  const nota =
    r.recompensa.icone === 'pp'
      ? r.aplicado.pp === 0
        ? 'Seu Estágio já está no limite: desta vez nada coube.'
        : 'Os Pontos de Potencial seguem para as suas Virtudes.'
      : r.recompensa.icone === 'tempo'
        ? 'O tempo já entrou no seu pulso.'
        : r.recompensa.icone === 'carta'
          ? 'A carta foi para o seu inventário.'
          : 'Guardado no seu inventário.'
  return (
    <button ref={botao} className="k-revela kc-revela" aria-label={`Recompensa resgatada: ${r.recompensa.rotulo}. Toque para continuar`} onClick={() => fim.current()}>
      <span className="kc-raio" aria-hidden="true" />
      <small className="kc-rv-k">
        {r.tipo === 'diario' ? `Presença marcada · Dia ${r.posicao}` : `${r.titulo} · Resgate ${r.posicao}`}
      </small>
      {r.recompensa.icone === 'carta' && r.aplicado.cartaId ? (
        <span className="kc-rv-carta">
          <CardFace cardId={r.aplicado.cartaId} className="w-full" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ico(r.recompensa.icone, 256)} alt="" />
      )}
      <strong>{r.recompensa.rotulo}</strong>
      <p>{pt(nota)}</p>
      <small>Toque para continuar</small>
    </button>
  )
}
