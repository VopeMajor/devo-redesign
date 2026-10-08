/** Paleta das ilustrações de NPC (arte original do DEVO). Vermelho só em detalhe. */
export const ART = {
  night: '#070912',
  nightSoft: '#0e1324',
  navy: '#141c38',
  navyLight: '#22305c',
  cobalt: '#1647ff',
  cobaltSoft: '#4f73ff',
  gold: '#c9a24f',
  goldLight: '#ecd08a',
  goldDark: '#8a6a2e',
  ivory: '#ece4d2',
  ivoryShade: '#c9bfa9',
  skin: '#e6cdb2',
  skinShade: '#c9a88a',
  ink: '#14121a',
  red: '#d51f2b',
} as const

/** Ids únicos por instância (várias ilustrações iguais podem coexistir na tela). */
export function artId(base: string, uid: string) {
  return `${base}-${uid.replace(/[^a-zA-Z0-9]/g, '')}`
}
