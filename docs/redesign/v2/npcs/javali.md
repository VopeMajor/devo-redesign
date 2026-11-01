# O Javali: ficha de redesign (Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: a crista é de **cabelo**, nunca chifre; o dado é um cubo de marfim com pintas pretas, não queijo; perfil magro e sinistro da arte atual (focinho longo, olhos âmbar semicerrados); cut-in sem dentes humanos.

**Quem é:** o Javali, "Anfitrião da Sala de Jogos" (`lib/devo/npcs.ts`). Recebe o jogador na primeira visita à
Sala de Jogos (`components/devo/arcade/javali-intro.tsx`), explica que ali "aposta-se Tempo", apresenta Mesa,
Agenda, Ranking, Apostas e Chat, joga a demonstração do Living Chess pelos dois lados
(`components/devo/arcade/games/quick-chess.tsx`), comenta o resultado das partidas (`arcade/sala-match.tsx`) e é o
oponente do treino (`TUTORIAL_OPPONENT = 'Javali (tutorial)'`). Nas Torres, é o NPC provisório da Torre do
Picadeiro, "uma torre de lona listrada onde a casa sempre ganha" (`lib/devo/torres/conteudo.json`), com
`essencia:javali` e `chave:picadeiro`. Já tem cosméticos próprios: moldura "Banquete do Javali" e emblema "Ficha
do Javali".

**Arte atual** (`public/images/npc/javali/*.webp`, 12 expressões): figura alta de cabeça de javali negra e lisa,
quase uma máscara, com uma aresta que desce da testa ao focinho; crista negra varrida para trás em pontas largas,
uma delas caindo longa e curvando para a direita de quem olha (lado esquerdo dele), como a ponta de um gorro de bufão; presas curvas de marfim; olhos âmbar de
pálpebra pesada e pupila fina; gola alta e dura cor de porcelana; plastrom branco amarrado; casaco negro de abas
esfarrapadas com forro claro; luvas negras de dedos compridos; medalhão de ouro com borla na lapela esquerda.
Gestos: mãos em torre diante do peito (`trama`, `sombrio`), mão no peito (`neutro`, `timido`), riso de cabeça para
trás (`riso`). Tudo isso continua. O que muda é o acabamento: contorno mais firme, duas sombras, uma cor de
assinatura e um acessório que funcione como ícone.


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Cor:** o âmbar vai a `#E0AC1C`. A Coruja deixou o âmbar, e o Javali é o único âmbar do elenco.
- **Sem cobalto:** o ponteiro cobalto `#2F4FA8` e o mostrador da ficha saem. A ficha fica lisa, com a borda dentada.
- **Adereços:** fichas e um dado gigante de marfim. Saem o baralho em leque, o alfinete de dado e os botões em ficha
  (as cartas ficam com a Coruja e com o Rato).
- **Gesto:** reverência com a mão no peito e o outro braço atrás das costas. Sai a palma oferecida (a palma para cima
  é só da Melissa).
- **Forro:** arlequim preto e âmbar escuro. Sai a ametista com mármore.
- **Corte:** sobrecasaca longa de barra em bandeirolas, não fraque. Isso o separa do Rato (fraque) e do Herdeiro
  (casaca de maestro).
- **Luz:** âmbar de baixo, como lâmpada de mesa de jogo.
- **Lados:** a ponta longa da crista e o medalhão ficam à direita de quem olha (conferido no `neutro.webp`).
- **Cut-in:** diagonal que desce (anfitrião ambíguo), recorte acima dos olhos até a ponta das presas, 2048×640.

---

## 1. Conceito

**"A banca que sorri."** O Javali é a casa de jogo em forma de gente: anfitrião educado, crupiê e dono da mesa ao
mesmo tempo. Ele chama todo mundo de "querido", oferece a cadeira e lembra, na mesma frase, que quem perde paga
com o próprio relógio. Não trapaceia: não precisa. A matemática da mesa já está do lado dele, e ele sabe disso.

Duas camadas, que a arte precisa mostrar:

- **O salão (o anfitrião):** gola branca impecável, mão no peito, reverência de mestre de cerimônias. Gestos lentos,
  corteses, um pouco teatrais.
- **A banca (o predador):** quando a aposta fica séria, ele se debruça sobre a mesa, junta as mãos em torre, as
  presas aparecem e o âmbar dos olhos é a única luz quente da cena.

Leitura em uma olhada (método do Soejima: achar o traço que faz o personagem ser ele e empurrar esse traço até ele
sobreviver ao redesenho): **cabeça de javali com presas + crista em ponta de bufão + gola alta de porcelana.** Em
sombra chapada, o jogador tem que reconhecer o Javali só pelo recorte da cabeça e da gola.

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Âmbar de ficha | **`#E0AC1C`** | olhos, faixa do cut-in, aro do medalhão, cartão de Confidente, fichas que caem, borla |
| Sombra da assinatura | Âmbar queimado | `#8A5A08` | 2ª sombra do medalhão e da borla, fundo da faixa |
| Luz da assinatura | Mel claro | `#FFD36B` | brilho da íris, reflexo da ficha, rim light quente |
| Pele/couro (local) | Ébano de javali | `#2A2724` / sombra 1 `#1A1816` / sombra 2 `#0E0D0C` / reflexo da aresta `#5B544C` | cabeça e mãos |
| Presas (local) | Marfim | `#EFE6D2` / sombra `#B9AA8C` | |
| Contra-cor | Smoky violet | `#5A4F8F` | sombra fria acima da luz de mesa |

| Porcelana | Branco mármore | `#F1F0EE` / veio `#C9C4BC` | gola, plastrom, punhos |
| Metal | Aço champanhe | `#BAB09F` / reflexo `#ECE5D8` | botões, corrente, anel |
| Base | Mármore negro | `#0C0C0E` | casaco, calça |

Por que âmbar: é a cor que ele já tem (olhos, medalhão, borla) e é a cor da ficha de jogo e da luz baixa de
lanterna sobre a mesa. Separa dele o resto do elenco: o Galo tem o cobre (`#C9542A`, 28° de distância), mais vermelho; o âmbar do Javali é amarelo-dourado e sempre aparece em pontos pequenos e intensos (olho, ficha, borla),
nunca em blocos grandes de roupa. Isso também evita confusão com o rubi de alerta (`#A3121F`) e com o champanhe dos
metais, que é dessaturado. Contraste do âmbar sobre o negro: cerca de 9:1.

**Silhueta (teste em sombra chapada):**

- Topo: a **crista** varrida para trás em três lâminas largas, a maior caindo para a direita de quem olha numa ponta longa e curva, como gorro de bufão. É o "chifre" que o medalhão do kit já preserva (`NpcMedallion`, Javali
  com os chifres). Nunca cortar a ponta em nenhum enquadramento.
- Rosto: perfil de focinho comprido e as **duas presas** curvas para cima, bem destacadas do contorno. Na sombra,
  são dois ganchos brancos; em retrato, são o primeiro brilho que o olho encontra depois do âmbar.
- Pescoço e ombros: a **gola alta de porcelana** sobe até a altura das presas e abre em duas pontas, como um
  leque. Ninguém mais no elenco tem esse recorte.
- Abaixo: casaco de abas longas e esfarrapadas, mais largo nos ombros (ombreiras quadradas) e afinando até a cintura,
  com as abas cortadas em pontas desiguais que lembram a lona rasgada do Picadeiro.
- Mãos: dedos longos e luvas negras, sempre separadas do corpo pela gola branca atrás (o gesto da torre lê bem
  porque fica sobre o branco).

## 3. Figurino

Redesenho completo, mesma identidade. Casino aristocrático com um resto de picadeiro.

- **Casaco de crupiê-mestre**: sobrecasaca negra de lã fosca (não é fraque: fraque é do Rato e casaca é do Herdeiro), abas longas até a panturrilha, terminando em pontas
  desiguais e esfiapadas (herança da arte atual, agora com propósito: são as bandeirolas da lona). Ombreiras
  quadradas e firmes. **Forro em losangos de arlequim**: preto e âmbar escuro, com filete de aço champanhe entre os
  losangos. (O forro de ametista com mármore é só da Melissa e da interface.) O forro só aparece quando o casaco se abre ou quando ele gira.
- **Gola de porcelana**: colarinho alto e engomado, de pontas largas que sobem até as presas. Veio de mármore leve
  na sombra da dobra.
- **Plastrom**: gravata larga de seda porcelana, amarrada num nó frouxo, sem alfinete.
- **Colete** negro de cetim com seis botões lisos de aço (os botões em moeda são do Rato).
- **Luvas** negras de couro fino, dedos longos. Na luva esquerda, um anel de sinete com o dado.
- **Calça** negra de alfaiataria e botas de cano curto com biqueira de aço champanhe, para os planos de corpo inteiro.
- **Acessório ícone: a Ficha da Casa.** O medalhão com borla vira uma ficha de jogo grande de ouro velho e âmbar
  (ecoa o emblema "Ficha do Javali" dos cosméticos), presa à lapela esquerda por uma corrente curta, com a borla
  âmbar pendendo. A ficha é lisa, de borda dentada, sem mostrador: mostrador puxa numerais na geração. O Tempo apostado
  aparece na interface, não no objeto. Em cut-ins e no momento hostil, a ficha gira e acende.
- **Adereços de cena (não fixos):** pilha de fichas, um **dado gigante de marfim com pontos âmbar** (do tamanho
  de um banquinho; o dado é só dele no elenco), a peça da dama do xadrez (demonstração do Living Chess), uma taça
  na visita à Casa. Baralho não: as cartas são da Coruja e do Rato.

O que sai da arte atual: o fade branco no tronco, o casaco que vira mancha sem forma, o medalhão pequeno demais para
ser lido no celular.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"A casa recebe."** (apresentação, padrão do cartão de Confidente). Corpo em 3/4, leve reverência: tronco
   inclinado para a frente, mão direita espalmada no peito sobre o plastrom, braço esquerdo
   dobrado atrás das costas, como um maître. Cabeça um pouco inclinada, olhos âmbar
   semicerrados, presas à mostra num sorriso de boca fechada. Composição em diagonal: da mão no peito (embaixo à esquerda) até a ponta da crista (em cima à direita). A aba do casaco abre e mostra os losangos.
2. **"As regras da casa."** (pose da banca, Sala de Jogos e Torre do Picadeiro). Debruçado para a câmera como se
   houvesse um tampo de mármore logo abaixo do quadro, cotovelos afastados, mãos em torre na frente do focinho,
   pontas dos dedos tocando. Rosto em sombra até o meio, só o âmbar e as presas acesos. Luz de lanterna vindo de
   baixo e da frente. Fichas empilhadas no canto inferior.
3. **"A casa sempre agradece."** (pose de vitória e de riso). De pé, cabeça jogada para trás, gargalhando, uma mão
   no peito e a outra apoiada no topo do dado gigante. As abas do casaco voam para trás. É a expressão
   `riso` atual levada ao corpo inteiro.

## 5. Seis expressões principais

Mantêm as chaves atuais (`lib/devo/npcs.ts`). As outras seis (`neutro`, `pensativo`, `entediado`, `explica`,
`surpreso`, `timido`) são refeitas no mesmo estilo e continuam valendo.

| Chave | Fala que já usa a expressão | Desenho |
|---|---|---|
| `convite` | "Ora, ora! Um rosto novo na minha mesa. Entre, entre, querid{o\|a}." | sobrancelha alta, olhos âmbar abertos e brilhantes, sorriso largo sem dentes, mão no peito; cabeça para o lado |
| `trama` | "E as regras da casa sou eu." | olhos estreitos de pupila fina, sorriso de dentes cerrados de ponta a ponta, presas para fora, mãos em torre; rim light âmbar só no contorno do focinho |
| `riso` | "Provoque, negocie, faça amigos. Ou inimigos. Eu adoro os dois." | cabeça para trás, olhos fechados em arco, boca escancarada mostrando a fileira de dentes, presas apontando para o alto; linhas de impacto |
| `desdem` | "Inscreva-se a tempo, porque eu não espero ninguém." | queixo erguido, olhar de cima pelo canto do olho, pálpebra a meio, focinho torcido de um lado |
| `sombrio` | "Quando zera, a festa acaba para você. Simples, não?" | rosto em sombra até abaixo dos olhos, só as íris âmbar acesas e pequenas, presas brancas em contraste; boca em linha reta |
| `furioso` | (sem fala própria hoje; reservada para o modo hostil) | boca aberta rosnando, dentes e presas inteiros, sobrancelhas em V fundo, crista eriçada, mãos abertas em garra de lado a lado |

Regra de cel shading: duas sombras no couro da cabeça (`#1A1816` e `#0E0D0C`) e uma linha de reflexo cinza-quente
(`#5B544C`) na aresta do focinho, para o rosto negro não virar uma mancha; contorno preto grosso no exterior, fino
no interior; luz âmbar vinda de baixo, como lâmpada de mesa de jogo, e sombra fria por cima (ELENCO §5). Sem degradê suave. Olho âmbar sempre com o brilho em
`#FFD36B`: é ele que segura a expressão num rosto escuro.

## 6. Frase de cut-in

> **"E as regras da casa sou eu."**

Tirada literalmente da apresentação da Sala de Jogos (`components/devo/arcade/javali-intro.tsx`: "Eu sou o Javali,
anfitrião desta casa. Ninguém joga aqui sem antes ouvir as regras da casa. E as regras da casa sou eu.").
Alternativas, também literais: **"A casa agradece o espetáculo."** (vitória do jogador, `arcade/sala-match.tsx`) e
**"O relógio cobra. A casa só observa."** (derrota cara, mesmo arquivo), para o cut-in hostil.

**Cut-in (1,2 s):** uma ficha âmbar gira no centro e é cortada em diagonal da esquerda alta para a direita baixa (regra dos anfitriões
ambíguos, ELENCO §7);
pelo corte entra uma faixa âmbar queimado com textura de mármore negro e losangos de arlequim pretos correndo ao
fundo, fichas e um dado rolando junto com as linhas de velocidade; close do rosto dele (de `trama`) cortado da ponta
da crista até as presas, olhos estreitos e brilhantes; a frase entra em capitulares de aço champanhe, letra por
letra; a Ficha da Casa dá uma volta no canto. Saída: a faixa se fecha como uma carta virada
para baixo na mesa.

## 7. Animações de contexto

- **Entrada na Casa.** Antes dele, o som: uma ficha rolando no assoalho até parar no tapete. A porta abre devagar,
  um feixe de luz de lanterna cruza o chão e a sombra da crista em ponta aparece no batente. Ele entra já em
  `convite`, numa reverência curta, com a mão no peito. O retrato grande desliza da esquerda, inclinado 4°, e para
  com um pequeno overshoot; as abas do casaco seguem com meio segundo de atraso. No mapa, o sprite vai direto até a
  mesa mais próxima, puxa a cadeira e senta primeiro. Fala da visita: PENDENTE (SPEC-VISITANTES, conteúdo do dono).
- **Presente.** Recebe com `surpreso` por um instante e examina o objeto como um crupiê examina uma ficha (levanta
  contra a luz). Amado: `riso`, joga uma ficha para o alto e uma pequena chuva de fichas âmbar cai no balão.
  Gostado: `convite`, guarda no bolso interno e mostra por um instante o forro de losangos. Neutro: `entediado`,
  apoia o presente na mesa sem olhar. Odiado: `desdem`, empurra o presente de volta com dois dedos, como quem
  devolve uma aposta inválida. Presentes amados e odiados: PENDENTE (decisão do dono).
- **Romance.** Se o dono liberar romance com ele (PENDENTE): a luz de lanterna baixa, a ametista sobe. Ele tira as
  luvas, uma de cada vez, e as deixa sobre a mesa: é a única vez que aparecem as mãos sem o couro negro. Expressão
  `timido`, olhar desviado, mão no peito. Fundo com bokeh ametista e as fichas da mesa viradas para baixo, sem
  aposta. Nenhuma fala nova é inventada aqui; o texto vem do dono.
- **Hostil.** Pose 2, mas sem a mesa: ele avança do fundo escuro e o retrato sobe de baixo. A Ficha da Casa acende e
  gira ao contrário. Cartão e balão viram negativo (porcelana sobre preto), o texto treme 1 px, e
  as únicas cores da tela são o âmbar dos olhos e o da ficha. Expressão `sombrio`, ou `furioso` quando
  a hostilidade vem de uma afronta. Som: fichas batendo umas nas outras, rápido e seco.

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Arcano:** o Javali ainda não tem Arcano oficial. Proposta para o dono decidir: **A Roda da Fortuna (X)**
  (`public/images/arcanos/fortuna/`), pelo papel de banca e de sorte. Fica marcado como PENDENTE até a decisão;
  enquanto isso, o cartão usa o verso neutro da carta.
- **Cartão da lista (120 px, corte diagonal):** fundo mármore negro com a carta do Arcano a 18%, girada 6°. A pose 1
  sai do cartão pela ponta da crista e pelas presas (as duas ficam sempre acima ou fora da borda). Faixa fina
  âmbar de ficha na diagonal do corte, com losangos pretos miúdos. Nome "O JAVALI" em capitular champanhe e o rank
  com losangos que acendem em âmbar.
- **Ficha cheia:** pose 1 grande, cortada na coxa, com a carta do Arcano em 2.5D atrás (gira com a inclinação do
  aparelho). As abas do casaco têm camada própria e balançam 2° com o giroscópio; fichas âmbar caem devagar em
  primeiro plano, fora de foco. Faixa diagonal com "O Javali · Anfitrião da Sala de Jogos".
- **Medalhão (Constelação):** aro de aço champanhe com um segundo aro âmbar e a borla pendurada embaixo; dentro, o
  rosto de `trama`, com a crista inteira (janela já medida em `lib/devo/npc-rostos.json`). Com paixão marcada, o aro
  ganha porcelana e deixa rastro ametista na órbita.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; o numeral novo cai na mesa como uma ficha e gira
  até parar.
- **Hostil:** cartão em negativo, silhueta da pose 2 só com os olhos âmbar acesos e a ficha.

## Pendências

- Arcano do Javali (proposta: X, A Roda da Fortuna; alternativa VII, O Carro; cruzado em ELENCO §10) e se o título "Anfitrião da Sala de Jogos" muda: decisão do dono.
- Forro claro da arte atual para arlequim preto e âmbar: passa pelo dono na folha de silhuetas.
- Torre do Picadeiro continua `[PROVISÓRIO]` em `lib/devo/torres/conteudo.json`.
- Presentes amados e odiados, se aceita morar, se aceita romance, falas de visita: decisão do dono (SPEC-VISITANTES,
  PENDENTE 2 e 13).
- Ranks e prêmios de vínculo do Javali: decisão do dono.
- `furioso` não tem fala no roteiro atual; quando houver texto do dono para o modo hostil, ele entra literal.

## Referências de método

- Soejima dá a cada personagem uma silhueta própria que insinua o que está escondido, e redesenha preservando o
  traço que torna o personagem reconhecível ([Gamesradar, arte conceitual de Persona 4](https://www.gamesradar.com/au/concept-art-appreciation-persona-4);
  [Game Informer, entrevista com o diretor de arte](https://gameinformer.com/b/features/archive/2014/07/18/a-glimpse-into-the-mind-of-personas-art-director)).
- Cor de tema definida cedo, uma por jogo (azul no P3, amarelo no P4), que aqui vira uma por personagem
  ([RPG Site, entrevista com Soejima](https://www.rpgsite.net/interview/4887-persona-5-q-a-with-character-designer-shigenori-soejima)).

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. An elegant anthropomorphic casino host with a black boar head bows courteously in three-quarter view, right gloved hand flat on his chest, left arm behind his back, sly closed-mouth smile. Matte ebony boar head like a lacquered mask, ridge down the long snout, two curved ivory tusks, glowing amber slit-pupil eyes, black swept-back crest of three blade-like locks, the longest curling toward the viewer's right like a jester's cap tip. Tall white collar flaring up to the tusks; loose white cravat; long black frock coat with square shoulders and ragged pennant hem; black and deep amber harlequin lining; black gloves; plain gold casino chip medallion with an amber tassel on the lapel on the viewer's right. Warm amber light from below like a gaming-table lamp. Palette: black #0C0C0E, amber #E0AC1C, ivory #EFE6D2. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. A tall anthropomorphic gambling-hall host with a black boar head throws his head back in a triumphant laugh, eyes shut, mouth open with teeth and curved ivory tusks; left gloved hand on his chest, right hand resting on a giant knee-high ivory die with amber pips beside him. Black swept-back crest, the longest lock curling toward the viewer's right like a jester's cap tip. Tall flared white collar; long black frock coat with broad square shoulders, hem cut into uneven pennant points like torn circus canvas, flying back; black and deep amber harlequin lining; black gloves; short boots with steel toe caps; gold chip medallion with amber tassel. Silhouette: curled crest, tusks, flared collar, square shoulders, ragged hem. Warm amber light from below. Palette: black #0C0C0E, amber #E0AC1C, ivory #EFE6D2. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip falls from upper left to lower right. Inside the strip, an extreme close-up of a black boar-headed host cropped from just above the eyes to the tips of his tusks: narrowed glowing amber eyes with thin slit pupils, a wide scheming grin of clenched teeth, two curved ivory tusks, smooth matte ebony skin with flat cel shadows and a thin warm grey highlight on the snout ridge. Behind the face, burnt amber tones with black harlequin diamonds, gold casino chips spinning past and one tumbling ivory die, speed lines along the diagonal. Warm amber light from below. Palette: black #0C0C0E, amber #E0AC1C, honey #FFD36B. No text, letters or logos anywhere.
```
