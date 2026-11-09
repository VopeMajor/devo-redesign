/**
 * O voltar do aparelho e o Esc numa janela do v2 fecham primeiro a camada de cima da própria tela (o cartão, a torre
 * aberta…), e só depois a janela. Uma tela registra aqui, pelo id do sistema, uma função que fecha a camada de cima
 * e devolve true, ou false quando não havia nenhuma.
 */
export const voltarJanela: Record<string, () => boolean> = {}
