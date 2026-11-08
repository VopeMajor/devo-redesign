// Corporações: dados do jogo (scripts/corporacoes-migration.sql, lib/devo/corporacoes.ts) e a chamada da Melissa com o texto
// literal do dono (lib/devo/dialogo/cenas/melissa-corporacoes.ts). Corporações, Records e códigos são exemplos para mostrar a tela.
const CO_CFG={custo:360,reserva:120,maxMembros:12,porDia:5,dvExigido:1,cartasExigidas:3,multa:30};
const CO_REGRAS={titulo:'Código da Companhia de Despertados',artigos:[
  'I. Toda Corporação se registra na Companhia e mantém o código de identificação em dia.',
  'II. Nenhuma Corporação pode sabotar Deadly Votes, fraudar trocas ou coagir Records a entrar ou permanecer.',
  'III. Cartas transferidas entre membros não podem ser revendidas para quem está fora da Corporação no mesmo dia.',
  'IV. Líder e vice-líder respondem pelos atos da Corporação diante da Companhia.',
  'V. A violação deste código classifica a Corporação como Necro-Corporação.',
]};
const CO_JOGOS=[
  {id:'vigilia',titulo:'Vigília Coletiva',d:'Um jogo especial em que a Corporação inteira divide o mesmo relógio.',min:3},
  {id:'torneio',titulo:'Torneio entre Corporações',d:'Disputa entre Corporações oficiais, com prêmios para todos os membros.',min:4},
];
const CO_FORMAS=[['escudo','Escudo'],['losango','Losango'],['estrela','Estrela'],['sol','Sol'],['coroa','Coroa'],['chave','Chave'],['lua','Lua'],['relogio','Relógio'],['ampulheta','Ampulheta'],['torre','Torre'],['cruz','Cruz'],['rosa','Rosácea']];
const CO_CORES={aco:['Aço champanhe','#ece5d8','#bab09f','#6b6357',1],porcelana:['Porcelana','#ffffff','#e0ddd8','#8f8e8b',1],onix:['Ônix','#4f4f55','#2c2c31','#0c0c0e',0],ametista:['Ametista','#c2b9ec','#8a7cc8','#463d78',0],vinho:['Vinho','#8a2a33','#5c1119','#2a0609',0],noite:['Céu noturno','#4a4760','#2b2a35','#121118',0],rubi:['Rubi','#d0707c','#a3121f','#3f060b',0],marfim:['Marfim','#d6ccb7','#e6dcc4','#a79a7c',1],bronze:['Bronze velho','#c8a27a','#8a6a48','#3b2a1a',0],prata:['Prata fria','#f1f2f5','#b8bcc6','#5f636e',1],cobalto:['Cobalto','#7c86c9','#3a4590','#141a3d',0],musgo:['Musgo','#8fa08a','#4f5f4b','#1c241b',0]};
const CO_DIVISOES=[['pleno','Pleno'],['partido','Partido'],['cortado','Cortado'],['quartelado','Quartelado'],['banda','Em banda'],['chaveirao','Chaveirão'],['faixa','Faixa']];
const CO_FIGURAS=[['inicial','Inicial'],['olho','Olho'],['chave','Chave'],['ampulheta','Ampulheta'],['espada','Espada'],['rosa','Rosa'],['lua','Lua'],['coroa','Coroa'],['relogio','Relógio'],['torre','Torre'],['mascara','Máscara'],['estrela','Estrela'],['corvo','Corvo']];
const CO_ORNATOS=[['nenhum','Nenhum'],['louros','Louros'],['asas','Asas'],['espadas','Espadas cruzadas'],['correntes','Correntes'],['raios','Raios']];
const CO_CARGO={lider:'Líder',vice:'Vice-líder',membro:'Membro'};
const CO_ALFABETO='ACDEFGHJKMNPQRTUVWXY34679';
// Records de exemplo fora de qualquer Corporação, para o convite pelo nome
const CO_LIVRES=['Matheus','Velada','Sol','Tiago'];
const CO_CENA=[
  {n:'Enquanto estou distraíd{o|a}, uma luz irrompe da tela do meu próprio celular. Um feixe azulado ilumina meu rosto, revelando-se semelhante à luz de uma lanterna.'},
  {n:'Procuro entender o que está acontecendo, mas, antes que consiga formular qualquer hipótese, vejo um holograma se materializar diante de mim. Nele, reconheço o rosto de alguém que já conheço.',holo:'materializa'},
  {p:'sorriso',t:'Olá, Record. Sou eu mais uma vez. Como vai?'},
  {p:'explica',t:'Você já deve ter ouvido falar da Companhia de Despertados, organização da qual faço parte. Na verdade, fui eu quem lhe contou sobre ela e sobre a nossa função. Certo?'},
  {p:'pensativo',t:'Pois bem. Saiba que não somos a única entidade perambulando por aí.'},
  {p:'explica',t:'Grupos menores, organizados por indivíduos como você, surgem a todo momento.'},
  {p:'preocupado',t:'Essas pequenas equipes são formadas para alcançar objetivos em comum, geralmente relacionados à sobrevivência de seus integrantes nos jogos perigosos que estão por vir.'},
  {p:'apresenta',t:'Todas elas são conhecidas como *Corporações* pela *Companhia de Despertados*.'},
  {p:'convite',t:'Existem muitas vantagens em fazer parte de uma *Corporação* competente. Você pode transferir cartas entre membros ou participar de jogos coletivos especiais, por exemplo.'},
  {p:'pensativo',t:'Naturalmente, algumas dessas *Corporações* acabam se desviando do caminho correto.'},
  {p:'explica',t:'Por esse motivo, nós, da *Companhia de Despertados*, estabelecemos um código de regras que toda *Corporação* precisa seguir caso queira ser reconhecida como oficial e legal.'},
  {p:'preocupado',t:'Quando essas regras são violadas, a *Corporação* passa a ser classificada como terrorista. São as chamadas *Necro-Corporações*.'},
  {p:'confiante',t:'Eu recomendaria que você ficasse bem longe delas se quiser levar uma vida tranquila.'},
  {esc:[
    ['Como posso entrar em uma Corporação?',[{p:'sorriso',t:'Entrar em uma Corporação é muito fácil, mas preciso que você espere um pouco antes de dar esse passo.'}]],
    ['Parece interessante. Onde encontro uma Necro-Corporação?',[{p:'surpreso',t:'Record... Que coisa horrível.'},{n:'Uma determinada quantidade de tempo é retirada do seu Shuffler.',multa:true},{p:'confiante',t:'Como você ainda é iniciante, vou deixar passar desta vez.'}]],
    ['Eu quero mais é ficar na minha.',[{p:'pensativo',t:'É uma opção, embora bastante irresponsável. Poucos Records alcançam o sucesso trabalhando sozinhos. E, entre aqueles que conseguem, a maioria já participou de alguma *Corporação* em determinado momento. Além disso, existem muito mais vantagens em fazer parte de uma equipe do que em enfrentar tudo por conta própria.'}]],
  ]},
  {p:'explica',t:'Para entrar em uma *Corporação*, você precisa adquirir o código de identificação dela e inseri-lo no campo correspondente na página de *Corporações*.'},
  {p:'explica',t:'Feito isso, basta aguardar até que o líder ou vice-líder aprove sua entrada. Durante o processo, ele terá acesso a determinadas partes do seu perfil.'},
  {p:'apresenta',t:'Na maioria das vezes, você não encontrará anúncios de recrutamento por aí. Portanto, é bom aproveitar as oportunidades quando surgirem. Quando acontecem, essas divulgações são mais frequentes no *Salão das Máscaras*.'},
  {p:'convite',t:'Outra possibilidade é receber um convite diretamente de um *Record* que já faça parte de alguma *Corporação*.'},
  {esc:[
    ['Salão das Máscaras?',[{p:'riso',t:'Caso já tenha desbloqueado esse recurso, você encontrará o ícone de uma máscara no *Menu do Devo*. Ele representa o *Salão das Máscaras*. Caso contrário... Bem, paciência.'}]],
    ['E se eu quiser criar uma?',[{p:'explica',t:'Se quiser criar sua própria *Corporação*, precisará investir uma determinada quantidade de tempo e obter aprovação legal. A avaliação administrativa levará em consideração se o seu perfil corresponde aos requisitos exigidos.'}]],
    ['Entendi.',[]],
  ]},
  {p:'confiante',t:'Lembre-se sempre de tomar cuidado com as *Corporações Rivais* e com as outras *Corporações Globais*. Elas não são tão boazinhas quanto nós.'},
  {n:'A chamada é encerrada antes que eu possa me despedir de Melissa — ou perguntar a ela o que exatamente são essas tais Corporações Globais.',holo:'encerra'},
  {n:'Será que eu deveria tomar mais cuidado daqui em diante?'},
];
