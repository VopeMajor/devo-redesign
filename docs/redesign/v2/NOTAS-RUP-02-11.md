# Notas de atualização do Devo (Rup, entregues pela dona em 02/11/2026)

A dona (Jinta) mandou seguir estas instruções: "siga essas instruções por agora: (jinta sou eu e rup a pessoa q escreveu..)".
O texto abaixo é literal. Falas, descrições e números entram no jogo exatamente como estão. As marcas "Offscreen"
são regras internas e não aparecem para o jogador.

Onde cada item entra e o que ainda depende de decisão: ver o fim deste arquivo.

---

Notas de atualização do Devo.

Coisas que quero que a Jinta se lembre:



Notas de Atualização — Sistema Deadly Vote / Rup

1. Observação pessoal (para memória da Jinta)
“Sou até que bonito quando se olha de muito, muito, muito longe… e com bastante atenção.”



2. Sistema de Suspensão / Banimento de Conta
Implementar função completa de moderação de contas:

- Possibilidade de suspender ou banir conta (temporária ou permanente).
- Campo obrigatório de motivo (visível para o jogador).
- Campo de data de retorno (quando for suspensão temporária), também visível para o jogador.
- Advertência de aviso sobre comportamento inadequado ou semelhante. 
- Campo de nota de gestão (interna, offscreen). Essa nota fica registrada apenas para a equipe de moderação/administração e serve como histórico para consultas futuras.



3. Papel de Parede de Corporação
Adicionar sistema de wallpaper personalizado por Corporação.  
Ao entrar na aba da Corporação, o fundo da interface muda automaticamente para o papel de parede definido por aquela Corporação.  



4. Ranking Geral da Temporada
Criar ranking sazonal com as seguintes categorias:

- Maior quantidade de Deadly Votes solucionados
- Maior quantidade de cartas adquiridas
- Maior tempo acumulado no período
- Maior número de mortes sofridas (categoria cômica)
- Maior número de eliminações oficiais de outros jogadores



5. Sistema de RPG Maker — Residência

Casa (hub inicial):  
O jogador pode andar livremente pela casa.

Cômodos trancados: 
Alguns cômodos ficam fechados com cadeado.  
Para abri-los é necessário atingir determinado nível ou cumprir requisitos específicos.  
Ao interagir com a porta trancada, o personagem diz:

> “[Ainda não é uma boa ideia entrar aqui.]”

Pretexto narrativo: A residência foi oferecida pela Melissa, da Companhia de Despertados. Trata-se de uma casa que já pertenceu a outros Records no passado.

Expansão futura: Outras localidades poderão ser acessadas através do sistema de “Sair de Casa / Viagem”.


6 • Simon, O Carteiro

Aparições: Simon pode aparecer ocasionalmente batendo à porta da casa para entregar correspondências, presentes enviados por outros NPCs ou até mesmo oferecer produtos e serviços aleatórios.

Descrição: Um sujeito cuja aparência não parece corresponder à sua verdadeira idade. Simon possui traços jovens e andróginos, cabelos lisos brancos ou prateados, em um corte de inspiração asiática, pele clara, olhos escuros e um semblante naturalmente amigável.

Está quase sempre sorrindo e conversa com a familiaridade de um velho amigo, mesmo quando acaba de conhecê-lo. Entretanto, por trás de sua cordialidade, existe um indivíduo bastante oportunista, que não faz questão de esconder completamente suas intenções comerciais. Para Simon, praticamente qualquer interação pode se transformar em uma oportunidade de lucro.

|

Correspondências

Companhia: Envia cartas informando irregularidades identificadas pela Companhia, além de comunicados e avisos sobre assuntos relevantes. Caso o jogador seja afiliado, também poderá receber, ocasionalmente, objetos que pertenciam a antigos personagens falecidos, como uma forma de incentivo à continuidade de sua participação.

Informações Gerais: Correspondências destinadas a divulgar acontecimentos importantes do mundo, rumores sobre eventos futuros e outras informações que devem ser conhecidas por todos os Records.

Ordem Ortodoxa: Funciona de maneira semelhante às correspondências da Companhia, enviando comunicados e informações relevantes. Entretanto, também poderá encaminhar ameaças ocasionais aos Records afiliados à Companhia. Diferentemente desta, a Ordem Ortodoxa não envia objetos pertencentes aos antigos personagens do jogador.

Vendas: As ofertas de Simon geralmente envolvem informações. Ele apresenta determinado assunto, comenta alguns detalhes para despertar a curiosidade do jogador e, caso consiga despertar seu interesse, cobra uma quantia em Tempo para revelar o restante.

Relações entre Corporações: Simon também pode ser responsável por entregar comunicados oficiais envolvendo Declarações de Guerra, Cessar-Fogo e Alianças entre Corporações. Essas correspondências possuem regras e consequências próprias, explicadas na seção correspondente.


7 • Simon — Primeiro Diálogo
|
[Som de campainha]
|
[Tem alguém na porta.]
|
Jogador: Eu devo ir?
|
Sistema: Sempre que sua campainha tocar ou você ouvir alguém batendo à porta, significa que há alguém esperando do lado de fora. Essa pessoa pode ser um NPC amigável, hostil ou simplesmente alguém em busca de informações. As possibilidades são praticamente infinitas, mas atender ou não é uma decisão inteiramente sua — e que deve ser tomada com cautela.
Offscreen: Simon deve ser o primeiro NPC a visitar o personagem. Ele sempre aparecerá quando o jogador receber uma visita, impedindo que outros NPCs apareçam antes dele.
|
Jogador:
1 — [Ignorar]
2 — [Abrir a porta]
|
1 — [Depois de alguma insistência, a figura desconhecida parece ter ido embora.]
2 — [Você se aproxima da porta e olha pelo olho mágico. A lente parece um tanto suja, tornando a imagem borrada, mas ainda é possível distinguir a presença de alguém do outro lado.]
|
⚠️ Sistema: Sempre que receber uma visita e decidir atendê-la, você terá a oportunidade de observar o visitante pelo olho mágico da porta. Isso pode fornecer algumas pistas sobre quem está do outro lado, mas será necessário ter conhecimento suficiente para interpretá-las.
|
[A porta é aberta gradualmente.]
|
[Revelando uma figura surpreendentemente baixa, vestida com o uniforme de um carteiro.]
|
[Não. De uma carteira?]
|
Simon: Olá! Você é o(a) novo(a) morador(a), certo? Eu sou Simon, seu carteiro mais pontual!
|
Simon — Reação ao sexo masculino: E que pontual eu sou…
|
Simon: Bem, aqui é o X, certo? [Ele menciona a coordenada da casa, conforme o sistema apresentado anteriormente por Jinta.] Deve ser mesmo. É uma ótima casa... Você tem tanta sorte. Estou com inveja disso.
|
Simon: Já fazia algum tempo que eu sentia falta de entregar coisas por aqui. Que demais! Vamos ser bons amigos, que tal?
|
Jogador:
1 — Você é um carteiro normal ou...? 
2 — O que aconteceu com o antigo morador?
|
Simon:
1 — Haha! Calma. Eu sei da sua condição, mas não tenho relação nenhuma com essas coisas, não. Só conte comigo se o assunto for correspondências ou entregas, belê?
2 — H-Hum... Eles não te contaram? Eu até poderia dizer, mas... Ah, tudo tem um preço.
|
Sistema: Simon pode oferecer informações em troca de uma quantia de tempo.
Aceitar ou não suas condições é uma escolha sua. As informações que ele fornece não são exatamente essenciais, portanto, não há problema algum em ignorá-lo sempre que desejar. Ainda assim, conhecer alguns detalhes interessantes pode fazer a diferença para aqueles que gostam de aproveitar todas as oportunidades.
|
Jogador:
1 — Quanto você quer?
2 — Não, obrigado(a).
|
Simon:
1 — Essa primeira vai ser por conta da casa! Que tal? Em troca, escolha sempre os meus serviços antes dos da concorrência...
2 — H-Hein?! Tsk. Que pena...
|
Simon:
1 — O antigo morador era um homem alto que vivia usando roupas amarelas. Acho que ele comentou uma vez que gostava de pintar quadros e porcelanato. É uma pena que aquele balde enorme tenha caído na cabeça dele durante seus serviços valorosos.
|
Simon: 
1 — Dizem que o balde era tão pesado que o impacto parecia até um tiro de escopeta na nuca. E isso vindo de um colega da Companhia, quando ele menos esperava! Coitado... Imagine se esse tivesse sido mesmo o caso? Eu é que não gostaria de morrer assassinado pela própria Corporação que tanto me alimentou...
|
Simon: Bom, esqueça isso. Quem sabe ele não deixou alguma coisa útil por aqui? Talvez até tenha virado um fantasma que assombra a casa... Tente dar uma conferida depois. Ou quer uma ajudinha?
|
[Simon parece interessado em entrar na casa para procurar pertences do antigo morador. Permitir que um estranho entre pode ser arriscado.]
|
Jogador: “O que devo fazer?”
|
Jogador: 
1 — Não é uma boa ideia.
2 — Você é bem-vindo. Entre.
|
Simon:
1 — Uau. Que frieza!
2 — Tá, tá. Eu vou embora, entã... Hein? Sério mesmo?
|
Simon:
 2 — Haha! Então tá! Vamos lá!
|
[Simon entra na casa com passos silenciosos, suas perninhas mal fazendo barulho pelo chão. Ele parece bastante interessado e começa a vasculhar todos os armários, inclusive aqueles que pedi expressamente para não mexer...]
|
Simon: Bom... Terminamos. Eu tentei. [Suspiro]
|
[Simon olha para mim da entrada. Parece um tanto decepcionado com o resultado pouco satisfatório da nossa investigação.]
|
Simon: Aquele maldito deixou apenas um guarda-chuva... Isso é tão triste!
|
Simon: Bem, agora ele é seu. Use como bem entender. Ainda é uma herança, talvez... Será que isso lhe concede algum valor?
|
Simon: Se não quiser, que tal me dar?
|
Jogador:
1 — [Oferecer o guarda-chuva]
2 — [Ficar com o guarda-chuva]
|
Simon: 
1 — Woow. Obrigadinho…
2 — Acho que não.
|
Simon: Agora estou indo embora. A mala já está lá fora. Vou te deixar. Te deixar… 🎶 Goodbye ❣️
|
[Fecho a porta.]
|
[Ele foi embora.]
|
Simon: Te deixar... 🎶 [Muito baixo]
|
Jogador: Com certeza ele foi.
|
8 • Evento de Conflito 
Toda temporada, você poderá escolher um lado e participar de uma disputa pelo domínio de todo o Devo. Cada organização acumula pontos e influência conforme a participação de seus afiliados. O objetivo é superar o adversário e conquistar a supremacia ao final da temporada.
Qual delas poderá contar com o seu apoio? E, afinal, qual delas está certa?
CONHEÇA
Companhia de Despertados
Com fundadores completamente desconhecidos, a Companhia de Despertados foi criada há pouco mais de cem anos, com o propósito de superar os métodos ultrapassados da Ordem Ortodoxa.
A organização prioriza a sobrevivência da humanidade como um todo, intervindo contra aqueles que ousam transgredir suas regras. Funcionando como uma grande empresa, a Companhia procura auxiliar Records menos experientes, desenvolver seus talentos e eliminar qualquer ameaça ao equilíbrio do mundo — fiscalizando até mesmo as Corporações mais antigas e poderosas.
É amplamente reconhecida como uma das poucas instituições com autoridade efetiva sobre os demais participantes do Devo, sendo frequentemente comparada a um órgão público ou fiscalizador.
Seus princípios são fundamentados no progresso, na segurança controlada e na manutenção da ordem estabelecida. Afinal, a Companhia nasceu para eliminar todos aqueles que ameaçam esses valores.
Ordem Ortodoxa
Muito antes da Companhia de Despertados existir e preparar o terreno para o futuro do Deadly Vote, já havia pessoas que lidavam com as mesmas circunstâncias sobrenaturais do mundo atual. Naquela época, o conhecimento era transmitido por meio de antigas famílias, tradições arcaicas e organizações milenares.
Com a ascensão da Companhia, essas comunidades perderam parte de seu espaço e prestígio, passando a ser consideradas rudimentares, ultrapassadas ou até mesmo bárbaras em seus métodos.
Aquelas que conseguiram sobreviver e preservar suas tradições acabaram formando o que conhecemos hoje como Ordem Ortodoxa: uma sociedade secreta de ocultistas que valoriza suas raízes acima de praticamente qualquer outra coisa.
Seus objetivos vão muito além daqueles estabelecidos pela Companhia. Seus membros defendem a preservação de conhecimentos antigos, a autonomia de suas comunidades e a continuidade de práticas que consideram essenciais.
Considerada hostil pela Companhia, a Ordem é frequentemente associada a atividades criminosas e enquadrada como uma organização terrorista. Entretanto, seus integrantes possuem uma visão bastante diferente sobre quem, de fato, representa a maior ameaça ao mundo.
|
MARCOS
Escolher um lado não significa apenas participar de uma disputa. Durante o evento, cada organização terá uma série de objetivos coletivos conhecidos como Marcos.
Ao atingir determinadas metas de Karma, os afiliados contribuem para desbloquear premiações globais exclusivas. Essas recompensas variam de acordo com a organização escolhida e mudam a cada temporada.
Portanto, reunir seus companheiros, movimentar a comunidade e contribuir para o progresso do seu lado será fundamental.
[Offscreen: Tanto as recompensas quanto a pontuação atual permanecem ocultas até que o jogador selecione definitivamente uma organização.]
Companhia de Despertados 
Marco 1 | 10.000 Karma da Companhia
- +100 horas de Tempo.
Marco 2 | 15.000 Karma da Companhia
- 10 Dracmas Comuns.
- 01 Pacote Raro.
Marco 3 | 20.000 Karma da Companhia
- 01 Pacote Especial da Companhia de Despertados (Raro).
- 01 Música de Interface.
Marco 4 | 30.000 Karma da Companhia
- 20 Fragmentos Arcanos.
Marco 5 | 40.000 Karma da Companhia
- Moldura temporária de Campeão (concedida ao primeiro lado que alcançar a meta).
- +150 horas de Tempo.
- 01 Carta Rara garantida de um Pacote da Companhia de Despertados.
Ordem Ortodoxa 
Marco 1 | 10.000 Karma da Ordem
- +100 horas de Tempo.
Marco 2 | 15.000 Karma da Ordem
- 10 Dracmas Comuns.
- 01 Pacote Raro.
Marco 3 | 20.000 Karma da Ordem
- 01 Pacote Especial da Ordem Ortodoxa (Raro).
- 01 Música de Interface.
Marco 4 | 30.000 Karma da Ordem
- 20 Fragmentos Arcanos
Marco 5 | 40.000 Karma da Ordem
- Moldura temporária de Campeão (concedida ao primeiro lado que alcançar a meta).
- +150 horas de Tempo.
- 01 Carta Rara garantida de um Pacote da Ordem Ortodoxa.
Apuração semanal: Todos os sábados, será revelada a quantidade de Karma acumulada por cada organização durante a semana. Após a divulgação, os resultados voltarão a ficar ocultos até a próxima apuração, preservando a imprevisibilidade da disputa. 
[Offscreen: Cada Marco alcançado também desbloqueia uma pequena apresentação narrativa, mostrando os acontecimentos e as consequências da conquista para a organização correspondente.]
|
LOJA DE KARMA
Utilize o Karma individual acumulado para adquirir produtos exclusivos da organização escolhida. Cada loja possui itens próprios, alguns dos quais apresentam um limite universal de compras.
As mercadorias disponíveis não são necessariamente permanentes. Aproveite enquanto estiverem em estoque!
Companhia de Despertados
Melissa de Brinquedo (0/25) | Um presente bastante popular, com alta taxa de aceitação entre os NPCs. Não pode ser oferecido a personagens vinculados à Ordem Ortodoxa. | 700 Karma
Chiclete Azul (0/200) | Recupera +2 horas de Tempo. | 75 Karma
Pacote da Companhia (0/40) | Contém cartas pertencentes a diferentes coleções. Algumas são exclusivas do Evento de Conflito. | 1.100 Karma
[Correção do dono, 03/11/2026: "É pacote da companhia" — o nome certo é Pacote da Companhia.]
Moldura Definitiva da Companhia (0/8) | Uma moldura institucional exclusiva, reservada àqueles que conseguem arcar com seu preço elevado. Permanente. | 2.000 Karma
Decoração de Patinho (0/12) | Uma decoração adorável que aumenta consideravelmente as chances de atrair NPCs com traços ordeiros para sua residência. | 1.600 Karma
Grande Fragmento Arcano (0/6) | Um Grande Fragmento Arcano novinho em folha. | 2.500 Karma
Ordem Ortodoxa
Amuleto de Melissa (0/25) | Um pequeno amuleto de aparência peculiar. Pode ser oferecido como presente a praticamente qualquer personagem, apresentando alta taxa de aceitação, exceto aqueles vinculados à Companhia de Despertados. | 700 Karma
Pastilha Carmesim (0/200) | Recupera +2 horas de Tempo. | 75 Karma
Pacote de Relíquias (0/40) | Contém cartas pertencentes a diferentes coleções. Algumas são exclusivas do Evento de Conflito. | 1.100 Karma
Selo Definitivo da Ordem (0/8) | Uma insígnia ritualística que representa a fidelidade às antigas tradições. Poucos conseguirão obtê-la devido ao seu preço elevado. Permanente. | 2.000 Karma
Decoração de Corvo (0/12) | Um enfeite de aparência sombria que aumenta consideravelmente as chances de atrair NPCs com traços caóticos para sua residência. | 1.600 Karma
Grande Fragmento Arcano (0/6) | Um Grande Fragmento Arcano novinho em folha. | 2.500 Karma
|
SE TROCAR DE LADO
Caso o Record selecione uma organização diferente daquela à qual esteve afiliado anteriormente, um aviso será apresentado antes da confirmação.
Fidelidade: Para manter acesso a determinadas funções especiais, você precisa preservar sua fidelidade a uma mesma organização durante três temporadas consecutivas. Trocar de lado antes de cumprir esse requisito poderá resultar em uma penalidade de Karma.
“Tem certeza de que deseja trocar de lado?”
[Offscreen: A penalidade pode deixar o jogador com saldo negativo de Karma, caso sua pontuação atual não seja suficiente para cobrir o custo da mudança.]
RUP, AQUI, A COISA DO KARMA, SE LEMBRA 


9 • Ordem Ortodoxa — Primeiro Diálogo

|

“O mundo não possui mais as mesmas cores desde que esses acontecimentos estranhos começaram a fazer parte da minha vida.”

|

“Talvez exista algum lugar onde eu ainda possa me sentir bem.”

|

“Ouvi dizer que existe uma igreja nas redondezas...”

|

“Eu deveria ir até lá.”

|

[ … ]

|

[Ouço o tinido de um sino pesado.]

|

[O som é tão alto que sinto vontade de cobrir os ouvidos.]

|

[Nunca considerei a possibilidade de encontrar algo tão fantasioso nesta cidade. Parece uma igreja antiga, semelhante a uma basílica histórica da qual nunca ouvi falar em lugar algum, nem na internet, nem na televisão. Sua presença transmite uma sensação muito mais pesada e sufocante do que a de qualquer outro templo religioso. Não é acolhedora. É intimidadora.]

|

[Tanto sua arquitetura quanto o silêncio que a envolve parecem deliberadamente construídos para afastar visitantes. Nada nela me parece convidativo o bastante para despertar o desejo de entrar.]

|

[E os simbolismos espalhados pela entrada... Embora lembrem vagamente aqueles encontrados em algumas vertentes do cristianismo, são diferentes demais para serem associados a qualquer religião que eu conheça.]

|

Jogador:
“Mesmo com toda essa arquitetura, duvido que seja um templo comum de alguma religião convencional.”

|

Jogador:
“É completamente diferente de todos os outros templos pelos quais passei até hoje.”

|

Jogador:
“Talvez agora, sendo alguma coisa diferente de um ser humano, eu finalmente consiga enxergar essas coisas. Essa energia absurda, essa aura... É completamente sobrenatural. Ela me lembra um Deadly Vote.”

|

Jogador:
“Será que eu deveria mesmo entrar?”

|

Jogador:
1 — [Deixar para outro dia] —> Leva direto para Casa. 
2 — [Usar a aldrava]

|

[Som de uma batida pesada.]

|

“Foi bem mais alto do que eu esperava.”

|

[ … ]

|

[Depois de alguns minutos esperando, percebi que ninguém viria me atender.]

|

[Decidi, então, tentar abrir a porta por conta própria. E, para minha surpresa...]

|

[Crec.]

|

[ ... ]

|

Jogador:
“É tão grande quanto parecia por fora.”

|

Jogador:
“Tudo aqui parece tão silencioso. Não vejo ninguém além de mim.”

|

Jogador:
“Será que vim em um horário ruim?”

|

???
De forma alguma, Record.

|

[O susto me faz virar imediatamente na direção da voz. Só então percebo a presença de alguém que esteve bem atrás de mim durante todo esse tempo.]

|

[Era uma figura alta, de aparência masculina, pele acobreada e rosto completamente desprovido de pelos. Seus cabelos eram finos, e vestia uma batina preta, ornamentada com diversos acessórios prateados.]

|

???
Não tenha medo.

|

???
Estive observando. Apenas fiquei curioso para saber se você realmente entraria ou não...

|

Jogador:
1 - Quem é você?
2 - Como você leu minha mente?
3 - Por quê?

|

???

1 — Meu nome é Erick Zorak. Sou o Bispo e humilde aprendiz do Arcebispo desta Catedral que tu, humilde servo(a), agora contemplas.

2 — Perdão, mas isso não parece algo que alguém consiga fazer com tanta facilidade.

3 — ...

|

Erick Zorak:
Consigo observar as pessoas que passam pela rua lá de cima. Geralmente fico imaginando quem será a próxima a atravessar aquela porta... E gosto de tentar adivinhar.

|

Jogador:
1 — O que é este lugar?
2 — Aqui não é normal, certo?

|

Erick Zorak:
1 — Uma Catedral... Conhecida como Igreja Ortodoxa de Damasco. Cuidamos de todos os assuntos que você possa imaginar.

2 — Isso quem deve me dizer é você. Para mim, tudo aqui parece completamente normal.

|

Jogador:
1 — Você é um péssimo mentiroso.
2 — Quero sair daqui. Não sei do que você está falando!
3 — O que posso conseguir neste lugar?

|

Erick Zorak:
[Suspiro...]

|

Erick Zorak:
Eu estava desconfiando. Então é verdade. Você é um de nós.

|

Erick Zorak:
Mencionei aquela palavra com R logo no início da nossa conversa. Mas você reagiu tão naturalmente... Nem sequer me perguntou o que eu queria dizer com aquilo. Acho que acabei acertando meu palpite.

|

Jogador:
1 — ...
2 — Você está errado.
3 — Isso é verdade.
4 — E daí?

|

Erick Zorak:
Diga-me, o que um Record que nunca vi antes está fazendo por aqui?

|

Jogador:
1 — Estou... confuso(a).
2 — Eu não sei.
3 — Senti que este lugar era especial, então decidi entrar.
4 — Sou um novato da Companhia de Despertados.

|

Erick Zorak:
1 e 2 — Isso era esperado.
3 — Então você sente... (+100 Karma de Caos).
4 — É mesmo? Decepcionante.

|

Erick Zorak:
Parece existir muito conflito dentro de você. Talvez devesse aproveitar esta oportunidade que o destino lhe concedeu... Quem sabe este não seja, afinal, o seu verdadeiro lugar?

|

Erick Zorak:
Por que não aproveita esta oportunidade para orar comigo?

|

[Sistema: Nova área desbloqueada — Catedral de Damasco.]

|

[Sistema: A partir de agora, sempre que sair de casa, você poderá escolher a Catedral de Damasco como um de seus destinos.]

|

Erick Zorak:
Venha. Tente pelo menos uma vez.



10 • Catedral de Damasco
A Catedral de Damasco oferece um espaço dedicado a orações e oferendas. Por meio do altar, você poderá solicitar bênçãos ou invocar maldições, recebendo efeitos que podem alterar temporariamente diferentes aspectos da sua experiência no Devo.
As orações realizadas sem oferendas possuem opções limitadas e resultados mais modestos. Entretanto, ao sacrificar determinados itens, você poderá realizar rituais específicos e obter bênçãos ou maldições muito mais poderosas.
Cada oferenda possui probabilidades próprias de resultado. Portanto, consulte atentamente as informações disponíveis antes de decidir o que deseja sacrificar.
|
Erick Zorak: O que você deseja fazer?
|
Jogador: 1 - Orar. 2 - Oferecer uma oferenda.
|
ORAR
Mesmo sem oferecer qualquer objeto, você ainda pode realizar uma oração e manifestar determinados desejos.
A — Desejar por saúde
[Possibilidade de receber uma bênção que concede Tempo adicional.]
B — Desejar estabilidade
[Possibilidade de receber uma bênção que concede Créditos adicionais.]
C — Desejar melhores relações
[Possibilidade de receber Essências de Afinidade correspondentes aos três NPCs com os quais você possui os maiores vínculos.]
|
OFERECER OFERENDA
[Selecione uma das oferendas disponíveis e realize o ritual correspondente para tentar obter uma bênção ou maldição.]
Oferendas disponíveis
01. Arroz Branco
Descrição: Arroz fresquinho, ainda dentro do pacote. Despeje-o sobre si mesmo para atrair boa sorte.
Resultado
Probabilidade
Nada
30%
Bênção do Amigo
40%
Maldição do Alcoólatra
30%

02. Tambor Antigo
Descrição: Um antigo tambor tribal. Bata nele com força até que se quebre, atraindo energias poderosas.
Resultado
Probabilidade
Nada
30%
Bênção do Guerreiro
30%
Maldição do Tolo
40%

03. Flauta de Osso
Descrição: Uma flauta confeccionada com os ossos de alguém. Toque uma melodia de olhos fechados e aguarde para descobrir o que os espíritos reservaram para você.
Resultado
Probabilidade
Nada
30%
Bênção do Artista
30%
Maldição do Golpista
40%

04. Máscara Xamã
Descrição: A antiga máscara de madeira de um mestre da feitiçaria. Dance enquanto a utiliza e, antes de quebrá-la, pronuncie seu nome em voz alta para tornar possível o impossível.
Resultado
Probabilidade
Nada
20%
Bênção do Vidente
40%
Maldição do Charlatão
40%

|
BÊNÇÃOS E MALDIÇÕES
Os resultados dos rituais são determinados pelas oferendas utilizadas. Cada bênção ou maldição possui efeitos próprios, podendo modificar temporariamente suas condições de jogo.
Bênçãos
Bênção do Amigo
Faz com que seu NPC favorito apareça em sua residência durante três dias consecutivos, a partir do seu próximo retorno para casa.
Bênção do Guerreiro
Reduz passivamente em 50% a perda de Tempo durante 24 horas.
Bênção do Artista
Aumenta em 30% suas chances de sucesso na confecção de cartas durante as próximas 4 horas.
Bênção do Vidente
Dobra sua recompensa de Tempo uma única vez no próximo Deadly Vote que você vencer.
Maldições
Maldição do Alcoólatra
Reduz em 5% sua afinidade com o NPC favorito.
Maldição do Tolo
Aumenta em 25% a velocidade de perda de Tempo durante as próximas 24 horas.
Maldição do Golpista
Aumenta em 30% suas chances de falha na confecção de cartas durante as próximas 5 tentativas.
Maldição do Charlatão
Reduz em 30% suas recompensas de Tempo nos próximos três Deadly Votes dos quais participar.

11 • Erick Zorak — Saudações e Despedidas

Erick Zorak é o responsável por receber os Records que visitam a Catedral de Damasco. Suas saudações e despedidas variam conforme a ocasião, a frequência das visitas e o vínculo estabelecido com o personagem.

SAUDAÇÕES

[Sempre que o jogador visitar a Catedral, Erick poderá recebê-lo com uma das seguintes falas.]

Erick Zorak:
Você de novo? Seja bem-vindo(a).

|

Erick Zorak:
Fico feliz que isso tenha se tornado um hábito.

|

Erick Zorak:
É sempre bom encontrar rostos familiares.

|

Erick Zorak:
O que há de tão interessante nesta igreja?

|

Erick Zorak:
Você, hum?

|

Erick Zorak:
Não sei exatamente no que acredita, mas devo admitir que sua fé é admirável.

DESPEDIDAS

[Quando o jogador decidir deixar a Catedral, Erick poderá utilizar uma das seguintes falas.]

Erick Zorak:
É um pouco mais cedo do que eu gostaria, mas... até logo.

|

Erick Zorak:
Já vai, não é? Então, adeus.

|

Erick Zorak:
É sempre bom ver você... Ficarei aguardando nosso próximo encontro.

|

Erick Zorak:
Ora, ora. Saindo de fininho, hum? Vá pela sombra.

|

Erick Zorak:
Ainda consigo enxergar você da torre do sino. Vá pela calçada... E tome cuidado.

|

Erick Zorak:
[ Suspira tristemente... ]



12 • Dificuldades de Deadly Vote definidas: A dificuldade de um Deadly Vote é medida pelos Naipes de Baralho. Cada valor crescente revela uma escala de rigor superior à anterior, como se as próprias cartas fossem o peso que o destino coloca sobre os ombros dos jogadores.

Embora não exista relação oficial e inequívoca entre o tipo de naipe e o conteúdo da missão, observadores experientes notam certas tendências — especialmente quando se trata das Cartas de Figura. Há quem afirme, ainda, que o naipe influencie o tipo de carta que pode surgir como recompensa. Tudo isso, no entanto, permanece no terreno da suposição. No fim, o único conselho que resiste ao tempo é o mesmo de sempre: acredite apenas em si próprio.

Com base na dificuldade anunciada, o padrão de recompensa oferecida costuma seguir a seguinte escala:

- Às → 500 a 1.000 XP  | 10 a 25h
- Dois → 1.000 a 1.500 XP  | 25 a 50h
- Três → 1.500 a 3.000 XP  | 50 a 100h
- Quatro → 3.000 a 6.000 XP  | 100 a 200h
- Cinco → 6.000 a 12.000 XP  | 200 a 400h
- Seis → 12.000 a 24.000 XP  | 400 a 800h
- Sete → 24.000 a 48.000 XP  | 800 a 1.600h
- Oito → 48.000 a 96.000 XP  | 1.600 a 3.200h 
- Nove → 96.000 a 192.000 XP  | 3.200 a 6.400h 
- Dez → 192.000 a 384.000 XP  | 6400 a 12.800h 

As Cartas de Figura (Valete, Rainha e Rei) não possuem valores rigidamente definidos, apenas faixas aproximadas. Mesmo com números de referência, elas variam de forma imprevisível e quase sempre se manifestam como Eventos Globais ou como Deadly Votes de dificuldade extrema. Quem se arrisca a entrar nesses jogos precisa carregar consigo uma dose generosa de otimismo… ou de desespero.

O CORINGA 🃏

O Coringa é a dificuldade mais especial — e a mais temida.

Quando um Deadly Vote é lançado sob essa classificação, significa que a missão é, por natureza, imprevisível. Existem Coringas em que a morte sequer é possível; o jogador simplesmente emerge do outro lado carregando recompensas aleatórias e absurdas. Existem outros, porém, que parecem ter sido criados com o único propósito de quebrar quem ousa enfrentá-los.

Há, ainda, um fenômeno estranho e raro associado a essa dificuldade. Em alguns casos, um Deadly Vote começa sob uma classificação comum… e, no meio da missão, o efeito do Coringa se manifesta. Os jogadores são notificados de que a dificuldade acabou de mudar. Esses casos são conhecidos como Red Coringa.

Eles são extremamente raros. Extremamente difíceis. E quase sempre terminam de forma terrível.



13 • XP de Outros Assuntos:

---

## Onde cada item entra (mapa de trabalho)

| Nº | Item | Onde entra | Ordem |
|---|---|---|---|
| 1 | Observação pessoal do Rup | Só memória; não vai para o jogo | — |
| 2 | Suspensão / banimento / advertência | Mesa › Jogadores (equipe) + aviso ao jogador ao entrar | 7 |
| 3 | Papel de parede da Corporação | Corporações (líder escolhe) + fundo do sistema na aba | 6 |
| 4 | Ranking Geral da Temporada | App novo ou aba do Record | 5 |
| 5 | Residência: cômodos trancados, Melissa, Sair de Casa / Viagem | Casa (pixel) | 1 |
| 6–7 | Simon, o Carteiro, e o primeiro diálogo | Casa: campainha, olho mágico, VN | 2 |
| 8 | Evento de Conflito (Companhia × Ordem), Marcos, Loja de Karma, troca de lado | App novo | 4 |
| 9–11 | Ordem Ortodoxa: primeiro diálogo, Catedral de Damasco, Erick Zorak | Destino de viagem em pixel + VN | 3 |
| 12 | Dificuldade do Deadly Vote por naipes, Coringa e Red Coringa | Mesa › Casos e Record › Deadly Votes | 8 |
| 13 | XP de Outros Assuntos | Sem conteúdo ainda | — |

## Pontos que dependem de decisão (registrados, sem inventar)

- "XP" (item 12) e "Créditos" (item 10, Desejar estabilidade) ainda não existem no jogo. Precisam de definição.
- Karma: o texto usa "Karma da Companhia", "Karma da Ordem", "Karma de Caos" e "Karma individual"; o jogo hoje tem
  um Karma só e o sistema Caos e Ordem (SPEC-ORDEM). A anotação "RUP, AQUI, A COISA DO KARMA, SE LEMBRA" indica que
  isto ainda será acertado.
- Coordenada da casa ("aqui é o X"): depende do sistema de coordenadas que a dona apresentou; ainda não está no
  protótipo.
- Simon — "Reação ao sexo masculino": a fala extra só aparece para personagem masculino.
- Item 13 veio sem conteúdo.
