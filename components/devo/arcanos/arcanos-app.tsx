'use client'

import { type CSSProperties, type ReactNode, useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import type { VirtudesPayload } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemArcanos, EmblemMark } from '../kit/emblems'
import { useVirtudes } from '../virtudes/virtudes-app'
import { Altar } from './altar'
import { EstilosArcanos, prng, reduzMovimento, sentir } from './fx'
import { Galeria } from './galeria'
import { Mapa } from './mapa'
import { Medalhao, SeloRachado } from './moldura'
import { Sigilo } from './sigilos'

/**
 * ARCANOS — tela própria (dono, 17/10; refs em docs/redesign/refs/arcanos). Três vistas:
 *  1. Mapa (mapa.tsx): anéis em perspectiva que giram, constelação, medalhões de aço champanhe.
 *  2. Galeria (galeria.tsx): carrossel 3D com molduras, facho de luz e poeira; trancados em pedra.
 *  3. Altar (altar.tsx): vitral, velas, fumaça; Descrição, Fisiologia e Estágios.
 * A moldura do centro e a figura do altar são o mesmo elemento numa View Transition (onde houver suporte e
 * sem movimento reduzido). Dados: o MESMO payload de /api/virtudes (trancado = numeral, nome, frase breve).
 * Cores só por tokens: base mármore negro, metal champanhe (--dv-gold*), acento ametista (--dv-amethyst*).
 */

type Liberado = Extract<VirtudesPayload, { liberado: true }>
type Vista = { tipo: 'mapa' } | { tipo: 'galeria'; i: number } | { tipo: 'detalhe'; i: number }

type DocVT = Document & { startViewTransition?: (cb: () => void) => unknown }
/** Troca de vista com elemento compartilhado (moldura ↔ figura) quando o navegador suporta. */
function comTransicao(fn: () => void) {
  const doc = document as DocVT
  if (!doc.startViewTransition || reduzMovimento()) return fn()
  doc.startViewTransition(() => flushSync(fn))
}

export function ArcanosApp() {
  const { data, error, isLoading, mutate } = useVirtudes()
  let corpo: ReactNode
  if (!data) {
    corpo = (
      <Ceu>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-4">
              <p className="font-body text-[16px] text-dv-text-2">{(error as Error).message.replace('As Virtudes', 'Os Arcanos')}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Alinhando os Arcanos…
            </p>
          )}
        </div>
      </Ceu>
    )
  } else if (!data.liberado) corpo = <Trancado motivo={data.motivo} />
  else corpo = <Arcanos d={data} />
  return (
    <>
      <EstilosArcanos />
      {corpo}
    </>
  )
}

/* ------------------------------------------------------------------ céu de fundo (galeria e trancado) */

const ESTRELAS = (() => {
  const r = prng(22)
  return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 100, s: r() < 0.12 ? 2.2 : 0.8 + r() * 1.2, o: r() * 0.5 + 0.2, d: 3 + r() * 5, a: -r() * 6 }))
})()

function Ceu({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative h-full overflow-hidden bg-dv-ink', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_28%,var(--dv-night-2),var(--dv-night)_42%,var(--dv-ink)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ESTRELAS.map((e, i) => (
          <span
            key={i}
            className="arc-cintila absolute rounded-full bg-dv-gold-bright"
            style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.s, height: e.s, opacity: e.o, '--o': e.o, '--d': `${e.d}s`, '--atraso': `${e.a}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Ceu>
      <div className="flex h-full flex-col px-4 pb-6">
        <div aria-hidden="true" className="relative flex flex-1 items-center justify-center">
          <div className="grid grid-cols-4 gap-4 opacity-55">
            {(['louco', 'mago', 'sacerdotisa', 'imperatriz', 'morte', 'torre', 'lua', 'sol'] as const).map((k) => (
              <Medalhao key={k} estado="apagado" className="size-14">
                <Sigilo arcano={k} aro={false} estado="apagado" className="size-8" />
              </Medalhao>
            ))}
          </div>
          <SeloRachado className="absolute w-24" />
        </div>
        <section aria-label="Arcanos: trancado" className="relative bg-dv-ink-2 p-5 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">
          <div className="flex items-start gap-4">
            <EmblemMark emblem={EmblemArcanos} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Arcanos</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Ceu>
  )
}

/* ------------------------------------------------------------------ navegação entre as vistas */

function Arcanos({ d }: { d: Liberado }) {
  const lista = d.arcanos
  const meuIdx = lista.findIndex((a) => a.proprio)
  const [vista, setVista] = useState<Vista>({ tipo: 'mapa' })
  const abrirGaleria = (i: number) => setVista({ tipo: 'galeria', i })
  const marcarIndice = useCallback((i: number) => setVista((v) => (v.tipo === 'galeria' && v.i !== i ? { tipo: 'galeria', i } : v)), [])
  const abrirDetalhe = (i: number) => {
    sentir('abrir')
    comTransicao(() => setVista({ tipo: 'detalhe', i }))
  }
  const voltar = (i: number) => {
    sentir('voltar')
    comTransicao(() => setVista({ tipo: 'galeria', i }))
  }
  if (vista.tipo === 'detalhe') {
    const a = lista[vista.i]
    if (a?.detalhe) return <Altar a={a} estagio={d.estagio} voltar={() => voltar(vista.i)} />
  }
  return (
    <Ceu>
      <div className="flex h-full flex-col">
        <nav aria-label="Vistas dos Arcanos" className="relative z-20 flex shrink-0 items-center justify-center gap-1 px-4 pb-1 pt-3">
          {(
            [
              ['mapa', 'Mapa'],
              ['galeria', 'Galeria'],
            ] as const
          ).map(([t, rotulo]) => {
            const ativo = vista.tipo === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  if (ativo) return
                  sentir('toque')
                  if (t === 'mapa') setVista({ tipo: 'mapa' })
                  else abrirGaleria(vista.tipo === 'galeria' ? vista.i : Math.max(0, meuIdx))
                }}
                className={cn(
                  'dv-focus dv-cut-diag relative min-h-11 px-5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                  ativo ? 'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--dv-gold-bright)_16%,transparent),color-mix(in_oklab,var(--dv-gold)_6%,transparent))] text-dv-gold-bright shadow-[inset_0_0_0_1px_var(--dv-line-gold)]' : 'text-dv-text-3 hover:text-dv-text-2',
                )}
                style={{ '--dv-cut': '7px' } as CSSProperties}
              >
                {ativo && <span aria-hidden="true" className="absolute inset-x-3 -bottom-px h-px bg-dv-amethyst shadow-[0_0_6px_var(--dv-amethyst)]" />}
                {rotulo}
              </button>
            )
          })}
        </nav>
        <div className="min-h-0 flex-1">
          {vista.tipo === 'galeria' ? (
            <Galeria lista={lista} inicial={vista.i} estagio={d.estagio} onIndice={marcarIndice} onAbrir={abrirDetalhe} />
          ) : (
            <Mapa d={d} onEscolher={abrirGaleria} />
          )}
        </div>
      </div>
    </Ceu>
  )
}
