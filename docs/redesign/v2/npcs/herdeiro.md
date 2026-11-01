# O Herdeiro: ficha de redesign (Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: a **mecha branca em gancho** vem primeiro no prompt (à esquerda de quem olha; o resto do cabelo loiro-areia); só a batuta, **sem bengala** (é do Rato); jabô branco sem manchas; forro de pergaminho chamuscado com pautas; falta o cut-in.

**Quem é:** O Herdeiro, "Herdeiro Absoluto" (`lib/devo/npcs.ts`). É a primeira voz do tutorial do Deadly Vote
(`lib/devo/intro-script.ts`, oito falas: o pulso, o DEVO, as Cartas, Mensagens) e o "maestro" que apresenta o
Salão das Máscaras (DIRECAO-3 §1b; texto literal do dono em `DIALOGOS-galo-salao.md` e
`lib/devo/salao-herdeiro.ts`). Responde no app Mensagens com quatro perguntas (`quem`, `ajuda`, `troca`, `rato`) e
assina a epígrafe da Sala de Trocas. Trata o jogador como investimento ruim ("Um ativo de baixo rendimento como
você..."), despreza o Rato e manda no palco do Salão. Não tem voz na dublagem (`DUBLAGEM.md`) nem Essência de
Afinidade (`INVENTARIO.md` §8).

**Arte atual** (`public/images/npc/herdeiro/*.webp`, 12 expressões, folha OC do dono): cabelo cinza-areia penteado
para trás com volume, uma **mecha branca** larga caindo do lado direito dele (esquerda de quem olha) até o queixo;
óculos de **meio aro dourado**, finos; olhos verde-oliva de pálpebra pesada; **pinta** abaixo do olho esquerdo dele;
rosto comprido e queixo fino. Casaca **vinho** com bordado geométrico dourado nas lapelas, colarinho alto preto com
debrum dourado, plastrom de renda creme e broche dourado em losango com pedra vermelha. Na expressão `timido` ele
está sem óculos. Tudo isso continua. A troca da pedra vermelha (§3) é PENDENTE DO DONO, e os prompts usam a pedra vermelha.


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Mecha branca:** à esquerda de quem olha (lado direito dele), larga e em gancho sobre o olho. Ele vira a cabeça
  para a esquerda de quem olha, e a mecha passa na frente do olho de trás. A Coruja vira para o outro lado e tem a
  mecha estreita e reta. A pinta fica abaixo do olho da direita de quem olha.
- **Forro:** pergaminho chamuscado com pautas finas, sem nenhuma nota. Sai a ametista com mármore.
- **Pedra do broche:** fica vermelha nos prompts, como na arte atual. A granada bordô é PENDENTE DO DONO.
- **Mãos:** uma mão com a batuta e a outra atrás das costas. Saem a batuta nos lábios e a corrente dos óculos.
- **Saem:** a corrente de relógio do colete (é do Rato), "musical staff" e "note shapes" nos prompts.
- **Luz:** foco de palco frio de cima, com fio ametista. É um dos poucos que mantêm o recorte ametista.
- **Cut-in:** diagonal que desce (anfitrião ambíguo), bordas rasgadas como as dos outros, 2048×640.

---

## 1. Conceito

**"O herdeiro que rege a plateia."** Nasceu com a cadeira já reservada e fala como quem lê a cotação do jogador.
Educado na forma, cruel no conteúdo. No Salão das Máscaras ele é o maestro: não leiloa nada com as próprias mãos,
só aponta e a sala obedece. O que o move é o controle ("o único maestro sou eu"); o que o trai é a curiosidade
("Foi sorte? Ou será que usou algum método interessante?").

Duas camadas, e a arte precisa mostrar as duas:

- **O palco (a etiqueta):** postura reta, luvas, a batuta erguida, o sorriso de quem já sabe o fim do leilão.
- **A coxia (a trama):** a luz bate nos óculos e apaga os olhos; sobra o reflexo dourado e a boca. É quando ele
  deixa de fingir que está ajudando.

Leitura em uma olhada (método do Soejima: achar o traço que faz o personagem ser ele e exagerar só esse):
**mecha branca sobre o olho + óculos que reluzem + casaca de maestro com a batuta.** Em sombra chapada, a cauda
partida da casaca e a batuta na diagonal já dizem quem é.

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Bordô de herança | **`#8C1D47`** | casaca, faixa do cut-in, aro do medalhão, cartão de Confidente, pétalas/fitas de palco |
| Sombra da assinatura | Bordô de cripta | `#4A0E26` | 2ª sombra do cel shading da casaca |
| Luz da assinatura | Rosa de lacre | `#D9809F` | rim light quente, texto pequeno sobre negro (contraste ~7:1), brilho do selo |
| Cabelo (local) | Cinza-areia | `#C9B79A` / sombra `#8F7E66` / mecha `#F1EDE4` | |
| Pele (local) | Clara | `#F2D2B6` / sombra 1 `#D9AE8F` / sombra 2 `#B5876B` | |
| Olhos | Verde-oliva | `#7E8F4A` | íris; único verde do personagem |
| Contra-cor | Smoky violet | `#5A4F8F` | sombra fria, reflexo das lentes no modo "trama" (o forro agora é pergaminho) |
| Metal | Ouro velho / champanhe | `#BAA16A` / `#BAB09F` | óculos, bordado, batuta, selo |
| Base | Mármore negro | `#0C0C0E` | colete, calça, luvas, colarinho |

Por que bordô: é a cor que o dono já deu a ele (a casaca vinho da folha OC), então o jogador reconhece de longe.
O tom puxa para o roxo, conversa com a ametista e fica longe do vermelho alaranjado do Persona 5 e do rubi de alerta
do DEVO (`#A3121F`). Como o bordô é escuro sobre o negro (~2,3:1), ele aparece como **faixa e superfície**, com
texto em porcelana por cima (~7,4:1); para texto pequeno sobre negro usa-se o rosa de lacre. Fica a 39° do cobre do Galo e longe do âmbar do Javali, do verde da Coruja e do verdete do Corvo (ELENCO §1). O `herdeiro: 'cobalt'` de
`mensagens-app.tsx` passa a ser só o tom da interface do sistema; a assinatura dele é o bordô.

**Silhueta (teste em sombra chapada):**

- Topo: cabelo com volume para trás e a **mecha** caindo em gancho sobre o olho direito dele (esquerda de quem olha), separada do resto por um
  vão de luz. É larga e em gancho; a da Coruja é estreita e reta. É o único elemento assimétrico da cabeça.
- Pescoço: **colarinho alto** rígido, mais alto que hoje, com as pontas do plastrom saindo em leque.
- Tronco: casaca de maestro ajustada, ombros estruturados e quadrados; a cintura fecha alta.
- Base: as **duas caudas** da casaca, longas até a panturrilha, abrem em "V" quando ele se vira. Nenhum outro NPC
  tem cauda partida.
- Sempre um braço fora do corpo com a **batuta** em diagonal (nunca paralela ao corpo), para a sombra ter uma linha
  de força.

## 3. Figurino

Redesenho completo, mesma identidade:

- **Casaca** de maestro em veludo bordô de herança, curta na frente e com duas caudas longas atrás. Lapelas de
  cetim negro com o bordado geométrico atual redesenhado como **pauta de partitura**: cinco filetes de ouro velho
  que correm da lapela até a ponta das caudas e se partem em ângulos retos (herda o desenho da folha OC). Forro de
  **pergaminho chamuscado com pautas finas** (só as linhas, nenhuma nota), visível quando as caudas abrem. O forro de
  ametista com mármore é só da Melissa e da interface.
- **Colarinho** alto de mármore negro com debrum de ouro velho e dois botões de selo.
- **Plastrom** de renda porcelana em leque, mais volumoso que hoje, preso pelo broche.
- **Colete** negro de seis botões, sem corrente (a corrente é do Rato).
- **Luvas** negras finas, curtas. Ele tira a luva da mão esquerda no romance (§7).
- **Calça** negra de alfaiataria com galão de cetim lateral; **sapatos** de verniz negro com fivela de ouro velho.
- **Óculos** de meio aro dourado, lentes retangulares finas, sem corrente (fica mais limpo no rosto e evita mais um detalhe fino para o recorte). As lentes são o truque de luz do personagem: no Persona, o reflexo nas lentes esconde
  a intenção (ver `trama` e hostil).
- **Broche:** o losango dourado continua com a pedra vermelha da arte atual. Proposta, PENDENTE DO DONO: trocar a
  pedra por uma **granada bordô** (assinatura) com um pequeno sinete de engrenagem gravado, que conversa com o emblema cosmético **Engrenagem do Herdeiro**
  (`components/devo/cosmeticos/art/emblemas.ts`). Assim o rubi fica reservado ao alerta.
- **Acessório ícone: a batuta.** Ébano negro com ponta de ouro velho e empunhadura de marfim em forma de peão de
  xadrez. Ele aponta com ela, rege a sala com ela e a bate na palma da mão quando perde a paciência. Sustenta a fala
  "o único maestro sou eu" sem precisar de texto.
- **Adereço de cena (Salão, não fixo):** meia-máscara de baile porcelana com filete bordô, presa à cintura por uma
  fita. Só aparece nas telas do Salão das Máscaras e no cut-in de abertura do Salão.

O que sai da arte atual: o esfumado branco na base do busto, o bordado chapado sem relevo, a pedra vermelha.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"O único maestro"** (pose de apresentação, padrão do cartão de Confidente e do Salão). Corpo em 3/4, virado
   para a esquerda de quem olha (a Coruja vira para o outro lado; ELENCO §6), coluna reta, queixo levemente erguido, olhar de cima para baixo pelo canto das lentes. Braço direito erguido na
   diagonal com a batuta apontada para o alto e para fora do quadro, como quem pede silêncio à orquestra; mão
   esquerda atrás das costas. Uma cauda da casaca entra no quadro por baixo.
   Composição em diagonal: da cauda da casaca (embaixo) até a ponta da batuta (canto superior direito).
2. **"Ativo de baixo rendimento"** (pose de avaliação; tutorial e Mensagens). De frente, peso numa perna, braços
   cruzados com a batuta presa sob o braço; a mão direita ajusta os óculos pela ponte com dois dedos. Cabeça
   inclinada uns 10°, sobrancelha erguida do lado da pinta. É a pose de quem lê um balanço e não gostou.
3. **"Mas não se deixe enganar."** (pose sombria / trama). Perfil a 3/4 de costas, olhando para trás por cima do
   ombro. Luz de baixo, fria, ametista; as lentes viram dois retângulos de reflexo dourado, sem olhos visíveis. A
   batuta fica baixa, apontando o chão em diagonal. (A batuta nos lábios, com óculos e giro de ombro, juntava mão,
   rosto e lente no mesmo ponto: risco alto de anatomia ruim na geração.) As caudas da casaca abertas em "V" ocupam a metade de baixo do
   quadro. A assinatura bordô só aparece no fio de rim light do contorno.

## 5. Seis expressões principais

Mantêm as chaves atuais (`lib/devo/npcs.ts`), com desenho mais forte. As outras seis (`neutro`, `confiante`,
`irritado`, `entediado`, `sorriso`, `surpreso`) são refeitas no mesmo estilo e continuam valendo. Os trechos entre
aspas são falas que já existem, todas do texto do Salão (literal do dono) ou das telas atuais.

| Chave | Leitura | Desenho |
|---|---|---|
| `desdem` | "Um ativo de baixo rendimento como você..." | cabeça para trás e de lado, pálpebras a meio pau, lábio superior torcido, olhar descendo pelas lentes inclinadas |
| `malicia` | "Foi sorte? Ou será que usou algum método interessante?" | sorriso fino só de um lado, um olho mais fechado, a mão ajustando os óculos; brilho de ouro em uma lente |
| `trama` | "Mas nunca se esqueça: o único maestro sou eu." | queixo baixo, as lentes apagam os olhos em reflexo dourado, sorriso largo e fechado; sombra cobre até a linha do nariz |
| `riso` | "Até para mim, é difícil enumerar tantas possibilidades!" | cabeça jogada para trás, olhos fechados em arco, boca aberta com caninos à mostra, a mecha voando; é a única hora em que ele perde a pose |
| `furioso` | "E, se algum idiota decidir comprá-los..." (o tom, levado ao limite) | dentes cerrados, sobrancelhas em V fundo, óculos tortos no nariz, a batuta quebrando na mão; sombras do rosto em bordô de cripta |
| `timido` | (sem fala; só em romance) | **sem os óculos**, como na folha OC; olhar desviado para baixo, rubor em hachura fina, boca apertada, mão no colarinho |

Regra de cel shading: duas sombras (pele `#D9AE8F` e `#B5876B`), contorno negro grosso por fora e fino por dentro,
foco de palco frio e branco vindo de cima e um fio de recorte ametista (ELENCO §5), sem degradê na pele. A mecha branca nunca recebe a segunda
sombra: ela é o ponto mais claro do quadro depois das lentes.

## 6. Frase de cut-in

> **"O único maestro sou eu."**

Tirada literalmente da última fala da apresentação do Salão das Máscaras (`DIALOGOS-galo-salao.md`;
`salao-herdeiro.ts`, `h18`: "Agora vá. Faça volume nesta plateia... Mas nunca se esqueça: o único maestro sou
eu."). Para o cut-in sombrio, também literal: **"Mas não se deixe enganar."** (`h12`).

**Cut-in (1,2 s):** a tela é cortada por um golpe de batuta em diagonal, da esquerda alta para a direita baixa (regra dos anfitriões
ambíguos, ELENCO §7);
entra uma faixa bordô de herança com textura de veludo e cinco filetes de ouro velho correndo como uma pauta, com
pétalas negras voando (sem notas: notas viram sinal gráfico e texto na geração); close dos olhos dele (de `malicia`), cortado entre a sobrancelha e o nariz, com a
mecha branca atravessando o quadro e a lente esquerda pegando um clarão dourado; a frase entra em capitulares de
ouro velho, uma palavra por compasso; a ponta da batuta risca o canto superior. Bordas rasgadas, como nos outros seis. Saída: a faixa fecha como uma cortina de palco.

## 7. Animações de contexto

Se o Herdeiro será Visitante, se aceita romance e se pode vir hostil é decisão do dono (SPEC-VISITANTES,
PENDENTE 2). As animações abaixo ficam prontas para quando ele decidir.

- **Entrada na Casa.** A batida dele é diferente das outras: duas batidas exatas, em compasso, e silêncio. Quando
  a porta abre, ele não entra logo; fica no batente, ajusta os óculos (as lentes reluzem uma vez) e só então
  atravessa, em `desdem`, olhando o ambiente como quem avalia um imóvel. O retrato grande entra da direita sem
  balanço, reto, e para alinhado; é o único NPC que não inclina na entrada. No mapa, o sprite anda devagar até a
  peça de decoração mais cara do cômodo e para diante dela.
- **Presente.** Recebe com `surpreso` por meio segundo e troca para a avaliação. Amado: `riso` contido, guarda o
  presente no peito da casaca e a faixa bordô corre uma vez com pétalas negras. Gostado: `malicia`, gira o
  presente entre dois dedos como quem confere a autenticidade. Neutro: `entediado`, entrega a um criado que não
  aparece (a mão sai do quadro e volta vazia). Odiado: `desdem`, segura o objeto com a ponta da batuta e o
  devolve; a borda do balão escurece. Presentes amados e odiados: PENDENTE (decisão do dono, SPEC-VISITANTES).
- **Romance.** A luz do palco baixa e sobra um foco frio ametista sobre ele. Ele tira os óculos, dobra e guarda no
  bolso do colete, e tira a luva da mão esquerda (a silhueta perde a batuta e a luva: fica mais próxima). Expressão
  `timido` com o rosto meio virado. Fundo com bokeh ametista e partitura desfocada; no canto do balão, um coração
  de vidro com um filete bordô.
- **Hostil.** Pose 3. O bordô some do quadro e fica só no reflexo das lentes, que viram dois retângulos opacos
  (nada de olhos). Cartão e balão em negativo (porcelana sobre preto), a fala treme 1 px e o retrato desce de cima
  como uma cortina que cai. Expressão `trama`, ou `furioso` quando a hostilidade vem de um insulto; aí a batuta se
  parte com um estalo seco e o som de uma corda de violino rompendo.

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Cartão da lista (120 px, corte diagonal):** fundo mármore negro com a carta do **Arcano dele** a 18% e girada
  6°. Qual Arcano é do Herdeiro: PENDENTE 17 (decisão do dono); até lá, o verso da carta de tarô. A pose 1 sai do
  cartão pela cabeça e pela ponta da batuta, que fura a borda superior. Faixa fina bordô na diagonal do corte com
  cinco filetes de ouro (a pauta). Nome "O HERDEIRO" em capitular champanhe, numeral do rank em ouro velho,
  losangos de ametista para o progresso.
- **Ficha cheia:** pose 1 grande, cortada na coxa, com a carta do Arcano em 2.5D atrás (gira com a inclinação do
  aparelho). As caudas da casaca ficam numa camada própria que balança 2° com o giroscópio; as lentes ganham um
  reflexo que corre conforme a inclinação. Faixa diagonal bordô com "O Herdeiro · Herdeiro Absoluto".
- **Medalhão:** aro de ouro velho com um segundo aro bordô gravado como pauta; dentro, o rosto de `malicia`. Com
  paixão marcada, o aro ganha porcelana e deixa rastro ametista na Constelação.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; o numeral novo cai como selo de lacre bordô com a
  engrenagem do broche e trava com um clique de metrônomo.
- **Hostil:** cartão em negativo, silhueta da pose 3 com as lentes acesas em reflexo dourado. Pela regra da spec,
  o hostil tem olhos de rubi; no Herdeiro os olhos não aparecem, então o rubi fica nas duas lentes.

## Pendências

- Se é Visitante, se aceita morar, se aceita romance e se pode vir hostil: decisão do dono (PENDENTE 2).
- Arcano do Herdeiro: decisão do dono (PENDENTE 17). Sugestões cruzadas com o elenco (ELENCO §10): V, O Hierofante
  (herança, hierarquia, o rito do Salão) ou XV, O Diabo (o controle da plateia). Observação: o Estágio 0 do Imperador em
  `lib/devo/arcanos-textos.ts` se chama "Herdeiro", mas o Imperador já é do Galo.
- Essência de Afinidade: ele não tem item `essencia:herdeiro`; criar ou não é decisão do dono.
- Presentes amados e odiados, ranks e prêmios de vínculo: decisão do dono.
- Voz: segue sem dublagem (`DUBLAGEM.md`).
- Pedra vermelha do broche ou granada bordô: decisão do dono. Os prompts usam a vermelha.
- Trocar os sprites exige rodar de novo `scripts/dev/rostos-npcs.py` (`lib/devo/npc-rostos.json`).

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A slender aristocratic young man in three-quarter view, turned toward the viewer's left, spine straight, chin raised, looking down over his lenses with a thin one-sided smirk; his right arm raised diagonally holds a black conductor's baton with a gold tip pointing out of frame; his left hand behind his back. Ash-sand beige hair swept back, one wide white streak hooking across the far eye on the viewer's left down to the jaw, thin gold half-rim glasses, heavy-lidded olive eyes, beauty mark under the eye on the viewer's right. Wine-burgundy velvet conductor's tailcoat with black satin lapels and thin gold right-angled embroidery; tall black stand collar with gold piping; white lace jabot with a gold diamond brooch and a deep red gem; charred parchment lining with faint ruled lines; thin black gloves. Cold white spotlight from directly above, thin amethyst rim light. Palette: black #0C0C0E, burgundy #8C1D47, amethyst #8A7CC8. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. A slender aristocratic young man stands turned three-quarters away toward the viewer's left, looking back over his shoulder with a calm sinister smile; his right hand holds a black baton low, pointing diagonally down; his left hand on his hip. Ash-sand swept-back hair with one wide white hooked streak on the viewer's left, thin gold glasses catching the light. Wine-burgundy velvet tailcoat, short in front, two long tails flaring in a wide V to show a charred parchment lining; tall black stand collar; white lace jabot with a gold brooch and a deep red gem; black trousers with a satin stripe and patent shoes with gold buckles; a porcelain half masquerade mask hanging from the belt by a ribbon. Silhouette: hooked streak, tall collar, square shoulders, split V tails, baton as a diagonal line. Cold white spotlight from above. Palette: black #0C0C0E, burgundy #8C1D47, antique gold #BAA16A. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip falls from upper left to lower right. Inside the strip, an extreme close-up of a young man's face cropped from just above the eyebrows to just below the nose: heavy-lidded olive green eyes narrowed in a cold look, one eyebrow raised, thin gold half-rim glasses with a bright gold flare on one lens, a wide white hooked streak of hair cutting diagonally across the frame on the viewer's left, ash-sand beige hair, small beauty mark under the eye on the viewer's right. Behind the face, wine-burgundy velvet with five thin parallel gold lines running along the diagonal, small black petals flying, the gold tip of a baton slashing a bright streak through the upper corner. Cold light from above, amethyst shadow on the far cheek. Palette: black #0C0C0E, burgundy #8C1D47, antique gold #BAA16A. No text, letters or logos anywhere.
```
