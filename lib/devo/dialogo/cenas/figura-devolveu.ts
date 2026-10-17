/**
 * A figura ??? (texto LITERAL do dono, 17/10). Só para quem DEVOLVEU as Cartas Iniciais à Melissa no prólogo, depois de
 * terminar o primeiro Deadly Vote (condição `devolveu-e-dv`, conferida no servidor). As falas da figura chegam pelo
 * celular; o quarto à noite é o palco. Entrega +5 Dracmas Incomuns uma vez só (passo `efeito`).
 */
import { escolha, fala, narra, opcao, efeito } from '../autor'
import type { Cena } from '../formato'

const fig = (texto: string, extra: Parameters<typeof fala>[2] = {}) => fala('figura', texto, extra)

export const CENA_FIGURA_DEVOLVEU: Cena = {
  id: 'figura-devolveu',
  titulo: '???',
  capitulo: 'Mensagem sem remetente',
  cenario: 'casa-noite',
  condicao: 'devolveu-e-dv',
  elenco: { figura: { nome: '???', titulo: 'no seu celular' } },
  passos: [
    fig('Você fez bem ao não aceitar coisas daquela mulher da Companhia de Despertados. Escolha sempre o lado certo da história.', { som: 'chamada', palco: { npc: null } }),
    fig('Porém, também peço que tome cuidado com sua ousadia. Não seja muito suspeito… ou se tornará um alvo.'),
    narra('Enquanto você mexia no celular, a luz pisca. Algo estranho na atmosfera parece deixar o clima obscurecido.', { fx: 'luz-pisca', som: 'luz' }),
    narra('Quando a luz enfim retorna, tem algo fora do lugar.'),
    narra('Acima da banca do quarto, cinco moedas brilhantes de cobre apareceram.', { fx: 'revela', som: 'item' }),
    efeito('moedas', [{ tipo: 'item', item: 'dracma_incomum', quantidade: 5 }], '??? transferiu +5 Dracmas Incomuns para você'),
    escolha(
      'perguntas',
      [
        opcao('A Melissa é perigosa?', [fig('Mais que ela, tudo o que representa.')]),
        opcao('E qual é o lado certo?', [fig('Aquele que melhor escuta.')]),
        opcao('Por que você me deu isso? E como?', [fig('Ainda não. Não agora.')]),
        opcao('O que você quer de mim?', [fig('Me mostre seu destino… E eu terei uma resposta quando a hora chegar.')]),
      ],
      { modo: 'explorar' },
    ),
    fig('Até logo, Record. Saiba que seguirei te observando em suas escolhas.'),
  ],
}
