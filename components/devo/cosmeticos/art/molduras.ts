/**
 * Coleção de molduras (texto do dono §3; rodada 2 de acabamento — POCO-REFORMULACAO-dono.md). Cada moldura tem
 * dois formatos com a mesma identidade e um desenho próprio para o mini (16–48 px, sem detalhe fino):
 *   avatar  viewBox 0 0 300 400 — janela da foto (30,40)–(270,360), retrato 3:4 do Record
 *   mini    viewBox 0 0 120 120 — janela da foto (20,20)–(100,100), quadrada (chat, ranking, listas)
 * Materiais em ./material.ts; cada moldura em ./moldura/<nome>.ts.
 */
import { ARCANO } from './moldura/arcano'
import { BADALADA } from './moldura/badalada'
import type { MolduraArte } from './moldura/base'
import { CORUJA } from './moldura/coruja'
import { HERANCA } from './moldura/heranca'
import { JAVALI } from './moldura/javali'
import { PACTO } from './moldura/pacto'
import { RATO } from './moldura/rato'
import { RELOGIO } from './moldura/relogio'

export type { MolduraArte }

export const MOLDURAS: Record<string, MolduraArte> = {
  'heranca-marfim': HERANCA,
  'relogio-fim': RELOGIO,
  'pacto-carmesim': PACTO,
  'olho-arcano': ARCANO,
  'banquete-javali': JAVALI,
  'asas-coruja': CORUJA,
  'fortuna-rato': RATO,
  'ultima-badalada': BADALADA,
}
