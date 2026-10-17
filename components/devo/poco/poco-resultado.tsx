'use client'

import { useEffect, useId, useState, type CSSProperties } from 'react'
import { playSfx, pocoSilencio, pocoSom } from '@/lib/devo/audio'
import { toCosmetico } from '@/lib/devo/cosmeticos'
import { CATEGORIA_RESULTADO_LABEL, type PocoResultado } from '@/lib/devo/poco'
import { ITEM_RARITY_LABEL, type ItemRarity } from '@/lib/devo/progresso'
import { cn } from '@/lib/utils'
import { parseAsset } from '../cosmeticos/art'
import { BalaoChat, Emblema, FotoMoldurada } from '../cosmeticos/cosmetic-art'
import { useMediaQuery } from '../hooks'
import { Button } from '../kit/button'
import { DracmaIcon } from './poco-cena'
import { Ampulheta, CartaMini, LixoPoco, MoedaPoco, RecursoPoco } from './poco-itens'
import { MolduraResultado } from './poco-ornamentos'

const ART = '/images/poco'
type Tier = 0 | 1 | 2 | 3 | 4
const TIER: Record<ItemRarity, Tier> = { comum: 1, incomum: 2, raro: 3, epico: 4, lendario: 4, arcano: 4 }
/**
 * Duração da revelação por nível (ms) e o instante em que o prêmio emerge. Raro e acima têm a FALSA PARTIDA:
 * a luz sobe prata como a de um comum, engasga, e só então explode na cor da raridade.
 */
const DUR: Record<Tier, number> = { 0: 1500, 1: 1300, 2: 1600, 3: 2500, 4: 3000 }
const EMERGE: Record<Tier, number> = { 0: 420, 1: 650, 2: 850, 3: 1500, 4: 1850 }
/** Falsa partida: luz prata sobe e engasga em FALSO_MS; a cor verdadeira surge em SURTO_MS. */
const FALSO_MS = 620
const SURTO_MS = 900

/** Cor da luz pela raridade (canais RGB, para rgb(var(--c) / a)). Sem neon: tudo puxado para a paleta. */
const LUZ: Record<ItemRarity | 'lixo', string> = {
  lixo: '128 126 122',
  comum: '220 218 214',
  incomum: '207 195 168',
  raro: '167 159 208',
  epico: '210 128 142',
  lendario: '232 214 166',
  arcano: '239 232 255',
}

function tierDe(r: PocoResultado): Tier {
  if (r.categoria === 'lixo' || !r.item) return 0
  return TIER[r.item.raridade] ?? 1
}

/** Partículas determinísticas (sem Math.random no render): posição, atraso, duração e tamanho. */
function particulas(n: number, semente: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.sin((i + 1) * 12.9898 + semente * 78.233) * 43758.5453
    const f = a - Math.floor(a)
    const b = Math.sin((i + 1) * 4.1414 + semente * 19.19) * 23421.631
    const g = b - Math.floor(b)
    return { x: 30 + f * 40, d: g * 0.9, t: 1.1 + f * 1.2, s: 2 + Math.round(g * 3), ang: f * 360, dist: 60 + g * 90 }
  })
}

function destino(r: PocoResultado) {
  if (r.categoria === 'lixo') return 'Não vai para o inventário.'
  if (r.categoria === 'capsula') return 'Guardada no seu Diário.'
  if (r.categoria === 'cosmetico' || r.item?.kind === 'cosmetico') return 'Guardado nos seus cosméticos.'
  if (r.item?.meta.premio === 'tempo') return 'Somado ao seu Tempo.'
  if (r.item?.meta.premio === 'carta') return 'Entregue nas suas Cartas.'
  return 'Guardado no seu inventário.'
}

/**
 * Revelação do balde em duas etapas: (1) o balde se abre — raios e silhueta, com intensidade e duração pela
 * raridade; (2) o resultado — cada categoria com a própria apresentação dentro da moldura ornamental do nível.
 * "Pular" vai direto ao resultado. O prêmio já foi decidido e entregue pelo servidor antes da animação.
 */
export function PocoResultadoView({ r, nome, onFechar }: { r: PocoResultado; nome: string; onFechar: () => void }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const tier = tierDe(r)
  const [etapa, setEtapa] = useState<'abrindo' | 'pronto'>(reduced ? 'pronto' : 'abrindo')
  const falso = tier >= 3
  // Sons de cada etapa, num barramento próprio (pular corta tudo: nada se sobrepõe).
  useEffect(() => {
    if (reduced) {
      pocoSom(tier === 0 ? 'flop' : 'revela', tier)
      return
    }
    const ts: number[] = []
    const em = (ms: number, fn: () => void) => ts.push(window.setTimeout(fn, ms))
    if (tier === 0) {
      pocoSom('subida', 0)
      em(380, () => pocoSom('flop'))
      em(700, () => pocoSom('poeira'))
    } else if (falso) {
      pocoSom('subida', 1)
      em(FALSO_MS, () => pocoSom('falso'))
      em(SURTO_MS, () => pocoSom('subida', tier))
      em(EMERGE[tier], () => pocoSom('revela', tier))
    } else {
      pocoSom('subida', tier)
      em(EMERGE[tier] - 60, () => pocoSom('revela', tier))
    }
    // (as capturas congelam a revelação quadro a quadro com window.__pocoCongelado; no jogo é sempre falso)
    const fim = () => ((window as unknown as { __pocoCongelado?: boolean }).__pocoCongelado ? em(150, fim) : setEtapa('pronto'))
    em(DUR[tier], fim)
    return () => ts.forEach((t) => window.clearTimeout(t))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const pular = () => {
    pocoSilencio()
    playSfx('click')
    setEtapa('pronto')
  }
  const cor = LUZ[tier === 0 ? 'lixo' : (r.item?.raridade ?? 'comum')]
  const vars = { '--c': cor, '--forca': String(0.45 + tier * 0.14), '--emerge': `${EMERGE[tier]}ms` } as CSSProperties

  const nomeItem = r.categoria === 'lixo' ? (r.lixo?.nome ?? 'Nada') : (r.item?.nome ?? '')
  const raios = tier >= 4 ? 'ouro' : tier === 3 ? 'ame' : 'prata'

  return (
    <div role="dialog" aria-modal="true" aria-label={`Resultado do balde: ${nomeItem}`} className="absolute inset-0 z-40 overflow-hidden">
      <div className={cn('absolute inset-0 transition-colors duration-500', tier >= 3 ? 'bg-dv-ink/92' : 'bg-dv-ink/86')} />
      {/* fundo vinho que sobe do poço: mais forte quanto mais raro */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(80%_70%_at_50%_100%,rgb(var(--dv-wine-rgb)/0.7),transparent_75%)]" style={{ opacity: tier === 0 ? 0.35 : 0.55 + tier * 0.1 } as CSSProperties} />

      {etapa === 'abrindo' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={vars}>
          {/* a boca do poço acende embaixo */}
          <span aria-hidden="true" className="poco-boca-luz absolute bottom-[14%] left-1/2 h-[9%] w-[70%] rounded-[50%]" />
          {tier === 0 ? (
            <>
              {/* lixo: a luz tosse cinza e desiste */}
              <span aria-hidden="true" className="poco-coluna poco-coluna-murcha absolute bottom-[18%] left-1/2 h-[46%] w-[30%]" />
              <div className="poco-cai-lixo absolute left-1/2 top-[40%] size-40">
                <PremioArte r={r} nome={nome} />
              </div>
              {particulas(14, 3).map((p, i) => (
                <span key={i} aria-hidden="true" className="poco-poeira absolute top-[48%] rounded-full bg-[#8a8784]" style={{ left: `${p.x}%`, width: p.s + 1, height: p.s + 1, animationDelay: `${420 + p.d * 300}ms`, '--px': `${(p.x - 50) * 1.6}px` } as CSSProperties} />
              ))}
              <span aria-hidden="true" className="poco-sopro absolute left-1/2 top-[52%] h-16 w-48 rounded-[50%] bg-[radial-gradient(closest-side,rgba(138,135,132,0.55),transparent)]" />
            </>
          ) : (
            <>
              {/* coluna de luz: a cor e a força dizem a raridade; raro+ tem falsa partida em prata */}
              {falso && <span aria-hidden="true" className="poco-coluna poco-coluna-falsa absolute bottom-[18%] left-1/2 h-[78%] w-[34%]" />}
              <span
                aria-hidden="true"
                className={cn('poco-coluna absolute bottom-[18%] left-1/2 h-[82%]', falso ? 'poco-coluna-surto w-[58%]' : 'poco-coluna-sobe w-[40%]')}
              />
              {/* partículas em camadas: subindo com a luz (mais e mais rápidas pela raridade) */}
              {particulas(6 + tier * 5, tier).map((p, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="poco-mote absolute bottom-[18%] rotate-45"
                  style={{ left: `${p.x}%`, width: p.s, height: p.s, animationDelay: `${(falso ? SURTO_MS : 0) + p.d * 600}ms`, animationDuration: `${p.t * (1.2 - tier * 0.08)}s` } as CSSProperties}
                />
              ))}
              {/* lampejo no instante da revelação */}
              <span aria-hidden="true" className="poco-lampejo-revela absolute inset-0" />
              <img src={`${ART}/raios-${raios}.webp`} alt="" draggable={false} className="poco-raios-in poco-raro-tom pointer-events-none absolute left-1/2 top-[40%] w-[165%] max-w-none" style={{ animationDelay: `var(--emerge)`, animationDuration: `${DUR[tier] - EMERGE[tier] + 300}ms` } as CSSProperties} />
              {tier >= 4 && <img src={`${ART}/raios-ame.webp`} alt="" draggable={false} className="poco-raios-in-rev poco-raro-tom pointer-events-none absolute left-1/2 top-[40%] w-[125%] max-w-none" style={{ animationDelay: `var(--emerge)` } as CSSProperties} />}
              <img src={`${ART}/aro-${tier}.webp`} alt="" draggable={false} className="poco-aro-in poco-raro-tom pointer-events-none absolute left-1/2 top-[40%] w-[78%] max-w-[320px]" style={{ animationDelay: `var(--emerge)`, animationDuration: `${DUR[tier] - EMERGE[tier]}ms` } as CSSProperties} />
              {/* o prêmio emerge da luz: sombra que se dissolve sobre a arte real, com um brilho que varre */}
              <div className="absolute left-1/2 top-[40%] size-44 -translate-x-1/2 -translate-y-1/2">
                <div className="poco-emergir absolute inset-0" style={{ animationDelay: `var(--emerge)`, animationDuration: `${Math.max(700, DUR[tier] - EMERGE[tier])}ms` } as CSSProperties}>
                  <PremioArte r={r} nome={nome} />
                  <div className="poco-sombra-sai absolute inset-0" style={{ animationDelay: `var(--emerge)` } as CSSProperties}>
                    <PremioArte r={r} nome={nome} silhueta />
                  </div>
                  <span aria-hidden="true" className="poco-varre absolute inset-0 overflow-hidden" style={{ animationDelay: `calc(var(--emerge) + 450ms)` } as CSSProperties} />
                </div>
              </div>
              {/* estouro de faíscas na revelação */}
              {particulas(tier >= 3 ? 18 : 8, tier + 7).map((p, i) => (
                <span
                  key={`f${i}`}
                  aria-hidden="true"
                  className="poco-faisca absolute left-1/2 top-[40%] rotate-45"
                  style={{ width: p.s, height: p.s, '--ang': `${p.ang}deg`, '--dist': `${p.dist * (tier >= 3 ? 1.3 : 0.9)}px`, animationDelay: `calc(var(--emerge) + ${Math.round(p.d * 120)}ms)` } as CSSProperties}
                />
              ))}
            </>
          )}
          <img src={`${ART}/respingo.webp`} alt="" draggable={false} className={cn('poco-respingo poco-dessatura pointer-events-none absolute left-1/2 top-[64%] w-[70%] max-w-[300px]', tier === 0 && 'opacity-50 grayscale')} />
          <p className="dv-label absolute bottom-[24%] text-[11px] text-dv-text-2 [text-shadow:0_1px_6px_#000]">{tier === 0 ? 'Algo pinga do balde…' : tier >= 3 ? 'O poço responde' : 'O balde se abre'}</p>
          <button
            type="button"
            onClick={pular}
            className="dv-focus absolute right-3 top-3 flex min-h-11 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2 hover:text-dv-text"
          >
            Pular
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
              <path d="M2 3l6 5-6 5zM8 3l6 5-6 5z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="devo-scroll absolute inset-0 flex flex-col items-center overflow-y-auto px-4 pb-5 pt-4">
          {tier >= 2 && <img src={`${ART}/raios-${raios}.webp`} alt="" draggable={false} className="poco-raios-lento poco-raro-tom pointer-events-none absolute left-1/2 top-[27%] w-[118%] max-w-none opacity-60" />}
          {/* luz da raridade atrás da moldura; lixo: poeira cinza assentando */}
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[30%] size-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(var(--c)/0.32),transparent_70%)]" style={{ ...vars, opacity: tier === 0 ? 0.4 : 0.5 + tier * 0.12 } as CSSProperties} />
          {tier >= 3 &&
            particulas(8, tier + 13).map((p, i) => (
              <span key={i} aria-hidden="true" className="poco-mote poco-mote-lento pointer-events-none absolute top-[44%] rotate-45" style={{ ...vars, left: `${p.x}%`, width: p.s, height: p.s, animationDelay: `${p.d * 3}s`, animationDuration: `${3.5 + p.t * 2}s` } as CSSProperties} />
            ))}
          {tier === 0 &&
            particulas(8, 21).map((p, i) => (
              <span key={i} aria-hidden="true" className="poco-poeira poco-poeira-lenta pointer-events-none absolute top-[22%] rounded-full bg-[#8a8784]" style={{ left: `${p.x}%`, width: p.s, height: p.s, animationDelay: `${p.d * 2}s`, '--px': `${(p.x - 50) * 0.4}px` } as CSSProperties} />
            ))}
          <MolduraResultado raridade={r.item?.raridade} lixo={tier === 0} className="poco-reveal mt-auto w-full max-w-[360px]">
            <div className={cn('flex flex-col items-center px-6 text-center', tier === 0 ? 'pb-5 pt-5' : 'pb-7 pt-12')}>
              <div className={cn('relative grid place-items-center', tier === 0 ? 'poco-lixo-murcho size-28' : 'size-40')} style={vars}>
                <PremioArte r={r} nome={nome} />
                {tier > 0 && <span aria-hidden="true" className="poco-varre absolute inset-0 overflow-hidden" style={{ animationDelay: '250ms' } as CSSProperties} />}
              </div>
              <p className={cn('dv-label mt-2 flex items-center gap-2 text-[10.5px]', tier === 0 ? 'text-dv-text-3' : 'text-dv-gold')}>
                {CATEGORIA_RESULTADO_LABEL[r.categoria]}
                {r.gratis && <span className="text-dv-text-3">· giro grátis</span>}
              </p>
              <h2 className={cn('mt-2 text-balance font-display font-semibold uppercase leading-tight tracking-[0.08em]', tier === 0 ? 'text-[21px] text-dv-text-2' : 'text-[25px] text-dv-porcelain')}>
                {nomeItem}
                {r.quantidade > 1 && <span className="ml-2 font-impact text-[26px] tracking-normal text-dv-gold-bright">×{r.quantidade}</span>}
              </h2>
              {r.item && <SeloRaridade raridade={r.item.raridade} provisorio={r.item.meta.provisorio === true} />}
              <Texto r={r} />
              <p className={cn('mt-3 font-mono text-[11px] uppercase tracking-[0.14em]', tier === 0 ? 'text-dv-text-3' : 'text-dv-text-2')}>{destino(r)}</p>
              <Button block className="mt-5" variant={tier === 0 ? 'secondary' : 'primary'} sfx="confirm" onClick={onFechar}>
                {tier === 0 ? 'Devolver ao poço' : 'Guardar'}
              </Button>
              <details className="mt-3 w-full text-left">
                <summary className="dv-focus flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dv-text-3">
                  <DracmaIcon raridade="comum" className="size-4 opacity-70" />
                  Selo do sorteio · {r.acertos} {r.acertos === 1 ? 'acerto' : 'acertos'}
                </summary>
                <dl className="mt-1 grid gap-1 break-all font-mono text-[10.5px] leading-snug text-dv-text-3">
                  <dt className="text-dv-text-2">Compromisso (sha256)</dt>
                  <dd>{r.seedHash}</dd>
                  <dt className="text-dv-text-2">Segredo revelado</dt>
                  <dd>{r.seed}</dd>
                  <dt className="text-dv-text-2">Giro</dt>
                  <dd>{r.id}</dd>
                </dl>
              </details>
            </div>
          </MolduraResultado>
          <div className="mb-auto" />
        </div>
      )}
    </div>
  )
}

function Texto({ r }: { r: PocoResultado }) {
  if (r.categoria === 'lixo') return <p className="mt-3 text-pretty font-body text-[15.5px] italic leading-relaxed text-dv-text-3">{r.lixo?.texto}</p>
  if (r.categoria === 'capsula') {
    return (
      <div className="relative mt-3 w-full bg-dv-porcelain px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] [clip-path:polygon(0_6px,6px_0,calc(100%-6px)_0,100%_6px,100%_calc(100%-6px),calc(100%-6px)_100%,6px_100%,0_calc(100%-6px))]">
        <span aria-hidden="true" className="absolute inset-y-2 left-2 border-l border-dashed border-[#9a998f]" />
        <p className="pl-2 font-body text-[15px] leading-relaxed text-dv-paper-ink">{String(r.item?.meta.texto ?? r.item?.descricao ?? '')}</p>
      </div>
    )
  }
  return r.item?.descricao ? <p className="mt-3 text-pretty font-body text-[15.5px] leading-relaxed text-dv-text-2">{r.item.descricao}</p> : null
}

/** Selo de raridade: losango de metal com a joia do nível e o nome gravado. */
function SeloRaridade({ raridade, provisorio }: { raridade: ItemRarity; provisorio: boolean }) {
  const t = TIER[raridade]
  return (
    <p className="mt-2.5 flex items-center gap-2">
      <span className="flex items-center gap-1.5 border border-dv-line-strong bg-dv-ink py-1 pl-1.5 pr-2.5">
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={cn('size-2 rotate-45', i < t ? (t >= 3 ? 'bg-dv-amethyst shadow-[0_0_6px_rgb(var(--dv-amethyst-rgb)/0.9)]' : 'bg-dv-gold') : 'border border-dv-line-strong')} />
          ))}
        </span>
        <span className={cn('dv-label text-[10.5px]', t >= 3 ? 'text-dv-amethyst-text' : 'text-dv-text-2')}>{ITEM_RARITY_LABEL[raridade]}</span>
      </span>
      {provisorio && <span className="dv-label border border-dv-line px-2 py-1 text-[10px] text-dv-text-3">Texto provisório</span>}
    </p>
  )
}

/* ── Arte de cada categoria ───────────────────────────────────────────────────────────── */

export function PremioArte({ r, nome, silhueta = false }: { r: PocoResultado; nome: string; silhueta?: boolean }) {
  const cls = cn('relative size-full object-contain', silhueta && 'brightness-0')
  if (r.categoria === 'lixo') return <LixoPoco id={r.lixo?.id ?? 'nada'} imagem={r.lixo?.imagem} tamanho={176} className={cn(cls, !silhueta && 'opacity-90 grayscale-[0.3]')} />
  const meta = r.item?.meta ?? {}
  // Prêmio do pool do Owner: imagem própria, carta, Tempo ou item do catálogo.
  if (r.categoria === 'premio' && r.item) {
    const img = typeof meta.imagem === 'string' ? meta.imagem : null
    const halo = !silhueta && <span aria-hidden="true" className="poco-halo absolute inset-[-12%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--c,220_218_214)/0.5),rgb(var(--c,220_218_214)/0.08)_60%,transparent_72%)]" />
    if (img) return <>{halo}<img src={img} alt="" draggable={false} className={cls} /></>
    if (meta.premio === 'tempo') return <>{halo}<Ampulheta className={cls} /></>
    if (meta.premio === 'carta') return <>{halo}<CartaMini className={cn(cls, 'p-4')} /></>
    if (r.item.kind === 'cosmetico') return <Cosmetico r={r} nome={nome} silhueta={silhueta} />
    if (r.item.kind === 'moeda') return <>{halo}<MoedaPoco chave={r.item.key} raridade={r.item.raridade} tamanho={176} className={cn(cls, 'p-6')} /></>
    const rec = r.item.kind === 'capsula' ? 'capsula' : r.item.kind === 'essencia' ? 'essencia' : 'fragmento'
    return <>{halo}<RecursoPoco id={rec} tamanho={176} className={cls} /></>
  }
  if (r.categoria === 'cosmetico' && r.item) return <Cosmetico r={r} nome={nome} silhueta={silhueta} />
  const src = r.categoria === 'capsula' ? 'capsula' : r.categoria === 'essencia' ? 'essencia' : 'fragmento'
  return (
    <>
      {!silhueta && <span aria-hidden="true" className="poco-halo absolute inset-[-12%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--c,220_218_214)/0.5),rgb(var(--c,220_218_214)/0.08)_60%,transparent_72%)]" />}
      <RecursoPoco id={src} tamanho={176} className={cls} />
    </>
  )
}

/** Cosméticos: moldura aplicada a um avatar, emblema em destaque, balão aplicado a uma mensagem. */
function Cosmetico({ r, nome, silhueta }: { r: PocoResultado; nome: string; silhueta: boolean }) {
  const meta = r.item?.meta ?? {}
  const cat = String(meta.categoria ?? '')
  const asset = typeof meta.asset === 'string' && meta.asset.startsWith('/') ? meta.asset : null
  const t = TIER[r.item?.raridade ?? 'comum']
  // Arte real do catálogo de cosméticos (imagem do pipeline ou SVG desenhado), aplicada como no jogo
  const def = r.item ? toCosmetico({ key: r.item.key, name: r.item.nome, description: r.item.descricao, rarity: r.item.raridade, meta: r.item.meta, active: true }) : null
  if (def && (def.imagem || parseAsset(def.asset)) && cat !== 'efeito') {
    if (cat === 'balao')
      return (
        <div className={cn('flex w-[230px] items-end gap-2', silhueta && 'brightness-0')}>
          <Avatar nome={nome} className="size-10 shrink-0" fs={17} />
          <BalaoChat def={def} className="min-w-0 flex-1 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-80">{nome}</p>
            <p className="mt-0.5 font-body text-[15px] leading-snug">O poço gostou de mim hoje.</p>
          </BalaoChat>
        </div>
      )
    if (cat === 'emblema')
      return (
        <div className={cn('relative grid size-full place-items-center', silhueta && 'brightness-0')}>
          <span aria-hidden="true" className="poco-halo absolute inset-[-10%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--dv-amethyst-text-rgb)/0.55),transparent_70%)]" />
          <Emblema def={def} tamanho={138} className="relative" />
        </div>
      )
    return (
      <div className={cn('relative grid size-full place-items-center', silhueta && 'brightness-0')}>
        <FotoMoldurada formato="mini" src={null} moldura={def} vazio={<Avatar nome={nome} className="size-full" />} />
      </div>
    )
  }
  if (cat === 'balao') {
    return (
      <div className={cn('flex w-[230px] items-end gap-2', silhueta && 'brightness-0')}>
        <Avatar nome={nome} className="size-10 shrink-0" fs={17} />
        <div className="relative min-w-0 flex-1 px-3.5 pb-2.5 pt-2 text-left">
          {asset ? (
            <img src={asset} alt="" className="absolute inset-0 size-full object-fill" />
          ) : (
            <BalaoOrnamental tier={t} />
          )}
          <p className="relative font-mono text-[10px] uppercase tracking-[0.14em] text-dv-gold">{nome}</p>
          <p className="relative mt-0.5 font-body text-[15px] leading-snug text-dv-text">O poço gostou de mim hoje.</p>
        </div>
      </div>
    )
  }
  if (cat === 'emblema') {
    return (
      <div className={cn('relative size-full', silhueta && 'brightness-0')}>
        <span aria-hidden="true" className="poco-halo absolute inset-[-10%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--dv-amethyst-text-rgb)/0.55),transparent_70%)]" />
        {asset ? <img src={asset} alt="" className="relative size-full object-contain" /> : <EmblemaOrnamental tier={t} />}
      </div>
    )
  }
  // moldura de avatar / miniperfil / efeito: aplicada ao avatar do jogador
  return (
    <div className={cn('relative size-full', silhueta && 'brightness-0')}>
      <Avatar nome={nome} className="absolute inset-[16%]" />
      {asset ? <img src={asset} alt="" className="absolute inset-0 size-full object-contain" /> : <MolduraAvatar tier={t} />}
    </div>
  )
}

function Avatar({ nome, className, fs = 30 }: { nome: string; className?: string; fs?: number }) {
  return (
    <span className={cn('grid place-items-center overflow-hidden rounded-full bg-dv-ink-2 bg-[url(/images/os/marmore-negro.webp)] bg-[length:240px_240px] shadow-[inset_0_0_0_1px_rgb(var(--dv-text-rgb)/0.25)]', className)}>
      <span className="font-display font-semibold uppercase text-dv-porcelain" style={{ fontSize: fs }}>{(nome || '?').slice(0, 1)}</span>
    </span>
  )
}

/** Moldura de avatar desenhada (enquanto o catálogo não traz o asset): aro de aço, volutas e joias pelo nível. */
function MolduraAvatar({ tier }: { tier: Tier }) {
  const id = useId().replace(/:/g, '')
  const gems = tier >= 3 ? 6 : tier >= 2 ? 4 : 0
  return (
    <svg viewBox="0 0 160 160" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f1e7" />
          <stop offset="0.4" stopColor="#bab09f" />
          <stop offset="0.7" stopColor="#6b6357" />
          <stop offset="1" stopColor="#ece5d8" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="56" fill="none" stroke={`url(#${id}-m)`} strokeWidth="7" />
      <circle cx="80" cy="80" r="61" fill="none" stroke="#bab09f" strokeWidth="0.8" opacity="0.7" />
      {tier >= 2 && <path d="M80 6L90 22L80 30L70 22Z" fill={`url(#${id}-m)`} />}
      {tier >= 3 && <path d="M80 12L85 21L80 26L75 21Z" fill="#8f86b4" />}
      {Array.from({ length: gems }, (_, i) => {
        const a = ((i / gems) * 360 + 90) * (Math.PI / 180)
        const x = 80 + Math.cos(a) * 56
        const y = 80 + Math.sin(a) * 56
        return <path key={i} d={`M${x} ${y - 6}L${x + 4.5} ${y}L${x} ${y + 6}L${x - 4.5} ${y}Z`} fill="#8f86b4" stroke="#ece5d8" strokeWidth="0.8" />
      })}
      {tier >= 4 &&
        Array.from({ length: 12 }, (_, i) => {
          const a = ((i / 12) * 360) * (Math.PI / 180)
          const x1 = 80 + Math.cos(a) * 64, y1 = 80 + Math.sin(a) * 64
          const x2 = 80 + Math.cos(a) * 76, y2 = 80 + Math.sin(a) * 76
          return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={`url(#${id}-m)`} strokeWidth="2.4" strokeLinecap="round" />
        })}
    </svg>
  )
}

function EmblemaOrnamental({ tier }: { tier: Tier }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 120" className="relative size-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f1e7" />
          <stop offset="0.5" stopColor="#a59a87" />
          <stop offset="1" stopColor="#3a352e" />
        </linearGradient>
      </defs>
      <path d="M60 4L68 44L108 52L68 60L60 116L52 60L12 52L52 44Z" fill={`url(#${id}-m)`} stroke="#1d1a16" />
      <path d="M68 36A22 22 0 1 0 68 76A17 17 0 0 1 68 36Z" fill="#141217" stroke="#ece5d8" strokeWidth="1" />
      <path d="M60 46L64 56L60 66L56 56Z" fill={tier >= 3 ? '#8f86b4' : '#bab09f'} />
    </svg>
  )
}

function BalaoOrnamental({ tier }: { tier: Tier }) {
  return (
    <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
      <path d="M8 4H192L196 8V58L192 62H22L4 70L10 60L4 56V8Z" fill="#141417" stroke={tier >= 3 ? '#8f86b4' : '#bab09f'} strokeWidth="1.4" />
      <path d="M12 9H188V54H14Z" fill="none" stroke="#6b6357" strokeWidth="0.6" />
      {tier >= 2 && <path d="M186 4L196 4L196 14" fill="none" stroke="#ece5d8" strokeWidth="1.4" />}
    </svg>
  )
}
