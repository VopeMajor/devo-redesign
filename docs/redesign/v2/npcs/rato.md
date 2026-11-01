# O Rato: ficha de redesign (referência Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: volta ao alvo da arte atual: pelagem pintada taupe, olhos de botão costurados com X, sorriso torto com incisivos amarelados, orelhas pêssego claro, nada de mascote fofo; cauda contínua e inteira no quadro; cut-in com dorso de cartas caindo, não grade.

Status: proposta para o dono aprovar. Nada aqui altera texto do dono. As falas citadas são literais e vêm do tutorial
da Sala de Trocas (`lib/devo/intro-script.ts`) e das conversas em Mensagens (`lib/devo/npcs.ts`, `rato.choices`).


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Traço do dono primeiro:** o X dourado dos olhos, a faixa bordô da cartola, o plastrom mostarda e o colete bordô
  **ficam nos prompts**, como na arte atual. A troca para absinto e ametista era decisão do dono e tinha entrado
  direto no prompt; agora é PENDENTE DO DONO.
- **Absinto `#A8C82E`** (72°, afastado do âmbar do Javali) fica no que é novo: forro de feltro de bilhar, dorso das
  cartas, luz de recorte e faixas da interface.
- **Adereços:** a carta que some no truque (retrato) e a bengala (corpo inteiro). Saem o leque de cinco cartas, a
  carta na faixa da cartola, a carta na cauda e o alfinete de dado (o dado ficou com o Javali). A corrente com moedas
  furadas fica, porque é da arte do dono.
- **Gesto:** sai a palma para cima (é só da Melissa). Na pose de apresentador, a bengala aponta o espaço vazio.
- **Dentes:** a arte atual mostra dois incisivos, não uma presa única.
- **Fundo do prompt:** azul-ardósia, porque o pelo cinza-bege se perderia no cinza médio dos outros.
- **Escala:** 1,30 m, cerca de 1,55 m com a cartola.
- **Cut-in:** diagonal que desce (anfitrião ambíguo), da aba da cartola ao nariz, 2048×640.

## 0. O que já existe e não muda

- **Papel:** "O Rato", Anfitrião (`lib/devo/npcs.ts`). Explica a **Sala de Trocas** no tutorial (10 falas, depois do
  Herdeiro, que o chama de quem "adora o som da própria voz"), responde em **Mensagens** e escreveu a regra única das
  oito salas: mesma raridade, carta do outro oculta, chat para negociar, os dois aceitam e a troca não se desfaz.
  O Herdeiro, em Mensagens, diz dele: "Que ele ri demais para alguém que não tem nada a perder." A moldura de
  cosmético **Fortuna do Rato** ("moedas antigas, correntes finas e pequenos símbolos de trapaça") é dele.
- **Temperamento** (lido nas falas): mestre de cerimônias que se diverte com as regras que inventou; animado,
  teatral, fala de si na terceira pessoa ("O Rato explica.", "Uma dica do Rato"), ri em "Hihihi", vende a armadilha
  como um prêmio ("Que maravilha, não acha?") e avisa do perigo no meio da piada ("Confie ainda menos em mim!").
  Nunca é grosso; é cruel por diversão.
- **Arte atual** (`public/images/npc/rato/*.webp`, 12 expressões, repouso `sorriso`): rato antropomórfico de pelo
  cinza-bege, **orelhas enormes e redondas, rosadas por dentro**, focinho fino com nariz preto, bigodes longos,
  **os dois incisivos da frente aparecendo** (as fichas antigas diziam "presa única"; a arte mostra o par), **olhos de botão preto costurados com um X dourado**, **cartola preta com faixa
  bordô**, gravata plastrom mostarda, colete bordô adamascado com botões de latão, casaca preta de gola alta, camisa
  creme com punhos virados, **corrente de relógio** no colete, mãos quase humanas com unhas escuras. Em `irritado`
  segura um leque de cartas de dorso vermelho.
- **O que o torna reconhecível hoje** e fica: as orelhas redondas sob a cartola, os olhos de botão com o X, os incisivos
  única, os bigodes, a cartola, a casaca, a corrente, as cartas. O Rato é o único do elenco que é um bicho de corpo
  inteiro, e o redesign mantém isso.
- **O que poderia mudar (PENDENTE DO DONO):** o colete e a faixa bordô ficam perto da assinatura do Herdeiro
  (`#8C1D47`), e o mostarda fica perto do âmbar do Javali. A proposta é trocar os dois e o X dos olhos por absinto e
  ametista (§2 e §3). Enquanto o dono não decidir, **os prompts usam as cores da arte atual**, e o absinto entra só no
  que é novo: forro, dorso das cartas, luz e faixas da interface.

## 1. Conceito

**"O mestre de cerimônias da troca às cegas."** No elenco ao estilo Persona, o Rato é o trapaceiro-anfitrião: o
apresentador de circo que ensina as regras de um jogo onde a casa sempre ganha e acha isso uma graça. Os olhos de
botão dizem o principal: ninguém sabe para onde ele está olhando, nem se há alguém atrás deles. É um boneco que
ficou esperto demais.

Leitura em três palavras: **teatral, risonho, desleal.**

Leitura em uma olhada (método subtrativo do Soejima): **cartola entre duas orelhas redondas + cauda em ponto de
interrogação + a carta que some.** Em sombra chapada, tem de ser o Rato sem rosto nenhum.

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Absinto | **`#A8C82E`** | forro da casaca, dorso das cartas, faixa do cut-in, aro do medalhão, cartão de Confidente (faixa da cartola e X dos olhos só se o dono aprovar) |
| Sombra da assinatura | Absinto de garrafa | `#5E6E12` | 2ª sombra na faixa e no dorso das cartas, forro da casaca |
| Luz da assinatura | Fel aceso | `#E4F27A` | rim light, faíscas, brilho das costuras quando ele "liga" os olhos |
| Pelo (local) | Rato-cinza | `#B9AE9E` / sombra 1 `#8E8373` / sombra 2 `#5C5347` | rosto, mãos, cauda |
| Orelha / focinho | Rosa-orelha | `#E79A86` / sombra `#B8695A` | dentro das orelhas, ponta da cauda, nariz em luz |
| Contra-cor | Ametista | `#8A7CC8` / fumê `#5A4F8F` | colete adamascado, forro do chapéu, luz fria do lado oposto |
| Metal | Latão velho | `#B08A4A` / reflexo `#E2C98A` | corrente, botões, moedas, ponteira da bengala |
| Branco | Mármore | `#F1F0EE` | camisa, luvas sem dedos, dente |
| Base | Cartola | `#0D0C10` / `#1A1820` | casaca, cartola, olhos de botão |

Por que absinto: é o verde-amarelo da bebida que dá visão torta, do feltro velho de mesa de jogo quando a luz bate
de lado e do brilho de olho de rato no escuro. Fica longe do verdete do Corvo (`#3FA38C`, azulado), do âmbar do
Javali, do cobre do Galo, do bordô do Herdeiro e do azul da Melissa, e muito longe do vermelho do P5. Contraste do
absinto sobre o negro: cerca de 11:1, legível até como texto pequeno.

**Silhueta (teste em sombra chapada):**

- Topo: **cartola alta e um pouco torta**, inclinada uns 10° para a esquerda de quem olha, entre **duas orelhas
  redondas maiores que a cabeça**. Três círculos e um retângulo: nenhum outro do elenco tem esse topo.
- Frente: **focinho comprido em cunha** apontado para baixo, com os bigodes saindo como raios finos. Os bigodes
  cortam o contorno e são a única linha fina da silhueta.
- Tronco: **casaca de fraque com cauda bipartida** que bate atrás dos joelhos. Ombros estreitos e caídos, peito
  estufado de apresentador.
- Baixo: **pernas finas** e sapatos de bico, o que deixa o peso todo em cima, como um boneco.
- Atrás: **a cauda nua e comprida**, sempre visível, em curva de ponto de interrogação. Perto da ponta, um anel de latão (sem carta: as cartas dele ficam na mão). Nunca esconder a cauda nas poses de corpo inteiro.
- Mãos: uma sempre ocupada (cartas, moeda ou bengala); dedos longos que abrem em leque.

## 3. Figurino

- **Cartola** preta de feltro, alta, com a copa levemente amassada e torta. Faixa larga **bordô**, como na arte atual
  (absinto com ponto-cruz em X é PENDENTE DO DONO). Sem carta na faixa. Forro de cetim ametista, que aparece quando ele tira o chapéu para cumprimentar.
- **Olhos de botão** (acessório de rosto, intocável): dois botões pretos de quatro furos, costurados com linha em X.
  A linha é **dourada**, como na arte atual; a troca para absinto é PENDENTE DO DONO, porque o X costurado é o
  traço mais forte dele. Em repouso a linha é fosca; quando ele trapaceia ou ameaça, ela acende. Pálpebras de pelo podem cobrir parte do botão, e é assim que ele "pisca".
- **Casaca de fraque** preta, gola alta e virada, lapelas pontudas, cauda bipartida. Forro de **feltro de mesa de bilhar em
  absinto**, sem estampa. Punhos dobrados mostrando a camisa.
- **Colete** abotoado duplo em **bordô adamascado**, como na arte atual (ametista fumê é PENDENTE DO DONO), com
  botões de latão em forma de moeda gasta.
- **Plastrom** em seda **mostarda**, como na arte atual (creme é PENDENTE DO DONO), sem alfinete. O dado ficou
  com o Javali; o símbolo de trapaça que a moldura Fortuna do Rato pede passa a ser a carta que some.
- **Camisa** creme de colarinho alto e punhos virados. Mãos quase humanas, de unhas escuras e sem luva, como na
  arte atual.
- **Corrente de relógio** dupla de latão, do bolso do colete ao bolso da casaca. No lugar do relógio, pendurado,
  um **molho de moedas antigas furadas** (moeda de troca, não de tempo; o Tempo é do pulso do jogador).
- **Acessório ícone: a carta que some.** Uma carta de dorso absinto e preto, com treliça geométrica, que ele faz
  sumir entre dois dedos num estalo de faíscas. Sem leque: a Coruja segura uma carta fechada, ele faz a carta
  desaparecer, e o Javali não usa baralho (ELENCO §4). É a Sala de Trocas na mão
  dele: o jogador só vê o dorso.
- **Bengala** fina de ébano com castão de latão em forma de cabeça de rato (poses de corpo inteiro).
- **Cauda** com anel de latão perto da ponta.
- Detalhes: os dois incisivos compridos, cicatriz de costura na orelha esquerda (um ponto em X a mais), bigodes
  longos que tremem quando ele ri.

O que se descarta da arte atual: só a corrente "de enfeite" sem função, que vira o molho de moedas. A troca do bordô
e do mostarda fica com o dono. O pelo, os botões, a cartola e as orelhas continuam.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"Que maravilha, não acha?"** (pose do convite; padrão do cartão de Confidente). Corpo em 3/4, peito estufado,
   a mão esquerda tocando a aba da cartola num cumprimento, como na arte atual, e a direita fazendo uma carta de
   dorso absinto sumir entre dois dedos. A cauda sobe por trás do ombro. Cabeça inclinada, sorriso de
   orelha a orelha. Diagonal da composição: da carta que some (frente, embaixo à direita) até o topo da cartola
   (atrás, em cima à esquerda).
2. **"Então sente-se, {nome}. O Rato explica."** (pose de apresentador, Casa e Torres). De frente, a bengala
   apontando o espaço vazio ao lado dele (onde a UI coloca a regra, a sala ou o item), a outra mão no colete. A palma
   para cima é só da Melissa. Um pé na ponta, cauda em ponto de interrogação perfeito. É a
   pose em que ele parece um anfitrião de verdade.
3. **"Confie ainda menos em mim!"** (pose hostil). Curvado para a frente, de baixo para cima, a cartola caída sobre
   um olho, o outro botão com o X aceso. Os dedos entrelaçados na frente do focinho, como na expressão `trama`,
   com uma carta escondida entre eles. A cauda enrola no próprio pulso. Luz vinda de baixo, como abajur de mesa de
   jogo; o resto afunda no preto.

## 5. Seis expressões principais

Chaves do vocabulário de `lib/devo/npcs.ts` (`ELENCO.rato.celulas`). As doze continuam; estas seis são as que a
nova folha desenha primeiro e que mais aparecem. A expressão mora em quatro lugares: **as pálpebras sobre os
botões**, **a boca e os incisivos**, **as orelhas** (abertas, para trás, caídas) e **os bigodes**.

| Chave | Leitura (fala literal) | Desenho |
|---|---|---|
| `sorriso` (repouso) | "Dentro da sala há dois espaços. Um deles é o SEU ESPAÇO." | sorriso fechado e comprido, incisivos à mostra; pálpebras a meio botão; orelhas abertas; bigodes para cima |
| `convite` | "Que maravilha, não acha?" | boca aberta num riso de palco, cabeça para trás; orelhas para a frente; a mão tira a cartola |
| `malicia` | "Existe apenas um pequeno detalhe… você não sabe o que está recebendo." | olhar de lado com uma pálpebra baixa sobre o botão, sorriso torto de um canto só; uma orelha para trás; a costura do olho acesa fraca |
| `segredo` | "Uma dica do Rato: não confie muito em promessas." | dedo em frente ao focinho, inclinado para o jogador; um botão meio coberto, o outro aberto; bigodes juntos para baixo |
| `surpreso` | "E então… KABUM!" | boca escancarada com os incisivos e a língua, orelhas em leque, bigodes espetados; botões redondos e cheios; mão no peito |
| `irritado` | "Sair? Que palavra feia!" | dentes cerrados, focinho franzido, pálpebras pesadas e retas; orelhas achatadas para trás; costuras acesas; a carta amassada na mão |

Regra de cel shading: duas sombras chapadas no pelo (`#8E8373` e `#5C5347`) e no tecido, contorno preto grosso por
fora e fino por dentro, spot de circo duro vindo de cima e recorte absinto (ELENCO §5). Os botões têm um único reflexo branco em
meia-lua, sempre no mesmo lugar, para parecer objeto e não olho. Sem degradê no pelo nem na roupa; o único brilho
suave é o das costuras acesas.

## 6. Frase de cut-in

> **"O Rato explica."**

Trecho literal da fala do tutorial ("Interessante, não? Então sente-se, {nome}. O Rato explica."). Curta, fala dele
na terceira pessoa e cabe numa faixa. Alternativas, também literais: **"Confie ainda menos em mim!"** (Mensagens,
para o cut-in hostil) e **"Sem devoluções."** (tutorial, para quando uma troca se confirma). Qual é a oficial:
PENDENTE do dono.

**Cut-in (1,2 s):** cartas de dorso absinto atravessam a tela em diagonal, da esquerda alta para a direita baixa (regra dos
anfitriões ambíguos, ELENCO §7), e cada uma deixa um rasgo; pelo maior rasgo entra a faixa absinto com padrão de X entrelaçados; close cortado da
aba da cartola ao nariz, inclinado: um botão com o X aceso, os incisivos, os bigodes saindo do quadro como riscos de velocidade. A
frase entra em capitulares de latão, uma palavra por vez, e a última batida tem a risadinha. Saída: as cartas
viram de costas todas juntas e a faixa some com elas.

## 7. Animações de contexto

- **Entrada na Casa.** (PROPOSTA de encenação; não há texto do dono para a visita do Rato.) Ele não toca a
  campainha: bate três vezes num ritmo de vinheta. Quando a porta abre não tem ninguém; ele sai de baixo do tapete,
  de um armário ou de dentro de um móvel, sempre um lugar onde não cabia. No mapa, o sprite atravessa a sala em
  saltinhos rápidos com a cauda balançando e para ao lado de um objeto. O retrato grande entra de baixo como boneco
  de caixa de surpresa, passa do ponto, volta e assenta inclinado +5°, com a cartola chegando meio segundo depois.
- **Presente.** Ele pega com as duas mãos, examina contra a luz e morde a borda como se testasse uma moeda. Amado:
  `surpreso`, depois `convite`; cartas de dorso absinto caem como confete e a faixa pulsa duas vezes. Gostado:
  `sorriso`, o presente some na manga num truque de mão. Neutro: `pensativo`, ele embaralha o presente com as
  cartas. Odiado: `desdem`, devolve o presente com a cauda sem olhar; as bordas do balão viram papel de carta
  rasgado. Gostos e desgostos: PENDENTE do dono.
- **Romance.** Só se o dono marcar o Rato como romanceável (SPEC-VISITANTES, PENDENTE 2). Proposta de encenação: ele
  tira a cartola e a segura contra o peito, as orelhas caem um pouco, as costuras ficam apagadas e, pela primeira
  vez, a carta que ele sempre faz sumir aparece de frente (o que está nela: PENDENTE). Expressão `triste` usada como
  timidez (é a mais desarmada da folha). Fundo com bokeh ametista e cartas paradas no ar.
- **Hostil.** Pose 3. A cor some e ficam só as costuras dos olhos, acesas. Cartão e balão viram negativo
  (latão sobre preto), o texto treme 1 px, cartas viradas para baixo deslizam pelas bordas da tela. A risadinha
  toca mais grave e mais lenta. Expressão `irritado`; `trama` quando é uma armação, não uma ameaça.

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Cartão da lista (120 px, corte diagonal):** fundo de mármore negro com veios ametista; atrás do Rato, uma mesa
  de jogo em 2.5D vista de cima com duas cartas viradas para baixo (as duas da Sala de Trocas). A pose 1 sai do
  cartão pela cartola e pela carta que some, que passam da borda. Faixa fina absinto na diagonal do
  corte. Nome "O RATO" em capitular de latão; o progresso aparece como **cartas que viram de costas para frente**,
  uma por nível.
- **Ficha cheia:** pose 2 grande, cortada na coxa, a bengala atravessando a diagonal; atrás, a carta do Arcano dele
  em 2.5D (PENDENTE) e a mesa de troca, as duas com paralaxe pelo giroscópio. As cartas da mesa giram devagar e,
  de tempos em tempos, uma desliza sozinha para o lado dele. A cauda balança em loop. Faixa diagonal absinto com
  "O Rato · Anfitrião".
- **Medalhão:** aro de latão com segundo aro absinto em ponto-cruz; dentro, a janela de hoje (`NpcMedallion` mostra
  a cartola inteira) com `malicia`. Ao trocar o retrato, regenerar `lib/devo/npc-rostos.json`.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; as duas cartas da mesa viram juntas e uma moeda
  furada cai na corrente dele.
- **Hostil:** cartão em negativo, silhueta da pose 3 com só as costuras acesas.
- **Sem Essência:** o Rato não tem Essência de Afinidade (`INVENTARIO.md`). Enquanto o dono não decidir, o cartão
  mostra o vínculo sem a moeda de afinidade e marca "Essência: PENDENTE".

## Pendências

1. **Arcano do Rato:** não está em nenhum texto do dono. Sugestões para ele escolher ou descartar: I, O Mago (o
   ilusionista que faz a carta sumir) ou 0, O Louco (ri de tudo, "não tem nada a perder"). Não usar como definitivo.
2. **Essência de Afinidade** do Rato: não existe.
3. Romance, morar na Casa, hostilidade, presentes e ranks: SPEC-VISITANTES, PENDENTE 2.
4. Frase oficial do cut-in (item 6).
5. A face da carta do truque (só aparece no romance).
6. A troca de cores (X dos olhos dourado para absinto, faixa da cartola bordô para absinto, plastrom mostarda para
   creme, colete bordô para ametista fumê) precisa do aval do dono, porque mexe num personagem que ele já aprovou.
   **Os prompts usam a arte atual** até ele decidir.
7. A risadinha ("Hihihi") está fora do jogo até o dono mandar o áudio (`DIRECAO-3.md`).
8. Ao receber a folha final, rodar `scripts/dev/fatiar-npcs.py` e `scripts/dev/rostos-npcs.py`.

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat dusty slate-blue background, headroom above the hat and ears. An anthropomorphic rat gentleman in three-quarter view, chest puffed out like a ringmaster, wide delighted grin; his left hand tips the brim of his top hat; his right hand makes a single face-down card vanish between two fingers in a puff of absinthe sparks, relaxed hand, five fingers clearly separated. Grey-beige fur, two huge round ears with pink insides, long wedge snout, black nose, long thin whiskers, two long front incisors, eyes that are black four-hole sewing buttons stitched with gold X stitches. Tall crooked black top hat tilted toward the viewer's left with a burgundy hatband; black high-collared tailcoat lined with absinthe billiard felt; burgundy damask waistcoat with brass coin buttons; mustard cravat; brass chain of old holed coins; bare pink-tipped tail curling behind. Hard circus spotlight from above, absinthe rim light. Palette: black #0D0C10, absinthe #A8C82E, old brass #B08A4A. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat dusty slate-blue background, no floor, margin around the figure, hat and tail included. A short anthropomorphic rat gentleman with top-heavy puppet proportions in a showman's pose: his right hand points a thin ebony cane at the empty space beside him, his left hand on his waistcoat, one foot on its toe, his bare tail curved behind him in a perfect question mark with a brass ring near the tip. Grey-beige fur, huge round ears, long wedge snout and whiskers, front incisors in a wide grin, black button eyes with gold X stitches. Tall crooked black top hat with a burgundy hatband; black tailcoat with split tails behind the knees and absinthe felt lining; burgundy damask waistcoat; mustard cravat; brass chain of holed coins; thin legs, pointed shoes. Silhouette: round ears around a tilted hat, wedge snout, split tails, question-mark tail. Hard circus spotlight from above. Palette: black #0D0C10, absinthe #A8C82E, old brass #B08A4A. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip falls from upper left to lower right. Inside the strip, an extreme close-up of an anthropomorphic rat cropped from the brim of a black top hat to just below the nose: grey-beige fur, black sewing-button eyes with gold X stitches glowing and a crescent highlight on each, a wide sly grin with long front incisors, a black nose, long whiskers streaking out of the frame like speed lines, the edge of a huge round ear with a pink inside. Behind the face, absinthe green tones with a black geometric lattice, face-down cards with plain lattice backs flying along the diagonal, small yellow-green sparks. Hard spotlight from above, smoky violet shadow on the far side. Palette: black #0D0C10, absinthe #A8C82E, old brass #B08A4A. No text, letters or logos anywhere.
```
