# Coruja: ficha de redesign (referência Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: cabelo **castanho-escuro** (não preto) com a mecha branca estreita à esquerda de quem olha; só orelhas humanas, sem orelhas de bicho; corpo sentado numa balaustrada inteira e visível, ou de pé encostada na pedra.

Status: proposta para o dono aprovar. Nada aqui altera texto do dono; falas citadas são literais e vêm do código
atual (`components/devo/apps/coruja-intro.tsx`, `lib/devo/npcs.ts`).


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Cor:** a assinatura deixa de ser âmbar (era igual ao do Javali) e vira o **verde-biblioteca `#2F7A55`**, tirado
  do colete que ela já tem. O âmbar fica só nos olhos e no broche, como cor local.
- **Identidade devolvida:** a capa curta marrom em festões com losangos e o colete verde-escuro com debrum dourado
  voltam. Na versão anterior desta ficha os dois tinham virado preto com ametista, e ela ficava com as cores de todo
  mundo.
- **Sem cobalto:** o `#1647FF` e a "cobalt rim light" saem. A luz dela é luar frio de cima, com um fio verde.
- **Adereço:** uma carta fechada, de dorso, com olho de coruja geométrico. O leque de cinco cartas sai, porque três
  personagens tinham leque.
- **Pose:** a asa aberta é do Corvo. A pose de corpo inteiro dela é a empoleirada (pose 3).
- **Mecha branca:** à esquerda de quem olha, estreita e reta, nascendo na trança. A cabeça vira para a direita de
  quem olha, e o Herdeiro vira para o outro lado (ELENCO §6).
- **Cut-in:** diagonal que sobe (aliada), recorte das sobrancelhas ao nariz, 2048×640.
- **PENDENTE DO DONO:** a assinatura verde; afinar a mecha.

## 0. O que já existe e não muda

- **Papel**: Coruja, "Guardiã das Cartas" (`lib/devo/npcs.ts`). Dá a aula das Cartas Devo (raridades, raridades
  secretas, funções, Coleções Arcanas, Ordem e Compêndio), sabe mais do que diz e some sem se despedir
  ("A Coruja desaparece sem se despedir adequadamente."). Nas Mensagens explica Arquétipos. Nas Torres é a NPC
  provisória do **Observatório** ("Uma torre de vigia com cúpula de aço"), com a Essência de Afinidade da Coruja.
- **Temperamento** (lido nas falas): elegante, irônica, gosta do Record mas guarda segredos por prazer,
  provoca com perguntas ("Vamos ver se você prestou atenção."), responde evasiva ("Quem sabe…?"), trata o
  jogador como "{meu querido|minha querida} Record".
- **Traços que tornam a Coruja reconhecível** (folha `docs/redesign/refs/npc-oc/Coruja.png`):
  - cabelo castanho-escuro quase preto, preso numa coroa de tranças, com uma **mecha branca** caindo à esquerda de quem olha (lado direito dela) e uma mecha solta e ondulada à direita de quem olha;
  - olhos **âmbar**, de pálpebra pesada, rosto longo e sereno, nariz reto;
  - **brincos de lua crescente** dourados com pingente fino;
  - gola alta branca, **jabô** em laço e o **broche de coruja** de olhos âmbar;
  - capa curta marrom com barra recortada em festões e losangos, colete verde-escuro com debrum dourado.
- Pronome: feminino ("Guardiã").

## 1. Conceito

**"A bibliotecária da noite."** A Coruja é quem cuida do arquivo do jogo: sabe o número de cada carta no
Compêndio e escolhe o que contar. No elenco ao estilo Persona ela ocupa o lugar da mentora ambígua, alguém que
está sempre um passo acima, olhando de cima de uma prateleira ou do parapeito do Observatório.

Leitura em três palavras: **vigia, arquivista, provocadora.**

Elevação em relação ao sprite atual:
- O sprite atual é um busto suave, de contorno fino e paleta morna e baixa. No redesign ela ganha contorno
  marcado, cel shading de duas sombras, luar frio vindo de cima e uma silhueta que lê "coruja" mesmo em sombra
  chapada.
- O marrom da capa e o verde do colete **ficam**: são as únicas cores dela que nenhum outro do elenco tem. O verde
  vira a assinatura (revisão de 01/11).
- Os olhos âmbar, que hoje se perdem, viram o ponto mais quente da imagem, como cor local, sem ser assinatura.

## 2. Cor de assinatura e silhueta

### Cor de assinatura

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| Assinatura | **Verde-biblioteca** | `#2F7A55` | colete, faixa do cut-in, aro do medalhão, cartão de Confidente, barra de afinidade |
| Assinatura, luz | Verde de abajur | `#8FD1A8` | fio de luz de recorte, texto pequeno sobre negro |
| Assinatura, sombra | Verde de cripta | `#1A4A33` | segunda sombra do colete |
| Cor local | Âmbar dos olhos | `#E3A13B` | íris e olhos do broche; não é assinatura |
| Cor local | Marrom da capa | `#6B4A32` | capa curta em festões (arte atual) |
| Base DEVO | Negro | `#0C0C0E` | saia, botas, fundo dos cartões |
| Base DEVO | Smoky violet | `#5A4F8F` | sombra fria |
| Base DEVO | Ametista | `#8A7CC8` | halo de foco da interface (não entra na roupa) |
| Base DEVO | Mármore branco | `#F1F0EE` | gola, jabô, mecha branca, luvas |

| Metal | Aço champanhe | `#BAB09F` | broche, debrum, correntes |

Regra de contraste: o verde fica no colete e nas faixas; o âmbar só nos olhos e no broche, para o olhar ir até
eles. Sem cobalto: a palavra é reservada à Melissa (ELENCO §1).

Por que verde (revisão de 01/11): o âmbar antigo (`#E3A13B`) era, na prática, o mesmo do Javali (`#E3A21A`). O verde
vem do colete que ela já usa na arte do dono, fica a 39° do verdete do Corvo e a 78° do absinto do Rato, e combina
com o papel dela de arquivista. Sobre o negro (3,8:1) funciona como faixa; para texto pequeno, o verde de abajur.
A troca de assinatura é PENDENTE DO DONO, como toda a roda do elenco.

### Silhueta (teste da sombra chapada)

Três coisas desenham a coruja no contorno, sem precisar de cor:

1. **"Tufos" na cabeça**: dois grampos longos de aço com ponta de losango, presos na coroa de tranças e
   apontando para cima e para fora, como as penas-orelha de um corujão. (Os grampos já aparecem em algumas
   células da folha atual; aqui crescem e viram assinatura.)
2. **Capa curta em festões**: a capa marrom da arte atual, com a barra recortada em festões e losangos, cai dos
   ombros e fecha o busto em forma de gota, como uma coruja empoleirada. Ela não abre em asa: a asa aberta é só do
   Corvo (ELENCO §4).
3. **Gola alta + jabô**: um "peito branco" vertical no centro do preto, que lembra a plumagem clara do peito
   de uma suindara.

Proporção: alta e estreita, ombros cobertos, cintura marcada por um corpete. Nada de volume nas pernas: a
massa fica toda em cima (cabeça e capa), como a ave.

## 3. Figurino

Peça por peça, de cima para baixo:

- **Cabelo**: coroa de tranças mantida, mais definida e com mechas grossas de desenho limpo. Mecha branca à
  esquerda de quem olha, **estreita e reta**, nascendo dentro da trança e caindo até o queixo (a do Herdeiro é larga e
  em gancho; afinar a dela é PENDENTE DO DONO). Mecha ondulada do lado direito até o peito.
  Dois grampos-tufo de aço.
- **Brincos**: lua crescente dourada, como na arte atual, com uma corrente fina e uma estrela de aço pendurada (liga com a moldura
  "Asas da Coruja" dos cosméticos).
- **Gola e jabô**: gola alta branca, rígida, com duas pontas. Jabô em três dobras de renda. O broche de coruja
  cresce um pouco e ganha olhos de âmbar facetado, que brilham de verdade (emissivo nos cut-ins).
- **Colete**: verde-garrafa escuro com debrum dourado, como na arte atual. Cintura alta.
- **Capa curta**: marrom, com a barra em festões e um losango em cada festão, como na arte atual, só que com
  desenho mais firme. O forro é do mesmo marrom, sem ametista.
- **Luvas**: longas, brancas, até o meio do antebraço, com um anel âmbar no indicador direito.
- **Saia**: longa e reta, preta, com fenda lateral e barra de veio de mármore. Botas de cano alto pretas com
  fivela de lua.
- **Acessório ícone**: **uma carta fechada**, sempre de dorso, com um olho de coruja geométrico no verso. Ela
  "segura o segredo" literalmente. Uma carta só: o leque de três personagens virou um adereço de cada um (ELENCO §4). O broche
  é o ícone secundário (aparece no medalhão e nos ícones pequenos).
- **Item do Observatório** (só nas Torres): luneta curta de aço presa no cinto por corrente.

## 4. Três poses

1. **"Vigília"** (pose padrão, retrato de VN): corpo em três quartos, virada para a direita de quem olha, capa
   fechada. Mão direita à altura do queixo com a carta fechada entre o indicador e o médio; o outro braço sob a
   capa. Cabeça levemente inclinada, olhar de cima para baixo. Diz: "eu sei, você não".
2. **"A carta fechada"** (pose de ensino, cut-in e apresentação): braço direito estendido em diagonal na
   direção da câmera, a carta de dorso entre o indicador e o médio, como quem pergunta "e agora?". A capa fica
   fechada. Olhos estreitos, meio sorriso. É a pose da aula.
3. **"Empoleirada"** (corpo inteiro, Confidentes e Torres): sentada de lado no parapeito / num degrau alto,
   uma perna dobrada, a outra caída, capa derramada sobre a pedra, a carta fechada sobre o joelho, luneta presa ao cinto. É a pose do corpo inteiro no `PROMPTS.json`. Cabeça virada quase de perfil por cima do ombro, como a coruja que gira o pescoço.

## 5. Seis expressões principais

Escolhidas entre as doze que o jogo já usa (`neutro, sorriso, piscadela, riso, desdem, preocupado, surpreso,
serio, irritado, triste, timido, malicia`), para o retrato grande e os cut-ins. As outras seis continuam
existindo no conjunto completo.

| # | Chave | Leitura Persona | Desenho |
|---|---|---|---|
| 1 | `neutro` | calma de quem observa | pálpebras a meio, boca fechada reta, cabeça um pouco inclinada; íris âmbar com brilho pequeno |
| 2 | `malicia` | a provocação | um canto da boca subindo, sobrancelha oposta erguida, olhos de lado; sombra mais dura na metade do rosto |
| 3 | `piscadela` | o segredo dado de presente | um olho fechado em arco, sorriso de lábios fechados, a carta encostada no queixo |
| 4 | `riso` | rara, por isso forte | cabeça jogada para trás, boca aberta, olhos fechados em arco, mecha branca solta no ar |
| 5 | `desdem` | "não te convém" | queixo erguido, olhar para baixo pelo canto, pálpebras pesadas, boca entreaberta; a carta escondendo a boca |
| 6 | `surpreso` | quando algo escapa do controle dela | olhos bem abertos com a íris âmbar inteira à vista, sobrancelhas altas, boca em "o" pequeno; o broche brilha |

Regras de desenho para todas: contorno preto de peso variável (mais grosso no queixo e na nuca), duas sombras
duras (sombra média smoky violet, sombra profunda quase preta), luar frio de cima com um fio verde de recorte, e
o âmbar dos olhos sempre o ponto mais quente da imagem.

## 6. Frase de cut-in

Tirada literalmente das falas que já existem (`coruja-intro.tsx`, capítulo Raridades):

> **"Vamos ver se você prestou atenção."**

Alternativas, também literais, para outros contextos:
- Desafio evasivo / momento de mistério: **"Quem sabe…?"**
- Revelação de raridade secreta: **"Geralmente eu mantenho em segredo, mas eu gostei de você."**

Qual delas é a frase oficial do cut-in é decisão do dono (PENDENTE).

## 7. Animações de contexto

Valem para a Casa e as Torres (VN / RPG Maker) e para o cartão de Confidente. Tempos curtos, ritmo de Persona:
entrada rápida, pausa, saída limpa.

### Entrada na Casa (visita)
1. Batida na porta; a tela escurece 15% e uma pena preta cai em diagonal da esquerda para a direita.
2. Cut-in: faixa diagonal (ângulo de 18°) cortando a tela, fundo negro, faixa verde-biblioteca subindo da esquerda para a direita (regra dos aliados, ELENCO §7). Close dos olhos da Coruja deslizando para dentro (220 ms), parada de 600 ms, os olhos piscam uma vez
   devagar (como a coruja).
3. O retrato grande entra na pose "Vigília" vindo do alto (não do lado), com a capa ainda se assentando,
   e para com um leve rebote. Partículas: poeira prateada e duas penas.
4. Primeira fala na caixa de VN.

### Presente
- **Recebe**: ela "guarda" o presente atrás da carta fechada; o olho do dorso brilha em âmbar.
- **Gostou**: `piscadela`, o broche acende, três estrelas pequenas sobem dos brincos.
- **Não gostou**: `desdem`, a carta some na manga com um estalo seco (som curto), a tela dá um tremor de 2 px.
- **Adorou** (se existir esse grau): `riso` com zoom de 6% e um flash âmbar nas bordas do quadro.
- Gostos e desgostos de presente: PENDENTE (dono).

### Romance
- Só se o dono marcar a Coruja como romanceável (SPEC-VISITANTES, PENDENTE 2).
- Proposta: luz cai para azul-noite, o fundo vira o céu do Observatório com constelações (ref-22) girando
  devagar, a capa cobre a borda do quadro como uma asa recolhida. Expressão `timido` (rubor leve, olhar de lado).
  Ela vira a carta para o jogador pela primeira vez: não esconde mais nada (o que está na face: PENDENTE). Sem partícula de
  coração; usar penas e estrelas.

### Hostil
- Só se o dono permitir a Coruja hostil (SPEC-VISITANTES, PENDENTE 2).
- O âmbar dos olhos fica mais saturado e o resto da tela dessatura. O retrato entra em `serio` / `irritado`,
  enquadrado de baixo para cima, com sombra que cobre metade do rosto. A carta gira entre os dedos como uma lâmina.
  Faixa do cut-in com o verde trocado por preto puro e só os olhos âmbar acesos. Som grave curto.

### Saída (mantém o que já existe)
- "A Coruja desaparece sem se despedir adequadamente.": o retrato vira uma revoada de penas pretas que sobe e
  some, deixando uma única carta caída no chão por 1 s.

## 8. Na tela de Confidentes

Cartão de chamada vertical, celular primeiro (390×844):

- **Fundo**: placa de mármore negro inclinada a -8°, com a silhueta da Coruja "Empoleirada" em corte cheio
  saindo pela borda superior direita (o retrato quebra a moldura, como em P5).
- **Faixa de cor**: tira verde-biblioteca `#2F7A55` atravessando o cartão em diagonal atrás da figura, com o veio do
  mármore aparecendo por dentro.
- **Carta de Arcano**: no canto inferior esquerdo, uma carta de tarô DEVO de pé, levemente girada. Qual Arcano
  é da Coruja é PENDENTE (dono). Sugestões para ele escolher ou descartar, cruzadas com o elenco
  (ELENCO §10): II, A Sacerdotisa (segredo, conhecimento guardado) ou IX, O Eremita (a lanterna, o observatório).
- **Rank**: numerais romanos em aço champanhe, de I a X; cada rank aceso é um pequeno olho âmbar aberto, os não
  atingidos são olhos fechados (pálpebra desenhada). Requisitos de rank: PENDENTE (dono).
- **Próxima recompensa**: linha curta embaixo do rank, em fonte do sistema; o conteúdo é do dono.
- **Medalhão**: o broche de coruja em medalhão redondo, com aro verde-biblioteca, usado nas listas e em
  `NpcMedallion`.
- **Movimento**: ao abrir, o cartão entra girando de -20° para -8°, a figura chega 80 ms depois e a carta gira uma vez entre os dedos. Ao subir de rank, um olho do rank abre com brilho âmbar e uma pena atravessa o cartão.
- **Desktop**: o cartão vira painel horizontal, figura de corpo inteiro à esquerda, informação à direita.

## 9. Pendências do dono

1. Arcano de Confidente da Coruja.
2. Se é romanceável, se pode morar na Casa e se pode vir hostil (SPEC-VISITANTES, PENDENTE 2).
3. Gostos e desgostos de presente.
4. Frase oficial do cut-in (entre as três literais da seção 6).
5. Se ela continua como NPC do Observatório nas Torres (hoje provisório em `TORRES.md`).
6. Assinatura verde-biblioteca no lugar do âmbar, e a mecha branca mais estreita (revisão de 01/11).
7. A face da carta fechada (só aparece no romance).

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A tall elegant woman in her thirties in three-quarter view, turned toward the viewer's right, head tilted, heavy-lidded amber eyes, faint knowing smile; her right hand near her chin holds one face-down card with a geometric owl-eye back, relaxed hand, five fingers clearly separated; her other arm rests under her capelet. Near-black braided crown, a narrow straight white streak from the braid to the chin on the viewer's left, a loose wavy lock on the viewer's right, two long steel hairpins rising like owl ear tufts, gold crescent earrings. High white collar and lace jabot with a gold owl brooch; dark bottle-green vest with gold trim; short brown capelet with a scalloped hem of small diamonds. Cool moonlight from above, thin green rim light. Palette: black #0C0C0E, library green #2F7A55, warm brown #6B4A32. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. A tall slender woman perches sideways on a narrow stone balustrade like an owl on a branch, one knee drawn up, the other leg hanging, turned toward the viewer's right, head turned back over her shoulder, amber eyes narrowed, sly half smile; one hand on the knee holds a single face-down card, the other lies flat on the stone. Near-black braided crown, narrow straight white streak on the viewer's left, steel hairpins like owl ear tufts. Brown scalloped capelet spilling over the stone; dark bottle-green vest with gold trim; white collar and jabot with gold owl brooch; long white gloves; long black slit skirt and tall boots; brass spyglass on the belt. Silhouette: ear-tuft pins, teardrop of a perched owl, white chest. Cool moonlight from above, green rim light. Palette: black #0C0C0E, library green #2F7A55, warm brown #6B4A32. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip rises from lower left to upper right. Inside the strip, an extreme close-up of a woman's face cropped from just above the eyebrows to just below the nose: heavy-lidded glowing amber eyes looking straight at the viewer, one eyebrow raised, a narrow straight streak of white hair falling on the viewer's left, dark brown hair, the tip of a steel hairpin, a gold crescent moon earring catching the light, skin with flat cel shadows and thick black contour. Behind the face, deep library green tones with faint vertical lines like the spines of shelved books, black feathers and fine silver dust flying along the diagonal, speed lines. Cool moonlight from above, amber glow only in the eyes. Palette: black #0C0C0E, library green #2F7A55, amber #E3A13B. No text, letters or logos anywhere.
```
