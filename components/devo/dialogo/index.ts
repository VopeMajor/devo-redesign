/**
 * Motor de diálogo do DEVO (Narrativa). Formato e API: docs/redesign/DIALOGO.md.
 * - `useCenas()` abre cenas registradas por cima do sistema (host montado na fase `os`).
 * - `CenaDialogo` toca uma cena embutida numa tela própria.
 * - Melissa / Companhia de Despertados: `SeloCompanhia`, `ChamadaMelissa`, `HologramaMelissa`.
 * - Karma: `LinhaDestino` (qualitativa, sem número).
 */
export { CenaDialogo } from './cena-dialogo'
export { CenasProvider, useCenas, type AbrirOpts } from './cenas-host'
export { ChamadaMelissa, HologramaMelissa, SeloCompanhia } from './holograma'
export { LinhaDestino, PlacaDestino, descreverDestino } from './linha-destino'
export { TextoRico } from './texto'
