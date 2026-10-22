/**
 * Textos dos 22 Arcanos (pedido do dono, 17/10). O doc "Upgrade Virtudes" NÃO traz descrição, fisiologia nem
 * Estágios por Arcano — só a tabela de afinidade e notas curtas (ex.: Morte). O que está abaixo é RASCUNHO escrito
 * a partir do simbolismo do tarô e da tabela (Virtude excelente e deficiente de cada um), marcado `provisorio`,
 * com uma exceção: a Força, que traz o texto do dono de 22/10 (docs/redesign/ARCANOS-forca-dono.md), literal.
 * O Owner edita na Mesa › Virtudes (devo_config 'virtudes.arcanos'); o que não foi editado cai aqui.
 *
 * Estágios: 0 a VII (o índice no array É o número do Estágio). 0 = "A Essência", o que vem com o Arcano no
 * tutorial. Nos rascunhos, os cinco Estágios antigos viraram I..V; VI e VII ainda não foram revelados
 * (nome vazio). `texto` = corpo longo do Estágio (parágrafos separados por linha em branco; uma linha inteira
 * entre *asteriscos* vira subtítulo; *trecho* no meio da frase vira destaque). Arquivo PURO (cliente e servidor).
 */
import type { ArcanoKey } from './virtudes'

/** `nome` vazio = Estágio ainda não revelado (o dono não escreveu). */
export type EstagioTexto = { nome: string; linha: string; texto?: string }
export type ArcanoTexto = {
  /** Uma ou duas frases: o que todo jogador vê, mesmo com o Arcano trancado. */
  breve: string
  descricao: string
  fisiologia: string
  /** Oito, do Estágio 0 ao VII (índice = número do Estágio). */
  estagios: EstagioTexto[]
}
export type ArcanoTextoCfg = ArcanoTexto & { provisorio: boolean }

/** Quantos Estágios existem (0..VII). */
export const N_ESTAGIOS = 8

/** Limites de tamanho (validação no servidor e contadores na Mesa). */
export const TEXTO_LIMITES = { breve: 260, descricao: 3000, fisiologia: 4000, nome: 40, linha: 300, texto: 9000, estagiosMin: 1, estagiosMax: N_ESTAGIOS } as const

/** Estágio 0 de todos os Arcanos (frase do Estágio 0 da Força, do dono, que já é genérica). */
export const ESTAGIO_ESSENCIA: EstagioTexto = {
  nome: 'A Essência',
  linha: 'Ainda não há nada de particularmente extraordinário. Você é, em essência, aquilo que sempre foi, sem manifestações especiais decorrentes da evolução deste Arcano.',
}
const VAZIO: EstagioTexto = { nome: '', linha: '' }

/** Rascunho: Essência + os cinco Estágios antigos como I..V + VI e VII não revelados. */
const e = (...pares: [string, string][]): EstagioTexto[] => completarEstagios([ESTAGIO_ESSENCIA, ...pares.map(([nome, linha]) => ({ nome, linha }))])

/** Completa (ou corta) a lista para os oito Estágios, 0..VII. */
export function completarEstagios(l: EstagioTexto[]): EstagioTexto[] {
  return Array.from({ length: N_ESTAGIOS }, (_, i) => l[i] ?? VAZIO)
}

/** Texto salvo antes dos Estágios 0..VII (sem `base: 0`): os Estágios eram I..V, então ganham a Essência na frente. */
export function migrarTextoAntigo(t: ArcanoTexto): ArcanoTexto {
  return { ...t, estagios: completarEstagios([ESTAGIO_ESSENCIA, ...t.estagios]) }
}

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
  // Texto do dono (22/10/2026), literal: docs/redesign/ARCANOS-forca-dono.md. O Estágio IV ainda não foi
  // escrito e o VII ("Tirano") só tem o nome.
  forca: {
    breve: 'Coragem paciente. A Força segura a boca do leão com a mão aberta, e o leão deixa.',
    descricao:
      'O Arcano da Força é a 11ª (XI) carta dos Arcanos Maiores e representa coragem, autocontrole, determinação e poder interior. Diferentemente da força puramente física, este Arcano simboliza a capacidade de dominar os próprios instintos e continuar avançando mesmo diante da dor, do medo ou da adversidade.',
    fisiologia: `Os usuários da Força possuem capacidades físicas extraordinárias quando comparados à média humana, especialmente em durabilidade, explosão muscular e recuperação corporal. Sua constituição favorece os atributos de *Força e Resistência*, permitindo que suportem esforços prolongados e cargas consideráveis sem se esgotarem tão rapidamente quanto uma pessoa comum.

Para fins de referência, um usuário seria capaz de transportar um saco de cimento por dezenas de metros sem ficar completamente exaurido. Com esforço adicional, poderia carregar até três sacos simultaneamente, embora isso ainda imponha limitações consideráveis ao seu corpo.

Além disso, quando acometidos por cansaço intenso ou ferimentos de gravidade moderada, apresentam maior facilidade para se recuperar em comparação à maioria das pessoas. Isso não significa que sejam imunes à exaustão ou que possam ignorar as consequências de seus ferimentos, mas que seu organismo possui uma capacidade de recuperação naturalmente superior.`,
    estagios: [
      {
        nome: 'A Essência',
        linha: '',
        texto: 'Ainda não há nada de particularmente extraordinário. Você é, em essência, aquilo que sempre foi, sem manifestações especiais decorrentes da evolução deste Arcano.',
      },
      {
        nome: 'Resiliente',
        linha: '',
        texto: `O primeiro estágio não o diferencia drasticamente das demais pessoas, mas sua presença já transmite algo difícil de ignorar: uma firmeza que pode ser interpretada como confiança, imponência ou obstinação.

Desde cedo, você aprendeu que suportar a dor faz parte da sobrevivência. Enquanto outros recuam diante da pressão, você continua avançando. Não necessariamente porque seja destemido, mas porque desistir raramente parece uma opção aceitável.

Uma habilidade passiva é adquirida.

*Determinação Inabalável — Habilidade Passiva*

Você possui elevada tolerância à dor física e emocional, sendo menos propenso a fraquejar diante de situações adversas. Mesmo quando seu corpo começa a ceder ou as circunstâncias parecem desfavoráveis, é difícil fazê-lo desistir.

Testes relacionados à resistência física, à perseverança, à superação de adversidades ou à permanência em combate possuem dificuldade reduzida. Esse efeito, contudo, não anula ferimentos, incapacitação ou outras consequências que tornem determinada ação impossível.`,
      },
      {
        nome: 'Dominante',
        linha: '',
        texto: `*Aparência*

Sua presença se torna mais intensa e difícil de ignorar. As pessoas ao redor passam a sentir, ainda que instintivamente, que você não é alguém fácil de derrubar.

O crescimento de pelos corporais se intensifica. Em homens, essa característica é obrigatória; em mulheres, opcional. Os dentes tornam-se ligeiramente mais afiados que o normal, enquanto o corpo pode adquirir maior definição muscular, estatura e robustez. Seu olhar também ganha uma qualidade intimidadora, assumindo um brilho escarlate em momentos de raiva intensa.

*Fisiológico*

A força que existe em você aumentou consideravelmente. Agora, você não é apenas alguém capaz de enfrentar uma fera: começa a se tornar algo que se aproxima dela.

Sua força física passa a rivalizar com a de atletas de elite especializados em levantamento de peso. Você consegue erguer cargas extraordinárias para um ser humano comum e suportar o esforço envolvido, embora isso não o torne imune a lesões ou aos limites impostos por seu próprio corpo.

Sua pele também se torna ligeiramente mais espessa e resistente, mas ainda está longe de oferecer uma proteção significativa contra armas ou ataques de grande intensidade.

Uma habilidade ativa é adquirida.

*Instinto Selvagem — Habilidade Ativa*

Algo primitivo desperta dentro de você. Ao ativar esta habilidade, seus instintos de combate e sobrevivência são temporariamente intensificados, aumentando moderadamente sua força física, resistência e velocidade de reação.

Enquanto o efeito estiver ativo, o medo e a hesitação diminuem drasticamente, permitindo que você aja mesmo sob dor intensa ou pressão extrema. Em contrapartida, seu autocontrole se torna mais frágil: a impulsividade e a agressividade aumentam, especialmente quando você enxerga a cor vermelha ou sente o cheiro de sangue.

Nessas circunstâncias, seu comportamento pode se tornar semelhante ao de um lobo acuado, reagindo de maneira territorial e hostil diante de ameaças percebidas.

Durante a utilização da habilidade, testes relacionados à força física, à intimidação ou ao combate corporal recebem um bônus de *+4*.`,
      },
      {
        nome: 'A Fera',
        linha: '',
        texto: `A violência deixa de ser apenas uma possibilidade e passa a representar uma tentação constante. Sempre que alguém testa sua paciência, você sente despertar uma sede primitiva por confronto. Se alguém ousar atacá-lo, sua reação tende a ser imediata: recuar deixa de parecer uma alternativa, exceto quando ferimentos graves tornam a continuidade do combate inviável.

O medo não desapareceu completamente, mas perdeu boa parte de sua influência sobre suas decisões. Em seu lugar, resta um foco instintivo, semelhante à relação entre predador e presa.

*Fisiológico*

Sua pele se torna espessa e resistente como a de um urso, enquanto suas unhas adquirem a dureza e o fio de lâminas bem afiadas. Embora sua força bruta não aumente drasticamente em relação ao estágio anterior, seus sentidos e suas capacidades motoras evoluem consideravelmente.

Seu olfato torna-se mais apurado, permitindo identificar odores suspeitos com maior facilidade, a critério narrativo. Você também desenvolve uma coordenação corporal excepcional, conseguindo se deslocar por terrenos que representariam grandes dificuldades para a maioria dos humanos, como árvores, paredões rochosos e pântanos.

*Aparência*

Nos homens, o crescimento da barba torna-se quase incessante. Mesmo após apará-la, ela parece recuperar rapidamente o comprimento perdido. Nas mulheres, o cabelo tende a apresentar crescimento acelerado, tornando-se volumoso, hidratado e mais extenso.

Duas habilidades ativas são adquiridas.

*Imitação da Besta — Habilidade Ativa*

Como um animal selvagem, você consegue adaptar seu comportamento ao ambiente com facilidade. Ao observar ou ter contato com animais, pode imitar seus gestos, posturas e comportamentos para parecer menos ameaçador, aumentando suas chances de passar despercebido por eles.

Quando se trata de espécies que vivem em grupos, você também pode tentar estabelecer uma relação de confiança ou cooperação, buscando fazer com que os animais o auxiliem em determinadas situações. O resultado depende da espécie, das circunstâncias e do critério narrativo, não constituindo controle absoluto sobre os animais.

*Mordida — Habilidade Ativa*

Seus dentes e mandíbulas adquiriram uma resistência extraordinária, permitindo que você exerça uma pressão de mordida muito superior à humana. Sob condições favoráveis, sua mordida é capaz de romper até mesmo estruturas de aço, embora isso exija esforço considerável e não elimine o risco de danos à gengiva ou às estruturas internas da boca.

Sua mandíbula é uma arma natural, mas não uma ferramenta infalível. Materiais de diferentes espessuras e composições oferecem níveis distintos de resistência, e tentar romper superfícies extremamente duras pode causar lesões.

Contra um adversário humano, essa habilidade representa uma ameaça considerável, exigindo cautela tanto de quem a enfrenta quanto de quem a utiliza.`,
      },
      // Estágio IV: o texto do dono ainda não tem.
      { nome: '', linha: '' },
      {
        nome: 'Essência Humana',
        linha: '',
        texto: `Após lutar por tanto tempo contra os próprios instintos, você finalmente retorna a uma condição mais próxima de sua essência humana. O processo, entretanto, exige um preço: parte de sua capacidade física é sacrificada para que você recupere o controle sobre si mesmo.

Não se trata de uma vitória completa, mas de uma trégua conquistada à custa de sua própria força.

*Aparência*

Você conserva um físico definido e mais robusto que o da maioria das pessoas, mas seu semblante transmite desgaste. Há algo em sua expressão que lembra a aparência de alguém adoecido ou submetido a provações prolongadas, como se o corpo carregasse as marcas de uma batalha que nunca terminou por completo.

*Fisiológico*

Sua força é intencionalmente reduzida a um patamar comparável ao de um atleta comum de bom desempenho. Embora ainda possua condicionamento superior ao de muitas pessoas, você já não consegue reproduzir as capacidades extraordinárias dos estágios anteriores.

Tentar ultrapassar esses novos limites na esperança de recuperar sua antiga força provoca dores de cabeça intensas, comprometendo sua concentração e dificultando a execução de esforços físicos extremos.

Uma habilidade passiva condicional é adquirida.

*Sonho do Monstro — Habilidade Passiva Condicional*

A fera ainda existe dentro de você. Embora tenha recuperado parte de sua humanidade, sua natureza monstruosa permanece adormecida, aguardando uma oportunidade para emergir.

Sempre que adormecer, deverá realizar um teste de *1d20*. Antes da rolagem, escolha cinco resultados possíveis. Se o dado apresentar qualquer resultado diferente dos cinco escolhidos, você se transformará em um monstro durante o sono.

Nessa forma, não há controle consciente sobre suas ações. Sua força, agilidade, reflexos e resistência tornam-se extraordinários, permitindo feitos muito além das capacidades humanas. Você pode derrubar árvores com as mãos, romper obstáculos físicos com facilidade e suportar ataques que normalmente seriam incapacitantes, incluindo disparos de armas de fogo de grande potência, conforme o critério narrativo.

A cada turno, o Record deverá tentar recuperar o controle sobre a própria consciência. Caso acumule sete turnos sem conseguir fazê-lo, perderá a própria identidade para a criatura.

*O controle da forma monstruosa pertence inteiramente ao narrador.*`,
      },
      {
        nome: 'Lobisomen',
        linha: '',
        texto: `Nem inteiramente humano, nem completamente monstro. Você finalmente aprende a transitar entre as duas naturezas, deixando de tratar seus instintos como inimigos absolutos e começando a compreender a criatura que existe dentro de si.

O que antes era uma disputa constante passa a se tornar uma convivência instável, mas possível.

*Aparência*

Após aprender a controlar os próprios instintos, sua aparência volta a se aproximar daquela que possuía antes da transformação. Seu corpo conserva a definição muscular e a robustez adquiridas, enquanto os traços mais monstruosos permanecem ocultos sob uma aparência relativamente saudável.

O crescimento acelerado de pelos ainda persiste, mas seu sinal mais característico surge nos olhos: quando você percebe o cheiro de sangue sob a luz da lua, suas íris adquirem um brilho amarelado, especialmente perceptível em ambientes escuros.

*Fisiológico*

Sua força não alcança os níveis da forma monstruosa, mas supera claramente aquela que possuía antes de sua evolução. Suas capacidades físicas tornam-se extraordinárias, especialmente no que diz respeito à escalada, aos saltos, aos reflexos e à coordenação motora.

Nenhum atleta humano comum consegue rivalizar com sua habilidade de escalar superfícies difíceis ou executar saltos de até *8 metros*, desde que as condições permitam.

Seus dentes são resistentes o bastante para romper materiais duros sem provocar danos à própria boca, enquanto seu olfato se torna excepcionalmente aguçado, permitindo detectar determinados odores a distâncias de até *12 quilômetros*, conforme as condições ambientais e o critério narrativo.

Uma habilidade ativa é adquirida.

*Lobo — Habilidade Ativa*

Você finalmente conquista a capacidade de assumir voluntariamente sua forma monstruosa, sem depender do sono ou de uma perda involuntária de controle.

Ao ativar esta habilidade, seu corpo se transforma em uma criatura humanoide de aspecto lupino, semelhante a um lobisomem: musculosa, coberta por pelos e dotada de traços caninos acentuados.

Durante a transformação, que dura até *5 turnos*, suas capacidades físicas alcançam níveis comparáveis aos dos animais terrestres mais poderosos, respeitando as diferenças entre força, velocidade e resistência de cada espécie e o critério narrativo.

Entretanto, a transformação possui uma limitação importante: você perde a capacidade de falar enquanto permanece nessa forma. Sua comunicação fica restrita a gestos, expressões e vocalizações animais.

Diferentemente do Estágio V, você mantém a consciência e o controle sobre suas ações. A fera já não precisa tomar o seu lugar para que você possa utilizar sua força.

*Até duas vezes por Deadly Vote ou Campanha.*`,
      },
      // Estágio VII: só o nome, por enquanto.
      { nome: 'Tirano', linha: '' },
    ],
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
/** Texto longo: guarda os parágrafos (linhas em branco), tira espaços sobrando. */
const longo = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((l) => l.replace(/[ \t\f\v]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, max)
    : ''

/**
 * Normaliza o que veio da Mesa (Estágios 0..VII, na ordem). Devolve null se faltar algo obrigatório: frase breve,
 * descrição, fisiologia e pelo menos um Estágio; um Estágio com linha ou texto precisa de nome (nome vazio sem
 * nada = ainda não revelado). A lista sai sempre com oito.
 */
export function limparTexto(v: unknown): ArcanoTexto | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const L = TEXTO_LIMITES
  const breve = str(o.breve, L.breve)
  const descricao = longo(o.descricao, L.descricao)
  const fisiologia = longo(o.fisiologia, L.fisiologia)
  if (!breve || !descricao || !fisiologia || !Array.isArray(o.estagios)) return null
  if (o.estagios.length < L.estagiosMin || o.estagios.length > L.estagiosMax) return null
  const estagios = o.estagios.map((x): EstagioTexto => {
    const r = (x ?? {}) as Partial<EstagioTexto>
    const texto = longo(r.texto, L.texto)
    return { nome: str(r.nome, L.nome), linha: str(r.linha, L.linha), ...(texto ? { texto } : {}) }
  })
  if (estagios.some((x) => !x.nome && (x.linha || x.texto))) return null
  if (estagios.every((x) => !x.nome)) return null
  return { breve, descricao, fisiologia, estagios: completarEstagios(estagios) }
}
