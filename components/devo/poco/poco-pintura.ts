/**
 * Camadas PINTADAS opcionais do Poço (pedido em docs/redesign/PEDIDO-ARTE-poco.md).
 *
 * Enquanto um caminho não estiver aqui, a cena usa o desenho vetorial de poco-cena.tsx (nada quebra e
 * nenhuma imagem inexistente é pedida ao servidor, então o console fica limpo). Quando a arte chegar em
 * public/images/poco/, basta preencher o caminho correspondente:
 *
 * - `fundo`  — céu de neblina + casas antigas + rua de barro, sem o poço (substitui Ceu/Casas/Rua).
 * - `patio`  — pátio de pedra gasta ao redor da base + estela dos 500 anos (substitui Patio/Estela).
 * - `frente` — oferendas no chão, à frente da base: velas, rosa, moedas (substitui Oferendas).
 * - `nevoa`  — faixa de névoa transparente que deriva na frente (substitui as faixas em CSS).
 */
export const POCO_PINTURA: Partial<Record<'fundo' | 'patio' | 'frente' | 'nevoa', string>> = {}
