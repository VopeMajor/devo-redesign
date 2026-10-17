'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { playDeixa, playSfx } from '@/lib/devo/audio'
import { CENA_POCO_ENCONTRO } from '@/lib/devo/dialogo/cenas/poco-encontro'
import type { CenaEstado, Opcao, Passo, PassoResposta } from '@/lib/devo/dialogo/formato'
import { indicePasso } from '@/lib/devo/dialogo/registro'
import type { PocoMoeda } from '@/lib/devo/poco'
import { generoTexto, NEBLINA_QUADROS, type NeblinaPalco } from '@/lib/devo/poco-neblina'
import { cn } from '@/lib/utils'
import { aplicarEfeito, concluirCena, escolher as escolherApi, lerCena, salvarPasso } from '../dialogo/cliente'
import { useAdvanceKeys } from '../hooks'
import { GlyphKeyhole, toRoman } from '../kit/glyphs'
import { useFalaAncora } from '../kit/npc-anchor'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, useTypewriter } from '../intro/vn'
import { SoundToggle } from '../shared/sound-toggle'
import { DracmaIcon, PocoCena } from './poco-cena'

const CHAR_MS = 26
const CENA = CENA_POCO_ENCONTRO
const PASSOS = CENA.passos

type Quem = 'narrador' | 'jogador' | 'figura' | 'sistema'
type Fila = { passos: PassoResposta[]; ir?: string }
type EscolhaPasso = Extract<Passo, { tipo: 'escolha' }>

/** Quadro do cenário no passo `i` (o último `quadro` definido até ali). */
function quadroEm(i: number): NeblinaPalco {
  for (let k = Math.min(i, PASSOS.length - 1); k >= 0; k--) {
    const q = PASSOS[k].quadro
    if (q && (NEBLINA_QUADROS as readonly string[]).includes(q)) return q as NeblinaPalco
  }
  return 'rua'
}

/**
 * Apresentação do Poço (primeira entrada): a neblina, o poço de 500 anos e a figura encapuzada. O roteiro é a cena
 * `poco-encontro` do motor de diálogo (texto literal do dono); esta tela só dá o cenário próprio do Poço.
 * Progresso, escolhas e consequências vão ao servidor do motor (retoma onde parou; nada vale duas vezes):
 * o Dracma do encapuzado sai com a MESMA chave do servidor do Poço, e `onMoeda` (apresentacao.concluir) marca a
 * apresentação como vista sem dar outra moeda.
 */
export function PocoNeblina({
  nome,
  genero,
  moedas,
  podePular,
  onMoeda,
  onFim,
}: {
  nome: string | null
  genero: string | null | undefined
  /** Moedas do Poço que o jogador tem (opção "Usar moeda especial"). */
  moedas: PocoMoeda[]
  podePular: boolean
  /** Marca a apresentação no servidor do Poço (idempotente; não dá outra moeda). */
  onMoeda: () => Promise<void>
  onFim: () => void
}) {
  const [dados, setDados] = useState<CenaEstado | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  /** Respostas da opção escolhida, mostradas antes de seguir. */
  const [fila, setFila] = useState<Fila | null>(null)
  const [saindo, setSaindo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  // caixa de fala: a figura encapuzada se ancora nela (o pé do manto atrás do topo da caixa)
  const [caixa, setCaixa] = useState<HTMLElement | null>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const figuraBase = useFalaAncora(caixa, palcoRef, 72)
  const [escolhendoMoeda, setEscolhendoMoeda] = useState<{ passo: EscolhaPasso; i: number } | null>(null)
  const [moedaEstado, setMoedaEstado] = useState<'idle' | 'pedindo' | 'ok' | 'erro'>('idle')
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  /* ── carregar: retoma no passo salvo no servidor ── */
  const primeiraVez = useRef(true)
  useEffect(() => {
    let vivo = true
    lerCena(CENA.id)
      .then((d) => {
        if (!vivo) return
        primeiraVez.current = !d.progresso.fim
        setIndex(d.progresso.fim ? 0 : Math.min(d.progresso.passo, PASSOS.length - 1))
        setDados(d)
      })
      .catch((e: Error) => vivo && setErroCarga(e.message))
    return () => {
      vivo = false
    }
  }, [])
  useEffect(() => {
    if (!dados || dados.progresso.fim) return
    const t = window.setTimeout(() => salvarPasso(CENA.id, index), 350)
    return () => window.clearTimeout(t)
  }, [index, dados])

  const passo: Passo | undefined = dados ? PASSOS[index] : undefined
  const palco: NeblinaPalco = saindo ? 'partiu' : quadroEm(index)
  const especiais = moedas.filter((m) => m.quantidade > 0)

  // Fala corrente: a resposta na fila tem prioridade; senão o próprio passo.
  const atual: Passo | PassoResposta | undefined = fila?.passos[0] ?? passo
  const fala: { quem: Quem; texto: string } | null = !atual
    ? null
    : atual.tipo === 'narra'
      ? { quem: 'narrador', texto: atual.texto }
      : atual.tipo === 'fala'
        ? { quem: atual.quem === 'jogador' ? 'jogador' : 'figura', texto: atual.texto }
        : atual.tipo === 'efeito'
          ? { quem: 'sistema', texto: atual.aviso ?? '' }
          : null
  const texto = fala ? generoTexto(fala.texto, genero, nome) : ''
  const { shown, done, finish } = useTypewriter(texto, fala?.quem === 'sistema' ? 12 : CHAR_MS)

  const terminar = useCallback(() => {
    if (saindo) return
    setSaindo(true)
    playSfx('whoosh')
    const primeira = primeiraVez.current
    void concluirCena(CENA.id).catch(() => {})
    void onMoeda().catch(() => {})
    // a figura some na névoa antes de a tela do Poço aparecer
    window.setTimeout(() => {
      onFim()
      // Roteiro do dono: logo depois do Poço, "Enquanto estou distraído…" — a chamada da Melissa (só na 1ª vez;
      // o motor não repete uma cena já vista).
      if (primeira) window.setTimeout(() => window.dispatchEvent(new CustomEvent('devo:cena', { detail: 'melissa-corporacoes', cancelable: true })), 1400)
    }, 1100)
  }, [saindo, onMoeda, onFim])

  const seguir = useCallback(
    (ir?: string) => {
      setFila(null)
      const alvo = ir ? indicePasso(CENA, ir) : index + 1
      if (alvo < 0 || alvo >= PASSOS.length) {
        terminar()
        return
      }
      setIndex(alvo)
    },
    [index, terminar],
  )

  /* ── passo novo: som; escolhas já feitas (retomada) seguem sozinhas; efeito do Dracma ── */
  const pediu = useRef(false)
  const pedirMoeda = useCallback(() => {
    pediu.current = true
    setMoedaEstado('pedindo')
    aplicarEfeito(CENA.id, 'dracma')
      .then(() => onMoeda())
      .then(() => {
        setMoedaEstado('ok')
        playDeixa('item')
      })
      .catch(() => setMoedaEstado('erro'))
  }, [onMoeda])
  const chave = `${index}:${fila ? fila.passos.length : 'p'}`
  useEffect(() => {
    if (!atual || !dados) return
    if (atual.som) playDeixa(atual.som)
    if (fila) return
    if (atual.tipo === 'escolha' && primeiraVez.current) {
      const feita = dados.progresso.escolhas[atual.id]?.[0]
      if (feita !== undefined) seguir(atual.opcoes[feita]?.ir)
      return
    }
    if (atual.tipo === 'ir') seguir(atual.para)
    if (atual.tipo === 'efeito' && atual.id === 'dracma' && !pediu.current) pedirMoeda()
  }, [chave, dados !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    if (!fala || saindo) return
    if (!done) {
      finish()
      return
    }
    if (passo?.tipo === 'efeito' && !fila && moedaEstado !== 'ok') return
    playSfx('click')
    if (fila) {
      const resto = fila.passos.slice(1)
      if (resto.length) setFila({ ...fila, passos: resto })
      else seguir(fila.ir)
      return
    }
    seguir()
  }, [fala, saindo, done, finish, passo, fila, moedaEstado, seguir])

  useAdvanceKeys(advance, { enabled: !!fala && !saindo })

  /** Escolha confirmada pelo servidor (a primeira vale; karma etc. aplicados lá, uma vez só). */
  const confirmar = async (p: EscolhaPasso, i: number) => {
    if (ocupado) return
    setOcupado(true)
    try {
      const r = await escolherApi(CENA.id, p.id, i)
      const n = r.opcao ?? i
      const op: Opcao = p.opcoes[n] ?? p.opcoes[i]
      setDados((d) => (d ? { ...d, progresso: { ...d.progresso, escolhas: { ...d.progresso.escolhas, [p.id]: [n] } } } : d))
      if (op.respostas?.length) setFila({ passos: op.respostas, ir: op.ir })
      else seguir(op.ir)
    } catch (e) {
      setErroCarga((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  const clicarOpcao = (p: EscolhaPasso, i: number) => {
    playSfx('card-select')
    if (p.opcoes[i].id === 'moeda-especial') {
      setEscolhendoMoeda({ passo: p, i })
      return
    }
    void confirmar(p, i)
  }

  const quem = fala?.quem
  const nomeJogador = nome || 'Você'
  const total = PASSOS.length

  if (!montado) return null
  return createPortal(
    <main aria-label="Poço dos Milagres: apresentação" className={cn('fixed inset-0 z-[80] flex h-dvh flex-col overflow-hidden bg-dv-ink text-dv-text', saindo && 'pn-out')}>
      <PocoCena palco={palco} brilho={0.75} figuraBase={figuraBase} className="[--poco-h:min(58vh,470px)] [--poco-top:42%]" />
      {/* marcador do palco: mede a caixa de fala para ancorar a figura (kit/npc-anchor) */}
      <div ref={palcoRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />

      {/* barra superior: capítulo; som e "pular" (só para quem já viu ou para a equipe superior) */}
      <div className="dv-safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-8">
        <p className="dv-label pointer-events-auto flex items-center gap-2 pt-3 text-[10px] text-dv-text-2">
          <span className="font-impact text-[15px] leading-none tracking-normal text-dv-gold">{toRoman(Math.min(index + 1, total))}</span>
          <span className="whitespace-nowrap tracking-[0.14em]">Poço dos Milagres</span>
        </p>
        <div className="pointer-events-auto flex items-center">
          <SoundToggle compact className="min-h-11 min-w-11 justify-center text-dv-text-2 hover:text-dv-text" />
          {podePular && (
            <button
              type="button"
              onClick={async () => {
                playSfx('whoosh')
                await onMoeda().catch(() => {})
                onFim()
              }}
              className="dv-focus flex min-h-11 items-center px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dv-text-2 hover:text-dv-text"
            >
              Pular apresentação
            </button>
          )}
        </div>
      </div>

      <div ref={setCaixa} className="relative z-10 mt-auto px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        {passo?.tipo === 'efeito' && !fila && moedaEstado === 'ok' && (
          <p className="animate-dv-toast-in mx-auto mb-5 flex w-fit items-center gap-3 bg-[linear-gradient(90deg,#1f1f22,#151517)] py-2 pl-3 pr-6 shadow-[0_10px_24px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(186,176,159,0.5)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            <DracmaIcon raridade="incomum" className="size-9 drop-shadow-[0_0_8px_rgba(236,229,216,0.5)]" />
            <span className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">Item recebido</span>
              <span className="font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-dv-porcelain">Dracma Incomum</span>
            </span>
          </p>
        )}

        {erroCarga ? (
          <DialogueShell tone="neutral">
            <span className="flex flex-col items-start gap-3 px-6 py-5">
              <span role="alert" className="font-body text-[16px] text-dv-text">
                {erroCarga}
              </span>
              <button type="button" onClick={() => onFim()} className="dv-focus dv-label min-h-11 border border-dv-line-strong px-4 text-[11px] text-dv-text-2 hover:text-dv-text">
                Fechar
              </button>
            </span>
          </DialogueShell>
        ) : !dados ? (
          <p className="dv-label animate-dv-fade py-6 text-center text-[11px] text-dv-text-3" role="status">
            Descendo a rua de barro…
          </p>
        ) : saindo ? null : fala ? (
          <button type="button" onClick={advance} aria-label={done ? 'Próxima fala' : 'Mostrar fala completa'} className="dv-focus relative block w-full text-left">
            <DialogueShell tone={quem === 'figura' ? 'neutral' : 'gold'} className={cn(quem === 'jogador' || quem === 'figura' ? 'mt-6' : '')}>
              {quem === 'jogador' && <SpeakerPlate key="j" name={nomeJogador} tone="cobalt" />}
              {quem === 'figura' && <SpeakerPlate key="f" name="???" tone="void" />}
              <span className={cn('block px-6 pb-3', quem === 'jogador' || quem === 'figura' ? 'pt-8' : 'pt-5')}>
                <span
                  aria-live="polite"
                  className={cn(
                    'block min-h-[4.5rem] text-pretty font-body leading-relaxed',
                    quem === 'narrador' && 'text-[16.5px] italic text-dv-text-2',
                    quem === 'jogador' && 'text-[17px] text-dv-text',
                    quem === 'figura' && 'text-[17px] text-dv-porcelain',
                    quem === 'sistema' && 'text-center font-display text-[15px] not-italic uppercase tracking-[0.12em] text-dv-gold-bright',
                  )}
                >
                  {quem === 'narrador' || quem === 'sistema' ? <Colchetes>{texto.slice(0, shown)}</Colchetes> : texto.slice(0, shown)}
                  {!done && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-gold-bright" />}
                </span>
                <span className="mt-3 flex items-center gap-3" aria-hidden="true">
                  <span className="dv-label dv-tabular text-[10px] text-dv-text-3">
                    {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                  </span>
                  <span className="relative h-[3px] flex-1 bg-dv-line">
                    <span className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-porcelain))] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
                  </span>
                  {passo?.tipo === 'efeito' && !fila && moedaEstado === 'pedindo' ? (
                    <span className="dv-label text-[10px] text-dv-text-3">Recebendo…</span>
                  ) : (
                    <AdvanceIndicator visible={done} label="Continuar" tone="gold" />
                  )}
                </span>
              </span>
            </DialogueShell>
          </button>
        ) : escolhendoMoeda ? (
          <MoedaEscolha
            moedas={especiais}
            onEscolher={() => {
              playSfx('card-select')
              const e = escolhendoMoeda
              setEscolhendoMoeda(null)
              void confirmar(e.passo, e.i)
            }}
          />
        ) : passo?.tipo === 'escolha' ? (
          <Escolhas passo={passo} genero={genero} temEspecial={especiais.length > 0} ocupado={ocupado} onEscolher={(i) => clicarOpcao(passo, i)} />
        ) : null}

        {passo?.tipo === 'efeito' && !fila && moedaEstado === 'erro' && (
          <div className="mt-3 flex items-center justify-between gap-3 border border-dv-blood/50 bg-dv-blood-deep/60 px-3 py-2">
            <p className="text-[13px] text-dv-blood-text">A moeda não chegou. Verifique a conexão.</p>
            <button type="button" onClick={pedirMoeda} className="dv-focus min-h-11 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-text">
              Tentar de novo
            </button>
          </div>
        )}
      </div>
      <style>{`.pn-out{animation:pn-out 1.1s ease-in both}@keyframes pn-out{0%,55%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.pn-out{animation-duration:.01s}}`}</style>
    </main>,
    document.body,
  )
}

/** Narração e aviso do sistema: os colchetes do roteiro do dono, desenhados em aço. */
function Colchetes({ children }: { children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="mr-1 font-display not-italic text-dv-gold/60">[</span>
      {children}
      <span aria-hidden="true" className="ml-1 font-display not-italic text-dv-gold/60">]</span>
    </>
  )
}

function Escolhas({
  passo,
  genero,
  temEspecial,
  ocupado,
  onEscolher,
}: {
  passo: EscolhaPasso
  genero: string | null | undefined
  temEspecial: boolean
  ocupado: boolean
  onEscolher: (i: number) => void
}) {
  return (
    <div role="group" aria-label="Escolhas de diálogo" aria-busy={ocupado} className="flex flex-col gap-2.5">
      <ChoiceHeader>Você</ChoiceHeader>
      {passo.opcoes.map((op, i) =>
        op.id === 'moeda-especial' && !temEspecial ? (
          <ChoiceLocked key={i} index={i} label={generoTexto(op.texto, genero)} delay={60 + i * 70} />
        ) : (
          <ChoiceStrip key={i} index={i} label={generoTexto(op.texto, genero)} onClick={() => onEscolher(i)} delay={60 + i * 70} />
        ),
      )}
    </div>
  )
}

/** Opção trancada (moeda especial sem moeda): escura, com fechadura, não clicável. Sem "(se houver)". */
function ChoiceLocked({ index, label, delay }: { index: number; label: string; delay: number }) {
  return (
    <div className="animate-dv-slide-left" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        disabled
        aria-label={`${label} Bloqueado: você não tem uma moeda especial.`}
        style={{ '--dv-cut': '12px' } as CSSProperties}
        className="relative isolate flex min-h-12 w-full cursor-not-allowed items-stretch text-left"
      >
        <span aria-hidden="true" className="dv-cut-diag absolute inset-0 -z-10 bg-[#26262a]" />
        <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-[#08080a]" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
        <span aria-hidden="true" className="flex w-12 shrink-0 items-center justify-center font-impact text-[22px] font-semibold leading-none text-[#3d3d42] -skew-x-[8deg]">
          {toRoman(index + 1)}
        </span>
        <span aria-hidden="true" className="my-2.5 w-px bg-[#26262a]" />
        <span className="flex flex-1 items-center gap-2 py-2.5 pl-3.5 pr-3 font-body text-[16px] leading-snug text-[#5c5b60]">{label}</span>
        <span aria-hidden="true" className="flex items-center pr-4 text-[#6a696e]">
          <GlyphKeyhole className="size-4" />
        </span>
      </button>
    </div>
  )
}

function MoedaEscolha({ moedas, onEscolher }: { moedas: PocoMoeda[]; onEscolher: () => void }) {
  const lista = useMemo(() => moedas, [moedas])
  return (
    <div role="group" aria-label="Escolhas de diálogo" className="flex flex-col gap-2.5">
      <ChoiceHeader>Suas moedas</ChoiceHeader>
      {lista.map((m, i) => (
        <ChoiceStrip key={m.key} index={i} label={`${m.nome} ×${m.quantidade}`} onClick={onEscolher} delay={60 + i * 70} />
      ))}
    </div>
  )
}
