'use client'

import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playSfx } from '@/lib/devo/audio'
import type { HoloFase, Passo } from '@/lib/devo/dialogo/formato'
import { getCena } from '@/lib/devo/dialogo/registro'
import { escolher } from '@/components/devo/dialogo/cliente'
import { useDevo } from '@/components/devo/state/devo-store'
import { usePlayerText } from '@/components/devo/state/player-text'
import { useBackHandler } from '@/components/devo/use-back-handler'
import { corpArte } from './corporacoes-brasao'

/**
 * A chamada holográfica da Melissa sobre as Corporações (protótipo kit3/os-corp.js › chamada(), aprovado pelo dono):
 * o celular projeta a Melissa por cima da janela da Corporação. O texto é o LITERAL da cena do jogo
 * (lib/devo/dialogo/cenas/melissa-corporacoes.ts, com as expressões de lá); a escolha da Necro-Corporação tira o
 * Tempo pelo servidor (/api/dialogo, uma vez só) quando a cena ainda não foi vista.
 */

export const CENA_CORP = 'melissa-corporacoes'

type Linha = { tipo: 'texto'; narr: boolean; texto: string; pose?: string; holo?: HoloFase }
type Escolha = { tipo: 'escolha'; id: string; opcoes: { texto: string; respostas: Linha[] }[] }
type Item = Linha | Escolha
type Meta = Record<string, { pisca?: boolean; boca?: boolean }>

let META: Meta | null = null
const lerMeta = () =>
  META
    ? Promise.resolve(META)
    : fetch('/v2/art/anim.json')
        .then((r) => r.json() as Promise<Meta>)
        .then((m) => (META = m))
        .catch(() => ({}) as Meta)

const POSES = ['sorriso', 'explica', 'pensativo', 'preocupado', 'apresenta', 'convite', 'confiante', 'surpreso', 'riso', 'triste']
const sprite = (p: string) => `/v2/art/melissa-q-${p}.png`

function linha(p: Passo): Linha | null {
  if (p.tipo === 'narra' || p.tipo === 'pensa') return { tipo: 'texto', narr: true, texto: p.texto, holo: p.palco?.holo ?? undefined }
  if (p.tipo === 'fala') return { tipo: 'texto', narr: false, texto: p.texto, pose: p.expressao ?? p.palco?.expressao, holo: p.palco?.holo ?? undefined }
  return null
}
function roteiro(): Item[] {
  const cena = getCena(CENA_CORP)
  if (!cena) return []
  return cena.passos.flatMap<Item>((p) => {
    if (p.tipo === 'escolha')
      return [{ tipo: 'escolha', id: p.id, opcoes: p.opcoes.map((o) => ({ texto: o.texto, respostas: (o.respostas ?? []).map(linha).filter((x): x is Linha => !!x) })) }]
    const l = linha(p)
    return l ? [l] : []
  })
}

const puro = (t: string) => t.replace(/\*/g, '')
/** *ênfase* em negrito, cortado em `ate` letras (a máquina de escrever). */
function marca(t: string, ate = Infinity): ReactNode[] {
  const out: ReactNode[] = []
  let resta = ate
  t.split('*').forEach((p, i) => {
    if (resta <= 0 || !p) return
    const x = p.slice(0, resta)
    resta -= x.length
    out.push(i % 2 ? <strong key={i}>{x}</strong> : x)
  })
  return out
}

export function ChamadaMelissa({ jan, pode, registrar, onFim }: { jan: Element; pode: boolean; registrar: boolean; onFim: (concluiu: boolean) => void }) {
  const { dispatch } = useDevo()
  const pt = usePlayerText()
  const raiz = useRef<HTMLDivElement>(null)
  const [fila, setFila] = useState<Item[]>(roteiro)
  const [meta, setMeta] = useState<Meta>(() => META ?? {})
  const [pose, setPose] = useState<string | null>(null)
  const [fig, setFig] = useState<'' | 'entra' | 'sai' | null>(null)
  const [txt, setTxt] = useState<Linha | null>(null)
  const [k, setK] = useState(0)
  const [boca, setBoca] = useState(false)
  const [pisca, setPisca] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const rapido = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const atual = fila[0]
  const texto = txt ? pt(txt.texto) : ''
  const total = puro(texto).length
  const escrevendo = k < total

  useEffect(() => {
    void lerMeta().then(setMeta)
    // as poses já ficam prontas: a figura não pode aparecer atrasada
    for (const p of POSES) new Image().src = sprite(p)
    raiz.current?.focus({ preventScroll: true })
    playSfx('open')
  }, [])

  // cada passo de texto: palco do holograma, expressão e a máquina de escrever
  useEffect(() => {
    if (!atual || atual.tipo !== 'texto') return
    if (atual.holo === 'materializa') {
      setFig('entra')
      setPose((p) => p ?? 'sorriso')
    }
    if (atual.holo === 'encerra') setFig((f) => (f === null ? f : 'sai'))
    if (atual.pose) setPose(atual.pose)
    setTxt(atual)
    setK(rapido ? Infinity : 0)
  }, [atual, rapido])

  useEffect(() => {
    if (!escrevendo || rapido) {
      setBoca(false)
      return
    }
    const t = window.setInterval(() => setK((n) => n + 1), 24)
    const falaBoca = txt && !txt.narr && pose && meta[pose]?.boca
    const b = falaBoca ? window.setInterval(() => setBoca((x) => !x), 110) : 0
    return () => {
      window.clearInterval(t)
      if (b) window.clearInterval(b)
      setBoca(false)
    }
  }, [escrevendo, rapido, txt, pose, meta])

  // piscadas calmas
  useEffect(() => {
    if (rapido || !pose || !meta[pose]?.pisca || fig === null) return
    let t = 0
    let fecha = 0
    const vez = () => {
      t = window.setTimeout(() => {
        setPisca(true)
        fecha = window.setTimeout(() => setPisca(false), 110)
        vez()
      }, 2200 + Math.random() * 2800)
    }
    vez()
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(fecha)
      setPisca(false)
    }
  }, [rapido, pose, meta, fig])

  const fim = useCallback(
    (concluiu: boolean) => {
      playSfx('close')
      onFim(concluiu)
    },
    [onFim],
  )

  const avancar = useCallback(() => {
    if (!atual || ocupado || atual.tipo === 'escolha') return
    if (escrevendo) return setK(Infinity)
    playSfx('click')
    if (fila.length <= 1) return fim(true)
    setFila(fila.slice(1))
  }, [atual, ocupado, escrevendo, fila, fim])

  const escolhe = async (e: Escolha, i: number) => {
    if (ocupado) return
    playSfx('confirm')
    let n = i
    if (registrar) {
      setOcupado(true)
      try {
        const r = await escolher(CENA_CORP, e.id, i)
        n = r.opcao ?? i
        if (r.timeDeltaMs) dispatch({ type: 'ADD_TIME', ms: r.timeDeltaMs })
        for (const npc of r.contatos) dispatch({ type: 'ADD_CONTACT', npcId: npc })
        if (r.aplicados.some((x) => x.tipo === 'flag')) window.dispatchEvent(new Event('devo:acesso'))
      } catch {
        /* sem conexão: a chamada segue; o servidor registra a escolha numa próxima vez */
      } finally {
        setOcupado(false)
      }
    }
    const resto = [...(e.opcoes[n]?.respostas ?? []), ...fila.slice(1)]
    if (!resto.length) return fim(true)
    setFila(resto)
  }

  useBackHandler(true, () => {
    if (pode) fim(false)
  })

  const m = pose ? meta[pose] : undefined
  return createPortal(
    <div
      ref={raiz}
      className="k-cena co-holo"
      role="dialog"
      aria-label="Chamada da Melissa"
      tabIndex={-1}
      onClick={(ev) => {
        if ((ev.target as HTMLElement).closest('.k-pula, .co-ops-h')) return
        avancar()
      }}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          if ((ev.target as HTMLElement).closest('button')) return
          ev.preventDefault()
          avancar()
        } else if (ev.key === 'Escape' && pode) fim(false)
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="co-h-fundo" src={corpArte('chamada')} alt="" />
      {pode && (
        <button type="button" className="k-pula chanfro" onClick={() => fim(false)}>
          Pular
        </button>
      )}
      {txt && (
        <div className={'k-balao' + (txt.narr ? ' narr' : '') + (puro(texto).length > 190 ? ' longo' : '')}>
          <b hidden={txt.narr}>Melissa</b>
          <p aria-live="polite">{marca(texto, k)}</p>
          <i aria-hidden="true" hidden={escrevendo || atual?.tipo === 'escolha'} />
        </div>
      )}
      <div className={'co-h-fig k-fig' + (fig ? ` ${fig}` : '')} hidden={fig === null || !pose} style={pose ? ({ '--sprite': `url(${sprite(pose)})` } as CSSProperties) : undefined}>
        {pose && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="b" src={sprite(pose)} alt="Melissa, em holograma" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m?.pisca && <img className="c p" src={`/v2/art/anim/${pose}-pisca.png`} alt="" hidden={!pisca} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m?.boca && <img className="c m" src={`/v2/art/anim/${pose}-boca.png`} alt="" hidden={!boca} />}
          </>
        )}
      </div>
      {atual?.tipo === 'escolha' && (
        <div className="co-ops-h" role="group" aria-label="Sua resposta">
          {atual.opcoes.map((o, i) => (
            <button key={o.texto} type="button" className="chanfro" disabled={ocupado} onClick={() => void escolhe(atual, i)}>
              {pt(o.texto)}
            </button>
          ))}
        </div>
      )}
    </div>,
    jan,
  )
}
