'use client'

import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { isMoedaEspecial, type PocoMoeda } from '@/lib/devo/poco'
import { generoTexto, NEBLINA, type NeblinaFala, type NeblinaOpcao, type NeblinaPalco } from '@/lib/devo/poco-neblina'
import { useAdvanceKeys, useMediaQuery } from '@/components/devo/hooks'
import { SoundToggle } from '@/components/devo/shared/sound-toggle'

/**
 * A neblina no v2 (protótipo kit3/os-poco.js › neblina): a apresentação do Poço na primeira entrada, por cima da
 * janela inteira (p-neb), com a arte da rua, do poço, da figura e da mão. As falas são as de lib/devo/poco-neblina.ts
 * (literais, com o gênero do jogador). O Dracma Incomum é entregue pelo SERVIDOR no nó 'dracma'
 * (apresentacao.concluir, uma vez só): a fala só avança depois que ele chega. "Pular" só aparece quando o servidor
 * deixa (equipe superior ou quem já viu), e também pede a moeda antes de fechar.
 */

const LUGAR: Record<NeblinaPalco, string> = { rua: 'rua', poco: 'cena', figura: 'figura', mao: 'mao', partiu: 'cena' }
const QUEM = { narrador: '', jogador: 'Você', figura: '???', sistema: '' } as const

export function NeblinaV2({
  jan,
  nome,
  genero,
  moedas,
  podePular,
  onMoeda,
  onFim,
}: {
  jan: HTMLElement
  nome: string | null
  genero: string | null | undefined
  moedas: PocoMoeda[]
  podePular: boolean
  /** Pede a moeda ao servidor (idempotente). */
  onMoeda: () => Promise<void>
  onFim: () => void
}) {
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [index, setIndex] = useState(0)
  /** Falas da resposta escolhida, mostradas antes de seguir para o próximo nó. */
  const [fila, setFila] = useState<{ falas: NeblinaFala[]; ir?: string } | null>(null)
  const [escolhendoMoeda, setEscolhendoMoeda] = useState<NeblinaOpcao | null>(null)
  const [moedaEstado, setMoedaEstado] = useState<'idle' | 'pedindo' | 'ok' | 'erro'>('idle')
  const raiz = useRef<HTMLDivElement>(null)

  const no = NEBLINA[index]
  const palco = useMemo<NeblinaPalco>(() => {
    for (let i = index; i >= 0; i--) {
      const p = NEBLINA[i].palco
      if (p) return p
    }
    return 'rua'
  }, [index])
  const especiais = moedas.filter((m) => m.quantidade > 0 && isMoedaEspecial(m.key))

  // fala corrente: a resposta na fila tem prioridade; senão o próprio nó (fala ou aviso da moeda)
  const fala: NeblinaFala | null = fila?.falas[0] ?? (no.tipo === 'fala' ? { quem: no.quem, texto: no.texto } : no.tipo === 'moeda' ? { quem: 'sistema', texto: no.texto } : null)
  const texto = fala ? generoTexto(fala.texto, genero) : ''
  const chave = `${index}|${fila ? fila.falas.length : -1}`

  // máquina de escrever (24 ms por letra; o aviso do sistema mais rápido); movimento reduzido: fala inteira
  const [tw, setTw] = useState({ chave: '', k: 0 })
  useEffect(() => {
    if (!texto) return
    if (reduzido) {
      setTw({ chave, k: texto.length })
      return
    }
    setTw({ chave, k: 0 })
    const t = window.setInterval(
      () =>
        setTw((v) => {
          if (v.chave !== chave) return v
          if (v.k + 1 >= texto.length) window.clearInterval(t)
          return { chave, k: Math.min(texto.length, v.k + 1) }
        }),
      fala?.quem === 'sistema' ? 12 : 24,
    )
    return () => window.clearInterval(t)
  }, [chave, texto, reduzido]) // eslint-disable-line react-hooks/exhaustive-deps
  const mostradas = tw.chave === chave ? tw.k : reduzido ? texto.length : 0
  const pronto = mostradas >= texto.length

  // nó da moeda: o servidor entrega o Dracma (uma vez só) antes de a fala poder avançar
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

  const avancar = useCallback(() => {
    if (!fala) return
    if (!pronto) {
      setTw({ chave, k: texto.length })
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
  }, [fala, pronto, chave, texto, no, moedaEstado, fila, seguir])

  useAdvanceKeys(avancar, { enabled: !!fala })

  const escolher = (e: MouseEvent, op: NeblinaOpcao) => {
    e.stopPropagation()
    playSfx('card-select')
    if (op.mostrarMoedas) {
      setEscolhendoMoeda(op)
      return
    }
    if (op.resposta?.length) setFila({ falas: op.resposta, ir: op.ir })
    else seguir(op.ir)
  }

  // foco: na janela da cena ao abrir; na primeira escolha quando elas aparecem
  useEffect(() => {
    raiz.current?.focus()
  }, [])
  const escolhas = !fala && (no.tipo === 'escolha' || !!escolhendoMoeda)
  useEffect(() => {
    if (escolhas) raiz.current?.querySelector<HTMLButtonElement>('.p-esc button:not(:disabled)')?.focus()
  }, [escolhas, index, escolhendoMoeda])

  const quem = fala ? (fala.quem === 'jogador' ? nome || QUEM.jogador : QUEM[fala.quem]) : ''
  const narr = !fala || fala.quem === 'narrador' || fala.quem === 'sistema'
  const esperando = no.tipo === 'moeda' && moedaEstado !== 'ok'

  return createPortal(
    <div
      ref={raiz}
      tabIndex={-1}
      className="p-neb"
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação do Poço dos Milagres"
      onClick={() => {
        if (!fala) return
        avancar()
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="p-neb-img" src={`/v2/art/os/poco/${LUGAR[palco]}.png`} alt="" style={{ objectPosition: palco === 'figura' ? '72% 50%' : '50% 50%' }} />
      {/* no alto: o som (como na neblina antiga) e o "Pular", quando o servidor deixa */}
      <div className="p-neb-topo" onClick={(e) => e.stopPropagation()}>
        <SoundToggle compact className="k-pula chanfro p-som" />
        {podePular && (
          <button
            type="button"
            className="k-pula chanfro"
            onClick={async () => {
              playSfx('whoosh')
              await onMoeda().catch(() => {})
              onFim()
            }}
          >
            Pular
          </button>
        )}
      </div>
      <div className={`p-caixa${narr ? ' narr' : ''}`}>
        <b hidden={!quem}>{quem}</b>
        <p aria-hidden="true">{fala ? texto.slice(0, mostradas) : ''}</p>
        <span className="m-so" aria-live="polite">
          {quem ? `${quem}: ` : ''}
          {texto}
        </span>
        <i aria-hidden="true" hidden={!fala || !pronto || esperando} />
      </div>
      <div className="p-esc" role={escolhas ? 'group' : undefined} aria-label={escolhas ? 'Escolhas de diálogo' : undefined}>
        {!fala && escolhendoMoeda
          ? especiais.map((m) => (
              <button
                key={m.key}
                type="button"
                className="m-op chanfro"
                onClick={(e) => {
                  e.stopPropagation()
                  playSfx('card-select')
                  const op = escolhendoMoeda
                  setEscolhendoMoeda(null)
                  seguir(op.ir)
                }}
              >
                {`${m.nome} ×${m.quantidade}`}
              </button>
            ))
          : !fala && no.tipo === 'escolha'
            ? no.opcoes.map((op) => {
                // sem Dracma, a opção da moeda especial fica escura e trancada (pedido do dono)
                const tranca = !!op.exigeMoedaEspecial && especiais.length === 0
                const rotulo = generoTexto(op.rotulo, genero).replace(' (se houver)', '')
                return (
                  <button
                    key={op.id}
                    type="button"
                    className="m-op chanfro"
                    disabled={tranca}
                    aria-label={tranca ? `${rotulo} Bloqueado: você não tem uma moeda especial.` : undefined}
                    onClick={(e) => escolher(e, op)}
                  >
                    {rotulo}
                  </button>
                )
              })
            : null}
        {no.tipo === 'moeda' && moedaEstado === 'erro' && (
          <>
            <p className="r-erro" role="alert">
              A moeda não chegou. Verifique a conexão.
            </p>
            <button
              type="button"
              className="m-op chanfro"
              onClick={(e) => {
                e.stopPropagation()
                pedirMoeda()
              }}
            >
              Tentar de novo
            </button>
          </>
        )}
      </div>
    </div>,
    jan,
  )
}
