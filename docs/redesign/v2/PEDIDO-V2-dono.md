# DEVO v2 — pedido do dono (31/10/2026, texto literal)

Decisões tomadas na conversa (31/10):
- Motor: visual de RPG Maker dentro do site atual (Next.js, contas, banco, Cloudflare). Mapa em pixel onde o avatar anda, diálogos de visual novel, menus em pixel.
- Estilo: pixel art em mapa, casa e menus; retratos dos NPCs e imagens de encontro em ilustração anime de alta qualidade.
- Arte: mistura de pacotes com licença aberta (base) e geração por IA (retratos, cenas, itens únicos).
- Troca: versão nova em paralelo (branch e endereço separados, mesmo banco); o site atual fica no ar até o dono aprovar.
- Referências enviadas: `refs/ref-01.jpg` … `refs/ref-08.jpg` (diálogo com retrato e moldura floral, cerejeiras isométricas, casas isométricas, D1AL-ogue, diário rosa/preto).
- **Correção do dono (01/11/2026), substitui o Motor/Estilo acima:** "não gostei. o devo em geral deve ter a vibe antiga, não em pixel. mas a casa e torres rpg maker/visual novel. além disso tudo parece muito simples, aprimore as artes e enquadramento"
  - O DEVO em geral (celular do sistema, Record, Deadly Vote, Poço, Mesa, Salão, Companhias etc.) mantém a identidade atual (gótico ametista, arte pintada; ver `docs/redesign/IDENTIDADE.md`). Nada de pixel nessas telas.
  - Só a **Casa** e as **Torres** viram RPG Maker / visual novel (mapa onde o avatar anda, diálogos com retrato).
  - Arte e enquadramento precisam ser mais ricos; o primeiro kit foi julgado simples demais.
  - Mais tarde, no mesmo dia: "os npcs também tem que passar pelo redesign. pegue como referencia o persona"
  - Depois, com 14 referências novas (`refs/ref-09.jpg` … `refs/ref-22.jpg`): "a vibe anterior, mas não um reaproveitamento ok? isso é um redesgn afinal. algumas referências (mas não se prenda a elas.) pode inserir elementos 2.5/3D em algumas telas. também refaça os cosméticos. quero tudo Melhor e mais bonito"
- Pinterest: sem conexão nesta sessão; o dono pode mandar links ou imagens.

---

quero uma reestruturação geral no devo. ele agora deve ser um jogo rpg maker. algumas funções se manterão, mas com alterações ou melhorias. por exemplo isso será acrescentado nas cartas além do peso, natureza, etc:

*Manual de utilização de Cartas — Deadly Vote*

*I. Ritos de Invocação*

Record, nem toda carta pode ser utilizada simplesmente porque você deseja fazê-lo. Algumas exigem movimentos específicos, outras demandam palavras cuidadosamente pronunciadas e há aquelas que, felizmente para você, não exigem absolutamente nada. Afinal, seria bastante inconveniente precisar recitar um poema inteiro toda vez que quisesse fazer alguma coisa útil...

Para compreender como uma carta é invocada, você precisa conhecer dois elementos fundamentais: *Gestos e Cânticos*. Ambos fazem parte dos Ritos de Invocação, mas funcionam de maneiras distintas.

*I. Gestos*

Os Gestos são movimentos ritualísticos exigidos por determinadas cartas. Cada movimento possui uma denominação e um simbolismo próprios, integrando um repertório compartilhado entre diferentes cartas, coleções e raridades.

Isso significa que duas cartas completamente distintas podem exigir exatamente o mesmo gesto, ainda que seus efeitos não possuam qualquer relação aparente. Da mesma forma, uma carta pode exigir um único movimento, enquanto outra demanda uma sequência de vários deles.

A quantidade e a ordem dos gestos necessários são determinadas individualmente por cada carta. Portanto, não presuma que duas cartas semelhantes devam compartilhar os mesmos requisitos.

A boa notícia é que você não precisa aprender um gesto novo para cada carta que encontrar. Ao compreender o repertório gestual, será capaz de reconhecer movimentos já conhecidos em novas invocações.

Naturalmente, existe uma maneira de tornar tudo isso menos trabalhoso: a Virtude de Taças pode reduzir a quantidade de gestos exigidos por uma carta, conforme o nível de aptidão do Record.

*II. Cânticos*

Os Cânticos funcionam de maneira um pouco diferente.

Cada Coleção possui seu próprio texto ritualístico, composto por linhas que devem ser vocalizadas para permitir a invocação de suas cartas. Diferentemente dos Gestos, que são compartilhados livremente entre cartas, os Cânticos pertencem às respectivas Coleções e não devem ser confundidos entre si.

Uma mesma Coleção pode conter cartas de diferentes raridades, mas isso não significa que todas precisem recitar o texto completo. Pelo contrário: *a raridade da carta determina até qual linha do Cântico você precisa vocalizar.*

Imagine, por exemplo, que você tenha encontrado a Coleção *Inúteis*. Seu Cântico é composto pelo seguinte poema:

> Imagine que isso é um poema muito bom.
>
> Esse poema é tão incrível que você vai amar.
>
> Sinta a força desse poema maravilhoso.
>
> Sob o luar.
>
> Lindo.

Sim, Record. Você precisará lidar com isso.

Entretanto, a quantidade de linhas exigidas depende da carta que pretende invocar.

- *Carta Comum:* exige somente a primeira linha. Basta dizer: *"Imagine que isso é um poema muito bom."*
- *Carta Rara:* exige as duas primeiras linhas. Você deverá dizer: *"Imagine que isso é um poema muito bom. Esse poema é tão incrível que você vai amar."*
- *Cartas de outras raridades:* exigirão a quantidade de linhas correspondente à sua posição na escala da Coleção.

Observe que você não escolhe quais linhas deseja recitar. A invocação deve seguir a ordem original do texto, começando sempre pela primeira linha e avançando até alcançar o trecho exigido pela carta.

*Como identificar o limite do Cântico?*

Nos textos disponibilizados pelo site, as linhas dos Cânticos são organizadas com marca-textos coloridos que indicam os limites correspondentes às diferentes raridades.

Para saber até onde precisa vocalizar, basta observar *até onde se estende a cor correspondente à raridade da sua carta*.

Não é necessário memorizar o poema inteiro, contar versos manualmente ou adivinhar onde a invocação termina. A própria formatação do texto indica o trecho necessário.

## III. Complexidade das Coleções

Nem todas as Coleções possuem a mesma extensão ou complexidade ritualística. Por isso, os Cânticos são organizados em três padrões principais.

*Coleções Básicas*

São as mais simples e comportam, normalmente, cinco linhas de Cântico, distribuídas entre as raridades. Cada raridade corresponde a uma extensão específica do texto, conforme a marcação apresentada no site.

*Coleções de Complexidade Média*

Possuem o dobro da extensão ritualística das Coleções Básicas. Para invocar uma carta de determinada raridade, você deverá vocalizar o dobro da quantidade de linhas exigida pela mesma raridade em uma Coleção Básica.

*Coleções Complexas*

Possuem o triplo da extensão ritualística das Coleções Básicas. Consequentemente, a invocação de uma carta exige três vezes a quantidade de linhas normalmente necessária para sua raridade.

Esses padrões servem como referência geral. Algumas Coleções possuem regras próprias e não seguem essa distribuição, seja por exigirem uma sequência específica, seja por dispensarem completamente a necessidade de um Cântico.

Nesses casos, o site apresentará um aviso indicando as condições especiais da Coleção. Quando houver uma regra particular, ela sempre terá precedência sobre os padrões gerais.

Portanto, antes de invocar uma carta, verifique a complexidade de sua Coleção e observe a marcação colorida do Cântico. Assim, você saberá exatamente qual trecho precisa recitar.

*IV. A Virtude de Taças*

Record, talvez você esteja pensando que recitar poemas inteiros e executar movimentos ritualísticos parece um trabalho excessivo para alguém que só deseja utilizar uma carta.

Felizmente, existe uma Virtude capaz de tornar esse processo consideravelmente mais simples.

*Taças (Virtude nº 5)* representa, entre outras coisas, a facilidade com que você consegue utilizar uma carta e cumprir seus requisitos de invocação.

Conforme seu nível nessa Virtude, você pode obter três vantagens principais:

- *Redução de Gestos:* diminui a quantidade de movimentos exigidos pela carta.
- *Simplificação do Cântico:* reduz a quantidade de linhas que precisam ser vocalizadas.
- *Supressão da Vocalização:* permite recitar o Cântico mentalmente ou, em níveis superiores, eliminar completamente a necessidade de recitação.

Essas vantagens dependem do nível de Taças exigido para cada redução. Não basta possuir a Virtude: é necessário alcançar o patamar correspondente à vantagem pretendida.

Além disso, as reduções devem respeitar os requisitos individuais da carta e as regras particulares de sua Coleção. Dispensar a vocalização, por exemplo, não significa necessariamente dispensar os Gestos.

Em resumo, quanto maior sua aptidão em Taças, menos exigente poderá se tornar o processo de invocação.

*V. O Recuo Paranormal*

Nem toda invocação acontece sem consequências, Record. Em determinadas circunstâncias, o próprio destino parece se voltar contra aquele que tenta utilizar forças que não consegue controlar.

Esse fenômeno é conhecido como *Recuo Paranormal*.

O recuo representa uma consequência adversa associada à utilização inadequada de uma carta. Pode manifestar-se como um simples contratempo, um episódio de azar inesperado ou uma ocorrência consideravelmente mais grave, dependendo da intensidade envolvida.

Entretanto, preste atenção: *o Recuo Paranormal não é um dano automático sofrido após toda invocação.*

Se você cumprir corretamente os requisitos de uma carta e respeitar suas condições de utilização, não deverá presumir que sofrerá uma penalidade apenas por ter invocado seu efeito.

O recuo está particularmente relacionado às situações em que você descumpre os requisitos de invocação, interrompe o processo de preparação ou tenta utilizar uma carta sem atender às condições necessárias. Algumas cartas, porém, podem estabelecer exigências próprias, inclusive um nível mínimo de Recuo Paranormal para sua utilização. Quando isso acontecer, a condição específica deverá ser respeitada.

A intensidade do recuo é expressa por níveis. Quanto maior o nível, mais severa poderá ser a consequência narrativa.

*Escala de Recuo Paranormal*

A tabela abaixo serve como referência para interpretar a intensidade de um recuo. Os exemplos são ilustrativos, e a manifestação exata pode variar conforme a situação narrativa.

| *1 — Insignificante* | Azar simples e inconvenientes menores. | Tropeçar sem sofrer consequências relevantes, deixar um objeto cair ou esbarrar em alguém por distração. |
| *2 — Leve* | Contratempos perceptíveis, mas facilmente contornáveis. | Derrubar algo importante, perder uma oportunidade trivial ou ter um pequeno imprevisto que atrase seus planos. |
| *3 — Moderado* | Complicações capazes de prejudicar uma ação ou situação imediata. | Um equipamento falhar no momento inconveniente, uma informação chegar tarde ou um erro de execução comprometer uma tarefa. |
| *4 — Grave* | Ocorrências que provocam consequências sérias e exigem uma resposta imediata. | Um acidente significativo, uma falha crítica de equipamento ou uma circunstância inesperada que coloque o Record em uma situação perigosa. |
| *5 — Severo* | Acontecimentos de grande impacto, capazes de alterar drasticamente uma situação. | Uma sequência de imprevistos que comprometa uma operação inteira ou um acidente de consequências graves. |
| *6 — Catastrófico* | Uma adversidade excepcional, com repercussões extensas ou duradouras. | Uma sucessão extraordinária de acontecimentos desfavoráveis que provoque uma crise de grandes proporções. |

Essa escala não determina acontecimentos obrigatórios. Um recuo de nível 2, por exemplo, não precisa sempre resultar na perda de um objeto; pode assumir outra forma de azar de intensidade equivalente dependendo do critério narrativo.

Da mesma maneira, um nível elevado não significa que o Record sofrerá necessariamente dano físico. O recuo pode atingir seus planos, seu ambiente, seus recursos ou as circunstâncias ao seu redor.

O importante é que a manifestação seja coerente com o nível estabelecido e com a situação em que ocorreu a falha.

*Como Paus interfere no Recuo, ADM RUP?*

*Paus (Virtude nº 1)* representa a capacidade de suportar adversidades, estando associada à Resistência e ao Vigor.

No contexto dos Ritos de Invocação, essa Virtude determina quanto o Record consegue resistir ao Recuo Paranormal e reduzir suas consequências.

O dano de referência de uma carta é composto por dois elementos:

*Dano Paranormal = Dano-base da raridade + Adicional de balanceamento da carta.*

O dano-base estabelece uma intensidade mínima de referência de acordo com a raridade, enquanto o adicional considera as particularidades do efeito, como sua potência, abrangência e complexidade.

| Comum | 10 |
| Incomum | 20 |
| Rara | 30 |
| Ultra-Rara | 40 |
| Lendária| X |

Esses valores são referências de balanceamento, não pontos de vida. Devo não utiliza um sistema de HP, portanto o dano calculado deve ser interpretado narrativamente.

Para determinar a redução, compara-se o nível de Paus do Record com o nível de referência estabelecido para a carta:

| Paus inferior ao nível de referência | 0% |
| Paus equivalente ao nível de referência | 25% |
| Paus um nível acima | x% |
| Paus dois níveis acima | x% |
| Paus três ou mais níveis acima |100% |

A redução incide sobre o dano total de referência, incluindo o adicional de balanceamento. O resultado final não pode ser inferior a zero.

Se Paus for suficientemente elevado para anular o dano calculado, o Record poderá resistir completamente àquela intensidade de recuo. Isso não significa, entretanto, imunidade automática a todas as consequências narrativas possíveis.

*Importante:* a escala de dano e as reduções acima servem para estabelecer a intensidade de referência do recuo. Elas não significam que todo uso de uma carta provoque esse dano. A penalidade somente deverá ser aplicada quando as condições da carta ou as regras de invocação determinarem que houve um recuo.

--

o sistema de afinidades com npc:

*# [Um Visitante apareceu]*

[Visitantes são NPCs que possuem um sistema próprio de afinidade evolutiva.]

[De tempos em tempos, eles poderão aparecer na sua casa em busca de conversas fiadas, favores ou até mesmo intrigas.]

[A afinidade com cada Visitante é determinada pelas Essências de Afinidade.]

[Sempre que interagir com um deles, pense cuidadosamente em cada resposta. Suas escolhas podem criar, fortalecer ou prejudicar o relacionamento.]

[A maneira mais simples de evoluir esse vínculo é oferecer presentes compatíveis com os gostos pessoais do NPC.]

[Você pode adquirir esses presentes no Poço dos Milagres ou durante eventos.]

[Dependendo do grau de afinidade alcançado, um NPC com quem você tenha construído um vínculo suficientemente forte poderá recompensá-lo com Chaves de Torres, Pacotes de Cartas, Dracmas e muitos outros]

[Os NPCs com os quais você desenvolve relacionamentos ficam registrados no sistema, permitindo que seu vínculo seja consultado posteriormente.]

|

*# [Decorações]*

[A loja de decorações oferece móveis e enfeites capazes de aumentar as chances de um NPC específico aparecer na sua casa.]

[Cada NPC possui preferências próprias quanto à decoração. Por isso, alguns itens podem aumentar a probabilidade de certos Visitantes aparecerem, mas também reduzir as chances de atrair outros.]

|

*# [Hostilidade]*

[Visitantes hostis são diferentes daqueles que aparecem apenas em busca de confusão. Seu objetivo é prejudicá-lo diretamente, provocando problemas e causando sofrimento de diversas formas.]

[Quando um NPC hostil aparecer, você deverá encontrar um esconderijo o mais rápido possível ou descobrir alguma maneira de lidar com a ameaça.]

[Algumas decorações específicas podem reduzir as chances de Visitantes hostis aparecerem na sua casa.]

|

*# [Quartos de Hóspedes]*

[Quando sua afinidade com determinado NPC atingir um nível suficientemente alto, você poderá convidá-lo para morar na sua casa por tempo indeterminado.]

[Ter um Visitante como morador pode render recompensas secretas e desbloquear o acesso exclusivo a determinadas funções.]

[Entretanto, nem todos os Visitantes aceitam esse tipo de convite. Portanto, se você pretende construir esse vínculo com um personagem específico, certifique-se de que ele permite essa possibilidade antes de investir seu tempo nessa relação.]

--

também terá uma segunda tela onde possui os npcs já conhecidos, e você pode marcar ele com "paixão", isso faz ter mais chances dele aparecer e então você desbloqueia uma segunda barra com romance (além da de afinidade). conforme sobe seu romance você desbloqueia diálogos e até mesmo uma imagem especial de encontro (assim como é em amor doce) 

e por falar nisso, por agora se tratar de rpg maker, ao entrar nesse sistema de casa, há um tutorial de "fantasia" que é então a criação do avatar, com opções de penteado, pele, olhos, cor, roupas, etc. quero inspirado em animes. 

crie o sistema de doar suas horas a outro jogador, mas se fizer isso a alguém que não é da sua companhia, é crime, então você ganha mais pontos necro.. 

mas o que são pontos necro? existe o sistema de "caos e ordem" onde determinadas ações te dão honra ou necro. como sabe as necro companhias são detestadas pela companhia dos records. isso afeta as Torres de companhia e se npcs se comportarão de forma hostil ou não. 

essa parte ainda está em construção. 


--

para cada tela, coloque um subagente e um crítico. quero que compare lado a lado com rpgs makers e visual novels famosos e bem avaliados, além das referências enviadas. também acesse minha conta no pinterest para maiores apoios visuais, seja vendo meus pins salvos ou pesquisando referências. não poupe recursos ou qualidade, quero algo digno de um triple A. 

também otimize sistemas caso veja alguma brecha, como por exemplo na própria tela do salão de máscaras, se você for anfitrião para cima, poder autorizar de lá e também editar se já quer que um salão abra agora no padrão de três dias, ou que um owner possa desfazer a ação de alguém ter enviado recompensa, etc. pode sempre dar sugestões de coisas que seriam interessantes e eu aprovo se gostar. 
 
lembrando que é para redesenhar todas as telas, esqueça tudo que tem atualmente. inclusive os npcs, também tem que estar no padrão indicado. 

jogadores novatos: o único devo que aparece para ele é o chamado "tutorial". ou seja, caso um dealer ou quem quer que crie um devo, tem o tipo tutorial. este é apenas para alguém entender como funciona lá no WhatsApp, é apenas para tipificar. assim que finalizar um tutorial aí ele pode ver todos os outros devos que estão abertos para inscrição e as demais coisas. 

sobre a casa, quero que eventualmente a pessoa possa alterar a skin dela e mais cômodos, como uma melhoria basicamente ao subir de nível (ainda estamos discutindo essa parte, mas já deixe estruturado..) 

o card shuffler passa a ser outro objeto, agora que existe a questão do rito e tudo mais..
