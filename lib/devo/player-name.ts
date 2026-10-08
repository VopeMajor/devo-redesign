/** Substitui o marcador {nome} nas falas dos NPCs pelo nome do jogador. */
export function withName(text: string, name: string | null | undefined) {
  return text.replaceAll('{nome}', name || 'jogador')
}
