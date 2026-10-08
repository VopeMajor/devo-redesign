'use client'

import { createContext, useContext } from 'react'
import type { AppId } from '@/lib/devo/types'

export type OsNav = {
  open: (id: AppId) => void
  layout: 'desktop' | 'phone'
  exitToLanding: () => void
  restart: () => void
}

export const OsNavContext = createContext<OsNav | null>(null)

export function useOsNav() {
  const ctx = useContext(OsNavContext)
  if (!ctx) throw new Error('useOsNav deve ser usado dentro de um shell do DEVO')
  return ctx
}
