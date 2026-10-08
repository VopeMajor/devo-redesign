'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { GameProps } from '@/lib/devo/arcade/client'
import type { GameId } from '@/lib/devo/arcade/games'

function Loading() {
  return (
    <div className="grid h-full place-items-center bg-[#090b0f]">
      <p className="animate-pulse font-mono text-xs uppercase tracking-[0.4em] text-foreground/50">Preparando a mesa…</p>
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
