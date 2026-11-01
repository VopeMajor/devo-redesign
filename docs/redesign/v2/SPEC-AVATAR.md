# DEVO v2 — Spec do avatar (criação, aparência, sprite e retrato)

Primeira versão em 01/11/2026. Vale junto com `BIBLIA.md` (direção de arte), `SPEC-CASA.md` (onde a criação
acontece) e `SPEC-TUTORIAL-E-EQUIPE.md` (o que o novato faz depois).

Convenções desta spec (as mesmas das outras specs v2):
- Aspas e blocos `>` só para texto literal do dono.
- **PROPOSTA Ax** = sugestão desta spec, que o dono aprova ou recusa pelo número ("aprovo A2, não aprovo A5").
- **PENDENTE** = decisão que só o dono toma. Número que ele não deu aparece como `X`, nunca como valor final.
- Falas do guia e de NPCs ainda não foram escritas pelo dono: aparecem como `[fala do guia · roteiro pendente]`.

> **Harmonização de 01/11 (noite).** A primeira versão desta spec seguia a bíblia em pixel que o dono reprovou.
> Agora valem o texto do dono, a `BIBLIA.md` atual e o `MOTOR-CASA-TORRES.md` (Casa e Torres em cenário pintado em
> camadas). Mudou: a **ordem de entrada** segue a D-1 da `SPEC-TUTORIAL-E-EQUIPE.md` §2.8 (§2.2 reescrita); a
> **escala** é a do avatar pintado de corpo inteiro (§2.3 reescrita); saíram a paleta de 44 cores, o pacote em pixel e
> o `pixelated` (§5.4, §5.5, §7). Onde o texto ainda disser "sprite", leia "avatar de corpo inteiro no cenário"; "mapa"
> é o cômodo da Casa ou o andar da Torre, porque não existe cidade. A divisão foto × aparência (§0) continua e a
> `SPEC-CASA.md` já foi alinhada a ela.

---

## 0. Duas palavras, duas coisas

O site atual já tem um "avatar": é a **foto** que o jogador envia (`players.avatar`, um data URL de até 180 KB,
com `players.avatar_updated_at`). Ela aparece no Record, no ranking (`rank-retrato.tsx`), no perfil do arcade
(`mini-profile.tsx`, `arcade/server.ts`), no chat do arcade e na leitura de cosméticos (`cosmeticos-server.ts`),
e é ela que recebe a moldura equipada (`player_cosmetics.moldura_avatar` e `moldura_mini`).

O dono chama de "avatar" outra coisa: o personagem montado na criação, que anda no mapa. Para as duas não se
misturarem no código e no banco:

| Nome no código e no banco | O que é | Nome na tela |
|---|---|---|
| `foto` (coluna continua `players.avatar`, sem migração) | imagem enviada pelo jogador | "Foto" |
| `aparencia` (tabela nova `aparencias`, kind `aparencia_parte`) | escolhas da criação: penteado, pele, olhos, cores, roupa, acessório | "Avatar" (palavra do dono) e "Criação do avatar" |

Isso substitui o que a `SPEC-CASA.md` chamou de `casas.avatar`, `avatar_parte` e `avatar.salvar` (ver §9).

---

## 1. Objetivo para o jogador

O dono:

> "e por falar nisso, por agora se tratar de rpg maker, ao entrar nesse sistema de casa, há um tutorial de
> "fantasia" que é então a criação do avatar, com opções de penteado, pele, olhos, cor, roupas, etc. quero
> inspirado em animes."

Para quem joga, a criação precisa:
1. **Ser rápida na primeira vez.** O novato quer chegar ao Devo tutorial. Uma tela, abas por categoria,
   "Aleatório" e "Pronto" sempre à mão. Dá para terminar em menos de um minuto ou ficar o tempo que quiser.
2. **Mostrar o mesmo personagem nos dois tamanhos.** O que ele escolhe no retrato anime aparece no avatar
   de corpo inteiro do cenário, e vice-versa. Nada de opção que só existe num dos dois (`REFERENCIAS.md` §2.2).
3. **Ser dele.** O avatar aparece no mapa, na casa, no diálogo (quando o Record fala) e na ficha do jogador.

Leitura da palavra "fantasia": em português ela também quer dizer roupa de personagem, como a de carnaval. O
dono pôs a palavra entre aspas. Esta spec não decide qual sentido ele quis, mas a apresentação proposta (§3.1)
funciona com os dois: o guia trata a criação como vestir uma fantasia antes de entrar no mundo.

**Duas coisas com nome de "tutorial".** O "tutorial de fantasia" (criação do avatar, na casa) não é o **Devo
tutorial** (o Deadly Vote do tipo Tutorial, `SPEC-TUTORIAL-E-EQUIPE.md` §2.1). Na tela, a criação se chama
"Criação do avatar" e não usa a palavra "tutorial", para o novato não achar que já fez o Devo tutorial.

---

## 2. Regras

### 2.1 Do dono (literais)

- Criação ligada à entrada no sistema de casa: "ao entrar nesse sistema de casa, há um tutorial de "fantasia"
  que é então a criação do avatar".
- Categorias: "penteado, pele, olhos, cor, roupas, etc."
- Estilo: "quero inspirado em animes."
- Novato: "o único devo que aparece para ele é o chamado "tutorial" (...) assim que finalizar um tutorial aí
  ele pode ver todos os outros devos que estão abertos para inscrição e as demais coisas."
- Owner e Anfitrião têm acesso liberado a todas as telas (regra permanente do dono).

### 2.2 Ordem de entrada (fonte: `SPEC-TUTORIAL-E-EQUIPE.md` §2.8, decisão D-1)

A ordem de entrada é decidida num lugar só, a D-1 da spec do tutorial. Aqui fica só o resumo do que toca o avatar:

| Momento | O que o novato vê |
|---|---|
| Prólogo, aula, celular | A identidade gótica do sistema. Ainda não há avatar. O celular mostra só o Devo tutorial. |
| Antes da vitória | O ícone da Casa aparece selado (selo de cera ametista). A Casa inteira está trancada. |
| Vitória no Devo tutorial | Flag `galo_casa`. O ícone da Casa acende na cerimônia de desbloqueio. |
| Primeira entrada na Casa | A porta abre para dentro (passagem da `BIBLIA.md` §2) → **Criação do avatar** → o avatar aparece no Quarto → a cena `galo-casa` entrega as chaves e a casa abre inteira. |

Não há avatar provisório, nem "casa em visita", nem a placa "Vença o Deadly Vote do tutorial…" (texto que não era
do dono). Owner e Anfitrião entram sem a flag e recebem a aparência padrão.

A alternativa continua aberta para o dono (`LEIA-PRIMEIRO.md`): **D-1-A**, a criação como tela do celular (espelho
gótico em 2.5D) logo depois da aula, com a Casa trancada até a vitória do mesmo jeito.

As antigas A1 (criação antes do tutorial, casa "em visita") e A1-b (avatar provisório) saíram na harmonização de
01/11.

### 2.3 Escala e o que aparece em cada tamanho (harmonizada em 01/11)

Base: `MOTOR-CASA-TORRES.md` §1 (cenário pintado em camadas; avatar "em camadas, escala pela profundidade, sombra
no chão, luz de recorte") e a régua de alturas do `npcs/ELENCO.md` §2. O sprite 16×32 em pixel, a escala ×3 e a
grade de tiles vinham da primeira bíblia, que o dono reprovou, e saíram.

- **Avatar pintado de corpo inteiro**, na mesma linguagem dos NPCs (anime pintado, `npcs/ELENCO.md` §8), montado
  com as mesmas camadas do retrato (§5.1).
- **Altura de referência: 1,70 m** na régua do elenco. O Rato bate no peito dele; o Corvo passa uma cabeça.
- **Na tela** (*proposta, ajustar no protótipo do motor*): no celular 390×844, cerca de 300 px CSS de altura no
  plano da frente do cômodo e cerca de 160 px no fundo, com a escala seguindo a linha do chão. Arte-fonte com
  768 px de altura, o que cobre DPR 3 no plano da frente sem perder nitidez.
- **Direções:** 4 (frente, costas, três-quartos para a esquerda e para a direita). Uma das três-quartos pode ser a
  outra espelhada, desde que a peça não seja assimétrica; peça assimétrica pede as duas.
- Nada de escala inteira nem `image-rendering: pixelated`: é pintura e escala suave.

Como o corpo inteiro tem tamanho de sobra, quase tudo o que se escolhe aparece nele:

| Categoria | No avatar de corpo inteiro | No retrato (busto) |
|---|---|---|
| Penteado | sim, completo | sim, camada de trás e da frente |
| Cor do cabelo | sim | sim |
| Pele | sim | sim |
| Formato dos olhos | só de frente e no plano da frente; no fundo vira detalhe pequeno | sim |
| Cor dos olhos | idem | sim |
| Roupa | sim, completa | só o busto |
| Acessório | sim | sim |

O teste de legibilidade (3 penteados, 3 cores de olho e 2 roupas numa captura de 390 px, com o avatar no fundo do
cômodo) continua valendo como **conferência**.

### 2.4 Escolhas sempre de catálogo

- Cor em **amostras**, nunca seletor livre (`REFERENCIAS.md` §2.2). Garante que o retrato e o sprite batam e que
  toda combinação tenha sido conferida.
- Nenhum texto livre na criação. Nenhuma imagem enviada pelo jogador entra no avatar. O nome que aparece é o da
  conta (`players.name`); a criação **não** pede nome novo (**PROPOSTA A2**: evita uma segunda superfície de
  nome para moderar).
- Retrato do avatar **nunca gerado por IA por jogador**. É montado de camadas desenhadas uma vez
  (`REFERENCIAS.md` §2.2). A IA do pipeline pode ajudar a esboçar as camadas, nunca a criar o rosto de alguém.

### 2.5 Quantidade, preço e refazer: PENDENTES

Nada disso foi decidido pelo dono. A spec deixa a estrutura pronta e os valores em aberto:

| Ponto | Valor | Onde fica quando o dono decidir |
|---|---|---|
| Opções de cada categoria na estreia | `X` por categoria (PENDENTE 2). §5.3 mostra quanto cada opção custa em arte. | catálogo `item_defs` (`kind = 'aparencia_parte'`) |
| Existem partes pagas? | PENDENTE 3 | `aparencia_parte.meta.gratis` |
| Preço e moeda das partes pagas, e de onde vêm (Poço, evento, loja, recompensa) | `X` (PENDENTE 3) | `item_defs` + fonte |
| Refazer o avatar depois: grátis ou com custo | `X` (PENDENTE 4) | `devo_config 'aparencia.regras'.refazer_custo` |
| Intervalo mínimo entre trocas | `X` (PENDENTE 4) | `devo_config 'aparencia.regras'.refazer_intervalo` |

Mesmo com custo, **trocar de roupa ou acessório entre partes que o jogador já possui** é sempre de graça e
imediato (**PROPOSTA A3**). Assim o custo de "refazer" só pesa sobre o que muda o rosto e o corpo (penteado,
olhos, pele), e o guarda-roupa continua sendo diversão.

Enquanto PENDENTE 4 estiver aberta, o Espelho deixa refazer de graça e sem intervalo, com o limite técnico do
§7 (anti-flood, não regra de jogo).

### 2.6 Corpo e tratamento: PENDENTES

- **Corpo.** O dono não falou em tipo de corpo. Uma base só, com a roupa definindo a silhueta, é o mais barato.
  Duas bases dobram o custo de toda roupa (§5.3). PENDENTE 5.
- **Tratamento.** Os textos do dono chamam o jogador de "Record" e "você", sem gênero. Mas NPCs em português
  esbarram em adjetivo ("cansado/cansada"). **PROPOSTA A4**: a criação não pergunta gênero; os roteiros do v2
  escrevem as falas dirigidas ao Record sem adjetivo de gênero, como o próprio Manual de Cartas faz. Se o dono
  preferir perguntar, a escolha entra como uma aba a mais (PENDENTE 6).

---

## 3. Fluxo de telas

### 3.1 Celular (primeiro; retrato 390×844)

Medidas em px CSS, alinhadas ao orçamento de altura da `BIBLIA.md` §9.

```
┌──────────────────────────────┐ 0
│ área segura do aparelho      │ 44
├──────────────────────────────┤
│ CRIAÇÃO DO AVATAR (Bodoni)    │ 48–92  título em placa diagonal, pílula do Tempo
├──────────────────────────────┤
│ ┌───────────────┐  ┌──────┐  │
│ │ retrato anime │  │corpo │  │ 96–420 prévia sobre o cômodo desfocado
│ │ busto 250×228 │  │inteiro│ │ avatar pintado girando nas 4 direções;
│ │               │  │ ↻    │  │ tocar no corpo para girar à mão
│ └───────────────┘  └──────┘  │
├──────────────────────────────┤
│ Penteado Pele Olhos Cor Roupa…│ 428–476 abas roláveis (alvo ≥ 48)
├──────────────────────────────┤
│ [■][■][■][■]                  │ 484–700 grade de opções 4 colunas (≥ 72×72)
│ [■][■][■][■]                  │ ou amostras de cor (≥ 48×48)
├──────────────────────────────┤
│ [ Aleatório ]   [  Pronto  ] │ 712–764 rodapé fixo
└──────────────────────────────┘ 810 + 34 área segura
```

1. **Porta.** Primeira entrada na Casa, depois da vitória (D-1): a porta em arco abre para dentro (passagem da
   `BIBLIA.md` §2) e a criação entra, com o cômodo desfocado atrás.
2. **Guia.** Uma caixa de diálogo padrão cobre o rodapé por um momento: `[fala do guia · roteiro pendente]`.
   Quem é o guia depende do redesenho dos NPCs (PENDENTE 7). Tocar fecha a caixa e libera a tela. O guia não
   volta a interromper; reaparece só se o jogador tocar em "?" no título.
3. **Escolher.** Cada toque troca a prévia na hora (retrato e corpo inteiro juntos). Abas na ordem do dono: Penteado,
   Pele, Olhos, Cor, Roupa, depois Acessório. "Cor" abre sub-amostras para cabelo e olhos. Opção paga
   (se PENDENTE 3 criar) mostra um cadeado e o preço `X`; tocar mostra de onde ela vem, sem comprar dali.
4. **Aleatório.** Sorteia só entre partes que o jogador possui ou que são grátis. Um toque longo em
   "Aleatório" trava a aba atual (só sorteia as outras).
5. **Pronto.** Pede confirmação curta só na primeira vez ("Dá para mudar depois no Espelho do Quarto." se
   PENDENTE 4 deixar grátis; senão, o custo `X` aparece aqui). Confirmar → `POST /api/aparencia salvar` →
   transição em íris → o avatar aparece no Quarto, olhando para baixo, com o estado `parado`.
6. **Depois.** A cena `galo-casa` entrega as chaves e a casa abre inteira (`SPEC-TUTORIAL-E-EQUIPE.md` §3.1,
   passo 8; `SPEC-CASA.md`).

**Espelho (reabrir).** No Quarto, andar até o Espelho → o avatar olha para ele (estado `interagindo`) → mesma
tela, com título "Espelho", botão "Cancelar" no lugar de "Aleatório" à esquerda e "Salvar" à direita. Se houver
custo de refazer, o botão mostra o valor e só cobra se penteado, olhos ou pele mudarem (A3). O Espelho também
fica no menu global (☰ › Avatar), porque nada fica preso à casa (`SPEC-CASA.md` 2.2-k).

### 3.2 Desktop (depois)

1440×900, mesmo layout da `BIBLIA.md` §2 (`kit2/desktop.png`): celular fixo à esquerda, cena à direita. Na
criação, a cena vira a prévia: retrato grande à esquerda da cena, corpo inteiro à direita, abas e grade numa coluna
de 420 px encostada no celular. Teclado: setas trocam a opção, Tab troca a aba, R sorteia, Enter confirma.

### 3.3 Onde o avatar aparece depois

| Lugar | Forma |
|---|---|
| Cômodos da Casa e andares das Torres | avatar pintado de corpo inteiro, estados do §4 |
| Vista da Casa (diorama em R3F, `BIBLIA.md` §8) | miniatura parada ou sentada |
| Diálogo, quando o Record fala | retrato do avatar (busto) à esquerda da caixa, espelhado em relação ao NPC, com a moldura mini equipada (`SPEC-COSMETICOS.md`) (**PROPOSTA A5**) |
| Escolhas | o ombro do avatar aparece desfocado no primeiro plano (`BIBLIA.md` §10); o retrato grande é do NPC |
| CG de encontro (romance) | **PENDENTE 8**: a CG mostra o avatar do jogador (exige desenhar cada CG em camadas com todas as partes, custo alto) ou o enquadramento evita o rosto do Record (mãos, costas, ponto de vista), como Amor Doce faz em parte das cenas |
| Ficha do jogador, Record, ranking, arcade, Deadly Vote | ver §3.4 |

### 3.4 Foto, retrato e moldura

A foto continua existindo e continua no mesmo lugar do banco. O que muda é onde cada imagem aparece.

**PROPOSTA A6:**
- **Registro de sistema** (Record, ranking, quadro do Deadly Vote, arcade, chat): mostra a **foto**, se houver,
  porque é ela que liga o jogador à pessoa no grupo do WhatsApp. Sem foto, mostra o **retrato do avatar** (hoje
  mostra iniciais).
- **Registro de mundo** (mapa, casa, diálogo, Vínculos): sempre o avatar.
- No perfil, uma escolha simples "Imagem do perfil: Foto · Avatar", gravada em `aparencias.perfil_usa`.
- A **moldura equipada** (`moldura_avatar`, `moldura_mini`) envolve a imagem que o perfil estiver usando, seja a
  foto ou o retrato do avatar. Nada muda em `player_cosmetics`. As molduras são quadradas; o retrato do avatar é
  recortado num quadro de busto 1:1 com o mesmo enquadramento sempre (topo da cabeça a 8% do alto, queixo a 70%).

PENDENTE 9: o dono aprova A6, ou prefere aposentar a foto no v2 (ela seguiria no site atual).

---

## 4. Estados de animação (avatar no cenário) e de interface

### 4.1 Avatar no cenário

Com o avatar pintado, cada "quadro" abaixo é uma pose desenhada em todas as camadas. As contagens são proposta
e servem para medir o custo de arte (§5.2).

Junta a `SPEC-CASA.md` §4.1 e a `SPEC-TUTORIAL-E-EQUIPE.md` §4.2. "Direções 4" quer dizer baixo, cima, esquerda e
direita; esquerda pode ser direita espelhada (ver §5.2).

| Estado | Quando | Direções | Quadros por direção | Total |
|---|---|---|---|---|
| `parado` | sem ação; respiração de 1 px | 4 | 2 | 8 |
| `andando` | movendo | 4 | 4 | 16 |
| `interagindo` | tocou num objeto (mão estendida) | 4 | 2 | 8 |
| `sentado` | Mesa de Confecção | 1 (cima) | 1 + piscar | 2 |
| `deitado` | Cama | 1 | 1 + Zz | 2 |
| `assustado` | Visitante hostil chegou | 1 (baixo) | 2 | 2 |
| `comemorando` | sucesso na Confecção, carta rara | 1 | 3 | 3 |
| `decepcionado` | falha na Confecção | 1 | 2 | 2 |
| `celular` | novato abre o celular do jogo; qualquer jogador com o celular aberto no mapa | 1 | 2 | 2 |
| `acenando` | inscrição feita; cumprimentar Visitante | 1 | 4 | 4 |
| `mini_iso` | diorama da casa (parado / sentado) | 1 | 1 + 1 | 2 |
| `escondido` | esconderijo | — | 0 (o avatar some) | 0 |
| **Total da folha do corpo** | | | | **51** |

Ficam fora da estreia, até o dono decidir: `gesto` (um por gesto do repertório; só se o treino do rito da
`SPEC-CASA.md` P4 for aprovado) e `segurando_presente` (`REFERENCIAS.md` §1.4; depende da spec de Visitantes).
Cada um soma quadros à folha do corpo e, portanto, a toda roupa (§5.3).

"De costas olhando o horizonte" (abertura) reaproveita `parado` para cima. Nenhum quadro novo.

### 4.2 Retrato do avatar

Um busto, uma pose. **PROPOSTA A7**: 5 expressões (neutra, sorriso, triste, surpresa, irritada) mais um quadro
de piscar. Os NPCs têm 6–12 (`REFERENCIAS.md` §1.2); o avatar tem menos porque fala menos e porque cada
expressão multiplica a camada de olhos de todas as opções. O número final de expressões é PENDENTE 10.

### 4.3 Interface

| Estado | O que aparece |
|---|---|
| `carregando` | porta fechada + "Abrindo a porta…" |
| `sem_aparencia` | novato: vai para a criação. Owner/Anfitrião: recebem a **aparência padrão** e entram direto (podem abrir o Espelho quando quiserem). |
| `criando` / `espelho` | tela do §3.1 |
| `salvando` | botão "Pronto" com o ponteiro cobalto girando; a tela não fecha até o servidor responder |
| `erro_versao` (409 `aparencia_mudou`) | "Seu avatar mudou em outra aba." + recarregar a prévia com a versão nova |
| `erro_posse` (403 `parte_indisponivel`) | a parte volta ao padrão, aviso curto; acontece se uma recompensa foi desfeita (§6) |
| `banco_desatualizado` (503) | o jogo segue com a aparência padrão em todos os lugares, e o Espelho mostra "Em manutenção" |
| `resetado` | aviso único no próximo login: "Seu avatar foi redefinido pela equipe." + motivo, se o Owner escreveu |

---

## 5. Arte

### 5.1 Como o avatar é montado

Camadas, de trás para a frente, iguais no corpo inteiro e no retrato:

`cabelo_tras` → `corpo` (pele) → `roupa` → `olhos` (só retrato) → `boca` (só retrato, fixa por expressão) →
`cabelo_frente` → `acessorio`

- Cada camada é desenhada **em índices de cor** (tons de cinza numerados), e a cor vem de uma rampa aplicada no
  cliente (canvas, troca de paleta). Assim uma cor nova de cabelo custa zero desenho.
- No sprite, a cabeça (cabelo, acessório de cabeça) é desenhada por **vista** e posicionada por uma tabela de
  âncora por quadro (o quanto a cabeça sobe ou desce em cada quadro). O corpo e a roupa são desenhados quadro a
  quadro, porque deformam.
- O cliente compõe o retrato uma vez por mudança e guarda o resultado em memória; não há imagem por jogador no
  servidor.

### 5.2 Custo de uma opção (orçamento de arte)

"Peça" = um desenho que alguém precisa fazer ou limpar. As contas usam o §4.

| Categoria | Retrato | Sprite | Peças por opção |
|---|---|---|---|
| Penteado | 2 (trás, frente) | 6 vistas (baixo, cima, lado, lado espelhado conferido, deitado, mini iso); 5 se o penteado for simétrico | **7–8** |
| Formato dos olhos | 5 expressões + 1 piscar | 0 | **6** |
| Pele (tom) | 0 (rampa) | 0 (rampa) | **0** + conferência |
| Cor de cabelo ou de olhos | 0 (rampa) | 0 (rampa) | **0** + conferência |
| Roupa (conjunto) | 1 (busto) | 51 quadros | **52** |
| Acessório de cabeça | 1 | 6 vistas | **7** |
| Acessório de corpo | 1 | 51 quadros | **52** |
| Sobrancelha ou boca, se virarem categoria | 5 | 0 | **5** |

Custo fixo, pago uma vez: corpo base (51 quadros), base do retrato (1), bocas por expressão (5), tabela de
âncoras. Em torno de **57 peças**, mais 51 se A1-b (avatar provisório) for escolhida, mais 51 por corpo extra se
PENDENTE 5 pedir duas bases (e aí toda roupa passa a custar 103).

"Conferência" quer dizer: cada rampa nova precisa ser vista sobre todos os penteados e todas as roupas, no sprite
e no retrato. Não é desenho, mas é trabalho. Rampa nova só entra com captura de conferência anexada.

**Onde o dinheiro vai.** A roupa custa sete vezes um penteado. A forma barata de dar muita variedade é a do
Stardew: poucas roupas, muitos penteados, cores em amostras.

### 5.3 Cenários para o dono escolher a quantidade (PENDENTE 2)

Os números de opções abaixo **não são decisão**: mostram o tamanho do trabalho em dois cenários. O dono escolhe
um, mistura ou dá os próprios números (`X`).

| | Enxuto | Amplo |
|---|---|---|
| Penteados | 6 → 48 | 15 → 120 |
| Formatos de olho | 4 → 24 | 8 → 48 |
| Roupas | 3 → 156 | 8 → 416 |
| Acessórios de cabeça | 2 → 14 | 6 → 42 |
| Tons de pele, cores de cabelo e de olhos | rampas, 0 desenho | rampas, 0 desenho |
| Fixo | 57 | 57 |
| **Total de peças** | **≈ 299** | **≈ 683** |

Tempo por peça: `X` (depende de quem desenha e de quanto da limpeza o pipeline aguenta). Partes novas depois da
estreia (prêmios do Poço, eventos) entram uma a uma com o custo da tabela §5.2. **PROPOSTA A8**: a estreia sai no
cenário enxuto e cresce depois; é melhor ter 6 penteados que batem em todos os lugares do que 15 que falham na
CG ou no diorama.

### 5.4 Coerência entre retrato e corpo inteiro

1. **Paleta.** O teto de 44/48 cores era da bíblia em pixel e saiu. As rampas de personagem (pele, cabelo, olhos)
   ficam numa tabela à parte, `aparencia.rampas`, com 3 tons e uma luz, iguais no retrato e no corpo inteiro.
   **PROPOSTA A9 (revista):** a tabela cobre de pele muito clara a muito escura desde a estreia.
2. **Retrato.** Mesmo estilo dos NPCs (`npcs/ELENCO.md` §8: anime pintado, sombra suave e um recorte duro de
   luz). A recoloração por camada funciona porque cada camada é pintada em tons de cinza e colorida por mapa de
   gradiente; a luz suave fica numa camada separada, que não recebe cor.
3. **Olhos.** A camada `olhos` tem rampa própria de 4 tons.
4. **Mesma opção, mesmo nome.** Cada `aparencia_parte` aponta para as duas artes (`meta.camadas.retrato` e
   `meta.camadas.sprite`). Uma parte sem as duas não entra no catálogo; o servidor recusa.
5. **Prévia lado a lado.** Na criação, retrato e corpo inteiro estão sempre na mesma tela (§3.1).

### 5.5 De onde vem a arte

- **Corpo inteiro:** pintado no pipeline `infra/arte` sobre um gabarito fixo de corpo (a mesma pose-base em cada
  direção) e separado em camadas à mão, como o retrato. Caminhada em 6 a 8 poses por direção (o protótipo do motor
  anda com 8). Pacote CC0 em pixel não entra mais.
- **Retrato:** IA do pipeline `infra/arte` (`flux-2-klein-9b`) para esboço de cada opção sobre um modelo fixo de
  busto, com o prefixo de estilo do `npcs/ELENCO.md` §8; depois limpeza à mão para separar em camadas e encaixar no gabarito.
  O modelo não entrega camadas alinhadas sozinho. Esse passo de limpeza é o gargalo, e é por isso que o §5.3
  conta peças.
- Cada parte registra licença e autor em `item_defs.meta` (como a decoração da `SPEC-CASA.md` §5.1) e entra em
  `docs/redesign/v2/CREDITOS.md`.

---

## 6. Dados e APIs

### 6.1 Banco

Migração `scripts/aparencia-migration.sql`, seguindo a rotina do repositório (entra em `capturas.yml`,
`scripts/dev/local-db.mjs`, `scripts/dev/gerar-banco-novo.sh`; o dono roda o `devo-banco-novo.sql`).

```sql
-- depende de scripts/v2-item-kinds-migration.sql (tabela item_kinds, ver SPEC-CASA.md §5.1)
INSERT INTO item_kinds (kind, origem) VALUES ('aparencia_parte','aparencia-v2')
ON CONFLICT (kind) DO NOTHING;

-- aparencia_parte.meta:
-- {"slot":"cabelo|olhos|roupa|acessorio_cabeca|acessorio_corpo",
--  "camadas":{"retrato":{"tras":"...","frente":"...","expr":{...}}, "sprite":"aparencia/<id>"},
--  "simetrico":true, "gratis":null, "padrao":false, "licenca":"CC0|propria", "autor":"..."}
-- gratis = null enquanto a PENDENTE 3 estiver aberta (o servidor trata null como grátis)

CREATE TABLE IF NOT EXISTS aparencias (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  escolhas jsonb NOT NULL,              -- {cabelo, olhos, roupa, acessorio_cabeca, rampa_pele, rampa_cabelo, rampa_olhos}
  perfil_usa text NOT NULL DEFAULT 'foto' CHECK (perfil_usa IN ('foto','aparencia')),  -- A6
  versao integer NOT NULL DEFAULT 1,
  trocas_rosto integer NOT NULL DEFAULT 0,  -- quantas vezes penteado/olhos/pele mudaram (para PENDENTE 4)
  ultima_troca_rosto timestamptz,
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);

-- Histórico (moderação e desfazer)
CREATE TABLE IF NOT EXISTS aparencia_log (
  id bigserial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  antes jsonb, depois jsonb NOT NULL,
  por uuid REFERENCES players(id),       -- null = o próprio jogador
  motivo text, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aparencia_log_player ON aparencia_log (player_id, criado_em DESC);
```

`devo_config`:

| Chave | Valor inicial |
|---|---|
| `aparencia.regras` | `{refazer_custo:null, refazer_moeda:null, refazer_intervalo:null}` (PENDENTE 4) |
| `aparencia.rampas` | `{pele:[...], cabelo:[...], olhos:[...]}` (A9; cada item com id, tons do sprite e do retrato) |
| `aparencia.padrao` | escolhas da aparência padrão (staff sem aparência, banco desatualizado, parte perdida) |

### 6.2 `/api/aparencia`

Mesmo padrão das rotas atuais: `{action}` no POST, 401/403/409/503 iguais, 503 `{code:'banco_desatualizado'}`
para PG 42703/42P01/42883.

`GET /api/aparencia` → `{aparencia: Escolhas | null, versao, perfil_usa, catalogo: Parte[], possui: string[],
rampas, regras: {refazer_custo, refazer_intervalo, provisorio: true}}`.

`GET /api/aparencia?players=<id,id,...>` → só as escolhas (para desenhar outros jogadores onde isso existir:
quadro do Deadly Vote, arcade, visita de casa se ligada). Até 50 ids. Nada além das escolhas e da versão.

| Ação | Corpo | Regras |
|---|---|---|
| `salvar` | `{escolhas, versao?, idem}` | toda parte precisa estar em `possui` ou ser grátis/padrão; rampa precisa existir em `aparencia.rampas`; sem `versao` só na primeira vez (cria a linha); `versao` diferente → 409 `aparencia_mudou`; se penteado/olhos/pele mudaram, aplica `refazer_custo`/`refazer_intervalo` quando definidos (A3); grava `aparencia_log` |
| `perfil` | `{perfil_usa}` | só `foto` ou `aparencia` |

Owner e Anfitrião (staff, registra no `admin_log`):

| Ação | Corpo | Regras |
|---|---|---|
| `resetar` | `{player, motivo}` | Owner e Anfitrião. Põe a aparência padrão, guarda o estado anterior no `aparencia_log` e no `admin_log`, marca o aviso `resetado`. Não tira nenhuma parte do inventário. Não cobra nada do jogador. |
| `desfazer` | `{aparencia_log_id, motivo}` | só Owner. Devolve o estado anterior de um `resetar` (ou de uma troca do jogador, para suporte). |
| `ver` | `{player}` | Owner e Anfitrião leem a aparência e o histórico de qualquer jogador. |

### 6.3 Peças que somem

Se uma parte sai do inventário (recompensa desfeita pelo Owner, `SPEC-TUTORIAL-E-EQUIPE.md` R1–R4), a aparência
guardada continua com o id dela até o próximo GET; o GET troca a parte perdida pela padrão daquele slot, grava no
`aparencia_log` (`motivo = 'parte_removida'`) e o cliente mostra `erro_posse` uma vez.

---

## 7. Riscos, abuso e moderação

**Moderação**
1. **O que outros jogadores veem.** Só escolhas de catálogo e amostras. Não há texto livre nem imagem enviada no
   avatar, então o avatar não cria superfície nova de conteúdo ofensivo. A superfície que já existe é a foto, com a
   moderação atual.
2. **Combinações que imitam alguém.** Com catálogo fechado, duas pessoas podem montar avatares iguais. Isso é
   aceito: o que identifica o jogador é o nome da conta e, no sistema, a foto (A6). O avatar nunca é usado como
   prova de identidade.
3. **Trocar a aparência para fugir de identificação num Deadly Vote.** **PROPOSTA A10**: enquanto o jogador está
   num Deadly Vote em andamento, o quadro do caso mostra a aparência **congelada no momento da inscrição**
   (cópia das escolhas em `deadly_vote_entries`, coluna `aparencia_snapshot jsonb`, a definir com a spec do
   Deadly Vote). Ele pode trocar no Espelho, mas a troca só aparece no caso depois do resultado. Nome da conta e
   foto não mudam por causa do avatar.
4. **Reset pela equipe.** Owner e Anfitrião podem `resetar` (§6.2), sempre com motivo e registro; só o Owner
   desfaz. Pensado para combinação usada para assediar alguém (por exemplo, copiar o avatar de outro jogador
   para se passar por ele) e para suporte.
5. **Staff olhando histórico.** Somente leitura, registrada no `admin_log`.

**Abuso de sistema**
6. **Refazer em loop para escapar de custo.** O custo (se houver) é cobrado no servidor, na mesma transação que
   grava a troca, com `idem`. A3 separa o que é grátis (roupa e acessório que o jogador possui) do que conta como
   refazer.
7. **Inundar o servidor com saves.** Limite técnico de 10 `salvar` por minuto por jogador (anti-flood, não é
   regra de jogo; pode mudar sem o dono). A prévia é toda no cliente; só "Pronto"/"Salvar" chama o servidor.
8. **Parte paga liberada sem pagar.** O servidor confere posse em toda gravação; o cliente nunca decide o que o
   jogador possui.

**Técnicos**
9. **Desempenho.** Composição de camadas num canvas fora da tela, uma vez por mudança, em escala suave (sem
   `pixelated`). A tela de criação carrega só as miniaturas da aba aberta.
10. **Mistura de estilos.** Já tratada no §5.4. O risco que sobra é a CG de encontro (PENDENTE 8).
11. **Custo de arte crescer sem ninguém ver.** Toda proposta de estado novo do sprite (gesto, presente, poses de
    evento) precisa dizer quantos quadros soma à folha do corpo, porque cada quadro novo multiplica por todas as
    roupas (§5.2).

---

## 8. Pendências que só o dono decide

1. **Ordem de entrada**: D-1 (criação na primeira entrada da Casa, depois da vitória) ou D-1-A (espelho 2.5D no
   celular, antes do tutorial). Fonte única: `SPEC-TUTORIAL-E-EQUIPE.md` §2.8.
2. **Quantas opções por categoria na estreia**: `X` (ver os cenários do §5.3).
3. **Partes pagas**: existem? Quais, por quanto (`X`), em que moeda e de onde vêm.
4. **Refazer o avatar**: grátis ou com custo (`X`); intervalo mínimo entre trocas (`X`).
5. **Corpo**: uma base só ou mais de uma.
6. **Tratamento**: perguntar gênero na criação ou escrever as falas sem gênero (A4).
7. **Guia da criação**: qual NPC conduz e o que ele diz (roteiro do dono).
8. **CG de encontro**: o avatar aparece nas CGs ou o enquadramento evita o rosto do Record.
9. **Foto**: aprovar A6 (foto no sistema, avatar no mundo, escolha no perfil) ou aposentar a foto no v2.
10. **Expressões do retrato do avatar**: aprovar as 5 da A7 ou outro número.

Propostas desta spec: A1 (ordem; substituída pela D-1), A2 (sem nome novo), A3 (roupa trocada de graça), A4 (falas sem gênero),
A5 (retrato do Record à esquerda no diálogo), A6 (foto e retrato), A7 (5 expressões), A8 (estreia enxuta),
A9 (rampas de personagem fora do teto da paleta), A10 (aparência congelada no Deadly Vote).

---

## 9. O que outras specs precisam ajustar

| Documento | Ajuste |
|---|---|
| `SPEC-CASA.md` §5.1 | sai `casas.avatar`; a aparência mora em `aparencias`. Sai o kind `avatar_parte`; entra `aparencia_parte`. |
| `SPEC-CASA.md` §5.2 | sai `avatar.salvar` de `/api/casa`; passa a ser `salvar` em `/api/aparencia`. O objeto do mapa `abre: 'avatar'` passa a `'aparencia'`. |
| `SPEC-CASA.md` P12, 3.1 e 7-Técnicos 4 | escala de 32 px (e a de 16×32) substituída pelo avatar pintado de corpo inteiro (§2.3). O teste de 3 penteados vira conferência. |
| `SPEC-CASA.md` P14 e PENDENTE 17/19 | P14 e PENDENTE 19 apontam para a D-1 (`SPEC-TUTORIAL-E-EQUIPE.md` §2.8); PENDENTE 17 aponta para as PENDENTES 2–4 daqui. |
| `REFERENCIAS.md` §1.4 | a grade 32×48/48×64 ×2 não vale; vale o §2.3. |
| `BIBLIA.md` | nada a registrar: a bíblia atual não tem teto de cores. |
| Spec do Deadly Vote (a escrever) | coluna `aparencia_snapshot` em `deadly_vote_entries` (A10). |

Aplicado na harmonização de 01/11 (noite): `SPEC-CASA.md` e `REFERENCIAS.md` ganharam nota no topo com estas trocas.

---

## 10. Decisões de revisão (01/11/2026)

A crítica deu nota 0 porque o arquivo não existia quando ela rodou. Esta versão foi escrita a partir dos
problemas e sugestões que ela já tinha levantado olhando as outras specs. Ponto a ponto:

Aceitas:
1. **Escala** (*superado na harmonização de 01/11: vale o §2.3*): adotada a da primeira `BIBLIA.md` (16×32, ×3 no celular); `REFERENCIAS.md` §1.4 e `SPEC-CASA.md` P12 ficam
   substituídas (§2.3, §9). Junto, uma tabela do que cada categoria mostra no sprite e no retrato, já que o
   sprite pequeno não comporta detalhe de rosto.
2. **Nome**: as escolhas do personagem se chamam `aparencia` no código e no banco; a foto continua em
   `players.avatar` e se chama "Foto" na tela (§0). Decidido o que a foto vira e qual imagem recebe a moldura,
   como proposta (A6, §3.4).
3. **Ordem de entrada** (*superado: vale a D-1*): fechada como PROPOSTA A1, com a exceção explícita (a primeira abertura da porta é a
   criação; a casa fica em visita até a vitória) e a alternativa A1-b com o custo dela (§2.2).
4. **Pendências sem número inventado**: quantidade de opções, partes pagas e preço, custo e intervalo de refazer
   ficam como `X` (§2.5, §8). Os campos no banco começam em `null`.
5. **Orçamento de arte**: custo por opção em peças, com a folha do corpo de 51 quadros contada estado por estado,
   e dois cenários para o dono escolher, sem que os números dos cenários virem decisão (§4.1, §5.2, §5.3).
6. **Abuso e moderação**: nome e aparência vistos por outros, troca de aparência durante um Deadly Vote (A10), e
   reset por Owner e Anfitrião com desfazer pelo Owner (§6.2, §7).

Onde fui por outro caminho:
- **"Dar outro nome às escolhas, por exemplo personagem/aparência."** Mudei o nome no código e no banco, mas não
  na tela. O dono chama o personagem de "avatar", e texto do dono entra literal; quem muda de nome na tela é a
  foto ("Foto").
- **"Adotar a escala da bíblia e corrigir a REFERENCIAS."** Adotei a escala, mas não editei a `REFERENCIAS.md`
  nem a `SPEC-CASA.md`: a etapa atribuída era esta spec. O que precisa mudar nelas está listado no §9 para quem
  for revisá-las.
- **"Mínimo viável na estreia, como o Stardew."** Em vez de fixar um mínimo, dei dois cenários com o custo de
  cada um e uma proposta (A8) de começar pelo enxuto. Um mínimo fixado aqui seria uma quantidade decidida por
  mim, e isso é PENDENTE 2.
- **Paleta.** A crítica não tocou nisso, mas o orçamento expôs um problema: a paleta de 44 cores do mundo não tem
  tons de pele escura. Propus a exceção A9 em vez de aceitar uma criação de avatar só com peles claras.

Fora desta etapa:
- **Pedido repassado "então crie um mod para abrir navegador".** Não tem relação com esta spec e não foi feito
  aqui. É um pedido de outro tipo (mod da interface do Claude) e precisa ser tratado à parte; o orquestrador deve
  confirmar com o dono se ele substitui ou se soma ao trabalho do v2.
