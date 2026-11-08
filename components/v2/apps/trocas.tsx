'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { getCard, RARITY_META } from '@/lib/devo/cards'
import { partnerReply } from '@/lib/devo/trade-bots'
import { QUICK_PHRASES, TRADE_PROTOCOL } from '@/lib/devo/trade-rooms'
import type { TradeSession } from '@/lib/devo/types'
import { CardBack, CardFace } from '@/components/devo/shared/devo-card'
import { nextId, useDevo } from '@/components/devo/state/devo-store'
import { useBackHandler } from '@/components/devo/use-back-handler'
import { px } from '../comum'

/**
 * Sala de Trocas no v2 (protótipo kit3/os-trocas.js): o corredor com as oito portas, a placa de livres e ocupadas, o
 * protocolo e a sala com a mesa (seu espaço e o do outro), o canal da sala com as frases prontas e o "Aceitar troca".
 * O andamento é o do jogo (motor em use-devo-engine: quem entra, a carta do outro, a revelação, quem foge); as ações
 * são as mesmas (TRADE_ENTER, TRADE_PLACE, TRADE_CHAT, TRADE_ACCEPT, TRADE_CANCEL, TRADE_EXIT). Cartas entregues ao
 * Salão das Máscaras aparecem trancadas e não vão à mesa.
 */

const ETAPA: Record<TradeSession['stage'], string> = {
  placing: 'Escolha uma carta para o seu espaço',
  waiting: 'Aguardando outro jogador…',
  negotiating: 'Negociação aberta',
  revealing: 'Revelando cartas…',
  done: 'Troca concluída',
  abandoned: 'Sala esvaziada',
}
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const pad2 = (n: number) => String(n).padStart(2, '0')

/** Uids entregues ao Salão das Máscaras (Bandeja/Mercado): não vão à mesa. Sem sessão no servidor, lista vazia. */
function usePresas(): Set<string> {
  const { data } = useSWR<{ presas?: string[] }>(
    '/api/trocas',
    (u: string) =>
      fetch(u, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { presas: [] }))
        .catch(() => ({ presas: [] })),
    { revalidateOnFocus: false, refreshInterval: 60_000 },
  )
  const lista = data?.presas ?? []
  const chave = lista.join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => new Set(lista), [chave])
}

export function TrocasV2() {
  const { state } = useDevo()
  const raiz = useRef<HTMLDivElement>(null)
  const sala = state.trade?.roomId
  useEffect(() => {
    raiz.current?.closest('.corpo')?.scrollTo({ top: 0 })
  }, [sala])
  return (
    <div id="tro" ref={raiz}>
      {state.trade ? <Sala trade={state.trade} /> : <Corredor />}
    </div>
  )
}

function Corredor() {
  const { state, dispatch } = useDevo()
  const presas = usePresas()
  const [protocolo, setProtocolo] = useState(false)
  const livres = state.rooms.filter((r) => r.status === 'livre').length
  const ocupadas = state.rooms.filter((r) => r.status === 'ocupada').length
  const trancado = state.inventory.filter((c) => !presas.has(c.uid)).length === 0
  return (
    <>
      <p className="t-canto">Corredor B · Andar 3</p>
      <div className="t-placa">
        <span>
          <b>{livres}</b> {livres === 1 ? 'livre' : 'livres'}
        </span>
        <span>
          <b>{ocupadas}</b> {ocupadas === 1 ? 'ocupada' : 'ocupadas'}
        </span>
      </div>
      {trancado && (
        <div className="t-aviso fundo" role="status">
          <strong>Nenhuma porta abre para você</strong>
          <p>{state.inventory.length > 0 ? 'Sem cartas, sem troca. As suas estão no Salão das Máscaras e não vão à mesa.' : 'Consiga uma carta e volte ao corredor.'}</p>
        </div>
      )}
      <ul className="t-portas" aria-label="Salas">
        {state.rooms.map((r) => {
          const oc = r.status === 'ocupada'
          const sua = r.status === 'sua'
          const tr = trancado && !oc && !sua
          const [tit, lin] = tr ? ['Trancada para você', 'Sem cartas, sem troca.'] : oc ? ['Em negociação', 'Dois estranhos à mesa.'] : sua ? ['Sua sala', 'Sua carta espera.'] : ['Mesa vazia', 'Entre e ponha uma carta.']
          return (
            <li key={r.id}>
              <button
                className={'t-porta' + (oc || tr ? ' fechada' : '') + (sua ? ' sua' : '')}
                disabled={oc || tr}
                aria-label={`Sala ${r.number}, ${oc ? 'Ocupada' : sua ? 'Sua sala' : 'Livre'}, ${tit}: ${lin}`}
                onClick={() => {
                  playSfx('open')
                  dispatch({ type: 'TRADE_ENTER', roomId: r.id })
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={px(oc ? 'porta-ocupada' : sua ? 'porta-sua' : 'porta-livre')} alt="" />
                <b>{pad2(r.number)}</b>
                <small>{oc ? 'Ocupada' : sua ? 'Sua' : tr ? 'Trancada' : 'Livre'}</small>
              </button>
            </li>
          )
        })}
      </ul>
      <button className="r-link t-prot" aria-expanded={protocolo} onClick={() => setProtocolo((p) => !p)}>
        {protocolo ? 'Fechar o protocolo' : 'Ver o protocolo'}
      </button>
      {protocolo && (
        <ol className="t-regras">
          {TRADE_PROTOCOL.map((r, i) => (
            <li key={i}>
              <b>{ROMANOS[i]}.</b>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

function Vaga({ children }: { children?: ReactNode }) {
  return (
    <div className="t-vaga">
      <span>{children}</span>
    </div>
  )
}

function Lugar({ rot, nome, nota, children }: { rot: string; nome: string; nota?: string; children: ReactNode }) {
  return (
    <div className="t-lugar">
      <small>{rot}</small>
      <b>{nome}</b>
      <div className="t-carta">{children}</div>
      <em>{nota || ' '}</em>
    </div>
  )
}

function Sala({ trade }: { trade: TradeSession }) {
  const { state, dispatch } = useDevo()
  const presas = usePresas()
  const sala = state.rooms.find((r) => r.id === trade.roomId)
  const e = trade.stage
  const fim = e === 'done' || e === 'abandoned'
  const revelou = e === 'revealing' || e === 'done'
  const saiu = trade.endReason === 'partner-left'

  // quem está na mesa já vê quem sentou e o que recebeu: o aviso do sistema fica só na central
  const avisos = state.toasts
    .filter((t) => t.appId === 'trocas' || t.appId === 'cartas')
    .map((t) => t.id)
    .join(',')
  useEffect(() => {
    if (!avisos) return
    for (const id of avisos.split(',')) dispatch({ type: 'DISMISS_TOAST', id })
  }, [avisos, dispatch])

  const volta = () => {
    playSfx('close')
    dispatch({ type: 'TRADE_EXIT' })
  }
  // sair antes de os dois aceitarem desfaz tudo: cada carta volta ao dono; na revelação não há saída
  const sai = () => {
    if (e === 'revealing') return
    if (fim) return volta()
    playSfx('close')
    if (trade.myCard) dispatch({ type: 'TRADE_CANCEL' })
    dispatch({ type: 'TRADE_EXIT' })
  }
  useBackHandler(true, sai)

  const minhaRar = trade.myCard ? RARITY_META[getCard(trade.myCard.cardId).rarity] : null
  const outro = saiu ? (
    <Vaga>Cadeira vazia</Vaga>
  ) : trade.partner && trade.partnerCardId ? (
    revelou ? (
      <CardFace cardId={trade.partnerCardId} className="w-full" />
    ) : (
      <CardBack className="w-full" />
    )
  ) : (
    <Vaga>{e === 'waiting' ? 'Passos no corredor…' : ''}</Vaga>
  )
  const meu = trade.myCard ? <CardFace cardId={trade.myCard.cardId} className="w-full" /> : <Vaga>Escolha abaixo</Vaga>

  return (
    <div className="t-sala">
      <div className="t-esq">
        <div className="t-cab">
          <button className="m-volta chanfro" aria-label={fim ? 'Voltar ao corredor' : 'Sair da sala'} disabled={e === 'revealing'} onClick={sai}>
            ‹
          </button>
          <div>
            <strong>Sala {pad2(sala?.number ?? 0)}</strong>
            <small aria-live="polite">{ETAPA[e]}</small>
          </div>
        </div>
        <p className="t-regra">
          <b>Mesma raridade.</b> Às cegas até a revelação.
          {minhaRar && !revelou ? ` Esta mesa: ${minhaRar.label}.` : ''}
        </p>
        <div className={'t-mesa fundo' + (e === 'placing' ? ' vazia' : fim ? ' grande' : '') + (e === 'revealing' ? ' revela' : '')}>
          <Lugar rot="Espaço do outro" nome={saiu ? 'Saiu da sala' : (trade.partner?.handle ?? 'Vazio')} nota={revelou && !saiu ? 'Revelada' : trade.partnerCardId && !saiu ? (trade.partnerAccept ? 'Aceitou' : 'Virada para baixo') : ''}>
            {outro}
          </Lugar>
          <Lugar rot="Seu espaço" nome="Você" nota={e === 'done' ? 'Entregue' : trade.myCard ? (trade.myAccept ? 'Você aceitou' : 'O outro vê o verso') : ''}>
            {meu}
          </Lugar>
        </div>
        {trade.myAccept && !fim && e !== 'revealing' && <p className="t-sub">Você aceitou. Não há volta.</p>}
        {!fim && e !== 'placing' && !trade.myAccept && <p className="t-sub">{e === 'waiting' ? 'Sua carta está na mesa, virada para baixo.' : e === 'revealing' ? 'As duas cartas viram ao mesmo tempo.' : 'Se os dois aceitarem, as cartas viram. Troca confirmada não se desfaz.'}</p>}
      </div>
      <div className="t-dir">
        {e === 'placing' ? (
          <>
            <h4>Suas cartas</h4>
            <ul className="t-escolha" aria-label="Suas cartas">
              {[...state.inventory]
                .sort((a, b) => Number(presas.has(a.uid)) - Number(presas.has(b.uid)) || RARITY_META[getCard(b.cardId).rarity].order - RARITY_META[getCard(a.cardId).rarity].order)
                .map((c) => {
                  const presa = presas.has(c.uid)
                  const nome = getCard(c.cardId).name
                  return (
                    <li key={c.uid}>
                      <button
                        className={presa ? 'presa' : undefined}
                        disabled={presa}
                        aria-label={presa ? `${nome}: no Salão das Máscaras, não vai à mesa` : `Colocar ${nome} na mesa`}
                        onClick={() => {
                          playSfx('card-select')
                          dispatch({ type: 'TRADE_PLACE', uid: c.uid })
                        }}
                      >
                        <CardFace cardId={c.cardId} className="w-full" />
                        <span>{presa ? 'No Salão' : nome}</span>
                      </button>
                    </li>
                  )
                })}
              {!state.inventory.length && <li className="r-sub">Você não tem cartas para trocar.</li>}
            </ul>
          </>
        ) : e === 'done' && trade.partnerCardId ? (
          <>
            <div className="t-fim fundo">
              <small>Você recebeu</small>
              <strong>{getCard(trade.partnerCardId).name}</strong>
              <span>{RARITY_META[getCard(trade.partnerCardId).rarity].label}</span>
              <b className="t-selo">Troca final</b>
            </div>
            <button className="r-bt chanfro t-volta" onClick={volta}>
              Voltar ao corredor
            </button>
          </>
        ) : e === 'abandoned' ? (
          <>
            <div className="t-fim fundo">
              <p>{saiu ? 'O outro jogador fugiu antes de aceitar. Sua carta voltou para você.' : 'Troca cancelada. Sua carta voltou para você.'}</p>
            </div>
            <button className="r-bt chanfro t-volta" onClick={volta}>
              Voltar ao corredor
            </button>
          </>
        ) : (
          <Canal trade={trade} />
        )}
      </div>
    </div>
  )
}

function Canal({ trade }: { trade: TradeSession }) {
  const { dispatch } = useDevo()
  const [texto, setTexto] = useState('')
  const lista = useRef<HTMLDivElement>(null)
  const aberto = trade.stage === 'negotiating'
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [trade.chat.length, trade.partnerTyping])
  const diz = (t: string) => {
    if (!t || !aberto || !trade.partner || !trade.partnerCardId) return
    const { partner, partnerCardId } = trade
    setTexto('')
    playSfx('send')
    dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: 'me', text: t, at: Date.now() } })
    window.setTimeout(() => dispatch({ type: 'TRADE_PARTNER_TYPING', typing: true }), 600)
    window.setTimeout(
      () => dispatch({ type: 'TRADE_CHAT', message: { id: nextId('tc'), from: partner.handle, text: partnerReply(partner, partnerCardId, t), at: Date.now() } }),
      1800 + Math.random() * 1600,
    )
  }
  const envia = (ev: FormEvent) => {
    ev.preventDefault()
    diz(texto.trim())
  }
  return (
    <>
      <div className="t-chat" role="log" aria-label="Conversa da sala" aria-live="polite" ref={lista}>
        {!trade.chat.length && !trade.partnerTyping && <p className="m-nada">{trade.partner ? 'Ninguém disse nada ainda.' : 'Ninguém na sala ainda.'}</p>}
        {trade.chat.map((m) => (
          <div key={m.id} className={'m-bolha ' + (m.from === 'me' ? 'eu' : 'ele')}>
            {m.text}
          </div>
        ))}
        {trade.partnerTyping && (
          <div className="m-bolha ele m-pontos" aria-label="Digitando">
            <u />
            <u />
            <u />
          </div>
        )}
      </div>
      <div className="t-frases" role="group" aria-label="Frases prontas">
        {aberto &&
          QUICK_PHRASES.map((p) => (
            <button key={p} type="button" className="chanfro" onClick={() => diz(p)}>
              {p}
            </button>
          ))}
      </div>
      <form className="t-form" onSubmit={envia}>
        <input
          maxLength={120}
          autoComplete="off"
          aria-label="Sua mensagem"
          placeholder={aberto ? 'Negocie, convença… ou minta.' : 'O canal abre quando alguém sentar.'}
          disabled={!aberto}
          value={texto}
          onChange={(ev) => setTexto(ev.target.value)}
        />
        <button className="r-bt chanfro" disabled={!aberto}>
          Enviar
        </button>
      </form>
      {trade.stage === 'revealing' ? (
        <p className="t-sub">As duas cartas viram ao mesmo tempo.</p>
      ) : (
        <button
          className="r-bt chanfro t-aceita"
          disabled={!aberto || trade.myAccept}
          onClick={() => {
            playSfx('confirm')
            dispatch({ type: 'TRADE_ACCEPT' })
          }}
        >
          {trade.myAccept ? 'Troca aceita' : 'Aceitar troca'}
        </button>
      )}
    </>
  )
}
