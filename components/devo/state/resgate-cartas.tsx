'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { CardDelivery } from '@/lib/devo/progresso'
import { useEu } from './use-acesso'
import { useDevo } from './devo-store'

/**
 * Busca as cartas que o servidor deixou para o jogador (card_deliveries: recompensas da Mesa, Poço, pacotes,
 * Salão, Calendário…) e põe no save. Antes só a Casa, o Salão, o Calendário e as Corporações buscavam, então
 * uma carta concedida pela equipe ficava presa até o jogador abrir uma dessas telas. Agora roda no jogo todo:
 * ao entrar, ao voltar para a aba, a cada 90 s com a aba visível e sempre que /api/eu acusa cartas pendentes.
 * O uid `dlv-<id>` é o mesmo das outras telas, então nada duplica.
 */
export function ResgateCartas() {
  const { dispatch, notify } = useDevo()
  const { data } = useEu()
  const ocupado = useRef(false)

  const resgatar = useCallback(async () => {
    if (ocupado.current) return
    ocupado.current = true
    try {
      const r = await fetch('/api/eu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cartas.resgatar' }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; cartas?: CardDelivery[] } | null
      const cartas = j?.ok ? (j.cartas ?? []) : []
      if (!cartas.length) return
      dispatch({ type: 'CARDS_ADD', cards: cartas.map((c) => ({ uid: `dlv-${c.id}`, cardId: c.cardId, origin: c.origin, acquiredAt: c.createdAt })) })
      notify({
        appId: 'cartas',
        title: cartas.length === 1 ? 'Uma carta chegou para você' : `${cartas.length} cartas chegaram para você`,
        body: [...new Set(cartas.map((c) => c.origin))].slice(0, 3).join(' · '),
      })
      // Lote de 50: se veio cheio, ainda pode haver mais.
      if (cartas.length >= 50) window.setTimeout(() => void resgatar(), 500)
    } catch {
      // rede instável: tenta de novo na próxima vez
    } finally {
      ocupado.current = false
    }
  }, [dispatch, notify])

  useEffect(() => {
    void resgatar()
    const aoVoltar = () => document.visibilityState === 'visible' && void resgatar()
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    const t = window.setInterval(() => document.visibilityState === 'visible' && void resgatar(), 90_000)
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      window.clearInterval(t)
    }
  }, [resgatar])

  const pendentes = data?.cartasPendentes ?? 0
  useEffect(() => {
    if (pendentes > 0) void resgatar()
  }, [pendentes, resgatar])

  return null
}
