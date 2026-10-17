/**
 * Arte dos Arcanos (personificações pintadas). Entrega do agente de arte em
 * `public/images/arcanos/<key>/{figura,retrato,sigilo}-<lado>.webp` (+ json), onde `<lado>` é o maior lado da
 * imagem em px (ex.: `retrato-512.webp`, `retrato-1024.webp`).
 *
 * Registro ESTÁTICO de propósito: a tela não sai procurando arquivo (22 Arcanos × 3 tipos dariam dezenas de 404
 * no celular). Quando a arte chegar, liste aqui os lados entregues; o que não estiver listado cai no placeholder
 * (sigilo + moldura). Se um arquivo listado falhar ao carregar, a tela também volta ao placeholder.
 *
 *   morte: { retrato: [512, 1024], figura: [768, 1536] },
 */
import type { ArcanoKey } from './virtudes'

export type ArteTipo = 'figura' | 'retrato' | 'sigilo'
export type ArteArcano = Partial<Record<ArteTipo, number[]>>

export const ARCANOS_ARTE: Partial<Record<ArcanoKey, ArteArcano>> = {
  // (vazio: arte em produção)
}

/** `src` (o menor lado) e `srcSet` (todos os lados) de uma arte, ou null para usar o placeholder. */
export function arteDe(key: ArcanoKey, tipo: ArteTipo): { src: string; srcSet: string } | null {
  const lados = ARCANOS_ARTE[key]?.[tipo]
  if (!lados?.length) return null
  const ord = [...lados].sort((a, b) => a - b)
  const url = (l: number) => `/images/arcanos/${key}/${tipo}-${l}.webp`
  return { src: url(ord[0]), srcSet: ord.map((l) => `${url(l)} ${l}w`).join(', ') }
}
