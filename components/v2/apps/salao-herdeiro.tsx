'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import type { SalaoRelogio } from '@/lib/devo/salao'
import { HERDEIRO_APRESENTACAO, HERDEIRO_POSES, salaoTexto, semMarcas, trechos, type SalaoFoco } from '@/lib/devo/salao-herdeiro'
import { Numero, parado } from './salao-pecas'

/**
 * O Herdeiro apresenta o Salão (protótipo kit3/os-salao.js › herdeiro): o camarote em pixel, o Herdeiro de corpo
 * inteiro (arte aprovada com a cabeça menor, /v2/art/os/npc/herdeiro-corpo-<pose>.png), a placa do que ele aponta (o
 * número enorme ou a aba) e a caixa de fala letra a letra. Texto LITERAL de lib/devo/salao-herdeiro.ts, com o gênero
 * do jogador resolvido. Toque ou Enter/Espaço: completa a fala; de novo: a próxima. "Pular apresentação" só para
 * quem já viu (ou a equipe), como decide o servidor (`podePular`).
 */

const CHAR_MS = 24
const FOCO: Record<Exclude<SalaoFoco, 'contador'>, string> = { leiloes: 'Leilões', bandeja: 'Bandeja', mercado: 'Mercado', anuncios: 'Propostas' }
const fig = (pose: string) => `/v2/art/os/npc/herdeiro-corpo-${pose}.png`

export function HerdeiroCena({
  jan,
  relogio,
  genero,
  nome,
  podePular,
  onFim,
}: {
  jan: Element | null
  relogio: SalaoRelogio
  genero: string | null | undefined
  nome: string | null
  podePular: boolean
  onFim: () => void
}) {
  const [n, setN] = useState(0)
  const [k, setK] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const fala = HERDEIRO_APRESENTACAO[n]
  const texto = salaoTexto(fala.texto, genero, nome)
  const tot = semMarcas(texto).length
  const pronto = k >= tot
  const total = HERDEIRO_APRESENTACAO.length

  // letra a letra (movimento reduzido: a fala inteira de uma vez)
  useEffect(() => {
    if (parado()) {
      setK(Infinity)
      return
    }
    setK(0)
    const t = window.setInterval(() => setK((x) => (x >= tot ? x : x + 1)), CHAR_MS)
    return () => window.clearInterval(t)
  }, [n, tot])

  // as poses ficam pré-carregadas: a troca não pisca
  useEffect(() => {
    for (const p of HERDEIRO_POSES) {
      const i = new Image()
      i.src = fig(p)
    }
  }, [])
  useEffect(() => {
    raiz.current?.focus({ preventScroll: true })
  }, [jan])

  const fim = useCallback(() => {
    playSfx('whoosh')
    onFim()
  }, [onFim])
  const avanca = useCallback(() => {
    if (!pronto) {
      setK(Infinity)
      return
    }
    playSfx('click')
    if (n + 1 >= total) return fim()
    setN(n + 1)
  }, [pronto, n, total, fim])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      if (e.target instanceof Element && e.target.closest('button, input, textarea, select')) return
      e.preventDefault()
      if (!e.repeat) avanca()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [avanca])

  if (!jan) return null
  const foco = fala.foco
  return createPortal(
    <div
      ref={raiz}
      className="s-apres"
      role="dialog"
      aria-modal="true"
      aria-label="Salão das Máscaras: apresentação"
      tabIndex={-1}
      onClick={(e) => {
        if ((e.target as Element).closest('.s-ap-pula')) return
        avanca()
      }}
    >
      <div className="s-ap-vista">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="s-ap-fundo" src="/v2/art/os/salao/camarote.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="s-ap-fig" src={fig(fala.pose)} alt="O Herdeiro" />
        <div className="s-ap-foco">
          {foco === 'contador' ? (
            <div className="s-ap-num">
              <small>{relogio.aberto ? 'A edição fecha em' : 'Próxima abertura em'}</small>
              <Numero alvo={relogio.aberto ? relogio.fechaEm : relogio.proxima.inicio} aberto={relogio.aberto} />
            </div>
          ) : foco ? (
            <p className="s-ap-tag">{FOCO[foco]}</p>
          ) : null}
        </div>
        {podePular && (
          <button type="button" className="k-pula chanfro s-ap-pula" onClick={fim}>
            Pular apresentação
          </button>
        )}
      </div>
      <div className="p-caixa s-ap-caixa">
        <b>
          O Herdeiro <small>Maestro do Salão</small>
        </b>
        <p aria-live="polite">
          {trechos(texto, k).map((p, i) => (p.forte ? <strong key={i}>{p.t}</strong> : <span key={i}>{p.t}</span>))}
        </p>
        <span className="s-ap-n">
          {String(n + 1).padStart(2, '0')}/{total}
        </span>
        <i aria-hidden="true" hidden={!pronto} />
      </div>
    </div>,
    jan,
  )
}
