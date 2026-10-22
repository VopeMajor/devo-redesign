'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import type { AnunciosPayload } from '@/lib/devo/anuncios'
import type { AppId } from '@/lib/devo/types'
import { cn } from '@/lib/utils'
import { FrameCorners } from '../kit/frame'
import { GlyphArrow } from '../kit/glyphs'
import { Kicker } from '../kit/typography'
import { MarbleSlab } from './shell-ui'

export const ANUNCIOS_KEY = '/api/anuncios'

async function get(url: string): Promise<AnunciosPayload> {
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error(j?.error ?? 'Os anúncios não responderam.')
  return j as AnunciosPayload
}

export function useAnuncios() {
  return useSWR<AnunciosPayload>(ANUNCIOS_KEY, get, { revalidateOnFocus: false, refreshInterval: 10 * 60_000 })
}

const GIRO_MS = 7000

/**
 * Quadro de anúncios rápidos da home (no lugar do segundo relógio: o Tempo fica só na barra de cima).
 * Passa sozinho de um anúncio para o outro (parado com movimento reduzido); toque abre o app do anúncio.
 * O relógio do giro vive só aqui, sem re-renderizar a home.
 */
export function AnunciosCard({ onOpen }: { onOpen: (id: AppId) => void }) {
  const { data } = useAnuncios()
  const lista = data?.anuncios ?? []
  const [i, setI] = useState(0)
  const n = lista.length
  useEffect(() => {
    if (n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setI((x) => (x + 1) % n), GIRO_MS)
    return () => window.clearInterval(id)
  }, [n])
  const a = n ? lista[i % n] : null

  const corpo = (
    <MarbleSlab edge="amethyst" cut={16} glow innerClassName="relative flex min-h-[148px] flex-col justify-between gap-3 overflow-hidden py-4 pl-5 pr-4">
      <FrameCorners tone="gold" />
      {a?.arte && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-cover bg-center opacity-35 [mask-image:linear-gradient(90deg,transparent,#000_60%)]" style={{ backgroundImage: `url(${a.arte})` }} />
      )}
      <span className="relative flex items-center justify-between gap-3">
        <Kicker tone="gold">{a ? a.kicker : 'Anúncios'}</Kicker>
        {n > 1 && (
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {lista.map((x, k) => (
              <span key={x.id} className={cn('size-1.5 rotate-45 transition-colors', k === i % n ? 'bg-dv-amethyst shadow-[0_0_6px_var(--dv-amethyst)]' : 'bg-dv-text-3/50')} />
            ))}
          </span>
        )}
      </span>
      <span key={a?.id ?? 'vazio'} className="relative block animate-dv-fade" aria-live="polite">
        <span className="block font-display text-[22px] font-semibold uppercase leading-tight tracking-[0.05em] text-dv-text">{a ? a.titulo : 'Nada de novo por enquanto'}</span>
        <span className="mt-1.5 line-clamp-2 block font-body text-[15px] leading-snug text-dv-text-2">{a ? a.texto : 'Eventos e avisos da casa aparecem aqui.'}</span>
      </span>
      {a?.app && (
        <span className="dv-label relative flex items-center gap-1 self-end text-[10px] text-dv-text-3 transition-colors group-hover:text-dv-text-2">
          Ver <GlyphArrow className="size-3" />
        </span>
      )}
    </MarbleSlab>
  )

  if (!a?.app) return <div aria-label="Anúncios">{corpo}</div>
  return (
    <button
      type="button"
      onClick={() => a.app && onOpen(a.app)}
      aria-label={`Anúncio: ${a.titulo}. ${a.texto}`}
      className="dv-focus group block w-full text-left transition-transform duration-[120ms] active:scale-[0.985]"
    >
      {corpo}
    </button>
  )
}
