/**
 * Apresentação do Poço dos Milagres ("a neblina"). O TEXTO e as escolhas agora vivem no motor de diálogo da
 * Narrativa: `lib/devo/dialogo/cenas/poco-encontro.ts` (cena `poco-encontro`, texto literal do dono em
 * docs/redesign/DIALOGOS-casa-galo-poco-melissa-dono.txt). Aqui ficam só os quadros do cenário do Poço e o helper
 * de gênero usado pela tela (`components/devo/poco/poco-neblina.tsx`).
 */
import { playerText } from './player-name'

/** Quadros do cenário do Poço durante a apresentação (`quadro` dos passos da cena). */
export type NeblinaPalco = 'rua' | 'poco' | 'figura' | 'mao' | 'partiu'
export const NEBLINA_QUADROS: readonly NeblinaPalco[] = ['rua', 'poco', 'figura', 'mao', 'partiu']

/** Resolve o marcador de gênero `{masculino|feminino}` (lib/devo/player-name.ts › playerText). */
export function generoTexto(texto: string, genero: string | null | undefined, nome?: string | null) {
  return playerText(texto, { gender: genero, name: nome })
}
