'use client'

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { SalaoLiberado } from '@/lib/devo/salao'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemMascaras, EmblemMark } from '../kit/emblems'
import { Tabs } from '../kit/tabs'
import { callName, useDevo } from '../state/devo-store'
import { AbaAnuncios, AbaBandeja, AbaLeiloes, AbaMercado } from './salao-abas'
import { CalendarioDevo } from './salao-calendario'
import { SalaoCena } from './salao-cena'
import { ContadorSalao } from './salao-contador'
import { salaoPost, useSalao } from './salao-dados'
import { SalaoHerdeiro } from './salao-herdeiro'

type Aba = 'leiloes' | 'mercado' | 'anuncios' | 'bandeja'

/**
 * Salão das Máscaras (DIRECAO-3 §2). Primeira entrada: o Herdeiro apresenta o salão (texto literal do dono).
 * Depois: o palco com o contador enorme até a próxima abertura (ou até o fim da edição aberta), as abas Leilões
 * (principal), Mercado, Propostas/Anúncios e Bandeja, e o Calendário Devo. Trancado até vencer o Deadly Vote
 * tutorial (Owner e Anfitrião: sempre liberado) — quem decide é o servidor.
 */
export function SalaoApp() {
  const { state } = useDevo()
  const { data, error, isLoading, mutate, agir } = useSalao()
  const [cena, setCena] = useState<'auto' | 'aberta' | 'fechada'>('auto')
  const mostrarCena = !!data && data.liberado && (cena === 'aberta' || (cena === 'auto' && !data.apresentado))
  useEffect(() => {
    if (mostrarCena && cena === 'auto') setCena('aberta')
  }, [mostrarCena, cena])

  if (!data) {
    return (
      <Fundo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p className="font-body text-[16px] text-dv-text-2">{(error as Error).message}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Abrindo as cortinas…
            </p>
          )}
        </div>
      </Fundo>
    )
  }

  if (!data.liberado) return <Trancado motivo={data.motivo} />

  return (
    <>
      {mostrarCena && (
        <SalaoHerdeiro
          relogio={data.relogio}
          genero={state.profile?.gender}
          nome={callName(state) || null}
          podePular={data.podePular}
          onFim={() => {
            setCena('fechada')
            void salaoPost({ action: 'apresentacao.concluir' })
              .catch(() => null)
              .then(() => mutate())
          }}
        />
      )}
      <Tela d={data} agir={agir} recarregar={() => mutate()} />
    </>
  )
}

function Fundo({ children, aberto = false }: { children: ReactNode; aberto?: boolean }) {
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <SalaoCena aberto={aberto} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo>
      <div className="flex h-full flex-col justify-end px-4 pb-6">
        <section aria-label="Salão das Máscaras: trancado" className="animate-dv-rise relative" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgba(238,237,235,0.34),rgba(238,237,235,0.12)_45%,rgba(238,237,235,0.26))]" />
          <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,#1a1a1d,#0e0e10)]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
          <div className="relative flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemMascaras} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Salão das Máscaras</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Fundo>
  )
}

function Tela({ d, agir, recarregar }: { d: SalaoLiberado; agir: (b: Record<string, unknown>) => Promise<unknown>; recarregar: () => void }) {
  const [aba, setAba] = useState<Aba>('leiloes')
  const [calendario, setCalendario] = useState(false)
  const pendentesBandeja = d.meusLotes.filter((l) => l.status === 'avaliacao').length
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <SalaoCena aberto={d.relogio.aberto} />
      <div className="devo-scroll relative z-10 h-full overflow-y-auto overflow-x-hidden">
        {/* palco: o número enorme */}
        <header className="relative px-4 pb-6 pt-[13%]">
          <button
            type="button"
            onClick={() => {
              playSfx('open')
              setCalendario(true)
            }}
            className="dv-focus dv-cut-diag absolute right-3 top-3 flex min-h-11 items-center gap-2 bg-black/55 px-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-text shadow-[inset_0_0_0_1px_rgba(186,176,159,0.55)] hover:shadow-[inset_0_0_0_1px_#ece5d8]"
            style={{ '--dv-cut': '7px' } as CSSProperties}
          >
            <span aria-hidden="true" className="size-[7px] rotate-45 bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.9)]" />
            Calendário Devo
          </button>
          <ContadorSalao relogio={d.relogio} manual={!!d.owner} className="animate-dv-fade" />
          {d.eventos.some((e) => e.fim > d.agora && e.inicio - d.agora < 16 * 86_400_000) && (
            <p className="mx-auto mt-4 w-fit max-w-full truncate px-3 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-amethyst-text">
              Em breve · {d.eventos.find((e) => e.fim > d.agora)?.titulo}
            </p>
          )}
        </header>

        <div className={cn('relative bg-[linear-gradient(180deg,rgba(10,10,11,0.4),rgba(10,10,11,0.92)_80px)] px-4 pb-10')}>
          <Tabs<Aba>
            label="Seções do Salão"
            items={[
              { value: 'leiloes', label: 'Leilões', count: d.relogio.aberto ? d.leiloes.length : undefined },
              { value: 'mercado', label: 'Mercado' },
              { value: 'anuncios', label: 'Anúncios' },
              { value: 'bandeja', label: 'Bandeja', count: pendentesBandeja || undefined },
            ]}
            value={aba}
            onValueChange={setAba}
            fill
            className="[&_[role=tab]]:min-w-0 [&_[role=tab]]:px-1.5 [&_[role=tab]]:text-[12px] [&_[role=tab]]:tracking-[0.1em]"
            panelClassName="pt-4"
          >
            <div key={aba} className="animate-dv-fade">
              {aba === 'leiloes' && <AbaLeiloes d={d} agir={agir} />}
              {aba === 'mercado' && <AbaMercado d={d} agir={agir} />}
              {aba === 'anuncios' && <AbaAnuncios d={d} agir={agir} />}
              {aba === 'bandeja' && (
                <AbaBandeja
                  d={d}
                  agir={agir}
                  onAvisoLido={() => {
                    void salaoPost({ action: 'aviso.lido' }).catch(() => null).then(recarregar)
                  }}
                />
              )}
            </div>
          </Tabs>
        </div>
      </div>
      <CalendarioDevo open={calendario} onClose={() => setCalendario(false)} d={d} agir={agir} onConfig={recarregar} />
    </div>
  )
}
