'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import {
  type CalendarioPayload,
  type CheckinExtra,
  type CheckinSlot,
  dataCurtaFaixa,
  dataLonga,
  type Dia,
  diaDaSemana,
  ENFASE_ROTULO,
  type Enfase,
  type EventoVista,
  mesCurto,
  nomeMes,
  partes,
  type ResgateResultado,
  SEMANA_CURTA,
  somaDias,
} from '@/lib/devo/calendario'
import { cn } from '@/lib/utils'
import { useCenas } from '../dialogo'
import { Button, Spinner } from '../kit/button'
import { EmblemCalendario, EmblemMark } from '../kit/emblems'
import { GlyphArrow } from '../kit/glyphs'
import { Stamp } from '../kit/stamp'
import { RewardStrip, type TicketData } from '../kit/ticket'
import { DevoCard } from '../shared/devo-card'
import { usePlayerText } from '../state/player-text'
import { CalErro, useCalendario } from './dados'
import { ArteVazia, RecompensaIcone, srcSetArte } from './icones'

/**
 * GRANDIOSO CALENDÁRIO DEVO (docs/redesign/CALENDARIO-dono.md). Check-in diário (ciclo de 7 dias, um por dia de
 * Brasília, decidido no servidor), check-ins extras de datas comemorativas, mês com os eventos marcados e a lista
 * dos próximos. Na primeira entrada a Melissa apresenta (cena `melissa-calendario`, holograma); no passo
 * `exemplo-natal` esta tela projeta o evento de Natal por cima da cena.
 * Paleta: Blood Wine / Faded Silver (refs/paleta/kokken-no-inori.jpg) sobre o mármore negro.
 */

const CENA = 'melissa-calendario'

export function CalendarioApp() {
  const { data, error, isLoading, mutate, checkin } = useCalendario()
  const cenas = useCenas()
  const pedida = useRef(false)
  const [natal, setNatal] = useState(false)

  // Tutorial da Melissa: uma vez (estado "vista" do motor de cenas, no servidor).
  useEffect(() => {
    if (!data?.liberado || !cenas.carregado || pedida.current) return
    pedida.current = true
    cenas.abrir(CENA, { seNaoVista: true })
  }, [data?.liberado, cenas])

  // "*Mostra exemplo de Evento de Natal*": o motor avisa o passo; projetamos o Natal enquanto durar.
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ cena?: string; id?: string | null }>).detail
      if (d?.cena === CENA) setNatal(d.id === 'exemplo-natal')
    }
    window.addEventListener('devo:cena-passo', on)
    return () => window.removeEventListener('devo:cena-passo', on)
  }, [])

  if (!data) {
    return (
      <Fundo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p role="alert" className="font-body text-[16px] text-dv-text-2">
                {(error as Error).message}
              </p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Abrindo o calendário…
            </p>
          )}
        </div>
      </Fundo>
    )
  }

  if (!data.liberado) return <Trancado motivo={data.motivo} />

  return (
    <Fundo>
      <div className="devo-scroll relative h-full overflow-y-auto overflow-x-hidden">
        <Tela d={data} checkin={checkin} recarregar={() => void mutate()} onMelissa={() => cenas.abrir(CENA)} />
      </div>
      {natal && <ProjecaoNatal eventos={data.eventos} hoje={data.hoje} />}
    </Fundo>
  )
}

type Liberado = Extract<CalendarioPayload, { liberado: true }>
type Checkin = ReturnType<typeof useCalendario>['checkin']

/* ------------------------------------------------------------------ Moldura */

/** Mármore negro sobre o abismo, com a luz vinho alta (a cor da paleta de referência). */
function Fundo({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden bg-dv-abyss">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] opacity-40" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_srgb,var(--dv-wine)_75%,transparent),transparent_72%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,var(--dv-abyss))]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

/** Lâmina com chanfro: filete de prata desbotada (ou vinho) e tampo do abismo ao vinho. */
function Lamina({
  children,
  tom = 'prata',
  className,
  ariaLabel,
  as: Tag = 'section',
}: {
  children: ReactNode
  tom?: 'prata' | 'vinho'
  className?: string
  ariaLabel?: string
  as?: 'section' | 'div' | 'li'
}) {
  return (
    <Tag aria-label={ariaLabel} className={cn('relative isolate', className)} style={{ '--dv-cut': '14px' } as CSSProperties}>
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut absolute inset-0 -z-10',
          tom === 'vinho'
            ? 'bg-[linear-gradient(135deg,var(--dv-wine-text),var(--dv-wine)_40%,var(--dv-wine-text)_100%)] opacity-80'
            : 'bg-[linear-gradient(135deg,var(--dv-silver),var(--dv-fog)_45%,var(--dv-silver))] opacity-70',
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'dv-cut absolute inset-px -z-10',
          tom === 'vinho' ? 'bg-[linear-gradient(180deg,var(--dv-wine-deep),var(--dv-abyss)_85%)]' : 'bg-[linear-gradient(180deg,var(--dv-ink-2),var(--dv-abyss))]',
        )}
        style={{ '--dv-cut': '13.6px' } as CSSProperties}
      />
      {children}
    </Tag>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo>
      <div className="flex h-full flex-col justify-end px-4 pb-6">
        <Lamina ariaLabel="Calendário: trancado" className="animate-dv-rise">
          <div className="flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemCalendario} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Calendário Devo</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </Lamina>
      </div>
    </Fundo>
  )
}

/* ------------------------------------------------------------------ Tela */

function Tela({ d, checkin, recarregar, onMelissa }: { d: Liberado; checkin: Checkin; recarregar: () => void; onMelissa: () => void }) {
  const [revelacao, setRevelacao] = useState<(ResgateResultado & { titulo: string }) | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [selecionado, setSelecionado] = useState<Dia>(d.hoje)

  const marcar = async (chave: string, alvo: { tipo: 'diario' } | { tipo: 'evento'; eventoId: string }, titulo: string) => {
    if (ocupado) return
    setOcupado(chave)
    setErro(null)
    try {
      const r = await checkin(alvo)
      setRevelacao({ ...r, titulo })
    } catch (e) {
      playSfx('error')
      setErro(e instanceof CalErro && e.status === 409 ? e.message : (e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  const hojeTxt = dataLonga(d.hoje)
  return (
    <div className="px-4 pb-12 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dv-label animate-dv-fade text-[10px] text-dv-wine-text">Grandioso Calendário Devo</p>
          <h1 className="animate-dv-cut-in mt-2 font-serif text-[34px] font-medium uppercase leading-[0.95] tracking-[0.02em] text-dv-text">Calendário</h1>
          <p className="animate-dv-fade mt-2 font-body text-[15px] italic leading-snug text-dv-text-2 [animation-delay:200ms]">{hojeTxt.charAt(0).toUpperCase() + hojeTxt.slice(1)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            playSfx('open')
            onMelissa()
          }}
          aria-label="Rever a apresentação da Melissa"
          className="dv-focus group mt-1 flex shrink-0 flex-col items-center gap-1"
        >
          <span className="relative grid size-14 place-items-center">
            <span aria-hidden="true" className="absolute inset-1 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--dv-amethyst)_30%,transparent),transparent_70%)]" />
            <EmblemCalendario metal className="relative size-11 transition-transform group-active:scale-95" />
          </span>
          <span aria-hidden="true" className="dv-label text-[9.5px] text-dv-text-2">Melissa</span>
        </button>
      </header>

      {erro && (
        <p role="alert" className="mt-4 border border-dv-wine-text/40 bg-dv-wine-deep/80 px-3 py-2 font-body text-[14px] leading-snug text-dv-wine-text">
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-5">
        <CheckinDiarioView d={d} recarregar={recarregar} ocupado={ocupado === 'diario'} onMarcar={() => marcar('diario', { tipo: 'diario' }, 'Check-in diário')} />
        {d.extras.map((x) => (
          <CheckinExtraView key={x.eventoId} x={x} ocupado={ocupado === x.eventoId} onMarcar={() => marcar(x.eventoId, { tipo: 'evento', eventoId: x.eventoId }, x.titulo)} />
        ))}
        <Mes d={d} selecionado={selecionado} onSelecionar={setSelecionado} />
        <Proximos d={d} />
      </div>

      {revelacao && <Revelacao r={revelacao} onFim={() => setRevelacao(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ Check-in */

function tickets(slots: CheckinSlot[]): TicketData[] {
  return slots.map((s) => ({
    index: s.posicao,
    reward: <RecompensaIcone icone={s.recompensa.icone} className="scale-[1.6]" />,
    amount: s.recompensa.valor,
    caption: s.recompensa.legenda,
    state: s.estado === 'feito' ? 'claimed' : s.estado === 'hoje' ? 'today' : 'upcoming',
  }))
}

/** Rola a tira até o dia de hoje (Dia 5–7 ficam fora da tela de 390 px). */
function useRolarParaHoje(posicao: number) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ol = ref.current?.querySelector('ol')
    const li = ol?.children[Math.max(0, posicao - 1)] as HTMLElement | undefined
    if (!ol || !li) return
    ol.scrollTo({ left: Math.max(0, li.offsetLeft - ol.clientWidth / 2 + li.clientWidth / 2), behavior: 'auto' })
  }, [posicao])
  return ref
}

function useRelogio(alvo: number) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const ms = Math.max(0, alvo - agora)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return { ms, txt: [h, m, s].map((n) => String(n).padStart(2, '0')).join(':') }
}

function CheckinDiarioView({ d, ocupado, onMarcar, recarregar }: { d: Liberado; ocupado: boolean; onMarcar: () => void; recarregar: () => void }) {
  const c = d.diario
  const hoje = c.slots[c.posicao - 1]
  const ref = useRolarParaHoje(c.posicao)
  const relogio = useRelogio(c.proximoDiaEm)
  // Virou o dia (meia-noite de Brasília) com a tela aberta: pede o estado novo uma vez.
  const virou = useRef(false)
  useEffect(() => {
    if (!c.feitoHoje || relogio.ms > 0 || virou.current) return
    virou.current = true
    recarregar()
  }, [c.feitoHoje, relogio.ms, recarregar])
  return (
    <Lamina ariaLabel="Check-in diário" className="animate-dv-rise">
      <div className="p-4 pb-3">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-semibold uppercase leading-tight tracking-[0.14em] text-dv-text">Check-in diário</h2>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">Ciclo de {c.slots.length} dias</p>
          </div>
          <span className="dv-cut-diag shrink-0 bg-dv-wine px-2.5 py-1.5 font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-dv-text shadow-[inset_0_0_0_1px_var(--dv-wine-text)]" style={{ '--dv-cut': '6px' } as CSSProperties}>
            Dia {c.posicao} de {c.slots.length}
          </span>
        </header>
      </div>
      <div ref={ref} className="px-3">
        <RewardStrip items={tickets(c.slots)} label="Recompensas do ciclo" onClaim={c.feitoHoje ? undefined : () => onMarcar()} loadingIndex={ocupado ? c.posicao : undefined} />
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1">
        {c.feitoHoje ? (
          <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-body text-[15px] text-dv-text-2">
            <span>Presença marcada. Volte amanhã.</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-dv-silver dv-tabular" aria-label={`Próximo check-in em ${relogio.txt}`}>
              Próximo em {relogio.txt}
            </span>
          </p>
        ) : (
          <Button block size="lg" loading={ocupado} sfx={false} onClick={onMarcar} aria-label={`Marcar presença: ${hoje?.recompensa.rotulo ?? ''}`}>
            Marcar presença
          </Button>
        )}
        <p className="font-body text-[13.5px] leading-snug text-dv-text-3">
          {c.falta === 'pausa' ? 'Perdeu um dia? O ciclo espera e continua de onde parou.' : 'Perder um dia faz o ciclo voltar ao Dia 1.'}
        </p>
      </div>
    </Lamina>
  )
}

function CheckinExtraView({ x, ocupado, onMarcar }: { x: CheckinExtra; ocupado: boolean; onMarcar: () => void }) {
  const ref = useRolarParaHoje(x.posicao)
  const proximo = x.slots[x.posicao - 1]
  return (
    <Lamina tom="vinho" ariaLabel={x.titulo} className="animate-dv-rise [animation-delay:120ms]">
      <div className="flex items-start gap-3 p-4 pb-3">
        <span aria-hidden="true" className="-my-1 size-14 shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)]">
          <RecompensaIcone icone="presente" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="dv-label text-[10px] text-dv-wine-text">Data comemorativa · {x.evento}</p>
          <h2 className="mt-1 font-display text-[17px] font-semibold uppercase leading-tight tracking-[0.14em] text-dv-text">{x.titulo}</h2>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">Até {dataCurtaFaixa(x.ate, x.ate)}</p>
        </div>
      </div>
      <div ref={ref} className="px-3">
        <RewardStrip items={tickets(x.slots)} label={`Recompensas: ${x.titulo}`} onClaim={x.feitoHoje ? undefined : () => onMarcar()} loadingIndex={ocupado ? x.posicao : undefined} />
      </div>
      <div className="px-4 pb-4 pt-1">
        {x.feitoHoje ? (
          <p role="status" className="font-body text-[15px] text-dv-text-2">
            {x.posicao >= x.slots.length && x.slots.every((s) => s.estado === 'feito') ? 'Tudo resgatado neste evento.' : 'Presença marcada neste evento. Volte amanhã.'}
          </p>
        ) : (
          <Button block size="md" variant="secondary" loading={ocupado} sfx={false} onClick={onMarcar} aria-label={`Marcar presença no evento: ${proximo?.recompensa.rotulo ?? ''}`}>
            Marcar presença no evento
          </Button>
        )}
      </div>
    </Lamina>
  )
}

/* ------------------------------------------------------------------ Revelação do resgate */

/**
 * Revelação curta (≈1,2 s): a recompensa sobe do vinho, o carimbo "PRESENTE" bate. Toque em qualquer lugar,
 * Esc ou "Pular" fecham. Com movimento reduzido, aparece já pronta. Sons só com o som ligado (playSfx).
 */
function Revelacao({ r, onFim }: { r: ResgateResultado & { titulo: string }; onFim: () => void }) {
  const pt = usePlayerText()
  const fechar = useRef(onFim)
  fechar.current = onFim
  useEffect(() => {
    playSfx('bell')
    const t1 = window.setTimeout(() => playSfx(r.recompensa.icone === 'carta' ? 'card' : 'reveal'), 260)
    const t2 = window.setTimeout(() => playSfx('thud'), 820)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar.current()
    window.addEventListener('keydown', esc)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('keydown', esc)
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
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  useEffect(() => setAlvo(document.body), [])
  if (!alvo) return null
  // Portal no body: cobre o shell inteiro (barra de status e avisos) e fica abaixo das cenas (z 95).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Recompensa resgatada: ${r.recompensa.rotulo}`}
      onClick={() => fechar.current()}
      className="cal-rev fixed inset-0 z-[94] flex flex-col items-center justify-center bg-dv-abyss/90 px-6 text-center backdrop-blur-[2px]"
    >
      <style>{REV_CSS}</style>
      <button type="button" onClick={() => fechar.current()} className="dv-focus absolute right-3 top-[calc(env(safe-area-inset-top)+16px)] min-h-11 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2">
        Pular
      </button>
      <span aria-hidden="true" className="cal-rev-halo pointer-events-none absolute left-1/2 top-[42%] size-[min(120vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--dv-wine)_90%,transparent),color-mix(in_srgb,var(--dv-wine-deep)_60%,transparent)_55%,transparent)]" />
      <p className="cal-rev-txt relative dv-label text-[10.5px] text-dv-wine-text">
        {r.titulo} · {r.tipo === 'diario' ? `Dia ${r.posicao}` : `Resgate ${r.posicao}`}
      </p>
      <div className="cal-rev-item relative mt-6 grid place-items-center">
        {r.recompensa.icone === 'carta' && r.aplicado.cartaId ? (
          <DevoCard cardId={r.aplicado.cartaId} size="md" />
        ) : (
          <span className="grid size-36 place-items-center">
            <RecompensaIcone icone={r.recompensa.icone} grande className="drop-shadow-[0_10px_24px_rgba(0,0,0,0.8)]" />
          </span>
        )}
        <span className="cal-rev-selo pointer-events-none absolute -bottom-6 -right-10">
          <Stamp text="PRESENTE" shape="round" tone="gold" size={92} rotate={-12} ring="CALENDÁRIO DEVO · CHECK-IN · " animate />
        </span>
      </div>
      <p className="cal-rev-txt relative mt-10 font-serif text-[30px] font-medium uppercase leading-tight tracking-[0.02em] text-dv-text [animation-delay:380ms]">{r.recompensa.rotulo}</p>
      <p className="cal-rev-txt relative mt-2 max-w-xs font-body text-[15px] leading-snug text-dv-text-2 [animation-delay:480ms]">{pt(nota)}</p>
      <p className="cal-rev-txt relative mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3 [animation-delay:900ms]">Toque para continuar</p>
    </div>,
    alvo,
  )
}

const REV_CSS = `
.cal-rev{animation:cal-fade .22s ease-out both}
.cal-rev-halo{animation:cal-halo 1.1s cubic-bezier(.16,1,.3,1) both}
.cal-rev-item{animation:cal-item .7s cubic-bezier(.16,1,.3,1) .12s both}
.cal-rev-txt{animation:cal-fade .4s ease-out .3s both}
.cal-rev-selo{animation:cal-fade .01s linear .72s both}
@keyframes cal-fade{from{opacity:0}to{opacity:1}}
@keyframes cal-halo{from{opacity:0;transform:translate(-50%,-50%) scale(.4)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes cal-item{from{opacity:0;transform:translateY(26px) scale(.7)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.cal-rev,.cal-rev-halo,.cal-rev-item,.cal-rev-txt,.cal-rev-selo{animation:none}}
`

/* ------------------------------------------------------------------ Mês */

const doMes = (e: EventoVista, ano: number, mes: number) => {
  const ini = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fim = somaDias(`${mes === 12 ? ano + 1 : ano}-${String(mes === 12 ? 1 : mes + 1).padStart(2, '0')}-01`, -1)
  return e.ocorrencia <= fim && e.ate >= ini
}

function Mes({ d, selecionado, onSelecionar }: { d: Liberado; selecionado: Dia; onSelecionar: (dia: Dia) => void }) {
  const h = partes(d.hoje)
  const [cursor, setCursor] = useState({ ano: h.ano, mes: h.mes })
  // Limites: do mês passado até 12 meses à frente (o servidor manda as ocorrências dessa janela).
  const idx = (c: { ano: number; mes: number }) => c.ano * 12 + c.mes
  const min = idx(h) - 1
  const max = idx(h) + 12
  const mover = (n: number) => {
    const v = idx(cursor) + n
    if (v < min || v > max) return
    playSfx('click')
    setCursor({ ano: Math.floor((v - 1) / 12), mes: ((v - 1) % 12) + 1 })
  }
  const eventos = useMemo(() => d.eventos.filter((e) => doMes(e, cursor.ano, cursor.mes)), [d.eventos, cursor])
  const primeiro = `${cursor.ano}-${String(cursor.mes).padStart(2, '0')}-01`
  const vazio = diaDaSemana(primeiro)
  const ultimo = partes(somaDias(`${cursor.mes === 12 ? cursor.ano + 1 : cursor.ano}-${String(cursor.mes === 12 ? 1 : cursor.mes + 1).padStart(2, '0')}-01`, -1)).dia
  const dias = Array.from({ length: ultimo }, (_, i) => `${primeiro.slice(0, 8)}${String(i + 1).padStart(2, '0')}`)
  const doDia = (dia: Dia) => eventos.filter((e) => e.ocorrencia <= dia && e.ate >= dia)
  const sel = doDia(selecionado)
  const selNoMes = selecionado.slice(0, 7) === primeiro.slice(0, 7)

  return (
    <Lamina ariaLabel="Mês" className="animate-dv-rise [animation-delay:200ms]">
      <div className="p-4">
        <header className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => mover(-1)} disabled={idx(cursor) <= min} aria-label="Mês anterior" className="dv-focus grid size-11 place-items-center text-dv-text-2 disabled:opacity-30">
            <GlyphArrow className="size-5 rotate-180" />
          </button>
          <h2 aria-live="polite" className="text-center font-serif text-[24px] font-medium capitalize leading-none text-dv-text">
            {nomeMes(cursor.mes)} <span className="text-dv-text-3">{cursor.ano}</span>
          </h2>
          <button type="button" onClick={() => mover(1)} disabled={idx(cursor) >= max} aria-label="Próximo mês" className="dv-focus grid size-11 place-items-center text-dv-text-2 disabled:opacity-30">
            <GlyphArrow className="size-5" />
          </button>
        </header>

        <div role="grid" aria-label={`${nomeMes(cursor.mes)} de ${cursor.ano}`} className="mt-3">
          <div role="row" className="grid grid-cols-7">
            {SEMANA_CURTA.map((s, i) => (
              <span key={i} role="columnheader" className="pb-2 text-center font-mono text-[10.5px] uppercase tracking-[0.12em] text-dv-text-3">
                {s}
              </span>
            ))}
          </div>
          <div role="row" className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: vazio }, (_, i) => (
              <span key={`v${i}`} aria-hidden="true" />
            ))}
            {dias.map((dia) => {
              const evs = doDia(dia)
              const atencao = evs.some((e) => e.enfase === 'atencao')
              const folga = !atencao && evs.some((e) => e.enfase === 'folga')
              const hoje = dia === d.hoje
              const ativo = dia === selecionado
              const n = Number(dia.slice(8))
              return (
                <button
                  key={dia}
                  type="button"
                  role="gridcell"
                  aria-selected={ativo}
                  aria-label={`${n} de ${nomeMes(cursor.mes)}${hoje ? ', hoje' : ''}${evs.length ? `: ${evs.map((e) => `${e.titulo} (${ENFASE_ROTULO[e.enfase]})`).join(', ')}` : ''}`}
                  onClick={() => {
                    playSfx('click')
                    onSelecionar(dia)
                  }}
                  className={cn(
                    'dv-focus relative mx-auto flex h-11 w-full max-w-[46px] flex-col items-center justify-center font-body text-[16px] leading-none transition-colors dv-tabular',
                    atencao ? 'bg-dv-wine text-dv-text' : folga ? 'bg-dv-fog/70 text-dv-text' : dia < d.hoje ? 'text-dv-text-3' : 'text-dv-text-2',
                    ativo && 'shadow-[inset_0_0_0_1.5px_var(--dv-gold-bright)]',
                    hoje && !ativo && 'shadow-[inset_0_0_0_1.5px_var(--dv-silver)]',
                  )}
                  style={atencao || folga ? ({ clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)' } as CSSProperties) : undefined}
                >
                  {n}
                  {evs.length > 0 && <span aria-hidden="true" className={cn('absolute bottom-1 size-[5px] rotate-45', atencao ? 'bg-dv-wine-text' : 'bg-dv-silver')} />}
                  {hoje && <span aria-hidden="true" className="absolute -top-px left-1/2 h-[3px] w-4 -translate-x-1/2 bg-dv-gold-bright" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-dv-text-3">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 bg-dv-wine shadow-[inset_0_0_0_1px_var(--dv-wine-text)]" /> Fique atento
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 bg-dv-fog shadow-[inset_0_0_0_1px_var(--dv-silver)]" /> Dia de folga
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-[3px] w-3 bg-dv-gold-bright" /> Hoje
          </span>
        </div>

        {selNoMes && (
          <div className="mt-4 border-t border-dv-line pt-3" aria-live="polite">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text-3">{dataLonga(selecionado)}</p>
            {sel.length ? (
              <ul className="mt-2 flex flex-col gap-2.5">
                {sel.map((e) => (
                  <li key={`${e.id}-${e.ocorrencia}`} className="flex items-start gap-2.5">
                    <MarcaEnfase enfase={e.enfase} className="mt-1.5" />
                    <div className="min-w-0">
                      <p className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text">{e.titulo}</p>
                      {e.descricao && <p className="mt-0.5 font-body text-[14.5px] leading-snug text-dv-text-2">{e.descricao}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 font-body text-[15px] text-dv-text-2">Nenhum evento programado.</p>
            )}
          </div>
        )}
      </div>
    </Lamina>
  )
}

function MarcaEnfase({ enfase, className }: { enfase: Enfase; className?: string }) {
  return <span aria-hidden="true" className={cn('size-2.5 shrink-0 rotate-45', enfase === 'atencao' ? 'bg-dv-wine-text' : enfase === 'folga' ? 'bg-dv-silver' : 'shadow-[inset_0_0_0_1.5px_var(--dv-line-strong)]', className)} />
}

/* ------------------------------------------------------------------ Próximos */

const quando = (e: EventoVista) => (e.emDias < 0 ? 'Acontecendo agora' : e.emDias === 0 ? 'Hoje' : e.emDias === 1 ? 'Amanhã' : `Em ${e.emDias} dias`)

function Proximos({ d }: { d: Liberado }) {
  const lista = d.eventos.filter((e) => e.ate >= d.hoje).slice(0, 8)
  return (
    <section aria-label="Próximos eventos" className="animate-dv-rise [animation-delay:260ms]">
      <div className="flex items-center gap-3 px-1">
        <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.16em] text-dv-text">Próximos eventos</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-dv-wine-text/60 via-dv-line-strong to-transparent" />
      </div>
      {lista.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {lista.map((e) => (
            <EventoCartao key={`${e.id}-${e.ocorrencia}`} e={e} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 px-1 font-body text-[15px] text-dv-text-2">Nada programado por enquanto. A Companhia avisa quando houver.</p>
      )}
    </section>
  )
}

export function EventoCartao({ e, destaque = false, as = 'li' }: { e: EventoVista; destaque?: boolean; as?: 'li' | 'div' }) {
  // `destaque` = projeção do tutorial: cartão enxuto (sem o selo de check-in), para não cobrir a Melissa.
  const p = partes(e.ocorrencia)
  return (
    <Lamina as={as} tom={e.enfase === 'atencao' ? 'vinho' : 'prata'} ariaLabel={`${e.titulo}: ${dataCurtaFaixa(e.ocorrencia, e.ate)}, ${ENFASE_ROTULO[e.enfase]}`} className={cn(destaque && 'drop-shadow-[0_0_28px_color-mix(in_srgb,var(--dv-wine-text)_45%,transparent)]')}>
      <div className="flex gap-3 p-2.5 pr-3.5">
        <span className="dv-cut relative size-[92px] shrink-0 overflow-hidden" style={{ '--dv-cut': '10px' } as CSSProperties}>
          {e.arte ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.arte} srcSet={srcSetArte(e.arte)} sizes="92px" alt="" className="size-full object-cover" loading="lazy" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,var(--dv-abyss))] px-1.5 pb-1 pt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text">
                {String(p.dia).padStart(2, '0')} {mesCurto(p.mes)}
              </span>
            </>
          ) : (
            <ArteVazia dia={p.dia} mes={mesCurto(p.mes)} enfase={e.enfase} />
          )}
        </span>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">
            {dataCurtaFaixa(e.ocorrencia, e.ate)} · {quando(e)}
          </p>
          <h3 className="mt-1 font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">{e.titulo}</h3>
          {e.descricao && <p className="mt-1 line-clamp-2 font-body text-[14.5px] leading-snug text-dv-text-2">{e.descricao}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {e.enfase !== 'normal' && (
              <span
                className={cn(
                  'dv-cut-diag inline-flex h-6 items-center gap-1.5 px-2 font-mono text-[10px] uppercase leading-none tracking-[0.12em]',
                  e.enfase === 'atencao' ? 'bg-dv-wine text-dv-text shadow-[inset_0_0_0_1px_var(--dv-wine-text)]' : 'bg-dv-fog/60 text-dv-text shadow-[inset_0_0_0_1px_var(--dv-silver)]',
                )}
                style={{ '--dv-cut': '5px' } as CSSProperties}
              >
                <MarcaEnfase enfase={e.enfase} className="size-[6px]" />
                {ENFASE_ROTULO[e.enfase]}
              </span>
            )}
            {e.checkin && !destaque && (
              <span className="dv-cut-diag inline-flex h-6 items-center px-2 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-dv-gold-bright shadow-[inset_0_0_0_1px_var(--dv-line-gold)]" style={{ '--dv-cut': '5px' } as CSSProperties}>
                Check-in especial
              </span>
            )}
          </div>
        </div>
      </div>
    </Lamina>
  )
}

/* ------------------------------------------------------------------ Projeção do Natal (tutorial) */

const NATAL_EXEMPLO = (hoje: Dia): EventoVista => {
  const ano = Number(hoje.slice(0, 4)) + (hoje.slice(5) > '12-25' ? 1 : 0)
  return {
    id: 'exemplo-natal',
    titulo: 'Natal',
    descricao: 'As luzes ficam acesas até tarde e quase ninguém tem pressa.',
    inicio: `${ano}-12-25`,
    fim: `${ano}-12-25`,
    ocorrencia: `${ano}-12-25`,
    ate: `${ano}-12-25`,
    anual: true,
    enfase: 'folga',
    arte: '/images/calendario/natal-512.webp',
    checkin: null,
    emDias: 0,
  }
}

/**
 * "*Mostra exemplo de Evento de Natal*": por cima da cena da Melissa (z acima do motor), o cartão do Natal do
 * próprio calendário (ou um exemplo, se o Owner tirou o Natal) desce com a marca "Exemplo".
 */
function ProjecaoNatal({ eventos, hoje }: { eventos: EventoVista[]; hoje: Dia }) {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  useEffect(() => setAlvo(document.body), [])
  const natal = eventos.find((e) => e.ocorrencia.slice(5) === '12-25' && /natal/i.test(e.titulo)) ?? NATAL_EXEMPLO(hoje)
  if (!alvo) return null
  return createPortal(
    <div role="note" aria-label="Exemplo de evento: Natal" className="cal-natal pointer-events-none fixed inset-x-0 top-[max(56px,calc(env(safe-area-inset-top)+48px))] z-[96] mx-auto w-[min(calc(100%-32px),400px)]">
      <style>{`.cal-natal{animation:cal-natal .6s cubic-bezier(.16,1,.3,1) both}@keyframes cal-natal{from{opacity:0;transform:translateY(-18px) scale(.96)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.cal-natal{animation:none}}`}</style>
      <p className="mb-1.5 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dv-gold-bright">
        <span aria-hidden="true" className="size-1.5 rotate-45 bg-dv-gold-bright" /> Exemplo · Grandioso Calendário Devo
      </p>
      <EventoCartao e={natal} destaque as="div" />
    </div>,
    alvo,
  )
}
