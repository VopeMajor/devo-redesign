/**
 * Registro das artes dos cosméticos: `meta.asset = 'devo:<grupo>/<id>'` aponta para cá.
 *   devo:moldura/<id>  (formato decidido pela categoria: moldura_avatar → avatar, moldura_mini → mini)
 *   devo:emblema/<id>  devo:balao/<id>  devo:efeito/<id>
 */
import { BALOES, type Balao } from './baloes'
import { EMBLEMAS } from './emblemas'
import type { Arte } from './kit'
import { MOLDURAS, type MolduraArte } from './molduras'

export type { Arte, Balao, MolduraArte }
export { BALOES, EMBLEMAS, MOLDURAS }

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
