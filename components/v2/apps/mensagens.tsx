'use client'

import { useEffect, useRef, useState } from 'react'
import { playSfx } from '@/lib/devo/audio'
import { availableChoices, getNpc, isAcao, semAsteriscos, STICKER_PREFIX, stickerSrc, type DialogueChoice } from '@/lib/devo/npcs'
import { withName } from '@/lib/devo/player-name'
import type { Thread } from '@/lib/devo/types'
import { formatClock } from '@/components/devo/hooks'
import { callName, nextId, useDevo } from '@/components/devo/state/devo-store'
import { useBackHandler } from '@/components/devo/use-back-handler'
import { px } from '../comum'

/**
 * Mensagens no v2 (protótipo kit3/os-mensagens.js): lista de conversas com o rostinho em pixel de cada NPC, a
 * conversa com balões e as perguntas por baixo, e o canal dos jogadores bloqueado. Conversas, perguntas e respostas
 * são as do jogo (save do jogador: state.threads, lib/devo/npcs.ts), com o mesmo ritmo de digitação, sons, figurinhas
 * e o nome do jogador nas falas. O rosto do NPC muda com a última pergunta feita (expressões sugeridas no protótipo).
 */

/** Rostos em pixel que existem (public/v2/art/os/npc). Quem não tiver aparece como "?". */
const ROSTOS: Record<string, { padrao: string; tem: string[] }> = {
  rato: { padrao: 'sorriso', tem: ['desdem', 'malicia', 'sorriso', 'surpreso', 'trama'] },
  herdeiro: { padrao: 'neutro', tem: ['confiante', 'desdem', 'entediado', 'malicia', 'neutro'] },
  coruja: { padrao: 'neutro', tem: ['neutro', 'preocupado', 'sorriso', 'timido', 'triste'] },
  galo: { padrao: 'neutro', tem: ['confiante', 'malicia', 'neutro', 'riso', 'sorriso'] },
  javali: { padrao: 'neutro', tem: ['convite', 'desdem', 'explica', 'neutro', 'pensativo', 'riso', 'sombrio', 'trama'] },
}
/** Expressão de cada pergunta (sugestão do protótipo). */
const EXPRESSAO: Record<string, Record<string, string>> = {
  rato: { regras: 'malicia', sair: 'trama', horas: 'desdem', promessas: 'surpreso' },
  herdeiro: { quem: 'confiante', ajuda: 'desdem', troca: 'malicia', rato: 'entediado' },
  coruja: { figurinha: 'sorriso', esqueceu: 'preocupado', ignorar: 'triste', outra: 'timido', exemplo: 'sorriso', escudo: 'triste' },
}
/** Figurinhas redesenhadas no v2; as outras usam a do jogo. */
const FIG_V2 = new Set(['engracada', 'triste'])
const figura = (texto: string) => {
  const nome = texto.startsWith(STICKER_PREFIX) ? texto.slice(STICKER_PREFIX.length) : null
  if (!nome) return null
  return FIG_V2.has(nome) ? `/v2/art/os/npc/fig-${nome}.png` : stickerSrc(texto)
}

function rostoDe(t: Thread) {
  const r = ROSTOS[t.npcId]
  if (!r) return null
  const exp = EXPRESSAO[t.npcId] ?? {}
  const ultima = [...t.answered].reverse().find((id) => exp[id])
  const e = ultima ? exp[ultima] : r.padrao
  return `/v2/art/os/npc/${t.npcId}-${r.tem.includes(e) ? e : r.padrao}.png`
}

function Rosto({ t, className }: { t: Thread; className: string }) {
  const s = rostoDe(t)
  // eslint-disable-next-line @next/next/no-img-element
  return s ? <img className={className} src={s} alt="" /> : <span className={className + ' m-oculto'} aria-hidden="true">?</span>
}

export function MensagensV2() {
  const { state, dispatch } = useDevo()
  const [aberta, setAberta] = useState<string | null>(null)
  const ativa = state.threads.find((t) => t.id === aberta) ?? null
  const visiveis = state.threads.filter((t) => !(getNpc(t.npcId).hidden && t.messages.length === 0 && !t.typing))

  useEffect(() => {
    if (ativa?.unread) dispatch({ type: 'THREAD_READ', threadId: ativa.id })
  }, [ativa?.id, ativa?.unread, dispatch])

  const ultima = (t: Thread) => {
    const m = t.messages.at(-1)
    return t.typing ? 'digitando…' : !m ? 'Nenhuma mensagem ainda.' : stickerSrc(m.text) ? 'Figurinha' : m.text
  }

  return (
    <div id="msg" className={ativa ? 'conversando' : undefined}>
      <div className="m-lista">
        <p className="m-canal">Canal seguro · {visiveis.length} conversas</p>
        <ul className="m-itens" aria-label="Conversas">
          {visiveis.map((t) => {
            const n = getNpc(t.npcId)
            const on = t.id === aberta
            const m = t.messages.at(-1)
            return (
              <li key={t.id}>
                <button
                  className={'m-item' + (on ? ' on' : '')}
                  aria-current={on || undefined}
                  onClick={() => {
                    playSfx('open')
                    setAberta(t.id)
                  }}
                >
                  <Rosto t={t} className="m-rosto" />
                  <span className="m-tx">
                    <b>{n.name}</b>
                    <small>
                      {n.title}
                      {m ? <time> · {formatClock(m.at)}</time> : null}
                    </small>
                    <em className={t.unread ? 'novo' : ''}>{ultima(t)}</em>
                  </span>
                  {t.unread > 0 && (
                    <i>
                      {t.unread}
                      <span className="m-so"> não lidas</span>
                    </i>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="m-canal">Jogadores</p>
        <div className="m-bloq fundo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px('cadeado')} alt="" />
          <div>
            <strong>Bloqueado</strong>
            <p>Conversas livres entre jogadores ainda não foram liberadas. O Anfitrião decide quando este canal abre.</p>
          </div>
        </div>
      </div>
      <div className="m-conversa">
        {ativa ? (
          <Conversa key={ativa.id} t={ativa} onVolta={() => setAberta(null)} />
        ) : (
          <div className="m-vazio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={px('mensagens')} alt="" />
            <strong>Canal seguro</strong>
            <p>Escolha uma conversa. Cuidado com quem responde.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Conversa({ t, onVolta }: { t: Thread; onVolta: () => void }) {
  const { state, dispatch } = useDevo()
  const npc = getNpc(t.npcId)
  const [ocupado, setOcupado] = useState(false)
  const fala = useRef<HTMLDivElement>(null)
  const escolhas = availableChoices(npc, t.answered)
  const nome = callName(state)
  useBackHandler(true, onVolta)

  useEffect(() => {
    fala.current?.scrollTo({ top: fala.current.scrollHeight, behavior: 'smooth' })
  }, [t.messages.length, t.typing])

  const pergunta = (c: DialogueChoice) => {
    if (ocupado || t.answered.includes(c.id)) return
    setOcupado(true)
    playSfx('send')
    dispatch({ type: 'THREAD_ANSWER', threadId: t.id, choiceId: c.id })
    if (!c.silent) {
      const text = c.sticker ? `${STICKER_PREFIX}${c.sticker}` : withName(semAsteriscos(c.prompt), nome, state.profile.gender)
      dispatch({ type: 'THREAD_MESSAGE', threadId: t.id, countUnread: false, message: { id: nextId('m'), from: 'me', text, at: Date.now() } })
    }
    if (c.reply.length === 0) {
      window.setTimeout(() => setOcupado(false), 400)
      return
    }
    let espera = 700
    c.reply.forEach((linha, i) => {
      window.setTimeout(() => dispatch({ type: 'THREAD_TYPING', threadId: t.id, typing: true }), espera)
      espera += 1100 + linha.length * 18
      window.setTimeout(() => {
        dispatch({ type: 'THREAD_MESSAGE', threadId: t.id, countUnread: false, message: { id: nextId('m'), from: npc.id, text: withName(linha, nome, state.profile.gender), at: Date.now() } })
        playSfx('notify')
        if (i === c.reply.length - 1) setOcupado(false)
      }, espera)
      espera += 300
    })
  }

  return (
    <>
      <header className="m-cab">
        <button className="m-volta chanfro" aria-label="Voltar para conversas" onClick={onVolta}>
          ‹
        </button>
        <Rosto t={t} className="m-rosto" />
        <span className="m-tx">
          <b>{npc.name}</b>
          <small>{t.typing ? 'digitando…' : npc.title}</small>
        </span>
      </header>
      <div className="m-fala" role="log" aria-label="Mensagens" aria-live="polite" ref={fala}>
        {!t.messages.length && !t.typing && <p className="m-nada">Nenhuma mensagem ainda. A primeira palavra é sua.</p>}
        {t.messages.map((m) => {
          const fig = figura(m.text)
          return (
            <div key={m.id} className={'m-bolha ' + (m.from === 'me' ? 'eu' : 'ele')} title={formatClock(m.at)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {fig ? <img className="m-fig" src={fig} alt="Figurinha" /> : m.text}
            </div>
          )
        })}
        {t.typing && (
          <div className="m-bolha ele m-pontos" aria-label="Digitando">
            <u />
            <u />
            <u />
          </div>
        )}
      </div>
      <div className="m-esc">
        <p>{escolhas.length ? 'Escolha o que perguntar' : (npc.doneText ?? 'Nada mais a perguntar')}</p>
        {escolhas.map((c) => (
          <button key={c.id} className={'m-op chanfro' + (isAcao(c.prompt) ? ' acao' : '')} disabled={ocupado} onClick={() => pergunta(c)}>
            {withName(semAsteriscos(c.prompt), nome, state.profile.gender)}
          </button>
        ))}
      </div>
    </>
  )
}
