'use client'

import { useEffect } from 'react'
import { getCard } from '@/lib/devo/cards'
import { partnerCardFor, ROOM_RULES } from '@/lib/devo/trade-rooms'
import { getNpc } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import { makePartner, partnerLine } from '@/lib/devo/trade-bots'
import { playSfx } from '@/lib/devo/audio'
import { nextId, useDevo } from '../state/devo-store'

type Welcome = { delay: number; threadId: string; npcId: string; text: string }

/**
 * Avisos de boas-vindas (área ENTRADA, rodada 2): começam depois que o herói da home termina de entrar
 * e ficam espaçados mais que a vida do toast (5,2s) — um aviso por vez, nunca empilhados sobre o cartão.
 */
const WELCOME_PULSE_MS = 2600
const WELCOME: Welcome[] = [
  { delay: 8400, threadId: 't-rato', npcId: 'rato', text: 'Bem-vindo ao DEVO, {nome}! Seu pulso marca 72 horas. Gaste com sabedoria. Ou não! Hihihi.' },
  { delay: 14200, threadId: 't-rato', npcId: 'rato', text: 'Dica do Anfitrião: a Sala de Trocas está aberta. Leve uma carta. Volte com outra. Talvez.' },
  { delay: 20000, threadId: 't-herdeiro', npcId: 'herdeiro', text: 'Já li o seu perfil, {nome}. Decepcionante. Não me envie mensagens desnecessárias.' },
  { delay: 26000, threadId: 't-desconhecido', npcId: 'desconhecido', text: 'Não confie no Rato.' },
]

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Comportamentos do mundo: mensagens de boas-vindas, salas e jogadores da Sala de Trocas. */
export function useDevoEngine() {
  const { state, dispatch, notify } = useDevo()
  const { trade } = state
  const stage = trade?.stage
  const myAccept = trade?.myAccept
  const partnerAccept = trade?.partnerAccept

  useEffect(() => {
    if (state.welcomed) return
    dispatch({ type: 'MARK_WELCOMED' })
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => notify({ appId: 'pulso', title: 'Pulso sincronizado', body: '72:00:00 restantes. O relógio começou.', tone: 'danger' }), WELCOME_PULSE_MS),
    )
    for (const w of WELCOME) {
      const text = withName(w.text, state.playerName)
      timers.push(window.setTimeout(() => dispatch({ type: 'THREAD_TYPING', threadId: w.threadId, typing: true }), w.delay - 1300))
      timers.push(
        window.setTimeout(() => {
          dispatch({ type: 'THREAD_MESSAGE', threadId: w.threadId, countUnread: true, message: { id: nextId('m'), from: w.npcId, text, at: Date.now() } })
          notify({ appId: 'mensagens', title: getNpc(w.npcId).name, body: text })
          playSfx('notify')
        }, w.delay),
      )
    }
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const owlChatEmpty = !state.threads.find((t) => t.id === 't-coruja')?.messages.length
  useEffect(() => {
    if (!state.owlMet || !owlChatEmpty) return
    const lines = ['Olá, sou eu, mais uma vez, Coruja.', 'Esqueci de te avisar uma coisa. Sou bastante esquecida.']
    const timers: number[] = []
    let delay = 9000
    lines.forEach((text, i) => {
      timers.push(window.setTimeout(() => dispatch({ type: 'THREAD_TYPING', threadId: 't-coruja', typing: true }), delay - 1400))
      timers.push(
        window.setTimeout(() => {
          dispatch({ type: 'THREAD_MESSAGE', threadId: 't-coruja', countUnread: true, message: { id: nextId('m'), from: 'coruja', text, at: Date.now() } })
          if (i === 0) notify({ appId: 'mensagens', title: 'Coruja entrou em contato', body: text })
          playSfx('notify')
        }, delay),
      )
      delay += 2600
    })
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.owlMet])

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'ROOMS_SHUFFLE' }), 11000)
    return () => window.clearInterval(id)
  }, [dispatch])

  const roomRule = trade ? state.rooms.find((r) => r.id === trade.roomId)?.rule : undefined
  // Fala espontânea do parceiro só onde existe chat (frases prontas ou livre).
  const silent = roomRule ? ROOM_RULES[roomRule].chat === 'nenhum' : false

  useEffect(() => {
    if (stage !== 'waiting' || !trade?.myCard) return
    const rarity = getCard(trade.myCard.cardId).rarity
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => {
        const partner = makePartner()
        const card = partnerCardFor(roomRule ?? 'mesma-raridade', rarity)
        dispatch({ type: 'TRADE_PARTNER_JOIN', partner, partnerCardId: card.id })
        notify({ appId: 'trocas', title: 'Sala de Trocas', body: `${partner.handle} entrou na sua sala e colocou uma carta na mesa.` })
        playSfx('notify')
        if (silent) return
        timers.push(window.setTimeout(() => dispatch({ type: 'TRADE_PARTNER_TYPING', typing: true }), 700))
        timers.push(
          window.setTimeout(() => {
            dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: partner.handle, text: partnerLine(partner, card.id, 'opening'), at: Date.now() } })
          }, 2200),
        )
      }, rand(3200, 6500)),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  useEffect(() => {
    if (stage !== 'negotiating' || !trade?.partner || !trade.partnerCardId) return
    const { partner, partnerCardId } = trade
    const say = (kind: 'accept' | 'leave') => {
      if (silent) return
      dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: partner.handle, text: partnerLine(partner, partnerCardId, kind), at: Date.now() } })
    }
    const leave = () => {
      say('leave')
      dispatch({ type: 'TRADE_PARTNER_LEAVE' })
      notify({ appId: 'trocas', title: 'Troca desfeita', body: `${partner.handle} abandonou a sala. Sua carta voltou para você.`, tone: 'danger' })
      playSfx('error')
    }
    let timer: number
    if (myAccept && partnerAccept) {
      timer = window.setTimeout(() => dispatch({ type: 'TRADE_REVEAL' }), 900)
    } else if (myAccept) {
      timer = window.setTimeout(() => {
        if (partner.willing) {
          say('accept')
          dispatch({ type: 'TRADE_PARTNER_ACCEPT' })
          playSfx('confirm')
        } else leave()
      }, rand(1800, 4200))
    } else if (!partnerAccept) {
      timer = window.setTimeout(() => {
        if (partner.willing) {
          say('accept')
          dispatch({ type: 'TRADE_PARTNER_ACCEPT' })
          playSfx('confirm')
        } else leave()
      }, rand(16000, 26000))
    }
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, myAccept, partnerAccept])

  useEffect(() => {
    if (stage !== 'revealing') return
    playSfx('reveal')
    const t = window.setTimeout(() => {
      dispatch({ type: 'TRADE_COMPLETE' })
      if (trade?.partnerCardId) {
        notify({ appId: 'cartas', title: 'Nova carta', body: `${getCard(trade.partnerCardId).name} foi adicionada ao seu inventário.` })
      }
    }, 2600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])
}
