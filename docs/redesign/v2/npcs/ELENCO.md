# Elenco do DEVO: visão de conjunto (redesign com referência Persona)

Status: proposta para o dono aprovar. Revisão de 01/11/2026, depois da crítica do elenco (nota 5,5). Esta página manda
sobre as sete fichas (`galo.md`, `coruja.md`, `javali.md`, `corvo.md`, `melissa.md`, `herdeiro.md`, `rato.md`) quando
houver conflito. Os prompts finais estão em `PROMPTS.json`. O esquema de silhuetas com a régua de alturas está em
`elenco-silhuetas.svg`.

O que a crítica apontou: as sete fichas eram boas uma a uma, mas lado a lado repetiam cor, forro, luz, adereço, gesto
e arquétipo. No Persona cada Confidente se reconhece pela cor, pelo contorno e pelo gesto, mesmo que todos vistam o
mesmo uniforme. Esta revisão parte do conjunto, e cada ficha depois segue a tabela daqui.

Texto do dono continua literal. O que é traço da arte que o dono aprovou e esta revisão propõe mudar fica marcado
como **PENDENTE DO DONO** e não entra nos prompts (§10).

> **Harmonização de 01/11 (noite).** A rodada de 19 peças gerada com os prompts desta página (`../arte/ESCOLHAS.md`)
> levou nota 4,5 na crítica: cel chapado de dois tons, contorno de adesivo, luz frontal, três estilos misturados e
> traços do dono perdidos (mecha do Herdeiro, cabelo da Coruja, crista do Javali, o desconforto do Rato). Isso
> contraria a direção do dono ("vibe antiga", arte pintada). Por isso:
> - **Estilo (§8) trocado:** anime pintado, como a CG `v2-cg-melissa-encontro` e a arte atual de `public/images/npc`.
>   Do Persona ficam a **pose** (torção, três-quartos), a **luz** (dura de um lado, sombra recortada, tabela do §5) e
>   o **layout** (cut-in, cartão do Vínculo), não o traço.
> - **Fundo e recorte (§8) trocados:** fundo carvão muito escuro no prompt e, no pipeline, erosão de 1–2 px no alfa
>   com descontaminação da borda; cada recorte é conferido sobre `#0C0C0E` antes de ser escolhido.
> - **Mesmo modelo para os sete retratos** e prancha lado a lado (cor e silhueta) contra `elenco-silhuetas.svg` antes
>   de aprovar. Peças do `flux-2-klein-4b` não chegam a nenhuma tela.
> - **Cut-in (§7):** recorte sempre na faixa dos olhos, borda rasgada branca e grossa igual para todos; a direção
>   (sobe/desce) é feita na interface, por máscara e rotação, porque o modelo ignora a direção pedida.
> - **Coruja:** cabelo castanho-escuro, não preto (é o da arte atual e o do cut-in).
> - "Tela de Confidentes" nesta página = tela **Vínculos** (nome usado no jogo; padrão Confidentes do Persona).
> - As fichas individuais ganharam no topo as correções da crítica para cada personagem.

---

## 1. Roda de cores do elenco

Um matiz por personagem, com pelo menos 28° de distância entre vizinhos. A ametista (`#8A7CC8`, matiz 251°) é do
sistema e da interface, e não é assinatura de ninguém.

| NPC | Assinatura | Hex | Matiz | Sombra | Luz | Contraste sobre `#0C0C0E` | Origem |
|---|---|---|---|---|---|---|---|
| Galo | Cobre de crista | **`#C9542A`** | 16° | `#7A3315` | `#F2A15E` | 4,5:1 | cabelo e camisa ferrugem da arte atual |
| Javali | Âmbar de ficha | **`#E0AC1C`** | 44° | `#8A5A08` | `#FFD36B` | 9,4:1 | olhos e medalhão da arte atual |
| Rato | Absinto | **`#A8C82E`** | 72° | `#5E6E12` | `#E4F27A` | 10,2:1 | proposta (forro, dorso das cartas, luz) |
| Coruja | Verde-biblioteca | **`#2F7A55`** | 150° | `#1A4A33` | `#8FD1A8` | 3,8:1 | colete verde-escuro da arte atual |
| Corvo | Verdete | **`#3A9FB0`** | 189° | `#1C4E58` | `#A6E4EC` | 6,3:1 | proposta (o dono não mandou folha) |
| Melissa | Azul Companhia (o único "cobalto") | **`#4A6CF0`** | 228° | `#2B43B8` / `#17206A` | `#9DB2FF` | 4,4:1 | blazer azul da arte atual |
| Herdeiro | Bordô de herança | **`#8C1D47`** | 337° | `#4A0E26` | `#D9809F` | 2,2:1 (usar como faixa, texto em porcelana ou rosa) | casaca vinho da arte atual |

Distâncias mais curtas: Galo-Javali 28°, Javali-Rato 28°, Herdeiro-Galo 39°. O rubi de alerta (`#A3121F`, 355°)
segue fora da roda; o Herdeiro fica a 18° dele, mas a diferença de luminosidade e o uso (faixa de veludo, nunca aviso)
separam os dois.

O que mudou em relação às fichas:

- **Coruja** deixa o âmbar `#E3A13B` (igual ao `#E3A21A` do Javali) e assume o verde do colete que ela já tinha. O
  âmbar dos olhos dela continua como cor local, não como assinatura.
- **Corvo** sai do verdete `#3FA38C` (que ficaria a 39° do verde novo da Coruja) para um verdete mais ciano.
- **Galo** desce de `#D2662E` para `#C9542A` e **Javali** sobe para `#E0AC1C`, para abrir distância entre os dois.
- **Rato** vai a `#A8C82E` para se afastar do âmbar.

Tudo isso mexe em cor de personagem: a roda inteira é **PENDENTE DO DONO**.

### Palavras reservadas nos prompts

O FLUX trata cada nome como uma cor diferente, então cada cor tem um nome só:

| Hex | Nome fixo nos prompts | Quem pode usar |
|---|---|---|
| `#4A6CF0` | `cobalt blue` | **só a Melissa**. Nenhum outro prompt tem a palavra "cobalt". |
| `#5A4F8F` | `smoky violet` | luz de preenchimento ou sombra fria de qualquer um |
| `#8A7CC8` | `amethyst` | interface, olho do corvo de ferro, forro da Melissa, recorte do Herdeiro |
| `#0C0C0E` | `black` | todos |
| mármore com veio | `veined like marble` | **só a Melissa** (forro) e a interface |

Saem dos prompts: o `#1647FF` da Coruja, o `#2F4FA8` do Javali e as variações "smoky cobalt", "cobalt-violet" e
"cobalt rim light". No código, `--dv-cobalt` (`#5a4f8f`) continua com esse nome porque é variável de interface; só os
prompts e as fichas param de chamar essa cor de cobalto.

## 2. Silhuetas e alturas

Teste do Soejima para os sete juntos: preto chapado, lado a lado, sem cor e sem rosto. Ver `elenco-silhuetas.svg`
(esquema de forma, não arte final). **Aprovar a régua e as formas antes de gerar qualquer imagem em cor.**

| NPC | Altura (PROPOSTA) | Forma-base | O que só ele tem no contorno |
|---|---|---|---|
| Corvo | 2,10 m (flutua, sem pés) | agulha / cone alto | capuz pontudo caído para trás, bico rompendo o capuz, barra em tiras, uma mão de osso fora do manto |
| Javali | 1,95 m | retângulo largo | crista em lâminas com ponta de bufão, presas, gola branca em leque, ombros quadrados, barra em bandeirolas |
| Galo | 1,88 m | triângulo invertido | crista de cinco pontas, casaco-capa nos ombros, barra cortada em penas de cauda de galo, esporas |
| Herdeiro | 1,82 m | coluna estreita com "V" embaixo | mecha em gancho, colarinho alto, caudas da casaca abertas em V, batuta sempre na diagonal |
| Coruja | 1,78 m | gota (ave empoleirada) | dois grampos-tufo, capa curta em festões, peito branco vertical |
| Melissa | 1,62 m | sino sobre coluna | chanel assimétrico com laço da rosa, ombros bufantes e mantelete, punhos de renda claros |
| Rato | 1,30 m, cerca de 1,55 m com a cartola | três círculos e um retângulo no topo, corpo de boneco | orelhas redondas, cartola torta, focinho em cunha com bigodes, cauda em ponto de interrogação |

Na Casa, onde o avatar anda ao lado deles, a régua vale para os sprites: avatar adulto padrão em 1,70 m (a SPEC-AVATAR
decide a altura do avatar; aqui é só a referência de escala).

### Arquétipos: quatro anfitriões, quatro funções

Galo, Javali, Rato e Herdeiro conduzem cenas, e isso vem do texto do dono. A diferença tem de estar na função e no
corte da roupa:

| NPC | Função na cena | Corte | O que ele NÃO usa |
|---|---|---|---|
| Galo | o visitante folgado, "imperador de araque" | casaco de terno jogado nos ombros como capa | fraque, cauda de casaca |
| Javali | a banca, o crupiê | sobrecasaca longa de abas rasgadas (sai "fraque") | cartola, baralho |
| Rato | o ilusionista de picadeiro | fraque curto com cauda bipartida, corpo pequeno | colete de leiloeiro, batuta |
| Herdeiro | o maestro que rege a sala | casaca de maestro curta na frente, caudas em V | bengala, cartas |

## 3. Forros

O forro ametista com veio de mármore deixa de ser uniforme do elenco. Fica com a Melissa (ela é a Companhia, que é a
"grife" do DEVO) e com a interface.

| NPC | Forro |
|---|---|
| Galo | seda cobre bordada com penas de cauda de galo |
| Coruja | marrom da capa original, com os festões e losangos |
| Javali | losangos de arlequim em preto e âmbar escuro |
| Corvo | revelado: penas com brilho verdete; anônimo: lã preta fosca, sem brilho |
| Melissa | ametista com veio de mármore |
| Herdeiro | pergaminho chamuscado com pautas finas (só as linhas, nenhuma nota) |
| Rato | feltro de mesa de bilhar em absinto |

## 4. Adereços e gestos

Um adereço por quadro. Mãos sempre com "five fingers clearly separated" quando seguram alguma coisa.

| NPC | Adereço ícone (só dele) | Gesto do retrato | Gesto do corpo inteiro | Sai das fichas |
|---|---|---|---|---|
| Galo | broche de galo; lata de bebida (texto do dono: "Ele tem uma lata de bebida na mão") | aponta para o jogador com o indicador, outra mão no quadril | brinde com a lata, outra mão no bolso, piscadela | corrente de relógio, arminha de dedo (não é do dono) |
| Coruja | **uma** carta fechada, dorso com olho de coruja geométrico | carta presa entre dois dedos junto ao queixo | empoleirada no parapeito, carta no joelho | leque de cinco cartas, carta virada de frente |
| Javali | fichas e um dado gigante | reverência: mão no peito, outro braço atrás das costas | gargalhada com a mão sobre o dado | baralho em leque, alfinete de dado, botões em ficha, mostrador no medalhão, palma oferecida |
| Corvo | o Dracma (moeda) | **deixa a moeda cair de cima**, palma para baixo, como quem solta algo num poço | braços abertos como asas (**só ele** abre asas) | palma para cima |
| Melissa | pasta de couro preta lisa, sem marcas | **palma para cima** oferecendo (**só ela**) | um braço em arco apresentando o palco, a outra mão com a pasta no peito | dois braços abertos (rimava com o Corvo) |
| Herdeiro | batuta de ébano | batuta erguida em diagonal, outra mão atrás das costas | olhando por cima do ombro, batuta baixa em diagonal | batuta nos lábios com óculos e giro de ombro (risco de anatomia), "notas musicais" |
| Rato | a carta que some (truque) e a bengala | tira a cartola; a carta some entre dois dedos | bengala apontando o espaço vazio | carta na faixa da cartola, carta na cauda, alfinete de dado, palma para cima |

Cartas aparecem só com a Coruja (uma, fechada) e com o Rato (o truque e o voo do cut-in), sempre de dorso e com
padrão geométrico. Corrente fica só com o Rato (é da arte do dono). Dado fica só com o Javali.

## 5. Luz por personagem

A assinatura entra como contraluz em alguns, e o recorte ametista só em quem precisa dele. Nada de "rim light da
assinatura de um lado e ametista do outro" para os sete.

| NPC | Luz principal | Recorte |
|---|---|---|
| Galo | quente e dura do lado direito de quem olha, metade do corpo no escuro (retrato); contraluz cobre (corpo) | preenchimento smoky violet |
| Coruja | luar frio de cima | fio verde fino |
| Javali | âmbar de baixo, como lâmpada de mesa de jogo | reflexo cinza-quente na aresta do focinho |
| Corvo | fogo-fátuo verdete de baixo (revelado); luz fria e fraca de cima (anônimo) | nenhum |
| Melissa | frontal, limpa e suave | azul-claro |
| Herdeiro | foco de palco branco e frio de cima | ametista fino |
| Rato | spot de circo duro de cima | absinto |

## 6. Lados da imagem

O FLUX não separa o lado do personagem do lado de quem olha. Nos prompts e nas fichas, sempre "on the viewer's
left/right", conferido contra a arte atual (`public/images/npc/<id>/neutro.webp` ou equivalente):

| NPC | Traço | Lado (de quem olha) |
|---|---|---|
| Galo | mecha sobre a testa | cai para a esquerda |
| Galo | broche de galo | lapela da direita |
| Galo | têmporas raspadas | dos dois lados; mais visível à direita |
| Coruja | mecha branca | esquerda |
| Coruja | mecha solta ondulada | direita |
| Javali | ponta longa da crista | curva para a direita |
| Javali | medalhão com borla | lapela da direita |
| Corvo | olho aceso da máscara | esquerda |
| Corvo | corvo de ferro | ombro da direita |
| Melissa | rosa azul com fita | direita |
| Melissa | mecha mais longa | esquerda |
| Melissa | insígnia (rosa com olho) | peito, à direita |
| Herdeiro | mecha branca em gancho | esquerda |
| Herdeiro | pinta | abaixo do olho da direita |
| Rato | inclinação da cartola | para a esquerda |

As fichas antigas diziam "lado esquerdo dela/dele" em vários pontos, e alguns estavam trocados. Por exemplo, a mecha
da Coruja está do lado direito dela (esquerda de quem olha), e a ponta da crista do Javali curva para o lado esquerdo
dele (direita de quem olha). Vale esta tabela.

### Coruja e Herdeiro: a mecha branca

As duas mechas são traço do dono e as duas ficam à esquerda de quem olha. Espelhar não é opção, porque quebraria a
continuidade com as 12 expressões e com o `npc-rostos.json`. O que separa os dois:

- **Forma:** a da Coruja é estreita e reta, nasce dentro da trança e cai direto até o queixo. A do Herdeiro é larga e
  faz um gancho sobre o olho. (Afinar a da Coruja é um ajuste pequeno em traço do dono: PENDENTE DO DONO.)
- **Giro da cabeça:** a Coruja vira para a direita de quem olha, então a mecha fica na face próxima, emoldurando o
  rosto. O Herdeiro vira para a esquerda, então a mecha fica na face distante e atravessa o olho de trás. Nas telas
  de Confidentes e na Casa, os dois nunca aparecem com a mesma leitura.

## 7. Regra única do cut-in

- **Formato:** faixa diagonal num campo preto, bordas de cima e de baixo rasgadas em pontas (o "corte de cortina" do
  Herdeiro sai; todos usam o rasgo).
- **Recorte do rosto:** de logo acima das sobrancelhas até logo abaixo do nariz. Rostos de bicho: da linha acima dos
  olhos até a ponta do focinho (Javali até a ponta das presas; Rato da aba da cartola ao nariz). O Corvo vai da testa
  à ponta do bico, e **não mostra boca nem dentes** enquanto o dono não aprovar o rosto.
- **Direção da diagonal:**
  - **sobe** (da esquerda baixa para a direita alta): aliados, ou seja, Melissa, Coruja e Galo;
  - **desce** (da esquerda alta para a direita baixa): anfitriões ambíguos ou hostis, ou seja, Corvo, Rato, Javali e
    Herdeiro.
- **Duração e texto:** 1,2 s; a frase do cut-in é sempre texto da interface, por cima da imagem. A imagem não tem
  letra nenhuma.
- **Resolução:** **2048×640** (16:5 exato, múltiplos de 16, dentro do limite de 2048 do `flux-2-klein-9b`), com
  `remover_fundo: false`. Em telas menores, recortar ao centro.

## 8. Pipeline de geração

| Peça | Tamanho | `remover_fundo` | Fundo pedido no prompt |
|---|---|---|---|
| retrato (meio corpo até a coxa) | 1024×1536 | `true` | cinza médio liso (≈ `#9A9AA0`); Rato: azul-ardósia empoeirado (≈ `#6F8FA0`) |
| corpo inteiro | 1024×1536 | `true` | igual ao retrato |
| cut-in | 2048×640 | `false` | campo preto com a faixa |

- *(Harmonização de 01/11: o fundo cinza médio deixou halo cinza-azulado de 2–4 px nos recortes. Próxima rodada:
  "flat very dark charcoal background" e, depois do BiRefNet, erosão de 1–2 px e descontaminação da borda. O
  parágrafo abaixo fica como histórico.)*
- **Por que cinza médio:** o carvão `#2C2C31` das fichas antigas ficava quase igual ao preto das roupas, e o rembg
  (BiRefNet em `arte/ferramentas/processar.py`) comeria capuz, cartola e casaca. O cinza médio separa o preto e ainda
  deixa o branco das golas aparecer. O Rato tem pelo cinza-bege, que se perderia no cinza; por isso o fundo dele é
  azul-ardósia, uma cor que ele não usa. O hex do fundo não vai no prompt (hex solto pode virar texto na imagem); vai
  só a descrição.
- **Primeiro teste:** Corvo (tiras do manto, dedos de osso) e Rato (bigodes, orelhas, cauda), que são os casos mais
  difíceis para o recorte. Só depois gerar os outros.
- **Referência:** o `flux-2-klein-9b` aceita até 4 imagens de referência (`referencias` no pedido). Para os seis que
  têm arte do dono, mandar o `neutro.webp` atual como referência de rosto e cabelo. O Corvo não tem.
- **Ordem do prompt** (como está no `PROMPTS.json`): (1) estilo e tipo de quadro; (2) fundo e enquadramento; (3)
  silhueta e pose; (4) rosto; (5) figurino, no máximo seis peças; (6) luz e paleta com dois ou três hex; uma frase de
  exclusão curta no fim. Entre 112 e 190 palavras cada.
- **Estilo** *(trocado na harmonização de 01/11)*: "painted anime illustration, soft gouache rendering with one hard
  rim light, rich fabric texture, dramatic three-quarter pose with torso twist, high contrast, limited palette".
  Saem "bold outline", "cel shading" e "flat colors". O estilo antigo ("Bold clean anime lineart, two-tone cel
  shading, high-contrast graphic poster style") ainda está nos prompts das fichas e do `PROMPTS.json` e precisa ser
  trocado antes da próxima rodada. Continua: sem "Persona" e sem nome entre aspas (puxavam a tipografia recortada
  do P5, legendas e o vermelho que o dono vetou).
- **Prompt negativo:** o `gerar.py` só manda `negative` para SDXL e Phoenix; no FLUX o campo é ignorado. Por isso a
  exclusão fica numa frase curta dentro do prompt.
- **Validar:** `python3 arte/ferramentas/pedido.py arte/pedidos/<id>.json` no worktree de `infra/arte`.
- **Estados por pós-processamento, não por prompt:**
  - Melissa holograma = a arte "presencial" + shader ou CSS (linhas de varredura, deslocamento RGB de 2 px, azul
    `#9DB2FF`). A mesma arte serve à mina do prólogo, onde ela é de carne, e às Corporações e ao Calendário.
  - Névoa do Corvo, pétalas da Melissa e penas soltas: camadas de partícula na interface, nunca no retrato que vai
    para o recorte.

## 9. Retrato em pose e o sistema de sprites

Hoje cada NPC tem 12 expressões numa tela de 1080×960, com a cabeça em 345 px e o queixo em y=508
(`scripts/dev/fatiar-npcs.py`). Os medalhões leem a janela do rosto em `lib/devo/npc-rostos.json`
(`scripts/dev/rostos-npcs.py`, `NpcMedallion`). O retrato em pose vai até o meio da coxa e não cabe nessa tela.

Proposta: **uma camada nova de pose, separada das expressões.**

- Arquivos: `public/images/npc/<id>/pose/<pose>.webp`, gerados em 1024×1536 e exportados com o mesmo recorte do
  pipeline de arte. Três poses por NPC (as das fichas, §4).
- Âncora própria: o `manifest.json` de cada NPC ganha um bloco `poses` com, para cada pose, o topo da cabeça (ou da
  crista, cartola, capuz) e o y do queixo no arquivo. A tela Vínculos, a VN da Casa e das Torres posicionam a
  pose por essa âncora.
- As 12 expressões e os medalhões continuam como estão até o dono aprovar o redesenho das folhas. Quando a folha nova
  de um NPC chegar: rodar `scripts/dev/fatiar-npcs.py` e, **logo depois**, `scripts/dev/rostos-npcs.py`, e conferir os
  medalhões. Sem isso o `NpcMedallion` e o diálogo quebram.
- O retrato em pose pode trocar de rosto por cima: uma camada de cabeça com a expressão atual, recortada pela janela
  do `npc-rostos.json`, só se o traço da pose casar com o da folha. Se não casar, a pose fica com o rosto fixo dela.

Isso é proposta de engenharia e não foi implementado (a tarefa não mexe no código do app).

## 10. Arcanos do elenco (todas as sugestões cruzadas)

Só o Galo tem Arcano no código (`lib/devo/npcs.ts`: "Anfitrião do Arcano do Imperador"). O resto é sugestão para o
dono escolher ou descartar. Nenhum Arcano se repete entre as sugestões principais nem entre as alternativas.

| NPC | Sugestão | Alternativa | Por quê |
|---|---|---|---|
| Galo | IV, O Imperador (**definido**) | — | código e torre do Imperador |
| Coruja | II, A Sacerdotisa | IX, O Eremita | segredo guardado; a lanterna do Observatório |
| Javali | X, A Roda da Fortuna | VII, O Carro | a banca e a sorte; o triunfo de quem leva a mesa |
| Corvo | XIII, A Morte | XVIII, A Lua | a mão de osso, a putrefação; a névoa e a ilusão do Poço |
| Rato | I, O Mago | 0, O Louco | o truque da carta; "não tem nada a perder" |
| Herdeiro | V, O Hierofante | XV, O Diabo | herança, hierarquia, o rito do Salão; o controle da plateia |
| Melissa | XX, O Julgamento | XVII, A Estrela | o despertar (Companhia de Despertados); ou o emblema da Companhia, sem Arcano |

A ficha do Corvo sugeria antes a Roda da Fortuna, a mesma do Javali; a sugestão passou a ser a Morte.

**Pendência registrada:** o Estágio 0 do Imperador em `lib/devo/arcanos-textos.ts` se chama "Herdeiro", mas o
Imperador é do Galo. Pode ser só o nome do estágio, ou pode indicar uma ligação entre os dois. Decisão do dono.

## 11. Pendências do dono criadas por esta revisão

Traços da arte aprovada que alguma ficha propunha trocar. **Os prompts usam o traço original.** A troca só entra se o
dono aprovar.

| NPC | Original (fica no prompt) | Proposta |
|---|---|---|
| Rato | X dos olhos dourado | X em absinto |
| Rato | faixa da cartola bordô | faixa absinto |
| Rato | plastrom mostarda | plastrom creme |
| Rato | colete bordô adamascado | colete ametista fumê |
| Coruja | capa curta marrom com festões e losangos, colete verde-escuro com debrum dourado | (as fichas antigas trocavam por manto de penas e corpete pretos; esta revisão **devolve** o original) |
| Coruja | mecha branca larga | mecha mais estreita e reta, para separar do Herdeiro |
| Coruja | brincos de lua dourados | (a ficha antiga os fazia âmbar; voltam a dourado) |
| Herdeiro | pedra vermelha no broche | granada bordô |
| Galo | broche dourado | aço champanhe |
| todos | cor de assinatura | a roda do §1 |

O figurino em si é redesenhado, e esse é o objetivo do redesign. Os prompts já usam o figurino novo, mas ele também
passa pelo dono na folha de silhuetas (§2) antes de virar imagem:

| NPC | Arte atual | Figurino novo (já no prompt) |
|---|---|---|
| Galo | jaqueta preta de gola alta, camisa ferrugem | casaco de terno jogado nos ombros, barra em penas de cauda, lenço-barbela, esporas, camisa cobre |
| Javali | casaco negro de abas esfarrapadas, forro claro | sobrecasaca longa de barra em bandeirolas, forro de arlequim preto e âmbar |
| Herdeiro | casaca vinho com bordado geométrico | casaca de maestro com caudas em V, forro de pergaminho chamuscado |
| Rato | casaca preta de gola alta | fraque com cauda bipartida e forro de feltro absinto |
| Melissa | blazer azul, punhos de renda | o mesmo uniforme com mantelete forrado e cinto largo |

Outras pendências do conjunto: alturas (§2); a meia-máscara e o rosto do Corvo (proposta, o texto do dono diz "Não é
possível ver seu rosto com tanta névoa"); quando o Corvo é revelado; Arcanos (§10); frase oficial do cut-in de cada um;
presentes, romance, morar na Casa e hostilidade (SPEC-VISITANTES, PENDENTE 2).
