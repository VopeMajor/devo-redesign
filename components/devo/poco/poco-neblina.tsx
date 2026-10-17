'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import type { PocoMoeda } from '@/lib/devo/poco'
import { generoTexto, NEBLINA, type NeblinaFala, type NeblinaNo, type NeblinaOpcao, type NeblinaPalco } from '@/lib/devo/poco-neblina'
import { cn } from '@/lib/utils'
import { useAdvanceKeys } from '../hooks'
import { GlyphKeyhole, toRoman } from '../kit/glyphs'
import { useFalaAncora } from '../kit/npc-anchor'
import { AdvanceIndicator, ChoiceHeader, ChoiceStrip, DialogueShell, SpeakerPlate, useTypewriter } from '../intro/vn'
import { SoundToggle } from '../shared/sound-toggle'
import { DracmaIcon, PocoCena } from './poco-cena'

const CHAR_MS = 26

/**
 * Apresentação do Poço (primeira entrada): a neblina, o poço de 500 anos e a figura encapuzada. Monta a cena
 * com as peças de visual novel do DEVO (intro/vn.tsx) a partir dos dados de lib/devo/poco-neblina.ts —
 * quando o motor de diálogo da Narrativa entrar, basta trocar este componente pelo motor lendo os mesmos nós.
 * O Dracma é entregue pelo SERVIDOR no nó 'dracma' (uma vez só; repetir a cena não dá outra moeda).
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
  /** Moedas do Poço que o jogador tem (para a opção 2). */
  moedas: PocoMoeda[]
  podePular: boolean
  /** Pede a moeda ao servidor (idempotente). */
  onMoeda: () => Promise<void>
  onFim: () => void
}) {
  const [index, setIndex] = useState(0)
  /** Falas da resposta escolhida, mostradas antes de seguir para o próximo nó. */
  const [fila, setFila] = useState<{ falas: NeblinaFala[]; ir?: string } | null>(null)
  // caixa de fala: a figura encapuzada se ancora nela (o pé do manto atrás do topo da caixa)
  const [caixa, setCaixa] = useState<HTMLElement | null>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const figuraBase = useFalaAncora(caixa, palcoRef, 72)
  const [escolhendoMoeda, setEscolhendoMoeda] = useState<NeblinaOpcao | null>(null)
  const [moedaEstado, setMoedaEstado] = useState<'idle' | 'pedindo' | 'ok' | 'erro'>('idle')
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  const no = NEBLINA[index]
  const palco = useMemo<NeblinaPalco>(() => {
    for (let i = index; i >= 0; i--) {
      const p = NEBLINA[i].palco
      if (p) return p
    }
    return 'rua'
  }, [index])
  const especiais = moedas.filter((m) => m.quantidade > 0)

  // Fala corrente: a resposta na fila tem prioridade; senão o próprio nó (fala ou aviso da moeda).
  const fala: NeblinaFala | null = fila?.falas[0] ?? (no.tipo === 'fala' ? { quem: no.quem, texto: no.texto } : no.tipo === 'moeda' ? { quem: 'sistema', texto: no.texto } : null)
  const texto = fala ? generoTexto(fala.texto, genero) : ''
  const { shown, done, finish } = useTypewriter(texto, fala?.quem === 'sistema' ? 12 : CHAR_MS)

  // Nó da moeda: o servidor entrega o Dracma (uma vez só) antes de a fala poder avançar.
  const pediu = useRef(false)
  const pedirMoeda = useCallback(() => {
    pediu.current = true
    setMoedaEstado('pedindo')
    onMoeda()
      .then(() => {
        setMoedaEstado('ok')
        playSfx('reveal')
      })
      .catch(() => setMoedaEstado('erro'))
  }, [onMoeda])
  useEffect(() => {
    if (no.tipo === 'moeda' && !pediu.current) pedirMoeda()
  }, [no, pedirMoeda])

  const seguir = useCallback(
    (ir?: string) => {
      const alvo = ir ? NEBLINA.findIndex((n) => n.id === ir) : index + 1
      if (alvo >= NEBLINA.length || alvo < 0) {
        playSfx('whoosh')
        onFim()
        return
      }
      setIndex(alvo)
    },
    [index, onFim],
  )

  const advance = useCallback(() => {
    if (!fala) return
    if (!done) {
      finish()
      return
    }
    if (no.tipo === 'moeda' && moedaEstado !== 'ok') return
    playSfx('click')
    if (fila) {
      const resto = fila.falas.slice(1)
      if (resto.length) setFila({ ...fila, falas: resto })
      else {
        setFila(null)
        seguir(fila.ir)
      }
      return
    }
    seguir()
  }, [fala, done, finish, no, moedaEstado, fila, seguir])

  useAdvanceKeys(advance, { enabled: !!fala })

  const escolher = (op: NeblinaOpcao) => {
    playSfx('card-select')
    if (op.mostrarMoedas) {
      setEscolhendoMoeda(op)
      return
    }
    if (op.resposta?.length) setFila({ falas: op.resposta, ir: op.ir })
    else seguir(op.ir)
  }

  const quem = fala?.quem
  const nomeJogador = nome || 'Você'
  const total = NEBLINA.length

  if (!montado) return null
  return createPortal(
    <main aria-label="Poço dos Milagres: apresentação" className="fixed inset-0 z-[80] flex h-dvh flex-col overflow-hidden bg-dv-ink text-dv-text">
      <PocoCena palco={palco} brilho={0.75} figuraBase={figuraBase} className="[--poco-base:60cqh] [--poco-h:min(58vh,470px)] [--poco-top:42%]" />
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
        {no.tipo === 'moeda' && moedaEstado === 'ok' && (
          <p className="animate-dv-toast-in mx-auto mb-5 flex w-fit items-center gap-3 bg-[linear-gradient(90deg,var(--dv-ink-3),var(--dv-ink-2))] py-2 pl-3 pr-6 shadow-[0_10px_24px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(186,176,159,0.5)] [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            <DracmaIcon raridade="incomum" className="size-9 drop-shadow-[0_0_8px_rgba(236,229,216,0.5)]" />
            <span className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dv-text-3">Item recebido</span>
              <span className="font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-dv-porcelain">Dracma Incomum</span>
            </span>
          </p>
        )}

        {fala ? (
          <button
            type="button"
            onClick={advance}
            aria-label={done ? 'Próxima fala' : 'Mostrar fala completa'}
            className="dv-focus relative block w-full text-left"
          >
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
                  {texto.slice(0, shown)}
                  {!done && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-dv-blink bg-dv-gold-bright" />}
                </span>
                <span className="mt-3 flex items-center gap-3" aria-hidden="true">
                  <span className="dv-label dv-tabular text-[10px] text-dv-text-3">
                    {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                  </span>
                  <span className="relative h-[3px] flex-1 bg-dv-line">
                    <span className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--dv-gold-deep),var(--dv-porcelain))] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
                  </span>
                  {no.tipo === 'moeda' && moedaEstado === 'pedindo' ? (
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
              setEscolhendoMoeda(null)
              seguir(escolhendoMoeda.ir)
            }}
          />
        ) : no.tipo === 'escolha' ? (
          <Escolhas no={no} genero={genero} temEspecial={especiais.length > 0} onEscolher={escolher} />
        ) : null}

        {no.tipo === 'moeda' && moedaEstado === 'erro' && (
          <div className="mt-3 flex items-center justify-between gap-3 border border-dv-blood/50 bg-dv-blood-deep/60 px-3 py-2">
            <p className="text-[13px] text-dv-blood-text">A moeda não chegou. Verifique a conexão.</p>
            <button type="button" onClick={pedirMoeda} className="dv-focus min-h-11 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dv-text">
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </main>,
    document.body,
  )
}

function Escolhas({
  no,
  genero,
  temEspecial,
  onEscolher,
}: {
  no: Extract<NeblinaNo, { tipo: 'escolha' }>
  genero: string | null | undefined
  temEspecial: boolean
  onEscolher: (op: NeblinaOpcao) => void
}) {
  return (
    <div role="group" aria-label="Escolhas de diálogo" className="flex flex-col gap-2.5">
      <ChoiceHeader>Você</ChoiceHeader>
      {no.opcoes.map((op, i) =>
        op.exigeMoedaEspecial && !temEspecial ? (
          <ChoiceLocked key={op.id} index={i} label={generoTexto(op.rotulo, genero)} delay={60 + i * 70} />
        ) : (
          <ChoiceStrip key={op.id} index={i} label={generoTexto(op.rotulo, genero)} onClick={() => onEscolher(op)} delay={60 + i * 70} />
        ),
      )}
    </div>
  )
}

/** Opção trancada (moeda especial sem moeda): escura, com fechadura, não clicável. */
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
        <span aria-hidden="true" className="dv-cut-diag absolute inset-px -z-10 bg-dv-ink" style={{ '--dv-cut': '11.6px' } as CSSProperties} />
        <span aria-hidden="true" className="flex w-12 shrink-0 items-center justify-center font-impact text-[22px] font-semibold leading-none text-[#3d3d42] -skew-x-[8deg]">
          {toRoman(index + 1)}
        </span>
        <span aria-hidden="true" className="my-2.5 w-px bg-[#26262a]" />
        <span className="flex flex-1 items-center gap-2 py-2.5 pl-3.5 pr-3 font-body text-[16px] leading-snug text-[#5c5b60]">{label}</span>
        <span aria-hidden="true" className="flex items-center gap-1.5 pr-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6a696e]">
          <GlyphKeyhole className="size-4" />
          Sem moeda
        </span>
      </button>
    </div>
  )
}

function MoedaEscolha({ moedas, onEscolher }: { moedas: PocoMoeda[]; onEscolher: () => void }) {
  return (
    <div role="group" aria-label="Escolhas de diálogo" className="flex flex-col gap-2.5">
      <ChoiceHeader>Suas moedas</ChoiceHeader>
      {moedas.map((m, i) => (
        <ChoiceStrip key={m.key} index={i} label={`${m.nome} ×${m.quantidade}`} onClick={onEscolher} delay={60 + i * 70} />
      ))}
    </div>
  )
}
