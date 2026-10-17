'use client'

import { ChevronDown, Lock } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { type ArcanoVista, type EstagioVista, VIRTUDES } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Naipe } from './naipes'

/**
 * "Os vinte e dois" (pedido do dono, 17/10). Cada Arcano trancado mostra numeral, nome e a frase breve, apagado e
 * com cadeado — o servidor nem manda mais que isso. O do jogador vem primeiro e abre (disclosure: botão com
 * aria-expanded/aria-controls, painel `inert` quando fechado) com Descrição, Fisiologia e Estágios de Evolução.
 * Owner/Anfitrião abrem todos. Os textos são rascunho; o selo "Provisório" só aparece para o Owner.
 */
export function ArcanosLista({ arcanos, verTodos }: { arcanos: ArcanoVista[]; verTodos: boolean }) {
  const meu = arcanos.find((a) => a.proprio)
  const resto = arcanos.filter((a) => a !== meu)
  return (
    <section aria-labelledby="virt-arcanos" className="flex flex-col gap-3">
      <header className="flex items-end gap-3">
        <div>
          <p className="dv-label text-[10px] text-dv-gold">Arcanos maiores</p>
          <h2 id="virt-arcanos" className="mt-1 font-display text-[19px] font-semibold uppercase tracking-[0.08em] text-dv-text">
            Os vinte e dois
          </h2>
        </div>
        <span aria-hidden="true" className="mb-2 h-px flex-1 self-end bg-gradient-to-r from-dv-gold/50 to-transparent" />
      </header>
      <p className="font-body text-[15px] leading-relaxed text-dv-text-2">
        {verTodos
          ? 'Acesso da equipe: todos os Arcanos abrem. O jogador só abre o próprio; os outros aparecem trancados, com uma frase.'
          : meu
            ? 'Cada pessoa desperta sob um único Arcano. Toque no seu para ler o que ele faz com o corpo; os outros ficam fechados.'
            : 'Cada pessoa desperta sob um único Arcano. O seu ainda não foi registrado; por enquanto, todos ficam fechados.'}
      </p>
      <ul className="flex flex-col gap-2">
        {meu && <ItemAberto a={meu} />}
        {resto.map((a) => (a.detalhe ? <ItemAberto key={a.key} a={a} /> : <ItemTrancado key={a.key} a={a} />))}
      </ul>
    </section>
  )
}

function Numeral({ n, apagado }: { n: string; apagado?: boolean }) {
  return (
    <span aria-hidden="true" className={cn('w-11 shrink-0 pt-0.5 text-center font-impact text-[22px] font-semibold leading-none', apagado ? 'text-dv-text-3' : 'dv-brass-text')}>
      {n}
    </span>
  )
}

function ItemTrancado({ a }: { a: ArcanoVista }) {
  return (
    <li className="flex items-start gap-3 border-b border-dv-line px-1 py-3 opacity-70 last:border-b-0">
      <Numeral n={a.numeral} apagado />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 font-display text-[14.5px] font-semibold uppercase tracking-[0.08em] text-dv-text-2">
          {a.titulo.replace(/^Arcano /, '')}
          <span className="sr-only">(trancado)</span>
        </h3>
        <p className="mt-1 font-body text-[14.5px] leading-relaxed text-dv-text-3">{a.breve}</p>
      </div>
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-dv-text-3" strokeWidth={1.75} />
    </li>
  )
}

function ItemAberto({ a }: { a: ArcanoVista }) {
  const [aberto, setAberto] = useState(false)
  const id = useId()
  const d = a.detalhe!
  const nome = a.titulo.replace(/^Arcano /, '')
  return (
    <li className={cn('relative', a.proprio ? 'mb-2 bg-dv-ink-2 shadow-[inset_0_0_0_1px_var(--dv-line-gold)]' : 'border-b border-dv-line last:border-b-0')}>
      <h3>
        <button
          type="button"
          id={`${id}-b`}
          aria-expanded={aberto}
          aria-controls={`${id}-p`}
          onClick={() => setAberto((v) => !v)}
          className="dv-focus flex min-h-14 w-full items-start gap-3 px-1 py-3 text-left"
        >
          <Numeral n={a.numeral} />
          <span className="min-w-0 flex-1">
            {a.proprio && <span className="dv-label block text-[10px] text-dv-amethyst-text">Seu Arcano</span>}
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-[15.5px] font-semibold uppercase tracking-[0.08em] text-dv-text">{nome}</span>
              {a.provisorio && (
                <span className="inline-flex h-5 items-center px-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-dv-gold shadow-[inset_0_0_0_1px_var(--dv-line-gold)]">Provisório</span>
              )}
            </span>
            <span className="mt-1 block font-body text-[14.5px] leading-relaxed text-dv-text-2">{a.breve}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            strokeWidth={1.75}
            className={cn('mt-1 size-5 shrink-0 text-dv-gold transition-transform duration-[var(--dv-dur-2)] ease-[var(--dv-ease-out)] motion-reduce:transition-none', aberto && 'rotate-180')}
          />
        </button>
      </h3>
      <div
        id={`${id}-p`}
        role="region"
        aria-labelledby={`${id}-b`}
        inert={!aberto}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-[var(--dv-dur-3)] ease-[var(--dv-ease-out)] motion-reduce:transition-none',
          aberto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-4 px-3 pb-4 pt-1">
            <Bloco titulo="Descrição">
              <p className="font-body text-[15px] leading-relaxed text-dv-text">{d.descricao}</p>
            </Bloco>
            <Bloco titulo="Fisiologia">
              <p className="font-body text-[15px] leading-relaxed text-dv-text">{d.fisiologia}</p>
              {(d.excelente || d.deficiente) && (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 font-body text-[14px] text-dv-text-2">
                  {d.excelente && (
                    <span className="flex items-center gap-1.5">
                      <Naipe virtude={d.excelente} className="size-5" /> Mais natural: <span className="text-dv-amethyst-text">{VIRTUDES[d.excelente].nome}</span>
                    </span>
                  )}
                  {d.deficiente && (
                    <span className="flex items-center gap-1.5">
                      <Naipe virtude={d.deficiente} className="size-5" apagado /> Mais custosa: <span className="text-dv-text">{VIRTUDES[d.deficiente].nome}</span>
                    </span>
                  )}
                </p>
              )}
            </Bloco>
            <Bloco titulo="Estágios de Evolução">
              <ol className="relative flex flex-col">
                <span aria-hidden="true" className="absolute bottom-3 left-[6px] top-3 w-px bg-dv-line-strong" />
                {d.estagios.map((e, i) => (
                  <Estagio key={i} e={e} n={i + 1} />
                ))}
              </ol>
            </Bloco>
          </div>
        </div>
      </div>
    </li>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="dv-label mb-1.5 text-[10px] text-dv-gold">{titulo}</h4>
      {children}
    </div>
  )
}

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const ESTADO_SR: Record<EstagioVista['estado'], string> = { passado: 'alcançado', atual: 'Estágio atual', futuro: 'ainda não alcançado', aberto: '' }

function Estagio({ e, n }: { e: EstagioVista; n: number }) {
  const futuro = e.estado === 'futuro'
  const atual = e.estado === 'atual'
  return (
    <li aria-current={atual ? 'step' : undefined} className={cn('relative flex gap-3 py-2 pl-6', futuro && 'opacity-60')}>
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-[2px] top-[13px] size-[9px] rotate-45',
          atual && 'bg-dv-amethyst shadow-[var(--dv-glow-cobalt)]',
          e.estado === 'passado' && 'bg-dv-gold',
          e.estado === 'aberto' && 'bg-dv-text-3',
          futuro && 'bg-dv-ink shadow-[inset_0_0_0_1px_var(--dv-line-strong)]',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">{ROMANOS[n - 1] ?? n}</span>
          <span className={cn('font-display text-[14.5px] font-semibold uppercase tracking-[0.08em]', atual ? 'text-dv-text' : 'text-dv-text-2')}>{e.nome}</span>
          {atual && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-amethyst-text">Atual</span>}
          {e.estado === 'passado' && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dv-gold">Alcançado</span>}
          {ESTADO_SR[e.estado] && !atual && e.estado !== 'passado' && <span className="sr-only">({ESTADO_SR[e.estado]})</span>}
        </p>
        {e.linha ? (
          <p className={cn('mt-0.5 font-body text-[14.5px] leading-relaxed', atual ? 'text-dv-text' : 'text-dv-text-2')}>{e.linha}</p>
        ) : futuro ? (
          <p className="mt-0.5 font-body text-[14px] italic leading-relaxed text-dv-text-3">Ainda velado.</p>
        ) : null}
      </div>
    </li>
  )
}
