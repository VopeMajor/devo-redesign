'use client'

import type { CenaEstado, EfeitoAplicado } from '@/lib/devo/dialogo/formato'

/** Chamadas do cliente para /api/dialogo (contrato em docs/redesign/DIALOGO.md). */
async function post<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/dialogo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: body.action === 'passo' })
  const j = (await r.json().catch(() => null)) as (T & { ok?: boolean; error?: string }) | null
  if (!r.ok || !j || j.ok === false) throw new Error(j?.error ?? 'Falha no diálogo.')
  return j
}

export async function lerCena(cena: string): Promise<CenaEstado> {
  const r = await fetch(`/api/dialogo?cena=${encodeURIComponent(cena)}`, { cache: 'no-store' })
  const j = (await r.json().catch(() => null)) as (CenaEstado & { error?: string }) | null
  if (!r.ok || !j || !('progresso' in j)) throw new Error(j?.error ?? 'Falha ao abrir a cena.')
  return j
}

export type Resumo = { cenas: Record<string, { passo: number; fim: boolean }>; disponiveis: string[]; config: { galoExplorarMin: number } }

export async function lerResumo(): Promise<Resumo | null> {
  const r = await fetch('/api/dialogo', { cache: 'no-store' }).catch(() => null)
  if (!r?.ok) return null
  const j = (await r.json().catch(() => null)) as Partial<Resumo> | null
  return { cenas: j?.cenas ?? {}, disponiveis: Array.isArray(j?.disponiveis) ? j.disponiveis : [], config: { galoExplorarMin: j?.config?.galoExplorarMin ?? 2 } }
}

export const salvarPasso = (cena: string, passo: number) => post<{ ok: true }>({ action: 'passo', cena, passo }).catch(() => null)
export const escolher = (cena: string, escolha: string, opcao: number) => post<EfeitoAplicado>({ action: 'escolher', cena, escolha, opcao })
export const aplicarEfeito = (cena: string, efeito: string) => post<EfeitoAplicado>({ action: 'efeito', cena, efeito })
export const concluirCena = (cena: string) => post<EfeitoAplicado>({ action: 'concluir', cena })
