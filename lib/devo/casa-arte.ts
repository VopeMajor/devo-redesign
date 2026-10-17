/**
 * Arte pintada da Casa do jogador (agente de Arte, `public/images/casa/*`, prancha docs/redesign/criticas/arte-casa.png).
 * Quadro 2:3, quatro larguras (512/768/1024/1536). `null` em `cena` volta à composição em CSS/SVG
 * (components/devo/dialogo/casa-noite.tsx), que também é a reserva se a imagem não carregar.
 * - `cena`: porta fechada; `cenaPorta`: a MESMA composição com a porta entreaberta e a luz do corredor
 *   (cruzamento quando a porta abre/fecha);
 * - `primeiroPlano`: cortina vinho, velas, chaves e a borda de uma mesa, com alfa, para paralaxe. Só a cortina
 *   aparece (o tampo da mesa cairia atrás da caixa de fala).
 */
export const CASA_ARTE: { cena: string | null; cenaPorta: string | null; primeiroPlano: string | null; tamanhos: number[] } = {
  cena: '/images/casa/cena',
  cenaPorta: '/images/casa/cena-porta',
  primeiroPlano: '/images/casa/primeiro-plano',
  tamanhos: [512, 768, 1024, 1536],
}

/** srcset de uma arte da Casa (`<base>-<largura>.webp`). */
export function casaSrcSet(base: string) {
  return CASA_ARTE.tamanhos.map((w) => `${base}-${w}.webp ${w}w`).join(', ')
}

/** Onde estão o abajur e a janela na pintura (em % do quadro 2:3), para pôr as luzes vivas por cima. */
export const CASA_ARTE_POS = {
  abajur: { x: 12, y: 57 },
  janela: { x: 9, y: 34 },
}
