/** Presets da camada 3D compartilhada (ver docs/redesign/IDENTIDADE.md › Cenas 3D). */
export type ScenePreset = 'sigil' | 'cathedral' | 'table' | 'corridor' | 'tribunal'

/**
 * Ponto focal do preset em frações do contêiner (0..1). `size` = diâmetro do foco em fração da
 * menor dimensão. Só o `sigil` usa hoje (posiciona o astrolábio atrás de um elemento da página).
 */
export type SceneFocus = { x: number; y: number; size: number }
