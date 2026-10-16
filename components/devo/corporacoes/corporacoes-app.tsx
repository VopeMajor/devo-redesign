'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { CorpLiberado } from '@/lib/devo/corporacoes'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemCorporacoes, EmblemMark } from '../kit/emblems'
import { corpPost, useCorporacoes } from './dados'
import { ChamadaHolograma, HoloEstilos, SeloCompanhia, pedirChamadaMelissa } from './holograma'
import { MinhaCorpView } from './minha-corp'
import { SemCorp } from './sem-corp'

/**
 * Corporações (DIRECAO-3 §2; regras do dono no diálogo da Melissa). Página com o campo do código de
 * identificação, pedido de entrada aprovado por líder/vice, membros e cargos, fundação (Tempo + aprovação
 * administrativa), transferência de cartas, recrutamento no Salão e o status legal (oficial / Necro-Corporação).
 * Trancado até a flag `corporacoes` (Owner e Anfitrião: liberado) — quem decide é o servidor.
 *
 * Apresentação: na primeira entrada (ou pelo botão da Companhia) pede a cena `melissa-corporacoes` pelo evento
 * `devo:cena`; se o motor da Narrativa não assumir, toca o fallback holográfico local.
 */
export function CorporacoesApp() {
  const { data, error, isLoading, mutate, agir } = useCorporacoes()
  const [holo, setHolo] = useState(false)
  const pedida = useRef(false)

  const chamar = (replay: boolean) => {
    if (pedirChamadaMelissa(replay)) {
      // A Narrativa assumiu a cena: a apresentação conta como vista.
      if (!replay) void corpPost({ action: 'apresentacao.concluir' }).catch(() => null).then(() => mutate())
      return
    }
    setHolo(true)
  }

  useEffect(() => {
    if (!data?.liberado || data.apresentado || pedida.current) return
    pedida.current = true
    chamar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!data) {
    return (
      <Fundo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p role="alert" className="font-body text-[16px] text-dv-text-2">{(error as Error).message}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Consultando a Companhia…
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
        <Tela d={data} agir={agir} onCompanhia={() => chamar(true)} />
      </div>
      {holo && (
        <ChamadaHolograma
          podePular={data.podePular}
          onFim={() => {
            setHolo(false)
            if (!data.apresentado) void corpPost({ action: 'apresentacao.concluir' }).catch(() => null).then(() => mutate())
          }}
        />
      )}
    </Fundo>
  )
}

/** Mármore negro com uma luz fria alta (a Companhia vigia) e o piso de veios. Sem cena 3D: tela de leitura. */
function Fundo({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <HoloEstilos />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] opacity-50" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(60%_55%_at_50%_0%,rgba(138,124,200,0.16),transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.6))]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo>
      <div className="flex h-full flex-col justify-end px-4 pb-6">
        <section aria-label="Corporações: trancado" className="animate-dv-rise relative" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgba(238,237,235,0.34),rgba(238,237,235,0.12)_45%,rgba(238,237,235,0.26))]" />
          <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,#1a1a1d,#0e0e10)]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
          <div className="relative flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemCorporacoes} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Corporações</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Fundo>
  )
}

function Tela({ d, agir, onCompanhia }: { d: CorpLiberado; agir: (b: Record<string, unknown>) => Promise<unknown>; onCompanhia: () => void }) {
  return (
    <div className="px-4 pb-10 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dv-label animate-dv-fade text-[10px] text-dv-amethyst-text">Companhia de Despertados · registro</p>
          <h1 className="animate-dv-cut-in mt-2 font-serif text-[34px] font-medium uppercase leading-[0.95] tracking-[0.02em] text-dv-text">Corporações</h1>
          <p className="animate-dv-fade mt-2 font-body text-[15px] italic leading-snug text-dv-text-2 [animation-delay:200ms]">Poucos Records alcançam o sucesso trabalhando sozinhos.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            playSfx('open')
            onCompanhia()
          }}
          aria-label="Chamar a Companhia"
          className="dv-focus group mt-1 flex shrink-0 flex-col items-center gap-1"
        >
          <span className="relative grid size-14 place-items-center">
            <span aria-hidden="true" className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(168,155,224,0.28),transparent_70%)]" />
            <SeloCompanhia aceso className="relative size-11 transition-transform group-active:scale-95" />
          </span>
          <span aria-hidden="true" className="dv-label text-[9.5px] text-dv-text-2">Companhia</span>
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        {d.minha ? <MinhaCorpView d={d} agir={agir} /> : <SemCorp d={d} agir={agir} />}
        <CodigoRegras d={d} />
      </div>
    </div>
  )
}

/** Código de regras da Companhia (texto provisório para o dono) — sempre com o selo holográfico. */
function CodigoRegras({ d }: { d: CorpLiberado }) {
  const [aberto, setAberto] = useState(false)
  return (
    <section aria-label={d.regras.titulo} className="relative" style={{ '--dv-cut': '12px' } as CSSProperties}>
      <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgba(194,185,236,0.5),rgba(186,176,159,0.2)_50%,rgba(194,185,236,0.35))]" />
      <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,rgba(26,24,34,0.97),rgba(12,12,14,0.98))]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      <span aria-hidden="true" className="dv-cut pointer-events-none absolute inset-px opacity-30 [background:repeating-linear-gradient(0deg,rgba(236,229,216,0.12)_0_1px,transparent_1px_4px)]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => {
          playSfx(aberto ? 'close' : 'open')
          setAberto(!aberto)
        }}
        className="dv-focus relative flex min-h-16 w-full items-center gap-3 p-4 text-left"
      >
        <SeloCompanhia aceso className="size-9 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.1em] text-dv-text">{d.regras.titulo}</span>
          <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">
            Oficial ou Necro-Corporação{d.regras.provisorio ? ' · texto provisório' : ''}
          </span>
        </span>
        <span aria-hidden="true" className={cn('font-mono text-[18px] text-dv-text-2 transition-transform', aberto && 'rotate-45')}>
          +
        </span>
      </button>
      {aberto && (
        <ol className="animate-dv-fade relative flex flex-col gap-2.5 px-4 pb-4">
          {d.regras.artigos.map((a) => (
            <li key={a} className="font-body text-[15px] leading-relaxed text-dv-text-2">
              {a}
            </li>
          ))}
          <li className="mt-1 border-l-2 border-dv-blood pl-3 font-body text-[14px] leading-snug text-dv-blood-text">
            Quando essas regras são violadas, a Corporação passa a ser classificada como terrorista: uma Necro-Corporação.
          </li>
        </ol>
      )}
    </section>
  )
}
