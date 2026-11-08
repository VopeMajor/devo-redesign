'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import useSWR from 'swr'
import { callName, DevoProvider, useDevo } from '@/components/devo/state/devo-store'
import { useEu } from '@/components/devo/state/use-acesso'
import { useAnuncios } from '@/components/devo/os/anuncios-card'
import { useNow } from '@/components/devo/hooks'
import { recordIdFor } from '@/lib/devo/deadly-votes'
import { PULSE_CRITICAL_MS, pulseRemaining } from '@/lib/devo/pulse'
import type { CalendarioPayload } from '@/lib/devo/calendario'
import type { SaveData } from '@/lib/devo/save'
import { Barlow, Barlow_Semi_Condensed, Jersey_15 } from 'next/font/google'
import './os.css'
import './v2-ajustes.css'

/**
 * Casca do DEVO v2: a mesma estrutura de elementos do protótipo aprovado (kit3/os-janelas.html: barra de cima com o
 * Tempo, painel do Record, o dia de hoje, a faixa de anúncios, o Mapa do Devo e a doca), para o estilo do protótipo
 * (os.css) valer sem mudança. Os dados são os do jogo: nome, Tempo, Arcano, check-in, eventos e anúncios.
 * Os sistemas abrem janelas; cada tela entra nas próximas etapas do plano (PLANO-PUBLICACAO.md).
 */

const barlow = Barlow({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--v2-barlow' })
const barlowCond = Barlow_Semi_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'], variable: '--v2-barlow-cond' })
const jersey = Jersey_15({ subsets: ['latin'], weight: '400', variable: '--v2-jersey' })
const FONTES_V2 = [barlow.variable, barlowCond.variable, jersey.variable].join(' ')

/** Fontes dos apps do protótipo que ainda virão (Cinzel, EB Garamond, VT323…): pelo Google, como no protótipo. */
const FONTES =
  'https://fonts.googleapis.com/css2?family=Jersey+15&family=VT323&family=Cinzel:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&family=Oswald:wght@500&family=Manrope:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Barlow:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600;700&display=swap'

type Sistema = { id: string; nome: string; curto?: string; s: string }

/** Ordem e nomes do protótipo (kit3/os-dados.js). A Mesa é da equipe; esta página já é só da equipe. */
const SISTEMAS: Sistema[] = [
  { id: 'record', nome: 'Record', s: 'Deadly Vote Record System' },
  { id: 'mensagens', nome: 'Mensagens', s: 'Conversas e ameaças' },
  { id: 'cartas', nome: 'Cartas', s: 'Seu inventário' },
  { id: 'pulso', nome: 'Pulso', s: 'Seu tempo de vida' },
  { id: 'casa', nome: 'Casa', s: 'Confecção de Cartas e Pacotes' },
  { id: 'inventario', nome: 'Inventário', s: 'Tudo o que é seu' },
  { id: 'trocas', nome: 'Sala de Trocas', curto: 'Trocas', s: 'Trocas às cegas' },
  { id: 'calendario', nome: 'Calendário', s: 'Eventos e check-in diário' },
  { id: 'torres', nome: 'Torres de Ruptura', curto: 'Torres', s: 'Andares, essências e chaves' },
  { id: 'poco', nome: 'Poço dos Milagres', curto: 'Poço', s: 'Moedas, manivela e balde' },
  { id: 'salao', nome: 'Salão das Máscaras', curto: 'Máscaras', s: 'Leilões, mercado e anúncios' },
  { id: 'jogos', nome: 'Sala de Jogos', curto: 'Jogos', s: 'Minigames e apostas' },
  { id: 'corporacoes', nome: 'Corporações', s: 'Companhia de Despertados' },
  { id: 'conflito', nome: 'Evento de Conflito', curto: 'Conflito', s: 'Companhia × Ordem' },
  { id: 'ranking', nome: 'Ranking Geral da Temporada', curto: 'Ranking', s: 'O relógio da praça' },
  { id: 'virtudes', nome: 'Virtudes', s: 'Pontos de potencial' },
  { id: 'arcanos', nome: 'Arcanos', s: 'Os vinte e dois' },
  { id: 'ajustes', nome: 'Ajustes', s: 'Sistema' },
  { id: 'mesa', nome: 'Mesa', s: 'Painel da equipe' },
]
const SIS = new Map(SISTEMAS.map((a) => [a.id, a]))
const ico = (id: string) => `/v2/art/os/ico/${id}.webp`
const ROMANOS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** Tempo como no protótipo: horas totais, minutos e segundos (71:59:57). */
function relogio(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Sigilo({ anel = false }: { anel?: boolean }) {
  return (
    <svg className="sigilo" viewBox="0 0 64 64" aria-hidden="true">
      <use href="#sigilo-devo" />
      {anel && <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45" />}
    </svg>
  )
}

const Seta = ({ volta = false }: { volta?: boolean }) => (
  <svg className="seta" viewBox="0 0 24 24" aria-hidden="true">
    <path d={volta ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
  </svg>
)

export function V2App(props: { initialPlayerName: string | null; initialCharacterName: string | null; initialSave: SaveData | null }) {
  return (
    <DevoProvider initialPlayerName={props.initialPlayerName} initialCharacterName={props.initialCharacterName} initialSave={props.initialSave}>
      <link rel="stylesheet" href={FONTES} precedence="default" />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="sigilo-devo" viewBox="0 0 64 64">
          <ellipse cx="32" cy="32" rx="27" ry="9.5" transform="rotate(-24 32 32)" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="55.6" cy="21.9" r="2.8" fill="currentColor" />
          <path d="M32 7C33.4 25.2 38.8 30.6 57 32C38.8 33.4 33.4 38.8 32 57C30.6 38.8 25.2 33.4 7 32C25.2 30.6 30.6 25.2 32 7ZM32 27.6a4.4 4.4 0 1 0 0.001 0Z" fill="currentColor" fillRule="evenodd" />
          <circle cx="32" cy="32" r="1.6" fill="currentColor" />
        </symbol>
      </svg>
      <Casca />
    </DevoProvider>
  )
}

type Janela = { id: string; z: number; oculta: boolean; max: boolean; caixa: { l: number; t: number; w: number; h: number } | null }

const pc = () => typeof window !== 'undefined' && window.matchMedia('(min-width:900px)').matches

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

function Casca() {
  const { state } = useDevo()
  const now = useNow(1000)
  // o relógio só aparece depois de montar: o horário do servidor e o do aparelho nunca batem (hidratação)
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  const resta = pulseRemaining(state.timerEndsAt, now)
  const tempo = montado ? relogio(resta) : '--:--:--'
  const critico = resta < PULSE_CRITICAL_MS
  const est = critico ? 'Crítico' : 'Estável'
  const nome = callName(state) ?? 'Record'
  const eu = useEu().data
  const cal = useSWR<CalendarioPayload>('/api/calendario', getJson, { revalidateOnFocus: false }).data
  const anuncios = useAnuncios().data?.anuncios ?? []

  // o esquema azul e a paleta "noite" (escolha do dono, 02/11) ficam no <html>, como no protótipo
  useEffect(() => {
    const h = document.documentElement
    const antes = { tema: h.dataset.tema, paleta: h.dataset.paleta }
    h.dataset.tema = 'aco'
    h.dataset.paleta = 'noite'
    return () => {
      if (antes.tema) h.dataset.tema = antes.tema
      else delete h.dataset.tema
      if (antes.paleta) h.dataset.paleta = antes.paleta
      else delete h.dataset.paleta
    }
  }, [])

  /* ---- janelas ---- */
  const [janelas, setJanelas] = useState<Janela[]>([])
  const zRef = useRef(5)
  const cascata = useRef(0)
  const osRef = useRef<HTMLElement>(null)
  const foco = useMemo(() => janelas.filter((j) => !j.oculta).sort((a, b) => b.z - a.z)[0] ?? null, [janelas])

  const abre = useCallback((id: string) => {
    setJanelas((js) => {
      const ja = js.find((j) => j.id === id)
      if (ja) return js.map((j) => (j.id === id ? { ...j, oculta: false, z: ++zRef.current } : j))
      let caixa: Janela['caixa'] = null
      if (pc() && osRef.current) {
        const a = osRef.current.getBoundingClientRect()
        cascata.current = (cascata.current + 1) % 4
        const w = Math.min(760, a.width - 8)
        const h = Math.min(680, a.height - 44 - 54 - 14)
        const l = Math.max(460, a.width - w - 40) - cascata.current * 22
        caixa = { l: Math.max(8, Math.min(a.width - w - 8, l)), t: 56 + cascata.current * 18, w, h }
      }
      return [...js, { id, z: ++zRef.current, oculta: false, max: false, caixa }]
    })
  }, [])
  const fecha = (id: string) => setJanelas((js) => js.filter((j) => j.id !== id))
  const muda = (id: string, f: (j: Janela) => Janela) => setJanelas((js) => js.map((j) => (j.id === id ? f(j) : j)))
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && foco) fecha(foco.id)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [foco])

  /* ---- anúncios ---- */
  const [qi, setQi] = useState(0)
  const an = anuncios.length ? anuncios[qi % anuncios.length] : null

  /* ---- hoje: check-in e próximo evento ---- */
  const diario = cal && cal.liberado ? cal.diario : null
  const prox = cal && cal.liberado ? [...cal.eventos].filter((e) => e.emDias >= 0).sort((a, b) => a.emDias - b.emDias)[0] : null
  const quando = (d: number) => (d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : `Em ${d} dias`)

  const arcano = eu?.arcano ?? null
  const retrato = arcano ? `url(/images/arcanos/${arcano.key}/retrato-512.webp)` : 'none'
  const avisos = state.notifications.length

  return (
    <main id="os" ref={osRef} className={[FONTES_V2, critico && 'critico', foco && 'aberta'].filter(Boolean).join(' ')}>
      <header id="menu">
        <span id="marca">
          <Sigilo anel />
          <b>
            Devo<i>.System</i>
          </b>
        </span>
        <button id="hora" onClick={() => abre('pulso')} aria-label={`Tempo no pulso: ${tempo}. ${est}. Abrir Pulso`}>
          <svg className="ampulheta" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3h12M6 21h12M7.5 3c0 5.5 9 6.5 9 9s-9 3.5-9 9M16.5 3c0 5.5-9 6.5-9 9s9 3.5 9 9" />
          </svg>
          <i>Pulso</i>
          <b>{tempo}</b>
        </button>
        <span aria-hidden="true" />
      </header>

      <div id="inicio">
        <section id="painel" aria-label="Resumo">
          <button id="perfil" aria-label="Abrir Record" onClick={() => abre('record')} style={{ '--retrato': retrato } as CSSProperties}>
            <span className="pf-av">
              <Sigilo />
            </span>
            <span className="pf-tx">
              <small>Record · {recordIdFor(state.playerName)}</small>
              <strong>{nome}</strong>
              {arcano && (
                <em className="pf-arc">
                  <img src={`/images/arcanos/${arcano.key}/sigilo-64.webp`} alt="" />
                  {arcano.numeral} · {arcano.titulo.replace(/^Arcano d[aoe]s? /, '')} · Estágio {ROMANOS[arcano.estagio] ?? arcano.estagio}
                </em>
              )}
              <span className="pf-barra">
                <i />
                <b className="pf-est-tx">{est}</b> · Tempo no pulso
              </span>
            </span>
            <i className="pf-est">{est}</i>
          </button>

          <div id="hoje">
            {diario && (
              <button className="hj" onClick={() => abre('calendario')}>
                <span className="hj-ic">
                  <img src={ico('calendario')} alt="" />
                </span>
                <span>
                  <small>Check-in diário</small>
                  <strong>
                    Dia {diario.posicao} de {diario.slots.length || 7}
                  </strong>
                  <em className={diario.feitoHoje ? 'ok' : 'pede'}>{diario.feitoHoje ? 'Feito hoje' : 'Marcar presença'}</em>
                </span>
              </button>
            )}
            {prox && (
              <button className="hj" onClick={() => abre('calendario')}>
                <span className="hj-ic">
                  <img src={prox.arte || ico('calendario')} alt="" />
                </span>
                <span>
                  <small>Próximo evento</small>
                  <strong>{prox.titulo}</strong>
                  <em>{quando(prox.emDias)}</em>
                </span>
              </button>
            )}
          </div>

          {an && (
            <div id="faixa">
              <span className="fx-k">{an.kicker}</span>
              <p id="an-t">{an.titulo}</p>
              {anuncios.length > 1 && (
                <div className="pag">
                  <span id="an-n">
                    {(qi % anuncios.length) + 1} de {anuncios.length}
                  </span>
                  <button aria-label="Anúncio anterior" onClick={() => setQi((x) => (x - 1 + anuncios.length) % anuncios.length)}>
                    <Seta volta />
                  </button>
                  <button aria-label="Próximo anúncio" onClick={() => setQi((x) => (x + 1) % anuncios.length)}>
                    <Seta />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section id="sistemas" aria-label="Sistemas">
          <header className="mapa-cab">
            <small>Navegação</small>
            <h2>Mapa do Devo</h2>
          </header>
          <span className="mapa-dica" aria-hidden="true">
            Arraste para explorar <Seta />
          </span>
          <svg className="orbitas" viewBox="0 0 400 700" preserveAspectRatio="none" aria-hidden="true">
            <circle cx="40" cy="260" r="300" />
            <circle cx="430" cy="430" r="250" />
            <circle cx="210" cy="120" r="150" />
            <circle cx="210" cy="620" r="190" />
            <circle cx="335" cy="168" r="4" />
            <circle cx="96" cy="555" r="3" />
            <circle cx="262" cy="392" r="5" />
          </svg>
          <Mapa onAbre={abre} contas={state.unread as Record<string, number | undefined>} />
        </section>
      </div>

      <div id="janelas">
        {janelas.map((j) => (
          <JanelaSistema key={j.id} j={j} emFoco={foco?.id === j.id} os={osRef} onFoco={() => muda(j.id, (x) => ({ ...x, z: ++zRef.current }))}
            onMini={() => muda(j.id, (x) => ({ ...x, oculta: true }))} onMax={() => muda(j.id, (x) => ({ ...x, max: !x.max }))} onFecha={() => fecha(j.id)}
            onMove={(c) => muda(j.id, (x) => ({ ...x, caixa: c }))} avisos={state.notifications} />
        ))}
      </div>

      <nav id="tarefas" aria-label="Barra de tarefas">
        <button id="iniciar" className="chanfro" aria-label="Início: minimizar tudo" onClick={() => setJanelas((js) => js.map((j) => ({ ...j, oculta: true })))}>
          <Sigilo />
        </button>
        <div id="tabs">
          {janelas.map((j) => {
            const a = SIS.get(j.id)
            const nomeJ = j.id === 'avisos' ? 'Avisos' : a?.nome ?? j.id
            return (
              <button key={j.id} className={'chanfro' + (foco?.id === j.id ? ' foco' : '')} aria-label={nomeJ}
                onClick={() => muda(j.id, (x) => (foco?.id === j.id ? { ...x, oculta: true } : { ...x, oculta: false, z: ++zRef.current }))}>
                <img src={ico(j.id === 'avisos' ? 'sino' : j.id)} alt="" />
                {janelas.length < 4 && <span>{j.id === 'avisos' ? 'Avisos' : a?.curto ?? a?.nome}</span>}
              </button>
            )
          })}
        </div>
        <button id="sino" className="chanfro" aria-label={avisos ? `Central de avisos, ${avisos} novos` : 'Central de avisos'} onClick={() => abre('avisos')}>
          <img src={ico('sino')} alt="" />
          {avisos > 0 && <b>{avisos}</b>}
        </button>
      </nav>
    </main>
  )
}

/** O Mapa do Devo: cada sistema é um local, o objeto dentro de uma mira dourada e o nome entre dois filetes. */
function Mapa({ onAbre, contas }: { onAbre: (id: string) => void; contas: Record<string, number | undefined> }) {
  const ref = useRef<HTMLDivElement>(null)
  // no computador o mapa se arrasta com o mouse (no toque, o rolar lateral já é nativo)
  useEffect(() => {
    const m = ref.current
    if (!m) return
    let x0 = 0,
      s0 = 0,
      ativo = false,
      moveu = false
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      ativo = true
      moveu = false
      x0 = e.clientX
      s0 = m.scrollLeft
    }
    const move = (e: PointerEvent) => {
      if (!ativo) return
      const dx = e.clientX - x0
      if (Math.abs(dx) > 4) {
        moveu = true
        m.classList.add('arrastando')
      }
      m.scrollLeft = s0 - dx
    }
    const up = () => {
      ativo = false
      setTimeout(() => m.classList.remove('arrastando'), 0)
    }
    const click = (e: MouseEvent) => {
      if (moveu) {
        e.stopPropagation()
        e.preventDefault()
        moveu = false
      }
    }
    m.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    m.addEventListener('click', click, true)
    return () => {
      m.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      m.removeEventListener('click', click, true)
    }
  }, [])
  return (
    <div id="mesa" ref={ref}>
      {SISTEMAS.map((a) => {
        const n = contas[a.id] ?? 0
        return (
          <button key={a.id} className="ic" data-id={a.id} aria-label={n ? `${a.nome}, ${n} novas` : a.nome} onClick={() => onAbre(a.id)}>
            <i className="disco">
              <img src={ico(a.id)} alt="" />
            </i>
            <span>{a.curto ?? a.nome}</span>
            {n > 0 && <u>{n}</u>}
          </button>
        )
      })}
    </div>
  )
}

const TRACO = {
  mini: <path d="M3.5 8.5h9" />,
  maxi: <rect x="3.5" y="3.5" width="9" height="9" rx="2" />,
  x: <path d="M4 4l8 8M12 4l-8 8" />,
}

function JanelaSistema({ j, emFoco, os, onFoco, onMini, onMax, onFecha, onMove, avisos }: {
  j: Janela
  emFoco: boolean
  os: React.RefObject<HTMLElement | null>
  onFoco: () => void
  onMini: () => void
  onMax: () => void
  onFecha: () => void
  onMove: (c: NonNullable<Janela['caixa']>) => void
  avisos: { id: string; title: string; body?: string }[]
}) {
  const a = SIS.get(j.id)
  const titulo = j.id === 'avisos' ? 'Avisos' : a?.nome ?? j.id
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!j.oculta) ref.current?.focus({ preventScroll: true })
  }, [j.oculta])
  // no computador a janela se arrasta pela barra de título (sempre sobra por onde pegar) e muda de tamanho pelo canto
  const arrasta = (modo: 'move' | 'tam') => (e: RPointerEvent) => {
    if (!j.caixa || j.max || (e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const alvo = e.currentTarget as HTMLElement
    alvo.setPointerCapture(e.pointerId)
    const r = { x: e.clientX, y: e.clientY, ...j.caixa }
    const B = 54
    const T = 44
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - r.x
      const dy = ev.clientY - r.y
      if (modo === 'move')
        onMove({ ...r, l: Math.min(window.innerWidth - 70, Math.max(70 - r.w, r.l + dx)), t: Math.min(window.innerHeight - B - 34, Math.max(T, r.t + dy)) })
      else onMove({ ...r, w: Math.max(300, r.w + dx), h: Math.max(220, r.h + dy) })
    }
    alvo.addEventListener('pointermove', mv)
    alvo.addEventListener('pointerup', () => alvo.removeEventListener('pointermove', mv), { once: true })
  }
  const estilo: CSSProperties = j.caixa
    ? { left: j.caixa.l, top: j.caixa.t, width: j.caixa.w, height: j.caixa.h, zIndex: j.z }
    : { left: 0, top: 'var(--topo)', width: '100%', height: 'auto', zIndex: j.z }
  void os
  return (
    <section ref={ref} className={['jan chanfro', !j.caixa && 'cheia', j.max && 'max', emFoco && 'foco'].filter(Boolean).join(' ')} role="dialog" aria-label={titulo}
      tabIndex={-1} hidden={j.oculta} style={estilo} data-sis={j.id} onPointerDownCapture={() => !emFoco && onFoco()}>
      <header className="tit" onPointerDown={arrasta('move')}>
        <img src={ico(j.id === 'avisos' ? 'sino' : j.id)} alt="" />
        <span>
          <small aria-hidden="true">Devo · Sistema</small>
          {titulo}
        </span>
        <button className="chanfro mini" aria-label={`Minimizar ${titulo}`} onClick={onMini}>
          <svg viewBox="0 0 16 16" aria-hidden="true">{TRACO.mini}</svg>
        </button>
        <button className="chanfro maxi so-pc" aria-label={`Maximizar ${titulo}`} onClick={onMax}>
          <svg viewBox="0 0 16 16" aria-hidden="true">{TRACO.maxi}</svg>
        </button>
        <button className="chanfro x" aria-label={`Fechar ${titulo}`} onClick={onFecha}>
          <svg viewBox="0 0 16 16" aria-hidden="true">{TRACO.x}</svg>
        </button>
      </header>
      <div className="corpo">
        {j.id === 'avisos' ? (
          <ul className="lista" id="l-avisos">
            {avisos.length ? (
              avisos.map((v) => (
                <li key={v.id}>
                  <span className="ir">
                    <span>
                      <small>{v.title}</small>
                      <strong>{v.body}</strong>
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li className="v2-vazio" style={{ border: 0 }}>
                <img src={ico('sino')} alt="" />
                Nada de novo por enquanto.
              </li>
            )}
          </ul>
        ) : (
          <div className="abre">
            <img src={ico(j.id)} alt="" />
            <h3>{titulo}</h3>
            <p>{a?.s}</p>
            <p>Esta tela entra nas próximas etapas do v2. Enquanto isso, ela continua no DEVO atual.</p>
            <p>
              <a className="r-bt s-forte" href="/">
                Abrir o DEVO atual
              </a>
            </p>
          </div>
        )}
      </div>
      <i className="canto" aria-hidden="true" onPointerDown={arrasta('tam')} />
    </section>
  )
}
