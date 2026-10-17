'use client'

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import type { Arte, Efeito, Ilustracao, NpcRef, Opcao, Passo } from '@/lib/devo/torres/tipos'
import { cn } from '@/lib/utils'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, useTypewriter } from '../intro/vn'
import { FrameCorners, GlyphDiamond, Kicker, Lantern, NpcAnchor } from '../kit'
import { usePlayerText } from '../state/player-text'
import { MAPA_W, starPath, TorreArte, TorresDefs } from './arte'
import { TorreIlustradaImg } from './ilustrada'
import { retratoDe } from './retrato'
import './torres.css'

/**
 * Motor de cena das Torres (fallback local enquanto o motor da Narrativa não chega — docs/redesign/DIALOGO.md).
 * Lê passos como DADO (lib/devo/torres/tipos.ts › Passo): fala, jogador, narra, sistema, bloco e escolha com
 * resposta por opção, efeito no servidor e encerramento. Máquina de escrever, placa do falante e escolhas em
 * tiras vêm de `intro/vn.tsx` (a mesma linguagem do prólogo).
 */

export type CenaProps = {
  passos: Passo[]
  /** NPC padrão das falas. */
  npc: NpcRef | null
  titulo: string
  kicker?: string
  fundo?: 'torre' | 'reflexao'
  /** Arte de torre ao fundo do palco. */
  arteFundo?: Arte
  /** Ilustração pintada da torre (substitui o desenho vetorial ao fundo). */
  ilustracaoFundo?: Ilustracao | null
  /** Efeito pedido por uma escolha. Pode devolver um aviso ("+1 Essência…"). */
  onEfeito?: (e: Efeito) => Promise<string | null | void> | string | null | void
  /** Toda escolha feita (índice do passo de escolha na ordem em que apareceu, índice da opção 0-based). */
  onOpcao?: (opcao: Opcao, indice: number) => void
  onFim: () => void
  /** Owner/Anfitrião: botão "Pular". */
  onPular?: () => void
  className?: string
}

/** Texto com direção de cena entre colchetes em itálico apagado: "Besteira. [Dedo do meio censurado.]" */
function Falado({ texto }: { texto: string }) {
  const parts = texto.split(/(\[[^\]]*\]?)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('[') ? (
          <em key={i} className="font-body italic text-dv-text-3">
            {p}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

export function Cena({ passos, npc, titulo, kicker, fundo = 'torre', arteFundo = 'agulha', ilustracaoFundo, onEfeito, onOpcao, onFim, onPular, className }: CenaProps) {
  const say = usePlayerText()
  const [fila, setFila] = useState<Passo[]>(passos)
  const [i, setI] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [saindo, setSaindo] = useState(false)
  // caixa de fala/escolhas: o retrato se ancora nela
  const [caixa, setCaixa] = useState<HTMLElement | null>(null)
  const passo = fila[i]
  // A última pose falada fica no palco durante escolhas e quadros.
  const [pose, setPose] = useState<string | undefined>(npc?.pose)
  useEffect(() => {
    if (passo?.tipo === 'fala' && (!passo.quem || passo.quem === npc?.id)) setPose(passo.pose ?? npc?.pose)
  }, [passo, npc])

  // pré-carrega as poses da cena (troca sem piscar)
  useEffect(() => {
    if (!npc) return
    const poses = new Set<string>()
    const walk = (ps: Passo[]) =>
      ps.forEach((p) => {
        if (p.tipo === 'fala' && p.pose) poses.add(p.pose)
        if (p.tipo === 'escolha') p.opcoes.forEach((o) => o.resposta && walk(o.resposta))
      })
    walk(passos)
    poses.forEach((p) => {
      const art = retratoDe(npc, p)
      if (art) new Image().src = art.src
    })
  }, [npc, passos])

  const fim = () => {
    if (saindo) return
    setSaindo(true)
    playSfx('whoosh')
    window.setTimeout(onFim, 380)
  }

  const avancar = () => {
    if (ocupado) return
    if (i + 1 < fila.length) {
      playSfx('click')
      setI(i + 1)
    } else fim()
  }

  const escolher = async (op: Opcao, idx: number) => {
    if (ocupado) return
    playSfx(op.acao ? 'confirm' : 'click')
    onOpcao?.(op, idx)
    if (op.efeito && onEfeito) {
      setOcupado(true)
      try {
        const msg = await onEfeito(op.efeito)
        if (msg) {
          setAviso(msg)
          playSfx('reveal')
          window.setTimeout(() => setAviso(null), 3200)
        }
      } finally {
        setOcupado(false)
      }
    }
    const depois = op.encerra ? [] : fila.slice(i + 1)
    const nova = [...fila.slice(0, i + 1), ...(op.resposta ?? []), ...depois]
    if (nova.length > i + 1) {
      setFila(nova)
      setI(i + 1)
    } else fim()
  }

  const texto = passo && 'texto' in passo && typeof passo.texto === 'string' ? say(passo.texto) : ''
  const tw = useTypewriter(texto, 24)
  const ehEscolha = passo?.tipo === 'escolha'
  const ehBloco = passo?.tipo === 'bloco'

  const tocar = () => {
    if (ehEscolha || ocupado) return
    if (!ehBloco && !tw.done) return tw.finish()
    avancar()
  }
  const tocarRef = useRef(tocar)
  tocarRef.current = tocar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = e.target as HTMLElement | null
      if (el && el.closest('button') && el.closest('[data-cena-escolhas]')) return
      e.preventDefault()
      tocarRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // quem fala
  const falante = useMemo(() => {
    if (!passo) return null
    if (passo.tipo === 'fala') return { nome: npc && (!passo.quem || passo.quem === npc.id) ? npc.nome : (passo.quem ?? '???'), titulo: npc?.titulo, tone: 'gold' as const }
    if (passo.tipo === 'jogador') return { nome: 'Você', titulo: undefined, tone: 'void' as const }
    if (passo.tipo === 'sistema') return { nome: 'Mensagem do sistema', titulo: undefined, tone: 'system' as const }
    return null
  }, [passo, npc])

  const art = npc && fundo !== 'reflexao' ? retratoDe(npc, pose) : null
  const npcApagado = !passo || passo.tipo === 'jogador' || passo.tipo === 'narra' || passo.tipo === 'sistema' || ehBloco

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className={cn('absolute inset-0 z-40 flex flex-col overflow-hidden bg-dv-ink transition-opacity duration-[380ms]', saindo ? 'opacity-0' : 'animate-dv-fade', className)}
    >
      {/* palco: noite, a torre ao longe, piso de mármore e holofote */}
      <div aria-hidden="true" className="absolute inset-0 bg-[url(/images/torres/ceu-noite.webp)] bg-cover bg-[position:30%_0%]" />
      {/* lanternas penduradas (salão do relógio) */}
      {fundo !== 'reflexao' && (
        <>
          <Lantern chain={70} className="pointer-events-none absolute left-[6%] top-0 w-9 opacity-90" />
          <Lantern chain={120} className="pointer-events-none absolute right-[8%] top-0 w-8 opacity-80" style={{ animationDelay: '-2s' }} />
        </>
      )}
      <svg aria-hidden="true" viewBox={`0 0 ${MAPA_W} 640`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
        <TorresDefs />
        <path d="M0 420L48 384L92 404L150 360L206 398L262 364L318 400L390 372V640H0Z" fill="#141319" />
        <path d="M0 450L70 428L140 446L220 424L300 446L390 430V640H0Z" fill="#0e0d12" />
        {fundo !== 'reflexao' && ilustracaoFundo ? null : fundo !== 'reflexao' ? (
          <g transform="translate(318 446) scale(0.86)" opacity={0.6}>
            <TorreArte arte={arteFundo} feitos={0} total={7} />
          </g>
        ) : (
          <g opacity={0.35}>
            <g transform="translate(120 480) scale(0.5)">
              <TorreArte arte="agulha" feitos={1} total={7} />
            </g>
            <path d={starPath(310, 120, 10)} fill="#ece5d8" opacity={0.5} />
          </g>
        )}
        <linearGradient id="tw-palco-chao" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0c0c0e" stopOpacity="0" />
          <stop offset="1" stopColor="#0c0c0e" stopOpacity="0.85" />
        </linearGradient>
        <rect y={380} width={MAPA_W} height={260} fill="url(#tw-palco-chao)" />
      </svg>
      {fundo !== 'reflexao' && ilustracaoFundo && (
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[26%] right-[-6%] h-[62%] opacity-70 [mask-image:linear-gradient(to_top,transparent,#000_22%)]">
          <TorreIlustradaImg ilu={ilustracaoFundo} sizes="(max-width: 640px) 45vw, 240px" className="h-full" brilho={false} />
        </div>
      )}
      <span aria-hidden="true" className="dv-checker-marble pointer-events-none absolute inset-x-[-40%] bottom-[-6%] h-[42%] opacity-30 [mask-image:linear-gradient(to_top,black,transparent)] [transform:perspective(520px)_rotateX(62deg)]" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[70%] w-[30rem] max-w-full bg-[radial-gradient(ellipse_at_top,rgba(236,229,216,0.16),transparent_70%)]" />

      {/* barra superior */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pt-3">
        <Kicker tone="gold">{kicker ?? titulo}</Kicker>
        {onPular && (
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh')
              onPular()
            }}
            className="dv-focus -mr-2 inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-[0.22em] text-dv-text-3 transition-colors hover:text-dv-text"
          >
            Pular
          </button>
        )}
      </div>

      {/* NPC */}
      <div className="relative min-h-0 flex-1">
        {/* retrato do elenco ANCORADO à caixa de fala (kit/npc-anchor): base atrás do topo da caixa, sem vão */}
        {art && npc && !npc.retrato && (
          <NpcAnchor
            npc={npc.id}
            pose={pose}
            fala={caixa}
            alt={`${npc.nome}${npc.titulo ? `, ${npc.titulo}` : ''}`}
            cabeca="min(16dvh, 150px)"
            reserva={56}
            sobreposicao={46}
            className={cn('tw-breathe origin-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.7)] transition-[filter,opacity] duration-500', npcApagado ? 'opacity-45 [filter:grayscale(0.6)_brightness(0.6)]' : 'opacity-100')}
          />
        )}
        {art && npc?.retrato && (
          <div key={art.src} className={cn('absolute inset-x-0 bottom-0 top-[4%] animate-dv-fade transition-[filter,opacity] duration-500', npcApagado ? 'opacity-45 [filter:grayscale(0.6)_brightness(0.6)]' : 'opacity-100')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={art.src}
              alt={npc ? `${npc.nome}${npc.titulo ? `, ${npc.titulo}` : ''}` : ''}
              draggable={false}
              className="tw-breathe absolute inset-x-0 bottom-[-14%] top-[-6%] mx-auto h-[120%] w-full max-w-[560px] origin-bottom scale-[1.32] object-contain object-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.7)] [mask-image:linear-gradient(to_bottom,#000_72%,transparent_96%)]"
            />
          </div>
        )}
        {!art && npc && fundo !== 'reflexao' && <Silhueta />}

        {aviso && (
          <div role="status" className="animate-dv-pop absolute inset-x-0 top-3 z-20 flex justify-center px-4">
            <span className="relative isolate flex items-center gap-2.5 px-4 py-2.5" style={{ '--dv-cut': '10px' } as CSSProperties}>
              <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--dv-gold-bright),var(--dv-gold-deep)_45%,var(--dv-gold))]" />
              <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[linear-gradient(180deg,var(--dv-ink-3),var(--dv-ink))]" style={{ '--dv-cut': '9.6px' } as CSSProperties} />
              <Essencia className="size-6" />
              <span className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-dv-gold-bright">{aviso}</span>
            </span>
          </div>
        )}

        {/* quadro do sistema: "aquela parada estranha" */}
        {passo?.tipo === 'bloco' && (
          <div key={i} className="absolute inset-x-4 top-[8%] z-10 flex justify-center">
            <button type="button" onClick={tocar} className="tw-glitch dv-focus relative isolate w-full max-w-md overflow-hidden px-5 pb-5 pt-6 text-left" style={{ '--dv-cut': '16px' } as CSSProperties}>
              <span aria-hidden="true" className="dv-cut absolute inset-0 -z-10 bg-[linear-gradient(135deg,#ece5d8,#6b6357_30%,#bab09f_62%,#5f584d_88%,var(--dv-amethyst))]" />
              <span aria-hidden="true" className="dv-cut absolute inset-px -z-10 bg-[linear-gradient(180deg,rgba(31,31,34,0.97),rgb(var(--dv-ink-rgb)/0.98))]" style={{ '--dv-cut': '15.6px' } as CSSProperties} />
              <span aria-hidden="true" className="tw-scan pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgb(var(--dv-amethyst-rgb)/0.18),transparent)]" />
              <FrameCorners tone="gold" size={18} inset={5} />
              <span className="flex items-center gap-2">
                <GlyphDiamond className="size-2.5 text-dv-amethyst" filled />
                <span className="font-display text-[17px] font-semibold uppercase tracking-[0.14em] text-dv-text">[{passo.titulo}]</span>
              </span>
              <span aria-hidden="true" className="mt-3 block h-px bg-gradient-to-r from-dv-gold/70 via-dv-line-strong to-transparent" />
              {passo.texto.map((t, k) => (
                <span key={k} className="mt-3 block font-body text-[16px] leading-relaxed text-dv-text-2">
                  {say(t)}
                </span>
              ))}
              <span className="mt-4 flex justify-end">
                <AdvanceIndicator visible label="Continuar" tone="gold" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* caixa de diálogo / escolhas */}
      <div ref={setCaixa} className="dv-safe-bottom relative z-10 shrink-0 px-3 pb-3 pt-8">
        {passo?.tipo === 'escolha' ? (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5" aria-label="Sua resposta" role="group" data-cena-escolhas>
            <ChoiceHeader>Sua resposta</ChoiceHeader>
            {passo.opcoes.map((o, k) => (
              <ChoiceStrip key={`${i}-${k}`} index={k} label={say(o.texto)} action={o.acao} delay={k * 70} onClick={() => escolher(o, k)} />
            ))}
          </div>
        ) : !ehBloco && passo ? (
          <button type="button" onClick={tocar} className="dv-focus mx-auto block w-full max-w-xl text-left" aria-live="polite">
            <DialogueShell tone={falante?.tone === 'system' ? 'cobalt' : falante ? 'gold' : 'neutral'} className="min-h-[136px] px-5 pb-4 pt-7">
              {falante && <SpeakerPlate name={falante.nome} title={falante.titulo} tone={falante.tone} />}
              <span className="sr-only">{texto}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'block min-h-[4.5em] pt-4 font-body text-[17px] leading-relaxed',
                  passo.tipo === 'jogador' && 'italic text-dv-text',
                  passo.tipo === 'narra' && 'pt-1 text-center italic text-dv-text-2',
                  passo.tipo === 'sistema' && 'text-dv-cobalt-text',
                  passo.tipo === 'fala' && 'text-dv-text',
                )}
              >
                <Falado texto={texto.slice(0, tw.shown)} />
              </span>
              <span className="mt-1 flex justify-end">
                <AdvanceIndicator visible={tw.done} label={i + 1 < fila.length ? undefined : 'Fim'} tone="gold" />
              </span>
            </DialogueShell>
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Silhueta quando o NPC ainda não tem sprite (ex.: Corvo). */
function Silhueta() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 240" className="absolute inset-x-0 bottom-0 mx-auto h-[80%] opacity-80">
      <defs>
        <linearGradient id="tw-sil" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f1f22" />
          <stop offset="1" stopColor="#0c0c0e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M100 30c22 0 36 18 36 40s-14 42-36 42-36-20-36-42 14-40 36-40Zm-74 210c4-58 34-96 74-96s70 38 74 96Z" fill="url(#tw-sil)" stroke="#5f584d" strokeWidth="1" />
    </svg>
  )
}

/** Gema de Essência de Afinidade: losango facetado em aço com coração ametista. */
export function Essencia({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="tw-ess" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ece5d8" />
          <stop offset="0.5" stopColor="#bab09f" />
          <stop offset="1" stopColor="#5f584d" />
        </linearGradient>
        <radialGradient id="tw-ess-c" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#e6e0ff" />
          <stop offset="0.6" stopColor="#8a7cc8" />
          <stop offset="1" stopColor="#4e4580" />
        </radialGradient>
      </defs>
      <path d="M12 1.5 20 12 12 22.5 4 12Z" fill="url(#tw-ess)" />
      <path d="M12 5 16.6 12 12 19 7.4 12Z" fill="url(#tw-ess-c)" />
      <path d="M12 5V19M7.4 12H16.6" stroke="#ece5d8" strokeWidth="0.5" opacity="0.6" />
    </svg>
  )
}

/** Chave de torre: haste de aço com cabeça em estrela de quatro pontas. */
export function ChaveIcone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path d="M12 2.2c.5 3 1.8 4.3 4.8 4.8-3 .5-4.3 1.8-4.8 4.8-.5-3-1.8-4.3-4.8-4.8 3-.5 4.3-1.8 4.8-4.8Z" fill="#ece5d8" />
      <circle cx="12" cy="7" r="1.3" fill="#0c0c0e" />
      <path d="M12 11.5V22M12 17.5h3.2M12 20.2h2.2" stroke="#bab09f" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
