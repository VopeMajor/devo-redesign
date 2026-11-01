# DEVO v2 — bíblia visual

Versão de 01/11/2026. Substitui a primeira bíblia (31/10), que era em pixel e foi reprovada pelo dono junto com o
kit dela ("não gostei. o devo em geral deve ter a vibe antiga, não em pixel. mas a casa e torres rpg maker/visual
novel. além disso tudo parece muito simples, aprimore as artes e enquadramento"). O kit antigo continua em `kit/`
só como histórico e não serve de base visual. O kit que prova esta bíblia está em `kit2/` (fim do documento). Esta é a **revisão de 01/11 (noite)**, feita sobre a crítica do primeiro kit2 (nota 5,5); as mudanças estão em §15.

Pedidos do dono que esta versão atende, em ordem:
1. A vibe do DEVO fica (gótico, ametista, mármore, o relógio, o Record), sem pixel fora da Casa e das Torres.
2. "os npcs também tem que passar pelo redesign. pegue como referencia o persona"
3. "a vibe anterior, mas não um reaproveitamento ok? isso é um redesgn afinal. algumas referências (mas não se
   prenda a elas.) pode inserir elementos 2.5/3D em algumas telas. também refaça os cosméticos. quero tudo Melhor e
   mais bonito"

Nenhum número de jogo foi decidido aqui. Onde o dono deixou "x" ou "X", continua pendente: Lendária = X; Paus um e
dois níveis acima = x%; níveis de Taças; valores de afinidade, romance e visita; custos das Torres; melhorias da
Casa; Caos e Ordem; nomes dos Gestos; Cânticos das Coleções; frase oficial de cada cut-in.

**Ordem de autoridade (harmonização de 01/11, noite).** Quando dois documentos do v2 discordam, vale nesta ordem:
(1) o texto do dono em `PEDIDO-V2-dono.md`, com as correções do topo; (2) esta bíblia; (3) a spec dona do assunto:
`SPEC-TUTORIAL-E-EQUIPE.md` §2.8 para a ordem de entrada e a trava da Casa, `MOTOR-CASA-TORRES.md` para a técnica
da Casa e das Torres, `SPEC-AVATAR.md` para o avatar e a foto, `SPEC-VISITANTES.md` para Vínculos e visitas,
`SPEC-COSMETICOS.md` (rodada 2) para cosméticos, `npcs/ELENCO.md` para os NPCs, `SPEC-RITOS.md` para cartas e rito,
`SPEC-ORDEM.md` para doação e Caos e Ordem; (4) `REFERENCIAS.md` e `INVENTARIO.md`, que são levantamento. O resumo
para o dono, com a lista única de decisões, está em `LEIA-PRIMEIRO.md`.

---

## 1. O que muda e o que fica

| Fica (é a identidade) | Muda (é o redesign) |
|---|---|
| Mármore negro e porcelana como base, aço champanhe no metal, ametista em pontos, rubi só para alerta | Nenhuma tela, moldura ou composição atual é copiada. As imagens atuais servem de placeholder e de referência de cor |
| O Tempo no pulso como relógio-herói, sempre visível | O relógio vira objeto 2.5D com profundidade, não um número numa caixa |
| O Record, o Deadly Vote, o sigilo de 4 pontas e o losango | Interface que se move com o personagem (Persona), tipografia em diagonal, cortes |
| Arte pintada (Arcanos, cartas, Casa, Torres, Poço, NPCs) | Enquadramento de jogo: camadas, retrato que sai da moldura, luz e partícula, composição em diagonal |
| Cobalto como tinta do Record e da Companhia | Cobalto deixa de ser cor de interface genérica (ver §3) |

**Regra de ouro:** cada tela tem um objeto-herói com volume (relógio, carta, escada, retrato) e uma diagonal que
organiza o resto. Se uma tela pode ser descrita como "lista de cartões sobre fundo escuro", ela ainda não está pronta.

**Regra de prata (revisão):** a pintura carrega a tela e a interface vem por cima. Tela sem pintura ou sem peça 3D de
verdade (Three.js) não passa. Arte reaproveitada só entra como placeholder declarado em §14.

---

## 2. Duas camadas e a passagem entre elas

| Camada | Telas | Linguagem |
|---|---|---|
| **Sistema** (o celular do DEVO) | Home, Record, Deadly Vote, Poço, Mesa, Salão das Máscaras, Companhias, Arcanos, Cartas, Vínculos, Inventário, Cosméticos | Gótico ametista elevado: mármore, metal, vidro, profundidade em 2.5D, menus Persona |
| **Mundo** (RPG Maker / visual novel) | Casa e Torres, só elas | Cenário pintado em camadas onde o avatar anda, objetos que se tocam, VN com retrato grande, escolhas, visitantes |

As duas camadas usam o mesmo material de interface (moldura relicário, placa diagonal, pílula do Tempo). O que muda
é o que está atrás: no Sistema, objetos e cenas montados para a interface; no Mundo, um lugar com chão.

**A passagem:**
- **Sistema → Mundo:** o botão da Casa é a peça central da doca, uma porta em arco gótico com luz quente
  vazando (`home.png`). Ao tocar, a porta cresce até ocupar a tela, abre para dentro e a câmera atravessa; a luz
  quente vira a luz do cômodo. 600–800 ms, sem cortina.
- **Mundo → Sistema:** no Mundo o celular é um objeto (botão no canto, tecla Tab no desktop). Ele sobe do rodapé
  com leve inclinação 3D e a cena atrás desfoca e escurece, mas não some: o jogador não sai do lugar.
- **Desktop:** o celular fica fixo à esquerda e o Mundo à direita (`desktop.png`). O celular é o Sistema inteiro,
  vivo, enquanto a cena continua.
- **Torres:** o mapa das Torres é Sistema (ilha flutuante em 2.5D); tocar numa torre usa a mesma passagem da porta,
  com o portão da torre no lugar da porta da Casa.

---

## 3. Cor

Tokens em `kit2/src/kit2.css`. Valores do código atual (`IDENTIDADE.md` §0) foram mantidos onde já estavam certos.

| Papel | Tokens | Uso |
|---|---|---|
| Mármore negro | `--ink #0a090d` `--ink-2` `--ink-3` `--ink-4` + textura `os/marmore-negro.webp` | Fundo e painéis. Sempre com textura ou luz, nunca chapado |
| Porcelana / mármore branco | `--porcelana #f2efe9` `--papel` + `os/marmore-branco.webp` | Lajes de contraste (Confidentes), papel do Cântico, canhoto de convocação |
| Aço champanhe | `--champ #c9bda6` `--champ-hi` `--champ-lo` `--champ-grad` | Filetes, numerais, aro do relógio, botão primário (metal claro com texto preto) |
| Ametista | `--ame #8a7cc8` `--ame-hi` `--ame-deep` `--ame-glow` | Joia, foco, seleção, "próximo", halo. Em faixa diagonal larga, só atrás do Tempo |
| Cobalto | `--cob #4a62e8` `--cob-hi` `--cob-deep` | Tinta do Record e da Companhia (Melissa), dados e carimbos. Nunca em botão comum |
| Rubi | `--rubi #a3121f` `--rubi-hi` | Só alerta, aviso, eliminação e o selo do Deadly Vote |
| Paixão | `--paixao #c9668f` `--paixao-hi` | Só no Vínculo: botão Paixão e barra de Romance |
| Noite | céu `torres/ceu-noite.webp`, `--ame-noite` | Atmosfera: dentro do mostrador, vitrais, oculto das Torres |

**Persona sem o vermelho do P5.** O que vem de Persona é o contraste, o corte e o movimento. O vermelho dá lugar a
três coisas: a cor de assinatura do NPC em cena (só quando ele está em cena), a ametista para o sistema e o
porcelana/preto para o contraste duro (a laje branca da tela de Confidentes faz o papel do vermelho do P5).

**Assinaturas do elenco** (de `npcs/ELENCO.md` §1, ainda PENDENTE DO DONO): Galo `#c9542a`, Javali `#e0ac1c`,
Rato `#a8c82e`, Coruja `#2f7a55`, Corvo `#3a9fb0`, Melissa `#4a6cf0`, Herdeiro `#8c1d47`. A assinatura aparece na
placa do nome, no fundo atrás do retrato, no fio do cartão de Confidente e no cut-in. Fora disso, não.

**Raridade** (proposta; as cores do site atual não valem aqui): Comum `#a8a39a` (pedra), Incomum `#7fa38f` (jade
fosco), Rara `#7f9fe0` (safira), Ultra-Rara `#b98bd6` (orquídea), Lendária `#d9b86a` (ouro velho). Ouro só aparece
como raridade Lendária. Arcano (raridade de cosmético) é iridescente: champanhe com reflexo ametista e safira.
Vale para o jogo inteiro (cartas, marca-texto do Cântico, Poço, inventário e cosméticos), se o dono aprovar. Cada
catálogo mantém os próprios nomes: cartas em Comum, Incomum, Rara, Ultra-Rara, Lendária, Única e Promocional;
cosméticos em Comum, Incomum, Raro, Épico, Lendário e Arcano (Épico usa a orquídea da Ultra-Rara). Única e
Promocional seguem por enquanto as cores da `SPEC-RITOS.md` §3.5. O marca-texto conserva a borda e o selo de letra
de cada raridade, para nunca depender só da cor; o contraste precisa ser medido de novo com estas cores.

---

## 4. Tipografia

Todas do Google Fonts (OFL), testadas com ã õ ç ê no kit2.

| Papel | Fonte | Uso |
|---|---|---|
| **Marca e impacto** | Bodoni Moda 900 itálico | Nome do NPC, título de tela, nome da carta, "Deadly Vote", cut-in. Alto contraste de traço = luxo gótico. É a voz Persona do DEVO |
| **Cartão de chamada** | Bodoni Moda + Cinzel em ladrilhos (`.recorte`) | Letras recortadas alternando preto, porcelana e ametista, cada uma com um giro. Só em cut-in e cartão de chamada |
| Título suave | Cormorant Garamond 600 itálico | Nome de lugar, nomes na lista, valores de placa |
| Rótulo | Cinzel 600–700, caixa alta, 0.14–0.3em | Abas, botões, numerais romanos |
| Corpo e diálogo | EB Garamond 400, 15–23 px | Falas (23 px no celular, 27 no desktop), descrições, Cântico |
| Tempo e números | Oswald 500, algarismos tabulares | O Tempo, contagens, peso |
| Dado de sistema | IBM Plex Mono 500, 7.5–12 px, caixa alta espaçada | Kicker, códigos, `[Um Visitante apareceu]` |

Regras:
- Título-herói com sombra sólida deslocada (3–5 px) na cor de assinatura ou em `--ame-deep`, nunca com brilho difuso.
- Tipografia em diagonal (−6° a −14°) só em uma peça por tela. Na home não há tipografia em diagonal: a diagonal
  dela é o facho de luz do vitral.
- Nada de `mix-blend-mode: difference` em título (dava o "fi" esverdeado). Título sobre fundo misto leva cor sólida
  porcelana com sombra sólida ametista.
- Mono de rótulo tocável nunca abaixo de 10 px (kicker decorativo pode ir a 8,5 px); corpo nunca abaixo de 13,5 px.

---

## 5. Molduras, materiais e peças

| Peça | Como é | Onde |
|---|---|---|
| **Moldura relicário** | Filete duplo de aço (externo cheio, interno a 5 px, mais fraco), cantos cortados, estrela de 4 pontas em cada canto, crista em losango ametista no topo | Caixa de VN, ficha de andar, tarô, convocação, face da carta |
| **Placa diagonal** | Bloco inclinado (skew −12° a −14°) com texto reto e sombra sólida ametista | Nome do lugar, nome do NPC, abas, botão primário, escolhas |
| **Pílula do Tempo** | Cápsula de vidro escuro com mostrador vivo (céu noturno, numerais, ponteiro ametista) e dígitos de metal | Em toda tela, canto de cima à direita. Na home vira o relógio-herói |
| **Janela em arco** | Arco gótico de filete duplo atrás do retrato | VN: o retrato é maior que o arco e sai por cima |
| **Disco de app** | Medalhão de vidro ametista com aro champanhe duplo, reflexo em diagonal e emblema claro | Apps na órbita da home |
| **Emblemas** | Silhueta clara, agulhas em losango, simetria (família de `refs/ref-17/18`) | Todos os ícones (ver `kit2/src/pecas.js`) |
| **Gema facetada** | Losango em 5 facetas: ametista (próximo), champanhe (feito), cinza (trancado) | Nós de andar, raridade, crista |
| **Canhoto** | Recorte de papel porcelana com picote, à direita do cartão | Convocação do Deadly Vote, ingressos, recompensa |
| **Laje de mármore** | Placa branca enorme girada −16°, com borda ametista | Confidentes (contraste Persona) |

Materiais: mármore (texturas reais do projeto), veludo (gradiente com brilho de topo), vidro (desfoque + reflexo),
aço escovado (`--champ-grad`), papel porcelana. Um grão de pintura (`.grao`) cobre a tela inteira e costura a
interface com as pinturas; uma vinheta fecha as bordas.

**Dose:** um herói com volume, no máximo duas molduras relicário, uma diagonal forte. O resto é placa e filete.

---

## 6. Luz, partícula e profundidade

- **Toda tela tem uma fonte de luz que se explica:** o mostrador na home, a porta aberta na Casa, o óculo no alto da
  Torre, o holofote sobre a carta. A interface recebe essa luz (filete mais claro do lado dela, poeira no facho).
- **Partículas** (`poeira()`): pó dourado na luz quente, faíscas ametista no Sistema, safira na carta. 80–140 pontos
  por tela, concentrados no facho de luz, 1–3 px, as maiores com halo. Na tela real: deriva lenta, 8–20 s por ciclo.
- **Brilho:** nas peças 3D o bloom é feito com sprites aditivos (halo e estrela de 4 pontas) nos pontos de luz do
  metal e das gemas; funciona com canvas transparente e custa quase nada.
- **Camadas** em toda cena: fundo pintado, meio (objeto-herói), retrato/personagem, primeiro plano desfocado
  (cortina, vela), interface, grão e vinheta. Paralaxe por toque/inclinação: 0.1 / 0.25 / 0.4.
- **Recorte de luz nos personagens:** 1–2 px na cor da luz da cena (quente na Casa, ametista na Torre).

---

## 7. Movimento

Herdado de `IDENTIDADE.md` §7 (curvas e durações continuam), com o vocabulário Persona por cima:

| Momento | Movimento |
|---|---|
| Entrar numa tela do Sistema | A diagonal entra primeiro (faixa, laje), o herói gira de leve para a pose 3D (300 ms), placas entram em cascata de lado, nunca de baixo |
| Seleção numa lista | O item selecionado avança 12–18 px para a direita, ganha sombra sólida e um losango à esquerda (`.esc.on`) |
| Abas | O indicador é uma placa de metal que desliza e se inclina na direção do movimento |
| Cut-in | 1.2 s: tela escurece e tinge (80 ms), faixa rasgada corta na diagonal (180 ms), rosto desliza 40 px contra a faixa, nome em letras recortadas bate letra a letra (40 ms cada), frase entra por último; tudo sai na mesma direção |
| VN | Retrato respira (2 px, 4 s); troca de expressão com corte seco; a placa do nome balança 2° quando muda o falante |
| Relógio da home | Ponteiros reais, engrenagens ≥ 60 s por volta, inclinação acompanha o giroscópio (±4°) |
| Reduzir movimento | Sem paralaxe, sem cut-in animado (aparece parado por 900 ms), partículas paradas |

---

## 8. Elementos 2.5D/3D

O projeto já tem Three.js e React Three Fiber. Regra: **uma peça 3D por tela**, carregada depois da primeira pintura,
com uma versão estática (um render pré-calculado da mesma cena) para aparelho fraco, WebGL ausente ou movimento
reduzido. No kit2 as quatro peças abaixo **já são Three.js de verdade** (`kit2/src/cena3d.js`, r186 do
`node_modules`), renderizadas no próprio navegador: o código passa quase direto para R3F.

| Tela | Peça | No kit2 (`cena3d.js`) | No app |
|---|---|---|---|
| Home | Relógio com aro torneado (chanfro e frisos), mostrador pintado em canvas (céu, constelação do Record, numerais), ponteiros extrudados, janela do mecanismo, vidro abaulado com reflexo, engrenagens de latão e aço em três profundidades, pêndulo, órbita inclinada | `relogio()` | R3F; ponteiros reais, engrenagens girando (≥ 60 s por volta), inclinação pelo giroscópio |
| Deadly Vote | Tabuleiro de mármore (texturas do projeto) com moldura de aço, base de mármore negro, quatro espadas cravadas, rei branco de pé e rei negro caído, holofote com cone visível e luz rubi | `tabuleiro()` | R3F; câmera gira devagar ao arrastar |
| Mapa das Torres | Astrolábio: três anéis com marcas de grau, meridiano, núcleo ametista, torres pintadas (as artes atuais) em sprites sobre ilhas de pedra, campo de estrelas | `orbita()`, que devolve a posição de tela de cada torre para os rótulos em DOM | R3F; arrastar gira a órbita |
| Vitrine de cosméticos | Pedestal de mármore negro torneado com aros de aço e gemas, chão espelhado, cone de luz de vitrine | `pedestal()` | R3F; pedestal gira devagar |
| Torre por dentro | Pintura nova (escada em espiral vista de cima, óculo, lanterna) | pintura + nós em DOM; `escada()` fica como reserva 3D | pintura com paralaxe em 3 camadas |
| Ficha da carta | Carta com espessura, inclinada, brilho holográfico | CSS 3D | CSS 3D basta |
| Vista da Casa | Diorama redondo com os cômodos abertos (`refs/ref-13`) | — | R3F, depois do motor |

---

## 9. Celular: orçamento de tela (390×844)

| Faixa | Altura | Conteúdo |
|---|---|---|
| 0–44 | 44 | Área do aparelho. Nada do jogo |
| 50–110 | 60 | Topo: título ou lugar à esquerda, pílula do Tempo à direita. **Sem botão de voltar aqui** |
| 110–130 | 20 | Aviso de sistema (`[Um Visitante apareceu]`) quando houver |
| meio | livre | O herói (pintura, peça 3D ou retrato) |
| VN | 164 (fala) | 640–804. Placa do nome sobe 24 px por cima da caixa. Até 3 linhas de 22 px |
| Folha | 176 | 632–808. Sobe por arraste até meia tela; recolhida mostra só nome, resumo e o botão principal |
| Trilho do polegar | 52 | 752–804. Voltar à esquerda (48 px), ação principal à direita. Em toda tela do Sistema |
| Doca (home) | 92 | 716–808. Porta da Casa ao centro saindo da doca; Baú e Avisos foram para a doca |
| 808–844 | 36 | Área segura e indicador |

Regras do polegar: **voltar fica embaixo** (trilho) e também por deslize da borda esquerda; avançar a fala tocando em
qualquer ponto da caixa; andar tocando no chão; escolhas empilhadas com alvo ≥ 48 px; alvos de 44 px inteiros dentro
da tela, com 16 px de margem (nada de disco cortado na borda); ações frequentes (Baú, Avisos) na doca, não no topo.

**Lógica do Tempo (continua):** está em toda tela, na pílula; na home é parte do herói (a cartela pendurada no
relógio). Abaixo de 6 h a pílula e os dígitos passam para rubi e pulsam.

---

## 10. Casa e Torres (camada RPG Maker / VN)

Base técnica em `MOTOR-CASA-TORRES.md`. Aqui, o visual:

- **Exploração vem antes da VN** (`explorar.png`). Cômodo pintado com o chão em perspectiva; o avatar de pé no
  chão, com sombra e recorte de luz quente da porta (lado da porta) e ametista da janela (outro lado); objetos
  tocáveis com anel de luz e rótulo em placa (Estante, Porta, Sofá e o **cartão por baixo da porta**, que é o
  cartão de chamada); primeiro plano desfocado; facho da porta com poeira; alvo do toque no chão. Embaixo, Diário à
  esquerda e o celular à direita.
- **Visitante chegando:** `[Um Visitante apareceu]` (texto literal do dono), a porta acende, cut-in (§11), VN.
- **VN** (`casa.png`): o cômodo continua atrás, aproximado da porta e desfocado; faixa diagonal rasgada na cor de
  assinatura com meio-tom de tamanho crescente; janela em arco; o retrato é maior que tudo e sai por cima do arco,
  com recorte de luz quente; o ombro do avatar aparece desfocado no primeiro plano (enquadramento por cima do ombro).
- **Escolhas no desktop** (`desktop.png`): retrato à esquerda das escolhas; escolhas em placa relicário (filete duplo)
  em cascata com recuos diferentes, numeradas em losango; a escolhida avança, ganha ametista e sombra cobre.
- **Torres por dentro** (`torre.png`): pintura da escada em espiral vista de cima, óculo no alto com facho frio e
  poeira, lanterna quente no patamar atual. Nós de andar são emblemas em losango (família `refs/ref-17/18`):
  champanhe = feito, cobre aceso = atual, pedra = trancado. Avatar pequeno ao lado do nó atual. A ficha do andar é
  uma folha recolhida (176 px) que não tapa os andares de baixo.
- **Mapa das Torres** (`mapa.png`): astrolábio 3D com as torres em órbita (ref-22); a torre escolhida ganha fio de
  luz e a folha embaixo leva para dentro dela.

---

## 11. NPCs no estilo Persona

Fonte do elenco: `npcs/ELENCO.md`. **Arte nova do Galo** (gerada nesta revisão no pipeline de `infra/arte`, com a
expressão atual como referência de rosto e o figurino do ELENCO: casaco nos ombros com barra em penas, lenço-barbela,
forro cobre):

| Arquivo (`kit2/src/img/v2/`) | Origem | Uso |
|---|---|---|
| `galo-segredo.webp` | `arte-saida/v2-galo-expressoes` v03 | Confidentes; base do cut-in |
| `galo-riso.webp` | `arte-saida/v2-galo-expressoes-r2` v03 | Retrato da VN (Casa e desktop) |
| `galo-cutin.webp` | recorte de `galo-segredo` (sobrancelha ao lábio), 1500×520 | Cut-in, até o nativo 2048×640 sair |

O filtro do Workers AI recusou as 11 tentativas de **retrato em pose de meio corpo** e de **cut-in nativo** (duas
rodadas, com e sem gesto de apontar). As duas expressões que passaram já mostram o que a crítica pediu: traço
limpo, sombra em três tons, recorte de luz e expressão forte, sem sprite ampliado. Os outros seis NPCs continuam com
as expressões atuais nos medalhões (placeholder).

Depois desta revisão saiu uma rodada de 19 peças para o elenco inteiro (`arte/ESCOLHAS.md`). A crítica deu nota 4,5:
cenários, CG e mostrador estão no nível certo, os NPCs não (cel chapado de dois tons, três estilos misturados,
traços do dono perdidos). Nenhuma dessas 19 peças de NPC entra em tela. O alvo de estilo dos NPCs passa a ser o da
CG `v2-cg-melissa-encontro` e da arte atual: anime pintado, sombra suave com um recorte duro de luz (`npcs/ELENCO.md`
§8). Do Persona vêm a pose, a luz e o layout, não o traço.

**Cut-in** (`cutin.png` e os quadros `cutin-q1.png`, `cutin-q2.png`): rasgo de papel/pincel com textura (máscaras
PNG em `img/v2/rasgo-*.png`, borda irregular com fibras), não zigue-zague de CSS; meio-tom que cresce para a borda;
linhas de velocidade na diagonal; estilhaços; nome em letras recortadas grande e inclinado na metade de cima; faixa
de metal "ANFITRIÃO · IV · O IMPERADOR"; frase em placa porcelana com sombra cobre; o Arcano em numeral vazado no
canto. Sequência de 1,2 s em três quadros: (1) a faixa de assinatura corta a tela, (2) o rosto entra e o nome bate
letra a letra, (3) frase e Arcano. Diagonal sobe para aliados e desce para ambíguos (continua).

**Vínculos** (tela no padrão dos Confidentes do Persona; arquivo `confidentes.png`): título em cor sólida (sem `difference`); laje de mármore girada; o retrato sai
por cima da borda da laje com sombra sólida, sem corte em degradê; tarô do Arcano em 3D atrás. O NPC em foco vira um
**cartão grande inclinado** com o Arcano em numeral romano gigante no bloco cobre (o lugar do rank do P5R; o nível de
Afinidade fica nas barras, sem número). Os outros viram fichas verticais compactas com medalhão, nome e barra curta.

**Cartão de chamada:** aparece na Casa como objeto tocável (o cartão por baixo da porta). Texto de cada cartão é do
dono. *(Harmonização de 01/11.)* No jogo, esse cartão é o **cartão de visita** da `SPEC-VISITANTES.md` (V4): a visita
que o jogador perdeu deixa um cartão preto com o sigilo e a faixa na cor do NPC, preso na fresta da porta. "Cartão de
chamada" fica como nome da referência Persona e da tipografia recortada (§4).

**Interface que se move com o personagem:** placa do nome, faixa atrás do retrato, cartão do foco, fio da ficha e cut-in
mudam de cor com quem fala.

---

## 12. Cosméticos (refeitos)

> Assunto da `SPEC-COSMETICOS.md` (rodada 2), que manda quando houver diferença. Duas já valem: a Última Badalada em
> bronze e ouro (`img/v2/badalada.webp`) foi aposentada e refeita em cristal (`kit2/src/img/cos2/badalada-janela.webp`),
> porque pelo material ela se lia como Lendária; e a tela da peça no pedestal se chama **Vitrine** (a spec chamava de
> "Espelho"; esse nome fica só para o objeto do Quarto que abre a criação do avatar). Grade = **Coleção**.

Três telas novas no kit2, com os nomes, textos e raridades reais do catálogo (`scripts/cosmeticos-migration.sql`,
`lib/devo/cosmeticos.ts`: Comum, Incomum, Raro, Épico, Lendário, Arcano).

- **Vitrine** (`vitrine.png`): a moldura em 280 px flutua sobre um pedestal 3D de mármore negro com luz de vitrine,
  halo da raridade e a peça móvel indicada (o sino oscila). Embaixo: gema da raridade, origem, nome em Bodoni e a
  descrição literal do catálogo ("Um relógio que não pertence a este mundo. O pêndulo não para e o sino toca uma última
  vez."). Carrossel das outras molduras e Equipar no trilho.
- **Arte nova da Última Badalada** (`img/v2/badalada.webp`, `arte-saida/v2-cosmetico-badalada` v01): gaiola de
  filigrana champanhe e aço azulado, mostrador no alto, gemas ametista, fita de veludo e sino. É o nível mínimo de
  acabamento de uma moldura daqui em diante (`refs/ref-11`). Também está no perfil da home.
- **Coleção** (`inventario.png`): filtros em pílula, grade 3×3 com gema de raridade no canto, brilho de fundo na cor
  da raridade, borda iridescente animada no Arcano, selo "EM USO".
- **Item em duas etapas** (`refs/ref-19`): casulo fechado → asas abertas (`img/v2/casulo-1.webp`, `casulo-2.webp`,
  `arte-saida/v2-cosmetico-casulo` v01 e v04). O nome "Casulo do Crepúsculo" e a regra "abre no fim do evento" são
  proposta.
- Balões, emblemas e nome seguem a mesma linguagem; ficam para a próxima rodada de arte.
- Tudo desligável em Ajustes (animação leve), como já pede o texto do dono.

---

## 13. Kit2

`docs/redesign/v2/kit2/` — HTML/CSS/JS, as imagens do projeto (`kit2/src/img/`) e a arte nova (`kit2/src/img/v2/`).
A versão anterior (6 telas) está em `kit2/v1/`.

| Arquivo | O que prova |
|---|---|
| `home.png` | Vitral pintado com mostrador, relógio 3D com o Tempo pendurado numa cartela, quatro apps em discos dentro da margem, avatar pintado olhando o relógio, convocação com canhoto, doca com Baú/Avisos e a porta da Casa |
| `explorar.png` | Casa em exploração: cômodo pintado, avatar no chão, objetos tocáveis, cartão de chamada, facho da porta |
| `casa.png` | Casa em VN: Galo novo saindo do arco, faixa rasgada cobre, ombro do avatar, caixa relicário |
| `cutin.png`, `cutin-q1.png`, `cutin-q2.png` | Cut-in do Galo (quadro final e os dois anteriores) |
| `confidentes.png` | Confidentes com cartão de foco e numeral gigante |
| `mapa.png` | Mapa das Torres em astrolábio 3D |
| `torre.png` | Torre do Imperador por dentro, pintura nova e folha recolhida |
| `dv.png` | Deadly Vote: tabuleiro de mármore 3D com espadas, bilhete de convocação, mão com peso das cartas |
| `poco.png` | Poço: cena pintada, letreiro dos últimos prêmios, Lançar Moeda / Girar Manivela / Inspecionar Balde |
| `vitrine.png`, `inventario.png` | Cosméticos (§12) |
| `carta.png` | Ficha do Rei do Xadrez com Rito e Cântico |
| `desktop.png` | 1440×900: celular vivo à esquerda (a home com o relógio 3D) e a Casa com escolhas à direita |
| `kit2-celular.png` | As doze telas lado a lado |

As telas saem **limpas**: nenhuma etiqueta tracejada. Valores de exemplo aparecem em texto neutro e estão listados em
§14. Para ver com as etiquetas: `celular.html?notas`.

Texto nas telas: falas do Galo, `[Um Visitante apareceu]`, as quatro respostas, o poema de *Inúteis*, as regras de
linhas (Comum = 1, Rara = 2), os rótulos do Poço e os nomes e descrições dos cosméticos são literais (do dono ou do
catálogo).

Renderizar (servidor na raiz do repositório, porque as peças 3D importam `node_modules/three`):
```
python3 -m http.server 8767        # na raiz do repo
cd docs/redesign/v2/kit2/src
node render.cjs                    # todas as telas, quadros do cut-in, desktop e prancha
node render.cjs home dv            # só algumas
# no navegador: http://127.0.0.1:8767/docs/redesign/v2/kit2/src/celular.html?tela=home
```

---

## 14. Pendências e limites conhecidos

- **Arte que ainda falta:** retrato do Galo em pose de meio corpo e cut-in nativo 2048×640 (o filtro recusou 11
  tentativas; próximo passo: outro modelo do pipeline ou o dono aprovar uma pose diferente); arte nova dos outros seis
  NPCs (a rodada de 19 peças de `arte/ESCOLHAS.md` foi reprovada na crítica, nota 4,5, e será refeita no estilo
  pintado); avatar de capa é provisório (o editor de avatar está em `SPEC-AVATAR.md`).
- **Valores de exemplo nas telas** (não são decisão): "Helena Varga", DV-0518, data e inscritos da convocação,
  jogadores na mesa, "7 / 12" no peso das cartas (o limite é configurável e o dono não fixou), quantidades de
  Essência e de Dracma, nomes no letreiro do Poço, nível das barras de Afinidade e Romance, "Título do andar",
  andar atual IV, o nome "Casulo do Crepúsculo" e a fala do guia ("Sobe logo, xuxu.").
- **Do dono:** roda de cores do elenco, Arcanos dos NPCs (só o Galo definido), frase oficial de cada cut-in (a do
  kit é fala literal do Galo, usada como exemplo), nomes dos Gestos, Cântico da Coleção Xadrez e das outras, linhas
  por raridade além de Comum e Rara, níveis de Taças, custos das Torres, valores de Afinidade e Romance, texto dos
  cartões de chamada, regra dos cosméticos em duas etapas.
- **Comparação lado a lado com P5R/P3R/HSR/Reverse: 1999:** não feita. Os sites de captura e de imagem que
  teriam essas telas não abrem nesta sessão; a comparação usou as refs do dono (01–22).
- **Telas ainda sem kit:** Mesa, Salão das Máscaras, Companhias, Arcanos e Record. Seguem o mesmo vocabulário (pintura
  ou peça 3D como herói, trilho do polegar, folha).
- **Limites do render:** o kit pinta o 3D em SwiftShader; no aparelho, R3F com o mesmo material fica mais nítido.
  O bloom é por sprite aditivo, não por pós-processamento.

---

## 15. Decisões de revisão (01/11, sobre a crítica do kit2 nota 5,5)

| Crítica | Decisão |
|---|---|
| Só a interface foi redesenhada; a arte era toda a de antes | 9 peças de arte novas no pipeline (`arte-saida/v2-*`): Galo em duas expressões, avatar de capa (costas e três quartos), sala da Casa para exploração, escada da Torre, vitral da home, moldura Última Badalada, casulo e asas. As artes antigas ficaram só onde ainda não há substituto (tarô, cartas, torres do mapa, poço, outros NPCs) |
| Mesmo sprite do Galo em todas as telas, ampliado e borrado | Saiu o sprite. VN e desktop usam `galo-riso`, Confidentes usa `galo-segredo`, cut-in usa recorte dessa arte nova em alta. Pose de meio corpo e cut-in nativo ficaram pendentes por recusa do filtro (§14) |
| Avatar como silhueta chapada | Avatar pintado de capa, com sombra no chão e recorte de luz das duas fontes do cômodo; aparece na home, na Casa, na Torre, no perfil e na vitrine |
| Casa não é RPG Maker | Nova tela `explorar.png` antes da VN (chão, objetos tocáveis, cartão de chamada, primeiro plano, facho) |
| Torre em vetor cinza | Escada pintada com óculo e lanterna; nós viraram emblemas em losango com brilho; ficha virou folha recolhida |
| Nada era 3D de verdade | Relógio, tabuleiro, astrolábio e pedestal em Three.js (§8) |
| Cosméticos sem tela | Vitrine, coleção e item em duas etapas (§12) |
| Cobertura insuficiente | De 6 para 12 telas de celular, mais desktop: entraram Exploração, Mapa, Deadly Vote, Poço, Vitrine e Coleção |
| Home: disco cortado, rótulos colidindo, duas diagonais, dois heróis, ícones sem rótulo, sem personagem | Discos dentro da margem com rótulo de 10,5 px; data reta no topo; a única diagonal é o facho do vitral; Tempo pendurado no relógio (um herói só); Baú e Avisos com rótulo na doca; avatar pintado e vitral pintado |
| Confidentes: "fi" verde, status sumindo, retrato cortado, lista de cartões | Título em cor sólida; topo fica sobre mármore negro; retrato sai da laje; cartão de foco grande com numeral e fichas compactas |
| Cut-in com cara de CSS e metade de cima vazia | Máscaras de rasgo com textura, meio-tom com gradiente, linhas de velocidade, nome grande em cima, três quadros |
| Carta: elipse de infográfico, "RARA" gigante, caixas de formulário | Saíram a elipse e o "RARA"; entrou holofote; as caixas viraram pedras com relevo; o rodapé foi para o trilho |
| Desktop: painel laranja chapado, escolhas comuns, centro vazio | Faixa rasgada com meio-tom no lugar do painel; cômodo visível no centro; escolhas relicário em cascata; retrato à esquerda das escolhas; ombro do avatar no primeiro plano |
| Pouca luz e partícula | Toda tela tem fonte de luz evidente e 80–140 partículas; recorte de luz nos personagens; brilhos aditivos no metal |
| Polegar | Trilho embaixo com voltar em toda tela do Sistema; folha recolhida; alvos inteiros; mono tocável ≥ 10 px |
| Etiquetas de placeholder com cara de wireframe | Telas limpas; pendências listadas em §14; versão anotada em `?notas` |
| Comparação lado a lado | Não feita (§14) |
