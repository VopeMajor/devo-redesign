'use client'

import { useEffect, useState } from 'react'
import { CENA_ANFITRIAO_DE_QUE, CENA_REFLEXAO } from '@/lib/devo/torres/galo'
import { Cena } from './cena'

/**
 * Gatilho de cenas narrativas fora de um app (evento de janela `devo:cena`, detalhe `{ id }`).
 *
 * Hoje só existe a reflexão "Anfitrião de quê?", disparada quando o jogador sai da aba das Torres pela
 * primeira vez depois da apresentação do Galo. O agente Narrativa pode assumir a cena: basta escutar o
 * mesmo evento e chamar `event.preventDefault()` no próprio ouvinte — este fallback espera uma microtarefa e
 * só toca se ninguém tiver assumido. A resposta vai para o servidor (POST /api/torres {action:'reflexao'}).
 */
export const EVENTO_CENA = 'devo:cena'

export function pedirCena(id: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_CENA, { detail: { id }, cancelable: true }))
}

export function CenasGatilho() {
  const [ativa, setAtiva] = useState<string | null>(null)
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id
      queueMicrotask(() => {
        if (!e.defaultPrevented && id === CENA_ANFITRIAO_DE_QUE) setAtiva(id)
      })
    }
    window.addEventListener(EVENTO_CENA, on)
    return () => window.removeEventListener(EVENTO_CENA, on)
  }, [])
  if (ativa !== CENA_ANFITRIAO_DE_QUE) return null
  return (
    <div className="fixed inset-0 z-[70]">
      <Cena
        passos={CENA_REFLEXAO}
        npc={null}
        fundo="reflexao"
        titulo="Anfitrião de quê?"
        kicker="Reflexão · Torres de Ruptura"
        onOpcao={(_, idx) => {
          void fetch('/api/torres', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'reflexao', escolha: idx + 1 }) }).catch(() => {})
        }}
        onFim={() => setAtiva(null)}
      />
    </div>
  )
}
