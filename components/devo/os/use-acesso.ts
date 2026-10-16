'use client'

import { useEffect, useState } from 'react'
import type { Acesso } from '@/lib/devo/progresso'

/**
 * Acesso efetivo do jogador vindo do servidor (`GET /api/eu` → `acesso`, FUNDACAO.md §3). A interface só
 * reflete: quem decide é `unlocks()` no servidor. Uma leitura por sessão de página, compartilhada entre as
 * telas; `refreshAcesso()` (ou o evento `devo:acesso`) lê de novo, por exemplo depois de vencer o tutorial.
 */
let cache: Acesso | null = null
let inflight: Promise<Acesso | null> | null = null
const subs = new Set<(a: Acesso | null) => void>()

function load(force = false) {
  if (inflight && !force) return inflight
  inflight = fetch('/api/eu', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { acesso?: Acesso } | null) => {
      cache = j?.acesso ?? null
      subs.forEach((f) => f(cache))
      return cache
    })
    .catch(() => null)
  return inflight
}

export function refreshAcesso() {
  return load(true)
}

export function useAcesso(): Acesso | null {
  const [a, setA] = useState<Acesso | null>(cache)
  useEffect(() => {
    subs.add(setA)
    if (!cache) load()
    const onEvt = () => load(true)
    window.addEventListener('devo:acesso', onEvt)
    return () => {
      subs.delete(setA)
      window.removeEventListener('devo:acesso', onEvt)
    }
  }, [])
  return a
}
