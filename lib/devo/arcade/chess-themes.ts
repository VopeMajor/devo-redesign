/**
 * Temas do Living Chess na paleta do mármore (IDENTIDADE §0, ref. `refs/ref-xadrez-marmore.png`).
 * Os ids batem com o que o servidor aceita em `saveSettings` (chessTheme / pieceStyle), então a
 * escolha do jogador persiste entre partidas.
 */
export type BoardTheme = {
  id: string
  name: string
  /** Casas claras / escuras (base do mármore). */
  light: string
  dark: string
  /** Veios das casas claras / escuras. */
  lightVein: string
  darkVein: string
  /** Moldura (pedra) e rejunte/filetes (metal). */
  frame: string
  trim: string
  /** Luz de destaque (ondas do relógio, promoção). */
  glow: string
  /** Mesa sob o tabuleiro. */
  table: string
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'devo', name: 'Mármore', light: '#e9e7e3', dark: '#2c2c30', lightVein: '#8f8e8b', darkVein: '#a19d95', frame: '#121214', trim: '#bab09f', glow: '#8a7cc8', table: '#0c0c0e' },
  { id: 'classic', name: 'Porcelana', light: '#f3f1ed', dark: '#64636a', lightVein: '#b9b5ad', darkVein: '#2c2c31', frame: '#1f1f22', trim: '#d8d0c2', glow: '#bab09f', table: '#0c0c0e' },
  { id: 'void', name: 'Ônix', light: '#a9a7ad', dark: '#141416', lightVein: '#5c5a62', darkVein: '#6f6b82', frame: '#0a0a0c', trim: '#8a7cc8', glow: '#8a7cc8', table: '#08080a' },
]

export function boardTheme(id?: string) {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]
}

export type PieceMaterial = 'marble' | 'glass' | 'steel'

/** Paleta de um lado: corpo, veio (mármore), filete de metal e joia. */
export type SidePalette = { body: string; vein: string; trim: string; gem: string; opacity: number }

export type PieceSet = {
  id: string
  name: string
  material: PieceMaterial
  metalness: number
  roughness: number
  w: SidePalette
  b: SidePalette
}

/** Esculturas: mármore (padrão), vidro ou aço champanhe. O id é o `pieceStyle` aceito pelo servidor. */
export const PIECE_SETS: PieceSet[] = [
  {
    id: 'marble',
    name: 'Mármore',
    material: 'marble',
    metalness: 0,
    roughness: 0.2,
    w: { body: '#f4f2ee', vein: '#9d9a93', trim: '#c9bfae', gem: '#8a7cc8', opacity: 1 },
    b: { body: '#1c1c1f', vein: '#8f8e8b', trim: '#bab09f', gem: '#8a7cc8', opacity: 1 },
  },
  {
    id: 'glass',
    name: 'Vidro',
    material: 'glass',
    metalness: 0,
    roughness: 0.04,
    w: { body: '#eef1f2', vein: '#ffffff', trim: '#d8d0c2', gem: '#c2b9ec', opacity: 0.82 },
    b: { body: '#27252d', vein: '#6f6b82', trim: '#bab09f', gem: '#8a7cc8', opacity: 0.92 },
  },
  {
    id: 'matte',
    name: 'Aço champanhe',
    material: 'steel',
    metalness: 0.9,
    roughness: 0.3,
    w: { body: '#ddd4c4', vein: '#ece5d8', trim: '#f4efe6', gem: '#8a7cc8', opacity: 1 },
    b: { body: '#38383e', vein: '#5f584d', trim: '#bab09f', gem: '#8a7cc8', opacity: 1 },
  },
]

export function pieceSet(id?: string) {
  return PIECE_SETS.find((s) => s.id === id) ?? PIECE_SETS[0]
}

export type Quality = 'low' | 'medium' | 'high'

export function resolveQuality(q: string | undefined): Quality {
  if (q === 'low' || q === 'medium' || q === 'high') return q
  if (typeof navigator === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (cores <= 4 || mem <= 3) return 'low'
  if (touch || cores <= 6) return 'medium'
  return 'high'
}
