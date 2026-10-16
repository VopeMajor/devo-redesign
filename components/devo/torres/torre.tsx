'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { AndarEstado, TorreEstado } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { CageFrame, GlyphArrow, Kicker, Sheet, toRoman } from '../kit'
import { alturaEscada, ESCADA, Escada, MAPA_W, TorresDefs, yDoAndar } from './arte'
import { BotaoTorre, Cadeado, ChaveOrnamental, CristalEssencia, EstrelaAndar, type EstadoAndar, voluta } from './ornamentos'
import { RecursoChip } from './mapa'
import { retratoDe } from './retrato'
import './torres.css'

/**
 * Tela de uma torre: a escada em espiral de mármore com corrimão de ferro forjado sobe pela noite (céu e
 * névoa em textura, árvore seca e montanhas), um patamar por andar marcado por uma estrela facetada. O texto
 * de cada andar flutua ao lado, ligado à estrela por um filete de filigrana (sem caixas). Concluído = aço;
 * atual = obsidiana com joia ametista acesa (ou cadeado se falta recurso); trancado = pedra com cadeado.
 * Tocar num andar abre a ficha com o botão ornamental "Subir". Quem decide tudo é o servidor.
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

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const frac = yDoAndar(atual, N) / H
    el.scrollTop = Math.max(0, frac * el.scrollHeight - el.clientHeight * 0.55)
  }, [torre.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const art = retratoDe(torre.npc, torre.npc.pose)
  const andarFicha = ficha ? torre.andares[ficha - 1] : null

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#0b0b0d]">
      {/* noite: textura de céu, montanhas, árvore seca, névoa */}
      <div aria-hidden="true" className="absolute inset-0 bg-[url(/images/torres/ceu-noite.webp)] bg-cover bg-[position:30%_0%]" />
      <svg aria-hidden="true" viewBox="0 0 390 640" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
        <path d="M0 560L50 520L96 548L150 500L210 540L262 498L320 536L390 506V640H0Z" fill="#141319" />
        <path d="M0 600L70 572L140 596L220 566L300 594L390 570V640H0Z" fill="#0e0d12" />
        {/* árvore seca à direita */}
        <g stroke="#0a0a0c" strokeLinecap="round" fill="none">
          <path d="M346 640C344 600 350 570 340 530" strokeWidth={6} />
          <path d="M342 560C356 548 368 548 378 534" strokeWidth={2.6} />
          <path d="M341 540C328 528 320 512 322 496" strokeWidth={2.2} />
          <path d="M340 530C344 512 352 502 350 486" strokeWidth={1.8} />
          <path d="M366 544C372 536 380 534 386 526" strokeWidth={1.2} />
          <path d="M324 508C316 500 312 492 312 484" strokeWidth={1} />
        </g>
      </svg>
      <div aria-hidden="true" className="tw-drift absolute inset-x-[-30%] bottom-[6%] h-[22%] bg-[url(/images/torres/nevoa.webp)] bg-[length:100%_100%] opacity-50" />
      {/* feixe de luz do alto sobre a escada */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[2%] top-0 h-full w-[48%] bg-[linear-gradient(180deg,rgba(236,229,216,0.16),rgba(194,185,236,0.05)_55%,transparent)] [clip-path:polygon(30%_0,70%_0,100%_100%,0_100%)] mix-blend-screen" />

      {/* cabeçalho: tema, nome, NPC na gaiola, recursos */}
      <header className="relative z-10 shrink-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.92),rgba(8,8,10,0.55)_80%,transparent)] px-4 pb-3 pt-2">
        <div className="flex items-start gap-3">
          {voltarProprio && (
            <button type="button" onClick={onVoltar} aria-label="Voltar ao mapa" className="dv-focus -ml-2 grid size-11 shrink-0 place-items-center text-dv-text-2 hover:text-dv-text">
              <GlyphArrow className="size-5 rotate-180" />
            </button>
          )}
          <div className="min-w-0 flex-1 animate-dv-cut-in pt-1">
            <Kicker tone="gold">{torre.tipo === 'principal' ? 'Torre principal · Campanha' : `Torre secundária · ${torre.tema}`}</Kicker>
            <h2 className="mt-1.5 font-display text-[25px] font-semibold uppercase leading-[1.02] tracking-[0.05em] text-dv-text [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] [text-wrap:balance]">{torre.nome}</h2>
            <p className="mt-1 font-body text-[14px] italic text-dv-text-2">
              {torre.npc.nome}
              {torre.npc.titulo ? <span className="text-dv-text-3"> · {torre.npc.titulo}</span> : null}
            </p>
          </div>
          <CageFrame tone="silver" ribbon gems="night" className="-mr-1 -mt-1 w-[84px] shrink-0 animate-dv-fade">
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art.src} alt={torre.npc.nome} className="absolute inset-0 size-full origin-top scale-[1.3] object-cover object-top" style={{ objectPosition: art.position ?? '50% 0%' }} />
            ) : (
              <svg viewBox="0 0 100 140" aria-label={`${torre.npc.nome}: NPC a definir`} role="img" className="absolute inset-0 size-full">
                <path d="M50 30C64 30 72 42 72 56S64 82 50 82 28 70 28 56 36 30 50 30ZM10 140C14 108 30 90 50 90S86 108 90 140Z" fill="#151517" stroke="#38393c" strokeWidth={1} />
                <text x="50" y="66" textAnchor="middle" fontSize="26" fill="#8a7cc8" fontFamily="serif">?</text>
              </svg>
            )}
          </CageFrame>
        </div>
        <ul aria-label="Recursos desta torre" className="mt-1 flex items-center gap-1.5">
          <RecursoChip nome={torre.essencia.nome} curto="Essências" quantidade={torre.essencia.quantidade} tipo="essencia" />
          {torre.chave && <RecursoChip nome={torre.chave.nome} curto="Chaves" quantidade={torre.chave.quantidade} tipo="chave" />}
          <li className="ml-auto flex items-baseline gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dv-text-3">
            <span className="dv-tabular font-impact text-[20px] text-dv-gold-bright">{torre.concluidos}</span>/{N}
            <span className={cn('ml-1', torre.chave && 'sr-only')}>andares</span>
          </li>
        </ul>
      </header>

      {erro && (
        <p role="alert" className="relative z-10 mx-4 border-l-2 border-dv-blood bg-dv-blood-deep/70 px-3 py-2 font-body text-[14px] text-dv-text">
          {erro}
        </p>
      )}

      {/* a escada */}
      <div ref={scroller} className="devo-scroll relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_5%,#000_94%,transparent)]">
        <div className="relative mx-auto w-full max-w-[420px]" style={{ aspectRatio: `${MAPA_W} / ${H}` }}>
          <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} ${H}`} className="absolute inset-0 size-full overflow-visible">
            <TorresDefs />
            <Escada andares={N} feitos={torre.concluidos} />
          </svg>
          {torre.andares.map((a, i) => (
            <AndarLinha
              key={a.n}
              andar={a}
              essencia={torre.essencia.nome}
              recem={recemConcluido === a.n}
              topo={(yDoAndar(a.n, N) / H) * 100}
              atraso={(N - i) * 50}
              onAbrir={() => {
                playSfx('click')
                setFicha(a.n)
              }}
            />
          ))}
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
              <BotaoTorre
                disabled={!andarFicha.cena?.length}
                sub="O andar já foi vencido"
                onClick={() => {
                  setFicha(null)
                  onRever(andarFicha)
                }}
              >
                Rever cena
              </BotaoTorre>
            ) : (
              <BotaoTorre
                carregando={subindo}
                disabled={!andarFicha.podeSubir}
                trancado={!andarFicha.podeSubir}
                sub={motivoCurto(andarFicha) ?? `Gasta ${andarFicha.custo} ${andarFicha.custo === 1 ? 'essência' : 'essências'}`}
                onClick={async () => {
                  playSfx('confirm')
                  if (await onSubir(andarFicha.n)) setFicha(null)
                }}
              >
                {`Subir ao andar ${toRoman(andarFicha.n)}`}
              </BotaoTorre>
            )
          ) : null
        }
      >
        {andarFicha && <FichaAndar andar={andarFicha} torre={torre} />}
      </Sheet>
    </div>
  )
}

const estadoVisual = (a: AndarEstado): EstadoAndar => (a.estado === 'atual' ? (a.podeSubir ? 'pronto' : 'atual') : a.estado)

function motivoCurto(a: AndarEstado) {
  if (a.estado === 'trancado') return `Requer o andar ${toRoman(a.n - 1)}`
  if (a.estado === 'atual' && !a.podeSubir) {
    if (a.faltaEssencias) return `Faltam ${a.faltaEssencias} ${a.faltaEssencias === 1 ? 'essência' : 'essências'}`
    return 'Faltam chaves'
  }
  return null
}

/**
 * Um andar na escada: estrela facetada no patamar e o texto flutuando à direita, ligado por um filete com
 * voluta. A linha inteira é o botão.
 */
function AndarLinha({ andar, essencia, recem, topo, atraso, onAbrir }: { andar: AndarEstado; essencia: string; recem: boolean; topo: number; atraso: number; onAbrir: () => void }) {
  const a = andar
  const ev = estadoVisual(a)
  const motivo = motivoCurto(a)
  const estadoTxt = a.estado === 'concluido' ? 'concluído' : a.podeSubir ? 'pronto para subir' : (motivo ?? 'trancado')
  const nodeX = ((ESCADA.AX + ESCADA.R) / MAPA_W) * 100
  const vivo = a.estado === 'atual'
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Andar ${toRoman(a.n)}: ${a.titulo}, ${estadoTxt}`}
      className="tw-andar-in dv-focus group absolute -translate-y-1/2 text-left"
      style={{ top: `${topo}%`, left: `${nodeX - 11}%`, right: '2%', animationDelay: `${atraso}ms` } as CSSProperties}
    >
      <span className="relative flex min-h-[112px] items-center">
        {/* estrela do patamar */}
        <span className={cn('relative grid size-[84px] shrink-0 place-items-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95', recem && 'tw-surge')}>
          <EstrelaAndar estado={ev} className="size-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]" />
        </span>
        {/* filete com voluta */}
        <svg aria-hidden="true" viewBox="0 0 40 20" className="-ml-3 h-5 w-9 shrink-0">
          <path d="M0 10H30" stroke={vivo ? '#c2b9ec' : a.estado === 'concluido' ? '#ece5d8' : '#6b6357'} strokeWidth={1} />
          <path d={voluta(30, 10, 4, 1)} fill="none" stroke={vivo ? '#c2b9ec' : '#8f8676'} strokeWidth={1} />
        </svg>
        {/* texto flutuante */}
        <span className="relative min-w-0 flex-1 py-2 pl-1 pr-2">
          <span aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -inset-y-4 -z-10 bg-[radial-gradient(closest-side,rgba(8,8,10,0.82),rgba(8,8,10,0.45)_65%,transparent)]" />
          <span className="flex items-baseline gap-2">
            <span className={cn('font-impact text-[30px] font-semibold leading-none -skew-x-[8deg]', a.estado === 'trancado' ? 'text-dv-text-3' : vivo ? 'text-dv-amethyst-text' : 'text-dv-gold-bright')}>{toRoman(a.n)}</span>
            <span className="dv-label text-[10px] text-dv-text-3">Andar</span>
            {a.provisorio && <span className="dv-label ml-auto text-[9px] text-dv-text-3 opacity-80">Provisório</span>}
          </span>
          <span className={cn('mt-1 line-clamp-2 font-body text-[15.5px] leading-snug [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]', a.estado === 'trancado' ? 'text-dv-text-2' : 'text-dv-text')}>{a.titulo}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {a.estado === 'concluido' ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dv-gold">Vencido</span>
            ) : (
              <>
                <span className={cn('dv-tabular flex items-center gap-1 font-mono text-[12px]', vivo && a.faltaEssencias ? 'text-dv-blood-text' : vivo ? 'text-dv-text' : 'text-dv-text-3')} title={essencia}>
                  <CristalEssencia className="h-4 w-auto" brilho={false} />×{a.custo}
                </span>
                {a.chaves.map((k) => (
                  <span key={k.item} className={cn('dv-tabular flex items-center gap-1 font-mono text-[12px]', vivo && k.tem < k.quantidade ? 'text-dv-blood-text' : vivo ? 'text-dv-text' : 'text-dv-text-3')} title={k.nome}>
                    <ChaveOrnamental className="w-6" />
                    {Math.min(k.tem, k.quantidade)}/{k.quantidade}
                  </span>
                ))}
                <span className={cn('font-body text-[13.5px] italic', a.podeSubir ? 'text-dv-amethyst-text' : 'text-dv-text-3')}>{a.podeSubir ? 'Pronto para subir' : motivo}</span>
              </>
            )}
          </span>
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
      <div className="flex items-center gap-4">
        <span className="relative grid size-24 shrink-0 place-items-center">
          {a.estado === 'concluido' || a.podeSubir ? <EstrelaAndar estado={estadoVisual(a)} className="size-full" /> : <Cadeado className="h-20 w-auto" />}
        </span>
        <div className="min-w-0">
          {a.resumo && <p className="font-body text-[15px] leading-relaxed text-dv-text-2">{a.resumo}</p>}
          <p className="mt-1 font-body text-[14px] italic text-dv-text-3">
            Em destaque: <span className="not-italic text-dv-text">{a.npc.nome}</span>
          </p>
        </div>
      </div>
      {a.estado !== 'concluido' && (
        <ul className="grid gap-2">
          <Linha ok={temEss >= a.custo} icone={<CristalEssencia className="h-9 w-auto" />} rotulo={torre.essencia.nome} valor={`${Math.min(temEss, a.custo)}/${a.custo}`} nota={a.n > 1 ? `Andar ${toRoman(a.n)}: o dobro do anterior.` : 'Custo do primeiro andar.'} />
          {a.chaves.map((k) => (
            <Linha key={k.item} ok={k.tem >= k.quantidade} icone={<ChaveOrnamental className="w-10 -rotate-45" />} rotulo={k.nome} valor={`${Math.min(k.tem, k.quantidade)}/${k.quantidade}`} nota={a.gastaChaves ? 'As chaves são gastas ao subir.' : 'Basta ter as chaves; elas não são gastas.'} />
          ))}
          {a.estado === 'trancado' && <Linha ok={false} icone={<Cadeado className="h-8 w-auto" />} rotulo={`Andar ${toRoman(a.n - 1)} concluído`} valor="—" />}
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
      {a.estado === 'concluido' && <p className="font-body text-[15px] text-dv-text-2">Andar vencido. A cena pode ser revista quando quiser.</p>}
      {a.provisorio && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dv-text-3">Conteúdo provisório: o texto deste andar ainda vai ser escrito.</p>}
    </div>
  )
}

function Linha({ ok, icone, rotulo, valor, nota }: { ok: boolean; icone?: ReactNode; rotulo: string; valor: string; nota?: string }) {
  return (
    <li className="flex items-center gap-3 border-b border-dv-line pb-2">
      <span aria-hidden="true" className="grid h-10 w-11 shrink-0 place-items-center">{icone}</span>
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
