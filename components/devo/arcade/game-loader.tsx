'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { GameProps } from '@/lib/devo/arcade/client'
import type { GameId } from '@/lib/devo/arcade/games'
import { Spinner } from '../kit'

function Loading() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-dv-ink">
      <span aria-hidden="true" className="dv-checker absolute inset-x-[-40%] bottom-[-20%] h-[60%] opacity-60 [mask-image:linear-gradient(to_top,black,transparent)] [transform:perspective(500px)_rotateX(60deg)]" />
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-2/3 w-72 -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(236,212,154,0.18),transparent_70%)]" />
      <div className="relative flex flex-col items-center gap-4 text-dv-gold" role="status">
        <Spinner className="size-10" />
        <p className="dv-label text-[11px] text-dv-text-2">Preparando a mesa…</p>
      </div>
    </div>
  )
}

/** Cada jogo é carregado sob demanda: o motor 3D só baixa quando alguém joga. */
export const GAME_COMPONENTS: Record<GameId, ComponentType<GameProps>> = {
  'memory-rush': dynamic(() => import('./games/memory-rush'), { ssr: false, loading: Loading }),
  chess: dynamic(() => import('./games/quick-chess'), { ssr: false, loading: Loading }),
  'hot-bomb': dynamic(() => import('./games/hot-bomb'), { ssr: false, loading: Loading }),
  bluff: dynamic(() => import('./games/bluff'), { ssr: false, loading: Loading }),
}
