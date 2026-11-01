# O Corvo: ficha de redesign (referência Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: máscara de crânio de ave com o bico fechado, **sem mandíbula e sem dentes**; as duas mãos de osso, sem luva; só o olho da esquerda de quem olha acende; cut-in dentro do capuz, sem cabelo humano.

Status: proposta para o dono aprovar. Nada aqui altera texto do dono. As falas citadas são literais e vêm da cena do
Poço (`docs/redesign/SISTEMAS-texto-do-dono.txt`, primeiro bloco; código em `lib/devo/poco-neblina.ts`).


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Dois conjuntos de prompts.** O **anônimo** (Poço, placa "???", o estado mais visto) não tem verdete nem corvo de
  ferro. O rosto fica em sombra total, e só aparecem a ponta de um bico de osso e um brilho pálido. O **revelado** tem a
  meia-máscara, o verdete e o corvo no ombro.
- **Rosto:** nenhum prompt mostra boca, lábios ou dentes, e o cut-in vai da testa à ponta do bico. A meia-máscara
  continua como PROPOSTA.
- **Cor:** o verdete vai a `#3A9FB0` (189°), mais ciano, para não encostar no verde novo da Coruja.
- **Forro:** penas com brilho verdete, ou lã fosca no anônimo. Sai o forro de ametista com mármore.
- **Gesto:** a mão de osso solta a moeda de cima, com a palma para baixo, como quem a deixa cair num poço. A asa
  aberta (pose 2) fica só com ele.
- **Luz:** fogo-fátuo de baixo no revelado; luz fraca e fria de cima no anônimo. A névoa é camada da interface e não
  entra no prompt, para não estragar o recorte.
- **Cut-in:** diagonal que desce (anfitrião ambíguo), 2048×640.

## 0. O que já existe e não muda

- **Papel:** "O Corvo", Anfitrião (`lib/devo/npcs.ts`). É a figura encapuzada da neblina que apresenta o **Poço dos
  Milagres**, entrega o **Dracma de Raridade Incomum** (`poco:corvo:<id>`) e some "sem se despedir adequadamente".
  O dono: "a figura misteriosa (que é secretamente o Anfitrião Corvo — não sei se comentei)". Na cena ele NUNCA é
  nomeado (placa "???"). Tem Essência de Afinidade (`essencia:corvo`).
- **O que o texto do dono diz do corpo dele** (é tudo o que existe, e manda no design):
  - "uma pessoa alta e esguia com um manto. Não é possível ver seu rosto com tanta névoa.";
  - a mão "estava o mais puro osso. Desnutrida, não tinha manga cobrindo sua carne morta ou a pele azulada e
    gélida";
  - "o cheiro incendiário de putrefação. Pensei ter visto uma larva devorando o tendão."
- **Temperamento** (lido nas falas): calmo, paciente, um pouco solene; trata o jogador por "criança"; tranquiliza
  e ameaça na mesma frase ("Eu não desejo te machucar… Você já saberia se eu quisesse."); avisa com peso de
  maldição ("Ou sofrerá algo terrível… e vai desejar não ter nascido.").
- **Arte atual:** não há. O dono nunca mandou a folha do Corvo (`ELENCO.corvo.pendente`); o jogo usa
  `public/images/npc/corvo/silhueta.svg`: capuz cinza-escuro, abertura em sombra, um **bico sugerido** no escuro e
  um brilho fraco de olho. A Essência (`public/images/essencias/corvo-*.webp`) mostra um corvo de ferro com
  **olho ametista** sobre um frasco com uma pena negra e fumaça violeta.
- **O que o torna reconhecível hoje** e fica: capuz fundo, rosto em sombra, o bico no escuro, um olho que brilha,
  a mão de osso. Cabelo e rosto nunca foram definidos pelo dono; o que esta ficha propõe para eles está marcado
  como PROPOSTA.

## 1. Conceito

**"O guardião do poço, que paga em moeda de defunto."** No elenco ao estilo Persona, o Corvo é o mensageiro
ambíguo: aparece quando você está perdido, oferece o que você precisa e cobra depois. Ele é o único Anfitrião que
o jogador conhece antes de saber quem é, e o design joga com isso. Há duas leituras que a arte tem de dar conta:

- **A figura (anônimo):** só manto, capuz, névoa e a mão de osso. Nenhuma cor de assinatura; quase monocromático.
  É assim nas cenas do Poço e em qualquer lugar onde ele ainda é "???".
- **O Anfitrião (revelado):** o mesmo manto, mas o capuz se abre o bastante para mostrar a **meia-máscara de crânio
  de corvo** e o brilho verdete das penas. É assim na Casa, nas Torres e nos Confidentes, depois que o jogo
  revelar o nome (quando e como revela: PENDENTE do dono).

Leitura em três palavras: **velado, cortês, podre.**

Leitura em uma olhada (método subtrativo do Soejima): **capuz pontudo + bico de crânio + mão de osso.** Em sombra
chapada, tem de ser o Corvo mesmo sem rosto.

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Verdete de pena | **`#3A9FB0`** | faixa do cut-in, aro do medalhão, cartão de Confidente, brilho iridescente das penas, olho aceso (revelado) |
| Sombra da assinatura | Verdete afogado | `#1C4E58` | 2ª sombra do brilho das penas e do forro |
| Luz da assinatura | Fogo-fátuo | `#A6E4EC` | rim light, partículas, o reflexo no osso |
| Pele (local) | Azul gélido | `#A9B6C2` / sombra 1 `#7D8B9A` / sombra 2 `#4F5A68` | rosto (o pouco que aparece) e pulso |
| Osso (local) | Osso velho | `#D9D0BC` / sombra `#A69B82` / fenda `#5E5444` | mão, máscara de crânio |
| Contra-cor | Ametista | `#8A7CC8` / smoky violet `#5A4F8F` | olho do corvo de ferro (igual à Essência), névoa (feita na interface) |
| Metal | Ferro escuro | `#3A3A40` / reflexo `#8C8C96` | broche, fecho do manto, anéis |
| Base | Negro-pena | `#0C0C0E` / `#16161A` | manto, capuz |

Por que verdete: é o brilho verde-azulado que a pena de corvo de verdade faz na luz, conversa com a "pele azulada e
gélida" do texto e, puxado para o ciano (189°), não encosta no verde da Coruja (150°) nem no azul da Melissa (228°). A
palavra "cobalt" é só da Melissa (ELENCO §1). Fica longe do vermelho do P5 e do rubi de alerta `#A3121F`.
Contraste do verdete sobre o negro: cerca de 6:1, legível como faixa e como texto grande.

Regra de cor por estado: **anônimo** = sem verdete (só negro, osso, névoa ametista); **revelado** = verdete aceso no
brilho das penas, no olho e nas faixas de UI. O jogador aprende a cor junto com o nome.

**Silhueta (teste em sombra chapada):**

- Topo: **capuz alto e pontudo**, com a ponta caída para trás como a cabeça de um corvo empoleirado. Mais alto e
  mais estreito que qualquer outro do elenco ("alta e esguia").
- Frente: o **bico** da meia-máscara sai da abertura do capuz, um triângulo comprido apontado para baixo. É o único
  recorte que quebra a forma arredondada do capuz e por isso vira a marca.
- Ombros: **capa curta de penas** (mantelete) sobre o manto longo; a borda é recortada em penas soltas, como asa
  fechada. A capa em "V" dá o triângulo do tronco.
- Corpo: manto que cai reto até o chão e se abre em tiras na barra, puxadas pela névoa. Sem pés à vista.
- Braços: **um braço sempre fora do manto**, o da mão de osso, sem manga. Os dedos longos e separados cortam o
  contorno como garras. Nunca esconder as duas mãos.

## 3. Figurino

- **Manto** longo de lã pesada, preto-pena, com barra esfiapada em tiras que se movem sozinhas. Por dentro,
  forro de **penas com brilho verdete** (revelado) ou de lã preta fosca (anônimo), que só aparece quando ele abre o
  braço. O forro de ametista com mármore é só da Melissa e da interface.
- **Mantelete de penas** sobre os ombros: penas negras sobrepostas, cada uma com filete verdete na ponta (só no
  estado revelado; no anônimo ficam foscas). Preso no peito por um **fecho de ferro em forma de crânio de ave**.
- **Capuz** costurado ao mantelete, fundo, com a ponta alta. A abertura nunca mostra a testa nem os olhos inteiros.
- **Meia-máscara de crânio de corvo** (PROPOSTA; nasce do bico que já existe na silhueta): osso velho, cobre do topo
  do nariz à testa, bico comprido descendo sobre a boca até a altura do queixo, com uma rachadura fina. Nos olhos
  da máscara, dois furos; no da esquerda de quem olha, um brilho (verdete quando revelado). O outro fica escuro. No
  estado anônimo a máscara não aparece: só a ponta do bico e um brilho de osso pálido no escuro do capuz.
- **Rosto** (PROPOSTA, e fora dos prompts até o dono aprovar): abaixo do bico, só sombra. O texto do dono diz "Não
  é possível ver seu rosto com tanta névoa"; boca, lábios e queixo ficam como ideia para depois. Mechas de **cabelo negro e liso, com pontas que lembram pena**,
  escapam do capuz dos dois lados até o peito. Cor real do cabelo e do rosto: PENDENTE do dono.
- **Mão esquerda: o acessório ícone.** Osso puro do pulso para baixo, como no texto, sem manga, com a carne
  azulada e rasgada terminando no antebraço. Dedos longos. Em close, uma larva pequena no tendão (detalhe de
  textura, não de destaque). Um anel de ferro com uma moeda incrustada (o Dracma) no dedo médio.
- **Mão direita:** luva de couro negro até o cotovelo, dedos com ponteiras de ferro afiadas como garras.
- **Pequenos detalhes:** penas soltas e larvas nunca em primeiro plano; um **corvo de ferro** igual ao da Essência,
  de olho ametista, pousado no ombro à direita de quem olha nas poses de Anfitrião (some no estado anônimo).

O que se descarta da silhueta provisória: o capuz redondo de cinza uniforme, o rosto 100% vazio, a borda clara.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"Por acaso, você precisa de uma moeda?"** (pose da oferta; padrão do cartão de Confidente). Corpo em 3/4,
   inclinado para a frente, curvado como quem se abaixa para falar com uma criança. A mão de osso, palma para
   baixo, deixa o Dracma escorregar da ponta dos dedos, como quem solta uma moeda num poço. (A palma para cima é só da
   Melissa; ELENCO §4.) A mão enluvada segura o manto fechado no
   peito. A cabeça inclinada; o bico aponta para a moeda. Diagonal da composição: da moeda (frente, embaixo à
   esquerda) até a ponta do capuz (atrás, em cima à direita).
2. **"Sinta-se livre para visitar o poço"** (pose de Anfitrião, Casa e Torres). Ereto, alto, de frente, os dois
   braços abertos em leque, o manto se abrindo e mostrando o forro de penas verdete como uma asa. A asa aberta é só dele no elenco. O corvo de ferro
   decolando do ombro. É a única pose em que ele parece hospitaleiro, e é a que mais assusta.
3. **"…e vai desejar não ter nascido."** (pose hostil). De perfil, quase de costas, a cabeça virada por cima do
   ombro. Só o bico e um olho aceso saem do capuz. A mão de osso em garra, erguida na altura do rosto, com as
   tiras do manto subindo como fumaça. Luz de baixo, verde-fátuo; o resto afunda no preto.

## 5. Seis expressões principais

O rosto dele quase não aparece, então a expressão mora em quatro lugares: **o brilho do olho** (tamanho e cor),
**o ângulo do bico** (cabeça), **a boca** abaixo do bico e **a mão de osso**. Chaves do vocabulário comum de
`lib/devo/npcs.ts`; hoje o Corvo tem `celulas: []`, então estas seis são a primeira folha dele (as outras seis ficam
para a folha completa).

| Chave | Leitura (fala literal) | Desenho |
|---|---|---|
| `neutro` | "Por acaso, você precisa de uma moeda?" | cabeça levemente inclinada, olho como ponto pequeno e firme, boca fechada; mão aberta, relaxada |
| `sorriso` | "Não há de quê." | sorriso fino de canto que só a boca mostra, bico um pouco erguido; olho meio fechado (o brilho vira meia-lua) |
| `malicia` | "Claro… O próximo não será tão fácil assim." | cabeça baixa de lado, bico apontando para o jogador, sorriso torto mostrando dentes pequenos; dedos de osso tamborilando |
| `serio` | "E lembre-se disso: caso a moeda seja lançada, não poderá ser recuperada." | de frente, bico reto, boca em linha; olho maior e mais nítido; o dedo de osso erguido |
| `sombrio` | "Ou sofrerá algo terrível… e vai desejar não ter nascido." | capuz cobre até o bico, só o olho aceso e duro; boca entreaberta; a pele em sombra 2, mão em garra |
| `surpreso` | quando o jogador faz algo que ele não esperava (presente amado, escolha rara) | cabeça em giro brusco de ave, bico erguido, olho dilatado em círculo cheio; o corvo de ferro abre as asas |

Regra de cel shading: duas sombras chapadas (pele `#7D8B9A` e `#4F5A68`; osso `#A69B82` e `#5E5444`), contorno
preto grosso por fora e fino por dentro, luz de fogo-fátuo verdete vinda de baixo, sem recorte ametista (ELENCO §5). Sem degradê na pele e no
osso. O único degradê permitido é a névoa.

## 6. Frase de cut-in

> **"Você já saberia se eu quisesse."**

Trecho literal da fala dele na cena do Poço ("Não há por que ter medo. Eu não desejo te machucar… Você já saberia
se eu quisesse."). Alternativas, também literais: **"O próximo não será tão fácil assim."** (para o Poço, depois de
um giro) e **"…e vai desejar não ter nascido."** (cut-in hostil). Qual é a oficial: PENDENTE do dono.

**Cut-in (1,2 s):** a névoa ametista entra em leque da direita; a tela racha em diagonal da esquerda alta para a direita baixa (regra dos anfitriões ambíguos, ELENCO §7); uma faixa verdete com textura de penas negras
iridescentes cruza; close cortado da testa à ponta do bico: o bico de osso na diagonal, o olho aceso à esquerda de quem olha, e
sombra onde estaria a boca. Penas pretas voam para fora do quadro. A frase entra em capitulares de osso, uma palavra por vez.
Saída: a faixa se desfaz em penas e a névoa fecha.

## 7. Animações de contexto

- **Entrada na Casa.** (PROPOSTA de encenação; não há texto do dono para a visita do Corvo.) Ninguém toca a
  campainha. Primeiro a névoa entra por baixo da porta e esfria a luz da sala; um corvo bate três vezes na janela;
  quando o jogador olha de volta, ele já está dentro, parado no canto mais escuro. No mapa, o sprite não anda:
  some numa nuvem de penas e reaparece ao lado de um objeto. O retrato grande sobe do chão como uma sombra que se
  ergue e para inclinado -4°.
- **Presente.** Ele estende a mão de osso para receber, sempre ela. Amado: `surpreso`, depois `sorriso`; penas
  verdete caem devagar e a faixa pulsa duas vezes. Gostado: `sorriso`, a mão fecha sobre o presente e ele some
  dentro do manto. Neutro: `neutro`, o corvo de ferro bica o presente. Odiado: `malicia`, a mão abre e deixa
  cair; as bordas do balão escurecem e uma larva cruza a moldura. Gostos e desgostos: PENDENTE do dono.
- **Romance.** Só se o dono marcar o Corvo como romanceável (SPEC-VISITANTES, PENDENTE 2). Proposta de encenação:
  a névoa clareia, o verdete perde força e a ametista sobe; ele afasta o capuz alguns centímetros (o bico continua
  no lugar) e, pela primeira vez, oferece a mão enluvada em vez da de osso. Expressão nova `timido` (bico virado
  para o lado, boca fechada, olho reduzido a um traço). Fundo com bokeh ametista e penas paradas no ar.
- **Hostil.** Pose 3. A cor some e fica só o olho, que passa de verdete a osso pálido. Cartão e balão viram
  negativo (osso sobre preto), o texto treme 1 px, as tiras do manto sobem pelas bordas da tela como dedos. Som
  de bater de asas abafado. Expressão `sombrio`; `serio` quando é um aviso, não uma ameaça.

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Antes da revelação:** o cartão existe, mas com placa "???", silhueta chapada da pose 1 sem verdete e névoa
  correndo por cima. Nada de nome, numeral ou cor de assinatura. O progresso aparece como penas apagadas.
- **Cartão da lista (120 px, corte diagonal):** fundo mármore negro com a carta de tarô do Arcano dele a 18%,
  girada -6°. A pose 1 sai do cartão pela mão de osso e pela moeda, que ultrapassam a borda. Faixa fina verdete na
  diagonal do corte. Nome "O CORVO" em capitular de osso; progresso em penas que acendem verdete.
- **Ficha cheia:** pose 2 grande, cortada na coxa, com o manto aberto ocupando a largura; atrás, a carta do Arcano
  em 2.5D e o Poço em silhueta, as duas com paralaxe pelo giroscópio. A névoa tem camada própria que corre devagar;
  o corvo de ferro do ombro pisca o olho ametista de tempos em tempos. Faixa diagonal verdete com "O Corvo ·
  Anfitrião".
- **Medalhão:** aro de ferro escuro com segundo aro verdete; dentro, o recorte do bico e do olho de `malicia`.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; um Dracma cai girando no fundo do Poço e o numeral
  novo sobe com a névoa.
- **Hostil:** cartão em negativo, silhueta da pose 3 com o olho em osso pálido.

## Pendências

1. **Arcano do Corvo:** não está em nenhum texto do dono. Sugestões para ele escolher ou descartar, cruzadas com o
   elenco (ELENCO §10): XIII, A Morte (a mão de osso, a putrefação) ou XVIII, A Lua (a névoa, o Poço que engana). A
   Roda da Fortuna saiu daqui porque é a sugestão do Javali. Não usar como definitivo.
2. Quando e como o jogo revela que a figura é o Corvo.
3. Rosto, cabelo e a meia-máscara: o texto só fala de capuz, névoa e mão de osso; o resto é proposta.
4. Romance, morar na Casa, hostilidade, presentes e ranks: SPEC-VISITANTES, PENDENTE 2.
5. Frase oficial do cut-in (item 6).
6. Ao receber a folha final, rodar `scripts/dev/fatiar-npcs.py` e `scripts/dev/rostos-npcs.py` e tirar o
   `pendente: true` de `ELENCO.corvo`.

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

### Estado anônimo (Poço, "???")

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A very tall gaunt hooded figure bends forward in three-quarter view as if leaning over a well; his bare bony left hand, held palm down at chest height, lets a small old coin slip from its fingertips, relaxed hand, five fingers clearly separated; the rest of him stays wrapped in the cloak. Deep pointed black hood with the tip drooping back like a perched crow's head; the face is in total shadow inside the hood, only the pale tip of a bone beak and one faint bone-white glint of an eye visible in the dark. Capelet of matte black crow feathers with no sheen, plain dark iron clasp, long heavy matte black cloak with a ragged hem; the bare forearm turns from bluish dead skin into pure aged bone. Nothing on the shoulders. Dim cold light from above, the figure mostly in deep shadow. Palette: black #0C0C0E, aged bone #D9D0BC, cold grey #7D8B9A. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. An extremely tall gaunt hooded figure stands perfectly still facing the viewer, the long matte black cloak closed, its hem torn into long ragged strips that hang and drift, no feet visible; the bare bony left arm hangs out of the cloak at his side, bluish dead skin turning into a skeletal hand of aged bone, relaxed hand, five fingers clearly separated. Tall pointed black hood with the tip drooping back; the face is in total shadow, only the pale tip of a bone beak and one faint bone-white glint of an eye visible in the dark. Capelet of matte black crow feathers with no sheen, plain dark iron clasp. Nothing on the shoulders. Silhouette: tall pointed hood, tiny beak tip, narrow column of cloak, one bony hand. Dim cold light from above. Palette: black #0C0C0E, aged bone #D9D0BC, cold grey #7D8B9A. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip falls from upper left to lower right. Inside the strip, an extreme close-up of the opening of a deep black hood: total darkness inside, only the pale tip of a bone beak and one faint bone-white glint of an eye. Behind, pale grey and amethyst mist rolling along the diagonal, a few matte black feathers drifting. Dim cold light from above. Palette: black #0C0C0E, aged bone #D9D0BC, amethyst #8A7CC8. No text, letters or logos anywhere.
```

### Estado revelado (Anfitrião)

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A very tall gaunt hooded figure bends forward in three-quarter view as if over a well; his bare bony left hand, palm down at chest height, lets a small old coin drop from its fingertips, relaxed hand, five fingers clearly separated; his gloved right hand with iron claw tips holds the cloak closed. Deep pointed black hood drooping back like a perched crow's head; inside, a cracked bone-white crow-skull half mask with a long downward beak, one glowing teal eye on the viewer's left, the other socket dark, only shadow below the beak. Black crow-feather capelet with teal-sheened tips and an iron bird-skull clasp; long black cloak lined with teal-sheened feathers; bare forearm turning from bluish dead skin into aged bone; small iron crow with an amethyst eye on the shoulder on the viewer's right. Pale teal will-o'-the-wisp light from below. Palette: black #0C0C0E, teal #3A9FB0, aged bone #D9D0BC. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. An extremely tall gaunt hooded figure stands facing the viewer, both arms spread wide like folding wings, the black cloak opening on a lining of teal-sheened crow feathers, its hem torn into long ragged strips lifting upward, no feet visible. Pointed black hood drooping back, cracked bone-white crow-skull half mask with a long downward beak, one glowing teal eye on the viewer's left, only shadow below the beak. Feather capelet with an iron bird-skull clasp; left arm bare from the elbow, bluish skin turning into a skeletal hand of aged bone, relaxed hand, five fingers clearly separated; right arm in a black glove with iron claw tips; small iron crow with an amethyst eye taking off from the shoulder on the viewer's right. Silhouette: pointed hood, beak breaking its outline, V capelet, spread arms. Pale teal light from below. Palette: black #0C0C0E, teal #3A9FB0, aged bone #D9D0BC. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip falls from upper left to lower right. Inside the strip, an extreme close-up cropped from the brow to the tip of a long bone beak: the edge of a black hood framing a cracked bone-white crow-skull half mask, its beak cutting diagonally across the frame, one fierce glowing teal eye in the socket on the viewer's left, the other socket dark, deep shadow where the face would be, strands of black feather-tipped hair. Behind, iridescent teal tones with black crow feather texture, black feathers bursting outward, wisps of amethyst mist and small pale teal sparks. Pale teal light from below. Palette: black #0C0C0E, teal #3A9FB0, aged bone #D9D0BC. No text, letters or logos anywhere.
```
