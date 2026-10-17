/**
 * Arte pintada da Casa do jogador (opcional). O agente de Arte entrega em `public/images/casa/*` e preenche os
 * caminhos aqui; enquanto for `null`, a cena usa só a composição em CSS/SVG (components/devo/dialogo/casa-noite.tsx).
 * Com a pintura, a cena continua pondo POR CIMA a luz do abajur, o luar da janela, a luz da porta ao abrir e a
 * vinheta — então a pintura deve vir "apagada" (sem esses brilhos), de preferência 1600×1000 webp, centro útil no
 * meio (o celular corta as laterais), porta à direita e janela à esquerda (posições em `CASA_ARTE_POS`).
 */
export const CASA_ARTE: { noite: string | null } = {
  noite: null,
}

/** Onde estão a janela, a porta e o abajur na pintura (em % da cena), para alinhar as luzes por cima. */
export const CASA_ARTE_POS = {
  janela: { left: '7%', top: '14%' },
  porta: { right: '8%', bottom: '30%' },
  abajur: { left: '15%', bottom: '33%' },
}
