/**
 * Arte dos Arcanos (personificações pintadas; entrega do agente de arte em infra/arte 8f72fb2).
 * Por Arcano: `public/images/arcanos/<key>/{figura,retrato,sigilo}-<lado>.webp` (+ arte.json), onde `<lado>` é o
 * MAIOR lado da imagem em px. Comum: `public/images/arcanos/comum/{moldura,orbital,altar}-<lado>.webp` (+ json).
 *
 * Registro ESTÁTICO de propósito: a tela não sai procurando arquivo (dezenas de 404 no celular). O que não estiver
 * listado cai no placeholder desenhado (sigilo + moldura SVG); se um arquivo listado falhar, também.
 */
import { ARCANO_KEYS, type ArcanoKey } from './virtudes'

export type ArteTipo = 'figura' | 'retrato' | 'sigilo'
export type ArteArcano = Partial<Record<ArteTipo, number[]>>

const TODOS: ArteArcano = { figura: [768, 1024, 1536], retrato: [256, 512, 1024], sigilo: [64, 128, 256] }
export const ARCANOS_ARTE: Partial<Record<ArcanoKey, ArteArcano>> = Object.fromEntries(ARCANO_KEYS.map((k) => [k, TODOS]))

/** Largura ÷ maior lado de cada tipo (para o `w` do srcset ser a largura de verdade). */
const LARGURA: Record<ArteTipo | Comum, number> = { figura: 2 / 3, retrato: 3 / 4, sigilo: 1, moldura: 3 / 4, orbital: 1, altar: 2 / 3 }

function conjunto(base: string, lados: number[] | undefined, fator: number) {
  if (!lados?.length) return null
  const ord = [...lados].sort((a, b) => a - b)
  const url = (l: number) => `${base}-${l}.webp`
  return { src: url(ord[0]), srcSet: ord.map((l) => `${url(l)} ${Math.round(l * fator)}w`).join(', '), maior: url(ord[ord.length - 1]), menor: url(ord[0]) }
}

/** `src` (o menor), `srcSet` (larguras reais) de uma arte do Arcano, ou null para usar o placeholder. */
export function arteDe(key: ArcanoKey, tipo: ArteTipo) {
  return conjunto(`/images/arcanos/${key}/${tipo}`, ARCANOS_ARTE[key]?.[tipo], LARGURA[tipo])
}

/** Figura inteira 1024×1536 com alfa, mesma escala para todos: pés em y = 0,9766, figura com 0,9115 da altura. */
export const FIGURA = { pesY: 0.9766, altura: 0.9115, proporcao: 2 / 3 } as const

/* ------------------------------------------------------------------ peças comuns */

type Comum = 'moldura' | 'orbital' | 'altar'
const COMUM_LADOS: Record<Comum, number[]> = {
  moldura: [256, 512, 768, 1024],
  orbital: [768, 1024, 1536],
  altar: [512, 768, 1024, 1536],
}
export function comum(tipo: Comum) {
  return conjunto(`/images/arcanos/comum/${tipo}`, COMUM_LADOS[tipo], LARGURA[tipo])
}

/** Moldura 768×1024 com alfa, arco aberto; janela (x, y, largura, altura em fração) de moldura.json. */
export const MOLDURA = { proporcao: 3 / 4, janela: { x: 0.2656, y: 0.208, w: 0.4674, h: 0.623 } } as const
/** Altar 1024×1536 opaco; tampo do pedestal (centro e largura em fração) de altar.json. */
export const ALTAR = { proporcao: 2 / 3, pedestal: { x: 0.5, y: 0.618, largura: 0.233 }, rosacea: { x: 0.5, y: 0.29 } } as const

/** Compatibilidade com a v3 (moldura pintada vazia). */
export function molduraArte() {
  return comum('moldura')
}
