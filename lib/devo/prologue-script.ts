export type StageId =
  | 'dark'
  | 'rumor'
  | 'kids'
  | 'boy'
  | 'girl'
  | 'hands'
  | 'omen'
  | 'trip'
  | 'fall'
  | 'abyss'
  | 'death'
  | 'fire'
  | 'rise'
  | 'void'
  | 'voice'
  | 'mine'
  | 'phone'

export type MelissaMood = 'neutral' | 'soft' | 'serious'
export type Speaker = 'narrator' | 'voice' | 'melissa'

export type Line = { who: Speaker; text: string; mood?: MelissaMood }

export type ProfileField = 'name' | 'face' | 'age' | 'gender'

export type Beat =
  | { kind: 'line'; stage: StageId; line: Line; auto?: number; sfx?: 'crush' | 'reveal' | 'notify' | 'card' }
  | { kind: 'choice'; stage: StageId; mode: 'one' | 'explore'; options: { label: string; reply: Line[] }[] }
  | { kind: 'input'; stage: StageId; field: ProfileField }

const n = (stage: StageId, text: string, extra: Partial<Extract<Beat, { kind: 'line' }>> = {}): Beat => ({
  kind: 'line',
  stage,
  line: { who: 'narrator', text },
  ...extra,
})
const voice = (stage: StageId, text: string): Beat => ({ kind: 'line', stage, line: { who: 'voice', text } })
const mel = (text: string, mood: MelissaMood = 'neutral', stage: StageId = 'mine'): Beat => ({
  kind: 'line',
  stage,
  line: { who: 'melissa', text, mood },
})
const m = (text: string, mood: MelissaMood = 'neutral'): Line => ({ who: 'melissa', text, mood })

export const FACE_OPTIONS = ['Sério e marcado', 'Gentil e cansado', 'Pálido e comum', 'Difícil de lembrar']
export const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Prefiro não dizer']

export const PROLOGUE: Beat[] = [
  n('dark', '…'),
  n('rumor', 'Há muito tempo atrás, houve um rumor estranho…'),
  n('kids', 'Duas crianças estavam caminhando pela floresta em um dia ensolarado. Elas eram irmã e irmão, em ordem de idade.'),
  n('boy', 'O irmão mais novo era muito inteligente, mas seu espírito era corajoso, temperamental e aventureiro demais.'),
  n('girl', 'Já a irmã era dócil e sábia à sua maneira. Ela sabia bem que precisava cuidar do seu irmãozinho caçula, ou ele acabaria mal. Era seu dever protegê-lo.'),
  n('hands', 'Em momentos raros como o daquele passeio, aqueles dois conseguiam esquecer da vida enganadora entre os tijolos e as espadas.'),
  n('omen', 'Mas tudo mudaria…'),
  n('omen', 'Com um simples acidente.'),
  n('trip', '', { auto: 1700, sfx: 'crush' }),
  n('fall', 'A fenda que se abriu logo abaixo dos pés os engoliu.'),
  n('abyss', 'Os dois pequenos caíram para dentro de uma escuridão soberana. Seus ferimentos, graves.'),
  n('abyss', 'Naquele lugar, ambos encontrariam a morte.'),
  n('death', 'Mas ela não os levou de imediato.'),
  n('death', 'Por algum motivo, a morte ofereceu uma chance.'),
  n('death', 'Receberam uma mesma proposta misteriosa.'),
  n('fire', 'Aceitar o destino… ou lutar contra ele pela eternidade.'),
  n('rise', 'Naquele dia, apenas uma das crianças escalou de volta para a superfície.'),
  n('rise', 'E apenas uma delas se reergueu.'),
  n('dark', '[ … ]'),

  { kind: 'choice', stage: 'void', mode: 'one', options: [{ label: 'Hum? Onde eu estou?', reply: [{ who: 'narrator', text: 'Silêncio.' }] }] },
  {
    kind: 'choice',
    stage: 'void',
    mode: 'one',
    options: [
      { label: 'Minha cabeça…', reply: [{ who: 'narrator', text: 'Ao conferir sua condição, você sente algo doloroso em algum ponto da clavícula para cima. Pode ser no pescoço, no ombro ou até no rosto. Queima levemente.' }] },
      { label: 'É tão escuro e vazio aqui. Não consigo enxergar nada.', reply: [{ who: 'narrator', text: '…' }] },
      { label: 'Talvez seja um sonho. Estou sonhando? Talvez eu deva bater a cabeça na parede e acordar desse pesadelo.', reply: [{ who: 'narrator', text: 'É melhor não arriscar.' }] },
    ],
  },
  n('void', 'Ao levantar o rosto, você escuta uma antiga voz vindo de algum lugar.'),
  voice('voice', 'Não há espaço para sonhos aqui. Tudo o que sonhou… já despertou. Você apenas encontrou o único lugar que pode te ajudar.'),
  {
    kind: 'choice',
    stage: 'voice',
    mode: 'one',
    options: [
      { label: 'Eu quero sair.', reply: [{ who: 'voice', text: 'Uma decisão tomada não pode ser desfeita facilmente, Record.' }] },
      { label: 'Pode me ajudar?', reply: [{ who: 'voice', text: 'Há um caminho por essa escuridão. Você deve seguir em frente, então poderá encontrar sua própria luz.' }] },
    ],
  },
  n('voice', 'Você deve encontrar a luz. Siga adiante, ou espere aqui.'),
  {
    kind: 'choice',
    stage: 'voice',
    mode: 'one',
    options: [
      { label: 'Entendi. Obrigado.', reply: [{ who: 'narrator', text: 'Ninguém responde.' }] },
      { label: 'E quanto a você?', reply: [{ who: 'voice', text: 'Eu estarei observando.' }] },
    ],
  },
  n('dark', '[ … ]'),

  n('mine', 'A paisagem se abre para um tipo de caverna ou mina desconhecida. Há tochas acesas pelas paredes e um cheiro forte de carvão no ar.'),
  n('mine', 'Alguém parece se aproximar.'),
  mel('Olá, Record. Eu estive te esperando. Parece que você é o último da lista. Qual o seu nome?'),
  { kind: 'input', stage: 'mine', field: 'name' },
  mel('É um nome complicado. E como é o seu rosto?', 'soft'),
  { kind: 'input', stage: 'mine', field: 'face' },
  mel('Huuummm. E qual a sua idade?', 'soft'),
  { kind: 'input', stage: 'mine', field: 'age' },
  mel('Certo… Então, por fim, me diga seu gênero.'),
  { kind: 'input', stage: 'mine', field: 'gender' },
  mel('Curioso. Bem curioso. Tudo certo!', 'soft'),
  mel('Então, {nome}, você precisa se apressar. Seu jogo já vai começar.', 'serious'),
  {
    kind: 'choice',
    stage: 'mine',
    mode: 'explore',
    options: [
      { label: 'Jogo?', reply: [m('O Deadly Vote. É um jogo de morte, em que pessoas lutam pela própria vida para conseguir mais tempo. Você deve ter aceitado esse acordo que permite a eternidade quando estava mais perto da morte.', 'serious')] },
      { label: 'O jogo…', reply: [m('Pode me chamar de Melissa. É um prazer te conhecer.', 'soft')] },
      {
        label: 'Record, você disse isso antes. O que é?',
        reply: [
          m('Eu não disse…', 'serious'),
          m('Um Record é um indivíduo com a capacidade de possuir um Card Shuffler. Um Card Shuffler, por sua vez, é o objeto que você adquiriu quando firmou aquele acordo. Ele está com você agora.'),
        ],
      },
    ],
  },
  n('mine', 'Ao encarar o próprio pulso, você encontra um acessório. Pode ser um relógio, um bracelete, uma braçadeira. A coisa se encontra ali.'),
  {
    kind: 'choice',
    stage: 'mine',
    mode: 'one',
    options: ['O acordo. Eu me lembro agora.', 'Que acordo? Eu não me lembro disso.', 'Então isso é real…'].map((label) => ({
      label,
      reply: [m('Entendo que você possa estar se sentindo estranho agora, {nome}, mas você deve começar o tutorial o quanto antes. As consequências por perder o primeiro dia não são pequenas. Precisa se apressar.', 'serious')],
    })),
  },
  n('mine', 'Uma notificação estranha. O bolso da sua roupa vibra.', { sfx: 'notify' }),
  n('phone', 'Ao conferir, você descobre seu celular. Na interface, há um novo aplicativo suspeito.'),
  n('phone', 'Seu nome é Devo.', { sfx: 'reveal' }),
  mel('Acesso liberado. Você agora pode usar os mais variados sistemas. Alguns desses são ajustes criados pela Companhia, mas não precisa se preocupar. Nós apenas queremos cuidar de você.', 'soft'),
  {
    kind: 'choice',
    stage: 'mine',
    mode: 'explore',
    options: [
      { label: 'Sistemas?', reply: [m('Isso vai ficar mais claro com o tempo.')] },
      { label: 'Ajustes?', reply: [m('Algumas coisas do sistema são… perigosas e confusas. Ajudamos a contornar isso.', 'serious')] },
      { label: 'Companhia?', reply: [m('Pense nisso como uma Força Militar. Somos uma organização mundialmente reconhecida, ainda que as pessoas normais não saibam sobre nós. Se existe algum tipo de lei nesse lugar, essa lei vem da Companhia.', 'serious')] },
    ],
  },
  n('mine', 'Melissa parece retirar alguma coisa do bolso. O som de papéis é engraçado.'),
  mel('Aqui, fique com isso. É um investimento da Companhia.', 'soft'),
  n('mine', 'Você adquiriu: Cartas Iniciais.', { sfx: 'card' }),
  mel('Além das cartas iniciais, há muitas outras coisas como essa, até mais raras, por aí. A Companhia costuma investir em bons talentos, então se destaque para conseguir mais.'),
  {
    kind: 'choice',
    stage: 'mine',
    mode: 'one',
    options: [
      { label: 'Devolver', reply: [m('Não quer mesmo? Tudo bem.', 'serious')] },
      {
        label: 'Obrigado. Eu vou usar bem… Mas como?',
        reply: [m('O Tutorial vai começar. Cheque seu aplicativo Devo no celular. Há uma parte dedicada chamada “Deadly Vote”, onde você poderá encontrar o acesso gerado para a primeira vez. Quando completar, volte aqui. Muitas novas funções serão desbloqueadas depois disso.')],
      },
    ],
  },
  {
    kind: 'choice',
    stage: 'mine',
    mode: 'one',
    options: [
      { label: 'Você sabe me dizer mais sobre mim?', reply: [m('A perda de memória é um problema frequente para aqueles que se tornaram Records. Gradualmente, essas coisas costumam voltar. Você até sabe seu nome… então já é um começo. Acredite.', 'soft')] },
      { label: 'Eu vou tentar.', reply: [m('Tentar e vencer, assim espero.', 'soft')] },
      { label: 'Ir embora', reply: [m('Até logo, {nome}. Nós da Companhia de Despertados te desejamos boa sorte. E boas-vindas também.', 'soft')] },
    ],
  },
]
