# Arte-chave do DEVO v2: escolhas

Gerada em 01/11/2026 pelo pipeline de `infra/arte` (Workers AI, `flux-2-klein-9b`; reserva `flux-2-klein-4b`).
Cada arquivo desta pasta é o `final/*.webp` maior da variação escolhida. A saída completa de cada pedido (prancha,
brutos, recortes, `geracao.json`) está na branch `arte-saida/<id>`.

Dois pushes em `infra/arte`:

| Lote | Commit | Pedidos | Imagens pedidas | Custo estimado |
|---|---|---|---|---|
| 1 | `0e337d3e` | 27 (`v2-npc-*`, `v2-casa-*`, `v2-torre-interior`, `v2-cg-*`, `v2-ui-*`) | 69 | ~99,5 mil neurônios |
| 2 | `f9c29db6` | 11 (`v2-npc-*-r2`), só o que o filtro recusou ou saiu ruim | 55 (22 no 9b, 33 no 4b) | ~37,4 mil neurônios |

O filtro do Workers AI ("Your output has been flagged") recusou muito: no lote 1, todo o Galo, quase todos os corpos
inteiros e os cut-ins de rosto humano. Rostos de bicho e de caveira (Corvo, Rato, Javali) passaram. No lote 2 o texto
ganhou idade adulta explícita, roupa fechada e poses sem pé levantado, e cada pedido levou três seeds no `klein-4b`,
que é barato (~160 neurônios por imagem). O 9b continuou recusando quase tudo; o 4b passou na maioria. As peças do 4b
estão marcadas abaixo: o traço é mais simples e a fidelidade à ficha é menor. Servem para montar telas, mas devem ser
refeitas.

Nenhum pedido usou imagem de referência: os prompts finais de `npcs/PROMPTS.json` já descrevem cada um, e as tentativas
do Galo com referência foram todas recusadas na rodada anterior.

## NPCs (prompts de `npcs/PROMPTS.json`)

Retrato e corpo vêm sem fundo (BiRefNet). Cut-in é 2048×640, com fundo.

| NPC | Peça | Arquivo | Origem | Observação |
|---|---|---|---|---|
| Coruja | retrato | `v2-npc-coruja-retrato.webp` | `v2-npc-coruja-retrato` v03 | Carta na mão certa, broche de coruja, grampos como tufos. A mecha branca quase não aparece: conferir |
| Coruja | corpo | `v2-npc-coruja-corpo.webp` | `v2-npc-coruja-corpo-r2` v02 (9b) | Sentada na balaustrada com a carta. A v01 do lote 1 flutuava fora da pedra e foi descartada |
| Coruja | cut-in | `v2-npc-coruja-cutin.webp` | `v2-npc-coruja-cutin-r2` v01 (9b) | Mecha branca à esquerda, olhos âmbar, faixa sobe |
| Corvo | retrato | `v2-npc-corvo-retrato.webp` | `v2-npc-corvo-retrato` v02 | Bico fechado, sem boca nem dentes. A v01 mostrava dentes (vetado em ELENCO §7). Os dois olhos acendem; a ficha pede só o da esquerda |
| Corvo | corpo | `v2-npc-corvo-corpo.webp` | `v2-npc-corvo-corpo` v02 | Única que passou. Manto sem pernas, flutuando; corvo no ombro da direita |
| Corvo | cut-in | `v2-npc-corvo-cutin.webp` | `v2-npc-corvo-cutin` v02 | Olho aceso à esquerda, sem boca. A faixa sobe; a regra pede que desça (ver "Direção do cut-in") |
| Galo | retrato | **falta** | — | 0 de 8 (lote 1 e 2). Contando a rodada anterior, o Galo já soma 32 recusas. Usar `galo-riso` e `galo-segredo` (`arte-saida/v2-galo-expressoes*`), como a BIBLIA já faz |
| Galo | corpo | `v2-npc-galo-corpo.webp` | `v2-npc-galo-corpo-r2` v03 (**4b**) | Crista, lata erguida, sapatos bicolores. Casaco vestido, não sobre os ombros. Provisório |
| Galo | cut-in | `v2-npc-galo-cutin.webp` | `v2-npc-galo-cutin-r2` v04 (**4b**) | Olhos cinza-verdes, penas cobre. Provisório |
| Herdeiro | retrato | `v2-npc-herdeiro-retrato.webp` | `v2-npc-herdeiro-retrato` v03 | Batuta, óculos, pinta à direita. Falta a mecha branca em gancho, e o jabô tem manchas vermelhas. Refazer |
| Herdeiro | corpo | `v2-npc-herdeiro-corpo.webp` | `v2-npc-herdeiro-corpo-r2` v04 (**4b**) | Casaca vinho com cauda em V e forro claro. Cabelo cinza em vez de areia, sem a mecha. Provisório |
| Herdeiro | cut-in | **falta** | — | 0 de 7 |
| Javali | retrato | `v2-npc-javali-retrato.webp` | `v2-npc-javali-retrato` v03 | Presas, crista curvando para a direita, medalhão com borla na lapela da direita. A crista lembra chifre: ajustar no próximo pedido |
| Javali | corpo | `v2-npc-javali-corpo.webp` | `v2-npc-javali-corpo-r2` v04 (**4b**) | Silhueta e barra rasgada certas, mas o dado saiu como um bloco de queijo. Só placeholder |
| Javali | cut-in | `v2-npc-javali-cutin.webp` | `v2-npc-javali-cutin` v02 | Presas, fichas, dados, losangos. A faixa sobe; a regra pede que desça |
| Melissa | retrato | `v2-npc-melissa-retrato.webp` | `v2-npc-melissa-retrato` v03 | Rosa azul e insígnia à direita, capa com forro de mármore ametista, pasta preta. Acena em vez de estender a palma |
| Melissa | corpo | `v2-npc-melissa-corpo.webp` | `v2-npc-melissa-corpo-r2` v05 (**4b**) | Braços abertos, saia longa (texto mudado por causa do filtro). Provisório |
| Melissa | cut-in | `v2-npc-melissa-cutin.webp` | `v2-npc-melissa-cutin-r2` v05 (**4b**) | Olhos violeta, rosa à direita, pétalas. Provisório |
| Rato | retrato | `v2-npc-rato-retrato.webp` | `v2-npc-rato-retrato` v03 | Olhos de botão com X, cartola inclinada para a esquerda, cauda rosada, colete adamascado |
| Rato | corpo | `v2-npc-rato-corpo.webp` | `v2-npc-rato-corpo-r2` v05 (**4b**) | Bengala, cauda em interrogação, casaca com forro absinto. Provisório |
| Rato | cut-in | `v2-npc-rato-cutin.webp` | `v2-npc-rato-cutin` v01 | Olhos de botão acesos, sorriso com incisivos. A faixa sobe; a regra pede que desça |

**Direção do cut-in.** Nenhum cut-in de "desce" (Corvo, Rato, Javali, Herdeiro) saiu com a faixa descendo: o modelo
ignora a direção. Espelhar a imagem troca de lado os traços da tabela de ELENCO §6, então a saída fica na interface:
recortar a faixa por máscara e girá-la no CSS, ou aceitar a faixa subindo para todos (decisão de design).

**Coerência do elenco.** As peças do 9b ficam lado a lado sem destoar: mesmo traço grosso, cel em dois tons e fundo
cinza recortado. As do 4b têm linha mais fina e cor mais chapada; misturadas, dá para perceber. Prioridade da próxima
rodada: Galo (retrato), Herdeiro (cut-in e mecha), corpo do Javali.

## Casa e Torre (linguagem de MOTOR-CASA-TORRES §1.2: pintado HD em camadas)

| Peça | Arquivo | Origem | Por quê |
|---|---|---|---|
| Sala da Casa, noite | `v2-casa-noite.webp` | `v2-casa-noite` v02 | Três camadas (cortina e candelabro na frente, poltrona e tapete no meio, lareira, janela e estante no fundo), facho de lua, chão em espinha de peixe livre no meio |
| Sala da Casa, dia | `v2-casa-dia.webp` | `v2-casa-dia` v02 | Mesma seed da noite, então a composição bate quase igual e dá para cruzar dia e noite. As velas saíram acesas, mas o texto pedia apagadas: escurecer a chama na camada de luz |
| Andar de Torre | `v2-torre-interior.webp` | `v2-torre-interior` v01 | Piso de mármore com mostrador zodiacal, gema ametista no pedestal, relógio gigante na janela, engrenagens no teto, escada em espiral; balaustrada de ferro serve de oclusor de primeiro plano. Os numerais no piso são decoração do cenário |

## CG de encontro (1024×1536)

| Peça | Arquivo | Origem | Por quê |
|---|---|---|---|
| Melissa no balcão, avatar de costas | `v2-cg-melissa-encontro.webp` | `v2-cg-melissa-encontro` v02 | Avatar de costas com capa e capuz abaixado, relógio no pulso; Melissa com a rosa azul nas mãos, mãos certas, torre do relógio ao fundo. A v03 tinha o capuz levantado; a v01 era parecida, mas com menos profundidade |

A Melissa é só exemplo de CG. Se ela é romanceável continua **PENDENTE (dono)** (`npcs/melissa.md`).

## Interface geral (BIBLIA §8: relógio da home)

| Peça | Arquivo | Origem | Uso |
|---|---|---|---|
| Mostrador pintado | `v2-ui-mostrador.webp` | `v2-ui-mostrador` v02 | Textura do mostrador do relógio em R3F: céu ametista e cobalto, constelação de prata, 12 gemas no lugar dos números, janela do mecanismo. Sem ponteiros, que são malha 3D |
| Relógio-herói (conceito) | `v2-ui-relogio-heroi.webp` | `v2-ui-relogio-heroi` v01 | Referência de acabamento para o modelo 3D: aro torneado, vidro abaulado, engrenagens em três profundidades, órbita, pêndulo, cartela pendurada, cartas soltas. Recortado. O mostrador dele tem numerais: no app vale o mostrador acima |

O tabuleiro de mármore do Deadly Vote já existia (`cosmeticos/tabuleiro-marmore.webp`) e não foi pedido de novo.

## Cosméticos (`cosmeticos/PROMPTS.json`)

Todos já tinham sido gerados e escolhidos na rodada anterior (`escolhida` em cada pedido). Não gastei neurônio de novo;
só copiei para `cosmeticos/`:

| Arquivo | Origem |
|---|---|
| `aros-base-v01.webp`, `aros-base-v03.webp` | `v2-cos2-aros-base` v01 (Comum), v03 (Incomum) |
| `asas-crepusculo.webp` | `v2-cos2-asas-crepusculo` v01. Este é o arquivo do pipeline; a janela cinza foi recortada à mão depois, na rodada anterior |
| `badalada-janela.webp` | `v2-cos2-badalada-janela` v01 |
| `balao-correspondencia.webp` | `v2-cos2-balao-correspondencia` v01 (o selo vai numa camada separada) |
| `banquete-gaiola-r2.webp` | `v2-cos2-banquete-gaiola-r2` v01 |
| `casulo-epico-v01.webp`, `casulo-epico-v03.webp` | `v2-cos2-casulo-epico` v01 (fechado), v03 (aberto) |
| `catedral-ogiva.webp` | `v2-cos2-catedral-ogiva` v02 |
| `fragmento-celestial.webp` | `v2-cos2-fragmento-celestial` v02 |
| `placas-raridade-v01..v06.webp` | `v2-cos2-placas-raridade`, Comum a Arcano |
| `porta-casa.webp` | `v2-cos2-porta-casa` v01 |
| `tabuleiro-marmore.webp` | `v2-cos2-tabuleiro-marmore` v01 |
| `vitral-capela.webp` | `v2-cos2-vitral-capela` v01 |

## Pendências

1. **Galo, retrato em pose:** o 9b e o 4b recusaram todas as tentativas. Próximos passos possíveis: testar outro modelo
   do pipeline (`lucid-origin` ou `phoenix-1.0`, cerca de 3,5 a 4,2 mil neurônios por imagem e com outro traço), ou
   o dono aprovar outra pose ou figurino.
2. **Herdeiro, cut-in:** sem imagem. A mecha branca em gancho também não apareceu no retrato nem no corpo.
3. **Peças do 4b** (corpos do Galo, Herdeiro, Javali, Melissa e Rato; cut-ins do Galo e da Melissa): provisórias.
4. **Direção do cut-in** dos hostis: resolver na interface (ver acima).
5. **Romance da Melissa:** PENDENTE (dono).

## Crítica da arte-chave (01/11/2026, noite)

**Nota: 4,5.**

Esta crítica manda sobre duas observações acima que não se confirmaram na imagem: o retrato do Corvo **mostra**
mandíbula com dentes (a tabela diz "sem dentes"), e as peças do 9b **destoam** da CG e dos cenários (a seção
"Coerência do elenco" diz que não). Nenhuma peça de NPC desta rodada entra em tela. Cenários, CG e mostrador ficam.

### Problemas

1. **Veredito geral.** Os cenários e a UI (`v2-casa-noite`, `v2-casa-dia`, `v2-torre-interior`,
   `v2-cg-melissa-encontro`, `v2-ui-mostrador`) estão no nível certo: pintados, em camadas, gótico ametista. Os 19
   NPCs não estão. São cel chapado em dois tons, com contorno grosso de adesivo e luz frontal sem direção. Lado a
   lado com a CG da Melissa, parecem de outro jogo. Nenhum deles chega ao padrão de retrato do Persona (P5R/P3R):
   pose com torção, luz dura de um lado, sombra recortada e paleta de 2 a 3 cores. E nenhum segue a tabela de luz
   por personagem do ELENCO §5.
2. **Identidade perdida.** A arte atual de `public/images/npc` é anime pintado, com degradê suave e textura. A v2
   trocou isso por traço de cartoon ocidental, principalmente no Rato, no Javali e no corpo do Galo. Isso contraria
   a direção do dono ("vibe antiga, arte pintada").
3. **Coruja.** No retrato o cabelo é PRETO e não há mecha branca. A arte atual e o próprio cut-in v2 têm castanho com
   mecha branca à esquerda. São duas pessoas diferentes. O corpo ganhou ORELHAS DE BICHO (tufos viraram orelhas
   peludas), ao lado de grampos de metal. Ela está "sentada" no vazio, porque o BiRefNet apagou a balaustrada e a
   pose ficou suspensa e ilegível. No retrato, o braço cruzado sob a capa fica sem ombro coerente.
4. **Corvo.** O retrato mostra a MANDÍBULA COM DENTES sob o bico, mesmo marcado em ESCOLHAS como "sem dentes" (veto
   do ELENCO §7). As mãos não combinam: uma é de osso e a outra é punho de luva preta. No corpo, os antebraços são
   pele ciano com mão de osso, o que é uma terceira leitura. O cut-in mostra cabelo humano preto, que não existe no
   retrato (capuz). A barra com chamas verdete é boa.
5. **Galo.** Sem retrato (32 recusas). Corpo e cut-in são do 4b: linha fina, cor chapada, mão no bolso sem volume. O
   cut-in tem uma MANCHA ROXA no rosto que parece hematoma ou artefato. O corpo veste o casaco, quando a ficha manda
   "casaco-capa nos ombros", e a barra em penas virou franja genérica. No P5 o cut-in é o momento mais forte do
   personagem; aqui ele é o mais fraco do elenco.
6. **Herdeiro.** Falta a mecha branca em gancho, que é traço do dono e está na arte atual, no retrato e no corpo. O
   cabelo é loiro-areia no retrato e cinza no corpo. O jabô tem manchas vermelhas que parecem sangue. No corpo, o
   forro devia ser pergaminho chamuscado com pautas e saiu como mapa dourado craquelado. Ele segura BENGALA, que está
   vetada para ele no ELENCO §4 (é do Rato). Não tem cut-in.
7. **Javali.** No retrato a crista virou CHIFRE de bode. No corpo o dado gigante virou um BLOCO DE QUEIJO, e não há
   crista nenhuma. O cut-in é um porco genérico de mascote, com fileira de dentes humanos atrás das presas. A arte
   atual é magra, sinistra, de focinho longo e gola em leque. A v2 virou um javali gordo de desenho animado, e a
   ameaça se perdeu.
8. **Melissa.** São três rostos diferentes. Retrato: chanel loiro-dourado, olhos violeta. Corpo: chanel curto com
   tiara e saia longa preta. Cut-in: cabelo liso longo, pele lavada. A arte atual e a CG v2 têm cabelo platinado
   longo, e a CG acerta a identidade melhor que as fichas. O retrato acena em vez de oferecer a palma para cima
   (gesto exclusivo dela no ELENCO §4). O forro de mármore ametista aparece no retrato só como "raios" roxos na gola.
9. **Rato.** É o mais coeso, mas virou mascote Disney: focinho branco, língua rosa, orelhas rosa chiclete. A arte
   atual é pelagem pintada, olhos de botão costurados e sorriso torto inquietante, e esse desconforto se perdeu. A
   cauda do retrato está cortada e solta do corpo, sem conexão. O corpo segura a bengala como batuta e aponta como
   mestre de cerimônia comum. O cut-in usa um padrão de "cartas" que lê como grade de cerca.
10. **Coerência do elenco.** Há três estilos misturados (9b com traço grosso, 4b com linha fina chapada, e a CG e os
    cenários pintados). As escalas de cabeça não seguem a régua de alturas (o Rato do corpo tem cabeça de 1/3 do
    corpo, a Melissa 1/7). Os cut-ins variam a borda (rasgo grosso, rasgo fino, papel rasgado) e o recorte (Javali e
    Rato mostram rosto inteiro, Coruja e Galo só a faixa dos olhos), contra o ELENCO §7. Todos sobem, e a regra pede
    que Corvo, Rato, Javali e Herdeiro desçam.
11. **Acabamento.** Os recortes têm HALO cinza-azulado claro de 2 a 4 px (fundo cinza do prompt e BiRefNet sem
    descontaminar). Sobre o preto da UI isso vira contorno de adesivo (visível na mão e no cabelo da Melissa). Não há
    luz de assinatura, contraluz, oclusão nem textura de tecido (veludo do Herdeiro, renda da Coruja e lã do Corvo
    saem todos com o mesmo plástico). As mãos são aceitáveis, mas rígidas: nenhuma tem tensão nem perspectiva.
12. **UI.** O relógio-herói é bom como referência de material, mas as "cartas soltas" são losangos pretos vazios e a
    cartela é uma etiqueta de papel genérica. Falta conteúdo nelas. O mostrador está pronto para textura R3F.

### Sugestões

1. **Decisão de estilo antes de gastar neurônio.** Usar como alvo dos NPCs a linguagem da CG `v2-cg-melissa-encontro`
   e da arte atual: anime pintado, sombra suave com um recorte duro de luz. O cel de dois tons fica fora. Do Persona,
   levar a POSE, a LUZ e o LAYOUT (cut-in, cartão de Confidente), e deixar o traço de lado. Prefixo comum a todos os
   prompts: "painted anime illustration, soft gouache rendering with one hard rim light, rich fabric texture,
   dramatic three-quarter pose with torso twist, high contrast, limited palette". Remover "bold outline", "cel
   shading", "flat colors".
2. **Fundo e recorte.** Pedir fundo escuro liso próximo da UI ("flat very dark charcoal background #18161C") em vez de
   cinza médio. No pipeline, depois do BiRefNet, erodir o alfa em 1-2 px e descontaminar a cor da borda (defringe).
   Validar cada recorte sobre `#0C0C0E` antes de escolher.
3. **Coruja (refazer retrato e corpo).** "dark brown hair in a crown braid, a single narrow straight WHITE streak on
   the viewer's left falling to the chin, two silver hairpins crossed like owl tufts, human ears only, no animal
   ears". Para o corpo: "seated on a carved stone balustrade that is fully visible under her" e recortar a
   balaustrada junto (`remover_fundo` só no céu), ou mudar para pose de pé encostada na pedra.
4. **Corvo (refazer retrato).** "bird skull mask with a closed beak, no jaw, no teeth, no mouth visible, lower face
   hidden in shadow of the hood"; "both hands are skeletal bone hands, no gloves, no skin"; "only the viewer's left
   eye socket glows teal". No cut-in, adicionar "inside a hood, no hair".
5. **Galo (prioridade 1).** Sair do flux-klein para `lucid-origin` ou `phoenix-1.0`, como ESCOLHAS sugere. Retirar
   "can of beer" do prompt (provável gatilho) e usar "holding a small unlabeled metal tin can". Adicionar "suit
   jacket draped over the shoulders like a cape, arms not in sleeves" e "hem cut into rooster tail feather shapes".
   No cut-in, acrescentar "clean skin, no bruise, no purple marks on the face" e a meia sombra violeta só como "smoky
   violet shadow on the far half of the face, hard terminator".
6. **Herdeiro (refazer retrato, corpo e cut-in).** Pôr a mecha primeiro no prompt, com peso: "WIDE WHITE forelock
   forming a hook over the eye, on the viewer's left, rest of the hair sandy blond". Retirar a bengala e escrever
   "holding only an ebony conductor's baton diagonally, no cane, no walking stick". Para o jabô: "pristine white lace
   jabot, no stains". O forro deve ser "scorched parchment lining with faint staff lines, no notes".
7. **Javali (refazer os três).** No retrato, "tall swept-back black mane crest ending in a jester-like curled tip to
   the viewer's right, NOT a horn, made of hair". No corpo, "one hand resting on a giant ivory six-sided DIE with
   black pips, sharp cube corners" (citar "die cube with pips" duas vezes). Usar o perfil da arte atual: "lean gaunt
   boar, long narrow snout, sly half-lidded amber eyes, menacing not cartoonish". No cut-in, pedir "boar mouth, tusks,
   no human teeth".
8. **Melissa (unificar).** Fixar o cabelo da arte atual e da CG: "platinum white hair, asymmetric bob longer on the
   viewer's left, blue rose with black ribbon on the viewer's right". Alinhar o cut-in a esse cabelo e "warm skin
   tone, not washed out". No retrato, "one hand offered palm up toward the viewer, the other holding a plain black
   leather folder to the chest". No corpo, "black cape with amethyst marble-veined lining" e a mesma saia do retrato.
9. **Rato (refazer com a arte atual como alvo).** "painted fur in dusty taupe, stitched black button eyes with X
   thread, crooked unsettling grin with long yellowed incisors, pale peach ears, no pink tongue, not cute". Cauda
   "continuous from behind the coat, question-mark curve, fully in frame". No cut-in, padrão "falling playing card
   backs with absinthe geometric pattern".
10. **Cut-ins.** Resolver a direção na UI (máscara e rotação via CSS, como ESCOLHAS propõe), mas padronizar o pedido.
    Recorte sempre "eyes band only, from brow to nose tip (snout tip for animals)", a mesma borda "jagged torn edge,
    thick white", fundo com a cor de assinatura em halftone e linhas de velocidade. Hoje Javali e Rato mostram rosto
    inteiro e quebram a regra.
11. **Coerência.** A próxima rodada deve gerar os 7 retratos no MESMO modelo e com o mesmo prefixo de estilo. Se o 9b
    continuar recusando humanos, usar outro modelo para todos, não só para o Galo. Montar uma prancha com os 7 lado a
    lado, em silhueta preta e em cor, contra `elenco-silhuetas.svg` antes de aprovar. Peças do 4b não devem chegar a
    nenhuma tela.
12. **Referência por imagem.** Pelos testes, a referência com o Galo foi recusada, mas vale tentar img2img com baixa
    força (0,3-0,4) a partir do `neutro.webp` atual para Coruja, Herdeiro, Melissa e Javali. É o jeito mais seguro de
    manter mecha, cabelo e rosto do dono.
13. **Relógio-herói.** Pedir de novo só as cartas, com dorso ornamentado (ametista, mostrador, filete dourado) e a
    cartela em mármore com borda de latão. O resto pode ficar.

### O que muda nos outros documentos

- `npcs/ELENCO.md` §8 e as sete fichas: estilo e fundo trocados (nota no topo de cada uma).
- `BIBLIA.md` §11 e §14: as 19 peças de NPC não entram em tela.
- Melissa: a ficha (`npcs/melissa.md`) já pede chanel platinado assimétrico; é esse o alvo, e não o cabelo longo.
