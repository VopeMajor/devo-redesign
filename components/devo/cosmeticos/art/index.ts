/**
 * Registro das artes dos cosméticos: `meta.asset = 'devo:<grupo>/<id>'` aponta para cá.
 *   devo:moldura/<id>  (formato decidido pela categoria: moldura_avatar → avatar, moldura_mini → mini)
 *   devo:emblema/<id>  devo:balao/<id>  devo:efeito/<id>
 */
import { BALOES, type Balao } from './baloes'
import { EMBLEMAS as EMBLEMAS_BASE } from './emblemas'
import type { Arte } from './kit'
import { MOLDURAS, type MolduraArte } from './molduras'

export type { Arte, Balao, MolduraArte }
export { BALOES, MOLDURAS }

/**
 * Emblemas com sombra de contato (a própria silhueta em negro, deslocada — sem blur): o símbolo "assenta"
 * sobre o fundo e ganha volume mesmo a 16 px.
 */
export const EMBLEMAS: Record<string, Arte> = Object.fromEntries(
  Object.entries(EMBLEMAS_BASE).map(([k, a]) => [
    k,
    { vb: a.vb, corpo: (u: string) => `<g transform="translate(.7 1.1)" opacity=".5" style="filter:brightness(0)">${a.corpo(`${u}s`)}</g>${a.corpo(u)}` },
  ]),
)

export type EfeitoNome = { classe: string }

/** Efeitos do nome (categoria `efeito`): classes CSS em ../cosmeticos.css. */
export const EFEITOS: Record<string, EfeitoNome> = {
  'assinatura-noturna': { classe: 'cos-ef-noturna' },
  'brasa-carmesim': { classe: 'cos-ef-brasa' },
  'geada-prata': { classe: 'cos-ef-geada' },
}

export function parseAsset(asset: string): { grupo: string; id: string } | null {
  const m = /^devo:([a-z]+)\/([a-z0-9-]+)$/.exec(asset)
  return m ? { grupo: m[1], id: m[2] } : null
}

/**
 * Arte pintada (raster WebP transparente, gerada por scripts/arte/*.py — nova direção dos cosméticos).
 *   sangria: fração da caixa que a arte ultrapassa em cada lado (asas e correntes saem da moldura)
 *   janela:  recorte da foto por baixo da moldura (a foto em si não é alterada)
 */
export type MolduraRaster = { src: string; sangria: number; janela: 'oval' | 'circulo' | 'retangulo' }
export const RASTER_MOLDURAS: Record<string, { avatar: MolduraRaster; mini: MolduraRaster }> = {
  'asas-crepusculo': {
    avatar: { src: '/images/cosmeticos/previa/asas-crepusculo-avatar.webp', sangria: 0.1, janela: 'oval' },
    mini: { src: '/images/cosmeticos/previa/asas-crepusculo-mini.webp', sangria: 0.1, janela: 'circulo' },
  },
}

/** Emblemas pintados: `mini` é um desenho próprio para 16–28 px (não uma redução). */
export const RASTER_EMBLEMAS: Record<string, { src: string; mini: string }> = {
  'coracao-condessa': { src: '/images/cosmeticos/previa/coracao-condessa.webp', mini: '/images/cosmeticos/previa/coracao-condessa-mini.webp' },
}
