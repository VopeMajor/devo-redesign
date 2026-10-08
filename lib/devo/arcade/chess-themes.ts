export type BoardTheme = {
  id: string
  name: string
  light: string
  dark: string
  frame: string
  trim: string
  bg: string
  fog: string
  hemiSky: string
  hemiGround: string
  glow: string
  table: string
}

/** The five Titan Chess themes, colours copied verbatim from the original HTML (l, d, f, a, t, bg). */
export const BOARD_THEMES: BoardTheme[] = [
  { id: 'titan-madeira', name: 'Madeira', light: '#eadbb8', dark: '#6a4a34', frame: '#2e1d12', trim: '#d9a441', table: '#171a22', bg: '#2a303d', fog: '#2a303d', hemiSky: '#fff4e0', hemiGround: '#2a2d3a', glow: '#d9a441' },
  { id: 'titan-marmore', name: 'Mármore', light: '#ebe8e2', dark: '#565b63', frame: '#17181c', trim: '#c9a85c', table: '#101216', bg: '#30343c', fog: '#30343c', hemiSky: '#fff4e0', hemiGround: '#2a2d3a', glow: '#c9a85c' },
  { id: 'titan-esmeralda', name: 'Esmeralda', light: '#d4e6da', dark: '#1d5c47', frame: '#0d1f19', trim: '#e6c35c', table: '#0a1512', bg: '#1d3a30', fog: '#1d3a30', hemiSky: '#fff4e0', hemiGround: '#2a2d3a', glow: '#e6c35c' },
  { id: 'titan-gelo', name: 'Gelo', light: '#e3f0f8', dark: '#5a7f9e', frame: '#1a2a3a', trim: '#b8d4ea', table: '#101822', bg: '#2b3f55', fog: '#2b3f55', hemiSky: '#fff4e0', hemiGround: '#2a2d3a', glow: '#b8d4ea' },
  { id: 'titan-rubi', name: 'Rubi', light: '#f1ddd0', dark: '#7c2535', frame: '#22090e', trim: '#d4a24a', table: '#140a0c', bg: '#3d1a22', fog: '#3d1a22', hemiSky: '#fff4e0', hemiGround: '#2a2d3a', glow: '#d4a24a' },
]

export function boardTheme(id?: string) {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]
}

export type SidePalette = { armor: string; cloth: string; trim: string; skin: string; magic: string; base: string; rim: string }

export type PieceSet = { id: string; name: string; metalness: number; roughness: number; w: SidePalette; b: SidePalette }

/** Builds a Titan piece set from the HTML theme values: w/b piece colours, a = gold trim, pm/pr = metalness/roughness. */
function titanSet(id: string, name: string, w: string, b: string, a: string, pm = 0.12, pr = 0.28): PieceSet {
  const side = (c: string, o: string): SidePalette => ({ armor: c, cloth: c, trim: a, skin: c, magic: o, base: c, rim: '#ffe9c8' })
  return { id, name, metalness: pm, roughness: pr, w: side(w, b), b: side(b, w) }
}

export const PIECE_SETS: PieceSet[] = [
  titanSet('titan', 'Madeira', '#f3ecdc', '#26211f', '#d9a441'),
  titanSet('titan-marmore', 'Mármore', '#f7f3ea', '#1b1d22', '#c9a85c', 0.12, 0.18),
  titanSet('titan-esmeralda', 'Esmeralda', '#ecd9a0', '#0f2a22', '#e6c35c', 0.55, 0.3),
  titanSet('titan-gelo', 'Gelo', '#fbfdff', '#22364a', '#b8d4ea', 0.12, 0.15),
  titanSet('titan-rubi', 'Rubi', '#f3e7c9', '#2b1115', '#d4a24a', 0.2, 0.28),
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
