'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AndarEstado, TorreEstado } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { Button, GlyphArrow, GlyphCheck, Kicker, PortraitFrame, Sheet, toRoman } from '../kit'
import { CeuNoturno, Escada, ESCADA, MAPA_W, starPath, TorresDefs, alturaEscada, yDoAndar } from './arte'
import { ChaveIcone, Essencia } from './cena'
import { RecursoChip } from './mapa'
import { retratoDe } from './retrato'
import './torres.css'

/**
 * Tela de uma torre: escada em espiral subindo pela tela, um patamar por andar. Concluídos acesos em aço;
 * o atual com halo ametista; os trancados com cadeado e o requisito. Tocar num andar abre a ficha (custo,
 * chaves, recompensa) com "Subir" ou "Rever cena". Quem decide tudo é o servidor.
 */
export function TelaTorre({
  torre,
  onVoltar,
  voltarProprio,
  onSubir,
  onRever,
  subindo,
  erro,
  recemConcluido,
}: {
  torre: TorreEstado
  onVoltar: () => void
  /** Desenha a própria seta (desktop: o shell não assume o voltar). */
  voltarProprio: boolean
  onSubir: (n: number) => Promise<boolean>
  onRever: (andar: AndarEstado) => void
  subindo: boolean
  erro: string | null
  recemConcluido: number | null
}) {
  const N = torre.andares.length
  const H = alturaEscada(N)
  const scroller = useRef<HTMLDivElement>(null)
  const [ficha, setFicha] = useState<number | null>(null)
  const atual = torre.andares.find((a) => a.estado === 'atual')?.n ?? N

  // começa olhando para o andar atual
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const frac = yDoAndar(atual, N) / H
    el.scrollTop = Math.max(0, frac * el.scrollHeight - el.clientHeight * 0.55)
  }, [torre.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const art = retratoDe(torre.npc, torre.npc.pose)
  const andarFicha = ficha ? torre.andares[ficha - 1] : null

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-dv-ink">
      <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} 640`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <TorresDefs />
        <CeuNoturno h={640} horizonte={600} lua={false} />
      </svg>

      {/* cabeçalho da torre: tema, nome, NPC em destaque e recursos */}
      <header className="relative z-10 shrink-0 px-4 pt-2">
        <div className="flex items-start gap-3">
          {voltarProprio && (
            <button type="button" onClick={onVoltar} aria-label="Voltar ao mapa" className="dv-focus -ml-2 grid size-11 shrink-0 place-items-center text-dv-text-2 hover:text-dv-text">
              <GlyphArrow className="size-5 rotate-180" />
            </button>
          )}
          <div className="min-w-0 flex-1 animate-dv-cut-in">
            <Kicker tone="gold">
              {torre.tipo === 'principal' ? 'Torre principal' : 'Torre secundária'} · {torre.tema}
            </Kicker>
            <h2 className="mt-1.5 font-display text-[24px] font-semibold uppercase leading-[1.05] tracking-[0.06em] text-dv-text [text-wrap:balance]">{torre.nome}</h2>
            <p className="mt-1 font-body text-[14px] italic text-dv-text-2">
              {torre.npc.nome}
              {torre.npc.titulo ? <span className="text-dv-text-3"> · {torre.npc.titulo}</span> : null}
            </p>
          </div>
          <div className="relative -mr-1 -mt-1 h-[92px] w-[78px] shrink-0 animate-dv-fade overflow-hidden [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art.src} alt={torre.npc.nome} className="absolute inset-0 size-full object-cover object-top" style={{ objectPosition: art.position ?? '50% 0%' }} />
            ) : (
              <PortraitFrame alt={torre.npc.nome} shape="arch" className="w-full" />
            )}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dv-gold/70 to-transparent" />
          </div>
        </div>
        <ul aria-label="Recursos desta torre" className="mt-2 flex gap-1.5">
          <RecursoChip nome={torre.essencia.nome} curto="Essências" quantidade={torre.essencia.quantidade} tipo="essencia" />
          {torre.chave && <RecursoChip nome={torre.chave.nome} curto="Chaves" quantidade={torre.chave.quantidade} tipo="chave" />}
          <li className="ml-auto flex items-center font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-3">
            <span className="dv-tabular text-dv-gold">{torre.concluidos}</span>/{N} andares
          </li>
        </ul>
        <span aria-hidden="true" className="mt-2 block h-px bg-gradient-to-r from-transparent via-dv-gold/50 to-transparent" />
      </header>

      {erro && (
        <p role="alert" className="relative z-10 mx-4 mt-2 border-l-2 border-dv-blood bg-dv-blood-deep/60 px-3 py-2 font-body text-[14px] text-dv-text">
          {erro}
        </p>
      )}

      {/* a escada */}
      <div ref={scroller} className="devo-scroll relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative mx-auto w-full max-w-[420px]" style={{ aspectRatio: `${MAPA_W} / ${H}` }}>
          <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} ${H}`} className="absolute inset-0 size-full">
            <TorresDefs />
            <Escada andares={N} feitos={torre.concluidos} />
            {torre.andares.map((a) => (
              <No key={a.n} andar={a} y={yDoAndar(a.n, N)} />
            ))}
          </svg>
          {torre.andares.map((a) => {
            const y = yDoAndar(a.n, N)
            return (
              <AndarCartao
                key={a.n}
                andar={a}
                essencia={torre.essencia.nome}
                recem={recemConcluido === a.n}
                style={{ top: `${(y / H) * 100}%`, left: `${((ESCADA.AX + ESCADA.R - 26) / MAPA_W) * 100}%`, right: '3%' }}
                onAbrir={() => {
                  playSfx('click')
                  setFicha(a.n)
                }}
              />
            )
          })}
        </div>
      </div>

      <Sheet
        open={!!andarFicha}
        onClose={() => setFicha(null)}
        kicker={`${torre.nome} · Andar ${toRoman(andarFicha?.n ?? 1)}`}
        title={andarFicha?.titulo ?? ''}
        footer={
          andarFicha ? (
            andarFicha.estado === 'concluido' ? (
              <Button
                block
                variant="secondary"
                disabled={!andarFicha.cena?.length}
                onClick={() => {
                  setFicha(null)
                  onRever(andarFicha)
                }}
              >
                Rever cena
              </Button>
            ) : (
              <Button
                block
                loading={subindo}
                disabled={!andarFicha.podeSubir}
                sfx="confirm"
                onClick={async () => {
                  if (await onSubir(andarFicha.n)) setFicha(null)
                }}
              >
                {`Subir ao andar ${toRoman(andarFicha.n)}`}
              </Button>
            )
          ) : null
        }
      >
        {andarFicha && <FichaAndar andar={andarFicha} torre={torre} />}
      </Sheet>
    </div>
  )
}

/** Patamar na escada (SVG): estrela de aço; atual com halo ametista; trancado com cadeado. */
function No({ andar, y }: { andar: AndarEstado; y: number }) {
  const x = ESCADA.AX + ESCADA.R
  const r = andar.estado === 'atual' ? 17 : 14
  return (
    <g>
      {andar.estado === 'atual' && <circle cx={x} cy={y} r={34} fill="url(#tw-halo-am)" className="tw-pulse" />}
      {andar.estado === 'concluido' && <circle cx={x} cy={y} r={24} fill="url(#tw-halo)" />}
      <path d={starPath(x, y, r + 7, 0.2)} fill={andar.estado === 'trancado' ? '#151517' : '#0c0c0e'} stroke={andar.estado === 'trancado' ? '#5f584d' : 'url(#tw-steel)'} strokeWidth={1.2} />
      <path d={starPath(x, y, r - 3, 0.24)} fill={andar.estado === 'concluido' ? 'url(#tw-steel)' : andar.estado === 'atual' ? 'url(#tw-cur)' : 'none'} stroke={andar.estado === 'trancado' ? '#38393c' : 'none'} />
      {(andar.estado === 'trancado' || (andar.estado === 'atual' && !andar.podeSubir)) && (
        <g transform={`translate(${x - 5} ${y - 6})`}>
          <path d="M2 5V3.5a3 3 0 0 1 6 0V5" stroke={andar.estado === 'atual' ? '#ece5d8' : '#bab09f'} strokeWidth={1.3} fill="none" />
          <rect x={0.5} y={5} width={9} height={7} rx={1} fill={andar.estado === 'atual' ? '#ece5d8' : '#bab09f'} />
          <rect x={4.4} y={7.4} width={1.2} height={2.4} fill="#0c0c0e" />
        </g>
      )}
    </g>
  )
}

function AndarCartao({ andar, essencia, recem, style, onAbrir }: { andar: AndarEstado; essencia: string; recem: boolean; style: CSSProperties; onAbrir: () => void }) {
  const a = andar
  const estadoTxt =
    a.estado === 'concluido'
      ? 'concluído'
      : a.estado === 'atual'
        ? a.podeSubir
          ? 'pronto para subir'
          : 'trancado por falta de recursos'
        : `trancado, requer o andar ${toRoman(a.n - 1)}`
  const ativo = a.estado === 'atual'
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Andar ${toRoman(a.n)}: ${a.titulo}, ${estadoTxt}`}
      className={cn('dv-focus group absolute -translate-y-1/2 text-left', recem && 'drop-shadow-[0_0_14px_rgba(236,229,216,0.35)]')}
      style={{ ...style, '--dv-cut': '12px' } as CSSProperties}
    >
      <span className="relative isolate flex min-h-[96px] flex-col justify-center py-2.5 pl-11 pr-3">
        <span
          aria-hidden="true"
          className={cn(
            'dv-cut-diag absolute inset-y-0 left-6 right-0 -z-10 transition-colors duration-200',
            ativo
              ? 'bg-[linear-gradient(110deg,#ece5d8,#6b6357_35%,#bab09f_70%,#8a7cc8)]'
              : a.estado === 'concluido'
                ? 'bg-[linear-gradient(110deg,rgba(236,229,216,0.75),rgba(107,99,87,0.7))]'
                : 'bg-dv-line-strong group-hover:bg-[linear-gradient(110deg,rgba(236,229,216,0.6),rgba(95,88,77,0.6))]',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'dv-cut-diag absolute inset-y-px left-[25px] right-px -z-10',
            ativo ? 'bg-[linear-gradient(100deg,#1e1b2b,#151517_55%,#0c0c0e)]' : 'bg-[linear-gradient(100deg,rgba(31,31,34,0.94),rgba(12,12,14,0.92))]',
          )}
          style={{ '--dv-cut': '11.6px' } as CSSProperties}
        />
        <span className="flex items-baseline gap-2">
          <span className={cn('font-impact text-[26px] font-semibold leading-none -skew-x-[8deg]', a.estado === 'trancado' ? 'text-dv-text-3' : 'text-dv-gold-bright')}>{toRoman(a.n)}</span>
          <span className="dv-label text-[10px] text-dv-text-3">Andar</span>
          {a.provisorio && <span className="dv-label ml-auto border border-dv-line-strong px-1 py-px text-[9px] text-dv-text-3">Provisório</span>}
        </span>
        <span className={cn('mt-1 line-clamp-2 font-body text-[15px] leading-snug', a.estado === 'trancado' ? 'text-dv-text-2' : 'text-dv-text')}>{a.titulo}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em]">
          {a.estado === 'concluido' ? (
            <span className="flex items-center gap-1 text-dv-gold">
              <GlyphCheck className="size-3.5" /> Concluído
            </span>
          ) : (
            <>
              <span className={cn('dv-tabular flex items-center gap-1', ativo && a.faltaEssencias ? 'text-dv-blood-text' : ativo ? 'text-dv-text' : 'text-dv-text-3')} title={essencia}>
                <Essencia className="size-3.5" />×{a.custo}
              </span>
              {a.chaves.map((k) => (
                <span key={k.item} className={cn('dv-tabular flex items-center gap-1', ativo && k.tem < k.quantidade ? 'text-dv-blood-text' : ativo ? 'text-dv-text' : 'text-dv-text-3')} title={k.nome}>
                  <ChaveIcone className="size-3.5" />
                  {Math.min(k.tem, k.quantidade)}/{k.quantidade}
                </span>
              ))}
              <span className={cn('normal-case tracking-normal font-body text-[13px] italic', ativo && a.podeSubir ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>
                {a.estado === 'trancado'
                  ? `Requer o andar ${toRoman(a.n - 1)}`
                  : a.podeSubir
                    ? 'Pronto para subir'
                    : a.faltaEssencias
                      ? `Faltam ${a.faltaEssencias} ${a.faltaEssencias === 1 ? 'essência' : 'essências'}`
                      : 'Faltam chaves'}
              </span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}

function FichaAndar({ andar, torre }: { andar: AndarEstado; torre: TorreEstado }) {
  const a = andar
  const temEss = torre.essencia.quantidade
  return (
    <div className="flex flex-col gap-4">
      {a.resumo && <p className="font-body text-[15px] leading-relaxed text-dv-text-2">{a.resumo}</p>}
      <p className="font-body text-[14px] italic text-dv-text-3">
        Em destaque: <span className="not-italic text-dv-text">{a.npc.nome}</span>
      </p>
      {a.estado !== 'concluido' && (
        <ul className="grid gap-2">
          <Linha
            ok={temEss >= a.custo}
            icone={<Essencia className="size-6" />}
            rotulo={torre.essencia.nome}
            valor={`${Math.min(temEss, a.custo)}/${a.custo}`}
            nota={a.n > 1 ? `Custo do andar ${toRoman(a.n)}: o dobro do anterior.` : 'Custo do primeiro andar.'}
          />
          {a.chaves.map((k) => (
            <Linha key={k.item} ok={k.tem >= k.quantidade} icone={<ChaveIcone className="size-6" />} rotulo={k.nome} valor={`${Math.min(k.tem, k.quantidade)}/${k.quantidade}`} nota={a.gastaChaves ? 'As chaves são gastas ao subir.' : 'Basta ter as chaves; elas não são gastas.'} />
          ))}
          {a.estado === 'trancado' && <Linha ok={false} rotulo={`Andar ${toRoman(a.n - 1)} concluído`} valor="—" />}
        </ul>
      )}
      {(a.recompensas.chaves > 0 || a.recompensas.itens.length > 0) && (
        <div>
          <p className="dv-label text-[10px] text-dv-text-3">Recompensa</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {a.recompensas.chaves > 0 && torre.chave && <RecursoChip nome={torre.chave.nome} curto={torre.chave.nome} quantidade={a.recompensas.chaves} tipo="chave" />}
            {a.recompensas.itens.map((it) => (
              <li key={it.item} className="font-body text-[14px] text-dv-text-2">
                +{it.quantidade} {it.nome}
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.estado === 'concluido' && <p className="font-body text-[15px] text-dv-text-2">Andar concluído. A cena pode ser revista quando quiser.</p>}
      {a.provisorio && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-3">Conteúdo provisório: o texto deste andar ainda vai ser escrito.</p>}
    </div>
  )
}

function Linha({ ok, icone, rotulo, valor, nota }: { ok: boolean; icone?: ReactNode; rotulo: string; valor: string; nota?: string }) {
  return (
    <li className="flex items-center gap-3 border-b border-dv-line pb-2">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center">{icone ?? <span className="size-2 rotate-45 bg-dv-text-3" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[15px] text-dv-text">{rotulo}</span>
        {nota && <span className="block font-body text-[13px] text-dv-text-3">{nota}</span>}
      </span>
      <span className={cn('dv-tabular font-mono text-[15px]', ok ? 'text-dv-text' : 'text-dv-blood-text')}>
        {valor}
        <span className="sr-only">{ok ? ' (ok)' : ' (falta)'}</span>
      </span>
    </li>
  )
}
