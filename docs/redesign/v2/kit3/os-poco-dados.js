// Gerado por art-src/poco_px.py a partir de lib/devo/poco-neblina.ts e poco.ts: não editar à mão.
const N=(id,texto,palco)=>({id,tipo:'fala',quem:'narrador',texto,palco}),J=(id,texto,palco)=>({id,tipo:'fala',quem:'jogador',texto,palco}),F=(id,texto,palco)=>({id,tipo:'fala',quem:'figura',texto,palco});
const NEBLINA=[
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
const POCO_LIXO=[
  { id: 'agua_suja', nome: 'Água suja', texto: 'Um balde de água turva. Tem algo se mexendo no fundo, mas você prefere não saber.' },
  { id: 'pedra', nome: 'Uma pedra', texto: 'Lisa, fria e profundamente comum. O poço achou que você precisava de uma.' },
  { id: 'tampao', nome: 'Tampão de lixo', texto: 'A tampa de uma lixeira. O cheiro veio junto, de brinde.' },
  { id: 'curativo', nome: 'Curativo usado', texto: 'Ainda grudento. Alguém se machucou tentando a sorte antes de você.' },
  { id: 'meia', nome: 'Meia sem par', texto: 'O par está em algum lugar por aí, provavelmente mais feliz.' },
  { id: 'dente', nome: 'Um dente', texto: 'Não é seu. Pelo menos você espera que não seja.' },
  { id: 'boleto', nome: 'Boleto vencido', texto: 'Nem o poço quis pagar.' },
  { id: 'chiclete', nome: 'Chiclete mascado', texto: 'Ainda tem um resto de gosto de morango. Infelizmente.' },
  { id: 'tampa', nome: 'Tampa de garrafa', texto: 'Alguém já tentou a sorte com isto antes de você.' },
  { id: 'chave_torta', nome: 'Chave torta', texto: 'Não abre nada. Talvez já tenha aberto, um dia.' },
  { id: 'nada', nome: 'Nada', texto: 'O balde volta vazio, pingando. O poço ficou com a moeda.' },
]
