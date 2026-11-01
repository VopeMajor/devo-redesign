# Melissa: ficha de redesign (Persona)

> **Harmonização de 01/11 (noite).** O estilo de desenho desta ficha mudou: sai o cel de duas sombras chapadas com
> contorno grosso; entra anime pintado, sombra suave com um recorte duro de luz (`ELENCO.md` §8, nota no topo). As
> regras de "cel shading" e os prompts abaixo valem pelo conteúdo (silhueta, figurino, pose, cor), não pelo estilo;
> a próxima rodada troca o prefixo. Correções que a crítica da arte (`../arte/ESCOLHAS.md`, nota 4,5) pede para este
> personagem: um rosto só nas três peças: **chanel platinado assimétrico**, mais longo à esquerda de quem olha, rosa azul com fita preta à direita; pele quente; no retrato, uma palma oferecida para cima e a outra mão segurando a pasta preta.

**Quem é:** Melissa, da Companhia de Despertados (`ELENCO_INFO`: "Companhia de Despertados"). É o primeiro rosto que o
jogador vê: recebe o Record na mina do prólogo, pergunta nome, idade, gênero e rosto, explica o Deadly Vote, o Card
Shuffler e a Companhia, entrega as Cartas Iniciais (`lib/devo/prologue-script.ts`). Depois só volta como **holograma**:
apresenta as Corporações (`lib/devo/dialogo/cenas/melissa-corporacoes.ts`, cenário `holograma`) e o Calendário
(`lib/devo/dialogo/cenas/melissa-calendario.ts`). Regra do motor (`DIALOGO.md`): quando o assunto é a Companhia, ela
aparece em chamada holográfica. Voz `pf_dora`, tratamento "natural" (`DUBLAGEM.md`).

**Como ela fala:** cordial e institucional ao mesmo tempo. Acolhe ("É um prazer te conhecer."), apressa ("Precisa se
apressar."), corrige sem levantar a voz ("Record... Que coisa horrível.") e lembra que a Companhia é a lei ("Se existe
algum tipo de lei nesse lugar, essa lei vem da Companhia."). Às vezes solta um entusiasmo de apresentadora ("Bem-vindo
ao Grandioso Calendário Devo!!!").

**Arte atual** (`public/images/npc/melissa/*.webp`, 12 expressões, `manifest.json` com `escala` 1.7513): cabelo
platinado na altura do ombro, repartido de lado com a testa à mostra e mechas soltas; olhos violeta grandes; rosto fino
e jovem. Blazer azul royal listrado de giz com lapelas pretas e ombros bufantes, camisa branca com jabô de babados,
gravata preta, punhos largos de renda branca sobre mangas pretas. **Rosa azul com fita preta** presa no cabelo, do lado esquerdo dela (direita de quem olha), e um corsage de rosas azul e branca com correntinhas de prata no peito. Tudo isso continua; o redesign
tira o degradê branco na cintura, define o corpo e dá peso ao uniforme.


## Revisão do elenco (01/11)

Depois da crítica do elenco (`ELENCO.md`), valem estas mudanças sobre o resto da ficha:

- **Dois estados, uma arte só.** Os prompts geram a Melissa **presencial**, como na mina do prólogo, de carne, sem
  linhas de varredura e sem glitch. O **holograma** das Corporações e do Calendário é a mesma arte com tratamento na
  interface (shader ou CSS: linhas de varredura `#9DB2FF`, deslocamento RGB de 2 px, tremor de projeção).
- **Cobalto é dela:** a palavra "cobalt" só aparece nos prompts dela. O mesmo vale para o forro de ametista com veio
  de mármore.
- **Gesto:** a palma para cima é só dela. Na pose de anúncio, um braço sobe em arco e a outra mão segura a pasta; os
  dois braços abertos saíram porque rimavam com o Corvo.
- **Pasta:** couro preto liso, sem marca nem papel à mostra. Sem fragmentos de papel no cut-in.
- **Luz:** frontal, limpa e suave, com recorte azul-claro.
- **Lados:** rosa e insígnia à direita de quem olha, mecha longa à esquerda (conferido no `confiante.webp`).
- **Cut-in:** diagonal que sobe (aliada), 2048×640.

---

## 1. Conceito

**"A recepcionista do fim do mundo."** Ela é a primeira pessoa que te espera depois da morte, com uma prancheta, um
sorriso e um prazo. Simpática de verdade, mas fala em nome de uma instituição que se compara a uma força militar.
O carinho dela vem com regulamento.

Duas camadas que a arte precisa mostrar:

- **A anfitriã (o sorriso):** cor fria e limpa, gestos de apresentação com a mão aberta, postura de quem recebe.
- **O uniforme (a Companhia):** quando ela corrige ou multa, o sorriso fecha, os ombros se alinham e o azul vira
  insígnia. É a única do elenco que nunca é "ameaçadora"; quando fica séria, fica *oficial*.

Ela também é a única que quase sempre aparece **projetada**. O design precisa funcionar em dois estados: carne e
holograma (o holograma é a mesma figura com tratamento de luz, não outro desenho).

Leitura em uma olhada: **chanel platinado assimétrico + mantelete de ombros bufantes + rosa azul no cabelo.**

## 2. Cor de assinatura e silhueta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| **Assinatura** | Azul Companhia | **`#4A6CF0`** | blazer, faixa do cut-in, aro do medalhão, cartão de Confidente, pétalas, luz do holograma |
| Sombra 1 da assinatura | Azul farda | `#2B43B8` | 1ª sombra do blazer |
| Sombra 2 da assinatura | Azul noturno | `#17206A` | 2ª sombra, listras de giz |
| Luz da assinatura | Azul projeção | `#9DB2FF` | rim light, linhas de varredura do holograma, brilho da rosa |
| Cabelo (local) | Platinado | `#E9E2D3` / sombra `#BDB3A1` / sombra 2 `#8E8473` | |
| Pele (local) | Porcelana | `#F6E2D3` / sombra 1 `#E2BFA9` / sombra 2 `#C29A86` | |
| Olhos | Violeta | `#9A7FD6` / pupila `#4B3784` | ligam a figura à ametista do DEVO |
| Contra-cor | Ametista | `#8A7CC8` | forro do mantelete, rim light do lado oposto |
| Base | Mármore negro | `#0C0C0E` | lapelas, gravata, mangas, saia |
| Branco | Mármore | `#F1F0EE` | camisa, jabô, renda |

Por que este azul: a figura atual já é azul royal, e o azul é o que o jogador associa a ela desde o prólogo. O azul
`#4A6CF0` é mais saturado e mais claro que o "cobalto" de sistema do DEVO (`--dv-cobalt` `#5a4f8f`, ametista fumê),
então não se confunde com estado de interface. Contraste sobre o mármore negro: ~4,4:1 (faixa e texto grande).
Nenhum outro NPC usa azul, e nos prompts a palavra "cobalt" é só dela: Galo é cobre, Javali âmbar, Rato absinto, Coruja verde-biblioteca, Corvo verdete puxado para o ciano, Herdeiro bordô (ELENCO §1). Ela também fica com o forro de ametista com veio de mármore, que deixou de ser o forro de todos.

**Silhueta (teste em sombra chapada):**

- Cabeça: chanel na altura do ombro, **assimétrico**: mais volume e uma mecha comprida do lado direito dela (esquerda de quem olha), o lado
  esquerdo preso atrás da orelha pela rosa. A rosa com a fita que pende forma um "nó" que sobra para fora da cabeça.
- Ombros: **mantelete curto** (capinha até o cotovelo) sobre ombros bufantes. Dá um contorno de sino largo em cima,
  que nenhum outro NPC tem.
- Mãos: **punhos de renda em sino**, largos, que viram duas manchas claras na ponta dos braços. A mão sempre aberta,
  palma para cima, em pose de apresentação. No elenco, a palma para cima é só dela.
- Corpo: cintura marcada pelo cinto do uniforme e saia lápis até o joelho; perna fina. Triângulo em cima, coluna
  embaixo.

## 3. Figurino

Uniforme de oficial da Companhia de Despertados, redesenhado:

- **Blazer** Azul Companhia, curto na cintura, listras de giz finas em azul noturno, lapelas pretas pontudas com
  filete prateado, ombros bufantes. Botões de prata com um olho gravado.
- **Mantelete** preso por uma correntinha na gola: preto por fora, forro ametista com veios de mármore. Abre quando
  ela gesticula, fecha quando ela fica séria. Na borda, bordado de prata com o padrão do mostrador do DEVO (marcas de
  hora). É o que deixa a figura "de uniforme" na sombra.
- **Camisa** branca com **jabô** de três camadas, gravata preta fina por cima do jabô (mantido da arte atual).
- **Mangas** pretas justas que terminam nos punhos de renda branca em sino.
- **Cinto** largo preto com fivela retangular de prata e uma **pasta de dossiês de couro preto liso, sem marca nem
  papel à mostra** (papel e etiqueta viram texto na geração), presa por um mosquetão no lado esquerdo (no prólogo ela tira papéis do bolso; o som de papéis é dela).
- **Saia** lápis preta até o joelho, fenda atrás. Meias finas escuras, botas curtas de salto quadrado com biqueira
  de prata.
- **Acessório ícone: a rosa azul.** Uma só rosa no cabelo, maior e mais esculpida que hoje, com a fita preta comprida.
  No peito, o corsage vira a **insígnia da Companhia**: rosa azul cujo miolo é um **olho** de prata (a nota antiga de
  `BUGS.md` fala do "broche do olho" do uniforme). Três correntinhas pendem dela. No holograma, a rosa é o ponto de
  luz mais forte da figura.
- **Anel** fino de prata no indicador esquerdo, sem pedra. Detalhe, não ícone.

O que sai da arte atual: o degradê branco no corte da cintura, o corsage miúdo que some no blazer, a postura sempre
de frente.

## 4. Três poses (retrato em pose, meio corpo até a coxa)

1. **"Olá, Record."** (pose de apresentação, padrão do cartão de Confidente). Corpo em 3/4, leve inclinação para a
   frente, como quem recebe alguém na porta. Mão direita aberta, palma para cima, estendida para o jogador; mão
   esquerda segurando a pasta de dossiês junto ao quadril. Cabeça inclinada, sorriso de canto (`convite`). Mantelete
   aberto mostrando o forro ametista. Diagonal da pasta (baixo esquerda) até a fita da rosa (alto direita).
2. **"Grandioso Calendário Devo!!!"** (pose de anúncio, Calendário e Casa). O braço direito sobe num arco largo, palma para cima, como quem revela um palco; a mão esquerda
   segura a pasta contra o peito; um pé levantado atrás, mantelete esvoaçando, cabeça para trás em `animado`. (Os dois
   braços abertos rimavam com as asas do Corvo.) Pétalas azuis
   no ar. É a pose para Calendário, eventos e a entrada na Casa.
3. **"Fui eu quem lhe contou."** (pose oficial). De frente, ombros retos, pasta fechada contra o peito com os dois
   braços, queixo baixo e olhar direto. Mantelete fechado. Sem sorriso. Luz de cima, fria, e o azul só na rosa e no
   rim light. É a pose das regras, das Necro-Corporações e do hostil.

## 5. Seis expressões principais

Chaves atuais de `lib/devo/npcs.ts` (padrão `confiante`). As outras seis (`pensativo`, `timido`, `animado`,
`apresenta`, `sorriso`, `triste`) são refeitas no mesmo estilo e continuam valendo.

| Chave | Fala de referência (literal) | Desenho |
|---|---|---|
| `confiante` | "Eu recomendaria que você ficasse bem longe delas se quiser levar uma vida tranquila." | sorriso fechado de canto, uma sobrancelha um pouco erguida, olhar de lado para o jogador, queixo levemente para baixo |
| `convite` | "Olá, Record. Eu estive te esperando." | cabeça inclinada, olhos meio fechados e quentes, boca aberta num sorriso pequeno, mão aberta entrando no quadro |
| `explica` | "Pois bem. Saiba que não somos a única entidade perambulando por aí." | indicador erguido, olhos abertos e atentos, boca no meio de uma palavra, sobrancelhas retas |
| `preocupado` | "Precisa se apressar." | sobrancelhas para cima e juntas, olhos grandes com brilho tremido, mão no peito sobre a insígnia, boca entreaberta |
| `surpreso` | "Record... Que coisa horrível." | olhos arregalados com íris pequenas, ombros subindo, mão cobrindo a boca, mechas do cabelo saltando; linhas de choque |
| `riso` | "Caso contrário... Bem, paciência." | olhos fechados em arco, boca aberta, cabeça jogada de lado, rosa balançando; bochechas coradas em uma faixa chapada |

Regra de cel shading: duas sombras (pele `#E2BFA9` e `#C29A86`; blazer `#2B43B8` e `#17206A`), contorno preto
grosso no exterior e fino no interior, luz frontal limpa e um recorte azul-claro (ELENCO §5). Nada de degradê na
pele. O olho violeta ganha um reflexo azul em forma de losango (o "brilho do sistema").

## 6. Frase de cut-in

> **"Olá, Record. Eu estive te esperando."**

Literal do prólogo (`lib/devo/prologue-script.ts`, primeira fala dela). Alternativa para o cut-in oficial/hostil,
também literal: **"Record... Que coisa horrível."** (`melissa-corporacoes.ts`, resposta das Necro-Corporações).

**Cut-in (1,2 s):** a tela corta em diagonal da esquerda baixa para a direita alta; entra uma faixa Azul Companhia
com textura de mármore negro (as linhas de varredura entram só no estado holograma, por pós-processamento); close dos olhos dela (de
`convite`), cortado da sobrancelha até o nariz, com a mecha platinada atravessando o quadro e a rosa azul no canto;
pétalas azuis cruzam a faixa; a frase entra em capitulares prateadas palavra por palavra.
Saída: no estado holograma, a imagem dá um *glitch* de projeção (deslocamento RGB de 2 px em azul e ametista, feito
por shader ou CSS) e some como uma chamada encerrada; no estado presencial, a faixa só fecha.

## 7. Animações de contexto

Ela quase não existe "em pessoa" depois do prólogo. Na Casa, a regra é a mesma do motor: assunto da Companhia vem
por holograma. A presença física em visita depende da decisão do dono (ver Pendências); as animações abaixo cobrem
os dois casos.

- **Entrada na Casa.** O celular do jogador acende sozinho em cima da mesa (feixe azul, como no texto do dono: "uma
  luz irrompe da tela do meu próprio celular"). O feixe sobe, desenha a silhueta em linhas de varredura de baixo para
  cima, a rosa acende primeiro, depois o resto ganha cor. O retrato grande entra da esquerda em pose 1, com 2° de
  inclinação e um leve tremor de projeção que estabiliza em 300 ms. Som `holograma`. Se vier em pessoa (pendente),
  ela bate à porta duas vezes, entra arrumando a pasta, e o sprite do mapa para no tapete, educada, até ser
  convidada a entrar.
- **Presente.** Abre com `surpreso` por um instante. Amado: `riso`, chuva de pétalas azuis e a faixa da cor
  pulsando duas vezes. Gostado: `sorriso`, guarda na pasta de dossiês com cuidado. Neutro: `confiante`, anota algo
  na prancheta. Odiado: `triste`, devolve com as duas mãos (o gesto de "Não quer mesmo? Tudo bem." ao contrário). No
  holograma, o presente "atravessa" a projeção e ela reage do mesmo jeito; o objeto fica com o jogador. Presentes que
  ela gosta ou odeia: PENDENTE (decisão do dono).
- **Romance.** Nenhuma fala existente dela trata de romance, então nenhuma frase é usada aqui. Só o visual: as linhas
  de varredura somem e a projeção vira carne (cor plena, sem tremor); o mantelete escorrega de um ombro; expressão
  `timido` com o rosto meio virado e a mão arrumando a mecha atrás da orelha, encostando na rosa. Fundo com bokeh
  azul e ametista. Se ela é romanceável: PENDENTE (dono).
- **Hostil.** Pose 3. O azul some da roupa e fica só na rosa e no olho da insígnia, que acendem. Cartão e balão
  ficam em negativo (mármore sobre preto), linhas de varredura grossas e lentas, a fala treme 1 px e o retrato chega
  sem overshoot, parado, oficial. Expressão `preocupado` endurecida ou `triste`. Som de interferência holográfica. É
  o estado da multa das Necro-Corporações ("Uma determinada quantidade de tempo é retirada do seu Shuffler.").

## 8. Na tela de Confidentes (Vínculos)

Segue `SPEC-VISITANTES.md` §5.

- **Cartão da lista (120 px, corte diagonal):** fundo mármore negro com o **emblema da Companhia** (rosa com olho) a
  18% e girado 6°, em vez de carta de tarô (ela não tem Arcano definido; PENDENTE). A pose 1 sai do cartão pela mão
  estendida e pela fita da rosa, que passam da borda. Faixa fina Azul Companhia no corte. Nome "MELISSA" em
  capitular prateada, sob ele "Companhia de Despertados". Progresso em losangos de ametista.
- **Ficha cheia:** pose 1 grande, cortada na coxa, com a insígnia em 2.5D atrás, girando devagar com a inclinação do
  aparelho; linhas de varredura muito leves sobre o fundo (ela é "uma chamada"). O mantelete tem camada própria que
  balança 2° com o giroscópio. Faixa diagonal azul com "Melissa · Companhia de Despertados".
- **Medalhão:** aro de prata com segundo aro Azul Companhia; dentro, o rosto de `convite`. O medalhão tem um brilho
  fino de projeção que corre uma vez a cada 6 s. Com paixão marcada, o aro ganha mármore e deixa rastro azul na
  Constelação.
- **Subida de rank:** cut-in do item 6 com a palavra "Vínculo"; o numeral novo cai como carimbo de documento sobre
  a pasta de dossiês e a rosa abre uma pétala.
- **Hostil:** cartão em negativo, silhueta da pose 3, só a rosa e o olho da insígnia acesos em azul (não rubi).

## Pendências

- Se Melissa é Visitante, se aparece em pessoa ou só por holograma, se aceita morar e se é romanceável: decisão do dono
  (`SPEC-VISITANTES.md`, PENDENTE 2).
- Melissa não tem Essência de Afinidade nem torre (`INVENTARIO.md`). Moeda de afinidade dela: decisão do dono.
- Arcano ligado a ela (para a carta no cartão de Confidente): não existe no texto do dono; fica o emblema da Companhia
  até ele decidir. Sugestões cruzadas com o elenco (ELENCO §10): XX, O Julgamento (o despertar) ou XVII, A Estrela.
- Presentes amados e odiados, ranks e prêmios de vínculo: decisão do dono.
- A multa das Necro-Corporações segue configurável (`narrativa.melissa_corporacoes.multa_min`); o REFINAMENTO-4 do dono
  pede 1h30, o código traz 30 min como padrão.

## Prompts FLUX (revisão de 01/11, finais)

Iguais aos de `PROMPTS.json`. Regras do conjunto em `ELENCO.md` §7 e §8: retrato e corpo em 1024×1536 com
`remover_fundo: true`; cut-in em 2048×640 com `remover_fundo: false`; `neutro.webp` atual como referência quando
houver. Os prompts antigos (fundo carvão, "Persona-inspired", nomes entre aspas, 300 a 450 palavras) foram
substituídos.

**Retrato (meio corpo até a coxa):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Half-body portrait from mid-thigh up, plain flat medium grey background, headroom above the head. A slender young woman in her early twenties leans forward in three-quarter view as if greeting someone at a door, head tilted, warm half-lidded violet eyes, small open smile; her right hand held out palm up toward the viewer, relaxed hand, five fingers clearly separated; her left hand holds a plain unmarked black leather folder at her hip. Platinum blonde asymmetrical bob with visible forehead, longer lock on the viewer's left, the other side tucked behind the ear with a large blue rose and long black ribbon on the viewer's right. Fitted royal cobalt-blue pinstriped blazer with puffed shoulders and black lapels; short black capelet lined in amethyst veined like marble; white ruffled jabot and thin black tie; wide white lace bell cuffs; blue rose corsage with a silver eye on the chest on the viewer's right. Clean soft frontal light, pale blue rim light. Palette: black #0C0C0E, cobalt blue #4A6CF0, amethyst #8A7CC8. No text, letters or logos anywhere.
```

**Corpo inteiro (pose de assinatura):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Full-body character design, head to toe, plain flat medium grey background, no floor, margin around the figure. A slender young woman sweeps her right arm up and out in a wide arc, palm up, as if unveiling a grand stage, relaxed hand, five fingers clearly separated, while her left hand holds a plain black folder against her chest; one foot kicked up behind her, head tilted back, excited open smile, bright violet eyes. Platinum blonde asymmetrical bob, large blue rose with a long black ribbon on the viewer's right. Royal cobalt-blue pinstriped blazer with puffed shoulders; short black capelet lined in marble-veined amethyst, flaring; white ruffled jabot and thin black tie; wide white lace bell cuffs; wide black belt with a square silver buckle; black pencil skirt, dark tights, short square-heeled boots. Silhouette: asymmetrical bob with the rose bow, bell of capelet and puffed shoulders, bright lace cuff at the end of the raised arm, slim column skirt. Clean frontal light, pale blue rim light. Palette: black #0C0C0E, cobalt blue #4A6CF0, amethyst #8A7CC8. No text, letters or logos anywhere.
```

**Cut-in (2048×640):**

```
Bold clean anime lineart, two-tone cel shading, high-contrast graphic poster style. Ultra-wide horizontal cut-in banner on a black field, crossed by one diagonal strip whose upper and lower edges are torn in sharp jagged rips. The strip rises from lower left to upper right. Inside the strip, an extreme close-up of a young woman's face cropped from just above the eyebrows to just below the nose: large warm half-lidded violet eyes with a small blue diamond-shaped highlight, a gentle knowing look, a lock of platinum blonde hair cutting across the frame, porcelain skin with flat cel shadows and thick black contour, the edge of a blue rose with a black ribbon on the viewer's right. Behind the face, saturated cobalt blue tones with black marble texture and blue rose petals flying along the diagonal. Clean frontal light, deep navy shadow on the far cheek. Palette: black #0C0C0E, cobalt blue #4A6CF0, amethyst #8A7CC8. No text, letters or logos anywhere.
```
