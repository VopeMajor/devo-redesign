/**
 * Cena de apresentação do Poço dos Milagres ("a neblina"). Texto LITERAL do dono
 * (docs/redesign/SISTEMAS-texto-do-dono.txt, primeiro bloco), só com a formatação adaptada: narração sem os
 * colchetes, escolhas com respostas por opção, efeitos e saltos. A figura encapuzada é secretamente o
 * Anfitrião Corvo e NUNCA é nomeada aqui (placa "???").
 *
 * Formato pensado para migrar para o motor de diálogo da Narrativa: uma lista de nós com `id`, falas, escolhas
 * (`opcoes[].resposta` = falas só daquela opção; `opcoes[].ir` = salto) e efeitos (`efeito`). Concordância de
 * gênero com o marcador `{masculino|feminino}` (DIRECAO-3, "Gênero nos textos").
 */

export type NeblinaQuem = 'narrador' | 'jogador' | 'figura' | 'sistema'
export type NeblinaPalco = 'rua' | 'poco' | 'figura' | 'mao' | 'partiu'

export type NeblinaFala = { quem: NeblinaQuem; texto: string }

export type NeblinaOpcao = {
  id: string
  rotulo: string
  /** Falas que só esta opção mostra antes de seguir. */
  resposta?: NeblinaFala[]
  /** Salto para outro nó (senão segue para o próximo). */
  ir?: string
  /** Opção que depende de ter uma moeda especial (Dracma): aparece escura e trancada sem ela. */
  exigeMoedaEspecial?: boolean
  /** Abre a lista de moedas do jogador antes de seguir. */
  mostrarMoedas?: boolean
}

export type NeblinaNo =
  | ({ id: string; tipo: 'fala'; palco?: NeblinaPalco } & NeblinaFala)
  | { id: string; tipo: 'escolha'; palco?: NeblinaPalco; opcoes: NeblinaOpcao[] }
  /** Entrega o Dracma do encapuzado (servidor, uma vez só) e mostra o aviso do sistema. */
  | { id: string; tipo: 'moeda'; palco?: NeblinaPalco; texto: string }

const N = (id: string, texto: string, palco?: NeblinaPalco): NeblinaNo => ({ id, tipo: 'fala', quem: 'narrador', texto, palco })
const J = (id: string, texto: string, palco?: NeblinaPalco): NeblinaNo => ({ id, tipo: 'fala', quem: 'jogador', texto, palco })
const F = (id: string, texto: string, palco?: NeblinaPalco): NeblinaNo => ({ id, tipo: 'fala', quem: 'figura', texto, palco })

export const NEBLINA: NeblinaNo[] = [
  N('rua-1', 'Em meio ao caos da cidade urbana, você se perde e encontra uma região enevoada. Aqui há muitas casas, mas todas são antigas e simples.', 'rua'),
  N('rua-2', 'Ao virar em uma esquina, você se depara com uma rua de barro.', 'rua'),
  N('rua-3', 'No fim dela, algo te chama a atenção. Brilha para você de um jeito sobrenatural.', 'rua'),
  N('poco-1', 'Ao se aproximar, você descobre um poço milenar. Ele tem uma placa ao lado, dizendo que foi construído há pelo menos 500 anos.', 'poco'),
  J('jog-1', 'Um poço… Não é uma fonte, hein?'),
  J('jog-2', 'Se pelo menos eu tivesse uma moeda…'),
  J('jog-3', 'Talvez isso tivesse alguma utilidade.'),
  {
    id: 'moeda-escolha',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Usar moeda comum.', resposta: [{ quem: 'jogador', texto: 'Parece que nada mudou.' }] },
      { id: '2', rotulo: 'Usar moeda especial (se houver).', exigeMoedaEspecial: true, mostrarMoedas: true },
      { id: '3', rotulo: 'Não jogar nada.', resposta: [{ quem: 'jogador', texto: '…..' }] },
      { id: '4', rotulo: 'Tentar com uma tampa de garrafa.', resposta: [{ quem: 'jogador', texto: '…Que idiotice.' }] },
    ],
  },
  N('figura-1', 'No meio da neblina, alguém se aproxima. A silhueta revela uma pessoa alta e esguia com um manto. Não é possível ver seu rosto com tanta névoa.', 'figura'),
  {
    id: 'quem',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Quem está aí?' },
      { id: '2', rotulo: 'Chegou a minha hora?' },
      { id: '3', rotulo: 'Eu juro que só tava testando.' },
    ],
  },
  F('fig-1', 'Por acaso, você precisa de uma moeda?'),
  {
    id: 'moeda-pergunta',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Moeda?' },
      { id: '2', rotulo: 'Isso não funciona.' },
      { id: '3', rotulo: 'Você tem uma?' },
    ],
  },
  F('fig-2', 'Sim, moedas normais não funcionariam aqui. Normalmente elas não funcionam em qualquer lugar. Mas esse poço? Ele é diferente de algo como uma fonte dos desejos. É muito mais especial.'),
  {
    id: 'prova',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Entendi.' },
      { id: '2', rotulo: 'Isso parece besteira.' },
      { id: '3', rotulo: 'E como você pode provar?' },
    ],
  },
  F('fig-3', 'Você quer que eu te dê uma que funciona, criança?'),
  {
    // 1 e 3: a figura responde antes da mão. 2 ("Sim, por favor."): vai direto para a mão, sem repetir
    // (instrução do dono: "não é para repetir caso a pessoa tenha escolhido essa opção").
    id: 'oferta',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Não, obrigad{o|a}.', resposta: [{ quem: 'figura', texto: 'Não há por que ter medo. Eu não desejo te machucar… Você já saberia se eu quisesse.' }] },
      { id: '2', rotulo: 'Sim, por favor.' },
      { id: '3', rotulo: 'Primeiro você…', resposta: [{ quem: 'figura', texto: 'Não há por que ter medo. Eu não desejo te machucar… Você já saberia se eu quisesse.' }] },
    ],
  },
  N(
    'mao',
    'No início, pensei que fosse um pulso de mentira, mas aquela pessoa realmente ergueu a mão e ela estava o mais puro osso. Desnutrida, não tinha manga cobrindo sua carne morta ou a pele azulada e gélida. Fez arder minhas narinas com o cheiro incendiário de putrefação. Pensei ter visto uma larva devorando o tendão.',
    'mao',
  ),
  F('fig-4', 'Aqui… É seu agora.', 'figura'),
  { id: 'dracma', tipo: 'moeda', texto: '[Você recebeu um Dracma de Raridade Incomum]' },
  F('fig-5', 'Será muito útil para você se tiver sorte. Claro… O próximo não será tão fácil assim.'),
  {
    id: 'agradece',
    tipo: 'escolha',
    opcoes: [
      { id: '1', rotulo: 'Obrigad{o|a}.', resposta: [{ quem: 'figura', texto: 'Não há de quê.' }] },
      { id: '2', rotulo: '…' },
    ],
  },
  F('fig-6', 'Agora eu preciso ir embora. Sinta-se livre para visitar o poço sempre que precisar. Use aquela alavanca depois de arremessar a moeda que eu te dei.'),
  F('fig-7', 'E lembre-se disso: caso a moeda seja lançada, não poderá ser recuperada. Nunca tente entrar no poço para pegá-las de volta. Ou sofrerá algo terrível… e vai desejar não ter nascido.'),
  N('partiu', '??? desaparece sem se despedir adequadamente', 'partiu'),
  J('jog-fim', 'Parece que eu me esqueci de perguntar o seu nome…'),
]

/** Resolve o marcador de gênero `{masculino|feminino}` (mesmo formato de lib/devo/player-name.ts › playerText). */
export function generoTexto(texto: string, genero: string | null | undefined) {
  const f = genero === 'Feminino'
  return texto.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m: string, fem: string) => (f ? fem : m))
}
