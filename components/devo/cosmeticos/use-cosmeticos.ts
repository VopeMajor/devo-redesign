'use client'

import { useMemo, useSyncExternalStore } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { type CosmeticoDef, type CosSlot, type MeusCosmeticos, type Visual, VISUAL_VAZIO } from '@/lib/devo/cosmeticos'

/* ── Preferência de animação (Ajustes) + prefers-reduced-motion ── */

const PREF_KEY = 'devo.cosmeticos.animar'
const PREF_EVENT = 'devo:cosmeticos-animar'

function lerPref(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) !== '0'
  } catch {
    return true
  }
}

function reduzido(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function assinar(cb: () => void) {
  window.addEventListener(PREF_EVENT, cb)
  window.addEventListener('storage', cb)
  let mq: MediaQueryList | null = null
  try {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', cb)
  } catch {}
  return () => {
    window.removeEventListener(PREF_EVENT, cb)
    window.removeEventListener('storage', cb)
    mq?.removeEventListener('change', cb)
  }
}

/** Preferência salva em Ajustes (true = animações dos cosméticos ligadas). */
export function useAnimacaoPreferida(): boolean {
  return useSyncExternalStore(assinar, lerPref, () => true)
}

export function setAnimacaoPreferida(on: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, on ? '1' : '0')
  } catch {}
  window.dispatchEvent(new Event(PREF_EVENT))
}

/** As animações podem rodar agora? (Ajustes ligado e sem movimento reduzido no sistema.) */
export function useAnimarCosmeticos(): boolean {
  const pref = useAnimacaoPreferida()
  const red = useSyncExternalStore(assinar, reduzido, () => false)
  return pref && !red
}

/* ── Dados ── */

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as { error?: string }).error ?? 'Falha ao carregar cosméticos.')
  return data as T
}

const KEY_CATALOGO = '/api/cosmeticos?view=catalogo'
const KEY_MEUS = '/api/cosmeticos'

/** Catálogo público (ativos), indexado pela chave. Uma requisição por sessão de tela (cache SWR). */
export function useCatalogo() {
  const { data, error } = useSWR<{ catalogo: CosmeticoDef[] }>(KEY_CATALOGO, getJson, { revalidateOnFocus: false, dedupingInterval: 60_000 })
  const mapa = useMemo(() => new Map((data?.catalogo ?? []).map((c) => [c.key, c])), [data])
  return { mapa, lista: data?.catalogo ?? [], carregando: !data && !error, error: error as Error | undefined }
}

/** Coleção do próprio jogador (possuídos, equipados, catálogo completo para silhuetas). */
export function useMeusCosmeticos() {
  return useSWR<MeusCosmeticos>(KEY_MEUS, getJson, { revalidateOnFocus: true })
}

/**
 * Aparência pública de vários jogadores de uma vez (chat, ranking, listas). Atualiza sozinha a cada 30 s e
 * na hora em que o próprio jogador troca algo (equipar() invalida todas as chaves /api/cosmeticos…).
 */
export function useVisuais(ids: (string | null | undefined)[]) {
  const lista = useMemo(() => [...new Set(ids.filter((x): x is string => !!x && /^[0-9a-f-]{36}$/i.test(x)))].sort(), [ids])
  const key = lista.length ? `/api/cosmeticos?view=visuais&ids=${lista.slice(0, 80).join(',')}` : null
  const { data } = useSWR<{ visuais: Visual[] }>(key, getJson, { refreshInterval: 30_000, revalidateOnFocus: true, dedupingInterval: 4_000, keepPreviousData: true })
  return useMemo(() => {
    const m = new Map<string, Visual>()
    for (const v of data?.visuais ?? []) m.set(v.id, v)
    return (id: string | null | undefined): Visual | null => (id ? (m.get(id) ?? (key ? VISUAL_VAZIO(id) : null)) : null)
  }, [data, key])
}

export function useVisual(id: string | null | undefined) {
  const get = useVisuais([id])
  return get(id)
}

/** Avisa todas as telas abertas que a aparência mudou (perfil, miniperfil, chat, ranking). */
export async function revalidarCosmeticos() {
  await globalMutate((k) => typeof k === 'string' && k.startsWith('/api/cosmeticos'))
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/cosmeticos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as { error?: string }).error ?? 'Não foi possível concluir.')
  return data as T
}

/** Equipa (ou tira, com `key = null`) um cosmético no espaço indicado. O servidor confere a posse. */
export async function equipar(slot: CosSlot, key: string | null) {
  await post({ action: 'equipar', slot, key })
  await revalidarCosmeticos()
}

export const cosPost = post
