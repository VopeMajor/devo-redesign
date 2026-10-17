/**
 * Encontro no Poço (primeira visita): a neblina, o poço de 500 anos e a figura encapuzada (secretamente o Corvo —
 * NUNCA nomeado aqui; placa "???"). Texto LITERAL do dono: docs/redesign/DIALOGOS-casa-galo-poco-melissa-dono.txt
 * (linhas 305–437), na mesma ordem; só a forma muda (DIALOGO.md §2) e o gênero do jogador (`obrigad{o|a}`).
 *
 * Tocada pela tela do Poço (components/devo/poco/poco-neblina.tsx, com o cenário próprio pelos `quadro`s), mas o
 * progresso, as escolhas e as consequências são do motor (dialog_progress / dialog_events), uma vez só:
 * - "Usar moeda especial" fica escura e trancada (sem "(se houver)") quando o jogador não tem moeda do Poço;
 *   com moeda, abre a lista de moedas (instrução do dono "Aparecem as opções de moedas para se usar").
 * - "Sim, por favor." pula a resposta repetida e vai direto à mão (instrução do dono).
 * - Dracma de Raridade Incomum: item com a MESMA chave de idempotência do servidor do Poço (`poco:corvo`), então o
 *   motor e `apresentacao.concluir` nunca entregam duas moedas.
 * - "Obrigado/Obrigada." → Karma +1 (ordem; gratidão). Pequeno, sem número para o jogador.
 */
import { eu, escolha, efeito, fala, narra, opcao } from '../autor'
import type { Cena } from '../formato'

const fig = (texto: string, extra: Parameters<typeof fala>[2] = {}) => fala('figura', texto, extra)
const MEDO = 'Não há por que ter medo. Eu não desejo te machucar… Você já saberia se eu quisesse.'

export const CENA_POCO_ENCONTRO: Cena = {
  id: 'poco-encontro',
  titulo: 'A rua de barro',
  capitulo: 'Poço dos Milagres',
  cenario: 'nevoa',
  requer: 'poco',
  elenco: { figura: { nome: '???', npc: 'corvo' } },
  passos: [
    narra('Em meio ao caos da cidade urbana, você se perde e encontra uma região enevoada. Aqui há muitas casas, mas todas são antigas e simples.', { quadro: 'rua' }),
    narra('Ao virar em uma esquina, você se depara com uma rua de barro.'),
    narra('No fim dela, algo te chama a atenção. Brilha para você de um jeito sobrenatural.'),
    narra('Ao se aproximar, você descobre um poço milenar. Ele tem uma placa ao lado, dizendo que foi construído há pelo menos 500 anos.', { quadro: 'poco' }),
    eu('Um poço… Não é uma fonte, hein?'),
    eu('Se pelo menos eu tivesse uma moeda…'),
    eu('Talvez isso tivesse alguma utilidade.'),
    escolha('moeda', [
      opcao('Usar moeda comum.', [eu('Parece que nada mudou.')]),
      { id: 'moeda-especial', texto: 'Usar moeda especial.' },
      opcao('Não jogar nada.', [eu('…..')]),
      opcao('Tentar com uma tampa de garrafa.', [eu('…Que idiotice.')]),
    ]),
    narra('No meio da neblina, alguém se aproxima. A silhueta revela uma pessoa alta e esguia com um manto. Não é possível ver seu rosto com tanta névoa.', {
      quadro: 'figura',
      som: 'aparicao',
    }),
    escolha('quem', ['Quem está aí?', 'Chegou a minha hora?', 'Eu juro que só tava testando.']),
    fig('Por acaso, você precisa de uma moeda?'),
    escolha('moeda-pergunta', ['Moeda?', 'Isso não funciona.', 'Você tem uma?']),
    fig('Sim, moedas normais não funcionariam aqui. Normalmente elas não funcionam em qualquer lugar. Mas esse poço? Ele é diferente de algo como uma fonte dos desejos. É muito mais especial.'),
    escolha('prova', ['Entendi.', 'Isso parece besteira.', 'E como você pode provar?']),
    fig('Você quer que eu te dê uma que funciona, criança?'),
    escolha('oferta', [
      opcao('Não, obrigad{o|a}.', [fig(MEDO)]),
      // "não é para repetir caso a pessoa tenha escolhido essa opção. Tem que pular e ir para o que vem na sequência"
      opcao('Sim, por favor.', [], { ir: 'mao' }),
      opcao('Primeiro você…', [fig(MEDO)]),
    ]),
    narra(
      'No início, pensei que fosse um pulso de mentira, mas aquela pessoa realmente ergueu a mão e ela estava o mais puro osso. Desnutrida, não tinha manga cobrindo sua carne morta ou a pele azulada e gélida. Fez arder minhas narinas com o cheiro incendiário de putrefação. Pensei ter visto uma larva devorando o tendão.',
      { id: 'mao', quadro: 'mao' },
    ),
    fig('Aqui… É seu agora.', { quadro: 'figura' }),
    efeito('dracma', [{ tipo: 'item', item: 'dracma_incomum', idem: 'poco:corvo' }], 'Você recebeu um Dracma de Raridade Incomum', { som: 'item' }),
    fig('Será muito útil para você se tiver sorte. Claro… O próximo não será tão fácil assim.'),
    escolha('agradece', [opcao('Obrigad{o|a}.', [fig('Não há de quê.')], { efeitos: [{ tipo: 'karma', delta: 1 }] }), '…']),
    fig('Agora eu preciso ir embora. Sinta-se livre para visitar o poço sempre que precisar. Use aquela alavanca depois de arremessar a moeda que eu te dei.'),
    fig('E lembre-se disso: caso a moeda seja lançada, não poderá ser recuperada. Nunca tente entrar no poço para pegá-las de volta. Ou sofrerá algo terrível… e vai desejar não ter nascido.'),
  ],
}
