/**
 * Ilustrações das cartas (design do dono, 22/10: moldura de pergaminho com a arte numa janela alta).
 * Cada carta com arte própria tem `public/images/cartas/<id>/arte-{512,768,1024}.webp` (pipeline em `infra/arte`,
 * pedidos `carta-<id>`). Sem arte própria, a carta usa a gravura do tipo em duotom (provisório).
 * Para ligar uma arte nova: exporte os arquivos e acrescente o id aqui.
 */
export const CARTAS_COM_ARTE = new Set<string>([])

export function arteDaCarta(id: string): { src: string; srcSet: string } | null {
  if (!CARTAS_COM_ARTE.has(id)) return null
  const base = `/images/cartas/${id}/arte`
  return { src: `${base}-768.webp`, srcSet: `${base}-512.webp 512w, ${base}-768.webp 768w, ${base}-1024.webp 1024w` }
}
