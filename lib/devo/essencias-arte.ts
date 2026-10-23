/**
 * Arte pintada das Essências de Afinidade (infra/arte, pedidos essencia-<npc>, variação v01):
 * frasco de cristal com o motivo do Anfitrião — gaiola com galo, coruja de asas abertas, cabeça de javali com
 * cintas de ferro, frasco rachado com relógio e obsidiana (Ruptura). Arquivos em
 * `public/images/essencias/<npc>-{64,128,256,512}.webp`. Chave sem arte → null (quem chama desenha o cristal antigo).
 */
const COM_ARTE = new Set(['galo', 'coruja', 'javali', 'campanha'])
const LADOS = [64, 128, 256, 512] as const

export function arteEssencia(chave: string | null | undefined, tamanho: number) {
  const npc = chave?.startsWith('essencia:') ? chave.slice(9) : null
  if (!npc || !COM_ARTE.has(npc)) return null
  const dir = '/images/essencias'
  const lado = LADOS.find((l) => l >= tamanho * 2) ?? 512
  return { src: `${dir}/${npc}-${lado}.webp`, srcSet: LADOS.map((l) => `${dir}/${npc}-${l}.webp ${l}w`).join(', '), sizes: `${tamanho}px` }
}
