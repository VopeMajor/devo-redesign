'use client'

import { useEffect, useRef, useState } from 'react'
import type { Aparencia } from '@/lib/devo/casa-aparencia'
import type { CatedralPayload, OferendaId, RitualResultado } from '@/lib/devo/catedral'
import { criaCatedral } from './catedral'
import './catedral.css'

/**
 * Catedral de Damasco no jogo (DEVO v2): abre pelo "Sair de casa" da Casa e ocupa a tela inteira, por cima dela.
 * Dono, 09/11: "trazer a catedral e todo o conteudo gerado". Servidor em /api/catedral (descoberta, Karma de Caos,
 * oferendas do inventário e o sorteio dos rituais).
 */

const URL_API = '/api/catedral'
async function post<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch(URL_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.ok) throw new Error(j?.error ?? 'A Catedral não respondeu. Tente de novo.')
  return j as T
}
const idem = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36)

export type CatedralControle = { voltar(): boolean }

export function CatedralV2({
  aparencia,
  onSair,
  onDescoberta,
  controle,
}: {
  aparencia: Aparencia | null
  onSair: () => void
  onDescoberta?: () => void
  controle?: React.MutableRefObject<CatedralControle | null>
}) {
  const raiz = useRef<HTMLDivElement>(null)
  const [dados, setDados] = useState<CatedralPayload | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const cb = useRef({ onSair, onDescoberta })
  cb.current = { onSair, onDescoberta }

  useEffect(() => {
    let vivo = true
    setErro(null)
    fetch(URL_API, { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json().catch(() => null)
        if (!r.ok) throw new Error(j?.error ?? 'A Catedral não respondeu.')
        if (vivo) setDados(j as CatedralPayload)
      })
      .catch((e: Error) => vivo && setErro(e.message))
    return () => {
      vivo = false
    }
  }, [tentativa])

  const pronto = dados?.liberado ? dados : null
  useEffect(() => {
    if (!pronto || !raiz.current) return
    const m = criaCatedral(raiz.current, {
      aparencia,
      descoberta: pronto.descoberta,
      oferendas: pronto.oferendas,
      equipe: pronto.equipe,
      onPrimeiraFim: async (fim, escolhas) => {
        try {
          const r = await post<{ descoberta: boolean; oferendas: Record<OferendaId, number> }>({ action: 'visita.fim', fim, escolhas })
          if (r.descoberta) cb.current.onDescoberta?.()
          return { oferendas: r.oferendas }
        } catch {
          return null
        }
      },
      onRitual: (oferenda, forca) => post<RitualResultado & { ok: true }>({ action: 'ritual', oferenda, idem: idem(), ...(forca !== null ? { forca } : {}) }),
      onSair: () => cb.current.onSair(),
    })
    if (controle) controle.current = m
    return () => {
      if (controle) controle.current = null
      m.destroi()
    }
    // a Catedral nasce uma vez por visita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  return (
    <section className="cat" role="dialog" aria-label="Catedral de Damasco">
      <div ref={raiz} className="cat-raiz" hidden={!pronto} />
      {!pronto && (
        <div className="cv-tranca">
          <section role={erro || dados ? 'alert' : 'status'}>
            <h2>{erro ? 'A Catedral não respondeu' : dados && !dados.liberado ? 'Caminho fechado' : 'A caminho da Catedral…'}</h2>
            {erro && <p>{erro}</p>}
            {dados && !dados.liberado && <p>{dados.motivo}</p>}
            {erro && (
              <button onClick={() => setTentativa((n) => n + 1)} style={{ marginBottom: 10 }}>
                Tentar de novo
              </button>
            )}
            <button onClick={onSair}>Voltar para casa</button>
          </section>
        </div>
      )}
    </section>
  )
}
