'use client'

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { formatTempo } from '@/lib/devo/salao'
import type { Rarity } from '@/lib/devo/types'
import { CardFace } from '@/components/devo/shared/devo-card'
import { useBackHandler } from '@/components/devo/use-back-handler'

/**
 * Peças do Salão das Máscaras no v2 (protótipo kit3/os-salao.js): a folha que cobre a janela (lance, envio, anúncio,
 * calendário, painel da equipe), o campo de minutos com passo, a carta, a raridade, cabeçalhos e vazios. As classes
 * são as do protótipo (s-folha, s-campo, s-step, s-cab, s-vazio…), já em components/v2/os.css.
 */

export type Agir = (body: Record<string, unknown>) => Promise<Record<string, unknown>>

/** Número da edição como no jogo: a edição 0 é a "Edição 01". */
export const ed = (n: number) => String(n + 1).padStart(2, '0')
/** Número do lote com três dígitos. */
export const num = (n: number) => String(n).padStart(3, '0')

export function nomeCarta(cardId: string) {
  try {
    return getCard(cardId).name
  } catch {
    return cardId
  }
}
export const rotuloRar = (r: Rarity) => RARITY_META[r]?.label ?? r

export const parado = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Carta do protótipo (`s-carta`; `p` = pequena). */
export function Carta({ cardId, p = false }: { cardId: string; p?: boolean }) {
  return (
    <div className={'s-carta' + (p ? ' p' : '')}>
      <CardFace cardId={cardId} className="w-full" />
    </div>
  )
}

export const Rar = ({ r }: { r: Rarity }) => <small className={`s-rar r-${r}`}>{rotuloRar(r)}</small>

export function Cab({ t, s }: { t: string; s?: ReactNode }) {
  return (
    <header className="s-cab">
      <h4>{t}</h4>
      {s ? <small>{s}</small> : null}
    </header>
  )
}

export function Vazio({ t, p }: { t: string; p: string }) {
  return (
    <div className="s-vazio fundo">
      <strong>{t}</strong>
      <p className="r-sub">{p}</p>
    </div>
  )
}

/** Selo das ações que só a equipe (Anfitrião e Owner) vê. */
export const SeloEquipe = () => (
  <span className="s-eqselo" title="Só Anfitrião e Owner veem">
    Equipe
  </span>
)

export const Ok = ({ children }: { children: ReactNode }) =>
  children ? (
    <p className="s-ok fundo" role="status">
      {children}
    </p>
  ) : null

export const Erro = ({ children }: { children: ReactNode }) =>
  children ? (
    <p className="r-erro" role="alert">
      {children}
    </p>
  ) : null

/** A janela (`.jan`) onde o Salão está: as folhas e a apresentação cobrem a janela inteira, como no protótipo. */
export function useJanela<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [jan, setJan] = useState<Element | null>(null)
  useEffect(() => {
    setJan(ref.current?.closest('.jan') ?? null)
  }, [])
  return { ref, jan }
}

/** Folha por cima da janela (abaixo da barra de título), com "Voltar"; o voltar do aparelho também fecha. */
export function Folha({ jan, sub, tit, onVolta, children }: { jan: Element | null; sub: string; tit: string; onVolta: () => void; children: ReactNode }) {
  const volta = useRef<HTMLButtonElement>(null)
  const sai = useRef(onVolta)
  sai.current = onVolta
  useBackHandler(true, () => sai.current())
  useEffect(() => {
    playSfx('open')
    volta.current?.focus({ preventScroll: true })
  }, [])
  if (!jan) return null
  return createPortal(
    <div className="s-folha" role="dialog" aria-label={tit}>
      <div className="c-nav">
        <button
          ref={volta}
          type="button"
          className="m-volta chanfro"
          aria-label="Voltar"
          onClick={() => {
            playSfx('close')
            onVolta()
          }}
        >
          ‹
        </button>
        <div>
          <small>{sub}</small>
          <strong>{tit}</strong>
        </div>
      </div>
      {children}
    </div>,
    jan,
  )
}

/** Campo de minutos com passo (− / +), o `saCampo` do protótipo. O servidor confere o valor de novo. */
export function Campo({
  id,
  rot,
  valor,
  onChange,
  min,
  max,
  passo,
  dica,
}: {
  id: string
  rot: string
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  passo: number
  dica?: string
}) {
  const poe = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v))))
  return (
    <div className="s-campo">
      <label htmlFor={id}>{rot}</label>
      <div className="s-step">
        <button
          type="button"
          className="chanfro"
          aria-label={`Diminuir ${passo} minutos`}
          disabled={valor <= min}
          onClick={() => {
            playSfx('click')
            poe(valor - passo)
          }}
        >
          −
        </button>
        <span className="fundo">
          <input
            id={id}
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(valor)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ''))
              onChange(Number.isFinite(n) ? Math.min(max, n) : min)
            }}
            onBlur={() => poe(valor)}
          />
          <small>min · {formatTempo(valor)}</small>
        </span>
        <button
          type="button"
          className="chanfro"
          aria-label={`Aumentar ${passo} minutos`}
          disabled={valor >= max}
          onClick={() => {
            playSfx('click')
            poe(valor + passo)
          }}
        >
          +
        </button>
      </div>
      {dica ? <p className="r-sub">{dica}</p> : null}
    </div>
  )
}

/** Dias, horas, minutos e segundos do número enorme. */
export function partes(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return [Math.floor(t / 86400), Math.floor((t % 86400) / 3600), Math.floor((t % 3600) / 60), t % 60].map((x) => String(x).padStart(2, '0'))
}

const UNIDADES = ['Dias', 'Horas', 'Min', 'Seg']

/** O número enorme (`s-num`), atualizado a cada segundo. */
export function Numero({ alvo, aberto, id }: { alvo: number | null; aberto: boolean; id?: string }) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const p = alvo ? partes(alvo - agora) : ['--', '--', '--', '--']
  return (
    <div
      className="s-num"
      id={id}
      role="timer"
      aria-label={alvo ? `${aberto ? 'Fecha em' : 'Abre em'} ${+p[0]} dias, ${+p[1]} horas e ${+p[2]} minutos` : 'Sem hora marcada'}
    >
      {p.map((x, i) => (
        <Fragment key={i}>
          {i ? <i>:</i> : null}
          <span>
            <b>{x}</b>
            <small>{UNIDADES[i]}</small>
          </span>
        </Fragment>
      ))}
    </div>
  )
}
