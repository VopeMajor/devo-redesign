'use client'

import { type ChangeEvent, type CSSProperties, type FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { playSfx } from '@/lib/devo/audio'
import { CHAT_MAX_CARACTERES, CORP_PAPEIS, type CorpChat, type CorpMensagem, type CorpPapel, type MinhaCorp } from '@/lib/devo/corporacoes'
import { corpGet, corpPost } from '@/components/devo/corporacoes/dados'
import { erroTexto } from '../comum'

/**
 * Chat e papel de parede da Corporação (dono, 03/11/2026; protótipo kit3/os-corp.js › pChat, pPapel e o fundo do
 * sistema em os-janelas.html › pinta()). O chat lê as últimas mensagens do servidor a cada poucos segundos enquanto a
 * aba está aberta; o papel é escolhido pelo líder e fica guardado no servidor, junto da Corporação.
 */

const CHAT_KEY = '/api/corporacoes?view=chat'

/** Endereço do papel de parede (padrão publicado ou a imagem do líder, servida a membros). */
export function papelSrc(p: CorpPapel | undefined): string | null {
  if (!p) return null
  return p.tipo === 'padrao' ? `/v2/art/os/papeis/${p.id}.webp?v=1` : `/api/corporacoes/papel?v=${p.versao}`
}

/**
 * Com a janela da Corporação em foco, o fundo do sistema troca para o papel dela (classe `papel` e `--papel` em
 * #os, como o protótipo); ao perder o foco, minimizar ou fechar, volta o fundo normal.
 */
export function usePapelNaCasca(jan: HTMLElement | null, url: string | null) {
  useEffect(() => {
    const os = document.getElementById('os')
    if (!jan || !os) return
    const aplica = () => {
      const on = !!url && jan.classList.contains('foco') && !jan.hidden
      os.classList.toggle('papel', on)
      if (on) os.style.setProperty('--papel', `url("${url}")`)
      else os.style.removeProperty('--papel')
    }
    aplica()
    const mo = new MutationObserver(aplica)
    mo.observe(jan, { attributes: true, attributeFilter: ['class', 'hidden'] })
    return () => {
      mo.disconnect()
      os.classList.remove('papel')
      os.style.removeProperty('--papel')
    }
  }, [jan, url])
}

const fmtHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
const fmtDia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
const hora = (ms: number) => {
  const hoje = fmtDia.format(Date.now()) === fmtDia.format(ms)
  return hoje ? fmtHora.format(ms) : `${fmtDia.format(ms)} ${fmtHora.format(ms)}`
}

export function Monograma({ nome, cargo }: { nome: string; cargo?: string | null }) {
  return (
    <i className={'co-mon' + (cargo === 'lider' ? ' li' : cargo === 'vice' ? ' vi' : '')} aria-hidden="true">
      {(nome.trim()[0] ?? '?').toLocaleUpperCase('pt-BR')}
    </i>
  )
}

/* ------------------------------------------------------------------ Chat */

export function ChatCorp({ m, jan }: { m: MinhaCorp; jan: HTMLElement | null }) {
  const pp = papelSrc(m.papel)
  const { data, error, mutate } = useSWR<CorpChat>(CHAT_KEY, corpGet, {
    refreshInterval: 4000,
    dedupingInterval: 1500,
    revalidateOnFocus: true,
    keepPreviousData: true,
    // janela minimizada: não pergunta ao servidor
    isPaused: () => !!jan?.hidden,
  })
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const fala = useRef<HTMLDivElement>(null)
  const noFim = useRef(true)
  const campo = useRef<HTMLInputElement>(null)
  const lista = data?.mensagens ?? []
  const ultima = lista[lista.length - 1]?.id

  // rolagem no fim: na primeira leitura, ao mandar e quando chega mensagem com o leitor já no fim
  useLayoutEffect(() => {
    const f = fala.current
    if (f && noFim.current) f.scrollTop = f.scrollHeight
  }, [ultima])

  const envia = async (ev: FormEvent) => {
    ev.preventDefault()
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const r = await corpPost<{ mensagem: CorpMensagem }>({ action: 'chat.enviar', texto: t })
      playSfx('send')
      setTexto('')
      noFim.current = true
      await mutate((cur) => (cur ? { ...cur, mensagens: [...cur.mensagens.filter((x) => x.id !== r.mensagem.id), r.mensagem] } : cur), { revalidate: false })
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e, 'A mensagem não foi enviada.'))
    } finally {
      setEnviando(false)
      campo.current?.focus()
    }
  }

  const me = m.membrosLista.find((p) => p.eu)
  return (
    <section className={'co-chat' + (pp ? ' com-papel' : '')} style={pp ? ({ '--papel-chat': `url('${pp}')` } as CSSProperties) : undefined} aria-label="Chat da Corporação">
      <div
        className="co-chat-fala"
        ref={fala}
        role="log"
        aria-live="polite"
        onScroll={(e) => {
          const f = e.currentTarget
          noFim.current = f.scrollHeight - f.scrollTop - f.clientHeight < 48
        }}
      >
        {!data && !error && <p className="r-sub co-chat-nada">Abrindo o chat…</p>}
        {data && !lista.length && <p className="r-sub co-chat-nada">Ninguém escreveu ainda.</p>}
        {lista.map((c) => (
          <div key={c.id} className={'co-msg' + (c.eu ? ' eu' : '')}>
            {!c.eu && <Monograma nome={c.de} cargo={c.cargo} />}
            <p>
              {!c.eu && <b>{c.de}</b>}
              {c.texto}
              <small>{hora(c.em)}</small>
            </p>
          </div>
        ))}
      </div>
      <form className="co-chat-env" onSubmit={envia}>
        <input
          ref={campo}
          className="s-in"
          maxLength={data?.max ?? CHAT_MAX_CARACTERES}
          placeholder="Mensagem para a Corporação"
          autoComplete="off"
          aria-label="Mensagem"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            if (erro) setErro(null)
          }}
        />
        <button className="r-bt chanfro" aria-label="Enviar" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
      {(erro || (error && !data)) && (
        <p className="r-erro co-chat-erro" role="alert">
          {erro ?? (error as Error).message}
        </p>
      )}
      {!pp && me?.cargo === 'lider' && <p className="r-sub co-chat-dica">Escolha um papel de parede na aba Parede.</p>}
    </section>
  )
}

/* ------------------------------------------------------------------ Parede (só o líder) */

/** Limite da imagem depois de reduzida (o servidor aceita até 900 KB). */
const LIMITE_BYTES = 860_000
const bytes = (url: string) => ((url.length - url.indexOf(',') - 1) * 3) / 4

/** Reduz a imagem do aparelho para no máximo 1600 px de largura (JPEG), baixando a qualidade se precisar. */
async function reduz(f: File): Promise<string> {
  const src = URL.createObjectURL(f)
  try {
    const im = await new Promise<HTMLImageElement>((ok, er) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = er
      i.src = src
    })
    for (const largura of [1600, 1280, 1024]) {
      const k = Math.min(1, largura / im.naturalWidth)
      const cv = document.createElement('canvas')
      cv.width = Math.max(1, Math.round(im.naturalWidth * k))
      cv.height = Math.max(1, Math.round(im.naturalHeight * k))
      const x = cv.getContext('2d')!
      x.fillStyle = '#05070c'
      x.fillRect(0, 0, cv.width, cv.height)
      x.imageSmoothingQuality = 'high'
      x.drawImage(im, 0, 0, cv.width, cv.height)
      for (const q of [0.82, 0.74, 0.66, 0.58]) {
        const url = cv.toDataURL('image/jpeg', q)
        if (bytes(url) <= LIMITE_BYTES) return url
      }
    }
    throw new Error('Não deu para reduzir essa imagem o bastante. Tente outra.')
  } catch (e) {
    throw e instanceof Error && e.message.startsWith('Não deu') ? e : new Error('Não foi possível abrir essa imagem. Tente outra (JPEG, PNG ou WebP).')
  } finally {
    URL.revokeObjectURL(src)
  }
}

export function ParedeCorp({ m, agir }: { m: MinhaCorp; agir: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const atual = m.papel
  const proprio = atual?.tipo === 'imagem'
  const padrao = atual?.tipo === 'padrao' ? atual.id : null
  const selo = <b className="co-pp-selo">Na parede</b>

  const poe = async (chave: string, body: Record<string, unknown>, aviso: string) => {
    setOcupado(chave)
    setErro(null)
    setOk(null)
    try {
      await agir({ action: 'papel.definir', ...body })
      playSfx('confirm')
      setOk(aviso)
    } catch (e) {
      playSfx('error')
      setErro(erroTexto(e, 'Não foi possível trocar o papel de parede.'))
    } finally {
      setOcupado(null)
    }
  }
  const arquivo = async (ev: ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type) || f.size > 30_000_000) return setErro('Escolha uma imagem (JPEG, PNG ou WebP) de até 30 MB.')
    setOcupado('arquivo')
    setErro(null)
    setOk(null)
    let url: string
    try {
      url = await reduz(f)
    } catch (e) {
      setOcupado(null)
      return setErro(erroTexto(e))
    }
    await poe('arquivo', { papel: 'imagem', imagem: url }, 'A imagem do aparelho está na parede.')
  }

  const fundoProprio = proprio ? ({ backgroundImage: `url('${papelSrc(atual)}')` } as CSSProperties) : undefined
  return (
    <>
      <header className="s-cab">
        <h4>Papel de parede</h4>
        <small>Fica atrás do chat, na parede do salão e no fundo do sistema de todos os membros.</small>
      </header>
      <section className="co-papel fundo" aria-busy={!!ocupado}>
        <div className="co-pp-grade" role="radiogroup" aria-label="Papéis de parede">
          <label className={'co-pp co-pp-envia' + (proprio ? ' sel' : '')} style={fundoProprio}>
            {proprio && selo}
            <input type="file" accept="image/*" disabled={!!ocupado} onChange={(e) => void arquivo(e)} />
            <span>{ocupado === 'arquivo' ? 'Enviando a imagem…' : proprio ? 'Trocar a imagem do aparelho' : 'Escolher do aparelho'}</span>
          </label>
          {CORP_PAPEIS.map(([id, nome]) => (
            <button
              key={id}
              type="button"
              className="co-pp"
              role="radio"
              aria-checked={padrao === id}
              disabled={!!ocupado}
              style={{ backgroundImage: `url('/v2/art/os/papeis/${id}.webp?v=1')` }}
              onClick={() => padrao !== id && void poe(id, { papel: id }, `${nome} está na parede.`)}
            >
              {padrao === id && selo}
              <span>{nome}</span>
            </button>
          ))}
          <button type="button" className="co-pp co-pp-sis" role="radio" aria-checked={!atual} disabled={!!ocupado} onClick={() => atual && void poe('sistema', { papel: null }, 'Voltou o fundo do sistema.')}>
            {!atual && selo}
            <span>Fundo do sistema</span>
          </button>
        </div>
        {erro && (
          <p className="r-erro" role="alert">
            {erro}
          </p>
        )}
        {ok && (
          <p className="s-ok fundo" role="status">
            {ok}
          </p>
        )}
        <p className="r-sub">Imagens escuras e calmas funcionam melhor atrás das janelas.</p>
      </section>
    </>
  )
}
