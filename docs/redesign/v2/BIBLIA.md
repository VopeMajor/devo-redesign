# DEVO v2 — bíblia visual

Primeira versão em 31/10/2026. Vale para todas as telas do v2 (RPG Maker no navegador, celular primeiro).
Base: o pedido do dono (`PEDIDO-V2-dono.md`), as refs 01–08 e a pesquisa em `REFERENCIAS.md`.
O kit que prova estas regras está em `kit/` (como renderizar no fim do documento).

Tudo aqui é direção de arte e interface. Nenhum número de jogo foi decidido: onde o dono deixou "x" ou "X",
segue pendente (Lendária = X; Paus um e dois níveis acima = x%; níveis de Taças; valores de afinidade,
romance e visita; melhorias da casa; Caos e Ordem).

---

## 1. Identidade: um mundo, dois registros, uma moldura

O DEVO tem duas camadas, e as duas precisam parecer o mesmo jogo:

| Registro | Onde | Cara |
|---|---|---|
| **Mundo** | mapa, rua, casa, Visitantes, diálogo | papel creme, lavanda e rosa, verde de grama; tinta roxo-escura no lugar do preto |
| **Sistema** | celular do jogo, Record, Deadly Vote, faixas de aviso, Mesa | preto do Record com cobalto |

O que costura os dois é a **Moldura Pulso**, a assinatura do DEVO. O jogo inteiro gira em torno do Tempo
no pulso, e a moldura leva isso para todas as caixas:

1. **Borda**: 1 px de arte em tinta (`tinta2`) + 1 px de papel (`papel2`) por dentro. No registro de sistema a
   borda é cobalto (`cob2`) + `rec2`.
2. **Cantos em degrau** de 1 px de arte (nunca arredondados).
3. **Pesponto de pulseira**: tracejado 2/2 px de arte na borda de baixo das caixas grandes (diálogo, folhas,
   Cântico). Botões e faixas não têm pesponto.
4. **Mostrador**: um relógio de 11×11 px de arte cravado no canto de cima à esquerda de toda caixa que fala
   ou conta tempo (diálogo, HUD do Tempo, Pulso). O ponteiro é cobalto.
5. **Avançar** = ponteiro cobalto dentro de um anel de marcas, no canto de baixo à direita.

**Cobalto (`#1647ff`) é a única cor de destaque do jogo**, nos dois registros: cursor, opção escolhida,
marcador de toque no mapa, ponteiro, palavras-chave do sistema no texto (*Record*, *Recuo Paranormal*,
nomes de Virtude). Nenhuma outra cor faz esse papel. Isso é o que impede o mundo pastel de virar
"Stardew com um D1AL-ogue colado".

### Refs do dono: o que é base e o que é tema

| Ref | Papel |
|---|---|
| 01, 02 (bege floral), 05 (lavanda) | **Base do mundo.** Paleta, caixa de diálogo, peso das peças de decoração. |
| 07 (D1AL-ogue), 08 (diário rosa/preto) | **Base do sistema**, só na forma: celular como menu, barras de vínculo, escolhas grandes. O rosa-yami da 08 não vira cor do sistema; o sistema é preto e cobalto. |
| 03 (rua com cerejeiras) | Partículas e clima (pétalas, chuva) e a caixa translúcida de fala curta. A perspectiva isométrica dela **não** é usada no mapa (ver §4). |
| 04 (casa dourada) | Tema **Honra** e forma da casa em corte. |
| 06 (quarto gótico) | Tema **Necro**. |

Temas são trocas de rampa dentro da paleta (ouro para Honra, `nec*` para Necro, preto/vermelho para o
Deadly Vote). A moldura, a fonte e o cobalto não mudam com o tema.

---

## 2. Paleta (44 cores; teto 48)

Prancha: `kit/prancha-paleta.png`. Fonte única dos valores: `kit/src/pix.js` (`P`) e `kit/src/kit.css`.

| Rampa | Cores |
|---|---|
| Tinta (traço e texto) | `#241d2b` `#3d3247` `#5e4f69` |
| Papel | `#fbf3e4` `#f3e4cc` `#e6cfae` `#c9a985` `#9c7b5e` |
| Lavanda | `#ece4f3` `#cdbfe2` `#a493c6` `#7b6aa3` |
| Rosa | `#f7d9de` `#e9aab7` `#c97a8f` `#94506a` |
| Verde | `#dfe8c4` `#b5c98f` `#82a46a` `#587a4e` `#3b5440` |
| Pedra / caminho | `#e3d6cf` `#c9b5ad` `#9a8580` `#6e5c5c` |
| Água | `#bfe0e6` `#7fb5c6` `#4c7f99` |
| **Cobalto (destaque)** | `#c9d3ff` `#6d85ff` **`#1647ff`** `#0b23a0` |
| Ouro (Honra) | `#f6e3a1` `#e2b85c` `#b07f2e` |
| Necro | `#9be3b5` `#6b4e8f` `#2a2138` |
| Alerta | `#e0533f` (Recuo, erro, notificação) `#f2a65a` (pendência) |
| Preto do Record | `#0b0b12` `#1a1a26` `#2b2b3d` |
| Branco | `#ffffff` (só brilho e pétala) |

Regras:
- Sem preto puro no mundo. O contorno é `tinta`/`tinta2`.
- Sem degradê liso em arte pixel. Céu e luz em faixas de cor chapada.
- Cores de raridade (marca-texto do Cântico): Comum `#c9b5ad`, Incomum `#b5c98f`, Rara `#7fb5c6`,
  Ultra-Rara `#c97a8f`, Lendária `#e2b85c`. Nenhuma é cobalto, para não confundir com destaque de sistema.
  Essas cores são do v2; as do site atual (cinzas em `lib/devo/cards.ts`) não valem aqui.

---

## 3. Tipografia

Prancha com o texto do Manual em 16 px reais: `kit/prancha-fontes.png`. Todas OFL, todas com ã õ ç ê testados.

| Uso | Fonte | Tamanho (celular) |
|---|---|---|
| Diálogo, botões, UI | **Pixelify Sans** 500 | 18 px, entrelinha 1,45 (mínimo 16 px em UI secundária) |
| Placas, rótulos, nomes | **Silkscreen** (só caixa alta, textos curtos) | 11–13 px |
| Leitura longa: Manual de Cartas, Cânticos, regras, Casa › receitas | **Literata** 400 | 16 px, entrelinha 1,55, sempre dentro da Moldura Pulso |

Resultado do teste: VT323 é legível mas estreita e fria; Jersey 10 é a reserva se Pixelify cansar
(mais compacta). Micro 5 desenha o travessão errado e foi descartada. Silkscreen em parágrafo cansa:
só rótulo. Parágrafo longo em fonte pixel no celular cansa de verdade; por isso texto literário do dono vai
em Literata com a moldura pixel em volta (como VA-11 Hall-A faz com os textos longos).

Caixa de diálogo: no máximo **4 linhas** por página a 18 px (~32 caracteres por linha). Fala maior
pagina no ponto final mais próximo, nunca no meio de frase.

---

## 4. Perspectiva e grade

**Regra única: o jogador anda sempre em top-down 3/4. Isométrico só para olhar a casa de fora.**

| Vista | Perspectiva | Para quê |
|---|---|---|
| Mapa da cidade, ruas, interiores onde se anda (casa, Salão, Poço, sede) | top-down 3/4 (ref-01) | andar, falar, Visitante, Hostilidade e esconderijo |
| **Casa em corte** e **modo Decorar** | isométrico 2:1 (refs 04–06) | ver os cômodos, trancados, skins; arrumar móveis |

A casa em corte é uma tela à parte, apresentada como diorama (céu atrás, terreno embaixo, folha de
informações). Tocar num cômodo e em "Entrar" leva ao interior top-down. Assim cada perspectiva tem um
motivo e o avatar só precisa de animação completa em uma delas (no diorama ele aparece em miniatura,
parado ou sentado).

Grade:
- Tile do mundo: **16×16 px de arte**. Personagem: **16×32** (chibi 3/4), 4 direções.
- Escala inteira: **×3 no celular** (1 px de arte = 3 px CSS; 390 px ≈ 8 tiles de largura e ~17 de altura),
  **×4 no desktop**. Nada de escala fracionada.
- Iso: losango 2:1, piso de cômodo com meia-largura de 24 px de arte.
- Glifos (apps, Gestos): 16×16 px de arte.
- A UI segue a mesma unidade: bordas de 3 px, cantos em degraus de 3 px no celular.

---

## 5. Celular: orçamento de altura (390×844)

Medidas em px CSS. Prancha com as medidas: `kit/kit-celular-medidas.png`.

| Faixa | Altura | O que mora ali |
|---|---|---|
| 0–44 | 44 | área segura do aparelho real (relógio do sistema). Nada do jogo. |
| 48–92 | 44–48 | HUD: placa do lugar (esq.) e Tempo com mostrador (dir.). |
| meio | livre | cena. Durante diálogo, a câmera desloca para que quem fala fique na metade de cima. |
| caixa de diálogo | 216 (fala) / 168 (com escolhas) | de 594 a 810 com 34 de área segura embaixo. |
| retrato | 250×228 | busto saindo por cima da caixa, à direita, 18 px escondidos atrás dela. |
| escolhas | 3×52 + 8 de vão | empilhadas acima da caixa. Até 4 opções. Alvo de toque ≥ 48. |

Regras do polegar:
- **Avançar**: toque em qualquer ponto da caixa; o ponteiro fica no canto de baixo à direita (~342,780).
- **Andar**: toque no chão; o avatar vai até o ponto (anel cobalto marca o destino). Sem direcional virtual.
- **Celular do jogo**: botão 66×66 no canto de baixo à direita, só no mapa. Some durante diálogo, então
  nunca cobre o retrato.
- Atalhos de VN (Histórico, Auto, Pular) ficam na linha de baixo dentro da caixa; deslizar para cima
  abre o Histórico.
- **Na escolha, o retrato vira medalhão** (84×84) na borda da caixa. É assim que três escolhas, a caixa e o
  vínculo cabem juntos na altura.
- **Barras de afinidade/romance** (ref-08) aparecem só quando um Visitante está presente, numa faixa de 78 px
  abaixo do aviso. Sem número (valores pendentes); romance só acende com "paixão" marcada.
- A barra de tarefas da ref-08 **não entra no celular**. No desktop ela vira a barra de atalhos de teclado.

Desktop (1440×900, `kit/kit-desktop.png`): o celular do jogo fica fixo à esquerda (372 px) e a cena à
direita em ×4, como a ref-07. Atalhos: Tab celular, H ocultar, B histórico, Ctrl pular.

---

## 6. Retrato anime dentro do mundo pixel

Os retratos e CGs são ilustração anime em alta resolução (pedido do dono). Para não parecer colagem:

1. **Traço** puxado para a tinta da paleta (`#3d3247`), nunca preto puro.
2. **Luz chapada**: sombra em 2–3 degraus, sem pintura difusa; no máximo 64 cores por retrato.
3. **Aquecimento** leve para o papel da paleta (8%).
4. **Contorno externo** de 1 px de arte (3 px na tela) em tinta, que é a mesma espessura da Moldura Pulso.
5. O retrato sempre aparece encostado numa moldura pixel (caixa, medalhão, ficha). Nunca solto na tela.
6. No prompt de geração (pipeline `infra/arte`), pedir: *flat cel shading, dark plum line art (#3d3247),
   limited palette, warm cream light, bust, transparent background*.

Script de prova: `kit/src/tratar-retrato.py`. Antes e depois: `kit/prancha-retrato.png` (retrato atual
da Coruja, só como cobaia: os NPCs serão redesenhados).

O teste mostrou um problema: a regra ainda desbota a cor dos olhos (âmbar vira cinza-marrom). Os olhos
e as joias precisam ficar fora da quantização. Isso deve ser resolvido no prompt, desenhando já com luz
chapada, e não no pós-processamento.

---

## 7. Pacotes de licença aberta

Os pacotes são só ponto de partida. Todo tile que entrar no jogo é **repintado na paleta de 44 cores**,
ganha contorno `tinta2` nas peças soltas (árvores, móveis, personagens) e perde o contorno nos tiles de chão.
Sem isso o jogo fica com cara de RTP.

Candidatos (licença a **conferir na página de download antes de usar**; nesta sessão itch.io e
opengameart não abriram):

| Pacote | Autor | Licença declarada | Uso |
|---|---|---|---|
| Tiny Town, Tiny Dungeon, RPG Urban Pack, Pixel UI Pack | Kenney | CC0 | base de chão, rua, interiores; estudo de UI |
| Ninja Adventure | Pixel-boy e AAA | CC0 | estrutura de sprites 16 px em 4 direções |
| 16x16 DungeonTileset II | 0x72 | CC0 | móveis e peças para o tema Necro |
| Fontes Pixelify Sans, Silkscreen, Literata | Google Fonts | OFL 1.1 | tipografia (já testadas) |

Fora: LPC (CC-BY-SA/GPL obriga a compartilhar derivados pela mesma licença); pacotes "free" sem licença
escrita; qualquer pacote que proíba uso comercial. Cada pacote usado entra numa tabela de créditos
(`docs/redesign/v2/CREDITOS.md`, a criar) com autor, licença, link e o que foi aproveitado.

---

## 8. Kit (o que foi desenhado)

| Arquivo | O que prova |
|---|---|
| `kit/kit-celular.png` | 6 telas a 390×844: mapa, diálogo, Visitante com escolha e vínculo, celular do jogo, casa em corte, carta com Rito e Cântico |
| `kit/kit-celular-medidas.png` | as mesmas telas com as medidas de §5 |
| `kit/celular-dialogo@2x.png`, `kit/celular-escolha@2x.png` | diálogo e escolha em 2× para ver o pixel |
| `kit/kit-desktop.png` | 1440×900, celular à esquerda e cena à direita |
| `kit/prancha-fontes.png`, `prancha-paleta.png`, `prancha-retrato.png` | testes de §2, §3 e §6 |

A arte de cena do kit (casas, árvores, bonecos) foi desenhada em código só para testar paleta, escala e
moldura. **Não é arte final.** Os textos que aparecem nas telas são linhas literais do dono ("Sim, Record.
Você precisará lidar com isso.", "[Um Visitante apareceu]", o Cântico de Inúteis) ou marcações de pendência
("[fala do Visitante · roteiro pendente]", "nível x · em discussão", "Taças nível ?"). Os nomes de gestos e
o rótulo "Chalé (exemplo)" são de teste.

Renderizar de novo:
```
cd docs/redesign/v2/kit/src && python3 -m http.server 8765
# outra aba: Playwright (createRequire('/opt/node-tools/node_modules/x.js')('playwright'))
#   celular.html            -> kit-celular.png          (2600×1000, fullPage)
#   celular.html?anot=1     -> kit-celular-medidas.png
#   celular.html?tela=<id>  -> uma tela só (mapa, dialogo, escolha, celular, casa, rito), 390×844
#   desktop.html            -> kit-desktop.png          (1440×900)
```
As fontes vêm do Google Fonts; nada para instalar.

---

## Decisões de revisão (31/10/2026)

Resposta à crítica com nota 3. A crítica estava certa no ponto principal: não existia bíblia nem kit, só
a direção escrita. Agora existem, e o que segue é o que mudou por causa de cada problema apontado.

1. **"Nada visual para criticar"**: criados `BIBLIA.md` e `kit/` com 6 telas de celular a 390×844, uma tela
   de desktop e três pranchas de teste. Todas conferidas abrindo as imagens depois de renderizar.
2. **Ponte entre os dois registros**: definida a Moldura Pulso (borda, cantos em degrau, pesponto,
   mostrador, ponteiro de avançar) e o cobalto como única cor de destaque nos dois registros (§1).
3. **Refs que brigam entre si**: base do mundo = 01/02/05; base do sistema = forma da 07/08 em preto e
   cobalto; 04 = tema Honra, 06 = tema Necro; 03 só fornece clima e partículas (§1).
4. **Top-down e isométrico misturados**: anda-se sempre em top-down 3/4; isométrico só na casa em corte e no
   modo Decorar, como diorama separado (§4, tela 5 do kit). Isso muda a `REFERENCIAS.md` §2.3 e §2.7, que
   propunham isométrico na rua e no cômodo; vale esta bíblia.
5. **Celular primeiro só no papel**: orçamento de altura com números, regras do polegar, retrato que vira
   medalhão na escolha e botão do celular que some no diálogo (§5, `kit-celular-medidas.png`). O teste com
   dedo real em aparelho ainda não foi feito; só Playwright.
6. **Fonte pixel em português**: testadas 6 fontes pixel e 2 de leitura com o Manual em 16 px. Ficam
   Pixelify Sans (diálogo/UI), Silkscreen (rótulo) e Literata (texto longo dentro da moldura) (§3).
7. **Ref-08 no celular**: a barra de tarefas foi cortada no celular; as barras de vínculo só aparecem com
   Visitante presente e têm altura fixa de 78 px (§5).
8. **Unidade pixel x anime**: regra de 6 pontos e um script de prova. O teste expôs uma falha (olhos
   desbotam) que fica anotada como pendente e deve ser resolvida no prompt de geração (§6).
9. **Pacotes CC0 com cara genérica**: paleta fechada de 44 cores, repintura obrigatória, regra de contorno,
   lista de candidatos com licença declarada e o que fica de fora (§7). As licenças precisam ser conferidas
   no download, porque os sites dos pacotes não abriram nesta sessão.
10. **Prancha lado a lado com outros jogos**: **não feita**. Precisa de capturas reais de OMORI, Needy Streamer
    Overload, VA-11 Hall-A e Amor Doce, e esses sites não abrem daqui. Um esquema de memória não seria um
    teste honesto. Fica pendente até o dono mandar as capturas, ou até a rede liberar. A ref-07 (D1AL-ogue) já
    pode ser comparada com `kit-desktop.png`, que segue o mesmo layout.
11. **Pedido "crie um mod para abrir navegador"**: está fora desta etapa do workflow (direção de arte) e
    continua sem ser feito. Precisa ser tratado à parte, com a skill de criação de mods.

Pendências que este kit deixou visíveis:
- As árvores e os bonecos do kit estão abaixo do nível da ref-01. É esperado, porque são desenhos de teste,
  mas a primeira arte real precisa ser medida contra a ref-01 lado a lado.
- No diálogo, o retrato cobre parte da cena à direita. A regra de câmera de §5 resolve isso, mas ainda não
  foi provada em movimento.
- A borda esquerda e a direita da moldura ficam com um degrau desigual onde o recorte encontra a sombra
  interna. Corrigir com 9-slice em imagem quando a moldura for para o código.
