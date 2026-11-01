# SPEC: Ritos de Invocação das cartas (DEVO v2)

Especificação dos Ritos de Invocação: Gestos, Cânticos por Coleção, Virtude de Taças, Recuo Paranormal e a
resistência de Paus. Inclui os campos novos da carta, a ficha da carta e uma **proposta** de objeto do rito na
Casa, com duas opções para o dono (P4-bis, seção 3.1). O que o Card Shuffler vira continua sendo decisão dele.

Base:
- Pedido do dono em `PEDIDO-V2-dono.md` ("Manual de utilização de Cartas — Deadly Vote", linhas 21-186, e a
  linha 263 sobre o Shuffler), com as correções de 01/11 no topo do arquivo.
- Código atual:
  - cartas, raridades, peso e coleções: `lib/devo/cards.ts`, `lib/devo/types.ts`;
  - Virtudes: `lib/devo/virtudes.ts`, tabelas `virtude_pp`/`virtude_nivel`;
  - Deadly Vote: `lib/devo/record-server.ts`, coluna `deadly_vote_entries.cartas`;
  - Shuffler: `lib/devo/shuffler.ts`, `components/devo/shared/deck-panel.tsx`, `apps/cartas-app.tsx`,
    `apps/record-app.tsx`, `system/record-file.tsx`, `salao/salao-enviar.tsx`.
- Specs v2 que continuam valendo: `SPEC-CASA.md` (PENDENTE 7 e PROPOSTA P4: esta spec **não** as responde;
  oferece as opções A e B da P4-bis, e a opção B é a própria P4 da Casa), `SPEC-AVATAR.md` (estado `gesto`),
  `REFERENCIAS.md` §2.9.

Convenções:
- Trecho em bloco de citação é **texto literal do dono**. Não se reescreve nem se "corrige".
- **PENDENTE n** remete à lista da seção 10. Valor que o dono deixou como `x`/`X` aparece como `x`/`X` na tela e
  como `null` no banco, com `provisional = true`. A spec não inventa número final.
- **PROPOSTA Pn** é decisão desta spec que o dono pode recusar.
- **Interface do DEVO** = identidade gótica (ametista, mármore negro, aço champanhe, cobalto, arte pintada),
  com desenho novo. Nada de pixel. **Casa** = cena de RPG Maker/visual novel (avatar anda, objetos que se
  tocam, caixa de diálogo com retrato). A técnica da Casa ficou decidida no `MOTOR-CASA-TORRES.md`: **cenário
  pintado em camadas**, sem pixel (harmonização de 01/11). Esta spec só põe um objeto lá dentro.
- *(Harmonizado em 01/11.)* A observação antiga dizia que as cores de raridade da `BIBLIA.md` §3 vinham do kit em
  pixel. Isso valia para a primeira bíblia. A bíblia atual traz uma paleta nova de raridade (pedra, jade, safira,
  orquídea, ouro velho), proposta para o jogo inteiro. Se o dono aprovar, o marca-texto do 3.5 troca as cores e
  mantém a borda e o selo de cada raridade; o contraste é medido de novo. Até lá, 3.5 fica como está. Os glifos de
  Gesto são **vetoriais** (SVG, traço de aço champanhe sobre medalhão pintado), também dentro da Casa.
- Valores têm três estados, nunca dois: **pendente** (`null`, tela mostra `x`), **definido** (número do dono) e
  **zero confirmado** (o dono disse que é zero ou "nenhum"; selo "sem adicional", "sem redução" etc.). Zero só
  entra no banco com o estado `zero_confirmado` marcado por Owner. Assim a conta destrava quando o dono decidir,
  sem trocar `x` por 0 escondido.

---

## 1. Objetivo para o jogador

Hoje, no DEVO, ter uma carta basta para usá-la no Deadly Vote. No v2 algumas cartas pedem um rito. O jogador
precisa:

1. **saber o que cada carta exige**: quais Gestos, em que ordem, e até que linha do Cântico da Coleção. A ficha
   da carta mostra isso sem que ele precise contar versos;
2. **sentir o próprio crescimento**: com mais Taças, o rito encurta. A ficha mostra o que foi cortado,
   riscado, em vez de sumir com ele;
3. **entender o risco**: errar ou interromper o rito pode trazer Recuo Paranormal. Paus amortece. A escala de 1
   a 6 fica sempre à mão, com o texto do dono;
4. **praticar sem custo** num objeto da Casa que guarda o Cantoral (os Cânticos) e o repertório de Gestos. Se esse
   objeto também assume o papel do Card Shuffler (sorteio, Bandeja, peso do próximo Deadly Vote) é a escolha A/B
   da P4-bis (3.1), do dono;
5. **levar o rito para o grupo**: um botão "Copiar meu rito" gera o texto curto que ele cola no WhatsApp (4.2).

Para o Dealer, o objetivo é ter na mão, para cada Record inscrito e cada carta levada, o rito que aquele Record
deve cumprir e a referência de dano do Recuo já com a redução de Paus. A narração continua dele.

O jogo em si (o Deadly Vote) acontece no WhatsApp, narrado. O site não executa a invocação durante a partida.
Ele é **a referência** ("Nos textos disponibilizados pelo site…"), **a ferramenta do Dealer** e **o lugar de
treino**. Como o rito é feito no grupo fica na PENDENTE 14.

---

## 2. Regras do dono (literais) e como o sistema as lê

### 2.1 Abertura

> Record, nem toda carta pode ser utilizada simplesmente porque você deseja fazê-lo. Algumas exigem movimentos
> específicos, outras demandam palavras cuidadosamente pronunciadas e há aquelas que, felizmente para você, não
> exigem absolutamente nada. Afinal, seria bastante inconveniente precisar recitar um poema inteiro toda vez que
> quisesse fazer alguma coisa útil...

> Para compreender como uma carta é invocada, você precisa conhecer dois elementos fundamentais: *Gestos e
> Cânticos*. Ambos fazem parte dos Ritos de Invocação, mas funcionam de maneiras distintas.

Leitura: uma carta pode exigir Gestos, Cântico, os dois ou nada. "Nada" é um estado válido e aparece na ficha
como **"Sem rito"**, não como campo vazio.

### 2.2 Gestos: repertório compartilhado

> Os Gestos são movimentos ritualísticos exigidos por determinadas cartas. Cada movimento possui uma denominação
> e um simbolismo próprios, integrando um repertório compartilhado entre diferentes cartas, coleções e raridades.

> Isso significa que duas cartas completamente distintas podem exigir exatamente o mesmo gesto, ainda que seus
> efeitos não possuam qualquer relação aparente. Da mesma forma, uma carta pode exigir um único movimento,
> enquanto outra demanda uma sequência de vários deles.

> A quantidade e a ordem dos gestos necessários são determinadas individualmente por cada carta. Portanto, não
> presuma que duas cartas semelhantes devam compartilhar os mesmos requisitos.

> A boa notícia é que você não precisa aprender um gesto novo para cada carta que encontrar. Ao compreender o
> repertório gestual, será capaz de reconhecer movimentos já conhecidos em novas invocações.

> Naturalmente, existe uma maneira de tornar tudo isso menos trabalhoso: a Virtude de Taças pode reduzir a
> quantidade de gestos exigidos por uma carta, conforme o nível de aptidão do Record.

Leitura para o modelo:
- **Repertório** = catálogo global de Gestos. Cada um tem `nome` e `simbolismo` (texto do dono), um glifo e uma
  animação. Não pertence a coleção nem a raridade.
- **Requisito da carta** = lista **ordenada** de referências ao repertório. A mesma referência pode repetir
  (sequência "A, B, A"). A lista pode ter um item ou vários.
- Nenhum Gesto é deduzido de outra carta parecida. Cada carta tem a sua lista, e uma carta sem lista cadastrada
  aparece como "Rito a definir", nunca com uma lista copiada.
- Nomes, simbolismos e o tamanho do repertório: PENDENTE 4. A spec não propõe nomes.

### 2.3 Cânticos por Coleção

> Os Cânticos funcionam de maneira um pouco diferente.

> Cada Coleção possui seu próprio texto ritualístico, composto por linhas que devem ser vocalizadas para
> permitir a invocação de suas cartas. Diferentemente dos Gestos, que são compartilhados livremente entre
> cartas, os Cânticos pertencem às respectivas Coleções e não devem ser confundidos entre si.

> Uma mesma Coleção pode conter cartas de diferentes raridades, mas isso não significa que todas precisem
> recitar o texto completo. Pelo contrário: *a raridade da carta determina até qual linha do Cântico você
> precisa vocalizar.*

O exemplo do dono, literal (vai inteiro para o Manual de Cartas, seção 4.4):

> Imagine, por exemplo, que você tenha encontrado a Coleção *Inúteis*. Seu Cântico é composto pelo seguinte
> poema:
>
> > Imagine que isso é um poema muito bom.
> >
> > Esse poema é tão incrível que você vai amar.
> >
> > Sinta a força desse poema maravilhoso.
> >
> > Sob o luar.
> >
> > Lindo.
>
> Sim, Record. Você precisará lidar com isso.
>
> Entretanto, a quantidade de linhas exigidas depende da carta que pretende invocar.
>
> - *Carta Comum:* exige somente a primeira linha. Basta dizer: *"Imagine que isso é um poema muito bom."*
> - *Carta Rara:* exige as duas primeiras linhas. Você deverá dizer: *"Imagine que isso é um poema muito bom.
>   Esse poema é tão incrível que você vai amar."*
> - *Cartas de outras raridades:* exigirão a quantidade de linhas correspondente à sua posição na escala da
>   Coleção.

> Observe que você não escolhe quais linhas deseja recitar. A invocação deve seguir a ordem original do texto,
> começando sempre pela primeira linha e avançando até alcançar o trecho exigido pela carta.

**Marca-texto:**

> Nos textos disponibilizados pelo site, as linhas dos Cânticos são organizadas com marca-textos coloridos que
> indicam os limites correspondentes às diferentes raridades.

> Para saber até onde precisa vocalizar, basta observar *até onde se estende a cor correspondente à raridade da
> sua carta*.

> Não é necessário memorizar o poema inteiro, contar versos manualmente ou adivinhar onde a invocação termina. A
> própria formatação do texto indica o trecho necessário.

Leitura:
- O requisito de Cântico é sempre um **prefixo**: linhas 1..N. Nunca um intervalo no meio, nunca linhas
  escolhidas.
- N depende da raridade **e** da Coleção. Por isso cada Coleção guarda o seu mapa `limites[raridade] = N`.
- **Conflito com o código atual (PENDENTE 1).** O jogo tem cinco raridades de jogo em ordem: Comum, Incomum,
  Rara, Ultra Rara, Lendária (`RARITY_META`). Pela posição, a Rara seria a 3ª e exigiria 3 linhas. O exemplo
  diz 2. Há três leituras, e o dono escolhe (PENDENTE 1). O exemplo de *Inúteis* (5 linhas) desenhado em cada
  uma:

  | Leitura | Comum | Incomum | Rara | Ultra Rara | Lendária | Problema |
  |---|---|---|---|---|---|---|
  | (a) posição entre as raridades **presentes** na Coleção (supondo *Inúteis* sem Incomum) | 1 | n/a | 2 | 3 | 4 | muda se uma raridade nova entrar na Coleção (ver abaixo) |
  | (b) Rara = 2 sempre; o dono dá as outras | 1 | `x` | 2 | `x` | `x` | Incomum fica entre 1 e 2, sem linha inteira livre |
  | (c) uma linha por raridade, nas cinco | 1 | 2 | 3 | 4 | 5 | contradiz o exemplo (Rara = 2) |

  **PROPOSTA P1**, válida em qualquer leitura: o mapa `limites[raridade]` é **gravado e travado** por Coleção
  no cadastro (`limites_travados_em`). O site nunca recalcula o mapa sozinho. Se uma carta de raridade nova
  entrar depois na Coleção (por Confecção ou Pacote), a Mesa mostra o aviso "Nova raridade em *Inúteis*:
  decidir o limite" e a carta nova fica "Rito a definir" até alguém decidir. As cartas antigas não mudam de
  rito sem uma edição explícita, que sobe `versao` e aparece no histórico da Coleção. Na leitura (a), o mapa
  calculado pelas raridades presentes é só a **sugestão** que a Mesa preenche na hora de travar.
- As raridades secretas (Única, Promocional) não aparecem no texto do dono: PENDENTE 2.

### 2.4 Complexidade das Coleções

> Nem todas as Coleções possuem a mesma extensão ou complexidade ritualística. Por isso, os Cânticos são
> organizados em três padrões principais.

> *Coleções Básicas*
> São as mais simples e comportam, normalmente, cinco linhas de Cântico, distribuídas entre as raridades. Cada
> raridade corresponde a uma extensão específica do texto, conforme a marcação apresentada no site.

> *Coleções de Complexidade Média*
> Possuem o dobro da extensão ritualística das Coleções Básicas. Para invocar uma carta de determinada raridade,
> você deverá vocalizar o dobro da quantidade de linhas exigida pela mesma raridade em uma Coleção Básica.

> *Coleções Complexas*
> Possuem o triplo da extensão ritualística das Coleções Básicas. Consequentemente, a invocação de uma carta
> exige três vezes a quantidade de linhas normalmente necessária para sua raridade.

> Esses padrões servem como referência geral. Algumas Coleções possuem regras próprias e não seguem essa
> distribuição, seja por exigirem uma sequência específica, seja por dispensarem completamente a necessidade de
> um Cântico.

> Nesses casos, o site apresentará um aviso indicando as condições especiais da Coleção. Quando houver uma regra
> particular, ela sempre terá precedência sobre os padrões gerais.

> Portanto, antes de invocar uma carta, verifique a complexidade de sua Coleção e observe a marcação colorida do
> Cântico. Assim, você saberá exatamente qual trecho precisa recitar.

Leitura:

| Complexidade | Linhas do texto | Linhas exigidas por raridade |
|---|---|---|
| `basica` | normalmente 5 | `limites_basicos[raridade]` (ver 2.3, P1) |
| `media` | 2 × as da básica | 2 × `limites_basicos[raridade]` |
| `complexa` | 3 × as da básica | 3 × `limites_basicos[raridade]` |
| `propria` | qualquer | o que o aviso da Coleção disser; pode ser "sem Cântico" ou "sequência específica" |

- Os multiplicadores 2 e 3 são do dono e ficam no código, não em configuração.
- "normalmente cinco": uma Coleção básica com outro número de linhas é aceita, mas a Mesa avisa quem cadastra.
- Regra própria = texto livre do dono (o "aviso"), mostrado em destaque acima do Cântico, mais um modo que o
  servidor entende: `sem_cantico`, `sequencia_especifica` (as linhas exigidas são uma lista fixa, não um
  prefixo) ou `so_aviso` (o servidor não calcula, o Dealer lê o aviso). Precedência: regra própria > padrão.
- Complexidade de Xadrez e de Iniciais, e os textos dos Cânticos: PENDENTE 3. Nenhum Cântico é escrito por
  agente.

### 2.5 Virtude de Taças

> Record, talvez você esteja pensando que recitar poemas inteiros e executar movimentos ritualísticos parece um
> trabalho excessivo para alguém que só deseja utilizar uma carta.

> Felizmente, existe uma Virtude capaz de tornar esse processo consideravelmente mais simples.

> *Taças (Virtude nº 5)* representa, entre outras coisas, a facilidade com que você consegue utilizar uma carta
> e cumprir seus requisitos de invocação.

> Conforme seu nível nessa Virtude, você pode obter três vantagens principais:
>
> - *Redução de Gestos:* diminui a quantidade de movimentos exigidos pela carta.
> - *Simplificação do Cântico:* reduz a quantidade de linhas que precisam ser vocalizadas.
> - *Supressão da Vocalização:* permite recitar o Cântico mentalmente ou, em níveis superiores, eliminar
>   completamente a necessidade de recitação.

> Essas vantagens dependem do nível de Taças exigido para cada redução. Não basta possuir a Virtude: é
> necessário alcançar o patamar correspondente à vantagem pretendida.

> Além disso, as reduções devem respeitar os requisitos individuais da carta e as regras particulares de sua
> Coleção. Dispensar a vocalização, por exemplo, não significa necessariamente dispensar os Gestos.

> Em resumo, quanto maior sua aptidão em Taças, menos exigente poderá se tornar o processo de invocação.

O código confirma a numeração do dono: em `VIRTUDE_KEYS`, `paus` é a 1ª e `tacas` a 5ª.

**Patamares.** O dono fala em **três** vantagens. Esta spec propõe desdobrar a terceira em dois degraus, com
base em "ou, em níveis superiores, eliminar completamente" (**PROPOSTA P2a**: quatro patamares). Se o dono
quiser três patamares, T3 e T4 viram um só, e a Supressão passa de `voz` direto a `dispensado` ou só a
`mental`, como ele disser.

| Patamar | Vantagem (texto do dono) | Nível de Taças | Quanto |
|---|---|---|---|
| T1 | Redução de Gestos | `x` | `{forma: x, valor: x}` |
| T2 | Simplificação do Cântico | `x` | `{forma: x, valor: x}` |
| T3 | Supressão da Vocalização: recitar mentalmente | `x` | n/a |
| T4 (P2a) | Supressão da Vocalização: sem recitação | `x` | n/a |

O dono só disse "diminui a quantidade" e "reduz a quantidade de linhas". A forma da redução **não** está
decidida e fica guardada como estrutura aberta: `forma` pode ser `fixo` (k itens a menos), `percentual` (p% a
menos, arredondado conforme o dono), `por_carta` (cada carta diz quanto perde) ou outra que ele descrever;
`valor` é `null`. Tudo isso é PENDENTE 6. A ordem da tabela não supõe que T1 venha antes de T2.

**Como a redução se aplica (PROPOSTA P2, cada ponto recusável em separado):**
- **Gestos** (P2b): cada Gesto da carta pode ser marcado `essencial`. A redução corta primeiro os não
  essenciais, do último para o primeiro, e nunca corta um essencial. A ordem dos que ficam não muda. Carta com
  `gestos_redutiveis = false` não perde nenhum.
- **Cântico** (P2c): a redução encurta o prefixo pelo fim (linhas 1..N passam a 1..N−k). A ordem continua
  "começando sempre pela primeira linha". Duas sub-propostas, ambas pendentes de confirmação (PENDENTE 6):
  - em Coleção Média ou Complexa, a redução vale **depois** do multiplicador 2 ou 3 (corta linhas do trecho já
    multiplicado). A alternativa é reduzir antes e multiplicar depois, o que corta 2 ou 3 vezes mais;
  - o rito nunca cai abaixo de 1 linha (sem isso, a Simplificação viraria Supressão por outra porta).
  Coleção com regra própria `sequencia_especifica` não é simplificada, a menos que o aviso diga o contrário.
- **Supressão** (P2d): muda só o **modo** do Cântico (`voz` → `mental` → `dispensado`). Os Gestos não mudam
  ("Dispensar a vocalização… não significa necessariamente dispensar os Gestos"). Carta com
  `vocalizacao_obrigatoria` ignora T3 e T4.
- Com T4, a ficha ainda mostra o Cântico (riscado), para o jogador ver o que deixou de fazer.

### 2.6 Recuo Paranormal

> Nem toda invocação acontece sem consequências, Record. Em determinadas circunstâncias, o próprio destino
> parece se voltar contra aquele que tenta utilizar forças que não consegue controlar.

> Esse fenômeno é conhecido como *Recuo Paranormal*.

> O recuo representa uma consequência adversa associada à utilização inadequada de uma carta. Pode
> manifestar-se como um simples contratempo, um episódio de azar inesperado ou uma ocorrência
> consideravelmente mais grave, dependendo da intensidade envolvida.

> Entretanto, preste atenção: *o Recuo Paranormal não é um dano automático sofrido após toda invocação.*

> Se você cumprir corretamente os requisitos de uma carta e respeitar suas condições de utilização, não deverá
> presumir que sofrerá uma penalidade apenas por ter invocado seu efeito.

> O recuo está particularmente relacionado às situações em que você descumpre os requisitos de invocação,
> interrompe o processo de preparação ou tenta utilizar uma carta sem atender às condições necessárias. Algumas
> cartas, porém, podem estabelecer exigências próprias, inclusive um nível mínimo de Recuo Paranormal para sua
> utilização. Quando isso acontecer, a condição específica deverá ser respeitada.

> A intensidade do recuo é expressa por níveis. Quanto maior o nível, mais severa poderá ser a consequência
> narrativa.

**Escala de Recuo Paranormal** (literal; o cabeçalho das colunas não veio no texto do dono e a tela usa
"Nível · Intensidade · Exemplos", PENDENTE 20):

> A tabela abaixo serve como referência para interpretar a intensidade de um recuo. Os exemplos são
> ilustrativos, e a manifestação exata pode variar conforme a situação narrativa.

| Nível | Intensidade | Exemplos |
|---|---|---|
| *1 — Insignificante* | Azar simples e inconvenientes menores. | Tropeçar sem sofrer consequências relevantes, deixar um objeto cair ou esbarrar em alguém por distração. |
| *2 — Leve* | Contratempos perceptíveis, mas facilmente contornáveis. | Derrubar algo importante, perder uma oportunidade trivial ou ter um pequeno imprevisto que atrase seus planos. |
| *3 — Moderado* | Complicações capazes de prejudicar uma ação ou situação imediata. | Um equipamento falhar no momento inconveniente, uma informação chegar tarde ou um erro de execução comprometer uma tarefa. |
| *4 — Grave* | Ocorrências que provocam consequências sérias e exigem uma resposta imediata. | Um acidente significativo, uma falha crítica de equipamento ou uma circunstância inesperada que coloque o Record em uma situação perigosa. |
| *5 — Severo* | Acontecimentos de grande impacto, capazes de alterar drasticamente uma situação. | Uma sequência de imprevistos que comprometa uma operação inteira ou um acidente de consequências graves. |
| *6 — Catastrófico* | Uma adversidade excepcional, com repercussões extensas ou duradouras. | Uma sucessão extraordinária de acontecimentos desfavoráveis que provoque uma crise de grandes proporções. |

> Essa escala não determina acontecimentos obrigatórios. Um recuo de nível 2, por exemplo, não precisa sempre
> resultar na perda de um objeto; pode assumir outra forma de azar de intensidade equivalente dependendo do
> critério narrativo.

> Da mesma maneira, um nível elevado não significa que o Record sofrerá necessariamente dano físico. O recuo
> pode atingir seus planos, seu ambiente, seus recursos ou as circunstâncias ao seu redor.

> O importante é que a manifestação seja coerente com o nível estabelecido e com a situação em que ocorreu a
> falha.

Leitura:
- O site **não aplica** Recuo sozinho. Quem decide que houve recuo e o nível é o narrador (Dealer). O site
  guarda o registro se o Dealer quiser registrar (PENDENTE 13).
- Os gatilhos do dono viram o campo `motivo` do registro: `descumpriu_requisito`, `interrompeu_preparacao`,
  `sem_condicao`, `exigencia_da_carta`, `outro`.
- "nível mínimo de Recuo Paranormal para sua utilização" vira o campo `recuo_exigido` (1..6) da carta. O sentido
  exato (o recuo vem sempre, com nível mínimo N, mesmo com o rito cumprido? ou só cartas usadas por quem já
  sofreu recuo N?) é PENDENTE 12. Até lá, a ficha mostra o texto da condição escrito pelo dono, sem
  interpretar.

### 2.7 Paus contra o Recuo

> *Como Paus interfere no Recuo, ADM RUP?*

> *Paus (Virtude nº 1)* representa a capacidade de suportar adversidades, estando associada à Resistência e ao
> Vigor.

> No contexto dos Ritos de Invocação, essa Virtude determina quanto o Record consegue resistir ao Recuo
> Paranormal e reduzir suas consequências.

> O dano de referência de uma carta é composto por dois elementos:

> *Dano Paranormal = Dano-base da raridade + Adicional de balanceamento da carta.*

> O dano-base estabelece uma intensidade mínima de referência de acordo com a raridade, enquanto o adicional
> considera as particularidades do efeito, como sua potência, abrangência e complexidade.

| Raridade | Dano-base |
|---|---|
| Comum | 10 |
| Incomum | 20 |
| Rara | 30 |
| Ultra-Rara | 40 |
| Lendária | X |

> Esses valores são referências de balanceamento, não pontos de vida. Devo não utiliza um sistema de HP,
> portanto o dano calculado deve ser interpretado narrativamente.

> Para determinar a redução, compara-se o nível de Paus do Record com o nível de referência estabelecido para a
> carta:

| Comparação | Redução |
|---|---|
| Paus inferior ao nível de referência | 0% |
| Paus equivalente ao nível de referência | 25% |
| Paus um nível acima | x% |
| Paus dois níveis acima | x% |
| Paus três ou mais níveis acima | 100% |

> A redução incide sobre o dano total de referência, incluindo o adicional de balanceamento. O resultado final
> não pode ser inferior a zero.

> Se Paus for suficientemente elevado para anular o dano calculado, o Record poderá resistir completamente
> àquela intensidade de recuo. Isso não significa, entretanto, imunidade automática a todas as consequências
> narrativas possíveis.

> *Importante:* a escala de dano e as reduções acima servem para estabelecer a intensidade de referência do
> recuo. Elas não significam que todo uso de uma carta provoque esse dano. A penalidade somente deverá ser
> aplicada quando as condições da carta ou as regras de invocação determinarem que houve um recuo.

Conta (servidor, `lib/devo/ritos.ts`):

```
danoRef   = DANO_BASE[raridade] + adicional_da_carta          // null se qualquer parcela for null
delta     = nivelPaus(record) − paus_referencia_da_carta     // null se o nível ou a referência faltar
reducao   = delta < 0 ? 0 : delta == 0 ? 25 : delta == 1 ? P1x : delta == 2 ? P2x : 100   // P1x/P2x = null hoje
danoFinal = max(0, danoRef × (1 − reducao/100))
```

- Com qualquer `null` no caminho, a resposta traz `pendente: [...]` com o que falta, e a tela mostra `x`. Nunca
  zero no lugar de `x`.
- **Adicional**: o dono diz que ele "considera as particularidades do efeito". Uma carta sem particularidade
  precisa de um jeito de dizer "sem adicional" que não seja `null`. Por isso o adicional tem `adicional_estado`
  (`pendente` · `definido` · `zero_confirmado`); com `zero_confirmado`, `danoRef = DANO_BASE[raridade]` e a
  ficha mostra "sem adicional". O mesmo vale para os dois `x%` de Paus em `devo_config` (7.2).
- **Quem vê os números.** A regra do dono em `VIRTUDES.md` ("NÃO É PRECISO SE PREOCUPAR COM OS NÚMEROS… O BOT É
  O ÚNICO QUEM CUIDA DESSAS INFORMAÇÕES") é sobre Virtudes, mas pesa aqui. Até o dono responder (PENDENTE 23),
  o jogador **não** vê números de dano: a ficha mostra a referência em palavras, por faixa de raridade
  ("referência: leve · moderada · forte · muito forte"), como o Darkest Dungeon mostra ameaça em faixas. Os
  números ficam para Dealer, supervisor, Owner e Anfitrião. As palavras das faixas são **PROPOSTA P3b** e podem
  ser trocadas pelo dono.
- **"nível de Paus" não existe hoje.** O banco guarda `virtude_nivel.valor` (soma decimal dos ganhos de cada
  Evolução), não um nível inteiro. Para comparar com o "nível de referência" da carta é preciso uma régua
  valor → nível. A mesma régua serve para os patamares de Taças. PENDENTE 7. A spec propõe uma tabela de
  limiares em `devo_config['ritos.virtude_niveis']` (`[{nivel:1, a_partir_de:x}, …]`), igual para todas as
  Virtudes, com override por Virtude se o dono quiser (**PROPOSTA P3**).
- Raridades secretas e Lendária sem dano-base: PENDENTE 9.
- Como o dano (10, 20, 30…) se liga à escala de 1 a 6, se é que se liga: PENDENTE 11. A spec não converte um no
  outro. O registro guarda os dois separados.
- "ADM RUP" é o interlocutor da pergunta no manual do dono. Quem é ele na tela (NPC, narrador, assinatura do
  manual): PENDENTE 20.

### 2.8 Card Shuffler

> "o card shuffler passa a ser outro objeto, agora que existe a questão do rito e tudo mais.."

O que o Shuffler é hoje, no código e nos textos:

| Papel | Onde | Texto do dono? |
|---|---|---|
| Objeto do pacto que faz de alguém um Record. "Um Record é um indivíduo com a capacidade de possuir um Card Shuffler. Um Card Shuffler, por sua vez, é o objeto que você adquiriu quando firmou aquele acordo. Ele está com você agora." | `lib/devo/prologue-script.ts:140` | sim, fala da Melissa |
| Guarda Tempo: "Uma determinada quantidade de tempo é retirada do seu Shuffler." | `dialogo/cenas/melissa-corporacoes.ts:42`, `corporacoes-melissa.ts:41`, `devo_config narrativa.melissa_corporacoes.multa_min` | sim |
| Canal para a Bandeja do Salão: "…podem ser enviados para a aba chamada **Bandeja**, por meio do seu Shuffler." | `lib/devo/salao-herdeiro.ts:31`, `salao/salao-enviar.tsx` (`EnviarBandejaAcao`), `salao-abas.tsx` ("Enviar pelo Shuffler") | a fala do Herdeiro, sim |
| Estado Dormente → Desperto (desperta com a Sala de Jogos, `state.arcadeUnlocked`) e fases Embaralhando / Sincronia completa | `lib/devo/shuffler.ts`, `system/record-file.tsx` (linha "Card Shuffler" na ficha do Record) | não |
| Widget: astrolábio de relógio com cartas em órbita; tocar no olho sorteia uma carta do inventário e abre a ficha dela (`drawRandom`) | `shared/deck-panel.tsx` (`CardShuffler`, `DeckPanel`), `apps/cartas-app.tsx`, `apps/record-app.tsx` | não |

O dono disse que o Shuffler "passa a ser outro objeto", mas não disse qual nem onde. A `SPEC-CASA.md` deixou
isso como PENDENTE 7 e manteve o Shuffler fora da casa. Esta spec **não** responde por ele. A seção 3.1 traz
duas opções (P4-bis A e B). Em qualquer uma, os papéis de **lore** (pacto, Tempo, Bandeja "por meio do seu
Shuffler") são falas do dono e não mudam sem ele (PENDENTE 15). Por isso, enquanto essas falas existirem, um
objeto chamado "Card Shuffler" **continua visível** na interface (Record e Salão), para que o prólogo não fale de
algo que o jogador nunca vê.

---

## 3. Propostas desta spec

### 3.1 O objeto do rito na Casa: o Retábulo (nome provisório)

**PROPOSTA P4-bis.** Um objeto da Casa para o rito, com duas opções de alcance. O dono escolhe uma (PENDENTE 24,
que é a mesma pergunta da PENDENTE 7 da `SPEC-CASA.md`), e a escolha fica registrada nas duas specs.

| | **Opção A: o Retábulo concentra tudo** | **Opção B: o Retábulo é só treino e consulta** |
|---|---|---|
| Na Casa | Cantoral, Repertório, Balança (peso do próximo DV), "Tirar uma carta" e "Enviar à Bandeja" | Cantoral e Repertório, mais Ensaiar. Sem sorteio, sem Bandeja, sem Balança. É a P4 da `SPEC-CASA.md` |
| Card Shuffler na interface | Continua no Record e no Salão, redesenhado, como atalho para as mesmas ações, enquanto as falas do dono o citarem (2.8). Só sai da interface se o dono mudar as falas (PENDENTE 15) | Continua no Record e no Salão, redesenhado (sorteio, Bandeja, estados). O Retábulo não o substitui |
| `deck-panel.tsx` | Redesenhado; ganha o atalho "Retábulo na Casa" | Redesenhado; sem mudança de função |
| Vantagem | Um lugar bonito e único para tudo o que é carta | Não mexe no que hoje funciona; a Casa ganha função sem virar pedágio |
| Risco | Duas portas para as mesmas ações (Casa e Record) | O "outro objeto" do dono continua sem resposta |

Esta spec descreve o objeto na versão A, a mais completa. Na B, o painel da Balança não existe e o Retábulo
tem dois painéis (Cantoral e Repertório), com a gaveta Ensaiar. Nome de trabalho: **retábulo**, um oratório
vertical de mármore negro e cristal que se abre como tríptico (ou díptico, na B). Alternativas para o dono:
Retábulo, Relicário, Cantoral, ou "Card Shuffler" (PENDENTE 15).

Por que um retábulo e não outra versão do astrolábio:
- O dono pediu redesign, não reaproveitamento. O Shuffler de hoje é um mostrador redondo com cartas em
  órbita. O retábulo é **vertical, fechado e cerimonial**: o lugar onde se lê e se ensaia.
- O rito é feito de texto (Cântico), corpo (Gestos) e consequência (Recuo, peso). Cada um ganha um painel.
- Referências do dono que ele combina (sem copiar):
  - ref-09: salão gótico com vitrais e mostrador ao fundo; a luz que atravessa o vidro;
  - ref-11: gaiola ornamental e estandarte, para a redoma e a filigrana;
  - ref-19: objeto em duas etapas, para o retábulo fechado e aberto;
  - ref-20: cristal, mecanismo e cartas suspensas, só no painel da balança;
  - ref-21: livros abertos como escolha, para o Cantoral;
  - ref-14: medalhões ligados por fios, para o repertório de Gestos.

**No cômodo da Casa** (RPG Maker/VN, cenário pintado em camadas, `MOTOR-CASA-TORRES.md`): o objeto aparece já
com mármore, filetes de aço champanhe e a ametista lapidada, na escala do cenário (o avatar tem 1,70 m na régua,
`SPEC-AVATAR.md` §2.3). A versão simplificada em pixel saiu na harmonização de 01/11.
A ametista fica apagada quando dormente e com brilho lento quando desperta, e as portas ficam
fechadas no mapa. Encosta na parede da Oficina (ou da Sala, conforme PENDENTE 4 da `SPEC-CASA.md`).

**Close-up em 2.5D** (React Three Fiber; o projeto já tem Three.js e R3F). Ao tocar no objeto, a câmera entra
no retábulo e as portas se abrem. O close-up é **pintado** (mármore, cristal, luz), como o cômodo. A
passagem é tratada como corte de VN: o cômodo escurece em íris de 200 ms centrada no objeto, e o close-up entra
com o mesmo enquadramento do quadro de diálogo da Casa, como "olhar de perto".

| Painel | Nome de trabalho | O que tem | Função |
|---|---|---|---|
| Esquerdo | **Cantoral** | Livro aberto num atril, páginas de velino negro e marca-texto por raridade | Ler o Cântico de cada Coleção que o jogador conhece (4.3) |
| Central | **Repertório** | Medalhões de cristal em arco ligados por fios de aço champanhe; o Gesto escolhido gira no centro | Ver cada Gesto (nome, simbolismo, animação) e quais cartas do jogador o usam |
| Direito (só opção A) | **Balança** | Balança de dois pratos sob redoma de cristal; cartas suspensas acima do prato | Montar as cartas do próximo Deadly Vote dentro do peso máximo (3.4), tirar uma carta e enviar carta à Bandeja |

Na base, uma gaveta: **Ensaiar** (3.3).

**No celular (390 × 844).** Um painel por vez, em tela cheia:
- troca de painel por deslize horizontal; a câmera gira 30° dentro do tríptico, de um painel ao próximo, com
  mola curta. Embaixo, um indicador de três losangos (dois na opção B), tocável;
- "Ensaiar" é uma gaveta que sobe da base, na zona do polegar, com alça visível;
- voltar ao mapa pelo gesto de voltar do sistema (`useBackHandler`) ou pelo botão "‹ Casa" no canto superior
  esquerdo; a câmera recua e as portas se fecham (250 ms);
- inclinação pelo giroscópio fica **desligada por padrão**. O jogador liga em Ajustes; no iOS, o pedido de
  permissão (`DeviceOrientationEvent.requestPermission`) só aparece depois desse toque. Sem permissão, a
  inclinação vem do arrasto do dedo.

**Abertura curta.** A abertura completa em duas etapas (6.2) toca só na primeira visita do dia. Nas outras, a
câmera entra em 250 ms. Qualquer toque durante a abertura pula para o painel aberto.

Celular sem WebGL, com `prefers-reduced-motion` ou com bateria fraca: os mesmos painéis em camadas pintadas
com paralaxe leve. A função não depende do 3D.

**Funções antigas (nenhuma se perde, em nenhuma das opções):**

| Hoje | Opção A | Opção B |
|---|---|---|
| Dormente até a Sala de Jogos | Retábulo `dormente` (portas trancadas, ametista apagada; tocar mostra o motivo do servidor) e o Shuffler continua com o estado dele | Shuffler continua com o estado dele; o Retábulo de treino abre desde que a Casa exista |
| "Toque no olho para embaralhar" (`drawRandom`) | "Tirar uma carta" na Balança e no Shuffler redesenhado | só no Shuffler redesenhado |
| Enviar à Bandeja (Record, Salão) | botão na Balança, mesmo fluxo e servidor de `salao-enviar.tsx`; o Salão e o Shuffler continuam com o deles | Salão e Shuffler, como hoje |
| Linha "Card Shuffler: Desperto" na ficha do Record | continua, com o nome que o dono mantiver (PENDENTE 15) | continua |

**Fora da Casa.** O jogador que ainda não tem a Casa (flag `galo_casa`) não perde nada. O Shuffler segue no
Record e no Salão, o app Cartas ganha "Aleatória" e a ficha da carta mostra o rito completo. O Retábulo é o
lugar bonito e o de treino, não um pedágio.

### 3.2 Onde o rito acontece

- **No Deadly Vote (WhatsApp)**: de verdade, narrado. O site entrega ao Record a ficha com o seu rito e ao Dealer
  o painel de ritos dos inscritos (5.1, Dealer).
- **No site**: só leitura, ensaio e registro. O site não decide se alguém errou o rito no grupo.

### 3.3 Ensaio do rito (Casa, visual novel)

**PROPOSTA P5.** Ensaio opcional e sem prêmio. O modelo é o das canções da ocarina em *Zelda: Ocarina of Time* e
*Majora's Mask*: um repertório compartilhado, a partitura sempre à mão no menu e o treino dentro do mundo, sem
custo. O jogador escolhe uma carta que tem e:
1. a câmera volta ao mapa; o avatar fica diante do Retábulo, em quadro de VN (retrato grande à esquerda,
   Retábulo aberto à direita, composição em diagonal);
2. **Gestos**: os medalhões do rito pessoal aparecem **embaralhados** numa bandeja de cristal; acima deles há
   uma fila de encaixes vazios, numerados. O jogador toca os medalhões na ordem certa e cada um voa para o
   próximo encaixe. A cada acerto, o avatar faz o gesto (estado `gesto`) e o medalhão acende. Um botão "Ver a
   ordem" mostra a fila resolvida por 2 s, para quem ainda está aprendendo;
3. **Cântico**: a caixa de diálogo mostra três opções para a próxima linha. Os distratores saem **só do
   próprio poema da Coleção**: linhas posteriores ao trecho exigido ou linhas do trecho fora de ordem. Nunca de
   outra Coleção (isso revelaria Cânticos trancados, regra 7 do anti-abuso). Quando não há distratores
   suficientes (rito de 1 ou 2 linhas, ou poema curto), a etapa vira **completar a palavra**: a linha aparece
   com uma palavra em branco e três palavras para escolher, todas tiradas do mesmo poema. A linha escolhida é
   "dita" com efeito de digitação. Em modo `mental`, a linha aparece em itálico e mais baixa; em `dispensado`,
   a etapa é pulada com o texto riscado visível;
4. **Fim**:
   - "Rito limpo" dispara um cut-in: faixa diagonal de ametista, retrato do avatar em pose, a carta girando, no
     espírito dos cut-ins de Persona e na paleta do DEVO;
   - "Rito quebrado" mostra a escala de Recuo e destaca o nível que **poderia** vir. Como é ensaio, aparece o
     texto "Aqui, no Deadly Vote, haveria Recuo". Nenhum registro, nenhuma perda.

Cut-ins e a abertura do Retábulo se pulam com um toque. Em Ajustes há "Animações rápidas" (cut-in de 250 ms,
sem retrato), como Persona deixa pular All-Out e Confidente. Depois do terceiro ensaio da mesma carta no dia, o
modo rápido liga sozinho para aquela carta.

Sem prêmio, não há o que farmar. Se o dono quiser recompensa (P.P. de Taças, por exemplo), ver PENDENTE 16 e a
seção 9.

### 3.4 Balança de peso para o próximo Deadly Vote (só opção A)

**PROPOSTA P6.** Existe só se o dono escolher a opção A da P4-bis. Já existe a escolha de cartas na inscrição
(`validarCartas` em `record-server.ts`). A Balança é outra porta para a mesma escolha:
- o jogador inscrito num caso com `peso_maximo` vê o limite gravado no braço da balança e põe cartas no prato;
- o prato desce com o peso, e o ponteiro passa para rubi se a soma passar do limite;
- "Levar estas" chama a mesma rota de atualização de inscrição; o servidor revalida tudo;
- cada carta no prato mostra, num toque, o seu rito pessoal.

### 3.5 Marca-texto por raridade

**PROPOSTA P7.** O marca-texto usa **exatamente** as cores de `RARITY_META` (`lib/devo/cards.ts`), para que "até
onde se estende a cor correspondente à raridade da sua carta" bata com a cor da carta no Poço, no inventário e
nos cosméticos. Esta spec não redefine as cores de raridade do jogo. Como essas cores são próximas em
luminosidade, a distinção entre raridades vem sobretudo da **borda** e do **selo**, com forma própria por
raridade, como o Hearthstone separa raridades pela gema e o Slay the Spire pela moldura:

| Raridade | Faixa (cor de `RARITY_META` a 30%) | Borda da faixa | Selo no fim do trecho |
|---|---|---|---|
| Comum | `#a3a2a6` | fio simples | `C` em círculo |
| Incomum | `#ececee` | fio duplo | `I` em quadrado |
| Rara | `#d6cdbd` | pontilhado | `R` em losango |
| Ultra Rara | `#d9c9e3` | losangos | `UR` em hexágono |
| Lendária | `#c2b9ec`, com brilho lento | filigrana | `L` em estrela de oito pontas |
| Única / Promocional | `#e3909a` / `#b4dfe8` | serrilha / holográfica | `Ú` em escudo / `P` em gota |

Se o dono quiser cores de raridade mais distintas, a troca é **global** (Poço, cosméticos, inventário e
marca-texto juntos) e fica como PENDENTE 21; o marca-texto nunca usa cores só dele.

Contraste, medido (WCAG, sobre o negro `#0e0d12`, faixa a 30%):
- texto `#ececee` sobre qualquer faixa: de 6,8:1 (Incomum) a 9,6:1 (Comum). AA garantido;
- faixa contra o fundo: de 1,7:1 (Comum) a 2,4:1 (Incomum). Visível, mas não basta para separar raridades
  vizinhas; por isso a borda e o selo são obrigatórios, não enfeite.
- Sobre papel claro (`#e9e6df`) as faixas **somem**: a de Incomum fica em 1,02:1 contra o papel, a de Rara em
  1,07:1. Por isso o marca-texto **nunca** vai sobre papel claro. O Cantoral, na ficha e no Retábulo, usa
  páginas de **velino negro**. No Manual (4.4), que é papel frio, o exemplo de *Inúteis* aparece num encarte
  negro dentro da página.

Como desenhar "até onde se estende a cor":
- cada linha recebe a faixa da **menor raridade que a alcança** (linha 1 = Comum, linha 2 = a raridade seguinte
  no mapa travado da Coleção, e assim por diante);
- à esquerda do poema corre uma **régua de colchetes aninhados**, um por raridade, do topo até a última linha
  daquela raridade, cada colchete com a borda da sua raridade. É a leitura direta do "até onde se estende";
- aberto a partir de uma carta, só o colchete da raridade dela fica aceso; as linhas fora do trecho baixam para
  45% de opacidade, sem sumir.

---

## 4. A ficha da carta e o Manual (interface do DEVO)

A ficha é da interface do DEVO, redesenhada (não a `dv-record-panel` de hoje). Ela vale no app Cartas, no
Inventário, na Balança do Retábulo, na inscrição do Deadly Vote e na Mesa.

### 4.1 Campos da carta

Já existem: `name`, `numeral`, `rarity`, `type`, `glyph`, `effect` (texto curto), `detalhe`, `natureza`,
`arquetipo`, `peso`, `flavor`, Coleção e número (`getCardMeta`).

Novos (bloco **Rito**):

| Campo | Tipo | Texto do dono? | Pendência |
|---|---|---|---|
| `gestos` | lista ordenada de `{gesto, essencial}`; `null` = a definir; `[]` = não exige | sim, por carta | 5 |
| `gestos_redutiveis` | bool (padrão `true`) | sim, "requisitos individuais da carta" | 5 |
| `cantico_modo` | `colecao` · `nenhum`; `null` = a definir | sim | 3 |
| `cantico_linhas` | override de N, de 1 a 99 (opcional) | só se o dono der | 3 |
| `vocalizacao_obrigatoria` | bool | sim | 5 |
| `recuo_exigido` | 1..6 ou null | sim | 12 |
| `paus_referencia` | nível ou null | sim | 10 |
| `adicional` + `adicional_estado` | número ou null; `pendente` · `definido` · `zero_confirmado` | sim | 10 |
| `condicoes` | texto livre do dono ("condições de utilização") | sim | 5 |

- O dono diz que os Cânticos "pertencem às respectivas Coleções". Por isso não existe Cântico próprio de carta.
  Se uma carta precisar de algo diferente da Coleção, isso entra como regra própria da **Coleção** (2.4) ou no
  texto de `condicoes`.
- Precedência sem ambiguidade: `cantico_modo = 'nenhum'` é o único jeito de dizer "esta carta não tem Cântico".
  `cantico_linhas` só vale com `cantico_modo = 'colecao'` e nunca é 0.

Derivados, só leitura: `dano_ref` (só staff vê o número, 2.7), `linhas_exigidas`, `rito_pessoal` (4.2).

### 4.2 Celular (390 × 844)

Estado inicial, com a carta grande:

```
┌───────────────────────────── 390 ─┐
│ ‹ Cartas            Xadrez · 05/07│  barra fina, champanhe
│                                   │
│      ╱ carta em pé, 3D leve ╲     │  ~40% da altura; inclina com o dedo
│     │  (arte pintada, moldura │   │  (giroscópio só se o jogador ligar)
│     │   nova)                 │   │  numeral e peso gravados no aro
│      ╲_______________________╱    │
│  Rara · Usus · Jogos de Tabuleiro │
│ ┌ Efeito ┬─ Rito ─┬ Coleção ┐     │  abas; "Rito" com losango ametista
│ │ [Seu rito | Rito completo]     ││  alternador
│ │ GESTOS                         ││
│ │ ◇1──◇2──◇3̶  (Taças cortou 1)   ││  medalhões; cortado = riscado + taça
│ │ …                              ││  (o resto segue rolando)
├─┴────────────────────────────────┴┤
│ [Manual]  [Copiar meu rito] [Ensaiar›]│  barra fixa na zona do polegar
└───────────────────────────────────┘
```

Depois de rolar (a carta encolhe para um cabeçalho de 72 px; as abas ficam presas logo abaixo). O poema é o de
*Inúteis*, só como exemplo de desenho; o Cântico de Xadrez é PENDENTE 3:

```
┌───────────────────────────── 390 ─┐
│ ▣ Bispo do Xadrez · Rara · Peso 2 │  mini-cabeçalho 72 px: miniatura, nome, raridade
│ ┌ Efeito ┬─ Rito ─┬ Coleção ┐     │  abas fixas
│ │ CÂNTICO · Básica · 5 linhas    ││
│ │ ┃▌Imagine que isso é um poema  ││  linha inteira, quebrada,
│ │ ┃▌muito bom.                   ││  nunca truncada
│ │ ┃▌Esse poema é tão incrível que││
│ │ ┃▌você vai amar.           ◇R  ││  selo da raridade no fim do trecho
│ │ ┊ Sinta a força desse poema    ││  fora do trecho: 45%
│ │ ┊ maravilhoso.                 ││
│ │ Vocalização: em voz            ││
│ │ RECUO                          ││
│ │ Referência: moderada           ││  palavras para o jogador (2.7, PENDENTE 23)
│ │ Exigência: nenhuma             ││
├─┴────────────────────────────────┴┤
│ [Manual]  [Copiar meu rito] [Ensaiar›]│
└───────────────────────────────────┘
```

- A carta fica em pé, grande e ligeiramente fora do eixo. Ao rolar, ela encolhe para o mini-cabeçalho de 72 px
  (padrão do cartão de Confidente do P5R e da tela de carta do Marvel Snap). Ao trocar de aba ela gira 8° e a aba
  desliza por baixo. É a "interface que se mexe" do pedido, sem virar Persona.
- **Linha de Cântico nunca é truncada.** É a frase que o jogador precisa dizer. Ela quebra em quantas linhas
  precisar, com a faixa e a régua acompanhando a quebra.
- **Seu rito** (padrão para quem tem a flag `virtudes`): já com Taças aplicada. O que foi cortado aparece
  riscado, com um pequeno glifo de taça e o rótulo "Taças". Não aparece número de Virtude.
- **Rito completo**: o requisito da carta sem redução. É o que aparece para quem não tem a flag `virtudes` e na
  Mesa.
- **Copiar meu rito** gera um texto curto para colar no WhatsApp e o copia (com aviso "Copiado"). O Dealer vê o
  mesmo texto no painel dele, para conferir rápido. Formato:

  ```
  Bispo do Xadrez (Rara · Xadrez)
  Gestos: 1. <nome> · 2. <nome>   (Taças: 1 a menos)
  Cântico (até a linha 2, em voz):
  Imagine que isso é um poema muito bom.
  Esse poema é tão incrível que você vai amar.
  ```

  Com `mental`: "Cântico (até a linha 2, em pensamento)". Com `dispensado`: "Cântico: dispensado". Valor
  pendente sai como `x`. O formato resolve o uso no grupo sem decidir a PENDENTE 14: o dono pode trocar o modelo.
- Pendências aparecem como `x` em itálico champanhe-escuro, com toque que explica "valor ainda não definido
  pelo dono". Nunca zero. Zero confirmado aparece por extenso ("sem adicional").
- Carta sem rito cadastrado: o selo "Rito a definir", sem bloquear nada (ver PENDENTE 22 e a regra de
  lançamento na seção 8). Carta que não exige nada: o selo "Sem rito" e a frase do dono "há aquelas que,
  felizmente para você, não exigem absolutamente nada".
- Regra própria da Coleção: aviso em faixa de cobalto acima do Cântico, com o texto do dono.
- "Ensaiar" só aparece com a Casa liberada e leva ao Retábulo, já com a carta escolhida. Sem a Casa, a barra
  fica com dois botões.

### 4.3 Cantoral (o Cântico inteiro)

Na interface do DEVO, em Cartas › Coleção › Cântico. Na Casa, no painel esquerdo do Retábulo; o conteúdo é o
mesmo e só muda a moldura. As páginas são de **velino negro** nos dois lugares (o marca-texto some em papel
claro, 3.5).
- Cabeçalho: nome da Coleção, complexidade ("Básica · Média · Complexa · Regra própria") e a legenda com o selo
  de cada raridade presente no mapa travado.
- Poema inteiro, uma linha por bloco, sempre inteira (quebra, nunca trunca), numeração discreta à direita e
  régua de colchetes à esquerda.
- Tocar numa raridade da legenda acende o colchete dela.
- As Coleções que o jogador não conhece aparecem trancadas (PENDENTE 17).

### 4.4 Manual de Cartas

Página nova em Cartas › Manual. Leva o texto do dono **inteiro e literal**, das seções I a V, com as duas
tabelas (escala e Paus) desenhadas. Os `x`/`X` aparecem como estão, marcados como pendência. Tipografia de
leitura longa, papel frio sobre o mármore negro, capitulares em aço champanhe; o exemplo de *Inúteis* com
marca-texto vai num encarte de velino negro. Os títulos seguem o original do dono, inclusive a numeração
repetida ("I. Ritos…", "I. Gestos") até ele revisar (PENDENTE 20). O "## III" do original é marcação de
Markdown, não texto: a tela mostra o título como "III", no mesmo estilo dos outros, e a numeração continua a
dele.

---

## 5. Fluxo de telas

### 5.1 Celular primeiro

| # | Tela | Onde | Estilo |
|---|---|---|---|
| 1 | Cartas › grade → ficha › aba **Rito** | app Cartas | interface do DEVO |
| 2 | Cartas › Coleção › **Cântico** (Cantoral) | app Cartas | interface do DEVO |
| 3 | Cartas › **Manual** | app Cartas | interface do DEVO |
| 4 | Gesto (folha de baixo): nome, simbolismo, animação em loop, "usado por: …" | qualquer ficha | interface do DEVO |
| 5 | Deadly Vote › inscrição › cartas: cada carta com o resumo do rito pessoal (ícones de gesto + "até a linha N") | Record | interface do DEVO |
| 6 | Deadly Vote em andamento › **Meus ritos**: fichas congeladas do caso (6.3), com "Copiar meu rito" por carta | Record | interface do DEVO |
| 7 | **Dealer** › caso › **Ritos dos inscritos**: tabela Record × carta com rito pessoal (o mesmo texto de "Copiar meu rito"), dano de referência e redução de Paus como apoio; botão **Registrar Recuo** | painel do Dealer (`dealer-board`) | interface do DEVO |
| 8 | **Mesa › Ritos**: repertório de Gestos, Cânticos por Coleção (editor com pré-visualização do marca-texto), rito por carta, tabelas de configuração | Mesa | interface do DEVO |
| 9 | **Casa › Retábulo** (mapa → toque → close-up 2.5D; três painéis na opção A, dois na B) | Casa | RPG Maker/VN + 2.5D |
| 10 | Casa › Retábulo › **Ensaiar** (VN: retrato, medalhões, linhas, cut-in) | Casa | RPG Maker/VN |
| 11 | Casa › Retábulo › **Balança** (peso, tirar uma carta, enviar à Bandeja). Só na opção A da P4-bis | Casa | 2.5D dentro da Casa |

Caminhos:
- Ficha → "Ensaiar na Casa" → 9 → 10, com a carta já escolhida.
- Gesto (4) → "usado por" → ficha de outra carta.
- Retábulo → Cantoral → "Ver no app Cartas" (mesma tela 2, sem moldura de Casa).
- Dealer (7) → Registrar Recuo: folha com o Record, a carta (só as que ele levou), o motivo, o nível 1-6 (seis
  selos de mármore que se racham progressivamente) e uma nota. O registro guarda **só** nível, motivo e nota.
  O dano de referência e o resultado após Paus aparecem num quadro de apoio recolhível ("base + adicional −
  Paus = referência", como o detalhamento de teste em tooltip do Disco Elysium e do Baldur's Gate 3), separado
  do nível. Enquanto a PENDENTE 11 não for respondida, o quadro de apoio leva a nota "não se converte em nível
  da escala". Pede confirmação.

### 5.2 Desktop (depois)

- Ficha: duas colunas. A carta à esquerda, grande, com inclinação pelo mouse. As abas Efeito/Rito/Coleção à
  direita; o Cântico abre ao lado, sem trocar de aba.
- Cantoral: livro aberto em página dupla. À esquerda, o poema com marca-texto; à direita, as cartas da Coleção
  que o jogador tem, agrupadas por raridade. Passar o mouse numa carta acende o colchete dela.
- Retábulo: os painéis lado a lado, de uma vez, como tríptico (ou díptico) aberto; a câmera para de frente. O Ensaio
  usa o quadro de VN largo (retrato à esquerda, Retábulo ao centro, caixa de diálogo embaixo).
- Dealer: tabela larga com filtro por Record e por nível de recuo.
- Mesa › Ritos: editor e pré-visualização lado a lado.

### 5.3 Acessibilidade

- O marca-texto nunca depende só da cor: tem borda própria e selo de letra com forma própria (3.5).
- O Ensaio tem modo "sem tempo" (padrão) e funciona por teclado (1-9 para medalhões, setas para linhas).
- Toda animação longa (abertura do Retábulo, cut-in, carimbo) se pula com um toque ou tecla, e há
  "Animações rápidas" em Ajustes (3.3).
- O 3D tem alternativa estática completa. Cut-ins e rachaduras respeitam `prefers-reduced-motion` (viram
  esmaecimento de 150 ms).
- Leitor de tela: os Gestos são lidos como "Gesto 2 de 3: <nome>; cortado por Taças".

---

## 6. Estados de animação e de interface

### 6.1 Ficha e Cantoral (interface do DEVO)

| Estado | O que se vê |
|---|---|
| `rito_carregando` | aro da aba Rito girando devagar, em champanhe |
| `rito_aberto` | medalhões entram da esquerda em cascata (40 ms entre cada); a faixa do marca-texto **varre** a linha da esquerda para a direita, uma linha por vez (120 ms), até o limite |
| `rito_cortado` | depois da varredura, o risco de Taças passa por cima do que caiu (180 ms) e uma pequena taça pousa ao lado |
| `rito_sem` | selo "Sem rito" carimbado uma vez |
| `rito_a_definir` | selo pontilhado, sem animação |
| `pendente` | `x` com brilho lento a cada 4 s |
| `colchete_aceso` | o colchete da raridade ganha luz de ametista e as linhas fora dele baixam para 45% |
| `alternar_pessoal_completo` | os itens cortados deixam de estar riscados e voltam ao lugar com mola curta |
| `regra_propria` | faixa de cobalto desce sobre o Cântico com o aviso |
| `banco_desatualizado` | o aviso padrão do site (503 `{code:'banco_desatualizado'}`) |

### 6.2 Retábulo (Casa)

| Estado | No mapa | No close-up |
|---|---|---|
| `dormente` | portas fechadas, ametista apagada, poeira | o toque mostra o motivo do servidor; nada abre |
| `despertando` (uma vez) | a ametista acende, filetes de luz sobem pelos veios do mármore | portas tremem e destravam; som de mecanismo |
| `desperto` | ametista pulsa devagar | n/a |
| `aberto` | n/a | primeira visita do dia: portas se abrem em duas etapas (dobradiça, depois a folha inteira) e a câmera entra; nas outras, 250 ms. Um toque pula |
| `cantoral` | n/a | as páginas viram; a varredura do marca-texto como em 6.1 |
| `repertorio` | n/a | medalhões giram no arco; o escolhido vem ao centro e executa a animação do gesto |
| `balanca` (só opção A) | n/a | o prato desce com o peso; ponteiro em champanhe, rubi acima do limite |
| `tirando_carta` (só opção A) | n/a | uma carta sobe do prato, gira e abre a ficha |
| `enviando_bandeja` (só opção A) | n/a | a carta escorre por uma fresta de latão; recibo em papel desliza |
| `ensaiando` | avatar no estado `gesto` diante do objeto | quadro de VN |
| `rito_limpo` | n/a | cut-in em diagonal de ametista, retrato em pose, a carta gira; 900 ms (250 ms em "Animações rápidas"); um toque pula |
| `rito_quebrado` | n/a | vinheta de rubi nas bordas, uma rachadura fina atravessa o vidro da redoma, a escala de recuo sobe até o nível de referência; 700 ms |
| `inscrito_com_peso` (só opção A) | um fio de luz sai do prato quando há caso com peso aberto | n/a |
| `offline` / `conflito` | n/a | painéis só leitura; ações que gravam ficam desligadas |

### 6.3 Deadly Vote e Dealer

| Estado | O que se vê |
|---|---|
| `ritos_congelados` | quando o caso entra em "em-progresso", as fichas dos inscritos ganham um lacre de cera ametista com a data |
| `recuo_registrando` | na folha do Dealer, o selo do nível escolhido racha do 1 ao N; o quadro de apoio (dano) fica à parte e não muda com o nível |
| `recuo_registrado` | carimbo rubi só com o nível e o motivo (sem número de dano); entra na linha do Record |
| `recuo_desfeito` | carimbo cruzado em champanhe, "desfeito por Owner" |

### 6.4 Avatar (Casa)

`gesto`: uma sequência por Gesto do repertório, montada sobre as camadas do avatar (`SPEC-AVATAR.md`).
Custo de arte: cada Gesto novo é uma animação nova. Por isso a quantidade de Gestos (PENDENTE 4) define o
custo. Até o dono fechar o repertório, a Casa usa uma pose genérica de "erguer as mãos" para qualquer gesto, e
o medalhão mostra a animação própria.

---

## 7. Modelo de dados e APIs

Migração nova `scripts/ritos-migration.sql`, idempotente, seguindo a rotina do `CLAUDE.md` (entra em
`capturas.yml`, `scripts/dev/local-db.mjs`, `scripts/dev/gerar-banco-novo.sh`). Nenhuma tabela atual é apagada.
Os textos padrão (Manual, escala) ficam em `lib/devo/ritos.ts`, que é arquivo puro. O que a equipe edita fica
no banco.

### 7.1 Código puro: `lib/devo/ritos.ts`

```ts
export type Complexidade = 'basica' | 'media' | 'complexa' | 'propria'
export const MULT_COMPLEXIDADE = { basica: 1, media: 2, complexa: 3 } as const        // regra do dono
export type ModoVoz = 'voz' | 'mental' | 'dispensado'
export type MotivoRecuo = 'descumpriu_requisito' | 'interrompeu_preparacao' | 'sem_condicao' | 'exigencia_da_carta' | 'outro'
export const ESCALA_RECUO = [/* 6 linhas literais do dono: nivel, nome, intensidade, exemplos */] as const
export const MANUAL_RITOS = { /* seções I–V literais */ } as const

export type RitoCarta = {
  gestos: { gesto: string; essencial: boolean }[] | null   // null = a definir; [] = não exige
  gestosRedutiveis: boolean
  canticoModo: 'colecao' | 'nenhum' | null              // null = a definir
  canticoLinhas: number | null                            // 1..99, só com 'colecao'
  vocalizacaoObrigatoria: boolean
  recuoExigido: 1 | 2 | 3 | 4 | 5 | 6 | null
  pausReferencia: number | null
  adicional: number | null
  adicionalEstado: 'pendente' | 'definido' | 'zero_confirmado'
  condicoes: string | null
}
export type RitoPessoal = {
  gestos: { gesto: string; cortado: boolean }[] | null
  cantico: { ate: number | null; cortadas: number; modo: ModoVoz; linhas?: number[] } | null
  recuo: { exigido: number | null; faixa: 'leve' | 'moderada' | 'forte' | 'muito_forte' | null }   // jogador (P3b)
  apoio?: { danoRef: number | null; reducaoPct: number | null; danoFinal: number | null }            // só staff
  pendente: string[]          // ex.: ['tacas.T1.nivel', 'dano_base.lendaria', 'paus.mais1']
}
export function linhasExigidas(colecao, raridade): number | null
export function ritoPessoal(carta, rito, colecao, niveis: { tacas: number | null; paus: number | null }, cfg): RitoPessoal
export function reducaoPaus(delta: number | null, cfg): number | null
export function textoDoRito(carta, rito: RitoPessoal, linhas: string[]): string   // "Copiar meu rito" (4.2)
```

`ritoPessoal` só roda no servidor quando recebe níveis de Virtude. O cliente recebe o resultado pronto.

### 7.2 Tabelas

```sql
-- Repertório de Gestos (global)
CREATE TABLE IF NOT EXISTS rito_gestos (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9_]{2,40}$'),
  nome text,                         -- texto do dono; null = pendente
  simbolismo text,                   -- texto do dono
  literal boolean NOT NULL DEFAULT false,   -- só o Owner marca e desmarca; com true, só o Owner edita nome/simbolismo
  glifo text,                        -- caminho da arte
  animacao text,                     -- id da animação (medalhão e avatar)
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  provisional boolean NOT NULL DEFAULT true,
  versao integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cântico de cada Coleção (a Coleção é o nome de ARCANA_COLLECTIONS em lib/devo/cards.ts)
CREATE TABLE IF NOT EXISTS rito_canticos (
  colecao text PRIMARY KEY,
  complexidade text CHECK (complexidade IN ('basica','media','complexa','propria')),
  linhas jsonb NOT NULL DEFAULT '[]'::jsonb,          -- ["linha 1", "linha 2", ...] literais
  limites jsonb NOT NULL DEFAULT '{}'::jsonb,         -- {"comum":1,"rara":2,...}: linhas da BÁSICA; null = pendente
  limites_travados_em timestamptz,                    -- P1: depois de travado, só muda por edição explícita (sobe versao)
  literal boolean NOT NULL DEFAULT false,             -- linhas marcadas literais pelo Owner
  regra_modo text CHECK (regra_modo IS NULL OR regra_modo IN ('sem_cantico','sequencia_especifica','so_aviso')),
  regra_aviso text,                                   -- texto do dono mostrado na ficha
  sequencia jsonb,                                    -- {"rara":[1,3,5]} quando sequencia_especifica
  provisional boolean NOT NULL DEFAULT true,
  versao integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rito de cada carta (card_id = id em lib/devo/cards.ts ou de uma receita de Confecção)
CREATE TABLE IF NOT EXISTS rito_cartas (
  card_id text PRIMARY KEY,
  gestos jsonb,                                       -- [{"gesto":"<key>","essencial":true}, ...]; null = a definir
  gestos_redutiveis boolean NOT NULL DEFAULT true,
  cantico_modo text CHECK (cantico_modo IS NULL OR cantico_modo IN ('colecao','nenhum')),
  cantico_linhas integer CHECK (cantico_linhas IS NULL OR (cantico_linhas BETWEEN 1 AND 99 AND cantico_modo = 'colecao')),
  vocalizacao_obrigatoria boolean NOT NULL DEFAULT false,
  recuo_exigido smallint CHECK (recuo_exigido IS NULL OR recuo_exigido BETWEEN 1 AND 6),
  paus_referencia integer CHECK (paus_referencia IS NULL OR paus_referencia >= 0),
  adicional numeric(8,2) CHECK (adicional IS NULL OR adicional >= 0),
  adicional_estado text NOT NULL DEFAULT 'pendente'
    CHECK (adicional_estado IN ('pendente','definido','zero_confirmado')),
  CHECK ((adicional_estado = 'pendente' AND adicional IS NULL)
      OR (adicional_estado = 'definido' AND adicional > 0)
      OR (adicional_estado = 'zero_confirmado' AND adicional = 0)),
  condicoes text,
  provisional boolean NOT NULL DEFAULT true,
  versao integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ritos congelados quando o caso começa (um por carta levada)
CREATE TABLE IF NOT EXISTS deadly_vote_ritos (
  vote_id uuid NOT NULL REFERENCES deadly_votes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_uid text NOT NULL,
  card_id text NOT NULL,
  rito jsonb NOT NULL,                                -- RitoPessoal no momento do congelamento
  niveis jsonb NOT NULL,                              -- {"tacas":n,"paus":n}: só staff lê
  congelado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vote_id, player_id, card_uid)
);

-- Recuos registrados pelo Dealer
CREATE TABLE IF NOT EXISTS recuo_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid REFERENCES deadly_votes(id) ON DELETE SET NULL,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  nivel smallint NOT NULL CHECK (nivel BETWEEN 1 AND 6),
  motivo text NOT NULL CHECK (motivo IN ('descumpriu_requisito','interrompeu_preparacao','sem_condicao','exigencia_da_carta','outro')),
  apoio jsonb,                                        -- {dano_ref, reducao_pct, dano_final} no momento; só staff lê;
                                                      -- fora do carimbo enquanto a PENDENTE 11 estiver aberta
  nota text CHECK (nota IS NULL OR length(nota) <= 1000),
  actor_id uuid REFERENCES players(id) ON DELETE SET NULL,
  idem_key text UNIQUE,
  at timestamptz NOT NULL DEFAULT now(),
  desfeito_em timestamptz,
  desfeito_por uuid REFERENCES players(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS recuo_registros_player_idx ON recuo_registros (player_id, at DESC);
CREATE INDEX IF NOT EXISTS recuo_registros_vote_idx ON recuo_registros (vote_id);
```

Configuração em `devo_config` (todos `provisional = true` enquanto houver `null`):

| Chave | Valor inicial | Origem |
|---|---|---|
| `ritos.dano_base` | `{"comum":10,"incomum":20,"rara":30,"ultra_rara":40,"lendaria":null,"unica":null,"promocional":null}` | dono (Lendária = X) |
| `ritos.paus_reducao` | `{"abaixo":0,"igual":25,"mais1":null,"mais2":null,"mais3":100}` | dono (dois `x%`) |
| `ritos.tacas_patamares` | `[{"v":"reducao_gestos","nivel":null,"quanto":{"forma":null,"valor":null}},{"v":"simplificacao_cantico","nivel":null,"quanto":{"forma":null,"valor":null},"apos_multiplicador":null,"minimo_linhas":null},{"v":"vocalizacao_mental","nivel":null},{"v":"sem_recitacao","nivel":null}]` | três vantagens do dono; o 4º item é P2a; `forma` ∈ `fixo`·`percentual`·`por_carta`; `apos_multiplicador` e `minimo_linhas` são P2c, pendentes |
| `ritos.faixas_dano` | `{"leve":[0,15],"moderada":[15,35],"forte":[35,55],"muito_forte":[55,null]}` | P3b, até a PENDENTE 23 |
| `ritos.zero_confirmado` | `[]` | lista de chaves que o Owner confirmou como zero (ex.: `"paus_reducao.mais1"`); `null` + chave na lista = 0 de verdade |
| `ritos.virtude_niveis` | `{"padrao":[],"porVirtude":{}}` | PENDENTE 7 |
| `ritos.ensaio` | `{"premio":null}` | PENDENTE 16 |

O objeto da Casa não é item de inventário. É um objeto fixo do layout, e o estado dele vem do servidor:
`dormente` sai de `arcadeUnlocked`; o resto, das rotas abaixo. Se o dono quiser variações de visual
(cosméticos do Retábulo), elas entram como `cosmetico` no sistema de cosméticos, sem kind novo.

### 7.3 APIs

Todas devolvem 503 `{code:'banco_desatualizado'}` em PG 42703/42P01/42883, como o resto do site. Hoje
`/api/record` e `/api/casa` são rotas únicas com ações. As rotas `…/record/votes/:id/…` e `…/casa/retabulo`
abaixo podem virar ações dessas rotas, como no padrão atual; os caminhos estão escritos assim só para leitura.

| Rota | Quem | Faz |
|---|---|---|
| `GET /api/ritos/manual` | qualquer logado | textos literais (Manual, escala, tabelas com `null` onde há `x`) |
| `GET /api/ritos/gestos` | logado | repertório ativo (nome, simbolismo, glifo, animação) e, para cada Gesto, as cartas **do jogador** que o usam |
| `GET /api/ritos/colecoes/:colecao` | logado | Cântico, complexidade, limites resolvidos por raridade, aviso de regra. Coleção desconhecida pelo jogador: `403 {code:'colecao_trancada'}` (PENDENTE 17); staff vê todas |
| `GET /api/ritos/cartas/:cardId` | logado | `{ completo: RitoPessoal-sem-Taças, pessoal?: RitoPessoal, texto: string }`. `pessoal` só com a flag `virtudes`; sem níveis, sem números de Virtude; `apoio` (números de dano) só para staff; `texto` é o "Copiar meu rito" |
| `GET /api/ritos/mesa` | Owner, Anfitrião (edição); Dealer (leitura) | tudo, com `provisional`, `versao` e lista de cartas sem rito |
| `PUT /api/ritos/mesa/gestos/:key` · `…/canticos/:colecao` · `…/cartas/:cardId` | Owner, Anfitrião | grava com `versao` (409 se mudou). Linha com `literal = true` só o Owner troca; só o Owner liga ou desliga `literal`, e só ele marca `zero_confirmado` |
| `PUT /api/ritos/mesa/config` | Owner | as chaves `ritos.*` |
| `GET /api/record/votes/:id/ritos` | Dealer do caso, supervisor, Owner/Anfitrião: todos os inscritos; jogador: só os seus | ritos congelados (ou ao vivo, antes do congelamento) e dano de referência; `reducaoPct` só para staff (PENDENTE 18) |
| `POST /api/record/votes/:id/recuos` | Dealer do caso, supervisor, Owner/Anfitrião | `{playerId, cardId, nivel, motivo, nota, idemKey}`; o servidor grava o nível escolhido e, à parte, o `apoio` calculado com o rito congelado |
| `DELETE /api/record/votes/:id/recuos/:rid` | Owner (Anfitrião se o dono quiser) | marca `desfeito_*`; não apaga |
| `GET /api/casa/retabulo` | dono da casa (staff em "somente leitura") | estado (`dormente`/`desperto`); na opção A, também caso aberto com peso, cartas já escolhidas e Bandeja liberada |

O congelamento roda na mesma transação que passa o caso para "em-progresso" (`record-server.ts`). Para cada
inscrito e cada carta de `deadly_vote_entries.cartas`, calcula `ritoPessoal` e grava em `deadly_vote_ritos`.

---

## 8. O que muda nos sistemas atuais (proposta)

Esta seção é **proposta**. Nada aqui está decidido. As linhas marcadas "A/B" dependem da escolha da P4-bis
(PENDENTE 24); as marcadas "15" dependem das falas do Shuffler.

**Lançamento (PROPOSTA P8).** Os ritos entram atrás de uma flag nova, `ritos`, em `lib/devo/progresso.ts`
(`UNLOCK_FLAGS`). Owner e Anfitrião sempre veem. Sem a flag, o jogador não vê a aba Rito, o Manual, o Cantoral
nem o Retábulo, e o Deadly Vote segue a regra atual. Com a flag, enquanto uma carta estiver "Rito a definir", o
DV usa a regra atual para ela (sem rito), e a ficha mostra o selo sem bloquear nada. A flag só deve ser ligada
para os jogadores quando houver Gestos, Cânticos e pelo menos as cartas atuais cadastrados (PENDENTES 22, 3,
4 e 5).

| Sistema | Hoje | Proposta |
|---|---|---|
| `lib/devo/progresso.ts` | flags atuais | flag `ritos` (P8) |
| `lib/devo/cards.ts`, `types.ts` | `CardDef` sem rito | `CardDef` não muda; o rito vem de `rito_cartas` (com padrão "a definir"). As 8 cartas atuais entram como linhas vazias e `provisional` |
| `lib/devo/shuffler.ts` | nomes Dormente/Desperto/Embaralhando/Sincronia | **fica.** Ganha só os estados novos do Retábulo se a opção A for escolhida. Renomear o arquivo depende da PENDENTE 15 e não é necessário para nenhuma das opções |
| `shared/deck-panel.tsx` (`CardShuffler`, `DeckPanel`) | astrolábio no Record e em Cartas | **redesenhado, não removido**, nas duas opções (desenho novo, mesma função). Na A, ganha o atalho "Retábulo na Casa". Só sai se o dono mudar as falas do Shuffler (15) |
| `apps/cartas-app.tsx` | painel "Card Shuffler", "Toque no olho para embaralhar" | Shuffler redesenhado; aba Rito na ficha; Coleção › Cântico; Manual; atalho "Aleatória" na grade (A/B: na B, é o mesmo sorteio do Shuffler) |
| `system/record-file.tsx` | linha "Card Shuffler: Desperto" | continua; o nome muda só com a PENDENTE 15 |
| Falas com "Shuffler" (prólogo, Melissa, Herdeiro h13) | texto do dono | **não mudam** sem ordem do dono (15) |
| `record-server.ts` (inscrição, `validarCartas`) | valida peso | igual; na inscrição, o resumo do rito por carta; ao começar o caso, congela os ritos |
| `dealer-board.tsx` | painel do Dealer | aba "Ritos dos inscritos" (com o texto de "Copiar meu rito") e "Registrar Recuo" |
| Virtudes (`virtudes.ts`, `/api/virtudes`) | só rótulos para o jogador | o payload ganha `ritos: {tacas: ['reducao_gestos', …]}`: as vantagens de Taças já alcançadas, em palavras ("Você já recita em pensamento"). Sem número. A régua valor → nível (PENDENTE 7) entra em `virtudes-server.ts` |
| Mesa | abas atuais | aba **Ritos** (7.3), com a lista de cartas "a definir" e o aviso de raridade nova em Coleção (P1); no caso do DV, o histórico de recuos com "Desfazer" para o Owner |
| Confecção (`confeccao.ts`), Pacotes | receitas e pacotes produzem cartas | carta nova sem linha em `rito_cartas` aparece como "Rito a definir"; se trouxer raridade nova para a Coleção, dispara o aviso da P1 |
| Casa (`SPEC-CASA.md`) | PENDENTE 7 e P4 em aberto | depois da escolha A/B, o Retábulo entra na tabela 2.2-b (Oficina) com os estados de 6.2 e a escolha é registrada na PENDENTE 7 da Casa; `gesto` deixa de ser "fora da estreia" no avatar se o dono aprovar P5 |
| `SPEC-AVATAR.md`, `SPEC-VISITANTES.md` (Coruja no Retábulo, linha 464) | citam o Retábulo como certo | alinhar com a escolha A/B; a Coruja revisando o rito funciona nas duas |
| Tutorial / Coruja | aula de raridades | sugestão: uma página do Manual na aula da Coruja ("Sem rito / Gestos / Cântico"), com a fala escrita pelo dono |
| Cosméticos | n/a | opcional: skins do Retábulo como cosmético (PENDENTE 19) |

---

## 9. Anti-abuso

1. **O cliente não manda níveis.** Taças e Paus são lidos no servidor. O cliente só recebe o rito pronto e
   nunca recebe `virtude_nivel`, P.P. nem limiares (regra do dono: "O BOT É O ÚNICO QUEM CUIDA DESSAS
   INFORMAÇÕES").
2. **Inferência de nível.** Com patamares finos, o jogador poderia deduzir o próprio nível de Taças pelo que foi
   cortado. É aceitável porque a vantagem é dele, mas a resposta mostra só **vantagens alcançadas**, nunca
   "faltam N".
3. **Ritos congelados.** Um ganho de Virtude (Evolução de Taças ou de Paus) no meio do caso não muda o rito
   daquele caso. O Dealer vê o mesmo que o Record viu ao começar. Registro de recuo usa o rito congelado.
   Casos de borda:
   - inscrição aceita depois do congelamento (se o Dealer abrir vaga): o rito é congelado na hora da inscrição;
   - carta trocada, consumida ou retirada depois de "em-progresso": o rito congelado continua valendo para o
     registro de recuo daquele caso; a ficha mostra "carta já não está com o Record" e não oferece "Copiar";
   - edição de rito na Mesa durante o caso: não afeta o congelado; a Mesa avisa "há N casos em andamento com
     o rito antigo".
4. **Recuo só por quem narra.** Só o Dealer do caso, o supervisor dele ou Owner/Anfitrião (`can()` com ação nova
   `ritos.recuo`). O alvo precisa ser inscrito no caso, e a carta precisa estar em `cartas` da inscrição.
   O Dealer não registra recuo em si mesmo. `idem_key` impede duplo clique; limite de 30 registros por caso por
   minuto. Tudo vai para `admin_log`.
5. **Desfazer, não apagar.** O Owner desfaz (o dono pediu que o Owner possa desfazer ações de outros). O
   registro fica, com `desfeito_por`.
6. **Textos literais protegidos.** Só o Owner marca um texto como literal (`literal = true`) e só ele desmarca.
   O Manual (`MANUAL_RITOS`) é literal no código. Linhas de Cântico e nomes de Gestos marcados literais só o
   Owner troca. Toda edição sobe `versao` e grava quem mudou. Conflito de versão = 409.
7. **Cântico de Coleção alheia.** Por padrão, o jogador só vê o Cântico de Coleções em que tem ou já teve carta
   (evita revelar coleções futuras). Staff vê todas. PENDENTE 17.
8. **Ensaio sem prêmio.** Sem recompensa, nada para farmar. Se o dono quiser prêmio, o servidor valida a sequência
   (o cliente manda as escolhas e não o resultado), um prêmio por dia e por carta, com `idem_key`
   `ensaio:<player>:<card>:<dia>`.
9. **Balança** (só opção A). A Balança só chama a rota de inscrição. O peso é revalidado no servidor (`validarCartas`), que é
   a única fonte.
10. **Bandeja pelo Retábulo** (só opção A). Mesmo servidor e mesmas regras de `salao-server.ts` (vaga, raridade mínima, taxa).
    O Retábulo não tem atalho próprio.
11. **Staff vendo a casa de outro.** O Retábulo fica em "somente leitura" e não envia à Bandeja nem mexe na Balança.
12. **Valores pendentes não viram zero.** `null` na conta gera `pendente`, e a interface mostra `x`. Um Dealer
    não vê "0% de redução" onde o dono ainda não decidiu. Zero só com `zero_confirmado`, marcado pelo Owner.
13. **Números de dano.** O jogador recebe só a faixa em palavras (P3b); `apoio` com números só sai para staff,
    até a PENDENTE 23.

---

## 10. Pendências do dono

**Responder primeiro**, porque travam o resto:
- **22** (carta "a definir" no Deadly Vote): a spec propõe que o DV use a regra atual para ela (P8). Sem essa
  resposta, nenhuma carta pode ser lançada com rito.
- **24** (opção A ou B do Retábulo, que é a PENDENTE 7 da `SPEC-CASA.md`) e **15** (falas do Shuffler).
- **1**, **3**, **4** e **5** (raridade × linhas, Cânticos, Gestos e rito das cartas atuais).
- **23** (o jogador vê números de dano?).

1. **Rara = 2 linhas.** No exemplo de *Inúteis*, a Rara exige 2 linhas; pela ordem do jogo (Comum, Incomum,
   Rara…) ela seria a 3ª. Qual das três leituras de 2.3 vale: (a) posição entre as raridades presentes na
   Coleção, (b) Rara = 2 sempre, (c) uma linha por raridade? E aprova que o mapa fique travado por Coleção (P1)?
2. **Linhas por raridade numa Coleção Básica** para Incomum, Ultra Rara e Lendária, e se Única e Promocional
   têm Cântico.
3. **Cânticos reais**: texto, complexidade e regra própria das Coleções Iniciais e Xadrez. *Inúteis* é
   Coleção de verdade ou só exemplo?
4. **Repertório de Gestos**: quantos, nomes, simbolismo e como cada um é feito (para a animação).
5. **Rito de cada carta atual** (Escudo de Papelão e as 7 de Xadrez): Gestos e ordem, quais são essenciais,
   se a carta tem Cântico, se a vocalização é obrigatória, condições de uso.
6. **Taças**: são três patamares, como no texto, ou quatro (P2a, Supressão em dois degraus)? Nível de cada um.
   Como se mede a redução: número fixo, porcentagem, por carta ou outra forma, e quanto. Na Coleção Média ou
   Complexa, a redução vale antes ou depois do multiplicador? O rito pode cair a zero linhas pela
   Simplificação, ou o mínimo é 1 (P2c)?
7. **Como se mede o "nível" de uma Virtude.** Hoje há só o valor somado das Evoluções. É preciso uma régua
   valor → nível (P3). É a mesma para todas as Virtudes?
8. **Paus um nível acima = x%** e **dois níveis acima = x%**.
9. **Dano-base da Lendária = X**, e o de Única e Promocional.
10. **Por carta**: nível de referência de Paus e adicional de balanceamento (ou "sem adicional", que entra como
    zero confirmado).
11. **Dano × escala 1-6**: o dano de referência (10, 20, 30…) se converte num nível da escala? Ou são medidas
    independentes que o narrador usa juntas?
12. **"nível mínimo de Recuo Paranormal para sua utilização"**: o que significa na prática (recuo garantido
    daquele nível ao usar a carta? requisito de já ter sofrido recuo?).
13. **Registro de Recuo no site**: o Dealer registra? O jogador é avisado e vê o histórico? Recuo tem efeito
    fora da narração (Karma, Caos e Ordem, Visitantes hostis na Casa)?
14. **Rito no WhatsApp**: como o Record faz o rito no grupo (escreve as linhas? descreve os gestos? como
    se marca "em pensamento")?
15. **Nome do objeto** do rito na Casa (Retábulo, Relicário, Cantoral, manter "Card Shuffler"
    ou outro). E as falas que citam o Shuffler (pacto no prólogo, Tempo "retirado do seu Shuffler", Bandeja
    "por meio do seu Shuffler") ficam como estão ou mudam?
16. **Ensaio na Casa**: aprova o ensaio sem prêmio (P5)? Quer algum prêmio?
17. **Cânticos de Coleções que o jogador não tem**: visíveis ou trancados?
18. **Redução de Paus para o jogador**: o Record vê o próprio dano após Paus, só o dano de referência, ou nada?
    (Ligada à 23.)
19. **Cosméticos do Retábulo**: o objeto pode ter variações visuais como cosmético?
20. **Formato do Manual**: quem é "ADM RUP" na tela; cabeçalho das colunas da escala ("Nível · Intensidade ·
    Exemplos" é proposta); numeração das seções (há "I." duas vezes e um "## III").
21. **Marca-texto**: aprova as pistas de 3.5 (P7: cores de `RARITY_META`, borda e selo por raridade)? Se
    quiser cores mais distintas, a troca vale para o jogo inteiro (Poço, cosméticos, inventário).
22. **Cartas de Confecção e Pacotes**: quem cadastra o rito de cartas novas, e se uma carta pode ser usada no
    Deadly Vote com o rito ainda "a definir" (proposta: pode, pela regra atual, P8).
23. **Números de dano para o jogador**: pela regra de `VIRTUDES.md` ("O BOT É O ÚNICO QUEM CUIDA DESSAS
    INFORMAÇÕES"), o jogador vê o dano de referência em número, só em palavras (P3b: leve, moderada, forte,
    muito forte) ou nada?
24. **Objeto do rito na Casa**: opção A (o Retábulo concentra sorteio, Bandeja e Balança) ou opção B (só treino
    e consulta, a P4 da `SPEC-CASA.md`; o Shuffler redesenhado fica no Record e no Salão)? É a mesma pergunta
    da PENDENTE 7 da Casa. Ou nenhum objeto do rito na Casa.

---

## 11. Decisões de revisão

Revisão de 01/11 (crítica com nota 6,5). O que mudou:

1. **Conflito com a `SPEC-CASA.md`.** A versão anterior dizia "resolver" a PENDENTE 7 e a P4 da Casa e fazia o
   contrário (sorteio, Bandeja e Balança na casa; `deck-panel.tsx` removido). Agora a 3.1 é a **P4-bis** com
   duas opções (A: tudo no Retábulo; B: só treino, igual à P4 da Casa), a seção 8 é proposta, e a escolha virou
   a PENDENTE 24, ligada à PENDENTE 7 da Casa. A `SPEC-CASA.md` não foi editada nesta revisão (outra parte
   cuida dela); quando o dono escolher, a escolha entra nas duas.
2. **Shuffler e PENDENTE 15.** Saíram a renomeação de `shuffler.ts` e a remoção do astrolábio. O Shuffler fica
   visível no Record e no Salão, redesenhado, enquanto as falas do dono o citarem (2.8 e 8).
3. **Cores do marca-texto.** Os hex inventados saíram. O marca-texto usa as cores de `RARITY_META` e diferencia
   pela borda e por um selo de forma própria. Contraste medido sobre o negro e sobre o papel: no papel claro as
   faixas somem (1,02:1 a 1,07:1), então o Cantoral usa velino negro e o Manual põe o exemplo num encarte negro.
   Troca de cores, se houver, é global (PENDENTE 21).
4. **P1 estável.** `limites` gravado e travado por Coleção (`limites_travados_em`), aviso na Mesa quando entra
   raridade nova, e as três leituras desenhadas com *Inúteis* (2.3).
5. **Taças.** O "quanto" virou estrutura aberta (`forma` + `valor`). "Depois do multiplicador" e "mínimo de 1
   linha" estão marcados como propostas (P2c). Os quatro patamares viraram P2a, com o texto do dono (três
   vantagens) à frente.
6. **Zero confirmado.** Terceiro estado (`zero_confirmado`) para o adicional (`adicional_estado`, com CHECK) e
   para as chaves de `devo_config` (`ritos.zero_confirmado`). Só o Owner marca.
7. **Recuo.** O registro guarda só nível, motivo e nota. Os números de dano vão para `apoio` (jsonb), mostrado
   num quadro à parte para o Dealer, fora do carimbo, até a PENDENTE 11.
8. **Cântico próprio de carta.** Removido (`cantico_modo` ficou `colecao` · `nenhum`), porque o dono diz que os
   Cânticos pertencem às Coleções. `cantico_linhas` não aceita mais 0 e só vale com `colecao`.
9. **Ensaio.** Distratores só do mesmo poema; "completar a palavra" quando não há distratores; medalhões
   embaralhados numa bandeja com fila de encaixes (a contradição "ordem escondida / em fila" saiu). Modelo
   citado: canções da ocarina de Zelda.
10. **Ficha no celular.** Carta que encolhe para um cabeçalho de 72 px, abas presas, barra fixa embaixo (Manual,
    Copiar meu rito, Ensaiar), linha de Cântico nunca truncada, giroscópio desligado por padrão e com permissão
    explícita no iOS.
11. **Retábulo no celular.** Um painel por vez, deslize com a câmera girando 30°, losangos de navegação,
    gaveta Ensaiar, voltar por `useBackHandler`. Abertura completa só na primeira visita do dia; toque pula.
12. **Escala e estilo na Casa.** Versão simplificada para o mapa conforme a técnica da Casa; close-up sempre
    pintado, com corte de íris como transição. Glifos de Gesto declarados vetoriais (anula o 16×16 da BIBLIA).
13. **Números para o jogador.** Até a PENDENTE 23, o jogador vê a referência em palavras (P3b), não em número.
14. **Lançamento.** Flag `ritos` (P8) e PENDENTE 22 no topo da lista, com a proposta de o DV usar a regra atual
    para carta "a definir".
15. **Copiar meu rito.** Texto curto para o WhatsApp, na ficha e em Meus ritos; o Dealer vê o mesmo texto.
16. **Consistência.** "Evolução de Estágio" trocado por ganho de Virtude; casos de borda do congelamento
    (inscrição tardia, carta trocada ou consumida, edição durante o caso); só o Owner marca `literal`; o
    "## III" aparece como "III".
17. **Animações.** Toque pula cut-in e abertura; "Animações rápidas" em Ajustes; modo rápido automático depois
    do terceiro ensaio da mesma carta no dia.

Onde a revisão discorda da crítica:
- **Copiar meu rito "resolve" a PENDENTE 14.** Não resolve: dá um formato de trabalho que o dono pode trocar.
  A pendência continua aberta.
- **Faixas de dano em palavras.** A crítica sugeriu decidir com o dono. A spec decidiu um padrão provisório
  (P3b, só palavras) porque mostrar número antes da resposta iria contra a regra literal de `VIRTUDES.md`; o
  dono pode liberar os números.
- **`SPEC-AVATAR.md` e `SPEC-VISITANTES.md`** não foram editadas aqui, só listadas na seção 8 para alinhar
  depois da escolha A/B. Mexer nelas antes da escolha repetiria o erro do item 1.
