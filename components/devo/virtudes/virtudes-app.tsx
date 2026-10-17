'use client'

import { type CSSProperties, type ReactNode } from 'react'
import useSWR from 'swr'
import { AFINIDADE_ROTULO, type Afinidade, TEXTOS_VIRTUDES, VIRTUDE_KEYS, VIRTUDES, type VirtudeKey, type VirtudesPayload } from '@/lib/devo/virtudes'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '../kit/button'
import { EmblemArcanos, EmblemMark, EmblemVirtudes } from '../kit/emblems'
import { toRoman } from '../kit'
import { ChevronRight } from 'lucide-react'
import { useOsNav } from '../os/os-nav'
import { Sigilo } from '../arcanos/sigilos'
import { Naipe } from './naipes'

/**
 * Virtudes (DIRECAO-3 §2; VIRTUDES.md). Tela do jogador, QUALITATIVA: o Arcano no centro dos seis naipes,
 * a afinidade de cada Virtude em palavras (excelente → deficiente), quanto o Estágio já acumulou em faixas
 * ("pouco acumulado… perto do limite") e o histórico de Evoluções. Nenhum número de P.P., teto ou
 * multiplicador chega aqui — o servidor guarda; a equipe vê na Mesa.
 */

const KEY = '/api/virtudes'
async function get(url: string): Promise<VirtudesPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'As Virtudes não responderam.')
  return j
}

export function useVirtudes() {
  return useSWR<VirtudesPayload>(KEY, get, { revalidateOnFocus: false })
}

const GRAU: Record<Afinidade, number> = { excelente: 5, favorecida: 4, regular: 3, dificil: 2, deficiente: 1 }
const FRASE: Record<Afinidade, string> = {
  excelente: 'O caminho mais natural do seu Arcano.',
  favorecida: 'Cresce com pouca resistência.',
  regular: 'Nem dom, nem obstáculo.',
  dificil: 'Pede mais do que devolve.',
  deficiente: 'Seu Arcano mal a sustenta.',
}

export function VirtudesApp() {
  const { data, error, isLoading, mutate } = useVirtudes()
  if (!data) {
    return (
      <Fundo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-4">
              <p className="font-body text-[16px] text-dv-text-2">{(error as Error).message}</p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Tentar de novo
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dv-text-3">
              {isLoading && <Spinner className="size-5" />}
              Lendo os naipes…
            </p>
          )}
        </div>
      </Fundo>
    )
  }
  if (!data.liberado) return <Trancado motivo={data.motivo} />
  return <Tela d={data} />
}

function Fundo({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden bg-dv-ink">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:560px_560px] opacity-60" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_22%,rgba(236,229,216,0.07),transparent_70%),linear-gradient(180deg,transparent_55%,rgba(10,10,11,0.85))]" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Trancado({ motivo }: { motivo: string }) {
  return (
    <Fundo>
      <div className="flex h-full flex-col px-4 pb-6">
        <div aria-hidden="true" className="flex flex-1 items-center justify-center">
          <div className="grid grid-cols-3 gap-x-9 gap-y-7 opacity-50">
            {VIRTUDE_KEYS.map((v) => (
              <Naipe key={v} virtude={v} apagado className="size-14" />
            ))}
          </div>
        </div>
        <section aria-label="Virtudes: trancado" className="animate-dv-rise relative" style={{ '--dv-cut': '14px' } as CSSProperties}>
          <span aria-hidden="true" className="dv-cut absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--dv-text-rgb)/0.34),rgb(var(--dv-text-rgb)/0.12)_45%,rgb(var(--dv-text-rgb)/0.26))]" />
          <span aria-hidden="true" className="dv-cut absolute inset-px bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]" style={{ '--dv-cut': '13.6px' } as CSSProperties} />
          <div className="relative flex items-start gap-4 p-5">
            <EmblemMark emblem={EmblemVirtudes} size={56} state="locked" />
            <div className="min-w-0 flex-1">
              <p className="dv-label text-[10px] text-dv-text-3">Sistema trancado</p>
              <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-dv-text">Virtudes</h2>
              <p className="mt-2 font-body text-[15.5px] leading-relaxed text-dv-text-2">{motivo}</p>
            </div>
          </div>
        </section>
      </div>
    </Fundo>
  )
}

type Liberado = Extract<VirtudesPayload, { liberado: true }>

function Tela({ d }: { d: Liberado }) {
  const porKey = new Map(d.virtudes.map((v) => [v.key, v]))
  const novas = d.virtudes.filter((v) => !v.antiga)
  const antigas = d.virtudes.filter((v) => v.antiga)
  return (
    <Fundo>
      <div className="devo-scroll h-full overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pb-12 pt-3">
          <Roda d={d} porKey={porKey} />

          <AtalhoArcanos d={d} />

          {!d.arcano && (
            <p role="status" className="mx-auto -mt-2 max-w-[34ch] text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-dv-gold">
              Sua afinidade aparece quando o Anfitrião registrar o seu Arcano.
            </p>
          )}

          <p className="animate-dv-fade mx-auto max-w-[36ch] text-center font-body text-[15.5px] italic leading-relaxed text-dv-text-2 [animation-delay:200ms]">
            {TEXTOS_VIRTUDES.abertura}
          </p>

          <Potencial d={d} />


          <section aria-labelledby="virt-naipes" className="flex flex-col gap-3">
            <Cabecalho id="virt-naipes" kicker="Os quatro naipes" titulo="Bases claras" />
            <p className="font-body text-[15px] leading-relaxed text-dv-text-2">{TEXTOS_VIRTUDES.misterio}</p>
            <ul className="flex flex-col">
              {novas.map((v) => (
                <LinhaVirtude key={v.key} v={v} tendencia={d.tendencia === v.key} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="virt-antigas" className="flex flex-col gap-3">
            <Cabecalho id="virt-antigas" kicker="Baralhos antigos" titulo="Mais vagas" />
            <p className="font-body text-[15px] leading-relaxed text-dv-text-2">{TEXTOS_VIRTUDES.antigas}</p>
            <ul className="flex flex-col">
              {antigas.map((v) => (
                <LinhaVirtude key={v.key} v={v} tendencia={d.tendencia === v.key} />
              ))}
            </ul>
            <p className="font-body text-[14.5px] italic leading-relaxed text-dv-text-3">{TEXTOS_VIRTUDES.antigasFim}</p>
          </section>

          <Historico d={d} />

          <p className="border-t border-dv-line pt-4 text-center font-body text-[15px] italic leading-relaxed text-dv-text-2">{TEXTOS_VIRTUDES.fecho}</p>
        </div>
      </div>
    </Fundo>
  )
}

/** Os Arcanos têm tela própria (dono, 17/10): aqui fica só a entrada "Seu Arcano → abrir Arcanos". */
function AtalhoArcanos({ d }: { d: Liberado }) {
  const nav = useOsNav()
  const meu = d.arcanos.find((a) => a.proprio)
  return (
    <button
      type="button"
      onClick={() => nav.open('arcanos')}
      className="dv-focus -mt-2 flex min-h-12 w-full items-center gap-3 px-2 py-2 text-left shadow-[inset_0_-1px_0_var(--dv-line),inset_0_1px_0_var(--dv-line)]"
    >
      {meu ? <Sigilo arcano={meu.key} estado="aceso" aro={false} className="size-7" /> : <EmblemMark emblem={EmblemArcanos} size={28} />}
      <span className="min-w-0 flex-1">
        <span className="dv-label block text-[10px] text-dv-text-3">{meu ? 'Seu Arcano' : 'Arcanos'}</span>
        <span className="block font-display text-[14.5px] font-semibold uppercase tracking-[0.08em] text-dv-text">{meu ? meu.titulo.replace(/^Arcano d[aoe]s? /, '') : 'Os vinte e dois'}</span>
      </span>
      <span className="flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dv-gold">
        Abrir Arcanos <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </span>
    </button>
  )
}

function Cabecalho({ id, kicker, titulo, direita }: { id: string; kicker: string; titulo: string; direita?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div>
        <p className="dv-label text-[10px] text-dv-gold">{kicker}</p>
        <h2 id={id} className="mt-1 font-display text-[19px] font-semibold uppercase tracking-[0.08em] text-dv-text">
          {titulo}
        </h2>
      </div>
      {direita}
      <span aria-hidden="true" className="mb-2 h-px flex-1 self-end bg-gradient-to-r from-dv-gold/50 to-transparent" />
    </header>
  )
}

/** Herói: os seis naipes em roda; no centro o Arcano e o Estágio. A excelente leva a ametista. */
function Roda({ d, porKey }: { d: Liberado; porKey: Map<VirtudeKey, Liberado['virtudes'][number]> }) {
  const R = 41 // % do raio
  return (
    <section aria-label={d.arcano ? `${d.arcano.titulo}, Estágio ${toRoman(d.estagio)}` : 'Arcano não revelado'} className="relative mx-auto aspect-square w-full max-w-[340px]">
      {/* anéis gravados */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <circle cx="50" cy="50" r="41" fill="none" stroke="#bab09f" strokeOpacity="0.32" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="#bab09f" strokeOpacity="0.45" strokeWidth="0.35" />
        <circle cx="50" cy="50" r="25.6" fill="none" stroke="#bab09f" strokeOpacity="0.2" strokeWidth="0.25" strokeDasharray="0.6 1.2" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = ((i * 60 - 60) * Math.PI) / 180
          return <line key={i} x1={50 + Math.cos(a) * 27.5} y1={50 + Math.sin(a) * 27.5} x2={50 + Math.cos(a) * 33} y2={50 + Math.sin(a) * 33} stroke="#bab09f" strokeOpacity="0.4" strokeWidth="0.3" />
        })}
      </svg>
      {/* centro */}
      <div className="absolute inset-[25%] grid place-items-center rounded-full bg-[radial-gradient(circle_at_50%_38%,#232326,var(--dv-ink)_72%)] shadow-[inset_0_0_0_1px_rgba(186,176,159,0.35),0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="animate-dv-fade flex flex-col items-center text-center">
          {d.arcano ? (
            <>
              <span className="dv-label text-[10px] text-dv-text-3">Arcano</span>
              <span className="dv-brass-text font-impact text-[40px] font-semibold leading-none">{d.arcano.numeral}</span>
              <span className="mt-1 max-w-[12ch] font-display text-[12.5px] font-semibold uppercase leading-tight tracking-[0.08em] text-dv-text">{d.arcano.titulo.replace(/^Arcano d[aoe]s? /, '')}</span>
              <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-gold">Estágio {toRoman(d.estagio)}</span>
            </>
          ) : (
            <>
              <span className="dv-label text-[10px] text-dv-text-3">Arcano</span>
              <span className="font-impact text-[34px] font-semibold leading-none text-dv-text-3">?</span>
              <span className="mt-1 font-display text-[12px] font-semibold uppercase tracking-[0.08em] text-dv-text-2">Não revelado</span>
              <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-dv-gold">Estágio {toRoman(d.estagio)}</span>
            </>
          )}
        </div>
      </div>
      {/* naipes */}
      {VIRTUDE_KEYS.map((k, i) => {
        const v = porKey.get(k)!
        const a = ((i * 60 - 90) * Math.PI) / 180
        const exc = v.afinidade === 'excelente'
        const def = v.afinidade === 'deficiente'
        return (
          <div
            key={k}
            aria-hidden="true"
            className="animate-dv-pop absolute flex w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${50 + Math.cos(a) * R}%`, top: `${50 + Math.sin(a) * R}%`, animationDelay: `${120 + i * 70}ms` }}
          >
            <span className="relative grid place-items-center">
              {exc && <span className="absolute inset-x-[-12%] bottom-[-14%] h-[55%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--dv-amethyst-rgb)/0.55),transparent_70%)]" />}
              <Naipe virtude={k} apagado={!v.afinidade} className={cn('relative size-[52px]', def && 'opacity-55 saturate-50')} />
            </span>
            <span className={cn('mt-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em]', def ? 'text-dv-text-3' : 'text-dv-text')}>{v.nome}</span>
            {exc && <span className="mt-0.5 size-[7px] rotate-45 bg-dv-amethyst shadow-[0_0_8px_rgb(var(--dv-amethyst-rgb)/0.9)]" />}
          </div>
        )
      })}
    </section>
  )
}

/** Barra qualitativa do Estágio: cinco losangos que acendem, sem número. */
function Potencial({ d }: { d: Liberado }) {
  const a = d.acumulo
  const acesos = a.cheio ? 5 : a.nivel === 0 ? 0 : a.nivel + 1
  return (
    <section aria-labelledby="virt-pp" className="dv-record-panel dv-cut relative overflow-hidden" style={{ '--dv-cut': '14px' } as CSSProperties}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/os/marmore-negro.webp)] bg-[length:480px_480px] opacity-40" />
      <div className="relative p-4">
        <p className="dv-label text-[10px] text-dv-text-3">Pontos de Potencial · Estágio {toRoman(d.estagio)}</p>
        <h2 id="virt-pp" className="mt-1.5 font-display text-[21px] font-semibold uppercase tracking-[0.06em] text-dv-text">
          {a.rotulo}
        </h2>
        <div role="img" aria-label={`Acúmulo do Estágio: ${a.rotulo.toLowerCase()}`} className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="relative h-3 flex-1">
              <span
                className={cn(
                  'absolute inset-0 [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]',
                  i < acesos ? 'bg-[linear-gradient(180deg,#f4efe6,#bab09f_55%,#6b6357)]' : 'bg-white/[0.07]',
                )}
              />
            </span>
          ))}
          <span aria-hidden="true" className={cn('ml-1 size-2 rotate-45', a.cheio ? 'bg-dv-amethyst shadow-[0_0_8px_rgb(var(--dv-amethyst-rgb)/0.9)]' : 'bg-white/10')} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-dv-text-3">
          <span>Pouco</span>
          <span>Limite do Estágio</span>
        </div>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-dv-text">
          {d.ultimoEstagio ? 'Último Estágio conhecido. O corpo não tem para onde se transformar, por enquanto.' : a.pronto ? 'O corpo já suporta a metamorfose. A Evolução de Estágio acontece quando o Anfitrião a chamar.' : 'Ainda não basta para a metamorfose.'}
        </p>
        {d.tendencia && (
          <p className="mt-2 flex items-center gap-2 font-body text-[15px] leading-relaxed text-dv-text-2">
            <Naipe virtude={d.tendencia} className="size-5" />
            <span>
              Seu esforço tem pendido para <span className="text-dv-text">{VIRTUDES[d.tendencia].nome}</span>.
            </span>
          </p>
        )}
        <p className="mt-3 border-t border-dv-line pt-3 font-body text-[14.5px] leading-relaxed text-dv-text-2">
          {TEXTOS_VIRTUDES.metamorfose} {TEXTOS_VIRTUDES.limite}
        </p>
        <p className="mt-2 font-body text-[14px] italic leading-relaxed text-dv-text-3">{TEXTOS_VIRTUDES.controle}</p>
      </div>
    </section>
  )
}

function LinhaVirtude({ v, tendencia }: { v: Liberado['virtudes'][number]; tendencia: boolean }) {
  const grau = v.afinidade ? GRAU[v.afinidade] : 0
  return (
    <li className="flex gap-3.5 border-b border-dv-line py-3.5 last:border-b-0" aria-label={`${v.nome}: ${v.afinidade ? `afinidade ${AFINIDADE_ROTULO[v.afinidade].toLowerCase()}` : 'afinidade desconhecida'}`}>
      <Naipe virtude={v.key} apagado={!v.afinidade} className="mt-0.5 size-11" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-display text-[17px] font-semibold uppercase tracking-[0.1em] text-dv-text">{v.nome}</h3>
          <span className={cn('flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]', v.afinidade === 'excelente' ? 'text-dv-amethyst-text' : v.afinidade === 'deficiente' ? 'text-dv-text-3' : 'text-dv-gold')}>
            <span aria-hidden="true" className="flex gap-[3px]">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={cn('size-[5px] rotate-45', i < grau ? (v.afinidade === 'excelente' ? 'bg-dv-amethyst' : 'bg-dv-gold') : 'bg-white/12')} />
              ))}
            </span>
            {v.afinidade ? AFINIDADE_ROTULO[v.afinidade] : 'Desconhecida'}
          </span>
        </div>
        <p className="mt-1 font-body text-[15px] leading-relaxed text-dv-text-2">{v.texto}</p>
        {v.afinidade && <p className="mt-0.5 font-body text-[14px] italic leading-relaxed text-dv-text-3">{FRASE[v.afinidade]}</p>}
        {tendencia && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-dv-amethyst-text">Para onde seu esforço tem ido</p>}
      </div>
    </li>
  )
}

const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })

function Historico({ d }: { d: Liberado }) {
  return (
    <section aria-labelledby="virt-hist" className="flex flex-col gap-3">
      <Cabecalho id="virt-hist" kicker="Metamorfoses" titulo="Evoluções de Estágio" />
      {d.evolucoes.length ? (
        <ol className="flex flex-col">
          {d.evolucoes.map((e) => (
            <li key={e.at} className="relative flex gap-3.5 border-b border-dv-line py-3.5 pl-1 last:border-b-0">
              <span aria-hidden="true" className="dv-brass-text w-12 shrink-0 font-impact text-[24px] font-semibold leading-none">
                {toRoman(e.para)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-dv-text">
                  Estágio {toRoman(e.de)} → {toRoman(e.para)}
                </p>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dv-text-3">
                  {DATA.format(e.at)}
                  {e.arcano ? ` · ${e.arcano}` : ''}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[15px] text-dv-text-2">
                  <span className="flex items-center gap-1.5">
                    <Naipe virtude={e.maisCresceu} className="size-5" /> Mais cresceu: <span className="text-dv-text">{VIRTUDES[e.maisCresceu].nome}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Naipe virtude={e.menosCresceu} className="size-5" apagado /> Menos: <span className="text-dv-text">{VIRTUDES[e.menosCresceu].nome}</span>
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-body text-[15px] italic leading-relaxed text-dv-text-3">Nenhuma metamorfose ainda. O corpo continua no primeiro Estágio que conheceu.</p>
      )}
    </section>
  )
}
