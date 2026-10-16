'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { dentroDaJanela, type ManivelaParams, ponteiro } from '@/lib/devo/poco'
import { cn } from '@/lib/utils'
import { Button } from '../kit/button'

/**
 * Minigame da manivela (timing): o ponteiro vai e volta no mostrador; toque quando ele passar pela janela de
 * ametista. Cada acerto encolhe a janela e acelera o ponteiro; um erro solta a manivela. O cliente só registra
 * os INSTANTES dos toques — quem conta os acertos (e decide o prêmio) é o servidor, com os mesmos parâmetros.
 * Alvo de toque: a tela inteira do minigame (≥ 44px de sobra). Movimento reduzido: o servidor manda o
 * ponteiro mais lento e nada pisca.
 */
export function PocoManivela({ params, onFim }: { params: ManivelaParams; onFim: (toques: number[]) => void }) {
  const total = params.rodadas.length
  const [rodada, setRodada] = useState(0)
  const [fim, setFim] = useState<null | 'perfeito' | 'escapou' | 'soltou'>(null)
  const [flash, setFlash] = useState<{ k: number; ok: boolean } | null>(null)
  const t0 = useRef(0)
  const inicioRodada = useRef(0)
  const toques = useRef<number[]>([])
  const agulha = useRef<SVGGElement>(null)
  const encerrado = useRef(false)

  // Relógio do minigame: começa quando o componente monta (depois da resposta "iniciar" do servidor).
  useEffect(() => {
    t0.current = performance.now()
    inicioRodada.current = 0
  }, [])

  const encerrar = useCallback(
    (motivo: 'perfeito' | 'escapou' | 'soltou') => {
      if (encerrado.current) return
      encerrado.current = true
      setFim(motivo)
      window.setTimeout(() => onFim([...toques.current]), motivo === 'soltou' ? 150 : 900)
    },
    [onFim],
  )

  // Ponteiro: desenhado no rAF a partir do mesmo modelo que o servidor confere.
  useEffect(() => {
    if (fim) return
    let raf = 0
    const r = params.rodadas[rodada]
    const loop = () => {
      const agora = performance.now() - t0.current
      const rel = agora - inicioRodada.current
      if (rel > params.rodadaMaxMs) {
        playSfx('error')
        encerrar('escapou')
        return
      }
      const pos = ponteiro(r, rel)
      agulha.current?.setAttribute('transform', `rotate(${-90 + pos * 180} 150 150)`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [rodada, fim, params, encerrar])

  const toque = useCallback(() => {
    if (fim || encerrado.current) return
    const agora = Math.round(performance.now() - t0.current)
    const r = params.rodadas[rodada]
    const ok = dentroDaJanela(r, ponteiro(r, agora - inicioRodada.current))
    toques.current.push(agora)
    setFlash({ k: agora, ok })
    if (!ok) {
      playSfx('error')
      encerrar('escapou')
      return
    }
    playSfx(rodada === total - 1 ? 'confirm' : 'chess-tick')
    inicioRodada.current = agora
    if (rodada === total - 1) encerrar('perfeito')
    else setRodada((n) => n + 1)
  }, [fim, params, rodada, total, encerrar])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) toque()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toque])

  const r = params.rodadas[Math.min(rodada, total - 1)]
  const acertos = toques.current.length - (fim === 'escapou' ? 1 : 0)
  const a0 = -180 + (r.centro - r.janela / 2) * 180
  const a1 = -180 + (r.centro + r.janela / 2) * 180

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end bg-[linear-gradient(180deg,rgba(12,12,14,0.2),rgba(12,12,14,0.88)_42%,#0c0c0e_62%)] px-4 pb-4">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          toque()
        }}
        aria-label="Puxar a manivela"
        aria-describedby="poco-manivela-dica"
        className="dv-focus relative flex w-full max-w-[360px] touch-manipulation select-none flex-col items-center"
      >
        <svg viewBox="0 0 300 170" className="w-full" aria-hidden="true">
          <defs>
            <linearGradient id="poco-dial-aco" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6b6357" />
              <stop offset="0.5" stopColor="#ece5d8" />
              <stop offset="1" stopColor="#6b6357" />
            </linearGradient>
          </defs>
          {/* mostrador de aço com marcas */}
          <path d="M20 150A130 130 0 0 1 280 150" fill="none" stroke="url(#poco-dial-aco)" strokeWidth="3" />
          <path d="M34 150A116 116 0 0 1 266 150" fill="none" stroke="#2c2c31" strokeWidth="22" />
          {Array.from({ length: 19 }, (_, i) => {
            const a = Math.PI + (i / 18) * Math.PI
            const big = i % 3 === 0
            return (
              <path
                key={i}
                d={`M${150 + Math.cos(a) * 128} ${150 + Math.sin(a) * 128}L${150 + Math.cos(a) * (big ? 112 : 118)} ${150 + Math.sin(a) * (big ? 112 : 118)}`}
                stroke="#bab09f"
                strokeWidth={big ? 2 : 1}
                opacity={big ? 0.9 : 0.5}
              />
            )
          })}
          {/* janela de ametista (encolhe a cada acerto) */}
          <path d={arc(150, 150, 116, a0, a1)} fill="none" stroke="#8a7cc8" strokeWidth="22" opacity="0.85" />
          <path d={arc(150, 150, 127, a0, a1)} fill="none" stroke="#c2b9ec" strokeWidth="2" />
          {flash && <path key={flash.k} className="poco-hit" d={arc(150, 150, 116, a0, a1)} fill="none" stroke={flash.ok ? '#f1f0ee' : '#a3121f'} strokeWidth="26" />}
          {/* ponteiro */}
          <g ref={agulha} transform="rotate(-90 150 150)">
            <path d="M150 150L146 146L150 34L154 146Z" fill="#f1f0ee" />
            <path d="M150 34L150 146" stroke="#6b6357" strokeWidth="0.8" />
          </g>
          <circle cx="150" cy="150" r="11" fill="url(#poco-dial-aco)" stroke="#0c0c0e" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="3.5" fill="#8a7cc8" />
        </svg>

        {/* acertos: losangos */}
        <span className="mt-1 flex items-center gap-2" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('size-3 rotate-45 border', i < acertos ? 'border-dv-amethyst-text bg-dv-amethyst shadow-[0_0_8px_rgba(138,124,200,0.8)]' : 'border-dv-line-strong bg-transparent')} />
          ))}
        </span>
        <span className="sr-only" aria-live="polite">
          {acertos} de {total} acertos
        </span>

        <span className="mt-3 font-display text-[20px] font-semibold uppercase tracking-[0.2em] text-dv-text">
          {fim === 'perfeito' ? 'Giro perfeito' : fim === 'escapou' ? 'A manivela escapou' : fim === 'soltou' ? 'Manivela solta' : 'Toque na janela'}
        </span>
        <span id="poco-manivela-dica" className="mt-1 text-center font-body text-[14px] text-dv-text-2">
          {fim
            ? `${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}: o balde está subindo.`
            : `Cada acerto melhora a coleta.${params.lento ? ' Ponteiro lento (movimento reduzido).' : ''}`}
        </span>
      </button>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3"
        disabled={!!fim}
        onClick={() => {
          playSfx('click')
          encerrar('soltou')
        }}
      >
        Soltar a manivela
      </Button>
    </div>
  )
}

/** Arco de círculo de a0 a a1 (graus; -180 = esquerda, 0 = direita, passando pelo topo). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}
