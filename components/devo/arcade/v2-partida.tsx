'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { LiveLayerTarget, LiveMatchLayer, useLiveChannel } from './live-match'
import './v2-partida.css'

/*
 * Moldura comum das quatro partidas no visual do v2 (protótipo aprovado em docs/redesign/v2/kit3).
 * Cada jogo desenha o próprio cabeçalho (como no protótipo); daqui vêm o X que pede confirmação nas partidas
 * valendo Tempo, o chat ao vivo da partida, o aviso de conexão perdida e a camada das reações.
 */
export function PartidaV2({
  className,
  label,
  onQuit,
  confirmQuit = false,
  connLost = false,
  children,
}: {
  /** Classe raiz do protótipo: `mr`, `xz`, `bq` ou `bl`. */
  className: string
  label: string
  onQuit: () => void
  /** Partida online valendo Tempo: o X pede confirmação (treino sai num toque). */
  confirmQuit?: boolean
  connLost?: boolean
  children: (p: { sair: () => void; chat: ReactNode }) => ReactNode
}) {
  const canal = useLiveChannel()
  const [camada, setCamada] = useState<HTMLDivElement | null>(null)
  const [pergunta, setPergunta] = useState(false)
  const sair = () => (confirmQuit ? setPergunta(true) : onQuit())
  const chat = canal ? (
    <span className="v2p-chat">
      <LiveMatchLayer channel={canal} />
    </span>
  ) : null
  return (
    <LiveLayerTarget el={camada}>
      <div className={className} role="dialog" aria-label={label}>
        {children({ sair, chat })}
        <div ref={setCamada} className="v2p-camada" />
        {connLost && <ConexaoPerdida />}
        {pergunta && confirmQuit && (
          <Desistir
            onCancel={() => setPergunta(false)}
            onConfirm={() => {
              setPergunta(false)
              onQuit()
            }}
          />
        )}
      </div>
    </LiveLayerTarget>
  )
}

/** Desistir de uma partida online conta como derrota e custa Tempo. */
export function Desistir({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const id = useId()
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onCancel])
  return (
    <div className="v2p-veu" role="alertdialog" aria-modal="true" aria-labelledby={id} onPointerDown={(e) => e.stopPropagation()}>
      <div className="v2p-caixa">
        <small>Partida valendo Tempo</small>
        <strong id={id}>Desistir da partida?</strong>
        <p>Conta como derrota.</p>
        <div>
          <button type="button" className="v2p-bt" autoFocus onClick={onCancel}>
            Continuar
          </button>
          <button type="button" className="v2p-bt perigo" onClick={onConfirm}>
            Desistir
          </button>
        </div>
      </div>
    </div>
  )
}

/** Aviso discreto: o jogo segue tentando sozinho. */
export function ConexaoPerdida() {
  return (
    <p className="v2p-conexao" role="status" aria-live="polite">
      Conexão perdida, tentando de novo…
    </p>
  )
}

/** Antes da contagem online: o adversário real enquanto o servidor sincroniza o início. */
export function Sincronizando({ nome }: { nome: string }) {
  return (
    <div className="v2p-veu" role="status">
      <div className="v2p-caixa">
        <small>Oponente encontrado</small>
        <strong>{nome}</strong>
        <p>Sincronizando…</p>
      </div>
    </div>
  )
}

/** mm:ss do relógio da partida. */
export function mmss(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
