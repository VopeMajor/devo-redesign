/**
 * Anúncios rápidos da tela inicial (pedido de um tester, 19/10: "usar esse quadrado para fazer uns anúncios rápidos",
 * ex. "Novo Evento de Natal…"). Arquivo PURO. Duas fontes: os avisos que o Owner escreve (devo_config 'home.anuncios')
 * e os eventos do Calendário acontecendo ou chegando nos próximos dias.
 */
import type { AppId } from './types'

export type AnuncioConfig = { id: string; titulo: string; texto: string; app: AppId | null; ate: string | null }
export type Anuncio = { id: string; kicker: string; titulo: string; texto: string; app: AppId | null; arte?: string | null }
export type AnunciosPayload = { anuncios: Anuncio[]; podeEditar: boolean; config?: AnuncioConfig[] }

export const ANUNCIO_LIMITES = { titulo: 60, texto: 160, max: 8 } as const
/** Apps que um anúncio pode abrir ao toque. */
export const ANUNCIO_APPS: [AppId, string][] = [
  ['calendario', 'Calendário'],
  ['casa', 'Casa'],
  ['jogos', 'Sala de Jogos'],
  ['salao', 'Salão das Máscaras'],
  ['poco', 'Poço dos Milagres'],
  ['torres', 'Torres de Ruptura'],
  ['record', 'Record'],
  ['cartas', 'Cartas'],
  ['arcanos', 'Arcanos'],
  ['corporacoes', 'Corporações'],
]

export function lerAnuncios(raw: unknown): AnuncioConfig[] {
  if (!Array.isArray(raw)) return []
  const apps = new Set(ANUNCIO_APPS.map(([a]) => a as string))
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x, i) => ({
      id: typeof x.id === 'string' && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : `a${i}`,
      titulo: String(x.titulo ?? '').trim().slice(0, ANUNCIO_LIMITES.titulo),
      texto: String(x.texto ?? '').trim().slice(0, ANUNCIO_LIMITES.texto),
      app: typeof x.app === 'string' && apps.has(x.app) ? (x.app as AppId) : null,
      ate: typeof x.ate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.ate) ? x.ate : null,
    }))
    .filter((a) => a.titulo)
    .slice(0, ANUNCIO_LIMITES.max)
}
