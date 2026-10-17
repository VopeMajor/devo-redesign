/**
 * Textos dos 22 Arcanos (pedido do dono, 17/10). O doc "Upgrade Virtudes" NÃO traz descrição, fisiologia nem
 * Estágios por Arcano — só a tabela de afinidade e notas curtas (ex.: Morte). Tudo abaixo é RASCUNHO escrito a
 * partir do simbolismo do tarô e da tabela (Virtude excelente e deficiente de cada um), marcado `provisorio`.
 * O Owner edita na Mesa › Virtudes (devo_config 'virtudes.arcanos'); o que não foi editado cai aqui.
 * Fisiologia em palavras, sem números ("NÃO É PRECISO SE PREOCUPAR COM OS NÚMEROS").
 * Arquivo PURO (cliente e servidor).
 */
import type { ArcanoKey } from './virtudes'

export type EstagioTexto = { nome: string; linha: string }
export type ArcanoTexto = {
  /** Uma ou duas frases: o que todo jogador vê, mesmo com o Arcano trancado. */
  breve: string
  descricao: string
  fisiologia: string
  /** Um por Estágio, em ordem (o padrão do sistema tem cinco). */
  estagios: EstagioTexto[]
}
export type ArcanoTextoCfg = ArcanoTexto & { provisorio: boolean }

/** Limites de tamanho (validação no servidor e contadores na Mesa). */
export const TEXTO_LIMITES = { breve: 260, descricao: 1400, fisiologia: 900, nome: 40, linha: 180, estagiosMin: 1, estagiosMax: 10 } as const

const e = (...pares: [string, string][]): EstagioTexto[] => pares.map(([nome, linha]) => ({ nome, linha }))

export const ARCANOS_RASCUNHO: Record<ArcanoKey, ArcanoTexto> = {
  louco: {
    breve: 'O começo antes de qualquer caminho. Quem carrega o Louco anda sem mapa e, por algum motivo, raramente cai.',
    descricao:
      'O Louco é o passo dado antes de saber onde o chão termina. Não pede preparo nem permissão. Seus portadores costumam chegar aos lugares por acaso e sair deles inteiros, o que irrita quem planejou tudo. A carta não promete sorte, promete movimento, e cobra por ele mais tarde.',
    fisiologia:
      'O corpo responde antes da cabeça. Reflexos e coordenação (Espadas) crescem com facilidade, e o Louco desvia do que nem chegou a ver. O fôlego é o preço: resistência e vigor (Paus) quase não se acumulam, e o cansaço chega cedo e de uma vez.',
    estagios: e(
      ['Passo em falso', 'O corpo já reage sozinho, mas ainda tropeça no próprio impulso.'],
      ['Andarilho', 'Os reflexos se firmam e as quedas viram desvios.'],
      ['Beira do abismo', 'Consegue ficar onde os outros recuariam, por um instante a mais.'],
      ['Salto', 'O movimento deixa de ser fuga e passa a ser escolha.'],
      ['Zero', 'Nenhum caminho o prende, e nenhum o sustenta por muito tempo.'],
    ),
  },
  mago: {
    breve: 'Vontade aplicada sobre a matéria. O Mago tem as ferramentas na mesa e sabe o que cada uma faz.',
    descricao:
      'O Mago é o primeiro a dar forma ao que deseja. Sobre a mesa estão os quatro naipes, e ele sabe usá-los, o que já é mais do que a maioria pode dizer. Seus portadores tendem ao controle: estudam, testam, repetem. O sobrenatural não os assusta porque, para eles, é só mais um material de trabalho.',
    fisiologia:
      'O domínio sobrenatural (Taças) cresce rápido e com precisão, e a mente (Ouros) acompanha de perto. O corpo fica para trás. Resistência e vigor (Paus) mal respondem, e um esforço físico longo esgota o Mago antes do que ele costuma admitir.',
    estagios: e(
      ['Aprendiz', 'Sente que há algo a manipular, sem ainda saber onde segurar.'],
      ['Mesa posta', 'As ferramentas obedecem, desde que haja tempo e silêncio.'],
      ['Mão firme', 'O efeito sai na primeira tentativa.'],
      ['Canal', 'O que está em cima e o que está embaixo passam pelo mesmo corpo.'],
      ['Magus', 'Entre a vontade e o resultado já não há intervalo.'],
    ),
  },
  sacerdotisa: {
    breve: 'Conhecimento guardado atrás de um véu. A Sacerdotisa sabe mais do que diz, e diz pouco.',
    descricao:
      'A Sacerdotisa senta entre duas colunas e não se levanta. O que ela conhece não veio de livro e não se ensina em voz alta. Portadores desse Arcano escutam antes de agir, percebem o que corre por baixo da conversa e guardam para si. Costumam ser subestimados e raramente se incomodam com isso.',
    fisiologia:
      'A sensibilidade ao sobrenatural (Taças) é a Virtude mais alta, seguida pelo corpo leve e ágil (Copas). Falta fundo: resistência e vigor (Paus) quase não sobem, e ela sente o desgaste físico mais do que sente uma ferida.',
    estagios: e(
      ['Noviça', 'Percebe o véu, mas ainda não vê através dele.'],
      ['Guardiã', 'Aprende o que deve ficar calado.'],
      ['Entre colunas', 'Ocupa o lugar entre o que se sabe e o que não se diz.'],
      ['Pergaminho', 'Lê o que os outros escondem até de si mesmos.'],
      ['Véu erguido', 'Nada mais lhe é oculto, e ela continua sem contar.'],
    ),
  },
  imperatriz: {
    breve: 'Abundância, cuidado e crescimento. Onde a Imperatriz se assenta, as coisas florescem, inclusive as que não deveriam.',
    descricao:
      'A Imperatriz é fertilidade no sentido mais amplo: ela faz crescer. Pessoas, alianças, rumores. Seus portadores atraem gente sem esforço e mantêm essa gente por perto com uma generosidade que nem sempre é desinteressada. O que a Imperatriz cultiva costuma durar; o que ela abandona seca depressa.',
    fisiologia:
      'O domínio sobrenatural (Taças) cresce com naturalidade, e a influência sobre os outros (Escudos) vem logo atrás. O corpo é o ponto fraco. Resistência e vigor (Paus) quase não respondem, e a Imperatriz depende de quem está em volta mais do que gostaria.',
    estagios: e(
      ['Semente', 'Algo começa a crescer em volta, ainda sem direção.'],
      ['Jardim', 'Quem fica perto dela demora a querer ir embora.'],
      ['Colheita', 'O que foi plantado passa a render.'],
      ['Trono verde', 'Governa pelo que oferece, e não pelo que exige.'],
      ['Mãe de tudo', 'Tudo o que toca cresce, mas nem tudo cresce a favor dela.'],
    ),
  },
  imperador: {
    breve: 'Ordem, território e comando. O Imperador estabelece as regras e espera que sejam cumpridas.',
    descricao:
      'O Imperador senta num trono de pedra e não tem pressa de levantar. É o Arcano da estrutura: leis, fronteiras, hierarquia. Seus portadores ocupam espaço sem pedir licença, e as pessoas, por algum motivo, aceitam. A autoridade dele vem menos de saber mais que os outros e mais de nunca parecer em dúvida.',
    fisiologia:
      'A influência (Escudos) é o que mais cresce: a voz pesa e a presença ocupa a sala. Logo atrás vem o domínio sobrenatural (Taças). A mente (Ouros) é a Virtude que menos responde. O Imperador decide rápido e raramente revisa, o que nem sempre é uma qualidade.',
    estagios: e(
      ['Herdeiro', 'Ainda obedece, mas já sabe que não vai obedecer por muito tempo.'],
      ['Senhor de terra', 'Tem um pedaço de chão e as pessoas que vivem nele.'],
      ['Lei', 'O que ele diz passa a valer mesmo quando ele não está.'],
      ['Trono de pedra', 'Não precisa mais levantar a voz.'],
      ['Soberano', 'A ordem existe porque ele existe.'],
    ),
  },
  hierofante: {
    breve: 'Tradição, rito e ensinamento. O Hierofante é a ponte entre o sagrado e quem precisa de regras para alcançá-lo.',
    descricao:
      'O Hierofante guarda as chaves e conhece os ritos. É o Arcano das instituições, das doutrinas e de quem as transmite. Seus portadores costumam ser procurados para conselho, e aconselham mesmo quando ninguém pediu. A tradição dá conforto a quem a segue e mantém a porta fechada para quem não segue.',
    fisiologia:
      'O domínio sobrenatural (Taças) cresce pelo rito e pela repetição, e os reflexos (Espadas) vêm a seguir. O corpo em si, força e velocidade (Copas), é o que menos responde. O Hierofante não foi feito para correr nem para carregar peso.',
    estagios: e(
      ['Acólito', 'Repete os gestos antes de entender o que significam.'],
      ['Pregador', 'As palavras certas começam a ter efeito.'],
      ['Guardião das chaves', 'Decide quem entra e quem espera.'],
      ['Pontífice', 'O que vem do alto passa por ele antes de chegar aos outros.'],
      ['Dogma', 'O que ele afirma deixa de ser discutido.'],
    ),
  },
  enamorados: {
    breve: 'Escolha, vínculo e desejo. Os Enamorados lembram que toda união começa com uma decisão difícil.',
    descricao:
      'Os Enamorados falam de amor, mas também da escolha entre dois caminhos e do que se perde ao escolher. Seus portadores criam laços com facilidade e são difíceis de recusar. Há sedução nisso, só que o centro é outro: eles sabem o que as pessoas querem ouvir e, quase sempre, o que elas querem fazer.',
    fisiologia:
      'A influência (Escudos) é a Virtude mais forte: atração, persuasão, a confiança dos outros. O domínio sobrenatural (Taças) vem em seguida. Os reflexos (Espadas) são o ponto mais fraco. O corpo dos Enamorados hesita, e na hesitação perde o tempo de reagir.',
    estagios: e(
      ['Olhar', 'Alguém repara. Depois, mais alguém.'],
      ['Encruzilhada', 'Precisa escolher, e o corpo sente o peso da escolha.'],
      ['Laço', 'Os vínculos que cria passam a segurar de verdade.'],
      ['União', 'Duas vontades caminham juntas, ao menos por um tempo.'],
      ['Coração dividido', 'Pode ser amado por todos e ainda assim escolhe sozinho.'],
    ),
  },
  carro: {
    breve: 'Vontade em movimento. O Carro avança porque decidiu avançar e arrasta junto o que estiver amarrado nele.',
    descricao:
      'O Carro é conquista pela disciplina. Duas forças puxam em direções opostas, e quem está no comando as mantém no mesmo rumo. Seus portadores são persistentes, competitivos e às vezes impossíveis de parar. Vencem menos pela sorte do que pela recusa em diminuir o passo.',
    fisiologia:
      'Reflexos e controle motor (Espadas) crescem melhor que tudo, com força e velocidade (Copas) logo atrás. O sobrenatural (Taças) quase não encontra espaço. O corpo do Carro é feito para o mundo concreto e parece não perceber o resto.',
    estagios: e(
      ['Rédea', 'Aprende a segurar duas forças ao mesmo tempo.'],
      ['Partida', 'O corpo arranca antes de a ordem terminar.'],
      ['Estrada', 'Mantém o ritmo quando os outros já pararam.'],
      ['Triunfo', 'Chega primeiro, e chega inteiro.'],
      ['Conquistador', 'Nada no caminho continua sendo obstáculo por muito tempo.'],
    ),
  },
  forca: {
    breve: 'Coragem paciente. A Força segura a boca do leão com a mão aberta, e o leão deixa.',
    descricao:
      'A Força é domínio sobre o que é selvagem, dentro e fora. A carta mostra calma diante do perigo, e não fúria. Seus portadores impressionam pelo físico, mas o que os define é o controle. Quando perdem a paciência o estrago é grande, e por isso aprendem cedo a não perder.',
    fisiologia:
      'O corpo é a maior Virtude: força e velocidade (Copas) crescem sem esforço, e a resistência (Paus) acompanha. A mente (Ouros) é a que menos responde. Não se trata de falta de inteligência; o corpo da Força costuma resolver o problema antes de o pensamento terminar.',
    estagios: e(
      ['Fera', 'A força chega antes do controle.'],
      ['Mão estendida', 'Aprende a segurar sem apertar.'],
      ['Domadora', 'O que é selvagem passa a obedecer.'],
      ['Leão manso', 'A força fica e a fúria vai embora.'],
      ['Infinito', 'A calma e o poder já não se distinguem.'],
    ),
  },
  eremita: {
    breve: 'Busca solitária e prudência. O Eremita carrega uma lanterna que ilumina só o próximo passo.',
    descricao:
      'O Eremita se afasta para ver melhor. É o Arcano da introspecção, da paciência e do conhecimento conquistado em silêncio. Seus portadores costumam estar sozinhos, por escolha ou por costume, e pensam mais do que falam. Quando finalmente falam, convém ouvir.',
    fisiologia:
      'A mente (Ouros) é a Virtude mais forte: memória, atenção, cálculo. O corpo (Copas) responde bem, endurecido pelo caminho. O sobrenatural (Taças) é o que menos cresce. O Eremita confia na lanterna que tem na mão, e pouco no que ela não alcança.',
    estagios: e(
      ['Retiro', 'Afasta-se do barulho e começa a ouvir o resto.'],
      ['Lanterna', 'Ilumina o próximo passo, nunca mais que isso.'],
      ['Trilha', 'Conhece o caminho porque já errou em cada curva.'],
      ['Montanha', 'Chega onde poucos sobem e quase ninguém fica.'],
      ['Sábio', 'Sabe o bastante para medir o quanto ainda não sabe.'],
    ),
  },
  fortuna: {
    breve: 'A roda que gira. A Fortuna não é boa nem má; ela só não para.',
    descricao:
      'A Roda da Fortuna fala de ciclos, acaso e mudança. Quem está em cima desce, quem está embaixo sobe, e nenhum dos dois decide quando. Seus portadores percebem padrões onde os outros veem coincidência e apostam neles. Às vezes acertam, às vezes a roda gira antes.',
    fisiologia:
      'A mente (Ouros) cresce depressa, atenta a probabilidades e padrões, e o sobrenatural (Taças) vem em seguida. O corpo é o ponto mais frágil. Força e velocidade (Copas) mal se acumulam, e a Fortuna depende de estar no lugar certo, e não de chegar lá correndo.',
    estagios: e(
      ['Primeira volta', 'Nota que as coisas se repetem.'],
      ['Raio', 'Prevê a próxima posição, nem sempre a tempo.'],
      ['Eixo', 'Aprende a ficar no centro, onde a roda menos balança.'],
      ['Giro', 'Muda a própria sorte, uma volta de cada vez.'],
      ['Destino', 'Já não pergunta se vai cair, só quando.'],
    ),
  },
  justica: {
    breve: 'Equilíbrio e consequência. A Justiça pesa os dois lados e corta onde o peso indicar.',
    descricao:
      'A Justiça segura a balança numa mão e a espada na outra. É o Arcano da verdade, da responsabilidade e do preço de cada ato. Seus portadores têm pouca paciência com mentiras e menos ainda com desculpas. Não são cruéis, são exatos, e isso às vezes machuca mais.',
    fisiologia:
      'Reflexos e precisão (Espadas) são a Virtude mais alta: o golpe certo, no tempo certo. A mente (Ouros) acompanha. Força e velocidade (Copas) são o que menos cresce. A Justiça vence porque erra menos, e não porque bate mais forte.',
    estagios: e(
      ['Testemunha', 'Vê o que aconteceu, sem ainda poder julgar.'],
      ['Balança', 'Pesa os dois lados antes de se mover.'],
      ['Lâmina', 'Corta uma vez, onde precisa.'],
      ['Sentença', 'O que decide se cumpre.'],
      ['Equilíbrio', 'Perto dela, nenhuma dívida fica sem pagamento.'],
    ),
  },
  enforcado: {
    breve: 'Pausa, entrega e outro ponto de vista. O Enforcado está de cabeça para baixo e vê o que os outros não veem.',
    descricao:
      'O Enforcado está suspenso por um pé e não parece sofrer. É o Arcano do sacrifício voluntário e da espera que transforma. Seus portadores aguentam o que outros não aguentariam e tiram disso uma clareza estranha. Demoram a agir, mas raramente agem errado.',
    fisiologia:
      'Resistência e vigor (Paus) crescem mais que tudo; o corpo do Enforcado suporta dor, fome e tempo. A mente (Ouros) vem logo a seguir. Os reflexos (Espadas) são o ponto fraco. Ele reage tarde, porque foi feito para durar e não para desviar.',
    estagios: e(
      ['Corda', 'Aceita a posição, ainda sem entender por quê.'],
      ['Suspensão', 'Aprende a esperar sem se desgastar.'],
      ['Inversão', 'O mundo de cabeça para baixo começa a fazer sentido.'],
      ['Oferenda', 'Dá algo de si e recebe outra coisa em troca.'],
      ['Auréola', 'Aguenta quase tudo e entende quase tudo.'],
    ),
  },
  morte: {
    breve: 'Fim e transformação. A Morte encerra uma forma para que outra possa começar.',
    descricao:
      'A Morte encerra o que precisa ser encerrado. Raramente se trata de morrer de fato; trata-se de deixar uma forma para trás. Seus portadores têm uma ligação estreita com o sobrenatural e uma familiaridade desconfortável com perdas. As pessoas sentem isso e mantêm certa distância, mesmo sem saber explicar por quê.',
    fisiologia:
      'A ligação com o sobrenatural (Taças) é extrema, a mais forte entre as Virtudes, e a mente (Ouros) acompanha. O corpo, por outro lado, mal se sustenta: resistência e vigor (Paus) quase não existem. A Morte transforma o espírito com facilidade e carrega a própria carne com dificuldade.',
    estagios: e(
      ['Luto', 'Perde algo, e no lugar fica um espaço que sente o outro lado.'],
      ['Ceifa', 'Aprende a cortar o que já morreu.'],
      ['Passagem', 'Atravessa e volta, um pouco mais leve a cada vez.'],
      ['Cavaleiro', 'O sobrenatural responde sem que precise chamar.'],
      ['Renascer', 'Termina uma forma e começa outra, sem medo de nenhuma das duas.'],
    ),
  },
  temperanca: {
    breve: 'Medida, mistura e paciência. A Temperança passa a água de um cálice ao outro sem derramar.',
    descricao:
      'A Temperança é o Arcano do equilíbrio construído devagar. Mistura opostos até que deixem de brigar. Seus portadores são estáveis, difíceis de provocar e bons em consertar o que outros quebraram. Não chamam atenção, e também não costumam ser lembrados quando o mérito é dividido.',
    fisiologia:
      'Resistência e vigor (Paus) crescem com firmeza, e o corpo (Copas) segue de perto; as Virtudes sobem quase em escada, sem saltos. A influência (Escudos) é a que menos responde. A Temperança convence pelo exemplo, quase nunca pela presença.',
    estagios: e(
      ['Gota', 'Aprende que pouco todo dia rende mais que muito de uma vez.'],
      ['Dois cálices', 'Mistura o que tem sem perder nada.'],
      ['Água corrente', 'O corpo encontra um ritmo que não cansa.'],
      ['Alquimia', 'Os opostos dentro dela deixam de brigar.'],
      ['Meio-termo', 'Nada a tira do eixo por muito tempo.'],
    ),
  },
  diabo: {
    breve: 'Desejo, vício e corrente. O Diabo oferece exatamente o que se quer, e a corrente vem junto.',
    descricao:
      'O Diabo é o Arcano dos apegos: prazer, poder, o que prende sem que se perceba. As correntes da carta estão frouxas, e quem as usa poderia tirá-las. Seus portadores são carismáticos, intensos e perigosamente bons em descobrir o que os outros querem. Nem sempre exploram isso, mas quase sempre sabem que poderiam.',
    fisiologia:
      'Força e velocidade (Copas) são a Virtude mais forte: o corpo é intenso e impulsivo. O sobrenatural (Taças) vem logo atrás. Resistência e vigor (Paus) quase não crescem. O Diabo arde rápido e se esgota na mesma medida.',
    estagios: e(
      ['Tentação', 'Descobre o que quer e descobre que pode ter.'],
      ['Pacto', 'Ganha algo agora e deixa o preço para depois.'],
      ['Corrente', 'Aquilo que o prende passa a prender os outros também.'],
      ['Chama', 'Queima mais forte que os outros, e mais depressa.'],
      ['Senhor do desejo', 'Sabe o preço de cada pessoa, inclusive o próprio.'],
    ),
  },
  torre: {
    breve: 'Ruptura súbita. A Torre cai de uma vez, e o que estava escondido nela aparece.',
    descricao:
      'A Torre é o raio que derruba o que foi construído sobre mentira. Ninguém escolhe passar por ela. Seus portadores costumam ter atravessado algum colapso e saído do outro lado mais duros, mais diretos, menos interessados em aparências. Onde eles estão as coisas costumam desabar, às vezes de propósito.',
    fisiologia:
      'Resistência e vigor (Paus) são a Virtude mais alta: o corpo da Torre aguenta o impacto e se reergue. A força (Copas) vem em seguida. O sobrenatural (Taças) é o que menos cresce. A Torre conhece o mundo pelo choque, e quase nada pelo que não se vê.',
    estagios: e(
      ['Rachadura', 'Algo cede por dentro, e ainda dá para disfarçar.'],
      ['Raio', 'O golpe chega e o corpo aguenta.'],
      ['Queda', 'O que era falso desaba; o que sobra é sólido.'],
      ['Escombros', 'Aprende a ficar de pé no meio da ruína.'],
      ['Fundação', 'Já caiu de tudo, e por isso quase nada o derruba.'],
    ),
  },
  estrela: {
    breve: 'Esperança depois da queda. A Estrela não resolve nada, apenas lembra que ainda há para onde olhar.',
    descricao:
      'A Estrela vem logo depois da Torre, e não é por acaso. É calma, cura e fé, mas uma fé cansada, que já viu o pior. Seus portadores costumam dar ânimo a quem está perto sem perceber que o fazem. Não são ingênuos: escolheram acreditar e sabem o quanto isso custa.',
    fisiologia:
      'O sobrenatural (Taças) é a Virtude mais forte, e a influência (Escudos) segue de perto; a Estrela acalma e é ouvida. Os reflexos (Espadas) são o ponto mais fraco. Ela demora a reagir, e muitas vezes ainda está com os olhos no céu quando o golpe chega.',
    estagios: e(
      ['Brilho fraco', 'Uma luz pequena, que ainda some com o vento.'],
      ['Água', 'O que derrama sobre os outros começa a curar.'],
      ['Constelação', 'Outras luzes se alinham com a dela.'],
      ['Guia', 'Quem está perdido a encontra sem procurar.'],
      ['Firmamento', 'Continua acesa mesmo quando tudo em volta apagou.'],
    ),
  },
  lua: {
    breve: 'Ilusão, instinto e medo. Sob a Lua o caminho existe, mas nada nele é o que parece.',
    descricao:
      'A Lua ilumina pouco e distorce muito. É o Arcano do inconsciente, dos sonhos e das ameaças que podem ou não ser reais. Seus portadores enxergam bem no escuro, no sentido literal e no outro. Lidam com a dúvida melhor do que a maioria, e às vezes são eles que a provocam.',
    fisiologia:
      'A mente (Ouros) é a Virtude mais alta: percepção, intuição, leitura do que está mal iluminado. A influência (Escudos) vem a seguir. Resistência e vigor (Paus) quase não crescem, e a Lua se cansa rápido sob a luz do dia.',
    estagios: e(
      ['Crepúsculo', 'Começa a ver o que a luz forte esconde.'],
      ['Uivo', 'Os instintos falam mais alto que o pensamento.'],
      ['Reflexo', 'Distingue o que é real do que é só a água tremendo.'],
      ['Maré', 'Puxa os outros sem que percebam o movimento.'],
      ['Lua cheia', 'Já não separa o que vê do que imagina, e sabe usar isso.'],
    ),
  },
  sol: {
    breve: 'Clareza, vitalidade e exposição. Sob o Sol nada fica escondido, nem as coisas boas.',
    descricao:
      'O Sol é o Arcano mais simples de ler: alegria, saúde, sucesso. Também é o mais exposto. Seus portadores têm energia de sobra, presença franca e pouca paciência para mistério. São fáceis de gostar e difíceis de enganar, porque não deixam sombra onde algo possa se esconder.',
    fisiologia:
      'Força e velocidade (Copas) são a Virtude mais forte, e a influência (Escudos) acompanha: o corpo do Sol é vivo e chama atenção. O sobrenatural (Taças) é o que menos cresce. O Sol não acredita no que não vê, e o invisível parece retribuir.',
    estagios: e(
      ['Aurora', 'O corpo acorda com mais força do que tinha.'],
      ['Manhã', 'Uma energia que dura o dia inteiro.'],
      ['Meio-dia', 'Sem sombra, sem dúvida, sem disfarce.'],
      ['Coroa', 'Os outros passam a se orientar por ele.'],
      ['Sol pleno', 'Brilha tanto que fica difícil olhar direto.'],
    ),
  },
  julgamento: {
    breve: 'Chamado e despertar. O Julgamento soa a trombeta, e quem ouve não consegue voltar a dormir.',
    descricao:
      'O Julgamento é o momento em que se responde por tudo e se renasce depois. Diferente da Justiça, ele não pesa nem sentencia: ele chama. Seus portadores costumam ter convicções súbitas e firmes sobre o que precisam fazer, e agem rápido quando elas chegam. Pensar a respeito vem depois, quando vem.',
    fisiologia:
      'Reflexos e prontidão (Espadas) são a Virtude mais alta: o corpo do Julgamento atende ao chamado antes de qualquer dúvida. A força (Copas) vem a seguir. A mente (Ouros) é a que menos cresce. Ele age por convicção, e a reflexão fica para trás.',
    estagios: e(
      ['Eco', 'Ouve algo que os outros não ouvem.'],
      ['Trombeta', 'O chamado fica alto demais para ignorar.'],
      ['Despertar', 'Levanta-se de onde estava e não volta.'],
      ['Ressurreição', 'O que estava morto nele volta a se mover.'],
      ['Veredito', 'Responde por tudo o que fez, e segue.'],
    ),
  },
  mundo: {
    breve: 'Conclusão e totalidade. O Mundo é o fim do ciclo, quando as peças finalmente encaixam.',
    descricao:
      'O Mundo é o último Arcano maior: a viagem completa, o círculo fechado. Seus portadores parecem à vontade em qualquer lugar e com qualquer pessoa, e costumam estar no centro de algo maior que eles mesmos. Não têm pressa. Sabem que, quando um ciclo fecha, outro começa, e o Louco volta a dar o primeiro passo.',
    fisiologia:
      'A influência (Escudos) é a Virtude mais forte: o Mundo integra, reúne e é aceito. O sobrenatural (Taças) vem logo atrás. Força e velocidade (Copas) são o que menos cresce. O Mundo não precisa correr para chegar aos lugares; de algum modo, já está neles.',
    estagios: e(
      ['Viajante', 'Cada lugar ensina uma parte do todo.'],
      ['Coroa de louros', 'É reconhecido por onde passa.'],
      ['Dança', 'Movimento e repouso deixam de ser opostos.'],
      ['Círculo', 'As pontas soltas se juntam em volta dele.'],
      ['Totalidade', 'Completo, e pronto para começar de novo.'],
    ),
  },
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Normaliza o que veio da Mesa. Devolve null se faltar algo obrigatório. */
export function limparTexto(v: unknown): ArcanoTexto | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const L = TEXTO_LIMITES
  const breve = str(o.breve, L.breve)
  const descricao = str(o.descricao, L.descricao)
  const fisiologia = str(o.fisiologia, L.fisiologia)
  if (!breve || !descricao || !fisiologia || !Array.isArray(o.estagios)) return null
  if (o.estagios.length < L.estagiosMin || o.estagios.length > L.estagiosMax) return null
  const estagios = o.estagios.map((x) => ({ nome: str((x as EstagioTexto)?.nome, L.nome), linha: str((x as EstagioTexto)?.linha, L.linha) }))
  if (estagios.some((x) => !x.nome)) return null
  return { breve, descricao, fisiologia, estagios }
}
