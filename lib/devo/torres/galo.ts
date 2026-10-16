/**
 * Apresentação das Torres de Ruptura pelo Galo e a reflexão "Anfitrião de quê?" (texto LITERAL do dono:
 * docs/redesign/SISTEMAS-texto-do-dono.txt, diálogo do Galo sobre Torres/Essências). Só a formatação foi
 * adaptada: escolhas, respostas por opção, poses do retrato e o marcador de gênero `{o|a}`.
 * Mesmo formato de cena dos andares (lib/devo/torres/tipos.ts › Passo).
 */
import type { Passo } from './tipos'

export const CENA_GALO_TORRES: Passo[] = [
  { tipo: 'fala', pose: 'sorriso', texto: 'E aí, mané! Qual é a tua?' },
  {
    tipo: 'escolha',
    opcoes: [{ texto: 'Qual é a minha?' }, { texto: 'Quem é você?' }, { texto: 'Onde... Onde eu tô?' }].map((o) => ({
      ...o,
      resposta: [
        {
          tipo: 'fala' as const,
          pose: 'convencido',
          texto: 'Hm? Sai daí, pô! Eu sou O Galo. Todos os bons me conhecem, tá ligado? Comigo não tem lenga-lenga, nem mimimi. Eu sou pura adrenalina!',
        },
      ],
    })),
  },
  { tipo: 'escolha', opcoes: [{ texto: 'Isso não faz sentido!' }, { texto: 'Tá...' }, { texto: 'O que significa essa fra—' }] },
  {
    tipo: 'fala',
    pose: 'piscada',
    texto: 'Pode me chamar de O Melhor Contador de Histórias, se quiser. Também aceito Mestre do Universo, caso prefira. Agora, cala a boquinha, cala aí, que o maioral vai te mandar a real!',
  },
  { tipo: 'fala', pose: 'tedio', texto: 'É chato esse tal de trabalho... Não é? Eu sei, eu sei. [Pausa dramática] Mas é pra isso que eu tô aqui!' },
  { tipo: 'fala', pose: 'neutro', texto: 'Vou mandar o papo. Então presta atenção, sacou?' },
  { tipo: 'fala', pose: 'desdem', texto: 'Dizem por aí que uma torre baixa nada mais é do que uma casa que se autointitula torre...' },
  { tipo: 'fala', pose: 'bravo', texto: 'Besteira. [Dedo do meio censurado.]' },
  {
    tipo: 'fala',
    pose: 'convencido',
    texto:
      'As Torres de Ruptura são tipo essa parada aí. Uma das paradas fundamentais desse sistema mal-assombrado! É por meio delas que você, {jogador|jogadora} newbie, consegue descobrir mais sobre esse mundão — incluindo sua condição como Record e outras coisinhas do tipo.',
  },
  {
    tipo: 'escolha',
    opcoes: [
      { texto: 'Record... Me disseram o que é, mas sinto que ainda não entendi direito.', resposta: [{ tipo: 'fala', pose: 'sombrio', texto: 'Gente que não presta.' }] },
      {
        texto: 'Eu sou {obrigado|obrigada} a participar dessas torres?',
        resposta: [
          {
            tipo: 'fala',
            pose: 'tedio',
            texto: 'Pode ser meio cansativo de vez em quando, mas, se quiser evoluir pra valer, é bom ficar de olho nessas belezinhas. E não, ninguém tá te obrigando a nada. A vida é tua, mané! Tu que sabe.',
          },
        ],
      },
      { texto: 'Como faço isso?', resposta: [{ tipo: 'fala', pose: 'satisfeito', texto: 'Calma, coisa fofa. É nessas horas que aquela parada estranha acontece...' }] },
    ],
  },
  { tipo: 'escolha', opcoes: [{ texto: 'Parada estranha?' }, { texto: '...' }] },
  {
    tipo: 'bloco',
    titulo: 'Torre de Ruptura',
    texto: ['Cada torre permite que você avance de maneira imersiva pela narrativa enquanto conquista algumas das diversas recompensas exclusivas disponíveis em seu interior.'],
  },
  {
    tipo: 'bloco',
    titulo: 'Sobre as Torres de Ruptura',
    texto: [
      'As Torres de Ruptura possuem temáticas próprias e, normalmente, representam uma jornada de conexão entre seu personagem e o NPC em destaque. Elas podem integrar diretamente a trama principal ou funcionar como histórias específicas, com objetivos bastante variados.',
    ],
  },
  {
    tipo: 'escolha',
    opcoes: [{ texto: 'Não aconteceu nada.' }, { texto: 'Você é maluco?' }].map((o) => ({
      ...o,
      resposta: [{ tipo: 'fala' as const, pose: 'piscada', texto: 'Shhh... Quem precisa saber já sabe. Mas aí, mané! Presta bastante atenção agora, beleza?' }],
    })),
  },
  { tipo: 'fala', pose: 'neutro', texto: 'Avançar numa torre nem sempre significa apenas cumprir as tarefas que aparecem pelo caminho tempestuoso da sua jornada...' },
  { tipo: 'fala', pose: 'satisfeito', texto: 'Algumas delas exigirão algo que eu e meus parças chamamos de Essência de Afinidade.' },
  {
    tipo: 'escolha',
    opcoes: [
      { texto: 'Você tem amigos?', resposta: [{ tipo: 'fala', pose: 'bravo', texto: 'Aí, tá querendo apanhar, é?!' }] },
      { texto: 'Parças?', resposta: [{ tipo: 'fala', pose: 'risada', texto: 'Os melhores entre os melhores, meu chapa!' }] },
      {
        texto: 'Essência?',
        resposta: [{ tipo: 'fala', pose: 'piscada', texto: 'Ah, essas belezuras você consegue fazendo favores e outras coisinhas por aí. Sabe como é, né? Uma mão lava a outra!' }],
      },
    ],
  },
  { tipo: 'escolha', opcoes: [{ texto: 'Entendi...' }, { texto: 'Não sei se eu tô acompanhando.' }, { texto: 'Avisa quando for explicar direito.' }] },
  { tipo: 'fala', pose: 'espanto', texto: 'Ah, shiu... Vai acontecer aquilo de novo.' },
  {
    tipo: 'bloco',
    titulo: 'Essência de Afinidade',
    texto: [
      'Uma Essência de Afinidade funciona como uma moeda de desbloqueio ou um ingresso. Só que, em vez de ser usada numa máquina qualquer, ela permite o acesso a novos andares que exijam uma quantidade e um tipo específicos de essência.',
      'Cada Essência de Afinidade corresponde a uma torre ou categoria específica de torre. Todas podem ser adquiridas por meio de interações com NPCs importantes.',
    ],
  },
  { tipo: 'escolha', opcoes: [{ texto: 'Não aconteceu nada... De novo.' }, { texto: 'Você é mesmo maluco.' }] },
  { tipo: 'fala', pose: 'convencido', texto: 'Aqui, ó! Se você aceitar ser meu fã, eu te dou uma dessas. E aí, qual vai ser?' },
  {
    tipo: 'escolha',
    opcoes: [
      { texto: 'Recusar', acao: true, efeito: 'galo.fa.recusar', resposta: [{ tipo: 'fala', pose: 'tedio', texto: 'Sério? Poxa, que chatice...' }] },
      {
        texto: 'Aceitar',
        acao: true,
        efeito: 'galo.fa.aceitar',
        resposta: [
          {
            tipo: 'fala',
            pose: 'risada',
            texto: 'BOA! Sabia que você era inteligente, mané! [O Galo entrega uma Essência de Afinidade do Galo, Anfitrião do Arcano do Imperador.]',
          },
        ],
      },
    ],
  },
  {
    tipo: 'fala',
    pose: 'piscada',
    texto: 'Prontinho! Agora, se quiser saber quais essências você tem no momento e onde pode usá-las, basta dar uma olhadinha no inventário. O mesmo vale pras chaves, beleza?',
  },
  { tipo: 'escolha', opcoes: [{ texto: 'Certo.' }, { texto: 'Chaves...?' }] },
  { tipo: 'fala', pose: 'sorriso', texto: 'Isso é tudo, pessoal! A gente se vê por aí. Bye-bye!' },
  { tipo: 'sistema', texto: 'O Galo desaparece sem se despedir adequadamente.' },
  {
    tipo: 'sistema',
    texto:
      'Uma torre normalmente contém entre cinco e oito andares. A cada andar superado, o número de essências exigido para o próximo andar dobra. Por isso, esteja sempre consciente de onde deve ou não gastar seus valiosos recursos.',
  },
]

/** Id da cena de reflexão (o agente Narrativa pode tomar posse dela pelo mesmo id). */
export const CENA_ANFITRIAO_DE_QUE = 'anfitriao-de-que'

/** Opções da reflexão, na ordem do dono. A 4ª é a certa. */
export const OPCOES_REFLEXAO = ['Não me lembro.', 'Anfitrião das Galinhas.', 'Anfitrião do Sol Celeste.', 'Anfitrião do Imperador.', 'Só Anfitrião mesmo.'] as const
export const REFLEXAO_CERTA = 4

/** "Quando o jogador sai da aba de torres, ele também reflete sobre sua conversa com O Galo." */
export const CENA_REFLEXAO: Passo[] = [
  { tipo: 'narra', texto: 'Você também reflete sobre sua conversa com O Galo.' },
  { tipo: 'jogador', texto: '“Aquele cara estava marcado como Anfitrião também. Dizia até que ele era o Anfitrião de alguma coisa… O quê?”' },
  {
    tipo: 'escolha',
    opcoes: OPCOES_REFLEXAO.map((texto, i) =>
      i + 1 === REFLEXAO_CERTA ? { texto, resposta: [{ tipo: 'jogador' as const, texto: 'Acho que era esse. Eu deveria perguntar a alguém sobre isso depois.' }] } : { texto, encerra: true },
    ),
  },
]
