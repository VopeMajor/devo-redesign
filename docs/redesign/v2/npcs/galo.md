# O Galo: ficha de redesign (Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: prioridade 1 do elenco; sair do `flux-2-klein` para `lucid-origin` ou `phoenix-1.0`; tirar a lata de cerveja do prompt; casaco **sobre os ombros**, mangas vazias; barra em penas de cauda de galo; cut-in sem a mancha roxa no rosto.

**Quem é:** O Galo, "Tipo Galo Capone". Anfitrião do Arcano do Imperador (IV). Apresenta as Torres de Ruptura e as
Essências de Afinidade (`lib/devo/torres/galo.ts`), aparece de madrugada na casa do jogador e explica o Karma
(`lib/devo/dialogo/cenas/galo-casa.ts`, `docs/redesign/DIALOGOS-galo-salao.md`). Dá o próprio contato ao jogador e
tem a torre secundária do Imperador (`essencia:galo`, `chave:imperador`).

**O que o dono pediu sobre ele** (`REFINAMENTO-4-dono.md`): "deve continuar sendo irreverente, provocador, exagerado e
teatral". O enquadramento atual corta partes importantes da aparência dele; o redesign resolve isso com retratos em
pose de meio corpo, com respiro acima do cabelo.

**Arte atual** (`public/images/npc/galo/*.webp`, 12 expressões): ruivo de cabelo espetado com têmporas raspadas em castanho-escuro (mais visíveis à direita de quem olha) e uma mecha caindo sobre a testa para a esquerda de quem olha; pele morena dourada; olhos cinza-esverdeados,
pálpebra pesada e sobrancelha reta; queixo comprido e pescoço forte. Jaqueta preta de gola alta, camisa ferrugem
aberta no peito, broche dourado de galo na lapela esquerda dele (direita de quem olha). Tudo isso continua.


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Cor:** o cobre passa a `#C9542A` (matiz 16°), para abrir 28° de distância do âmbar do Javali.
- **Galo na silhueta:** barra do casaco cortada em penas de cauda, lenço de seda cobre amarrado como barbela e esporas
  nos sapatos bicolores. Antes, abaixo da crista ele era só um homem de terno.
- **Forro:** seda cobre bordada com penas. O forro de ametista com mármore é só da Melissa e da interface.
- **Saem:** a corrente de relógio (é do Rato) e a arminha de dedo (não está no texto do dono). A lata fica, porque é
  texto do dono: "[Ele tem uma lata de bebida na mão]" (`galo-casa.ts`).
- **Luz:** quente e dura de um lado, com a outra metade no escuro. A luz é dele e não segue a fórmula dos sete.
- **Lados:** escritos sempre do ponto de vista de quem olha (ELENCO §6). Broche à direita, mecha da testa caindo para
  a esquerda.
- **Cut-in:** diagonal que sobe (aliado), recorte das sobrancelhas ao nariz, 2048×640.
- **PENDENTE DO DONO:** broche dourado para aço champanhe; a roda de cores inteira.

---

## 1. Conceito

**"O mestre de cerimônias que se acha imperador."** Um showman de bairro com pose de chefão: chega sem bater, ocupa
o sofá, assalta a geladeira e fala como se estivesse num palco. Por trás da piada existe alguém que sabe mais do que
diz ("Quem precisa saber, sabe.") e que, de vez em quando, deixa escapar um julgamento seco ("Gente que não presta.").

O design tem duas camadas, e a arte precisa mostrar as duas:

- **A crista (o show):** cor quente, gestos largos, casaco jogado nos ombros como um manto de imperador de araque.
- **O trono (o Anfitrião):** quando ele fica sério, o calor some e sobra o preto, o aço champanhe e o olhar de cima.

Leitura em uma olhada (método subtrativo do Soejima): **crista ruiva espetada + casaco nos ombros + broche de galo.**
Se o jogador vir só a sombra, precisa saber que é o Galo.

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Cobre de crista | **`#C9542A`** | faixa do cut-in, aro do medalhão, cartão de Confidente, partículas de faísca, camisa |
| Sombra da assinatura | Cobre queimado | `#7A3315` | 2ª sombra do cel shading da camisa e do cabelo |
| Luz da assinatura | Brasa | `#F2A15E` | rim light quente, reflexo do broche quando aceso |
| Cabelo (local) | Ruivo crista | `#9E3A22` / sombra `#5C1E12` / undercut `#3A2418` | |
| Pele (local) | Morena dourada | `#C98E5E` / sombra 1 `#A86E45` / sombra 2 `#7E4F31` | |
| Contra-cor | Smoky violet | `#5A4F8F` | preenchimento frio na metade escura (o forro agora é cobre) |
| Metal | Aço champanhe | `#BAB09F` / reflexo `#ECE5D8` | esporas, abotoaduras (o broche segue dourado, como na arte atual) |
| Base | Mármore negro | `#0C0C0E` | casaco, calça |

Por que cobre e não vermelho: o vermelho puro é a marca do Persona 5 e, no DEVO, o rubi `#A3121F` é reservado para
alerta e eliminação. O cobre puxa do cabelo dele, conversa com a ametista (complementar quente/frio) e não se
confunde com aviso. Contraste do cobre sobre o negro: ~6:1, legível como faixa e como texto grande.

**Silhueta (teste em sombra chapada):**

- Topo: a **crista** espetada, mais alta à direita do personagem, com 5 ou 6 pontas bem separadas. É o "pente" do
  galo. Nunca cortar o topo do cabelo em nenhum enquadramento (pedido do dono).
- Ombros: o **casaco jogado nos ombros**, sem os braços nas mangas, abre um triângulo largo; as mangas vazias pendem
  e balançam. Isso dá um contorno de manto/asas recolhidas que nenhum outro NPC tem.
- Cintura fina e pernas longas: o triângulo invertido do tronco fecha em calça reta.
- Um braço sempre fora do corpo (apontando, segurando a lata, abrindo-se), para a sombra nunca virar um bloco.

## 3. Figurino

Redesenho completo, mesma identidade:

- **Casaco** de terno preto, longo até o meio da coxa, com gola alta dobrada (herança da jaqueta atual) e lapelas
  pontudas. Usado sobre os ombros, como capa. Forro em **seda cobre bordada com penas de cauda de galo**, que aparece quando o casaco se abre. A barra é cortada em **penas de cauda** compridas e curvas, que sobem em arco quando ele gira: é o galo no contorno, mesmo sem o cabelo.
- **Camisa** cobre de crista, seda fosca, aberta até o meio do peito, colarinho grande e pontudo para fora do casaco.
  Mangas arregaçadas até o cotovelo, antebraço à mostra.
- **Lenço-barbela:** lenço de seda cobre amarrado no pescoço com as pontas caídas, como a barbela do galo.
- **Colete** preto ajustado, sem gravata e sem corrente (a corrente fica só com o Rato, que a tem na arte do dono).
- **Calça** preta de alfaiataria, cintura alta, suspensórios finos à mostra só quando o colete abre.
- **Sapatos** bicolores preto e porcelana (gangster dos anos 30, "Capone"), com biqueira de aço e **esporas** pequenas de aço champanhe no calcanhar.
- **Acessório ícone: o broche de galo.** Continua dourado, como na arte atual (passar para aço champanhe é PENDENTE DO DONO): um galo cata-vento de perfil, na lapela à direita de quem olha. Nos prompts ele fica pequeno, porque a silhueta já diz "galo" pela crista, pela barra em penas e pela barbela. É o mesmo motivo da torre do Imperador
  (cata-vento de galo) e da Essência (gaiola com galo). Em cut-ins e no momento hostil, o olho do broche acende.
- **Mão:** anel de sinete liso no dedo mínimo. O numeral IV fica fora da imagem (letra e número na arte saem errados na geração); a interface põe o IV no cartão.
- **Adereço de cena (não fixo):** a lata de bebida da visita à casa ("Ele tem uma lata de bebida na mão").

O que sai da arte atual: o fade branco na barriga, a jaqueta de colegial sem forma, o broche minúsculo.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"Mestre do Universo"** (pose de apresentação, padrão do cartão de Confidente). Corpo em 3/4 inclinado para trás,
   queixo para cima, olhando o jogador de cima. Braço direito estendido apontando para a câmera com o indicador;
   mão esquerda no quadril empurrando o casaco para trás e mostrando o forro ametista. Sorriso de canto com dentes.
   Composição em diagonal: do sapato (canto inferior esquerdo) até a ponta da crista (canto superior direito).
2. **"Uma mão lava a outra"** (pose da Casa e das Essências). Encostado, quadril jogado para um lado, a lata na mão
   esquerda erguida como num brinde, a direita enfiada no bolso da calça (a arminha de dedo saiu: não está no texto do dono). Piscadela. Casaco
   escorregando de um ombro. É a pose de visitante folgado.
3. **"Gente que não presta."** (pose sombria). De frente, cabeça baixa, sombra cobrindo os olhos até a linha do nariz,
   só o brilho das íris. Mãos nos bolsos, casaco fechado nos ombros como um manto. Luz vem de baixo, fria, ametista;
   a assinatura cobre aparece apenas num fio de rim light no contorno da crista.

## 5. Seis expressões principais

Mantêm as chaves atuais (`lib/devo/npcs.ts`), com desenho mais forte. As outras seis (`neutro`, `desdem`, `surpreso`,
`timido`, `sorriso`, `confiante`) são refeitas no mesmo estilo e continuam valendo.

| Chave | Leitura | Desenho |
|---|---|---|
| `malicia` | "E aí, mané! Qual é a tua?" | cabeça inclinada, um olho mais fechado, sorriso torto de dentes cerrados, sobrancelha esquerda alta |
| `riso` | "BOA! Sabia que você era inteligente, mané!" | cabeça para trás, olhos fechados em arco, boca escancarada, ombros subindo; linhas de impacto ao redor |
| `piscadela` | "Shhh... Quem precisa saber já sabe." | piscada exagerada, indicador nos lábios ou apontando, língua no canto da boca |
| `irritado` | "Aí, tá querendo apanhar, é?!" | dentes à mostra, veia na têmpora, sobrancelhas baixas em V, cabelo eriçado mais do que o normal |
| `sombrio` | "Gente que não presta." | rosto em sombra até o nariz, íris pequenas e claras, boca em linha reta; cor tirada do rosto |
| `entediado` | "É chato esse tal de trabalho... Não é?" | pálpebras a meio pau, bochecha apoiada no punho, boca em bico de lado |

Regra de cel shading: duas sombras (pele `#A86E45` e `#7E4F31`), contorno preto grosso no exterior e fino no
interior, luz quente e dura de um lado e a outra metade no escuro com preenchimento smoky violet (ELENCO §5). Sem degradê suave na pele.

## 6. Frase de cut-in

> **"Eu sou pura adrenalina!"**

Tirada literalmente da apresentação das Torres (`lib/devo/torres/galo.ts`: "Comigo não tem lenga-lenga, nem
mimimi. Eu sou pura adrenalina!"). Alternativa curta, também literal: **"Quem precisa saber, sabe."** (cena da casa),
para o cut-in sombrio.

**Cut-in (1,2 s):** a tela racha em diagonal da esquerda baixa para a direita alta; entra uma faixa cobre de crista
com textura de mármore negro e penas estilizadas em aço champanhe correndo ao fundo; close dos olhos dele (de
`malicia`), cortado na altura da sobrancelha e do nariz; a frase em capitulares de aço champanhe entra letra por
letra; o broche pisca uma vez no canto. Saída: a faixa se dobra como uma carta virando.

## 7. Animações de contexto

- **Entrada na Casa.** Segue o texto do dono: a campainha toca, "A porta se abriu sozinha". A porta abre para fora do
  quadro com um sopro de faíscas cobre. Primeiro entra a sombra da crista no batente, depois ele, já em
  `confiante`, com o casaco nos ombros balançando. O retrato grande desliza da direita com um leve overshoot e para
  inclinado 4°. Ao "invadir a casa", o sprite do mapa corta caminho direto para a cozinha, sem pedir licença.
- **Presente.** Recebe com `surpreso` por um instante e troca rápido. Amado: `riso` com chuva de penas de aço
  champanhe e a faixa cobre pulsando duas vezes. Gostado: `piscadela`, joga o presente para cima e pega. Neutro:
  `entediado`, guarda no bolso sem olhar. Odiado: `desdem`, devolve por cima do ombro; a borda do balão escurece.
  Presentes que ele gosta ou odeia: PENDENTE (decisão do dono, ver SPEC-VISITANTES).
- **Romance.** Fala literal dele: "Eu sou tanto na terapia quanto no romance." A luz quente baixa, a ametista sobe;
  ele tira o casaco dos ombros e o joga no encosto (a silhueta perde o "manto", fica mais próxima). Expressão
  `timido` com o rosto meio virado, a mão coçando a nuca no undercut. Fundo com bokeh ametista e um coração de vidro
  no canto do balão.
- **Hostil.** Pose 3. O cobre apaga e fica só no olho aceso do broche. Cartão e balão viram negativo (porcelana sobre
  preto), a fala treme 1 px e o retrato sobe de baixo como uma sombra. Expressão `sombrio`, ou `irritado` quando a
  hostilidade vem de um insulto. Som seco de cata-vento girando.

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Cartão da lista (120 px, corte diagonal):** fundo mármore negro com a carta de tarô do **Imperador**
  (`public/images/arcanos/imperador/`) a 18% e girada 6°, como ilustração, sem numeral. A pose 1 sai do cartão pela
  crista (a crista inteira fica sempre visível acima da borda). Faixa fina cobre de crista na diagonal do corte.
  Nome "O GALO" em capitular champanhe e o **rank** do vínculo em numeral romano (o único numeral do cartão; o
  Arcano aparece por extenso, "Imperador", na ficha), losangos de ametista para o progresso.
- **Ficha cheia:** pose 1 grande, cortada na coxa, com a carta do Imperador em 2.5D atrás (gira com a inclinação do
  aparelho). O casaco no retrato tem uma camada própria que balança 2° com o giroscópio. Faixa diagonal cobre com
  "O Galo · Imperador" (em Vínculos, "Anfitrião" fica de fora para não confundir com o cargo da equipe;
  `SPEC-VISITANTES.md`, Convenções).
- **Medalhão:** aro de aço champanhe com um segundo aro cobre; dentro, o rosto de `malicia`. Com paixão marcada, o
  aro ganha porcelana e deixa rastro ametista na Constelação.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; o numeral novo cai como selo e o cata-vento do broche
  gira uma volta.
- **Hostil:** cartão em negativo, silhueta da pose 3 com o olho do broche aceso em cobre (não rubi: o olho é dele).

## Pendências

- "X quantidade de tempo" da resposta "Galo…?" continua configurável (`narrativa.galo_casa.tempo_min`, provisório).
- Presentes amados e odiados, se aceita morar e se aceita romance: decisão do dono.
- Ranks e prêmios de vínculo do Galo: decisão do dono.
- Broche dourado (arte atual) ou aço champanhe (proposta): decisão do dono. Os prompts usam dourado.
- Figurino novo (casaco-capa com barra em penas, barbela, esporas) passa pelo dono na folha de silhuetas (`elenco-silhuetas.svg`).

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A tall lean man in his late twenties leans back in three-quarter view, chin raised, crooked toothy grin; his right arm points at the viewer with the index finger; his left hand rests on his hip. Copper-red hair swept up into a tall crest of five sharp spikes, one lock across the forehead toward the viewer's left, shaved dark temples, golden-tan skin, heavy-lidded grey-green eyes. Long black coat worn over the shoulders like a cape, empty sleeves hanging, hem cut into curved rooster tail feathers, copper lining embroidered with feathers; burnt copper shirt open at the chest; copper silk scarf knotted like a wattle; small gold rooster brooch on the lapel on the viewer's right. Hard warm key light from the viewer's right, deep shadow on the other half. Palette: black #0C0C0E, copper #C9542A. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. A tall lean man stands in a loose diagonal pose, hip thrown to the side, winking with a cocky grin; his left hand raises a soda can like a toast, his right hand is in his trouser pocket. Copper-red hair in a tall spiky crest, shaved dark temples, golden-tan skin. Long black coat draped over the shoulders like a cape, hem cut into rooster tail feathers that arc upward, copper feather-embroidered lining; burnt copper shirt; copper silk scarf knotted like a wattle; high-waisted black trousers; black and white 1930s two-tone shoes with small steel spurs. Silhouette: tall crest, wide cape triangle, feathered hem, long legs. Warm copper backlight, cool smoky violet fill. Palette: black #0C0C0E, copper #C9542A, champagne steel #BAB09F. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip rises from lower left to upper right. Inside the strip, an extreme close-up of a man's face cropped from just above the eyebrows to just below the nose: heavy-lidded grey-green eyes, one narrowed in a mischievous smirk, one eyebrow raised, a lock of spiky copper-red hair cutting across the forehead, golden-tan skin with flat cel shadows and thick black contour. Behind the face, burnt copper tones with stylized rooster tail feathers and speed lines streaking along the diagonal, small ember sparks flying. Warm copper key light from the right, smoky violet shadow on the far cheek. Palette: black #0C0C0E, copper #C9542A, ember #F2A15E. No text, letters or logos anywhere.
```
